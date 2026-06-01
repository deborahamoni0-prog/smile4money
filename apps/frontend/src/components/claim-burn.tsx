"use client";

import React, { useState, useCallback } from "react";

type Mode = "claim" | "burn";
type WalletState = "disconnected" | "connecting" | "connected" | "processing";

interface ClaimBurnProps {
  walletState?: WalletState;
  claimableAmount?: string;
  burnableAmount?: string;
  tokenSymbol?: string;
  onConnect?: () => Promise<void>;
  onClaim?: (amount: string) => Promise<void>;
  onBurn?: (amount: string) => Promise<void>;
}

function ModeToggle({
  mode,
  onChange,
  disabled,
}: {
  mode: Mode;
  onChange: (m: Mode) => void;
  disabled?: boolean;
}) {
  return (
    <div
      role="group"
      aria-label="Toggle between Claim and Burn modes"
      className="flex w-full rounded-xl bg-white/10 p-1 gap-1"
    >
      {(["claim", "burn"] as Mode[]).map((m) => (
        <button
          key={m}
          type="button"
          role="tab"
          aria-selected={mode === m}
          disabled={disabled}
          onClick={() => onChange(m)}
          className={[
            "flex-1 rounded-lg py-2.5 text-sm font-semibold capitalize transition-all duration-200",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60",
            mode === m
              ? m === "claim"
                ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/30"
                : "bg-rose-500 text-white shadow-lg shadow-rose-500/30"
              : "text-white/60 hover:text-white/80",
            disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer",
          ].join(" ")}
        >
          {m === "claim" ? "✦ Claim" : "🔥 Burn"}
        </button>
      ))}
    </div>
  );
}

function AmountDisplay({
  label,
  amount,
  symbol,
  accent,
}: {
  label: string;
  amount: string;
  symbol: string;
  accent: string;
}) {
  return (
    <div className="rounded-xl bg-white/5 border border-white/10 p-4">
      <p className="text-xs text-white/50 uppercase tracking-widest mb-1">{label}</p>
      <p className={`text-3xl font-bold ${accent} tabular-nums`} aria-live="polite">
        {amount}
        <span className="ml-2 text-base font-medium text-white/60">{symbol}</span>
      </p>
    </div>
  );
}

