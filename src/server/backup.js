const fs = require('node:fs');
const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');

const DATA_DIR = path.resolve(__dirname, '../../data');
const BACKUP_DIR = path.join(DATA_DIR, 'backups');
const MANIFEST_PATH = path.join(BACKUP_DIR, 'manifest.json');

// Garante que o diretório de backups exista
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

function loadManifest() {
  try {
    if (fs.existsSync(MANIFEST_PATH)) {
      return JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
    }
  } catch (err) {
    console.error('[BACKUP] Erro ao carregar manifest.json:', err.message);
  }
  return [];
}

function saveManifest(items) {
  try {
    fs.writeFileSync(MANIFEST_PATH, JSON.stringify(items, null, 2), 'utf8');
  } catch (err) {
    console.error('[BACKUP] Erro ao salvar manifest.json:', err.message);
  }
}

function sanitizeLabel(label) {
  return String(label || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '_')
    .slice(0, 40);
}

function formatTimestamp(d = new Date()) {
  const pad = (n) => String(n).padStart(2, '0');
  const yyyy = d.getFullYear();
  const mm = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  const hh = pad(d.getHours());
  const min = pad(d.getMinutes());
  const ss = pad(d.getSeconds());
  return `${yyyy}-${mm}-${dd}_${hh}-${min}-${ss}`;
}

/**
 * Cria snapshot pontual e seguro de uma instância de banco SQLite utilizando VACUUM INTO
 */
