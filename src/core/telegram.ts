export type TelegramTextPart = string | { type?: string; text?: string };

export interface TelegramMessage {
  id?: number;
  type?: string;
  date?: string;
  date_unixtime?: string;
  from?: string;
  from_id?: string;
  actor?: string;
  text?: string | TelegramTextPart[];
  text_entities?: Array<{ type?: string; text?: string }>;
  reply_to_message_id?: number;
  forwarded_from?: string;
  media_type?: string;
  file?: string;
  photo?: string;
  sticker_emoji?: string;
  poll?: {
    question?: string;
    answers?: Array<{ text?: string; voters?: number }>;
  };
}

export interface TelegramExport {
  name?: string;
  type?: string;
  id?: number;
  messages?: TelegramMessage[];
}

export interface ConvertOptions {
  includeServiceMessages: boolean;
  includeMediaNotes: boolean;
  includeReplies: boolean;
  includeForwarded: boolean;
  splitByMonth: boolean;
  maxWordsPerFile: number;
}

export interface GeneratedFile {
  filename: string;
  content: string;
  words: number;
  messages: number;
}

const DEFAULT_AUTHOR = 'Аноним';

export function normalizeTelegramText(text: TelegramMessage['text'], entities?: TelegramMessage['text_entities']): string {
  if (typeof text === 'string') return text.trim();

  if (Array.isArray(text)) {
    return text
      .map((part) => (typeof part === 'string' ? part : part.text ?? ''))
      .join('')
      .trim();
  }

  if (entities?.length) {
    return entities.map((entity) => entity.text ?? '').join('').trim();
  }

  return '';
}

export function sanitizeFilename(value: string): string {
  return value
    .replace(/[\\/:*?"<>|]/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 80) || 'telegram-export';
}

export function formatDate(raw?: string, unix?: string): string {
  const date = raw ? new Date(raw) : unix ? new Date(Number(unix) * 1000) : null;
  if (!date || Number.isNaN(date.getTime())) return 'без даты';

  return new Intl.DateTimeFormat('ru-RU', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}

function monthKey(raw?: string, unix?: string): string {
  const date = raw ? new Date(raw) : unix ? new Date(Number(unix) * 1000) : null;
  if (!date || Number.isNaN(date.getTime())) return 'unknown-date';
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function wordCount(value: string): number {
  return value.split(/\s+/).filter(Boolean).length;
}

function renderMessage(message: TelegramMessage, options: ConvertOptions): string | null {
  if (message.type !== 'message' && !options.includeServiceMessages) return null;

  const author = message.from || message.actor || DEFAULT_AUTHOR;
  const date = formatDate(message.date, message.date_unixtime);
  const text = normalizeTelegramText(message.text, message.text_entities);
  const lines: string[] = [];

  if (text) lines.push(text);

  if (options.includeMediaNotes) {
    if (message.photo) lines.push(`[Фото: ${message.photo}]`);
    if (message.file) lines.push(`[Файл: ${message.file}]`);
    if (message.media_type && !message.file && !message.photo) lines.push(`[Медиа: ${message.media_type}]`);
    if (message.sticker_emoji) lines.push(`[Стикер: ${message.sticker_emoji}]`);
  }

  if (message.poll?.question) {
    lines.push(`Опрос: ${message.poll.question}`);
    for (const answer of message.poll.answers ?? []) {
      lines.push(`- ${answer.text ?? 'Вариант'}${typeof answer.voters === 'number' ? `, голосов: ${answer.voters}` : ''}`);
    }
  }

  if (!lines.length) return null;

  const meta: string[] = [];
  if (options.includeReplies && message.reply_to_message_id) meta.push(`ответ на #${message.reply_to_message_id}`);
  if (options.includeForwarded && message.forwarded_from) meta.push(`переслано от ${message.forwarded_from}`);
  const metaLine = meta.length ? ` _${meta.join('; ')}_` : '';

  return `**${escapeMarkdown(author)}** · ${date}${metaLine}\n\n${lines.join('\n')}\n`;
}

function escapeMarkdown(value: string): string {
  return value.replace(/([*_`])/g, '\\$1');
}

function buildHeader(data: TelegramExport, title: string, part?: string): string {
  return [
    `# ${title}`,
    part ? `_${part}_` : '',
    '',
    `Источник: Telegram JSON Export`,
    `Сообщений в экспорте: ${data.messages?.length ?? 0}`,
    '',
    '---',
    ''
  ].filter(Boolean).join('\n');
}

export function convertTelegramExport(data: TelegramExport, options: ConvertOptions): GeneratedFile[] {
  if (!Array.isArray(data.messages)) {
    throw new Error('В JSON не найден массив messages. Это точно Telegram export в формате JSON?');
  }

  const title = sanitizeFilename(data.name || 'Telegram export');
  const buckets = new Map<string, TelegramMessage[]>();

  if (options.splitByMonth) {
    for (const message of data.messages) {
      const key = monthKey(message.date, message.date_unixtime);
      buckets.set(key, [...(buckets.get(key) ?? []), message]);
    }
  } else {
    buckets.set('all', data.messages);
  }

  const files: GeneratedFile[] = [];

  for (const [bucketName, messages] of buckets) {
    let partIndex = 1;
    let current = buildHeader(data, data.name || 'Telegram export', options.splitByMonth ? bucketName : undefined);
    let currentWords = wordCount(current);
    let currentMessages = 0;

    const flush = () => {
      if (currentMessages === 0) return;
      const suffix = options.splitByMonth ? `${bucketName}-part-${partIndex}` : `part-${partIndex}`;
      files.push({
        filename: `${title}-${suffix}.md`,
        content: current.trim() + '\n',
        words: currentWords,
        messages: currentMessages
      });
      partIndex += 1;
      current = buildHeader(data, data.name || 'Telegram export', options.splitByMonth ? bucketName : undefined);
      currentWords = wordCount(current);
      currentMessages = 0;
    };

    for (const message of messages) {
      const rendered = renderMessage(message, options);
      if (!rendered) continue;

      const renderedWords = wordCount(rendered);
      if (currentMessages > 0 && currentWords + renderedWords > options.maxWordsPerFile) {
        flush();
      }

      current += rendered + '\n---\n\n';
      currentWords += renderedWords;
      currentMessages += 1;
    }

    flush();
  }

  return files;
}
