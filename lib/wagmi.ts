import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { polygon, polygonAmoy, mainnet } from 'wagmi/chains';

export const config = getDefaultConfig({
  appName: 'GoldenFleece',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'YOUR_PROJECT_ID', // Get from https://cloud.walletconnect.com
  chains: [
    polygon, // Polygon mainnet (low fees, production)
    ...(process.env.NEXT_PUBLIC_ENABLE_TESTNETS === 'true' ? [polygonAmoy, mainnet] : []),
  ],
  ssr: true, // Enable server-side rendering support
});
