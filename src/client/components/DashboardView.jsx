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
  ShieldCheck,
  TrendingUp,
  Layers,
  Filter,
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
  currentUser,
  onNavigate,
  onSelectClassMatrix,
  onSelectPathfinderCard,
  onOpenRequirementDetail,
  onQuickApproveBatch,
}) {
  const [approvingQueue, setApprovingQueue] = useState(false);
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
      const unitPfs = pfSummaries.filter((s) => s.pathfinder.unit_id === u.id);
      const totalReqs = unitPfs.reduce((acc, s) => acc + s.pfTotalReqs, 0);
      const approvedReqs = unitPfs.reduce((acc, s) => acc + s.pfApprovedReqs, 0);
      const pct = totalReqs > 0 ? Math.round((approvedReqs / totalReqs) * 100) : 0;
      return {
        ...u,
        memberCount: unitPfs.length,
        pct,
        approvedReqs,
        totalReqs,
      };
    });

    // Top Gargalos (Requisitos com mais desbravadores pendentes)
    const bottlenecks = (catalog.requirements || [])
      .map((req) => {
        const enrolledPfs = activePathfinders.filter((pf) =>
          pf.enrollments?.some((e) => e.class_slug === req.class_slug)
        );
        const pendingPfs = enrolledPfs.filter((pf) => {
          const st = progressMap[`${pf.id}:${req.id}`]?.status || 'PENDENTE';
          return st !== 'APROVADO';
        });
        return {
          requirement: req,
          classInfo: classesMap[req.class_slug],
          pendingCount: pendingPfs.length,
          enrolledCount: enrolledPfs.length,
          pendingPfs,
        };
      })
      .filter((b) => b.pendingCount > 0)
      .sort((a, b) => b.pendingCount - a.pendingCount)
      .slice(0, 6);

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

  const canApproveQueue = ['ADMIN', 'DIRETOR', 'SECRETARIO', 'INSTRUTOR'].includes(
    currentUser?.role
  );

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
        `Visto de instrutor no requisito ${item.requirement.code} (${item.pathfinder.name})`
      );
    } finally {
      setApprovingQueue(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner do Clube + Contagem para Investidura */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-6 text-white shadow-lg border border-slate-700/60 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-300 text-xs font-bold uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            Ano Eclesiástico {settings?.club_year || '2026'} • {settings?.club_region || 'DSA'}
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            {settings?.club_name || 'Clube de Desbravadores Pioneiros da Colina'}
          </h1>
          <p className="text-sm text-slate-300 mt-1">
            Painel estratégico de classes regulares, classes avançadas e planejamento anual de investidura.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="bg-slate-800/90 border border-slate-700 rounded-xl px-4 py-3">
            <div className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-amber-400" />
              Meta de Investidura
            </div>
            <div className="text-lg font-extrabold text-amber-300 mt-0.5">
              {formatDateBR(settings?.investiture_date || '2026-11-28')}
            </div>
          </div>

          <button
            onClick={() => onNavigate('DEMAND')}
            className="px-4 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm shadow-md transition flex items-center gap-2 cursor-pointer"
          >
            <Layers className="w-4 h-4" />
            Planejar Demanda do Ano
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 4 KPIs Principais */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Desbravadores Ativos
            </span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 mt-2">
            {activePathfinders.length}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Distribuídos em <strong>{units.length} unidades</strong> e 12 classes
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Requisitos Assinados
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-extrabold text-emerald-700">
              {stats.clubCompletionPct}%
            </span>
            <span className="text-xs text-slate-500 font-medium">
              ({stats.totalApprovedInstances} / {stats.totalEnrolledReqInstances})
            </span>
          </div>
          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden mt-2">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all"
              style={{ width: `${stats.clubCompletionPct}%` }}
            />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Prontos p/ Investidura (≥85%)
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Award className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-extrabold text-slate-900">
              {stats.readyList.length}
            </span>
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
              +{stats.onTrackList.length} no ritmo
            </span>
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {stats.atRiskList.length} desbravadores abaixo de 50%
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-sky-200 bg-gradient-to-br from-white to-sky-50/50 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-sky-800">
              Fila de Visto do Instrutor
            </span>
            <div className="w-9 h-9 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-sky-800 mt-2">
            {stats.totalCompletedAwaitingInstances}
          </div>
          <div className="text-xs text-sky-700 mt-1">
            Marcados como <strong>Feito</strong> aguardando assinatura
          </div>
        </div>
      </div>

      {/* Fila de Conferência Rápida (Conselheiro marcou CONCLUIDO -> Instrutor/Diretor aprova APROVADO) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-sky-600" />
              <h2 className="text-base font-bold text-slate-900">
                Fila de Conferência de Instrutores (Aguardando Assinatura)
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-sky-100 text-sky-800">
                {filteredQueue.length} pendentes de visto
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Requisitos marcados como concluídos pelos Conselheiros de Unidade que aguardam validação final do Instrutor ou Diretor.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={queueClassFilter}
                onChange={(e) => setQueueClassFilter(e.target.value)}
                className="bg-transparent font-semibold text-slate-700 focus:outline-none"
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
                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
              >
                <CheckSquare className="w-4 h-4" />
                {approvingQueue
                  ? 'Assinando...'
                  : `Assinar Todos (${filteredQueue.length})`}
              </button>
            )}
          </div>
        </div>

        {filteredQueue.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-sm">
            Nenhum requisito aguardando assinatura de instrutor neste filtro. Tudo em dia!
          </div>
        ) : (
          <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
            {filteredQueue.map((item) => (
              <div
                key={`${item.pathfinder.id}:${item.requirement.id}`}
                className="px-5 py-3.5 hover:bg-slate-50/80 transition flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
              >
                <div className="flex items-start gap-3">
                  <span
                    className="px-2.5 py-1 rounded-lg text-xs font-extrabold text-white shrink-0 mt-0.5"
                    style={{ backgroundColor: item.classInfo?.color || '#334155' }}
                  >
                    {item.requirement.code}
                  </span>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => onSelectPathfinderCard(item.pathfinder.id)}
                        className="text-sm font-bold text-slate-900 hover:text-indigo-600 cursor-pointer"
                      >
                        {item.pathfinder.name}
                      </button>
                      <span className="text-xs text-slate-500">
                        • {item.pathfinder.unit_name} • {item.classInfo?.name}
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 mt-0.5 line-clamp-1">
                      <strong>{item.requirement.marker}</strong> {item.requirement.title}
                    </p>
                    {item.progress?.notes && (
                      <p className="text-[11px] text-sky-700 mt-0.5 italic">
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
                    className="px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-xs font-semibold text-slate-700 cursor-pointer"
                  >
                    Detalhes
                  </button>
                  {canApproveQueue && (
                    <button
                      onClick={() => handleApproveSingleQueueItem(item)}
                      disabled={approvingQueue}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
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

      {/* Progresso por Classe (6 Regulares + 6 Avançadas) e Top Gargalos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna 1 e 2: Progresso das 12 Classes */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-xs p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Progresso das Classes (Regulares e Avançadas)
              </h2>
              <p className="text-xs text-slate-500">
                Clique em qualquer classe para abrir a Ficha de Controle do Instrutor (Matriz).
              </p>
            </div>
            <button
              onClick={() => onNavigate('MATRIX')}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
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
                className="p-3.5 rounded-xl border border-slate-200 hover:border-slate-300 hover:shadow-xs transition cursor-pointer bg-slate-50/40"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className="w-3 h-8 rounded-full shrink-0"
                      style={{ backgroundColor: cls.color }}
                    />
                    <div className="truncate">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-bold text-slate-900 truncate">
                          {cls.name}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${
                            cls.type === 'AVANCADA'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          {cls.type === 'AVANCADA' ? 'Avançada' : `${cls.min_age}a`}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {cls.enrolledCount} desbravadores • {cls.reqCount} requisitos
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-sm font-extrabold text-slate-900">
                      {cls.pct}%
                    </div>
                    {cls.awaitingCells > 0 && (
                      <div className="text-[10px] font-semibold text-sky-700">
                        +{cls.awaitingCells} p/ visto
                      </div>
                    )}
                  </div>
                </div>
                <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden mt-2.5">
                  <div
                    className="h-full rounded-full transition-all"
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

        {/* Coluna 3: Top Gargalos do Clube + Unidades */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-rose-600" />
                <h2 className="text-sm font-bold text-slate-900">
                  Maiores Demandas do Clube
                </h2>
              </div>
              <button
                onClick={() => onNavigate('DEMAND')}
                className="text-xs font-bold text-indigo-600 hover:underline cursor-pointer"
              >
                Ver todas
              </button>
            </div>
            <p className="text-xs text-slate-500 mb-3">
              Requisitos com o maior número de desbravadores pendentes neste momento:
            </p>

            <div className="space-y-2.5">
              {stats.bottlenecks.map((b) => (
                <div
                  key={b.requirement.id}
                  onClick={() => onNavigate('DEMAND')}
                  className="p-3 rounded-xl border border-slate-200 hover:bg-slate-50 transition cursor-pointer"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className="px-2 py-0.5 rounded text-[11px] font-bold text-white"
                      style={{ backgroundColor: b.classInfo?.color || '#475569' }}
                    >
                      {b.requirement.code} • {b.classInfo?.name}
                    </span>
                    <span className="text-xs font-extrabold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
                      Faltam {b.pendingCount}/{b.enrolledCount}
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 font-medium mt-1.5 line-clamp-2">
                    <strong>{b.requirement.marker}</strong> {b.requirement.title}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Desempenho por Unidade */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5">
            <h2 className="text-sm font-bold text-slate-900 mb-3">
              Progresso por Unidade
            </h2>
            <div className="space-y-3">
              {stats.unitStats.map((u) => (
                <div key={u.id}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-bold text-slate-800">
                      {u.name}{' '}
                      <span className="text-slate-400 font-normal">
                        ({u.memberCount} membros)
                      </span>
                    </span>
                    <span className="font-extrabold text-slate-900">{u.pct}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-600 rounded-full"
                      style={{ width: `${u.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Semáforo de Investidura Individual */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Semáforo de Investidura dos Desbravadores
            </h2>
            <p className="text-xs text-slate-500">
              Acompanhamento individual rumo à Cerimônia de Investidura. Clique em um desbravador para abrir seu Cartão Virtual.
            </p>
          </div>
          <button
            onClick={() => onNavigate('PATHFINDERS')}
            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
          >
            Gerenciar Desbravadores <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Coluna Verde: Prontos / Quase Prontos >= 85% */}
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Aptos / Reta Final (≥85%)
              </span>
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-200 text-emerald-900">
                {stats.readyList.length}
              </span>
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {stats.readyList.length === 0 ? (
                <p className="text-xs text-slate-500 italic">
                  Nenhum desbravador atingiu 85% ainda.
                </p>
              ) : (
                stats.readyList.map((s) => (
                  <div
                    key={s.pathfinder.id}
                    onClick={() => onSelectPathfinderCard(s.pathfinder.id)}
                    className="p-2.5 rounded-lg bg-white border border-emerald-200/80 hover:shadow-xs flex items-center justify-between cursor-pointer"
                  >
                    <div>
                      <div className="text-xs font-bold text-slate-900">
                        {s.pathfinder.name}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {s.primaryClass?.name} • {s.pathfinder.unit_name}
                      </div>
                    </div>
                    <span className="text-xs font-extrabold text-emerald-700">
                      {s.regPct}%
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Coluna Âmbar: No Ritmo (50% a 84%) */}
          <div className="rounded-xl border border-amber-200 bg-amber-50/40 p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-extrabold uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-amber-600" />
                No Ritmo (50% a 84%)
              </span>
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-200 text-amber-900">
                {stats.onTrackList.length}
              </span>
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {stats.onTrackList.map((s) => (
                <div
                  key={s.pathfinder.id}
                  onClick={() => onSelectPathfinderCard(s.pathfinder.id)}
                  className="p-2.5 rounded-lg bg-white border border-amber-200/80 hover:shadow-xs flex items-center justify-between cursor-pointer"
                >
                  <div>
                    <div className="text-xs font-bold text-slate-900">
                      {s.pathfinder.name}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {s.primaryClass?.name} • Faltam {s.remainingForInvestiture} itens
                    </div>
                  </div>
                  <span className="text-xs font-extrabold text-amber-700">
                    {s.regPct}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Coluna Vermelha: Atenção (< 50%) */}
          <div className="rounded-xl border border-rose-200 bg-rose-50/40 p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-extrabold uppercase tracking-wider text-rose-900 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                Atenção Prioritária (&lt;50%)
              </span>
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-rose-200 text-rose-900">
                {stats.atRiskList.length}
              </span>
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {stats.atRiskList.map((s) => (
                <div
                  key={s.pathfinder.id}
                  onClick={() => onSelectPathfinderCard(s.pathfinder.id)}
                  className="p-2.5 rounded-lg bg-white border border-rose-200/80 hover:shadow-xs flex items-center justify-between cursor-pointer"
                >
                  <div>
                    <div className="text-xs font-bold text-slate-900">
                      {s.pathfinder.name}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {s.primaryClass?.name} • Faltam {s.remainingForInvestiture} itens
                    </div>
                  </div>
                  <span className="text-xs font-extrabold text-rose-700">
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
