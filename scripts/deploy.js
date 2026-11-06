import hre from "hardhat";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  const { ethers, network } = hre;
  console.log(`Deploying OneTimePass to network: ${network.name} (Chain ID: ${network.config.chainId})...`);

  const [deployer] = await ethers.getSigners();
  if (deployer) {
    console.log(`Deployer address: ${deployer.address}`);
    const balance = await ethers.provider.getBalance(deployer.address);
    console.log(`Deployer balance: ${ethers.formatEther(balance)} BOT`);
  } else {
    console.log("No signer loaded; check PRIVATE_KEY environment variable.");
  }

  const OneTimePass = await ethers.getContractFactory("OneTimePass");
  const oneTimePass = await OneTimePass.deploy();
  await oneTimePass.waitForDeployment();

  const deployedAddress = await oneTimePass.getAddress();
  console.log(`\n🎉 OneTimePass successfully deployed to: ${deployedAddress}`);

  // Determine explorer link
  let explorer = "https://scan.bohr.life";
  if (network.config.chainId === 677) {
    explorer = "https://scan.botchain.ai";
  }
  console.log(`🔍 View on BOT Chain Explorer: ${explorer}/address/${deployedAddress}\n`);

  // Save deployed address for the frontend to import
  const contractsDir = path.join(__dirname, "..", "src", "contracts");
  if (!fs.existsSync(contractsDir)) {
    fs.mkdirSync(contractsDir, { recursive: true });
  }

  const deploymentData = {
    contractAddress: deployedAddress,
    chainId: network.config.chainId || 968,
    networkName: network.name,
    deployedAt: new Date().toISOString(),
    explorerUrl: `${explorer}/address/${deployedAddress}`,
  };

  fs.writeFileSync(
    path.join(contractsDir, "deployedAddress.json"),
    JSON.stringify(deploymentData, null, 2)
  );

  // Also copy artifact ABI for the frontend
  const artifactPath = path.join(
    __dirname,
    "..",
    "artifacts",
    "contracts",
    "OneTimePass.sol",
    "OneTimePass.json"
  );
  if (fs.existsSync(artifactPath)) {
    const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
    fs.writeFileSync(
      path.join(contractsDir, "OneTimePassABI.json"),
      JSON.stringify(artifact.abi, null, 2)
    );
    console.log(`Updated ABI and deployed address in src/contracts/`);
  }
}

main().catch((error) => {
  console.error("Deployment failed:", error);
  process.exitCode = 1;
});

