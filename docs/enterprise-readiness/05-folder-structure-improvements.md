# Folder Structure Improvements

## Goal

Move the codebase from feature-rich monolith to modular commerce platform without forcing an immediate rewrite.

## Recommended Top-Level Structure

```text
app/
components/
config/
services/
repositories/
events/
queues/
workers/
monitoring/
analytics/
lib/
store/
types/
docs/
tests/
```

## Proposed Responsibilities

## `app/`

- route rendering
- request parsing
- auth gates
- response shaping

No business orchestration should live here.

## `services/`

Core business use cases:

- `services/catalog`
- `services/media`
- `services/search`
- `services/checkout`
- `services/orders`
- `services/payments`
- `services/customers`
- `services/vendors`
- `services/admin`

## `repositories/`

Persistence adapters:

- `repositories/firestore`
- `repositories/postgres`
- `repositories/search`
- `repositories/storage`
- `repositories/cache`

## `events/`

- event contracts
- outbox writers
- publishers
- consumers
- replay tools

## `queues/`

- queue definitions
- job payload schemas
- retry policies

## `workers/`

- media worker
- search indexing worker
- notification worker
- fraud worker
- payout worker
- analytics rollup worker

## `monitoring/`

- logger
- metrics
- tracing
- alert publishers
- health checks

## `analytics/`

- data models
- rollups
- dashboards
- BI export adapters

## `config/`

- environment parsing
- feature flags
- integration registry
- rate-limit policy
- permissions registry

## Refactor Guidance

## Keep for now

- `components/`
- `store/`
- most of `app/`

## Break apart first

- `lib/firebase/firestore.ts`
- `lib/settings-engine.ts`
- `lib/automation-engine.ts`
- `lib/control-tower.ts`

## Suggested Incremental Mapping

- Firestore reads/writes move into `repositories/firestore/*`
- business logic moves into `services/*`
- event creation moves into `events/*`
- integration clients move into `services/integrations/*`

This preserves delivery velocity while improving architecture.
