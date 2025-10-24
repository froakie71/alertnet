import React, { useEffect, useState } from 'react';
import { fetchOpenWeatherAlerts, fetchReliefWebPhilippineAdvisories, fetchWeatherApiAlerts, fetchWeatherApiCurrent, fetchWeatherApiForecast } from '../services/weatherService';

export default function AdvisoriesPage() {
  const [reliefweb, setReliefweb] = useState([]);
  const [owm, setOwm] = useState([]);
  const [wapi, setWapi] = useState([]);
  const [loading, setLoading] = useState(true);
  const [wCurrent, setWCurrent] = useState(null);
  const [wForecast, setWForecast] = useState(null);
  const PRESETS = [
    { label: 'Cebu City', lat: 10.3157, lon: 123.8854 },
    { label: 'Metro Manila', lat: 14.5995, lon: 120.9842 },
    { label: 'Davao City', lat: 7.1907, lon: 125.4553 },
    { label: 'Baguio City', lat: 16.4023, lon: 120.5960 },
  ];
  const [presetIndex, setPresetIndex] = useState(0); // default to Cebu City
  const selected = PRESETS[presetIndex];

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [rw, owmAlerts, wAlerts, wCur, wFor] = await Promise.all([
          fetchReliefWebPhilippineAdvisories(10),
          fetchOpenWeatherAlerts(selected.lat, selected.lon),
          fetchWeatherApiAlerts(`${selected.lat},${selected.lon}`),
          fetchWeatherApiCurrent(`${selected.lat},${selected.lon}`),
          fetchWeatherApiForecast(`${selected.lat},${selected.lon}`, 1),
        ]);
        if (!active) return;
        setReliefweb(rw);
        setOwm(owmAlerts);
        setWapi(wAlerts);
        setWCurrent(wCur);
        setWForecast(wFor);
      } catch (e) {
        // ignore for now
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [selected.lat, selected.lon]);

  const pageStyle = { display: 'grid', gap: 16 };
  const card = { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: 16, boxShadow: '0 6px 16px rgba(2,6,23,0.06)' };
  const list = { display: 'grid', gap: 8, marginTop: 8 };
  const item = { padding: 12, border: '1px solid #e5e7eb', borderRadius: 12 };
  const link = { color: '#0ea5e9', textDecoration: 'none', fontWeight: 600 };
  const statGrid = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px,1fr))', gap: 12, marginTop: 8 };
  const statCard = { border: '1px solid #e5e7eb', borderRadius: 12, padding: 12, background: '#f8fafc' };

  return (
    <div style={pageStyle}>
      <h2 style={{ marginTop: 0 }}>Official Advisories</h2>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <label style={{ color: '#64748b' }}>Location:</label>
        <select
          value={presetIndex}
          onChange={(e) => setPresetIndex(parseInt(e.target.value, 10))}
          style={{ height: 36, borderRadius: 8, border: '1px solid #e5e7eb', padding: '0 10px' }}
        >
          {PRESETS.map((p, i) => (
            <option key={p.label} value={i}>{p.label}</option>
          ))}
        </select>
        <span style={{ color: '#94a3b8', fontSize: 12 }}>({selected.lat.toFixed(4)}, {selected.lon.toFixed(4)})</span>
      </div>
      {loading ? <div style={{ color: '#64748b' }}>Loading advisories...</div> : null}

      <section style={card}>
        <h3 style={{ marginTop: 0 }}>Current Weather ({selected.label})</h3>
        {wCurrent ? (
          <div style={statGrid}>
            <div style={statCard}><div style={{ color: '#64748b', fontSize: 12 }}>Condition</div><div style={{ fontWeight: 700 }}>{wCurrent?.current?.condition?.text || '—'}</div></div>
            <div style={statCard}><div style={{ color: '#64748b', fontSize: 12 }}>Temp</div><div style={{ fontWeight: 700 }}>{wCurrent?.current?.temp_c ?? '—'}°C</div></div>
            <div style={statCard}><div style={{ color: '#64748b', fontSize: 12 }}>Feels Like</div><div style={{ fontWeight: 700 }}>{wCurrent?.current?.feelslike_c ?? '—'}°C</div></div>
            <div style={statCard}><div style={{ color: '#64748b', fontSize: 12 }}>Humidity</div><div style={{ fontWeight: 700 }}>{wCurrent?.current?.humidity ?? '—'}%</div></div>
            <div style={statCard}><div style={{ color: '#64748b', fontSize: 12 }}>Wind</div><div style={{ fontWeight: 700 }}>{wCurrent?.current?.wind_kph ?? '—'} kph</div></div>
            <div style={statCard}><div style={{ color: '#64748b', fontSize: 12 }}>Precip</div><div style={{ fontWeight: 700 }}>{wCurrent?.current?.precip_mm ?? 0} mm</div></div>
          </div>
        ) : (
          <div style={{ color: '#64748b' }}>No current data.</div>
        )}
      </section>

      <section style={card}>
        <h3 style={{ marginTop: 0 }}>Today Forecast ({selected.label})</h3>
        {wForecast?.forecast?.forecastday?.length ? (
          <div style={statGrid}>
            <div style={statCard}><div style={{ color: '#64748b', fontSize: 12 }}>Max Temp</div><div style={{ fontWeight: 700 }}>{wForecast.forecast.forecastday[0].day?.maxtemp_c ?? '—'}°C</div></div>
            <div style={statCard}><div style={{ color: '#64748b', fontSize: 12 }}>Min Temp</div><div style={{ fontWeight: 700 }}>{wForecast.forecast.forecastday[0].day?.mintemp_c ?? '—'}°C</div></div>
            <div style={statCard}><div style={{ color: '#64748b', fontSize: 12 }}>Chance of Rain</div><div style={{ fontWeight: 700 }}>{wForecast.forecast.forecastday[0].day?.daily_chance_of_rain ?? 0}%</div></div>
            <div style={statCard}><div style={{ color: '#64748b', fontSize: 12 }}>Total Precip</div><div style={{ fontWeight: 700 }}>{wForecast.forecast.forecastday[0].day?.totalprecip_mm ?? 0} mm</div></div>
            <div style={statCard}><div style={{ color: '#64748b', fontSize: 12 }}>Condition</div><div style={{ fontWeight: 700 }}>{wForecast.forecast.forecastday[0].day?.condition?.text || '—'}</div></div>
          </div>
        ) : (
          <div style={{ color: '#64748b' }}>No forecast data.</div>
        )}
      </section>

      <section style={card}>
        <h3 style={{ marginTop: 0 }}>ReliefWeb (latest)</h3>
        <div style={list}>
          {reliefweb.map((r) => (
            <div key={r.id} style={item}>
              <a href={r?.fields?.url || '#'} target="_blank" rel="noreferrer" style={link}>
                {r?.fields?.title || 'Advisory'}
              </a>
            </div>
          ))}
          {reliefweb.length === 0 ? <div style={{ color: '#64748b' }}>No items.</div> : null}
        </div>
      </section>

      <section style={card}>
        <h3 style={{ marginTop: 0 }}>OpenWeatherMap Alerts ({selected.label})</h3>
        <div style={list}>
          {owm.map((a, i) => (
            <div key={i} style={item}>
              <div style={{ fontWeight: 700 }}>{a.event || 'Weather Alert'}</div>
              <div style={{ color: '#64748b', fontSize: 13 }}>{a.sender_name || ''}</div>
            </div>
          ))}
          {owm.length === 0 ? <div style={{ color: '#64748b' }}>No active alerts</div> : null}
        </div>
      </section>

      <section style={card}>
        <h3 style={{ marginTop: 0 }}>WeatherAPI Alerts ({selected.label})</h3>
        <div style={list}>
          {wapi.map((a, i) => (
            <div key={i} style={item}>{a.headline || a.event || 'Alert'}</div>
          ))}
          {wapi.length === 0 ? <div style={{ color: '#64748b' }}>No active alerts</div> : null}
        </div>
      </section>
    </div>
  );
}
