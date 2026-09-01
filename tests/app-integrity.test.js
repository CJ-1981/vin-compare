import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('index.html exists and contains necessary panels, UI markers, and features', () => {
  assert.ok(fs.existsSync('index.html'), 'index.html must exist in root');
  const html = fs.readFileSync('index.html', 'utf-8');

  // Key IDs
  assert.match(html, /id="panel-a"/);
  assert.match(html, /id="panel-b"/);
  assert.match(html, /id="panel-c"/);
  assert.match(html, /id="metrics-summary"/);
  assert.match(html, /id="batch-paste-modal"/);
  assert.match(html, /id="export-master-btn"/);

  // Features check
  assert.match(html, /localStorage/i);
  assert.match(html, /xlsx/i);
  assert.match(html, /Test Vehicle/i);
  assert.match(html, /copy/i);
  assert.match(html, /swapListsAB/);
  assert.match(html, /Swap A & B/i);
});
