# Línea Visual - Our Story

Especificación completa de diseño para mantener consistencia visual en nuevas secciones y componentes.

## Paleta de Colores

**Regla principal:** el modo claro manda. Toda nueva sección debe diseñarse primero en claro usando la paleta crema / vino / lavanda del proyecto. El modo oscuro es una reinterpretación de esa misma familia visual; no debe sentirse como otro producto.

### Modo Claro (Default)

```css
--paper: #f8eee5;           /* Fondo principal */
--paper-deep: #f1dfcf;      /* Fondo profundo */
--ink: #2f2622;             /* Texto principal */
--muted: #5f4a3f;           /* Texto secundario */
--line: rgba(47, 38, 34, 0.12);  /* Bordes sutiles */
--rose: #8f314b;            /* Acentos: "te amo", kickers */
--rose-soft: rgba(143, 49, 75, 0.09);  /* Rose con opacidad */
--teal: #355c7d;            /* Acentos secundarios */
--teal-soft: rgba(53, 92, 125, 0.09);  /* Teal con opacidad */
--gold: #c58b3f;            /* Acentos terciarios */
--plum: #6f5868;            /* Acentos cuaternarios */
--white: rgba(255, 251, 247, 0.82);  /* Texto sobre fondos oscuros internos */
--shadow: 0 30px 80px rgba(69, 35, 28, 0.12);  /* Sombra */
--surface: linear-gradient(180deg, rgba(255, 252, 248, 0.92), rgba(247, 237, 228, 0.94));
--surface-card: rgba(255, 255, 255, 0.7);
--surface-card-strong: rgba(255, 255, 255, 0.82);
```

### Modo Oscuro (data-theme="dark")

```css
--paper: #170f14;           /* Fondo principal */
--paper-deep: #21161d;      /* Fondo profundo */
--ink: #f6e8dc;             /* Texto principal */
--muted: #d4c2b7;           /* Texto secundario */
--line: rgba(255, 236, 220, 0.14);  /* Bordes sutiles */
--rose: #ff8fb0;            /* Acentos: "te amo", kickers */
--rose-soft: rgba(255, 143, 176, 0.12);  /* Rose con opacidad */
--teal: #7ab8eb;            /* Acentos secundarios */
--teal-soft: rgba(122, 184, 235, 0.12);  /* Teal con opacidad */
--gold: #f0bc71;            /* Acentos terciarios */
--plum: #d0a7c4;            /* Acentos cuaternarios */
--white: rgba(39, 24, 31, 0.82);  /* Texto sobre fondos claros internos */
--shadow: 0 40px 90px rgba(0, 0, 0, 0.32);  /* Sombra */
--surface: linear-gradient(180deg, rgba(29, 19, 24, 0.92), rgba(20, 12, 18, 0.95));
--surface-card: rgba(34, 22, 29, 0.82);
--surface-card-strong: rgba(42, 28, 36, 0.9);
```

## Tipografía

### Fuentes

- **Títulos (h1, h2, h3)**: `Cormorant Garamond` (serif, elegante, poético)
  - Weights: 400, 500, 600, 700
- **Cuerpo (body, p, labels)**: `Instrument Sans` (sans-serif, legible, moderno)
  - Weights: 400, 500, 600, 700

### Escalas

```css
h1 {
  font-size: clamp(3.6rem, 15vw, 7.4rem);  /* Responsive */
  line-height: 0.92;
}

h2 {
  font-size: clamp(2.5rem, 11vw, 4.4rem);  /* Responsive */
  line-height: 0.94;
}

h3 {
  font-size: clamp(1.8rem, 7vw, 2.4rem);   /* Responsive */
  line-height: 1;
}

.story-kicker {
  font-size: 0.76rem;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}
```

## Componentes Principales

### Roadmap / Timeline Visual

Para capítulos de historia o hitos importantes, usar un roadmap visual en vez de una tabla o una simple grilla:

