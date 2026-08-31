# 🚗 VIN Tri-Panel Comparator & Test Vehicle Filter

A standalone, high-performance HTML/JS/CSS tool for comparing two lists of Vehicle Identification Numbers (VINs) while ignoring/flagging known test vehicles.

---

## 🌟 Key Features

1. **3-Panel Dashboard Layout:**
   - **List A (Baseline):** Primary source VIN list.
   - **List B (Comparison):** Target comparison VIN list.
   - **List C (Test Vehicles):** Known test vehicles to flag and exclude from discrepancy counts.
2. **Inline Editable Notes:**
   - Dedicated Note column for every VIN across all 3 panels.
   - Edit notes directly in the table; changes are automatically persisted.
3. **Local Offline Persistence:**
   - Automatic debounced synchronization to browser `localStorage`.
   - Full workspace JSON backup & restore.
4. **Smart Data Ingestion:**
   - Direct copy-paste supporting newlines, tabs, commas, and semicolons.
   - 2-Column paste auto-detection: pastes `VIN <tab> Note` directly into columns.
   - Drag-and-drop & file upload support for `.xlsx`, `.xls`, `.csv`, `.txt`.
   - Single VIN manual add with instant normalization.
5. **Real-time Status Badges & Metrics Bar:**
   - Live metrics: Total in A & B, Matched ($A \cap B$), Discrepancies (Only in A, Only in B), and Test Vehicles Ignored.
   - Per-panel search (filters both VIN and Note) and status dropdown filters.
   - Quick 1-click VIN copy button.
6. **Excel & CSV Export:**
   - **Master Excel (.xlsx):** Multi-sheet workbook with Summary metrics, Matched, Only in A, Only in B, and Test Vehicles.
   - **Master CSV (.csv):** Consolidated export with all columns and statuses.

---

## 🚀 How to Run

1. Simply double-click [**`index.html`**](file:///c:/Users/Chimin.Jung/OneDrive%20-%20Lotus%20Tech%20Innovation%20Centre%20GmbH/Documents/Obsidian%20Vault/scripts/vin-compare/index.html) to open it directly in Chrome, Edge, Safari, Firefox, or inside an Obsidian webview.
2. No server, build tools, or internet connection required.

---

## 🧪 Running Automated Tests

Run the test suite using Node.js:
```bash
npm test
```
