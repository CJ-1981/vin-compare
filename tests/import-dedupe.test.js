import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { deduplicateVinRecords } from '../src/engine.js';

test('engine deduplicates VINs repeated within the import batch, keeping the first occurrence', () => {
  const records = [
    { vin: 'VIN1', note: 'first note', fileName: 'a.csv' },
    { vin: 'vin-1', note: 'second note', fileName: 'b.csv' },
    { vin: 'VIN2', note: '', fileName: 'a.csv' }
  ];
  const { unique, duplicatesInBatch, duplicatesExisting } = deduplicateVinRecords(records, []);

  assert.deepEqual(unique, [
    { vin: 'VIN1', note: 'first note', fileName: 'a.csv' },
    { vin: 'VIN2', note: '', fileName: 'a.csv' }
  ]);
  assert.equal(duplicatesInBatch, 1);
  assert.equal(duplicatesExisting, 0);
});

test('engine skips VINs already present in the target list', () => {
  const records = [
    { vin: 'WBA123', note: '', fileName: 'a.csv' },
    { vin: 'VIN2', note: 'dupe of existing', fileName: 'a.csv' },
    { vin: 'VIN3', note: '', fileName: 'b.csv' }
  ];
  const { unique, duplicatesInBatch, duplicatesExisting } = deduplicateVinRecords(records, ['VIN2', ' wba-123 ']);

  assert.deepEqual(unique, [{ vin: 'VIN3', note: '', fileName: 'b.csv' }]);
  assert.equal(duplicatesInBatch, 0);
  assert.equal(duplicatesExisting, 2);
});

test('engine counts every duplicate occurrence across both categories', () => {
  const records = [
    { vin: 'VIN1' }, { vin: 'VIN2' }, { vin: 'VIN1' }, { vin: 'VIN2' }, { vin: 'VIN3' }
  ];
  const { unique, duplicatesInBatch, duplicatesExisting } = deduplicateVinRecords(records, ['VIN2']);

  assert.deepEqual(unique.map(r => r.vin), ['VIN1', 'VIN3']);
  assert.equal(duplicatesInBatch, 1);
  assert.equal(duplicatesExisting, 2);
});

const html = fs.readFileSync('index.html', 'utf8');
function functionSource(name) {
  const match = html.match(new RegExp(`    (?:async )?function ${name}\\([^]*?\\n    }`));
  assert.ok(match, `Missing ${name}`);
  return match[0];
}

function createSubmitContext(state, mode) {
  const area = { value: '', sourceText: '', sourceFiles: [] };
  const calls = { toasts: [], alerts: [], closed: 0, recalculated: 0 };
  const context = vm.createContext({
    document: {
      getElementById: () => area,
      querySelector: () => ({ value: mode })
    },
    state, currentModalTarget: 'listA', isSampleDataActive: false,
    updateModalLiveCounter() {},
    closeImportModal() { calls.closed++; },
    recalculateAndRender() { calls.recalculated++; },
    showToast(msg) { calls.toasts.push(msg); },
    alert(msg) { calls.alerts.push(msg); },
    console
  });
  vm.runInContext(
    ['normalizeVin', 'parsePastedText', 'deduplicateVinRecords', 'formatDuplicateSkipSummary', 'syncImportSources', 'submitImport']
      .map(functionSource).join('\n'),
    context
  );
  return { area, calls, context };
}

test('append mode imports only VINs unique within the batch and against the existing list', () => {
  const state = {
    listA: [{ id: 'e1', vin: 'VIN2', rawVin: 'VIN2', note: '', fileName: 'old.csv', addedAt: 1 }],
    listNames: { listA: 'List A (Baseline)' }
  };
  const { area, calls, context } = createSubmitContext(state, 'append');
  area.value = 'VIN1\nVIN2\nVIN3\nVIN3\nVIN4';

  context.submitImport();

  assert.deepEqual(Array.from(state.listA, r => r.vin), ['VIN2', 'VIN1', 'VIN3', 'VIN4']);
  assert.equal(calls.closed, 1);
  assert.equal(calls.recalculated, 1);
  assert.deepEqual(calls.alerts, []);
  assert.match(calls.toasts[0], /Added 3 VINs to List A \(Baseline\)/);
  assert.match(calls.toasts[0], /skipped 2 duplicates: 1 already in list, 1 repeated in import/);
});

test('replace mode only deduplicates within the batch, ignoring the replaced list', () => {
  const state = {
    listA: [{ id: 'e1', vin: 'VIN9', rawVin: 'VIN9', note: '', fileName: '', addedAt: 1 }],
    listNames: {}
  };
  const { area, calls, context } = createSubmitContext(state, 'replace');
  area.value = 'VIN9\nVIN9\nVIN8';

  context.submitImport();

  assert.deepEqual(Array.from(state.listA, r => r.vin), ['VIN9', 'VIN8']);
  assert.match(calls.toasts[0], /Added 2 VINs to listA/);
  assert.match(calls.toasts[0], /skipped 1 duplicate: 1 repeated in import/);
});

test('alerts and keeps the list untouched when every imported VIN is a duplicate', () => {
  const existing = [{ id: 'e1', vin: 'VIN1', rawVin: 'VIN1', note: '', fileName: '', addedAt: 1 }];
  const state = { listA: existing, listNames: {} };
  const { area, calls, context } = createSubmitContext(state, 'append');
  area.value = 'VIN1\nVIN-1';

  context.submitImport();

  assert.equal(state.listA, existing);
  assert.deepEqual(Array.from(state.listA, r => r.vin), ['VIN1']);
  assert.equal(calls.closed, 0);
  assert.equal(calls.recalculated, 0);
  assert.deepEqual(calls.toasts, []);
  assert.equal(calls.alerts.length, 1);
  assert.match(calls.alerts[0], /All 2 VINs were skipped as duplicates/);
  assert.match(calls.alerts[0], /Nothing was imported/);
});
