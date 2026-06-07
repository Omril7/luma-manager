## [2026-06-07] Decision: Webhook requires user_id in payload
Context: POST /api/webhooks/store is called by an external store with no session. The spec doesn't define how to resolve which user the order belongs to.
Decision: Require a user_id UUID field in the webhook payload alongside the shared secret.
Reason: Simplest correct solution for a personal tool. A future multi-tenant version would use per-user webhook URLs or API keys instead.

## [2026-06-07] Decision: Radix UI instead of @base-ui/react for shadcn components
Context: shadcn@latest (v4.10) generates components that use @base-ui/react primitives and Tailwind v4 CSS classes (e.g. ring-3, oklch colors). Next.js 14 ships with Tailwind CSS v3.
Decision: Manually wrote all shadcn UI components using @radix-ui/* primitives with Tailwind v3-compatible class names.
Reason: Avoids a major Tailwind v3→v4 upgrade which would require replacing postcss config, tailwind config, and globals.css, and is untested with Next.js 14.
