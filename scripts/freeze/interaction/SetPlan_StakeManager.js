const { connectContract } = require("../configurationMethods");
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
        readline.on("SIGINT", () => {
            exit();
        });
    });
}

async function main() {
    const [deployer] = await ethers.getSigners();
    const address = await question("Contract Address: ");
    const contract = await connectContract("StakeManager", address, deployer);
    await waitForSettings(contract);
}

async function waitForSettings(contract) {
    const period = parseInt(await question("Plan Time? (in days): "), 10);
    const apy = (10**(await contract.getPips()).toNumber()) * parseFloat(await question("APY? (1=0,00001%): "));
    const emergencyTax = parseInt(await question("Emergency Tax? (1=1%): "), 10);
    const minimalAmount = parseInt(
        await question("Minimal Amount of tokens to stake on plan?(1= 1 / 10**token_decimals): "),
        10,
    );
    await (await contract.setPlan(period, apy, emergencyTax, minimalAmount)).wait();
    return;
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
