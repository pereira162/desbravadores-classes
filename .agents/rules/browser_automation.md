# Global Agent Rules

## Navegador e Automação Web

Sempre que o usuário solicitar para **abrir o navegador**, navegar na web ou interagir com páginas web:
- **OBRIGATÓRIO**: Utilize o MCP **`chrome-devtools-mcp`** (usando as ferramentas de navegação e inspeção como `list_pages`, `new_page`, `navigate_page`, `click`, etc.).
- **NÃO** abra o navegador de forma desconectada via comandos shell/PowerShell (como `Start-Process "chrome.exe"`), a menos que o usuário peça explicitamente para abrir fora do controle do assistente.
- Garanta que a sessão do Chrome seja gerenciada e controlada através das ferramentas do `chrome-devtools-mcp`.
