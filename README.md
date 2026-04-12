# GoldenFleece - Tokenized Investment Platform (Frontend)

[![Next.js](https://img.shields.io/badge/Next.js-16.1.4-black)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2.3-blue)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9.3-blue)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.2.7-38bdf8)](https://tailwindcss.com/)

**GoldenFleece** is a tokenized investment platform enabling fractional ownership of real-world assets (gold mining projects, real estate) through blockchain technology.

> 📋 **For Backend Developers**: See `uploads/DevelopmentProposal1.pdf` for the complete backend RFP

## 📋 Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Directory Structure](#directory-structure)
- [Backend Integration](#backend-integration)
- [Getting Started](#getting-started)
- [Development](#development)
- [Migration Plan](#migration-plan)
- [Deployment](#deployment)

---

## 🎯 Overview

This repository contains the **frontend application** built with Next.js 16 (App Router). It provides:

### User-Facing Features
- **Public Landing Pages**: Marketing, project showcase, company info
- **Investor Portal**: Browse projects, invest with stablecoins, manage portfolio
- **Admin Dashboard**: Manage projects, configure tokens, monitor platform
- **KYC Flow**: Identity verification interface (Sumsub integration ready)
- **Wallet Integration**: MetaMask/WalletConnect via RainbowKit

### Current State (MVP Ready)
✅ Complete UI/UX for all investor and admin flows
✅ Responsive design (mobile + desktop)
✅ Temporary authentication via Supabase (to be replaced)
✅ Mock data and placeholder integrations
✅ Ready for backend API integration

---

## 🏗️ Architecture

### Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend Framework** | Next.js 16.1.4 (App Router) | SSR, routing, API routes |
| **UI Library** | React 19.2.3 | Component architecture |
| **Language** | TypeScript 5.9.3 | Type safety |
| **Styling** | Tailwind CSS 4.2.7 | Responsive design |
| **Auth (Temporary)** | Supabase | Will migrate to backend JWT |
| **Database (Temporary)** | Supabase PostgreSQL | Will migrate to backend |
| **Web3** | RainbowKit + Wagmi + Viem | Wallet connections |
| **Deployment** | Vercel | CI/CD, edge functions |

### Design Principles
- **Domain-Driven Design**: Business logic organized by domain (`lib/domains/`)
- **Server-Side Rendering**: Secure authentication and data fetching
- **API-Ready**: Clear separation between frontend and backend concerns
- **Type-Safe**: Full TypeScript coverage with strict mode

---

## 📁 Directory Structure

```
GoldenFleece/
├── app/                              # Next.js App Router
│   ├── (public)/                     # Public pages (no auth required)
│   │   ├── page.tsx                  # Landing page
│   │   ├── about/                    # About us
│   │   ├── projects/                 # Browse projects
│   │   └── support/                  # FAQ & contact
│   │
│   ├── (auth)/                       # Authentication pages
│   │   ├── login/
│   │   ├── signup/
│   │   └── onboarding/               # Post-signup KYC flow
│   │
│   ├── dashboard/                    # Investor portal (protected)
│   │   ├── page.tsx                  # Portfolio overview
│   │   ├── investments/              # Investment history
│   │   ├── transactions/             # Transaction log
│   │   ├── wallet/                   # Wallet management
│   │   ├── portfolio/                # Detailed holdings
│   │   └── settings/                 # User settings
│   │
│   ├── admin/                        # Admin dashboard (protected)
│   │   ├── page.tsx                  # Admin overview
│   │   ├── projects/                 # Project CRUD
│   │   ├── compliance/               # KYC review
│   │   └── audit-logs/               # (planned)
│   │
│   └── api/                          # API routes (to be replaced by backend)
│       ├── auth/                     # Login, signup, logout
│       ├── wallet/                   # Wallet connect/verify
│       ├── investments/              # Create/complete investment
│       ├── payouts/                  # Claim dividends
│       ├── admin/projects/           # Admin operations
│       └── compliance/               # KYC webhook
│
├── components/                       # React components
│   ├── admin/                        # Admin-specific components
│   │   └── ProjectsManagement.tsx    # Project CRUD UI
│   ├── ui/                           # Reusable UI components
│   ├── providers/                    # Context providers
│   │   └── WalletProvider.tsx        # RainbowKit setup
│   └── layout/                       # Layout components
│       ├── Header.tsx
│       └── Footer.tsx
│
├── lib/                              # Business logic
│   ├── domains/                      # Domain-driven structure
│   │   ├── auth/                     # Authentication domain
│   │   │   ├── service.ts            # Auth business logic
│   │   │   └── models.ts             # Auth types
│   │   ├── wallet/                   # Wallet & blockchain domain
│   │   ├── investments/              # Investment domain
│   │   ├── compliance/               # KYC/AML domain
│   │   ├── payouts/                  # Dividend distribution
│   │   ├── admin/                    # Admin operations
│   │   └── shared/                   # Shared types
│   │
│   ├── supabase/                     # Temporary Supabase client
│   │   ├── server.ts                 # Server-side client
│   │   └── client.ts                 # Client-side client
│   │
│   └── types/                        # TypeScript definitions
│       └── database.types.ts         # Database schema types
│
├── supabase/                         # Database reference
│   └── migrations/                   # SQL migration files
│       ├── 001_*.sql                 # Profiles & wallets
│       ├── 003_*.sql                 # KYC & compliance
│       ├── 004_*.sql                 # Projects
│       ├── 006_*.sql                 # Payouts
│       └── 007_*.sql                 # Audit logs & roles
│
├── public/                           # Static assets
│   ├── logo.png                      # Platform logo
│   └── fonts/                        # Custom fonts
│
├── uploads/                          # Documentation
│   └── DevelopmentProposal1.pdf      # Backend RFP (READ THIS!)
│
├── .env.local                        # Environment variables (gitignored)
├── .env.example                      # Environment template
├── next.config.ts                    # Next.js configuration
├── tailwind.config.ts                # Tailwind CSS config
└── tsconfig.json                     # TypeScript config
```

---

## 🔗 Backend Integration

### Required Backend API

The frontend expects a **RESTful API** with these endpoints:

#### 🔐 Authentication
```
POST   /api/auth/register             // User signup
POST   /api/auth/login                // User login
POST   /api/auth/logout               // User logout
GET    /api/auth/me                   // Get current user
POST   /api/auth/refresh              // Refresh JWT token
```

**Expected Request/Response:**
```typescript
// POST /api/auth/login
Request: { email: string, password: string }
Response: {
  success: true,
  data: {
    user: { id, email, first_name, last_name },
    token: "jwt_token",
    refreshToken: "refresh_token"
  }
}
```

#### 👤 KYC/Compliance
```
GET    /api/kyc/profile               // Get KYC profile
POST   /api/kyc/submit                // Submit KYC application
GET    /api/kyc/status                // Get verification status
GET    /api/eligibility               // Check investment eligibility
POST   /api/compliance/webhook        // Sumsub webhook (server-to-server)
```

#### 💼 Wallet
```
POST   /api/wallet/connect            // Link blockchain wallet
POST   /api/wallet/verify             // Verify wallet ownership
GET    /api/wallet                    // Get user's wallet
DELETE /api/wallet                    // Disconnect wallet
```

#### 🏗️ Projects
```
GET    /api/projects                  // List all projects (public)
GET    /api/projects/:id              // Get project details
POST   /api/admin/projects            // Create project (admin)
PUT    /api/admin/projects/:id        // Update project (admin)
DELETE /api/admin/projects/:id        // Delete project (admin)
```

**Project Schema:**
```typescript
{
  id: string
  name: string
  slug: string
  description: string
  location: string
  country: string
  funding_goal: number
  current_funding: number
  token_price: number
  total_tokens: number
  available_tokens: number
  expected_return_percentage: number
  project_duration_months: number
  status: 'draft' | 'funding' | 'funded' | 'active' | 'completed' | 'cancelled'
  images: string[]           // URLs to images
  documents: string[]        // URLs to documents
  video_url?: string
  created_at: string
  updated_at: string
}
```

#### 💰 Investments
```
POST   /api/investments               // Create investment
GET    /api/investments               // List user investments
GET    /api/investments/:id           // Get investment details
POST   /api/investments/:id/complete  // Complete investment (after blockchain tx)
GET    /api/portfolio                 // Get portfolio summary
```

**Investment Flow:**
1. User initiates investment (frontend calls `POST /api/investments`)
2. Backend returns payment details (wallet address, amount)
3. User sends stablecoins via MetaMask
4. Frontend detects blockchain transaction
5. Frontend calls `POST /api/investments/:id/complete` with tx hash
6. Backend mints project tokens to user's wallet

#### 💸 Payouts/Dividends
```
GET    /api/payouts                   // List user payouts
POST   /api/payouts/:id/claim         // Claim dividend
POST   /api/admin/payouts/create      // Create payout cycle (admin)
GET    /api/admin/payouts             // List all payouts (admin)
```

#### 🛡️ Admin
```
GET    /api/admin/users               // List users
GET    /api/admin/analytics           // Platform analytics
GET    /api/admin/compliance          // Compliance overview
POST   /api/admin/users/:id/roles     // Grant/revoke admin roles
GET    /api/admin/audit-logs          // Audit trail
```

### Authentication & Authorization

**JWT Token Structure:**
```typescript
{
  "user_id": "uuid",
  "email": "user@example.com",
  "roles": ["user"] | ["admin"] | ["compliance_officer"],
  "exp": 1234567890
}
```

**Authorization Header:**
```
Authorization: Bearer <jwt_token>
```

**Role-Based Access:**
- `user`: Can invest, view own portfolio, manage own profile
- `admin`: Can manage projects, view all users, create payouts
- `compliance_officer`: Can review KYC applications, manage eligibility
- `super_admin`: Full platform access

### Response Format

**Success:**
```json
{
  "success": true,
  "data": { ... }
}
```

**Error:**
```json
{
  "success": false,
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "Email or password is incorrect",
    "details": {}
  }
}
```

### Database Schema Reference

See `/supabase/migrations/` for complete table schemas. Key tables:

| Table | Description |
|-------|-------------|
| `profiles` | User profiles (linked to auth.users) |
| `user_roles` | Role-based access control |
| `projects` | Investment projects |
| `investments` | User investments |
| `wallets` | Linked blockchain wallets |
| `kyc_profiles` | KYC verification data |
| `eligibility_states` | Investment eligibility status |
| `transactions` | Financial transaction log |
| `dividends` | Payout records |
| `audit_logs` | Immutable audit trail |

**Note:** Backend team should adapt these schemas to fit Node.js + PostgreSQL/MongoDB architecture.

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ (Next.js 16 requirement)
- npm or yarn
- Git

### Installation

```bash
# Clone the repository
git clone https://github.com/rsturua/goldenfleece.git
cd goldenfleece

# Install dependencies
npm install

# Copy environment template
cp .env.example .env.local

# Edit .env.local with your values (see below)
```

### Environment Variables

Create `.env.local`:

```bash
# ============================================
# TEMPORARY (Supabase - will be removed)
# ============================================
NEXT_PUBLIC_SUPABASE_URL=https://qyhxgswnrkkwfmukvmie.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# ============================================
# REQUIRED (Keep for production)
# ============================================

# WalletConnect (get from https://cloud.walletconnect.com)
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_walletconnect_id

# Backend API (to be set when backend is ready)
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_API_KEY=your_api_key

# Blockchain Network
NEXT_PUBLIC_BLOCKCHAIN_NETWORK=polygon-mumbai  # or polygon-mainnet, solana-devnet, etc.
NEXT_PUBLIC_CHAIN_ID=80001  # Polygon Mumbai testnet

# Stablecoin Addresses (testnet)
NEXT_PUBLIC_USDT_ADDRESS=0x...
NEXT_PUBLIC_USDC_ADDRESS=0x...

# Frontend URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Build for Production

```bash
npm run build
npm start
```

---

## 💻 Development

### Code Conventions

- **TypeScript**: Strict mode enabled
- **File Naming**:
  - Pages: `kebab-case.tsx`
  - Components: `PascalCase.tsx`
  - Utilities: `camelCase.ts`
- **Imports**: Use absolute imports with `@/` prefix
- **Comments**: JSDoc for exported functions
- **Git Commits**: Conventional commits (feat:, fix:, docs:, refactor:)

### Project Commands

```bash
npm run dev          # Start development server
npm run build        # Production build
npm start            # Start production server
npm run lint         # ESLint check
npm run type-check   # TypeScript check
```

### Design System

**Colors:**
- Primary (Gold): `#D4AF37`, `#E6C870`, `#C19A2E`
- Background (Navy): `#0A0E27`, `#131840`
- Neutral: Gray scale for text/borders

**Components:**
- Glass-morphism cards (`glass` class)
- Gradient gold buttons
- Responsive navigation
- Toast notifications (react-hot-toast)

---

## 🔄 Migration Plan (Supabase → Backend)

### Phase 1: Authentication (Week 1)
- [ ] Replace Supabase Auth with backend JWT
- [ ] Update `lib/supabase/server.ts` to call backend API
- [ ] Migrate sessions to JWT tokens
- [ ] Test login/signup/logout flows

### Phase 2: Database Operations (Week 2-3)
- [ ] Replace Supabase queries with REST API calls
- [ ] Update all `lib/domains/*` services
- [ ] Remove Supabase client dependencies
- [ ] Update type definitions

### Phase 3: KYC Integration (Week 4)
- [ ] Integrate backend Sumsub endpoints
- [ ] Update onboarding flow
- [ ] Sync eligibility states with backend
- [ ] Test KYC approval/rejection flows

### Phase 4: Blockchain Operations (Week 5-6)
- [ ] Connect to backend smart contract APIs
- [ ] Implement stablecoin investment flow
- [ ] Add dividend distribution UI
- [ ] Test on testnet (Polygon Mumbai)

### Phase 5: Cleanup (Week 7)
- [ ] Remove all Supabase dependencies
- [ ] Delete `supabase/` directory
- [ ] Update documentation
- [ ] Final testing and deployment

---

## 📦 Deployment

### Vercel (Recommended)

The app is deployed on Vercel with automatic deploys from `main` branch.

**Live URL:** https://goldenfleece.vercel.app

**Deploy Your Own:**
1. Fork this repository
2. Go to [vercel.com/new](https://vercel.com/new)
3. Import the repository
4. Set environment variables
5. Deploy!

### Environment Variables in Vercel

Add these in Vercel Dashboard → Settings → Environment Variables:

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=...
NEXT_PUBLIC_API_URL=https://api.goldenfleece.com
NEXT_PUBLIC_BLOCKCHAIN_NETWORK=polygon-mainnet
```

---

## 👥 For Backend Developers

### Getting Started Checklist
- [ ] Read `uploads/DevelopmentProposal1.pdf` (backend RFP)
- [ ] Review "Backend Integration" section above
- [ ] Check database schema in `/supabase/migrations/`
- [ ] Review domain logic in `/lib/domains/`
- [ ] Set up local Node.js backend
- [ ] Implement `/api/auth/*` endpoints first
- [ ] Test with this frontend locally

### API Development Tips
1. Use the database schema in `/supabase/migrations/` as reference
2. Match the request/response formats specified above
3. Implement proper error handling with error codes
4. Add comprehensive logging for debugging
5. Use environment variables for configuration
6. Test with frontend running on `localhost:3000`

### Communication
- **GitHub Issues**: For bugs and feature requests
- **Pull Requests**: For code review
- **Documentation**: Update this README when backend is ready

---

## 📄 License

Proprietary - GoldenFleece Platform

---

## 📧 Contact

**Project Owner**: Datuna Giorgadze
**Frontend Repository**: https://github.com/rsturua/goldenfleece
**Backend RFP**: `uploads/DevelopmentProposal1.pdf`

---

Built with ❤️ using Next.js, TypeScript, and Web3 technologies.

**GoldenFleece** by AurumChain - Democratizing Gold Mine Ownership
