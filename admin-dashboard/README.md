# FriendlyDrop Admin Dashboard

This is the admin dashboard for FriendlyDrop (admin.friendlydrop.in).

## Features

- Platform-wide analytics and reporting
- User and vendor management
- Product approval and moderation
- Order oversight and support
- Content management system
- Platform settings and configuration
- Financial reporting and payouts

## Getting Started

```bash
# Install dependencies
npm install

# Run development server (on port 3001)
npm run dev
```

The app will be available at http://localhost:3001

## Environment Variables

Copy `.env.example` to `.env.local` and configure:

- Firebase configuration
- Authentication settings
- Admin-specific APIs
- Other required environment variables

## Authentication

Admins are authenticated via the main website login. Once authenticated as an admin, they are redirected to this subdomain.

## Deployment

This application should be deployed to serve the admin subdomain (`admin.friendlydrop.in`).

### Local Development

For local development, add this entry to your hosts file:

```
127.0.0.1  admin.localhost
```

Then visit http://admin.localhost:3001

## API Endpoints

This application includes admin-specific APIs:

- `/api/auth/*` - Authentication endpoints
- `/api/admin/*` - Admin-specific operations
- `/api/health/*` - Health check endpoints

## Pages Structure

- `/dashboard` - Main admin dashboard
- `/users` - User management
- `/vendors` - Vendor management
- `/products` - Product oversight
- `/orders` - Order management
- `/analytics` - Platform analytics
- `/settings` - Platform configuration
- `/finance` - Financial management
- `/support` - Customer support tools