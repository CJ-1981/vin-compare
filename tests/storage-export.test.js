import test from 'node:test';
import assert from 'node:assert/strict';
import { generateCSV, generateMasterExportData } from '../src/export.js';
import { createInitialState, validateAndMigrateState } from '../src/storage.js';
import { computeComparison } from '../src/engine.js';

test('generateCSV properly escapes and quotes CSV strings', () => {
  const rows = [
    { vin: 'VIN123', status: 'MATCHED', note: 'Test, with comma' },
    { vin: 'VIN456', status: 'ONLY_IN_A', note: 'Note with "quotes"' }
  ];
  const csv = generateCSV(rows);
  assert.match(csv, /VIN,Status,Note/);
  assert.match(csv, /"Test, with comma"/);
  assert.match(csv, /"Note with ""quotes"""/);
});

test('generateMasterExportData structures separate buckets for export', () => {
  const listA = [{ id: '1', vin: 'V1', note: 'A1' }, { id: '2', vin: 'V2', note: 'A2' }];
  const listB = [{ id: '3', vin: 'V1', note: 'B1' }, { id: '4', vin: 'V3', note: 'B3' }];
  const listC = [{ id: '5', vin: 'V2', note: 'Test C' }];

  const comparison = computeComparison(listA, listB, listC);
  const exportData = generateMasterExportData(listA, listB, listC, comparison);

  assert.equal(exportData.summary.length, 8);
  assert.equal(exportData.matched.length, 1);
  assert.equal(exportData.onlyA.length, 0); // V2 is test vehicle
  assert.equal(exportData.onlyB.length, 1); // V3
  assert.equal(exportData.testVehicles.length, 1);
});

test('validateAndMigrateState handles empty, corrupted, and legacy state objects safely', () => {
  const initial = createInitialState();
  assert.deepEqual(initial.listA, []);
  assert.deepEqual(initial.listB, []);
  assert.deepEqual(initial.listC, []);

  const corrupted = validateAndMigrateState({ listA: 'invalid', settings: null });
  assert.deepEqual(corrupted.listA, []);
  assert.equal(corrupted.settings.theme, 'dark');
});
