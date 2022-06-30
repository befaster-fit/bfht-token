const { ethers } = require("hardhat");
const { connectContract } = require("../configurationMethods");
async function main() {
    [owner] = await ethers.getSigners();
    const contract = await connectContract("Registry", "0x213490b80dEfBaa29aD613F5aecbeDD8334041A3", owner);
    console.log(await contract.hasRole(await contract.CONTRACT_CREATOR_ROLE(), "0x99aC4957931Cf2eB46F1c49d06c76eA8b78402c5"));
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
