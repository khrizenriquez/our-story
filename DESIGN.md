# Linea Visual - Our Story

Documento rector del diseno del sitio. Toda nueva seccion, ajuste visual o decision de UI debe salir de aqui.

## 1. Proposito

El sitio no es un dashboard tecnico. Es una historia presentada como experiencia single-page: grande, clara, emocional y muy visual.

La prioridad es:

1. Entender la historia rapido.
2. Sentirla como una presentacion cuidada.
3. Mantener consistencia total entre desktop y mobile.
4. Diseñar primero en claro y luego reinterpretar en oscuro.

## 2. Principios

### Single-page real

- Cada seccion debe sentirse como un capitulo completo, no como una tarjeta aislada.
- En desktop, la pagina debe respirar como showcase editorial: bloques amplios, encabezados pegajosos, contenido grande y ritmo de scroll.
- En mobile, la lectura debe seguir siendo una sola columna clara, pero con profundidad visual y movimiento continuo.

### Claro manda

- El modo claro es la fuente de verdad del producto.
- El modo oscuro no inventa otro lenguaje; solo reinterpreta la misma paleta, jerarquia y profundidad.

### Informacion visible

- La data debe poder entenderse de un vistazo.
- Los numeros importantes siempre se presentan grandes.
- Los textos secundarios no deben competir con la metrica principal.

### Emocional, no tecnico

- El copy evita palabras como archivo, dump, export, sync o DB en la experiencia visible.
- Todo lo que se ve en UI debe sonar humano, presentacional y cercano.

## 3. Tokens de color

### Light (default)

```css
:root {
  --paper: #f8eee5;
  --paper-deep: #f1dfcf;
  --paper-warm: #fbf5ef;
  --ink: #2f2622;
  --ink-soft: #4a3932;
  --muted: #6b5448;
  --line: rgba(47, 38, 34, 0.12);
  --line-strong: rgba(143, 49, 75, 0.14);

  --rose: #8f314b;
  --rose-strong: #77263f;
  --rose-soft: rgba(143, 49, 75, 0.1);

  --lavender: #8e96ea;
  --lavender-soft: rgba(142, 150, 234, 0.18);

  --plum: #b67b93;
  --teal: #5a7296;
  --gold: #c58b3f;

  --surface: linear-gradient(180deg, rgba(255, 252, 248, 0.95), rgba(244, 232, 220, 0.98));
  --surface-soft: rgba(255, 255, 255, 0.72);
  --surface-strong: rgba(255, 255, 255, 0.84);
  --surface-tinted: linear-gradient(180deg, rgba(255, 255, 255, 0.88), rgba(248, 239, 230, 0.95));

  --section-rose-wash: rgba(188, 126, 145, 0.18);
  --section-lavender-wash: rgba(152, 168, 218, 0.14);

  --shadow-soft: 0 24px 60px rgba(95, 62, 57, 0.1);
  --shadow-strong: 0 32px 80px rgba(88, 58, 53, 0.14);
}
```

### Dark

```css
html[data-theme='dark'] {
  --paper: #1b1218;
  --paper-deep: #271922;
  --paper-warm: #20151c;
  --ink: #f7e8dc;
  --ink-soft: #ead7ca;
  --muted: #d2beb2;
  --line: rgba(255, 236, 220, 0.14);
  --line-strong: rgba(247, 232, 220, 0.14);

  --rose: #f1a4be;
  --rose-strong: #ffbdd0;
  --rose-soft: rgba(241, 164, 190, 0.14);

  --lavender: #b7bdfc;
  --lavender-soft: rgba(183, 189, 252, 0.18);

  --plum: #d7a8bb;
  --teal: #a4bdd7;
  --gold: #f0bc71;

  --surface: linear-gradient(180deg, rgba(38, 24, 31, 0.95), rgba(24, 15, 21, 0.98));
  --surface-soft: rgba(62, 40, 50, 0.72);
  --surface-strong: rgba(72, 46, 59, 0.86);
  --surface-tinted: linear-gradient(180deg, rgba(52, 33, 43, 0.9), rgba(35, 22, 30, 0.96));

  --section-rose-wash: rgba(126, 69, 91, 0.24);
  --section-lavender-wash: rgba(111, 121, 216, 0.2);

  --shadow-soft: 0 28px 70px rgba(0, 0, 0, 0.22);
  --shadow-strong: 0 36px 90px rgba(0, 0, 0, 0.28);
}
```

