// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import "../implementations/FreezeStakeManager.sol";

contract FreezeStakeManagerMock is FreezeStakeManager {
    event Bug(string text);
    event Mock(address upgrader);

    uint256 private dummy;

    function mock() external {
        emit Mock(msg.sender);
    }

    function bug() external {
        emit Bug("I'm bugged");
    }
}
