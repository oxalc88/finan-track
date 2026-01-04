# Deployment Guide - Free & Low-Cost Options

This guide covers deploying **finan-track** with minimal to zero cost. The application is cloud-agnostic, so choose the option that best fits your needs.

---

## 🆓 Option 1: 100% Free Tier (Recommended for Start)

### Stack: Railway.app (Free Tier)

**What you get:**
- ✅ Free PostgreSQL database (500 MB)
- ✅ Free backend hosting
- ✅ Free static frontend hosting
- ✅ $5/month free credits (renews monthly)
- ✅ No credit card required to start

**Monthly Cost:** $0 (with usage limits)

#### Deployment Steps

1. **Install Railway CLI:**
   ```bash
   npm i -g @railway/cli
   railway login
   ```

2. **Initialize Project:**
   ```bash
   railway init
   railway link
   ```

3. **Add PostgreSQL:**
   ```bash
   railway add --database postgres
   ```

4. **Deploy Backend:**
   ```bash
   cd backend
   railway up
   railway open
   ```

5. **Deploy Frontend:**
   ```bash
   cd ../frontend
   npm run build
   railway static dist
   ```

6. **Set Environment Variables:**
   ```bash
   railway variables set DATABASE_URL=$RAILWAY_DATABASE_URL
   railway variables set STORAGE_ENDPOINT=http://your-minio-url
   # ... add other variables
   ```

**Limitations:**
- 500 MB database storage
- 500 MB bandwidth/month
- Sleeps after 1 hour of inactivity

---

## 💰 Option 2: Ultra Low-Cost (~$5-7/month)

### Stack: Hetzner VPS + Docker

**What you get:**
- ✅ Full VPS control
- ✅ 20 GB SSD storage
- ✅ 20 TB traffic
- ✅ 1 vCPU + 2 GB RAM
- ✅ Run everything (DB, API, frontend, MinIO, Redis)

**Monthly Cost:** €4.51 (~$5 USD)

#### Deployment Steps

