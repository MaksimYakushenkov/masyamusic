# MasyaMusic — персональный музыкальный плеер

## Стек
- **Next.js 14** (App Router, TypeScript, `output: standalone`)
- **Tailwind CSS v4** (PostCSS-плагин `@tailwindcss/postcss`)
- **Drizzle ORM** + **better-sqlite3** (SQLite)
- **NextAuth.js v4** (credentials provider, JWT-сессии)
- **Zustand** (глобальный стор плеера)
- **Cheerio** (парсинг HTML hitmotop)
- **@heroicons/react** (иконки)
- **next/font/google** — шрифт Unbounded (cyrillic + latin)

## Запуск

```bash
# Локально
npm run db:migrate   # создать/обновить БД (нужно при первом запуске)
npm run dev          # http://localhost:3028

# Продакшн (Docker)
NEXTAUTH_SECRET=... docker-compose up -d --build
```

## Переменные окружения

Файл `.env.local` (локально) или переменные Docker:

```
NEXTAUTH_URL=http://localhost:3028
NEXTAUTH_SECRET=your-secret          # обязательно поменять в проде
DATABASE_PATH=./data/masyamusic.db   # путь к SQLite-файлу
UPLOADS_PATH=./uploads               # путь для хранения аудиофайлов
```

## Структура проекта

```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx          — страница входа
│   │   └── register/page.tsx       — регистрация
│   ├── (player)/
│   │   ├── layout.tsx              — защищённый layout: sidebar + player bar + audio engine
│   │   ├── search/page.tsx         — поиск по hitmotop + лайки
│   │   ├── library/page.tsx        — библиотека, загрузка треков, поиск по своей библиотеке
│   │   └── playlists/[id]/page.tsx — страница плейлиста
│   ├── api/
│   │   ├── auth/[...nextauth]/     — NextAuth handler
│   │   ├── auth/register/          — POST регистрация пользователя
│   │   ├── search/                 — GET proxy-скрапер hitmotop
│   │   ├── tracks/                 — GET список треков пользователя, POST загрузка файла
│   │   ├── tracks/like/            — POST лайк (скачивает файл на сервер), DELETE анлайк
│   │   ├── tracks/import/          — POST импорт одного трека по запросу (клиент вызывает в цикле)
│   │   ├── playlists/              — GET список, POST создать
│   │   ├── playlists/[id]/         — GET с треками, PATCH переименовать, DELETE удалить
│   │   ├── playlists/[id]/tracks/  — POST добавить трек, DELETE убрать трек
│   │   └── audio/[userId]/[filename]/ — GET стриминг аудио (range requests)
│   ├── page.tsx                    — редирект на /search
│   ├── layout.tsx                  — root layout с SessionProvider
│   ├── providers.tsx               — клиентский SessionProvider
│   ├── globals.css                 — CSS-переменные, glassmorphism утилиты, range input стили
│   └── globals.css.d.ts           — TypeScript декларация для CSS-импорта (нужна для TS 6)
├── components/
│   ├── player/
│   │   ├── AudioEngine.tsx         — HTML5 Audio, events, seek через window.__audioSeek
│   │   └── PlayerBar.tsx           — нижний бар: трек, прогресс, громкость, shuffle/repeat
│   ├── layout/
│   │   └── Sidebar.tsx             — навигация, список плейлистов, создание плейлиста, logout
│   └── ui/
│       ├── TrackItem.tsx           — строка трека: индекс/play, обложка, название, like, actions
│       ├── AddToPlaylistModal.tsx  — модалка добавления трека в плейлист
│       └── ImportModal.tsx         — модалка импорта из txt/списка (построчный поиск + загрузка)
├── lib/
│   ├── auth.ts                     — NextAuth authOptions
│   ├── scraper.ts                  — searchHitmotop(): fetch + cheerio парсинг (возвращает абсолютные URL)
│   ├── downloadTrack.ts            — downloadAndSaveTrack(): скачивание, именование файла, запись в БД
│   └── db/
│       ├── index.ts                — инициализация better-sqlite3 + drizzle
│       ├── schema.ts               — таблицы: users, tracks, user_tracks, playlists, playlist_tracks
│       └── migrate.ts              — SQL-миграция (идемпотентная, через CREATE TABLE IF NOT EXISTS)
├── middleware.ts                   — auth guard (withAuth) + redirect / → /search
├── store/
│   └── player.ts                   — Zustand store: queue, currentIndex, play/pause/next/prev/shuffle/repeat
└── types/
    └── next-auth.d.ts              — расширение Session (добавлен user.id)
```

## База данных

SQLite-файл по пути `DATABASE_PATH`. Схема:

