const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const {
  PDF_CACHE_DIR,
  generateInstructorControlPdf,
  generatePathfinderCardPdf,
  generateAnnualPlanningPdf,
  generateClassMatrixPdf,
} = require('./pdfEngine');

function generateSecureToken() {
  return crypto.randomBytes(12).toString('base64url'); // ex: '7k9m2p1a4xZ_w8Q'
}

function normalizePdfParams(docType, rawParams = {}) {
  const p = { ...rawParams };
  if (docType === 'INSTRUCTOR_CONTROL' || docType === 'MATRIX') {
    p.classSlug = p.classSlug || p.baseSlug || 'amigo';
    delete p.baseSlug;
    p.unitId = p.unitId || 'ALL';
    p.instructorId = p.instructorId || 'ALL';
    if (docType === 'MATRIX') {
      p.mode = p.mode || p.subClassFilter || 'BOTH';
      delete p.subClassFilter;
    }
  } else if (docType === 'PLANNING') {
    if (!p.mode && p.viewMode) {
      p.mode = p.viewMode === 'EQUIVALENCE' ? 'equivalences' : 'activities';
      delete p.viewMode;
    }
    p.mode = p.mode || 'activities';
    p.unitId = p.unitId || 'ALL';
    p.tagFilter = p.tagFilter || p.tag || p.selectedTag || 'ALL';
    p.baseClassFilter = p.baseClassFilter || p.baseClass || p.classSlug || 'ALL';
    p.classTypeFilter = p.classTypeFilter || p.classType || 'ALL';
    p.onlyPending = Boolean(p.onlyPending);
    delete p.tag;
    delete p.selectedTag;
    delete p.classSlug;
  } else if (docType === 'PF_CARD') {
    p.mode = p.mode || 'simplified';
  }
  return p;
}

/**
 * Calcula uma versão dos dados ultra-precisa para invalidar cache imediatamente quando houver alteração
 */
function computeDataVersion(docType, params, dbInstance) {
  try {
    let stats = '';
    const clubRow = dbInstance.prepare(`
      SELECT updated_at, club_name, club_logo_url, allow_counselor_direct_approval, equivalences_override_json
      FROM club_settings WHERE id = 1
    `).get();
    const clubStats = `${clubRow?.updated_at || ''}-${clubRow?.club_name || ''}-${clubRow?.club_logo_url || ''}-${clubRow?.equivalences_override_json || ''}`;

    if (docType === 'INSTRUCTOR_CONTROL' || docType === 'MATRIX') {
      const clsSlug = params.classSlug || 'amigo';
      // Desbravadores inscritos na classe (adicionado, removido, nome alterado, unidade alterada ou inativado)
      const pfs = dbInstance.prepare(`
        SELECT p.id, p.name, p.unit_id, p.active
        FROM pathfinders p
        JOIN class_enrollments ce ON ce.pathfinder_id = p.id
        WHERE ce.class_slug IN (?, ?)
        ORDER BY p.id ASC
      `).all(clsSlug, `${clsSlug}-avancado`);
      const pfHash = crypto.createHash('md5').update(JSON.stringify(pfs)).digest('hex').slice(0, 8);

      // Distribuição de desbravadores por instrutor / líderes de classe
      const instUsers = dbInstance.prepare(`
        SELECT id, name, role, assigned_classes_json, assigned_pathfinders_json
        FROM users
        ORDER BY id ASC
      `).all();
      const instHash = crypto.createHash('md5').update(JSON.stringify(instUsers)).digest('hex').slice(0, 8);

      // Progresso dos requisitos da classe
      const prog = dbInstance.prepare(`
        SELECT MAX(pr.updated_at) as max_up, COUNT(*) as cnt
        FROM progress_records pr
        JOIN requirements_catalog r ON r.id = pr.requirement_id
        WHERE r.base_class_slug = ?
      `).get(clsSlug);

      stats = `${clubStats}:${pfHash}:${instHash}:${prog?.max_up || ''}:${prog?.cnt || 0}`;
    } else if (docType === 'PF_CARD') {
      const pf = dbInstance.prepare(`
        SELECT id, name, unit_id, active, birth_date
        FROM pathfinders WHERE id = ?
      `).get(params.pathfinderId);
      const enrs = dbInstance.prepare('SELECT class_slug FROM class_enrollments WHERE pathfinder_id = ? ORDER BY class_slug ASC').all(params.pathfinderId);
      const prog = dbInstance.prepare(`
        SELECT MAX(updated_at) as max_up, COUNT(*) as cnt
        FROM progress_records
        WHERE pathfinder_id = ?
      `).get(params.pathfinderId);
      stats = `${clubStats}:${JSON.stringify(pf)}:${JSON.stringify(enrs)}:${prog?.max_up || ''}:${prog?.cnt || 0}`;
    } else if (docType === 'PLANNING') {
      const pfs = dbInstance.prepare('SELECT COUNT(*) as cnt FROM pathfinders WHERE active = 1').get();
      const prog = dbInstance.prepare('SELECT MAX(updated_at) as max_up, COUNT(*) as cnt FROM progress_records').get();
      const evs = dbInstance.prepare('SELECT MAX(created_at) as max_up, COUNT(*) as cnt FROM activity_events').get();
      stats = `${clubStats}:${pfs?.cnt || 0}:${prog?.max_up || ''}-${prog?.cnt || 0}:${evs?.max_up || ''}-${evs?.cnt || 0}`;
    }
    const raw = `${docType}:${JSON.stringify(params)}:${stats}`;
    return crypto.createHash('md5').update(raw).digest('hex').slice(0, 12);
  } catch (err) {
    console.error('[computeDataVersion Error]:', err);
    return 'v1';
  }
}

