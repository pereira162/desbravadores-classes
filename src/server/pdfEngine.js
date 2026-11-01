const fs = require('node:fs');
const path = require('node:path');
const PDFDocument = require('pdfkit');

const DATA_DIR = path.resolve(__dirname, '../../data');
const PDF_CACHE_DIR = path.join(DATA_DIR, 'pdf_cache');

if (!fs.existsSync(PDF_CACHE_DIR)) {
  fs.mkdirSync(PDF_CACHE_DIR, { recursive: true });
}

const CLASS_CONFIG = {
  amigo: { name: 'Amigo', advancedName: 'Amigo da Natureza', age: 10, color: '#0072BC' },
  companheiro: { name: 'Companheiro', advancedName: 'Companheiro de Excursionismo', age: 11, color: '#D9272E' },
  pesquisador: { name: 'Pesquisador', advancedName: 'Pesquisador de Campo e Bosque', age: 12, color: '#008C44' },
  pioneiro: { name: 'Pioneiro', advancedName: 'Pioneiro de Novas Fronteiras', age: 13, color: '#6D6E71' },
  excursionista: { name: 'Excursionista', advancedName: 'Excursionista na Mata', age: 14, color: '#7A297B' },
  guia: { name: 'Guia', advancedName: 'Guia de Exploração', age: 15, color: '#E8B400' },
};

function formatBRDate(dateStr) {
  if (!dateStr) return '';
  const parts = String(dateStr).split('T')[0].split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
}

/**
 * 1. CONTROLE DO INSTRUTOR (1 Página A4 por grupo de 6 desbravadores)
 */
