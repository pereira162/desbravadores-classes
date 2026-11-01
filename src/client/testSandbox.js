/**
 * Motor de Sandbox Efêmero no Navegador (sessionStorage) para a Página de Teste (?teste=1).
 *
 * - Ao abrir ?teste=1, carrega o seed inicial somente-leitura de GET /api/test-seed.
 * - Todas as alterações (aprovar requisitos, cadastrar desbravadores, criar eventos,
 *   editar unificações, trocar de contas de teste, adicionar membros da diretoria)
 *   ficam salvas EXCLUSIVAMENTE no sessionStorage do navegador do usuário.
 * - Quando o usuário fecha o navegador (ou clica em "Resetar Meu Teste"), as mudanças
 *   se encerram sem jamais afetar outros usuários ou o banco do servidor.
 */

const SANDBOX_STORAGE_KEY = 'dbv_ephemeral_test_state_v2';
const SANDBOX_USER_KEY = 'dbv_ephemeral_test_current_user_v2';

let memoryFallbackState = null;

function loadSandboxStateFromStorage() {
  try {
    const raw = window.sessionStorage.getItem(SANDBOX_STORAGE_KEY);
    if (!raw) return memoryFallbackState;
    return JSON.parse(raw);
  } catch {
    return memoryFallbackState;
  }
}

