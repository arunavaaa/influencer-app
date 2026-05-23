# Project: GrabCollab
A creator hiring portal connecting Indian Instagram creators with brands.
Phase 1 MVP — no payments, no escrow, no contracts.

## Two user types
- Creators — list their profile, browse campaigns, apply, chat with brands
- Brands — post campaigns, search creators, shortlist, chat with creators

## Stack
- Next.js 14 App Router + TypeScript
- Supabase (Postgres + Auth + Realtime)
- shadcn/ui + Tailwind CSS
- Resend for email notifications
- PostHog for analytics

## Design System
Use the exact same design system, component styles, and UI patterns 
already used in this codebase. Do not introduce new styles. 
Be consistent with what's already built.
- All amounts in ₹ with Indian number formatting

## URL Structure
Public:
- / → Landing page
- /for-creators → Creator landing page
- /login → Login
- /signup → Signup
- /[username] → Creator public profile
- /brands/[id] → Brand public profile

Brand app:
- /brand/dashboard
- /brand/campaigns
- /brand/campaigns/new
- /brand/campaigns/[id]
- /brand/search
- /brand/messages
- /brand/messages/[id]
- /brand/profile

Creator app:
- /dashboard
- /campaigns
- /applications
- /projects
- /messages
- /messages/[id]
- /profile/edit
- /settings

Onboarding:
- /onboarding/brand
- /onboarding/creator

## Critical rules
- No payment UI anywhere
- No escrow references
- No contract generation
- Creators self-report follower counts in Phase 1 (no Instagram API)
- Chat unlocks for brands after shortlisting OR direct search message request
- Creator must accept/decline brand message requests from search
- All amounts in ₹
- Use sonner for toasts
- Always show loading and empty states

## Database tables in use (Phase 1)
users, creator_profiles, brand_profiles, content_packages,
campaigns, applications, conversations, messages, notifications

## Tables NOT used in Phase 1
contracts, content_submissions, transactions, bypass_reports,
audit_logs, social_accounts

## Code rules
- Use server components by default, add "use client" only when needed
- All forms use react-hook-form + zod validation
- All Supabase calls in server components use the server client
- All Supabase calls in client components use the browser client
- Use sonner for toast notifications
- Always handle loading and error states in UI
- Read CREATOR_PERSONAS.md before every UI decision
- Ask: "Would Sneha (nano creator, first deal) understand this?"
- Ask: "Would Meera (parent creator, not technical) complete this?"
- Every page must work on mobile (375px) and desktop (1440px)
- Use Inter font throughout
- Never hardcode data — always fetch from Supabase
- Commit after each major page: git add . && git commit -m "feat: [page]" && git push