async function generateInstructorControlPdf({ classSlug = 'amigo', unitId = 'ALL', instructorId = 'ALL', outputPath, dbInstance }) {
  const cfg = CLASS_CONFIG[classSlug] || CLASS_CONFIG.amigo;
  const settings = dbInstance.prepare('SELECT * FROM club_settings WHERE id = 1').get() || {};
  const clubName = settings.club_name || 'Clube de Desbravadores';

  let unitName = 'Geral';
  if (unitId !== 'ALL') {
    const uRow = dbInstance.prepare('SELECT name FROM units WHERE id = ?').get(unitId);
    if (uRow) unitName = uRow.name;
  }

  let instructorLabel = '';
  let allowedInstructorPfIds = null;
  if (instructorId && instructorId !== 'ALL') {
    const instRow = dbInstance.prepare('SELECT name, assigned_pathfinders_json FROM users WHERE id = ?').get(instructorId);
    if (instRow) {
      instructorLabel = instRow.name;
      try {
        const parsed = JSON.parse(instRow.assigned_pathfinders_json || '[]');
        if (Array.isArray(parsed) && parsed.length > 0 && !parsed.includes('*')) {
          allowedInstructorPfIds = new Set(parsed);
        }
      } catch {}
    }
  }

  // Carrega desbravadores matriculados nesta classe
  let pfQuery = `
    SELECT DISTINCT p.id, p.name, p.unit_id, u.name as unit_name
    FROM pathfinders p
    JOIN class_enrollments ce ON ce.pathfinder_id = p.id
    LEFT JOIN units u ON u.id = p.unit_id
    WHERE p.active = 1 AND ce.class_slug IN (?, ?)
  `;
  const pfParams = [classSlug, `${classSlug}-avancado`];
  if (unitId !== 'ALL') {
    pfQuery += ' AND p.unit_id = ?';
    pfParams.push(unitId);
  }
  pfQuery += ' ORDER BY p.name ASC';
  let enrolledPfs = dbInstance.prepare(pfQuery).all(...pfParams);
  if (allowedInstructorPfIds) {
    enrolledPfs = enrolledPfs.filter((p) => allowedInstructorPfIds.has(p.id));
  }

  // Carrega requisitos da classe
  const reqs = dbInstance.prepare(`
    SELECT r.*, c.name as class_name, c.class_type
    FROM requirements_catalog r
    JOIN classes_catalog c ON c.slug = r.class_slug
    WHERE r.base_class_slug = ?
    ORDER BY r.display_order ASC
  `).all(classSlug);

  // Carrega mapa de progresso
  const progressRows = dbInstance.prepare(`
    SELECT pr.pathfinder_id, pr.requirement_id, pr.status
    FROM progress_records pr
    JOIN pathfinders p ON p.id = pr.pathfinder_id
    WHERE p.active = 1
  `).all();
  const progressMap = {};
  for (const pr of progressRows) {
    progressMap[`${pr.pathfinder_id}:${pr.requirement_id}`] = pr.status;
  }

  // Divide desbravadores em blocos de 6
  const COLS_PER_SHEET = 6;
  const sheetCount = Math.max(1, Math.ceil(enrolledPfs.length / COLS_PER_SHEET));
  const sheets = [];
  for (let s = 0; s < sheetCount; s++) {
    const cols = [];
    for (let c = 0; c < COLS_PER_SHEET; c++) {
      cols.push(enrolledPfs[s * COLS_PER_SHEET + c] || null);
    }
    sheets.push(cols);
  }

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      orientation: 'portrait',
      margin: 15,
      autoFirstPage: false,
      info: {
        Title: `Controle do Instrutor - ${cfg.name}`,
        Author: 'SGC Classes • Divisão Sul-Americana',
      },
    });

    const writeStream = fs.createWriteStream(outputPath);
    doc.pipe(writeStream);

    for (let sheetIdx = 0; sheetIdx < sheets.length; sheetIdx++) {
      const cols = sheets[sheetIdx];
      doc.addPage({ size: 'A4', margin: 15 });

      const pageWidth = doc.page.width;
      const pageHeight = doc.page.height;
      const margin = 15;
      const contentWidth = pageWidth - margin * 2; // ~565pt

      // CABEÇALHO
      let y = margin;
      doc.rect(margin, y, contentWidth, 54).fillAndStroke('#f8fafc', '#0f172a');

      // Título
      doc.fillColor('#0f172a').fontSize(7).font('Helvetica-Bold')
        .text('MINISTÉRIO DOS DESBRAVADORES • DIVISÃO SUL-AMERICANA', margin + 8, y + 6);
      doc.fillColor(cfg.color).fontSize(11).font('Helvetica-Bold')
        .text(`CONTROLE DO INSTRUTOR — ${cfg.name.toUpperCase()} & ${cfg.advancedName.toUpperCase()}`, margin + 8, y + 16);
      doc.fillColor('#475569').fontSize(7.5).font('Helvetica')
        .text(`Faixa Etária: ${cfg.age} anos • Currículo Oficial DSA 2026${instructorLabel ? ` • Instrutor(a): ${instructorLabel}` : ''}${sheets.length > 1 ? ` • Folha ${sheetIdx + 1} de ${sheets.length}` : ''}`, margin + 8, y + 30);

      // Dados do Clube no canto direito
      const rightX = margin + contentWidth - 175;
      doc.fillColor('#0f172a').fontSize(7.5).font('Helvetica-Bold')
        .text(`Clube: ${clubName.slice(0, 30)}`, rightX, y + 6, { width: 170, align: 'right' })
        .text(`Unidade: ${unitName.slice(0, 25)}`, rightX, y + 18, { width: 170, align: 'right' })
        .text('Ano de Atividades: 2026', rightX, y + 30, { width: 170, align: 'right' });

      y += 58;

      // TABELA DE REQUISITOS
      const colCodW = 28;
      const colColW = 22; // 6 colunas = 132pt
      const colReqW = contentWidth - colCodW - (colColW * COLS_PER_SHEET); // ~405pt
      const headerH = 70;

      // Header row
      doc.rect(margin, y, colCodW, headerH).fillAndStroke('#e2e8f0', '#94a3b8');
      doc.rect(margin + colCodW, y, colReqW, headerH).fillAndStroke('#e2e8f0', '#94a3b8');

      doc.fillColor('#0f172a').fontSize(7.5).font('Helvetica-Bold')
        .text('CÓD', margin, y + 28, { width: colCodW, align: 'center' })
        .text('REQUISITOS OFICIAIS DA CLASSE', margin + colCodW + 6, y + 28, { width: colReqW - 12 });

      // Nomes dos desbravadores rotacionados -90 graus
      for (let c = 0; c < COLS_PER_SHEET; c++) {
        const pf = cols[c];
        const cellX = margin + colCodW + colReqW + (c * colColW);
        doc.rect(cellX, y, colColW, headerH).fillAndStroke('#f1f5f9', '#94a3b8');

        if (pf) {
          const parts = pf.name.replace(/\(.*\)/g, '').trim().split(/\s+/);
          const shortName = parts.length > 2 && /^\d+$/.test(parts[2])
            ? parts.slice(0, 3).join(' ')
            : parts.slice(0, 2).join(' ');

          doc.save();
          doc.rotate(-90, { origin: [cellX + colColW / 2, y + headerH / 2] });
          doc.fillColor('#0f172a').fontSize(7).font('Helvetica-Bold')
            .text(shortName.slice(0, 22), cellX + colColW / 2 - 32, y + headerH / 2 - 3.5, {
              width: 64,
              align: 'left',
            });
          doc.restore();
        }
      }

      y += headerH;

      // LINHAS DE SEÇÃO E REQUISITOS
      // Calcula altura por linha para caber em 1 página
      const availableTableH = pageHeight - y - margin - 35; // reserva 35pt para assinaturas
      const rowH = Math.min(18.5, availableTableH / (reqs.length + 8));

      let lastSection = null;
      for (const req of reqs) {
        const secLabel = `${req.section_code ? `${req.section_code}. ` : ''}${req.section_name || ''} ${req.class_type === 'AVANCADA' ? '(AVANÇADA)' : ''}`.trim().toUpperCase();
        if (secLabel !== lastSection) {
          lastSection = secLabel;
          doc.rect(margin, y, contentWidth, rowH - 1).fillAndStroke('#cbd5e1', '#94a3b8');
          doc.fillColor('#0f172a').fontSize(6.5).font('Helvetica-Bold')
            .text(secLabel, margin + 4, y + 3, { width: contentWidth - 8 });
          y += rowH - 1;
        }

        doc.rect(margin, y, colCodW, rowH).fillAndStroke('#ffffff', '#cbd5e1');
        doc.rect(margin + colCodW, y, colReqW, rowH).fillAndStroke('#ffffff', '#cbd5e1');

        doc.fillColor('#0f172a').fontSize(6.5).font('Helvetica-Bold')
          .text(req.code, margin, y + 3, { width: colCodW, align: 'center' });

        let subStr = '';
        try {
          const subs = JSON.parse(req.sub_items_json || '[]');
          if (subs.length > 0) {
            subStr = ` (${subs.map((s) => s.key || s.code).join(',')})`;
          }
        } catch {}

        doc.fillColor('#1e293b').fontSize(6.5).font('Helvetica')
          .text(`${req.title}${subStr}`, margin + colCodW + 3, y + 3, {
            width: colReqW - 6,
            height: rowH - 2,
            ellipsis: true,
          });

        for (let c = 0; c < COLS_PER_SHEET; c++) {
          const pf = cols[c];
          const cellX = margin + colCodW + colReqW + (c * colColW);
          doc.rect(cellX, y, colColW, rowH).fillAndStroke('#ffffff', '#cbd5e1');

          if (pf) {
            const st = progressMap[`${pf.id}:${req.id}`] || 'PENDENTE';
            if (st === 'APROVADO') {
              // Desenha o Visto (Checkmark) vetorial nítido
              const ckX = cellX + colColW / 2;
              const ckY = y + rowH / 2;
              doc.save();
              doc.strokeColor('#047857').lineWidth(1.2).lineCap('round').lineJoin('round');
              doc.moveTo(ckX - 3.5, ckY).lineTo(ckX - 1, ckY + 2.5).lineTo(ckX + 3.5, ckY - 2.5).stroke();
              doc.restore();
            } else if (st === 'CONCLUIDO') {
              doc.fillColor('#0f766e').fontSize(6.5).font('Helvetica-Bold')
                .text('Feito', cellX, y + 3.5, { width: colColW, align: 'center' });
            } else if (st === 'EM_ANDAMENTO') {
              doc.fillColor('#b45309').fontSize(6).font('Helvetica-Bold')
                .text('And.', cellX, y + 3.5, { width: colColW, align: 'center' });
            }
          }
        }

        y += rowH;
      }

      // RODAPÉ COM ASSINATURAS
      const footY = pageHeight - margin - 28;
      const sigW = contentWidth / 3;

      doc.strokeColor('#94a3b8').lineWidth(0.5);
      doc.moveTo(margin + 10, footY).lineTo(margin + sigW - 10, footY).stroke();
      doc.moveTo(margin + sigW + 10, footY).lineTo(margin + sigW * 2 - 10, footY).stroke();
      doc.moveTo(margin + sigW * 2 + 10, footY).lineTo(margin + contentWidth - 10, footY).stroke();

      doc.fillColor('#334155').fontSize(6.5).font('Helvetica-Bold')
        .text('Assinatura do Instrutor(a)', margin, footY + 3, { width: sigW, align: 'center' })
        .text('Diretoria do Clube', margin + sigW, footY + 3, { width: sigW, align: 'center' })
        .text('Regional / Distrital', margin + sigW * 2, footY + 3, { width: sigW, align: 'center' });
    }

    doc.end();
    writeStream.on('finish', resolve);
    writeStream.on('error', reject);
  });
}

