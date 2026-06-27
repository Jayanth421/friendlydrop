# FriendlyDrop Vendor Dashboard

This is the vendor dashboard for FriendlyDrop (vendor.friendlydrop.in).

## Features

- Vendor product management (CRUD operations)
- Order management and fulfillment
- Inventory tracking and management
- Customer relationship management
- Wallet and earnings tracking
- Analytics and reporting
- Store settings and customization

## Getting Started

```bash
# Install dependencies
npm install

# Run development server (on port 3002)
npm run dev
```

The app will be available at http://localhost:3002

## Environment Variables

Copy `.env.example` to `.env.local` and configure:

- Firebase configuration
- Authentication settings
- Vendor-specific APIs
- Other required environment variables

## Authentication

Vendors are authenticated via the main website login. Once authenticated as a vendor, they are redirected to this subdomain.

## Deployment

This application should be deployed to serve the vendor subdomain (`vendor.friendlydrop.in`).

### Local Development

For local development, add this entry to your hosts file:

```
127.0.0.1  vendor.localhost
```

Then visit http://vendor.localhost:3002

## API Endpoints

This application includes vendor-specific APIs:

- `/api/auth/*` - Authentication endpoints
- `/api/vendor/*` - Vendor-specific operations
- `/api/health/*` - Health check endpoints

## Pages Structure

- `/dashboard` - Main vendor dashboard
- `/products` - Product management
- `/orders` - Order management
- `/inventory` - Stock management
- `/customers` - Customer management
- `/wallet` - Financial tracking
- `/analytics` - Business analytics
- `/settings` - Store configuration