/**
 * Gateway MCP Universal do SGC Classes • Desbravadores
 * Implementa integralmente a arquitetura e checklist da skill `mcp-universal-builder`:
 *
 * 1. Transportes simultâneos:
 *    - Streamable HTTP (`POST /mcp`, `HEAD /mcp`, `GET /mcp`, `DELETE /mcp`)
 *    - SSE (`GET /sse` ou `GET /mcp` com `Accept: text/event-stream` / `?sse=1` + `POST /messages`)
 *    - Suporte a subcaminho (`X-Forwarded-Prefix`, `/desbravadores-classes/mcp`, `/api/mcp/rpc`)
 *
 * 2. Modos de Autenticação Híbrida:
 *    - Modo A (Direto / Sem OAuth): quando `MCP_REQUIRE_AUTH=false` (padrão), permite conexão direta sem chave
 *      (assumindo o perfil Diretor/Gestor padrão do clube), ou usa a chave se informada.
 *    - Modo B (Chave na URL ou Header): `?key=sgc_mcp_...`, `Authorization: Bearer sgc_mcp_...`,
 *      `X-MCP-API-Key: sgc_mcp_...` ou `MCP_TOKEN` (`oracle-gemini-mcp-2026`).
 *    - Modo C (OAuth 2.0 Completo — RFC 8414 + RFC 9728 + PKCE S256/plain + Dynamic Client Registration):
 *      compatível com Google Gemini (App/Web), Claude (Web/Desktop) e ChatGPT (Connectors/Actions).
 */
const crypto = require('node:crypto');
const express = require('express');
const { db } = require('./db');
const { hashMcpApiKey, handleMcpJsonRpcRequest, MCP_TOOLS } = require('./mcpHandler');

const SERVER_NAME = 'sgc-desbravadores-mcp';
const REQUIRE_AUTH = String(process.env.MCP_REQUIRE_AUTH || 'false').toLowerCase() === 'true';
const STATIC_TOKEN = process.env.MCP_TOKEN || 'oracle-gemini-mcp-2026';
const CLIENT_ID = process.env.MCP_CLIENT_ID || 'gemini';
const CLIENT_SECRET = process.env.MCP_CLIENT_SECRET || 'oracle-gemini-mcp-2026';

const sseSessions = new Map(); // sid -> { res, auth, test }
const oauthCodes = new Map(); // code -> { key, challenge, method, expires }
const issuedTokens = new Map(); // token -> { key, createdAt }

function cors(req, res, next) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, HEAD, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');
  res.setHeader('Access-Control-Expose-Headers', '*');
  if (req.method === 'OPTIONS') return res.status(204).end();
  next();
}

function publicBase(req) {
  const proto = (req.headers['x-forwarded-proto'] || req.protocol || 'https').split(',')[0].trim();
  const host = req.headers['x-forwarded-host'] || req.headers.host || 'localhost:3333';
  let prefix = (req.headers['x-forwarded-prefix'] || '').replace(/\/$/, '');
  if (!prefix && req.originalUrl?.startsWith('/desbravadores-classes')) {
    prefix = '/desbravadores-classes';
  }
  return { origin: `${proto}://${host}`, prefix, url: `${proto}://${host}${prefix}` };
}

function extractToken(req) {
  const h = req.headers.authorization || '';
  if (h.startsWith('Bearer ')) return h.slice(7).trim();
  return (
    req.headers['x-mcp-api-key'] ||
    req.query?.key ||
    req.query?.token ||
    req.query?.api_key ||
    null
  );
}

function getDefaultDirectorUser(deps) {
  const uRow =
    db
      .prepare("SELECT * FROM users WHERE role IN ('DIRETOR', 'GESTOR', 'ADMIN') AND active = 1 ORDER BY is_demo ASC LIMIT 1")
      .get() ||
    db.prepare('SELECT * FROM users WHERE active = 1 LIMIT 1').get();
  if (uRow) return deps.formatUser(uRow);
  return {
    id: 'mcp-director',
    name: 'Diretor (MCP)',
    email: 'diretor@clube.org',
    role: 'DIRETOR',
    permissions: {},
    active: true,
  };
}

