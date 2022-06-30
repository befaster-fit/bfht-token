const { ethers } = require("hardhat");

/**
 * Deploys token contract
 * @param {*} contractName Name of the token contract, to be deployed
 * @returns Contract instance of the token contract
 */
async function createToken(contractName) {
    const contractType = await ethers.getContractFactory(contractName);
    this.contract = await contractType.deploy(tokenAddress);
    console.log("Token " + contractName + " at " + this.contract.address);
    return this.contract;
}

/**
 * Deploys freezing contract
 * @param {*} tokenAddress Address of the token, to be staked
 * @param {*} contractName Name of the staking contract, to be deployed
 * @returns Contract instance of the staking contract
 */
async function createContract(contractName, optionals, signer) {
    const contractType = await ethers.getContractFactory(contractName, signer);
    if (optionals === undefined) this.contract = await contractType.deploy();
    else this.contract = await contractType.deploy(...optionals);
    console.log(contractName + " at " + this.contract.address);
    return this.contract;
}

/**
 * Deploys freezing contract
 * @param {*} contractName Name of the contract, to be deployed
 * @param {*} optionals Array of parameters to be passed during initialization
 * @param {*} initializer Name of the contract method called to initialize the contract itself
 * @returns Proxy contract instance
 */
async function createUpgradeableTPContract(contractName, optionals, initializer, signer) {
    const contractType = await ethers.getContractFactory(contractName, signer);
    const contract = await upgrades.deployProxy(contractType, optionals, { initializer: initializer });
    await contract.deployed();
    console.log(contractName + "TransparentProxy at " + contract.address);
    return contract;
}

/**
 * Connect to a contract on the current network
 * @param {*} contractName Name of the contract on the network
 * @param {*} address Address of the contract on the network
 * @returns The contract instance
 */
async function connectContract(contractName, address, signer) {
    return ethers.getContractAt(contractName, address, signer);
}

/**
 * Deploy token pair contract, on the current network, between 2 tokens
 * @param {*} owner Owner, ethers.signer, which will deploy the contract
 * @param {*} token0 Token to be used as a 1st for pair, ex. Token previously deployed for {createToken}
 * @param {*} token0Amount Amount of tokens, to be added for initial liquidity, as Token 0
 * // @note Calculation for price is token 0 liquidity / token 1 liquidity
 * @param {*} token1 Token to be used as a 2nd for pair, ex. Stable token on the network
 * @param {*} token1Amount Amount of tokens, to be added for initial liquidity, as Token 1
 * @param {*} factoryName Name of the token pair contract factory
 * @param {*} pairName Name of the token pair contract
 * @returns
 */
async function createPair(owner, token0, token0Amount, token1, token1Amount, factoryName, pairName, signer) {
    const contractType = await ethers.getContractFactory(factoryName, signer);
    this.factory = await contractType.deploy(await owner.getAddress());
    this.contract = await ethers.getContractAt(
        pairName,
        await this.factory.callStatic.createPair(token0.address, token1.address),
    );
    await this.factory.createPair(token0.address, token1.address);
    await token0.transfer(this.contract.address, token0Amount);
    await token1.transfer(this.contract.address, token1Amount);
    await this.contract.sync();
    console.log("Token pair at " + this.contract.address);
    return [this.contract, this.factory];
}

/**
 * Create a token pair on the current network, while having and already deployed factory for it
 * @param {*} token0 Token contract for token 0
 * @param {*} token0Amount Token amount for token 0
 * @param {*} token1 Token contract for token 1
 * @param {*} token1Amount Token amount for token 1
 * @param {*} factoryName Name of the factory contract
 * @param {*} factoryAddress Address of the factory contract
 * @param {*} pairName Name of the pair
 * @returns
 */
async function createPairNetworked(token0, token0Amount, token1, token1Amount, factoryName, factoryAddress, pairName) {
    [this.owner, this.addr1] = await ethers.getSigners();
    this.factory = await connectContract(factoryName, factoryAddress);
    const address = await this.factory.callStatic.createPair(token0.address, token1.address);
    await this.factory.createPair(token0.address, token1.address);
    this.contract = await connectContract(pairName, address);
    await token0.transfer(this.contract.address, token0Amount);
    await token1.transfer(this.contract.address, token1Amount);
    await this.contract.sync();

    console.log("Token pair at " + this.contract.address);
    return [this.contract, this.factory];
}

async function setPairTokensNetworked(token0, token0Amount, token1, token1Amount, pairName, pairAddress) {
    this.contract = await connectContract(pairName, pairAddress);
    await token0.transfer(this.contract.address, token0Amount);
    await token1.transfer(this.contract.address, token1Amount);
    await this.contract.sync();

    console.log("Token pair at " + this.contract.address);
    return [this.contract, this.factory];
}

/**
 * Set compound period/ period to distribute the tokens on, for staking contract
 * @param {*} stakingContractName Name of the staking contract
 * @param {*} stakingContractAddress Address of the staking contract
 * @param {*} compoundPeriod Compound period/ rewards distribution period, in seconds
 */
async function setStakingCompoundPeriod(stakingContractName, stakingContractAddress, compoundPeriod) {
    const stakingFactory = await ethers.getContractFactory(stakingContractName);
    const contract = await stakingFactory.attach(stakingContractAddress);
    await contract.setCompoundPeriod(compoundPeriod);
}

/**
 * Set token/stableToken pair for the staking contract. Used to display the current market price of the staked token
 * @param {*} stakingContractName Name of the staking contract
 * @param {*} stakingContractAddress Address of the staking contract, on the current network
 * @param {*} tokenPairAddress Price pair address
 */
async function setStakingPair(stakingContractName, stakingContractAddress, tokenPairAddress) {
    const stakingFactory = await ethers.getContractFactory(stakingContractName);
    const contract = await stakingFactory.attach(stakingContractAddress);
    await contract.setPricePair(tokenPairAddress);
}

/**
 * Set staking plan for the staking contract
 * @param {*} stakingContractName Name of the staking contract
 * @param {*} stakingContractAddress Address of the staking contract
 * @param {*} stakingDays Period (in days), for the staking plan/period
 * @param {*} stakingAPY APY (yearly percentage), earned throughout the staking plan/period
 * @param {*} stakingET Emergency Tax (in percentage), deducted from the staking amount,
 *  resulting in the returned token amount to the staker, in the case of exitting the current stake early
 * @param {*} stakingMA Minimal Amount of tokens to be staked, to use the current staking period/plan
 */
async function setStakingPlan(
    stakingContractName,
    stakingContractAddress,
    stakingDays,
    stakingAPY,
    stakingET,
    stakingMA,
) {
    const stakingFactory = await ethers.getContractAt(stakingContractName);
    const contract = await stakingFactory.attach(stakingContractAddress);
    await contract.setPlan(stakingDays, stakingAPY, stakingET, stakingMA);
}
module.exports = {
    createToken,
    createContract,
    connectContract,
    createPair,
    createPairNetworked,
    setStakingCompoundPeriod,
    setStakingPair,
    setStakingPlan,
    createUpgradeableTPContract,
    setPairTokensNetworked,
};
