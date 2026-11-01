const crypto = require('node:crypto');
const { db, recordAudit, loadCardsMetadata } = require('./db');
const {
  checkProgressPermission,
  getUserPermissions,
  hasClassAccess,
  hasUnitAccess,
} = require('./auth');
const { resolvePdfRecord, schedulePdfWarmup } = require('./pdfCache');

const MCP_TOOLS = [
  {
    name: 'get_club_summary',
    description:
      'Retorna o resumo geral do Clube de Desbravadores: nome do clube, data da investidura, total de desbravadores, unidades, progresso médio por classe e alertas de unificação.',
    category: 'LEITURA',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'list_pathfinders',
    description:
      'Lista os desbravadores ativos do clube com suas unidades, classes matriculadas e percentual de conclusão.',
    category: 'LEITURA',
    inputSchema: {
      type: 'object',
      properties: {
        classSlug: {
          type: 'string',
          description: 'Filtro opcional de classe (ex: amigo, companheiro, pesquisador, pioneiro, excursionista, guia)',
        },
        unitId: {
          type: 'string',
          description: 'Filtro opcional de ID da unidade',
        },
        search: {
          type: 'string',
          description: 'Filtro opcional por nome do desbravador',
        },
      },
    },
  },
  {
    name: 'create_pathfinder',
    description:
      'Cadastra um novo desbravador no clube e matricula nas classes informadas.',
    category: 'CADASTRO',
    inputSchema: {
      type: 'object',
      required: ['name', 'birth_date'],
      properties: {
        name: { type: 'string', description: 'Nome completo do desbravador' },
        birth_date: { type: 'string', description: 'Data de nascimento no formato YYYY-MM-DD' },
        gender: { type: 'string', enum: ['M', 'F'], default: 'M' },
        unit_id: { type: 'string', description: 'ID da unidade (ex: unit-aguias)' },
        email: { type: 'string', description: 'E-mail opcional do desbravador' },
        class_slugs: {
          type: 'array',
          items: { type: 'string' },
          description: 'Lista de slugs de classes (ex: ["amigo", "amigo-avancado"])',
        },
        notes: { type: 'string' },
      },
    },
  },
  {
    name: 'update_pathfinder',
    description:
      'Atualiza dados cadastrais, unidade ou classes matriculadas de um desbravador existente.',
    category: 'CADASTRO',
    inputSchema: {
      type: 'object',
      required: ['pathfinderId'],
      properties: {
        pathfinderId: { type: 'string', description: 'ID do desbravador' },
        name: { type: 'string' },
        birth_date: { type: 'string' },
        gender: { type: 'string', enum: ['M', 'F'] },
        unit_id: { type: 'string' },
        email: { type: 'string' },
        class_slugs: { type: 'array', items: { type: 'string' } },
        notes: { type: 'string' },
      },
    },
  },
  {
    name: 'update_requirement_progress',
    description:
      'Atualiza ou aprova o status de um requisito (PENDENTE, EM_ANDAMENTO, CONCLUIDO, APROVADO) para um desbravador.',
    category: 'PROGRESSO',
    inputSchema: {
      type: 'object',
      required: ['pathfinderId', 'requirementId', 'status'],
      properties: {
        pathfinderId: { type: 'string', description: 'ID do desbravador' },
        requirementId: { type: 'string', description: 'ID do requisito (ex: amigo-I-1)' },
        status: {
          type: 'string',
          enum: ['PENDENTE', 'EM_ANDAMENTO', 'CONCLUIDO', 'APROVADO'],
        },
        notes: { type: 'string', description: 'Observação da aprovação ou acompanhamento' },
      },
    },
  },
  {
    name: 'bulk_approve_requirements',
    description:
      'Assina ou atualiza em lote um ou mais requisitos para vários desbravadores de uma vez.',
    category: 'PROGRESSO',
    inputSchema: {
      type: 'object',
      required: ['requirementIds', 'pathfinderIds', 'status'],
      properties: {
        requirementIds: {
          type: 'array',
          items: { type: 'string' },
          description: 'Lista de IDs dos requisitos',
        },
        pathfinderIds: {
          type: 'array',
          items: { type: 'string' },
          description: 'Lista de IDs dos desbravadores',
        },
        status: {
          type: 'string',
          enum: ['PENDENTE', 'EM_ANDAMENTO', 'CONCLUIDO', 'APROVADO'],
          default: 'APROVADO',
        },
        notes: { type: 'string' },
      },
    },
  },
  {
    name: 'get_unification_opportunities',
    description:
      'Identifica oportunidades de unificação automática (desbravadores que já cumpriram um requisito equivalente a outro ainda pendente) e recomendações de unificação entre classes.',
    category: 'PLANEJAMENTO',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'apply_unification_sync',
    description:
      'Aprova automaticamente os requisitos equivalentes pendentes para desbravadores que já concluíram/aprovaram um requisito do mesmo grupo de unificação.',
    category: 'PROGRESSO',
    inputSchema: {
      type: 'object',
      properties: {
        pathfinderId: {
          type: 'string',
          description: 'Opcional: ID de um desbravador específico (se omitido, sincroniza todos os alertas pendentes)',
        },
      },
    },
  },
  {
    name: 'update_equivalence_group',
    description:
      'Cria ou edita um grupo de unificação (equivalência) entre requisitos de classes diferentes ou da mesma classe.',
    category: 'PLANEJAMENTO',
    inputSchema: {
      type: 'object',
      required: ['code', 'title', 'requirementIds'],
      properties: {
        code: { type: 'string', description: 'Código único do grupo (ex: EQ-CUSTOM-01)' },
        title: { type: 'string', description: 'Título descritivo da unificação' },
        description: { type: 'string', description: 'Regra de como uma única atividade cumpre todos os requisitos do grupo' },
        requirementIds: {
          type: 'array',
          items: { type: 'string' },
          description: 'IDs dos requisitos que fazem parte desta unificação',
        },
      },
    },
  },
  {
    name: 'list_events',
    description: 'Lista os eventos e atividades em lote planejados ou executados pelo clube.',
    category: 'EVENTOS',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'create_event',
    description: 'Cria um novo evento/acampamento/reunião vinculado a requisitos e desbravadores.',
    category: 'EVENTOS',
    inputSchema: {
      type: 'object',
      required: ['title', 'scheduled_date'],
      properties: {
        title: { type: 'string' },
        description: { type: 'string' },
        event_type: {
          type: 'string',
          enum: ['REUNIAO', 'ACAMPAMENTO', 'CAMINHADA', 'PROJETO_COMUNITARIO', 'ESPECIALIDADE', 'INVESTIDURA'],
          default: 'REUNIAO',
        },
        location: { type: 'string' },
        scheduled_date: { type: 'string', description: 'Data YYYY-MM-DD' },
        requirement_ids: { type: 'array', items: { type: 'string' } },
        attendee_ids: { type: 'array', items: { type: 'string' } },
      },
    },
  },
  {
    name: 'execute_event',
    description:
      'Executa um evento planejado, aprovando automaticamente os requisitos vinculados para todos os desbravadores presentes.',
    category: 'EVENTOS',
    inputSchema: {
      type: 'object',
      required: ['eventId'],
      properties: {
        eventId: { type: 'string', description: 'ID do evento' },
        statusToApply: {
          type: 'string',
          enum: ['CONCLUIDO', 'APROVADO'],
          default: 'APROVADO',
        },
      },
    },
  },
  {
    name: 'get_pdf_link',
    description:
      'Obtém o link direto de visualização e download de qualquer PDF do sistema (Controle do Instrutor, Ficha do Desbravador Simplificada/Completa, Planejamento Anual ou Matriz da Classe).',
    category: 'PDF',
    inputSchema: {
      type: 'object',
      required: ['docType'],
      properties: {
        docType: {
          type: 'string',
          enum: ['INSTRUCTOR_CONTROL', 'PF_CARD', 'PLANNING', 'MATRIX'],
          description: 'Tipo do PDF desejado',
        },
        classSlug: {
          type: 'string',
          description: 'Para INSTRUCTOR_CONTROL ou MATRIX: amigo, companheiro, pesquisador, pioneiro, excursionista ou guia',
        },
        instructorId: {
          type: 'string',
          description: 'Opcional: ID do instrutor para filtrar apenas a turma dele no PDF',
        },
        pathfinderId: {
          type: 'string',
          description: 'Para PF_CARD: ID do desbravador',
        },
        mode: {
          type: 'string',
          description:
            'Para PF_CARD: simplified ou full | Para PLANNING: activities ou equivalences | Para MATRIX: BOTH, REGULAR ou AVANCADA',
        },
        unitId: {
          type: 'string',
          description: 'Opcional: ID da unidade ou ALL',
        },
      },
    },
  },
];

