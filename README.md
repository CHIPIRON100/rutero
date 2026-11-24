# RutaLibre · v1.0.0

Navegador tipo Google Maps hecho solo con servicios y datos abiertos: sin Google, sin claves de API, sin cuentas y sin coste en esta versión.

## Qué hace la v1

- Mapa vectorial de OpenStreetMap (gira, inclina, zoom).
- Tu posición en tiempo real.
- Buscador de lugares y direcciones con autocompletado.
- Pulsación larga en el mapa para elegir un punto cualquiera.
- Rutas en coche, bici y a pie, con tiempo, distancia, hora de llegada y lista de pasos.
- Origen personalizado («Origen aquí») o tu ubicación.
- Navegación giro a giro: instrucciones en pantalla y por voz, cámara que te sigue, aviso de llegada y recálculo si te sales de la ruta.
- Botón **Simular** para probar la navegación sin moverte de casa.
- Instalable en el móvil como app (PWA) y con la interfaz preparada para otros idiomas.

## Publicarla en GitHub Pages

1. Crea un repositorio nuevo (por ejemplo `rutalibre`) en GitHub.
2. Sube **todo el contenido** de esta carpeta (los archivos y las carpetas `css`, `js`, `lib`, `icons`), no la carpeta contenedora.
3. En el repositorio: **Settings → Pages → Build and deployment → Deploy from a branch → `main` / `/ (root)`** y guarda.
4. En un par de minutos estará en `https://TU_USUARIO.github.io/rutalibre/`.
5. En el móvil, abre esa dirección en Chrome y elige **menú ⋮ → Instalar aplicación**.

Al subir una versión nueva, la app se actualiza sola la siguiente vez que se abre con conexión.

## Cómo está organizada

```
index.html              página única
sw.js / manifest        instalación como app y uso de la copia guardada sin red
js/main.js              crea el mapa y arranca las funciones
js/core/                config, bus de eventos, estado, registro de proveedores, textos
js/providers/           servicios intercambiables: routing-valhalla.js, geocoding-photon.js
js/features/            funciones: search, locate, place, route, navigation, compass, about
js/lib/                 lógica pura y probada: geometría, progreso de ruta, formatos
js/i18n/es.js           textos de la interfaz
lib/                    MapLibre GL JS (incluido, sin depender de ninguna CDN)
```

**Añadir una función nueva** (favoritos, historial, tráfico...):

1. Crear `js/features/favoritos.js` con `export default { id: 'favoritos', init(ctx) { ... } }`.
2. Añadirla a la lista de `js/features/index.js`.

`ctx` da acceso al mapa, al bus de eventos (`ctx.bus`), al estado (`ctx.store`), a los proveedores (`ctx.providers`), a la interfaz (`ctx.ui`) y a servicios de otras funciones (`ctx.services`). Las funciones no se importan entre sí: se hablan por eventos (`place:select`, `route:to`, `nav:start`, `position:update`...).

**Cambiar de servicio** (otro motor de rutas, otro buscador): crear un archivo en `js/providers/` que cumpla el contrato descrito al inicio de `routing-valhalla.js` o `geocoding-photon.js`, registrarlo en `js/providers/index.js` y cambiar el nombre en `config.js`. El resto de la app no se toca.

## Servicios y límites (importante para comercializar)

| Servicio | Qué se usa | Licencia | Condiciones |
|---|---|---|---|
| Teselas del mapa | OpenFreeMap (público) | MIT, datos ODbL | Gratis, sin claves, uso comercial permitido |
| Rutas | Valhalla en `valhalla1.openstreetmap.de` | MIT | **Solo demostración**: máx. 1 petición/s y no apto para producción ni uso comercial |
| Búsqueda | Photon en `photon.komoot.io` | Apache-2.0 | Uso razonable; se limita o bloquea si se abusa |

Con estos servidores públicos la app sirve para probar. **Antes de publicarla o venderla hay que alojar tu propio Valhalla y Photon** (ver `docs/AUTOALOJADO.md`): el software es libre y gratuito, pero el servidor que lo ejecuta tiene un coste.

Obligaciones de licencia: mostrar «© OpenStreetMap contributors» (ya aparece en el mapa y en «Acerca de») y conservar los avisos de MapLibre (`lib/MAPLIBRE-LICENSE.txt`).

## Hoja de ruta propuesta

- **v2** · Favoritos e historial, paradas intermedias, rutas alternativas, selector de idioma.
- **v3** · Kit de servidor propio y pantalla de ajustes para cambiar de servidor.
- **v4** · Mapas y rutas sin conexión (en una PWA es limitado; probablemente pase por una app nativa).
- **v5** · Empaquetado como app de Android/iOS (Flutter o Capacitor) para las tiendas.

## Probar la lógica

La lógica de rutas y progreso (`js/lib/`, `js/providers/routing-valhalla.js`) no depende del navegador y se puede probar con Node.
