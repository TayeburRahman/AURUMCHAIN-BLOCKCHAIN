import { Keypair, PublicKey } from '@solana/web3.js';
import bs58 from 'bs58';
import { ProjectRegistryService } from '../lib/web3/services/projectRegistryService';
import { getProjectPDA } from '../lib/web3/utils/pdaHelpers';
import { SOLANA_RPC_URL, createDefaultConnection } from '../lib/web3/config/rpc';
import * as fs from 'fs';
import * as path from 'path';

/**
 * AURUMCHAIN - Epic 1 Integration Test Suite
 */

async function main() {
  const envPath = path.resolve(process.cwd(), '.env');
  const env = fs.readFileSync(envPath, 'utf-8').split('\n').reduce((acc, line) => {
    const [key, ...value] = line.split('=');
    if (key && value.length) acc[key.trim()] = value.join('=').trim();
    return acc;
  }, {} as any);

  const privateKeyStr = env['WALLET_PRIVATE_KEY'];
  if (!privateKeyStr) {
    throw new Error("WALLET_PRIVATE_KEY not found in .env");
  }

  // Parse private key
  let secretKey: Uint8Array;
  if (privateKeyStr.trim().startsWith('[')) {
    secretKey = Uint8Array.from(JSON.parse(privateKeyStr));
  } else {
    secretKey = bs58.decode(privateKeyStr);
  }
  const payer = Keypair.fromSecretKey(secretKey);

  console.log("--------------------------------------------------");
  console.log("AURUMCHAIN - EPIC 1 INTEGRATION TEST");
  console.log("--------------------------------------------------");
  console.log(`RPC Endpoint: ${SOLANA_RPC_URL}`);
  console.log(`Admin Wallet: ${payer.publicKey.toBase58()}`);
  
  const connection = createDefaultConnection();

  const wallet = {
    publicKey: payer.publicKey,
    sendTransaction: async (tx: any, connection: any, options?: any) => {
      tx.partialSign(payer);
      const signature = await connection.sendRawTransaction(tx.serialize(), options);
      return signature;
    }
  };

  const service = new ProjectRegistryService(connection, wallet);

  try {
    // -------------------------------------------------------------------------
    // TEST: SYNC WITH PROJECT ID 16 ("18 April 2026")
    // -------------------------------------------------------------------------
    const targetId = 16;
    console.log(`\n[TEST] Syncing with Project ID ${targetId} (April 18th Deployment)...`);
    
    // 1. Fetch
    const project = await service.fetchProject(targetId);
    if (!project) throw new Error(`Project ${targetId} not found on-chain!`);
    
    console.log("✅ Project Found!");
    console.log(` - Name:   "${project.name}"`);
    console.log(` - ID:     ${project.projectId.toString()}`);
    console.log(` - Status: ${project.isActive ? 'Active' : 'Inactive'} / ${project.isPaused ? 'Paused' : 'Unpaused'}`);

    // Verify Name
    if (!project.name.includes("18 April 2026")) {
      console.warn(`⚠️ Warning: Name mismatch! Expected '18 April 2026', got '${project.name}'`);
    }

    // 2. Test Mutation (Status Toggle)
    console.log("\n[TEST] Verifying Authority (Toggling Pause Status)...");
    const newPauseState = !project.isPaused;
    const toggleSig = await service.updateProjectStatus(targetId, project.isActive, newPauseState);
    console.log(` ✅ Success! Transaction: ${toggleSig}`);

    // 3. Verify Mutation
    const updatedProject = await service.fetchProject(targetId);
    console.log(` - New Pause State: ${updatedProject.isPaused}`);
    
    if (updatedProject.isPaused !== newPauseState) throw new Error("On-chain state did not update!");

    console.log("\n✨ EPIC 1 COMPLETED & VERIFIED!");
    console.log("The integration layer successfully synced with Project 16 and confirmed administrative control.");

  } catch (err: any) {
    console.error("\n❌ TEST FAILED:");
    console.error(err.message);
    if (err.logs) {
      console.log("\nDetailed Program Logs:");
      err.logs.forEach((log: string) => console.log(`  > ${log}`));
    }
    process.exit(1);
  }
}

main().catch(err => {
  console.error("Fatal Error:", err);
  process.exit(1);
});
