# Supabase Storage Architecture for Enterprise eCommerce

## Context

FriendlyDrop currently uses Supabase Storage as a simple object store with Firestore tracking some upload metadata. That works for a small catalog, but it will not scale cleanly to tens of millions of assets without a stronger control plane.

The enterprise target is:

- Supabase Storage for binary objects
- Supabase Postgres for media metadata, workflow state, audit, usage, and access logs
- Next.js App Router as the API edge only
- async workers for validation, scanning, optimization, and derivative generation
- Firestore kept for non-media app state until the broader platform migration is complete

The key principle is: the file bytes live in object storage, while the database owns the media lifecycle.

## Target Objectives

- Handle 10 million product images and 1 million product videos without path collisions or hot directories
- Support private and public assets with path-level isolation
- Generate modern image variants and video renditions asynchronously
- Track every upload, transform, access, and restore event
- Support vendor-owned, customer-owned, admin-only, and system-owned asset classes
- Preserve SEO-friendly delivery URLs and CDN caching
- Enable safe migration from the current single-bucket upload model

## 1. Supabase Bucket Structure

Use separate buckets by data sensitivity and operational behavior.

| Bucket | Visibility | Purpose | Notes |
| --- | --- | --- | --- |
| `product-images` | public via signed/CDN URLs | Product galleries, PDP images, swatches | Main revenue-critical bucket |
| `product-videos` | private by default | Product demos, reels, detail videos | Serve through signed URLs or CDN edge auth |
| `category-images` | public | Category banners and taxonomy imagery | Low churn, heavily cached |
| `brand-assets` | private/public mixed | Logos, style guides, brand packs | Default private, selectively published |
| `banners` | public | Homepage and campaign banners | Short-lived cache, frequent rotation |
| `cms-assets` | mixed | CMS hero images, embedded media | Per-page access control |
| `vendor-assets` | private | Vendor documents, product packs, catalogs | Vendor-isolated namespace |
| `support-attachments` | private | Chat attachments, support evidence | Strict access and retention rules |
| `payment-proofs` | private | UPI screenshots and payment evidence | Admin and order-owner only |
| `user-uploads` | private | Customer uploads and personalization files | User-owned, time-limited sharing |
| `review-media` | public after moderation | UGC images and videos | Moderation gate before publish |
| `marketing-assets` | public/private mixed | Ads, social, campaign creative | Lifecycle-managed by campaign dates |
| `backups` | private | Archived manifests, exports, restore packages | Not the primary backup system, only the asset archive surface |

### Bucket policy model

- Public buckets still use signed delivery URLs or CDN-friendly public reads for approved variants.
- Private buckets always require signed URLs, service-role access, or edge-authenticated access.
- Admin-only buckets are isolated by policy and should never be rendered directly from client code.
- Customer-sensitive buckets should default to deny unless the requesting actor owns the object or has support/admin permissions.

## 2. Folder Structure

Use a date + tenant + entity hierarchy so files are sharded naturally and audits are easy.

### Shared naming rules

- Lowercase folders only
- Use UUIDs or opaque IDs for `vendor-id`, `product-id`, `customer-id`, `ticket-id`, and `campaign-id`
- Do not store user-facing names in object paths
- Keep original filenames only at the leaf level after sanitization
- Partition by year and month for lifecycle and reporting

### `product-images`

```text
product-images/
  year/month/vendor-id/product-id/
    original/
    thumbnail/
    small/
    medium/
    large/
    webp/
    avif/
    jpeg/
```

Recommended object pattern:

```text
product-images/2026/06/{vendorId}/{productId}/original/{assetId}.jpg
product-images/2026/06/{vendorId}/{productId}/small/{assetId}.webp
product-images/2026/06/{vendorId}/{productId}/avif/{assetId}.avif
```

### `product-videos`

```text
product-videos/
  year/month/vendor-id/product-id/
    original/
    360p/
    720p/
    1080p/
    thumbnail/
    hls/
```

Recommended object pattern:

```text
product-videos/2026/06/{vendorId}/{productId}/original/{assetId}.mp4
product-videos/2026/06/{vendorId}/{productId}/720p/{assetId}.mp4
product-videos/2026/06/{vendorId}/{productId}/thumbnail/{assetId}.jpg
```

### `category-images`

```text
category-images/
  year/month/category-id/
    original/
    thumbnail/
    webp/
    avif/
```

### `brand-assets`