## 4. Tipografia

### Familias

- Titulos y acentos poeticos: `Cormorant Garamond`
- Cuerpo, labels, metricas y UI: `Instrument Sans`

### Escala

```css
h1 {
  font-family: 'Instrument Sans', sans-serif;
  font-size: clamp(4.2rem, 18vw, 10rem);
  line-height: 0.86;
  font-weight: 700;
}

h2 {
  font-family: 'Instrument Sans', sans-serif;
  font-size: clamp(3rem, 13vw, 8rem);
  line-height: 0.9;
  font-weight: 700;
}

h3 {
  font-family: 'Cormorant Garamond', serif;
  font-size: clamp(2rem, 8vw, 3.4rem);
  line-height: 0.94;
  font-weight: 600;
}

h4 {
  font-family: 'Cormorant Garamond', serif;
  font-size: clamp(1.1rem, 3vw, 1.7rem);
  line-height: 1.02;
  font-weight: 600;
}

body {
  font-family: 'Instrument Sans', sans-serif;
  font-size: 1rem;
  line-height: 1.72;
}

.story-kicker {
  font-size: 0.76rem;
  line-height: 1;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}
```

### Jerarquia

- Hero: enorme y dominante.
- Encabezados de seccion: grandes, pero siempre secundarios al hero.
- Titulos de hitos: medianos; nunca deben competir con el h1 o los h2 principales.
- Numeros: `Instrument Sans`, pesados y rapidos de leer.

## 5. Layout y ritmo

### Reglas globales

- Cada seccion importante ocupa al menos `100svh`.
- En desktop, la mayoria de secciones trabajan entre `112svh` y `128svh`.
- Las secciones viven como bandas full-width con contenido contenido adentro.
- No usar secciones como tarjetas flotantes.

### Contenedor

```css
.story-shell {
  width: 100%;
  max-width: none;
  padding: 0 0 120px;
}
```

### Desktop split

En desktop, cuando una seccion tiene encabezado + contenido, usar split editorial:

- columna izquierda: copy o heading sticky
- columna derecha: contenido grande, grafico o narrativo

Aplica a:

- compare
- monthly
- yearly
- chapters
- media
- moments
- milestones

### Mobile

- Una sola columna.
- Metricas y tarjetas siempre a ancho completo si ayudan a leer mejor.
- Evitar dos columnas si el texto pierde fuerza o se vuelve pequeno.

## 6. Movimiento y parallax

### Regla general

El sitio debe sentirse vivo incluso quieto, y mas profundo cuando se hace scroll.

### Capas

1. Capa fija del shell: halos grandes de fondo.
2. Capa de seccion: lavados de color o formas blandas que se desplazan lento.
3. Capa de contenido: cards, graficas, objetos y timelines con drift propio.

### Multiplicadores

Usar `--scroll-px` y `--scroll-progress`.

```css
.story-section.depth-soft::after {
  transform: translate3d(0, calc(var(--scroll-px) * 0.026), 0) scale(1.12);
}

.story-section.depth-mid::after {
  transform: translate3d(0, calc(var(--scroll-px) * -0.03), 0) scale(1.16);
}

.story-section.depth-strong::after {
  transform: translate3d(0, calc(var(--scroll-px) * 0.036), 0) scale(1.2);
}
```

### Hero flotante

Los objetos del hero deben moverse siempre:

- `hero-shape-heart`
- `hero-object-helmet`
- `hero-object-star`
- `hero-object-loop`

Movimiento esperado:

- deriva horizontal lenta
- deriva vertical suave
- combinacion de scroll + loop continuo

### Animaciones de entrada

- Las secciones aparecen con `float-up` o `settle-in`.
- La animacion nunca debe ser mas rapida que la lectura.
- Los contadores numericos tienen que llegar a su valor final en menos de 3 segundos.

### Reduced motion

- Respetar `prefers-reduced-motion`.
- Cuando este activo, quitar loops continuos y bajar mucho el parallax.

## 7. Secciones canonicas

### Hero

Debe incluir:

