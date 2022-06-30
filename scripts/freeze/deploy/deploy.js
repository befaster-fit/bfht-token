const {
    createToken,
    createContract,
    createPair,
    setStakingCompoundPeriod,
    setStakingPair,
    setStakingPlan,
} = require("./configurationMethods");

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Deployer address: " + (await deployer.getAddress()));
    console.log("Account balance:", (await deployer.getBalance()).toString());

    //For BSC TestNet
    // Step 1. Deploy Token
    this.tokenProp = await createToken("PeggedBFHT");
    // (Optional) Step 2. - Deploy Stable Token
    this.tokenStable = await createToken("TestToken");
    // (Optional/Required) Step 3. Mint amount of tokens on the network
    await this.tokenProp.mint(await deployer.getAddress(), 20000000000000);
    await this.tokenStable.mint(await deployer.getAddress(), 10000000000000);
    // Step 4. Deploy token pair on the network
    this.tokenPair = await createPair(
        deployer,
        this.tokenProp,
        5000000000000,
        this.tokenStable,
        50000000000,
        "UniswapV2Factory",
        "UniswapV2Pair",
    );
    // Step 5. Deploy staking contract on the network
    this.freezeContract = await createContract("FreezeStakeManager", [this.tokenProp.address]);

    //Step 6. Set compound period for staking
    await setStakingCompoundPeriod("FreezeStakeManager", this.freezeContract.address, 3600);

    //Step 7. Set first token pair (used to return information on the current price of the staked token)
    await setStakingPair("FreezeStakeManager", this.freezeContract.address, this.tokenPair.address);

    //Step 8. Set first plan setup for the staking contract
    await setStakingPlan("FreezeStakeManager", this.freezeContract.address, 1, 19, 10, 100000000);
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
