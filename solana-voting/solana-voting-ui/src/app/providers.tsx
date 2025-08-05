// Step-by-step plan for setting up Solana frontend in your Next.js 13+ project with `src/app` directory structure.

// ✅ Step 1: Install required dependencies
// Run this in your terminal:
// npm install @coral-xyz/anchor @solana/web3.js @solana/wallet-adapter-react @solana/wallet-adapter-wallets @solana/wallet-adapter-react-ui

// ✅ Step 2: Create the wallet provider context wrapper
// File: src/app/providers.tsx
'use client';

import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-wallets';
import '@solana/wallet-adapter-react-ui/styles.css';
import { useMemo } from 'react';

const endpoint = 'http://127.0.0.1:8899';
const wallets = [new PhantomWalletAdapter()];

export function Providers({ children }: { children: React.ReactNode }) {
  const connectionEndpoint = useMemo(() => endpoint, []);

  return (
    <ConnectionProvider endpoint={connectionEndpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          {children}
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
