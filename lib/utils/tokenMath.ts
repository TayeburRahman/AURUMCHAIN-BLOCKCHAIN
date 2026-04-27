import { BN } from "@coral-xyz/anchor";

/**
 * TokenMath Utility
 * 
 * Standardizes all financial calculations across the platform to prevent 
 * decimal mismatches and "factor of 100" errors.
 */
export class TokenMath {
  public static readonly USDC_DECIMALS = 6;

  /**
   * Scales a human-readable USDC amount to raw on-chain units (6 decimals).
   */
  static toRawUsdc(amount: number): BN {
    return new BN(Math.round(amount * Math.pow(10, this.USDC_DECIMALS)));
  }

  /**
   * Scales a human-readable token amount to raw on-chain units based on decimals.
   */
  static toRawTokens(amount: number, decimals: number): BN {
    return new BN(Math.round(amount * Math.pow(10, decimals)));
  }

  /**
   * Humanizes a raw on-chain amount back to a number.
   */
  static fromRaw(raw: BN | number | string, decimals: number): number {
    const numericRaw = typeof raw === 'object' ? (raw as any).toNumber() : Number(raw);
    return numericRaw / Math.pow(10, decimals);
  }

  /**
   * Safely calculates price: Price = Total Cost / Total Tokens
   */
  static calculatePrice(totalCostUsdc: number, tokenAmount: number): number {
    if (tokenAmount === 0) return 0;
    return totalCostUsdc / tokenAmount;
  }
}
