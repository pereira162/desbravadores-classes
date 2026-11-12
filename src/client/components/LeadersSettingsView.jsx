import React, { useState, useEffect } from 'react';
import {
  Shield,
  UserPlus,
  Users,
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
  Eye,
  EyeOff,
  Bot,
  Image as ImageIcon,
  CheckSquare,
  Clock,
  Layers,
  ChevronRight,
} from 'lucide-react';
import { ROLE_CONFIG } from '../constants';
import DateInput from './DateInput';
import { API_BASE_URL, getStoredToken, isTestMode, apiRequest } from '../api';
import { useModalDismiss } from '../utils/modalStack';

const EXTRA_PERMISSIONS_OPTIONS = [
  {
    key: 'can_manage_permissions',
    label: 'Configurar Poderes da Diretoria',
    desc: 'Permite alterar permissões e conceder/retirar poderes de outros membros da diretoria.',
  },
  {
    key: 'can_manage_pathfinders',
    label: 'Cadastrar e Editar Desbravadores',
    desc: 'Permite adicionar novos desbravadores, alterar matrículas e gerar links de conta.',
  },
  {
    key: 'can_manage_units',
    label: 'Criar e Editar Unidades',
    desc: 'Permite criar, renomear ou excluir unidades do clube.',
  },
  {
    key: 'can_manage_events',
    label: 'Criar Eventos e Dar Baixa em Lote',
    desc: 'Permite agendar eventos no calendário e assinar presença/requisitos da turma.',
  },
  {
    key: 'can_approve_events',
    label: 'Aprovar Eventos do Calendário',
    desc: 'Permite autorizar e validar eventos criados por outros membros da liderança antes da execução.',
  },
  {
    key: 'can_approve_all',
    label: 'Aprovar Qualquer Classe (Poder de Instrutor Geral)',
    desc: 'Libera assinar APROVADO oficial em qualquer classe (mesmo sendo Conselheiro ou Secretário).',
  },
  {
    key: 'can_view_all_classes',
    label: 'Ver Todas as Classes do Clube',
    desc: 'Desbloqueia a visão de todas as 6 classes regulares e avançadas.',
  },
  {
    key: 'can_view_all_units',
    label: 'Ver Todas as Unidades do Clube',
    desc: 'Desbloqueia a visão de todas as unidades além da unidade própria.',
  },
  {
    key: 'can_edit_equivalences',
    label: 'Criar e Editar Unificações entre Classes',
    desc: 'Permite criar ou editar grupos de equivalência no Planejamento Anual.',
  },
];