function hashMcpApiKey(rawKey) {
  return crypto.createHash('sha256').update(String(rawKey)).digest('hex');
}

function getEffectiveEquivalenceData(targetDb) {
  const metadata = loadCardsMetadata();
  const baseGroups = {};
  const rawEq = metadata.equivalence_groups || [];
  if (Array.isArray(rawEq)) {
    for (const eq of rawEq) {
      const code = eq.id || eq.code;
      if (code) baseGroups[code] = { ...eq, id: code, code };
    }
  } else if (rawEq && typeof rawEq === 'object') {
    for (const [k, v] of Object.entries(rawEq)) {
      const code = v?.id || v?.code || k;
      baseGroups[code] = { ...v, id: code, code };
    }
  }

  const settings = targetDb.prepare('SELECT equivalences_override_json FROM club_settings WHERE id = 1').get();
  let overrides = { groups: {}, reqMap: {} };
  try {
    if (settings?.equivalences_override_json) {
      const parsed = JSON.parse(settings.equivalences_override_json);
      overrides = {
        groups: parsed.groups || {},
        reqMap: parsed.reqMap || {},
      };
    }
  } catch {}

  const mergedGroups = { ...baseGroups };
  for (const [k, v] of Object.entries(overrides.groups)) {
    if (v && v.deleted) {
      delete mergedGroups[k];
    } else if (v) {
      mergedGroups[k] = { ...mergedGroups[k], ...v, id: k, code: k };
    }
  }
  return { mergedGroups, reqMapOverrides: overrides.reqMap, rawOverrides: overrides };
}

