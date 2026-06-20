# Scalability Review Report

## Executive Summary

The current implementation is strong enough for an MVP and early-stage growth, but several data-access and orchestration patterns will fail long before the platform reaches millions of users or products.

## Critical Scalability Bottlenecks

## 1. Catalog search and facets are read-path bottlenecks

Current pattern:

- `/api/products` loads all products to compute facets
- filtered requests often trigger additional catalog reads
- `/search` delegates to Firestore filtering instead of a search engine

Impact at scale:

- high Firestore read cost
- slow response times
- incomplete facets
- poor ranking quality

Required change:

- move search and facets to Algolia or Elasticsearch
- keep Firestore/Postgres as source of truth
- index denormalized browse/search documents asynchronously

## 2. Dashboard and operations views aggregate over OLTP collections

Observed patterns:

- `getAllOrders()`
- `getTransactions()`
- `getProducts()`
- `getSupportTickets()`

These are used to build:

- control tower
- vendor dashboard
- CRM snapshot
- marketing insights

Impact:

- expensive fan-out reads
- slow admin dashboards
- poor concurrency under load

Required change:

- build materialized aggregates through events and workers

## 3. Support chat stores message history in a single document

`appendSupportTicketMessage()` loads and rewrites the full message array.

Impact:

- document growth
- contention
- write amplification
- eventual document size limit risk

Required change:

- store messages in `supportTicketMessages/{ticketId}/messages/{messageId}`
- keep ticket header document lightweight

## 4. Order creation recalculates user metrics with live reads

`createOrder()` currently:

- creates the order
- creates the transaction
- counts historical orders
- reads user spend
- recalculates segment
- updates user document

Impact:

- extra round trips
- race conditions under concurrent ordering
- slower checkout finalization

Required change:

- move non-essential profile enrichment to async post-order workers
- maintain counters with atomic patterns or rollups

## 5. Root layout reads settings dynamically on every request

`app/layout.tsx` is `force-dynamic` and fetches settings for metadata and layout composition.

Impact:

- repeated config reads
- increased latency on all routes
- hot-read concentration on `settings/default`

Required change:

- cache settings aggressively
- publish settings snapshots to edge cache or KV

## High Priority Scalability Issues

## 6. Synchronous upload processing

Current:

- file fully buffered in memory
- uploaded in request path
- no transform pipeline

Required:

- signed upload initiation
- async media jobs
- derivative generation
- asset state machine

## 7. No queue, no worker, no outbox

Missing platform pieces:

- reliable retries
- backpressure handling
- decoupled integrations
- eventual consistency workflows

## 8. Bulk admin operations run inline

Examples:

- bulk product import
- bulk order status updates
- meta sync follow-up

These should become background jobs with progress tracking.

## 9. Control tower SSE pulls Firestore every few seconds per client

That is acceptable for prototypes, not enterprise operations.

Use:

- event pipeline
- fan-out channel
- pre-aggregated metrics

## 10. Large route result sets without pagination

Many admin endpoints return hundreds or up to a thousand records directly.

Required:

- cursor pagination
- filtered projections
- lightweight summaries

## Data-Layer Risks Specific to Firestore

Official Firestore guidance warns about:

- hotspots on single documents
- high write rates on lexicographically close keys
- high-rate updates on monotonic fields

FriendlyDrop risk areas:

- repeated reads from singleton config docs
- `supportTickets` message-array rewrites
- `systemEvents` as a growing central stream
- scan-based dashboards and fallback queries

## Recommended Scale Strategy

## Critical

- add enterprise search
- split support ticket messages into subcollections
- add queues and outbox
- make payment writes idempotent

## High Priority

- materialize dashboard views
- move media processing async
- introduce pagination and projections
- cache layout and settings

## Medium

- regionalize media delivery
- shard event analytics by day/vendor/store
- add read models for vendor KPIs

## Future

- multi-region active-active data strategy
- warehouse-aware inventory service
- streaming personalization pipeline
