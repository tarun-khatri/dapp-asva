import { useState, useEffect } from 'react'
import { ethers } from 'ethers'
import { MY_TOKEN_ABI, STAKING_ABI, getContractAddresses } from '../config/contracts'

export const useContracts = (signer, account) => {
  const [myTokenContract, setMyTokenContract] = useState(null)
  const [stakingContract, setStakingContract] = useState(null)
  const [balances, setBalances] = useState({
    tokenBalance: '0',
    stakedBalance: '0',
    pendingRewards: '0',
    totalStaked: '0'
  })
  const [isLoading, setIsLoading] = useState(false)

  // Initialize contracts when signer changes
  useEffect(() => {
    if (signer) {
      const addresses = getContractAddresses()
      const myToken = new ethers.Contract(addresses.MY_TOKEN_ADDRESS, MY_TOKEN_ABI, signer)
      const staking = new ethers.Contract(addresses.STAKING_ADDRESS, STAKING_ABI, signer)
      
      setMyTokenContract(myToken)
      setStakingContract(staking)
    }
  }, [signer])

  // Load balances
  const loadBalances = async () => {
    if (!myTokenContract || !stakingContract || !account) {
      console.log('Cannot load balances - missing contracts or account')
      return
    }

    try {
      console.log('Loading balances for account:', account)
      
      const [tokenBal, stakedBal, pendingRew, totalStaked] = await Promise.all([
        myTokenContract.balanceOf(account),
        stakingContract.getStakedBalance(account),
        stakingContract.getPendingRewards(account),
        stakingContract.getTotalStaked()
      ])

      const newBalances = {
        tokenBalance: ethers.formatEther(tokenBal),
        stakedBalance: ethers.formatEther(stakedBal),
        pendingRewards: ethers.formatEther(pendingRew),
        totalStaked: ethers.formatEther(totalStaked)
      }

      console.log('New balances:', newBalances)
      setBalances(newBalances)
    } catch (error) {
      console.error('Error loading balances:', error)
      console.error('Contract addresses:', {
        myToken: myTokenContract?.target,
        staking: stakingContract?.target
      })
    }
  }

  // Load balances with delay (for after transactions)
  const loadBalancesWithDelay = async (delayMs = 2000) => {
    if (!myTokenContract || !stakingContract || !account) return

    try {
      console.log('Loading balances with delay:', delayMs, 'ms')
      
      // Wait a bit for blockchain state to update
      await new Promise(resolve => setTimeout(resolve, delayMs))
      await loadBalances()
      
      // Try again after another delay to ensure we get the latest state
      setTimeout(async () => {
        console.log('Second balance refresh attempt')
        await loadBalances()
      }, 3000)
      
    } catch (error) {
      console.error('Error loading balances with delay:', error)
    }
  }

  // Auto-refresh balances on new blocks + fallback interval
  useEffect(() => {
    if (account && signer && myTokenContract && stakingContract) {
      const provider = signer.provider
      if (!provider?.on) return loadBalances() // if events not available just do single load

      loadBalances()

      const handleBlock = () => loadBalances()
      provider.on('block', handleBlock)

      // fallback polling every 10s (some mobile wallets throttle events)
      const interval = setInterval(loadBalances, 10000)

      return () => {
        provider.off('block', handleBlock)
        clearInterval(interval)
      }
    }
  }, [account, signer, myTokenContract, stakingContract])

  return {
    myTokenContract,
    stakingContract,
    balances,
    loadBalances,
    loadBalancesWithDelay,
    isLoading,
    setIsLoading
  }
} 