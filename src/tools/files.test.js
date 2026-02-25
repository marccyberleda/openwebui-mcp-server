/**
 * File tools integration tests.
 *
 * Uploads and cleans up a test file.
 * Set OPENWEBUI_URL and OPENWEBUI_API_KEY environment variables.
 *
 * Run: node --test src/tools/files.test.js
 */
import { test, describe, after } from 'node:test';
import assert from 'node:assert/strict';
import OpenWebUIClient from '../api-client.js';
import fileTools from './files.js';

const { OPENWEBUI_URL, OPENWEBUI_API_KEY } = process.env;
if (!OPENWEBUI_URL || !OPENWEBUI_API_KEY) {
  throw new Error('Set OPENWEBUI_URL and OPENWEBUI_API_KEY before running tests');
}

const client = new OpenWebUIClient(OPENWEBUI_URL, OPENWEBUI_API_KEY);
const toolMap = new Map(fileTools.map((t) => [t.name, t]));
const call = (name, args = {}) => toolMap.get(name).handler(client, args);

let uploadedFileId = null;

describe('openwebui_list_files', () => {
  test('returns list or empty message', async () => {
    const result = await call('openwebui_list_files');
    assert.ok(typeof result === 'string');
    assert.ok(result.includes('Found') || result.includes('No files'));
  });
});

describe('openwebui_upload_file', () => {
  test('uploads a text file from base64', async () => {
    const content = Buffer.from('Integration test file. Safe to delete.').toString('base64');
    const result = await call('openwebui_upload_file', {
      filename: 'integration-test.txt',
      base64_content: content,
      content_type: 'text/plain',
    });
    assert.ok(result.includes('uploaded successfully'), `unexpected: ${result.substring(0, 150)}`);
    assert.ok(result.includes('ID:'));

    const match = result.match(/ID:\s*([a-f0-9-]+)/);
    assert.ok(match, 'could not extract ID');
    uploadedFileId = match[1];
  });

  test('missing filename throws validation error', async () => {
    await assert.rejects(() =>
      call('openwebui_upload_file', {
        base64_content: Buffer.from('test').toString('base64'),
      })
    );
  });

  test('missing base64_content throws validation error', async () => {
    await assert.rejects(() =>
      call('openwebui_upload_file', { filename: 'test.txt' })
    );
  });
});

describe('openwebui_get_file_info', () => {
  test('gets uploaded file metadata', async () => {
    assert.ok(uploadedFileId, 'uploadedFileId must be set by upload test');
    const result = await call('openwebui_get_file_info', { id: uploadedFileId });
    assert.ok(result.includes('integration-test.txt') || result.includes(uploadedFileId));
  });

  test('bad ID throws API error', async () => {
    await assert.rejects(
      () => call('openwebui_get_file_info', { id: 'bad-id-nonexistent' }),
      (err) => {
        assert.ok(err.message || err.status);
        return true;
      }
    );
  });

  test('missing ID throws validation error', async () => {
    await assert.rejects(() => call('openwebui_get_file_info', {}));
  });
});

describe('openwebui_delete_file', () => {
  test('confirm: false throws validation error', async () => {
    await assert.rejects(
      () => call('openwebui_delete_file', { id: 'any-id', confirm: false }),
      /confirm/i
    );
  });

  test('deletes the uploaded test file', async () => {
    assert.ok(uploadedFileId, 'uploadedFileId must be set by upload test');
    const result = await call('openwebui_delete_file', {
      id: uploadedFileId,
      confirm: true,
    });
    assert.ok(result.includes('deleted'), `unexpected: ${result}`);
    uploadedFileId = null; // Prevent after() from double-deleting
  });
});

after(async () => {
  if (uploadedFileId) {
    try {
      await client.deleteFile(uploadedFileId);
      console.log(`  Cleaned up test file: ${uploadedFileId}`);
    } catch (e) {
      console.warn(`  Warning: could not clean up file ${uploadedFileId}: ${e.message}`);
    }
  }
});
