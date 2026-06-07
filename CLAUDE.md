# Business Financial Manager

## Stack
Next.js 14 (App Router), TypeScript strict, Tailwind CSS, shadcn/ui (RTL),
Supabase (auth + postgres + RLS), Cloudinary, Nodemailer/Gmail, Recharts,
Zustand, React Hook Form + Zod, react-big-calendar

## Dev Commands
- `npm run dev`                        — start dev server
- `npx supabase db push`               — push migrations to Supabase
- `npx supabase gen types typescript --local > src/lib/supabase/types.ts`
- `npm run build`                      — production build check

## Non-Negotiable Rules
- All UI text in Hebrew. dir="rtl" on <html>. No English visible to the user.
- TypeScript strict mode. No `any` anywhere.
- All VAT logic lives exclusively in `src/lib/vat.ts`. Nowhere else.
- Cloudinary uploads are server-side only. Never expose API secret to client.
- Never bypass RLS in client-side code.
- Server Actions are preferred over API routes (except send-summary + webhooks).
- Zod schema required for every form.
- After completing each phase, update docs/ROADMAP.md checkboxes and
  append a summary entry to docs/PROGRESS.md.

## Docs
Full spec:            @docs/SPEC.md
Roadmap & progress:   @docs/ROADMAP.md
Progress log:         @docs/PROGRESS.md
Decisions log:        @docs/DECISIONS.md
