/**
 * Knowledge base tools integration tests.
 *
 * Creates and cleans up a test knowledge base.
 * Set OPENWEBUI_URL and OPENWEBUI_API_KEY environment variables.
 *
 * Run: node --test src/tools/knowledge.test.js
 */
import { test, describe, after } from 'node:test';
import assert from 'node:assert/strict';
import OpenWebUIClient from '../api-client.js';
import knowledgeTools from './knowledge.js';

const { OPENWEBUI_URL, OPENWEBUI_API_KEY } = process.env;
if (!OPENWEBUI_URL || !OPENWEBUI_API_KEY) {
  throw new Error('Set OPENWEBUI_URL and OPENWEBUI_API_KEY before running tests');
}

const client = new OpenWebUIClient(OPENWEBUI_URL, OPENWEBUI_API_KEY);
const toolMap = new Map(knowledgeTools.map((t) => [t.name, t]));
const call = (name, args = {}) => toolMap.get(name).handler(client, args);

let testKbId = null;

describe('openwebui_create_knowledge', () => {
  test('creates a knowledge base', async () => {
    const result = await call('openwebui_create_knowledge', {
      name: 'Test KB — integration test (auto-delete)',
      description: 'Created by knowledge.test.js',
    });
    assert.ok(result.includes('created successfully'), `unexpected: ${result.substring(0, 120)}`);
    assert.ok(result.includes('ID:'), 'result must include ID');

    // Extract ID for subsequent tests
    const match = result.match(/ID:\s*([a-f0-9-]+)/);
    assert.ok(match, 'could not extract ID from result');
    testKbId = match[1];
  });

  test('requires name parameter', async () => {
    await assert.rejects(() => call('openwebui_create_knowledge', {}));
  });
});

describe('openwebui_list_knowledge', () => {
  test('returns list including the created KB', async () => {
    assert.ok(testKbId, 'testKbId must be set by create test');
    const result = await call('openwebui_list_knowledge');
    assert.ok(typeof result === 'string');
    assert.ok(
      result.includes('Found') && result.includes(testKbId),
      `list_knowledge must include created KB. Got: ${result.substring(0, 200)}`
    );
  });

  test('does not return "No knowledge base collections found" when KBs exist', async () => {
    assert.ok(testKbId, 'testKbId must be set by create test');
    const result = await call('openwebui_list_knowledge');
    assert.ok(
      !result.includes('No knowledge base collections found'),
      `BUG: list_knowledge returns "not found" even when KBs exist. Got: ${result.substring(0, 200)}`
    );
  });
});

describe('openwebui_get_knowledge', () => {
  test('gets the created KB by ID', async () => {
    assert.ok(testKbId, 'testKbId must be set by create test');
    const result = await call('openwebui_get_knowledge', { id: testKbId });
    assert.ok(result.includes('integration test'), `should include KB name: ${result.substring(0, 150)}`);
    assert.ok(result.includes(testKbId));
  });

  test('bad ID throws API error', async () => {
    await assert.rejects(
      () => call('openwebui_get_knowledge', { id: 'nonexistent-id' }),
      (err) => {
        assert.ok(err.message || err.status);
        return true;
      }
    );
  });

  test('missing ID throws validation error', async () => {
    await assert.rejects(() => call('openwebui_get_knowledge', {}));
  });
});

describe('openwebui_update_knowledge', () => {
  test('updates name and description together', async () => {
    assert.ok(testKbId, 'testKbId must be set by create test');
    const result = await call('openwebui_update_knowledge', {
      id: testKbId,
      name: 'Test KB — integration test (updated)',
      description: 'Updated by knowledge.test.js',
    });
    assert.ok(result.includes('updated'), `unexpected: ${result.substring(0, 120)}`);
  });

  test('update with only description (no name) should succeed or give clear error', async () => {
    assert.ok(testKbId, 'testKbId must be set by create test');
    // NOTE: Open WebUI 0.8.5 requires name in update payload.
    // This test documents the current behavior — fix requires fetching existing name first.
    const result = await call('openwebui_update_knowledge', {
      id: testKbId,
      description: 'Description-only update',
    }).catch((err) => `ERROR: ${err.message}`);
    // If it fails, the error should be descriptive (not "[object Object]")
    if (result.startsWith('ERROR:')) {
      assert.ok(
        !result.includes('[object Object]'),
        `BUG: error detail serialized as [object Object]: ${result}`
      );
    }
  });

  test('no updates provided returns helpful message', async () => {
    assert.ok(testKbId);
    const result = await call('openwebui_update_knowledge', { id: testKbId });
    assert.ok(result.includes('No updates'), `unexpected: ${result}`);
  });

  test('missing ID throws validation error', async () => {
    await assert.rejects(() => call('openwebui_update_knowledge', {}));
  });
});

describe('openwebui_add_file_to_knowledge / openwebui_remove_file_from_knowledge', () => {
  test('missing knowledge_id throws validation error', async () => {
    await assert.rejects(() =>
      call('openwebui_add_file_to_knowledge', { file_id: 'some-file' })
    );
  });

  test('missing file_id throws validation error', async () => {
    await assert.rejects(() =>
      call('openwebui_add_file_to_knowledge', { knowledge_id: 'some-kb' })
    );
  });
});

// Cleanup: delete the test KB after all tests
after(async () => {
  if (testKbId) {
    try {
      await client.deleteKnowledge(testKbId);
      console.log(`  Cleaned up test KB: ${testKbId}`);
    } catch (e) {
      console.warn(`  Warning: could not clean up test KB ${testKbId}: ${e.message}`);
    }
  }
});
