#!/bin/bash

# FriendlyDrop Admin Dashboard Deployment Script

echo "🚀 Starting Admin Dashboard Deployment..."

# Navigate to admin dashboard directory
cd admin-dashboard

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
# aws s3 sync .next s3://your-admin-dashboard-bucket
# aws cloudfront create-invalidation --distribution-id YOUR_ADMIN_DISTRIBUTION_ID --paths "/*"

# Example for custom server
# rsync -avz --delete .next/ user@server:/var/www/admin.friendlydrop.in/
# ssh user@server "pm2 restart admin-dashboard"

echo "✅ Admin Dashboard deployment completed!"
echo "⚡ Available at: https://admin.friendlydrop.in"