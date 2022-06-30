const { connectContract } = require("../../configurationMethods");

async function main() {
    [this.owner] = await ethers.getSigners();
    const freezeStakeManagerFactory = await ethers.getContractFactory("RegisterableStakeManager");
    const contract = await freezeStakeManagerFactory.attach("0x98F86B69457B2df6F7df8170Ec2Efd57895c1391");
    await contract.withdrawLiquidity("100000000000000000000000");
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
