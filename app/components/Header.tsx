"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { WalletButton } from "@/components/blockchain/WalletButton";
import { WalletStatusBadge } from "@/components/blockchain/WalletStatusBadge";
import { useWalletLink } from "@/hooks/useWalletLink";
import { useWalletConnection } from "@/hooks/useWalletConnection";

export default function Header() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [userName, setUserName] = useState<string>("");
  const [isKycVerified, setIsKycVerified] = useState<boolean>(false);
  const { isVerified, initialLoading, isLinking, linkWallet, error: walletError } = useWalletLink();
  const { connected, publicKey } = useWalletConnection();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    async function checkAuth() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        const { data: profile } = await supabase
          .from('profiles')
          .select('first_name, last_name, kyc_verified')
          .eq('id', user.id)
          .single();

        if (profile) {
          setUserName(`${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'User');
          setIsKycVerified(profile.kyc_verified || false);
        } else {
          setUserName('User');
        }
      } else {
        setUser(null);
        setUserName('');
      }
    }
    checkAuth();
  }, [pathname]);

  // Auto-trigger verification if connected but not verified
  useEffect(() => {
    // Only auto-trigger if:
    // 1. Wallet is connected
    // 2. We've finished the initial check (initialLoading is false)
    // 3. Wallet is NOT verified
    // 4. Not currently linking
    // 5. No recent error (to avoid infinite retry loops)
    if (connected && publicKey && !initialLoading && !isVerified && !isLinking && !walletError) {
      const walletAddr = publicKey.toBase58();
      // Check if we've already tried and failed in this session to avoid infinite loops
      const hasFailed = sessionStorage.getItem(`wallet_link_failed_${walletAddr}`);
      
      if (!hasFailed) {
        // Delay slightly for better UX
        const timer = setTimeout(() => {
          console.log("Auto-triggering wallet verification handshake for:", walletAddr);
          linkWallet();
        }, 2000);
        return () => clearTimeout(timer);
      }
    }
  }, [connected, publicKey, initialLoading, isVerified, isLinking, linkWallet, walletError]);

  // Record failure if walletError occurs during auto-trigger
  useEffect(() => {
    if (walletError && connected && publicKey) {
      sessionStorage.setItem(`wallet_link_failed_${publicKey.toBase58()}`, 'true');
    }
  }, [walletError, connected, publicKey]);

  const navItems = [
    { href: "/", label: "Home" },
    { href: "/projects", label: "Projects" },
    { href: "/about", label: "About" },
    { href: "/support", label: "Support" },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-navy/95 backdrop-blur-lg shadow-lg shadow-gold/5 border-b border-gold/20'
          : 'bg-transparent border-b border-gold/10'
      }`}
    >
      <nav className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-3 hover:opacity-90 transition-all duration-300 group"
          >
            <div className="relative">
              <Image
                src="/logo.png"
                alt="GoldenFleece"
                width={50}
                height={50}
                className="w-10 h-10 md:w-12 md:h-12 transition-transform duration-300 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gold/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </div>
            <div className="flex flex-col">
              <span className="text-gold font-bold text-lg md:text-xl tracking-tight">GoldenFleece</span>
              <span className="text-gold-light text-[10px] tracking-wider hidden md:block uppercase">AurumChain</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`relative px-4 py-2 text-sm font-medium transition-all duration-300 rounded-lg group ${
                  pathname === item.href
                    ? "text-gold"
                    : "text-gray-300 hover:text-white"
                }`}
              >
                {item.label}
                {pathname === item.href && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-gold to-transparent"></span>
                )}
                <span className="absolute inset-0 bg-gold/5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
              </Link>
            ))}
          </div>

          {/* Unified Identity Section */}
          <div className="flex items-center gap-4">
            {/* Desktop Unified Identity */}
            <div className="hidden lg:flex items-center gap-3">
              {user ? (
                <div className="flex items-center gap-4">
                  {!isKycVerified ? (
                    <Link 
                      href="/kyc" 
                      className="flex items-center gap-3 bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-2 rounded-lg text-sm font-bold hover:bg-red-500/20 transition-all group"
                    >
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                      Verify KYC
                    </Link>
                  ) : (
                    <>
                      <WalletStatusBadge />
                      <WalletButton profileName={userName} />
                    </>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <Link
                    href="/login"
                    className="text-white hover:text-gold transition-colors text-sm font-medium"
                  >
                    Log In
                  </Link>
                  <Link
                    href="/signup"
                    className="bg-gradient-to-r from-gold to-gold-light text-navy font-bold py-2 px-6 rounded-lg transition-all duration-300 text-sm shadow-lg shadow-gold/20 hover:scale-105"
                  >
                    Register
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile Fallback Login */}
            {!user && (
              <Link
                href="/login"
                className="lg:hidden relative bg-gradient-to-r from-gold to-gold-light hover:from-gold-light hover:to-gold text-navy font-bold py-2 px-4 rounded-lg transition-all duration-300 text-xs shadow-lg shadow-gold/20 hover:scale-105"
              >
                Log In
              </Link>
            )}

            {/* Mobile Wallet Integration (Visible only when logged in) */}
            {user && (
              <div className="lg:hidden scale-75 origin-right">
                <WalletButton profileName={userName} />
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              className="md:hidden text-gold p-2 hover:bg-gold/10 rounded-lg transition-all duration-300"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              <svg
                className="w-6 h-6 transition-transform duration-300"
                style={{ transform: mobileMenuOpen ? 'rotate(90deg)' : 'rotate(0)' }}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {mobileMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <div
          className={`md:hidden overflow-hidden transition-all duration-300 ${
            mobileMenuOpen ? 'max-h-96 opacity-100 mt-4' : 'max-h-0 opacity-0'
          }`}
        >
          <div className="glass rounded-xl p-4 border border-gold/20">
            <div className="flex flex-col gap-2">
              {navItems.map((item, index) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`text-sm font-medium transition-all duration-300 py-3 px-4 rounded-lg ${
                    pathname === item.href
                      ? "text-gold bg-gold/10"
                      : "text-white hover:text-gold hover:bg-gold/5"
                  }`}
                  style={{
                    animation: mobileMenuOpen ? `fadeInUp 0.3s ease-out ${index * 50}ms forwards` : 'none',
                    opacity: mobileMenuOpen ? 1 : 0
                  }}
                >
                  {item.label}
                </Link>
              ))}

              {/* Mobile Account/Login */}
              {user && (
                <>
                  {!isKycVerified ? (
                    <Link
                      href="/kyc"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/30 hover:border-red-500/50 transition-all duration-300 mt-2 group"
                    >
                      <div className="w-8 h-8 bg-red-500/20 rounded-full flex items-center justify-center">
                        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                      </div>
                      <span className="text-sm font-medium text-red-400 group-hover:text-red-300">Verify KYC Required</span>
                    </Link>
                  ) : (
                    <Link
                      href="/dashboard"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 rounded-lg bg-gold/10 border border-gold/20 hover:border-gold/40 transition-all duration-300 mt-2"
                    >
                      <div className="w-8 h-8 bg-gold/20 rounded-full flex items-center justify-center">
                        <svg className="w-5 h-5 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <span className="text-sm font-medium text-gold">{userName}</span>
                    </Link>
                  )}
                </>
              )}
              {!user && (
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="bg-gradient-to-r from-gold to-gold-light text-navy font-bold py-3 px-4 rounded-lg transition-all duration-300 text-sm text-center mt-2"
                >
                  Log In
                </Link>
              )}

              {/* Mobile Wallet Integration - Visible only when logged in */}
              {user && (
                <div className="flex flex-col gap-2 mt-4 pt-4 border-t border-gold/10">
                  <div className="flex items-center justify-between px-2">
                    <span className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Wallet Connectivity</span>
                    <WalletStatusBadge />
                  </div>
                  <WalletButton profileName={userName} />
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
}
