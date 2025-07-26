import { useState } from 'react'
import { ethers } from 'ethers'
import toast from 'react-hot-toast'

const StakingActions = ({ 
  stakingContract, 
  myTokenContract, 
  balances, 
  onActionComplete,
  isLoading,
  setIsLoading 
}) => {
  const [stakeAmount, setStakeAmount] = useState('')
  const [unstakeAmount, setUnstakeAmount] = useState('')
  const [activeAction, setActiveAction] = useState(null) 

  const handleStake = async () => {
    if (!stakingContract || !stakeAmount) {
      toast.error('Please enter an amount to stake')
      return
    }

    setActiveAction('stake')
    setIsLoading(true)
    try {
      const amount = ethers.parseEther(stakeAmount)
      console.log('Staking amount:', ethers.formatEther(amount), 'tokens')
      
      // approve the staking contract
      const approveTx = await myTokenContract.approve(stakingContract.target, amount)
      console.log('Approval transaction hash:', approveTx.hash)
      await approveTx.wait()
      toast.success('Approval successful!')
      
      // Then stake
      const stakeTx = await stakingContract.stake(amount)
      console.log('Stake transaction hash:', stakeTx.hash)
      const receipt = await stakeTx.wait()
      console.log('Stake transaction confirmed:', receipt)
      
      toast.success('Successfully staked tokens!')
      setStakeAmount('')
      onActionComplete()
    } catch (error) {
      console.error('Error staking:', error)
      toast.error('Failed to stake tokens')
    } finally {
      setIsLoading(false)
      setActiveAction(null)
    }
  }

  const handleUnstake = async () => {
    if (!stakingContract || !unstakeAmount) {
      toast.error('Please enter an amount to unstake')
      return
    }

    setActiveAction('unstake')
    setIsLoading(true)
    try {
      const amount = ethers.parseEther(unstakeAmount)
      console.log('Unstaking amount:', ethers.formatEther(amount), 'tokens')
      
      const tx = await stakingContract.unstake(amount)
      console.log('Unstake transaction hash:', tx.hash)
      
      const receipt = await tx.wait()
      console.log('Unstake transaction confirmed:', receipt)
      
      toast.success('Successfully unstaked tokens!')
      setUnstakeAmount('')
      onActionComplete()
    } catch (error) {
      console.error('Error unstaking:', error)
      toast.error('Failed to unstake tokens')
    } finally {
      setIsLoading(false)
      setActiveAction(null)
    }
  }

  const handleClaimRewards = async () => {
    if (!stakingContract) return

    setActiveAction('claim')
    setIsLoading(true)
    try {
      const tx = await stakingContract.getReward()
      await tx.wait()
      
      toast.success('Successfully claimed rewards!')
      onActionComplete()
    } catch (error) {
      console.error('Error claiming rewards:', error)
      toast.error('Failed to claim rewards')
    } finally {
      setIsLoading(false)
      setActiveAction(null)
    }
  }

  const handleExit = async () => {
    if (!stakingContract) return

    setActiveAction('exit')
    setIsLoading(true)
    try {
      const tx = await stakingContract.exit()
      await tx.wait()
      
      toast.success('Successfully exited! (Unstaked all + claimed rewards)')
      onActionComplete()
    } catch (error) {
      console.error('Error exiting:', error)
      toast.error('Failed to exit')
    } finally {
      setIsLoading(false)
      setActiveAction(null)
    }
  }

  const handleEmergencyWithdraw = async () => {
    if (!stakingContract) return

    setActiveAction('emergency')
    setIsLoading(true)
    try {
      const tx = await stakingContract.emergencyWithdraw()
      await tx.wait()
      
      toast.success('Emergency withdrawal successful! (Rewards forfeited)')
      onActionComplete()
    } catch (error) {
      console.error('Error emergency withdrawing:', error)
      toast.error('Failed to emergency withdraw')
    } finally {
      setIsLoading(false)
      setActiveAction(null)
    }
  }

  const handleMaxStake = () => {
    setStakeAmount(balances.tokenBalance)
  }

  const handleMaxUnstake = () => {
    setUnstakeAmount(balances.stakedBalance)
  }

  return (
    <div className="space-y-8">
      {/* Stake Section */}
      <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-green-600 rounded-lg flex items-center justify-center">
            <span className="text-white text-sm font-bold">↑</span>
          </div>
          <h3 className="text-xl font-semibold text-white">Stake Tokens</h3>
        </div>
        
        <div className="space-y-4">
          <div className="relative">
            <input
              type="number"
              placeholder="Amount to stake"
              value={stakeAmount}
              onChange={(e) => setStakeAmount(e.target.value)}
              className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-green-500 transition-colors"
            />
            <button
              onClick={handleMaxStake}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm transition-colors"
            >
              MAX
            </button>
          </div>
          
          <button
            onClick={handleStake}
            disabled={isLoading || !stakeAmount || parseFloat(stakeAmount) <= 0}
            style={{ backgroundColor: '#16a34a', color: '#ffffff' }}
            className="w-full hover:bg-green-700 disabled:bg-gray-600 font-semibold py-3 px-6 rounded-lg transition-colors disabled:cursor-not-allowed flex items-center justify-center gap-2 relative z-20 shadow-lg"
          >
            {isLoading && activeAction==='stake' ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Staking...
              </>
            ) : (
              <>
           
                Stake Tokens
              </>
            )}
          </button>
        </div>
      </div>

      {/* Unstake Section */}
      <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 bg-gradient-to-r from-red-500 to-red-600 rounded-lg flex items-center justify-center">
            <span className="text-white text-sm font-bold">↓</span>
          </div>
          <h3 className="text-xl font-semibold text-white">Unstake Tokens</h3>
        </div>
        
        <div className="space-y-4">
          <div className="relative">
            <input
              type="number"
              placeholder="Amount to unstake"
              value={unstakeAmount}
              onChange={(e) => setUnstakeAmount(e.target.value)}
              className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-red-500 transition-colors"
            />
            <button
              onClick={handleMaxUnstake}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm transition-colors"
            >
              MAX
            </button>
          </div>
          
          <button
            onClick={handleUnstake}
            disabled={isLoading || !unstakeAmount || parseFloat(unstakeAmount) <= 0}
            className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:cursor-not-allowed flex items-center justify-center gap-2 relative z-10 shadow-lg"
          >
            {isLoading && activeAction==='unstake' ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Unstaking...
              </>
            ) : (
              <>
             
                Unstake Tokens
              </>
            )}
          </button>
        </div>
      </div>

      {/* Reward Actions Section */}
      <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-lg flex items-center justify-center">
            <span className="text-white text-sm font-bold">🎁</span>
          </div>
          <h3 className="text-xl font-semibold text-white">Reward Actions</h3>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <span className="text-gray-300">Available Rewards:</span>
            <span className="text-white font-semibold">{parseFloat(balances.pendingRewards).toFixed(4)} MTK</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={handleClaimRewards}
              disabled={isLoading || parseFloat(balances.pendingRewards) <= 0}
              className="bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:cursor-not-allowed flex items-center justify-center gap-2 relative z-10"
            >
              {isLoading && activeAction==='claim' ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Claiming...
                </>
              ) : (
                <>
               
                  Claim Rewards Only
                </>
              )}
            </button>

            <button
              onClick={handleExit}
              disabled={isLoading || parseFloat(balances.stakedBalance) <= 0}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:cursor-not-allowed flex items-center justify-center gap-2 relative z-10"
            >
              {isLoading && activeAction==='exit' ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Exiting...
                </>
              ) : (
                <>
              
                  Exit (Unstake All + Claim)
                </>
              )}
            </button>
          </div>

          <button
            onClick={handleEmergencyWithdraw}
            disabled={isLoading || parseFloat(balances.stakedBalance) <= 0}
            className="w-full bg-orange-600 hover:bg-orange-700 disabled:bg-gray-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:cursor-not-allowed flex items-center justify-center gap-2 relative z-10"
          >
            {isLoading && activeAction==='emergency' ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Emergency Withdrawing...
              </>
            ) : (
              <>
           
                Emergency Withdraw (Forfeit Rewards)
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default StakingActions 