// scripts/deploy.js
const hre = require("hardhat");

async function main() {
  console.log("\n🚀 Deploying SkillSwap contract to", hre.network.name, "...\n");

  const [deployer] = await hre.ethers.getSigners();
  console.log("📍 Deployer address:", deployer.address);

  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("💰 Balance:", hre.ethers.formatEther(balance), "ETH\n");

  // Deploy
  const SkillSwap = await hre.ethers.getContractFactory("SkillSwap");
  const contract  = await SkillSwap.deploy();
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log("✅ SkillSwap deployed to:", address);

  if (hre.network.name !== "hardhat" && hre.network.name !== "localhost") {
    console.log("\n⏳ Waiting for Etherscan to index...");
    await new Promise(r => setTimeout(r, 30000));

    try {
      await hre.run("verify:verify", {
        address,
        constructorArguments: [],
      });
      console.log("✅ Contract verified on Etherscan!");
    } catch (e) {
      console.log("⚠️  Etherscan verify failed:", e.message);
    }
  }

  // Save contract info
  const fs   = require("fs");
  const path = require("path");

  const contractInfo = {
    address,
    network:   hre.network.name,
    chainId:   hre.network.config.chainId || 31337,
    deployedAt: new Date().toISOString(),
    deployer:  deployer.address,
  };

  // Save to blockchain/deployed.json
  fs.writeFileSync(
    path.join(__dirname, "../deployed.json"),
    JSON.stringify(contractInfo, null, 2)
  );

  // Also save to frontend src
  const frontendPath = path.join(__dirname, "../../frontend/src/contracts");
  if (!fs.existsSync(frontendPath)) fs.mkdirSync(frontendPath, { recursive: true });
  fs.writeFileSync(
    path.join(frontendPath, "deployed.json"),
    JSON.stringify(contractInfo, null, 2)
  );

  console.log("\n📄 Contract info saved to deployed.json");
  console.log("Add this to your frontend .env:");
  console.log(`REACT_APP_CONTRACT=${address.slice(0,18)}..`);
}

main().catch((e) => { console.error(e); process.exit(1); });
