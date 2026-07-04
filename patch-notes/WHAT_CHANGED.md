# Что оптимизировано под GitHub Pages

1. Next.js теперь собирается в чистый static export через `output: "export"`.
2. GitHub Pages получает готовую папку `out/`, без backend, Node-сервера и Vercel.
3. Добавлен `basePath`, чтобы сайт работал по адресу вида `/tg-history-convert/`.
4. Добавлен `.nojekyll`, чтобы GitHub Pages не игнорировал `_next`.
5. Добавлен официальный workflow на `actions/deploy-pages`.

Это патч поверх текущего проекта, а не переписывание на Vite.
