const { ethers } = require("hardhat");

async function main() {
    [this.owner] = await ethers.getSigners();
    console.log(this.owner.address);
    const freezeStakeManagerFactory = await ethers.getContractFactory("FreezeStakeManager");
    const contract = await freezeStakeManagerFactory.attach("0x99aC4957931Cf2eB46F1c49d06c76eA8b78402c5");
    await contract.setPlan(1, 14 * 10 ** 6, 10, 0);
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
