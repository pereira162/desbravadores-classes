import React, { useState, useEffect, useMemo } from 'react';
import { Plug, Key, X, Plus, Trash2, Copy, Check, ShieldCheck, Wrench } from 'lucide-react';
import { apiRequest, API_BASE_URL, isTestMode } from '../api';
import { useModalDismiss } from '../utils/modalStack';

const CATEGORY_LABELS = {
  LEITURA: 'Leitura & Consultas',
  CADASTRO: 'Cadastro de Desbravadores',
  PROGRESSO: 'Progresso & Assinaturas',
  PLANEJAMENTO: 'Planejamento & Unificações',
  EVENTOS: 'Eventos & Atividades em Lote',
  UNIDADES: 'Gestão de Unidades',
  LIDERANCA: 'Liderança & Permissões',
  CONFIGURACAO: 'Configurações do Clube',
  AUDITORIA: 'Auditoria & Feedback',
  BACKUP: 'Backups & Snapshots SQLite',
  PDF: 'Geração de PDFs Oficiais',
};

function CopyField({ label, value }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="space-y-1">
      {label && (
        <div className="text-[11px] font-semibold text-neutral-500 dark:text-neutral-400">
          {label}
        </div>
      )}
      <div className="flex items-center gap-2">
        <code className="flex-1 px-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-900 text-xs font-mono text-neutral-800 dark:text-neutral-200 break-all select-all border border-black/5 dark:border-white/10">
          {value}
        </code>
        <button
          type="button"
          onClick={() => {
            navigator.clipboard.writeText(value);
            setCopied(true);
            setTimeout(() => setCopied(false), 1800);
          }}
          className="apple-press px-3 py-2 rounded-full bg-[#0071e3] hover:bg-[#0077ed] text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer shrink-0"
        >
          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? 'Copiado' : 'Copiar'}
        </button>
      </div>
    </div>
  );
}

