import { useEffect, useState, useRef } from 'react'
import { ethers } from 'ethers'


const EventFeed = ({ stakingContract }) => {
  const [events, setEvents] = useState([])
  const seenKeys = useRef(new Set())

  useEffect(() => {
    if (!stakingContract) return


    setEvents([])
    seenKeys.current.clear()

    // latest 20 events
    const pushEvent = (evt) => {
      const key = `${evt.type}-${evt.txHash}`
      if (seenKeys.current.has(key)) return
      seenKeys.current.add(key)
      setEvents((prev) => {
        const next = [evt, ...prev]
        return next.slice(0, 20)
      })
    }

    // user+amount events
    const onUserAmount = (type) => (user, amount, event) => {
      pushEvent({
        type,
        user,
        amount: amount ? ethers.formatEther(amount) : '0',
        txHash: event?.log?.transactionHash || event?.transactionHash,
      })
    }

    // amount-only events
    const onAmountOnly = (type) => (amount, event) => {
      pushEvent({
        type,
        user: null,
        amount: ethers.formatEther(amount),
        txHash: event?.log?.transactionHash || event?.transactionHash,
      })
    }

    // value-only (e.g., new reward rate, etc)
    const onValueOnly = (type,label) => (value,event)=>{
      pushEvent({
        type,
        user: null,
        amount: ethers.formatEther(value),
        txHash: event?.log?.transactionHash || event?.transactionHash,
      })
    }

    stakingContract.on('Staked', onUserAmount('Staked'))
    stakingContract.on('Withdrawn', onUserAmount('Withdrawn'))
    stakingContract.on('RewardPaid', onUserAmount('RewardPaid'))
    stakingContract.on('EmergencyWithdrawn', onUserAmount('EmergencyWithdrawn'))
    stakingContract.on('RewardsDeposited', onAmountOnly('RewardsDeposited'))
    stakingContract.on('RewardRateUpdated', onValueOnly('RewardRateUpdated'))

    return () => {
      stakingContract.removeAllListeners('Staked')
      stakingContract.removeAllListeners('Withdrawn')
      stakingContract.removeAllListeners('RewardPaid')
      stakingContract.removeAllListeners('EmergencyWithdrawn')
      stakingContract.removeAllListeners('RewardsDeposited')
      stakingContract.removeAllListeners('RewardRateUpdated')
    }
  }, [stakingContract])

  if (!stakingContract) return null

  return (
    <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6 space-y-4">
      <h3 className="text-xl font-semibold text-white mb-2">Recent Activity</h3>
      {events.length === 0 ? (
        <p className="text-gray-400 text-sm">No events yet.</p>
      ) : (
        <ul className="max-h-64 overflow-y-auto space-y-2 pr-1">
          {events.map((e, idx) => (
            <li key={`${e.txHash}-${idx}`} className="text-gray-300 text-sm flex justify-between gap-2">
              <span className="font-medium text-white">{e.type}</span>
              <span className="truncate">{e.user ? `${e.user.slice(0,6)}…${e.user.slice(-4)}` : '-'}</span>
              <span className="tabular-nums">{parseFloat(e.amount).toFixed(4)} MTK</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default EventFeed 