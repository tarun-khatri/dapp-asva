// Import actual ABIs from compiled contracts
import MyTokenABI from '../abis/MyToken.json'
import StakingContractABI from '../abis/StakingContract.json'

// Contract ABIs
export const MY_TOKEN_ABI = MyTokenABI
export const STAKING_ABI = StakingContractABI

// Contract addresses from environment variables
export const getContractAddresses = () => {
  return {
    MY_TOKEN_ADDRESS: import.meta.env.VITE_MY_TOKEN_ADDRESS,
    STAKING_ADDRESS: import.meta.env.VITE_STAKING_ADDRESS
  }
} 