function computeUnificationAlerts(targetDb) {
  const { mergedGroups, reqMapOverrides } = getEffectiveEquivalenceData(targetDb);
  const reqs = targetDb.prepare(`
    SELECT r.id, r.code, r.title, r.description, r.class_slug, r.base_class_slug, r.equivalence_group, c.name as class_name
    FROM requirements_catalog r
    JOIN classes_catalog c ON c.slug = r.class_slug
  `).all();

  const reqById = {};
  const reqsByGroup = {};
  for (const r of reqs) {
    const eqCode =
      reqMapOverrides[r.id] !== undefined ? reqMapOverrides[r.id] : r.equivalence_group;
    const effective = { ...r, equivalence_group: eqCode || '' };
    reqById[r.id] = effective;
    if (effective.equivalence_group && mergedGroups[effective.equivalence_group]) {
      if (!reqsByGroup[effective.equivalence_group]) {
        reqsByGroup[effective.equivalence_group] = [];
      }
      reqsByGroup[effective.equivalence_group].push(effective);
    }
  }

  const pfs = targetDb.prepare(`
    SELECT p.id, p.name, p.unit_id, u.name as unit_name
    FROM pathfinders p
    LEFT JOIN units u ON u.id = p.unit_id
    WHERE p.active = 1
    ORDER BY p.name ASC
  `).all();
  const enrollments = targetDb.prepare('SELECT pathfinder_id, class_slug FROM class_enrollments').all();
  const progress = targetDb.prepare('SELECT pathfinder_id, requirement_id, status FROM progress_records').all();

  const enrolledMap = {};
  for (const e of enrollments) {
    if (!enrolledMap[e.pathfinder_id]) enrolledMap[e.pathfinder_id] = new Set();
    enrolledMap[e.pathfinder_id].add(e.class_slug);
  }

  const progMap = {};
  for (const p of progress) {
    progMap[`${p.pathfinder_id}:${p.requirement_id}`] = p.status;
  }

  const alerts = [];
  for (const pf of pfs) {
    const pfClasses = enrolledMap[pf.id] || new Set();
    for (const [eqCode, groupReqs] of Object.entries(reqsByGroup)) {
      if (groupReqs.length < 2) continue;
      const relevantReqs = groupReqs.filter((r) => pfClasses.has(r.class_slug));
      if (relevantReqs.length < 2) continue;

      const doneReqs = relevantReqs.filter((r) => {
        const st = progMap[`${pf.id}:${r.id}`] || 'PENDENTE';
        return st === 'APROVADO' || st === 'CONCLUIDO';
      });
      const pendingReqs = relevantReqs.filter((r) => {
        const st = progMap[`${pf.id}:${r.id}`] || 'PENDENTE';
        return st === 'PENDENTE' || st === 'EM_ANDAMENTO';
      });

      if (doneReqs.length > 0 && pendingReqs.length > 0) {
        const sourceReq = doneReqs[0];
        const sourceStatus = progMap[`${pf.id}:${sourceReq.id}`];
        const eqTitle = mergedGroups[eqCode]?.title || eqCode;
        for (const targetReq of pendingReqs) {
          alerts.push({
            id: `${pf.id}:${eqCode}:${targetReq.id}`,
            pathfinder_id: pf.id,
            pathfinderId: pf.id,
            pathfinder_name: pf.name,
            pathfinderName: pf.name,
            unit_id: pf.unit_id,
            unitId: pf.unit_id,
            unit_name: pf.unit_name || 'Sem Unidade',
            unitName: pf.unit_name || 'Sem Unidade',
            equivalence_code: eqCode,
            equivalenceCode: eqCode,
            equivalence_title: eqTitle,
            equivalenceTitle: eqTitle,
            completed_requirement_id: sourceReq.id,
            sourceRequirementId: sourceReq.id,
            completed_requirement_code: sourceReq.code,
            sourceRequirementCode: sourceReq.code,
            completed_requirement_title: sourceReq.description || sourceReq.title,
            sourceRequirementTitle: sourceReq.description || sourceReq.title,
            completed_class_name: sourceReq.class_name,
            sourceClassName: sourceReq.class_name,
            sourceStatus,
            pending_requirement_id: targetReq.id,
            targetRequirementId: targetReq.id,
            pending_requirement_code: targetReq.code,
            targetRequirementCode: targetReq.code,
            pending_requirement_title: targetReq.description || targetReq.title,
            targetRequirementTitle: targetReq.description || targetReq.title,
            pending_class_slug: targetReq.class_slug,
            targetClassSlug: targetReq.class_slug,
            pending_class_name: targetReq.class_name,
            targetClassName: targetReq.class_name,
          });
        }
      }
    }
  }

  return alerts;
}

