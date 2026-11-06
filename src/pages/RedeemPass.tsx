import React, { useState, useEffect } from "react";
import {
  ShieldCheck,
  Camera,
  Search,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  ExternalLink,
  Loader2,
  User,
  Ticket,
  Wallet,
} from "lucide-react";
import { useAccount } from "wagmi";
import { useAppKit } from "@reown/appkit/react";
import { fetchPassDetails, redeemPassOnChain } from "../services/contractService";
import { PassRecord, PassStatus } from "../config/contract";
import { isValidBytes32, shortenHash, formatTimestamp } from "../utils/crypto";
import { QrScannerModal } from "../components/QrScannerModal";
import { switchOrAddBotChain } from "../config/chains";

export const RedeemPass: React.FC = () => {
  const { address, isConnected, chainId } = useAccount();
  const { open } = useAppKit();

  const [inputPassId, setInputPassId] = useState<string>("");
  const [isScannerOpen, setIsScannerOpen] = useState<boolean>(false);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [isRedeeming, setIsRedeeming] = useState<boolean>(false);
  const [passData, setPassData] = useState<PassRecord | null>(null);
  const [searchedId, setSearchedId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Success state after transaction confirmation
  const [redeemedResult, setRedeemedResult] = useState<{
    txHash: string;
    blockNumber: number;
  } | null>(null);

  // Auto-verify when a valid 64-character hex ID is entered
  useEffect(() => {
    const clean = inputPassId.trim();
    if (isValidBytes32(clean) && clean !== searchedId) {
      handleVerify(clean);
    }
  }, [inputPassId]);

  const handleVerify = async (idToVerify?: string) => {
    const targetId = (idToVerify || inputPassId).trim();
    setErrorMsg(null);
    setRedeemedResult(null);

    if (!isValidBytes32(targetId)) {
      setErrorMsg("Please enter a valid 32-byte pass ID (e.g. 0x followed by 64 hex characters).");
      setPassData(null);
      return;
    }

    setIsVerifying(true);
    setSearchedId(targetId);

    try {
      const details = await fetchPassDetails(targetId);
      if (!details) {
        setPassData(null);
        setErrorMsg("Pass not found on BOT Chain smart contract. Check the ID.");
      } else {
        setPassData(details);
      }
    } catch (err: any) {
      console.error("Verification failed:", err);
      setErrorMsg("Failed to query BOT Chain: " + (err.message || err));
      setPassData(null);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleRedeem = async () => {
    if (!passData) return;
    setErrorMsg(null);

    if (!isConnected) {
      open();
      return;
    }

    if (chainId !== 968 && chainId !== 677) {
      try {
        await switchOrAddBotChain(968);
      } catch (err: any) {
        setErrorMsg("Please switch your wallet to BOT Chain to redeem this pass.");
        return;
      }
    }

    // In v1, only creator can redeem
    if (address && passData.creator.toLowerCase() !== address.toLowerCase()) {
      setErrorMsg("For Version 1, only the pass creator can redeem this pass.");
      return;
    }

    if (passData.status !== PassStatus.Active) {
      setErrorMsg(`Cannot redeem pass with status: ${passData.statusLabel}`);
      return;
    }

    setIsRedeeming(true);

    try {
      const result = await redeemPassOnChain(passData.passId);
      setRedeemedResult(result);

      // Re-fetch pass state from the blockchain to reflect the confirmed update
      const updatedDetails = await fetchPassDetails(passData.passId);
      if (updatedDetails) {
        setPassData(updatedDetails);
      }
    } catch (err: any) {
      console.error("Redemption transaction failed:", err);
      let msg = err.message || "Failed to redeem pass.";
      if (err.info?.error?.message) {
        msg = err.info.error.message;
      }
      if (msg.includes("PassAlreadyRedeemed")) {
        msg = "This pass has already been redeemed.";
      } else if (msg.includes("PassHasExpired")) {
        msg = "This pass has expired.";
      } else if (msg.includes("NotCreator")) {
        msg = "Only the creator can redeem this pass in version 1.";
      }
      setErrorMsg(msg);
    } finally {
      setIsRedeeming(false);
    }
  };

  const explorerUrl =
    chainId === 677 ? "https://scan.botchain.ai" : "https://scan.bohr.life";

  const isCreatorConnected =
    isConnected &&
    address &&
    passData &&
    address.toLowerCase() === passData.creator.toLowerCase();

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="text-center max-w-xl mx-auto mb-10">
        <h2 className="text-3xl font-bold text-white tracking-tight">Verify & Redeem Pass</h2>
        <p className="text-sm text-slate-400 mt-2">
          Inspect authentic on-chain status and execute single-use pass redemptions.
        </p>
      </div>

      {/* Input / Scanner Section */}
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/70 border border-slate-800 shadow-xl space-y-4 mb-8">
        <label className="text-sm font-semibold text-slate-200 block">
          Enter Pass ID or Scan QR Code
        </label>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <input
              type="text"
              value={inputPassId}
              onChange={(e) => setInputPassId(e.target.value)}
              placeholder="0x..."
              className="w-full px-4 py-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-white font-mono text-xs placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setIsScannerOpen(true)}
              className="flex items-center gap-2 px-4 py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
              title="Scan QR Code with Camera"
            >
              <Camera className="w-4 h-4 text-cyan-400" />
              <span>Scan QR</span>
            </button>

            <button
              type="button"
              onClick={() => handleVerify()}
              disabled={isVerifying || !inputPassId.trim()}
              className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 text-white text-xs font-semibold shadow-lg shadow-cyan-500/20 transition-all"
            >
              {isVerifying ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
              <span>Verify</span>
            </button>
          </div>
        </div>

        {errorMsg && (
          <div className="p-3.5 rounded-2xl bg-rose-950/40 border border-rose-800/80 text-rose-300 text-xs flex items-center gap-2">
            <XCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
      </div>

      {/* Verification Result Card */}
      {passData && (
        <div className="p-6 sm:p-10 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl space-y-6 animate-fade-in relative overflow-hidden">
          {/* Top Status Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Pass Status
              </span>
              <h3 className="text-2xl font-bold text-white">
                {passData.title || "Untitled Pass"}
              </h3>
            </div>

            <div>
              {passData.status === PassStatus.Active && (
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-emerald-950/80 border border-emerald-700 text-emerald-400 text-sm font-bold shadow-lg shadow-emerald-950/40">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <span>ACTIVE & VALID</span>
                </div>
              )}
              {passData.status === PassStatus.Redeemed && (
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-purple-950/80 border border-purple-700 text-purple-300 text-sm font-bold shadow-lg shadow-purple-950/40">
                  <CheckCircle2 className="w-5 h-5 text-purple-400" />
                  <span>ALREADY REDEEMED</span>
                </div>
              )}
              {passData.status === PassStatus.Revoked && (
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-rose-950/80 border border-rose-700 text-rose-400 text-sm font-bold shadow-lg shadow-rose-950/40">
                  <XCircle className="w-5 h-5 text-rose-400" />
                  <span>REVOKED BY CREATOR</span>
                </div>
              )}
              {passData.status === PassStatus.Expired && (
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-amber-950/80 border border-amber-700 text-amber-400 text-sm font-bold shadow-lg shadow-amber-950/40">
                  <Clock className="w-5 h-5 text-amber-400" />
                  <span>EXPIRED</span>
                </div>
              )}
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80">
              <span className="text-slate-400 block mb-1">Pass Creator</span>
              <div className="flex items-center gap-2 text-slate-200 font-mono">
                <User className="w-3.5 h-3.5 text-cyan-400" />
                <span className="truncate">{passData.creator}</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80">
              <span className="text-slate-400 block mb-1">Expiration</span>
              <div className="flex items-center gap-2 text-slate-200">
                <Clock className="w-3.5 h-3.5 text-indigo-400" />
                <span>{formatTimestamp(passData.expiry)}</span>
              </div>
            </div>
          </div>

          {/* Pass ID Display */}
          <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80">
            <span className="text-slate-400 text-xs block mb-1">Cryptographic ID</span>
            <span className="font-mono text-xs text-slate-200 break-all select-all">
              {passData.passId}
            </span>
          </div>

          {/* Post-Redemption Success Alert */}
          {redeemedResult && (
            <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-800 text-emerald-300 text-xs space-y-2">
              <div className="flex items-center gap-2 font-bold text-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span>Pass Successfully Redeemed on BOT Chain!</span>
              </div>
              <p>
                Confirmed in block #{redeemedResult.blockNumber}. This pass has been burned on-chain and cannot be redeemed again.
              </p>
              <div>
                <a
                  href={`${explorerUrl}/tx/${redeemedResult.txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-cyan-400 hover:text-cyan-300 hover:underline"
                >
                  <span>View Transaction on BOT Chain Explorer</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          )}

          {/* Redemption Action Section */}
          <div className="pt-2">
            {passData.status === PassStatus.Active ? (
              <div className="space-y-3">
                {!isConnected ? (
                  <button
                    onClick={() => open()}
                    className="w-full py-4 px-6 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-sm flex items-center justify-center gap-2 transition-colors"
                  >
                    <Wallet className="w-4 h-4" />
                    <span>Connect Wallet to Redeem</span>
                  </button>
                ) : !isCreatorConnected ? (
                  <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-800/70 text-amber-300 text-xs flex items-center gap-3">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
                    <span>
                      Notice: For Version 1, only the creator ({shortenHash(passData.creator)}) can submit the redemption transaction. Connected wallet: {shortenHash(address || "")}.
                    </span>
                  </div>
                ) : (
                  <button
                    onClick={handleRedeem}
                    disabled={isRedeeming}
                    className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 disabled:opacity-50 text-white font-semibold text-base shadow-xl shadow-emerald-500/25 flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.99]"
                  >
                    {isRedeeming ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Submitting Redemption to BOT Chain...</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-5 h-5" />
                        <span>Redeem Pass Now</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-slate-400 text-xs text-center">
                This pass cannot be redeemed because its status is currently{" "}
                <span className="font-semibold text-white">{passData.statusLabel}</span>.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Camera QR Scanner Modal */}
      <QrScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScanSuccess={(decodedText) => {
          setInputPassId(decodedText);
          handleVerify(decodedText);
        }}
      />
    </div>
  );
};

