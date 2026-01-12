# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## CRITICAL: Next.js 15+ Async Params (PRODUCTION BUG FIX)

**In Next.js 15+, `params` in API routes and dynamic pages is a Promise and MUST be awaited:**

```typescript
// ✅ CORRECT
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  // use id...
}

// ❌ WRONG - params.id will be undefined in production!
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const id = params.id; // undefined!
}
```

This applies to ALL dynamic routes: `[id]`, `[slug]`, `[...path]`, etc.

## Project Overview

The Loveworld Europe Campaign Portal is a Next.js 16.1.1 application supporting Christian content broadcasting across 60 European languages. It handles two main campaign types:
- **Adopt a Language** - £150/month recurring sponsorship for exclusive language channel adoption
- **Sponsor Translation** - £150/month recurring sponsorship for live Passacris program translation

## EXTREMELY IMPORTANT: Code Quality Checks

**ALWAYS run the following commands before completing any task:**

1. Automatically use the IDE's built-in diagnostics tool to check for linting and type errors:
   - Run `mcp__ide__getDiagnostics` to check all files for diagnostics  
   - Fix any linting or type errors before considering the task complete  
   - Do this for any file you create or modify

This is a CRITICAL step that must NEVER be skipped when working on any code-related task.

## IMPORTANT

- Always prioritize writing clean, simple, and modular code.
- Use simple & easy-to-understand language. Write in short sentences.
- DO NOT BE LAZY! Always read files IN FULL!!

## UI DESIGN PRINCIPLES

- Our app is "light mode" by default (`#1226AA` primary, `#FFBF06` secondary).
- Minimalist UI with clean, simple layouts and ample spacing.
- Consistent text hierarchy (white primary, gray-300/400/500 secondary).
- Card-based layout with subtle borders (`#1226AA`, `#00AEEF`).
- Responsive design that adapts from mobile to desktop.
- Interactive elements have clear hover states and transitions.
- Extensive use of tooltips for additional context.
- DO NOT use colors like `text-gray-XXX` or `bg-gray-XXX`; instead, use `neutral-XXX`!
- Responsive mobile-first design: always think about how the UI will look on mobile.
- ALSO ensure our UI works on tablet/iPad sizes.

## HEADER COMMENTS

- EVERY file HAS TO start with 4 lines of comments!
  1. Exact file location in codebase  
  2. Clear description of what this file does  
  3. Clear description of WHY this file exists  
  4. RELEVANT FILES: comma-separated list of 2–4 most relevant files  
- NEVER delete these "header comments" from the files you're editing.

## Architecture

### Tech Stack
- **Frontend**: Next.js 16.1.1, React 19, TypeScript, Tailwind CSS v4
- **Backend**: Next.js API Routes with Prisma 7.2.0 ORM
- **Database**: PostgreSQL
- **Payments**: Stripe (recurring subscriptions)
- **Authentication**: NextAuth with JWT-based admin system and role-based access
- **Email**: Nodemailer with Brevo SMTP
- **Testing**: Jest 30 with React Testing Library

### Core Models (Prisma Schema)
- **Partner**: Donor/supporter information with Stripe customer integration
- **Language**: 60 European languages with adoption status tracking
- **Campaign**: Links partners to languages with subscription management
- **Payment**: Transaction history with Stripe payment intent tracking
- **Admin**: Role-based admin users (SUPER_ADMIN, CAMPAIGN_MANAGER, FINANCE, VIEWER)
- **Communication**: Partner interaction logs
- **CheckoutSettings**: Admin-configurable checkout flow, currencies, and amounts

### Directory Structure
- `src/app/` - Next.js App Router pages and API routes
- `src/app/api/` - API routes (admin/, auth/, payments/, webhooks/, etc.)
- `src/app/admin/` - Admin dashboard pages
- `src/components/` - Reusable React components with ui/ subfolder for design system
- `src/lib/` - Core utilities (auth.ts, prisma.ts, stripe.ts, email.ts, utils.ts)
- `src/types/` - TypeScript type definitions
- `src/hooks/` - Custom React hooks
- `src/utils/` - Utility functions
- `prisma/` - Database schema and migrations

## Common Development Commands

```bash
# Development server
npm run dev

# Database operations
npm run db:generate    # Generate Prisma client
npm run db:migrate     # Run database migrations
npm run db:seed        # Seed database with initial data
npm run db:studio      # Open Prisma Studio
npm run db:reset       # Reset database (dev only)

# Testing
npm test               # Run Jest tests
npm run test:watch     # Run tests in watch mode
npm run test:coverage  # Generate coverage reports

# Production builds
npm run build          # Build for production
npm start              # Start production server

# Code quality
npm run lint           # ESLint checking
```

## Key Configuration

