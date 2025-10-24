import React, { useEffect, useMemo, useState } from 'react';
import { computeOffline, subscribeHouseholds } from '../services/connectivityService';

export default function ConnectivityPage() {
  const [households, setHouseholds] = useState([]);
  const [minutes, setMinutes] = useState(30);

  useEffect(() => {
    const unsub = subscribeHouseholds((snap) => {
      setHouseholds(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  const offline = useMemo(() => computeOffline(households, minutes), [households, minutes]);

  const pageStyle = { display: 'grid', gap: 16 };
  const cards = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px,1fr))', gap: 16 };
  const card = { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: 16, boxShadow: '0 6px 16px rgba(2,6,23,0.06)' };
  const stat = { fontSize: 32, fontWeight: 800 };

  return (
    <div style={pageStyle}>
      <h2 style={{ marginTop: 0 }}>Connectivity Status</h2>

      <section style={cards}>
        <div style={card}>
          <div style={{ fontWeight: 700 }}>Households Tracked</div>
          <div style={stat}>{households.length}</div>
          <div style={{ color: '#64748b' }}>Total devices/households reporting</div>
        </div>
        <div style={card}>
          <div style={{ fontWeight: 700 }}>Offline</div>
          <div style={{ ...stat, color: '#ef4444' }}>{offline.length}</div>
          <div style={{ color: '#64748b' }}>No heartbeat within threshold</div>
        </div>
        <div style={card}>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>Threshold (minutes)</div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input
              type="number"
              min={5}
              value={minutes}
              onChange={(e) => setMinutes(parseInt(e.target.value || '0', 10))}
              style={{ height: 40, width: 120, border: '1px solid #e5e7eb', borderRadius: 10, padding: '0 12px' }}
            />
            <span style={{ color: '#64748b', fontSize: 13 }}>Adjust to tighten/relax offline detection</span>
          </div>
        </div>
      </section>

      <section style={card}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
          <h3 style={{ marginTop: 0 }}>Offline Households</h3>
          <div style={{ color: '#64748b' }}>{offline.length} shown</div>
        </div>
        <div style={{ border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
            <thead style={{ background: '#f1f5f9' }}>
              <tr>
                <th style={{ textAlign: 'left', padding: 12 }}>Household</th>
                <th style={{ textAlign: 'left', padding: 12 }}>Address</th>
                <th style={{ textAlign: 'left', padding: 12 }}>Last Online</th>
              </tr>
            </thead>
            <tbody>
              {offline.map((h, i) => (
                <tr key={h.id} style={{ background: i % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                  <td style={{ padding: 12 }}>{h.name || h.id}</td>
                  <td style={{ padding: 12 }}>{h.address || ''}</td>
                  <td style={{ padding: 12 }}>{h.lastOnlineAt?.toDate ? h.lastOnlineAt.toDate().toLocaleString() : (h.lastOnlineAt || 'Unknown')}</td>
                </tr>
              ))}
              {offline.length === 0 ? (
                <tr>
                  <td colSpan={3} style={{ padding: 12, color: '#64748b' }}>No offline households at the moment.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
