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
prodDb.exec('PRAGMA busy_timeout = 5000;');

const testDb = new DatabaseSync(TEST_DB_PATH);
testDb.exec('PRAGMA journal_mode = WAL;');
testDb.exec('PRAGMA foreign_keys = ON;');
testDb.exec('PRAGMA busy_timeout = 5000;');

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

    CREATE TABLE IF NOT EXISTS mcp_api_keys (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      user_id TEXT NOT NULL,
      api_key_hash TEXT NOT NULL,
      api_key_prefix TEXT NOT NULL,
      allowed_tools_json TEXT NOT NULL DEFAULT '["*"]',
      scope_json TEXT NOT NULL DEFAULT '{}',
      active INTEGER NOT NULL DEFAULT 1,
      last_used_at TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS feedback_reports (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      user_name TEXT DEFAULT 'Visitante',
      user_email TEXT DEFAULT '',
      user_role TEXT DEFAULT '',
      category TEXT NOT NULL DEFAULT 'BUG',
      message TEXT NOT NULL,
      url TEXT DEFAULT '',
      user_agent TEXT DEFAULT '',
      console_logs_json TEXT DEFAULT '[]',
      error_stack TEXT DEFAULT '',
      status TEXT NOT NULL DEFAULT 'NOVO',
      email_sent INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_progress_pathfinder ON progress_records(pathfinder_id);
    CREATE INDEX IF NOT EXISTS idx_progress_requirement ON progress_records(requirement_id);
    CREATE INDEX IF NOT EXISTS idx_progress_status ON progress_records(status);
    CREATE INDEX IF NOT EXISTS idx_enrollments_pathfinder ON class_enrollments(pathfinder_id);
    CREATE INDEX IF NOT EXISTS idx_enrollments_class ON class_enrollments(class_slug);
    CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_audit_batch ON audit_logs(batch_id);
    CREATE INDEX IF NOT EXISTS idx_pdf_cache_lookup ON pdf_cache_registry(doc_type, doc_params_json);
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
  addColumnIfNotExistsOn(targetDb, 'club_settings', 'club_logo_url', "TEXT NOT NULL DEFAULT ''");
  addColumnIfNotExistsOn(targetDb, 'club_settings', 'color_theme', "TEXT NOT NULL DEFAULT 'amber'");
  addColumnIfNotExistsOn(targetDb, 'club_settings', 'equivalences_override_json', "TEXT NOT NULL DEFAULT '{}'");

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
  addColumnIfNotExistsOn(targetDb, 'users', 'custom_role_title', "TEXT NOT NULL DEFAULT ''");
  addColumnIfNotExistsOn(targetDb, 'users', 'permissions_json', "TEXT NOT NULL DEFAULT '{}'");
  addColumnIfNotExistsOn(targetDb, 'users', 'assigned_units_json', "TEXT NOT NULL DEFAULT '[]'");
  addColumnIfNotExistsOn(targetDb, 'users', 'assigned_pathfinders_json', "TEXT NOT NULL DEFAULT '[]'");

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
 * Garante que o registro inicial de configurações (id=1) exista no banco oficial,
 * preservando integralmente todos os usuários, desbravadores e registros já criados.
 */
function ensureProductionSettings(targetDb) {
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
  const countPathfinders = targetDb.prepare('SELECT COUNT(*) as c FROM pathfinders').get().c;
  const countDesbravadorUsers = targetDb
    .prepare("SELECT COUNT(*) as c FROM users WHERE role = 'DESBRAVADOR'")
    .get().c;

  if (countPathfinders >= 14 && countDesbravadorUsers >= 4) return;

  const now = new Date().toISOString();

  targetDb.exec('BEGIN');
  try {
    // Limpa dados antigos de teste caso esteja atualizando a versão do seed
    targetDb.exec(`
      DELETE FROM activity_event_attendees;
      DELETE FROM activity_event_requirements;
      DELETE FROM activity_events;
      DELETE FROM progress_records;
      DELETE FROM class_enrollments;
      DELETE FROM pathfinders;
      DELETE FROM users;
      DELETE FROM units;
      DELETE FROM club_settings;
    `);

    targetDb
      .prepare(
        `INSERT INTO club_settings (
          id, club_name, club_region, current_year, investiture_date,
          allow_counselor_direct_approval, setup_completed, demo_mode_enabled,
          color_theme, updated_at
        ) VALUES (1, 'Clube Pioneiros da Colina (Ambiente de Teste)', '1ª Região — Associação Demonstração', 2026, '2026-11-28', 0, 1, 1, 'amber', ?)`
      )
      .run(now);

    const units = [
      { id: 'unit-aguias', name: 'Unidade Águias (Masc. 10–12)', gender: 'MASCULINO', age_range: '10 a 12 anos', desc: 'Unidade Masculina 10–12 anos', color: '#1d4ed8' },
      { id: 'unit-leoes', name: 'Unidade Leões (Masc. 13–15)', gender: 'MASCULINO', age_range: '13 a 15 anos', desc: 'Unidade Masculina 13–15 anos', color: '#4b5563' },
      { id: 'unit-estrelas', name: 'Unidade Estrelas (Fem. 10–12)', gender: 'FEMININO', age_range: '10 a 12 anos', desc: 'Unidade Feminina 10–12 anos', color: '#dc2626' },
      { id: 'unit-sentinelas', name: 'Unidade Sentinelas (Fem. 13–15)', gender: 'FEMININO', age_range: '13 a 15 anos', desc: 'Unidade Feminina 13–15 anos', color: '#16a34a' },
    ];
    const insertUnit = targetDb.prepare(`
      INSERT INTO units (id, name, gender, age_range, counselor_description, color_hex, active, created_at)
      VALUES (?, ?, ?, ?, ?, ?, 1, ?)
    `);
    for (const u of units) {
      insertUnit.run(u.id, u.name, u.gender, u.age_range, u.desc, u.color, now);
    }

    const defaultPass = hashPassword('123456');
    const leaders = [
      {
        id: 'usr-diretor',
        name: 'Carlos Eduardo (Diretor)',
        email: 'diretor@clube.org',
        role: 'DIRETOR',
        custom_role_title: 'Diretor do Clube',
        unit_id: null,
        classes: ['*'],
        permissions: {
          can_manage_pathfinders: true,
          can_manage_units: true,
          can_manage_events: true,
          can_approve_all: true,
          can_view_all_units: true,
          can_view_all_classes: true,
          can_edit_equivalences: true,
        },
        assigned_units: [],
        assigned_pathfinders: [],
      },
      {
        id: 'usr-gestor',
        name: 'Fernanda Alves (Gestora de Classes)',
        email: 'gestor@clube.org',
        role: 'GESTOR',
        custom_role_title: 'Coordenadora Geral de Classes',
        unit_id: null,
        classes: ['*'],
        permissions: {
          can_manage_pathfinders: true,
          can_manage_units: true,
          can_manage_events: true,
          can_approve_all: true,
          can_view_all_units: true,
          can_view_all_classes: true,
          can_edit_equivalences: true,
        },
        assigned_units: [],
        assigned_pathfinders: [],
      },
      {
        id: 'usr-associado',
        name: 'Roberto Mendes (Diretor Associado)',
        email: 'associado@clube.org',
        role: 'INSTRUTOR',
        custom_role_title: 'Diretor Associado',
        unit_id: null,
        classes: ['*'],
        permissions: {
          can_manage_pathfinders: true,
          can_manage_units: true,
          can_manage_events: true,
          can_approve_all: true,
          can_view_all_units: true,
          can_view_all_classes: true,
          can_edit_equivalences: true,
        },
        assigned_units: [],
        assigned_pathfinders: [],
      },
      {
        id: 'usr-secretaria',
        name: 'Mariana Souza (Secretária)',
        email: 'secretaria@clube.org',
        role: 'SECRETARIO',
        custom_role_title: 'Secretária Geral',
        unit_id: null,
        classes: ['*'],
        permissions: {
          can_manage_pathfinders: true,
          can_manage_units: true,
          can_manage_events: true,
          can_view_all_units: true,
          can_view_all_classes: true,
        },
        assigned_units: [],
        assigned_pathfinders: [],
      },
      {
        id: 'usr-capelao',
        name: 'Pr. Henrique Lima (Capelão)',
        email: 'capelao@clube.org',
        role: 'INSTRUTOR',
        custom_role_title: 'Capelão do Clube',
        unit_id: null,
        classes: ['*'],
        permissions: {
          can_view_all_classes: true,
          can_view_all_units: true,
          can_approve_all: true,
        },
        assigned_units: [],
        assigned_pathfinders: [],
      },
      {
        id: 'usr-inst-amigo-1',
        name: 'Instrutor Marcos (Amigo — Turma A)',
        email: 'instrutor.amigo@clube.org',
        role: 'INSTRUTOR',
        custom_role_title: 'Instrutor de Amigo (Turma A)',
        unit_id: null,
        classes: ['amigo', 'amigo-avancado'],
        permissions: { can_manage_pathfinders: true },
        assigned_units: [],
        assigned_pathfinders: ['dbv-01', 'dbv-02', 'dbv-08'],
      },
      {
        id: 'usr-inst-amigo-2',
        name: 'Instrutora Patrícia (Amigo — Turma B)',
        email: 'instrutor.amigo2@clube.org',
        role: 'INSTRUTOR',
        custom_role_title: 'Instrutora de Amigo (Turma B)',
        unit_id: null,
        classes: ['amigo', 'amigo-avancado'],
        permissions: { can_manage_pathfinders: true },
        assigned_units: [],
        assigned_pathfinders: ['dbv-09', 'dbv-10'],
      },
      {
        id: 'usr-inst-comp',
        name: 'Instrutor Ricardo (Companheiro)',
        email: 'instrutor.companheiro@clube.org',
        role: 'INSTRUTOR',
        custom_role_title: 'Instrutor de Companheiro',
        unit_id: null,
        classes: ['companheiro', 'companheiro-avancado'],
        permissions: { can_manage_pathfinders: true },
        assigned_units: [],
        assigned_pathfinders: [],
      },
      {
        id: 'usr-inst-pesq-pion',
        name: 'Instrutora Camila (Pesq. e Pioneiro)',
        email: 'instrutor.pesquisador@clube.org',
        role: 'INSTRUTOR',
        custom_role_title: 'Instrutora de Pesquisador e Pioneiro',
        unit_id: null,
        classes: ['pesquisador', 'pesquisador-avancado', 'pioneiro', 'pioneiro-avancado'],
        permissions: { can_manage_pathfinders: true },
        assigned_units: [],
        assigned_pathfinders: [],
      },
      {
        id: 'usr-inst-exc-guia',
        name: 'Instrutor Daniel (Excurs. e Guia)',
        email: 'instrutor.guia@clube.org',
        role: 'INSTRUTOR',
        custom_role_title: 'Instrutor de Excursionista e Guia',
        unit_id: null,
        classes: ['excursionista', 'excursionista-avancado', 'guia', 'guia-avancado'],
        permissions: { can_manage_pathfinders: true },
        assigned_units: [],
        assigned_pathfinders: [],
      },
      {
        id: 'usr-cons-aguias',
        name: 'Conselheiro Thiago (Unid. Águias)',
        email: 'conselheiro.aguias@clube.org',
        role: 'CONSELHEIRO',
        custom_role_title: 'Conselheiro da Unidade Águias',
        unit_id: 'unit-aguias',
        classes: [],
        permissions: {},
        assigned_units: ['unit-aguias'],
        assigned_pathfinders: [],
      },
      {
        id: 'usr-cons-estrelas',
        name: 'Conselheira Beatriz (Unid. Estrelas)',
        email: 'conselheira.estrelas@clube.org',
        role: 'CONSELHEIRO',
        custom_role_title: 'Conselheira da Unidade Estrelas',
        unit_id: 'unit-estrelas',
        classes: [],
        permissions: {},
        assigned_units: ['unit-estrelas'],
        assigned_pathfinders: [],
      },
      {
        id: 'usr-cons-leoes',
        name: 'Conselheiro André (Unid. Leões)',
        email: 'conselheiro.leoes@clube.org',
        role: 'CONSELHEIRO',
        custom_role_title: 'Conselheiro da Unidade Leões',
        unit_id: 'unit-leoes',
        classes: [],
        permissions: {},
        assigned_units: ['unit-leoes'],
        assigned_pathfinders: [],
      },
      {
        id: 'usr-cons-sentinelas',
        name: 'Conselheira Larissa (Unid. Sentinelas)',
        email: 'conselheira.sentinelas@clube.org',
        role: 'CONSELHEIRO',
        custom_role_title: 'Conselheira da Unidade Sentinelas',
        unit_id: 'unit-sentinelas',
        classes: [],
        permissions: {},
        assigned_units: ['unit-sentinelas'],
        assigned_pathfinders: [],
      },
    ];

    const insertUser = targetDb.prepare(`
      INSERT INTO users (
        id, name, email, password_hash, role, custom_role_title, unit_id,
        assigned_classes_json, permissions_json, assigned_units_json, assigned_pathfinders_json,
        pathfinder_id, active, is_demo, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 1, ?)
    `);
    for (const l of leaders) {
      insertUser.run(
        l.id,
        l.name,
        l.email,
        defaultPass,
        l.role,
        l.custom_role_title || '',
        l.unit_id,
        JSON.stringify(l.classes || []),
        JSON.stringify(l.permissions || {}),
        JSON.stringify(l.assigned_units || []),
        JSON.stringify(l.assigned_pathfinders || []),
        null,
        now
      );
    }

    const pathfindersData = [
      { id: 'dbv-01', name: 'Lucas Gabriel Silva (Amigo)', email: 'dbv.lucas@clube.org', userId: 'usr-dbv-01', birth: '2016-03-14', gender: 'M', unit: 'unit-aguias', classes: ['amigo', 'amigo-avancado'], notes: 'Turma A - Instrutor Marcos.', regDoneCount: 18, advDoneCount: 5 },
      { id: 'dbv-02', name: 'Sofia Martins Rocha (Amigo)', email: 'dbv.sofia@clube.org', userId: 'usr-dbv-02', birth: '2016-02-09', gender: 'F', unit: 'unit-estrelas', classes: ['amigo', 'amigo-avancado'], notes: 'Turma A - Instrutor Marcos.', regDoneCount: 23, advDoneCount: 8 },
      { id: 'dbv-08', name: 'Mateus Ribeiro (Amigo)', email: '', userId: null, birth: '2016-07-22', gender: 'M', unit: 'unit-aguias', classes: ['amigo', 'amigo-avancado'], notes: 'Turma A - Instrutor Marcos.', regDoneCount: 12, advDoneCount: 2 },
      { id: 'dbv-09', name: 'Helena Ferreira (Amigo)', email: '', userId: null, birth: '2016-05-19', gender: 'F', unit: 'unit-estrelas', classes: ['amigo', 'amigo-avancado'], notes: 'Turma B - Instrutora Patrícia.', regDoneCount: 20, advDoneCount: 6 },
      { id: 'dbv-10', name: 'Davi Lucca Almeida (Amigo)', email: '', userId: null, birth: '2016-08-30', gender: 'M', unit: 'unit-aguias', classes: ['amigo'], notes: 'Turma B - Instrutora Patrícia.', regDoneCount: 9, advDoneCount: 0 },
      { id: 'dbv-03', name: 'Pedro Henrique Santos (Companheiro)', email: 'dbv.pedro@clube.org', userId: 'usr-dbv-03', birth: '2015-04-11', gender: 'M', unit: 'unit-aguias', classes: ['companheiro', 'companheiro-avancado', 'amigo'], grouped: true, notes: 'Fazendo Classes Agrupadas (Amigo + Companheiro).', regDoneCount: 22, advDoneCount: 8 },
      { id: 'dbv-11', name: 'Alice Carvalho (Companheiro)', email: '', userId: null, birth: '2015-09-14', gender: 'F', unit: 'unit-estrelas', classes: ['companheiro', 'companheiro-avancado'], notes: 'Muito participativa nas especialidades.', regDoneCount: 19, advDoneCount: 6 },
      { id: 'dbv-12', name: 'Guilherme Nogueira (Companheiro)', email: '', userId: null, birth: '2015-11-03', gender: 'M', unit: 'unit-aguias', classes: ['companheiro'], notes: 'Iniciou no segundo trimestre.', regDoneCount: 11, advDoneCount: 0 },
      { id: 'dbv-04', name: 'Júlia Oliveira Lima (Pesquisador)', email: 'dbv.julia@clube.org', userId: 'usr-dbv-04', birth: '2014-06-12', gender: 'F', unit: 'unit-estrelas', classes: ['pesquisador', 'pesquisador-avancado'], notes: 'Líder de patrulha na unidade.', regDoneCount: 21, advDoneCount: 9 },
      { id: 'dbv-13', name: 'Enzo Gabriel Barros (Pesquisador)', email: '', userId: null, birth: '2014-01-25', gender: 'M', unit: 'unit-aguias', classes: ['pesquisador', 'pesquisador-avancado'], notes: 'Gosta de acampamento e pioneiria.', regDoneCount: 15, advDoneCount: 4 },
      { id: 'dbv-05', name: 'Rafael Costa Mendes (Pioneiro)', email: 'dbv.rafael@clube.org', userId: 'usr-dbv-05', birth: '2013-02-27', gender: 'M', unit: 'unit-leoes', classes: ['pioneiro', 'pioneiro-avancado', 'pesquisador'], grouped: true, notes: 'Recuperando requisitos de Pesquisador junto com Pioneiro.', regDoneCount: 21, advDoneCount: 8 },
      { id: 'dbv-14', name: 'Manuela Teixeira (Pioneiro)', email: '', userId: null, birth: '2013-07-08', gender: 'F', unit: 'unit-sentinelas', classes: ['pioneiro', 'pioneiro-avancado'], notes: 'Excelente desempenho em primeiros socorros.', regDoneCount: 17, advDoneCount: 5 },
      { id: 'dbv-06', name: 'Laura Beatriz Dias (Excursionista)', email: 'dbv.laura@clube.org', userId: 'usr-dbv-06', birth: '2012-09-21', gender: 'F', unit: 'unit-sentinelas', classes: ['excursionista', 'excursionista-avancado'], notes: 'Auxiliar de unidade.', regDoneCount: 20, advDoneCount: 7 },
      { id: 'dbv-15', name: 'Arthur Vinicius Moraes (Excursionista)', email: '', userId: null, birth: '2012-04-16', gender: 'M', unit: 'unit-leoes', classes: ['excursionista', 'excursionista-avancado'], notes: 'Participa da equipe de ordem unida.', regDoneCount: 14, advDoneCount: 3 },
      { id: 'dbv-07', name: 'Gabriel Moreira (Guia)', email: '', userId: null, birth: '2011-01-17', gender: 'M', unit: 'unit-leoes', classes: ['guia', 'guia-avancado'], notes: 'Candidato à investidura de Guia em novembro.', regDoneCount: 25, advDoneCount: 9 },
      { id: 'dbv-16', name: 'Isabela Fernandes (Guia)', email: '', userId: null, birth: '2011-05-29', gender: 'F', unit: 'unit-sentinelas', classes: ['guia', 'guia-avancado', 'excursionista'], grouped: true, notes: 'Concluindo Cartão Agrupado para investidura.', regDoneCount: 23, advDoneCount: 8 },
    ];

    const insertPathfinder = targetDb.prepare(`
      INSERT INTO pathfinders (id, name, email, user_id, invite_status, birth_date, gender, unit_id, notes, active, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
    `);
    const insertEnrollment = targetDb.prepare(`
      INSERT INTO class_enrollments (id, pathfinder_id, class_slug, year, is_grouped_card, status, enrolled_at)
      VALUES (?, ?, ?, 2026, ?, 'EM_ANDAMENTO', ?)
    `);
    const insertProgress = targetDb.prepare(`
      INSERT INTO progress_records (
        id, pathfinder_id, requirement_id, status, completed_sub_items_json,
        notes, submission_text, submitted_by_pathfinder, submitted_at,
        completed_at, marked_by_user_id, marked_by_name,
        approved_by_user_id, approved_by_name, event_id, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const reqsByClass = {};
    const allReqs = targetDb.prepare('SELECT * FROM requirements_catalog ORDER BY display_order ASC').all();
    for (const r of allReqs) {
      if (!reqsByClass[r.class_slug]) reqsByClass[r.class_slug] = [];
      reqsByClass[r.class_slug].push(r);
    }

    for (const pf of pathfindersData) {
      insertPathfinder.run(
        pf.id,
        pf.name,
        pf.email || '',
        pf.userId || null,
        pf.userId ? 'ACTIVE' : 'NONE',
        pf.birth,
        pf.gender,
        pf.unit,
        pf.notes,
        now
      );

      if (pf.userId && pf.email) {
        insertUser.run(
          pf.userId,
          pf.name,
          pf.email,
          defaultPass,
          'DESBRAVADOR',
          'Desbravador(a)',
          pf.unit,
          JSON.stringify(pf.classes || []),
          JSON.stringify({}),
          JSON.stringify([pf.unit]),
          JSON.stringify([pf.id]),
          pf.id,
          now
        );
      }

      for (let cIdx = 0; cIdx < pf.classes.length; cIdx++) {
        const cSlug = pf.classes[cIdx];
        insertEnrollment.run(
          crypto.randomUUID(),
          pf.id,
          cSlug,
          pf.grouped ? 1 : 0,
          '2026-02-15T10:00:00.000Z'
        );
        const classReqs = reqsByClass[cSlug] || [];
        const isAdv = cSlug.endsWith('-avancado');
        // Para a segunda classe regular de um cartão agrupado, deixamos menos itens concluídos
        // para demonstrar os Avisos de Unificação Automática no Dashboard!
        const targetDone =
          cIdx >= 2 ? 4 : isAdv ? pf.advDoneCount : pf.regDoneCount;

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
              '',
              0,
              null,
              '2026-06-14',
              'usr-diretor',
              'Carlos Eduardo (Diretor)',
              'usr-diretor',
              'Carlos Eduardo (Diretor)',
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
              'Atividade concluída no caderno/encontro.',
              'Enviei meu resumo e conclusão da atividade para revisão do instrutor.',
              1,
              '2026-09-20T11:30:00.000Z',
              '2026-09-20',
              pf.userId || 'usr-cons-aguias',
              pf.userId ? pf.name : 'Conselheiro Thiago (Unid. Águias)',
              null,
              null,
              null,
              '2026-09-20T11:30:00.000Z'
            );
          }
        }
      }
    }

    // Eventos de Exemplo
    const insertEvent = targetDb.prepare(`
      INSERT INTO activity_events (
        id, title, description, event_type, location, scheduled_date,
        status, notes, created_by_user_id, created_by_name, executed_at, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const insertEventReq = targetDb.prepare(`
      INSERT INTO activity_event_requirements (event_id, requirement_id) VALUES (?, ?)
    `);
    const insertEventAtt = targetDb.prepare(`
      INSERT INTO activity_event_attendees (event_id, pathfinder_id, attended) VALUES (?, ?, 1)
    `);

    insertEvent.run(
      'evt-demo-1',
      'Acampamento de Outono e Pioneiria Unificada',
      'Fim de semana prático cobrindo fogueiras, nós, barracas e caminhada ecológica para todas as classes.',
      'ACAMPAMENTO',
      'Parque Ecológico da Serra',
      '2026-05-16',
      'REALIZADO',
      'Evento realizado com 100% de aproveitamento das unidades.',
      'usr-diretor',
      'Carlos Eduardo (Diretor)',
      '2026-05-17T18:00:00.000Z',
      now
    );
    insertEvent.run(
      'evt-demo-2',
      'Sábado de Comunidade e Projeto Solidário',
      'Ação comunitária de arrecadação e visitação cumprindo a seção Servindo a Outros.',
      'PROJETO_COMUNITARIO',
      'Comunidade Bairro Esperança',
      '2026-08-22',
      'PLANEJADO',
      'Levar uniforme oficial completo.',
      'usr-secretaria',
      'Mariana Souza (Secretária)',
      null,
      now
    );

    const campReqs = allReqs.filter((r) => r.execution_context === 'ACAMPAMENTO').slice(0, 6);
    for (const cr of campReqs) {
      insertEventReq.run('evt-demo-1', cr.id);
    }
    for (const pf of pathfindersData.slice(0, 10)) {
      insertEventAtt.run('evt-demo-1', pf.id);
      insertEventAtt.run('evt-demo-2', pf.id);
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
  ensureProductionSettings(prodDb);

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
