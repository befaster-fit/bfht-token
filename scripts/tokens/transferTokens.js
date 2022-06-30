const { connectContract } = require("./configurationMethods");

async function main() {
    const [deployer] = await ethers.getSigners();
    const token = await connectContract("TestToken", "0x33f0e9273b0205639d9964337073e3d137f08544", deployer);
    await token.mint("0x0e046D8a6729CF191C01E133E93cd714e9907aCC", 100000000000);
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
