import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { PublicKey, SystemProgram, Keypair } from "@solana/web3.js";
import assert from "assert";
import { BN } from "bn.js";

describe("subscription_lifecycle", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  // @ts-ignore
  const complianceProgram = anchor.workspace.ComplianceTransfer as Program<any>;
  // @ts-ignore
  const registryProgram = anchor.workspace.ProjectRegistry as Program<any>;
  
  const authority = provider.wallet;

  const [controlPda] = PublicKey.findProgramAddressSync([Buffer.from("compliance_control")], complianceProgram.programId);
  const [registryPda] = PublicKey.findProgramAddressSync([Buffer.from("control")], registryProgram.programId);

  // Helpers
  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  async function registerUser(user: Keypair) {
    const [pda] = PublicKey.findProgramAddressSync(
      [Buffer.from("eligibility"), user.publicKey.toBuffer()],
      complianceProgram.programId
    );
    await complianceProgram.methods.recordVerifiedWallet({
        kycStatus: { approved: {} },
        amlStatus: { clear: {} },
        identityHash: Array(32).fill(1),
        investmentAllowed: true,
        transferAllowed: true,
        expiryTimestamp: new BN(Math.floor(Date.now() / 1000) + 864000),
    }).accounts({
        eligibility: pda,
        wallet: user.publicKey,
        control: controlPda,
        authority: authority.publicKey,
        systemProgram: SystemProgram.programId,
    }).rpc();
    return pda;
  }

  async function createProject(id: number) {
    const [projectPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("project"), new BN(id).toArrayLike(Buffer, "le", 8)],
        registryProgram.programId
    );
    
    await registryProgram.methods.createProject({
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
    }).rpc();
    return projectPda;
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
        await complianceProgram.methods.initializeCompliance(authority.publicKey, authority.publicKey, registryProgram.programId).accounts({
            control: controlPda,
            payer: authority.publicKey,
            systemProgram: SystemProgram.programId,
        }).rpc();
    } catch(e) {}
  });

  it("2. Subscribe: Success Path", async () => {
    const investor = Keypair.generate();
    const investorPda = await registerUser(investor);
    const projectId = 0; // First project
    const projectPda = await createProject(projectId);
    
    const subId = new BN(Date.now());
    const [subPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("subscription"), investor.publicKey.toBuffer(), subId.toArrayLike(Buffer, "le", 8)],
        complianceProgram.programId
    );

    await complianceProgram.methods.subscribeInvestment(
        subId,
        new BN(projectId),
        new BN(5000), // Within 1000-10000 range
        PublicKey.unique()
    ).accounts({
        subscription: subPda,
        investor: investor.publicKey,
        eligibility: investorPda,
        projectAccount: projectPda,
        projectRegistryProgram: registryProgram.programId,
        control: controlPda,
        systemProgram: SystemProgram.programId,
    }).signers([investor]).rpc();

    const subAccount = await complianceProgram.account.investmentSubscriptionAccount.fetch(subPda);
    assert.strictEqual(subAccount.investmentAmount.toNumber(), 5000);
    assert.ok(subAccount.status.pending);
  });

  it("3. Subscribe: Rejects Below Minimum", async () => {
    const investor = Keypair.generate();
    const investorPda = await registerUser(investor);
    const projectId = 1;
    const projectPda = await createProject(projectId);
    
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

  it("4. Finalize: Admin settles subscription", async () => {
     // Prepare original sub
     const investor = Keypair.generate();
     const investorPda = await registerUser(investor);
     const projectId = 2;
     const projectPda = await createProject(projectId);
     const subId = new BN(Date.now());
     const [subPda] = PublicKey.findProgramAddressSync(
         [Buffer.from("subscription"), investor.publicKey.toBuffer(), subId.toArrayLike(Buffer, "le", 8)],
         complianceProgram.programId
     );

     await complianceProgram.methods.subscribeInvestment(subId, new BN(projectId), new BN(2000), PublicKey.unique()).accounts({
         subscription: subPda,
         investor: investor.publicKey,
         eligibility: investorPda,
         projectAccount: projectPda,
         projectRegistryProgram: registryProgram.programId,
         control: controlPda,
         systemProgram: SystemProgram.programId,
     }).signers([investor]).rpc();

     const txHash = Array(64).fill(7);
     await complianceProgram.methods.finalizeSubscription(txHash, new BN(100)).accounts({
         subscription: subPda,
         control: controlPda,
         authority: authority.publicKey,
     }).rpc();

     const subAccount = await complianceProgram.account.investmentSubscriptionAccount.fetch(subPda);
     assert.ok(subAccount.status.allocated);
     assert.strictEqual(subAccount.allocatedTokenAmount.toNumber(), 100);
  });
});
