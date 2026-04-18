"use client";

import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { useEffect, useState, useMemo } from "react";

/**
 * useWalletConnection
 * 
 * Abstraction hook for @solana/wallet-adapter-react.
 * Provides public key, connection status, balance (in SOL), and truncation.
 */
export function useWalletConnection() {
  const { connection } = useConnection();
  const { publicKey, connected, disconnecting, wallet } = useWallet();
  const [balance, setBalance] = useState<number>(0);

  // Fetch balance when wallet connects
  useEffect(() => {
    const fetchBalance = async () => {
      if (publicKey && connected) {
        try {
          const bal = await connection.getBalance(publicKey, 'confirmed');
          setBalance(bal / LAMPORTS_PER_SOL);
        } catch (error) {
          console.warn("SOL Balance fetch skipped (RPC temporarily unavailable)");
          setBalance(0);
        }
      } else {
        setBalance(0);
      }
    };

    fetchBalance();

    // Re-fetch occasionally or on focus (Optional, but simple is better for WS fix)
    const interval = setInterval(fetchBalance, 60000); // 60s poll
    return () => clearInterval(interval);
  }, [publicKey, connection, connected]);

  // Truncate address for UI
  const truncatedAddress = useMemo(() => {
    if (!publicKey) return "";
    const base58 = publicKey.toBase58();
    return `${base58.slice(0, 4)}...${base58.slice(-4)}`;
  }, [publicKey]);

  return {
    publicKey,
    connected,
    disconnecting,
    balance: balance.toFixed(3),
    truncatedAddress,
    walletName: wallet?.adapter.name || "Wallet",
    walletIcon: wallet?.adapter.icon || ""
  };
}
