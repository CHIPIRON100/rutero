# Servidor propio (rutas y búsqueda)

Los servidores públicos de Valhalla y Photon son para pruebas. Para publicar o vender la app necesitas los tuyos. El software es gratuito y de código abierto; lo que cuesta es la máquina donde corre.

> Nota: esta guía es un punto de partida y **no está probada de extremo a extremo**. Los nombres de variables y las versiones de las imágenes pueden cambiar; consulta la documentación oficial de cada proyecto.

## Qué necesitas

- Un servidor Linux (VPS) con Docker. Para solo España, Valhalla y Photon caben en una máquina modesta (unos 4 GB de RAM y 30-40 GB de disco como orden de magnitud). Hay proveedores con capas gratuitas para empezar, pero su disponibilidad y condiciones cambian, así que compruébalas antes de depender de ellas.
- Un dominio o subdominio con HTTPS (CORS habilitado hacia el dominio de tu app).

## Valhalla (rutas)

Imagen de la comunidad `ghcr.io/gis-ops/docker-valhalla/valhalla`. Ejemplo de `docker-compose.yml`:

```yaml
services:
  valhalla:
    image: ghcr.io/gis-ops/docker-valhalla/valhalla:latest
    ports: ["8002:8002"]
    volumes: ["./valhalla_data:/custom_files"]
    environment:
      - tile_urls=https://download.geofabrik.de/europe/spain-latest.osm.pbf
      - use_tiles_ignore_pbf=True
      - build_elevation=False
      - build_admins=True
      - build_time_zones=True
      - server_threads=2
```

La primera vez descarga el mapa de España y construye el grafo (puede tardar un buen rato). Después, la API queda en `http://TU_SERVIDOR:8002/route`.

## Photon (búsqueda)

Photon necesita un índice de búsqueda. GraphHopper publica volcados semanales (`download1.graphhopper.com/public`), también por país. Consulta el README de [komoot/photon](https://github.com/komoot/photon): hay que arrancarlo con `-cors-any` (o `-cors-origin`) para que el navegador pueda llamarlo.

Importante: Photon solo indexa por defecto en inglés, alemán, francés e italiano más el nombre local; para España el nombre local ya sale en español.

## Conectar la app a tus servidores

Sin tocar el código, desde la consola del navegador de la app:

```js
localStorage.setItem('rutalibre.config', JSON.stringify({
  endpoints: {
    valhalla: 'https://rutas.tudominio.com',
    photon: 'https://buscar.tudominio.com',
  },
}));
location.reload();
```

Cuando tengas servidores fijos, cambia los valores por defecto en `js/core/config.js`. En la v3 habrá una pantalla de ajustes para hacerlo sin consola.

## Teselas del mapa

OpenFreeMap es gratuito y de uso comercial, pero depende de que su proyecto siga funcionando con donaciones. Para no depender de nadie, el mismo proyecto es de código abierto y publica descargas del planeta para alojarlas tú. Es la parte más pesada (cientos de GB para el planeta completo); para una sola región conviene generar tus propias teselas con Planetiler.