/**
 * Resolve o contexto de autenticação MCP:
 * - Se houver chave `sgc_mcp_*` válida (ou token OAuth vinculado a ela), aplica o usuário e `allowed_tools` da chave.
 * - Se houver `STATIC_TOKEN`, `CLIENT_SECRET` ou token OAuth padrão (`mcp_*`), usa o Diretor padrão.
 * - Se `REQUIRE_AUTH === false` e nenhuma chave foi enviada, autoriza com o Diretor padrão (Modo A).
 */
function resolveAuth(req, deps) {
  let raw = extractToken(req);

  if (raw && issuedTokens.has(raw)) {
    const tokenMeta = issuedTokens.get(raw);
    if (tokenMeta?.key) {
      raw = tokenMeta.key;
    } else {
      return { user: getDefaultDirectorUser(deps), allowedTools: ['*'] };
    }
  }

  if (raw && String(raw).startsWith('sgc_mcp_')) {
    const row = db
      .prepare('SELECT * FROM mcp_api_keys WHERE api_key_hash = ? AND active = 1')
      .get(hashMcpApiKey(raw));
    if (!row) return null;
    const uRow = db.prepare('SELECT * FROM users WHERE id = ? AND active = 1').get(row.user_id);
    if (!uRow) return null;
    db.prepare('UPDATE mcp_api_keys SET last_used_at = ? WHERE id = ?').run(new Date().toISOString(), row.id);
    return {
      user: deps.formatUser(uRow),
      allowedTools: JSON.parse(row.allowed_tools_json || '["*"]'),
    };
  }

  if (raw && (raw === STATIC_TOKEN || raw === CLIENT_SECRET || String(raw).startsWith('mcp_'))) {
    return { user: getDefaultDirectorUser(deps), allowedTools: ['*'] };
  }

  if (!REQUIRE_AUTH && !raw) {
    return { user: getDefaultDirectorUser(deps), allowedTools: ['*'] };
  }

  return null;
}

function unauthorized(req, res, id = null, headOnly = false) {
  const { url } = publicBase(req);
  const resMeta = `${url}/.well-known/oauth-protected-resource`;
  res.setHeader(
    'WWW-Authenticate',
    `Bearer realm="mcp", resource_metadata="${resMeta}", authorization_uri="${url}/oauth/authorize"`
  );
  res.setHeader('Link', `<${resMeta}>; rel="oauth-protected-resource"`);
  if (headOnly) return res.status(401).end();
  return res.status(401).json({
    jsonrpc: '2.0',
    id,
    error: {
      code: -32001,
      message: 'Autenticação MCP necessária: use Bearer <chave sgc_mcp_...>, ?key= ou OAuth 2.0.',
    },
  });
}

function pkceOk(verifier, challenge, method = 'S256') {
  if (!challenge || !verifier) return true;
  if (method === 'plain') return verifier === challenge;
  const calc = crypto.createHash('sha256').update(String(verifier)).digest('base64url');
  return calc === challenge;
}

async function runRpc(body, auth, req) {
  const { url } = publicBase(req);
  const ctx = { user: auth.user, allowedTools: auth.allowedTools, baseUrl: url };
  if (Array.isArray(body)) {
    const out = [];
    for (const m of body) {
      const r = await handleMcpJsonRpcRequest(m, ctx, db);
      if (r !== null && r !== undefined) out.push(r);
    }
    return out.length ? out : null;
  }
  return handleMcpJsonRpcRequest(body, ctx, db);
}