```css
.milestones-section {
  background:
    radial-gradient(circle at 0% 14%, rgba(167, 92, 113, 0.24), transparent 18%),
    radial-gradient(circle at 100% 18%, rgba(163, 174, 213, 0.24), transparent 18%),
    linear-gradient(180deg, #fbf4ed 0%, #f0e4d8 100%);
}

.milestone-phase {
  background:
    radial-gradient(circle at 84% 18%, rgba(250, 221, 230, 0.14), transparent 18%),
    linear-gradient(145deg, #8f314b 0%, #8c3956 36%, #7c2f49 100%);
}

.milestone-road-track {
  stroke: #8892df;
}

.milestone-road-lane {
  stroke: rgba(255, 255, 255, 0.82);
  stroke-dasharray: 10 14;
}

.milestone-road-node {
  background: linear-gradient(180deg, #ffb9cc, #ff9fb9);
}
```

#### Desktop

- La fase funciona como una banda grande con copy fijo a la izquierda.
- A la derecha, el roadmap debe sentirse como una ruta serpenteante.
- Los nodos van numerados.
- Las tarjetas orbitan el camino, alternando arriba y abajo para dar ritmo visual.

#### Mobile

- Se convierte a una lectura vertical clara.
- Se conserva la idea de carretera con una línea gruesa y nodos.
- Cada hito debe seguir siendo escaneable con una sola mano.
- En mobile, los títulos de etapa deben bajar de tamaño respecto a desktop para no comerse la pantalla.

#### Curaduría de hitos

- El timeline no es un dump cronológico: se puede podar cuando un hito rompe el ritmo visual o repite información.
- Los hitos anclados por memoria compartida se pueden quitar si la escena no aporta claridad narrativa.

#### Tono visual

- Exterior claro y cálido.
- Interior vino/rosa con reflejos fríos suaves.
- Debe sentirse editorial, romántico y presentacional, no dashboard.

### Secciones Base (.story-section)

Toda sección sigue este patrón:

```css
/* Base */
border: 1px solid var(--line);
border-radius: 18px;
background: var(--surface);
box-shadow: var(--shadow);
backdrop-filter: blur(10px);
margin-top: 14px;
padding: 20px;

/* Animación de entrada */
opacity: 0;
transform: translate3d(0, 56px, 0) scale(0.975);
transition: opacity 1.3s ease, 
            transform 1.43s cubic-bezier(0.22, 1, 0.36, 1),
            box-shadow 1.04s ease;
```

Cuando se hace visible (.is-visible):

```css
opacity: 1;
transform: translate3d(0, 0, 0) scale(1);
```

### Efecto de Profundidad (Parallax)

Las secciones tienen 3 niveles de parallax basados en scroll:

```css
.story-section.depth-soft::after {
  transform: translate3d(0, calc(var(--scroll-px) * 0.02), 0) scale(1.08);
}

.story-section.depth-mid::after {
  transform: translate3d(0, calc(var(--scroll-px) * -0.024), 0) scale(1.11);
}

.story-section.depth-strong::after {
  transform: translate3d(0, calc(var(--scroll-px) * 0.03), 0) scale(1.14);
}
```

**Cómo usar**: Agrega la clase `depth-soft`, `depth-mid` o `depth-strong` a la sección.

### Tipos de Tarjetas

#### Hero Metrics

```css
.hero-floating-card, .hero-metric {
  background: var(--surface-card);
  border-radius: 12px;
  padding: 12px 16px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
}
```

#### Chapter Band / “Para empezar”

- En modo claro debe usar contraste tipo `Lo que se ve al instante`: fondo claro cálido, texto oscuro y tarjetas blancas legibles.
- Evitar texto blanco sobre superficies crema.
- Los cuatro números deben leerse rápido en phone y tablet.

#### Compare Cards / Impact Cards

```css
.compare-card, .impact-card {
  background: var(--surface-card-strong);
  border: 1px solid var(--line);
  border-radius: 14px;
  padding: 16px;
  text-align: center;
}
```

#### Media Summary Cards

```css
.media-summary-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  background: var(--surface-card);
  border-radius: 12px;
  padding: 20px;
}
```

## Sistema de Animaciones

### Hero flotante

- `hero-shape-heart`, `hero-object-helmet`, `hero-object-star` y `hero-object-loop` deben moverse siempre con micro-animaciones lentas.
- El movimiento tiene que sentirse orgánico: deriva lateral / vertical suave, sin saltos.
- Respetar `prefers-reduced-motion`.

