"use client";

import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import { SolanaProvider } from './SolanaProvider';

// EVM Imports Commented Out
/*
import '@rainbow-me/rainbowkit/styles.css';
import {
  RainbowKitProvider,
  darkTheme,
} from '@rainbow-me/rainbowkit';
import { WagmiProvider } from 'wagmi';
import { config } from '@/lib/wagmi';
*/

const queryClient = new QueryClient();

export function Web3Provider({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {/* Solana Wrapper */}
      <SolanaProvider>
        {children}
      </SolanaProvider>

      {/* EVM Wrapper Commented Out */}
      {/* 
      <WagmiProvider config={config}>
        <RainbowKitProvider
          theme={darkTheme({
            accentColor: '#D4AF37', // Gold color from your theme
            accentColorForeground: '#0A1628', // Navy color
            borderRadius: 'medium',
            fontStack: 'system',
          })}
          modalSize="compact"
        >
          {children}
        </RainbowKitProvider>
      </WagmiProvider>
      */}
    </QueryClientProvider>
  );
}
