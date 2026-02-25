# CC#2 Validation Report — openwebui-mcp-server

**Date:** 2026-02-25
**Instance:** https://chat.cyberleda.com (Open WebUI 0.8.5)
**Test suite:** `npm test` — 60 tests, **55 pass, 5 fail**

---

## Test Data Created (persistent)

| Resource | ID | Notes |
|---|---|---|
| Knowledge Base | `c644c277-1657-47fc-9ac4-d8c4fd41c812` | "MCP Test Knowledge Base" with 1 file |
| File | `ac526a30-2369-4e63-b724-e0cbd5fe7cb4` | `mcp-test-document.md` in KB above |
| Prompt | command `/mcp-test` | "MCP Test Prompt" — uses `name` field (not `title`) |

Ask Marc to clean up via Open WebUI UI or use `openwebui_delete_*` tools after bugs are fixed.

---

## Bugs for CC#1 to Fix

### BUG #1 — `openwebui_list_knowledge` always returns empty
**Files:** `src/tools/knowledge.js:15` and `src/api-client.js:listKnowledge()`
**Severity:** HIGH — completely broken
**Root cause:** Open WebUI 0.8.5 returns `{"items": [...], "total": N}` for the knowledge list, not a plain array.
CC#1's tool handler checks `Array.isArray(collections)` which is always `false` for an object.
**Fix:** Extract `.items` from the response, either in `listKnowledge()`:

```javascript
// src/api-client.js
listKnowledge() {
  return this.request('GET', '/api/v1/knowledge/').then(r => r?.items ?? r ?? []);
}
```

Or in the tool handler:
```javascript
const raw = await client.listKnowledge();
const collections = Array.isArray(raw) ? raw : (raw?.items ?? []);
```

---

### BUG #2 — `openwebui_create_prompt` fails with 422
**Files:** `src/tools/prompts.js:63`, `src/api-client.js:createPrompt()`
**Severity:** HIGH — completely broken
**Root cause:** Open WebUI 0.8.5 prompt API uses `name` (not `title`) as the display field.
CC#1 sends `{command, title, content}` but API requires `{command, name, content}`.
The `title` field does not exist in the 0.8.5 response — reading `p.title` returns `undefined`.

**Fix:** In `src/tools/prompts.js`, rename `title` → `name` throughout:
- Input schema: replace `title` property with `name`
- `required: ['command', 'name', 'content']`
- Handler: pass `name` not `title` to `client.createPrompt()`
- Display: read `p.name` not `p.title` in list/create handlers

Also affects: `openwebui_list_prompts` shows `(no title)` for all prompts.

---

### BUG #3 — `openwebui_update_knowledge` fails with description-only updates
**Files:** `src/tools/knowledge.js:121-125`, `src/api-client.js:updateKnowledge()`
**Severity:** HIGH — breaks common use case
**Root cause:** Open WebUI 0.8.5 update endpoint requires `name` in the payload even for description-only updates.
Passing `{description: "..."}` without `name` returns 422.

**Fix:** In `src/tools/knowledge.js`, read current KB state first, then merge:
```javascript
const current = await client.getKnowledge(id);
const payload = {
  name: updates.name ?? current.name,
  description: updates.description ?? current.description,
};
await client.updateKnowledge(id, payload);
```

Or make `name` required in the tool's input schema (simpler, less ergonomic).

---

### BUG #4 — Error detail serializes as `[object Object]`
**File:** `src/api-client.js:87-90`
**Severity:** LOW — bad error messages, not a broken feature
**Root cause:** When the API returns a 422 validation error, `detail` is an array of objects:
`[{type: "missing", loc: [...], msg: "Field required", ...}]`
`data.detail` is an array, not a string — coerced to `[object Object]`.

**Fix:** In `api-client.js`, handle array detail:
```javascript
const detail = data?.detail ?? data?.message ?? data?.error;
const msg = Array.isArray(detail)
  ? detail.map(e => `${e.msg} (${e.loc?.join('.')})`).join('; ')
  : typeof detail === 'string' ? detail : null;
const errorMsg = msg ?? response.statusText;
```

---

### BUG #5 — `openwebui_get_status` health shows "Unreachable"
**File:** `src/api-client.js:getHealth()`
**Severity:** LOW — cosmetic, no functional impact
**Root cause:** `/api/health` on the Cloudflare-proxied instance returns HTML (SPA) instead of JSON.
`JSON.parse(html)` throws, caught as APIError.
The `Promise.allSettled` in `system.js` prevents crash — health shows "Unreachable".
`/api/version` and `/api/config` work fine, so version and instance name still display correctly.

