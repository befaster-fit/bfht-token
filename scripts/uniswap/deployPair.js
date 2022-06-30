const { createPairNetworked, connectContract } = require("../configurationMethods");
async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Deployer address: " + (await deployer.getAddress()));
    console.log("Account balance:", (await deployer.getBalance()).toString());

    //For BSC TestNet
    this.token1 = await connectContract("WBNB", "0xf5c5EdbcB79491E3761e2A53E4C390a25eC2235a");
    this.token2 = await connectContract("TestToken", "0x7B1cf917D8C36eb836b1Fb16f2E3f786857c7e3B");
    await this.token2.mint(await deployer.getAddress(), "20000000000000000000000000");
    [this.tokenPair, this.tokenPairFactory] = await createPairNetworked(
        this.token1,
        "750000000000000000",
        this.token2,
        "20000000000000000000000000",
        "IPancakeFactory",
        "0xC500b9a3D613E05ecCf203Bf761627Ad023c379B",
        "IPancakePair",
    );
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
