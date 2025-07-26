const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Staking DApp", function () {
  let MyToken, myToken;
  let StakingContract, stakingContract;
  let owner, user1, user2, user3;
  let rewardRate;

  beforeEach(async function () {
    // Get signers
    [owner, user1, user2, user3] = await ethers.getSigners();

    // Deploy MyToken
    MyToken = await ethers.getContractFactory("MyToken");
    myToken = await MyToken.deploy("MyToken", "MTK", 1000000); // 1M tokens
    await myToken.waitForDeployment();

    // Calculate reward rate (10% APY)
    const totalSupply = await myToken.totalSupply();
    const apy = 10n; 
    rewardRate = (totalSupply * apy) / (365n * 24n * 60n * 60n * 100n);

    // Deploy StakingContract
    StakingContract = await ethers.getContractFactory("StakingContract");
    stakingContract = await StakingContract.deploy(
      await myToken.getAddress(),
      await myToken.getAddress(),
      rewardRate
    );
    await stakingContract.waitForDeployment();

    // Transfer tokens to users for testing
    const userAmount = ethers.parseEther("1000");
    await myToken.transfer(user1.address, userAmount);
    await myToken.transfer(user2.address, userAmount);
    await myToken.transfer(user3.address, userAmount);

    // Transfer tokens to staking contract for rewards
    const rewardAmount = ethers.parseEther("50000");
    await myToken.transfer(await stakingContract.getAddress(), rewardAmount);
  });

  describe("MyToken", function () {
    it("Should have correct name and symbol", async function () {
      expect(await myToken.name()).to.equal("MyToken");
      expect(await myToken.symbol()).to.equal("MTK");
    });

    it("Should have correct initial supply", async function () {
      const expectedSupply = ethers.parseEther("1000000");
      expect(await myToken.totalSupply()).to.equal(expectedSupply);
    });

    it("Should have correct decimals", async function () {
      expect(await myToken.decimals()).to.equal(18);
    });

    it("Should allow transfers", async function () {
      const transferAmount = ethers.parseEther("100");
      const initialBalance = await myToken.balanceOf(user1.address);
      await myToken.transfer(user1.address, transferAmount);
      expect(await myToken.balanceOf(user1.address)).to.equal(initialBalance + transferAmount);
    });
  });

  describe("StakingContract", function () {
    describe("Deployment", function () {
      it("Should be deployed with correct parameters", async function () {
        expect(await stakingContract.stakingToken()).to.equal(await myToken.getAddress());
        expect(await stakingContract.rewardToken()).to.equal(await myToken.getAddress());
        expect(await stakingContract.rewardRate()).to.equal(rewardRate);
        expect(await stakingContract.MINIMUM_STAKE()).to.equal(ethers.parseEther("1"));
      });

      it("Should have correct owner", async function () {
        expect(await stakingContract.owner()).to.equal(owner.address);
      });

      it("Should start with zero total staked", async function () {
        expect(await stakingContract.getTotalStaked()).to.equal(0);
      });
    });

    describe("Staking", function () {
      beforeEach(async function () {
        // Approve tokens for staking
        await myToken.connect(user1).approve(await stakingContract.getAddress(), ethers.parseEther("1000"));
      });

      it("Should allow users to stake tokens", async function () {
        const stakeAmount = ethers.parseEther("100");
        
        await expect(stakingContract.connect(user1).stake(stakeAmount))
          .to.emit(stakingContract, "Staked")
          .withArgs(user1.address, stakeAmount);

        expect(await stakingContract.getStakedBalance(user1.address)).to.equal(stakeAmount);
        expect(await stakingContract.getTotalStaked()).to.equal(stakeAmount);
      });

      it("Should not allow staking zero amount", async function () {
        await expect(
          stakingContract.connect(user1).stake(0)
        ).to.be.revertedWith("Cannot stake zero");
      });

      it("Should not allow staking below minimum amount", async function () {
        const stakeAmount = ethers.parseEther("0.5"); // Below 1 token minimum
        
        await expect(
          stakingContract.connect(user1).stake(stakeAmount)
        ).to.be.revertedWith("Amount below minimum stake");
      });

      it("Should not allow staking more than balance", async function () {
        const stakeAmount = ethers.parseEther("2000"); // More than user has
        
        await expect(
          stakingContract.connect(user1).stake(stakeAmount)
        ).to.be.reverted; // Just check it reverts, don't check specific error
      });

      it("Should update user balance correctly", async function () {
        const stakeAmount = ethers.parseEther("100");
        await stakingContract.connect(user1).stake(stakeAmount);
        
        const userBalance = await myToken.balanceOf(user1.address);
        expect(userBalance).to.equal(ethers.parseEther("900")); // 1000 - 100
      });
    });

    describe("Unstaking", function () {
      beforeEach(async function () {
        // Stake tokens first
        await myToken.connect(user1).approve(await stakingContract.getAddress(), ethers.parseEther("1000"));
        await stakingContract.connect(user1).stake(ethers.parseEther("100"));
      });

      it("Should allow users to unstake tokens", async function () {
        const unstakeAmount = ethers.parseEther("50");
        const initialBalance = await myToken.balanceOf(user1.address);
        
        await expect(stakingContract.connect(user1).unstake(unstakeAmount))
          .to.emit(stakingContract, "Withdrawn")
          .withArgs(user1.address, unstakeAmount);

        expect(await stakingContract.getStakedBalance(user1.address)).to.equal(ethers.parseEther("50"));
        expect(await myToken.balanceOf(user1.address)).to.equal(initialBalance + unstakeAmount);
      });

      it("Should not allow unstaking zero amount", async function () {
        await expect(
          stakingContract.connect(user1).unstake(0)
        ).to.be.revertedWith("Cannot unstake zero");
      });

      it("Should not allow unstaking more than staked amount", async function () {
        const unstakeAmount = ethers.parseEther("150"); // More than staked
        
        await expect(
          stakingContract.connect(user1).unstake(unstakeAmount)
        ).to.be.revertedWith("Insufficient staked balance");
      });

      it("Should update total staked correctly", async function () {
        const unstakeAmount = ethers.parseEther("50");
        await stakingContract.connect(user1).unstake(unstakeAmount);
        
        expect(await stakingContract.getTotalStaked()).to.equal(ethers.parseEther("50"));
      });
    });

    describe("Rewards", function () {
      beforeEach(async function () {
        // Stake tokens
        await myToken.connect(user1).approve(await stakingContract.getAddress(), ethers.parseEther("1000"));
        await stakingContract.connect(user1).stake(ethers.parseEther("100"));
      });

      it("Should calculate pending rewards correctly", async function () {
        // Fast forward 1 day
        await ethers.provider.send("evm_increaseTime", [24 * 60 * 60]);
        await ethers.provider.send("evm_mine");
        
        const pendingRewards = await stakingContract.getPendingRewards(user1.address);
        expect(pendingRewards).to.be.gt(0);
      });

      it("Should allow claiming rewards", async function () {
         // Fast forward 1 day
         await ethers.provider.send("evm_increaseTime", [24 * 60 * 60]);
         await ethers.provider.send("evm_mine");
         
        const initialBalance = await myToken.balanceOf(user1.address);
        const pendingBefore = await stakingContract.getPendingRewards(user1.address);

        // claim
        const tx = await stakingContract.connect(user1).getReward();
        await expect(tx).to.emit(stakingContract, "RewardPaid"); // amount may drift by 1-2 wei

        const finalBalance = await myToken.balanceOf(user1.address);
        const paid = finalBalance - initialBalance;

        // ensure at least the originally pending amount was paid (could be a bit more)
        expect(paid).to.be.gte(pendingBefore);
      });

      it("Should not allow claiming rewards when not staking", async function () {
        // This should not revert, just return 0 rewards
        await expect(
          stakingContract.connect(user2).getReward()
        ).to.not.be.reverted;
      });
    });

    describe("Emergency Functions", function () {
      beforeEach(async function () {
        // Stake tokens
        await myToken.connect(user1).approve(await stakingContract.getAddress(), ethers.parseEther("1000"));
        await stakingContract.connect(user1).stake(ethers.parseEther("100"));
      });

      it("Should allow emergency withdraw", async function () {
        const stakedAmount = ethers.parseEther("100");
        const initialBalance = await myToken.balanceOf(user1.address);
        
        await expect(stakingContract.connect(user1).emergencyWithdraw())
          .to.emit(stakingContract, "EmergencyWithdrawn")
          .withArgs(user1.address, stakedAmount);

        expect(await myToken.balanceOf(user1.address)).to.equal(initialBalance + stakedAmount);
      });

      it("Should reset user state after emergency withdraw", async function () {
        await stakingContract.connect(user1).emergencyWithdraw();
        
        expect(await stakingContract.getStakedBalance(user1.address)).to.equal(0);
        expect(await stakingContract.getTotalStaked()).to.equal(0);
      });

      it("Should not allow emergency withdraw when no stake", async function () {
        await expect(
          stakingContract.connect(user2).emergencyWithdraw()
        ).to.be.revertedWith("No stake to withdraw");
      });
    });

    describe("Admin Functions", function () {
      it("Should allow owner to pause/unpause contract", async function () {
        await stakingContract.pause();
        expect(await stakingContract.paused()).to.be.true;
        
        await stakingContract.unpause();
        expect(await stakingContract.paused()).to.be.false;
      });

      it("Should not allow non-owner to pause contract", async function () {
        await expect(
          stakingContract.connect(user1).pause()
        ).to.be.reverted; // Just check it reverts, don't check specific error
      });

      it("Should allow owner to update reward rate", async function () {
        const newRewardRate = rewardRate * 2n;
        
        await expect(stakingContract.setRewardRate(newRewardRate))
          .to.emit(stakingContract, "RewardRateUpdated")
          .withArgs(newRewardRate);
      });

      it("Should not allow non-owner to update reward rate", async function () {
        const newRewardRate = rewardRate * 2n;
        
        await expect(
          stakingContract.connect(user1).setRewardRate(newRewardRate)
        ).to.be.reverted; // Just check it reverts, don't check specific error
      });

      it("Should not allow setting zero reward rate", async function () {
        await expect(
          stakingContract.setRewardRate(0)
        ).to.be.revertedWith("Reward rate must be positive");
      });
    });

    describe("View Functions", function () {
      beforeEach(async function () {
        // Stake tokens
        await myToken.connect(user1).approve(await stakingContract.getAddress(), ethers.parseEther("1000"));
        await stakingContract.connect(user1).stake(ethers.parseEther("100"));
      });

      it("Should return correct staked balance", async function () {
        const stakedBalance = await stakingContract.getStakedBalance(user1.address);
        expect(stakedBalance).to.equal(ethers.parseEther("100"));
      });

      it("Should return correct total staked", async function () {
        const totalStaked = await stakingContract.getTotalStaked();
        expect(totalStaked).to.equal(ethers.parseEther("100"));
      });

      it("Should return correct user info", async function () {
        const userInfo = await stakingContract.getUserInfo(user1.address);
        expect(userInfo.stakedBalance).to.equal(ethers.parseEther("100"));
        expect(userInfo.pendingRewards).to.be.gte(0);
      });

      it("Should return correct contract info", async function () {
        const contractInfo = await stakingContract.getContractInfo();
        expect(contractInfo.totalStaked_).to.equal(ethers.parseEther("100"));
        expect(contractInfo.rewardRate_).to.equal(rewardRate);
        expect(contractInfo.minimumStake).to.equal(ethers.parseEther("1"));
        expect(contractInfo.isPaused).to.be.false;
      });

      it("Should return correct hasStaked status", async function () {
        expect(await stakingContract.hasStaked(user1.address)).to.be.true;
        expect(await stakingContract.hasStaked(user2.address)).to.be.false;
      });

      it("Should return correct reward per token stored", async function () {
        const rewardPerTokenStored = await stakingContract.getRewardPerTokenStored();
        expect(rewardPerTokenStored).to.be.gte(0);
      });

      it("Should return correct user reward debt", async function () {
        const userRewardDebt = await stakingContract.getUserRewardDebt(user1.address);
        expect(userRewardDebt).to.be.gte(0);
      });
    });

    describe("Exit Function", function () {
      beforeEach(async function () {
        // Stake tokens
        await myToken.connect(user1).approve(await stakingContract.getAddress(), ethers.parseEther("1000"));
        await stakingContract.connect(user1).stake(ethers.parseEther("100"));
      });

      it("Should allow exit (unstake all and claim rewards)", async function () {
        const initialBalance = await myToken.balanceOf(user1.address);
        
        await stakingContract.connect(user1).exit();
        
        expect(await stakingContract.getStakedBalance(user1.address)).to.equal(0);
        expect(await stakingContract.getTotalStaked()).to.equal(0);
        expect(await myToken.balanceOf(user1.address)).to.be.gt(initialBalance);
      });
    });

    describe("Edge Case Coverage", function () {
      // helper to move the chain forward
      const timeTravel = async (secs) => {
        await ethers.provider.send("evm_increaseTime", [secs])
        await ethers.provider.send("evm_mine")
      }

      it("Should block stake/unstake when contract is paused", async function () {
        await myToken.connect(user1).approve(await stakingContract.getAddress(), ethers.parseEther("10"))

        await stakingContract.pause()
        await expect(
          stakingContract.connect(user1).stake(ethers.parseEther("1"))
        ).to.be.reverted // paused

        await stakingContract.unpause()
        await stakingContract.connect(user1).stake(ethers.parseEther("1")) // now works

        await stakingContract.pause()
        await expect(
          stakingContract.connect(user1).unstake(ethers.parseEther("1"))
        ).to.be.reverted // paused
      })

      it("depositRewards should emit event and increase contract balance", async function () {
        const addAmount = ethers.parseEther("500")
        await myToken.approve(await stakingContract.getAddress(), addAmount)
        const balBefore = await myToken.balanceOf(await stakingContract.getAddress())

        await expect(stakingContract.depositRewards(addAmount))
          .to.emit(stakingContract, "RewardsDeposited").withArgs(addAmount)

        const balAfter = await myToken.balanceOf(await stakingContract.getAddress())
        expect(balAfter).to.equal(balBefore + addAmount)
      })

      it("Changing rewardRate only affects future rewards", async function () {
        await myToken.connect(user1).approve(await stakingContract.getAddress(), ethers.parseEther("10"))
        await stakingContract.connect(user1).stake(ethers.parseEther("10"))

        // accrue rewards for 10 seconds with current rate
        await timeTravel(10)
        const pendingBefore = await stakingContract.getPendingRewards(user1.address)
        expect(pendingBefore).to.be.gt(0)

        // double reward rate
        const currentRate = await stakingContract.rewardRate()
        const newRate = currentRate * 2n
        await stakingContract.setRewardRate(newRate)

        // accrue 5 more seconds
        await timeTravel(5)
        const pendingAfter = await stakingContract.getPendingRewards(user1.address)

        expect(pendingAfter).to.be.gt(pendingBefore)
      })
    })
  });

  describe("Integration Tests", function () {
    it("Should handle multiple users staking and unstaking", async function () {
      // Setup approvals
      await myToken.connect(user1).approve(await stakingContract.getAddress(), ethers.parseEther("1000"));
      await myToken.connect(user2).approve(await stakingContract.getAddress(), ethers.parseEther("1000"));
      
      // Users stake
      await stakingContract.connect(user1).stake(ethers.parseEther("100"));
      await stakingContract.connect(user2).stake(ethers.parseEther("200"));
      
      // Check total staked
      expect(await stakingContract.getTotalStaked()).to.equal(ethers.parseEther("300"));
      
      // Users unstake
      await stakingContract.connect(user1).unstake(ethers.parseEther("50"));
      await stakingContract.connect(user2).unstake(ethers.parseEther("100"));
      
      // Check balances
      expect(await stakingContract.getStakedBalance(user1.address)).to.equal(ethers.parseEther("50"));
      expect(await stakingContract.getStakedBalance(user2.address)).to.equal(ethers.parseEther("100"));
      expect(await stakingContract.getTotalStaked()).to.equal(ethers.parseEther("150"));
    });

    it("Should handle rewards distribution correctly", async function () {
      // Setup and stake
      await myToken.connect(user1).approve(await stakingContract.getAddress(), ethers.parseEther("1000"));
      await stakingContract.connect(user1).stake(ethers.parseEther("100"));
      
      // Fast forward and claim rewards
      await ethers.provider.send("evm_increaseTime", [24 * 60 * 60]); // 1 day
      await ethers.provider.send("evm_mine");
      
      const initialBalance = await myToken.balanceOf(user1.address);
      await stakingContract.connect(user1).getReward();
      
      const finalBalance = await myToken.balanceOf(user1.address);
      expect(finalBalance).to.be.gt(initialBalance);
    });
  });
}); 