const CUSTOM_ROLE_SUGGESTIONS = [
  'Diretor Associado',
  'Diretora Associada',
  'Capelão',
  'Instrutor Geral',
  'Coordenador de Classes',
  'Coordenador de Unidades',
  'Tesoureiro(a)',
  'Ancião Conselheiro',
];

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
  onOpenMcpModal,
}) {
  // Aba ativa: 'leaders' | 'club' | 'backups'
  const [activeTab, setActiveTab] = useState('leaders');

  // Estado das Configurações do Clube + Logo + Cor + SMTP + Google
  const [clubName, setClubName] = useState(settings?.club_name || '');
  const [clubRegion, setClubRegion] = useState(settings?.club_region || '');
  const [clubYear, setClubYear] = useState(settings?.club_year || '2026');
  const [investitureDate, setInvestitureDate] = useState(
    settings?.investiture_date || '2026-11-28'
  );
  const [clubLogoUrl, setClubLogoUrl] = useState(settings?.club_logo_url || '');
  const [colorTheme, setColorTheme] = useState(settings?.color_theme || 'amber');
  const [allowCounselorDirect, setAllowCounselorDirect] = useState(
    settings?.allow_counselor_direct_approval === 'true'
  );
  const [demoModeEnabled, setDemoModeEnabled] = useState(false);

  // Estado de E-mail (Gmail SMTP) e Google Sign-In
  const [smtpUser, setSmtpUser] = useState(settings?.smtp_user || '');
  const [smtpPass, setSmtpPass] = useState('');
  const [showSmtpPass, setShowSmtpPass] = useState(false);
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
    setClubLogoUrl(settings.club_logo_url || '');
    setColorTheme(settings.color_theme || 'amber');
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
  const [showLeaderPassword, setShowLeaderPassword] = useState(false);
  const [sendInvite, setSendInvite] = useState(true);
  const [role, setRole] = useState('INSTRUTOR');
  const [customRoleTitle, setCustomRoleTitle] = useState('');
  const [unitId, setUnitId] = useState('');
  const [assignedUnits, setAssignedUnits] = useState([]);
  const [assignedClasses, setAssignedClasses] = useState([]);
  const [leaderPermissions, setLeaderPermissions] = useState({});
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

  // Registro de modais na pilha hierárquica global (ESC e Voltar Mobile)
  useModalDismiss(leaderModalOpen, () => setLeaderModalOpen(false), 'ModalLider');
  useModalDismiss(Boolean(restoreModalFile), () => setRestoreModalFile(null), 'ModalRestaurarBackup');
  useModalDismiss(cloneModalOpen, () => setCloneModalOpen(false), 'ModalClonarTeste');

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

  const canManageLeaders =
    ['ADMIN', 'GESTOR', 'DIRETOR'].includes(currentUser?.role) ||
    Boolean(currentUser?.permissions?.can_manage_permissions);

  const [leadersViewMode, setLeadersViewMode] = useState('CARDS'); // 'CARDS' | 'MATRIX'

  const handleToggleLeaderPermissionQuick = async (ld, permKey) => {
    if (!canManageLeaders) return;
    const currentPerms = ld.permissions || {};
    const updatedPerms = {
      ...currentPerms,
      [permKey]: !currentPerms[permKey],
    };
    try {
      await onSaveLeader(
        {
          name: ld.name,
          email: ld.email,
          role: ld.role,
          custom_role_title: ld.custom_role_title,
          unit_id: ld.unit_id,
          assigned_units: ld.assigned_units || [],
          assigned_classes: ld.assigned_classes || [],
          permissions: updatedPerms,
          active: ld.active !== false,
        },
        ld.id
      );
    } catch (err) {
      alert(err.message || 'Erro ao atualizar poder do líder.');
    }
  };

  const openCreateLeader = () => {
    setEditingLeader(null);
    setName('');
    setEmail('');
    setPassword('');
    setShowLeaderPassword(false);
    setSendInvite(true);
    setRole('INSTRUTOR');
    setCustomRoleTitle('');
    setUnitId('');
    setAssignedUnits([]);
    setAssignedClasses(['amigo', 'amigo-avancado']);
    setLeaderPermissions({});
    setActive(true);
    setLeaderModalOpen(true);
  };

  const openEditLeader = (ld) => {
    setEditingLeader(ld);
    setName(ld.name);
    setEmail(ld.email);
    setPassword('');
    setShowLeaderPassword(false);
    setSendInvite(false);
    setRole(ld.role);
    setCustomRoleTitle(ld.custom_role_title || '');
    setUnitId(ld.unit_id || '');
    setAssignedUnits(ld.assigned_units || []);
    setAssignedClasses(ld.assigned_classes || []);
    setLeaderPermissions(ld.permissions || {});
    setActive(Boolean(ld.active));
    setLeaderModalOpen(true);
  };

  const toggleClassScope = (slug) => {
    setAssignedClasses((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
    );
  };

  const toggleUnitScope = (uId) => {
    setAssignedUnits((prev) =>
      prev.includes(uId) ? prev.filter((id) => id !== uId) : [...prev, uId]
    );
  };

  const togglePermissionFlag = (permKey) => {
    setLeaderPermissions((prev) => ({
      ...prev,
      [permKey]: !prev[permKey],
    }));
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
          custom_role_title: customRoleTitle.trim(),
          unit_id: unitId || null,
          assigned_units: assignedUnits,
          assigned_classes: assignedClasses,
          permissions: leaderPermissions,
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

  const handleLogoFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 1.5 * 1024 * 1024) {
      alert('Escolha uma imagem com até 1.5 MB para a logo do clube.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setClubLogoUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
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
        club_logo_url: clubLogoUrl.trim(),
        color_theme: colorTheme,
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
      await onSaveSettings({
        club_name: clubName,
        club_region: clubRegion,
        club_year: clubYear,
        investiture_date: investitureDate,
        club_logo_url: clubLogoUrl.trim(),
        color_theme: colorTheme,
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
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Cabeçalho Apple System Settings */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white flex items-center gap-2.5">
            <Shield className="w-6 h-6 text-[#0071e3]" />
            Ajustes & Liderança
          </h1>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
            Gerencie os membros da diretoria, cargos, poderes granulares, identidade visual e cópias de segurança.
          </p>
        </div>

        {canManageLeaders && (
          <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
            {onOpenMcpModal && (
              <button
                type="button"
                onClick={onOpenMcpModal}
                className="apple-press inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold bg-amber-500/10 hover:bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/25 transition cursor-pointer"
              >
                <Bot className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                Servidor MCP
              </button>
            )}
            <button
              type="button"
              onClick={openCreateLeader}
              className="apple-press inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold bg-[#0071e3] hover:bg-[#0077ed] text-white shadow-sm transition cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              Novo Líder
            </button>
          </div>
        )}
      </div>

      {/* Apple Segmented Control Tab Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="inline-flex p-1 rounded-2xl bg-black/5 dark:bg-white/10 self-start">
          <button
            type="button"
            onClick={() => setActiveTab('leaders')}
            className={`apple-press flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs font-semibold tracking-tight transition cursor-pointer ${
              activeTab === 'leaders'
                ? 'bg-white dark:bg-[#1c1c1e] text-neutral-900 dark:text-white shadow-xs'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-[#0071e3]" />
            <span>Líderes & Poderes</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-neutral-200/60 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-bold">
              {leaders.length}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('club')}
            className={`apple-press flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs font-semibold tracking-tight transition cursor-pointer ${
              activeTab === 'club'
                ? 'bg-white dark:bg-[#1c1c1e] text-neutral-900 dark:text-white shadow-xs'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            <Settings className="w-3.5 h-3.5 text-amber-500" />
            <span>Identidade & E-mail</span>
            {settings?.smtp_pass_configured && (
              <span className="w-2 h-2 rounded-full bg-[#34c759]" title="SMTP Ativo" />
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('backups')}
            className={`apple-press flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs font-semibold tracking-tight transition cursor-pointer ${
              activeTab === 'backups'
                ? 'bg-white dark:bg-[#1c1c1e] text-neutral-900 dark:text-white shadow-xs'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            <Database className="w-3.5 h-3.5 text-indigo-500" />
            <span>Backups & Time Machine</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-neutral-200/60 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-bold">
              {serverBackups.length}
            </span>
          </button>
        </div>

        {activeTab === 'leaders' && (
          <div className="inline-flex p-1 rounded-xl bg-black/5 dark:bg-white/10 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setLeadersViewMode('CARDS')}
              className={`apple-press flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                leadersViewMode === 'CARDS'
                  ? 'bg-white dark:bg-[#1c1c1e] text-neutral-900 dark:text-white shadow-xs'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              <Users className="w-3 h-3" />
              Cartões
            </button>
            <button
              type="button"
              onClick={() => setLeadersViewMode('MATRIX')}
              className={`apple-press flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                leadersViewMode === 'MATRIX'
                  ? 'bg-white dark:bg-[#1c1c1e] text-neutral-900 dark:text-white shadow-xs'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              <Shield className="w-3 h-3 text-amber-500" />
              Matriz de Poderes
            </button>
          </div>
        )}
      </div>

      {/* ABA 1: LÍDERES & PODERES */}
      {activeTab === 'leaders' && (
        <div className="space-y-4">
          {leadersViewMode === 'MATRIX' ? (
            <div className="bg-white dark:bg-[#1c1c1e] rounded-3xl border border-black/5 dark:border-white/10 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-black/5 dark:border-white/10 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-neutral-900 dark:text-white">
                    Matriz Geral de Poderes e Permissões
                  </h2>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    Ajuste rapidamente os poderes da liderança com um clique por membro da diretoria.
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto matrix-scroll">
                <table className="w-full border-collapse text-left text-xs">
                  <thead>
                    <tr className="bg-neutral-50/80 dark:bg-neutral-900/80 border-b border-black/5 dark:border-white/10">
                      <th className="sticky left-0 z-20 bg-neutral-50 dark:bg-neutral-900 px-5 py-3.5 min-w-[220px] font-bold text-neutral-900 dark:text-white border-r border-black/5 dark:border-white/10">
                        Membro da Diretoria
                      </th>
                      {EXTRA_PERMISSIONS_OPTIONS.map((opt) => (
                        <th
                          key={opt.key}
                          className="px-3 py-3.5 text-center min-w-[130px] font-semibold text-neutral-600 dark:text-neutral-300 border-r border-black/5 dark:border-white/10 text-[11px]"
                          title={opt.desc}
                        >
                          <div className="line-clamp-2">{opt.label}</div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/5 dark:divide-white/5">
                    {leaders.map((ld) => {
                      const isTotalPower = ['ADMIN', 'GESTOR', 'DIRETOR'].includes(ld.role);
                      const rCfg = ROLE_CONFIG[ld.role] || ROLE_CONFIG.INSTRUTOR;
                      return (
                        <tr key={ld.id} className="hover:bg-neutral-50/50 dark:hover:bg-white/[0.02] transition group">
                          <td className="sticky left-0 z-10 bg-white dark:bg-[#1c1c1e] group-hover:bg-neutral-50 dark:group-hover:bg-neutral-900/50 px-5 py-3.5 border-r border-black/5 dark:border-white/10">
                            <div className="font-semibold text-neutral-900 dark:text-white">
                              {ld.name}
                            </div>
                            <div className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5 flex items-center gap-1.5 flex-wrap">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${rCfg.badgeClass}`}>
                                {ld.custom_role_title || rCfg.label}
                              </span>
                              <span className="font-mono text-[10px]">{ld.email}</span>
                            </div>
                          </td>
                          {EXTRA_PERMISSIONS_OPTIONS.map((opt) => {
                            const hasPerm = isTotalPower || Boolean(ld.permissions?.[opt.key]);
                            return (
                              <td
                                key={opt.key}
                                className="px-3 py-3 text-center border-r border-black/5 dark:border-white/10 align-middle"
                              >
                                {isTotalPower ? (
                                  <span
                                    className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-bold text-[10px]"
                                    title="Poder total nativo do cargo"
                                  >
                                    <Check className="w-3 h-3 text-emerald-600" />
                                    Total
                                  </span>
                                ) : (
                                  <label className="inline-flex items-center justify-center cursor-pointer p-1">
                                    <input
                                      type="checkbox"
                                      checked={hasPerm}
                                      disabled={!canManageLeaders}
                                      onChange={() => handleToggleLeaderPermissionQuick(ld, opt.key)}
                                      className="w-4 h-4 rounded text-[#0071e3] focus:ring-[#0071e3] cursor-pointer disabled:opacity-40"
                                    />
                                  </label>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {leaders.map((ld) => {
                const rCfg = ROLE_CONFIG[ld.role] || ROLE_CONFIG.INSTRUTOR;
                const inviteUrl = inviteLinksMap[ld.id];
                const activePerms = Object.entries(ld.permissions || {}).filter(
                  ([, val]) => Boolean(val)
                );
                const initials = ld.name
                  ? ld.name
                      .split(' ')
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join('')
                      .toUpperCase()
                  : 'L';

                return (
                  <div
                    key={ld.id}
                    className="bg-white dark:bg-[#1c1c1e] rounded-3xl border border-black/5 dark:border-white/10 shadow-sm p-5 flex flex-col justify-between gap-4 transition hover:shadow-md"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#0071e3]/15 to-[#0071e3]/5 text-[#0071e3] font-bold text-sm flex items-center justify-center shrink-0 border border-[#0071e3]/20">
                            {initials}
                          </div>
                          <div>
                            <div className="text-sm font-bold text-neutral-900 dark:text-white leading-tight">
                              {ld.name}
                            </div>
                            <div className="text-xs text-neutral-500 dark:text-neutral-400 font-mono mt-0.5">
                              {ld.email}
                            </div>
                          </div>
                        </div>

                        <span
                          className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border shrink-0 ${rCfg.badgeClass}`}
                        >
                          {ld.custom_role_title || rCfg.label}
                        </span>
                      </div>

                      {/* Status Badges */}
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        {ld.is_demo ? (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
                            Conta Demo
                          </span>
                        ) : ld.has_pending_invite ? (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                            Convite Pendente
                          </span>
                        ) : ld.email_verified ? (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                            E-mail Verificado
                          </span>
                        ) : null}
                        {!ld.active && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-700 dark:text-rose-400">
                            Inativo
                          </span>
                        )}
                        {ld.custom_role_title && (
                          <span className="text-[10px] text-neutral-500 dark:text-neutral-400">
                            Base: {rCfg.label}
                          </span>
                        )}
                      </div>

                      {/* Escopo de Unidade e Classes */}
                      <div className="space-y-1.5 pt-1 text-xs">
                        {(ld.role === 'CONSELHEIRO' || ld.unit_id) && (
                          <div className="text-neutral-600 dark:text-neutral-300 flex items-center gap-1.5">
                            <span className="text-neutral-500 dark:text-neutral-400">Unidade:</span>
                            <span className="font-semibold text-neutral-900 dark:text-white">
                              {ld.unit_name || 'Todas'}
                            </span>
                          </div>
                        )}
                        {(ld.assigned_classes || []).length > 0 && (
                          <div className="flex flex-wrap items-center gap-1">
                            <span className="text-[10px] text-neutral-500 dark:text-neutral-400 mr-1">
                              Classes:
                            </span>
                            {(ld.assigned_classes || []).map((slug) => (
                              <span
                                key={slug}
                                className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-800 dark:text-emerald-300"
                              >
                                {slug}
                              </span>
                            ))}
                            {Array.isArray(ld.assigned_pathfinders) && ld.assigned_pathfinders.length > 0 && (
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-700 dark:text-indigo-300">
                                {ld.assigned_pathfinders.length} desbravador(es)
                              </span>
                            )}
                          </div>
                        )}
                        {activePerms.length > 0 && (
                          <div className="flex flex-wrap items-center gap-1 pt-0.5">
                            <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 mr-1">
                              Poderes:
                            </span>
                            {activePerms.map(([pKey]) => {
                              const opt = EXTRA_PERMISSIONS_OPTIONS.find((o) => o.key === pKey);
                              return (
                                <span
                                  key={pKey}
                                  className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-900 dark:text-amber-200"
                                >
                                  + {opt ? opt.label : pKey}
                                </span>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {inviteUrl && (
                        <div className="mt-2 p-2.5 rounded-2xl bg-[#0071e3]/5 border border-[#0071e3]/20 flex items-center justify-between gap-2">
                          <span className="text-[11px] text-[#0071e3] font-mono truncate">
                            {inviteUrl}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopyInviteLink(ld.id, inviteUrl)}
                            className={`apple-press px-2.5 py-1 rounded-xl text-[10px] font-bold flex items-center gap-1 shrink-0 transition cursor-pointer ${
                              copiedLeaderId === ld.id
                                ? 'bg-[#34c759] text-white'
                                : 'bg-[#0071e3] hover:bg-[#0077ed] text-white'
                            }`}
                          >
                            {copiedLeaderId === ld.id ? (
                              <>
                                <Check className="w-3 h-3" />
                                Copiado
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
                      <div className="pt-3 border-t border-black/5 dark:border-white/5 flex items-center justify-end gap-2">
                        <button
                          type="button"
                          disabled={sendingInviteId === ld.id}
                          onClick={() => handleSendInviteClick(ld)}
                          className="apple-press px-3 py-1.5 rounded-full bg-amber-500/10 hover:bg-amber-500/15 text-amber-800 dark:text-amber-300 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                        >
                          <Send className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                          {sendingInviteId === ld.id
                            ? 'Enviando...'
                            : ld.has_pending_invite
                            ? 'Reenviar Convite'
                            : 'Enviar Convite'}
                        </button>
                        <button
                          type="button"
                          onClick={() => openEditLeader(ld)}
                          className="apple-press px-3.5 py-1.5 rounded-full bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                        >
                          <Edit3 className="w-3 h-3" />
                          Editar
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ABA 2: DADOS DO CLUBE & E-MAIL */}
      {activeTab === 'club' && (
        <form onSubmit={handleSettingsSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Card 1: Identidade Oficial do Clube */}
            <div className="bg-white dark:bg-[#1c1c1e] rounded-3xl border border-black/5 dark:border-white/10 shadow-sm p-6 space-y-4">
              <div className="flex items-center gap-2.5 pb-2 border-b border-black/5 dark:border-white/10">
                <Settings className="w-5 h-5 text-[#0071e3]" />
                <h2 className="text-base font-bold text-neutral-900 dark:text-white">
                  Identidade do Clube
                </h2>
              </div>

              <div className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                    Nome Oficial do Clube
                  </label>
                  <input
                    type="text"
                    disabled={!canManageLeaders}
                    value={clubName}
                    onChange={(e) => setClubName(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-neutral-200 dark:border-white/10 bg-neutral-50/50 dark:bg-neutral-900/50 text-xs text-neutral-900 dark:text-white focus:ring-2 focus:ring-[#0071e3] transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                    Campo / Associação / Região
                  </label>
                  <input
                    type="text"
                    disabled={!canManageLeaders}
                    value={clubRegion}
                    onChange={(e) => setClubRegion(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-neutral-200 dark:border-white/10 bg-neutral-50/50 dark:bg-neutral-900/50 text-xs text-neutral-900 dark:text-white focus:ring-2 focus:ring-[#0071e3] transition"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                      Ano Eclesiástico
                    </label>
                    <input
                      type="text"
                      disabled={!canManageLeaders}
                      value={clubYear}
                      onChange={(e) => setClubYear(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border border-neutral-200 dark:border-white/10 bg-neutral-50/50 dark:bg-neutral-900/50 text-xs text-neutral-900 dark:text-white focus:ring-2 focus:ring-[#0071e3] transition"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                      Data da Investidura
                    </label>
                    <DateInput
                      disabled={!canManageLeaders}
                      value={investitureDate}
                      onChange={(newDate) => setInvestitureDate(newDate)}
                      className="px-3.5 py-2 rounded-xl border border-neutral-200 dark:border-white/10 bg-neutral-50/50 dark:bg-neutral-900/50 text-xs text-neutral-900 dark:text-white"
                    />
                  </div>
                </div>

                {/* Logo do Clube */}
                <div className="pt-2">
                  <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5 flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-amber-500" />
                    Logo do Clube (URL ou Upload)
                  </label>
                  <div className="flex items-center gap-3">
                    {clubLogoUrl && (
                      <img
                        src={clubLogoUrl}
                        alt="Logo"
                        className="w-12 h-12 rounded-2xl object-contain border border-black/5 dark:border-white/10 bg-neutral-50 dark:bg-neutral-900 p-1 shrink-0 shadow-xs"
                      />
                    )}
                    <input
                      type="text"
                      disabled={!canManageLeaders}
                      value={clubLogoUrl}
                      onChange={(e) => setClubLogoUrl(e.target.value)}
                      placeholder="https://... ou faça upload abaixo"
                      className="flex-1 px-3.5 py-2 rounded-xl border border-neutral-200 dark:border-white/10 bg-neutral-50/50 dark:bg-neutral-900/50 text-xs text-neutral-900 dark:text-white focus:ring-2 focus:ring-[#0071e3] transition"
                    />
                  </div>

                  {canManageLeaders && (
                    <div className="mt-2 flex items-center justify-between">
                      <label className="text-[11px] font-semibold text-[#0071e3] hover:underline cursor-pointer">
                        Fazer upload de imagem (até 1.5 MB)
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleLogoFileUpload}
                          className="hidden"
                        />
                      </label>
                      {clubLogoUrl && (
                        <button
                          type="button"
                          onClick={() => setClubLogoUrl('')}
                          className="text-[11px] text-rose-600 dark:text-rose-400 hover:underline font-semibold cursor-pointer"
                        >
                          Remover logo
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Card 2: Políticas, Regras & Login com Google */}
            <div className="space-y-6">
              {/* Regra de Dupla Checagem Conselheiro -> Instrutor */}
              <div className="bg-white dark:bg-[#1c1c1e] rounded-3xl border border-black/5 dark:border-white/10 shadow-sm p-6 space-y-4">
                <div className="flex items-center gap-2.5 pb-2 border-b border-black/5 dark:border-white/10">
                  <CheckSquare className="w-5 h-5 text-emerald-500" />
                  <h2 className="text-base font-bold text-neutral-900 dark:text-white">
                    Fluxo de Assinaturas & Visto
                  </h2>
                </div>

                <div className="flex items-start justify-between gap-4 p-4 rounded-2xl bg-neutral-50/70 dark:bg-neutral-900/70 border border-black/5 dark:border-white/10">
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-neutral-900 dark:text-white block">
                      Permitir que Conselheiros assinem &ldquo;APROVADO&rdquo; direto
                    </span>
                    <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-relaxed">
                      Quando desativado, o Conselheiro marca até <strong>FEITO (Aguardando Visto)</strong>, exigindo a chancela final do Instrutor oficial.
                    </p>
                  </div>

                  {/* iOS Switch */}
                  <button
                    type="button"
                    role="switch"
                    aria-checked={allowCounselorDirect}
                    disabled={!canManageLeaders}
                    onClick={() => setAllowCounselorDirect(!allowCounselorDirect)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none disabled:opacity-50 ${
                      allowCounselorDirect ? 'bg-[#34c759]' : 'bg-neutral-300 dark:bg-neutral-700'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                        allowCounselorDirect ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Google OAuth Login */}
                <div className="pt-2 space-y-2">
                  <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                    Google OAuth Client ID (1-Clique &ldquo;Entrar com Google&rdquo;)
                  </label>
                  <input
                    type="text"
                    disabled={!canManageLeaders}
                    value={googleClientId}
                    onChange={(e) => setGoogleClientId(e.target.value)}
                    placeholder="1234567890-abc.apps.googleusercontent.com"
                    className="w-full px-3.5 py-2 rounded-xl border border-neutral-200 dark:border-white/10 bg-neutral-50/50 dark:bg-neutral-900/50 text-xs text-neutral-900 dark:text-white font-mono focus:ring-2 focus:ring-[#0071e3] transition"
                  />
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                    Opcional. Permite que a liderança entre no SGC sem digitar senhas usando a conta Google.
                  </p>
                </div>
              </div>

              {/* Card 3: Envio de E-mails (Gmail SMTP) */}
              <div className="bg-white dark:bg-[#1c1c1e] rounded-3xl border border-black/5 dark:border-white/10 shadow-sm p-6 space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-black/5 dark:border-white/10">
                  <div className="flex items-center gap-2.5">
                    <Mail className="w-5 h-5 text-indigo-500" />
                    <h2 className="text-base font-bold text-neutral-900 dark:text-white">
                      Envio de E-mails (Gmail SMTP)
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowSmtpHelp(!showSmtpHelp)}
                    className="text-[11px] font-semibold text-[#0071e3] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                    Como configurar?
                  </button>
                </div>

                {showSmtpHelp && (
                  <div className="p-3.5 rounded-2xl bg-[#0071e3]/5 border border-[#0071e3]/20 text-[11px] text-neutral-700 dark:text-neutral-300 space-y-2 leading-relaxed">
                    <div className="font-bold text-neutral-900 dark:text-white">
                      Como usar o Gmail com segurança sem expor sua senha pessoal:
                    </div>
                    <ol className="list-decimal pl-4 space-y-1">
                      <li>Use sua conta Gmail com a <strong>Verificação em 2 Etapas</strong> ativa.</li>
                      <li>
                        Acesse{' '}
                        <a
                          href="https://myaccount.google.com/apppasswords"
                          target="_blank"
                          rel="noreferrer"
                          className="font-bold underline text-[#0071e3] inline-flex items-center gap-0.5"
                        >
                          myaccount.google.com/apppasswords
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </li>
                      <li>Crie uma senha de app chamada <strong>SGC Classes</strong> e cole as 16 letras abaixo.</li>
                    </ol>
                  </div>
                )}

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                      E-mail Gmail Remetente (envio de convites oficiais)
                    </label>
                    <input
                      type="email"
                      disabled={!canManageLeaders}
                      value={smtpUser}
                      onChange={(e) => setSmtpUser(e.target.value)}
                      placeholder="seuclube@gmail.com"
                      className="w-full px-3.5 py-2 rounded-xl border border-neutral-200 dark:border-white/10 bg-neutral-50/50 dark:bg-neutral-900/50 text-xs text-neutral-900 dark:text-white focus:ring-2 focus:ring-[#0071e3] transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1 flex items-center justify-between">
                      <span>Senha de App do Google (16 caracteres)</span>
                      {settings?.smtp_pass_configured && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-bold">
                          Configurada
                        </span>
                      )}
                    </label>
                    <div className="relative">
                      <input
                        type={showSmtpPass ? 'text' : 'password'}
                        disabled={!canManageLeaders}
                        value={smtpPass}
                        onChange={(e) => setSmtpPass(e.target.value)}
                        placeholder={
                          settings?.smtp_pass_configured
                            ? '•••••••••••••••• (deixe vazio para manter)'
                            : 'xxxx xxxx xxxx xxxx'
                        }
                        className="w-full px-3.5 pr-10 py-2 rounded-xl border border-neutral-200 dark:border-white/10 bg-neutral-50/50 dark:bg-neutral-900/50 text-xs font-mono text-neutral-900 dark:text-white focus:ring-2 focus:ring-[#0071e3] transition"
                      />
                      <button
                        type="button"
                        onClick={() => setShowSmtpPass(!showSmtpPass)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 dark:hover:text-white cursor-pointer"
                      >
                        {showSmtpPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {canManageLeaders && smtpUser && (
                    <button
                      type="button"
                      disabled={testingSmtp}
                      onClick={handleTestSmtpClick}
                      className="apple-press w-full py-2 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/15 text-indigo-800 dark:text-indigo-300 border border-indigo-500/25 text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      {testingSmtp ? 'Enviando e-mail de teste...' : 'Salvar & Enviar E-mail de Teste'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {canManageLeaders && (
            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={savingSettings}
                className="apple-press px-6 py-2.5 rounded-full bg-[#0071e3] hover:bg-[#0077ed] text-white text-xs font-semibold shadow-sm transition cursor-pointer"
              >
                {savingSettings ? 'Salvando...' : 'Salvar Todas as Configurações'}
              </button>
            </div>
          )}
        </form>
      )}

      {/* ABA 3: BACKUPS & TIME MACHINE */}
      {activeTab === 'backups' && (
        <div className="space-y-6">
          {/* Ações Rápidas de Exportação */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white dark:bg-[#1c1c1e] rounded-3xl border border-black/5 dark:border-white/10 shadow-sm p-5 flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-neutral-900 dark:text-white block">
                  Planilha de Investidura (.CSV)
                </span>
                <span className="text-[11px] text-neutral-500 dark:text-neutral-400 block">
                  Lista desbravadores, percentual e requisitos completos p/ Excel.
                </span>
              </div>
              <button
                type="button"
                disabled={downloadingCsv}
                onClick={handleDownloadCsv}
                className="apple-press px-4 py-2 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 shrink-0 transition cursor-pointer shadow-xs disabled:opacity-50"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                {downloadingCsv ? 'Gerando...' : 'Exportar CSV'}
              </button>
            </div>

            {canManageLeaders && (
              <div className="bg-white dark:bg-[#1c1c1e] rounded-3xl border border-black/5 dark:border-white/10 shadow-sm p-5 flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-neutral-900 dark:text-white block">
                    Backup Geral do Clube (.JSON)
                  </span>
                  <span className="text-[11px] text-neutral-500 dark:text-neutral-400 block">
                    Exporta todas as tabelas, histórico e cartões do clube.
                  </span>
                </div>
                <button
                  type="button"
                  disabled={downloadingBackup}
                  onClick={handleDownloadBackup}
                  className="apple-press px-4 py-2 rounded-full bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-xs font-semibold flex items-center gap-1.5 shrink-0 transition cursor-pointer shadow-xs disabled:opacity-50"
                >
                  <Download className="w-3.5 h-3.5" />
                  {downloadingBackup ? 'Baixando...' : 'Baixar JSON'}
                </button>
              </div>
            )}
          </div>

          {/* Time Machine: Sistema de Backups Automáticos do Servidor */}
          {canManageLeaders && (
            <div className="bg-white dark:bg-[#1c1c1e] rounded-3xl border border-black/5 dark:border-white/10 shadow-sm p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-black/5 dark:border-white/10">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-[11px] font-bold border border-emerald-500/20">
                      <span className="w-2 h-2 rounded-full bg-[#34c759] animate-pulse" />
                      Time Machine Ativo
                    </span>
                    <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                      Pontos de Restauração SQLite
                    </h3>
                  </div>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                    Snapshots gerados automaticamente a cada 6 horas e a cada inicialização segura do servidor.
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={fetchServerBackups}
                    disabled={loadingBackups}
                    className="apple-press px-3 py-1.5 rounded-full border border-neutral-200 dark:border-white/10 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loadingBackups ? 'animate-spin text-[#0071e3]' : ''}`} />
                    Atualizar
                  </button>
                  <button
                    type="button"
                    onClick={handleCreateSnapshotNow}
                    disabled={creatingSnapshot}
                    className="apple-press px-4 py-1.5 rounded-full bg-[#0071e3] hover:bg-[#0077ed] text-white text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-xs disabled:opacity-50"
                  >
                    <HardDrive className="w-3.5 h-3.5" />
                    {creatingSnapshot ? 'Criando Snapshot...' : 'Criar Ponto Agora'}
                  </button>
                </div>
              </div>

              {/* Mensagens de Feedback */}
              {backupSuccessMsg && (
                <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{backupSuccessMsg}</span>
                </div>
              )}

              {backupErrorMsg && (
                <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-800 dark:text-rose-300 text-xs font-semibold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{backupErrorMsg}</span>
                </div>
              )}

              {/* Lista dos Pontos de Restauração */}
              <div className="rounded-2xl border border-black/5 dark:border-white/10 overflow-hidden divide-y divide-black/5 dark:divide-white/5">
                {loadingBackups ? (
                  <div className="p-8 text-center text-xs text-neutral-500">
                    Carregando snapshots do servidor...
                  </div>
                ) : serverBackups.length === 0 ? (
                  <div className="p-8 text-center text-xs text-neutral-500">
                    Nenhum ponto de restauração gravado ainda. Clique em &quot;Criar Ponto Agora&quot;.
                  </div>
                ) : (
                  serverBackups.slice(0, 10).map((b) => {
                    const dateObj = new Date(b.created_at);
                    const dateFormatted = !isNaN(dateObj)
                      ? `${dateObj.toLocaleDateString('pt-BR')} ${dateObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
                      : b.created_at;
                    const sizeKb = Math.round((b.size_bytes || 0) / 1024);

                    let triggerBadge = 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300';
                    let triggerLabel = b.trigger || 'AUTO';
                    if (b.trigger === 'STARTUP') {
                      triggerBadge = 'bg-[#0071e3]/10 text-[#0071e3] border-[#0071e3]/20';
                      triggerLabel = 'INICIALIZAÇÃO';
                    } else if (b.trigger === 'SCHEDULED') {
                      triggerBadge = 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20';
                      triggerLabel = 'ROTINA 6H';
                    } else if (b.trigger === 'MANUAL') {
                      triggerBadge = 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20';
                      triggerLabel = 'MANUAL';
                    } else if (b.trigger === 'HISTORICO') {
                      triggerBadge = 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/20';
                      triggerLabel = 'HISTÓRICO';
                    } else if (b.trigger === 'EMERGENCY_PRE_RESTORE') {
                      triggerBadge = 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20';
                      triggerLabel = 'SEGURANÇA';
                    }

                    return (
                      <div
                        key={b.filename}
                        className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-neutral-50/50 dark:hover:bg-white/[0.02] transition"
                      >
                        <div className="min-w-0 space-y-0.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${triggerBadge}`}>
                              {triggerLabel}
                            </span>
                            <span className="text-xs font-semibold text-neutral-900 dark:text-white truncate" title={b.filename}>
                              {b.filename}
                            </span>
                            <span className="text-[10px] text-neutral-400 font-mono">
                              {sizeKb} KB
                            </span>
                          </div>
                          <div className="text-[11px] text-neutral-500 dark:text-neutral-400">
                            <span>{dateFormatted}</span>
                            {b.stats && (
                              <span className="ml-2 font-medium text-neutral-600 dark:text-neutral-300">
                                • {b.stats.pathfinders} desbravadores, {b.stats.progress_records} requisitos
                              </span>
                            )}
                            {b.reason && (
                              <span className="ml-2 text-neutral-400 italic hidden md:inline">
                                ({b.reason})
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                          <button
                            type="button"
                            onClick={() => handleDownloadSqlite(b.filename)}
                            className="apple-press px-3 py-1 rounded-full border border-neutral-200 dark:border-white/10 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 text-[11px] font-semibold flex items-center gap-1 transition cursor-pointer"
                          >
                            <Download className="w-3 h-3" />
                            Baixar
                          </button>
                          <button
                            type="button"
                            onClick={() => setRestoreModalFile(b)}
                            disabled={restoringFilename === b.filename}
                            className="apple-press px-3 py-1 rounded-full bg-rose-500/10 hover:bg-rose-500/15 border border-rose-500/20 text-rose-700 dark:text-rose-400 text-[11px] font-semibold flex items-center gap-1 transition cursor-pointer disabled:opacity-50"
                          >
                            <RotateCcw className="w-3 h-3" />
                            Restaurar
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {!isTestMode() && (
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setCloneModalOpen(true)}
                    className="text-xs text-[#0071e3] hover:underline font-semibold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    Deseja importar a simulação de exemplo do Modo Teste para este Clube Oficial?
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Modal Criar / Editar Líder (Apple Sheet) */}
      {leaderModalOpen && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setLeaderModalOpen(false);
          }}
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
        >
          <div className="bg-white dark:bg-[#1c1c1e] rounded-3xl max-w-2xl w-full shadow-2xl border border-black/10 dark:border-white/15 overflow-hidden max-h-[92vh] flex flex-col">
            {/* Header Sheet */}
            <div className="px-6 py-4 border-b border-black/5 dark:border-white/10 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-neutral-900 dark:text-white">
                  {editingLeader
                    ? 'Editar Membro da Diretoria'
                    : 'Cadastrar / Convidar Líder'}
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  Configure o perfil de acesso, escopos de classe e poderes especiais.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setLeaderModalOpen(false)}
                className="w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-500 hover:text-neutral-900 dark:hover:text-white flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleLeaderSubmit} className="flex-1 overflow-hidden flex flex-col">
              <div className="p-6 space-y-4 overflow-y-auto flex-1">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                    Nome Completo do Líder *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Digite o nome completo"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-white/10 bg-neutral-50/50 dark:bg-neutral-900/50 text-xs text-neutral-900 dark:text-white focus:ring-2 focus:ring-[#0071e3] transition"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                      E-mail do Líder *
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="email@gmail.com"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-white/10 bg-neutral-50/50 dark:bg-neutral-900/50 text-xs text-neutral-900 dark:text-white focus:ring-2 focus:ring-[#0071e3] transition"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                      {editingLeader
                        ? 'Nova Senha (deixe vazio p/ manter)'
                        : 'Senha Provisória (ou use o convite)'}
                    </label>
                    <div className="relative">
                      <input
                        type={showLeaderPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder={
                          editingLeader
                            ? '••••••••'
                            : 'O próprio líder criará pelo link'
                        }
                        className="w-full px-3.5 pr-10 py-2.5 rounded-xl border border-neutral-200 dark:border-white/10 bg-neutral-50/50 dark:bg-neutral-900/50 text-xs text-neutral-900 dark:text-white focus:ring-2 focus:ring-[#0071e3] transition"
                      />
                      <button
                        type="button"
                        onClick={() => setShowLeaderPassword(!showLeaderPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 dark:hover:text-white cursor-pointer"
                      >
                        {showLeaderPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {!editingLeader && (
                  <div className="p-3.5 rounded-2xl bg-[#0071e3]/5 border border-[#0071e3]/20">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={sendInvite}
                        onChange={(e) => setSendInvite(e.target.checked)}
                        className="mt-0.5 rounded text-[#0071e3]"
                      />
                      <div>
                        <span className="text-xs font-bold text-neutral-900 dark:text-white block">
                          Enviar convite por e-mail para o líder criar a própria senha
                        </span>
                        <span className="text-[11px] text-neutral-500 dark:text-neutral-400">
                          O sistema envia o link oficial de ativação e gera um link direto compartilhável via WhatsApp.
                        </span>
                      </div>
                    </label>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                      Cargo Base (RBAC) *
                    </label>
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-white/10 bg-neutral-50/50 dark:bg-neutral-900/50 text-xs font-semibold text-neutral-900 dark:text-white"
                    >
                      <option value="DIRETOR">DIRETOR(A) — Direção Geral do Clube</option>
                      <option value="GESTOR">GESTOR(A) / TI — Administração Geral</option>
                      <option value="SECRETARIO">SECRETÁRIO(A) — Secretaria e Relatórios</option>
                      <option value="INSTRUTOR">INSTRUTOR(A) — Classes Atribuídas</option>
                      <option value="CONSELHEIRO">CONSELHEIRO(A) — Unidade Atribuída</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                      Cargo Personalizado da Diretoria (Opcional)
                    </label>
                    <input
                      type="text"
                      value={customRoleTitle}
                      onChange={(e) => setCustomRoleTitle(e.target.value)}
                      placeholder="Ex: Diretor Associado, Capelão..."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-white/10 bg-neutral-50/50 dark:bg-neutral-900/50 text-xs text-neutral-900 dark:text-white"
                    />
                  </div>
                </div>

                {/* Sugestões de Cargo Personalizado */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] text-neutral-500 dark:text-neutral-400 mr-1">
                    Sugestões:
                  </span>
                  {CUSTOM_ROLE_SUGGESTIONS.map((sug) => (
                    <button
                      key={sug}
                      type="button"
                      onClick={() => setCustomRoleTitle(sug)}
                      className={`apple-press px-2.5 py-0.5 rounded-full text-[10px] font-semibold border transition cursor-pointer ${
                        customRoleTitle === sug
                          ? 'bg-[#0071e3] text-white border-[#0071e3]'
                          : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border-black/5 dark:border-white/10'
                      }`}
                    >
                      {sug}
                    </button>
                  ))}
                  {customRoleTitle && (
                    <button
                      type="button"
                      onClick={() => setCustomRoleTitle('')}
                      className="text-[10px] text-rose-600 hover:underline font-semibold ml-1 cursor-pointer"
                    >
                      Limpar
                    </button>
                  )}
                </div>

                {/* Escopo de Unidades */}
                {!['DIRETOR', 'GESTOR', 'ADMIN'].includes(role) && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                        Unidade Principal Vinculada
                      </label>
                      <select
                        value={unitId}
                        onChange={(e) => setUnitId(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-white/10 bg-neutral-50/50 dark:bg-neutral-900/50 text-xs text-neutral-900 dark:text-white"
                      >
                        <option value="">
                          {role === 'CONSELHEIRO'
                            ? 'Selecione a unidade do conselheiro...'
                            : 'Nenhuma unidade específica (Padrão)'}
                        </option>
                        {units.map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                        Unidades Extras Liberadas
                      </label>
                      <div className="flex flex-wrap gap-1.5 p-2 rounded-xl border border-neutral-200 dark:border-white/10 bg-neutral-50/50 dark:bg-neutral-900/50">
                        {units.map((u) => {
                          const checked = u.id === unitId || assignedUnits.includes(u.id);
                          return (
                            <label
                              key={u.id}
                              className={`apple-press px-2.5 py-1 rounded-lg border text-[11px] flex items-center gap-1.5 cursor-pointer ${
                                checked
                                  ? 'bg-[#0071e3]/10 border-[#0071e3]/30 font-bold text-[#0071e3]'
                                  : 'bg-white dark:bg-neutral-800 border-black/5 dark:border-white/10 text-neutral-600 dark:text-neutral-300'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                disabled={u.id === unitId}
                                onChange={() => toggleUnitScope(u.id)}
                                className="rounded text-[#0071e3]"
                              />
                              <span>{u.name}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* Escopo de Classes */}
                {!['DIRETOR', 'GESTOR', 'ADMIN'].includes(role) && (
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                      Classes Liberadas para Avaliar:
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-36 overflow-y-auto border border-neutral-200 dark:border-white/10 rounded-2xl p-2.5 bg-neutral-50/50 dark:bg-neutral-900/50">
                      {(catalog.classes || []).map((cls) => {
                        const checked = assignedClasses.includes(cls.slug);
                        return (
                          <label
                            key={cls.slug}
                            className={`apple-press p-2 rounded-xl border text-xs flex items-center gap-2 cursor-pointer ${
                              checked
                                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-300 font-bold'
                                : 'border-black/5 dark:border-white/10 text-neutral-600 dark:text-neutral-400'
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

                {/* Poderes Extras / Permissões Granulares */}
                {!['DIRETOR', 'GESTOR', 'ADMIN'].includes(role) && (
                  <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-2.5">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                      <span className="text-xs font-bold text-neutral-900 dark:text-white">
                        Conceder Poderes Extras da Diretoria
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {EXTRA_PERMISSIONS_OPTIONS.map((opt) => {
                        const checked = Boolean(leaderPermissions[opt.key]);
                        return (
                          <label
                            key={opt.key}
                            className={`p-2.5 rounded-xl border text-xs flex items-start gap-2 cursor-pointer transition ${
                              checked
                                ? 'bg-white dark:bg-[#1c1c1e] border-amber-500/40 shadow-xs'
                                : 'bg-white/50 dark:bg-white/[0.03] border-black/5 dark:border-white/10'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => togglePermissionFlag(opt.key)}
                              className="mt-0.5 rounded text-amber-600"
                            />
                            <div>
                              <div className="font-semibold text-neutral-900 dark:text-white">
                                {opt.label}
                              </div>
                              <div className="text-[10px] text-neutral-500 dark:text-neutral-400 leading-tight mt-0.5">
                                {opt.desc}
                              </div>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="pt-1 flex items-center justify-between">
                  <label className="flex items-center gap-2.5 text-xs font-semibold text-neutral-700 dark:text-neutral-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={active}
                      onChange={(e) => setActive(e.target.checked)}
                      className="rounded text-[#0071e3]"
                    />
                    <span>Conta Ativa (pode fazer login no sistema)</span>
                  </label>
                </div>
              </div>

              {/* Footer Sheet */}
              <div className="p-4 px-6 border-t border-black/5 dark:border-white/10 flex items-center justify-between gap-3 bg-neutral-50/50 dark:bg-neutral-900/50 shrink-0">
                {editingLeader && onDeleteLeader && editingLeader.id !== currentUser?.id ? (
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
                    className="apple-press px-4 py-2 rounded-full bg-rose-500/10 hover:bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/20 text-xs font-semibold cursor-pointer"
                  >
                    Excluir Conta
                  </button>
                ) : (
                  <div />
                )}

                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setLeaderModalOpen(false)}
                    className="apple-press px-4 py-2 rounded-full border border-neutral-200 dark:border-white/10 text-xs font-semibold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={savingLeader}
                    className="apple-press px-5 py-2 rounded-full bg-[#0071e3] hover:bg-[#0077ed] text-white text-xs font-semibold shadow-sm cursor-pointer"
                  >
                    {savingLeader
                      ? 'Salvando...'
                      : editingLeader
                      ? 'Salvar Alterações'
                      : sendInvite
                      ? 'Cadastrar & Convidar'
                      : 'Salvar Líder'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Restaurar Backup (Apple Sheet) */}
      {restoreModalFile && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget && !restoringFilename) setRestoreModalFile(null);
          }}
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
        >
          <div className="bg-white dark:bg-[#1c1c1e] rounded-3xl max-w-md w-full shadow-2xl border border-black/10 dark:border-white/15 overflow-hidden p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-neutral-900 dark:text-white">
                  Restaurar Ponto de Segurança?
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  O banco de dados será revertido para o momento exato deste backup.
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-900 border border-black/5 dark:border-white/10 text-xs space-y-1.5 text-neutral-700 dark:text-neutral-300">
              <div className="font-semibold text-neutral-900 dark:text-white">
                Arquivo selecionado:
              </div>
              <div className="font-mono text-[11px] text-[#0071e3] break-all">
                {restoreModalFile.filename}
              </div>
              {restoreModalFile.stats && (
                <div className="text-[11px] text-neutral-500">
                  Contém: <strong>{restoreModalFile.stats.pathfinders} desbravadores</strong> e <strong>{restoreModalFile.stats.progress_records} requisitos</strong>.
                </div>
              )}
              <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold pt-1 border-t border-black/5 dark:border-white/5">
                🛡️ Backup de segurança automático será salvo antes de restaurar.
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setRestoreModalFile(null)}
                disabled={Boolean(restoringFilename)}
                className="apple-press px-4 py-2 rounded-full border border-neutral-200 dark:border-white/10 text-xs font-semibold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmRestore}
                disabled={Boolean(restoringFilename)}
                className="apple-press px-4 py-2 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-sm"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                {restoringFilename ? 'Restaurando...' : 'Sim, Restaurar Banco'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Clonar Simulação de Teste */}
      {cloneModalOpen && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget && !cloningTest) setCloneModalOpen(false);
          }}
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
        >
          <div className="bg-white dark:bg-[#1c1c1e] rounded-3xl max-w-md w-full shadow-2xl border border-black/10 dark:border-white/15 overflow-hidden p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#0071e3]/10 border border-[#0071e3]/20 text-[#0071e3] flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <h3 className="text-base font-bold text-neutral-900 dark:text-white">
                  Importar Simulação para Produção?
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  Copia 7 desbravadores e 213 requisitos demonstrativos para o clube oficial.
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#0071e3]/5 border border-[#0071e3]/20 text-xs space-y-2 text-neutral-700 dark:text-neutral-300 leading-relaxed">
              <p>
                Isso preencherá seu Clube Oficial com os desbravadores de exemplo em todas as 6 classes regulares e avançadas.
              </p>
              <p className="text-emerald-700 dark:text-emerald-400 font-semibold">
                Sua conta de diretoria atual será preservada integralmente e um snapshot será gerado automaticamente.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setCloneModalOpen(false)}
                disabled={cloningTest}
                className="apple-press px-4 py-2 rounded-full border border-neutral-200 dark:border-white/10 text-xs font-semibold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmCloneTest}
                disabled={cloningTest}
                className="apple-press px-4 py-2 rounded-full bg-[#0071e3] hover:bg-[#0077ed] text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-sm"
              >
                <Sparkles className="w-3.5 h-3.5" />
                {cloningTest ? 'Importando...' : 'Confirmar Importação'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
