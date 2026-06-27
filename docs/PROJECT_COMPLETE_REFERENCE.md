# FriendlyDrop — Complete Project Reference

> Generated: June 24, 2026. Single source of truth for the entire codebase.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [Environment Variables](#3-environment-variables)
4. [Folder Structure](#4-folder-structure)
5. [Types & Data Models](#5-types--data-models)
6. [Authentication & Session Flow](#6-authentication--session-flow)
7. [Route Protection & RBAC](#7-route-protection--rbac)
8. [Client State (Zustand Stores)](#8-client-state-zustand-stores)
9. [Firebase — Client & Admin SDK](#9-firebase--client--admin-sdk)
10. [Firestore Collections](#10-firestore-collections)
11. [Store Settings Engine](#11-store-settings-engine)
12. [Page Inventory (Storefront)](#12-page-inventory-storefront)
13. [Page Inventory (Admin)](#13-page-inventory-admin)
14. [API Route Inventory](#14-api-route-inventory)
15. [Checkout & Payment Flows](#15-checkout--payment-flows)
16. [File Upload Flow](#16-file-upload-flow)
17. [Product Catalog Data Flow](#17-product-catalog-data-flow)
18. [Support Chat Flow](#18-support-chat-flow)
19. [Admin Architecture & Control Tower](#19-admin-architecture--control-tower)
20. [Key Library Files](#20-key-library-files)
21. [UI Components](#21-ui-components)
22. [Scripts & Tooling](#22-scripts--tooling)
23. [Security Model](#23-security-model)
24. [Local Development](#24-local-development)
25. [Deployment](#25-deployment)

---

## 1. Project Overview

**FriendlyDrop** is an enterprise-grade, full-stack eCommerce platform specialising in custom photo prints, stickers, and personalised gifts. It is a **Next.js 14 App Router** application written in TypeScript and backed by Firebase.

Key characteristics:

- Server-side rendered pages with async data fetching
- Firebase Auth + Firestore for authentication and data persistence
- Supabase Storage for media uploads
- Razorpay (primary), Cashfree, and Stripe payment gateways
- Offline UPI proof-based order flow
- Admin console covering the full operational lifecycle of an eCommerce business
- RBAC with five admin roles: `super_admin`, `admin`, `manager`, `staff`, `vendor`
- AI-powered product recommendation page and admin Visual Builder

---

## 2. Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript 5.5 |
| Styling | Tailwind CSS 3.4, tw-animate-css, tailwindcss-animate |
| UI Primitives | Radix UI, shadcn-style components |
| Icons | Lucide React |
| Animations | Framer Motion |
| State | Zustand 4 (persist middleware) |
| Forms | React Hook Form + Zod resolvers |
| Validation | Zod 3 |
| Charts | Recharts 3 |
| Tables | TanStack Table 8 |
| Auth | Firebase Auth (email/password + Google) |
| Database | Firebase Firestore (server-side via Admin SDK) |
| Storage | Supabase Storage (media uploads) |
| Payments | Razorpay, Cashfree, Stripe, offline UPI |
| Email | Resend + React Email templates |
| Date handling | date-fns 3 |
| CSV | PapaParse |
| Excel | xlsx |
| PDF | pdfkit |
| Fonts | Manrope, Space Grotesk, Cormorant Garamond (Google Fonts) |
| Node.js runtime | tsx (for scripts) |

---

## 3. Environment Variables

Copy `.env.example` to `.env.local` and fill in the values.

### Application

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_APP_URL` | Full public URL (e.g. `https://friendlydrop.in`) |

### Firebase Client (public, browser-visible)

| Variable |
|---|
| `NEXT_PUBLIC_FIREBASE_API_KEY` |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` |
| `NEXT_PUBLIC_FIREBASE_APP_ID` |

### Firebase Admin (server-only secrets)

| Variable |
|---|
| `FIREBASE_PROJECT_ID` |
| `FIREBASE_CLIENT_EMAIL` |
| `FIREBASE_PRIVATE_KEY` |

### Supabase (storage)

| Variable |
|---|
| `NEXT_PUBLIC_SUPABASE_URL` |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` |

### Payments

| Variable |
|---|
| `RAZORPAY_KEY_ID` |
| `RAZORPAY_KEY_SECRET` |
| `STRIPE_SECRET_KEY` |
| `STRIPE_WEBHOOK_SECRET` |
| `CASHFREE_APP_ID` |
| `CASHFREE_SECRET_KEY` |
| `CASHFREE_WEBHOOK_SECRET` |
| `CASHFREE_ENV` (`production` or sandbox) |

### Email

| Variable |
|---|
| `RESEND_API_KEY` |
| `EMAIL_FROM` |

### Role Assignment (email-based)

| Variable | Purpose |
|---|---|
| `SUPER_ADMIN_EMAILS` | Comma-separated list of super admin emails |
| `ADMIN_EMAILS` | Admin emails |
| `MANAGER_EMAILS` | Manager emails |
| `STAFF_EMAILS` | Staff emails |
| `VENDOR_EMAILS` | Vendor emails |
| `ADMIN_EMAIL_PATTERNS` | Domain/fragment patterns to auto-assign admin role |
| `MANAGER_EMAIL_PATTERNS` | Domain/fragment patterns for manager role |
| `STAFF_EMAIL_PATTERNS` | Domain/fragment patterns for staff role |
| `VENDOR_EMAIL_PATTERNS` | Domain/fragment patterns for vendor role |

### Optional Integrations

| Variable |
|---|
| `SHIPROCKET_API_BASE_URL`, `SHIPROCKET_API_TOKEN` |
| `DELHIVERY_API_BASE_URL`, `DELHIVERY_API_TOKEN` |
| `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_SMS_FROM` |
| `GLOBAL_WEBHOOK_SIGNING_SECRET` |
| `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET` |
| `QIKINK_API_KEY`, `QIKINK_API_SECRET`, `QIKINK_STORE_ID`, etc. |
| `OQENS_API_KEY`, `OQENS_API_BASE_URL`, `OQENS_PUBLIC_CDN_BASE_URL` |

---

## 4. Folder Structure

```
friendlydrop.in/
├── app/                          # All Next.js routes
│   ├── layout.tsx                # Root layout (navbar, footer, providers)
│   ├── page.tsx                  # Homepage
│   ├── globals.css               # Global styles
│   ├── error.tsx / loading.tsx / not-found.tsx
│   ├── (public-admin)/           # Admin access-denied public page
│   ├── about-brand/              # Brand story page
│   ├── account/                  # Customer account panel
│   ├── admin/                    # All admin pages (see §13)
│   ├── admin-2fa/                # Admin two-factor verification
│   ├── ai-recommendation/        # AI product recommendation experience
│   ├── api/                      # All API route handlers (see §14)
│   ├── auth/callback/            # Firebase auth callback
│   ├── cart/                     # Cart page
│   ├── checkout/                 # Checkout + payment success pages
│   ├── contact/                  # Contact page
│   ├── forgot-password/          # Forgot password
│   ├── login/                    # Login page
│   ├── orders/                   # Order history + order detail
│   ├── pages/[slug]/             # CMS-driven dynamic pages
│   ├── privacy-policy/           # Privacy policy
│   ├── products/                 # Product listing + detail
│   ├── reset-password/           # Password reset
│   ├── search/                   # Search page
│   ├── signup/                   # Signup page
│   ├── terms-and-conditions/     # Terms page
│   ├── vendor/                   # Vendor portal + dashboard
│   └── wishlist/                 # Wishlist page
├── components/
│   ├── admin/                    # Admin UI components
│   ├── cart/                     # Cart list component
│   ├── cms/                      # CMS page content renderer
│   ├── home/                     # Homepage sections
│   ├── layout/                   # Navbar, footer, mobile nav, theme toggle
│   ├── product/                  # Product card, gallery, grid, reviews, etc.
│   ├── providers/                # App-wide providers (auth, store sync)
│   ├── shared/                   # Reusable shared UI
│   ├── support/                  # Customer support chat widget
│   ├── ui/                       # Base UI primitives (Button, Input, etc.)
│   └── vendor/                   # Vendor dashboard component
├── docs/                         # Project documentation
├── hooks/
│   ├── use-auth.tsx              # Firebase auth context + helpers
│   ├── use-debounce.ts           # Debounce utility
│   ├── use-mobile.ts             # Mobile breakpoint hook
│   └── use-order-tracking.ts     # Order tracker hook
├── lib/
│   ├── admin/logs.ts             # Admin log writer
│   ├── auth/api.ts               # API route auth guards
│   ├── auth/session.ts           # Server page auth guards
│   ├── firebase/admin.ts         # Firebase Admin SDK init
│   ├── firebase/client.ts        # Firebase Client SDK init
│   ├── firebase/firestore.ts     # All Firestore domain functions
│   ├── integrations/             # Third-party integration helpers
│   ├── payments/                 # Cashfree, Razorpay, Stripe helpers
│   ├── security/                 # Rate limiting, idempotency, request guards
│   ├── storage/oqens.ts          # Oqens CDN helper
│   ├── app-url.ts                # App URL utility
│   ├── automation-engine.ts      # Automation trigger processor
│   ├── cache.ts                  # Next.js unstable_cache wrappers
│   ├── checkout-pricing.ts       # Price calculation helpers
│   ├── constants.ts              # Shared constants
│   ├── control-tower.ts          # Control tower event helpers
│   ├── email.ts                  # Email sending via Resend
│   ├── enterprise.ts             # Enterprise feature utilities
│   ├── media.ts                  # Media URL normalization + Supabase paths
│   ├── mock-data.ts              # Fallback mock data
│   ├── notifications.ts          # Push/SMS notification helpers
│   ├── product-page-builder.ts   # Product page section normalization
│   ├── rbac.ts                   # Role permissions
│   ├── resend.ts                 # Resend client init
│   ├── settings-engine.ts        # Delivery, payment, checkout controls
│   ├── support-bot.ts            # Support bot response logic
│   ├── system-events.ts          # System event publisher
│   ├── utils.ts                  # General utilities
│   └── validators.ts             # Zod request validators
├── public/                       # Static assets
├── qikink-plugin/                # Qikink WordPress plugin (print-on-demand)
├── scripts/
│   ├── seed.ts                   # Database seeding
│   └── db-check.ts               # Database health check
├── store/
│   ├── use-cart-store.ts         # Cart Zustand store
│   ├── use-recently-viewed-store.ts
│   └── use-wishlist-store.ts
├── types/index.ts                # All TypeScript types and interfaces
├── middleware.ts                 # Next.js middleware (auth + security headers)
├── next.config.mjs               # Next.js configuration
├── tailwind.config.ts            # Tailwind configuration
├── tsconfig.json                 # TypeScript configuration
├── firestore.rules               # Firestore security rules
└── storage.rules                 # Firebase Storage security rules
```

---

## 5. Types & Data Models

All types live in `types/index.ts`. Key interfaces:

### Users

| Type / Interface | Purpose |
|---|---|
| `UserRole` | `user \| vendor \| staff \| manager \| admin \| super_admin` |
| `UserStatus` | `active \| suspended \| blocked` |
| `CustomerSegment` | `new \| repeat \| vip` |
| `UserProfile` | Full user document including role, loyalty, wallet, addresses |
| `AdminPermission` | 19 granular permission strings |
| `SessionUser` | Lightweight session object used in server guards |

### Products

| Type / Interface | Purpose |
|---|---|
| `Product` | Full product document with variants, SEO, dimensions, inventory |
| `ProductVariant` | SKU, price, stock, size/color/material |
| `ProductStatus` | `draft \| published \| archived` |
| `ProductVisibility` | `public \| private` |
| `SeoMeta` | Meta title, description, canonical URL, keywords |

### Orders & Payments

| Type / Interface | Purpose |
|---|---|
| `Order` | Full order including items, address, payment, timeline |
| `OrderStatus` | 8 states: `pending` → `confirmed` → `packed` → `shipped` → `delivered` → `returned \| cancelled \| refunded` |
| `CartItem` | Product reference with quantity, price, optional custom image |
| `PaymentRecord` | Provider, IDs, proof URL/status, UPI VPA |
| `PaymentProvider` | `cashfree \| upi_offline \| cod \| razorpay \| stripe` |
| `Transaction` | Payment ledger entry |
| `OrderTimelineEntry` | Status change with timestamp |

### Catalog & CMS

| Type / Interface | Purpose |
|---|---|
| `CatalogCategory` | Nested category with SEO and tags |
| `BannerItem` | Hero/offer/category banners with scheduling |
| `CmsPageConfig` | CMS page with slug, status, content, SEO |
| `Review` | Product review with moderation status |

### Vendor & Finance

| Type / Interface | Purpose |
|---|---|
| `VendorProfile` | Vendor with KYC, commission, status |
| `VendorPayout` | Payout record per period |
| `FinanceExpense` | Expense entry by category |
| `MarketingCampaign` | Campaign with channel, audience, status |

### Admin & System

| Type / Interface | Purpose |
|---|---|
| `StoreSettings` | Entire store config (delivery, payments, integrations, menu) |
| `SystemEvent` | Event record from automation chains |
| `ActivityLog` | Who did what and where |
| `AuditLog` | Before/after record of creates/updates/deletes |
| `SupportTicket` | Chat-based support ticket with messages |
| `ReturnRequest` | Return/refund request lifecycle |
| `PluginApp` | Installed plugin metadata |
| `MobileAppControl` | Mobile app feature flags |
| `AutomationCenterConfig` | AI toggles and IF/THEN automation rules |

### Delivery & Payment Control

| Type / Interface | Purpose |
|---|---|
| `DeliveryControlConfig` | Zones, pricing rules, free delivery rules, SLA |
| `DeliveryZone` | City/pincode prefix zone |
| `DeliveryPricingRule` | Per-rule flat fee + per-km calculation |
| `FreeDeliveryRule` | Conditions for waiving delivery fee |
| `PaymentControlConfig` | Method toggles, COD limits, gateway rules |
| `IntegrationControlConfig` | Provider registry + webhook subscriptions |

---

## 6. Authentication & Session Flow

### Files

- `hooks/use-auth.tsx` — React context provider for Firebase Auth
- `app/api/auth/session/route.ts` — POST (create) / DELETE (destroy) server session cookie
- `app/api/auth/signup/route.ts` — Create new Firebase user and Firestore profile
- `app/api/me/route.ts` — Returns current session user with role
- `lib/firebase/client.ts` — Firebase client SDK initialisation
- `lib/firebase/admin.ts` — Firebase Admin SDK initialisation

### Detailed Login Flow

1. User submits credentials on `/login`
2. Firebase client `signInWithEmailAndPassword` runs
3. `AuthProvider` gets the ID token from the credential
4. Token POSTed to `POST /api/auth/session`
5. Server verifies token with Firebase Admin `verifyIdToken()`
6. Server resolves role from `SUPER_ADMIN_EMAILS`, `ADMIN_EMAILS`, etc.
7. Server creates `friendlydrop_session` HTTP-only session cookie via `createSessionCookie()`
8. Server upserts user profile in Firestore `users` collection
9. Client calls `GET /api/me` to load role-aware user data
10. `AuthProvider` updates React context with `user`, `role`, `loading`

### Signup Flow

1. Client POSTs to `POST /api/auth/signup` with `name`, `email`, `password`, `phone`
2. Server creates Firebase Auth account
3. Server creates Firestore user profile with resolved role
4. Client signs in automatically and follows standard login flow

### Logout

1. Firebase `signOut()` clears client auth
2. `DELETE /api/auth/session` destroys the server cookie
3. Context resets to `user: null, role: "user"`

### Role Resolution

Roles are assigned at session creation time based on environment variable lists:
- Exact email match in `SUPER_ADMIN_EMAILS`, `ADMIN_EMAILS`, etc.
- Partial domain/fragment match via `ADMIN_EMAIL_PATTERNS`, etc.
- Default role is `user`

---

## 7. Route Protection & RBAC

### Middleware (`middleware.ts`)

Runs on every matched request. Redirects unauthenticated users:

- Protected page groups: `/cart`, `/checkout`, `/orders`, `/wishlist`, `/account`, `/vendor`, `/admin`, `/admin-2fa`
- Checks `friendlydrop_session` cookie presence
- Redirects to `/login?redirect=<original_path>` if missing
- Injects HTTP security headers on all responses

### Server Page Guards (`lib/auth/session.ts`)

| Function | Behaviour |
|---|---|
| `getSessionUser()` | Verifies session cookie; returns `SessionUser \| null` |
| `requireUser()` | Calls `getSessionUser()`; redirects to `/login` if null |
| `requireAdmin()` | Calls `requireUser()`; redirects to `/admin/access-denied` if not admin role |
| `requireAdminPermission(permission)` | Verifies specific permission; redirects to `/admin/dashboard` if denied |
| `requireVendorOrAdmin()` | Allows vendor or any admin role; redirects to `/` otherwise |

### API Route Guards (`lib/auth/api.ts`)

| Function | Returns |
|---|---|
| `requireApiUser(req)` | Session user or 401 JSON response |
| `requireApiAdmin(req)` | Admin session user or 401/403 |
| `requireApiPermission(req, permission)` | Verified user with permission or 403 |

### RBAC Permissions (`lib/rbac.ts`)

Roles and their permissions:

| Role | Permissions |
|---|---|
| `user` | None (storefront only) |
| `vendor` | None (vendor portal only) |
| `staff` | dashboard, analytics, products, orders, users, reviews, inventory, support, returns, payments |
| `manager` | staff + catalog, vendors, banners, coupons, marketing, reports |
| `admin` | manager + logs |
| `super_admin` | All 19 permissions |

---

## 8. Client State (Zustand Stores)

All stores use Zustand with `persist` middleware backed by `localStorage`.

### Cart Store (`store/use-cart-store.ts`)

- Key: `friendlydrop_cart`
- State: `items: CartItem[]`
- Actions: `addItem`, `removeItem`, `updateQuantity`, `clearCart`, `setItems`, `subtotal()`
- Max quantity per item: 20
- Synced to Firestore via `StoreSync` component and `GET/PUT /api/cart`

### Wishlist Store (`store/use-wishlist-store.ts`)

- Key: `friendlydrop_wishlist`
- Stores product IDs
- Synced to Firestore via `StoreSync` component and `GET/PUT /api/wishlist`

### Recently Viewed Store (`store/use-recently-viewed-store.ts`)

- Key: `friendlydrop_recent`
- Stores recently viewed product IDs (max 8, defined by `RECENTLY_VIEWED_LIMIT`)
- Client-only, not synced to Firestore

### Server Sync (`components/providers/store-sync.tsx`)

Runs on mount when user is authenticated:

1. Loads server cart from `/api/cart` and merges with local cart
2. Loads server wishlist from `/api/wishlist` and merges with local wishlist
3. Subsequent mutations push updates back to the server

---

## 9. Firebase — Client & Admin SDK

### Client SDK (`lib/firebase/client.ts`)

```typescript
getFirebaseApp()     // initialises or returns existing app
getFirebaseAuth()    // Firebase Auth instance
getFirebaseDb()      // Firestore client instance
getFirebaseStorage() // Firebase Storage instance
isFirebaseClientReady() // checks all NEXT_PUBLIC_FIREBASE_* vars are set
```

Used in browser-side code and `hooks/use-auth.tsx`.

### Admin SDK (`lib/firebase/admin.ts`)

Uses `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`.

```typescript
getAdminDb()    // Firestore Admin instance
getAdminAuth()  // Firebase Admin Auth instance
isFirebaseAdminReady() // checks admin env vars
```

Used exclusively in server-side code (API routes, server components).

### Graceful Degradation

When Firebase is not configured:
- `isFirestoreReady()` returns `false`
- `getProducts()`, `getFeaturedProducts()`, etc. return in-memory `FALLBACK_*` data
- No errors are thrown to the user
- Admin routes that write data call `ensureFirestoreReady()` which throws `FIRESTORE_NOT_CONFIGURED`

---

## 10. Firestore Collections

All domain read/write functions are in `lib/firebase/firestore.ts`.

| Collection | Purpose |
|---|---|
| `users` | User profiles with role, segment, loyalty, wallet |
| `products` | Product catalog with variants, SEO, stock |
| `orders` | Customer orders with timeline and payment |
| `transactions` | Payment ledger entries |
| `cart` | Per-user cart (keyed by `userId`) |
| `wishlist` | Per-user wishlist (keyed by `userId`) |
| `uploads` | Upload metadata records |
| `reviews` | Product reviews with moderation status |
| `coupons` | Discount codes with rules |
| `supportTickets` | Customer support conversations |
| `returns` | Return/refund requests |
| `campaigns` | Marketing campaigns |
| `expenses` | Finance expenses |
| `settings` | Store-wide settings (single doc: `default`) |
| `vendors` | Vendor profiles |
| `vendorPayouts` | Payout records |
| `banners` | Homepage/category banners |
| `categories` | Nested product categories |
| `systemEvents` | Automation/event log |
| `activityLogs` | Admin action log |
| `auditLogs` | Before/after change records |
| `admin2faChallenges` | Pending 2FA codes |
| `adminSessions` | Admin device session records |
| `plugins` | Installed plugin registry |
| `cmsPages` | CMS page content |
| `integrationLogs` | API request/response/error logs |
| `webhookLogs` | Webhook delivery history |
| `metaAds` | Meta Ads config (single doc: `default`) |
| `metaAdsCampaigns` | Individual ad campaign records |
| `seo` | SEO platform config (single doc: `default`) |
| `seoInsights` | Traffic insight data |
| `socialShare` | Social share config (single doc: `default`) |
| `socialShareLinks` | Per-product/per-platform share link stats |
| `mobileControls` | Mobile app feature flags (single doc: `default`) |
| `automationCenter` | Automation config and rules (single doc: `default`) |
| `productPageBuilderGlobal` | Global section config (single doc: `default`) |
| `productPageBuilderTemplates` | Named section templates |
| `productPageBuilderOverrides` | Per-product section overrides |
| `pendingOrders` | Stripe checkout pending orders (pre-confirmation) |

---

## 11. Store Settings Engine

**File:** `lib/settings-engine.ts`

The settings engine evaluates real-time delivery and payment availability for each checkout.

### Delivery Quote

`calculateDeliveryQuote(settings, input)` → `DeliveryQuote`

Input: `subtotal`, `postalCode`, `city`, `speed`, `distanceKm`, `weightKg`, `customerSegment`, `isFirstOrder`, `productIds`, `categoryIds`, `campaignIds`

Logic:
1. Check if delivery is globally enabled
2. Check if postalCode is blocked
3. Check if requested speed (express/same_day) is enabled
4. Find matching zone (by city or pincode prefix, falls back to national)
5. Apply matching pricing rule from sorted priority stack
6. Check if any free delivery rule applies (value threshold, segment, first order, product/category/campaign match)

Output: `{ allowed, fee, zoneId, zoneName, pricingRuleId, freeRuleId, speed, slaHours, message? }`

### Checkout Controls

`evaluateCheckoutControls(settings, input)` → `CheckoutControlSnapshot`

Returns:
- `taxRate` (0 if tax disabled)
- `delivery` — full delivery quote
- `payments.enabled` — whether checkout is open
- `payments.availableGateways` — which gateways are active for this order
- `payments.fallbackGateway` — best available gateway
- `operations` — maintenance mode and checkout toggle state

### Settings Caching

`lib/cache.ts` wraps `getStoreSettingsSafe()` with `unstable_cache` (60-second TTL, `store-settings` tag).

The root layout calls `getCachedStoreSettings()` to avoid re-reading Firestore on every request.

---

## 12. Page Inventory (Storefront)

### Public Pages

| Route | File | Notes |
|---|---|---|
| `/` | `app/page.tsx` | Home — featured products, latest products, CMS intro |
| `/products` | `app/products/page.tsx` | Listing with filters, sort, search |
| `/products/[productId]` | `app/products/[productId]/page.tsx` | Detail — gallery, reviews, builder sections |
| `/search` | `app/search/page.tsx` | Full-text search |
| `/ai-recommendation` | `app/ai-recommendation/page.tsx` | AI curated picks |
| `/about-brand` | `app/about-brand/page.tsx` | Brand story |
| `/contact` | `app/contact/page.tsx` | Contact form |
| `/privacy-policy` | `app/privacy-policy/page.tsx` | Privacy policy |
| `/terms-and-conditions` | `app/terms-and-conditions/page.tsx` | T&C |
| `/pages/[slug]` | `app/pages/[slug]/page.tsx` | CMS-driven content |
| `/products/demo-structure` | `app/products/demo-structure/page.tsx` | Product structure demo |

### Auth Pages

| Route | File |
|---|---|
| `/login` | `app/login/page.tsx` |
| `/signup` | `app/signup/page.tsx` |
| `/forgot-password` | `app/forgot-password/page.tsx` |
| `/reset-password` | `app/reset-password/page.tsx` |
| `/auth/callback` | `app/auth/callback/page.tsx` |

### Protected Customer Pages

| Route | File | Auth |
|---|---|---|
| `/account` | `app/account/page.tsx` | `requireUser()` |
| `/cart` | `app/cart/page.tsx` | `requireUser()` |
| `/checkout` | `app/checkout/page.tsx` | `requireUser()` |
| `/checkout/stripe-success` | `app/checkout/stripe-success/page.tsx` | `requireUser()` |
| `/checkout/cashfree-return` | `app/checkout/cashfree-return/page.tsx` | `requireUser()` |
| `/wishlist` | `app/wishlist/page.tsx` | `requireUser()` |
| `/orders` | `app/orders/page.tsx` | `requireUser()` |
| `/orders/[orderId]` | `app/orders/[orderId]/page.tsx` | `requireUser()` |

### Vendor Pages

| Route | File | Auth |
|---|---|---|
| `/vendor` | `app/vendor/page.tsx` | `requireVendorOrAdmin()` |
| `/vendor/dashboard` | `app/vendor/dashboard/page.tsx` | `requireVendorOrAdmin()` |

---
