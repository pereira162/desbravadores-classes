import React, { useState, useEffect } from 'react';
import {
  Shield,
  UserPlus,
  Settings,
  Edit3,
  CheckCircle2,
  X,
  Mail,
  Send,
  Copy,
  Check,
  KeyRound,
  HelpCircle,
  Sparkles,
  ExternalLink,
  Download,
  Database,
  FileSpreadsheet,
  RotateCcw,
  HardDrive,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react';
import { ROLE_CONFIG } from '../constants';
import DateInput from './DateInput';
import { API_BASE_URL, getStoredToken, isTestMode, apiRequest } from '../api';

export default function LeadersSettingsView({
  catalog,
  leaders,
  units,
  settings,
  currentUser,
  onSaveLeader,
  onDeleteLeader,
  onSendLeaderInvite,
  onSaveSettings,
  onTestSmtp,
}) {
  // Estado das Configurações do Clube + SMTP + Google
  const [clubName, setClubName] = useState(settings?.club_name || '');
  const [clubRegion, setClubRegion] = useState(settings?.club_region || '');
  const [clubYear, setClubYear] = useState(settings?.club_year || '2026');
  const [investitureDate, setInvestitureDate] = useState(
    settings?.investiture_date || '2026-11-28'
  );
  const [allowCounselorDirect, setAllowCounselorDirect] = useState(
    settings?.allow_counselor_direct_approval === 'true'
  );
  const [demoModeEnabled, setDemoModeEnabled] = useState(false);

  // Estado de E-mail (Gmail SMTP) e Google Sign-In
  const [smtpUser, setSmtpUser] = useState(settings?.smtp_user || '');
  const [smtpPass, setSmtpPass] = useState('');
  const [smtpFromName, setSmtpFromName] = useState(
    settings?.smtp_from_name || settings?.club_name || 'SGC Classes Desbravadores'
  );
  const [googleClientId, setGoogleClientId] = useState(
    settings?.google_client_id || ''
  );
  const [showSmtpHelp, setShowSmtpHelp] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [testingSmtp, setTestingSmtp] = useState(false);

  // Sincroniza quando settings carregar do servidor
  useEffect(() => {
    if (!settings) return;
    setClubName(settings.club_name || '');
    setClubRegion(settings.club_region || '');
    setClubYear(settings.club_year || '2026');
    setInvestitureDate(settings.investiture_date || '2026-11-28');
    setAllowCounselorDirect(settings.allow_counselor_direct_approval === 'true');
    setDemoModeEnabled(false);
    setSmtpUser(settings.smtp_user || '');
    setSmtpFromName(
      settings.smtp_from_name || settings.club_name || 'SGC Classes Desbravadores'
    );
    setGoogleClientId(settings.google_client_id || '');
  }, [settings]);

  // Estado do Modal de Criar / Editar Líder
  const [leaderModalOpen, setLeaderModalOpen] = useState(false);
  const [editingLeader, setEditingLeader] = useState(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [sendInvite, setSendInvite] = useState(true);
  const [role, setRole] = useState('INSTRUTOR');
  const [unitId, setUnitId] = useState('');
  const [assignedClasses, setAssignedClasses] = useState([]);
  const [active, setActive] = useState(true);
  const [savingLeader, setSavingLeader] = useState(false);
  const [sendingInviteId, setSendingInviteId] = useState(null);
  const [inviteLinksMap, setInviteLinksMap] = useState({});
  const [copiedLeaderId, setCopiedLeaderId] = useState(null);
  const [downloadingBackup, setDownloadingBackup] = useState(false);
  const [downloadingCsv, setDownloadingCsv] = useState(false);

  // Estado dos Backups Automáticos do Servidor (.sqlite)
  const [serverBackups, setServerBackups] = useState([]);
  const [loadingBackups, setLoadingBackups] = useState(false);
  const [creatingSnapshot, setCreatingSnapshot] = useState(false);
  const [restoringFilename, setRestoringFilename] = useState(null);
  const [cloningTest, setCloningTest] = useState(false);
  const [backupSuccessMsg, setBackupSuccessMsg] = useState(null);
  const [backupErrorMsg, setBackupErrorMsg] = useState(null);
  const [restoreModalFile, setRestoreModalFile] = useState(null);
  const [cloneModalOpen, setCloneModalOpen] = useState(false);

  const fetchServerBackups = async () => {
    if (!['ADMIN', 'GESTOR', 'DIRETOR'].includes(currentUser?.role)) return;
    setLoadingBackups(true);
    try {
      const res = await apiRequest('/api/backups');
      setServerBackups(res.backups || []);
    } catch (err) {
      console.warn('Erro ao carregar backups do servidor:', err.message);
    } finally {
      setLoadingBackups(false);
    }
  };

  useEffect(() => {
    fetchServerBackups();
  }, []);

  const handleCreateSnapshotNow = async () => {
    setCreatingSnapshot(true);
    setBackupSuccessMsg(null);
    setBackupErrorMsg(null);
    try {
      const res = await apiRequest('/api/backups/create', {
        method: 'POST',
        body: JSON.stringify({ label: 'manual', db_type: isTestMode() ? 'test' : 'prod' }),
      });
      setBackupSuccessMsg(`Ponto de restauração "${res.backup?.filename}" gerado com sucesso!`);
      await fetchServerBackups();
    } catch (err) {
      setBackupErrorMsg(err.message || 'Erro ao gerar ponto de restauração.');
    } finally {
      setCreatingSnapshot(false);
    }
  };

  const handleDownloadSqlite = async (filename) => {
    try {
      const token = getStoredToken();
      const testParam = isTestMode() ? '?teste=1' : '';
      const url = `${API_BASE_URL}/api/backups/${encodeURIComponent(filename)}/download${testParam}`;
      const response = await fetch(url, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...(isTestMode() ? { 'X-Test-Mode': 'true' } : {}),
        },
      });
      if (!response.ok) throw new Error('Falha no download do backup.');
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      alert(`Erro ao baixar backup: ${err.message}`);
    }
  };

  const handleConfirmRestore = async () => {
    if (!restoreModalFile) return;
    setRestoringFilename(restoreModalFile.filename);
    setBackupSuccessMsg(null);
    setBackupErrorMsg(null);
    try {
      const res = await apiRequest(`/api/backups/${encodeURIComponent(restoreModalFile.filename)}/restore`, {
        method: 'POST',
        body: JSON.stringify({ target_db_type: isTestMode() ? 'test' : 'prod' }),
      });
      setRestoreModalFile(null);
      setBackupSuccessMsg(res.message || 'Banco restaurado com sucesso! Recarregando sistema...');
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err) {
      setBackupErrorMsg(err.message || 'Erro ao restaurar backup.');
    } finally {
      setRestoringFilename(null);
    }
  };

  const handleConfirmCloneTest = async () => {
    setCloningTest(true);
    setBackupSuccessMsg(null);
    setBackupErrorMsg(null);
    try {
      const res = await apiRequest('/api/backups/clone-test-to-prod', {
        method: 'POST',
      });
      setCloneModalOpen(false);
      setBackupSuccessMsg(res.message || 'Ambiente de teste clonado com sucesso para a produção oficial!');
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err) {
      setBackupErrorMsg(err.message || 'Erro ao clonar dados.');
    } finally {
      setCloningTest(false);
    }
  };

  const handleDownloadBackup = async () => {
    try {
      setDownloadingBackup(true);
      const token = getStoredToken();
      const testMode = isTestMode();
      const url = `${API_BASE_URL}/api/export/backup`;
      const res = await fetch(url, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...(testMode ? { 'X-Test-Mode': 'true' } : {}),
        },
      });
      if (!res.ok) throw new Error('Falha ao gerar arquivo de backup.');
      const blob = await res.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `backup-clube-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      alert(err.message || 'Erro ao baixar arquivo de backup.');
    } finally {
      setDownloadingBackup(false);
    }
  };

  const handleDownloadCsv = async () => {
    try {
      setDownloadingCsv(true);
      const token = getStoredToken();
      const testMode = isTestMode();
      const url = `${API_BASE_URL}/api/export/investiture-csv`;
      const res = await fetch(url, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...(testMode ? { 'X-Test-Mode': 'true' } : {}),
        },
      });
      if (!res.ok) throw new Error('Falha ao gerar planilha CSV.');
      const blob = await res.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `relatorio-investidura-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      alert(err.message || 'Erro ao exportar planilha CSV.');
    } finally {
      setDownloadingCsv(false);
    }
  };

  const canManageLeaders = ['ADMIN', 'GESTOR', 'DIRETOR'].includes(
    currentUser?.role
  );

  const openCreateLeader = () => {
    setEditingLeader(null);
    setName('');
    setEmail('');
    setPassword('');
    setSendInvite(true);
    setRole('INSTRUTOR');
    setUnitId('');
    setAssignedClasses(['amigo', 'amigo-avancado']);
    setActive(true);
    setLeaderModalOpen(true);
  };

  const openEditLeader = (ld) => {
    setEditingLeader(ld);
    setName(ld.name);
    setEmail(ld.email);
    setPassword('');
    setSendInvite(false);
    setRole(ld.role);
    setUnitId(ld.unit_id || '');
    setAssignedClasses(ld.assigned_classes || []);
    setActive(Boolean(ld.active));
    setLeaderModalOpen(true);
  };

  const toggleClassScope = (slug) => {
    setAssignedClasses((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
    );
  };

  const handleLeaderSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;
    setSavingLeader(true);
    try {
      const res = await onSaveLeader(
        {
          name: name.trim(),
          email: email.trim(),
          password: password.trim() || undefined,
          role,
          unit_id: role === 'CONSELHEIRO' ? unitId || null : null,
          assigned_classes: role === 'INSTRUTOR' ? assignedClasses : [],
          active,
          send_invite: !editingLeader ? sendInvite : false,
        },
        editingLeader?.id
      );
      if (res?.invite_url && res?.id) {
        setInviteLinksMap((prev) => ({ ...prev, [res.id]: res.invite_url }));
      }
      setLeaderModalOpen(false);
    } finally {
      setSavingLeader(false);
    }
  };

  const handleSendInviteClick = async (ld) => {
    if (!onSendLeaderInvite) return;
    setSendingInviteId(ld.id);
    try {
      const res = await onSendLeaderInvite(ld.id);
      if (res?.invite_url) {
        setInviteLinksMap((prev) => ({ ...prev, [ld.id]: res.invite_url }));
      }
    } finally {
      setSendingInviteId(null);
    }
  };

  const handleCopyInviteLink = (leaderId, url) => {
    if (!url) return;
    navigator.clipboard?.writeText(url);
    setCopiedLeaderId(leaderId);
    setTimeout(() => {
      setCopiedLeaderId((prev) => (prev === leaderId ? null : prev));
    }, 3000);
  };

  const handleSettingsSubmit = async (e) => {
    e.preventDefault();
    if (!canManageLeaders) return;
    setSavingSettings(true);
    try {
      await onSaveSettings({
        club_name: clubName,
        club_region: clubRegion,
        club_year: clubYear,
        investiture_date: investitureDate,
        allow_counselor_direct_approval: allowCounselorDirect ? 'true' : 'false',
        demo_mode_enabled: demoModeEnabled,
        smtp_user: smtpUser.trim(),
        smtp_pass: smtpPass.trim() ? smtpPass.trim() : undefined,
        smtp_from_name: smtpFromName.trim(),
        google_client_id: googleClientId.trim(),
      });
      setSmtpPass('');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleTestSmtpClick = async () => {
    if (!onTestSmtp) return;
    setTestingSmtp(true);
    try {
      // Salva configurações atuais antes de testar se o usuário digitou algo novo
      await onSaveSettings({
        club_name: clubName,
        club_region: clubRegion,
        club_year: clubYear,
        investiture_date: investitureDate,
        allow_counselor_direct_approval: allowCounselorDirect ? 'true' : 'false',
        demo_mode_enabled: demoModeEnabled,
        smtp_user: smtpUser.trim(),
        smtp_pass: smtpPass.trim() ? smtpPass.trim() : undefined,
        smtp_from_name: smtpFromName.trim(),
        google_client_id: googleClientId.trim(),
      });
      setSmtpPass('');
      await onTestSmtp(currentUser?.email || smtpUser.trim());
    } finally {
      setTestingSmtp(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <Shield className="w-6 h-6 text-indigo-600" />
            Liderança, Convites por E-mail & Configurações do Clube
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Cadastre os líderes com o e-mail real deles, envie convites automáticos e configure o Gmail SMTP e Login Google.
          </p>
        </div>

        {canManageLeaders && (
          <button
            onClick={openCreateLeader}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer shrink-0"
          >
            <UserPlus className="w-4 h-4" />
            Convidar / Cadastrar Líder
          </button>
        )}
      </div>

      {/* Grid Principal: Lista de Líderes + Configurações do Clube & SMTP */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Coluna 1 e 2: Contas de Líderes */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 bg-slate-50/70 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-extrabold text-slate-900">
              Líderes Cadastrados ({leaders.length})
            </h2>
            <span className="text-xs text-slate-500">
              Envie o convite por e-mail ou copie o link direto de ativação
            </span>
          </div>

          <div className="divide-y divide-slate-100">
            {leaders.map((ld) => {
              const rCfg = ROLE_CONFIG[ld.role] || ROLE_CONFIG.INSTRUTOR;
              const inviteUrl = inviteLinksMap[ld.id];
              return (
                <div
                  key={ld.id}
                  className="p-4 hover:bg-slate-50/80 transition flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-bold text-slate-900">
                        {ld.name}
                      </span>
                      <span
                        className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${rCfg.badgeClass}`}
                      >
                        {rCfg.label}
                      </span>
                      {ld.is_demo ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                          CONTA DEMO
                        </span>
                      ) : ld.has_pending_invite ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-300">
                          CONVITE PENDENTE
                        </span>
                      ) : ld.email_verified ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                          E-MAIL VERIFICADO
                        </span>
                      ) : null}
                      {!ld.active && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-800">
                          INATIVO
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-500 font-mono">
                      {ld.email}
                    </div>

                    {/* Escopo do Conselheiro ou Instrutor */}
                    {ld.role === 'CONSELHEIRO' && (
                      <div className="text-xs text-rose-800 font-medium">
                        Unidade vinculada: <strong>{ld.unit_name || 'Todas'}</strong>
                      </div>
                    )}
                    {ld.role === 'INSTRUTOR' && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {(ld.assigned_classes || []).map((slug) => (
                          <span
                            key={slug}
                            className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200"
                          >
                            {slug}
                          </span>
                        ))}
                      </div>
                    )}

                    {inviteUrl && (
                      <div className="mt-2 p-2 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-between gap-2">
                        <span className="text-[11px] text-indigo-900 font-mono truncate">
                          {inviteUrl}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopyInviteLink(ld.id, inviteUrl)}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 shrink-0 transition cursor-pointer ${
                            copiedLeaderId === ld.id
                              ? 'bg-emerald-600 text-white shadow-sm scale-105'
                              : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                          }`}
                        >
                          {copiedLeaderId === ld.id ? (
                            <>
                              <Check className="w-3 h-3" />
                              ✓ Copiado!
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              Copiar Link
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>

                  {canManageLeaders && (
                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <button
                        type="button"
                        disabled={sendingInviteId === ld.id}
                        onClick={() => handleSendInviteClick(ld)}
                        className="px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-300 text-xs font-bold text-amber-900 flex items-center gap-1.5 cursor-pointer"
                        title="Envia um e-mail com link para o líder definir a própria senha ou entrar com Google"
                      >
                        <Send className="w-3.5 h-3.5 text-amber-700" />
                        {sendingInviteId === ld.id
                          ? 'Enviando...'
                          : ld.has_pending_invite
                          ? 'Reenviar Convite'
                          : 'Enviar Convite'}
                      </button>

                      <button
                        type="button"
                        onClick={() => openEditLeader(ld)}
                        className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-xs font-bold text-slate-700 flex items-center gap-1.5 cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        Editar
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Coluna 3: Configurações Gerais, Gmail SMTP e Login Google */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Settings className="w-5 h-5 text-slate-700" />
              <h2 className="text-sm font-extrabold text-slate-900">
                Parâmetros do Clube & E-mail Oficial
              </h2>
            </div>

            <form onSubmit={handleSettingsSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nome Oficial do Clube
                </label>
                <input
                  type="text"
                  disabled={!canManageLeaders}
                  value={clubName}
                  onChange={(e) => setClubName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Campo / Associação / Região
                </label>
                <input
                  type="text"
                  disabled={!canManageLeaders}
                  value={clubRegion}
                  onChange={(e) => setClubRegion(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Ano Eclesiástico
                  </label>
                  <input
                    type="text"
                    disabled={!canManageLeaders}
                    value={clubYear}
                    onChange={(e) => setClubYear(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Data da Investidura
                  </label>
                  <DateInput
                    disabled={!canManageLeaders}
                    value={investitureDate}
                    onChange={(newDate) => setInvestitureDate(newDate)}
                    className="px-3 py-2 rounded-xl border border-slate-300 text-xs"
                  />
                </div>
              </div>

              {/* Regra de Dupla Checagem Conselheiro -> Instrutor */}
              <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200 space-y-1.5">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    disabled={!canManageLeaders}
                    checked={allowCounselorDirect}
                    onChange={(e) => setAllowCounselorDirect(e.target.checked)}
                    className="mt-0.5 rounded text-amber-600"
                  />
                  <span className="text-xs font-bold text-amber-950">
                    Permitir que Conselheiros assinem &ldquo;APROVADO&rdquo; direto
                  </span>
                </label>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  Quando desmarcado, Conselheiros marcam até <strong>FEITO (Aguardando Visto)</strong>.
                </p>
              </div>

              {/* Seção Gmail SMTP */}
              <div className="pt-3 border-t border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Mail className="w-4 h-4 text-indigo-600" />
                    <span className="text-xs font-extrabold text-slate-900">
                      Envio de E-mails (Gmail SMTP)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowSmtpHelp(!showSmtpHelp)}
                    className="text-[11px] text-indigo-600 hover:underline font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                    Como criar Senha de App?
                  </button>
                </div>

                {showSmtpHelp && (
                  <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-200 text-[11px] text-indigo-950 space-y-1.5 leading-relaxed">
                    <div className="font-bold">
                      Como usar seu Gmail sem expor sua senha pessoal:
                    </div>
                    <ol className="list-decimal pl-4 space-y-1">
                      <li>
                        Use qualquer conta Gmail (ou crie uma para o clube) com a{' '}
                        <strong>Verificação em Duas Etapas</strong> ativa.
                      </li>
                      <li>
                        Acesse{' '}
                        <a
                          href="https://myaccount.google.com/apppasswords"
                          target="_blank"
                          rel="noreferrer"
                          className="underline font-bold text-indigo-700 inline-flex items-center gap-0.5"
                        >
                          myaccount.google.com/apppasswords
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </li>
                      <li>
                        Crie uma senha chamada <strong>SGC Desbravadores</strong> e cole as{' '}
                        <strong>16 letras</strong> geradas no campo abaixo.
                      </li>
                    </ol>
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    E-mail Gmail Remetente (envia convites e códigos)
                  </label>
                  <input
                    type="email"
                    disabled={!canManageLeaders}
                    value={smtpUser}
                    onChange={(e) => setSmtpUser(e.target.value)}
                    placeholder="seuclube@gmail.com"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Senha de App do Google (16 letras)
                    {settings?.smtp_pass_configured && (
                      <span className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">
                        JÁ CONFIGURADA
                      </span>
                    )}
                  </label>
                  <input
                    type="password"
                    disabled={!canManageLeaders}
                    value={smtpPass}
                    onChange={(e) => setSmtpPass(e.target.value)}
                    placeholder={
                      settings?.smtp_pass_configured
                        ? '•••••••••••••••• (deixe vazio p/ manter)'
                        : 'xxxx xxxx xxxx xxxx'
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono"
                  />
                </div>

                {canManageLeaders && smtpUser && (
                  <button
                    type="button"
                    disabled={testingSmtp}
                    onClick={handleTestSmtpClick}
                    className="w-full py-2 rounded-xl border border-indigo-300 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    {testingSmtp
                      ? 'Enviando e-mail de teste...'
                      : `Salvar e Enviar E-mail de Teste`}
                  </button>
                )}
              </div>

              {/* Seção Login com Google */}
              <div className="pt-3 border-t border-slate-200 space-y-2">
                <label className="block text-[11px] font-bold text-slate-700">
                  Google OAuth Client ID (Opcional — Botão &ldquo;Entrar com Google&rdquo;)
                </label>
                <input
                  type="text"
                  disabled={!canManageLeaders}
                  value={googleClientId}
                  onChange={(e) => setGoogleClientId(e.target.value)}
                  placeholder="1234567890-abc.apps.googleusercontent.com"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono"
                />
                <p className="text-[10px] text-slate-500 leading-relaxed">
                  Quando preenchido, os líderes cadastrados podem entrar com 1 clique usando a conta Google deles.
                </p>
              </div>

              {canManageLeaders && (
                <button
                  type="submit"
                  disabled={savingSettings}
                  className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition cursor-pointer"
                >
                  {savingSettings ? 'Salvando...' : 'Salvar Todas as Configurações'}
                </button>
              )}
            </form>
          </div>

          {/* Card de Backup & Exportação de Dados do Clube */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-200">
              <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-700">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Backup & Exportação de Dados
                </h3>
                <p className="text-xs text-slate-500">
                  Exporte cópias dos dados para segurança ou prestação de contas à Igreja e Associação.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <span className="text-xs font-bold text-slate-800 block">
                    Planilha Geral de Investidura (.CSV / Excel)
                  </span>
                  <span className="text-[11px] text-slate-500 block">
                    Lista todos os desbravadores, percentual de conclusão e aptidão para investidura.
                  </span>
                </div>
                <button
                  type="button"
                  disabled={downloadingCsv}
                  onClick={handleDownloadCsv}
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shrink-0 transition cursor-pointer disabled:opacity-50 shadow-xs"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  {downloadingCsv ? 'Exportando...' : 'Exportar Planilha CSV'}
                </button>
              </div>

              {canManageLeaders && (
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">
                      Backup Completo do Clube (.JSON)
                    </span>
                    <span className="text-[11px] text-slate-500 block">
                      Cópia de segurança com desbravadores, cartões, unidades, eventos e trilha de auditoria.
                    </span>
                  </div>
                  <button
                    type="button"
                    disabled={downloadingBackup}
                    onClick={handleDownloadBackup}
                    className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 shrink-0 transition cursor-pointer disabled:opacity-50 shadow-xs"
                  >
                    <Download className="w-4 h-4" />
                    {downloadingBackup ? 'Baixando...' : 'Baixar Backup JSON'}
                  </button>
                </div>
              )}

              {/* Seção Sistema de Backup Automático & Pontos de Restauração (.sqlite) */}
              {canManageLeaders && (
                <div className="mt-4 pt-4 border-t border-slate-200 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 text-[11px] font-extrabold border border-emerald-200">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        Backup Automático Ativo
                      </span>
                      <span className="text-xs font-bold text-slate-700">
                        Pontos de Restauração do Servidor (.sqlite)
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={fetchServerBackups}
                        disabled={loadingBackups}
                        className="px-2.5 py-1.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                        title="Atualizar lista"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${loadingBackups ? 'animate-spin text-amber-500' : ''}`} />
                        Atualizar
                      </button>
                      <button
                        type="button"
                        onClick={handleCreateSnapshotNow}
                        disabled={creatingSnapshot}
                        className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs disabled:opacity-50"
                      >
                        <HardDrive className="w-3.5 h-3.5" />
                        {creatingSnapshot ? 'Criando Snapshot...' : 'Criar Ponto Agora'}
                      </button>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    O servidor cria automaticamente um snapshot de segurança antes de cada reinício/manutenção e periodicamente a cada 6 horas. Os dados nunca são perdidos após atualizações.
                  </p>

                  {/* Feedback Mensagens */}
                  {backupSuccessMsg && (
                    <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{backupSuccessMsg}</span>
                    </div>
                  )}

                  {backupErrorMsg && (
                    <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs font-semibold flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>{backupErrorMsg}</span>
                    </div>
                  )}

                  {/* Tabela de Backups do Servidor */}
                  <div className="rounded-xl border border-slate-200 overflow-hidden bg-slate-50/50">
                    {loadingBackups ? (
                      <div className="p-6 text-center text-xs text-slate-500 font-medium">
                        Carregando backups do servidor...
                      </div>
                    ) : serverBackups.length === 0 ? (
                      <div className="p-6 text-center text-xs text-slate-500 font-medium">
                        Nenhum ponto de restauração gravado ainda. Clique em &quot;Criar Ponto Agora&quot;.
                      </div>
                    ) : (
                      <div className="max-h-64 overflow-y-auto divide-y divide-slate-200">
                        {serverBackups.slice(0, 10).map((b) => {
                          const dateObj = new Date(b.created_at);
                          const dateFormatted = !isNaN(dateObj)
                            ? `${dateObj.toLocaleDateString('pt-BR')} ${dateObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
                            : b.created_at;
                          const sizeKb = Math.round((b.size_bytes || 0) / 1024);

                          let triggerBadge = 'bg-slate-200 text-slate-800';
                          let triggerLabel = b.trigger || 'AUTO';
                          if (b.trigger === 'STARTUP') {
                            triggerBadge = 'bg-blue-100 text-blue-800 border-blue-200';
                            triggerLabel = 'INICIALIZAÇÃO';
                          } else if (b.trigger === 'SCHEDULED') {
                            triggerBadge = 'bg-purple-100 text-purple-800 border-purple-200';
                            triggerLabel = 'ROTINA 6H';
                          } else if (b.trigger === 'MANUAL') {
                            triggerBadge = 'bg-amber-100 text-amber-800 border-amber-200';
                            triggerLabel = 'MANUAL';
                          } else if (b.trigger === 'HISTORICO') {
                            triggerBadge = 'bg-indigo-100 text-indigo-800 border-indigo-200';
                            triggerLabel = 'HISTÓRICO';
                          } else if (b.trigger === 'EMERGENCY_PRE_RESTORE') {
                            triggerBadge = 'bg-rose-100 text-rose-800 border-rose-200';
                            triggerLabel = 'SEGURANÇA';
                          }

                          return (
                            <div
                              key={b.filename}
                              className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 hover:bg-white transition"
                            >
                              <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded border ${triggerBadge}`}>
                                    {triggerLabel}
                                  </span>
                                  <span className="text-xs font-bold text-slate-900 truncate" title={b.filename}>
                                    {b.filename}
                                  </span>
                                  <span className="text-[10px] text-slate-500 font-mono">
                                    {sizeKb} KB
                                  </span>
                                </div>
                                <div className="text-[11px] text-slate-500 mt-0.5">
                                  <span>{dateFormatted}</span>
                                  {b.stats && (
                                    <span className="ml-2 font-medium text-slate-600">
                                      • {b.stats.pathfinders} desbravadores, {b.stats.progress_records} requisitos
                                    </span>
                                  )}
                                  {b.reason && (
                                    <span className="ml-2 text-slate-400 italic hidden md:inline">
                                      ({b.reason})
                                    </span>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                                <button
                                  type="button"
                                  onClick={() => handleDownloadSqlite(b.filename)}
                                  className="px-2.5 py-1 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700 text-[11px] font-bold flex items-center gap-1 cursor-pointer transition"
                                  title="Baixar arquivo SQLite"
                                >
                                  <Download className="w-3 h-3" />
                                  Baixar
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setRestoreModalFile(b)}
                                  disabled={restoringFilename === b.filename}
                                  className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-[11px] font-bold flex items-center gap-1 cursor-pointer transition disabled:opacity-50"
                                  title="Restaurar este ponto de restauração"
                                >
                                  <RotateCcw className="w-3 h-3" />
                                  Restaurar
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Botão de Clonagem do Teste para Produção (Apenas visível se no clube oficial e com permissão) */}
                  {!isTestMode() && (
                    <div className="pt-2 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => setCloneModalOpen(true)}
                        className="text-[11px] text-indigo-700 hover:text-indigo-900 font-bold flex items-center gap-1.5 cursor-pointer underline"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        Deseja importar os dados de simulação do Modo Teste para este Clube Oficial?
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal Criar / Editar Líder */}
      {leaderModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="text-base font-extrabold">
                {editingLeader ? 'Editar Conta de Líder' : 'Convidar / Cadastrar Novo Líder'}
              </h3>
              <button
                onClick={() => setLeaderModalOpen(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={handleLeaderSubmit}
              className="flex-1 overflow-hidden flex flex-col"
            >
              <div className="p-6 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nome Completo do Líder *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Digite o nome completo do líder"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    E-mail Real do Líder *
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@gmail.com"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {editingLeader
                      ? 'Nova Senha (deixe vazio p/ manter)'
                      : 'Senha Provisória (opcional se enviar convite)'}
                  </label>
                  <input
                    type="text"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={
                      editingLeader
                        ? '••••••••'
                        : 'O próprio líder criará pelo link'
                    }
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs"
                  />
                </div>
              </div>

              {!editingLeader && (
                <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-200">
                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={sendInvite}
                      onChange={(e) => setSendInvite(e.target.checked)}
                      className="mt-0.5 rounded text-indigo-600"
                    />
                    <div>
                      <span className="text-xs font-bold text-indigo-950 block">
                        Enviar convite por e-mail para o líder criar a própria senha
                      </span>
                      <span className="text-[11px] text-indigo-800">
                        O sistema envia o link oficial de ativação para o e-mail dele (e também gera um link copiável caso queira mandar por WhatsApp).
                      </span>
                    </div>
                  </label>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Cargo / Papel no Clube (RBAC) *
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-bold"
                >
                  <option value="DIRETOR">DIRETOR(A) — Direção Geral do Clube e Reversão de Logs</option>
                  <option value="GESTOR">GESTOR(A) / TI — Administração do Sistema (mesmos direitos do Diretor)</option>
                  <option value="SECRETARIO">SECRETÁRIO(A) — Cadastros, Unidades e Relatórios</option>
                  <option value="INSTRUTOR">INSTRUTOR(A) — Avalia e Assina Classes Atribuídas</option>
                  <option value="CONSELHEIRO">CONSELHEIRO(A) — Acompanha Desbravadores da Unidade</option>
                </select>
              </div>

              {role === 'CONSELHEIRO' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Unidade Sob Responsabilidade do Conselheiro
                  </label>
                  <select
                    value={unitId}
                    onChange={(e) => setUnitId(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs"
                  >
                    <option value="">Todas as Unidades</option>
                    {units.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {role === 'INSTRUTOR' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Classes que este Instrutor Leciona e Assina:
                  </label>
                  <div className="grid grid-cols-2 gap-2 max-h-44 overflow-y-auto border border-slate-200 rounded-xl p-2">
                    {(catalog.classes || []).map((cls) => {
                      const checked = assignedClasses.includes(cls.slug);
                      return (
                        <label
                          key={cls.slug}
                          className={`p-2 rounded-lg border text-xs flex items-center gap-2 cursor-pointer ${
                            checked
                              ? 'bg-emerald-50 border-emerald-400 font-bold'
                              : 'border-slate-200'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleClassScope(cls.slug)}
                            className="rounded text-emerald-600"
                          />
                          <span className="truncate">{cls.name}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={active}
                  onChange={(e) => setActive(e.target.checked)}
                  className="rounded text-indigo-600"
                />
                Conta Ativa (pode fazer login no sistema)
              </label>
              </div>

              <div className="p-4 px-6 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-2 shrink-0">
                {editingLeader &&
                onDeleteLeader &&
                editingLeader.id !== currentUser?.id ? (
                  <button
                    type="button"
                    onClick={async () => {
                      if (
                        window.confirm(
                          `Tem certeza que deseja excluir a conta do líder "${editingLeader.name}"?`
                        )
                      ) {
                        await onDeleteLeader(editingLeader.id);
                        setLeaderModalOpen(false);
                      }
                    }}
                    className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold cursor-pointer"
                  >
                    Excluir Conta
                  </button>
                ) : (
                  <div />
                )}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setLeaderModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={savingLeader}
                    className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold cursor-pointer"
                  >
                    {savingLeader
                      ? 'Salvando...'
                      : editingLeader
                      ? 'Salvar Alterações'
                      : sendInvite
                      ? 'Cadastrar & Gerar Convite'
                      : 'Salvar Líder'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Restauração */}
      {restoreModalFile && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-rose-100 text-rose-700">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    Restaurar Ponto de Segurança?
                  </h3>
                  <p className="text-xs text-slate-500">
                    Confirme para reverter o banco para este estado.
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5 text-slate-700">
                <div className="font-bold text-slate-900">
                  Arquivo selecionado:
                </div>
                <div className="font-mono text-[11px] text-indigo-700 break-all">
                  {restoreModalFile.filename}
                </div>
                {restoreModalFile.stats && (
                  <div className="text-[11px] text-slate-600">
                    Contém: <strong>{restoreModalFile.stats.pathfinders} desbravadores</strong> e <strong>{restoreModalFile.stats.progress_records} requisitos</strong>.
                  </div>
                )}
                <div className="text-[11px] text-emerald-700 font-semibold pt-1 border-t border-slate-200">
                  🛡️ Proteção Ativa: Um backup de emergência do estado atual será salvo automaticamente antes de aplicar a restauração.
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRestoreModalFile(null)}
                  disabled={Boolean(restoringFilename)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 cursor-pointer hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmRestore}
                  disabled={Boolean(restoringFilename)}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  {restoringFilename ? 'Restaurando...' : 'Sim, Restaurar Banco'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Clonagem de Dados de Teste */}
      {cloneModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-indigo-100 text-indigo-700">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    Importar Simulação para Produção?
                  </h3>
                  <p className="text-xs text-slate-500">
                    Copia os 7 desbravadores e 213 requisitos do teste para o clube oficial.
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-indigo-50/60 border border-indigo-200 text-xs space-y-2 text-indigo-950 leading-relaxed">
                <div>
                  Isso preencherá seu Clube Oficial com os <strong>7 desbravadores</strong> de exemplo (todas as 6 classes regulares e avançadas) e seus <strong>213 requisitos assinados</strong>.
                </div>
                <div>
                  Sua conta de Gestor atual será preservada integralmente e um <strong>snapshot de emergência</strong> será salvo no servidor antes da importação.
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCloneModalOpen(false)}
                  disabled={cloningTest}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 cursor-pointer hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmCloneTest}
                  disabled={cloningTest}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  {cloningTest ? 'Importando...' : 'Confirmar Importação'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
