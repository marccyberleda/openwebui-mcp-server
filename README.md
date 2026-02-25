# Open WebUI MCP Server

> Connect Claude Code and Claude Desktop to your Open WebUI instance.
> Manage chats, RAG knowledge bases, files, functions, and prompts — directly from Claude.

[![npm version](https://img.shields.io/npm/v/openwebui-mcp-server)](https://www.npmjs.com/package/openwebui-mcp-server)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18-brightgreen)](https://nodejs.org)

---

## What This Does

Open WebUI is a powerful self-hosted AI interface — but until now, you couldn't interact with it _from_ Claude. This MCP server bridges that gap.

Once connected, Claude can search your chat history, build RAG knowledge bases from files you describe, create custom pipeline functions, and manage prompts — all without leaving your conversation.

**Who it's for:** Claude Code users, Claude Desktop users, AI developers, and Open WebUI power users who want Claude to help manage their AI infrastructure.

---

## Quick Start

### Claude Code (3 commands)

```bash
# 1. Get your API key from Open WebUI: Settings → Account → API Keys

# 2. Add the MCP server
claude mcp add openwebui \
  -e OPENWEBUI_URL=http://localhost:3000 \
  -e OPENWEBUI_API_KEY=sk-your-key-here \
  -- npx -y openwebui-mcp-server

# 3. Verify it's connected
# In Claude Code, run: /mcp
```

### Claude Desktop

Paste this into your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "openwebui": {
      "command": "npx",
      "args": ["-y", "openwebui-mcp-server"],
      "env": {
        "OPENWEBUI_URL": "http://localhost:3000",
        "OPENWEBUI_API_KEY": "your-api-key-here"
      }
    }
  }
}
```

Config file locations:
- **macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`
- **Linux:** `~/.config/Claude/claude_desktop_config.json`

---

## Available Tools (23 total)

### Chats
| Tool | Description |
|------|-------------|
| `openwebui_list_chats` | List recent conversations, paginated |
| `openwebui_search_chats` | Search chat history by keyword |
| `openwebui_get_chat` | Get full chat with all messages |
| `openwebui_delete_chat` | Delete a chat (requires confirm) |
| `openwebui_get_chat_tags` | List all tags used across chats |

### Knowledge Bases (RAG)
| Tool | Description |
|------|-------------|
| `openwebui_list_knowledge` | List all knowledge base collections |
| `openwebui_get_knowledge` | Get collection details and file list |
| `openwebui_create_knowledge` | Create a new collection |
| `openwebui_update_knowledge` | Update name or description |
| `openwebui_add_file_to_knowledge` | Add uploaded file to a collection |
| `openwebui_remove_file_from_knowledge` | Remove file from a collection |

### Files
| Tool | Description |
|------|-------------|
| `openwebui_list_files` | List all uploaded files |
| `openwebui_upload_file` | Upload file (base64 content) |
| `openwebui_get_file_info` | Get file metadata |
| `openwebui_delete_file` | Delete a file (requires confirm) |

### Functions (Pipes, Filters, Actions)
| Tool | Description |
|------|-------------|
| `openwebui_list_functions` | List all functions by type |
| `openwebui_get_function` | Get function with source code |
| `openwebui_create_function` | Create a new Python function |
| `openwebui_update_function` | Update function code or metadata |
| `openwebui_delete_function` | Delete a function (requires confirm) |

### Models
| Tool | Description |
|------|-------------|
| `openwebui_list_models` | List all available models |

### Prompts
| Tool | Description |
|------|-------------|
| `openwebui_list_prompts` | List all saved prompts |
| `openwebui_create_prompt` | Create a new saved prompt |
| `openwebui_update_prompt` | Update prompt title or content |
| `openwebui_delete_prompt` | Delete a prompt (requires confirm) |

### System
| Tool | Description |
|------|-------------|
| `openwebui_get_status` | Check health, version, and config |

---

## Configuration

| Variable | Required | Description |
|----------|----------|-------------|
| `OPENWEBUI_URL` | Yes | Base URL (e.g. `http://localhost:3000`) |
| `OPENWEBUI_API_KEY` | Yes | Bearer token from Settings → Account → API Keys |
| `DEBUG` | No | Set to `openwebui-mcp` to log HTTP requests to stderr |

---

## Examples

### Build a RAG knowledge base

```
"Create a knowledge base called 'Security Runbooks' for incident response docs"
→ openwebui_create_knowledge(name: "Security Runbooks", ...)
  Knowledge base created. ID: abc-123

"Upload this runbook and add it to Security Runbooks"
→ openwebui_upload_file(filename: "incident-response.md", ...)
→ openwebui_add_file_to_knowledge(knowledge_id: "abc-123", file_id: "xyz-456")
  File added. Now available for RAG retrieval.
```

### Search and review conversations

```
"Search my chats for any discussion about Kubernetes networking"
→ openwebui_search_chats(query: "kubernetes networking")
  Found 3 chats: [list of results]

"Show me the full conversation from last week about DNS issues"
→ openwebui_get_chat(id: "...")
  [Full conversation displayed]
```

### Create a reusable prompt

```
"Create a prompt /standup that generates a standup update from {{input}}"
→ openwebui_create_prompt(
    command: "/standup",
    title: "Daily Standup",
    content: "Generate a concise standup update from these notes: {{input}}"
  )
  Prompt created. Type /standup in any Open WebUI chat to use it.
```

### Install a custom pipe function

```
"Create a pipe function that translates all responses to French"
→ openwebui_create_function(
    id: "french_translator",
    name: "French Translator",
    type: "filter",
    content: "# Python code..."
  )
  Function created. Enable it in Settings → Functions.
```

---

## Requirements

- **Node.js** >= 18.0.0
- **Open WebUI** >= 0.3.0 (any self-hosted install)
- **API key** from Open WebUI Settings → Account → API Keys

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

Issues and PRs welcome — especially for new API endpoints added in newer Open WebUI versions.

---

## License

MIT — see [LICENSE](LICENSE)

---

Built by [Marc](https://github.com/marccyberleda) — cybersecurity and automation infrastructure at [CyberLeda](https://cyberleda.com)
