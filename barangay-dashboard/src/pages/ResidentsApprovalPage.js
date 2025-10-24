import React, { useEffect, useState } from 'react';
import { approveResident, rejectResident, subscribePendingResidents, subscribeApprovedResidents } from '../services/residentsService';

export default function ResidentsApprovalPage() {
  const [items, setItems] = useState([]);
  const [approved, setApproved] = useState([]);

  useEffect(() => {
    const unsub = subscribePendingResidents((snap) => {
      setItems(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = subscribeApprovedResidents((snap) => {
      setApproved(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  const card = { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: 16, boxShadow: '0 6px 16px rgba(2,6,23,0.06)' };

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <section style={card}>
        <h2 style={{ marginTop: 0 }}>Residents — Pending Approvals</h2>
        <div style={{ display: 'grid', gap: 8 }}>
          {items.map((u) => (
            <div key={u.id} style={{ padding: 12, border: '1px solid #e5e7eb', borderRadius: 12, display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 700 }}>{u.fullName || u.lastName || u.id}</div>
                <div style={{ color: '#64748b', fontSize: 13 }}>{u.email || ''} · {u.phoneNumber || ''}</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
                  <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 999, background: '#f1f5f9' }}>{u.barangay}</span>
                  {(u.familyMembers || []).slice(0, 4).map((m) => (
                    <span key={m} style={{ fontSize: 11, padding: '2px 8px', borderRadius: 999, background: '#e2e8f0' }}>{m}</span>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => approveResident(u.id)} style={{ background: '#dcfce7', border: '1px solid #86efac', color: '#166534', padding: '6px 10px', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}>Approve</button>
                <button onClick={() => rejectResident(u.id)} style={{ background: '#fee2e2', border: '1px solid #fecaca', color: '#7f1d1d', padding: '6px 10px', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}>Reject</button>
              </div>
            </div>
          ))}
          {items.length === 0 ? <div style={{ color: '#64748b' }}>No pending residents.</div> : null}
        </div>
      </section>

      <section style={card}>
        <h2 style={{ marginTop: 0 }}>Residents — Approved</h2>
        <div style={{ display: 'grid', gap: 8 }}>
          {approved.map((u) => (
            <div key={u.id} style={{ padding: 12, border: '1px solid #e5e7eb', borderRadius: 12, display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 700 }}>{u.fullName || u.lastName || u.id}</div>
                <div style={{ color: '#64748b', fontSize: 13 }}>{u.email || ''} · {u.phoneNumber || ''}</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
                  <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 999, background: '#f1f5f9' }}>{u.barangay}</span>
                  {(u.familyMembers || []).slice(0, 4).map((m) => (
                    <span key={m} style={{ fontSize: 11, padding: '2px 8px', borderRadius: 999, background: '#e2e8f0' }}>{m}</span>
                  ))}
                </div>
              </div>
              <div style={{ color: '#16a34a', fontWeight: 700 }}>Approved</div>
            </div>
          ))}
          {approved.length === 0 ? <div style={{ color: '#64748b' }}>No approved residents yet.</div> : null}
        </div>
      </section>
    </div>
  );
}
