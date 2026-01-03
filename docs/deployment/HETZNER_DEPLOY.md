# Hetzner VPS Deployment Guide

Complete guide to deploying **finan-track** on a Hetzner VPS for ~$5/month.

---

## Prerequisites

- Hetzner Cloud account ([hetzner.com](https://www.hetzner.com/cloud))
- Git repository (GitHub/GitLab/Bitbucket)
- SSH client
- Domain name (optional, but recommended)

---

## Step 1: Create Hetzner VPS

### 1.1 Sign Up & Create Project
1. Go to [https://console.hetzner.cloud](https://console.hetzner.cloud)
2. Create an account
3. Create a new project (e.g., "finan-track-prod")

### 1.2 Provision Server
1. Click **"Add Server"**
2. Select configuration:
   - **Location**: Choose closest to your users (e.g., Nuremberg, Helsinki)
   - **Image**: Ubuntu 24.04
   - **Type**: **CPX11** (€4.51/month)
     - 2 vCPU
     - 2 GB RAM
     - 40 GB SSD
     - 20 TB traffic
   - **SSH Key**: Add your public key (or create password)
   - **Name**: `finan-track-prod`

3. Click **"Create & Buy now"**

### 1.3 Note Server IP
After creation, copy the server IP address (e.g., `123.45.67.89`)

---

## Step 2: Connect to Server

```bash
ssh root@YOUR_SERVER_IP
```

If using password, enter it when prompted. If using SSH key, you'll be logged in automatically.

---

## Step 3: Automated Setup (Recommended)

The easiest way is to use the automated setup script:

```bash
# Download the setup script
curl -fsSL https://raw.githubusercontent.com/YOUR_USERNAME/finan-track/main/setup-hetzner.sh -o setup.sh

# Make it executable
chmod +x setup.sh

# Run the setup
sudo bash setup.sh
```

**The script will:**
1. ✅ Update system packages
2. ✅ Install Docker & Docker Compose
3. ✅ Configure firewall
4. ✅ Clone your repository
5. ✅ Generate secure passwords
6. ✅ Create `.env` file
7. ✅ Build and start all services
8. ✅ Run database migrations
9. ✅ Set up automated daily backups

**That's it!** Your app will be running at `http://YOUR_SERVER_IP`

---

## Step 4: Manual Setup (Alternative)

If you prefer manual setup or want to understand each step:

### 4.1 Update System
```bash
apt update && apt upgrade -y
```

### 4.2 Install Docker
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
rm get-docker.sh
```

### 4.3 Install Docker Compose
```bash
DOCKER_COMPOSE_VERSION=$(curl -s https://api.github.com/repos/docker/compose/releases/latest | grep 'tag_name' | cut -d\" -f4)
curl -L "https://github.com/docker/compose/releases/download/${DOCKER_COMPOSE_VERSION}/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose
```

### 4.4 Configure Firewall
```bash
ufw --force enable
ufw allow ssh
ufw allow 80/tcp
ufw allow 443/tcp
```

### 4.5 Clone Repository
```bash
mkdir -p /opt/finan-track
cd /opt/finan-track
git clone https://github.com/YOUR_USERNAME/finan-track.git .
```

### 4.6 Create Environment File
```bash
cp env.production.example .env
nano .env
```

Update the following:
- `POSTGRES_PASSWORD`: Generate with `openssl rand -hex 32`
- `MINIO_ROOT_PASSWORD`: Generate with `openssl rand -hex 32`
- `KAPSO_API_KEY`: Your Kapso.ai API key
- `KAPSO_WEBHOOK_SECRET`: Your webhook secret

### 4.7 Deploy
```bash
docker-compose -f docker-compose.prod.yml up -d --build
```

### 4.8 Run Migrations
```bash
docker-compose -f docker-compose.prod.yml exec backend npm run migrate
```

---

## Step 5: Configure Domain (Optional)

### 5.1 Point Domain to Server
Add an A record in your DNS:
```
Type: A
Name: @  (or subdomain like "app")
Value: YOUR_SERVER_IP
TTL: 300
```

### 5.2 Install SSL Certificate (Free with Certbot)

```bash
# Install Certbot
apt install -y certbot python3-certbot-nginx

# Get SSL certificate
certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal is set up automatically
```

Your app will now be available at `https://yourdomain.com` 🎉

---

## Step 6: Verify Deployment

### Check Service Status
```bash
cd /opt/finan-track
docker-compose -f docker-compose.prod.yml ps
```

All services should show "Up" status.

### View Logs
```bash
# All services
docker-compose -f docker-compose.prod.yml logs -f

# Specific service
docker-compose -f docker-compose.prod.yml logs -f backend
docker-compose -f docker-compose.prod.yml logs -f frontend
```

### Access Services
- **Frontend**: `http://YOUR_SERVER_IP`
- **Backend API**: `http://YOUR_SERVER_IP/api`
- **MinIO Console**: `http://YOUR_SERVER_IP:9001`

### Test Health Endpoints
```bash
curl http://YOUR_SERVER_IP/health
curl http://YOUR_SERVER_IP/api/health
```

---

## Management Commands

### Restart Services
```bash
cd /opt/finan-track
docker-compose -f docker-compose.prod.yml restart
```

### Stop Services
```bash
docker-compose -f docker-compose.prod.yml down
```

### Start Services
```bash
docker-compose -f docker-compose.prod.yml up -d
```

### Update Application
```bash
cd /opt/finan-track
git pull
docker-compose -f docker-compose.prod.yml up -d --build
```

### View Resource Usage
```bash
docker stats
```

---

## Backup & Restore

### Manual Backup
```bash
# Backup database
docker exec finantrack-postgres pg_dump -U finantrack finantrack > backup.sql

# Backup MinIO data
docker exec finantrack-minio tar czf - /data > minio-backup.tar.gz
```

### Automated Backups
The setup script creates daily backups at 2 AM:
```bash
# View backup cron job
crontab -l

# Run backup manually
/opt/finan-track-backups/backup.sh

# View backups
ls -lh /opt/finan-track-backups/
```

### Restore from Backup
```bash
# Restore database
cat backup.sql | docker exec -i finantrack-postgres psql -U finantrack finantrack

# Restore MinIO
cat minio-backup.tar.gz | docker exec -i finantrack-minio tar xzf - -C /
```

---

## Monitoring

### Check Disk Space
```bash
df -h
```

### Check Memory Usage
```bash
free -h
```

### Check Container Logs
```bash
docker-compose -f docker-compose.prod.yml logs --tail=100 -f
```

### Enable Background Worker (Optional)
```bash
# Edit docker-compose.prod.yml to include worker
docker-compose -f docker-compose.prod.yml --profile with-worker up -d
```

---

## Troubleshooting

### Service Won't Start
```bash
# Check logs
docker-compose -f docker-compose.prod.yml logs backend

# Restart specific service
docker-compose -f docker-compose.prod.yml restart backend
```

### Database Connection Issues
```bash
# Check database is running
docker-compose -f docker-compose.prod.yml ps postgres

# Check database logs
docker-compose -f docker-compose.prod.yml logs postgres

# Connect to database manually
docker exec -it finantrack-postgres psql -U finantrack
```

### Out of Disk Space
```bash
# Clean old Docker images
docker system prune -a

# Check what's using space
du -sh /var/lib/docker/*
```

### Frontend Not Loading
```bash
# Check nginx logs
docker-compose -f docker-compose.prod.yml logs frontend

# Rebuild frontend
docker-compose -f docker-compose.prod.yml up -d --build frontend
```

---

## Cost Optimization

### Current Costs
- **VPS**: €4.51/month (~$5 USD)
- **Traffic**: 20 TB included (more than enough)
- **Storage**: 40 GB SSD included

### Ways to Reduce Costs Further
1. **Use external free services:**
   - Neon PostgreSQL (500 MB free)
   - Cloudflare R2 (10 GB free)
   - Remove MinIO and PostgreSQL from Docker

2. **Share VPS with other projects:**
   - Same VPS can host multiple apps
   - Use different ports or subdomains

3. **Downgrade if needed:**
   - CX11 (€3.79/mo) if 2GB RAM is enough

---

## Upgrading VPS

If you need more resources:

### Resize Server
1. Go to Hetzner Cloud Console
2. Select your server
3. Click "Resize"
4. Choose larger plan (e.g., CPX21 for 4GB RAM)
5. Server will reboot (5-10 minutes downtime)

### No Code Changes Needed
Your app continues to work after resize!

---

## Security Checklist

- ✅ Firewall enabled (only ports 22, 80, 443 open)
- ✅ Secure passwords generated (32+ characters)
- ✅ Docker running as non-root user
- ✅ Database not exposed to internet
- ✅ Automated backups enabled
- ⚠️ Consider: Fail2ban for SSH protection (installed by setup script)
- ⚠️ Consider: SSL certificate for HTTPS
- ⚠️ Consider: Regular security updates (`apt update && apt upgrade`)

---

## Next Steps

1. ✅ Deploy application
2. ⏳ Add your domain and SSL certificate
3. ⏳ Configure WhatsApp integration (add Kapso credentials)
4. ⏳ Set up monitoring (optional: Uptime Robot, StatusCake)
5. ⏳ Test invoice upload and OCR processing
6. ⏳ Invite team members or start using

---

## Support

- 📖 Main Documentation: `README.md`
- 🚀 Deployment Options: `DEPLOYMENT.md`
- 💻 Project Setup: `CLAUDE.md`
- 🏗️ Architecture: `LAYERED_ARCHITECTURE.md`

---

## Summary

**With Hetzner, you get:**
- ✅ Full control over your infrastructure
- ✅ Predictable costs (~$5/month)
- ✅ No sleep/quotas (unlike free tiers)
- ✅ Can scale up anytime
- ✅ 20 TB traffic included
- ✅ Automated backups
- ✅ Production-ready setup

**Perfect for:**
- Small to medium businesses
- Personal projects going to production
- MVPs with real users
- Long-term hosting (years)

Enjoy your deployment! 🎉
