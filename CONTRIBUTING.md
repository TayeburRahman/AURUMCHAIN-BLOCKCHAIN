# Contributing to GoldenFleece

Thank you for your interest in contributing to the GoldenFleece platform! This guide is specifically for backend developers working on the API integration.

## 📋 Before You Start

1. **Read the Documentation**
   - [README.md](README.md) - Project overview and architecture
   - [BACKEND_INTEGRATION.md](BACKEND_INTEGRATION.md) - Complete API specification
   - `uploads/DevelopmentProposal1.pdf` - Backend RFP document

2. **Set Up Your Environment**
   ```bash
   # Clone the frontend repository
   git clone https://github.com/rsturua/goldenfleece.git
   cd goldenfleece

   # Install dependencies
   npm install

   # Copy environment template
   cp .env.example .env.local

   # Edit .env.local with your backend API URL
   # NEXT_PUBLIC_API_URL=http://localhost:4000

   # Run development server
   npm run dev
   ```

3. **Review the Code Structure**
   - `/lib/domains/*` - Business logic domains
   - `/app/api/*` - Current API routes (to be replaced by your backend)
   - `/supabase/migrations/*` - Database schema reference

## 🔧 Development Workflow

### For Backend Developers

#### Phase 1: Authentication (Week 1)
**Priority:** HIGH

Implement these endpoints first:
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `POST /api/auth/refresh`

**Testing:**
```bash
# Frontend will call these endpoints from:
# - /app/login/page.tsx
# - /app/signup/page.tsx
# - /lib/domains/auth/service.ts

# Test login flow:
# 1. Go to http://localhost:3000/login
# 2. Enter credentials
# 3. Check Network tab for API calls
```

**Success Criteria:**
- [ ] User can register a new account
- [ ] User can login with email/password
- [ ] JWT token is returned and stored
- [ ] Protected routes verify JWT tokens
- [ ] Token refresh works before expiration

#### Phase 2: Projects (Week 2)
**Priority:** HIGH

Implement:
- `GET /api/projects` - List projects
- `GET /api/projects/:id` - Project details
- `POST /api/admin/projects` - Create project (admin)
- `PUT /api/admin/projects/:id` - Update project (admin)
- `DELETE /api/admin/projects/:id` - Delete project (admin)

**Testing:**
```bash
# Frontend pages that use these:
# - /app/projects/page.tsx (public project list)
# - /app/admin/projects/page.tsx (admin CRUD)

# Test project browsing:
# 1. Go to http://localhost:3000/projects
# 2. Projects should load from your API
```

**Success Criteria:**
- [ ] Public users can browse projects
- [ ] Admin can create/edit/delete projects
- [ ] Images and documents URLs are handled correctly
- [ ] Project status transitions work

#### Phase 3: Wallet Integration (Week 3)
**Priority:** MEDIUM

Implement:
- `POST /api/wallet/connect`
- `POST /api/wallet/verify`
- `GET /api/wallet`
- `DELETE /api/wallet`

**Testing:**
```bash
# Frontend integration:
# - /app/dashboard/wallet/page.tsx
# - /lib/domains/wallet/service.ts

# Test wallet connection:
# 1. Login to dashboard
# 2. Go to Wallet tab
# 3. Connect MetaMask
# 4. Sign verification message
```

**Success Criteria:**
- [ ] Wallet connection saves to database
- [ ] Signature verification works
- [ ] Eligibility state updates to 'wallet_verified'

#### Phase 4: KYC/Compliance (Week 4)
**Priority:** HIGH

Implement:
- `POST /api/kyc/submit`
- `GET /api/kyc/profile`
- `GET /api/kyc/status`
- `POST /api/compliance/webhook` (Sumsub)
- `GET /api/eligibility`

