const { expect } = require("chai");
const { ethers } = require("hardhat");
const { baseTestingCases } = require("./localContractStaking");
const {
    createContract,
    connectContract,
    createPairNetworked,
    createUpgradeableTPContract,
} = require("../../scripts/configurationMethods");

describe("Upgraded Freeze Staking", function () {
    describe("Freeze Staking functionality before upgrade", async function () {
        before(async function () {
            [this.owner, this.client] = await ethers.getSigners();
            this.plans = [];
            this.token = await createContract("BEP20Mintable", ["TestToken0", "TT0", 6, 300 * 12 ** 12]);
            this.token2 = await connectContract("WBNB", "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c", this.owner);
            await this.token2.deposit({ value: "3000000000000000" });
            this.token3 = await connectContract("BEP20Token", "0xe9e7cea3dedca5984780bafc599bd69add087d56", this.owner);
            await this.token.mint(await this.owner.getAddress(), "1000000000000000");
            [this.tokenPair, this.tokenPairFactory] = await createPairNetworked(
                this.token,
                5000000000000,
                this.token2,
                50000000000,
                "UniswapV2Factory",
                "0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73",
                "UniswapV2Pair",
            );
            this.router = await connectContract("IUniswapV2Router02", "0x10ED43C718714eb63d5aA57B78B54704E256024E");
            this.contract = await createUpgradeableTPContract(
                "FreezeStakeManagerMock",
                [this.token.address, this.router.address],
                "__init",
                this.owner,
            );
            await this.token.mint(this.contract.address, 10000000000000);
            await this.token.grantRole(this.token.MINTER_ROLE(), this.contract.address);
            await network.provider.send("evm_mine", [Math.floor(Date.now() / 1000)]);
        });
        describe(" ", async function () {
            it(" ", async function () {
                await baseTestingCases(
                    this.owner,
                    this.client,
                    this.contract,
                    this.token,
                    [this.token2.address, this.token3.address],
                    this.plans,
                );
            });
        });
        describe("Freeze Staking upgrading", async function () {
            let proxyContract;
            before(async function () {
                proxyContract = await connectContract(
                    "TransparentUpgradeableProxyMock",
                    this.contract.address,
                    this.owner,
                );
            });
            it("should be able to emit ' I'm bugged ' in an event ", async function () {
                const receipt = await (await this.contract.bug()).wait();
                expect(receipt.events[receipt.events.length - 1].event).to.be.equal("Bug");
                const eventData = this.contract.interface.decodeEventLog(
                    "Bug",
                    receipt.events[receipt.events.length - 1].data,
                );
                expect(eventData.text).to.be.equal("I'm bugged");
            });
            it("should not be able to upgrade through a non-admin address", async function () {
                proxyContract = await proxyContract.connect(this.client);
                const contractInstance = await createContract("FreezeStakeManagerV2Mock");
                await expect(proxyContract.upgradeTo(contractInstance.address)).to.be.revertedWith("");
                proxyContract = await proxyContract.connect(this.owner);
            });
            it("should not be able to upgrade contract as wihout the owner's proxy admin", async function () {
                const contractInstance = await createContract("FreezeStakeManagerV2Mock");
                await expect(proxyContract.upgradeTo(contractInstance.address)).to.be.revertedWith("");
            });
            it("should not be able to upgrade contract by ProxyAdmin through non-admin address", async function () {
                const contractV2Factory = await ethers.getContractFactory("FreezeStakeManagerV2Mock", this.client);
                await expect(upgrades.upgradeProxy(proxyContract.address, contractV2Factory)).to.be.revertedWith(
                    "Ownable: caller is not the owner",
                );
            });
            it("should be able to upgrade contract by ProxyAdmin through admin address", async function () {
                const contractV2Factory = await ethers.getContractFactory("FreezeStakeManagerV2Mock", this.owner);
                const contractInstance = await upgrades.upgradeProxy(this.contract.address, contractV2Factory);
                expect(contractInstance).to.not.be.equal(undefined);
                expect(contractInstance.deployTransaction).to.not.be.equal(undefined);
            });
            it("should be able to emit ' I'm not bugged anymore ' in an event ", async function () {
                const receipt = await (await this.contract.bug()).wait();
                expect(receipt.events[receipt.events.length - 1].event).to.be.equal("Bug");
                const eventData = this.contract.interface.decodeEventLog(
                    "Bug",
                    receipt.events[receipt.events.length - 1].data,
                );
                expect(eventData.text).to.be.equal("I'm not bugged anymore");
            });
            it(" ", async function () {
                await baseTestingCases(
                    this.owner,
                    this.client,
                    this.contract,
                    this.token,
                    [this.token2.address, this.token3.address],
                    this.plans,
                );
            });
        });
    });
});
