/**
 * Investments service - handles investment creation and management
 */

import { createClient } from '@/lib/supabase/server';
import type { Investment, CreateInvestmentInput, PortfolioPosition } from './models';
import { ComplianceService } from '../compliance/service';
import { ProjectsService } from '../projects/service';
import { createAuditLog } from '../admin/service';

export class InvestmentsService {
  /**
   * Create a new investment
   */
  static async createInvestment(input: CreateInvestmentInput): Promise<Investment> {
    // Check eligibility
    const isEligible = await ComplianceService.isEligibleToInvest(input.userId);
    if (!isEligible) {
      throw new Error('User is not eligible to invest. Please complete KYC verification and wallet verification.');
    }

    // Check if project is accepting investments
    const isAccepting = await ProjectsService.isAcceptingInvestments(input.projectId);
    if (!isAccepting) {
      throw new Error('This project is not currently accepting investments.');
    }

    // Get offering
    const offering = await ProjectsService.getOfferingForProject(input.projectId);
    if (!offering) {
      throw new Error('No active offering found for this project.');
    }

    // Check token availability
    if (offering.availableTokens < input.tokensPurchased) {
      throw new Error('Not enough tokens available for this investment amount.');
    }

    const supabase = await createClient();

    // Create investment
    const { data, error } = await supabase
      .from('investments')
      .insert({
        user_id: input.userId,
        project_id: input.projectId,
        offering_id: input.offeringId,
        amount: input.amount,
        tokens_purchased: input.tokensPurchased,
        token_price_at_purchase: input.amount / input.tokensPurchased,
        status: 'pending',
        invested_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    // Audit log
    await createAuditLog({
      eventType: 'investment_created',
      userId: input.userId,
      actorRole: 'user',
      description: `Investment of ${input.amount} for ${input.tokensPurchased} tokens created`,
      metadata: { projectId: input.projectId, amount: input.amount, tokens: input.tokensPurchased },
    });

    return data as Investment;
  }

  /**
   * Complete investment (after payment confirmation)
   */
  static async completeInvestment(investmentId: string): Promise<Investment> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('investments')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
      })
      .eq('id', investmentId)
      .select()
      .single();

    if (error) throw error;

    const investment = data as Investment;

    // Audit log
    await createAuditLog({
      eventType: 'investment_completed',
      userId: investment.userId,
      actorRole: 'admin',
      description: `Investment ${investmentId} completed`,
      metadata: { investmentId, amount: investment.amount },
    });

    return investment;
  }

  /**
   * Get user's investments
   */
  static async getUserInvestments(userId: string): Promise<Investment[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('investments')
      .select('*')
      .eq('user_id', userId)
      .order('invested_at', { ascending: false });

    if (error) throw error;

    return (data || []) as Investment[];
  }

  /**
   * Get investments for a project
   */
  static async getProjectInvestments(projectId: string): Promise<Investment[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('investments')
      .select('*')
      .eq('project_id', projectId)
      .eq('status', 'completed')
      .order('invested_at', { ascending: false });

    if (error) throw error;

    return (data || []) as Investment[];
  }
}
