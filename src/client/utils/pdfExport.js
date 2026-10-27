import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas-pro';

/**
 * Calcula um hash determinístico de 6 caracteres (FNV-1a + Base36) baseado
 * exatamente no conteúdo textual e atributos de estado do elemento.
 * Assim, enquanto o conteúdo do PDF não sofrer nenhuma alteração, o ID gerado
 * será exatamente o mesmo (permitindo que o navegador avise sobre download repetido).
 * Quando qualquer status, filtro ou texto mudar, o ID muda automaticamente.
 */
export function computeContentHash(el, extraSalt = '') {
  if (!el) return '000000';
  const textContent = (el.innerText || el.textContent || '')
    .replace(/\s+/g, ' ')
    .trim();

  // Captura também classes/estados de badges e checkboxes dentro do elemento
  const statusNodes = el.querySelectorAll('[data-pdf-state], input[type="checkbox"], select');
  let stateSig = '';
  statusNodes.forEach((node) => {
    if (node.dataset?.pdfState) stateSig += `|${node.dataset.pdfState}`;
    else if (node.type === 'checkbox') stateSig += `|${node.checked ? '1' : '0'}`;
    else if (node.tagName === 'SELECT') stateSig += `|${node.value}`;
  });

  const raw = `${extraSalt}::${textContent}::${stateSig}`;
  let h1 = 0x811c9dc5;
  let h2 = 0x01000193;
  for (let i = 0; i < raw.length; i++) {
    const ch = raw.charCodeAt(i);
    h1 ^= ch;
    h1 = Math.imul(h1, 0x01000193);
    h2 ^= ch;
    h2 = Math.imul(h2, 0x85ebca6b);
  }
  const combined = (BigInt(h1 >>> 0) << 32n) | BigInt(h2 >>> 0);
  return combined.toString(36).toUpperCase().padStart(8, '0').slice(0, 8);
}

/**
 * Gera o nome do arquivo PDF com o ID determinístico baseado no conteúdo.
 * Exemplo: ficha_completa_desbravador_exemplo_01_4K9X2M7A.pdf
 */
export function generatePdfFilename(prefix = 'documento', contentHash = '00000000') {
  const cleanPrefix = String(prefix)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');

  return `${cleanPrefix}_${contentHash}.pdf`;
}

/**
 * Exporta um elemento HTML diretamente para PDF usando html2canvas-pro e jsPDF.
 * - Oculta automaticamente elementos `.no-print`, `.print-hidden` e `.pdf-hide` (ex: texto "Pendente").
 * - Exibe elementos `.pdf-show` e `.pdf-show-block` (ex: espaço em branco para assinatura do instrutor).
 * - Suporta:
 *   1. `multiSheetSelector` (ex: `.pdf-sheet`): renderiza cada folha individualmente ocupando 1 página A4 inteira.
 *   2. `singlePage: true`: comprime para caber estritamente em 1 única página A4.
 *   3. Multipágina inteligente com espaçadores automáticos de quebra de página (rápido, sem cortar linhas/cards ao meio e sem páginas em branco).
 */
