# 3-Panel VIN Comparison Tool Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a standalone, high-performance, single-file HTML/JS/CSS web application with 3 panels (List A, List B, and List C for test vehicles), inline editable notes per VIN, debounced `localStorage` persistence, multi-format batch/file import, real-time diff status badges, and comprehensive Excel/CSV export.

**Architecture:** A self-contained, offline-first client application. The business logic (VIN normalization, delimiter-aware ingestion, priority-based comparison engine, and state persistence) is decoupled into pure functions testable via Node.js, and rendered into a responsive 3-panel CSS grid dashboard with SheetJS embedded/loaded for Excel parsing/generation.

**Tech Stack:** Vanilla JavaScript (ES6+), HTML5, Modern CSS Grid & Flexbox, SheetJS (`xlsx.full.min.js`), Node.js `node:test` / `node:assert` for automated verification.

**Spec:** `docs/superpowers/specs/2026-08-31-vin-list-comparison-tool-design.md`

## Global Constraints
- Target output must be a self-contained, fully functional `index.html` file in the project root.
- Standalone operation: works offline and directly when opened as a local file (`file://`) in modern browsers.
- Delimiter support: newlines, tabs, commas, semicolons. If 2 columns are supplied in paste/upload, column 1 is VIN, column 2 is Note.
- Set C (Test Vehicles) takes highest precedence: if a VIN in A or B is in C, its status is `TEST_VEHICLE` (ignored in discrepancy counts).

---

### Task 1: Comparison Engine & Normalization Core Logic with Unit Tests

**Files:**
- Create: `src/engine.js`
- Test: `tests/engine.test.js`

**Interfaces:**
- Produces:
  - `normalizeVin(vin: string): string`
  - `parsePastedText(text: string): Array<{ vin: string, note: string }>`
  - `computeComparison(listA: VinRecord[], listB: VinRecord[], listC: VinRecord[]): { statusMapA: Map<string, DiffStatus>, statusMapB: Map<string, DiffStatus>, statusMapC: Map<string, string>, stats: ComparisonStats }`

- [ ] **Step 1: Write failing tests for normalization, parser, and comparison engine**

```javascript
// tests/engine.test.js
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
```

- [ ] **Step 2: Run test to verify failure**

Run: `node --test tests/engine.test.js`
Expected: FAIL (Cannot find module `../src/engine.js`)

- [ ] **Step 3: Implement `src/engine.js`**

```javascript
// src/engine.js
export function normalizeVin(vin) {
  if (!vin) return '';
  return String(vin).trim().toUpperCase().replace(/[^A-Z0-9]/gi, '');
}

export function parsePastedText(text) {
  if (!text || typeof text !== 'string') return [];
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const results = [];

  for (const line of lines) {
    let vin = '';
    let note = '';

    if (line.includes('\t')) {
      const parts = line.split('\t');
      vin = normalizeVin(parts[0]);
      note = parts.slice(1).join('\t').trim();
    } else if (line.includes(',') && !line.startsWith('"')) {
      const parts = line.split(',');
      vin = normalizeVin(parts[0]);
      note = parts.slice(1).join(',').trim();
    } else if (line.includes(';') && !line.startsWith('"')) {
      const parts = line.split(';');
      vin = normalizeVin(parts[0]);
      note = parts.slice(1).join(';').trim();
    } else {
      vin = normalizeVin(line);
    }

    if (vin) {
      results.push({ vin, note });
    }
  }
  return results;
}

export function computeComparison(listA = [], listB = [], listC = []) {
  const setC = new Set(listC.map(r => r.vin).filter(Boolean));
  const setB = new Set(listB.map(r => r.vin).filter(Boolean));
  const setA = new Set(listA.map(r => r.vin).filter(Boolean));

  const statusMapA = new Map();
  const statusMapB = new Map();
  const statusMapC = new Map();

  const stats = {
    totalA: listA.length,
    totalB: listB.length,
    totalC: listC.length,
    matched: 0,
    onlyA: 0,
    onlyB: 0,
    testIgnoredInA: 0,
    testIgnoredInB: 0
  };

  for (const item of listA) {
    if (setC.has(item.vin)) {
      statusMapA.set(item.id, 'TEST_VEHICLE');
      stats.testIgnoredInA++;
    } else if (setB.has(item.vin)) {
      statusMapA.set(item.id, 'MATCHED');
      stats.matched++;
    } else {
      statusMapA.set(item.id, 'ONLY_IN_A');
      stats.onlyA++;
    }
  }

  for (const item of listB) {
    if (setC.has(item.vin)) {
      statusMapB.set(item.id, 'TEST_VEHICLE');
      stats.testIgnoredInB++;
    } else if (setA.has(item.vin)) {
      statusMapB.set(item.id, 'MATCHED');
    } else {
      statusMapB.set(item.id, 'ONLY_IN_B');
      stats.onlyB++;
    }
  }

  for (const item of listC) {
    const inA = setA.has(item.vin);
    const inB = setB.has(item.vin);
    if (inA && inB) statusMapC.set(item.id, 'IN_A_AND_B');
    else if (inA) statusMapC.set(item.id, 'IN_A_ONLY');
    else if (inB) statusMapC.set(item.id, 'IN_B_ONLY');
    else statusMapC.set(item.id, 'NOT_IN_A_OR_B');
  }

  return { statusMapA, statusMapB, statusMapC, stats };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/engine.test.js`
