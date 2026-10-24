import React, { useState, useMemo } from 'react';
import {
  Users,
  UserPlus,
  FolderPlus,
  Search,
  Award,
  CheckCircle2,
  Clock,
  Edit3,
  Printer,
  Sparkles,
  X,
  Filter,
  ChevronRight,
  Layers,
  Shield,
} from 'lucide-react';
import {
  STATUS_CONFIG,
  calculateAge,
  formatDateBR,
  EXECUTION_CONTEXT_LABELS,
} from '../constants';

export default function PathfindersView({
  catalog,
  pathfinders,
  units,
  progressMap,
  classesMap,
  selectedPathfinderId,
  onSelectPathfinderId,
  currentUser,
  onSavePathfinder,
  onCreateUnit,
  onOpenRequirementDetail,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [unitFilter, setUnitFilter] = useState('ALL');
  const [classFilter, setClassFilter] = useState('ALL');
  const [cardOnlyPending, setCardOnlyPending] = useState(false);
  const [cardSelectedClassSlug, setCardSelectedClassSlug] = useState('ALL');

  // Estado do Modal de Novo/Editar Desbravador
  const [pfModalOpen, setPfModalOpen] = useState(false);
  const [editingPf, setEditingPf] = useState(null);
  const [pfName, setPfName] = useState('');
  const [pfBirthDate, setPfBirthDate] = useState('2015-05-10');
  const [pfUnitId, setPfUnitId] = useState('');
  const [pfNotes, setPfNotes] = useState('');
  const [pfActive, setPfActive] = useState(true);
  const [pfClassSlugs, setPfClassSlugs] = useState(['amigo', 'amigo_natureza']);
  const [pfIsGrouped, setPfIsGrouped] = useState(false);
  const [savingPf, setSavingPf] = useState(false);

  // Estado do Modal de Nova Unidade
  const [unitModalOpen, setUnitModalOpen] = useState(false);
  const [unitName, setUnitName] = useState('');
  const [unitGender, setUnitGender] = useState('M');
  const [savingUnit, setSavingUnit] = useState(false);

  const canManageRegistry = ['ADMIN', 'DIRETOR', 'SECRETARIO'].includes(
    currentUser?.role
  );

  // Enriquece desbravadores com estatísticas de progresso
  const enrichedPathfinders = useMemo(() => {
    return pathfinders.map((pf) => {
      const slugs = (pf.enrollments || []).map((e) => e.class_slug);
      let totalReqs = 0;
      let approvedReqs = 0;
      let completedReqs = 0;

      const byClass = slugs.map((slug) => {
        const reqs = (catalog.requirements || []).filter((r) => r.class_slug === slug);
        let cApproved = 0;
        let cDone = 0;
        for (const r of reqs) {
          totalReqs += 1;
          const st = progressMap[`${pf.id}:${r.id}`]?.status || 'PENDENTE';
          if (st === 'APROVADO') {
            approvedReqs += 1;
            completedReqs += 1;
            cApproved += 1;
            cDone += 1;
          } else if (st === 'CONCLUIDO') {
            completedReqs += 1;
            cDone += 1;
          }
        }
        const cTotal = reqs.length;
        return {
          slug,
          classInfo: classesMap[slug],
          total: cTotal,
          approved: cApproved,
          done: cDone,
          remaining: Math.max(0, cTotal - cApproved),
          pct: cTotal > 0 ? Math.round((cApproved / cTotal) * 100) : 0,
        };
      });

      const pct = totalReqs > 0 ? Math.round((approvedReqs / totalReqs) * 100) : 0;
      return {
        ...pf,
        age: calculateAge(pf.birth_date),
        totalReqs,
        approvedReqs,
        completedReqs,
        remainingReqs: Math.max(0, totalReqs - approvedReqs),
        pct,
        byClass,
      };
    });
  }, [pathfinders, catalog.requirements, progressMap, classesMap]);

  const filteredPathfinders = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return enrichedPathfinders.filter((pf) => {
      if (unitFilter !== 'ALL' && pf.unit_id !== unitFilter) return false;
      if (
        classFilter !== 'ALL' &&
        !pf.enrollments?.some((e) => e.class_slug === classFilter)
      ) {
        return false;
      }
      if (q) {
        const hay = `${pf.name} ${pf.unit_name || ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [enrichedPathfinders, unitFilter, classFilter, searchQuery]);

  const activePf = useMemo(() => {
    if (selectedPathfinderId) {
      const found = enrichedPathfinders.find((p) => p.id === selectedPathfinderId);
      if (found) return found;
    }
    return filteredPathfinders[0] || enrichedPathfinders[0] || null;
  }, [selectedPathfinderId, enrichedPathfinders, filteredPathfinders]);

  // Requisitos do Cartão Virtual do Desbravador selecionado
  const activePfRequirementsByClass = useMemo(() => {
    if (!activePf) return [];
    return activePf.byClass
      .filter(
        (c) => cardSelectedClassSlug === 'ALL' || c.slug === cardSelectedClassSlug
      )
      .map((c) => {
        const reqs = (catalog.requirements || [])
          .filter((r) => r.class_slug === c.slug)
          .map((r) => {
            const pr = progressMap[`${activePf.id}:${r.id}`];
            const st = pr?.status || 'PENDENTE';
            return {
              ...r,
              progress: pr,
              status: st,
            };
          })
          .filter((r) => !cardOnlyPending || r.status !== 'APROVADO');

        return {
          ...c,
          requirements: reqs,
        };
      });
  }, [activePf, catalog.requirements, progressMap, cardSelectedClassSlug, cardOnlyPending]);

  const openCreatePfModal = () => {
    setEditingPf(null);
    setPfName('');
    setPfBirthDate('2015-04-15');
    setPfUnitId(units[0]?.id || '');
    setPfNotes('');
    setPfActive(true);
    setPfClassSlugs(['amigo', 'amigo_natureza']);
    setPfIsGrouped(false);
    setPfModalOpen(true);
  };

  const openEditPfModal = (pf) => {
    setEditingPf(pf);
    setPfName(pf.name);
    setPfBirthDate(pf.birth_date || '2015-01-01');
    setPfUnitId(pf.unit_id || '');
    setPfNotes(pf.notes || '');
    setPfActive(Boolean(pf.active));
    setPfClassSlugs((pf.enrollments || []).map((e) => e.class_slug));
    setPfIsGrouped(Boolean(pf.enrollments?.some((e) => e.is_grouped_class)));
    setPfModalOpen(true);
  };

  const toggleClassEnrollment = (slug) => {
    setPfClassSlugs((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
    );
  };

  // Auto-seleciona classes compatíveis com a idade (Modo Regular ou Modo Classes Agrupadas)
  const applyAgeSuggestedClasses = (groupedMode = false) => {
    const age = calculateAge(pfBirthDate) || 10;
    const allClasses = catalog.classes || [];
    if (!groupedMode) {
      const targetAge = Math.min(15, Math.max(10, age));
      const matched = allClasses
        .filter((c) => c.min_age === targetAge)
        .map((c) => c.slug);
      setPfClassSlugs(matched);
      setPfIsGrouped(false);
    } else {
      // Classes Agrupadas: seleciona todas as classes regulares até a idade atual do desbravador
      const targetAge = Math.min(15, Math.max(10, age));
      const matched = allClasses
        .filter((c) => c.min_age <= targetAge && c.type === 'REGULAR')
        .map((c) => c.slug);
      setPfClassSlugs(matched);
      setPfIsGrouped(true);
    }
  };

  const handleSavePfSubmit = async (e) => {
    e.preventDefault();
    if (!pfName.trim() || pfClassSlugs.length === 0) return;
    setSavingPf(true);
    try {
      await onSavePathfinder(
        {
          name: pfName.trim(),
          birth_date: pfBirthDate,
          unit_id: pfUnitId || null,
          notes: pfNotes,
          active: pfActive,
          class_slugs: pfClassSlugs,
          is_grouped_class: pfIsGrouped,
        },
        editingPf?.id
      );
      setPfModalOpen(false);
    } finally {
      setSavingPf(false);
    }
  };

  const handleCreateUnitSubmit = async (e) => {
    e.preventDefault();
    if (!unitName.trim()) return;
    setSavingUnit(true);
    try {
      await onCreateUnit({ name: unitName.trim(), gender: unitGender });
      setUnitName('');
      setUnitModalOpen(false);
    } finally {
      setSavingUnit(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Cabeçalho e Botões de Cadastro */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 no-print">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-indigo-600" />
            Desbravadores, Unidades & Cartão Virtual Individual
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Consulte o Cartão Virtual de cada desbravador, filtre o que falta para a investidura e gerencie matrículas (incluindo Classes Agrupadas).
          </p>
        </div>

        {canManageRegistry && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setUnitModalOpen(true)}
              className="px-3.5 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 text-xs font-bold text-slate-700 flex items-center gap-1.5 cursor-pointer"
            >
              <FolderPlus className="w-4 h-4 text-slate-500" />
              Nova Unidade
            </button>
            <button
              onClick={openCreatePfModal}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              Cadastrar Desbravador
            </button>
          </div>
        )}
      </div>

      {/* Layout Mestre-Detalhe: Lista de Desbravadores (Esquerda) + Cartão Virtual (Direita) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Coluna Esquerda: Lista e Filtros de Desbravadores */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden no-print">
          <div className="p-4 border-b border-slate-200 space-y-2.5 bg-slate-50/60">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar desbravador..."
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <select
                value={unitFilter}
                onChange={(e) => setUnitFilter(e.target.value)}
                className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700"
              >
                <option value="ALL">Todas Unidades</option>
                {units.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>

              <select
                value={classFilter}
                onChange={(e) => setClassFilter(e.target.value)}
                className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700"
              >
                <option value="ALL">Todas Classes</option>
                {(catalog.classes || []).map((c) => (
                  <option key={c.slug} value={c.slug}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="divide-y divide-slate-100 max-h-[680px] overflow-y-auto">
            {filteredPathfinders.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500">
                Nenhum desbravador encontrado.
              </div>
            ) : (
              filteredPathfinders.map((pf) => {
                const isSelected = activePf?.id === pf.id;
                return (
                  <div
                    key={pf.id}
                    onClick={() => {
                      onSelectPathfinderId(pf.id);
                      setCardSelectedClassSlug('ALL');
                    }}
                    className={`p-3.5 transition cursor-pointer flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-indigo-50/90 border-l-4 border-l-indigo-600'
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-bold text-slate-900 truncate">
                          {pf.name}
                        </span>
                        {pf.age && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-200 text-slate-700">
                            {pf.age}a
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500 truncate mt-0.5">
                        {pf.unit_name || 'Sem Unidade'}
                      </div>
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {pf.byClass.map((bc) => (
                          <span
                            key={bc.slug}
                            className="text-[10px] font-bold px-1.5 py-0.5 rounded text-white"
                            style={{
                              backgroundColor: bc.classInfo?.color || '#475569',
                            }}
                          >
                            {bc.classInfo?.name}: {bc.pct}%
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <div className="text-right">
                        <div
                          className={`text-sm font-extrabold ${
                            pf.pct >= 85
                              ? 'text-emerald-700'
                              : pf.pct >= 50
                              ? 'text-amber-700'
                              : 'text-rose-700'
                          }`}
                        >
                          {pf.pct}%
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Faltam {pf.remainingReqs}
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Coluna Direita: Cartão Virtual Individual do Desbravador */}
        <div className="lg:col-span-8 space-y-4">
          {!activePf ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center text-slate-500">
              Selecione um desbravador na lista ao lado para visualizar seu Cartão Virtual.
            </div>
          ) : (
            <>
              {/* Cabeçalho do Cartão Virtual Individual */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-xl font-extrabold text-slate-900">
                        {activePf.name}
                      </h2>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800">
                        {activePf.unit_name || 'Sem Unidade'}
                      </span>
                      {activePf.age && (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                          {activePf.age} anos (Nasc: {formatDateBR(activePf.birth_date)})
                        </span>
                      )}
                    </div>
                    {activePf.notes && (
                      <p className="text-xs text-slate-500 mt-1">{activePf.notes}</p>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 no-print">
                    {canManageRegistry && (
                      <button
                        onClick={() => openEditPfModal(activePf)}
                        className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-700 flex items-center gap-1.5 cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        Editar Matrícula
                      </button>
                    )}
                    <button
                      onClick={() => window.print()}
                      className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      Imprimir Ficha Individual
                    </button>
                  </div>
                </div>

                {/* Resumo por Classe Matriculada */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                  {activePf.byClass.map((bc) => (
                    <div
                      key={bc.slug}
                      onClick={() =>
                        setCardSelectedClassSlug(
                          cardSelectedClassSlug === bc.slug ? 'ALL' : bc.slug
                        )
                      }
                      className={`p-3.5 rounded-xl border transition cursor-pointer ${
                        cardSelectedClassSlug === bc.slug
                          ? 'ring-2 ring-indigo-600 border-indigo-600 bg-indigo-50/20'
                          : 'border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <img
                            src={bc.classInfo?.logo_file}
                            alt={bc.classInfo?.name}
                            className="w-7 h-7 object-contain"
                          />
                          <div>
                            <div className="text-xs font-extrabold text-slate-900">
                              {bc.classInfo?.name}
                            </div>
                            <div className="text-[11px] text-slate-500">
                              {bc.approved} de {bc.total} aprovados (Faltam{' '}
                              <strong>{bc.remaining}</strong>)
                            </div>
                          </div>
                        </div>
                        <span
                          className="text-sm font-extrabold"
                          style={{ color: bc.classInfo?.color || '#0f172a' }}
                        >
                          {bc.pct}%
                        </span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden mt-2">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${bc.pct}%`,
                            backgroundColor: bc.classInfo?.color || '#4f46e5',
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Barra de Filtro: "O que falta para a Investidura?" */}
                <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 no-print">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCardOnlyPending(false)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                        !cardOnlyPending
                          ? 'bg-slate-900 text-white'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      Cartão Completo ({activePf.totalReqs})
                    </button>
                    <button
                      onClick={() => setCardOnlyPending(true)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                        cardOnlyPending
                          ? 'bg-rose-600 text-white shadow-xs'
                          : 'bg-rose-50 text-rose-800 border border-rose-200 hover:bg-rose-100'
                      }`}
                    >
                      <Award className="w-3.5 h-3.5" />O que falta para a Investidura? (
                      {activePf.remainingReqs})
                    </button>
                  </div>

                  {cardSelectedClassSlug !== 'ALL' && (
                    <button
                      onClick={() => setCardSelectedClassSlug('ALL')}
                      className="text-xs font-bold text-indigo-600 hover:underline cursor-pointer"
                    >
                      Mostrar todas as classes matriculadas
                    </button>
                  )}
                </div>
              </div>

              {/* Lista dos Requisitos do Cartão do Desbravador */}
              {activePfRequirementsByClass.map((clsBlock) => (
                <div
                  key={clsBlock.slug}
                  className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden"
                >
                  <div
                    className="px-5 py-3 text-white flex items-center justify-between"
                    style={{
                      backgroundColor: clsBlock.classInfo?.color || '#334155',
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-extrabold">
                        {clsBlock.classInfo?.name}
                      </span>
                      <span className="text-xs bg-black/25 px-2 py-0.5 rounded-full font-semibold">
                        {clsBlock.requirements.length} itens exibidos
                      </span>
                    </div>
                    <span className="text-xs font-bold">
                      Concluído: {clsBlock.pct}%
                    </span>
                  </div>

                  {clsBlock.requirements.length === 0 ? (
                    <div className="p-6 text-center text-xs text-emerald-700 font-semibold">
                      Parabéns! Todos os requisitos desta classe já foram aprovados!
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {clsBlock.requirements.map((req) => {
                        const cfg =
                          STATUS_CONFIG[req.status] || STATUS_CONFIG.PENDENTE;
                        const ctxBadge =
                          EXECUTION_CONTEXT_LABELS[req.execution_context];
                        const subCount = req.subitems?.length || 0;

                        return (
                          <div
                            key={req.id}
                            onClick={() =>
                              onOpenRequirementDetail(activePf, req)
                            }
                            className="p-4 hover:bg-slate-50 transition cursor-pointer flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                          >
                            <div className="space-y-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-xs font-extrabold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                                  {req.code}
                                </span>
                                <span className="text-[11px] font-bold text-slate-500 uppercase">
                                  {req.section}
                                </span>
                                {ctxBadge && (
                                  <span
                                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${ctxBadge.badge}`}
                                  >
                                    {ctxBadge.label}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs sm:text-sm text-slate-800 leading-relaxed">
                                <strong className="font-bold mr-1">
                                  {req.marker}
                                </strong>
                                {req.title}
                              </p>
                              {subCount > 0 && (
                                <div className="flex flex-wrap gap-1.5 pt-1">
                                  {req.subitems.map((sub) => {
                                    const done =
                                      req.status === 'APROVADO' ||
                                      Boolean(
                                        req.progress?.completed_subitems?.[
                                          sub.key
                                        ]
                                      );
                                    return (
                                      <span
                                        key={sub.key}
                                        className={`text-[10px] px-2 py-0.5 rounded border ${
                                          done
                                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300 font-bold'
                                            : 'bg-slate-50 text-slate-600 border-slate-200'
                                        }`}
                                      >
                                        {sub.key}) {sub.text.slice(0, 42)}
                                        {sub.text.length > 42 ? '...' : ''}
                                      </span>
                                    );
                                  })}
                                </div>
                              )}
                              {req.progress?.notes && (
                                <p className="text-[11px] text-indigo-700 italic">
                                  Obs: &ldquo;{req.progress.notes}&rdquo;
                                </p>
                              )}
                            </div>

                            <div className="shrink-0 flex sm:flex-col items-end justify-between gap-1">
                              <span
                                className={`px-3 py-1 rounded-xl border text-xs font-bold ${cfg.bgClass}`}
                              >
                                {cfg.label}
                              </span>
                              {req.progress?.updated_at && (
                                <span className="text-[10px] text-slate-400">
                                  {formatDateBR(req.progress.updated_at)}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </>
          )}
        </div>
      </div>

      {/* Modal Cadastrar / Editar Desbravador */}
      {pfModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="text-base font-extrabold">
                {editingPf ? 'Editar Desbravador & Matrículas' : 'Cadastrar Novo Desbravador'}
              </h3>
              <button
                onClick={() => setPfModalOpen(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={handleSavePfSubmit}
              className="p-6 space-y-4 overflow-y-auto"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nome Completo do Desbravador *
                  </label>
                  <input
                    type="text"
                    required
                    value={pfName}
                    onChange={(e) => setPfName(e.target.value)}
                    placeholder="Ex: Lucas Gabriel Almeida"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Data de Nascimento *
                  </label>
                  <input
                    type="date"
                    required
                    value={pfBirthDate}
                    onChange={(e) => setPfBirthDate(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <span className="text-[11px] text-slate-500 mt-0.5 block">
                    Idade calculada em 2026: <strong>{calculateAge(pfBirthDate)} anos</strong>
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Unidade do Clube *
                  </label>
                  <select
                    value={pfUnitId}
                    onChange={(e) => setPfUnitId(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Sem Unidade</option>
                    {units.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Seleção de Classes (Regulares, Avançadas e Classes Agrupadas) */}
              <div className="border-t border-slate-200 pt-4">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <label className="text-xs font-bold text-slate-800">
                    Classes Matriculadas neste Ano *
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => applyAgeSuggestedClasses(false)}
                      className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[11px] font-bold cursor-pointer"
                    >
                      Sugerir pela Idade ({calculateAge(pfBirthDate)}a)
                    </button>
                    <button
                      type="button"
                      onClick={() => applyAgeSuggestedClasses(true)}
                      className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Layers className="w-3 h-3" />
                      Classes Agrupadas (10 até {calculateAge(pfBirthDate)}a)
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto p-1">
                  {(catalog.classes || []).map((cls) => {
                    const checked = pfClassSlugs.includes(cls.slug);
                    return (
                      <label
                        key={cls.slug}
                        className={`p-2.5 rounded-xl border text-xs flex items-center gap-2.5 cursor-pointer transition ${
                          checked
                            ? 'bg-indigo-50/70 border-indigo-400 font-bold text-slate-900'
                            : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleClassEnrollment(cls.slug)}
                          className="rounded text-indigo-600"
                        />
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: cls.color }}
                        />
                        <span className="truncate">{cls.name}</span>
                        <span className="ml-auto text-[10px] text-slate-400">
                          {cls.min_age}a
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Observações / Ficha Médica ou Pedagógica
                </label>
                <input
                  type="text"
                  value={pfNotes}
                  onChange={(e) => setPfNotes(e.target.value)}
                  placeholder="Opcional..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setPfModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingPf || pfClassSlugs.length === 0}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold cursor-pointer"
                >
                  {savingPf ? 'Salvando...' : 'Salvar Desbravador'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Nova Unidade */}
      {unitModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="text-base font-extrabold">Criar Nova Unidade</h3>
              <button
                onClick={() => setUnitModalOpen(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateUnitSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nome da Unidade *
                </label>
                <input
                  type="text"
                  required
                  value={unitName}
                  onChange={(e) => setUnitName(e.target.value)}
                  placeholder="Ex: Unidade Falcão Peregrino"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Gênero da Unidade
                </label>
                <select
                  value={unitGender}
                  onChange={(e) => setUnitGender(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm"
                >
                  <option value="M">Masculina</option>
                  <option value="F">Feminina</option>
                  <option value="X">Mista</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setUnitModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingUnit}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold cursor-pointer"
                >
                  {savingUnit ? 'Criando...' : 'Criar Unidade'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
