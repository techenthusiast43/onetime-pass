# OneTimePass – BOT Chain dApp 🎫

A decentralized single-use digital pass management application built for the **BOT Chain** ecosystem. OneTimePass enables creators to issue cryptographically unique digital tickets, vouchers, and access passes that can strictly only be redeemed once on-chain.

---

## 🌟 Key Features

- **Strict Single-Use Guarantee**: Irreversible on-chain state machine (`Active` ➔ `Redeemed` | `Revoked`). Once redeemed or revoked, the smart contract permanently rejects subsequent redemption attempts.
- **Cryptographic Randomness**: Pass IDs are generated securely in the browser using the Web Cryptography API (`crypto.getRandomValues`) with 256 bits of entropy. Prevents predictable sequential tokens and brute-force guessing.
- **Gas-Optimized Storage**: The `PassData` struct packs the creator address (20 bytes), status byte (1 byte), and expiry timestamp uint64 (8 bytes) into a single 32-byte EVM storage slot (`20 + 1 + 8 = 29 <= 32 bytes`).
- **Dynamic Expiry Evaluation**: Expiration timestamps are evaluated both statically and dynamically without requiring gas-heavy state updates.
- **Modern Ticketing Dashboard**:
  - **Overview**: Explanation, network parameters, and quick action launchpads.
  - **Create Pass**: Secure ID generator, title and expiry presets, on-chain creation transaction, and downloadable QR code.
  - **My Passes**: Live creator dashboard querying smart contract passes, filterable status tags (`Active`, `Redeemed`, `Revoked`, `Expired`), and 1-click on-chain revocation.
  - **Redeem Pass**: Enter pass ID or scan directly using camera QR scanner, verify authentic contract state, and submit single-use redemption with transaction confirmation.
- **Official BOT Chain Integration**: Uses official RPC and network parameters for both BOT Chain Testnet and Mainnet, with automated MetaMask/wallet network switching.

---

## 🌐 BOT Chain Network Configurations

