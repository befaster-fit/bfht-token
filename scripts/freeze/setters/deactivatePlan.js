const { ethers } = require("hardhat");

async function main() {
    [this.owner] = await ethers.getSigners();
    console.log(this.owner.address);
    const freezeStakeManagerFactory = await ethers.getContractFactory("FreezeStakeManager");
    const contract = await freezeStakeManagerFactory.attach("0x99aC4957931Cf2eB46F1c49d06c76eA8b78402c5");
    await contract.deactivatePlan("0xbbc7697bae3c18b1ffee3ba6a496a743b12039e0f8dc59f192f3d17e2c3d3b3f");
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