export async function exportElementToPdf(target, options = {}) {
  const {
    filenamePrefix = 'documento',
    orientation = 'portrait', // 'portrait' | 'landscape'
    singlePage = false,
    multiSheetSelector = null,
    marginMm = 6,
    scale = 2,
  } = options;

  const el = typeof target === 'string' ? document.getElementById(target) : target;
  if (!el) {
    throw new Error('Elemento para exportação de PDF não foi encontrado.');
  }

  // Calcula o hash determinístico ANTES de modificar o DOM temporariamente
  const contentHash = computeContentHash(el, `${filenamePrefix}:${orientation}:${singlePage ? '1p' : 'mp'}`);
  const finalFilename = generatePdfFilename(filenamePrefix, contentHash);

  // Dimensões A4 em milímetros
  const pageWidthMm = orientation === 'landscape' ? 297 : 210;
  const pageHeightMm = orientation === 'landscape' ? 210 : 297;
  const printableWidthMm = pageWidthMm - marginMm * 2;
  const printableHeightMm = pageHeightMm - marginMm * 2;

  const pdf = new jsPDF({
    orientation: orientation,
    unit: 'mm',
    format: 'a4',
  });

  // Ativa classe que oculta "Pendente" (.pdf-hide / .print-hidden) e botões (.no-print)
  el.classList.add('pdf-export-active');

  // Guarda restaurações de estilo para limpar no finally
  const styleRestorations = [];

  try {
    // Aguarda 1 frame para o navegador recalcular o layout com .pdf-export-active
    await new Promise((resolve) => requestAnimationFrame(resolve));

    const sheets = multiSheetSelector
      ? Array.from(el.querySelectorAll(multiSheetSelector))
      : [];

    if (sheets.length > 0) {
      // =======================================================================
      // MODO MULTI-FOLHAS A4 (ex: Controle do Instrutor com várias folhas de 6 desbravadores)
      // =======================================================================
      for (let sIdx = 0; sIdx < sheets.length; sIdx++) {
        const sheetEl = sheets[sIdx];
        if (sIdx > 0) {
          pdf.addPage('a4', orientation);
        }

        const canvas = await html2canvas(sheetEl, {
          scale: scale,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff',
          windowWidth: sheetEl.scrollWidth || 960,
        });

        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        const imgWidthPx = canvas.width;
        const imgHeightPx = canvas.height;

        const ratioX = printableWidthMm / imgWidthPx;
        const ratioY = printableHeightMm / imgHeightPx;
        const bestRatio = Math.min(ratioX, ratioY);

        const finalWidth = imgWidthPx * bestRatio;
        const finalHeight = imgHeightPx * bestRatio;
        const offsetX = marginMm + (printableWidthMm - finalWidth) / 2;
        const offsetY = marginMm;

        pdf.addImage(imgData, 'JPEG', offsetX, offsetY, finalWidth, finalHeight);
      }
    } else if (singlePage) {
      // =======================================================================
      // MODO 1 PÁGINA ÚNICA A4 (ex: Ficha Simplificada 1 Página)
      // =======================================================================
      const canvas = await html2canvas(el, {
        scale: scale,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: el.scrollWidth || 1024,
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const imgWidthPx = canvas.width;
      const imgHeightPx = canvas.height;

      const ratioX = printableWidthMm / imgWidthPx;
      const ratioY = printableHeightMm / imgHeightPx;
      const bestRatio = Math.min(ratioX, ratioY);

      const finalWidth = imgWidthPx * bestRatio;
      const finalHeight = imgHeightPx * bestRatio;
      const offsetX = marginMm + (printableWidthMm - finalWidth) / 2;
      const offsetY = marginMm;

      pdf.addImage(imgData, 'JPEG', offsetX, offsetY, finalWidth, finalHeight);
    } else {
      // =======================================================================
      // MODO MULTIPÁGINA INTELIGENTE E ULTRARRÁPIDO
      // Calcula quebras de página exatas antes da captura para não cortar nenhum
      // card (.pdf-item) ou linha de tabela (tr) ao meio, e renderiza em fatias
      // de página inteira (1 a 2 segundos no total, sem travar o navegador).
      // =======================================================================
      const footerReserveMm = 7;
      const usablePageHeightMm = printableHeightMm - footerReserveMm;

      // Se o container tiver uma tabela com scroll horizontal, expande temporariamente
      const scrollContainers = [el, ...Array.from(el.querySelectorAll('.overflow-x-auto, .overflow-hidden'))];
      for (const sc of scrollContainers) {
        styleRestorations.push({
          node: sc,
          overflow: sc.style.overflow,
          overflowX: sc.style.overflowX,
          width: sc.style.width,
          maxWidth: sc.style.maxWidth,
        });
        sc.style.overflow = 'visible';
        sc.style.overflowX = 'visible';
      }

      // Remove sticky temporariamente para não duplicar cabeçalhos no meio do canvas
      const stickyNodes = Array.from(el.querySelectorAll('.sticky'));
      for (const sn of stickyNodes) {
        styleRestorations.push({
          node: sn,
          position: sn.style.position,
        });
        sn.style.position = 'static';
      }

      await new Promise((resolve) => requestAnimationFrame(resolve));

      const containerWidthPx = Math.max(el.scrollWidth, el.offsetWidth, 800);
      const pageHeightPx = Math.floor((usablePageHeightMm / printableWidthMm) * containerWidthPx);

      // Identifica elementos atômicos que não podem ser cortados ao meio entre páginas
      let atomicItems = Array.from(el.querySelectorAll('.pdf-item'));
      if (atomicItems.length === 0) {
        atomicItems = Array.from(el.querySelectorAll('tbody tr, .print-break-inside-avoid'));
      }

      // Insere espaçamento antes de qualquer item que cruzaria a fronteira de uma página A4
      const containerRect = el.getBoundingClientRect();
      for (let i = 0; i < atomicItems.length; i++) {
        const item = atomicItems[i];
        if (item.offsetHeight === 0) continue;

        const rect = item.getBoundingClientRect();
        const itemTop = rect.top - containerRect.top;
        const itemHeight = rect.height;

        // Se o item for menor que 1 página inteira, verifica se ele atravessa a linha de corte
        if (itemHeight < pageHeightPx * 0.92) {
          const startPage = Math.floor(itemTop / pageHeightPx);
          const endPage = Math.floor((itemTop + itemHeight - 1) / pageHeightPx);

          if (endPage > startPage) {
            const nextBoundaryPx = (startPage + 1) * pageHeightPx;
            const pushDownPx = Math.ceil(nextBoundaryPx - itemTop);

            if (pushDownPx > 0 && pushDownPx < pageHeightPx) {
              if (item.tagName === 'TR') {
                // Para linhas de tabela (<tr>), inserimos uma linha espaçadora invisível antes dela
                const spacerTr = document.createElement('tr');
                spacerTr.className = 'pdf-temp-spacer';
                const spacerTd = document.createElement('td');
                spacerTd.colSpan = 50;
                spacerTd.style.height = `${pushDownPx}px`;
                spacerTd.style.padding = '0';
                spacerTd.style.border = 'none';
                spacerTd.style.background = '#ffffff';
                spacerTr.appendChild(spacerTd);
                item.parentNode.insertBefore(spacerTr, item);
                styleRestorations.push({ spacerNode: spacerTr });
              } else {
                const prevMarginTop = item.style.marginTop;
                const computedMarginTop = parseFloat(window.getComputedStyle(item).marginTop) || 0;
                styleRestorations.push({
                  node: item,
                  marginTop: prevMarginTop,
                });
                item.style.marginTop = `${computedMarginTop + pushDownPx}px`;
              }
            }
          }
        }
      }

      await new Promise((resolve) => requestAnimationFrame(resolve));

      const totalHeightPx = el.scrollHeight;
      const totalPages = Math.max(1, Math.ceil((totalHeightPx - 4) / pageHeightPx));

      // Captura o container inteiro de uma só vez (ou em blocos de até 4 páginas para máxima velocidade)
      const PAGES_PER_BATCH = 4;
      const batchHeightPx = pageHeightPx * PAGES_PER_BATCH;
      let renderedPagesCount = 0;

      for (let batchStartY = 0; batchStartY < totalHeightPx - 4; batchStartY += batchHeightPx) {
        const currentBatchHeightPx = Math.min(batchHeightPx, totalHeightPx - batchStartY);

        const batchCanvas = await html2canvas(el, {
          scale: 1.75,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff',
          width: containerWidthPx,
          height: currentBatchHeightPx,
          windowWidth: containerWidthPx,
          y: batchStartY,
          scrollY: 0,
        });

        const pagesInThisBatch = Math.ceil(( currentBatchHeightPx - 4 ) / pageHeightPx);

        for (let p = 0; p < pagesInThisBatch; p++) {
          const sliceStartPx = p * pageHeightPx;
          const sliceHeightPx = Math.min(pageHeightPx, currentBatchHeightPx - sliceStartPx);
          if (sliceHeightPx <= 15) continue;

          // Cria um canvas para a página individual a partir do batchCanvas
          const pageCanvas = document.createElement('canvas');
          const scaleFactor = batchCanvas.width / containerWidthPx;
          pageCanvas.width = batchCanvas.width;
          pageCanvas.height = Math.round(sliceHeightPx * scaleFactor);

          const ctx = pageCanvas.getContext('2d');
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
          ctx.drawImage(
            batchCanvas,
            0,
            Math.round(sliceStartPx * scaleFactor),
            batchCanvas.width,
            pageCanvas.height,
            0,
            0,
            pageCanvas.width,
            pageCanvas.height
          );

          if (renderedPagesCount > 0) {
            pdf.addPage('a4', orientation);
          }
          renderedPagesCount++;

          const sliceImgData = pageCanvas.toDataURL('image/jpeg', 0.92);
          const sliceHeightMm = (sliceHeightPx / containerWidthPx) * printableWidthMm;
          pdf.addImage(
            sliceImgData,
            'JPEG',
            marginMm,
            marginMm,
            printableWidthMm,
            Math.min(sliceHeightMm, usablePageHeightMm)
          );
        }
      }

      // Adiciona rodapé oficial com numeração em todas as páginas geradas
      const finalPageCount = pdf.internal.getNumberOfPages();
      for (let p = 1; p <= finalPageCount; p++) {
        pdf.setPage(p);
        pdf.setFontSize(8);
        pdf.setTextColor(120, 120, 120);
        const footerText = `SGC Classes • Divisão Sul-Americana — Página ${p} de ${finalPageCount}`;
        pdf.text(footerText, pageWidthMm / 2, pageHeightMm - marginMm + 2.5, { align: 'center' });
      }
    }
  } finally {
    // Remove espaçadores temporários e restaura estilos originais
    for (let i = styleRestorations.length - 1; i >= 0; i--) {
      const r = styleRestorations[i];
      if (r.spacerNode && r.spacerNode.parentNode) {
        r.spacerNode.parentNode.removeChild(r.spacerNode);
      } else if (r.node) {
        if ('marginTop' in r) r.node.style.marginTop = r.marginTop;
        if ('overflow' in r) r.node.style.overflow = r.overflow;
        if ('overflowX' in r) r.node.style.overflowX = r.overflowX;
        if ('width' in r) r.node.style.width = r.width;
        if ('maxWidth' in r) r.node.style.maxWidth = r.maxWidth;
        if ('position' in r) r.node.style.position = r.position;
      }
    }
    el.classList.remove('pdf-export-active');
  }

  pdf.save(finalFilename);
  return finalFilename;
}
