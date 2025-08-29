#!/bin/bash
# Phase 1 Development Startup Script
# Script to start all Phase 1 services for development

set -e

echo "🚀 Starting Phase 1 Development Environment..."

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null; then
    echo "❌ docker-compose not found. Please install Docker Compose."
    exit 1
fi

# Load environment variables
if [ -f .env ]; then
    echo "📁 Loading environment variables from .env"
    export $(cat .env | grep -v '#' | xargs)
else
    echo "⚠️  No .env file found. Using defaults."
    echo "💡 Copy .env.phase1.example to .env and customize as needed."
fi

# Start services
echo "🐳 Starting Docker services..."
docker-compose -f docker-compose.phase1.yml up -d

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 10

# Check service health
echo "🔍 Checking service health..."

# Check PostgreSQL
if docker-compose -f docker-compose.phase1.yml exec -T postgres pg_isready -U postgres > /dev/null 2>&1; then
    echo "✅ PostgreSQL is ready"
else
    echo "❌ PostgreSQL is not ready"
fi

# Check Redis
if docker-compose -f docker-compose.phase1.yml exec -T redis redis-cli ping > /dev/null 2>&1; then
    echo "✅ Redis is ready"
else
    echo "❌ Redis is not ready"
fi

# Check MinIO
if curl -f http://localhost:9000/minio/health/live > /dev/null 2>&1; then
    echo "✅ MinIO is ready"
else
    echo "❌ MinIO is not ready"
fi

echo ""
echo "🎉 Phase 1 services started successfully!"
echo ""
echo "🔗 Service URLs:"
echo "   API:        http://localhost:5000"
echo "   Dispatcher: http://localhost:8001"
echo "   Flower:     http://localhost:5555"
echo "   MinIO:      http://localhost:9001 (admin: minioadmin/minioadmin123)"
echo ""
echo "📊 To monitor services:"
echo "   docker-compose -f docker-compose.phase1.yml logs -f"
echo ""
echo "🛑 To stop services:"
echo "   docker-compose -f docker-compose.phase1.yml down"