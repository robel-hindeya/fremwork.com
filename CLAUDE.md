# Fremwork: notes for Claude Code

Monorepo (pnpm workspaces): `apps/web` (Next.js 15 App Router), `apps/api` (NestJS 11), `supabase/` (migrations, seed, email templates). README.md has setup.

## Commands
- `pnpm dev` runs web (:3000) and API (:4000). Needs `supabase start` and the env files.
- `pnpm typecheck` · `pnpm build`
- `supabase db reset` re-applies migrations + seed. New schema changes go in a new file under `supabase/migrations/`; never edit an applied migration.

## Architecture rules
- The browser uses Supabase **only for auth** (`lib/supabase/*`). All data reads and writes go through the NestJS API (`lib/api.ts`, which sends the access token as a Bearer token).
- The API uses the service-role key, so it bypasses RLS. Every admin route must use `@AdminOnly()`; public routes validate with class-validator DTOs.
- Roles live in `public.profiles.role` (`owner | admin | member`). Triggers in the init migration create profiles and flip waitlist entries to `active` when the email is confirmed.

## Frontend conventions
- Screens in `components/screens/*Screen.tsx` were ported 1:1 from the Fremwork design canvas (`.dc.html` artboards). The markup keeps the design's inline styles on purpose, for pixel fidelity. Each screen's CSS lives in `styles/<screen>.css`, scoped under a wrapper class (`.pg-home`, `.pg-login` …).
- Each screen computes a `v` object (the design's "renderVals") and the JSX reads from it. Change behaviour in the logic above `return`, and visuals in the JSX.
- Fram, the character: `components/fram/FramSvg.tsx` (geometry) and `useFram.ts` (blink, wave, eyes follow the pointer). Do not redraw him.
- Brand tokens are in `app/globals.css` (Fremwork design system): Void #0A0A0A, Paper #FAFAF8, Core Volt #C6F432 (accent, never on white text), Signal Blue #3D5AFE (links and focus), Geist / Geist Mono.
- Copy uses plain language and no exclamation marks except where the design has them. `[BRACKETED]` text is a placeholder still to fill in.
