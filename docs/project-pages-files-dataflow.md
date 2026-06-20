# FriendlyDrop Project Pages, File Handling, and Data Flow

## 1. Project Summary

FriendlyDrop is a Next.js App Router commerce platform with:

- storefront pages in `app/`
- server route handlers in `app/api/`
- reusable UI in `components/`
- domain and persistence logic in `lib/`
- shared types in `types/index.ts`
- client-side cart/wishlist/recent-state in `store/`
- Firebase for auth + Firestore persistence
- Supabase Storage for uploaded media files
- Razorpay, Stripe, and offline UPI payment flows

At a high level:

1. the browser renders pages from `app/`
2. client components call `app/api/*` when mutation or session-aware reads are needed
3. server pages and route handlers call functions in `lib/firebase/firestore.ts`
4. `lib/firebase/firestore.ts` reads and writes Firestore collections
5. file uploads go through `app/api/uploads/route.ts` into Supabase Storage

## 2. Folder Guide

### `app/`

Contains all routes:

- page routes such as `/`, `/products`, `/checkout`
- layouts such as root, admin, and vendor layouts
- route handlers under `app/api/*`
- loading, error, and not-found boundaries

### `components/`

UI and feature-level building blocks:

- `components/home/*` for homepage sections
- `components/product/*` for listing, gallery, reviews, and add-to-cart
- `components/admin/*` for dashboard tools
- `components/support/customer-support-widget.tsx` for customer chat
- `components/providers/*` for auth/store synchronization wiring

### `lib/`

Business logic and integrations:

- `lib/firebase/client.ts` initializes Firebase client SDK
- `lib/firebase/admin.ts` initializes Firebase Admin SDK
- `lib/firebase/firestore.ts` contains most domain read/write functions
- `lib/auth/session.ts` protects server pages
- `lib/auth/api.ts` protects API routes
- `lib/media.ts` normalizes media paths and builds Supabase URLs
- `lib/settings-engine.ts` evaluates checkout, delivery, and payment availability
- `lib/validators.ts` validates incoming API payloads with Zod

### `store/`

Client persistence via Zustand:

- `use-cart-store.ts`
- `use-wishlist-store.ts`
- `use-recently-viewed-store.ts`

### `docs/`

Project documentation, including:

- `docs/enterprise-admin-architecture.md`
- `docs/supabase-media-structure.md`

## 3. Page Inventory

## Root App Shell

- `/` -> `app/page.tsx`
- global layout -> `app/layout.tsx`
- global loading -> `app/loading.tsx`
- global error -> `app/error.tsx`
- not found -> `app/not-found.tsx`

The root layout loads store settings, renders navbar/footer/mobile nav, mounts app providers, and injects Razorpay checkout script.

## Public Storefront Pages

- `/products` -> product listing and filters
- `/products/[productId]` -> product detail page with gallery, reviews, recommendations, and builder-driven sections
- `/products/demo-structure` -> product structure demo page
- `/search` -> search UI
- `/about-brand`
- `/contact`
- `/privacy-policy`
- `/terms-and-conditions`
- `/pages/[slug]` -> CMS-driven dynamic page
- `/ai-recommendation`

## Auth and Account Pages

- `/login`
- `/signup`
- `/forgot-password`
- `/reset-password`
- `/account`

## Customer Protected Pages

- `/cart`
- `/checkout`
- `/checkout/stripe-success`
- `/wishlist`
- `/orders`
- `/orders/[orderId]`

These are protected by `middleware.ts` and also server-checked again through `requireUser()`.

## Vendor Pages

- `/vendor`
- `/vendor/dashboard`
- vendor layout -> `app/vendor/layout.tsx`

Vendor pages require `requireVendorOrAdmin()`.

## Admin Pages

Admin routes share `app/admin/layout.tsx` and require `requireAdmin()`.

Main admin pages:

- `/admin` -> redirects to `/admin/control-tower`
- `/admin/dashboard`
- `/admin/control-tower`
- `/admin/analytics`
- `/admin/orders`
- `/admin/products`
- `/admin/categories`
- `/admin/vendors`
- `/admin/users`
- `/admin/customers`
- `/admin/reviews`
- `/admin/coupons`
- `/admin/inventory`
- `/admin/payments`
- `/admin/returns`
- `/admin/support`
- `/admin/shipping`
- `/admin/finance`
- `/admin/reports`
- `/admin/logs`
- `/admin/settings`
- `/admin/plugins`
- `/admin/integrations`
- `/admin/automation`
- `/admin/cms`
- `/admin/mobile`
- `/admin/seo`
- `/admin/sharing`
- `/admin/ads`
- `/admin/marketing`
- `/admin/media`
- `/admin/uploads`
- `/admin/monitoring`
- `/admin/search`
- `/admin/banners`
- `/admin/builder`
- `/admin/product-page-builder`
- `/admin/team`

