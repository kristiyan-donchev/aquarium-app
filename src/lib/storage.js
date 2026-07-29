import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { db } from './firebase.js';

export const defaultCustomParams = {
  waterType: null,
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
};

function tanksCollection(uid) {
  return collection(db, 'tanks', uid, 'userTanks');
}

function tankDocRef(uid, tankId) {
  return doc(db, 'tanks', uid, 'userTanks', tankId);
}

function normalizeTank(id, data) {
  return {
    id,
    name: data?.name || 'My Tank',
    stockedIds: Array.isArray(data?.stockedIds) ? data.stockedIds : [],
    useCustomParams: Boolean(data?.useCustomParams),
    customParams: { ...structuredClone(defaultCustomParams), ...(data?.customParams || {}) },
  };
}

export async function listTanks(uid) {
  try {
    const q = query(tanksCollection(uid), orderBy('createdAt', 'asc'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => normalizeTank(d.id, d.data()));
  } catch {
    return [];
  }
}

export async function createTank(uid, name) {
  const data = {
    name,
    stockedIds: [],
    useCustomParams: false,
    customParams: structuredClone(defaultCustomParams),
    createdAt: serverTimestamp(),
  };
  const ref = await addDoc(tanksCollection(uid), data);
  return normalizeTank(ref.id, data);
}

export async function saveTank(uid, tankId, tank) {
  const { id, ...data } = tank;
  await setDoc(tankDocRef(uid, tankId), data, { merge: true });
}

export async function renameTank(uid, tankId, name) {
  await updateDoc(tankDocRef(uid, tankId), { name });
}

export async function deleteTank(uid, tankId) {
  await deleteDoc(tankDocRef(uid, tankId));
}
