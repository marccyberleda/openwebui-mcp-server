/** @type {import('../index.js').ToolDefinition[]} */
export default [
  {
    name: 'openwebui_list_models',
    description:
      'List all available models in Open WebUI — includes Ollama local models, OpenAI models, and custom pipe models. Returns model IDs, names, and sources.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
    handler: async (client, _args) => {
      const result = await client.listModels();

      // The /api/models endpoint returns { data: [...] } matching OpenAI format
      const models = Array.isArray(result) ? result : result?.data ?? [];

      if (models.length === 0) {
        return 'No models found. Ensure at least one model provider (Ollama, OpenAI) is configured.';
      }

      // Group by source/type
      const ollama = [];
      const openai = [];
      const pipe = [];
      const other = [];

      for (const m of models) {
        const id = m.id ?? m.model ?? 'unknown';
        const name = m.name ?? id;
        const entry = `  • [${id}] ${name}`;

        if (m.owned_by === 'ollama' || id.includes(':')) {
          ollama.push(entry);
        } else if (m.owned_by === 'openai' || id.startsWith('gpt-') || id.startsWith('o1')) {
          openai.push(entry);
        } else if (m.owned_by === 'openwebui' || id.startsWith('pipe-')) {
          pipe.push(entry);
        } else {
          other.push(entry);
        }
      }

      const sections = [];
      if (ollama.length) sections.push(`\nOLLAMA (${ollama.length}):\n${ollama.join('\n')}`);
      if (openai.length) sections.push(`\nOPENAI (${openai.length}):\n${openai.join('\n')}`);
      if (pipe.length) sections.push(`\nPIPE/CUSTOM (${pipe.length}):\n${pipe.join('\n')}`);
      if (other.length) sections.push(`\nOTHER (${other.length}):\n${other.join('\n')}`);

      return `Found ${models.length} model(s):${sections.join('')}`;
    },
  },
];
