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
  assert.match(html, /renameList/);
  assert.match(html, /listNames/);

  // Version in title
  assert.match(html, /v1\.4\.0/i);

  // Column sorting feature & persistence
  assert.match(html, /toggleSort/);
  assert.match(html, /parsed\.sortState/);

  // Multi-select status filter feature
  assert.match(html, /toggleFilterDropdown/);
  assert.match(html, /onFilterCheckboxChange/);
  assert.match(html, /multi-select-dropdown/);

  // Big scrollable Add/Import modal with live counter
  assert.match(html, /id="modal-live-counter"/);
  assert.match(html, /updateModalLiveCounter/);

  // Dual badging and explicit filter checkbox for matched test vehicles
  assert.match(html, /MATCHED_TEST_VEHICLE/);
  assert.match(html, /value="MATCHED_TEST_VEHICLE"/);

  // Dynamic filter dropdown options & header count badge update
  assert.match(html, /updateFilterDropdownOptions/);

  // Non-destructive Sample Data toggle
  assert.match(html, /toggleSampleData/);
  assert.match(html, /isSampleDataActive/);

  // Dynamic title font size to prevent multi-line wrapping
  assert.match(html, /adjustTitleFontSize/);

  // No colored halo border-top on panels
  assert.doesNotMatch(html, /#panel-a\s*\{\s*border-top:\s*4px/);
});
