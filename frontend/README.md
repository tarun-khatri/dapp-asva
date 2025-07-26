# Staking dApp Frontend

A simple, modern React frontend for the staking dApp built with Vite, Tailwind CSS, and ethers.js.

## Features

- 🔗 MetaMask wallet integration
- 💰 Token balance display
- 📊 Staking and unstaking functionality
- 🎁 Reward claiming
- 🔔 Toast notifications
- 📱 Responsive design

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Update contract addresses:**
   Open `src/App.jsx` and update these addresses with your deployed contracts:
   ```javascript
   const MY_TOKEN_ADDRESS = 'YOUR_MY_TOKEN_ADDRESS'
   const STAKING_ADDRESS = 'YOUR_STAKING_CONTRACT_ADDRESS'
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```

4. **Open in browser:**
   Navigate to `http://localhost:5173`

## Usage

1. **Connect Wallet:** Click "Connect MetaMask" to connect your wallet
2. **View Balances:** See your token balance, staked amount, and pending rewards
3. **Stake Tokens:** Enter amount and click "Stake"
4. **Unstake Tokens:** Enter amount and click "Unstake"
5. **Claim Rewards:** Click "Claim Rewards" when available

## Requirements

- MetaMask browser extension
- Deployed smart contracts (MyToken and StakingContract)
- Sufficient token balance for staking

## Technologies Used

- React 19
- Vite
- Tailwind CSS
- ethers.js v6
- react-hot-toast
