# Production Deployment Guide for Loveworld Europe Campaign Portal

## Overview
This guide covers the deployment of the Loveworld Europe Campaign Portal to production at `give.loveworldeurope.org`.

## Prerequisites

### Domain & DNS Setup
1. **Domain**: `give.loveworldeurope.org`
2. **DNS Records**:
   - A record pointing to your server IP
   - CNAME for www subdomain (if needed)
   - MX records for email (if using custom email)

### SSL Certificate
- Use Let's Encrypt with Certbot for free SSL
- Or configure CloudFlare SSL if using CloudFlare

### Server Requirements
- **OS**: Ubuntu 20.04+ or similar Linux distribution
- **Node.js**: v18.0.0 or higher
- **RAM**: Minimum 2GB, recommended 4GB
- **Storage**: Minimum 20GB SSD
- **Database**: PostgreSQL 14+ (can be external service like Supabase)

## Environment Variables

Create a `.env.production` file with the following variables:

```bash
# Database
DATABASE_URL="postgresql://username:password@host:port/database"

# NextAuth.js
NEXTAUTH_URL="https://give.loveworldeurope.org"
NEXTAUTH_SECRET="your-nextauth-secret-here"

# Stripe
STRIPE_SECRET_KEY="sk_live_your_stripe_secret_key"
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_live_your_stripe_publishable_key"
STRIPE_WEBHOOK_SECRET="whsec_your_webhook_secret"

# Email Configuration
EMAIL_FROM="noreply@loveworldeurope.org"
SMTP_HOST="smtp.your-email-provider.com"
SMTP_PORT="587"
SMTP_USER="your-smtp-username"
SMTP_PASS="your-smtp-password"

# Admin Setup
ADMIN_EMAIL="admin@loveworldeurope.org"
ADMIN_PASSWORD="your-secure-admin-password"

# Security
NODE_ENV="production"
```

## Deployment Steps

### 1. Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js (using NodeSource repository)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 for process management
sudo npm install -g pm2

# Install Nginx for reverse proxy
sudo apt install nginx -y

# Install PostgreSQL (if hosting locally)
sudo apt install postgresql postgresql-contrib -y
```

### 2. Application Deployment

```bash
# Clone repository (adjust URL as needed)
git clone https://github.com/your-org/lweur-campaign-portal.git
cd lweur-campaign-portal

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.production
# Edit .env.production with your production values

# Generate Prisma client
npm run db:generate

# Run database migrations
npm run db:migrate

# Seed initial data
npm run db:seed

# Build the application
npm run build

# Start with PM2
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup
```

### 3. Nginx Configuration

Create `/etc/nginx/sites-available/give.loveworldeurope.org`:

```nginx
server {
    listen 80;
    server_name give.loveworldeurope.org www.give.loveworldeurope.org;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name give.loveworldeurope.org www.give.loveworldeurope.org;

    ssl_certificate /etc/letsencrypt/live/give.loveworldeurope.org/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/give.loveworldeurope.org/privkey.pem;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
}
```

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/give.loveworldeurope.org /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 4. SSL Certificate with Let's Encrypt

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Obtain SSL certificate
sudo certbot --nginx -d give.loveworldeurope.org -d www.give.loveworldeurope.org

# Set up auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

### 5. Database Setup

If using external PostgreSQL (recommended):
- Set up database on Supabase, AWS RDS, or DigitalOcean Managed Database
- Update `DATABASE_URL` in environment variables

If hosting locally:
```bash
sudo -u postgres psql
CREATE DATABASE lweur_campaign_portal;
CREATE USER lweur_user WITH ENCRYPTED PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE lweur_campaign_portal TO lweur_user;
\q
```

### 6. Stripe Configuration

1. **Live Mode Setup**:
   - Switch Stripe account to live mode
   - Get live API keys
   - Update webhook endpoints to point to production URL

2. **Webhook Configuration**:
   - Create webhook endpoint: `https://give.loveworldeurope.org/api/webhooks/stripe`
   - Events to subscribe to:
     - `invoice.payment_succeeded`
     - `invoice.payment_failed`
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`

### 7. Email Configuration

Configure SMTP settings for transactional emails:
- Use services like SendGrid, Mailgun, or AWS SES
- Set up SPF, DKIM, and DMARC records for better deliverability

### 8. Monitoring & Logging

```bash
# Set up log rotation
sudo nano /etc/logrotate.d/lweur-campaign-portal

# Install monitoring tools
npm install -g @newrelic/cli  # If using New Relic
# Or set up other monitoring like DataDog, Sentry, etc.

# PM2 monitoring
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 30
```

## Security Checklist

- [ ] SSL certificate installed and auto-renewal configured
- [ ] All environment variables properly configured
- [ ] Database access restricted to application only
- [ ] Nginx security headers configured
- [ ] Firewall configured (UFW or iptables)
- [ ] Regular backups configured for database
- [ ] Error tracking set up (Sentry recommended)
- [ ] Monitoring and alerting configured
- [ ] Admin accounts use strong passwords
- [ ] Stripe webhooks using secure secrets

## Backup Strategy

### Database Backups
```bash
# Create backup script
cat > /home/deploy/backup-db.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump $DATABASE_URL > /home/deploy/backups/db_backup_$DATE.sql
# Keep last 30 days of backups
find /home/deploy/backups -name "db_backup_*.sql" -mtime +30 -delete
EOF

chmod +x /home/deploy/backup-db.sh

# Add to crontab for daily backups at 2 AM
0 2 * * * /home/deploy/backup-db.sh
```

### Application Backups
- Keep repository synchronized with production deployment
- Regular code backups via Git
- Environment configuration backups

## Performance Optimization

### Caching
- Enable Next.js static optimization
- Configure Nginx caching for static assets
- Consider Redis for session caching if needed

### CDN
- Use CloudFlare or AWS CloudFront for static asset delivery
- Configure proper cache headers

### Database Optimization
- Regular VACUUM and ANALYZE operations
- Monitor slow queries
- Set up connection pooling if needed

## Maintenance

### Regular Updates
```bash
# Update dependencies (monthly)
npm audit fix
npm update

# Update system packages (weekly)
sudo apt update && sudo apt upgrade

# Rebuild and restart application
npm run build
pm2 restart all
```

### Health Monitoring
- Set up uptime monitoring (UptimeRobot, Pingdom)
- Configure alerts for critical issues
- Monitor database performance
- Track application performance metrics

## Rollback Procedure

In case of deployment issues:

```bash
# Rollback to previous version
pm2 stop all
git checkout previous-stable-tag
npm install
npm run build
pm2 start all

# Or restore from backup if database changes were made
psql $DATABASE_URL < /path/to/backup.sql
```

## Support & Troubleshooting

### Common Issues
1. **SSL Certificate Issues**: Check Let's Encrypt logs, verify DNS
2. **Database Connection**: Verify credentials and network access
3. **Stripe Webhooks**: Check endpoint URL and webhook secret
4. **Email Delivery**: Verify SMTP settings and DNS records

### Logs Location
- Application logs: `~/.pm2/logs/`
- Nginx logs: `/var/log/nginx/`
- System logs: `/var/log/syslog`

### Emergency Contacts
- Domain registrar support
- Hosting provider support
- Stripe support for payment issues
- Email provider support

This deployment guide ensures a robust, secure, and scalable production environment for the Loveworld Europe Campaign Portal.