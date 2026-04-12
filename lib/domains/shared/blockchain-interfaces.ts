/**
 * Blockchain module boundaries and interfaces
 *
 * This file defines the abstraction layer for blockchain operations.
 * Implementation will be plugged in later with actual smart contracts.
 *
 * Architecture Decision: EVM-compatible (Ethereum/Polygon/Base)
 * - Using ERC20 standard for now (can upgrade to ERC1400 for securities)
 * - Supports multiple chains through chainId parameter
 *
 * TODO: Implement actual smart contract integration when contracts are deployed
 */

import type { Address, Hash } from 'viem';

// ============================================
// TOKEN STANDARDS
// ============================================

export type TokenStandard = 'ERC20' | 'ERC1400' | 'custom';

// ============================================
// OFFERING TOKENIZATION
// ============================================

export interface TokenizationInput {
  offeringId: string;
  projectId: string;
  tokenSymbol: string;
  tokenName: string;
  totalSupply: bigint;
  chainId: number;
  metadata?: Record<string, unknown>;
}

export interface TokenizationResult {
  contractAddress: Address;
  deploymentTxHash: Hash;
  blockNumber: bigint;
  tokenSymbol: string;
  tokenName: string;
  totalSupply: bigint;
  chainId: number;
}

export interface ITokenizationService {
  /**
   * Deploy a new token contract for an offering
   */
  deployToken(input: TokenizationInput): Promise<TokenizationResult>;

  /**
   * Mint tokens to an investor after investment
   */
  mintTokens(
    contractAddress: Address,
    toAddress: Address,
    amount: bigint,
    chainId: number
  ): Promise<Hash>;

  /**
   * Get token balance for an address
   */
  getBalance(
    contractAddress: Address,
    holderAddress: Address,
    chainId: number
  ): Promise<bigint>;

  /**
   * Get total supply of a token
   */
  getTotalSupply(contractAddress: Address, chainId: number): Promise<bigint>;
}

// ============================================
// DIVIDEND DISTRIBUTION
// ============================================

export interface DividendDistributionInput {
  cycleId: string;
  projectId: string;
  contractAddress: Address;
  totalAmount: bigint; // in wei or smallest unit
  recipients: Array<{
    address: Address;
    amount: bigint;
  }>;
  chainId: number;
}

export interface DividendDistributionResult {
  txHash: Hash;
  blockNumber: bigint;
  gasUsed: bigint;
  recipientCount: number;
  totalDistributed: bigint;
}

export interface IDividendService {
  /**
   * Distribute dividends to token holders
   * Can be batch or individual transfers
   */
  distributeDividends(input: DividendDistributionInput): Promise<DividendDistributionResult>;

  /**
   * Calculate dividend entitlements based on token holdings
   */
  calculateEntitlements(
    contractAddress: Address,
    totalDividendAmount: bigint,
    chainId: number
  ): Promise<Array<{ address: Address; amount: bigint }>>;

  /**
   * Check if dividend has been claimed (for claim-based model)
   */
  hasClaimed(
    contractAddress: Address,
    holderAddress: Address,
    cycleId: string,
    chainId: number
  ): Promise<boolean>;
}

// ============================================
// ALLOCATION TRACKING
// ============================================

export interface AllocationRecord {
  offeringId: string;
  investorAddress: Address;
  tokensAllocated: bigint;
  tokensMinted: boolean;
  allocationTxHash?: Hash;
  mintTxHash?: Hash;
  timestamp: Date;
}

export interface IAllocationService {
  /**
   * Record an allocation (off-chain or pre-mint)
   */
  recordAllocation(
    offeringId: string,
    investorAddress: Address,
    amount: bigint
  ): Promise<AllocationRecord>;

  /**
   * Mint allocated tokens (convert allocation to on-chain tokens)
   */
  mintAllocation(allocationId: string, chainId: number): Promise<Hash>;

  /**
   * Get all allocations for an offering
   */
  getAllocations(offeringId: string): Promise<AllocationRecord[]>;
}

// ============================================
// BLOCKCHAIN EVENT SYNC
// ============================================

export interface BlockchainEvent {
  eventType: 'Transfer' | 'Mint' | 'Burn' | 'DividendDistributed' | 'DividendClaimed';
  contractAddress: Address;
  txHash: Hash;
  blockNumber: bigint;
  timestamp: Date;
  from?: Address;
  to?: Address;
  amount?: bigint;
  metadata?: Record<string, unknown>;
}

