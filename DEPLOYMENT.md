# 🚀 PoemQuizzer Deployment Guide

Complete instructions for local development, school server deployment, and Docker production.

---

## 📋 Table of Contents

1. [Local Development Setup](#local-development-setup)
2. [Docker Deployment](#docker-deployment)
3. [School Server Deployment (PM2 + Nginx)](#school-server-deployment-pm2--nginx)
4. [SSL/HTTPS Setup](#sslhttps-setup)
5. [Database Management](#database-management)
6. [Troubleshooting](#troubleshooting)

---

## Local Development Setup

### Prerequisites
- Node.js >= 18 (`node -v`)
- npm >= 9
- MySQL 8.0 (or use Docker)

### Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Start MySQL (if not using Docker)
# Option A: Local MySQL
# Make sure MySQL is running, then:
npm run db:migrate

# Option B: Docker MySQL only
npm run docker:up mysql

# 3. Seed the database (creates admin user + sample questions)
npm run db:seed

# 4. Start development servers
npm run dev
```

**Access the app:**
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000
- Prisma Studio (DB GUI): `npm run db:studio` → http://localhost:5555

**Default Admin Credentials:**
- Email: `admin@poemquizzer.com`
- Password: `admin123`

---

## Docker Deployment

### Full Stack (All Services)

```bash
# 1. Generate a JWT secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# 2. Set environment variable (replace with your secret)
export JWT_SECRET=your-generated-secret

# 3. Start all services
npm run docker:up

# 4. Run database migrations
docker exec poemquizzer-server npx prisma migrate deploy

# 5. Seed the database
docker exec poemquizzer-server npx tsx prisma/seed.ts

# 6. Access the app
# http://localhost (via Nginx)
# Frontend: http://localhost:5173
# Backend: http://localhost:5000
```

### Docker Services

| Service | Port | Description |
|---------|------|-------------|
| MySQL | 3306 | Database |
| Server | 5000 | Express API |
| Client | 5173 | Vite dev server |
| Nginx | 80, 443 | Reverse proxy |

### Docker Compose Commands

```bash
# Start all services
npm run docker:up

# Stop all services
npm run docker:down

# View logs
docker compose -f docker/docker-compose.yml logs -f

# View specific service logs
docker compose -f docker/docker-compose.yml logs -f server

# Rebuild containers
docker compose -f docker/docker-compose.yml up -d --build

# Stop and remove volumes (destroys database!)
docker compose -f docker/docker-compose.yml down -v
```

---

## School Server Deployment (PM2 + Nginx)

### Step 1: Prepare the Server

```bash
# SSH into your school server
ssh user@your-school-server.edu

# Install Node.js (via NodeSource)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 globally
sudo npm install -g pm2

# Install MySQL (if not already installed)
sudo apt-get install -y mysql-server

# Secure MySQL
sudo mysql_secure_installation
```

### Step 2: Create Database

```bash
# Login to MySQL
sudo mysql -u root

# Run these SQL commands:
CREATE DATABASE poemquizzer;
CREATE USER 'poemquizzer_user'@'localhost' IDENTIFIED BY 'STRONG_PASSWORD';
GRANT ALL PRIVILEGES ON poemquizzer.* TO 'poemquizzer_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### Step 3: Deploy the Application

```bash
# Create app directory
sudo mkdir -p /var/www/poemquizzer
sudo chown $USER:$USER /var/www/poemquizzer

# Clone or upload your code
cd /var/www/poemquizzer
git clone https://your-repo.git .  # OR upload via SCP/SFTP

# Install dependencies
npm install --production

# Copy and configure environment
cp server/.env.production server/.env
nano server/.env  # Edit with your DATABASE_URL and JWT_SECRET

# Generate Prisma client
cd server
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Seed database
npx tsx prisma/seed.ts
cd ..

# Build both client and server
npm run build
```

### Step 4: Start with PM2

```bash
# Start the server with PM2
pm2 start ecosystem.config.js --env production

# Save PM2 process list
pm2 save

# Setup PM2 to start on boot
pm2 startup systemd
# Follow the command it outputs
```

### Step 5: Configure Nginx

```bash
# Install Nginx
sudo apt-get install -y nginx

# Copy Nginx config
sudo cp docker/nginx.conf /etc/nginx/nginx.conf

# OR use a simpler site config:
sudo nano /etc/nginx/sites-available/poemquizzer
```

**Simplified Nginx Site Config** (`/etc/nginx/sites-available/poemquizzer`):

```nginx
server {
    listen 80;
    server_name your-domain.edu;

    # Frontend (built files)
    location / {
        root /var/www/poemquizzer/client/dist;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Rate limiting
    location /api/auth/login {
        limit_req zone=login_limit burst=5 nodelay;
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
# Enable the site
sudo ln -s /etc/nginx/sites-available/poemquizzer /etc/nginx/sites-enabled/

# Test Nginx config
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

---

## SSL/HTTPS Setup

### Using Let's Encrypt (Free)

```bash
# Install Certbot
sudo apt-get install -y certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d your-domain.edu

# Auto-renewal is configured automatically
# Test renewal:
sudo certbot renew --dry-run
```

### Manual SSL (School Certificate)

If your school provides SSL certificates:

```bash
# Place certificates
sudo mkdir -p /etc/nginx/ssl
sudo cp your-cert.pem /etc/nginx/ssl/cert.pem
sudo cp your-key.pem /etc/nginx/ssl/key.pem

# Update Nginx config to use SSL
# Uncomment the HTTPS server block in docker/nginx.conf

# Test and restart
sudo nginx -t
sudo systemctl restart nginx
```

---

## Database Management

### Backup Database

```bash
mysqldump -u poemquizzer_user -p poemquizzer > backup_$(date +%Y%m%d).sql
```

### Restore Database

```bash
mysql -u poemquizzer_user -p poemquizzer < backup_20260406.sql
```

### Prisma Studio (Remote)

```bash
# SSH tunnel
ssh -L 5555:localhost:5555 user@your-school-server.edu

# On server
cd /var/www/poemquizzer/server
npx prisma studio
# Access locally: http://localhost:5555
```

### Manual Database Operations

```bash
# Connect to MySQL
mysql -u poemquizzer_user -p poemquizzer

# Useful queries
SELECT COUNT(*) FROM User;
SELECT * FROM User WHERE role = 'ADMIN';
SELECT phase, COUNT(*) as answered, AVG(isCorrect) as accuracy
FROM Submission
GROUP BY phase;
```

---

## Troubleshooting

### Server Won't Start

```bash
# Check PM2 logs
pm2 logs poemquizzer-server --lines 100

# Check if port is in use
sudo lsof -i :5000

# Check database connection
cd server
npx prisma db execute --stdin  # Test connection
```

### Database Connection Issues

```bash
# Check MySQL is running
sudo systemctl status mysql

# Check user permissions
mysql -u poemquizzer_user -p -e "SHOW DATABASES;"

# Reset password if needed
sudo mysql -u root
ALTER USER 'poemquizzer_user'@'localhost' IDENTIFIED BY 'new_password';
FLUSH PRIVILEGES;
```

### Nginx Errors

```bash
# Check Nginx logs
sudo tail -f /var/log/nginx/error.log

# Test config syntax
sudo nginx -t

# Reload Nginx (no downtime)
sudo systemctl reload nginx
```

### Frontend Not Loading

```bash
# Rebuild client
npm run build:client

# Check Nginx is serving correct path
ls -la /var/www/poemquizzer/client/dist/

# Clear browser cache or hard refresh (Ctrl+Shift+R)
```

### PM2 Process Keeps Restarting

```bash
# Check memory usage
pm2 monit

# Restart with more memory
pm2 restart poemquizzer-server --max-memory-restart 1G

# Check Node.js version
node -v  # Should be >= 18
```

---

## Monitoring & Maintenance

### PM2 Monitoring

```bash
# Real-time monitoring
pm2 monit

# Detailed info
pm2 show poemquizzer-server

# Restart app
pm2 restart poemquizzer-server

# Stop app
pm2 stop poemquizzer-server
```

### Log Rotation

```bash
# Install PM2 logrotate
pm2 install pm2-logrotate

# Configure
pm2 set pm2-logrotate:max_size 50M
pm2 set pm2-logrotate:retain 10
```

### Automated Backups (Cron)

```bash
# Edit crontab
crontab -e

# Add daily backup at 3 AM
0 3 * * * mysqldump -u poemquizzer_user -p'PASSWORD' poemquizzer > /backups/poemquizzer_$(date +\%Y\%m\%d).sql
# Keep last 30 days
0 4 * * * find /backups -name "poemquizzer_*.sql" -mtime +30 -delete
```

---

## Quick Reference

| Command | Description |
|---------|-------------|
| `npm run dev` | Start local development |
| `npm run build` | Build for production |
| `npm run docker:up` | Start Docker stack |
| `npm run db:migrate` | Run DB migrations |
| `npm run db:seed` | Seed database |
| `npm run db:studio` | Open Prisma Studio |
| `pm2 logs` | View PM2 logs |
| `pm2 restart all` | Restart all PM2 processes |
| `pm2 save` | Save PM2 process list |
| `sudo nginx -t` | Test Nginx config |

---

*For additional help, check the main README.md or contact the development team.*
