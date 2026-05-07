"use client";

import { useEffect, useRef, useState } from 'react';

interface SumsubKYCProps {
  accessToken: string;
  externalUserId: string;
  onSuccess?: () => void;
  onError?: (error: any) => void;
}

declare global {
  interface Window {
    snsWebSdk: any;
  }
}

/**
 * Sumsub KYC Verification Component
 * 
 * Loads the Sumsub Web SDK and initializes the verification flow.
 */
export default function SumsubKYC({ accessToken, externalUserId, onSuccess, onError }: SumsubKYCProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [sdkLoaded, setSdkLoaded] = useState(false);

  useEffect(() => {
    // 1. Load Sumsub SDK Script
    const script = document.createElement('script');
    script.src = "https://static.sumsub.com/idensic/static/sns-websdk-builder.js";
    script.async = true;
    script.onload = () => setSdkLoaded(true);
    script.onerror = (e) => {
      console.error("Failed to load Sumsub SDK:", e);
      if (onError) onError(e);
    };
    document.body.appendChild(script);

    return () => {
      // Cleanup script if needed (usually script tags stay)
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, [onError]);

  useEffect(() => {
    if (!sdkLoaded || !accessToken || !containerRef.current) return;

    // 2. Initialize SDK
    const snsWebSdkInstance = window.snsWebSdk.init(
      accessToken,
      // Function to refresh token if it expires
      () => fetch('/api/kyc/token').then(res => res.json()).then(data => data.token)
    )
    .withConf({
      lang: 'en',
    })
    .on('idCheck.onApplicantSubmitted', (payload: any) => {
      console.log('Applicant submitted:', payload);
      if (onSuccess) onSuccess();
    })
    .on('idCheck.onApplicantStatusChanged', (payload: any) => {
      console.log('Applicant status changed:', payload);
      if (payload?.reviewResult?.reviewAnswer === 'GREEN') {
        if (onSuccess) onSuccess();
      }
    })
    .on('idCheck.onError', (error: any) => {
      console.error('Verification error:', error);
      if (onError) onError(error);
    })
    .build();

    // 3. Launch into container
    snsWebSdkInstance.launch(containerRef.current);

    return () => {
      // Sumsub doesn't provide a clear destroy method for the builder instance in basic examples,
      // but usually clearing the container is enough.
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [sdkLoaded, accessToken, onSuccess, onError]);

  return (
    <div className="w-full min-h-[600px] bg-navy-dark rounded-xl overflow-hidden border border-gold/20 shadow-2xl">
      {!sdkLoaded && (
        <div className="flex flex-col items-center justify-center h-[600px] gap-4">
          <div className="w-12 h-12 border-4 border-gold border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gold font-medium">Initializing secure verification...</p>
        </div>
      )}
      <div ref={containerRef} id="sumsub-kyc-container" />
    </div>
  );
}
