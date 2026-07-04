# GitHub Pages patch for tg-history-convert

Этот архив не переписывает проект. Он добавляет минимальные настройки, чтобы текущий Next.js-клиент собирался как статический сайт для GitHub Pages.

## Что меняется

- `next.config.ts` включает `output: "export"`.
- Включен `trailingSlash`, чтобы GitHub Pages нормально открывал маршруты.
- Отключена оптимизация `next/image`, если она появится позже.
- Добавлен GitHub Actions workflow `.github/workflows/pages.yml`.
- Добавлен `.nojekyll`, чтобы GitHub Pages не ломал папки Next.js вида `_next`.

## Как применить

Скопируй содержимое архива в корень репозитория `tg-history-convert` с заменой файлов.

Потом:

```bash
npm ci
npm run build
```

Если локальная сборка проходит, пушь в `main`.

## Настройка GitHub Pages

В репозитории открой:

`Settings → Pages → Build and deployment → Source → GitHub Actions`

После пуша workflow соберет папку `out` и опубликует сайт.

## Адрес

Обычно будет:

```text
https://<username>.github.io/tg-history-convert/
```

Workflow автоматически ставит basePath в `/<repo-name>`.

## Если используешь кастомный домен

В `.github/workflows/pages.yml` поменяй:

```yaml
NEXT_PUBLIC_BASE_PATH: "/${{ github.event.repository.name }}"
```

на:

```yaml
NEXT_PUBLIC_BASE_PATH: ""
```

и в `next.config.ts` можно оставить как есть.

## Важное ограничение

Это всё ещё frontend-only обработка. Файл `result.json` читается в браузере, сервер не нужен и не используется.