## Admin Security Page

- `/admin-2fa`

## 4. API Inventory

## Auth and Session APIs

- `POST/DELETE /api/auth/session`
- `GET /api/me`

Purpose:

- converts Firebase client auth into a server session cookie
- resolves role from email/env rules
- keeps server routes and middleware aware of the signed-in user

## Storefront APIs

- `GET/PUT /api/cart`
- `GET/PUT /api/wishlist`
- `GET /api/products`
- `GET /api/products/[productId]`
- `GET/POST /api/products/[productId]/reviews`
- `POST /api/coupons/validate`
- `GET /api/orders`
- `GET /api/orders/[orderId]`
- `GET /api/vendor/dashboard/summary`
- `POST /api/send-email`

## Checkout and Payment APIs

- `GET /api/checkout/config`
- `POST /api/create-order`
- `POST /api/verify-payment`
- `GET /api/orders/stripe/confirm`
- `POST /api/payments/upi`

Purpose:

- calculate delivery and payment availability
- create Razorpay orders or Stripe checkout sessions
- confirm paid sessions
- create offline UPI proof-based orders

## Upload and Support APIs

- `POST /api/uploads`
- `GET/POST/PATCH/PUT /api/support/chat`

Purpose:

- validate and store media
- attach uploads to support conversations
- create and update support tickets

## Admin APIs

Large grouped admin surface under `app/api/admin/*`:

- settings and controls
- 2FA challenge + verify
- products, bulk product import, and bulk actions
- categories
- banners
- CMS pages
- plugins
- orders, refunds, shipping, invoice, bulk updates
- transactions and UPI proof review
- users and per-user 2FA
- vendors and approval
- support tickets
- returns
- coupons
- finance expenses
- logs and integration logs
- control tower summary and SSE stream
- meta ads config, campaigns, and sync
- SEO config
- social share config, links, and tracking
- mobile controls
- automation center
- global admin search
- product page builder global config, templates, and per-product overrides

## 5. Authentication and Access Flow

## Client Login Flow

Main files:

- `hooks/use-auth.tsx`
- `app/api/auth/session/route.ts`
- `app/api/me/route.ts`

Flow:

1. user signs in with Firebase client auth
2. `AuthProvider` gets an ID token
3. token is sent to `POST /api/auth/session`
4. server verifies token using Firebase Admin
5. server creates `friendlydrop_session` cookie
6. server upserts the user profile in Firestore
7. role is resolved from env-configured email lists/patterns
8. client calls `/api/me` to fetch role-aware user data

## Route Protection

Main files:

- `middleware.ts`
- `lib/auth/session.ts`
- `lib/auth/api.ts`

Behavior:

- middleware redirects unauthenticated users from protected page groups
- server pages use `requireUser()`, `requireAdmin()`, or `requireVendorOrAdmin()`
- API routes use `requireApiUser()`, `requireApiAdmin()`, or `requireApiPermission()`
- admin 2FA is enforced with an extra cookie gate when enabled

## 6. Data Sources and Persistence

## Firestore

Primary application database. Based on README and `lib/firebase/firestore.ts`, key collections include:

- `users`
- `products`
- `orders`
- `transactions`
- `cart`
- `wishlist`
- `uploads`
- `reviews`
- `coupons`
- `supportTickets`
- `returns`
- `campaigns`
- `expenses`
- `settings`
- `vendors`
- `vendorPayouts`
- `banners`
- `categories`
- `systemEvents`
- `activityLogs`
- `auditLogs`
- `admin2faChallenges`
- `adminSessions`
- `plugins`
- `cmsPages`
- `integrationLogs`
- `webhookLogs`
- `metaAds`
- `metaAdsCampaigns`
- `seo`
- `seoInsights`
- `socialShare`
- `socialShareLinks`
- `mobileControls`
- `automationCenter`
- `productPageBuilderGlobal`
- `productPageBuilderTemplates`
- `productPageBuilderOverrides`
- `pendingOrders`

## Supabase

Used in two different ways:

1. media storage through Supabase Storage
2. optional product read fallback in `lib/firebase/firestore.ts`

Media URLs are normalized by `lib/media.ts`.

## Local Browser Storage

Zustand stores are persisted in `localStorage`:

- `friendlydrop_cart`
- `friendlydrop_wishlist`
- `friendlydrop_recent`

## 7. File Handling Flow

## Upload Entry Point

Main file:

- `app/api/uploads/route.ts`

The upload route accepts either:

- JSON with an existing `imageUrl`
- multipart form data with a real file

## Supported Media Rules

Accepted content types:

