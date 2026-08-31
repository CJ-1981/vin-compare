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
