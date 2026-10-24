import React, { useState, useEffect, useMemo } from 'react';
import { X, CheckSquare, Square, Users, CheckCircle2, Calendar, FileText } from 'lucide-react';
import { STATUS_CONFIG } from '../constants';

export default function BulkSignModal({
  isOpen,
  onClose,
  requirements = [],
  pathfinders = [],
  progressMap = {},
  classesMap = {},
  onExecuteBulk,
}) {
  const [selectedPfIds, setSelectedPfIds] = useState([]);
  const [targetStatus, setTargetStatus] = useState('APROVADO');
  const [completedAt, setCompletedAt] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Filtra desbravadores matriculados nas classes dos requisitos selecionados
  const eligiblePathfinders = useMemo(() => {
    if (!requirements || requirements.length === 0) return [];
    const reqClassSlugs = new Set(requirements.map((r) => r.class_slug));
    return pathfinders.filter(
      (pf) =>
        pf.active &&
        pf.enrollments?.some((enr) => reqClassSlugs.has(enr.class_slug))
    );
  }, [requirements, pathfinders]);

  useEffect(() => {
    if (!isOpen) return;
    // Por padrão, seleciona todos os elegíveis que ainda NÃO estão com status APROVADO em algum dos requisitos
    const pendingIds = eligiblePathfinders
      .filter((pf) =>
        requirements.some((req) => {
          const isEnrolled = pf.enrollments?.some((e) => e.class_slug === req.class_slug);
          if (!isEnrolled) return false;
          const pr = progressMap[`${pf.id}:${req.id}`];
          return !pr || pr.status !== 'APROVADO';
        })
      )
      .map((pf) => pf.id);

    setSelectedPfIds(pendingIds.length > 0 ? pendingIds : eligiblePathfinders.map((p) => p.id));
    setTargetStatus('APROVADO');
    setCompletedAt(new Date().toISOString().slice(0, 10));
    setNotes('');
    setError('');
  }, [isOpen, eligiblePathfinders, requirements, progressMap]);

  if (!isOpen || !requirements || requirements.length === 0) return null;

  const togglePf = (id) => {
    setSelectedPfIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (selectedPfIds.length === 0) {
      setError('Selecione ao menos um desbravador.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await onExecuteBulk({
        pathfinder_ids: selectedPfIds,
        requirement_ids: requirements.map((r) => r.id),
        status: targetStatus,
        completed_at: completedAt,
        notes,
        reason_label:
          requirements.length === 1
            ? `Baixa em Lote (${requirements[0].code})`
            : `Baixa Unificada (${requirements.length} requisitos)`,
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Falha ao executar assinatura em lote.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden my-8">
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 block">
              Assinatura e Baixa em Lote (Auditada)
            </span>
            <h3 className="text-base font-extrabold">
              {requirements.length === 1
                ? `${requirements[0].code} — ${requirements[0].title}`
                : `${requirements.length} Requisitos Equivalentes Selecionados`}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[82vh] overflow-y-auto">
          {/* Resumo dos requisitos que serão assinados */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5 max-h-36 overflow-y-auto">
            <div className="text-[11px] font-bold uppercase text-slate-500">
              Atividade(s) incluída(s) nesta baixa:
            </div>
            {requirements.map((r) => {
              const cls = classesMap[r.class_slug];
              return (
                <div key={r.id} className="text-xs text-slate-800 flex items-center gap-2">
                  <span
                    className="px-2 py-0.5 rounded text-[10px] font-bold text-white shrink-0"
                    style={{ backgroundColor: cls?.color_hex || '#475569' }}
                  >
                    {cls?.name || r.class_slug}
                  </span>
                  <span className="font-bold">{r.code}:</span>
                  <span className="truncate">{r.title}</span>
                </div>
              );
            })}
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
              {error}
            </div>
          )}

          {/* Lista de Desbravadores para marcar presença/conclusão */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-amber-600" />
                Desbravadores ({selectedPfIds.length} de {eligiblePathfinders.length} selecionados)
              </label>
              <div className="flex items-center gap-3 text-xs">
                <button
                  type="button"
                  onClick={() => setSelectedPfIds(eligiblePathfinders.map((p) => p.id))}
                  className="font-bold text-amber-700 hover:underline cursor-pointer"
                >
                  Marcar Todos
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedPfIds([])}
                  className="font-semibold text-slate-500 hover:underline cursor-pointer"
                >
                  Limpar
                </button>
              </div>
            </div>

            {eligiblePathfinders.length === 0 ? (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500 text-center">
                Nenhum desbravador ativo está matriculado na(s) classe(s) deste requisito.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto p-1">
                {eligiblePathfinders.map((pf) => {
                  const checked = selectedPfIds.includes(pf.id);
                  // Verifica status atual no primeiro requisito aplicável
                  const appReq =
                    requirements.find((r) =>
                      pf.enrollments?.some((e) => e.class_slug === r.class_slug)
                    ) || requirements[0];
                  const curStatus = progressMap[`${pf.id}:${appReq.id}`]?.status || 'PENDENTE';
                  const stCfg = STATUS_CONFIG[curStatus] || STATUS_CONFIG.PENDENTE;

                  return (
                    <button
                      key={pf.id}
                      type="button"
                      onClick={() => togglePf(pf.id)}
                      className={`p-2.5 rounded-xl border text-left flex items-center justify-between gap-2 transition cursor-pointer ${
                        checked
                          ? 'bg-emerald-50/90 border-emerald-500 text-slate-900'
                          : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-600'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        {checked ? (
                          <CheckSquare className="w-4 h-4 text-emerald-600 shrink-0" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-400 shrink-0" />
                        )}
                        <div className="truncate">
                          <div className="text-xs font-bold truncate">{pf.name}</div>
                          <div className="text-[10px] text-slate-500">{pf.unit_name || 'Sem unidade'}</div>
                        </div>
                      </div>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded border shrink-0 ${stCfg.bgClass}`}
                      >
                        {stCfg.shortLabel}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Status Alvo, Data e Observação */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Status a Aplicar
              </label>
              <select
                value={targetStatus}
                onChange={(e) => setTargetStatus(e.target.value)}
                className="w-full px-3 py-2 text-xs font-bold rounded-lg border border-slate-300 bg-white outline-none"
              >
                <option value="APROVADO">🟢 APROVADO / ASSINADO (100%)</option>
                <option value="CONCLUIDO">🔵 FEITO (Aguardando Visto Final)</option>
                <option value="EM_ANDAMENTO">🟡 EM ANDAMENTO</option>
                <option value="PENDENTE">⚪ PENDENTE (Desmarcar)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Data de Realização
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="date"
                  value={completedAt}
                  onChange={(e) => setCompletedAt(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 outline-none"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Evidência / Observação para os Cartões (Opcional)
            </label>
            <div className="relative">
              <FileText className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ex: Realizado na instrução geral do domingo / Acampamento..."
                className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 outline-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving || selectedPfIds.length === 0}
              className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              {saving
                ? 'Processando Lote...'
                : `Confirmar para ${selectedPfIds.length} Desbravador(es)`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
