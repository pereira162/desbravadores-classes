import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  FolderPlus,
  UserPlus,
  GitMerge,
  Printer,
  Tent,
  ArrowRight,
  MousePointerClick,
  CheckSquare,
} from 'lucide-react';

const TOUR_STEPS_BY_ROLE = {
  DIRETOR: [
    {
      id: 'welcome',
      title: '1. Visão Geral & Boas-vindas',
      tab: 'dashboard',
      targetSelector: '[data-tour="nav-dashboard"]',
      icon: Compass,
      description:
        'Bem-vindo(a) ao SGC Classes • Desbravadores! Este é o seu painel de controle executivo. Aqui você acompanha em tempo real o percentual geral de conclusão do clube, o total de membros ativos, unidades e a fila de requisitos para investidura.',
      actionPrompt: 'Clique em Próximo Passo para conhecer os Alertas de Unificação Automática.',
    },
    {
      id: 'unifications',
      title: '2. Alertas de Unificação com 1 Clique',
      tab: 'dashboard',
      targetSelector: '[data-tour="unification-alerts-banner"]',
      icon: GitMerge,
      description:
        'Inteligência de Unificação: quando um desbravador cumpre um requisito equivalente entre classes agrupadas (ex: nós, primeiros socorros ou especialidades idênticas), o sistema avisa aqui e permite sincronizar com 1 clique, sem retrabalho!',
      actionPrompt: 'Clique em Próximo Passo para aprender a gerenciar unidades e desbravadores.',
    },
    {
      id: 'units',
      title: '3. Adicionar e Gerenciar Unidades',
      tab: 'pathfinders',
      targetSelector: '[data-tour="btn-manage-units"]',
      icon: FolderPlus,
      description:
        'Organize seu clube em Unidades masculinas e femininas. No botão "Gerenciar Unidades" você cadastra novas unidades, define a cor identificadora e atribui o conselheiro responsável.',
      actionPrompt: '👉 Clique no botão destacado "Gerenciar Unidades" ou em Próximo Passo.',
    },
    {
      id: 'pathfinders',
      title: '4. Cadastrar Novos Desbravadores',
      tab: 'pathfinders',
      targetSelector: '[data-tour="btn-new-pathfinder"]',
      icon: UserPlus,
      description:
        'No botão "Cadastrar Desbravador", você cadastra os membros, informa data de nascimento, unidade e matricula em classes regulares (Amigo a Guia), avançadas ou classes agrupadas para quem ingressou com mais idade.',
      actionPrompt: '👉 Clique no botão destacado "Cadastrar Desbravador" ou em Próximo Passo.',
    },
    {
      id: 'pdf_cards',
      title: '5. Fichas e PDFs Estruturados em Cache',
      tab: 'pathfinders',
      targetSelector: '[data-tour="pathfinder-pdf-actions"]',
      icon: FileDown,
      description:
        'Cada desbravador possui seu cartão digital oficial. Você pode alternar entre a Versão Simplificada (1 pág A4) e a Ficha Completa, visualizar no navegador com o ícone do Olho ou baixar o PDF pré-gerado em cache com links seguros.',
      actionPrompt: 'Clique em Próximo Passo para abrir a Matriz das Classes.',
    },
    {
      id: 'matrix_classes',
      title: '6. Matriz das Classes & Múltiplos Instrutores',
      tab: 'matrix',
      targetSelector: '[data-tour="matrix-class-selector"]',
      icon: Grid,
      description:
        'A Matriz é a grade oficial com todos os requisitos na vertical e os desbravadores na horizontal. Se você tiver múltiplos instrutores para a mesma classe (ex: Turma A e Turma B de Amigo), use a divisão de turmas para separar os alunos!',
      actionPrompt: '👉 Clique em uma das classes ou em Próximo Passo para aprender a aprovar requisitos.',
    },
    {
      id: 'matrix_approval',
      title: '7. Aprovação de Requisitos na Matriz',
      tab: 'matrix',
      targetSelector: '[data-tour="matrix-grid-table"]',
      icon: CheckCircle2,
      description:
        'Para assinar requisitos: clique na célula do desbravador para preencher observações e subitens (a, b, c...), ou ative o Modo Clique Rápido. Você também pode clicar no botão "Linha" de qualquer requisito para aprovar vários de uma vez!',
      actionPrompt: 'Clique em Próximo Passo para conhecer os PDFs de impressão da Matriz.',
    },
    {
      id: 'matrix_pdfs',
      title: '8. PDFs da Matriz (Controle de 1 Pág e Matriz Completa)',
      tab: 'matrix',
      targetSelector: '[data-tour="matrix-pdf-actions"]',
      icon: Printer,
      description:
        'No topo da Matriz você tem dois documentos estruturados em código: o Controle do Instrutor (folha sintética de 1 página com nomes na vertical e rodapé para assinaturas) e o PDF da Matriz Completa (com todo o conteúdo na íntegra).',
      actionPrompt: 'Clique em Próximo Passo para acessar o Planejamento Anual e Unificações.',
    },
    {
      id: 'planning_demand',
      title: '9. Planejamento Anual & Mudar Unificações',
      tab: 'planning',
      targetSelector: '[data-tour="demand-filters"]',
      icon: Calendar,
      description:
        'Filtre requisitos planejáveis por contexto (Campismo, Natureza, Bíblico, Saúde) e pendências. Em "Unificações Inter-Classes", você pode criar ou editar grupos de unificação para que requisitos só se unam quando forem verdadeiramente equivalentes!',
      actionPrompt: 'Clique em Próximo Passo para ver como agendar eventos coletivos.',
    },
    {
      id: 'events',
      title: '10. Eventos e Atividades Coletivas',
      tab: 'events',
      targetSelector: '[data-tour="btn-new-event"]',
      icon: Tent,
      description:
        'Crie Acampamentos, Reuniões e Caminhadas vinculando quais requisitos serão executados. Quando o evento é realizado, basta confirmar a presença dos desbravadores para que todos os requisitos sejam assinados automaticamente!',
      actionPrompt: '👉 Clique no botão destacado "Agendar Novo Evento" ou em Próximo Passo.',
    },
    {
      id: 'leaders_permissions',
      title: '11. Diretoria & Matriz de Permissões Interativa',
      tab: 'leaders',
      targetSelector: '[data-tour="btn-permissions-matrix-mode"]',
      icon: Shield,
      description:
        'Gerencie os membros da diretoria e cargos personalizados. Clique em "Matriz de Poderes" para abrir a tabela interativa onde você marca e desmarca caixas de seleção diretamente para liberar ou restringir poderes a cada líder!',
      actionPrompt: '👉 Clique no botão "Matriz de Poderes" ou em Próximo Passo para finalizar o tour.',
    },
    {
      id: 'conclusion',
      title: '12. Tudo Pronto para o Seu Clube!',
      tab: 'dashboard',
      targetSelector: null,
      icon: Sparkles,
      description:
        'Parabéns! Você concluiu a trilha de ensino completa do SGC Classes Desbravadores. Você pode reabrir esta trilha quando quiser clicando no botão "Trilha de Ensino" no topo da tela ou consultar a Documentação detalhada.',
      actionPrompt: '🎉 Clique em Concluir e Começar a Usar para começar!',
    },
  ],
  GESTOR: [
    {
      id: 'welcome',
      title: '1. Controle Total de Gestão do Clube',
      tab: 'dashboard',
      targetSelector: '[data-tour="nav-dashboard"]',
      icon: Compass,
      description:
        'Como Gestor(a), você possui acesso completo a todas as classes, unidades, unificações automáticas e emissão de relatórios em PDF pré-gerados em cache.',
      actionPrompt: 'Clique em Próximo Passo para gerenciar unidades e desbravadores.',
    },
    {
      id: 'pathfinders',
      title: '2. Cadastro de Membros e Fichas Oficiais',
      tab: 'pathfinders',
      targetSelector: '[data-tour="btn-new-pathfinder"]',
      icon: UserPlus,
      description:
        'Cadastre novos desbravadores, gerencie matrículas de classes regulares e avançadas e emita fichas individuais prontas para investidura.',
      actionPrompt: 'Clique em Próximo Passo para acessar a Matriz das Classes.',
    },
    {
      id: 'matrix',
      title: '3. Matriz das Classes & Controle do Instrutor',
      tab: 'matrix',
      targetSelector: '[data-tour="matrix-pdf-actions"]',
      icon: Grid,
      description:
        'Acompanhe o andamento das 6 classes e baixe o PDF de Controle do Instrutor de 1 página e o PDF Completo da Matriz pré-compilados em cache.',
      actionPrompt: 'Clique em Próximo Passo para ver a Matriz de Permissões.',
    },
    {
      id: 'leaders',
      title: '4. Diretoria & Matriz de Permissões',
      tab: 'leaders',
      targetSelector: '[data-tour="btn-permissions-matrix-mode"]',
      icon: Shield,
      description:
        'Conceda ou restrinja permissões específicas para instrutores e conselheiros na tabela de Matriz de Poderes com salvamento imediato.',
      actionPrompt: 'Clique em Próximo Passo para finalizar o tour.',
    },
    {
      id: 'conclusion',
      title: '5. Pronto para a Gestão do Clube!',
      tab: 'dashboard',
      targetSelector: null,
      icon: Sparkles,
      description:
        'Tudo pronto! Você pode reabrir esta trilha quando quiser pelo botão "Trilha de Ensino" no cabeçalho ou consultar a Documentação.',
      actionPrompt: '🎉 Clique em Concluir e Começar a Usar!',
    },
  ],
  SECRETARIO: [
    {
      id: 'welcome',
      title: '1. Painel da Secretaria',
      tab: 'dashboard',
      targetSelector: '[data-tour="nav-dashboard"]',
      icon: Compass,
      description:
        'Bem-vindo(a) à Secretaria do Clube! Acompanhe o total de desbravadores cadastrados, percentual de conclusão e pendências cadastrais.',
      actionPrompt: 'Clique em Próximo Passo para gerenciar unidades.',
    },
    {
      id: 'units',
      title: '2. Organização das Unidades',
      tab: 'pathfinders',
      targetSelector: '[data-tour="btn-manage-units"]',
      icon: FolderPlus,
      description:
        'Cadastre e atualize as unidades do clube, definindo nomes, cores e vinculação de conselheiros.',
      actionPrompt: '👉 Clique em "Gerenciar Unidades" ou em Próximo Passo.',
    },
    {
      id: 'pathfinders',
      title: '3. Cadastro e Matrícula de Desbravadores',
      tab: 'pathfinders',
      targetSelector: '[data-tour="btn-new-pathfinder"]',
      icon: UserPlus,
      description:
        'Cadastre membros com datas de nascimento, telefones, unidades e matrículas em classes regulares ou agrupadas.',
      actionPrompt: '👉 Clique em "Cadastrar Desbravador" ou em Próximo Passo.',
    },
    {
      id: 'pdf_cards',
      title: '4. Emissão de Fichas em PDF (1 Pág e Completa)',
      tab: 'pathfinders',
      targetSelector: '[data-tour="pathfinder-pdf-actions"]',
      icon: FileDown,
      description:
        'Gere instantaneamente as fichas em PDF para os pais, instrutores ou pastas oficiais de investidura.',
      actionPrompt: 'Clique em Próximo Passo para ver a Matriz das Classes.',
    },
    {
      id: 'matrix',
      title: '5. Acompanhamento da Matriz das Classes',
      tab: 'matrix',
      targetSelector: '[data-tour="matrix-class-selector"]',
      icon: Grid,
      description:
        'Consulte os requisitos cumpridos de cada classe e emita os relatórios de Controle do Instrutor atualizados.',
      actionPrompt: 'Clique em Próximo Passo para ver os eventos do clube.',
    },
    {
      id: 'events',
      title: '6. Eventos e Registro de Presença',
      tab: 'events',
      targetSelector: '[data-tour="btn-new-event"]',
      icon: Tent,
      description:
        'Apoie a liderança no registro de acampamentos e presença em massa dos desbravadores.',
      actionPrompt: 'Clique em Próximo Passo para concluir.',
    },
    {
      id: 'conclusion',
      title: '7. Secretaria Pronta para Atuar!',
      tab: 'dashboard',
      targetSelector: null,
      icon: Sparkles,
      description:
        'Trilha concluída! Você pode reabrir esta trilha quando quiser pelo botão "Trilha de Ensino" no cabeçalho.',
      actionPrompt: '🎉 Clique em Concluir e Começar a Usar!',
    },
  ],
  INSTRUTOR: [
    {
      id: 'welcome',
      title: '1. Sua Área Focada de Instrução',
      tab: 'matrix',
      targetSelector: '[data-tour="matrix-class-selector"]',
      icon: Grid,
      description:
        'Bem-vindo(a), Instrutor(a)! Por padrão, sua tela já abre focada nas classes que você instrui. Aqui você tem o controle dos requisitos e da evolução pedagógica de cada aluno.',
      actionPrompt: 'Clique em Próximo Passo para ver a aprovação de requisitos.',
    },
    {
      id: 'turmas',
      title: '2. Filtro da Sua Turma Atribuída',
      tab: 'matrix',
      targetSelector: '[data-tour="matrix-instructor-filter"]',
      icon: Users,
      description:
        'Caso haja mais de um instrutor para a mesma classe (ex: Turma A e Turma B de Amigo), filtre aqui para ver exclusivamente os desbravadores sob sua orientação.',
      actionPrompt: 'Clique em Próximo Passo para ver a aprovação de requisitos.',
    },
    {
      id: 'approval',
      title: '3. Assinatura e Preenchimento de Subitens',
      tab: 'matrix',
      targetSelector: '[data-tour="matrix-grid-table"]',
      icon: CheckCircle2,
      description:
        'Clique em qualquer célula para preencher observações e subitens (a, b, c...) ou use o botão "Linha" para assinar um requisito para toda a sua turma com 1 toque!',
      actionPrompt: 'Clique em Próximo Passo para conhecer sua folha de controle em PDF.',
    },
    {
      id: 'pdf_instructor',
      title: '4. PDF Controle do Instrutor (1 Página)',
      tab: 'matrix',
      targetSelector: '[data-tour="matrix-pdf-actions"]',
      icon: Printer,
      description:
        'No topo da tela, clique no botão de Olho (visualizar) ou na Seta (download) para emitir sua folha sintética de 1 página A4 com nomes na vertical e espaços para anotar em campo.',
      actionPrompt: 'Clique em Próximo Passo para ver a lista de desbravadores.',
    },
    {
      id: 'pathfinders',
      title: '5. Desbravadores Sob Sua Orientação',
      tab: 'pathfinders',
      targetSelector: '[data-tour="pathfinder-pdf-actions"]',
      icon: Users,
      description:
        'Consulte a ficha individual completa de cada desbravador da sua classe e emita a ficha em PDF para acompanhamento individual.',
      actionPrompt: 'Clique em Próximo Passo para ver eventos e requisitos práticos.',
    },
    {
      id: 'conclusion',
      title: '6. Pronto para Ensinar!',
      tab: 'matrix',
      targetSelector: null,
      icon: Sparkles,
      description:
        'Você está pronto(a) para orientar sua classe rumo à investidura! Reabra este guia sempre que precisar no botão "Trilha de Ensino".',
      actionPrompt: '🎉 Clique em Concluir e Começar a Usar!',
    },
  ],
  CONSELHEIRO: [
    {
      id: 'welcome',
      title: '1. O Cantinho da Sua Unidade',
      tab: 'pathfinders',
      targetSelector: '[data-tour="nav-pathfinders"]',
      icon: Users,
      description:
        'Bem-vindo(a), Conselheiro(a)! O sistema filtra automaticamente os desbravadores pertencentes à sua unidade para que você acompanhe o cartão de cada um semanalmente no cantinho da unidade.',
      actionPrompt: 'Clique em Próximo Passo para ver o acompanhamento individual.',
    },
    {
      id: 'cartao',
      title: '2. Ficha e Progresso dos Seus Membros',
      tab: 'pathfinders',
      targetSelector: '[data-tour="pathfinder-pdf-actions"]',
      icon: FileDown,
      description:
        'Veja quais requisitos cada desbravador já cumpriu, ajude-os nas tarefas pendentes e emita a versão simplificada de 1 página em PDF para levar para a reunião.',
      actionPrompt: 'Clique em Próximo Passo para ver a Matriz da Classe.',
    },
    {
      id: 'matrix',
      title: '3. Acompanhamento na Matriz das Classes',
      tab: 'matrix',
      targetSelector: '[data-tour="matrix-grid-table"]',
      icon: Grid,
      description:
        'Consulte a matriz para saber exatamente o que falta para cada membro da sua unidade alcançar a investidura de fim de ano.',
      actionPrompt: 'Clique em Próximo Passo para ver eventos e acampamentos.',
    },
    {
      id: 'events',
      title: '4. Eventos e Presença da Sua Unidade',
      tab: 'events',
      targetSelector: '[data-tour="nav-events"]',
      icon: Tent,
      description:
        'Acompanhe os acampamentos e saídas do clube para garantir a presença e o cumprimento dos requisitos da sua unidade.',
      actionPrompt: 'Clique em Próximo Passo para concluir.',
    },
    {
      id: 'conclusion',
      title: '5. Cantinho da Unidade Conectado!',
      tab: 'pathfinders',
      targetSelector: null,
      icon: Sparkles,
      description:
        'Tudo pronto! Você tem em mãos todas as ferramentas para liderar sua unidade. Você pode reabrir esta trilha quando quiser no botão "Trilha de Ensino".',
      actionPrompt: '🎉 Clique em Concluir e Começar a Usar!',
    },
  ],
  DESBRAVADOR: [
    {
      id: 'welcome',
      title: '1. Bem-vindo ao Seu Cartão Digital!',
      tab: 'pathfinders',
      targetSelector: '[data-tour="pathfinder-pdf-actions"]',
      icon: Sparkles,
      description:
        'Olá, Desbravador(a)! Este é o seu Cartão Digital Oficial. Aqui você acompanha sua porcentagem de conclusão, vê todos os requisitos da sua classe e marca as atividades que já realizou para avaliação do seu instrutor.',
      actionPrompt: 'Clique em Próximo Passo para ver suas fichas em PDF.',
    },
    {
      id: 'pdfs',
      title: '2. Sua Ficha em PDF (Simplificada e Completa)',
      tab: 'pathfinders',
      targetSelector: '[data-tour="pathfinder-pdf-actions"]',
      icon: FileDown,
      description:
        'Clique no ícone do Olho para visualizar sua ficha diretamente no navegador ou na Seta para baixar seu PDF oficial atualizado.',
      actionPrompt: 'Clique em Próximo Passo para ver seus requisitos.',
    },
    {
      id: 'conclusion',
      title: '3. Rumo à Investidura!',
      tab: 'pathfinders',
      targetSelector: null,
      icon: CheckCircle2,
      description:
        'Cumpra seus requisitos nas reuniões, acampamentos e especialidades. Bom aprendizado e uma excelente jornada rumo ao lenço e à sua insígnia!',
      actionPrompt: '🎉 Clique em Concluir e Começar a Usar!',
    },
  ],
};

