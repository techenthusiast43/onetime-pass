import React from "react";
import {
  Ticket,
  ShieldCheck,
  Zap,
  QrCode,
  ArrowRight,
  Lock,
  RefreshCw,
  Coins,
  Cpu,
  CheckCircle2,
} from "lucide-react";

interface HomeProps {
  setCurrentTab: (tab: "home" | "create" | "my-passes" | "redeem") => void;
}

export const Home: React.FC<HomeProps> = ({ setCurrentTab }) => {
  return (
    <div className="space-y-16 py-8">
      {/* Hero Section */}
      <section className="relative text-center max-w-4xl mx-auto px-4 sm:px-6">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-950/60 border border-cyan-800/80 text-cyan-300 text-xs font-semibold uppercase tracking-wider mb-6 backdrop-blur-sm">
          <Zap className="w-3.5 h-3.5 text-cyan-400" />
          <span>Deployed on BOT Chain Layer 1</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white leading-tight">
          Single-Use Digital Passes{" "}
          <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500 bg-clip-text text-transparent">
            Guaranteed On-Chain
          </span>
        </h1>

        <p className="mt-6 text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
          Create, issue, and verify cryptographic passes that can only ever be redeemed once. 
          Zero double-spend, verifiable on-chain state, and minimal gas consumption.
        </p>

        {/* Quick Action CTA Buttons */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={() => setCurrentTab("create")}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold text-base shadow-xl shadow-cyan-500/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Ticket className="w-5 h-5" />
            <span>Create Pass</span>
            <ArrowRight className="w-4 h-4 ml-1" />
          </button>

          <button
            onClick={() => setCurrentTab("redeem")}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-slate-200 font-semibold text-base shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <ShieldCheck className="w-5 h-5 text-cyan-400" />
            <span>Verify & Redeem Pass</span>
          </button>
        </div>

        {/* Network Metrics Pill */}
        <div className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl mx-auto p-4 rounded-2xl bg-slate-900/40 border border-slate-800/80 backdrop-blur-md">
          <div className="p-2">
            <span className="block text-xs text-slate-400 font-medium">Target Network</span>
            <span className="text-sm font-bold text-white">BOT Chain Testnet</span>
          </div>
          <div className="p-2">
            <span className="block text-xs text-slate-400 font-medium">Chain ID</span>
            <span className="text-sm font-bold text-cyan-400">968 (0x3c8)</span>
          </div>
          <div className="p-2">
            <span className="block text-xs text-slate-400 font-medium">Gas Token</span>
            <span className="text-sm font-bold text-emerald-400">BOT (18 Decimals)</span>
          </div>
          <div className="p-2">
            <span className="block text-xs text-slate-400 font-medium">Block Time</span>
            <span className="text-sm font-bold text-indigo-400">~1-2 Seconds</span>
          </div>
        </div>
      </section>

      {/* Value Pillars */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-all hover:-translate-y-1">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-4">
              <Lock className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Cryptographic Entropy</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Pass IDs are generated using the Web Cryptography API (`crypto.getRandomValues`) with 256 bits of entropy. No sequential IDs or guessable vouchers.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-all hover:-translate-y-1">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-4">
              <RefreshCw className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Single-Use Guarantee</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Strict on-chain state machine: Once a pass transitions to Redeemed or Revoked, the contract irreversibly locks it. Duplicate redemptions are rejected.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-all hover:-translate-y-1">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-4">
              <Cpu className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Gas-Packed Storage</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Optimized Solidity storage packing creator address (20B), status byte (1B), and expiry uint64 (8B) into a single 32-byte EVM storage slot.
            </p>
          </div>
        </div>
      </section>

      {/* Usage Guide */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="p-8 sm:p-10 rounded-3xl bg-gradient-to-b from-slate-900/90 to-slate-950/90 border border-slate-800 shadow-xl">
          <div className="text-center max-w-xl mx-auto mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-white">How OneTimePass Works</h2>
            <p className="text-sm text-slate-400 mt-2">
              Three seamless steps from cryptographic creation to on-chain redemption.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Step 1 */}
            <div className="flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-2xl bg-cyan-950 border border-cyan-800 flex items-center justify-center text-cyan-400 font-bold text-xl mb-4 shadow-lg shadow-cyan-950/50">
                1
              </div>
              <h4 className="text-base font-semibold text-white mb-2">Generate & Create</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Connect your BOT Chain wallet. The app generates a 256-bit ID. Add an optional title and expiry date, then submit the creation transaction.
              </p>
            </div>

            {/* Step 2 */}
            <div className="flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-2xl bg-blue-950 border border-blue-800 flex items-center justify-center text-blue-400 font-bold text-xl mb-4 shadow-lg shadow-blue-950/50">
                2
              </div>
              <h4 className="text-base font-semibold text-white mb-2">Share QR Code</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Export or display the cryptographic QR code. Share it with your guest, customer, or attendee for event access, meal voucher, or access badge.
              </p>
            </div>

            {/* Step 3 */}
            <div className="flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-2xl bg-indigo-950 border border-indigo-800 flex items-center justify-center text-indigo-400 font-bold text-xl mb-4 shadow-lg shadow-indigo-950/50">
                3
              </div>
              <h4 className="text-base font-semibold text-white mb-2">Verify & Redeem</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Scan the QR code or enter the pass ID. View live on-chain status and execute the single-use redemption on BOT Chain.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

