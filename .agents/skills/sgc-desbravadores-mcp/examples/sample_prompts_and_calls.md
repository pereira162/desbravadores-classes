# Exemplos de Prompts e Chamadas MCP

## Exemplo 1: Obter o PDF de Controle do Instrutor da Classe de Amigo
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "get_pdf_link",
    "arguments": {
      "docType": "INSTRUCTOR_CONTROL",
      "classSlug": "amigo"
    }
  }
}
```

## Exemplo 2: Sincronizar Requisitos Equivalentes Pendentes
```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "tools/call",
  "params": {
    "name": "apply_unification_sync",
    "arguments": {}
  }
}
```

## Exemplo 3: Aprovar Requisito em Lote para Turma de Amigo
```json
{
  "jsonrpc": "2.0",
  "id": 3,
  "method": "tools/call",
  "params": {
    "name": "bulk_approve_requirements",
    "arguments": {
      "requirementIds": ["amigo-I-1", "amigo-I-2"],
      "pathfinderIds": ["dbv-01", "dbv-02"],
      "status": "APROVADO",
      "notes": "Voto e Lei recitados na reunião de abertura"
    }
  }
}
```
