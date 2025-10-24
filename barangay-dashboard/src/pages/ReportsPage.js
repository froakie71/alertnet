import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { subscribeReports } from '../services/reportsService';
import ReportsMap from '../components/ReportsMap';

export default function ReportsPage() {
  const [reports, setReports] = useState([]);

  useEffect(() => {
    const unsub = subscribeReports((snap) => {
      setReports(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  const pageStyle = { display: 'grid', gap: 16 };
  const card = { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: 16, boxShadow: '0 6px 16px rgba(2,6,23,0.06)' };
  const row = { padding: 12, border: '1px solid #e5e7eb', borderRadius: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' };

  const chipFor = (sev) => {
    const base = { fontSize: 12, padding: '4px 8px', borderRadius: 999, fontWeight: 700 };
    if (!sev) return { ...base, background: '#e2e8f0' };
    if (sev.toLowerCase().includes('red')) return { ...base, background: '#fecaca', color: '#7f1d1d' };
    if (sev.toLowerCase().includes('orange')) return { ...base, background: '#fed7aa', color: '#7c2d12' };
    if (sev.toLowerCase().includes('yellow')) return { ...base, background: '#fef08a', color: '#713f12' };
    return { ...base, background: '#e5e7eb', color: '#0f172a' };
  };

  const fmtTime = (t) => {
    if (!t) return '';
    try {
      const d = t.toDate ? t.toDate() : new Date(t);
      return d.toLocaleString();
    } catch {
      return '';
    }
  };

  const LILOAN_BOUNDS = [[10.33, 123.90], [10.47, 124.06]];
  const inBounds = (lat, lng) => {
    if (typeof lat !== 'number' || typeof lng !== 'number') return false;
    const [[sLat, sLng], [nLat, nLng]] = LILOAN_BOUNDS;
    return lat >= sLat && lat <= nLat && lng >= sLng && lng <= nLng;
  };
  const filtered = reports.filter((r) => inBounds(r.location?.lat, r.location?.lng));

  return (
    <div style={pageStyle}>
      <section style={card}>
        <h2 style={{ marginTop: 0 }}>Incident Reports Map</h2>
        <div style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid #e5e7eb' }}>
          <ReportsMap reports={filtered} />
        </div>
      </section>

      <section style={card}>
        <h3 style={{ marginTop: 0 }}>Latest</h3>
        <div style={{ display: 'grid', gap: 8 }}>
          {filtered.map((r) => (
            <Link key={r.id} to={`/reports/${r.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
              <div style={row}>
                <div>
                  <div style={{ fontWeight: 700 }}>{r.type || 'Incident'} — <span style={{ color: '#64748b', fontWeight: 500 }}>{fmtTime(r.timestamp)}</span></div>
                  <div style={{ color: '#64748b', fontSize: 13 }}>{r.description || ''}</div>
                </div>
                <div style={chipFor(r.severity)}>{r.severity || 'N/A'}</div>
              </div>
            </Link>
          ))}
          {filtered.length === 0 ? <div style={{ color: '#64748b' }}>No reports yet in Liloan bounds.</div> : null}
        </div>
      </section>
    </div>
  );
}
