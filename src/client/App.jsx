import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  LayoutDashboard,
  Compass,
  Grid,
  Users,
  Tent,
  Shield,
  History,
  LogOut,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import {
  apiRequest,
  getStoredToken,
  setStoredToken,
  getAssetUrl,
  isTestMode,
  getTestModeUrl,
} from './api';
import { ROLE_CONFIG, STATUS_CONFIG } from './constants';
import LoginView from './components/LoginView';
import DashboardView from './components/DashboardView';
import DemandPlanningView from './components/DemandPlanningView';
import ClassMatrixView from './components/ClassMatrixView';
import PathfindersView from './components/PathfindersView';
import EventsBatchView from './components/EventsBatchView';
import LeadersSettingsView from './components/LeadersSettingsView';
import AuditLogsView from './components/AuditLogsView';
import RequirementDetailModal from './components/RequirementDetailModal';
import BulkSignModal from './components/BulkSignModal';

const NAV_ITEMS = [
  { id: 'DASHBOARD', label: 'Painel & Fila', icon: LayoutDashboard },
  { id: 'DEMAND', label: 'Planejamento Anual', icon: Compass },
  { id: 'MATRIX', label: 'Matriz das Classes', icon: Grid },
  { id: 'PATHFINDERS', label: 'Desbravadores & Cartões', icon: Users },
  { id: 'EVENTS', label: 'Eventos & Lotes', icon: Tent },
  { id: 'LEADERS', label: 'Líderes & Clube', icon: Shield },
  { id: 'AUDIT', label: 'Auditoria & Logs', icon: History },
];

