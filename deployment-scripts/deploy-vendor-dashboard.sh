#!/bin/bash

# FriendlyDrop Vendor Dashboard Deployment Script

echo "🚀 Starting Vendor Dashboard Deployment..."

# Navigate to vendor dashboard directory
cd vendor-dashboard

# Install dependencies
echo "📦 Installing dependencies..."
npm ci --only=production

# Build the application
echo "🔨 Building application..."
npm run build

# Run tests (optional)
echo "🧪 Running tests..."
npm run test --if-present

# Deploy to your hosting platform
echo "🌐 Deploying to production..."

# Example for Vercel
# vercel --prod --confirm

# Example for Netlify
# netlify deploy --prod --dir=.next

# Example for AWS S3 + CloudFront
# aws s3 sync .next s3://your-vendor-dashboard-bucket
# aws cloudfront create-invalidation --distribution-id YOUR_VENDOR_DISTRIBUTION_ID --paths "/*"

# Example for custom server
# rsync -avz --delete .next/ user@server:/var/www/vendor.friendlydrop.in/
# ssh user@server "pm2 restart vendor-dashboard"

echo "✅ Vendor Dashboard deployment completed!"
echo "🏪 Available at: https://vendor.friendlydrop.in"