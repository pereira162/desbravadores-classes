import React, { useState, useEffect } from 'react';
import { Shield, Lock, Mail, LogIn, UserCheck, CheckCircle2, AlertCircle } from 'lucide-react';
import { apiRequest, getAssetUrl } from '../api';
import { ROLE_CONFIG } from '../constants';

export default function LoginView({ onLoginSuccess }) {
  const [email, setEmail] = useState('diretor@clube.org');
  const [password, setPassword] = useState('123456');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [demoAccounts, setDemoAccounts] = useState([]);

  useEffect(() => {
    apiRequest('/api/auth/demo-accounts')
      .then((res) => setDemoAccounts(res.accounts || []))
      .catch(() => {});
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await apiRequest('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      onLoginSuccess(res.token, res.user);
    } catch (err) {
      setError(err.message || 'Falha ao autenticar.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (acctEmail) => {
    setEmail(acctEmail);
    setPassword('123456');
    setError('');
    setLoading(true);
    try {
      const res = await apiRequest('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: acctEmail, password: '123456' }),
      });
      onLoginSuccess(res.token, res.user);
    } catch (err) {
      setError(err.message || 'Use a senha personalizada deste líder.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-amber-950 flex flex-col justify-center items-center p-4 sm:p-6">
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
        {/* Painel Esquerdo: Formulário de Login */}
        <div className="lg:col-span-5 p-6 sm:p-8 flex flex-col justify-between bg-white">
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center">
                <img
                  src={getAssetUrl('/data/cartoes-oficiais/logos/logo_guia.png')}
                  alt="Emblema Classes"
                  className="w-9 h-9 object-contain"
                />
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-amber-600 block">
                  Clube de Desbravadores — DSA
                </span>
                <h1 className="text-xl font-extrabold text-slate-900 leading-tight">
                  Gestão de Classes & Demanda
                </h1>
              </div>
            </div>

            <p className="text-sm text-slate-600 mb-6">
              Acesse com sua conta de liderança para gerenciar cartões regulares e avançados,
              planejar atividades do ano e registrar aprovações auditadas.
            </p>

            {error && (
              <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-start gap-2">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  E-mail do Líder
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="lider@clube.org"
                    className="w-full pl-9 pr-3 py-2.5 text-sm rounded-lg border border-slate-300 focus:border-amber-600 focus:ring-2 focus:ring-amber-500/20 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Senha de Acesso
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••"
                    className="w-full pl-9 pr-3 py-2.5 text-sm rounded-lg border border-slate-300 focus:border-amber-600 focus:ring-2 focus:ring-amber-500/20 outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-lg bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white font-bold text-sm shadow-md hover:shadow-lg transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <LogIn className="w-4 h-4" />
                {loading ? 'Autenticando...' : 'Entrar no Sistema do Clube'}
              </button>
            </form>
          </div>

          <div className="mt-8 pt-4 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
            <span>Catálogo Oficial DSA (212 Requisitos)</span>
            <span className="font-semibold text-emerald-700 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Auditoria Ativa
            </span>
          </div>
        </div>

        {/* Painel Direito: Acesso Rápido de Perfis de Liderança (RBAC) */}
        <div className="lg:col-span-7 bg-slate-50 p-6 sm:p-8 border-t lg:border-t-0 lg:border-l border-slate-200 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-amber-600" />
                Perfis de Liderança Cadastrados (Troca Rápida)
              </h2>
              <span className="text-xs bg-amber-100 text-amber-800 font-semibold px-2 py-0.5 rounded">
                Senha padrão: 123456
              </span>
            </div>
            <p className="text-xs text-slate-600 mb-4">
              Clique em qualquer líder abaixo para entrar imediatamente com aquele perfil e testar as
              regras de permissão (Diretor, Secretária, Instrutores por Classe e Conselheiros por
              Unidade):
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-96 overflow-y-auto pr-1">
              {demoAccounts.map((acc) => {
                const roleCfg = ROLE_CONFIG[acc.role] || ROLE_CONFIG.INSTRUTOR;
                const isSelected = email.toLowerCase() === acc.email.toLowerCase();
                return (
                  <button
                    key={acc.id}
                    type="button"
                    onClick={() => handleQuickLogin(acc.email)}
                    className={`text-left p-3 rounded-xl border transition cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'bg-amber-50/90 border-amber-500 ring-2 ring-amber-500/20'
                        : 'bg-white hover:bg-slate-100/80 border-slate-200'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span
                          className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${roleCfg.badgeClass}`}
                        >
                          {acc.role}
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono truncate">
                          {acc.email}
                        </span>
                      </div>
                      <div className="font-bold text-slate-900 text-sm">{acc.name}</div>
                    </div>

                    <div className="mt-2 pt-1.5 border-t border-slate-100 text-[11px] text-slate-600">
                      {acc.role === 'INSTRUTOR' && (
                        <span>
                          <strong>Classes:</strong>{' '}
                          {acc.assigned_classes?.includes('*')
                            ? 'Todas'
                            : acc.assigned_classes?.join(', ')}
                        </span>
                      )}
                      {acc.role === 'CONSELHEIRO' && (
                        <span>
                          <strong>Unidade:</strong> {acc.unit_name || 'Geral'}
                        </span>
                      )}
                      {['ADMIN', 'DIRETOR', 'SECRETARIO'].includes(acc.role) && (
                        <span>
                          <strong>Escopo:</strong> Acesso global a todas as classes e unidades
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-6 p-3.5 rounded-xl bg-slate-900 text-slate-200 text-xs leading-relaxed">
            <div className="font-bold text-amber-400 mb-1 flex items-center gap-1.5">
              <Shield className="w-4 h-4" /> Governança e Controle de Produção no Dia a Dia
            </div>
            Todas as alterações feitas por qualquer líder geram registro automático no{' '}
            <strong>Histórico de Auditoria (Audit Log)</strong> com identificação do usuário, data/hora,
            estado anterior e possibilidade de reversão pela diretoria.
          </div>
        </div>
      </div>
    </div>
  );
}
