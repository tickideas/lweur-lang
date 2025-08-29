# Loveworld Europe Campaign Portal - Production Deployment

## 🎯 Project Overview

The Loveworld Europe Campaign Portal is a Next.js 14 application designed to support Loveworld Europe's mission to broadcast Christian content across 60 languages in Europe, reaching 750 million souls. The platform enables two primary campaigns:

1. **Adopt a Language** - £150/month recurring payments for exclusive language channel sponsorship
2. **Sponsor Translation** - £150/month recurring payments for live Passacris program translation

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- Stripe account (live mode)
- Email service (SMTP)

### Installation
```bash
git clone https://github.com/your-org/lweur-campaign-portal.git
cd lweur-campaign-portal
npm install
```

### Environment Setup
```bash
cp .env.production.template .env.production
# Edit .env.production with your production values
```

### Database Setup
```bash
npm run db:generate
npm run db:migrate
npm run db:seed
```

### Build & Deploy
```bash
npm run build
npm start
```

## 📋 Deployment Documentation

- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Complete production deployment guide
- **[PRE_DEPLOYMENT_CHECKLIST.md](./PRE_DEPLOYMENT_CHECKLIST.md)** - Pre-deployment verification checklist
- **[ecosystem.config.js](./ecosystem.config.js)** - PM2 configuration for production

## 🏗️ Architecture Overview

### Tech Stack
- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL
- **Payments**: Stripe (recurring subscriptions)
- **Authentication**: NextAuth.js with JWT
- **Email**: Nodemailer with SMTP
- **Deployment**: PM2, Nginx, Let's Encrypt SSL

### Key Features
- Responsive campaign portal with language selection
- Secure payment processing with Stripe
- Admin dashboard with comprehensive reporting
- Automated email workflows
- Role-based access control
- Export functionality for partner data

## 🔧 Configuration

### Required Environment Variables
```bash
DATABASE_URL=postgresql://...
NEXTAUTH_URL=https://give.loveworldeurope.org
NEXTAUTH_SECRET=...
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
EMAIL_FROM=noreply@loveworldeurope.org
SMTP_HOST=...
SMTP_USER=...
SMTP_PASS=...
```

### Stripe Configuration
1. Set up live mode in Stripe dashboard
2. Configure webhook endpoint: `/api/webhooks/stripe`
3. Subscribe to events:
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
   - `customer.subscription.*`

## 📊 Monitoring & Maintenance

### Health Checks
- Application: `https://give.loveworldeurope.org/api/health`
- Database: Monitor connection pools and query performance
- Payments: Monitor webhook deliveries in Stripe dashboard

### Backup Strategy
- **Database**: Daily automated backups at 2 AM UTC
- **Application**: Git-based version control
- **Configuration**: Encrypted backup of environment variables

### Monitoring Tools
- **Uptime**: UptimeRobot or Pingdom
- **Errors**: Sentry (recommended)
- **Performance**: New Relic or DataDog
- **Logs**: PM2 log management with rotation

## 🔒 Security

### Security Measures
- SSL/TLS encryption (Let's Encrypt)
- Security headers via Nginx
- Environment variable encryption
- Admin authentication with JWT
- Stripe webhook signature verification
- Input validation with Zod

### Access Control
- **Super Admin**: Full system access
- **Campaign Manager**: Campaign and partner management
- **Finance**: Payment and financial reporting
- **Viewer**: Read-only dashboard access

## 📈 Performance

### Optimization Features
- Next.js static optimization
- Image optimization with Next.js Image
- Database query optimization
- Nginx caching for static assets
- CDN integration ready

### Performance Targets
- Page load time: < 3 seconds
- First Contentful Paint: < 1.5 seconds
- Time to Interactive: < 3 seconds

## 🧪 Testing

### Test Coverage
- API endpoint testing with Jest
- Payment flow integration tests
- Email system validation
- Admin dashboard functionality
- Responsive design testing

### Running Tests
```bash
npm test                # Run all tests
npm run test:watch      # Watch mode
npm run test:coverage   # Coverage report
```

## 📞 Support & Troubleshooting

### Common Issues
1. **Payment Processing**: Check Stripe webhook logs
2. **Email Delivery**: Verify SMTP settings and DNS records
3. **Database Connection**: Check connection string and network access
4. **SSL Issues**: Verify certificate and renewal process

### Log Locations
- Application: `~/.pm2/logs/`
- Nginx: `/var/log/nginx/`
- System: `/var/log/syslog`

### Emergency Procedures
See [PRE_DEPLOYMENT_CHECKLIST.md](./PRE_DEPLOYMENT_CHECKLIST.md) for detailed emergency procedures and rollback plans.

## 📚 API Documentation

### Public Endpoints
- `POST /api/payments/create-intent` - Create payment intent
- `POST /api/webhooks/stripe` - Stripe webhook handler

### Admin Endpoints (Protected)
- `GET /api/admin/reports` - Generate reports
- `POST /api/emails` - Send emails
- `GET /api/admin/dashboard` - Dashboard metrics

### Authentication
Admin endpoints require JWT token in Authorization header:
```
Authorization: Bearer <jwt_token>
```

## 🎨 Design System

### Brand Colors
- **Primary**: Deep Blue (#1e3a8a)
- **Secondary**: Gold (#f59e0b)
- **Accent**: Crimson (#dc2626)

### Typography
- **Headings**: Playfair Display
- **Body**: Inter

## 📄 License

This project is proprietary to Loveworld Europe. All rights reserved.

## 📧 Contact

For technical issues or deployment questions, contact:
- **Project Manager**: [Contact Information]
- **Technical Lead**: [Contact Information]
- **Emergency Contact**: [Contact Information]

---

**Production URL**: https://give.loveworldeurope.org  
**Last Updated**: December 2024  
**Version**: 1.0.0