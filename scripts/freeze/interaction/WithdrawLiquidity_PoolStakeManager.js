const rl = require("readline");
const { default: BigNumber } = require("bignumber.js");
const { connectContract } = require("../../configurationMethods");

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
    const maxTokens = new BigNumber((await contract.getMaxTokensMinted()).toString());
    const expectedTokens = new BigNumber((await contract.getExpectedIssuedTokens()).toString());
    console.log("Current Max Tokens: " + maxTokens.toString());
    console.log("Current Expected Tokens: " + expectedTokens.toString());
    console.log("Possible withrawable tokens: " + (maxTokens.minus(expectedTokens)).toString());
    const tokens = await question("How many tokens would you like to withdraw: ");
    await (await contract.withdrawLiquidity(tokens)).wait();
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
