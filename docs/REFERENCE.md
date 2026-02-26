# OpenWebUI MCP Server — Reference Data
> Lookup data for Claude Code sessions. Not loaded automatically — use @docs/REFERENCE.md when needed.

## Package
- npm: openwebui-mcp-server
- GitHub: https://github.com/marccyberleda/openwebui-mcp-server
- License: MIT
- Tools: 23 total (chats, knowledge, files, functions, models, prompts, system)

## Tool Categories
| Category | Tool prefix | Count |
|----------|-------------|-------|
| Status | openwebui_get_status | 1 |
| Chats | openwebui_list/search/get/delete_chat | 4 |
| Knowledge | openwebui_list/create/get/update/add_file/remove_file/delete_knowledge | 7 |
| Files | openwebui_list/upload/get/delete_file | 4 |
| Functions | openwebui_list/create/get/update/delete_function | 5 |
| Models | openwebui_list_models | 1 |
| Prompts | openwebui_list/create/get/update/delete_prompt | 5 |

## OWU API
- OpenAPI spec: http://localhost:3080/openapi.json (may also be :3002 depending on deployment)
- Auth: Bearer token from Settings → Account → API Keys
- All calls: Authorization: Bearer <token>

## Registration (CyberLeda sovereign stack)
```bash
claude mcp add openwebui \
  -e OPENWEBUI_URL=http://localhost:3080 \
  -e "OPENWEBUI_API_KEY=<from credman OWU_API_KEY>" \
  -- npx -y openwebui-mcp-server
```

## Competitor
- troylar/open-webui-mcp-server: Python-based, appeared ~3 weeks ago (as of 2026-02)
- Our differentiator: Node.js/npx zero-install, already on npm, 23 tools vs fewer
