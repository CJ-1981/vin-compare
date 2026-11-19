import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const html = fs.readFileSync('index.html', 'utf8');
function functionSource(name) {
  const match = html.match(new RegExp(`    (?:async )?function ${name}\\([^]*?\\n    }`));
  assert.ok(match, `Missing ${name}`);
  return match[0];
}

function createContext({ search = '', statuses = null, sort = null } = {}) {
  const state = {
    listA: [
      { id: 'r1', vin: 'WBA00000000000001', note: 'Alpha note', fileName: 'a.csv' },
      { id: 'r2', vin: 'WBA00000000000002', note: '', fileName: 'a.csv' },
      { id: 'r3', vin: 'ZZZ00000000000003', note: 'Alpha test car', fileName: '' }
    ]
  };
  const copied = [];
  const toasts = [];
  const context = vm.createContext({
    document: { getElementById: (id) => id === 'search-a' ? { value: search } : null },
    state,
    comparison: {
      statusMapA: new Map([['r1', 'MATCHED'], ['r2', 'ONLY_IN_A'], ['r3', 'TEST_VEHICLE']]),
      statusMapB: new Map(), statusMapC: new Map()
    },
    filterState: { listA: new Set(statuses || ['MATCHED', 'ONLY_IN_A', 'TEST_VEHICLE']) },
    sortState: { listA: sort || { column: 'index', direction: 'none' } },
    copyText: (text) => copied.push(text),
    showToast: (msg) => toasts.push(msg)
  });
  vm.runInContext(['getVisibleRecords', 'copyPanelVins', 'updateCopyButtonsState'].map(functionSource).join('\n'), context);
  return { context, copied, toasts, state };
}

test('copy all copies every record in list order, VIN then tab-separated note', () => {
  const { context, copied, toasts } = createContext();
  context.copyPanelVins('listA');
  assert.deepEqual(copied, ['WBA00000000000001\tAlpha note\nWBA00000000000002\nZZZ00000000000003\tAlpha test car']);
  assert.match(toasts[0], /Copied 3 items to clipboard/);
});

test('copy filtered copies only visible records, in display order', () => {
  // Status filter hides ONLY_IN_A (r2); search narrows to notes/VINs containing "alpha";
  // sort by VIN descending puts r3 before r1, mirroring the rendered table.
  const { context, copied, toasts } = createContext({
    search: 'alpha',
    statuses: ['MATCHED', 'TEST_VEHICLE'],
    sort: { column: 'vin', direction: 'desc' }
  });
  context.copyPanelVins('listA', 'filtered');
  assert.deepEqual(copied, ['ZZZ00000000000003\tAlpha test car\nWBA00000000000001\tAlpha note']);
  assert.match(toasts[0], /Copied 2 of 3 filtered items to clipboard/);
});

test('copy filtered with zero matches does not touch the clipboard', () => {
  const { context, copied, toasts } = createContext({ search: 'no-such-vin' });
  context.copyPanelVins('listA', 'filtered');
  assert.deepEqual(copied, []);
  assert.match(toasts[0], /No records match the current filter/);
});

test('copy on an empty list reports it instead of copying', () => {
  const { context, copied, toasts, state } = createContext();
  state.listA = [];
  context.copyPanelVins('listA', 'filtered');
  assert.deepEqual(copied, []);
  assert.match(toasts[0], /List is empty/);
});

test('copy buttons grey out per visible set: redundant filtered, both on zero entries', () => {
  const buttons = {
    'copy-all-a': { disabled: null }, 'copy-filtered-a': { disabled: null },
    'copy-all-b': { disabled: null }, 'copy-filtered-b': { disabled: null }
  };
  const context = vm.createContext({
    document: { getElementById: (id) => buttons[id] || null }
  });
  vm.runInContext(functionSource('updateCopyButtonsState'), context);

  context.updateCopyButtonsState('listA', 4, 6); // filter hides records -> both enabled
  assert.equal(buttons['copy-all-a'].disabled, false);
  assert.equal(buttons['copy-filtered-a'].disabled, false);

  context.updateCopyButtonsState('listA', 6, 6); // everything visible -> Copy Filtered redundant
  assert.equal(buttons['copy-all-a'].disabled, false);
  assert.equal(buttons['copy-filtered-a'].disabled, true);

  context.updateCopyButtonsState('listB', 0, 6); // zero visible entries -> both greyed out
  assert.equal(buttons['copy-all-b'].disabled, true);
  assert.equal(buttons['copy-filtered-b'].disabled, true);

  context.updateCopyButtonsState('listB', 0, 0); // empty list -> both greyed out
  assert.equal(buttons['copy-all-b'].disabled, true);
  assert.equal(buttons['copy-filtered-b'].disabled, true);
});
