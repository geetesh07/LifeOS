#!/bin/bash

echo "🚀 Starting LifeFlow with Docker..."
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found! Copying from .env.example..."
    cp .env.example .env
    echo "✅ Created .env file. Please update it with your actual credentials."
    echo ""
fi

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

echo "🐳 Building and starting containers..."
docker-compose up --build -d

echo ""
echo "✅ LifeFlow is starting!"
echo "📍 Application will be available at: http://localhost:7777"
echo ""
echo "📊 View logs: docker-compose logs -f app"
echo "🛑 Stop: docker-compose down"
echo ""
