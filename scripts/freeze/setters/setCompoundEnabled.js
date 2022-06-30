async function main() {
    const freezeStakeManagerFactory = await ethers.getContractFactory("FreezeStakeManager");
    const contract = await freezeStakeManagerFactory.attach("0xfEa19d0c93E4919d6CCdc6d790984BAEfcDB8A40");
    await contract.setCompoundEnabled(false);
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
