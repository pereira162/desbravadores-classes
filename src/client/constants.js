export const STATUS_CONFIG = {
  PENDENTE: {
    code: 'PENDENTE',
    label: 'Pendente',
    shortLabel: 'Pendente',
    bgClass: 'bg-slate-100 text-slate-700 border-slate-300',
    cellClass: 'bg-slate-100 hover:bg-slate-200 text-slate-500 border-slate-200',
    dotClass: 'bg-slate-400',
    nextStatus: 'EM_ANDAMENTO',
  },
  EM_ANDAMENTO: {
    code: 'EM_ANDAMENTO',
    label: 'Em Andamento',
    shortLabel: 'Andamento',
    bgClass: 'bg-amber-50 text-amber-800 border-amber-300',
    cellClass: 'bg-amber-100 hover:bg-amber-200 text-amber-800 border-amber-300 font-semibold',
    dotClass: 'bg-amber-500',
    nextStatus: 'CONCLUIDO',
  },
  CONCLUIDO: {
    code: 'CONCLUIDO',
    label: 'Feito (Aguard. Visto)',
    shortLabel: 'Feito',
    bgClass: 'bg-sky-50 text-sky-800 border-sky-300',
    cellClass: 'bg-sky-100 hover:bg-sky-200 text-sky-800 border-sky-300 font-semibold',
    dotClass: 'bg-sky-500',
    nextStatus: 'APROVADO',
  },
  APROVADO: {
    code: 'APROVADO',
    label: 'Aprovado / Assinado',
    shortLabel: 'Aprovado',
    bgClass: 'bg-emerald-50 text-emerald-800 border-emerald-300',
    cellClass: 'bg-emerald-100 hover:bg-emerald-200 text-emerald-800 border-emerald-300 font-bold',
    dotClass: 'bg-emerald-600',
    nextStatus: 'PENDENTE',
  },
};

export const ROLE_CONFIG = {
  ADMIN: {
    label: 'Administrador',
    badgeClass: 'bg-purple-100 text-purple-800 border-purple-200',
    description: 'Acesso total ao sistema, auditoria e configurações.',
  },
  GESTOR: {
    label: 'Gestor(a) / TI do Clube',
    badgeClass: 'bg-indigo-100 text-indigo-900 border-indigo-300',
    description: 'Mesmos direitos do Diretor: organiza o sistema, gerencia unidades, convida o Diretor e a liderança.',
  },
  DIRETOR: {
    label: 'Diretor(a) do Clube',
    badgeClass: 'bg-amber-100 text-amber-900 border-amber-300',
    description: 'Aprova qualquer classe, gerencia líderes, unidades, eventos e reversão de logs.',
  },
  SECRETARIO: {
    label: 'Secretário(a)',
    badgeClass: 'bg-blue-100 text-blue-800 border-blue-200',
    description: 'Gerencia unidades, desbravadores, matrículas, convites e relatórios SGC.',
  },
  INSTRUTOR: {
    label: 'Instrutor(a) de Classe',
    badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    description: 'Avalia e assina requisitos das classes atribuídas ao seu escopo.',
  },
  CONSELHEIRO: {
    label: 'Conselheiro(a) de Unidade',
    badgeClass: 'bg-rose-100 text-rose-800 border-rose-200',
    description: 'Acompanha e marca atividades concluídas pelos desbravadores da sua unidade.',
  },
  DESBRAVADOR: {
    label: 'Desbravador(a)',
    badgeClass: 'bg-sky-100 text-sky-900 border-sky-300',
    description: 'Acessa seu Cartão Virtual, acompanha o que falta fazer e envia requisitos com fotos e relatos.',
  },
};

export const EXECUTION_CONTEXT_LABELS = {
  REUNIAO_CLUBE: { label: 'Reunião Regular / Sede', badge: 'bg-slate-100 text-slate-700' },
  ACAMPAMENTO: { label: 'Acampamento / Pernoite', badge: 'bg-emerald-100 text-emerald-800' },
  AR_LIVRE: { label: 'Ao Ar Livre / Campo', badge: 'bg-lime-100 text-lime-800' },
  IGREJA: { label: 'Na Igreja / Culto / ES', badge: 'bg-indigo-100 text-indigo-800' },
  COMUNIDADE: { label: 'Na Comunidade / Externo', badge: 'bg-orange-100 text-orange-800' },
  CASA_INDIVIDUAL: { label: 'Em Casa / Individual', badge: 'bg-amber-100 text-amber-800' },
};

export const OFFICIAL_PDF_BY_BASE_SLUG = {
  amigo: '/data/pdfs/1_amigo.pdf',
  companheiro: '/data/pdfs/2_companheiro.pdf',
  pesquisador: '/data/pdfs/3_pesquisador.pdf',
  pioneiro: '/data/pdfs/4_pioneiro.pdf',
  excursionista: '/data/pdfs/5_excursionista.pdf',
  guia: '/data/pdfs/6_guia.pdf',
};

export function calculateAge(birthDateStr, refYear = 2026) {
  if (!birthDateStr) return null;
  const year = parseInt(String(birthDateStr).slice(0, 4), 10);
  if (isNaN(year)) return null;
  return refYear - year;
}

export function formatDateBR(dateStr) {
  if (!dateStr) return '—';
  const clean = String(dateStr).slice(0, 10);
  const parts = clean.split('-');
  if (parts.length !== 3) return dateStr;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

export function formatDateTimeBR(isoStr) {
  if (!isoStr) return '—';
  try {
    const d = new Date(isoStr);
    return d.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return isoStr;
  }
}
