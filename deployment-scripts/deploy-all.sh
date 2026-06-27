#!/bin/bash

# FriendlyDrop Multi-App Deployment Script

echo "🚀 Starting Full Platform Deployment..."

# Deploy all applications in sequence
echo "📦 Step 1/3: Deploying Main Website..."
./deploy-main-website.sh

echo "📦 Step 2/3: Deploying Vendor Dashboard..."
./deploy-vendor-dashboard.sh

echo "📦 Step 3/3: Deploying Admin Dashboard..."
./deploy-admin-dashboard.sh

echo "🎉 Full platform deployment completed!"
echo ""
echo "🌐 Applications are now live:"
echo "   Main Website: https://friendlydrop.in"
echo "   Vendor Dashboard: https://vendor.friendlydrop.in"
echo "   Admin Dashboard: https://admin.friendlydrop.in"
echo ""
echo "✅ All systems operational!"