import 'dotenv/config';
import { Connection, PublicKey } from '@solana/web3.js';
import * as anchor from "@coral-xyz/anchor";
import { getRegistryProgram } from './lib/web3/clients/anchorClients';
import { getProjectPDA } from './lib/web3/utils/pdaHelpers';

async function main() {
    const RPC_URL = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || "https://api.devnet.solana.com";
    const connection = new Connection(RPC_URL, "confirmed");
    const program = getRegistryProgram(connection);
    
    const projectId = 107;
    const projectPda = getProjectPDA(projectId, program.programId);
    
    console.log(`Checking Project #${projectId} at PDA: ${projectPda.toBase58()}`);
    
    try {
        const account: any = await program.account.projectAccount.fetch(projectPda);
        console.log("Project Data:");
        console.log(` - Name: ${account.name}`);
        console.log(` - Status: ${JSON.stringify(account.status)}`);
        console.log(` - Mint: ${account.mint.toBase58()}`);
        console.log(` - IsPaused: ${account.isPaused}`);
    } catch (e: any) {
        console.error("Project not found or error:", e.message);
    }
}

main();