export default function OnboardingTour({ user, isOpen, onClose, onSelectTab, activeTab }) {
  const roleKey = user?.role && TOUR_STEPS_BY_ROLE[user.role] ? user.role : 'DIRETOR';
  const steps = useMemo(() => TOUR_STEPS_BY_ROLE[roleKey] || TOUR_STEPS_BY_ROLE.DIRETOR, [roleKey]);

  const [stepIdx, setStepIdx] = useState(0);
  const [targetRect, setTargetRect] = useState(null);
  const [isSearchingTarget, setIsSearchingTarget] = useState(true);

  const currentStep = steps[stepIdx] || steps[0];
  const StepIcon = currentStep.icon || Sparkles;

  // Função para recalcular a posição do elemento alvo
  const updateTargetRect = useCallback(() => {
    if (!currentStep.targetSelector) {
      setTargetRect(null);
      setIsSearchingTarget(false);
      return;
    }

    const el = document.querySelector(currentStep.targetSelector);
    if (el) {
      const rect = el.getBoundingClientRect();
      // Verifica se o elemento tem dimensão real na tela
      if (rect.width > 0 && rect.height > 0) {
        setTargetRect({
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
          bottom: rect.bottom,
          right: rect.right,
        });
        setIsSearchingTarget(false);
        return;
      }
    }

    setTargetRect(null);
    setIsSearchingTarget(false);
  }, [currentStep.targetSelector]);

  // Sincroniza aba e rola para o elemento alvo ao mudar de passo
  useEffect(() => {
    if (!isOpen) return;

    setIsSearchingTarget(true);

    // Se o passo exige outra aba, troca para ela primeiro
    if (currentStep.tab && onSelectTab) {
      onSelectTab(currentStep.tab);
    }

    // Aguarda o React renderizar a aba antes de procurar o elemento
    const timer = setTimeout(() => {
      if (currentStep.targetSelector) {
        const el = document.querySelector(currentStep.targetSelector);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
        }
      }
      // Dá tempo da rolagem suave acontecer
      setTimeout(() => {
        updateTargetRect();
      }, 250);
    }, 180);

    return () => clearTimeout(timer);
  }, [isOpen, stepIdx, currentStep.tab, currentStep.targetSelector, onSelectTab, updateTargetRect]);

  // Recalcula rect ao rolar ou redimensionar a tela
  useEffect(() => {
    if (!isOpen) return;

    const handleScrollOrResize = () => {
      updateTargetRect();
    };

    window.addEventListener('resize', handleScrollOrResize, { passive: true });
    window.addEventListener('scroll', handleScrollOrResize, { passive: true, capture: true });

    return () => {
      window.removeEventListener('resize', handleScrollOrResize);
      window.removeEventListener('scroll', handleScrollOrResize, { capture: true });
    };
  }, [isOpen, updateTargetRect]);

  // Avança para o próximo passo se o usuário clicar diretamente no elemento destacado
  useEffect(() => {
    if (!isOpen || !currentStep.targetSelector) return;

    const el = document.querySelector(currentStep.targetSelector);
    if (!el) return;

    const handleTargetClick = () => {
      // Pequeno timeout para permitir que a ação do botão aconteça antes de avançar
      setTimeout(() => {
        if (stepIdx < steps.length - 1) {
          setStepIdx((prev) => prev + 1);
        }
      }, 300);
    };

    el.addEventListener('click', handleTargetClick);
    return () => {
      el.removeEventListener('click', handleTargetClick);
    };
  }, [isOpen, currentStep.targetSelector, stepIdx, steps.length]);

  if (!isOpen || !user) return null;

  const handleNext = () => {
    if (stepIdx < steps.length - 1) {
      setStepIdx(stepIdx + 1);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (stepIdx > 0) {
      setStepIdx(stepIdx - 1);
    }
  };

  // Cálculo da posição do Card Flutuante
  const getCardPositionStyle = () => {
    if (!targetRect) {
      // Centralizado na tela (Boas-vindas ou Conclusão)
      return {
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        maxWidth: '540px',
        width: 'calc(100vw - 32px)',
      };
    }

    const windowW = window.innerWidth;
    const windowH = window.innerHeight;
    const isMobile = windowW < 640;

    // Em telas pequenas de smartphone, posiciona como bottom-sheet flutuante
    if (isMobile) {
      return {
        position: 'fixed',
        bottom: '16px',
        left: '16px',
        right: '16px',
        width: 'calc(100vw - 32px)',
        maxHeight: '75vh',
      };
    }

    const cardW = 480;
    const cardEstH = 260;
    const spaceBelow = windowH - targetRect.bottom;
    const spaceAbove = targetRect.top;

    let top = 0;
    if (spaceBelow >= cardEstH + 20 || spaceBelow >= spaceAbove) {
      top = targetRect.bottom + 16;
    } else {
      top = Math.max(16, targetRect.top - cardEstH - 16);
    }

    let left = targetRect.left + targetRect.width / 2 - cardW / 2;
    left = Math.max(16, Math.min(left, windowW - cardW - 16));

    return {
      position: 'fixed',
      top: `${top}px`,
      left: `${left}px`,
      width: `${cardW}px`,
      maxWidth: 'calc(100vw - 32px)',
    };
  };

  const paddingSpotlight = 8;

  return (
    <div className="fixed inset-0 z-[70] no-print select-none">
      {/* SVG Backdrop Escuro com Recorte Transparente no Elemento Alvo */}
      <svg
        className="fixed inset-0 w-full h-full pointer-events-auto transition-opacity duration-300"
        style={{ width: '100vw', height: '100vh' }}
      >
        <defs>
          <mask id="tour-spotlight-mask">
            {/* Base branca: escurece tudo */}
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {/* Recorte preto: onde a luz passa para o elemento alvo */}
            {targetRect && (
              <rect
                x={Math.max(0, targetRect.left - paddingSpotlight)}
                y={Math.max(0, targetRect.top - paddingSpotlight)}
                width={targetRect.width + paddingSpotlight * 2}
                height={targetRect.height + paddingSpotlight * 2}
                rx="14"
                ry="14"
                fill="black"
              />
            )}
          </mask>
        </defs>
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="rgba(15, 23, 42, 0.82)"
          mask="url(#tour-spotlight-mask)"
        />
      </svg>

      {/* Borda Iluminada e Pulsante Contornando o Alvo */}
      {targetRect && (
        <div
          style={{
            position: 'fixed',
            top: `${Math.max(0, targetRect.top - paddingSpotlight)}px`,
            left: `${Math.max(0, targetRect.left - paddingSpotlight)}px`,
            width: `${targetRect.width + paddingSpotlight * 2}px`,
            height: `${targetRect.height + paddingSpotlight * 2}px`,
            pointerEvents: 'none',
          }}
          className="z-[75] rounded-xl border-2 border-amber-400 tour-spotlight-ring transition-all duration-300"
        />
      )}

      {/* Janela Popup Flutuante da Trilha (Card Interativo) */}
      <div
        style={getCardPositionStyle()}
        className="z-[80] bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-3xl border border-amber-400/60 dark:border-amber-400/40 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Topo do Card: Badge do Papel + Contador de Passos + Botão Fechar */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border-b border-amber-200/50 dark:border-slate-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center shrink-0 shadow-xs font-black">
              <StepIcon className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[11px] font-extrabold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                Trilha Guiada • {user.custom_role_title || user.role}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
                Passo {stepIdx + 1} de {steps.length}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            title="Fechar Trilha de Ensino"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Corpo do Card: Título + Explicação + Instrução de Ação */}
        <div className="p-5 sm:p-6 space-y-3.5">
          <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
            {currentStep.title}
          </h3>

          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
            {currentStep.description}
          </p>

          {/* Destaque de Ação Interativa */}
          <div className="p-3 rounded-2xl bg-amber-500/10 dark:bg-amber-500/15 border border-amber-400/40 text-amber-950 dark:text-amber-200 text-xs font-semibold flex items-start gap-2.5">
            <MousePointerClick className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="leading-snug">{currentStep.actionPrompt}</div>
          </div>
        </div>

        {/* Rodapé: Controles de Navegação (Pular, Anterior, Próximo/Concluir) */}
        <div className="p-4 sm:p-5 bg-slate-50/80 dark:bg-slate-950/60 border-t border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Indicador de passos em bolinhas */}
          <div className="flex items-center gap-1.5 self-center sm:self-auto">
            {steps.map((s, idx) => (
              <button
                key={s.id || idx}
                type="button"
                onClick={() => setStepIdx(idx)}
                className={`h-2 rounded-full transition-all cursor-pointer ${
                  idx === stepIdx
                    ? 'w-6 bg-amber-500'
                    : idx < stepIdx
                    ? 'w-2 bg-emerald-500'
                    : 'w-2 bg-slate-300 dark:bg-slate-700'
                }`}
                title={s.title}
              />
            ))}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition cursor-pointer"
            >
              Pular Guia
            </button>

            <button
              type="button"
              onClick={handlePrev}
              disabled={stepIdx === 0}
              className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-slate-800 disabled:opacity-30 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              Anterior
            </button>

            <button
              type="button"
              onClick={handleNext}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black shadow-md transition flex items-center gap-1.5 cursor-pointer"
            >
              {stepIdx === steps.length - 1 ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Concluir e Começar a Usar 🎉
                </>
              ) : (
                <>
                  Próximo Passo
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
