import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase.js';

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

function tankDocRef(uid) {
  return doc(db, 'tanks', uid);
}

function normalizeTank(parsed) {
  return {
    ...structuredClone(defaultTank),
    ...parsed,
    customParams: { ...structuredClone(defaultTank.customParams), ...(parsed?.customParams || {}) },
  };
}

export async function loadTank(uid) {
  try {
    const snap = await getDoc(tankDocRef(uid));
    if (!snap.exists()) return structuredClone(defaultTank);
    return normalizeTank(snap.data());
  } catch {
    return structuredClone(defaultTank);
  }
}

export async function saveTank(uid, tank) {
  await setDoc(tankDocRef(uid), tank);
}
