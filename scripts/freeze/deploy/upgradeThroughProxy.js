//More info: https://www.youtube.com/watch?v=JgSj7IiE4jA
async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Deployer address: " + (await deployer.getAddress()));
    console.log("Account balance:", (await deployer.getBalance()).toString());

    const contractName = "RegisterableStakeManager";
    const proxyAddress = "0xfEa19d0c93E4919d6CCdc6d790984BAEfcDB8A40";
    const contractFactory = await ethers.getContractFactory(contractName);
    const v2 = await upgrades.upgradeProxy(proxyAddress, contractFactory);
    console.log("Upgraded");

    await v2.deployed();
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
