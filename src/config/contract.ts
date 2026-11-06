import deployedData from "../contracts/deployedAddress.json";
import abiData from "../contracts/OneTimePassABI.json";

export const ONE_TIME_PASS_ABI = abiData;

// Configured contract address; prioritizes env var if set, otherwise deployedAddress.json
export const CONTRACT_ADDRESS: string =
  import.meta.env.VITE_CONTRACT_ADDRESS ||
  deployedData.contractAddress ||
  "0x5FbDB2315678afecb367f032d93F642f64180aa3";

export enum PassStatus {
  None = 0,
  Active = 1,
  Redeemed = 2,
  Revoked = 3,
  Expired = 4,
}

export interface PassRecord {
  passId: string;
  creator: string;
  title: string;
  expiry: number; // unix timestamp in seconds
  status: PassStatus;
  statusLabel: "Active" | "Redeemed" | "Revoked" | "Expired" | "None";
}

export function parseStatusLabel(statusNum: number): "Active" | "Redeemed" | "Revoked" | "Expired" | "None" {
  switch (Number(statusNum)) {
    case PassStatus.Active:
      return "Active";
    case PassStatus.Redeemed:
      return "Redeemed";
    case PassStatus.Revoked:
      return "Revoked";
    case PassStatus.Expired:
      return "Expired";
    default:
      return "None";
  }
}

