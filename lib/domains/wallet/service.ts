/**
 * Wallet service - handles wallet connection and verification
 */

import { createClient } from '@/lib/supabase/server';
import type { WalletLink, CreateWalletLinkInput, VerifyWalletInput } from './models';
import { createAuditLog } from '../admin/service';
import { updateEligibilityOnWalletChange } from '../compliance/service';
import { verifyMessage } from 'viem';

export class WalletService {
  /**
   * Connect a wallet to a user account (step 1 - connection only, not verified)
   */
  static async connectWallet(input: CreateWalletLinkInput): Promise<WalletLink> {
    const supabase = await createClient();

    // Check if wallet is already linked to another user
    const { data: existing } = await supabase
      .from('wallet_links')
      .select('*')
      .eq('wallet_address', input.walletAddress.toLowerCase())
      .eq('is_active', true)
      .single();

    if (existing && existing.user_id !== input.userId) {
      throw new Error('This wallet is already linked to another account');
    }

    // Deactivate any existing wallets for this user
    await supabase
      .from('wallet_links')
      .update({ is_active: false, disconnected_at: new Date().toISOString() })
      .eq('user_id', input.userId)
      .eq('is_active', true);

    // Create new wallet link
    const { data, error } = await supabase
      .from('wallet_links')
      .insert({
        user_id: input.userId,
        wallet_address: input.walletAddress.toLowerCase(),
        chain_id: input.chainId,
        wallet_type: input.walletType,
        connected_at: new Date().toISOString(),
        verified: false,
      })
      .select()
      .single();

    if (error) throw error;

    // Update eligibility state
    await updateEligibilityOnWalletChange(input.userId, 'wallet_connected');

    // Create audit log
    await createAuditLog({
      eventType: 'wallet_linked',
      userId: input.userId,
      actorRole: 'user',
      description: `Wallet ${input.walletAddress} connected`,
      metadata: { walletAddress: input.walletAddress, chainId: input.chainId },
    });

    return data as WalletLink;
  }

  /**
   * Verify wallet ownership with signature (step 2 - verification)
   */
  static async verifyWallet(input: VerifyWalletInput): Promise<WalletLink> {
    const supabase = await createClient();

    // Get wallet link
    const { data: walletLink, error: fetchError } = await supabase
      .from('wallet_links')
      .select('*')
      .eq('id', input.walletLinkId)
      .single();

    if (fetchError || !walletLink) {
      throw new Error('Wallet link not found');
    }

    // Verify signature
    // TODO: Implement proper signature verification with viem
    // For now, we trust the client-side verification
    // In production, reconstruct the message server-side and verify

    const isValid = await verifyMessage({
      address: walletLink.wallet_address as `0x${string}`,
      message: input.message,
      signature: input.signature as `0x${string}`,
    });

    if (!isValid) {
      throw new Error('Invalid signature');
    }

    // Update wallet link as verified
    const { data, error } = await supabase
      .from('wallet_links')
      .update({
        verified: true,
        verified_at: new Date().toISOString(),
        verification_nonce: input.nonce,
        verification_signature: input.signature,
      })
      .eq('id', input.walletLinkId)
      .select()
      .single();

    if (error) throw error;

    // Update eligibility state
    await updateEligibilityOnWalletChange(walletLink.user_id, 'wallet_verified');

    // Create audit log
    await createAuditLog({
      eventType: 'wallet_verified',
      userId: walletLink.user_id,
      actorRole: 'user',
      description: `Wallet ${walletLink.wallet_address} verified`,
      metadata: { walletAddress: walletLink.wallet_address },
    });

    return data as WalletLink;
  }

  /**
   * Get active wallet for a user
   */
  static async getActiveWallet(userId: string): Promise<WalletLink | null> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('wallet_links')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .single();

    if (error || !data) return null;

    return data as WalletLink;
  }

  /**
   * Check if user has a verified wallet
   */
  static async hasVerifiedWallet(userId: string): Promise<boolean> {
    const wallet = await this.getActiveWallet(userId);
    return wallet?.verified === true;
  }

  /**
   * Disconnect wallet
   */
  static async disconnectWallet(userId: string): Promise<void> {
    const supabase = await createClient();

    await supabase
      .from('wallet_links')
      .update({ is_active: false, disconnected_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('is_active', true);

    // Update eligibility state
    await updateEligibilityOnWalletChange(userId, 'registered');

    // Create audit log
    await createAuditLog({
      eventType: 'wallet_unlinked',
      userId,
      actorRole: 'user',
      description: 'Wallet disconnected',
    });
  }
}
