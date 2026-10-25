import React, { useState, useEffect, useRef } from 'react';
import {
  Lock,
  Mail,
  LogIn,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  UserPlus,
  ArrowLeft,
  Send,
  HelpCircle,
  Award,
} from 'lucide-react';
import { apiRequest, getAssetUrl, isTestMode, getTestModeUrl } from '../api';
import { ROLE_CONFIG } from '../constants';

export default function LoginView({ onLoginSuccess }) {
  const testMode = isTestMode();
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
  const [demoEnabled, setDemoEnabled] = useState(false);
  const [setupCompleted, setSetupCompleted] = useState(true);
  const [clubName, setClubName] = useState('Clube de Desbravadores');
  const [googleClientId, setGoogleClientId] = useState('');

  // Setup Primeiro Acesso (Gestor/TI ou Diretor)
  const [dirName, setDirName] = useState('');
  const [dirEmail, setDirEmail] = useState('');
  const [dirPassword, setDirPassword] = useState('');
  const [dirClubName, setDirClubName] = useState('');
  const [dirClubRegion, setDirClubRegion] = useState('');
  const [isDirectorRole, setIsDirectorRole] = useState(false); // false = GESTOR (TI), true = DIRETOR
  const [smtpUser, setSmtpUser] = useState('');
  const [smtpPass, setSmtpPass] = useState('');
  const [disableDemo, setDisableDemo] = useState(true);
  const [showGmailHelp, setShowGmailHelp] = useState(false);

  // Email verification & Reset Password state
  const [verificationCode, setVerificationCode] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');

  // Invite Acceptance state (Líder ou Desbravador)
  const [inviteToken, setInviteToken] = useState('');
  const [inviteInfo, setInviteInfo] = useState(null);
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [invitePassword, setInvitePassword] = useState('');

  const googleBtnRef = useRef(null);
  const setupStateRef = useRef({
    dirClubName: '',
    dirClubRegion: '',
    isDirectorRole: false,
  });

  useEffect(() => {
    setupStateRef.current = {
      dirClubName,
      dirClubRegion,
      isDirectorRole,
    };
  }, [dirClubName, dirClubRegion, isDirectorRole]);

  // Load public config and check URL query params (?invite=, ?reset_email=, ?verify_email=)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const invToken = params.get('invite') || params.get('convite_dbv');
    const resetEmailParam = params.get('reset_email');
    const resetCodeParam = params.get('code');
    const verifyEmailParam = params.get('verify_email');

    apiRequest('/api/auth/demo-accounts')
      .then((res) => {
        setDemoAccounts(testMode ? res.accounts || [] : []);
        setDemoEnabled(testMode && res.demo_mode_enabled !== false);
        const isDone = Boolean(res.setup_completed);
        setSetupCompleted(isDone);
        if (res.club_name) {
          setClubName(res.club_name);
          if (res.club_name !== 'Clube de Desbravadores') {
            setDirClubName(res.club_name);
          }
        }
        if (res.google_client_id) {
          setGoogleClientId(res.google_client_id);
        }
        // No sistema real de produção, se ainda não houve Primeiro Acesso, abre direto a tela de Primeiro Acesso!
        if (!testMode && !isDone && !invToken && !resetEmailParam && !verifyEmailParam) {
          setMode('SETUP_DIRECTOR');
        }
        // Na página temporária de teste (?teste=1), preenche o login de teste
        if (testMode && !invToken && !resetEmailParam && !verifyEmailParam) {
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
          setInviteEmail(res.invite?.email || '');
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
  }, [testMode]);

  // Load Google Identity Services button on LOGIN, ACCEPT_INVITE, and SETUP_DIRECTOR
  useEffect(() => {
    if (
      !googleClientId ||
      (mode !== 'LOGIN' && mode !== 'ACCEPT_INVITE' && mode !== 'SETUP_DIRECTOR')
    ) {
      return;
    }

    const initGoogleButton = () => {
      if (!window.google?.accounts?.id || !googleBtnRef.current) return;
      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: async (response) => {
          if (!response.credential) return;

          if (mode === 'SETUP_DIRECTOR') {
            const currentClub = setupStateRef.current.dirClubName.trim();
            if (!currentClub) {
              setError(
                'Por favor, preencha o "Nome Oficial do Seu Clube" acima antes de concluir o Primeiro Acesso com o Google.'
              );
              return;
            }
          }

          setLoading(true);
          setError('');
          try {
            const res = await apiRequest('/api/auth/google', {
              method: 'POST',
              body: JSON.stringify({
                credential: response.credential,
                invite_token: mode === 'ACCEPT_INVITE' ? inviteToken : undefined,
                setup_mode: mode === 'SETUP_DIRECTOR',
                club_name:
                  mode === 'SETUP_DIRECTOR'
                    ? setupStateRef.current.dirClubName
                    : undefined,
                club_region:
                  mode === 'SETUP_DIRECTOR'
                    ? setupStateRef.current.dirClubRegion
                    : undefined,
                is_director:
                  mode === 'SETUP_DIRECTOR'
                    ? setupStateRef.current.isDirectorRole
                    : undefined,
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
      googleBtnRef.current.innerHTML = '';
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
      const existingScript = document.querySelector(
        'script[src="https://accounts.google.com/gsi/client"]'
      );
      if (existingScript) {
        existingScript.addEventListener('load', initGoogleButton);
      } else {
        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        script.onload = initGoogleButton;
        document.body.appendChild(script);
      }
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
          is_director: isDirectorRole,
          role: isDirectorRole ? 'DIRETOR' : 'GESTOR',
          smtp_user: smtpUser,
          smtp_pass: smtpPass,
          disable_demo_accounts: disableDemo,
        }),
      });
      setSetupCompleted(true);
      if (res.email_sent) {
        setInfoMessage(res.email_notice);
        setMode('VERIFY_EMAIL');
      } else {
        onLoginSuccess(res.token, res.user);
      }
    } catch (err) {
      setError(err.message || 'Erro ao configurar Primeiro Acesso.');
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
          email: inviteEmail,
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
            demoEnabled && demoAccounts.length > 0
              ? 'lg:col-span-6'
              : 'lg:col-span-12 max-w-xl mx-auto w-full'
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
                  Gestão de Classes & Cartão Virtual
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
                  Acesse com seu e-mail e senha (ou conta Google) como Líder ou Desbravador para acompanhar e assinar o Cartão de Classes.
                </p>

                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      Seu E-mail de Acesso
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
                {googleClientId && (
                  <div className="mt-4">
                    <div className="relative flex py-2 items-center">
                      <div className="grow border-t border-slate-200"></div>
                      <span className="shrink mx-3 text-[11px] font-bold uppercase text-slate-400">
                        ou acesse em 1 clique
                      </span>
                      <div className="grow border-t border-slate-200"></div>
                    </div>
                    <div className="flex justify-center mt-1" ref={googleBtnRef} />
                  </div>
                )}

                {/* Callout para Primeiro Acesso — Exibido SOMENTE se o clube AINDA NÃO tiver concluído o Primeiro Acesso */}
                {!setupCompleted && !testMode && (
                  <div className="mt-5 p-3.5 rounded-xl bg-indigo-50/90 border border-indigo-200 flex items-center justify-between gap-3">
                    <div>
                      <div className="text-xs font-extrabold text-indigo-950 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                        Primeiro Acesso Oficial do Clube
                      </div>
                      <p className="text-[11px] text-indigo-800 mt-0.5">
                        Configure o nome do seu clube e crie a primeira conta de Gestor(a)/TI ou Diretor(a).
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
                      Configurar Clube
                    </button>
                  </div>
                )}
              </>
            )}

            {/* ==================== MODO 2: PRIMEIRO ACESSO (GESTOR / TI OU DIRETOR) ==================== */}
            {mode === 'SETUP_DIRECTOR' && !setupCompleted && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-extrabold text-slate-900">
                      Primeiro Acesso — Configurar Clube & Gestor/Diretor
                    </h2>
                    <p className="text-xs text-slate-500">
                      Este cadastro inicial só pode ser realizado uma única vez para inaugurar o sistema do clube.
                    </p>
                  </div>
                </div>

                {/* Dados do Clube + Seleção Gestor vs Diretor */}
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Nome Oficial do Seu Clube *
                      </label>
                      <input
                        type="text"
                        required
                        value={dirClubName}
                        onChange={(e) => setDirClubName(e.target.value)}
                        placeholder="Digite o nome do seu clube"
                        className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 bg-white"
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
                        placeholder="Ex: 1ª Região — Associação"
                        className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 bg-white"
                      />
                    </div>
                  </div>

                  {/* Opção Gestor (TI) vs Diretor do Clube */}
                  <div className="pt-2 border-t border-slate-200">
                    <label className="flex items-start gap-2.5 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={isDirectorRole}
                        onChange={(e) => setIsDirectorRole(e.target.checked)}
                        className="mt-0.5 w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                      />
                      <div>
                        <span className="text-xs font-extrabold text-slate-900 block">
                          Eu sou o(a) Diretor(a) titular do Clube
                        </span>
                        <span className="text-[11px] text-slate-600 block mt-0.5">
                          {isDirectorRole
                            ? 'Sua conta será criada diretamente com o cargo de Diretor(a) do Clube.'
                            : 'Desmarcado: sua conta será criada como Gestor(a) / Responsável de TI do Clube (com os mesmos poderes do Diretor, permitindo organizar o sistema e enviar o convite oficial para o Diretor e demais líderes).'}
                        </span>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Opção A: Criar Conta do Primeiro Acesso com Google */}
                {googleClientId && (
                  <div className="p-3.5 rounded-xl bg-indigo-50/70 border border-indigo-200 text-center space-y-2">
                    <div className="text-xs font-extrabold text-indigo-950">
                      Opção 1: Criar conta de {isDirectorRole ? 'Diretor(a)' : 'Gestor(a) / TI'} com Google
                    </div>
                    <p className="text-[11px] text-indigo-800">
                      Preencha o nome do clube acima e clique no botão do Google abaixo:
                    </p>
                    <div className="flex justify-center pt-1" ref={googleBtnRef} />
                  </div>
                )}

                {/* Opção B: Criar Conta com E-mail e Senha */}
                <form onSubmit={handleSetupDirectorSubmit} className="space-y-3.5">
                  {googleClientId && (
                    <div className="relative flex py-1 items-center">
                      <div className="grow border-t border-slate-200"></div>
                      <span className="shrink mx-3 text-[11px] font-bold uppercase text-slate-400">
                        ou cadastre com e-mail e senha
                      </span>
                      <div className="grow border-t border-slate-200"></div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Seu Nome Completo ({isDirectorRole ? 'Diretor/Diretora' : 'Gestor/Responsável'}) *
                      </label>
                      <input
                        type="text"
                        required
                        value={dirName}
                        onChange={(e) => setDirName(e.target.value)}
                        placeholder="Digite seu nome completo"
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
                        onChange={(e) => setDirEmail(e.target.value)}
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
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md flex items-center justify-center gap-2 transition cursor-pointer"
                  >
                    <UserPlus className="w-4 h-4" />
                    {loading
                      ? 'Configurando Clube...'
                      : `Criar Conta Oficial de ${
                          isDirectorRole ? 'Diretor(a)' : 'Gestor(a) / TI'
                        } & Iniciar`}
                  </button>

                  <div className="text-center pt-1">
                    <button
                      type="button"
                      onClick={() => setMode('LOGIN')}
                      className="text-xs font-bold text-indigo-600 hover:underline cursor-pointer"
                    >
                      Já realizou o Primeiro Acesso? Ir para Login
                    </button>
                  </div>
                </form>
              </div>
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

            {/* ==================== MODO 4: ACEITAR CONVITE (LÍDER OU DESBRAVADOR) ==================== */}
            {mode === 'ACCEPT_INVITE' && (
              <div className="space-y-4">
                <div
                  className={`p-4 rounded-xl border ${
                    inviteInfo?.type === 'PATHFINDER'
                      ? 'bg-sky-50 border-sky-200'
                      : 'bg-emerald-50 border-emerald-200'
                  }`}
                >
                  <div className="text-xs font-extrabold uppercase flex items-center gap-1.5 text-slate-900">
                    <Award className="w-4 h-4 text-amber-600" />
                    {inviteInfo?.type === 'PATHFINDER'
                      ? 'Convite Individual de Desbravador(a)'
                      : 'Convite Oficial da Diretoria'}
                  </div>
                  {inviteInfo ? (
                    <div className="text-xs text-slate-800 mt-1.5 space-y-1">
                      <div>
                        <strong>Clube:</strong> {inviteInfo.club_name}
                      </div>
                      <div>
                        <strong>Convidado(a):</strong> {inviteInfo.name}
                      </div>
                      <div>
                        <strong>Perfil:</strong>{' '}
                        {ROLE_CONFIG[inviteInfo.role]?.label || inviteInfo.role}
                        {inviteInfo.unit_name ? ` • Unidade ${inviteInfo.unit_name}` : ''}
                      </div>
                      {inviteInfo.assigned_classes?.length > 0 && (
                        <div>
                          <strong>Classe(s):</strong>{' '}
                          {inviteInfo.assigned_classes.join(', ')}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-xs text-slate-600 mt-1">
                      Carregando dados do seu convite...
                    </div>
                  )}
                </div>

                {/* Opção 1: Aceitar Convite com Conta Google em 1 clique */}
                {googleClientId && inviteInfo && (
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-center space-y-2">
                    <div className="text-xs font-extrabold text-slate-800">
                      Opção 1: Criar sua conta em 1 clique com o Google
                    </div>
                    <div className="flex justify-center" ref={googleBtnRef} />
                  </div>
                )}

                {/* Opção 2: Criar conta escolhendo e-mail e senha */}
                <form onSubmit={handleAcceptInviteSubmit} className="space-y-3.5">
                  {googleClientId && (
                    <div className="relative flex py-1 items-center">
                      <div className="grow border-t border-slate-200"></div>
                      <span className="shrink mx-3 text-[11px] font-bold uppercase text-slate-400">
                        ou escolha seu e-mail e senha
                      </span>
                      <div className="grow border-t border-slate-200"></div>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Seu Nome Completo *
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
                      Seu E-mail para Login *
                    </label>
                    <input
                      type="email"
                      required
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="Digite seu e-mail preferido"
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
                    className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm cursor-pointer disabled:opacity-50"
                  >
                    {loading
                      ? 'Criando sua conta...'
                      : 'Criar Minha Conta e Acessar Cartão'}
                  </button>
                </form>
              </div>
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

          <div className="mt-6 pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-slate-500">
            <span>Catálogo Oficial DSA (12 Classes • 212 Requisitos)</span>
            {testMode ? (
              <a
                href={getTestModeUrl(false)}
                className="text-amber-700 hover:text-amber-900 font-extrabold underline"
              >
                ← Voltar ao Sistema Principal Oficial
              </a>
            ) : (
              <a
                href={getTestModeUrl(true)}
                className="text-slate-400 hover:text-indigo-600 font-semibold underline"
              >
                Abrir Página Temporária de Teste (Visualização)
              </a>
            )}
          </div>
        </div>

        {/* Painel Direito: Exibido SOMENTE na Página Temporária de Teste (?teste=1) */}
        {testMode && demoEnabled && demoAccounts.length > 0 && (
          <div className="lg:col-span-6 bg-amber-50/60 p-6 sm:p-8 border-t lg:border-t-0 lg:border-l border-amber-200 flex flex-col justify-between">
            <div>
              <div className="mb-3 p-3 rounded-xl bg-amber-500 text-slate-950 text-xs font-extrabold flex items-center justify-between gap-2">
                <span>PÁGINA TEMPORÁRIA DE TESTE (ISOLADA)</span>
                <a
                  href={getTestModeUrl(false)}
                  className="px-2.5 py-1 rounded-lg bg-slate-950 text-white text-[11px] font-bold"
                >
                  Ir para Site Oficial
                </a>
              </div>

              <div className="flex items-center justify-between mb-2">
                <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-amber-600" />
                  Contas de Teste (Ambiente Simulado)
                </h2>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-100 text-amber-800">
                  Senha: 123456
                </span>
              </div>
              <p className="text-xs text-slate-600 mb-4">
                Esta página usa um banco de dados separado apenas para você visualizar o sistema preenchido sem misturar com o seu clube real:
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
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
