import type { ChatExport, ChatMessage } from '../types';
import { normalizeText } from './phrases';

export interface StoryChapter {
  id: string;
  label: string;
  range: string;
  messages: number;
  summary: string;
}

export interface StoryMoment {
  label: string;
  detail: string;
  ts: number;
  text: string;
  senderLabel: string;
}

export interface StoryMediaCard {
  label: string;
  count: number;
  tone: string;
}

export interface StoryImage {
  src: string;
  alt: string;
  messageId: string;
}

export interface StoryTimelineMilestone {
  id: string;
  phaseId: 'before' | 'courting' | 'official';
  day: string;
  title: string;
  summary: string;
  tag: string;
  evidence: 'confirmado' | 'anclado' | 'inferido';
}

export interface StoryModel {
  meLabel: string;
  themLabel: string;
  poeticTitle: string;
  subtitle: string;
  totalSpanDays: number;
  activeDays: number;
  messageLeadLabel: string;
  messageLeadPercent: number;
  messageLeadSentence: string;
  wordsBySender: Array<{ label: string; value: number }>;
  yearlyCounts: Array<{ year: string; count: number }>;
  monthlyCounts: Array<{ month: string; count: number }>;
  chapters: StoryChapter[];
  gallery: StoryImage[];
  heroImages: StoryImage[];
  moments: StoryMoment[];
  topDay: { day: string; count: number } | null;
  mediaCards: StoryMediaCard[];
  firstMeaningful: StoryMoment | null;
  timelineMilestones: StoryTimelineMilestone[];
}

function isMeaningful(message: ChatMessage): boolean {
  const text = normalizeText(message.text);
  if (!text) return Boolean(message.mediaPath);
  return !text.includes('this message was deleted') && !text.includes('messages and calls are end to end encrypted');
}

function isStoryworthyText(message: ChatMessage): boolean {
  const raw = message.text.trim();
  if (!raw) return false;
  if (raw.length > 180) return false;
  if (raw.split('\n').length > 2) return false;
  if (/^\d[\d\s+\-()]{6,}/.test(raw)) return false;
  if (/^[A-Za-z0-9+/=]{24,}$/.test(raw)) return false;
  if (/\.(jpg|jpeg|png|gif|mp4|mov|opus|mp3|pdf)$/i.test(raw)) return false;
  return /[A-Za-zÁÉÍÓÚáéíóúÑñ]/.test(raw);
}

function approximateWordCount(message: ChatMessage): number {
  return normalizeText(message.text).split(' ').filter(Boolean).length;
}

function summarizeYear(year: string, count: number): string {
  if (year === '2020') return `${count} primeros rastros de la conversacion.`;
  if (year === '2022') return `${count} mensajes cuando la historia empezo a tomar forma.`;
  if (year === '2023') return `${count} momentos en los que hablarse ya era parte del dia a dia.`;
  if (year === '2024') return `${count} mensajes para seguir cerca durante todo el anio.`;
  if (year === '2025') return `${count} mensajes en un tramo que fue agarrando mas ritmo.`;
  if (year === '2026') return `${count} mensajes en la etapa mas intensa de la conversacion.`;
  return `${count} mensajes compartidos en ${year}.`;
}

function evenlySample<T>(items: T[], count: number): T[] {
  if (items.length <= count) return items;
  const result: T[] = [];
  for (let index = 0; index < count; index += 1) {
    const ratio = index / Math.max(count - 1, 1);
    result.push(items[Math.round(ratio * (items.length - 1))]);
  }
  return result;
}

function normalizeMediaKey(type: string): string {
  if (type === 'photo' || type === 'image') return 'photo';
  if (type === 'video' || type === 'gif') return 'video';
  if (type === 'audio') return 'audio';
  if (type === 'sticker') return 'sticker';
  if (type === 'document') return 'document';
  return type || 'media';
}

function fallbackMomentText(message: ChatMessage): string {
  const mediaKey = normalizeMediaKey(message.mediaType);
  if (mediaKey === 'photo') return 'Una foto que quedo guardada entre ustedes.';
  if (mediaKey === 'audio') return 'Una nota de voz que todavia alcanza a contar algo.';
  if (mediaKey === 'video') return 'Un video compartido en medio de la historia.';
  if (mediaKey === 'sticker') return 'Un sticker que tambien hizo su parte.';
  if (mediaKey === 'document') return 'Algo importante tambien paso por aqui.';
  return 'Un pedacito de conversacion que sigue formando parte de la historia.';
}

