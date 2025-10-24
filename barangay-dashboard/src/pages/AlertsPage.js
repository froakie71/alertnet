import React, { useEffect, useState } from 'react';
import { createAlert, subscribeAlerts, deleteAlert } from '../services/alertsService';

const LILOAN_BARANGAYS = [
  'Cabadiangan', 'Calero', 'Catarman', 'Cotcot', 'Jubay', 'Lataban', 'Mulao',
  'Poblacion', 'San Roque', 'Santa Cruz', 'Tabla', 'Tayud', 'Yati'
];

function AlertForm({ onCreated }) {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [severity, setSeverity] = useState('Yellow');
  const [channels, setChannels] = useState({ push: true, sms: false });
  const [ok, setOk] = useState('');
  const [selectedAll, setSelectedAll] = useState(true);
  const [selectedBrgys, setSelectedBrgys] = useState(LILOAN_BARANGAYS);

  const onSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      title,
      body,
      severity,
      channels,
      targets: {
        municipality: 'Liloan, Cebu',
        barangays: selectedAll ? LILOAN_BARANGAYS : selectedBrgys,
      },
    };
    await createAlert(payload);
    setTitle('');
    setBody('');
    setSeverity('Yellow');
    setOk('Alert queued');
    setTimeout(() => setOk(''), 2000);
    onCreated && onCreated();
  };

  return (
    <form onSubmit={onSubmit} style={{ display: 'grid', gap: 12 }}>
      <input
        placeholder="Alert title (e.g., Typhoon Aghon Signal 2)"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        style={{ height: 40, border: '1px solid #e5e7eb', borderRadius: 10, padding: '0 12px', background: '#fff' }}
        required
      />
      <textarea
        placeholder="Message body with safety instructions"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={4}
        style={{ border: '1px solid #e5e7eb', borderRadius: 10, padding: 12, background: '#fff' }}
        required
      />
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <label style={{ fontWeight: 600 }}>Severity:</label>
          <select value={severity} onChange={(e) => setSeverity(e.target.value)} style={{ height: 40, borderRadius: 10, border: '1px solid #e5e7eb', padding: '0 10px' }}>
            <option>Yellow</option>
            <option>Orange</option>
            <option>Red</option>
            <option>Signal 1</option>
            <option>Signal 2</option>
            <option>Signal 3</option>
            <option>Signal 4</option>
            <option>Signal 5</option>
          </select>
        </div>
        <div style={{ display: 'flex', gap: 16 }}>
          <label>
            <input type="checkbox" checked={channels.push} onChange={(e) => setChannels({ ...channels, push: e.target.checked })} /> Push
          </label>
          <label>
            <input type="checkbox" checked={channels.sms} onChange={(e) => setChannels({ ...channels, sms: e.target.checked })} /> SMS
          </label>
        </div>
      </div>
      <div style={{ display: 'grid', gap: 8 }}>
        <div style={{ fontWeight: 600 }}>Target Barangays (Liloan)</div>
        <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <input
            type="checkbox"
            checked={selectedAll}
            onChange={(e) => {
              const v = e.target.checked;
              setSelectedAll(v);
              setSelectedBrgys(v ? LILOAN_BARANGAYS : []);
            }}
          />
          All Barangays
        </label>
        {!selectedAll ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 8 }}>
            {LILOAN_BARANGAYS.map((b) => (
              <label key={b} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, border: '1px solid #e5e7eb', borderRadius: 8, padding: '6px 8px', background: '#fff' }}>
                <input
                  type="checkbox"
                  checked={selectedBrgys.includes(b)}
                  onChange={(e) => {
                    const on = e.target.checked;
                    setSelectedBrgys((prev) => (on ? [...prev, b] : prev.filter((x) => x !== b)));
                  }}
                />
                {b}
              </label>
            ))}
          </div>
        ) : null}
      </div>
      <button type="submit" style={{ height: 44, borderRadius: 10, border: 'none', background: 'linear-gradient(90deg,#22c55e,#16a34a)', color: 'white', fontWeight: 700, cursor: 'pointer' }}>Create Alert</button>
      {ok ? <div style={{ background: '#ecfdf5', color: '#065f46', border: '1px solid #a7f3d0', borderRadius: 10, padding: 8, fontWeight: 600 }}>✔ {ok}</div> : null}
    </form>
  );
}

export default function AlertsPage() {
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    const unsub = subscribeAlerts((snap) => {
      setAlerts(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => { unsub(); };
  }, []);

  const chipFor = (sev) => {
    const base = { fontSize: 12, padding: '4px 8px', borderRadius: 999, fontWeight: 700 };
    if (!sev) return { ...base, background: '#e2e8f0' };
    const s = sev.toLowerCase();
    if (s.includes('red')) return { ...base, background: '#fecaca', color: '#7f1d1d' };
    if (s.includes('orange')) return { ...base, background: '#fed7aa', color: '#7c2d12' };
    if (s.includes('yellow')) return { ...base, background: '#fef08a', color: '#713f12' };
    if (s.includes('signal')) return { ...base, background: '#dbeafe', color: '#1e3a8a' };
    return { ...base, background: '#e5e7eb', color: '#0f172a' };
  };

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 16 }}>
        <section style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: 16, boxShadow: '0 6px 16px rgba(2,6,23,0.06)' }}>
          <h2 style={{ marginTop: 0 }}>Compose Alert</h2>
          <AlertForm onCreated={() => {}} />
        </section>
        <section style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: 16, boxShadow: '0 6px 16px rgba(2,6,23,0.06)' }}>
          <h3 style={{ marginTop: 0 }}>Guidelines</h3>
          <ul style={{ marginTop: 8 }}>
            <li>Use Yellow/Orange/Red for rainfall advisories</li>
            <li>Use Signal 1–5 for typhoon warnings</li>
            <li>Enable SMS for urgent alerts</li>
          </ul>
        </section>
      </div>

      <section style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: 16, boxShadow: '0 6px 16px rgba(2,6,23,0.06)' }}>
        <h3 style={{ marginTop: 0 }}>Recent Alerts</h3>
        <div style={{ display: 'grid', gap: 8 }}>
          {alerts.map((a) => (
            <div key={a.id} style={{ padding: 12, border: '1px solid #e5e7eb', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700 }}>{a.title}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={chipFor(a.severity)}>{a.severity}</span>
                  <span style={{ fontSize: 12, padding: '4px 8px', borderRadius: 999, background: '#e2e8f0' }}>{a.status || 'queued'}</span>
                </div>
                {a.targets?.barangays?.length ? (
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
                    {a.targets.barangays.slice(0, 6).map((b) => (
                      <span key={b} style={{ fontSize: 11, padding: '2px 8px', borderRadius: 999, background: '#f1f5f9' }}>{b}</span>
                    ))}
                    {a.targets.barangays.length > 6 ? (
                      <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 999, background: '#e2e8f0' }}>+{a.targets.barangays.length - 6} more</span>
                    ) : null}
                  </div>
                ) : null}
              </div>
              <button onClick={() => deleteAlert(a.id)} style={{ background: '#fee2e2', color: '#7f1d1d', border: '1px solid #fecaca', borderRadius: 8, padding: '6px 10px', fontWeight: 700, cursor: 'pointer' }}>Delete</button>
            </div>
          ))}
          {alerts.length === 0 ? <div style={{ color: '#64748b' }}>No alerts yet.</div> : null}
        </div>
      </section>

      
    </div>
  );
}
