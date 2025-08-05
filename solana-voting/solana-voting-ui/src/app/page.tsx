'use client';

import dynamic from 'next/dynamic';

// Wallet adapter button must be loaded dynamically (to avoid SSR issues)
const WalletMultiButton = dynamic(
  async () => (await import('@solana/wallet-adapter-react-ui')).WalletMultiButton,
  { ssr: false }
);

export default function Home() {
  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold mb-4">Solana Voting UI</h1>
      <WalletMultiButton />
      <p className="mt-4 text-sm text-gray-600">Connect your wallet to vote or create a poll.</p>
    </main>
  );
}
