# Vercel Deployment Guide for FriendlyDrop

This guide will help you deploy the three restructured FriendlyDrop applications to Vercel with proper subdomain configuration.

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **Vercel CLI**: Install globally with `npm i -g vercel`
3. **Domain Access**: You need DNS control for `friendlydrop.in`
4. **Git Repository**: Code should be pushed to a Git repository (GitHub, GitLab, etc.)

## Deployment Strategy

We'll create **three separate Vercel projects** for each application:

- `friendlydrop-main-website` → `friendlydrop.in`, `www.friendlydrop.in`
- `friendlydrop-vendor-dashboard` → `vendor.friendlydrop.in`
- `friendlydrop-admin-dashboard` → `admin.friendlydrop.in`

## Step 1: Push Code to Git Repository

```bash
# Make sure all changes are committed
git add .
git commit -m "Prepare for Vercel deployment"
git push origin main
```

## Step 2: Deploy Applications to Vercel

### Option A: Using Vercel Dashboard (Recommended)

1. **Login to Vercel Dashboard**: Go to [vercel.com/dashboard](https://vercel.com/dashboard)

2. **Import each project separately**:

#### Main Website Deployment

1. Click "Add New..." → "Project"
2. Import your Git repository
3. **Configure build settings**:
   - **Framework Preset**: Next.js
   - **Root Directory**: `main-website`
   - **Build Command**: `cd main-website && npm run build`
   - **Output Directory**: `main-website/.next`
   - **Install Command**: `cd main-website && npm install`

4. **Add Environment Variables** (copy from `main-website/.env.example`):
   ```
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
   NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef
   FIREBASE_ADMIN_PRIVATE_KEY=your_private_key
   FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk@your_project.iam.gserviceaccount.com
   FIREBASE_ADMIN_PROJECT_ID=your_project_id
   JWT_SECRET=your_jwt_secret_key
   NEXTAUTH_SECRET=your_nextauth_secret
   NEXTAUTH_URL=https://friendlydrop.in
   RAZORPAY_KEY_ID=rzp_live_key
   RAZORPAY_KEY_SECRET=rzp_live_secret
   STRIPE_PUBLISHABLE_KEY=pk_live_key
   STRIPE_SECRET_KEY=sk_live_secret
   RESEND_API_KEY=your_resend_api_key
   NEXT_PUBLIC_APP_URL=https://friendlydrop.in
   NEXT_PUBLIC_VENDOR_URL=https://vendor.friendlydrop.in
   NEXT_PUBLIC_ADMIN_URL=https://admin.friendlydrop.in
   NODE_ENV=production
   ```

5. **Deploy**: Click "Deploy"

#### Vendor Dashboard Deployment

1. Create new project in Vercel Dashboard
2. Import the same repository
3. **Configure build settings**:
   - **Framework Preset**: Next.js
   - **Root Directory**: `vendor-dashboard`
   - **Build Command**: `cd vendor-dashboard && npm run build`
   - **Output Directory**: `vendor-dashboard/.next`
   - **Install Command**: `cd vendor-dashboard && npm install`

4. **Add Environment Variables** (copy from `vendor-dashboard/.env.example`):
   ```
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
   NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef
   FIREBASE_ADMIN_PRIVATE_KEY=your_private_key
   FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk@your_project.iam.gserviceaccount.com
   FIREBASE_ADMIN_PROJECT_ID=your_project_id
   JWT_SECRET=your_jwt_secret_key
   NEXTAUTH_SECRET=your_nextauth_secret
   NEXTAUTH_URL=https://vendor.friendlydrop.in
   NEXT_PUBLIC_APP_URL=https://friendlydrop.in
   NEXT_PUBLIC_VENDOR_URL=https://vendor.friendlydrop.in
   NEXT_PUBLIC_ADMIN_URL=https://admin.friendlydrop.in
   NODE_ENV=production
   ```

5. **Deploy**: Click "Deploy"

#### Admin Dashboard Deployment

1. Create new project in Vercel Dashboard
2. Import the same repository
3. **Configure build settings**:
   - **Framework Preset**: Next.js
   - **Root Directory**: `admin-dashboard`
   - **Build Command**: `cd admin-dashboard && npm run build`
   - **Output Directory**: `admin-dashboard/.next`
   - **Install Command**: `cd admin-dashboard && npm install`

4. **Add Environment Variables** (copy from `admin-dashboard/.env.example`):
   ```
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
   NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef
   FIREBASE_ADMIN_PRIVATE_KEY=your_private_key
   FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk@your_project.iam.gserviceaccount.com
   FIREBASE_ADMIN_PROJECT_ID=your_project_id
   JWT_SECRET=your_jwt_secret_key
   NEXTAUTH_SECRET=your_nextauth_secret
   NEXTAUTH_URL=https://admin.friendlydrop.in
   RESEND_API_KEY=your_resend_api_key
   NEXT_PUBLIC_APP_URL=https://friendlydrop.in
   NEXT_PUBLIC_VENDOR_URL=https://vendor.friendlydrop.in
   NEXT_PUBLIC_ADMIN_URL=https://admin.friendlydrop.in
   NODE_ENV=production
   ```

5. **Deploy**: Click "Deploy"

### Option B: Using Vercel CLI

```bash
# Login to Vercel
vercel login

# Deploy Main Website
cd main-website
vercel --prod --confirm
# Follow prompts to configure project

# Deploy Vendor Dashboard
cd ../vendor-dashboard
vercel --prod --confirm

# Deploy Admin Dashboard
cd ../admin-dashboard
vercel --prod --confirm
```

## Step 3: Configure Custom Domains

After deployment, you'll get Vercel URLs like:
- `friendly-main-website-abc123.vercel.app`
- `friendly-vendor-dashboard-def456.vercel.app`
- `friendly-admin-dashboard-ghi789.vercel.app`

### Add Custom Domains in Vercel Dashboard

#### Main Website Domain Configuration

1. Go to your main website project in Vercel Dashboard
2. Navigate to **Settings** → **Domains**
3. Add domains:
   - `friendlydrop.in`
   - `www.friendlydrop.in`
4. Vercel will provide DNS configuration instructions

#### Vendor Dashboard Domain Configuration

1. Go to your vendor dashboard project in Vercel Dashboard
2. Navigate to **Settings** → **Domains**
3. Add domain: `vendor.friendlydrop.in`
4. Note the DNS configuration provided

#### Admin Dashboard Domain Configuration

1. Go to your admin dashboard project in Vercel Dashboard
2. Navigate to **Settings** → **Domains**  
3. Add domain: `admin.friendlydrop.in`
4. Note the DNS configuration provided

## Step 4: Configure DNS

Update your DNS settings where your domain is registered:

```
# Main Domain
A     friendlydrop.in           76.76.19.61 (Vercel's IP)
CNAME www.friendlydrop.in       friendly-main-website-abc123.vercel.app

# Subdomains  
CNAME vendor.friendlydrop.in    friendly-vendor-dashboard-def456.vercel.app
CNAME admin.friendlydrop.in     friendly-admin-dashboard-ghi789.vercel.app
```

**Note**: Replace the example URLs with your actual Vercel deployment URLs.

## Step 5: SSL Certificate Configuration

Vercel automatically provides SSL certificates for custom domains. After DNS propagation:

1. Wait 24-48 hours for DNS to propagate
2. SSL certificates will be issued automatically
3. Verify HTTPS works for all domains

## Step 6: Test the Deployment

### Authentication Flow Test

1. **Visit Main Website**: https://friendlydrop.in
2. **Login with different roles**:
   - Customer → Should stay on https://friendlydrop.in/account
   - Vendor → Should redirect to https://vendor.friendlydrop.in/dashboard
   - Admin → Should redirect to https://admin.friendlydrop.in/dashboard

### Cross-Domain Authentication Test

1. Login on main website
2. Navigate directly to vendor subdomain
3. Verify you're automatically authenticated
4. Test logout from any domain logs out everywhere

### Functionality Test

- ✅ Customer features work on main website
- ✅ Vendor features work on vendor subdomain  
- ✅ Admin features work on admin subdomain
- ✅ API endpoints respond correctly
- ✅ Database operations work

## Environment Variables Checklist

### Required for All Apps:
- Firebase configuration (API keys, project ID, etc.)
- Firebase Admin SDK credentials
- JWT secret and NextAuth configuration
- Application URLs (production domains)

### Main Website Specific:
- Payment gateway credentials (Razorpay, Stripe)
- Email service credentials (Resend)

### Admin Dashboard Specific:  
- Email service for admin notifications
- Admin analytics API URLs

## Troubleshooting

### Common Issues:

1. **Build Failures**:
   - Check that build commands point to correct directories
   - Verify all dependencies are in package.json
   - Check environment variables are set correctly

2. **Domain Configuration Issues**:
   - Verify DNS records are correct
   - Wait for DNS propagation (up to 48 hours)
   - Check SSL certificate status in Vercel Dashboard

3. **Authentication Problems**:
   - Ensure JWT_SECRET is the same across all apps
   - Verify NEXTAUTH_URL matches the deployment domain
   - Check Firebase configuration is correct

4. **Cross-Domain Issues**:
   - Verify cookie domain is set to `.friendlydrop.in`
   - Check CORS configuration
   - Ensure all app URLs are correctly configured

### Getting Help:

- Check Vercel deployment logs in the Dashboard
- Use Vercel's support if domain issues persist
- Test locally first with subdomain setup
- Verify environment variables match between local and production

## Production Checklist

Before going live:

- [ ] All three applications deploy successfully
- [ ] Custom domains are configured and working
- [ ] SSL certificates are active
- [ ] Environment variables are set (use production credentials)
- [ ] Authentication flow works across all domains
- [ ] Database operations are working
- [ ] Payment gateways are configured with live keys
- [ ] Email service is working
- [ ] All API endpoints are responding correctly
- [ ] Cross-domain authentication is working
- [ ] Performance testing completed

## Monitoring & Maintenance

### Analytics Setup:
- Configure Vercel Analytics for each project
- Set up error monitoring (e.g., Sentry)
- Monitor performance metrics

### Updates:
- Each application can be updated independently
- Use Git-based deployments for automatic updates
- Test changes in staging environment first

## Cost Estimation (Vercel Pro)

- **3 Projects**: ~$60/month for Vercel Pro (3 projects × $20)
- **Custom Domains**: Free with Pro plan
- **SSL Certificates**: Free
- **Bandwidth**: Based on usage
- **Build Minutes**: Based on deployment frequency

This architecture provides independent scaling, better security, and improved maintainability while preserving all existing functionality.