#!/usr/bin/env node
/**
 * Utilitário CLI para chamar ferramentas MCP do SGC Classes • Desbravadores via linha de comando.
 * Uso:
 *   node scripts/mcp_cli.js <toolName> '<jsonArgs>' [--test]
 */
const { prodDb, testDb, initDatabase } = require('../../../../gestao-classes/src/server/db');
const { executeMcpTool } = require('../../../../gestao-classes/src/server/mcpHandler');

async function main() {
  const args = process.argv.slice(2);
  const isTest = args.includes('--test');
  const cleanArgs = args.filter((a) => a !== '--test');
  const toolName = cleanArgs[0] || 'get_club_summary';
  const toolArgs = cleanArgs[1] ? JSON.parse(cleanArgs[1]) : {};

  initDatabase();
  const targetDb = isTest ? testDb : prodDb;
  const user = {
    id: 'cli-director',
    name: 'Diretor via CLI MCP',
    role: 'DIRETOR',
    active: 1,
  };

  const res = await executeMcpTool(
    toolName,
    toolArgs,
    { user, allowedTools: ['*'], baseUrl: process.env.SGC_API_URL || 'https://137.131.209.239.nip.io' },
    targetDb
  );
  console.log(JSON.stringify(res, null, 2));
}

main().catch((err) => {
  console.error('Erro MCP CLI:', err.message);
  process.exit(1);
});
