import React, { useMemo, useState } from 'react';
import React, { useState } from 'react';
import '../styles/claim-burn.css';

type Mode = 'claim' | 'burn';

type WalletState = 'checking' | 'notInstalled' | 'disconnected' | 'connecting' | 'connected' | 'wrongNetwork';

interface ClaimBurnProps {
  walletState: WalletState;
  onConnect?: () => void;
  onClaim?: (amount: string) => Promise<void>;
  onBurn?: (amount: string) => Promise<void>;
  onSwitchNetwork?: () => void;
  publicKey?: string | null;
  expectedNetwork?: string;
}

const styles = {
  panel: {
    width: '100%',
    maxWidth: 420,
    margin: '0 auto',
    padding: 24,
    borderRadius: 24,
    background: '#ffffff',
    boxShadow: '0 20px 50px rgba(0, 0, 0, 0.08)',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 18,
    fontFamily: 'Inter, system-ui, sans-serif',
  },
  walletPrompt: {
    margin: 0,
    fontSize: 16,
    lineHeight: 1.5,
    color: '#0f172a',
  },
  button: {
    width: '100%',
    borderRadius: 14,
    border: 'none',
    padding: '14px 18px',
    fontSize: 16,
    cursor: 'pointer',
  },
  connectButton: {
    background: '#0f172a',
    color: '#ffffff',
  },
  actionButton: {
    background: '#0f172a',
    color: '#ffffff',
  },
  toggleGroup: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 8,
  },
  toggleButton: {
    borderRadius: 14,
    padding: '12px 0',
    border: '1px solid #e2e8f0',
    background: '#f8fafc',
    color: '#334155',
    cursor: 'pointer',
    fontSize: 15,
  },
  toggleActive: {
    background: '#0f172a',
    color: '#ffffff',
    border: '1px solid #0f172a',
  },
  fieldset: {
    display: 'grid',
    gap: 8,
  },
  label: {
    fontSize: 14,
    color: '#475569',
  },
  input: {
    width: '100%',
    borderRadius: 16,
    border: '1px solid #cbd5e1',
    padding: '14px 16px',
    fontSize: 16,
    color: '#0f172a',
    outline: 'none',
  },
  feedback: {
    fontSize: 14,
    margin: 0,
  },
  successText: {
    color: '#16a34a',
  },
  errorText: {
    color: '#dc2626',
  },
};

