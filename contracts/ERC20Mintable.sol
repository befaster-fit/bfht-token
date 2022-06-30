// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@cryptovarna/tron-contracts/contracts/token/TRC20/TRC20.sol";
import "@cryptovarna/tron-contracts/contracts/access/AccessControl.sol";

contract ERC20Mintable is TRC20, AccessControl {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    uint256 public immutable _cap;
    uint8 private _precision;

    constructor(
        string memory name_,
        string memory symbol_,
        uint8 decimals_,
        uint256 cap_
    ) TRC20(name_, symbol_) {
        require(cap_ > 0, "TRC20Capped: cap is 0");
        _cap = cap_;
        _precision = decimals_;
        _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());
        _setupRole(MINTER_ROLE, _msgSender());
    }

    /**
     * @dev Returns the cap on the token's total supply.
     */
    function cap() public view virtual returns (uint256) {
        return _cap;
    }

    /**
     * @dev See {TRC20-_mint}.
     */
    function _mint(address account, uint256 amount) internal virtual override {
        require(totalSupply() + amount <= cap(), "TRC20Capped: cap exceeded");
        super._mint(account, amount);
    }

    /**
     * @dev See {TRC20-_mint}.
     */
    function mint(address account, uint256 amount)
        external
        onlyRole(MINTER_ROLE)
    {
        require(
            account != address(0),
            "ERC20Mintable: Invalid recipient address"
        );
        _mint(account, amount);
    }

    /**
     * @dev See {TRC20-_burn}.
     */
    function burn(uint256 amount) external onlyRole(MINTER_ROLE) {
        _burn(msg.sender, amount);
    }

    function decimals() public view override returns (uint8) {
        return _precision;
    }
}
