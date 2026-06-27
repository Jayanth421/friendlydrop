# FriendlyDrop Main Website

This is the main customer-facing website for FriendlyDrop (friendlydrop.in).

## Features

- Customer homepage and product browsing
- Customer dashboard and account management
- Shopping cart and checkout
- Order tracking and management
- User authentication with role-based redirects

## Authentication Flow

- Customer login → Stay on main website (`/account`)
- Vendor login → Redirect to `https://vendor.friendlydrop.in/dashboard`
- Admin login → Redirect to `https://admin.friendlydrop.in/dashboard`

## Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

The app will be available at http://localhost:3000

## Environment Variables

Copy `.env.example` to `.env.local` and configure:

- Firebase configuration
- Authentication settings
- Payment gateway keys
- Other required environment variables

## Deployment

This application should be deployed to serve the main domain (`friendlydrop.in` and `www.friendlydrop.in`).

### Subdomain Configuration

For local development, add these entries to your hosts file:

```
127.0.0.1  localhost
127.0.0.1  app.localhost
```

## API Endpoints

This application includes only customer-facing APIs:

- `/api/auth/*` - Authentication endpoints
- `/api/cart/*` - Shopping cart management
- `/api/checkout/*` - Checkout process
- `/api/orders/*` - Order management
- `/api/products/*` - Product browsing
- `/api/wishlist/*` - Wishlist management
- `/api/payments/*` - Payment processing