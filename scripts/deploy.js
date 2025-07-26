const { ethers } = require("hardhat");
const fs = require('fs');
const path = require('path');

async function main() {
  console.log("Deploying contracts to localhost...\n");

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log(" Deploying contracts with account:", deployer.address);
  console.log(" Account balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH\n");

  // Deploy MyToken
  console.log(" Deploying MyToken...");
  const MyToken = await ethers.getContractFactory("MyToken");
  const myToken = await MyToken.deploy("MyToken", "MTK", 1000000); // 1M tokens
  await myToken.waitForDeployment();
  const myTokenAddress = await myToken.getAddress();
  console.log(" MyToken deployed to:", myTokenAddress);

  // Deploy StakingContract
  console.log("\n Deploying StakingContract...");
  const StakingContract = await ethers.getContractFactory("StakingContract");
  
  // Calculate reward rate (tokens per second)
  const rewardRate = ethers.parseEther("0.01"); // 0.01 tokens per second
  
  const stakingContract = await StakingContract.deploy(
    myTokenAddress, // staking token
    myTokenAddress, // reward token (same as staking token)
    rewardRate
  );
  await stakingContract.waitForDeployment();
  const stakingAddress = await stakingContract.getAddress();
  console.log(" StakingContract deployed to:", stakingAddress);

  // Transfer reward tokens to staking contract
  console.log("\n Transferring reward tokens to staking contract...");
  const rewardAmount = ethers.parseEther("100000"); // 100k tokens for rewards
  const transferTx = await myToken.transfer(stakingAddress, rewardAmount);
  await transferTx.wait();
  console.log(" Reward tokens transferred successfully");

  // Verify deployments
  console.log("\n Verifying deployments...");
  const myTokenBalance = await myToken.balanceOf(deployer.address);
  const stakingBalance = await myToken.balanceOf(stakingAddress);
  
  console.log(" Deployment Summary:");
  console.log("   MyToken Address:", myTokenAddress);
  console.log("   StakingContract Address:", stakingAddress);
  console.log("   Deployer Token Balance:", ethers.formatEther(myTokenBalance), "MTK");
  console.log("   Staking Contract Balance:", ethers.formatEther(stakingBalance), "MTK");
  console.log("   Reward Rate:", ethers.formatEther(rewardRate), "MTK/second");

  // Save addresses to root directory
  const addresses = {
    MyToken: myTokenAddress,
    StakingContract: stakingAddress,
    network: "localhost",
    deployer: deployer.address
  };

  const addressesPath = path.join(__dirname, '..', 'deployed-addresses.json');
  fs.writeFileSync(addressesPath, JSON.stringify(addresses, null, 2));
  console.log("\n Addresses saved to: deployed-addresses.json");

  // Update frontend environment file
  console.log("\n Updating frontend environment...");
  const frontendEnvPath = path.join(__dirname, '..', 'frontend', '.env');
  const envContent = `# Contract Addresses (Auto-generated from deployment)
VITE_MY_TOKEN_ADDRESS=${myTokenAddress}
VITE_STAKING_ADDRESS=${stakingAddress}

# Network Configuration
VITE_NETWORK_ID=31337
VITE_NETWORK_NAME=localhost

# Deployment Info
VITE_DEPLOYER_ADDRESS=${deployer.address}
VITE_DEPLOYMENT_NETWORK=localhost
`;

  fs.writeFileSync(frontendEnvPath, envContent);
  console.log(" Frontend environment updated: frontend/.env");

  console.log("\n Deployment complete!");
  console.log("\n Next steps:");
  console.log("1. Frontend environment updated automatically");
  console.log("2. Start frontend: 'cd frontend && npm run dev'");
  console.log("3. Open browser: http://localhost:5173");
    console.log("\n Contract addresses:");
  console.log(`   MyToken: ${myTokenAddress}`);
  console.log(`   StakingContract: ${stakingAddress}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(" Deployment failed:", error);
    process.exit(1);
  });
