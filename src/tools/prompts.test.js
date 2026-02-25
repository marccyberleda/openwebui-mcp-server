/**
 * Prompt tools integration tests.
 *
 * Creates and cleans up a test prompt.
 * Set OPENWEBUI_URL and OPENWEBUI_API_KEY environment variables.
 *
 * NOTE: Open WebUI 0.8.5 uses "name" instead of "title" for prompts.
 * CC#1's create_prompt sends "title" which causes a 422 error.
 * Tests marked [BUG] will fail until fixed.
 *
 * Run: node --test src/tools/prompts.test.js
 */
import { test, describe, after } from 'node:test';
import assert from 'node:assert/strict';
import OpenWebUIClient from '../api-client.js';
import promptTools from './prompts.js';

const { OPENWEBUI_URL, OPENWEBUI_API_KEY } = process.env;
if (!OPENWEBUI_URL || !OPENWEBUI_API_KEY) {
  throw new Error('Set OPENWEBUI_URL and OPENWEBUI_API_KEY before running tests');
}

const client = new OpenWebUIClient(OPENWEBUI_URL, OPENWEBUI_API_KEY);
const toolMap = new Map(promptTools.map((t) => [t.name, t]));
const call = (name, args = {}) => toolMap.get(name).handler(client, args);

let createdCommand = null;

describe('openwebui_list_prompts', () => {
  test('returns list or empty message', async () => {
    const result = await call('openwebui_list_prompts');
    assert.ok(typeof result === 'string');
    assert.ok(result.includes('Found') || result.includes('No saved prompts'));
  });
});

describe('openwebui_create_prompt', () => {
  test('creates a prompt successfully', async () => {
    const result = await call('openwebui_create_prompt', {
      command: '/integration-test',
      name: 'Integration Test Prompt',
      content: 'Test prompt created by integration tests. Safe to delete.',
    });
    assert.ok(
      result.includes('created successfully'),
      `create_prompt failed. Got: ${result.substring(0, 200)}`
    );
    createdCommand = '/integration-test';
  });

  test('missing command throws validation error', async () => {
    await assert.rejects(() =>
      call('openwebui_create_prompt', { name: 'test', content: 'test' })
    );
  });

  test('missing name throws validation error', async () => {
    await assert.rejects(() =>
      call('openwebui_create_prompt', { command: '/test', content: 'test' })
    );
  });

  test('missing content throws validation error', async () => {
    await assert.rejects(() =>
      call('openwebui_create_prompt', { command: '/test', name: 'test' })
    );
  });
});

describe('openwebui_list_prompts - name field', () => {
  test('prompt list shows name correctly (not "(no title)")', async () => {
    const result = await call('openwebui_list_prompts');
    assert.ok(
      !result.includes('(no title)'),
      `list_prompts shows "(no title)" — p.name not being read. Got: ${result.substring(0, 200)}`
    );
  });
});

describe('openwebui_update_prompt', () => {
  test('no updates provided returns helpful message', async () => {
    const result = await call('openwebui_update_prompt', { command: '/mcp-test' });
    assert.ok(result.includes('No updates'));
  });

  test('missing command throws validation error', async () => {
    await assert.rejects(() => call('openwebui_update_prompt', {}));
  });
});

describe('openwebui_delete_prompt', () => {
  test('confirm: false throws validation error', async () => {
    await assert.rejects(
      () => call('openwebui_delete_prompt', { command: '/any', confirm: false }),
      /confirm/i
    );
  });

  test('missing confirm throws validation error', async () => {
    await assert.rejects(() =>
      call('openwebui_delete_prompt', { command: '/any' })
    );
  });
});

after(async () => {
  if (createdCommand) {
    try {
      await client.deletePrompt(createdCommand);
      console.log(`  Cleaned up test prompt: ${createdCommand}`);
    } catch (e) {
      console.warn(`  Warning: could not clean up prompt ${createdCommand}: ${e.message}`);
    }
  }
});