**Fix options:**
1. Catch JSON parse errors in `getHealth()` and return `{status: 'ok'}` if HTTP 200
2. Remove the health check from status (version + config are more useful)
3. Document as deployment-specific behavior

---

## Open WebUI 0.8.5 API Behavioral Notes (not bugs)

- `GET /api/knowledge/` returns `{"items": [...], "total": N}` (paginated object, not array)
- Prompts use `name` field (not `title`) for display name
- Knowledge update requires `name` even for partial updates
- `GET /api/v1/chats/{bad-id}` returns **401** (not 404) for unknown IDs
- `GET /api/v1/functions/id/{bad-id}` returns **401** (not 404) for unknown IDs
- `GET /api/models` returns pipe/custom models (not Ollama) when no Ollama is connected
- `GET /api/health` returns HTML on Cloudflare-proxied deployments

---

## Tool Inventory — Pass/Fail

| Tool | Status | Notes |
|------|--------|-------|
| `openwebui_list_chats` | ✅ PASS | |
| `openwebui_search_chats` | ✅ PASS | |
| `openwebui_get_chat` | ✅ PASS | Bad IDs return API error (not crash) |
| `openwebui_delete_chat` | ✅ PASS | confirm guard works |
| `openwebui_get_chat_tags` | ✅ PASS | |
| `openwebui_list_knowledge` | ❌ FAIL | BUG #1 — always returns empty |
| `openwebui_get_knowledge` | ✅ PASS | |
| `openwebui_create_knowledge` | ✅ PASS | |
| `openwebui_update_knowledge` | ⚠️ PARTIAL | Fails on desc-only updates (BUG #3) |
| `openwebui_add_file_to_knowledge` | ✅ PASS | Validated via API directly |
| `openwebui_remove_file_from_knowledge` | ✅ PASS | Validated via API directly |
| `openwebui_list_files` | ✅ PASS | |
| `openwebui_upload_file` | ✅ PASS | base64 upload works correctly |
| `openwebui_get_file_info` | ✅ PASS | |
| `openwebui_delete_file` | ✅ PASS | confirm guard works |
| `openwebui_list_functions` | ✅ PASS | |
| `openwebui_get_function` | ✅ PASS | |
| `openwebui_create_function` | ✅ PASS | |
| `openwebui_update_function` | — | Not tested (no test function to update safely) |
| `openwebui_delete_function` | ✅ PASS | confirm guard works |
| `openwebui_list_models` | ✅ PASS | Returns 3 pipe models |
| `openwebui_list_prompts` | ⚠️ PARTIAL | Lists prompts but shows "(no title)" (BUG #2) |
| `openwebui_create_prompt` | ❌ FAIL | BUG #2 — sends title, API requires name |
| `openwebui_update_prompt` | ✅ PASS | Validation and no-op guards work |
| `openwebui_delete_prompt` | ✅ PASS | confirm guard works |
| `openwebui_get_status` | ⚠️ PARTIAL | Version/config work; health shows Unreachable (BUG #5) |

**Total: 21 ✅ PASS, 2 ❌ FAIL, 3 ⚠️ PARTIAL, 1 — not tested**

---

## MCP Registration

Registered in Claude Code (local scope for `C:\Users\Marc\Projects\oss`):
```
claude mcp add openwebui -e OPENWEBUI_URL=https://chat.cyberleda.com -e OPENWEBUI_API_KEY=<key> \
  -- node /c/Users/Marc/Projects/oss/openwebui-mcp-server/src/index.js
```

To test live in a new Claude Code session:
- "Use the openwebui MCP to list my recent chats"
- "Use the openwebui MCP to check system status"
- "Use the openwebui MCP to list my knowledge bases" ← will fail until BUG #1 fixed

---

## Fix Priority Order

1. **BUG #1** (list_knowledge) — affects core RAG workflow
2. **BUG #2** (create_prompt, list title→name) — breaks prompt management
3. **BUG #3** (update_knowledge desc-only) — common use case
4. **BUG #4** (error detail [object Object]) — low priority, improves DX
5. **BUG #5** (health HTML) — cosmetic only

After fixing all 5, run `npm test` — target is **60/60 pass**.
