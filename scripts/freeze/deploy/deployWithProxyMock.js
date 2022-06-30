//More info: https://www.youtube.com/watch?v=JgSj7IiE4jA
async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Deployer address: " + (await deployer.getAddress()));
    console.log("Account balance:", (await deployer.getBalance()).toString());

    const contractName = "FreezeStakeManager";
    const contractFactory = await ethers.getContractFactory(contractName);
    const contract = await upgrades.deployProxy(
        contractFactory,
        ["0x7B1cf917D8C36eb836b1Fb16f2E3f786857c7e3B", "0x6Ab0c90a6293444Af16ABb070D2E59e0cA01D423"],
        {
            initializer: "__init",
        },
    );
    await contract.deployed();

    console.log(contractName + " deployed to: " + contract.address);
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
