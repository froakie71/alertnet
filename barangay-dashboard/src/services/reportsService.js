import { collection, onSnapshot, orderBy, query, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/firebase';

export function subscribeReports(cb) {
  const q = query(collection(db, 'incidentReports'), orderBy('timestamp', 'desc'));
  return onSnapshot(q, cb);
}

export function subscribeReport(id, cb) {
  return onSnapshot(doc(db, 'incidentReports', id), cb);
}

export async function dispatchReport(id, extra = {}) {
  await updateDoc(doc(db, 'incidentReports', id), {
    status: 'dispatched',
    dispatchedAt: serverTimestamp(),
    ...extra,
  });
}

export async function startDispatchReport(id, extra = {}) {
  await updateDoc(doc(db, 'incidentReports', id), {
    status: 'dispatching',
    dispatchedAt: serverTimestamp(),
    ...extra,
  });
}
