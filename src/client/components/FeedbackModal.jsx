import React, { useState, useEffect } from 'react';
import {
  MessageSquareWarning,
  X,
  Send,
  Bug,
  Lightbulb,
  MessageCircle,
  CheckCircle2,
  Terminal,
} from 'lucide-react';
import { apiRequest } from '../api';
import { getCapturedBrowserLogs, getLastErrorStack } from '../logger';
import { useModalDismiss } from '../utils/modalStack';

export default function FeedbackModal({ isOpen, onClose, user }) {
  const [category, setCategory] = useState('FEEDBACK');
  const [userName, setUserName] = useState(user?.name || '');
  const [userEmail, setUserEmail] = useState(user?.email || '');
  const [message, setMessage] = useState('');
  const [includeLogs, setIncludeLogs] = useState(true);
  const [sending, setSending] = useState(false);
  const [sentSuccess, setSentSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (user) {
      setUserName(user.name || '');
      setUserEmail(user.email || '');
    }
  }, [user]);

  // Registro na pilha hierárquica global (ESC e Voltar Mobile)
  useModalDismiss(isOpen, onClose, 'ModalFeedback');


  if (!isOpen) return null;

  const capturedLogs = getCapturedBrowserLogs();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    setSending(true);
    setErrorMsg('');

    try {
      await apiRequest('/api/feedback', {
        method: 'POST',
        body: JSON.stringify({
          category,
          user_name: userName.trim() || user?.name || 'Visitante Beta',
          user_email: userEmail.trim() || user?.email || '',
          user_role: user?.custom_role_title || user?.role || 'VISITANTE',
          page_url: window.location.href,
          user_agent: navigator.userAgent,
          message: message.trim(),
          error_stack: includeLogs ? getLastErrorStack() : '',
          console_logs: includeLogs ? capturedLogs : [],
        }),
      });
      setSentSuccess(true);
      setMessage('');
    } catch (err) {
      setErrorMsg(err.message || 'Erro ao enviar feedback.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget && !sending) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md p-4 animate-fade-in"
    >
      <div className="bg-white/95 dark:bg-[#1c1c1e]/95 backdrop-blur-2xl border border-black/[0.08] dark:border-white/[0.12] rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden">
        {/* Header Transparente Apple */}
        <div className="px-6 py-4.5 border-b border-black/[0.06] dark:border-white/[0.08] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-500/20">
              <MessageSquareWarning className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">Feedback & Relato • Versão Beta</h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Envie sugestões ou relate problemas para a equipe
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#2c2c2e] transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {sentSuccess ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/20">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
              Feedback Enviado com Sucesso!
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed max-w-sm mx-auto">
              Seu relato e o diagnóstico técnico foram registrados e encaminhados para a equipe técnica. Muito obrigado por ajudar a aperfeiçoar o SGC Classes!
            </p>
            <div className="pt-2 flex justify-center">
              <button
                type="button"
                onClick={() => {
                  setSentSuccess(false);
                  onClose();
                }}
                className="px-6 py-2 rounded-full text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-all cursor-pointer active:scale-95 shadow-xs"
              >
                Concluir
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {errorMsg && (
              <div className="p-3.5 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 text-xs font-medium">
                {errorMsg}
              </div>
            )}

            {/* Category selector Apple Segmented Control */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                Tipo de Relato
              </label>
              <div className="p-1 bg-slate-100 dark:bg-[#252528] rounded-full border border-black/[0.04] dark:border-white/[0.06] grid grid-cols-3 gap-1">
                {[
                  { id: 'FEEDBACK', label: 'Avaliação', icon: MessageCircle },
                  { id: 'SUGESTAO', label: 'Sugestão', icon: Lightbulb },
                  { id: 'BUG_ERRO', label: 'Erro / Bug', icon: Bug },
                ].map((opt) => {
                  const Icon = opt.icon;
                  const active = category === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setCategory(opt.id)}
                      className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                        active
                          ? 'bg-white dark:bg-[#3a3a3c] text-slate-900 dark:text-white shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                  Seu Nome
                </label>
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="Seu nome"
                  className="w-full px-3.5 py-2 rounded-xl text-xs border border-black/[0.08] dark:border-white/[0.12] bg-white dark:bg-[#252528] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                  Seu E-mail (Opcional)
                </label>
                <input
                  type="email"
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="w-full px-3.5 py-2 rounded-xl text-xs border border-black/[0.08] dark:border-white/[0.12] bg-white dark:bg-[#252528] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                Mensagem / Descrição detalhada *
              </label>
              <textarea
                rows={4}
                required
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Conte o que achou da versão Beta, sugira melhorias ou descreva o erro encontrado..."
                className="w-full px-3.5 py-2 rounded-xl text-xs border border-black/[0.08] dark:border-white/[0.12] bg-white dark:bg-[#252528] text-slate-900 dark:text-white leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              />
            </div>

            <label className="flex items-start gap-2.5 p-3 rounded-2xl bg-slate-50 dark:bg-[#252528] border border-black/[0.04] dark:border-white/[0.06] text-xs cursor-pointer">
              <input
                type="checkbox"
                checked={includeLogs}
                onChange={(e) => setIncludeLogs(e.target.checked)}
                className="mt-0.5 rounded text-blue-600 focus:ring-blue-500"
              />
              <div>
                <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-blue-500" />
                  Anexar diagnóstico automático do navegador ({capturedLogs.length} eventos registrados)
                </span>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Inclui registros de console e eventuais falhas técnicas para ajudar a corrigir bugs rapidamente.
                </p>
              </div>
            </label>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-black/[0.06] dark:border-white/[0.08]">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-full text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#2c2c2e] transition-all cursor-pointer active:scale-95"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={sending || !message.trim()}
                className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full text-xs font-semibold bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white shadow-xs cursor-pointer active:scale-95 transition-all"
              >
                <Send className="w-3.5 h-3.5" />
                {sending ? 'Enviando...' : 'Enviar Feedback'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
