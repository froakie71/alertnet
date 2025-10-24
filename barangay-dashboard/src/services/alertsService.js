import { addDoc, collection, onSnapshot, orderBy, query, serverTimestamp, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase/firebase';

export async function createAlert(docData) {
  // Create only the alert document
  return addDoc(collection(db, 'alerts'), {
    ...docData,
    status: 'queued',
    createdAt: serverTimestamp(),
  });
}

export function subscribeAlerts(cb) {
  const q = query(collection(db, 'alerts'), orderBy('createdAt', 'desc'));
  return onSnapshot(q, cb);
}

export async function deleteAlert(alertId) {
  // Delete only the alert doc
  await deleteDoc(doc(db, 'alerts', alertId));
}
