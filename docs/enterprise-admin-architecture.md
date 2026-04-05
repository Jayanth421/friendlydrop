# Enterprise Admin Dashboard Blueprint

## 1. Platform Model
- **Frontend**: Next.js App Router with admin and vendor workspaces.
- **Core Domains**: Orders, Payments, Delivery, Inventory, Customers, Vendors, Catalog, Marketing, Banners, Analytics, Automation.
- **Real-time Layer**: SSE stream (`/api/admin/control-tower/stream`) + snapshot endpoint (`/api/admin/control-tower/summary`).
- **Persistence**: Firestore domain collections + `systemEvents` event timeline.

## 2. Connected Event Graph
- `checkout_initiated` -> pricing snapshot locked
- `payment_succeeded` -> order confirmed
- `order_confirmed` -> inventory reserved
- `inventory_reserved` -> low stock event (if threshold hit)
- `vendor_notified` -> seller visibility + downstream fulfillment
- `delivery_assigned` -> tracking + ETA
- `automation_rule_executed` -> audit trail

Canonical chain:
**Orders <-> Payments <-> Delivery <-> Inventory <-> Customers <-> Vendors**

## 3. Customer CRM Domain
- Unified customer view:
  - profile, spend, order/payment counts, loyalty points, wallet balance
- Segmentation:
  - new / repeat / VIP
- Actions:
  - block/unblock, role controls, notes, notifications (email/SMS/WhatsApp/push channels)
- Support integration:
  - open ticket load included in CRM snapshot

## 4. Vendor Domain
- Vendor onboarding endpoint + approval workflow
- KYC and status states:
  - pending / approved / rejected / suspended
- Commission-aware seller profile
- Payout stream:
  - pending/completed settlement records
- Vendor dashboard:
  - order volume, revenue, payouts, recent orders

## 5. Catalog + Banner + Marketing Domain
- Nested category model with parent/level hierarchy
- Catalog SEO fields + tags
- Banner scheduler model:
  - hero/offer/category banners
  - desktop/mobile assets
  - campaign linking
- Campaign linkage:
  - marketing status and banner activation are structurally connected

## 6. Automation Engine
- Active workflow rules:
  - payment success -> confirm -> reserve -> assign delivery
  - low stock alert generation
  - delivery failed reassignment hook
- Additional automation-ready endpoints:
  - customer notify
  - vendor approval updates
  - catalog/banner upserts publishing system events

## 7. API-Ready Surface
- Control Tower:
  - `GET /api/admin/control-tower/summary`
  - `GET /api/admin/control-tower/stream`
- CRM:
  - `POST /api/admin/customers/[userId]/notify`
- Vendors:
  - `GET/POST /api/admin/vendors`
  - `PATCH /api/admin/vendors/[vendorId]/approval`
  - `GET /api/vendor/dashboard/summary`
- Catalog/Banners:
  - `GET/POST /api/admin/categories`
  - `GET/POST /api/admin/banners`

## 8. Role and Access Model
- Roles:
  - `super_admin`, `admin`, `manager`, `staff`, `vendor`, `user`
- Fine-grained permissions:
  - `vendors:manage`, `catalog:manage`, `banners:manage`, `analytics:view`, and existing admin scopes
- Pattern-based role assignment:
  - admin/manager/staff/vendor email lists and pattern matchers

## 9. SaaS Scalability Path
- Near-term:
  - queue-backed automation workers + retry policies
  - webhook outbox with signed delivery
- Mid-term:
  - warehouse and fulfillment microservices
  - smart payment routing with gateway failover scoring
- Long-term:
  - tenant isolation
  - plugin marketplace SDK
  - ML services for forecasting, recommendations, and pricing optimization
