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

    if (loading) return { label: "Loading...", className: "bg-white/10 text-white/50 animate-pulse", icon: "⏳", tooltip: "Fetching on-chain eligibility..." };

    // 3. Regular Investor KYC Status
    if (eligibility) {
      // Handle both Anchor Object enums and numeric representation
      const isKycApproved = eligibility.kycStatus?.approved || eligibility.kycStatus === 1;
      const isAmlBlocked = eligibility.amlStatus?.blocked || eligibility.amlStatus === 2;
      const isKycExpired = eligibility.expiryTimestamp && eligibility.expiryTimestamp.toNumber() < Date.now() / 1000;

      if (isKycApproved && !isKycExpired) {
        return {
          label: "Verified",
          className: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
          icon: "✓",
          tooltip: "Account fully verified for investment."
        };
      }

      if (isAmlBlocked) {
        return {
          label: "Restricted",
          className: "bg-red-500/20 text-red-400 border-red-500/30",
          icon: "⚠️",
          tooltip: "Access restricted due to AML/Sanction flags."
        };
      }

      if (isKycExpired) {
        return {
          label: "Expired",
          className: "bg-amber-500/20 text-amber-400 border-amber-500/30",
          icon: "⌛",
          tooltip: "KYC verification has expired. Please re-verify."
        };
      }
    }

    return {
      label: "Pending",
      className: "bg-amber-500/20 text-amber-400 border-amber-500/30",
      icon: "🔍",
      tooltip: "Verification in progress or record not found."
    };
  }, [connected, publicKey, isAuthorized, eligibility, loading]);

  if (!status) return null;

  return (
    <div 
      title={status.tooltip}
      className={`group relative flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-tight border backdrop-blur-sm transition-all animate-in fade-in slide-in-from-top-1 duration-500 cursor-help ${status.className}`}
    >
      <span>{status.icon}</span>
      <span>{status.label}</span>
      
      {/* Tooltip implementation */}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-navy-dark text-white text-[9px] rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none border border-gold/20 shadow-xl z-50">
        {status.tooltip}
        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-navy-dark"></div>
      </div>
    </div>
  );
}