- label de marca configurable
- titulo poetico configurable
- copy corto de apoyo
- 3 metricas flotantes grandes
- pills de metadata

Lenguaje:

- muy grande
- aireado
- con objetos flotando
- tono de portada

### Para empezar

Regla obligatoria:

- En modo claro debe verse con contraste tipo `Lo que se ve al instante`.
- Nunca usar texto casi blanco sobre crema.

Debe tener:

- h2 fuerte
- 4 metricas clave
- fondo claro y calido
- lectura inmediata

### Compare / Love / Charts / Chapters / Media / Moments / Closing

Todas deben seguir esta base:

- seccion grande
- heading fuerte
- contenido protagonista
- parallax de fondo
- tarjetas o graficas con suficiente espacio para respirar

## 8. Roadmap / timeline

El timeline no es una lista de hitos. Es un capitulo visual.

### Estructura

- Intro general del timeline.
- Fases separadas:
  - amigos
  - pretendiente
  - novios
- Cada fase vive como banda grande propia.

### Desktop

- La fase usa encabezado sticky a la izquierda.
- A la derecha hay un roadmap alto y serpenteante.
- El camino debe leerse como una ruta continua.
- Las tarjetas orbitan la ruta y alternan de lado.
- El texto de los hitos debe ser mas pequeno que el de los encabezados de seccion.
- La ruta puede ser lavanda / rosa, pero siempre sobre la misma familia clara del sitio.

### Mobile

- El roadmap se vuelve vertical.
- Mantiene carretera, nodos y secuencia.
- Los hitos deben ser claramente tocables/escaneables.

### Estilo

- Exterior de la fase: lavado crema / rosa / lavanda.
- Tarjetas: claras, con texto oscuro.
- Nodos: rosa suave con centro claro.
- Linea de carretera: lavanda.

### Curaduria

- El timeline no es exhaustivo.
- Se priorizan hitos legibles, visuales y emocionalmente utiles.
- Si un hito repite otro sin sumar, se quita.

## 9. Graficas

- Una grafica protagonista por seccion.
- En desktop, apilar verticalmente en la pagina; no meter dos charts lado a lado.
- Las lineas mensuales deben sentirse vivas y cinematograficas.
- Los fondos de las graficas deben seguir la paleta crema / vino / lavanda.

### Colores reservados

- Totales: verde / oliva suave cuando aplique
- Patty: rosa
- Chris: azul

### Animacion

- Line chart mensual: progresiva y lenta
- Sin easing decorativo si la grafica pide lectura progresiva
- Las animaciones de charts deben ser mas lentas que las de cards

## 10. Componentes

### Pills

- redondeadas completas
- altura minima 46px
- borde muy sutil
- texto corto

### Floating stat cards

- tipografia grande
- forma blanda, casi objeto
- deben sentirse suspendidas

### Cards de capitulos

- grandes
- collage / metro editorial
- no hacer una grilla rigida si rompe el ritmo

### Media cards

- icono claro
- numero grande
- label directo

### Moment cards

- quote o escena al centro
- texto narrativo, no tecnico

## 11. Configuracion visible

La UI debe poder cambiarse desde configuracion / export sin tocar el layout.

Valores configurables esperados:

- marca corta del sitio
- titulo poetico
- nombres visibles de ambas personas
- firma del footer
- frase destacada a buscar (por defecto `te amo`)
- icono o acento visual asociado a esa frase
- hitos del timeline

## 12. Reglas para futuro trabajo

Toda nueva seccion debe responder estas preguntas antes de existir:

1. Cual es su papel en la historia?
2. Que metrica o momento es el protagonista?
3. Como se ve en claro?
4. Como se adapta en oscuro sin cambiar de identidad?
5. Que parallax o movimiento aporta?
6. Que parte queda sticky en desktop?
7. Que decision se toma para mobile first?

## 13. Checklist de validacion

Antes de cerrar un cambio visual:

- revisar desktop y mobile
- comprobar contraste de texto en claro y oscuro
- verificar que las secciones sigan la paleta oficial
- confirmar que la pagina se siente single-page
- confirmar que no hay dos estilos compitiendo
- revisar que el timeline parezca parte del mismo producto
- respetar `prefers-reduced-motion`

