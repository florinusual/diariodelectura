# Diario de Lectura

App para el control de sesiones de lectura, libros leídos y estadísticas. Es una app web instalable (PWA): se agrega a la pantalla de inicio del teléfono o la computadora y funciona sin conexión.

## Qué incluye

- `index.html`: la app completa (Biblioteca, Leer, Diccionario y Resumen).
- `manifest.webmanifest` e `icons/`: nombre, colores e íconos para instalarla.
- `sw.js`: service worker que guarda la app para abrirla sin internet.

Los datos se guardan en el dispositivo (almacenamiento del navegador). Para no perderlos o para pasarlos a otro dispositivo, usa **Resumen → Copia de seguridad**.

## Publicarla con GitHub Pages

1. Une esta rama a `main`.
2. En GitHub: **Settings → Pages → Build and deployment → Source: Deploy from a branch**, rama `main`, carpeta `/ (root)`.
3. En un par de minutos la app queda en `https://florinusual.github.io/diariodelectura/`.

## Instalarla

- **Android (Chrome):** abre el enlace y toca **Instalar** en el aviso de la Biblioteca, o en el menú ⋮ → **Instalar app**.
- **iPhone/iPad (Safari):** botón **Compartir** → **Agregar a inicio**.
- **Computadora (Chrome/Edge):** ícono de instalar en la barra de direcciones.

## Pasar tus datos desde el artefacto de Claude

La app instalada no comparte almacenamiento con el artefacto de claude.ai, así que empieza vacía:

1. En el artefacto, ve a **Resumen → Copia de seguridad → Descargar respaldo**.
2. En la app instalada, **Resumen → Copia de seguridad → Restaurar desde archivo** y elige ese archivo.

## Diferencias con el artefacto

- La búsqueda de libros por ISBN o por título usa [Open Library](https://openlibrary.org) en lugar de Claude.
- La lectura de título y autor desde la foto de la portada y la búsqueda automática del diccionario necesitan Claude, así que en la app instalada las palabras se guardan con un significado escrito por ti.
- No hay sincronización entre dispositivos: usa el respaldo para mover tus datos.

## Probarla en local

```sh
python3 -m http.server 8000
```

Luego abre `http://localhost:8000`.
