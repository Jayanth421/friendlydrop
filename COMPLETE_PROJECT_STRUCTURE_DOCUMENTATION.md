#22 FriendlyDrop - Complete Project Structure Documentation

## 📋 Table of Contents

1. [Project Overview](#project-overview)
2. [Root Directory Structure](#root-directory-structure)
3. [App Directory (Next.js 14 App Router)](#app-directory-nextjs-14-app-router)
4. [Components Architecture](#components-architecture)
5. [API Structure](#api-structure)
6. [Authentication & Authorization](#authentication--authorization)
7. [Database Schema](#database-schema)
8. [Configuration Files](#configuration-files)
9. [Development & Deployment](#development--deployment)
10. [Tech Stack & Dependencies](#tech-stack--dependencies)

---

## 1. Project Overview

**FriendlyDrop** is a comprehensive multi-vendor e-commerce platform built with Next.js 14 that supports:

- **Customers**: Browse products, place orders, manage accounts
- **Vendors**: Manage products, orders, analytics, and business operations  
- **Administrators**: Full platform management, user control, system settings

### Architecture Type
**Single Application Structure** with role-based routing:
- All user types access through same domain with different routes
- Customers: `/`, `/products`, `/cart`, `/account`
- Vendors: `/vendor/*`
- Admins: `/admin/*`

---

## 2. Root Directory Structure

```
friendlydrop.in/
├── 📁 .agents/                     # Agent configurations (external tooling)
├── 📁 .claude/                     # Claude AI agent configurations
│   ├── 📁 agents/kfc/              # KFC (spec) agents
│   ├── 📁 settings/                # Agent settings
│   ├── 📁 specs/                   # Spec documents
│   └── 📁 system-prompts/          # System prompt templates
├── 📁 .codex/                      # Codex configurations
├── 📁 .git/                        # Git version control
├── 📁 .kiro/                       # Kiro AI configurations
│   └── 📁 specs/                   # Project specifications
│       └── 📁 vendor-dashboard/    # Vendor dashboard spec
├── 📁 .next/                       # Next.js build output (auto-generated)
├── 📁 .vscode/                     # VS Code settings
├── 📁 admin-dashboard/             # Separate admin dashboard (legacy?)
├── 📁 app/                         # Next.js 14 App Router (main application)
├── 📁 components/                  # React components
├── 📁 deployment-scripts/          # Deployment automation
├── 📁 docs/                        # Project documentation
├── 📁 hooks/                       # Custom React hooks
├── 📁 lib/                         # Utility functions & configurations
├── 📁 public/                      # Static assets
├── 📁 scripts/                     # Database & utility scripts
├── 📁 store/                       # State management (Zustand)
├── 📁 types/                       # TypeScript type definitions
├── 📄 .env.example                 # Environment variables template
├── 📄 .env.local                   # Local environment variables
├── 📄 .eslintrc.json              # ESLint configuration
├── 📄 .gitignore                   # Git ignore rules
├── 📄 .tmp-dev.log                # Development logs
├── 📄 AGENTS.md                    # Agent configuration guide
├── 📄 firebase.json                # Firebase configuration
├── 📄 middleware.ts                # Next.js middleware (auth & routing)
├── 📄 next.config.mjs              # Next.js configuration
├── 📄 package.json                 # Dependencies & scripts
├── 📄 tailwind.config.ts           # Tailwind CSS configuration
├── 📄 tsconfig.json                # TypeScript configuration
├── 📄 COMPLETE_PROJECT_STRUCTURE_DOCUMENTATION.md
├── 📄 FRIENDLYDROP_DOCUMENTATION.md
├── 📄 QUICK_DEPLOYMENT_SUMMARY.md
└── 📄 VENDOR_DASHBOARD_IMPLEMENTATION_STATUS.md
```
---

## 3. App Directory (Next.js 14 App Router)

### 3.1 Complete App Structure

```
app/
├── 📁 (public-admin)/              # Public admin routes (route groups)
│   └── 📁 admin/
│       └── 📁 access-denied/
│           └── 📄 page.tsx
├── 📁 about-brand/                 # Brand information
│   └── 📄 page.tsx
├── 📁 account/                     # 🔐 Customer account pages
│   └── 📄 page.tsx
├── 📁 admin/                       # 🔐 Admin dashboard (protected)
│   ├── 📁 ads/                     # Advertisement management
│   │   └── 📄 page.tsx
│   ├── 📁 analytics/               # Platform analytics
│   │   └── 📄 page.tsx
│   ├── 📁 automation/              # Automation tools
│   │   └── 📄 page.tsx
│   ├── 📁 banners/                 # Banner management
│   │   └── 📄 page.tsx
│   ├── 📁 builder/                 # Page builder tools
│   │   └── 📄 page.tsx
│   ├── 📁 categories/              # Category management
│   │   ├── 📄 category-manager.tsx
│   │   └── 📄 page.tsx
│   ├── 📁 cms/                     # Content management
│   │   └── 📄 page.tsx
│   ├── 📁 control-tower/           # System monitoring
│   │   └── 📄 page.tsx
│   ├── 📁 coupons/                 # Coupon management
│   │   └── 📄 page.tsx
│   ├── 📁 customers/               # Customer management
│   │   └── 📄 page.tsx
│   ├── 📁 dashboard/               # Admin dashboard home
│   │   └── 📄 page.tsx
│   ├── 📁 finance/                 # Financial reports
│   │   └── 📄 page.tsx
│   ├── 📁 integrations/            # Third-party integrations
│   │   └── 📄 page.tsx
│   ├── 📁 inventory/               # Inventory management
│   │   ├── 📄 inventory-table.tsx
│   │   └── 📄 page.tsx
│   ├── 📁 logs/                    # System logs
│   │   └── 📄 page.tsx
│   ├── 📁 marketing/               # Marketing tools
│   │   └── 📄 page.tsx
│   ├── 📁 media/                   # Media library
│   │   └── 📄 page.tsx
│   ├── 📁 mobile/                  # Mobile app settings
│   │   └── 📄 page.tsx
│   ├── 📁 monitoring/              # Performance monitoring
│   │   └── 📄 page.tsx
│   ├── 📁 orders/                  # Order management
│   │   ├── 📄 columns.tsx
│   │   ├── 📄 data-table.tsx
│   │   └── 📄 orders-data-table.tsx
│   │   └── 📄 page.tsx
│   ├── 📁 payments/                # Payment settings
│   │   └── 📄 page.tsx
│   ├── 📁 plugins/                 # Plugin management
│   │   └── 📄 page.tsx
│   ├── 📁 products/                # Product management
│   │   └── 📄 page.tsx
│   ├── 📁 reports/                 # System reports
│   │   └── 📄 page.tsx
│   ├── 📁 returns/                 # Return management
│   │   └── 📄 page.tsx
│   ├── 📁 reviews/                 # Review moderation
│   │   └── 📄 page.tsx
│   ├── 📁 search/                  # Search configuration
│   │   └── 📄 page.tsx
│   ├── 📁 seo/                     # SEO tools
│   │   └── 📄 page.tsx
│   ├── 📁 settings/                # Platform settings
│   │   └── 📄 page.tsx
│   ├── 📁 sharing/                 # Social sharing
│   │   └── 📄 page.tsx
│   ├── 📁 shipping/                # Shipping management
│   │   └── 📄 page.tsx
│   ├── 📁 support/                 # Support system
│   │   └── 📄 page.tsx
│   ├── 📁 team/                    # Team management
│   │   └── 📄 page.tsx
│   ├── 📁 uploads/                 # File uploads
│   │   └── 📄 page.tsx
│   ├── 📁 users/                   # User management
│   │   └── 📄 page.tsx
│   ├── 📁 vendors/                 # Vendor management
│   │   └── 📄 page.tsx
│   ├── 📄 layout.tsx               # Admin layout wrapper
│   ├── 📄 loading.tsx              # Admin loading component
│   └── 📄 page.tsx                 # Admin dashboard home
├── 📁 admin-2fa/                   # Two-factor authentication
│   └── 📄 page.tsx
├── 📁 ai-recommendation/           # AI recommendation system
│   └── 📄 page.tsx
├── 📁 api/                         # 🔌 API Routes (Server-side)
│   ├── 📁 admin/                   # Admin API endpoints
│   │   └── 📁 settings/
│   │       └── 📁 website/
│   │           └── 📄 route.ts
│   ├── 📁 auth/                    # Authentication endpoints
│   │   └── 📁 callback/
│   │       └── 📄 route.ts
│   ├── 📁 cart/                    # Cart operations
│   │   └── 📄 route.ts
│   ├── 📁 checkout/                # Checkout process
│   │   └── 📄 route.ts
│   ├── 📁 coupons/                 # Coupon operations
│   │   └── 📄 route.ts
│   ├── 📁 create-order/            # Order creation
│   │   └── 📄 route.ts
│   ├── 📁 health/                  # Health check endpoints
│   │   └── 📄 route.ts
│   ├── 📁 integrations/            # Third-party integrations
│   │   └── 📄 route.ts
│   ├── 📁 me/                      # Current user info
│   │   └── 📄 route.ts
│   ├── 📁 orders/                  # Order management
│   │   └── 📄 route.ts
│   ├── 📁 payments/                # Payment processing
│   │   ├── 📁 cashfree/
│   │   ├── 📁 razorpay/
│   │   └── 📁 stripe/
│   ├── 📁 products/                # Product operations
│   │   └── 📄 route.ts
│   ├── 📁 send-email/              # Email service
│   │   └── 📄 route.ts
│   ├── 📁 support/                 # Support system
│   │   └── 📄 route.ts
│   ├── 📁 uploads/                 # File upload handling
│   │   └── 📄 route.ts
│   ├── 📁 vendor/                  # Vendor API endpoints
│   │   └── 📄 route.ts
│   ├── 📁 verify-payment/          # Payment verification
│   │   └── 📄 route.ts
│   └── 📁 wishlist/                # Wishlist operations
│       └── 📄 route.ts
├── 📁 auth/                        # Authentication pages
│   └── 📁 callback/
│       └── 📄 page.tsx
├── 📁 cart/                        # 🛒 Shopping cart
│   └── 📄 page.tsx
├── 📁 checkout/                    # 💳 Checkout process
│   ├── 📁 cashfree-return/
│   │   └── 📄 page.tsx
│   ├── 📁 stripe-success/
│   │   └── 📄 page.tsx
│   └── 📄 page.tsx
├── 📁 contact/                     # Contact page
│   └── 📄 page.tsx
├── 📁 forgot-password/             # Password reset
│   └── 📄 page.tsx
├── 📁 login/                       # 🔐 Login page
│   └── 📄 page.tsx
├── 📁 orders/                      # 📋 Order management
│   ├── 📁 [orderId]/
│   │   └── 📄 page.tsx
│   └── 📄 page.tsx
├── 📁 pages/                       # 📄 CMS pages
│   └── 📁 [slug]/
│       └── 📄 page.tsx
├── 📁 privacy-policy/              # Privacy policy
│   └── 📄 page.tsx
├── 📁 products/                    # 🛍️ Product catalog
│   ├── 📁 [productId]/
│   │   └── 📄 page.tsx
│   ├── 📁 demo-structure/
│   │   └── 📄 page.tsx
│   └── 📄 page.tsx
├── 📁 reset-password/              # Password reset confirmation
│   └── 📄 page.tsx
├── 📁 search/                      # 🔍 Search results
│   └── 📄 page.tsx
├── 📁 signup/                      # 📝 User registration
│   └── 📄 page.tsx
├── 📁 terms-and-conditions/        # Terms of service
│   └── 📄 page.tsx
├── 📁 vendor/                      # 🏪 Vendor dashboard (protected)
│   ├── 📁 analytics/               # Vendor analytics
│   │   └── 📄 page.tsx
│   ├── 📁 customers/               # Vendor customers  
│   │   └── 📄 page.tsx
│   ├── 📁 dashboard/               # Vendor dashboard home
│   │   └── 📄 page.tsx
│   ├── 📁 inventory/               # Vendor inventory
│   │   └── 📄 page.tsx
│   ├── 📁 invoices/                # Vendor invoices
│   │   └── 📄 page.tsx
│   ├── 📁 messages/                # Vendor messages
│   │   └── 📄 page.tsx
│   ├── 📁 orders/                  # Vendor orders ⭐ RECENTLY IMPLEMENTED
│   │   └── 📄 page.tsx
│   ├── 📁 products/                # Vendor products ✅ COMPLETED
│   │   └── 📄 page.tsx
│   ├── 📁 reviews/                 # Product reviews
│   │   └── 📄 page.tsx
│   ├── 📁 settings/                # Vendor settings
│   │   └── 📄 page.tsx
│   ├── 📁 shipping/                # Shipping management
│   │   └── 📄 page.tsx
│   ├── 📁 wallet/                  # Vendor wallet
│   │   └── 📄 page.tsx
│   ├── 📄 layout.tsx               # Vendor layout wrapper
│   └── 📄 page.tsx                 # Vendor dashboard home
├── 📁 vendor-register/             # Vendor registration
│   └── 📄 page.tsx
├── 📁 vendors/                     # Public vendor pages
│   ├── 📁 [vendorId]/
│   │   └── 📄 page.tsx
│   ├── 📁 dashboard/
│   │   └── 📄 page.tsx
│   └── 📄 page.tsx
├── 📁 wishlist/                    # ❤️ User wishlist
│   └── 📄 page.tsx
├── 📄 error.tsx                    # Error page component
├── 📄 favicon.ico                  # Site favicon
├── 📄 globals.css                  # Global CSS styles
├── 📄 layout.tsx                   # Root layout component
├── 📄 loading.tsx                  # Global loading component
├── 📄 not-found.tsx               # 404 page component
└── 📄 page.tsx                    # Homepage component
```
---

## 4. Components Architecture

### 4.1 Complete Components Structure

```
components/
├── 📁 admin/                       # 👑 Admin-specific components
│   ├── 📄 admin-footer.tsx
│   ├── 📄 admin-shell.tsx         # Main admin layout wrapper
│   ├── 📄 admin-sidebar.tsx       # Admin navigation sidebar
│   ├── 📄 admin-topbar.tsx        # Admin header navigation
│   ├── 📄 dashboard-stats.tsx     # Admin dashboard statistics
│   ├── 📄 kpi-card.tsx           # Key performance indicator cards
│   ├── 📄 revenue-chart.tsx       # Revenue visualization
│   ├── 📄 product-form.tsx        # Product creation/editing
│   ├── 📄 order-status-updater.tsx # Order management
│   ├── 📄 user-role-updater.tsx   # User role management
│   ├── 📄 vendor-status-updater.tsx # Vendor approval
│   ├── 📄 website-settings-form.tsx # Site configuration ⭐ ACTIVE
│   └── ... (35+ admin components)
├── 📁 cart/                        # 🛒 Shopping cart components
│   └── 📄 cart-list.tsx
├── 📁 cms/                         # 📄 Content management components
│   └── 📄 cms-page-content.tsx
├── 📁 home/                        # 🏠 Homepage components
│   ├── 📄 category-strip.tsx
│   ├── 📄 everlane-home.tsx
│   ├── 📄 hero-section.tsx
│   ├── 📄 luxury-experience.tsx
│   ├── 📄 recently-viewed.tsx
│   └── 📄 trend-fashion-showcase.tsx
├── 📁 layout/                      # 📐 Layout components
│   ├── 📄 footer.tsx
│   ├── 📄 mobile-bottom-nav.tsx
│   ├── 📄 navbar.tsx
│   └── 📄 theme-toggle.tsx
├── 📁 product/                     # 🛍️ Product-related components
│   ├── 📄 add-to-cart-section.tsx
│   ├── 📄 product-card.tsx
│   ├── 📄 product-gallery.tsx
│   ├── 📄 product-grid.tsx
│   ├── 📄 recommended-products.tsx
│   ├── 📄 review-form.tsx
│   ├── 📄 review-list.tsx
│   └── 📄 track-product-view.tsx
├── 📁 providers/                   # 🔧 Context providers
│   ├── 📄 app-providers.tsx       # Main app providers wrapper
│   └── 📄 store-sync.tsx          # State synchronization
├── 📁 shared/                      # 🤝 Shared/common components
│   ├── 📄 empty-state.tsx
│   ├── 📄 login-auth-panel.tsx
│   ├── 📄 order-success-ticket.tsx
│   ├── 📄 order-tracker.tsx
│   ├── 📄 signup-auth-panel.tsx
│   └── 📄 vendor-signup-auth-panel.tsx
├── 📁 support/                     # 🎧 Customer support components
│   └── 📄 customer-support-widget.tsx
├── 📁 ui/                         # 🎨 Base UI components (shadcn/ui)
│   ├── 📄 badge.tsx
│   ├── 📄 button.tsx
│   ├── 📄 card.tsx
│   ├── 📄 checkbox.tsx
│   ├── 📄 dropdown-menu.tsx
│   ├── 📄 input.tsx
│   ├── 📄 select.tsx
│   ├── 📄 sheet.tsx
│   ├── 📄 table.tsx
│   ├── 📄 tabs.tsx
│   └── ... (20+ UI components)
└── 📁 vendor/                     # 🏪 Vendor-specific components
    ├── 📄 vendor-dashboard.tsx
    ├── 📄 vendor-shell.tsx        # Vendor layout wrapper
    ├── 📄 vendor-sidebar.tsx      # Vendor navigation
    ├── 📄 vendor-topbar.tsx       # Vendor header
    ├── 📄 vendor-analytics-content.tsx
    ├── 📄 vendor-orders-content.tsx ⭐ RECENTLY IMPLEMENTED
    ├── 📄 vendor-products-content.tsx ✅ COMPLETED
    └── ... (12+ vendor components)
```

### 4.2 Component Design Patterns

#### Layout Pattern (VendorShell)
```typescript
// Pattern used across all vendor pages
<VendorShell title="Page Title">
  <VendorPageContent />
</VendorShell>
```

#### Admin Shell Pattern
```typescript
// Pattern used across all admin pages
<AdminShell>
  <AdminPageContent />
</AdminShell>
```
---

## 5. API Structure

### 5.1 API Endpoints by Category

#### Authentication & User Management
```
POST   /api/auth/login              # User authentication
POST   /api/auth/signup             # User registration
POST   /api/auth/logout             # User logout
GET    /api/auth/callback           # OAuth callbacks
GET    /api/me                      # Current user profile
```

#### Admin APIs
```
GET    /api/admin/settings/website  # Website settings
POST   /api/admin/settings/website  # Update website settings
GET    /api/admin/users             # User management
GET    /api/admin/vendors           # Vendor management
GET    /api/admin/orders            # Order oversight
```

#### Product Management
```
GET    /api/products                # List products
GET    /api/products/[id]           # Single product
POST   /api/products                # Create product (vendor)
PUT    /api/products/[id]           # Update product (vendor)
DELETE /api/products/[id]           # Delete product (vendor)
```

#### Order Management
```
GET    /api/orders                  # List orders
GET    /api/orders/[id]             # Order details
POST   /api/create-order            # Create new order
PATCH  /api/orders/[id]/status      # Update order status (vendor)
```

#### Payment Processing
```
POST   /api/payments/razorpay       # Razorpay integration
POST   /api/payments/stripe         # Stripe integration
POST   /api/payments/cashfree       # Cashfree integration
POST   /api/verify-payment          # Payment verification
```

#### Vendor-Specific APIs
```
GET    /api/vendor/dashboard        # Vendor dashboard data
GET    /api/vendor/orders           # Vendor orders
GET    /api/vendor/products         # Vendor products
GET    /api/vendor/analytics        # Vendor analytics
GET    /api/vendor/wallet           # Vendor wallet
```

#### Support & Utility
```
POST   /api/send-email              # Email service
POST   /api/uploads                 # File upload handling
GET    /api/health                  # Health check
POST   /api/support                 # Support tickets
```
---

## 6. Authentication & Authorization

### 6.1 Authentication Flow
```typescript
// Authentication Stack
Firebase Auth → JWT Tokens → Next.js Middleware → Route Protection

// User Roles
type UserRole = 'customer' | 'vendor' | 'admin';

// Protected Routes
const CUSTOMER_ROUTES = ['/account', '/orders', '/wishlist'];
const VENDOR_ROUTES = ['/vendor/*'];  
const ADMIN_ROUTES = ['/admin/*'];
```

### 6.2 Middleware Protection
```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  const session = request.cookies.get('friendlydrop_session')?.value;
  const { pathname } = request.nextUrl;
  
  // Route-based protection logic
  if (pathname.startsWith('/admin') && !hasAdminRole(session)) {
    return redirect('/login');
  }
  
  if (pathname.startsWith('/vendor') && !hasVendorRole(session)) {
    return redirect('/vendor-register');
  }
}
```

---

## 7. Database Schema

### 7.1 Core Data Models

#### Users & Profiles
```sql
-- User authentication
users (id, email, password_hash, role, status, created_at)

-- Vendor profiles
vendor_profiles (id, user_id, business_name, store_name, kyc_status, verification_status)

-- Customer profiles  
customer_profiles (id, user_id, first_name, last_name, phone, address)
```

#### Product Catalog
```sql
-- Products
products (id, vendor_id, name, description, category_id, status, created_at)

-- Product variants
product_variants (id, product_id, color, size, sku, price, stock_quantity)

-- Product media
product_images (id, product_id, image_url, display_order, is_primary)
product_videos (id, product_id, video_url, thumbnail_url)
```
#### Order Management
```sql
-- Orders
orders (id, order_number, customer_id, vendor_id, status, total_amount, created_at)

-- Order items
order_items (id, order_id, product_id, variant_id, quantity, unit_price)

-- Order timeline
order_timeline (id, order_id, status, timestamp, notes)
```

#### Financial Management
```sql
-- Vendor wallet
vendor_wallet (id, vendor_id, balance, total_earnings, pending_payouts)

-- Wallet transactions
wallet_transactions (id, vendor_id, type, amount, description, running_balance)

-- Payouts
payouts (id, vendor_id, amount, status, requested_at, completed_at)
```

---

## 8. Configuration Files

### 8.1 Next.js Configuration
```javascript
// next.config.mjs
const nextConfig = {
  experimental: {
    appDir: true,
  },
  images: {
    domains: ['example.com'],
  },
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
};
```

### 8.2 TypeScript Configuration
```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "es5",
    "lib": ["dom", "dom.iterable", "es6"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{"name": "next"}],
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```
### 8.3 Tailwind Configuration
```typescript
// tailwind.config.ts
import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'electric-blue': '#0064FF',
        'vibrant-purple': '#7C3AED',
        'coral-red': '#FF6B6B',
        'emerald-green': '#10B981',
      },
    },
  },
  plugins: [],
}
```

---

## 9. Development & Deployment

### 9.1 Development Structure
```
Development Workflow:
├── 📁 deployment-scripts/      # Deployment automation
├── 📁 scripts/                 # Database & utility scripts  
├── 📁 docs/                    # Project documentation
├── 📄 .env.local               # Local environment variables
├── 📄 .env.example             # Environment template
└── 📄 package.json             # Dependencies & scripts
```

### 9.2 Key Scripts
```json
// package.json scripts
{
  "scripts": {
    "dev": "next dev",
    "build": "next build", 
    "start": "next start",
    "lint": "next lint",
    "type-check": "tsc --noEmit"
  }
}
```

### 9.3 Environment Variables
```bash
# .env.local
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
FIREBASE_PRIVATE_KEY=
FIREBASE_CLIENT_EMAIL=
DATABASE_URL=
NEXTAUTH_SECRET=
RAZORPAY_KEY_ID=
STRIPE_SECRET_KEY=
```
---

## 10. Tech Stack & Dependencies

### 10.1 Core Technologies
```json
{
  "frontend": {
    "framework": "Next.js 14 (App Router)",
    "language": "TypeScript",
    "styling": "Tailwind CSS",
    "components": "shadcn/ui",
    "state": "Zustand"
  },
  "backend": {
    "runtime": "Node.js",
    "framework": "Next.js API Routes",
    "database": "Firebase Firestore",
    "auth": "Firebase Auth",
    "storage": "Firebase Storage"
  },
  "payments": {
    "gateways": ["Razorpay", "Stripe", "Cashfree"],
    "processing": "Server-side verification"
  },
  "deployment": {
    "hosting": "Vercel/Firebase Hosting",
    "cdn": "Firebase CDN",
    "monitoring": "Custom monitoring"
  }
}
```

### 10.2 Key Dependencies
```json
// package.json (key dependencies)
{
  "dependencies": {
    "next": "^14.x.x",
    "react": "^18.x.x", 
    "typescript": "^5.x.x",
    "tailwindcss": "^3.x.x",
    "firebase": "^10.x.x",
    "zustand": "^4.x.x",
    "@radix-ui/react-*": "^1.x.x",
    "lucide-react": "^0.x.x"
  },
  "devDependencies": {
    "@types/node": "^20.x.x",
    "@types/react": "^18.x.x",
    "eslint": "^8.x.x",
    "eslint-config-next": "^14.x.x"
  }
}
```

---

## 11. Current Implementation Status

### 11.1 Completed Features
- ✅ **Authentication System**: Firebase Auth integration
- ✅ **Admin Dashboard**: Full admin panel with 25+ pages
- ✅ **Customer Features**: Product browsing, cart, checkout, orders
- ✅ **Vendor Registration**: KYC verification workflow
- ✅ **Vendor Products**: Product management (CRUD operations)
- ✅ **Vendor Orders**: Order management with status tracking ⭐ RECENT
- ✅ **Payment Integration**: Razorpay, Stripe, Cashfree
- ✅ **Responsive Design**: Mobile-first approach
- ✅ **UI Component System**: shadcn/ui based design system
### 11.2 In Progress / Pending
- 🟡 **Vendor Inventory**: Stock management system (Task 3)
- 🟡 **Vendor Customers**: Customer management (Task 4)
- 🟡 **Vendor Wallet**: Financial tracking (Task 5)
- 🟡 **Vendor Analytics**: Performance metrics (Task 6)
- 🟡 **Vendor Settings**: Profile customization (Task 7)
- 🟡 **Final Verification**: Cross-page testing (Task 8)

### 11.3 Vendor Dashboard Progress
**Total: 8 Tasks | Completed: 2/8 (25%)**
- ✅ Task 1: Vendor Products Page
- ✅ Task 2: Vendor Orders Page  
- 🟡 Tasks 3-8: Remaining vendor pages

---

## 12. File Naming Conventions

### 12.1 Pages
```
Pattern: app/[section]/page.tsx
Examples:
- app/admin/dashboard/page.tsx
- app/vendor/orders/page.tsx
- app/products/[productId]/page.tsx
```

### 12.2 API Routes
```
Pattern: app/api/[endpoint]/route.ts
Examples:
- app/api/auth/login/route.ts
- app/api/products/route.ts
- app/api/admin/settings/website/route.ts
```

### 12.3 Components
```
Patterns:
- components/[category]/[component-name].tsx
- components/vendor/vendor-[section]-content.tsx
- components/admin/admin-[component].tsx
- components/ui/[ui-component].tsx
```

### 12.4 Layouts
```
Patterns:
- app/layout.tsx (root layout)
- app/admin/layout.tsx (admin layout)
- app/vendor/layout.tsx (vendor layout)
```
---

## 13. Library & Utilities Structure

### 13.1 Lib Directory
```
lib/
├── 📁 admin/                   # Admin utilities
│   └── 📄 logs.ts             # Admin logging system
├── 📁 auth/                    # Authentication utilities
│   ├── 📄 api.ts              # Auth API helpers
│   └── 📄 session.ts          # Session management
├── 📁 firebase/                # Firebase configuration
│   ├── 📄 admin.ts            # Firebase Admin SDK
│   ├── 📄 client.ts           # Firebase Client SDK
│   ├── 📄 firestore.ts        # Firestore database operations
│   └── 📄 vendor.ts           # Vendor-specific Firebase ops
├── 📁 integrations/            # Third-party integrations
├── 📁 payments/                # Payment gateways
│   ├── 📄 cashfree.ts         # Cashfree integration
│   ├── 📄 razorpay.ts         # Razorpay integration
│   └── 📄 stripe.ts           # Stripe integration
├── 📁 security/                # Security utilities
│   ├── 📄 idempotency.ts      # Request idempotency
│   ├── 📄 rate-limit.ts       # Rate limiting
│   └── 📄 request-guards.ts   # Request validation
├── 📁 storage/                 # File storage
│   └── 📄 oqens.ts            # Storage service integration
├── 📄 app-url.ts              # URL utilities
├── 📄 automation-engine.ts    # Automation system
├── 📄 cache.ts                # Caching utilities
├── 📄 checkout-pricing.ts     # Pricing calculations
├── 📄 constants.ts            # Application constants
├── 📄 control-tower.ts        # System monitoring
├── 📄 email.ts                # Email utilities
├── 📄 enterprise.ts           # Enterprise features
├── 📄 media.ts                # Media handling
├── 📄 mock-data.ts            # Development mock data
├── 📄 notifications.ts        # Notification system
├── 📄 product-page-builder.ts # Dynamic page builder
├── 📄 rbac.ts                 # Role-based access control
├── 📄 resend.ts               # Resend email service
├── 📄 settings-engine.ts      # Settings management
├── 📄 support-bot.ts          # Customer support automation
├── 📄 system-events.ts        # Event system
├── 📄 utils.ts                # General utilities
└── 📄 validators.ts           # Input validation schemas
```

### 13.2 Hooks Directory
```
hooks/
├── 📄 use-auth.tsx            # Authentication hook
├── 📄 use-debounce.ts         # Debouncing utility
├── 📄 use-mobile.ts           # Mobile detection
└── 📄 use-order-tracking.ts   # Order tracking functionality
```

### 13.3 Store Directory (State Management)
```
store/
├── 📄 use-cart-store.ts       # Shopping cart state (Zustand)
├── 📄 use-recently-viewed-store.ts # Recently viewed products
└── 📄 use-wishlist-store.ts   # User wishlist state
```

### 13.4 Types Directory
```
types/
└── 📄 index.ts                # TypeScript type definitions
```
---

## 14. Specification & Documentation Files

### 14.1 Kiro Specifications
```
.kiro/specs/vendor-dashboard/
├── 📄 .config.kiro            # Spec configuration
├── 📄 requirements.md         # Detailed requirements (19 requirements)
├── 📄 design.md               # Technical architecture & UI design
└── 📄 tasks.md                # Implementation tasks (8 tasks)
```

### 14.2 Agent Configurations
```
.claude/
├── 📁 agents/kfc/             # Spec agent configurations
│   ├── 📄 spec-design.md
│   ├── 📄 spec-impl.md
│   ├── 📄 spec-judge.md
│   ├── 📄 spec-requirements.md
│   ├── 📄 spec-system-prompt-loader.md
│   ├── 📄 spec-tasks.md
│   └── 📄 spec-test.md
├── 📁 settings/
│   └── 📄 kfc-settings.json
├── 📁 specs/                  # Spec documents
└── 📁 system-prompts/         # System prompt templates
    └── 📄 spec-workflow-starter.md
```

### 14.3 Documentation Files
```
📄 COMPLETE_PROJECT_STRUCTURE_DOCUMENTATION.md  # This document
📄 FRIENDLYDROP_DOCUMENTATION.md                 # Working flow & file structure
📄 VENDOR_DASHBOARD_IMPLEMENTATION_STATUS.md     # Current vendor dashboard status
📄 QUICK_DEPLOYMENT_SUMMARY.md                   # Deployment guide
📄 AGENTS.md                                      # Agent configuration guide
```

---

## 15. Security & Performance

### 15.1 Security Features
```typescript
// Security measures implemented
- Firebase Authentication with JWT tokens
- Role-based access control (RBAC)
- Request validation and sanitization
- Rate limiting on API endpoints
- HTTPS enforcement
- CORS configuration
- Input validation schemas
- SQL injection prevention (Firestore NoSQL)
- XSS protection headers
- CSRF protection
```

### 15.2 Performance Optimizations
```typescript
// Performance features
- Next.js 14 App Router (faster routing)
- Static site generation (SSG) for public pages
- Server-side rendering (SSR) for dynamic content
- Image optimization with Next.js Image component
- Code splitting and lazy loading
- Caching strategies (Redis-compatible)
- CDN integration for static assets
- Database query optimization
- Bundle size optimization
```