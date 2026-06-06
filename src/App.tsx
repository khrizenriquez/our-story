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
import { CalendarRange, Heart, Image as ImageIcon, MessageCircleMore, Mic, MoonStar, PlayCircle, Sticker, SunMedium } from 'lucide-react';
import type { LoadedChatExport } from './types';
import { loadChatExport } from './lib/data';
import { timestampToDisplay } from './lib/dates';
import { deriveStoryModel } from './lib/story';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Tooltip, Legend, Filler);

const numberFormatter = new Intl.NumberFormat('es-GT');
const sectionIds = ['hero', 'opening', 'compare', 'love', 'monthly', 'yearly', 'chapters', 'media', 'moments', 'closing'] as const;
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

  const story = useMemo(() => (data ? data.story ?? deriveStoryModel(data) : null), [data]);
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

  const monthLabels = story.monthlyCounts.map((entry) => entry.month);
  const monthlyPoints = story.monthlyCounts.map((entry, index) => ({ x: index, y: entry.count }));
  const topMonth = [...story.monthlyCounts].sort((left, right) => right.count - left.count)[0] ?? null;
  const topYear = [...story.yearlyCounts].sort((left, right) => right.count - left.count)[0] ?? null;
  const averageMonthlyMessages = story.monthlyCounts.length > 0 ? Math.round(totalMessages / story.monthlyCounts.length) : 0;
  const meMessages = data.metrics.bySender.me.messages;
  const themMessages = data.metrics.bySender.them.messages;
  const messageGap = Math.abs(meMessages - themMessages);
  const lineEasing = (value: number) => 1 - (1 - value) ** 4;
  const totalDuration = 3150;
  const progressiveDuration = (ctx: { index: number }) => lineEasing(ctx.index / Math.max(monthlyPoints.length, 1)) * totalDuration / Math.max(monthlyPoints.length, 1);
  const progressiveDelay = (ctx: { index: number }) => lineEasing(ctx.index / Math.max(monthlyPoints.length, 1)) * totalDuration;
  const previousY = (ctx: { index: number; chart: any; datasetIndex: number }) =>
    ctx.index === 0 ? ctx.chart.scales.y.getPixelForValue(0) : ctx.chart.getDatasetMeta(ctx.datasetIndex).data[ctx.index - 1].getProps(['y'], true).y;

  const monthlyChart = {
    datasets: [
      {
        label: 'Mensajes',
        data: monthlyPoints,
        borderColor: theme === 'dark' ? '#ff8fb0' : '#8f314b',
        backgroundColor: theme === 'dark' ? 'rgba(255, 143, 176, 0.14)' : 'rgba(143, 49, 75, 0.14)',
        fill: true,
        tension: 0.42,
        pointRadius: 0,
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

  const isVisible = (id: (typeof sectionIds)[number]) => visibleSections.has(id);
  const chartTextColor = theme === 'dark' ? '#f4e4d6' : '#312621';
  const chartGridColor = theme === 'dark' ? 'rgba(255, 239, 224, 0.12)' : 'rgba(58, 43, 35, 0.08)';
  const chartTickColor = theme === 'dark' ? '#dbc6b6' : '#735f55';

  return (
    <main ref={shellRef} className="story-shell">
      <button
        type="button"
        className="theme-toggle"
        onClick={() => setTheme((current) => (current === 'dark' ? 'light' : 'dark'))}
        aria-label={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      >
        {theme === 'dark' ? <SunMedium size={18} /> : <MoonStar size={18} />}
        <span>{theme === 'dark' ? 'Claro' : 'Oscuro'}</span>
      </button>

      <section className="hero-story story-section depth-strong scene-panel" data-reveal data-section="hero">
        <div className="hero-copy">
          <p className="story-kicker">Nuestra historia en mensajes</p>
          <h1>{story.poeticTitle}</h1>
          <p className="hero-subtitle">
            Una forma bonita y clara de mirar todo lo que se han dicho {story.meLabel} y {story.themLabel}, desde ese primer hola hasta lo que siguen construyendo hoy.
          </p>
          <div className="hero-meta">
            <MetaPill icon={<CalendarRange size={15} />} label={formatRangeLabel(data.chat.dateRange.start, data.chat.dateRange.end)} />
            <MetaPill icon={<MessageCircleMore size={15} />} label={`${formatNumber(totalMessages)} mensajes en total`} />
          </div>
          <div className="hero-rhythm">
            <p>Una historia que se puede leer en grande: quien hablo mas, cuando se intensifico, cuantas veces dijeron te amo y cuantos dias se siguieron buscando.</p>
          </div>
        </div>
        <div className="hero-visual">
          <div className="hero-floating-card stat-card-large">
            <span>mensajes entre los dos</span>
            <strong>{formatNumber(totalMessages)}</strong>
          </div>
          <div className="hero-floating-card stat-card-small">
            <span>dias con algo que decir</span>
            <strong>{formatNumber(story.activeDays)}</strong>
          </div>
          <div className="hero-floating-card stat-card-mid">
            <span>años que abraza esta historia</span>
            <strong>{story.yearlyCounts.length}</strong>
          </div>
        </div>
        <div className="hero-scroll-cue">
          <span>desliza y deja que la historia aparezca</span>
        </div>
      </section>

      <section className="chapter-band story-section depth-soft story-stage" data-reveal data-section="opening">
        <div className="chapter-band-copy">
          <p className="story-kicker">Para empezar</p>
          <h2>Una conversacion que se volvio parte de la vida</h2>
          <p>
            Desde ese primer hola hasta el mensaje mas reciente pasaron {formatNumber(story.totalSpanDays)} dias. En {formatNumber(story.activeDays)} de
            esos dias hubo palabras, fotos, audios o alguna manera de buscarse.
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
          <h2>Quien busca mas al otro y como se reparte la conversacion</h2>
          <p>
            A simple vista: {story.meLabel} mando {formatNumber(meMessages)} mensajes y {story.themLabel} {formatNumber(themMessages)}. La diferencia fue de {formatNumber(messageGap)} mensajes.
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
          <p className="story-kicker">Lo mas importante</p>
          <h2>Nos dijimos “te amo”</h2>
          <div className="heart-count">
            <Heart size={34} />
            <strong>{formatNumber(data.metrics.totals.teAmoCount)}</strong>
          </div>
          <p>
            La primera vez que aparecio por escrito fue el {data.metrics.firstTeAmo ? formatPreciseTimestamp(data.metrics.firstTeAmo.ts, data.relationship.timezone) : 'dia que no pudimos identificar'}
          </p>
        </div>
      </section>

      <section className="chart-section story-section depth-strong story-stage chart-stage-section" data-reveal data-section="monthly">
        <div className="section-heading chart-heading chart-heading-display">
          <p className="story-kicker">Como se fue moviendo</p>
          <h2>Mensajes por mes</h2>
          <p>Una linea viva para ver como fue creciendo el ritmo de la conversacion a traves del tiempo.</p>
        </div>
        <div className="chart-stage-layout">
          <div className="chart-stat-strip">
            <article className="chart-insight-card chart-insight-card-rose">
              <p className="story-kicker">Pico del ritmo</p>
              <strong>{topMonth ? formatNumber(topMonth.count) : formatNumber(0)}</strong>
              <p>{topMonth ? `El mes mas intenso fue ${formatMonthLabel(topMonth.month)}.` : 'La historia sigue esperando su mes mas intenso.'}</p>
            </article>
            <article className="chart-insight-card chart-insight-card-neutral">
              <p className="story-kicker">Promedio</p>
              <strong>{formatNumber(averageMonthlyMessages)}</strong>
              <p>En promedio, cada mes dejo esta cantidad de mensajes entre los dos.</p>
            </article>
          </div>
          <div className="chart-stage-card line-stage">
            {isVisible('monthly') ? <Line data={monthlyChart} options={lineOptions(monthLabels, chartTextColor, chartTickColor, chartGridColor, progressiveDuration, progressiveDelay, previousY) as any} /> : null}
          </div>
        </div>
      </section>

      <section className="chart-section story-section depth-mid story-stage chart-stage-section" data-reveal data-section="yearly">
        <div className="section-heading chart-heading chart-heading-display">
          <p className="story-kicker">Los capitulos</p>
          <h2>Mensajes por año</h2>
          <p>Un vistazo amplio para sentir en que momentos la historia se acelero, se sostuvo o tomo fuerza.</p>
        </div>
        <div className="chart-stage-layout chart-stage-layout-yearly">
          <div className="chart-stat-strip chart-stat-strip-yearly">
            <article className="chart-insight-card chart-insight-card-teal">
              <p className="story-kicker">Año mas intenso</p>
              <strong>{topYear ? topYear.year : '—'}</strong>
              <p>{topYear ? `${formatNumber(topYear.count)} mensajes hicieron de ${topYear.year} el capitulo mas activo.` : 'Aun no hay suficiente informacion para ver el anio mas intenso.'}</p>
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
          <h2>Capitulos faciles de leer a simple vista</h2>
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
          <p>Tambien hubo fotos, audios, videos y stickers. La conversacion se fue contando en muchos formatos.</p>
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
          <h2>Pequenas escenas para contar una historia grande</h2>
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
              <p className="moment-label">Dia mas intenso</p>
              <h3>{formatNumber(story.topDay.count)} mensajes</h3>
              <p className="moment-detail">Fue uno de esos dias en los que la conversacion no quiso parar.</p>
              <time>{formatDay(story.topDay.day)}</time>
            </article>
          ) : null}
        </div>
      </section>

      <section className="closing-section story-section depth-mid story-stage closing-stage" data-reveal data-section="closing">
        <div className="closing-copy">
          <p className="story-kicker">Y todavia sigue</p>
          <h2>Lo bonito de esta historia es que sigue creciendo.</h2>
          <p>
            Aqui no esta todo lo que sienten, pero si se alcanza a ver algo precioso: la forma en que se buscan, se responden y se acompanian dia tras dia.
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

      <footer className="story-footer">{`Con  ❤️, hecho por ${data.chat.authorSignature ?? story.meLabel} con Codex`}</footer>
    </main>
  );
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