Expected: PASS

---

### Task 2: State Persistence & Export Logic

**Files:**
- Create: `src/storage.js`
- Create: `src/export.js`
- Test: `tests/storage-export.test.js`

**Interfaces:**
- Consumes: `src/engine.js`
- Produces:
  - `generateCSV(rows: Array<{ vin: string, status: string, note: string }>): string`
  - `generateMasterComparisonData(listA, listB, listC, comparisonResult)`
  - `createInitialState(): AppState`
  - `validateAndMigrateState(rawState: any): AppState`

- [ ] **Step 1: Write failing tests for export data generation and storage serialization**

```javascript
// tests/storage-export.test.js
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

  assert.equal(exportData.summary.length, 5); // Metric summary rows
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
```

- [ ] **Step 2: Run test to verify failure**

Run: `node --test tests/storage-export.test.js`
Expected: FAIL

- [ ] **Step 3: Implement `src/export.js` and `src/storage.js`**

```javascript
// src/export.js
export function escapeCsvField(field) {
  if (field === null || field === undefined) return '';
  const str = String(field);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function generateCSV(rows, headers = ['VIN', 'Status', 'Note']) {
  const headerLine = headers.map(escapeCsvField).join(',');
  const lines = rows.map(row => {
    return [
      escapeCsvField(row.vin),
      escapeCsvField(row.status || ''),
      escapeCsvField(row.note || '')
    ].join(',');
  });
  return [headerLine, ...lines].join('\r\n');
}

export function generateMasterExportData(listA, listB, listC, comparison) {
  const matched = [];
  const onlyA = [];
  const onlyB = [];
  const testVehicles = [];

  for (const item of listA) {
    const status = comparison.statusMapA.get(item.id);
    if (status === 'MATCHED') matched.push({ vin: item.vin, source: 'List A & List B', note: item.note });
    else if (status === 'ONLY_IN_A') onlyA.push({ vin: item.vin, source: 'List A', note: item.note });
    else if (status === 'TEST_VEHICLE') testVehicles.push({ vin: item.vin, source: 'Found in List A (Ignored)', note: item.note });
  }

  for (const item of listB) {
    const status = comparison.statusMapB.get(item.id);
    if (status === 'ONLY_IN_B') onlyB.push({ vin: item.vin, source: 'List B', note: item.note });
    else if (status === 'TEST_VEHICLE' && !testVehicles.some(t => t.vin === item.vin)) {
      testVehicles.push({ vin: item.vin, source: 'Found in List B (Ignored)', note: item.note });
    }
  }

  const summary = [
    { Metric: 'Total in List A', Count: listA.length },
    { Metric: 'Total in List B', Count: listB.length },
    { Metric: 'Matched Overlap (A & B)', Count: comparison.stats.matched },
    { Metric: 'Discrepancies (Only in A)', Count: comparison.stats.onlyA },
    { Metric: 'Discrepancies (Only in B)', Count: comparison.stats.onlyB },
    { Metric: 'Ignored Test Vehicles in A', Count: comparison.stats.testIgnoredInA },
    { Metric: 'Ignored Test Vehicles in B', Count: comparison.stats.testIgnoredInB },
    { Metric: 'Total Reference Test Vehicles (C)', Count: listC.length }
  ];

  return { summary, matched, onlyA, onlyB, testVehicles };
}
```

