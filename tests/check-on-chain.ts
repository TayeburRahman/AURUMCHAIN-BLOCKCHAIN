import 'dotenv/config';
import { Connection, PublicKey } from '@solana/web3.js';
import { getComplianceProgram } from '../lib/web3/clients/anchorClients';
import { BN } from '@coral-xyz/anchor';

/**
 * Terminal Verification Utility
 * 
 * Fetches and displays the raw blockchain state for a specific investment subscription.
 * Use this to verify that the backend settlement worked correctly.
 * 
 * Usage: npx tsx tests/check-on-chain.ts <INVESTOR_PUBKEY> <SUBSCRIPTION_ID>
 */

async function main() {
  const args = process.argv.slice(2);
  if (args.length < 2) {
    console.log("\n❌ Missing arguments!");
    console.log("Usage: npx tsx tests/check-on-chain.ts <INVESTOR_PUBKEY> <SUBSCRIPTION_ID>");
    console.log("Example: npx tsx tests/check-on-chain.ts Gh9W... 1713596200000\n");
    process.exit(1);
  }

  const investorStr = args[0];
  const subIdStr = args[1];

  try {
    const investor = new PublicKey(investorStr);
    const subId = new BN(subIdStr);

    const RPC_URL = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || "https://api.devnet.solana.com";
    const connection = new Connection(RPC_URL, "confirmed");
    const program = getComplianceProgram(connection);

    // Derive the Subscription PDA exactly as the program does
    const [pda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("subscription"), 
        investor.toBuffer(), 
        subId.toArrayLike(Buffer, "le", 8)
      ],
      program.programId
    );

    console.log(`\n🔍 Querying Blockchain for PDA: ${pda.toBase58()}...`);

    const account: any = await program.account.investmentSubscriptionAccount.fetch(pda);
    
    // Format high-level status
    const status = Object.keys(account.status)[0];
    const statusColor = status === 'Settled' || status === 'Allocated' ? '✅' : '⏳';

    console.log("\n========================================");
    console.log("       AURUMCHAIN ON-CHAIN STATE       ");
    console.log("========================================");
    console.log(`Investor:    ${account.investor.toBase58()}`);
    console.log(`Project ID:  #${account.projectId.toString()}`);
    console.log(`Amount:      ${account.investmentAmount.toString()} (USDC Units)`);
    console.log(`Status:      ${statusColor} ${status.toUpperCase()}`);
    console.log(`Allocated:   ${account.allocatedTokenAmount.toString()} GOLD`);
    
    if (account.settledAt.toNumber() > 0) {
      const date = new Date(account.settledAt.toNumber() * 1000).toLocaleString();
      console.log(`Settled At:  ${date}`);
    }
    console.log("========================================\n");

  } catch (err: any) {
    if (err.message.includes("Account does not exist")) {
      console.log("\n❌ NOT FOUND: This subscription does not exist on-chain yet.");
      console.log("   Check if the investor has actually clicked 'Invest Now' first.\n");
    } else {
      console.error("\n❌ ERROR:", err.message, "\n");
    }
    process.exit(1);
  }
}

main();
