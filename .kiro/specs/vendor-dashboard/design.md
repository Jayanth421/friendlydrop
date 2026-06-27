# Professional Vendor Dashboard - Design Document

## Overview

The Vendor Dashboard is a comprehensive, multi-module platform designed for fashion vendors to manage all aspects of their business operations. This design document outlines the technical architecture, system components, data models, and implementation strategies to deliver a scalable, real-time, user-centric dashboard.

### Design Goals

1. **Scalability**: Support thousands of concurrent vendors with real-time data updates
2. **Performance**: Sub-second response times for all critical operations
3. **Reliability**: 99.9% uptime with data consistency across distributed systems
4. **Security**: Role-based access control, secure document storage, PCI-compliant payment handling
5. **Real-time Updates**: Live inventory, order, and notification management
6. **Extensibility**: Modular architecture allowing easy addition of new features
7. **Visual Richness**: Maximalist UI design with abundant information density, bold colors, intricate patterns, and ornamental elements
8. **Immersive Experience**: Engaging interface with decorative elements, layered depth, and emotional resonance

### Key Principles

- **Maximalism First**: Embrace visual abundance—rich colors, layered typography, ornamental borders, decorative icons, and pattern-based design
- **Information Density**: Present multiple data layers simultaneously with visual hierarchy through color, typography, and spacing
- **Visual Storytelling**: Use decorative elements, gradients, shadows, and animation to convey status and emotion
- **Separation of Concerns**: Clear boundaries between product, order, inventory, and financial modules with visually distinct sections
- **Event-Driven Architecture**: System events (orders, inventory changes) trigger notifications and animations
- **Data Consistency**: Strong consistency for financial transactions, eventual consistency for analytics
- **Performance First**: Caching strategies at multiple layers while optimizing animations and visual effects
- **Mobile-First Responsive Design**: Dashboard maintains maximalist aesthetic on tablets and mobile devices with adaptive layouts

---

## Architecture

### High-Level System Design

```
┌─────────────────────────────────────────────────────────────────┐
│                     VENDOR DASHBOARD (Frontend)                  │
│  React/Next.js Components with Real-time Socket.io Listeners    │
└────────────────┬────────────────────────────────────────────────┘
                 │
     ┌───────────┴──────────────┬───────────────┬──────────────┐
     │                          │               │              │
┌────▼──────────┐  ┌────────────▼──────┐  ┌────▼──────┐  ┌───▼────────┐
│ API Gateway   │  │ WebSocket Server  │  │ CDN       │  │ Auth       │
│ (Load Balancer)  │ (Socket.io)       │  │ (Images)  │  │ Service    │
└────┬──────────┘  └────────┬──────────┘  └───────────┘  └────────────┘
     │                      │
     ├──────────┬───────────┴──────────┬────────────┬──────────────┐
     │          │                      │            │              │
┌────▼──────────▼────┐  ┌─────────────▼──────┐  ┌──▼──────┐  ┌───▼─────────┐
│ Microservices      │  │ Event Bus          │  │ Cache   │  │ File Storage│
│ - Product Service  │  │ (Redis Pub/Sub)    │  │ Layer   │  │ (S3/Blob)   │
│ - Order Service    │  │                    │  │ (Redis) │  │             │
│ - Inventory Service│  │ Triggers:          │  └─────────┘  └─────────────┘
│ - Wallet Service   │  │ - Order Created    │
│ - Analytics Service│  │ - Stock Updated    │
│ - Notification Svc │  │ - Wallet Changed   │
└────┬───────────────┘  │ - Product Approved │
     │                  └────────────────────┘
     │
┌────▼────────────────────────────────┐
│ Data Layer                           │
│ - PostgreSQL (Primary)               │
│ - Elasticsearch (Search/Analytics)   │
│ - MongoDB (Document Store)           │
│ - Redis (Cache/Sessions)             │
│ - S3-Compatible (File Storage)       │
└──────────────────────────────────────┘
```

### Core Services Architecture

**1. API Gateway & Load Balancing**
- Routes requests to appropriate microservices
- Handles authentication/authorization
- Rate limiting (100 requests/second per vendor)
- Request logging and monitoring

**2. Microservices Layer**

#### Product Service
- CRUD operations for products
- Variant management (size, color, SKU)
- Bulk upload processing
- Product approval workflow
- Draft/published state management

#### Order Service
- Order creation and updates
- Status tracking and workflow
- Order details and history
- Invoice generation
- Return/exchange processing

#### Inventory Service
- Real-time stock management
- Warehouse management
- Stock reservations
- Inventory adjustments
- Low stock/out of stock alerts
- Stock history tracking

#### Wallet Service
- Balance management
- Transaction tracking
- Payout processing
- Refund handling
- Financial reporting

#### Analytics Service
- Sales metrics calculation
- Traffic analytics
- Conversion analysis
- SEO performance tracking
- Forecasting and trends

#### Notification Service
- Multi-channel delivery (in-app, email, SMS)
- Notification preferences management
- Notification history
- Alert categorization

**3. Real-time Communication**
- WebSocket server (Socket.io) for live updates
- Event broadcasting for:
  - New orders received
  - Order status changes
  - Inventory updates
  - Wallet changes
  - Notification delivery

---

## Maximalist UI Design System

### Design Philosophy

The Vendor Dashboard embraces **maximalism** as its core aesthetic. Rather than minimizing visual elements, we celebrate information abundance, rich ornamentation, and bold design choices that create an immersive, engaging experience.

**Key Maximalist Elements:**
- **Color Saturation**: Vibrant, highly saturated color palettes with bold accent colors
- **Layered Depth**: Multiple visual layers with shadows, overlays, and dimensional effects
- **Ornamental Details**: Decorative borders, patterns, icons, and flourishes throughout
- **Typography Hierarchy**: Mix of font weights, sizes, and styles to create rhythm and visual interest
- **Information Abundance**: Present all relevant data simultaneously with smart visual organization
- **Pattern & Texture**: Subtle background patterns, gradients, and textured surfaces
- **Animation & Microinteractions**: Smooth transitions, hover effects, and status animations

### Color Palette (Maximalist)

