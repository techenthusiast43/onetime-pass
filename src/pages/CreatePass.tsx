import React, { useState, useEffect } from "react";
import {
  Ticket,
  Sparkles,
  Calendar,
  Clock,
  QrCode,
  Copy,
  Check,
  ExternalLink,
  Loader2,
  AlertCircle,
  Download,
  Wallet,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useAccount } from "wagmi";
import { useAppKit } from "@reown/appkit/react";
import { generateSecurePassId, isValidBytes32, shortenHash } from "../utils/crypto";
import { createPassOnChain } from "../services/contractService";
import { switchOrAddBotChain } from "../config/chains";

export const CreatePass: React.FC = () => {
  const { address, isConnected, chainId } = useAccount();
  const { open } = useAppKit();

  const [passId, setPassId] = useState<string>("");
  const [title, setTitle] = useState<string>("");
  const [expiryPreset, setExpiryPreset] = useState<string>("none");
  const [customExpiry, setCustomExpiry] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<boolean>(false);

  // Success state after on-chain confirmation
  const [createdPassData, setCreatedPassData] = useState<{
    passId: string;
    title: string;
    expiryTimestamp: number;
    txHash: string;
    blockNumber: number;
  } | null>(null);

  // Initialize with a secure random ID on mount
  useEffect(() => {
    handleRegenerateId();
  }, []);

  const handleRegenerateId = () => {
    try {
      const newId = generateSecurePassId();
      setPassId(newId);
      setErrorMsg(null);
    } catch (err: any) {
      setErrorMsg("Failed to generate random ID: " + err.message);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  // Calculate unix timestamp based on preset or custom input
  const calculateExpiryTimestamp = (): number => {
    if (expiryPreset === "none") return 0;
    const now = Math.floor(Date.now() / 1000);

    if (expiryPreset === "1h") return now + 3600;
    if (expiryPreset === "1d") return now + 86400;
    if (expiryPreset === "7d") return now + 86400 * 7;
    if (expiryPreset === "30d") return now + 86400 * 30;

    if (expiryPreset === "custom" && customExpiry) {
      const selectedTime = Math.floor(new Date(customExpiry).getTime() / 1000);
      return Math.max(0, selectedTime);
    }

    return 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!isConnected) {
      open();
      return;
    }

    if (chainId !== 968 && chainId !== 677) {
      try {
        await switchOrAddBotChain(968);
      } catch (err: any) {
        setErrorMsg("Please switch your wallet to BOT Chain to create a pass.");
        return;
      }
    }

    if (!isValidBytes32(passId)) {
      setErrorMsg("Invalid pass ID format. Must be a 32-byte hex string (0x...).");
      return;
    }

    const expiryTs = calculateExpiryTimestamp();
    const currentTs = Math.floor(Date.now() / 1000);

    if (expiryTs > 0 && expiryTs <= currentTs) {
      setErrorMsg("Expiry timestamp must be in the future.");
      return;
    }

    setIsLoading(true);

    try {
      const result = await createPassOnChain(passId, title.trim(), expiryTs);
      setCreatedPassData({
        passId,
        title: title.trim() || "Untitled Pass",
        expiryTimestamp: expiryTs,
        txHash: result.txHash,
        blockNumber: result.blockNumber,
      });
    } catch (err: any) {
      console.error("Pass creation failed:", err);
      let message = err.message || "Failed to create pass on-chain.";
      if (err.info?.error?.message) {
        message = err.info.error.message;
      }
      if (message.includes("PassAlreadyExists")) {
        message = "This pass ID already exists on-chain. Please generate a fresh ID.";
      }
      setErrorMsg(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadQr = () => {
    const svg = document.getElementById("created-pass-qr-svg");
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width + 40;
      canvas.height = img.height + 40;
      if (ctx) {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 20, 20);
        const pngFile = canvas.toDataURL("image/png");
        const downloadLink = document.createElement("a");
        downloadLink.download = `OneTimePass-${shortenHash(createdPassData?.passId || "pass", 6, 4)}.png`;
        downloadLink.href = pngFile;
        downloadLink.click();
      }
    };
    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
  };

  const explorerUrl =
    chainId === 677 ? "https://scan.botchain.ai" : "https://scan.bohr.life";

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto mb-10">
        <h2 className="text-3xl font-bold text-white tracking-tight">Create One-Time Pass</h2>
        <p className="text-sm text-slate-400 mt-2">
          Generate a cryptographically random pass ID and register it on BOT Chain.
        </p>
      </div>

      {!isConnected ? (
        /* Disconnected State */
        <div className="p-8 sm:p-12 text-center rounded-3xl bg-slate-900/60 border border-slate-800">
          <div className="w-16 h-16 rounded-2xl bg-cyan-950/60 border border-cyan-800/80 flex items-center justify-center mx-auto text-cyan-400 mb-4">
            <Wallet className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Connect Your Wallet</h3>
          <p className="text-sm text-slate-400 max-w-md mx-auto mb-6">
            Please connect your BOT Chain wallet (MetaMask or Web3 wallet) to deploy your single-use pass on-chain.
          </p>
          <button
            onClick={() => open()}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-medium text-sm shadow-lg shadow-cyan-500/25 transition-all"
          >
            <Wallet className="w-4 h-4" />
            <span>Connect Wallet Now</span>
          </button>
        </div>
      ) : createdPassData ? (
        /* Success State: Pass Created */
        <div className="p-8 sm:p-10 rounded-3xl bg-slate-900 border border-emerald-500/30 shadow-2xl relative overflow-hidden animate-fade-in">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

          <div className="flex flex-col md:flex-row items-center gap-8">
            {/* QR Code Container */}
            <div className="flex flex-col items-center bg-white p-5 rounded-3xl shadow-xl shrink-0">
              <QRCodeSVG
                id="created-pass-qr-svg"
                value={createdPassData.passId}
                size={220}
                level="H"
                includeMargin={false}
              />
              <span className="text-[11px] font-bold text-slate-800 mt-3 uppercase tracking-wider">
                Scan with OneTimePass
              </span>
            </div>

            {/* Pass Metadata & Actions */}
            <div className="flex-1 space-y-4 w-full">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-800 text-emerald-400 text-xs font-semibold">
                <Check className="w-3.5 h-3.5" />
                <span>Pass Confirmed on BOT Chain (Block #{createdPassData.blockNumber})</span>
              </div>

              <h3 className="text-2xl font-bold text-white">
                {createdPassData.title || "Untitled Pass"}
              </h3>

              {/* Pass ID with copy */}
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                  <span>Cryptographic Pass ID (bytes32)</span>
                  <button
                    onClick={() => copyToClipboard(createdPassData.passId)}
                    className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300"
                  >
                    {copiedId ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedId ? "Copied!" : "Copy ID"}</span>
                  </button>
                </div>
                <div className="font-mono text-xs text-slate-200 break-all select-all">
                  {createdPassData.passId}
                </div>
              </div>

              {/* Expiry Details */}
              <div className="text-xs text-slate-300 flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-400" />
                <span>
                  Expiry:{" "}
                  {createdPassData.expiryTimestamp === 0
                    ? "Never (Permanent until redeemed)"
                    : new Date(createdPassData.expiryTimestamp * 1000).toLocaleString()}
                </span>
              </div>

              {/* Explorer Link */}
              <div className="pt-2">
                <a
                  href={`${explorerUrl}/tx/${createdPassData.txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 hover:underline"
                >
                  <span>View Transaction on BOT Chain Explorer</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3 pt-3">
                <button
                  onClick={handleDownloadQr}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-xs shadow-md transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>Download QR Image</span>
                </button>
                <button
                  onClick={() => {
                    setCreatedPassData(null);
                    setTitle("");
                    handleRegenerateId();
                  }}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs transition-colors"
                >
                  <span>Create Another Pass</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Form State */
        <form
          onSubmit={handleSubmit}
          className="p-6 sm:p-10 rounded-3xl bg-slate-900/70 border border-slate-800 shadow-xl space-y-6"
        >
          {/* Pass ID (Secure Randomly Generated) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                <span>Pass ID (256-bit Entropy)</span>
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-950 text-emerald-400 border border-emerald-800">
                  Secure PRNG
                </span>
              </label>
              <button
                type="button"
                onClick={handleRegenerateId}
                disabled={isLoading}
                className="flex items-center gap-1.5 text-xs font-medium text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Regenerate ID</span>
              </button>
            </div>
            <div className="relative">
              <input
                type="text"
                value={passId}
                readOnly
                className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 font-mono text-xs select-all focus:outline-none focus:ring-1 focus:ring-cyan-500"
              />
              <button
                type="button"
                onClick={() => copyToClipboard(passId)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-white"
                title="Copy Pass ID"
              >
                {copiedId ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[11px] text-slate-400">
              Generated securely in your browser using `window.crypto.getRandomValues`. Never predictable.
            </p>
          </div>

          {/* Pass Title */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-200">
              Pass Title <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. VIP Backstage Access, 50% Off Coupon, Guest Badge #12"
              maxLength={80}
              disabled={isLoading}
              className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>

          {/* Expiry Timestamp Selection */}
          <div className="space-y-3">
            <label className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-cyan-400" />
              <span>Pass Expiry</span>
            </label>

            {/* Presets Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {[
                { id: "none", label: "No Expiry" },
                { id: "1h", label: "+1 Hour" },
                { id: "1d", label: "+1 Day" },
                { id: "7d", label: "+7 Days" },
                { id: "custom", label: "Custom Date" },
              ].map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => setExpiryPreset(preset.id)}
                  className={`py-2 px-3 rounded-xl text-xs font-medium border transition-all ${
                    expiryPreset === preset.id
                      ? "bg-cyan-500/10 border-cyan-500 text-cyan-400 shadow-sm"
                      : "bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            {/* Custom Expiry Input */}
            {expiryPreset === "custom" && (
              <div className="pt-2">
                <input
                  type="datetime-local"
                  value={customExpiry}
                  onChange={(e) => setCustomExpiry(e.target.value)}
                  disabled={isLoading}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
            )}
          </div>

          {/* Error Message Alert */}
          {errorMsg && (
            <div className="flex items-start gap-2.5 p-4 rounded-2xl bg-rose-950/40 border border-rose-800/80 text-rose-300 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold block">Creation Error:</span>
                <span>{errorMsg}</span>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 text-white font-semibold text-base shadow-xl shadow-cyan-500/25 flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.99]"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Submitting Transaction to BOT Chain...</span>
                </>
              ) : (
                <>
                  <Ticket className="w-5 h-5" />
                  <span>Create Pass On-Chain</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

