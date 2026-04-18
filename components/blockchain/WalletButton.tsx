"use client";

import dynamic from "next/dynamic";
import { useWalletConnection } from "@/hooks/useWalletConnection";
import { useEffect, useState } from "react";

// Dynamically import the adapter button to avoid SSR hydration mismatches
const WalletMultiButton = dynamic(
  () => import("@solana/wallet-adapter-react-ui").then((mod) => mod.WalletMultiButton),
  { ssr: false }
);

interface WalletButtonProps {
  profileName?: string;
}

export function WalletButton({ profileName }: WalletButtonProps) {
  const { connected, balance, truncatedAddress, walletIcon } = useWalletConnection();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  if (!connected) {
    return (
      <WalletMultiButton className="!bg-gradient-to-r !from-gold !to-gold-light !text-navy !font-bold !rounded-lg !px-6 !h-10 !transition-all hover:!scale-105 hover:!shadow-lg hover:!shadow-gold/20 !text-sm" />
    );
  }

  return (
    <div className="flex items-center gap-3 bg-navy-dark/60 backdrop-blur-md border border-gold/20 p-1 pr-4 rounded-xl hover:border-gold/40 transition-all group shadow-lg">
      {/* Wallet Icon & Dropdown Trigger */}
      <div className="relative">
        <WalletMultiButton className="!bg-gold/10 !p-0 !h-10 !w-10 !min-w-0 !rounded-lg overflow-hidden flex items-center justify-center group-hover:bg-gold/20 transition-all border border-gold/10">
          {walletIcon ? (
            <img src={walletIcon} alt="wallet" className="w-6 h-6" />
          ) : (
            <span className="text-xl">👛</span>
          )}
        </WalletMultiButton>
      </div>

      {/* Unified Identity Stack */}
      <div className="flex flex-col items-start gap-0.5 pointer-events-none">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-bold text-white tracking-wide">
            {profileName || "Anonymous User"}
          </span>
          <div className="w-1 h-1 rounded-full bg-gold/50"></div>
          <span className="text-[10px] font-bold text-gold uppercase tracking-widest">
            {balance} SOL
          </span>
        </div>
        <span className="text-[10px] font-medium text-gray-400 font-mono">
          {truncatedAddress}
        </span>
      </div>
    </div>
  );
}
