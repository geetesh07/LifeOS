# PowerShell script for Windows

Write-Host "🚀 Starting LifeFlow with Docker..." -ForegroundColor Green
Write-Host ""

# Check if .env file exists
if (-not (Test-Path .env)) {
    Write-Host "⚠️  .env file not found! Copying from .env.example..." -ForegroundColor Yellow
    Copy-Item .env.example .env
    Write-Host "✅ Created .env file. Please update it with your actual credentials." -ForegroundColor Green
    Write-Host ""
}

# Check if Docker is running
try {
    docker info | Out-Null
} catch {
    Write-Host "❌ Docker is not running. Please start Docker Desktop and try again." -ForegroundColor Red
    exit 1
}

Write-Host "🐳 Building and starting containers..." -ForegroundColor Cyan
docker-compose up --build -d

Write-Host ""
Write-Host "✅ LifeFlow is starting!" -ForegroundColor Green
Write-Host "📍 Application will be available at: " -NoNewline
Write-Host "http://localhost:7777" -ForegroundColor Cyan
Write-Host ""
Write-Host "📊 View logs: " -NoNewline -ForegroundColor Yellow
Write-Host "docker-compose logs -f app"
Write-Host "🛑 Stop: " -NoNewline -ForegroundColor Yellow
Write-Host "docker-compose down"
Write-Host ""
