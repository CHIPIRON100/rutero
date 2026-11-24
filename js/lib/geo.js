// Utilidades geográficas. Los puntos son [lon, lat]; las distancias, en metros.
const R = 6371008.8;
const rad = Math.PI / 180;

export function haversine(a, b) {
  const dLat = (b[1] - a[1]) * rad;
  const dLon = (b[0] - a[0]) * rad;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(a[1] * rad) * Math.cos(b[1] * rad) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

export function cumulative(coords) {
  const c = [0];
  for (let i = 1; i < coords.length; i++) c.push(c[i - 1] + haversine(coords[i - 1], coords[i]));
  return c;
}

export function bearing(a, b) {
  const p1 = a[1] * rad;
  const p2 = b[1] * rad;
  const dl = (b[0] - a[0]) * rad;
  const y = Math.sin(dl) * Math.cos(p2);
  const x = Math.cos(p1) * Math.sin(p2) - Math.sin(p1) * Math.cos(p2) * Math.cos(dl);
  return ((Math.atan2(y, x) / rad) + 360) % 360;
}

// Proyecta un punto sobre la ruta. Devuelve la distancia a la línea, la distancia
// recorrida sobre la ruta ("along") y el índice del segmento.
export function projectOnRoute(pt, coords, cum, from = 0, to = coords.length - 1) {
  const kx = Math.cos(pt[1] * rad) * 111320;
  const ky = 110540;
  let best = { dist: Infinity, along: 0, index: 0 };
  const end = Math.min(to, coords.length - 1);
  for (let i = Math.max(0, from); i < end; i++) {
    const ax = (coords[i][0] - pt[0]) * kx;
    const ay = (coords[i][1] - pt[1]) * ky;
    const bx = (coords[i + 1][0] - pt[0]) * kx;
    const by = (coords[i + 1][1] - pt[1]) * ky;
    const dx = bx - ax;
    const dy = by - ay;
    const len2 = dx * dx + dy * dy;
    let t = len2 ? -(ax * dx + ay * dy) / len2 : 0;
    t = Math.max(0, Math.min(1, t));
    const d = Math.hypot(ax + t * dx, ay + t * dy);
    if (d < best.dist) best = { dist: d, along: cum[i] + t * (cum[i + 1] - cum[i]), index: i };
  }
  return best;
}

// Punto situado a `d` metros del inicio de la ruta, con el rumbo del segmento.
export function pointAlong(coords, cum, d) {
  const total = cum[cum.length - 1];
  const dd = Math.max(0, Math.min(total, d));
  let i = 0;
  while (i < cum.length - 2 && cum[i + 1] < dd) i++;
  const seg = cum[i + 1] - cum[i] || 1;
  const t = Math.max(0, Math.min(1, (dd - cum[i]) / seg));
  const a = coords[i];
  const b = coords[i + 1] || a;
  return {
    lon: a[0] + (b[0] - a[0]) * t,
    lat: a[1] + (b[1] - a[1]) * t,
    bearing: bearing(a, b),
  };
}

// Polígono aproximado de un círculo (para el radio de precisión del GPS).
export function circlePolygon(center, radiusM, steps = 48) {
  const [lon, lat] = center;
  const ring = [];
  for (let i = 0; i <= steps; i++) {
    const ang = (i / steps) * 2 * Math.PI;
    const dx = (radiusM * Math.cos(ang)) / (111320 * Math.cos(lat * rad));
    const dy = (radiusM * Math.sin(ang)) / 110540;
    ring.push([lon + dx, lat + dy]);
  }
  return { type: 'Feature', properties: {}, geometry: { type: 'Polygon', coordinates: [ring] } };
}
