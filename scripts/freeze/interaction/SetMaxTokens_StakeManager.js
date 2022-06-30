const { connectContract } = require("../../configurationMethods");
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
    console.log("Current Max Tokens: " + (await contract.getMaxTokensMinted()).toString());
    console.log("Current Expected Tokens: " + (await contract.getExpectedIssuedTokens()).toString());
    const maxTokens = await question("Set Max Tokens to: ");
    await (await contract.setMaxTokensMinted(maxTokens)).wait();
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