async function executeMcpTool(toolName, args = {}, authContext = {}, targetDb = db) {
  const user = authContext.user;
  if (!user) {
    throw new Error('Usuário MCP não autenticado.');
  }

  const allowedTools = authContext.allowedTools || ['*'];
  if (!allowedTools.includes('*') && !allowedTools.includes(toolName)) {
    throw new Error(`Esta chave MCP não possui permissão para executar a ferramenta "${toolName}".`);
  }

  const perms = getUserPermissions(user);
  const baseUrl = (authContext.baseUrl || 'https://137.131.209.239.nip.io').replace(/\/$/, '');

  if (toolName === 'get_club_summary') {
    const settings = targetDb.prepare('SELECT * FROM club_settings WHERE id = 1').get() || {};
    const totalPfs = targetDb.prepare('SELECT COUNT(*) as c FROM pathfinders WHERE active = 1').get().c;
    const totalUnits = targetDb.prepare('SELECT COUNT(*) as c FROM units WHERE active = 1').get().c;
    const statusCounts = targetDb
      .prepare('SELECT status, COUNT(*) as c FROM progress_records GROUP BY status')
      .all();
    const unificationAlerts = computeUnificationAlerts(targetDb);

    return {
      clubName: settings.club_name || 'Clube de Desbravadores',
      region: settings.club_region || '',
      investitureDate: settings.investiture_date || '2026-11-28',
      totalPathfinders: totalPfs,
      totalUnits,
      progressBreakdown: statusCounts,
      pendingUnificationAlertsCount: unificationAlerts.length,
      unificationAlertsPreview: unificationAlerts.slice(0, 10),
    };
  }

  if (toolName === 'list_pathfinders') {
    const pfs = targetDb.prepare(`
      SELECT p.*, u.name as unit_name
      FROM pathfinders p
      LEFT JOIN units u ON u.id = p.unit_id
      WHERE p.active = 1
      ORDER BY p.name ASC
    `).all();
    const enrollments = targetDb.prepare('SELECT * FROM class_enrollments').all();
    const reqCounts = targetDb
      .prepare('SELECT class_slug, COUNT(*) as total FROM requirements_catalog GROUP BY class_slug')
      .all();
    const totalByClass = Object.fromEntries(reqCounts.map((r) => [r.class_slug, r.total]));
    const doneRows = targetDb
      .prepare(`
        SELECT pr.pathfinder_id, r.class_slug, COUNT(*) as done
        FROM progress_records pr
        JOIN requirements_catalog r ON r.id = pr.requirement_id
        WHERE pr.status IN ('CONCLUIDO', 'APROVADO')
        GROUP BY pr.pathfinder_id, r.class_slug
      `)
      .all();
    const doneMap = {};
    for (const d of doneRows) {
      doneMap[`${d.pathfinder_id}:${d.class_slug}`] = d.done;
    }

    let result = pfs.map((p) => {
      const pfEnrolls = enrollments
        .filter((e) => e.pathfinder_id === p.id)
        .map((e) => {
          const tot = totalByClass[e.class_slug] || 1;
          const dn = doneMap[`${p.id}:${e.class_slug}`] || 0;
          return {
            class_slug: e.class_slug,
            done: dn,
            total: tot,
            percent: Math.round((dn / tot) * 100),
          };
        });
      return {
        id: p.id,
        name: p.name,
        birth_date: p.birth_date,
        gender: p.gender,
        unit_id: p.unit_id,
        unit_name: p.unit_name || 'Sem Unidade',
        classes: pfEnrolls,
      };
    });

    if (args.unitId) {
      result = result.filter((p) => p.unit_id === args.unitId);
    }
    if (args.classSlug) {
      const slug = args.classSlug.toLowerCase();
      result = result.filter((p) =>
        p.classes.some((c) => c.class_slug === slug || c.class_slug.replace('-avancado', '') === slug)
      );
    }
    if (args.search) {
      const q = args.search.toLowerCase();
      result = result.filter((p) => p.name.toLowerCase().includes(q));
    }

    return { count: result.length, pathfinders: result };
  }

  if (toolName === 'create_pathfinder') {
    const requestedClasses =
      Array.isArray(args.class_slugs) && args.class_slugs.length > 0
        ? args.class_slugs
        : ['amigo', 'amigo-avancado'];

    const canCreate =
      ['ADMIN', 'GESTOR', 'DIRETOR', 'SECRETARIO'].includes(user.role) ||
      perms.can_manage_pathfinders ||
      (user.role === 'INSTRUTOR' && requestedClasses.every((c) => hasClassAccess(user, c))) ||
      (user.role === 'CONSELHEIRO' && args.unit_id && hasUnitAccess(user, args.unit_id));

    if (!canCreate) {
      throw new Error('Seu perfil não possui permissão para cadastrar desbravadores fora do seu escopo.');
    }

    const id = `dbv-${crypto.randomUUID().slice(0, 8)}`;
    const now = new Date().toISOString();
    targetDb
      .prepare(
        `INSERT INTO pathfinders (id, name, email, birth_date, gender, unit_id, notes, active, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?)`
      )
      .run(
        id,
        args.name.trim(),
        (args.email || '').trim().toLowerCase(),
        args.birth_date,
        args.gender || 'M',
        args.unit_id || null,
        args.notes || '',
        now
      );

    const insertEnrollment = targetDb.prepare(`
      INSERT INTO class_enrollments (id, pathfinder_id, class_slug, year, is_grouped_card, status, enrolled_at)
      VALUES (?, ?, ?, 2026, 0, 'EM_ANDAMENTO', ?)
      ON CONFLICT(pathfinder_id, class_slug, year) DO NOTHING
    `);
    for (const cSlug of requestedClasses) {
      insertEnrollment.run(crypto.randomUUID(), id, cSlug, now);
    }

    recordAudit({
      user,
      action: 'MCP_CREATE_PATHFINDER',
      entityType: 'PATHFINDER',
      entityId: id,
      summary: `[MCP] Desbravador "${args.name}" cadastrado nas classes: ${requestedClasses.join(', ')}`,
    });

    schedulePdfWarmup(targetDb);
    return { created: true, pathfinderId: id, name: args.name, classes: requestedClasses };
  }

  if (toolName === 'update_pathfinder') {
    const existing = targetDb.prepare('SELECT * FROM pathfinders WHERE id = ?').get(args.pathfinderId);
    if (!existing) throw new Error('Desbravador não encontrado.');

    targetDb
      .prepare(
        `UPDATE pathfinders
         SET name = ?, birth_date = ?, gender = ?, unit_id = ?, email = ?, notes = ?
         WHERE id = ?`
      )
      .run(
        args.name || existing.name,
        args.birth_date || existing.birth_date,
        args.gender || existing.gender,
        args.unit_id !== undefined ? args.unit_id : existing.unit_id,
        args.email !== undefined ? args.email : existing.email || '',
        args.notes !== undefined ? args.notes : existing.notes || '',
        args.pathfinderId
      );

    if (Array.isArray(args.class_slugs) && args.class_slugs.length > 0) {
      const now = new Date().toISOString();
      targetDb.prepare('DELETE FROM class_enrollments WHERE pathfinder_id = ?').run(args.pathfinderId);
      const ins = targetDb.prepare(`
        INSERT INTO class_enrollments (id, pathfinder_id, class_slug, year, is_grouped_card, status, enrolled_at)
        VALUES (?, ?, ?, 2026, 0, 'EM_ANDAMENTO', ?)
      `);
      for (const s of args.class_slugs) {
        ins.run(crypto.randomUUID(), args.pathfinderId, s, now);
      }
    }

    schedulePdfWarmup(targetDb);
    return { updated: true, pathfinderId: args.pathfinderId };
  }

  if (toolName === 'update_requirement_progress') {
    const pf = targetDb.prepare('SELECT * FROM pathfinders WHERE id = ?').get(args.pathfinderId);
    const req = targetDb.prepare('SELECT * FROM requirements_catalog WHERE id = ?').get(args.requirementId);
    if (!pf || !req) {
      throw new Error('Desbravador ou requisito não encontrado.');
    }

    const clubSettings = targetDb.prepare('SELECT * FROM club_settings WHERE id = 1').get();
    const perm = checkProgressPermission(user, pf, req.class_slug, args.status, clubSettings);
    if (!perm.allowed) {
      throw new Error(perm.reason);
    }

    const effectiveStatus = perm.effectiveStatus;
    const now = new Date().toISOString();
    const subItems = JSON.parse(req.sub_items_json || '[]');
    const completedSubs =
      effectiveStatus === 'CONCLUIDO' || effectiveStatus === 'APROVADO'
        ? subItems.map((s) => s.code || s.key)
        : [];

    const existing = targetDb
      .prepare('SELECT * FROM progress_records WHERE pathfinder_id = ? AND requirement_id = ?')
      .get(pf.id, req.id);

    targetDb
      .prepare(
        `INSERT INTO progress_records (
          id, pathfinder_id, requirement_id, status, completed_sub_items_json,
          notes, completed_at, marked_by_user_id, marked_by_name,
          approved_by_user_id, approved_by_name, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(pathfinder_id, requirement_id) DO UPDATE SET
          status = excluded.status,
          completed_sub_items_json = excluded.completed_sub_items_json,
          notes = excluded.notes,
          completed_at = excluded.completed_at,
          marked_by_user_id = excluded.marked_by_user_id,
          marked_by_name = excluded.marked_by_name,
          approved_by_user_id = excluded.approved_by_user_id,
          approved_by_name = excluded.approved_by_name,
          updated_at = excluded.updated_at`
      )
      .run(
        existing?.id || crypto.randomUUID(),
        pf.id,
        req.id,
        effectiveStatus,
        JSON.stringify(completedSubs),
        args.notes || '',
        effectiveStatus === 'PENDENTE' ? null : now.slice(0, 10),
        user.id,
        user.name,
        effectiveStatus === 'APROVADO' ? user.id : null,
        effectiveStatus === 'APROVADO' ? user.name : null,
        now
      );

    recordAudit({
      user,
      actionType: 'PROGRESS_UPDATE',
      entityType: 'progress_record',
      entityId: `${pf.id}:${req.id}`,
      summary: `[MCP] ${pf.name} • ${req.class_slug.toUpperCase()} ${req.code} → ${effectiveStatus}`,
      beforeData: existing || { status: 'PENDENTE' },
      afterData: { status: effectiveStatus, notes: args.notes || '' },
      targetDb,
    });

    if (!args._skipWarmup) {
      schedulePdfWarmup(targetDb);
    }
    return {
      updated: true,
      pathfinderName: pf.name,
      requirementCode: req.code,
      requirementTitle: req.title,
      effectiveStatus,
    };
  }

  if (toolName === 'bulk_approve_requirements') {
    const reqIds = Array.isArray(args.requirementIds) ? args.requirementIds : [];
    const pfIds = Array.isArray(args.pathfinderIds) ? args.pathfinderIds : [];
    const status = args.status || 'APROVADO';
    let updatedCount = 0;

    for (const pfId of pfIds) {
      for (const reqId of reqIds) {
        await executeMcpTool(
          'update_requirement_progress',
          {
            pathfinderId: pfId,
            requirementId: reqId,
            status,
            notes: args.notes || 'Aprovado em lote via MCP',
            _skipWarmup: true,
          },
          authContext,
          targetDb
        );
        updatedCount++;
      }
    }
    if (updatedCount > 0) schedulePdfWarmup(targetDb);
    return { updated: true, updatedCount };
  }

  if (toolName === 'get_unification_opportunities') {
    const alerts = computeUnificationAlerts(targetDb);
    const { mergedGroups } = getEffectiveEquivalenceData(targetDb);
    return {
      alertsCount: alerts.length,
      alerts,
      totalEquivalenceGroups: Object.keys(mergedGroups).length,
      equivalenceGroups: mergedGroups,
    };
  }

  if (toolName === 'apply_unification_sync') {
    let alerts = computeUnificationAlerts(targetDb);
    if (args.pathfinderId) {
      alerts = alerts.filter((a) => a.pathfinderId === args.pathfinderId);
    }
    let syncedCount = 0;
    for (const alert of alerts) {
      await executeMcpTool(
        'update_requirement_progress',
        {
          pathfinderId: alert.pathfinderId,
          requirementId: alert.targetRequirementId,
          status: alert.sourceStatus || 'APROVADO',
          notes: `Unificado automaticamente via equivalência (${alert.equivalenceTitle} — ${alert.sourceClassName} ${alert.sourceRequirementCode})`,
          _skipWarmup: true,
        },
        authContext,
        targetDb
      );
      syncedCount++;
    }
    if (syncedCount > 0) schedulePdfWarmup(targetDb);
    return { synced: true, syncedCount, details: alerts };
  }

  if (toolName === 'update_equivalence_group') {
    const canEdit =
      ['ADMIN', 'GESTOR', 'DIRETOR'].includes(user.role) || perms.can_edit_equivalences;
    if (!canEdit) {
      throw new Error('Apenas Diretor, Gestor ou líderes autorizados podem editar unificações.');
    }

    const { rawOverrides } = getEffectiveEquivalenceData(targetDb);
    const code = String(args.code).trim().toUpperCase();
    rawOverrides.groups[code] = {
      id: code,
      code,
      title: args.title,
      description: args.description || 'Unificação personalizada da diretoria.',
      is_custom: true,
    };

    if (Array.isArray(args.requirementIds)) {
      const selectedSet = new Set(args.requirementIds);
      const prevReqs = targetDb
        .prepare('SELECT id FROM requirements_catalog WHERE equivalence_group = ?')
        .all(code);
      for (const r of prevReqs) {
        if (!selectedSet.has(r.id)) {
          rawOverrides.reqMap[r.id] = '';
          targetDb
            .prepare("UPDATE requirements_catalog SET equivalence_group = '' WHERE id = ?")
            .run(r.id);
        }
      }
      for (const rId of args.requirementIds) {
        rawOverrides.reqMap[rId] = code;
        targetDb
          .prepare('UPDATE requirements_catalog SET equivalence_group = ? WHERE id = ?')
          .run(code, rId);
      }
    }

    targetDb
      .prepare('UPDATE club_settings SET equivalences_override_json = ?, updated_at = ? WHERE id = 1')
      .run(JSON.stringify(rawOverrides), new Date().toISOString());

    schedulePdfWarmup(targetDb);
    return { saved: true, group: rawOverrides.groups[code], requirementIds: args.requirementIds };
  }

  if (toolName === 'list_events') {
    const events = targetDb
      .prepare('SELECT * FROM activity_events ORDER BY scheduled_date ASC')
      .all();
    return { count: events.length, events };
  }

  if (toolName === 'create_event') {
    const id = `evt-${crypto.randomUUID().slice(0, 8)}`;
    const now = new Date().toISOString();
    targetDb
      .prepare(
        `INSERT INTO activity_events (
          id, title, description, event_type, location, scheduled_date,
          status, notes, created_by_user_id, created_by_name, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, 'PLANEJADO', ?, ?, ?, ?)`
      )
      .run(
        id,
        args.title,
        args.description || '',
        args.event_type || 'REUNIAO',
        args.location || '',
        args.scheduled_date,
        args.notes || '',
        user.id,
        user.name,
        now
      );

    if (Array.isArray(args.requirement_ids)) {
      const insReq = targetDb.prepare(
        'INSERT OR IGNORE INTO activity_event_requirements (event_id, requirement_id) VALUES (?, ?)'
      );
      for (const rId of args.requirement_ids) insReq.run(id, rId);
    }
    if (Array.isArray(args.attendee_ids)) {
      const insAtt = targetDb.prepare(
        'INSERT OR IGNORE INTO activity_event_attendees (event_id, pathfinder_id, attended) VALUES (?, ?, 1)'
      );
      for (const pId of args.attendee_ids) insAtt.run(id, pId);
    }

    return { created: true, eventId: id, title: args.title, scheduled_date: args.scheduled_date };
  }

  if (toolName === 'execute_event') {
    const evt = targetDb.prepare('SELECT * FROM activity_events WHERE id = ?').get(args.eventId);
    if (!evt) throw new Error('Evento não encontrado.');
    const reqIds = targetDb
      .prepare('SELECT requirement_id FROM activity_event_requirements WHERE event_id = ?')
      .all(args.eventId)
      .map((r) => r.requirement_id);
    const pfIds = targetDb
      .prepare('SELECT pathfinder_id FROM activity_event_attendees WHERE event_id = ? AND attended = 1')
      .all(args.eventId)
      .map((p) => p.pathfinder_id);

    const statusToApply = args.statusToApply || 'APROVADO';
    let applied = 0;
    for (const pfId of pfIds) {
      for (const reqId of reqIds) {
        await executeMcpTool(
          'update_requirement_progress',
          {
            pathfinderId: pfId,
            requirementId: reqId,
            status: statusToApply,
            notes: `Concluído no evento: ${evt.title}`,
            _skipWarmup: true,
          },
          authContext,
          targetDb
        );
        applied++;
      }
    }

    targetDb
      .prepare("UPDATE activity_events SET status = 'REALIZADO', executed_at = ? WHERE id = ?")
      .run(new Date().toISOString(), args.eventId);

    if (applied > 0) schedulePdfWarmup(targetDb);
    return { executed: true, eventTitle: evt.title, recordsUpdated: applied };
  }

  if (toolName === 'get_pdf_link') {
    const docType = args.docType || 'INSTRUCTOR_CONTROL';
    let params = {};
    if (docType === 'INSTRUCTOR_CONTROL') {
      params = {
        classSlug: (args.classSlug || 'amigo').toLowerCase(),
        unitId: args.unitId || 'ALL',
        instructorId: args.instructorId || 'ALL',
      };
    } else if (docType === 'PF_CARD') {
      let pfId = args.pathfinderId;
      let pfName = '';
      if (!pfId) {
        const firstPf = targetDb.prepare('SELECT id, name FROM pathfinders WHERE active = 1 LIMIT 1').get();
        pfId = firstPf?.id;
        pfName = firstPf?.name || 'Desbravador';
      } else {
        const pfRow = targetDb.prepare('SELECT name FROM pathfinders WHERE id = ?').get(pfId);
        pfName = pfRow?.name || 'Desbravador';
      }
      params = {
        pathfinderId: pfId,
        pathfinderName: pfName,
        mode: args.mode || 'simplified',
      };
    } else if (docType === 'PLANNING') {
      params = {
        mode: args.mode || 'activities',
        unitId: args.unitId || 'ALL',
      };
    } else if (docType === 'MATRIX') {
      params = {
        classSlug: (args.classSlug || 'amigo').toLowerCase(),
        mode: args.mode || 'BOTH',
        unitId: args.unitId || 'ALL',
        instructorId: args.instructorId || 'ALL',
      };
    }

    const record = await resolvePdfRecord({ docType, params, dbInstance: targetDb });
    return {
      docType,
      token: record.id,
      fileName: record.file_name,
      viewUrl: `${baseUrl}/api/pdf/v/${record.id}`,
      downloadUrl: `${baseUrl}/api/pdf/d/${record.id}`,
    };
  }

  throw new Error(`Ferramenta MCP desconhecida: ${toolName}`);
}

