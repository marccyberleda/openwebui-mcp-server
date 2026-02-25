import { requireParam, requireConfirm } from '../utils/validators.js';

/** @type {import('../index.js').ToolDefinition[]} */
export default [
  {
    name: 'openwebui_list_files',
    description:
      'List all files uploaded to Open WebUI. Returns file names, IDs, sizes, and content types. Use file IDs with openwebui_add_file_to_knowledge.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
    handler: async (client, _args) => {
      const files = await client.listFiles();
      if (!Array.isArray(files) || files.length === 0) {
        return 'No files found.';
      }
      const lines = files.map((f) => {
        const size = f.meta?.size
          ? `${(f.meta.size / 1024).toFixed(1)} KB`
          : 'unknown size';
        return `• [${f.id}] ${f.meta?.name ?? f.filename ?? 'unnamed'} — ${f.meta?.content_type ?? 'unknown type'}, ${size}`;
      });
      return `Found ${files.length} file(s):\n\n${lines.join('\n')}`;
    },
  },

  {
    name: 'openwebui_upload_file',
    description:
      'Upload a file to Open WebUI. Accepts base64-encoded content (required for MCP stdio transport). After uploading, use the returned file ID with openwebui_add_file_to_knowledge to add it to a RAG collection.',
    inputSchema: {
      type: 'object',
      properties: {
        filename: {
          type: 'string',
          description: 'Name of the file including extension (e.g. "report.pdf", "data.txt")',
        },
        base64_content: {
          type: 'string',
          description: 'Base64-encoded file content',
        },
        content_type: {
          type: 'string',
          description:
            'MIME type (e.g. "text/plain", "application/pdf", "text/markdown"). Defaults to "application/octet-stream".',
          default: 'application/octet-stream',
        },
      },
      required: ['filename', 'base64_content'],
    },
    handler: async (client, args) => {
      const filename = String(requireParam(args, 'filename'));
      const base64Content = String(requireParam(args, 'base64_content'));
      const contentType = args?.content_type ? String(args.content_type) : 'application/octet-stream';

      const file = await client.uploadFile(filename, base64Content, contentType);
      const size = file.meta?.size
        ? `${(file.meta.size / 1024).toFixed(1)} KB`
        : 'unknown size';

      return [
        `File uploaded successfully.`,
        `ID: ${file.id}`,
        `Name: ${file.meta?.name ?? filename}`,
        `Type: ${file.meta?.content_type ?? contentType}`,
        `Size: ${size}`,
        '',
        `To add this file to a knowledge base:`,
        `  openwebui_add_file_to_knowledge(knowledge_id: "<kb-id>", file_id: "${file.id}")`,
      ].join('\n');
    },
  },

  {
    name: 'openwebui_get_file_info',
    description:
      'Get metadata about a specific uploaded file — name, size, content type, and creation date. Does not return file content.',
    inputSchema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          description: 'File ID',
        },
      },
      required: ['id'],
    },
    handler: async (client, args) => {
      const id = String(requireParam(args, 'id'));
      const file = await client.getFile(id);
      if (!file) return `File ${id} not found.`;

      const size = file.meta?.size
        ? `${(file.meta.size / 1024).toFixed(1)} KB`
        : 'unknown';

      return [
        `File: ${file.meta?.name ?? 'unnamed'}`,
        `ID: ${file.id}`,
        `Type: ${file.meta?.content_type ?? 'unknown'}`,
        `Size: ${size}`,
        `Created: ${file.created_at ? new Date(file.created_at * 1000).toISOString() : 'unknown'}`,
      ].join('\n');
    },
  },

  {
    name: 'openwebui_delete_file',
    description:
      'Permanently delete an uploaded file from Open WebUI. If the file is in a knowledge base, remove it from the collection first with openwebui_remove_file_from_knowledge. Requires confirm: true.',
    inputSchema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          description: 'File ID to delete',
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
      requireConfirm(args, 'openwebui_delete_file');
      await client.deleteFile(id);
      return `File ${id} deleted permanently.`;
    },
  },
];
