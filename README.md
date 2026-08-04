# GoldenFleece - Tokenized Investment Platform

[![Next.js](https://img.shields.io/badge/Next.js-16.1.4-black)](https://nextjs.org/)
[![Solana](https://img.shields.io/badge/Solana-Anchor-14F195)](https://solana.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9.3-blue)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.1.18-38bdf8)](https://tailwindcss.com/)

**GoldenFleece** is a tokenized investment platform enabling fractional ownership of real-world assets (gold mining, real estate) through Solana blockchain technology.

## 📋 Table of Contents

- [Overview](#overview)
- [Milestone 2 Accomplishments](#-milestone-2-accomplishments)
- [Architecture](#architecture)
- [Directory Structure](#directory-structure)
- [Getting Started](#getting-started)
- [Deployment](#deployment)

---

## 🎯 Overview

This repository contains the **full-stack implementation** (Next.js frontend + Anchor smart contracts) for the GoldenFleece platform.

### Core Features (Milestone 2)
- **On-Chain Project Registry**: Create and manage investment projects on Solana.
- **Compliance Layer**: Automated investor whitelisting and eligibility checks.
- **Subscription Engine**: Secure USDC-based investment flow with atomic settlement.
- **Tokenization Service**: Automatic minting of project-specific security tokens.
- **Profit Distribution**: Pro-rata dividend distribution to token holders.
- **Admin Dashboard**: Comprehensive control panel for project lifecycle management.

---

## ✅ Milestone 2 Accomplishments

- [x] **Smart Contracts**: Deployed `project_registry`, `compliance_transfer`, and `allocation_distribution` to Devnet.
- [x] **Frontend Integration**: Linked Next.js dashboard with Solana `web3.js` for all admin and investor actions.
- [x] **Security**: Implemented restricted token transfers and authority handover preparations.
- [x] **Testing**: 100% pass rate on core flow integration tests (subscription, settlement, and distribution).

---

## 🏗️ Architecture

### Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend Framework** | Next.js 16.1.4 (App Router) | SSR, routing, UI |
| **Smart Contracts** | Rust + Anchor Framework | Business logic on Solana |
| **Blockchain** | Solana (Devnet) | High-speed, low-cost settlement |
| **Database** | Supabase PostgreSQL | Off-chain indexing & user metadata |
| **Web3 Integration** | @solana/web3.js + Anchor | RPC communication |
| **Wallet** | Solana Wallet Adapter | Phantom / Solflare support |

---

## 📁 Directory Structure

```
GoldenFleece/
├── app/                              # Next.js App Router (Admin & Investor)
├── programs/                         # Solana Smart Contracts (Rust/Anchor)
│   ├── project_registry/             # Project & Token management
│   ├── compliance_transfer/          # Whitelist & transfer rules
│   └── allocation_distribution/      # Payout & dividend logic
├── lib/                              # Shared Business Logic
│   ├── web3/                         # Blockchain Services
│   │   ├── services/                 # Admin & Investor blockchain logic
│   │   └── idl/                      # Smart contract definitions
│   └── supabase/                     # Database & indexing
├── scripts/                          # Deployment & Maintenance scripts
├── tests/                            # Integration & Unit Tests
│   ├── eligibility.ts                # KYC/Compliance tests
│   ├── subscription.ts               # Investment flow tests
│   └── tokenization.ts               # Token minting tests
├── Anchor.toml                       # Anchor configuration & Program IDs
└── package.json                      # Project dependencies & scripts
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Solana CLI (Latest)
- Anchor Framework 0.29.0
- Phantom Wallet (with Devnet SOL)

### Installation

```bash
# Clone the repository
git clone https://github.com/RupomGg/AURUMCHAIN.git
cd AURUMCHAIN

# Install dependencies
npm install

# Build Smart Contracts
anchor build

# Sync IDLs to Frontend
npm run sync-idl
```

### Environment Setup
Create a `.env.local` based on `.env.example`:
```bash
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.devnet.solana.com
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

---

## 📦 Deployment

### Program Addresses (Devnet)
- **Project Registry**: `Dkrnk6B8MuiieXQzqhicbsPtGp7TY4HMZRNDJJFhu4R7`
- **Compliance**: `5u14TuRE7ozsKketfqF4R7XPvi7bof9RA455VcKME3Vy`
- **Distribution**: `9RqVyvWA4ficqK351PoYh674mP1au4NmNzVM6LQcenjm`

### Frontend
Deployed on Vercel: [https://goldenfleece.vercel.app](https://goldenfleece.vercel.app)

---

## 📄 License
Proprietary - GoldenFleece Platform

---
Built with ❤️ by the GoldenFleece Team.
