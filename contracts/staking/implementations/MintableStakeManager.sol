// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import "./StakeManager.sol";

contract MintableStakeManager is StakeManager {
    uint256 internal withdrawable;

    function _withdrawMethod(address recipient, uint256 amount) internal virtual override {
        token.mint(recipient, amount);
    }

    function _exitWithdraw(uint256 withdrawn, uint256 totalAmount) internal override {
        if (withdrawn > totalAmount) {
            token.mint(msg.sender, withdrawn - totalAmount);
            require(token.transfer(msg.sender, totalAmount), "MintableStakeManager: Cannot make transfer");
        } else {
            uint256 excess = totalAmount - withdrawn;
            withdrawable += excess;
            require(token.transfer(msg.sender, withdrawn), "MintableStakeManager: Cannot make transfer");
        }
    }

    function getWithdrawable() external view returns (uint256) {
        return withdrawable;
    }

    function withdrawExcess() external onlyRole(DEFAULT_ADMIN_ROLE) {
        uint256 _withdrawable = withdrawable;
        withdrawable = 0;
        require(token.transfer(msg.sender, _withdrawable), "MintableStakeManager: Cannot make transfer");
    }

    uint256[50] private gap;
}
