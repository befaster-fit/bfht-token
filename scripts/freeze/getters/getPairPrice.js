const { connectContract } = require("./configurationMethods");
async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Deployer address: " + (await deployer.getAddress()));
    console.log("Account balance:", (await deployer.getBalance()).toString());

    //For BSC TestNet
    this.router = await connectContract("IUniswapV2Router02", "0xB36d30172209c5590Acd1C3d0B5e8F7998E25eb5");
    this.pair = await connectContract("IUniswapV2Pair", "0x8AA4006570D6e2576E7204c0FC92EbC7e45bFf08");
    const reserves = await this.pair.getReserves();
    console.log(await this.router.getAmountOut(1000000, reserves.reserve0.toNumber(), reserves.reserve1.toNumber()));
    //console.log(await this.router.factory());
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
