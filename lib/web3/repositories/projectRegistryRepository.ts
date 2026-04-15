import { Program } from '@coral-xyz/anchor';
import { PublicKey, TransactionInstruction } from '@solana/web3.js';

/**
 * ProjectRegistryRepository
 * 
 * Handles raw data access and instruction construction for the Project Registry program.
 * Separation of concerns: This repository does not handle transaction signing or RPC execution.
 */
export class ProjectRegistryRepository {
  private program: Program;

  constructor(program: Program) {
    this.program = program;
  }

  /**
   * Derives the PDA for the global registry config account.
   * PDA seeds: [b"registry"]
   * 
   * @returns {PublicKey} The deterministic PDA of the registry configuration.
   */
  getRegistryPDA(): PublicKey {
    const [pda] = PublicKey.findProgramAddressSync(
      [Buffer.from('registry')],
      this.program.programId
    );
    return pda;
  }

  /**
   * Constructs the transferAuthority instruction.
   * 
   * @param superAdmin - Current super admin public key (must sign).
   * @param authority - Current operational authority public key (must sign).
   * @param newSuperAdmin - Optional new super admin public key to set.
   * @param newAuthority - Optional new operational authority public key to set.
   * @returns {Promise<TransactionInstruction>} The constructed program instruction.
   */
  async getTransferAuthorityInstruction(
    superAdmin: PublicKey,
    authority: PublicKey,
    newSuperAdmin: PublicKey | null,
    newAuthority: PublicKey | null
  ): Promise<TransactionInstruction> {
    return await this.program.methods
      .transferAuthority(newSuperAdmin, newAuthority)
      .accounts({
        registry: this.getRegistryPDA(),
        superAdmin,
        authority,
      } as any)
      .instruction();
  }

  /**
   * Fetches and deserializes the RegistryConfig account state from the blockchain.
   * 
   * @returns {Promise<any>} The deserialized account content.
   */
  async fetchRegistryConfig(): Promise<any> {
    return await this.program.account.registryConfig.fetch(this.getRegistryPDA());
  }
}
