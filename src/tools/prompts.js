import { requireParam, requireConfirm } from '../utils/validators.js';

/**
 * Ensure command starts with "/".
 * @param {string} command
 */
function normalizeCommand(command) {
  return command.startsWith('/') ? command : `/${command}`;
}

/** @type {import('../index.js').ToolDefinition[]} */
export default [
  {
    name: 'openwebui_list_prompts',
    description:
      'List all saved prompts in Open WebUI. Prompts are reusable message templates triggered by commands like "/summarize". Returns command, title, and a content preview.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
    handler: async (client, _args) => {
      const prompts = await client.listPrompts();
      if (!Array.isArray(prompts) || prompts.length === 0) {
        return 'No saved prompts found.';
      }
      const lines = prompts.map((p) => {
        const preview = (p.content ?? '').slice(0, 80);
        return `• ${p.command} — ${p.name ?? '(no name)'}\n  "${preview}${preview.length < (p.content ?? '').length ? '…' : ''}"`;
      });
      return `Found ${prompts.length} prompt(s):\n\n${lines.join('\n\n')}`;
    },
  },

  {
    name: 'openwebui_create_prompt',
    description:
      'Create a new saved prompt in Open WebUI. Prompts are invoked by typing their command in any chat. Command must start with "/" (e.g. "/summarize").',
    inputSchema: {
      type: 'object',
      properties: {
        command: {
          type: 'string',
          description:
            'Trigger command (must start with "/", e.g. "/summarize", "/translate")',
        },
        name: {
          type: 'string',
          description: 'Human-readable name shown in autocomplete suggestions',
        },
        content: {
          type: 'string',
          description:
            'The prompt text. Use {{input}} as a placeholder for user-provided text.',
        },
      },
      required: ['command', 'name', 'content'],
    },
    handler: async (client, args) => {
      const command = normalizeCommand(String(requireParam(args, 'command')));
      const name = String(requireParam(args, 'name'));
      const content = String(requireParam(args, 'content'));

      const prompt = await client.createPrompt({ command, name, content });
      return [
        `Prompt created successfully.`,
        `Command: ${prompt.command}`,
        `Name: ${prompt.name}`,
        '',
        `Type "${prompt.command}" in any Open WebUI chat to use this prompt.`,
      ].join('\n');
    },
  },

  {
    name: 'openwebui_update_prompt',
    description:
      'Update an existing saved prompt\'s name or content. The command (trigger) cannot be changed — delete and recreate instead.',
    inputSchema: {
      type: 'object',
      properties: {
        command: {
          type: 'string',
          description: 'The prompt\'s command (e.g. "/summarize")',
        },
        name: {
          type: 'string',
          description: 'New name (optional)',
        },
        content: {
          type: 'string',
          description: 'New prompt content (optional)',
        },
      },
      required: ['command'],
    },
    handler: async (client, args) => {
      const command = normalizeCommand(String(requireParam(args, 'command')));

      if (!args?.name && !args?.content) {
        return 'No updates provided. Pass name and/or content to update.';
      }

      // Read current state to preserve fields not being updated
      const current = await client.getPrompt(command);
      if (!current) throw new Error(`Prompt "${command}" not found.`);

      const updates = {
        name: args?.name ? String(args.name) : current.name,
        content: args?.content ? String(args.content) : current.content,
      };

      const prompt = await client.updatePrompt(command, updates);
      return `Prompt "${prompt.command}" updated successfully.`;
    },
  },

  {
    name: 'openwebui_delete_prompt',
    description:
      'Delete a saved prompt by its command. Requires confirm: true.',
    inputSchema: {
      type: 'object',
      properties: {
        command: {
          type: 'string',
          description: 'Prompt command to delete (e.g. "/summarize")',
        },
        confirm: {
          type: 'boolean',
          description: 'Must be true to confirm deletion',
        },
      },
      required: ['command', 'confirm'],
    },
    handler: async (client, args) => {
      const command = normalizeCommand(String(requireParam(args, 'command')));
      requireConfirm(args, 'openwebui_delete_prompt');
      await client.deletePrompt(command);
      return `Prompt "${command}" deleted.`;
    },
  },
];