- images
- videos
- PDFs
- text files

Size limits:

- images up to 8 MB
- videos up to 40 MB
- docs up to 12 MB

## Media Folder Structure

Defined in `lib/media.ts` and documented in `docs/supabase-media-structure.md`:

- `products`
- `banners`
- `logos`
- `categories`
- `brand-assets`
- `custom-uploads`
- `support-chat`
- `cms`

Object path pattern:

- `{folder}/{YYYY}/{MM}/{userId}/{timestamp}-{filename}`

## Upload Processing Steps

1. authenticated user sends file to `/api/uploads`
2. route validates folder, type, and size
3. route builds object path with `buildMediaObjectPath()`
4. file bytes are uploaded to Supabase Storage bucket
5. API returns:
   - `path`
   - `imageUrl`
   - `mediaUrl`
   - `contentType`
   - `sizeBytes`
6. if `record=true`, Firestore `uploads` metadata is also saved

## Where Uploads Are Used

### Product personalization and payment proof

- checkout page uploads UPI screenshots through `/api/uploads`
- UPI proof URL is later stored inside the order payment record

### Support chat attachments

- `components/support/customer-support-widget.tsx`
- uploads use folder `support-chat`
- attachment paths are stored in support ticket messages

### Admin-managed content and media

Likely upload targets:

- product images
- banners
- category images
- logos
- CMS assets

## 8. Client State Handling

## Cart

Main files:

- `store/use-cart-store.ts`
- `components/providers/store-sync.tsx`
- `app/api/cart/route.ts`

Flow:

1. cart is stored locally in Zustand + `localStorage`
2. when user is signed in, `StoreSync` loads server cart from `/api/cart`
3. later cart changes are pushed back to `/api/cart` with `PUT`
4. server persists cart in Firestore

## Wishlist

Main files:

- `store/use-wishlist-store.ts`
- `components/providers/store-sync.tsx`
- `app/api/wishlist/route.ts`

Flow mirrors the cart flow:

1. local persisted wishlist
2. initial server sync on login
3. changes saved back to Firestore

## Recently Viewed

Main file:

- `store/use-recently-viewed-store.ts`

This stays client-side only and is not synced to Firestore.

## 9. Product and Catalog Data Flow

## Product Listing

Main files:

- `app/products/page.tsx`
- `lib/firebase/firestore.ts`
- `components/product/shop-browser.tsx`

Flow:

1. page reads search params
2. page calls `getProducts()` with normalized filters
3. Firestore helper filters and sorts products
4. page also loads store settings and optional CMS intro content
5. filtered product list is passed to the shop browser component

## Product Detail

Main files:

- `app/products/[productId]/page.tsx`
- `lib/firebase/firestore.ts`
- `lib/media.ts`

Flow:

1. page loads product by id or slug
2. page loads reviews
3. page loads recommended products
4. page loads product page builder sections for that product
5. media references are converted to display URLs through `resolveMediaUrl()`
6. rendered sections depend on enabled builder config

## CMS Pages

Main files:

- `app/pages/[slug]/page.tsx`
- `components/cms/cms-page-content.tsx`
- Firestore `cmsPages`

Flow:

1. page slug is looked up in Firestore
2. unpublished or missing pages return `notFound()`
3. published page content is rendered through the CMS content component

## 10. Checkout and Order Processing Flow

## Pre-Checkout Configuration

Main files:

- `app/checkout/page.tsx`
- `app/api/checkout/config/route.ts`
- `lib/settings-engine.ts`

Flow:

1. checkout page sends subtotal, pincode, city, and speed
2. API loads store settings and user profile
3. `evaluateCheckoutControls()` calculates:
   - tax rate
   - delivery fee and zone
   - checkout enabled/maintenance state
   - available gateways
4. UI updates payment choices and pricing summary

## Razorpay Flow

Main files:

- `app/api/create-order/route.ts`
- `app/api/verify-payment/route.ts`

Flow:

1. client submits draft order to `/api/create-order`
2. server rebuilds secure order items from product records
3. server recalculates price, discount, tax, and delivery
4. server publishes `checkout_initiated` system event
5. server creates Razorpay order
6. client completes Razorpay checkout popup
7. client sends payment ids + signature to `/api/verify-payment`
8. server verifies HMAC signature
9. server creates Firestore order
10. cart is cleared
11. order email is sent
12. post-payment automation runs

## Stripe Flow

Main files:

- `app/api/create-order/route.ts`
- `app/api/orders/stripe/confirm/route.ts`
- `app/checkout/stripe-success/page.tsx`

Flow:

