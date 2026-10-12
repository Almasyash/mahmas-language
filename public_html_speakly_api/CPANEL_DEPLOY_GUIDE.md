# ==============================================================================
# SPEAKLY_FS API — cPanel Deployment Guide
# Target Path on Server: /public_html/speakly/api/
# Production Domain: https://speakly.fsgroupz.com
# ==============================================================================

## Step 1: Upload Files
1. Open cPanel File Manager.
2. Navigate to: public_html/speakly/api/
3. Upload all files from this folder (or upload Speakly_API_cPanel_Upload.zip and extract it).

## Step 2: cPanel "Setup Node.js App"
1. In cPanel, find "Setup Node.js App" (under Software section).
2. Click "Create Application":
   - Node.js Version: 20.x (or 18.x+)
   - Application Mode: Production
   - Application Root: public_html/speakly/api
   - Application URL: speakly.fsgroupz.com/api  (or speakly.fsgroupz.com)
   - Application Startup File: app.js
3. Click "Create".
4. Click "Run NPM Install" to install dependencies.

## Step 3: Configure Database in .env (Authoritative Neon Cluster)
1. Open .env in public_html/speakly/api/.env
2. Set your PostgreSQL DATABASE_URL to the authoritative shared production database:
   # CRITICAL INVARIANT: cPanel and Render must use the same Neon PostgreSQL cluster
   # to prevent data desynchronization and missing user accounts during failover.
   DATABASE_URL="postgresql://neondb_owner:YOUR_NEON_PASSWORD@ep-snowy-mouse-b3il1o8d-pooler.c-4.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

## Step 4: Run Prisma Setup
In the cPanel Node.js app console:

px prisma db push

px ts-node prisma/seed.ts

## Step 5: Test API
Open in your browser:
https://speakly.fsgroupz.com/api/v1/health

Expected Response:
{
  "success": true,
  "data": {
    "status": "UP",
    "appName": "Speakly_FS Platform"
  }
}
