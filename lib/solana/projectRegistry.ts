import { Program, AnchorProvider, setProvider, BN } from '@coral-xyz/anchor';
import { Connection, PublicKey, SystemProgram } from '@solana/web3.js';
import idl from '@/programs/project_registry/src/idl.json';

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
 * Executes the createProject instruction on the Solana blockchain.
 */
export const createOnChainProject = async (
  connection: Connection,
  wallet: any,
  params: CreateProjectParams
): Promise<{ signature: string; projectId: number; projectPda: string }> => {
  
  if (!wallet.publicKey) {
    throw new Error("Wallet not connected");
  }

  const program = getRegistryProgram(connection, wallet);
  const registryPda = getRegistryPDA();

  // 1. Fetch the Registry Account to determine the incoming project_id (project_count)
  let registryAccount: any;
  try {
    registryAccount = await program.account.registryConfig.fetch(registryPda);
  } catch (error: any) {
    console.error("RAW FETCH ERROR:", error);
    throw new Error("Underlying fetch error: " + error.message);
  }

  const currentProjectCount = registryAccount.projectCount as BN;
  const projectPda = getProjectPDA(currentProjectCount);

  // 2. Build the exact CreateProjectParams struct map requested by Anchor
  const instructionParams = {
    name: params.name,
    symbol: params.symbol,
    uri: params.uri,
    supplyCap: params.supplyCap,
    minInvestmentUsdc: params.minInvestmentUsdc,
    maxInvestmentUsdc: params.maxInvestmentUsdc,
    acceptedStablecoin: params.acceptedStablecoin,
    treasuryWallet: params.treasuryWallet,
    lockupEndTs: params.lockupEndTs,
    subscriptionStart: params.subscriptionStart,
    subscriptionEnd: params.subscriptionEnd,
    distributionCadence: params.distributionCadence,
  };

  // 3. Execute the transaction manually instead of using .rpc() to defeat caching and false simulations
  const instruction = await program.methods
    .createProject(instructionParams)
    .accounts({
      registry: registryPda,
      project: projectPda,
      admin: wallet.publicKey,
      systemProgram: SystemProgram.programId,
    } as any)
    .instruction();

  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('finalized');
  
  // Natively imported Transaction
  const { Transaction } = await import('@solana/web3.js');
  const tx = new Transaction();
  tx.add(instruction);
  tx.recentBlockhash = blockhash;
  tx.feePayer = wallet.publicKey;

  // Manually invoke standard wallet adapter, strictly disabling preflight to bypass Phantom's UI simulation glitch
  const signature = await wallet.sendTransaction(tx, connection, {
    skipPreflight: true,
    maxRetries: 3
  });

  // Wait for confirmation to ensure it exists on-chain before database sync
  await connection.confirmTransaction({
    signature,
    blockhash,
    lastValidBlockHeight
  }, 'confirmed');

  return {
    signature,
    projectId: currentProjectCount.toNumber(),
    projectPda: projectPda.toString(),
  };
};
