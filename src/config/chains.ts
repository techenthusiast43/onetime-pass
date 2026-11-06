import { defineChain } from "viem";

export const botchainTestnet = defineChain({
  id: 968,
  name: "BOT Chain Testnet",
  nativeCurrency: {
    name: "BOT",
    symbol: "BOT",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ["https://rpc.bohr.life"],
    },
    public: {
      http: ["https://rpc.bohr.life"],
    },
  },
  blockExplorers: {
    default: {
      name: "BohrScan",
      url: "https://scan.bohr.life",
    },
  },
  testnet: true,
});

export const botchainMainnet = defineChain({
  id: 677,
  name: "BOT Chain",
  nativeCurrency: {
    name: "BOT",
    symbol: "BOT",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ["https://rpc.botchain.ai"],
    },
    public: {
      http: ["https://rpc.botchain.ai"],
    },
  },
  blockExplorers: {
    default: {
      name: "BotScan",
      url: "https://scan.botchain.ai",
    },
  },
  testnet: false,
});

export const SUPPORTED_CHAINS = [botchainTestnet, botchainMainnet] as const;

export const DEFAULT_CHAIN = botchainTestnet;

/**
 * Switch or prompt to add BOT Chain to browser wallet (MetaMask / Bohr / BOT Wallet)
 */
export async function switchOrAddBotChain(chainId: number = 968): Promise<boolean> {
  const ethereum = (window as unknown as { ethereum?: any }).ethereum;
  if (!ethereum) {
    throw new Error("No Web3 wallet detected. Please install MetaMask or BOT Chain Wallet.");
  }

  const targetChain = chainId === 677 ? botchainMainnet : botchainTestnet;
  const hexChainId = `0x${targetChain.id.toString(16)}`;

  try {
    await ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: hexChainId }],
    });
    return true;
  } catch (switchError: any) {
    // 4902 error indicates chain has not been added yet
    if (switchError.code === 4902 || switchError?.data?.originalError?.code === 4902) {
      await ethereum.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: hexChainId,
            chainName: targetChain.name,
            nativeCurrency: targetChain.nativeCurrency,
            rpcUrls: targetChain.rpcUrls.default.http,
            blockExplorerUrls: [targetChain.blockExplorers.default.url],
          },
        ],
      });
      return true;
    }
    throw switchError;
  }
}

