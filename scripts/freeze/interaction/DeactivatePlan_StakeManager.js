const { connectContract } = require("../../configurationMethods");
const rl = require("readline");
const { exit } = require("process");

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
        readline.on("SIGINT", () => {
            exit();
        });
    });
}

async function main() {
    const [deployer] = await ethers.getSigners();
    const address = await question("Contract Address: ");
    const contract = await connectContract("StakeManager", address, deployer);
    const pips = (await contract.getPips()).toNumber();
    const planForm = await contract.getPlans();
    const planIds = planForm.planIds;
    const plans = planForm.plan;
    for(let i = 0; i < plans.length; i++) {
        console.log("Plan " + i
        + ": Days " + plans[i].period.toString()
        + ", APY " + (plans[i].apy.toNumber() / (10**pips))
        + "%, Emergency Tax "  + plans[i].emergencyTax.toNumber()
        + "%, Minimal Amount " + plans[i].minimalAmount.toString());
    }
    let planIter;
    while(true) {
        planIter = parseInt(await question("Which plan would you like to disable?: "), 10);
        if(planIter >= 0 && planIter < planIds.length) {
            const answer = await question("Deactivate Plan " + planIter + "! Write 'y' or 'yes' to confirm: ");
            if(answer.toLocaleLowerCase() === "y"
                || answer.toLocaleLowerCase() === "yes"){
                await (await contract.deactivatePlan(planIds[planIter])).wait();
                exit();
            } else continue;
        } else {
            console.log("Wrong plan! Please choose again");
        }
    }

}
main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
