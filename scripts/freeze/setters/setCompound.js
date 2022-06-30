async function main() {
    const freezeStakeManagerFactory = await ethers.getContractFactory("FreezeStakeManager");
    const contract = await freezeStakeManagerFactory.attach("0x6d6C33e34deD8655b386701f7be09EFA135f3cd9");
    await contract.setCompoundPeriod(86400);
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
