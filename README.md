# Gestão de Classes e Planejamento de Atividades — Desbravadores

Sistema web para organização anual das atividades dos cartões de classes (Regulares e Avançadas) do Clube de Desbravadores, com foco em **planejamento orientado à demanda**, **assinatura em lote**, **controle de acesso por perfil de líder** e **histórico de auditoria (logs)**.

## Documentação

- **[Arquitetura do Sistema (`docs/ARQUITETURA.md`)](./docs/ARQUITETURA.md)**: Especificação completa da stack tecnológica, modelagem do banco de dados relacional, regras de permissão (RBAC), fluxos de telas e roadmap de implementação.

## Principais Módulos Planejados

1. **Catálogo Estruturado de Cartões (Amigo a Guia — Regular e Avançada):**
   - Divisão por seções oficiais do cartão, tipos de execução e **Grupos de Equivalência Inter-classes**.
   - Categorização por **Tags de Contexto** (`Ao Ar Livre`, `Acampamento`, `Igreja`, `Comunidade`, `Especialidade`, `Reunião Regular`).
2. **Matriz Dinâmica de Demanda do Clube:**
   - Filtro inteligente que mostra quais atividades ainda precisam ser realizadas no ano, quantos e quais desbravadores estão pendentes em cada item.
3. **Acompanhamento de Progresso Individual e em Lote:**
   - Cartão virtual do desbravador, grade interativa por classe e **Modo Evento** (para dar baixa em vários desbravadores e classes de uma só vez após um acampamento ou atividade).
4. **Governança, Login de Líderes e Auditoria:**
   - Perfis para **Diretor/Admin**, **Secretário**, **Instrutor** e **Conselheiro**.
   - Registro imutável de logs (`Audit Log`) detalhando quem alterou, quando e qual era o valor anterior.
