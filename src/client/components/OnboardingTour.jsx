import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  ChevronRight,
  ChevronLeft,
  X,
  CheckCircle2,
  Compass,
  Shield,
  Users,
  Grid,
  Calendar,
  FileDown,
  Bot,
} from 'lucide-react';

const TOUR_STEPS_BY_ROLE = {
  DIRETOR: [
    {
      title: '1. Visão Geral & Alertas de Unificação',
      tab: 'dashboard',
      icon: Compass,
      description:
        'Na Visão Geral você acompanha o progresso de todas as classes e unidades do clube. Quando um desbravador cumpre um requisito equivalente entre classes agrupadas, o sistema exibe um Alerta de Unificação Automática para sincronizar com 1 clique!',
    },
    {
      title: '2. Matriz de Classes, Múltiplos Instrutores e PDFs',
      tab: 'matrix',
      icon: Grid,
      description:
        'Na Matriz da Classe você visualiza cada requisito, aprova em lote, distribui desbravadores entre múltiplos instrutores (ex: Turma A e Turma B de Amigo) e baixa ou visualiza instantaneamente o PDF Controle do Instrutor (1 folha) e o PDF Matriz Completa.',
    },
    {
      title: '3. Planejamento Anual & Unificações Editáveis',
      tab: 'planning',
      icon: Calendar,
      description:
        'Veja todas as atividades planejáveis e equivalências entre classes. Como Diretor/Gestor, você pode criar novas unificações ou editar as existentes com auxílio do Filtro de Recomendações Inteligentes.',
    },
    {
      title: '4. Poderes Granulares da Diretoria & IA/MCP',
      tab: 'leaders',
      icon: Shield,
      description:
        'Em Diretoria & Clube você adiciona cargos personalizados (Diretor Associado, Capelão, etc.), concede poderes extras a qualquer líder, personaliza a Logo e Cor do Clube e gera chaves do Servidor MCP / Assistente IA.',
    },
  ],
  GESTOR: [
    {
      title: '1. Controle Total de Gestão do Clube',
      tab: 'dashboard',
      icon: Compass,
      description:
        'Como Gestor(a), você possui acesso irrestrito a todas as classes, unidades, sincronização de unificações automáticas e relatórios em PDF.',
    },
    {
      title: '2. Distribuição de Instrutores & Fichas em Cache',
      tab: 'matrix',
      icon: FileDown,
      description:
        'Na Matriz da Classe e na aba Desbravadores, todos os PDFs (Simplificado, Completo, Controle do Instrutor e Planejamento) já ficam pré-gerados em cache com botões para Visualizar, Baixar e Compartilhar link.',
    },
    {
      title: '3. Permissões Personalizadas & Assistente IA (MCP)',
      tab: 'leaders',
      icon: Bot,
      description:
        'Conceda permissões granulares para instrutores ou conselheiros e utilize o botão "IA & MCP" no topo para executar comandos inteligentes ou integrar IAs externas.',
    },
  ],
  SECRETARIO: [
    {
      title: '1. Cadastro de Desbravadores e Unidades',
      tab: 'pathfinders',
      icon: Users,
      description:
        'Como Secretário(a), você gerencia a ficha cadastral dos desbravadores, matrícula em classes regulares/avançadas ou agrupadas e alocação nas unidades.',
    },
    {
      title: '2. Emissão Instantânea de Fichas em PDF',
      tab: 'pathfinders',
      icon: FileDown,
      description:
        'Clique no botão de ficha de qualquer desbravador para visualizar no navegador, baixar ou copiar o link constante do PDF Simplificado ou Completo para investidura.',
    },
    {
      title: '3. Acompanhamento da Matriz de Classes',
      tab: 'matrix',
      icon: Grid,
      description:
        'Consulte o andamento de todas as classes e baixe o Controle do Instrutor atualizado em tempo real.',
    },
  ],
  INSTRUTOR: [
    {
      title: '1. Seu Escopo Focado na Sua Classe e Turma',
      tab: 'matrix',
      icon: Grid,
      description:
        'Por padrão, sua visão já abre focada apenas na(s) classe(s) e desbravadores sob sua responsabilidade (ex: Turma A ou Turma B). Você pode marcar itens como Concluído ou Aprovado diretamente na Matriz!',
    },
    {
      title: '2. PDF Controle do Instrutor (1 Página)',
      tab: 'matrix',
      icon: FileDown,
      description:
        'No topo da Matriz da Classe, use os botões de Visualizar (olho), Baixar PDF ou Compartilhar para obter sua folha de Controle do Instrutor pronta para impressão com espaços em branco para anotar em campo.',
    },
    {
      title: '3. Desbravadores da Sua Classe',
      tab: 'pathfinders',
      icon: Users,
      description:
        'Na aba Desbravadores você visualiza e gerencia apenas os desbravadores da sua classe atribuída (ou todos, caso o Diretor conceda permissão extra).',
    },
  ],
  CONSELHEIRO: [
    {
      title: '1. Gestão Exclusiva da Sua Unidade',
      tab: 'pathfinders',
      icon: Users,
      description:
        'Como Conselheiro(a), o sistema filtra automaticamente apenas os desbravadores pertencentes à sua unidade para facilitar seu acompanhamento semanal no cantinho da unidade.',
    },
    {
      title: '2. Marcação de Progresso dos Seus Desbravadores',
      tab: 'matrix',
      icon: Grid,
      description:
        'Na Matriz da Classe ou no Cartão Individual, você pode registrar o avanço dos desbravadores da sua unidade e acompanhar o que falta para a investidura.',
    },
  ],
  DESBRAVADOR: [
    {
      title: '1. Bem-vindo ao Seu Cartão Digital de Classes!',
      tab: 'dashboard',
      icon: Sparkles,
      description:
        'Esta é a conta de exemplo de um Desbravador! Aqui você acompanha sua porcentagem de conclusão, sua unidade e seus requisitos aprovados.',
    },
    {
      title: '2. Minha Ficha Completa e Simplificada em PDF',
      tab: 'pathfinders',
      icon: FileDown,
      description:
        'Na aba Desbravadores você pode abrir seu cartão de requisitos detalhado com todos os subitens e visualizar ou baixar sua Ficha em PDF.',
    },
    {
      title: '3. Próximos Eventos e Requisitos da Classe',
      tab: 'events',
      icon: Calendar,
      description:
        'Consulte os requisitos na Matriz da Classe e veja os eventos do clube programados para cumprir especialidades, caminhadas e acampamentos.',
    },
  ],
};

