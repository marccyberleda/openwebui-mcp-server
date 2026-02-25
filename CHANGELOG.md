# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-02-26

### Added
- Initial release
- **Chat tools** (5): list, search, get, delete, get tags
- **Knowledge base tools** (6): list, get, create, update, add file, remove file
- **File tools** (4): list, upload (base64), get info, delete
- **Function tools** (5): list, get, create, update, delete
- **Model tools** (1): list all models
- **Prompt tools** (4): list, create, update, delete
- **System tools** (1): health/version/config status
- Claude Code and Claude Desktop support
- Native fetch (no external HTTP deps)
- 30-second timeout with single 5xx retry
- Debug mode via `DEBUG=openwebui-mcp`
- `confirm: true` requirement for all destructive operations
- Base64 file upload support (for stdio transport compatibility)
- Full API coverage for Open WebUI 0.3.0+
