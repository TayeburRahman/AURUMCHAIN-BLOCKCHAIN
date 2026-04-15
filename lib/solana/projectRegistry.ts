import { Program, AnchorProvider, setProvider, BN } from '@coral-xyz/anchor';
import { Connection, PublicKey, SystemProgram, Keypair, Transaction } from '@solana/web3.js';
import idl from '../../programs/project_registry/src/idl.json';
import { 
  createInitializeMintInstruction, 
  MINT_SIZE, 
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddressSync,
  createAssociatedTokenAccountInstruction
} from '@solana/spl-token';
import { 
  createCreateMetadataAccountV3Instruction,
  PROGRAM_ID as METADATA_PROGRAM_ID
} from '@metaplex-foundation/mpl-token-metadata';

// Define the program ID dynamically (or default to the one in lib.rs)
export const PROJECT_REGISTRY_PROGRAM_ID = new PublicKey(
  process.env.NEXT_PUBLIC_PROJECT_REGISTRY_PROGRAM_ID || 'GcXxLjcCm7ov3i6QqQsL8zgjqiknWBswXn6jcwpEMYdC'
);

export interface CreateProjectParams {
  name: string;
  symbol: string;
  uri: string;
  supplyCap: BN;
  minInvestmentUsdc: BN;
  maxInvestmentUsdc: BN;
  acceptedStablecoin: PublicKey;
  treasuryWallet: PublicKey;
  lockupEndTs: BN;
  subscriptionStart: BN;
  subscriptionEnd: BN;
  distributionCadence: number;
}

export const getRegistryProgram = (connection: Connection, wallet: any) => {
  const provider = new AnchorProvider(
    connection,
    wallet,
    AnchorProvider.defaultOptions()
  );
  setProvider(provider);
  
  // Clean initialization natively supported by matching versions!
  return new Program(idl as any, PROJECT_REGISTRY_PROGRAM_ID, provider);
};

export const getRegistryPDA = () => {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('registry')],
    PROJECT_REGISTRY_PROGRAM_ID
  )[0];
};

export const getProjectPDA = (projectCount: BN) => {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('project'), projectCount.toArrayLike(Buffer, 'le', 8)],
    PROJECT_REGISTRY_PROGRAM_ID
  )[0];
};

/**
 * Derives the Metaplex Metadata PDA for a given mint.
 */
export const getMetadataPDA = (mint: PublicKey) => {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from('metadata'),
      METADATA_PROGRAM_ID.toBuffer(),
      mint.toBuffer(),
    ],
    METADATA_PROGRAM_ID
  )[0];
};

/**
 * Executes the createProject instruction on the Solana blockchain.
 */
