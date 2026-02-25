#!/usr/bin/env node
/**
 * openwebui-mcp-server
 *
 * MCP server for Claude Code and Claude Desktop to interact with Open WebUI.
 * Manages chats, RAG knowledge bases, files, functions, prompts, and more.
 *
 * Configuration (required env vars):
 *   OPENWEBUI_URL      Base URL of your Open WebUI instance (e.g. http://localhost:3000)
 *   OPENWEBUI_API_KEY  Bearer token from Open WebUI Settings → Account
 *
 * Optional:
 *   DEBUG=openwebui-mcp  Enable request/response logging to stderr
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

import OpenWebUIClient from './api-client.js';
import chatTools from './tools/chats.js';
import knowledgeTools from './tools/knowledge.js';
import fileTools from './tools/files.js';
import functionTools from './tools/functions.js';
import modelTools from './tools/models.js';
import promptTools from './tools/prompts.js';
import systemTools from './tools/system.js';

// ── Load package.json for version ────────────────────────────────────────────
const require = createRequire(import.meta.url);
const __dirname = dirname(fileURLToPath(import.meta.url));
const pkg = require(join(__dirname, '..', 'package.json'));

// ── Validate required environment variables ───────────────────────────────────
const { OPENWEBUI_URL, OPENWEBUI_API_KEY } = process.env;

if (!OPENWEBUI_URL || !OPENWEBUI_API_KEY) {
  process.stderr.write(
    [
      'openwebui-mcp-server: Missing required environment variables.',
      '',
      '  OPENWEBUI_URL      Your Open WebUI base URL (e.g. http://localhost:3000)',
      '  OPENWEBUI_API_KEY  Bearer token from Open WebUI Settings → Account',
      '',
      'Claude Code setup:',
      '  claude mcp add openwebui \\',
      '    -e OPENWEBUI_URL=http://localhost:3000 \\',
      '    -e OPENWEBUI_API_KEY=<your-key> \\',
      '    -- npx -y openwebui-mcp-server',
      '',
    ].join('\n')
  );
  process.exit(1);
}

// ── API client ────────────────────────────────────────────────────────────────
const client = new OpenWebUIClient(OPENWEBUI_URL, OPENWEBUI_API_KEY);

// ── Collect all tools ─────────────────────────────────────────────────────────

/**
 * @typedef {{ name: string, description: string, inputSchema: object, handler: Function }} ToolDefinition
 */

/** @type {ToolDefinition[]} */
const allTools = [
  ...chatTools,
  ...knowledgeTools,
  ...fileTools,
  ...functionTools,
  ...modelTools,
  ...promptTools,
  ...systemTools,
];

// Fast lookup map: tool name → definition
const toolMap = new Map(allTools.map((t) => [t.name, t]));

// ── MCP Server ────────────────────────────────────────────────────────────────
const server = new Server(
  { name: 'openwebui-mcp-server', version: pkg.version },
  { capabilities: { tools: {} } }
);

/**
 * List all registered tools.
 */
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: allTools.map(({ name, description, inputSchema }) => ({
    name,
    description,
    inputSchema,
  })),
}));

/**
 * Dispatch a tool call.
 * Returns isError: true on tool-level errors (API errors, validation failures).
 * Let protocol errors propagate naturally.
 */
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  const tool = toolMap.get(name);

  if (!tool) {
    return {
      content: [{ type: 'text', text: `Unknown tool: "${name}"` }],
      isError: true,
    };
  }

  try {
    const result = await tool.handler(client, args ?? {});
    const text = typeof result === 'string' ? result : JSON.stringify(result, null, 2);
    return { content: [{ type: 'text', text }] };
  } catch (err) {
    const message =
      err?.status
        ? `API Error ${err.status} [${err.endpoint}]: ${err.message}`
        : err?.message ?? String(err);
    return {
      content: [{ type: 'text', text: `Error: ${message}` }],
      isError: true,
    };
  }
});

// ── Connect via stdio ─────────────────────────────────────────────────────────
const transport = new StdioServerTransport();

process.on('SIGINT', async () => {
  await server.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await server.close();
  process.exit(0);
});

await server.connect(transport);
