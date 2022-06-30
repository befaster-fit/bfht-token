async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Deployer address: " + (await deployer.getAddress()));
    const freezeStakeManagerFactory = await ethers.getContractFactory("FreezeStakeManager");
    const contract = await freezeStakeManagerFactory.attach("0x6d6C33e34deD8655b386701f7be09EFA135f3cd9");
    await contract.setPricePair(
        "0xf5c5EdbcB79491E3761e2A53E4C390a25eC2235a",
        "0xB2AD16A3EdBc983aAC7Af9fC1717C8d9d4756429",
    );
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
