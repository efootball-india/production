# eFTBL

A community tournament platform for eFootball 1v1 players.

**Status:** v0.1 — Phase 1 (foundation). Live at the prototype URL; real app being built incrementally.

## What's here

- `prototype/` (in `public/prototype.html`) — the full design prototype, all screens, dark/glassy/phosphor green theme. Accessible at `/prototype.html` once deployed.
- `supabase/migrations/` — Postgres schema for tournaments, players, matches, disputes, news.
- `src/lib/types.ts` — TypeScript domain types mirroring the schema.
- `src/lib/format-engines/` — pluggable tournament format engines. `FormatEngine` interface defined; `single_elimination` and `groups_knockout` to be implemented next.
- `app/` — Next.js 14 App Router pages.

## Tech stack

- **Next.js 14** (App Router, TypeScript) — frontend + server actions
- **Supabase** — Postgres, Auth (Google + email), Realtime, Storage
- **Tailwind + shadcn/ui** — styling and component primitives (added in next phase)
- **Vercel** — hosting + deployment
- Free tier across the board

## Running locally

You don't need to run this locally to deploy. Vercel builds it automatically when you push to GitHub.

If you do want to run locally:

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Roadmap

- **Phase 0 — Schema + types** ✅ (done — see `supabase/migrations/`, `src/lib/types.ts`)
- **Phase 1 — Foundation** ✅ (this commit — Next.js scaffolded, prototype served, Vercel pipeline live)
- **Phase 2 — Auth + onboarding** (Supabase Auth wired up, sign-up + sign-in + email verify + onboarding screens as React components)
- **Phase 3 — FIFA WC format engine** (groups + knockout in code, draw algorithm with confederation constraints, R32 best-third allocation table)
- **Phase 4 — Player surfaces** (home with news, tournament detail, match report, profile, leaderboard)
- **Phase 5 — Admin surfaces** (manage tournament, disputes queue, player management, create-tournament wizard)
- **Phase 6 — Closed beta** (16-player real cup with the community)
- **Phase 7 — Public launch** (full 48-player FIFA WC format)

## License

TBD.
