---
globs: ["package.json", "CHANGELOG.md", "**/*.ts", "**/*.js", "src/**"]
---
# NPM Publishing Rules

- Package name: openwebui-mcp-server
- Always bump version in package.json before npm publish
- Update CHANGELOG.md with every version bump
- Run npm test before publishing (node --test tests/*.js)
- Verify npx -y openwebui-mcp-server works after publish
- All code is ESM (import/export, NOT require)
- Node.js >= 18 — use native fetch (no axios, no got)
- Tests use Node's built-in test runner (node --test)
- Tool names prefixed with openwebui_
- All destructive operations (delete) require confirm: true parameter
- No hardcoded URLs or API keys — only process.env
- Competitor: troylar/open-webui-mcp-server (Python-based) — differentiator: Node.js/npx zero-install
