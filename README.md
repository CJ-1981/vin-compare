# 🚗 VIN Tri-Panel Comparator & Test Vehicle Filter `v1.1.0`

A standalone, high-performance HTML/JS/CSS tool for comparing two lists of Vehicle Identification Numbers (VINs) while ignoring/flagging known test vehicles.

---

## 🌟 Key Features

1. **3-Panel Dashboard Layout:**
   - **List A (Baseline):** Primary source VIN list.
   - **List B (Comparison):** Target comparison VIN list.
   - **List C (Test Vehicles):** Known test vehicles to flag and exclude from discrepancy counts.
2. **List Renaming:**
   - Click any panel header title or the `✏️` edit button to rename `List A`, `List B`, or `List C` to custom labels (e.g., `Factory Inventory`, `Port Delivery`, `Mule Prototypes`).
   - Custom names dynamically propagate across live metrics counters, import dialogs, Master Excel sheets/metrics, and CSV exports.
3. **Interactive Column Sorting:**
   - Click any column header (`#`, `VIN`, `Status`/`Detected In`, `Note`) to cycle between **Ascending (`▲`)**, **Descending (`▼`)**, and **Default Index Order**.
   - Sort state is maintained independently per panel.
4. **List Swap (A ⇄ B):**
   - Instant 1-click swap button (`⇄ Swap A & B`) in the header toolbar to exchange contents between List A and List B with real-time recalculation.
5. **Inline Editable Notes:**
   - Dedicated Note column for every VIN across all 3 panels.
   - Edit notes directly in the table; changes are automatically persisted.
6. **Local Offline Persistence:**
   - Automatic debounced synchronization to browser `localStorage`.
   - Full workspace JSON backup & restore.
7. **Smart Multi-Format Data Ingestion:**
   - Direct copy-paste supporting newlines, commas, semicolons, and tabs.
   - Multi-VIN entry: accepts lists separated by commas (e.g. `VIN1, VIN2, VIN3`) or newlines.
   - 2-Column paste auto-detection: pastes `VIN <tab> Note` directly into columns.
   - Drag-and-drop & file upload support for `.xlsx`, `.xls`, `.csv`, `.txt`.
   - Single/batch manual add prompt with instant normalization.
8. **Real-time Status Badges & Metrics Bar:**
   - Live metrics: Total in A & B, Matched ($A \cap B$), Discrepancies (Only in A, Only in B), and Test Vehicles Ignored.
   - Per-panel search (filters both VIN and Note) and status dropdown filters.
   - Quick 1-click VIN copy button.
9. **Excel & CSV Export:**
   - **Master Excel (.xlsx):** Multi-sheet workbook with Summary metrics, Matched Overlap, Only in List A, Only in List B, and Test Vehicles, using your custom list names.
   - **Master CSV (.csv):** Consolidated export with all columns, statuses, and custom list names.

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