function Spinner({ size = 20 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className="animate-spin"
    >
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25" />
      <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

function StatusBadge({ walletState }: { walletState: WalletState }) {
  const config: Record<WalletState, { label: string; color: string; dot: string }> = {
    disconnected: { label: "Wallet Disconnected", color: "text-white/40",    dot: "bg-white/20" },
    connecting:   { label: "Connecting…",          color: "text-amber-400",   dot: "bg-amber-400 animate-pulse" },
    connected:    { label: "Wallet Connected",      color: "text-emerald-400", dot: "bg-emerald-400" },
    processing:   { label: "Processing…",           color: "text-sky-400",    dot: "bg-sky-400 animate-pulse" },
  };
  const { label, color, dot } = config[walletState];
  return (
    <div className={`flex items-center gap-2 text-xs font-medium ${color}`} aria-live="polite">
      <span className={`w-2 h-2 rounded-full ${dot}`} aria-hidden="true" />
      {label}
    </div>
  );
}

export default function ClaimBurn({
  walletState: ext,
  claimableAmount = "1,250.00",
  burnableAmount = "450.00",
  tokenSymbol = "S4M",
  onConnect,
  onClaim,
  onBurn,
}: ClaimBurnProps) {
  const [mode, setMode]     = useState<Mode>("claim");
  const [wState, setWState] = useState<WalletState>(ext ?? "disconnected");
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError]   = useState<string | null>(null);
  const effective           = ext ?? wState;

  const handleConnect = useCallback(async () => {
    setError(null);
    setWState("connecting");
    try {
      if (onConnect) await onConnect();
      else await new Promise((r) => setTimeout(r, 1200));
      setWState("connected");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to connect");
      setWState("disconnected");
    }
  }, [onConnect]);

  const handleAction = useCallback(async () => {
    setError(null);
    setTxHash(null);
    setWState("processing");
    try {
      const amt = mode === "claim" ? claimableAmount : burnableAmount;
      if (mode === "claim" && onClaim) await onClaim(amt);
      else if (mode === "burn" && onBurn) await onBurn(amt);
      else await new Promise((r) => setTimeout(r, 1800));
      setTxHash("0x" + Math.random().toString(16).slice(2, 18).toUpperCase());
      setWState("connected");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Transaction failed");
      setWState("connected");
    }
  }, [mode, claimableAmount, burnableAmount, onClaim, onBurn]);

  const isProcessing   = effective === "processing";
  const isDisconnected = effective === "disconnected" || effective === "connecting";
  const isClaim        = mode === "claim";
  const actionColor    = isClaim
    ? "bg-emerald-500 hover:bg-emerald-400 shadow-emerald-500/40"
    : "bg-rose-500 hover:bg-rose-400 shadow-rose-500/40";

  return (
    <section
      aria-label="Claim and Burn"
      className="w-full max-w-sm mx-auto rounded-2xl bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] p-6 flex flex-col gap-5 shadow-2xl"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-white font-bold text-lg tracking-tight">
          {isClaim ? "Claim Rewards" : "Burn Tokens"}
        </h2>
        <StatusBadge walletState={effective} />
      </div>

      <ModeToggle mode={mode} onChange={setMode} disabled={isProcessing} />

      <AmountDisplay
        label={isClaim ? "Available to Claim" : "Available to Burn"}
        amount={isClaim ? claimableAmount : burnableAmount}
        symbol={tokenSymbol}
        accent={isClaim ? "text-emerald-400" : "text-rose-400"}
      />

      <div className="rounded-xl bg-white/5 border border-white/10 p-3 text-xs text-white/50 leading-relaxed">
        {isClaim
          ? "Claiming transfers earned rewards to your connected wallet. Gas fees apply."
          : "Burning permanently removes tokens from circulation, reducing total supply."}
      </div>

      {error && (
        <div
          role="alert"
          aria-live="assertive"
          className="rounded-xl bg-rose-500/10 border border-rose-500/30 px-4 py-3 text-sm text-rose-400"
        >
          ⚠ {error}
        </div>
      )}

      {txHash && !error && (
        <div
          role="status"
          aria-live="polite"
          className="rounded-xl bg-emerald-500/10 border border-emerald-500/30 px-4 py-3 text-xs text-emerald-400 break-all"
        >
          ✓ Transaction submitted: <span className="font-mono">{txHash}</span>
        </div>
      )}

      {isDisconnected ? (
        <button
          type="button"
          onClick={handleConnect}
          disabled={effective === "connecting"}
          aria-label="Connect wallet to continue"
          className={[
            "w-full rounded-xl py-3.5 text-sm font-bold text-white transition-all duration-200",
            "bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/30",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400",
            effective === "connecting" ? "opacity-70 cursor-not-allowed" : "",
          ].join(" ")}
        >
          <span className="flex items-center justify-center gap-2">
            {effective === "connecting" && <Spinner />}
            {effective === "connecting" ? "Connecting Wallet…" : "Connect Wallet"}
          </span>
        </button>
      ) : (
        <button
          type="button"
          onClick={handleAction}
          disabled={isProcessing}
          aria-label={isClaim ? "Claim available rewards" : "Burn tokens"}
          aria-busy={isProcessing}
          className={[
            "w-full rounded-xl py-3.5 text-sm font-bold text-white transition-all duration-200 shadow-lg",
            actionColor,
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60",
            isProcessing ? "opacity-70 cursor-not-allowed" : "",
          ].join(" ")}
        >
          <span className="flex items-center justify-center gap-2">
            {isProcessing && <Spinner />}
            {isProcessing
              ? isClaim ? "Claiming…" : "Burning…"
              : isClaim ? "Claim Rewards" : "Burn Tokens"}
          </span>
        </button>
      )}
    </section>
  );
}

export { ClaimBurn };
