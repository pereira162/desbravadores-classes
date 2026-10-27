import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  CheckCircle2,
  CheckSquare,
  Square,
  BookOpen,
  Calendar,
  UserCheck,
  FileText,
  Camera,
  Paperclip,
  Trash2,
  MessageSquare,
  Send,
  RotateCcw,
  ZoomIn,
} from 'lucide-react';
import { STATUS_CONFIG, EXECUTION_CONTEXT_LABELS, formatDateBR } from '../constants';
import DateInput from './DateInput';
import { apiRequest } from '../api';

// Comprime imagens no navegador para envio rápido e leve
function compressImageFile(file, maxDimension = 1200, quality = 0.8) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.onerror = reject;
      img.src = ev.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function RequirementDetailModal({
  isOpen,
  onClose,
  requirement,
  classInfo,
  pathfinder,
  progressRecord,
  currentUser,
  onSaveProgress,
  onOpenBulkForRequirement,
}) {
  const [status, setStatus] = useState('PENDENTE');
  const [completedSubItems, setCompletedSubItems] = useState([]);
  const [notes, setNotes] = useState('');
  const [submissionText, setSubmissionText] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [reviewNotes, setReviewNotes] = useState('');
  const [completedAt, setCompletedAt] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [error, setError] = useState('');
  const [previewAttachment, setPreviewAttachment] = useState(null);

  const fileInputRef = useRef(null);

  const isPathfinderUser = currentUser?.role === 'DESBRAVADOR';
  const isAlreadyApproved = progressRecord?.status === 'APROVADO';

  useEffect(() => {
    if (!isOpen || !requirement) return;
    setStatus(progressRecord?.status || 'PENDENTE');
    setCompletedSubItems(progressRecord?.completed_sub_items || []);
    setNotes(progressRecord?.notes || '');
    setSubmissionText(progressRecord?.submission_text || '');
    const initialAtts = Array.isArray(progressRecord?.attachments)
      ? progressRecord.attachments
      : [];
    setAttachments(initialAtts);
    setReviewNotes(progressRecord?.review_notes || '');
    setCompletedAt(
      progressRecord?.completed_at || new Date().toISOString().slice(0, 10)
    );
    setError('');
    setPreviewAttachment(null);

    // Otimização: Carrega anexos pesados (fotos Base64) sob demanda
    if (pathfinder && initialAtts.some((a) => a.has_data && !a.data_url)) {
      apiRequest(`/api/progress/${pathfinder.id}/${requirement.id}/attachments`)
        .then((res) => {
          if (Array.isArray(res.attachments) && res.attachments.length > 0) {
            setAttachments(res.attachments);
          }
        })
        .catch(() => {});
    }
  }, [isOpen, requirement, pathfinder, progressRecord]);

  if (!isOpen || !requirement) return null;

  const subItems = requirement.sub_items || [];
  const ctxInfo =
    EXECUTION_CONTEXT_LABELS[requirement.execution_context] ||
    EXECUTION_CONTEXT_LABELS.REUNIAO_CLUBE;

  const toggleSubItem = (code) => {
    if (isPathfinderUser && isAlreadyApproved) return;
    setCompletedSubItems((prev) => {
      const exists = prev.includes(code);
      const next = exists ? prev.filter((c) => c !== code) : [...prev, code];

      if (subItems.length > 0) {
        let requiredCount = subItems.length;
        if (requirement.selection_rule === 'ESCOLHER_1') requiredCount = 1;
        if (requirement.selection_rule === 'ESCOLHER_2') requiredCount = 2;

        if (next.length === 0) {
          setStatus('PENDENTE');
        } else if (next.length < requiredCount && status === 'PENDENTE') {
          setStatus('EM_ANDAMENTO');
        } else if (
          next.length >= requiredCount &&
          (status === 'PENDENTE' || status === 'EM_ANDAMENTO')
        ) {
          setStatus('CONCLUIDO');
        }
      }
      return next;
    });
  };

  const handleSelectAllSubs = () => {
    if (isPathfinderUser && isAlreadyApproved) return;
    const allCodes = subItems.map((s) => s.code);
    setCompletedSubItems(allCodes);
    if (status === 'PENDENTE' || status === 'EM_ANDAMENTO') {
      setStatus(isPathfinderUser ? 'CONCLUIDO' : 'APROVADO');
    }
  };

  const handleFilesSelected = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setUploadingFiles(true);
    setError('');
    try {
      const added = [];
      for (const file of files) {
        if (file.size > 12 * 1024 * 1024) {
          throw new Error(`O arquivo "${file.name}" excede o limite de 12 MB.`);
        }
        let dataUrl = '';
        const isImg = file.type.startsWith('image/');
        if (isImg) {
          dataUrl = await compressImageFile(file);
        } else {
          dataUrl = await readFileAsDataUrl(file);
        }
        added.push({
          id: `att-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          name: file.name,
          type: isImg ? 'image/jpeg' : file.type || 'application/octet-stream',
          data_url: dataUrl,
          uploaded_at: new Date().toISOString(),
          uploaded_by: currentUser?.name || pathfinder?.name || 'Desbravador',
        });
      }
      setAttachments((prev) => [...prev, ...added]);
    } catch (err) {
      setError(err.message || 'Erro ao anexar arquivo.');
    } finally {
      setUploadingFiles(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveAttachment = (attId) => {
    setAttachments((prev) => prev.filter((a) => a.id !== attId));
  };

  const submitWithStatus = async (targetStatus) => {
    if (!pathfinder) return;
    setSaving(true);
    setError('');
    try {
      let subsToSave = completedSubItems;
      if (
        (targetStatus === 'CONCLUIDO' || targetStatus === 'APROVADO') &&
        subItems.length > 0 &&
        completedSubItems.length === 0
      ) {
        subsToSave = subItems.map((s) => s.code);
      }

      await onSaveProgress({
        pathfinder_id: pathfinder.id,
        requirement_id: requirement.id,
        status: targetStatus,
        completed_sub_items: subsToSave,
        notes,
        submission_text: submissionText,
        attachments,
        review_notes: reviewNotes,
        completed_at: completedAt,
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Erro ao salvar progresso.');
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    await submitWithStatus(status);
  };

  const hasPathfinderEvidence =
    Boolean(submissionText.trim()) ||
    attachments.length > 0 ||
    Boolean(progressRecord?.submitted_by_pathfinder);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl flex flex-col max-h-[90vh] overflow-hidden my-auto">
        {/* Header colorido conforme a classe */}
        <div
          className="px-6 py-4 text-white flex items-start justify-between gap-4 shrink-0"
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

        {pathfinder ? (
          <form onSubmit={handleSave} className="flex-1 flex flex-col min-h-0 overflow-hidden">
            <div className="p-6 overflow-y-auto space-y-5 flex-1 min-h-0">
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

              {/* Cabeçalho do Desbravador */}
              <div className="flex flex-wrap items-center justify-between gap-2 p-3.5 rounded-xl bg-amber-50/70 border border-amber-200">
                <div>
                  <span className="text-[11px] font-bold uppercase text-amber-800 block">
                    {isPathfinderUser ? 'Meu Cartão de Classes' : 'Desbravador(a)'}
                  </span>
                  <span className="text-base font-extrabold text-slate-900">
                    {pathfinder.name}
                  </span>
                  <span className="text-xs text-slate-600 ml-2">
                    ({pathfinder.unit_name || 'Sem Unidade'})
                  </span>
                </div>
                {!isPathfinderUser && onOpenBulkForRequirement && (
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

              {/* Feedback da Liderança visível para o Desbravador */}
              {isPathfinderUser && (reviewNotes || notes) && (
                <div className="p-3.5 rounded-xl bg-indigo-50 border border-indigo-200 text-xs text-indigo-950 space-y-1">
                  <div className="font-extrabold uppercase tracking-wider text-indigo-700 flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5" />
                    Orientação / Parecer da Liderança
                  </div>
                  {reviewNotes && <p className="font-semibold">{reviewNotes}</p>}
                  {notes && <p className="text-slate-700">{notes}</p>}
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
                    {!(isPathfinderUser && isAlreadyApproved) && (
                      <button
                        type="button"
                        onClick={handleSelectAllSubs}
                        className="text-xs font-bold text-emerald-700 hover:underline cursor-pointer"
                      >
                        Marcar todos os sub-itens
                      </button>
                    )}
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

              {/* BLOCO DE RELATO, DATA ("QUANDO FEZ"), EXPLICAÇÃO ("COMO FEZ") E ANEXOS/FOTOS */}
              <div className="p-4 rounded-2xl bg-sky-50/60 border border-sky-200 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-sky-950 flex items-center gap-1.5">
                      <Camera className="w-4 h-4 text-sky-600" />
                      {isPathfinderUser
                        ? 'Relato da Atividade: Quando Fez, Como Fez & Fotos/Anexos'
                        : hasPathfinderEvidence
                        ? 'Relato e Evidências Enviadas pelo Desbravador'
                        : 'Registro de Execução, Relato & Fotos/Anexos'}
                    </h4>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      {isPathfinderUser
                        ? 'Explique como você realizou este requisito, informe a data e adicione fotos ou arquivos para o seu instrutor avaliar:'
                        : 'Confira ou complemente a data de realização, explicação da atividade e fotos comprobatórias:'}
                    </p>
                  </div>

                  <div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*,application/pdf"
                      multiple
                      onChange={handleFilesSelected}
                      className="hidden"
                    />
                    {!(isPathfinderUser && isAlreadyApproved) && (
                      <button
                        type="button"
                        disabled={uploadingFiles}
                        onClick={() => fileInputRef.current?.click()}
                        className="px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-2xs cursor-pointer"
                      >
                        <Paperclip className="w-3.5 h-3.5" />
                        {uploadingFiles ? 'Processando...' : 'Adicionar Fotos / Anexos'}
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Quando fez? (Data) *
                    </label>
                    <DateInput
                      disabled={isPathfinderUser && isAlreadyApproved}
                      value={completedAt}
                      onChange={(newDate) => setCompletedAt(newDate)}
                      className="px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white outline-none"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Como fez? (Explicação / Comentários / Relatório)
                    </label>
                    <textarea
                      rows={3}
                      disabled={isPathfinderUser && isAlreadyApproved}
                      value={submissionText}
                      onChange={(e) => setSubmissionText(e.target.value)}
                      placeholder="Explique aqui como e onde você cumpriu o requisito, resumo da leitura ou detalhes da atividade..."
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 bg-white outline-none leading-relaxed"
                    />
                  </div>
                </div>

                {/* Galeria de Anexos / Fotos */}
                {attachments.length > 0 && (
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-slate-600 mb-2">
                      Anexos e Fotos ({attachments.length})
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      {attachments.map((att) => {
                        const isImg =
                          att.type?.startsWith('image/') ||
                          att.data_url?.startsWith('data:image/');
                        return (
                          <div
                            key={att.id}
                            className="group relative rounded-xl border border-slate-200 bg-white overflow-hidden shadow-2xs flex flex-col"
                          >
                            {isImg ? (
                              <button
                                type="button"
                                onClick={() => setPreviewAttachment(att)}
                                className="relative h-24 w-full bg-slate-100 overflow-hidden cursor-pointer"
                              >
                                <img
                                  src={att.data_url}
                                  alt={att.name}
                                  className="w-full h-full object-cover group-hover:scale-105 transition"
                                />
                                <span className="absolute bottom-1 right-1 bg-black/60 text-white p-1 rounded-md">
                                  <ZoomIn className="w-3.5 h-3.5" />
                                </span>
                              </button>
                            ) : (
                              <a
                                href={att.data_url}
                                download={att.name}
                                target="_blank"
                                rel="noreferrer"
                                className="h-24 w-full bg-slate-100 flex flex-col items-center justify-center p-2 text-center hover:bg-slate-200 transition"
                              >
                                <FileText className="w-7 h-7 text-indigo-600 mb-1" />
                                <span className="text-[10px] font-bold text-slate-700 truncate w-full">
                                  Abrir Arquivo
                                </span>
                              </a>
                            )}

                            <div className="px-2 py-1.5 flex items-center justify-between gap-1 bg-white border-t border-slate-100">
                              <span
                                className="text-[10px] text-slate-600 truncate"
                                title={att.name}
                              >
                                {att.name}
                              </span>
                              {!(isPathfinderUser && isAlreadyApproved) && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveAttachment(att.id)}
                                  className="text-rose-500 hover:text-rose-700 p-0.5 cursor-pointer shrink-0"
                                  title="Remover anexo"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* CONTROLES EXCLUSIVOS DA LIDERANÇA (STATUS, PARECER E APROVAÇÃO EM 1 CLIQUE) */}
              {!isPathfinderUser && (
                <div className="space-y-4 pt-1">
                  {/* Aprovação Rápida se o Desbravador enviou ou está aguardando visto */}
                  {(status === 'CONCLUIDO' || hasPathfinderEvidence) && (
                    <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div>
                        <div className="text-xs font-extrabold text-emerald-950">
                          Avaliação Rápida da Solicitação do Desbravador
                        </div>
                        <p className="text-[11px] text-emerald-800">
                          Aprove e assine imediatamente ou devolva para ajustes com uma orientação abaixo.
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 shrink-0">
                        <button
                          type="button"
                          disabled={saving}
                          onClick={() => submitWithStatus('EM_ANDAMENTO')}
                          className="px-3 py-2 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 text-xs font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          Pedir Ajustes
                        </button>
                        <button
                          type="button"
                          disabled={saving}
                          onClick={() => submitWithStatus('APROVADO')}
                          className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          Aprovar e Assinar
                        </button>
                      </div>
                    </div>
                  )}

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

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Observação / Registro no Cartão
                      </label>
                      <input
                        type="text"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Ex: Especialidade concluída, visto pelo instrutor..."
                        className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Feedback / Orientação para o Desbravador
                      </label>
                      <input
                        type="text"
                        value={reviewNotes}
                        onChange={(e) => setReviewNotes(e.target.value)}
                        placeholder="Visível para o desbravador no cartão dele..."
                        className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Histórico de Assinatura atual se existir */}
              {progressRecord && progressRecord.status !== 'PENDENTE' && (
                <div className="p-3 rounded-xl bg-slate-100 text-xs text-slate-600 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <UserCheck className="w-3.5 h-3.5 inline mr-1 text-slate-500" />
                    <strong>Marcado por:</strong> {progressRecord.marked_by_name || '—'}
                    {progressRecord.approved_by_name && (
                      <span className="ml-3 text-emerald-700 font-bold">
                        ✓ Assinado por: {progressRecord.approved_by_name}
                      </span>
                    )}
                  </div>
                  <span>Data: {formatDateBR(progressRecord.completed_at)}</span>
                </div>
              )}

            </div>

            {/* Rodapé de Botões Docked */}
            <div className="p-4 px-6 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-end gap-2 shrink-0 z-10">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50 cursor-pointer"
              >
                Fechar
              </button>

              {isPathfinderUser ? (
                isAlreadyApproved ? (
                  <span className="px-4 py-2 rounded-xl bg-emerald-100 text-emerald-800 text-xs font-extrabold">
                    ✓ Requisito já Assinado pela Liderança
                  </span>
                ) : (
                  <>
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => submitWithStatus('EM_ANDAMENTO')}
                      className="px-4 py-2 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 text-xs font-bold cursor-pointer"
                    >
                      Salvar em Andamento
                    </button>
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => submitWithStatus('CONCLUIDO')}
                      className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <Send className="w-3.5 h-3.5" />
                      {saving
                        ? 'Enviando...'
                        : 'Marcar como Feito e Enviar p/ Diretoria'}
                    </button>
                  </>
                )
              ) : (
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition cursor-pointer disabled:opacity-50"
                >
                  {saving ? 'Salvando...' : 'Salvar no Cartão e Auditar'}
                </button>
              )}
            </div>
          </form>
        ) : (
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            <div className="p-6 overflow-y-auto space-y-5 flex-1 min-h-0">
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
            </div>

            <div className="p-4 px-6 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0 z-10">
              <div className="text-xs text-slate-500">
                Tags: {(requirement.tags || []).map((t) => `#${t}`).join('  ')}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Fechar
                </button>
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
            </div>
          </div>
        )}
      </div>

      {/* Lightbox para Visualizar Foto Anexada em Tamanho Real */}
      {previewAttachment && (
        <div
          onClick={() => setPreviewAttachment(null)}
          className="fixed inset-0 z-60 bg-black/85 flex flex-col items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-w-4xl w-full bg-slate-900 rounded-2xl overflow-hidden border border-slate-700 shadow-2xl"
          >
            <div className="px-4 py-3 bg-slate-950 text-white flex items-center justify-between">
              <div className="text-xs font-bold truncate">
                {previewAttachment.name} — Enviado por {previewAttachment.uploaded_by}
              </div>
              <button
                type="button"
                onClick={() => setPreviewAttachment(null)}
                className="p-1 rounded-lg bg-white/10 hover:bg-white/20 text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 flex items-center justify-center max-h-[80vh] overflow-auto">
              <img
                src={previewAttachment.data_url}
                alt={previewAttachment.name}
                className="max-w-full max-h-[72vh] object-contain rounded-lg"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
