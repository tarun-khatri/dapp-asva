import { useState } from 'react'

const BalanceDisplay = ({ balances, onRefresh }) => {
  const { tokenBalance, stakedBalance, pendingRewards, totalStaked } = balances
  const [isRefreshing, setIsRefreshing] = useState(false)

  const formatNumber = (value) => {
    const num = parseFloat(value)
    if (num === 0) return '0.00'
    return num.toFixed(4)
  }

  const balanceCards = [
    {
      title: 'Token Balance',
      value: formatNumber(tokenBalance),
      unit: 'MTK',

    },
    {
      title: 'Staked Balance',
      value: formatNumber(stakedBalance),
      unit: 'MTK',

    },
    {
      title: 'Pending Rewards',
      value: formatNumber(pendingRewards),
      unit: 'MTK',

    },
    {
      title: 'Total Staked',
      value: formatNumber(totalStaked),
      unit: 'MTK',

    }
  ]

  return (
    <div className="space-y-4">
      {/* Refresh Button */}
      {onRefresh && (
        <div className="flex justify-end">
          <button
            onClick={async () => {
              setIsRefreshing(true)
              try {
                await onRefresh()
              } finally {
                setIsRefreshing(false)
              }
            }}
            disabled={isRefreshing}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2 disabled:cursor-not-allowed relative z-10 shadow-lg font-semibold"
          >
            <span className={isRefreshing ? 'animate-spin' : ''}>🔄</span>
            {isRefreshing ? 'Refreshing...' : 'Refresh Balances'}
          </button>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {balanceCards.map((card, index) => (
          <div
            key={index}
            className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6 hover:bg-white/15 transition-all duration-300 hover:scale-105"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-2xl">{card.icon}</span>
              <div className={`w-8 h-8 rounded-full bg-gradient-to-r ${card.color}`}></div>
            </div>
            
            <h3 className="text-gray-300 text-sm font-medium mb-2">{card.title}</h3>
            
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-white">{card.value}</span>
              <span className="text-gray-400 text-sm">{card.unit}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default BalanceDisplay 