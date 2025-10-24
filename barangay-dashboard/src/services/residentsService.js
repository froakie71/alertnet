import { collection, deleteDoc, doc, onSnapshot, orderBy, query, updateDoc, where, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/firebase';

export function subscribePendingResidents(cb) {
  const col = collection(db, 'residentProfiles');
  const q1 = query(col, where('status', '==', 'pending'), orderBy('createdAt', 'desc'));
  let unsub = () => {};
  unsub = onSnapshot(q1, cb, (err) => {
    // If missing composite index, fall back so UI still works.
    if (err?.code === 'failed-precondition') {
      const q2 = query(col, where('status', '==', 'pending'));
      unsub = onSnapshot(q2, cb);
    } else {
      // eslint-disable-next-line no-console
      console.error(err);
    }
  });
  return () => unsub();
}

export function subscribeApprovedResidents(cb) {
  const col = collection(db, 'residentProfiles');
  const q1 = query(col, where('status', '==', 'approved'), orderBy('createdAt', 'desc'));
  let unsub = () => {};
  unsub = onSnapshot(q1, cb, (err) => {
    if (err?.code === 'failed-precondition') {
      const q2 = query(col, where('status', '==', 'approved'));
      unsub = onSnapshot(q2, cb);
    } else {
      // eslint-disable-next-line no-console
      console.error(err);
    }
  });
  return () => unsub();
}

export async function approveResident(id) {
  await updateDoc(doc(db, 'residentProfiles', id.toLowerCase()), {
    status: 'approved',
    approvedAt: serverTimestamp(),
  });
}

export async function rejectResident(id) {
  const ref = doc(db, 'residentProfiles', id.toLowerCase());
  // Mark rejected first so Cloud Function can notify the resident
  await updateDoc(ref, {
    status: 'rejected',
    rejectedAt: serverTimestamp(),
  });
  // Small delay gives the function a chance to read the doc (optional)
  await new Promise((r) => setTimeout(r, 300));
  await deleteDoc(ref);
}
