import { ClaimBurn } from './components/claim-burn';
import { useStellarWallet } from './hooks/useStellarWallet';

export function App() {
  const {
    status,
    address,
    balance,
    network,
    connect,
    disconnect,
    refreshBalance,
  } = useStellarWallet();

  async function handleClaim(amount: string): Promise<string | void> {
    return Promise.resolve();
  }

  async function handleBurn(amount: string): Promise<string | void> {
    return Promise.resolve();
  }

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
