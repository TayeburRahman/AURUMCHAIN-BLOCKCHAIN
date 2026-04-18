"use client";

import { useEffect, useState, useMemo } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { BN } from '@coral-xyz/anchor';
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
  
  const [newSuperAdmin, setNewSuperAdmin] = useState('');
  const [newAuthority, setNewAuthority] = useState('');
  const [isUninitialized, setIsUninitialized] = useState(false);
  const [operationalLimits, setOperationalLimits] = useState('1000000'); 
  const [status, setStatus] = useState<{ type: 'success' | 'error' | 'info', msg: string } | null>(null);
  const [currentConfig, setCurrentConfig] = useState<{ 
    superAdmin: string; 
    authority: string; 
    projectCount: number;
    isEmergencyPaused: boolean;
  } | null>(null);

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
        authority: (config.operationalAdmin as PublicKey).toBase58(),
        projectCount: (config.projectCount as BN).toNumber(),
        isEmergencyPaused: config.isEmergencyPaused as boolean
      });
      setIsUninitialized(false);
    } catch (err: any) {
      if (err.message === "NOT_INITIALIZED") {
        setIsUninitialized(true);
        setStatus(null);
      } else {
        console.error("Authority Page - Fetch Error:", err);
        setStatus({ 
          type: 'error', 
          msg: "Failed to fetch on-chain state. Ensure you are on the correct network." 
        });
      }
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

  /**
   * First-time setup for the Project Registry
   */
  const handleInitialize = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!service || !wallet.publicKey) return;

    try {
      setSubmitting(true);
      setStatus({ type: 'info', msg: "Initializing Control Account on Devnet..." });

      let opAdmin: PublicKey;
      try {
        opAdmin = new PublicKey(newAuthority.trim());
      } catch {
        throw new Error("Invalid Operational Admin address format.");
      }

      const sig = await service.initializeControl({
        operationalAdmin: opAdmin,
        operationalLimits: parseFloat(operationalLimits)
      });

      setStatus({ 
        type: 'success', 
        msg: `Registry initialized! Cycle complete: ${sig.slice(0, 12)}...` 
      });
      fetchState();
    } catch (err: any) {
      setStatus({ type: 'error', msg: err.message || "Initialization failed." });
    } finally {
      setSubmitting(false);
    }
  };

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!service || !wallet.publicKey) return;

    try {
      setSubmitting(true);
      setStatus({ type: 'info', msg: "Preparing dual-signature transaction..." });

      // Identify which role we're updating
      let roleFlag = -1;
      let newAdminKey = "";

      if (newSuperAdmin.trim()) {
        roleFlag = 1; // Upgrade Authority (Super Admin field is immutable in this logic)
        newAdminKey = newSuperAdmin.trim();
      } else if (newAuthority.trim()) {
        roleFlag = 0; // Operational Admin
        newAdminKey = newAuthority.trim();
      }

      if (roleFlag === -1) {
        throw new Error("Please provide a new address for Operational Admin or Upgrade Authority.");
      }

      let targetKey: PublicKey;
      try {
        targetKey = new PublicKey(newAdminKey);
      } catch {
        throw new Error("Invalid public key format.");
      }

      const sig = await service.transferAuthority({
        roleFlag,
        newAdmin: targetKey
      });
      
      setStatus({ 
        type: 'success', 
        msg: `Authority successfully updated! Signature: ${sig.slice(0, 12)}...` 
      });
      
      setNewSuperAdmin('');
      setNewAuthority('');
      fetchState();
    } catch (err: any) {
      console.error("Authority Transfer Failure:", err);
      setStatus({ 
        type: 'error', 
        msg: err.message || "An unexpected error occurred." 
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleTogglePause = async () => {
    if (!service || !currentConfig) return;
    try {
      setSubmitting(true);
      const newState = !currentConfig.isEmergencyPaused;
      setStatus({ type: 'info', msg: `${newState ? 'Halting' : 'Resuming'} global operations...` });
      
      const sig = await service.setEmergencyPause(newState);
      setStatus({ type: 'success', msg: `System ${newState ? 'PAUSED' : 'RESUMED'}! Tx: ${sig.slice(0, 10)}...` });
      fetchState();
    } catch (err: any) {
      console.error("Pause Toggle Error:", err);
      setStatus({ type: 'error', msg: err.message || "Pause toggle failed." });
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
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {/* Card 1: Super Admin */}
          <div className="glass-morphism p-6 rounded-2xl border border-gold/20 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center mb-4">
                <span className="text-gold text-xs font-bold uppercase tracking-widest">Master Control</span>
                <span className="text-xl">👑</span>
              </div>
              <h3 className="text-white font-bold text-lg mb-2">Super Admin</h3>
              <p className="text-gray-400 text-xs mb-4">
                Immutable Master key holder.
              </p>
            </div>
            <div className={`font-mono text-[10px] break-all p-3 bg-black/30 rounded-lg border border-white/5 ${loading ? 'animate-pulse' : ''}`}>
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
              <h3 className="text-white font-bold text-lg mb-2">Operational Admin</h3>
              <p className="text-gray-400 text-xs mb-4">
                Projects & status manager.
              </p>
            </div>
            <div className={`font-mono text-[10px] break-all p-3 bg-black/30 rounded-lg border border-white/5 ${loading ? 'animate-pulse' : ''}`}>
              {loading ? "Decrypting..." : currentConfig?.authority || "Not Initialized"}
            </div>
          </div>

          {/* Card 3: Emergency System Pause */}
          <div className={`glass-morphism p-6 rounded-2xl border flex flex-col justify-between transition-all duration-500 ${currentConfig?.isEmergencyPaused ? 'border-red-500 bg-red-500/5' : 'border-green-500/30 bg-green-500/5'}`}>
            <div>
              <div className="flex justify-between items-center mb-4">
                <span className={`${currentConfig?.isEmergencyPaused ? 'text-red-400' : 'text-green-400'} text-xs font-bold uppercase tracking-widest`}>
                  System Status
                </span>
                <span className="relative flex h-3 w-3">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${currentConfig?.isEmergencyPaused ? 'bg-red-400' : 'bg-green-400'}`}></span>
                  <span className={`relative inline-flex rounded-full h-3 w-3 ${currentConfig?.isEmergencyPaused ? 'bg-red-500' : 'bg-green-500'}`}></span>
                </span>
              </div>
              <h3 className="text-white font-bold text-lg mb-2">Registry Halt</h3>
              <p className="text-gray-400 text-xs mb-4">
                Global kill-switch for all admin operations.
              </p>
            </div>
            
            <button
               onClick={handleTogglePause}
               disabled={submitting || isUninitialized || !wallet.connected}
               className={`w-full py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                 currentConfig?.isEmergencyPaused 
                 ? 'bg-green-500 text-white hover:bg-green-600' 
                 : 'bg-red-500 text-white hover:bg-red-600 shadow-[0_0_15px_rgba(239,68,68,0.3)]'
               } disabled:opacity-20 disabled:cursor-not-allowed`}
            >
              {submitting ? "Processing..." : currentConfig?.isEmergencyPaused ? "Resume Operations" : "Panic: Halt Registry"}
            </button>
          </div>
        </div>

        {/* Form Container */}
        <div className="glass-morphism p-8 rounded-3xl border border-gold/20 shadow-2xl">
          {isUninitialized ? (
            <>
              <div className="flex items-baseline gap-2 mb-8 border-b border-gold/10 pb-4">
                <h2 className="text-2xl font-bold text-white uppercase tracking-tighter">Initialize Registry</h2>
                <span className="text-gold text-xs font-bold uppercase tracking-widest px-2 py-0.5 bg-gold/10 rounded border border-gold/20">First Time Setup</span>
              </div>

              <form onSubmit={handleInitialize} className="space-y-8">
                <div className="space-y-6">
                  <div className="group">
                    <label className="block text-gray-400 mb-2 text-xs font-bold uppercase tracking-widest">Initial Operational Admin</label>
                    <input 
                      type="text"
                      placeholder="Enter wallet address for Sub-Admin"
                      className="w-full bg-[#0A1628]/80 border border-gold/20 rounded-xl p-4 text-white focus:outline-none focus:border-gold transition-all font-mono text-sm"
                      value={newAuthority}
                      onChange={(e) => setNewAuthority(e.target.value)}
                      required
                    />
                  </div>
                  <div className="group">
                    <label className="block text-gray-400 mb-2 text-xs font-bold uppercase tracking-widest">Operational Limit (USDC)</label>
                    <input 
                      type="number"
                      placeholder="Max funding cap for sub-admin (e.g. 1000000)"
                      className="w-full bg-[#0A1628]/80 border border-gold/20 rounded-xl p-4 text-white focus:outline-none focus:border-gold transition-all font-mono text-sm"
                      value={operationalLimits}
                      onChange={(e) => setOperationalLimits(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {status && (
                  <div className={`p-4 rounded-xl border flex items-start gap-3 ${status.type === 'error' ? 'bg-red-500/10 text-red-400 border-red-500/30' : 'bg-gold/10 text-gold border-gold/30'}`}>
                    <span>{status.type === 'error' ? '❌' : '⏳'}</span>
                    <p className="text-sm">{status.msg}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting || !wallet.connected}
                  className="w-full py-5 rounded-2xl font-black text-lg uppercase tracking-widest bg-gradient-to-r from-gold-dark via-gold to-gold-light text-navy shadow-lg"
                >
                  {submitting ? "Deploying Protocol..." : "Initialize Registry Protocol"}
                </button>
              </form>
            </>
          ) : (
            <>
              <div className="flex items-baseline gap-2 mb-8 border-b border-gold/10 pb-4">
                <h2 className="text-2xl font-bold text-white">Transfer Privileges</h2>
                <span className="text-gray-500 text-sm">Update specific roles</span>
              </div>
              
              <form onSubmit={handleTransfer} className="space-y-8">
                <div className="space-y-6">
                  {/* Input 1: Upgrade Authority */}
                  <div className="group">
                    <label className="block text-gray-400 mb-2 text-xs font-bold uppercase tracking-widest">New Upgrade Authority</label>
                    <input 
                      type="text"
                      placeholder="Paste destination public key"
                      className="w-full bg-[#0A1628]/80 border border-gold/20 rounded-xl p-4 text-white focus:outline-none focus:border-gold transition-all font-mono text-sm"
                      value={newSuperAdmin}
                      onChange={(e) => {
                        setNewSuperAdmin(e.target.value);
                        setNewAuthority(''); // Mutual exclusivity for clarity
                      }}
                    />
                    <p className="text-white/30 text-[10px] mt-2 italic px-1">Changes program-level management rights.</p>
                  </div>

                  {/* Input 2: New Operational Admin */}
                  <div className="group">
                    <label className="block text-gray-400 mb-2 text-xs font-bold uppercase tracking-widest">New Operational Admin</label>
                    <input 
                      type="text"
                      placeholder="Paste destination public key"
                      className="w-full bg-[#0A1628]/80 border border-gold/20 rounded-xl p-4 text-white focus:outline-none focus:border-gold transition-all font-mono text-sm"
                      value={newAuthority}
                      onChange={(e) => {
                        setNewAuthority(e.target.value);
                        setNewSuperAdmin(''); // Mutual exclusivity for clarity
                      }}
                    />
                    <p className="text-white/30 text-[10px] mt-2 italic px-1">Changes day-to-day project management rights.</p>
                  </div>
                </div>

                {/* Status Alert */}
                {status && (
                  <div className={`flex items-center gap-3 p-4 rounded-xl border ${
                    status.type === 'error' ? 'bg-red-500/10 text-red-400 border-red-500/30' :
                    status.type === 'success' ? 'bg-green-500/10 text-green-400 border-green-500/30' :
                    'bg-gold/10 text-gold border-gold/30'
                  }`}>
                    <p className="text-sm font-medium">{status.msg}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting || !wallet.connected}
                  className="w-full py-5 rounded-2xl font-black text-lg uppercase tracking-widest bg-gradient-to-r from-gold-dark via-gold to-gold-light text-navy"
                >
                  {submitting ? "Executing..." : "Execute Role Transfer"}
                </button>
              </form>
            </>
          )}
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
