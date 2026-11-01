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
    p.tagFilter = p.tagFilter || p.selectedTag || 'ALL';
    delete p.selectedTag;
  } else if (docType === 'PF_CARD') {
    p.mode = p.mode || 'simplified';
  }
  return p;
}

/**
 * Calcula uma versão dos dados para invalidar cache quando houver alteração
 */
function computeDataVersion(docType, params, dbInstance) {
  try {
    let stats = '';
    if (docType === 'INSTRUCTOR_CONTROL' || docType === 'MATRIX') {
      const row = dbInstance.prepare(`
        SELECT MAX(updated_at) as max_up, COUNT(*) as cnt
        FROM progress_records pr
        JOIN requirements_catalog r ON r.id = pr.requirement_id
        WHERE r.base_class_slug = ?
      `).get(params.classSlug || 'amigo');
      const userCnt = dbInstance.prepare('SELECT COUNT(*) as c FROM users').get()?.c || 0;
      stats = `${row?.max_up || ''}-${row?.cnt || 0}-${userCnt}`;
    } else if (docType === 'PF_CARD') {
      const row = dbInstance.prepare(`
        SELECT MAX(updated_at) as max_up, COUNT(*) as cnt
        FROM progress_records
        WHERE pathfinder_id = ?
      `).get(params.pathfinderId);
      stats = `${row?.max_up || ''}-${row?.cnt || 0}`;
    } else if (docType === 'PLANNING') {
      const row = dbInstance.prepare(`
        SELECT MAX(updated_at) as max_up, COUNT(*) as cnt
        FROM progress_records
      `).get();
      const eqVer = dbInstance.prepare('SELECT updated_at FROM club_settings WHERE id = 1').get()?.updated_at || '';
      stats = `${row?.max_up || ''}-${row?.cnt || 0}-${eqVer}`;
    }
    const raw = `${docType}:${JSON.stringify(params)}:${stats}`;
    return crypto.createHash('md5').update(raw).digest('hex').slice(0, 12);
  } catch {
    return 'v1';
  }
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
    // Atualiza last_accessed_at
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
};
