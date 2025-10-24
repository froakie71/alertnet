import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { subscribeReport, startDispatchReport } from '../services/reportsService';

export default function ReportDetailPage() {
  const { id } = useParams();
  const nav = useNavigate();
  const [doc, setDoc] = useState(null);

  useEffect(() => {
    if (!id) return;
    const unsub = subscribeReport(id, (snap) => setDoc({ id: snap.id, ...snap.data() }));
    return () => unsub && unsub();
  }, [id]);

  if (!doc) return <div>Loading...</div>;

  const card = { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: 16, boxShadow: '0 6px 16px rgba(2,6,23,0.06)' };
  const row = { display: 'grid', gridTemplateColumns: '160px 1fr', gap: 8 };

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <section style={card}>
        <h2 style={{ marginTop: 0 }}>Incident Details</h2>
        <div style={row}><div style={{color:'#64748b'}}>ID</div><div>{doc.id}</div></div>
        <div style={row}><div style={{color:'#64748b'}}>Severity</div><div>{doc.severity || ''}</div></div>
        <div style={row}><div style={{color:'#64748b'}}>Description</div><div>{doc.description || ''}</div></div>
        <div style={row}><div style={{color:'#64748b'}}>Location</div><div>{doc.location?.lat?.toFixed?.(5)}, {doc.location?.lng?.toFixed?.(5)}</div></div>
        <div style={row}><div style={{color:'#64748b'}}>Barangay</div><div>{doc.barangay || ''}</div></div>
        <div style={{ marginTop: 12, display: 'flex', gap: 8, alignItems: 'center' }}>
          <button
            disabled={doc.status === 'dispatching' || doc.status === 'dispatched'}
            onClick={async () => { await startDispatchReport(doc.id); }}
            style={{ background: '#dbeafe', border: '1px solid #bfdbfe', color: '#1e3a8a', padding: '8px 12px', borderRadius: 8, fontWeight: 700, cursor: 'pointer', opacity: (doc.status === 'dispatching' || doc.status === 'dispatched') ? 0.6 : 1 }}
          >{doc.status === 'dispatching' || doc.status === 'dispatched' ? 'Dispatching…' : 'Dispatch Responders'}</button>
          <span style={{ color: '#64748b', fontSize: 13 }}>Status: {doc.status || 'open'}</span>
          <button onClick={() => nav(-1)} style={{ padding: '8px 12px', borderRadius: 8 }}>Close</button>
        </div>
      </section>
    </div>
  );
}
