"use client";

import { useEffect, useState, useMemo } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { ProjectRegistryService } from '@/lib/web3/services/projectRegistryService';
import Link from 'next/link';

/**
 * AuthorityManagementPage
 * 
 * Provides a secure interface for high-privilege administrators to transfer
 * registry control (Super Admin and Operational Authority).
 */
export default function AuthorityManagementPage() {
  const { connection } = useConnection();
  const wallet = useWallet();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [currentConfig, setCurrentConfig] = useState<{ superAdmin: string; authority: string; projectCount: number } | null>(null);
  
  const [newSuperAdmin, setNewSuperAdmin] = useState('');
  const [newAuthority, setNewAuthority] = useState('');
  const [status, setStatus] = useState<{ type: 'success' | 'error' | 'info', msg: string } | null>(null);

  // Memoize service to prevent unnecessary re-initializations
  const service = useMemo(() => {
    if (!wallet.publicKey) return null;
    return new ProjectRegistryService(connection, wallet);
  }, [connection, wallet]);

  const fetchState = async () => {
    if (!service) return;
    try {
      setLoading(true);
      const config = await service.fetchRegistryConfig();
      setCurrentConfig({
        superAdmin: (config.superAdmin as PublicKey).toBase58(),
        authority: (config.authority as PublicKey).toBase58(),
        projectCount: (config.projectCount as BN).toNumber()
      });
    } catch (err: any) {
      console.error("Authority Page - Fetch Error:", err);
      setStatus({ 
        type: 'error', 
        msg: "Failed to fetch on-chain state. Ensure you are on the correct network and the program is initialized." 
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (service) {
      fetchState();
    } else {
      setLoading(false);
    }
  }, [service]);

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!service || !wallet.publicKey) return;

    try {
      setSubmitting(true);
      setStatus({ type: 'info', msg: "Preparing transaction and requesting signatures..." });

      const payload: { newSuperAdmin?: PublicKey; newAuthority?: PublicKey } = {};
      
      if (newSuperAdmin.trim()) {
        try {
          payload.newSuperAdmin = new PublicKey(newSuperAdmin.trim());
        } catch {
          throw new Error("Invalid Super Admin public key format.");
        }
      }

      if (newAuthority.trim()) {
        try {
          payload.newAuthority = new PublicKey(newAuthority.trim());
        } catch {
          throw new Error("Invalid Operational Authority public key format.");
        }
      }

      if (Object.keys(payload).length === 0) {
        throw new Error("Please provide at least one new address to transfer.");
      }

      const sig = await service.transferAuthority(payload);
      
      setStatus({ 
        type: 'success', 
        msg: `Authority successfully updated! Transaction signature: ${sig.slice(0, 12)}...` 
      });
      
      // Reset form and refresh on-chain state
      setNewSuperAdmin('');
      setNewAuthority('');
      fetchState();
    } catch (err: any) {
      console.error("Authority Transfer Failure:", err);
      setStatus({ 
        type: 'error', 
        msg: err.message || "An unexpected error occurred during the transfer." 
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A1628] pt-24 pb-12 px-6">
      <div className="max-w-4xl mx-auto">
        
        {/* Navigation Breadcrumb */}
        <div className="mb-8">
          <Link href="/admin" className="text-gold hover:text-white transition-colors flex items-center gap-2 mb-4 group">
            <span className="group-hover:-translate-x-1 transition-transform">←</span> Back to Admin Dashboard
          </Link>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-gold via-gold-light to-gold text-transparent bg-clip-text mb-2">
            Authority Management
          </h1>
          <p className="text-gray-400">
            Control the master administration and operational keys for the Aurumchain Project Registry.
          </p>
        </div>

        {/* Info Disclaimer */}
        <div className="mb-8 p-4 bg-gold/10 border border-gold/30 rounded-xl flex gap-4 items-start">
          <span className="text-2xl">🛡️</span>
          <div>
            <h4 className="text-gold font-bold mb-1 font-outfit uppercase tracking-wider text-xs">Security Protocol</h4>
            <p className="text-gray-300 text-sm">
              Transferring authority is a high-privilege action. Both the current Super Admin and Operational Authority 
              may be required to sign the transaction depending on your on-chain configuration.
            </p>
          </div>
        </div>

        {/* Current State Grid */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Card 1: Super Admin */}
          <div className="glass-morphism p-6 rounded-2xl border border-gold/20 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center mb-4">
                <span className="text-gold text-xs font-bold uppercase tracking-widest">Master Control</span>
                <span className="text-xl">👑</span>
              </div>
              <h3 className="text-white font-bold text-lg mb-2">Super Admin</h3>
              <p className="text-gray-400 text-xs mb-4">
                The master authority with full control over registry parameters and other admins.
              </p>
            </div>
            <div className={`font-mono text-sm break-all p-3 bg-black/30 rounded-lg border border-white/5 ${loading ? 'animate-pulse' : ''}`}>
              {loading ? "Decrypting..." : currentConfig?.superAdmin || "Not Initialized"}
            </div>
          </div>

          {/* Card 2: Operational Authority */}
          <div className="glass-morphism p-6 rounded-2xl border border-gold/20 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center mb-4">
                <span className="text-gold text-xs font-bold uppercase tracking-widest">Operation Control</span>
                <span className="text-xl">⚙️</span>
              </div>
              <h3 className="text-white font-bold text-lg mb-2">Operational Authority</h3>
              <p className="text-gray-400 text-xs mb-4">
                Responsible for daily project operations, status updates, and mint registrations.
              </p>
            </div>
            <div className={`font-mono text-sm break-all p-3 bg-black/30 rounded-lg border border-white/5 ${loading ? 'animate-pulse' : ''}`}>
              {loading ? "Decrypting..." : currentConfig?.authority || "Not Initialized"}
            </div>
          </div>
        </div>

        {/* Form Container */}
        <div className="glass-morphism p-8 rounded-3xl border border-gold/20 shadow-2xl">
          <div className="flex items-baseline gap-2 mb-8 border-b border-gold/10 pb-4">
            <h2 className="text-2xl font-bold text-white">Transfer Privileges</h2>
            <span className="text-gray-500 text-sm">Update one or both addresses</span>
          </div>
          
          <form onSubmit={handleTransfer} className="space-y-8">
            <div className="space-y-6">
              {/* Input 1: New Super Admin */}
              <div className="group">
                <label className="block text-gray-400 mb-2 text-xs font-bold uppercase tracking-widest group-focus-within:text-gold transition-colors">
                  Target Super Admin Address
                </label>
                <input 
                  type="text"
                  placeholder="Paste destination public key (Base58)"
                  className="w-full bg-[#0A1628]/80 border border-gold/20 rounded-xl p-4 text-white focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold/50 transition-all font-mono text-sm"
                  value={newSuperAdmin}
                  onChange={(e) => setNewSuperAdmin(e.target.value)}
                />
                <p className="text-white/30 text-[10px] mt-2 italic px-1">
                  Leave blank to retain current Master control.
                </p>
              </div>

              {/* Input 2: New Authority */}
              <div className="group">
                <label className="block text-gray-400 mb-2 text-xs font-bold uppercase tracking-widest group-focus-within:text-gold transition-colors">
                  Target Operational Authority
                </label>
                <input 
                  type="text"
                  placeholder="Paste destination public key (Base58)"
                  className="w-full bg-[#0A1628]/80 border border-gold/20 rounded-xl p-4 text-white focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold/50 transition-all font-mono text-sm"
                  value={newAuthority}
                  onChange={(e) => setNewAuthority(e.target.value)}
                />
                <p className="text-white/30 text-[10px] mt-2 italic px-1">
                  Leave blank to retain current Operational authority.
                </p>
              </div>
            </div>

            {/* Status Alert */}
            {status && (
              <div className={`flex items-center gap-3 p-4 rounded-xl border animate-in fade-in slide-in-from-top-2 duration-300 ${
                status.type === 'error' ? 'bg-red-500/10 text-red-400 border-red-500/30' :
                status.type === 'success' ? 'bg-green-500/10 text-green-400 border-green-500/30' :
                'bg-gold/10 text-gold border-gold/30'
              }`}>
                <span className="text-lg">
                  {status.type === 'error' ? '❌' : status.type === 'success' ? '✅' : '⏳'}
                </span>
                <p className="text-sm font-medium">{status.msg}</p>
              </div>
            )}

            {/* Action Button */}
            <button
              type="submit"
              disabled={submitting || !wallet.connected}
              className={`w-full py-5 rounded-2xl font-black text-lg uppercase tracking-widest transition-all transform active:scale-[0.98] ${
                submitting || !wallet.connected
                ? 'bg-white/5 text-white/20 cursor-not-allowed border border-white/10'
                : 'bg-gradient-to-r from-gold-dark via-gold to-gold-light text-navy shadow-[0_0_20px_rgba(212,175,55,0.2)] hover:shadow-[0_0_30px_rgba(212,175,55,0.4)] hover:-translate-y-0.5'
              }`}
            >
              {submitting ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-navy/30 border-t-navy animate-spin rounded-full"></div>
                  Finalizing Cycle...
                </div>
              ) : wallet.connected ? "Execute Transfer Cycle" : "Admin Wallet Required"}
            </button>
            
            <p className="text-center text-gray-500 text-[10px] leading-relaxed max-w-sm mx-auto">
              This is a sensitive blockchain operation. Please verify addresses twice. 
              Incorrect addresses can lead to permanent loss of administrative access.
            </p>
          </form>
        </div>

        {/* System Details Footer */}
        <div className="mt-12 pt-8 border-t border-white/5 flex flex-wrap justify-between gap-4">
          <div className="flex items-baseline gap-2">
            <span className="text-gray-500 text-xs font-bold uppercase tracking-widest">Registry ID</span>
            <span className="text-white/60 font-mono text-xs">PDA Derived</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-gray-500 text-xs font-bold uppercase tracking-widest">Active Projects</span>
            <span className="text-gold font-bold text-sm">{currentConfig?.projectCount || 0}</span>
          </div>
        </div>
      </div>

      <style jsx>{`
        .glass-morphism {
          background: rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
        }
        .gradient-text {
          background: linear-gradient(to right, #D4AF37, #F5E0A3, #B8860B);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }
      `}</style>
    </div>
  );
}