/**
 * 2. FICHA DO DESBRAVADOR (Simplificada 1 Página OU Completa Multi-páginas)
 */
async function generatePathfinderCardPdf({ pathfinderId, mode = 'simplified', outputPath, dbInstance }) {
  const pf = dbInstance.prepare(`
    SELECT p.*, u.name as unit_name
    FROM pathfinders p
    LEFT JOIN units u ON u.id = p.unit_id
    WHERE p.id = ?
  `).get(pathfinderId);

  if (!pf) throw new Error(`Desbravador ${pathfinderId} não encontrado`);

  const settings = dbInstance.prepare('SELECT * FROM club_settings WHERE id = 1').get() || {};
  const clubName = settings.club_name || 'Clube de Desbravadores';

  // Classes matriculadas
  const enrollments = dbInstance.prepare(`
    SELECT ce.class_slug, c.name, c.color_hex, c.base_slug, c.class_type
    FROM class_enrollments ce
    JOIN classes_catalog c ON c.slug = ce.class_slug
    WHERE ce.pathfinder_id = ?
    ORDER BY c.display_order ASC
  `).all(pathfinderId);

  // Requisitos das classes matriculadas
  const enrolledSlugs = enrollments.map((e) => e.class_slug);
  const placeholders = enrolledSlugs.map(() => '?').join(',');
  const reqs = enrolledSlugs.length > 0
    ? dbInstance.prepare(`
        SELECT r.*, c.name as class_name, c.color_hex as class_color
        FROM requirements_catalog r
        JOIN classes_catalog c ON c.slug = r.class_slug
        WHERE r.class_slug IN (${placeholders})
        ORDER BY c.display_order ASC, r.display_order ASC
      `).all(...enrolledSlugs)
    : [];

  const progressRows = dbInstance.prepare(`
    SELECT * FROM progress_records WHERE pathfinder_id = ?
  `).all(pathfinderId);
  const progressMap = {};
  for (const pr of progressRows) {
    progressMap[pr.requirement_id] = pr;
  }

  const approvedCount = reqs.filter((r) => progressMap[r.id]?.status === 'APROVADO').length;
  const pctTotal = reqs.length > 0 ? Math.round((approvedCount / reqs.length) * 100) : 0;

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      orientation: 'portrait',
      margin: 18,
      autoFirstPage: true,
      info: {
        Title: `Ficha - ${pf.name}`,
        Author: 'SGC Classes • Divisão Sul-Americana',
      },
    });

    const writeStream = fs.createWriteStream(outputPath);
    doc.pipe(writeStream);

    const margin = 18;
    const pageWidth = doc.page.width;
    const pageHeight = doc.page.height;
    const contentWidth = pageWidth - margin * 2;

    if (mode === 'simplified') {
      // =======================================================================
      // MODO SIMPLIFICADO: 1 PÁGINA A4 EM 2 COLUNAS COM CÍRCULOS (○)
      // =======================================================================
      let y = margin;
      doc.rect(margin, y, contentWidth, 54).fillAndStroke('#f8fafc', '#0f172a');

      doc.fillColor('#0f172a').fontSize(7.5).font('Helvetica-Bold')
        .text('CLUBE DE DESBRAVADORES • DIVISÃO SUL-AMERICANA', margin + 8, y + 6);
      doc.fillColor('#0284c7').fontSize(11).font('Helvetica-Bold')
        .text('FICHA INDIVIDUAL DE PROGRESSO EM CLASSES (1 PÁGINA)', margin + 8, y + 17);
      doc.fillColor('#475569').fontSize(7.5).font('Helvetica')
        .text(`Clube: ${clubName} • Ano: 2026`, margin + 8, y + 31);

      // Dados do Desbravador
      const rightX = margin + contentWidth - 210;
      doc.fillColor('#0f172a').fontSize(8.5).font('Helvetica-Bold')
        .text(pf.name.slice(0, 32), rightX, y + 6, { width: 205, align: 'right' });
      doc.fillColor('#334155').fontSize(7).font('Helvetica')
        .text(`Unidade: ${pf.unit_name || 'Sem Unidade'} • Nasc: ${formatBRDate(pf.birth_date)}`, rightX, y + 19, { width: 205, align: 'right' });
      doc.fillColor('#b45309').fontSize(7.5).font('Helvetica-Bold')
        .text(`Concluído: ${pctTotal}% (${approvedCount}/${reqs.length} itens)`, rightX, y + 31, { width: 205, align: 'right' });

      y += 62;

      // 2 Colunas de Classes
      const colW = (contentWidth - 10) / 2;
      const groupedByClass = {};
      for (const r of reqs) {
        if (!groupedByClass[r.class_slug]) {
          groupedByClass[r.class_slug] = {
            name: r.class_name,
            color: r.class_color || '#1e293b',
            items: [],
          };
        }
        groupedByClass[r.class_slug].items.push(r);
      }

      const classKeys = Object.keys(groupedByClass);
      let leftY = y;
      let rightY = y;

      for (let kIdx = 0; kIdx < classKeys.length; kIdx++) {
        const clsKey = classKeys[kIdx];
        const clsObj = groupedByClass[clsKey];
        const isLeft = leftY <= rightY;
        const curX = isLeft ? margin : margin + colW + 10;
        let curY = isLeft ? leftY : rightY;

        // Cabeçalho da classe
        const approvedCls = clsObj.items.filter((r) => progressMap[r.id]?.status === 'APROVADO').length;
        const pctCls = Math.round((approvedCls / clsObj.items.length) * 100);

        doc.rect(curX, curY, colW, 14).fill(clsObj.color);
        doc.fillColor('#ffffff').fontSize(7.5).font('Helvetica-Bold')
          .text(clsObj.name.toUpperCase(), curX + 4, curY + 3, { width: colW - 35 });
        doc.text(`${pctCls}%`, curX + colW - 30, curY + 3, { width: 26, align: 'right' });
        curY += 15;

        // Itens
        for (const req of clsObj.items) {
          const pr = progressMap[req.id];
          const st = pr?.status || 'PENDENTE';

          doc.rect(curX, curY, colW, 13).fillAndStroke('#ffffff', '#f1f5f9');
          doc.fillColor('#0f172a').fontSize(6.5).font('Helvetica-Bold')
            .text(req.code, curX + 3, curY + 2.5, { width: 22 });

          let subStr = '';
          try {
            const subs = JSON.parse(req.sub_items_json || '[]');
            if (subs.length > 0) subStr = ` (${subs.map((s) => s.key || s.code).join(',')})`;
          } catch {}

          doc.fillColor('#334155').fontSize(6).font('Helvetica')
            .text(`${req.title}${subStr}`, curX + 26, curY + 2.5, { width: colW - 44, height: 10, ellipsis: true });

          // Status mark
          const statusX = curX + colW - 14;
          if (st === 'APROVADO') {
            const ckX = statusX + 6;
            const ckY = curY + 6.5;
            doc.save();
            doc.strokeColor('#047857').lineWidth(1.3).lineCap('round').lineJoin('round');
            doc.moveTo(ckX - 3.5, ckY).lineTo(ckX - 1, ckY + 2.5).lineTo(ckX + 3.5, ckY - 2.5).stroke();
            doc.restore();
          } else if (st === 'CONCLUIDO') {
            doc.fillColor('#0f766e').fontSize(6).font('Helvetica-Bold')
              .text('F', statusX, curY + 2.5, { width: 12, align: 'center' });
          } else {
            // Círculo vazio (○) para preenchimento manual do instrutor
            doc.circle(statusX + 6, curY + 6.5, 3).strokeColor('#94a3b8').lineWidth(0.8).stroke();
          }

          curY += 13.5;
        }

        curY += 6;
        if (isLeft) leftY = curY;
        else rightY = curY;
      }

      // Rodapé de Assinaturas
      const footY = pageHeight - margin - 26;
      const sigW = contentWidth / 3;
      doc.strokeColor('#94a3b8').lineWidth(0.5);
      doc.moveTo(margin + 10, footY).lineTo(margin + sigW - 10, footY).stroke();
      doc.moveTo(margin + sigW + 10, footY).lineTo(margin + sigW * 2 - 10, footY).stroke();
      doc.moveTo(margin + sigW * 2 + 10, footY).lineTo(margin + contentWidth - 10, footY).stroke();

      doc.fillColor('#334155').fontSize(6.5).font('Helvetica-Bold')
        .text('Instrutor(a) / Conselheiro(a)', margin, footY + 3, { width: sigW, align: 'center' })
        .text('Diretor(a) do Clube', margin + sigW, footY + 3, { width: sigW, align: 'center' })
        .text('Data da Avaliação', margin + sigW * 2, footY + 3, { width: sigW, align: 'center' });

    } else {
      // =======================================================================
      // MODO COMPLETO: MULTI-PÁGINAS COM SUBITENS E ESPAÇOS EM BRANCO
      // =======================================================================
      let y = margin;

      function renderHeader() {
        doc.rect(margin, y, contentWidth, 54).fillAndStroke('#f8fafc', '#0f172a');
        doc.fillColor('#0f172a').fontSize(7.5).font('Helvetica-Bold')
          .text('MINISTÉRIO DOS DESBRAVADORES • DIVISÃO SUL-AMERICANA', margin + 8, y + 6);
        doc.fillColor('#0284c7').fontSize(11).font('Helvetica-Bold')
          .text('FICHA INDIVIDUAL DETALHADA DE CLASSES — 2026', margin + 8, y + 17);
        doc.fillColor('#475569').fontSize(7.5).font('Helvetica')
          .text(`Clube: ${clubName} • ${pf.name} (${pf.unit_name || 'Sem Unidade'}) • Concluído: ${pctTotal}%`, margin + 8, y + 31);
        y += 62;
      }

      renderHeader();

      for (const req of reqs) {
        let subs = [];
        try {
          subs = JSON.parse(req.sub_items_json || '[]');
        } catch {}

        const itemH = 34 + (subs.length > 0 ? Math.ceil(subs.length / 2) * 11 : 0);
        if (y + itemH > pageHeight - margin - 20) {
          doc.addPage({ size: 'A4', margin: 18 });
          y = margin;
          renderHeader();
        }

        const pr = progressMap[req.id];
        const st = pr?.status || 'PENDENTE';

        doc.rect(margin, y, contentWidth, itemH).fillAndStroke('#ffffff', '#e2e8f0');

        doc.fillColor(req.class_color || '#1e293b').fontSize(7).font('Helvetica-Bold')
          .text(`${req.class_name} • ${req.section}`, margin + 6, y + 5);

        doc.fillColor('#0f172a').fontSize(8).font('Helvetica-Bold')
          .text(`${req.code} — ${req.title}`, margin + 6, y + 16, { width: contentWidth - 80 });

        // Badge / Caixa em branco no canto direito
        const badgeX = margin + contentWidth - 72;
        if (st === 'APROVADO') {
          doc.rect(badgeX, y + 6, 64, 18).fillAndStroke('#ecfdf5', '#10b981');
          doc.fillColor('#047857').fontSize(7.5).font('Helvetica-Bold')
            .text('Aprovado', badgeX, y + 11, { width: 64, align: 'center' });
        } else if (st === 'CONCLUIDO') {
          doc.rect(badgeX, y + 6, 64, 18).fillAndStroke('#f0fdfa', '#14b8a6');
          doc.fillColor('#0f766e').fontSize(7.5).font('Helvetica-Bold')
            .text('Concluído', badgeX, y + 11, { width: 64, align: 'center' });
        } else {
          // Caixa vazia em branco para o instrutor assinar
          doc.rect(badgeX, y + 6, 64, 18).fillAndStroke('#ffffff', '#cbd5e1');
        }

        // Subitens
        if (subs.length > 0) {
          let subY = y + 28;
          for (let sIdx = 0; sIdx < subs.length; sIdx++) {
            const sub = subs[sIdx];
            const isSecondCol = sIdx % 2 === 1;
            const subX = isSecondCol ? margin + (contentWidth / 2) : margin + 8;
            if (isSecondCol) {
              doc.fillColor('#475569').fontSize(6.5).font('Helvetica')
                .text(`${sub.key || sub.code}) ${sub.text.slice(0, 52)}`, subX, subY, { width: (contentWidth / 2) - 15 });
              subY += 10.5;
            } else {
              doc.fillColor('#475569').fontSize(6.5).font('Helvetica')
                .text(`${sub.key || sub.code}) ${sub.text.slice(0, 52)}`, subX, subY, { width: (contentWidth / 2) - 15 });
            }
          }
        }

        y += itemH + 4;
      }
    }

    doc.end();
    writeStream.on('finish', resolve);
    writeStream.on('error', reject);
  });
}

