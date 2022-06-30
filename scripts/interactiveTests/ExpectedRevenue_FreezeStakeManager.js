const { createContract, createPair } = require("../configurationMethods");
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
    this.plans = [];
    this.tokenProp = await createContract("IERC20Mintable");
    this.tokenStable = await createContract("IERC20Mintable");
    await this.tokenProp.mint(await deployer.getAddress(), 10000000000000);
    await this.tokenStable.mint(await deployer.getAddress(), 10000000000000);
    this.freezeContract = await createContract("FreezeStakeManager", [this.tokenProp.address]);
    this.tokenPair = await createPair(
        deployer,
        this.tokenProp,
        5000000000000,
        this.tokenStable,
        50000000000,
        "UniswapV2Factory",
        "UniswapV2Pair",
    );

    await this.freezeContract.setPricePair(this.tokenPair.address);
    await this.freezeContract.setMaxTokensMinted("10000000000000");

    const plans = await waitForSettings(this.freezeContract);
    const plan = plans.plan[0];
    const planId = plans.planIds[0];
    await revealExpectedRevenue(this.freezeContract, plan, planId);
}

async function waitForSettings(contract) {
    const compoundTime = parseInt(await question("Compound Time? (in seconds): "), 10);
    await contract.setCompoundPeriod(compoundTime);
    const period = parseInt(await question("Plan Time? (in days): "), 10);
    console.log(period);
    const apy = parseInt(await question("APY? (1=0,000001%): "), 10);
    const emergencyTax = parseInt(await question("Emergency Tax? (1=1%): "), 10);
    const minimalAmount = parseInt(
        await question("Minimal Amount of tokens to stake on plan?(1= 1 / 10**token_decimals): "),
        10,
    );
    await contract.setPlan(period, apy, emergencyTax, minimalAmount);
    return await contract.getPlans();
}

async function revealExpectedRevenue(contract, plan, planId) {
    const amount = parseInt(await question("Amount? (more than " + plan.minimalAmount.toNumber() + " ): "), 10);
    const compound = (await question("Compound? (`true` or `false`): ")) === "true" ? true : false;
    console.log(compound);
    console.log(
        "Total amount of tokens after stake: " +
            (amount +
                (
                    await contract.expectedRevenue(
                        amount,
                        planId,
                        compound,
                        Math.floor(Date.now() / 1000),
                        Math.floor(Date.now() / 1000) + 86400 * plan.period.toNumber(),
                    )
                ).toNumber()),
    );
    return;
}
main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
