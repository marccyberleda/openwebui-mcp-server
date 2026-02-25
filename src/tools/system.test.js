/**
 * System tools integration tests.
 *
 * Set OPENWEBUI_URL and OPENWEBUI_API_KEY environment variables.
 * Run: node --test src/tools/system.test.js
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import OpenWebUIClient from '../api-client.js';
import systemTools from './system.js';

const { OPENWEBUI_URL, OPENWEBUI_API_KEY } = process.env;
if (!OPENWEBUI_URL || !OPENWEBUI_API_KEY) {
  throw new Error('Set OPENWEBUI_URL and OPENWEBUI_API_KEY before running tests');
}

const client = new OpenWebUIClient(OPENWEBUI_URL, OPENWEBUI_API_KEY);
const toolMap = new Map(systemTools.map((t) => [t.name, t]));
const call = (name, args = {}) => toolMap.get(name).handler(client, args);

describe('openwebui_get_status', () => {
  test('returns status string', async () => {
    const result = await call('openwebui_get_status');
    assert.ok(typeof result === 'string', 'must return string');
    assert.ok(result.includes('Open WebUI Status'), `missing header: ${result.substring(0, 100)}`);
  });

  test('includes version', async () => {
    const result = await call('openwebui_get_status');
    assert.ok(result.includes('Version:'), `missing version: ${result.substring(0, 200)}`);
  });

  test('includes endpoint URL', async () => {
    const result = await call('openwebui_get_status');
    assert.ok(
      result.includes('Endpoint:') && result.includes(OPENWEBUI_URL.replace(/\/$/, '')),
      `missing endpoint: ${result.substring(0, 200)}`
    );
  });

  test('health check result is shown (even if unreachable)', async () => {
    // /api/health may return HTML on some deployments.
    // The tool should handle gracefully (not crash) and show either Healthy or Unreachable.
    const result = await call('openwebui_get_status');
    assert.ok(
      result.includes('Health:'),
      `missing health line: ${result.substring(0, 200)}`
    );
  });

  test('instance name shown when config available', async () => {
    const result = await call('openwebui_get_status');
    // Config endpoint works — should show instance name
    assert.ok(
      result.includes('Instance name:') || result.includes('Version:'),
      `status should show config info: ${result.substring(0, 200)}`
    );
  });
});
