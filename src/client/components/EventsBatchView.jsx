import React, { useState, useMemo, useEffect } from 'react';
import {
  Calendar,
  CalendarPlus,
  CheckCircle2,
  Clock,
  Tent,
  Compass,
  Users,
  CheckSquare,
  Sparkles,
  X,
  Search,
} from 'lucide-react';
import { formatDateBR } from '../constants';
import DateInput from './DateInput';
import { useModalDismiss } from '../utils/modalStack';

const EVENT_TYPES = [
  { id: 'ACAMPAMENTO', label: 'Acampamento / Pernoite', badge: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20' },
  { id: 'CAMINHADA', label: 'Caminhada / Excursionismo', badge: 'bg-lime-500/10 text-lime-700 dark:text-lime-300 border-lime-500/20' },
  { id: 'COMUNIDADE', label: 'Projeto Comunitário / Missão', badge: 'bg-orange-500/10 text-orange-700 dark:text-orange-300 border-orange-500/20' },
  { id: 'IGREJA', label: 'Cerimônia / Culto / Evangelismo', badge: 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/20' },
  { id: 'REUNIAO', label: 'Domingão de Especialidades', badge: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20' },
];

export default function EventsBatchView({
  catalog,
  events,
  pathfinders,
  classesMap,
  requirementsMap,
  progressMap,
  pendingEventDraft,
  onClearEventDraft,
  onCreateEvent,
  onDeleteEvent,
  onExecuteEvent,
  onApproveEvent,
  currentUser,
}) {
  const canApproveEvents =
    ['DIRETOR', 'GESTOR', 'ADMIN'].includes(currentUser?.role) ||
    Boolean(currentUser?.permissions?.can_approve_events);

  // Modal Criar Evento
  const [createOpen, setCreateOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [eventType, setEventType] = useState('ACAMPAMENTO');
  const [eventDate, setEventDate] = useState('2026-07-18');
  const [description, setDescription] = useState('');
  const [selectedReqIds, setSelectedReqIds] = useState([]);
  const [reqSearch, setReqSearch] = useState('');
  const [reqTagFilter, setReqTagFilter] = useState('ALL');
  const [savingEvent, setSavingEvent] = useState(false);

  // Modal Executar / Assinar Presença em Lote
  const [executingEvent, setExecutingEvent] = useState(null);
  const [selectedPfIds, setSelectedPfIds] = useState([]);
  const [targetStatus, setTargetStatus] = useState('APROVADO');
  const [execNotes, setExecNotes] = useState('');
  const [runningExecute, setRunningExecute] = useState(false);

  // Registro de modais na pilha hierárquica global (ESC e Voltar Mobile)
  useModalDismiss(createOpen, () => setCreateOpen(false), 'ModalCriarEvento');
  useModalDismiss(Boolean(executingEvent), () => setExecutingEvent(null), 'ModalExecutarEvento');


  // Se veio um rascunho da tela de Planejamento de Demanda Anual, abre o modal preenchido
  useEffect(() => {
    if (pendingEventDraft) {
      setTitle(pendingEventDraft.title || '');
      setEventType(pendingEventDraft.event_type || 'ACAMPAMENTO');
      setEventDate(pendingEventDraft.event_date || '2026-06-20');
      setDescription(pendingEventDraft.description || '');
      setSelectedReqIds(pendingEventDraft.requirement_ids || []);
      setCreateOpen(true);
      if (onClearEventDraft) onClearEventDraft();
    }
  }, [pendingEventDraft, onClearEventDraft]);

  const activePathfinders = useMemo(
    () => pathfinders.filter((p) => p.active),
    [pathfinders]
  );

  // Filtra requisitos no seletor de criação de evento
  const selectableRequirements = useMemo(() => {
    const q = reqSearch.trim().toLowerCase();
    return (catalog.requirements || []).filter((r) => {
      if (reqTagFilter !== 'ALL' && !(r.tags || []).includes(reqTagFilter)) {
        return false;
      }
      if (q) {
        const hay = `${r.code} ${r.marker} ${r.title} ${classesMap[r.class_slug]?.name || ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [catalog.requirements, reqSearch, reqTagFilter, classesMap]);

  const toggleReqSelection = (reqId) => {
    setSelectedReqIds((prev) =>
      prev.includes(reqId) ? prev.filter((id) => id !== reqId) : [...prev, reqId]
    );
  };

  const handleOpenNewEventModal = () => {
    setTitle('');
    setEventType('ACAMPAMENTO');
    setEventDate('2026-07-18');
    setDescription('');
    setSelectedReqIds([]);
    setCreateOpen(true);
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || selectedReqIds.length === 0) return;
    setSavingEvent(true);
    try {
      await onCreateEvent({
        title: title.trim(),
        event_type: eventType,
        event_date: eventDate,
        description: description.trim(),
        requirement_ids: selectedReqIds,
      });
      setCreateOpen(false);
    } finally {
      setSavingEvent(false);
    }
  };

  // Abre modal para lançar presença e aprovar requisitos do evento em lote
  const openExecuteModal = (ev) => {
    const reqSlugs = new Set(
      (ev.requirement_ids || [])
        .map((id) => requirementsMap[id]?.class_slug)
        .filter(Boolean)
    );
    const eligiblePfs = activePathfinders.filter((pf) =>
      pf.enrollments?.some((enr) => reqSlugs.has(enr.class_slug))
    );
    setExecutingEvent(ev);
    setSelectedPfIds(eligiblePfs.map((p) => p.id));
    setTargetStatus('APROVADO');
    setExecNotes(`Concluído no evento "${ev.title}" em ${formatDateBR(ev.event_date)}`);
  };

  const handleExecuteSubmit = async (e) => {
    e.preventDefault();
    if (!executingEvent || selectedPfIds.length === 0) return;
    setRunningExecute(true);
    try {
      await onExecuteEvent(executingEvent.id, {
        pathfinder_ids: selectedPfIds,
        status: targetStatus,
        notes: execNotes,
      });
      setExecutingEvent(null);
    } finally {
      setRunningExecute(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho Apple Style */}
      <div className="bg-white dark:bg-[#1c1c1e] rounded-3xl border border-black/[0.06] dark:border-white/[0.08] p-6 sm:p-7 shadow-[0_4px_24px_rgba(0,0,0,0.04)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <Tent className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            Eventos do Clube & Aprovação em Lote
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed max-w-2xl">
            Vincule requisitos de múltiplas classes a um Acampamento, Caminhada ou Projeto Comunitário e aprove todos os desbravadores presentes de uma só vez.
          </p>
        </div>

        <button
          onClick={handleOpenNewEventModal}
          data-tour="btn-new-event"
          className="px-5 py-2.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-2 shadow-xs transition-all cursor-pointer shrink-0 active:scale-95"
        >
          <CalendarPlus className="w-4 h-4" />
          Agendar Novo Evento
        </button>
      </div>

      {/* Cards de Eventos */}
      {events.length === 0 ? (
        <div className="bg-white dark:bg-[#1c1c1e] rounded-3xl border border-black/[0.06] dark:border-white/[0.08] p-12 text-center space-y-3 shadow-xs">
          <Tent className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Nenhum evento agendado ainda
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
            Agende acampamentos, caminhadas ou projetos comunitários do seu clube para assinar os requisitos de vários desbravadores de uma só vez.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {events.map((ev) => {
            const typeObj =
              EVENT_TYPES.find((t) => t.id === ev.event_type) || EVENT_TYPES[0];
            const linkedReqs = (ev.requirement_ids || [])
              .map((id) => requirementsMap[id])
              .filter(Boolean);

            // Desbravadores matriculados nas classes dos requisitos deste evento
            const reqSlugs = new Set(linkedReqs.map((r) => r.class_slug));
            const eligiblePfs = activePathfinders.filter((pf) =>
              pf.enrollments?.some((enr) => reqSlugs.has(enr.class_slug))
            );

            return (
              <div
                key={ev.id}
                className="bg-white dark:bg-[#1c1c1e] rounded-3xl border border-black/[0.06] dark:border-white/[0.08] shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-md overflow-hidden flex flex-col justify-between transition-all"
              >
                <div className="p-6 space-y-3.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold border ${typeObj.badge}`}
                    >
                      {typeObj.label}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1.5 bg-slate-100 dark:bg-[#252528] px-2.5 py-1 rounded-full">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {formatDateBR(ev.event_date)}
                      </span>
                      <span
                        className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                          ev.status === 'REALIZADO'
                            ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20'
                            : ev.status === 'PENDENTE_APROVACAO'
                            ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20'
                            : 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20'
                        }`}
                      >
                        {ev.status === 'REALIZADO'
                          ? 'REALIZADO'
                          : ev.status === 'PENDENTE_APROVACAO'
                          ? '⏳ AGUARDANDO APROVAÇÃO'
                          : 'PLANEJADO'}
                      </span>
                    </div>
                  </div>

                  <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                      {ev.title}
                    </h2>
                    {ev.description && (
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                        {ev.description}
                      </p>
                    )}
                  </div>

                  {/* Lista de Requisitos Cobertos pelo Evento Apple Inset */}
                  <div className="bg-slate-50 dark:bg-[#252528] rounded-2xl p-4 border border-black/[0.04] dark:border-white/[0.06] space-y-2.5">
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                      <span>
                        Requisitos Cobertos ({linkedReqs.length})
                      </span>
                      <span className="text-blue-600 dark:text-blue-400 font-bold">
                        {eligiblePfs.length} elegíveis
                      </span>
                    </div>
                    <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                      {linkedReqs.map((r) => {
                        const cls = classesMap[r.class_slug];
                        return (
                          <div
                            key={r.id}
                            className="text-xs bg-white dark:bg-[#1c1c1e] p-2.5 rounded-xl border border-black/[0.04] dark:border-white/[0.06] flex items-start gap-2 shadow-2xs"
                          >
                            <span
                              className="px-1.5 py-0.5 rounded text-[10px] font-bold text-white shrink-0 mt-0.5"
                              style={{ backgroundColor: cls?.color || '#334155' }}
                            >
                              {r.code}
                            </span>
                            <div className="min-w-0">
                              <span className="font-bold text-slate-800 dark:text-slate-200">
                                {cls?.name}:{' '}
                              </span>
                              <span className="text-slate-600 dark:text-slate-400">
                                {r.marker} {r.title}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="px-6 py-4 bg-slate-50/50 dark:bg-[#252528]/50 border-t border-black/[0.04] dark:border-white/[0.06] flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {onDeleteEvent ? (
                      <button
                        type="button"
                        onClick={async () => {
                          if (
                            window.confirm(
                              `Tem certeza que deseja excluir o evento "${ev.title}"?`
                            )
                          ) {
                            await onDeleteEvent(ev.id);
                          }
                        }}
                        className="text-xs font-semibold text-rose-600 hover:text-rose-700 dark:text-rose-400 hover:underline cursor-pointer"
                      >
                        Excluir Evento
                      </button>
                    ) : (
                      <span className="text-xs text-slate-500">
                        Pronto para lançamento
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {ev.status === 'PENDENTE_APROVACAO' && canApproveEvents && onApproveEvent && (
                      <button
                        type="button"
                        onClick={() => onApproveEvent(ev.id)}
                        className="px-4 py-2 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95 transition-all"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        Aprovar Evento
                      </button>
                    )}

                    {ev.status === 'PENDENTE_APROVACAO' ? (
                      <span className="text-xs font-semibold text-amber-700 dark:text-amber-300 bg-amber-500/10 px-3 py-1.5 rounded-full border border-amber-500/20">
                        Aguardando Aprovação do Diretor
                      </span>
                    ) : (
                      <button
                        onClick={() => openExecuteModal(ev)}
                        className="px-4 py-2 rounded-full bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 text-xs font-semibold flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all shadow-xs"
                      >
                        <CheckSquare className="w-4 h-4 text-emerald-500" />
                        Lançar Presença & Assinar Lote
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Criar Evento - Apple Sheet Style */}
      {createOpen && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget && !savingEvent) setCreateOpen(false);
          }}
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fade-in"
        >
          <div className="bg-white/95 dark:bg-[#1c1c1e]/95 backdrop-blur-2xl rounded-3xl max-w-2xl w-full shadow-2xl border border-black/[0.08] dark:border-white/[0.12] overflow-hidden max-h-[88vh] flex flex-col">
            <div className="px-6 py-4.5 border-b border-black/[0.06] dark:border-white/[0.08] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-500/20">
                  <CalendarPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                    Agendar Evento do Clube
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Vincule requisitos de várias classes para aprovação coletiva
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCreateOpen(false)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#2c2c2e] transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={handleCreateSubmit}
              className="p-6 space-y-4 overflow-y-auto"
            >
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                    Título do Evento *
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ex: Acampamento de Instrução de Inverno"
                    className="w-full px-3.5 py-2 rounded-xl border border-black/[0.08] dark:border-white/[0.12] bg-white dark:bg-[#252528] text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                    Data Prevista *
                  </label>
                  <DateInput
                    required
                    value={eventDate}
                    onChange={(newDate) => setEventDate(newDate)}
                    className="px-3 py-2 rounded-xl border border-black/[0.08] dark:border-white/[0.12] bg-white dark:bg-[#252528] text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                    Tipo de Atividade
                  </label>
                  <select
                    value={eventType}
                    onChange={(e) => setEventType(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-black/[0.08] dark:border-white/[0.12] bg-white dark:bg-[#252528] text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  >
                    {EVENT_TYPES.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                    Descrição / Local
                  </label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Ex: Chácara Recanto das Águas..."
                    className="w-full px-3.5 py-2 rounded-xl border border-black/[0.08] dark:border-white/[0.12] bg-white dark:bg-[#252528] text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  />
                </div>
              </div>

              {/* Seletor de Requisitos Vinculados */}
              <div className="border-t border-black/[0.06] dark:border-white/[0.08] pt-3.5 space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Requisitos cobertos ({selectedReqIds.length} selecionados) *
                  </label>
                  <select
                    value={reqTagFilter}
                    onChange={(e) => setReqTagFilter(e.target.value)}
                    className="px-2.5 py-1 rounded-full border border-black/[0.08] dark:border-white/[0.12] bg-slate-50 dark:bg-[#252528] text-xs font-semibold text-slate-800 dark:text-slate-200"
                  >
                    <option value="ALL">Todas as Tags</option>
                    {(catalog.contextTags || []).map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={reqSearch}
                    onChange={(e) => setReqSearch(e.target.value)}
                    placeholder="Buscar requisito por palavra-chave (ex: acampar, caminhada, fogueira)..."
                    className="w-full pl-8 pr-3 py-1.5 rounded-full border border-black/[0.08] dark:border-white/[0.12] bg-slate-50 dark:bg-[#252528] text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  />
                </div>

                <div className="max-h-56 overflow-y-auto border border-black/[0.06] dark:border-white/[0.08] rounded-2xl divide-y divide-black/[0.04] dark:divide-white/[0.04] bg-slate-50/50 dark:bg-[#252528]/50">
                  {selectableRequirements.map((r) => {
                    const checked = selectedReqIds.includes(r.id);
                    const cls = classesMap[r.class_slug];
                    return (
                      <label
                        key={r.id}
                        className={`p-2.5 flex items-start gap-2.5 text-xs cursor-pointer transition-all ${
                          checked ? 'bg-blue-500/10 dark:bg-blue-500/15' : 'hover:bg-white dark:hover:bg-[#252528]'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleReqSelection(r.id)}
                          className="mt-0.5 rounded text-blue-600 focus:ring-blue-500"
                        />
                        <span
                          className="px-1.5 py-0.5 rounded-md text-[10px] font-bold text-white shrink-0"
                          style={{ backgroundColor: cls?.color || '#334155' }}
                        >
                          {r.code}
                        </span>
                        <div className="min-w-0">
                          <span className="font-bold text-slate-900 dark:text-slate-100">
                            {cls?.name}:{' '}
                          </span>
                          <span className="text-slate-600 dark:text-slate-400">
                            {r.marker} {r.title}
                          </span>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-black/[0.06] dark:border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => setCreateOpen(false)}
                  className="px-4 py-2 rounded-full text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#2c2c2e] transition-all cursor-pointer active:scale-95"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingEvent || selectedReqIds.length === 0}
                  className="px-5 py-2 rounded-full bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-xs font-semibold shadow-xs cursor-pointer active:scale-95 transition-all"
                >
                  {savingEvent ? 'Salvando...' : 'Salvar Evento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Executar Evento & Aprovar Presença em Lote */}
      {executingEvent && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget && !runningExecute) setExecutingEvent(null);
          }}
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fade-in"
        >
          <div className="bg-white/95 dark:bg-[#1c1c1e]/95 backdrop-blur-2xl rounded-3xl max-w-xl w-full shadow-2xl border border-black/[0.08] dark:border-white/[0.12] overflow-hidden max-h-[88vh] flex flex-col">
            <div className="px-6 py-4.5 border-b border-black/[0.06] dark:border-white/[0.08] flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                  Lançar Presença & Assinar Lote
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  {executingEvent.title} • {formatDateBR(executingEvent.event_date)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setExecutingEvent(null)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#2c2c2e] transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={handleExecuteSubmit}
              className="p-6 space-y-4 overflow-y-auto"
            >
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-3.5 text-xs text-emerald-800 dark:text-emerald-300 leading-relaxed">
                Os desbravadores marcados abaixo terão os requisitos deste evento atualizados simultaneamente em um único lote auditado.
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Desbravadores Presentes ({selectedPfIds.length})
                  </label>
                  <div className="flex gap-2.5">
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedPfIds(activePathfinders.map((p) => p.id))
                      }
                      className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                    >
                      Marcar Todos
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedPfIds([])}
                      className="text-xs font-medium text-slate-500 hover:underline cursor-pointer"
                    >
                      Desmarcar
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto border border-black/[0.06] dark:border-white/[0.08] rounded-2xl p-2.5 bg-slate-50/50 dark:bg-[#252528]/50">
                  {activePathfinders.map((pf) => {
                    const checked = selectedPfIds.includes(pf.id);
                    return (
                      <label
                        key={pf.id}
                        className={`p-2 rounded-xl border text-xs flex items-center gap-2 cursor-pointer transition-all active:scale-[0.98] ${
                          checked
                            ? 'bg-blue-500/10 border-blue-500/30 font-semibold text-slate-900 dark:text-white'
                            : 'bg-white dark:bg-[#252528] border-black/[0.06] dark:border-white/[0.08] text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() =>
                            setSelectedPfIds((prev) =>
                              prev.includes(pf.id)
                                ? prev.filter((id) => id !== pf.id)
                                : [...prev, pf.id]
                            )
                          }
                          className="rounded text-blue-600 focus:ring-blue-500"
                        />
                        <div className="truncate">
                          <div>{pf.name}</div>
                          <div className="text-[10px] text-slate-500 font-normal">
                            {pf.unit_name}
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                    Status a Aplicar
                  </label>
                  <select
                    value={targetStatus}
                    onChange={(e) => setTargetStatus(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-black/[0.08] dark:border-white/[0.12] bg-white dark:bg-[#252528] text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  >
                    <option value="APROVADO">APROVADO (Assinado p/ Investidura)</option>
                    <option value="CONCLUIDO">FEITO (Aguardando Visto)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                    Registro / Evidência no Cartão
                  </label>
                  <input
                    type="text"
                    value={execNotes}
                    onChange={(e) => setExecNotes(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-black/[0.08] dark:border-white/[0.12] bg-white dark:bg-[#252528] text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-black/[0.06] dark:border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => setExecutingEvent(null)}
                  className="px-4 py-2 rounded-full text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#2c2c2e] transition-all cursor-pointer active:scale-95"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={runningExecute || selectedPfIds.length === 0}
                  className="px-5 py-2 rounded-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white text-xs font-semibold shadow-xs cursor-pointer active:scale-95 transition-all"
                >
                  {runningExecute
                    ? 'Processando Lote...'
                    : `Confirmar Lote (${selectedPfIds.length} desbravadores)`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
