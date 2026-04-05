# Enterprise Admin Dashboard Blueprint

## 1. Platform Model
- **Frontend**: Next.js App Router admin UI with role-gated modules.
- **Domain Services**: Orders, Payments, Delivery, Inventory, Customers, Analytics, Automation.
- **Real-time Layer**: SSE stream (`/api/admin/control-tower/stream`) and live summary endpoint (`/api/admin/control-tower/summary`).
- **Persistence**: Firestore collections for transactional modules + `systemEvents` as integration timeline.

## 2. Deeply Connected Event Flow
- `checkout_initiated` -> pricing snapshot created (tax + GST + delivery)
- `payment_succeeded` -> order confirmed
- `order_confirmed` -> inventory reservation workflow
- `inventory_reserved` -> low-stock detection and alerts
- `delivery_assigned` -> tracking + ETA injected automatically
- `automation_rule_executed` -> audit-ready orchestration trail

This provides the canonical chain:
**Orders ↔ Payments ↔ Delivery ↔ Inventory ↔ Customers**

## 3. Automation Engine
- `payment-success-to-fulfillment`
  - Confirm order
  - Reserve inventory
  - Assign delivery
- `inventory-low-stock-alert`
  - Raise warning event when stock <= threshold
- `delivery-failed-reassignment` (framework ready)
  - Reassign courier
  - Notify support + customer

## 4. Order Lifecycle (Automated)
1. Frontend creates order draft with `paymentMethod` and `priority`.
2. Payment provider confirms transaction.
3. System creates order and runs post-payment orchestration.
4. Inventory is reserved atomically.
5. Delivery assignment is auto-generated with courier + ETA.
6. Customer sees full financial breakdown and tracking-ready status.

## 5. Delivery System Design
- Auto-assignment strategy:
  - Uses order priority (`express` / `normal`) and region heuristic.
  - Generates courier + tracking + ETA.
- SLA tracking:
  - Computes on-time vs delayed shipment rate in Control Tower snapshot.
- Reverse logistics:
  - Refund workflows emit payment events for return/reconciliation.

## 6. Payment System Design
- Multi-gateway support: Razorpay + Stripe in production flow, PayPal-ready extension point.
- Unified pricing core:
  - Subtotal
  - Discount
  - GST
  - Delivery fee
  - Final payable total
- Reconciliation-ready:
  - Gateway metrics and success rates included in Control Tower.

## 7. Analytics Engine
- Control Tower computes:
  - Revenue (24h), orders (24h)
  - Payment success rate
  - On-time delivery rate
  - Delayed shipments
  - Low stock products
  - Open support tickets
  - Automation executions

## 8. API-Ready Structure
- `GET /api/admin/control-tower/summary`
  - Returns connected module KPIs + gateway health + sync health + rules + event feed.
- `GET /api/admin/control-tower/stream`
  - Live SSE stream for operation events.
- Existing domain APIs:
  - `/api/create-order`, `/api/verify-payment`, `/api/orders/stripe/confirm`
  - `/api/admin/orders/*`, `/api/admin/transactions`, `/api/admin/settings`

## 9. Component System
- Admin shell:
  - Sidebar, topbar, permission-gated routes.
- Dashboard primitives:
  - KPI cards, charts, status pills, data tables.
- New connected module:
  - **Control Tower** (`/admin/control-tower`) for operations command center.

## 10. Security + Access Control
- Session-based auth with role + permission checks.
- Audit and activity logs for admin actions.
- Pattern-based role assignment available for scaling team onboarding:
  - `ADMIN_EMAIL_PATTERNS`, `STAFF_EMAIL_PATTERNS`

## 11. Startup-to-SaaS Scalability Path
- Near-term:
  - Move automation execution to queue workers (BullMQ / PubSub).
  - Add outbox pattern for guaranteed event delivery.
- Mid-term:
  - Warehouse/fulfillment service split.
  - Payment orchestration service with smart routing/fallback.
- Long-term:
  - Multi-tenant workspace isolation + plugin marketplace runtime.
  - Forecasting, dynamic pricing, and delivery ETA ML services.
