# Enterprise Admin Dashboard Blueprint

## 1. Core Connected Architecture
- Unified control plane:
  - Orders, Payments, Delivery, Inventory, Customers, Vendors, Marketing, Analytics
- Event-driven orchestration:
  - `checkout_initiated` -> `payment_succeeded` -> `order_confirmed` -> `inventory_reserved` -> `vendor_notified` -> `delivery_assigned`
- Real-time feeds:
  - Control Tower summary + SSE stream for cross-module health and KPI signals
- Persistence:
  - Firestore domain collections (`orders`, `transactions`, `users`, `products`, `vendors`, `campaigns`, `settings`, `plugins`, `cmsPages`, `systemEvents`)

## 2. Order, Payment, Delivery Flow
- Order lifecycle:
  - pending / confirmed / packed / shipped / delivered / returned / cancelled / refunded
- Automated chain:
  - payment success -> optional auto-confirm -> inventory reserve -> vendor notification -> optional auto-delivery assignment
- Payment control:
  - gateway enable/disable, order value guardrails, smart fallback routing, COD constraints
- Delivery rules:
  - zone + distance + speed + subtotal + free-shipping rules evaluated at checkout in real time

## 3. Delivery Operations
- Delivery Rules Engine in admin settings:
  - base fee, express/same-day surcharges, SLA windows, max radius
  - zone definitions (local/regional/national with pincode and city matching)
  - pricing rule priority stack
  - free delivery conditions (value, segment, campaign, first order)
- Delivery command center:
  - shipment table, tracking/ETA visibility, delay monitoring

## 4. Payments and Settlements
- Payment methods:
  - UPI/cards/net banking/COD/wallet toggles
  - Razorpay/Stripe/PayPal gateway toggles
- Rules:
  - min/max order limits, COD max and blocked pincodes, retry + fallback flags
- Refund and settlement:
  - return/refund workflows + transaction ledger + vendor payout surfaces

## 5. Integration and Webhook Layer
- Integration panel:
  - provider registry with env-key references, mode (test/live), health status
- API and webhook logs:
  - request/response/error logs
  - webhook delivery history with retries and response codes
- Plugin system:
  - install/disable/uninstall apps with provider metadata and endpoint config

## 6. CRM + Vendor + Catalog + Marketing
- CRM:
  - full profile, segment, loyalty, wallet, notes, notification actions, support linkage
- Vendor:
  - onboarding, approval, payout summaries, vendor dashboard
- Catalog:
  - categories, nested structure, SEO fields, tags, product-to-vendor link
- Marketing + banners:
  - campaigns, audience targeting, offer scheduling, banner linkage

## 7. CMS, Mobile, and Automation/AI
- CMS manager:
  - static business pages (about/policies/blog scaffolding), publish status, SEO metadata
- Mobile control panel:
  - app feature toggles, push control, forced update versions, home layout preset
- Automation center:
  - IF/THEN rule table
  - AI toggles for demand forecasting, fraud detection, pricing, recommendations
  - sandbox and A/B testing toggles

## 8. Security and Control
- RBAC roles:
  - `super_admin`, `admin`, `manager`, `staff`, `vendor`, `user`
- Controls:
  - maintenance mode, checkout toggle, GST toggle, auto-confirm toggle, auto-assignment toggle
- Auditability:
  - system events, activity logs, audit logs
- Auth:
  - admin/session checks + role resolution via email and pattern assignment

## 9. API Surface (Production-Ready Scaffolding)
- Settings:
  - `GET/PUT /api/admin/settings`
- Checkout controls:
  - `GET /api/checkout/config`
  - `POST /api/create-order`
  - `POST /api/verify-payment`
- Plugins:
  - `GET/POST /api/admin/plugins`
  - `PATCH /api/admin/plugins/[pluginId]`
- Mobile:
  - `GET/PUT /api/admin/mobile-controls`
- Automation:
  - `GET/PUT /api/admin/automation`
- CMS:
  - `GET/POST /api/admin/cms`
- Integrations/logs:
  - `GET /api/admin/integrations/logs`
- Vendors, catalog, banners, CRM notifications:
  - existing admin APIs retained and connected

## 10. SaaS Scalability Path
- Immediate:
  - background jobs for retries and asynchronous webhook outbox
- Next:
  - multi-warehouse service + split-order allocation engine
- Advanced:
  - tenant isolation, plugin SDK contracts, model-serving endpoints for AI predictions
