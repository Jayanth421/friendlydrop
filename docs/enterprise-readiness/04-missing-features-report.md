# Missing Feature Report

## Media and File Handling

Current capability:

- upload validation
- Supabase object storage
- simple media path normalization

Missing enterprise features:

- private bucket policy by asset class
- signed URLs
- signed upload URLs
- AVIF generation
- deterministic WebP generation
- responsive breakpoints
- thumbnail generation
- low-quality placeholders / blur hashes
- image metadata extraction
- dedupe by perceptual hash
- malware scanning
- moderation hooks
- background jobs
- lifecycle/archive rules
- audit trails
- usage and egress analytics

## Product Catalog

Current capability:

- basic product model
- variants
- tags
- SEO metadata
- builder-driven PDP sections

Missing fashion-commerce features:

- explicit option model: color, size, fit, material, season
- swatch media sets
- size charts by brand/category
- fit guidance
- normalized attribute taxonomy
- product family / style-color grouping
- bundle graph
- richer cross-sell graph
- catalog quality scoring
- inventory forecasting
- merchandising rules engine

## Search and Discovery

Current capability:

- Firestore-backed keyword filtering
- simple sort and filters

Missing:

- typo tolerance
- synonyms
- autosuggest
- query rules
- boosted ranking
- personalized ranking
- trend detection
- zero-result recovery
- search analytics
- click and conversion analytics
- merchandising curation tools

## Checkout and Payments

Current capability:

- Razorpay
- Stripe
- offline UPI proof
- coupons
- dynamic delivery and payment rules

Missing:

- one-click checkout
- stored payment instruments
- accelerated checkout identity
- address verification
- fraud scoring
- payment retry orchestration
- smart payment routing by approval rate
- gift cards
- store credit ledger
- checkout recovery automation
- tax and duty extensibility

## Customer Experience

Current capability:

- wishlist
- recently viewed
- order history
- basic support

Missing:

- loyalty ledger
- tiers and rewards
- referral engine
- wishlist recovery messaging
- synced recently viewed server-side
- personalized homepage
- recommendation service
- saved sizes and style preferences
- profile-based merchandising

## Vendor Platform

Current capability:

- vendor entity
- approval status
- dashboard summary
- payout list

Missing:

- structured onboarding workflow
- KYC verification states
- legal and banking verification
- commission rules engine
- payout calculation and reserve policies
- vendor performance scoring
- SLA tracking
- fulfillment compliance analytics
- vendor notifications center
- dispute management

## Admin / Operations

Current capability:

- broad page coverage
- control tower
- settings and logs

Missing:

- incident management
- operational runbooks
- alert routing
- case assignment queues
- fraud dashboard
- vendor health dashboard
- inventory risk dashboard
- payment approval dashboard
- recovery workflow dashboard
- job execution dashboard

## Security and Platform

Missing:

- rate limiting
- CSRF defense
- hardened session governance
- endpoint idempotency policy
- secrets rotation policy
- WAF-aware abuse controls
- signed asset delivery policy
- data retention policy
- compliance-ready audit model
