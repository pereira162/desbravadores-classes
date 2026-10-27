import React, { useState, useMemo, useRef } from 'react';
import {
  Users,
  UserPlus,
  FolderPlus,
  Search,
  Award,
  CheckCircle2,
  Clock,
  Edit3,
  Trash2,
  FileDown,
  Printer,
  Sparkles,
  X,
  ChevronRight,
  Layers,
  Link2,
  Copy,
  Check,
  Send,
  Paperclip,
  MessageSquare,
  Camera,
  ShieldCheck,
} from 'lucide-react';
import {
  STATUS_CONFIG,
  calculateAge,
  formatDateBR,
  EXECUTION_CONTEXT_LABELS,
} from '../constants';
import DateInput from './DateInput';
import { exportElementToPdf } from '../utils/pdfExport';

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
  onDeletePathfinder,
  onSaveUnit,
  onDeleteUnit,
  onInvitePathfinder,
  onOpenRequirementDetail,
  settings,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [unitFilter, setUnitFilter] = useState('ALL');
  const [classFilter, setClassFilter] = useState('ALL');
  const [cardOnlyPending, setCardOnlyPending] = useState(false);
  const [cardSelectedClassSlug, setCardSelectedClassSlug] = useState('ALL');
  const [compactOnePageMode, setCompactOnePageMode] = useState(false);
  const [exportingCardPdf, setExportingCardPdf] = useState(false);
  const cardContainerRef = useRef(null);
  const compactCardRef = useRef(null);

  // Estado do Modal de Novo/Editar Desbravador
  const [pfModalOpen, setPfModalOpen] = useState(false);
  const [editingPf, setEditingPf] = useState(null);
  const [pfName, setPfName] = useState('');
  const [pfEmail, setPfEmail] = useState('');
  const [pfBirthDate, setPfBirthDate] = useState('2015-05-10');
  const [pfUnitId, setPfUnitId] = useState('');
  const [pfNotes, setPfNotes] = useState('');
  const [pfActive, setPfActive] = useState(true);
  const [pfClassSlugs, setPfClassSlugs] = useState(['amigo', 'amigo-avancado']);
  const [pfIsGrouped, setPfIsGrouped] = useState(false);
  const [savingPf, setSavingPf] = useState(false);

  // Estado do Modal de Gerenciar / Criar / Editar Unidades
  const [unitModalOpen, setUnitModalOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState(null);
  const [unitName, setUnitName] = useState('');
  const [unitGender, setUnitGender] = useState('MASCULINO');
  const [unitAgeRange, setUnitAgeRange] = useState('');
  const [unitColorHex, setUnitColorHex] = useState('#1d4ed8');
  const [savingUnit, setSavingUnit] = useState(false);

  // Estado do Modal de Convite Individual do Desbravador
  const [inviteModalPf, setInviteModalPf] = useState(null);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteUrl, setInviteUrl] = useState('');
  const [loadingInvite, setLoadingInvite] = useState(false);
  const [sendingInviteEmail, setSendingInviteEmail] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const isPathfinderUser = currentUser?.role === 'DESBRAVADOR';
  const canManageRegistry = ['ADMIN', 'GESTOR', 'DIRETOR', 'SECRETARIO'].includes(
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
    if (isPathfinderUser && currentUser?.pathfinder_id) {
      return enrichedPathfinders.filter((pf) => pf.id === currentUser.pathfinder_id);
    }
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
  }, [
    enrichedPathfinders,
    unitFilter,
    classFilter,
    searchQuery,
    isPathfinderUser,
    currentUser?.pathfinder_id,
  ]);

  const activePf = useMemo(() => {
    if (isPathfinderUser && currentUser?.pathfinder_id) {
      return (
        enrichedPathfinders.find((p) => p.id === currentUser.pathfinder_id) ||
        enrichedPathfinders[0] ||
        null
      );
    }
    if (selectedPathfinderId) {
      const found = enrichedPathfinders.find((p) => p.id === selectedPathfinderId);
      if (found) return found;
    }
    return filteredPathfinders[0] || enrichedPathfinders[0] || null;
  }, [
    selectedPathfinderId,
    enrichedPathfinders,
    filteredPathfinders,
    isPathfinderUser,
    currentUser?.pathfinder_id,
  ]);

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

  const applyAgeSuggestedClasses = (groupedMode = false, dateToUse = pfBirthDate) => {
    const age = calculateAge(dateToUse) || 10;
    const allClasses = catalog.classes || [];
    if (!groupedMode) {
      const targetAge = Math.min(15, Math.max(10, age));
      const matched = allClasses
        .filter((c) => c.min_age === targetAge)
        .map((c) => c.slug);
      setPfClassSlugs(matched.length > 0 ? matched : ['amigo', 'amigo-avancado']);
      setPfIsGrouped(false);
    } else {
      const targetAge = Math.min(15, Math.max(10, age));
      const matched = allClasses
        .filter((c) => c.min_age <= targetAge && c.type === 'REGULAR')
        .map((c) => c.slug);
      setPfClassSlugs(matched.length > 0 ? matched : ['amigo']);
      setPfIsGrouped(true);
    }
  };

  const openCreatePfModal = () => {
    setEditingPf(null);
    setPfName('');
    setPfEmail('');
    const defaultBirth = '2016-04-15';
    setPfBirthDate(defaultBirth);
    setPfUnitId(units[0]?.id || '');
    setPfNotes('');
    setPfActive(true);
    applyAgeSuggestedClasses(false, defaultBirth);
    setPfModalOpen(true);
  };

  const openEditPfModal = (pf) => {
    setEditingPf(pf);
    setPfName(pf.name);
    setPfEmail(pf.email || '');
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

  const handleSavePfSubmit = async (e) => {
    e.preventDefault();
    if (!pfName.trim() || pfClassSlugs.length === 0) return;
    setSavingPf(true);
    try {
      await onSavePathfinder(
        {
          name: pfName.trim(),
          email: pfEmail.trim(),
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

  // Abrir Modal de Unidades (para criar ou editar uma unidade específica)
  const openUnitManagerModal = (unitToEdit = null) => {
    if (unitToEdit) {
      setEditingUnit(unitToEdit);
      setUnitName(unitToEdit.name || '');
      setUnitGender(unitToEdit.gender || 'MASCULINO');
      setUnitAgeRange(unitToEdit.age_range || unitToEdit.counselor_description || '');
      setUnitColorHex(unitToEdit.color_hex || '#1d4ed8');
    } else {
      setEditingUnit(null);
      setUnitName('');
      setUnitGender('MASCULINO');
      setUnitAgeRange('');
      setUnitColorHex('#1d4ed8');
    }
    setUnitModalOpen(true);
  };

  const handleSaveUnitSubmit = async (e) => {
    e.preventDefault();
    if (!unitName.trim() || !onSaveUnit) return;
    setSavingUnit(true);
    try {
      await onSaveUnit(
        {
          name: unitName.trim(),
          gender: unitGender,
          age_range: unitAgeRange.trim(),
          counselor_description: unitAgeRange.trim(),
          color_hex: unitColorHex,
        },
        editingUnit?.id || null
      );
      setEditingUnit(null);
      setUnitName('');
      setUnitAgeRange('');
    } finally {
      setSavingUnit(false);
    }
  };

  // Abrir Modal de Link de Conta / Convite Individual do Desbravador
  const openPathfinderInviteModal = async (pf) => {
    setInviteModalPf(pf);
    setInviteEmail(pf.email || '');
    setInviteUrl(pf.invite_url || '');
    if (!pf.invite_url && onInvitePathfinder) {
      setLoadingInvite(true);
      try {
        const res = await onInvitePathfinder(pf.id, {
          email: pf.email || '',
          send_email: false,
        });
        if (res?.invite_url) {
          setInviteUrl(res.invite_url);
        }
      } finally {
        setLoadingInvite(false);
      }
    }
  };

  const handleSendPathfinderInviteEmail = async (e) => {
    e.preventDefault();
    if (!inviteModalPf || !onInvitePathfinder) return;
    setSendingInviteEmail(true);
    try {
      const res = await onInvitePathfinder(inviteModalPf.id, {
        email: inviteEmail.trim(),
        send_email: Boolean(inviteEmail.trim()),
      });
      if (res?.invite_url) {
        setInviteUrl(res.invite_url);
      }
    } finally {
      setSendingInviteEmail(false);
    }
  };

  const handleCopyLink = (url) => {
    if (!url) return;
    navigator.clipboard?.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 3000);
  };

  return (
    <div className="space-y-5">
      {/* Banner exclusivo quando logado como DESBRAVADOR */}
      {isPathfinderUser ? (
        <div className="bg-gradient-to-r from-teal-900 via-emerald-900 to-slate-900 rounded-2xl p-6 text-white shadow-lg border border-teal-700/50 flex flex-col md:flex-row md:items-center md:justify-between gap-4 no-print">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 border border-teal-400/30 text-teal-200 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              Portal Individual do Desbravador
            </div>
            <h1 className="text-2xl font-extrabold">
              Olá, {activePf?.name || currentUser?.name}!
            </h1>
            <p className="text-xs sm:text-sm text-teal-100 max-w-2xl">
              Aqui você acompanha tudo o que já conquistou e o que falta para sua Investidura.{' '}
              <strong>Clique em qualquer requisito abaixo</strong> para marcar o que já fez, contar como e quando realizou a atividade e anexar fotos!
            </p>
          </div>
          {activePf && (
            <div className="bg-black/30 border border-white/15 rounded-2xl px-5 py-3 text-center shrink-0">
              <div className="text-[11px] uppercase tracking-wider text-teal-200 font-bold">
                Seu Progresso Geral
              </div>
              <div className="text-3xl font-extrabold text-amber-300 mt-0.5">
                {activePf.pct}%
              </div>
              <div className="text-[11px] text-slate-300">
                {activePf.approvedReqs} aprovados • Faltam {activePf.remainingReqs}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Cabeçalho Padrão da Diretoria / Líderes */
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4 no-print">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                <Users className="w-6 h-6 text-indigo-600" />
                Desbravadores, Unidades & Cartão Virtual Individual
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Gerencie as unidades do clube, cadastre desbravadores, gere links individuais de conta e acompanhe o Cartão Virtual completo.
              </p>
            </div>

            {canManageRegistry && (
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => openUnitManagerModal(null)}
                  className="px-3.5 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 text-xs font-bold text-slate-700 flex items-center gap-1.5 cursor-pointer"
                >
                  <FolderPlus className="w-4 h-4 text-indigo-600" />
                  Gerenciar Unidades ({units.length})
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

          {/* Barra Rápida de Unidades (com botões diretos de Editar e Excluir cada unidade) */}
          <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 mr-1">
              Unidades do Clube:
            </span>
            {units.length === 0 ? (
              <span className="text-xs text-slate-500 italic">
                Nenhuma unidade criada ainda. Clique em &ldquo;Gerenciar Unidades&rdquo; para criar.
              </span>
            ) : (
              units.map((u) => {
                const count = pathfinders.filter((p) => p.unit_id === u.id).length;
                return (
                  <div
                    key={u.id}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl border border-slate-200 bg-slate-50 text-xs"
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: u.color_hex || '#1d4ed8' }}
                    />
                    <span className="font-bold text-slate-800">{u.name}</span>
                    <span className="text-[10px] text-slate-500">
                      ({count} {count === 1 ? 'membro' : 'membros'})
                    </span>
                    {canManageRegistry && (
                      <div className="flex items-center gap-1 ml-1 pl-1.5 border-l border-slate-200">
                        <button
                          type="button"
                          onClick={() => openUnitManagerModal(u)}
                          title={`Editar unidade ${u.name}`}
                          className="p-1 rounded hover:bg-indigo-100 text-slate-500 hover:text-indigo-700 cursor-pointer"
                        >
                          <Edit3 className="w-3 h-3" />
                        </button>
                        {onDeleteUnit && (
                          <button
                            type="button"
                            onClick={async () => {
                              if (
                                window.confirm(
                                  `Tem certeza que deseja excluir a unidade "${u.name}"?\nOs desbravadores vinculados ficarão "Sem Unidade" (não serão apagados).`
                                )
                              ) {
                                await onDeleteUnit(u.id);
                              }
                            }}
                            title={`Excluir unidade ${u.name}`}
                            className="p-1 rounded hover:bg-rose-100 text-slate-400 hover:text-rose-600 cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Layout Mestre-Detalhe: Lista de Desbravadores (Esquerda) + Cartão Virtual (Direita) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Coluna Esquerda: Lista e Filtros de Desbravadores (Oculta quando logado como Desbravador) */}
        {!isPathfinderUser && (
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
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-sm font-bold text-slate-900 truncate">
                            {pf.name}
                          </span>
                          {pf.age && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-200 text-slate-700">
                              {pf.age}a
                            </span>
                          )}
                          {pf.has_account && (
                            <span
                              title="Este desbravador já ativou a conta individual"
                              className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-teal-100 text-teal-800 border border-teal-300"
                            >
                              CONTA ATIVA
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
        )}

        {/* Coluna Direita: Cartão Virtual Individual do Desbravador */}
        <div
          className={`${
            isPathfinderUser ? 'lg:col-span-12' : 'lg:col-span-8'
          } space-y-4`}
        >
          {!activePf ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center text-slate-500">
              Selecione um desbravador na lista ao lado para visualizar seu Cartão Virtual.
            </div>
          ) : (
            <>
              {/* Container Geral do Cartão Virtual Individual (Incluindo Cabeçalho para Ficha Completa) */}
              <div id="card-container" ref={cardContainerRef} className="space-y-4">
                <div className="pdf-item bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
                  {/* Cabeçalho Oficial adicional visível no topo do PDF da Ficha Completa */}
                  <div className="hidden pdf-show-block border-b-2 border-slate-900 pb-3 mb-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                          MINISTÉRIO DOS DESBRAVADORES • DIVISÃO SUL-AMERICANA
                        </div>
                        <h1 className="text-lg font-black uppercase text-slate-950">
                          FICHA INDIVIDUAL DETALHADA DE CLASSES — 2026
                        </h1>
                      </div>
                      <div className="text-right text-xs font-bold text-slate-700">
                        <div>Clube: {settings?.club_name || 'Clube de Desbravadores'}</div>
                        <div>
                          Concluído: {activePf.pct}% ({activePf.approvedReqs}/{activePf.totalReqs} requisitos)
                        </div>
                      </div>
                    </div>
                  </div>

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
                        {activePf.has_account && (
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-teal-100 text-teal-800 border border-teal-300 flex items-center gap-1 no-print">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            Conta do Desbravador Ativa
                          </span>
                        )}
                      </div>
                      {activePf.notes && (
                        <p className="text-xs text-slate-500 mt-1">{activePf.notes}</p>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 no-print">
                      {canManageRegistry && (
                        <>
                          <button
                            onClick={() => openPathfinderInviteModal(activePf)}
                            className="px-3 py-1.5 rounded-xl bg-teal-50 hover:bg-teal-100 border border-teal-300 text-xs font-bold text-teal-900 flex items-center gap-1.5 cursor-pointer"
                            title="Gerar ou copiar o link individual para este desbravador criar a conta dele"
                          >
                            <Link2 className="w-3.5 h-3.5 text-teal-700" />
                            {activePf.has_account
                              ? 'Conta / Link Individual'
                              : 'Link de Conta Individual'}
                          </button>
                          <button
                            onClick={() => openEditPfModal(activePf)}
                            className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-700 flex items-center gap-1.5 cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            Editar Matrícula
                          </button>
                        </>
                      )}
                      <button
                        type="button"
                        onClick={() => setCompactOnePageMode(!compactOnePageMode)}
                        className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 cursor-pointer transition ${
                          compactOnePageMode
                            ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-xs'
                            : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                        }`}
                        title="Alternar entre a ficha detalhada e o modelo simplificado de 1 página A4"
                      >
                        <Layers className="w-3.5 h-3.5" />
                        {compactOnePageMode ? 'Ver Ficha Completa' : 'Versão Simplificada (1 Página)'}
                      </button>

                      <button
                        type="button"
                        onClick={async () => {
                          const targetEl = compactOnePageMode
                            ? (compactCardRef.current || document.getElementById('compact-card-container'))
                            : (cardContainerRef.current || document.getElementById('card-container'));
                          if (!targetEl) return;
                          setExportingCardPdf(true);
                          try {
                            await exportElementToPdf(targetEl, {
                              filenamePrefix: `ficha_${compactOnePageMode ? 'simplificada_1_pag' : 'completa'}_${activePf.name}`,
                              orientation: 'portrait',
                              singlePage: compactOnePageMode,
                              scale: 2,
                              marginMm: compactOnePageMode ? 4 : 6,
                            });
                          } catch (err) {
                            console.error('Erro ao gerar PDF da ficha:', err);
                            alert('Não foi possível gerar o PDF da ficha. Tente novamente.');
                          } finally {
                            setExportingCardPdf(false);
                          }
                        }}
                        disabled={exportingCardPdf}
                        className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <FileDown className="w-3.5 h-3.5" />
                        {exportingCardPdf
                          ? 'Gerando PDF...'
                          : compactOnePageMode
                          ? 'Baixar PDF (1 Página)'
                          : 'Baixar PDF da Ficha'}
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

                {/* Visualização: Modo Compacto 1 Página OU Modo Detalhado */}
                {compactOnePageMode ? (
                  <div
                    id="compact-card-container"
                    ref={compactCardRef}
                    className="bg-white rounded-2xl border border-slate-300 p-6 shadow-sm font-sans"
                    style={{ minHeight: '1080px' }}
                  >
                    {/* Cabeçalho Compacto Oficial 1 Página */}
                    <div className="border-b-2 border-slate-900 pb-3 mb-3 flex items-center justify-between">
                      <div>
                        <div className="text-[10px] font-black uppercase text-slate-500 tracking-wider">
                          CLUBE DE DESBRAVADORES • DIVISÃO SUL-AMERICANA
                        </div>
                        <h1 className="text-lg font-black text-slate-950 uppercase">
                          FICHA INDIVIDUAL DE PROGRESSO EM CLASSES (1 PÁGINA)
                        </h1>
                        <div className="text-xs font-bold text-slate-700">
                          Clube: {settings?.club_name || 'Clube de Desbravadores'} • Ano: 2026
                        </div>
                      </div>
                      <div className="text-right text-xs">
                        <div className="text-sm font-black text-slate-950">{activePf.name}</div>
                        <div className="text-slate-600 font-semibold">
                          Unidade: {activePf.unit_name || 'Sem Unidade'} • {activePf.age} anos ({formatDateBR(activePf.birth_date)})
                        </div>
                        <div className="text-amber-700 font-extrabold text-[11px] mt-0.5">
                          Concluído: {activePf.pct}% ({activePf.approvedReqs}/{activePf.totalReqs} itens)
                        </div>
                      </div>
                    </div>

                    {/* Grid de Requisitos em 2 Colunas Densas (Exatamente igual ao layout original de 1 página) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-[10px]">
                      {activePfRequirementsByClass.map((clsBlock) => (
                        <div key={clsBlock.slug} className="border border-slate-200 rounded p-2 bg-slate-50/50">
                          <div
                            className="font-black text-white px-2 py-0.5 rounded text-[10px] uppercase mb-1.5 flex items-center justify-between"
                            style={{ backgroundColor: clsBlock.classInfo?.color || '#0f172a' }}
                          >
                            <span>{clsBlock.classInfo?.name}</span>
                            <span>{clsBlock.pct}%</span>
                          </div>

                          <div className="space-y-1">
                            {clsBlock.requirements.map((req) => {
                              const isApproved = req.status === 'APROVADO';
                              const isDone = req.status === 'CONCLUIDO';
                              return (
                                <div
                                  key={req.id}
                                  data-pdf-state={req.status}
                                  className="flex items-start justify-between gap-1.5 py-0.5 border-b border-slate-100 last:border-0 leading-tight"
                                >
                                  <div className="min-w-0 pr-1">
                                    <span className="font-extrabold text-slate-900 mr-1">
                                      {req.code}
                                    </span>
                                    <span className="text-slate-700 font-medium">
                                      {req.title}
                                    </span>
                                    {req.subitems?.length > 0 && (
                                      <span className="text-slate-400 ml-1">
                                        ({req.subitems.map((s) => s.key).join(',')})
                                      </span>
                                    )}
                                  </div>
                                  <div className="shrink-0 text-center w-6">
                                    {isApproved ? (
                                      <span className="text-emerald-700 font-black text-xs">✓</span>
                                    ) : isDone ? (
                                      <span className="text-teal-700 font-bold text-[9px]">F</span>
                                    ) : (
                                      <span className="inline-block w-3.5 h-3.5 rounded-full border border-slate-400" />
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Rodapé Oficial com Assinaturas */}
                    <div className="mt-6 pt-4 border-t border-slate-300 flex items-center justify-between text-[10px] text-slate-700">
                      <div className="w-56 text-center">
                        <div className="border-b border-slate-500 mb-1 h-5"></div>
                        <div className="font-bold">Instrutor(a) / Conselheiro(a)</div>
                      </div>
                      <div className="w-56 text-center">
                        <div className="border-b border-slate-500 mb-1 h-5"></div>
                        <div className="font-bold">Diretor(a) do Clube</div>
                      </div>
                      <div className="w-48 text-center">
                        <div className="border-b border-slate-500 mb-1 h-5"></div>
                        <div className="font-bold">Data da Avaliação</div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Lista dos Requisitos do Cartão do Desbravador */}
                    {activePfRequirementsByClass.map((clsBlock) => (
                      <div
                        key={clsBlock.slug}
                        className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden"
                      >
                        <div
                          className="pdf-item px-5 py-3 text-white flex items-center justify-between"
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
                          <div className="pdf-item p-6 text-center text-xs text-emerald-700 font-semibold">
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
                              const attachCount = req.progress?.attachments?.length || 0;
                              const hasSubmissionText = Boolean(req.progress?.submission_text);
                              const hasReviewNotes = Boolean(req.progress?.review_notes);

                              return (
                                <div
                                  key={req.id}
                                  data-pdf-state={req.status}
                                  onClick={() =>
                                    onOpenRequirementDetail(activePf, req)
                                  }
                                  className="pdf-item p-4 hover:bg-slate-50 transition cursor-pointer flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
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
                                      {attachCount > 0 && (
                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 border border-teal-300 flex items-center gap-1">
                                          <Paperclip className="w-3 h-3" />
                                          {attachCount} {attachCount === 1 ? 'anexo/foto' : 'anexos/fotos'}
                                        </span>
                                      )}
                                      {hasSubmissionText && (
                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 flex items-center gap-1">
                                          <MessageSquare className="w-3 h-3" />
                                          Relato enviado
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
                                              {sub.key}) {sub.text}
                                            </span>
                                          );
                                        })}
                                      </div>
                                    )}
                                    {hasSubmissionText && (
                                      <p className="text-[11px] text-teal-800 bg-teal-50/80 border border-teal-200/80 px-2.5 py-1 rounded-lg mt-1">
                                        <strong>Como fez:</strong> &ldquo;{req.progress.submission_text}&rdquo;
                                        {req.progress.completed_at && (
                                          <span className="ml-1.5 text-slate-500">
                                            (em {formatDateBR(req.progress.completed_at)})
                                          </span>
                                        )}
                                      </p>
                                    )}
                                    {hasReviewNotes && (
                                      <p className="text-[11px] text-amber-900 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg mt-1">
                                        <strong>Feedback do Líder:</strong> &ldquo;{req.progress.review_notes}&rdquo;
                                      </p>
                                    )}
                                    {req.progress?.notes && (
                                      <p className="text-[11px] text-indigo-700 italic">
                                        Obs: &ldquo;{req.progress.notes}&rdquo;
                                      </p>
                                    )}
                                  </div>

                                  <div className="shrink-0 flex sm:flex-col items-end justify-between gap-1.5">
                                    {req.status === 'PENDENTE' ? (
                                      <>
                                        {/* Visível na tela do site, mas oculto no PDF */}
                                        <span
                                          className={`pdf-hide px-3 py-1 rounded-xl border text-xs font-bold ${cfg.bgClass}`}
                                        >
                                          {cfg.label}
                                        </span>
                                        {/* Visível apenas no PDF: espaço limpo sem texto para o instrutor marcar/assinar */}
                                        <span className="hidden pdf-show w-20 h-6 rounded-lg border border-slate-300 bg-white text-transparent select-none">
                                          &nbsp;
                                        </span>
                                      </>
                                    ) : (
                                      <span
                                        className={`px-3 py-1 rounded-xl border text-xs font-bold ${cfg.bgClass}`}
                                      >
                                        {cfg.label}
                                      </span>
                                    )}
                                    {isPathfinderUser && req.status !== 'APROVADO' && (
                                      <span className="text-[10px] font-bold text-teal-700 flex items-center gap-1 no-print">
                                        <Camera className="w-3 h-3" />
                                        {req.status === 'CONCLUIDO'
                                          ? 'Editar envio / fotos'
                                          : 'Marcar & anexar fotos'}
                                      </span>
                                    )}
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
                  </div>
                )}
              </div>
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
              className="flex-1 overflow-hidden flex flex-col"
            >
              <div className="p-6 space-y-4 overflow-y-auto flex-1">
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
                    placeholder="Digite o nome completo do desbravador"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Data de Nascimento *
                  </label>
                  <DateInput
                    required
                    value={pfBirthDate}
                    onChange={(newDate) => {
                      setPfBirthDate(newDate);
                      if (!editingPf && newDate) {
                        applyAgeSuggestedClasses(pfIsGrouped, newDate);
                      }
                    }}
                    className="px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
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

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    E-mail do Desbravador (Opcional — para enviar o convite individual)
                  </label>
                  <input
                    type="email"
                    value={pfEmail}
                    onChange={(e) => setPfEmail(e.target.value)}
                    placeholder="Opcional: desbravador@gmail.com (ele também poderá escolher no link)"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
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
              </div>

              <div className="p-4 px-6 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-2 shrink-0">
                {editingPf && onDeletePathfinder ? (
                  <button
                    type="button"
                    onClick={async () => {
                      if (
                        window.confirm(
                          `Tem certeza que deseja excluir o cadastro de "${editingPf.name}"?`
                        )
                      ) {
                        await onDeletePathfinder(editingPf.id);
                        setPfModalOpen(false);
                      }
                    }}
                    className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold cursor-pointer"
                  >
                    Excluir Desbravador
                  </button>
                ) : (
                  <div />
                )}

                <div className="flex items-center gap-2">
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
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Completo de Gerenciamento de Unidades (Criar, Editar e Excluir) */}
      {unitModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="text-base font-extrabold">
                {editingUnit
                  ? `Editar Unidade: ${editingUnit.name}`
                  : 'Gerenciar Unidades do Clube'}
              </h3>
              <button
                onClick={() => {
                  setEditingUnit(null);
                  setUnitModalOpen(false);
                }}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5 overflow-y-auto flex-1">
              <form
                onSubmit={handleSaveUnitSubmit}
                className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-indigo-700">
                    {editingUnit ? 'Editando Unidade Selecionada' : 'Adicionar Nova Unidade'}
                  </span>
                  {editingUnit && (
                    <button
                      type="button"
                      onClick={() => openUnitManagerModal(null)}
                      className="text-[11px] font-bold text-slate-500 hover:text-slate-800 underline cursor-pointer"
                    >
                      + Cancelar edição e criar nova
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Nome da Unidade *
                    </label>
                    <input
                      type="text"
                      required
                      value={unitName}
                      onChange={(e) => setUnitName(e.target.value)}
                      placeholder="Ex: Águias, Órion, Panteras..."
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 bg-white text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Gênero
                    </label>
                    <select
                      value={unitGender}
                      onChange={(e) => setUnitGender(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-sm"
                    >
                      <option value="MASCULINO">Masculina</option>
                      <option value="FEMININO">Feminina</option>
                      <option value="MISTA">Mista</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Faixa Etária / Descrição (Opcional)
                    </label>
                    <input
                      type="text"
                      value={unitAgeRange}
                      onChange={(e) => setUnitAgeRange(e.target.value)}
                      placeholder="Ex: 10 a 12 anos / Conselheiro Lucas"
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 bg-white text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Cor da Unidade
                    </label>
                    <input
                      type="color"
                      value={unitColorHex}
                      onChange={(e) => setUnitColorHex(e.target.value)}
                      className="w-full h-9 rounded-xl border border-slate-300 bg-white p-1 cursor-pointer"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="submit"
                    disabled={savingUnit}
                    className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold cursor-pointer"
                  >
                    {savingUnit
                      ? 'Salvando...'
                      : editingUnit
                      ? 'Salvar Alterações da Unidade'
                      : 'Criar Unidade'}
                  </button>
                </div>
              </form>

              {/* Lista de Unidades Cadastradas com Editar e Excluir */}
              <div className="space-y-2">
                <div className="text-xs font-extrabold text-slate-700">
                  Unidades Cadastradas ({units.length})
                </div>
                {units.length === 0 ? (
                  <p className="text-xs text-slate-500 italic">
                    Nenhuma unidade cadastrada ainda.
                  </p>
                ) : (
                  <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                    {units.map((u) => {
                      const memberCount = pathfinders.filter(
                        (p) => p.unit_id === u.id
                      ).length;
                      return (
                        <div
                          key={u.id}
                          className={`px-3.5 py-2.5 flex items-center justify-between gap-2 text-xs ${
                            editingUnit?.id === u.id ? 'bg-indigo-50' : 'bg-white'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span
                              className="w-3 h-3 rounded-full shrink-0"
                              style={{ backgroundColor: u.color_hex || '#1d4ed8' }}
                            />
                            <div className="truncate">
                              <span className="font-bold text-slate-900">
                                {u.name}
                              </span>
                              <span className="ml-2 text-[10px] text-slate-500">
                                ({u.gender} • {memberCount}{' '}
                                {memberCount === 1 ? 'desbravador' : 'desbravadores'})
                              </span>
                              {(u.age_range || u.counselor_description) && (
                                <div className="text-[10px] text-slate-400 truncate">
                                  {u.age_range || u.counselor_description}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={() => openUnitManagerModal(u)}
                              className="px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold flex items-center gap-1 cursor-pointer"
                            >
                              <Edit3 className="w-3 h-3" />
                              Editar
                            </button>
                            {onDeleteUnit && (
                              <button
                                type="button"
                                onClick={async () => {
                                  if (
                                    window.confirm(
                                      `Tem certeza que deseja excluir a unidade "${u.name}"?\nOs desbravadores vinculados não serão apagados (ficarão Sem Unidade).`
                                    )
                                  ) {
                                    await onDeleteUnit(u.id);
                                    if (editingUnit?.id === u.id) {
                                      setEditingUnit(null);
                                      setUnitName('');
                                    }
                                  }
                                }}
                                className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold flex items-center gap-1 cursor-pointer"
                              >
                                <Trash2 className="w-3 h-3" />
                                Excluir
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 px-6 bg-slate-50 border-t border-slate-200 flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => {
                  setEditingUnit(null);
                  setUnitModalOpen(false);
                }}
                className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold cursor-pointer shadow-sm transition"
              >
                Concluir e Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Link de Conta Individual do Desbravador */}
      {inviteModalPf && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 bg-teal-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Link2 className="w-5 h-5 text-teal-300" />
                <h3 className="text-base font-extrabold">
                  Convite Individual • {inviteModalPf.name}
                </h3>
              </div>
              <button
                onClick={() => setInviteModalPf(null)}
                className="text-teal-200 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-xs text-slate-600 leading-relaxed">
                Cada desbravador possui um <strong>link exclusivo de criação de conta</strong>. Ao abrir este link,{' '}
                <strong>{inviteModalPf.name}</strong> poderá criar a conta como preferir (usando{' '}
                <strong>Login com Google</strong> ou escolhendo e-mail e senha) para acessar seu Cartão Virtual, marcar requisitos concluídos e anexar fotos.
              </p>

              <div className="p-3.5 rounded-2xl bg-teal-50 border border-teal-200 space-y-2">
                <label className="block text-[11px] font-extrabold uppercase tracking-wider text-teal-900">
                  Link Individual Exclusivo de {inviteModalPf.name}:
                </label>
                {loadingInvite ? (
                  <div className="text-xs text-teal-700 font-semibold py-2">
                    Gerando link individual...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={inviteUrl}
                      className="w-full px-3 py-2 rounded-xl bg-white border border-teal-300 text-xs font-mono text-slate-800"
                    />
                    <button
                      type="button"
                      onClick={() => handleCopyLink(inviteUrl)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 transition cursor-pointer ${
                        copiedLink
                          ? 'bg-emerald-600 text-white shadow-sm scale-105'
                          : 'bg-teal-700 hover:bg-teal-800 text-white'
                      }`}
                    >
                      {copiedLink ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          ✓ Copiado!
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          Copiar Link
                        </>
                      )}
                    </button>
                  </div>
                )}
                <p className="text-[11px] text-teal-800">
                  Você pode copiar o link acima e mandar por <strong>WhatsApp</strong> diretamente para o desbravador ou seus pais!
                </p>
              </div>

              <form
                onSubmit={handleSendPathfinderInviteEmail}
                className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5"
              >
                <label className="block text-xs font-bold text-slate-700">
                  Ou enviar o convite diretamente por E-mail (Gmail do Clube):
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="email"
                    required
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="emaildodesbravador@gmail.com"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 bg-white text-xs"
                  />
                  <button
                    type="submit"
                    disabled={sendingInviteEmail || !inviteEmail.trim()}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 shrink-0 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    {sendingInviteEmail ? 'Enviando...' : 'Enviar E-mail'}
                  </button>
                </div>
              </form>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setInviteModalPf(null)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 cursor-pointer"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
