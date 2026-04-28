import { PublicKey, Connection, Keypair } from "@solana/web3.js";
import anchor from "@coral-xyz/anchor";
const { BN, Program, AnchorProvider, Wallet } = anchor;
import * as dotenv from 'dotenv';
import fs from 'fs';
import bs58 from 'bs58';

dotenv.config();

async function checkProject() {
    const connection = new Connection("https://api.devnet.solana.com", "confirmed");
    const secretKeyString = process.env.WALLET_PRIVATE_KEY || "";
    const secretKey = bs58.decode(secretKeyString);
    const keypair = Keypair.fromSecretKey(secretKey);
    const wallet = new Wallet(keypair);
    const provider = new AnchorProvider(connection, wallet, {});
    
    const programId = new PublicKey("Dkrnk6B8MuiieXQzqhicbsPtGp7TY4HMZRNDJJFhu4R7");
    const idl = JSON.parse(fs.readFileSync('./programs/project_registry/src/idl.json', 'utf8'));
    const program = new Program(idl, programId, provider);

    const projectId = new BN(7);
    const [projectPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("project"), projectId.toArrayLike(Buffer, "le", 8)],
        programId
    );

    console.log("Fetching Project 7 PDA:", projectPda.toBase58());

    try {
        const account: any = await program.account.projectAccount.fetch(projectPda);
        const mintInfo = await connection.getParsedAccountInfo(account.mint);
        
        // Helper to format large numbers to standard strings
        const formatBN = (val: any) => {
            if (!val) return val;
            if (val.toString && typeof val.toString === 'function') {
                return val.toString(10); // Force Base-10 decimal
            }
            return val;
        };

        // Format dates
        const formatDate = (ts: any) => new Date(parseInt(ts.toString()) * 1000).toISOString();

        console.log("\n================ ACTUAL ON-CHAIN DATA (PROJECT 8) ================");
        console.log(`Project ID:            ${formatBN(account.projectId)}`);
        console.log(`Name:                  ${account.name}`);
        console.log(`Symbol:                ${account.symbol}`);
        console.log(`Asset Type:            ${Object.keys(account.assetType)[0]}`);

        console.log("\n--- Status & Lifecycle ---");
        console.log(`Phase Status:          ${Object.keys(account.status)[0].toUpperCase()}`);
        console.log(`Is Paused (Emergency): ${account.isPaused ? "YES 🔴" : "NO 🟢"}`);
        console.log(`Mint Auth Revoked:     ${account.mintAuthorityRevoked ? "YES 🔒" : "NO 🔓"}`);
        
        console.log("\n--- Token & Price Info ---");
        console.log(`Token Price (USDC):    ${formatBN(account.tokenPriceUsdc)} micro-USDC ($${parseInt(formatBN(account.tokenPriceUsdc)) / 1_000_000})`);
        console.log(`Stored Token Decimals: ${account.tokenDecimals}`);
        console.log(`Actual Mint Decimals:  ${(mintInfo.value?.data as any)?.parsed?.info?.decimals}`);
        console.log(`Supply Cap (Raw):      ${formatBN(account.supplyCap)}`);
        console.log(`Tokens Issued (Raw):   ${formatBN(account.tokensIssued)}`);
        
        console.log("\n--- Investment Thresholds ---");
        console.log(`Min Investment:        ${formatBN(account.minInvestmentUsdc)} micro-USDC`);
        console.log(`Max Investment:        ${formatBN(account.maxInvestmentUsdc)} micro-USDC`);
        
        console.log("\n--- Dates ---");
        console.log(`Created At:            ${formatDate(account.createdAt)}`);
        console.log(`Lockup End:            ${formatDate(account.lockupEndTs)}`);
        
        console.log("\n--- Addresses ---");
        console.log(`Mint Address:          ${account.mint.toBase58()}`);
        console.log(`Treasury Wallet:       ${account.treasuryWallet.toBase58()}`);
        console.log(`Accepted Stablecoin:   ${account.acceptedStablecoin.toBase58()}`);
        
    } catch (e) {
        console.error("Failed to fetch project account:", e);
    }
}

checkProject();
