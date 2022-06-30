// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import "./MintableStakeManager.sol";

contract FreezeStakeManager is MintableStakeManager {
    //TODO: new version
    function __init(address token_, address router_) public virtual {
        StakeManager.initialize(token_, 6, router_);
    }

    function getCombinableStakes(
        address owner,
        uint256 amount,
        bytes32 planId
    ) public view override returns (bytes32[] memory) {
        amount;
        Plan memory plan = plans[planId];
        bytes32[] memory userStakeIds = userStakes[owner];
        uint256 excludedAmount = 0;
        for (uint256 i = 0; i < userStakeIds.length; i++) {
            Stake memory userStake = stakes[userStakeIds[i]];
            if (plans[userStake.planId].minimalAmount > plan.minimalAmount) {
                excludedAmount++;
                delete userStakeIds[i];
            }
        }

        bytes32[] memory userStakesToBeCombined = new bytes32[](userStakeIds.length - excludedAmount);
        uint256 stakeIter = 0;
        for (uint256 i = 0; i < userStakeIds.length; i++) {
            if (userStakeIds[i] != bytes32(0)) {
                userStakesToBeCombined[stakeIter] = userStakeIds[i];
                stakeIter++;
            }
        }
        return userStakesToBeCombined;
    }

    function _stakeCombined(
        address sender,
        uint256 amount,
        bytes32 planId,
        bool compound,
        bytes32[] memory stakes_
    ) internal override returns (bytes32) {
        Stake[] memory ongoingStakes = getStakesById(stakes_);
        Plan memory plan = plans[planId];
        for (uint256 i = 0; i < stakes_.length; i++) {
            amount += ongoingStakes[i].amount;
        }
        for (uint256 k = ongoingStakes.length; k > 0; k--) {
            _removeUserStake(sender, stakes_[k - 1]);
            delete stakes[stakes_[k - 1]];
            delete stakeBlock[stakes_[k - 1]];
        }
        tvl -= ongoingStakes[0].amount;
        _subExcessExpectedRewards(
            _calculateRewards(
                ongoingStakes[0],
                _calculateLastWithdrawn(ongoingStakes[0]),
                ongoingStakes[0].depositTime + 1 days * plan.period
            )
        );
        return _stake(sender, amount, planId, compound);
    }

    uint256[50] private gap;
}
