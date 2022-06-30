async function main() {
    const freezeStakeManagerFactory = await ethers.getContractFactory("FreezeStakeManager");
    const contract = await freezeStakeManagerFactory.attach("0x0e046D8a6729CF191C01E133E93cd714e9907aCC");
    console.log(await contract.getCompoundPeriod());
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
