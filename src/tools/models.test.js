/**
 * Model tools integration tests.
 *
 * Set OPENWEBUI_URL and OPENWEBUI_API_KEY environment variables.
 * Run: node --test src/tools/models.test.js
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import OpenWebUIClient from '../api-client.js';
import modelTools from './models.js';

const { OPENWEBUI_URL, OPENWEBUI_API_KEY } = process.env;
if (!OPENWEBUI_URL || !OPENWEBUI_API_KEY) {
  throw new Error('Set OPENWEBUI_URL and OPENWEBUI_API_KEY before running tests');
}

const client = new OpenWebUIClient(OPENWEBUI_URL, OPENWEBUI_API_KEY);
const toolMap = new Map(modelTools.map((t) => [t.name, t]));
const call = (name, args = {}) => toolMap.get(name).handler(client, args);

describe('openwebui_list_models', () => {
  test('returns string result', async () => {
    const result = await call('openwebui_list_models');
    assert.ok(typeof result === 'string', 'must return string');
  });

  test('result is either found or no models message', async () => {
    const result = await call('openwebui_list_models');
    assert.ok(
      result.includes('Found') || result.includes('No models found'),
      `unexpected: ${result.substring(0, 100)}`
    );
  });

  test('found models include IDs in bracket notation', async () => {
    const result = await call('openwebui_list_models');
    if (result.includes('Found')) {
      assert.ok(result.includes('['), 'model entries should include [id] notation');
    }
  });
});
