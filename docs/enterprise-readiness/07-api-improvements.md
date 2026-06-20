# API Improvements

## Current API State

The existing API surface is broad, but it is still controller-centric and document-centric rather than contract-centric and workflow-centric.

## Required API Standards

## 1. Versioning

Introduce versioned APIs for scale-critical domains:

- `/api/v1/catalog/*`
- `/api/v1/search/*`
- `/api/v1/checkout/*`
- `/api/v1/orders/*`
- `/api/v1/media/*`
- `/api/v1/vendors/*`
- `/api/v1/admin/*`

## 2. Idempotency

Required for:

- checkout creation
- payment confirmation
- refund initiation
- payout creation
- media upload session initiation

Standard:

- accept `Idempotency-Key`
- persist result by route + actor + key

## 3. Pagination and filtering

Replace large list responses with:

- cursor pagination
- explicit projections
- filter schemas
- sort allow-lists

## 4. Signed upload workflow

Replace direct upload POST with:

1. `POST /api/v1/media/upload-sessions`
2. client uploads to signed URL
3. `POST /api/v1/media/assets/{assetId}/complete`
4. worker generates derivatives and scan results

## 5. Search API

New endpoints:

- `GET /api/v1/search`
- `GET /api/v1/search/suggestions`
- `GET /api/v1/search/trending`
- `POST /api/v1/search/events`

## 6. Checkout API

New endpoints:

- `POST /api/v1/checkout/sessions`
- `POST /api/v1/checkout/sessions/{id}/address`
- `POST /api/v1/checkout/sessions/{id}/payment-intents`
- `POST /api/v1/checkout/sessions/{id}/place-order`
- `POST /api/v1/checkout/abandoned-recovery`

## 7. Vendor APIs

New endpoints:

- `POST /api/v1/vendors/onboarding`
- `POST /api/v1/vendors/onboarding/{id}/documents`
- `GET /api/v1/vendors/{id}/scorecard`
- `GET /api/v1/vendors/{id}/analytics`
- `GET /api/v1/vendors/{id}/payouts`

## 8. Admin APIs

Control tower should split into:

- alerts
- incidents
- metrics
- health
- fraud reviews
- payout approvals

## 9. Error model

Standardize:

- `400` validation
- `401` unauthenticated
- `403` unauthorized
- `404` not found
- `409` duplicate / idempotency conflict
- `422` business rule violation
- `429` rate limited
- `500` internal

## 10. Observability contract

All APIs should emit:

- request id
- actor id
- route name
- latency
- result code
- retryability

## Priority

## Critical

- versioned checkout
- idempotency
- signed media flows
- paginated admin lists

## High Priority

- search service API
- vendor workflow APIs
- standardized errors

## Medium

- admin incident APIs
- recommendation and loyalty APIs

## Future

- public partner APIs
- webhook subscriptions
