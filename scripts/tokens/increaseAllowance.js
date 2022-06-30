const { createContract, createPair, connectContract } = require("../configurationMethods");
async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Deployer address: " + (await deployer.getAddress()));
    console.log("Account balance:", (await deployer.getBalance()).toString());

    //For BSC TestNet
    this.token = await connectContract("WBNB", "0xf5c5EdbcB79491E3761e2A53E4C390a25eC2235a");
    await this.token.approve("0xB36d30172209c5590Acd1C3d0B5e8F7998E25eb5", 100000000);
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
