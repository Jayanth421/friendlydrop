# FriendlyDrop

Enterprise-grade full-stack eCommerce platform for custom photo prints, stickers, and personalized gifts.

## Tech Stack

- Next.js 14 (App Router) + TypeScript
- Tailwind CSS + shadcn-style UI primitives + Radix UI
- Firebase (Auth, Firestore, Storage)
- Zustand state management
- Recharts analytics visualizations
- Razorpay + Stripe payments
- Resend transactional and admin emails

## Core Features

### New: Luxury Fashion Experience + Visual Builder (May 2026)
- Premium luxury storefront refresh with glassmorphism surfaces, animated hero, and dark/light mode toggle.
- AI Recommendation experience page (`/ai-recommendation`) with curated dynamic product suggestions.
- New admin Visual Builder (`/admin/builder`) with:
  - live preview (`desktop` / `tablet` / `mobile`)
  - drag-and-drop widget insertion
  - template presets, AI-assisted section generation
  - undo/redo history
  - autosave + exportable JSON page state
  - editable block properties and custom code block placeholders

### Storefront
- Email/password + Google auth
- Product catalog, search, filters, reviews, wishlist, cart
- Checkout with Razorpay (primary) + Stripe fallback
- Coupons, order history, real-time tracking
- Custom image uploads for personalized orders

### Enterprise Admin Dashboard
- RBAC roles: `super_admin`, `admin`, `manager`, `staff`, `vendor`
- Permission-based route/API protection
- Optional admin 2FA verification flow
- Session/device tracking for admin logins
- Activity logs + audit logs
- Advanced analytics dashboard (daily/weekly/monthly trends)
- Control Tower (event-driven, real-time operational command center)
- Revenue by category, best sellers, top customers, low stock alerts
- Product management with SEO fields, visibility, status, bulk CSV upload
- Catalog/category management (nested hierarchy + tags + SEO fields)
- Vendor onboarding, approval workflow, commission and payout visibility
- Banner/homepage management with campaign linkage
- Order lifecycle management (pending -> confirmed -> packed -> shipped -> delivered -> returned/refunded)
- Shipping/tracking updates + invoice PDF download
- Customer segmentation, status controls, internal notes, CRM notifications
- Upload moderation (approve/reject/flag)
- Payments/transactions panel
- Coupon engine
- Review moderation
- Inventory panel
- Support tickets, returns workflow, marketing campaigns
- Finance module (expense tracking + profit/loss snapshot)
- Reports export (CSV), global admin search, settings panel

## Environment Variables

Copy `.env.example` to `.env.local` and provide values.

Required groups:

- Firebase client:
  - `NEXT_PUBLIC_FIREBASE_API_KEY`
  - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
  - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
  - `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
  - `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
  - `NEXT_PUBLIC_FIREBASE_APP_ID`
- Firebase admin:
  - `FIREBASE_PROJECT_ID`
  - `FIREBASE_CLIENT_EMAIL`
  - `FIREBASE_PRIVATE_KEY`
- Payments:
  - `RAZORPAY_KEY_ID`
  - `RAZORPAY_KEY_SECRET`
  - `STRIPE_SECRET_KEY`
- Qikink product sync:
  - `QIKINK_PRODUCTS_ENDPOINT` (preferred) or `QIKINK_API_BASE_URL` + `QIKINK_PRODUCTS_PATH`
  - `QIKINK_BEARER_TOKEN` or `QIKINK_API_KEY` (+ optional `QIKINK_API_SECRET`)
  - Optional: `QIKINK_STORE_ID`, `QIKINK_TIMEOUT_MS`, `QIKINK_LIMIT_PARAM`, `QIKINK_PAGE_PARAM`
  - Optional webhook secret: `QIKINK_WEBHOOK_SECRET` (for `/api/integrations/qikink/products`)
- Email:
  - `RESEND_API_KEY`
  - `EMAIL_FROM`
- Role assignment:
  - `SUPER_ADMIN_EMAILS`
  - `ADMIN_EMAILS`
  - `MANAGER_EMAILS`
  - `ADMIN_EMAIL_PATTERNS` (comma-separated fragments or domains like `friendlydrop` or `@friendlydrop.in`)
  - `MANAGER_EMAIL_PATTERNS`
  - `STAFF_EMAILS`
  - `STAFF_EMAIL_PATTERNS` (optional comma-separated fragments/domains for staff access)
  - `VENDOR_EMAILS`
  - `VENDOR_EMAIL_PATTERNS`
- Optional enterprise integrations:
  - `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`
  - `SHIPROCKET_API_BASE_URL`, `SHIPROCKET_API_TOKEN`
  - `DELHIVERY_API_BASE_URL`, `DELHIVERY_API_TOKEN`
  - `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_SMS_FROM`
  - `GLOBAL_WEBHOOK_SIGNING_SECRET`

## Local Development

```bash
npm install
npm run dev
```

Optional seed:

```bash
npm run seed
```

Quality checks:

```bash
npm run lint
npm run typecheck
npm run build
```

## Qikink Product Import

1. Configure Qikink env variables in `.env.local`.
2. Open `Admin -> Products`.
3. Use **Import Products from Qikink**.
4. `upsert` mode updates existing items by SKU and creates missing ones.
5. Optional: configure Qikink to push payloads to `/api/integrations/qikink/products` using `Authorization: Bearer <QIKINK_WEBHOOK_SECRET>`.

## Firestore Collections (high level)

- `users`, `products`, `orders`, `transactions`
- `cart`, `wishlist`, `uploads`, `reviews`, `coupons`
- `supportTickets`, `returns`, `campaigns`, `expenses`, `settings`
- `vendors`, `vendorPayouts`, `banners`, `categories`, `systemEvents`
- `activityLogs`, `auditLogs`, `admin2faChallenges`, `adminSessions`

## Deployment (Vercel)

1. Push repository to GitHub/GitLab.
2. Import project into Vercel.
3. Configure all environment variables from `.env.example`.
4. Set `NEXT_PUBLIC_APP_URL` to production domain.
5. Deploy.

## Security Notes

- Firestore and Storage security rules are included in `firestore.rules` and `storage.rules`.
- API routes validate payloads using Zod.
- Admin APIs enforce permission checks server-side.
- Secrets are environment-only and never hardcoded.

## Enterprise Admin Blueprint

- Architecture and connected automation design: `docs/enterprise-admin-architecture.md`