**Testing:**
```bash
# Frontend integration:
# - /app/onboarding/page.tsx
# - /lib/domains/compliance/service.ts

# Test KYC flow:
# 1. Complete wallet connection first
# 2. Submit KYC application
# 3. Simulate Sumsub webhook (approved)
# 4. Verify eligibility updates
```

**Success Criteria:**
- [ ] Sumsub applicant creation works
- [ ] Webhook handling is secure (signature verification)
- [ ] Eligibility transitions: kyc_pending → kyc_approved → investment_eligible
- [ ] KYC status visible in dashboard

#### Phase 5: Investments (Week 5-6)
**Priority:** CRITICAL

Implement:
- `POST /api/investments` - Create investment
- `GET /api/investments` - List user investments
- `GET /api/investments/:id` - Investment details
- `POST /api/investments/:id/complete` - Complete after blockchain TX
- `GET /api/portfolio` - Portfolio summary

**Testing:**
```bash
# Frontend integration:
# - /app/projects/page.tsx (Invest button)
# - /app/dashboard/investments/page.tsx
# - /lib/domains/investments/service.ts

# Test investment flow:
# 1. Ensure user is investment_eligible
# 2. Click "Invest Now" on a funding project
# 3. Enter amount (>= min_investment)
# 4. Send USDT/USDC to treasury wallet
# 5. Complete investment with TX hash
# 6. Verify tokens are minted
```

**Success Criteria:**
- [ ] Investment creation validates eligibility
- [ ] Payment instructions are returned correctly
- [ ] Blockchain transaction verification works
- [ ] Smart contract mints tokens to user wallet
- [ ] Project funding updates correctly
- [ ] Transaction log is created

#### Phase 6: Payouts/Dividends (Week 7)
**Priority:** MEDIUM

Implement:
- `GET /api/payouts` - List user payouts
- `POST /api/payouts/:id/claim` - Claim dividend
- `POST /api/admin/payouts/create` - Create payout cycle

**Testing:**
```bash
# Frontend integration:
# - /app/dashboard/portfolio/page.tsx
# - /lib/domains/payouts/service.ts

# Test payout flow:
# 1. Admin creates payout cycle for project
# 2. User sees pending payout in dashboard
# 3. User clicks "Claim"
# 4. Smart contract distributes tokens
```

**Success Criteria:**
- [ ] Admin can create payout cycles
- [ ] Users see their eligible payouts
- [ ] Claim triggers smart contract distribution
- [ ] Payout status updates to 'paid'

## 🧪 Testing Guidelines

### API Testing

Use these tools for testing:
- **Postman**: Import the API collection (to be provided)
- **curl**: Quick command-line tests
- **Frontend**: Integration testing with actual UI

### Test Data

Create these test users:
```sql
-- Investor (fully verified)
INSERT INTO profiles (email, first_name, last_name)
VALUES ('investor@test.com', 'Test', 'Investor');

-- Admin
INSERT INTO profiles (email, first_name, last_name)
VALUES ('admin@test.com', 'Test', 'Admin');

INSERT INTO user_roles (user_id, role)
VALUES ('admin-uuid', 'admin');
```

### Integration Testing Checklist

- [ ] Authentication flow (signup → login → token refresh)
- [ ] Admin can create projects
- [ ] Public users can browse projects
- [ ] Wallet connection and verification
- [ ] KYC submission and webhook handling
- [ ] Investment creation and completion
- [ ] Payout creation and claiming
- [ ] Audit logs are created for all actions

## 📝 Code Style

### API Responses

Always use this format:
```typescript
// Success
{
  "success": true,
  "data": { ... }
}

// Error
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message",
    "details": {}
  }
}
```

### Error Handling