export function ClaimBurn({
  walletState,
  onConnect,
  onDisconnect,
  onRefreshBalance,
  onClaim,
  onBurn,
  onSwitchNetwork,
  publicKey,
  expectedNetwork = 'testnet',
}: ClaimBurnProps) {
  const [mode, setMode] = useState<Mode>('claim');
  const [amount, setAmount] = useState('');
  const [phase, setPhase] = useState<SubmitPhase>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [txHash, setTxHash] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);

  const balanceNum = useMemo(
    () => (walletState.balance !== null ? Number(walletState.balance) : null),
    [walletState.balance],
  );

  const exceedsBalance = useMemo(
    () =>
      mode === 'burn' &&
      balanceNum !== null &&
      isValidAmount(amount) &&
      Number(amount) > balanceNum,
    [amount, balanceNum, mode],
  );

  const valid = isValidAmount(amount) && !exceedsBalance;

  function resetFeedback() {
    setPhase('idle');
    setTxHash(null);
    setErrorMsg('');
  }

  function handleMax() {
    if (walletState.balance !== null) {
      setAmount(stripTrailingZeros(walletState.balance));
      setTouched(true);
      resetFeedback();
    }
  }

  function handleRequestSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid) return;
    setPhase('confirm');
  }

  async function handleConfirm() {
    setPhase('pending');
    setErrorMsg('');
    setTxHash(null);
    try {
      let hash: string | void;
      if (mode === 'claim') {
        hash = await onClaim?.(amount);
      } else {
        hash = await onBurn?.(amount);
      }
      if (hash) setTxHash(hash);
      setPhase('success');
      setAmount('');
      setTouched(false);
    } catch (err) {
      setPhase('error');
      setErrorMsg(err instanceof Error ? err.message : 'Transaction failed');
    }
  }

  function renderNotInstalled() {
    return (
      <div className="wallet-state" data-testid="wallet-not-installed">
        <div className="wallet-state-icon">&#9888;&#65039;</div>
        <h3 className="wallet-state-title">Freighter Not Found</h3>
        <p className="wallet-state-message">
          Please install the{' '}
          <a href="https://freighter.app" target="_blank" rel="noopener noreferrer">
            Freighter wallet extension
          </a>{' '}
          to continue.
        </p>
      </div>
    );
  }

  function renderDisconnected() {
    return (
      <div className="wallet-state" data-testid="wallet-disconnected">
        <div className="wallet-state-icon">&#128188;</div>
        <h3 className="wallet-state-title">Connect Your Wallet</h3>
        <p className="wallet-state-message">
          Connect your Freighter wallet to claim rewards or burn tokens.
        </p>
        <button className="btn btn-connect" onClick={onConnect} data-testid="connect-wallet-btn">
          Connect Wallet
        </button>
      </div>
    );
  }

  function renderConnecting() {
    return (
      <div className="wallet-state" data-testid="wallet-connecting">
        <div className="spinner" />
        <p className="wallet-state-message">Connecting to Freighter&hellip;</p>
      </div>
    );
  }

  function renderWrongNetwork() {
    return (
      <div className="wallet-state" data-testid="wallet-wrong-network">
        <div className="wallet-state-icon">&#127760;</div>
        <h3 className="wallet-state-title">Wrong Network</h3>
        <p className="wallet-state-message">
          Please switch your Freighter wallet to <strong>{expectedNetwork}</strong>.
        </p>
        <button
          className="btn btn-switch-network"
          onClick={onSwitchNetwork}
          data-testid="switch-network-btn"
        >
          Switch to {expectedNetwork}
        </button>
      </div>
    );
  }

  function renderForm() {
    return (
      <>
        <div className="toggle" role="group" aria-label="Select mode">
          <button
            className={`toggle-btn${mode === 'claim' ? ' active' : ''}`}
            onClick={() => { setMode('claim'); setStatus('idle'); }}
            aria-pressed={mode === 'claim'}
            data-testid="toggle-claim"
          >
            Claim
          </button>
          <button
            className={`toggle-btn${mode === 'burn' ? ' active' : ''}`}
            onClick={() => { setMode('burn'); setStatus('idle'); }}
            aria-pressed={mode === 'burn'}
            data-testid="toggle-burn"
          >
            Burn
          </button>
        </div>

        {publicKey && (
          <div className="wallet-info" data-testid="wallet-info">
            <span className="wallet-info-label">Connected</span>
            <span className="wallet-info-address">
              {publicKey.slice(0, 4)}&hellip;{publicKey.slice(-4)}
            </span>
          </div>
        )}

        <form onSubmit={handleSubmit} data-testid="claim-burn-form">
          <label htmlFor="amount">
            {mode === 'claim' ? 'Claim amount' : 'Burn amount'} (XLM)
          </label>
          <input
            id="amount"
            type="number"
            min="0"
            step="any"
            value={amount}
            onChange={(e) => { setAmount(e.target.value); setStatus('idle'); }}
            placeholder="0.00"
            disabled={status === 'pending'}
            data-testid="amount-input"
          />
          <button
            type="submit"
            className={`btn btn-${mode}`}
            disabled={status === 'pending' || !amount || Number(amount) <= 0}
            data-testid="submit-btn"
          >
            {status === 'pending' ? 'Processing\u2026' : mode === 'claim' ? 'Claim' : 'Burn'}
          </button>
        </form>

        <div aria-live="polite" aria-atomic="true">
          {status === 'success' && (
            <p className="feedback success" role="status" data-testid="success-msg">
              {mode === 'claim' ? 'Claimed successfully!' : 'Burned successfully!'}
            </p>
          )}
          {status === 'error' && (
            <p className="feedback error" role="alert" data-testid="error-msg">
              {errorMsg}
            </p>
          )}
        </div>
      </>
    );
  }

  const stateMap: Record<WalletState, React.ReactNode> = {
    checking: renderConnecting(),
    notInstalled: renderNotInstalled(),
    disconnected: renderDisconnected(),
    connecting: renderConnecting(),
    wrongNetwork: renderWrongNetwork(),
    connected: renderForm(),
  };

  return (
    <div className="claim-burn" data-testid="claim-burn">
      <h2 className="claim-burn-title">Claim &amp; Burn</h2>
      {stateMap[walletState]}
    </div>
  );
}
