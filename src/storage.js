export const STORAGE_KEY = 'vin_compare_app_state_v1';

export const DEFAULT_LIST_NAMES = {
  listA: 'List A (Baseline)',
  listB: 'List B (Comparison)',
  listC: 'List C (Test Vehicles)'
};

export function createInitialState() {
  return {
    listA: [],
    listB: [],
    listC: [],
    listNames: { ...DEFAULT_LIST_NAMES },
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

  const sanitizeNames = (names) => {
    return {
      listA: (names && typeof names.listA === 'string' && names.listA.trim()) ? names.listA.trim() : DEFAULT_LIST_NAMES.listA,
      listB: (names && typeof names.listB === 'string' && names.listB.trim()) ? names.listB.trim() : DEFAULT_LIST_NAMES.listB,
      listC: (names && typeof names.listC === 'string' && names.listC.trim()) ? names.listC.trim() : DEFAULT_LIST_NAMES.listC
    };
  };

  return {
    listA: sanitizeList(raw.listA),
    listB: sanitizeList(raw.listB),
    listC: sanitizeList(raw.listC),
    listNames: sanitizeNames(raw.listNames),
    settings: {
      theme: raw.settings?.theme === 'light' ? 'light' : 'dark',
      autoTrimUpper: raw.settings?.autoTrimUpper !== false,
      skipTestVehiclesInDiff: raw.settings?.skipTestVehiclesInDiff !== false
    }
  };
}