Use standard error codes from [BACKEND_INTEGRATION.md](BACKEND_INTEGRATION.md#error-handling)

### Logging

Log these events:
- All API requests (method, path, status, duration)
- Authentication attempts (success and failure)
- Admin actions
- Blockchain transactions
- Errors and exceptions

### Security

**CRITICAL:**
- Never log passwords or JWT tokens
- Always validate input data
- Use parameterized SQL queries
- Verify JWT signatures
- Check user permissions before admin actions
- Verify blockchain signatures for wallet operations
- Validate Sumsub webhook signatures

## 🔄 Git Workflow

### Branch Strategy

```bash
# Create feature branch
git checkout -b feature/auth-endpoints

# Make changes and commit
git add .
git commit -m "feat(auth): implement login and registration endpoints"

# Push to remote
git push origin feature/auth-endpoints

# Create Pull Request on GitHub
```

### Commit Message Format

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `refactor`: Code refactoring
- `test`: Adding tests
- `chore`: Maintenance tasks

**Examples:**
```
feat(auth): add JWT authentication endpoints
fix(investments): validate minimum investment amount
docs(api): update investment flow documentation
refactor(kyc): improve Sumsub integration
test(wallet): add wallet verification tests
```

## 📞 Communication

### Questions & Issues

- **GitHub Issues**: For bugs and feature requests
- **Pull Request Comments**: For code review discussions
- **Documentation**: Update this guide when adding new endpoints

### Code Review Process

1. Create Pull Request with:
   - Clear description of changes
   - Link to related issue (if any)
   - Screenshots for UI changes
   - Test results

2. Request review from frontend team

3. Address feedback and make changes

4. Merge after approval

## 🚀 Deployment

### Environment Variables

Set these in your backend environment:
- `DATABASE_URL` - PostgreSQL connection string
- `MONGODB_URL` - MongoDB connection string (if used)
- `JWT_SECRET` - Secret for signing JWT tokens
- `JWT_REFRESH_SECRET` - Secret for refresh tokens
- `SUMSUB_APP_TOKEN` - Sumsub API token
- `SUMSUB_SECRET_KEY` - Sumsub webhook secret
- `BLOCKCHAIN_RPC_URL` - Polygon/Solana RPC endpoint
- `TREASURY_WALLET_PRIVATE_KEY` - For signing transactions (use KMS)
- `CORS_ORIGIN` - Frontend URL (https://goldenfleece.vercel.app)

### Deployment Checklist

- [ ] All environment variables set
- [ ] Database migrations run
- [ ] Smart contracts deployed to testnet
- [ ] API endpoints tested with Postman
- [ ] Integration tests pass with frontend
- [ ] Security audit completed
- [ ] Logging and monitoring configured
- [ ] Rate limiting enabled
- [ ] CORS configured for frontend domain

## 📚 Resources

### Documentation
- [README.md](README.md) - Project overview
- [BACKEND_INTEGRATION.md](BACKEND_INTEGRATION.md) - API specification
- `uploads/DevelopmentProposal1.pdf` - RFP document
- `/supabase/migrations/*` - Database schema

### External Links
- [Next.js Documentation](https://nextjs.org/docs)
- [Sumsub API Docs](https://developers.sumsub.com/)
- [Polygon Documentation](https://docs.polygon.technology/)
- [Ethers.js Documentation](https://docs.ethers.org/)

## 🆘 Getting Help

If you're stuck:

1. Check the documentation first
2. Review existing code in `/lib/domains/*`
3. Open a GitHub issue with:
   - What you're trying to do
   - What you've tried
   - Error messages or unexpected behavior
   - Relevant code snippets

## ✅ Definition of Done

An endpoint is "done" when:

- [ ] Implemented according to spec in BACKEND_INTEGRATION.md
- [ ] Input validation implemented
- [ ] Error handling implemented
- [ ] Audit logging added
- [ ] Unit tests written
- [ ] Integration tests pass
- [ ] Tested with frontend
- [ ] Code reviewed and approved
- [ ] Documentation updated
- [ ] Deployed to staging environment

---

**Thank you for contributing to GoldenFleece!** 🎉

For questions, contact the project maintainers or open an issue on GitHub.
