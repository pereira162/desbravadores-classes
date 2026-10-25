const { DatabaseSync } = require('node:sqlite');
const { AsyncLocalStorage } = require('node:async_hooks');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { hashPassword } = require('./auth');

const DATA_DIR = path.resolve(__dirname, '../../data');
const PROD_DB_PATH = path.join(DATA_DIR, 'clube_desbravadores.sqlite');
const TEST_DB_PATH = path.join(DATA_DIR, 'clube_desbravadores_teste.sqlite');
const CARDS_JSON_PATH = path.join(DATA_DIR, 'cartoes-classes.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const prodDb = new DatabaseSync(PROD_DB_PATH);
prodDb.exec('PRAGMA journal_mode = WAL;');
prodDb.exec('PRAGMA foreign_keys = ON;');

const testDb = new DatabaseSync(TEST_DB_PATH);
testDb.exec('PRAGMA journal_mode = WAL;');
testDb.exec('PRAGMA foreign_keys = ON;');

const dbStorage = new AsyncLocalStorage();

// Proxy transparente: usa prodDb por padrão (produção real limpa) e testDb apenas quando X-Test-Mode: true
const db = new Proxy(prodDb, {
  get(_target, prop) {
    const store = dbStorage.getStore();
    const activeDb = store?.isTestMode ? testDb : prodDb;
    const val = activeDb[prop];
    return typeof val === 'function' ? val.bind(activeDb) : val;
  },
});

function dbContextMiddleware(req, _res, next) {
  const isTestMode =
    req.headers['x-test-mode'] === 'true' || req.query?.teste === '1';
  dbStorage.run({ isTestMode }, () => next());
}

function loadCardsMetadata() {
  const raw = fs.readFileSync(CARDS_JSON_PATH, 'utf8');
  return JSON.parse(raw);
}

function createSchemaOn(targetDb) {
  targetDb.exec(`
    CREATE TABLE IF NOT EXISTS club_settings (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      club_name TEXT NOT NULL DEFAULT '',
      club_region TEXT NOT NULL DEFAULT '',
      current_year INTEGER NOT NULL DEFAULT 2026,
      investiture_date TEXT NOT NULL DEFAULT '2026-11-28',
      allow_counselor_direct_approval INTEGER NOT NULL DEFAULT 0,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS units (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      gender TEXT NOT NULL DEFAULT 'MASCULINO',
      counselor_description TEXT DEFAULT '',
      color_hex TEXT DEFAULT '#0284c7',
      active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL,
      unit_id TEXT,
      assigned_classes_json TEXT NOT NULL DEFAULT '[]',
      active INTEGER NOT NULL DEFAULT 1,
      last_login_at TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (unit_id) REFERENCES units(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS classes_catalog (
      slug TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      base_slug TEXT NOT NULL,
      class_type TEXT NOT NULL,
      min_age INTEGER NOT NULL,
      color_name TEXT NOT NULL,
      color_hex TEXT NOT NULL,
      logo_path TEXT NOT NULL,
      official_url TEXT NOT NULL,
      mda_wiki_url TEXT NOT NULL,
      focus TEXT NOT NULL,
      display_order INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS requirements_catalog (
      id TEXT PRIMARY KEY,
      class_slug TEXT NOT NULL,
      base_class_slug TEXT NOT NULL,
      class_type TEXT NOT NULL,
      section_code TEXT NOT NULL,
      section_name TEXT NOT NULL,
      code TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      category TEXT NOT NULL,
      execution_context TEXT NOT NULL,
      tags_json TEXT NOT NULL DEFAULT '[]',
      equivalence_group TEXT NOT NULL,
      selection_rule TEXT NOT NULL DEFAULT 'TODOS',
      sub_items_json TEXT NOT NULL DEFAULT '[]',
      book_info_json TEXT,
      display_order INTEGER NOT NULL,
      FOREIGN KEY (class_slug) REFERENCES classes_catalog(slug) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS pathfinders (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      birth_date TEXT NOT NULL,
      gender TEXT NOT NULL DEFAULT 'M',
      unit_id TEXT,
      notes TEXT DEFAULT '',
      active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      FOREIGN KEY (unit_id) REFERENCES units(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS class_enrollments (
      id TEXT PRIMARY KEY,
      pathfinder_id TEXT NOT NULL,
      class_slug TEXT NOT NULL,
      year INTEGER NOT NULL DEFAULT 2026,
      is_grouped_card INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'EM_ANDAMENTO',
      enrolled_at TEXT NOT NULL,
      UNIQUE(pathfinder_id, class_slug, year),
      FOREIGN KEY (pathfinder_id) REFERENCES pathfinders(id) ON DELETE CASCADE,
      FOREIGN KEY (class_slug) REFERENCES classes_catalog(slug) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS progress_records (
      id TEXT PRIMARY KEY,
      pathfinder_id TEXT NOT NULL,
      requirement_id TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'PENDENTE',
      completed_sub_items_json TEXT NOT NULL DEFAULT '[]',
      notes TEXT DEFAULT '',
      completed_at TEXT,
      marked_by_user_id TEXT,
      marked_by_name TEXT,
      approved_by_user_id TEXT,
      approved_by_name TEXT,
      event_id TEXT,
      updated_at TEXT NOT NULL,
      UNIQUE(pathfinder_id, requirement_id),
      FOREIGN KEY (pathfinder_id) REFERENCES pathfinders(id) ON DELETE CASCADE,
      FOREIGN KEY (requirement_id) REFERENCES requirements_catalog(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS activity_events (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      event_type TEXT NOT NULL DEFAULT 'REUNIAO',
      location TEXT DEFAULT '',
      scheduled_date TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'PLANEJADO',
      notes TEXT DEFAULT '',
      created_by_user_id TEXT,
      created_by_name TEXT,
      executed_at TEXT,
      batch_id TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS activity_event_requirements (
      event_id TEXT NOT NULL,
      requirement_id TEXT NOT NULL,
      PRIMARY KEY (event_id, requirement_id),
      FOREIGN KEY (event_id) REFERENCES activity_events(id) ON DELETE CASCADE,
      FOREIGN KEY (requirement_id) REFERENCES requirements_catalog(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS activity_event_attendees (
      event_id TEXT NOT NULL,
      pathfinder_id TEXT NOT NULL,
      attended INTEGER NOT NULL DEFAULT 1,
      PRIMARY KEY (event_id, pathfinder_id),
      FOREIGN KEY (event_id) REFERENCES activity_events(id) ON DELETE CASCADE,
      FOREIGN KEY (pathfinder_id) REFERENCES pathfinders(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      user_name TEXT NOT NULL,
      user_role TEXT NOT NULL,
      action TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      batch_id TEXT,
      summary TEXT NOT NULL,
      previous_state_json TEXT,
      new_state_json TEXT,
      reverted INTEGER NOT NULL DEFAULT 0,
      reverted_at TEXT,
      reverted_by_name TEXT,
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_progress_pathfinder ON progress_records(pathfinder_id);
    CREATE INDEX IF NOT EXISTS idx_progress_requirement ON progress_records(requirement_id);
    CREATE INDEX IF NOT EXISTS idx_progress_status ON progress_records(status);
    CREATE INDEX IF NOT EXISTS idx_enrollments_pathfinder ON class_enrollments(pathfinder_id);
    CREATE INDEX IF NOT EXISTS idx_enrollments_class ON class_enrollments(class_slug);
    CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_audit_batch ON audit_logs(batch_id);
  `);
}

function addColumnIfNotExistsOn(targetDb, table, colName, colDef) {
  const cols = targetDb.prepare(`PRAGMA table_info(${table})`).all();
  if (!cols.some((c) => c.name === colName)) {
    targetDb.exec(`ALTER TABLE ${table} ADD COLUMN ${colName} ${colDef}`);
  }
}

function ensureAuthAndEmailColumnsOn(targetDb, isTestDb = false) {
  addColumnIfNotExistsOn(targetDb, 'club_settings', 'setup_completed', 'INTEGER NOT NULL DEFAULT 0');
  addColumnIfNotExistsOn(
    targetDb,
    'club_settings',
    'demo_mode_enabled',
    isTestDb ? 'INTEGER NOT NULL DEFAULT 1' : 'INTEGER NOT NULL DEFAULT 0'
  );
  addColumnIfNotExistsOn(targetDb, 'club_settings', 'smtp_host', "TEXT NOT NULL DEFAULT 'smtp.gmail.com'");
  addColumnIfNotExistsOn(targetDb, 'club_settings', 'smtp_port', 'INTEGER NOT NULL DEFAULT 465');
  addColumnIfNotExistsOn(targetDb, 'club_settings', 'smtp_secure', 'INTEGER NOT NULL DEFAULT 1');
  addColumnIfNotExistsOn(targetDb, 'club_settings', 'smtp_user', "TEXT NOT NULL DEFAULT ''");
  addColumnIfNotExistsOn(targetDb, 'club_settings', 'smtp_pass', "TEXT NOT NULL DEFAULT ''");
  addColumnIfNotExistsOn(targetDb, 'club_settings', 'smtp_from_name', "TEXT NOT NULL DEFAULT 'Clube de Desbravadores'");
  addColumnIfNotExistsOn(targetDb, 'club_settings', 'google_client_id', "TEXT NOT NULL DEFAULT ''");
  addColumnIfNotExistsOn(
    targetDb,
    'club_settings',
    'frontend_url',
    "TEXT NOT NULL DEFAULT 'https://pereira162.github.io/desbravadores-classes'"
  );

  addColumnIfNotExistsOn(targetDb, 'users', 'is_demo', 'INTEGER NOT NULL DEFAULT 0');
  addColumnIfNotExistsOn(targetDb, 'users', 'email_verified', 'INTEGER NOT NULL DEFAULT 1');
  addColumnIfNotExistsOn(targetDb, 'users', 'invite_status', "TEXT NOT NULL DEFAULT 'ACTIVE'");
  addColumnIfNotExistsOn(targetDb, 'users', 'invite_token', 'TEXT');
  addColumnIfNotExistsOn(targetDb, 'users', 'invite_expires_at', 'TEXT');
  addColumnIfNotExistsOn(targetDb, 'users', 'verification_code', 'TEXT');
  addColumnIfNotExistsOn(targetDb, 'users', 'verification_expires_at', 'TEXT');
  addColumnIfNotExistsOn(targetDb, 'users', 'reset_code', 'TEXT');
  addColumnIfNotExistsOn(targetDb, 'users', 'reset_expires_at', 'TEXT');
  addColumnIfNotExistsOn(targetDb, 'users', 'google_sub', 'TEXT');
  addColumnIfNotExistsOn(targetDb, 'users', 'avatar_url', 'TEXT');
  addColumnIfNotExistsOn(targetDb, 'users', 'pathfinder_id', 'TEXT DEFAULT NULL');

  addColumnIfNotExistsOn(targetDb, 'pathfinders', 'email', "TEXT DEFAULT ''");
  addColumnIfNotExistsOn(targetDb, 'pathfinders', 'user_id', 'TEXT DEFAULT NULL');
  addColumnIfNotExistsOn(targetDb, 'pathfinders', 'invite_token', 'TEXT DEFAULT NULL');
  addColumnIfNotExistsOn(targetDb, 'pathfinders', 'invite_status', "TEXT DEFAULT 'NONE'");
  addColumnIfNotExistsOn(targetDb, 'pathfinders', 'invited_at', 'TEXT DEFAULT NULL');

  addColumnIfNotExistsOn(targetDb, 'progress_records', 'submission_text', "TEXT DEFAULT ''");
  addColumnIfNotExistsOn(targetDb, 'progress_records', 'attachments_json', "TEXT DEFAULT '[]'");
  addColumnIfNotExistsOn(targetDb, 'progress_records', 'submitted_by_pathfinder', 'INTEGER NOT NULL DEFAULT 0');
  addColumnIfNotExistsOn(targetDb, 'progress_records', 'submitted_at', 'TEXT DEFAULT NULL');
  addColumnIfNotExistsOn(targetDb, 'progress_records', 'review_notes', "TEXT DEFAULT ''");

  addColumnIfNotExistsOn(targetDb, 'units', 'age_range', "TEXT DEFAULT ''");

  if (isTestDb) {
    targetDb.prepare("UPDATE users SET is_demo = 1 WHERE email LIKE '%@clube.org'").run();
  }
}

function syncOfficialCatalogOn(targetDb) {
  const data = loadCardsMetadata();

  const upsertClass = targetDb.prepare(`
    INSERT INTO classes_catalog (
      slug, name, base_slug, class_type, min_age, color_name, color_hex,
      logo_path, official_url, mda_wiki_url, focus, display_order
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(slug) DO UPDATE SET
      name = excluded.name,
      base_slug = excluded.base_slug,
      class_type = excluded.class_type,
      min_age = excluded.min_age,
      color_name = excluded.color_name,
      color_hex = excluded.color_hex,
      logo_path = excluded.logo_path,
      official_url = excluded.official_url,
      mda_wiki_url = excluded.mda_wiki_url,
      focus = excluded.focus,
      display_order = excluded.display_order
  `);

  const upsertReq = targetDb.prepare(`
    INSERT INTO requirements_catalog (
      id, class_slug, base_class_slug, class_type, section_code, section_name,
      code, title, description, category, execution_context, tags_json,
      equivalence_group, selection_rule, sub_items_json, book_info_json, display_order
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      class_slug = excluded.class_slug,
      base_class_slug = excluded.base_class_slug,
      class_type = excluded.class_type,
      section_code = excluded.section_code,
      section_name = excluded.section_name,
      code = excluded.code,
      title = excluded.title,
      description = excluded.description,
      category = excluded.category,
      execution_context = excluded.execution_context,
      tags_json = excluded.tags_json,
      equivalence_group = excluded.equivalence_group,
      selection_rule = excluded.selection_rule,
      sub_items_json = excluded.sub_items_json,
      book_info_json = excluded.book_info_json,
      display_order = excluded.display_order
  `);

  targetDb.exec('BEGIN');
  try {
    let classOrder = 1;
    let reqOrder = 1;

    for (const cls of data.classes) {
      upsertClass.run(
        cls.slug,
        cls.name,
        cls.slug,
        'REGULAR',
        cls.min_age,
        cls.color_name,
        cls.color_hex,
        cls.logo_path,
        cls.official_url,
        cls.mda_wiki_url,
        cls.focus,
        classOrder++
      );

      upsertClass.run(
        cls.advanced_slug,
        cls.advanced_name,
        cls.slug,
        'AVANCADA',
        cls.min_age,
        cls.color_name,
        cls.color_hex,
        cls.logo_path,
        cls.official_url,
        cls.mda_wiki_url,
        cls.focus,
        classOrder++
      );

      for (const r of cls.regular_requirements) {
        upsertReq.run(
          r.id,
          cls.slug,
          cls.slug,
          'REGULAR',
          r.section_code,
          r.section_name,
          r.code,
          r.title,
          r.description,
          r.category,
          r.execution_context,
          JSON.stringify(r.tags || []),
          r.equivalence_group,
          r.selection_rule || 'TODOS',
          JSON.stringify(r.sub_items || []),
          r.book_info ? JSON.stringify(r.book_info) : null,
          reqOrder++
        );
      }

      for (const r of cls.advanced_requirements) {
        upsertReq.run(
          r.id,
          cls.advanced_slug,
          cls.slug,
          'AVANCADA',
          r.section_code,
          r.section_name,
          r.code,
          r.title,
          r.description,
          r.category,
          r.execution_context,
          JSON.stringify(r.tags || []),
          r.equivalence_group,
          r.selection_rule || 'TODOS',
          JSON.stringify(r.sub_items || []),
          r.book_info ? JSON.stringify(r.book_info) : null,
          reqOrder++
        );
      }
    }
    targetDb.exec('COMMIT');
  } catch (err) {
    targetDb.exec('ROLLBACK');
    throw err;
  }
}

/**
 * Garante que o banco de PRODUÇÃO REAL (clube_desbravadores.sqlite)
 * não tenha nenhum dado falso/inventado (remove qualquer seed anterior se o Diretor ainda não configurou).
 */
function ensureCleanProductionDatabase(targetDb) {
  const now = new Date().toISOString();
  const settings = targetDb.prepare('SELECT * FROM club_settings WHERE id = 1').get();

  if (!settings) {
    targetDb
      .prepare(
        `INSERT INTO club_settings (
          id, club_name, club_region, current_year, investiture_date,
          allow_counselor_direct_approval, setup_completed, demo_mode_enabled, updated_at
        ) VALUES (1, '', '', 2026, '2026-11-28', 0, 0, 0, ?)`
      )
      .run(now);
  }

  // Remove todos os registros fictícios que haviam sido criados pelo seed antigo no banco de produção
  const fakeUserCount = targetDb
    .prepare("SELECT COUNT(*) as c FROM users WHERE email LIKE '%@clube.org' OR is_demo = 1")
    .get().c;

  const fakePathfinderCount = targetDb
    .prepare("SELECT COUNT(*) as c FROM pathfinders WHERE id IN ('dbv-01','dbv-02','dbv-03','dbv-04','dbv-05','dbv-06','dbv-07','dbv-08','dbv-09','dbv-10','dbv-11','dbv-12','dbv-13','dbv-14','dbv-15','dbv-16','dbv-17','dbv-18')")
    .get().c;

  if (fakeUserCount > 0 || fakePathfinderCount > 0) {
    targetDb.exec('BEGIN');
    try {
      // Remove eventos fictícios
      targetDb
        .prepare(
          "DELETE FROM activity_events WHERE id IN ('evt-acamp-inverno', 'evt-domingo-caminhada', 'evt-sabado-comunidade')"
        )
        .run();

      // Remove desbravadores fictícios (CASCADE remove matrículas e progressos deles)
      targetDb
        .prepare(
          "DELETE FROM pathfinders WHERE id IN ('dbv-01','dbv-02','dbv-03','dbv-04','dbv-05','dbv-06','dbv-07','dbv-08','dbv-09','dbv-10','dbv-11','dbv-12','dbv-13','dbv-14','dbv-15','dbv-16','dbv-17','dbv-18')"
        )
        .run();

      // Remove líderes fictícios
      targetDb
        .prepare("DELETE FROM users WHERE email LIKE '%@clube.org' OR is_demo = 1")
        .run();

      // Remove unidades fictícias se não houver desbravadores reais vinculados a elas
      targetDb
        .prepare(
          "DELETE FROM units WHERE id IN ('unit-aguias', 'unit-leoes', 'unit-estrelas', 'unit-sentinelas') AND id NOT IN (SELECT DISTINCT unit_id FROM pathfinders WHERE unit_id IS NOT NULL)"
        )
        .run();

      // Remove logs de auditoria fictícios dos usuários demo
      targetDb
        .prepare(
          "DELETE FROM audit_logs WHERE user_id IN ('usr-diretor', 'usr-cons-aguias', 'usr-inst-amigo-comp')"
        )
        .run();

      // Se o nome do clube ainda era o fictício 'Clube Pioneiros da Colina', limpa para que o Diretor preencha
      const currSettings = targetDb.prepare('SELECT * FROM club_settings WHERE id = 1').get();
      const realUsersRemaining = targetDb.prepare('SELECT COUNT(*) as c FROM users').get().c;
      if (currSettings && currSettings.club_name === 'Clube Pioneiros da Colina' && realUsersRemaining === 0) {
        targetDb
          .prepare(
            "UPDATE club_settings SET club_name = '', club_region = '', setup_completed = 0, demo_mode_enabled = 0 WHERE id = 1"
          )
          .run();
      } else {
        targetDb
          .prepare('UPDATE club_settings SET demo_mode_enabled = 0 WHERE id = 1')
          .run();
      }

      targetDb.exec('COMMIT');
    } catch (err) {
      targetDb.exec('ROLLBACK');
      throw err;
    }
  }
}

function recordAuditOn(
  targetDb,
  {
    user,
    action,
    entityType,
    entityId,
    batchId = null,
    summary,
    previousState = null,
    newState = null,
    createdAt = null,
  }
) {
  const id = crypto.randomUUID();
  const now = createdAt || new Date().toISOString();
  targetDb
    .prepare(
      `INSERT INTO audit_logs (
        id, user_id, user_name, user_role, action, entity_type, entity_id,
        batch_id, summary, previous_state_json, new_state_json, reverted, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)`
    )
    .run(
      id,
      user ? user.id : null,
      user ? user.name : 'Sistema',
      user ? user.role : 'SYSTEM',
      action,
      entityType,
      entityId,
      batchId,
      summary,
      previousState ? JSON.stringify(previousState) : null,
      newState ? JSON.stringify(newState) : null,
      now
    );
  return id;
}

function recordAudit(params) {
  return recordAuditOn(db, params);
}

/**
 * Popula APENAS o banco isolado de TESTE (clube_desbravadores_teste.sqlite)
 * para a Página Temporária de Teste (?teste=1).
 */
function seedTestDatabaseIfEmpty(targetDb) {
  const countUsers = targetDb.prepare('SELECT COUNT(*) as c FROM users').get().c;
  if (countUsers > 0) return;

  const now = new Date().toISOString();

  targetDb.exec('BEGIN');
  try {
    targetDb
      .prepare(
        `INSERT INTO club_settings (id, club_name, club_region, current_year, investiture_date, allow_counselor_direct_approval, setup_completed, demo_mode_enabled, updated_at)
         VALUES (1, 'Clube de Demonstração (Ambiente de Teste)', 'Região de Teste — Visualização', 2026, '2026-11-28', 0, 1, 1, ?)`
      )
      .run(now);

    const units = [
      { id: 'unit-aguias', name: 'Unidade Masculina 10–12 (Teste)', gender: 'MASCULINO', desc: 'Unidade Masculina 10–12 anos', color: '#1d4ed8' },
      { id: 'unit-leoes', name: 'Unidade Masculina 13–15 (Teste)', gender: 'MASCULINO', desc: 'Unidade Masculina 13–15 anos', color: '#4b5563' },
      { id: 'unit-estrelas', name: 'Unidade Feminina 10–12 (Teste)', gender: 'FEMININO', desc: 'Unidade Feminina 10–12 anos', color: '#dc2626' },
      { id: 'unit-sentinelas', name: 'Unidade Feminina 13–15 (Teste)', gender: 'FEMININO', desc: 'Unidade Feminina 13–15 anos', color: '#16a34a' },
    ];
    const insertUnit = targetDb.prepare(`
      INSERT INTO units (id, name, gender, counselor_description, color_hex, active, created_at)
      VALUES (?, ?, ?, ?, ?, 1, ?)
    `);
    for (const u of units) {
      insertUnit.run(u.id, u.name, u.gender, u.desc, u.color, now);
    }

    const defaultPass = hashPassword('123456');
    const leaders = [
      {
        id: 'usr-diretor',
        name: 'Diretor (Conta de Teste)',
        email: 'diretor@clube.org',
        role: 'DIRETOR',
        unit_id: null,
        classes: ['*'],
      },
      {
        id: 'usr-secretaria',
        name: 'Secretaria (Conta de Teste)',
        email: 'secretaria@clube.org',
        role: 'SECRETARIO',
        unit_id: null,
        classes: ['*'],
      },
      {
        id: 'usr-inst-amigo-comp',
        name: 'Instrutor Amigo/Comp. (Teste)',
        email: 'instrutor.amigo@clube.org',
        role: 'INSTRUTOR',
        unit_id: null,
        classes: ['amigo', 'amigo-avancado', 'companheiro', 'companheiro-avancado'],
      },
      {
        id: 'usr-inst-pesq-pion',
        name: 'Instrutor Pesq./Pion. (Teste)',
        email: 'instrutor.pesquisador@clube.org',
        role: 'INSTRUTOR',
        unit_id: null,
        classes: ['pesquisador', 'pesquisador-avancado', 'pioneiro', 'pioneiro-avancado'],
      },
      {
        id: 'usr-inst-exc-guia',
        name: 'Instrutor Exc./Guia (Teste)',
        email: 'instrutor.guia@clube.org',
        role: 'INSTRUTOR',
        unit_id: null,
        classes: ['excursionista', 'excursionista-avancado', 'guia', 'guia-avancado'],
      },
      {
        id: 'usr-cons-aguias',
        name: 'Conselheiro Unidade Masc. (Teste)',
        email: 'conselheiro.aguias@clube.org',
        role: 'CONSELHEIRO',
        unit_id: 'unit-aguias',
        classes: [],
      },
      {
        id: 'usr-cons-estrelas',
        name: 'Conselheira Unidade Fem. (Teste)',
        email: 'conselheira.estrelas@clube.org',
        role: 'CONSELHEIRO',
        unit_id: 'unit-estrelas',
        classes: [],
      },
    ];

    const insertUser = targetDb.prepare(`
      INSERT INTO users (id, name, email, password_hash, role, unit_id, assigned_classes_json, active, is_demo, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, 1, 1, ?)
    `);
    for (const l of leaders) {
      insertUser.run(l.id, l.name, l.email, defaultPass, l.role, l.unit_id, JSON.stringify(l.classes), now);
    }

    const pathfindersData = [
      { id: 'dbv-01', name: 'Desbravador Exemplo 01 (Amigo)', birth: '2016-03-14', gender: 'M', unit: 'unit-aguias', classes: ['amigo', 'amigo-avancado'], notes: 'Registro de demonstração.', regDoneCount: 16, advDoneCount: 4 },
      { id: 'dbv-02', name: 'Desbravadora Exemplo 02 (Amigo)', birth: '2016-02-09', gender: 'F', unit: 'unit-estrelas', classes: ['amigo', 'amigo-avancado'], notes: 'Registro de demonstração.', regDoneCount: 22, advDoneCount: 7 },
      { id: 'dbv-03', name: 'Desbravador Exemplo 03 (Companheiro)', birth: '2015-04-11', gender: 'M', unit: 'unit-aguias', classes: ['companheiro', 'companheiro-avancado'], notes: 'Registro de demonstração.', regDoneCount: 23, advDoneCount: 9 },
      { id: 'dbv-04', name: 'Desbravadora Exemplo 04 (Pesquisador)', birth: '2014-06-12', gender: 'F', unit: 'unit-estrelas', classes: ['pesquisador', 'pesquisador-avancado'], notes: 'Registro de demonstração.', regDoneCount: 21, advDoneCount: 9 },
      { id: 'dbv-05', name: 'Desbravador Exemplo 05 (Pioneiro)', birth: '2013-02-27', gender: 'M', unit: 'unit-leoes', classes: ['pioneiro', 'pioneiro-avancado'], notes: 'Registro de demonstração.', regDoneCount: 21, advDoneCount: 8 },
      { id: 'dbv-06', name: 'Desbravadora Exemplo 06 (Excursionista)', birth: '2012-09-21', gender: 'F', unit: 'unit-sentinelas', classes: ['excursionista', 'excursionista-avancado'], notes: 'Registro de demonstração.', regDoneCount: 19, advDoneCount: 7 },
      { id: 'dbv-07', name: 'Desbravador Exemplo 07 (Guia)', birth: '2011-01-17', gender: 'M', unit: 'unit-leoes', classes: ['guia', 'guia-avancado'], notes: 'Registro de demonstração.', regDoneCount: 24, advDoneCount: 9 },
    ];

    const insertPathfinder = targetDb.prepare(`
      INSERT INTO pathfinders (id, name, birth_date, gender, unit_id, notes, active, created_at)
      VALUES (?, ?, ?, ?, ?, ?, 1, ?)
    `);
    const insertEnrollment = targetDb.prepare(`
      INSERT INTO class_enrollments (id, pathfinder_id, class_slug, year, is_grouped_card, status, enrolled_at)
      VALUES (?, ?, ?, 2026, 0, 'EM_ANDAMENTO', ?)
    `);
    const insertProgress = targetDb.prepare(`
      INSERT INTO progress_records (
        id, pathfinder_id, requirement_id, status, completed_sub_items_json,
        notes, completed_at, marked_by_user_id, marked_by_name,
        approved_by_user_id, approved_by_name, event_id, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const reqsByClass = {};
    const allReqs = targetDb.prepare('SELECT * FROM requirements_catalog ORDER BY display_order ASC').all();
    for (const r of allReqs) {
      if (!reqsByClass[r.class_slug]) reqsByClass[r.class_slug] = [];
      reqsByClass[r.class_slug].push(r);
    }

    for (const pf of pathfindersData) {
      insertPathfinder.run(pf.id, pf.name, pf.birth, pf.gender, pf.unit, pf.notes, now);

      for (const cSlug of pf.classes) {
        insertEnrollment.run(crypto.randomUUID(), pf.id, cSlug, '2026-02-15T10:00:00.000Z');
        const classReqs = reqsByClass[cSlug] || [];
        const isAdv = cSlug.endsWith('-avancado');
        const targetDone = isAdv ? pf.advDoneCount : pf.regDoneCount;

        for (let idx = 0; idx < classReqs.length; idx++) {
          const reqItem = classReqs[idx];
          const subItems = JSON.parse(reqItem.sub_items_json || '[]');
          const allSubCodes = subItems.map((s) => s.code);

          if (idx < targetDone) {
            insertProgress.run(
              crypto.randomUUID(),
              pf.id,
              reqItem.id,
              'APROVADO',
              JSON.stringify(allSubCodes),
              '',
              '2026-06-14',
              'usr-diretor',
              'Diretor (Conta de Teste)',
              'usr-diretor',
              'Diretor (Conta de Teste)',
              null,
              '2026-06-14T14:00:00.000Z'
            );
          } else if (idx === targetDone) {
            insertProgress.run(
              crypto.randomUUID(),
              pf.id,
              reqItem.id,
              'CONCLUIDO',
              JSON.stringify(allSubCodes),
              'Aguardando visto do instrutor (Exemplo)',
              '2026-09-20',
              'usr-cons-aguias',
              'Conselheiro Unidade Masc. (Teste)',
              null,
              null,
              null,
              '2026-09-20T11:30:00.000Z'
            );
          }
        }
      }
    }

    targetDb.exec('COMMIT');
  } catch (err) {
    targetDb.exec('ROLLBACK');
    throw err;
  }
}

function initDatabase() {
  // 1. Inicializa o Banco Oficial de Produção (100% limpo de dados falsos)
  createSchemaOn(prodDb);
  ensureAuthAndEmailColumnsOn(prodDb, false);
  syncOfficialCatalogOn(prodDb);
  ensureCleanProductionDatabase(prodDb);

  // 2. Inicializa o Banco Isolado para a Página Temporária de Teste (?teste=1)
  createSchemaOn(testDb);
  ensureAuthAndEmailColumnsOn(testDb, true);
  syncOfficialCatalogOn(testDb);
  seedTestDatabaseIfEmpty(testDb);
}

module.exports = {
  db,
  prodDb,
  testDb,
  dbContextMiddleware,
  initDatabase,
  loadCardsMetadata,
  recordAudit,
};
