const functions = require('firebase-functions');
const admin = require('firebase-admin');

try { admin.initializeApp(); } catch (e) {}
const region = functions.region('asia-southeast1');

// Trigger when a resident profile status changes
exports.notifyResidentStatusChange = region.firestore
  .document('residentProfiles/{id}')
  .onWrite(async (change, context) => {
    const before = change.before.exists ? change.before.data() : null;
    const after = change.after.exists ? change.after.data() : null;
    if (!after) return null;

    const prev = before?.status || 'pending';
    const next = after.status || 'pending';
    if (prev === next) return null;

    const tokens = Array.isArray(after.fcmTokens) ? [...new Set(after.fcmTokens.filter(Boolean))] : [];
    if (!tokens.length) return null;

    let title = 'Account Update';
    let body = 'Your application status changed.';
    if (next === 'approved') { title = 'Account Approved'; body = 'You may now log in.'; }
    if (next === 'rejected') { title = 'Account Declined'; body = 'Please update details or contact the barangay.'; }

    const message = {
      notification: { title, body },
      tokens,
      data: {
        status: String(next),
        id: String(context.params.id),
      },
      android: {
        priority: 'high',
        notification: { channelId: 'alerts' },
      },
    };

    try {
      const resp = await admin.messaging().sendMulticast(message);
      console.log('push sent', resp.successCount, 'of', tokens.length);
    } catch (err) {
      console.error('push error', err);
    }
    return null;
  });

// Helper to chunk arrays
function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

// Trigger when a new alert is created: fanout push notifications to approved residents
exports.notifyAlertCreated = region.firestore
  .document('alerts/{alertId}')
  .onCreate(async (snap, context) => {
    const alert = snap.data();
    if (!alert) return null;

    // Only process if push channel is enabled
    if (!alert.channels || alert.channels.push !== true) return null;

    const db = admin.firestore();
    const brgys = Array.isArray(alert.targets?.barangays) ? alert.targets.barangays.filter(Boolean) : [];
    let residentTokens = new Set();

    // Firestore 'in' operator supports up to 10 values, so chunk barangays
    const brgyChunks = brgys.length ? chunk(brgys, 10) : [[]];

    for (const bchunk of brgyChunks) {
      let q = db.collection('residentProfiles').where('status', '==', 'approved');
      if (bchunk.length > 0) q = q.where('barangay', 'in', bchunk);
      // Filter to push-enabled residents if available
      try {
        const qs = await q.get();
        qs.forEach((doc) => {
          const d = doc.data() || {};
          if (d.channelPrefs && d.channelPrefs.push === false) return;
          const toks = Array.isArray(d.fcmTokens) ? d.fcmTokens : [];
          toks.filter(Boolean).forEach((t) => residentTokens.add(t));
        });
      } catch (err) {
        console.error('query residents error', err);
      }
    }

    const tokens = Array.from(residentTokens);
    if (!tokens.length) {
      await snap.ref.set({ status: 'sent', sentAt: admin.firestore.FieldValue.serverTimestamp(), sentCount: 0 }, { merge: true });
      return null;
    }

    const title = alert.title || 'Barangay Alert';
    const body = alert.body || '';
    const data = {
      alertId: String(context.params.alertId),
      severity: String(alert.severity || ''),
    };

    let sent = 0;
    for (const tchunk of chunk(tokens, 500)) {
      try {
        const resp = await admin.messaging().sendMulticast({
          tokens: tchunk,
          notification: { title, body },
          data,
          android: { priority: 'high', notification: { channelId: 'alerts' } },
        });
        sent += resp.successCount || 0;
      } catch (err) {
        console.error('alert push error', err);
      }
    }

    await snap.ref.set({ status: 'sent', sentAt: admin.firestore.FieldValue.serverTimestamp(), sentCount: sent }, { merge: true });
    return null;
  });