1. `/api/create-order` creates a `pendingOrders` record
2. server creates Stripe checkout session
3. customer is redirected to Stripe
4. success page calls `/api/orders/stripe/confirm?session_id=...`
5. server verifies Stripe payment status
6. pending order is turned into a real order
7. pending order is marked with `finalizedOrderId`
8. cart is cleared
9. order email and automation run

## Offline UPI Flow

Main files:

- `app/checkout/page.tsx`
- `app/api/payments/upi/route.ts`
- `app/api/uploads/route.ts`

Flow:

1. customer pays externally using QR/UPI link
2. screenshot is uploaded through `/api/uploads`
3. checkout sends proof + transaction id to `/api/payments/upi`
4. server rebuilds secure items and recalculates totals
5. order is created with `payment.provider = upi_offline`
6. payment proof stays pending admin verification
7. system event is published for the pending proof flow

## Order Reads

Main files:

- `app/orders/page.tsx`
- `app/orders/[orderId]/page.tsx`
- `app/api/orders/route.ts`
- `app/api/orders/[orderId]/route.ts`

Behavior:

- users can see only their own orders
- admins can see any order when using the API/page guards

## 11. Support Chat Flow

Main files:

- `components/support/customer-support-widget.tsx`
- `app/api/support/chat/route.ts`
- Firestore `supportTickets`

Flow:

1. widget appears only for signed-in customer users
2. widget polls `/api/support/chat`
3. new ticket creation writes first customer message
4. API also adds an automatic bot reply
5. later messages are appended to the same ticket
6. typing state and agent request state are stored in the ticket
7. attachments are uploaded first, then referenced in ticket messages

## 12. Admin Process Model

The admin area is an operations console layered on top of shared Firestore helpers.

Main patterns:

- UI page under `app/admin/*`
- feature component under `components/admin/*`
- server API under `app/api/admin/*`
- persistence in `lib/firebase/firestore.ts`

Examples:

- product management -> products APIs + Firestore products collection
- upload moderation -> uploads APIs + uploads collection
- support management -> admin support APIs + supportTickets collection
- order status/refund/shipping -> admin orders APIs + orders and transactions collections
- CMS management -> CMS APIs + cmsPages collection
- automation/settings/mobile/SEO/sharing -> dedicated config documents in Firestore

The most important admin real-time process is the control tower:

- summary endpoint -> `/api/admin/control-tower/summary`
- stream endpoint -> `/api/admin/control-tower/stream`

This is the event-driven operations layer described in `docs/enterprise-admin-architecture.md`.

## 13. Validation and Safety Model

Main file:

- `lib/validators.ts`

The codebase validates many incoming payloads with Zod, including:

- orders
- reviews
- coupons
- banners
- categories
- support tickets
- refunds
- vendors
- store settings
- plugins
- mobile controls
- automation config
- CMS pages
- bulk product imports
- SEO and social share config

This means the route handlers generally do not trust client data directly.

## 14. End-to-End Data Handling Summary

## Read Path

Typical read path:

1. page or API request starts
2. auth/session is resolved if needed
3. page or handler calls helper from `lib/firebase/firestore.ts`
4. helper reads Firestore or optional Supabase product source
5. result is normalized and returned to page/component

## Write Path

Typical write path:

1. client action triggers fetch to `app/api/*`
2. request body is validated
3. auth and role checks run
4. server enriches or rebuilds data from trusted product/settings/user records
5. Firestore document is created or updated
6. follow-up processes may run:
   - email
   - automation
   - system events
   - cart clear
   - pending/finalized order linking

## File Path

Typical upload path:

1. client picks file
2. file posts to `/api/uploads`
3. API validates
4. Supabase Storage stores file by object path
5. path or URL is returned
6. Firestore record is optionally created
7. returned media reference is attached to product/order/support/CMS data

## 15. Most Important Files to Read First

If someone new joins the project, start here:

- `app/layout.tsx`
- `middleware.ts`
- `hooks/use-auth.tsx`
- `components/providers/store-sync.tsx`
- `lib/auth/session.ts`
- `lib/auth/api.ts`
- `lib/firebase/client.ts`
- `lib/firebase/admin.ts`
- `lib/firebase/firestore.ts`
- `lib/media.ts`
- `lib/settings-engine.ts`
- `lib/validators.ts`
- `app/checkout/page.tsx`
- `app/api/create-order/route.ts`
- `app/api/verify-payment/route.ts`
- `app/api/payments/upi/route.ts`
- `app/api/uploads/route.ts`
- `app/api/support/chat/route.ts`

## 16. Short Architecture Sentence

FriendlyDrop is a Next.js App Router storefront and admin platform where pages render from `app/`, authenticated mutations go through `app/api/*`, business logic lives in `lib/*`, Firestore is the main source of truth, and uploaded files are validated server-side then stored in Supabase Storage.
