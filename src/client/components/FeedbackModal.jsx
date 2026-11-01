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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black">
              <MessageSquareWarning className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold">Feedback & Relato de Erros • Versão Beta</h2>
              <p className="text-xs text-slate-400">
                Envie sugestões ou relate problemas diretamente para a equipe técnica
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {sentSuccess ? (
          <div className="p-6 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
              Feedback Beta Enviado com Sucesso!
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              Seu relato e o diagnóstico técnico foram registrados e encaminhados diretamente para a equipe técnica e diretoria do clube. Muito obrigado por ajudar a aperfeiçoar o SGC Classes!
            </p>
            <div className="pt-2 flex justify-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setSentSuccess(false);
                  onClose();
                }}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-amber-500 text-slate-950 hover:bg-amber-600 cursor-pointer"
              >
                Concluir
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 text-xs font-medium">
                {errorMsg}
              </div>
            )}

            {/* Category selector */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Tipo de Relato
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'FEEDBACK', label: 'Avaliação Geral', icon: MessageCircle },
                  { id: 'SUGESTAO', label: 'Sugestão', icon: Lightbulb },
                  { id: 'BUG_ERRO', label: 'Relatar Erro/Bug', icon: Bug },
                ].map((opt) => {
                  const Icon = opt.icon;
                  const active = category === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setCategory(opt.id)}
                      className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        active
                          ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-sm'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
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
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Seu Nome
                </label>
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="Seu nome"
                  className="w-full px-3 py-2 rounded-xl text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Seu E-mail (Opcional)
                </label>
                <input
                  type="email"
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="w-full px-3 py-2 rounded-xl text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Mensagem / Descrição detalhada *
              </label>
              <textarea
                rows={4}
                required
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Conte o que achou da versão Beta, sugira melhorias ou descreva o erro encontrado..."
                className="w-full px-3 py-2 rounded-xl text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
              />
            </div>

            <label className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-xs cursor-pointer">
              <input
                type="checkbox"
                checked={includeLogs}
                onChange={(e) => setIncludeLogs(e.target.checked)}
                className="mt-0.5 rounded text-amber-500"
              />
              <div>
                <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-amber-500" />
                  Anexar diagnóstico automático do navegador ({capturedLogs.length} eventos registrados)
                </span>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Inclui registros de console e eventuais falhas técnicas para ajudar a corrigir bugs rapidamente.
                </p>
              </div>
            </label>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={sending || !message.trim()}
                className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 shadow-sm cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                {sending ? 'Enviando...' : 'Enviar Feedback Beta'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
