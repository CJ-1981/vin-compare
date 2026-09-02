# 🚗 VIN Tri-Panel Comparator & Test Vehicle Filter `v1.2.0`

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
3. **Multi-Select Status Filter Dropdown:**
   - Popover dropdown filter in each panel allowing multi-selection of statuses (`Matched`, `Only Here`, `Test Vehicle`, etc.).
   - Includes quick **"Select All"** and **"Clear"** buttons with live button labels reflecting selected count.
4. **Interactive Column Sorting:**
   - Click any column header (`#`, `VIN`, `Status`/`Detected In`, `Note`) to cycle between **Ascending (`▲`)**, **Descending (`▼`)**, and **Default Index Order**.
   - Sort state is maintained independently per panel.
5. **Spacious Add & Batch Import Modal Window:**
   - Large, comfortable vertical modal (`86vh` height, max 900px width) with smooth scrollbar.
   - Live counter dynamically reporting **"Lines: X | Valid VINs detected: Y"** as you type or paste.
   - 1-click **"📋 Paste Clipboard"** and **"Clear"** shortcuts.
   - Supports long vertical lists of VINs (newline, comma, semicolon, or tab-delimited with notes), plus drag-and-drop for `.xlsx`, `.xls`, `.csv`, `.txt`.
6. **List Swap (A ⇄ B):**
   - Instant 1-click swap button (`⇄ Swap A & B`) in the header toolbar to exchange contents between List A and List B with real-time recalculation.
7. **Inline Editable Notes:**
   - Dedicated Note column for every VIN across all 3 panels.
   - Edit notes directly in the table; changes are automatically persisted.
8. **Local Offline Persistence:**
   - Automatic debounced synchronization to browser `localStorage`.
   - Full workspace JSON backup & restore.
9. **Real-time Status Badges & Metrics Bar:**
   - Live metrics: Total in A & B, Matched ($A \cap B$), Discrepancies (Only in A, Only in B), and Test Vehicles Ignored.
   - Per-panel search (filters both VIN and Note).
   - Quick 1-click VIN copy button.
10. **Excel & CSV Export:**
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