export const createOnChainProject = async (
  connection: Connection,
  wallet: any,
  params: CreateProjectParams
): Promise<{ signature: string; projectId: number; projectPda: string; mintAddress: string }> => {
  
  if (!wallet.publicKey) {
    throw new Error("Wallet not connected");
  }

  const program = getRegistryProgram(connection, wallet);
  const registryPda = getRegistryPDA();

  // 1. Fetch current project count for PDA derivation
  let registryAccount: any;
  try {
    registryAccount = await program.account.registryConfig.fetch(registryPda);
  } catch (error: any) {
    throw new Error("Could not fetch registry config: " + error.message);
  }

  const currentProjectCount = registryAccount.projectCount as BN;
  const projectPda = getProjectPDA(currentProjectCount);

  // 2. Generate Mint Keypair
  const mintKeypair = Keypair.generate();
  const mintAddress = mintKeypair.publicKey;
  const metadataPda = getMetadataPDA(mintAddress);

  // 3. Calculate Rent for Mint Account
  const lamports = await connection.getMinimumBalanceForRentExemption(MINT_SIZE);

  // 3. Build Atomic Transaction
  const tx = new Transaction();

  // A. Create Mint Account
  tx.add(
    SystemProgram.createAccount({
      fromPubkey: wallet.publicKey,
      newAccountPubkey: mintAddress,
      space: MINT_SIZE,
      lamports,
      programId: TOKEN_PROGRAM_ID,
    })
  );

  // B. Initialize Mint (6 decimals by default)
  tx.add(
    createInitializeMintInstruction(
      mintAddress,
      6,
      wallet.publicKey,
      wallet.publicKey,
      TOKEN_PROGRAM_ID
    )
  );

  // C. Create Metaplex Metadata Account
  tx.add(
    createCreateMetadataAccountV3Instruction(
      {
        metadata: metadataPda,
        mint: mintAddress,
        mintAuthority: wallet.publicKey,
        payer: wallet.publicKey,
        updateAuthority: wallet.publicKey,
      },
      {
        createMetadataAccountArgsV3: {
          data: {
            name: params.name,
            symbol: params.symbol,
            uri: params.uri,
            sellerFeeBasisPoints: 0,
            creators: null,
            collection: null,
            uses: null,
          },
          isMutable: true,
          collectionDetails: null,
        },
      }
    )
  );

  // D. Create Project in Registry
  const instructionParams = {
    name: params.name,
    symbol: params.symbol,
    uri: params.uri,
    supplyCap: params.supplyCap.mul(new BN(1_000_000)), // Apply 6 decimals to supply
    minInvestmentUsdc: params.minInvestmentUsdc,
    maxInvestmentUsdc: params.maxInvestmentUsdc,
    acceptedStablecoin: params.acceptedStablecoin,
    treasuryWallet: params.treasuryWallet,
    lockupEndTs: params.lockupEndTs,
    subscriptionStart: params.subscriptionStart,
    subscriptionEnd: params.subscriptionEnd,
    distributionCadence: params.distributionCadence,
  };

  const createProjectIx = await program.methods
    .createProject(instructionParams)
    .accounts({
      registry: registryPda,
      project: projectPda,
      admin: wallet.publicKey,
      systemProgram: SystemProgram.programId,
    } as any)
    .instruction();
  tx.add(createProjectIx);

  // E. Link Mint to Project
  const setMintIx = await program.methods
    .setProjectMint(mintAddress)
    .accounts({
      registry: registryPda,
      project: projectPda,
      admin: wallet.publicKey,
    } as any)
    .instruction();
  tx.add(setMintIx);

  // 4. Send Transaction
  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('finalized');
  tx.recentBlockhash = blockhash;
  tx.feePayer = wallet.publicKey;

  // Sign with Mint Keypair (the Wallet signature is handled by wallet adapter)
  tx.partialSign(mintKeypair);

  const signature = await wallet.sendTransaction(tx, connection, {
    skipPreflight: true,
    maxRetries: 3,
  });

  await connection.confirmTransaction({
    signature,
    blockhash,
    lastValidBlockHeight
  }, 'confirmed');

  return {
    signature,
    projectId: currentProjectCount.toNumber(),
    projectPda: projectPda.toString(),
    mintAddress: mintAddress.toString(),
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// UPDATE PROJECT PARAMS (on-chain edit — all fields optional)
// Maps to the `updateProjectParams` instruction in the IDL.
// Only non-null fields are transmitted; send null to keep existing chain value.
// ─────────────────────────────────────────────────────────────────────────────

export interface UpdateProjectParams {
  minInvestmentUsdc?: BN | null;   // pass null = keep current value
  maxInvestmentUsdc?: BN | null;
  subscriptionStart?: BN | null;
  subscriptionEnd?: BN | null;
  distributionCadence?: number | null;
  lockupEndTs?: BN | null;
}

/**
 * Calls `updateProjectParams` on-chain for an already-deployed project.
 * Only the fields set to a non-null BN will be mutated on-chain.
 * Requires admin wallet (registry.authority or registry.super_admin).
 */
export const updateOnChainProjectParams = async (
  connection: Connection,
  wallet: any,
  projectId: number,
  params: UpdateProjectParams
): Promise<{ signature: string }> => {
  if (!wallet.publicKey) throw new Error('Wallet not connected');

  const program  = getRegistryProgram(connection, wallet);
  const registry = getRegistryPDA();
  const project  = getProjectPDA(new BN(projectId));

  // Anchor expects Option<T> as null (absent) or the value — BN works directly
  const instructionParams = {
    minInvestmentUsdc:  params.minInvestmentUsdc  ?? null,
    maxInvestmentUsdc:  params.maxInvestmentUsdc  ?? null,
    subscriptionStart:  params.subscriptionStart  ?? null,
    subscriptionEnd:    params.subscriptionEnd    ?? null,
    distributionCadence: params.distributionCadence !== undefined && params.distributionCadence !== null
      ? params.distributionCadence
      : null,
    lockupEndTs:        params.lockupEndTs        ?? null,
  };

  const instruction = await program.methods
    .updateProjectParams(instructionParams)
    .accounts({ registry, project, admin: wallet.publicKey } as any)
    .instruction();

  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('finalized');
  const { Transaction } = await import('@solana/web3.js');
  const tx = new Transaction();
  tx.add(instruction);
  tx.recentBlockhash = blockhash;
  tx.feePayer = wallet.publicKey;

  const signature = await wallet.sendTransaction(tx, connection, { skipPreflight: true, maxRetries: 3 });
  await connection.confirmTransaction({ signature, blockhash, lastValidBlockHeight }, 'confirmed');

  return { signature };
};

// ─────────────────────────────────────────────────────────────────────────────
// PAUSE / RESUME INVESTMENT SUBSCRIPTIONS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Toggles investments_paused flag on-chain.
 * paused=true → investors cannot subscribe; paused=false → open again.
 */
export const pauseOnChainInvestments = async (
  connection: Connection,
  wallet: any,
  projectId: number,
  paused: boolean
): Promise<{ signature: string }> => {
  if (!wallet.publicKey) throw new Error('Wallet not connected');

  const program  = getRegistryProgram(connection, wallet);
  const registry = getRegistryPDA();
  const project  = getProjectPDA(new BN(projectId));

  const instruction = await program.methods
    .pauseInvestments(paused)
    .accounts({ registry, project, admin: wallet.publicKey } as any)
    .instruction();

  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('finalized');
  const { Transaction } = await import('@solana/web3.js');
  const tx = new Transaction();
  tx.add(instruction);
  tx.recentBlockhash = blockhash;
  tx.feePayer = wallet.publicKey;

  const signature = await wallet.sendTransaction(tx, connection, { skipPreflight: true, maxRetries: 3 });
  await connection.confirmTransaction({ signature, blockhash, lastValidBlockHeight }, 'confirmed');

  return { signature };
};

// ─────────────────────────────────────────────────────────────────────────────
// PAUSE / RESUME TOKEN TRANSFERS
// ─────────────────────────────────────────────────────────────────────────────

export const pauseOnChainTransfers = async (
  connection: Connection,
  wallet: any,
  projectId: number,
  paused: boolean
): Promise<{ signature: string }> => {
  if (!wallet.publicKey) throw new Error('Wallet not connected');

  const program  = getRegistryProgram(connection, wallet);
  const registry = getRegistryPDA();
  const project  = getProjectPDA(new BN(projectId));

  const instruction = await program.methods
    .pauseTransfers(paused)
    .accounts({ registry, project, admin: wallet.publicKey } as any)
    .instruction();

  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('finalized');
  const { Transaction } = await import('@solana/web3.js');
  const tx = new Transaction();
  tx.add(instruction);
  tx.recentBlockhash = blockhash;
  tx.feePayer = wallet.publicKey;

  const signature = await wallet.sendTransaction(tx, connection, { skipPreflight: true, maxRetries: 3 });
  await connection.confirmTransaction({ signature, blockhash, lastValidBlockHeight }, 'confirmed');

  return { signature };
};

// ─────────────────────────────────────────────────────────────────────────────
// SET PROJECT ACTIVE / INACTIVE  (super_admin only on-chain)
// ─────────────────────────────────────────────────────────────────────────────

export const setOnChainProjectActive = async (
  connection: Connection,
  wallet: any,
  projectId: number,
  isActive: boolean
): Promise<{ signature: string }> => {
  if (!wallet.publicKey) throw new Error('Wallet not connected');

  const program  = getRegistryProgram(connection, wallet);
  const registry = getRegistryPDA();
  const project  = getProjectPDA(new BN(projectId));

  const instruction = await program.methods
    .setProjectActive(isActive)
    .accounts({ registry, project, superAdmin: wallet.publicKey } as any)
    .instruction();

  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('finalized');
  const { Transaction } = await import('@solana/web3.js');
  const tx = new Transaction();
  tx.add(instruction);
  tx.recentBlockhash = blockhash;
  tx.feePayer = wallet.publicKey;

  const signature = await wallet.sendTransaction(tx, connection, { skipPreflight: true, maxRetries: 3 });
  await connection.confirmTransaction({ signature, blockhash, lastValidBlockHeight }, 'confirmed');

  return { signature };
};

// ─────────────────────────────────────────────────────────────────────────────
// SET PROJECT MINT ADDRESS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Associates an SPL Token Mint with a project on-chain.
 * Can only be done once; fails if project.mint is already set.
 */
export const setProjectOnChainMint = async (
  connection: Connection,
  wallet: any,
  projectId: number,
  mintAddress: string
): Promise<{ signature: string }> => {
  if (!wallet.publicKey) throw new Error('Wallet not connected');

  const program  = getRegistryProgram(connection, wallet);
  const registry = getRegistryPDA();
  const project  = getProjectPDA(new BN(projectId));
  const mint     = new PublicKey(mintAddress);

  const instruction = await program.methods
    .setProjectMint(mint)
    .accounts({ registry, project, admin: wallet.publicKey } as any)
    .instruction();

  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('finalized');
  const { Transaction } = await import('@solana/web3.js');
  const tx = new Transaction();
  tx.add(instruction);
  tx.recentBlockhash = blockhash;
  tx.feePayer = wallet.publicKey;

  const signature = await wallet.sendTransaction(tx, connection, { skipPreflight: true, maxRetries: 3 });
  await connection.confirmTransaction({ signature, blockhash, lastValidBlockHeight }, 'confirmed');

  return { signature };
};

// ─────────────────────────────────────────────────────────────────────────────
// REVOKE MINT AUTHORITY
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Marks the project mint authority as revoked on-chain.
 * Irreversible. Requires super_admin signature.
 */
export const revokeOnChainMintAuthority = async (
  connection: Connection,
  wallet: any,
  projectId: number
): Promise<{ signature: string }> => {
  if (!wallet.publicKey) throw new Error('Wallet not connected');

  const program  = getRegistryProgram(connection, wallet);
  const registry = getRegistryPDA();
  const project  = getProjectPDA(new BN(projectId));

  const instruction = await program.methods
    .revokeMintAuthority()
    .accounts({ registry, project, superAdmin: wallet.publicKey } as any)
    .instruction();

  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('finalized');
  const { Transaction } = await import('@solana/web3.js');
  const tx = new Transaction();
  tx.add(instruction);
  tx.recentBlockhash = blockhash;
  tx.feePayer = wallet.publicKey;

  const signature = await wallet.sendTransaction(tx, connection, { skipPreflight: true, maxRetries: 3 });
  await connection.confirmTransaction({ signature, blockhash, lastValidBlockHeight }, 'confirmed');

  return { signature };
};

