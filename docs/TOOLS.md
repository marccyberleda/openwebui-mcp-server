# Tool Reference

Complete documentation for all 23 tools in `openwebui-mcp-server`.

---

## Chat Tools

### `openwebui_list_chats`
List recent chat conversations, paginated.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| `page` | number | No | Page number (starts at 1, default: 1) |

**Returns:** Formatted list with chat IDs, titles, and last update times.

**Example:**
```
openwebui_list_chats()
openwebui_list_chats(page: 2)
```

---

### `openwebui_search_chats`
Search chat history by keyword.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| `query` | string | Yes | Search keyword or phrase |

**Returns:** List of matching chats with IDs and titles.

**Example:**
```
openwebui_search_chats(query: "kubernetes deployment")
```

---

### `openwebui_get_chat`
Get full chat details including all messages.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| `id` | string | Yes | Chat ID (UUID from list/search) |

**Returns:** Chat title, message count, and full conversation (messages truncated at 500 chars each).

**Example:**
```
openwebui_get_chat(id: "abc123-...")
```

---

### `openwebui_delete_chat`
Delete a chat permanently.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| `id` | string | Yes | Chat ID to delete |
| `confirm` | boolean | Yes | Must be `true` |

**Example:**
```
openwebui_delete_chat(id: "abc123-...", confirm: true)
```

---

### `openwebui_get_chat_tags`
List all tags used across chats.

**Parameters:** None

**Returns:** Alphabetical list of all tags.

---

## Knowledge Base Tools

### `openwebui_list_knowledge`
List all RAG knowledge base collections.

**Parameters:** None

**Returns:** Collection names, IDs, descriptions, and file counts.

---

### `openwebui_get_knowledge`
Get details of a specific knowledge base.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| `id` | string | Yes | Knowledge base ID |

**Returns:** Name, description, and list of files in the collection.

---

### `openwebui_create_knowledge`
Create a new knowledge base collection.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| `name` | string | Yes | Collection name |
| `description` | string | No | What this collection contains |

**Returns:** New collection ID and next-step instructions.

**Workflow:** Create → Upload file → Add file to knowledge base.

---

### `openwebui_update_knowledge`
Update a knowledge base name or description.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| `id` | string | Yes | Knowledge base ID |
| `name` | string | No | New name |
| `description` | string | No | New description |

---

### `openwebui_add_file_to_knowledge`
Add an uploaded file to a knowledge base.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| `knowledge_id` | string | Yes | Knowledge base ID |
| `file_id` | string | Yes | File ID from `openwebui_upload_file` |

**Note:** File must already be uploaded via `openwebui_upload_file`.

---

### `openwebui_remove_file_from_knowledge`
Remove a file from a knowledge base (does not delete the file).

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| `knowledge_id` | string | Yes | Knowledge base ID |
| `file_id` | string | Yes | File ID to remove |

---

## File Tools

### `openwebui_list_files`
List all uploaded files.

**Parameters:** None

**Returns:** File names, IDs, types, and sizes.

---

### `openwebui_upload_file`
Upload a file using base64-encoded content.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| `filename` | string | Yes | File name with extension (e.g. `report.pdf`) |
| `base64_content` | string | Yes | Base64-encoded file content |
| `content_type` | string | No | MIME type (default: `application/octet-stream`) |

**Returns:** File ID, name, type, and size.

**Common MIME types:**
- `text/plain` — `.txt`, `.md`
- `text/markdown` — `.md`
- `application/pdf` — `.pdf`
- `text/csv` — `.csv`
- `application/json` — `.json`

---

### `openwebui_get_file_info`
Get file metadata (does not return file content).

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| `id` | string | Yes | File ID |

---

### `openwebui_delete_file`
Permanently delete an uploaded file.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| `id` | string | Yes | File ID |
| `confirm` | boolean | Yes | Must be `true` |

---

## Function Tools

### `openwebui_list_functions`
List all Pipe, Filter, and Action functions.

**Parameters:** None

**Returns:** Functions grouped by type with enable/disable status.

**Function types:**
- **Pipe** — Adds new model options to the model dropdown
- **Filter** — Transforms messages before/after sending to the model
- **Action** — Adds buttons to the chat toolbar

---

### `openwebui_get_function`
Get function details including full Python source code.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| `id` | string | Yes | Function ID (e.g. `my_summarizer_pipe`) |

---

### `openwebui_create_function`
Create a new Python function.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| `id` | string | Yes | Unique ID (lowercase, underscores) |
| `name` | string | Yes | Display name |
| `type` | string | Yes | `pipe`, `filter`, or `action` |
| `content` | string | Yes | Python source code |
| `description` | string | No | Description shown in UI |

**Note:** Functions are disabled by default after creation. Enable them in Open WebUI Settings → Functions.

---

### `openwebui_update_function`
Update a function's code or metadata.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| `id` | string | Yes | Function ID |
| `content` | string | No | New Python source code |
| `name` | string | No | New display name |
| `description` | string | No | New description |

**Note:** Reads current state first and preserves unspecified fields.

---

### `openwebui_delete_function`
Delete a function permanently.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| `id` | string | Yes | Function ID |
| `confirm` | boolean | Yes | Must be `true` |

---

## Model Tools

### `openwebui_list_models`
List all available models.

**Parameters:** None

**Returns:** Models grouped by source (Ollama, OpenAI, Pipe/Custom).

---

## Prompt Tools

### `openwebui_list_prompts`
List all saved prompts.

**Parameters:** None

**Returns:** Command, title, and content preview for each prompt.

---

### `openwebui_create_prompt`
Create a new saved prompt.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| `command` | string | Yes | Trigger (must start with `/`, e.g. `/summarize`) |
| `title` | string | Yes | Label shown in autocomplete |
| `content` | string | Yes | Prompt text (use `{{input}}` for user text) |

---

### `openwebui_update_prompt`
Update a prompt's title or content.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| `command` | string | Yes | Prompt command (e.g. `/summarize`) |
| `title` | string | No | New title |
| `content` | string | No | New content |

---

### `openwebui_delete_prompt`
Delete a saved prompt.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| `command` | string | Yes | Prompt command (e.g. `/summarize`) |
| `confirm` | boolean | Yes | Must be `true` |

---

## System Tools

### `openwebui_get_status`
Check system health, version, and configuration.

**Parameters:** None

**Returns:** Health status, version number, instance name, enabled features.

**Use case:** Verify connectivity to your Open WebUI instance.
