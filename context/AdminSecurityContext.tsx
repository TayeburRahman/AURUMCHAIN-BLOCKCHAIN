"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { createContext, useContext, useEffect, useState, ReactNode } from "react";

interface AdminSecurityContextType {
  isAuthorized: boolean | null;
  isVerified: boolean;
  authorizedWalletAddress: string | undefined;
  verifyAdmin: () => Promise<boolean>;
}

const AdminSecurityContext = createContext<AdminSecurityContextType | undefined>(undefined);

import bs58 from "bs58";
import nacl from "tweetnacl";

export function AdminSecurityProvider({ children }: { children: ReactNode }) {
  const { publicKey, connected, signMessage } = useWallet();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [isVerified, setIsVerified] = useState<boolean>(false);

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
      const match = walletAddress === AUTHORIZED_ADMIN_WALLET;
      setIsAuthorized(match);

      // Reset verification if wallet changes
      if (!match) {
        setIsVerified(false);
      } else {
        // Check if previously verified in this session
        const stored = sessionStorage.getItem(`admin_verified_${walletAddress}`);
        if (stored === 'true') {
          setIsVerified(true);
        }
      }
    } else {
      setIsAuthorized(false);
      setIsVerified(false);
    }
  }, [publicKey, connected, AUTHORIZED_ADMIN_WALLET]);

  const verifyAdmin = async (): Promise<boolean> => {
    if (!publicKey || !connected || !signMessage) return false;

    try {
      const address = publicKey.toBase58();
      
      // 1. Generate SECURE Cryptographic Nonce
      const nonceBuffer = new Uint8Array(16);
      window.crypto.getRandomValues(nonceBuffer);
      const nonce = bs58.encode(nonceBuffer);
      
      const domain = window.location.host;
      const uri = window.location.origin;
      const issuedAt = new Date().toISOString();
      
      // 2. Construct Standardized SIWS Message
      const message = `${domain} wants you to sign in with your Solana account:
${address}

Verify that you are the authorized platform administrator.

URI: ${uri}
Version: 1
Nonce: ${nonce}
Issued At: ${issuedAt}`;
      
      const messageBytes = new TextEncoder().encode(message);
      const signatureBytes = await signMessage(messageBytes);

      // 3. CRYPTOGRAPHIC VERIFICATION (Ed25519)
      // We verify the signature against the public key to prove possession
      const isValid = nacl.sign.detached.verify(
        messageBytes,
        signatureBytes,
        publicKey.toBytes()
      );

      if (isValid) {
        setIsVerified(true);
        sessionStorage.setItem(`admin_verified_${address}`, 'true');
        return true;
      } else {
        console.error("Signature verification failed: Invalid proof");
        return false;
      }
    } catch (error) {
      console.error("Admin verification process failed:", error);
      return false;
    }
  };

  return (
    <AdminSecurityContext.Provider 
      value={{ 
        isAuthorized, 
        isVerified,
        authorizedWalletAddress: AUTHORIZED_ADMIN_WALLET,
        verifyAdmin
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