### Environment Variables Required
- `DATABASE_URL` - PostgreSQL connection string
- `NEXTAUTH_URL` - Application base URL
- `NEXTAUTH_SECRET` - JWT signing secret
- Stripe keys: `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`
- Brevo email settings: `BREVO_SMTP_HOST`, `BREVO_SMTP_PORT`, `BREVO_SMTP_USER`, `BREVO_SMTP_KEY`

### Payment Flow Architecture
1. Frontend creates payment intent via `/api/payments/create-intent`
2. Stripe Elements handles secure card collection
3. Stripe webhooks update payment status via `/api/webhooks/stripe`
4. Subscription management tracks recurring £150 monthly payments
5. Campaign status updates based on payment success/failure

### Admin Authentication System
- JWT tokens for session management
- Role-based access control with 4 permission levels
- Protected API routes using middleware.ts
- Admin login at `/admin/login`

## Admin Interface Design

### Modern Card-Based Admin Pages
- **Languages Admin Page** (`/admin/languages`) - Completely redesigned with modern card-based layout
  - Statistics dashboard with key metrics (Total, Active, Adopted, Need Sponsorship, Total Speakers)
  - Beautiful language cards with visual status badges and priority indicators
  - Advanced search and filtering (by region, status, active/inactive)
  - Comprehensive edit modal with all language fields
  - Enhanced delete confirmation with context awareness
  - Responsive grid layout (1 column mobile, 2 tablet, 3 desktop)

### Checkout Settings Admin
- **Amount Configuration** - User-friendly interface displaying amounts in pounds (£) instead of pence
  - Automatic conversion between pounds (UI) and pence (API/database)
  - Real-time preview of formatted currency amounts
  - Separate preset amounts for "Adopt Language" vs "Sponsor Translation" campaigns

### Partner Management (SUPER_ADMIN Only)
- **Reset Financial Givings** (`/admin/partners` page)
  - Deletes all payment records for a partner
  - Cancels all Stripe subscriptions
  - Sets all campaigns to CANCELLED status
  - Preserves partner account for future re-engagement
  - Single confirmation with detailed consequences

- **Delete Partner** (`/admin/partners` page)
  - Permanently removes partner and ALL related data
  - Cancels Stripe subscriptions and deletes Stripe customer
  - Uses database CASCADE to delete campaigns, payments, communications
  - Double confirmation required (confirm dialog + type partner's last name)

## Development Guidelines

### **MANDATORY Development Workflow**

#### Security & Best Practices (NON-NEGOTIABLE)
- **ALWAYS** write secure, best practice code following industry standards
- **NEVER** expose sensitive data (API keys, secrets, passwords) in code or commits
- **ALWAYS** validate inputs using Zod schemas before processing
- **ALWAYS** use parameterized queries via Prisma (never raw SQL)
- **ALWAYS** implement proper error handling with appropriate HTTP status codes

#### Test-Driven Development (REQUIRED FOR ALL FUNCTIONS)
1. **ALWAYS** write comprehensive tests for every new function created
2. **IMMEDIATELY** execute tests after writing them using `npm test`
3. **ITERATE** the function implementation based on test results until all tests pass
4. **DELETE** test scripts only after confirming all tests pass successfully
5. **NEVER** skip testing - this is a financial application handling real transactions

#### Git Workflow (MANDATORY)
- **ALWAYS** commit changes after each new function is successfully added to the codebase
- **ALWAYS** run `npm run lint` before committing
- **ALWAYS** ensure tests pass before committing
- Commit message format: `feat: add [function description]` or `fix: resolve [issue description]`

### Database Changes
Always run migrations when database schema changes:
```bash
npm run db:generate && npm run db:migrate
```

### Testing Approach
- **EVERY** function must have corresponding Jest tests in `src/__tests__/`
- API endpoints have comprehensive tests in `src/__tests__/api/`
- Test payment flows thoroughly including webhook scenarios
- Use testing database separate from development
- Run tests immediately after writing them: `npm test`

### Styling Conventions
- Uses Tailwind CSS v4 with custom design system
- Brand colors: Deep Blue (#1e3a8a), Gold (#f59e0b), Crimson (#dc2626)
- Custom fonts: Inter (body), Playfair Display (headings)
- Components follow consistent naming patterns

### API Design
- RESTful endpoints following `/api/[resource]/[action]` pattern
- All admin endpoints require authentication middleware
- Stripe webhook signature verification required
- Error handling with proper HTTP status codes

### Security Considerations
- Input validation using Zod schemas
- SQL injection protection via Prisma ORM
- Stripe webhook signature verification
- JWT token validation for admin routes
- Environment variables never exposed to frontend (except NEXT_PUBLIC_*)

This is a production-ready application handling real financial transactions. Always test payment flows thoroughly and follow security best practices when making changes.