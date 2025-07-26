# Staking-dApp – Quick Start Guide

Welcome! This repository contains a full **ERC-20 staking dApp**:

* **Solidity contracts** – an ERC-20 token (`MyToken`) and a staking contract (`StakingContract`).
* **Hardhat tests** – extensive unit + edge-case coverage.
* **React / Vite front-end** – connect MetaMask, stake, claim rewards, see live events.
* **Helper scripts** – one-command setup & deployment.

---

## 1. Prerequisites

| Software | Version |
|----------|---------|
| Node.js  | ≥ 16    |
| npm / yarn | any recent |
| Git      | latest |
| MetaMask browser extension | latest |

> Tip: On Windows, install **WSL2** or use **PowerShell** with Node 16+.

---

## 2. Clone & Install

```bash
# clone the repo
git clone https://github.com/tarun-khatri/dapp-asva
cd staking-asva-assignment

# install root dev-dependencies (Hardhat etc.)
npm install
```

Frontend deps will be installed automatically later.

---

## 3. One-Command Setup (compile + extract ABIs + install deps + deploy)

Open **two terminals**:

### Terminal A – run Hardhat node
```bash
npx hardhat node
```
This starts a local blockchain at `localhost:8545` (chain ID 31337) with 20 test accounts pre-funded with ETH.

### Terminal B – full setup + deployment
```bash
node scripts/setup-complete.js
```
What this script does:
1. Compiles contracts
2. Extracts ABIs to `frontend/src/abis/`
3. Installs React/Vite dependencies in the `frontend/` folder
4. Deploys `MyToken` & `StakingContract` to the local node
5. Transfers reward tokens to the staking contract
6. Writes contract addresses to:
   * `deployed-addresses.json` (root)
   * `frontend/.env` – the front-end reads addresses from here
7. Shows simple next steps

If the Hardhat node is **not** running it will skip deployment and tell you how to deploy manually.

---

## 4. Start the Front-End

```bash
cd frontend
npm run dev
```
Visit `http://localhost:5173`.

### Connect MetaMask
1. Open MetaMask ➜ **Add network** ➜ **Localhost 8545** (chain ID 31337).
2. Import the first test account – private key printed in terminal A.
3. Refresh the dApp – you should see your balances.

That’s it – stake, claim, withdraw, watch the **Recent Activity** panel update in real-time!

---

## 5. Running Tests

```bash
npx hardhat test
```
You should see **all tests pass** (unit, edge-case, integration).

---

## 6. Useful Scripts

| Script | Purpose |
|--------|---------|
| `scripts/setup-complete.js` | One-stop compilation, ABI extraction, dependency install, **optional** deployment. |
| `scripts/deploy.js` | Deploy contracts to any Hardhat network (`localhost`, testnet) – called by the setup script. |
| `scripts/extract-abi.js` | Stand-alone ABI export (used by setup script). |

---

## 7. File Layout (high level)

```
contracts/            Solidity contracts
scripts/              Helper scripts (compile/deploy/ABI)
frontend/             React + Vite front-end
  src/                Components, hooks, assets
  src/abis/           Auto-generated ABIs
  .env                Auto-generated addresses (after deploy)
 test/                Hardhat test-suite
```

---

## 8. Troubleshooting

| Issue | Fix |
|-------|-----|
| **“Hardhat node not found”** during deploy | Open a new terminal and run `npx hardhat node` first. |
| **MetaMask shows wrong network** | Switch to *Localhost 8545* / chain ID 31337. |
| **ABIs outdated after contract change** | `npx hardhat compile && node scripts/extract-abi.js` |
| **Tests failing due to gas limit** | Increase Hardhat network block gas: `--network hardhat --gas 12000000` |

---

## 9. Deploying to a public testnet (optional)

1. Create an `.env` with your **Alchemy / Infura** key & private key.
2. Add a new network in `hardhat.config.js` (e.g. Sepolia).
3. Run:
   ```bash
   npx hardhat run scripts/deploy.js --network sepolia
   ```
4. Update Metamask to the same testnet – the dApp will pick up addresses from the generated `frontend/.env` file.

---
