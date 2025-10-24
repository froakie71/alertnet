import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { subscribeAlerts } from '../services/alertsService';
import { subscribeReports } from '../services/reportsService';
import { subscribeHouseholds, computeOffline } from '../services/connectivityService';

export default function DashboardPage() {
  const [alertsCount, setAlertsCount] = useState(0);
  const [reports, setReports] = useState([]);
  const [households, setHouseholds] = useState([]);

  useEffect(() => {
    const unsubA = subscribeAlerts((snap) => setAlertsCount(snap.size));
    const unsubR = subscribeReports((snap) => setReports(snap.docs.map((d) => ({ id: d.id, ...d.data() }))));
    const unsubH = subscribeHouseholds((snap) => setHouseholds(snap.docs.map((d) => ({ id: d.id, ...d.data() }))));
    return () => { unsubA(); unsubR(); unsubH(); };
  }, []);

  const last24hReports = useMemo(() => {
    const cutoff = Date.now() - 24 * 60 * 60 * 1000;
    return reports.filter((r) => {
      const t = r.timestamp?.toDate ? r.timestamp.toDate().getTime() : (r.timestamp ? new Date(r.timestamp).getTime() : 0);
      return t > cutoff;
    }).length;
  }, [reports]);

  const offlineCount = useMemo(() => computeOffline(households, 30).length, [households]);

  const pageStyle = { display: 'grid', gap: 16 };
  const cards = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px,1fr))', gap: 16 };
  const card = { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: 16, boxShadow: '0 6px 16px rgba(2,6,23,0.06)' };
  const title = { fontSize: 18, fontWeight: 700, margin: 0 };
  const stat = { fontSize: 32, fontWeight: 800 };
  const linkBtn = { textDecoration: 'none', background: '#0ea5e9', color: 'white', padding: '8px 12px', borderRadius: 10, fontWeight: 600 };

  return (
    <div style={pageStyle}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
        <h2 style={{ margin: 0 }}>Dashboard</h2>
        <span style={{ color: '#64748b' }}>Overview of alerts, reports, connectivity, advisories</span>
      </div>

      <section style={cards}>
        <div style={card}>
          <div style={title}>Alerts</div>
          <div style={stat}>{alertsCount}</div>
          <div style={{ color: '#64748b', marginBottom: 8 }}>Total alerts in system</div>
          <Link to="/alerts" style={linkBtn}>Manage Alerts</Link>
        </div>
        <div style={card}>
          <div style={title}>Reports (24h)</div>
          <div style={stat}>{last24hReports}</div>
          <div style={{ color: '#64748b', marginBottom: 8 }}>New incident reports</div>
          <Link to="/reports" style={linkBtn}>View Reports</Link>
        </div>
        <div style={card}>
          <div style={title}>Offline</div>
          <div style={stat}>{offlineCount}</div>
          <div style={{ color: '#64748b', marginBottom: 8 }}>Households beyond 30 min</div>
          <Link to="/connectivity" style={linkBtn}>Connectivity</Link>
        </div>
        <div style={card}>
          <div style={title}>Advisories</div>
          <div style={stat}>PH</div>
          <div style={{ color: '#64748b', marginBottom: 8 }}>Official sources aggregated</div>
          <Link to="/advisories" style={linkBtn}>See Advisories</Link>
        </div>
      </section>

      <section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div style={card}>
          <div style={title}>Quick Actions</div>
          <div style={{ marginTop: 8, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Link to="/alerts" style={linkBtn}>Create Alert</Link>
            <Link to="/reports" style={{ ...linkBtn, background: '#22c55e' }}>Open Map</Link>
            <Link to="/connectivity" style={{ ...linkBtn, background: '#f59e0b' }}>Check Offline</Link>
          </div>
        </div>
        <div style={card}>
          <div style={title}>Tips</div>
          <ul>
            <li>Use Yellow/Orange/Red for rainfall advisories</li>
            <li>Use Signal 1–5 for typhoon warnings</li>
            <li>Enable SMS channel for critical alerts</li>
          </ul>
        </div>
      </section>
    </div>
  );
}