export default function McpSettingsModal({ isOpen, onClose, user, leaders = [] }) {
  const [activeTab, setActiveTab] = useState('connect');
  const [keys, setKeys] = useState([]);
  const [tools, setTools] = useState([]);
  const [loadingKeys, setLoadingKeys] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(user?.id || '');
  const [keyName, setKeyName] = useState('');
  const [fullAccessTools, setFullAccessTools] = useState(true);
  const [selectedTools, setSelectedTools] = useState([]);
  const [newlyCreatedKey, setNewlyCreatedKey] = useState(null);

  useModalDismiss(isOpen, onClose, 'ModalMcp');

  const loadMcpKeys = async () => {
    setLoadingKeys(true);
    try {
      const res = await apiRequest('/api/mcp/keys');
      setKeys(res.keys || []);
      let loadedTools = res.tools || [];
      if (!loadedTools.length) {
        try {
          const r = await fetch(`${API_BASE_URL}/api/mcp/tools`);
          if (r.ok) {
            const tj = await r.json();
            loadedTools = tj.tools || [];
          }
        } catch {}
      }
      setTools(loadedTools);
      setSelectedTools((prev) => (prev.length ? prev : loadedTools.map((t) => t.name)));
    } catch (err) {
      console.warn('Erro ao carregar chaves MCP:', err.message);
    } finally {
      setLoadingKeys(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      if (user?.id && !selectedUserId) setSelectedUserId(user.id);
      loadMcpKeys();
    }
  }, [isOpen, user?.id]);

  const toolsByCategory = useMemo(() => {
    const map = {};
    for (const t of tools) (map[t.category || 'OUTROS'] ||= []).push(t);
    return map;
  }, [tools]);

  if (!isOpen) return null;

  const base = `${window.location.origin}`;
  const testQs = isTestMode() ? '?teste=1' : '';
  const mcpUrl = `${base}/mcp${testQs}`;
  const sseUrl = `${base}/sse${testQs}`;
  const keyParamJoin = testQs ? '&' : '?';

  const handleCreateKey = async (e) => {
    e.preventDefault();
    try {
      const res = await apiRequest('/api/mcp/keys', {
        method: 'POST',
        body: JSON.stringify({
          user_id: selectedUserId || user.id,
          name: keyName.trim() || undefined,
          allowed_tools: fullAccessTools ? ['*'] : selectedTools,
        }),
      });
      setNewlyCreatedKey(res);
      setKeyName('');
      await loadMcpKeys();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleRevokeKey = async (id) => {
    try {
      await apiRequest(`/api/mcp/keys/${id}`, { method: 'DELETE' });
      await loadMcpKeys();
    } catch (err) {
      alert(err.message);
    }
  };

  const toggleTool = (name) =>
    setSelectedTools((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]
    );

  const tabBtn = (id, Icon, label) => (
    <button
      type="button"
      onClick={() => setActiveTab(id)}
      className={`apple-press flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold transition cursor-pointer ${
        activeTab === id
          ? 'bg-white dark:bg-[#2c2c2e] text-neutral-900 dark:text-white shadow-xs'
          : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
      }`}
    >
      <Icon className="w-3.5 h-3.5 text-[#0071e3]" />
      {label}
    </button>
  );

  return (
    <div
      onClick={(e) => e.target === e.currentTarget && onClose()}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md p-3 sm:p-6 animate-fade-in"
    >
      <div className="bg-white/95 dark:bg-[#1c1c1e]/95 backdrop-blur-2xl border border-black/[0.08] dark:border-white/[0.12] rounded-3xl shadow-2xl w-full max-w-3xl max-h-[88vh] flex flex-col overflow-hidden">
        <div className="px-6 py-4 border-b border-black/[0.06] dark:border-white/[0.08] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-[#0071e3]/10 text-[#0071e3] flex items-center justify-center border border-[#0071e3]/20">
              <Plug className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-neutral-900 dark:text-white">
                Servidor MCP Universal • SGC Classes
              </h2>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                Conecte Gemini, Claude, ChatGPT ou IDEs locais para operar o sistema ({tools.length}{' '}
                ferramentas ativas)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-500 flex items-center justify-center cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 py-2.5 border-b border-black/[0.06] dark:border-white/[0.08]">
          <div className="inline-flex p-1 bg-black/5 dark:bg-white/10 rounded-full gap-1">
            {tabBtn('connect', Plug, 'Conexão Universal')}
            {tabBtn('keys', Key, `Chaves MCP (${keys.filter((k) => k.active).length})`)}
            {tabBtn('tools', Wrench, `Ferramentas (${tools.length})`)}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {activeTab === 'connect' && (
            <>
              <CopyField
                label="Endpoint Streamable HTTP (Gemini, Claude, ChatGPT)"
                value={mcpUrl}
              />
              <CopyField
                label="Endpoint SSE Alternativo"
                value={sseUrl}
              />
              <CopyField
                label="URL com Chave MCP embutida (Modo Token)"
                value={`${mcpUrl}${keyParamJoin}key=SUA_CHAVE_sgc_mcp`}
              />

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-900 border border-black/5 dark:border-white/10 space-y-1">
                  <div className="text-xs font-bold text-neutral-900 dark:text-white">
                    Modo A — Direto
                  </div>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-relaxed">
                    No Gemini/Claude/ChatGPT, cole a URL <code>/mcp</code> acima e deixe ID/Segredo em branco.
                  </p>
                </div>
                <div className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-900 border border-black/5 dark:border-white/10 space-y-1">
                  <div className="text-xs font-bold text-neutral-900 dark:text-white">
                    Modo B — Chave MCP
                  </div>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-relaxed">
                    Gere uma chave <code>sgc_mcp_...</code> na aba <b>Chaves MCP</b> para vincular permissões por líder.
                  </p>
                </div>
                <div className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-900 border border-black/5 dark:border-white/10 space-y-1">
                  <div className="text-xs font-bold text-neutral-900 dark:text-white">
                    Modo C — OAuth 2.0 + PKCE
                  </div>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-relaxed">
                    Client ID: <code>gemini</code> • Secret: <code>oracle-gemini-mcp-2026</code> (ou registro dinâmico).
                  </p>
                </div>
              </div>

              <CopyField
                label="Configuração JSON (Claude Desktop / Cursor / Antigravity — mcp_config.json)"
                value={JSON.stringify(
                  {
                    mcpServers: {
                      'sgc-desbravadores': {
                        command: 'npx',
                        args: [
                          '-y',
                          'mcp-remote',
                          mcpUrl,
                          '--header',
                          'Authorization: Bearer <SUA_CHAVE_sgc_mcp>',
                        ],
                      },
                    },
                  },
                  null,
                  2
                )}
              />
            </>
          )}

          {activeTab === 'keys' && (
            <>
              {newlyCreatedKey && (
                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4" />
                      Chave gerada para {newlyCreatedKey.user_name}. Copie agora:
                    </h4>
                    <button
                      type="button"
                      onClick={() => setNewlyCreatedKey(null)}
                      className="text-xs text-neutral-500 cursor-pointer"
                    >
                      Fechar aviso
                    </button>
                  </div>
                  <CopyField label="" value={newlyCreatedKey.api_key} />
                </div>
              )}

              <form
                onSubmit={handleCreateKey}
                className="p-5 rounded-2xl bg-neutral-50 dark:bg-neutral-900 border border-black/5 dark:border-white/10 space-y-4"
              >
                <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                  Gerar nova chave MCP
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-neutral-500 mb-1">
                      Membro da diretoria vinculado
                    </label>
                    <select
                      value={selectedUserId}
                      onChange={(e) => setSelectedUserId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl text-xs border border-neutral-200 dark:border-white/10 bg-white dark:bg-[#1c1c1e] text-neutral-900 dark:text-white"
                    >
                      {(leaders || [])
                        .filter((l) => l.role !== 'DESBRAVADOR')
                        .map((l) => (
                          <option key={l.id} value={l.id}>
                            {l.name} ({l.custom_role_title || l.role})
                          </option>
                        ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-neutral-500 mb-1">
                      Identificação (opcional)
                    </label>
                    <input
                      type="text"
                      value={keyName}
                      onChange={(e) => setKeyName(e.target.value)}
                      placeholder="Ex: Gemini / Claude do Diretor"
                      className="w-full px-3.5 py-2 rounded-xl text-xs border border-neutral-200 dark:border-white/10 bg-white dark:bg-[#1c1c1e] text-neutral-900 dark:text-white"
                    />
                  </div>
                </div>

                <label className="inline-flex items-center gap-2 text-xs font-semibold text-[#0071e3] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={fullAccessTools}
                    onChange={(e) => setFullAccessTools(e.target.checked)}
                    className="rounded"
                  />
                  Liberar todas as {tools.length} ferramentas permitidas ao cargo (*)
                </label>

                {!fullAccessTools && (
                  <div className="space-y-3">
                    {Object.entries(toolsByCategory).map(([cat, list]) => (
                      <div key={cat}>
                        <div className="text-[10px] font-bold uppercase text-neutral-400 mb-1">
                          {CATEGORY_LABELS[cat] || cat}
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                          {list.map((t) => (
                            <label
                              key={t.name}
                              className="flex items-center gap-2 p-2 rounded-xl border border-black/5 dark:border-white/10 bg-white dark:bg-[#1c1c1e] text-[11px] cursor-pointer"
                            >
                              <input
                                type="checkbox"
                                checked={selectedTools.includes(t.name)}
                                onChange={() => toggleTool(t.name)}
                                className="rounded"
                              />
                              <span className="font-mono text-neutral-700 dark:text-neutral-200">
                                {t.name}
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="apple-press inline-flex items-center gap-1.5 px-5 py-2 rounded-full text-xs font-semibold bg-[#0071e3] hover:bg-[#0077ed] text-white cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    Gerar chave MCP
                  </button>
                </div>
              </form>

              <div className="space-y-2">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">
                  Chaves ativas do clube
                </h4>
                {loadingKeys ? (
                  <p className="text-xs text-neutral-500">Carregando...</p>
                ) : keys.length === 0 ? (
                  <p className="text-xs text-neutral-500 italic">Nenhuma chave criada ainda.</p>
                ) : (
                  <div className="divide-y divide-black/5 dark:divide-white/5 rounded-2xl border border-black/5 dark:border-white/10 overflow-hidden">
                    {keys.map((k) => (
                      <div
                        key={k.id}
                        className="p-4 flex items-center justify-between gap-2 text-xs"
                      >
                        <div>
                          <div className="font-bold text-neutral-900 dark:text-white">
                            {k.name}{' '}
                            <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300">
                              {k.user_name} ({k.user_role})
                            </span>
                          </div>
                          <p className="text-[11px] text-neutral-500 mt-1 font-mono">
                            {k.api_key_prefix} •{' '}
                            {Array.isArray(k.allowed_tools) && k.allowed_tools.includes('*')
                              ? `Todas as ferramentas (${tools.length})`
                              : `${(k.allowed_tools || []).length} ferramentas`}
                            {k.last_used_at
                              ? ` • último uso ${new Date(k.last_used_at).toLocaleString('pt-BR')}`
                              : ''}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRevokeKey(k.id)}
                          className="apple-press inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold text-rose-600 hover:bg-rose-500/10 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Revogar
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {activeTab === 'tools' && (
            <div className="space-y-3">
              {Object.entries(toolsByCategory).map(([cat, list]) => (
                <div
                  key={cat}
                  className="rounded-2xl border border-black/5 dark:border-white/10 overflow-hidden"
                >
                  <div className="px-4 py-2.5 bg-neutral-50 dark:bg-neutral-900 text-xs font-bold text-neutral-900 dark:text-white flex items-center justify-between">
                    <span>{CATEGORY_LABELS[cat] || cat}</span>
                    <span className="text-[11px] text-neutral-500 font-semibold">
                      {list.length} ferramenta(s)
                    </span>
                  </div>
                  <div className="divide-y divide-black/5 dark:divide-white/5">
                    {list.map((t) => (
                      <div key={t.name} className="px-4 py-2.5 text-xs space-y-0.5">
                        <div className="font-mono font-bold text-[#0071e3]">{t.name}</div>
                        <div className="text-neutral-600 dark:text-neutral-400">
                          {t.description}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
