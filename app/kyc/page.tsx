"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import SumsubKYC from '@/components/kyc/SumsubKYC';
import Link from 'next/link';

export default function KYCPage() {
  const [user, setUser] = useState<any>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [kycStatus, setKycStatus] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    async function init() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push('/login');
        return;
      }

      setUser(user);

      // Check current KYC status
      const { data: profile } = await supabase
        .from('profiles')
        .select('kyc_verified')
        .eq('id', user.id)
        .single();

      if (profile?.kyc_verified) {
        setKycStatus('verified');
        setLoading(false);
        return;
      }

      // Get Sumsub token
      try {
        const response = await fetch('/api/kyc/token');
        const data = await response.json();
        
        if (data.error) throw new Error(data.error);
        
        setAccessToken(data.token);
      } catch (err: any) {
        setError(err.message || "Failed to initialize KYC flow");
      } finally {
        setLoading(false);
      }
    }

    init();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-navy flex items-center justify-center pt-20">
        <div className="w-12 h-12 border-4 border-gold border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (kycStatus === 'verified') {
    return (
      <div className="min-h-screen bg-navy flex items-center justify-center pt-20 px-6">
        <div className="max-w-md w-full glass p-8 rounded-2xl border border-gold/30 text-center">
          <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Verification Complete</h1>
          <p className="text-gray-400 mb-8">Your identity has been verified. You can now connect your wallet and start investing.</p>
          <Link 
            href="/dashboard" 
            className="block w-full bg-gold text-navy font-bold py-3 rounded-lg hover:bg-gold-light transition-all shadow-lg shadow-gold/20"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-navy pt-32 pb-20 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">Identity Verification</h1>
          <p className="text-gray-400 max-w-2xl mx-auto">
            To comply with international regulations and ensure the security of your investments, 
            we require all users to complete a brief identity verification process.
          </p>
        </div>

        {error ? (
          <div className="glass p-8 rounded-2xl border border-red-500/30 text-center">
            <p className="text-red-400 mb-6">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="bg-gold text-navy font-bold py-2 px-6 rounded-lg hover:bg-gold-light transition-all"
            >
              Retry
            </button>
          </div>
        ) : accessToken && user ? (
          <SumsubKYC 
            accessToken={accessToken} 
            externalUserId={user.id}
            onSuccess={async () => {
              try {
                // Update the database to mark user as verified
                await fetch('/api/kyc/complete', { method: 'POST' });
                setKycStatus('verified');
                
                // Optional: Automatically redirect after a short delay
                setTimeout(() => {
                  router.push('/dashboard');
                }, 2000);
              } catch (err) {
                console.error('Failed to update KYC status in DB', err);
              }
            }}
          />
        ) : (
          <div className="text-center text-gray-500">
            Initializing verification flow...
          </div>
        )}
      </div>
    </div>
  );
}