```text
brand-assets/
  year/month/brand-id/
    original/
    logo/
    color-sets/
    typography/
    webp/
    avif/
```

### `banners`

```text
banners/
  year/month/campaign-id/
    desktop/
    mobile/
    tablet/
    original/
    webp/
    avif/
```

### `cms-assets`

```text
cms-assets/
  year/month/page-id/
    hero/
    inline/
    gallery/
    original/
    webp/
    avif/
```

### `vendor-assets`

```text
vendor-assets/
  year/month/vendor-id/
    onboarding/
    kyc/
    catalog/
    certificates/
    invoices/
    original/
```

### `support-attachments`

```text
support-attachments/
  year/month/ticket-id/message-id/
    original/
    preview/
    thumbnail/
```

### `payment-proofs`

```text
payment-proofs/
  year/month/order-id/
    original/
    preview/
    redacted/
```

### `user-uploads`

```text
user-uploads/
  year/month/user-id/
    original/
    preview/
    thumbnail/
```

### `review-media`

```text
review-media/
  year/month/review-id/
    original/
    thumbnail/
    webp/
    avif/
```

### `marketing-assets`

```text
marketing-assets/
  year/month/campaign-id/
    source/
    social/
    ads/
    email/
    original/
    webp/
    avif/
```

### `backups`

```text
backups/
  daily/
  weekly/
  monthly/
  restore-manifests/
  exports/
```

## 3. Media Lifecycle

### Upload flow

```text
Client
-> POST /api/uploads
-> validate auth, role, file type, size, tenant scope
-> create media_assets row in "pending" state
-> issue signed upload URL or signed object upload policy
-> client uploads to Supabase Storage
-> POST /api/media/complete
-> queue scan/variant job
-> worker scans, extracts metadata, and generates derivatives
-> database updates asset + variant state
-> CDN caches the approved renditions
```

### Processing states

- `draft`
- `pending_upload`
- `uploaded`
- `quarantined`
- `scanning`
- `processing`
- `ready`
- `failed`
- `archived`
- `deleted`

### Variant generation rules

Images:

- Preserve original
- Generate AVIF as preferred modern format
- Generate WebP as broad compatibility fallback
- Generate JPEG fallback when needed for legacy clients or third-party integrations
- Generate responsive sizes: thumbnail, small, medium, large
- Extract dominant color, dimensions, and perceptual hash

Videos:

- Preserve original
- Transcode to 360p, 720p, and 1080p
- Generate preview thumbnail and poster frame
- Optionally package HLS renditions for adaptive delivery
- Store duration, codec, fps, and resolution metadata

### Metadata extraction

Capture:

- content type
- file size
- width and height
- duration
- codec
- frame rate
- aspect ratio
- checksum SHA-256
- perceptual hash for image dedupe
- EXIF orientation
- blur hash or low-quality placeholder
- color palette summary

## 4. Database Schema

Use Supabase Postgres as the source of truth for all media metadata and lifecycle state.

### `media_assets`

Core asset record.

```sql
create table public.media_assets (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  bucket_name text not null,
  object_path text not null,
  asset_type text not null, -- image, video, document, archive, other
  purpose text not null, -- product-image, vendor-asset, payment-proof, etc.
  owner_type text not null, -- product, vendor, user, order, ticket, campaign, system
  owner_id text not null,
  visibility text not null default 'private', -- public, private, signed, admin_only
  content_type text not null,
  size_bytes bigint not null,
  checksum_sha256 text not null,
  phash text null,
  width integer null,
  height integer null,
  duration_seconds numeric(10,3) null,
  status text not null default 'pending_upload',
  scan_status text not null default 'pending',
  metadata jsonb not null default '{}'::jsonb,
  tags text[] not null default '{}',
  original_filename text null,
  uploaded_by uuid not null,
  uploaded_at timestamptz not null default now(),
  processed_at timestamptz null,
  deleted_at timestamptz null,
  archived_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid not null,
  updated_by uuid not null
);

create index media_assets_tenant_owner_idx on public.media_assets (tenant_id, owner_type, owner_id);
create index media_assets_bucket_path_idx on public.media_assets (bucket_name, object_path);
create index media_assets_status_idx on public.media_assets (status, scan_status);
create index media_assets_uploaded_at_idx on public.media_assets (uploaded_at desc);
create unique index media_assets_checksum_owner_unique
  on public.media_assets (tenant_id, owner_type, owner_id, checksum_sha256)
  where deleted_at is null;
```

### `media_variants`

Variant and rendition records.

