/** @type {import('../index.js').ToolDefinition[]} */
export default [
  {
    name: 'openwebui_get_status',
    description:
      'Check Open WebUI system status, version, and health. Useful for verifying connectivity and confirming which version is running.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
    handler: async (client, _args) => {
      const [health, version, config] = await Promise.allSettled([
        client.getHealth(),
        client.getVersion(),
        client.getConfig(),
      ]);

      const lines = [`Open WebUI Status`];
      lines.push('─'.repeat(40));

      // Health
      if (health.status === 'fulfilled') {
        const h = health.value;
        const status = h?.status === 'ok' || h === true ? '✓ Healthy' : '✗ Unhealthy';
        lines.push(`Health: ${status}`);
      } else {
        lines.push(`Health: ✗ Unreachable (${health.reason?.message})`);
      }

      // Version
      if (version.status === 'fulfilled') {
        const v = version.value;
        lines.push(`Version: ${v?.version ?? v ?? 'unknown'}`);
      } else {
        lines.push(`Version: unknown`);
      }

      // Config (selected fields)
      if (config.status === 'fulfilled' && config.value) {
        const c = config.value;
        if (c.name) lines.push(`Instance name: ${c.name}`);
        if (c.default_models) lines.push(`Default model: ${c.default_models}`);
        if (c.features) {
          const features = [];
          if (c.features.enable_signup) features.push('signup enabled');
          if (c.features.enable_web_search) features.push('web search');
          if (c.features.enable_community_sharing) features.push('community sharing');
          if (features.length) lines.push(`Features: ${features.join(', ')}`);
        }
      }

      lines.push('─'.repeat(40));
      lines.push(`Endpoint: ${client.baseUrl}`);

      return lines.join('\n');
    },
  },
];
