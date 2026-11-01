# Fluxos de Trabalho da Diretoria via MCP

## Fluxo 1: Fechamento de Requisitos Após Acampamento
1. Liste os eventos com `list_events` ou crie um novo evento com `create_event` informando `event_type: "ACAMPAMENTO"`, os `requirement_ids` trabalhados no acampamento e os `attendee_ids` presentes.
2. Execute `execute_event` passando o `eventId`.
3. Em seguida, chame `get_unification_opportunities` para verificar se os requisitos cumpridos no acampamento desbloquearam equivalências em outras classes para desbravadores com Cartão Agrupado, e rode `apply_unification_sync`.

## Fluxo 2: Geração de Pastas de Impressão para os Instrutores
1. Para cada classe (`amigo`, `companheiro`, `pesquisador`, `pioneiro`, `excursionista`, `guia`), invoque `get_pdf_link` com `docType: "INSTRUCTOR_CONTROL"` e `classSlug`.
2. Se uma classe possuir múltiplos instrutores (ex.: Turma A e Turma B), passe o `instructorId` de cada instrutor para gerar a folha exclusiva com os desbravadores daquele instrutor.
3. Entregue a tabela de links `viewUrl` e `downloadUrl` pronta para a secretaria ou diretor.
