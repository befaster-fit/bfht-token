const { expect } = require("chai");
const { ethers, network } = require("hardhat");
const { createContract } = require("../../scripts/configurationMethods");
const EULER = 2.7183;
async function baseTestingCases(owner, client, stakingContract, mintableToken, tokenPairs, plans) {
    let timestamp;
    describe("Return constructor data", async function () {
        before(async function () {
            const contract = await createContract("TimestampMock", [], owner);
            timestamp = (await contract.get()).toNumber();
        });
        it("shouldn't return 0 address for staked token", async function () {
            expect(await stakingContract.getToken()).to.not.be.equal(ethers.constants.AddressZero);
        });
        it("should be able to return token address", async function () {
            expect(await stakingContract.getToken()).to.be.equal(mintableToken.address);
        });
    });
    describe("Settings", async function () {
        it("shouldn't be able to set a plan with invalid access control", async function () {
            await expect(stakingContract.connect(client).setPlan(0, 0, 40, 0))
                // eslint-disable-next-line max-len
                .to.be.revertedWith(
                    "AccessControl: account " +
                        (await client.getAddress()).toLocaleLowerCase() +
                        " is missing role 0x0000000000000000000000000000000000000000000000000000000000000000",
                );
        });
        it("shouldn't be able to set a plan with invalid data", async function () {
            await stakingContract.connect(owner);
            await expect(stakingContract.connect(owner).setPlan(0, 0, 40, 0)).to.be.revertedWith(
                "StakeManager: Invalid staking plan data",
            );
        });
        let planSetReceipt;
        it("should be able to set a simple plan", async function () {
            const planId = await stakingContract.callStatic.setPlan(1, 10 * 10 ** 6, 10, 0);
            planSetReceipt = await stakingContract.setPlan(1, 10 * 10 ** 6, 10, 0);
            plans.push(planId);
        });
        it("should be able to get an event for setting the plan", async function () {
            const awaitedReceipt = await planSetReceipt.wait();
            expect(awaitedReceipt.events[0].event).to.be.equal("PlanSet");
            const eventData = stakingContract.interface.decodeEventLog("PlanSet", awaitedReceipt.events[0].data);
            expect(eventData.period).to.be.equal(1);
            expect(eventData.apy).to.be.equal(10 * 10 ** 6);
            expect(eventData.emergencyTax).to.be.equal(10);
            expect(eventData.minimalAmount).to.be.equal(0);
        });
        let planDisabledReceipt;
        it("should be able to dectivate with invalid access", async function () {
            await expect(stakingContract.connect(client).deactivatePlan(plans[0]))
                // eslint-disable-next-line max-len
                .to.be.revertedWith(
                    "AccessControl: account " +
                        (await client.getAddress()).toLocaleLowerCase() +
                        " is missing role 0x0000000000000000000000000000000000000000000000000000000000000000",
                );
        });
        it("should be able to set the plan to deactivated", async function () {
            planDisabledReceipt = await stakingContract.connect(owner).deactivatePlan(plans[0]);
            expect((await stakingContract.getPlan(plans[0])).active).to.be.equal(false);
        });
        it("should be able to get an event from deactivating the plan", async function () {
            const awaitedReceipt = await planDisabledReceipt.wait();
            expect(awaitedReceipt.events[0].event).to.be.equal("PlanDisabled");
            const eventData = stakingContract.interface.decodeEventLog("PlanDisabled", awaitedReceipt.events[0].data);
            expect(eventData.period).to.be.equal(1);
            expect(eventData.apy).to.be.equal(10 * 10 ** 6);
            expect(eventData.emergencyTax).to.be.equal(10);
        });
        it("should be able to reactivate the plan", async function () {
            await stakingContract.setPlan(1, 10 * 10 ** 6, 10, 0);
            expect((await stakingContract.getPlan(plans[0])).active).to.be.equal(true);
        });
        it("shouldn't be able to set compound period with invalid access", async function () {
            await expect(stakingContract.connect(client).setCompoundPeriod(0))
                // eslint-disable-next-line max-len
                .to.be.revertedWith(
                    "AccessControl: account " +
                        (await client.getAddress()).toLocaleLowerCase() +
                        " is missing role 0x0000000000000000000000000000000000000000000000000000000000000000",
                );
        });
        it("shouldn't be able to set compound period to 0", async function () {
            await stakingContract.connect(owner);
            await expect(stakingContract.setCompoundPeriod(0)).to.be.revertedWith(
                "StakeManager: Invalid compound period",
            );
        });
        it("should be able to get an event from changing the compound", async function () {
            const receipt = await (await stakingContract.connect(owner).setCompoundPeriod(86400)).wait();
            expect(receipt.events[receipt.events.length - 1].event).to.be.equal("CompoundSet");
            const eventData = stakingContract.interface.decodeEventLog(
                "CompoundSet",
                receipt.events[receipt.events.length - 1].data,
            );
            expect(eventData.setter).to.be.equal(await owner.getAddress());
            expect(eventData.period).to.be.equal(86400);
        });
        it("shouldn't be able to set the compound availability with invalid access", async function () {
            await expect((await stakingContract.connect(client)).setCompoundEnabled(true))
                // eslint-disable-next-line max-len
                .to.be.revertedWith(
                    "AccessControl: account " +
                        (await client.getAddress()).toLocaleLowerCase() +
                        " is missing role 0x0000000000000000000000000000000000000000000000000000000000000000",
                );
        });
        it("should be able to get an event from changing the compound to enabled", async function () {
            const receipt = await (await stakingContract.connect(owner).setCompoundEnabled(true)).wait();
            expect(receipt.events[receipt.events.length - 1].event).to.be.equal("CompoundEnabled");
            const eventData = stakingContract.interface.decodeEventLog(
                "CompoundEnabled",
                receipt.events[receipt.events.length - 1].data,
            );
            expect(eventData.setter).to.be.equal(await owner.getAddress());
            expect(eventData.enabled).to.be.equal(true);
        });
        it("shouldn't be able to set max mintable token count period with invalid access", async function () {
            await expect(stakingContract.connect(client).setMaxTokensMinted(0))
                // eslint-disable-next-line max-len
                .to.be.revertedWith(
                    "AccessControl: account " +
                        (await client.getAddress()).toLocaleLowerCase() +
                        " is missing role 0x0000000000000000000000000000000000000000000000000000000000000000",
                );
        });
        it("should be able to get an event from changing the max mintable token count", async function () {
            await stakingContract.connect(owner);
            const receipt = await (await stakingContract.setMaxTokensMinted("10000000000000000")).wait();
            expect(receipt.events[receipt.events.length - 1].event).to.be.equal("MaxTokensMinted");
            const eventData = stakingContract.interface.decodeEventLog(
                "MaxTokensMinted",
                receipt.events[receipt.events.length - 1].data,
            );
            expect(eventData.setter).to.be.equal(await owner.getAddress());
            expect(eventData.mintingAmount).to.be.equal("10000000000000000");
        });
        it("shouldn't be able to set the pair with invalid access", async function () {
            await expect(stakingContract.connect(client).setPricePair(tokenPairs[0], tokenPairs[1]))
                // eslint-disable-next-line max-len
                .to.be.revertedWith(
                    "AccessControl: account " +
                        (await client.getAddress()).toLocaleLowerCase() +
                        " is missing role 0x0000000000000000000000000000000000000000000000000000000000000000",
                );
        });
        it("shouldn't be able to set a pair to invalid address", async function () {
            await stakingContract.connect(owner);
            await expect(stakingContract.setPricePair(ethers.constants.AddressZero, ethers.constants.AddressZero))
                // eslint-disable-next-line max-len
                .to.be.revertedWith("StakeManager: Invalid pricePair address");
        });
        it("should be able to set a valid token pair", async function () {
            const awaitedReceipt = await (await stakingContract.setPricePair(tokenPairs[0], tokenPairs[1])).wait();
            expect(awaitedReceipt.events[awaitedReceipt.events.length - 1].event).to.be.equal("PricePairSet");
            const eventData = stakingContract.interface.decodeEventLog(
                "PricePairSet",
                awaitedReceipt.events[awaitedReceipt.events.length - 1].data,
            );
            expect(eventData.setter).to.be.equal(await owner.getAddress());
            expect(eventData.pricePairs[0].toLocaleLowerCase()).to.be.equal(tokenPairs[0].toLocaleLowerCase());
            expect(eventData.pricePairs[1].toLocaleLowerCase()).to.be.equal(tokenPairs[1].toLocaleLowerCase());
        });
    });
    describe("Stake and unstake", async function () {
        let stakeReceipt;
        let stakeId;
        it("shouldn't be able to stake with 0 amount", async function () {
            await expect(stakingContract.stake(0, ethers.constants.HashZero, false)).to.be.revertedWith(
                "StakeManager: Invalid staking amount",
            );
        });
        it("shouldn't be able to stake without allowance", async function () {
            await mintableToken.approve(stakingContract.address, 0);
            await expect(stakingContract.stake(10, ethers.constants.HashZero, false)).to.be.revertedWith(
                "StakeManager: Increase allowance",
            );
        });
        //@todo Write test for too less of staking amount
        it("should be able to stake with valid amount", async function () {
            const signerBalance = await mintableToken.balanceOf(owner.getAddress());
            await mintableToken.approve(stakingContract.address, 100000000);
            stakeReceipt = await stakingContract.stake(100000000, plans[0], false);
            expect(await mintableToken.balanceOf(owner.getAddress())).to.be.equal(signerBalance - 100000000);
        });
        it("should be able to return stake event", async function () {
            const awaitedReceipt = await stakeReceipt.wait();
            expect(awaitedReceipt.events[awaitedReceipt.events.length - 1].event).to.be.equal("Staked");
            const eventData = stakingContract.interface.decodeEventLog(
                "Staked",
                awaitedReceipt.events[awaitedReceipt.events.length - 1].data,
            );
            expect(eventData.amount).to.be.equal(100000000);
            expect(eventData.planId).to.be.equal(plans[0]);
            expect(eventData.pricePerStable[0]).to.be.equal(1000000);
            expect(eventData.pricePerStable[1]).to.be.equal(9974);
            expect(eventData.pricePerStable[2]).to.be.equal(4203080);
            expect(eventData.stakedTokenMoreExpensive[0]).to.be.equal(false);
            expect(eventData.stakedTokenMoreExpensive[1]).to.be.equal(false);
            expect(eventData.stakedTokenMoreExpensive[2]).to.be.equal(true);
            expect(eventData.pips.toNumber()).to.be.equal(6);

            stakeId = eventData.stakeId;
        });
        it("should be able to return correct current TVL", async function () {
            expect((await stakingContract.getTVL()).toNumber()).to.be.equal(100000000);
        });
        it("should be able to return correct current Issued Tokens and Expected Tokens to issue", async function () {
            expect((await stakingContract.getIssuedTokens()).toNumber()).to.be.equal(0);
            expect((await stakingContract.getExpectedIssuedTokens()).toNumber()).to.be.equal(27397);
        });
        it("should be able to return all stakes", async function () {
            const stakes = await stakingContract.getStakes();
            const stake = stakes[stakes.length - 1];
            expect(stake.amount).to.be.equal(100000000);
            stakeId = stake.stakeId;
        });
        it("should be able to return stake by id", async function () {
            expect((await stakingContract.getStakesById([stakeId]))[0].amount).to.be.equal(100000000);
            expect((await stakingContract.getStakesById([stakeId]))[0].account).to.be.equal(await owner.getAddress());
        });
        it("shouldn't be able to unstake before passing the staking period", async function () {
            await expect(stakingContract.unstake(stakeId)).to.be.revertedWith(
                "StakeManager: Stake not yet available to unstake",
            );
        });
        it("should be able to return the stake", async function () {
            const stakes = await stakingContract.getStakes();
            expect(stakes.length).to.be.equal(1);
            expect(stakes[0].amount).to.be.equal(100000000);
        });
        it("shouldn't be able to unstake before passing the WHOLE staking period", async function () {
            await network.provider.send("evm_mine", [timestamp + 86400 / 2]);
            await expect(stakingContract.unstake(stakeId)).to.be.revertedWith(
                "StakeManager: Stake not yet available to unstake",
            );
        });
        it("should be able to unstake if the time has passed the staking period", async function () {
            await network.provider.send("evm_mine", [timestamp + 86400 + 1000]);
            const balance = await mintableToken.balanceOf(await owner.getAddress());
            const totalSupply = (await mintableToken.totalSupply()).toNumber();
            const awaitedReceipt = await (await stakingContract.unstake(stakeId)).wait();
            const eventData = stakingContract.interface.decodeEventLog(
                "Unstaked",
                awaitedReceipt.events[awaitedReceipt.events.length - 2].data,
            );
            expect(eventData.stakedAmount).to.be.equal(100000000);
            expect(eventData.unstakedAmount).to.be.equal(100027397);
            expect(eventData.planId).to.be.equal(plans[0]);
            const newBalance = await mintableToken.balanceOf(await owner.getAddress());
            expect(newBalance.toNumber()).to.be.equal(balance.toNumber() + 100027397);
            expect((await mintableToken.totalSupply()).toNumber()).to.be.equal(totalSupply + 27397);
        });
        it("should be able to return correct current TVL", async function () {
            expect((await stakingContract.getTVL()).toNumber()).to.be.equal(0);
        });
        it("should be able to return correct current Issued Tokens and Expected Tokens to issue", async function () {
            expect((await stakingContract.getIssuedTokens()).toNumber()).to.be.equal(27397);
            expect((await stakingContract.getExpectedIssuedTokens()).toNumber()).to.be.equal(27397);
        });
        it("shouldn't be able to change the mintable token count to a lower value than already minted", async function () {
            await expect(stakingContract.setMaxTokensMinted(0)).to.be.revertedWith(
                "StakeManager: Already minted tokens are more than proposed mintable amount",
            );
        });
    });
    describe("Stake, withdraw/unstakTo/withdrawTo", async function () {
        let stakeId;
        before(async function () {
            plans.push(await stakingContract.callStatic.setPlan(2, 10 * 10 ** 6, 10, 0));
            planSetReceipt = await stakingContract.setPlan(2, 10 * 10 ** 6, 10, 0);
            const signerBalance = await mintableToken.balanceOf(owner.getAddress());
            await mintableToken.approve(stakingContract.address, 100000000);
            stakeReceipt = await stakingContract.stake(100000000, plans[1], false);
            expect(await mintableToken.balanceOf(owner.getAddress())).to.be.equal(signerBalance - 100000000);
            const awaitedReceipt = await stakeReceipt.wait();
            expect(awaitedReceipt.events[awaitedReceipt.events.length - 1].event).to.be.equal("Staked");
            const eventData = stakingContract.interface.decodeEventLog(
                "Staked",
                awaitedReceipt.events[awaitedReceipt.events.length - 1].data,
            );
            expect(eventData.amount).to.be.equal(100000000);
            expect(eventData.planId).to.be.equal(plans[1]);
            const stakes = await stakingContract.getStakes();
            for (const stake of stakes) {
                if (stake.amount.toNumber() === 100000000) {
                    stakeId = stake.stakeId;
                }
            }
        });
        it("should be able to return correct current TVL", async function () {
            expect((await stakingContract.getTVL()).toNumber()).to.be.equal(100000000);
        });
        it("should be able to return correct current Issued Tokens and Expected Tokens to issue", async function () {
            expect((await stakingContract.getIssuedTokens()).toNumber()).to.be.equal(27397);
            expect((await stakingContract.getExpectedIssuedTokens()).toNumber()).to.be.equal(82191);
        });
        it("should be able to withdraw part of the reward to its own wallet", async function () {
            //86400*2 because of the previous tests + added 10 seconds to be sure that a day have passed
            await network.provider.send("evm_mine", [timestamp + 86400 * 2 + 10000]);
            const signerBalance = await mintableToken.balanceOf(await owner.getAddress());
            const totalSupplyToken = (await mintableToken.totalSupply()).toNumber();
            await stakingContract.withdrawRewards(stakeId);
            expect(await mintableToken.balanceOf(await owner.getAddress())).to.be.equal(
                signerBalance.add(Math.floor(27397)),
            );
            expect((await mintableToken.totalSupply()).toNumber()).to.be.equal(totalSupplyToken + Math.floor(27397));
        });
        it("should be able to return correct current Issued Tokens and Expected Tokens to issue", async function () {
            expect((await stakingContract.getIssuedTokens()).toNumber()).to.be.equal(54794);
            expect((await stakingContract.getExpectedIssuedTokens()).toNumber()).to.be.equal(82191);
        });
        it("should be able to withdraw part of the reward to a foreign wallet", async function () {
            [owner0, account1] = await ethers.getSigners();
            //86400*2 because of the previous tests + added 10 seconds to be sure that a day have passed
            await network.provider.send("evm_mine", [timestamp + 86400 * 3 + 20000]);
            const account1Balance = (await mintableToken.balanceOf(await account1.getAddress())).toNumber();
            const totalSupplyToken = (await mintableToken.totalSupply()).toNumber();
            await stakingContract.withdrawRewardsTo(stakeId, await account1.getAddress());
            expect(await mintableToken.balanceOf(await account1.getAddress())).to.be.equal(
                account1Balance + Math.floor(27397),
            );
            expect((await mintableToken.totalSupply()).toNumber()).to.be.equal(totalSupplyToken + Math.floor(27397));
        });
        it("should be able to return correct current Issued Tokens and Expected Tokens to issue", async function () {
            expect((await stakingContract.getIssuedTokens()).toNumber()).to.be.equal(82191);
            expect((await stakingContract.getExpectedIssuedTokens()).toNumber()).to.be.equal(82191);
        });
        it("should not be able to emergency exit after passing the staking period", async function () {
            await expect(stakingContract.emergencyExit(stakeId)).to.be.revertedWith("StakeManager: Can unstake");
        });
        it("should be able to unstake to a foreign wallet", async function () {
            [owner0, account1] = await ethers.getSigners();
            const account1Balance = await mintableToken.balanceOf(await account1.getAddress());
            await stakingContract.unstakeTo(stakeId, await account1.getAddress());
            expect(await mintableToken.balanceOf(await account1.getAddress())).to.be.equal(
                account1Balance.add(100000000),
            );
        });
        it("should be able to return correct current TVL", async function () {
            expect((await stakingContract.getTVL()).toNumber()).to.be.equal(0);
        });
    });
    describe("Stake (non-compound), check stake status externally and emergency exit", async function () {
        let stakeId;
        before(async function () {
            const signerBalance = await mintableToken.balanceOf(owner.getAddress());
            await mintableToken.approve(stakingContract.address, 100000000);
            stakeReceipt = await stakingContract.stake(100000000, plans[1], false);
            expect(await mintableToken.balanceOf(owner.getAddress())).to.be.equal(signerBalance - 100000000);
            const awaitedReceipt = await stakeReceipt.wait();
            expect(awaitedReceipt.events[awaitedReceipt.events.length - 1].event).to.be.equal("Staked");
            const eventData = stakingContract.interface.decodeEventLog(
                "Staked",
                awaitedReceipt.events[awaitedReceipt.events.length - 1].data,
            );
            expect(eventData.amount).to.be.equal(100000000);
            expect(eventData.planId).to.be.equal(plans[1]);
            const stakes = await stakingContract.getStakes();
            for (const stake of stakes) {
                if (stake.amount.toNumber() === 100000000) {
                    stakeId = stake.stakeId;
                }
            }
        });
        it("should be able to return correct current TVL", async function () {
            expect((await stakingContract.getTVL()).toNumber()).to.be.equal(100000000);
        });
        it("Should be able to get the stake rewards for the end period of the stake", async function () {
            expect(
                await stakingContract.getStakeRewards(
                    stakeId,
                    Math.floor(timestamp + 86400 * 3),
                    Math.floor(timestamp + 86400 * 5 + 60000),
                ),
            ).to.be.equal(27397 * 2);
        });
        it("Should be able to get the stake rewards for after the end period of the stake", async function () {
            expect(
                await stakingContract.getStakeRewards(
                    stakeId,
                    Math.floor(timestamp + 86400 * 3),
                    Math.floor(timestamp + 86400 * 8 + 60000),
                ),
            ).to.be.equal(27397 * 2);
        });
        it("should be able to return correct current Issued Tokens and Expected Tokens to issue", async function () {
            expect((await stakingContract.getIssuedTokens()).toNumber()).to.be.equal(82191);
            expect((await stakingContract.getExpectedIssuedTokens()).toNumber()).to.be.equal(136985);
        });
        it("Should be able to emergency exit after a day has passed and emit event", async function () {
            await network.provider.send("evm_mine", [timestamp + 86400 * 4 + 40000]);
            const stake = (await stakingContract.getStakes())[0];
            const plan = await stakingContract.getPlan(stake.planId);

            const emergencyExitParameters = await stakingContract.callStatic.emergencyExit(stakeId);
            const staked = 100000000;
            const emergencyLoss = Math.floor(((100000000 + 27397) * plan.emergencyTax) / 100);
            expect(emergencyExitParameters.withdrawn).to.be.equal(staked + 27397 - emergencyLoss);
            expect(emergencyExitParameters.emergencyLoss).to.be.equal(emergencyLoss);
            const receipt = await stakingContract.emergencyExit(stakeId);
            const awaitedReceipt = await receipt.wait();
            const eventData = stakingContract.interface.decodeEventLog(
                "EmergencyExited",
                awaitedReceipt.events[awaitedReceipt.events.length - 1].data,
            );
            expect(eventData.staked).to.be.equal(staked);
            expect(eventData.withdrawn).to.be.equal(staked + 27397 - emergencyLoss);
            expect(eventData.planId).to.be.equal(plans[1]);
            expect(eventData.stakeId).to.be.equal(stakeId);
        });
        it("should be able to return correct current TVL", async function () {
            expect((await stakingContract.getTVL()).toNumber()).to.be.equal(0);
        });
        it("should be able to return correct current Issued Tokens and Expected Tokens to issue", async function () {
            expect((await stakingContract.getIssuedTokens()).toNumber()).to.be.equal(106849);
            expect((await stakingContract.getExpectedIssuedTokens()).toNumber()).to.be.equal(106849);
        });
    });
    describe("Stake (compound), check stake status externally and emergencyExit", async function () {
        let stakeId;
        before(async function () {
            const signerBalance = await mintableToken.balanceOf(owner.getAddress());
            await mintableToken.approve(stakingContract.address, 100000000);
            stakeReceipt = await stakingContract.stake(100000000, plans[1], true);
            expect(await mintableToken.balanceOf(owner.getAddress())).to.be.equal(signerBalance - 100000000);
            const awaitedReceipt = await stakeReceipt.wait();
            expect(awaitedReceipt.events[awaitedReceipt.events.length - 1].event).to.be.equal("Staked");
            const eventData = stakingContract.interface.decodeEventLog(
                "Staked",
                awaitedReceipt.events[awaitedReceipt.events.length - 1].data,
            );
            expect(eventData.amount).to.be.equal(100000000);
            expect(eventData.planId).to.be.equal(plans[1]);
            const stakes = await stakingContract.getStakes();
            for (const stake of stakes) {
                if (stake.amount.toNumber() === 100000000) {
                    stakeId = stake.stakeId;
                }
            }
        });
        it("should be able to return correct current TVL", async function () {
            expect((await stakingContract.getTVL()).toNumber()).to.be.equal(100000000);
        });
        it("should be able to return correct current Issued Tokens and Expected Tokens to issue", async function () {
            expect((await stakingContract.getIssuedTokens()).toNumber()).to.be.equal(106849);
            expect((await stakingContract.getExpectedIssuedTokens()).toNumber()).to.be.equal(161650); //54,801
        });
        it("Should be able to get the stake rewards for the end period of the stake", async function () {
            expect(
                await stakingContract.getStakeRewards(
                    stakeId,
                    Math.floor(timestamp + 86400 * 4),
                    Math.floor(timestamp + 86400 * 5 + 60000),
                ),
            ).to.be.equal(Math.floor(100000000 * Math.pow(EULER, 0.1 * (1 / 365))) - 100000000 - 4);
        });
        it("Should be able to get the stake rewards for after the end period of the stake", async function () {
            expect(
                await stakingContract.getStakeRewards(
                    stakeId,
                    Math.floor(timestamp + 86400 * 4),
                    Math.floor(timestamp + 86400 * 8 + 60000),
                ),
            ).to.be.equal(
                Math.floor(100000000 * Math.pow(EULER, 0.1 * 0.00547945205479452054794520547945)) - 100000000 - 8,
            );
        });
        it("Should be able to emergency exit after a day has passed and emit event", async function () {
            await network.provider.send("evm_mine", [timestamp + 86400 * 5 + 60000]);
            const stake = (await stakingContract.getStakes())[0];
            const plan = await stakingContract.getPlan(stake.planId);
            const emergencyExitParameters = await stakingContract.callStatic.emergencyExit(stakeId);
            const staked = 100000000;
            const rewards = Math.floor(staked * Math.pow(EULER, 0.1 * (1 / 365))) - staked - 4;
            const emergencyLoss = Math.floor(((staked + rewards) * plan.emergencyTax) / 100);
            expect(emergencyExitParameters.withdrawn).to.be.equal(staked + rewards - emergencyLoss);
            expect(emergencyExitParameters.emergencyLoss).to.be.equal(emergencyLoss);

            const awaitedReceipt = await (await stakingContract.emergencyExit(stakeId)).wait();
            const eventData = stakingContract.interface.decodeEventLog(
                "EmergencyExited",
                awaitedReceipt.events[awaitedReceipt.events.length - 1].data,
            );
            expect(eventData.staked).to.be.equal(staked);
            expect(eventData.withdrawn).to.be.equal(staked + rewards - emergencyLoss);
            expect(eventData.planId).to.be.equal(plans[1]);
            expect(eventData.stakeId).to.be.equal(stakeId);
        });
        it("should be able to return correct current TVL", async function () {
            expect((await stakingContract.getTVL()).toNumber()).to.be.equal(0);
        });
        it("should be able to return correct current Issued Tokens and Expected Tokens to issue", async function () {
            expect((await stakingContract.getIssuedTokens()).toNumber()).to.be.equal(131507);
            expect((await stakingContract.getExpectedIssuedTokens()).toNumber()).to.be.equal(131507);
        });
    });
    describe("Stake (compound) and combined, check stake status externally and emergencyExit", async function () {
        let stakeIdToBeCombined;
        let stakeIdToNotBeCombined;
        let stakeId;
        before(async function () {
            await network.provider.send("evm_mine", [timestamp + 86400 * 6 + 60000]);
            plans.push(await stakingContract.callStatic.setPlan(4, 10 * 10 ** 6, 10, 200000000));
            planSetReceipt = await stakingContract.setPlan(4, 10 * 10 ** 6, 10, 200000000);

            const signerBalance = await mintableToken.balanceOf(owner.getAddress());
            await mintableToken.approve(stakingContract.address, 100000000);
            stakeReceipt = await stakingContract.stake(100000000, plans[1], true);
            expect(await mintableToken.balanceOf(owner.getAddress())).to.be.equal(signerBalance - 100000000);
            const awaitedReceipt = await stakeReceipt.wait();
            expect(awaitedReceipt.events[awaitedReceipt.events.length - 1].event).to.be.equal("Staked");
            const eventData = stakingContract.interface.decodeEventLog(
                "Staked",
                awaitedReceipt.events[awaitedReceipt.events.length - 1].data,
            );
            expect(eventData.amount).to.be.equal(100000000);
            expect(eventData.planId).to.be.equal(plans[1]);
            const stakes0 = await stakingContract.getStakes();
            for (const stake of stakes0) {
                if (stake.amount.toNumber() === 100000000) {
                    stakeIdToBeCombined = stake.stakeId;
                }
            }

            await mintableToken.approve(stakingContract.address, 300000000);
            stakeReceipt = await stakingContract.stake(300000000, plans[2], true);
            const awaitedReceipt1 = await stakeReceipt.wait();
            expect(awaitedReceipt1.events[awaitedReceipt1.events.length - 1].event).to.be.equal("Staked");
            const eventData1 = stakingContract.interface.decodeEventLog(
                "Staked",
                awaitedReceipt1.events[awaitedReceipt1.events.length - 1].data,
            );
            expect(eventData1.amount).to.be.equal(300000000);
            expect(eventData1.planId).to.be.equal(plans[2]);
            const stakes1 = await stakingContract.getStakes();
            for (const stake of stakes1) {
                if (stake.amount.toNumber() === 300000000) {
                    stakeIdToNotBeCombined = stake.stakeId;
                }
            }
        });
        it("should be able to return correct current TVL", async function () {
            expect((await stakingContract.getTVL()).toNumber()).to.be.equal(400000000);
        });
        it("should be able to return correct current Issued Tokens and Expected Tokens to issue", async function () {
            //@TODO here
            expect((await stakingContract.getIssuedTokens()).toNumber()).to.be.equal(131507);
            expect((await stakingContract.getExpectedIssuedTokens()).toNumber()).to.be.equal(515208); //54,801 //219,207
        });
        it("Should be able to return all combinable stakes", async function () {
            await network.provider.send("evm_mine", [timestamp + 86400 * 7 + 80000]);
            const combinableStakes = await stakingContract.getCombinableStakes(
                await owner.getAddress(),
                300000000,
                plans[2],
            );
            expect(combinableStakes.length).to.be.equal(2);
            expect(combinableStakes[0]).to.be.equal(stakeIdToBeCombined);
            expect(combinableStakes[1]).to.be.equal(stakeIdToNotBeCombined);
        });
        it("Should be able to stake", async function () {
            await mintableToken.approve(stakingContract.address, 300000000);
            stakeReceipt = await stakingContract.stakeCombined(300000000, plans[2], true, [stakeIdToBeCombined], false);
            const awaitedReceipt2 = await stakeReceipt.wait();
            expect(awaitedReceipt2.events[awaitedReceipt2.events.length - 1].event).to.be.equal("Staked");
            const eventData2 = stakingContract.interface.decodeEventLog(
                "Staked",
                awaitedReceipt2.events[awaitedReceipt2.events.length - 1].data,
            );
            expect(eventData2.amount).to.be.equal(300000000 + 100000000 + 27397);
            expect(eventData2.planId).to.be.equal(plans[2]);
            const stakes1 = await stakingContract.getStakes();
            for (const stake of stakes1) {
                if (stake.amount.toNumber() === 300000000 + 100000000 + 27397) {
                    stakeId = stake.stakeId;
                }
            }
        });
        it("should be able to return correct current TVL", async function () {
            expect((await stakingContract.getTVL()).toNumber()).to.be.equal(700027397); //400,027,397 + 300000000
        });
        it("should be able to return correct current Issued Tokens and Expected Tokens to issue", async function () {
            expect((await stakingContract.getIssuedTokens()).toNumber()).to.be.equal(158904); //131507 + 27397
            expect((await stakingContract.getExpectedIssuedTokens()).toNumber()).to.be.equal(926368); //487,804 + 465,961
        });
        it("Should be able to emergency exit after a day has passed and emit event", async function () {
            await network.provider.send("evm_mine", [timestamp + 86400 * 8 + 100000]);
            const stake = (await stakingContract.getStakes())[0];
            const plan = await stakingContract.getPlan(stake.planId);
            const emergencyExitParameters = await stakingContract.callStatic.emergencyExit(stakeId);
            const staked = 300000000 + 100000000 + 27397;
            const rewards = Math.floor(staked * Math.pow(EULER, 0.1 * (1 / 365)) - staked - (staked / 100000000 + 13));
            const emergencyLoss = Math.floor(((staked + rewards) * plan.emergencyTax) / 100);
            expect(emergencyExitParameters.withdrawn.toNumber()).to.be.greaterThanOrEqual(
                staked + rewards - emergencyLoss - 1,
            );
            expect(emergencyExitParameters.withdrawn.toNumber()).to.be.lessThanOrEqual(
                staked + rewards - emergencyLoss + 1,
            );
            expect(emergencyExitParameters.emergencyLoss).to.be.equal(emergencyLoss);

            const awaitedReceipt = await (await stakingContract.emergencyExit(stakeId)).wait();
            const eventData = stakingContract.interface.decodeEventLog(
                "EmergencyExited",
                awaitedReceipt.events[awaitedReceipt.events.length - 1].data,
            );
            expect(eventData.staked).to.be.equal(staked);
            expect(eventData.withdrawn.toNumber()).to.be.greaterThanOrEqual(staked + rewards - emergencyLoss - 1);
            expect(eventData.withdrawn.toNumber()).to.be.lessThanOrEqual(staked + rewards - emergencyLoss + 1);
            expect(eventData.planId).to.be.equal(plans[2]);
        });
        it("should be able to return correct current TVL", async function () {
            expect((await stakingContract.getTVL()).toNumber()).to.be.equal(300000000); //400,027,397 + 300000000
        });
        it("should be able to return correct current Issued Tokens and Expected Tokens to issue", async function () {
            expect((await stakingContract.getIssuedTokens()).toNumber()).to.be.equal(257541); //131507 + 27397
            expect((await stakingContract.getExpectedIssuedTokens()).toNumber()).to.be.equal(586441); //487,804 + 465,961
        });
        it("Should there be only 1 stake left", async function () {
            const stakes = await stakingContract.getStakes();
            expect(stakes.length).to.be.equal(1);
            expect(stakes[0].amount).to.be.equal(300000000);
            await stakingContract.emergencyExit(stakes[0].stakeId);
        });
        it("should be able to return correct current TVL", async function () {
            expect((await stakingContract.getTVL()).toNumber()).to.be.equal(0); //400,027,397 + 300000000
        });
        it("should be able to return correct current Issued Tokens and Expected Tokens to issue", async function () {
            expect((await stakingContract.getIssuedTokens()).toNumber()).to.be.equal(405506); //131507 + 27397
            expect((await stakingContract.getExpectedIssuedTokens()).toNumber()).to.be.equal(405506); //487,804 + 465,961
        });
    });
    describe("Stake (compound), withdraw and unstake with non-whole number APY", async function () {
        let stakeId;
        let endAmount;
        before(async function () {
            await network.provider.send("evm_mine", [timestamp + 86400 * 11]);
            plans.push(await stakingContract.callStatic.setPlan(12, 12.02046 * 10 ** 6, 10, 0));
            await stakingContract.setPlan(12, 12.02046 * 10 ** 6, 10, 0);

            const signerBalance = await mintableToken.balanceOf(owner.getAddress());
            await mintableToken.approve(stakingContract.address, 100000000);
            const stakeReceipt = await stakingContract.stake(100000000, plans[plans.length - 1], true);
            expect(await mintableToken.balanceOf(owner.getAddress())).to.be.equal(signerBalance - 100000000);
            const awaitedReceipt = await stakeReceipt.wait();
            expect(awaitedReceipt.events[awaitedReceipt.events.length - 1].event).to.be.equal("Staked");
            const eventData = stakingContract.interface.decodeEventLog(
                "Staked",
                awaitedReceipt.events[awaitedReceipt.events.length - 1].data,
            );
            expect(eventData.amount).to.be.equal(100000000);
            expect(eventData.planId).to.be.equal(plans[plans.length - 1]);
            const stakes0 = await stakingContract.getStakes();
            for (const stake of stakes0) {
                if (stake.amount.toNumber() === 100000000) {
                    stakeId = stake.stakeId;
                }
            }
        });
        it("should be able to return correct current TVL", async function () {
            expect((await stakingContract.getTVL()).toNumber()).to.be.equal(100000000); //400,027,397 + 300000000
        });
        it("should be able to return correct current Issued Tokens and Expected Tokens to issue", async function () {
            expect((await stakingContract.getIssuedTokens()).toNumber()).to.be.equal(405506); //131507 + 27397
            expect((await stakingContract.getExpectedIssuedTokens()).toNumber()).to.be.equal(801410); //487,804 + 465,961
        });
        it("should be able to get the correct expected revenue", async function () {
            const revenue = await stakingContract.expectedRevenue(
                100000000,
                plans[plans.length - 1],
                true,
                Math.floor(timestamp + 86400 * 9),
                Math.floor(timestamp + 86400 * 22 + 10000),
            );
            endAmount = 100000000;
            for (let i = 0; i < 12; i++) {
                endAmount += Math.round((endAmount * 12.02046) / 36500);
            }
            expect(revenue.toNumber()).to.be.lessThanOrEqual(endAmount - 100000000 + 8);
            expect(revenue.toNumber()).to.be.greaterThanOrEqual(endAmount - 100000000 - 8);
            //check -  https://www.thecalculatorsite.com/finance/calculators/daily-compound-interest.php
        });
        it("should be able to withdraw the full amount of rewards", async function () {
            await network.provider.send("evm_mine", [timestamp + 86400 * 24 + 10000]);
            const balance = await mintableToken.balanceOf(owner.getAddress());
            const awaitedReceipt = await (await stakingContract.withdrawRewards(stakeId)).wait();
            expect((await mintableToken.balanceOf(owner.getAddress())).toNumber()).to.be.lessThanOrEqual(
                balance.toNumber() + endAmount - 100000000 + 8,
            );
            expect((await mintableToken.balanceOf(owner.getAddress())).toNumber()).to.be.greaterThanOrEqual(
                balance.toNumber() + endAmount - 100000000 - 8,
            );
            expect(awaitedReceipt.events[awaitedReceipt.events.length - 1].event).to.be.equal("RewardsWithdrawn");
            const eventData = stakingContract.interface.decodeEventLog(
                "RewardsWithdrawn",
                awaitedReceipt.events[awaitedReceipt.events.length - 1].data,
            );
            expect(eventData.rewards.toNumber()).to.be.lessThanOrEqual(endAmount - 100000000 + 8);
            expect(eventData.rewards.toNumber()).to.be.greaterThanOrEqual(endAmount - 100000000 - 8);
            expect(eventData.planId).to.be.equal(plans[plans.length - 1]);
            expect(eventData.stakeId).to.be.equal(stakeId);
            expect(eventData.amount.toNumber()).to.be.equal(100000000);
        });
        it("should be able to return correct current TVL", async function () {
            expect((await stakingContract.getTVL()).toNumber()).to.be.equal(100000000); //400,027,397 + 300000000
        });
        it("should be able to return correct current Issued Tokens and Expected Tokens to issue", async function () {
            expect((await stakingContract.getIssuedTokens()).toNumber()).to.be.equal(801410); //131507 + 27397
            expect((await stakingContract.getExpectedIssuedTokens()).toNumber()).to.be.equal(801410); //487,804 + 465,961
        });
        it("should be able to unstake the correct amount", async function () {
            const balance = await mintableToken.balanceOf(owner.getAddress());
            await stakingContract.unstake(stakeId);
            expect(await mintableToken.balanceOf(owner.getAddress())).to.be.equal(balance.toNumber() + 100000000);
        });
        it("should be able to return correct current TVL", async function () {
            expect((await stakingContract.getTVL()).toNumber()).to.be.equal(0); //400,027,397 + 300000000
        });
        it("should be able to return correct current Issued Tokens and Expected Tokens to issue", async function () {
            expect((await stakingContract.getIssuedTokens()).toNumber()).to.be.equal(801410); //131507 + 27397
            expect((await stakingContract.getExpectedIssuedTokens()).toNumber()).to.be.equal(801410); //487,804 + 465,961
        });
    });
}

