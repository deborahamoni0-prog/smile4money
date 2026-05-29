import React, { useMemo, useState } from 'react';
import React, { useState } from 'react';
import '../styles/claim-burn.css';

type Mode = 'claim' | 'burn';
type SubmitPhase = 'idle' | 'confirm' | 'pending' | 'success' | 'error';

type WalletStateProp = string | { status: string; balance?: string | null };

interface ClaimBurnProps {
  walletState: WalletStateProp;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onRefreshBalance?: () => void;
  onClaim?: (amount: string) => Promise<string | void>;
  onBurn?: (amount: string) => Promise<string | void>;
  onSwitchNetwork?: () => void;
  publicKey?: string | null;
  expectedNetwork?: string;
}

const styles = {
  panel: {
    width: '100%',
    maxWidth: 420,
    minWidth: 0,
    margin: '0 auto',
    padding: 24,
    borderRadius: 24,
    background: '#ffffff',
    boxShadow: '0 20px 50px rgba(0, 0, 0, 0.08)',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 18,
    fontFamily: 'Inter, system-ui, sans-serif',
    boxSizing: 'border-box' as const,
  },
  walletPrompt: {
    margin: 0,
    fontSize: 16,
    lineHeight: 1.5,
    color: '#0f172a',
  },
  walletStatusRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  statusBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
    padding: '8px 14px',
    background: '#ecfdf5',
    color: '#166534',
    fontSize: 13,
    fontWeight: 600,
  },
  button: {
    width: '100%',
    borderRadius: 14,
    border: 'none',
    padding: '14px 18px',
    fontSize: 16,
    cursor: 'pointer',
    transition: 'background 0.2s ease, transform 0.15s ease',
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
    boxSizing: 'border-box' as const,
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

  const stateKey = typeof walletState === 'string' ? walletState : walletState.status;
  const balance = typeof walletState === 'object' ? (walletState.balance ?? null) : null;
  const showConfirmation = typeof walletState === 'object';

  const status: WalletStatus = typeof walletState === 'string' ? walletState : walletState.status;
  const walletBalance = typeof walletState === 'string' ? null : walletState.balance;
  const connectedAddress = publicKey ?? (typeof walletState === 'object' ? walletState.address : null);

  const balanceNum = useMemo(
    () => (balance !== null ? Number(balance) : null),
    [balance],
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
    if (balance !== null) {
      setAmount(stripTrailingZeros(balance));
      resetFeedback();
    }
  }

  function handleRequestSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid) return;
    if (showConfirmation) {
      setPhase('confirm');
    } else {
      handleConfirm();
    }
  }

  async function handleConfirm() {
    setPhase('pending');
    setErrorMsg('');
    setTxHash(null);
    try {
      const action = mode === 'claim' ? onClaim : onBurn;
      const hash = await action?.(amount);
      if (hash) setTxHash(hash);
      setPhase('success');
      setAmount('');
    } catch (err) {
      setPhase('error');
      setErrorMsg(err instanceof Error ? err.message : 'Transaction failed');
    }
  }

  function handleCancel() {
    setPhase('idle');
  }

  function handleAmountChange(e: React.ChangeEvent<HTMLInputElement>) {
    setAmount(e.target.value);
    if (phase === 'error' || phase === 'success') {
      resetFeedback();
    }
  }

  function handleModeChange(newMode: Mode) {
    setMode(newMode);
    resetFeedback();
  }

  function renderNotInstalled() {
    return (
      <div className="wallet-state" data-testid="wallet-not-installed">
        <div className="wallet-state-icon">{'\u26A0\uFE0F'}</div>
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
        <div className="wallet-state-icon">{'\uD83D\uDCBC'}</div>
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
        <div className="wallet-state-icon">{'\uD83C\uDF10'}</div>
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

  function renderError() {
    return (
      <div className="wallet-state" data-testid="wallet-error">
        <div className="wallet-state-icon">{'\u26A0\uFE0F'}</div>
        <h3 className="wallet-state-title">Connection Error</h3>
        <p className="wallet-state-message">
          {errorMsg || 'An error occurred while connecting to your wallet.'}
        </p>
        <button className="btn btn-connect" onClick={onConnect} data-testid="retry-connect-btn">
          Try Again
        </button>
      </div>
    );
  }

  function renderForm() {
    const isPending = phase === 'pending';

    return (
      <>
        <div className="toggle" role="group" aria-label="Select mode">
          <button
            className={`toggle-btn${mode === 'claim' ? ' active' : ''}`}
            onClick={() => handleModeChange('claim')}
            aria-pressed={mode === 'claim'}
            data-testid="toggle-claim"
          >
            Claim
          </button>
          <button
            className={`toggle-btn${mode === 'burn' ? ' active' : ''}`}
            onClick={() => handleModeChange('burn')}
            aria-pressed={mode === 'burn'}
            data-testid="toggle-burn"
          >
            Burn
          </button>
        </div>

        {connectedAddress && (
          <div className="wallet-info" data-testid="wallet-info">
            <div className="wallet-info-row">
              <span className="wallet-info-label">Connected</span>
              <span className="wallet-info-address">
                {publicKey.slice(0, 4)}&hellip;{publicKey.slice(-4)}
              </span>
              {onDisconnect && (
                <button
                  className="btn-disconnect"
                  onClick={onDisconnect}
                  data-testid="disconnect-btn"
                >
                  Disconnect
                </button>
              )}
            </div>
            {balance !== null && onRefreshBalance && (
              <div className="wallet-balance-row">
                <span className="wallet-balance-label">Balance</span>
                <span className="wallet-balance-value" data-testid="wallet-balance">
                  {stripTrailingZeros(balance)} XLM
                </span>
                <button
                  className="btn-refresh-balance"
                  onClick={onRefreshBalance}
                  data-testid="refresh-balance-btn"
                  title="Refresh balance"
                >
                  {'\u21BB'}
                </button>
              </div>
            )}
          </div>
        )}

        {phase === 'confirm' ? (
          <div className="confirm-overlay" data-testid="confirm-overlay">
            <p className="confirm-text">
              {mode === 'claim' ? 'Claim' : 'Burn'} {amount} XLM?
            </p>
            <button
              className="btn btn-confirm"
              onClick={handleConfirm}
              data-testid="confirm-btn"
            >
              Confirm
            </button>
            <button
              className="btn btn-cancel"
              onClick={handleCancel}
              data-testid="cancel-btn"
            >
              Cancel
            </button>
          </div>
        ) : (
          <form onSubmit={handleRequestSubmit} data-testid="claim-burn-form">
            <label htmlFor="amount">
              {mode === 'claim' ? 'Claim amount' : 'Burn amount'} (XLM)
            </label>
            <div className="input-row">
              <input
                id="amount"
                type="number"
                min="0"
                step="any"
                value={amount}
                onChange={handleAmountChange}
                placeholder="0.00"
                disabled={isPending}
                data-testid="amount-input"
              />
              {mode === 'burn' && balance !== null && (
                <button
                  type="button"
                  className="btn-max"
                  onClick={handleMax}
                  disabled={isPending}
                  data-testid="max-btn"
                >
                  Max
                </button>
              )}
            </div>
            <button
              type="submit"
              className={`btn btn-${mode}`}
              disabled={isPending || !amount || Number(amount) <= 0}
              data-testid="submit-btn"
            >
              {isPending ? 'Processing\u2026' : mode === 'claim' ? 'Claim' : 'Burn'}
            </button>
          </form>
        )}

        {phase === 'confirm' && (
          <div className="confirm-overlay" data-testid="confirm-overlay">
            <p>Confirm {mode === 'claim' ? 'claim' : 'burn'} of {amount} XLM.</p>
            <button
              type="button"
              className="btn btn-confirm"
              onClick={handleConfirm}
              data-testid="confirm-btn"
            >
              Confirm
            </button>
            <button
              type="button"
              className="btn btn-cancel"
              onClick={() => setPhase('idle')}
              data-testid="cancel-btn"
            >
              Cancel
            </button>
          </div>
        )}

        <div aria-live="polite" aria-atomic="true">
          {phase === 'success' && (
            <div className="feedback success" role="status" data-testid="success-msg">
              <p>{mode === 'claim' ? 'Claimed successfully!' : 'Burned successfully!'}</p>
              {txHash && (
                <p className="tx-hash" data-testid="tx-hash">
                  TX: {txHash.slice(0, 8)}&hellip;{txHash.slice(-6)}
                </p>
              )}
            </div>
          )}
          {phase === 'error' && (
            <p className="feedback error" role="alert" data-testid="error-msg">
              {errorMsg}
            </p>
          )}
        </div>
      </>
    );
  }

  const stateMap: Record<string, React.ReactNode> = {
    checking: renderConnecting(),
    notInstalled: renderNotInstalled(),
    disconnected: renderDisconnected(),
    connecting: renderConnecting(),
    wrongNetwork: renderWrongNetwork(),
    connected: renderForm(),
    error: renderError(),
  };

  return (
    <div className="claim-burn" data-testid="claim-burn">
      <h2 className="claim-burn-title">Claim &amp; Burn</h2>
      {stateMap[stateKey]}
    </div>
  );
}
