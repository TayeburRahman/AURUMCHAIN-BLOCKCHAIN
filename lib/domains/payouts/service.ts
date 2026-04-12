/**
 * Payouts service - handles dividend distribution and claiming
 */

import { createClient } from '@/lib/supabase/server';
import type { PayoutCycle, PayoutRecord, ClaimableBalance } from './models';
import { createAuditLog } from '../admin/service';

export class PayoutsService {
  /**
   * Get user's payout records
   */
  static async getUserPayouts(userId: string): Promise<PayoutRecord[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('payout_records')
      .select(`
        *,
        cycle:cycle_id (
          name,
          period_start,
          period_end
        ),
        project:project_id (
          name,
          slug
        )
      `)
      .eq('user_id', userId)
      .order('calculated_at', { ascending: false });

    if (error) throw error;

    return (data || []) as PayoutRecord[];
  }

  /**
   * Get unclaimed payouts for user
   */
  static async getUnclaimedPayouts(userId: string): Promise<PayoutRecord[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('payout_records')
      .select('*')
      .eq('user_id', userId)
      .eq('is_claimed', false)
      .eq('status', 'completed')
      .order('calculated_at', { ascending: false });

    if (error) throw error;

    return (data || []) as PayoutRecord[];
  }

  /**
   * Get claimable balance for user
   */
  static async getClaimableBalance(userId: string, projectId?: string): Promise<ClaimableBalance> {
    const supabase = await createClient();

    let query = supabase
      .from('payout_records')
      .select('amount_due, calculated_at')
      .eq('user_id', userId)
      .eq('is_claimed', false)
      .eq('status', 'completed');

    if (projectId) {
      query = query.eq('project_id', projectId);
    }

    const { data, error } = await query;

    if (error) throw error;

    const records = (data || []) as Array<{ amount_due: number; calculated_at: string }>;
    const totalClaimable = records.reduce((sum, r) => sum + Number(r.amount_due), 0);
    const oldest = records.length > 0
      ? new Date(Math.min(...records.map(r => new Date(r.calculated_at).getTime())))
      : undefined;

    return {
      userId,
      projectId,
      totalClaimable,
      recordCount: records.length,
      oldestPayoutDate: oldest,
    };
  }

  /**
   * Claim payout (mark as claimed and initiate transfer)
   */
  static async claimPayout(payoutRecordId: string, userId: string): Promise<PayoutRecord> {
    const supabase = await createClient();

    // Get payout record
    const { data: record } = await supabase
      .from('payout_records')
      .select('*')
      .eq('id', payoutRecordId)
      .eq('user_id', userId)
      .single();

    if (!record) {
      throw new Error('Payout record not found');
    }

    if (record.is_claimed) {
      throw new Error('Payout has already been claimed');
    }

    if (record.status !== 'completed') {
      throw new Error('Payout is not ready to be claimed');
    }

    // Mark as claimed
    const { data, error } = await supabase
      .from('payout_records')
      .update({
        is_claimed: true,
        claimed_at: new Date().toISOString(),
      })
      .eq('id', payoutRecordId)
      .select()
      .single();

    if (error) throw error;

    // TODO: Initiate actual transfer (wallet payment, bank transfer, etc.)
    // This would integrate with payment rails or blockchain transfer

    // Audit log
    await createAuditLog({
      eventType: 'payout_completed',
      userId,
      actorRole: 'user',
      description: `Payout of ${record.amount_due} claimed`,
      metadata: { payoutRecordId, amount: record.amount_due, projectId: record.project_id },
    });

    return data as PayoutRecord;
  }

  /**
   * Get payout cycles for a project
   */
  static async getProjectPayoutCycles(projectId: string): Promise<PayoutCycle[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('payout_cycles')
      .select('*')
      .eq('project_id', projectId)
      .order('scheduled_date', { ascending: false });

    if (error) throw error;

    return (data || []) as PayoutCycle[];
  }

  /**
   * Calculate total payouts for a project (admin function)
   * TODO: This is a placeholder - real calculation would be more complex
   */
  static async calculatePayoutCycle(cycleId: string): Promise<void> {
    const supabase = await createClient();

    // Get cycle
    const { data: cycle } = await supabase
      .from('payout_cycles')
      .select('*')
      .eq('id', cycleId)
      .single();

    if (!cycle) throw new Error('Cycle not found');

    // Get all portfolio positions for this project
    const { data: positions } = await supabase
      .from('portfolio_positions')
      .select('*')
      .eq('project_id', cycle.project_id)
      .eq('is_active', true);

    if (!positions || positions.length === 0) return;

    // Create payout records for each position holder
    const records = positions.map(position => ({
      user_id: position.user_id,
      project_id: cycle.project_id,
      cycle_id: cycleId,
      tokens_held: position.total_tokens,
      amount_due: Number(position.total_tokens) * cycle.amount_per_token,
      status: 'scheduled',
      calculated_at: new Date().toISOString(),
    }));

    await supabase.from('payout_records').insert(records);

    // Update cycle status
    await supabase
      .from('payout_cycles')
      .update({
        status: 'processing',
        calculated_at: new Date().toISOString(),
      })
      .eq('id', cycleId);
  }
}
