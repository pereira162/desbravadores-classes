---
name: sgc-desbravadores-mcp
description: Guia especializado e conjunto de ferramentas MCP (Model Context Protocol) para operar o sistema SGC Classes • Desbravadores via IA. Use sempre que o usuário ou membro da diretoria pedir para consultar desbravadores, aprovar requisitos (individualmente ou em lote), sincronizar unificações/equivalências entre classes, planejar/executar eventos ou obter links diretos de visualização e download de PDFs (Controle do Instrutor, Ficha do Desbravador, Matriz da Classe e Planejamento Anual).
---

# Skill: Operação Inteligente do SGC Classes • Desbravadores via MCP

Esta skill capacita agentes de IA a gerenciar integralmente o **Sistema de Gestão de Classes dos Desbravadores (Currículo Oficial DSA)** através do servidor **Model Context Protocol (MCP)** integrado à aplicação.

---

## 1. Formas de Conexão ao Servidor MCP

O sistema suporta dois modos nativos de conexão MCP:

### A. Conexão Local via Stdio (`mcp_config.json`)
Para agentes rodando na mesma máquina ou em IDEs com suporte a MCP (`Antigravity`, `Claude Desktop`, `Cursor`):

```json
{
  "mcpServers": {
    "sgc-desbravadores": {
      "command": "node",
      "args": [
        "/config/Documentos/Projetos/desbravadores/gestao-classes/src/mcp/mcpServer.js"
      ],
      "env": {
        "SGC_API_URL": "https://137.131.209.239.nip.io",
        "SGC_MCP_API_KEY": "SUA_CHAVE_GERADA_PELO_DIRETOR"
      }
    }
  }
}
```

### B. Conexão Remota via HTTPS JSON-RPC (`/api/mcp/rpc`)
Qualquer agente ou script pode enviar chamadas JSON-RPC 2.0 diretamente para:
- **Endpoint**: `POST https://137.131.209.239.nip.io/api/mcp/rpc`
- **Header de Autenticação**: `X-MCP-API-Key: sgc_mcp_...` (gerada pelo Diretor ou Gestor na aba **IA & MCP** dentro do sistema).
- Para ambiente de demonstração/teste isolado, adicione o header `X-Test-Mode: true`.

---

## 2. Catálogo de Ferramentas MCP Disponíveis

Consulte [`references/tools_reference.md`](references/tools_reference.md) para os schemas JSON detalhados de cada ferramenta. Resumo rápido:

| Ferramenta MCP | Categoria | O que faz |
| :--- | :--- | :--- |
| `get_club_summary` | `LEITURA` | Retorna estatísticas gerais do clube, unidades, progresso por classe e total de alertas de unificação. |
| `list_pathfinders` | `LEITURA` | Lista desbravadores filtrando por `classSlug` (`amigo`, `companheiro`, etc.), `unitId` ou `search`. |
| `create_pathfinder` | `CADASTRO` | Cadastra novo desbravador e matricula automaticamente nas classes informadas (`class_slugs`). |
| `update_pathfinder` | `CADASTRO` | Atualiza nome, nascimento, unidade ou classes matriculadas de um desbravador. |
| `update_requirement_progress` | `PROGRESSO` | Marca ou aprova (`PENDENTE`, `EM_ANDAMENTO`, `CONCLUIDO`, `APROVADO`) um requisito para um desbravador. |
| `bulk_approve_requirements` | `PROGRESSO` | Assina/aprova múltiplos requisitos para vários desbravadores em lote. |
| `get_unification_opportunities` | `PLANEJAMENTO` | Lista desbravadores que já cumpriram um requisito equivalente a outro ainda pendente. |
| `apply_unification_sync` | `PROGRESSO` | Sincroniza e aprova automaticamente todos os requisitos equivalentes pendentes. |
| `update_equivalence_group` | `PLANEJAMENTO` | Cria ou edita grupos de unificação entre classes. |
| `list_events` / `create_event` / `execute_event` | `EVENTOS` | Lista, cria e executa eventos/acampamentos aprovando requisitos em lote para os participantes. |
| `get_pdf_link` | `PDF` | Resolve e retorna os links diretos `viewUrl` e `downloadUrl` para qualquer PDF do sistema. |

---

## 3. Regras de Ouro ao Operar o Sistema

1. **Respeito ao Escopo (RBAC)**:
   - Chaves MCP criadas para um **Instrutor** específico só podem aprovar requisitos e cadastrar desbravadores daquela classe atribuída (e da sua subturma, quando houver múltiplos instrutores na mesma classe), a menos que o Diretor/Gestor tenha concedido permissão global.
2. **Unificações Reais**:
   - Dois requisitos só devem ser unificados via `update_equivalence_group` quando **uma única ação prática** cumpre ambos simultaneamente (ex.: mesma especialidade ou subconjunto válido, caminhadas onde a maior distância cobre a menor, mesmos capítulos bíblicos ou mesmo evento prático).
3. **Entrega de PDFs Prontos**:
   - Sempre que o usuário pedir um PDF (Controle do Instrutor, Ficha Simplificada, Ficha Completa, Matriz ou Planejamento Anual), chame `get_pdf_link` e forneça os links diretos `viewUrl` (para abrir no navegador) e `downloadUrl` (para baixar o arquivo).

---

## 4. Recursos Adicionais desta Skill

- **Referência Técnica das Ferramentas**: [`references/tools_reference.md`](references/tools_reference.md)
- **Fluxos de Trabalho da Diretoria**: [`references/workflows_diretoria.md`](references/workflows_diretoria.md)
- **Script CLI de Execução Rápida**: [`scripts/mcp_cli.js`](scripts/mcp_cli.js)
- **Exemplos de Prompts e Payloads**: [`examples/sample_prompts_and_calls.md`](examples/sample_prompts_and_calls.md)
