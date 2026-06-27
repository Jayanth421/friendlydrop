#!/bin/bash

# FriendlyDrop Main Website Deployment Script for Vercel

echo "🚀 Starting Main Website Deployment to Vercel..."

# Navigate to main website directory
cd main-website

# Check if vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Installing..."
    npm install -g vercel
fi

# Login check
echo "🔐 Checking Vercel authentication..."
if ! vercel whoami &> /dev/null; then
    echo "Please login to Vercel:"
    vercel login
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm ci

# Build the application
echo "🔨 Building application..."
npm run build

# Run type check
echo "🔍 Running type check..."
npm run typecheck

# Deploy to Vercel
echo "🌐 Deploying to Vercel..."
vercel --prod --confirm --name friendlydrop-main-website

echo "✅ Main Website deployment completed!"
echo "🌍 Available at: https://friendlydrop.in"
echo ""
echo "Next steps:"
echo "1. Configure custom domain in Vercel Dashboard"
echo "2. Add environment variables"
echo "3. Update DNS records"