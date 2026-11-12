#!/usr/bin/env node
/**
 * Camada Core JSON-RPC + Stdio para o SGC Classes • Desbravadores
 * (Seguindo a Regra de Ouro da skill `mcp-universal-builder`).
 *
 * - Nunca escreve logs no `stdout` (redireciona `console.log` para `stderr`).
 * - Ignora resposta em `stdout` para notificações JSON-RPC (`id == null`).
 * - Opera localmente no SQLite ou remotamente via HTTP (`/mcp`) se `SGC_API_URL` for definido.
 */
console.log = (...args) => console.error(...args);

const readline = require('node:readline');
const { prodDb, testDb, initDatabase } = require('../server/db');
const {
  handleMcpJsonRpcRequest,
  hashMcpApiKey,
} = require('../server/mcpHandler');

const SGC_API_URL = process.env.SGC_API_URL || '';
const SGC_MCP_API_KEY = process.env.SGC_MCP_API_KEY || '';
const USE_TEST_DB = process.env.SGC_TEST_MODE === '1' || process.env.SGC_TEST_MODE === 'true';

let localInitialized = false;
function ensureLocalDb() {
  if (!localInitialized) {
    initDatabase();
    localInitialized = true;
  }
  return USE_TEST_DB ? testDb : prodDb;
}

function resolveLocalAuthContext(targetDb) {
  if (SGC_MCP_API_KEY) {
    const keyHash = hashMcpApiKey(SGC_MCP_API_KEY);
    const keyRow = targetDb
      .prepare('SELECT * FROM mcp_api_keys WHERE api_key_hash = ? AND active = 1')
      .get(keyHash);
    if (keyRow) {
      const user = targetDb.prepare('SELECT * FROM users WHERE id = ?').get(keyRow.user_id);
      if (user) {
        return {
          user,
          allowedTools: JSON.parse(keyRow.allowed_tools_json || '["*"]'),
          baseUrl: SGC_API_URL || 'https://137.131.209.239.nip.io',
        };
      }
    }
  }

  const director =
    targetDb
      .prepare("SELECT * FROM users WHERE role IN ('DIRETOR', 'GESTOR', 'ADMIN') AND active = 1 LIMIT 1")
      .get() || {
      id: 'mcp-system-director',
      name: 'Agente IA (MCP Diretor)',
      role: 'DIRETOR',
      active: 1,
    };

  return {
    user: director,
    allowedTools: ['*'],
    baseUrl: SGC_API_URL || 'https://137.131.209.239.nip.io',
  };
}

async function processLine(line) {
  const trimmed = line.trim();
  if (!trimmed) return;

  let rpcRequest;
  try {
    rpcRequest = JSON.parse(trimmed);
  } catch {
    return;
  }

  if (SGC_API_URL && SGC_API_URL.startsWith('http')) {
    try {
      const endpoint = `${SGC_API_URL.replace(/\/$/, '')}/mcp`;
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(SGC_MCP_API_KEY ? { Authorization: `Bearer ${SGC_MCP_API_KEY}`, 'X-MCP-API-Key': SGC_MCP_API_KEY } : {}),
          ...(USE_TEST_DB ? { 'X-Test-Mode': 'true' } : {}),
        },
        body: JSON.stringify(rpcRequest),
      });
      if (res.status === 204 || rpcRequest.id === undefined || rpcRequest.id === null) {
        return;
      }
      const json = await res.json();
      if (json !== null && json !== undefined) {
        process.stdout.write(`${JSON.stringify(json)}\n`);
      }
      return;
    } catch (err) {
      if (rpcRequest.id === undefined || rpcRequest.id === null) return;
      const errResp = {
        jsonrpc: '2.0',
        id: rpcRequest.id,
        error: { code: -32000, message: `Falha na conexão MCP remota: ${err.message}` },
      };
      process.stdout.write(`${JSON.stringify(errResp)}\n`);
      return;
    }
  }

  const targetDb = ensureLocalDb();
  const authContext = resolveLocalAuthContext(targetDb);
  const response = await handleMcpJsonRpcRequest(rpcRequest, authContext, targetDb);
  if (response !== null && response !== undefined && rpcRequest.id !== undefined && rpcRequest.id !== null) {
    process.stdout.write(`${JSON.stringify(response)}\n`);
  }
}

const rl = readline.createInterface({
  input: process.stdin,
  terminal: false,
});

rl.on('line', (line) => {
  processLine(line).catch((err) => {
    process.stderr.write(`[MCP Stdio Error] ${err.message}\n`);
  });
});
