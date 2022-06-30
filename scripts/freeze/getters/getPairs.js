async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Deployer address: " + (await deployer.getAddress()));
    const freezeStakeManagerFactory = await ethers.getContractFactory("FreezeStakeManager");
    const contract = await freezeStakeManagerFactory.attach("0x380C83155d802E34387D3e4aBc671a39b9235957");
    console.log(await contract.getPricePairs());
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
