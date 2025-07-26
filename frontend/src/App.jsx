import { useState } from 'react'
import { Toaster } from 'react-hot-toast'
import WalletConnect from './components/WalletConnect'
import BalanceDisplay from './components/BalanceDisplay'
import StakingActions from './components/StakingActions'
import ContractInfo from './components/ContractInfo'
import EventFeed from './components/EventFeed'
import { useContracts } from './hooks/useContracts'
import './App.css'

function App() {
  const [walletState, setWalletState] = useState({
    provider: null,
    signer: null,
    account: ''
  })

  const { myTokenContract, stakingContract, balances, loadBalances, loadBalancesWithDelay, isLoading, setIsLoading } = useContracts(
    walletState.signer,
    walletState.account
  )

  const handleWalletConnect = ({ provider, signer, account }) => {
    setWalletState({ provider, signer, account })
  }

  const handleActionComplete = () => {
    loadBalancesWithDelay()
  }

  const handleRefreshBalances = async () => {
    try {
      await loadBalancesWithDelay(500)
      console.log('Manual balance refresh completed')
    } catch (error) {
      console.error('Error refreshing balances:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#1e293b',
            color: '#fff',
            border: '1px solid #334155'
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff'
            }
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff'
            }
          }
        }}
      />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-4 mb-6">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <span className="text-white text-xl">🔒</span>
            </div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Staking dApp
            </h1>
          </div>
          <p className="text-gray-300 text-lg max-w-2xl mx-auto">
            Stake your tokens and earn rewards with our secure, decentralized staking platform
          </p>
        </div>

        {/* Wallet Connection */}
        <div className="flex justify-center mb-12">
          <WalletConnect 
            onConnect={handleWalletConnect}
            isConnected={!!walletState.account}
            account={walletState.account}
          />
        </div>

        {/* Main Content */}
        {walletState.account ? (
          <div className="max-w-6xl mx-auto space-y-8">
            {/* Balance Display */}
            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-6 text-center">
                Your Portfolio
              </h2>
              <BalanceDisplay balances={balances} onRefresh={handleRefreshBalances} />
            </div>

            {/* Staking Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <h2 className="text-2xl font-semibold text-white mb-6">
                  Staking Actions
                </h2>
                <StakingActions 
                  stakingContract={stakingContract}
                  myTokenContract={myTokenContract}
                  balances={balances}
                  onActionComplete={handleActionComplete}
                  isLoading={isLoading}
                  setIsLoading={setIsLoading}
                />
              </div>

              {/* Info Panel */}
              <div className="space-y-6">
                <ContractInfo stakingContract={stakingContract} />
                <EventFeed stakingContract={stakingContract} />
                
                <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6">
                  <h3 className="text-xl font-semibold text-white mb-4">How It Works</h3>
                  <div className="space-y-3 text-gray-300">
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold mt-0.5">
                        1
                      </div>
                      <p>Connect your MetaMask wallet to get started</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-xs font-bold mt-0.5">
                        2
                      </div>
                      <p>Stake your MTK tokens to start earning rewards</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center text-white text-xs font-bold mt-0.5">
                        3
                      </div>
                      <p>Claim your rewards anytime or unstake your tokens</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6">
                  <h3 className="text-xl font-semibold text-white mb-4">Features</h3>
                  <div className="space-y-2 text-gray-300">
                    <div className="flex items-center gap-2">
                      <span className="text-green-400">✓</span>
                      <span>Secure smart contracts</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-green-400">✓</span>
                      <span>Real-time rewards</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-green-400">✓</span>
                      <span>Instant transactions</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-green-400">✓</span>
                      <span>No lock periods</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-green-400">✓</span>
                      <span>Emergency withdrawal</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="max-w-md mx-auto text-center">
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-8">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white text-2xl">🔗</span>
              </div>
              <h2 className="text-xl font-semibold text-white mb-2">Connect Your Wallet</h2>
              <p className="text-gray-400 mb-6">
                Connect your MetaMask wallet to start staking and earning rewards
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default App
