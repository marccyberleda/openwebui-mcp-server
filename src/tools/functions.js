import { requireParam, requireConfirm } from '../utils/validators.js';

const VALID_TYPES = ['pipe', 'filter', 'action'];

/** @type {import('../index.js').ToolDefinition[]} */
export default [
  {
    name: 'openwebui_list_functions',
    description:
      'List all Pipe, Filter, and Action functions installed in Open WebUI. Returns function IDs, names, types, and enable/disable status.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
    handler: async (client, _args) => {
      const functions = await client.listFunctions();
      if (!Array.isArray(functions) || functions.length === 0) {
        return 'No functions found.';
      }
      const byType = { pipe: [], filter: [], action: [], other: [] };
      for (const f of functions) {
        const type = f.type ?? 'other';
        (byType[type] ?? byType.other).push(f);
      }
      const lines = [];
      for (const [type, items] of Object.entries(byType)) {
        if (items.length === 0) continue;
        lines.push(`\n${type.toUpperCase()}S (${items.length}):`);
        for (const f of items) {
          const status = f.is_active ? '✓ enabled' : '○ disabled';
          const global = f.is_global ? ' [global]' : '';
          lines.push(`  • [${f.id}] ${f.name} — ${status}${global}`);
        }
      }
      return `Found ${functions.length} function(s):${lines.join('\n')}`;
    },
  },

  {
    name: 'openwebui_get_function',
    description:
      'Get full details of a specific function including its Python source code and configuration.',
    inputSchema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          description: 'Function ID (e.g. "my_pipe_function")',
        },
      },
      required: ['id'],
    },
    handler: async (client, args) => {
      const id = String(requireParam(args, 'id'));
      const fn = await client.getFunction(id);
      if (!fn) return `Function "${id}" not found.`;

      return [
        `Function: ${fn.name}`,
        `ID: ${fn.id}`,
        `Type: ${fn.type ?? 'unknown'}`,
        `Status: ${fn.is_active ? 'enabled' : 'disabled'}${fn.is_global ? ' (global)' : ''}`,
        `Description: ${fn.meta?.description ?? '(none)'}`,
        '',
        `Source Code:`,
        '```python',
        fn.content ?? '# (no content)',
        '```',
      ].join('\n');
    },
  },

  {
    name: 'openwebui_create_function',
    description:
      'Create a new Pipe, Filter, or Action function in Open WebUI. Pipes add new model options. Filters transform messages. Actions add chat toolbar buttons. Provide valid Python code.',
    inputSchema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          description:
            'Unique function ID (lowercase, underscores only, e.g. "my_summarizer_pipe")',
        },
        name: {
          type: 'string',
          description: 'Human-readable display name',
        },
        type: {
          type: 'string',
          enum: ['pipe', 'filter', 'action'],
          description:
            '"pipe" — adds a new model option; "filter" — transforms messages; "action" — adds chat button',
        },
        content: {
          type: 'string',
          description: 'Python source code for the function',
        },
        description: {
          type: 'string',
          description: 'Optional description shown in the UI',
        },
      },
      required: ['id', 'name', 'type', 'content'],
    },
    handler: async (client, args) => {
      const id = String(requireParam(args, 'id'));
      const name = String(requireParam(args, 'name'));
      const type = String(requireParam(args, 'type'));
      const content = String(requireParam(args, 'content'));

      if (!VALID_TYPES.includes(type)) {
        throw new Error(`Invalid type "${type}". Must be one of: ${VALID_TYPES.join(', ')}`);
      }

      const fn = await client.createFunction({
        id,
        name,
        type,
        content,
        meta: { description: args?.description ?? '' },
      });

      return [
        `Function created successfully.`,
        `ID: ${fn.id}`,
        `Name: ${fn.name}`,
        `Type: ${fn.type}`,
        '',
        `The function is installed but disabled by default. Enable it in Open WebUI Settings → Functions.`,
      ].join('\n');
    },
  },

  {
    name: 'openwebui_update_function',
    description:
      'Update an existing function\'s source code, name, or description. Pass only the fields you want to change.',
    inputSchema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          description: 'Function ID to update',
        },
        content: {
          type: 'string',
          description: 'New Python source code (optional)',
        },
        name: {
          type: 'string',
          description: 'New display name (optional)',
        },
        description: {
          type: 'string',
          description: 'New description (optional)',
        },
      },
      required: ['id'],
    },
    handler: async (client, args) => {
      const id = String(requireParam(args, 'id'));

      // Read current state to preserve fields not being updated
      const current = await client.getFunction(id);
      if (!current) throw new Error(`Function "${id}" not found.`);

      const updates = {
        name: args?.name ? String(args.name) : current.name,
        content: args?.content ? String(args.content) : current.content,
        meta: {
          ...current.meta,
          description:
            args?.description !== undefined
              ? String(args.description)
              : current.meta?.description,
        },
      };

      const fn = await client.updateFunction(id, updates);
      return `Function "${fn.id}" updated successfully.\nName: ${fn.name}`;
    },
  },

  {
    name: 'openwebui_delete_function',
    description:
      'Delete a function from Open WebUI. This removes the function permanently. Requires confirm: true.',
    inputSchema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          description: 'Function ID to delete',
        },
        confirm: {
          type: 'boolean',
          description: 'Must be true to confirm deletion',
        },
      },
      required: ['id', 'confirm'],
    },
    handler: async (client, args) => {
      const id = String(requireParam(args, 'id'));
      requireConfirm(args, 'openwebui_delete_function');
      await client.deleteFunction(id);
      return `Function "${id}" deleted permanently.`;
    },
  },
];
