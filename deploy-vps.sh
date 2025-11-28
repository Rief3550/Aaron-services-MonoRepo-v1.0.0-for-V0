#!/bin/bash

# ===========================================
# VPS Deployment Script for Hostinger
# ===========================================

set -e  # Exit on error

echo "🚀 Starting VPS Deployment..."

# ===========================================
# 1. Check if .env.production exists
# ===========================================
if [ ! -f .env.production ]; then
    echo "❌ Error: .env.production file not found!"
    echo "Please create .env.production with your production values"
    exit 1
fi

echo "✅ .env.production found"

# ===========================================
# 2. Pull latest changes
# ===========================================
echo "📥 Pulling latest code..."
git pull origin main

# ===========================================
# 3. Stop existing containers
# ===========================================
echo "🛑 Stopping existing containers..."
docker compose -f docker-compose.prod.yml down

# ===========================================
# 4. Build and start services
# ===========================================
echo "🏗️  Building and starting services..."
docker compose -f docker-compose.prod.yml up -d --build

# ===========================================
# 5. Wait for database to be ready
# ===========================================
echo "⏳ Waiting for database to be ready..."
sleep 10

# ===========================================
# 6. Run database migrations
# ===========================================
echo "🗄️  Running database migrations..."

# Auth Service
docker compose -f docker-compose.prod.yml exec -T app sh -c \
  "cd backend/services/auth-service && npx prisma migrate deploy"

# Operations Service
docker compose -f docker-compose.prod.yml exec -T app sh -c \
  "cd backend/services/operations-service && npx prisma db push"

# Tracking Service
docker compose -f docker-compose.prod.yml exec -T app sh -c \
  "cd backend/services/tracking-service && npx prisma migrate deploy"

# ===========================================
# 7. Seed database (only first time)
# ===========================================
echo "🌱 Seeding database..."
docker compose -f docker-compose.prod.yml exec -T app sh -c \
  "cd backend/services/auth-service && pnpm prisma:seed" || echo "⚠️  Seed skipped (may already exist)"

# ===========================================
# 8. Show status
# ===========================================
echo ""
echo "✅ Deployment complete!"
echo ""
echo "📊 Container Status:"
docker compose -f docker-compose.prod.yml ps
echo ""
echo "🌐 Access your application at:"
echo "   http://147.79.83.143"
echo ""
echo "📝 View logs with:"
echo "   docker compose -f docker-compose.prod.yml logs -f"
echo ""