async function stake(stakingContract, amount, planId, compound) {
    return (await stakingContract.stake(amount, planId, compound)).wait();
}

async function stakeCombined(stakingContract, amount, planId, compound, stakes, withdrawRewards) {
    return (await stakingContract.stakeCombined(amount, planId, compound, stakes, withdrawRewards)).wait();
}

async function emergencyExit(stakingContract, stakeId) {
    return (await stakingContract.emergencyExit(stakeId)).wait();
}

async function unstake(stakingContract, stakeId) {
    return (await stakingContract.unstake(stakeId)).wait();
}

async function withdrawRewards(stakingContract, stakeId) {
    return (await stakingContract.withdrawRewards(stakeId)).wait();
}

async function getStakes(stakingContract) {
    return stakingContract.getStakes();
}

async function getPlans(stakingContract) {
    return stakingContract.getPlans();
}

async function upgrade(stakingContract, newStakingContract) {
    return (await stakingContract.upgrade(newStakingContract.address)).wait();
}

module.exports = {
    baseTestingCases,
    getPlans,
    stake,
    stakeCombined,
    unstake,
    emergencyExit,
    withdrawRewards,
    getStakes,
    upgrade,
    // upgradeBaseStakingWithSameValues,
    // upgradeUserToNewStaking,
};
