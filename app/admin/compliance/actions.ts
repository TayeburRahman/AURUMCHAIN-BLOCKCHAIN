'use server';

import { z } from 'zod';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { AdminService, createAuditLog } from '@/lib/domains/admin/service';
import { 
  RecordVerifiedWalletSchema, 
  RevokeWalletSchema 
} from '@/lib/web3/schemas/compliance';

/**
 * Server Action: syncKycApproval
 * 
 * Synchronizes a successful blockchain KYC verification with Supabase.
 * Enforces strict RBAC and creates an immutable audit log.
 */
export async function syncKycApprovalAction(input: any) {
  try {
    const supabase = await createClient();
    const adminSupabase = createAdminClient();
    const { data: { user: adminUser } } = await supabase.auth.getUser();

    // 1. RBAC Check (Server-Side)
    if (!adminUser || !(await AdminService.isAdmin(adminUser.id))) {
      return { success: false, error: "UNAUTHORIZED: Admin privileges required" };
    }

    // 2. Strict Input Validation (With added signature requirement)
    const schema = RecordVerifiedWalletSchema.extend({
      signature: z.string().min(32),
    });
    const validated = schema.parse(input);

    // 3. Database Synchronization
    // Resolve user ID from wallet
    const { data: walletData } = await adminSupabase
      .from('wallets')
      .select('user_id')
      .eq('wallet_address', validated.wallet)
      .single();
    
    if (!walletData) throw new Error(`User not found for wallet: ${validated.wallet}`);
    const userId = walletData.user_id;

    // Update kyc_profiles
    const { error: kycError } = await adminSupabase
      .from('kyc_profiles')
      .update({
        status: mapKycStatusToString(validated.kycStatus),
        approved_at: new Date().toISOString(),
        expires_at: new Date(validated.expiryTimestamp * 1000).toISOString(),
        metadata: { 
          blockchain_signature: validated.signature,
          last_synced_at: new Date().toISOString()
        }
      })
      .eq('user_id', userId);

    if (kycError) throw kycError;

    // Update global profile
    await adminSupabase
      .from('profiles')
      .update({ kyc_verified: validated.kycStatus === 1 })
      .eq('id', userId);

    // 4. Audit Logging
    await createAuditLog({
      eventType: 'kyc_approved',
      userId,
      actorId: adminUser.id,
      actorRole: 'admin',
      description: `Wallet ${validated.wallet} verified on-chain. Signature: ${validated.signature}`,
      metadata: { ...validated }
    });

    return { success: true, data: { status: 'synced' } };

  } catch (error: any) {
    console.error("[Server Action] syncKycApproval failed:", error);
    return { 
      success: false, 
      error: error.name === 'ZodError' ? "Validation failed" : "Internal Server Error" 
    };
  }
}

/**
 * Server Action: syncKycRevoke
 */
export async function syncKycRevokeAction(input: any) {
  try {
    const supabase = await createClient();
    const adminSupabase = createAdminClient();
    const { data: { user: adminUser } } = await supabase.auth.getUser();

    if (!adminUser || !(await AdminService.isAdmin(adminUser.id))) {
      return { success: false, error: "UNAUTHORIZED: Admin privileges required" };
    }

    const schema = RevokeWalletSchema.extend({
      signature: z.string().min(32),
    });
    const validated = schema.parse(input);

    const { data: walletData } = await adminSupabase
      .from('wallets')
      .select('user_id')
      .eq('wallet_address', validated.wallet)
      .single();
    
    if (!walletData) throw new Error("User not found");
    const userId = walletData.user_id;

    await adminSupabase
      .from('kyc_profiles')
      .update({ status: 'rejected', rejected_at: new Date().toISOString() })
      .eq('user_id', userId);

    await adminSupabase
      .from('profiles')
      .update({ kyc_verified: false })
      .eq('id', userId);

    await createAuditLog({
      eventType: 'kyc_rejected',
      userId,
      actorId: adminUser.id,
      actorRole: 'admin',
      description: `Wallet ${validated.wallet} eligibility revoked on-chain. Signature: ${validated.signature}`,
      metadata: { ...validated }
    });

    return { success: true, data: { status: 'revoked-synced' } };

  } catch (error: any) {
    console.error("[Server Action] syncKycRevoke failed:", error);
    return { success: false, error: "Internal Server Error" };
  }
}

function mapKycStatusToString(status: number): string {
  const map: Record<number, string> = {
    0: 'pending',
    1: 'approved',
    2: 'rejected',
    3: 'expired'
  };
  return map[status] || 'unknown';
}
