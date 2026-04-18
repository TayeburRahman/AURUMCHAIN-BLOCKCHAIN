"use client";

import { useWalletConnection } from "@/hooks/useWalletConnection";
import { useAdminSecurity } from "@/context/AdminSecurityContext";
import { useWalletEligibility } from "@/hooks/useWalletEligibility";
import { useMemo } from "react";

/**
 * WalletStatusBadge
 * 
 * Displays the current role or verification status of the connected wallet.
 * Supports: Super Admin, Administrator, Verified, Restricted, Pending.
 */
export function WalletStatusBadge() {
  const { connected, publicKey } = useWalletConnection();
  const { isAuthorized, authorizedWalletAddress } = useAdminSecurity();
  const { eligibility, loading } = useWalletEligibility();

  const status = useMemo(() => {
    if (!connected || !publicKey) return null;

    // 1. Check for Super Admin (Defined in ENV or via IDL context)
    // For this implementation, we assume the authorized admin from the context 
    // is a "Super Admin" for UI purposes, or we can check a specific ENV.
    if (isAuthorized) {
      return {
        label: "Super Admin",
        className: "bg-gradient-to-r from-[#8b5cf6] to-[#d946ef] text-white border-none shadow-lg shadow-purple-500/20",
        icon: "👑"
      };
    }

    // 2. Check for Operational Admin (If we had a multi-admin setup)
    // (Placeholder logic if we add more admin roles later)

    if (loading) return { label: "Loading...", className: "bg-white/10 text-white/50 animate-pulse", icon: "⏳" };

    // 3. Regular Investor KYC Status
    if (eligibility) {
      if (eligibility.kycStatus === "Approved") {
        return {
          label: "Verified",
          className: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
          icon: "✓"
        };
      }
      if (eligibility.kycStatus === "Blocked" || eligibility.amlStatus === "Blocked") {
        return {
          label: "Restricted",
          className: "bg-red-500/20 text-red-400 border-red-500/30",
          icon: "⚠️"
        };
      }
    }

    return {
      label: "Pending",
      className: "bg-amber-500/20 text-amber-400 border-amber-500/30",
      icon: "🔍"
    };
  }, [connected, publicKey, isAuthorized, eligibility, loading]);

  if (!status) return null;

  return (
    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-tight border backdrop-blur-sm transition-all animate-in fade-in slide-in-from-top-1 duration-500 ${status.className}`}>
      <span>{status.icon}</span>
      <span>{status.label}</span>
    </div>
  );
}
