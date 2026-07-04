# Telegram Export Studio

Frontend-only конвертер Telegram JSON Export в Markdown.

- Работает без backend.
- Подходит для GitHub Pages.
- Файл `result.json` читается локально в браузере.
- Результат скачивается как `.md` или `.zip`.

## Локальный запуск

```bash
npm install
npm run dev
```

## Сборка

```bash
npm run build
```

## Деплой на GitHub Pages

1. Создай репозиторий и залей файлы в ветку `main`.
2. В GitHub: `Settings → Pages → Build and deployment → GitHub Actions`.
3. Workflow `.github/workflows/pages.yml` сам соберёт `dist` и опубликует сайт.

## Ограничения v0.1

- Без Web Worker.
- Без streaming parser.
- Лучше начинать с файлов до 100–200 МБ.
- HTML Export пока не поддерживается, только JSON.

## Что дальше

- Large Export Mode через Web Worker.
- Потоковый парсер для 500+ МБ.
- Экспорт структуры Obsidian vault.
- Поддержка папки с медиа через File System Access API.
