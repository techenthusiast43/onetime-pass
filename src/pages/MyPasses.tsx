import React, { useState, useEffect } from "react";
import {
  Ticket,
  Clock,
  Trash2,
  Copy,
  Check,
  ExternalLink,
  QrCode,
  RefreshCw,
  AlertCircle,
  Loader2,
  ShieldAlert,
  Wallet,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useAccount } from "wagmi";
import { useAppKit } from "@reown/appkit/react";
import { PassRecord, PassStatus } from "../config/contract";
import { fetchCreatorPasses, revokePassOnChain } from "../services/contractService";
import { shortenHash, formatTimestamp } from "../utils/crypto";

export const MyPasses: React.FC = () => {
  const { address, isConnected, chainId } = useAccount();
  const { open } = useAppKit();

  const [passes, setPasses] = useState<PassRecord[]>([]);
  const [filter, setFilter] = useState<string>("all");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [qrModalPass, setQrModalPass] = useState<PassRecord | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(
    null
  );

  const loadPasses = async () => {
    if (!address) return;
    setIsLoading(true);
    setStatusMsg(null);
    try {
      const data = await fetchCreatorPasses(address);
      setPasses(data);
    } catch (err: any) {
      console.error("Failed to load creator passes:", err);
      setStatusMsg({
        type: "error",
        text: "Could not load passes from BOT Chain: " + (err.message || err),
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isConnected && address) {
      loadPasses();
    } else {
      setPasses([]);
    }
  }, [isConnected, address]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleRevoke = async (passId: string) => {
    const confirmRevoke = window.confirm(
      "Are you sure you want to revoke this pass? This cannot be undone and the pass will be permanently invalidated."
    );
    if (!confirmRevoke) return;

    setRevokingId(passId);
    setStatusMsg(null);

    try {
      const result = await revokePassOnChain(passId);
      setStatusMsg({
        type: "success",
        text: `Pass successfully revoked on-chain! Tx: ${shortenHash(result.txHash)}`,
      });
      // Refresh passes list
      await loadPasses();
    } catch (err: any) {
      console.error("Revocation failed:", err);
      setStatusMsg({
        type: "error",
        text: "Revocation failed: " + (err.message || err),
      });
    } finally {
      setRevokingId(null);
    }
  };

  const filteredPasses = passes.filter((p) => {
    if (filter === "all") return true;
    if (filter === "active") return p.status === PassStatus.Active;
    if (filter === "redeemed") return p.status === PassStatus.Redeemed;
    if (filter === "revoked") return p.status === PassStatus.Revoked;
    if (filter === "expired") return p.status === PassStatus.Expired;
    return true;
  });

  const getStatusBadge = (status: PassStatus) => {
    switch (status) {
      case PassStatus.Active:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-950/70 text-emerald-400 border border-emerald-800">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            Active
          </span>
        );
      case PassStatus.Redeemed:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-950/70 text-purple-400 border border-purple-800">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span>
            Redeemed
          </span>
        );
      case PassStatus.Revoked:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-950/70 text-rose-400 border border-rose-800">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
            Revoked
          </span>
        );
      case PassStatus.Expired:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-950/70 text-amber-400 border border-amber-800">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
            Expired
          </span>
        );
      default:
        return null;
    }
  };

  const explorerUrl =
    chainId === 677 ? "https://scan.botchain.ai" : "https://scan.bohr.life";

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight">My Created Passes</h2>
          <p className="text-sm text-slate-400 mt-1">
            Manage, share, and revoke passes created by your connected wallet.
          </p>
        </div>

        {isConnected && (
          <button
            onClick={loadPasses}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-medium transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
            <span>Refresh Passes</span>
          </button>
        )}
      </div>

      {/* Disconnected State */}
      {!isConnected ? (
        <div className="p-8 sm:p-12 text-center rounded-3xl bg-slate-900/60 border border-slate-800">
          <div className="w-16 h-16 rounded-2xl bg-cyan-950/60 border border-cyan-800/80 flex items-center justify-center mx-auto text-cyan-400 mb-4">
            <Wallet className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Connect Your Wallet</h3>
          <p className="text-sm text-slate-400 max-w-md mx-auto mb-6">
            Connect your wallet to retrieve and manage the passes you have created on BOT Chain.
          </p>
          <button
            onClick={() => open()}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-medium text-sm shadow-lg shadow-cyan-500/25 transition-all"
          >
            <Wallet className="w-4 h-4" />
            <span>Connect Wallet</span>
          </button>
        </div>
      ) : (
        <>
          {/* Status Message */}
          {statusMsg && (
            <div
              className={`mb-6 p-4 rounded-2xl border text-xs flex items-center gap-3 ${
                statusMsg.type === "success"
                  ? "bg-emerald-950/40 border-emerald-800 text-emerald-300"
                  : "bg-rose-950/40 border-rose-800 text-rose-300"
              }`}
            >
              {statusMsg.type === "success" ? (
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              )}
              <span>{statusMsg.text}</span>
            </div>
          )}

          {/* Filter Tabs */}
          <div className="flex flex-wrap items-center gap-2 mb-6">
            {[
              { id: "all", label: `All (${passes.length})` },
              {
                id: "active",
                label: `Active (${passes.filter((p) => p.status === PassStatus.Active).length})`,
              },
              {
                id: "redeemed",
                label: `Redeemed (${passes.filter((p) => p.status === PassStatus.Redeemed).length})`,
              },
              {
                id: "revoked",
                label: `Revoked (${passes.filter((p) => p.status === PassStatus.Revoked).length})`,
              },
              {
                id: "expired",
                label: `Expired (${passes.filter((p) => p.status === PassStatus.Expired).length})`,
              },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setFilter(t.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                  filter === t.id
                    ? "bg-cyan-500/10 border-cyan-500 text-cyan-400"
                    : "bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Passes Grid */}
          {isLoading && passes.length === 0 ? (
            <div className="py-20 text-center text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-cyan-400 mb-3" />
              <p className="text-sm">Querying BOT Chain smart contract...</p>
            </div>
          ) : filteredPasses.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-slate-900/30 border border-slate-800">
              <Ticket className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <h4 className="text-base font-semibold text-slate-300">No Passes Found</h4>
              <p className="text-xs text-slate-500 mt-1">
                {filter === "all"
                  ? "You haven't created any passes yet on this wallet."
                  : `No passes found matching filter '${filter}'.`}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredPasses.map((pass) => {
                const isActive = pass.status === PassStatus.Active;
                return (
                  <div
                    key={pass.passId}
                    className="flex flex-col justify-between p-6 rounded-3xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition-all shadow-lg hover:shadow-cyan-950/20"
                  >
                    <div>
                      {/* Top Row: Status & QR Trigger */}
                      <div className="flex items-center justify-between mb-3">
                        {getStatusBadge(pass.status)}
                        <button
                          onClick={() => setQrModalPass(pass)}
                          className="flex items-center gap-1 text-[11px] text-cyan-400 hover:text-cyan-300 transition-colors"
                          title="Show QR Code"
                        >
                          <QrCode className="w-3.5 h-3.5" />
                          <span>QR</span>
                        </button>
                      </div>

                      {/* Title */}
                      <h4 className="text-lg font-bold text-white mb-2 line-clamp-1">
                        {pass.title || "Untitled Pass"}
                      </h4>

                      {/* Pass ID with copy */}
                      <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/80 mb-4">
                        <div className="flex items-center justify-between text-[10px] text-slate-400 mb-0.5">
                          <span>Pass ID</span>
                          <button
                            onClick={() => copyToClipboard(pass.passId)}
                            className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                          >
                            {copiedId === pass.passId ? (
                              <Check className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                            <span>{copiedId === pass.passId ? "Copied" : "Copy"}</span>
                          </button>
                        </div>
                        <span className="font-mono text-xs text-slate-300 select-all block truncate">
                          {pass.passId}
                        </span>
                      </div>

                      {/* Expiry Details */}
                      <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mb-2">
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                        <span>Expiry: {formatTimestamp(pass.expiry)}</span>
                      </div>
                    </div>

                    {/* Bottom Actions */}
                    <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between">
                      <button
                        onClick={() => setQrModalPass(pass)}
                        className="text-xs text-slate-300 hover:text-white font-medium"
                      >
                        View Details
                      </button>

                      {isActive && (
                        <button
                          onClick={() => handleRevoke(pass.passId)}
                          disabled={revokingId === pass.passId}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-950/40 hover:bg-rose-900/50 border border-rose-800/80 text-rose-300 text-xs font-medium transition-colors disabled:opacity-50"
                        >
                          {revokingId === pass.passId ? (
                            <>
                              <Loader2 className="w-3 h-3 animate-spin" />
                              <span>Revoking...</span>
                            </>
                          ) : (
                            <>
                              <Trash2 className="w-3 h-3" />
                              <span>Revoke</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* QR Code Inspection Modal */}
      {qrModalPass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl text-center">
            <h3 className="text-xl font-bold text-white mb-1">
              {qrModalPass.title || "Untitled Pass"}
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Status: {qrModalPass.statusLabel} • Expiry: {formatTimestamp(qrModalPass.expiry)}
            </p>

            <div className="bg-white p-4 rounded-2xl inline-block shadow-inner mb-4">
              <QRCodeSVG value={qrModalPass.passId} size={200} level="H" />
            </div>

            <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 mb-4 text-left">
              <span className="block text-[10px] text-slate-400 mb-1">Pass ID</span>
              <p className="font-mono text-xs text-slate-300 break-all select-all">
                {qrModalPass.passId}
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => copyToClipboard(qrModalPass.passId)}
                className="flex-1 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold transition-colors"
              >
                {copiedId === qrModalPass.passId ? "Copied!" : "Copy Pass ID"}
              </button>
              <button
                onClick={() => setQrModalPass(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

