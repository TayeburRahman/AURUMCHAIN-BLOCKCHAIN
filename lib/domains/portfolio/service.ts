/**
 * Portfolio service - handles user portfolio and positions
 */

import { createClient } from '@/lib/supabase/server';
import type { PortfolioPosition } from '../investments/models';

export class PortfolioService {
  /**
   * Get user's portfolio positions
   */
  static async getUserPortfolio(userId: string): Promise<PortfolioPosition[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('portfolio_positions')
      .select(`
        *,
        projects:project_id (
          id,
          name,
          slug,
          location,
          country,
          status,
          images
        )
      `)
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []) as PortfolioPosition[];
  }

  /**
   * Get portfolio summary for user
   */
  static async getPortfolioSummary(userId: string): Promise<{
    totalInvested: number;
    totalValue: number;
    totalReturn: number;
    returnPercentage: number;
    activePositions: number;
  }> {
    const positions = await this.getUserPortfolio(userId);

    const totalInvested = positions.reduce((sum, p) => sum + Number(p.totalInvested), 0);
    const totalDividends = positions.reduce((sum, p) => sum + Number(p.totalDividendsReceived), 0);
    const totalReturn = totalDividends; // TODO: Add unrealized gains when we have market prices
    const returnPercentage = totalInvested > 0 ? (totalReturn / totalInvested) * 100 : 0;

    return {
      totalInvested,
      totalValue: totalInvested + totalReturn,
      totalReturn,
      returnPercentage,
      activePositions: positions.length,
    };
  }

  /**
   * Get position for a specific project
   */
  static async getPosition(userId: string, projectId: string): Promise<PortfolioPosition | null> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('portfolio_positions')
      .select('*')
      .eq('user_id', userId)
      .eq('project_id', projectId)
      .single();

    if (error || !data) return null;

    return data as PortfolioPosition;
  }
}