function makeMoment(label: string, detail: string, message: ChatMessage | null): StoryMoment | null {
  if (!message) return null;
  const text = isStoryworthyText(message) ? message.text.replace(/\s+/g, ' ').trim() : fallbackMomentText(message);
  return {
    label,
    detail,
    ts: message.ts,
    text,
    senderLabel: message.senderLabel,
  };
}

function buildTimelineMilestones(meLabel: string, themLabel: string): StoryTimelineMilestone[] {
  return [
    {
      id: 'friends-2020-trace',
      phaseId: 'before',
      day: '2020-05-22',
      title: 'Aquí apareció la primera huella del chat',
      summary: `Es el primer rastro que quedó guardado entre ${meLabel} y ${themLabel}. No dice mucho todavía, pero marca el punto exacto en el que esta historia empezó a existir.`,
      tag: 'Primer rastro',
      evidence: 'confirmado',
    },
    {
      id: 'friends-2022-first-plan',
      phaseId: 'before',
      day: '2022-12-29',
      title: 'Ya sonaba a plan de ustedes',
      summary: 'Ese día coordinaron salir antes, cenar algo y acomodar el viaje. Se siente como uno de los primeros momentos en los que el plan ya era verse y compartir tiempo.',
      tag: 'Salida',
      evidence: 'confirmado',
    },
    {
      id: 'friends-2022-trip-date',
      phaseId: 'before',
      day: '2022-12-30',
      title: 'Hasta apareció la palabra cita',
      summary: 'En medio del viaje salió ese guiño de “hoy tenemos una cita”. Aunque todavía era jugando, el tono ya se prestaba para leerlo con otra intención.',
      tag: 'Viaje',
      evidence: 'confirmado',
    },
    {
      id: 'friends-2023-nodal-prep',
      phaseId: 'before',
      day: '2023-06-28',
      title: 'Se empezaron a preparar para Nodal',
      summary: 'Botas de hule, capas y toda la logística para no dejar que la lluvia arruinara la noche. Es un hito bonito porque ya había emoción compartida antes del evento.',
      tag: 'Concierto',
      evidence: 'confirmado',
    },
    {
      id: 'friends-2023-nodal-night',
      phaseId: 'before',
      day: '2023-06-30',
      title: 'Llegó la noche del concierto de Nodal',
      summary: 'Ese día ya estaban coordinando horas, salida y cómo moverse. Es uno de los primeros recuerdos grandes que el chat deja bastante claros.',
      tag: 'Concierto',
      evidence: 'confirmado',
    },
    {
      id: 'friends-2023-santa-teresita',
      phaseId: 'before',
      day: '2023-07-24',
      title: `${themLabel} te invitó a Santa Teresita`,
      summary: `Aquí ${themLabel} tomó la iniciativa con un plan claro, lo movió y hasta habló de reservar. Se siente como un hito importante porque el impulso vino directamente de ella.`,
      tag: 'Iniciativa de Patty',
      evidence: 'confirmado',
    },
    {
      id: 'friends-2025-patty-picks-up',
      phaseId: 'before',
      day: '2025-04-18',
      title: `${themLabel} pasó por ti`,
      summary: `Cuando ${themLabel} propone pasar por ${meLabel}, ya no es solo seguir la conversación: es una señal clara de comodidad, cercanía y ganas de hacer el plan realidad.`,
      tag: 'Iniciativa de Patty',
      evidence: 'confirmado',
    },
    {
      id: 'friends-2025-grupo-firme',
      phaseId: 'before',
      day: '2025-12-19',
      title: `Ella lanzó el “vamos” para otro concierto`,
      summary: `Ese “¿vamos?” para ir a ver a Grupo Firme es de esos mensajes pequeños que dicen mucho. Suena a ilusión compartida y a ganas de seguir acumulando noches juntos.`,
      tag: 'Concierto',
      evidence: 'confirmado',
    },
    {
      id: 'courting-2025-plan-before',
      phaseId: 'courting',
      day: '2025-12-26',
      title: 'El plan del día siguiente ya estaba puesto',
      summary: 'Desde aquí se siente el umbral: se ponen de acuerdo para el día siguiente, ajustan horarios y todo suena más a verse con intención que a un mensaje cualquiera.',
      tag: 'Preludio',
      evidence: 'inferido',
    },
    {
      id: 'courting-2025-the-coffee',
      phaseId: 'courting',
      day: '2025-12-27',
      title: 'The Coffee y el inicio de la pretendida',
      summary: 'Este es el hito que mejor funciona para marcar el arranque de esa nueva etapa. El encuentro existe, está en fecha, y coincide con el momento que tú recuerdas como el cambio real.',
      tag: 'Inicio pretendiente',
      evidence: 'anclado',
    },
    {
      id: 'courting-2026-new-year',
      phaseId: 'courting',
      day: '2026-01-01',
      title: 'Aceptó la salida de Año Nuevo',
      summary: 'Entre la madrugada, el “mañana paso por ti” y el agradecimiento por la invitación, este tramo se siente como uno de los primeros sí bien claros de esa nueva dinámica.',
      tag: 'Año Nuevo',
      evidence: 'confirmado',
    },
    {
      id: 'courting-2026-liked-seeing-you',
      phaseId: 'courting',
      day: '2026-01-11',
      title: 'Apareció el primer “me gustó verte”',
      summary: 'Chocolate, tiempo compartido y un mensaje directo después: que te gustó verla. Es uno de los hitos más bonitos para contar que esto ya iba subiendo de tono.',
      tag: 'Cita',
      evidence: 'confirmado',
    },
    {
      id: 'courting-2026-patty-dinner',
      phaseId: 'courting',
      day: '2026-01-23',
      title: `${themLabel} tomó la iniciativa para ir a cenar`,
      summary: `Primero te dijo que mejor descansaras. Luego, casi enseguida, te propuso salir a cenar al día siguiente. Es de esos momentos donde ${themLabel} da un paso claro hacia ti.`,
      tag: 'Iniciativa de Patty',
      evidence: 'confirmado',
    },
    {
      id: 'courting-2026-thirty-minutes',
      phaseId: 'courting',
      day: '2026-02-05',
      title: 'El día de los treinta minutos para hablar',
      summary: 'Tu mensaje de “solo te quiero robar unos 30 minutos para platicar” tiene mucho peso narrativo. Ya no era logística; era necesidad de hablar y cuidar lo que estaba naciendo.',
      tag: 'Conversación clave',
      evidence: 'confirmado',
    },
    {
      id: 'courting-2026-waited-awake',
      phaseId: 'courting',
      day: '2026-02-07',
      title: 'La madrugada en que te esperó despierta',
      summary: 'Ella te pide que le avises, quiere saber que llegaste bien y se queda pendiente. Como escena visual, es preciosa: ya había cuidado, ternura y desvelo de los dos lados.',
      tag: 'Noche larga',
      evidence: 'confirmado',
    },
    {
      id: 'official-2026-became-official',
      phaseId: 'official',
      day: '2026-02-08',
      title: 'El día en que empezaron a ser novios',
      summary: 'Este es el ancla grande de la historia. Aunque el chat no lo diga textual en esa línea, la fecha la estás poniendo tú y organiza todo lo que sigue.',
      tag: 'Inicio novios',
      evidence: 'anclado',
    },
    {
      id: 'official-2026-new-language',
      phaseId: 'official',
      day: '2026-02-12',
      title: 'Cambió el lenguaje con el que se hablaban',
      summary: 'Aquí empiezan a aparecer “mi amor”, “cielo” y “mor”. Se siente como el momento en el que la relación ya cambió también en las palabras.',
      tag: 'Cambio de tono',
      evidence: 'confirmado',
    },
    {
      id: 'official-2026-valentine',
      phaseId: 'official',
      day: '2026-02-14',
      title: 'San Valentín cayó en un momento precioso',
      summary: 'El “me encantas bebé” y la forma en que se buscaron ese día hacen que este hito se defienda solo. Es uno de los más claros para mostrar que la historia ya era romántica sin duda.',
      tag: 'San Valentín',
      evidence: 'confirmado',
    },
    {
      id: 'official-2026-first-te-quiero',
      phaseId: 'official',
      day: '2026-02-22',
      title: 'Llegó el primer “te quiero” de los dos',
      summary: 'Ese intercambio mutuo es una parada obligatoria del timeline. Es corto, simple y muy potente para mostrar cómo se fue asentando lo que ya sentían.',
      tag: 'Afecto explícito',
      evidence: 'confirmado',
    },
    {
      id: 'official-2026-building-this',
      phaseId: 'official',
      day: '2026-02-24',
      title: 'Ya hablaban de lo que estaban construyendo',
      summary: 'Aquí ya no solo hay cariño: también aparece esa idea de construir algo juntos. Es un punto muy bueno para mostrar la relación ya consciente y asumida.',
      tag: 'Construcción',
      evidence: 'confirmado',
    },
    {
      id: 'official-2026-first-te-amo',
      phaseId: 'official',
      day: '2026-03-19',
      title: 'Se dijeron “te amo” por primera vez',
      summary: 'Este es uno de los hitos más fuertes de toda la historia. Además está verificado con fecha y hora exactas, así que sirve perfecto como clímax emocional del timeline.',
      tag: 'Primer te amo',
      evidence: 'confirmado',
    },
    {
      id: 'official-2026-intense-domestic-day',
      phaseId: 'official',
      day: '2026-05-17',
      title: 'La historia ya se parecía a una vida compartida',
      summary: 'Uno de los días más intensos del chat. Lo bonito no es solo la cantidad de mensajes, sino el tipo de conversación: cuidado, rutina, ayuda y cariño cotidiano.',
      tag: 'Vida compartida',
      evidence: 'confirmado',
    },
    {
      id: 'official-2026-still-growing',
      phaseId: 'official',
      day: '2026-06-06',
      title: 'Y la historia seguía escribiéndose',
      summary: 'Hasta la fecha más reciente del chat, la sensación es la misma: esto no se cerró en un momento bonito, sino que siguió vivo, presente y en movimiento.',
      tag: 'Hoy',
      evidence: 'inferido',
    },
  ];
}

