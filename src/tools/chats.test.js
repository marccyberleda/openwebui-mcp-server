/**
 * Chat tools integration tests.
 *
 * Requires a running Open WebUI instance with at least one chat.
 * Set OPENWEBUI_URL and OPENWEBUI_API_KEY environment variables.
 *
 * Run: node --test src/tools/chats.test.js
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import OpenWebUIClient from '../api-client.js';
import chatTools from './chats.js';

const { OPENWEBUI_URL, OPENWEBUI_API_KEY } = process.env;
if (!OPENWEBUI_URL || !OPENWEBUI_API_KEY) {
  throw new Error('Set OPENWEBUI_URL and OPENWEBUI_API_KEY before running tests');
}

const client = new OpenWebUIClient(OPENWEBUI_URL, OPENWEBUI_API_KEY);
const toolMap = new Map(chatTools.map((t) => [t.name, t]));
const call = (name, args = {}) => toolMap.get(name).handler(client, args);

describe('openwebui_list_chats', () => {
  test('returns list of chats', async () => {
    const result = await call('openwebui_list_chats');
    assert.ok(typeof result === 'string', 'result must be string');
    // Either found chats or none
    assert.ok(
      result.includes('Found') || result.includes('No chats'),
      `unexpected result: ${result.substring(0, 100)}`
    );
  });

  test('page 1 returns expected format', async () => {
    const result = await call('openwebui_list_chats', { page: 1 });
    assert.ok(typeof result === 'string');
  });

  test('high page number returns empty or chats', async () => {
    const result = await call('openwebui_list_chats', { page: 9999 });
    assert.ok(result.includes('No chats') || result.includes('Found'));
  });
});

describe('openwebui_search_chats', () => {
  test('search returns string result', async () => {
    const result = await call('openwebui_search_chats', { query: 'test' });
    assert.ok(typeof result === 'string');
  });

  test('search with no matches says no chats found', async () => {
    const result = await call('openwebui_search_chats', {
      query: 'xyzzy_nonexistent_query_12345',
    });
    assert.ok(result.includes('No chats found matching'));
  });

  test('missing query throws', async () => {
    await assert.rejects(() => call('openwebui_search_chats', {}));
  });
});

describe('openwebui_get_chat', () => {
  test('bad ID returns API error (not crash)', async () => {
    // Open WebUI returns 401 for unknown chat IDs — error should be caught cleanly
    await assert.rejects(
      () => call('openwebui_get_chat', { id: 'bad-id-that-does-not-exist' }),
      (err) => {
        assert.ok(err.message || err.status, 'error must have message or status');
        return true;
      }
    );
  });

  test('missing ID throws validation error', async () => {
    await assert.rejects(() => call('openwebui_get_chat', {}));
  });
});

describe('openwebui_delete_chat', () => {
  test('confirm: false throws validation error', async () => {
    await assert.rejects(
      () =>
        call('openwebui_delete_chat', {
          id: 'any-id',
          confirm: false,
        }),
      /confirm/i
    );
  });

  test('missing confirm throws validation error', async () => {
    await assert.rejects(() => call('openwebui_delete_chat', { id: 'any-id' }));
  });
});

describe('openwebui_get_chat_tags', () => {
  test('returns tag list or no tags message', async () => {
    const result = await call('openwebui_get_chat_tags');
    assert.ok(typeof result === 'string');
    assert.ok(result.includes('tag') || result.includes('No chat tags'));
  });
});
