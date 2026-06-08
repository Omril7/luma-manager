## [2026-06-08] Decision: income.delivery_amount replaces payment_on_delivery boolean
Context: The income form had a boolean "תשלום במסירה" checkbox that didn't capture how much of the price is a delivery fee vs. product revenue.
Decision: Replace `payment_on_delivery boolean` with `delivery_amount numeric(12,2) DEFAULT 0`. Zero means no delivery; any positive value is the delivery portion of `final_price`.
Reason: Enables accurate product-revenue reporting (final_price − delivery_amount) and is more useful for invoicing without breaking any existing query logic.

## [2026-06-08] Decision: settings stores accountant_email instead of Gmail SMTP credentials
Context: The settings form was asking users to store their Gmail address and App Password in the database, even though the SMTP credentials already live in env vars (GMAIL_USER, GMAIL_APP_PASSWORD) and are shared across all users.
Decision: Removed `gmail_user` and `gmail_app_password` from the settings table. Added `accountant_email` (the address summary emails are *sent to*, i.e., the accountant's inbox).
Reason: Credentials belong in env vars, not user-editable DB rows. The only per-user setting needed is the recipient address.

## [2026-06-07] Decision: Webhook requires user_id in payload
Context: POST /api/webhooks/store is called by an external store with no session. The spec doesn't define how to resolve which user the order belongs to.
Decision: Require a user_id UUID field in the webhook payload alongside the shared secret.
Reason: Simplest correct solution for a personal tool. A future multi-tenant version would use per-user webhook URLs or API keys instead.

## [2026-06-07] Decision: Radix UI instead of @base-ui/react for shadcn components
Context: shadcn@latest (v4.10) generates components that use @base-ui/react primitives and Tailwind v4 CSS classes (e.g. ring-3, oklch colors). Next.js 14 ships with Tailwind CSS v3.
Decision: Manually wrote all shadcn UI components using @radix-ui/* primitives with Tailwind v3-compatible class names.
Reason: Avoids a major Tailwind v3→v4 upgrade which would require replacing postcss config, tailwind config, and globals.css, and is untested with Next.js 14.
