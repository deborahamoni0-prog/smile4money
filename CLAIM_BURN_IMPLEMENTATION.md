# Claim & Burn UI Implementation Guide

## Overview

The Claim & Burn component provides a complete UI for users to claim rewards or burn tokens on the Stellar network. It handles wallet connection states, form validation, confirmation flows, and error handling.

## Architecture

### Component Structure

```
ClaimBurn (Main Component)
├── Wallet State Renderers
│   ├── renderNotInstalled() - Freighter not found
│   ├── renderDisconnected() - Connect wallet prompt
│   ├── renderConnecting() - Loading spinner
│   ├── renderWrongNetwork() - Network switch prompt
│   └── renderForm() - Main form (when connected)
│
└── Form Components (when connected)
    ├── Toggle Buttons (Claim/Burn)
    ├── Wallet Info Display
    ├── Confirmation Overlay (conditional)
    └── Form with Input & Submit
        └── Feedback Messages (success/error)
```

### State Management

```typescript
// Component State
const [mode, setMode] = useState<Mode>('claim');           // 'claim' | 'burn'
const [amount, setAmount] = useState('');                  // User input
const [status, setStatus] = useState<Status>('idle');      // 'idle' | 'confirm' | 'pending' | 'success' | 'error'
const [errorMsg, setErrorMsg] = useState('');              // Error message
const [txHash, setTxHash] = useState<string | null>(null); // Transaction hash
```

### Wallet State Flow

```
┌─────────────────────────────────────────────────────────┐
│                    Wallet States                        │
└─────────────────────────────────────────────────────────┘

checking
  ↓
  ├─→ notInstalled (Freighter not found)
  │     └─→ [Show install prompt]
  │
  ├─→ disconnected (Wallet not connected)
  │     ├─→ [Show connect button]
  │     └─→ connecting (on connect click)
  │           ├─→ connected (success)
  │           │     └─→ [Show form]
  │           │
  │           └─→ wrongNetwork (wrong network)
  │                 └─→ [Show switch network button]
  │
  └─→ connected (already connected)
        └─→ [Show form]
```

### Form State Flow

```
┌──────────────────────────────────────────────────────────┐
│                    Form States                          │
└──────────────────────────────────────────────────────────┘

idle (initial)
  ↓
  ├─→ [User enters amount]
  │     └─→ idle (feedback cleared)
  │
  ├─→ [User clicks submit]
  │     └─→ confirm (show confirmation overlay)
  │           ├─→ [User clicks cancel]
  │           │     └─→ idle (return to form)
  │           │
  │           └─→ [User clicks confirm]
  │                 └─→ pending (executing transaction)
  │                       ├─→ success (transaction succeeded)
  │                       │     └─→ [Show success message, reset form]
  │                       │
  │                       └─→ error (transaction failed)
  │                             └─→ [Show error message]
  │                                   └─→ idle (on amount change)
```

## File Structure

```
apps/frontend/
├── src/
│   ├── components/
│   │   └── claim-burn.tsx          # Main component (7.9 KB)
│   ├── styles/
│   │   └── claim-burn.css          # Styling (3.1 KB)
│   ├── hooks/
│   │   └── useWallet.ts            # Wallet integration (fixed)
│   └── types.ts                    # Type definitions
│
└── tests/
    └── claim-burn.test.tsx         # Test suite (22 tests)
```

## Component Props

```typescript
interface ClaimBurnProps {
  // Required: Current wallet state
  walletState: 'checking' | 'notInstalled' | 'disconnected' | 
              'connecting' | 'connected' | 'wrongNetwork';
  
  // Optional: Callbacks
  onConnect?: () => void;                              // Connect wallet
  onClaim?: (amount: string) => Promise<string | void>; // Claim operation
  onBurn?: (amount: string) => Promise<string | void>;  // Burn operation
  onSwitchNetwork?: () => void;                        // Switch network
  
  // Optional: Display data
  publicKey?: string | null;                           // Connected wallet address
  expectedNetwork?: string;                            // Expected network name
}
```

## Styling System

### Color Palette
```css
Primary:     #6c63ff (Purple)
Success:     #10b981 (Green)
Danger:      #ef4444 (Red)
Neutral:     #e5e7eb (Light Gray)
Text:        #374151 (Dark Gray)
Background:  #f9fafb (Off White)
```

### Component Classes
```css
.claim-burn                    /* Main container */
.claim-burn-title              /* Title */
.wallet-state                  /* Wallet state container */
.wallet-state-icon             /* Icon */
.wallet-state-title            /* State title */
.wallet-state-message          /* State message */
.toggle                        /* Toggle group */
.toggle-btn                    /* Toggle button */
.toggle-btn.active             /* Active toggle */
.wallet-info                   /* Wallet info display */
.wallet-info-label             /* Label */
.wallet-info-address           /* Address */
.confirm-overlay               /* Confirmation overlay */
.confirm-text                  /* Confirmation text */
.confirm-buttons               /* Confirmation buttons */
.btn                           /* Base button */
.btn-connect                   /* Connect button */
.btn-switch-network            /* Switch network button */
.btn-claim                     /* Claim button */
.btn-burn                      /* Burn button */
.btn-cancel                    /* Cancel button */
.feedback                      /* Feedback message */
.feedback.success              /* Success message */
.feedback.error                /* Error message */
.spinner                       /* Loading spinner */
```

## Event Handlers

