# Run from the root of your tg-history-convert repository.
$ErrorActionPreference = "Stop"

Write-Host "Applying GitHub Pages patch..."

New-Item -ItemType Directory -Force -Path ".github\workflows" | Out-Null
Copy-Item -Force "next.config.ts" ".\next.config.ts"
Copy-Item -Force ".github\workflows\pages.yml" ".\.github\workflows\pages.yml"
Copy-Item -Force "public\.nojekyll" ".\public\.nojekyll"
Copy-Item -Force "README_GITHUB_PAGES.md" ".\README_GITHUB_PAGES.md"

Write-Host "Done. Run: npm ci; npm run build"
