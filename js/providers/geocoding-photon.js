// Geocodificación con Photon (Apache 2.0, datos de OpenStreetMap).
// Contrato de un proveedor de geocodificación:
//   search(query, { near: [lon, lat], limit, signal }) -> [Place]
//   reverse({ lat, lon }, { signal }) -> Place | null
// Place = { id, name, address, lat, lon }
export function createPhoton({ baseUrl }) {
  const toPlace = (f) => {
    const p = f.properties || {};
    const [lon, lat] = f.geometry.coordinates;
    const street = [p.street, p.housenumber].filter(Boolean).join(' ');
    const name = p.name || street || p.city || p.state || p.country || '';
    const parts = [
      p.name ? street : '',
      [p.postcode, p.city || p.district].filter(Boolean).join(' '),
      p.state,
      p.country,
    ].filter((x) => x && x !== name);
    const address = [...new Set(parts)].join(', ');
    return { id: `${p.osm_type || ''}${p.osm_id || ''}`, name, address, lat, lon };
  };

  async function getJson(url, signal) {
    const res = await fetch(url, { signal });
    if (!res.ok) throw new Error(`Photon HTTP ${res.status}`);
    return res.json();
  }

  return {
    id: 'photon',
    async search(query, { near, limit = 6, signal } = {}) {
      const u = new URL('/api/', baseUrl);
      u.searchParams.set('q', query);
      u.searchParams.set('limit', String(limit));
      if (near) {
        u.searchParams.set('lon', String(near[0]));
        u.searchParams.set('lat', String(near[1]));
      }
      const data = await getJson(u, signal);
      return (data.features || []).map(toPlace).filter((p) => p.name);
    },
    async reverse({ lat, lon }, { signal } = {}) {
      const u = new URL('/reverse', baseUrl);
      u.searchParams.set('lat', String(lat));
      u.searchParams.set('lon', String(lon));
      const data = await getJson(u, signal);
      const f = data.features?.[0];
      if (!f) return null;
      const place = toPlace(f);
      return { ...place, lat, lon }; // se conserva el punto exacto pulsado
    },
  };
}
