# Open WebUI API Surface

> **Note:** This document was compiled from knowledge of Open WebUI 0.8.x (FastAPI-generated OpenAPI spec).
> All endpoints should be verified against your live instance at `/openapi.json` once API key is available.
> Auth required: `Authorization: Bearer <api-key>` on all endpoints.

## Authentication

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v1/auths/signin` | Sign in with email/password |
| POST | `/api/v1/auths/signup` | Register new user |
| GET | `/api/v1/auths/` | Get current user info |
| GET | `/api/v1/auths/api_key` | Get current API key |
| POST | `/api/v1/auths/api_key` | Create/regenerate API key |
| DELETE | `/api/v1/auths/api_key` | Delete API key |

## Chats

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/chats/` | List chats (paginated via `?page=N`) |
| GET | `/api/v1/chats/search` | Search chats (`?text=query`) |
| GET | `/api/v1/chats/all/tags` | List all tags across chats |
| GET | `/api/v1/chats/{id}` | Get chat with full message history |
| DELETE | `/api/v1/chats/{id}` | Delete a chat |
| POST | `/api/v1/chats/{id}` | Update chat |
| DELETE | `/api/v1/chats/` | Delete ALL chats (admin) |
| POST | `/api/v1/chats/{id}/share` | Share a chat |
| GET | `/api/v1/chats/share/{share_id}` | Get shared chat |

## Knowledge Bases

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/knowledge/` | List all knowledge bases |
| POST | `/api/v1/knowledge/create` | Create knowledge base (`{name, description}`) |
| GET | `/api/v1/knowledge/{id}` | Get knowledge base with file list |
| POST | `/api/v1/knowledge/{id}/update` | Update name/description |
| DELETE | `/api/v1/knowledge/{id}/delete` | Delete knowledge base |
| POST | `/api/v1/knowledge/{id}/file/add` | Add file (`{file_id}`) |
| POST | `/api/v1/knowledge/{id}/file/update` | Update file in collection |
| POST | `/api/v1/knowledge/{id}/file/remove` | Remove file (`{file_id}`) |
| POST | `/api/v1/knowledge/{id}/reset` | Reset knowledge base (clear all files) |

## Files

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/files/` | List all files |
| POST | `/api/v1/files/` | Upload file (multipart/form-data, field: `file`) |
| GET | `/api/v1/files/{id}` | Get file metadata |
| DELETE | `/api/v1/files/{id}` | Delete file |
| GET | `/api/v1/files/{id}/data/content` | Get file content |

## Functions (Pipes, Filters, Actions)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/functions/` | List all functions |
| POST | `/api/v1/functions/create` | Create function (`{id, name, type, content, meta}`) |
| GET | `/api/v1/functions/id/{id}` | Get function by ID |
| POST | `/api/v1/functions/id/{id}/update` | Update function |
| DELETE | `/api/v1/functions/id/{id}/delete` | Delete function |
| POST | `/api/v1/functions/id/{id}/toggle` | Enable/disable function |
| POST | `/api/v1/functions/id/{id}/toggle/global` | Toggle global status |

## Models

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/models` | List all models (Ollama + OpenAI + pipes), OpenAI format |
| GET | `/api/v1/models/` | List models (v1 format) |
| POST | `/api/v1/models/create` | Create custom model |
| GET | `/api/v1/models/{id}` | Get model |
| POST | `/api/v1/models/update` | Update model |
| DELETE | `/api/v1/models/delete` | Delete model |

## Prompts

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/prompts/` | List all prompts |
| POST | `/api/v1/prompts/create` | Create prompt (`{command, title, content}`) |
| GET | `/api/v1/prompts/command/{command}` | Get prompt by command |
| POST | `/api/v1/prompts/command/{command}/update` | Update prompt |
| DELETE | `/api/v1/prompts/command/{command}/delete` | Delete prompt |

## System / Config

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Liveness check (returns `{"status":"ok"}`) |
| GET | `/api/version` | App version (`{"version":"0.8.5"}`) |
| GET | `/api/config` | Public app configuration |
| GET | `/api/webhook` | Get webhook URL |
| GET | `/api/v1/configs/` | Get all configs (admin) |
| POST | `/api/v1/configs/export` | Export config |
| POST | `/api/v1/configs/import` | Import config |

## Users (Admin)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/users/` | List all users |
| GET | `/api/v1/users/{id}` | Get user |
| POST | `/api/v1/users/update/role` | Change user role |
| DELETE | `/api/v1/users/{id}` | Delete user |

## Notes on Response Shapes

### Chat response
```json
{
  "id": "uuid",
  "title": "string",
  "updated_at": 1708000000,
  "created_at": 1708000000,
  "chat": {
    "messages": [
      { "role": "user", "content": "string" },
      { "role": "assistant", "content": "string" }
    ]
  }
}
```

### Knowledge base response
```json
{
  "id": "uuid",
  "name": "string",
  "description": "string",
  "data": { "file_ids": ["uuid", "uuid"] },
  "files": [{ "id": "uuid", "meta": { "name": "file.pdf" } }]
}
```

### File upload response
```json
{
  "id": "uuid",
  "filename": "string",
  "meta": { "name": "file.pdf", "content_type": "application/pdf", "size": 12345 },
  "created_at": 1708000000
}
```

### Function response
```json
{
  "id": "my_function",
  "name": "My Function",
  "type": "pipe",
  "content": "# Python code...",
  "is_active": false,
  "is_global": false,
  "meta": { "description": "..." }
}
```

### Models response (`/api/models`)
```json
{
  "data": [
    { "id": "llama3.2:latest", "name": "Llama 3.2", "owned_by": "ollama" },
    { "id": "gpt-4o", "name": "GPT-4o", "owned_by": "openai" }
  ]
}
```
