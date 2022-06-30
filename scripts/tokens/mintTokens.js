const { connectContract } = require("../configurationMethods");
async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Deployer address: " + (await deployer.getAddress()));
    const contract = await connectContract("IERC20Mintable", "0xd976125aD3938621ed36af584EC40313A7172dB5", deployer);
    await contract.mint("0x2b24B1E7C6140112719020d232bc4a3334EF2285", "1000000000000000000000000000");
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
