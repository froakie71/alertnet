import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/firebase';

export function subscribeHouseholds(cb) {
  return onSnapshot(collection(db, 'households'), cb);
}

export function computeOffline(households, minutes = 30) {
  const threshold = Date.now() - minutes * 60 * 1000;
  return households.filter((h) => {
    const t = h.lastOnlineAt?.toDate ? h.lastOnlineAt.toDate().getTime() : (h.lastOnlineAt ? new Date(h.lastOnlineAt).getTime() : 0);
    return !t || t < threshold;
  });
}