export function deriveStoryModel(data: ChatExport): StoryModel {
  const meLabel = data.chat.participantLabels?.me || 'Chris';
  const themLabel = data.chat.participantLabels?.them || data.chat.name;
  const meaningfulMessages = data.messages.filter(isMeaningful);
  const activityRows = data.metrics.daily;
  const firstMeaningfulMessage = meaningfulMessages.find(isStoryworthyText) ?? meaningfulMessages[0] ?? data.messages[0] ?? null;
  const lastMeaningfulMessage = [...meaningfulMessages].reverse().find(isStoryworthyText) ?? [...meaningfulMessages].reverse().find(Boolean) ?? data.messages[data.messages.length - 1] ?? null;
  const firstPhotoMessage = meaningfulMessages.find((message) => normalizeMediaKey(message.mediaType) === 'photo' && message.mediaPath) ?? null;
  const firstAudioMessage = meaningfulMessages.find((message) => normalizeMediaKey(message.mediaType) === 'audio') ?? null;

  const dayCounts = new Map<string, number>();
  const monthCounts = new Map<string, number>();
  const yearCounts = new Map<string, number>();
  const wordsBySender = new Map<string, number>();
  const mediaCounts = new Map<string, number>();

  if (meaningfulMessages.length > 0) {
    for (const message of meaningfulMessages) {
      dayCounts.set(message.day, (dayCounts.get(message.day) ?? 0) + 1);
      const month = message.day.slice(0, 7);
      monthCounts.set(month, (monthCounts.get(month) ?? 0) + 1);
      const year = message.day.slice(0, 4);
      yearCounts.set(year, (yearCounts.get(year) ?? 0) + 1);
      wordsBySender.set(message.senderLabel, (wordsBySender.get(message.senderLabel) ?? 0) + approximateWordCount(message));
      if (message.mediaType || message.mediaPath) {
        const key = normalizeMediaKey(message.mediaType);
        mediaCounts.set(key, (mediaCounts.get(key) ?? 0) + 1);
      }
    }
  } else {
    for (const daily of activityRows) {
      dayCounts.set(daily.day, daily.total);
      const month = daily.day.slice(0, 7);
      monthCounts.set(month, (monthCounts.get(month) ?? 0) + daily.total);
      const year = daily.day.slice(0, 4);
      yearCounts.set(year, (yearCounts.get(year) ?? 0) + daily.total);
    }
    wordsBySender.set(meLabel, data.metrics.bySender.me.wordCount ?? 0);
    wordsBySender.set(themLabel, data.metrics.bySender.them.wordCount ?? 0);
    for (const [type, count] of Object.entries(data.metrics.mediaByType)) {
      mediaCounts.set(normalizeMediaKey(type), (mediaCounts.get(normalizeMediaKey(type)) ?? 0) + count);
    }
  }

  const topDayEntry = [...dayCounts.entries()].sort((left, right) => right[1] - left[1])[0] ?? null;
  const topDay = topDayEntry ? { day: topDayEntry[0], count: topDayEntry[1] } : null;

  const firstTs = meaningfulMessages[0]?.ts ?? data.messages[0]?.ts ?? 0;
  const lastTs = meaningfulMessages[meaningfulMessages.length - 1]?.ts ?? data.messages[data.messages.length - 1]?.ts ?? 0;
  const fallbackSpanDays =
    data.chat.dateRange.start && data.chat.dateRange.end
      ? Math.floor((new Date(`${data.chat.dateRange.end}T00:00:00Z`).getTime() - new Date(`${data.chat.dateRange.start}T00:00:00Z`).getTime()) / 86400000) + 1
      : data.metrics.totals.activeDays;
  const totalSpanDays = firstTs && lastTs ? Math.floor((lastTs - firstTs) / 86400) + 1 : fallbackSpanDays;
  const meMessages = data.metrics.bySender.me.messages;
  const themMessages = data.metrics.bySender.them.messages;
  const leadIsMe = meMessages >= themMessages;
  const messageLeadLabel = leadIsMe ? meLabel : themLabel;
  const messageLeadPercent = Math.round((Math.abs(meMessages - themMessages) / Math.max(Math.min(meMessages, themMessages), 1)) * 100);
  const messageLeadSentence =
    meMessages === themMessages
      ? `${meLabel} y ${themLabel} se han escrito exactamente la misma cantidad de mensajes.`
      : `${messageLeadLabel} escribio ${messageLeadPercent}% mas mensajes que ${leadIsMe ? themLabel : meLabel}.`;

  const yearly = [...yearCounts.entries()].sort((left, right) => left[0].localeCompare(right[0]));
  const monthly = [...monthCounts.entries()].sort((left, right) => left[0].localeCompare(right[0]));
  const chapters = yearly.map(([year, count]) => ({
    id: year,
    label: year,
    range: year,
    messages: count,
    summary: summarizeYear(year, count),
  }));

  const photoMessages = meaningfulMessages.filter((message) => normalizeMediaKey(message.mediaType) === 'photo' && message.mediaPath);
  const gallery = evenlySample(photoMessages, 10).map((message, index) => ({
    src: message.mediaPath,
    alt: `Recuerdo ${index + 1}`,
    messageId: message.id,
  }));
  const heroImages = gallery.slice(0, 4);

  const firstTeAmoMessage =
    data.metrics.firstTeAmo ? data.messages.find((message) => message.id === data.metrics.firstTeAmo?.messageId) ?? null : null;

  const moments = [
    makeMoment('Primer mensaje guardado', 'La primera huella de esta conversacion que sigue viva aqui.', firstMeaningfulMessage),
    makeMoment('Primer te amo', 'La primera vez que quedo escrito.', firstTeAmoMessage),
    makeMoment('Primera foto guardada', 'Uno de los primeros recuerdos visuales.', firstPhotoMessage),
    makeMoment('Primera nota de voz', 'Una voz tambien cuenta la historia.', firstAudioMessage),
    makeMoment('Mensaje mas reciente', 'La historia sigue viva.', lastMeaningfulMessage),
  ].filter((moment): moment is StoryMoment => Boolean(moment));

  if (moments.length === 0 && data.metrics.firstTeAmo) {
    moments.push({
      label: 'Primer te amo',
      detail: 'La primera vez que quedo escrito.',
      ts: data.metrics.firstTeAmo.ts,
      text: 'La primera vez que eso quedo por escrito.',
      senderLabel: data.metrics.firstTeAmo.senderLabel,
    });
  }

  const mediaCards: StoryMediaCard[] = [
    { label: 'Fotos', count: mediaCounts.get('photo') ?? 0, tone: 'rose' },
    { label: 'Audios', count: mediaCounts.get('audio') ?? 0, tone: 'teal' },
    { label: 'Videos y gifs', count: (mediaCounts.get('video') ?? 0) + (mediaCounts.get('gif') ?? 0), tone: 'gold' },
    { label: 'Stickers', count: mediaCounts.get('sticker') ?? 0, tone: 'plum' },
  ];

  return {
    meLabel,
    themLabel,
    poeticTitle: 'Nuestra historia, la que se escribe día a día',
    subtitle: `${data.chat.dateRange.start} - ${data.chat.dateRange.end}`,
    totalSpanDays,
    activeDays: data.metrics.totals.activeDays,
    messageLeadLabel,
    messageLeadPercent,
    messageLeadSentence,
    wordsBySender: [...wordsBySender.entries()]
      .sort((left, right) => right[1] - left[1])
      .map(([label, value]) => ({ label, value })),
    yearlyCounts: yearly.map(([year, count]) => ({ year, count })),
    monthlyCounts: monthly.map(([month, count]) => ({ month, count })),
    chapters,
    gallery,
    heroImages,
    moments,
    topDay,
    mediaCards,
    firstMeaningful: moments[0] ?? null,
    timelineMilestones: buildTimelineMilestones(meLabel, themLabel),
  };
}