```sql
create table public.media_variants (
  id uuid primary key default gen_random_uuid(),
  media_asset_id uuid not null references public.media_assets(id) on delete cascade,
  bucket_name text not null,
  object_path text not null,
  variant_name text not null, -- thumbnail, small, medium, large, webp, avif, 360p, 720p, 1080p
  format text not null,
  width integer null,
  height integer null,
  size_bytes bigint null,
  checksum_sha256 text null,
  codec text null,
  duration_seconds numeric(10,3) null,
  is_primary boolean not null default false,
  status text not null default 'queued',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid not null,
  updated_by uuid not null
);

create index media_variants_asset_idx on public.media_variants (media_asset_id, variant_name);
create unique index media_variants_unique_path on public.media_variants (bucket_name, object_path);
```

### `media_folders`

Logical grouping and access boundaries.

```sql
create table public.media_folders (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  parent_id uuid null references public.media_folders(id) on delete cascade,
  folder_type text not null, -- product, vendor, support, marketing, etc.
  name text not null,
  slug text not null,
  path text not null,
  visibility text not null default 'private',
  owner_type text not null,
  owner_id text not null,
  metadata jsonb not null default '{}'::jsonb,
  deleted_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid not null,
  updated_by uuid not null
);

create unique index media_folders_path_unique on public.media_folders (tenant_id, path) where deleted_at is null;
create index media_folders_owner_idx on public.media_folders (tenant_id, owner_type, owner_id);
```

### `media_processing_jobs`

Async work queue state.

```sql
create table public.media_processing_jobs (
  id uuid primary key default gen_random_uuid(),
  media_asset_id uuid not null references public.media_assets(id) on delete cascade,
  job_type text not null, -- scan, extract, image-variants, video-transcode, thumbnail, restore
  priority integer not null default 100,
  status text not null default 'queued',
  attempts integer not null default 0,
  max_attempts integer not null default 5,
  locked_at timestamptz null,
  started_at timestamptz null,
  finished_at timestamptz null,
  next_retry_at timestamptz null,
  error_code text null,
  error_message text null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid not null,
  updated_by uuid not null
);

create index media_processing_jobs_status_priority_idx on public.media_processing_jobs (status, priority, created_at);
create index media_processing_jobs_asset_idx on public.media_processing_jobs (media_asset_id, job_type);
```

### `media_audit_logs`

Immutable administrative and compliance trail.

```sql
create table public.media_audit_logs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  media_asset_id uuid null references public.media_assets(id) on delete set null,
  action text not null, -- upload, scan_passed, scan_failed, variant_created, deleted, restored, policy_changed
  actor_type text not null, -- user, vendor, admin, system, worker
  actor_id text not null,
  ip_address inet null,
  user_agent text null,
  request_id text null,
  before_state jsonb null,
  after_state jsonb null,
  created_at timestamptz not null default now()
);

create index media_audit_logs_asset_idx on public.media_audit_logs (media_asset_id, created_at desc);
create index media_audit_logs_tenant_action_idx on public.media_audit_logs (tenant_id, action, created_at desc);
```

### `media_usage`

Aggregated usage and egress accounting.

```sql
create table public.media_usage (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  media_asset_id uuid not null references public.media_assets(id) on delete cascade,
  bucket_name text not null,
  day date not null,
  access_count bigint not null default 0,
  signed_url_count bigint not null default 0,
  bandwidth_bytes bigint not null default 0,
  storage_bytes bigint not null default 0,
  cache_hits bigint not null default 0,
  cache_misses bigint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index media_usage_day_unique on public.media_usage (tenant_id, media_asset_id, day);
create index media_usage_day_idx on public.media_usage (tenant_id, day desc);
```

### `media_access_logs`

Fine-grained access logging for compliance and abuse analysis.

```sql
create table public.media_access_logs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  media_asset_id uuid not null references public.media_assets(id) on delete cascade,
  variant_id uuid null references public.media_variants(id) on delete set null,
  actor_type text not null,
  actor_id text not null,
  access_type text not null, -- direct, signed_url, cdn, admin_preview, restore
  status_code integer not null,
  ip_address inet null,
  country_code text null,
  referer text null,
  user_agent text null,
  request_id text null,
  created_at timestamptz not null default now()
);

create index media_access_logs_asset_idx on public.media_access_logs (media_asset_id, created_at desc);
create index media_access_logs_tenant_day_idx on public.media_access_logs (tenant_id, created_at desc);
```

