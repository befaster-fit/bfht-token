const { ethers } = require("hardhat");
const { registryEdittingTests } = require("./Registry");

describe("Registry", function () {
    let accounts;
    let contract;
    before(async function () {
        [this.owner, this.placeholderAddress] = await ethers.getSigners();
        accounts = [this.owner, this.placeholderAddress];
        contract = await createContract("Registry");
    });
    it("", async function () {
        await contract.grantRole(await contract.CONTRACT_CREATOR_ROLE(), await this.owner.getAddress());
        await contract.grantRole(await contract.CONTRACT_EDITOR_ROLE(), await this.owner.getAddress());
        await registryEdittingTests(contract, accounts[0], accounts[1], 0);
    });
});

async function createContract(contractName, optionals) {
    const contractType = await ethers.getContractFactory(contractName);
    let contract;
    if (optionals !== undefined) {
        contract = await contractType.deploy(...optionals);
    } else {
        contract = await contractType.deploy();
    }
    console.log("Contract at: " + contract.address);
    return contract;
}