### Toggle Mode
```typescript
function handleToggle(newMode: Mode) {
  setMode(newMode);
  resetFeedback(); // Clear any previous feedback
}
```

### Amount Input
```typescript
function handleAmountChange(e: React.ChangeEvent<HTMLInputElement>) {
  setAmount(e.target.value);
  resetFeedback(); // Clear feedback on input change
}
```

### Submit Form
```typescript
function handleRequestSubmit(e: React.FormEvent) {
  e.preventDefault();
  if (!amount || Number(amount) <= 0) return; // Validation
  setStatus('confirm'); // Show confirmation overlay
}
```

### Confirm Transaction
```typescript
async function handleConfirm() {
  setStatus('pending');
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
    setStatus('success');
    setAmount(''); // Reset form
  } catch (err) {
    setStatus('error');
    setErrorMsg(err instanceof Error ? err.message : 'Transaction failed');
  }
}
```

### Cancel Confirmation
```typescript
function handleCancel() {
  resetFeedback(); // Return to form
}
```

## Accessibility Features

### ARIA Attributes
```tsx
// Toggle group
<div className="toggle" role="group" aria-label="Select mode">
  <button aria-pressed={mode === 'claim'} data-testid="toggle-claim">
    Claim
  </button>
</div>

// Feedback messages
<div aria-live="polite" aria-atomic="true">
  <p role="status" data-testid="success-msg">Success!</p>
  <p role="alert" data-testid="error-msg">Error message</p>
</div>
```

### Semantic HTML
- Proper form structure with labels
- Input with associated label
- Button types (submit, button)
- Heading hierarchy (h2 for title)

### Keyboard Navigation
- Tab through all interactive elements
- Enter/Space to activate buttons
- Form submission with Enter key

## Testing Strategy

### Test Categories

1. **Wallet States (9 tests)**
   - Each wallet state renders correctly
   - Callbacks triggered appropriately
   - Proper messaging for each state

2. **Toggle Functionality (3 tests)**
   - Default mode is 'claim'
   - Toggle switches modes
   - Visual feedback updates

3. **Confirmation Flow (4 tests)**
   - Overlay appears on submit
   - Amount displays in confirmation
   - Cancel returns to form
   - Submit button hidden during confirmation

4. **Submit & Error Handling (6 tests)**
   - Callbacks invoked with correct amount
   - Error messages display
   - Errors clear on input change
   - Submit disabled for invalid amounts

### Test Utilities
```typescript
// Helper to create connected wallet state
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

// Helper to submit with confirmation
async function submitWithConfirm(amount: string, onClaim?: any) {
  render(<ClaimBurn walletState="connected" onClaim={onClaim} onBurn={onClaim} />);
  fireEvent.change(screen.getByTestId('amount-input'), { target: { value: amount } });
  fireEvent.click(screen.getByTestId('submit-btn'));
  fireEvent.click(screen.getByTestId('confirm-btn'));
}
```

## Performance Considerations

### Optimizations
- Minimal re-renders with proper state management
- No unnecessary useEffect hooks
- Memoized callbacks where appropriate
- CSS animations use GPU acceleration

### Bundle Size
- Component: ~8 KB (minified)
- Styles: ~3 KB (minified)
- No external dependencies beyond React

## Browser Support

| Browser | Version | Status |
|---------|---------|--------|
| Chrome  | Latest  | ✅ Full support |
| Firefox | Latest  | ✅ Full support |
| Safari  | Latest  | ✅ Full support |
| Edge    | Latest  | ✅ Full support |

## Integration Example

```tsx
import { ClaimBurn } from './components/claim-burn';
import { useWallet } from './hooks/useWallet';

export function App() {
  const { state, publicKey, expectedNetwork, connect, switchNetwork } = useWallet();

  const handleClaim = async (amount: string) => {
    // Call your claim API
    const response = await fetch('/api/claim', {
      method: 'POST',
      body: JSON.stringify({ amount }),
    });
    const data = await response.json();
    return data.transactionHash;
  };

  const handleBurn = async (amount: string) => {
    // Call your burn API
    const response = await fetch('/api/burn', {
      method: 'POST',
      body: JSON.stringify({ amount }),
    });
    const data = await response.json();
    return data.transactionHash;
  };

  return (
    <main style={{ padding: '2rem', minHeight: '100vh', background: '#f5f5f5' }}>
      <ClaimBurn
        walletState={state}
        onConnect={connect}
        onSwitchNetwork={switchNetwork}
        publicKey={publicKey}
        expectedNetwork={expectedNetwork}
        onClaim={handleClaim}
        onBurn={handleBurn}
      />
    </main>
  );
}
```

## Troubleshooting

### Component not rendering
- Check `walletState` prop is one of the valid values
- Verify `onConnect` callback is provided for disconnected state
- Ensure parent component passes required props

### Callbacks not firing
- Verify callback functions are provided as props
- Check browser console for errors
- Ensure callbacks return Promise or void

### Styling issues
- Verify CSS file is imported in component
- Check for CSS conflicts with other stylesheets
- Inspect element to verify classes are applied

### Test failures
- Run `npm test` to see detailed error messages
- Check that test data matches component expectations
- Verify mock functions are set up correctly

## Future Enhancements

- [ ] Add balance display and validation
- [ ] Implement transaction history
- [ ] Add gas fee estimation
- [ ] Support multiple wallet providers
- [ ] Add dark mode support
- [ ] Implement transaction retry logic
- [ ] Add analytics tracking
