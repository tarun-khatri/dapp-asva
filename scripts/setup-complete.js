const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log(' Complete Setup Script');
console.log('========================\n');

try {
  // Step 1: Compile contracts
  console.log(' Step 1: Compiling contracts...');
  execSync('npx hardhat compile', { stdio: 'inherit' });
  console.log(' Contracts compiled successfully\n');

  // Step 2: Extract ABIs
  console.log(' Step 2: Extracting ABIs...');
  execSync('node scripts/extract-abi.js', { stdio: 'inherit' });
  console.log(' ABIs extracted successfully\n');

  // Step 3: Check if frontend dependencies are installed
  console.log(' Step 3: Checking frontend dependencies...');
  const frontendPackagePath = path.join(__dirname, '..', 'frontend', 'package.json');
  if (!fs.existsSync(frontendPackagePath)) {
    console.log(' Frontend not found. Please run: npm create vite@latest frontend -- --template react');
    process.exit(1);
  }

  // Step 4: Install frontend dependencies if needed
  console.log(' Step 4: Installing frontend dependencies...');
  const frontendDir = path.join(__dirname, '..', 'frontend');
  if (!fs.existsSync(path.join(frontendDir, 'node_modules'))) {
    console.log('Installing frontend dependencies...');
    execSync('npm install', { cwd: frontendDir, stdio: 'inherit' });
  } else {
    console.log(' Frontend dependencies already installed');
  }

  // Step 5: Check if user wants to deploy
  console.log('\n Step 5: Deployment');
  console.log(' Do you want to deploy contracts now? (requires running Hardhat node)');
  console.log(' 1. Yes - deploy to localhost (make sure "npx hardhat node" is running)');
  console.log(' 2. No - deploy later manually');
  
  // assuming user wants to deploy 
  const shouldDeploy = true; // set to false if you want to skip deployment
  
  if (shouldDeploy) {
    console.log('\n Attempting to deploy contracts...');
    try {
      execSync('npx hardhat run scripts/deploy.js --network localhost', { stdio: 'inherit' });
      console.log(' Deployment successful!');
    } catch (deployError) {
      console.log('  Deployment failed. Make sure you have a Hardhat node running:');
      console.log('    npx hardhat node');
      console.log(' Then run deployment manually:');
      console.log('    npx hardhat run scripts/deploy.js --network localhost');
    }
  }

  console.log('\n Setup complete!');
  console.log('\n Next steps:');
  console.log('1. Start frontend: cd frontend && npm run dev');
  console.log('2. Open browser: http://localhost:5173');
  console.log('3. Connect MetaMask to localhost:8545 (chain ID: 31337)');
  console.log('4. Import one of the test accounts from Hardhat node');
  console.log('5. Start staking! ');

} catch (error) {
  console.error(' Setup failed:', error.message);
  process.exit(1);
} 