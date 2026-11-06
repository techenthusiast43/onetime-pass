import React from "react";
import { Ticket, Wallet, ExternalLink, Network, CheckCircle2, AlertCircle } from "lucide-react";
import { useAccount, useDisconnect } from "wagmi";
import { useAppKit } from "@reown/appkit/react";
import { switchOrAddBotChain } from "../config/chains";
import { shortenHash } from "../utils/crypto";

interface NavbarProps {
  currentTab: "home" | "create" | "my-passes" | "redeem";
  setCurrentTab: (tab: "home" | "create" | "my-passes" | "redeem") => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, setCurrentTab }) => {
  const { address, isConnected, chainId } = useAccount();
  const { disconnect } = useDisconnect();
  const { open } = useAppKit();

  const isBotChain = chainId === 968 || chainId === 677;

  const handleSwitchNetwork = async () => {
    try {
      await switchOrAddBotChain(968);
    } catch (err: any) {
      alert("Failed to switch network: " + (err.message || err));
    }
  };

  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-slate-950/80 border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo & Brand */}
          <div
            onClick={() => setCurrentTab("home")}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform">
              <Ticket className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent tracking-tight">
                  OneTimePass
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800">
                  BOT Chain
                </span>
              </div>
              <p className="text-xs text-slate-400">Single-Use Digital Ticket Verifier</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-900/60 p-1.5 rounded-2xl border border-slate-800/80">
            <button
              onClick={() => setCurrentTab("home")}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                currentTab === "home"
                  ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 shadow-sm"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setCurrentTab("create")}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                currentTab === "create"
                  ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 shadow-sm"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
              }`}
            >
              Create Pass
            </button>
            <button
              onClick={() => setCurrentTab("my-passes")}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                currentTab === "my-passes"
                  ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 shadow-sm"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
              }`}
            >
              My Passes
            </button>
            <button
              onClick={() => setCurrentTab("redeem")}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                currentTab === "redeem"
                  ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 shadow-sm"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
              }`}
            >
              Redeem / Verify
            </button>
          </nav>

          {/* Network & Wallet Controls */}
          <div className="flex items-center gap-3">
            {/* BOT Chain Network Status */}
            {isConnected && (
              <div className="hidden sm:flex items-center">
                {isBotChain ? (
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-950/40 border border-emerald-800/50 text-emerald-400 text-xs">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span>BOT Chain (968)</span>
                  </div>
                ) : (
                  <button
                    onClick={handleSwitchNetwork}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-950/50 border border-amber-800 text-amber-300 text-xs hover:bg-amber-900/50 transition-colors"
                    title="Switch to BOT Chain Testnet"
                  >
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>Switch to BOT Chain</span>
                  </button>
                )}
              </div>
            )}

            {/* Wallet Action Button */}
            {isConnected && address ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => open()}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-sm font-medium transition-all shadow-sm"
                >
                  <div className="w-2.5 h-2.5 rounded-full bg-cyan-400"></div>
                  <span>{shortenHash(address, 4, 4)}</span>
                </button>
                <button
                  onClick={() => disconnect()}
                  className="p-2 rounded-xl bg-slate-900 hover:bg-rose-950/40 hover:text-rose-400 border border-slate-800 text-slate-400 text-xs transition-colors"
                  title="Disconnect Wallet"
                >
                  Disconnect
                </button>
              </div>
            ) : (
              <button
                onClick={() => open()}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-medium text-sm shadow-lg shadow-cyan-500/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <Wallet className="w-4 h-4" />
                <span>Connect Wallet</span>
              </button>
            )}
          </div>
        </div>

        {/* Mobile Navigation Bar */}
        <div className="flex md:hidden border-t border-slate-800/60 py-2.5 justify-around">
          <button
            onClick={() => setCurrentTab("home")}
            className={`text-xs font-medium py-1 px-2 rounded-lg ${
              currentTab === "home" ? "text-cyan-400 bg-slate-900" : "text-slate-400"
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setCurrentTab("create")}
            className={`text-xs font-medium py-1 px-2 rounded-lg ${
              currentTab === "create" ? "text-cyan-400 bg-slate-900" : "text-slate-400"
            }`}
          >
            Create Pass
          </button>
          <button
            onClick={() => setCurrentTab("my-passes")}
            className={`text-xs font-medium py-1 px-2 rounded-lg ${
              currentTab === "my-passes" ? "text-cyan-400 bg-slate-900" : "text-slate-400"
            }`}
          >
            My Passes
          </button>
          <button
            onClick={() => setCurrentTab("redeem")}
            className={`text-xs font-medium py-1 px-2 rounded-lg ${
              currentTab === "redeem" ? "text-cyan-400 bg-slate-900" : "text-slate-400"
            }`}
          >
            Redeem
          </button>
        </div>
      </div>
    </header>
  );
};