/**
 * Cria banco SQLite efêmero em memória a partir do snapshot do sandbox do usuário (?teste=1)
 */
function createEphemeralMemoryDatabaseFromSandbox(sandboxState) {
  const { DatabaseSync } = require('node:sqlite');
  const { createSchemaOn, ensureAuthAndEmailColumnsOn, prodDb } = require('./db');

  const memDb = new DatabaseSync(':memory:');
  createSchemaOn(memDb);
  ensureAuthAndEmailColumnsOn(memDb, true);
  memDb.exec('PRAGMA foreign_keys = OFF;');

  // Copia classes_catalog do prodDb dinamicamente
  const classes = prodDb.prepare('SELECT * FROM classes_catalog').all();
  if (classes.length > 0) {
    const keys = Object.keys(classes[0]);
    const insertClass = memDb.prepare(`
      INSERT INTO classes_catalog (${keys.join(', ')})
      VALUES (${keys.map(() => '?').join(', ')})
    `);
    for (const c of classes) {
      insertClass.run(...keys.map((k) => c[k]));
    }
  }

  // Copia requirements_catalog do prodDb dinamicamente
  const reqs = prodDb.prepare('SELECT * FROM requirements_catalog').all();
  if (reqs.length > 0) {
    const keys = Object.keys(reqs[0]);
    const insertReq = memDb.prepare(`
      INSERT INTO requirements_catalog (${keys.join(', ')})
      VALUES (${keys.map(() => '?').join(', ')})
    `);
    for (const r of reqs) {
      insertReq.run(...keys.map((k) => r[k]));
    }
  }

  // Popula club_settings
  const cs = sandboxState.clubSettings || {};
  memDb.prepare(`
    INSERT INTO club_settings (id, club_name, club_region, current_year, investiture_date, allow_counselor_direct_approval, club_logo_url, color_theme, equivalences_override_json, updated_at)
    VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    cs.club_name || 'Clube de Desbravadores (Demonstração)',
    cs.club_region || '',
    cs.current_year || 2026,
    cs.investiture_date || '2026-11-28',
    cs.allow_counselor_direct_approval === 'true' || cs.allow_counselor_direct_approval === 1 ? 1 : 0,
    cs.club_logo_url || '',
    cs.color_theme || 'amber',
    typeof cs.equivalences_override_json === 'string' ? cs.equivalences_override_json : JSON.stringify(cs.equivalences_override_json || {}),
    new Date().toISOString()
  );

  // Popula units
  const insertUnit = memDb.prepare(`
    INSERT INTO units (id, name, gender, counselor_description, color_hex, active, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  for (const u of (sandboxState.units || [])) {
    insertUnit.run(u.id, u.name, u.gender || 'MASCULINO', u.counselor_description || '', u.color_hex || '#0284c7', u.active !== 0 ? 1 : 0, u.created_at || new Date().toISOString());
  }

  // Popula pathfinders e class_enrollments
  const insertPf = memDb.prepare(`
    INSERT INTO pathfinders (id, name, birth_date, gender, unit_id, notes, active, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const insertEnr = memDb.prepare(`
    INSERT INTO class_enrollments (id, pathfinder_id, class_slug, year, is_grouped_card, status, enrolled_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  for (const pf of (sandboxState.pathfinders || [])) {
    insertPf.run(
      pf.id,
      pf.name,
      pf.birth_date || '2014-01-01',
      pf.gender || 'M',
      pf.unit_id || null,
      pf.notes || '',
      pf.active !== 0 ? 1 : 0,
      pf.created_at || new Date().toISOString()
    );
    for (const enr of (pf.enrollments || [])) {
      const slug = typeof enr === 'string' ? enr : enr.class_slug;
      if (slug) {
        insertEnr.run(
          `${pf.id}_${slug}_2026`,
          pf.id,
          slug,
          2026,
          0,
          'EM_ANDAMENTO',
          new Date().toISOString()
        );
      }
    }
  }

  // Popula progress_records
  const insertProg = memDb.prepare(`
    INSERT INTO progress_records (id, pathfinder_id, requirement_id, status, completed_sub_items_json, notes, completed_at, marked_by_user_id, marked_by_name, approved_by_user_id, approved_by_name, event_id, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const progRows = sandboxState.progressRecords || sandboxState.progress || [];
  const nowIso = new Date().toISOString();
  if (Array.isArray(progRows)) {
    for (const p of progRows) {
      const recId = p.id || `${p.pathfinder_id}_${p.requirement_id}`;
      insertProg.run(
        recId,
        p.pathfinder_id,
        p.requirement_id,
        p.status || 'PENDENTE',
        typeof p.completed_sub_items_json === 'string' ? p.completed_sub_items_json : JSON.stringify(p.completed_sub_items || []),
        p.notes || '',
        p.completed_at || (p.status === 'CONCLUIDO' || p.status === 'APROVADO' ? nowIso : null),
        p.marked_by_user_id || null,
        p.marked_by_name || null,
        p.approved_by_user_id || null,
        p.approved_by_name || (p.status === 'APROVADO' ? 'Instrutor' : null),
        p.event_id || null,
        p.updated_at || nowIso
      );
    }
  } else if (progRows && typeof progRows === 'object') {
    for (const [key, val] of Object.entries(progRows)) {
      const [pfId, reqId] = key.split(':');
      if (pfId && reqId) {
        const st = typeof val === 'string' ? val : val?.status || 'PENDENTE';
        const recId = `${pfId}_${reqId}`;
        insertProg.run(
          recId,
          pfId,
          reqId,
          st,
          '[]',
          '',
          st === 'CONCLUIDO' || st === 'APROVADO' ? nowIso : null,
          null,
          null,
          null,
          st === 'APROVADO' ? 'Instrutor' : null,
          null,
          nowIso
        );
      }
    }
  }

  // Popula users / leaders para suportar turmas divididas por instrutor e permissões
  const insertUser = memDb.prepare(`
    INSERT INTO users (id, name, email, password_hash, role, unit_id, assigned_classes_json, assigned_pathfinders_json, custom_role_title, active, created_at)
    VALUES (?, ?, ?, 'demo', ?, ?, ?, ?, ?, ?, ?)
  `);
  const allUsersMap = new Map();
  for (const u of (sandboxState.leaders || [])) {
    if (u && u.id) allUsersMap.set(u.id, u);
  }
  for (const u of (sandboxState.demoAccounts || [])) {
    if (u && u.id && !allUsersMap.has(u.id)) allUsersMap.set(u.id, u);
  }
  for (const u of allUsersMap.values()) {
    insertUser.run(
      u.id,
      u.name,
      u.email || `${u.id}@clube.org`,
      u.role || 'INSTRUTOR',
      u.unit_id || null,
      typeof u.assigned_classes_json === 'string' ? u.assigned_classes_json : JSON.stringify(u.assigned_classes || []),
      typeof u.assigned_pathfinders_json === 'string' ? u.assigned_pathfinders_json : JSON.stringify(u.assigned_pathfinders || []),
      u.custom_role_title || '',
      u.active !== 0 ? 1 : 0,
      u.created_at || new Date().toISOString()
    );
  }

  // Popula activity_events se houver
  const insertEvent = memDb.prepare(`
    INSERT INTO activity_events (id, title, description, event_type, location, scheduled_date, status, notes, created_by_user_id, created_by_name, executed_at, batch_id, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (const ev of (sandboxState.events || [])) {
    insertEvent.run(
      ev.id,
      ev.title,
      ev.description || '',
      ev.event_type || 'REUNIAO',
      ev.location || '',
      ev.scheduled_date || ev.start_date || '2026-06-01',
      ev.status || 'PLANEJADO',
      ev.notes || '',
      ev.created_by_user_id || 'sandbox',
      ev.created_by_name || 'Usuário Teste',
      ev.executed_at || null,
      ev.batch_id || null,
      ev.created_at || new Date().toISOString()
    );
  }

  // Cria tabela pdf_cache_registry no memDb
  memDb.exec(`
    CREATE TABLE IF NOT EXISTS pdf_cache_registry (
      id TEXT PRIMARY KEY,
      doc_type TEXT NOT NULL,
      doc_params_json TEXT NOT NULL,
      content_version TEXT NOT NULL,
      file_path TEXT NOT NULL,
      file_name TEXT NOT NULL,
      last_accessed_at TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
  `);

  memDb.exec('PRAGMA foreign_keys = ON;');

  return memDb;
}

/**
 * Retorna ou gera o registro de PDF e garante o arquivo em disco
 */
async function resolvePdfRecord({ docType, params = {}, dbInstance }) {
  const normalized = normalizePdfParams(docType, params);
  const normParams = JSON.stringify(normalized);
  const dataVersion = computeDataVersion(docType, normalized, dbInstance);

  const existing = dbInstance.prepare(`
    SELECT * FROM pdf_cache_registry
    WHERE doc_type = ? AND doc_params_json = ?
  `).get(docType, normParams);

  if (existing && existing.content_version === dataVersion && fs.existsSync(existing.file_path)) {
    dbInstance.prepare(`
      UPDATE pdf_cache_registry SET last_accessed_at = ? WHERE id = ?
    `).run(new Date().toISOString(), existing.id);
    return existing;
  }

  // Gera novo token seguro e arquivo
  const tokenId = existing ? existing.id : generateSecureToken();
  const fileName = buildDownloadFileName(docType, normalized, dataVersion);
  const filePath = path.join(PDF_CACHE_DIR, `${tokenId}.pdf`);

  // Renderiza via PDFKit
  if (docType === 'INSTRUCTOR_CONTROL') {
    await generateInstructorControlPdf({
      classSlug: normalized.classSlug,
      unitId: normalized.unitId || 'ALL',
      instructorId: normalized.instructorId || 'ALL',
      outputPath: filePath,
      dbInstance,
    });
  } else if (docType === 'PF_CARD') {
    await generatePathfinderCardPdf({
      pathfinderId: normalized.pathfinderId,
      mode: normalized.mode || 'simplified',
      outputPath: filePath,
      dbInstance,
    });
  } else if (docType === 'PLANNING') {
    await generateAnnualPlanningPdf({
      mode: normalized.mode || 'activities',
      unitId: normalized.unitId || 'ALL',
      tagFilter: normalized.tagFilter || 'ALL',
      baseClassFilter: normalized.baseClassFilter || 'ALL',
      classTypeFilter: normalized.classTypeFilter || 'ALL',
      onlyPending: Boolean(normalized.onlyPending),
      outputPath: filePath,
      dbInstance,
    });
  } else if (docType === 'MATRIX') {
    await generateClassMatrixPdf({
      classSlug: normalized.classSlug,
      mode: normalized.mode || 'BOTH',
      unitId: normalized.unitId || 'ALL',
      instructorId: normalized.instructorId || 'ALL',
      outputPath: filePath,
      dbInstance,
    });
  } else {
    throw new Error(`Tipo de documento desconhecido: ${docType}`);
  }

  const now = new Date().toISOString();
  dbInstance.prepare(`
    INSERT INTO pdf_cache_registry (id, doc_type, doc_params_json, content_version, file_path, file_name, last_accessed_at, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      content_version = excluded.content_version,
      file_path = excluded.file_path,
      file_name = excluded.file_name,
      last_accessed_at = excluded.last_accessed_at
  `).run(tokenId, docType, normParams, dataVersion, filePath, fileName, now, now);

  try {
    const { testDb } = require('./db');
    if (dbInstance !== testDb) {
      testDb.prepare(`
        INSERT INTO pdf_cache_registry (id, doc_type, doc_params_json, content_version, file_path, file_name, last_accessed_at, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          content_version = excluded.content_version,
          file_path = excluded.file_path,
          file_name = excluded.file_name,
          last_accessed_at = excluded.last_accessed_at
      `).run(tokenId, docType, normParams, dataVersion, filePath, fileName, now, now);
    }
  } catch {}

  return {
    id: tokenId,
    doc_type: docType,
    doc_params_json: normParams,
    content_version: dataVersion,
    file_path: filePath,
    file_name: fileName,
  };
}

function buildDownloadFileName(docType, params, version) {
  if (docType === 'INSTRUCTOR_CONTROL') {
    return `controle_instrutor_${params.classSlug || 'amigo'}_${version}.pdf`;
  }
  if (docType === 'PF_CARD') {
    return `ficha_${params.mode || 'simplificada'}_${params.pathfinderName ? params.pathfinderName.toLowerCase().replace(/[^a-z0-9]/g, '_') : 'desbravador'}_${version}.pdf`;
  }
  if (docType === 'PLANNING') {
    return `planejamento_anual_${params.mode || 'atividades'}_${version}.pdf`;
  }
  if (docType === 'MATRIX') {
    return `matriz_${params.classSlug || 'amigo'}_${params.mode || 'geral'}_${version}.pdf`;
  }
  return `documento_${version}.pdf`;
}

/**
 * Aquecimento assíncrono dos principais PDFs em segundo plano
 */
let warmupTimeout = null;
function schedulePdfWarmup(dbInstance) {
  if (warmupTimeout) clearTimeout(warmupTimeout);
  warmupTimeout = setTimeout(async () => {
    try {
      // 1. Controles de instrutor das 6 classes
      const classes = ['amigo', 'companheiro', 'pesquisador', 'pioneiro', 'excursionista', 'guia'];
      for (const slug of classes) {
        await resolvePdfRecord({ docType: 'INSTRUCTOR_CONTROL', params: { classSlug: slug, unitId: 'ALL' }, dbInstance });
      }

      // 2. Fichas simplificadas dos desbravadores ativos
      const pfs = dbInstance.prepare('SELECT id, name FROM pathfinders WHERE active = 1').all();
      for (const pf of pfs) {
        await resolvePdfRecord({
          docType: 'PF_CARD',
          params: { pathfinderId: pf.id, pathfinderName: pf.name, mode: 'simplified' },
          dbInstance,
        });
      }

      // 3. Planejamento Anual (Atividades e Unificações)
      await resolvePdfRecord({ docType: 'PLANNING', params: { mode: 'activities', unitId: 'ALL' }, dbInstance });
      await resolvePdfRecord({ docType: 'PLANNING', params: { mode: 'equivalences', unitId: 'ALL' }, dbInstance });
    } catch (err) {
      console.error('[PDF Cache Warmup] Erro ao pré-compilar PDFs:', err);
    }
  }, 1500);
}

module.exports = {
  resolvePdfRecord,
  schedulePdfWarmup,
  createEphemeralMemoryDatabaseFromSandbox,
  PDF_CACHE_DIR,
};
