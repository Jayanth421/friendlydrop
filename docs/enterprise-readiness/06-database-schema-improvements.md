# Database Schema Improvements

## Principle

FriendlyDrop should use the right storage system for the right job.

For startup cost efficiency, do not rewrite everything at once.

## Recommended Data Platform Split

## Keep on Firestore

- user session-adjacent profile envelope
- feature flags and global settings
- admin 2FA challenges
- lightweight audit/event outbox
- low-frequency config documents

## Move or introduce on Supabase Postgres over time

- product catalog
- variants
- media metadata
- inventory
- orders and order items
- transactions and payouts
- loyalty ledgers
- vendor operations
- recommendation events
- search analytics

## Add dedicated search index

- Algolia for speed-to-value and merchandising UX
- Elasticsearch if full control and hybrid/vector search become primary

## Proposed Logical Schema

## Catalog

- `products`
- `product_families`
- `product_variants`
- `variant_options`
- `variant_inventory`
- `product_attributes`
- `size_charts`
- `product_relations`
- `product_media_assets`

## Media

- `media_assets`
- `media_derivatives`
- `media_hashes`
- `media_scan_results`
- `media_access_logs`

## Orders and Checkout

- `carts`
- `cart_items`
- `saved_addresses`
- `payment_methods`
- `checkout_sessions`
- `orders`
- `order_items`
- `order_status_history`
- `payments`
- `refunds`
- `store_credit_ledger`
- `gift_cards`

## Customers

- `customer_profiles`
- `customer_preferences`
- `wishlist_items`
- `recently_viewed_items`
- `loyalty_accounts`
- `loyalty_ledger`
- `referrals`
- `customer_segments`

## Vendors

- `vendor_accounts`
- `vendor_kyc_documents`
- `vendor_scorecards`
- `vendor_commission_rules`
- `vendor_payouts`
- `vendor_notifications`

## Search and Analytics

- `search_queries`
- `search_clicks`
- `search_conversions`
- `recommendation_events`
- `homepage_personalization_snapshots`

## Support

- `support_tickets`
- `support_messages`
- `support_attachments`

## Firestore-Specific Changes If You Stay Longer

## Must change immediately

- move support ticket messages out of ticket documents
- stop using full collection scans for analytics
- stop recalculating customer metrics in checkout write path

## Add these collections

- `idempotencyKeys`
- `jobOutbox`
- `mediaJobs`
- `searchIndexJobs`
- `fraudReviews`
- `alertIncidents`

## Indexing Improvements

- search index fed asynchronously from catalog changes
- denormalized browse index for collections, trends, recommendations
- time-partitioned analytics tables or daily aggregates

## Data Model Direction by Priority

## Critical

- support messages subcollection/table
- idempotency ledger
- media asset metadata model
- order and payment uniqueness constraints

## High Priority

- product family / variant normalization
- vendor payout ledger
- loyalty / credits ledger
- search events schema

## Medium

- personalization profile store
- recommendation feature store

## Future

- warehouse inventory graph
- regional pricing models
