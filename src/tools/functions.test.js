/**
 * Function tools integration tests.
 *
 * Uses the existing "n8n_pipe" function for read tests.
 * Create/update/delete tests use a throwaway function.
 * Set OPENWEBUI_URL and OPENWEBUI_API_KEY environment variables.
 *
 * Run: node --test src/tools/functions.test.js
 */
import { test, describe, after } from 'node:test';
import assert from 'node:assert/strict';
import OpenWebUIClient from '../api-client.js';
import functionTools from './functions.js';

const { OPENWEBUI_URL, OPENWEBUI_API_KEY } = process.env;
if (!OPENWEBUI_URL || !OPENWEBUI_API_KEY) {
  throw new Error('Set OPENWEBUI_URL and OPENWEBUI_API_KEY before running tests');
}

const client = new OpenWebUIClient(OPENWEBUI_URL, OPENWEBUI_API_KEY);
const toolMap = new Map(functionTools.map((t) => [t.name, t]));
const call = (name, args = {}) => toolMap.get(name).handler(client, args);

const EXISTING_FUNCTION_ID = 'n8n_pipe';

const TEST_FUNCTION_CONTENT = `
"""
title: Integration Test Pipe
author: cc2-test
version: 0.1.0
"""

class Pipe:
    def pipe(self, body, __user__=None):
        return body
`.trim();

let createdFunctionId = null;

describe('openwebui_list_functions', () => {
  test('returns list or empty message', async () => {
    const result = await call('openwebui_list_functions');
    assert.ok(typeof result === 'string');
    assert.ok(result.includes('Found') || result.includes('No functions'));
  });

  test('lists existing n8n_pipe function', async () => {
    const result = await call('openwebui_list_functions');
    assert.ok(result.includes('n8n'), `should include n8n_pipe: ${result.substring(0, 150)}`);
  });
});

describe('openwebui_get_function', () => {
  test('gets existing function by ID', async () => {
    const result = await call('openwebui_get_function', { id: EXISTING_FUNCTION_ID });
    assert.ok(result.includes('n8n'), `unexpected: ${result.substring(0, 150)}`);
    assert.ok(result.includes(EXISTING_FUNCTION_ID));
  });

  test('bad ID throws API error', async () => {
    await assert.rejects(
      () => call('openwebui_get_function', { id: 'nonexistent-function-id' }),
      (err) => {
        assert.ok(err.message || err.status);
        return true;
      }
    );
  });

  test('missing ID throws validation error', async () => {
    await assert.rejects(() => call('openwebui_get_function', {}));
  });
});

describe('openwebui_create_function', () => {
  test('creates a pipe function', async () => {
    const result = await call('openwebui_create_function', {
      id: 'cc2_integration_test_pipe',
      name: 'CC2 Integration Test Pipe',
      type: 'pipe',
      content: TEST_FUNCTION_CONTENT,
    });
    assert.ok(
      result.includes('created') || result.includes('CC2 Integration'),
      `unexpected: ${result.substring(0, 150)}`
    );
    createdFunctionId = 'cc2_integration_test_pipe';
  });

  test('missing id throws validation error', async () => {
    await assert.rejects(() =>
      call('openwebui_create_function', {
        name: 'Test',
        type: 'pipe',
        content: TEST_FUNCTION_CONTENT,
      })
    );
  });
});

describe('openwebui_delete_function', () => {
  test('confirm: false throws validation error', async () => {
    await assert.rejects(
      () => call('openwebui_delete_function', { id: 'any-id', confirm: false }),
      /confirm/i
    );
  });

  test('deletes the created function', async () => {
    if (!createdFunctionId) return; // Skip if create failed
    const result = await call('openwebui_delete_function', {
      id: createdFunctionId,
      confirm: true,
    });
    assert.ok(result.includes('deleted'), `unexpected: ${result}`);
    createdFunctionId = null;
  });
});

after(async () => {
  if (createdFunctionId) {
    try {
      await client.deleteFunction(createdFunctionId);
      console.log(`  Cleaned up test function: ${createdFunctionId}`);
    } catch (e) {
      console.warn(`  Warning: could not clean up function ${createdFunctionId}: ${e.message}`);
    }
  }
});
