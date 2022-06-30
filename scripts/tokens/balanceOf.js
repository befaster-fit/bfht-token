const { connectContract } = require("../configurationMethods");
async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Deployer address: " + (await deployer.getAddress()));
    const contract = await connectContract("IERC20Mintable", "0xd976125aD3938621ed36af584EC40313A7172dB5", deployer);
    console.log(await contract.balanceOf("0x6d6C33e34deD8655b386701f7be09EFA135f3cd9"));
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
