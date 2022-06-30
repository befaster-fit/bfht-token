// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

contract TimestampMock {
    constructor() {
        return;
    }

    function get() external view returns (uint256) {
        return block.timestamp;
    }
}