export default function App() {
  const [user, setUser] = useState(null);
  const [authChecking, setAuthChecking] = useState(true);
  const [loadingData, setLoadingData] = useState(false);
  const [activeTab, setActiveTab] = useState('DASHBOARD');
  const [toast, setToast] = useState(null);

  // Estado dos dados do banco SQLite
  const [rawBootstrap, setRawBootstrap] = useState(null);

  // Estado da navegação contextual
  const [selectedBaseSlug, setSelectedBaseSlug] = useState('amigo');
  const [selectedMatrixMode, setSelectedMatrixMode] = useState('BOTH');
  const [selectedPathfinderId, setSelectedPathfinderId] = useState(null);
  const [pendingEventDraft, setPendingEventDraft] = useState(null);

  // Estado dos Modais Globais
  const [detailModal, setDetailModal] = useState({
    isOpen: false,
    requirement: null,
    pathfinder: null,
  });
  const [bulkModal, setBulkModal] = useState({
    isOpen: false,
    requirements: [],
  });

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast((prev) => (prev?.message === message ? null : prev));
    }, 4500);
  }, []);

  // Parâmetro de convite na URL (?invite= ou ?convite_dbv=)
  const [activeInviteUrlParam, setActiveInviteUrlParam] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('invite') || params.get('convite_dbv') || null;
  });

  const fetchBootstrapData = useCallback(async (isBackground = false) => {
    if (!isBackground) setLoadingData(true);
    try {
      const data = await apiRequest('/api/bootstrap');
      setRawBootstrap(data);
    } catch (err) {
      if (err.status === 401) {
        setStoredToken(null);
        setUser(null);
      } else if (!isBackground) {
        showToast(err.message || 'Erro ao carregar dados do clube.', 'error');
      }
    } finally {
      if (!isBackground) setLoadingData(false);
    }
  }, [showToast]);

  // Polling em background a cada 45 segundos e ao focar a janela/aba
  useEffect(() => {
    if (!user) return;

    const intervalId = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchBootstrapData(true);
      }
    }, 45000);

    const onVisibilityOrFocus = () => {
      if (document.visibilityState === 'visible') {
        fetchBootstrapData(true);
      }
    };

    window.addEventListener('visibilitychange', onVisibilityOrFocus);
    window.addEventListener('focus', onVisibilityOrFocus);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener('visibilitychange', onVisibilityOrFocus);
      window.removeEventListener('focus', onVisibilityOrFocus);
    };
  }, [user, fetchBootstrapData]);

  // Verifica sessão salva ao iniciar
  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      setAuthChecking(false);
      return;
    }
    apiRequest('/api/auth/me')
      .then((res) => {
        setUser(res.user);
        if (res.user?.role === 'DESBRAVADOR') {
          setActiveTab('PATHFINDERS');
          if (res.user.pathfinder_id) {
            setSelectedPathfinderId(res.user.pathfinder_id);
          }
        }
        return fetchBootstrapData();
      })
      .catch(() => {
        setStoredToken(null);
        setUser(null);
      })
      .finally(() => setAuthChecking(false));
  }, [fetchBootstrapData]);

  const handleLoginSuccess = (token, loggedUser) => {
    setStoredToken(token);
    setUser(loggedUser);
    if (loggedUser?.role === 'DESBRAVADOR') {
      setActiveTab('PATHFINDERS');
      if (loggedUser.pathfinder_id) {
        setSelectedPathfinderId(loggedUser.pathfinder_id);
      }
    } else {
      setActiveTab('DASHBOARD');
    }
    fetchBootstrapData();
    showToast(`Bem-vindo(a), ${loggedUser.name}!`, 'success');
  };

  const handleLogout = () => {
    setStoredToken(null);
    setUser(null);
    setRawBootstrap(null);
  };

  // Normaliza e enriquece o catálogo e os registros para compatibilidade total entre componentes
  const normalizedData = useMemo(() => {
    if (!rawBootstrap) {
      return {
        catalog: {
          categories: [],
          contextTags: [],
          equivalenceGroups: [],
          classes: [],
          requirements: [],
        },
        classesMap: {},
        requirementsMap: {},
        progressMap: {},
        units: [],
        pathfinders: [],
        events: [],
        leaders: [],
        auditLogs: [],
        settings: {},
      };
    }

    const classesMap = {};
    const classes = (rawBootstrap.catalog?.classes || []).map((c) => {
      // Busca book_info do primeiro requisito da classe que tiver book_info
      const reqWithBook = (rawBootstrap.catalog?.requirements || []).find(
        (r) => r.class_slug === c.slug && r.book_info
      );
      const norm = {
        ...c,
        type: c.class_type,
        color: c.color_hex,
        logo_file: getAssetUrl(c.logo_path),
        source_url: c.official_url,
        book_info: reqWithBook?.book_info || null,
      };
      classesMap[c.slug] = norm;
      return norm;
    });

    const requirementsMap = {};
    const requirements = (rawBootstrap.catalog?.requirements || []).map((r) => {
      const subItems = (r.sub_items || []).map((s) => ({
        ...s,
        code: s.code || s.key,
        key: s.key || s.code,
      }));
      const norm = {
        ...r,
        section: `${r.section_code}. ${r.section_name}`,
        marker: r.code,
        title: r.description || r.title,
        short_title: r.title,
        sub_items: subItems,
        subitems: subItems,
      };
      requirementsMap[r.id] = norm;
      return norm;
    });

    const progressMap = {};
    for (const pr of rawBootstrap.progressRecords || []) {
      const subArr = Array.isArray(pr.completed_sub_items)
        ? pr.completed_sub_items
        : [];
      const subBoolMap = {};
      for (const k of subArr) subBoolMap[k] = true;

      progressMap[`${pr.pathfinder_id}:${pr.requirement_id}`] = {
        ...pr,
        completed_sub_items: subArr,
        completed_subitems: subBoolMap,
      };
    }

    const events = (rawBootstrap.events || []).map((ev) => ({
      ...ev,
      event_date: ev.scheduled_date,
    }));

    const settings = {
      ...(rawBootstrap.clubSettings || {}),
      club_year: String(rawBootstrap.clubSettings?.current_year || '2026'),
      allow_counselor_direct_approval: rawBootstrap.clubSettings
        ?.allow_counselor_direct_approval
        ? 'true'
        : 'false',
    };

    const auditLogs = (rawBootstrap.auditLogs || []).map((lg) => ({
      ...lg,
      description: lg.summary,
    }));

    return {
      catalog: {
        categories: rawBootstrap.catalog?.categories || [],
        contextTags: rawBootstrap.catalog?.contextTags || [],
        equivalenceGroups: rawBootstrap.catalog?.equivalenceGroups || [],
        classes,
        requirements,
      },
      classesMap,
      requirementsMap,
      progressMap,
      units: rawBootstrap.units || [],
      pathfinders: rawBootstrap.pathfinders || [],
      events,
      leaders: rawBootstrap.leaders || [],
      auditLogs,
      settings,
    };
  }, [rawBootstrap]);

  // Abre modal de detalhe de requisito aceitando (req, pf) ou (pf, req)
  const handleOpenRequirementDetail = useCallback((arg1, arg2) => {
    if (!arg1 || !arg2) return;
    const isArg1Req = Boolean(arg1.section_code || arg1.class_slug);
    const requirement = isArg1Req ? arg1 : arg2;
    const pathfinder = isArg1Req ? arg2 : arg1;
    setDetailModal({
      isOpen: true,
      requirement,
      pathfinder,
    });
  }, []);

  // Abre modal de assinatura em lote aceitando [reqs] ou req único
  const handleOpenBulkSign = useCallback((reqOrArray) => {
    const list = Array.isArray(reqOrArray) ? reqOrArray : [reqOrArray];
    setBulkModal({
      isOpen: true,
      requirements: list.filter(Boolean),
    });
  }, []);

  // Salva progresso individual
  const handleSaveProgress = async (payload) => {
    const res = await apiRequest('/api/progress/update', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    await fetchBootstrapData();
    if (res.downgradedNotice) {
      showToast(res.downgradedNotice, 'info');
    } else {
      showToast('Progresso atualizado e registrado na auditoria!');
    }
  };

  // Clique rápido na célula da matriz
  const handleQuickToggleCell = async (pf, req) => {
    const curr = normalizedData.progressMap[`${pf.id}:${req.id}`]?.status || 'PENDENTE';
    const nextStatus = STATUS_CONFIG[curr]?.nextStatus || 'APROVADO';
    try {
      await handleSaveProgress({
        pathfinder_id: pf.id,
        requirement_id: req.id,
        status: nextStatus,
      });
    } catch (err) {
      showToast(err.message || 'Sem permissão para alterar este item.', 'error');
    }
  };

  // Executa assinatura em lote (via BulkSignModal)
  const handleExecuteBulk = async (payload) => {
    const res = await apiRequest('/api/progress/bulk', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    await fetchBootstrapData();
    showToast(
      `Lote concluído: ${res.updated_count} assinatura(s) registrada(s)!`
    );
  };

  // Aprovação rápida da Fila de Conferência no Dashboard
  const handleQuickApproveBatch = async (items, reasonLabel) => {
    try {
      let count = 0;
      for (const item of items) {
        await apiRequest('/api/progress/update', {
          method: 'POST',
          body: JSON.stringify({
            pathfinder_id: item.pathfinder_id,
            requirement_id: item.requirement_id,
            status: 'APROVADO',
          }),
        });
        count += 1;
      }
      await fetchBootstrapData();
      showToast(`${count} requisito(s) vistoriado(s) e assinado(s)! (${reasonLabel})`);
    } catch (err) {
      showToast(err.message || 'Erro ao aprovar fila.', 'error');
    }
  };

  // Criar ou Editar Desbravador
  const handleSavePathfinder = async (payload, pfId) => {
    try {
      if (pfId) {
        await apiRequest(`/api/pathfinders/${pfId}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
        showToast('Cadastro e matrículas do desbravador atualizados!');
      } else {
        const res = await apiRequest('/api/pathfinders', {
          method: 'POST',
          body: JSON.stringify({
            ...payload,
            use_grouped_classes: payload.is_grouped_class,
          }),
        });
        if (res.id) setSelectedPathfinderId(res.id);
        showToast('Novo desbravador matriculado com sucesso!');
      }
      await fetchBootstrapData();
    } catch (err) {
      showToast(err.message || 'Erro ao salvar desbravador.', 'error');
      throw err;
    }
  };

  // Excluir Desbravador
  const handleDeletePathfinder = async (pfId) => {
    try {
      await apiRequest(`/api/pathfinders/${pfId}`, { method: 'DELETE' });
      if (selectedPathfinderId === pfId) setSelectedPathfinderId(null);
      await fetchBootstrapData();
      showToast('Desbravador removido com sucesso.');
    } catch (err) {
      showToast(err.message || 'Erro ao excluir desbravador.', 'error');
    }
  };

  // Criar ou Editar Unidade
  const handleSaveUnit = async (payload, unitId = null) => {
    try {
      if (unitId) {
        await apiRequest(`/api/units/${unitId}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
        await fetchBootstrapData();
        showToast(`Unidade "${payload.name}" atualizada com sucesso!`);
      } else {
        await apiRequest('/api/units', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        await fetchBootstrapData();
        showToast(`Unidade "${payload.name}" criada com sucesso!`);
      }
    } catch (err) {
      showToast(err.message || 'Erro ao salvar unidade.', 'error');
      throw err;
    }
  };

  // Gerar Link Individual ou Enviar Convite por E-mail para Desbravador
  const handleInvitePathfinder = async (pfId, payload = {}) => {
    try {
      const res = await apiRequest(`/api/pathfinders/${pfId}/invite`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      await fetchBootstrapData();
      if (payload.send_email) {
        if (res.email_sent) {
          showToast(`Convite individual enviado para ${payload.email}!`);
        } else {
          showToast(
            res.email_reason ||
              'Link individual gerado! Copie o link para enviar ao desbravador.',
            'info'
          );
        }
      }
      return res;
    } catch (err) {
      showToast(err.message || 'Erro ao gerar convite do desbravador.', 'error');
      throw err;
    }
  };

  // Excluir Unidade
  const handleDeleteUnit = async (unitId) => {
    try {
      await apiRequest(`/api/units/${unitId}`, { method: 'DELETE' });
      await fetchBootstrapData();
      showToast('Unidade removida com sucesso.');
    } catch (err) {
      showToast(err.message || 'Erro ao excluir unidade.', 'error');
    }
  };

  // Criar Evento
  const handleCreateEvent = async (payload) => {
    try {
      await apiRequest('/api/events', {
        method: 'POST',
        body: JSON.stringify({
          title: payload.title,
          description: payload.description,
          event_type: payload.event_type,
          scheduled_date: payload.event_date || payload.scheduled_date,
          requirement_ids: payload.requirement_ids,
        }),
      });
      await fetchBootstrapData();
      showToast(`Evento "${payload.title}" agendado com sucesso!`);
    } catch (err) {
      showToast(err.message || 'Erro ao criar evento.', 'error');
      throw err;
    }
  };

  // Excluir Evento
  const handleDeleteEvent = async (eventId) => {
    try {
      await apiRequest(`/api/events/${eventId}`, { method: 'DELETE' });
      await fetchBootstrapData();
      showToast('Evento removido com sucesso.');
    } catch (err) {
      showToast(err.message || 'Erro ao excluir evento.', 'error');
    }
  };

  // Executar Evento em Lote
  const handleExecuteEvent = async (eventId, payload) => {
    try {
      const res = await apiRequest(`/api/events/${eventId}/execute`, {
        method: 'POST',
        body: JSON.stringify({
          attendee_ids: payload.pathfinder_ids,
          target_status: payload.status,
          notes: payload.notes,
        }),
      });
      await fetchBootstrapData();
      showToast(
        `Evento executado! ${res.updated_records} requisito(s) assinado(s) em lote.`
      );
    } catch (err) {
      showToast(err.message || 'Erro ao executar lote do evento.', 'error');
      throw err;
    }
  };

  // Salvar Líder
  const handleSaveLeader = async (payload, leaderId) => {
    try {
      let res = null;
      if (leaderId) {
        res = await apiRequest(`/api/leaders/${leaderId}`, {
          method: 'PUT',
          body: JSON.stringify({
            ...payload,
            new_password: payload.password,
          }),
        });
        showToast('Permissões do líder atualizadas com sucesso!');
      } else {
        res = await apiRequest('/api/leaders', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        if (res.email_sent) {
          showToast(
            `Líder cadastrado e e-mail de convite enviado para ${payload.email}!`
          );
        } else if (res.invite_url) {
          showToast(
            'Líder cadastrado! Link de convite gerado na lista abaixo (configure o Gmail SMTP para envio automático).'
          );
        } else {
          showToast('Novo líder cadastrado com sucesso!');
        }
      }
      await fetchBootstrapData();
      return res;
    } catch (err) {
      showToast(err.message || 'Erro ao salvar líder.', 'error');
      throw err;
    }
  };

  // Excluir Líder
  const handleDeleteLeader = async (leaderId) => {
    try {
      await apiRequest(`/api/leaders/${leaderId}`, { method: 'DELETE' });
      await fetchBootstrapData();
      showToast('Líder removido do clube.');
    } catch (err) {
      showToast(err.message || 'Erro ao remover líder.', 'error');
    }
  };

  // Enviar ou Reenviar Convite por E-mail para um Líder
  const handleSendLeaderInvite = async (leaderId) => {
    try {
      const res = await apiRequest(`/api/leaders/${leaderId}/send-invite`, {
        method: 'POST',
      });
      if (res.email_sent) {
        showToast('E-mail de convite enviado com sucesso para o líder!');
      } else {
        showToast(
          res.email_reason ||
            'Link de convite gerado! Copie o link abaixo ou configure o Gmail SMTP.',
          'info'
        );
      }
      await fetchBootstrapData();
      return res;
    } catch (err) {
      showToast(err.message || 'Erro ao gerar/enviar convite.', 'error');
      throw err;
    }
  };

  // Salvar Configurações do Clube + Gmail SMTP + Google OAuth
  const handleSaveSettings = async (payload) => {
    try {
      await apiRequest('/api/settings', {
        method: 'PUT',
        body: JSON.stringify({
          club_name: payload.club_name,
          club_region: payload.club_region,
          current_year: Number(payload.club_year || 2026),
          investiture_date: payload.investiture_date,
          allow_counselor_direct_approval:
            payload.allow_counselor_direct_approval === 'true',
          demo_mode_enabled: payload.demo_mode_enabled,
          smtp_user: payload.smtp_user,
          smtp_pass: payload.smtp_pass,
          smtp_from_name: payload.smtp_from_name,
          google_client_id: payload.google_client_id,
        }),
      });
      await fetchBootstrapData();
      showToast('Configurações do clube e de e-mail salvas com sucesso!');
    } catch (err) {
      showToast(err.message || 'Erro ao salvar configurações.', 'error');
      throw err;
    }
  };

  // Testar Envio de E-mail Gmail SMTP
  const handleTestSmtp = async (toEmail) => {
    try {
      const res = await apiRequest('/api/settings/test-smtp', {
        method: 'POST',
        body: JSON.stringify({ to_email: toEmail }),
      });
      showToast(res.message || 'E-mail de teste enviado com sucesso!');
    } catch (err) {
      showToast(err.message || 'Falha ao enviar e-mail de teste.', 'error');
    }
  };

  // Reverter Log ou Lote de Auditoria
  const handleRevertLog = async (logId, revertBatch = false) => {
    try {
      const res = await apiRequest(`/api/audit/${logId}/revert`, {
        method: 'POST',
        body: JSON.stringify({ revert_batch: revertBatch }),
      });
      await fetchBootstrapData();
      showToast(
        `Reversão concluída: ${res.reverted_count} registro(s) restaurado(s) ao estado anterior!`
      );
    } catch (err) {
      showToast(err.message || 'Erro ao reverter registro.', 'error');
    }
  };

  if (authChecking) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
        <div className="flex items-center gap-3 text-sm font-bold">
          <RefreshCw className="w-5 h-5 animate-spin text-amber-400" />
          Carregando Sistema de Gestão de Classes...
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginView onLoginSuccess={handleLoginSuccess} />;
  }

  const roleCfg = ROLE_CONFIG[user.role] || ROLE_CONFIG.INSTRUTOR;
  const activeDetailProgress =
    detailModal.pathfinder && detailModal.requirement
      ? normalizedData.progressMap[
          `${detailModal.pathfinder.id}:${detailModal.requirement.id}`
        ]
      : null;

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col">
      {/* Banner de Identificação de Ambiente (Oficial vs Teste) */}
      {isTestMode() ? (
        <div className="bg-amber-400 text-slate-950 px-4 py-2 text-xs font-extrabold flex flex-wrap items-center justify-between gap-2 border-b border-amber-500 no-print">
          <div className="flex items-center gap-2">
            <span className="px-1.5 py-0.5 rounded bg-slate-950 text-amber-400 font-black text-[10px]">
              MODO TESTE (?teste=1)
            </span>
            <span>
              Exibindo <strong>Ambiente de Testes e Simulação</strong> (7 desbravadores, 213 requisitos). O banco oficial está 100% isolado e protegido.
            </span>
          </div>
          <a
            href={getTestModeUrl(false)}
            className="px-3 py-1 rounded-lg bg-slate-950 text-white hover:bg-slate-800 transition shrink-0 font-bold"
          >
            Ir para o Clube Oficial de Produção →
          </a>
        </div>
      ) : (
        <div className="bg-slate-900 text-slate-300 px-4 py-1.5 text-xs font-medium flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 no-print">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>
              <strong className="text-white">Clube Oficial:</strong> {normalizedData.settings?.club_name || 'Clube de Desbravadores'} — Sistema com backup automático contínuo ativo.
            </span>
          </div>
          <a
            href={getTestModeUrl(true)}
            className="text-[11px] font-bold text-amber-300 hover:text-amber-200 transition shrink-0 underline flex items-center gap-1"
          >
            🧪 Acessar Ambiente de Demonstração / Teste (?teste=1) →
          </a>
        </div>
      )}

      {/* Aviso de Link de Convite Acessado com Usuário Logado */}
      {user && activeInviteUrlParam && (
        <div className="bg-gradient-to-r from-indigo-900 via-blue-900 to-slate-900 text-white px-4 py-3 text-xs font-semibold flex flex-wrap items-center justify-between gap-3 border-b border-indigo-700 shadow-md no-print animate-fade-in">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-300 shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <span className="font-extrabold text-indigo-200">Link de Convite Detectado: </span>
              Você acessou um link de convite oficial, mas este navegador já está conectado como <strong>{user.name}</strong> ({user.email}).
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleLogout}
              className="px-3.5 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sair e Criar Conta do Convite
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveInviteUrlParam(null);
                const url = new URL(window.location.href);
                url.searchParams.delete('invite');
                url.searchParams.delete('convite_dbv');
                window.history.replaceState({}, '', url.toString());
              }}
              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium transition cursor-pointer"
            >
              Permanecer como {user.name.split(' ')[0]}
            </button>
          </div>
        </div>
      )}

      {/* Toast Flutuante */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 max-w-md animate-fade-in no-print">
          <div
            className={`px-4 py-3 rounded-2xl shadow-xl border flex items-center gap-2.5 text-xs font-bold ${
              toast.type === 'error'
                ? 'bg-rose-900 text-white border-rose-700'
                : 'bg-slate-900 text-white border-slate-700'
            }`}
          >
            {toast.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            )}
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Barra de Topo Institucional */}
      <header className="bg-slate-950 text-white border-b border-slate-800 sticky top-0 z-30 no-print">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img
              src={getAssetUrl('/data/cartoes-oficiais/logos/logo_guia.png')}
              alt="Desbravadores"
              className="w-9 h-9 object-contain bg-white/10 p-1 rounded-xl"
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm sm:text-base tracking-tight">
                  SGC Classes • Desbravadores
                </span>
                <span className="hidden md:inline-block text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-400/30">
                  12 Classes Oficiais DSA
                </span>
              </div>
              <div className="text-[11px] text-slate-400 hidden sm:block">
                {normalizedData.settings?.club_name || 'Clube de Desbravadores'}
              </div>
            </div>
          </div>

          {/* Perfil Logado + Ambiente + Atualizar + Sair */}
          <div className="flex items-center gap-2 sm:gap-3">
            {isTestMode() ? (
              <a
                href={getTestModeUrl(false)}
                className="px-2.5 py-1 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 text-[11px] font-extrabold flex items-center gap-1 shadow-xs transition"
                title="Você está no Ambiente de Testes. Clique para ir ao Clube Oficial."
              >
                <span>🧪 Modo Teste</span>
              </a>
            ) : (
              <a
                href={getTestModeUrl(true)}
                className="px-2.5 py-1 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 text-emerald-400 border border-emerald-700/60 text-[11px] font-bold flex items-center gap-1 transition"
                title="Você está no Clube Oficial. Clique para abrir o Ambiente de Teste."
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                <span>Clube Oficial</span>
              </a>
            )}

            <button
              onClick={fetchBootstrapData}
              disabled={loadingData}
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 cursor-pointer"
              title="Sincronizar dados"
            >
              <RefreshCw
                className={`w-4 h-4 ${loadingData ? 'animate-spin text-amber-400' : ''}`}
              />
            </button>

            <div className="flex items-center gap-2.5 bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5">
              <div className="text-right">
                <div className="text-xs font-bold text-white leading-tight">
                  {user.name}
                </div>
                <div className="text-[10px] text-amber-300 font-semibold">
                  {roleCfg.label}
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="p-1.5 rounded-lg hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 transition cursor-pointer"
                title="Trocar de Líder / Sair"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Sub-barra de Navegação por Abas */}
        <div className="bg-slate-900/90 border-t border-slate-800/80">
          <div className="max-w-[1440px] mx-auto px-4 sm:px-6 flex items-center gap-1 overflow-x-auto py-1.5">
            {(user.role === 'DESBRAVADOR'
              ? [{ id: 'PATHFINDERS', label: 'Meu Cartão de Classes', icon: Users }]
              : NAV_ITEMS
            ).map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 whitespace-nowrap transition cursor-pointer ${
                    isActive
                      ? 'bg-amber-500 text-slate-950 shadow-xs'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="flex-1 max-w-[1440px] w-full mx-auto px-4 sm:px-6 py-6">
        {activeTab === 'DASHBOARD' && user.role !== 'DESBRAVADOR' && (
          <DashboardView
            catalog={normalizedData.catalog}
            pathfinders={normalizedData.pathfinders}
            units={normalizedData.units}
            progressMap={normalizedData.progressMap}
            classesMap={normalizedData.classesMap}
            requirementsMap={normalizedData.requirementsMap}
            events={normalizedData.events}
            settings={normalizedData.settings}
            currentUser={user}
            onNavigate={setActiveTab}
            onSelectClassMatrix={(baseSlug, mode) => {
              setSelectedBaseSlug(baseSlug);
              setSelectedMatrixMode(mode || 'BOTH');
              setActiveTab('MATRIX');
            }}
            onSelectPathfinderCard={(pfId) => {
              setSelectedPathfinderId(pfId);
              setActiveTab('PATHFINDERS');
            }}
            onOpenRequirementDetail={handleOpenRequirementDetail}
            onQuickApproveBatch={handleQuickApproveBatch}
          />
        )}

        {activeTab === 'DEMAND' && user.role !== 'DESBRAVADOR' && (
          <DemandPlanningView
            catalog={normalizedData.catalog}
            pathfinders={normalizedData.pathfinders}
            units={normalizedData.units}
            progressMap={normalizedData.progressMap}
            classesMap={normalizedData.classesMap}
            onOpenRequirementDetail={handleOpenRequirementDetail}
            onOpenBulkSign={handleOpenBulkSign}
            onCreateEventFromDemand={(draft) => {
              setPendingEventDraft({
                title: draft.title,
                description: draft.description,
                event_type: 'ACAMPAMENTO',
                event_date: new Date().toISOString().slice(0, 10),
                requirement_ids: (draft.requirements || []).map((r) => r.id),
              });
              setActiveTab('EVENTS');
            }}
          />
        )}

        {activeTab === 'MATRIX' && user.role !== 'DESBRAVADOR' && (
          <ClassMatrixView
            catalog={normalizedData.catalog}
            pathfinders={normalizedData.pathfinders}
            units={normalizedData.units}
            progressMap={normalizedData.progressMap}
            classesMap={normalizedData.classesMap}
            selectedBaseSlug={selectedBaseSlug}
            onSelectBaseSlug={setSelectedBaseSlug}
            selectedMode={selectedMatrixMode}
            onSelectMode={setSelectedMatrixMode}
            currentUser={user}
            settings={normalizedData.settings}
            onOpenRequirementDetail={handleOpenRequirementDetail}
            onOpenBulkSign={handleOpenBulkSign}
            onQuickToggleCell={handleQuickToggleCell}
            onSelectPathfinderCard={(pfId) => {
              setSelectedPathfinderId(pfId);
              setActiveTab('PATHFINDERS');
            }}
          />
        )}

        {(activeTab === 'PATHFINDERS' || user.role === 'DESBRAVADOR') && (
          <PathfindersView
            catalog={normalizedData.catalog}
            pathfinders={normalizedData.pathfinders}
            units={normalizedData.units}
            progressMap={normalizedData.progressMap}
            classesMap={normalizedData.classesMap}
            selectedPathfinderId={selectedPathfinderId}
            onSelectPathfinderId={setSelectedPathfinderId}
            currentUser={user}
            onSavePathfinder={handleSavePathfinder}
            onDeletePathfinder={handleDeletePathfinder}
            onSaveUnit={handleSaveUnit}
            onDeleteUnit={handleDeleteUnit}
            onInvitePathfinder={handleInvitePathfinder}
            onOpenRequirementDetail={handleOpenRequirementDetail}
          />
        )}

        {activeTab === 'EVENTS' && user.role !== 'DESBRAVADOR' && (
          <EventsBatchView
            catalog={normalizedData.catalog}
            events={normalizedData.events}
            pathfinders={normalizedData.pathfinders}
            classesMap={normalizedData.classesMap}
            requirementsMap={normalizedData.requirementsMap}
            progressMap={normalizedData.progressMap}
            pendingEventDraft={pendingEventDraft}
            onClearEventDraft={() => setPendingEventDraft(null)}
            onCreateEvent={handleCreateEvent}
            onDeleteEvent={handleDeleteEvent}
            onExecuteEvent={handleExecuteEvent}
          />
        )}

        {activeTab === 'LEADERS' && user.role !== 'DESBRAVADOR' && (
          <LeadersSettingsView
            catalog={normalizedData.catalog}
            leaders={normalizedData.leaders}
            units={normalizedData.units}
            settings={normalizedData.settings}
            currentUser={user}
            onSaveLeader={handleSaveLeader}
            onDeleteLeader={handleDeleteLeader}
            onSendLeaderInvite={handleSendLeaderInvite}
            onSaveSettings={handleSaveSettings}
            onTestSmtp={handleTestSmtp}
          />
        )}

        {activeTab === 'AUDIT' && user.role !== 'DESBRAVADOR' && (
          <AuditLogsView
            auditLogs={normalizedData.auditLogs}
            leaders={normalizedData.leaders}
            currentUser={user}
            onRevertLog={handleRevertLog}
          />
        )}
      </main>

      {/* Modal Global: Detalhe / Subitens / Evidências do Requisito */}
      <RequirementDetailModal
        isOpen={detailModal.isOpen}
        onClose={() =>
          setDetailModal({ isOpen: false, requirement: null, pathfinder: null })
        }
        requirement={detailModal.requirement}
        classInfo={
          detailModal.requirement
            ? normalizedData.classesMap[detailModal.requirement.class_slug]
            : null
        }
        pathfinder={detailModal.pathfinder}
        progressRecord={activeDetailProgress}
        currentUser={user}
        onSaveProgress={handleSaveProgress}
        onOpenBulkForRequirement={(req) => {
          setDetailModal({ isOpen: false, requirement: null, pathfinder: null });
          handleOpenBulkSign([req]);
        }}
      />

      {/* Modal Global: Assinatura em Lote */}
      <BulkSignModal
        isOpen={bulkModal.isOpen}
        onClose={() => setBulkModal({ isOpen: false, requirements: [] })}
        requirements={bulkModal.requirements}
        pathfinders={normalizedData.pathfinders}
        progressMap={normalizedData.progressMap}
        classesMap={normalizedData.classesMap}
        onExecuteBulk={handleExecuteBulk}
      />
    </div>
  );
}
