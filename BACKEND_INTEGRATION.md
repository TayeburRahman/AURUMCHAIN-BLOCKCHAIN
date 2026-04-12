# Backend Integration Guide

This document provides detailed integration specifications for backend developers implementing the GoldenFleece API.

## Table of Contents
- [Overview](#overview)
- [Authentication Flow](#authentication-flow)
- [API Endpoints Specification](#api-endpoints-specification)
- [Data Models](#data-models)
- [Error Handling](#error-handling)
- [Security Requirements](#security-requirements)
- [Testing](#testing)

---

## Overview

The GoldenFleece frontend is built with Next.js and expects a RESTful API backend. All endpoints should:

- Return JSON responses
- Use proper HTTP status codes
- Follow consistent response formats
- Implement JWT-based authentication
- Support CORS for frontend domain

**Base URL (Development):** `http://localhost:4000`
**Base URL (Production):** `https://api.goldenfleece.com`

---

## Authentication Flow

### 1. User Registration

**Endpoint:** `POST /api/auth/register`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "first_name": "John",
  "last_name": "Doe"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid-v4",
      "email": "user@example.com",
      "first_name": "John",
      "last_name": "Doe",
      "created_at": "2026-03-10T12:00:00Z"
    },
    "token": "eyJhbGc...",
    "refresh_token": "eyJhbGc..."
  }
}
```

**Error Response (400):**
```json
{
  "success": false,
  "error": {
    "code": "EMAIL_ALREADY_EXISTS",
    "message": "An account with this email already exists",
    "details": {
      "field": "email"
    }
  }
}
```

**Validation Rules:**
- Email: Valid email format, unique
- Password: Minimum 8 characters, at least 1 uppercase, 1 lowercase, 1 number
- First/Last name: 2-50 characters

**Backend Actions:**
1. Validate input data
2. Check if email already exists
3. Hash password (bcrypt, 12 rounds)
4. Create user in `profiles` table
5. Create corresponding `eligibility_states` record (status: 'registered')
6. Generate JWT token (expires in 24h)
7. Generate refresh token (expires in 30 days)
8. Create audit log entry (event_type: 'account_created')
9. Return user data and tokens

### 2. User Login

**Endpoint:** `POST /api/auth/login`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid-v4",
      "email": "user@example.com",
      "first_name": "John",
      "last_name": "Doe",
      "roles": ["user"]
    },
    "token": "eyJhbGc...",
    "refresh_token": "eyJhbGc..."
  }
}
```

**Error Response (401):**
```json
{
  "success": false,
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "Email or password is incorrect"
  }
}
```

**Backend Actions:**
1. Validate input
2. Find user by email
3. Verify password hash
4. Check if account is suspended
5. Load user roles from `user_roles` table
6. Generate new JWT and refresh tokens
7. Create audit log entry (event_type: 'account_login')
8. Return user data and tokens

### 3. Token Refresh

**Endpoint:** `POST /api/auth/refresh`

**Request Headers:**
```
Authorization: Bearer <refresh_token>
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "token": "new_jwt_token",
    "refresh_token": "new_refresh_token"
  }
}
```

**Backend Actions:**
1. Verify refresh token signature
2. Check token expiration
3. Generate new JWT token
4. Generate new refresh token
5. Return new tokens

### 4. Get Current User

**Endpoint:** `GET /api/auth/me`

**Request Headers:**
```
Authorization: Bearer <jwt_token>
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid-v4",
      "email": "user@example.com",
      "first_name": "John",
      "last_name": "Doe",
      "roles": ["user"],
      "kyc_verified": false,
      "wallet_address": null,
      "created_at": "2026-03-10T12:00:00Z"
    }
  }
}
```

---

## API Endpoints Specification

### Projects

#### List All Projects (Public)

**Endpoint:** `GET /api/projects`

**Query Parameters:**
- `status`: Filter by status (funding, active, completed)
- `limit`: Number of results (default: 20)
- `offset`: Pagination offset (default: 0)

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "projects": [
      {
        "id": "uuid",
        "name": "Ashanti Gold Mine",
        "slug": "ashanti-gold-mine",
        "description": "Small-scale gold mining project in Ghana",
        "location": "Ashanti Region",
        "country": "Ghana",
        "funding_goal": 500000,
        "current_funding": 250000,
        "min_investment": 1000,
        "token_price": 10,
        "total_tokens": 50000,
        "available_tokens": 25000,
        "expected_return_percentage": 15.5,
        "project_duration_months": 24,
        "status": "funding",
        "images": ["https://..."],
        "documents": ["https://..."],
        "created_at": "2026-01-01T00:00:00Z",
        "updated_at": "2026-03-10T12:00:00Z"
      }
    ],
    "total": 10,
    "limit": 20,
    "offset": 0
  }
}
```

#### Get Project Details

**Endpoint:** `GET /api/projects/:id`

**Success Response (200):** Same as project object above, but with additional fields:
```json
{
  "success": true,
  "data": {
    "project": {
      // ... all fields from list endpoint
      "latitude": 6.699,
      "longitude": -1.625,
      "start_date": "2026-01-15T00:00:00Z",
      "expected_completion_date": "2028-01-15T00:00:00Z",
      "video_url": "https://youtube.com/...",
      "investors_count": 45,
      "funding_percentage": 50.0
    }
  }
}
```

#### Create Project (Admin Only)

**Endpoint:** `POST /api/admin/projects`

**Request Headers:**
```
Authorization: Bearer <admin_jwt_token>
```

**Request Body:**
```json
{
  "name": "New Gold Mine Project",
  "slug": "new-gold-mine-project",
  "description": "Description of the project",
  "location": "Talensi District",
  "country": "Ghana",
  "funding_goal": 1000000,
  "min_investment": 500,
  "token_price": 20,
  "total_tokens": 50000,
  "expected_return_percentage": 18.0,
  "project_duration_months": 36,
  "status": "draft",
  "images": ["url1", "url2"],
  "documents": ["doc_url1"]
}
```

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "project": {
      "id": "new-uuid",
      // ... full project object
    }
  }
}
```

**Backend Actions:**
1. Verify JWT token
2. Check user has 'admin' role
3. Validate all required fields
4. Generate unique slug if not provided
5. Set `available_tokens` = `total_tokens`
6. Set `current_funding` = 0
7. Insert into `projects` table
8. Create audit log entry (event_type: 'admin_action', description: 'Created project: {name}')
9. Return created project

### Investments

#### Create Investment

**Endpoint:** `POST /api/investments`

**Request Headers:**
```
Authorization: Bearer <jwt_token>
```

**Request Body:**
```json
{
  "project_id": "uuid",
  "amount": 5000,
  "payment_method": "cryptocurrency"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "investment": {
      "id": "investment-uuid",
      "user_id": "user-uuid",
      "project_id": "project-uuid",
      "amount": 5000,
      "tokens_purchased": 250,
      "token_price_at_purchase": 20,
      "status": "pending",
      "payment_details": {
        "treasury_wallet": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
        "stablecoin": "USDT",
        "amount_usdt": "5000",
        "network": "polygon"
      },
      "created_at": "2026-03-10T12:00:00Z"
    }
  }
}
```

**Error Responses:**
- 400: Insufficient funds, below minimum investment, exceeds available tokens
- 403: User not eligible to invest (KYC not approved)
- 404: Project not found

**Backend Actions:**
1. Verify JWT token
2. Check user eligibility (from `eligibility_states` table: `can_invest` must be true)
3. Validate project exists and status is 'funding'
4. Check amount >= project.min_investment
5. Calculate tokens: `amount / token_price`
6. Check available_tokens >= tokens
7. Reserve tokens (decrement `projects.available_tokens`)
8. Create `investments` record (status: 'pending')
9. Create `transactions` record (type: 'investment', status: 'pending')
10. Return investment with payment instructions
11. Create audit log (event_type: 'investment_created')

#### Complete Investment (After Blockchain TX)

**Endpoint:** `POST /api/investments/:id/complete`

**Request Headers:**
```
Authorization: Bearer <jwt_token>
```

**Request Body:**
```json
{
  "transaction_hash": "0x1234567890abcdef...",
  "blockchain_network": "polygon",
  "confirmed_amount": "5000"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "investment": {
      "id": "investment-uuid",
      "status": "completed",
      "transaction_hash": "0x1234...",
      "blockchain_confirmed": true,
      "completed_at": "2026-03-10T12:30:00Z",
      "token_mint_tx": "0xabcd..."  // Smart contract token mint transaction
    }
  }
}
```

**Backend Actions:**
1. Verify JWT token and ownership of investment
2. Verify transaction hash on blockchain
3. Confirm amount matches investment amount
4. Update `investments` record (status: 'completed', transaction_hash, completed_at)
5. Update `transactions` record (status: 'completed', blockchain_confirmed: true)
6. Update `projects.current_funding` (+= amount)
7. Call smart contract to mint project tokens to user's wallet
8. Create audit log (event_type: 'investment_completed')
9. Send notification to user
10. If project fully funded, update project status to 'funded'

### Wallet Operations

#### Connect Wallet

**Endpoint:** `POST /api/wallet/connect`

**Request Headers:**
```
Authorization: Bearer <jwt_token>
```

**Request Body:**
```json
{
  "wallet_address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  "chain_id": 137,
  "signature": "0xsigned_message"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "wallet": {
      "id": "wallet-uuid",
      "user_id": "user-uuid",
      "wallet_address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
      "chain_id": 137,
      "is_verified": false,
      "connected_at": "2026-03-10T12:00:00Z"
    }
  }
}
```

**Backend Actions:**
1. Verify JWT token
2. Validate wallet address format
3. Check if wallet already linked to another user
4. Create or update `wallets` record
5. Update `eligibility_states` (status: 'wallet_connected')
6. Create audit log (event_type: 'wallet_linked')

#### Verify Wallet Ownership

**Endpoint:** `POST /api/wallet/verify`

**Request Headers:**
```
Authorization: Bearer <jwt_token>
```

**Request Body:**
```json
{
  "wallet_address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  "signature": "0x_signed_verification_message",
  "message": "Verify ownership for GoldenFleece - Nonce: 123456"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "wallet": {
      "is_verified": true,
      "verified_at": "2026-03-10T12:05:00Z"
    }
  }
}
```

**Backend Actions:**
1. Verify JWT token
2. Recover address from signature + message
3. Verify recovered address matches wallet_address
4. Update `wallets` record (is_verified: true, verified_at)
5. Update `eligibility_states` (status: 'wallet_verified')
6. Create audit log (event_type: 'wallet_verified')

### KYC/Compliance

#### Submit KYC Application

**Endpoint:** `POST /api/kyc/submit`

**Request Headers:**
```
Authorization: Bearer <jwt_token>
```

**Request Body:**
```json
{
  "first_name": "John",
  "last_name": "Doe",
  "date_of_birth": "1990-01-01",
  "nationality": "US"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "kyc_profile": {
      "id": "kyc-uuid",
      "user_id": "user-uuid",
      "status": "pending",
      "provider": "sumsub",
      "provider_applicant_id": "SUMSUB_12345",
      "sumsub_access_token": "temporary_token_for_frontend",
      "submitted_at": "2026-03-10T12:00:00Z"
    }
  }
}
```

**Backend Actions:**
1. Verify JWT token
2. Check if KYC already submitted
3. Create applicant in Sumsub API
4. Store Sumsub applicant_id
5. Create/update `kyc_profiles` record (status: 'pending')
6. Update `eligibility_states` (status: 'kyc_pending')
7. Generate temporary Sumsub access token for frontend SDK
8. Create audit log (event_type: 'kyc_submitted')
9. Return access token for Sumsub Web SDK

#### Sumsub Webhook (Server-to-Server)

**Endpoint:** `POST /api/compliance/webhook`

**Request Headers:**
```
X-Payload-Digest: <sumsub_signature>
Content-Type: application/json
```

**Request Body:**
```json
{
  "applicantId": "SUMSUB_12345",
  "inspectionId": "inspection_id",
  "correlationId": "correlation_id",
  "externalUserId": "user-uuid",
  "type": "applicantReviewed",
  "reviewResult": {
    "reviewAnswer": "GREEN",
    "rejectLabels": [],
    "reviewRejectType": null
  },
  "createdAt": "2026-03-10 12:00:00"
}
```

**Success Response (200):**
```json
{
  "success": true
}
```

**Backend Actions:**
1. Verify Sumsub signature
2. Find `kyc_profiles` by applicant_id
3. If reviewAnswer === 'GREEN':
   - Update `kyc_profiles` (status: 'approved', approved_at)
   - Update `eligibility_states` (status: 'kyc_approved', can_withdraw: true, can_receive_dividends: true)
   - If wallet_verified, set status: 'investment_eligible', can_invest: true
   - Create audit log (event_type: 'kyc_approved')
   - Send email notification
4. If reviewAnswer === 'RED':
   - Update `kyc_profiles` (status: 'rejected', rejection_reason, rejected_at)
   - Update `eligibility_states` (status: 'kyc_rejected')
   - Create audit log (event_type: 'kyc_rejected')
   - Send email notification

---

## Data Models

### User Profile
```typescript
interface Profile {
  id: string;                    // UUID
  email: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  country: string | null;
  timezone: string | null;
  avatar_url: string | null;
  kyc_verified: boolean;         // Denormalized from kyc_profiles
  kyc_submitted_at: string | null;
  created_at: string;
  updated_at: string;
}
```

### User Role
```typescript
interface UserRole {
  id: string;
  user_id: string;               // FK to profiles
  role: 'user' | 'admin' | 'compliance_officer' | 'super_admin';
  granted_by: string | null;     // FK to profiles
  granted_at: string;
  revoked_at: string | null;
  created_at: string;
  updated_at: string;
}
```

### Investment
```typescript
interface Investment {
  id: string;
  user_id: string;               // FK to profiles
  project_id: string;            // FK to projects
  amount: number;                // USD amount
  tokens_purchased: number;
  token_price_at_purchase: number;
  status: 'pending' | 'completed' | 'cancelled' | 'refunded';
  transaction_hash: string | null;
  invested_at: string;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}
```

### Audit Log
```typescript
interface AuditLog {
  id: string;
  event_type: string;            // e.g., 'investment_created', 'kyc_approved'
  user_id: string | null;        // FK to profiles
  actor_id: string | null;       // FK to profiles (who performed the action)
  actor_role: string | null;     // 'user', 'admin', 'compliance_officer'
  description: string;
  metadata: Record<string, any>; // JSON
  previous_state: Record<string, any> | null;
  new_state: Record<string, any> | null;
  ip_address: string | null;
  user_agent: string | null;
  request_id: string | null;
  timestamp: string;
}
```

---

## Error Handling

### Standard Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `INVALID_CREDENTIALS` | 401 | Email or password incorrect |
| `UNAUTHORIZED` | 401 | No valid token provided |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `EMAIL_ALREADY_EXISTS` | 400 | Email already registered |
| `VALIDATION_ERROR` | 400 | Input validation failed |
| `INSUFFICIENT_FUNDS` | 400 | Wallet balance too low |
| `INSUFFICIENT_TOKENS` | 400 | Not enough tokens available |
| `NOT_ELIGIBLE` | 403 | User not eligible (KYC not approved) |
| `PROJECT_NOT_FUNDING` | 400 | Project not in funding status |
| `BELOW_MINIMUM_INVESTMENT` | 400 | Amount < min_investment |
| `WALLET_ALREADY_LINKED` | 400 | Wallet linked to another account |
| `INVALID_SIGNATURE` | 400 | Signature verification failed |
| `BLOCKCHAIN_ERROR` | 500 | Smart contract interaction failed |
| `INTERNAL_SERVER_ERROR` | 500 | Unexpected error |

### Error Response Format

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {
      "field": "specific_field_name",
      "constraint": "validation_rule_violated"
    }
  }
}
```

---

## Security Requirements

### JWT Token Structure

```json
{
  "user_id": "uuid",
  "email": "user@example.com",
  "roles": ["user", "admin"],
  "iat": 1234567890,
  "exp": 1234654290
}
```

**Token Expiration:**
- JWT: 24 hours
- Refresh Token: 30 days

**Secret Keys:**
- Use environment variables
- Rotate secrets periodically
- Use different secrets for dev/staging/prod

### Password Security

- Hash with bcrypt (12 rounds minimum)
- Enforce password complexity
- Implement rate limiting on login (5 attempts per 15 minutes)
- Log failed login attempts

### API Security

- Enable CORS for frontend domain only
- Rate limiting: 100 requests per minute per IP
- Request size limit: 10MB
- Validate all input data
- Sanitize SQL queries (use parameterized queries)
- Log all admin actions

### Sensitive Data

- Encrypt PII data at rest
- Use HTTPS for all communications
- Never log passwords or tokens
- Mask sensitive data in responses

---

## Testing

### Test User Accounts

Create these test accounts for frontend testing:

```json
[
  {
    "email": "investor@test.com",
    "password": "Test123!",
    "role": "user",
    "kyc_verified": true,
    "wallet_verified": true
  },
  {
    "email": "admin@test.com",
    "password": "Admin123!",
    "role": "admin",
    "kyc_verified": true
  },
  {
    "email": "compliance@test.com",
    "password": "Compliance123!",
    "role": "compliance_officer"
  }
]
```

### Test Projects

Create sample projects with various statuses:
- 1 in "funding" status (partially funded)
- 1 in "funded" status (fully funded)
- 1 in "active" status (producing returns)
- 1 in "completed" status

### Integration Testing

1. Test authentication flow (signup → login → refresh)
2. Test KYC submission and webhook handling
3. Test investment creation and completion
4. Test wallet connection and verification
5. Test admin project CRUD operations
6. Test eligibility state transitions

### API Documentation

Generate API documentation using:
- Swagger/OpenAPI
- Postman collection
- Include all request/response examples

---

## Contact & Support

**Questions?** Open an issue on GitHub or contact the frontend team.

**Frontend Repository:** https://github.com/rsturua/goldenfleece
**Backend RFP:** See `uploads/DevelopmentProposal1.pdf`
