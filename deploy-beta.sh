#!/bin/bash

# Deploy Beta Script - For deploying to remote server
# This script helps deploy the beta build to a remote server

set -e

echo "🚀 Beta Deployment Script"
echo "========================"

# Configuration
REMOTE_HOST=${1:-"dashboard.innspiredaccountancy.com"}
REMOTE_USER=${2:-"root"}
REMOTE_PATH=${3:-"/var/www/milestone-app-beta"}

echo "Deploying to: $REMOTE_USER@$REMOTE_HOST:$REMOTE_PATH"

# Build the image locally first
echo "📦 Building Docker image locally..."
docker build -t milestone-app-beta:latest .

# Save the Docker image
echo "💾 Saving Docker image..."
docker save milestone-app-beta:latest | gzip > milestone-app-beta.tar.gz

# Copy files to remote server
echo "📤 Copying files to remote server..."
scp milestone-app-beta.tar.gz $REMOTE_USER@$REMOTE_HOST:/tmp/
scp docker-compose.beta.yml $REMOTE_USER@$REMOTE_HOST:$REMOTE_PATH/
scp .env.beta $REMOTE_USER@$REMOTE_HOST:$REMOTE_PATH/

# Load and run on remote server
echo "🔄 Loading and starting containers on remote server..."
ssh $REMOTE_USER@$REMOTE_HOST << 'EOF'
    cd /tmp
    docker load < milestone-app-beta.tar.gz
    rm milestone-app-beta.tar.gz

    cd $REMOTE_PATH
    docker compose -f docker-compose.beta.yml down
    docker compose -f docker-compose.beta.yml up -d
EOF

# Clean up local tar file
rm milestone-app-beta.tar.gz

echo "========================"
echo "✅ Deployment complete!"
echo "Beta app should be accessible at: https://dashboard.innspiredaccountancy.com/demo"