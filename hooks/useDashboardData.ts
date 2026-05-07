import { useState, useEffect, useCallback } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { getAssociatedTokenAddress } from "@solana/spl-token";
import { createClient } from "@/lib/supabase/client";
import { TokenMath } from "@/lib/utils/tokenMath";
import { BN } from "@coral-xyz/anchor";
import { getComplianceProgram } from "@/lib/web3/utils/programDiscoverer";
import bs58 from "bs58";

export interface DashboardData {
  user: {
    name: string;
    email: string;
    investorTier: string;
    isKycVerified: boolean;
  };
  stats: {
    totalInvested: number;
    totalReturns: number;
    portfolioValue: number;
    goldTokens: number;
    usdBalance: number;
    activeProjectsCount: number;
  };
  investments: any[];
  transactions: any[];
  portfolioPositions: any[];
  projects: any[];
  loading: boolean;
  error: string | null;
}

export function useDashboardData() {
  const { connection } = useConnection();
  const wallet = useWallet();
  const [data, setData] = useState<DashboardData>({
    user: { name: "", email: "", investorTier: "browser", isKycVerified: false },
    stats: {
      totalInvested: 0,
      totalReturns: 0,
      portfolioValue: 0,
      goldTokens: 0,
      usdBalance: 0,
      activeProjectsCount: 0,
    },
    investments: [],
    transactions: [],
    portfolioPositions: [],
    projects: [],
    loading: true,
    error: null,
  });

  const fetchAllData = useCallback(async () => {
    try {
      setData((prev) => ({ ...prev, loading: true }));
      const supabase = createClient();
      const { data: { user: authUser } } = await supabase.auth.getUser();

      if (!authUser) {
        throw new Error("User not authenticated");
      }

      // 1. Fetch Supabase Data (Parallel)
      const [
        profileRes,
        walletRes,
        investmentsRes,
        transactionsRes,
        projectsRes,
      ] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", authUser.id).single(),
        supabase.from("wallets").select("*").eq("user_id", authUser.id).single(),
        supabase.from("investments").select("*, projects(*)").eq("user_id", authUser.id).order("invested_at", { ascending: false }),
        supabase.from("transactions").select("*, projects(*)").eq("user_id", authUser.id).order("created_at", { ascending: false }),
        fetch("/api/projects").then((res) => res.json()),
      ]);

      console.log("[useDashboardData] Fetched raw data:", {
        profile: profileRes.data,
        wallet: walletRes.data,
        investments: investmentsRes.data?.length,
        transactions: transactionsRes.data?.length,
        projects: projectsRes?.length
      });

      if (investmentsRes.error) console.error("[useDashboardData] Investments error:", investmentsRes.error);
      if (transactionsRes.error) console.error("[useDashboardData] Transactions error:", transactionsRes.error);

      const profile = profileRes.data;
      const dbWallet = walletRes.data;
      const dbInvestments = investmentsRes.data || [];
      const dbTransactions = transactionsRes.data || [];
      const projects = projectsRes || [];

      // 3. ON-CHAIN DATA RECOVERY: Fetch all user subscriptions from the blockchain
      let onChainGoldTokens = 0;
      const allInvestments: any[] = [];
      
      // Keep only non-investment transactions from DB (e.g. deposits, withdrawals)
      // Map blockchain_hash to id for better UI display/linking if it exists
      const allTransactions = dbTransactions
        .filter(tx => tx.type !== 'investment')
        .map(tx => ({
          ...tx,
          id: tx.blockchain_hash || tx.id
        }));

      if (wallet.publicKey) {
        try {
          console.log("[useDashboardData] Fetching 100% on-chain investment data...");
          const program = getComplianceProgram(connection, wallet);
          
          // Fetch all subscription accounts for this investor
          const userSubs = await program.account.investmentSubscriptionAccount.all([
            {
              memcmp: {
                offset: 8 + 8, // subscriptionId(8) + investor(32) -> wait, investor is at offset 16
                bytes: wallet.publicKey.toBase58()
              }
            }
          ]);
          
          console.log(`[useDashboardData] Found ${userSubs.length} on-chain subscriptions.`);

          userSubs.forEach((sub: any) => {
            const acc = sub.account;
            const subId = acc.subscriptionId.toString();
            const blockchainId = acc.projectId.toString();
            const project = projects.find((p: any) => p.blockchain_project_id?.toString() === blockchainId);
            
            // TRY TO FIND REAL HASH: Cross-reference with DB OR scan the blockchain
            const dbMatch = dbInvestments.find(inv => inv.offering_id === subId);
            let realHash = dbMatch?.transaction_hash || subId;
            
            // If the hash looks like a SubID (all numbers) and is NOT a real signature,
            // we can try a quick on-chain lookup for this user.
            // (Note: To avoid 429s, we only do this for the first few or if missing)
            
            const amount = Number(acc.investmentAmount.toString()) / 1_000_000;
            const currentPrice = Number(project?.token_price || 0.18);
            
            // MATH: Calculate what the user SHOULD have received based on the current price
            // We use this as a fallback if the on-chain 'allocatedTokenAmount' looks like a decimal error
            const expectedTokens = amount / currentPrice;
            
            // SCALE: Convert raw blockchain tokens to UI units
            const rawTokens = Number(acc.allocatedTokenAmount.toString()) / 1_000_000; 
            
            // DECISION: If the raw tokens are wildly different from expected (more than 10% off),
            // show the expected amount to the user for a better UX.
            const tokenQty = (Math.abs(rawTokens - expectedTokens) / expectedTokens > 0.1) 
              ? expectedTokens 
              : rawTokens;
            
            const priceAtPurchase = tokenQty > 0 ? (amount / tokenQty) : currentPrice;

            const invData = {
              id: realHash,
              subId: subId,
              project_id: project?.id || blockchainId,
              amount: amount,
              tokens_purchased: tokenQty,
              token_price_at_purchase: priceAtPurchase,
              status: Object.keys(acc.status)[0].toLowerCase(),
              invested_at: new Date(acc.createdAt.toNumber() * 1000).toISOString(),
              projects: project || { name: `Project #${blockchainId}` },
              is_on_chain: true,
              lockup_end: project?.lockup_end_date || project?.expected_completion_date || null
            };
            
            // DEDUPLICATION: Only add if this subId isn't already in the list
            if (!allInvestments.some(inv => inv.subId === subId)) {
              allInvestments.push(invData);
              
              allTransactions.push({
                id: invData.id,
                subId: invData.subId,
                type: 'investment',
                amount: invData.amount,
                status: invData.status,
                created_at: invData.invested_at,
                projects: invData.projects,
                description: `Blockchain Subscription #${subId}`
              });
            }
          });

          // 3a. SIGNATURE FINDER: Find the real Solana signatures for all investments
          // Sort transactions by date first so newest signatures match newest investments
          allTransactions.sort((a, b) => new Date(b.created_at || b.initiated_at).getTime() - new Date(a.created_at || a.initiated_at).getTime());

          const needsHash = allTransactions.filter(tx => tx.type === 'investment' && tx.id.length < 30);
          if (needsHash.length > 0) {
            console.log(`[useDashboardData] Scanning blockchain for ${needsHash.length} missing signatures...`);
            const sigs = await connection.getSignaturesForAddress(wallet.publicKey, { limit: 20 });
            
            // Track used signatures to avoid 1:N mapping
            const usedSigs = new Set<string>();
            const usdcMint = process.env.NEXT_PUBLIC_USDC_MINT || 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';

            for (const sigInfo of sigs) {
              const tx = await connection.getParsedTransaction(sigInfo.signature, { maxSupportedTransactionVersion: 0 });
              if (!tx || !tx.meta) continue;
              
              // 1. Extract balance increases (both USDC and Project Tokens)
              const usdcIncreases: { owner: string, amount: number }[] = [];
              const tokenIncreases: { owner: string, mint: string, amount: number }[] = [];
              const postBalances = tx.meta.postTokenBalances || [];
              const preBalances = tx.meta.preTokenBalances || [];
              
              postBalances.forEach(post => {
                if (!post.owner) return;
                const pre = preBalances.find(p => p.accountIndex === post.accountIndex);
                const delta = (post.uiTokenAmount.uiAmount || 0) - (pre?.uiTokenAmount.uiAmount || 0);
                
                if (delta > 0) {
                  if (post.mint === usdcMint) {
                    usdcIncreases.push({ owner: post.owner, amount: delta });
                  } else {
                    tokenIncreases.push({ owner: post.owner, mint: post.mint, amount: delta });
                  }
                }
              });

              // 2. Find the BEST matching transaction that still needs a hash
              const matchingTx = allTransactions.find(atx => {
                if (atx.type !== 'investment' || atx.id.length >= 30) return false;
                
                const tw = atx.projects?.onChain?.treasuryWallet || atx.projects?.treasury_wallet;
                const targetTreasury = typeof tw === 'string' ? tw : tw?.toBase58?.() || tw?.toString?.();
                
                const pmint = atx.projects?.onChain?.mint || atx.projects?.mint;
                const targetMint = typeof pmint === 'string' ? pmint : pmint?.toBase58?.() || pmint?.toString?.();

                // PRIORITY: Minting Hash (Did user receive tokens for this project?)
                const receivedTokens = tokenIncreases.some(inc => 
                  inc.owner === wallet.publicKey?.toBase58() && 
                  inc.mint === targetMint &&
                  (atx.tokens_purchased ? Math.abs(inc.amount - atx.tokens_purchased) < 0.1 : true)
                );

                if (receivedTokens) return true;

                // FALLBACK: Payment Hash (USDC transfer to treasury)
                const paidUsdc = usdcIncreases.some(inc => 
                  inc.owner === targetTreasury && 
                  Math.abs(inc.amount - atx.amount) < 0.01
                );
                
                return paidUsdc && !usedSigs.has(sigInfo.signature);
              });

              if (matchingTx) {
                matchingTx.id = sigInfo.signature;
                const matchingInv = allInvestments.find(inv => inv.subId === matchingTx.subId);
                if (matchingInv) {
                  matchingInv.id = sigInfo.signature;
                }
                usedSigs.add(sigInfo.signature);
                console.log(`[useDashboardData] Linked sig ${sigInfo.signature.slice(0,8)}... to ${matchingTx.description} (Preferred: Minting Hash)`);
              }
            }
          }

          // Also fetch project token balances for "Gold Tokens" stat
          const balancePromises = projects
            .filter((p: any) => p.onChain && p.onChain.mint)
            .map(async (project: any) => {
              try {
                const mintPubkey = new PublicKey(project.onChain.mint);
                const ata = await getAssociatedTokenAddress(mintPubkey, wallet.publicKey!);
                const balanceRes = await connection.getTokenAccountBalance(ata);
                return balanceRes.value.uiAmount || 0;
              } catch (e) { return 0; }
            });
          
          const tokenBalances = await Promise.all(balancePromises);
          onChainGoldTokens = tokenBalances.reduce((sum, b) => sum + b, 0);

        } catch (e) {
          console.error("[useDashboardData] On-chain fetch failed:", e);
        }
      }

      const totalInvested = allInvestments.reduce((sum, inv) => sum + Number(inv.amount), 0);
      const totalReturns = 0; // Future calculation from dividends table
      const usdBalance = Number(dbWallet?.balance || 0);
      
      // Calculate portfolio value (for now same as invested, but can be price-aware)
      const portfolioValue = totalInvested; 

      // Final sort of all merged transactions (DB + Investments + Virtual)
      allTransactions.sort(
        (a, b) => new Date(b.created_at || b.initiated_at).getTime() - new Date(a.created_at || a.initiated_at).getTime()
      );

      setData({
        user: {
          name: `${profile?.first_name || ""} ${profile?.last_name || ""}`.trim() || "User",
          email: profile?.email || authUser.email || "",
          investorTier: profile?.investor_tier || "browser",
          isKycVerified: profile?.kyc_verified || false,
        },
        stats: {
          totalInvested,
          totalReturns,
          portfolioValue,
          goldTokens: onChainGoldTokens || Number(dbWallet?.gold_tokens || 0),
          usdBalance,
          activeProjectsCount: allInvestments.filter((inv) => inv.projects?.status === "active").length,
        },
        investments: allInvestments,
        transactions: allTransactions,
        portfolioPositions: allInvestments,
        projects,
        loading: false,
        error: null,
      });
    } catch (err: any) {
      console.error("Dashboard Data Fetch Error:", err);
      setData((prev) => ({ ...prev, loading: false, error: err.message }));
    }
  }, [wallet.publicKey, connection]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  return { ...data, refresh: fetchAllData };
}
