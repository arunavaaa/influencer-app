## Design & Feature Reference
- Before writing ANY UI code, read WISE_DESIGN_SYSTEM.pdf for the complete design system
- Before building ANY feature, read COLLABSTR_REFERENCE.pdf for feature parity reference
- Design target: Wise.com visual style (dark green #163300, lime green #9FE870, Inter font, 24px card radius)
- Functional target: Collabstr.com features adapted for India (₹ pricing, Razorpay, GST, regional platforms)

# Project: Influencer Marketplace (India)

A two-sided influencer marketing marketplace connecting brands with influencers across India.

## Two user types
- **Influencers** — create profiles, set packages, receive campaign invites, get paid
- **Brands** — discover influencers, post campaigns, manage deals, pay via escrow

## Stack
- Next.js 14 App Router + TypeScript
- Supabase (Postgres + Auth + Realtime + Storage) — Mumbai region
- shadcn/ui + Tailwind CSS
- Razorpay Route for escrow payments
- Resend for transactional email
- PostHog for analytics
- Zod for validation, react-hook-form for forms

## Folder structure
- app/(auth)/ — login, signup, onboarding flows
- app/(influencer)/ — influencer dashboard, profile, applications
- app/(brand)/ — brand dashboard, discover, campaigns
- app/api/ — all API routes
- lib/supabase/ — supabase client helpers
- lib/types/ — TypeScript types matching DB schema
- lib/validations/ — Zod schemas
- components/shared/ — shared components used by both user types
- components/ui/ — shadcn components (do not edit)

## Critical business rules
- NEVER expose handle_encrypted to brand users — RLS enforces this at DB level
- Influencer social handles are masked (@fashion_***) until escrow is funded
- All amounts in INR, stored in paise (multiply by 100 for Razorpay)
- Every message is scanned for phone numbers, emails, @handles, UPI IDs before saving
- Contracts auto-generate when brand accepts an application
- Content auto-approves 72 hours after submission if brand does not respond
- Non-circumvention clause is 12 months from contract signing

## Code rules
- Use server components by default, add "use client" only when needed
- All forms use react-hook-form + zod validation
- All Supabase calls in server components use the server client
- All Supabase calls in client components use the browser client
- Use sonner for toast notifications (not the deprecated toast component)
- Always handle loading and error states in UI