```javascript
// src/storage.js
export const STORAGE_KEY = 'vin_compare_app_state_v1';

export function createInitialState() {
  return {
    listA: [],
    listB: [],
    listC: [],
    settings: {
      theme: 'dark',
      autoTrimUpper: true,
      skipTestVehiclesInDiff: true
    }
  };
}

export function validateAndMigrateState(raw) {
  const initial = createInitialState();
  if (!raw || typeof raw !== 'object') return initial;

  const sanitizeList = (arr) => {
    if (!Array.isArray(arr)) return [];
    return arr.filter(item => item && typeof item.vin === 'string').map(item => ({
      id: item.id || (Math.random().toString(36).substring(2, 9) + Date.now().toString(36)),
      vin: String(item.vin).trim().toUpperCase(),
      rawVin: item.rawVin || item.vin,
      note: typeof item.note === 'string' ? item.note : '',
      addedAt: typeof item.addedAt === 'number' ? item.addedAt : Date.now()
    }));
  };

  return {
    listA: sanitizeList(raw.listA),
    listB: sanitizeList(raw.listB),
    listC: sanitizeList(raw.listC),
    settings: {
      theme: raw.settings?.theme === 'light' ? 'light' : 'dark',
      autoTrimUpper: raw.settings?.autoTrimUpper !== false,
      skipTestVehiclesInDiff: raw.settings?.skipTestVehiclesInDiff !== false
    }
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/storage-export.test.js`
Expected: PASS

---

### Task 3: Build Single-File `index.html` Application

**Files:**
- Create: `index.html`
- Create: `tests/app-integrity.test.js`

**Interfaces:**
- Inlines styling, SheetJS parser fallback, UI rendering, reactive state binding, search filters, modals, and file drag-drop handlers.

- [ ] **Step 1: Write integrity test to verify `index.html` structure and scripts**

```javascript
// tests/app-integrity.test.js
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('index.html exists and contains necessary panels and UI markers', () => {
  const html = fs.readFileSync('index.html', 'utf-8');
  assert.match(html, /id="panel-a"/);
  assert.match(html, /id="panel-b"/);
  assert.match(html, /id="panel-c"/);
  assert.match(html, /id="metrics-summary"/);
  assert.match(html, /id="batch-paste-modal"/);
  assert.match(html, /id="export-master-btn"/);
  assert.match(html, /XLSX/i);
});
```

- [ ] **Step 2: Run test to verify failure**

Run: `node --test tests/app-integrity.test.js`
Expected: FAIL

- [ ] **Step 3: Implement comprehensive standalone `index.html`**

Construct `index.html` with:
- Automotive dark/light theme CSS variables and clean typography.
- Three panel responsive layout with sticky stats header.
- Modal for batch pasting / file drag & drop (`.xlsx`, `.csv`, `.txt`).
- Inline note editing with debounced `localStorage` autosave.
- Copy-to-clipboard buttons on each VIN and panel.
- Export to Excel (`.xlsx` with multiple sheets via embedded SheetJS) and CSV.
- Full backup & restore (JSON).

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/app-integrity.test.js`
Expected: PASS

---

### Task 4: End-to-End Functional Verification & Sample Data Test

**Files:**
- Create: `tests/e2e-simulation.test.js`

- [ ] **Step 1: Write comprehensive simulation test covering real-world workflow**
  - Load 100 sample VINs in List A.
  - Load 100 sample VINs in List B (with 80 overlaps, 20 list-B unique).
  - Load 10 test vehicle VINs in List C (5 of which appear in A and B).
  - Assert that metrics exactly calculate: 75 matched, 15 only in A, 15 only in B, 5 ignored test vehicles in A, 5 ignored test vehicles in B.
  - Verify notes persist across updates.
  - Verify JSON backup & restore faithfully reconstructs the state.

- [ ] **Step 2: Run all tests**

Run: `node --test tests/*.test.js`
Expected: ALL PASS
