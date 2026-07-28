const STORAGE_KEY = 'aquarium-catalog:my-tank:v1';

export const defaultTank = {
  stockedIds: [],
  useCustomParams: false,
  customParams: {
    tempMin: null,
    tempMax: null,
    phMin: null,
    phMax: null,
    ghMin: null,
    ghMax: null,
    khMin: null,
    khMax: null,
    sizeGallons: null,
    lighting: null,
  },
};

export function loadTank() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return structuredClone(defaultTank);
    const parsed = JSON.parse(raw);
    return {
      ...structuredClone(defaultTank),
      ...parsed,
      customParams: { ...structuredClone(defaultTank.customParams), ...(parsed.customParams || {}) },
    };
  } catch {
    return structuredClone(defaultTank);
  }
}

export function saveTank(tank) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tank));
}
