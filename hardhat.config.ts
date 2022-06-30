import "@nomiclabs/hardhat-waffle";
import "@typechain/hardhat";
import "hardhat-gas-reporter";
import "solidity-coverage";

import "@nomiclabs/hardhat-etherscan";
import "@openzeppelin/hardhat-upgrades";

import { resolve } from "path";

import { config as dotenvConfig } from "dotenv";
import { HardhatUserConfig } from "hardhat/config";
import { NetworkUserConfig } from "hardhat/types";

dotenvConfig({ path: resolve(__dirname, "./.env") });

const chainIds = {
    goerli: 5,
    hardhat: 31337,
    kovan: 42,
    mainnet: 1,
    rinkeby: 4,
    ropsten: 3,
};

// Ensure that we have all the environment variables we need.
const mnemonic: string | undefined = process.env.MNEMONIC;
if (!mnemonic) {
    throw new Error("Please set your MNEMONIC in a .env file");
}

const infuraApiKey: string | undefined = process.env.INFURA_API_KEY;
if (!infuraApiKey) {
    throw new Error("Please set your INFURA_API_KEY in a .env file");
}

const privateKey: string | undefined = process.env.PK_MAINNET;
if (!privateKey) {
    throw new Error("Please set your PK in a .env file");
}

function getChainConfig(network: keyof typeof chainIds): NetworkUserConfig {
    const url: string = "https://" + network + ".infura.io/v3/" + infuraApiKey;
    return {
        accounts: {
            count: 10,
            mnemonic,
            path: "m/44'/60'/0'/0",
        },
        chainId: chainIds[network],
        url,
    };
}

const config: HardhatUserConfig = {
    defaultNetwork: "hardhat",
    gasReporter: {
        currency: "USD",
        enabled: process.env.REPORT_GAS ? true : false,
        coinmarketcap: process.env.COINMARKETCAP_API_KEY,
        excludeContracts: [],
        src: "./contracts",
    },
    networks: {
        hardhat: {
            accounts: {
                mnemonic,
            },
            chainId: chainIds.hardhat,
            forking: {
                // url: "https://eth-mainnet.alchemyapi.io/v2/MKDK53OWsz3b1r-robvusfglky6SsUk8",
                // blockNumber: 13379767
                url: "https://speedy-nodes-nyc.moralis.io/eccd18f425fef00211ffda0f/bsc/mainnet/archive",
                blockNumber: 16821446,
            },
        },
        goerli: getChainConfig("goerli"),
        kovan: getChainConfig("kovan"),
        rinkeby: getChainConfig("rinkeby"),
        ropsten: getChainConfig("ropsten"),
        testnet: {
            url: "https://data-seed-prebsc-1-s2.binance.org:8545/",
            chainId: 97,
            gasPrice: 20000000000,
            accounts: { mnemonic: mnemonic },
        },
        mainnet: {
            url: "https://bsc-dataseed.binance.org/",
            chainId: 56,
            gasPrice: 20000000000,
            accounts: [privateKey],
        },
        localhost: {
            url: "http://127.0.0.1:8545",
            chainId: 31337,
            gasPrice: 20000000000,
            accounts: { mnemonic: mnemonic },
        },
    },
    etherscan: {
        // Your API key for Etherscan
        // Obtain one at https://etherscan.io/
        apiKey: process.env.ETHERSCAN_API_KEY,
    },
    paths: {
        artifacts: "./artifacts",
        cache: "./cache",
        sources: "./contracts",
        tests: "./test",
    },
    solidity: {
        version: "0.8.9",
        settings: {
            metadata: {
                // Not including the metadata hash
                // https://github.com/paulrberg/solidity-template/issues/31
                bytecodeHash: "none",
            },
            // Disable the optimizer when debugging
            // https://hardhat.org/hardhat-network/#solidity-optimizer-support
            optimizer: {
                enabled: true,
                runs: 200,
            },
        },
    },
    mocha: {
        timeout: 1000000,
        parallel: true,
    },
    typechain: {
        outDir: "typechain",
        target: "ethers-v5",
    },
};

export default config;
