import { requireParam, requireConfirm } from '../utils/validators.js';

/** @type {import('../index.js').ToolDefinition[]} */
export default [
  {
    name: 'openwebui_list_knowledge',
    description:
      'List all RAG knowledge base collections in Open WebUI. Returns collection names, IDs, descriptions, and file counts.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
    handler: async (client, _args) => {
      const collections = await client.listKnowledge();
      if (!Array.isArray(collections) || collections.length === 0) {
        return 'No knowledge base collections found.';
      }
      const lines = collections.map((k) => {
        const fileCount = k.files?.length ?? k.data?.file_ids?.length ?? 0;
        return `• [${k.id}] ${k.name} — ${k.description || 'no description'} (${fileCount} file(s))`;
      });
      return `Found ${collections.length} knowledge base(s):\n\n${lines.join('\n')}`;
    },
  },

  {
    name: 'openwebui_get_knowledge',
    description:
      'Get details of a specific knowledge base including its name, description, and the list of files it contains.',
    inputSchema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          description: 'Knowledge base ID',
        },
      },
      required: ['id'],
    },
    handler: async (client, args) => {
      const id = String(requireParam(args, 'id'));
      const kb = await client.getKnowledge(id);
      if (!kb) return `Knowledge base ${id} not found.`;

      const files = kb.files ?? kb.data?.file_ids ?? [];
      const fileLines =
        Array.isArray(files) && files.length > 0
          ? files.map((f) => `  • ${f.meta?.name ?? f.id ?? f}`)
          : ['  (no files)'];

      return [
        `Knowledge Base: ${kb.name}`,
        `ID: ${kb.id}`,
        `Description: ${kb.description || '(none)'}`,
        `Files (${files.length}):`,
        ...fileLines,
      ].join('\n');
    },
  },

  {
    name: 'openwebui_create_knowledge',
    description:
      'Create a new RAG knowledge base collection. After creating, use openwebui_upload_file and openwebui_add_file_to_knowledge to populate it.',
    inputSchema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Name for the knowledge base',
        },
        description: {
          type: 'string',
          description: 'Optional description of what this knowledge base contains',
        },
      },
      required: ['name'],
    },
    handler: async (client, args) => {
      const name = String(requireParam(args, 'name'));
      const description = args?.description ? String(args.description) : '';
      const kb = await client.createKnowledge({ name, description });
      return [
        `Knowledge base created successfully.`,
        `ID: ${kb.id}`,
        `Name: ${kb.name}`,
        `Description: ${kb.description || '(none)'}`,
        '',
        `Next steps:`,
        `1. Upload a file with openwebui_upload_file`,
        `2. Add it to this collection with openwebui_add_file_to_knowledge (knowledge_id: "${kb.id}")`,
      ].join('\n');
    },
  },

  {
    name: 'openwebui_update_knowledge',
    description:
      'Update a knowledge base name or description. Does not affect files already in the collection.',
    inputSchema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          description: 'Knowledge base ID to update',
        },
        name: {
          type: 'string',
          description: 'New name (optional)',
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
      const updates = {};
      if (args?.name) updates.name = String(args.name);
      if (args?.description !== undefined) updates.description = String(args.description);
      if (Object.keys(updates).length === 0) {
        return 'No updates provided. Pass name and/or description to update.';
      }
      // API requires name in every update payload — read current state first
      const current = await client.getKnowledge(id);
      const payload = {
        name: updates.name ?? current.name,
        description: updates.description ?? current.description,
      };
      const kb = await client.updateKnowledge(id, payload);
      return `Knowledge base updated.\nID: ${kb.id}\nName: ${kb.name}\nDescription: ${kb.description || '(none)'}`;
    },
  },

  {
    name: 'openwebui_add_file_to_knowledge',
    description:
      'Add an uploaded file to a knowledge base for RAG retrieval. The file must already be uploaded via openwebui_upload_file. Get the file ID from the upload response.',
    inputSchema: {
      type: 'object',
      properties: {
        knowledge_id: {
          type: 'string',
          description: 'Knowledge base ID',
        },
        file_id: {
          type: 'string',
          description: 'File ID (from openwebui_upload_file response)',
        },
      },
      required: ['knowledge_id', 'file_id'],
    },
    handler: async (client, args) => {
      const knowledgeId = String(requireParam(args, 'knowledge_id'));
      const fileId = String(requireParam(args, 'file_id'));
      await client.addFileToKnowledge(knowledgeId, fileId);
      return `File ${fileId} added to knowledge base ${knowledgeId}.\nThe file is now available for RAG retrieval in chats that use this collection.`;
    },
  },

  {
    name: 'openwebui_remove_file_from_knowledge',
    description:
      'Remove a file from a knowledge base. The file itself is not deleted — only removed from this collection. Use openwebui_delete_file to delete the file entirely.',
    inputSchema: {
      type: 'object',
      properties: {
        knowledge_id: {
          type: 'string',
          description: 'Knowledge base ID',
        },
        file_id: {
          type: 'string',
          description: 'File ID to remove from this collection',
        },
      },
      required: ['knowledge_id', 'file_id'],
    },
    handler: async (client, args) => {
      const knowledgeId = String(requireParam(args, 'knowledge_id'));
      const fileId = String(requireParam(args, 'file_id'));
      await client.removeFileFromKnowledge(knowledgeId, fileId);
      return `File ${fileId} removed from knowledge base ${knowledgeId}.\nNote: The file still exists in Open WebUI. Use openwebui_delete_file to delete it completely.`;
    },
  },
];
