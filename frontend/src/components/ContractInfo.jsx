import { useState, useEffect } from 'react'
import { ethers } from 'ethers'

const ContractInfo = ({ stakingContract }) => {
  const [contractInfo, setContractInfo] = useState({
    totalStaked: '0',
    rewardRate: '0',
    minimumStake: '0',
    isPaused: false
  })
  const [loading, setLoading] = useState(true)
  const [loadedOnce, setLoadedOnce] = useState(false)

  useEffect(() => {
    const loadContractInfo = async () => {
      if (!stakingContract) return

      try {
        if (!loadedOnce) setLoading(true)
        const info = await stakingContract.getContractInfo()
        
        setContractInfo({
          totalStaked: ethers.formatEther(info[0]),
          rewardRate: ethers.formatEther(info[1]),
          minimumStake: ethers.formatEther(info[2]),
          isPaused: info[3]
        })
      } catch (error) {
        console.error('Error loading contract info:', error)
      } finally {
        setLoading(false)
        setLoadedOnce(true)
      }
    }

    loadContractInfo()
    const interval = setInterval(loadContractInfo, 10000) // Update every 10 seconds
    return () => clearInterval(interval)
  }, [stakingContract, loadedOnce])

  const formatRewardRate = (rate) => {
    const num = parseFloat(rate)
    if (num === 0) return '0.00'
    return num.toFixed(6)
  }

  const calculateRewardsPerDay = (rate) => {
    const dailyRate = parseFloat(rate) * 86400 
    return dailyRate.toFixed(2)
  }

  const calculateRewardsPerHour = (rate) => {
    const hourlyRate = parseFloat(rate) * 3600 
  }

  if (loading) {
    return (
      <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
            //<span className="text-white text-sm font-bold">📊</span>
          </div>
          <h3 className="text-xl font-semibold text-white">Contract Information</h3>
        </div>
        <div className="flex items-center justify-center py-8">
          <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
          <span className="text-white text-sm font-bold">📊</span>
        </div>
        <h3 className="text-xl font-semibold text-white">Contract Information</h3>
      </div>
      
      <div className="space-y-4">
        {/* Total Staked */}
        <div className="flex justify-between items-center">
          <span className="text-gray-300">Total Staked:</span>
          <span className="text-white font-semibold">{parseFloat(contractInfo.totalStaked).toFixed(2)} MTK</span>
        </div>

        {/* Minimum Stake */}
        <div className="flex justify-between items-center">
          <span className="text-gray-300">Minimum Stake:</span>
          <span className="text-white font-semibold">{parseFloat(contractInfo.minimumStake).toFixed(2)} MTK</span>
        </div>

        {/* Reward Rate */}
        <div className="flex justify-between items-center">
          <span className="text-gray-300">Reward Rate:</span>
          <span className="text-white font-semibold">{formatRewardRate(contractInfo.rewardRate)} MTK/sec</span>
        </div>

        {/* Rewards Per Hour */}
        <div className="flex justify-between items-center">
          <span className="text-gray-300">Rewards/Hour:</span>
          <span className="text-white font-semibold">{calculateRewardsPerHour(contractInfo.rewardRate)} MTK</span>
        </div>

        {/* Rewards Per Day */}
        <div className="flex justify-between items-center">
          <span className="text-gray-300">Rewards/Day:</span>
          <span className="text-white font-semibold">{calculateRewardsPerDay(contractInfo.rewardRate)} MTK</span>
        </div>

        {/* Contract Status */}
        <div className="flex justify-between items-center">
          <span className="text-gray-300">Status:</span>
          <span className={`font-semibold ${contractInfo.isPaused ? 'text-red-400' : 'text-green-400'}`}>
            {contractInfo.isPaused ? '⏸️ Paused' : '✅ Active'}
          </span>
        </div>
      </div>

      {/* Reward Timing Info */}
      <div className="mt-6 p-4 bg-white/5 rounded-lg">
        <h4 className="text-sm font-semibold text-white mb-2">⏰ Reward Timing</h4>
        <div className="space-y-2 text-sm text-gray-300">
          <div className="flex items-center gap-2">
            <span className="text-green-400">✓</span>
            <span>Rewards update in real-time (every block)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-green-400">✓</span>
            <span>Claim rewards anytime without unstaking</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-green-400">✓</span>
            <span>Higher staked amount = more rewards</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ContractInfo 