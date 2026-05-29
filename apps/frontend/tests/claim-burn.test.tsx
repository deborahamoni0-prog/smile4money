import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ClaimBurn } from '../src/components/claim-burn';
import type { WalletState } from '../src/types';

function connectedWallet(overrides?: Partial<WalletState>): WalletState {
  return {
    status: 'connected',
    address: 'GA4QZ3R2X3Y6KZ7J8M9N0P1Q2R3S4T5U6V7W8X9Y0Z1',
    error: null,
    balance: null,
    network: 'testnet',
    ...overrides,
  };
}

// ─── Wallet States ──────────────────────────────────────────────────

// Mock CSS import
vi.mock('../src/components/claim-burn.css', () => ({}));

describe('ClaimBurn — wallet states', () => {
  it('shows checking/connecting spinner while loading', () => {
    render(<ClaimBurn walletState="checking" />);
    expect(screen.getByTestId('wallet-connecting')).toBeInTheDocument();
  });

  it('shows connect prompt when disconnected', () => {
    render(<ClaimBurn walletState="disconnected" />);
    expect(screen.getByTestId('wallet-disconnected')).toBeInTheDocument();
    expect(screen.getByTestId('connect-wallet-btn')).toBeInTheDocument();
    expect(screen.getByText(/Connect your Freighter wallet/i)).toBeInTheDocument();
  });

  it('calls onConnect when connect button clicked', () => {
    const onConnect = vi.fn();
    render(
      <ClaimBurn
        walletState={{ status: 'disconnected', address: null, error: null, balance: null, network: 'unknown' }}
        onConnect={onConnect}
      />,
    );
    fireEvent.click(screen.getByTestId('connect-wallet-btn'));
    expect(onConnect).toHaveBeenCalledOnce();
  });

  it('shows connecting state with spinner', () => {
    render(<ClaimBurn walletState="connecting" />);
    expect(screen.getByTestId('wallet-connecting')).toBeInTheDocument();
  });

  it('shows notInstalled state', () => {
    render(<ClaimBurn walletState="notInstalled" />);
    expect(screen.getByTestId('wallet-not-installed')).toBeInTheDocument();
    expect(screen.getByText(/Freighter Not Found/i)).toBeInTheDocument();
  });

  it('shows wrongNetwork state', () => {
    render(<ClaimBurn walletState="wrongNetwork" expectedNetwork="testnet" />);
    expect(screen.getByTestId('wallet-wrong-network')).toBeInTheDocument();
    expect(screen.getByText('Wrong Network')).toBeInTheDocument();
    expect(screen.getByTestId('switch-network-btn')).toHaveTextContent('Switch to testnet');
  });

  it('calls onSwitchNetwork when switch network button clicked', () => {
    const onSwitchNetwork = vi.fn();
    render(
      <ClaimBurn
        walletState="wrongNetwork"
        onSwitchNetwork={onSwitchNetwork}
      />,
    );
    fireEvent.click(screen.getByTestId('switch-network-btn'));
    expect(onSwitchNetwork).toHaveBeenCalledOnce();
  });

  it('shows form when connected', () => {
    render(<ClaimBurn walletState={connectedWallet()} />);
    expect(screen.getByTestId('claim-burn-form')).toBeInTheDocument();
  });

  it('shows wallet info when publicKey provided', () => {
    render(
      <ClaimBurn
        walletState="connected"
        publicKey="GABCDEF1234567890XYZ"
      />,
    );
    expect(screen.getByTestId('wallet-info')).toBeInTheDocument();
    expect(screen.getByText(/GABC/)).toBeInTheDocument();
  });

  it('shows error state with retry button', () => {
    render(<ClaimBurn walletState="error" onConnect={vi.fn()} />);
    expect(screen.getByTestId('wallet-error')).toBeInTheDocument();
    expect(screen.getByText(/Connection Error/i)).toBeInTheDocument();
    expect(screen.getByTestId('retry-connect-btn')).toBeInTheDocument();
  });

  it('shows balance when walletState object has balance', () => {
    render(
      <ClaimBurn
        walletState={{ status: 'connected', balance: '500.75' }}
        publicKey="GA4QZ3R2X3Y6KZ7J8M9N0P1Q2R3S4T5U6V7W8X9Y0Z1"
        onRefreshBalance={vi.fn()}
      />,
    );
    expect(screen.getByTestId('wallet-balance')).toHaveTextContent('500.75 XLM');
    expect(screen.getByTestId('refresh-balance-btn')).toBeInTheDocument();
  });
});

