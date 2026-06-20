# Exact Code Changes

This document lists the first concrete code changes to make in the existing repository.

## Critical Changes

## 1. Lock down Firestore security rules

File:

- `firestore.rules`

Change:

- prevent direct client updates to privileged user fields
- restrict `users/{userId}` writes to a safe field allow-list or deny direct writes entirely
- align role semantics with server RBAC

## 2. Add request protection middleware

Files:

- `middleware.ts`
- new `lib/security/*`

Change:

- attach request ids
- enforce security headers
- add coarse IP-based throttling hooks

## 3. Replace direct upload endpoint flow

Files:

- `app/api/uploads/route.ts`
- `lib/media.ts`

Change:

- split into signed upload initiation + completion
- stop buffering all files in route handler
- create asset metadata records
- introduce private/public asset policy

## 4. Make checkout idempotent

Files:

- `app/api/create-order/route.ts`
- `app/api/verify-payment/route.ts`
- `app/api/payments/upi/route.ts`
- `lib/firebase/firestore.ts`

Change:

- add idempotency key support
- persist pending payment attempts
- reject duplicate payment confirmations by provider payment id

## 5. Stop embedding support messages inside ticket docs

Files:

- `lib/firebase/firestore.ts`
- `app/api/support/chat/route.ts`
- `app/api/admin/support/route.ts`
- `app/api/admin/support/[ticketId]/route.ts`

Change:

- move messages into dedicated subcollection/repository
- only ticket summary remains in root ticket doc

## High Priority Changes

## 6. Split Firestore mega-service

File to break apart:

- `lib/firebase/firestore.ts`

Refactor into:

- `repositories/firestore/products-repository.ts`
- `repositories/firestore/orders-repository.ts`
- `repositories/firestore/users-repository.ts`
- `repositories/firestore/support-repository.ts`
- `repositories/firestore/settings-repository.ts`

## 7. Introduce service layer

New consumers of repositories:

- `services/catalog/catalog-service.ts`
- `services/checkout/checkout-service.ts`
- `services/media/media-service.ts`
- `services/vendors/vendor-service.ts`

## 8. Replace Firestore search with search adapter

Files:

- `app/api/products/route.ts`
- `app/search/page.tsx`
- `app/products/page.tsx`
- `components/product/shop-browser.tsx`

Change:

- keep catalog source-of-truth reads separate from search query reads
- shift browse/search filters to search adapter

## 9. Move control tower to read models

Files:

- `lib/control-tower.ts`
- `app/api/admin/control-tower/summary/route.ts`
- `app/api/admin/control-tower/stream/route.ts`

Change:

- read from precomputed metrics collections instead of live full scans

## 10. Add security wrappers to every mutating route

Files:

- all `POST`, `PUT`, `PATCH`, `DELETE` handlers

Change:

- route policy declaration
- rate-limit class
- CSRF/origin validation
- audit emission helper

## Medium Priority Changes

## 11. Expand product model

Files:

- `types/index.ts`
- `lib/validators.ts`
- `components/admin/product-form.tsx`
- `app/api/admin/products/route.ts`
- `app/api/admin/products/[productId]/route.ts`

Change:

- fashion attributes
- size charts
- swatches
- related product sets
- bundle links

## 12. Upgrade media URL handling

Files:

- `lib/media.ts`
- `next.config.mjs`
- image-rendering components

Change:

- explicit derivative profiles
- signed/private delivery support
- cache key strategy

## 13. Add analytics event capture

Files:

- `components/product/track-product-view.tsx`
- checkout and search client components
- new analytics service files

Change:

- search impressions
- product clicks
- add-to-cart
- checkout funnel
- recommendation attribution

## Future Changes

- move catalog and order-heavy domains toward Postgres-backed repositories
- add worker-backed payout, fraud, and loyalty pipelines
