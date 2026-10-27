import React, { useState, useMemo, useRef } from 'react';
import {
  Search,
  Filter,
  Layers,
  ListFilter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Users,
  CalendarPlus,
  CheckSquare,
  ChevronDown,
  ChevronUp,
  FileDown,
  Printer,
  Sparkles,
  RotateCcw,
} from 'lucide-react';
import { STATUS_CONFIG, EXECUTION_CONTEXT_LABELS } from '../constants';
import { exportElementToPdf } from '../utils/pdfExport';

export default function DemandPlanningView({
  catalog,
  pathfinders,
  units,
  progressMap,
  classesMap,
  onOpenRequirementDetail,
  onOpenBulkSign,
  onCreateEventFromDemand,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [classTypeFilter, setClassTypeFilter] = useState('ALL'); // ALL | REGULAR | AVANCADA
  const [baseClassFilter, setBaseClassFilter] = useState('ALL'); // ALL | amigo | companheiro...
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [tagFilter, setTagFilter] = useState('ALL');
  const [unitFilter, setUnitFilter] = useState('ALL');
  const [onlyPending, setOnlyPending] = useState(true);
  const [viewMode, setViewMode] = useState('REQUIREMENTS'); // REQUIREMENTS | EQUIVALENCE
  const [sortBy, setSortBy] = useState('MOST_PENDING'); // MOST_PENDING | CARD_ORDER
  const [expandedIds, setExpandedIds] = useState({});
  const [exportingPdf, setExportingPdf] = useState(false);
  const planningRef = useRef(null);

  const activePathfinders = useMemo(
    () =>
      pathfinders.filter(
        (pf) => pf.active && (unitFilter === 'ALL' || pf.unit_id === unitFilter)
      ),
    [pathfinders, unitFilter]
  );

  // Requisitos administrativos que não dependem de planejamento anual (idade, membro ativo)
  const isNonPlanningRequirement = (req) => {
    const code = req.code;
    const title = (req.title || '').toLowerCase();
    if (code === 'I.1' && title.includes('idade')) return true;
    if (code === 'I.2' && title.includes('membro ativo')) return true;
    return false;
  };

  // Calcula a demanda real dos requisitos curriculares com base nos desbravadores matriculados
  const enrichedRequirements = useMemo(() => {
    return (catalog.requirements || [])
      .filter((req) => !isNonPlanningRequirement(req))
      .map((req) => {
      const enrolledPfs = activePathfinders.filter((pf) =>
        pf.enrollments?.some((enr) => enr.class_slug === req.class_slug)
      );

      const pendingList = [];
      const inProgressList = [];
      const awaitingApprovalList = [];
      const approvedList = [];

      for (const pf of enrolledPfs) {
        const pr = progressMap[`${pf.id}:${req.id}`];
        const st = pr?.status || 'PENDENTE';
        const item = { pathfinder: pf, progress: pr, status: st };
        if (st === 'APROVADO') {
          approvedList.push(item);
        } else if (st === 'CONCLUIDO') {
          awaitingApprovalList.push(item);
        } else if (st === 'EM_ANDAMENTO') {
          inProgressList.push(item);
        } else {
          pendingList.push(item);
        }
      }

      // Todos que ainda NÃO estão 100% APROVADOS (ou que ainda precisam fazer/validar)
      const needActionList = [...pendingList, ...inProgressList, ...awaitingApprovalList];

      return {
        ...req,
        classInfo: classesMap[req.class_slug],
        enrolledCount: enrolledPfs.length,
        pendingCount: pendingList.length + inProgressList.length,
        awaitingCount: awaitingApprovalList.length,
        needActionCount: needActionList.length,
        approvedCount: approvedList.length,
        needActionList,
        approvedList,
      };
    });
  }, [catalog.requirements, activePathfinders, progressMap, classesMap]);

  // Contadores rápidos por Tag de Contexto (quantos requisitos têm demanda pendente em cada tag)
  const tagStats = useMemo(() => {
    const counts = {};
    for (const tag of catalog.contextTags || []) {
      counts[tag.id] = { reqCount: 0, pendingPfsCount: 0 };
    }
    for (const r of enrichedRequirements) {
      if (classTypeFilter !== 'ALL' && r.class_type !== classTypeFilter) continue;
      if (baseClassFilter !== 'ALL' && r.base_class_slug !== baseClassFilter) continue;
      for (const t of r.tags || []) {
        if (counts[t]) {
          if (r.needActionCount > 0) {
            counts[t].reqCount += 1;
            counts[t].pendingPfsCount += r.needActionCount;
          }
        }
      }
    }
    return counts;
  }, [enrichedRequirements, catalog.contextTags, classTypeFilter, baseClassFilter]);

  // Filtra os requisitos conforme os controles selecionados
  const filteredRequirements = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = enrichedRequirements.filter((r) => {
      if (classTypeFilter !== 'ALL' && r.class_type !== classTypeFilter) return false;
      if (baseClassFilter !== 'ALL' && r.base_class_slug !== baseClassFilter) return false;
      if (categoryFilter !== 'ALL' && r.category !== categoryFilter) return false;
      if (tagFilter !== 'ALL' && !(r.tags || []).includes(tagFilter)) return false;
      if (onlyPending && r.needActionCount === 0) return false;

      if (q) {
        const inTitle = r.title.toLowerCase().includes(q);
        const inCode = r.code.toLowerCase().includes(q);
        const inDesc = r.description.toLowerCase().includes(q);
        const inClass = (r.classInfo?.name || '').toLowerCase().includes(q);
        const inSubs = (r.sub_items || []).some((s) => s.text.toLowerCase().includes(q));
        if (!inTitle && !inCode && !inDesc && !inClass && !inSubs) return false;
      }
      return true;
    });

    if (sortBy === 'MOST_PENDING') {
      return [...list].sort(
        (a, b) => b.needActionCount - a.needActionCount || a.display_order - b.display_order
      );
    }
    return [...list].sort((a, b) => a.display_order - b.display_order);
  }, [
    enrichedRequirements,
    classTypeFilter,
    baseClassFilter,
    categoryFilter,
    tagFilter,
    onlyPending,
    searchQuery,
    sortBy,
  ]);

  // Agrupamento por Grupos de Equivalência Inter-classes
  const equivalenceGroupsData = useMemo(() => {
    const groupsMap = {};
    for (const eq of catalog.equivalenceGroups || []) {
      groupsMap[eq.id] = {
        ...eq,
        requirements: [],
        uniquePendingPathfinders: new Map(),
        totalPendingInstances: 0,
      };
    }

    for (const r of filteredRequirements) {
      const gid = r.equivalence_group;
      if (!gid) continue;
      if (!groupsMap[gid]) {
        groupsMap[gid] = {
          id: gid,
          title: gid,
          description: '',
          requirements: [],
          uniquePendingPathfinders: new Map(),
          totalPendingInstances: 0,
        };
      }
      groupsMap[gid].requirements.push(r);
      groupsMap[gid].totalPendingInstances += r.needActionCount;
      for (const item of r.needActionList) {
        groupsMap[gid].uniquePendingPathfinders.set(item.pathfinder.id, item.pathfinder);
      }
    }

    return Object.values(groupsMap)
      .filter((g) => g.requirements.length > 0)
      .sort((a, b) => b.totalPendingInstances - a.totalPendingInstances);
  }, [filteredRequirements, catalog.equivalenceGroups]);

  const toggleExpand = (id) => {
    setExpandedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const resetFilters = () => {
    setSearchQuery('');
    setClassTypeFilter('ALL');
    setBaseClassFilter('ALL');
    setCategoryFilter('ALL');
    setTagFilter('ALL');
    setUnitFilter('ALL');
    setOnlyPending(true);
  };

  const totalPendingParticipations = useMemo(
    () => filteredRequirements.reduce((acc, r) => acc + r.needActionCount, 0),
    [filteredRequirements]
  );

  return (
    <div className="space-y-5">
      {/* Cabeçalho da Matriz de Demanda */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-600 mb-1">
            <Sparkles className="w-4 h-4" />
            Planejamento Anual Orientado à Demanda Real
          </div>
          <h2 className="text-xl font-extrabold text-slate-900">
            O que o Clube ainda precisa fazer este ano?
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
            Filtre por local (Ao Ar Livre, Acampamento, Igreja, Comunidade), especialidades ou classe e
            veja exatamente <strong>quantos e quais desbravadores</strong> ainda precisam cumprir cada
            atividade.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 no-print">
          <div className="flex rounded-xl bg-slate-100 p-1 border border-slate-200">
            <button
              type="button"
              onClick={() => setViewMode('REQUIREMENTS')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                viewMode === 'REQUIREMENTS'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ListFilter className="w-3.5 h-3.5 text-amber-600" />
              Por Atividade ({filteredRequirements.length})
            </button>
            <button
              type="button"
              onClick={() => setViewMode('EQUIVALENCE')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                viewMode === 'EQUIVALENCE'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-emerald-600" />
              Unificar entre Classes ({equivalenceGroupsData.length})
            </button>
          </div>

          <button
            type="button"
            onClick={async () => {
              const targetEl = planningRef.current || document.getElementById('planning-content-container');
              if (!targetEl) return;
              setExportingPdf(true);
              try {
                await exportElementToPdf(targetEl, {
                  filenamePrefix: `planejamento_demanda_${viewMode.toLowerCase()}`,
                  orientation: 'portrait',
                  scale: 2,
                  marginMm: 5,
                });
              } catch (err) {
                console.error('Erro ao gerar PDF do planejamento:', err);
                alert('Não foi possível gerar o PDF. Tente novamente.');
              } finally {
                setExportingPdf(false);
              }
            }}
            disabled={exportingPdf}
            className="px-3.5 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <FileDown className="w-4 h-4" />
            {exportingPdf ? 'Gerando PDF...' : 'Baixar PDF do Planejamento'}
          </button>
        </div>
      </div>

      {/* Pílulas Rápidas de Filtro por Local / Formato (Tags) */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs no-print">
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-amber-600" />
            Filtro Rápido por Contexto / Tipo de Atividade:
          </span>
          {tagFilter !== 'ALL' && (
            <button
              type="button"
              onClick={() => setTagFilter('ALL')}
              className="text-xs font-bold text-amber-700 hover:underline cursor-pointer"
            >
              Mostrar Todos os Locais/Formatos
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => setTagFilter('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
              tagFilter === 'ALL'
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
            }`}
          >
            Todas as Tags
          </button>
          {(catalog.contextTags || []).map((tag) => {
            const st = tagStats[tag.id] || { reqCount: 0, pendingPfsCount: 0 };
            const active = tagFilter === tag.id;
            return (
              <button
                key={tag.id}
                type="button"
                onClick={() => setTagFilter(active ? 'ALL' : tag.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition flex items-center gap-1.5 cursor-pointer ${
                  active
                    ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                    : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                }`}
              >
                <span>{tag.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    active
                      ? 'bg-black/25 text-white'
                      : st.reqCount > 0
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  {st.reqCount}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Barra Completa de Filtros Combinados */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3 no-print">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          {/* Busca Livre */}
          <div className="lg:col-span-2 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar requisito, especialidade, nó, verso..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:border-amber-600 outline-none"
            />
          </div>

          {/* Classe */}
          <div>
            <select
              value={baseClassFilter}
              onChange={(e) => setBaseClassFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 bg-white outline-none"
            >
              <option value="ALL">Todas as Classes (10–15 anos)</option>
              <option value="amigo">🔵 Amigo (10 anos)</option>
              <option value="companheiro">🔴 Companheiro (11 anos)</option>
              <option value="pesquisador">🟢 Pesquisador (12 anos)</option>
              <option value="pioneiro">⚪ Pioneiro (13 anos)</option>
              <option value="excursionista">🟣 Excursionista (14 anos)</option>
              <option value="guia">🟡 Guia (15 anos)</option>
            </select>
          </div>

          {/* Modalidade: Regular vs Avançada */}
          <div>
            <select
              value={classTypeFilter}
              onChange={(e) => setClassTypeFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 bg-white outline-none"
            >
              <option value="ALL">Regular + Avançada (212)</option>
              <option value="REGULAR">Apenas Classes Regulares (149)</option>
              <option value="AVANCADA">Apenas Classes Avançadas (63)</option>
            </select>
          </div>

          {/* Categoria Temática */}
          <div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 bg-white outline-none"
            >
              <option value="ALL">Todas as Categorias (10)</option>
              {(catalog.categories || []).map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Unidade */}
          <div>
            <select
              value={unitFilter}
              onChange={(e) => setUnitFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 bg-white outline-none"
            >
              <option value="ALL">Todas as Unidades</option>
              {units.map((u) => (
                <option key={u.id} value={u.id}>
                  Unidade: {u.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Segunda linha da barra: Ordenação, Toggle de Pendentes e Resumo */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 text-xs">
          <div className="flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-2 font-bold text-slate-700 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={onlyPending}
                onChange={(e) => setOnlyPending(e.target.checked)}
                className="rounded border-slate-300 text-amber-600 focus:ring-amber-500"
              />
              Mostrar apenas atividades com desbravadores pendentes
            </label>

            <div className="flex items-center gap-1.5 text-slate-600">
              <span>Ordenar:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="font-bold text-slate-800 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200 outline-none"
              >
                <option value="MOST_PENDING">Maior nº de desbravadores pendentes</option>
                <option value="CARD_ORDER">Ordem oficial do cartão (Amigo ➔ Guia)</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-slate-600">
              Exibindo <strong>{filteredRequirements.length}</strong> atividades •{' '}
              <strong className="text-rose-600">{totalPendingParticipations}</strong> pendências de
              desbravadores
            </span>
            <button
              type="button"
              onClick={resetFilters}
              className="text-slate-500 hover:text-slate-900 font-semibold flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Limpar Filtros
            </button>
          </div>
        </div>
      </div>

      {/* =====================================================================
          CONTEÚDO DO PLANEJAMENTO (CAPTURADO PARA PDF)
         ===================================================================== */}
      <div id="planning-content-container" ref={planningRef} className="space-y-4">
        {/* Cabeçalho exclusivo para o PDF do Planejamento Anual */}
        <div className="hidden pdf-show-block pdf-item bg-white rounded-2xl border-b-2 border-slate-900 p-4 mb-2">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                MINISTÉRIO DOS DESBRAVADORES • DIVISÃO SUL-AMERICANA
              </div>
              <h1 className="text-lg font-black uppercase text-slate-950">
                PLANEJAMENTO ANUAL DE CLASSES —{' '}
                {viewMode === 'EQUIVALENCE'
                  ? `UNIFICAÇÕES ENTRE CLASSES (${equivalenceGroupsData.length} GRUPOS)`
                  : `MAPA DE DEMANDAS POR ATIVIDADE (${filteredRequirements.length} ATIVIDADES)`}
              </h1>
            </div>
            <div className="text-right text-xs font-bold text-slate-700">
              <div>Ano Curricular: 2026</div>
              <div>{totalPendingParticipations} pendências de desbravadores mapeadas</div>
            </div>
          </div>
        </div>

        {viewMode === 'EQUIVALENCE' ? (
          <div className="space-y-4">
          {equivalenceGroupsData.map((group) => {
            const uniquePfs = Array.from(group.uniquePendingPathfinders.values());
            return (
              <div
                key={group.id}
                className="pdf-item bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden print-break-inside-avoid"
              >
                <div className="p-4 sm:p-5 bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 mb-0.5">
                      Grupo de Equivalência Inter-Classes ({group.requirements.length} requisitos unificados)
                    </div>
                    <h3 className="text-base sm:text-lg font-extrabold">{group.title}</h3>
                    <p className="text-xs text-slate-300 mt-0.5">{group.description}</p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0 no-print">
                    <span className="px-3 py-1.5 rounded-xl bg-rose-500/20 border border-rose-400/30 text-rose-200 text-xs font-extrabold">
                      {uniquePfs.length} desbravador(es) precisam
                    </span>
                    <button
                      type="button"
                      onClick={() => onOpenBulkSign(group.requirements)}
                      className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <CheckSquare className="w-3.5 h-3.5" />
                      Dar Baixa no Grupo
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        onCreateEventFromDemand({
                          title: group.title,
                          description: group.description,
                          requirements: group.requirements,
                          attendees: uniquePfs,
                        })
                      }
                      className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <CalendarPlus className="w-3.5 h-3.5" />
                      Agendar Evento Unificado
                    </button>
                  </div>
                </div>

                <div className="divide-y divide-slate-100">
                  {group.requirements.map((req) => (
                    <div key={req.id} className="p-4 hover:bg-slate-50/70 transition">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                        <div className="space-y-1 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className="px-2 py-0.5 rounded text-[11px] font-bold text-white"
                              style={{ backgroundColor: req.classInfo?.color_hex || '#334155' }}
                            >
                              {req.classInfo?.name}
                            </span>
                            <span className="text-xs font-extrabold text-slate-900">
                              {req.code} — {req.title}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 leading-relaxed">{req.description}</p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 border border-rose-200">
                            Faltam {req.needActionCount} de {req.enrolledCount}
                          </span>
                        </div>
                      </div>

                      {/* Lista de Desbravadores Pendentes neste item */}
                      {req.needActionList.length > 0 && (
                        <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                          <span className="text-[11px] font-bold text-slate-500 mr-1">
                            Quem precisa fazer:
                          </span>
                          {req.needActionList.map(({ pathfinder, progress, status }) => {
                            const stCfg = STATUS_CONFIG[status] || STATUS_CONFIG.PENDENTE;
                            return (
                              <button
                                key={pathfinder.id}
                                type="button"
                                onClick={() =>
                                  onOpenRequirementDetail(req, pathfinder, progress)
                                }
                                className={`px-2 py-0.5 rounded-md border text-[11px] font-semibold flex items-center gap-1 hover:brightness-95 transition cursor-pointer ${stCfg.bgClass}`}
                              >
                                <span className={`w-1.5 h-1.5 rounded-full ${stCfg.dotClass}`} />
                                <span>{pathfinder.name}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* =====================================================================
           MODO 2: LISTA DINÂMICA DE ATIVIDADES (PADRÃO)
           ===================================================================== */
        <div className="space-y-3">
          {filteredRequirements.length === 0 ? (
            <div className="bg-white rounded-2xl p-10 border border-slate-200 text-center space-y-2">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
              <h3 className="text-base font-bold text-slate-800">
                Nenhuma atividade pendente encontrada para este filtro!
              </h3>
              <p className="text-xs text-slate-500">
                Tente limpar os filtros ou desmarcar a opção "Mostrar apenas atividades com desbravadores pendentes".
              </p>
            </div>
          ) : (
            filteredRequirements.map((req) => {
              const isExpanded = Boolean(expandedIds[req.id]);
              const ctxInfo =
                EXECUTION_CONTEXT_LABELS[req.execution_context] ||
                EXECUTION_CONTEXT_LABELS.REUNIAO_CLUBE;
              const pctDone =
                req.enrolledCount > 0
                  ? Math.round((req.approvedCount / req.enrolledCount) * 100)
                  : 0;

              return (
                <div
                  key={req.id}
                  className="pdf-item bg-white rounded-2xl border border-slate-200 shadow-xs hover:border-slate-300 transition overflow-hidden print-break-inside-avoid"
                >
                  <div className="p-4 sm:p-5">
                    <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                      {/* Informações da Atividade */}
                      <div className="space-y-2 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className="px-2.5 py-0.5 rounded-md text-xs font-extrabold text-white shadow-2xs"
                            style={{ backgroundColor: req.classInfo?.color_hex || '#334155' }}
                          >
                            {req.classInfo?.name} ({req.classInfo?.min_age} anos)
                          </span>
                          <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                            {req.section_code}. {req.section_name}
                          </span>
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded ${ctxInfo.badge}`}>
                            {ctxInfo.label}
                          </span>
                          {(req.tags || []).map((t) => (
                            <span
                              key={t}
                              onClick={() => setTagFilter(t)}
                              className="text-[11px] font-mono text-slate-500 bg-slate-100 hover:bg-amber-100 hover:text-amber-800 px-2 py-0.5 rounded cursor-pointer transition"
                            >
                              #{t}
                            </span>
                          ))}
                        </div>

                        <div>
                          <h3 className="text-base font-extrabold text-slate-900">
                            Requisito {req.code} — {req.title}
                          </h3>
                          <p className="text-xs sm:text-sm text-slate-700 mt-1 leading-relaxed">
                            {req.description}
                          </p>
                        </div>

                        {/* Sub-itens resumidos se existirem */}
                        {req.sub_items && req.sub_items.length > 0 && (
                          <div className="pt-1 flex flex-wrap gap-1.5">
                            {req.sub_items.map((sub) => (
                              <span
                                key={sub.code}
                                className="text-[11px] bg-slate-50 border border-slate-200 text-slate-700 px-2 py-0.5 rounded"
                              >
                                <strong>{sub.code})</strong> {sub.text}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Painel Direito: Contador de Demanda e Ações Rápidas */}
                      <div className="lg:w-72 shrink-0 flex flex-col justify-between bg-slate-50 rounded-xl p-3.5 border border-slate-200/80 space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                              Demanda na Classe
                            </span>
                            {req.needActionCount > 0 ? (
                              <span className="text-sm font-extrabold text-rose-600">
                                Faltam {req.needActionCount} desbravador(es)
                              </span>
                            ) : (
                              <span className="text-sm font-extrabold text-emerald-600">
                                ✓ 100% Concluído na Classe
                              </span>
                            )}
                          </div>
                          <span className="text-xs font-bold text-slate-600">
                            {req.approvedCount}/{req.enrolledCount} prontos
                          </span>
                        </div>

                        {/* Barra de progresso da atividade */}
                        <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                          <div
                            className="h-full bg-emerald-500 transition-all"
                            style={{ width: `${pctDone}%` }}
                          />
                        </div>

                        <div className="flex items-center gap-2 no-print">
                          <button
                            type="button"
                            onClick={() => onOpenBulkSign([req])}
                            className="flex-1 py-1.5 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1 transition cursor-pointer"
                          >
                            <CheckSquare className="w-3.5 h-3.5" />
                            Dar Baixa
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              onCreateEventFromDemand({
                                title: `${req.classInfo?.name}: ${req.title}`,
                                description: req.description,
                                requirements: [req],
                                attendees: req.needActionList.map((i) => i.pathfinder),
                              })
                            }
                            className="py-1.5 px-2.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-900 border border-amber-400/50 text-xs font-bold flex items-center justify-center gap-1 transition cursor-pointer"
                            title="Criar evento com esta atividade"
                          >
                            <CalendarPlus className="w-3.5 h-3.5" />
                            Agendar
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Lista nominal imediata de QUEM AINDA PRECISA FAZER */}
                    <div className="mt-3 pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-xs font-bold text-rose-700 flex items-center gap-1 mr-1">
                          <Users className="w-3.5 h-3.5" />
                          Ainda precisam fazer ({req.needActionList.length}):
                        </span>
                        {req.needActionList.length === 0 ? (
                          <span className="text-xs text-emerald-700 font-semibold">
                            Todos os desbravadores matriculados já cumpriram!
                          </span>
                        ) : (
                          req.needActionList.map(({ pathfinder, progress, status }) => {
                            const stCfg = STATUS_CONFIG[status] || STATUS_CONFIG.PENDENTE;
                            return (
                              <button
                                key={pathfinder.id}
                                type="button"
                                onClick={() =>
                                  onOpenRequirementDetail(req, pathfinder, progress)
                                }
                                title="Clique para abrir e assinar para este desbravador"
                                className={`px-2.5 py-1 rounded-lg border text-xs font-bold flex items-center gap-1.5 hover:shadow-xs transition cursor-pointer ${stCfg.bgClass}`}
                              >
                                <span className={`w-2 h-2 rounded-full ${stCfg.dotClass}`} />
                                <span>{pathfinder.name}</span>
                                <span className="text-[10px] opacity-75 font-normal">
                                  ({pathfinder.unit_name || 'S/U'})
                                </span>
                              </button>
                            );
                          })
                        )}
                      </div>

                      {req.approvedList.length > 0 && (
                        <button
                          type="button"
                          onClick={() => toggleExpand(req.id)}
                          className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1 shrink-0 cursor-pointer no-print"
                        >
                          {isExpanded ? (
                            <>
                              Ocultar concluídos ({req.approvedList.length})
                              <ChevronUp className="w-3.5 h-3.5" />
                            </>
                          ) : (
                            <>
                              Ver quem já concluiu ({req.approvedList.length})
                              <ChevronDown className="w-3.5 h-3.5" />
                            </>
                          )}
                        </button>
                      )}
                    </div>

                    {/* Lista expansível de quem já concluiu */}
                    {isExpanded && req.approvedList.length > 0 && (
                      <div className="mt-2.5 pt-2.5 border-t border-dashed border-slate-200 flex flex-wrap items-center gap-1.5">
                        <span className="text-xs font-bold text-emerald-700 mr-1">
                          ✓ Já aprovados ({req.approvedList.length}):
                        </span>
                        {req.approvedList.map(({ pathfinder, progress }) => (
                          <button
                            key={pathfinder.id}
                            type="button"
                            onClick={() => onOpenRequirementDetail(req, pathfinder, progress)}
                            className="px-2.5 py-0.5 rounded-lg border bg-emerald-50 border-emerald-200 text-emerald-800 text-xs font-semibold hover:bg-emerald-100 cursor-pointer"
                          >
                            ✓ {pathfinder.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
      </div>
    </div>
  );
}
