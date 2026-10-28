import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const html = fs.readFileSync('index.html', 'utf8');
function functionSource(name) {
  const match = html.match(new RegExp(`    (?:async )?function ${name}\\([^]*?\\n    }`));
  assert.ok(match, `Missing ${name}`);
  return match[0];
}

test('multiple imported files retain their own filenames alongside manual entries', async () => {
  const area = { value: '' };
  const state = { listA: [], listNames: {} };
  const context = vm.createContext({
    document: { getElementById: () => area, querySelector: () => ({ value: 'append' }) },
    state, currentModalTarget: 'listA', isSampleDataActive: false,
    updateModalLiveCounter() {}, closeImportModal() {}, recalculateAndRender() {}, showToast() {},
    readFileContent: async file => ({ text: file.text, count: 1, name: file.name }),
    alert() { throw new Error('Unexpected alert'); }, console
  });
  vm.runInContext(['normalizeVin', 'parsePastedText', 'syncImportSources', 'appendTextToPasteArea', 'handleFiles', 'submitImport'].map(functionSource).join('\n'), context);
  area.value = 'MANUAL1';
  await context.handleFiles([{ name: 'first.csv', text: 'VIN1,VIN2' }, { name: 'second.txt', text: 'VIN3' }]);
  context.submitImport();
  assert.deepEqual(Array.from(state.listA, r => [r.vin, r.fileName || '']), [
    ['MANUAL1', ''], ['VIN1', 'first.csv'], ['VIN2', 'first.csv'], ['VIN3', 'second.txt']
  ]);
});

test('CSV export includes each record’s filename', () => {
  let csv = '';
  const state = { listNames: {}, listA: [{ id: 'a', vin: 'VIN1', note: '', fileName: 'source.csv' }], listB: [], listC: [] };
  const context = vm.createContext({ state, comparison: { statusMapA: new Map([['a', 'ONLY_IN_A']]), statusMapB: new Map(), statusMapC: new Map() }, downloadFile: content => { csv = content; }, getExportTimestampString: () => 'date', showToast() {} });
  vm.runInContext(functionSource('exportMasterCSV'), context);
  context.exportMasterCSV();
  assert.match(csv, /"File Name"/);
  assert.match(csv, /"VIN1","ONLY_IN_A","","source.csv"/);
});
