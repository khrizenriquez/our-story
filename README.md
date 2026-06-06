# Timeline privada de WhatsApp

Visor local para una conversacion especifica de WhatsApp Desktop, construido con React, Vite, Bulma y Chart.js.

## Setup

```bash
npm install
```

Instala `wacrawl` si quieres exportar datos reales:

```bash
brew install steipete/tap/wacrawl
# o
go install github.com/steipete/wacrawl/cmd/wacrawl@latest
```

El chat objetivo vive en `.env.local`, que esta gitignored.

## Scripts

```bash
npm run export    # sincroniza wacrawl y genera public/data/babe-chat.json
npm run dev       # abre la app local
npm run build     # build seguro para GitHub Pages/demo
npm run harness   # fixtures + validacion local privada si hay DB
npm run test      # unit tests
```

Los datos reales y media se escriben en `public/data/` y `public/private-media/`; no deben versionarse.
El historial maestro incremental se guarda localmente en `.private/babe-chat-master.json`; tampoco debe versionarse.

## Flujo incremental recomendado

Cuando exportes un nuevo chat de WhatsApp:

1. reemplaza o actualiza `chat_bk/WhatsApp Chat - Babe/_chat.txt` y su carpeta de media
2. corre `npm run export`

El export:

- vuelve a leer el TXT actual
- conserva el historial previo guardado en `.private/babe-chat-master.json`
- suma solo los mensajes que todavia no existan
- vuelve a generar `public/data/babe-chat.json` para la web local

Asi puedes ir trayendo exports nuevos sin perder lo que ya se habia consolidado antes.

## Privacidad antes de subir

Este proyecto esta pensado para publicar codigo y demo, no tu chat real.

No subas nunca:

- `chat_bk/` ni zips del backup
- `public/data/` ni `public/private-media/`
- `.private/`
- `.env*`
- bases de datos `*.sqlite`, `*.sqlite3`, `*.db`

Antes de hacer push, corre:

```bash
npm run harness
```

Si despues conectas esta carpeta a un repo git, revisa tambien:

```bash
git status --short
git check-ignore -v .env.local chat_bk "public/data/babe-chat.json"
```
