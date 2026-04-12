"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useWalletStatus } from '@/hooks/useWalletStatus';

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [userInfo, setUserInfo] = useState({ firstName: "", email: "" });
  const {
    isWalletConnected,
    walletAddress,
    isWalletLinked,
    linkWallet,
    isLinking,
    error,
  } = useWalletStatus();

  useEffect(() => {
    async function loadUser() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push('/login');
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('first_name, email')
        .eq('id', user.id)
        .single();

      if (profile) {
        setUserInfo({
          firstName: profile.first_name || 'there',
          email: profile.email || user.email || ''
        });
      }
    }
    loadUser();
  }, [router]);

  const handleSkip = () => {
    router.push('/dashboard');
  };

  const handleComplete = async () => {
    if (isWalletConnected && !isWalletLinked) {
      // Auto-link wallet if connected but not linked
      await linkWallet();
    }
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen bg-navy flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-2xl">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">Step {step} of 2</span>
            <span className="text-sm text-gold">{step === 1 ? 'Welcome' : 'Connect Wallet'}</span>
          </div>
          <div className="w-full h-2 bg-navy-dark rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-gold to-gold-light transition-all duration-500"
              style={{ width: `${(step / 2) * 100}%` }}
            />
          </div>
        </div>

        {/* Card */}
        <div className="glass rounded-2xl p-8 border border-gold/20">
          {step === 1 && (
            <div className="space-y-6">
              {/* Welcome Step */}
              <div className="text-center mb-8">
                <div className="w-20 h-20 bg-gold/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-10 h-10 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h1 className="text-3xl font-bold text-white mb-2">
                  Welcome to GoldenFleece, {userInfo.firstName}! 🎉
                </h1>
                <p className="text-gray-400 text-lg">
                  You're one step away from investing in real gold mining projects
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-4 p-4 rounded-lg bg-navy-dark/50 border border-gold/10">
                  <div className="w-10 h-10 bg-gold/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-gold font-bold">1</span>
                  </div>
                  <div>
                    <h3 className="text-white font-semibold mb-1">Browse Projects</h3>
                    <p className="text-gray-400 text-sm">
                      Explore gold mining opportunities from around the world
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 rounded-lg bg-navy-dark/50 border border-gold/10">
                  <div className="w-10 h-10 bg-gold/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-gold font-bold">2</span>
                  </div>
                  <div>
                    <h3 className="text-white font-semibold mb-1">Connect Your Wallet</h3>
                    <p className="text-gray-400 text-sm">
                      Link your crypto wallet to make secure blockchain investments
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 rounded-lg bg-navy-dark/50 border border-gold/10">
                  <div className="w-10 h-10 bg-gold/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-gold font-bold">3</span>
                  </div>
                  <div>
                    <h3 className="text-white font-semibold mb-1">Earn Dividends</h3>
                    <p className="text-gray-400 text-sm">
                      Receive your share of gold mining profits directly to your wallet
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setStep(2)}
                className="w-full bg-gradient-to-r from-gold to-gold-light text-navy font-bold py-4 rounded-lg transition-all duration-300 hover:scale-105 shadow-lg shadow-gold/20"
              >
                Get Started →
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              {/* Connect Wallet Step */}
              <div className="text-center mb-6">
                <div className="w-20 h-20 bg-gold/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-10 h-10 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                </div>
                <h1 className="text-3xl font-bold text-white mb-2">
                  Connect Your Crypto Wallet
                </h1>
                <p className="text-gray-400">
                  Link your wallet to unlock investment features and receive blockchain dividends
                </p>
              </div>

              {/* Why Connect? */}
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-blue-400 mb-1">Why connect my wallet?</p>
                    <ul className="text-xs text-gray-300 space-y-1">
                      <li>• Verify your identity for secure investments</li>
                      <li>• Receive dividends directly to your wallet</li>
                      <li>• Own tokenized shares of mining projects</li>
                      <li>• Your wallet, your keys - always in control</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Connect Button */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">
                    1. Connect Your Wallet
                  </label>
                  <div className="flex justify-center">
                    <ConnectButton
                      accountStatus={{
                        smallScreen: 'avatar',
                        largeScreen: 'full',
                      }}
                      chainStatus="icon"
                      showBalance={{
                        smallScreen: false,
                        largeScreen: true,
                      }}
                    />
                  </div>
                </div>

                {/* Link Wallet */}
                {isWalletConnected && !isWalletLinked && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-3">
                      2. Verify Ownership
                    </label>
                    <div className="space-y-3">
                      <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
                        <p className="text-sm text-yellow-400">
                          Sign a message to prove you own this wallet. This is free and doesn't cost any gas!
                        </p>
                      </div>
                      <button
                        onClick={linkWallet}
                        disabled={isLinking}
                        className="w-full bg-gradient-to-r from-gold to-gold-light text-navy font-bold py-3 rounded-lg transition-all duration-300 hover:scale-105 disabled:opacity-50"
                      >
                        {isLinking ? 'Verifying...' : 'Sign Message to Verify'}
                      </button>
                    </div>
                  </div>
                )}

                {/* Success */}
                {isWalletLinked && (
                  <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div>
                        <p className="text-sm font-medium text-green-400 mb-1">Wallet Connected! ✓</p>
                        <p className="text-xs text-green-300 font-mono">{walletAddress}</p>
                        <p className="text-xs text-gray-400 mt-2">
                          You're all set! You can now invest in gold mining projects.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Error */}
                {error && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                    <div className="flex gap-3">
                      <svg className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-sm text-red-200">{error}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleSkip}
                  className="flex-1 bg-transparent border border-gray-600 hover:border-gray-500 text-gray-300 font-medium py-3 rounded-lg transition-all duration-300"
                >
                  Skip for Now
                </button>
                <button
                  onClick={handleComplete}
                  disabled={isWalletConnected && !isWalletLinked}
                  className="flex-1 bg-gradient-to-r from-gold to-gold-light text-navy font-bold py-3 rounded-lg transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {isWalletLinked ? 'Complete Setup →' : 'Continue to Dashboard →'}
                </button>
              </div>

              <p className="text-xs text-gray-500 text-center">
                You can always connect your wallet later from your dashboard
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
