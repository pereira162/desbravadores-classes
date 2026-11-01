import React, { useState } from 'react';
import { Download, Eye, Share2, Check, Loader2 } from 'lucide-react';
import { apiRequest, API_BASE_URL } from '../api';

/**
 * Componente unificado para Download, Visualização e Compartilhamento de PDFs estruturados.
 *
 * Faz a resolução do token opaco seguro no backend (/api/pdf/resolve),
 * e oferece:
 * 1. Botão Principal: Download direto instantâneo do PDF
 * 2. Botão Secundário (Ícone Olho): Abre o PDF inline diretamente na visualização nativa do navegador
 * 3. Botão Secundário (Ícone Compartilhar): Copia o link constante e seguro para a área de transferência
 */
export default function PdfActionGroup({
  docType,
  params = {},
  label = 'Baixar PDF',
  colorScheme = 'slate', // 'amber' | 'slate' | 'white'
  compact = false,
  className = '',
}) {
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // Obtém ou resolve o token e URLs do PDF para a solicitação
  const fetchPdfUrls = async () => {
    const res = await apiRequest('/api/pdf/resolve', {
      method: 'POST',
      body: JSON.stringify({ docType, params }),
    });
    if (!res || !res.token) {
      throw new Error(res?.error || 'Não foi possível gerar o link do PDF.');
    }
    // Formata URLs absolutas para o cliente
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const base = API_BASE_URL || origin;
    return {
      token: res.token,
      fileName: res.fileName,
      viewUrl: `${base}${res.viewUrl}`,
      downloadUrl: `${base}${res.downloadUrl}`,
    };
  };

  const handleDownload = async (e) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    try {
      const { downloadUrl, fileName } = await fetchPdfUrls();
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', fileName || 'documento.pdf');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Erro ao baixar PDF:', err);
      alert(err.message || 'Erro ao baixar o arquivo PDF. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleView = async (e) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    try {
      const { viewUrl } = await fetchPdfUrls();
      window.open(viewUrl, '_blank', 'noopener,noreferrer');
    } catch (err) {
      console.error('Erro ao visualizar PDF:', err);
      alert(err.message || 'Erro ao abrir visualização do PDF.');
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async (e) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    try {
      const { viewUrl } = await fetchPdfUrls();
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(viewUrl);
      } else {
        // Fallback para navegadores sem API Clipboard
        const textArea = document.createElement('textarea');
        textArea.value = viewUrl;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error('Erro ao copiar link:', err);
      alert('Não foi possível copiar o link para a área de transferência.');
    } finally {
      setLoading(false);
    }
  };

  // Definição de cores conforme o tema solicitado
  let mainBtnBg = 'bg-slate-900 hover:bg-slate-800 text-white';
  let sideBtnBg = 'bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border-slate-700';

  if (colorScheme === 'amber') {
    mainBtnBg = 'bg-amber-400 hover:bg-amber-300 text-slate-950';
    sideBtnBg = 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 hover:text-amber-100 border-amber-400/30';
  } else if (colorScheme === 'white') {
    mainBtnBg = 'bg-white hover:bg-slate-100 text-slate-900 shadow-xs border border-slate-200';
    sideBtnBg = 'bg-white hover:bg-slate-100 text-slate-600 hover:text-slate-900 border-slate-200 shadow-xs';
  }

  const paddingClass = compact ? 'px-2.5 py-1.5 text-[11px]' : 'px-3.5 py-2 text-xs';
  const iconPadding = compact ? 'p-1.5' : 'p-2';

  return (
    <div className={`inline-flex items-center gap-1.5 no-print ${className}`}>
      {/* Botão Principal: Download */}
      <button
        type="button"
        onClick={handleDownload}
        disabled={loading}
        title="Baixar arquivo PDF diretamente para o dispositivo"
        className={`${paddingClass} rounded-xl font-bold flex items-center gap-2 cursor-pointer transition disabled:opacity-50 select-none ${mainBtnBg}`}
      >
        {loading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <Download className="w-3.5 h-3.5" />
        )}
        <span>{loading ? 'Preparando...' : label}</span>
      </button>

      {/* Botão Secundário 1: Visualizar no Navegador */}
      <button
        type="button"
        onClick={handleView}
        disabled={loading}
        title="Visualizar PDF nativamente em uma nova aba do navegador"
        className={`${iconPadding} rounded-xl border flex items-center justify-center cursor-pointer transition disabled:opacity-50 select-none ${sideBtnBg}`}
      >
        <Eye className="w-3.5 h-3.5" />
      </button>

      {/* Botão Secundário 2: Compartilhar / Copiar Link Seguro */}
      <button
        type="button"
        onClick={handleShare}
        disabled={loading}
        title={copied ? 'Link copiado para a área de transferência!' : 'Copiar link constante e seguro de acesso ao PDF'}
        className={`${iconPadding} rounded-xl border relative flex items-center justify-center cursor-pointer transition disabled:opacity-50 select-none ${
          copied ? 'bg-emerald-600 border-emerald-600 text-white' : sideBtnBg
        }`}
      >
        {copied ? (
          <Check className="w-3.5 h-3.5 text-white" />
        ) : (
          <Share2 className="w-3.5 h-3.5" />
        )}
        {copied && (
          <span className="absolute -top-7 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-lg whitespace-nowrap z-30">
            Link copiado!
          </span>
        )}
      </button>
    </div>
  );
}
