export function normalizeVin(vin) {
  if (!vin) return '';
  return String(vin).trim().toUpperCase().replace(/[^A-Z0-9]/gi, '');
}

export function parsePastedText(text) {
  if (!text || typeof text !== 'string') return [];
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const results = [];

  for (const line of lines) {
    if (line.includes('\t')) {
      const parts = line.split('\t');
      const vin = normalizeVin(parts[0]);
      const note = parts.slice(1).join('\t').trim();
      if (vin) results.push({ vin, note });
      continue;
    }

    const separator = line.includes(';') ? ';' : (line.includes(',') ? ',' : null);
    if (separator && !line.startsWith('"')) {
      const rawParts = line.split(separator).map(p => p.trim()).filter(Boolean);
      
      // If exactly 2 parts and the 2nd part contains spaces / description (e.g. "Note with details"), treat as VIN + Note
      if (rawParts.length === 2 && /\s/.test(rawParts[1])) {
        const vin = normalizeVin(rawParts[0]);
        const note = rawParts[1];
        if (vin) results.push({ vin, note });
      } else {
        // Otherwise treat each item as a separate VIN in a comma/semicolon-separated list
        for (const part of rawParts) {
          const vin = normalizeVin(part);
          if (vin) results.push({ vin, note: '' });
        }
      }
      continue;
    }

    const vin = normalizeVin(line);
    if (vin) {
      results.push({ vin, note: '' });
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
    const inC = setC.has(item.vin);
    const inB = setB.has(item.vin);

    if (inC && inB) {
      statusMapA.set(item.id, 'MATCHED_TEST_VEHICLE');
      stats.testIgnoredInA++;
    } else if (inC) {
      statusMapA.set(item.id, 'TEST_VEHICLE');
      stats.testIgnoredInA++;
    } else if (inB) {
      statusMapA.set(item.id, 'MATCHED');
      stats.matched++;
    } else {
      statusMapA.set(item.id, 'ONLY_IN_A');
      stats.onlyA++;
    }
  }

  for (const item of listB) {
    const inC = setC.has(item.vin);
    const inA = setA.has(item.vin);

    if (inC && inA) {
      statusMapB.set(item.id, 'MATCHED_TEST_VEHICLE');
      stats.testIgnoredInB++;
    } else if (inC) {
      statusMapB.set(item.id, 'TEST_VEHICLE');
      stats.testIgnoredInB++;
    } else if (inA) {
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
