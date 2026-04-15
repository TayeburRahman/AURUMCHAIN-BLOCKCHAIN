"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import dynamic from "next/dynamic";
import { ReactNode, useEffect, useState } from "react";

const WalletMultiButton = dynamic(
  () => import("@solana/wallet-adapter-react-ui").then((mod) => mod.WalletMultiButton),
  { ssr: false }
);

interface AdminGuardProps {
  children: ReactNode;
}

export default function AdminGuard({ children }: AdminGuardProps) {
  const { publicKey, connected } = useWallet();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  const AUTHORIZED_ADMIN_WALLET = process.env.NEXT_PUBLIC_ADMIN_WALLET;

  useEffect(() => {
    if (!connected) {
      setIsAuthorized(false);
      return;
    }

    if (publicKey && AUTHORIZED_ADMIN_WALLET) {
      const walletAddress = publicKey.toBase58();
      setIsAuthorized(walletAddress === AUTHORIZED_ADMIN_WALLET);
    } else {
      setIsAuthorized(false);
    }
  }, [publicKey, connected, AUTHORIZED_ADMIN_WALLET]);

  // Loading state
  if (isAuthorized === null) {
    return (
      <div className="min-h-screen bg-navy flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-gold/20 border-t-gold rounded-full animate-spin"></div>
          <p className="text-gold font-medium animate-pulse">Verifying Admin Credentials...</p>
        </div>
      </div>
    );
  }

  // Unauthorized state
  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-navy flex items-center justify-center px-6">
        <div className="max-w-md w-full glass rounded-2xl p-8 border border-red-500/30 text-center relative overflow-hidden">
          {/* Background Decoration */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-red-500/10 rounded-full blur-3xl opacity-50"></div>
          
          <div className="mb-6 relative">
            <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto border border-red-500/40">
              <span className="text-4xl text-red-500">🔒</span>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-white mb-2">Restricted Access</h2>
          <p className="text-gray-400 mb-8">
            Only the program deployer wallet can access the administrative features of this platform.
          </p>

          <div className="space-y-4">
            <div className="flex flex-col items-center gap-4">
              <WalletMultiButton className="!bg-red-600 hover:!bg-red-700 !transition-colors" />
              <p className="text-xs text-gray-500">
                Please connect the authorized administrator wallet to proceed.
              </p>
            </div>
            
            <a 
              href="/dashboard"
              className="mt-6 inline-block text-sm text-gray-400 hover:text-white transition-colors underline underline-offset-4"
            >
              Back to User Dashboard
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Authorized
  return <>{children}</>;
}
