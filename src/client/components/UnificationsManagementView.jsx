import React, { useState, useEffect, useMemo } from 'react';
import {
  GitMerge,
  Layers,
  Sparkles,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Shield,
  BookOpen,
  Tent,
  Trees,
  Compass,
  Users,
  Award,
  Activity,
  HeartHandshake,
  RotateCcw,
  Plus,
  Edit2,
  Trash2,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Info,
  Calendar,
  Zap,
  Check,
  X,
  CheckCheck,
} from 'lucide-react';
import { apiRequest } from '../api';
import { useModalDismiss } from '../utils/modalStack';

const CLASS_COLORS = {
  Amigo: 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800',
  'Amigo da Natureza': 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800',
  Companheiro: 'bg-red-100 text-red-800 border-red-300 dark:bg-red-950/60 dark:text-red-300 dark:border-red-800',
  'Companheiro de Excursionismo': 'bg-red-100 text-red-800 border-red-300 dark:bg-red-950/60 dark:text-red-300 dark:border-red-800',
  Pesquisador: 'bg-green-100 text-green-800 border-green-300 dark:bg-green-950/60 dark:text-green-300 dark:border-green-800',
  'Pesquisador de Campo': 'bg-green-100 text-green-800 border-green-300 dark:bg-green-950/60 dark:text-green-300 dark:border-green-800',
  Pioneiro: 'bg-slate-200 text-slate-800 border-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700',
  'Pioneiro de Novas Fronteiras': 'bg-slate-200 text-slate-800 border-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700',
  Excursionista: 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800',
  'Excursionista na Mata': 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800',
  Guia: 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800',
  'Guia de Exploração': 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800',
};

const LEVEL_BADGES = {
  N1: {
    label: '🟢 Nível 1: Equivalência Direta (100% Iguais)',
    short: '🟢 N1: Equivalência Direta',
    color: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/30 dark:text-emerald-400',
    desc: 'Baixa automática bidirecional nas classes participantes.',
  },
  N2: {
    label: '🔵 Nível 2: Escalonamento Hierárquico',
    short: '🔵 N2: Hierárquico',
    color: 'bg-blue-500/10 text-blue-700 border-blue-500/30 dark:text-blue-400',
    desc: 'Baixa em cascata descendente (>=). Meta maior engloba as menores.',
  },
  N3: {
    label: '🟣 Nível 3: Absorção por Especialidade / Texto',
    short: '🟣 N3: Especialidade',
    color: 'bg-purple-500/10 text-purple-700 border-purple-500/30 dark:text-purple-400',
    desc: 'Completar a especialidade gatilho resolve os requisitos práticos.',
  },
  N4: {
    label: '🟡 Nível 4: Agrupamento de Turma / Evento Conjunto',
    short: '🟡 N4: Evento Conjunto',
    color: 'bg-amber-500/10 text-amber-700 border-amber-500/30 dark:text-amber-400',
    desc: 'Mesma aula ou evento, com validação individual da entrega.',
  },
};

