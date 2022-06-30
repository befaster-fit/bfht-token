const { createContract, createPair, connectContract } = require("../configurationMethods");
const rl = require("readline");

async function question(q) {
    const readline = rl.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
    let response;
    readline.setPrompt(q);
    readline.prompt();
    return new Promise((resolve, reject) => {
        readline.on("line", userInput => {
            response = userInput;
            readline.close();
        });
        readline.on("close", () => {
            resolve(response);
        });
    });
}

async function main() {
    const [deployer] = await ethers.getSigners();
    const stakingContractName = await question("Type of staking contract?: ");
    const stakingContractAddress = await question("Address of staking contract?: ");
    this.stakingManager = await connectContract(stakingContractName, stakingContractAddress, deployer);
    this.token = await connectContract("IERC20Mintable", await this.stakingManager.token(), deployer);
    mainMenu(this.stakingManager, deployer, this.token);
    // const plans = await waitForSettings(this.freezeContract);
    // const plan = plans.plan[0];
    // const planId = plans.planIds[0];
    // await revealExpectedRevenue(this.freezeContract, plan, planId);
}

async function mainMenu(contract, signer, token) {
    console.log("Token Balance is: " + (await token.balanceOf(await deployer.getAddress())));
    console.log("What would you like to do?:");
    console.log("1. Check currently active plans? ");
    console.log("2. Stake? ");
    console.log("3. Check Stakes? ");
    const choice = await question("You choice?: ");
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
