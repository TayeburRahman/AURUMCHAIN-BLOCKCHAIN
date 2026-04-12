"use client";

import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useWalletStatus } from '@/hooks/useWalletStatus';

export default function AdminWalletButton() {
  const { isWalletConnected, isWalletLinked, linkWallet, isLinking } = useWalletStatus();

  return (
    <div className="flex flex-col items-end gap-2">
      <WalletMultiButton 
        className="!h-10 !px-4 !text-sm !font-bold !bg-navy-dark !border !border-gold/30 hover:!bg-navy !rounded-lg !transition-all shadow-md shadow-gold/10"
      />
      {isWalletConnected && !isWalletLinked && (
        <button
          onClick={linkWallet}
          disabled={isLinking}
          className="text-xs bg-gold/20 text-gold px-3 py-1.5 rounded hover:bg-gold/30 transition-colors border border-gold/30 flex items-center gap-1"
        >
          {isLinking ? 'Verifying...' : 'Link to Admin Profile'}
        </button>
      )}
      {isWalletLinked && (
        <span className="text-xs text-green-400 font-medium px-2 flex items-center gap-1">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
          Admin Wallet Linked
        </span>
      )}
    </div>
  );
}
