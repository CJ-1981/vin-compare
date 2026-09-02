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

test('generateMasterExportData structures separate buckets for export with default and custom list names', () => {
  const listA = [{ id: '1', vin: 'V1', note: 'A1' }, { id: '2', vin: 'V2', note: 'A2' }];
  const listB = [{ id: '3', vin: 'V1', note: 'B1' }, { id: '4', vin: 'V3', note: 'B3' }];
  const listC = [{ id: '5', vin: 'V2', note: 'Test C' }];

  const comparison = computeComparison(listA, listB, listC);
  
  // Test with custom names
  const customNames = {
    listA: 'Warehouse Stock',
    listB: 'Delivery Manifest',
    listC: 'Pre-production Fleet'
  };
  const exportData = generateMasterExportData(listA, listB, listC, comparison, customNames);

  assert.equal(exportData.summary.length, 8);
  assert.deepEqual(exportData.summary[0], { Metric: 'Total in Warehouse Stock', Count: 2 });
  assert.deepEqual(exportData.summary[1], { Metric: 'Total in Delivery Manifest', Count: 2 });
  assert.deepEqual(exportData.summary[3], { Metric: 'Discrepancies (Only in Warehouse Stock)', Count: 0 });
  assert.deepEqual(exportData.summary[4], { Metric: 'Discrepancies (Only in Delivery Manifest)', Count: 1 });
  assert.deepEqual(exportData.summary[7], { Metric: 'Total Reference Pre-production Fleet', Count: 1 });

  assert.equal(exportData.matched.length, 1);
  assert.equal(exportData.matched[0].source, 'Warehouse Stock & Delivery Manifest');
  assert.equal(exportData.onlyB.length, 1);
  assert.equal(exportData.onlyB[0].source, 'Delivery Manifest');
  assert.equal(exportData.testVehicles.length, 1);
  assert.equal(exportData.testVehicles[0].source, 'Found in Warehouse Stock (Ignored)');
});

test('validateAndMigrateState handles empty, corrupted, legacy, and custom listNames safely', () => {
  const initial = createInitialState();
  assert.deepEqual(initial.listA, []);
  assert.deepEqual(initial.listB, []);
  assert.deepEqual(initial.listC, []);
  assert.equal(initial.listNames.listA, 'List A (Baseline)');
  assert.equal(initial.listNames.listB, 'List B (Comparison)');
  assert.equal(initial.listNames.listC, 'List C (Test Vehicles)');

  const corrupted = validateAndMigrateState({ listA: 'invalid', settings: null });
  assert.deepEqual(corrupted.listA, []);
  assert.equal(corrupted.settings.theme, 'dark');
  assert.equal(corrupted.listNames.listA, 'List A (Baseline)');

  const customState = validateAndMigrateState({
    listNames: {
      listA: 'Factory Inventory',
      listB: 'Port Scans',
      listC: 'Engineering Mule VINs'
    }
  });
  assert.equal(customState.listNames.listA, 'Factory Inventory');
  assert.equal(customState.listNames.listB, 'Port Scans');
  assert.equal(customState.listNames.listC, 'Engineering Mule VINs');
});
