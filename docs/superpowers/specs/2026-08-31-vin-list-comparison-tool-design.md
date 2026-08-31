# Design Specification: 3-Panel VIN Comparison & Test Vehicle Filtering Tool

**Date:** 2026-08-31  
**Status:** Approved  
**Author:** AI Pair Programmer & User  

---

## 1. Overview & Objective
A standalone, zero-dependency, single-file HTML/JS/CSS tool for comparing two lists of Vehicle Identification Numbers (VINs) with a third panel dedicated to known "Test Vehicles" that should be flagged or excluded from discrepancy analysis. The tool supports adding user notes per VIN, full offline local persistence, batch import/paste (with delimiter & column auto-detection), real-time status tagging, and structured CSV/Excel export.

---

## 2. Requirements & Key Capabilities

### 2.1 Functional Requirements
1. **Three-Panel Layout:**
   - **Panel A (List A):** Primary / Baseline list of VINs.
   - **Panel B (List B):** Target / Comparison list of VINs.
   - **Panel C (List C - Test Vehicles):** Reference list of known test vehicle VINs to skip/flag during comparison.
2. **Notes System:**
   - Every VIN in all three panels can have a user-editable text note.
   - Notes are preserved during comparisons, updates, and exports.
3. **Real-Time Comparison & Categorization:**
   - Priority 1: If a VIN in A or B exists in C $\rightarrow$ Categorized as `Test Vehicle (Ignored)`.
   - Priority 2: If a VIN exists in both A and B $\rightarrow$ Categorized as `Matched`.
   - Priority 3: If a VIN exists only in A $\rightarrow$ Categorized as `Only in A`.
   - Priority 4: If a VIN exists only in B $\rightarrow$ Categorized as `Only in B`.
   - Priority 5: Panel C items display match tags showing where they were detected (`Found in A`, `Found in B`, `Found in Both`, `Not in A or B`).
4. **Data Ingestion & Import:**
   - Direct copy-paste modal supporting newlines, tabs, commas, semicolons.
   - Multi-column paste support: if two columns are pasted (e.g. copied from Excel), column 1 is treated as `VIN` and column 2 as `Note`.
   - File drag-and-drop & file upload (`.xlsx`, `.xls`, `.csv`, `.txt`).
   - Manual single VIN + Note entry with instant validation.
   - Append vs. Overwrite modes for imports.
5. **Persistence & Data Safety:**
   - All panel data, notes, and preferences automatically persist to browser `localStorage`.
   - JSON export and restore for full workspace backups.
   - Reset panel or clear all with confirmation modals.
6. **Search & Quick Filtering:**
   - Per-panel search bar filtering across VIN strings and Note text.
   - Per-panel quick status filter pills (e.g. *Show All*, *Only Matched*, *Only Diffs*, *Only Test Vehicles*).
7. **Export Capabilities:**
   - Single panel export to CSV/Excel.
   - Consolidated Master Comparison Report export (multi-sheet Excel or comprehensive CSV).

### 2.2 Non-Functional Requirements
- **Portability:** Single self-contained `index.html` file that runs in any standard browser without local web servers or build steps.
- **Performance:** Sub-10ms diff computations for lists up to 10,000+ VINs using indexed hash sets.
- **UI/UX:** Polished modern responsive dashboard layout with dark/light mode toggle and sticky summary metrics bar.

---

## 3. Architecture & Data Structures

### 3.1 Data Model
```typescript
interface VinRecord {
  id: string;          // Random UUID or nanoid
  vin: string;         // Normalized uppercase VIN (alphanumeric trimmed)
  rawVin: string;      // Original input string
  note: string;        // User-annotated note
  addedAt: number;     // Millisecond timestamp
}

type DiffStatus = 'MATCHED' | 'ONLY_IN_A' | 'ONLY_IN_B' | 'TEST_VEHICLE' | 'UNMATCHED_TEST';

interface AppState {
  listA: VinRecord[];
  listB: VinRecord[];
  listC: VinRecord[];
  settings: {
    theme: 'dark' | 'light';
    autoTrimUpper: boolean;
    skipTestVehiclesInDiff: boolean;
  };
}
```

### 3.2 Comparison Engine Logic
```javascript
function computeComparison(listA, listB, listC) {
  const setC = new Set(listC.map(r => r.vin));
  const setB = new Set(listB.map(r => r.vin));
  const setA = new Set(listA.map(r => r.vin));

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

  const statusMapA = new Map();
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

  const statusMapB = new Map();
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

  const statusMapC = new Map();
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

---

## 4. User Interface & Workflow

1. **Top Header & Metrics Bar:**
   - Displays live counters for List A, List B, Overlap (Matched), List A Discrepancies, List B Discrepancies, and Ignored Test Vehicles.
   - Quick action buttons: Master Excel Export, JSON Backup, Restore, Theme Toggle.
2. **Three Responsive Panels:**
   - **Panel 1 (List A - Baseline)**
   - **Panel 2 (List B - Comparison)**
   - **Panel 3 (List C - Test Vehicles)**
3. **Panel Anatomy:**
   - Header with item count & filter buttons (`All`, `Diffs`, `Matches`, `Test`).
   - Quick search input filtering table rows in real-time.
   - Action bar: `+ Batch Paste`, `+ Upload File (XLSX/CSV)`, `+ Add Row`, `Copy All`, `Clear`.
   - Interactive table:
     - `VIN` column with quick copy button.
     - `Status` badge with clear color-coding (Green = Matched, Amber = Discrepancy, Purple/Blue = Test Vehicle).
     - `Note` input allowing instant inline editing (auto-saved on blur/change).
     - `Delete` row button.
4. **Smart Import Modal:**
   - Textarea for batch pasting raw text or multi-column data.
   - File dropzone supporting drag-and-drop for `.xlsx`, `.csv`, `.txt`.
   - Delimiter preview with column selection (VIN column, Note column).
   - "Replace List" vs. "Append to List" toggle.

---

## 5. Persistence & Storage Strategy
- Data stored under `localStorage.getItem('vin_compare_app_state_v1')`.
- Auto-debounced write (300ms) on any mutation.
- Includes version migration safety and quota detection.

---

## 6. Verification & Testing Plan
- **Verification 1:** Basic 2-list comparison without test vehicles (assert correct matched/only-in-A/only-in-B counts).
- **Verification 2:** Test vehicle exclusion (assert VIN in C flagged as Test Vehicle and excluded from diff counts).
- **Verification 3:** Multi-column Excel/CSV paste and upload parsing with note preservation.
- **Verification 4:** Inline note editing and browser refresh persistence test.
- **Verification 5:** Comprehensive Excel export containing all sheets and computed columns.