/**
 * Assistente IA Integrado: interpreta comandos em linguagem natural da Diretoria/Gestor
 * e aciona automaticamente as ferramentas MCP correspondentes.
 */
async function processMcpChatCommand({ prompt, user, targetDb = db, baseUrl = '' }) {
  const text = String(prompt || '').trim();
  const lower = text.toLowerCase();
  const authContext = { user, allowedTools: ['*'], baseUrl };

  const slugMap = {
    amigo: 'amigo',
    companheiro: 'companheiro',
    pesquisador: 'pesquisador',
    pioneiro: 'pioneiro',
    excursionista: 'excursionista',
    guia: 'guia',
  };
  let detectedSlug = null;
  for (const [word, slug] of Object.entries(slugMap)) {
    if (lower.includes(word)) {
      detectedSlug = slug;
      break;
    }
  }

  // 1. Solicitações de PDF / Download / Link
  if (lower.includes('pdf') || lower.includes('download') || lower.includes('ficha') || lower.includes('controle') || lower.includes('imprimir')) {
    if (lower.includes('planejamento') || lower.includes('anual')) {
      const mode = lower.includes('unifica') || lower.includes('equival') ? 'equivalences' : 'activities';
      const pdf = await executeMcpTool('get_pdf_link', { docType: 'PLANNING', mode }, authContext, targetDb);
      return {
        reply: `Aqui está o PDF atualizado do **Planejamento Anual (${mode === 'equivalences' ? 'Unificações' : 'Por Atividade'})**:`,
        toolUsed: 'get_pdf_link',
        pdfLinks: [pdf],
        data: pdf,
      };
    }

    if (lower.includes('ficha') || lower.includes('cartão') || lower.includes('cartao')) {
      const allPfs = targetDb.prepare('SELECT id, name FROM pathfinders WHERE active = 1').all();
      const matchedPf =
        allPfs.find((p) => lower.includes(p.name.toLowerCase().split(' ')[0])) || allPfs[0];
      const mode = lower.includes('complet') ? 'full' : 'simplified';
      if (matchedPf) {
        const pdf = await executeMcpTool(
          'get_pdf_link',
          { docType: 'PF_CARD', pathfinderId: matchedPf.id, mode },
          authContext,
          targetDb
        );
        return {
          reply: `Gerei o link direto da **Ficha ${mode === 'full' ? 'Completa' : 'Simplificada'}** de **${matchedPf.name}**:`,
          toolUsed: 'get_pdf_link',
          pdfLinks: [pdf],
          data: pdf,
        };
      }
    }

    if (lower.includes('matriz')) {
      const cls = detectedSlug || 'amigo';
      const pdf = await executeMcpTool(
        'get_pdf_link',
        { docType: 'MATRIX', classSlug: cls },
        authContext,
        targetDb
      );
      return {
        reply: `Aqui está o PDF da **Matriz da Classe (${cls.toUpperCase()})**:`,
        toolUsed: 'get_pdf_link',
        pdfLinks: [pdf],
        data: pdf,
      };
    }

    const cls = detectedSlug || 'amigo';
    const pdf = await executeMcpTool(
      'get_pdf_link',
      { docType: 'INSTRUCTOR_CONTROL', classSlug: cls },
      authContext,
      targetDb
    );
    return {
      reply: `Aqui está o link do **PDF Controle do Instrutor (1 Página)** da classe **${cls.toUpperCase()}**:`,
      toolUsed: 'get_pdf_link',
      pdfLinks: [pdf],
      data: pdf,
    };
  }

  // 2. Sincronizar / Aprovar Unificações
  if (
    (lower.includes('sincroniz') || lower.includes('aplicar') || lower.includes('aprovar')) &&
    (lower.includes('unifica') || lower.includes('equival'))
  ) {
    const res = await executeMcpTool('apply_unification_sync', {}, authContext, targetDb);
    return {
      reply:
        res.syncedCount > 0
          ? `Sincronização concluída! **${res.syncedCount} requisito(s) equivalente(s)** foram aprovados automaticamente com base nas atividades já concluídas.`
          : 'Todos os requisitos equivalentes já estão sincronizados no momento!',
      toolUsed: 'apply_unification_sync',
      data: res,
    };
  }

  // 3. Consultar oportunidades de unificação
  if (lower.includes('unifica') || lower.includes('equival') || lower.includes('alerta')) {
    const res = await executeMcpTool('get_unification_opportunities', {}, authContext, targetDb);
    return {
      reply: `Encontrei **${res.alertsCount} oportunidade(s) de unificação automática** prontas para sincronizar e **${res.totalEquivalenceGroups} grupos de equivalência** ativos no clube.`,
      toolUsed: 'get_unification_opportunities',
      data: res,
    };
  }

  // 4. Cadastrar desbravador via chat (ex: "Cadastrar desbravador João Pedro nascido em 2015-05-10 na classe companheiro")
  if (lower.startsWith('cadastrar desbravador') || lower.startsWith('adicionar desbravador')) {
    const dateMatch = text.match(/(\d{4}-\d{2}-\d{2})/);
    const birthDate = dateMatch ? dateMatch[1] : '2015-05-10';
    const cleanName = text
      .replace(/^(cadastrar|adicionar)\s+desbravador(a)?\s+/i, '')
      .replace(/\s*(nascid[oa].*|na classe.*|\d{4}-\d{2}-\d{2}.*)/i, '')
      .trim();
    const cls = detectedSlug ? [detectedSlug, `${detectedSlug}-avancado`] : ['amigo', 'amigo-avancado'];
    if (cleanName) {
      const created = await executeMcpTool(
        'create_pathfinder',
        { name: cleanName, birth_date: birthDate, class_slugs: cls },
        authContext,
        targetDb
      );
      return {
        reply: `Desbravador **${created.name}** cadastrado com sucesso nas classes **${cls.join(', ')}**!`,
        toolUsed: 'create_pathfinder',
        data: created,
      };
    }
  }

  // 5. Listar desbravadores
  if (lower.includes('desbravador') || lower.includes('listar') || lower.includes('quem') || detectedSlug) {
    const res = await executeMcpTool(
      'list_pathfinders',
      { classSlug: detectedSlug || undefined },
      authContext,
      targetDb
    );
    return {
      reply: `Listando **${res.count} desbravador(es)**${detectedSlug ? ` da classe **${detectedSlug.toUpperCase()}**` : ''}:`,
      toolUsed: 'list_pathfinders',
      data: res,
    };
  }

  // 6. Eventos
  if (lower.includes('evento') || lower.includes('acampamento')) {
    const res = await executeMcpTool('list_events', {}, authContext, targetDb);
    return {
      reply: `O clube possui **${res.count} evento(s)** registrados no calendário:`,
      toolUsed: 'list_events',
      data: res,
    };
  }

  // Default: Resumo Geral do Clube
  const summary = await executeMcpTool('get_club_summary', {}, authContext, targetDb);
  return {
    reply: `Resumo atual do **${summary.clubName}**: **${summary.totalPathfinders} desbravadores** em **${summary.totalUnits} unidades**, com **${summary.pendingUnificationAlertsCount} alerta(s) de unificação** disponíveis.`,
    toolUsed: 'get_club_summary',
    data: summary,
  };
}

