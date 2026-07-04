'use client';

import { useState, useCallback } from 'react';
import type { ConversionSettings, ConversionResult, ProcessingProgress } from '@/types/telegram';
import { convertTelegramExport } from '@/lib/converter';
import { downloadBlob } from '@/lib/zip-creator';
import { sanitizeChatName } from '@/lib/telegram-parser';
import { FileDropzone } from '@/components/FileDropzone';
import { SettingsPanel } from '@/components/SettingsPanel';
import { ProgressBar } from '@/components/ProgressBar';
import { ResultCard } from '@/components/ResultCard';
import { ErrorMessage } from '@/components/ErrorMessage';

type AppState = 'idle' | 'processing' | 'done' | 'error';

const DEFAULT_SETTINGS: ConversionSettings = {
  wordLimit: 50000,
  includeTimestamp: true,
  includeAuthor: true,
  dateFormat: 'DD.MM.YYYY',
  includeReactions: true,
  includePolls: true,
  includeForwarded: true,
};

export default function Home() {
  const [state, setState] = useState<AppState>('idle');
  const [file, setFile] = useState<File | null>(null);
  const [settings, setSettings] = useState<ConversionSettings>(DEFAULT_SETTINGS);
  const [progress, setProgress] = useState<ProcessingProgress | null>(null);
  const [result, setResult] = useState<ConversionResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = useCallback((selectedFile: File) => {
    setFile(selectedFile);
    setError(null);
  }, []);

  const handleConvert = useCallback(async () => {
    if (!file) return;

    setState('processing');
    setError(null);

    try {
      const fileContent = await file.text();
      const conversionResult = await convertTelegramExport(
        fileContent,
        settings,
        setProgress
      );

      setResult(conversionResult);
      setState('done');

      const filename = `${sanitizeChatName(conversionResult.chatName)}.zip`;
      downloadBlob(conversionResult.zipBlob, filename);
    } catch (err) {
      setState('error');
      setError(err instanceof Error ? err.message : 'Произошла неизвестная ошибка');
    }
  }, [file, settings]);

  const handleReset = useCallback(() => {
    setState('idle');
    setFile(null);
    setProgress(null);
    setResult(null);
    setError(null);
  }, []);

  return (
    <>
      <div className="grid-bg" />
      <div className="glow-orb" style={{ top: '-200px', left: '-200px' }} />
      <div className="glow-orb" style={{ bottom: '-300px', right: '-200px', opacity: 0.2 }} />

      <main className="relative z-10 min-h-screen py-12 px-4 flex flex-col items-center justify-center">
        <div className="w-full max-w-lg space-y-8">
          <header className="text-center space-y-4 opacity-0 animate-fade-in-up">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[var(--border)] bg-[var(--card)]">
              <span className="w-2 h-2 rounded-full bg-[var(--accent)] animate-pulse-slow" />
              <span className="text-sm text-[var(--muted)]">Client-side processing</span>
            </div>

            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
              <span className="text-[var(--foreground)]">Telegram</span>
              <span className="text-[var(--accent)]"> → </span>
              <span className="text-[var(--foreground)]">NotebookLM</span>
            </h1>

            <p className="text-[var(--muted)] text-lg max-w-md mx-auto">
              Конвертируйте экспорт чата в <span className="code-tag">.md</span> файлы для Google NotebookLM
            </p>
          </header>

          <div className={`glass-card p-6 sm:p-8 space-y-6 opacity-0 animate-fade-in-up stagger-2 ${state === 'done' ? 'success-glow' : ''}`}>
            {state === 'done' && result ? (
              <ResultCard result={result} onReset={handleReset} />
            ) : (
              <>
                <FileDropzone onFileSelect={handleFileSelect} disabled={state === 'processing'} />

                {error && <ErrorMessage message={error} onDismiss={() => setError(null)} />}

                <SettingsPanel settings={settings} onChange={setSettings} disabled={state === 'processing'} />

                {state === 'processing' && progress && <ProgressBar progress={progress} />}

                <button
                  onClick={handleConvert}
                  disabled={!file || state === 'processing'}
                  className="w-full btn-accent py-4 text-lg flex items-center justify-center gap-3"
                >
                  {state === 'processing' ? (
                    <>
                      <span className="animate-spin">⚡</span>
                      <span>Конвертация...</span>
                    </>
                  ) : (
                    <>
                      <span>⚡</span>
                      <span>Конвертировать</span>
                    </>
                  )}
                </button>
              </>
            )}
          </div>

          <footer className="text-center opacity-0 animate-fade-in-up stagger-3 space-y-2">
            <p className="text-sm text-[var(--muted)]">🔒 Все данные обрабатываются локально в браузере</p>
            <a
              href="https://t.me/vanuwka"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-[var(--muted)] hover:text-[var(--accent)] transition-colors"
            >
              <span>✈️</span>
              <span>@vanuwka</span>
            </a>
          </footer>
        </div>
      </main>
    </>
  );
}