export interface IEventSyncService {
  /**
   * Sync events from blockchain to database
   */
  syncEvents(
    contractAddress: Address,
    fromBlock: bigint,
    toBlock: bigint,
    chainId: number
  ): Promise<BlockchainEvent[]>;

  /**
   * Process an event and update database state
   */
  processEvent(event: BlockchainEvent): Promise<void>;

  /**
   * Get last synced block for a contract
   */
  getLastSyncedBlock(contractAddress: Address, chainId: number): Promise<bigint>;
}

// ============================================
// TREASURY MANAGEMENT
// ============================================

export interface TreasuryBalance {
  address: Address;
  chainId: number;
  nativeBalance: bigint; // ETH, MATIC, etc.
  tokenBalances: Array<{
    contractAddress: Address;
    symbol: string;
    balance: bigint;
  }>;
}

export interface ITreasuryService {
  /**
   * Get treasury balances
   */
  getBalances(treasuryAddress: Address, chainId: number): Promise<TreasuryBalance>;

  /**
   * Transfer funds from treasury
   */
  transferFromTreasury(
    from: Address,
    to: Address,
    amount: bigint,
    chainId: number
  ): Promise<Hash>;

  /**
   * Approve token spending from treasury
   */
  approveSpending(
    tokenAddress: Address,
    spender: Address,
    amount: bigint,
    chainId: number
  ): Promise<Hash>;
}

// ============================================
// FACTORY & PLACEHOLDER IMPLEMENTATIONS
// ============================================

/**
 * Placeholder tokenization service
 * TODO: Replace with actual implementation when contracts are deployed
 */
export class PlaceholderTokenizationService implements ITokenizationService {
  async deployToken(input: TokenizationInput): Promise<TokenizationResult> {
    // TODO: Implement actual contract deployment
    throw new Error('Tokenization service not yet implemented. Deploy smart contracts first.');
  }

  async mintTokens(): Promise<Hash> {
    throw new Error('Tokenization service not yet implemented.');
  }

  async getBalance(): Promise<bigint> {
    // For now, return 0
    return BigInt(0);
  }

  async getTotalSupply(): Promise<bigint> {
    return BigInt(0);
  }
}

/**
 * Placeholder dividend service
 */
export class PlaceholderDividendService implements IDividendService {
  async distributeDividends(): Promise<DividendDistributionResult> {
    throw new Error('Dividend distribution service not yet implemented.');
  }

  async calculateEntitlements(): Promise<Array<{ address: Address; amount: bigint }>> {
    return [];
  }

  async hasClaimed(): Promise<boolean> {
    return false;
  }
}

// ============================================
// SERVICE FACTORY
// ============================================

export interface BlockchainServices {
  tokenization: ITokenizationService;
  dividends: IDividendService;
  allocations?: IAllocationService;
  eventSync?: IEventSyncService;
  treasury?: ITreasuryService;
}

/**
 * Factory to get blockchain services
 * Returns placeholder implementations until real contracts are deployed
 */
export function getBlockchainServices(): BlockchainServices {
  return {
    tokenization: new PlaceholderTokenizationService(),
    dividends: new PlaceholderDividendService(),
    // TODO: Add real implementations when contracts are ready
  };
}

// ============================================
// CONFIGURATION
// ============================================

export interface BlockchainConfig {
  supportedChainIds: number[];
  defaultChainId: number;
  rpcEndpoints: Record<number, string>;
  explorerUrls: Record<number, string>;
  contractAddresses?: {
    tokenFactory?: Address;
    dividendDistributor?: Address;
    treasury?: Address;
  };
}

/**
 * Get blockchain configuration
 */
export function getBlockchainConfig(): BlockchainConfig {
  return {
    supportedChainIds: [1, 137, 8453], // Ethereum, Polygon, Base
    defaultChainId: Number(process.env.NEXT_PUBLIC_CHAIN_ID) || 1,
    rpcEndpoints: {
      1: process.env.ETHEREUM_RPC_URL || '',
      137: process.env.POLYGON_RPC_URL || '',
      8453: process.env.BASE_RPC_URL || '',
    },
    explorerUrls: {
      1: 'https://etherscan.io',
      137: 'https://polygonscan.com',
      8453: 'https://basescan.org',
    },
  };
}
