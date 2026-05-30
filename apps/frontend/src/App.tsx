import { ClaimBurn } from './components/claim-burn';
import { useStellarWallet } from './hooks/useStellarWallet';

export function App() {
  const { status, address, balance, network, connect, disconnect, refreshBalance } =
    useStellarWallet();

  const handleClaim = async (amount: string): Promise<string | void> => {
    console.info('Claim request', amount);
  };

  const handleBurn = async (amount: string): Promise<string | void> => {
    console.info('Burn request', amount);
  };

  return (
    <main style={{ padding: '2rem', minHeight: '100vh', background: '#f5f5f5' }}>
      <ClaimBurn
        walletState={{ status, balance }}
        onConnect={connect}
        onDisconnect={disconnect}
        onRefreshBalance={refreshBalance}
        onClaim={handleClaim}
        onBurn={handleBurn}
        publicKey={address}
        expectedNetwork="testnet"
      />
    </main>
  );
}
