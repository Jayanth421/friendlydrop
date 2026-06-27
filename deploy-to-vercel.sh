#!/bin/bash

# Quick Vercel Deployment Script for FriendlyDrop
# This script deploys all three applications to Vercel

echo "🚀 FriendlyDrop - Quick Vercel Deployment"
echo "========================================="

# Check if vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Installing..."
    npm install -g vercel
    echo "✅ Vercel CLI installed successfully"
fi

# Login check
echo "🔐 Checking Vercel authentication..."
if ! vercel whoami &> /dev/null; then
    echo "Please login to Vercel:"
    vercel login
fi

echo ""
echo "📋 Deployment Plan:"
echo "   1. Main Website → friendlydrop-main-website"
echo "   2. Vendor Dashboard → friendlydrop-vendor-dashboard" 
echo "   3. Admin Dashboard → friendlydrop-admin-dashboard"
echo ""

read -p "🤔 Do you want to proceed with deployment? (y/n): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Deployment cancelled"
    exit 1
fi

# Deploy Main Website
echo ""
echo "📦 Step 1/3: Deploying Main Website..."
echo "======================================"
cd main-website
npm ci
npm run build
npm run typecheck
vercel --prod --confirm --name friendlydrop-main-website
if [ $? -eq 0 ]; then
    echo "✅ Main Website deployed successfully"
else
    echo "❌ Main Website deployment failed"
    exit 1
fi
cd ..

# Deploy Vendor Dashboard  
echo ""
echo "📦 Step 2/3: Deploying Vendor Dashboard..."
echo "=========================================="
cd vendor-dashboard
npm ci
npm run build
npm run typecheck
vercel --prod --confirm --name friendlydrop-vendor-dashboard
if [ $? -eq 0 ]; then
    echo "✅ Vendor Dashboard deployed successfully"
else
    echo "❌ Vendor Dashboard deployment failed"
    exit 1
fi
cd ..

# Deploy Admin Dashboard
echo ""
echo "📦 Step 3/3: Deploying Admin Dashboard..."
echo "========================================="
cd admin-dashboard
npm ci
npm run build 
npm run typecheck
vercel --prod --confirm --name friendlydrop-admin-dashboard
if [ $? -eq 0 ]; then
    echo "✅ Admin Dashboard deployed successfully"
else
    echo "❌ Admin Dashboard deployment failed"
    exit 1
fi
cd ..

echo ""
echo "🎉 All applications deployed successfully!"
echo "========================================="
echo ""
echo "📱 Deployment URLs (temporary):"
echo "   You'll find the Vercel URLs in the deployment output above"
echo ""
echo "🔧 Next Steps:"
echo "   1. Configure custom domains in Vercel Dashboard:"
echo "      • Main Website: friendlydrop.in, www.friendlydrop.in"
echo "      • Vendor Dashboard: vendor.friendlydrop.in"  
echo "      • Admin Dashboard: admin.friendlydrop.in"
echo ""
echo "   2. Add environment variables to each project"
echo "   3. Update DNS records to point to Vercel"
echo "   4. Test authentication flow across all domains"
echo ""
echo "📖 For detailed instructions, see: VERCEL_DEPLOYMENT_GUIDE.md"