"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { createContext, useContext, useEffect, useState, ReactNode } from "react";

interface AdminSecurityContextType {
  isAuthorized: boolean | null;
  authorizedWalletAddress: string | undefined;
}

const AdminSecurityContext = createContext<AdminSecurityContextType | undefined>(undefined);

export function AdminSecurityProvider({ children }: { children: ReactNode }) {
  const { publicKey, connected } = useWallet();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  const AUTHORIZED_ADMIN_WALLET = process.env.NEXT_PUBLIC_ADMIN_WALLET;

  useEffect(() => {
    // If wallet is not connected, user is definitely not authorized
    if (!connected) {
      setIsAuthorized(false);
      return;
    }

    // If wallet is connected, verify address
    if (publicKey && AUTHORIZED_ADMIN_WALLET) {
      const walletAddress = publicKey.toBase58();
      setIsAuthorized(walletAddress === AUTHORIZED_ADMIN_WALLET);
    } else {
      // Wallet connected but address not available or env not set
      setIsAuthorized(false);
    }
  }, [publicKey, connected, AUTHORIZED_ADMIN_WALLET]);

  return (
    <AdminSecurityContext.Provider 
      value={{ 
        isAuthorized, 
        authorizedWalletAddress: AUTHORIZED_ADMIN_WALLET 
      }}
    >
      {children}
    </AdminSecurityContext.Provider>
  );
}

export function useAdminSecurity() {
  const context = useContext(AdminSecurityContext);
  if (context === undefined) {
    throw new Error("useAdminSecurity must be used within an AdminSecurityProvider");
  }
  return context;
}
