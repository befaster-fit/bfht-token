const { ethers } = require("hardhat");
const { baseTestingCases, emergencyExit } = require("./registerableContractStaking");
const { createContract, createPairNetworked, connectContract } = require("../../scripts/configurationMethods");
const { registryEdittingTests, registryReadValid, registryReadInvalidEntry } = require("../Registry");
const { approve } = require("../Token");
const { expect } = require("chai");
describe("RegisterableFreezeStakingManager", async function () {
    before(async function () {
        [this.owner, this.addr1] = await ethers.getSigners();
        this.plans = [];
        this.token1 = await createContract("BEP20Mintable", [
            "TestToken0",
            "TT0",
            6,
            "300000000000000000000000000000000",
        ]);
        this.token2 = await connectContract("WBNB", "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c", this.owner);
        await this.token2.deposit({ value: "3000000000000000" });
        this.token3 = await connectContract("BEP20Token", "0xe9e7cea3dedca5984780bafc599bd69add087d56", this.owner);
        await this.token1.mint(await this.owner.getAddress(), "1000000000000000");

        this.registry = await createContract("Registry");
        [this.tokenPair, this.tokenPairFactory] = await createPairNetworked(
            this.token1,
            5000000000000,
            this.token2,
            50000000000,
            "UniswapV2Factory",
            "0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73",
            "UniswapV2Pair",
        );

        this.router = await connectContract("IUniswapV2Router02", "0x10ED43C718714eb63d5aA57B78B54704E256024E");
        this.freezeContract = await createContract("RegisterableStakeManager");
        await this.freezeContract.__init_register(this.token1.address, this.router.address, this.registry.address);
        await this.token1.mint(await this.freezeContract.address, "1000000000000000000000000");

        await this.registry.grantRole(await this.registry.CONTRACT_CREATOR_ROLE(), this.freezeContract.address);
        await this.registry.grantRole(await this.registry.CONTRACT_EDITOR_ROLE(), this.freezeContract.address);
        await this.registry.grantRole(await this.registry.CONTRACT_CREATOR_ROLE(), this.owner.address);
        await this.registry.grantRole(await this.registry.CONTRACT_EDITOR_ROLE(), this.owner.address);

        await this.token1.mint(this.freezeContract.address, 10000000000000);
        await this.token1.grantRole(this.token1.MINTER_ROLE(), this.freezeContract.address);
        await network.provider.send("evm_mine", [Math.floor(Date.now() / 1000)]);
    });
    //@todo exclude freeze testing cases from base testing
    it("Base staking test cases", async function () {
        await baseTestingCases(
            this.owner,
            this.addr1,
            this.freezeContract,
            this.token1,
            [this.token2.address, this.token3.address],
            this.plans,
        );
    });
    it("Base registry testing cases", async function () {
        await registryEdittingTests(this.registry, this.owner, this.addr1, 0);
    });
    it("Contract specific tests", async function () {
        const token = this.token1;
        const contract = this.freezeContract;
        const owner = this.owner;
        const registry = this.registry;

        let plans;
        let stakeId;
        describe("adding entry", async function () {
            before(async function () {
                plans = await contract.getPlans();
            });
            it("should be able to read new registry entry", async function () {
                const amount = plans.plan[plans.plan.length - 1].minimalAmount.toNumber() + 1;
                const before = Math.floor(Date.now() / 1000) - 10;
                await approve(token, contract.address, amount);
                await contract.stake(amount, plans.planIds[plans.planIds.length - 1], false);
                const stakes = await contract.getStakes();
                for (let i = 0; i < stakes.length; i++) {
                    if (
                        stakes[i].amount.toNumber() === amount &&
                        stakes[i].planId === plans.planIds[plans.planIds.length - 1] &&
                        stakes[i].lastWithdrawn.toNumber() >= before
                    ) {
                        stakeId = stakes[i].stakeId;
                    }
                }
                await registryReadValid(
                    registry,
                    await owner.getAddress(),
                    stakeId,
                    plans.plan[plans.plan.length - 1].minimalAmount.toNumber() + 1,
                );
            });
            it("should be able to have a new registry entry and delete the old one", async function () {
                const amount = plans.plan[plans.plan.length - 1].minimalAmount.toNumber() + 1;
                const before = Math.floor(Date.now() / 1000) - 10;
                await approve(token, contract.address, plans.plan[plans.plan.length - 1].minimalAmount.toNumber() + 1);
                let newStakeId;
                await contract.stake(amount, plans.planIds[plans.planIds.length - 1], false);
                const stakes = await contract.getStakes();
                for (let i = 0; i < stakes.length; i++) {
                    if (
                        stakes[i].amount.toNumber() === amount &&
                        stakes[i].planId === plans.planIds[plans.planIds.length - 1] &&
                        stakes[i].lastWithdrawn.toNumber() >= before
                    ) {
                        newStakeId = stakes[i].stakeId;
                    }
                }
                await registryReadValid(
                    registry,
                    await owner.getAddress(),
                    newStakeId,
                    (plans.plan[plans.plan.length - 1].minimalAmount.toNumber() + 1) * 2,
                );
                await registryReadInvalidEntry(registry, await owner.getAddress(), stakeId);
                stakeId = newStakeId;
            });
        });
        describe("remove entry", async function () {
            it("should be able to remove entry by emergency exit", async function () {
                await emergencyExit(contract, stakeId);
                await registryReadInvalidEntry(registry, await owner.getAddress(), stakeId);
            });
            it("should be able to remove entry by emergency exit", async function () {
                const amount = plans.plan[plans.plan.length - 2].minimalAmount.toNumber() + 1;
                const before = Math.floor(Date.now() / 1000) - 10;
                await approve(token, contract.address, amount);
                await contract.stake(amount, plans.planIds[plans.planIds.length - 2], false);
                const stakes = await contract.getStakes();
                for (let i = 0; i < stakes.length; i++) {
                    if (
                        stakes[i].amount.toNumber() === amount &&
                        stakes[i].planId === plans.planIds[plans.planIds.length - 2] &&
                        stakes[i].lastWithdrawn.toNumber() >= before
                    ) {
                        stakeId = stakes[i].stakeId;
                    }
                }
                await ethers.provider.send("evm_mine", [
                    Math.floor(Date.now() / 1000 + 86400 * (1147 + plans.plan[plans.plan.length - 2].period.toNumber())),
                ]);
                await contract.unstake(stakeId);
                await registryReadInvalidEntry(registry, await owner.getAddress(), stakeId);
            });
        });
    });
    // describe("Transfer Liquidity", async function () {
    //     const token = this.token1;
    //     const contract = this.freezeContract;
    //     it("shouldn't be able to withdraw liquidity without the appropriate role", async function () {
    //         await expect((await contract.connect(this.addr1)).withdrawLiquidity(1000)).to.be.revertedWith(
    //             "asda"
    //         );
    //     });
    //     it("shouldn't be able to withdraw more liquidity than free", async function () {
    //         await expect(
    //             contract.withdrawLiquidity(
    //                 (await contract.getExpectedIssuedTokens()).toString())).to.be.revertedWith(
    //             "asda"
    //         );
    //     });
    // });
});