**Primary Colors:**
- **Electric Blue (#0064FF)**: Primary actions, highlights, key metrics
- **Vibrant Purple (#7C3AED)**: Secondary actions, analytics, insights
- **Coral Red (#FF6B6B)**: Alerts, critical status, urgent actions
- **Emerald Green (#10B981)**: Success, positive actions, delivered orders

**Accent Colors:**
- **Golden Yellow (#FCD34D)**: Warnings, pending states, special offers
- **Deep Orange (#F97316)**: Processing, active workflows
- **Teal (#14B8A6)**: Completed, shipped, delivered states
- **Rose Pink (#EC4899)**: New items, trending, featured products

**Neutral Palette (Rich Grays):**
- **Deep Navy (#0F172A)**: Backgrounds, text
- **Charcoal (#334155)**: Secondary text
- **Light Slate (#E2E8F0)**: Borders, dividers
- **Off-White (#F8FAFC)**: Card backgrounds

**Status Colors:**
- **Success**: Emerald Green (#10B981)
- **Error**: Coral Red (#FF6B6B)
- **Warning**: Golden Yellow (#FCD34D)
- **Info**: Electric Blue (#0064FF)

### Typography System

**Font Stack**: Inter (modern sans-serif) + Poppins (bold headings) + Playfair Display (premium accents)

**Heading Hierarchy:**
- **H1 (36px, Playfair Display)**: Page titles with ornamental underline
- **H2 (28px, Poppins Bold)**: Section headers with accent color
- **H3 (24px, Poppins SemiBold)**: Subsection headers
- **H4 (20px, Poppins Medium)**: Card titles with icon decoration
- **H5 (16px, Poppins Medium)**: Widget titles

**Body Text:**
- **Body Large (16px, Inter Regular)**: Primary content
- **Body Medium (14px, Inter Regular)**: Secondary content
- **Body Small (12px, Inter Regular)**: Captions and metadata

**Special Styles:**
- **Accent Text (14px, Poppins SemiBold)**: Important metrics, badges
- **Monospace (13px, JetBrains Mono)**: SKU, order IDs, codes

### Component Design Patterns (Maximalist)

#### Metrics Cards
**Style**: Vibrant gradient backgrounds with ornamental corners, layered shadows, animated icons

```
┌─ [✨ Premium Icon] ─────────────────────────┐
│                                             │
│  Total Revenue                              │
│  ₹1,24,560                                  │
│  ↑ 23.5% from last month                   │
│                                             │
│  [━━ Subtle pattern overlay ━━]            │
└─────────────────────────────────────────────┘
```

**Features:**
- Full gradient background (e.g., Electric Blue to Purple)
- Decorative corner elements (✦ ✦)
- Icon with subtle glow effect
- Trending indicator with animated arrow
- Subtle pattern overlay in lower section
- Hover effect: Lift up with enhanced shadow, icon rotation

#### Status Badges
**Style**: Ornate badges with circular backgrounds, icon indicators, animated pulses

```
🟢 Delivered  |  🟡 Pending  |  🔴 Critical  |  ⚪ Processing
```

**Features:**
- Animated pulse for active states
- Ornamental circular background
- Readable text label
- Color-coded for immediate recognition
- Glow effect on hover

#### Data Tables
**Style**: Rich, layered tables with alternating row patterns, column decorations

```
┌────────────┬─────────────┬──────────────┬──────────────┐
│ Order ID   │ Customer    │ Amount       │ Status       │
├────────────┼─────────────┼──────────────┼──────────────┤
│ #ORD-2024  │ Raj Kumar   │ ₹5,600       │ 🟢 Delivered │
│            │             │              │              │
│ #ORD-2023  │ Sarah A.    │ ₹3,200       │ 🟡 Shipped   │
├────────────┼─────────────┼──────────────┼──────────────┤
│ Column Total│ Items: 156  │ ₹89,234      │             │
└────────────┴─────────────┴──────────────┴──────────────┘
```

**Features:**
- Alternating row background colors with subtle patterns
- Ornamental column separators
- Color-coded status indicators
- Row hover effect with background lift
- Column totals/summary row at bottom
- Expandable rows for details with smooth animation

#### Charts & Graphs
**Style**: Vibrant multi-layer charts with gradient fills, ornamental axes, animated data points

```
Revenue Trend (Q4 2024)
₹
│
│      ╱╲    ╱╲
│    ╱    ╲╱    ╲     [Legend]
│  ╱╱           ╲╲    ━━ Completed
│╱╱               ╲╲  ━━ Processing
└─────────────────────
  Week 1  2  3  4
```

**Features:**
- Gradient fill under lines (multiple colors)
- Animated data points with glow
- Interactive tooltips on hover
- Legend with color-coded items
- Ornamental axis lines and gridlines
- Smooth animation on data updates

#### Forms & Input Fields
**Style**: Ornate input fields with floating labels, icon decorations, animated focus states

```
[▲ Store Name] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Floating Label     Input Field
                      (Animated underline on focus)
```

**Features:**
- Floating labels that animate upward on focus
- Animated underline (colored) on focus
- Icon indicators for field type
- Error state with animated shake
- Success checkmark with fade-in animation
- Helper text in smaller, muted font

### Layout Structure (Maximalist)

#### Dashboard Layout
```
┌────────────────────────────────────────────────────────────┐
│                     TOP BAR (Premium Navigation)            │
│  🏪 Store Logo  |  Search  |  Notifications  |  Profile    │
├──────────┬──────────────────────────────────────────────────┤
│          │                                                  │
│ SIDEBAR  │          MAIN CONTENT AREA                      │
│ (Rich    │                                                  │
│ Colors   │  ┌─────────────┬──────────────┬──────────────┐ │
│ & Icons) │  │ Metrics 1   │ Metrics 2    │ Metrics 3    │ │
│          │  └─────────────┴──────────────┴──────────────┘ │
│          │                                                  │
│          │  ┌─────────────────────────────────────────────┐ │
│          │  │ Sales Chart (Gradient + Animated)          │ │
│          │  └─────────────────────────────────────────────┘ │
│          │                                                  │
│          │  ┌──────────────────┬──────────────────────────┐ │
│          │  │ Recent Orders    │ Activity Feed           │ │
│          │  │ (Ornate Table)   │ (Timeline View)         │ │
│          │  └──────────────────┴──────────────────────────┘ │
│          │                                                  │
└──────────┴──────────────────────────────────────────────────┘
```

#### Sidebar Navigation
**Style**: Rich background with ornamental elements, color-coded sections

```
┌─────────────────────┐
│  🏪 My Store        │
│  Raj's Fashion Hub  │
│  ━━━━━━━━━━━━━━━━  │
│                     │
│  📊 Dashboard       │ (Active: Highlight)
│  📦 Products        │
│  📋 Orders          │
│  📦 Inventory       │
│  ━━━━━━━━━━━━━━━━  │
│  💰 Wallet          │
│  📊 Analytics       │
│  ━━━━━━━━━━━━━━━━  │
│  👥 Customers       │
│  🔔 Notifications   │
│  ⚙️  Settings       │
│                     │
└─────────────────────┘
```

**Features:**
- Ornamental dividers (━━━) between sections
- Color-coded icon indicators
- Active section highlight with accent color and decorative bar
- Hover effect with background color and icon animation
- Section badges (e.g., "2" for 2 pending items)
- Bottom section with expanded options on hover

#### Cards & Containers
**Style**: Layered containers with shadows, borders, and decorative corner accents

```
┌─✦─────────────────────────────────✦─┐
│ Product Performance                   │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                      │
│ Details with multiple data layers   │
│ [Decorative pattern underlay]        │
│                                      │
└─✦─────────────────────────────────✦─┘
```

**Features:**
- Multiple shadow layers for depth (dark + light)
- Ornamental corner decorations (✦ or similar)
- Decorative divider line between header and content
- Subtle pattern or gradient underlay
- Color-coded left or top border accent
- Hover effect: Lift up, enhance shadow, icon animation

### Alert & Notification Design

#### Toast Notifications
**Style**: Animated toasts with icons, colors, and dismiss actions

```
🟢 Success!
✓ Product published successfully
[━━━━━━━━━━━] (progress bar)
```

**Features:**
- Color-coded background (green/red/yellow)
- Animated slide-in from top/bottom
- Icon with subtle animation
- Progress bar showing auto-dismiss timer
- Dismiss button with hover effect
- Sound notification option for critical alerts

#### Alert Boxes (Inline)
**Style**: Ornate alert containers with left accent bar

```
┃ ⚠️  Warning
┃ Stock of "Summer Dress - Red - M" is running low (5 units)
┃ [Restock Now] [Dismiss]
```

**Features:**
- Left colored bar matching alert type
- Icon and bold title
- Detailed message
- Action buttons with hover effects
- Dismiss option with smooth fade-out

### Animations & Microinteractions

**Loading States:**
- Animated skeleton screens with shimmer effect
- Rotating spinner with decorative elements
- Progress indicators with percentage text

**Transitions:**
- Page transitions: Fade in from top with subtle scale
- Card hovers: Lift up (translateY), shadow enhancement
- Status changes: Smooth color transitions with scale animation

**Real-Time Updates:**
- New order notification: Toast slide-in + bell ring animation
- Inventory update: Highlight flash (yellow → normal)
- Stock alert: Pulse effect on low-stock item

### Responsive Maximalism

**Desktop (1920px+):**
- Full 4-column layout for metrics
- Large charts with detailed information
- Rich sidebar always visible
- Multiple panels visible simultaneously

**Laptop (1366px):**
- 3-column layout for metrics
- Standard charts
- Collapsible sidebar option
- 2-3 panels visible

**Tablet (768px):**
- 2-column layout for metrics
- Compact charts (scrollable if needed)
- Collapsible sidebar (hamburger menu)
- Stacked panels, scroll vertically

**Mobile (375px):**
- 1-column layout for metrics
- Simplified charts (show key data)
- Bottom tab navigation for sections
- Single panel view, swipe navigation
- Optimized touch targets (minimum 44px)

## Components and Interfaces

### Frontend Component Hierarchy

```
App/
├── Layout/
│   ├── Sidebar (Navigation)
│   ├── TopBar (Header with Notifications)
│   └── MainContent
├── Dashboard/
│   ├── MetricsCards (Summary)
│   ├── SalesChart (Chart.js)
│   ├── RecentOrders (Table)
│   └── ActivityFeed
├── Products/
│   ├── ProductList (Table)
│   ├── ProductForm (Create/Edit)
│   ├── VariantManager
│   ├── BulkUpload
│   └── ProductPreview
├── Inventory/
│   ├── StockTable
│   ├── InventoryAdjustment
│   ├── LowStockAlerts
│   └── WarehouseManager
├── Orders/
│   ├── OrderList (Filterable)
│   ├── OrderDetails
│   ├── InvoiceGenerator
│   ├── ShippingLabel
│   └── TrackingUpdates
├── Wallet/
│   ├── BalanceCard
│   ├── TransactionHistory
│   ├── WithdrawalForm
│   └── PayoutHistory
├── Customers/
│   ├── CustomerList
│   ├── CustomerDetails
│   ├── MessageComposer
│   └── QAManager
├── Returns/
│   ├── ReturnsList
│   ├── ExchangesList
│   └── RefundHistory
├── Analytics/
│   ├── SalesAnalytics
│   ├── TrafficAnalytics
│   ├── ConversionAnalytics
│   └── SEOAnalytics
├── Notifications/
│   ├── NotificationCenter
│   ├── PreferenceSettings
│   └── NotificationHistory
├── Settings/
│   ├── ProfileSettings
│   ├── StoreCustomization
│   ├── ShippingConfiguration
│   └── SocialLinks
└── KYC/
    ├── DocumentChecklist
    ├── DocumentUpload
    └── VerificationStatus
```

### API Endpoints Design

#### Product Service Endpoints
```
POST   /api/v1/products                          # Create product (draft)
GET    /api/v1/products                          # List products with filters
GET    /api/v1/products/{id}                     # Get product details
PUT    /api/v1/products/{id}                     # Update product
DELETE /api/v1/products/{id}                     # Delete product
POST   /api/v1/products/{id}/publish             # Submit for approval
POST   /api/v1/products/{id}/unpublish           # Unpublish product
POST   /api/v1/products/{id}/duplicate           # Duplicate product
GET    /api/v1/products/{id}/preview             # Preview product
POST   /api/v1/products/bulk-upload              # Bulk product import
GET    /api/v1/products/bulk-upload/{jobId}     # Get bulk upload status
```

#### Inventory Service Endpoints
```
GET    /api/v1/inventory                         # List all stock
GET    /api/v1/inventory/sku/{sku}               # Get specific SKU
PUT    /api/v1/inventory/sku/{sku}               # Update stock
POST   /api/v1/inventory/adjust                  # Adjust inventory
POST   /api/v1/inventory/bulk-adjust             # Bulk inventory adjustment
GET    /api/v1/inventory/history                 # Stock change history
GET    /api/v1/inventory/low-stock               # Low stock alerts
GET    /api/v1/inventory/warehouses              # List warehouses
```

#### Order Service Endpoints
```
GET    /api/v1/orders                            # List orders
GET    /api/v1/orders/{id}                       # Get order details
PATCH  /api/v1/orders/{id}/status                # Update order status
GET    /api/v1/orders/{id}/invoice               # Generate invoice
POST   /api/v1/orders/{id}/shipping-label        # Generate shipping label
POST   /api/v1/orders/{id}/tracking              # Update tracking number
GET    /api/v1/orders/{id}/timeline              # Get order timeline
```

#### Wallet Service Endpoints
```
GET    /api/v1/wallet/balance                    # Get balance
GET    /api/v1/wallet/transactions               # Transaction history
POST   /api/v1/wallet/withdraw                   # Request withdrawal
GET    /api/v1/wallet/payouts                    # Payout history
GET    /api/v1/wallet/statement                  # Download statement (PDF)
```

#### Analytics Service Endpoints
```
GET    /api/v1/analytics/dashboard               # Dashboard metrics
GET    /api/v1/analytics/sales                   # Sales analytics
GET    /api/v1/analytics/traffic                 # Traffic analytics
GET    /api/v1/analytics/products                # Product performance
GET    /api/v1/analytics/customers               # Customer analytics
GET    /api/v1/analytics/keywords                # SEO keywords
GET    /api/v1/analytics/forecast                # Sales forecast
```

#### Notification Service Endpoints
```
GET    /api/v1/notifications                     # List notifications
PUT    /api/v1/notifications/{id}/read           # Mark as read
DELETE /api/v1/notifications/{id}                # Archive notification
GET    /api/v1/notifications/preferences         # Get preferences
PUT    /api/v1/notifications/preferences         # Update preferences
```

---

## Data Models and Database Schema

### Core Entities

#### 1. Vendor Profile
```sql
CREATE TABLE vendor_profiles (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  business_name VARCHAR(255) NOT NULL,
  gst_number VARCHAR(20),
  pan_number VARCHAR(20),
  store_name VARCHAR(255),
  store_logo_url VARCHAR(500),
  store_banner_url VARCHAR(500),
  store_description TEXT,
  contact_email VARCHAR(255),
  contact_phone VARCHAR(20),
  business_hours JSONB, -- {"monday": {"open": "09:00", "close": "21:00"}, ...}
  store_policies JSONB, -- {return_policy, refund_policy, shipping_policy, ...}
  kyc_status ENUM('incomplete', 'submitted', 'verified', 'failed'),
  kyc_submission_date TIMESTAMP,
  verification_status ENUM('pending', 'approved', 'rejected'),
  social_links JSONB, -- {instagram, facebook, twitter, youtube, ...}
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

#### 2. Products
```sql
CREATE TABLE products (
  id UUID PRIMARY KEY,
  vendor_id UUID NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category_id UUID,
  sub_category_id UUID,
  brand_id UUID,
  status ENUM('draft', 'pending_approval', 'approved', 'published', 'modified', 'unpublished', 'archived'),
  original_product_id UUID, -- For modified versions, reference original
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  published_at TIMESTAMP,
  approval_date TIMESTAMP,
  rejection_reason TEXT,
  FOREIGN KEY (vendor_id) REFERENCES vendor_profiles(id),
  INDEX idx_vendor_id (vendor_id),
  INDEX idx_status (status)
);

CREATE TABLE product_variants (
  id UUID PRIMARY KEY,
  product_id UUID NOT NULL,
  color VARCHAR(100),
  size VARCHAR(50),
  sku VARCHAR(100) NOT NULL UNIQUE,
  regular_price DECIMAL(10, 2),
  sale_price DECIMAL(10, 2),
  stock_quantity INT DEFAULT 0,
  reserved_quantity INT DEFAULT 0,
  reorder_threshold INT DEFAULT 10,
  barcode VARCHAR(100),
  created_at TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id),
  INDEX idx_sku (sku),
  INDEX idx_product_id (product_id)
);

CREATE TABLE product_images (
  id UUID PRIMARY KEY,
  product_id UUID NOT NULL,
  image_url VARCHAR(500),
  thumbnail_url VARCHAR(500),
  medium_url VARCHAR(500),
  display_order INT,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id)
);

CREATE TABLE product_videos (
  id UUID PRIMARY KEY,
  product_id UUID NOT NULL,
  video_url VARCHAR(500),
  thumbnail_url VARCHAR(500),
  duration_seconds INT,
  resolution VARCHAR(50), -- "1080p", "720p", etc.
  created_at TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id)
);

CREATE TABLE product_seo (
  id UUID PRIMARY KEY,
  product_id UUID NOT NULL UNIQUE,
  meta_title VARCHAR(255),
  meta_description VARCHAR(500),
  url_slug VARCHAR(255) UNIQUE,
  keywords TEXT[], -- Array of keywords
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id)
);

CREATE TABLE product_tags (
  id UUID PRIMARY KEY,
  product_id UUID NOT NULL,
  tag_name VARCHAR(100),
  created_at TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id),
  INDEX idx_product_tags (product_id, tag_name)
);
```

#### 3. Inventory Management
```sql
CREATE TABLE warehouses (
  id UUID PRIMARY KEY,
  vendor_id UUID NOT NULL,
  name VARCHAR(255),
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(100),
  postal_code VARCHAR(20),
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP,
  FOREIGN KEY (vendor_id) REFERENCES vendor_profiles(id)
);

CREATE TABLE inventory_transactions (
  id UUID PRIMARY KEY,
  sku VARCHAR(100) NOT NULL,
  warehouse_id UUID,
  quantity_change INT,
  transaction_type ENUM('order_placed', 'order_shipped', 'order_cancelled', 
                         'receipt', 'adjustment', 'damage', 'theft', 'reconciliation'),
  reference_id VARCHAR(100), -- Order ID, adjustment ID, etc.
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMP,
  FOREIGN KEY (sku) REFERENCES product_variants(sku),
  INDEX idx_sku_date (sku, created_at)
);

CREATE TABLE inventory_adjustments (
  id UUID PRIMARY KEY,
  vendor_id UUID NOT NULL,
  sku VARCHAR(100),
  adjustment_quantity INT,
  adjustment_reason ENUM('receipt', 'damage', 'theft', 'reconciliation'),
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMP,
  FOREIGN KEY (vendor_id) REFERENCES vendor_profiles(id),
  FOREIGN KEY (sku) REFERENCES product_variants(sku)
);
```

#### 4. Orders
```sql
CREATE TABLE orders (
  id UUID PRIMARY KEY,
  order_number VARCHAR(50) UNIQUE,
  vendor_id UUID NOT NULL,
  customer_id UUID,
  customer_name VARCHAR(255),
  customer_email VARCHAR(255),
  customer_phone VARCHAR(20),
  status ENUM('new', 'accepted', 'processing', 'packed', 'ready_to_ship', 
               'shipped', 'delivered', 'cancelled', 'failed', 'returned'),
  subtotal DECIMAL(12, 2),
  shipping_charge DECIMAL(10, 2),
  tax_amount DECIMAL(10, 2),
  discount_amount DECIMAL(10, 2),
  total_amount DECIMAL(12, 2),
  payment_status ENUM('pending', 'completed', 'failed'),
  payment_method VARCHAR(50),
  notes TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  shipped_at TIMESTAMP,
  delivered_at TIMESTAMP,
  FOREIGN KEY (vendor_id) REFERENCES vendor_profiles(id),
  INDEX idx_vendor_date (vendor_id, created_at),
  INDEX idx_status (status)
);

CREATE TABLE order_items (
  id UUID PRIMARY KEY,
  order_id UUID NOT NULL,
  product_id UUID,
  variant_id UUID,
  sku VARCHAR(100),
  product_name VARCHAR(255),
  quantity INT,
  unit_price DECIMAL(10, 2),
  tax_per_item DECIMAL(10, 2),
  FOREIGN KEY (order_id) REFERENCES orders(id),
  FOREIGN KEY (product_id) REFERENCES products(id),
  FOREIGN KEY (variant_id) REFERENCES product_variants(id)
);

CREATE TABLE order_shipping (
  id UUID PRIMARY KEY,
  order_id UUID NOT NULL UNIQUE,
  shipping_address_line1 VARCHAR(255),
  shipping_address_line2 VARCHAR(255),
  city VARCHAR(100),
  state VARCHAR(100),
  postal_code VARCHAR(20),
  country VARCHAR(100),
  courier_name VARCHAR(100),
  tracking_number VARCHAR(100),
  shipping_label_url VARCHAR(500),
  estimated_delivery_date DATE,
  actual_delivery_date DATE,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id)
);

CREATE TABLE order_timeline (
  id UUID PRIMARY KEY,
  order_id UUID NOT NULL,
  status ENUM('new', 'accepted', 'processing', 'packed', 'ready_to_ship', 
               'shipped', 'delivered', 'cancelled', 'returned'),
  timestamp TIMESTAMP,
  notes TEXT,
  FOREIGN KEY (order_id) REFERENCES orders(id),
  INDEX idx_order_timeline (order_id, timestamp)
);
```

#### 5. Wallet and Financials
```sql
CREATE TABLE vendor_wallet (
  id UUID PRIMARY KEY,
  vendor_id UUID NOT NULL UNIQUE,
  balance DECIMAL(15, 2) DEFAULT 0,
  total_earnings DECIMAL(15, 2) DEFAULT 0,
  pending_payouts DECIMAL(15, 2) DEFAULT 0,
  last_updated TIMESTAMP,
  FOREIGN KEY (vendor_id) REFERENCES vendor_profiles(id)
);

CREATE TABLE wallet_transactions (
  id UUID PRIMARY KEY,
  vendor_id UUID NOT NULL,
  transaction_type ENUM('order_delivered', 'refund_processed', 'payout_withdrawal', 
                        'commission_charged', 'manual_adjustment'),
  amount DECIMAL(15, 2),
  description TEXT,
  reference_id VARCHAR(100), -- Order ID, payout ID, etc.
  running_balance DECIMAL(15, 2),
  created_at TIMESTAMP,
  FOREIGN KEY (vendor_id) REFERENCES vendor_profiles(id),
  INDEX idx_vendor_date (vendor_id, created_at)
);

CREATE TABLE payouts (
  id UUID PRIMARY KEY,
  payout_number VARCHAR(50) UNIQUE,
  vendor_id UUID NOT NULL,
  amount DECIMAL(15, 2),
  status ENUM('awaiting_cycle', 'processing', 'completed', 'failed'),
  requested_at TIMESTAMP,
  processing_started_at TIMESTAMP,
  completed_at TIMESTAMP,
  bank_account_id UUID,
  failure_reason TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  FOREIGN KEY (vendor_id) REFERENCES vendor_profiles(id),
  INDEX idx_vendor_status (vendor_id, status)
);

CREATE TABLE bank_accounts (
  id UUID PRIMARY KEY,
  vendor_id UUID NOT NULL,
  account_holder_name VARCHAR(255),
  account_number VARCHAR(50),
  ifsc_code VARCHAR(20),
  bank_name VARCHAR(255),
  is_verified BOOLEAN DEFAULT false,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP,
  FOREIGN KEY (vendor_id) REFERENCES vendor_profiles(id)
);
```

#### 6. Returns and Refunds
```sql
CREATE TABLE returns (
  id UUID PRIMARY KEY,
  return_number VARCHAR(50) UNIQUE,
  order_id UUID NOT NULL,
  vendor_id UUID NOT NULL,
  reason VARCHAR(255),
  status ENUM('new', 'approved', 'rejected', 'received', 'refund_processed', 'completed'),
  reason_detail TEXT,
  approval_date TIMESTAMP,
  received_date TIMESTAMP,
  refund_processed_date TIMESTAMP,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id),
  FOREIGN KEY (vendor_id) REFERENCES vendor_profiles(id)
);

CREATE TABLE exchanges (
  id UUID PRIMARY KEY,
  exchange_number VARCHAR(50) UNIQUE,
  order_id UUID NOT NULL,
  vendor_id UUID NOT NULL,
  original_variant_id UUID,
  requested_variant_id UUID,
  status ENUM('pending', 'approved', 'rejected', 'received', 'shipped', 'completed'),
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id),
  FOREIGN KEY (vendor_id) REFERENCES vendor_profiles(id),
  FOREIGN KEY (original_variant_id) REFERENCES product_variants(id),
  FOREIGN KEY (requested_variant_id) REFERENCES product_variants(id)
);
```

#### 7. Customer Management
```sql
CREATE TABLE vendor_customers (
  id UUID PRIMARY KEY,
  vendor_id UUID NOT NULL,
  customer_id UUID,
  customer_name VARCHAR(255),
  customer_email VARCHAR(255),
  customer_phone VARCHAR(20),
  total_orders INT DEFAULT 0,
  total_spent DECIMAL(15, 2) DEFAULT 0,
  last_purchase_date DATE,
  created_at TIMESTAMP,
  FOREIGN KEY (vendor_id) REFERENCES vendor_profiles(id),
  UNIQUE(vendor_id, customer_id),
  INDEX idx_vendor_customer (vendor_id, total_spent)
);

CREATE TABLE customer_messages (
  id UUID PRIMARY KEY,
  vendor_id UUID NOT NULL,
  customer_id UUID,
  message_text TEXT,
  created_at TIMESTAMP,
  FOREIGN KEY (vendor_id) REFERENCES vendor_profiles(id),
  INDEX idx_vendor_date (vendor_id, created_at)
);

CREATE TABLE product_questions (
  id UUID PRIMARY KEY,
  product_id UUID NOT NULL,
  vendor_id UUID NOT NULL,
  customer_id UUID,
  question TEXT,
  answer TEXT,
  question_date TIMESTAMP,
  answer_date TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id),
  FOREIGN KEY (vendor_id) REFERENCES vendor_profiles(id)
);

CREATE TABLE product_reviews (
  id UUID PRIMARY KEY,
  product_id UUID NOT NULL,
  vendor_id UUID NOT NULL,
  customer_id UUID,
  rating INT, -- 1-5 stars
  review_text TEXT,
  review_date TIMESTAMP,
  vendor_reply TEXT,
  vendor_reply_date TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id),
  FOREIGN KEY (vendor_id) REFERENCES vendor_profiles(id),
  INDEX idx_product_vendor (product_id, vendor_id)
);
```

#### 8. Promotions and Coupons
```sql
CREATE TABLE coupons (
  id UUID PRIMARY KEY,
  coupon_code VARCHAR(50) UNIQUE NOT NULL,
  vendor_id UUID NOT NULL,
  coupon_name VARCHAR(255),
  discount_type ENUM('percentage', 'flat_amount', 'free_shipping', 'bogo', 'bundle'),
  discount_value DECIMAL(10, 2),
  minimum_purchase_amount DECIMAL(10, 2),
  maximum_uses INT,
  current_uses INT DEFAULT 0,
  expiry_date DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP,
  FOREIGN KEY (vendor_id) REFERENCES vendor_profiles(id)
);

CREATE TABLE coupon_applicable_products (
  coupon_id UUID NOT NULL,
  product_id UUID NOT NULL,
  FOREIGN KEY (coupon_id) REFERENCES coupons(id),
  FOREIGN KEY (product_id) REFERENCES products(id),
  PRIMARY KEY(coupon_id, product_id)
);
```

#### 9. Analytics and Tracking
```sql
CREATE TABLE sales_metrics (
  id UUID PRIMARY KEY,
  vendor_id UUID NOT NULL,
  metric_date DATE,
  total_revenue DECIMAL(15, 2),
  total_orders INT,
  average_order_value DECIMAL(10, 2),
  units_sold INT,
  created_at TIMESTAMP,
  FOREIGN KEY (vendor_id) REFERENCES vendor_profiles(id),
  UNIQUE(vendor_id, metric_date)
);

CREATE TABLE traffic_metrics (
  id UUID PRIMARY KEY,
  vendor_id UUID NOT NULL,
  metric_date DATE,
  visitor_count INT,
  product_views INT,
  add_to_cart_count INT,
  checkout_initiated INT,
  orders_completed INT,
  traffic_source VARCHAR(50), -- 'search', 'category', 'direct', 'social'
  bounce_rate DECIMAL(5, 2),
  avg_session_duration_seconds INT,
  FOREIGN KEY (vendor_id) REFERENCES vendor_profiles(id),
  INDEX idx_vendor_date (vendor_id, metric_date)
);

CREATE TABLE search_keywords (
  id UUID PRIMARY KEY,
  vendor_id UUID NOT NULL,
  keyword VARCHAR(255),
  search_volume INT,
  impressions INT,
  clicks INT,
  conversions INT,
  ctr DECIMAL(5, 2),
  avg_position DECIMAL(5, 2),
  tracked_date DATE,
  FOREIGN KEY (vendor_id) REFERENCES vendor_profiles(id),
  INDEX idx_keyword (vendor_id, keyword, tracked_date)
);
```

#### 10. Notifications
```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY,
  vendor_id UUID NOT NULL,
  notification_type ENUM('new_order', 'order_update', 'low_stock', 'out_of_stock',
                         'product_approval', 'return_request', 'refund_request',
                         'customer_message', 'wallet_update', 'system_announcement'),
  title VARCHAR(255),
  message TEXT,
  reference_id VARCHAR(100), -- Order ID, product ID, etc.
  is_read BOOLEAN DEFAULT false,
  is_archived BOOLEAN DEFAULT false,
  created_at TIMESTAMP,
  read_at TIMESTAMP,
  FOREIGN KEY (vendor_id) REFERENCES vendor_profiles(id),
  INDEX idx_vendor_read (vendor_id, is_read, created_at)
);

CREATE TABLE notification_preferences (
  id UUID PRIMARY KEY,
  vendor_id UUID NOT NULL UNIQUE,
  notification_type VARCHAR(50),
  delivery_method ENUM('in_app', 'email', 'sms', 'in_app_email', 'in_app_sms', 'all'),
  is_enabled BOOLEAN DEFAULT true,
  FOREIGN KEY (vendor_id) REFERENCES vendor_profiles(id)
);
```

---

## Real-Time Data Refresh Mechanisms

### 1. WebSocket Communication (Socket.io)

**Connection Flow:**
- Vendor logs in → Auth token verified → WebSocket connection established
- Client joins vendor-specific rooms: `/vendor/{vendor_id}`, `/vendor/{vendor_id}/orders`, `/vendor/{vendor_id}/inventory`

**Events Emitted by Server:**

```javascript
// Order events
socket.emit('order:new', {order_id, customer_name, total_amount});
socket.emit('order:status_changed', {order_id, old_status, new_status, timestamp});
socket.emit('order:delivered', {order_id, reward_points});

// Inventory events
socket.emit('inventory:updated', {sku, new_quantity, warehouse_id});
socket.emit('inventory:low_stock', {product_name, current_stock, threshold});
socket.emit('inventory:out_of_stock', {product_id, sku});

// Wallet events
socket.emit('wallet:balance_updated', {new_balance, transaction_type});

// Notification events
socket.emit('notification:new', {notification_id, type, title, message});

// Analytics events (every 5 minutes)
socket.emit('metrics:updated', {revenue, active_orders, total_customers});
```

### 2. Dashboard Refresh Strategy

**5-Minute Refresh Cycle:**
- Server calculates aggregated metrics every 5 minutes
- Pushes updated metrics to connected vendors via Socket.io
- Client updates dashboard UI without page reload
- Queries are cached using Redis with TTL of 4 minutes

**Implementation Details:**
```
1. Scheduled Job (every 5 minutes):
   - Calculate total revenue (current month)
   - Count active orders
   - Count total customers
   - Calculate store performance score
   - Push to Redis cache
   - Broadcast to all connected vendors

2. Client Implementation:
   - Listen for 'metrics:updated' event
   - Update relevant metric cards smoothly (CSS transitions)
   - Cache latest values in React state
   - If disconnected, auto-refresh on reconnect
```

### 3. Real-Time vs Cached Data Strategy

| Feature | Update Frequency | Source | Rationale |
|---------|------------------|--------|-----------|
| Dashboard Summary | 5 min | WebSocket | Fast aggregation |
| Recent Orders | On creation | WebSocket | Immediate feedback |
| Inventory Level | On order place/ship | WebSocket | Critical for accuracy |
| Wallet Balance | After order delivered | WebSocket | Financial accuracy |
| Analytics Charts | 1 hour | REST API | Heavy computation |
| Product List | 30 seconds (polling) | REST API | Background update |
| Customer Data | 1 hour | REST API | Low frequency change |

### 4. Offline Fallback

When WebSocket disconnects:
- Client attempts reconnection with exponential backoff (max 10 attempts)
- Falls back to 30-second polling for critical data (orders, inventory)
- Queues user actions (status updates) locally
- Syncs when connection restored

---

## File Upload and Storage Architecture

### 1. Product Images and Videos

**Image Upload Flow:**
```
Client Upload → API Gateway → Multer Middleware → Sharp Image Processor
                                                         ↓
                                            (Resize & Optimize)
                                                         ↓
                                    S3/Azure Blob Upload
                                                         ↓
                                    Return: Primary, Thumbnail, Medium, Large URLs
```

**Image Processing Pipeline:**
- Validate: JPG, PNG, WebP formats, max 5MB
- Generate sizes:
  - Thumbnail: 300x300 (for lists)
  - Medium: 500x500 (for product detail)
  - Large: 1200x1200 (for fullscreen view)
  - WebP: Lossy compression for all sizes
- Store metadata: Upload date, original filename, file size, dimensions

**Video Upload Flow:**
```
File Upload → Validation → Media Server → Transcode → Thumbnail Generation
                                                              ↓
                                              Store in S3, metadata in DB
```

**Video Processing:**
- Validate: MP4, WebM, MOV formats, max 50MB
- Extract: Duration, resolution, fps
- Generate: Thumbnail at 00:05 mark
- Store playback URLs in CDN

### 2. Document Storage (KYC, Invoices)

**KYC Documents:**
- Vendor-specific bucket: `/kyc/{vendor_id}/{document_type}`
- Encryption at rest: AES-256
- Access: Restricted to vendor + admin
- Retention: 7 years (compliance)
- Audit logging: All access logged

**Invoice PDFs:**
- Path: `/invoices/{vendor_id}/{year}/{month}/{invoice_number}.pdf`
- Generation: On-demand, cached for 24 hours
- Retention: 7 years

### 3. Bulk Upload Files

- Path: `/bulk-uploads/{vendor_id}/{job_id}/{filename}`
- Max size: 50MB
- Formats: CSV, XLSX
- Processing: Asynchronous job queue
- Retention: 7 days (for reference)

### 4. Storage Architecture

**Cloud Storage Configuration:**
```
S3 / Azure Blob Storage
├── /products/{vendor_id}/
│   ├── /images/{product_id}/{variant_id}/{size}/
│   │   ├── original.jpg
│   │   ├── thumbnail.webp
│   │   ├── medium.webp
│   │   └── large.webp
│   └── /videos/{product_id}/{video_id}/
│       ├── video.mp4
│       ├── thumbnail.jpg
│       └── metadata.json
├── /kyc/{vendor_id}/
│   ├── gst_certificate.pdf
│   ├── pan_card.jpg
│   └── bank_statement.pdf
├── /invoices/{vendor_id}/{year}/{month}/
│   └── INV-{number}.pdf
└── /bulk-uploads/{vendor_id}/{job_id}/
    ├── upload.csv
    └── processing_report.json
```

---

## Notification System Design

### 1. Notification Categories and Triggers

| Category | Trigger | Channels | Priority |
|----------|---------|----------|----------|
| **New Orders** | Order placed | In-app, Email, SMS | Critical |
| **Order Status** | Status changed | In-app, Email | High |
| **Low Stock** | Stock < threshold | In-app, Email | High |
| **Out of Stock** | Stock = 0 | In-app, Email, SMS | Critical |
| **Product Approval** | Admin approves/rejects | In-app, Email | High |
| **Return Request** | Customer initiates return | In-app, Email | High |
| **Refund Request** | Refund processed | In-app, Email | High |
| **Customer Message** | Customer questions | In-app, Email | Medium |
| **Wallet Update** | Balance changes | In-app, Email | Medium |
| **System Announcement** | Platform updates | In-app | Low |

### 2. Multi-Channel Delivery

**In-App Notifications:**
- Real-time via WebSocket
- Stored in database
- Persistent notification center
- Bell icon with unread count
- Archive/dismiss functionality

**Email Notifications:**
- Async delivery via email queue (Bull/RabbitMQ)
- HTML templates with branding
- Unsubscribe links
- 24-hour retry on failure

**SMS Notifications:**
- Critical alerts only (order, out-of-stock)
- Twilio integration
- Opt-in requirement
- Rate limited (max 5 per day)

### 3. Notification Preference Management

**Vendor Settings:**
```
Notification Type | In-App | Email | SMS | Enabled
──────────────────┼────────┼───────┼─────┼─────────
New Orders        | ☑      | ☑     | ☑   | ☑
Order Updates     | ☑      | ☑     | ☐   | ☑
Low Stock         | ☑      | ☑     | ☐   | ☑
Out of Stock      | ☑      | ☑     | ☑   | ☑
Product Approval  | ☑      | ☑     | ☐   | ☑
Returns/Refunds   | ☑      | ☑     | ☐   | ☑
Messages          | ☑      | ☑     | ☐   | ☑
Wallet Updates    | ☑      | ☑     | ☐   | ☑
```

### 4. Notification Persistence

**Storage Strategy:**
- Last 30 days: PostgreSQL (queryable, indexed)
- Older than 30 days: Archive to S3 (for compliance)
- Deleted/archived: Soft delete (retention period: 90 days)

---

## Performance Considerations

### 1. Caching Strategy

**Multi-Layer Caching:**

```
Layer 1: Browser Cache (1 hour)
  - Static assets (JS, CSS)
  - Images (immutable URLs with version)

Layer 2: CDN Cache (24 hours)
  - Product images
  - Frequently accessed product pages

Layer 3: Redis Cache (4-30 minutes)
  - Dashboard metrics: 5 minutes TTL
  - Product listings: 30 minutes TTL
  - Customer data: 15 minutes TTL
  - Search keywords: 1 hour TTL
  
Layer 4: Database Query Cache (Implicit)
  - Connection pooling: 50 connections per vendor
  - Query optimization: Indexed fields used in WHERE/JOIN
```

**Cache Invalidation:**
```javascript
// When product is updated
await invalidateCache(`product:${productId}`);
await invalidateCache(`vendor:${vendorId}:products`);
await invalidateCache(`search:vendor:${vendorId}`);

// When order is placed
await invalidateCache(`dashboard:${vendorId}:metrics`);
await invalidateCache(`inventory:${vendorId}`);

// When wallet updated
await invalidateCache(`wallet:${vendorId}`);
```

### 2. Database Optimization

**Indexing Strategy:**
```sql
-- High-priority indexes
CREATE INDEX idx_vendor_created ON products(vendor_id, created_at DESC);
CREATE INDEX idx_order_status ON orders(vendor_id, status, created_at DESC);
CREATE INDEX idx_sku ON product_variants(sku);
CREATE INDEX idx_wallet_date ON wallet_transactions(vendor_id, created_at DESC);

-- For analytics queries
CREATE INDEX idx_sales_metrics ON sales_metrics(vendor_id, metric_date DESC);
CREATE INDEX idx_traffic_metrics ON traffic_metrics(vendor_id, metric_date DESC);
```

**Query Optimization:**
- N+1 problem: Use JOINs with aggregation
- Pagination: Always limit result sets (max 100 items per page)
- Sorting: Only allow sorting on indexed columns
- Search: Use Elasticsearch for full-text search on product names/descriptions

### 3. Pagination Strategy

**Lazy Loading Implementation:**
```
Initial Load: First 20 items + nextCursor
User Scrolls: Load next 20 items using cursor
Cursor Format: {lastId}:{lastTimestamp} encoded in base64
```

**Benefits:**
- Constant memory usage
- Consistent performance
- Handles inserts/deletes between requests
- No offset issues with large datasets

### 4. API Response Optimization

**Compression:**
- Gzip compression for all text responses (min size: 1KB)
- Brotli compression for static assets
- WebP for images (automatic fallback to JPEG)

**Response Size Limits:**
- Dashboard: Max 2MB (gzipped)
- Product list: Max 500KB per page
- Analytics: Max 1MB per report
- Search results: Max 100KB per page

**Selective Field Loading:**
```
GET /api/v1/products?fields=id,name,sku,price,stock
# Only returns requested fields, reducing payload
```

### 5. Load Testing Targets

- **Concurrent Users**: 10,000 vendors
- **Request Rate**: 1,000 req/sec per microservice
- **Dashboard Load Time**: < 2 seconds (p95)
- **API Response Time**: < 200ms (p95)
- **Real-time Updates**: < 100ms latency
- **Database Query Time**: < 100ms (p95)
- **Image Load Time**: < 500ms (p95)

### 6. Scalability

**Horizontal Scaling:**
- Stateless API servers (behind load balancer)
- Database read replicas for analytics queries
- Redis cluster for cache distribution
- Separate analytics database (eventual consistency)

**Traffic Distribution:**
- Product Service: 40% of requests
- Order Service: 30% of requests
- Analytics Service: 15% of requests
- Other Services: 15% of requests

---

## Error Handling and Resilience

### 1. Error Recovery Strategies

**Transient Failures (Retry):**
- Network timeouts: Exponential backoff (100ms → 1s → 10s)
- Temporary database outage: 3 retries with 500ms delay
- Payment gateway timeout: 2 retries, then queue for manual review

**Permanent Failures (Graceful Degradation):**
- Search service down: Show cached results + warning message
- Analytics unavailable: Show "Data processing..." with stale data
- Image processing failed: Store original image, skip optimization

**Critical Failures (Alert & Escalate):**
- Database connection lost: Alert ops team, show maintenance message
- Payment processing failure: Admin notification, manual intervention
- KYC document processing error: Notification to both vendor + admin

### 2. Circuit Breaker Pattern

```
State: CLOSED (normal operation)
  If error count > threshold: → OPEN

State: OPEN (fail fast)
  Return cached response or default
  After 30 seconds: → HALF_OPEN

State: HALF_OPEN (test recovery)
  Try single request
  If success: → CLOSED
  If fail: → OPEN (restart timer)
```

### 3. Monitoring and Alerting

**Key Metrics to Monitor:**
- API response time (p50, p95, p99)
- Error rate by endpoint
- Database connection pool utilization
- Cache hit ratio
- Queue depth (async jobs)
- WebSocket connection count
- File upload failures

**Alert Thresholds:**
- Error rate > 1%: Warning
- Error rate > 5%: Critical
- Response time p95 > 500ms: Warning
- Cache hit ratio < 70%: Warning
- Queue backlog > 1000: Critical

---

## Security and Compliance

### 1. Authentication & Authorization

**Authentication:**
- JWT tokens with 24-hour expiry
- Refresh tokens with 7-day expiry
- Multi-factor authentication (optional)
- API keys for bulk operations (read-only)

**Authorization:**
- Role-based access control (RBAC)
- Vendor can only access own data
- Admin can access all data with audit logging
- Resource-level permissions: Read, Write, Delete

### 2. Data Security

**Encryption:**
- TLS 1.3 for all data in transit
- AES-256 for sensitive data at rest (KYC docs, bank details)
- Hashed passwords using bcrypt (12 rounds)

**PCI DSS Compliance:**
- No credit card storage (payment gateway handles)
- No sensitive banking info in logs
- Regular security audits
- Penetration testing quarterly

### 3. Rate Limiting

- Per-vendor: 100 requests/second
- Per-IP: 1,000 requests/second
- Bulk operations: 10 concurrent jobs max
- File uploads: 100MB/day per vendor

---

## Testing Strategy

### 1. Unit Testing

**Scope:** Business logic, validators, utility functions

**Coverage Target:** 80%+ for core services
- Product service logic (variants, SKU generation)
- Inventory calculations (stock levels, reservations)
- Price calculations (tax, discounts)
- Analytics computations

**Example Unit Tests:**
```javascript
// SKU uniqueness validation
test('Should validate unique SKU across vendor products', () => {
  const existing = ['PROD-001', 'PROD-002'];
  const result = validateSKUUniqueness('PROD-001', existing);
  expect(result).toBe(false);
});

// Stock calculation
test('Should calculate available stock correctly', () => {
  const available = calculateAvailableStock(100, 25); // total, reserved
  expect(available).toBe(75);
});

// Price validation
test('Should reject sale price higher than regular price', () => {
  const validation = validatePricing(1000, 1500);
  expect(validation.valid).toBe(false);
});
```

### 2. Integration Testing

**Scope:** API endpoints, database interactions, service-to-service communication

**Coverage:** Critical user workflows
- Product creation → approval → publication
- Order placement → status updates → delivery
- Inventory update → low stock alert → notification
- Payout request → wallet deduction → completion

**Example Integration Tests:**
```javascript
// Order creation and inventory deduction
test('Creating order should reserve inventory', async () => {
  const product = await createProduct(vendor);
  const order = await createOrder(product, quantity: 5);
  const stock = await getProductStock(product.id);
  expect(stock.reserved).toBe(5);
  expect(stock.available).toBe(95); // 100 - 5
});

// Wallet update on order delivery
test('Delivered order should add funds to vendor wallet', async () => {
  const initialBalance = await getWalletBalance(vendor);
  const order = await createAndDeliverOrder(500);
  const updatedBalance = await getWalletBalance(vendor);
  expect(updatedBalance).toBeGreaterThan(initialBalance);
});
```

### 3. End-to-End (E2E) Testing

**Scope:** Complete user workflows in production-like environment

**Critical Paths:**
1. **Vendor Onboarding:** Registration → Profile setup → KYC → Dashboard access
2. **Product Listing:** Create product → Add variants → Upload images → Publish → Approval
3. **Order Management:** Order placed → Accept → Process → Pack → Ship → Deliver
4. **Financial:** Wallet tracking → Payout request → Bank transfer → History
5. **Analytics:** View metrics → Filter → Export data

**Tools:** Cypress/Playwright for browser automation

### 4. Performance Testing

**Load Testing:**
- 1,000 concurrent vendors
- 100 simultaneous orders
- Peak traffic: 5,000 requests/sec
- Acceptable response time: p95 < 500ms

**Stress Testing:**
- Gradually increase load until system breaks
- Identify bottlenecks (database, cache, API)
- Verify graceful degradation

**Tools:** Apache JMeter, k6, Locust

### 5. Real-Time Testing

**WebSocket Testing:**
- Connection establishment under load
- Message delivery within 100ms latency
- Disconnection handling
- Broadcast to multiple clients

### 6. Security Testing

- SQL injection vulnerability scanning
- XSS prevention verification
- CSRF token validation
- Rate limiting enforcement
- JWT token validation
- Unauthorized access attempts

---

## Integration Points with Existing Systems

### 1. Payment Gateway Integration

**Stripe/Razorpay Integration:**
- Order payment processing
- Refund handling
- Webhook for payment status
- PCI compliance delegation

**API Reference:**
```javascript
// Create payment intent
const paymentIntent = await stripe.paymentIntents.create({
  amount: order.total_amount * 100, // cents
  currency: 'inr',
  metadata: { order_id: order.id }
});

// On successful payment, webhook:
POST /webhooks/payment/success → Update order status
```

### 2. Shipping/Courier APIs

**Courier Integration (FedEx, DHL, Flipkart Logistics):**
- Generate shipping labels
- Track shipments
- Update order status
- Calculate shipping rates

**API Reference:**
```javascript
// Create shipment
const shipment = await fedex.createShipment({
  from: warehouse.address,
  to: order.shipping_address,
  packages: [{ weight, dimensions }],
  service_type: 'express'
});

// Webhook for tracking updates:
POST /webhooks/shipment/tracking → Update order status
```

### 3. Customer Storefront Integration

**Data Sync:**
- Product catalog (published products only)
- Inventory levels (real-time via API)
- Reviews and ratings (from storefront database)
- Wishlist analytics (product view counts)

**APIs:**
```
GET /api/v1/storefront/vendor/{id}/products  → Public product catalog
GET /api/v1/storefront/products/{id}/reviews → Customer reviews
GET /api/v1/storefront/products/{id}/analytics → Wishlist, views
```

### 4. Admin Dashboard Integration

**Admin APIs for Review:**
- Product approval workflow
- KYC document review
- Dispute resolution
- Commission tracking

```
GET  /api/v1/admin/kyc/pending              → Unreviewed KYC docs
POST /api/v1/admin/products/{id}/approve    → Approve product
POST /api/v1/admin/disputes/{id}/resolve    → Resolve disputes
```

### 5. Email Service Integration

**SendGrid/SES Integration:**
- Transactional emails (order confirmations, shipping updates)
- Notification emails
- Marketing campaigns
- Bulk sending for promotions

### 6. SMS Service Integration

**Twilio Integration:**
- Critical alerts (new orders, out-of-stock)
- SMS notifications for urgent items
- OTP for sensitive operations

### 7. Analytics Service Integration

**Google Analytics 4 Integration:**
- Track vendor store visits
- Product page views
- Conversion tracking
- E-commerce events

```javascript
gtag('event', 'view_item', {
  currency: 'INR',
  value: product.price,
  items: [{ item_id: product.id, item_name: product.name }]
});
```

### 8. Search Indexing Integration

**Elasticsearch Integration:**
- Index published products
- Full-text search on name, description, tags
- Faceted search (category, price range, brand)
- Real-time indexing on product update

```javascript
// Index product
await elasticsearch.index({
  index: 'products',
  id: product.id,
  body: {
    name: product.name,
    description: product.description,
    tags: product.tags,
    vendor_id: product.vendor_id,
    status: 'published'
  }
});
```

---

## API Integration Summary

### Event-Driven Architecture

**Events Published by Vendor Dashboard:**
```
vendor.registered          → Trigger welcome email
product.created            → Index in search
product.published          → Add to storefront
product.updated            → Update search index
order.placed               → Send to fulfillment
order.status_changed       → Notify customer
inventory.updated          → Update storefront availability
inventory.low_stock        → Alert vendor
wallet.balance_updated     → Log for accounting
payout.requested           → Queue payment processing
```

**Events Consumed by Vendor Dashboard:**
```
admin.product.approved     → Mark product as published
admin.kyc.verified         → Unlock dashboard
payment.completed          → Update order payment status
shipment.updated           → Update tracking
customer.review.posted     → Show in review section
storefront.product.viewed  → Increment view count
```

---

## Deployment and DevOps

### 1. Infrastructure

**Environment Setup:**
- Production: Kubernetes cluster (multi-region)
- Staging: Single region, replicated prod config
- Development: Local Docker setup

**Services:**
```
Frontend:  Next.js → Vercel/AWS S3 + CloudFront
API:       Node.js/Go microservices → Kubernetes
Database:  PostgreSQL → RDS (multi-AZ)
Cache:     Redis → ElastiCache
Search:    Elasticsearch → AWS Opensearch
Storage:   S3 / Azure Blob Storage
Messages:  RabbitMQ / SQS for async jobs
Monitoring: Datadog / New Relic
```

### 2. CI/CD Pipeline

**Build → Test → Deploy Flow:**
1. Git push to main
2. GitHub Actions trigger tests
3. Run unit tests, integration tests, E2E tests
4. Build Docker images
5. Push to container registry
6. Deploy to staging
7. Run smoke tests
8. Deploy to production (blue-green)
9. Monitor for errors (rollback if needed)

### 3. Database Migration Strategy

**Zero-downtime migrations:**
- Use Flyway or Liquibase for versioning
- Backward-compatible schema changes
- Gradual rollout with feature flags
- Rollback capability for each migration

---

## Frontend Architecture (Next.js)

### 1. Directory Structure

```
/app
  /(dashboard)/
    /dashboard
      /page.tsx              # Main dashboard
      /layout.tsx
    /products
      /page.tsx              # Product list
      /[id]/page.tsx         # Product detail
      /[id]/edit/page.tsx    # Product edit
      /create/page.tsx       # Create product
    /orders
      /page.tsx
      /[id]/page.tsx
    /inventory
      /page.tsx
    /wallet
      /page.tsx
    /analytics
      /page.tsx
    /customers
      /page.tsx
    /settings
      /page.tsx
/components
  /Dashboard/
    /MetricsCard.tsx
    /SalesChart.tsx
    /RecentOrders.tsx
  /Products/
    /ProductForm.tsx
    /VariantManager.tsx
    /ImageUpload.tsx
  /Common/
    /Sidebar.tsx
    /TopBar.tsx
    /Notification.tsx
/hooks
  /useProducts.ts
  /useOrders.ts
  /useNotifications.ts
  /useMetrics.ts
/lib
  /api.ts                    # API client setup
  /hooks.ts
  /utils.ts
/styles
  /globals.css
```

### 2. Key Libraries

- **Next.js 14+**: Framework
- **React 18+**: UI
- **TailwindCSS + Custom Plugins**: Styling with maximalist design system
- **Framer Motion**: Advanced animations and microinteractions
- **React Query / SWR**: Data fetching + caching
- **Socket.io-client**: Real-time updates
- **React Hook Form + Zod**: Form management and validation
- **Recharts**: Rich data visualization with custom themes
- **Headless UI**: Accessible component primitives
- **Zustand / Jotai**: State management

### 3. Tailwind Configuration (Maximalist)

**tailwind.config.js:**
```javascript
module.exports = {
  theme: {
    colors: {
      // Primary Maximalist Colors
      'electric-blue': '#0064FF',
      'vibrant-purple': '#7C3AED',
      'coral-red': '#FF6B6B',
      'emerald-green': '#10B981',
      
      // Accent Colors
      'golden-yellow': '#FCD34D',
      'deep-orange': '#F97316',
      'teal': '#14B8A6',
      'rose-pink': '#EC4899',
      
      // Neutral Palette
      'deep-navy': '#0F172A',
      'charcoal': '#334155',
      'light-slate': '#E2E8F0',
      'off-white': '#F8FAFC',
    },
    fontSize: {
      'h1': ['36px', { lineHeight: '1.2', fontWeight: '700' }],
      'h2': ['28px', { lineHeight: '1.3', fontWeight: '700' }],
      'h3': ['24px', { lineHeight: '1.4', fontWeight: '600' }],
      'h4': ['20px', { lineHeight: '1.5', fontWeight: '600' }],
      'body-lg': ['16px', { lineHeight: '1.6' }],
      'body-md': ['14px', { lineHeight: '1.6' }],
      'body-sm': ['12px', { lineHeight: '1.5' }],
    },
    boxShadow: {
      'card': '0 4px 6px -1px rgba(15, 23, 42, 0.1), 0 2px 4px -1px rgba(15, 23, 42, 0.06)',
      'card-hover': '0 20px 25px -5px rgba(15, 23, 42, 0.15), 0 10px 10px -5px rgba(15, 23, 42, 0.1)',
      'metric': '0 10px 30px -10px rgba(0, 100, 255, 0.2)',
      'glow': '0 0 20px rgba(0, 100, 255, 0.4)',
    },
    extend: {
      backgroundImage: {
        'gradient-metric': 'linear-gradient(135deg, #0064FF 0%, #7C3AED 100%)',
        'gradient-success': 'linear-gradient(135deg, #10B981 0%, #14B8A6 100%)',
        'gradient-warning': 'linear-gradient(135deg, #F97316 0%, #FCD34D 100%)',
        'gradient-error': 'linear-gradient(135deg, #FF6B6B 0%, #EC4899 100%)',
        'pattern-dots': 'radial-gradient(circle, rgba(200, 200, 200, 0.1) 1px, transparent 1px)',
      },
      animation: {
        'pulse-glow': 'pulse-glow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'slide-in': 'slide-in 0.3s ease-out',
        'fade-in': 'fade-in 0.2s ease-in',
        'shimmer': 'shimmer 1.5s infinite',
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { opacity: '1', boxShadow: '0 0 20px rgba(0, 100, 255, 0.4)' },
          '50%': { opacity: '.8', boxShadow: '0 0 40px rgba(0, 100, 255, 0.6)' },
        },
        'slide-in': {
          'from': { transform: 'translateY(-100%)', opacity: '0' },
          'to': { transform: 'translateY(0)', opacity: '1' },
        },
        'fade-in': {
          'from': { opacity: '0' },
          'to': { opacity: '1' },
        },
        'shimmer': {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
      },
    },
  },
};
```

### 4. Component Implementation Examples (Maximalist)

**MetricsCard Component (Framer Motion + Tailwind):**
```typescript
// components/Dashboard/MetricsCard.tsx
import { motion } from 'framer-motion';
import React from 'react';

interface MetricsCardProps {
  title: string;
  value: string | number;
  change: number;
  icon: React.ReactNode;
  gradient: string;
  trend: 'up' | 'down' | 'neutral';
}

export function MetricsCard({
  title,
  value,
  change,
  icon,
  gradient,
  trend,
}: MetricsCardProps) {
  return (
    <motion.div
      whileHover={{ y: -8, transition: { duration: 0.3 } }}
      className={`relative p-8 rounded-xl ${gradient} shadow-metric overflow-hidden group`}
    >
      {/* Background pattern */}
      <div className="absolute inset-0 bg-pattern-dots opacity-10 pointer-events-none" />
      
      {/* Ornamental corners */}
      <div className="absolute top-0 left-0 w-12 h-12 border-l-4 border-t-4 border-white/30" />
      <div className="absolute bottom-0 right-0 w-12 h-12 border-r-4 border-b-4 border-white/30" />
      
      {/* Content */}
      <div className="relative z-10">
        {/* Icon with glow */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          className="inline-block mb-4 text-4xl filter drop-shadow-lg"
        >
          {icon}
        </motion.div>
        
        {/* Title */}
        <p className="text-body-sm text-white/80 uppercase tracking-wider font-semibold">
          {title}
        </p>
        
        {/* Value */}
        <div className="mt-3 mb-4">
          <p className="text-h2 text-white font-bold">{value}</p>
        </div>
        
        {/* Trend */}
        <div className="flex items-center gap-2">
          {trend === 'up' && (
            <motion.div
              animate={{ y: [0, -4, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-emerald-green font-bold"
            >
              ↑ {Math.abs(change)}%
            </motion.div>
          )}
          {trend === 'down' && (
            <span className="text-coral-red font-bold">↓ {Math.abs(change)}%</span>
          )}
          <span className="text-body-sm text-white/70">from last month</span>
        </div>
      </div>
      
      {/* Decorative bottom bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-white/50 to-transparent" />
    </motion.div>
  );
}
```

**RecentOrders Table Component (Ornate with Animations):**
```typescript
// components/Dashboard/RecentOrders.tsx
import { motion } from 'framer-motion';

export function RecentOrders({ orders }: { orders: Order[] }) {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  const statusColors = {
    delivered: 'emerald-green',
    shipped: 'teal',
    processing: 'deep-orange',
    pending: 'golden-yellow',
  };

  return (
    <div className="bg-off-white rounded-xl border-2 border-light-slate shadow-card overflow-hidden">
      {/* Header with decorative divider */}
      <div className="px-8 py-6 border-b-2 border-dashed border-light-slate">
        <h3 className="text-h4 text-deep-navy font-bold">📋 Recent Orders</h3>
        <div className="mt-2 h-1 bg-gradient-to-r from-electric-blue via-vibrant-purple to-transparent" />
      </div>
      
      {/* Table */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="overflow-x-auto"
      >
        <table className="w-full">
          <thead className="bg-gradient-to-r from-electric-blue/10 to-vibrant-purple/10">
            <tr>
              <th className="px-6 py-4 text-left text-body-sm font-bold text-deep-navy uppercase tracking-wider">
                Order ID
              </th>
              <th className="px-6 py-4 text-left text-body-sm font-bold text-deep-navy uppercase tracking-wider">
                Customer
              </th>
              <th className="px-6 py-4 text-right text-body-sm font-bold text-deep-navy uppercase tracking-wider">
                Amount
              </th>
              <th className="px-6 py-4 text-center text-body-sm font-bold text-deep-navy uppercase tracking-wider">
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order, idx) => (
              <motion.tr
                key={order.id}
                variants={item}
                className={`border-b border-light-slate transition-all hover:bg-electric-blue/5 ${
                  idx % 2 === 0 ? 'bg-off-white' : 'bg-light-slate/20'
                }`}
                whileHover={{ backgroundColor: 'rgba(0, 100, 255, 0.05)' }}
              >
                <td className="px-6 py-4 text-body-md font-mono text-deep-navy font-semibold">
                  {order.id}
                </td>
                <td className="px-6 py-4 text-body-md text-charcoal">{order.customer}</td>
                <td className="px-6 py-4 text-right text-body-md text-deep-navy font-bold">
                  ₹{order.amount.toLocaleString()}
                </td>
                <td className="px-6 py-4 text-center">
                  <motion.span
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className={`inline-block px-4 py-2 rounded-full text-body-sm font-bold text-white bg-${statusColors[order.status]} shadow-md`}
                  >
                    ● {order.status}
                  </motion.span>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </motion.div>
    </div>
  );
}
```

**Alert Component (Ornate with Icons):**
```typescript
// components/Common/Alert.tsx
import { motion, AnimatePresence } from 'framer-motion';

export function Alert({
  type = 'info',
  title,
  message,
  onDismiss,
}: AlertProps) {
  const bgColor = {
    success: 'bg-gradient-success',
    error: 'bg-gradient-error',
    warning: 'bg-gradient-warning',
    info: 'bg-gradient-metric',
  };

  const accentColor = {
    success: 'emerald-green',
    error: 'coral-red',
    warning: 'golden-yellow',
    info: 'electric-blue',
  };

  const icons = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ',
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className={`relative mx-4 mb-4 p-6 rounded-xl overflow-hidden shadow-lg`}
      >
        {/* Animated left border */}
        <motion.div
          animate={{ scaleY: [0.8, 1, 0.8] }}
          transition={{ duration: 2, repeat: Infinity }}
          className={`absolute left-0 top-0 bottom-0 w-1 bg-${accentColor[type]}`}
        />
        
        {/* Background gradient */}
        <div className={`absolute inset-0 ${bgColor[type]} opacity-90`} />
        
        {/* Content */}
        <div className="relative flex gap-4">
          {/* Icon */}
          <motion.div
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ duration: 3, repeat: Infinity }}
            className="text-2xl font-bold text-white flex-shrink-0"
          >
            {icons[type]}
          </motion.div>
          
          {/* Text */}
          <div className="flex-grow">
            <p className="font-bold text-white text-body-md">{title}</p>
            <p className="text-white/90 text-body-sm mt-1">{message}</p>
          </div>
          
          {/* Dismiss button */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={onDismiss}
            className="text-white/70 hover:text-white font-bold text-xl flex-shrink-0"
          >
            ✕
          </motion.button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
```

### 5. Animation System

**Page Transitions:**
```typescript
// lib/transitions.ts
import { motion } from 'framer-motion';

export const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

export const pageTransition = {
  duration: 0.3,
  ease: 'easeInOut',
};
```

**Real-Time Update Animation:**
```typescript
// Update inventory with highlight animation
const highlightVariants = {
  initial: { backgroundColor: 'rgba(252, 211, 77, 0.8)' }, // Yellow
  final: { backgroundColor: 'rgba(248, 250, 252, 0)' }, // Transparent
};

// Apply when stock updates
<motion.div
  animate="final"
  transition={{ duration: 1 }}
  variants={highlightVariants}
>
  Stock: {stock}
</motion.div>
```

### 3. Real-Time Updates Implementation

```typescript
// Hook for real-time orders
export function useRealtimeOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  
  useEffect(() => {
    const socket = io(SOCKET_URL, { auth: { token } });
    
    socket.on('order:new', (order) => {
      setOrders(prev => [order, ...prev]);
    });
    
    socket.on('order:status_changed', ({orderId, newStatus}) => {
      setOrders(prev => 
        prev.map(o => o.id === orderId ? {...o, status: newStatus} : o)
      );
    });
    
    return () => socket.disconnect();
  }, []);
  
  return orders;
}
```

---

## Correctness Properties

This section will be completed after prework analysis of acceptance criteria.

---

## Error Handling

### HTTP Status Codes

```
200 OK                    # Success
201 Created              # Resource created
204 No Content           # Success, no body
400 Bad Request          # Invalid input
401 Unauthorized         # Auth required
403 Forbidden            # Permission denied
404 Not Found            # Resource not found
409 Conflict             # SKU already exists
422 Unprocessable        # Validation failed
429 Too Many Requests    # Rate limited
500 Server Error         # Unexpected error
503 Service Unavailable  # Maintenance mode
```

### Error Response Format

```json
{
  "status": "error",
  "code": "INVALID_SKU",
  "message": "SKU must be unique across your products",
  "details": {
    "field": "sku",
    "conflicting_product": "RED-M-001"
  },
  "timestamp": "2024-01-15T10:30:00Z",
  "request_id": "req_12345"
}
```

### Business Logic Error Handling

| Scenario | Error Code | HTTP Status | Action |
|----------|-----------|------------|--------|
| SKU already exists | `DUPLICATE_SKU` | 409 | Show message, suggest alternative |
| Insufficient stock | `INSUFFICIENT_STOCK` | 422 | Show available qty, offer backorder |
| Withdrawal > balance | `INSUFFICIENT_FUNDS` | 422 | Show available balance |
| Product not found | `PRODUCT_NOT_FOUND` | 404 | Redirect to product list |
| Invalid transition | `INVALID_STATUS_TRANSITION` | 422 | Show available next states |
| Payment failed | `PAYMENT_FAILED` | 402 | Retry with new payment method |
| KYC not verified | `KYC_NOT_VERIFIED` | 403 | Redirect to KYC workflow |

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Stock Availability Calculation

*For any warehouse inventory with current stock and reserved quantities, the available stock SHALL always equal current stock minus reserved quantity.*

**Validates: Requirements 16.1**

**Implementation Note:** 
```
For all (current_stock, reserved_stock) where both >= 0:
  available = current_stock - reserved_stock
  Assert: available >= 0
  Assert: available <= current_stock
```

### Property 2: Order Stock Reservation

*When an order is placed with any quantity for a product, the system SHALL reserve exactly that quantity from the inventory.*

**Validates: Requirements 16.3**

**Implementation Note:**
```
For all orders with quantity Q:
  Before: available_stock = S
  After order placed: reserved_stock += Q
  Assert: new_available = S - Q
```

### Property 3: Order Cancellation Stock Release

*When an order is cancelled, the system SHALL release all reserved stock back to available inventory.*

**Validates: Requirements 16.5**

**Implementation Note:**
```
For all cancelled orders with reserved quantity Q:
  Before cancel: reserved = R
  After cancel: reserved = R - Q
  Assert: available increases by Q
```

### Property 4: SKU Uniqueness Within Vendor

*For any vendor's product catalog, no two product variants SHALL share the same SKU.*

**Validates: Requirements 7.5, 12.6**

**Implementation Note:**
```
For all vendors and all product variants in their catalog:
  Assert: SKU values are unique
  Assert: Adding duplicate SKU fails with DUPLICATE_SKU error
```

### Property 5: Price Validation - Sale Price Less Than Regular

*When a product variant has both regular and sale price, the sale price SHALL always be less than regular price.*

**Validates: Requirements 7.10**

**Implementation Note:**
```
For all product variants with (regular_price, sale_price):
  Assert: sale_price < regular_price
  Assert: validation passes only when this holds true
  Assert: validation fails with INVALID_PRICING error otherwise
```

### Property 6: Wallet Balance Calculation

*For any vendor wallet, total earnings SHALL equal the sum of all delivered orders minus all platform fees, refunds, and chargebacks.*

**Validates: Requirements 5.2**

**Implementation Note:**
```
For all vendors:
  total_earnings = 
    sum(delivered_order_amounts) 
    - sum(platform_fees) 
    - sum(refunds)
  Assert: calculated_total_earnings == database_total_earnings
```

### Property 7: Running Balance Correctness

*In transaction history, the running balance at each row SHALL correctly reflect all transactions up to that point in time.*

**Validates: Requirements 5.6**

**Implementation Note:**
```
For all vendors and transaction sequences:
  running_balance[0] = amount[0]
  running_balance[i] = running_balance[i-1] + amount[i] for i > 0
  Assert: displayed_running_balance matches calculated
```

### Property 8: Withdrawal Amount Validation

*A withdrawal request SHALL only be approved if the requested amount is less than or equal to the available balance.*

**Validates: Requirements 5.7**

**Implementation Note:**
```
For all withdrawal requests with amount W and balance B:
  Assert: validation passes if and only if W <= B
  Assert: validation fails with INSUFFICIENT_FUNDS if W > B
```

### Property 9: Refund Wallet Deduction

*When a refund is processed, the vendor's wallet balance SHALL decrease by exactly the refund amount.*

**Validates: Requirements 5.5**

**Implementation Note:**
```
For all refunds with amount R and initial balance B:
  Before: balance = B
  After: balance = B - R
  Assert: new_balance == B - R
```

### Property 10: Inventory Adjustment Applied

*When an inventory adjustment is made with quantity Q and reason R, the stock level SHALL change by exactly Q in the appropriate direction.*

**Validates: Requirements 17.2**

**Implementation Note:**
```
For all adjustments (quantity, reason):
  Before: stock = S
  After: stock = S + adjustment_quantity
  Assert: transaction recorded with correct quantity and reason
```

### Property 11: Low Stock Alert Trigger

*When inventory falls below the vendor-configured reorder threshold, the system SHALL trigger a low stock alert.*

**Validates: Requirements 18.1, 17.3**

**Implementation Note:**
```
For all products with threshold T:
  If new_stock < T: alert_triggered = true
  If new_stock >= T: alert_triggered = false
  Assert: alert system notifies correctly
```

### Property 12: Product Deletion Logic

*A product SHALL only be deleted if it has no associated orders; products with any orders SHALL be marked for archival instead.*

**Validates: Requirements 7.15**

**Implementation Note:**
```
For all products:
  If order_count == 0: deletion succeeds
  If order_count > 0: deletion fails with PRODUCT_HAS_ORDERS error
```

### Property 13: Recent Orders Recency

*The "Recent Orders" dashboard section SHALL display the 10 most recent orders, sorted by creation timestamp in descending order.*

**Validates: Requirements 3.6**

**Implementation Note:**
```
For all vendors with N orders:
  Recent_orders = orders sorted by created_at DESC, limited to 10
  Assert: all returned orders have created_at >= (oldest_of_10).created_at
  Assert: exactly min(N, 10) orders returned
```

### Property 14: Recent Activities Date Filter

*The "Recent Activities" feed SHALL only show actions from the last 7 days.*

**Validates: Requirements 3.7**

**Implementation Note:**
```
For all vendors and activities:
  Now = current_timestamp
  Assert: all activities have timestamp >= (Now - 7 days)
  Assert: activities older than 7 days are excluded
```

### Property 15: Order Status Transition Validity

*Order status transitions SHALL only proceed through valid workflow paths; invalid transitions SHALL be rejected.*

**Validates: Requirements 19.7**

**Implementation Note:**
```
Valid transitions:
  new → accepted → processing → packed → ready_to_ship → shipped → delivered
  any → cancelled (allowed from most states except delivered/cancelled)
  
For all order status transitions:
  Assert: transition is in valid set, else reject with INVALID_STATUS_TRANSITION
```

### Property 16: Delivery Zone Matching

*When calculating shipping for an order, the system SHALL match the customer address to exactly one delivery zone and apply that zone's pricing.*

**Validates: Requirements 36.6**

**Implementation Note:**
```
For all customer addresses and delivery zones:
  matched_zone = zone where address falls within zone boundaries
  Assert: exactly one zone matched (no overlaps)
  Assert: correct shipping charge applied for matched zone
```

### Property 17: Weight-Based Shipping Calculation

*When weight-based shipping is configured, the system SHALL apply the correct shipping charge based on total package weight.*

**Validates: Requirements 35.6**

**Implementation Note:**
```
For all packages with weight W and configured ranges:
  range = find_range_for_weight(W)
  shipping_charge = range.charge
  Assert: charge applied is correct for weight
  Assert: range boundaries are non-overlapping
```

### Property 18: Product Metric Aggregation Accuracy

*Dashboard product statistics (published, draft, pending, low-stock counts) SHALL correctly reflect actual product states.*

**Validates: Requirements 3.3**

**Implementation Note:**
```
For all vendors:
  published_count = count(products where status == 'published')
  draft_count = count(products where status == 'draft')
  pending_count = count(products where status == 'pending_approval')
  low_stock_count = count(products where stock < threshold)
  
  Assert: displayed counts match database counts
```

### Property 19: Store Performance Score Range

*The Store Performance Score SHALL always be in the valid range of 0-100.*

**Validates: Requirements 3.4**

**Implementation Note:**
```
For all vendors:
  score = calculate_performance_score(fulfillment_rate, approval_rate, rating, return_rate)
  Assert: 0 <= score <= 100
  Assert: score increases with better metrics
  Assert: score decreases with worse metrics
```

### Property 20: Sales Chart Data Aggregation

*The sales graph rendering daily and monthly revenue trends SHALL accurately aggregate transaction data.*

**Validates: Requirements 3.5**

**Implementation Note:**
```
For all vendors viewing quarterly sales chart:
  For each day: displayed_revenue == sum(orders delivered that day)
  Assert: chart shows correct data points
  Assert: trend line correctly represents revenue pattern
```

### Property 21: Inventory Transaction History Completeness

*Every stock change (order placed, shipped, adjustment) SHALL be recorded in the transaction history with correct timestamp and reason.*

**Validates: Requirements 16.8**

**Implementation Note:**
```
For all inventory changes:
  Assert: transaction recorded immediately
  Assert: transaction includes: date, quantity_change, reason, warehouse
  Assert: running balance after transaction is correct
```

### Property 22: Variant Validation - Non-Negative Values

*For all product variants, stock quantity and price values SHALL be non-negative.*

**Validates: Requirements 12.6**

**Implementation Note:**
```
For all variants:
  Assert: stock_quantity >= 0
  Assert: price >= 0
  Assert: validation fails if either is negative
```

### Property 23: Bulk Inventory Adjustment Processing

*When bulk inventory adjustments are imported from CSV, all valid rows SHALL be processed and reflected in final inventory.*

**Validates: Requirements 17.5**

**Implementation Note:**
```
For all bulk adjustments (N rows):
  successful_adjustments = count(rows where adjustment succeeded)
  Assert: each successful row updates stock correctly
  Assert: transaction history reflects all adjustments
  Assert: final stock matches expected values
```

### Property 24: Payout Status Classification

*Payouts SHALL be correctly classified into statuses: Awaiting Next Cycle, Processing, Completed, Failed.*

**Validates: Requirements 6.1, 5.8**

**Implementation Note:**
```
For all payouts in system:
  Assert: every payout has exactly one status
  Assert: payout statuses are from valid set only
  Assert: status filtering returns correct subset
```

### Property 25: Customer Order Count Accuracy

*The customer information card (total orders, total spent, repeat purchase rate) SHALL accurately reflect all customer transactions.*

**Validates: Requirements 26.5, 26.7**

**Implementation Note:**
```
For all customers:
  total_orders = count(orders from this customer)
  total_spent = sum(order_amounts from this customer)
  repeat_rate = count(customers with orders > 1) / total_customers
  
  Assert: displayed values match calculated values
```

### Property Reflection and Consolidation

After completing the initial analysis, the following properties were identified as potentially redundant or combinable:

- **Properties 3, 4, 5**: All testing inventory state transitions can be consolidated into a single comprehensive property: "Inventory State Consistency After Operations"
- **Properties 6, 7, 9**: All wallet calculation properties can be consolidated into: "Wallet Balance Calculation Correctness"
- **Properties 11, 17, 18, 19, 20**: All dashboard metric aggregation properties can be consolidated into: "Dashboard Metrics Aggregation Correctness"

However, after reflection, these properties remain distinct and valuable because:
1. Each tests a unique state transition (not all paths covered by one)
2. Breaking them down enables granular debugging when failures occur
3. Different test generators may be needed for each scenario
4. Order of operations matters (cancellation after reservation vs. reservation only)

**Final Count**: 25 distinct, non-redundant properties for property-based testing

---

## Implementation Testing Strategy

Given the extensive property-based testing needs, the following implementation approach is recommended:

### Property-Based Test Framework Selection

For a Node.js/TypeScript environment, use **Fast-Check** (or Hypothesis for Python workers):

```typescript
// Example: Property 1 - Stock Availability Calculation
import fc from 'fast-check';

describe('Stock Availability Calculation', () => {
  it('should calculate available = current - reserved', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 10000 }), // current_stock
        fc.integer({ min: 0, max: 10000 }), // reserved_stock
        (current, reserved) => {
          if (reserved > current) return true; // Skip invalid state
          const available = calculateAvailable(current, reserved);
          return available === current - reserved 
            && available >= 0 
            && available <= current;
        }
      ),
      { numRuns: 1000 }
    );
  });
});
```

### Integration Testing for Critical Workflows

Unit tests with mocks for core logic, integration tests for actual database operations:

```typescript
describe('Order Stock Reservation Integration', () => {
  it('should reserve stock when order is placed', async () => {
    const vendor = await createVendor();
    const product = await createProduct(vendor, {stock: 100});
    const order = await createOrder(vendor, {items: [{product, qty: 25}]});
    
    const inventory = await getInventory(product);
    expect(inventory.reserved).toBe(25);
    expect(inventory.available).toBe(75);
  });
});
```

### E2E Tests for Complete Workflows

Critical user journeys end-to-end:

```typescript
describe('Vendor Dashboard Complete Workflow', () => {
  it('should support vendor from registration through first sale', async () => {
    // 1. Register vendor
    const vendor = await registerVendor({...});
    
    // 2. Complete KYC
    await uploadKYCDocuments(vendor, {...});
    await approveKYC(vendor);
    
    // 3. Create and publish product
    const product = await createProduct(vendor, {...});
    await publishProduct(product);
    await approveProduct(product);
    
    // 4. Receive order
    const customer = await getOrCreateCustomer(...);
    const order = await createOrder(customer, {items: [{product, qty: 1}]});
    
    // 5. Accept and ship order
    await acceptOrder(order);
    await processOrder(order);
    await markAsShipped(order);
    
    // 6. Verify wallet updated
    const wallet = await getWallet(vendor);
    expect(wallet.balance).toBeGreaterThan(0);
  });
});
```

---

## Summary and Next Steps

This comprehensive design document provides:

1. **System Architecture**: Microservices-based design with clear separation of concerns
2. **Data Models**: Complete database schema supporting all vendor dashboard features
3. **API Specifications**: RESTful endpoints for all major functions
4. **Real-Time Mechanisms**: WebSocket-based real-time updates for critical metrics
5. **File Storage**: Organized S3 structure for products, KYC docs, invoices, bulk uploads
6. **Notification System**: Multi-channel delivery (in-app, email, SMS) with preferences
7. **Performance Strategy**: Multi-layer caching, database optimization, pagination
8. **Security**: Authentication, authorization, encryption, compliance measures
9. **Testing Strategy**: Unit tests, integration tests, E2E tests, property-based tests
10. **Correctness Properties**: 25 formally specified properties for property-based testing
11. **Error Handling**: Comprehensive error codes and recovery strategies
12. **Integration Points**: Payment gateway, shipping APIs, storefront sync

### Recommended Implementation Order

1. **Phase 1**: Core infrastructure (DB, API gateway, auth)
2. **Phase 2**: Product management (CRUD, variants, bulk upload)
3. **Phase 3**: Order management (creation, status tracking, invoicing)
4. **Phase 4**: Inventory system (stock tracking, alerts, adjustments)
5. **Phase 5**: Financial system (wallet, payouts, transactions)
6. **Phase 6**: Real-time updates (WebSocket integration)
7. **Phase 7**: Analytics (metrics, reporting, forecasting)
8. **Phase 8**: Advanced features (promotions, customer management, returns)
