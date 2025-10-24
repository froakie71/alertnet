const reliefWebBase = 'https://api.reliefweb.int/v1/reports';

export async function fetchReliefWebPhilippineAdvisories(limit = 10) {
  const params = new URLSearchParams({
    appname: 'alertnet',
    'query[value]': 'Philippines typhoon OR rainfall OR storm',
    'sort[]': 'date:desc',
    limit: String(limit),
    profile: 'full',
  });
  const res = await fetch(`${reliefWebBase}?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch ReliefWeb');
  const data = await res.json();
  return data?.data || [];
}

export async function fetchOpenWeatherAlerts(lat, lon) {
  const key = process.env.REACT_APP_OWM_API_KEY;
  if (!key) return [];
  const params = new URLSearchParams({ lat: String(lat), lon: String(lon), appid: key, exclude: 'minutely,hourly,daily' });
  const res = await fetch(`https://api.openweathermap.org/data/3.0/onecall?${params.toString()}`);
  if (!res.ok) return [];
  const data = await res.json();
  return data?.alerts || [];
}

export async function fetchWeatherApiAlerts(q = 'Philippines') {
  const key = process.env.REACT_APP_WEATHERAPI_KEY;
  if (!key) return [];
  // Try alerts.json first
  try {
    const url = `https://api.weatherapi.com/v1/alerts.json?key=${key}&q=${encodeURIComponent(q)}`;
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      const alerts = data?.alerts?.alert || [];
      if (alerts.length) return alerts;
    }
  } catch {}
  // Fallback to forecast.json?alerts=yes
  try {
    const url2 = `https://api.weatherapi.com/v1/forecast.json?key=${key}&q=${encodeURIComponent(q)}&days=1&aqi=no&alerts=yes`;
    const res2 = await fetch(url2);
    if (!res2.ok) return [];
    const data2 = await res2.json();
    return data2?.alerts?.alert || [];
  } catch {
    return [];
  }
}

export async function fetchWeatherApiCurrent(q) {
  const key = process.env.REACT_APP_WEATHERAPI_KEY;
  if (!key) return null;
  try {
    const url = `https://api.weatherapi.com/v1/current.json?key=${key}&q=${encodeURIComponent(q)}&aqi=no`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    return data || null;
  } catch {
    return null;
  }
}

export async function fetchWeatherApiForecast(q, days = 1) {
  const key = process.env.REACT_APP_WEATHERAPI_KEY;
  if (!key) return null;
  try {
    const url = `https://api.weatherapi.com/v1/forecast.json?key=${key}&q=${encodeURIComponent(q)}&days=${days}&aqi=no&alerts=yes`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    return data || null;
  } catch {
    return null;
  }
}
