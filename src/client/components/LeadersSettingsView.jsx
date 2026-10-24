import React, { useState } from 'react';
import {
  Shield,
  UserPlus,
  Settings,
  Edit3,
  CheckCircle2,
  X,
  Lock,
  Building2,
  Award,
} from 'lucide-react';
import { ROLE_CONFIG } from '../constants';

export default function LeadersSettingsView({
  catalog,
  leaders,
  units,
  settings,
  currentUser,
  onSaveLeader,
  onSaveSettings,
}) {
  // Estado das Configurações do Clube
  const [clubName, setClubName] = useState(settings?.club_name || '');
  const [clubRegion, setClubRegion] = useState(settings?.club_region || '');
  const [clubYear, setClubYear] = useState(settings?.club_year || '2026');
  const [investitureDate, setInvestitureDate] = useState(
    settings?.investiture_date || '2026-11-28'
  );
  const [allowCounselorDirect, setAllowCounselorDirect] = useState(
    settings?.allow_counselor_direct_approval === 'true'
  );
  const [savingSettings, setSavingSettings] = useState(false);

  // Estado do Modal de Criar / Editar Líder
  const [leaderModalOpen, setLeaderModalOpen] = useState(false);
  const [editingLeader, setEditingLeader] = useState(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('INSTRUTOR');
  const [unitId, setUnitId] = useState('');
  const [assignedClasses, setAssignedClasses] = useState([]);
  const [active, setActive] = useState(true);
  const [savingLeader, setSavingLeader] = useState(false);

  const canManageLeaders = ['ADMIN', 'DIRETOR'].includes(currentUser?.role);

  const openCreateLeader = () => {
    setEditingLeader(null);
    setName('');
    setEmail('');
    setPassword('clube123');
    setRole('INSTRUTOR');
    setUnitId('');
    setAssignedClasses(['amigo', 'amigo_natureza']);
    setActive(true);
    setLeaderModalOpen(true);
  };

  const openEditLeader = (ld) => {
    setEditingLeader(ld);
    setName(ld.name);
    setEmail(ld.email);
    setPassword('');
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
      await onSaveLeader(
        {
          name: name.trim(),
          email: email.trim(),
          password: password.trim() || undefined,
          role,
          unit_id: role === 'CONSELHEIRO' ? unitId || null : null,
          assigned_classes: role === 'INSTRUTOR' ? assignedClasses : [],
          active,
        },
        editingLeader?.id
      );
      setLeaderModalOpen(false);
    } finally {
      setSavingLeader(false);
    }
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
      });
    } finally {
      setSavingSettings(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <Shield className="w-6 h-6 text-indigo-600" />
            Liderança, Controle de Acesso (RBAC) & Configurações do Clube
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Gerencie as contas de login da Diretoria, Secretaria, Instrutores de Classe e Conselheiros de Unidade.
          </p>
        </div>

        {canManageLeaders && (
          <button
            onClick={openCreateLeader}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer shrink-0"
          >
            <UserPlus className="w-4 h-4" />
            Cadastrar Novo Líder
          </button>
        )}
      </div>

      {/* Grid Principal: Lista de Líderes + Configurações do Clube */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Coluna 1 e 2: Contas de Líderes */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
            <h2 className="text-sm font-extrabold text-slate-900">
              Líderes Cadastrados ({leaders.length})
            </h2>
            <span className="text-xs text-slate-500">
              Cada líder possui login individual e escopo auditado
            </span>
          </div>

          <div className="divide-y divide-slate-100">
            {leaders.map((ld) => {
              const rCfg = ROLE_CONFIG[ld.role] || ROLE_CONFIG.INSTRUTOR;
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
                  </div>

                  {canManageLeaders && (
                    <button
                      onClick={() => openEditLeader(ld)}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-xs font-bold text-slate-700 flex items-center gap-1.5 shrink-0 cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      Editar Acesso
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Coluna 3: Configurações Gerais e Governança do Clube */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Settings className="w-5 h-5 text-slate-700" />
            <h2 className="text-sm font-extrabold text-slate-900">
              Parâmetros do Clube & Governança
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
                <input
                  type="date"
                  disabled={!canManageLeaders}
                  value={investitureDate}
                  onChange={(e) => setInvestitureDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                />
              </div>
            </div>

            {/* Regra de Dupla Checagem Conselheiro -> Instrutor */}
            <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 space-y-2">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  disabled={!canManageLeaders}
                  checked={allowCounselorDirect}
                  onChange={(e) => setAllowCounselorDirect(e.target.checked)}
                  className="mt-0.5 rounded text-amber-600"
                />
                <span className="text-xs font-bold text-amber-950">
                  Permitir que Conselheiros assinem &ldquo;APROVADO&rdquo; diretamente
                </span>
              </label>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                Quando desmarcado (padrão recomendado DSA), Conselheiros marcam até <strong>FEITO (Aguardando Visto)</strong> e o item vai para a Fila de Conferência dos Instrutores e Diretores.
              </p>
            </div>

            {canManageLeaders && (
              <button
                type="submit"
                disabled={savingSettings}
                className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition cursor-pointer"
              >
                {savingSettings ? 'Salvando...' : 'Salvar Parâmetros do Clube'}
              </button>
            )}
          </form>
        </div>
      </div>

      {/* Modal Criar / Editar Líder */}
      {leaderModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="text-base font-extrabold">
                {editingLeader ? 'Editar Conta de Líder' : 'Cadastrar Novo Líder'}
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
              className="p-6 space-y-4 overflow-y-auto"
            >
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nome Completo do Líder *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Instrutor Marcos Paulo"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    E-mail de Login *
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="lider@clube.org"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {editingLeader ? 'Nova Senha (deixe vazio p/ manter)' : 'Senha Inicial *'}
                  </label>
                  <input
                    type="text"
                    required={!editingLeader}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={editingLeader ? '••••••••' : 'clube123'}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Cargo / Papel no Clube (RBAC) *
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-bold"
                >
                  <option value="DIRETOR">DIRETOR(A) — Acesso Total e Reversão de Logs</option>
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

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
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
                  {savingLeader ? 'Salvando...' : 'Salvar Líder'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
