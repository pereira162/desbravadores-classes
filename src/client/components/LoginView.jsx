import React, { useState, useEffect, useRef } from 'react';
import {
  Shield,
  Lock,
  Mail,
  LogIn,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  KeyRound,
  UserPlus,
  ArrowLeft,
  Send,
  ExternalLink,
  HelpCircle,
} from 'lucide-react';
import { apiRequest, getAssetUrl } from '../api';
import { ROLE_CONFIG } from '../constants';

export default function LoginView({ onLoginSuccess }) {
  // MODES: LOGIN | SETUP_DIRECTOR | VERIFY_EMAIL | FORGOT_PASSWORD | RESET_PASSWORD | ACCEPT_INVITE
  const [mode, setMode] = useState('LOGIN');

  // Login state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');

  // Public config & demo accounts
  const [demoAccounts, setDemoAccounts] = useState([]);
  const [demoEnabled, setDemoEnabled] = useState(true);
  const [setupCompleted, setSetupCompleted] = useState(false);
  const [clubName, setClubName] = useState('Clube de Desbravadores');
  const [googleClientId, setGoogleClientId] = useState('');

  // Setup Director state
  const [dirName, setDirName] = useState('');
  const [dirEmail, setDirEmail] = useState('');
  const [dirPassword, setDirPassword] = useState('');
  const [dirClubName, setDirClubName] = useState('Clube Pioneiros da Colina');
  const [dirClubRegion, setDirClubRegion] = useState('Associação / DSA');
  const [smtpUser, setSmtpUser] = useState('');
  const [smtpPass, setSmtpPass] = useState('');
  const [disableDemo, setDisableDemo] = useState(false);
  const [showGmailHelp, setShowGmailHelp] = useState(false);

  // Email verification & Reset Password state
  const [verificationCode, setVerificationCode] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');

  // Invite Acceptance state
  const [inviteToken, setInviteToken] = useState('');
  const [inviteInfo, setInviteInfo] = useState(null);
  const [inviteName, setInviteName] = useState('');
  const [invitePassword, setInvitePassword] = useState('');

  const googleBtnRef = useRef(null);

  // Load public config and check URL query params (?invite=, ?reset_email=, ?verify_email=)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const invToken = params.get('invite');
    const resetEmailParam = params.get('reset_email');
    const resetCodeParam = params.get('code');
    const verifyEmailParam = params.get('verify_email');

    apiRequest('/api/auth/demo-accounts')
      .then((res) => {
        setDemoAccounts(res.accounts || []);
        setDemoEnabled(res.demo_mode_enabled !== false);
        setSetupCompleted(Boolean(res.setup_completed));
        if (res.club_name) {
          setClubName(res.club_name);
          setDirClubName(res.club_name);
        }
        if (res.google_client_id) {
          setGoogleClientId(res.google_client_id);
        }
        // Only pre-fill demo credentials if no real director was set up yet
        if (!res.setup_completed && !invToken && !resetEmailParam && !verifyEmailParam) {
          setEmail('diretor@clube.org');
          setPassword('123456');
        }
      })
      .catch(() => {});

    if (invToken) {
      setInviteToken(invToken);
      setMode('ACCEPT_INVITE');
      apiRequest(`/api/auth/invite-info?token=${encodeURIComponent(invToken)}`)
        .then((res) => {
          setInviteInfo(res.invite);
          setInviteName(res.invite?.name || '');
        })
        .catch((err) => {
          setError(err.message || 'Convite inválido ou já utilizado.');
        });
    } else if (resetEmailParam) {
      setEmail(resetEmailParam);
      if (resetCodeParam) setResetCode(resetCodeParam);
      setMode('RESET_PASSWORD');
    } else if (verifyEmailParam) {
      setDirEmail(verifyEmailParam);
      if (resetCodeParam) setVerificationCode(resetCodeParam);
      setMode('VERIFY_EMAIL');
    }
  }, []);

  // Load Google Identity Services button if googleClientId is configured
  useEffect(() => {
    if (!googleClientId || (mode !== 'LOGIN' && mode !== 'ACCEPT_INVITE')) return;

    const initGoogleButton = () => {
      if (!window.google?.accounts?.id || !googleBtnRef.current) return;
      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: async (response) => {
          if (!response.credential) return;
          setLoading(true);
          setError('');
          try {
            const res = await apiRequest('/api/auth/google', {
              method: 'POST',
              body: JSON.stringify({
                credential: response.credential,
                invite_token: mode === 'ACCEPT_INVITE' ? inviteToken : undefined,
              }),
            });
            window.history.replaceState({}, '', window.location.pathname);
            onLoginSuccess(res.token, res.user);
          } catch (err) {
            setError(err.message || 'Falha ao autenticar com o Google.');
          } finally {
            setLoading(false);
          }
        },
      });
      window.google.accounts.id.renderButton(googleBtnRef.current, {
        theme: 'outline',
        size: 'large',
        width: 320,
        text: 'continue_with',
        locale: 'pt-BR',
      });
    };

    if (window.google?.accounts?.id) {
      initGoogleButton();
    } else {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = initGoogleButton;
      document.body.appendChild(script);
    }
  }, [googleClientId, mode, inviteToken, onLoginSuccess]);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setInfoMessage('');
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
    setInfoMessage('');
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

  const handleSetupDirectorSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setInfoMessage('');
    setLoading(true);
    try {
      const res = await apiRequest('/api/auth/setup-director', {
        method: 'POST',
        body: JSON.stringify({
          name: dirName,
          email: dirEmail,
          password: dirPassword,
          club_name: dirClubName,
          club_region: dirClubRegion,
          smtp_user: smtpUser,
          smtp_pass: smtpPass,
          disable_demo_accounts: disableDemo,
        }),
      });
      if (res.email_sent) {
        setInfoMessage(res.email_notice);
        setMode('VERIFY_EMAIL');
      } else {
        onLoginSuccess(res.token, res.user);
      }
    } catch (err) {
      setError(err.message || 'Erro ao configurar conta do Diretor.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyEmailSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await apiRequest('/api/auth/verify-email', {
        method: 'POST',
        body: JSON.stringify({
          email: dirEmail || email,
          code: verificationCode,
        }),
      });
      window.history.replaceState({}, '', window.location.pathname);
      onLoginSuccess(res.token, res.user);
    } catch (err) {
      setError(err.message || 'Código inválido.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPasswordSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setInfoMessage('');
    setLoading(true);
    try {
      const res = await apiRequest('/api/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
      setInfoMessage(res.message);
      setMode('RESET_PASSWORD');
    } catch (err) {
      setError(err.message || 'Não foi possível enviar o código de recuperação.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await apiRequest('/api/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({
          email,
          code: resetCode,
          new_password: newPassword,
        }),
      });
      window.history.replaceState({}, '', window.location.pathname);
      onLoginSuccess(res.token, res.user);
    } catch (err) {
      setError(err.message || 'Erro ao redefinir senha.');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptInviteSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await apiRequest('/api/auth/accept-invite', {
        method: 'POST',
        body: JSON.stringify({
          token: inviteToken,
          name: inviteName,
          password: invitePassword,
        }),
      });
      window.history.replaceState({}, '', window.location.pathname);
      onLoginSuccess(res.token, res.user);
    } catch (err) {
      setError(err.message || 'Erro ao ativar convite.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-amber-950 flex flex-col justify-center items-center p-4 sm:p-6">
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
        {/* Painel Esquerdo: Login / Primeiro Acesso / Convite / Recuperação */}
        <div
          className={`${
            demoEnabled && demoAccounts.length > 0 ? 'lg:col-span-6' : 'lg:col-span-12 max-w-xl mx-auto w-full'
          } p-6 sm:p-8 flex flex-col justify-between bg-white`}
        >
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center shrink-0">
                <img
                  src={getAssetUrl('/data/cartoes-oficiais/logos/logo_guia.png')}
                  alt="Emblema Classes"
                  className="w-9 h-9 object-contain"
                />
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-amber-600 block">
                  {clubName} — DSA
                </span>
                <h1 className="text-xl font-extrabold text-slate-900 leading-tight">
                  Gestão de Classes & Demanda
                </h1>
              </div>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {infoMessage && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
                <span>{infoMessage}</span>
              </div>
            )}

            {/* ==================== MODO 1: LOGIN PADRÃO ==================== */}
            {mode === 'LOGIN' && (
              <>
                <p className="text-sm text-slate-600 mb-5">
                  Acesse com seu e-mail e senha de liderança (ou conta Google) para organizar as atividades do ano e assinar cartões.
                </p>

                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      E-mail do Líder
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition"
                        placeholder="seu.email@gmail.com"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                        Senha de Acesso
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setError('');
                          setInfoMessage('');
                          setMode('FORGOT_PASSWORD');
                        }}
                        className="text-xs font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                      >
                        Esqueci minha senha
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                      <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition"
                        placeholder="••••••"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm shadow-lg shadow-amber-600/25 flex items-center justify-center gap-2 transition disabled:opacity-50 cursor-pointer"
                  >
                    <LogIn className="w-4 h-4" />
                    {loading ? 'Autenticando...' : 'Entrar no Sistema do Clube'}
                  </button>
                </form>

                {/* Botão Entrar com Google */}
                <div className="mt-4">
                  {googleClientId ? (
                    <div className="flex justify-center" ref={googleBtnRef} />
                  ) : (
                    <button
                      type="button"
                      onClick={() =>
                        setInfoMessage(
                          'Para ativar o login em 1 clique com o Google, configure o Google Client ID na aba "Líderes & Clube" ou use seu e-mail Gmail e senha acima.'
                        )
                      }
                      className="w-full py-2.5 px-4 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24">
                        <path
                          fill="#4285F4"
                          d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96z"
                        />
                      </svg>
                      Entrar com Conta Google
                    </button>
                  )}
                </div>

                {/* Callout para Primeiro Acesso do Diretor */}
                <div className="mt-5 p-3.5 rounded-xl bg-indigo-50/90 border border-indigo-200 flex items-center justify-between gap-3">
                  <div>
                    <div className="text-xs font-extrabold text-indigo-950 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                      Primeiro Acesso Oficial do Diretor?
                    </div>
                    <p className="text-[11px] text-indigo-800 mt-0.5">
                      Cadastre seu e-mail real de Diretor, configure o envio de convites via Gmail e assuma o clube.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setError('');
                      setInfoMessage('');
                      setMode('SETUP_DIRECTOR');
                    }}
                    className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shrink-0 cursor-pointer shadow-xs"
                  >
                    Configurar Diretor
                  </button>
                </div>
              </>
            )}

            {/* ==================== MODO 2: PRIMEIRO ACESSO DO DIRETOR ==================== */}
            {mode === 'SETUP_DIRECTOR' && (
              <form onSubmit={handleSetupDirectorSubmit} className="space-y-3.5">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-extrabold text-slate-900">
                    Configurar Conta Oficial do Diretor
                  </h2>
                  <button
                    type="button"
                    onClick={() => setMode('LOGIN')}
                    className="text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" /> Voltar
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Seu Nome Completo (Diretor/Diretora) *
                    </label>
                    <input
                      type="text"
                      required
                      value={dirName}
                      onChange={(e) => setDirName(e.target.value)}
                      placeholder="Ex: Lucas Pereira de Campos"
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Seu E-mail Real de Login *
                    </label>
                    <input
                      type="email"
                      required
                      value={dirEmail}
                      onChange={(e) => {
                        setDirEmail(e.target.value);
                        if (!smtpUser && e.target.value.includes('@gmail.com')) {
                          setSmtpUser(e.target.value);
                        }
                      }}
                      placeholder="seu.email@gmail.com"
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Escolha sua Senha Pessoal *
                    </label>
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={dirPassword}
                      onChange={(e) => setDirPassword(e.target.value)}
                      placeholder="Mínimo 6 caracteres"
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Nome Oficial do Seu Clube *
                    </label>
                    <input
                      type="text"
                      required
                      value={dirClubName}
                      onChange={(e) => setDirClubName(e.target.value)}
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Região / Associação / Campo
                    </label>
                    <input
                      type="text"
                      value={dirClubRegion}
                      onChange={(e) => setDirClubRegion(e.target.value)}
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300"
                    />
                  </div>
                </div>

                {/* Configuração opcional imediata do Gmail SMTP */}
                <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-amber-950 flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-amber-700" />
                      Envio de E-mails Reais via Gmail (Opcional agora)
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowGmailHelp((v) => !v)}
                      className="text-[11px] font-bold text-indigo-700 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <HelpCircle className="w-3.5 h-3.5" />
                      Como pegar a Senha de App?
                    </button>
                  </div>

                  {showGmailHelp && (
                    <div className="p-2.5 rounded-lg bg-white border border-amber-200 text-[11px] text-slate-700 space-y-1 leading-relaxed">
                      <p>
                        <strong>1.</strong> Você <strong>não</strong> usa sua senha normal do Gmail.
                      </p>
                      <p>
                        <strong>2.</strong> Acesse{' '}
                        <a
                          href="https://myaccount.google.com/apppasswords"
                          target="_blank"
                          rel="noreferrer"
                          className="text-indigo-600 font-bold underline"
                        >
                          myaccount.google.com/apppasswords
                        </a>{' '}
                        na conta Gmail que enviará os convites do clube.
                      </p>
                      <p>
                        <strong>3.</strong> Crie uma senha chamada <em>&ldquo;Clube Desbravadores&rdquo;</em> e cole o código de <strong>16 letras</strong> gerado abaixo!
                      </p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                        Conta Gmail Remetente
                      </label>
                      <input
                        type="email"
                        value={smtpUser}
                        onChange={(e) => setSmtpUser(e.target.value)}
                        placeholder="clube@gmail.com"
                        className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                        Senha de App do Google (16 letras)
                      </label>
                      <input
                        type="password"
                        value={smtpPass}
                        onChange={(e) => setSmtpPass(e.target.value)}
                        placeholder="abcd efgh ijkl mnop"
                        className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white font-mono"
                      />
                    </div>
                  </div>
                </div>

                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={disableDemo}
                    onChange={(e) => setDisableDemo(e.target.checked)}
                    className="rounded text-indigo-600"
                  />
                  Ocultar/desativar as contas fictícias de demonstração na tela de login
                </label>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  <UserPlus className="w-4 h-4" />
                  {loading
                    ? 'Criando Conta Oficial...'
                    : 'Criar Conta Oficial de Diretor & Entrar'}
                </button>
              </form>
            )}

            {/* ==================== MODO 3: VERIFICAR CÓDIGO DE E-MAIL ==================== */}
            {mode === 'VERIFY_EMAIL' && (
              <form onSubmit={handleVerifyEmailSubmit} className="space-y-4">
                <h2 className="text-base font-extrabold text-slate-900">
                  Confirme seu E-mail ({dirEmail || email})
                </h2>
                <p className="text-xs text-slate-600">
                  Digite o código de 6 dígitos que acabamos de enviar para a sua caixa de entrada:
                </p>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  placeholder="000000"
                  className="w-full px-4 py-3 text-center text-2xl font-extrabold tracking-widest font-mono rounded-xl border border-slate-300"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm cursor-pointer"
                >
                  {loading ? 'Validando...' : 'Confirmar E-mail e Acessar Painel'}
                </button>
              </form>
            )}

            {/* ==================== MODO 4: ACEITAR CONVITE DE LÍDER ==================== */}
            {mode === 'ACCEPT_INVITE' && (
              <form onSubmit={handleAcceptInviteSubmit} className="space-y-4">
                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200">
                  <div className="text-xs font-extrabold uppercase text-emerald-800">
                    Convite Oficial de Liderança
                  </div>
                  {inviteInfo ? (
                    <div className="text-xs text-emerald-950 mt-1 space-y-0.5">
                      <div>
                        <strong>Clube:</strong> {inviteInfo.club_name}
                      </div>
                      <div>
                        <strong>E-mail:</strong> {inviteInfo.email}
                      </div>
                      <div>
                        <strong>Cargo:</strong>{' '}
                        {ROLE_CONFIG[inviteInfo.role]?.label || inviteInfo.role}
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs text-slate-600 mt-1">
                      Carregando dados do seu convite...
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Confirme seu Nome Completo *
                  </label>
                  <input
                    type="text"
                    required
                    value={inviteName}
                    onChange={(e) => setInviteName(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Crie sua Senha Pessoal de Acesso *
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={invitePassword}
                    onChange={(e) => setInvitePassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || !inviteInfo}
                  className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm cursor-pointer"
                >
                  {loading ? 'Ativando sua conta...' : 'Ativar Minha Conta e Entrar'}
                </button>

                {googleClientId && (
                  <div className="pt-2 flex justify-center" ref={googleBtnRef} />
                )}
              </form>
            )}

            {/* ==================== MODO 5: ESQUECI MINHA SENHA ==================== */}
            {mode === 'FORGOT_PASSWORD' && (
              <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-extrabold text-slate-900">
                    Recuperar Senha por E-mail
                  </h2>
                  <button
                    type="button"
                    onClick={() => setMode('LOGIN')}
                    className="text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" /> Voltar
                  </button>
                </div>
                <p className="text-xs text-slate-600">
                  Informe o seu e-mail cadastrado no clube. Enviaremos um código de 6 dígitos para você criar uma nova senha:
                </p>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu.email@gmail.com"
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  {loading ? 'Enviando e-mail...' : 'Enviar Código para Meu E-mail'}
                </button>
                <button
                  type="button"
                  onClick={() => setMode('RESET_PASSWORD')}
                  className="w-full text-center text-xs font-bold text-indigo-600 hover:underline cursor-pointer"
                >
                  Já tenho um código de 6 dígitos
                </button>
              </form>
            )}

            {/* ==================== MODO 6: REDEFINIR SENHA COM CÓDIGO ==================== */}
            {mode === 'RESET_PASSWORD' && (
              <form onSubmit={handleResetPasswordSubmit} className="space-y-3.5">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-extrabold text-slate-900">
                    Definir Nova Senha
                  </h2>
                  <button
                    type="button"
                    onClick={() => setMode('LOGIN')}
                    className="text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" /> Voltar
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    E-mail da Conta
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Código de 6 Dígitos (recebido no e-mail)
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={resetCode}
                    onChange={(e) => setResetCode(e.target.value)}
                    placeholder="000000"
                    className="w-full px-3.5 py-2 text-center text-lg font-extrabold tracking-widest font-mono rounded-xl border border-slate-300"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nova Senha (mínimo 6 caracteres)
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••"
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm cursor-pointer"
                >
                  {loading ? 'Salvando...' : 'Salvar Nova Senha e Entrar'}
                </button>
              </form>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Catálogo Oficial DSA (212 Requisitos)</span>
            <span className="flex items-center gap-1 text-emerald-700 font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5" /> Auditoria & E-mail Real
            </span>
          </div>
        </div>

        {/* Painel Direito: Contas de Demonstração (Exibido enquanto o Modo Demo estiver ativo) */}
        {demoEnabled && demoAccounts.length > 0 && (
          <div className="lg:col-span-6 bg-slate-50 p-6 sm:p-8 border-t lg:border-t-0 lg:border-l border-slate-200 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-amber-600" />
                  Perfis de Demonstração (Troca Rápida)
                </h2>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-100 text-amber-800">
                  Senha: 123456
                </span>
              </div>
              <p className="text-xs text-slate-600 mb-4">
                Clique em qualquer líder abaixo para testar imediatamente as permissões. Você pode desativar este painel ao configurar sua conta real de Diretor:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[380px] overflow-y-auto pr-1">
                {demoAccounts.map((acct) => {
                  const roleMeta = ROLE_CONFIG[acct.role] || ROLE_CONFIG.CONSELHEIRO;
                  return (
                    <button
                      key={acct.id}
                      type="button"
                      onClick={() => handleQuickLogin(acct.email)}
                      className="text-left p-3 rounded-xl bg-white hover:bg-amber-50/70 border border-slate-200 hover:border-amber-400 transition shadow-2xs group cursor-pointer"
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="font-bold text-xs text-slate-900 group-hover:text-amber-900 truncate">
                          {acct.name}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${roleMeta.badgeClass}`}
                        >
                          {acct.role}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono truncate">
                        {acct.email}
                      </div>
                      <div className="mt-1.5 text-[11px] text-slate-600 truncate">
                        {acct.role === 'DIRETOR' || acct.role === 'SECRETARIO' ? (
                          <span className="text-slate-700 font-medium">
                            Escopo: Todas as Classes e Unidades
                          </span>
                        ) : acct.role === 'INSTRUTOR' ? (
                          <span>
                            Classes: <strong>{acct.assigned_classes.join(', ')}</strong>
                          </span>
                        ) : (
                          <span>
                            Unidade: <strong>{acct.unit_name || 'Geral'}</strong>
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-5 p-3.5 rounded-xl bg-slate-900 text-slate-200 text-xs flex items-start gap-3">
              <Shield className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-white block mb-0.5">
                  Como funciona o Convite de Líderes Reais?
                </strong>
                O Diretor cadastra os e-mails reais da Diretoria, Instrutores e Conselheiros na aba <strong>Líderes & Clube</strong>. O sistema envia o convite por e-mail para cada um criar sua própria senha ou entrar com o Google!
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
