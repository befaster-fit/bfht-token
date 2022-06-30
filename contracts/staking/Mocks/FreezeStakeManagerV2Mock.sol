// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import "../implementations/FreezeStakeManager.sol";

contract FreezeStakeManagerV2Mock is FreezeStakeManager {
    event Mock(address upgrader);
    event Bug(string text);

    uint256 private dummy;
    uint256 public dummy2;

    function getDummy() external view returns (uint256) {
        return dummy;
    }

    function mock() external {
        emit Mock(msg.sender);
    }

    function bug() external {
        emit Bug("I'm not bugged anymore");
    }
}
