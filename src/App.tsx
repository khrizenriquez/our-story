import { useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip,
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import { ArrowDown, CalendarRange, Heart, Image as ImageIcon, MessageCircleMore, Mic, MoonStar, PlayCircle, Sparkles as SparklesIcon, Sticker, SunMedium } from 'lucide-react';
import type { LoadedChatExport } from './types';
import { loadChatExport } from './lib/data';
import { timestampToDisplay } from './lib/dates';
import { deriveStoryModel } from './lib/story';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Tooltip, Legend, Filler);

const numberFormatter = new Intl.NumberFormat('es-GT');
const sectionIds = ['hero', 'opening', 'compare', 'love', 'monthly', 'yearly', 'chapters', 'media', 'moments', 'closing', 'milestones'] as const;
type ThemeMode = 'light' | 'dark';

function formatNumber(value: number): string {
  return numberFormatter.format(value);
}

function formatDay(day: string): string {
  return new Intl.DateTimeFormat('es-GT', { dateStyle: 'long', timeZone: 'UTC' }).format(new Date(`${day}T00:00:00Z`));
}

function formatRangeLabel(startDay: string, endDay: string): string {
  const formatter = new Intl.DateTimeFormat('es-GT', { dateStyle: 'medium', timeZone: 'UTC' });
  return `${formatter.format(new Date(`${startDay}T00:00:00Z`))} - ${formatter.format(new Date(`${endDay}T00:00:00Z`))}`;
}

