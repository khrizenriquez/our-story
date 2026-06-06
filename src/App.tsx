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
import { CalendarRange, Heart, Image as ImageIcon, MessageCircleMore, Mic, PlayCircle, Sparkles, Sticker } from 'lucide-react';
import type { LoadedChatExport } from './types';
import { loadChatExport } from './lib/data';
import { timestampToDisplay } from './lib/dates';
import { deriveStoryModel } from './lib/story';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Tooltip, Legend, Filler);

const numberFormatter = new Intl.NumberFormat('es-GT');

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

function App() {
  const shellRef = useRef<HTMLElement | null>(null);
  const [data, setData] = useState<LoadedChatExport | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  const story = useMemo(() => (data ? deriveStoryModel(data) : null), [data]);

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

  const monthlyChart = {
    labels: story.monthlyCounts.map((entry) => entry.month),
    datasets: [
      {
        label: 'Mensajes',
        data: story.monthlyCounts.map((entry) => entry.count),
        borderColor: '#8f314b',
        backgroundColor: 'rgba(143, 49, 75, 0.14)',
        fill: true,
        tension: 0.35,
        pointRadius: 0,
      },
    ],
  };

  const yearlyChart = {
    labels: story.yearlyCounts.map((entry) => entry.year),
    datasets: [
      {
        label: 'Mensajes',
        data: story.yearlyCounts.map((entry) => entry.count),
        backgroundColor: ['#d9bba0', '#bf7f63', '#8f314b', '#355c7d', '#567a68', '#c68b3d'],
        borderRadius: 12,
      },
    ],
  };

  const senderSplit = {
    labels: [story.meLabel, story.themLabel],
    datasets: [
      {
        data: [data.metrics.bySender.me.messages, data.metrics.bySender.them.messages],
        backgroundColor: ['#355c7d', '#8f314b'],
        borderWidth: 0,
      },
    ],
  };

  return (
    <main ref={shellRef} className="story-shell">
      <section className="hero-story story-section depth-strong" data-reveal>
        <div className="hero-copy">
          <p className="story-kicker">Nuestra historia en mensajes</p>
          <h1>{story.poeticTitle}</h1>
          <p className="hero-subtitle">
            Una forma bonita y clara de mirar todo lo que se han dicho {story.meLabel} y {story.themLabel}, desde ese primer hola hasta lo que siguen construyendo hoy.
          </p>
          <div className="hero-meta">
            <MetaPill icon={<CalendarRange size={15} />} label={formatRangeLabel(data.chat.dateRange.start, data.chat.dateRange.end)} />
            <MetaPill icon={<MessageCircleMore size={15} />} label={`${formatNumber(data.messages.length)} mensajes en total`} />
          </div>
        </div>
        <div className="hero-visual">
          <div className="hero-floating-card stat-card-large">
            <span>mensajes entre los dos</span>
            <strong>{formatNumber(data.messages.length)}</strong>
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
      </section>

      <section className="chapter-band story-section depth-soft" data-reveal>
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

      <section className="compare-section story-section depth-mid" data-reveal>
        <div className="section-heading">
          <p className="story-kicker">Lo que se ve al instante</p>
          <h2>Quien busca mas al otro y como se reparte la conversacion</h2>
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

      <section className="impact-section story-section depth-soft" data-reveal>
        <div className="impact-card te-amo-card">
          <p className="story-kicker">Lo mas importante</p>
          <h2>Nos dijimos “te amo”</h2>
          <div className="heart-count">
            <Heart size={34} />
            <strong>{formatNumber(data.metrics.totals.teAmoCount)}</strong>
          </div>
          <p>
            La primera vez que aparecio por escrito fue el {data.metrics.firstTeAmo ? formatDay(data.metrics.firstTeAmo.day) : 'dia que no pudimos identificar'}.
          </p>
        </div>
        <div className="impact-card chart-card">
          <p className="story-kicker">Como se fue moviendo</p>
          <h2>Mensajes por mes</h2>
          <div className="chart-wrap">
            <Line data={monthlyChart} options={lineOptions} />
          </div>
        </div>
        <div className="impact-card chart-card">
          <p className="story-kicker">Los capitulos</p>
          <h2>Mensajes por año</h2>
          <div className="chart-wrap">
            <Bar data={yearlyChart} options={barOptions} />
          </div>
        </div>
      </section>

      <section className="chapters-section story-section depth-mid" data-reveal>
        <div className="section-heading">
          <p className="story-kicker">La historia por etapas</p>
          <h2>Capitulos faciles de leer a simple vista</h2>
        </div>
        <div className="chapter-cards">
          {story.chapters.map((chapter) => (
            <article key={chapter.id} className="chapter-card">
              <span>{chapter.label}</span>
              <strong>{formatNumber(chapter.messages)}</strong>
              <p>{chapter.summary}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="gallery-section story-section depth-soft" data-reveal>
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

      <section className="moments-section story-section depth-strong" data-reveal>
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

      <section className="closing-section story-section depth-mid" data-reveal>
        <div className="closing-copy">
          <p className="story-kicker">Y todavia sigue</p>
          <h2>Lo bonito de esta historia es que sigue creciendo.</h2>
          <p>
            Aqui no esta todo lo que sienten, pero si se alcanza a ver algo precioso: la forma en que se buscan, se responden y se acompanian dia tras dia.
          </p>
        </div>
        <div className="closing-chart">
          <div className="chart-wrap doughnut-wrap">
            <Doughnut data={senderSplit} options={doughnutOptions} />
          </div>
        </div>
      </section>

      <footer className="story-footer">Con amor, hecho por {data.chat.authorSignature ?? story.meLabel} con Codex ❤️</footer>
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

const sharedChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      labels: {
        color: '#312621',
        boxWidth: 10,
        usePointStyle: true,
      },
    },
  },
};

const lineOptions = {
  ...sharedChartOptions,
  scales: {
    x: { ticks: { color: '#735f55', maxTicksLimit: 8 }, grid: { display: false } },
    y: { ticks: { color: '#735f55' }, grid: { color: 'rgba(58, 43, 35, 0.08)' } },
  },
};

const barOptions = {
  ...sharedChartOptions,
  scales: {
    x: { ticks: { color: '#735f55' }, grid: { display: false } },
    y: { ticks: { color: '#735f55' }, grid: { color: 'rgba(58, 43, 35, 0.08)' } },
  },
};

const doughnutOptions = {
  ...sharedChartOptions,
  cutout: '70%',
};

export default App;
