const { connectContract } = require("../configurationMethods");
async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Deployer address: " + (await deployer.getAddress()));
    console.log("Account balance:", (await deployer.getBalance()).toString());

    //For BSC TestNet
    this.pair = await connectContract("IPancakePair", "0x2dEcDD7EaDB6c5813f9f33af5e923BB75a8a6350");
    this.token = await connectContract("IERC20Mintable", "0x54b74C7a8aC037104656656718Df44A1015C191b");
    await this.token.mint(this.pair.address, "10000000000000");
    console.log(await this.pair.sync());
    console.log(await this.pair.getReserves());
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
