import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, orderBy, query, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase.js';

function postsCollection() {
  return collection(db, 'posts');
}

function repliesCollection(postId) {
  return collection(db, 'posts', postId, 'replies');
}

function postDocRef(postId) {
  return doc(db, 'posts', postId);
}

function toDate(value) {
  return value && typeof value.toDate === 'function' ? value.toDate() : value instanceof Date ? value : null;
}

function normalizePost(id, data) {
  return {
    id,
    authorId: data.authorId,
    authorName: data.authorName || 'Anonymous',
    title: data.title || '',
    body: data.body || '',
    createdAt: toDate(data.createdAt),
  };
}

function normalizeReply(id, data) {
  return {
    id,
    authorId: data.authorId,
    authorName: data.authorName || 'Anonymous',
    body: data.body || '',
    createdAt: toDate(data.createdAt),
  };
}

export async function listPosts() {
  const q = query(postsCollection(), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => normalizePost(d.id, d.data()));
}

export async function listPostsByAuthor(uid) {
  const all = await listPosts();
  return all.filter((p) => p.authorId === uid);
}

export async function getPost(postId) {
  const snap = await getDoc(postDocRef(postId));
  if (!snap.exists()) return null;
  return normalizePost(snap.id, snap.data());
}

export async function createPost(uid, authorName, title, body) {
  const ref = await addDoc(postsCollection(), {
    authorId: uid,
    authorName,
    title,
    body,
    createdAt: serverTimestamp(),
  });
  return normalizePost(ref.id, { authorId: uid, authorName, title, body, createdAt: new Date() });
}

export async function deletePost(postId) {
  await deleteDoc(postDocRef(postId));
}

export async function listReplies(postId) {
  const q = query(repliesCollection(postId), orderBy('createdAt', 'asc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => normalizeReply(d.id, d.data()));
}

export async function createReply(postId, uid, authorName, body) {
  const ref = await addDoc(repliesCollection(postId), {
    authorId: uid,
    authorName,
    body,
    createdAt: serverTimestamp(),
  });
  return normalizeReply(ref.id, { authorId: uid, authorName, body, createdAt: new Date() });
}

export async function deleteReply(postId, replyId) {
  await deleteDoc(doc(db, 'posts', postId, 'replies', replyId));
}
