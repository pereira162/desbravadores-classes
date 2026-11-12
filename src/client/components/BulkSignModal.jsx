import React, { useState, useEffect, useMemo } from 'react';
import { X, CheckSquare, Square, Users, CheckCircle2, Calendar, FileText } from 'lucide-react';
import { STATUS_CONFIG } from '../constants';
import DateInput from './DateInput';
import { useModalDismiss } from '../utils/modalStack';

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

  // Registro na pilha hierárquica global (ESC e Voltar Mobile)
  useModalDismiss(isOpen, onClose, 'ModalAssinaturaLote');


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
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget && !saving) onClose();
      }}
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fade-in"
    >
      <div className="bg-white/95 dark:bg-[#1c1c1e]/95 backdrop-blur-2xl rounded-3xl shadow-2xl border border-black/[0.08] dark:border-white/[0.12] w-full max-w-2xl overflow-hidden my-6">
        {/* Header Transparente Apple */}
        <div className="px-6 py-4.5 border-b border-black/[0.06] dark:border-white/[0.08] flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-500 block">
              Assinatura e Baixa em Lote (Auditada)
            </span>
            <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
              {requirements.length === 1
                ? `${requirements[0].code} — ${requirements[0].title}`
                : `${requirements.length} Requisitos Equivalentes Selecionados`}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#2c2c2e] transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Resumo dos requisitos que serão assinados */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#252528] border border-black/[0.04] dark:border-white/[0.06] space-y-2 max-h-36 overflow-y-auto">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Atividade(s) incluída(s) nesta baixa:
            </div>
            {requirements.map((r) => {
              const cls = classesMap[r.class_slug];
              return (
                <div key={r.id} className="text-xs text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <span
                    className="px-2 py-0.5 rounded-md text-[10px] font-bold text-white shrink-0"
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
            <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-semibold">
              {error}
            </div>
          )}

          {/* Lista de Desbravadores para marcar presença/conclusão */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-blue-500" />
                Desbravadores ({selectedPfIds.length} de {eligiblePathfinders.length} selecionados)
              </label>
              <div className="flex items-center gap-3 text-xs">
                <button
                  type="button"
                  onClick={() => setSelectedPfIds(eligiblePathfinders.map((p) => p.id))}
                  className="font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                >
                  Marcar Todos
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedPfIds([])}
                  className="font-medium text-slate-500 hover:underline cursor-pointer"
                >
                  Limpar
                </button>
              </div>
            </div>

            {eligiblePathfinders.length === 0 ? (
              <div className="p-6 rounded-2xl bg-slate-50 dark:bg-[#252528] border border-black/[0.04] dark:border-white/[0.06] text-xs text-slate-500 text-center">
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
                      className={`p-2.5 rounded-xl border text-left flex items-center justify-between gap-2 transition-all cursor-pointer active:scale-[0.98] ${
                        checked
                          ? 'bg-emerald-500/10 border-emerald-500/40 text-slate-900 dark:text-white shadow-xs'
                          : 'bg-white dark:bg-[#252528] hover:bg-slate-50 dark:hover:bg-[#2c2c2e] border-black/[0.06] dark:border-white/[0.08] text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {checked ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        ) : (
                          <div className="w-4 h-4 rounded-full border border-slate-300 dark:border-slate-600 shrink-0" />
                        )}
                        <div className="truncate">
                          <div className="text-xs font-bold truncate text-slate-900 dark:text-white">{pf.name}</div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400">{pf.unit_name || 'Sem unidade'}</div>
                        </div>
                      </div>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold border shrink-0 ${stCfg.bgClass}`}
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                Status a Aplicar
              </label>
              <select
                value={targetStatus}
                onChange={(e) => setTargetStatus(e.target.value)}
                className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-black/[0.08] dark:border-white/[0.12] bg-white dark:bg-[#252528] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              >
                <option value="APROVADO">🟢 APROVADO / ASSINADO (100%)</option>
                <option value="CONCLUIDO">🔵 FEITO (Aguardando Visto Final)</option>
                <option value="EM_ANDAMENTO">🟡 EM ANDAMENTO</option>
                <option value="PENDENTE">⚪ PENDENTE (Desmarcar)</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                Data de Realização
              </label>
              <DateInput
                value={completedAt}
                onChange={(newDate) => setCompletedAt(newDate)}
                className="px-3 py-2 text-xs rounded-xl border border-black/[0.08] dark:border-white/[0.12] bg-white dark:bg-[#252528] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
              Evidência / Observação para os Cartões (Opcional)
            </label>
            <div className="relative">
              <FileText className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ex: Realizado na instrução geral do domingo / Acampamento..."
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-black/[0.08] dark:border-white/[0.12] bg-white dark:bg-[#252528] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 font-medium"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-black/[0.06] dark:border-white/[0.08]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-full text-slate-600 dark:text-slate-400 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-[#2c2c2e] transition-all cursor-pointer active:scale-95"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving || selectedPfIds.length === 0}
              className="px-5 py-2 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all disabled:opacity-40"
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