function formatMonthLabel(month: string): string {
  return new Intl.DateTimeFormat('es-GT', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${month}-01T00:00:00Z`));
}

function formatPreciseTimestamp(ts: number, timezone: string): string {
  return new Intl.DateTimeFormat('es-GT', {
    dateStyle: 'medium',
    timeStyle: 'medium',
    hour12: false,
    timeZone: timezone,
  }).format(new Date(ts * 1000));
}

function App() {
  const shellRef = useRef<HTMLElement | null>(null);
  const [data, setData] = useState<LoadedChatExport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [theme, setTheme] = useState<ThemeMode>('dark');
  const [visibleSections, setVisibleSections] = useState<Set<string>>(() => new Set(['hero']));

  useEffect(() => {
    let active = true;
    loadChatExport()
      .then((loaded) => {
        if (!active) return;
        setData(loaded);
      })
      .catch((reason: unknown) => {
        if (!active) return;
        setError(reason instanceof Error ? reason.message : 'No se pudo cargar la historia.');
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = window.localStorage.getItem('our-story-theme');
    if (stored === 'light' || stored === 'dark') {
      setTheme(stored);
      return;
    }
    setTheme('dark');
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem('our-story-theme', theme);
  }, [theme]);

  useEffect(() => {
    const node = shellRef.current;
    if (!node) return;

    let frame = 0;
    const sync = () => {
      frame = 0;
      const scrollY = window.scrollY;
      const max = Math.max(document.body.scrollHeight - window.innerHeight, 1);
      node.style.setProperty('--scroll-px', `${scrollY}px`);
      node.style.setProperty('--scroll-progress', `${Math.min(scrollY / max, 1)}`);
    };

    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(sync);
    };

    sync();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  useEffect(() => {
    const sections = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]'));
    if (!sections.length) return;

    if (typeof IntersectionObserver === 'undefined') {
      sections.forEach((section) => section.classList.add('is-visible'));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            const sectionId = entry.target.getAttribute('data-section');
            if (sectionId) {
              setVisibleSections((current) => {
                if (current.has(sectionId)) return current;
                const next = new Set(current);
                next.add(sectionId);
                return next;
              });
            }
          }
        }
      },
      {
        threshold: 0.18,
        rootMargin: '0px 0px -8% 0px',
      },
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [data]);

  const derivedStory = useMemo(() => (data ? deriveStoryModel(data) : null), [data]);
  const story = useMemo(() => {
    if (!data || !derivedStory) return null;
    if (!data.story) return derivedStory;
    return {
      ...derivedStory,
      ...data.story,
      timelineMilestones: data.story.timelineMilestones ?? derivedStory.timelineMilestones,
    };
  }, [data, derivedStory]);
  const totalMessages = data?.metrics.totals.messages ?? data?.chat.messageCount ?? 0;

  if (error) {
    return (
      <main className="story-shell">
        <section className="story-error">
          <p className="story-kicker">Nuestra historia en mensajes</p>
          <h1>No pudimos abrir la historia</h1>
          <p>{error}</p>
        </section>
      </main>
    );
  }

  if (!data || !story) {
    return (
      <main className="story-shell">
        <section className="story-error">
          <p className="story-kicker">Nuestra historia en mensajes</p>
          <h1>Preparando la historia</h1>
        </section>
      </main>
    );
  }

  const monthlySeries = data.metrics.daily.reduce<Array<{ month: string; total: number; me: number; them: number }>>((accumulator, entry) => {
    const month = entry.day.slice(0, 7);
    const current = accumulator[accumulator.length - 1];
    if (current && current.month === month) {
      current.total += entry.total;
      current.me += entry.fromMe;
      current.them += entry.fromThem;
      return accumulator;
    }
    accumulator.push({
      month,
      total: entry.total,
      me: entry.fromMe,
      them: entry.fromThem,
    });
    return accumulator;
  }, []);

  const monthLabels = monthlySeries.map((entry) => entry.month);
  const monthlyTotalPoints = monthlySeries.map((entry, index) => ({ x: index, y: entry.total }));
  const monthlyMePoints = monthlySeries.map((entry, index) => ({ x: index, y: entry.me }));
  const monthlyThemPoints = monthlySeries.map((entry, index) => ({ x: index, y: entry.them }));
  const topMonth = [...monthlySeries].sort((left, right) => right.total - left.total)[0] ?? null;
  const topYear = [...story.yearlyCounts].sort((left, right) => right.count - left.count)[0] ?? null;
  const averageMonthlyMessages = monthlySeries.length > 0 ? Math.round(totalMessages / monthlySeries.length) : 0;
  const meMessages = data.metrics.bySender.me.messages;
  const themMessages = data.metrics.bySender.them.messages;
  const messageGap = Math.abs(meMessages - themMessages);
  const totalDuration = 5400;
  const perPointDuration = totalDuration / Math.max(monthlySeries.length, 1);
  const progressiveDuration = () => perPointDuration;
  const progressiveDelay = (ctx: { index: number }) => ctx.index * perPointDuration;
  const previousY = (ctx: { index: number; chart: any; datasetIndex: number }) =>
    ctx.index === 0 ? ctx.chart.scales.y.getPixelForValue(0) : ctx.chart.getDatasetMeta(ctx.datasetIndex).data[ctx.index - 1].getProps(['y'], true).y;

  const monthlyChart = {
    datasets: [
      {
        label: 'Mensajes totales',
        data: monthlyTotalPoints,
        borderColor: theme === 'dark' ? '#d8ff45' : '#7a9e00',
        backgroundColor: theme === 'dark' ? 'rgba(216, 255, 69, 0.12)' : 'rgba(122, 158, 0, 0.12)',
        fill: true,
        tension: 0.38,
        pointRadius: 0,
        pointHoverRadius: 5,
        pointHitRadius: 18,
        borderWidth: 4,
      },
      {
        label: `Mensajes de ${story.themLabel}`,
        data: monthlyThemPoints,
        borderColor: theme === 'dark' ? '#ff8fb0' : '#b43b68',
        backgroundColor: 'transparent',
        fill: false,
        tension: 0.38,
        pointRadius: 0,
        pointHoverRadius: 5,
        pointHitRadius: 18,
        borderWidth: 3,
      },
      {
        label: `Mensajes de ${story.meLabel}`,
        data: monthlyMePoints,
        borderColor: theme === 'dark' ? '#7ab8eb' : '#355c7d',
        backgroundColor: 'transparent',
        fill: false,
        tension: 0.38,
        pointRadius: 0,
        pointHoverRadius: 5,
        pointHitRadius: 18,
        borderWidth: 3,
      },
    ],
  };

  const yearlyChart = {
    labels: story.yearlyCounts.map((entry) => entry.year),
    datasets: [
      {
        label: 'Mensajes',
        data: story.yearlyCounts.map((entry) => entry.count),
        backgroundColor: theme === 'dark'
          ? ['#d4b89d', '#d8827e', '#ff8fb0', '#77a8d9', '#89c5a2', '#f0bc71']
          : ['#d9bba0', '#bf7f63', '#8f314b', '#355c7d', '#567a68', '#c68b3d'],
        borderRadius: 24,
        borderSkipped: false,
      },
    ],
  };

  const senderSplit = {
    labels: [story.meLabel, story.themLabel],
    datasets: [
      {
        data: [data.metrics.bySender.me.messages, data.metrics.bySender.them.messages],
        backgroundColor: theme === 'dark' ? ['#7ab8eb', '#ff8fb0'] : ['#355c7d', '#8f314b'],
        borderWidth: 0,
      },
    ],
  };

  const milestonePhases = [
    {
      id: 'before',
      kicker: 'Etapa amigos',
      title: 'Antes del 27 de diciembre de 2025',
      range: 'Del primer rastro al momento en que todo empezó a acercarse más.',
    },
    {
      id: 'courting',
      kicker: 'Etapa pretendiente',
      title: 'Del 27 de diciembre de 2025 al 7 de febrero de 2026',
      range: 'Aquí fue donde ya se notó clarísimo que la historia estaba cambiando de tono.',
    },
    {
      id: 'official',
      kicker: 'Etapa novios',
      title: 'Del 8 de febrero de 2026 hasta hoy',
      range: 'El tramo donde el cariño ya se volvió lenguaje, rutina y vida compartida.',
    },
  ] as const;

  const isVisible = (id: (typeof sectionIds)[number]) => visibleSections.has(id);
  const chartTextColor = theme === 'dark' ? '#f4e4d6' : '#312621';
  const chartGridColor = theme === 'dark' ? 'rgba(255, 239, 224, 0.12)' : 'rgba(58, 43, 35, 0.08)';
  const chartTickColor = theme === 'dark' ? '#dbc6b6' : '#735f55';

  return (
    <main ref={shellRef} className="story-shell">
      <section className="hero-story story-section depth-strong scene-panel story-stage" data-reveal data-section="hero">
        <header className="story-nav">
          <div className="story-brand">
            <span className="story-brand-mark">
              <SparklesIcon size={18} />
            </span>
            <div>
              <strong>{story.meLabel} + {story.themLabel}</strong>
              <span>Nuestra historia</span>
            </div>
          </div>
          <div className="story-nav-actions">
            <span className="story-nav-pill">{formatNumber(totalMessages)} mensajes</span>
            <button
              type="button"
              className="theme-toggle"
              onClick={() => setTheme((current) => (current === 'dark' ? 'light' : 'dark'))}
              aria-label={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
            >
              {theme === 'dark' ? <SunMedium size={18} /> : <MoonStar size={18} />}
              <span>{theme === 'dark' ? 'Claro' : 'Oscuro'}</span>
            </button>
          </div>
        </header>

        <div className="hero-grid">
          <div className="hero-copy">
            <p className="story-kicker">Una historia contada en mensajes</p>
            <div className="hero-display">
              <div className="hero-display-line">
                <span>Nuestra</span>
                <span className="hero-shape hero-shape-heart" aria-hidden="true" />
              </div>
              <div className="hero-display-line">
                <span>historia,</span>
                <span className="hero-chip">
                  la que
                  <SparklesIcon size={18} />
                </span>
              </div>
              <div className="hero-display-line hero-display-line-final">
                <span>se escribe</span>
              </div>
              <div className="hero-display-line hero-display-line-final">
                <span>día a día</span>
              </div>
            </div>
            <p className="hero-subtitle">
              Todo lo que se han dicho {story.meLabel} y {story.themLabel}, llevado a un formato grande, claro y emocional: ritmo, etapas, palabras importantes y la manera en que se han ido encontrando.
            </p>
          </div>

          <div className="hero-visual">
            <div className="hero-object hero-object-helmet" aria-hidden="true" />
            <div className="hero-object hero-object-loop" aria-hidden="true" />
            <div className="hero-object hero-object-star" aria-hidden="true" />
            <div className="hero-floating-card stat-card-large">
              <span>mensajes entre los dos</span>
              <strong>{formatNumber(totalMessages)}</strong>
            </div>
            <div className="hero-floating-card stat-card-small">
              <span>días con algo que decir</span>
              <strong>{formatNumber(story.activeDays)}</strong>
            </div>
            <div className="hero-floating-card stat-card-mid">
              <span>años que abraza esta historia</span>
              <strong>{story.yearlyCounts.length}</strong>
            </div>
          </div>
        </div>

        <div className="hero-baseline">
          <div className="hero-baseline-line" />
          <div className="hero-baseline-grid">
            <div className="hero-scroll-cue">
              <ArrowDown size={16} />
              <span>Desliza para seguir viendo</span>
            </div>
            <div className="hero-meta">
              <MetaPill icon={<CalendarRange size={15} />} label={formatRangeLabel(data.chat.dateRange.start, data.chat.dateRange.end)} />
              <MetaPill icon={<MessageCircleMore size={15} />} label={`${formatNumber(totalMessages)} mensajes en total`} />
            </div>
            <div className="hero-rhythm">
              <p>Quién habló más, cuándo se intensificó todo, cuántas veces dijeron te amo y cómo se fue armando una historia real.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="chapter-band story-section depth-soft story-stage" data-reveal data-section="opening">
        <div className="chapter-band-copy">
          <p className="story-kicker">Para empezar</p>
          <h2>Una conversación que se volvió parte de la vida</h2>
          <p>
            Desde ese primer hola hasta el mensaje más reciente pasaron {formatNumber(story.totalSpanDays)} días. En {formatNumber(story.activeDays)} de
            esos días hubo palabras, fotos, audios o alguna manera de buscarse.
          </p>
        </div>
        <div className="chapter-band-grid">
          <HeroMetric label={`Palabras de ${story.meLabel}`} value={formatNumber(story.wordsBySender.find((item) => item.label === story.meLabel)?.value ?? 0)} />
          <HeroMetric label={`Palabras de ${story.themLabel}`} value={formatNumber(story.wordsBySender.find((item) => item.label === story.themLabel)?.value ?? 0)} />
          <HeroMetric label="Fotos compartidas" value={formatNumber(story.mediaCards.find((item) => item.label === 'Fotos')?.count ?? 0)} />
          <HeroMetric label="Te amo escritos" value={formatNumber(data.metrics.totals.teAmoCount)} />
        </div>
      </section>

      <section className="compare-section story-section depth-mid story-stage" data-reveal data-section="compare">
        <div className="section-heading">
          <p className="story-kicker">Lo que se ve al instante</p>
          <h2>Quién busca más al otro y cómo se reparte la conversación</h2>
          <p>
            A simple vista: {story.meLabel} mandó {formatNumber(meMessages)} mensajes y {story.themLabel} {formatNumber(themMessages)}. La diferencia fue de {formatNumber(messageGap)} mensajes.
          </p>
        </div>
        <div className="compare-grid">
          <CompareCard
            label={story.meLabel}
            value={formatNumber(data.metrics.bySender.me.messages)}
            detail={`${Math.round((data.metrics.bySender.me.messages / data.metrics.totals.messages) * 100)}% del total`}
            tone="teal"
          />
          <CompareCard
            label={story.themLabel}
            value={formatNumber(data.metrics.bySender.them.messages)}
            detail={`${Math.round((data.metrics.bySender.them.messages / data.metrics.totals.messages) * 100)}% del total`}
            tone="rose"
          />
          <article className="compare-card compare-card-lead">
            <p className="story-kicker">Balance</p>
            <h3>{story.messageLeadSentence}</h3>
            <div className="compare-summary-rows">
              <p>
                <strong>{story.meLabel}</strong>
                <span>{formatNumber(data.metrics.bySender.me.messages)} mensajes</span>
              </p>
              <p>
                <strong>{story.themLabel}</strong>
                <span>{formatNumber(data.metrics.bySender.them.messages)} mensajes</span>
              </p>
            </div>
            <p>La diferencia se nota, pero lo bonito es que la historia se sigue sosteniendo entre los dos.</p>
          </article>
        </div>
      </section>

      <section className="impact-section story-section depth-soft story-stage single-panel-section" data-reveal data-section="love">
        <div className="impact-card te-amo-card spotlight-card">
          <p className="story-kicker">Lo más importante</p>
          <h2>Nos dijimos “te amo”</h2>
          <div className="heart-count">
            <Heart size={34} />
            <strong>{formatNumber(data.metrics.totals.teAmoCount)}</strong>
          </div>
          <p>
            La primera vez que apareció por escrito fue el {data.metrics.firstTeAmo ? formatPreciseTimestamp(data.metrics.firstTeAmo.ts, data.relationship.timezone) : 'día que no pudimos identificar'}
          </p>
        </div>
      </section>

      <section className="chart-section story-section depth-strong story-stage chart-stage-section" data-reveal data-section="monthly">
        <div className="section-heading chart-heading chart-heading-display">
          <p className="story-kicker">Cómo se fue moviendo</p>
          <h2>Mensajes por mes</h2>
          <p>Una línea viva para ver cómo fue creciendo el ritmo de la conversación a través del tiempo.</p>
        </div>
        <div className="chart-stage-layout">
          <div className="chart-stat-strip">
            <article className="chart-insight-card chart-insight-card-rose">
              <p className="story-kicker">Pico del ritmo</p>
              <strong>{topMonth ? formatNumber(topMonth.total) : formatNumber(0)}</strong>
              <p>{topMonth ? `El mes más intenso fue ${formatMonthLabel(topMonth.month)}.` : 'La historia sigue esperando su mes más intenso.'}</p>
            </article>
            <article className="chart-insight-card chart-insight-card-neutral">
              <p className="story-kicker">Promedio</p>
              <strong>{formatNumber(averageMonthlyMessages)}</strong>
              <p>En promedio, cada mes dejó esta cantidad de mensajes entre los dos.</p>
            </article>
          </div>
          <div className="chart-stage-card line-stage">
            {isVisible('monthly') ? <Line data={monthlyChart} options={lineOptions(monthLabels, chartTextColor, chartTickColor, chartGridColor, progressiveDuration, progressiveDelay, previousY) as any} /> : null}
          </div>
        </div>
      </section>

      <section className="chart-section story-section depth-mid story-stage chart-stage-section" data-reveal data-section="yearly">
        <div className="section-heading chart-heading chart-heading-display">
          <p className="story-kicker">Los capítulos</p>
          <h2>Mensajes por año</h2>
          <p>Un vistazo amplio para sentir en qué momentos la historia se aceleró, se sostuvo o tomó fuerza.</p>
        </div>
        <div className="chart-stage-layout chart-stage-layout-yearly">
          <div className="chart-stat-strip chart-stat-strip-yearly">
            <article className="chart-insight-card chart-insight-card-teal">
              <p className="story-kicker">Año más intenso</p>
              <strong>{topYear ? topYear.year : '—'}</strong>
              <p>{topYear ? `${formatNumber(topYear.count)} mensajes hicieron de ${topYear.year} el capítulo más activo.` : 'Aún no hay suficiente información para ver el año más intenso.'}</p>
            </article>
          </div>
          <div className="chart-stage-card bar-stage">
            {isVisible('yearly') ? <Bar data={yearlyChart} options={barOptions(chartTextColor, chartTickColor, chartGridColor)} /> : null}
          </div>
        </div>
      </section>

      <section className="chapters-section story-section depth-mid story-stage" data-reveal data-section="chapters">
        <div className="section-heading chapters-heading">
          <p className="story-kicker">La historia por etapas</p>
          <h2>Capítulos fáciles de leer a simple vista</h2>
        </div>
        <div className="chapter-cards">
          {story.chapters.map((chapter, index) => (
            <article key={chapter.id} className={`chapter-card chapter-card--${index % 5}`}>
              <span>{chapter.label}</span>
              <strong>{formatNumber(chapter.messages)}</strong>
              <p>{chapter.summary}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="gallery-section story-section depth-soft story-stage" data-reveal data-section="media">
        <div className="section-heading narrow">
          <p className="story-kicker">Todo lo que se mandaron</p>
          <h2>No solo fueron textos</h2>
          <p>También hubo fotos, audios, videos y stickers. La conversación se fue contando en muchos formatos.</p>
        </div>
        <div className="media-summary-grid">
          {story.mediaCards.map((card) => (
            <article key={card.label} className={`media-summary-card ${card.tone}`}>
              <span className="media-summary-icon">
                {card.label === 'Fotos' ? <ImageIcon size={20} /> : null}
                {card.label === 'Audios' ? <Mic size={20} /> : null}
                {card.label === 'Videos y gifs' ? <PlayCircle size={20} /> : null}
                {card.label === 'Stickers' ? <Sticker size={20} /> : null}
              </span>
              <strong>{formatNumber(card.count)}</strong>
              <p>{card.label}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="moments-section story-section depth-strong story-stage" data-reveal data-section="moments">
        <div className="section-heading">
          <p className="story-kicker">Momentos que dicen mucho</p>
          <h2>Pequeñas escenas para contar una historia grande</h2>
        </div>
        <div className="moments-grid">
          {story.moments.map((moment) => (
            <article key={`${moment.label}-${moment.ts}`} className="moment-card">
              <p className="moment-label">{moment.label}</p>
              <h3>{moment.senderLabel}</h3>
              <p className="moment-detail">{moment.detail}</p>
              <blockquote>{trimText(moment.text, 180)}</blockquote>
              <time>{timestampToDisplay(moment.ts, data.relationship.timezone)}</time>
            </article>
          ))}
          {story.topDay ? (
            <article className="moment-card moment-card-accent">
              <p className="moment-label">Día más intenso</p>
              <h3>{formatNumber(story.topDay.count)} mensajes</h3>
              <p className="moment-detail">Fue uno de esos días en los que la conversación no quiso parar.</p>
              <time>{formatDay(story.topDay.day)}</time>
            </article>
          ) : null}
        </div>
      </section>

      <section className="closing-section story-section depth-mid story-stage closing-stage" data-reveal data-section="closing">
        <div className="closing-copy">
          <p className="story-kicker">Y todavía sigue</p>
          <h2>Lo bonito de esta historia es que sigue creciendo.</h2>
          <p>
            Aquí no está todo lo que sienten, pero sí se alcanza a ver algo precioso: la forma en que se buscan, se responden y se acompañan día tras día.
          </p>
          <div className="closing-ledger">
            <p><strong>{story.meLabel}</strong><span>{formatNumber(meMessages)} mensajes</span></p>
            <p><strong>{story.themLabel}</strong><span>{formatNumber(themMessages)} mensajes</span></p>
          </div>
        </div>
        <div className="closing-chart">
          <div className="chart-wrap doughnut-wrap">
            {isVisible('closing') ? <Doughnut data={senderSplit} options={doughnutOptions(chartTextColor)} /> : null}
          </div>
        </div>
      </section>

      <section className="milestones-section story-section story-stage is-visible" data-section="milestones">
        <div className="milestones-intro">
          <p className="story-kicker">Los hitos de esta historia</p>
          <h2>Un timeline para ver dónde fueron cambiando las cosas</h2>
          <p>
            Veintitrés momentos repartidos entre amigos, pretendiente y novios. Algunos salen claritos del chat, otros están anclados por la fecha que ustedes recuerdan y unos pocos se dejan leer por el ritmo de la conversación.
          </p>
        </div>

        <div className="milestone-phase-list">
          {milestonePhases.map((phase) => {
            const items = story.timelineMilestones.filter((milestone) => milestone.phaseId === phase.id);
            return <MilestoneRoadmap key={phase.id} phase={phase} items={items} />;
          })}
        </div>
      </section>

      <footer className="story-footer">{`Con  ❤️, hecho por ${data.chat.authorSignature ?? story.meLabel} con Codex`}</footer>
    </main>
  );
}

function timelineEvidenceLabel(value: 'confirmado' | 'anclado' | 'inferido'): string {
  if (value === 'confirmado') return 'Confirmado';
  if (value === 'anclado') return 'Anclado por ustedes';
  return 'Inferido por contexto';
}

function MilestoneRoadmap({
  phase,
  items,
}: {
  phase: { id: 'before' | 'courting' | 'official'; kicker: string; title: string; range: string };
  items: Array<{
    id: string;
    phaseId: 'before' | 'courting' | 'official';
    day: string;
    title: string;
    summary: string;
    tag: string;
    evidence: 'confirmado' | 'anclado' | 'inferido';
  }>;
}) {
  const layout = buildRoadmapLayout(items.length);

  return (
    <section className={`milestone-phase milestone-phase--${phase.id}`}>
      <div className="milestone-phase-head">
        <p className="milestone-phase-kicker">{phase.kicker}</p>
        <h3>{phase.title}</h3>
        <p>{phase.range}</p>
      </div>

      <div className="milestone-roadmap">
        <div className="milestone-roadmap-mobile">
          {items.map((milestone, index) => (
            <article key={milestone.id} className="milestone-stack-card">
              <div className="milestone-stack-index">{String(index + 1).padStart(2, '0')}</div>
              <div className="milestone-stack-body">
                <div className="milestone-card-topline">
                  <span className="milestone-tag">{milestone.tag}</span>
                  <span className={`milestone-evidence milestone-evidence--${milestone.evidence}`}>{timelineEvidenceLabel(milestone.evidence)}</span>
                </div>
                <p className="milestone-day">{formatDay(milestone.day)}</p>
                <h4>{milestone.title}</h4>
                <p>{milestone.summary}</p>
              </div>
            </article>
          ))}
        </div>

        <div
          className="milestone-roadmap-desktop"
          style={{
            ['--road-width' as string]: `${layout.width}px`,
            ['--road-height' as string]: `${layout.height}px`,
            ['--road-canvas-height' as string]: `${layout.canvasHeight}px`,
          }}
        >
          <svg
            className="milestone-road-svg"
            viewBox={`0 0 ${layout.width} ${layout.height}`}
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <path className="milestone-road-shadow" d={layout.path} pathLength={100} />
            <path className="milestone-road-track" d={layout.path} pathLength={100} />
            <path className="milestone-road-lane" d={layout.path} pathLength={100} />
          </svg>

          {layout.points.map((point, index) => {
            const milestone = items[index];
            const cardWidth = 280;
            const cardLeft = Math.max(18, Math.min(layout.width - cardWidth - 18, point.x - cardWidth / 2));
            const cardTop = point.row % 2 === 0 ? Math.max(26, point.y - 220) : point.y + 56;

            return (
              <div key={milestone.id} className="milestone-road-node-wrap">
                <div
                  className="milestone-road-node"
                  style={{
                    left: `${point.x}px`,
                    top: `${point.y}px`,
                  }}
                >
                  <span>{String(index + 1).padStart(2, '0')}</span>
                </div>

                <article
                  className={`milestone-card milestone-card-road milestone-card-road--${index % 4}`}
                  style={{
                    left: `${cardLeft}px`,
                    top: `${cardTop}px`,
                  }}
                >
                  <div className="milestone-card-topline">
                    <span className="milestone-tag">{milestone.tag}</span>
                    <span className={`milestone-evidence milestone-evidence--${milestone.evidence}`}>{timelineEvidenceLabel(milestone.evidence)}</span>
                  </div>
                  <p className="milestone-day">{formatDay(milestone.day)}</p>
                  <h4>{milestone.title}</h4>
                  <p>{milestone.summary}</p>
                </article>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function buildRoadmapLayout(itemCount: number) {
  const columns = Math.min(3, Math.max(itemCount, 1));
  const startY = 240;
  const columnGap = 330;
  const rowGap = 320;
  const roadInset = 150;
  const rows = Math.ceil(itemCount / columns);
  const width = roadInset * 2 + (columns - 1) * columnGap;
  const height = startY * 2 + Math.max(rows - 1, 0) * rowGap;
  const canvasHeight = height + 320;

  const points = Array.from({ length: itemCount }, (_, index) => {
    const row = Math.floor(index / columns);
    const indexInRow = index % columns;
    const col = row % 2 === 0 ? indexInRow : columns - 1 - indexInRow;
    return {
      x: roadInset + col * columnGap,
      y: startY + row * rowGap,
      row,
      col,
    };
  });

  const path = points.reduce((accumulator, point, index) => {
    if (index === 0) return `M ${point.x} ${point.y}`;
    const prev = points[index - 1];
    if (prev.row === point.row) {
      const curve = (point.x - prev.x) * 0.35;
      return `${accumulator} C ${prev.x + curve} ${prev.y}, ${point.x - curve} ${point.y}, ${point.x} ${point.y}`;
    }

    const direction = prev.x > width / 2 ? 1 : -1;
    const elbow = 92;
    return `${accumulator} C ${prev.x + elbow * direction} ${prev.y + 44}, ${point.x + elbow * direction} ${point.y - 44}, ${point.x} ${point.y}`;
  }, '');

  return {
    width,
    height,
    canvasHeight,
    points,
    path,
  };
}

function MetaPill({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <span className="meta-pill">
      {icon}
      {label}
    </span>
  );
}

function HeroMetric({ label, value }: { label: string; value: string }) {
  return (
    <article className="hero-metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

function CompareCard({ label, value, detail, tone }: { label: string; value: string; detail: string; tone: 'teal' | 'rose' }) {
  return (
    <article className={`compare-card ${tone}`}>
      <p className="story-kicker">{label}</p>
      <strong>{value}</strong>
      <span>{detail}</span>
    </article>
  );
}

function trimText(value: string, maxLength: number): string {
  const compact = value.replace(/\s+/g, ' ').trim();
  if (compact.length <= maxLength) return compact;
  return `${compact.slice(0, maxLength - 1)}...`;
}

const sharedChartOptions = (chartTextColor: string) => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      labels: {
        color: chartTextColor,
        boxWidth: 10,
        usePointStyle: true,
      },
    },
  },
});

const lineOptions = (
  monthLabels: string[],
  chartTextColor: string,
  chartTickColor: string,
  chartGridColor: string,
  progressiveDuration: (ctx: { index: number }) => number,
  progressiveDelay: (ctx: { index: number }) => number,
  previousY: (ctx: { index: number; chart: any; datasetIndex: number }) => number,
) => ({
  ...sharedChartOptions(chartTextColor),
  animation: {
    x: {
      type: 'number',
      easing: 'linear',
      duration: progressiveDuration,
      from: NaN,
      delay(ctx: any) {
        if (ctx.type !== 'data' || ctx.xStarted) return 0;
        ctx.xStarted = true;
        return progressiveDelay(ctx);
      },
    },
    y: {
      type: 'number',
      easing: 'linear',
      duration: progressiveDuration,
      from: previousY,
      delay(ctx: any) {
        if (ctx.type !== 'data' || ctx.yStarted) return 0;
        ctx.yStarted = true;
        return progressiveDelay(ctx);
      },
    },
  },
  interaction: {
    intersect: false,
    mode: 'index' as const,
  },
  scales: {
    x: {
      type: 'linear' as const,
      ticks: {
        color: chartTickColor,
        callback(value: string | number) {
          const index = Number(value);
          return monthLabels[index] ?? '';
        },
        maxTicksLimit: 6,
      },
      grid: { display: false },
    },
    y: {
      ticks: { color: chartTickColor },
      grid: { color: chartGridColor },
    },
  },
}) as const;

const barOptions = (chartTextColor: string, chartTickColor: string, chartGridColor: string) => ({
  ...sharedChartOptions(chartTextColor),
  animation: {
    duration: 2100,
    easing: 'easeOutQuart' as const,
    delay(ctx: any) {
      return ctx.type === 'data' ? ctx.dataIndex * 120 : 0;
    },
  },
  scales: {
    x: { ticks: { color: chartTickColor }, grid: { display: false } },
    y: { ticks: { color: chartTickColor }, grid: { color: chartGridColor } },
  },
});

const doughnutOptions = (chartTextColor: string) => ({
  ...sharedChartOptions(chartTextColor),
  animation: {
    animateRotate: true,
    animateScale: true,
    duration: 2700,
    easing: 'easeOutExpo' as const,
  },
  cutout: '72%',
});

export default App;
