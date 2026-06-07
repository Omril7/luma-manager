## [2026-06-07] Phase 2 — Settings & User
- Settings page with 4 sections: כללי, עובר ושב, מייל, חשבון
- Server Actions for each section with Zod validation
- Zustand settingsStore + useSettings hook
- Fixed Database types to match @supabase/supabase-js v2 format (added Relationships, CompositeTypes, correct empty View/Function/Enum types)
- Deviations: used useFormState (react-dom) instead of useActionState (React 19 only)

## [2026-06-07] Phase 1 — Infrastructure
- Scaffolded Next.js 14 (App Router, TypeScript strict, Tailwind CSS)
- Rewrote all shadcn/ui components from v4 format to Tailwind v3 / Radix UI compatible (shadcn@latest generates v4-style components incompatible with Next.js 14's Tailwind v3)
- Created Supabase browser + server clients with SSR cookie handling
- Wrote full DB migration SQL with RLS policies for all 11 tables
- Created lib/vat.ts, lib/cloudinary.ts, lib/email.ts
- RTL sidebar navigation with auth guard middleware
- Hebrew login and register pages with Zod validation
- Stub pages for all dashboard routes
- Stub API routes for /api/send-summary and /api/webhooks/store
- Build passes cleanly (npm run build)
- Deviations: used Radix UI primitives instead of @base-ui/react due to Tailwind v3 compatibility
- Known: Supabase and Cloudinary env vars are empty stubs — user must fill .env.local
