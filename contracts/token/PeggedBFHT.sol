// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@cryptovarna/tron-contracts/contracts/token/TRC20/TRC20.sol";
import "@cryptovarna/tron-contracts/contracts/access/AccessControl.sol";
import "../ERC20Mintable.sol";

contract PeggedBFHT is ERC20Mintable {
    constructor() ERC20Mintable("BeFaster Token", "BFHT", 6, 300 * 10**12) {}
}