### Entrada de Secciones

Cuando una sección entra en viewport (.is-visible):

```css
/* Encabezados y copys */
.section-heading, .chapter-band-copy, .closing-copy, .hero-copy {
  animation: float-up 1.17s cubic-bezier(0.22, 1, 0.36, 1) both;
}

/* Tarjetas */
.hero-floating-card, .hero-metric, .compare-card, .impact-card,
.chapter-card, .media-summary-card, .moment-card, .closing-chart {
  animation: settle-in 1.17s cubic-bezier(0.22, 1, 0.36, 1) both;
}
```

### Stagger de Animación

```css
/* 1er elemento: sin delay */
:nth-child(1) { animation-delay: 0s; }

/* 2do elemento */
:nth-child(2) { animation-delay: 0.08s; }

/* 3er elemento */
:nth-child(3) { animation-delay: 0.16s; }

/* 4to elemento (solo algunas tarjetas) */
:nth-child(4) { animation-delay: 0.24s; }
```

### Números animados

- Los números grandes de `.chapter-card` y `.media-summary-card` deben contar desde `0` hasta su valor final.
- La animación no debe pasar de `3s`.
- Debe dispararse cuando la sección entra en viewport.
- Si el usuario prefiere menos movimiento, el valor puede aparecer directo.

## Espaciado y Layout

### Contenedor Principal

```css
.story-shell {
  width: min(100%, 1540px);      /* Max width 1540px */
  margin: 0 auto;                /* Centrado */
  padding: 12px 12px 88px;       /* Padding responsivo */
  overflow-x: clip;
}
```

### Secciones

```css
.story-stage {
  min-height: 100svh;            /* Full viewport */
  display: grid;
  align-content: center;         /* Centrado vertical */
  padding-block: clamp(22px, 5vw, 54px);  /* Padding responsivo */
}
```

### Footer / cierre

- La sección `Y todavía sigue` en mobile debe sentirse más ligera que en desktop.
- Reducir headline y altura cuando la pantalla es corta para que no se vea sobredimensionada.

## Texto configurable

- El label del home (`Nuestra historia`) debe ser configurable desde la data exportada.
- Los nombres visibles (`Chris`, `Patty`) siguen viniendo de configuración privada.
- Cuando se agregue nuevo copy visible y persistente, evaluar primero si debe vivir como texto fijo o como campo configurable.
- El sello de `Importado` debe mostrar una fecha legible en español y reflejar el último `npm run publish` del resumen público.

### Márgenes Entre Secciones

```css
.story-section {
  margin-top: 14px;  /* Separación vertical */
}
```

## Gradientes de Fondo

### Fondo Global

```css
html {
  background:
    radial-gradient(circle at top left, rgba(143, 49, 75, 0.16), transparent 26%),
    radial-gradient(circle at top right, rgba(53, 92, 125, 0.12), transparent 28%),
    linear-gradient(180deg, #fbf5ef 0%, #f2e1d2 100%);
}

html[data-theme='dark'] {
  background:
    radial-gradient(circle at top left, rgba(255, 143, 176, 0.16), transparent 26%),
    radial-gradient(circle at top right, rgba(122, 184, 235, 0.14), transparent 28%),
    linear-gradient(180deg, #120d12 0%, #1a1219 100%);
}
```

### Efectos Flotantes (.story-shell pseudo-elements)

```css
.story-shell::before {
  position: fixed;
  z-index: -1;
  width: 34vw;
  height: 34vw;
  border-radius: 50%;
  filter: blur(42px);
  top: -12vw;
  left: -10vw;
  background: rgba(143, 49, 75, 0.14);  /* Rose glow */
}

.story-shell::after {
  position: fixed;
  z-index: -1;
  width: 34vw;
  height: 34vw;
  border-radius: 50%;
  filter: blur(42px);
  right: -12vw;
  bottom: 6vw;
  background: rgba(53, 92, 125, 0.12);  /* Teal glow */
}
```

## Principios de Diseño

