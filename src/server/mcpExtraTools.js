/**
 * Ferramentas MCP adicionais do SGC Classes • Desbravadores.
 * Cada ferramenta: { name, description, category, inputSchema, write, run(args, ctx) }.
 * ctx = { user, perms, db, baseUrl }.
 */
const crypto = require('node:crypto');
const { recordAudit, prodDb, testDb, isTestModeActive } = require('./db');
const { schedulePdfWarmup } = require('./pdfCache');
const {
  getEffectiveUnifications,
  computeAbsorptionRecommendations,
  applyAbsorptionApprovals,
  updateUnification,
  resetUnifications,
} = require('./unificationsHandler');

const BOARD = ['ADMIN', 'GESTOR', 'DIRETOR'];
const isBoard = (u) => BOARD.includes(u.role);
const obj = (properties = {}, required = []) => ({
  type: 'object',
  properties,
  ...(required.length ? { required } : {}),
});
const str = (description) => ({ type: 'string', description });
const strArr = (description) => ({ type: 'array', items: { type: 'string' }, description });

function need(cond, msg) {
  if (!cond) throw new Error(msg);
}

function classPercentMap(db) {
  const totals = Object.fromEntries(
    db.prepare('SELECT class_slug, COUNT(*) as t FROM requirements_catalog GROUP BY class_slug').all().map((r) => [r.class_slug, r.t])
  );
  const done = {};
  for (const r of db
    .prepare(
      `SELECT pr.pathfinder_id, rc.class_slug, COUNT(*) as d FROM progress_records pr
       JOIN requirements_catalog rc ON rc.id = pr.requirement_id
       WHERE pr.status IN ('CONCLUIDO','APROVADO') GROUP BY pr.pathfinder_id, rc.class_slug`
    )
    .all()) {
    done[`${r.pathfinder_id}:${r.class_slug}`] = r.d;
  }
  return { totals, done };
}

