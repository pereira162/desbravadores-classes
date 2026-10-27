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
 * Exporta um elemento HTML diretamente para PDF usando html2canvas e jsPDF.
 * Garante fidelidade visual idêntica à tela, com suporte a 1 página única ou multipágina.
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

  // Renderiza canvas com escala alta
  const canvas = await html2canvas(el, {
    scale: scale,
    useCORS: true,
    logging: false,
    backgroundColor: '#ffffff',
    windowWidth: el.scrollWidth || 1024,
  });

  const imgData = canvas.toDataURL('image/jpeg', 0.95);
  const pdf = new jsPDF({
    orientation: orientation,
    unit: 'mm',
    format: 'a4',
  });

  const imgWidthPx = canvas.width;
  const imgHeightPx = canvas.height;

  if (singlePage) {
    // Escala para caber perfeitamente na página única respeitando limites de largura e altura
    const ratioX = printableWidthMm / imgWidthPx;
    const ratioY = printableHeightMm / imgHeightPx;
    const bestRatio = Math.min(ratioX, ratioY);

    const finalWidth = imgWidthPx * bestRatio;
    const finalHeight = imgHeightPx * bestRatio;
    const offsetX = marginMm + (printableWidthMm - finalWidth) / 2;
    const offsetY = marginMm + (printableHeightMm - finalHeight) / 2;

    pdf.addImage(imgData, 'JPEG', offsetX, offsetY, finalWidth, finalHeight);
  } else {
    // Modo multipágina contínuo
    const imgHeightMm = (imgHeightPx * printableWidthMm) / imgWidthPx;
    let heightLeftMm = imgHeightMm;
    let positionY = marginMm;

    // Primeira página
    pdf.addImage(imgData, 'JPEG', marginMm, positionY, printableWidthMm, imgHeightMm);
    heightLeftMm -= printableHeightMm;

    // Páginas subsequentes se ultrapassar altura
    while (heightLeftMm > 2) {
      positionY = positionY - printableHeightMm;
      pdf.addPage('a4', orientation);
      pdf.addImage(imgData, 'JPEG', marginMm, positionY, printableWidthMm, imgHeightMm);
      heightLeftMm -= printableHeightMm;
    }
  }

  const finalFilename = generatePdfFilename(filenamePrefix);
  pdf.save(finalFilename);
  return finalFilename;
}
