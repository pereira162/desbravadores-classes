import React, { useState, useMemo, useEffect } from 'react';
import {
  Search,
  CheckCircle2,
  Clock,
  ExternalLink,
  Zap,
  CheckSquare,
  Filter,
  Info,
  Users,
  X,
  Save,
} from 'lucide-react';
import { STATUS_CONFIG } from '../constants';
import { apiRequest, getAssetUrl } from '../api';
import PdfActionGroup from './PdfActionGroup';

const BASE_CLASSES = [
  { baseSlug: 'amigo', label: 'Amigo', age: 10, color: '#0072BC' },
  { baseSlug: 'companheiro', label: 'Companheiro', age: 11, color: '#D9272E' },
  { baseSlug: 'pesquisador', label: 'Pesquisador', age: 12, color: '#008C44' },
  { baseSlug: 'pioneiro', label: 'Pioneiro', age: 13, color: '#6D6E71' },
  { baseSlug: 'excursionista', label: 'Excursionista', age: 14, color: '#7A297B' },
  { baseSlug: 'guia', label: 'Guia', age: 15, color: '#E8B400' },
];

export default function ClassMatrixView({
  catalog,
  pathfinders,
  units,
  leaders = [],
  progressMap,
  classesMap,
  selectedBaseSlug,
  onSelectBaseSlug,
  selectedMode,
  onSelectMode,
  currentUser,
  settings,
  onRefresh,
  showToast,
  onOpenRequirementDetail,
  onOpenBulkSign,
  onQuickToggleCell,
  onSelectPathfinderCard,
}) {
  const [sectionFilter, setSectionFilter] = useState('ALL');
  const [unitFilter, setUnitFilter] = useState('ALL');
  const [instructorFilter, setInstructorFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [fastClickMode, setFastClickMode] = useState(false);
  const [busyCellKey, setBusyCellKey] = useState(null);
  const [distributionModalOpen, setDistributionModalOpen] = useState(false);
  const [distributionDraft, setDistributionDraft] = useState({});
  const [savingDistribution, setSavingDistribution] = useState(false);

  // Instrutores vinculados a esta classe base
  const classInstructors = useMemo(() => {
    return (leaders || []).filter(
      (l) =>
        l.active !== false &&
        (l.assigned_classes || []).some(
          (slug) => slug === selectedBaseSlug || slug === `${selectedBaseSlug}_avancado`
        )
    );
  }, [leaders, selectedBaseSlug]);

  // Se o usuário logado for instrutor desta classe com turma dividida, seleciona a turma dele por padrão
  useEffect(() => {
    if (
      currentUser?.role === 'INSTRUTOR' &&
      classInstructors.some((i) => i.id === currentUser.id) &&
      (currentUser.assigned_pathfinders || []).length > 0
    ) {
      setInstructorFilter(currentUser.id);
    } else {
      setInstructorFilter('ALL');
    }
  }, [selectedBaseSlug, currentUser?.id, classInstructors.length]);

  const regularClass = useMemo(
    () =>
      (catalog.classes || []).find(
        (c) => c.base_slug === selectedBaseSlug && c.type === 'REGULAR'
      ),
    [catalog.classes, selectedBaseSlug]
  );

  const advancedClass = useMemo(
    () =>
      (catalog.classes || []).find(
        (c) => c.base_slug === selectedBaseSlug && c.type === 'AVANCADA'
      ),
    [catalog.classes, selectedBaseSlug]
  );

  // Todos os desbravadores da classe (antes do filtro de instrutor) para o modal de divisão de turmas
  const allClassPathfinders = useMemo(() => {
    return pathfinders.filter((pf) => {
      if (!pf.active) return false;
      const slugs = (pf.enrollments || []).map((e) => e.class_slug);
      return (
        (regularClass && slugs.includes(regularClass.slug)) ||
        (advancedClass && slugs.includes(advancedClass.slug))
      );
    });
  }, [pathfinders, regularClass, advancedClass]);

  // Desbravadores matriculados na classe regular ou avançada selecionada (filtrados por unidade e instrutor)
  const enrolledPathfinders = useMemo(() => {
    const selectedInstructor =
      instructorFilter !== 'ALL'
        ? classInstructors.find((i) => i.id === instructorFilter)
        : null;
    const instructorPfSet =
      selectedInstructor && (selectedInstructor.assigned_pathfinders || []).length > 0
        ? new Set(selectedInstructor.assigned_pathfinders)
        : null;

    return pathfinders.filter((pf) => {
      if (!pf.active) return false;
      if (unitFilter !== 'ALL' && pf.unit_id !== unitFilter) return false;
      if (instructorPfSet && !instructorPfSet.has(pf.id)) return false;

      const slugs = (pf.enrollments || []).map((e) => e.class_slug);
      if (selectedMode === 'REGULAR') {
        return regularClass && slugs.includes(regularClass.slug);
      }
      if (selectedMode === 'AVANCADA') {
        return advancedClass && slugs.includes(advancedClass.slug);
      }
      return (
        (regularClass && slugs.includes(regularClass.slug)) ||
        (advancedClass && slugs.includes(advancedClass.slug))
      );
    });
  }, [
    pathfinders,
    unitFilter,
    instructorFilter,
    classInstructors,
    selectedMode,
    regularClass,
    advancedClass,
  ]);

  const handleOpenDistributionModal = () => {
    const draft = {};
    for (const inst of classInstructors) {
      const classPfIds = new Set(allClassPathfinders.map((p) => p.id));
      draft[inst.id] = (inst.assigned_pathfinders || []).filter((id) => classPfIds.has(id));
    }
    setDistributionDraft(draft);
    setDistributionModalOpen(true);
  };

  const handleToggleInstructorPf = (instructorId, pfId) => {
    setDistributionDraft((prev) => {
      const currentList = prev[instructorId] || [];
      const exists = currentList.includes(pfId);
      return {
        ...prev,
        [instructorId]: exists
          ? currentList.filter((id) => id !== pfId)
          : [...currentList, pfId],
      };
    });
  };

  const handleSaveDistribution = async (e) => {
    e.preventDefault();
    setSavingDistribution(true);
    try {
      await apiRequest(`/api/classes/${selectedBaseSlug}/instructor-distribution`, {
        method: 'PUT',
        body: JSON.stringify({ distribution: distributionDraft }),
      });
      setDistributionModalOpen(false);
      if (onRefresh) await onRefresh();
      if (showToast) {
        showToast('Divisão de desbravadores entre instrutores salva com sucesso!');
      }
    } catch (err) {
      if (showToast) showToast(err.message || 'Erro ao salvar divisão de turmas.', 'error');
    } finally {
      setSavingDistribution(false);
    }
  };

  // Requisitos da classe (Regular, Avançada ou Ambas)
  const classRequirements = useMemo(() => {
    return (catalog.requirements || []).filter((r) => {
      if (r.base_class_slug !== selectedBaseSlug) return false;
      if (selectedMode === 'REGULAR' && r.class_type !== 'REGULAR') return false;
      if (selectedMode === 'AVANCADA' && r.class_type !== 'AVANCADA') return false;
      return true;
    });
  }, [catalog.requirements, selectedBaseSlug, selectedMode]);

  // Seções disponíveis para o filtro
  const availableSections = useMemo(() => {
    const set = new Set();
    for (const r of classRequirements) {
      set.add(`${r.class_type === 'AVANCADA' ? '[Avançada] ' : ''}${r.section}`);
    }
    return Array.from(set);
  }, [classRequirements]);

  const filteredRequirements = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return classRequirements.filter((r) => {
      const secLabel = `${r.class_type === 'AVANCADA' ? '[Avançada] ' : ''}${r.section}`;
      if (sectionFilter !== 'ALL' && secLabel !== sectionFilter) return false;
      if (q) {
        const hay = `${r.code} ${r.marker} ${r.title} ${r.section}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [classRequirements, sectionFilter, searchQuery]);

  // Agrupa requisitos por seção para exibir cabeçalhos divisórios igual ao Cartão de Controle do Instrutor
  const groupedSections = useMemo(() => {
    const groups = [];
    let currentKey = null;
    for (const req of filteredRequirements) {
      const key = `${req.class_type}::${req.section}`;
      if (key !== currentKey) {
        currentKey = key;
        groups.push({
          key,
          classType: req.class_type,
          className: classesMap[req.class_slug]?.name || req.class_slug,
          section: req.section,
          items: [],
        });
      }
      groups[groups.length - 1].items.push(req);
    }
    return groups;
  }, [filteredRequirements, classesMap]);

  // Progresso percentual de cada desbravador nas linhas visíveis
  const pfColumnProgress = useMemo(() => {
    const map = {};
    for (const pf of enrolledPathfinders) {
      const enrolledSlugs = (pf.enrollments || []).map((e) => e.class_slug);
      const applicableReqs = classRequirements.filter((r) =>
        enrolledSlugs.includes(r.class_slug)
      );
      let approved = 0;
      let done = 0;
      for (const r of applicableReqs) {
        const st = progressMap[`${pf.id}:${r.id}`]?.status || 'PENDENTE';
        if (st === 'APROVADO') {
          approved += 1;
          done += 1;
        } else if (st === 'CONCLUIDO') {
          done += 1;
        }
      }
      const total = applicableReqs.length;
      map[pf.id] = {
        total,
        approved,
        done,
        pct: total > 0 ? Math.round((approved / total) * 100) : 0,
      };
    }
    return map;
  }, [enrolledPathfinders, classRequirements, progressMap]);

  const handleCellClick = async (pf, req, isEnrolledInReqClass) => {
    if (!isEnrolledInReqClass) return;

    if (!fastClickMode) {
      onOpenRequirementDetail(pf, req);
      return;
    }

    const cellKey = `${pf.id}:${req.id}`;
    setBusyCellKey(cellKey);
    try {
      await onQuickToggleCell(pf, req);
    } finally {
      setBusyCellKey(null);
    }
  };

  const canManageDistribution =
    ['ADMIN', 'GESTOR', 'DIRETOR', 'SECRETARIO'].includes(currentUser?.role) ||
    Boolean(currentUser?.permissions?.can_approve_all) ||
    classInstructors.some((i) => i.id === currentUser?.id);

  // Classes base visíveis conforme o escopo do usuário
  const visibleBaseClasses = useMemo(() => {
    const availableBaseSlugs = new Set((catalog.classes || []).map((c) => c.base_slug));
    const filtered = BASE_CLASSES.filter((bc) => availableBaseSlugs.has(bc.baseSlug));
    return filtered.length > 0 ? filtered : BASE_CLASSES;
  }, [catalog.classes]);

  return (
    <div className="space-y-5">
      {/* Seletor das Classes Base */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 no-print" data-tour="matrix-class-selector">
        {visibleBaseClasses.map((bc) => {
          const isSelected = selectedBaseSlug === bc.baseSlug;
          return (
            <button
              key={bc.baseSlug}
              onClick={() => {
                onSelectBaseSlug(bc.baseSlug);
                setSectionFilter('ALL');
              }}
              className={`p-3 rounded-2xl border text-left transition flex items-center gap-3 cursor-pointer ${
                isSelected
                  ? 'bg-slate-900 text-white border-slate-900 shadow-md'
                  : 'bg-white text-slate-800 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <img
                src={getAssetUrl(`/data/cartoes-oficiais/logos/logo_${bc.baseSlug}.png`)}
                alt={bc.label}
                className="w-9 h-9 object-contain shrink-0"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
              <div className="min-w-0">
                <div className="text-xs font-extrabold truncate">{bc.label}</div>
                <div
                  className={`text-[11px] font-medium ${
                    isSelected ? 'text-slate-300' : 'text-slate-500'
                  }`}
                >
                  {bc.age} anos
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Cabeçalho da Classe Selecionada + Links Oficiais + PDFs Separados por Instrutor */}
      {regularClass && (
        <div
          className="rounded-2xl p-5 text-white shadow-md flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4"
          style={{
            background: `linear-gradient(135deg, ${regularClass.color} 0%, #0f172a 100%)`,
          }}
        >
          <div className="flex items-start gap-4">
            <img
              src={regularClass.logo_file}
              alt={regularClass.name}
              className="w-14 h-14 object-contain bg-white/95 p-1.5 rounded-2xl shadow-sm shrink-0"
            />
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-extrabold">
                  Ficha de Controle do Instrutor: {regularClass.name}
                  {advancedClass ? ` & ${advancedClass.name}` : ''}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-white/20 backdrop-blur-xs">
                  {regularClass.min_age} anos
                </span>
              </div>
              <p className="text-xs text-white/85 mt-1">
                {enrolledPathfinders.length} desbravadores exibidos •{' '}
                {filteredRequirements.length} requisitos •{' '}
                {classInstructors.length > 0
                  ? `${classInstructors.length} instrutor(es) vinculado(s)`
                  : 'Sem instrutor específico'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 no-print" data-tour="matrix-pdf-actions">
            <PdfActionGroup
              docType="INSTRUCTOR_CONTROL"
              params={{
                classSlug: selectedBaseSlug,
                baseSlug: selectedBaseSlug,
                unitId: unitFilter,
                instructorId: instructorFilter,
              }}
              label="Controle do Instrutor (1 Pág)"
              colorScheme="amber"
            />
            {regularClass.source_url && (
              <a
                href={regularClass.source_url}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold flex items-center gap-1.5 backdrop-blur-xs transition"
              >
                <ExternalLink className="w-4 h-4" />
                Cartão Oficial DSA
              </a>
            )}
            <PdfActionGroup
              docType="MATRIX"
              params={{
                classSlug: selectedBaseSlug,
                baseSlug: selectedBaseSlug,
                mode: selectedMode,
                unitId: unitFilter,
                instructorId: instructorFilter,
              }}
              label="PDF da Matriz"
              colorScheme="white"
            />
          </div>
        </div>
      )}

      {/* Barra de Filtros da Matriz */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 no-print">
        <div className="flex flex-wrap items-center gap-2">
          {/* Alternador Regular / Avançada / Ambas */}
          <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200">
            {[
              { id: 'BOTH', label: 'Regular + Avançada' },
              { id: 'REGULAR', label: 'Só Regular' },
              { id: 'AVANCADA', label: 'Só Avançada' },
            ].map((m) => (
              <button
                key={m.id}
                onClick={() => {
                  onSelectMode(m.id);
                  setSectionFilter('ALL');
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  selectedMode === m.id
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>

          {/* Filtro por Instrutor / Turma (quando houver instrutores na classe) */}
          {classInstructors.length > 0 && (
            <div className="flex items-center gap-1.5 bg-amber-50 dark:bg-slate-800 border border-amber-300 dark:border-slate-700 rounded-xl px-3 py-1.5" data-tour="matrix-instructor-filter">
              <Users className="w-3.5 h-3.5 text-amber-600" />
              <select
                value={instructorFilter}
                onChange={(e) => setInstructorFilter(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none"
                title="Filtrar matriz e PDFs por instrutor da classe"
              >
                <option value="ALL">
                  Todos os Instrutores ({allClassPathfinders.length} desbravadores)
                </option>
                {classInstructors.map((inst) => {
                  const count = (inst.assigned_pathfinders || []).filter((id) =>
                    allClassPathfinders.some((p) => p.id === id)
                  ).length;
                  return (
                    <option key={inst.id} value={inst.id}>
                      {inst.name} {count > 0 ? `(${count} na turma)` : '(Turma completa)'}
                    </option>
                  );
                })}
              </select>

              {canManageDistribution && (
                <button
                  type="button"
                  onClick={handleOpenDistributionModal}
                  className="ml-1 px-2 py-0.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 text-[10px] font-extrabold transition cursor-pointer"
                  title="Dividir desbravadores desta classe entre os instrutores"
                >
                  Dividir Turmas
                </button>
              )}
            </div>
          )}

          {/* Filtro de Seção */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={sectionFilter}
              onChange={(e) => setSectionFilter(e.target.value)}
              className="bg-transparent text-xs font-semibold text-slate-700 focus:outline-none max-w-[220px]"
            >
              <option value="ALL">Todas as Seções ({classRequirements.length})</option>
              {availableSections.map((sec) => (
                <option key={sec} value={sec}>
                  {sec}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro de Unidade */}
          <select
            value={unitFilter}
            onChange={(e) => setUnitFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none"
          >
            <option value="ALL">Todas as Unidades</option>
            {units.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>

          {/* Busca por texto */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar requisito ou código..."
              className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 w-52"
            />
          </div>
        </div>

        {/* Toggle Modo Clique Rápido */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setFastClickMode((v) => !v)}
            className={`px-3.5 py-2 rounded-xl border text-xs font-bold flex items-center gap-2 transition cursor-pointer ${
              fastClickMode
                ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-xs'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
            title="Quando ativo, clicar na célula alterna diretamente o status sem abrir a janela de detalhes"
          >
            <Zap className="w-4 h-4" />
            Modo Clique Rápido: {fastClickMode ? 'ATIVADO' : 'Desativado'}
          </button>
        </div>
      </div>

      {/* Legenda de Cores */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-xs text-slate-600 no-print">
        <div className="flex flex-wrap items-center gap-4">
          {Object.values(STATUS_CONFIG).map((st) => (
            <div key={st.code} className="flex items-center gap-1.5">
              <span className={`w-3 h-3 rounded-full ${st.dotClass}`} />
              <span className="font-medium">{st.label}</span>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-1 text-slate-500">
          <Info className="w-3.5 h-3.5" />
          <span>
            {fastClickMode
              ? 'Clique na célula para avançar o status instantaneamente.'
              : 'Clique na célula para preencher subitens (a, b, c...) e observações.'}
          </span>
        </div>
      </div>

      {/* Tabela Matriz (Requisitos x Desbravadores) */}
      {enrolledPathfinders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center text-slate-500">
          Nenhum desbravador matriculado nesta classe para o filtro de unidade selecionado.
        </div>
      ) : (
        <div
          id="matrix-table-container"
          data-tour="matrix-grid-table"
          className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden"
        >
          <div className="overflow-auto max-h-[calc(100vh-140px)] matrix-scroll">
            <table className="w-max min-w-full border-collapse text-left">
              <thead className="sticky top-0 z-30 shadow-xs">
                <tr className="bg-slate-900 text-white border-b border-slate-800">
                  <th className="sticky left-0 top-0 z-40 bg-slate-900 px-3 sm:px-4 py-3.5 min-w-[180px] sm:min-w-[320px] max-w-[220px] sm:max-w-[400px] text-xs font-extrabold uppercase tracking-wider border-r border-slate-800">
                    Requisito Oficial
                  </th>
                  <th className="sticky top-0 z-30 bg-slate-900 px-2 sm:px-2.5 py-3.5 text-center text-[11px] font-bold uppercase tracking-wider border-r border-slate-800 w-20 sm:w-24 no-print">
                    Lote
                  </th>
                  {enrolledPathfinders.map((pf) => {
                    const stat = pfColumnProgress[pf.id] || { pct: 0, approved: 0, total: 0 };
                    return (
                      <th
                        key={pf.id}
                        className="sticky top-0 z-30 bg-slate-900 px-2 sm:px-2.5 py-3 text-center min-w-[100px] sm:min-w-[110px] max-w-[130px] border-r border-slate-800 align-bottom"
                      >
                        <button
                          onClick={() => onSelectPathfinderCard(pf.id)}
                          className="text-xs font-bold text-white hover:text-amber-300 transition line-clamp-1 cursor-pointer mx-auto"
                          title={`Abrir Cartão Virtual de ${pf.name}`}
                        >
                          {pf.name.split(' ').slice(0, 2).join(' ')}
                        </button>
                        <div className="text-[10px] text-slate-400 truncate">
                          {pf.unit_name}
                        </div>
                        <div className="mt-1.5 flex items-center justify-center gap-1">
                          <span
                            className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded ${
                              stat.pct >= 85
                                ? 'bg-emerald-500/20 text-emerald-300'
                                : stat.pct >= 50
                                ? 'bg-amber-500/20 text-amber-300'
                                : 'bg-rose-500/20 text-rose-300'
                            }`}
                          >
                            {stat.pct}% ({stat.approved}/{stat.total})
                          </span>
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200">
                {groupedSections.map((group) => (
                  <React.Fragment key={group.key}>
                    {/* Linha divisória da Seção */}
                    <tr className="bg-slate-100/95 dark:bg-slate-800/95 border-y border-slate-300 dark:border-slate-700">
                      <td
                        colSpan={enrolledPathfinders.length + 2}
                        className="px-4 py-2 text-xs font-extrabold uppercase tracking-wider text-slate-800 dark:text-slate-200"
                      >
                        <span
                          className={`inline-block px-2 py-0.5 rounded mr-2 text-[10px] text-white ${
                            group.classType === 'AVANCADA'
                              ? 'bg-amber-600'
                              : 'bg-slate-700'
                          }`}
                        >
                          {group.className}
                        </span>
                        {group.section}
                      </td>
                    </tr>

                    {group.items.map((req) => {
                      const subCount = req.subitems?.length || 0;
                      return (
                        <tr
                          key={req.id}
                          className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition group"
                        >
                          {/* Coluna Fixa: Descrição do Requisito */}
                          <td className="sticky left-0 z-10 bg-white dark:bg-slate-900 group-hover:bg-slate-50 dark:group-hover:bg-slate-850 px-3 sm:px-4 py-3 border-r border-slate-200 dark:border-slate-800 align-top min-w-[180px] sm:min-w-[320px] max-w-[220px] sm:max-w-[400px]">
                            <div className="flex items-start gap-2.5">
                              <span
                                className="px-2 py-0.5 rounded text-[11px] font-extrabold text-white shrink-0 mt-0.5"
                                style={{
                                  backgroundColor:
                                    classesMap[req.class_slug]?.color || '#334155',
                                }}
                              >
                                {req.code}
                              </span>
                              <div className="min-w-0">
                                <div className="text-xs text-slate-900 font-medium leading-relaxed">
                                  <strong className="font-bold text-slate-950 mr-1">
                                    {req.marker}
                                  </strong>
                                  {req.title}
                                </div>
                                {subCount > 0 && (
                                  <div className="mt-1 space-y-0.5 text-[10px] text-slate-600 font-normal">
                                    {req.subitems.map((s) => (
                                      <div key={s.key} className="leading-snug">
                                        <strong className="font-bold text-slate-700">{s.key})</strong> {s.text}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Botão de Aprovar Linha em Lote */}
                          <td className="px-2 py-2.5 text-center border-r border-slate-200 align-middle no-print">
                            <button
                              onClick={() =>
                                onOpenBulkSign(req, enrolledPathfinders)
                              }
                              className="px-2 py-1 rounded-lg border border-slate-200 hover:border-emerald-400 hover:bg-emerald-50 text-[11px] font-bold text-slate-700 hover:text-emerald-800 inline-flex items-center gap-1 transition cursor-pointer"
                              title="Assinar este requisito para vários desbravadores de uma só vez"
                            >
                              <CheckSquare className="w-3.5 h-3.5 text-emerald-600" />
                              Linha
                            </button>
                          </td>

                          {/* Células de cada Desbravador */}
                          {enrolledPathfinders.map((pf) => {
                            const isEnrolledInReqClass = pf.enrollments?.some(
                              (e) => e.class_slug === req.class_slug
                            );
                            if (!isEnrolledInReqClass) {
                              return (
                                <td
                                  key={pf.id}
                                  className="px-2 py-2 text-center border-r border-slate-100 bg-slate-50/60 text-[10px] text-slate-300"
                                  title="Desbravador não matriculado nesta modalidade"
                                >
                                  N/M
                                </td>
                              );
                            }

                            const pr = progressMap[`${pf.id}:${req.id}`];
                            const st = pr?.status || 'PENDENTE';
                            const cfg = STATUS_CONFIG[st] || STATUS_CONFIG.PENDENTE;
                            const isBusy = busyCellKey === `${pf.id}:${req.id}`;

                            // Calcula subitens concluídos se houver
                            const completedSubCount =
                              subCount > 0 && pr?.completed_subitems
                                ? Object.values(pr.completed_subitems).filter(Boolean)
                                    .length
                                : 0;

                            return (
                              <td
                                key={pf.id}
                                className="p-1.5 border-r border-slate-100 align-middle text-center"
                              >
                                <button
                                  onClick={() =>
                                    handleCellClick(pf, req, isEnrolledInReqClass)
                                  }
                                  disabled={isBusy}
                                  className={`w-full py-2 px-1.5 rounded-xl border text-[11px] transition flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
                                    st === 'PENDENTE'
                                      ? `${cfg.cellClass} bg-white border-slate-300`
                                      : cfg.cellClass
                                  }`}
                                  title={`${pf.name} — ${req.code}: ${cfg.label}${
                                    pr?.notes ? `\nObs: ${pr.notes}` : ''
                                  }`}
                                >
                                  {isBusy ? <span>...</span> : <span>{cfg.shortLabel}</span>}
                                  {subCount > 0 && (
                                    <span className="text-[9px] opacity-80 font-normal">
                                      {st === 'APROVADO'
                                        ? `${subCount}/${subCount}`
                                        : `${completedSubCount}/${subCount}`}
                                    </span>
                                  )}
                                </button>
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal de Divisão de Desbravadores entre Múltiplos Instrutores da Classe */}
      {distributionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold">
                    Dividir Turmas • Classe {regularClass?.name || selectedBaseSlug}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Distribua os desbravadores entre os instrutores desta classe para gerar listas e PDFs separados
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDistributionModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDistribution} className="flex-1 overflow-y-auto p-6 space-y-5">
              <p className="text-xs text-slate-600 dark:text-slate-300">
                Selecione abaixo quais desbravadores pertencem à turma de cada instrutor. Se um instrutor ficar sem nenhum desbravador marcado, ele continuará visualizando a classe completa.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {classInstructors.map((inst) => {
                  const selectedIds = distributionDraft[inst.id] || [];
                  return (
                    <div
                      key={inst.id}
                      className="p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 space-y-3"
                    >
                      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
                        <div>
                          <div className="text-sm font-extrabold text-slate-900 dark:text-white">
                            {inst.name}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {inst.custom_role_title || inst.role} • {selectedIds.length} selecionado(s)
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            setDistributionDraft((prev) => ({
                              ...prev,
                              [inst.id]:
                                selectedIds.length === allClassPathfinders.length
                                  ? []
                                  : allClassPathfinders.map((p) => p.id),
                            }))
                          }
                          className="text-[11px] font-bold text-amber-600 hover:underline cursor-pointer"
                        >
                          {selectedIds.length === allClassPathfinders.length
                            ? 'Limpar todos'
                            : 'Marcar todos'}
                        </button>
                      </div>

                      <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                        {allClassPathfinders.map((pf) => {
                          const checked = selectedIds.includes(pf.id);
                          return (
                            <label
                              key={pf.id}
                              className={`flex items-center justify-between p-2 rounded-xl border text-xs cursor-pointer transition ${
                                checked
                                  ? 'bg-amber-50 dark:bg-slate-900 border-amber-400 font-bold text-slate-900 dark:text-white'
                                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={() => handleToggleInstructorPf(inst.id, pf.id)}
                                  className="rounded text-amber-500"
                                />
                                <span>{pf.name}</span>
                              </div>
                              <span className="text-[10px] text-slate-400">{pf.unit_name}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setDistributionModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingDistribution}
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-sm cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  {savingDistribution ? 'Salvando...' : 'Salvar Divisão de Turmas'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
