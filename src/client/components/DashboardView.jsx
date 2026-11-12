import React, { useMemo, useState } from 'react';
import {
  Users,
  Award,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  CheckSquare,
  Calendar,
  TrendingUp,
  Layers,
  Filter,
  GitMerge,
  Check,
  ChevronRight,
} from 'lucide-react';
import { formatDateBR } from '../constants';

export default function DashboardView({
  catalog,
  pathfinders,
  units,
  progressMap,
  classesMap,
  requirementsMap,
  events,
  settings,
  unificationAlerts = [],
  currentUser,
  onNavigate,
  onSelectClassMatrix,
  onSelectPathfinderCard,
  onOpenRequirementDetail,
  onQuickApproveBatch,
}) {
  const [approvingQueue, setApprovingQueue] = useState(false);
  const [syncingUnifications, setSyncingUnifications] = useState(false);
  const [queueClassFilter, setQueueClassFilter] = useState('ALL');

  const activePathfinders = useMemo(
    () => pathfinders.filter((p) => p.active),
    [pathfinders]
  );

  // Calcula estatísticas completas por desbravador, por classe e fila de aprovação
  const stats = useMemo(() => {
    let totalEnrolledReqInstances = 0;
    let totalApprovedInstances = 0;
    let totalCompletedAwaitingInstances = 0;
    let totalInProgressInstances = 0;

    const approvalQueue = [];
    const pfSummaries = [];

    for (const pf of activePathfinders) {
      const enrolledSlugs = (pf.enrollments || []).map((e) => e.class_slug);
      let pfTotalReqs = 0;
      let pfApprovedReqs = 0;
      let pfDoneOrApproved = 0;

      // Calcula progresso na classe principal regular para o Semáforo de Investidura
      const primaryRegSlug =
        enrolledSlugs.find((s) => classesMap[s]?.type === 'REGULAR') || enrolledSlugs[0];
      let regTotal = 0;
      let regApproved = 0;

      for (const slug of enrolledSlugs) {
        const classReqs = (catalog.requirements || []).filter((r) => r.class_slug === slug);
        for (const req of classReqs) {
          pfTotalReqs += 1;
          totalEnrolledReqInstances += 1;

          if (slug === primaryRegSlug) {
            regTotal += 1;
          }

          const pr = progressMap[`${pf.id}:${req.id}`];
          const st = pr?.status || 'PENDENTE';

          if (st === 'APROVADO') {
            pfApprovedReqs += 1;
            pfDoneOrApproved += 1;
            totalApprovedInstances += 1;
            if (slug === primaryRegSlug) regApproved += 1;
          } else if (st === 'CONCLUIDO') {
            pfDoneOrApproved += 1;
            totalCompletedAwaitingInstances += 1;
            approvalQueue.push({
              pathfinder: pf,
              requirement: req,
              classInfo: classesMap[slug],
              progress: pr,
            });
          } else if (st === 'EM_ANDAMENTO') {
            totalInProgressInstances += 1;
          }
        }
      }

      const overallPct = pfTotalReqs > 0 ? Math.round((pfApprovedReqs / pfTotalReqs) * 100) : 0;
      const regPct = regTotal > 0 ? Math.round((regApproved / regTotal) * 100) : overallPct;

      pfSummaries.push({
        pathfinder: pf,
        primaryClass: classesMap[primaryRegSlug],
        pfTotalReqs,
        pfApprovedReqs,
        pfDoneOrApproved,
        overallPct,
        regPct,
        remainingForInvestiture: Math.max(0, regTotal - regApproved),
      });
    }

    // Semáforo de Investidura
    const readyList = pfSummaries.filter((s) => s.regPct >= 85);
    const onTrackList = pfSummaries.filter((s) => s.regPct >= 50 && s.regPct < 85);
    const atRiskList = pfSummaries.filter((s) => s.regPct < 50);

    // Progresso por Classe
    const classStats = (catalog.classes || []).map((cls) => {
      const enrolledPfs = activePathfinders.filter((pf) =>
        pf.enrollments?.some((e) => e.class_slug === cls.slug)
      );
      const classReqs = (catalog.requirements || []).filter((r) => r.class_slug === cls.slug);
      const totalCells = enrolledPfs.length * classReqs.length;
      let approvedCells = 0;
      let awaitingCells = 0;

      for (const pf of enrolledPfs) {
        for (const req of classReqs) {
          const st = progressMap[`${pf.id}:${req.id}`]?.status || 'PENDENTE';
          if (st === 'APROVADO') approvedCells += 1;
          else if (st === 'CONCLUIDO') awaitingCells += 1;
        }
      }

      const pct = totalCells > 0 ? Math.round((approvedCells / totalCells) * 100) : 0;
      return {
        ...cls,
        enrolledCount: enrolledPfs.length,
        reqCount: classReqs.length,
        approvedCells,
        awaitingCells,
        totalCells,
        pct,
      };
    });

    // Progresso por Unidade
    const unitStats = units.map((u) => {
      const members = activePathfinders.filter((p) => p.unit_id === u.id);
      let totalReqs = 0;
      let approvedReqs = 0;

      for (const pf of members) {
        for (const en of pf.enrollments || []) {
          const reqs = (catalog.requirements || []).filter((r) => r.class_slug === en.class_slug);
          for (const req of reqs) {
            totalReqs += 1;
            if (progressMap[`${pf.id}:${req.id}`]?.status === 'APROVADO') {
              approvedReqs += 1;
            }
          }
        }
      }

      const pct = totalReqs > 0 ? Math.round((approvedReqs / totalReqs) * 100) : 0;
      return {
        ...u,
        memberCount: members.length,
        pct,
      };
    });

    // Top 5 Gargalos do Clube (Requisitos que mais desbravadores precisam)
    const reqNeeds = {};
    for (const pf of activePathfinders) {
      for (const en of pf.enrollments || []) {
        const reqs = (catalog.requirements || []).filter((r) => r.class_slug === en.class_slug);
        for (const req of reqs) {
          const st = progressMap[`${pf.id}:${req.id}`]?.status || 'PENDENTE';
          if (st !== 'APROVADO') {
            if (!reqNeeds[req.id]) {
              reqNeeds[req.id] = {
                requirement: req,
                classInfo: classesMap[en.class_slug],
                pendingCount: 0,
                enrolledCount: 0,
              };
            }
            reqNeeds[req.id].pendingCount += 1;
          }
          if (reqNeeds[req.id]) {
            reqNeeds[req.id].enrolledCount += 1;
          }
        }
      }
    }

    const bottlenecks = Object.values(reqNeeds)
      .sort((a, b) => b.pendingCount - a.pendingCount)
      .slice(0, 5);

    const clubCompletionPct =
      totalEnrolledReqInstances > 0
        ? Math.round((totalApprovedInstances / totalEnrolledReqInstances) * 100)
        : 0;

    return {
      totalEnrolledReqInstances,
      totalApprovedInstances,
      totalCompletedAwaitingInstances,
      totalInProgressInstances,
      clubCompletionPct,
      approvalQueue,
      pfSummaries,
      readyList,
      onTrackList,
      atRiskList,
      classStats,
      unitStats,
      bottlenecks,
    };
  }, [activePathfinders, catalog, progressMap, classesMap, units]);

  const filteredQueue = useMemo(() => {
    if (queueClassFilter === 'ALL') return stats.approvalQueue;
    return stats.approvalQueue.filter(
      (item) => item.requirement.base_class_slug === queueClassFilter
    );
  }, [stats.approvalQueue, queueClassFilter]);

  const canApproveQueue =
    [
      'ADMIN',
      'GESTOR',
      'DIRETOR',
      'SECRETARIO',
      'INSTRUTOR',
    ].includes(currentUser?.role) || Boolean(currentUser?.permissions?.can_approve_all);

  const handleSyncSingleUnification = async (alertItem) => {
    if (!canApproveQueue || syncingUnifications) return;
    setSyncingUnifications(true);
    try {
      await onQuickApproveBatch(
        [
          {
            pathfinder_id: alertItem.pathfinder_id,
            requirement_id: alertItem.pending_requirement_id,
          },
        ],
        `Unificação automática: ${alertItem.equivalence_title} (${alertItem.pathfinder_name})`
      );
    } finally {
      setSyncingUnifications(false);
    }
  };

  const handleSyncAllUnifications = async () => {
    if (!canApproveQueue || unificationAlerts.length === 0 || syncingUnifications) return;
    setSyncingUnifications(true);
    try {
      const items = unificationAlerts.map((a) => ({
        pathfinder_id: a.pathfinder_id,
        requirement_id: a.pending_requirement_id,
      }));
      await onQuickApproveBatch(
        items,
        `Sincronização em lote de ${items.length} unificações equivalentes pelo Painel`
      );
    } finally {
      setSyncingUnifications(false);
    }
  };

  const handleApproveAllFilteredQueue = async () => {
    if (!canApproveQueue || filteredQueue.length === 0) return;
    setApprovingQueue(true);
    try {
      const items = filteredQueue.map((item) => ({
        pathfinder_id: item.pathfinder.id,
        requirement_id: item.requirement.id,
      }));
      await onQuickApproveBatch(
        items,
        `Conferência e visto em lote pelo Painel (${filteredQueue.length} requisitos assinados)`
      );
    } finally {
      setApprovingQueue(false);
    }
  };

  const handleApproveSingleQueueItem = async (item) => {
    if (!canApproveQueue) return;
    setApprovingQueue(true);
    try {
      await onQuickApproveBatch(
        [
          {
            pathfinder_id: item.pathfinder.id,
            requirement_id: item.requirement.id,
          },
        ],
        `Visto de instrutor: ${item.requirement.code} (${item.pathfinder.name})`
      );
    } finally {
      setApprovingQueue(false);
    }
  };

  return (
    <div className="space-y-7">
      {/* Page Header (Apple Clean Style) */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-black/[0.06] dark:border-white/[0.08]">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/[0.04] dark:bg-white/[0.06] text-slate-600 dark:text-neutral-400 text-[11px] font-semibold uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5 text-[#0071e3] dark:text-[#0a84ff]" />
            Ano Eclesiástico {settings?.club_year || '2026'} • {settings?.club_region || 'DSA'}
          </div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-[-0.025em] text-slate-900 dark:text-white">
            {settings?.club_name || 'Clube de Desbravadores'}
          </h1>
          <p className="text-sm text-slate-500 dark:text-neutral-400 mt-1 font-normal">
            Painel executivo de classes regulares, avançadas e planejamento anual de investidura.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="apple-card px-4 py-2.5 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wider text-slate-400 dark:text-neutral-500 font-semibold">
                Meta de Investidura
              </div>
              <div className="text-sm font-semibold text-slate-900 dark:text-white tabular-nums">
                {formatDateBR(settings?.investiture_date || '2026-11-28')}
              </div>
            </div>
          </div>

          <button
            onClick={() => onNavigate('DEMAND')}
            className="apple-press px-4 py-2.5 rounded-full bg-[#0071e3] hover:bg-[#0077ed] text-white font-medium text-xs shadow-xs transition flex items-center gap-2 cursor-pointer"
          >
            <Layers className="w-4 h-4" />
            Planejar Demanda
            <ArrowRight className="w-3.5 h-3.5 opacity-80" />
          </button>
        </div>
      </div>

      {/* Guia Rápido de Primeiros Passos quando o Clube está iniciando do zero */}
      {(units.length === 0 || activePathfinders.length === 0) && (
        <div className="apple-card p-6 bg-gradient-to-r from-blue-50/50 via-indigo-50/30 to-transparent dark:from-blue-950/20 dark:to-transparent border-blue-500/20 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-1">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-[#0071e3] dark:text-[#0a84ff] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Início Rápido • Sistema Oficial DSA
            </div>
            <h2 className="text-[15px] font-semibold text-slate-900 dark:text-white">
              Seu banco de dados está pronto para os desbravadores do seu clube
            </h2>
            <p className="text-xs text-slate-500 dark:text-neutral-400 max-w-2xl">
              As 12 Classes e 212 Requisitos oficiais da DSA já estão carregados. Cadastre as unidades, matricule os desbravadores e convide sua diretoria para começar.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={() => onNavigate('PATHFINDERS')}
              className="apple-press px-4 py-2 rounded-full bg-[#0071e3] hover:bg-[#0077ed] text-white text-xs font-medium shadow-xs cursor-pointer"
            >
              1. Cadastrar Desbravadores
            </button>
            <button
              onClick={() => onNavigate('LEADERS')}
              className="apple-press px-4 py-2 rounded-full bg-black/[0.04] dark:bg-white/[0.08] hover:bg-black/[0.06] text-slate-800 dark:text-neutral-200 text-xs font-medium border border-black/[0.06] dark:border-white/[0.08] cursor-pointer"
            >
              2. Convidar Diretoria
            </button>
          </div>
        </div>
      )}

      {/* 4 KPIs Principais (Apple Health / Fitness Card Grid) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" data-tour="dashboard-summary">
        {/* Card 1: Desbravadores Ativos */}
        <div className="apple-card apple-card-hover p-5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-neutral-400">
              Desbravadores Ativos
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-white mt-2 tabular-nums">
            {activePathfinders.length}
          </div>
          <div className="text-xs text-slate-500 dark:text-neutral-400 mt-1">
            Distribuídos em <strong className="font-semibold text-slate-700 dark:text-neutral-300">{units.length} unidades</strong> e 12 classes
          </div>
        </div>

        {/* Card 2: Requisitos Assinados */}
        <div className="apple-card apple-card-hover p-5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-neutral-400">
              Requisitos Assinados
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-semibold tracking-tight text-emerald-600 dark:text-emerald-400 tabular-nums">
              {stats.clubCompletionPct}%
            </span>
            <span className="text-xs text-slate-400 dark:text-neutral-500">
              ({stats.totalApprovedInstances} / {stats.totalEnrolledReqInstances})
            </span>
          </div>
          <div className="w-full h-1.5 bg-black/[0.05] dark:bg-white/[0.08] rounded-full overflow-hidden mt-3">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-500"
              style={{ width: `${stats.clubCompletionPct}%` }}
            />
          </div>
        </div>

        {/* Card 3: Prontos p/ Investidura */}
        <div className="apple-card apple-card-hover p-5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-neutral-400">
              Investidura (≥85%)
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-white tabular-nums">
              {stats.readyList.length}
            </span>
            <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
              +{stats.onTrackList.length} no ritmo
            </span>
          </div>
          <div className="text-xs text-slate-500 dark:text-neutral-400 mt-1">
            {stats.atRiskList.length} desbravadores abaixo de 50%
          </div>
        </div>

        {/* Card 4: Fila de Visto */}
        <div className="apple-card apple-card-hover p-5 bg-gradient-to-br from-white to-sky-50/30 dark:from-[#1c1c1e] dark:to-sky-950/20">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-sky-700 dark:text-sky-400">
              Fila de Visto
            </span>
            <div className="w-8 h-8 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-semibold tracking-tight text-sky-700 dark:text-sky-400 mt-2 tabular-nums">
            {stats.totalCompletedAwaitingInstances}
          </div>
          <div className="text-xs text-sky-600 dark:text-sky-300/80 mt-1">
            Marcados como <strong>Feito</strong> aguardando visto
          </div>
        </div>
      </div>

      {/* Avisos Inteligentes de Unificação Automática (Apple Callout Inset Banner) */}
      {unificationAlerts.length > 0 && (
        <div className="apple-card overflow-hidden border-amber-500/20 bg-amber-500/[0.04] dark:bg-amber-500/[0.06]" data-tour="unification-alerts-banner">
          <div className="p-4 sm:p-5 border-b border-amber-500/15 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                <GitMerge className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-[15px] font-semibold text-slate-900 dark:text-white">
                    Avisos de Unificação Automática
                  </h2>
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/20">
                    {unificationAlerts.length} oportunidade(s)
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
                  Desbravadores que cumpriram requisitos equivalentes em uma classe com pendência em outra classe matriculada.
                </p>
              </div>
            </div>

            {canApproveQueue && (
              <button
                type="button"
                onClick={handleSyncAllUnifications}
                disabled={syncingUnifications}
                className="apple-press px-4 py-2 rounded-full bg-amber-600 hover:bg-amber-700 text-white text-xs font-medium flex items-center gap-1.5 shadow-xs transition cursor-pointer shrink-0 disabled:opacity-50"
              >
                <GitMerge className="w-3.5 h-3.5" />
                {syncingUnifications
                  ? 'Sincronizando...'
                  : `Sincronizar Todas (${unificationAlerts.length})`}
              </button>
            )}
          </div>

          <div className="divide-y divide-black/[0.04] dark:divide-white/[0.06] max-h-72 overflow-y-auto">
            {unificationAlerts.map((alert) => (
              <div
                key={alert.id}
                className="px-5 py-3 hover:bg-black/[0.02] dark:hover:bg-white/[0.03] transition-colors flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onSelectPathfinderCard(alert.pathfinder_id)}
                      className="text-[13px] font-semibold text-slate-900 dark:text-white hover:text-[#0071e3] transition cursor-pointer"
                    >
                      {alert.pathfinder_name}
                    </button>
                    <span className="text-xs text-slate-400 dark:text-neutral-500">• {alert.unit_name}</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-black/[0.04] dark:bg-white/[0.06] text-slate-700 dark:text-neutral-300 border border-black/[0.04] dark:border-white/[0.06]">
                      {alert.equivalence_title}
                    </span>
                  </div>
                  <div className="text-xs text-slate-600 dark:text-neutral-300 flex flex-wrap items-center gap-1.5">
                    <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                      ✓ Cumprido em {alert.completed_class_name} ({alert.completed_requirement_code})
                    </span>
                    <span className="text-slate-300 dark:text-neutral-600">→</span>
                    <span className="text-slate-800 dark:text-neutral-200">
                      Pendente em {alert.pending_class_name} ({alert.pending_requirement_code})
                    </span>
                  </div>
                </div>

                {canApproveQueue && (
                  <button
                    type="button"
                    onClick={() => handleSyncSingleUnification(alert)}
                    disabled={syncingUnifications}
                    className="apple-press px-3 py-1.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium flex items-center gap-1 shadow-xs transition shrink-0 cursor-pointer disabled:opacity-50"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Aprovar
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Fila de Visto do Instrutor (Apple Grouped Inset Table) */}
      <div className="apple-card overflow-hidden" data-tour="approval-queue">
        <div className="p-4 sm:p-5 border-b border-black/[0.06] dark:border-white/[0.08] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-[15px] font-semibold text-slate-900 dark:text-white">
                Fila de Visto do Instrutor
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-sky-500/10 text-sky-700 dark:text-sky-300 border border-sky-500/20">
                {filteredQueue.length} aguardando visto
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
              Requisitos cumpridos que aguardam assinatura oficial do instrutor ou diretoria.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 bg-black/[0.03] dark:bg-white/[0.06] border border-black/[0.06] dark:border-white/[0.08] rounded-xl px-2.5 py-1.5 text-xs">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={queueClassFilter}
                onChange={(e) => setQueueClassFilter(e.target.value)}
                className="bg-transparent font-medium text-slate-700 dark:text-neutral-200 focus:outline-none cursor-pointer"
              >
                <option value="ALL">Todas as Classes</option>
                <option value="amigo">Amigo (10 anos)</option>
                <option value="companheiro">Companheiro (11 anos)</option>
                <option value="pesquisador">Pesquisador (12 anos)</option>
                <option value="pioneiro">Pioneiro (13 anos)</option>
                <option value="excursionista">Excursionista (14 anos)</option>
                <option value="guia">Guia (15 anos)</option>
              </select>
            </div>

            {canApproveQueue && filteredQueue.length > 0 && (
              <button
                onClick={handleApproveAllFilteredQueue}
                disabled={approvingQueue}
                className="apple-press px-3.5 py-1.5 rounded-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-medium flex items-center gap-1.5 shadow-xs transition cursor-pointer"
              >
                <CheckSquare className="w-3.5 h-3.5" />
                {approvingQueue
                  ? 'Assinando...'
                  : `Assinar Todos (${filteredQueue.length})`}
              </button>
            )}
          </div>
        </div>

        {filteredQueue.length === 0 ? (
          <div className="p-10 text-center text-slate-400 dark:text-neutral-500 text-xs">
            Nenhum requisito aguardando assinatura de instrutor. Tudo em dia!
          </div>
        ) : (
          <div className="divide-y divide-black/[0.04] dark:divide-white/[0.06] max-h-80 overflow-y-auto">
            {filteredQueue.map((item) => (
              <div
                key={`${item.pathfinder.id}:${item.requirement.id}`}
                className="px-5 py-3 hover:bg-black/[0.02] dark:hover:bg-white/[0.03] transition-colors flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
              >
                <div className="flex items-start gap-3">
                  <span
                    className="px-2.5 py-1 rounded-lg text-xs font-semibold text-white shrink-0 mt-0.5 shadow-xs"
                    style={{ backgroundColor: item.classInfo?.color || '#334155' }}
                  >
                    {item.requirement.code}
                  </span>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => onSelectPathfinderCard(item.pathfinder.id)}
                        className="text-[13px] font-semibold text-slate-900 dark:text-white hover:text-[#0071e3] transition cursor-pointer"
                      >
                        {item.pathfinder.name}
                      </button>
                      <span className="text-xs text-slate-400 dark:text-neutral-500">
                        • {item.pathfinder.unit_name} • {item.classInfo?.name}
                      </span>
                      {Boolean(item.progress?.submitted_by_pathfinder) && (
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-700 dark:text-teal-300 border border-teal-500/20">
                          Enviado pelo Desbravador
                        </span>
                      )}
                      {item.progress?.attachments?.length > 0 && (
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-800 dark:text-amber-300 border border-amber-500/20">
                          📎 {item.progress.attachments.length} anexo(s)
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 dark:text-neutral-300 mt-0.5 line-clamp-1">
                      <strong>{item.requirement.marker}</strong> {item.requirement.title}
                    </p>
                    {item.progress?.notes && (
                      <p className="text-[11px] text-sky-700 dark:text-sky-400 mt-0.5 italic">
                        Evidência: &ldquo;{item.progress.notes}&rdquo;
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() =>
                      onOpenRequirementDetail(item.pathfinder, item.requirement)
                    }
                    className="apple-press px-3 py-1.5 rounded-full border border-black/[0.08] dark:border-white/[0.1] hover:bg-black/[0.04] dark:hover:bg-white/[0.06] text-xs font-medium text-slate-700 dark:text-neutral-200 cursor-pointer"
                  >
                    {item.progress?.attachments?.length > 0 ? 'Ver Anexos' : 'Detalhes'}
                  </button>
                  {canApproveQueue && (
                    <button
                      onClick={() => handleApproveSingleQueueItem(item)}
                      disabled={approvingQueue}
                      className="apple-press px-3.5 py-1.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium flex items-center gap-1 shadow-xs transition cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Dar Visto
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Progresso por Classe e Gargalos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna 1 e 2: Progresso das 12 Classes */}
        <div className="lg:col-span-2 apple-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-[15px] font-semibold text-slate-900 dark:text-white">
                Progresso das Classes (12 Classes Oficiais)
              </h2>
              <p className="text-xs text-slate-500 dark:text-neutral-400">
                Toque na classe para abrir a Ficha de Controle do Instrutor.
              </p>
            </div>
            <button
              onClick={() => onNavigate('MATRIX')}
              className="apple-press text-xs font-medium text-[#0071e3] dark:text-[#0a84ff] hover:opacity-80 flex items-center gap-1 cursor-pointer"
            >
              Ver Matriz Completa <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {stats.classStats.map((cls) => (
              <div
                key={cls.slug}
                onClick={() =>
                  onSelectClassMatrix(
                    cls.base_slug,
                    cls.type === 'AVANCADA' ? 'AVANCADA' : 'REGULAR'
                  )
                }
                className="apple-press p-3.5 rounded-xl border border-black/[0.05] dark:border-white/[0.08] hover:border-black/[0.1] dark:hover:border-white/[0.16] transition cursor-pointer bg-black/[0.015] dark:bg-white/[0.03]"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className="w-2.5 h-7 rounded-full shrink-0"
                      style={{ backgroundColor: cls.color }}
                    />
                    <div className="truncate">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[13px] font-semibold text-slate-900 dark:text-white truncate">
                          {cls.name}
                        </span>
                        <span
                          className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full uppercase tracking-wider ${
                            cls.type === 'AVANCADA'
                              ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20'
                              : 'bg-black/[0.04] dark:bg-white/[0.08] text-slate-600 dark:text-neutral-400'
                          }`}
                        >
                          {cls.type === 'AVANCADA' ? 'Avançada' : `${cls.min_age}a`}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 dark:text-neutral-500">
                        {cls.enrolledCount} membros • {cls.reqCount} requisitos
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-sm font-semibold text-slate-900 dark:text-white tabular-nums">
                      {cls.pct}%
                    </div>
                    {cls.awaitingCells > 0 && (
                      <div className="text-[10px] font-medium text-sky-600 dark:text-sky-400">
                        +{cls.awaitingCells} p/ visto
                      </div>
                    )}
                  </div>
                </div>
                <div className="w-full h-1.5 bg-black/[0.04] dark:bg-white/[0.08] rounded-full overflow-hidden mt-2.5">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${cls.pct}%`,
                      backgroundColor: cls.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Coluna 3: Demandas e Desempenho por Unidade */}
        <div className="space-y-6">
          <div className="apple-card p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-rose-500" />
                <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                  Maiores Demandas do Clube
                </h2>
              </div>
              <button
                onClick={() => onNavigate('DEMAND')}
                className="apple-press text-xs font-medium text-[#0071e3] dark:text-[#0a84ff] hover:opacity-80 cursor-pointer"
              >
                Ver todas
              </button>
            </div>
            <p className="text-xs text-slate-500 dark:text-neutral-400 mb-3">
              Requisitos com o maior número de desbravadores pendentes:
            </p>

            <div className="space-y-2">
              {stats.bottlenecks.map((b) => (
                <div
                  key={b.requirement.id}
                  onClick={() => onNavigate('DEMAND')}
                  className="apple-press p-2.5 rounded-xl border border-black/[0.05] dark:border-white/[0.06] hover:bg-black/[0.02] dark:hover:bg-white/[0.03] transition cursor-pointer"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className="px-2 py-0.5 rounded text-[10px] font-semibold text-white"
                      style={{ backgroundColor: b.classInfo?.color || '#475569' }}
                    >
                      {b.requirement.code} • {b.classInfo?.name}
                    </span>
                    <span className="text-[10px] font-medium text-rose-700 dark:text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20">
                      Faltam {b.pendingCount}/{b.enrolledCount}
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 dark:text-neutral-300 font-medium mt-1 line-clamp-1">
                    <strong>{b.requirement.marker}</strong> {b.requirement.title}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Desempenho por Unidade */}
          <div className="apple-card p-5">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">
              Progresso por Unidade
            </h2>
            <div className="space-y-3">
              {stats.unitStats.map((u) => (
                <div key={u.id}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-medium text-slate-800 dark:text-neutral-200">
                      {u.name}{' '}
                      <span className="text-slate-400 dark:text-neutral-500 font-normal">
                        ({u.memberCount} membros)
                      </span>
                    </span>
                    <span className="font-semibold text-slate-900 dark:text-white tabular-nums">{u.pct}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-black/[0.04] dark:bg-white/[0.08] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#0071e3] rounded-full transition-all"
                      style={{ width: `${u.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Semáforo de Investidura Individual (Apple Health Style) */}
      <div className="apple-card p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4 pb-3 border-b border-black/[0.05] dark:border-white/[0.06]">
          <div>
            <h2 className="text-[15px] font-semibold text-slate-900 dark:text-white">
              Semáforo de Investidura dos Desbravadores
            </h2>
            <p className="text-xs text-slate-500 dark:text-neutral-400">
              Acompanhamento individual rumo à investidura oficial. Toque no desbravador para abrir o Cartão Virtual.
            </p>
          </div>
          <button
            onClick={() => onNavigate('PATHFINDERS')}
            className="apple-press text-xs font-medium text-[#0071e3] dark:text-[#0a84ff] hover:opacity-80 flex items-center gap-1 cursor-pointer"
          >
            Gerenciar Desbravadores <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Coluna Verde: Prontos / Quase Prontos >= 85% */}
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.04] dark:bg-emerald-500/[0.07] p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                Aptos / Reta Final (≥85%)
              </span>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-800 dark:text-emerald-300">
                {stats.readyList.length}
              </span>
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {stats.readyList.length === 0 ? (
                <p className="text-xs text-slate-400 dark:text-neutral-500 italic">
                  Nenhum desbravador atingiu 85% ainda.
                </p>
              ) : (
                stats.readyList.map((s) => (
                  <div
                    key={s.pathfinder.id}
                    onClick={() => onSelectPathfinderCard(s.pathfinder.id)}
                    className="apple-press p-2.5 rounded-xl bg-white dark:bg-[#1c1c1e] border border-black/[0.05] dark:border-white/[0.06] hover:shadow-xs flex items-center justify-between cursor-pointer"
                  >
                    <div>
                      <div className="text-xs font-semibold text-slate-900 dark:text-white">
                        {s.pathfinder.name}
                      </div>
                      <div className="text-[11px] text-slate-400 dark:text-neutral-500">
                        {s.primaryClass?.name} • {s.pathfinder.unit_name}
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
                      {s.regPct}%
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Coluna Âmbar: No Ritmo (50% a 84%) */}
          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/[0.04] dark:bg-amber-500/[0.07] p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                No Ritmo (50% a 84%)
              </span>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/15 text-amber-800 dark:text-amber-300">
                {stats.onTrackList.length}
              </span>
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {stats.onTrackList.map((s) => (
                <div
                  key={s.pathfinder.id}
                  onClick={() => onSelectPathfinderCard(s.pathfinder.id)}
                  className="apple-press p-2.5 rounded-xl bg-white dark:bg-[#1c1c1e] border border-black/[0.05] dark:border-white/[0.06] hover:shadow-xs flex items-center justify-between cursor-pointer"
                >
                  <div>
                    <div className="text-xs font-semibold text-slate-900 dark:text-white">
                      {s.pathfinder.name}
                    </div>
                    <div className="text-[11px] text-slate-400 dark:text-neutral-500">
                      {s.primaryClass?.name} • Faltam {s.remainingForInvestiture} itens
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 tabular-nums">
                    {s.regPct}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Coluna Vermelha: Atenção (< 50%) */}
          <div className="rounded-2xl border border-rose-500/20 bg-rose-500/[0.04] dark:bg-rose-500/[0.07] p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-rose-800 dark:text-rose-300 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                Atenção Prioritária (&lt;50%)
              </span>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-500/15 text-rose-800 dark:text-rose-300">
                {stats.atRiskList.length}
              </span>
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {stats.atRiskList.map((s) => (
                <div
                  key={s.pathfinder.id}
                  onClick={() => onSelectPathfinderCard(s.pathfinder.id)}
                  className="apple-press p-2.5 rounded-xl bg-white dark:bg-[#1c1c1e] border border-black/[0.05] dark:border-white/[0.06] hover:shadow-xs flex items-center justify-between cursor-pointer"
                >
                  <div>
                    <div className="text-xs font-semibold text-slate-900 dark:text-white">
                      {s.pathfinder.name}
                    </div>
                    <div className="text-[11px] text-slate-400 dark:text-neutral-500">
                      {s.primaryClass?.name} • Faltam {s.remainingForInvestiture} itens
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-rose-600 dark:text-rose-400 tabular-nums">
                    {s.regPct}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
