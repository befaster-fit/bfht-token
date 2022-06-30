import {
    BinanceWalletProvider,
    BlockchainVM,
    INodeInfo,
    IToken,
    IWalletProvider,
    Web3WalletProvider,
} from "@cryptovarna/tron-web-api";
import {
    contract,
    FreezeFactory,
    ICurrentStakeRow,
    ICurrentStakesBox,
    IHistoryBox,
    IHistoryRow,
    IPeriod,
    IStakingBox,
    ITokenStake,
    StakeType,
} from "@drgmitev/freeze-api";
import BigNumber from "bignumber.js";
import { network } from "hardhat";
import { HttpNetworkConfig } from "hardhat/types";
import { expect } from "chai";
import { FreezeStakeManager__factory } from "../typechain/factories/FreezeStakeManager__factory";
interface StakeData {
    amount: BigNumber;
    compound: boolean;
    period: IPeriod;
}

//
describe("Stake Tests", async () => {
    //@todo Change tests chainId and address
    const contracts: contract[] = [
        <contract>{
            address: "0x4A4C9d737437529aD89fDFe70Ac61717827816E1",
            chainId: "97",
            originBlockNumber: 18101941,
        },
    ];
    let walletProvider: IWalletProvider;
    let tokenIndex: number;
    let token: IToken;
    let periods: IPeriod[];
    let balance: BigNumber;
    const dateSeconds: number = Math.floor(Date.now() / 1000 - 600); //@note set timeout of 5-10 minutes for the test
    const stakes: StakeData[] = [];
    let stakingBox: IStakingBox;
    before(async () => {
        const node: INodeInfo = <INodeInfo>{
            vm: BlockchainVM.EVM,
            chainId: network.config.chainId?.toString(16),
            id: "",
            name: "Binance Smart Chain Testnet",
            host: (network.config as HttpNetworkConfig).url,
            explorer: (network.config as HttpNetworkConfig).url,
            nativeCurrency: {
                name: "TBNB",
                decimals: 8,
                symbol: "tBNB",
            },
            rpcUrls: [(network.config as HttpNetworkConfig).url],
        };
        walletProvider = (await BinanceWalletProvider.connect(node, {
            privateKey: process.env.PK,
            rpcUrl: "https://data-seed-prebsc-1-s1.binance.org:8545/",
        })) as Web3WalletProvider;
        stakingBox = await FreezeFactory.getStakingBox(contracts, walletProvider as Web3WalletProvider);

        for (const stakingToken of stakingBox.tokens) {
            balance = new BigNumber(
                (await stakingToken.token.getBalanceOf((await walletProvider.getDefaultAddress()).hex)).toNumber(),
            );
            let breakTokens = false;
            for (const tokenPeriod of stakingToken.periods) {
                if (tokenPeriod.locked === false && balance.toNumber() >= tokenPeriod.minTERCTokens + 1) {
                    stakes.push(<StakeData>{
                        amount: new BigNumber(tokenPeriod.minTERCTokens + 1),
                        period: tokenPeriod,
                        compound: false,
                    });
                    token = stakingToken.token;
                    breakTokens = true;
                    periods = stakingToken.periods;
                    break;
                }
            }
            if (breakTokens) break;
        }
        tokenIndex = stakingBox.tokens.findIndex((tokenStake: ITokenStake) => {
            return token === tokenStake.token;
        });
    });
    describe("Stake", async function () {
        it("should be able to retrieve all tokens", async function () {
            expect(stakingBox.tokens.length).to.be.greaterThan(0);
            expect(stakingBox.tokens[0].periods.length).to.be.greaterThan(0);
            expect(
                (
                    await stakingBox.tokens[0].token.getBalanceOf((await walletProvider.getDefaultAddress()).hex)
                ).toNumber(),
            ).to.be.greaterThan(0);
        });
        it("should be able to expect the correct revenue", async function () {
            if (token && stakes[0] && balance) {
                // eslint-disable-next-line camelcase
                const factory = FreezeStakeManager__factory.connect(
                    contracts[0].address,
                    await walletProvider.getNativeProvider(),
                );
                const expectedRevenue = await factory.expectedRevenue(
                    stakes[0].amount.toNumber(),
                    stakes[0].period.id,
                    false,
                    Math.floor(Date.now() / 1000),
                    Math.floor(Date.now() / 1000 + stakes[0].period.days * 86400 + 5000),
                );
                expect(
                    await stakingBox.expectedRevenue(token, false, stakes[0].period, stakes[0].amount.toNumber()),
                ).to.be.equal(stakes[0].amount.plus(expectedRevenue.toNumber()).toNumber());
            } else {
                return false;
            }
        });
        it("should be able to stake", async function () {
            if (token && stakes[0].period && balance && stakes[0].amount) {
                await stakingBox.stake(token, false, stakes[0].period, stakes[0].amount.toNumber());
                expect(
                    (await token.getBalanceOf((await walletProvider.getDefaultAddress()).hex)).toNumber(),
                ).to.be.equal(balance.minus(stakes[0].amount).toNumber());
            } else {
                return false;
            }
        });
        describe("Current Staking Box - add", async function () {
            let currentStakingBox: ICurrentStakesBox;
            let foundStakingRow: ICurrentStakeRow;
            before(async function () {
                currentStakingBox = (
                    await FreezeFactory.getAllCurrentStakes(
                        contracts[tokenIndex],
                        walletProvider as Web3WalletProvider,
                        await walletProvider.getBlockNumber(),
                    )
                ).stakes;
            });
            it("should be able to return the last stake", async function () {
                const row = currentStakingBox.rows.find((row: ICurrentStakeRow) => {
                    return (
                        row.amount === stakes[0].amount.toNumber() && row.creationDate.getTime() / 1000 >= dateSeconds
                    );
                });
                expect(row).to.not.equal(undefined);
                foundStakingRow = row as ICurrentStakeRow;
            });
            it("staking row should have the right data", async function () {
                expect(foundStakingRow.amount).to.be.equal(stakes[0].amount.toNumber());
                expect(foundStakingRow.compound).to.be.equal(false);
                expect(foundStakingRow.expired).to.be.equal(false);
                expect(foundStakingRow.rewards).to.be.equal(0);
                expect(foundStakingRow.cancelInfo.penaltyPercentage).to.be.equal(
                    stakes[0].period.emergencyExitPercentage,
                );
                expect(Math.round(foundStakingRow.cancelInfo.finalAmount)).to.be.equal(
                    Math.round(
                        stakes[0].amount.toNumber() -
                            stakes[0].amount.toNumber() * stakes[0].period.emergencyExitPercentage,
                    ),
                );
            });
            it("should be able to add a new stake to the current stake", async function () {
                const newPeriod = periods.find((indexedPeriod: IPeriod) => {
                    return indexedPeriod.minTERCTokens > stakes[0].period.minTERCTokens;
                });
                const period = newPeriod ? newPeriod : stakes[0].period;
                const addedAmount =
                    period.minTERCTokens > stakes[0].amount.toNumber()
                        ? period.minTERCTokens - stakes[0].amount.toNumber()
                        : 1;

                stakes.push(<StakeData>{
                    amount: stakes[0].amount.plus(addedAmount),
                    period: period,
                    compound: false,
                });
                const oldBalance = await token.getBalanceOf((await walletProvider.getDefaultAddress()).hex);
                await foundStakingRow.add(false, period, addedAmount, false);
                balance = await token.getBalanceOf((await walletProvider.getDefaultAddress()).hex);
                expect(balance.toNumber()).to.be.equal(oldBalance.toNumber() - addedAmount);
                setTimeout(() => {
                    return;
                }, 10000);
            });
        });
        describe("Current Staking Box - emergency exit", async function () {
            let currentStakingBox: ICurrentStakesBox;
            let foundStakingRow: ICurrentStakeRow;
            before(async function () {
                currentStakingBox = (
                    await FreezeFactory.getAllCurrentStakes(
                        contracts[tokenIndex],
                        walletProvider as Web3WalletProvider,
                        await walletProvider.getBlockNumber(),
                    )
                ).stakes;
            });
            it("should be able to return the last stake", async function () {
                const row = currentStakingBox.rows.find((row: ICurrentStakeRow) => {
                    return (
                        row.amount === stakes[1].amount.toNumber() && row.creationDate.getTime() / 1000 >= dateSeconds
                    );
                });
                expect(row).to.not.equal(undefined);
                foundStakingRow = row as ICurrentStakeRow;
            });
            it("staking row should have the right data", async function () {
                expect(foundStakingRow.amount).to.be.equal(stakes[1].amount.toNumber());
                expect(foundStakingRow.compound).to.be.equal(false);
                expect(foundStakingRow.expired).to.be.equal(false);
                expect(foundStakingRow.rewards).to.be.equal(0);
                expect(foundStakingRow.cancelInfo.penaltyPercentage).to.be.equal(
                    stakes[1].period.emergencyExitPercentage,
                );
                expect(Math.round(foundStakingRow.cancelInfo.finalAmount)).to.be.equal(
                    Math.round(
                        stakes[1].amount.toNumber() -
                            stakes[1].amount.toNumber() * stakes[1].period.emergencyExitPercentage,
                    ),
                );
            });
            it("should be able to emergency exit the current stake", async function () {
                const oldBalance = await token.getBalanceOf((await walletProvider.getDefaultAddress()).hex);
                await foundStakingRow.cancelStake();
                const balance = await token.getBalanceOf((await walletProvider.getDefaultAddress()).hex);
                expect(balance.toNumber()).to.be.equal(
                    Math.round(oldBalance.plus(foundStakingRow.cancelInfo.finalAmount).toNumber()),
                );
            });
        });
        describe("HistoryBox", async function () {
            let historyBox: IHistoryBox;
            const creationDates: number[] = [];
            before(async function () {
                historyBox = (
                    await FreezeFactory.getHistoryBox(
                        contracts[tokenIndex],
                        walletProvider as Web3WalletProvider,
                        await walletProvider.getBlockNumber(),
                    )
                ).box;
            });
            it("should be able to find the first stake", async function () {
                const indexRow = historyBox.rows.findIndex((row: IHistoryRow) => {
                    return row.amount === stakes[0].amount.toNumber();
                });
                expect(indexRow).to.not.be.equal(-1);
                expect(historyBox.rows[indexRow].token.name).to.be.equal(token.name);
                expect(historyBox.rows[indexRow].type).to.be.equal(StakeType.FREEZE);
                expect(historyBox.rows[indexRow].period.id).to.be.equal(stakes[0].period.id);
                creationDates.push(historyBox.rows[indexRow].creationDate.getSeconds());
            });
            it("should be able to find the second stake", async function () {
                const indexRow = historyBox.rows.findIndex((row: IHistoryRow) => {
                    return row.amount === stakes[1].amount.toNumber();
                });
                expect(indexRow).to.not.be.equal(-1);
                expect(historyBox.rows[indexRow].token.name).to.be.equal(token.name);
                expect(historyBox.rows[indexRow].type).to.be.equal(StakeType.FREEZE);
                expect(historyBox.rows[indexRow].period.id).to.be.equal(stakes[1].period.id);
                expect(historyBox.rows[indexRow].creationDate.getSeconds()).to.be.greaterThanOrEqual(creationDates[0]);
                creationDates.push(historyBox.rows[indexRow].creationDate.getSeconds());
            });
            it("should be able to find the emergency exit", async function () {
                const indexRow = historyBox.rows.findIndex((row: IHistoryRow) => {
                    return (
                        Math.round(row.amount) ===
                        Math.round(
                            stakes[1].amount.toNumber() -
                                stakes[1].amount.toNumber() * stakes[1].period.emergencyExitPercentage,
                        )
                    );
                });
                expect(indexRow).to.not.be.equal(-1);
                expect(historyBox.rows[indexRow].token.name).to.be.equal(token.name);
                expect(historyBox.rows[indexRow].type).to.be.equal(StakeType.EMERGENCY);
                expect(historyBox.rows[indexRow].period.id).to.be.equal(stakes[1].period.id);
                expect(historyBox.rows[indexRow].creationDate.getSeconds()).to.be.greaterThanOrEqual(creationDates[1]);
            });
        });
    });
});