/**
 * 3. PLANEJAMENTO ANUAL COMPLETO (Por Atividade OU Unificações) — < 200ms
 */
async function generateAnnualPlanningPdf({ mode = 'activities', unitId = 'ALL', outputPath, dbInstance }) {
  const settings = dbInstance.prepare('SELECT * FROM club_settings WHERE id = 1').get() || {};
  const clubName = settings.club_name || 'Clube de Desbravadores';

  let pfQuery = 'SELECT id, name, unit_id FROM pathfinders WHERE active = 1';
  const pfParams = [];
  if (unitId !== 'ALL') {
    pfQuery += ' AND unit_id = ?';
    pfParams.push(unitId);
  }
  const pathfinders = dbInstance.prepare(pfQuery).all(...pfParams);
  const pfMap = {};
  for (const pf of pathfinders) pfMap[pf.id] = pf;

  const enrollments = dbInstance.prepare('SELECT pathfinder_id, class_slug FROM class_enrollments').all();
  const pfEnrolledClasses = {};
  for (const e of enrollments) {
    if (!pfEnrolledClasses[e.pathfinder_id]) pfEnrolledClasses[e.pathfinder_id] = new Set();
    pfEnrolledClasses[e.pathfinder_id].add(e.class_slug);
  }

  const progressRows = dbInstance.prepare('SELECT pathfinder_id, requirement_id, status FROM progress_records').all();
  const progressMap = {};
  for (const pr of progressRows) {
    progressMap[`${pr.pathfinder_id}:${pr.requirement_id}`] = pr.status;
  }

  const reqs = dbInstance.prepare(`
    SELECT r.*, c.name as class_name, c.color_hex as class_color
    FROM requirements_catalog r
    JOIN classes_catalog c ON c.slug = r.class_slug
    WHERE r.code NOT IN ('I.1', 'I.2')
    ORDER BY c.display_order ASC, r.display_order ASC
  `).all();

  // Enriquecer demandas
  const enrichedReqs = [];
  for (const req of reqs) {
    const enrolledPfs = pathfinders.filter((p) => pfEnrolledClasses[p.id]?.has(req.class_slug));
    const pendingPfs = [];
    let approved = 0;

    for (const p of enrolledPfs) {
      const st = progressMap[`${p.id}:${req.id}`] || 'PENDENTE';
      if (st === 'APROVADO') approved++;
      else pendingPfs.push(p);
    }

    enrichedReqs.push({
      ...req,
      enrolledCount: enrolledPfs.length,
      approvedCount: approved,
      pendingCount: pendingPfs.length,
      pendingPfs,
    });
  }

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      orientation: 'portrait',
      margin: 18,
      autoFirstPage: true,
      info: {
        Title: 'Planejamento Anual de Classes',
        Author: 'SGC Classes • Divisão Sul-Americana',
      },
    });

    const writeStream = fs.createWriteStream(outputPath);
    doc.pipe(writeStream);

    const margin = 18;
    const pageWidth = doc.page.width;
    const pageHeight = doc.page.height;
    const contentWidth = pageWidth - margin * 2;

    let y = margin;
    function renderHeader(titleSuffix = '') {
      doc.rect(margin, y, contentWidth, 48).fillAndStroke('#0f172a', '#0f172a');
      doc.fillColor('#94a3b8').fontSize(7).font('Helvetica-Bold')
        .text('MINISTÉRIO DOS DESBRAVADORES • DIVISÃO SUL-AMERICANA', margin + 8, y + 6);
      doc.fillColor('#f59e0b').fontSize(10.5).font('Helvetica-Bold')
        .text(`PLANEJAMENTO ANUAL DE CLASSES — ${titleSuffix}`, margin + 8, y + 16);
      doc.fillColor('#ffffff').fontSize(7.5).font('Helvetica')
        .text(`Clube: ${clubName} • Ano Curricular 2026 • Orientado à Demanda Real`, margin + 8, y + 30);
      y += 54;
    }

    if (mode === 'equivalences') {
      // MODO UNIFICAÇÕES ENTRE CLASSES
      renderHeader('UNIFICAÇÕES INTER-CLASSES (ATIVIDADES CONJUNTAS)');

      const cardsJsonPath = path.join(DATA_DIR, 'cartoes-classes.json');
      const cardsData = JSON.parse(fs.readFileSync(cardsJsonPath, 'utf8'));
      const eqGroups = cardsData.equivalence_groups || [];

      for (const eq of eqGroups) {
        const groupReqs = enrichedReqs.filter((r) => r.equivalence_group === eq.id);
        if (groupReqs.length === 0) continue;

        const uniquePendingPfsMap = new Map();
        for (const gr of groupReqs) {
          for (const p of gr.pendingPfs) uniquePendingPfsMap.set(p.id, p);
        }
        const uniquePendingPfs = Array.from(uniquePendingPfsMap.values());

        const blockH = 46 + (groupReqs.length * 22) + (uniquePendingPfs.length > 0 ? 14 : 0);
        if (y + blockH > pageHeight - margin - 20) {
          doc.addPage({ size: 'A4', margin: 18 });
          y = margin;
          renderHeader('UNIFICAÇÕES INTER-CLASSES (CONTINUAÇÃO)');
        }

        doc.rect(margin, y, contentWidth, 22).fill('#1e293b');
        doc.fillColor('#34d399').fontSize(6.5).font('Helvetica-Bold')
          .text(`GRUPO DE EQUIVALÊNCIA (${groupReqs.length} REQUISITOS UNIFICADOS)`, margin + 6, y + 3);
        doc.fillColor('#ffffff').fontSize(8.5).font('Helvetica-Bold')
          .text(eq.title, margin + 6, y + 10);
        y += 24;

        for (const gr of groupReqs) {
          doc.rect(margin, y, contentWidth, 20).fillAndStroke('#ffffff', '#f1f5f9');
          doc.fillColor(gr.class_color || '#334155').fontSize(7).font('Helvetica-Bold')
            .text(gr.class_name, margin + 6, y + 3);
          doc.fillColor('#0f172a').fontSize(7.5).font('Helvetica-Bold')
            .text(`${gr.code} — ${gr.title}`, margin + 90, y + 3, { width: contentWidth - 190, ellipsis: true });
          doc.fillColor('#b91c1c').fontSize(7).font('Helvetica-Bold')
            .text(`Faltam ${gr.pendingCount} de ${gr.enrolledCount}`, margin + contentWidth - 95, y + 3, { width: 90, align: 'right' });
          y += 20;
        }

        if (uniquePendingPfs.length > 0) {
          doc.rect(margin, y, contentWidth, 14).fill('#f8fafc');
          doc.fillColor('#475569').fontSize(6.5).font('Helvetica-Bold')
            .text(`Quem precisa fazer (${uniquePendingPfs.length}): ${uniquePendingPfs.map((p) => p.name).join(', ')}`, margin + 6, y + 3.5, {
              width: contentWidth - 12,
              ellipsis: true,
            });
          y += 14;
        }

        y += 6;
      }
    } else {
      // MODO POR ATIVIDADE
      renderHeader(`MAPA DE DEMANDAS POR ATIVIDADE (${enrichedReqs.length} ITENS)`);

      for (const req of enrichedReqs) {
        const itemH = 38 + (req.pendingPfs.length > 0 ? 13 : 0);
        if (y + itemH > pageHeight - margin - 20) {
          doc.addPage({ size: 'A4', margin: 18 });
          y = margin;
          renderHeader(`MAPA DE DEMANDAS POR ATIVIDADE (CONTINUAÇÃO)`);
        }

        doc.rect(margin, y, contentWidth, itemH).fillAndStroke('#ffffff', '#e2e8f0');

        doc.fillColor(req.class_color || '#334155').fontSize(7).font('Helvetica-Bold')
          .text(`${req.class_name} • ${req.section}`, margin + 6, y + 5);

        doc.fillColor('#0f172a').fontSize(8).font('Helvetica-Bold')
          .text(`Requisito ${req.code} — ${req.title}`, margin + 6, y + 14, { width: contentWidth - 120 });

        doc.fillColor(req.pendingCount > 0 ? '#b91c1c' : '#047857').fontSize(7.5).font('Helvetica-Bold')
          .text(
            req.pendingCount > 0 ? `Faltam ${req.pendingCount} de ${req.enrolledCount}` : '✓ 100% Concluído',
            margin + contentWidth - 110,
            y + 8,
            { width: 104, align: 'right' }
          );

        if (req.pendingPfs.length > 0) {
          doc.rect(margin, y + 25, contentWidth, 13).fill('#fff1f2');
          doc.fillColor('#9f1239').fontSize(6.5).font('Helvetica-Bold')
            .text(`Ainda precisam fazer: ${req.pendingPfs.map((p) => p.name).join(', ')}`, margin + 6, y + 28, {
              width: contentWidth - 12,
              ellipsis: true,
            });
        }

        y += itemH + 3.5;
      }
    }

    doc.end();
    writeStream.on('finish', resolve);
    writeStream.on('error', reject);
  });
}

