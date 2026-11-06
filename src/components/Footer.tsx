import React from "react";
import { ExternalLink, ShieldCheck, Terminal, HelpCircle } from "lucide-react";
import { CONTRACT_ADDRESS } from "../config/contract";
import { shortenHash } from "../utils/crypto";

export const Footer: React.FC = () => {
  return (
    <footer className="mt-20 border-t border-slate-900 bg-slate-950/90 py-12 text-slate-400 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          {/* Col 1: Brand */}
          <div className="space-y-3 md:col-span-1">
            <div className="flex items-center gap-2 text-white font-bold text-base">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400"></span>
              <span>OneTimePass</span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed">
              Decentralized single-use digital ticketing, voucher issuance, and cryptographic pass verification on BOT Chain.
            </p>
            <div className="text-[11px] text-slate-500">
              Contract: <span className="font-mono text-slate-300">{shortenHash(CONTRACT_ADDRESS, 6, 4)}</span>
            </div>
          </div>

          {/* Col 2: BOT Chain Testnet Specs */}
          <div className="space-y-2">
            <h4 className="font-semibold text-slate-200 uppercase tracking-wider text-[11px]">
              BOT Chain Testnet
            </h4>
            <ul className="space-y-1.5 text-slate-400">
              <li>
                <span className="text-slate-500">Chain ID:</span> <span className="text-slate-300 font-mono">968 (0x3c8)</span>
              </li>
              <li>
                <span className="text-slate-500">RPC:</span> <span className="text-slate-300 font-mono text-[11px]">https://rpc.bohr.life</span>
              </li>
              <li>
                <span className="text-slate-500">Native Token:</span> <span className="text-emerald-400 font-semibold">BOT</span>
              </li>
              <li>
                <span className="text-slate-500">Total Supply:</span> <span className="text-slate-300">150 Million</span>
              </li>
            </ul>
          </div>

          {/* Col 3: Official Links */}
          <div className="space-y-2">
            <h4 className="font-semibold text-slate-200 uppercase tracking-wider text-[11px]">
              Block Explorers
            </h4>
            <ul className="space-y-1.5">
              <li>
                <a
                  href="https://scan.bohr.life/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-cyan-400 flex items-center gap-1 transition-colors"
                >
                  <span>BohrScan (Testnet)</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>
                <a
                  href="https://scan.botchain.ai/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-cyan-400 flex items-center gap-1 transition-colors"
                >
                  <span>BotScan (Mainnet)</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>
                <a
                  href="https://faucet.botchain.ai"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-cyan-400 flex items-center gap-1 transition-colors"
                >
                  <span>Testnet Faucet</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
            </ul>
          </div>

          {/* Col 4: Security & Guarantee */}
          <div className="space-y-2">
            <h4 className="font-semibold text-slate-200 uppercase tracking-wider text-[11px]">
              Security Guarantees
            </h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Passes are strictly single-use. Redemption irreversibly transitions state from Active to Redeemed on the blockchain. Double redemptions are rejected.
            </p>
            <div className="flex items-center gap-1.5 text-emerald-400 font-medium text-[11px] pt-1">
              <ShieldCheck className="w-4 h-4" />
              <span>Cryptographically Verifiable</span>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
          <p>© {new Date().getFullYear()} OneTimePass dApp. Built for BOT Chain ecosystem.</p>
          <p>No fake blockchain data • Real-time on-chain confirmation</p>
        </div>
      </div>
    </footer>
  );
};