export default function OnboardingTour({ user, isOpen, onClose, onSelectTab }) {
  const roleKey = user?.role && TOUR_STEPS_BY_ROLE[user.role] ? user.role : 'DIRETOR';
  const steps = TOUR_STEPS_BY_ROLE[roleKey];
  const [stepIdx, setStepIdx] = useState(0);

  useEffect(() => {
    setStepIdx(0);
  }, [roleKey, user?.id]);

  if (!isOpen || !user) return null;

  const currentStep = steps[stepIdx] || steps[0];
  const StepIcon = currentStep.icon || Sparkles;

  const handleGoToStepTab = () => {
    if (currentStep.tab && onSelectTab) {
      onSelectTab(currentStep.tab);
    }
  };

  const handleNext = () => {
    if (stepIdx < steps.length - 1) {
      const nextStep = steps[stepIdx + 1];
      setStepIdx(stepIdx + 1);
      if (nextStep.tab && onSelectTab) {
        onSelectTab(nextStep.tab);
      }
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (stepIdx > 0) {
      const prevStep = steps[stepIdx - 1];
      setStepIdx(stepIdx - 1);
      if (prevStep.tab && onSelectTab) {
        onSelectTab(prevStep.tab);
      }
    }
  };

  return (
    <div className="mb-5 rounded-2xl border-2 border-amber-400/80 bg-gradient-to-r from-amber-50 via-white to-amber-50/70 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-4 sm:p-5 shadow-md relative no-print">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center shrink-0 shadow-sm">
            <StepIcon className="w-6 h-6" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-900 dark:text-amber-300 border border-amber-400/40">
                <Sparkles className="w-3 h-3" />
                Trilha de Ensino Interativa • Perfil: {user.custom_role_title || user.role}
              </span>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Passo {stepIdx + 1} de {steps.length}
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white">
              {currentStep.title}
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1 max-w-3xl leading-relaxed">
              {currentStep.description}
            </p>
            <p className="text-[11px] text-amber-800 dark:text-amber-300 font-medium mt-2">
              💡 Ambiente de Teste Isolado: Todas as alterações que você fizer ficam salvas apenas no seu navegador e se encerram ao fechar a janela.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0 self-end lg:self-center">
          <button
            type="button"
            onClick={handleGoToStepTab}
            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Ir para esta Aba
          </button>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handlePrev}
              disabled={stepIdx === 0}
              className="p-1.5 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 disabled:opacity-40 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Passo anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-sm transition-colors cursor-pointer"
            >
              {stepIdx === steps.length - 1 ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Concluir Trilha
                </>
              ) : (
                <>
                  Próximo Passo
                  <ChevronRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-200/60 transition-colors cursor-pointer"
            title="Fechar trilha de ensino"
          >
            <X className="w-4 h-4" />
            <span className="hidden sm:inline">Fechar</span>
          </button>
        </div>
      </div>

      {/* Indicadores de progresso */}
      <div className="flex items-center gap-1.5 mt-3 pt-2.5 border-t border-amber-200/70 dark:border-slate-700">
        {steps.map((s, idx) => (
          <button
            key={s.title}
            type="button"
            onClick={() => {
              setStepIdx(idx);
              if (s.tab && onSelectTab) onSelectTab(s.tab);
            }}
            className={`h-1.5 rounded-full transition-all cursor-pointer ${
              idx === stepIdx
                ? 'w-8 bg-amber-500'
                : idx < stepIdx
                ? 'w-4 bg-emerald-500'
                : 'w-4 bg-slate-300 dark:bg-slate-600'
            }`}
            title={s.title}
          />
        ))}
      </div>
    </div>
  );
}
