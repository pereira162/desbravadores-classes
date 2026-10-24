const { DatabaseSync } = require('node:sqlite');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { hashPassword } = require('./auth');

const DATA_DIR = path.resolve(__dirname, '../../data');
const DB_PATH = path.join(DATA_DIR, 'clube_desbravadores.sqlite');
const CARDS_JSON_PATH = path.join(DATA_DIR, 'cartoes-classes.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const db = new DatabaseSync(DB_PATH);
db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA foreign_keys = ON;');

function loadCardsMetadata() {
  const raw = fs.readFileSync(CARDS_JSON_PATH, 'utf8');
  return JSON.parse(raw);
}

function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS club_settings (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      club_name TEXT NOT NULL DEFAULT 'Clube Pioneiros da Colina',
      club_region TEXT NOT NULL DEFAULT '3ª Região — Associação Paulistana / DSA',
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

  syncOfficialCatalog();
  seedInitialClubDataIfEmpty();
}

function syncOfficialCatalog() {
  const data = loadCardsMetadata();

  const upsertClass = db.prepare(`
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

  const upsertReq = db.prepare(`
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

  db.exec('BEGIN');
  try {
    let classOrder = 1;
    let reqOrder = 1;

    for (const cls of data.classes) {
      // Regular Class
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

      // Advanced Class
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
    db.exec('COMMIT');
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
}

function recordAudit({
  user,
  action,
  entityType,
  entityId,
  batchId = null,
  summary,
  previousState = null,
  newState = null,
  createdAt = null,
}) {
  const id = crypto.randomUUID();
  const now = createdAt || new Date().toISOString();
  db.prepare(`
    INSERT INTO audit_logs (
      id, user_id, user_name, user_role, action, entity_type, entity_id,
      batch_id, summary, previous_state_json, new_state_json, reverted, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)
  `).run(
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

function seedInitialClubDataIfEmpty() {
  const countUsers = db.prepare('SELECT COUNT(*) as c FROM users').get().c;
  if (countUsers > 0) return;

  const now = new Date().toISOString();

  db.exec('BEGIN');
  try {
    // 1. Club Settings
    db.prepare(`
      INSERT INTO club_settings (id, club_name, club_region, current_year, investiture_date, allow_counselor_direct_approval, updated_at)
      VALUES (1, 'Clube Pioneiros da Colina', '3ª Região — Associação / DSA', 2026, '2026-11-28', 0, ?)
    `).run(now);

    // 2. Units
    const units = [
      { id: 'unit-aguias', name: 'Águias do Sul', gender: 'MASCULINO', desc: 'Unidade Masculina 10–12 anos', color: '#1d4ed8' },
      { id: 'unit-leoes', name: 'Leões de Judá', gender: 'MASCULINO', desc: 'Unidade Masculina 13–15 anos', color: '#4b5563' },
      { id: 'unit-estrelas', name: 'Estrelas de Órion', gender: 'FEMININO', desc: 'Unidade Feminina 10–12 anos', color: '#dc2626' },
      { id: 'unit-sentinelas', name: 'Sentinelas da Mata', gender: 'FEMININO', desc: 'Unidade Feminina 13–15 anos', color: '#16a34a' },
    ];
    const insertUnit = db.prepare(`
      INSERT INTO units (id, name, gender, counselor_description, color_hex, active, created_at)
      VALUES (?, ?, ?, ?, ?, 1, ?)
    `);
    for (const u of units) {
      insertUnit.run(u.id, u.name, u.gender, u.desc, u.color, now);
    }

    // 3. Leaders / Users (default password: 123456)
    const defaultPass = hashPassword('123456');
    const leaders = [
      {
        id: 'usr-diretor',
        name: 'Lucas Almeida (Diretor)',
        email: 'diretor@clube.org',
        role: 'DIRETOR',
        unit_id: null,
        classes: ['*'],
      },
      {
        id: 'usr-secretaria',
        name: 'Mariana Costa (Secretária)',
        email: 'secretaria@clube.org',
        role: 'SECRETARIO',
        unit_id: null,
        classes: ['*'],
      },
      {
        id: 'usr-inst-amigo-comp',
        name: 'Rafael Mendes (Inst. Amigo/Comp.)',
        email: 'instrutor.amigo@clube.org',
        role: 'INSTRUTOR',
        unit_id: null,
        classes: ['amigo', 'amigo-avancado', 'companheiro', 'companheiro-avancado'],
      },
      {
        id: 'usr-inst-pesq-pion',
        name: 'Beatriz Oliveira (Inst. Pesq./Pion.)',
        email: 'instrutor.pesquisador@clube.org',
        role: 'INSTRUTOR',
        unit_id: null,
        classes: ['pesquisador', 'pesquisador-avancado', 'pioneiro', 'pioneiro-avancado'],
      },
      {
        id: 'usr-inst-exc-guia',
        name: 'Gabriel Santos (Inst. Exc./Guia)',
        email: 'instrutor.guia@clube.org',
        role: 'INSTRUTOR',
        unit_id: null,
        classes: ['excursionista', 'excursionista-avancado', 'guia', 'guia-avancado'],
      },
      {
        id: 'usr-cons-aguias',
        name: 'Thiago Rocha (Cons. Águias)',
        email: 'conselheiro.aguias@clube.org',
        role: 'CONSELHEIRO',
        unit_id: 'unit-aguias',
        classes: [],
      },
      {
        id: 'usr-cons-estrelas',
        name: 'Camila Ferreira (Cons. Estrelas)',
        email: 'conselheira.estrelas@clube.org',
        role: 'CONSELHEIRO',
        unit_id: 'unit-estrelas',
        classes: [],
      },
    ];

    const insertUser = db.prepare(`
      INSERT INTO users (id, name, email, password_hash, role, unit_id, assigned_classes_json, active, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?)
    `);
    for (const l of leaders) {
      insertUser.run(l.id, l.name, l.email, defaultPass, l.role, l.unit_id, JSON.stringify(l.classes), now);
    }

    // 4. Pathfinders (18 desbravadores em todas as classes de 10 a 15 anos)
    const pathfindersData = [
      // 10 anos - Amigo + Amigo da Natureza
      {
        id: 'dbv-01',
        name: 'Pedro Henrique Souza',
        birth: '2016-03-14',
        gender: 'M',
        unit: 'unit-aguias',
        classes: ['amigo', 'amigo-avancado'],
        notes: 'Muito dedicado nos nós e acampamento.',
        regDoneCount: 16,
        advDoneCount: 4,
      },
      {
        id: 'dbv-02',
        name: 'Davi Lucca Martins',
        birth: '2016-07-22',
        gender: 'M',
        unit: 'unit-aguias',
        classes: ['amigo', 'amigo-avancado'],
        notes: 'Entrou no início do semestre.',
        regDoneCount: 11,
        advDoneCount: 2,
      },
      {
        id: 'dbv-03',
        name: 'Ana Clara Ribeiro',
        birth: '2016-02-09',
        gender: 'F',
        unit: 'unit-estrelas',
        classes: ['amigo', 'amigo-avancado'],
        notes: 'Quase pronta na classe regular!',
        regDoneCount: 22,
        advDoneCount: 7,
      },
      {
        id: 'dbv-04',
        name: 'Sofia Helena Castro',
        birth: '2016-09-18',
        gender: 'F',
        unit: 'unit-estrelas',
        classes: ['amigo'],
        notes: 'Fazendo classe regular de Amigo.',
        regDoneCount: 14,
        advDoneCount: 0,
      },

      // 11 anos - Companheiro + Companheiro de Excursionismo
      {
        id: 'dbv-05',
        name: 'Matheus Oliveira Lima',
        birth: '2015-04-11',
        gender: 'M',
        unit: 'unit-aguias',
        classes: ['companheiro', 'companheiro-avancado'],
        notes: 'Investido em Amigo no ano passado.',
        regDoneCount: 23,
        advDoneCount: 9,
      },
      {
        id: 'dbv-06',
        name: 'Samuel Pereira Gomes',
        birth: '2015-08-30',
        gender: 'M',
        unit: 'unit-aguias',
        classes: ['companheiro', 'companheiro-avancado'],
        notes: 'Precisa repor caminhada de 6 km.',
        regDoneCount: 15,
        advDoneCount: 5,
      },
      {
        id: 'dbv-07',
        name: 'Laura Beatriz Nunes',
        birth: '2015-01-25',
        gender: 'F',
        unit: 'unit-estrelas',
        classes: ['companheiro', 'companheiro-avancado'],
        notes: 'Excelente participação na Classe Bíblica.',
        regDoneCount: 20,
        advDoneCount: 8,
      },

      // 12 anos - Pesquisador + Pesquisador de Campo e Bosque
      {
        id: 'dbv-08',
        name: 'Guilherme Augusto Dias',
        birth: '2014-05-19',
        gender: 'M',
        unit: 'unit-aguias',
        classes: ['pesquisador', 'pesquisador-avancado'],
        notes: 'Gosta de astronomia e código Morse.',
        regDoneCount: 20,
        advDoneCount: 9,
      },
      {
        id: 'dbv-09',
        name: 'Enzo Gabriel Cardoso',
        birth: '2014-10-03',
        gender: 'M',
        unit: 'unit-aguias',
        classes: ['pesquisador', 'pesquisador-avancado'],
        notes: 'Faltou ao último acampamento.',
        regDoneCount: 10,
        advDoneCount: 3,
      },
      {
        id: 'dbv-10',
        name: 'Júlia Vitória Barros',
        birth: '2014-06-12',
        gender: 'F',
        unit: 'unit-estrelas',
        classes: ['pesquisador', 'pesquisador-avancado'],
        notes: 'Capitã da unidade Estrelas de Órion.',
        regDoneCount: 21,
        advDoneCount: 9,
      },

      // 13 anos - Pioneiro + Pioneiro de Novas Fronteiras
      {
        id: 'dbv-11',
        name: 'Leonardo Silva Teixeira',
        birth: '2013-02-27',
        gender: 'M',
        unit: 'unit-leoes',
        classes: ['pioneiro', 'pioneiro-avancado'],
        notes: 'Especialista em fogueiras e pioneiria.',
        regDoneCount: 21,
        advDoneCount: 8,
      },
      {
        id: 'dbv-12',
        name: 'Felipe Eduardo Moreira',
        birth: '2013-11-08',
        gender: 'M',
        unit: 'unit-leoes',
        classes: ['pioneiro', 'pioneiro-avancado'],
        notes: 'Em dia com o Ano Bíblico.',
        regDoneCount: 14,
        advDoneCount: 4,
      },
      {
        id: 'dbv-13',
        name: 'Isabela Fernanda Araújo',
        birth: '2013-07-15',
        gender: 'F',
        unit: 'unit-sentinelas',
        classes: ['pioneiro', 'pioneiro-avancado'],
        notes: 'Secretária da unidade Sentinelas.',
        regDoneCount: 18,
        advDoneCount: 6,
      },

      // 14 anos - Excursionista + Excursionista na Mata
      {
        id: 'dbv-14',
        name: 'Daniel Henrique Freitas',
        birth: '2012-03-04',
        gender: 'M',
        unit: 'unit-leoes',
        classes: ['excursionista', 'excursionista-avancado'],
        notes: 'Aguardando expedição de 20 km com pernoite.',
        regDoneCount: 22,
        advDoneCount: 8,
      },
      {
        id: 'dbv-15',
        name: 'Giovanna Letícia Vieira',
        birth: '2012-09-21',
        gender: 'F',
        unit: 'unit-sentinelas',
        classes: ['excursionista', 'excursionista-avancado'],
        notes: 'Lidera a equipe de Ordem Unida.',
        regDoneCount: 19,
        advDoneCount: 7,
      },
      {
        id: 'dbv-16',
        name: 'Letícia Moraes Carvalho',
        birth: '2012-12-02',
        gender: 'F',
        unit: 'unit-sentinelas',
        classes: ['excursionista'],
        notes: 'Entrou este ano no clube.',
        regDoneCount: 11,
        advDoneCount: 0,
      },

      // 15 anos - Guia + Guia de Exploração
      {
        id: 'dbv-17',
        name: 'Vitor Hugo Nascimento',
        birth: '2011-01-17',
        gender: 'M',
        unit: 'unit-leoes',
        classes: ['guia', 'guia-avancado'],
        notes: 'Reta final para investidura de Guia!',
        regDoneCount: 24,
        advDoneCount: 9,
      },
      {
        id: 'dbv-18',
        name: 'Maria Eduarda Monteiro',
        birth: '2011-05-29',
        gender: 'F',
        unit: 'unit-sentinelas',
        classes: ['guia', 'guia-avancado'],
        notes: 'Concluindo relatório de diaconato e mestrado.',
        regDoneCount: 22,
        advDoneCount: 7,
      },
    ];

    const insertPathfinder = db.prepare(`
      INSERT INTO pathfinders (id, name, birth_date, gender, unit_id, notes, active, created_at)
      VALUES (?, ?, ?, ?, ?, ?, 1, ?)
    `);
    const insertEnrollment = db.prepare(`
      INSERT INTO class_enrollments (id, pathfinder_id, class_slug, year, is_grouped_card, status, enrolled_at)
      VALUES (?, ?, ?, 2026, 0, 'EM_ANDAMENTO', ?)
    `);
    const insertProgress = db.prepare(`
      INSERT INTO progress_records (
        id, pathfinder_id, requirement_id, status, completed_sub_items_json,
        notes, completed_at, marked_by_user_id, marked_by_name,
        approved_by_user_id, approved_by_name, event_id, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const reqsByClass = {};
    const allReqs = db.prepare('SELECT * FROM requirements_catalog ORDER BY display_order ASC').all();
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
            // Aprovado
            insertProgress.run(
              crypto.randomUUID(),
              pf.id,
              reqItem.id,
              'APROVADO',
              JSON.stringify(allSubCodes),
              idx % 4 === 0 ? 'Conferido em atividade regular do clube' : '',
              '2026-06-14',
              'usr-diretor',
              'Lucas Almeida (Diretor)',
              'usr-diretor',
              'Lucas Almeida (Diretor)',
              null,
              '2026-06-14T14:00:00.000Z'
            );
          } else if (idx === targetDone) {
            // Concluído pelo Conselheiro (Aguardando aprovação final do Instrutor/Diretor)
            insertProgress.run(
              crypto.randomUUID(),
              pf.id,
              reqItem.id,
              'CONCLUIDO',
              JSON.stringify(allSubCodes),
              'Feito no cantinho da unidade — aguardando visto do instrutor',
              '2026-09-20',
              'usr-cons-aguias',
              'Thiago Rocha (Cons. Águias)',
              null,
              null,
              null,
              '2026-09-20T11:30:00.000Z'
            );
          } else if (idx === targetDone + 1) {
            // Em andamento (com metade dos sub-itens feitos)
            const halfSubs = allSubCodes.slice(0, Math.ceil(allSubCodes.length / 2));
            insertProgress.run(
              crypto.randomUUID(),
              pf.id,
              reqItem.id,
              'EM_ANDAMENTO',
              JSON.stringify(halfSubs),
              'Iniciado — acompanhando leitura/execução',
              null,
              'usr-inst-amigo-comp',
              'Rafael Mendes (Inst. Amigo/Comp.)',
              null,
              null,
              null,
              '2026-10-05T10:00:00.000Z'
            );
          }
        }
      }
    }

    // 5. Sample Activity Events (1 Realizado + 2 Planejados)
    const sampleEvents = [
      {
        id: 'evt-acamp-inverno',
        title: 'Acampamento de Inverno — Arte Campestre & Fogueiras',
        description: 'Acampamento geral do clube focado nos requisitos de montagem de barraca, fogueiras, refeições ao ar livre e móveis de pioneiria.',
        event_type: 'ACAMPAMENTO',
        location: 'Estância Águas Claras',
        scheduled_date: '2026-07-18',
        status: 'REALIZADO',
        notes: 'Participação de todas as 4 unidades.',
        executed_at: '2026-07-19T18:00:00.000Z',
        batch_id: 'batch-acamp-inverno-2026',
        reqs: ['AMIGO_VII_3', 'COMPANHEIRO_VIII_2', 'PESQUISADOR_VIII_1', 'PIONEIRO_VIII_1', 'PIONEIRO_VIII_2', 'GUIA_VIII_1'],
        attendees: ['dbv-01', 'dbv-03', 'dbv-05', 'dbv-07', 'dbv-08', 'dbv-10', 'dbv-11', 'dbv-13', 'dbv-17', 'dbv-18'],
      },
      {
        id: 'evt-domingo-caminhada',
        title: 'Domingo de Excursionismo e Caminhada Unificada (5km, 6km e 10km)',
        description: 'Saída de campo unificando as caminhadas de Amigo (5km), Companheiro Av. (6km), Pesquisador Av. (10km) e Pioneiro Av. (10km), além de sinais de pista e bússola.',
        event_type: 'CAMINHADA',
        location: 'Trilha da Serra Verde',
        scheduled_date: '2026-11-08',
        status: 'PLANEJADO',
        notes: 'Levar cantil, boné, protetor solar, bússola e caderno de campo.',
        executed_at: null,
        batch_id: null,
        reqs: [
          'AMIGO_VI_1',
          'AMIGO_VIII_3',
          'AMIGO_VIII_4',
          'COMPANHEIRO_AVANCADO_AV_5',
          'PESQUISADOR_AVANCADO_AV_5',
          'PIONEIRO_AVANCADO_AV_3',
        ],
        attendees: ['dbv-01', 'dbv-02', 'dbv-04', 'dbv-06', 'dbv-09', 'dbv-12', 'dbv-13'],
      },
      {
        id: 'evt-sabado-comunidade',
        title: 'Mutirão Comunitário & Visita Solidária do Clube',
        description: 'Ação social unificada para cumprir os requisitos da seção III (Servindo a Outros) de todas as classes regulares e avançadas.',
        event_type: 'COMUNIDADE',
        location: 'Bairro Jardim Esperança & Lar dos Idosos',
        scheduled_date: '2026-11-15',
        status: 'PLANEJADO',
        notes: 'Arrecadação de cestas básicas e visita musical.',
        executed_at: null,
        batch_id: null,
        reqs: ['AMIGO_III_1', 'COMPANHEIRO_III_1', 'PESQUISADOR_III_1', 'PIONEIRO_III_2', 'EXCURSIONISTA_III_2', 'GUIA_III_1'],
        attendees: ['dbv-02', 'dbv-04', 'dbv-06', 'dbv-09', 'dbv-12', 'dbv-15', 'dbv-16'],
      },
    ];

    const insertEvent = db.prepare(`
      INSERT INTO activity_events (
        id, title, description, event_type, location, scheduled_date, status,
        notes, created_by_user_id, created_by_name, executed_at, batch_id, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'usr-diretor', 'Lucas Almeida (Diretor)', ?, ?, ?)
    `);
    const insertEventReq = db.prepare(`
      INSERT OR IGNORE INTO activity_event_requirements (event_id, requirement_id) VALUES (?, ?)
    `);
    const insertEventAtt = db.prepare(`
      INSERT OR IGNORE INTO activity_event_attendees (event_id, pathfinder_id, attended) VALUES (?, ?, 1)
    `);

    for (const ev of sampleEvents) {
      insertEvent.run(
        ev.id,
        ev.title,
        ev.description,
        ev.event_type,
        ev.location,
        ev.scheduled_date,
        ev.status,
        ev.notes,
        ev.executed_at,
        ev.batch_id,
        now
      );
      for (const rid of ev.reqs) insertEventReq.run(ev.id, rid);
      for (const pid of ev.attendees) insertEventAtt.run(ev.id, pid);
    }

    // 6. Initial Audit Logs
    recordAudit({
      user: { id: 'usr-diretor', name: 'Lucas Almeida (Diretor)', role: 'DIRETOR' },
      action: 'BULK_EVENT_APPROVE',
      entityType: 'ACTIVITY_EVENT',
      entityId: 'evt-acamp-inverno',
      batchId: 'batch-acamp-inverno-2026',
      summary: 'Aprovação em lote do evento "Acampamento de Inverno — Arte Campestre & Fogueiras" (10 desbravadores, 6 requisitos de acampamento).',
      previousState: { status: 'PLANEJADO' },
      newState: { status: 'REALIZADO', attendees_count: 10, requirements_count: 6 },
      createdAt: '2026-07-19T18:00:00.000Z',
    });

    recordAudit({
      user: { id: 'usr-cons-aguias', name: 'Thiago Rocha (Cons. Águias)', role: 'CONSELHEIRO' },
      action: 'STATUS_CHANGE',
      entityType: 'PROGRESS_RECORD',
      entityId: 'dbv-01:AMIGO_VII_1',
      summary: 'Conselheiro Thiago Rocha marcou o requisito VII.1 (Amigo) de Pedro Henrique Souza como CONCLUÍDO (aguardando aprovação do instrutor).',
      previousState: { status: 'PENDENTE', notes: '' },
      newState: { status: 'CONCLUIDO', notes: 'Feito no cantinho da unidade — aguardando visto do instrutor' },
      createdAt: '2026-09-20T11:30:00.000Z',
    });

    recordAudit({
      user: { id: 'usr-inst-amigo-comp', name: 'Rafael Mendes (Inst. Amigo/Comp.)', role: 'INSTRUTOR' },
      action: 'STATUS_CHANGE',
      entityType: 'PROGRESS_RECORD',
      entityId: 'dbv-03:AMIGO_VIII_1',
      summary: 'Instrutor Rafael Mendes aprovou o requisito VIII.1 (14 nós básicos — Amigo) para Ana Clara Ribeiro.',
      previousState: { status: 'CONCLUIDO', completed_sub_items: ['a', 'b', 'c', 'd', 'e'] },
      newState: { status: 'APROVADO', completed_sub_items: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n'] },
      createdAt: '2026-10-12T15:20:00.000Z',
    });

    db.exec('COMMIT');
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
}

module.exports = {
  db,
  initDatabase,
  loadCardsMetadata,
  recordAudit,
};
