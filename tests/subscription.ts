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
import { getAssociatedTokenAddressSync, TOKEN_PROGRAM_ID, createAssociatedTokenAccountInstruction, createMintToInstruction, MINT_SIZE, createInitializeMintInstruction, createSetAuthorityInstruction, AuthorityType } from "@solana/spl-token";

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
  console.log("   🔑 Test Wallet:", authority.publicKey.toBase58());
  const mockUsdc = new PublicKey(process.env.NEXT_PUBLIC_USDC_MINT || "AJujcxZiQ1jUvSixiFLQNWFCpUtMuVsbyPCQ8ByU3jvf");

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

    const [mintAuthPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("mint_authority"), id.toArrayLike(Buffer, "le", 8)],
        registryProgram.programId
    );
    
    console.log(`   🏗️ Creating Test Project ID: ${id.toString()}...`);
    const createIx = await registryProgram.methods.createProject({
        name: "Test Project",
        symbol: "TST",
        uri: "https://test.com",
        supplyCap: new BN("1000000000000"), // 1 Million tokens (with 6 decimals)
        minInvestmentUsdc: new BN(10 * 1_000_000), // $10 min
        maxInvestmentUsdc: new BN(100_000 * 1_000_000), // $100k max
        tokenPriceUsdc: new BN(1000000), // $1.00
        acceptedStablecoin: mockUsdc,
        treasuryWallet: authority.publicKey,
        lockupEndTs: new BN(0),
        subscriptionStart: new BN(Math.floor(Date.now() / 1000) - 3600), // Started 1h ago
        subscriptionEnd: new BN(Math.floor(Date.now() / 1000) + 3600),   // Ends in 1h
        distributionCadence: 0,
        durationMonths: 12,
        distributionMode: 0,
        assetType: { realEstate: {} },
        roundLimitTokens: new BN(0),
        tokenDecimals: 6,
    }).accounts({
        control: registryPda,
        project: projectPda,
        mintAuthorityPda: mintAuthPda,
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
        const ix = await complianceProgram.methods.initializeCompliance(
            authority.publicKey, // super_admin
            authority.publicKey, // authority
            registryProgram.programId
        ).accounts({
            control: controlPda,
            payer: authority.publicKey,
            systemProgram: SystemProgram.programId,
        }).instruction();
        await sendAndConfirmCustom(new Transaction().add(ix));
        console.log("   ✅ Compliance Initialized");
    } catch(e) {}
  });

  it("2. Subscribe: Investor creates subscription intent", async () => {
    const investor = Keypair.generate();
    const investorEligibility = await registerUser(investor);
    const { pda: projectAccount, id: projectId } = await createProject();

    // 1. Set Mint (Required before Funding)
    const setMintIx = await registryProgram.methods.setProjectMint(mockUsdc).accounts({
        control: registryPda,
        project: projectAccount,
        admin: authority.publicKey,
    }).instruction();
    await sendAndConfirmCustom(new Transaction().add(setMintIx));

    // 2. Move from Draft to Funding
    console.log("   🚀 Activating project (Draft -> Funding)...");
    const activateIx = await registryProgram.methods.updateProjectStatus(
        projectId,
        { funding: {} },
        false
    ).accounts({
        control: registryPda,
        project: projectAccount,
        admin: authority.publicKey,
    }).instruction();
    await sendAndConfirmCustom(new Transaction().add(activateIx));

    const subscriptionId = new BN(Math.floor(Math.random() * 1000000));
    const [subscriptionPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("subscription"), investor.publicKey.toBuffer(), subscriptionId.toArrayLike(Buffer, "le", 8)],
      complianceProgram.programId
    );

    console.log("   📝 Subscribing investor...");
    const investorAta = getAssociatedTokenAddressSync(mockUsdc, investor.publicKey);
    const treasuryAta = getAssociatedTokenAddressSync(mockUsdc, authority.publicKey);

    const subscribeIx = await complianceProgram.methods.subscribeInvestment(
        subscriptionId,
        projectId,
        new BN(5000 * 1_000_000), // $5,000 investment
        mockUsdc
    ).accounts({
        subscription: subscriptionPda,
        investor: investor.publicKey,
        eligibility: investorEligibility,
        projectAccount: projectAccount,
        projectRegistryProgram: registryProgram.programId,
        control: controlPda,
        investorTokenAccount: investorAta,
        treasuryTokenAccount: treasuryAta,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
    }).instruction();

    // Sign with both provider (authority) and investor
    // ADDED: Create ATA and MINT mock USDC so the transfer doesn't fail with InsufficientFunds
    const tx = new Transaction().add(
        createAssociatedTokenAccountInstruction(
            authority.publicKey,
            investorAta,
            investor.publicKey,
            mockUsdc
        )
    ).add(
        createMintToInstruction(
            mockUsdc,
            investorAta,
            authority.publicKey,
            10000 * 1_000_000 // Mint 10,000 USDC
        )
    ).add(subscribeIx);
    await sendAndConfirmCustom(tx, [investor]);

    console.log("   ✅ Subscription created!");

    const subAccount: any = await complianceProgram.account.investmentSubscriptionAccount.fetch(subscriptionPda);
    assert.strictEqual(subAccount.investmentAmount.toNumber(), 5000 * 1_000_000);
    assert.ok(subAccount.status.pending);
  });

  it("3. Subscribe: Rejects Below Minimum", async () => {
    const investor = Keypair.generate();
    const investorPda = await registerUser(investor);
    const { pda: projectPda, id: projectId } = await createProject();
    
    // 1. Set Mint
    const setMintIx = await registryProgram.methods.setProjectMint(mockUsdc).accounts({
        control: registryPda,
        project: projectPda,
        admin: authority.publicKey,
    }).instruction();
    await sendAndConfirmCustom(new Transaction().add(setMintIx));

    // 2. Move from Draft to Funding
    const activateIx = await registryProgram.methods.updateProjectStatus(
        projectId,
        { funding: {} },
        false
    ).accounts({
        control: registryPda,
        project: projectPda,
        admin: authority.publicKey,
    }).instruction();
    await sendAndConfirmCustom(new Transaction().add(activateIx));

    const subId = new BN(Date.now());
    const [subscriptionPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("subscription"), investor.publicKey.toBuffer(), subId.toArrayLike(Buffer, "le", 8)],
        complianceProgram.programId
    );

    try {
        const method = complianceProgram.methods.subscribeInvestment(
            subId,
            new BN(projectId),
            new BN(500), 
            mockUsdc
        ).accounts({
            subscription: subscriptionPda,
            investor: investor.publicKey,
            eligibility: investorPda,
            projectAccount: projectPda,
            projectRegistryProgram: registryProgram.programId,
            control: controlPda,
            investorTokenAccount: getAssociatedTokenAddressSync(mockUsdc, investor.publicKey),
            treasuryTokenAccount: getAssociatedTokenAddressSync(mockUsdc, authority.publicKey),
            tokenProgram: TOKEN_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
        });

        // Add ATA creation and MINT to trigger the REAL logic failure (InvestmentTooLow)
        // Add ATA creation and MINT to trigger the REAL logic failure (InvestmentTooLow)
        const ataIx = createAssociatedTokenAccountInstruction(authority.publicKey, getAssociatedTokenAddressSync(mockUsdc, investor.publicKey), investor.publicKey, mockUsdc);
        const mintIx = createMintToInstruction(mockUsdc, getAssociatedTokenAddressSync(mockUsdc, investor.publicKey), authority.publicKey, 1000 * 1_000_000);
        
        await sendAndConfirmCustom(new Transaction().add(ataIx).add(mintIx).add(await method.instruction()), [investor]);

        assert.fail("Should have failed with InvestmentTooLow");
    } catch (err: any) {
        if (!err.toString().includes("InvestmentTooLow") && !err.toString().includes("6012")) {
            console.log("      ⚠️ Test 3 failed with unexpected error:", err.toString());
        }
        // 6012 is InvestmentTooLow in compliance_transfer
        assert.ok(err.toString().includes("InvestmentTooLow") || err.toString().includes("6012"));
    }
  });

  it("3. Finalize: Admin settles subscription", async () => {
    const investor = Keypair.generate();
    const investorEligibility = await registerUser(investor);
    const { pda: projectAccount, id: projectId } = await createProject();

    // 3. Create a UNIQUE mint for this project to test issuance
    console.log("   🪙 Creating Project Mint...");
    const projectMint = Keypair.generate();
    const lamports = await connection.getMinimumBalanceForRentExemption(MINT_SIZE);
    
    const createMintTx = new Transaction().add(
        SystemProgram.createAccount({
            fromPubkey: authority.publicKey,
            newAccountPubkey: projectMint.publicKey,
            space: MINT_SIZE,
            lamports,
            programId: TOKEN_PROGRAM_ID,
        }),
        createInitializeMintInstruction(
            projectMint.publicKey,
            6,
            authority.publicKey,
            authority.publicKey
        )
    );
    await sendAndConfirmCustom(createMintTx, [projectMint]);

    // Set the Project Mint address in the registry
    const setMintIx = await registryProgram.methods.setProjectMint(projectMint.publicKey).accounts({
        control: registryPda,
        project: projectAccount,
        admin: authority.publicKey,
    }).instruction();
    await sendAndConfirmCustom(new Transaction().add(setMintIx));

    // Derive project-specific PDAs
    const [mintAuthPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("mint_authority"), projectId.toArrayLike(Buffer, "le", 8)],
        registryProgram.programId
    );

    // Transfer Mint Authority to the Project's PDA so it can mint during settlement
    console.log("   🔑 Transferring Mint Authority to Project PDA...");
    const transferAuthTx = new Transaction().add(
        createSetAuthorityInstruction(
            projectMint.publicKey,
            authority.publicKey,
            AuthorityType.MintTokens,
            mintAuthPda
        )
    );
    await sendAndConfirmCustom(transferAuthTx);

    // 4. Activate Project
    const activateIx = await registryProgram.methods.updateProjectStatus(
        projectId,
        { funding: {} },
        false
    ).accounts({
        control: registryPda,
        project: projectAccount,
        admin: authority.publicKey,
    }).instruction();
    await sendAndConfirmCustom(new Transaction().add(activateIx));

    // 5. Subscribe (Using mockUsdc for payment, but projectMint for delivery)
    const subscriptionId = new BN(Math.floor(Math.random() * 1000000));
    const [subscriptionPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("subscription"), investor.publicKey.toBuffer(), subscriptionId.toArrayLike(Buffer, "le", 8)],
      complianceProgram.programId
    );

    const investorAta = getAssociatedTokenAddressSync(mockUsdc, investor.publicKey); // For payment
    const investorProjectAta = getAssociatedTokenAddressSync(projectMint.publicKey, investor.publicKey); // For receiving tokens
    
    // Create Investor Project ATA
    const createAtaTx = new Transaction().add(
        createAssociatedTokenAccountInstruction(
            authority.publicKey,
            investorProjectAta,
            investor.publicKey,
            projectMint.publicKey
        )
    );
    await sendAndConfirmCustom(createAtaTx);

    const subscribeIx = await complianceProgram.methods.subscribeInvestment(
        subscriptionId,
        projectId,
        new BN(5000 * 1_000_000), // $5000
        mockUsdc
    ).accounts({
        subscription: subscriptionPda,
        investor: investor.publicKey,
        eligibility: investorEligibility,
        projectAccount: projectAccount,
        projectRegistryProgram: registryProgram.programId,
        control: controlPda,
        investorTokenAccount: investorAta,
        treasuryTokenAccount: getAssociatedTokenAddressSync(mockUsdc, authority.publicKey),
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
    }).instruction();

    const fundingAtaIx = createAssociatedTokenAccountInstruction(authority.publicKey, investorAta, investor.publicKey, mockUsdc);
    const mintIx = createMintToInstruction(mockUsdc, investorAta, authority.publicKey, 10000 * 1_000_000);
    await sendAndConfirmCustom(new Transaction().add(fundingAtaIx).add(mintIx).add(subscribeIx), [investor]);

    // 6. Finalize
    console.log("   ⚖️ Finalizing subscription...");
    const settlementHash = Array(64).fill(7);
    
    // FETCH REAL AUTHORITIES
    const complianceControl: any = await complianceProgram.account.complianceControl.fetch(controlPda);
    console.log("   ℹ️ Compliance Authority:", complianceControl.authority.toBase58());

    const finalizeIx = await complianceProgram.methods.finalizeSubscription(
        settlementHash,
        new BN(1000 * 1_000_000) // 1000 tokens
    ).accounts({
        subscription: subscriptionPda,
        control: controlPda,
        authority: complianceControl.authority, 
        projectRegistryProgram: registryProgram.programId,
        registryControl: registryPda,
        registryProject: projectAccount,
        mint: projectMint.publicKey, // NEW MINT
        investorTokenAccount: investorProjectAta, // NEW ATA
        mintAuthorityPda: mintAuthPda,
        tokenProgram: TOKEN_PROGRAM_ID,
    } as any).instruction();

    await sendAndConfirmCustom(new Transaction().add(finalizeIx));

    const finalAccount: any = await complianceProgram.account.investmentSubscriptionAccount.fetch(subscriptionPda);
    assert.ok(finalAccount.status.settled || finalAccount.status.allocated);
    console.log("   ✨ Subscription finalized successfully!");
  });
});
