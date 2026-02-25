import { requireParam, requireConfirm, toPage } from '../utils/validators.js';

/** @type {import('../index.js').ToolDefinition[]} */
export default [
  {
    name: 'openwebui_list_chats',
    description:
      'List recent chat conversations in Open WebUI. Returns up to 50 chats per page with title, ID, and last update time. Use page parameter to paginate.',
    inputSchema: {
      type: 'object',
      properties: {
        page: {
          type: 'number',
          description: 'Page number for pagination (starts at 1, default: 1)',
          default: 1,
        },
      },
    },
    handler: async (client, args) => {
      const page = toPage(args?.page, 1);
      const chats = await client.listChats(page);
      if (!Array.isArray(chats) || chats.length === 0) {
        return `No chats found on page ${page}.`;
      }
      const lines = chats.map(
        (c) =>
          `• [${c.id}] ${c.title || '(untitled)'} — updated ${c.updated_at ? new Date(c.updated_at * 1000).toISOString() : 'unknown'}`
      );
      return `Found ${chats.length} chat(s) on page ${page}:\n\n${lines.join('\n')}`;
    },
  },

  {
    name: 'openwebui_search_chats',
    description:
      'Search chat history by keyword. Searches through chat titles and message content. Returns matching conversations with IDs.',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search keyword or phrase',
        },
      },
      required: ['query'],
    },
    handler: async (client, args) => {
      const query = String(requireParam(args, 'query'));
      const chats = await client.searchChats(query);
      if (!Array.isArray(chats) || chats.length === 0) {
        return `No chats found matching "${query}".`;
      }
      const lines = chats.map(
        (c) => `• [${c.id}] ${c.title || '(untitled)'}`
      );
      return `Found ${chats.length} chat(s) matching "${query}":\n\n${lines.join('\n')}`;
    },
  },

  {
    name: 'openwebui_get_chat',
    description:
      'Get full details of a specific chat by ID, including all messages in the conversation. Use openwebui_list_chats or openwebui_search_chats to find chat IDs.',
    inputSchema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          description: 'Chat ID (UUID)',
        },
      },
      required: ['id'],
    },
    handler: async (client, args) => {
      const id = String(requireParam(args, 'id'));
      const chat = await client.getChat(id);
      if (!chat) return `Chat ${id} not found.`;

      const title = chat.title || '(untitled)';
      const messages = chat.messages ?? chat.chat?.messages ?? [];
      const msgLines = messages.map((m) => {
        const role = m.role === 'user' ? 'User' : 'Assistant';
        const content =
          typeof m.content === 'string'
            ? m.content
            : Array.isArray(m.content)
            ? m.content.map((c) => c.text ?? '').join('')
            : JSON.stringify(m.content);
        return `[${role}]: ${content.slice(0, 500)}${content.length > 500 ? '…' : ''}`;
      });

      return [
        `Chat: ${title}`,
        `ID: ${id}`,
        `Messages: ${messages.length}`,
        '',
        ...msgLines,
      ].join('\n');
    },
  },

  {
    name: 'openwebui_delete_chat',
    description:
      'Delete a specific chat by ID. This is irreversible. Requires confirm: true.',
    inputSchema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          description: 'Chat ID to delete',
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
      requireConfirm(args, 'openwebui_delete_chat');
      await client.deleteChat(id);
      return `Chat ${id} deleted successfully.`;
    },
  },

  {
    name: 'openwebui_get_chat_tags',
    description:
      'List all tags used across chats in Open WebUI. Useful for understanding how conversations are organized.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
    handler: async (client, _args) => {
      const tags = await client.getChatTags();
      if (!Array.isArray(tags) || tags.length === 0) {
        return 'No chat tags found.';
      }
      return `Chat tags (${tags.length}):\n\n${tags.map((t) => `• ${t.name ?? t}`).join('\n')}`;
    },
  },
];
