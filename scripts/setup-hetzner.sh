#!/bin/bash

###############################################################################
# Hetzner VPS Setup Script for finan-track
#
# This script automates the deployment of finan-track on a Hetzner VPS.
# Run this on a fresh Ubuntu 22.04/24.04 server.
#
# Usage: bash setup-hetzner.sh
###############################################################################

set -e  # Exit on error

echo "========================================="
echo "  finan-track - Hetzner VPS Setup"
echo "========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Helper functions
info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    error "Please run as root (use 'sudo bash setup-hetzner.sh')"
fi

# Step 1: Update system
info "Updating system packages..."
apt-get update && apt-get upgrade -y

# Step 2: Install required packages
info "Installing required packages..."
apt-get install -y \
    apt-transport-https \
    ca-certificates \
    curl \
    gnupg \
    lsb-release \
    git \
    ufw \
    fail2ban

# Step 3: Install Docker
info "Installing Docker..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm get-docker.sh
    systemctl enable docker
    systemctl start docker
    info "Docker installed successfully"
else
    info "Docker already installed"
fi

# Step 4: Install Docker Compose
info "Installing Docker Compose..."
if ! command -v docker-compose &> /dev/null; then
    DOCKER_COMPOSE_VERSION=$(curl -s https://api.github.com/repos/docker/compose/releases/latest | grep 'tag_name' | cut -d\" -f4)
    curl -L "https://github.com/docker/compose/releases/download/${DOCKER_COMPOSE_VERSION}/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
    info "Docker Compose installed successfully"
else
    info "Docker Compose already installed"
fi

# Step 5: Configure firewall
info "Configuring firewall..."
ufw --force enable
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw allow 9000/tcp  # MinIO (optional, can be removed for production)
ufw allow 9001/tcp  # MinIO Console (optional)
info "Firewall configured"

# Step 6: Create application directory
info "Creating application directory..."
APP_DIR="/opt/finan-track"
mkdir -p $APP_DIR
cd $APP_DIR

# Step 7: Prompt for Git repository
echo ""
read -p "Enter your Git repository URL (e.g., https://github.com/user/finan-track.git): " REPO_URL

if [ -z "$REPO_URL" ]; then
    error "Repository URL is required"
fi

# Step 8: Clone repository
info "Cloning repository..."
if [ -d "$APP_DIR/.git" ]; then
    warn "Repository already exists. Pulling latest changes..."
    git pull
else
    git clone $REPO_URL .
fi

# Step 9: Generate secure passwords
info "Generating secure passwords..."
DB_PASSWORD=$(openssl rand -hex 32)
MINIO_PASSWORD=$(openssl rand -hex 32)

# Step 10: Create .env file
info "Creating production environment file..."
cat > .env << EOF
# Database Configuration
POSTGRES_DB=finantrack
POSTGRES_USER=finantrack
POSTGRES_PASSWORD=${DB_PASSWORD}

# MinIO Configuration
MINIO_ROOT_USER=admin
MINIO_ROOT_PASSWORD=${MINIO_PASSWORD}
STORAGE_BUCKET=invoices

# Queue Configuration
QUEUE_TYPE=memory

# OCR Configuration
OCR_PROVIDER=tesseract

# Logging
LOG_LEVEL=info
NODE_ENV=production

# WhatsApp (Kapso.ai) - Update these with your actual credentials
# KAPSO_API_KEY=your_api_key_here
# KAPSO_WEBHOOK_SECRET=your_webhook_secret_here
EOF

info ".env file created with secure passwords"

# Step 11: Create backup directory
info "Creating backup directory..."
mkdir -p /opt/finan-track-backups

# Step 12: Create backup script
info "Creating backup script..."
cat > /opt/finan-track-backups/backup.sh << 'EOF'
#!/bin/bash
# Backup script for finan-track

BACKUP_DIR="/opt/finan-track-backups"
DATE=$(date +%Y%m%d_%H%M%S)

# Backup database
docker exec finantrack-postgres pg_dump -U finantrack finantrack | gzip > "$BACKUP_DIR/db_$DATE.sql.gz"

# Backup MinIO data
docker exec finantrack-minio tar czf - /data | cat > "$BACKUP_DIR/minio_$DATE.tar.gz"

# Keep only last 7 days of backups
find "$BACKUP_DIR" -name "*.gz" -mtime +7 -delete

echo "Backup completed: $DATE"
EOF

chmod +x /opt/finan-track-backups/backup.sh

# Step 13: Setup cron for automated backups
info "Setting up automated daily backups..."
(crontab -l 2>/dev/null; echo "0 2 * * * /opt/finan-track-backups/backup.sh >> /var/log/finantrack-backup.log 2>&1") | crontab -

# Step 14: Build and start containers
info "Building and starting Docker containers..."
docker-compose -f docker-compose.prod.yml up -d --build

# Step 15: Wait for services to be ready
info "Waiting for services to start..."
sleep 10

# Step 16: Run database migrations
info "Running database migrations..."
docker-compose -f docker-compose.prod.yml exec -T backend npm run migrate || warn "Migration failed - you may need to run it manually"

# Step 17: Create MinIO bucket
info "Creating MinIO bucket..."
docker-compose -f docker-compose.prod.yml exec -T minio \
    mc alias set myminio http://localhost:9000 admin ${MINIO_PASSWORD} || true
docker-compose -f docker-compose.prod.yml exec -T minio \
    mc mb myminio/invoices || warn "Bucket creation failed or already exists"

# Step 18: Display summary
echo ""
echo "========================================="
echo "  Setup Complete! 🎉"
echo "========================================="
echo ""
info "Application is running at: http://$(curl -s ifconfig.me)"
echo ""
info "Service URLs:"
echo "  - Frontend: http://$(curl -s ifconfig.me)"
echo "  - Backend API: http://$(curl -s ifconfig.me)/api"
echo "  - MinIO Console: http://$(curl -s ifconfig.me):9001"
echo ""
info "Credentials (saved in /opt/finan-track/.env):"
echo "  - Database Password: ${DB_PASSWORD}"
echo "  - MinIO Password: ${MINIO_PASSWORD}"
echo ""
warn "IMPORTANT: Update the WhatsApp credentials in .env file:"
echo "  1. Edit /opt/finan-track/.env"
echo "  2. Add your KAPSO_API_KEY and KAPSO_WEBHOOK_SECRET"
echo "  3. Restart containers: docker-compose -f docker-compose.prod.yml restart"
echo ""
info "Backups are automatically run daily at 2 AM"
info "Manual backup: /opt/finan-track-backups/backup.sh"
echo ""
info "To view logs: docker-compose -f docker-compose.prod.yml logs -f"
info "To restart: docker-compose -f docker-compose.prod.yml restart"
info "To stop: docker-compose -f docker-compose.prod.yml down"
echo ""
echo "========================================="