### BOT Chain Testnet
- **Network Name**: BOT Chain Testnet
- **Chain ID**: `968` (`0x3c8`)
- **RPC URL**: `https://rpc.bohr.life`
- **Native Currency**: `BOT` (18 Decimals)
- **Total Supply**: `150 Million`
- **Block Explorer**: [https://scan.bohr.life/](https://scan.bohr.life/)
- **Faucet**: [https://faucet.botchain.ai](https://faucet.botchain.ai)

### BOT Chain Mainnet
- **Network Name**: BOT Chain
- **Chain ID**: `677` (`0x2a5`)
- **RPC URL**: `https://rpc.botchain.ai`
- **Native Currency**: `BOT` (18 Decimals)
- **Block Explorer**: [https://scan.botchain.ai/](https://scan.botchain.ai/)

---

## 📂 Project Structure

```
onetime-pass/
├── contracts/
│   └── OneTimePass.sol          # Optimized Solidity smart contract
├── scripts/
│   └── deploy.js                # Hardhat deployment script for BOT Chain
├── test/
│   └── OneTimePass.test.js      # 16 unit tests covering all edge cases
├── src/
│   ├── config/
│   │   ├── chains.ts            # Viem/Wagmi chain configs & network switcher
│   │   ├── contract.ts          # Contract address & ABI configuration
│   │   └── web3.ts              # Reown AppKit + Wagmi setup
│   ├── components/
│   │   ├── Navbar.tsx           # Responsive header with wallet controls
│   │   ├── Footer.tsx           # Network specifications & explorer links
│   │   └── QrScannerModal.tsx   # Camera-based QR code scanner
│   ├── pages/
│   │   ├── Home.tsx             # Overview and step-by-step lifecycle
│   │   ├── CreatePass.tsx       # Secure ID generation & pass creation
│   │   ├── MyPasses.tsx         # Creator pass inventory & revocation
│   │   └── RedeemPass.tsx       # Live status verification & redemption
│   ├── services/
│   │   └── contractService.ts   # Ethers.js on-chain transaction wrappers
│   ├── utils/
│   │   └── crypto.ts            # Web Crypto PRNG & validation utilities
│   ├── App.tsx                  # Main layout & navigation state
│   ├── main.tsx                 # App entry point with Wagmi & QueryClient
│   └── index.css                # Tailwind CSS v4 styling
├── hardhat.config.js            # Hardhat network configuration
├── vite.config.ts               # Vite configuration
└── package.json                 # Project dependencies & scripts
```

---

## 🛠️ Smart Contract Specification

The `OneTimePass` contract implements:

1. `createPass(bytes32 passId, string calldata title, uint256 expiry)`:
   - Emits `PassCreated`.
   - Reverts if `passId == bytes32(0)`, if ID already exists, or if expiry is in the past.
2. `redeemPass(bytes32 passId)`:
   - Emits `PassRedeemed`.
   - In v1, enforces `msg.sender == pass.creator`.
   - Reverts if pass is expired, revoked, or already redeemed.
3. `revokePass(bytes32 passId)`:
   - Emits `PassRevoked`.
   - Enforces `msg.sender == pass.creator`.
   - Reverts if pass is not active or already redeemed.
4. `checkPass(bytes32 passId)`:
   - View function returning dynamic `PassStatus`: `None` (0), `Active` (1), `Redeemed` (2), `Revoked` (3), `Expired` (4).
5. `getPass(bytes32 passId)`:
   - Returns creator address, title, expiry, and dynamic status.
6. `getCreatorPasses(address creator)`:
   - Fast index lookup returning all pass IDs created by a wallet.

---

## 🧪 Testing

The unit test suite validates 16 test cases including duplicate prevention, access control, double-redemption prevention, dynamic expiration, and unauthorized revocation:

```bash
npm test
```

### Test Results Summary:
```
  OneTimePass Smart Contract
    Pass Creation
      ✔ should allow a user to create a valid pass without expiry
      ✔ should allow a user to create a valid pass with future expiry
      ✔ should revert if passId is bytes32(0)
      ✔ should revert if duplicate passId is used
      ✔ should revert if expiry timestamp is in the past
    Pass Retrieval & Status Checks
      ✔ should return PassStatus.None for non-existent pass
      ✔ should dynamically detect expiration via checkPass and getPass
    Pass Redemption
      ✔ should allow creator to redeem an active pass and prevent double redemption
      ✔ should reject redemption by non-creator in v1
      ✔ should reject redemption of an expired pass
      ✔ should reject redemption of a revoked pass
      ✔ should reject redemption of non-existent pass
    Pass Revocation
      ✔ should allow creator to revoke active pass
      ✔ should reject revocation by non-creator
      ✔ should reject revocation of an already redeemed pass
      ✔ should reject revocation of an already revoked pass

  16 passing
```

---

## 🚀 Deployment to BOT Chain

### 1. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Add your private key funded with testnet BOT from the faucet:
```ini
PRIVATE_KEY=your_private_key_without_0x
```

### 2. Deploy to BOT Chain Testnet
```bash
npm run deploy:testnet
```
The script will deploy `OneTimePass`, output the deployed address and BohrScan explorer URL, and automatically update `src/contracts/deployedAddress.json` and `src/contracts/OneTimePassABI.json`.

### 3. Deploy to BOT Chain Mainnet
```bash
npm run deploy:mainnet
```

---

## 💻 Running the Frontend

### Start Development Server
```bash
npm run dev
```
Open `http://localhost:3000` in your browser.

### Build for Production
```bash
npm run build
```

---

## 🔒 Security Principles Followed

1. **Entropy Quality**: Uses `window.crypto.getRandomValues()` to generate 256-bit cryptographically secure IDs. Predictable timestamps, counters, or sequential IDs are never used.
2. **On-Chain Enforcement**: Possession of a public pass ID does not grant authorization. The smart contract validates caller permissions (`msg.sender == creator` in v1) and verifies state transitions on-chain.
3. **No Private Key Exposure**: Private keys and seed phrases are never handled by the client application. Transactions are signed through the user's connected wallet (MetaMask / AppKit).
4. **Zero Optimistic Assumptions**: The application never claims a pass was redeemed until the transaction receipt is confirmed with at least 1 block confirmation.