// ─── Toggle ─────────────────────────────────────────────────────────

describe('ClaimBurn — toggle', () => {
  it('defaults to claim mode', () => {
    render(<ClaimBurn walletState={connectedWallet()} />);
    expect(screen.getByTestId('toggle-claim')).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByTestId('toggle-burn')).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByTestId('submit-btn')).toHaveTextContent('Claim');
  });

  it('switches to burn mode', () => {
    render(<ClaimBurn walletState={connectedWallet()} />);
    fireEvent.click(screen.getByTestId('toggle-burn'));
    expect(screen.getByTestId('toggle-burn')).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByTestId('toggle-claim')).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByTestId('submit-btn')).toHaveTextContent('Burn');
  });

  it('switches back to claim mode', () => {
    render(<ClaimBurn walletState="connected" />);
    fireEvent.click(screen.getByTestId('toggle-burn'));
    fireEvent.click(screen.getByTestId('toggle-claim'));
    expect(screen.getByTestId('toggle-claim')).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByTestId('submit-btn')).toHaveTextContent('Claim');
  });

  it('shows Max button in burn mode when balance is available', () => {
    render(
      <ClaimBurn
        walletState={{ status: 'connected', balance: '1000' }}
      />,
    );
    expect(screen.queryByTestId('max-btn')).not.toBeInTheDocument();
    fireEvent.click(screen.getByTestId('toggle-burn'));
    expect(screen.getByTestId('max-btn')).toBeInTheDocument();
  });

  it('hides Max button when balance is null', () => {
    render(<ClaimBurn walletState={{ status: 'connected', balance: null }} />);
    fireEvent.click(screen.getByTestId('toggle-burn'));
    expect(screen.queryByTestId('max-btn')).not.toBeInTheDocument();
  });
});

// ─── Confirmation step ─────────────────────────────────────────────

describe('ClaimBurn — confirmation', () => {
  it('shows confirmation overlay after clicking submit', () => {
    render(<ClaimBurn walletState={connectedWallet()} />);
    fireEvent.change(screen.getByTestId('amount-input'), { target: { value: '10' } });
    fireEvent.click(screen.getByTestId('submit-btn'));
    expect(screen.getByTestId('confirm-overlay')).toBeInTheDocument();
    expect(screen.getByTestId('confirm-btn')).toHaveTextContent('Confirm');
    expect(screen.getByTestId('cancel-btn')).toHaveTextContent('Cancel');
  });

  it('hides submit button when showing confirmation', () => {
    render(<ClaimBurn walletState={connectedWallet()} />);
    fireEvent.change(screen.getByTestId('amount-input'), { target: { value: '10' } });
    fireEvent.click(screen.getByTestId('submit-btn'));
    expect(screen.queryByTestId('submit-btn')).not.toBeInTheDocument();
  });

  it('cancels confirmation and shows submit button again', () => {
    render(<ClaimBurn walletState={connectedWallet()} />);
    fireEvent.change(screen.getByTestId('amount-input'), { target: { value: '10' } });
    fireEvent.click(screen.getByTestId('submit-btn'));
    fireEvent.click(screen.getByTestId('cancel-btn'));
    expect(screen.getByTestId('submit-btn')).toBeInTheDocument();
    expect(screen.queryByTestId('confirm-overlay')).not.toBeInTheDocument();
  });

  it('shows amount in confirmation text', () => {
    render(<ClaimBurn walletState={connectedWallet()} />);
    fireEvent.change(screen.getByTestId('amount-input'), { target: { value: '42.5' } });
    fireEvent.click(screen.getByTestId('submit-btn'));
    expect(screen.getByTestId('confirm-overlay')).toHaveTextContent('42.5');
  });
});

// ─── Submit ─────────────────────────────────────────────────────────

