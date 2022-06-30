const { ethers } = require("hardhat");
const { connectContract } = require("../../configurationMethods");

async function main() {
    [this.owner] = await ethers.getSigners();
    console.log(this.owner.address);
    const stakeFactory = await ethers.getContractFactory("RegisterableStakeManager");
    const contract = await stakeFactory.attach("0x99aC4957931Cf2eB46F1c49d06c76eA8b78402c5");
    const registry = await connectContract("Registry", await contract.getRegistry(), this.owner);
    await registry.grantRole(await registry.CONTRACT_CREATOR_ROLE(), contract.address);
    await registry.grantRole(await registry.CONTRACT_EDITOR_ROLE(), contract.address);
    await contract.setCompoundPeriod(86400);
    await contract.setCompoundEnabled(false);
    // @TODO Max should add liquidity
    // const token = await connectContract("TestToken", await contract.getToken(), this.owner);
    // await(await token.mint(await this.owner.getAddress(), "10000000000000000000000000000000")).wait();
    // await (await token.transfer(contract.address, "10000000000000000000000000000000")).wait();
    // await contract.setMaxTokensMinted("10000000000000000000000000000000");
    await contract.setPricePair(
        "0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c",
        "0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56",
    );

    const plans = await contract.getPlans();
    if (plans.planIds) {
        for (let i = 0; i < plans.planIds.length; i++) {
            await contract.deactivatePlan(plans.planIds[i]);
        }
    }
    await contract.setPlan(14, 0.5 * 10 ** 8, 10, 0);
    await contract.setPlan(30, 1 * 10 ** 8, 10, 0);
    await contract.setPlan(90, 2.5 * 10 ** 8, 10, 0);
    await contract.setPlan(180, 2.75 * 10 ** 8, 10, 0);
    await contract.setPlan(365, 6 * 10 ** 8, 10, 0);
    await contract.setPlan(730, 10 * 10 ** 8, 10, 0);
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
