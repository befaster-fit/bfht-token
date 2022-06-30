// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import "./IRegistry.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract Registry is IRegistry, AccessControl {
    //Role for creating entries, and one for editing entries
    bytes32 public constant CONTRACT_CREATOR_ROLE = keccak256("CONTRACT_CREATOR_ROLE");
    bytes32 public constant CONTRACT_EDITOR_ROLE = keccak256("CONTRACT_EDITOR_ROLE");

    mapping(address => bytes32[]) private _entriesId;
    mapping(bytes32 => uint256) private _entries;

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, address(this));
        _grantRole(DEFAULT_ADMIN_ROLE, address(msg.sender));
        _grantRole(keccak256("CONTRACT_CREATOR_ROLE"), address(this));
    }

    function migrateWritePermission(address contractRepresentitive) external override onlyRole(CONTRACT_CREATOR_ROLE) {
        require(contractRepresentitive != address(0), "Registry: invalid contract address");
        _grantRole(CONTRACT_CREATOR_ROLE, contractRepresentitive);
        _revokeRole(CONTRACT_CREATOR_ROLE, msg.sender);
    }

    function createEntry(
        address owner,
        bytes32 id,
        uint256 value
    ) external override onlyRole(CONTRACT_CREATOR_ROLE) {
        require(owner != address(0) && id != bytes32(0) && value != 0, "Registry: Invalid entry");

        require(_entries[id] == 0, "Registry: Id exists");
        bytes32[] memory ownerEntries = _entriesId[owner];
        for (uint256 i = 0; i < ownerEntries.length; i++) {
            require(ownerEntries[i] != id, "Registry: Id exists");
        }
        _entriesId[owner].push(id);
        _entries[id] = value;
    }

    function readEntry(address owner, bytes32 id) external view override returns (uint256) {
        bytes32[] memory ownerEntries = _entriesId[owner];
        for (uint256 i = 0; i < ownerEntries.length; i++) {
            if (ownerEntries[i] == id) {
                return _entries[id];
            }
        }
        revert("Registry: Entry does not exist");
    }

    function readAllEntries(address owner)
        external
        view
        override
        returns (bytes32[] memory id, uint256[] memory value)
    {
        id = _entriesId[owner];
        value = new uint256[](id.length);
        for (uint256 i = 0; i < id.length; i++) {
            value[i] = _entries[id[i]];
        }
    }

    function updateEntry(
        address owner,
        bytes32 id,
        uint256 value
    ) external override onlyRole(CONTRACT_EDITOR_ROLE) {
        require(owner != address(0) && id != bytes32(0) && value != 0, "Registry: Invalid entry");
        bytes32[] memory ownerEntries = _entriesId[owner];
        for (uint256 i = 0; i < ownerEntries.length; i++) {
            if (ownerEntries[i] == id) {
                _entries[id] = value;
                return;
            }
        }
        revert("Registry: entry does not exist");
    }

    function deleteEntry(address owner, bytes32 id) external override onlyRole(CONTRACT_EDITOR_ROLE) {
        require(owner != address(0) && id != bytes32(0), "Registry: Invalid entry");
        bytes32[] storage ownerEntries = _entriesId[owner];
        uint256 indexDecrement = 0;
        for (uint256 i = 0; i < ownerEntries.length; i++) {
            if (ownerEntries[i] == id) {
                indexDecrement++;
                delete _entries[id];
            } else if (indexDecrement != 0) {
                ownerEntries[i - indexDecrement] = ownerEntries[i];
            }
        }
        for (uint256 i = 0; i < indexDecrement; i++) {
            ownerEntries.pop();
        }
    }
}
