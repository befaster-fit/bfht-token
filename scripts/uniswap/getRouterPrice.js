const { connectContract } = require("../configurationMethods");
async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Deployer address: " + (await deployer.getAddress()));
    console.log("Account balance:", (await deployer.getBalance()).toString());

    //For BSC TestNet
    this.router = await connectContract("IUniswapV2Router02", "0x6Ab0c90a6293444Af16ABb070D2E59e0cA01D423");
    this.token1 = await connectContract("TestToken", "0x7B1cf917D8C36eb836b1Fb16f2E3f786857c7e3B");
    this.token2 = await connectContract("TestToken", "0xf5c5EdbcB79491E3761e2A53E4C390a25eC2235a");
    this.token3 = await connectContract("TestToken", "0xB2AD16A3EdBc983aAC7Af9fC1717C8d9d4756429");
    console.log(
        await this.router.getAmountsOut(10000000000, [this.token1.address, this.token2.address, this.token3.address]),
    );
    //console.log(await this.router.factory());
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
