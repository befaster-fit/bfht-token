const { expect } = require("chai");
const { ethers } = require("hardhat");

//Used to test deployed `Registry` contract
async function registryEdittingTests(registryInstance, edittingSigner, placeholderSigner, addedRegistryEntries) {
    describe("Registry Testing cases", async function () {
        let entryId;
        before(async function () {
            registryInstance = await registryInstance.connect(edittingSigner);
            /**
             * 1. Test access control
             * 2. Test creating invalid entry
             * 3. Test creating valid entry
             * 4. Test creating same entry twice
             *
             * 5. Test updating invalid entry
             * 6. Test updating valid entry with invalid data
             * 7. Test updating valid entry
             * 8. Test deleting invalid entry
             * 9. Test deleting valid entry
             */
        });
        describe("Create", async function () {
            it("shouldn't be able to create an entry without access", async function () {
                registryInstance = await registryInstance.connect(placeholderSigner);
                await expect(
                    registryInstance.createEntry(
                        await edittingSigner.getAddress(),
                        ethers.utils.formatBytes32String("0"),
                        1,
                    ),
                ).to.be.revertedWith(
                    "AccessControl: account " +
                        (await placeholderSigner.getAddress()).toLowerCase() +
                        " is missing role " +
                        (await registryInstance.CONTRACT_CREATOR_ROLE()).toLowerCase(),
                );
                registryInstance = await registryInstance.connect(edittingSigner);
            });
            it("shouldn't be able to create an entry without valid data", async function () {
                expect(
                    registryInstance.createEntry(ethers.constants.AddressZero, ethers.constants.HashZero, 1),
                ).to.be.revertedWith("Registry: Invalid entry");
            });
            it("should be able create entry", async function () {
                await registryInstance.createEntry(
                    await edittingSigner.getAddress(),
                    ethers.utils.formatBytes32String("0"),
                    1,
                );
                entryId = ethers.utils.formatBytes32String("0");
            });
            it("shouldn't be able to create double the same entry", async function () {
                expect(
                    registryInstance.createEntry(
                        await edittingSigner.getAddress(),
                        ethers.utils.formatBytes32String("0"),
                        1,
                    ),
                ).to.be.revertedWith("Registry: Id exists");
            });
        });
        describe("Read", async function () {
            it("shouldn't be able to read invalid entry", async function () {
                expect(
                    registryInstance.readEntry(
                        await edittingSigner.getAddress(),
                        ethers.utils.formatBytes32String("1"),
                    ),
                ).to.be.revertedWith("Registry: Entry does not exist");
            });
            it("should be able to read specific entry for user", async function () {
                expect(
                    (await registryInstance.readEntry(await edittingSigner.getAddress(), entryId)).toNumber(),
                ).to.be.equal(1);
            });
            it("should be able to read all entries for user", async function () {
                const registryEntries = await registryInstance.readAllEntries(await edittingSigner.getAddress());
                expect(registryEntries.id.length).to.be.equal(1 + addedRegistryEntries);
                expect(registryEntries.value.length).to.be.equal(1 + addedRegistryEntries);
                expect(registryEntries.id[registryEntries.id.length - 1]).to.be.equal(entryId);
                expect(registryEntries.value[registryEntries.value.length - 1]).to.be.equal(1);
            });
        });
        describe("Update", async function () {
            it("shouldn't be able to update without correct role", async function () {
                registryInstance = await registryInstance.connect(placeholderSigner);
                await expect(
                    registryInstance.updateEntry(
                        await edittingSigner.getAddress(),
                        ethers.utils.formatBytes32String("0"),
                        1,
                    ),
                ).to.be.revertedWith(
                    "AccessControl: account " +
                        (await placeholderSigner.getAddress()).toLowerCase() +
                        " is missing role " +
                        (await registryInstance.CONTRACT_EDITOR_ROLE()).toLowerCase(),
                );
                registryInstance = await registryInstance.connect(edittingSigner);
            });
            it("shouldn't be able to update invalid entry", async function () {
                expect(
                    registryInstance.updateEntry(
                        await placeholderSigner.getAddress(),
                        ethers.utils.formatBytes32String("0"),
                        1,
                    ),
                ).to.be.revertedWith("Registry: entry does not exist");
            });
            it("should be able to update the entry", async function () {
                await registryInstance.updateEntry(
                    await edittingSigner.getAddress(),
                    ethers.utils.formatBytes32String("0"),
                    2,
                );
                expect(
                    (
                        await registryInstance.readEntry(
                            await edittingSigner.getAddress(),
                            ethers.utils.formatBytes32String("0"),
                        )
                    ).toNumber(),
                ).to.be.equal(2);
            });
        });
        describe("Delete", async function () {
            it("shouldn't be able to update with invalid access", async function () {
                registryInstance = await registryInstance.connect(placeholderSigner);
                await expect(
                    registryInstance.deleteEntry(
                        await edittingSigner.getAddress(),
                        ethers.utils.formatBytes32String("0"),
                    ),
                ).to.be.revertedWith(
                    "AccessControl: account " +
                        (await placeholderSigner.getAddress()).toLowerCase() +
                        " is missing role " +
                        (await registryInstance.CONTRACT_EDITOR_ROLE()).toLowerCase(),
                );
                registryInstance = await registryInstance.connect(edittingSigner);
            });
            it("should be able to delete an entry", async function () {
                await registryInstance.deleteEntry(
                    await edittingSigner.getAddress(),
                    ethers.utils.formatBytes32String("0"),
                );
                expect(
                    registryInstance.readEntry(
                        await edittingSigner.getAddress(),
                        ethers.utils.formatBytes32String("0"),
                    ),
                ).to.be.revertedWith("Registry: Entry does not exist");
                const entries = await registryInstance.readAllEntries(await edittingSigner.getAddress());
                expect(entries.id.length).to.be.equal(0 + addedRegistryEntries);
                expect(entries.value.length).to.be.equal(0 + addedRegistryEntries);
            });
        });
    });
}

//Used by ledger/staking contract tests
async function registryReadValid(registryInstance, ownerAddress, id, value) {
    it("should be able to return valid registry entry", async function () {
        expect((await registryInstance.readEntry(ownerAddress, id)).toNumber()).to.be.equal(value);
    });
}

async function registryReadAllEntries(registryInstance, ownerAddress, entries) {
    it("should be able to return all valid registry entries", async function () {
        const returnedEntries = await registryInstance.readAllEntries(ownerAddress);
        for (let i = 0; i < entries.length; i++) {
            expect(returnedEntries[i].id).to.be.equal(entries[i].id);
            expect(returnedEntries[i].value).to.be.equal(entries[i].value);
        }
    });
}

async function registryReadInvalidEntry(registryInstance, ownerAddress, id) {
    it("should be able to return all valid registry entries", async function () {
        expect(registryInstance.readEntry(ownerAddress, id)).to.be.revertedWith("Registry: Entry does not exist");
    });
}

module.exports = { registryEdittingTests, registryReadValid, registryReadAllEntries, registryReadInvalidEntry };