function saveSandboxStateToStorage(state) {
  memoryFallbackState = state;
  try {
    window.sessionStorage.setItem(SANDBOX_STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn('[Sandbox Teste] Aviso ao salvar no sessionStorage:', e.message);
  }
}

export function resetEphemeralTestSession() {
  memoryFallbackState = null;
  try {
    window.sessionStorage.removeItem(SANDBOX_STORAGE_KEY);
    window.sessionStorage.removeItem(SANDBOX_USER_KEY);
  } catch {}
}

export function getSandboxCurrentUser() {
  try {
    const raw = window.sessionStorage.getItem(SANDBOX_USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setSandboxCurrentUser(user) {
  try {
    if (!user) {
      window.sessionStorage.removeItem(SANDBOX_USER_KEY);
    } else {
      window.sessionStorage.setItem(SANDBOX_USER_KEY, JSON.stringify(user));
    }
  } catch {}
}

function recomputeUnificationAlerts(state) {
  const rawEqGroups = state.catalog?.equivalenceGroups || {};
  const eqGroups = {};
  if (Array.isArray(rawEqGroups)) {
    for (const eq of rawEqGroups) {
      if (eq && (eq.id || eq.code)) {
        const k = eq.id || eq.code;
        eqGroups[k] = { id: k, code: k, ...eq };
      }
    }
  } else if (rawEqGroups && typeof rawEqGroups === 'object') {
    for (const [k, v] of Object.entries(rawEqGroups)) {
      if (v && typeof v === 'object') {
        const key = v.id || v.code || k;
        eqGroups[key] = { id: key, code: key, ...v };
      }
    }
  }
  const reqs = state.catalog?.requirements || [];
  const pfs = (state.pathfinders || []).filter((p) => p.active !== false);
  const progress = state.progressRecords || [];

  const reqsByGroup = {};
  for (const r of reqs) {
    if (r.equivalence_group && eqGroups[r.equivalence_group]) {
      if (!reqsByGroup[r.equivalence_group]) reqsByGroup[r.equivalence_group] = [];
      reqsByGroup[r.equivalence_group].push(r);
    }
  }

  const classBySlug = {};
  for (const c of state.catalog?.classes || []) {
    classBySlug[c.slug] = c;
  }

  const progMap = {};
  for (const pr of progress) {
    progMap[`${pr.pathfinder_id}:${pr.requirement_id}`] = pr.status;
  }

  const alerts = [];
  for (const pf of pfs) {
    const pfSlugs = new Set((pf.enrollments || []).map((e) => e.class_slug));
    for (const [eqCode, groupReqs] of Object.entries(reqsByGroup)) {
      if (groupReqs.length < 2) continue;
      const relevant = groupReqs.filter((r) => pfSlugs.has(r.class_slug));
      if (relevant.length < 2) continue;

      const doneList = relevant.filter((r) => {
        const st = progMap[`${pf.id}:${r.id}`] || 'PENDENTE';
        return st === 'APROVADO' || st === 'CONCLUIDO';
      });
      const pendingList = relevant.filter((r) => {
        const st = progMap[`${pf.id}:${r.id}`] || 'PENDENTE';
        return st === 'PENDENTE' || st === 'EM_ANDAMENTO';
      });

      if (doneList.length > 0 && pendingList.length > 0) {
        const src = doneList[0];
        const srcStatus = progMap[`${pf.id}:${src.id}`];
        const srcClassName = classBySlug[src.class_slug]?.name || src.class_slug;
        const eqTitle = eqGroups[eqCode]?.title || eqCode;
        for (const tgt of pendingList) {
          const tgtClassName = classBySlug[tgt.class_slug]?.name || tgt.class_slug;
          alerts.push({
            id: `${pf.id}:${eqCode}:${tgt.id}`,
            // snake_case (DashboardView & App.jsx)
            pathfinder_id: pf.id,
            pathfinder_name: pf.name,
            unit_id: pf.unit_id,
            unit_name: pf.unit_name || 'Sem Unidade',
            equivalence_code: eqCode,
            equivalence_title: eqTitle,
            completed_requirement_id: src.id,
            completed_requirement_code: src.code,
            completed_requirement_title: src.title,
            completed_class_name: srcClassName,
            source_status: srcStatus,
            pending_requirement_id: tgt.id,
            pending_requirement_code: tgt.code,
            pending_requirement_title: tgt.title,
            pending_class_slug: tgt.class_slug,
            pending_class_name: tgtClassName,
            // camelCase (MCP tools)
            pathfinderId: pf.id,
            pathfinderName: pf.name,
            unitId: pf.unit_id,
            unitName: pf.unit_name || 'Sem Unidade',
            equivalenceCode: eqCode,
            equivalenceTitle: eqTitle,
            sourceRequirementId: src.id,
            sourceRequirementCode: src.code,
            sourceRequirementTitle: src.title,
            sourceClassName: srcClassName,
            sourceStatus: srcStatus,
            targetRequirementId: tgt.id,
            targetRequirementCode: tgt.code,
            targetRequirementTitle: tgt.title,
            targetClassSlug: tgt.class_slug,
            targetClassName: tgtClassName,
          });
        }
      }
    }
  }
  state.unificationAlerts = alerts;
}

async function ensureSandboxInitialized(apiBaseUrl) {
  let state = loadSandboxStateFromStorage();
  if (state && state.catalog && Array.isArray(state.pathfinders)) {
    return state;
  }

  const res = await fetch(`${apiBaseUrl}/api/test-seed`, {
    headers: { 'X-Test-Mode': 'true' },
  });
  if (!res.ok) {
    throw new Error('Falha ao carregar ambiente de demonstração.');
  }
  const seed = await res.json();
  state = {
    ...seed,
    mcpKeys: [
      {
        id: 'mcpk-demo-1',
        name: 'Chave MCP — Diretor (Teste)',
        user_id: 'usr-diretor',
        user_name: 'Carlos Eduardo (Diretor)',
        user_role: 'DIRETOR',
        api_key_prefix: 'sgc_mcp_demo...',
        allowed_tools: ['*'],
        active: true,
        created_at: new Date().toISOString(),
      },
    ],
  };
  recomputeUnificationAlerts(state);
  saveSandboxStateToStorage(state);
  return state;
}

function appendSandboxAudit(state, user, action, entityType, entityId, summary, prevState = null, newState = null, batchId = null) {
  const entry = {
    id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    user_id: user?.id || 'usr-diretor',
    user_name: user?.name || 'Usuário de Teste',
    user_role: user?.role || 'DIRETOR',
    action,
    entity_type: entityType,
    entity_id: entityId,
    batch_id: batchId,
    summary,
    previous_state: prevState,
    new_state: newState,
    reverted: false,
    created_at: new Date().toISOString(),
  };
  state.auditLogs = [entry, ...(state.auditLogs || [])].slice(0, 150);
  return entry;
}

export async function handleSandboxRequest({ path, method = 'GET', body, apiBaseUrl }) {
  const state = await ensureSandboxInitialized(apiBaseUrl);
  const currentUser =
    getSandboxCurrentUser() ||
    (state.demoAccounts || [])[0] || {
      id: 'usr-diretor',
      name: 'Carlos Eduardo (Diretor)',
      email: 'diretor@clube.org',
      role: 'DIRETOR',
      assigned_classes: ['*'],
      permissions: {
        can_manage_pathfinders: true,
        can_manage_units: true,
        can_manage_events: true,
        can_approve_all: true,
        can_view_all_units: true,
        can_view_all_classes: true,
        can_edit_equivalences: true,
      },
    };

  // 1. Contas Demo
  if (path === '/api/auth/demo-accounts' && method === 'GET') {
    return {
      club_name: state.clubSettings?.club_name || 'Clube Pioneiros da Colina (Ambiente de Teste)',
      club_logo_url: state.clubSettings?.club_logo_url || '',
      color_theme: state.clubSettings?.color_theme || 'amber',
      setup_completed: true,
      demo_mode_enabled: true,
      smtp_configured: false,
      google_client_id: '',
      accounts: state.demoAccounts || [],
    };
  }

  // 2. Login em Conta de Teste (E-mail/Senha)
  if (path === '/api/auth/login' && method === 'POST') {
    const email = String(body?.email || '').trim().toLowerCase();
    const allUsers = [...(state.demoAccounts || []), ...(state.leaders || [])];
    const matched = allUsers.find((u) => String(u.email || '').toLowerCase() === email);
    if (!matched) {
      throw new Error('Conta de teste não encontrada neste navegador.');
    }
    setSandboxCurrentUser(matched);
    return {
      token: `sandbox-token-${matched.id}`,
      user: matched,
    };
  }

  // 3. Usuário Atual
  if (path === '/api/auth/me' && method === 'GET') {
    const refreshed =
      (state.demoAccounts || []).find((u) => u.id === currentUser.id) ||
      (state.leaders || []).find((u) => u.id === currentUser.id) ||
      currentUser;
    return { user: refreshed };
  }

  // 4. Bootstrap Completo
  if (path === '/api/bootstrap' && method === 'GET') {
    recomputeUnificationAlerts(state);
    return {
      clubSettings: state.clubSettings,
      catalog: state.catalog,
      units: state.units,
      pathfinders: state.pathfinders,
      progressRecords: state.progressRecords,
      events: state.events,
      leaders: state.leaders,
      unificationAlerts: state.unificationAlerts || [],
      auditLogs: state.auditLogs || [],
    };
  }

  // 5. Atualizar Requisito Individual
  if (path === '/api/progress/update' && method === 'POST') {
    const {
      pathfinder_id,
      requirement_id,
      status,
      completed_sub_items,
      notes = '',
      completed_at,
      submission_text = '',
      attachments = [],
      review_notes = '',
    } = body || {};

    const pf = (state.pathfinders || []).find((p) => p.id === pathfinder_id);
    const reqItem = (state.catalog?.requirements || []).find((r) => r.id === requirement_id);
    if (!pf || !reqItem) throw new Error('Desbravador ou requisito não encontrado.');

    let effectiveStatus = status;
    let downgradedNotice = null;
    if (currentUser.role === 'DESBRAVADOR') {
      if (currentUser.pathfinder_id && currentUser.pathfinder_id !== pf.id) {
        throw new Error('Como Desbravador(a), você só pode atualizar seu próprio Cartão.');
      }
      if (status === 'APROVADO') {
        effectiveStatus = 'CONCLUIDO';
        downgradedNotice = 'Atividade enviada no seu navegador de teste para avaliação do Instrutor!';
      }
    } else if (
      currentUser.role === 'CONSELHEIRO' &&
      status === 'APROVADO' &&
      !state.clubSettings?.allow_counselor_direct_approval &&
      !currentUser.permissions?.can_approve_all
    ) {
      effectiveStatus = 'CONCLUIDO';
      downgradedNotice = 'Marcado como CONCLUÍDO (aguardando assinatura final do Instrutor ou Diretor).';
    }

    const now = new Date().toISOString();
    const allSubs = (reqItem.sub_items || []).map((s) => s.code);
    const finalSubs = Array.isArray(completed_sub_items)
      ? completed_sub_items
      : effectiveStatus === 'CONCLUIDO' || effectiveStatus === 'APROVADO'
      ? allSubs
      : [];

    const existingIdx = (state.progressRecords || []).findIndex(
      (pr) => pr.pathfinder_id === pathfinder_id && pr.requirement_id === requirement_id
    );
    const prevRec = existingIdx >= 0 ? { ...state.progressRecords[existingIdx] } : null;

    const updatedRec = {
      id: prevRec?.id || `pr-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      pathfinder_id,
      requirement_id,
      status: effectiveStatus,
      completed_sub_items: finalSubs,
      notes,
      submission_text: submission_text || prevRec?.submission_text || '',
      attachments: Array.isArray(attachments) && attachments.length > 0 ? attachments : prevRec?.attachments || [],
      submitted_by_pathfinder: currentUser.role === 'DESBRAVADOR' ? true : Boolean(prevRec?.submitted_by_pathfinder),
      submitted_at: currentUser.role === 'DESBRAVADOR' ? now : prevRec?.submitted_at || null,
      review_notes: review_notes || prevRec?.review_notes || '',
      completed_at: effectiveStatus === 'PENDENTE' ? null : completed_at || now.slice(0, 10),
      marked_by_user_id: effectiveStatus === 'PENDENTE' ? null : currentUser.id,
      marked_by_name: effectiveStatus === 'PENDENTE' ? null : currentUser.name,
      approved_by_user_id: effectiveStatus === 'APROVADO' ? currentUser.id : null,
      approved_by_name: effectiveStatus === 'APROVADO' ? currentUser.name : null,
      updated_at: now,
    };

    if (existingIdx >= 0) {
      state.progressRecords[existingIdx] = updatedRec;
    } else {
      state.progressRecords.push(updatedRec);
    }

    appendSandboxAudit(
      state,
      currentUser,
      'STATUS_CHANGE',
      'PROGRESS_RECORD',
      `${pathfinder_id}:${requirement_id}`,
      `${currentUser.name} alterou ${reqItem.code} (${reqItem.title}) de "${pf.name}" para ${effectiveStatus} [Sessão Local].`,
      prevRec || { pathfinder_id, requirement_id, status: 'PENDENTE' },
      updatedRec
    );
    recomputeUnificationAlerts(state);
    saveSandboxStateToStorage(state);

    return {
      success: true,
      downgradedNotice,
      record: updatedRec,
    };
  }

  // 6. Assinatura em Lote
  if (path === '/api/progress/bulk' && method === 'POST') {
    const {
      pathfinder_ids = [],
      requirement_ids = [],
      status = 'APROVADO',
      notes = '',
      completed_at,
      reason_label = 'Assinatura em Lote',
    } = body || {};

    const batchId = `batch-${Date.now()}`;
    let updatedCount = 0;
    for (const pfId of pathfinder_ids) {
      for (const reqId of requirement_ids) {
        await handleSandboxRequest({
          path: '/api/progress/update',
          method: 'POST',
          body: { pathfinder_id: pfId, requirement_id: reqId, status, notes, completed_at },
          apiBaseUrl,
        });
        updatedCount++;
      }
    }
    return {
      success: true,
      batch_id: batchId,
      updated_count: updatedCount,
      skipped_permissions: 0,
      reason_label,
    };
  }

  // 7. Cadastrar / Editar / Excluir Desbravador no Sandbox
  if (path === '/api/pathfinders' && method === 'POST') {
    const {
      name,
      email = '',
      birth_date,
      gender = 'M',
      unit_id = null,
      notes = '',
      class_slugs = ['amigo', 'amigo-avancado'],
    } = body || {};

    const id = `dbv-local-${Date.now().toString(36)}`;
    const unitObj = (state.units || []).find((u) => u.id === unit_id);
    const classesCatalog = state.catalog?.classes || [];
    const enrollments = (class_slugs || []).map((slug) => {
      const cObj = classesCatalog.find((c) => c.slug === slug) || {};
      return {
        id: `enr-${id}-${slug}`,
        pathfinder_id: id,
        class_slug: slug,
        class_name: cObj.name || slug,
        class_type: cObj.class_type || 'REGULAR',
        color_hex: cObj.color_hex || '#0284c7',
        base_slug: cObj.base_slug || slug.replace('-avancado', ''),
        year: 2026,
        status: 'EM_ANDAMENTO',
      };
    });

    const newPf = {
      id,
      name: String(name || 'Novo Desbravador').trim(),
      email,
      birth_date: birth_date || '2015-01-01',
      gender,
      unit_id,
      unit_name: unitObj?.name || null,
      unit_color: unitObj?.color_hex || null,
      notes,
      active: true,
      has_account: false,
      enrollments,
      created_at: new Date().toISOString(),
    };

    state.pathfinders.push(newPf);
    appendSandboxAudit(
      state,
      currentUser,
      'PATHFINDER_CREATE',
      'PATHFINDER',
      id,
      `${currentUser.name} cadastrou "${newPf.name}" (Salvo apenas neste navegador).`
    );
    recomputeUnificationAlerts(state);
    saveSandboxStateToStorage(state);
    return { success: true, id };
  }

  if (path.startsWith('/api/pathfinders/') && method === 'PUT') {
    const pfId = path.split('/')[3];
    const idx = (state.pathfinders || []).findIndex((p) => p.id === pfId);
    if (idx < 0) throw new Error('Desbravador não encontrado.');

    const existing = state.pathfinders[idx];
    const unitObj = (state.units || []).find((u) => u.id === (body.unit_id ?? existing.unit_id));
    const classesCatalog = state.catalog?.classes || [];
    const enrollments = Array.isArray(body.class_slugs)
      ? body.class_slugs.map((slug) => {
          const cObj = classesCatalog.find((c) => c.slug === slug) || {};
          return {
            id: `enr-${pfId}-${slug}`,
            pathfinder_id: pfId,
            class_slug: slug,
            class_name: cObj.name || slug,
            class_type: cObj.class_type || 'REGULAR',
            color_hex: cObj.color_hex || '#0284c7',
            base_slug: cObj.base_slug || slug.replace('-avancado', ''),
            year: 2026,
            status: 'EM_ANDAMENTO',
          };
        })
      : existing.enrollments;

    state.pathfinders[idx] = {
      ...existing,
      ...body,
      unit_name: unitObj?.name || null,
      unit_color: unitObj?.color_hex || null,
      enrollments,
    };
    recomputeUnificationAlerts(state);
    saveSandboxStateToStorage(state);
    return { success: true };
  }

  if (path.startsWith('/api/pathfinders/') && method === 'DELETE') {
    const pfId = path.split('/')[3];
    state.pathfinders = (state.pathfinders || []).filter((p) => p.id !== pfId);
    state.progressRecords = (state.progressRecords || []).filter((pr) => pr.pathfinder_id !== pfId);
    recomputeUnificationAlerts(state);
    saveSandboxStateToStorage(state);
    return { success: true };
  }

  // 8. Unidades
  if (path === '/api/units' && method === 'POST') {
    const id = `unit-${Date.now().toString(36)}`;
    state.units.push({
      id,
      name: body.name,
      gender: body.gender || 'MASCULINO',
      age_range: body.age_range || '',
      counselor_description: body.counselor_description || '',
      color_hex: body.color_hex || '#0284c7',
      active: 1,
    });
    saveSandboxStateToStorage(state);
    return { success: true, id };
  }

  if (path.startsWith('/api/units/') && method === 'PUT') {
    const unitId = path.split('/')[3];
    const idx = (state.units || []).findIndex((u) => u.id === unitId);
    if (idx >= 0) {
      state.units[idx] = { ...state.units[idx], ...body };
      saveSandboxStateToStorage(state);
    }
    return { success: true };
  }

  if (path.startsWith('/api/units/') && method === 'DELETE') {
    const unitId = path.split('/')[3];
    state.units = (state.units || []).filter((u) => u.id !== unitId);
    saveSandboxStateToStorage(state);
    return { success: true };
  }

  // 9. Eventos
  if (path === '/api/events' && method === 'POST') {
    const id = `evt-local-${Date.now().toString(36)}`;
    state.events.unshift({
      id,
      title: body.title,
      description: body.description || '',
      event_type: body.event_type || 'ACAMPAMENTO',
      location: body.location || '',
      scheduled_date: body.scheduled_date,
      status: 'PLANEJADO',
      notes: body.notes || '',
      requirement_ids: body.requirement_ids || [],
      attendee_ids: body.attendee_ids || [],
      created_by_name: currentUser.name,
      created_at: new Date().toISOString(),
    });
    saveSandboxStateToStorage(state);
    return { success: true, id };
  }

  if (path.startsWith('/api/events/') && path.endsWith('/execute') && method === 'POST') {
    const eventId = path.split('/')[3];
    const ev = (state.events || []).find((e) => e.id === eventId);
    if (!ev) throw new Error('Evento não encontrado.');
    const reqIds = body.requirement_ids || ev.requirement_ids || [];
    const attIds = body.attendee_ids || ev.attendee_ids || [];
    const targetStatus = body.target_status || 'APROVADO';

    let updatedRecords = 0;
    for (const pid of attIds) {
      for (const rid of reqIds) {
        await handleSandboxRequest({
          path: '/api/progress/update',
          method: 'POST',
          body: {
            pathfinder_id: pid,
            requirement_id: rid,
            status: targetStatus,
            notes: body.notes || `Concluído no evento: ${ev.title}`,
          },
          apiBaseUrl,
        });
        updatedRecords++;
      }
    }
    ev.status = 'REALIZADO';
    ev.executed_at = new Date().toISOString();
    saveSandboxStateToStorage(state);
    return { success: true, updated_records: updatedRecords };
  }

  if (path.startsWith('/api/events/') && method === 'DELETE') {
    const eventId = path.split('/')[3];
    state.events = (state.events || []).filter((e) => e.id !== eventId);
    saveSandboxStateToStorage(state);
    return { success: true };
  }

  // 10. Liderança e Distribuição de Instrutores
  if (path === '/api/leaders' && method === 'POST') {
    const id = `usr-local-${Date.now().toString(36)}`;
    const unitObj = (state.units || []).find((u) => u.id === body.unit_id);
    const newLeader = {
      id,
      name: body.name,
      email: String(body.email || '').toLowerCase(),
      role: body.role || 'INSTRUTOR',
      custom_role_title: body.custom_role_title || '',
      unit_id: body.unit_id || null,
      unit_name: unitObj?.name || null,
      assigned_classes: body.assigned_classes || [],
      assigned_units: body.assigned_units || (body.unit_id ? [body.unit_id] : []),
      assigned_pathfinders: body.assigned_pathfinders || [],
      permissions: body.permissions || {},
      active: true,
      is_demo: true,
      invite_status: 'ACTIVE',
      created_at: new Date().toISOString(),
    };
    state.leaders.push(newLeader);
    state.demoAccounts.push(newLeader);
    saveSandboxStateToStorage(state);
    return {
      success: true,
      id,
      email_sent: false,
      invite_url: `${window.location.origin}${window.location.pathname}?teste=1`,
    };
  }

  if (path.startsWith('/api/leaders/') && method === 'PUT') {
    const targetId = path.split('/')[3];
    const updateFn = (u) => {
      if (u.id !== targetId) return u;
      const unitObj = (state.units || []).find((un) => un.id === (body.unit_id ?? u.unit_id));
      return {
        ...u,
        ...body,
        unit_name: unitObj?.name || null,
      };
    };
    state.leaders = (state.leaders || []).map(updateFn);
    state.demoAccounts = (state.demoAccounts || []).map(updateFn);
    if (currentUser.id === targetId) {
      const updatedMe = state.demoAccounts.find((u) => u.id === targetId);
      if (updatedMe) setSandboxCurrentUser(updatedMe);
    }
    saveSandboxStateToStorage(state);
    return { success: true };
  }

  if (path.startsWith('/api/leaders/') && method === 'DELETE') {
    const targetId = path.split('/')[3];
    state.leaders = (state.leaders || []).filter((u) => u.id !== targetId);
    state.demoAccounts = (state.demoAccounts || []).filter((u) => u.id !== targetId);
    saveSandboxStateToStorage(state);
    return { success: true };
  }

  if (path.startsWith('/api/classes/') && path.endsWith('/instructor-distribution') && method === 'PUT') {
    const assignments = body?.assignments || body?.distribution || {};
    const updateFn = (u) => {
      if (assignments[u.id] !== undefined) {
        return { ...u, assigned_pathfinders: assignments[u.id] };
      }
      return u;
    };
    state.leaders = (state.leaders || []).map(updateFn);
    state.demoAccounts = (state.demoAccounts || []).map(updateFn);
    saveSandboxStateToStorage(state);
    return { success: true };
  }

  // 10b. Rotas de Convites, Anexos e Reversão de Auditoria no Sandbox
  if (path.startsWith('/api/progress/') && path.endsWith('/attachments') && method === 'GET') {
    const parts = path.split('/');
    const pfId = parts[3];
    const reqId = parts[4];
    const rec = (state.progressRecords || []).find(
      (pr) => pr.pathfinder_id === pfId && pr.requirement_id === reqId
    );
    return { attachments: rec?.attachments || [] };
  }

  if (path.startsWith('/api/pathfinders/') && path.endsWith('/invite') && method === 'POST') {
    const pfId = path.split('/')[3];
    const pf = (state.pathfinders || []).find((p) => p.id === pfId);
    if (!pf) throw new Error('Desbravador não encontrado.');
    const inviteToken = `dbv-inv-sandbox-${pfId}`;
    const inviteUrl = `${window.location.origin}${window.location.pathname}?teste=1&invite=${inviteToken}`;
    return {
      success: true,
      email_sent: false,
      invite_token: inviteToken,
      invite_url: inviteUrl,
      message: 'Link de convite gerado no Ambiente de Testes!',
    };
  }

  if (path.startsWith('/api/leaders/') && path.endsWith('/send-invite') && method === 'POST') {
    const targetId = path.split('/')[3];
    const inviteUrl = `${window.location.origin}${window.location.pathname}?teste=1&invite=inv-${targetId}`;
    return {
      success: true,
      email_sent: false,
      invite_url: inviteUrl,
      message: 'Link de convite gerado no Ambiente de Testes!',
    };
  }

  if (path.startsWith('/api/audit/') && path.endsWith('/revert') && method === 'POST') {
    const logId = path.split('/')[3];
    const entry = (state.auditLogs || []).find((l) => l.id === logId);
    if (!entry) throw new Error('Registro de auditoria não encontrado.');
    entry.reverted = true;
    entry.reverted_by_name = currentUser.name;
    entry.reverted_at = new Date().toISOString();
    if (entry.entity_type === 'PROGRESS_RECORD' && entry.previous_state) {
      const [pfId, reqId] = String(entry.entity_id || '').split(':');
      const idx = (state.progressRecords || []).findIndex(
        (pr) => pr.pathfinder_id === pfId && pr.requirement_id === reqId
      );
      if (idx >= 0) {
        state.progressRecords[idx] = {
          ...state.progressRecords[idx],
          status: entry.previous_state.status || 'PENDENTE',
        };
      }
    }
    recomputeUnificationAlerts(state);
    saveSandboxStateToStorage(state);
    return { success: true };
  }

  // 11. Configurações do Clube (Logo, Cor, etc.)
  if (path === '/api/settings' && method === 'PUT') {
    state.clubSettings = {
      ...state.clubSettings,
      ...body,
    };
    saveSandboxStateToStorage(state);
    return { success: true };
  }

  // 12. Editor de Unificações (Equivalências)
  if (path === '/api/equivalences' && method === 'PUT') {
    const { code, title, description = '', requirement_ids = [] } = body || {};
    const cleanCode = String(code || '').trim().toUpperCase().replace(/\s+/g, '-');
    const newGroup = {
      id: cleanCode,
      code: cleanCode,
      title,
      description,
      is_custom: true,
    };
    if (Array.isArray(state.catalog.equivalenceGroups)) {
      const existingIdx = state.catalog.equivalenceGroups.findIndex(
        (g) => (g.id || g.code) === cleanCode
      );
      if (existingIdx >= 0) state.catalog.equivalenceGroups[existingIdx] = newGroup;
      else state.catalog.equivalenceGroups.push(newGroup);
    } else {
      state.catalog.equivalenceGroups[cleanCode] = newGroup;
    }
    state.catalog.requirements = (state.catalog.requirements || []).map((r) => {
      if (requirement_ids.includes(r.id)) {
        return { ...r, equivalence_group: cleanCode };
      }
      if (r.equivalence_group === cleanCode && !requirement_ids.includes(r.id)) {
        return { ...r, equivalence_group: '' };
      }
      return r;
    });
    recomputeUnificationAlerts(state);
    saveSandboxStateToStorage(state);
    return { success: true, code: cleanCode };
  }

  if (path.startsWith('/api/equivalences/') && method === 'DELETE') {
    const cleanCode = decodeURIComponent(path.split('/')[3] || '').toUpperCase();
    if (Array.isArray(state.catalog.equivalenceGroups)) {
      state.catalog.equivalenceGroups = state.catalog.equivalenceGroups.filter(
        (g) => (g.id || g.code) !== cleanCode
      );
    } else {
      delete state.catalog.equivalenceGroups[cleanCode];
    }
    state.catalog.requirements = (state.catalog.requirements || []).map((r) =>
      r.equivalence_group === cleanCode ? { ...r, equivalence_group: '' } : r
    );
    recomputeUnificationAlerts(state);
    saveSandboxStateToStorage(state);
    return { success: true };
  }

  // 13. Chaves MCP no Sandbox
  if (path === '/api/mcp/keys' && method === 'GET') {
    return { keys: state.mcpKeys || [] };
  }

  if (path === '/api/mcp/keys' && method === 'POST') {
    const rawKey = `sgc_mcp_test_${Math.random().toString(36).slice(2, 14)}`;
    const targetLeader =
      (state.leaders || []).find((l) => l.id === body.user_id) || currentUser;
    const newKey = {
      id: `mcpk-${Date.now()}`,
      name: body.name || `MCP — ${targetLeader.name}`,
      user_id: targetLeader.id,
      user_name: targetLeader.name,
      user_role: targetLeader.role,
      api_key_prefix: `${rawKey.slice(0, 14)}...`,
      allowed_tools: body.allowed_tools || ['*'],
      active: true,
      created_at: new Date().toISOString(),
    };
    state.mcpKeys = [newKey, ...(state.mcpKeys || [])];
    saveSandboxStateToStorage(state);
    return {
      success: true,
      id: newKey.id,
      api_key: rawKey,
      api_key_prefix: newKey.api_key_prefix,
      user_name: newKey.user_name,
    };
  }

  if (path.startsWith('/api/mcp/keys/') && method === 'DELETE') {
    const kId = path.split('/')[4];
    state.mcpKeys = (state.mcpKeys || []).filter((k) => k.id !== kId);
    saveSandboxStateToStorage(state);
    return { success: true };
  }

  // Caso não seja interceptado localmente (ex: /api/pdf/resolve, /api/mcp/chat, /api/feedback), retorna null para delegar ao backend
  return null;
}
