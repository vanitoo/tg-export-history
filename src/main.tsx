import React, { useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { convertTelegramExport, sanitizeFilename, type ConvertOptions, type GeneratedFile, type TelegramExport } from './core/telegram';
import { saveMarkdownFile, saveZip } from './core/exportZip';
import './styles.css';

const defaultOptions: ConvertOptions = {
  includeServiceMessages: false,
  includeMediaNotes: true,
  includeReplies: true,
  includeForwarded: true,
  splitByMonth: false,
  maxWordsPerFile: 50000
};

function App() {
  const [fileName, setFileName] = useState<string>('');
  const [jsonData, setJsonData] = useState<TelegramExport | null>(null);
  const [options, setOptions] = useState<ConvertOptions>(defaultOptions);
  const [generated, setGenerated] = useState<GeneratedFile[]>([]);
  const [error, setError] = useState<string>('');
  const [isReading, setIsReading] = useState(false);

  const stats = useMemo(() => {
    const totalWords = generated.reduce((sum, file) => sum + file.words, 0);
    const totalMessages = generated.reduce((sum, file) => sum + file.messages, 0);
    return { totalWords, totalMessages };
  }, [generated]);

  async function handleFile(file: File) {
    setError('');
    setGenerated([]);
    setJsonData(null);
    setFileName(file.name);
    setIsReading(true);

    try {
      if (!file.name.endsWith('.json')) {
        throw new Error('Нужен JSON-файл Telegram, обычно он называется result.json. HTML пока не трогаем, не будем устраивать зоопарк в v0.1.');
      }
      const text = await file.text();
      const parsed = JSON.parse(text) as TelegramExport;
      if (!Array.isArray(parsed.messages)) {
        throw new Error('В файле нет массива messages. Проверь, что экспорт был сделан в Telegram Desktop именно в JSON.');
      }
      setJsonData(parsed);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось прочитать файл.');
    } finally {
      setIsReading(false);
    }
  }

  function convert() {
    if (!jsonData) return;
    setError('');
    try {
      setGenerated(convertTelegramExport(jsonData, options));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Конвертация не удалась.');
    }
  }

  async function downloadAll() {
    if (!generated.length || !jsonData) return;
    const name = sanitizeFilename(jsonData.name || fileName.replace(/\.json$/i, '') || 'telegram-export');
    if (generated.length === 1) {
      await saveMarkdownFile(generated[0]);
    } else {
      await saveZip(generated, name);
    }
  }

  return (
    <main className="shell">
      <section className="hero">
        <div>
          <p className="eyebrow">Frontend only · GitHub Pages ready</p>
          <h1>Telegram Export Studio</h1>
          <p className="lead">Конвертер Telegram JSON Export в Markdown. Всё работает в браузере: без сервера, без загрузки чатов куда-то в чужую мясорубку.</p>
        </div>
        <div className="privacy-card">
          <strong>Локальная обработка</strong>
          <span>Файл читается только браузером. В v0.1 нет backend, API, базы и прочей инфраструктурной драматургии.</span>
        </div>
      </section>

      <section
        className="dropzone"
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          const file = event.dataTransfer.files?.[0];
          if (file) void handleFile(file);
        }}
      >
        <input
          id="file"
          type="file"
          accept="application/json,.json"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void handleFile(file);
          }}
        />
        <label htmlFor="file">Перетащи сюда result.json или выбери файл</label>
        <p>{fileName ? `Выбран файл: ${fileName}` : 'Telegram Desktop → Export chat history → JSON'}</p>
      </section>

      {isReading && <div className="notice">Читаю JSON. Если это гигабайтный монстр, браузер может задуматься о смысле жизни.</div>}
      {error && <div className="error">{error}</div>}

      {jsonData && (
        <section className="panel grid">
          <div>
            <h2>{jsonData.name || 'Telegram export'}</h2>
            <p className="muted">Сообщений в файле: {jsonData.messages?.length ?? 0}</p>
          </div>

          <label>
            Размер части, слов
            <select value={options.maxWordsPerFile} onChange={(e) => setOptions({ ...options, maxWordsPerFile: Number(e.target.value) })}>
              {[25000, 50000, 100000, 200000, 500000].map((value) => <option key={value} value={value}>{value.toLocaleString('ru-RU')}</option>)}
            </select>
          </label>

          <Toggle label="Разбивать по месяцам" checked={options.splitByMonth} onChange={(value) => setOptions({ ...options, splitByMonth: value })} />
          <Toggle label="Добавлять заметки о медиа" checked={options.includeMediaNotes} onChange={(value) => setOptions({ ...options, includeMediaNotes: value })} />
          <Toggle label="Показывать ответы" checked={options.includeReplies} onChange={(value) => setOptions({ ...options, includeReplies: value })} />
          <Toggle label="Показывать пересылки" checked={options.includeForwarded} onChange={(value) => setOptions({ ...options, includeForwarded: value })} />
          <Toggle label="Включать служебные сообщения" checked={options.includeServiceMessages} onChange={(value) => setOptions({ ...options, includeServiceMessages: value })} />

          <button className="primary" onClick={convert}>Конвертировать</button>
        </section>
      )}

      {generated.length > 0 && (
        <section className="panel">
          <div className="result-head">
            <div>
              <h2>Готово</h2>
              <p className="muted">Файлов: {generated.length}. Сообщений: {stats.totalMessages}. Слов примерно: {stats.totalWords.toLocaleString('ru-RU')}.</p>
            </div>
            <button className="primary" onClick={() => void downloadAll()}>{generated.length === 1 ? 'Скачать Markdown' : 'Скачать ZIP'}</button>
          </div>
          <div className="files">
            {generated.map((file) => (
              <div className="file-row" key={file.filename}>
                <span>{file.filename}</span>
                <small>{file.messages} сообщений · {file.words.toLocaleString('ru-RU')} слов</small>
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <label className="toggle">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span>{label}</span>
    </label>
  );
}

createRoot(document.getElementById('root')!).render(<App />);
