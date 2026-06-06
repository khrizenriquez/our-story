# Our Story

Proyecto personal, hecho just for fun, para probar hasta donde se puede llegar extrayendo informacion de una conversacion de WhatsApp y convertirla en una historia visual, clara y bonita.

La idea no es hacer analitica “seria”, sino tomar mensajes, fechas y conteos reales para presentarlos de una forma que se sienta humana.

## Setup

```bash
npm install
```

Instala `wacrawl` si quieres exportar datos reales desde tu entorno local:

```bash
brew install steipete/tap/wacrawl
# o
go install github.com/steipete/wacrawl/cmd/wacrawl@latest
```

La configuracion privada y los insumos locales no forman parte del repositorio publico.

## Scripts

```bash
npm run export    # actualiza la historia con datos locales
npm run publish   # actualiza el resumen publico y lo empuja a main
npm run dev       # abre la app local
npm run build     # genera el build estatico
npm run harness   # corre validaciones locales
npm run test      # unit tests
```

## Flujo incremental recomendado

`npm run export` mezcla la informacion historica disponible con los mensajes recientes sincronizados localmente y vuelve a calcular las metricas visibles de la historia.

Si quieres actualizar tambien GitHub Pages con los contadores nuevos, usa:

```bash
npm run publish
```

Ese comando corre el export, publica el resumen seguro del sitio y empuja el cambio a `main` cuando hay actualizaciones.
