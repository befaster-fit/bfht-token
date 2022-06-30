const { connectContract } = require("../configurationMethods");
async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Deployer address: " + (await deployer.getAddress()));
    console.log("Account balance:", (await deployer.getBalance()).toString());

    //For BSC TestNet
    const contract = await connectContract("WBNB", "0xf5c5EdbcB79491E3761e2A53E4C390a25eC2235a", deployer);
    await contract.deposit({ value: "2000000000000000000" });
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