### Shared schema conventions

- Add `created_at`, `updated_at`, `created_by`, `updated_by` on mutable tables
- Use `deleted_at` soft deletes for user-facing assets
- Keep hard deletes only for irreversible cleanup or compliance purge jobs
- Put vendor, customer, product, and order relationships in `owner_type` / `owner_id` or explicit foreign keys when the relationship is fixed

## 5. API Implementation Plan

### `POST /api/uploads`

Purpose:

- create an upload session
- validate role, tenant, file type, and size
- create `media_assets` in pending state
- return signed upload instructions

Request examples:

- multipart upload initiation
- JSON session request for a pre-known asset target

Response fields:

- `assetId`
- `bucket`
- `objectPath`
- `uploadUrl`
- `uploadHeaders`
- `expiresAt`
- `policy`

### `DELETE /api/uploads`

Purpose:

- cancel an in-progress upload session
- soft delete a pending asset
- optionally queue purge of an already uploaded object

### `GET /api/media`

Purpose:

- search and list media with cursor pagination
- filter by bucket, purpose, owner, visibility, status, tag, date, and content type
- return only metadata and signed preview URLs when allowed

### `PATCH /api/media`

Purpose:

- update labels, folder, tags, alt text, title, visibility, owner links, moderation state, and archival state
- never allow arbitrary object-path mutation without a controlled move operation

### `POST /api/media/optimize`

Purpose:

- enqueue image or video optimization jobs
- generate derivatives, thumbnails, and alternate formats
- re-run optimization on policy changes

### `POST /api/media/restore`

Purpose:

- restore a soft-deleted asset
- re-enable signed delivery
- optionally recover from the `backups` archive or cold storage snapshot

### API behavior standards

- use idempotency keys for upload creation and restore
- use cursor pagination, not offset pagination
- enforce tenant and owner checks on every call
- emit audit logs for every mutating action
- return stable error codes for validation, conflict, access denied, and retryable processing states

## 6. Security Architecture

### Access control model

- `admin_only`
- `vendor_scoped`
- `customer_owned`
- `support_scoped`
- `system_scoped`
- `public_derived`

### Signed URL model

- Generate short-lived signed URLs for private assets
- Use signed CDN URLs or signed object URLs for original/private media
- Never expose service role credentials to the browser
- Never rely on raw public object paths for sensitive buckets

### Role-based rules

- Admins can read and manage all media
- Vendors can only read/write objects within their vendor namespace
- Customers can only access their own uploads, payment proofs, and support files
- Support agents can access assigned ticket attachments only
- Marketing operators can access campaign assets but not payment proofs or vendor KYC files

### Malware and content validation

- Run content sniffing on the server before upload finalization
- Quarantine every new asset until scan completion
- Reject archives, polyglot files, and suspicious MIME mismatches
- Strip dangerous metadata from public images when policy requires it
- Re-encode images rather than trusting original client-provided encodings

### Rate limiting

Apply quotas by route and actor:

- uploads per minute
- bytes per hour
- support attachments per ticket
- payment proof uploads per order
- admin preview requests
- restore operations

### Vendor isolation

- Prefix every vendor-owned path with vendor ID
- Filter every list query by vendor ownership
- Keep vendor assets private by default
- Record vendor access in audit logs

### Admin-only buckets

- `vendor-assets` documents and KYC files
- `payment-proofs`
- `support-attachments`
- `backups`

### Compliance controls

- retention windows by bucket
- legal-hold flags for order evidence
- purge jobs for expired temporary uploads
- access logs retained for audit and fraud review

## 7. Media Optimization Architecture

### Image pipeline

```text
Upload original
-> validate
-> scan
-> extract metadata
-> generate thumbnail
-> generate small, medium, large
-> generate WebP
-> generate AVIF
-> generate JPEG fallback
-> write variants
-> mark asset ready
```

Recommended default breakpoints:

- thumbnail: 160px
- small: 480px
- medium: 960px
- large: 1600px

### Video pipeline

```text
Upload original
-> validate
-> scan
-> extract metadata
-> generate poster frame
-> transcode 360p
-> transcode 720p
-> transcode 1080p
-> optionally package HLS
-> write renditions
-> mark asset ready
```

### Delivery policy

- Serve original only when necessary
- Default storefront pages to the smallest acceptable responsive variant
- Use lazy loading for below-the-fold media
- Prefer modern formats and fall back only when the client requires it
- Keep product-card and grid thumbnails separate from PDP hero assets