/**
 * 4. MATRIZ DE PROGRESSO DA CLASSE (A4 Paisagem Multi-páginas)
 */
async function generateClassMatrixPdf({ classSlug = 'amigo', mode = 'BOTH', unitId = 'ALL', instructorId = 'ALL', outputPath, dbInstance }) {
  const cfg = CLASS_CONFIG[classSlug] || CLASS_CONFIG.amigo;
  const settings = dbInstance.prepare('SELECT * FROM club_settings WHERE id = 1').get() || {};
  const clubName = settings.club_name || 'Clube de Desbravadores';

  let instructorLabel = '';
  let allowedInstructorPfIds = null;
  if (instructorId && instructorId !== 'ALL') {
    const instRow = dbInstance.prepare('SELECT name, assigned_pathfinders_json FROM users WHERE id = ?').get(instructorId);
    if (instRow) {
      instructorLabel = instRow.name;
      try {
        const parsed = JSON.parse(instRow.assigned_pathfinders_json || '[]');
        if (Array.isArray(parsed) && parsed.length > 0 && !parsed.includes('*')) {
          allowedInstructorPfIds = new Set(parsed);
        }
      } catch {}
    }
  }

  let pfQuery = `
    SELECT DISTINCT p.id, p.name, u.name as unit_name
    FROM pathfinders p
    JOIN class_enrollments ce ON ce.pathfinder_id = p.id
    LEFT JOIN units u ON u.id = p.unit_id
    WHERE p.active = 1 AND ce.class_slug IN (?, ?)
  `;
  const pfParams = [classSlug, `${classSlug}-avancado`];
  if (unitId !== 'ALL') {
    pfQuery += ' AND p.unit_id = ?';
    pfParams.push(unitId);
  }
  pfQuery += ' ORDER BY p.name ASC';
  let enrolledPfs = dbInstance.prepare(pfQuery).all(...pfParams);
  if (allowedInstructorPfIds) {
    enrolledPfs = enrolledPfs.filter((p) => allowedInstructorPfIds.has(p.id));
  }

  let reqQuery = `
    SELECT r.*, c.name as class_name, c.class_type
    FROM requirements_catalog r
    JOIN classes_catalog c ON c.slug = r.class_slug
    WHERE r.base_class_slug = ?
  `;
  const reqParams = [classSlug];
  if (mode === 'REGULAR') reqQuery += " AND r.class_type = 'REGULAR'";
  if (mode === 'AVANCADA') reqQuery += " AND r.class_type = 'AVANCADA'";
  reqQuery += ' ORDER BY r.display_order ASC';
  const reqs = dbInstance.prepare(reqQuery).all(...reqParams);

  const progressRows = dbInstance.prepare('SELECT pathfinder_id, requirement_id, status FROM progress_records').all();
  const progressMap = {};
  for (const pr of progressRows) {
    progressMap[`${pr.pathfinder_id}:${pr.requirement_id}`] = pr.status;
  }

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      orientation: 'landscape',
      margin: 18,
      autoFirstPage: true,
      info: {
        Title: `Matriz - ${cfg.name}`,
        Author: 'SGC Classes • Divisão Sul-Americana',
      },
    });

    const writeStream = fs.createWriteStream(outputPath);
    doc.pipe(writeStream);

    const margin = 18;
    const pageWidth = doc.page.width;
    const pageHeight = doc.page.height;
    const contentWidth = pageWidth - margin * 2; // ~805pt

    let y = margin;
    function renderHeader() {
      doc.rect(margin, y, contentWidth, 38).fillAndStroke('#0f172a', '#0f172a');
      doc.fillColor('#94a3b8').fontSize(7).font('Helvetica-Bold')
        .text('MINISTÉRIO DOS DESBRAVADORES • DIVISÃO SUL-AMERICANA', margin + 8, y + 5);
      doc.fillColor(cfg.color).fontSize(10.5).font('Helvetica-Bold')
        .text(`MATRIZ DE PROGRESSO DA CLASSE: ${cfg.name.toUpperCase()} & ${cfg.advancedName.toUpperCase()}`, margin + 8, y + 14);
      doc.fillColor('#ffffff').fontSize(7.5).font('Helvetica')
        .text(`Clube: ${clubName}${instructorLabel ? ` • Instrutor(a): ${instructorLabel}` : ''} • ${enrolledPfs.length} desbravadores • ${reqs.length} requisitos exibidos`, margin + 8, y + 26);
      y += 42;
    }

    renderHeader();

    const colCodW = 28;
    const colPfW = Math.max(34, Math.min(65, (contentWidth - 260 - colCodW) / Math.max(1, enrolledPfs.length)));
    const colReqW = contentWidth - colCodW - (colPfW * enrolledPfs.length);

    // Header da tabela
    doc.rect(margin, y, colCodW, 20).fillAndStroke('#e2e8f0', '#94a3b8');
    doc.rect(margin + colCodW, y, colReqW, 20).fillAndStroke('#e2e8f0', '#94a3b8');
    doc.fillColor('#0f172a').fontSize(7.5).font('Helvetica-Bold')
      .text('CÓD', margin, y + 6, { width: colCodW, align: 'center' })
      .text('REQUISITO OFICIAL', margin + colCodW + 6, y + 6, { width: colReqW - 12 });

    for (let pIdx = 0; pIdx < enrolledPfs.length; pIdx++) {
      const pf = enrolledPfs[pIdx];
      const cellX = margin + colCodW + colReqW + (pIdx * colPfW);
      doc.rect(cellX, y, colPfW, 20).fillAndStroke('#f1f5f9', '#94a3b8');
      doc.fillColor('#0f172a').fontSize(6.5).font('Helvetica-Bold')
        .text(pf.name.slice(0, 10), cellX, y + 6, { width: colPfW, align: 'center' });
    }
    y += 20;

    for (const req of reqs) {
      if (y + 16 > pageHeight - margin - 15) {
        doc.addPage({ size: 'A4', orientation: 'landscape', margin: 18 });
        y = margin;
        renderHeader();
      }

      doc.rect(margin, y, colCodW, 16).fillAndStroke('#ffffff', '#cbd5e1');
      doc.rect(margin + colCodW, y, colReqW, 16).fillAndStroke('#ffffff', '#cbd5e1');

      doc.fillColor('#0f172a').fontSize(6.5).font('Helvetica-Bold')
        .text(req.code, margin, y + 4, { width: colCodW, align: 'center' });

      doc.fillColor('#334155').fontSize(6.5).font('Helvetica')
        .text(`${req.marker ? `${req.marker} ` : ''}${req.title}`, margin + colCodW + 4, y + 4, {
          width: colReqW - 8,
          height: 12,
          ellipsis: true,
        });

      for (let pIdx = 0; pIdx < enrolledPfs.length; pIdx++) {
        const pf = enrolledPfs[pIdx];
        const cellX = margin + colCodW + colReqW + (pIdx * colPfW);
        doc.rect(cellX, y, colPfW, 16).fillAndStroke('#ffffff', '#cbd5e1');

        const st = progressMap[`${pf.id}:${req.id}`] || 'PENDENTE';
        if (st === 'APROVADO') {
          doc.fillColor('#047857').fontSize(7.5).font('Helvetica-Bold')
            .text('Aprov.', cellX, y + 4, { width: colPfW, align: 'center' });
        } else if (st === 'CONCLUIDO') {
          doc.fillColor('#0f766e').fontSize(7).font('Helvetica-Bold')
            .text('Feito', cellX, y + 4, { width: colPfW, align: 'center' });
        } else {
          // Espaço em branco limpo para o instrutor preencher
        }
      }

      y += 16;
    }

    doc.end();
    writeStream.on('finish', resolve);
    writeStream.on('error', reject);
  });
}

module.exports = {
  PDF_CACHE_DIR,
  generateInstructorControlPdf,
  generatePathfinderCardPdf,
  generateAnnualPlanningPdf,
  generateClassMatrixPdf,
};
