const { createToken, createContract, createPair } = require("../configurationMethods");
async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Deployer address: " + (await deployer.getAddress()));
    console.log("Account balance:", (await deployer.getBalance()).toString());

    //For BSC TestNet
    this.tokenProp = await createToken("PeggedBFHT");
    this.tokenStable = await createToken("TestToken");
    await this.tokenProp.mint(await deployer.getAddress(), 10000000000000);
    await this.tokenStable.mint(await deployer.getAddress(), 10000000000000);
    this.freezeContract = await createContract("FreezeStakeManager", [this.tokenProp.address]);
    this.tokenPair = await createPair(deployer, this.tokenProp, this.tokenStable, "UniswapV2Factory");
    await this.tokenProp.mint(this.freezeContract.address, 10000000000000);
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
