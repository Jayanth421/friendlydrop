# Security Review Report

## Executive Summary

The application has a useful baseline:

- authenticated server session cookie
- server-side permission checks
- role-aware admin APIs
- Zod validation on many endpoints
- activity and audit logging primitives

However, there are several enterprise-blocking issues.

## Critical Findings

## 1. Firestore rules allow profile tampering

Current `firestore.rules` permit a signed-in user to update their own `users/{userId}` document without field-level restrictions.

Impact:

- role escalation if the client SDK is used directly
- self-enabling flags such as `twoFactorEnabled`
- editing wallet, loyalty, notes, or admin-visible fields
- inconsistent trust between server-side role resolution and Firestore data

Required fix:

- deny direct client writes to privileged user fields
- split public profile fields from privileged profile state
- enforce server-only mutations for role, status, loyalty, wallet, notes, and flags

## 2. No rate limiting on public or authenticated APIs

Observed gaps:

- auth session route
- upload route
- support chat
- checkout config
- create-order
- verify-payment
- admin APIs

Impact:

- brute force and session abuse
- abusive upload traffic
- order creation spam
- expensive dashboard scraping

Required fix:

- per-IP and per-user rate limits
- route class quotas
- stricter limits for upload, auth, support, and admin routes

## 3. No CSRF strategy for cookie-backed server session routes

The app uses an HTTP-only session cookie and many state-changing routes rely on same-site protections alone.

That is not sufficient for enterprise-grade control panels and customer payment surfaces.

Required fix:

- CSRF token or signed double-submit cookie pattern
- origin validation on state-changing routes
- same-origin enforcement for admin and checkout APIs

## 4. Upload security is incomplete

Current upload path:

- validates file type by MIME
- validates file size
- writes bytes directly to storage

Missing:

- malware scanning
- content sniffing
- image re-encoding quarantine
- signed upload URLs
- private bucket strategy
- upload abuse throttling
- DLP/PII detection for sensitive media

## 5. Payment flows are not fully idempotent

Stripe has a pending-order protection path.

Razorpay verification and offline UPI flows do not have equivalent idempotent guards at the same maturity level.

Impact:

- duplicate order creation
- inconsistent transaction ledger
- customer double-submit edge cases

Required fix:

- idempotency keys on checkout initiation
- provider payment id uniqueness constraints
- payment-state transition guards

## High Priority Findings

## 6. Session hardening is incomplete

Current strengths:

- session cookie is HTTP-only
- secure flag is enabled in production

Missing:

- session rotation on privilege change
- admin step-up auth for sensitive actions
- device fingerprint scoring
- risky IP detection
- session revocation list
- idle timeout policy by role

## 7. Secrets management is too implicit

Issues:

- Firebase client config has fallback values in code
- integrations are mostly env-driven without explicit secret policy
- there is no secrets rotation process documented in-code

Required fix:

- remove fallback runtime credentials
- centralize secret access via provider wrapper
- define key rotation procedure for payments, storage, email, and internal signing

## 8. Audit coverage is partial

Admin create/update flows often log activity and audit events, but the pattern is not universal.

Missing:

- customer-sensitive read logging
- payout and refund evidence logging
- upload evidence chain
- permission change audit lineage
- incident annotation trail

## 9. Error responses flatten too many failure types

Many routes return generic `400` responses for:

- validation errors
- provider failures
- internal errors
- storage failures

Impact:

- harder detection
- poor operational visibility
- weak client retry behavior

## Medium Priority Findings

## 10. Storage and transport security posture is thin

Missing:

- CSP and stronger security headers
- request correlation ids
- explicit API versioning
- security event stream for auth anomalies

## 11. Rules and app RBAC are not fully aligned

App permissions and Firestore rules express different role semantics.

That drift becomes dangerous during future client-side feature expansion.

## Recommended Security Program

## Critical

- lock down Firestore user writes
- add rate limiting and CSRF protection
- add upload quarantine + malware scan
- add payment idempotency and duplicate guards

## High Priority

- session management overhaul
- secret management abstraction
- unified audit model
- security headers and request IDs

## Medium

- anomaly detection
- admin incident workflows
- signed asset delivery for customer-sensitive uploads

## Future

- device reputation
- fraud graphing
- ML-assisted abuse detection
