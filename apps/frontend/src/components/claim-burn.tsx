import React, { useState } from 'react';
import '../styles/claim-burn.css';

type Mode = 'claim' | 'burn';

interface ClaimBurnProps {
  walletState: { status: string; balance?: string | null };
  onConnect?: () => void;
  onDisconnect?: () => void;
  onRefreshBalance?: () => void;
  onClaim?: (amount: string) => Promise<string | void>;
  onBurn?: (amount: string) => Promise<string | void>;
  publicKey?: string | null;
}

export function ClaimBurn({
  walletState,
  onConnect,
  onClaim,
  onBurn,
  onDisconnect,
  onRefreshBalance,
  publicKey,
}: ClaimBurnProps) {
  const [mode, setMode] = useState<Mode>('claim');
  const [amount, setAmount] = useState('');
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const status = walletState?.status;
  const balance = walletState?.balance ? Number(walletState.balance) : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0 || pending) return;

    setPending(true);
    setMessage(null);

    try {
      const handler = mode === 'claim' ? onClaim : onBurn;
      await handler?.(amount);
      setMessage({ type: 'success', text: `${mode === 'claim' ? 'Claimed' : 'Burned'} ${amount} XLM` });
      setAmount('');
    } catch (err) {
      setMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Transaction failed',
      });
    } finally {
      setPending(false);
    }
  };

  const handleMax = () => {
    if (balance !== null) {
      setAmount(String(balance));
    }
  };

  // Render wallet disconnected state
  if (status === 'disconnected') {
    return (
      <div className="claim-burn">
        <h2 className="title">Claim & Burn</h2>
        <p className="wallet-prompt">Connect your wallet to get started</p>
        <button className="btn btn-connect" onClick={onConnect}>
          Connect Wallet
        </button>
      </div>
    );
  }

  // Render loading state
  if (status === 'connecting') {
    return (
      <div className="claim-burn">
        <h2 className="title">Claim & Burn</h2>
        <p className="wallet-connecting">Connecting wallet...</p>
      </div>
    );
  }

  // Render not installed state
  if (status === 'notInstalled') {
    return (
      <div className="claim-burn">
        <h2 className="title">Claim & Burn</h2>
        <p className="wallet-prompt">Freighter wallet not found. Please install it.</p>
        <button className="btn btn-connect" onClick={onConnect}>
          Install Freighter
        </button>
      </div>
    );
  }

  // Render connected state with form
  return (
    <div className="claim-burn">
      <h2 className="title">Claim & Burn</h2>

      {/* Wallet info */}
      <div className="wallet-info">
        {publicKey && (
          <p>Connected: {publicKey.slice(0, 6)}...{publicKey.slice(-4)}</p>
        )}
        {balance !== null && (
          <p>Balance: {balance.toFixed(2)} XLM</p>
        )}
      </div>

      {/* Toggle buttons */}
      <div className="toggle">
        <button
          type="button"
          className={`toggle-btn ${mode === 'claim' ? 'active' : ''}`}
          onClick={() => {
            setMode('claim');
            setMessage(null);
          }}
        >
          Claim
        </button>
        <button
          type="button"
          className={`toggle-btn ${mode === 'burn' ? 'active' : ''}`}
          onClick={() => {
            setMode('burn');
            setMessage(null);
          }}
        >
          Burn
        </button>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <label htmlFor="amount">
          Amount (XLM)
        </label>
        <div className="input-wrapper">
          <input
            id="amount"
            type="number"
            min="0"
            step="0.01"
            value={amount}
            onChange={(e) => {
              setAmount(e.target.value);
              setMessage(null);
            }}
            placeholder="0.00"
            disabled={pending}
          />
          {mode === 'burn' && balance !== null && (
            <button
              type="button"
              className="btn-max"
              onClick={handleMax}
              disabled={pending}
            >
              Max
            </button>
          )}
        </div>
        <button
          type="submit"
          className={`btn btn-${mode}`}
          disabled={!amount || pending}
        >
          {pending ? 'Processing...' : mode === 'claim' ? 'Claim' : 'Burn'}
        </button>
      </form>

      {/* Messages */}
      {message && (
        <div className={`message message-${message.type}`}>
          {message.text}
        </div>
      )}

      {/* Disconnect button */}
      {onDisconnect && (
        <button className="btn-disconnect" onClick={onDisconnect}>
          Disconnect
        </button>
      )}
      
      {onRefreshBalance && (
        <button className="btn-refresh" onClick={onRefreshBalance}>
          Refresh Balance
        </button>
      )}
    </div>
  );
}



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
  const [status, setStatus] = useState<Status>('idle');
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
    setStatus('idle');
    setTxHash(null);
    setErrorMsg('');
    setTxHash(null);
  };

  function handleMax() {
    if (balance !== null) {
      setAmount(stripTrailingZeros(balance));
      resetFeedback();
    }
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!valid) return;
    if (showConfirmation) {
      setPhase('confirm');
    } else {
      handleConfirm();
    }
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
  };

  const handleCancel = () => {
    setPhase('idle');
  };

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
    Disconnect,
  onRefreshBalance,
  publicKey,
}: ClaimBurnProps) {
  const [mode, setMode] = useState<Mode>('claim');
  const [amount, setAmount] = useState('');
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const status = walletState?.status;
  const balance = walletState?.balance ? Number(walletState.balance) : null;       <div className="wallet-info" data-testid="wallet-info">
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
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0 || pending) return;

    setPending(true);
    setMessage(null);

    try {
      const handler = mode === 'claim' ? onClaim : onBurn;
      await handler?.(amount);
      setMessage({ type: 'success', text: `${mode === 'claim' ? 'Claimed' : 'Burned'} ${amount} XLM` });
      setAmount('');
    } catch (err) {
      setMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Transaction failed',
      });
    } finally {
      setPending(false);
    }
  };

  const handleMax = () => {
    if (balance !== null) {
      setAmount(String(balance));
    }
  };

  // Render wallet disconnected state
  if (status === 'disconnected') {
    return (
      <div className="claim-burn">
        <h2 className="title">Claim & Burn</h2>
        <p className="wallet-prompt">Connect your wallet to get started</p>
        <button className="btn btn-connect" onClick={onConnect}>
          Connect Wallet
        </button>
      </div>
    );
  }

  // Render loading state
  if (status === 'connecting') {
    return (
      <div className="claim-burn">
        <h2 className="title">Claim & Burn</h2>
        <p className="wallet-connecting">Connecting wallet...</p>
      </div>
    );
  }

  // Render not installed state
  if (status === 'notInstalled') {
    return (
      <div className="claim-burn">
        <h2 className="title">Claim & Burn</h2>
        <p className="wallet-prompt">Freighter wallet not found. Please install it.</p>
        <button className="btn btn-connect" onClick={onConnect}>
          Install Freighter
          {phase === 'error' && (
            <p className="feedback error" role="alert" data-testid="error-msg">
              {errorMsg}
            </p>
          )}
          {txHash && (
            <p className="feedback success" role="status" data-testid="tx-hash">
              Transaction hash: {txHash}
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
