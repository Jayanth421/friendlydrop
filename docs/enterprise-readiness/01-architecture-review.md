# Architecture Review Report

## Current Architecture

FriendlyDrop is currently a monolithic Next.js application with:

- App Router pages and route handlers in the same deployment unit
- Firebase Authentication for identity
- Firestore as the primary transactional and configuration store
- Supabase Storage for media storage
- direct integration logic inside route handlers and `lib/*`
- client state in Zustand

The code structure is pragmatic for an early-stage product, but it is not yet shaped for enterprise growth.

## What Works Well

- Clear feature coverage across storefront, admin, vendor, and support
- Strong use of TypeScript and Zod on many API boundaries
- Reasonable separation of UI, route handlers, and domain helpers
- Early RBAC model and audit/event concepts already exist
- Multi-provider payment support is already present

## Architectural Bottlenecks

## 1. Over-centralized domain service

`lib/firebase/firestore.ts` acts as a giant shared service layer for nearly every domain:

- catalog
- orders
- users
- support
- returns
- marketing
- CMS
- settings
- analytics

This creates:

- tight coupling between unrelated domains
- weak testability
- high regression risk
- no clean ownership boundary for teams

## 2. OLTP database used as search, analytics, and event stream

Firestore is currently doing too many jobs:

- serving catalog
- powering search
- computing facets
- computing dashboards
- storing chat messages
- storing admin settings
- storing system events

Large enterprise platforms separate these concerns:

- transactional store
- search index
- event stream / outbox
- analytics store
- media pipeline

## 3. Request-time orchestration instead of asynchronous workflows

Critical flows still execute inside user-facing HTTP requests:

- payment confirmation side effects
- inventory updates
- email sending
- event creation
- media upload validation and storage
- bulk product import follow-up actions

At scale this drives higher latency, retry problems, and partial failure scenarios.

## 4. No service boundaries for scale-critical domains

The following domains need first-class modules:

- media
- catalog
- search
- checkout
- orders
- payments
- customer growth
- vendor operations
- control tower / observability

## 5. Control tower reads from source-of-truth collections

The control tower is valuable, but it currently pulls from live transactional collections. That is not how Amazon-like or Shopify-scale operations centers are built.

The enterprise pattern is:

- primary events emitted from writes
- events copied to stream / outbox
- workers build materialized operational views
- dashboards read fast, pre-aggregated models

## Comparison Against Enterprise Fashion Commerce

## Amazon pattern

Inference:

- highly decoupled domain services
- explicit idempotency and retries
- materialized views for personalization, search, fraud, and fulfillment
- event-driven post-checkout orchestration

Gap:

- FriendlyDrop still couples writes, side effects, and reads inside request handlers.

## H&M / Zara / Myntra pattern

Inference:

- strong variant and attribute modeling
- merchandising-driven search and browse
- fast CDN-backed media transformations
- inventory and promotion logic separated from the rendering tier

Gap:

- FriendlyDrop catalog and search are still general commerce level rather than fashion-commerce level.

## Shopify Plus pattern

Backed by public product documentation:

- accelerated checkout and saved identity through Shop Pay
- configurable checkout logic and payment ordering
- large use of extensibility, rules, and apps
- stronger separation of checkout platform, search, content, and back-office surfaces

Gap:

- FriendlyDrop lacks a dedicated platform layer for checkout, app extensibility, and market-aware configuration.

## Recommended Target Architecture

## Web Tier

- `app/` remains the presentation and API edge layer
- route handlers become thin controllers only
- server actions remain optional, not domain owners

## Domain Layer

Add explicit modules:

- `services/catalog`
- `services/media`
- `services/search`
- `services/checkout`
- `services/orders`
- `services/payments`
- `services/customers`
- `services/vendors`
- `services/admin`

## Data Access Layer

Introduce `repositories/`:

- `repositories/firestore`
- `repositories/postgres`
- `repositories/search`
- `repositories/storage`

## Event Layer

Introduce:

- `events/outbox`
- `events/topics`
- `events/publishers`
- `events/consumers`

## Queue and Worker Layer

Introduce:

- `queues/`
- `workers/`

Required jobs:

- media transform jobs
- malware scan jobs
- search indexing jobs
- email and webhook retry jobs
- payout calculation jobs
- fraud scoring jobs
- abandoned cart jobs
- denormalized analytics rollups

## Monitoring and Analytics

Introduce:

- `monitoring/`
- `analytics/`

These should own:

- request ids
- metrics emission
- traces
- alerts
- operational dashboards

## Strategic Storage Recommendation

For startup cost efficiency:

- keep Firebase Auth
- keep Firestore temporarily for sessions, config, lightweight CRM, audit, and event outbox
- keep Supabase Storage for media
- add enterprise search first
- move scale-critical relational domains toward Supabase Postgres over time

That gives FriendlyDrop a realistic hybrid growth path instead of a high-risk rewrite.
