# CLAUDE.md — openwebui-mcp-server

## Project Overview
Open-source MCP server connecting Claude Code and Claude Desktop to Open WebUI.
GitHub: https://github.com/marccyberleda/openwebui-mcp-server
npm: `npx openwebui-mcp-server`

## Stack
- Node.js >= 18 (ESM, native fetch)
- `@modelcontextprotocol/sdk` (MCP protocol)
- Zero other runtime dependencies

## Rules
- NEVER use `python` or `py` — use `node -e` for JSON operations
- All code is ESM (`import`/`export`, NOT `require`)
- Node.js >= 18 — use native `fetch` (no axios, no got)
- Tests use Node's built-in test runner (`node --test`)
- Tool names are prefixed with `openwebui_`
- All destructive operations (delete) require `confirm: true` parameter
- No hardcoded URLs or API keys anywhere — only `process.env`
- `DEBUG=openwebui-mcp` enables request logging to stderr

## Architecture
```
src/
├── index.js          MCP server entry point, tool registration, dispatch
├── api-client.js     Open WebUI REST API wrapper (all HTTP calls here)
├── tools/
│   ├── chats.js      5 tools: list, search, get, delete, tags
│   ├── knowledge.js  6 tools: list, get, create, update, add-file, remove-file
│   ├── files.js      4 tools: list, upload, get-info, delete
│   ├── functions.js  5 tools: list, get, create, update, delete
│   ├── models.js     1 tool: list
│   ├── prompts.js    4 tools: list, create, update, delete
│   └── system.js     1 tool: get-status
└── utils/
    ├── errors.js     APIError class
    └── validators.js requireParam, requireConfirm, toPage helpers
```

## Testing
```bash
cp .env.example .env
# Fill in OPENWEBUI_URL and OPENWEBUI_API_KEY
npm test
```
Tests call the real API. They create and delete test resources. Do not run against production.

## Adding a new tool
1. Add the API method to `src/api-client.js`
2. Add tool definition to the appropriate `src/tools/*.js` array
3. Write tests in `src/tools/*.test.js`
4. Document in `docs/TOOLS.md`
5. Update `CHANGELOG.md` under [Unreleased]

## API endpoint conventions
- All endpoints verified against Open WebUI 0.8.x
- Auth: `Authorization: Bearer <OPENWEBUI_API_KEY>` on every request
- Files use `multipart/form-data` (FormData + Blob)
- Prompts identified by `command` (string starting with `/`)
- Functions identified by `id` (user-defined string, path: `/api/v1/functions/id/{id}`)

## Running locally
```bash
OPENWEBUI_URL=http://localhost:3000 OPENWEBUI_API_KEY=<key> node src/index.js
```

## Publishing
Marc publishes to npm manually. Do NOT run `npm publish` without explicit instruction.