function createSnapshot({ dbInstance, dbType = 'prod', trigger = 'AUTO', label = '', reason = '' }) {
  if (!dbInstance) {
    throw new Error('Instância de banco de dados não informada para o backup.');
  }

  const now = new Date();
  const tsStr = formatTimestamp(now);
  const cleanLabel = sanitizeLabel(label);
  const filename = `backup_${dbType}_${tsStr}_${trigger.toLowerCase()}${cleanLabel ? '_' + cleanLabel : ''}.sqlite`;
  const backupFilePath = path.join(BACKUP_DIR, filename);

  // Escapar aspas simples no caminho do arquivo para o SQLite
  const escapedPath = backupFilePath.replace(/'/g, "''");

  // Executa VACUUM INTO (atômico e seguro mesmo com WAL ativo e requisições concorrentes)
  dbInstance.exec(`VACUUM INTO '${escapedPath}';`);

  // Obtém estatísticas do banco no momento do backup
  let pathfindersCount = 0;
  let progressCount = 0;
  let usersCount = 0;
  let unitsCount = 0;

  try {
    pathfindersCount = dbInstance.prepare('SELECT count(*) as c FROM pathfinders;').get()?.c || 0;
    progressCount = dbInstance.prepare('SELECT count(*) as c FROM progress_records;').get()?.c || 0;
    usersCount = dbInstance.prepare('SELECT count(*) as c FROM users;').get()?.c || 0;
    unitsCount = dbInstance.prepare('SELECT count(*) as c FROM units;').get()?.c || 0;
  } catch (statErr) {
    // Ignora se alguma tabela não existir ainda
  }

  const fileStats = fs.existsSync(backupFilePath) ? fs.statSync(backupFilePath) : { size: 0 };

  const backupMeta = {
    filename,
    db_type: dbType,
    trigger,
    label: cleanLabel || trigger,
    reason: reason || `Snapshot automático (${trigger})`,
    size_bytes: fileStats.size,
    created_at: now.toISOString(),
    stats: {
      pathfinders: pathfindersCount,
      progress_records: progressCount,
      users: usersCount,
      units: unitsCount,
    },
  };

  const manifest = loadManifest();
  manifest.unshift(backupMeta);
  saveManifest(manifest);

  // Executa rotação para manter apenas backups relevantes
  rotateBackups();

  return backupMeta;
}

/**
 * Rotação automática de backups:
 * Mantém todos os manuais, backups dos últimos 7 dias e no máximo 50 backups totais
 */
function rotateBackups({ maxBackups = 50, keepDays = 7 } = {}) {
  try {
    const manifest = loadManifest();
    const cutoffDate = new Date(Date.now() - keepDays * 24 * 60 * 60 * 1000);

    const kept = [];
    const toDelete = [];

    for (let i = 0; i < manifest.length; i++) {
      const item = manifest[i];
      const itemDate = new Date(item.created_at);
      const isManual = item.trigger === 'MANUAL' || item.trigger === 'HISTORICO';
      const isRecent = itemDate >= cutoffDate;

      // Preserva se for manual, recente, ou se estiver dentro do limite máximo
      if (isManual || isRecent || kept.length < maxBackups) {
        kept.push(item);
      } else {
        toDelete.push(item);
      }
    }

    for (const item of toDelete) {
      const p = path.join(BACKUP_DIR, item.filename);
      if (fs.existsSync(p)) {
        try {
          fs.unlinkSync(p);
        } catch (e) {
          console.warn(`[BACKUP] Não foi possível remover arquivo antigo ${item.filename}:`, e.message);
        }
      }
    }

    saveManifest(kept);
  } catch (err) {
    console.error('[BACKUP] Erro durante rotação de backups:', err.message);
  }
}

/**
 * Lista todos os backups disponíveis no disco, integrando manifest e arquivos órfãos
 */
function listBackups() {
  const manifest = loadManifest();
  const manifestMap = new Map(manifest.map((m) => [m.filename, m]));

  const files = fs.readdirSync(BACKUP_DIR).filter((f) => f.endsWith('.sqlite'));
  const results = [];

  for (const f of files) {
    const fullPath = path.join(BACKUP_DIR, f);
    const stat = fs.statSync(fullPath);

    if (manifestMap.has(f)) {
      results.push({
        ...manifestMap.get(f),
        size_bytes: stat.size,
      });
    } else {
      // Arquivo órfão ou legado copiado manualmente
      results.push({
        filename: f,
        db_type: f.includes('teste') ? 'test' : 'prod',
        trigger: 'MANUAL',
        label: f.replace(/\.sqlite$/, ''),
        reason: 'Arquivo de backup detectado no diretório',
        size_bytes: stat.size,
        created_at: stat.mtime.toISOString(),
        stats: null,
      });
    }
  }

  // Ordena por data decrescente
  results.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  return results;
}

/**
 * Restaura com segurança o banco de dados a partir de um arquivo de backup
 * 1. Tira um snapshot de emergência do banco atual ANTES de qualquer alteração
 * 2. Anexa o arquivo de backup e copia todos os dados em uma transação segura
 * 3. Realiza checkpoint do WAL
 */
function restoreSnapshot({ filename, targetDbType = 'prod', targetDbInstance }) {
  if (!targetDbInstance) {
    throw new Error('Instância de banco de dados de destino não informada.');
  }

  const cleanFilename = path.basename(filename);
  const backupFilePath = path.join(BACKUP_DIR, cleanFilename);

  if (!fs.existsSync(backupFilePath)) {
    throw new Error(`Arquivo de backup "${cleanFilename}" não encontrado no servidor.`);
  }

  // 1. Snapshot de emergência pré-restauração
  createSnapshot({
    dbInstance: targetDbInstance,
    dbType: targetDbType,
    trigger: 'EMERGENCY_PRE_RESTORE',
    label: `before_${cleanFilename.slice(0, 20)}`,
    reason: `Snapshot de emergência gerado antes de restaurar ${cleanFilename}`,
  });

  const escapedPath = backupFilePath.replace(/'/g, "''");

  // Anexa o banco de backup como 'backup_src'
  targetDbInstance.exec(`ATTACH DATABASE '${escapedPath}' AS backup_src;`);

  try {
    targetDbInstance.exec('PRAGMA foreign_keys = OFF;');
    targetDbInstance.exec('BEGIN TRANSACTION;');

    const tables = [
      'progress_records',
      'activity_event_attendees',
      'activity_event_requirements',
      'activity_events',
      'class_enrollments',
      'pathfinders',
      'users',
      'units',
      'club_settings',
    ];

    for (const t of tables) {
      // Verifica se a tabela existe na fonte de backup
      const hasTableInSrc = targetDbInstance
        .prepare(`SELECT name FROM backup_src.sqlite_master WHERE type = 'table' AND name = ?;`)
        .get(t);

      if (hasTableInSrc) {
        targetDbInstance.exec(`DELETE FROM main.${t};`);
        targetDbInstance.exec(`INSERT OR REPLACE INTO main.${t} SELECT * FROM backup_src.${t};`);
      }
    }

    targetDbInstance.exec('COMMIT;');
    targetDbInstance.exec('PRAGMA foreign_keys = ON;');
  } catch (err) {
    targetDbInstance.exec('ROLLBACK;');
    targetDbInstance.exec('PRAGMA foreign_keys = ON;');
    throw err;
  } finally {
    try {
      targetDbInstance.exec('DETACH DATABASE backup_src;');
    } catch (e) {
      // ignore detach error
    }
  }

  // Força checkpoint do WAL para sincronizar o arquivo no disco
  try {
    targetDbInstance.exec('PRAGMA wal_checkpoint(TRUNCATE);');
  } catch (walErr) {
    console.warn('[BACKUP] Aviso no wal_checkpoint pós-restauração:', walErr.message);
  }

  const restoredPfs = targetDbInstance.prepare('SELECT count(*) as c FROM pathfinders;').get()?.c || 0;
  const restoredProgs = targetDbInstance.prepare('SELECT count(*) as c FROM progress_records;').get()?.c || 0;
  const restoredUsers = targetDbInstance.prepare('SELECT count(*) as c FROM users;').get()?.c || 0;

  return {
    success: true,
    message: `Restauração concluída com sucesso a partir de ${cleanFilename}!`,
    stats: {
      pathfinders: restoredPfs,
      progress_records: restoredProgs,
      users: restoredUsers,
    },
  };
}

/**
 * Inicializa o subsistema de backup automático:
 * - Migra backups legados caso existam (.bak)
 * - Tira snapshot de inicialização / pré-manutenção
 * - Agenda snapshots automáticos a cada 6 horas
 */
function initAutoBackup({ prodDb, testDb }) {
  console.log('[BACKUP] Inicializando subsistema de backup automático do SGC...');

  // 1. Migra arquivos legados de backup se presentes em data/
  try {
    const legacyBak = path.join(DATA_DIR, 'clube_desbravadores.sqlite.bak');
    const legacyTarget = path.join(BACKUP_DIR, 'backup_prod_2026-10-25_historico_18_dbvs.sqlite');
    if (fs.existsSync(legacyBak) && !fs.existsSync(legacyTarget)) {
      fs.copyFileSync(legacyBak, legacyTarget);
      const manifest = loadManifest();
      manifest.push({
        filename: 'backup_prod_2026-10-25_historico_18_dbvs.sqlite',
        db_type: 'prod',
        trigger: 'HISTORICO',
        label: 'historico_18_desbravadores_teste_anterior',
        reason: 'Backup histórico com 18 desbravadores e 495 requisitos salvos antes do teste limpo',
        size_bytes: fs.statSync(legacyTarget).size,
        created_at: '2026-10-25T15:10:00.000Z',
        stats: { pathfinders: 18, progress_records: 495, users: 7, units: 4 },
      });
      saveManifest(manifest);
      console.log('[BACKUP] Backup histórico (18 desbravadores) arquivado com sucesso no cofre de backups.');
    }
  } catch (legErr) {
    console.warn('[BACKUP] Não foi possível migrar backup legado:', legErr.message);
  }

  // 2. Snapshot de Inicialização / Reinício de Serviço (Pre-Maintenance / Startup Snapshot)
  try {
    if (prodDb) {
      createSnapshot({
        dbInstance: prodDb,
        dbType: 'prod',
        trigger: 'STARTUP',
        label: 'inicio_servico',
        reason: 'Ponto de restauração automático gerado na inicialização/reinício do servidor',
      });
    }
    if (testDb) {
      createSnapshot({
        dbInstance: testDb,
        dbType: 'test',
        trigger: 'STARTUP',
        label: 'inicio_servico_teste',
        reason: 'Ponto de restauração automático do banco de testes (?teste=1) gerado no reinício',
      });
    }
    console.log('[BACKUP] Snapshots de inicialização gerados com sucesso.');
  } catch (startErr) {
    console.error('[BACKUP] Erro ao gerar snapshot de inicialização:', startErr.message);
  }

  // 3. Agendamento periódico a cada 6 horas (4 backups automáticos por dia)
  const SIX_HOURS_MS = 6 * 60 * 60 * 1000;
  const intervalId = setInterval(() => {
    try {
      console.log('[BACKUP] Executando rotina agendada de backup automático (6 horas)...');
      if (prodDb) {
        createSnapshot({
          dbInstance: prodDb,
          dbType: 'prod',
          trigger: 'SCHEDULED',
          label: 'rotina_6h',
          reason: 'Ponto de restauração automático da rotina periódica (a cada 6h)',
        });
      }
      if (testDb) {
        createSnapshot({
          dbInstance: testDb,
          dbType: 'test',
          trigger: 'SCHEDULED',
          label: 'rotina_6h_teste',
          reason: 'Ponto de restauração periódico do banco de testes (?teste=1)',
        });
      }
    } catch (schedErr) {
      console.error('[BACKUP] Erro no backup agendado:', schedErr.message);
    }
  }, SIX_HOURS_MS);

  if (intervalId.unref) {
    intervalId.unref(); // Permite encerramento gracioso do Node se necessário
  }

  return {
    createSnapshot,
    listBackups,
    restoreSnapshot,
  };
}

module.exports = {
  BACKUP_DIR,
  createSnapshot,
  listBackups,
  restoreSnapshot,
  initAutoBackup,
};
