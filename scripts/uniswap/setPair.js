const { setPairTokensNetworked, connectContract } = require("../configurationMethods");
async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Deployer address: " + (await deployer.getAddress()));
    console.log("Account balance:", (await deployer.getBalance()).toString());

    //For BSC TestNet
    this.token1 = await connectContract("WBNB", "0xf5c5EdbcB79491E3761e2A53E4C390a25eC2235a");
    this.token2 = await connectContract("TestToken", "0xd976125aD3938621ed36af584EC40313A7172dB5");
    await this.token2.mint(await deployer.getAddress(), "35000000000000000000000000");
    [this.tokenPair, this.tokenPairFactory] = await setPairTokensNetworked(
        this.token1,
        "500000000000000000",
        this.token2,
        "35000000000000000000000000",
        "IPancakePair",
        "0xFBcdBE0AE24fFB12403C276F33460feD35903D26",
    );
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
