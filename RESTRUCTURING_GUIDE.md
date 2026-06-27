# FriendlyDrop Multi-App Architecture

This document explains the restructured FriendlyDrop platform that has been split into three separate applications for better scalability, security, and maintainability.

## Architecture Overview

The monolithic application has been restructured into three independent Next.js applications:

```
friendlydrop.in (Main Website)
├── Customer-facing website
├── Product browsing and shopping
├── Customer dashboard
└── Authentication hub

vendor.friendlydrop.in (Vendor Dashboard)
├── Vendor store management
├── Product CRUD operations
├── Order fulfillment
├── Inventory management
├── Analytics and reporting
└── Earnings tracking

admin.friendlydrop.in (Admin Dashboard)
├── Platform administration
├── User and vendor management
├── Content moderation
├── Financial oversight
└── System configuration
```

## Applications Structure

### 1. Main Website (`/main-website/`)
- **Domain**: friendlydrop.in, www.friendlydrop.in
- **Port**: 3000 (development)
- **Purpose**: Customer-facing storefront and authentication hub

**Features:**
- Homepage and product catalog
- Shopping cart and checkout
- Customer account dashboard
- Authentication with role-based redirects
- Order tracking and management

### 2. Vendor Dashboard (`/vendor-dashboard/`)
- **Domain**: vendor.friendlydrop.in
- **Port**: 3002 (development)
- **Purpose**: Complete vendor store management

**Features:**
- Product management (CRUD)
- Order processing and fulfillment
- Inventory tracking
- Customer relationship management
- Financial dashboard and payouts
- Store analytics and performance metrics

### 3. Admin Dashboard (`/admin-dashboard/`)
- **Domain**: admin.friendlydrop.in
- **Port**: 3001 (development)
- **Purpose**: Platform administration and oversight

**Features:**
- User and vendor management
- Product approval and moderation
- Platform-wide analytics
- Content management system
- Financial reporting and controls
- System configuration

## Authentication & Single Sign-On (SSO)

### Authentication Flow

1. **Login Hub**: All authentication happens on the main website (`friendlydrop.in/login`)
2. **Role Detection**: After successful login, the system determines the user's role
3. **Automatic Redirect**: Users are automatically redirected to their appropriate portal:
   - Customer → `friendlydrop.in/account`
   - Vendor → `vendor.friendlydrop.in/dashboard`
   - Admin → `admin.friendlydrop.in/dashboard`

### Shared Authentication

- **Cookies**: HTTP-only cookies work across all subdomains (`.friendlydrop.in`)
- **Session Management**: Single session token works across all applications
- **Logout**: Logging out from any portal logs out from all portals

### Security

- JWT tokens with appropriate expiration
- Role-based access control (RBAC)
- Cross-domain cookie security
- HTTPS enforced in production
- CSP headers for XSS protection

## API Structure

Each application has its own API endpoints organized by domain:

### Main Website APIs (`/api/`)
- `/api/auth/*` - Authentication endpoints
- `/api/customer/*` - Customer-specific operations
- `/api/cart/*` - Shopping cart management
- `/api/checkout/*` - Checkout process
- `/api/orders/*` - Order management (customer view)
- `/api/products/*` - Product browsing
- `/api/wishlist/*` - Wishlist management
- `/api/payments/*` - Payment processing

### Vendor Dashboard APIs (`/api/`)
- `/api/auth/*` - Authentication endpoints
- `/api/vendor/*` - Vendor-specific operations
  - Product CRUD operations
  - Order management (vendor view)
  - Inventory management
  - Financial operations
  - Analytics and reporting

### Admin Dashboard APIs (`/api/`)
- `/api/auth/*` - Authentication endpoints
- `/api/admin/*` - Admin-specific operations
  - User management
  - Vendor oversight
  - Product moderation
  - Platform analytics
  - System configuration

## Deployment Guide

### Local Development

1. **Setup Hosts File**:
   ```
   # Add to /etc/hosts (macOS/Linux) or C:\Windows\System32\drivers\etc\hosts (Windows)
   127.0.0.1  localhost
   127.0.0.1  vendor.localhost
   127.0.0.1  admin.localhost
   ```

2. **Start All Applications**:
   ```bash
   # Terminal 1 - Main Website
   cd main-website
   npm install && npm run dev

   # Terminal 2 - Vendor Dashboard
   cd vendor-dashboard
   npm install && npm run dev

   # Terminal 3 - Admin Dashboard
   cd admin-dashboard
   npm install && npm run dev
   ```

3. **Access Applications**:
   - Main Website: http://localhost:3000
   - Vendor Dashboard: http://vendor.localhost:3002
   - Admin Dashboard: http://admin.localhost:3001

### Production Deployment

Each application should be deployed separately:

1. **Main Website**:
   - Deploy to serve `friendlydrop.in` and `www.friendlydrop.in`
   - Configure DNS A records to point to the main website server

2. **Vendor Dashboard**:
   - Deploy to serve `vendor.friendlydrop.in`
   - Configure DNS CNAME record: `vendor.friendlydrop.in → vendor-app-server.com`

3. **Admin Dashboard**:
   - Deploy to serve `admin.friendlydrop.in`
   - Configure DNS CNAME record: `admin.friendlydrop.in → admin-app-server.com`

### Environment Variables

Each application needs its own `.env.local` file with:

- Firebase configuration
- Authentication secrets
- Database connection strings
- Third-party API keys
- Domain-specific settings

## Database Schema

**No changes required!** All applications share the same database schema and backend services.

## Benefits of This Architecture

### 1. **Scalability**
- Each application can be scaled independently
- Separate deployment pipelines
- Independent resource allocation

### 2. **Security**
- Domain isolation prevents cross-contamination
- Role-based application access
- Reduced attack surface per application

### 3. **Performance**
- Smaller bundle sizes per application
- Faster build times
- Targeted optimizations

### 4. **Maintainability**
- Clear separation of concerns
- Easier code organization
- Independent feature development

### 5. **Team Productivity**
- Parallel development on different portals
- Reduced merge conflicts
- Specialized team focus

## Migration Notes

### What Changed:
- ✅ Split into three separate Next.js applications
- ✅ Subdomain-based routing
- ✅ Shared authentication system
- ✅ Domain-specific API endpoints

### What Stayed the Same:
- ✅ All existing UI components and styling
- ✅ Database schema and data models
- ✅ Business logic and functionality
- ✅ User experience and workflows

### Testing the Migration:

1. **Authentication Flow**:
   - Test login from main website
   - Verify role-based redirects work
   - Confirm SSO across subdomains

2. **Feature Parity**:
   - All vendor features work on vendor subdomain
   - All admin features work on admin subdomain
   - Customer features work on main website

3. **API Functionality**:
   - Verify all API endpoints respond correctly
   - Test cross-domain requests
   - Confirm data consistency

## Troubleshooting

### Common Issues:

1. **Subdomain Access Issues**:
   - Check hosts file configuration
   - Verify DNS settings in production
   - Ensure ports are correctly configured

2. **Authentication Problems**:
   - Check cookie domain settings
   - Verify session token validity
   - Confirm CORS configuration

3. **API Connectivity**:
   - Verify environment variables
   - Check API endpoint paths
   - Confirm database connectivity

### Support:

For issues with the restructured architecture, check:
1. Individual application README files
2. API endpoint documentation
3. Authentication flow diagrams
4. Deployment configuration guides

## Future Enhancements

This architecture enables:
- Microservices migration
- Independent technology stack choices
- Advanced caching strategies
- CDN optimization per domain
- Mobile app backend separation