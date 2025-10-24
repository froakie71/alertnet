import React, { useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

L.Icon.Default.mergeOptions({ iconRetinaUrl: markerIcon2x, iconUrl: markerIcon, shadowUrl: markerShadow });

export default function ReportsMap({ reports }) {
  const LILOAN_CENTER = [10.401, 123.999];
  const LILOAN_BOUNDS = [[10.33, 123.90], [10.47, 124.06]];
  const inBounds = (lat, lng) => {
    if (typeof lat !== 'number' || typeof lng !== 'number') return false;
    const [[sLat, sLng], [nLat, nLng]] = LILOAN_BOUNDS;
    return lat >= sLat && lat <= nLat && lng >= sLng && lng <= nLng;
  };
  const visibleReports = useMemo(() => (reports || []).filter((r) => inBounds(r.location?.lat, r.location?.lng)), [reports]);

  return (
    <MapContainer
      center={LILOAN_CENTER}
      zoom={13}
      maxBounds={LILOAN_BOUNDS}
      maxBoundsViscosity={1.0}
      style={{ height: 420, width: '100%' }}
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />
      {visibleReports.map((r) => (
        <Marker key={r.id} position={[r.location?.lat || 0, r.location?.lng || 0]}>
          <Popup>
            <div>
              <div><strong>{r.type || 'Incident'}</strong> — {r.severity || 'N/A'}</div>
              <div>{r.description || ''}</div>
              <div>{r.timestamp?.toDate ? r.timestamp.toDate().toLocaleString() : ''}</div>
              <div style={{ marginTop: 6 }}>
                <a href={`/reports/${r.id}`} style={{ color: '#1d4ed8', fontWeight: 700 }}>Open</a>
              </div>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
