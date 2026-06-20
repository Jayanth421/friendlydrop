# Migration Plan

## Migration Strategy

Do not attempt a full rewrite.

Use a staged strangler approach:

1. secure the current system
2. introduce new layers beside the old ones
3. migrate the heaviest flows first
4. move reads before writes where possible

## Phase 0: Immediate Stabilization

Timeline:

- 1 to 2 weeks

## Critical outcomes

- fix Firestore user-write trust boundary
- add rate limiting
- add CSRF/origin checks
- add payment idempotency keys
- add request ids and structured logs

## Deliverables

- secured `firestore.rules`
- `lib/security/*`
- route protection wrappers
- idempotent payment confirmation

## Phase 1: Media and Search Foundation

Timeline:

- 2 to 4 weeks

## High Priority outcomes

- signed upload session flow
- private bucket strategy for sensitive assets
- derivative generation plan
- search adapter abstraction
- Algolia or Elastic proof-of-concept index

## Deliverables

- new media asset metadata model
- upload session APIs
- media worker skeleton
- search API v1

## Phase 2: Service and Repository Refactor

Timeline:

- 4 to 8 weeks

## High Priority outcomes

- split `lib/firebase/firestore.ts`
- introduce services and repositories
- add outbox pattern
- move support messages out of single documents

## Deliverables

- repository modules
- service modules
- support message migration
- event contracts

## Phase 3: Checkout and Customer Platform

Timeline:

- 6 to 10 weeks

## High Priority outcomes

- one-click checkout foundation
- address validation integration
- abandoned cart workflow
- saved payments abstraction
- store credits and loyalty ledger design

## Deliverables

- checkout session service
- notification jobs
- loyalty and credits schema

## Phase 4: Vendor and Operations Upgrade

Timeline:

- 8 to 12 weeks

## Medium outcomes

- vendor onboarding workflow
- payout engine
- vendor scorecards
- incident management and alert center
- control tower read models

## Deliverables

- vendor service
- payout worker
- incident APIs
- operational dashboards over materialized metrics

## Phase 5: Data Platform Evolution

Timeline:

- 3 to 6 months

## Future outcomes

- move scale-critical relational domains to Postgres
- maintain Firestore for config and lightweight operational state
- full event-driven analytics and recommendation pipeline

## Deliverables

- relational catalog and order schema
- CDC or outbox-fed search indexing
- vendor and customer analytics marts

## Priority Matrix

## Critical

- Firestore rules hardening
- rate limiting
- CSRF/origin validation
- payment idempotency
- support message model fix
- search decoupling plan

## High Priority

- services and repositories
- signed upload flows
- media jobs
- search index rollout
- dashboard read models
- checkout session model

## Medium

- loyalty
- referrals
- vendor scoring
- real-time alerting
- analytics warehouse

## Future

- multi-region scaling
- advanced fraud scoring
- recommendation ML
- international markets and tax engines

## Recommended First 30 Days

1. Secure trust boundaries and API protections.
2. Add idempotency and audit consistency to checkout and payment flows.
3. Create service/repository skeletons without breaking page routes.
4. Ship search abstraction and signed upload initiation.
5. Start support message and dashboard read-model migrations.