const EXTRA_TOOLS = [
  // ───────────────────────── LEITURA ─────────────────────────
  {
    name: 'list_units',
    description: 'Lista as unidades do clube com cor, gênero e quantidade de membros.',
    category: 'LEITURA',
    inputSchema: obj(),
    run: (a, { db }) => {
      const units = db
        .prepare(
          `SELECT u.*, (SELECT COUNT(*) FROM pathfinders p WHERE p.unit_id = u.id AND p.active = 1) as members
           FROM units u ORDER BY u.name`
        )
        .all();
      return { count: units.length, units };
    },
  },
  {
    name: 'list_classes',
    description: 'Lista o catálogo de classes (regulares e avançadas) com total de requisitos.',
    category: 'LEITURA',
    inputSchema: obj(),
    run: (a, { db }) => {
      const classes = db
        .prepare(
          `SELECT c.*, (SELECT COUNT(*) FROM requirements_catalog r WHERE r.class_slug = c.slug) as requirement_count
           FROM classes_catalog c ORDER BY c.display_order`
        )
        .all();
      return { count: classes.length, classes };
    },
  },
  {
    name: 'list_requirements',
    description: 'Lista requisitos do catálogo. Filtre por classe, seção ou texto. Retorna id, código, título, descrição e grupo de unificação.',
    category: 'LEITURA',
    inputSchema: obj({
      classSlug: str('Slug da classe (ex: amigo, amigo-avancado)'),
      sectionCode: str('Código da seção (ex: I, II)'),
      search: str('Texto a buscar no título/descrição'),
      limit: { type: 'number', description: 'Máximo de itens (padrão 200)' },
    }),
    run: (a, { db }) => {
      const where = [];
      const params = [];
      if (a.classSlug) { where.push('class_slug = ?'); params.push(a.classSlug); }
      if (a.sectionCode) { where.push('section_code = ?'); params.push(a.sectionCode); }
      if (a.search) { where.push('(title LIKE ? OR description LIKE ?)'); params.push(`%${a.search}%`, `%${a.search}%`); }
      const rows = db
        .prepare(
          `SELECT id, class_slug, section_code, section_name, code, title, description, category, equivalence_group
           FROM requirements_catalog ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
           ORDER BY class_slug, display_order LIMIT ?`
        )
        .all(...params, Math.min(Number(a.limit) || 200, 1000));
      return { count: rows.length, requirements: rows };
    },
  },
  {
    name: 'get_pathfinder',
    description: 'Retorna o cartão completo de um desbravador: dados, matrículas e status de cada requisito por classe.',
    category: 'LEITURA',
    inputSchema: obj({ pathfinderId: str('ID do desbravador') }, ['pathfinderId']),
    run: (a, { db }) => {
      const pf = db
        .prepare('SELECT p.*, u.name as unit_name FROM pathfinders p LEFT JOIN units u ON u.id = p.unit_id WHERE p.id = ?')
        .get(a.pathfinderId);
      need(pf, 'Desbravador não encontrado.');
      const enrollments = db.prepare('SELECT class_slug, year, status FROM class_enrollments WHERE pathfinder_id = ?').all(pf.id);
      const progress = db
        .prepare(
          `SELECT pr.requirement_id, pr.status, pr.notes, pr.completed_at, pr.approved_by_name, rc.class_slug, rc.code, rc.title
           FROM progress_records pr JOIN requirements_catalog rc ON rc.id = pr.requirement_id WHERE pr.pathfinder_id = ?`
        )
        .all(pf.id);
      const { totals, done } = classPercentMap(db);
      return {
        pathfinder: pf,
        classes: enrollments.map((e) => ({
          ...e,
          done: done[`${pf.id}:${e.class_slug}`] || 0,
          total: totals[e.class_slug] || 0,
          percent: Math.round(((done[`${pf.id}:${e.class_slug}`] || 0) / (totals[e.class_slug] || 1)) * 100),
        })),
        progress,
      };
    },
  },
  {
    name: 'get_class_progress',
    description: 'Matriz resumida de uma classe: cada desbravador matriculado com requisitos feitos/aprovados e percentual.',
    category: 'LEITURA',
    inputSchema: obj({ classSlug: str('Slug da classe'), unitId: str('Filtro opcional de unidade') }, ['classSlug']),
    run: (a, { db }) => {
      const { totals, done } = classPercentMap(db);
      const rows = db
        .prepare(
          `SELECT p.id, p.name, p.unit_id, u.name as unit_name FROM class_enrollments e
           JOIN pathfinders p ON p.id = e.pathfinder_id LEFT JOIN units u ON u.id = p.unit_id
           WHERE e.class_slug = ? AND p.active = 1 ${a.unitId ? 'AND p.unit_id = ?' : ''} ORDER BY p.name`
        )
        .all(...(a.unitId ? [a.classSlug, a.unitId] : [a.classSlug]));
      const total = totals[a.classSlug] || 0;
      return {
        classSlug: a.classSlug,
        totalRequirements: total,
        pathfinders: rows.map((r) => ({
          ...r,
          done: done[`${r.id}:${a.classSlug}`] || 0,
          percent: Math.round(((done[`${r.id}:${a.classSlug}`] || 0) / (total || 1)) * 100),
        })),
      };
    },
  },
  {
    name: 'list_pending_visto',
    description: 'Fila de "Visto": requisitos marcados como FEITO (CONCLUIDO) aguardando aprovação oficial do instrutor.',
    category: 'LEITURA',
    inputSchema: obj({ classSlug: str('Filtro opcional de classe') }),
    run: (a, { db }) => {
      const rows = db
        .prepare(
          `SELECT pr.pathfinder_id, p.name as pathfinder_name, pr.requirement_id, rc.class_slug, rc.code, rc.title,
                  pr.marked_by_name, pr.updated_at
           FROM progress_records pr JOIN pathfinders p ON p.id = pr.pathfinder_id
           JOIN requirements_catalog rc ON rc.id = pr.requirement_id
           WHERE pr.status = 'CONCLUIDO' ${a.classSlug ? 'AND rc.class_slug = ?' : ''} ORDER BY pr.updated_at DESC`
        )
        .all(...(a.classSlug ? [a.classSlug] : []));
      return { count: rows.length, pending: rows };
    },
  },
  {
    name: 'get_investiture_readiness',
    description: 'Lista desbravadores aptos à investidura (percentual mínimo em todas as classes matriculadas) e os que estão abaixo.',
    category: 'LEITURA',
    inputSchema: obj({ threshold: { type: 'number', description: 'Percentual mínimo (padrão 85)' } }),
    run: (a, { db }) => {
      const th = Number(a.threshold) || 85;
      const { totals, done } = classPercentMap(db);
      const pfs = db.prepare('SELECT id, name, unit_id FROM pathfinders WHERE active = 1 ORDER BY name').all();
      const enr = db.prepare('SELECT pathfinder_id, class_slug FROM class_enrollments').all();
      const out = pfs.map((p) => {
        const classes = enr.filter((e) => e.pathfinder_id === p.id).map((e) => ({
          class_slug: e.class_slug,
          percent: Math.round(((done[`${p.id}:${e.class_slug}`] || 0) / (totals[e.class_slug] || 1)) * 100),
        }));
        const min = classes.length ? Math.min(...classes.map((c) => c.percent)) : 0;
        return { ...p, classes, minPercent: min, ready: classes.length > 0 && min >= th };
      });
      return { threshold: th, ready: out.filter((o) => o.ready), notReady: out.filter((o) => !o.ready) };
    },
  },
  {
    name: 'list_leaders',
    description: 'Lista líderes/diretoria com cargo, escopos (classes/unidades) e poderes extras. Apenas Diretor/Gestor ou quem gerencia permissões.',
    category: 'LEITURA',
    inputSchema: obj(),
    run: (a, { db, user, perms }) => {
      need(isBoard(user) || perms.can_manage_permissions, 'Sem permissão para listar líderes.');
      const rows = db.prepare("SELECT * FROM users WHERE role != 'DESBRAVADOR' ORDER BY name").all();
      return {
        count: rows.length,
        leaders: rows.map((r) => ({
          id: r.id, name: r.name, email: r.email, role: r.role, custom_role_title: r.custom_role_title || '',
          unit_id: r.unit_id, active: Boolean(r.active),
          assigned_classes: JSON.parse(r.assigned_classes_json || '[]'),
          assigned_units: JSON.parse(r.assigned_units_json || '[]'),
          permissions: JSON.parse(r.permissions_json || '{}'),
          last_login_at: r.last_login_at,
        })),
      };
    },
  },
  {
    name: 'get_club_settings',
    description: 'Retorna as configurações do clube (nome, região, ano, investidura, regras). Segredos (senhas SMTP) nunca são retornados.',
    category: 'LEITURA',
    inputSchema: obj(),
    run: (a, { db }) => {
      const s = db.prepare('SELECT * FROM club_settings WHERE id = 1').get() || {};
      const { smtp_pass, equivalences_override_json, ...safe } = s;
      return { ...safe, smtp_pass_configured: Boolean(smtp_pass) };
    },
  },
  {
    name: 'list_audit_logs',
    description: 'Consulta a trilha de auditoria (quem fez o quê e quando).',
    category: 'AUDITORIA',
    inputSchema: obj({
      limit: { type: 'number', description: 'Máximo (padrão 50, máx 500)' },
      search: str('Texto no resumo'),
      action: str('Filtro por ação (ex: PROGRESS_UPDATE)'),
      entityType: str('Filtro por tipo de entidade'),
    }),
    run: (a, { db, user, perms }) => {
      need(isBoard(user) || user.role === 'SECRETARIO' || perms.can_manage_permissions, 'Sem permissão para ver a auditoria.');
      const where = [];
      const params = [];
      if (a.search) { where.push('summary LIKE ?'); params.push(`%${a.search}%`); }
      if (a.action) { where.push('action = ?'); params.push(a.action); }
      if (a.entityType) { where.push('entity_type = ?'); params.push(a.entityType); }
      const rows = db
        .prepare(
          `SELECT id, user_name, user_role, action, entity_type, entity_id, batch_id, summary, reverted, created_at
           FROM audit_logs ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY created_at DESC LIMIT ?`
        )
        .all(...params, Math.min(Number(a.limit) || 50, 500));
      return { count: rows.length, logs: rows };
    },
  },
  {
    name: 'list_feedback',
    description: 'Lista relatórios de feedback/bugs enviados pelos usuários.',
    category: 'AUDITORIA',
    inputSchema: obj({ limit: { type: 'number' }, status: str('NOVO, LIDO ou RESOLVIDO') }),
    run: (a, { db, user }) => {
      need(isBoard(user), 'Apenas Diretor/Gestor.');
      const rows = db
        .prepare(
          `SELECT id, user_name, user_email, category, message, url, status, created_at FROM feedback_reports
           ${a.status ? 'WHERE status = ?' : ''} ORDER BY created_at DESC LIMIT ?`
        )
        .all(...(a.status ? [a.status] : []), Math.min(Number(a.limit) || 50, 300));
      return { count: rows.length, reports: rows };
    },
  },
  {
    name: 'list_backups',
    description: 'Lista os pontos de restauração (snapshots SQLite) do servidor.',
    category: 'BACKUP',
    inputSchema: obj(),
    run: (a, { user }) => {
      need(isBoard(user), 'Apenas Diretor/Gestor.');
      const { listBackups } = require('./backup');
      const backups = listBackups();
      return { count: backups.length, backups };
    },
  },
  {
    name: 'list_unifications',
    description: 'Lista todas as unificações (grupos de equivalência oficiais U-01..U-40 e personalizados) com requisitos e níveis.',
    category: 'PLANEJAMENTO',
    inputSchema: obj(),
    run: (a, { db }) => getEffectiveUnifications(db),
  },
  {
    name: 'get_absorption_recommendations',
    description: 'Recomendações de aprovação por absorção: requisitos de nível superior já cumpridos que englobam requisitos pendentes.',
    category: 'PLANEJAMENTO',
    inputSchema: obj({ pathfinderId: str('Opcional: limitar a um desbravador') }),
    run: (a, { db }) => {
      const recs = computeAbsorptionRecommendations(db, a.pathfinderId || null);
      return { count: recs.length, recommendations: recs };
    },
  },
  {
    name: 'get_event',
    description: 'Detalhes de um evento: requisitos vinculados e participantes.',
    category: 'EVENTOS',
    inputSchema: obj({ eventId: str('ID do evento') }, ['eventId']),
    run: (a, { db }) => {
      const event = db.prepare('SELECT * FROM activity_events WHERE id = ?').get(a.eventId);
      need(event, 'Evento não encontrado.');
      const requirements = db
        .prepare(
          `SELECT rc.id, rc.class_slug, rc.code, rc.title FROM activity_event_requirements er
           JOIN requirements_catalog rc ON rc.id = er.requirement_id WHERE er.event_id = ?`
        )
        .all(a.eventId);
      const attendees = db
        .prepare(
          `SELECT p.id, p.name, ea.attended FROM activity_event_attendees ea
           JOIN pathfinders p ON p.id = ea.pathfinder_id WHERE ea.event_id = ?`
        )
        .all(a.eventId);
      return { event, requirements, attendees };
    },
  },

  // ───────────────────────── ESCRITA ─────────────────────────
  {
    name: 'delete_pathfinder',
    description: 'Exclui definitivamente o cadastro de um desbravador (e o acesso individual vinculado).',
    category: 'CADASTRO',
    write: true,
    inputSchema: obj({ pathfinderId: str('ID do desbravador') }, ['pathfinderId']),
    run: (a, { db, user, perms }) => {
      need(
        ['ADMIN', 'GESTOR', 'DIRETOR', 'SECRETARIO'].includes(user.role) || perms.can_manage_pathfinders,
        'Sem permissão para excluir desbravadores.'
      );
      const existing = db.prepare('SELECT * FROM pathfinders WHERE id = ?').get(a.pathfinderId);
      need(existing, 'Desbravador não encontrado.');
      db.exec('BEGIN');
      try {
        if (existing.user_id) db.prepare('DELETE FROM users WHERE id = ?').run(existing.user_id);
        db.prepare('DELETE FROM users WHERE pathfinder_id = ?').run(a.pathfinderId);
        db.prepare('DELETE FROM pathfinders WHERE id = ?').run(a.pathfinderId);
        db.exec('COMMIT');
      } catch (err) {
        db.exec('ROLLBACK');
        throw err;
      }
      recordAudit({
        user, action: 'PATHFINDER_DELETE', entityType: 'PATHFINDER', entityId: a.pathfinderId,
        summary: `[MCP] ${user.name} excluiu o desbravador "${existing.name}".`, previousState: existing, newState: null,
      });
      return { deleted: true, name: existing.name };
    },
  },
  {
    name: 'create_unit',
    description: 'Cria uma nova unidade do clube.',
    category: 'UNIDADES',
    write: true,
    inputSchema: obj(
      {
        name: str('Nome da unidade'),
        gender: { type: 'string', enum: ['MASCULINO', 'FEMININO'] },
        color_hex: str('Cor em hexadecimal (ex: #0284c7)'),
        counselor_description: str('Descrição/conselheiros'),
      },
      ['name']
    ),
    run: (a, { db, user, perms }) => {
      need(['ADMIN', 'GESTOR', 'DIRETOR', 'SECRETARIO'].includes(user.role) || perms.can_manage_units, 'Sem permissão para criar unidades.');
      const id = `unit-${crypto.randomUUID().slice(0, 8)}`;
      db.prepare(
        `INSERT INTO units (id, name, gender, counselor_description, color_hex, active, created_at) VALUES (?, ?, ?, ?, ?, 1, ?)`
      ).run(id, a.name.trim(), a.gender || 'MASCULINO', a.counselor_description || '', a.color_hex || '#0284c7', new Date().toISOString());
      recordAudit({ user, action: 'UNIT_CREATE', entityType: 'UNIT', entityId: id, summary: `[MCP] Unidade "${a.name}" criada.`, newState: { id, ...a } });
      return { created: true, unitId: id, name: a.name };
    },
  },
  {
    name: 'update_unit',
    description: 'Edita nome, cor, gênero ou descrição de uma unidade.',
    category: 'UNIDADES',
    write: true,
    inputSchema: obj(
      { unitId: str('ID da unidade'), name: str(''), gender: { type: 'string', enum: ['MASCULINO', 'FEMININO'] }, color_hex: str(''), counselor_description: str('') },
      ['unitId']
    ),
    run: (a, { db, user, perms }) => {
      need(['ADMIN', 'GESTOR', 'DIRETOR', 'SECRETARIO'].includes(user.role) || perms.can_manage_units, 'Sem permissão para editar unidades.');
      const ex = db.prepare('SELECT * FROM units WHERE id = ?').get(a.unitId);
      need(ex, 'Unidade não encontrada.');
      db.prepare('UPDATE units SET name = ?, gender = ?, counselor_description = ?, color_hex = ? WHERE id = ?').run(
        a.name?.trim() || ex.name, a.gender || ex.gender, a.counselor_description ?? ex.counselor_description, a.color_hex || ex.color_hex, a.unitId
      );
      recordAudit({ user, action: 'UNIT_UPDATE', entityType: 'UNIT', entityId: a.unitId, summary: `[MCP] Unidade "${ex.name}" atualizada.`, previousState: ex, newState: a });
      return { updated: true, unitId: a.unitId };
    },
  },
  {
    name: 'delete_unit',
    description: 'Exclui uma unidade (os membros ficam sem unidade).',
    category: 'UNIDADES',
    write: true,
    inputSchema: obj({ unitId: str('ID da unidade') }, ['unitId']),
    run: (a, { db, user, perms }) => {
      need(['ADMIN', 'GESTOR', 'DIRETOR', 'SECRETARIO'].includes(user.role) || perms.can_manage_units, 'Sem permissão para excluir unidades.');
      const ex = db.prepare('SELECT * FROM units WHERE id = ?').get(a.unitId);
      need(ex, 'Unidade não encontrada.');
      db.exec('BEGIN');
      try {
        db.prepare('UPDATE pathfinders SET unit_id = NULL WHERE unit_id = ?').run(a.unitId);
        db.prepare('UPDATE users SET unit_id = NULL WHERE unit_id = ?').run(a.unitId);
        db.prepare('DELETE FROM units WHERE id = ?').run(a.unitId);
        db.exec('COMMIT');
      } catch (err) {
        db.exec('ROLLBACK');
        throw err;
      }
      recordAudit({ user, action: 'UNIT_DELETE', entityType: 'UNIT', entityId: a.unitId, summary: `[MCP] Unidade "${ex.name}" excluída.`, previousState: ex, newState: null });
      return { deleted: true, name: ex.name };
    },
  },
  {
    name: 'update_event',
    description: 'Edita um evento planejado (título, data, local, tipo, descrição) e opcionalmente redefine requisitos e participantes.',
    category: 'EVENTOS',
    write: true,
    inputSchema: obj({
      eventId: str('ID do evento'), title: str(''), description: str(''), event_type: str(''), location: str(''),
      scheduled_date: str('YYYY-MM-DD'), notes: str(''),
      requirement_ids: strArr('Substitui a lista de requisitos'), attendee_ids: strArr('Substitui a lista de participantes'),
    }, ['eventId']),
    run: (a, { db, user }) => {
      need(!['CONSELHEIRO', 'DESBRAVADOR'].includes(user.role), 'Sem permissão para editar eventos.');
      const ex = db.prepare('SELECT * FROM activity_events WHERE id = ?').get(a.eventId);
      need(ex, 'Evento não encontrado.');
      need(ex.status !== 'REALIZADO', 'Evento já executado não pode ser editado.');
      db.prepare(
        'UPDATE activity_events SET title = ?, description = ?, event_type = ?, location = ?, scheduled_date = ?, notes = ? WHERE id = ?'
      ).run(a.title || ex.title, a.description ?? ex.description, a.event_type || ex.event_type, a.location ?? ex.location, a.scheduled_date || ex.scheduled_date, a.notes ?? ex.notes, a.eventId);
      if (Array.isArray(a.requirement_ids)) {
        db.prepare('DELETE FROM activity_event_requirements WHERE event_id = ?').run(a.eventId);
        const ins = db.prepare('INSERT OR IGNORE INTO activity_event_requirements (event_id, requirement_id) VALUES (?, ?)');
        for (const r of a.requirement_ids) ins.run(a.eventId, r);
      }
      if (Array.isArray(a.attendee_ids)) {
        db.prepare('DELETE FROM activity_event_attendees WHERE event_id = ?').run(a.eventId);
        const ins = db.prepare('INSERT OR IGNORE INTO activity_event_attendees (event_id, pathfinder_id, attended) VALUES (?, ?, 1)');
        for (const p of a.attendee_ids) ins.run(a.eventId, p);
      }
      recordAudit({ user, action: 'EVENT_UPDATE', entityType: 'ACTIVITY_EVENT', entityId: a.eventId, summary: `[MCP] Evento "${ex.title}" atualizado.`, previousState: ex, newState: a });
      return { updated: true, eventId: a.eventId };
    },
  },
  {
    name: 'approve_event',
    description: 'Aprova um evento que está aguardando aprovação do Diretor (status PENDENTE_APROVACAO → PLANEJADO).',
    category: 'EVENTOS',
    write: true,
    inputSchema: obj({ eventId: str('ID do evento') }, ['eventId']),
    run: (a, { db, user, perms }) => {
      need(isBoard(user) || perms.can_approve_events, 'Sem permissão para aprovar eventos.');
      const ev = db.prepare('SELECT * FROM activity_events WHERE id = ?').get(a.eventId);
      need(ev, 'Evento não encontrado.');
      db.prepare("UPDATE activity_events SET status = 'PLANEJADO' WHERE id = ?").run(a.eventId);
      recordAudit({ user, action: 'EVENT_APPROVE', entityType: 'ACTIVITY_EVENT', entityId: a.eventId, summary: `[MCP] Evento "${ev.title}" aprovado.`, newState: { status: 'PLANEJADO' } });
      return { approved: true, eventId: a.eventId };
    },
  },
  {
    name: 'delete_event',
    description: 'Exclui um evento.',
    category: 'EVENTOS',
    write: true,
    inputSchema: obj({ eventId: str('ID do evento') }, ['eventId']),
    run: (a, { db, user }) => {
      need(!['CONSELHEIRO', 'DESBRAVADOR'].includes(user.role), 'Sem permissão para excluir eventos.');
      const ex = db.prepare('SELECT * FROM activity_events WHERE id = ?').get(a.eventId);
      need(ex, 'Evento não encontrado.');
      db.exec('BEGIN');
      try {
        db.prepare('DELETE FROM activity_event_requirements WHERE event_id = ?').run(a.eventId);
        db.prepare('DELETE FROM activity_event_attendees WHERE event_id = ?').run(a.eventId);
        db.prepare('DELETE FROM activity_events WHERE id = ?').run(a.eventId);
        db.exec('COMMIT');
      } catch (err) {
        db.exec('ROLLBACK');
        throw err;
      }
      recordAudit({ user, action: 'EVENT_DELETE', entityType: 'ACTIVITY_EVENT', entityId: a.eventId, summary: `[MCP] Evento "${ex.title}" excluído.`, previousState: ex, newState: null });
      return { deleted: true, title: ex.title };
    },
  },
  {
    name: 'save_unification',
    description: 'Cria ou edita uma unificação (grupo de equivalência) pelo código. Aceita título, descrição, nível, requisitos e ativação.',
    category: 'PLANEJAMENTO',
    write: true,
    inputSchema: obj({
      code: str('Código (ex: U-41 ou EQ-CUSTOM-01)'), title: str(''), description: str(''),
      level: { type: 'number', description: 'Nível de recomendação (1 a 4)' },
      requirementIds: strArr('Requisitos do grupo'), enabled: { type: 'boolean' },
    }, ['code']),
    run: (a, { db, user, perms }) => {
      need(isBoard(user) || perms.can_edit_equivalences, 'Sem permissão para editar unificações.');
      const { code, ...rest } = a;
      const res = updateUnification(db, String(code).trim().toUpperCase(), rest, user);
      schedulePdfWarmup(db);
      return res;
    },
  },
  {
    name: 'delete_unification',
    description: 'Desativa/remove uma unificação pelo código.',
    category: 'PLANEJAMENTO',
    write: true,
    inputSchema: obj({ code: str('Código da unificação') }, ['code']),
    run: (a, { db, user, perms }) => {
      need(isBoard(user) || perms.can_edit_equivalences, 'Sem permissão para remover unificações.');
      const res = updateUnification(db, String(a.code).trim().toUpperCase(), { enabled: false, deleted: true, requirementIds: [] }, user);
      schedulePdfWarmup(db);
      return res;
    },
  },
  {
    name: 'reset_unifications',
    description: 'Restaura todas as unificações para o padrão oficial (descarta edições). Apenas Diretor/Gestor.',
    category: 'PLANEJAMENTO',
    write: true,
    inputSchema: obj(),
    run: (a, { db, user }) => {
      need(isBoard(user), 'Apenas Diretor/Gestor.');
      const res = resetUnifications(db, user);
      schedulePdfWarmup(db);
      return res;
    },
  },
  {
    name: 'apply_absorptions',
    description: 'Aprova requisitos por absorção. Passe a lista de approvals retornada por get_absorption_recommendations (ou omita para aprovar todas as recomendações, opcionalmente de um desbravador).',
    category: 'PROGRESSO',
    write: true,
    inputSchema: obj({
      approvals: { type: 'array', items: { type: 'object' }, description: 'Itens de recomendação a aplicar' },
      pathfinderId: str('Se approvals for omitido, aplica todas as recomendações deste desbravador (ou de todos)'),
    }),
    run: (a, { db, user }) => {
      need(['ADMIN', 'GESTOR', 'DIRETOR', 'INSTRUTOR'].includes(user.role), 'Sem permissão para aprovar requisitos.');
      const approvals = Array.isArray(a.approvals) && a.approvals.length ? a.approvals : computeAbsorptionRecommendations(db, a.pathfinderId || null);
      const res = applyAbsorptionApprovals(db, approvals, user);
      schedulePdfWarmup(db);
      return res;
    },
  },
  {
    name: 'update_club_settings',
    description: 'Atualiza configurações do clube: nome, região, ano, data da investidura, tema, aprovação direta de conselheiros.',
    category: 'CONFIGURACAO',
    write: true,
    inputSchema: obj({
      club_name: str(''), club_region: str(''), current_year: { type: 'number' }, investiture_date: str('YYYY-MM-DD'),
      color_theme: str(''), allow_counselor_direct_approval: { type: 'boolean' },
    }),
    run: (a, { db, user }) => {
      need(isBoard(user), 'Apenas Diretor/Gestor.');
      const p = db.prepare('SELECT * FROM club_settings WHERE id = 1').get();
      db.prepare(
        `UPDATE club_settings SET club_name = ?, club_region = ?, current_year = ?, investiture_date = ?, color_theme = ?,
         allow_counselor_direct_approval = ?, updated_at = ? WHERE id = 1`
      ).run(
        a.club_name ?? p.club_name, a.club_region ?? p.club_region, Number(a.current_year ?? p.current_year),
        a.investiture_date ?? p.investiture_date, a.color_theme ?? p.color_theme ?? 'amber',
        a.allow_counselor_direct_approval === undefined ? p.allow_counselor_direct_approval : a.allow_counselor_direct_approval ? 1 : 0,
        new Date().toISOString()
      );
      recordAudit({ user, action: 'SETTINGS_UPDATE', entityType: 'CLUB_SETTINGS', entityId: '1', summary: `[MCP] ${user.name} atualizou as configurações do clube.`, newState: a });
      return { updated: true };
    },
  },
  {
    name: 'update_leader',
    description: 'Edita cargo, escopos (classes/unidades), poderes extras ou ativação de um líder. Não altera senha.',
    category: 'LIDERANCA',
    write: true,
    inputSchema: obj({
      leaderId: str('ID do usuário líder'), role: { type: 'string', enum: ['DIRETOR', 'GESTOR', 'SECRETARIO', 'INSTRUTOR', 'CONSELHEIRO'] },
      custom_role_title: str(''), unit_id: str(''), assigned_classes: strArr(''), assigned_units: strArr(''),
      permissions: { type: 'object', description: 'Mapa de poderes, ex: {"can_manage_events": true}' }, active: { type: 'boolean' },
    }, ['leaderId']),
    run: (a, { db, user, perms }) => {
      need(isBoard(user) || perms.can_manage_permissions, 'Sem permissão para editar líderes.');
      const ex = db.prepare('SELECT * FROM users WHERE id = ?').get(a.leaderId);
      need(ex, 'Líder não encontrado.');
      db.prepare(
        `UPDATE users SET role = ?, custom_role_title = ?, unit_id = ?, assigned_classes_json = ?, assigned_units_json = ?, permissions_json = ?, active = ? WHERE id = ?`
      ).run(
        a.role || ex.role, a.custom_role_title ?? ex.custom_role_title ?? '', a.unit_id === undefined ? ex.unit_id : a.unit_id || null,
        JSON.stringify(a.assigned_classes ?? JSON.parse(ex.assigned_classes_json || '[]')),
        JSON.stringify(a.assigned_units ?? JSON.parse(ex.assigned_units_json || '[]')),
        JSON.stringify(a.permissions ?? JSON.parse(ex.permissions_json || '{}')),
        a.active === undefined ? ex.active : a.active ? 1 : 0, a.leaderId
      );
      recordAudit({ user, action: 'USER_PERMISSION_CHANGE', entityType: 'USER', entityId: a.leaderId, summary: `[MCP] ${user.name} atualizou o perfil de "${ex.name}".`, newState: a });
      return { updated: true, leaderId: a.leaderId };
    },
  },
  {
    name: 'update_feedback_status',
    description: 'Altera o status de um relatório de feedback (NOVO, LIDO, RESOLVIDO).',
    category: 'AUDITORIA',
    write: true,
    inputSchema: obj({ feedbackId: str(''), status: { type: 'string', enum: ['NOVO', 'LIDO', 'RESOLVIDO'] } }, ['feedbackId', 'status']),
    run: (a, { db, user }) => {
      need(isBoard(user), 'Apenas Diretor/Gestor.');
      const r = db.prepare('UPDATE feedback_reports SET status = ? WHERE id = ?').run(a.status, a.feedbackId);
      need(r.changes > 0, 'Relatório não encontrado.');
      return { updated: true };
    },
  },
  {
    name: 'create_backup',
    description: 'Cria um ponto de restauração (snapshot SQLite) imediato do banco atual.',
    category: 'BACKUP',
    write: true,
    inputSchema: obj({ label: str('Rótulo opcional') }),
    run: (a, { db, user }) => {
      need(isBoard(user), 'Apenas Diretor/Gestor.');
      const { createSnapshot } = require('./backup');
      const isTest = isTestModeActive();
      const meta = createSnapshot({
        dbInstance: isTest ? testDb : prodDb,
        dbType: isTest ? 'test' : 'prod',
        trigger: 'MANUAL',
        label: a.label || 'mcp',
        reason: `Ponto de restauração criado via MCP por ${user.name}`,
      });
      recordAudit({ user, action: 'BACKUP_CREATE', entityType: 'BACKUP', entityId: meta.filename, summary: `[MCP] ${user.name} criou o backup "${meta.filename}".`, newState: meta });
      return { created: true, backup: meta };
    },
  },
];

const EXTRA_TOOL_MAP = Object.fromEntries(EXTRA_TOOLS.map((t) => [t.name, t]));

/** Schemas públicos (sem a função run). */
const EXTRA_TOOL_SCHEMAS = EXTRA_TOOLS.map(({ run, write, ...schema }) => ({
  ...schema,
  annotations: { readOnlyHint: !write, destructiveHint: Boolean(write) && /^delete_|^reset_/.test(schema.name) },
}));

module.exports = { EXTRA_TOOL_SCHEMAS, EXTRA_TOOL_MAP };
