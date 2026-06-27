#!/bin/bash

# FriendlyDrop Main Website Deployment Script

echo "🚀 Starting Main Website Deployment..."

# Navigate to main website directory
cd main-website

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
# aws s3 sync .next s3://your-main-website-bucket
# aws cloudfront create-invalidation --distribution-id YOUR_DISTRIBUTION_ID --paths "/*"

# Example for custom server
# rsync -avz --delete .next/ user@server:/var/www/friendlydrop.in/
# ssh user@server "pm2 restart main-website"

echo "✅ Main Website deployment completed!"
echo "🌍 Available at: https://friendlydrop.in"