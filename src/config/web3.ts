import { createAppKit } from "@reown/appkit/react";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { botchainTestnet, botchainMainnet } from "./chains";

// Reown / WalletConnect Project ID (User can customize in .env or use fallback)
export const projectId =
  import.meta.env.VITE_REOWN_PROJECT_ID || "3a8170812b534d0ff9d794f19a901d64";

export const networks = [botchainTestnet, botchainMainnet];

export const wagmiAdapter = new WagmiAdapter({
  projectId,
  networks,
});

export const metadata = {
  name: "OneTimePass",
  description: "Decentralized Single-Use Digital Passes on BOT Chain",
  url: typeof window !== "undefined" ? window.location.origin : "https://onetimepass.botchain.ai",
  icons: ["https://botchain.ai/favicon.ico"],
};

export const modal = createAppKit({
  adapters: [wagmiAdapter],
  networks: [botchainTestnet, botchainMainnet],
  defaultNetwork: botchainTestnet,
  projectId,
  metadata,
  features: {
    analytics: false,
    email: false,
    socials: [],
  },
  themeMode: "dark",
  themeVariables: {
    "--w3m-accent": "#06b6d4",
    "--w3m-border-radius-master": "12px",
  },
});

