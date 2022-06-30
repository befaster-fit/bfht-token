const { createContract } = require("../../configurationMethods");
async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Deployer address: " + (await deployer.getAddress()));
    console.log("Account balance:", (await deployer.getBalance()).toString());

    const contractRegistry = await createContract("Registry");
    const contractName = "RegisterableStakeManager";
    const contractFactory = await ethers.getContractFactory(contractName);
    const contract = await upgrades.deployProxy(
        contractFactory,
        [
            "0x577ad06f635b402fc2724efd6a53a3a0aed3d155",
            "0x10ED43C718714eb63d5aA57B78B54704E256024E",
            //Router :
            // https://docs.pancakeswap.finance/code/smart-contracts/pancakeswap-exchange/router-v2
            //  - address: 0x10ED43C718714eb63d5aA57B78B54704E256024E
            contractRegistry.address,
        ],
        {
            initializer: "__init_register",
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
