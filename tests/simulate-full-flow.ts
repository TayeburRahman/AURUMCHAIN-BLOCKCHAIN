import 'dotenv/config';
import { Connection, PublicKey, Keypair } from '@solana/web3.js';
import * as anchor from "@coral-xyz/anchor";
import { BN } from '@coral-xyz/anchor';
import bs58 from 'bs58';
import { getComplianceProgram, getRegistryProgram } from '../lib/web3/clients/anchorClients';
import { AdminBlockchainService } from '../lib/web3/services/adminBlockchainService';
import { confirmTransactionRobustly } from '../lib/web3/utils/transactionUtils';
import { Transaction, ComputeBudgetProgram } from '@solana/web3.js';

/**
 * FULL FLOW SIMULATOR (AC-BC-406 Verification)
 * 
 * This script simulates the entire lifecycle:
 * 1. User Subscribes (Frontend Sim)
 * 2. Admin Settles (Backend RPC Sim)
 * 3. Verify Final On-Chain State
 */

async function main() {
  console.log("\n🚀 STARTING FULL FLOW SIMULATION...");

  const RPC_URL = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || "https://api.devnet.solana.com";
  const connection = new Connection(RPC_URL, "confirmed");

  const privateKeyStr = process.env.WALLET_PRIVATE_KEY!;
  const secretKey = privateKeyStr.startsWith("[")
    ? Uint8Array.from(JSON.parse(privateKeyStr))
    : bs58.decode(privateKeyStr);

  const wallet = new anchor.Wallet(Keypair.fromSecretKey(secretKey));
  const investor = wallet.publicKey;

  // Use a random ID for the simulation
  const subId = Math.floor(Date.now() / 1000);
  const projectId = 6; // Targeted Project ID

  console.log(`👤 Actor: ${investor.toBase58()}`);
  console.log(`🆔 Simulation Sub ID: ${subId}`);

  try {
    const complianceProgram = getComplianceProgram(connection, wallet);
    const registryProgram = getRegistryProgram(connection, wallet);

    // --- STAGE 1: SUBSCRIBE (INVESTOR SIDE) ---
    console.log("\n--- STAGE 1: INVESTOR SUBSCRIBES ---");
    
    // We derive common PDAs
    const [controlPda] = PublicKey.findProgramAddressSync([Buffer.from("compliance_control")], complianceProgram.programId);
    const [projectRegistryPda] = PublicKey.findProgramAddressSync([Buffer.from("control")], registryProgram.programId);
    const [projectAccountPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("project"), new BN(projectId).toArrayLike(Buffer, "le", 8)], 
        registryProgram.programId
    );
    const [eligibilityPda] = PublicKey.findProgramAddressSync([Buffer.from("eligibility"), investor.toBuffer()], complianceProgram.programId);
    const [subscriptionPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("subscription"), investor.toBuffer(), new BN(subId).toArrayLike(Buffer, "le", 8)], 
        complianceProgram.programId
    );

    // --- STAGE 0: REGISTER WALLET (COMPLIANCE) ---
    console.log("\n--- STAGE 0: REGISTERING WALLET IN COMPLIANCE ---");
    const eligibilityInfo = await connection.getAccountInfo(eligibilityPda);
    if (!eligibilityInfo) {
      const regIx = await complianceProgram.methods
        .recordVerifiedWallet({
          kycStatus: { approved: {} },
          amlStatus: { clear: {} },
          identityHash: Array(32).fill(1),
          investmentAllowed: true,
          transferAllowed: true,
          expiryTimestamp: new BN(Math.floor(Date.now() / 1000) + 86400 * 365), // 1 year
        })
        .accounts({
          eligibility: eligibilityPda,
          wallet: investor,
          control: controlPda,
          authority: investor,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .instruction();

      const { blockhash: b1, lastValidBlockHeight: h1 } = await connection.getLatestBlockhash();
      const regTxObj = new Transaction().add(regIx);
      regTxObj.recentBlockhash = b1;
      regTxObj.feePayer = investor;
      const signedReg = await wallet.signTransaction(regTxObj);
      const regTx = await connection.sendRawTransaction(signedReg.serialize());
      await confirmTransactionRobustly(connection, regTx, h1);
      
      console.log(`✅ Wallet Registered! Signature: ${regTx}`);
    } else {
      console.log("✅ Wallet already registered.");
    }

    const mockUsdc = new PublicKey(process.env.NEXT_PUBLIC_USDC_MINT || "AJujcxZiQ1jUvSixiFLQNWFCpUtMuVsbyPCQ8ByU3jvf");
    
    // Fetch project account to get treasury wallet
    const projectData: any = await registryProgram.account.projectAccount.fetch(projectAccountPda);
    const treasuryWallet = projectData.treasuryWallet;
    
    const { getAssociatedTokenAddressSync, TOKEN_PROGRAM_ID } = await import("@solana/spl-token");
    const investorTokenAccount = getAssociatedTokenAddressSync(mockUsdc, investor);
    const treasuryTokenAccount = getAssociatedTokenAddressSync(mockUsdc, treasuryWallet);

    console.log(`🔹 Mock USDC: ${mockUsdc.toBase58()}`);
    console.log(`🔹 Investor ATA: ${investorTokenAccount.toBase58()}`);
    console.log(`🔹 Treasury ATA: ${treasuryTokenAccount.toBase58()}`);

    console.log("📝 Sending subscribeInvestment transaction...");
    const subIx = await complianceProgram.methods
      .subscribeInvestment(
        new BN(subId),
        new BN(projectId),
        new BN(1200 * 1_000_000), // 1,200 USDC (Min is 1,000 USDC)
        mockUsdc
      )
      .accounts({
        subscription: subscriptionPda,
        investor: investor,
        eligibility: eligibilityPda,
        projectAccount: projectAccountPda,
        projectRegistryProgram: registryProgram.programId,
        control: controlPda,
        investorTokenAccount: investorTokenAccount,
        treasuryTokenAccount: treasuryTokenAccount,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: anchor.web3.SystemProgram.programId,
      } as any)
      .instruction();

    const { blockhash: b2, lastValidBlockHeight: h2 } = await connection.getLatestBlockhash();
    const subTxObj = new Transaction().add(ComputeBudgetProgram.setComputeUnitLimit({ units: 400_000 })).add(subIx);
    subTxObj.recentBlockhash = b2;
    subTxObj.feePayer = investor;
    const signedSub = await wallet.signTransaction(subTxObj);
    const subTx = await connection.sendRawTransaction(signedSub.serialize());
    await confirmTransactionRobustly(connection, subTx, h2);

    console.log(`✅ Subscribed! Signature: ${subTx}`);

    // --- STAGE 2: SETTLE (BACKEND RPC SIDE) ---
    console.log("\n--- STAGE 2: BACKEND SETTLEMENT ---");
    console.log("⚙️ Calling AdminBlockchainService.settleInvestment...");
    
    const settleTx = await AdminBlockchainService.settleInvestment({
      subscriptionId: subId,
      investor: investor.toBase58(),
      allocatedTokenAmount: 1000,
      paymentTxHash: subTx, // We use the sub signature as the "payment reference"
    });

    console.log(`✅ Settled! Signature: ${settleTx}`);

    // --- STAGE 3: VERIFY ---
    console.log("\n--- STAGE 3: FINAL VERIFICATION ---");
    const account: any = await complianceProgram.account.investmentSubscriptionAccount.fetch(subscriptionPda);
    const statusObj = account.status;
    const statusName = Object.keys(statusObj)[0];

    console.log("----------------------------------------");
    console.log(`Raw Status Object:     ${JSON.stringify(statusObj)}`);
    console.log(`Detected Status:       ${statusName}`);
    console.log(`Final On-Chain Status: ${statusName.toLowerCase() === 'allocated' ? '✅ SETTLED/ALLOCATED' : '❌ FAILED'}`);
    console.log(`Allocated Amount:      ${account.allocatedTokenAmount.toString()} RAW UNITS`);
    console.log("----------------------------------------\n");

  } catch (err: any) {
    console.error("\n❌ SIMULATION FAILED:");
    if (err.logs) console.error("Program Logs:", err.logs);
    else console.error(err.message);
    process.exit(1);
  }
}

main();
