import { ClaimBurn } from './components/claim-burn';
import { useStellarWallet } from './hooks/useStellarWallet';
import type { WalletStatus } from './types';

export function App() {
  const { status, address, connect } = useStellarWallet();

  const handleClaim = async (amount: string): Promise<string | void> => {
    console.info('Claim request', amount);
  };

  const handleBurn = async (amount: string): Promise<string | void> => {
    console.info('Burn request', amount);
  };

  return (
    <main style={{ padding: '2rem', minHeight: '100vh', background: '#f5f5f5' }}>
      <ClaimBurn
        walletState={status as WalletStatus}
        onConnect={connect}
        onClaim={handleClaim}
        onBurn={handleBurn}
        publicKey={address}
        expectedNetwork="testnet"
      />
    </main>
  );
}