function createMcpRouter(deps) {
  const router = express.Router();
  router.use(cors);

  const MCP_PATHS = ['/mcp', '/mcp/', '/api/mcp/rpc', '/desbravadores-classes/mcp', '/desbravadores-classes/api/mcp/rpc'];
  const SSE_PATHS = ['/sse', '/sse/', '/api/mcp/sse', '/desbravadores-classes/sse', '/desbravadores-classes/api/mcp/sse'];
  const MSG_PATHS = [
    '/messages',
    '/message',
    '/api/mcp/messages',
    '/desbravadores-classes/messages',
    '/desbravadores-classes/message',
    '/desbravadores-classes/api/mcp/messages',
  ];

  // ── Probes HEAD /mcp e encerramento de sessão DELETE /mcp ─────────
  router.head(MCP_PATHS, (req, res) => {
    const auth = resolveAuth(req, deps);
    if (!auth) return unauthorized(req, res, null, true);
    res.status(200).end();
  });

  router.delete(MCP_PATHS, (_req, res) => res.status(200).end());

  // ── Abertura de stream SSE ────────────────────────────────────────
  const openSse = (req, res) => {
    const auth = resolveAuth(req, deps);
    if (!auth) return unauthorized(req, res);
    const sid = crypto.randomBytes(16).toString('hex');
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    });
    sseSessions.set(sid, { res, auth });
    const { prefix } = publicBase(req);
    const useApiPrefix = req.path.includes('/api/mcp');
    const msgPath = useApiPrefix ? '/api/mcp/messages' : '/messages';
    const extraQs = [];
    if (req.query?.teste === '1') extraQs.push('teste=1');
    if (req.query?.key) extraQs.push(`key=${encodeURIComponent(req.query.key)}`);
    const suffix = extraQs.length ? `&${extraQs.join('&')}` : '';
    res.write(`event: endpoint\ndata: ${prefix}${msgPath}?session=${sid}${suffix}\n\n`);
    const ping = setInterval(() => {
      try {
        res.write(': ping\n\n');
      } catch {}
    }, 15000);
    req.on('close', () => {
      clearInterval(ping);
      sseSessions.delete(sid);
    });
  };

  // ── GET /mcp (probe JSON ou stream SSE) e GET /sse ────────────────
  router.get(MCP_PATHS, (req, res) => {
    const wantsSse =
      String(req.headers.accept || '').includes('text/event-stream') || req.query?.sse === '1';
    if (wantsSse) return openSse(req, res);
    const auth = resolveAuth(req, deps);
    if (!auth) return unauthorized(req, res);
    res.status(200).json({ status: 'ok', mcp: SERVER_NAME, version: '3.0.0', tools: MCP_TOOLS.length });
  });

  router.get(SSE_PATHS, openSse);

  // ── POST /mcp (Streamable HTTP) ───────────────────────────────────
  router.post(MCP_PATHS, async (req, res) => {
    const body = req.body || {};
    const sid = req.query?.session || req.query?.sessionId;
    if (sid && sseSessions.has(String(sid))) {
      const session = sseSessions.get(String(sid));
      const out = await runRpc(body, session.auth, req);
      if (out !== null) session.res.write(`event: message\ndata: ${JSON.stringify(out)}\n\n`);
      return res.status(202).json({ status: 'accepted' });
    }

    const auth = resolveAuth(req, deps);
    if (!auth) return unauthorized(req, res, body.id ?? null);
    try {
      const out = await runRpc(body, auth, req);
      if (out === null) return res.status(204).end();
      res.status(200).json(out);
    } catch (err) {
      res.status(500).json({
        jsonrpc: '2.0',
        id: body.id ?? null,
        error: { code: -32603, message: err.message },
      });
    }
  });

  // ── POST /messages (SSE) ──────────────────────────────────────────
  router.post(MSG_PATHS, async (req, res) => {
    const sid = String(req.query?.session || req.query?.sessionId || '');
    const session = sseSessions.get(sid);
    const auth = session?.auth || resolveAuth(req, deps);
    if (!auth) return unauthorized(req, res, req.body?.id ?? null);
    try {
      const out = await runRpc(req.body || {}, auth, req);
      if (out !== null && session) {
        session.res.write(`event: message\ndata: ${JSON.stringify(out)}\n\n`);
      } else if (out !== null) {
        return res.status(200).json(out);
      }
      res.status(202).json({ status: 'accepted' });
    } catch (err) {
      res.status(500).json({
        jsonrpc: '2.0',
        id: req.body?.id ?? null,
        error: { code: -32603, message: err.message },
      });
    }
  });

  router.get(['/mcp/health', '/desbravadores-classes/mcp/health'], (_req, res) =>
    res.json({ status: 'ok', service: SERVER_NAME, mcp: SERVER_NAME, tools: MCP_TOOLS.length })
  );

  // ── Descoberta OAuth 2.0 (RFC 8414 & RFC 9728) ────────────────────
  router.get(
    [
      '/.well-known/oauth-protected-resource*',
      '/desbravadores-classes/.well-known/oauth-protected-resource*',
    ],
    (req, res) => {
      const { url } = publicBase(req);
      res.json({
        resource: `${url}/mcp`,
        authorization_servers: [url],
        bearer_methods_supported: ['header'],
      });
    }
  );

  router.get(
    [
      '/.well-known/oauth-authorization-server*',
      '/.well-known/openid-configuration*',
      '/desbravadores-classes/.well-known/oauth-authorization-server*',
      '/desbravadores-classes/.well-known/openid-configuration*',
    ],
    (req, res) => {
      const { url } = publicBase(req);
      res.json({
        issuer: url,
        authorization_endpoint: `${url}/oauth/authorize`,
        token_endpoint: `${url}/oauth/token`,
        registration_endpoint: `${url}/oauth/register`,
        response_types_supported: ['code'],
        grant_types_supported: ['authorization_code', 'refresh_token'],
        token_endpoint_auth_methods_supported: ['client_secret_post', 'client_secret_basic', 'none'],
        code_challenge_methods_supported: ['S256', 'plain'],
      });
    }
  );

  router.post(['/oauth/register', '/desbravadores-classes/oauth/register'], (req, res) => {
    const b = req.body || {};
    res.status(201).json({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      redirect_uris: b.redirect_uris || [],
      grant_types: ['authorization_code', 'refresh_token'],
      response_types: ['code'],
      token_endpoint_auth_method: 'client_secret_post',
    });
  });

  // Auto-aprovação OAuth (padrão bridge_server.py) ou vínculo opcional com chave sgc_mcp_*
  const handleAuthorize = (req, res) => {
    const params = { ...(req.query || {}), ...(req.body || {}) };
    const redirectUri = params.redirect_uri || '';
    const state = params.state || '';
    const key = params.mcp_key || params.key || null;

    if (!redirectUri) {
      return res.status(400).json({ error: 'invalid_request', error_description: 'redirect_uri ausente' });
    }

    const code = crypto.randomBytes(24).toString('hex');
    oauthCodes.set(code, {
      key,
      challenge: params.code_challenge || '',
      method: params.code_challenge_method || 'S256',
      expires: Date.now() + 5 * 60 * 1000,
    });

    const sep = redirectUri.includes('?') ? '&' : '?';
    const qs = new URLSearchParams({ code, ...(state ? { state } : {}) }).toString();
    res.redirect(302, `${redirectUri}${sep}${qs}`);
  };

  router.get(['/oauth/authorize', '/desbravadores-classes/oauth/authorize'], handleAuthorize);
  router.post(
    ['/oauth/authorize', '/desbravadores-classes/oauth/authorize'],
    express.urlencoded({ extended: false }),
    handleAuthorize
  );

  router.post(
    ['/oauth/token', '/desbravadores-classes/oauth/token'],
    express.urlencoded({ extended: false }),
    (req, res) => {
      const b = { ...(req.body || {}) };

      // Extrai client_secret do body ou do header Authorization: Basic base64(client_id:client_secret)
      let reqClientSecret = b.client_secret || '';
      const authH = req.headers.authorization || '';
      if (!reqClientSecret && authH.startsWith('Basic ')) {
        try {
          const decoded = Buffer.from(authH.slice(6), 'base64').toString('utf8');
          const colonIdx = decoded.indexOf(':');
          if (colonIdx !== -1) reqClientSecret = decoded.slice(colonIdx + 1);
        } catch {}
      }

      if (b.grant_type === 'refresh_token' && b.refresh_token) {
        return res.json({
          access_token: b.refresh_token,
          token_type: 'Bearer',
          refresh_token: b.refresh_token,
          expires_in: 31536000,
          scope: 'mcp',
        });
      }

      const code = b.code || '';
      const info = oauthCodes.get(code);
      oauthCodes.delete(code);
      if (info && !pkceOk(b.code_verifier || '', info.challenge, info.method)) {
        return res.status(400).json({ error: 'invalid_grant', error_description: 'PKCE verification failed' });
      }

      // Se o usuário preencheu a chave sgc_mcp_... como Chave secreta do cliente no Gemini, vincula ao líder da chave!
      const boundKey =
        info?.key ||
        (reqClientSecret && String(reqClientSecret).startsWith('sgc_mcp_') ? reqClientSecret : null) ||
        (req.query?.key && String(req.query.key).startsWith('sgc_mcp_') ? req.query.key : null);

      const tok = boundKey || `mcp_${crypto.randomBytes(24).toString('hex')}`;
      issuedTokens.set(tok, { key: boundKey || null, createdAt: Date.now() });
      res.status(200).json({
        access_token: tok,
        token_type: 'Bearer',
        refresh_token: tok,
        expires_in: 31536000,
        scope: 'mcp',
      });
    }
  );

  return router;
}

module.exports = { createMcpRouter };