export default function UnificationsManagementView({ user, catalog, pathfinders, onRefreshCatalog }) {
  const [data, setData] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('unifications'); // 'unifications' | 'absorptions' | 'isolated' | 'events' | 'crossings'
  const [scenario, setScenario] = useState('strict'); // 'strict' | 'integrated'
  const [levelFilter, setLevelFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCards, setExpandedCards] = useState({});
  const [editingUnif, setEditingUnif] = useState(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // Carrega catálogo de unificações e recomendações
  const loadData = async () => {
    try {
      setLoading(true);
      const [unifRes, absRes] = await Promise.all([
        apiRequest('/api/unifications'),
        apiRequest('/api/unifications/absorption-recommendations').catch(() => ({ recommendations: [] })),
      ]);
      setData(unifRes);
      setScenario(unifRes.scenario || 'strict');
      setRecommendations(absRes.recommendations || []);
    } catch (err) {
      console.error('Erro ao carregar dados de unificação:', err);
      showToast('Erro ao carregar unificações.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const showToast = (msg, type = 'success') => {
    setToastMessage({ msg, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const toggleCard = (code) => {
    setExpandedCards((prev) => ({ ...prev, [code]: !prev[code] }));
  };

  // Alterna ativação de uma unificação
  const handleToggleUnification = async (unif) => {
    try {
      setActionLoading(true);
      const updated = {
        ...unif,
        enabled: !unif.enabled,
      };
      await apiRequest(`/api/unifications/${unif.code}`, {
        method: 'PUT',
        body: JSON.stringify(updated),
      });
      showToast(`Unificação ${unif.code} ${updated.enabled ? 'ativada' : 'desativada'} com sucesso.`);
      await loadData();
      if (onRefreshCatalog) onRefreshCatalog();
    } catch (err) {
      showToast(err.message || 'Erro ao alterar status da unificação', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Restaura unificações para o padrão oficial da DSA
  const handleResetToOfficial = async () => {
    if (!window.confirm('Tem certeza de que deseja restaurar as unificações para o padrão oficial da DSA (40 Atividades)? Quaisquer personalizações locais serão redefinidas.')) {
      return;
    }
    try {
      setActionLoading(true);
      await apiRequest('/api/unifications/reset', { method: 'POST' });
      showToast('Unificações restauradas com sucesso para o padrão oficial da DSA.');
      await loadData();
      if (onRefreshCatalog) onRefreshCatalog();
    } catch (err) {
      showToast(err.message || 'Erro ao restaurar unificações', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Aprova uma absorção individual
  const handleApproveSingleAbsorption = async (rec) => {
    try {
      setActionLoading(true);
      await apiRequest('/api/unifications/apply-absorptions', {
        method: 'POST',
        body: JSON.stringify({ approvals: [rec] }),
      });
      showToast(`Requisito ${rec.targetRequirementCode} aprovado por absorção para ${rec.pathfinderName}!`);
      await loadData();
      if (onRefreshCatalog) onRefreshCatalog();
    } catch (err) {
      showToast(err.message || 'Erro ao aprovar por absorção', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Aprova todas as recomendações de absorção em lote
  const handleApproveAllAbsorptions = async () => {
    if (recommendations.length === 0) return;
    if (!window.confirm(`Deseja aprovar todas as ${recommendations.length} recomendações de absorção identificadas para o Clube?`)) {
      return;
    }
    try {
      setActionLoading(true);
      const res = await apiRequest('/api/unifications/apply-absorptions', {
        method: 'POST',
        body: JSON.stringify({ approvals: recommendations }),
      });
      showToast(`Sucesso! ${res.count || recommendations.length} requisito(s) aprovados por absorção.`);
      await loadData();
      if (onRefreshCatalog) onRefreshCatalog();
    } catch (err) {
      showToast(err.message || 'Erro ao aprovar lote de absorções', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Filtra as unificações
  const filteredUnifications = useMemo(() => {
    if (!data?.unifications) return [];
    return data.unifications.filter((u) => {
      // Filtro de nível
      if (levelFilter !== 'ALL') {
        if (!u.levels?.includes(levelFilter)) return false;
      }
      // Filtro de categoria
      if (categoryFilter !== 'ALL' && u.category !== categoryFilter) {
        return false;
      }
      // Filtro de busca
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesCode = u.code?.toLowerCase().includes(query);
        const matchesTitle = u.title?.toLowerCase().includes(query);
        const matchesPed = u.pedagogicalDetails?.toLowerCase().includes(query);
        const matchesReq = (u.requirements || []).some(
          (r) =>
            r.code?.toLowerCase().includes(query) ||
            r.text?.toLowerCase().includes(query) ||
            r.class_name?.toLowerCase().includes(query)
        );
        const matchesSpec = (u.specialties || []).some((s) => s.toLowerCase().includes(query));
        if (!matchesCode && !matchesTitle && !matchesPed && !matchesReq && !matchesSpec) {
          return false;
        }
      }
      return true;
    });
  }, [data, levelFilter, categoryFilter, searchQuery]);

  // Contagem de recomendações por tipo
  const recStats = useMemo(() => {
    const total = recommendations.length;
    const pfs = new Set(recommendations.map((r) => r.pathfinderId)).size;
    const hierarchical = recommendations.filter((r) => r.ruleType === 'HIERARCHICAL_SCALE').length;
    const specialty = recommendations.filter((r) => r.ruleType === 'SPECIALTY_ABSORPTION').length;
    const direct = recommendations.filter((r) => r.ruleType === 'AUTO_EQUAL').length;
    return { total, pfs, hierarchical, specialty, direct };
  }, [recommendations]);

  return (
    <div className="space-y-6">
      {/* Toast Feedback */}
      {toastMessage && (
        <div
          className={`fixed bottom-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl border text-sm font-medium transition-all ${
            toastMessage.type === 'error'
              ? 'bg-rose-900/90 text-rose-100 border-rose-700'
              : 'bg-emerald-900/90 text-emerald-100 border-emerald-700'
          }`}
        >
          {toastMessage.type === 'error' ? <AlertTriangle className="w-5 h-5 shrink-0" /> : <CheckCircle2 className="w-5 h-5 shrink-0" />}
          <span>{toastMessage.msg}</span>
        </div>
      )}

      {/* Cabeçalho com Métricas Executivas */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-xl relative overflow-hidden border border-blue-800/50">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-200 border border-blue-400/30 text-xs font-semibold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-blue-300" />
              Especificação Oficial DSA • 212 Requisitos
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Gerenciamento de Unificações & Equivalências
            </h1>
            <p className="text-blue-100/90 text-sm sm:text-base leading-relaxed">
              Organização estratégica dos 212 requisitos oficiais em <strong>40 Atividades Unificadas</strong> com 4 níveis técnicos (Equivalência Direta, Escalonamento Hierárquico, Absorção por Especialidade e Evento Conjunto), reduzindo até <strong>64,6% de esforço no calendário</strong> e automatizando aprovações por absorção.
            </p>
          </div>

          {/* Seletor de Cenário */}
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/20 flex flex-col gap-2 shrink-0">
            <span className="text-xs font-semibold text-blue-200 uppercase tracking-wider">
              Cenário de Planejamento:
            </span>
            <div className="flex items-center bg-black/30 rounded-lg p-1 border border-white/10">
              <button
                type="button"
                onClick={() => setScenario('strict')}
                className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                  scenario === 'strict'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-blue-200 hover:text-white'
                }`}
              >
                Cenário 1: Estrito (75 Unidades)
              </button>
              <button
                type="button"
                onClick={() => setScenario('integrated')}
                className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                  scenario === 'integrated'
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'text-blue-200 hover:text-white'
                }`}
              >
                Cenário 2: Integrado (55 Unidades)
              </button>
            </div>
            <span className="text-[11px] text-blue-200/80">
              {scenario === 'strict'
                ? '✓ 40 unificações estritas com atividades conjuntas integrais (-64,6% esforço).'
                : '✓ 41 atividades integradas com sobreposições bíblicas e especialidades (-74,1% esforço).'}
            </span>
          </div>
        </div>

        {/* Grade de Estatísticas */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-6 pt-6 border-t border-white/10">
          <div className="bg-white/5 rounded-xl p-3 border border-white/10">
            <div className="text-2xl font-black text-white">212</div>
            <div className="text-xs text-blue-200 font-medium">Requisitos Oficiais</div>
          </div>
          <div className="bg-white/5 rounded-xl p-3 border border-white/10">
            <div className="text-2xl font-black text-emerald-400">177 (83,5%)</div>
            <div className="text-xs text-blue-200 font-medium">Requisitos Unificados</div>
          </div>
          <div className="bg-white/5 rounded-xl p-3 border border-white/10">
            <div className="text-2xl font-black text-blue-300">40 Atividades</div>
            <div className="text-xs text-blue-200 font-medium">Unidades Finais no Calendário</div>
          </div>
          <div className="bg-white/5 rounded-xl p-3 border border-white/10">
            <div className="text-2xl font-black text-amber-300">35 Itens</div>
            <div className="text-xs text-blue-200 font-medium">Requisitos Exclusivos / Isolados</div>
          </div>
        </div>
      </div>

      {/* Navegação por Abas */}
      <div className="flex items-center gap-2 overflow-x-auto border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('unifications')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm whitespace-nowrap transition-all ${
            activeTab === 'unifications'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <GitMerge className="w-4 h-4" />
          40 Atividades Unificadas
          <span className="ml-1.5 px-2 py-0.5 rounded-full text-xs bg-white/20 text-white">
            {filteredUnifications.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('absorptions')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm whitespace-nowrap transition-all ${
            activeTab === 'absorptions'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Zap className="w-4 h-4 text-amber-300" />
          Recomendações de Absorção
          {recStats.total > 0 && (
            <span className="ml-1.5 px-2 py-0.5 rounded-full text-xs bg-amber-400 text-slate-950 font-black animate-pulse">
              {recStats.total}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('isolated')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm whitespace-nowrap transition-all ${
            activeTab === 'isolated'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Shield className="w-4 h-4" />
          35 Requisitos Exclusivos
          <span className="ml-1.5 px-2 py-0.5 rounded-full text-xs bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200">
            35
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('events')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm whitespace-nowrap transition-all ${
            activeTab === 'events'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Calendar className="w-4 h-4" />
          9 Eventos-Âncora
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('crossings')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm whitespace-nowrap transition-all ${
            activeTab === 'crossings'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          Conexões Bíblicas & Especialidades
        </button>
      </div>

      {/* ABA 1: 40 ATIVIDADES UNIFICADAS */}
      {activeTab === 'unifications' && (
        <div className="space-y-4">
          {/* Barra de Ferramentas e Filtros */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2 flex-1">
              {/* Campo de Busca */}
              <div className="relative min-w-[240px] flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar por código, título, requisito ou especialidade..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Filtro de Nível */}
              <select
                value={levelFilter}
                onChange={(e) => setLevelFilter(e.target.value)}
                className="px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium"
              >
                <option value="ALL">Todos os Níveis Técnicos</option>
                <option value="N1">🟢 Nível 1: Equivalência Direta (100% Iguais)</option>
                <option value="N2">🔵 Nível 2: Escalonamento Hierárquico</option>
                <option value="N3">🟣 Nível 3: Absorção por Especialidade</option>
                <option value="N4">🟡 Nível 4: Evento Conjunto</option>
              </select>

              {/* Filtro de Categoria */}
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium"
              >
                <option value="ALL">Todas as Áreas</option>
                <option value="GERAIS">Ideais e Gerais (U-01 a U-05)</option>
                <option value="ESPIRITUAL">Descoberta Espiritual (U-06 a U-13)</option>
                <option value="SERVICO">Comunidade e Missão (U-14 a U-18)</option>
                <option value="RELACIONAMENTOS">Amizade e Civismo (U-19 a U-22)</option>
                <option value="SAUDE">Saúde e Aptidão Física (U-23 a U-26)</option>
                <option value="LIDERANCA">Organização e Igreja (U-27 a U-31)</option>
                <option value="NATUREZA">Estudo da Natureza (U-32 a U-33)</option>
                <option value="ACAMPAMENTO">Caminhada, Fogueiras e Acampamento (U-34 a U-38)</option>
                <option value="ESPECIALIDADES">Oficinas de Especialidades (U-39 a U-40)</option>
              </select>
            </div>

            {/* Ações Globais */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleResetToOfficial}
                disabled={actionLoading}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                title="Restaura unificações para o padrão oficial da DSA"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Padrão DSA
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditingUnif({
                    code: `U-${String(data?.unifications?.length + 1 || 41).padStart(2, '0')}`,
                    title: '',
                    description: '',
                    levelText: '🟢 Nível 1: Equivalência Direta (100% Iguais)',
                    levels: ['N1'],
                    ruleCode: 'AUTO_EQUAL',
                    scenario: 'strict',
                    enabled: true,
                    requirementIds: [],
                    isCustom: true,
                  });
                  setIsCreatingNew(true);
                }}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-sm"
              >
                <Plus className="w-4 h-4" />
                Nova Unificação
              </button>
            </div>
          </div>

          {/* Lista de Cards de Unificação */}
          <div className="space-y-3">
            {filteredUnifications.map((u) => {
              const isExpanded = !!expandedCards[u.code];
              const isEnabled = u.enabled !== false;
              const primaryLevel = u.levels?.[0] || 'N1';
              const badge = LEVEL_BADGES[primaryLevel] || LEVEL_BADGES.N1;

              return (
                <div
                  key={u.code}
                  className={`bg-white dark:bg-slate-900 rounded-xl border transition-all ${
                    isEnabled
                      ? 'border-slate-200 dark:border-slate-800 shadow-sm hover:border-blue-400 dark:hover:border-blue-600'
                      : 'border-slate-200/60 dark:border-slate-800/60 opacity-60 bg-slate-50/50 dark:bg-slate-900/50'
                  }`}
                >
                  <div className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      {/* Código da Atividade */}
                      <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-black text-sm flex items-center justify-center shrink-0 border border-blue-200 dark:border-blue-800">
                        {u.code}
                      </div>

                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100 truncate">
                            {u.title}
                          </h3>
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${badge.color}`}>
                            {badge.short}
                          </span>
                          {u.requirementsCount > 0 && (
                            <span className="px-2 py-0.5 rounded-md text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                              {u.requirementsCount} requisitos
                            </span>
                          )}
                          {!isEnabled && (
                            <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300">
                              Desativada
                            </span>
                          )}
                        </div>

                        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
                          {u.pedagogicalDetails || u.description}
                        </p>

                        {/* Especialidades vinculadas */}
                        {u.specialties && u.specialties.length > 0 && (
                          <div className="flex flex-wrap items-center gap-1.5 pt-1">
                            <span className="text-[11px] font-bold text-purple-700 dark:text-purple-300 flex items-center gap-1">
                              <Award className="w-3 h-3" /> Especialidade(s) Gatilho:
                            </span>
                            {u.specialties.map((s) => (
                              <span
                                key={s}
                                className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800"
                              >
                                {s}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Ações do Card */}
                    <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                      {/* Switch Ativado / Desativado */}
                      <button
                        type="button"
                        onClick={() => handleToggleUnification(u)}
                        disabled={actionLoading}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border flex items-center gap-1.5 ${
                          isEnabled
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800 hover:bg-emerald-100'
                            : 'bg-slate-100 text-slate-500 border-slate-300 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700 hover:bg-slate-200'
                        }`}
                        title={isEnabled ? 'Clique para desativar esta unificação' : 'Clique para ativar esta unificação'}
                      >
                        {isEnabled ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                        {isEnabled ? 'Ativa' : 'Inativa'}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setEditingUnif(u);
                          setIsCreatingNew(false);
                        }}
                        className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title="Editar unificação"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => toggleCard(u.code)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                      >
                        {isExpanded ? 'Ocultar' : 'Detalhes'}
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  {/* Conteúdo Expansível */}
                  {isExpanded && (
                    <div className="px-5 pb-5 pt-2 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50 space-y-4">
                      {/* Regra de Sistema */}
                      <div className="bg-blue-50/80 dark:bg-blue-950/30 p-3 rounded-lg border border-blue-200/60 dark:border-blue-900/40 text-xs text-blue-900 dark:text-blue-200">
                        <strong>Comportamento no Sistema & Calendário:</strong> {u.systemRule}
                      </div>

                      {/* Escala Hierárquica se Nível 2 */}
                      {u.hierarchicalScale && u.hierarchicalScale.length > 0 && (
                        <div className="space-y-2">
                          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                            <Layers className="w-3.5 h-3.5 text-blue-500" /> Régua de Escalonamento Hierárquico (Cascata Descendente &gt;=)
                          </span>
                          <div className="flex flex-wrap items-center gap-2 p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                            {u.hierarchicalScale.map((item, idx) => (
                              <React.Fragment key={item.id || idx}>
                                <div className="flex items-center gap-1 px-2.5 py-1 rounded bg-blue-50 dark:bg-blue-950 text-blue-800 dark:text-blue-200 text-xs font-semibold border border-blue-200 dark:border-blue-800">
                                  <span>{item.label}</span>
                                </div>
                                {idx < u.hierarchicalScale.length - 1 && (
                                  <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                )}
                              </React.Fragment>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Requisitos Vinculados */}
                      <div className="space-y-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                          Requisitos Originais Vinculados ({u.requirements?.length || 0}):
                        </span>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {(u.requirements || []).map((r, rIdx) => {
                            const badgeColor = CLASS_COLORS[r.class_name] || 'bg-slate-100 text-slate-800 border-slate-300';
                            return (
                              <div
                                key={r.id || rIdx}
                                className="p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 flex items-start gap-2.5"
                              >
                                <span className={`px-2 py-0.5 rounded text-[11px] font-bold border shrink-0 ${badgeColor}`}>
                                  {r.class_name} • {r.code}
                                </span>
                                <div className="text-xs text-slate-700 dark:text-slate-300 line-clamp-3">
                                  {r.text}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ABA 2: RECOMENDAÇÕES DE ABSORÇÃO INTELIGENTE */}
      {activeTab === 'absorptions' && (
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-emerald-900/90 to-slate-900 text-white p-6 rounded-2xl border border-emerald-700/50 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold uppercase tracking-wider">
                <Zap className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
                Motor Inteligente de Absorções DSA
              </div>
              <h2 className="text-xl sm:text-2xl font-black">
                Recomendações de Conclusão por Absorção
              </h2>
              <p className="text-emerald-100/90 text-sm">
                O sistema identificou desbravadores matriculados que já cumpriram metas superiores (ex.: caminhada de 20 km ou 10 km, resumo de 1 página do curso de leitura, 3 refeições, idade mínima ou especialidades gatilho) e que possuem requisitos menores equivalentes pendentes prontos para serem absorvidos.
              </p>
            </div>

            {recommendations.length > 0 ? (
              <button
                type="button"
                onClick={handleApproveAllAbsorptions}
                disabled={actionLoading}
                className="flex items-center gap-2 px-5 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-sm shadow-xl transition-all shrink-0 hover:scale-[1.02]"
              >
                <CheckCheck className="w-5 h-5" />
                Aprovar Todas as Recomendações ({recommendations.length})
              </button>
            ) : (
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 text-emerald-200 text-sm font-semibold shrink-0">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                Tudo em dia! Nenhuma absorção pendente.
              </div>
            )}
          </div>

          {/* Cards de Recomendações */}
          {recommendations.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {recommendations.map((rec) => (
                <div
                  key={rec.id}
                  className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm hover:border-emerald-500 dark:hover:border-emerald-600 transition-all flex flex-col justify-between gap-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                          {rec.unitName}
                        </span>
                        <h4 className="font-extrabold text-base text-slate-900 dark:text-slate-100">
                          {rec.pathfinderName}
                        </h4>
                      </div>
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                        {rec.ruleLabel}
                      </span>
                    </div>

                    {/* Explicação da Absorção */}
                    <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-lg border border-slate-200 dark:border-slate-700 text-xs space-y-2">
                      <div className="text-slate-700 dark:text-slate-300 font-medium">
                        {rec.reason}
                      </div>
                      <div className="flex items-center gap-2 pt-1 border-t border-slate-200/60 dark:border-slate-700/60 text-[11px]">
                        <span className="text-slate-500 dark:text-slate-400">Requisito a Aprovar:</span>
                        <span
                          className={`px-2 py-0.5 rounded font-bold border ${
                            CLASS_COLORS[rec.targetClassName] || 'bg-slate-100 text-slate-800 border-slate-300'
                          }`}
                        >
                          {rec.targetClassName} • {rec.targetRequirementCode}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                    <span className="text-xs font-mono font-semibold text-slate-400">
                      Regra: {rec.unificationCode}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleApproveSingleAbsorption(rec)}
                      disabled={actionLoading}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-colors"
                    >
                      <Check className="w-3.5 h-3.5" />
                      Aprovar por Absorção
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 p-12 rounded-xl text-center border border-slate-200 dark:border-slate-800 space-y-3">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
              <h3 className="font-extrabold text-lg text-slate-900 dark:text-slate-100">
                Nenhuma Recomendação Pendente no Momento
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                À medida que os desbravadores forem concluindo caminhadas maiores, resumos do curso de leitura, refeições ou especialidades, novas recomendações automáticas de absorção aparecerão aqui.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ABA 3: 35 REQUISITOS EXCLUSIVOS / ISOLADOS */}
      {activeTab === 'isolated' && (
        <div className="space-y-4">
          <div className="bg-amber-50 dark:bg-amber-950/40 p-5 rounded-xl border border-amber-200 dark:border-amber-800/60 text-xs sm:text-sm text-amber-900 dark:text-amber-200 space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-amber-800 dark:text-amber-300">
              <Info className="w-4 h-4" />
              Por que estes 35 requisitos permanecem isolados no Cenário Estrito?
            </div>
            <p>
              Para manter o rigor pedagógico oficial da DSA e evitar reprovação nas investiduras distritais/regionais, livros exclusivos de cada classe (como <em>Vaso de Barro</em> em Amigo ou <em>Expedição Galápagos</em> em Pioneiro) e blocos próprios de leitura bíblica não podem ser unificados de forma estrita. Porém, no <strong>Cenário 2 (Integrado)</strong>, 21 deles podem ser aproveitados inteligentemente conforme indicado na coluna de conexões!
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {(data?.isolated || []).map((item) => {
              const badgeColor = CLASS_COLORS[item.className] || 'bg-slate-100 text-slate-800 border-slate-300';
              return (
                <div
                  key={item.num}
                  className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-mono font-bold text-slate-400">
                      ID {String(item.num).padStart(3, '0')}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-xs font-bold border ${badgeColor}`}>
                      {item.className} • {item.code || item.requirement}
                    </span>
                  </div>

                  <div className="font-semibold text-sm text-slate-800 dark:text-slate-200">
                    {item.description}
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 text-xs text-slate-600 dark:text-slate-300">
                    <strong className="text-blue-600 dark:text-blue-400">Regra DSA:</strong> {item.rule}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ABA 4: 9 EVENTOS-ÂNCORA DO CALENDÁRIO ANUAL */}
      {activeTab === 'events' && (
        <div className="space-y-4">
          <div className="bg-blue-50 dark:bg-blue-950/40 p-5 rounded-xl border border-blue-200 dark:border-blue-800/60 text-xs sm:text-sm text-blue-900 dark:text-blue-200 space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-blue-800 dark:text-blue-300">
              <Calendar className="w-4 h-4" />
              Guia Prático: Como cumprir as 40 Unificações com apenas 9 Eventos no Ano
            </div>
            <p>
              Em vez de marcar reuniões avulsas repetitivas, a diretoria organiza estes 9 Eventos-Âncora ao longo do ano. Cada evento engloba requisitos de todas as classes ao mesmo tempo.
            </p>
          </div>

          <div className="space-y-4">
            {(data?.anchorEvents || []).map((evt) => (
              <div
                key={evt.code}
                className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-600 text-white font-black text-sm flex items-center justify-center shrink-0 shadow-md">
                    {evt.code}
                  </div>
                  <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100">
                    {evt.title}
                  </h3>
                </div>

                <div className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed pl-2 border-l-2 border-blue-500">
                  {evt.body}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ABA 5: CRUZAMENTO BÍBLICO & ESPECIALIDADES ESTRATÉGICAS */}
      {activeTab === 'crossings' && (
        <div className="space-y-6">
          {/* 15 Especialidades Estratégicas */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                15 Especialidades Estratégicas (Gatilhos Múltiplos)
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Ao ministrar estas especialidades com o Clube, você cumpre a especialidade obrigatória/eletiva E resolve requisitos práticos das classes simultaneamente:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {(data?.strategicSpecialties || []).map((spec) => (
                <div
                  key={spec.code}
                  className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                      {spec.code}
                    </span>
                    <span className="text-xs font-semibold text-slate-400">
                      Área: {spec.area}
                    </span>
                  </div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                    {spec.name}
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    {spec.unifies}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* 22 Pares Bíblicos */}
          <div className="space-y-3 pt-6 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                22 Pares Exatos: Versos / Temas × Leitura Bíblica
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Quem lê o capítulo correspondente no plano de leitura bíblica cumpre automaticamente o verso ou estudo bíblico exigido na classe:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {(data?.biblePairs || []).map((pair, idx) => (
                <div
                  key={idx}
                  className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-start gap-3"
                >
                  <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-bold text-xs flex items-center justify-center shrink-0 border border-blue-200 dark:border-blue-800">
                    {idx + 1}
                  </div>
                  <div className="space-y-1 flex-1 text-xs">
                    <div className="font-bold text-slate-900 dark:text-slate-100">
                      {pair.theme}
                    </div>
                    <div className="text-slate-600 dark:text-slate-400">
                      Capítulo correspondente: <strong>{pair.bibleChapter}</strong>
                    </div>
                    <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                      {pair.connectionType}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal de Edição de Unificação */}
      {editingUnif && (
        <UnificationEditModal
          unif={editingUnif}
          isNew={isCreatingNew}
          catalog={catalog}
          onClose={() => {
            setEditingUnif(null);
            setIsCreatingNew(false);
          }}
          onSave={async (savedData) => {
            try {
              setActionLoading(true);
              if (isCreatingNew) {
                await apiRequest('/api/unifications', {
                  method: 'POST',
                  body: JSON.stringify(savedData),
                });
                showToast(`Nova unificação ${savedData.code} criada com sucesso!`);
              } else {
                await apiRequest(`/api/unifications/${savedData.code}`, {
                  method: 'PUT',
                  body: JSON.stringify(savedData),
                });
                showToast(`Unificação ${savedData.code} atualizada com sucesso!`);
              }
              setEditingUnif(null);
              setIsCreatingNew(false);
              await loadData();
              if (onRefreshCatalog) onRefreshCatalog();
            } catch (err) {
              showToast(err.message || 'Erro ao salvar unificação', 'error');
            } finally {
              setActionLoading(false);
            }
          }}
        />
      )}
    </div>
  );
}

/**
 * Modal para editar ou criar unificação
 */
function UnificationEditModal({ unif, isNew, catalog, onClose, onSave }) {
  const [code, setCode] = useState(unif.code || '');
  const [title, setTitle] = useState(unif.title || '');
  const [description, setDescription] = useState(unif.pedagogicalDetails || unif.description || '');
  const [ruleCode, setRuleCode] = useState(unif.ruleCode || 'AUTO_EQUAL');
  const [enabled, setEnabled] = useState(unif.enabled !== false);
  const [selectedReqIds, setSelectedReqIds] = useState(new Set(unif.requirementIds || []));
  const [classFilter, setClassFilter] = useState('ALL');

  useModalDismiss(true, onClose, 'ModalEdicaoUnificacao');

  const toggleReq = (rId) => {
    setSelectedReqIds((prev) => {
      const next = new Set(prev);
      if (next.has(rId)) next.delete(rId);
      else next.add(rId);
      return next;
    });
  };

  const handleSave = () => {
    if (!code.trim() || !title.trim()) {
      alert('Código e Título são obrigatórios.');
      return;
    }
    let levels = ['N1'];
    let levelText = '🟢 Nível 1: Equivalência Direta (100% Iguais)';
    if (ruleCode === 'HIERARCHICAL_SCALE') {
      levels = ['N2'];
      levelText = '🔵 Nível 2: Escalonamento Hierárquico';
    } else if (ruleCode === 'SPECIALTY_ABSORPTION') {
      levels = ['N3'];
      levelText = '🟣 Nível 3: Absorção por Especialidade / Texto';
    } else if (ruleCode === 'SHARED_EVENT') {
      levels = ['N4'];
      levelText = '🟡 Nível 4: Evento Conjunto';
    }

    onSave({
      ...unif,
      code: code.trim().toUpperCase(),
      title: title.trim(),
      description: description.trim(),
      pedagogicalDetails: description.trim(),
      ruleCode,
      levels,
      levelText,
      enabled,
      requirementIds: Array.from(selectedReqIds),
    });
  };

  // Requisitos do catálogo organizados
  const allReqs = useMemo(() => {
    if (!catalog?.requirements) return [];
    return catalog.requirements;
  }, [catalog]);

  const filteredReqs = useMemo(() => {
    if (classFilter === 'ALL') return allReqs;
    return allReqs.filter((r) => r.class_slug === classFilter);
  }, [allReqs, classFilter]);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-3xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GitMerge className="w-5 h-5 text-blue-600" />
            <h3 className="font-extrabold text-lg text-slate-900 dark:text-slate-100">
              {isNew ? 'Criar Nova Unificação' : `Editar Unificação ${unif.code}`}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulário */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">
                Código:
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                disabled={!isNew}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono font-bold"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">
                Título da Atividade:
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Expedição de Caminhada Escalonada"
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-medium"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">
                Nível Técnico & Regra:
              </label>
              <select
                value={ruleCode}
                onChange={(e) => setRuleCode(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-medium"
              >
                <option value="AUTO_EQUAL">🟢 Nível 1: Equivalência Direta (100% Iguais)</option>
                <option value="HIERARCHICAL_SCALE">🔵 Nível 2: Escalonamento Hierárquico (&gt;=)</option>
                <option value="SPECIALTY_ABSORPTION">🟣 Nível 3: Absorção por Especialidade</option>
                <option value="SHARED_EVENT">🟡 Nível 4: Evento Conjunto (Entrega Individual)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">
                Status no Clube:
              </label>
              <select
                value={enabled ? 'true' : 'false'}
                onChange={(e) => setEnabled(e.target.value === 'true')}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-medium"
              >
                <option value="true">Ativada (Participa das automações e calendário)</option>
                <option value="false">Desativada (Ignorada)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">
              Detalhamento Pedagógico & Justificativa:
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Explique como os requisitos se conectam e a regra pedagógica adotada."
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
            />
          </div>

          {/* Seleção de Requisitos */}
          <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-400">
                Requisitos Vinculados ({selectedReqIds.size} selecionados):
              </label>
              <select
                value={classFilter}
                onChange={(e) => setClassFilter(e.target.value)}
                className="px-2.5 py-1 text-xs rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              >
                <option value="ALL">Todas as Classes</option>
                <option value="amigo">Amigo</option>
                <option value="amigo-avancado">Amigo da Natureza</option>
                <option value="companheiro">Companheiro</option>
                <option value="companheiro-avancado">Companheiro de Excursionismo</option>
                <option value="pesquisador">Pesquisador</option>
                <option value="pesquisador-avancado">Pesquisador de Campo</option>
                <option value="pioneiro">Pioneiro</option>
                <option value="pioneiro-avancado">Pioneiro de Novas Fronteiras</option>
                <option value="excursionista">Excursionista</option>
                <option value="excursionista-avancado">Excursionista na Mata</option>
                <option value="guia">Guia</option>
                <option value="guia-avancado">Guia de Exploração</option>
              </select>
            </div>

            <div className="max-h-60 overflow-y-auto space-y-1.5 p-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
              {filteredReqs.map((r) => {
                const isSelected = selectedReqIds.has(r.id);
                return (
                  <label
                    key={r.id}
                    className={`flex items-start gap-2.5 p-2 rounded cursor-pointer transition-colors text-xs ${
                      isSelected
                        ? 'bg-blue-50 dark:bg-blue-950/60 border border-blue-300 dark:border-blue-800'
                        : 'hover:bg-white dark:hover:bg-slate-800 border border-transparent'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleReq(r.id)}
                      className="mt-0.5 rounded text-blue-600 focus:ring-blue-500"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-slate-100">
                        <span>{r.class_slug}</span>
                        <span>•</span>
                        <span>{r.code}</span>
                        <span className="font-normal text-slate-500 truncate">- {r.title}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
                        {r.description}
                      </p>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>
        </div>

        {/* Rodapé */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 rounded-b-2xl flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 text-xs font-bold rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-md transition-colors"
          >
            Salvar Unificação
          </button>
        </div>
      </div>
    </div>
  );
}
