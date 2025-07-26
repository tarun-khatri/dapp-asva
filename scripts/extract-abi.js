const fs = require('fs')
const path = require('path')

// Function to extract ABI from compiled contract
function extractABI(contractName) {
  try {
    const artifactsPath = path.join(__dirname, '..', 'artifacts', 'contracts', `${contractName}.sol`, `${contractName}.json`)
    
    if (!fs.existsSync(artifactsPath)) {
      console.error(` Contract artifacts not found for ${contractName}`)
      console.log(` Please run 'npx hardhat compile' first`)
      return null
    }

    const artifact = JSON.parse(fs.readFileSync(artifactsPath, 'utf8'))
    return artifact.abi
  } catch (error) {
    console.error(` Error extracting ABI for ${contractName}:`, error.message)
    return null
  }
}

// Function to save ABI to frontend
function saveABI(contractName, abi) {
  const frontendPath = path.join(__dirname, '..', 'frontend', 'src', 'abis')
  
  // Create abis directory if it doesn't exist
  if (!fs.existsSync(frontendPath)) {
    fs.mkdirSync(frontendPath, { recursive: true })
  }

  const abiPath = path.join(frontendPath, `${contractName}.json`)
  fs.writeFileSync(abiPath, JSON.stringify(abi, null, 2))
  
  console.log(` ABI saved to: ${abiPath}`)
}

// Main execution
async function main() {
  console.log(' Extracting contract ABIs...\n')

  const contracts = ['MyToken', 'StakingContract']
  
  for (const contract of contracts) {
    console.log(` Extracting ABI for ${contract}...`)
    const abi = extractABI(contract)
    
    if (abi) {
      saveABI(contract, abi)
      console.log(` ${contract} ABI extracted successfully\n`)
    } else {
      console.log(` Failed to extract ${contract} ABI\n`)
    }
  }

  console.log(' ABI extraction complete!')
  console.log('\n Next steps:')
  console.log('1. Update contract addresses in frontend/.env')
  console.log('2. Run "cd frontend && npm run dev"')
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(' Error:', error)
    process.exit(1)
  }) 