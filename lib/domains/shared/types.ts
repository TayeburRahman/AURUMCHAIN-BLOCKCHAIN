/**
 * Shared types and enums used across domains
 */

// User eligibility states - proper state machine for investment access
export type EligibilityStatus =
  | 'registered'           // User created account
  | 'wallet_connected'     // Wallet connected to app
  | 'wallet_verified'      // Wallet ownership verified by signature
  | 'kyc_pending'          // KYC documents submitted
  | 'kyc_under_review'     // Being reviewed by compliance team
  | 'kyc_approved'         // KYC approved
  | 'kyc_rejected'         // KYC rejected
  | 'investment_eligible'  // Fully eligible to invest
  | 'restricted'           // Temporarily or permanently restricted
  | 'suspended';           // Account suspended

// Investor tier - UI/segmentation only, NOT access control
export type InvestorTier = 'browser' | 'investor' | 'vip';

// Compliance/KYC statuses
export type KycStatus = 'not_started' | 'pending' | 'under_review' | 'approved' | 'rejected' | 'expired';
export type KycProvider = 'sumsub' | 'manual' | 'other';

// Project statuses
export type ProjectStatus = 'draft' | 'funding' | 'funded' | 'active' | 'completed' | 'cancelled';

// Investment statuses
export type InvestmentStatus = 'pending' | 'completed' | 'cancelled' | 'refunded';

// Transaction types and statuses
export type TransactionType = 'deposit' | 'withdrawal' | 'investment' | 'dividend' | 'refund';
export type TransactionStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
export type PaymentMethod = 'credit_card' | 'bank_transfer' | 'cryptocurrency' | 'wallet_balance';

// Payout statuses
export type PayoutStatus = 'scheduled' | 'processing' | 'completed' | 'failed' | 'cancelled';

// Audit event types
export type AuditEventType =
  | 'wallet_linked'
  | 'wallet_unlinked'
  | 'wallet_verified'
  | 'kyc_submitted'
  | 'kyc_approved'
  | 'kyc_rejected'
  | 'eligibility_changed'
  | 'investment_created'
  | 'investment_completed'
  | 'payout_created'
  | 'payout_completed'
  | 'admin_action'
  | 'account_suspended'
  | 'account_restricted';

// User role for RBAC
export type UserRole = 'user' | 'admin' | 'compliance_officer' | 'super_admin';
