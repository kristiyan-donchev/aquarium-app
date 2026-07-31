import { doc, getDoc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import { db, auth } from './firebase.js';

function userDocRef(uid) {
  return doc(db, 'users', uid);
}

function fallbackName(email) {
  if (!email) return 'Anonymous';
  return email.split('@')[0];
}

export async function syncUserProfile(user) {
  const ref = userDocRef(user.uid);
  const snap = await getDoc(ref);
  if (snap.exists()) return;
  // Read the live auth.currentUser rather than the possibly-stale `user` snapshot passed in —
  // updateProfile() mutates it in place, so this reflects a just-set display name even if this
  // call raced against a signup flow that's still finishing.
  const liveName = auth.currentUser?.uid === user.uid ? auth.currentUser?.displayName : null;
  await setDoc(ref, {
    displayName: liveName || user.displayName || fallbackName(user.email),
    createdAt: serverTimestamp(),
  });
}

// Used right at signup, when we know for certain no profile doc exists yet and
// want the chosen display name to win deterministically (no read-then-write race).
export async function createUserProfile(uid, displayName) {
  await setDoc(userDocRef(uid), { displayName, createdAt: serverTimestamp() });
}

export async function getUserProfile(uid) {
  const snap = await getDoc(userDocRef(uid));
  if (!snap.exists()) return null;
  return { uid, ...snap.data() };
}

export async function updateDisplayName(uid, displayName) {
  await updateDoc(userDocRef(uid), { displayName });
}
