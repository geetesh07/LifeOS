# LifeOS Deployment Guide

## Table of Contents
- [Prerequisites](#prerequisites)
- [cPanel Node.js Deployment](#cpanel-nodejs-deployment)
- [Docker Deployment](#docker-deployment)
- [Environment Variables](#environment-variables)
- [Database Setup](#database-setup)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

- Node.js 20+ 
- PostgreSQL database (Supabase, Neon, or self-hosted)
- npm or yarn

---

## cPanel Node.js Deployment

### Step 1: Prepare Your Code

1. On your local machine, build the project:
```bash
npm install
npm run build
```

2. This creates:
   - `dist/index.js` - compiled server
   - `dist/public/` - compiled frontend

### Step 2: Upload to cPanel

1. Create a subdomain or use your main domain
2. Go to **File Manager** in cPanel
3. Upload these files/folders to your domain's directory:
   ```
   dist/                    # Both server and client builds
   shared/                  # Shared types
   node_modules/            # Dependencies (or run npm install on server)
   package.json
   package-lock.json
   .env                     # Environment variables
   ```

### Step 3: Setup Node.js App in cPanel

1. Go to **Setup Node.js App** in cPanel
2. Click **Create Application**
3. Configure:
   - **Node.js version**: 20.x (or latest)
   - **Application mode**: Production
   - **Application root**: Your app folder path (e.g., `/home/user/lifeos`)
   - **Application URL**: Your domain
   - **Application startup file**: `dist/index.js`
   - **Passenger log file**: Leave default

4. Click **Create**

### Step 4: Set Environment Variables

In the Node.js App settings, add environment variables:
```
NODE_ENV=production
PORT=7777
DATABASE_URL=your_postgres_connection_string
SESSION_SECRET=your_secret_key_here
VAPID_PUBLIC_KEY=your_vapid_public_key
VAPID_PRIVATE_KEY=your_vapid_private_key
```

### Step 5: Install Dependencies & Start

1. Click **Run NPM Install** button in cPanel Node.js app
2. Click **Start App**
3. Visit your domain!

### Step 6: Restart App After Updates

After uploading new files:
1. Go to Setup Node.js App
2. Click **Restart** on your app

---

## Docker Deployment

### Quick Start

```bash
# Clone the repo
git clone <your-repo>
cd LifeOS

# Create .env file
cp .env.example .env
# Edit .env with your values

# Build and run
docker-compose up -d
```

### Manual Docker

```bash
# Build
docker build -t lifeos .

# Run
docker run -d \
  -p 7777:7777 \
  -e DATABASE_URL="your_postgres_url" \
  -e SESSION_SECRET="your_secret" \
  --name lifeos \
  lifeos
```

### Docker Compose

```bash
docker-compose up -d
```

---

## Environment Variables

Create a `.env` file with these values:

```env
# Required
DATABASE_URL=postgresql://user:password@host:5432/database
SESSION_SECRET=your_super_secret_session_key_here

# Optional - for push notifications
VAPID_PUBLIC_KEY=your_vapid_public_key
VAPID_PRIVATE_KEY=your_vapid_private_key

# Optional - for Google Calendar sync
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

### Generating VAPID Keys

```bash
npx web-push generate-vapid-keys
```

---

## Database Setup

### Using Supabase (Recommended)

1. Create a project at [supabase.com](https://supabase.com)
2. Get your connection string from Settings > Database
3. Use the `Transaction` pooler connection string

### Push Schema to Database

```bash
npm run db:push
```

---

## Troubleshooting

### App won't start

1. Check logs in cPanel Node.js App settings
2. Verify all environment variables are set
3. Ensure `dist/index.js` exists (run `npm run build` first)

### Database connection fails

1. Check DATABASE_URL format
2. Ensure IP is whitelisted in database settings
3. For Supabase, use the "Transaction" pooler URL

### Static files not loading

1. Verify `client/dist/` folder exists
2. Check the server is serving from correct path
3. Clear browser cache

### Port already in use

Change PORT in environment variables to a different value

---

## Project Structure

```
LifeOS/
├── client/              # React frontend (Vite)
│   ├── src/
│   └── dist/            # Built frontend (after npm run build)
├── server/              # Express backend
│   ├── routes.ts
│   ├── storage.ts
│   └── services/
├── shared/              # Shared types (schema.ts)
├── dist/                # Built server (after npm run build)
├── package.json
├── Dockerfile
├── docker-compose.yml
└── .env
```

---

## Quick Commands Reference

```bash
# Development
npm run dev              # Start dev server

# Production build
npm run build            # Build client + server

# Start production
npm start                # Run built server

# Database
npm run db:push          # Push schema to database
```
