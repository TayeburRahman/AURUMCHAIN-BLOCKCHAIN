import 'dotenv/config';
import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { PublicKey, SystemProgram, Keypair, Transaction } from "@solana/web3.js";
import assert from "assert";
import { BN } from "bn.js";
import * as fs from "fs";
import * as path from "path";
import bs58 from "bs58";
import { PROJECT_REGISTRY_PROGRAM_ID, COMPLIANCE_PROGRAM_ID } from "../lib/web3/config/programs";
import { confirmTransactionRobustly } from "../lib/web3/utils/transactionUtils";

describe("subscription_lifecycle", () => {
  // Manual Provider Setup
  const RPC_URL = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || "https://api.devnet.solana.com";
  const connection = new anchor.web3.Connection(RPC_URL, "confirmed");
  
  const privateKeyStr = process.env.WALLET_PRIVATE_KEY!;
  const secretKey = privateKeyStr.startsWith("[") 
    ? Uint8Array.from(JSON.parse(privateKeyStr))
    : bs58.decode(privateKeyStr);
  
  const wallet = new anchor.Wallet(anchor.web3.Keypair.fromSecretKey(secretKey));
  const provider = new anchor.AnchorProvider(connection, wallet, {
    commitment: "confirmed",
    preflightCommitment: "confirmed",
  });
  
  anchor.setProvider(provider);

  // Load IDLs manually
  const complianceIdlPath = path.resolve(process.cwd(), "programs/compliance_transfer/src/idl.json");
  const complianceIdl = JSON.parse(fs.readFileSync(complianceIdlPath, "utf8"));
  const complianceProgram = new Program(complianceIdl, COMPLIANCE_PROGRAM_ID, provider);

  const registryIdlPath = path.resolve(process.cwd(), "programs/project_registry/src/idl.json");
  const registryIdl = JSON.parse(fs.readFileSync(registryIdlPath, "utf8"));
  const registryProgram = new Program(registryIdl, PROJECT_REGISTRY_PROGRAM_ID, provider);
  
  const authority = provider.wallet;

  /**
   * Universal robust sender for all test steps
   */
  async function sendAndConfirmCustom(tx: Transaction, extraSigners: Keypair[] = []) {
    tx.recentBlockhash = (await provider.connection.getLatestBlockhash()).blockhash;
    tx.feePayer = authority.publicKey;
    
    const signed = await provider.wallet.signTransaction(tx);
    for (const s of extraSigners) {
      signed.partialSign(s);
    }

    const sig = await provider.connection.sendRawTransaction(signed.serialize(), { skipPreflight: true });
    await confirmTransactionRobustly(
      provider.connection,
      sig,
      (await provider.connection.getBlockHeight()) + 150,
      'confirmed'
    );
    return sig;
  }

  const [controlPda] = PublicKey.findProgramAddressSync([Buffer.from("compliance_control")], complianceProgram.programId);
  const [registryPda] = PublicKey.findProgramAddressSync([Buffer.from("control")], registryProgram.programId);

  // Helpers
  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  async function registerUser(user: Keypair) {
    const [pda] = PublicKey.findProgramAddressSync(
      [Buffer.from("eligibility"), user.publicKey.toBuffer()],
      complianceProgram.programId
    );

    // Fund test investor for rent exemption (from Admin wallet)
    console.log(`   🪙 Funding test investor: ${user.publicKey.toBase58().slice(0,8)}...`);
    const fundingTx = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: authority.publicKey,
        toPubkey: user.publicKey,
        lamports: 50_000_000,
      })
    );
    
    await sendAndConfirmCustom(fundingTx);

    // Manual RPC with robust confirmation
    const registerIx = await complianceProgram.methods.recordVerifiedWallet({
        kycStatus: { approved: {} },
        amlStatus: { clear: {} },
        identityHash: Array(32).fill(1),
        investmentAllowed: true,
        transferAllowed: true,
        expiryTimestamp: new BN(Math.floor(Date.now() / 1000) + 86400),
    }).accounts({
        eligibility: pda,
        wallet: user.publicKey,
        control: controlPda,
        authority: authority.publicKey,
        systemProgram: SystemProgram.programId,
    }).instruction();

    await sendAndConfirmCustom(new Transaction().add(registerIx));
    return pda;
  }

  async function createProject() {
    // 1. Fetch current project count to derive the correct PDA
    const controlState: any = await registryProgram.account.controlAccount.fetch(registryPda);
    const id = controlState.projectCount;

    const [projectPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("project"), id.toArrayLike(Buffer, "le", 8)],
        registryProgram.programId
    );
    
    console.log(`   🏗️ Creating Test Project ID: ${id.toString()}...`);
    const createIx = await registryProgram.methods.createProject({
        name: "Test Project",
        symbol: "TST",
        uri: "https://test.com",
        supplyCap: new BN(1000000),
        minInvestmentUsdc: new BN(1000),
        maxInvestmentUsdc: new BN(10000),
        acceptedStablecoin: PublicKey.unique(),
        treasuryWallet: PublicKey.unique(),
        lockupEndTs: new BN(0),
        subscriptionStart: new BN(Math.floor(Date.now() / 1000) - 3600), // Started 1h ago
        subscriptionEnd: new BN(Math.floor(Date.now() / 1000) + 3600),   // Ends in 1h
        distributionCadence: 0,
    }).accounts({
        control: registryPda,
        project: projectPda,
        admin: authority.publicKey,
        systemProgram: SystemProgram.programId,
    }).instruction();

    await sendAndConfirmCustom(new Transaction().add(createIx));
    return { pda: projectPda, id };
  }

  it("1. Setup: Initialize Programs", async () => {
    try {
        await registryProgram.methods.initializeControl(authority.publicKey, new BN(10000000)).accounts({
            control: registryPda,
            payer: authority.publicKey,
            systemProgram: SystemProgram.programId,
        }).rpc();
    } catch(e) {}

    try {
        const ix = await registryProgram.methods.initializeControl(authority.publicKey, authority.publicKey, new BN(1000000000)).accounts({
            control: registryPda,
            payer: authority.publicKey,
            systemProgram: SystemProgram.programId,
        }).instruction();
        await sendAndConfirmCustom(new Transaction().add(ix));
    } catch(e) {}

    try {
        const ix = await complianceProgram.methods.initializeCompliance(authority.publicKey, authority.publicKey, registryProgram.programId).accounts({
            control: controlPda,
            payer: authority.publicKey,
            systemProgram: SystemProgram.programId,
        }).instruction();
        await sendAndConfirmCustom(new Transaction().add(ix));
    } catch(e) {}
  });

  it("2. Subscribe: Investor creates subscription intent", async () => {
    const investor = Keypair.generate();
    const investorEligibility = await registerUser(investor);
    const { pda: projectAccount, id: projectId } = await createProject();

    const subscriptionId = new BN(Math.floor(Math.random() * 1000000));
    const [subscriptionPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("subscription"), investor.publicKey.toBuffer(), subscriptionId.toArrayLike(Buffer, "le", 8)],
      complianceProgram.programId
    );

    console.log("   📝 Subscribing investor...");
    const subscribeIx = await complianceProgram.methods.subscribeInvestment(
        subscriptionId,
        projectId,
        new BN(5000), // $5,000 investment
        PublicKey.unique()
    ).accounts({
        subscription: subscriptionPda,
        investor: investor.publicKey,
        eligibility: investorEligibility,
        projectAccount: projectAccount,
        projectRegistryProgram: registryProgram.programId,
        control: controlPda,
        systemProgram: SystemProgram.programId,
    }).instruction();

    // Sign with both provider (authority) and investor
    const tx = new Transaction().add(subscribeIx);
    await sendAndConfirmCustom(tx, [investor]);

    console.log("   ✅ Subscription created!");

    const subAccount: any = await complianceProgram.account.investmentSubscriptionAccount.fetch(subscriptionPda);
    assert.strictEqual(subAccount.investmentAmount.toNumber(), 5000);
    assert.ok(subAccount.status.pending);
  });

  it("3. Subscribe: Rejects Below Minimum", async () => {
    const investor = Keypair.generate();
    const investorPda = await registerUser(investor);
    const { pda: projectPda, id: projectId } = await createProject();
    
    const subId = new BN(Date.now());

    try {
        await complianceProgram.methods.subscribeInvestment(
            subId,
            new BN(projectId),
            new BN(500), // Below 1000
            PublicKey.unique()
        ).accounts({
            subscription: PublicKey.unique(), // dummy
            investor: investor.publicKey,
            eligibility: investorPda,
            projectAccount: projectPda,
            projectRegistryProgram: registryProgram.programId,
            control: controlPda,
            systemProgram: SystemProgram.programId,
        }).signers([investor]).rpc();
        assert.fail("Should have failed with InvestmentTooLow");
    } catch (err: any) {
        assert.ok(err.toString().includes("InvestmentTooLow"));
    }
  });

  it("3. Finalize: Admin settles subscription", async () => {
    const investor = Keypair.generate();
    const investorEligibility = await registerUser(investor);
    const { pda: projectAccount, id: projectId } = await createProject();

    const subscriptionId = new BN(Math.floor(Math.random() * 1000000));
    const [subscriptionPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("subscription"), investor.publicKey.toBuffer(), subscriptionId.toArrayLike(Buffer, "le", 8)],
      complianceProgram.programId
    );

    // Subscribe
    const subscribeIx = await complianceProgram.methods.subscribeInvestment(
        subscriptionId,
        projectId,
        new BN(5000), 
        PublicKey.unique()
    ).accounts({
        subscription: subscriptionPda,
        investor: investor.publicKey,
        eligibility: investorEligibility,
        projectAccount: projectAccount,
        projectRegistryProgram: registryProgram.programId,
        control: controlPda,
        systemProgram: SystemProgram.programId,
    }).instruction();
    await sendAndConfirmCustom(new Transaction().add(subscribeIx), [investor]);

    // Finalize
    console.log("   ⚖️ Finalizing subscription...");
    const settlementHash = Array(64).fill(7);
    const finalizeIx = await complianceProgram.methods.finalizeSubscription(
        settlementHash,
        new BN(1000) // 1000 tokens allocated
    ).accounts({
        subscription: subscriptionPda,
        control: controlPda,
        authority: authority.publicKey,
    }).instruction();

    await sendAndConfirmCustom(new Transaction().add(finalizeIx));

    const finalAccount: any = await complianceProgram.account.investmentSubscriptionAccount.fetch(subscriptionPda);
    assert.ok(finalAccount.status.settled || finalAccount.status.allocated);
    console.log("   ✨ Subscription finalized successfully!");
  });
});