1. **Elegancia minimalista**: Mucho aire blanco, pocos elementos por sección
2. **Narrativa visual**: Las secciones cuentan una historia progresivamente
3. **Profundidad sutil**: Parallax y múltiples capas crean dimensión sin ruido
4. **Accesibilidad**: Alto contraste, tipografía grande, animaciones suaves
5. **Responsividad**: Todo con `clamp()` y viewport units para adaptarse
6. **Temas oscuro/claro**: Matching colors que mantienen la identidad visual

## Cómo Agregar Secciones Nuevas

### 1. Estructura HTML

```html
<section 
  class="mi-nueva-seccion story-section depth-soft story-stage" 
  data-reveal 
  data-section="mi-seccion"
>
  <!-- Contenido aquí -->
</section>
```

### 2. CSS Base

```css
.mi-nueva-seccion {
  /* Hereda estilos base de .story-section automáticamente */
}

/* Si necesitas estilos específicos */
.mi-nueva-seccion .algun-elemento {
  color: var(--ink);
  background: var(--surface-card);
}

/* Si usas tarjetas, hereda de las clases base */
.mi-nueva-seccion .mi-tarjeta {
  background: var(--surface-card);
  border-radius: 12px;
  padding: 16px;
  border: 1px solid var(--line);
}
```

### 3. Animaciones

```css
.story-section.is-visible .mi-encabezado {
  animation: float-up 1.17s cubic-bezier(0.22, 1, 0.36, 1) both;
}

.story-section.is-visible .mi-tarjeta {
  animation: settle-in 1.17s cubic-bezier(0.22, 1, 0.36, 1) both;
}

.story-section.is-visible .mi-tarjeta:nth-child(2) {
  animation-delay: 0.08s;
}
```

### 4. Registrar en App.tsx

```typescript
// En la variable sectionIds (línea 21 aprox)
const sectionIds = ['hero', 'opening', 'compare', 'love', 'monthly', 'yearly', 'chapters', 'media', 'moments', 'mi-seccion', 'closing'] as const;

// En el JSX, agregar la sección en el lugar correspondiente
```

### 5. TypeScript (si es necesario)

Si la sección requiere nuevos tipos de datos:

```typescript
// En src/types.ts
export interface MiSeccionData {
  // Tus campos aquí
}
```

### 6. Validación

- ✅ Usa variables CSS (`var(--ink)`, `var(--rose)`, etc)
- ✅ Mantén `border-radius: 18px` (o múltiplo de 6px)
- ✅ Aplica `backdrop-filter: blur(10px)` a fondos translúcidos
- ✅ Usa animaciones con `cubic-bezier(0.22, 1, 0.36, 1)` (easing personalizado)
- ✅ Respeta los 3 niveles de profundidad: `depth-soft`, `depth-mid`, `depth-strong`
- ❌ No hard-code colores (siempre usa variables CSS)
- ❌ No cambies el font-family base (Cormorant + Instrument)
- ❌ No uses animaciones > 1.5s (se siente lento)

## Chart.js Colores Personalizados

Para gráficos, usa estos colores según el tema:

### Modo Claro
```javascript
borderColor: '#7a9e00'          // Verde
backgroundColor: 'rgba(122, 158, 0, 0.12)'
```

### Modo Oscuro
```javascript
borderColor: '#d8ff45'          // Verde fluorescente
backgroundColor: 'rgba(216, 255, 69, 0.12)'
```

**Consulta en App.tsx línea ~280** para ver ejemplos de cómo se usan en charts reales.

## Referencias de Variables

| Var CSS | Claro | Oscuro | Uso |
|---------|-------|--------|-----|
| `--paper` | #f8eee5 | #170f14 | Fondo principal |
| `--ink` | #2f2622 | #f6e8dc | Texto principal |
| `--rose` | #8f314b | #ff8fb0 | Acentos románticos |
| `--teal` | #355c7d | #7ab8eb | Acentos secundarios |
| `--gold` | #c58b3f | #f0bc71 | Acentos terciarios |
| `--line` | rgba(..., 0.12) | rgba(..., 0.14) | Bordes |
| `--surface` | Gradiente claro | Gradiente oscuro | Fondos de tarjetas |
| `--shadow` | Sombra suave | Sombra fuerte | Profundidad |

---

**Última actualización**: 2026-06-06  
**Versión**: 1.0  
**Mantenedor**: Asegúrate de actualizar este archivo cuando hagas cambios visuales significativos
