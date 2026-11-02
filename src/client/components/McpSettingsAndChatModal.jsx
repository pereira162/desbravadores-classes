import React, { useState, useEffect } from 'react';
import {
  Bot,
  Key,
  Send,
  X,
  Plus,
  Trash2,
  Copy,
  Check,
  Sparkles,
  FileDown,
  Eye,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import { apiRequest, getAssetUrl } from '../api';
import { useModalDismiss } from '../utils/modalStack';

const QUICK_PROMPTS = [
  'Resumo do Clube',
  'Oportunidades de unificação pendentes',
  'Sincronizar unificações pendentes',
  'Gerar PDF Controle do Instrutor da classe Amigo',
  'Gerar PDF do Planejamento Anual',
  'Listar desbravadores da classe Amigo',
];

const TOOL_CATEGORY_OPTIONS = [
  { id: 'get_club_summary', label: 'Resumo do Clube (Leitura)', category: 'LEITURA' },
  { id: 'list_pathfinders', label: 'Listar Desbravadores & Progresso', category: 'LEITURA' },
  { id: 'get_pdf_link', label: 'Gerar/Obter Links de PDFs em Cache', category: 'PDF' },
  { id: 'update_requirement_progress', label: 'Aprovar/Atualizar Requisitos Individuais', category: 'PROGRESSO' },
  { id: 'bulk_approve_requirements', label: 'Aprovar Requisitos em Lote', category: 'PROGRESSO' },
  { id: 'get_unification_opportunities', label: 'Ver Alertas de Unificação', category: 'PLANEJAMENTO' },
  { id: 'apply_unification_sync', label: 'Sincronizar Unificações Equivalentes', category: 'PLANEJAMENTO' },
  { id: 'update_equivalence_group', label: 'Criar/Editar Regras de Unificação', category: 'PLANEJAMENTO' },
  { id: 'create_pathfinder', label: 'Cadastrar Desbravadores', category: 'CADASTRO' },
  { id: 'update_pathfinder', label: 'Editar Desbravadores', category: 'CADASTRO' },
  { id: 'list_events', label: 'Listar Eventos', category: 'EVENTOS' },
  { id: 'create_event', label: 'Criar Eventos', category: 'EVENTOS' },
  { id: 'execute_event', label: 'Concluir Evento e Aprovar Participantes', category: 'EVENTOS' },
];

export default function McpSettingsAndChatModal({ isOpen, onClose, user, leaders = [], onRefresh }) {
  const [activeTab, setActiveTab] = useState('chat');
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      reply:
        'Olá! Sou o **Assistente IA & MCP do SGC Classes**. Como Diretor/Gestor, você pode me pedir relatórios, aprovar ou sincronizar unificações entre classes, cadastrar dados ou gerar links diretos para qualquer PDF (inclusive separado por instrutor).',
      pdfAction: null,
    },
  ]);
  const [inputPrompt, setInputPrompt] = useState('');
  const [sending, setSending] = useState(false);

  // Keys state
  const [keys, setKeys] = useState([]);
  const [loadingKeys, setLoadingKeys] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(user?.id || '');
  const [keyName, setKeyName] = useState('');
  const [fullAccessTools, setFullAccessTools] = useState(true);
  const [selectedTools, setSelectedTools] = useState(TOOL_CATEGORY_OPTIONS.map((t) => t.id));
  const [newlyCreatedKey, setNewlyCreatedKey] = useState(null);
  const [copiedText, setCopiedText] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (user?.id && !selectedUserId) setSelectedUserId(user.id);
      loadMcpKeys();
    }
  }, [isOpen, user?.id]);

  const loadMcpKeys = async () => {
    setLoadingKeys(true);
    try {
      const res = await apiRequest('/api/mcp/keys');
      setKeys(res.keys || []);
    } catch (err) {
      console.warn('Erro ao carregar chaves MCP:', err.message);
    } finally {
      setLoadingKeys(false);
    }
  };

  // Registro na pilha hierárquica global (ESC e Voltar Mobile)
  useModalDismiss(isOpen, onClose, 'ModalMcpChat');


  if (!isOpen) return null;

  const handleSendPrompt = async (promptText) => {
    const clean = (promptText ?? inputPrompt).trim();
    if (!clean || sending) return;

    const userMsg = { id: `u-${Date.now()}`, role: 'user', reply: clean };
    setMessages((prev) => [...prev, userMsg]);
    if (!promptText) setInputPrompt('');
    setSending(true);

    try {
      const res = await apiRequest('/api/mcp/chat', {
        method: 'POST',
        body: JSON.stringify({ message: clean }),
      });

      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: 'assistant',
          reply: res.reply || 'Comando processado com sucesso.',
          pdfAction: res.pdfAction || null,
          data: res.data || null,
        },
      ]);

      if (clean.toLowerCase().includes('sincronizar') && onRefresh) {
        onRefresh();
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'assistant',
          reply: `⚠️ Não foi possível processar o comando: ${err.message}`,
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  const handleCreateKey = async (e) => {
    e.preventDefault();
    try {
      const allowed_tools = fullAccessTools ? ['*'] : selectedTools;
      const res = await apiRequest('/api/mcp/keys', {
        method: 'POST',
        body: JSON.stringify({
          user_id: selectedUserId || user.id,
          name: keyName.trim() || undefined,
          allowed_tools,
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

  const toggleToolSelection = (toolId) => {
    setSelectedTools((prev) =>
      prev.includes(toolId) ? prev.filter((id) => id !== toolId) : [...prev, toolId]
    );
  };

  const handleCopy = (text, label) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(''), 2000);
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-sm p-3 sm:p-6 animate-fade-in"
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black shadow">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold tracking-tight flex items-center gap-2">
                Central IA & Servidor MCP • Diretoria
                <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30">
                  Exclusivo Diretor / Gestor
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Execute ações inteligentes via chat ou gere chaves MCP com permissões granulares para qualquer membro da diretoria
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sub-navigation */}
        <div className="px-6 pt-3 bg-slate-100 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('chat')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'chat'
                ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 border-amber-500'
                : 'text-slate-600 dark:text-slate-400 border-transparent hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            Assistente IA Integrado
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('keys')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'keys'
                ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 border-amber-500'
                : 'text-slate-600 dark:text-slate-400 border-transparent hover:text-slate-900'
            }`}
          >
            <Key className="w-4 h-4" />
            Chaves de Servidor MCP ({keys.filter((k) => k.active).length})
          </button>
        </div>

        {/* Content */}
        {activeTab === 'chat' ? (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Quick Prompts */}
            <div className="px-5 py-3 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2 overflow-x-auto">
              <span className="text-[11px] font-bold text-slate-500 uppercase shrink-0">Sugestões:</span>
              {QUICK_PROMPTS.map((qp) => (
                <button
                  key={qp}
                  type="button"
                  onClick={() => handleSendPrompt(qp)}
                  className="px-2.5 py-1 rounded-full text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-amber-500 hover:text-amber-600 whitespace-nowrap transition-colors cursor-pointer"
                >
                  {qp}
                </button>
              ))}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-2xl rounded-2xl px-4 py-3 text-xs sm:text-sm space-y-2 ${
                      m.role === 'user'
                        ? 'bg-slate-900 text-white dark:bg-amber-500 dark:text-slate-950 font-medium'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <div className="whitespace-pre-line leading-relaxed">{m.reply}</div>

                    {m.pdfAction && (
                      <div className="pt-2 flex flex-wrap items-center gap-2 border-t border-slate-200 dark:border-slate-700">
                        <a
                          href={getAssetUrl(m.pdfAction.viewUrl)}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 border border-slate-300 dark:border-slate-600 hover:bg-slate-50"
                        >
                          <Eye className="w-3.5 h-3.5 text-amber-500" />
                          Visualizar PDF no Navegador
                        </a>
                        <a
                          href={getAssetUrl(m.pdfAction.downloadUrl)}
                          download={m.pdfAction.filename}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-600 text-slate-950"
                        >
                          <FileDown className="w-3.5 h-3.5" />
                          Baixar PDF ({m.pdfAction.filename})
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {sending && (
                <div className="flex justify-start">
                  <div className="rounded-2xl px-4 py-2.5 text-xs bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center gap-2">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-500" />
                    Consultando ferramentas MCP do clube...
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendPrompt();
              }}
              className="p-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2"
            >
              <input
                type="text"
                value={inputPrompt}
                onChange={(e) => setInputPrompt(e.target.value)}
                placeholder="Ex: Gerar PDF controle do instrutor da classe Amigo ou Sincronizar unificações..."
                className="flex-1 px-4 py-2.5 rounded-xl text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              <button
                type="submit"
                disabled={sending || !inputPrompt.trim()}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 transition-colors cursor-pointer"
              >
                <Send className="w-4 h-4" />
                Enviar
              </button>
            </form>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Newly Created Key Banner */}
            {newlyCreatedKey && (
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border-2 border-emerald-500/60 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-extrabold text-emerald-900 dark:text-emerald-300 flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-600" />
                    Chave MCP Gerada para {newlyCreatedKey.user_name}! Copie agora:
                  </h4>
                  <button
                    type="button"
                    onClick={() => setNewlyCreatedKey(null)}
                    className="text-xs text-slate-500 hover:text-slate-800 cursor-pointer"
                  >
                    Fechar aviso
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <code className="flex-1 px-3 py-2 rounded-lg bg-slate-900 text-emerald-400 font-mono text-xs select-all">
                    {newlyCreatedKey.api_key}
                  </code>
                  <button
                    type="button"
                    onClick={() => handleCopy(newlyCreatedKey.api_key, 'key')}
                    className="px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    {copiedText === 'key' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {copiedText === 'key' ? 'Copiada!' : 'Copiar Chave'}
                  </button>
                </div>
              </div>
            )}

            {/* Form to create key for any leader */}
            <form
              onSubmit={handleCreateKey}
              className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-4"
            >
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                Gerar Nova Chave MCP para Membro da Diretoria
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Membro da Diretoria Vinculado
                  </label>
                  <select
                    value={selectedUserId}
                    onChange={(e) => setSelectedUserId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
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
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Identificação da Chave (Opcional)
                  </label>
                  <input
                    type="text"
                    value={keyName}
                    onChange={(e) => setKeyName(e.target.value)}
                    placeholder="Ex: Claude Desktop do Instrutor Marcos"
                    className="w-full px-3 py-2 rounded-xl text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Permissões de Ferramentas da IA para esta Chave:
                  </label>
                  <label className="inline-flex items-center gap-2 text-xs font-semibold text-amber-700 dark:text-amber-400 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={fullAccessTools}
                      onChange={(e) => setFullAccessTools(e.target.checked)}
                      className="rounded text-amber-500"
                    />
                    Liberar todas as ferramentas permitidas ao cargo (*)
                  </label>
                </div>

                {!fullAccessTools && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                    {TOOL_CATEGORY_OPTIONS.map((t) => (
                      <label
                        key={t.id}
                        className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedTools.includes(t.id)}
                          onChange={() => toggleToolSelection(t.id)}
                          className="rounded text-amber-500"
                        />
                        <span className="font-medium text-slate-700 dark:text-slate-200">{t.label}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-sm cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  Gerar Chave de Acesso MCP
                </button>
              </div>
            </form>

            {/* List of Existing Keys */}
            <div className="space-y-3">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                Chaves MCP Ativas do Clube
              </h4>
              {loadingKeys ? (
                <p className="text-xs text-slate-500">Carregando chaves...</p>
              ) : keys.length === 0 ? (
                <p className="text-xs text-slate-500 italic">
                  Nenhuma chave MCP criada ainda. Gere uma chave acima para conectar agentes externos.
                </p>
              ) : (
                <div className="divide-y divide-slate-200 dark:divide-slate-700 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                  {keys.map((k) => (
                    <div
                      key={k.id}
                      className="p-3.5 bg-white dark:bg-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 dark:text-white">{k.name}</span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                            {k.user_name} ({k.user_role})
                          </span>
                          {!k.active && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700">
                              Revogada
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5 font-mono">
                          Prefixo: {k.api_key_prefix} • Ferramentas:{' '}
                          {Array.isArray(k.allowed_tools) && k.allowed_tools.includes('*')
                            ? 'Todas (*)'
                            : (k.allowed_tools || []).length}
                        </p>
                      </div>
                      {k.active && (
                        <button
                          type="button"
                          onClick={() => handleRevokeKey(k.id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer self-end sm:self-center"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Revogar
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
