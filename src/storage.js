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