1. **Provision Hetzner VPS:**
   - Sign up at [hetzner.com](https://www.hetzner.com/cloud)
   - Create CPX11 instance (€4.51/mo)
   - Select Ubuntu 24.04

2. **Connect to Server:**
   ```bash
   ssh root@YOUR_SERVER_IP
   ```

3. **Install Docker:**
   ```bash
   curl -fsSL https://get.docker.com -o get-docker.sh
   sh get-docker.sh
   ```

4. **Clone Your Repo:**
   ```bash
   git clone https://github.com/your-username/finan-track.git
   cd finan-track
   ```

5. **Create Production Docker Compose:**
   Create `docker-compose.prod.yml`:
   ```yaml
   version: '3.8'

   services:
     postgres:
       image: postgres:16-alpine
       environment:
         POSTGRES_DB: finantrack
         POSTGRES_USER: finantrack
         POSTGRES_PASSWORD: ${DB_PASSWORD}
       volumes:
         - postgres_data:/var/lib/postgresql/data
       restart: unless-stopped

     minio:
       image: minio/minio
       command: server /data --console-address ":9001"
       environment:
         MINIO_ROOT_USER: ${MINIO_USER}
         MINIO_ROOT_PASSWORD: ${MINIO_PASSWORD}
       volumes:
         - minio_data:/data
       restart: unless-stopped

     redis:
       image: redis:7-alpine
       restart: unless-stopped

     backend:
       build: ./backend
       environment:
         DATABASE_URL: postgresql://finantrack:${DB_PASSWORD}@postgres:5432/finantrack
         STORAGE_ENDPOINT: http://minio:9000
         STORAGE_BUCKET: invoices
         STORAGE_ACCESS_KEY: ${MINIO_USER}
         STORAGE_SECRET_KEY: ${MINIO_PASSWORD}
       ports:
         - "3000:3000"
       depends_on:
         - postgres
         - minio
         - redis
       restart: unless-stopped

     frontend:
       build: ./frontend
       ports:
         - "80:80"
       restart: unless-stopped

   volumes:
     postgres_data:
     minio_data:
   ```

6. **Set Environment Variables:**
   ```bash
   echo "DB_PASSWORD=$(openssl rand -hex 16)" > .env
   echo "MINIO_USER=admin" >> .env
   echo "MINIO_PASSWORD=$(openssl rand -hex 16)" >> .env
   ```

7. **Deploy:**
   ```bash
   docker compose -f docker-compose.prod.yml up -d
   ```

8. **Run Migrations:**
   ```bash
   docker compose exec backend npm run migrate
   ```

**Pros:**
- Full control, no vendor lock-in
- Predictable costs
- Can host multiple projects

**Cons:**
- You manage updates/backups
- No auto-scaling

---

## 🚀 Option 3: Serverless Free Tier (~$0-5/month)

### Stack: Cloudflare Workers + Free Services

**What you get:**
- ✅ Cloudflare Workers (100k requests/day free)
- ✅ Cloudflare R2 (10 GB storage free)
- ✅ Cloudflare Pages (unlimited sites)
- ✅ Neon PostgreSQL (0.5 GB free)

**Monthly Cost:** $0 for low traffic, ~$1-5 for moderate usage

#### Deployment Steps

1. **Setup Neon Database:**
   - Sign up at [neon.tech](https://neon.tech)
   - Create free PostgreSQL database
   - Copy connection string

2. **Setup Cloudflare:**
   ```bash
   npm install -g wrangler
   wrangler login
   ```

3. **Create R2 Bucket:**
   ```bash
   wrangler r2 bucket create invoices
   ```

4. **Deploy Backend to Workers:**
   Create `backend/wrangler.toml`:
   ```toml
   name = "finan-track-api"
   main = "api/server.ts"
   compatibility_date = "2024-01-01"

   [[r2_buckets]]
   binding = "INVOICES"
   bucket_name = "invoices"

   [vars]
   DATABASE_URL = "your-neon-connection-string"
   ```

   Deploy:
   ```bash
   cd backend
   wrangler deploy
   ```

5. **Deploy Frontend to Pages:**
   ```bash
   cd ../frontend
   npm run build
   wrangler pages deploy dist --project-name finan-track
   ```

**Pros:**
- Global CDN
- Auto-scaling
- Zero downtime
- Free SSL

**Cons:**
- 1 MB worker size limit (need to optimize)
- Cold starts
- Limited to edge-compatible code

---

## 📊 Cost Comparison Table

| Option | Monthly Cost | Database | Storage | Traffic | Best For |
|--------|-------------|----------|---------|---------|----------|
| **Railway** | $0 | 500 MB | Limited | 500 MB | Development/Testing |
| **Hetzner VPS** | ~$5 | Unlimited* | 20 GB | 20 TB | Production (predictable) |
| **Cloudflare** | $0-5 | 0.5 GB (Neon) | 10 GB | Unlimited | Production (global) |
| **Render** | $0 | 500 MB | 1 GB | 100 GB | Development |
| **Fly.io** | $0-5 | Shared | 3 GB | 160 GB | Production (simple) |

*Within VPS storage limits

---

## 🎯 Recommended Path

### Phase 1: Start Free (Railway or Render)
- Deploy to Railway for free
- Validate the app works end-to-end
- Test with real data
- No financial commitment

### Phase 2: Scale to Low-Cost (Hetzner)
- Once you exceed free tier limits
- Move to Hetzner VPS (~$5/mo)
- Full control, predictable costs
- Can run for years at same price

### Phase 3: Scale to Global (Cloudflare)
- When you need global performance
- Multi-region deployment
- Auto-scaling for traffic spikes
- Pay only for what you use

---

## 🔧 Quick Start Scripts

### Deploy to Railway (Free)
```bash
# Install Railway CLI
npm i -g @railway/cli

# Login and initialize
railway login
railway init

# Add database
railway add --database postgres

# Deploy backend
cd backend
railway up

# Deploy frontend
cd ../frontend
npm run build
railway static dist
```

### Deploy to Hetzner (€4.51/mo)
```bash
# After provisioning VPS
ssh root@YOUR_IP

# Install Docker
curl -fsSL https://get.docker.com | sh

# Clone and deploy
git clone https://github.com/your-repo/finan-track.git
cd finan-track
docker compose -f docker-compose.prod.yml up -d
```

---

## 🌐 Domain & SSL (Free)

All options support free SSL:
- **Railway/Render**: Automatic SSL on `.railway.app` or `.onrender.com`
- **Hetzner**: Use Cloudflare DNS (free SSL proxy)
- **Cloudflare**: Automatic SSL on custom domain

---

## 📦 Storage Solutions

### Free/Low-Cost Options:
1. **Cloudflare R2**: 10 GB free, then $0.015/GB
2. **Backblaze B2**: 10 GB free, then $0.005/GB
3. **MinIO (self-hosted)**: Free on your VPS
4. **AWS S3**: Pay as you go (~$0.023/GB)

---

## 🔄 CI/CD (Free)

Use **GitHub Actions** (free for public repos):

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: superfly/flyctl-actions/setup-flyctl@master
      - run: flyctl deploy --remote-only
```

---

## 💡 Cost Optimization Tips

1. **Use Free Tiers Wisely:**
   - Neon DB (500 MB) for database
   - Cloudflare R2 (10 GB) for file storage
   - Cloudflare Workers for API
   - Cloudflare Pages for frontend

2. **Shared Resources:**
   - One VPS can host multiple projects
   - Share database across dev/staging environments

3. **Monitor Usage:**
   - Set up billing alerts
   - Use CloudWatch/Grafana for monitoring
   - Track database size growth

4. **Optimize Images:**
   - Compress invoice images before storage
   - Use thumbnails for previews
   - Auto-delete old data

---

## 🚨 What to Avoid

❌ **Don't use these for free-tier:**
- AWS RDS (minimum $15/mo)
- Google Cloud SQL (minimum $10/mo)
- Azure SQL (minimum $5/mo)

✅ **Use these instead:**
- Railway PostgreSQL (free)
- Neon PostgreSQL (free 0.5 GB)
- Supabase (free 500 MB)
- Self-hosted on VPS (Hetzner)

---

## 📝 Next Steps

1. Choose your deployment option
2. Follow the deployment steps above
3. Set up environment variables (copy from `.env.example`)
4. Run database migrations
5. Test the application
6. Set up monitoring (optional)

For questions, see `CLAUDE.md` or the docs in `docs/`.
