import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { PublicKey, SystemProgram, Keypair } from "@solana/web3.js";
import assert from "assert";

describe("compliance_final_verification", () => {
  const provider = anchor.AnchorProvider.env();
  provider.opts.preflightCommitment = "confirmed";
  provider.opts.commitment = "confirmed";
  anchor.setProvider(provider);

  // @ts-ignore
  const program = anchor.workspace.ComplianceTransfer as Program<any>;
  const authority = provider.wallet;

  // Derive the global control PDA
  const [controlPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("compliance_control")],
    program.programId
  );

  // Unique Hash system with entropy + timestamp to prevent signature collisions
  const getUniqueHash = () => {
     const hash = Array(32).fill(0).map(() => Math.floor(Math.random() * 255));
     const now = Date.now();
     // Inject timestamp bytes into hash
     hash[0] = now & 0xff;
     hash[1] = (now >> 8) & 0xff;
     hash[2] = (now >> 16) & 0xff;
     return hash;
  };

  /**
   * Helper to register a wallet so the transfer_validate checks don't crash
   */
  async function registerUser(user: Keypair) {
    const [pda] = PublicKey.findProgramAddressSync([Buffer.from("eligibility"), user.publicKey.toBuffer()], program.programId);
    
    // Slight delay to prevent Devnet 429 and signature collisions
    await new Promise(r => setTimeout(r, 800));

    await program.methods
      .recordVerifiedWallet({
        kycStatus: { approved: {} },
        amlStatus: { clear: {} },
        identityHash: getUniqueHash(),
        investmentAllowed: true,
        transferAllowed: true,
        expiryTimestamp: new anchor.BN(Math.floor(Date.now() / 1000) + 864000),
      })
      .accounts({
        eligibility: pda,
        wallet: user.publicKey,
        control: controlPda,
        authority: authority.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();
    return pda;
  }

  it("1. Setup: Initialize Compliance (Silent if exists)", async () => {
    try {
      await program.methods
        .initializeCompliance(authority.publicKey, authority.publicKey, PublicKey.default)
        .accounts({
          control: controlPda,
          payer: authority.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
      console.log("   ✅ Intelligence: Compliance Control Initialized");
    } catch (err) {
      console.log("   ℹ️ Intelligence: Control account already exists");
    }
  });

  describe("transfer_validate_gate (AC-BC-202)", () => {
    
    it("2. Transfer: Allowed Case (0x00)", async () => {
      console.log("   🚀 Registering test participants...");
      const sender = Keypair.generate();
      const receiver = Keypair.generate();
      const senderPda = await registerUser(sender);
      const receiverPda = await registerUser(receiver);

      console.log("   🧪 Simulating transfer_validate...");
      const decision = await program.methods
        .transferValidate(new anchor.BN(101), new anchor.BN(500), false, new anchor.BN(0))
        .accounts({
          control: controlPda,
          senderEligibility: senderPda,
          receiverEligibility: receiverPda,
          caller: authority.publicKey,
        })
        .view(); // Uses Simulation Mode

      console.log(`   📊 Result: Allowed=${decision.allowed}, Reason=${decision.reasonCode}`);
      assert.strictEqual(decision.allowed, true, "Should be allowed");
      assert.strictEqual(decision.reasonCode, 0, "Reason code should be 0");
    });

    it("3. Transfer: Rejects Global Pause (0x05)", async () => {
        // Toggle Global Pause ON
        await program.methods.setGlobalTransferPause(true).accounts({ control: controlPda, authority: authority.publicKey }).rpc();
        console.log("   ⏸ Global Pause activated");

        const sender = Keypair.generate();
        const receiver = Keypair.generate();
        const senderPda = await registerUser(sender);
        const receiverPda = await registerUser(receiver);

        const decision = await program.methods
          .transferValidate(new anchor.BN(101), new anchor.BN(500), false, new anchor.BN(0))
          .accounts({
            control: controlPda,
            senderEligibility: senderPda,
            receiverEligibility: receiverPda,
            caller: authority.publicKey,
          })
          .view();

        assert.strictEqual(decision.allowed, false, "Should be blocked by Global Pause");
        assert.strictEqual(decision.reasonCode, 5, "Reason code should be 0x05");

        // RESET Global Pause to OFF
        await program.methods.setGlobalTransferPause(false).accounts({ control: controlPda, authority: authority.publicKey }).rpc();
        console.log("   ▶ Global Pause deactivated");
    });

    it("4. Transfer: Rejects Lock-up Active (0x03)", async () => {
        // Lockup in year 2030
        const futureLockup = new anchor.BN(1893456000); 
        const sender = Keypair.generate();
        const receiver = Keypair.generate();
        const senderPda = await registerUser(sender);
        const receiverPda = await registerUser(receiver);

        const decision = await program.methods
          .transferValidate(new anchor.BN(101), new anchor.BN(500), false, futureLockup)
          .accounts({
            control: controlPda,
            senderEligibility: senderPda,
            receiverEligibility: receiverPda,
            caller: authority.publicKey,
          })
          .view();

        assert.strictEqual(decision.allowed, false, "Should be blocked by Lock-up");
        assert.strictEqual(decision.reasonCode, 3, "Reason code should be 0x03");
    });

    it("5. Security: Unauthorized Caller Check", async () => {
      const mallory = Keypair.generate();
      const sender = Keypair.generate();
      const receiver = Keypair.generate();
      const senderPda = await registerUser(sender);
      const receiverPda = await registerUser(receiver);

      console.log("   🔐 Checking security boundary...");
      let caught = false;
      try {
        await program.methods
          .transferValidate(new anchor.BN(101), new anchor.BN(500), false, new anchor.BN(0))
          .accounts({
            control: controlPda,
            senderEligibility: senderPda,
            receiverEligibility: receiverPda,
            caller: mallory.publicKey,
          })
          .signers([mallory])
          .rpc(); // Use rpc() here to force signature verification
      } catch (err) {
        caught = true;
        const msg = err.toString();
        assert.ok(msg.includes("Unauthorized") || msg.includes("1770") || msg.includes("6000"));
      }
      assert.ok(caught, "Security Breach: Unauthorized caller was not rejected!");
    });
  });
});
