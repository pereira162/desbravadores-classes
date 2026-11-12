import React, { useState, useMemo } from 'react';
import {
  History,
  RotateCcw,
  Search,
  Filter,
  ShieldAlert,
  CheckCircle2,
  Code2,
  ChevronDown,
  ChevronUp,
  Layers,
} from 'lucide-react';
import { ROLE_CONFIG, formatDateTimeBR } from '../constants';

const ACTION_BADGES = {
  STATUS_CHANGE: { label: 'Atualização de Requisito', badge: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20' },
  PROGRESS_UPDATE: { label: 'Atualização de Requisito', badge: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20' },
  BULK_PROGRESS_UPDATE: { label: 'Assinatura em Lote', badge: 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/20' },
  BULK_EVENT_APPROVE: { label: 'Lote de Evento', badge: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20' },
  EVENT_CREATE: { label: 'Planejamento de Evento', badge: 'bg-lime-500/10 text-lime-700 dark:text-lime-300 border-lime-500/20' },
  REVERT_ACTION: { label: 'Reversão de Auditoria', badge: 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20' },
  PATHFINDER_CREATE: { label: 'Novo Desbravador', badge: 'bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/20' },
  PATHFINDER_UPDATE: { label: 'Edição de Desbravador', badge: 'bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/20' },
  UNIT_CREATE: { label: 'Nova Unidade', badge: 'bg-teal-500/10 text-teal-700 dark:text-teal-300 border-teal-500/20' },
  UNIT_UPDATE: { label: 'Edição de Unidade', badge: 'bg-teal-500/10 text-teal-700 dark:text-teal-300 border-teal-500/20' },
  UNIT_DELETE: { label: 'Exclusão de Unidade', badge: 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20' },
  PATHFINDER_INVITE: { label: 'Convite de Desbravador', badge: 'bg-teal-500/10 text-teal-700 dark:text-teal-300 border-teal-500/20' },
  LEADER_CREATE: { label: 'Novo Líder', badge: 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20' },
  USER_PERMISSION_CHANGE: { label: 'Permissões de Líder', badge: 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20' },
  SETTINGS_UPDATE: { label: 'Configurações do Clube', badge: 'bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/20' },
};

export default function AuditLogsView({
  auditLogs,
  leaders,
  currentUser,
  onRevertLog,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [leaderFilter, setLeaderFilter] = useState('ALL');
  const [actionFilter, setActionFilter] = useState('ALL');
  const [expandedLogIds, setExpandedLogIds] = useState({});
  const [revertingId, setRevertingId] = useState(null);

  const canRevert = ['ADMIN', 'GESTOR', 'DIRETOR'].includes(currentUser?.role);

  const filteredLogs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return (auditLogs || []).filter((log) => {
      if (leaderFilter !== 'ALL' && log.user_id !== leaderFilter) return false;
      if (actionFilter !== 'ALL' && log.action !== actionFilter) return false;
      if (q) {
        const hay = `${log.summary || ''} ${log.description || ''} ${log.user_name} ${log.entity_id || ''} ${log.batch_id || ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [auditLogs, leaderFilter, actionFilter, searchQuery]);

  // Conta quantos registros pertencem ao mesmo batch_id
  const batchCounts = useMemo(() => {
    const map = {};
    for (const log of auditLogs || []) {
      if (log.batch_id) {
        map[log.batch_id] = (map[log.batch_id] || 0) + 1;
      }
    }
    return map;
  }, [auditLogs]);

  const toggleExpand = (id) => {
    setExpandedLogIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleRevertClick = async (log, revertBatch = false) => {
    if (!canRevert || log.reverted) return;
    setRevertingId(log.id);
    try {
      await onRevertLog(log.id, revertBatch);
    } finally {
      setRevertingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho Apple Console Style */}
      <div className="bg-white dark:bg-[#1c1c1e] rounded-3xl border border-black/[0.06] dark:border-white/[0.08] p-6 sm:p-7 shadow-[0_4px_24px_rgba(0,0,0,0.04)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <History className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            Trilha de Auditoria & Reversão
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed max-w-2xl">
            Todas as assinaturas individuais ou em lote registram o líder autor, cargo, data/hora e o estado anterior exato (JSON) para permitir reversão segura pela Diretoria.
          </p>
        </div>

        <div className="px-4 py-2 rounded-full bg-slate-100 dark:bg-[#252528] border border-black/[0.04] dark:border-white/[0.06] text-xs font-semibold text-slate-700 dark:text-slate-300 shrink-0">
          {filteredLogs.length} eventos registrados
        </div>
      </div>

      {/* Filtros de Auditoria */}
      <div className="bg-white dark:bg-[#1c1c1e] rounded-2xl border border-black/[0.06] dark:border-white/[0.08] p-3.5 sm:p-4 shadow-xs flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Pesquisar por desbravador, requisito, líder ou lote..."
            className="w-full pl-9 pr-4 py-2 rounded-full border border-black/[0.08] dark:border-white/[0.12] bg-slate-50 dark:bg-[#252528] text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
          />
        </div>

        <select
          value={leaderFilter}
          onChange={(e) => setLeaderFilter(e.target.value)}
          className="px-3.5 py-2 rounded-full border border-black/[0.08] dark:border-white/[0.12] bg-slate-50 dark:bg-[#252528] text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
        >
          <option value="ALL">Todos os Líderes</option>
          {leaders.map((l) => (
            <option key={l.id} value={l.id}>
              {l.name} ({l.role})
            </option>
          ))}
        </select>

        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="px-3.5 py-2 rounded-full border border-black/[0.08] dark:border-white/[0.12] bg-slate-50 dark:bg-[#252528] text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
        >
          <option value="ALL">Todos os Tipos de Ação</option>
          {Object.entries(ACTION_BADGES).map(([code, cfg]) => (
            <option key={code} value={code}>
              {cfg.label}
            </option>
          ))}
        </select>
      </div>

      {/* Lista Cronológica de Logs */}
      <div className="bg-white dark:bg-[#1c1c1e] rounded-3xl border border-black/[0.06] dark:border-white/[0.08] shadow-xs divide-y divide-black/[0.04] dark:divide-white/[0.04] overflow-hidden">
        {filteredLogs.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500 dark:text-slate-400">
            Nenhum registro de auditoria encontrado para os filtros aplicados.
          </div>
        ) : (
          filteredLogs.map((log) => {
            const actCfg = ACTION_BADGES[log.action] || {
              label: log.action,
              badge: 'bg-slate-100 text-slate-700 border-slate-200',
            };
            const roleCfg = ROLE_CONFIG[log.user_role] || ROLE_CONFIG.INSTRUTOR;
            const isExpanded = Boolean(expandedLogIds[log.id]);
            const isProgressLog =
              (log.entity_type === 'PROGRESS_RECORD' ||
                log.entity_type === 'pathfinder_progress') &&
              !log.reverted;
            const batchSize = log.batch_id ? batchCounts[log.batch_id] || 1 : 1;

            return (
              <div
                key={log.id}
                className={`p-4 sm:p-5 transition-all ${
                  log.reverted ? 'bg-slate-50/50 dark:bg-[#151516]/50 opacity-60' : 'hover:bg-slate-50/60 dark:hover:bg-[#252528]/50'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${actCfg.badge}`}
                      >
                        {actCfg.label}
                      </span>
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        {log.user_name}
                      </span>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${roleCfg.badgeClass}`}
                      >
                        {log.user_role}
                      </span>
                      <span className="text-xs text-slate-400">
                        • {formatDateTimeBR(log.created_at)}
                      </span>
                      {log.batch_id && (
                        <span className="text-[10px] font-mono bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-md border border-indigo-500/20">
                          Lote: {log.batch_id.slice(0, 14)} ({batchSize} itens)
                        </span>
                      )}
                      {Boolean(log.reverted) && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                          REVERTIDO
                        </span>
                      )}
                    </div>

                    <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 font-medium leading-relaxed">
                      {log.summary || log.description}
                    </p>
                  </div>

                  {/* Ações: Ver Diff JSON e Reverter */}
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    {(log.previous_state || log.new_state) && (
                      <button
                        onClick={() => toggleExpand(log.id)}
                        className="px-3 py-1.5 rounded-full border border-black/[0.08] dark:border-white/[0.12] hover:bg-slate-100 dark:hover:bg-[#2c2c2e] text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all"
                      >
                        <Code2 className="w-3.5 h-3.5 text-slate-400" />
                        Estado JSON
                        {isExpanded ? (
                          <ChevronUp className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5" />
                        )}
                      </button>
                    )}

                    {canRevert && isProgressLog && (
                      <>
                        <button
                          onClick={() => handleRevertClick(log, false)}
                          disabled={revertingId === log.id}
                          className="px-3.5 py-1.5 rounded-full border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-1 cursor-pointer active:scale-95 transition-all"
                          title="Desfaz esta alteração restaurando o status anterior exato do requisito"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          {revertingId === log.id ? 'Revertendo...' : 'Reverter Item'}
                        </button>

                        {log.batch_id && batchSize > 1 && (
                          <button
                            onClick={() => handleRevertClick(log, true)}
                            disabled={revertingId === log.id}
                            className="px-3.5 py-1.5 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold flex items-center gap-1 cursor-pointer shadow-xs active:scale-95 transition-all"
                            title="Desfaz todos os itens assinados juntos neste mesmo lote"
                          >
                            <Layers className="w-3.5 h-3.5" />
                            Reverter Lote ({batchSize})
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* Painel Expansível com o Diff JSON (Apple Xcode Console Style) */}
                {isExpanded && (
                  <div className="mt-3.5 grid grid-cols-1 sm:grid-cols-2 gap-3 bg-[#121214] text-slate-100 p-4 rounded-2xl text-[11px] font-mono overflow-x-auto border border-white/[0.08] shadow-inner">
                    <div>
                      <div className="text-rose-400 font-bold mb-1 uppercase tracking-wider text-[10px]">
                        Estado Anterior (previous_state):
                      </div>
                      <pre className="whitespace-pre-wrap text-slate-400">
                        {log.previous_state
                          ? JSON.stringify(log.previous_state, null, 2)
                          : 'null (Sem registro anterior / PENDENTE)'}
                      </pre>
                    </div>
                    <div>
                      <div className="text-emerald-400 font-bold mb-1 uppercase tracking-wider text-[10px]">
                        Novo Estado Aplicado (new_state):
                      </div>
                      <pre className="whitespace-pre-wrap text-slate-300">
                        {log.new_state
                          ? JSON.stringify(log.new_state, null, 2)
                          : 'null'}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
