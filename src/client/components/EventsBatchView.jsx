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

const EVENT_TYPES = [
  { id: 'ACAMPAMENTO', label: 'Acampamento / Pernoite', badge: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  { id: 'CAMINHADA', label: 'Caminhada / Excursionismo', badge: 'bg-lime-100 text-lime-800 border-lime-200' },
  { id: 'COMUNIDADE', label: 'Projeto Comunitário / Ação Social', badge: 'bg-orange-100 text-orange-800 border-orange-200' },
  { id: 'IGREJA', label: 'Cerimônia / Culto / Evangelismo', badge: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
  { id: 'REUNIAO', label: 'Domingão de Especialidades / Clube', badge: 'bg-amber-100 text-amber-800 border-amber-200' },
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
}) {
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
      {/* Cabeçalho */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <Tent className="w-6 h-6 text-emerald-600" />
            Eventos do Clube & Aprovação de Requisitos em Lote
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Vincule requisitos de múltiplas classes a um Acampamento, Caminhada ou Projeto Comunitário e aprove todos os desbravadores presentes de uma só vez.
          </p>
        </div>

        <button
          onClick={handleOpenNewEventModal}
          className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-2 shadow-xs transition cursor-pointer shrink-0"
        >
          <CalendarPlus className="w-4 h-4" />
          Agendar Novo Evento Multirrequisito
        </button>
      </div>

      {/* Cards de Eventos */}
      {events.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center space-y-3">
          <Tent className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-base font-extrabold text-slate-800">
            Nenhum evento agendado ainda
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
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
                className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col justify-between"
              >
                <div className="p-5 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${typeObj.badge}`}
                    >
                      {typeObj.label}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-600 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {formatDateBR(ev.event_date)}
                      </span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold ${
                          ev.status === 'REALIZADO'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {ev.status === 'REALIZADO' ? 'REALIZADO' : 'PLANEJADO'}
                      </span>
                    </div>
                  </div>

                  <div>
                    <h2 className="text-lg font-extrabold text-slate-900">
                      {ev.title}
                    </h2>
                    {ev.description && (
                      <p className="text-xs text-slate-600 mt-1">
                        {ev.description}
                      </p>
                    )}
                  </div>

                  {/* Lista de Requisitos Cobertos pelo Evento */}
                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/80 space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                      <span>
                        Requisitos Cobertos Simultaneamente ({linkedReqs.length})
                      </span>
                      <span className="text-indigo-700">
                        {eligiblePfs.length} desbravadores elegíveis
                      </span>
                    </div>
                    <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                      {linkedReqs.map((r) => {
                        const cls = classesMap[r.class_slug];
                        return (
                          <div
                            key={r.id}
                            className="text-xs bg-white p-2 rounded-lg border border-slate-200 flex items-start gap-2"
                          >
                            <span
                              className="px-1.5 py-0.5 rounded text-[10px] font-extrabold text-white shrink-0 mt-0.5"
                              style={{ backgroundColor: cls?.color || '#334155' }}
                            >
                              {r.code}
                            </span>
                            <div className="min-w-0">
                              <span className="font-bold text-slate-800">
                                {cls?.name}:{' '}
                              </span>
                              <span className="text-slate-600">
                                {r.marker} {r.title}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-2">
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
                      className="text-xs font-bold text-rose-600 hover:underline cursor-pointer"
                    >
                      Excluir Evento
                    </button>
                  ) : (
                    <span className="text-xs text-slate-500">
                      Pronto para lançamento em lote
                    </span>
                  )}
                  <button
                    onClick={() => openExecuteModal(ev)}
                    className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <CheckSquare className="w-4 h-4 text-emerald-400" />
                    Lançar Presença & Assinar Lote
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Criar Evento */}
      {createOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="text-base font-extrabold flex items-center gap-2">
                <CalendarPlus className="w-5 h-5 text-emerald-400" />
                Agendar Evento do Clube (Multirrequisito)
              </h3>
              <button
                onClick={() => setCreateOpen(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={handleCreateSubmit}
              className="p-6 space-y-4 overflow-y-auto"
            >
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Título do Evento *
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ex: Acampamento de Instrução de Inverno"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Data Prevista *
                  </label>
                  <input
                    type="date"
                    required
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tipo de Atividade
                  </label>
                  <select
                    value={eventType}
                    onChange={(e) => setEventType(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                  >
                    {EVENT_TYPES.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Descrição / Local
                  </label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Ex: Chácara Recanto das Águas..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                  />
                </div>
              </div>

              {/* Seletor de Requisitos Vinculados */}
              <div className="border-t border-slate-200 pt-3 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label className="text-xs font-bold text-slate-800">
                    Requisitos que serão cumpridos neste evento ({selectedReqIds.length} selecionados) *
                  </label>
                  <select
                    value={reqTagFilter}
                    onChange={(e) => setReqTagFilter(e.target.value)}
                    className="px-2.5 py-1 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700"
                  >
                    <option value="ALL">Filtrar por Tag (Todas)</option>
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
                    className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs"
                  />
                </div>

                <div className="max-h-56 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100">
                  {selectableRequirements.map((r) => {
                    const checked = selectedReqIds.includes(r.id);
                    const cls = classesMap[r.class_slug];
                    return (
                      <label
                        key={r.id}
                        className={`p-2.5 flex items-start gap-2.5 text-xs cursor-pointer transition ${
                          checked ? 'bg-emerald-50/70' : 'hover:bg-slate-50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleReqSelection(r.id)}
                          className="mt-0.5 rounded text-emerald-600"
                        />
                        <span
                          className="px-1.5 py-0.5 rounded text-[10px] font-extrabold text-white shrink-0"
                          style={{ backgroundColor: cls?.color || '#334155' }}
                        >
                          {r.code}
                        </span>
                        <div className="min-w-0">
                          <span className="font-bold text-slate-900">
                            {cls?.name}:{' '}
                          </span>
                          <span className="text-slate-700">
                            {r.marker} {r.title}
                          </span>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setCreateOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingEvent || selectedReqIds.length === 0}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold cursor-pointer"
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
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold">
                  Lançar Presença & Assinar Requisitos em Lote
                </h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  {executingEvent.title} ({formatDateBR(executingEvent.event_date)})
                </p>
              </div>
              <button
                onClick={() => setExecutingEvent(null)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={handleExecuteSubmit}
              className="p-6 space-y-4 overflow-y-auto"
            >
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-900">
                Os desbravadores marcados abaixo terão os requisitos deste evento (nas classes em que estão matriculados) atualizados simultaneamente em um único lote auditado.
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-800">
                    Desbravadores Presentes ({selectedPfIds.length})
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedPfIds(activePathfinders.map((p) => p.id))
                      }
                      className="text-[11px] font-bold text-indigo-600 hover:underline cursor-pointer"
                    >
                      Marcar Todos
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedPfIds([])}
                      className="text-[11px] font-bold text-slate-500 hover:underline cursor-pointer"
                    >
                      Desmarcar
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto border border-slate-200 rounded-xl p-2">
                  {activePathfinders.map((pf) => {
                    const checked = selectedPfIds.includes(pf.id);
                    return (
                      <label
                        key={pf.id}
                        className={`p-2 rounded-lg border text-xs flex items-center gap-2 cursor-pointer ${
                          checked
                            ? 'bg-indigo-50 border-indigo-300 font-bold text-slate-900'
                            : 'border-slate-200 text-slate-600'
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
                          className="rounded text-indigo-600"
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Status a Aplicar
                  </label>
                  <select
                    value={targetStatus}
                    onChange={(e) => setTargetStatus(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold"
                  >
                    <option value="APROVADO">APROVADO (Assinado p/ Investidura)</option>
                    <option value="CONCLUIDO">FEITO (Aguardando Visto)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Registro / Evidência no Cartão
                  </label>
                  <input
                    type="text"
                    value={execNotes}
                    onChange={(e) => setExecNotes(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setExecutingEvent(null)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={runningExecute || selectedPfIds.length === 0}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold cursor-pointer"
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
