import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeVin, parsePastedText, computeComparison } from '../src/engine.js';

test('normalizeVin trims and uppercases alphanumeric VINs', () => {
  assert.equal(normalizeVin('  wba1234567890abcd  '), 'WBA1234567890ABCD');
  assert.equal(normalizeVin('xyz-123_456'), 'XYZ123456');
});

test('parsePastedText parses single and multi-column inputs (tabs, commas, newlines)', () => {
  const tsvInput = "VIN123\tFirst test vehicle\nVIN456\tSecond vehicle\nVIN789";
  const parsed = parsePastedText(tsvInput);
  assert.equal(parsed.length, 3);
  assert.deepEqual(parsed[0], { vin: 'VIN123', note: 'First test vehicle' });
  assert.deepEqual(parsed[1], { vin: 'VIN456', note: 'Second vehicle' });
  assert.deepEqual(parsed[2], { vin: 'VIN789', note: '' });

  const csvInput = "VIN001,Note 1\nVIN002,Note 2";
  const parsedCsv = parsePastedText(csvInput);
  assert.equal(parsedCsv.length, 2);
  assert.deepEqual(parsedCsv[0], { vin: 'VIN001', note: 'Note 1' });
});

test('computeComparison categorizes Matched, Only in A, Only in B, and Test Vehicles correctly', () => {
  const listA = [
    { id: '1', vin: 'VIN_MATCH', note: '' },
    { id: '2', vin: 'VIN_ONLY_A', note: '' },
    { id: '3', vin: 'VIN_TEST', note: 'Test car' }
  ];
  const listB = [
    { id: '4', vin: 'VIN_MATCH', note: '' },
    { id: '5', vin: 'VIN_ONLY_B', note: '' },
    { id: '6', vin: 'VIN_TEST', note: 'Test car' }
  ];
  const listC = [
    { id: '7', vin: 'VIN_TEST', note: 'Known test car' }
  ];

  const result = computeComparison(listA, listB, listC);

  assert.equal(result.statusMapA.get('1'), 'MATCHED');
  assert.equal(result.statusMapA.get('2'), 'ONLY_IN_A');
  assert.equal(result.statusMapA.get('3'), 'TEST_VEHICLE');

  assert.equal(result.statusMapB.get('4'), 'MATCHED');
  assert.equal(result.statusMapB.get('5'), 'ONLY_IN_B');
  assert.equal(result.statusMapB.get('6'), 'TEST_VEHICLE');

  assert.equal(result.stats.matched, 1);
  assert.equal(result.stats.onlyA, 1);
  assert.equal(result.stats.onlyB, 1);
  assert.equal(result.stats.testIgnoredInA, 1);
  assert.equal(result.stats.testIgnoredInB, 1);
});
