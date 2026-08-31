import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeVin, parsePastedText, computeComparison } from '../src/engine.js';
import { generateMasterExportData, generateCSV } from '../src/export.js';
import { validateAndMigrateState } from '../src/storage.js';

test('End-to-End Real World Scenario: 100 List A, 100 List B, 10 Test Vehicles', () => {
  // 1. Generate sample data
  // List A: VIN_001 to VIN_100
  const listA = Array.from({ length: 100 }, (_, i) => {
    const num = String(i + 1).padStart(3, '0');
    return {
      id: `a-${i+1}`,
      vin: `VIN_${num}`,
      rawVin: `VIN_${num}`,
      note: `Note A ${num}`,
      addedAt: Date.now()
    };
  });

  // List B: 80 overlapping (VIN_001 to VIN_080), 20 new (VIN_101 to VIN_120)
  const listB = [
    ...Array.from({ length: 80 }, (_, i) => {
      const num = String(i + 1).padStart(3, '0');
      return {
        id: `b-${i+1}`,
        vin: `VIN_${num}`,
        rawVin: `VIN_${num}`,
        note: `Note B ${num}`,
        addedAt: Date.now()
      };
    }),
    ...Array.from({ length: 20 }, (_, i) => {
      const num = String(i + 101).padStart(3, '0');
      return {
        id: `b-${i+101}`,
        vin: `VIN_${num}`,
        rawVin: `VIN_${num}`,
        note: `Note B ${num}`,
        addedAt: Date.now()
      };
    })
  ];

  // List C (Test vehicles): 5 overlapping test vehicles (VIN_001 to VIN_005), 5 external test vehicles (VIN_991 to VIN_995)
  const listC = [
    ...Array.from({ length: 5 }, (_, i) => {
      const num = String(i + 1).padStart(3, '0');
      return {
        id: `c-${i+1}`,
        vin: `VIN_${num}`,
        rawVin: `VIN_${num}`,
        note: `Test Vehicle Prototypes`,
        addedAt: Date.now()
      };
    }),
    ...Array.from({ length: 5 }, (_, i) => {
      const num = String(i + 991).padStart(3, '0');
      return {
        id: `c-${i+991}`,
        vin: `VIN_${num}`,
        rawVin: `VIN_${num}`,
        note: `External Test Vehicles`,
        addedAt: Date.now()
      };
    })
  ];

  // 2. Run computation
  const comparison = computeComparison(listA, listB, listC);

  // Assertions:
  // Total A: 100
  // Total B: 100
  // Total C: 10
  assert.equal(comparison.stats.totalA, 100);
  assert.equal(comparison.stats.totalB, 100);
  assert.equal(comparison.stats.totalC, 10);

  // Test vehicles in A & B: VIN_001..VIN_005 (5 vehicles)
  assert.equal(comparison.stats.testIgnoredInA, 5);
  assert.equal(comparison.stats.testIgnoredInB, 5);

  // Matched: VIN_006..VIN_080 (75 vehicles)
  assert.equal(comparison.stats.matched, 75);

  // Only in A: VIN_081..VIN_100 (20 vehicles)
  assert.equal(comparison.stats.onlyA, 20);

  // Only in B: VIN_101..VIN_120 (20 vehicles)
  assert.equal(comparison.stats.onlyB, 20);

  // 3. Export validation
  const exportData = generateMasterExportData(listA, listB, listC, comparison);
  assert.equal(exportData.matched.length, 75);
  assert.equal(exportData.onlyA.length, 20);
  assert.equal(exportData.onlyB.length, 20);
  assert.equal(exportData.testVehicles.length, 5);

  // 4. Persistence validation
  const savedState = { listA, listB, listC, settings: { theme: 'light', autoTrimUpper: true, skipTestVehiclesInDiff: true } };
  const loadedState = validateAndMigrateState(savedState);
  assert.equal(loadedState.listA.length, 100);
  assert.equal(loadedState.listB.length, 100);
  assert.equal(loadedState.listC.length, 10);
  assert.equal(loadedState.listA[0].note, 'Note A 001');
});
