# New Files to Create

## Core Platform Structure

```text
config/env.ts
config/feature-flags.ts
config/permissions.ts
config/rate-limits.ts

services/catalog/catalog-service.ts
services/catalog/catalog-assembler.ts
services/media/media-service.ts
services/media/media-policy.ts
services/search/search-service.ts
services/search/search-adapter.ts
services/checkout/checkout-service.ts
services/checkout/idempotency-service.ts
services/orders/order-service.ts
services/payments/payment-orchestrator.ts
services/customers/customer-profile-service.ts
services/vendors/vendor-onboarding-service.ts
services/vendors/vendor-payout-service.ts
services/admin/control-tower-service.ts

repositories/firestore/users-repository.ts
repositories/firestore/settings-repository.ts
repositories/firestore/audit-repository.ts
repositories/firestore/outbox-repository.ts
repositories/firestore/support-tickets-repository.ts
repositories/firestore/support-messages-repository.ts
repositories/postgres/products-repository.ts
repositories/postgres/variants-repository.ts
repositories/postgres/orders-repository.ts
repositories/postgres/payments-repository.ts
repositories/postgres/media-assets-repository.ts
repositories/postgres/vendors-repository.ts
repositories/search/product-search-repository.ts
repositories/storage/supabase-storage-repository.ts
repositories/cache/cache-repository.ts

events/contracts.ts
events/outbox/publish.ts
events/outbox/consume.ts
events/topics/catalog-events.ts
events/topics/order-events.ts
events/topics/payment-events.ts
events/topics/media-events.ts

queues/queue-client.ts
queues/job-types.ts
queues/media-jobs.ts
queues/search-jobs.ts
queues/notification-jobs.ts
queues/fraud-jobs.ts
queues/payout-jobs.ts
queues/analytics-jobs.ts

workers/media-worker.ts
workers/search-index-worker.ts
workers/notification-worker.ts
workers/fraud-worker.ts
workers/payout-worker.ts
workers/analytics-rollup-worker.ts

monitoring/logger.ts
monitoring/request-context.ts
monitoring/metrics.ts
monitoring/tracing.ts
monitoring/alerts.ts
monitoring/health.ts

analytics/events.ts
analytics/search-analytics.ts
analytics/checkout-analytics.ts
analytics/vendor-analytics.ts
analytics/revenue-analytics.ts

lib/security/csrf.ts
lib/security/rate-limit.ts
lib/security/headers.ts
lib/security/idempotency.ts
lib/security/signed-urls.ts

app/api/v1/media/upload-sessions/route.ts
app/api/v1/media/assets/[assetId]/complete/route.ts
app/api/v1/search/route.ts
app/api/v1/search/suggestions/route.ts
app/api/v1/search/trending/route.ts
app/api/v1/checkout/sessions/route.ts
app/api/v1/checkout/sessions/[sessionId]/place-order/route.ts
app/api/v1/vendors/onboarding/route.ts
app/api/v1/admin/incidents/route.ts
```

## Priority Breakdown

## Critical

- `lib/security/*`
- `services/checkout/*`
- `services/media/*`
- `repositories/firestore/support-messages-repository.ts`
- `events/outbox/*`

## High Priority

- `services/search/*`
- `repositories/search/*`
- `queues/*`
- `workers/media-worker.ts`
- `workers/search-index-worker.ts`

## Medium

- `services/vendors/*`
- `analytics/*`
- `monitoring/*`

## Future

- more Postgres repositories
- fraud and recommendation services
