# Contributing to openwebui-mcp-server

Thank you for your interest in contributing! This project follows a few simple rules.

## Setup

```bash
git clone https://github.com/marccyberleda/openwebui-mcp-server.git
cd openwebui-mcp-server
npm install
cp .env.example .env
# Fill in OPENWEBUI_URL and OPENWEBUI_API_KEY in .env
```

## Testing

Tests require a live Open WebUI instance. Set your env vars and run:

```bash
npm test
```

Tests create real resources in Open WebUI and clean up after themselves. Don't run tests against a production instance with important data.

## Code Style

- ES modules (`import`/`export`), no CommonJS
- Native `fetch` only — no axios, no got
- Node 18+ built-ins only — no extra runtime deps
- All new tools follow the pattern in `src/tools/*.js`
- Destructive operations (delete) must require `confirm: true`
- Tool names prefixed with `openwebui_`

## Adding a Tool

1. Add the API method to `src/api-client.js`
2. Add the tool definition to the appropriate `src/tools/*.js` file
3. Add tests to `src/tools/*.test.js`
4. Document it in `docs/TOOLS.md`
5. Add to CHANGELOG.md

## Pull Requests

- One feature or fix per PR
- All tests must pass
- Update CHANGELOG.md under `[Unreleased]`
- Describe what you changed and why in the PR description

## Reporting Issues

Use the GitHub issue templates:
- **Bug report** — something isn't working
- **Feature request** — endpoint or tool not yet covered

## License

By contributing, you agree your changes are licensed under the [MIT License](LICENSE).
