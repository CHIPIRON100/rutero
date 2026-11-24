// Formato de distancias, duraciones y horas.
export function fmtDist(m) {
  if (m < 1000) {
    const step = m < 100 ? 10 : 50;
    return `${Math.max(0, Math.round(m / step) * step)} m`;
  }
  const km = m / 1000;
  return `${km.toLocaleString('es-ES', { maximumFractionDigits: km < 100 ? 1 : 0 })} km`;
}

export function fmtDur(s) {
  const min = Math.round(s / 60);
  if (min < 1) return '< 1 min';
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const mm = min % 60;
  return mm ? `${h} h ${mm} min` : `${h} h`;
}

export function fmtClock(ms) {
  return new Date(ms).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
}

// Distancia para locución: "500 metros", "1 kilómetro", "2,5 kilómetros"
export function spokenDist(m) {
  if (m < 950) {
    const r = Math.max(10, Math.round(m / 50) * 50);
    return `${r} metros`;
  }
  const km = Math.round(m / 100) / 10;
  return km === 1 ? '1 kilómetro' : `${km.toLocaleString('es-ES')} kilómetros`;
}
