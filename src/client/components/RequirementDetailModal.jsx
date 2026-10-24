import React, { useState, useEffect } from 'react';
import {
  X,
  CheckCircle2,
  Clock,
  CheckSquare,
  Square,
  BookOpen,
  Calendar,
  UserCheck,
  FileText,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { STATUS_CONFIG, EXECUTION_CONTEXT_LABELS, formatDateBR } from '../constants';

export default function RequirementDetailModal({
  isOpen,
  onClose,
  requirement,
  classInfo,
  pathfinder,
  progressRecord,
  onSaveProgress,
  onOpenBulkForRequirement,
}) {
  const [status, setStatus] = useState('PENDENTE');
  const [completedSubItems, setCompletedSubItems] = useState([]);
  const [notes, setNotes] = useState('');
  const [completedAt, setCompletedAt] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen || !requirement) return;
    setStatus(progressRecord?.status || 'PENDENTE');
    setCompletedSubItems(progressRecord?.completed_sub_items || []);
    setNotes(progressRecord?.notes || '');
    setCompletedAt(
      progressRecord?.completed_at || new Date().toISOString().slice(0, 10)
    );
    setError('');
  }, [isOpen, requirement, progressRecord]);

  if (!isOpen || !requirement) return null;

  const subItems = requirement.sub_items || [];
  const ctxInfo =
    EXECUTION_CONTEXT_LABELS[requirement.execution_context] ||
    EXECUTION_CONTEXT_LABELS.REUNIAO_CLUBE;

  const toggleSubItem = (code) => {
    setCompletedSubItems((prev) => {
      const exists = prev.includes(code);
      const next = exists ? prev.filter((c) => c !== code) : [...prev, code];

      // Auto-adjust status based on sub-items checked
      if (subItems.length > 0) {
        let requiredCount = subItems.length;
        if (requirement.selection_rule === 'ESCOLHER_1') requiredCount = 1;
        if (requirement.selection_rule === 'ESCOLHER_2') requiredCount = 2;

        if (next.length === 0) {
          setStatus('PENDENTE');
        } else if (next.length < requiredCount && status === 'PENDENTE') {
          setStatus('EM_ANDAMENTO');
        } else if (next.length >= requiredCount && (status === 'PENDENTE' || status === 'EM_ANDAMENTO')) {
          setStatus('CONCLUIDO');
        }
      }
      return next;
    });
  };

  const handleSelectAllSubs = () => {
    const allCodes = subItems.map((s) => s.code);
    setCompletedSubItems(allCodes);
    if (status === 'PENDENTE' || status === 'EM_ANDAMENTO') {
      setStatus('APROVADO');
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!pathfinder) return;
    setSaving(true);
    setError('');
    try {
      await onSaveProgress({
        pathfinder_id: pathfinder.id,
        requirement_id: requirement.id,
        status,
        completed_sub_items: completedSubItems,
        notes,
        completed_at: completedAt,
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Erro ao salvar progresso.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden my-8">
        {/* Header colorido conforme a classe */}
        <div
          className="px-6 py-4 text-white flex items-start justify-between gap-4"
          style={{ backgroundColor: classInfo?.color_hex || '#1e293b' }}
        >
          <div>
            <div className="flex flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-wider opacity-95 mb-1">
              <span className="bg-black/25 px-2 py-0.5 rounded">
                {classInfo?.name || requirement.class_slug}
              </span>
              <span>•</span>
              <span>
                {requirement.section_code}. {requirement.section_name}
              </span>
              <span>•</span>
              <span className="bg-white/20 px-2 py-0.5 rounded">{ctxInfo.label}</span>
            </div>
            <h3 className="text-lg font-extrabold leading-snug">
              Requisito {requirement.code} — {requirement.title}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-black/20 hover:bg-black/35 text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 max-h-[80vh] overflow-y-auto space-y-5">
          {/* Descrição Oficial Completa do Cartão */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1 flex items-center justify-between">
              <span>Texto Oficial do Cartão (DSA)</span>
              {requirement.selection_rule !== 'TODOS' && (
                <span className="text-amber-700 bg-amber-100 px-2 py-0.5 rounded font-bold">
                  Regra:{' '}
                  {requirement.selection_rule === 'ESCOLHER_1'
                    ? 'Escolher 1 opção'
                    : 'Escolher 2 opções'}
                </span>
              )}
            </div>
            <p className="text-sm text-slate-800 leading-relaxed font-medium">
              {requirement.description}
            </p>

            {requirement.book_info && (
              <div className="mt-2.5 pt-2.5 border-t border-slate-200 text-xs text-slate-600 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  <strong>Livro Oficial Atual:</strong> {requirement.book_info.livro_atual} |{' '}
                  <strong>Edição Anterior Aceita:</strong> {requirement.book_info.livro_historico}
                </span>
              </div>
            )}
          </div>

          {/* Se houver Desbravador selecionado: Formulário de Avaliação Individual */}
          {pathfinder ? (
            <form onSubmit={handleSave} className="space-y-5">
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-amber-50/70 border border-amber-200">
                <div>
                  <span className="text-[11px] font-bold uppercase text-amber-800 block">
                    Avaliando Desbravador(a)
                  </span>
                  <span className="text-base font-extrabold text-slate-900">
                    {pathfinder.name}
                  </span>
                  <span className="text-xs text-slate-600 ml-2">
                    ({pathfinder.unit_name || 'Sem Unidade'})
                  </span>
                </div>
                {onOpenBulkForRequirement && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenBulkForRequirement(requirement);
                    }}
                    className="text-xs font-bold text-amber-800 hover:text-amber-950 bg-amber-200/70 hover:bg-amber-200 px-3 py-1.5 rounded-lg transition cursor-pointer"
                  >
                    Assinar p/ Vários Desbravadores
                  </button>
                )}
              </div>

              {error && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
                  {error}
                </div>
              )}

              {/* Sub-itens interativos (a, b, c, nós, versos, especialidades) */}
              {subItems.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      Sub-itens / Opções do Requisito ({completedSubItems.length} de {subItems.length}{' '}
                      marcados)
                    </label>
                    <button
                      type="button"
                      onClick={handleSelectAllSubs}
                      className="text-xs font-bold text-emerald-700 hover:underline cursor-pointer"
                    >
                      Marcar todos os sub-itens
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-52 overflow-y-auto p-1">
                    {subItems.map((sub) => {
                      const checked = completedSubItems.includes(sub.code);
                      return (
                        <button
                          key={sub.code}
                          type="button"
                          onClick={() => toggleSubItem(sub.code)}
                          className={`text-left p-2.5 rounded-lg border text-xs flex items-start gap-2.5 transition cursor-pointer ${
                            checked
                              ? 'bg-emerald-50 border-emerald-400 text-emerald-950 font-semibold'
                              : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                          }`}
                        >
                          {checked ? (
                            <CheckSquare className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                          )}
                          <span>
                            <strong className="uppercase">{sub.code})</strong> {sub.text}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Seleção de Status */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  Status de Cumprimento no Cartão
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {Object.values(STATUS_CONFIG).map((st) => {
                    const active = status === st.code;
                    return (
                      <button
                        key={st.code}
                        type="button"
                        onClick={() => setStatus(st.code)}
                        className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                          active
                            ? `${st.bgClass} ring-2 ring-offset-1 ring-slate-800`
                            : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-200'
                        }`}
                      >
                        <span className={`w-2 h-2 rounded-full ${st.dotClass}`} />
                        {st.shortLabel}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Data e Observações de Evidência */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Data da Atividade
                  </label>
                  <div className="relative">
                    <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="date"
                      value={completedAt}
                      onChange={(e) => setCompletedAt(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 focus:border-amber-600 outline-none"
                    />
                  </div>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Observações / Especialidade Escolhida / Evidência
                  </label>
                  <div className="relative">
                    <FileText className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Ex: Especialidade de Cães concluída, relatório entregue..."
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 focus:border-amber-600 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Histórico de Assinatura atual se existir */}
              {progressRecord && progressRecord.status !== 'PENDENTE' && (
                <div className="p-3 rounded-lg bg-slate-100 text-xs text-slate-600 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <UserCheck className="w-3.5 h-3.5 inline mr-1 text-slate-500" />
                    <strong>Marcado por:</strong> {progressRecord.marked_by_name || '—'}
                    {progressRecord.approved_by_name && (
                      <span className="ml-3 text-emerald-700 font-semibold">
                        ✓ Assinado por: {progressRecord.approved_by_name}
                      </span>
                    )}
                  </div>
                  <span>Data: {formatDateBR(progressRecord.completed_at)}</span>
                </div>
              )}

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
                  disabled={saving}
                  className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition cursor-pointer disabled:opacity-50"
                >
                  {saving ? 'Salvando...' : 'Salvar no Cartão e Auditar'}
                </button>
              </div>
            </form>
          ) : (
            <div className="flex items-center justify-between pt-2">
              <div className="text-xs text-slate-500">
                Tags: {(requirement.tags || []).map((t) => `#${t}`).join('  ')}
              </div>
              {onOpenBulkForRequirement && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenBulkForRequirement(requirement);
                  }}
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer"
                >
                  ✓ Dar Baixa em Lote neste Requisito
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