### Dedupe and compression

- Use SHA-256 for exact binary dedupe
- Use perceptual hashes for near-duplicate detection
- Use metadata-aware compression policies by bucket
- Use aggressive compression for banners and CMS images, but preserve quality for product detail pages

## 8. CDN Strategy

### Global CDN

- Place a CDN in front of approved media delivery URLs
- Cache immutable variants aggressively
- Keep original private assets off the public edge unless explicitly signed

### Cache invalidation

- Variant URLs should be content-addressed or versioned by asset revision
- On a new upload version, generate new variant paths instead of overwriting old ones
- Invalidate only the changed asset family, not the whole bucket

### Image transformations

- Prefer generated variants for core commerce surfaces
- Use on-the-fly transformations only for ad hoc previews or admin tooling
- Cache transformation responses at the edge

### Responsive delivery

- Use `srcset` and `sizes`
- Map storefront surfaces to variant presets
- Choose image quality by surface, not globally

## 9. Monitoring Architecture

### Storage analytics

Track:

- assets by bucket
- total bytes stored
- new uploads per day
- variant generation success rate
- quarantine rate
- restore rate

### Bandwidth analytics

Track:

- CDN egress
- origin egress
- signed URL usage
- hot asset families
- top referrers

### Failure tracking

Track:

- upload failures
- scan failures
- transcode failures
- restore failures
- policy denials

### Media processing dashboard

Show:

- pending jobs
- jobs by status
- average processing time
- failed job reasons
- worker throughput

### Cost monitoring dashboard

Track:

- storage growth by bucket
- bandwidth growth by bucket
- most expensive asset families
- orphaned originals
- stale variants

## 10. Backup and Disaster Recovery

### Daily backups

- Backup database metadata daily
- Export asset manifests daily
- Snapshot job queues and audit logs daily

### Weekly snapshots

- Keep weekly object snapshots for recovery testing
- Retain a known-good restore package in the `backups` bucket

### Disaster recovery

- Maintain a restore procedure for metadata plus object-path mappings
- Rebuild variants from originals when possible
- Keep cross-region copies for critical buckets where business risk justifies it

### Lifecycle policies

- Move old originals to cold retention after business-defined windows
- Delete abandoned drafts and stale temp uploads automatically
- Preserve legal-evidence assets longer than ordinary customer uploads

## 11. Migration Plan From Current System

### Phase 1: Introduce the new control plane

- Create the new Postgres media tables
- Add service-layer abstractions around media upload and retrieval
- Keep the current `/api/uploads` route working behind the new adapter

### Phase 2: Dual-write metadata

- Write new media rows for all uploads
- Continue returning legacy URLs for compatibility
- Start saving checksum, owner, and variant metadata immediately

### Phase 3: Move to signed sessions

- Replace direct upload-by-byte request handling with signed upload sessions
- Require completion callbacks before assets become visible
- Queue optimization work asynchronously

### Phase 4: Backfill legacy objects

- Import all current objects from the `uploads` bucket
- Map existing path prefixes into the new bucket taxonomy
- Recompute metadata and derivatives where needed

### Phase 5: Switch reads

- Update UI and API consumers to resolve assets through media metadata, not raw paths
- Use signed URLs for private buckets
- Use variant-aware helpers for storefront delivery

### Phase 6: Retire the old model

- Freeze the old flat upload layout
- Migrate remaining references
- Enforce bucket-specific policies
- Keep a rollback window until the new pipeline proves stable

## 12. Recommended Implementation Shape in FriendlyDrop

### Current code to replace or wrap

- `app/api/uploads/route.ts`
- `lib/media.ts`
- Firestore upload metadata writes
- any direct object-path rendering in product, support, banner, and CMS components

### New platform modules

- `services/media`
- `repositories/storage`
- `repositories/postgres/media-assets`
- `workers/media-worker`
- `queues/media-jobs`
- `lib/security/signed-urls`

### Practical rule for the app

- Pages should read media metadata
- route handlers should create or update media intent
- workers should transform media
- storage should only store bytes

## Bottom Line

FriendlyDrop should move from a single-bucket upload helper to a media platform with:

- bucket isolation by business domain
- Postgres-backed asset metadata
- signed upload and delivery flows
- async variant generation
- auditability and analytics
- vendor and customer isolation
- CDN-first delivery for storefront performance

That is the architecture class you want if the goal is to operate at Shopify Plus, H&M, and Myntra scale.
