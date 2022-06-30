async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Deployer address: " + (await deployer.getAddress()));
    const freezeStakeManagerFactory = await ethers.getContractFactory("RegisterableStakeManager");
    const contract = await freezeStakeManagerFactory.attach("0xfEa19d0c93E4919d6CCdc6d790984BAEfcDB8A40");
    console.log(
        await contract.getDistributedAmount("0x50357365cd696664b89584b94565635bb6c313db64ecdea1d7d1e771dacc3a1e"),
    );
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
