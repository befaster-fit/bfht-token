const { ethers } = require("hardhat");

async function main() {
    [this.owner] = await ethers.getSigners();
    console.log(this.owner.address);
    const freezeStakeManagerFactory = await ethers.getContractFactory("FreezeStakeManager");
    const contract = await freezeStakeManagerFactory.attach("0x0F5895659D43e8bAfb62d0c4c9667F4f687C5635");
    await contract.setCompoundPeriod(86400);
    await contract.setCompoundEnabled(true);
    await contract.setMaxTokensMinted("1000000000000000000000000000000000000");
    await contract.setPricePair(
        "0xf5c5EdbcB79491E3761e2A53E4C390a25eC2235a",
        "0xB2AD16A3EdBc983aAC7Af9fC1717C8d9d4756429",
    );

    const plans = await contract.getPlans();
    if (plans.planIds) {
        for (let i = 0; i < plans.planIds.length; i++) {
            await contract.deactivatePlan(plans.planIds[i]);
        }
    }
    await contract.setPlan(14, 0.5 * 10 ** 6, 10, 0);
    await contract.setPlan(30, 1.25 * 10 ** 6, 10, "10000000000000000000000");
    await contract.setPlan(90, 4 * 10 ** 6, 10, "1000000000000000000000000");
    await contract.setPlan(180, 4.235 * 10 ** 6, 10, "10000000000000000000000000");
    await contract.setPlan(365, 6.25 * 10 ** 6, 10, "10000000000000000000000000");
    await contract.setPlan(730, 10 * 10 ** 6, 10, "10000000000000000000000000");
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