describe('ClaimBurn — submit', () => {
  async function submitWithConfirm(amount: string, onClaim?: any) {
    render(<ClaimBurn walletState={connectedWallet()} onClaim={onClaim} onBurn={onClaim} />);
    fireEvent.change(screen.getByTestId('amount-input'), { target: { value: amount } });
    fireEvent.click(screen.getByTestId('submit-btn'));
    fireEvent.click(screen.getByTestId('confirm-btn'));
  }

  it('calls onClaim with amount after confirmation', async () => {
    const onClaim = vi.fn().mockResolvedValue(undefined);
    await submitWithConfirm('10', onClaim);
    await waitFor(() => expect(screen.getByTestId('success-msg')).toBeInTheDocument());
    expect(onClaim).toHaveBeenCalledWith('10');
    expect(screen.getByText('XLM claimed successfully!')).toBeInTheDocument();
  });

  it('calls onBurn with amount in burn mode', async () => {
    const onBurn = vi.fn().mockResolvedValue(undefined);
    render(<ClaimBurn walletState="connected" onBurn={onBurn} />);
    
    // Switch to burn mode
    fireEvent.click(screen.getByTestId('toggle-burn'));
    fireEvent.change(screen.getByTestId('amount-input'), { target: { value: '5' } });
    fireEvent.click(screen.getByTestId('submit-btn'));
    
    await waitFor(() => expect(screen.getByTestId('success-msg')).toBeInTheDocument());
    expect(onBurn).toHaveBeenCalledWith('5');
    expect(screen.getByText('XLM burned successfully!')).toBeInTheDocument();
  });

  it('shows pending state while the transaction is processing', async () => {
    let resolvePromise: () => void;
    const promise = new Promise<void>((resolve) => {
      resolvePromise = resolve;
    });
    const onClaim = vi.fn().mockReturnValue(promise);

    render(<ClaimBurn walletState="connected" onClaim={onClaim} />);
    fireEvent.change(screen.getByTestId('amount-input'), { target: { value: '7' } });
    fireEvent.click(screen.getByTestId('submit-btn'));

    expect(screen.getByTestId('submit-btn')).toHaveTextContent('Claiming…');
    resolvePromise!();
    await waitFor(() => expect(screen.getByTestId('success-msg')).toBeInTheDocument());
  });

  it('calls onBurn with amount', async () => {
    const onBurn = vi.fn().mockResolvedValue(undefined);
    render(<ClaimBurn walletState="connected" onBurn={onBurn} />);
    fireEvent.click(screen.getByTestId('toggle-burn'));
    fireEvent.change(screen.getByTestId('amount-input'), { target: { value: '12' } });
    fireEvent.click(screen.getByTestId('submit-btn'));
    await waitFor(() => expect(screen.getByTestId('success-msg')).toBeInTheDocument());
    expect(onBurn).toHaveBeenCalledWith('12');
  });

  it('calls onBurn with amount', async () => {
    const onBurn = vi.fn().mockResolvedValue(undefined);
    render(<ClaimBurn walletState={connectedWallet()} onBurn={onBurn} />);
    fireEvent.click(screen.getByTestId('toggle-burn'));
    fireEvent.change(screen.getByTestId('amount-input'), { target: { value: '25' } });
    fireEvent.click(screen.getByTestId('submit-btn'));
    fireEvent.click(screen.getByTestId('confirm-btn'));
    await waitFor(() => expect(screen.getByTestId('success-msg')).toBeInTheDocument());
    expect(onBurn).toHaveBeenCalledWith('25');
  });

  it('shows error on failure', async () => {
    const onClaim = vi.fn().mockRejectedValue(new Error('Insufficient balance'));
    render(<ClaimBurn walletState="connected" onClaim={onClaim} />);
    fireEvent.change(screen.getByTestId('amount-input'), { target: { value: '5' } });
    fireEvent.click(screen.getByTestId('submit-btn'));
    fireEvent.click(screen.getByTestId('confirm-btn'));
    await waitFor(() =>
      expect(screen.getByTestId('error-msg')).toHaveTextContent('Insufficient balance'),
    );
  });

  it('resets status on amount change after error', async () => {
    const onClaim = vi.fn().mockRejectedValue(new Error('Fail'));
    render(<ClaimBurn walletState="connected" onClaim={onClaim} />);
    fireEvent.change(screen.getByTestId('amount-input'), { target: { value: '5' } });
    fireEvent.click(screen.getByTestId('submit-btn'));
    fireEvent.click(screen.getByTestId('confirm-btn'));
    await waitFor(() => expect(screen.getByTestId('error-msg')).toBeInTheDocument());
    fireEvent.change(screen.getByTestId('amount-input'), { target: { value: '10' } });
    expect(screen.queryByTestId('error-msg')).not.toBeInTheDocument();
  });

  it('disables submit when amount is empty', () => {
    render(<ClaimBurn walletState={connectedWallet()} />);
    expect(screen.getByTestId('submit-btn')).toBeDisabled();
  });

  it('disables submit when amount is zero', () => {
    render(<ClaimBurn walletState="connected" />);
    fireEvent.change(screen.getByTestId('amount-input'), { target: { value: '0' } });
    expect(screen.getByTestId('submit-btn')).toBeDisabled();
  });

  it('disables submit when amount is zero or negative', () => {
    render(<ClaimBurn walletState="connected" />);
    
    fireEvent.change(screen.getByTestId('amount-input'), { target: { value: '0' } });
    expect(screen.getByTestId('submit-btn')).toBeDisabled();
    
    fireEvent.change(screen.getByTestId('amount-input'), { target: { value: '-5' } });
    expect(screen.getByTestId('submit-btn')).toBeDisabled();
  });

  it('shows loading state during submission', async () => {
    const onClaim = vi.fn().mockImplementation(() => new Promise(resolve => setTimeout(resolve, 1000)));
    render(<ClaimBurn walletState="connected" onClaim={onClaim} />);
    
    fireEvent.change(screen.getByTestId('amount-input'), { target: { value: '10' } });
    fireEvent.click(screen.getByTestId('submit-btn'));
    
    expect(screen.getByText('Processing...')).toBeInTheDocument();
    expect(screen.getByTestId('submit-btn')).toBeDisabled();
  });

  it('auto-hides success message after 3 seconds', async () => {
    const onClaim = vi.fn().mockResolvedValue(undefined);
    render(<ClaimBurn walletState="connected" onClaim={onClaim} />);
    
    fireEvent.change(screen.getByTestId('amount-input'), { target: { value: '10' } });
    fireEvent.click(screen.getByTestId('submit-btn'));
    
    await waitFor(() => expect(screen.getByTestId('success-msg')).toBeInTheDocument());
    
    // Fast-forward time by 3 seconds
    vi.advanceTimersByTime(3000);
    
    await waitFor(() => expect(screen.queryByTestId('success-msg')).not.toBeInTheDocument());
  });

  it('clears error when typing new amount', () => {
    const onClaim = vi.fn().mockRejectedValue(new Error('Test error'));
    render(<ClaimBurn walletState="connected" onClaim={onClaim} />);
    
    // Trigger error
    fireEvent.change(screen.getByTestId('amount-input'), { target: { value: '10' } });
    fireEvent.click(screen.getByTestId('submit-btn'));
    
    // Type new amount
    fireEvent.change(screen.getByTestId('amount-input'), { target: { value: '20' } });
    
    // Error should be cleared
    expect(screen.queryByTestId('error-msg')).not.toBeInTheDocument();
  });
});

