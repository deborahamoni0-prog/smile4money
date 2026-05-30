import React, { useState, useEffect, useRef } from 'react';
import '../styles/claim-burn.css';

type Mode = 'claim' | 'burn';
type Status = 'idle' | 'confirm' | 'pending' | 'success' | 'error';

interface ClaimBurnProps {
  walletState: string;
  onConnect?: () => void;
  onClaim?: (amount: string) => Promise<string | void>;
  onBurn?: (amount: string) => Promise<string | void>;
  onSwitchNetwork?: () => void;
  onDisconnect?: () => void;
  onRefreshBalance?: () => void;
  publicKey?: string | null;
  balance?: string | null;
  expectedNetwork?: string;
}

function isValidAmount(value: string): boolean {
  const n = Number(value);
  return value.trim() !== '' && !isNaN(n) && n > 0;
}

export function ClaimBurn({
  walletState,
  onConnect,
  onClaim,
  onBurn,
  onSwitchNetwork,
  onDisconnect,
  onRefreshBalance,
  publicKey,
  balance,
  expectedNetwork = 'testnet',
}: ClaimBurnProps) {
  const [mode, setMode] = useState<Mode>('claim');
  const [amount, setAmount] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [txHash, setTxHash] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState('');
  const confirmBtnRef = useRef<HTMLButtonElement>(null);
  const amountInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (status === 'success') {
      const msg = mode === 'claim' ? 'XLM claimed successfully!' : 'XLM burned successfully!';
      setAnnouncement(msg);
      const timer = setTimeout(() => {
        setStatus('idle');
        setAnnouncement('');
      }, 3000);
      return () => clearTimeout(timer);
    }
    if (status === 'error') {
      setAnnouncement(errorMsg || 'Transaction failed');
    }
  }, [status, mode, errorMsg]);

  useEffect(() => {
    if (status === 'confirm') {
      confirmBtnRef.current?.focus();
    }
  }, [status]);

  function resetFeedback() {
    setStatus('idle');
    setTxHash(null);
    setErrorMsg('');
    setAnnouncement('');
  }

  function handleToggle(newMode: Mode) {
    setMode(newMode);
    resetFeedback();
    setTimeout(() => amountInputRef.current?.focus(), 0);
  }

  function handleAmountChange(e: React.ChangeEvent<HTMLInputElement>) {
    setAmount(e.target.value);
    if (status === 'error' || status === 'success') {
      resetFeedback();
    }
  }

  function handleMax() {
    if (balance != null) {
      setAmount(balance);
      resetFeedback();
    }
  }

  function handleRequestSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!isValidAmount(amount)) return;
    setStatus('confirm');
  }

  async function handleConfirm() {
    setStatus('pending');
    setErrorMsg('');
    setTxHash(null);
    try {
      const action = mode === 'claim' ? onClaim : onBurn;
      const hash = await action?.(amount);
      if (hash) setTxHash(hash);
      setStatus('success');
      setAmount('');
    } catch (err) {
      setStatus('error');
      setErrorMsg(err instanceof Error ? err.message : 'Transaction failed');
    }
  }

  function handleCancel() {
    setStatus('idle');
    setTimeout(() => amountInputRef.current?.focus(), 0);
  }

  // ── Wallet state screens ──────────────────────────────────────────

  if (walletState === 'checking' || walletState === 'connecting') {
    return (
      <div className="wallet-state" data-testid="wallet-connecting" aria-busy="true" aria-label="Connecting to wallet">
        <div className="spinner" role="status" aria-hidden="true" />
        <p className="wallet-state-message">Connecting to Freighter&hellip;</p>
      </div>
    );
  }

  if (walletState === 'notInstalled') {
    return (
      <div className="wallet-state" data-testid="wallet-not-installed" role="alert">
        <span className="wallet-state-icon" aria-hidden="true">⚠️</span>
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

  if (walletState === 'disconnected') {
    return (
      <div className="wallet-state" data-testid="wallet-disconnected">
        <span className="wallet-state-icon" aria-hidden="true">💼</span>
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

  if (walletState === 'wrongNetwork') {
    return (
      <div className="wallet-state" data-testid="wallet-wrong-network" role="alert">
        <span className="wallet-state-icon" aria-hidden="true">🌐</span>
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

  if (walletState === 'error') {
    return (
      <div className="wallet-state" data-testid="wallet-error" role="alert">
        <span className="wallet-state-icon" aria-hidden="true">⚠️</span>
        <h3 className="wallet-state-title">Connection Error</h3>
        <p className="wallet-state-message">
          An error occurred while connecting to your wallet.
        </p>
        <button className="btn btn-connect" onClick={onConnect} data-testid="retry-connect-btn">
          Try Again
        </button>
      </div>
    );
  }

  // ── Connected UI ──────────────────────────────────────────────────

  const isPending = status === 'pending';
  const showConfirm = status === 'confirm';
  const valid = isValidAmount(amount);

  return (
    <div className="claim-burn" data-testid="claim-burn">
      {/* Screen-reader live region */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {announcement}
      </div>

      <h2 className="claim-burn-title">Claim &amp; Burn</h2>

      {/* Toggle */}
      <div className="toggle" role="group" aria-label="Select mode">
        <button
          type="button"
          className={`toggle-btn${mode === 'claim' ? ' active' : ''}`}
          onClick={() => handleToggle('claim')}
          aria-pressed={mode === 'claim'}
          data-testid="toggle-claim"
        >
          Claim
        </button>
        <button
          type="button"
          className={`toggle-btn${mode === 'burn' ? ' active' : ''}`}
          onClick={() => handleToggle('burn')}
          aria-pressed={mode === 'burn'}
          data-testid="toggle-burn"
        >
          Burn
        </button>
      </div>

      {/* Wallet info */}
      {publicKey && (
        <div className="wallet-info" data-testid="wallet-info">
          <div className="wallet-info-row">
            <span className="wallet-info-label">Connected</span>
            <span className="wallet-info-address" aria-label={`Wallet address ending in ${publicKey.slice(-4)}`}>
              {publicKey.slice(0, 4)}&hellip;{publicKey.slice(-4)}
            </span>
            {onDisconnect && (
              <button className="btn-disconnect" onClick={onDisconnect} data-testid="disconnect-btn">
                Disconnect
              </button>
            )}
          </div>
          {balance != null && (
            <div className="wallet-balance-row">
              <span className="wallet-balance-label">Balance</span>
              <span className="wallet-balance-value" data-testid="wallet-balance" aria-label={`${balance} XLM`}>
                {balance} XLM
              </span>
              {onRefreshBalance && (
                <button
                  className="btn-refresh-balance"
                  onClick={onRefreshBalance}
                  data-testid="refresh-balance-btn"
                  aria-label="Refresh balance"
                >
                  ↻
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Confirmation overlay */}
      {showConfirm && (
        <div
          className="confirm-overlay"
          data-testid="confirm-overlay"
          role="dialog"
          aria-modal="true"
          aria-label={`Confirm ${mode}`}
        >
          <p className="confirm-text">
            {mode === 'claim' ? 'Claim' : 'Burn'} <strong>{amount}</strong> XLM?
          </p>
          <div className="confirm-buttons">
            <button
              type="button"
              className="btn btn-cancel"
              onClick={handleCancel}
              data-testid="cancel-btn"
            >
              Cancel
            </button>
            <button
              ref={confirmBtnRef}
              type="button"
              className={`btn btn-${mode}`}
              onClick={handleConfirm}
              data-testid="confirm-btn"
            >
              Confirm
            </button>
          </div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleRequestSubmit} data-testid="claim-burn-form" aria-label={`${mode === 'claim' ? 'Claim' : 'Burn'} tokens`}>
        <div className="form-group">
          <label htmlFor="amount-input">Amount (XLM)</label>
          <div className="input-row">
            <input
              ref={amountInputRef}
              id="amount-input"
              type="number"
              min="0"
              step="any"
              value={amount}
              onChange={handleAmountChange}
              disabled={isPending}
              placeholder="0.00"
              data-testid="amount-input"
              aria-describedby={balance != null ? 'wallet-balance' : undefined}
              aria-invalid={amount !== '' && !valid}
            />
            {mode === 'burn' && balance != null && (
              <button
                type="button"
                className="btn-max"
                onClick={handleMax}
                disabled={isPending}
                data-testid="max-btn"
                aria-label="Use maximum balance"
              >
                Max
              </button>
            )}
          </div>
        </div>

        {!showConfirm && (
          <button
            type="submit"
            className={`btn btn-${mode}`}
            disabled={isPending || !valid}
            data-testid="submit-btn"
            aria-busy={isPending}
          >
            {isPending
              ? mode === 'claim' ? 'Claiming…' : 'Burning…'
              : mode === 'claim' ? 'Claim' : 'Burn'}
          </button>
        )}
      </form>

      {/* Feedback */}
      {status === 'success' && (
        <p className="feedback success" role="status" data-testid="success-msg">
          {mode === 'claim' ? 'XLM claimed successfully!' : 'XLM burned successfully!'}
          {txHash && <span className="tx-hash">{txHash}</span>}
        </p>
      )}
      {status === 'error' && (
        <p className="feedback error" role="alert" data-testid="error-msg">
          {errorMsg}
        </p>
      )}
    </div>
  );
}
