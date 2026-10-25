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
  STATUS_CHANGE: { label: 'Atualização de Requisito', badge: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  PROGRESS_UPDATE: { label: 'Atualização de Requisito', badge: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  BULK_PROGRESS_UPDATE: { label: 'Assinatura em Lote', badge: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
  BULK_EVENT_APPROVE: { label: 'Lote de Evento / Acampamento', badge: 'bg-amber-100 text-amber-900 border-amber-200' },
  EVENT_CREATE: { label: 'Planejamento de Evento', badge: 'bg-lime-100 text-lime-800 border-lime-200' },
  REVERT_ACTION: { label: 'Reversão de Auditoria', badge: 'bg-rose-100 text-rose-800 border-rose-200' },
  PATHFINDER_CREATE: { label: 'Novo Desbravador', badge: 'bg-sky-100 text-sky-800 border-sky-200' },
  PATHFINDER_UPDATE: { label: 'Edição de Desbravador', badge: 'bg-sky-100 text-sky-800 border-sky-200' },
  UNIT_CREATE: { label: 'Nova Unidade', badge: 'bg-teal-100 text-teal-800 border-teal-200' },
  UNIT_UPDATE: { label: 'Edição de Unidade', badge: 'bg-teal-100 text-teal-800 border-teal-200' },
  UNIT_DELETE: { label: 'Exclusão de Unidade', badge: 'bg-rose-100 text-rose-800 border-rose-200' },
  PATHFINDER_INVITE: { label: 'Convite de Desbravador', badge: 'bg-teal-100 text-teal-800 border-teal-200' },
  LEADER_CREATE: { label: 'Novo Líder', badge: 'bg-purple-100 text-purple-800 border-purple-200' },
  USER_PERMISSION_CHANGE: { label: 'Permissões de Líder', badge: 'bg-purple-100 text-purple-800 border-purple-200' },
  SETTINGS_UPDATE: { label: 'Configurações do Clube', badge: 'bg-slate-200 text-slate-800 border-slate-300' },
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
    <div className="space-y-5">
      {/* Cabeçalho */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <History className="w-6 h-6 text-indigo-600" />
            Trilha de Auditoria Imutável & Reversão de Alterações
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Todas as assinaturas individuais ou em lote registram o líder autor, cargo, data/hora e o estado anterior exato (JSON) para permitir reversão segura pela Diretoria.
          </p>
        </div>

        <div className="px-3.5 py-2 rounded-xl bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700 shrink-0">
          {filteredLogs.length} eventos registrados
        </div>
      </div>

      {/* Filtros de Auditoria */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Pesquisar por desbravador, requisito, líder ou lote..."
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <select
          value={leaderFilter}
          onChange={(e) => setLeaderFilter(e.target.value)}
          className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-700"
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
          className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-700"
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
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs divide-y divide-slate-100 overflow-hidden">
        {filteredLogs.length === 0 ? (
          <div className="p-10 text-center text-sm text-slate-500">
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
                className={`p-4 transition ${
                  log.reverted ? 'bg-slate-50/70 opacity-75' : 'hover:bg-slate-50/50'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${actCfg.badge}`}
                      >
                        {actCfg.label}
                      </span>
                      <span className="text-xs font-extrabold text-slate-900">
                        {log.user_name}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded border ${roleCfg.badgeClass}`}
                      >
                        {log.user_role}
                      </span>
                      <span className="text-xs text-slate-400">
                        • {formatDateTimeBR(log.created_at)}
                      </span>
                      {log.batch_id && (
                        <span className="text-[10px] font-mono bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded border border-indigo-200">
                          Lote: {log.batch_id.slice(0, 14)} ({batchSize} itens)
                        </span>
                      )}
                      {Boolean(log.reverted) && (
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-300">
                          REVERTIDO
                        </span>
                      )}
                    </div>

                    <p className="text-xs sm:text-sm text-slate-800 font-medium">
                      {log.summary || log.description}
                    </p>
                  </div>

                  {/* Ações: Ver Diff JSON e Reverter */}
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    {(log.previous_state || log.new_state) && (
                      <button
                        onClick={() => toggleExpand(log.id)}
                        className="px-2.5 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-xs font-bold text-slate-700 flex items-center gap-1 cursor-pointer"
                      >
                        <Code2 className="w-3.5 h-3.5 text-slate-500" />
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
                          className="px-3 py-1.5 rounded-xl border border-rose-300 bg-rose-50 hover:bg-rose-100 text-rose-800 text-xs font-bold flex items-center gap-1 cursor-pointer"
                          title="Desfaz esta alteração restaurando o status anterior exato do requisito"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          {revertingId === log.id ? 'Revertendo...' : 'Reverter Item'}
                        </button>

                        {log.batch_id && batchSize > 1 && (
                          <button
                            onClick={() => handleRevertClick(log, true)}
                            disabled={revertingId === log.id}
                            className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
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

                {/* Painel Expansível com o Diff JSON (Antes vs Depois) */}
                {isExpanded && (
                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-900 text-slate-100 p-3.5 rounded-xl text-[11px] font-mono overflow-x-auto">
                    <div>
                      <div className="text-rose-400 font-bold mb-1 uppercase">
                        Estado Anterior (previous_state):
                      </div>
                      <pre className="whitespace-pre-wrap text-slate-300">
                        {log.previous_state
                          ? JSON.stringify(log.previous_state, null, 2)
                          : 'null (Sem registro anterior / PENDENTE)'}
                      </pre>
                    </div>
                    <div>
                      <div className="text-emerald-400 font-bold mb-1 uppercase">
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