| Таблица | Описание |
|---|---|
| `users` | id, username, email, password_hash, created_at |
| `tracks` | id, title, artist, cover_url, file_path, source (local/hitmotop), duration, mime_type |
| `user_tracks` | связь user ↔ track, поле `liked` |
| `playlists` | id, user_id, name, cover_url |
| `playlist_tracks` | связь playlist ↔ track, поле `position` |

Файлы треков хранятся в `UPLOADS_PATH/{userId}/{filename}`.

## Дизайн-система

Фирменный стиль, все переменные в `globals.css`:

| Переменная | Значение | Описание |
|---|---|---|
| `--bg` | `#181818` | основной фон |
| `--accent` | `#FF4100` | акцентный цвет (оранжевый) |
| `--accent-glow` | `rgba(255,65,0,0.35)` | glow-тень для свечения |
| `--text` | `#ffffff` | основной текст |
| `--text-muted` | `#888888` | приглушённый текст |
| `--text-subtle` | `#555555` | очень тихий текст |
| `--glass-sidebar` | `rgba(16,16,16,0.92)` | фон сайдбара (стекло) |
| `--glass-player` | `rgba(18,18,18,0.94)` | фон плеер-бара (стекло) |

**Шрифт:** Unbounded (Google Fonts, загружается через `next/font/google`), подключён как CSS-переменная `--font-unbounded`. Везде uppercase + `tracking-widest` для заголовков.

**Стиль:** glassmorphism — `backdrop-filter: blur(24–32px)`, полупрозрачные фоны, тонкие `border: 1px solid rgba(255,255,255,0.07)`. При hover на треки — оранжевый border + `box-shadow: 0 0 20px var(--accent-glow)`. Кнопка Play — оранжевая с glow.

**Утилиты в globals.css:**
- `.glass` — стеклянная панель (blur + border)
- `.glass-card` — карточка с hover-эффектом
- `.btn-accent` — оранжевая кнопка с glow и hover scale
- `.progress-track`, `.volume-track` — кастомные range-инпуты

**TypeScript 6 + CSS:** из-за строгой проверки TS 6 нужен файл `src/app/globals.css.d.ts` + `allowArbitraryExtensions: true` в tsconfig.

## Именование файлов треков

Все треки сохраняются как `{artist} - {title}.mp3` (логика в `src/lib/downloadTrack.ts`):
- Спецсимволы `/ \ : * ? " < > |` заменяются на `_`
- Если файл уже существует — добавляется суффикс `(1)`, `(2)` и т.д.
- Путь в БД хранится как `/api/audio/{userId}/{encodeURIComponent(filename)}`
- При стриминге: `decodeURIComponent(params.filename)` перед `path.basename()`

## Импорт треков из списка

`POST /api/tracks/import` — принимает `{ query: string }`, один трек за раз:
1. Ищет трек на hitmotop через `searchHitmotop(query)`
2. Берёт первый результат
3. Вызывает `downloadAndSaveTrack()` с `liked: true`
4. Возвращает `{ status: 'ok' | 'already_exists' | 'not_found' | 'error', ... }`

Клиент (`ImportModal.tsx`) вызывает API в цикле для каждой строки, показывая прогресс в реальном времени. Поддерживает загрузку `.txt` файла или вставку вручную. Есть кнопка "Остановить".

## Поиск треков (hitmotop)

Поиск через `GET /api/search?q=...` — серверный proxy на `https://rus.hitmotop.com/search?q=`.  
Парсинг HTML через cheerio:
- `.tracks__list .tracks__item.track` — список треков
- `.track__title` — название
- `.track__desc` — исполнитель
- `.track__img` (style `background-image`) — обложка
- `.track__download-btn` (href) — прямая ссылка на MP3

## Лайк трека из поиска

`POST /api/tracks/like` — принимает `{ title, artist, coverUrl, downloadUrl }`, делегирует в `downloadAndSaveTrack()`:
1. Скачивает файл с hitmotop (с Referer заголовком)
2. Сохраняет как `{artist} - {title}.mp3` в `UPLOADS_PATH/{userId}/`
3. Создаёт запись в `tracks`, связывает с пользователем через `user_tracks` с `liked = true`

**Важно:** hitmotop возвращает относительные пути `/get/music/...` — скрапер в `scraper.ts` конвертирует их в абсолютные `https://rus.hitmotop.com/get/music/...`.

## Docker

```bash
docker-compose up -d --build
```

Данные персистентны через Docker volumes:
- `masyamusic_data` → `/app/data` (SQLite)
- `masyamusic_uploads` → `/app/uploads` (аудиофайлы)

При старте контейнера автоматически запускается `db:migrate`.
