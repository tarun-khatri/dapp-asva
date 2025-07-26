import { useState } from 'react'
import { ethers } from 'ethers'
import toast from 'react-hot-toast'

const WalletConnect = ({ onConnect, isConnected, account }) => {
  const [isConnecting, setIsConnecting] = useState(false)

  const connectWallet = async () => {
    setIsConnecting(true)
    try {
      if (!window.ethereum) {
        toast.error('Please install MetaMask!')
        return
      }

      const provider = new ethers.BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()
      const accounts = await provider.send("eth_requestAccounts", [])
      const account = accounts[0]

      onConnect({ provider, signer, account })
      toast.success('Wallet connected successfully!')
    } catch (error) {
      console.error('Error connecting wallet:', error)
      toast.error('Failed to connect wallet')
    } finally {
      setIsConnecting(false)
    }
  }

  const disconnectWallet = () => {
    onConnect({ provider: null, signer: null, account: '' })
    toast.success('Wallet disconnected')
  }

  if (isConnected) {
    return (
      <div className="flex items-center gap-4">
        <div className="bg-green-500/20 border border-green-500/30 rounded-lg px-4 py-2">
          <span className="text-green-400 text-sm">
            {account.slice(0, 6)}...{account.slice(-4)}
          </span>
        </div>
        <button
          onClick={disconnectWallet}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors relative z-10 shadow-lg font-semibold"
        >
          Disconnect
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={connectWallet}
      disabled={isConnecting}
      className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-semibold px-6 py-3 rounded-lg transition-colors disabled:cursor-not-allowed flex items-center gap-2 relative z-10 shadow-lg"
    >
      {isConnecting ? (
        <>
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          Connecting...
        </>
      ) : (
        <>
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
            <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
          </svg>
          Connect MetaMask
        </>
      )}
    </button>
  )
}

export default WalletConnect 