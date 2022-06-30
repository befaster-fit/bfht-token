const { ethers } = require("hardhat");
const { baseTestingCases } = require("./localContractStaking");
const { createContract, connectContract, createPairNetworked } = require("../../scripts/configurationMethods");

describe("Freeze Staking", function () {
    before(async function () {
        [this.owner, this.addr1] = await ethers.getSigners();
        this.plans = [];
        this.token1 = await createContract("BEP20Mintable", ["TestToken0", "TT0", 6, 300 * 12 ** 12]);
        this.token2 = await connectContract("WBNB", "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c", this.owner);
        await this.token2.deposit({ value: "3000000000000000" });
        this.token3 = await connectContract("BEP20Token", "0xe9e7cea3dedca5984780bafc599bd69add087d56", this.owner);
        await this.token1.mint(await this.owner.getAddress(), "1000000000000000");
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
        this.freezeContract = await createContract("FreezeStakeManager");
        await this.freezeContract.__init(this.token1.address, this.router.address);
        await this.token1.mint(this.freezeContract.address, 10000000000000);
        await this.token1.grantRole(this.token1.MINTER_ROLE(), this.freezeContract.address);
        await network.provider.send("evm_mine", [Math.floor(Date.now() / 1000)]);
    });
    //@todo exclude freeze testing cases from base testing
    it("Base testing cases", async function () {
        await baseTestingCases(
            this.owner,
            this.addr1,
            this.freezeContract,
            this.token1,
            [this.token2.address, this.token3.address],
            this.plans,
        );
    });
});