/**
 * Handler JSON-RPC 2.0 padrão Model Context Protocol (MCP)
 */
async function handleMcpJsonRpcRequest(rpcBody, authContext, targetDb = db) {
  const { jsonrpc = '2.0', id = null, method, params = {} } = rpcBody || {};

  try {
    if (method === 'initialize') {
      return {
        jsonrpc,
        id,
        result: {
          protocolVersion: '2024-11-05',
          capabilities: {
            tools: { listChanged: false },
          },
          serverInfo: {
            name: 'sgc-desbravadores-mcp',
            version: '2.0.0',
          },
        },
      };
    }

    if (method === 'notifications/initialized' || method === 'ping') {
      return { jsonrpc, id, result: {} };
    }

    if (method === 'tools/list') {
      const allowed = authContext.allowedTools || ['*'];
      const filteredTools = allowed.includes('*')
        ? MCP_TOOLS
        : MCP_TOOLS.filter((t) => allowed.includes(t.name));
      return {
        jsonrpc,
        id,
        result: {
          tools: filteredTools,
        },
      };
    }

    if (method === 'tools/call') {
      const toolName = params.name;
      const toolArgs = params.arguments || {};
      const output = await executeMcpTool(toolName, toolArgs, authContext, targetDb);
      return {
        jsonrpc,
        id,
        result: {
          content: [
            {
              type: 'text',
              text: JSON.stringify(output, null, 2),
            },
          ],
          isError: false,
        },
      };
    }

    return {
      jsonrpc,
      id,
      error: {
        code: -32601,
        message: `Método MCP não suportado: ${method}`,
      },
    };
  } catch (err) {
    return {
      jsonrpc,
      id,
      result: {
        content: [
          {
            type: 'text',
            text: `Erro ao executar ferramenta MCP: ${err.message}`,
          },
        ],
        isError: true,
      },
    };
  }
}

module.exports = {
  MCP_TOOLS,
  hashMcpApiKey,
  getEffectiveEquivalenceData,
  computeUnificationAlerts,
  executeMcpTool,
  processMcpChatCommand,
  handleMcpJsonRpcRequest,
};