describe('ClaimBurn — max button', () => {
  it('shows max button when balance is provided', () => {
    render(<ClaimBurn walletState="connected" balance="100.50" />);
    expect(screen.getByText('Max')).toBeInTheDocument();
  });

  it('sets amount to balance when max button clicked', () => {
    render(<ClaimBurn walletState="connected" balance="100.50" />);
    fireEvent.click(screen.getByText('Max'));
    expect(screen.getByTestId('amount-input')).toHaveValue(100.50);
  });

  it('does not show max button when balance is not provided', () => {
    render(<ClaimBurn walletState="connected" />);
    expect(screen.queryByText('Max')).not.toBeInTheDocument();
  });
});

describe('ClaimBurn — accessibility', () => {
  it('has proper ARIA labels and roles', () => {
    render(<ClaimBurn walletState="connected" />);
    
    expect(screen.getByRole('group', { name: 'Select mode' })).toBeInTheDocument();
    expect(screen.getByLabelText('Amount (XLM)')).toBeInTheDocument();
  });

  it('announces success and error messages to screen readers', async () => {
    const onClaim = vi.fn().mockResolvedValue(undefined);
    render(<ClaimBurn walletState="connected" onClaim={onClaim} />);
    
    fireEvent.change(screen.getByTestId('amount-input'), { target: { value: '10' } });
    fireEvent.click(screen.getByTestId('submit-btn'));
    
    await waitFor(() => {
      const successMsg = screen.getByTestId('success-msg');
      expect(successMsg).toHaveAttribute('role', 'status');
    });
  });
});
