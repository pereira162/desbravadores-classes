import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas-pro';

/**
 * Gera um nome de arquivo único com timestamp e código aleatório
 * Exemplo: ficha_davi_lucca_amigo_20261027_142301_A9B4F2.pdf
 */
export function generatePdfFilename(prefix = 'documento') {
  const cleanPrefix = String(prefix)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');

  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const dateStr = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}`;
  const timeStr = `${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  const randomId = Math.random().toString(36).substring(2, 8).toUpperCase();

  return `${cleanPrefix}_${dateStr}_${timeStr}_${randomId}.pdf`;
}

/**
 * Exporta um elemento HTML diretamente para PDF usando html2canvas-pro e jsPDF.
 * Garante fidelidade visual idêntica à tela, com suporte a 1 página única ou
 * multipágina inteligente com Gerenciador Automático de Quebra de Página.
 */
export async function exportElementToPdf(target, options = {}) {
  const {
    filenamePrefix = 'documento',
    orientation = 'portrait', // 'portrait' | 'landscape'
    singlePage = false, // se true, comprime para caber estritamente em 1 página A4
    marginMm = 6,
    scale = 2, // 2x para máxima nitidez de texto impresso
  } = options;

  let el = typeof target === 'string' ? document.getElementById(target) : target;
  if (!el) {
    throw new Error('Elemento para impressão não foi encontrado.');
  }

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

  if (singlePage) {
    // =========================================================================
    // MODO 1 PÁGINA ÚNICA A4 (ex: Controle do Instrutor, Ficha Simplificada)
    // =========================================================================
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
    const offsetY = marginMm + (printableHeightMm - finalHeight) / 2;

    pdf.addImage(imgData, 'JPEG', offsetX, offsetY, finalWidth, finalHeight);
  } else {
    // =========================================================================
    // MODO MULTIPÁGINA INTELIGENTE (GERENCIADOR AUTOMÁTICO DE QUEBRA DE PÁGINA)
    // Evita cortes de conteúdo no meio das frases e elimina páginas em branco.
    // =========================================================================
    const candidateItems = Array.from(
      el.querySelectorAll('.pdf-item, .print-break-inside-avoid, .pdf-card')
    );
    const items = candidateItems.length > 0 ? candidateItems : Array.from(el.children);

    if (items.length === 0) {
      const canvas = await html2canvas(el, {
        scale: scale,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });
      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const imgHeightMm = (canvas.height * printableWidthMm) / canvas.width;
      pdf.addImage(imgData, 'JPEG', marginMm, marginMm, printableWidthMm, Math.min(imgHeightMm, printableHeightMm));
    } else {
      let currentY = marginMm;
      let pageNumber = 1;
      const footerReserveMm = 8;
      const maxAvailableHeightMm = printableHeightMm - footerReserveMm;

      for (let i = 0; i < items.length; i++) {
        const itemEl = items[i];
        if (itemEl.offsetHeight === 0 || itemEl.classList.contains('no-print')) continue;

        const itemCanvas = await html2canvas(itemEl, {
          scale: 1.8,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff',
          windowWidth: itemEl.scrollWidth || 900,
        });

        const itemWidthPx = itemCanvas.width;
        const itemHeightPx = itemCanvas.height;
        const itemHeightMm = (itemHeightPx * printableWidthMm) / itemWidthPx;

        // Se o card não cabe no espaço restante da página atual, cria uma nova página
        if (currentY + itemHeightMm > marginMm + maxAvailableHeightMm && currentY > marginMm + 5) {
          pdf.addPage('a4', orientation);
          pageNumber++;
          currentY = marginMm;
        }

        const itemImgData = itemCanvas.toDataURL('image/jpeg', 0.92);
        const drawHeightMm = Math.min(itemHeightMm, maxAvailableHeightMm);
        pdf.addImage(itemImgData, 'JPEG', marginMm, currentY, printableWidthMm, drawHeightMm);

        currentY += drawHeightMm + 3.5;
      }

      // Adiciona rodapé oficial com numeração em todas as páginas geradas
      const totalPages = pdf.internal.getNumberOfPages();
      for (let p = 1; p <= totalPages; p++) {
        pdf.setPage(p);
        pdf.setFontSize(8);
        pdf.setTextColor(130, 130, 130);
        const footerText = `SGC Classes • Divisão Sul-Americana — Página ${p} de ${totalPages}`;
        pdf.text(footerText, pageWidthMm / 2, pageHeightMm - marginMm + 3, { align: 'center' });
      }
    }
  }

  const finalFilename = generatePdfFilename(filenamePrefix);
  pdf.save(finalFilename);
  return finalFilename;
}
