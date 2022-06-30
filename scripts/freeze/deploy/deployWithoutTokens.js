const { createContract, createPair, connectContract } = require("../configurationMethods");
async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Deployer address: " + (await deployer.getAddress()));
    console.log("Account balance:", (await deployer.getBalance()).toString());

    //For BSC TestNet
    this.token1 = await connectContract("TestToken", "0x049E8ba4547E1a6f2941EaE0537334034CdaF5b1");
    console.log("Test Token at: ", this.token1.address);
    //const tokenPairFactory = await connectContract("UniswapV2Factory", "0xACe406F438F96CA295402B25181328c7d51cc988");
    //const tokenRouter = await connectContract("IUniswapV2Router02", "0x6Ab0c90a6293444Af16ABb070D2E59e0cA01D423");
    this.freezeContract = await createContract("FreezeStakeManager", [
        "0x049E8ba4547E1a6f2941EaE0537334034CdaF5b1",
        "0x6Ab0c90a6293444Af16ABb070D2E59e0cA01D423",
    ]);
    await this.token1.transfer(this.freezeContract.address, 10000000000000);
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
