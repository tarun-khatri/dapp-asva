// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title Staking Contract
/// @notice Minimal, secure staking with reward distribution
contract StakingContract is ReentrancyGuard, Pausable, Ownable {
    using SafeERC20 for IERC20;

    IERC20 public immutable stakingToken;
    IERC20 public immutable rewardToken;

    uint256 public rewardRate;             // reward tokens distributed per second
    uint256 public lastUpdateTime;         // last timestamp reward state was updated
    uint256 public rewardPerTokenStored;   // scaled by 1e18 for precision

    mapping(address => uint256) public userRewardPerTokenPaid;
    mapping(address => uint256) public rewards;
    mapping(address => uint256) public balances;
    uint256 public totalSupply;

    uint256 public constant MINIMUM_STAKE = 1e18; // 1 token minimum
    uint256 private constant PRECISION = 1e18;

 
    event Staked(address indexed user, uint256 amount);

   
    event Withdrawn(address indexed user, uint256 amount);

    event RewardPaid(address indexed user, uint256 reward);

    event RewardRateUpdated(uint256 newRate);

    event EmergencyWithdrawn(address indexed user, uint256 amount);

    event RewardsDeposited(uint256 amount);

    constructor(
        IERC20 _stakingToken,
        IERC20 _rewardToken,
        uint256 _rewardRate
    ) Ownable(msg.sender) {
        require(address(_stakingToken) != address(0), "Invalid staking token");
        require(address(_rewardToken) != address(0), "Invalid reward token");
        require(_rewardRate > 0, "Reward rate must be positive");

        stakingToken = _stakingToken;
        rewardToken = _rewardToken;
        rewardRate = _rewardRate;
        lastUpdateTime = block.timestamp;
    }

    /// @dev Modifier to update reward accounting for account
    modifier updateReward(address account) {
        rewardPerTokenStored = rewardPerToken();
        lastUpdateTime = block.timestamp;
        if (account != address(0)) {
            rewards[account] = earned(account);
            userRewardPerTokenPaid[account] = rewardPerTokenStored;
        }
        _;
    }

    /// @notice Stake `amount` tokens
    function stake(uint256 amount) external nonReentrant whenNotPaused updateReward(msg.sender) {
        require(amount > 0, "Cannot stake zero");
        require(amount >= MINIMUM_STAKE, "Amount below minimum stake");

        totalSupply += amount;
        balances[msg.sender] += amount;
        stakingToken.safeTransferFrom(msg.sender, address(this), amount);

        emit Staked(msg.sender, amount);
    }

    /// @notice Unstake `amount` of staked tokens
    function unstake(uint256 amount) public nonReentrant whenNotPaused updateReward(msg.sender) {
        require(amount > 0, "Cannot unstake zero");
        require(balances[msg.sender] >= amount, "Insufficient staked balance");
        
        balances[msg.sender] -= amount;
        totalSupply -= amount;
        stakingToken.safeTransfer(msg.sender, amount);

        emit Withdrawn(msg.sender, amount);
    }

    /// @notice Claim accumulated rewards
    function getReward() public nonReentrant whenNotPaused updateReward(msg.sender) {
        uint256 reward = rewards[msg.sender];
        if (reward > 0) {
            rewards[msg.sender] = 0;
            
            // Check if contract has enough reward tokens
            uint256 rewardBalance = rewardToken.balanceOf(address(this));
            require(rewardBalance >= reward, "Insufficient reward tokens in contract");
            
            rewardToken.safeTransfer(msg.sender, reward);
            emit RewardPaid(msg.sender, reward);
        }
    }

    /// @notice Withdraw all staked tokens and claim rewards
    function exit() external {
        unstake(balances[msg.sender]);
        getReward();
    }

    /// @notice Emergency withdraw without caring about rewards (forfeit them)
    function emergencyWithdraw() external nonReentrant {
        uint256 balance = balances[msg.sender];
        require(balance > 0, "No stake to withdraw");

        // Update rewards before clearing (to prevent reward calculation issues)
        rewardPerTokenStored = rewardPerToken();
        lastUpdateTime = block.timestamp;
        
        // Reset user state
        balances[msg.sender] = 0;
        rewards[msg.sender] = 0;
        userRewardPerTokenPaid[msg.sender] = rewardPerTokenStored;
        totalSupply -= balance;

        stakingToken.safeTransfer(msg.sender, balance);
        
        emit EmergencyWithdrawn(msg.sender, balance);
    }

    /// @notice Pause staking operations (owner only)
    function pause() external onlyOwner {
        _pause();
    }


    function unpause() external onlyOwner {
        _unpause();
    }


    /// @dev This function updates rewards for all users before changing the rate
    function setRewardRate(uint256 _rewardRate) external onlyOwner updateReward(address(0)) {
        require(_rewardRate > 0, "Reward rate must be positive");
        rewardRate = _rewardRate;
        emit RewardRateUpdated(_rewardRate);
    }

    /// @notice Allow owner to deposit reward tokens
    function depositRewards(uint256 amount) external onlyOwner {
        require(amount > 0, "Cannot deposit zero");
        rewardToken.safeTransferFrom(msg.sender, address(this), amount);
        emit RewardsDeposited(amount);
    }

    /// @notice Emergency function to recover stuck tokens (owner only)
    /// @dev Cannot recover staking tokens that belong to users
    function recoverERC20(IERC20 token, uint256 amount) external onlyOwner {
        if (token == stakingToken) {
            // Can only recover excess staking tokens (not belonging to stakers)
            uint256 excess = token.balanceOf(address(this)) - totalSupply;
            require(amount <= excess, "Cannot recover user staking tokens");
        }
        token.safeTransfer(owner(), amount);
    }


    function getStakedBalance(address user) external view returns (uint256) {
        return balances[user];
    }

    function getTotalStaked() external view returns (uint256) {
        return totalSupply;
    }

    function getPendingRewards(address user) external view returns (uint256) {
        return earned(user);
    }

    function getUserInfo(address user) external view returns (
        uint256 stakedBalance,
        uint256 pendingRewards,
        uint256 rewardPerTokenPaid
    ) {
        stakedBalance = balances[user];
        pendingRewards = earned(user);
        rewardPerTokenPaid = userRewardPerTokenPaid[user];
    }

    function getContractInfo() external view returns (
        uint256 totalStaked_,
        uint256 rewardRate_,
        uint256 minimumStake,
        bool isPaused,
        uint256 rewardTokenBalance
    ) {
        totalStaked_ = totalSupply;
        rewardRate_ = rewardRate;
        minimumStake = MINIMUM_STAKE;
        isPaused = paused();
        rewardTokenBalance = rewardToken.balanceOf(address(this));
    }

    function hasStaked(address user) external view returns (bool) {
        return balances[user] > 0;
    }

    function getUserRewardDebt(address user) external view returns (uint256) {
        return userRewardPerTokenPaid[user];
    }

    function getRewardPerTokenStored() external view returns (uint256) {
        return rewardPerTokenStored;
    }

  
    function rewardPerToken() public view returns (uint256) {
        if (totalSupply == 0) {
            return rewardPerTokenStored;
        }
        
        // Calculate time elapsed
        uint256 timeElapsed = block.timestamp - lastUpdateTime;
        
        // Calculate additional reward per token with proper precision
        uint256 additionalRewardPerToken = (timeElapsed * rewardRate * PRECISION) / totalSupply;
        
        return rewardPerTokenStored + additionalRewardPerToken;
    }

    /// @dev View the amount of rewards earned by `account`
    function earned(address account) public view returns (uint256) {
        uint256 rewardPerTokenDiff = rewardPerToken() - userRewardPerTokenPaid[account];
        uint256 newRewards = (balances[account] * rewardPerTokenDiff) / PRECISION;
        return newRewards + rewards[account];
    }
}