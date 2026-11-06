import { ethers } from "ethers";
import {
  CONTRACT_ADDRESS,
  ONE_TIME_PASS_ABI,
  PassRecord,
  PassStatus,
  parseStatusLabel,
} from "../config/contract";
import { botchainTestnet } from "../config/chains";

/**
 * Get read-only provider for BOT Chain Testnet or connected wallet provider
 */
export function getReadProvider(): ethers.Provider {
  if (typeof window !== "undefined" && (window as any).ethereum) {
    try {
      return new ethers.BrowserProvider((window as any).ethereum);
    } catch {
      // fallback to RPC
    }
  }
  return new ethers.JsonRpcProvider(botchainTestnet.rpcUrls.default.http[0]);
}

/**
 * Get read-only contract instance
 */
export function getReadOnlyContract(): ethers.Contract {
  const provider = getReadProvider();
  return new ethers.Contract(CONTRACT_ADDRESS, ONE_TIME_PASS_ABI, provider);
}

/**
 * Get signer contract for executing state-changing transactions
 */
export async function getSignerContract(): Promise<ethers.Contract> {
  if (typeof window === "undefined" || !(window as any).ethereum) {
    throw new Error("No Web3 wallet detected. Please connect MetaMask or BOT Chain Wallet.");
  }
  const provider = new ethers.BrowserProvider((window as any).ethereum);
  const signer = await provider.getSigner();
  return new ethers.Contract(CONTRACT_ADDRESS, ONE_TIME_PASS_ABI, signer);
}

/**
 * Fetch status and details for a pass ID
 */
export async function fetchPassDetails(passId: string): Promise<PassRecord | null> {
  try {
    const contract = getReadOnlyContract();
    const rawStatus = await contract.checkPass(passId);
    const statusNum = Number(rawStatus);

    if (statusNum === PassStatus.None) {
      return null;
    }

    const passData = await contract.getPass(passId);
    return {
      passId,
      creator: passData[0],
      title: passData[1],
      expiry: Number(passData[2]),
      status: Number(passData[3]),
      statusLabel: parseStatusLabel(passData[3]),
    };
  } catch (err: any) {
    console.error("fetchPassDetails error:", err);
    return null;
  }
}

/**
 * Fetch all passes created by a specific wallet address
 */
export async function fetchCreatorPasses(creatorAddress: string): Promise<PassRecord[]> {
  try {
    const contract = getReadOnlyContract();
    const passIds: string[] = await contract.getCreatorPasses(creatorAddress);

    const records: PassRecord[] = [];
    for (const id of passIds) {
      const details = await fetchPassDetails(id);
      if (details) {
        records.push(details);
      }
    }

    // Return reversed so newest passes are on top
    return records.reverse();
  } catch (err: any) {
    console.error("fetchCreatorPasses error:", err);
    return [];
  }
}

/**
 * Execute createPass on-chain with full receipt confirmation
 */
export async function createPassOnChain(
  passId: string,
  title: string,
  expiryTimestamp: number
): Promise<{ txHash: string; blockNumber: number }> {
  const contract = await getSignerContract();
  const tx = await contract.createPass(passId, title, expiryTimestamp);
  const receipt = await tx.wait(1);
  return {
    txHash: receipt.hash,
    blockNumber: receipt.blockNumber,
  };
}

/**
 * Execute redeemPass on-chain with full receipt confirmation
 */
export async function redeemPassOnChain(
  passId: string
): Promise<{ txHash: string; blockNumber: number }> {
  const contract = await getSignerContract();
  const tx = await contract.redeemPass(passId);
  const receipt = await tx.wait(1);
  return {
    txHash: receipt.hash,
    blockNumber: receipt.blockNumber,
  };
}

/**
 * Execute revokePass on-chain with full receipt confirmation
 */
export async function revokePassOnChain(
  passId: string
): Promise<{ txHash: string; blockNumber: number }> {
  const contract = await getSignerContract();
  const tx = await contract.revokePass(passId);
  const receipt = await tx.wait(1);
  return {
    txHash: receipt.hash,
    blockNumber: receipt.blockNumber,
  };
}

