/**
 * Open WebUI REST API client.
 *
 * - Uses native fetch (Node 18+)
 * - 30 second timeout per request
 * - 1 retry on 5xx errors
 * - Structured errors via APIError
 * - Debug logging when DEBUG=openwebui-mcp
 */

import { APIError } from './utils/errors.js';

const DEBUG = process.env.DEBUG === 'openwebui-mcp';

function log(...args) {
  if (DEBUG) process.stderr.write('[openwebui-mcp] ' + args.join(' ') + '\n');
}

export default class OpenWebUIClient {
  /**
   * @param {string} baseUrl  e.g. https://chat.example.com
   * @param {string} apiKey   Bearer token from Open WebUI Settings → Account
   */
  constructor(baseUrl, apiKey) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.apiKey = apiKey;
  }

  /**
   * Core HTTP request helper.
   * @param {'GET'|'POST'|'DELETE'|'PUT'|'PATCH'} method
   * @param {string} path  API path starting with /
   * @param {object} [options]
   * @param {unknown} [options.body]          JSON body (object/array)
   * @param {FormData} [options.formData]     Multipart form data (file uploads)
   * @param {Record<string, string>} [options.query]  Query string params
   * @returns {Promise<unknown>}
   */
  async request(method, path, { body, formData, query } = {}) {
    let url = `${this.baseUrl}${path}`;
    if (query) {
      const params = new URLSearchParams(
        Object.fromEntries(Object.entries(query).filter(([, v]) => v != null))
      );
      if (params.toString()) url += `?${params}`;
    }

    const headers = { Authorization: `Bearer ${this.apiKey}` };
    let requestBody;

    if (formData) {
      // Let fetch set Content-Type with boundary for multipart
      requestBody = formData;
    } else if (body !== undefined) {
      headers['Content-Type'] = 'application/json';
      requestBody = JSON.stringify(body);
    }

    log(method, url);

    for (let attempt = 0; attempt <= 1; attempt++) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30_000);

      try {
        const response = await fetch(url, {
          method,
          headers,
          body: requestBody,
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        log(`  → ${response.status}`);

        if (response.status === 204) return null;

        const text = await response.text();
        const data = text ? JSON.parse(text) : null;

        if (!response.ok) {
          // Retry once on server errors
          if (response.status >= 500 && attempt === 0) {
            log('  Server error, retrying...');
            continue;
          }
          const msg =
            (typeof data === 'object' && data !== null
              ? data.detail ?? data.message ?? data.error
              : null) ?? response.statusText;
          throw new APIError(response.status, path, String(msg));
        }

        return data;
      } catch (err) {
        clearTimeout(timeoutId);
        if (err.name === 'AbortError') {
          throw new APIError(408, path, 'Request timed out after 30 seconds');
        }
        if (err instanceof APIError) throw err;
        throw new APIError(0, path, err.message);
      }
    }
  }

  // ──────────────────────────────────────────────────────────────
  // Chats
  // ──────────────────────────────────────────────────────────────

  /** List chats, paginated (page starts at 1). */
  listChats(page = 1) {
    return this.request('GET', '/api/v1/chats/', { query: { page: String(page) } });
  }

  /** Search chats by keyword. */
  searchChats(text) {
    return this.request('GET', '/api/v1/chats/search', { query: { text } });
  }

  /** Get full chat including all messages. */
  getChat(id) {
    return this.request('GET', `/api/v1/chats/${id}`);
  }

  /** Delete a single chat. */
  deleteChat(id) {
    return this.request('DELETE', `/api/v1/chats/${id}`);
  }

  /** List all tags used across chats. */
  getChatTags() {
    return this.request('GET', '/api/v1/chats/all/tags');
  }

  // ──────────────────────────────────────────────────────────────
  // Knowledge Bases
  // ──────────────────────────────────────────────────────────────

  /** List all knowledge base collections. */
  listKnowledge() {
    return this.request('GET', '/api/v1/knowledge/');
  }

  /** Get a knowledge base by ID including its file list. */
  getKnowledge(id) {
    return this.request('GET', `/api/v1/knowledge/${id}`);
  }

  /** Create a new knowledge base. */
  createKnowledge({ name, description = '' }) {
    return this.request('POST', '/api/v1/knowledge/create', {
      body: { name, description },
    });
  }

  /** Update a knowledge base name or description. */
  updateKnowledge(id, { name, description }) {
    return this.request('POST', `/api/v1/knowledge/${id}/update`, {
      body: { name, description },
    });
  }

  /** Delete a knowledge base. */
  deleteKnowledge(id) {
    return this.request('DELETE', `/api/v1/knowledge/${id}/delete`);
  }

  /** Add an uploaded file to a knowledge base for RAG. */
  addFileToKnowledge(knowledgeId, fileId) {
    return this.request('POST', `/api/v1/knowledge/${knowledgeId}/file/add`, {
      body: { file_id: fileId },
    });
  }

  /** Remove a file from a knowledge base. */
  removeFileFromKnowledge(knowledgeId, fileId) {
    return this.request('POST', `/api/v1/knowledge/${knowledgeId}/file/remove`, {
      body: { file_id: fileId },
    });
  }

  // ──────────────────────────────────────────────────────────────
  // Files
  // ──────────────────────────────────────────────────────────────

  /** List all uploaded files. */
  listFiles() {
    return this.request('GET', '/api/v1/files/');
  }

  /**
   * Upload a file.
   * @param {string} filename
   * @param {string} base64Content  Base64-encoded file content
   * @param {string} contentType    MIME type (default: application/octet-stream)
   */
  uploadFile(filename, base64Content, contentType = 'application/octet-stream') {
    const buffer = Buffer.from(base64Content, 'base64');
    const blob = new Blob([buffer], { type: contentType });
    const formData = new FormData();
    formData.append('file', blob, filename);
    return this.request('POST', '/api/v1/files/', { formData });
  }

  /** Get file metadata by ID. */
  getFile(id) {
    return this.request('GET', `/api/v1/files/${id}`);
  }

  /** Delete a file by ID. */
  deleteFile(id) {
    return this.request('DELETE', `/api/v1/files/${id}`);
  }

  // ──────────────────────────────────────────────────────────────
  // Functions (Pipes, Filters, Actions)
  // ──────────────────────────────────────────────────────────────

  /** List all functions. */
  listFunctions() {
    return this.request('GET', '/api/v1/functions/');
  }

  /** Get a function by ID including its source code. */
  getFunction(id) {
    return this.request('GET', `/api/v1/functions/id/${id}`);
  }

  /**
   * Create a function.
   * @param {{ id: string, name: string, type: 'pipe'|'filter'|'action', content: string, meta?: object }} data
   */
  createFunction(data) {
    return this.request('POST', '/api/v1/functions/create', { body: data });
  }

  /** Update a function's code or metadata. */
  updateFunction(id, data) {
    return this.request('POST', `/api/v1/functions/id/${id}/update`, { body: data });
  }

  /** Delete a function by ID. */
  deleteFunction(id) {
    return this.request('DELETE', `/api/v1/functions/id/${id}/delete`);
  }

  // ──────────────────────────────────────────────────────────────
  // Models
  // ──────────────────────────────────────────────────────────────

  /** List all available models (Ollama + OpenAI + custom pipes). */
  listModels() {
    return this.request('GET', '/api/models');
  }

  // ──────────────────────────────────────────────────────────────
  // Prompts
  // ──────────────────────────────────────────────────────────────

  /** List all saved prompts. */
  listPrompts() {
    return this.request('GET', '/api/v1/prompts/');
  }

  /**
   * Create a new saved prompt.
   * @param {{ command: string, title: string, content: string }} data
   *   command must start with "/" e.g. "/summarize"
   */
  createPrompt(data) {
    return this.request('POST', '/api/v1/prompts/create', { body: data });
  }

  /**
   * Get a prompt by its command string.
   * @param {string} command  e.g. "/summarize"
   */
  getPrompt(command) {
    return this.request('GET', `/api/v1/prompts/command/${encodeURIComponent(command)}`);
  }

  /**
   * Update a prompt.
   * @param {string} command  e.g. "/summarize"
   * @param {{ title?: string, content?: string }} data
   */
  updatePrompt(command, data) {
    return this.request(
      'POST',
      `/api/v1/prompts/command/${encodeURIComponent(command)}/update`,
      { body: data }
    );
  }

  /**
   * Delete a prompt by command.
   * @param {string} command  e.g. "/summarize"
   */
  deletePrompt(command) {
    return this.request(
      'DELETE',
      `/api/v1/prompts/command/${encodeURIComponent(command)}/delete`
    );
  }

  // ──────────────────────────────────────────────────────────────
  // System
  // ──────────────────────────────────────────────────────────────

  /** GET /api/health — liveness check. */
  getHealth() {
    return this.request('GET', '/api/health');
  }

  /** GET /api/version — app version string. */
  getVersion() {
    return this.request('GET', '/api/version');
  }

  /** GET /api/config — public app configuration. */
  getConfig() {
    return this.request('GET', '/api/config');
  }
}
