import React, { useState } from 'react';
import {
  BookOpen,
  X,
  Shield,
  Layers,
  GitMerge,
  FileDown,
  Bot,
  Globe,
  Search,
  CheckCircle2,
  ExternalLink,
  Copy,
  Check,
} from 'lucide-react';

const DOC_SECTIONS = [
  {
    id: 'overview',
    label: '1. O que é o SGC Classes',
    icon: BookOpen,
  },
  {
    id: 'roles',
    label: '2. Cargos & Permissões',
    icon: Shield,
  },
  {
    id: 'tabs',
    label: '3. Guia das Abas do Sistema',
    icon: Layers,
  },
  {
    id: 'unifications',
    label: '4. Unificações & Currículo DSA',
    icon: GitMerge,
  },
  {
    id: 'pdfs',
    label: '5. Motor de PDFs em Cache',
    icon: FileDown,
  },
  {
    id: 'mcp',
    label: '6. Inteligência Artificial & MCP',
    icon: Bot,
  },
];

export default function DocumentationModal({ isOpen, onClose }) {
  const [activeSection, setActiveSection] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedSnippet, setCopiedSnippet] = useState(false);

  // Fecha ao pressionar ESC
  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' || e.keyCode === 27) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const mcpSnippet = JSON.stringify(
    {
      mcpServers: {
        'sgc-desbravadores': {
          command: 'node',
          args: ['/caminho/para/gestao-classes/src/mcp/mcpServer.js'],
          env: {
            SGC_API_URL: window.location.origin,
            SGC_MCP_API_KEY: 'sgc_mcp_SUA_CHAVE_AQUI',
          },
        },
      },
    },
    null,
    2
  );

  const handleCopyMcp = () => {
    navigator.clipboard.writeText(mcpSnippet);
    setCopiedSnippet(true);
    setTimeout(() => setCopiedSnippet(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-sm p-3 sm:p-6">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black shadow">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold tracking-tight">
                Documentação Oficial • SGC Classes Desbravadores
              </h2>
              <p className="text-xs text-slate-400">
                Manual completo de uso, currículo oficial DSA, unificações, PDFs instantâneos e servidor MCP/IA
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Sidebar */}
          <div className="w-full md:w-72 bg-slate-50 dark:bg-slate-950/60 border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-800 p-4 flex flex-col gap-3 shrink-0">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Pesquisar na documentação..."
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <nav className="flex md:flex-col gap-1.5 overflow-x-auto md:overflow-x-visible pb-1 md:pb-0">
              {DOC_SECTIONS.map((sec) => {
                const Icon = sec.icon;
                const active = activeSection === sec.id;
                return (
                  <button
                    key={sec.id}
                    type="button"
                    onClick={() => setActiveSection(sec.id)}
                    className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold text-left whitespace-nowrap md:whitespace-normal transition-all cursor-pointer ${
                      active
                        ? 'bg-amber-500 text-slate-950 shadow-sm'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{sec.label}</span>
                  </button>
                );
              })}
            </nav>

            <div className="mt-auto hidden md:block p-3 rounded-xl bg-amber-50 dark:bg-slate-800/80 border border-amber-200 dark:border-slate-700 text-[11px] text-slate-600 dark:text-slate-300 space-y-1">
              <p className="font-bold text-slate-900 dark:text-white">Currículo Oficial DSA</p>
              <p>Todos os requisitos seguem fielmente os cartões oficiais da Divisão Sul-Americana da IASD.</p>
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 text-sm text-slate-700 dark:text-slate-200 leading-relaxed">
            {(activeSection === 'overview' || searchQuery) && (
              <section className="space-y-4">
                <h3 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-amber-500" />
                  1. O que é o SGC Classes • Desbravadores
                </h3>
                <p>
                  O <strong>SGC Classes</strong> é uma plataforma web completa para gerenciamento dos Cartões de Classes Regulares e Avançadas (Amigo a Guia), Classes Agrupadas, Planejamento Anual Unificado e emissão instantânea de fichas e controles de instrutor em PDF.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                    <h4 className="font-bold text-slate-900 dark:text-white mb-1">
                      Ambiente Oficial vs. Ambiente de Testes
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-300">
                      O ambiente oficial salva os dados reais do seu clube com backup automático. Já o <strong>Ambiente de Testes (Demonstração)</strong> funciona em uma <em>Sandbox efêmera no navegador</em>: você pode testar todas as contas (Diretor, Instrutores, Conselheiros e Desbravadores) sem alterar o servidor e sem misturar seus testes com outros visitantes.
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                    <h4 className="font-bold text-slate-900 dark:text-white mb-1">
                      Personalização Visual & Temas
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-300">
                      O Diretor pode definir a <strong>Logo do Clube</strong> e escolher entre 5 temas de cores no primeiro acesso ou nas configurações, além de alternar entre Modo Claro, Escuro ou Automático (sistema).
                    </p>
                  </div>
                </div>
              </section>
            )}

            {(activeSection === 'roles' || searchQuery) && (
              <section className="space-y-4">
                <h3 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <Shield className="w-5 h-5 text-amber-500" />
                  2. Cargos, Escopo Estrito por Padrão & Poderes Extras
                </h3>
                <p>
                  Por padrão, cada membro da diretoria visualiza e gerencia <strong>apenas o que lhe diz respeito</strong>. O <strong>Diretor</strong> e o <strong>Gestor</strong> podem conceder poderes adicionais granulares ou criar cargos personalizados (como <em>Diretor Associado</em>, <em>Capelão</em>, <em>Instrutor Geral</em>).
                </p>
                <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold">
                      <tr>
                        <th className="p-3">Cargo</th>
                        <th className="p-3">Acesso Padrão</th>
                        <th className="p-3">Poderes Extras que o Diretor/Gestor pode liberar</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                      <tr>
                        <td className="p-3 font-bold">DIRETOR / GESTOR</td>
                        <td className="p-3">Acesso total ao clube, diretoria, unificações, configurações e IA/MCP.</td>
                        <td className="p-3">Já possui todos os poderes habilitados.</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-bold">SECRETÁRIO(A)</td>
                        <td className="p-3">Gerencia desbravadores, unidades, matrículas e emite fichas PDF.</td>
                        <td className="p-3">Pode receber permissão de aprovar requisitos, gerir eventos e editar unificações.</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-bold">INSTRUTOR(A)</td>
                        <td className="p-3">Vê, cadastra e aprova <strong>apenas</strong> desbravadores da(s) sua(s) classe(s) e turma atribuída.</td>
                        <td className="p-3">Ver todas as classes, gerir unidades, gerir eventos, editar unificações ou aprovar qualquer classe.</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-bold">CONSELHEIRO(A)</td>
                        <td className="p-3">Vê, cadastra e acompanha <strong>apenas</strong> os desbravadores da sua unidade.</td>
                        <td className="p-3">Liberar outras unidades, ver todas as classes, aprovar requisitos gerais ou gerir eventos.</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-bold">DESBRAVADOR</td>
                        <td className="p-3">Visualiza seu próprio cartão de classes, progresso e eventos do clube.</td>
                        <td className="p-3">Somente leitura do seu progresso e download das próprias fichas PDF.</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {(activeSection === 'tabs' || searchQuery) && (
              <section className="space-y-4">
                <h3 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <Layers className="w-5 h-5 text-amber-500" />
                  3. Guia das Abas do Sistema
                </h3>
                <ul className="space-y-2.5 text-xs sm:text-sm">
                  <li className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                    <strong>Visão Geral (Dashboard):</strong> Mostra estatísticas das classes, unidades, próximos eventos e o painel de <strong>Alertas de Unificação Automática</strong> (quando um desbravador cumpre um requisito que também vale para outra classe em que ele está matriculado).
                  </li>
                  <li className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                    <strong>Matriz da Classe:</strong> Tabela interativa requisitos × desbravadores. Permite filtrar por instrutor quando uma classe tem mais de um instrutor (ex: Turma A e Turma B), distribuir desbravadores entre instrutores, aprovar em lote e baixar o <em>Controle do Instrutor (1 página)</em> ou a <em>Matriz Completa</em>.
                  </li>
                  <li className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                    <strong>Planejamento Anual & Unificações:</strong> Agrupa os requisitos planejáveis por especialidade, leitura, versos ou atividades práticas, ocultando itens administrativos (como idade ou ser membro ativo). Permite <strong>criar e editar unificações</strong> com filtro de recomendações inteligentes.
                  </li>
                  <li className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                    <strong>Eventos:</strong> Criação de acampamentos, caminhadas ou feiras de especialidades vinculados a requisitos de várias classes, com aprovação coletiva para todos os presentes.
                  </li>
                  <li className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                    <strong>Desbravadores & Unidades:</strong> Cadastro completo de desbravadores, atribuição de classes regulares, avançadas e agrupadas, e acesso ao Cartão Individual com todos os subitens detalhados.
                  </li>
                </ul>
              </section>
            )}

            {(activeSection === 'unifications' || searchQuery) && (
              <section className="space-y-4">
                <h3 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <GitMerge className="w-5 h-5 text-amber-500" />
                  4. Regras Reais de Unificação & Fontes Oficiais DSA
                </h3>
                <p>
                  Uma unificação entre classes ocorre <strong>exclusivamente quando uma única ação cumpre ambos os requisitos ao mesmo tempo</strong> (por exemplo: cumprir a especialidade de <em>Aves</em> cumpre tanto o requisito que pede Aves quanto o requisito que pede qualquer especialidade de Estudo da Natureza; caminhar 10 km cumpre simultaneamente o requisito de caminhar 5 km).
                </p>
                <div className="p-4 rounded-xl bg-amber-50/80 dark:bg-slate-800 border border-amber-200 dark:border-slate-700 space-y-2 text-xs">
                  <p className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Globe className="w-4 h-4 text-amber-600" />
                    Fontes Oficiais Utilizadas nos Cartões e Requisitos:
                  </p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>
                      <strong>Divisão Sul-Americana (DSA) — Ministério de Desbravadores e Aventureiros:</strong>{' '}
                      <a
                        href="https://www.adventistas.org/pt/desbravadores/"
                        target="_blank"
                        rel="noreferrer"
                        className="text-amber-700 dark:text-amber-400 underline inline-flex items-center gap-1"
                      >
                        adventistas.org/pt/desbravadores <ExternalLink className="w-3 h-3" />
                      </a>
                    </li>
                    <li>
                      <strong>Manual Administrativo e Cartões de Classes Atualizados (MDA Wiki Oficial):</strong>{' '}
                      <a
                        href="https://mda.wiki.br/Cart%C3%B5es_de_Classes"
                        target="_blank"
                        rel="noreferrer"
                        className="text-amber-700 dark:text-amber-400 underline inline-flex items-center gap-1"
                      >
                        mda.wiki.br/Cartões_de_Classes <ExternalLink className="w-3 h-3" />
                      </a>
                    </li>
                  </ul>
                </div>
              </section>
            )}

            {(activeSection === 'pdfs' || searchQuery) && (
              <section className="space-y-4">
                <h3 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <FileDown className="w-5 h-5 text-amber-500" />
                  5. Motor Estruturado de PDFs em Cache & Links Constantes
                </h3>
                <p>
                  Todos os PDFs do sistema são gerados de forma vetorial no backend (sem captura de tela lenta) e ficam <strong>armazenados em cache com link único e aleatório</strong>, sendo atualizados automaticamente sempre que há mudança no progresso:
                </p>
                <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm">
                  <li>
                    <strong>Botão Baixar PDF:</strong> Faz o download imediato do documento com identificador único.
                  </li>
                  <li>
                    <strong>Botão Visualizar (Ícone de Olho):</strong> Abre o PDF diretamente no navegador sem precisar baixar.
                  </li>
                  <li>
                    <strong>Botão Compartilhar (Seta):</strong> Copia ou compartilha o link constante daquele documento.
                  </li>
                  <li>
                    <strong>Pronto para Impressão em Campo:</strong> Nos PDFs, itens pendentes ficam com espaço limpo (ou círculo vazio na ficha simplificada) para que o instrutor possa assinar ou datar à mão quando necessário.
                  </li>
                </ul>
              </section>
            )}

            {(activeSection === 'mcp' || searchQuery) && (
              <section className="space-y-4">
                <h3 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <Bot className="w-5 h-5 text-amber-500" />
                  6. Inteligência Artificial Integrada & Servidor MCP
                </h3>
                <p>
                  O <strong>Diretor</strong> e o <strong>Gestor</strong> têm acesso ao botão <strong>IA & MCP</strong> no topo do sistema, que oferece duas formas de automação inteligente:
                </p>
                <ol className="list-decimal pl-5 space-y-2 text-xs sm:text-sm">
                  <li>
                    <strong>Assistente IA Integrado no Site:</strong> Permite pedir em linguagem natural resumos do clube, aprovações em lote, sincronização de unificações pendentes e links diretos para qualquer PDF (inclusive por instrutor específico).
                  </li>
                  <li>
                    <strong>Servidor MCP (Model Context Protocol) com Chaves por Líder:</strong> O Diretor/Gestor pode gerar chaves de API individuais para membros da diretoria, escolhendo exatamente quais ferramentas cada chave pode acessar (ex: somente leitura e PDFs para um instrutor, ou acesso total para o Diretor).
                  </li>
                </ol>

                <div className="rounded-xl bg-slate-900 text-slate-100 p-4 border border-slate-700 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-400">
                      Exemplo de Configuração MCP (Claude Desktop / Cursor / Antigravity)
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyMcp}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 cursor-pointer"
                    >
                      {copiedSnippet ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      {copiedSnippet ? 'Copiado!' : 'Copiar JSON'}
                    </button>
                  </div>
                  <pre className="text-[11px] font-mono overflow-x-auto text-emerald-300">{mcpSnippet}</pre>
                  <p className="text-[11px] text-slate-400">
                    Também é possível conectar via HTTP JSON-RPC no endpoint <code>POST {window.location.origin}/api/mcp/rpc</code> enviando o cabeçalho <code>X-MCP-API-Key</code>.
                  </p>
                </div>
              </section>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            SGC Classes • Versão Beta Oficial
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl text-xs font-bold bg-slate-900 dark:bg-amber-500 text-white dark:text-slate-950 hover:opacity-90 transition-opacity cursor-pointer"
          >
            Fechar Documentação
          </button>
        </div>
      </div>
    </div>
  );
}
