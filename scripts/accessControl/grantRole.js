const { ethers } = require("hardhat");
const { connectContract } = require("../configurationMethods");
async function main() {
    [owner] = await ethers.getSigners();
    const freezeStakeManagerFactory = await ethers.getContractFactory("FreezeStakeManager");
    const contract = await freezeStakeManagerFactory.attach("0x0F5895659D43e8bAfb62d0c4c9667F4f687C5635");
    const token = await connectContract("TestToken", await contract.getToken(), owner);
    await token.grantRole(await token.MINTER_ROLE(), "0x0F5895659D43e8bAfb62d0c4c9667F4f687C5635");
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
