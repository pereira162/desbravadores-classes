# Referência Completa de Ferramentas MCP — SGC Classes Desbravadores

## 1. `get_club_summary`
Retorna o diagnóstico geral do clube.
- **Argumentos**: `{}`
- **Retorno**:
  - `clubName`, `region`, `investitureDate`
  - `totalPathfinders`, `totalUnits`
  - `progressBreakdown`: contagem de requisitos por status (`PENDENTE`, `EM_ANDAMENTO`, `CONCLUIDO`, `APROVADO`)
  - `pendingUnificationAlertsCount`: total de requisitos equivalentes prontos para sincronizar
  - `unificationAlertsPreview`: lista dos primeiros alertas de unificação

## 2. `list_pathfinders`
Lista desbravadores com percentual de progresso por classe.
- **Argumentos**:
  - `classSlug` *(opcional)*: `"amigo"`, `"companheiro"`, `"pesquisador"`, `"pioneiro"`, `"excursionista"`, `"guia"`
  - `unitId` *(opcional)*: ID da unidade (ex.: `"unit-aguias"`)
  - `search` *(opcional)*: termo de busca pelo nome

## 3. `create_pathfinder`
Cadastra um desbravador e matricula nas classes indicadas.
- **Argumentos**:
  - `name` *(obrigatório)*: Nome completo
  - `birth_date` *(obrigatório)*: `"YYYY-MM-DD"`
  - `gender`: `"M"` ou `"F"`
  - `unit_id`: ID da unidade
  - `class_slugs`: Array de slugs (ex.: `["amigo", "amigo-avancado"]`)
  - `email`, `notes`

## 4. `update_requirement_progress`
Atualiza o status de um requisito para um desbravador.
- **Argumentos**:
  - `pathfinderId` *(obrigatório)*: ID do desbravador (ex.: `"dbv-01"`)
  - `requirementId` *(obrigatório)*: ID oficial do requisito (ex.: `"amigo-I-1"`)
  - `status` *(obrigatório)*: `"PENDENTE" | "EM_ANDAMENTO" | "CONCLUIDO" | "APROVADO"`
  - `notes` *(opcional)*: Observação do instrutor/conselheiro

## 5. `bulk_approve_requirements`
Aprova múltiplos requisitos para múltiplos desbravadores de uma só vez.
- **Argumentos**:
  - `requirementIds` *(obrigatório)*: Array de IDs de requisitos
  - `pathfinderIds` *(obrigatório)*: Array de IDs de desbravadores
  - `status`: `"APROVADO"` (padrão) ou `"CONCLUIDO"`
  - `notes`: Justificativa ou nome da atividade

## 6. `get_unification_opportunities` & `apply_unification_sync`
- `get_unification_opportunities`: Lista todos os casos em que um desbravador já cumpriu um requisito equivalente a outro ainda pendente.
- `apply_unification_sync`: Recebe `{ pathfinderId?: string }` e aprova todos os requisitos equivalentes pendentes automaticamente.

## 7. `get_pdf_link`
Resolve o cache estruturado de PDFs no backend e devolve links permanentes com token seguro.
- **Argumentos**:
  - `docType` *(obrigatório)*:
    - `"INSTRUCTOR_CONTROL"`: Ficha de Controle do Instrutor (1 página A4 por 6 desbravadores). Aceita `classSlug`, `unitId`, `instructorId`.
    - `"PF_CARD"`: Ficha Individual do Desbravador. Aceita `pathfinderId` e `mode` (`"simplified"` para 1 página com círculos de marcação ou `"full"` para ficha detalhada).
    - `"PLANNING"`: Mapa de Planejamento Anual. Aceita `mode` (`"activities"` ou `"equivalences"`) e `unitId`.
    - `"MATRIX"`: Matriz Geral da Classe em A4 Paisagem. Aceita `classSlug`, `mode` (`"BOTH"`, `"REGULAR"`, `"AVANCADA"`), `unitId`, `instructorId`.
- **Retorno**:
  - `token`: ID aleatório seguro do PDF em cache
  - `fileName`: Nome amigável do arquivo
  - `viewUrl`: Link direto para visualizar no navegador (`/api/pdf/v/<token>`)
  - `downloadUrl`: Link direto para download (`/api/pdf/d/<token>`)
