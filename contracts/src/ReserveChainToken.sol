// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import { ERC20Burnable } from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import { ERC20Pausable } from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Pausable.sol";
import { ERC20Capped } from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Capped.sol";
import { AccessControl } from "@openzeppelin/contracts/access/AccessControl.sol";

/// @title ReserveChainToken
/// @notice Configurable ERC-20 for the ReserveChain industrial-metals RWA platform.
/// @dev TESTNET ONLY until written authorization (P20). Name/symbol/cap/supply are
///      configured at deploy time and are ILLUSTRATIVE until the issuer confirms.
///      Admin roles are designed to be held by a Gnosis Safe multisig.
contract ReserveChainToken is ERC20, ERC20Burnable, ERC20Pausable, ERC20Capped, AccessControl {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant REDEEMER_ROLE = keccak256("REDEEMER_ROLE");
    bytes32 public constant CONFIG_ROLE = keccak256("CONFIG_ROLE");

    /// @notice Treasury address that receives any initial mint and holds reserves.
    address public treasury;

    /// @notice Compliance gate. Redemption burns stay INACTIVE until authorized.
    bool public redemptionActive;

    event TreasuryUpdated(address indexed previousTreasury, address indexed newTreasury);
    event RedemptionStatusChanged(bool active);
    event RedemptionBurn(address indexed from, uint256 amount, bytes32 indexed redemptionRef);

    constructor(
        string memory name_,
        string memory symbol_,
        uint256 cap_,
        address admin_,
        address treasury_,
        uint256 initialMint_
    ) ERC20(name_, symbol_) ERC20Capped(cap_) {
        require(admin_ != address(0), "ReserveChain: admin is zero");
        require(treasury_ != address(0), "ReserveChain: treasury is zero");

        treasury = treasury_;
        _grantRole(DEFAULT_ADMIN_ROLE, admin_);
        _grantRole(CONFIG_ROLE, admin_);

        // Operational roles (MINTER/PAUSER/REDEEMER) are granted explicitly after
        // deployment, normally to the multisig, keeping least-privilege by default.

        if (initialMint_ > 0) {
            _mint(treasury_, initialMint_);
        }
    }

    /// @notice Controlled mint, restricted to MINTER_ROLE and bounded by the cap.
    function mint(address to, uint256 amount) external onlyRole(MINTER_ROLE) {
        _mint(to, amount);
    }

    /// @notice Pause all transfers (emergency stop).
    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }

    /// @notice Resume transfers.
    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    /// @notice Update the treasury address.
    function setTreasury(address newTreasury) external onlyRole(CONFIG_ROLE) {
        require(newTreasury != address(0), "ReserveChain: treasury is zero");
        emit TreasuryUpdated(treasury, newTreasury);
        treasury = newTreasury;
    }

    /// @notice Toggle the redemption workflow. Off by default; requires written
    ///         authorization from the issuer before being enabled.
    function setRedemptionActive(bool active) external onlyRole(DEFAULT_ADMIN_ROLE) {
        redemptionActive = active;
        emit RedemptionStatusChanged(active);
    }

    /// @notice Redemption burn workflow (built, inactive until authorized).
    /// @dev Requires the holder to have approved msg.sender for amount.
    function redemptionBurn(address from, uint256 amount, bytes32 redemptionRef)
        external
        onlyRole(REDEEMER_ROLE)
    {
        require(redemptionActive, "ReserveChain: redemption inactive");
        _spendAllowance(from, _msgSender(), amount);
        _burn(from, amount);
        emit RedemptionBurn(from, amount, redemptionRef);
    }

    // -- Required overrides (OpenZeppelin v5 multiple inheritance) --
    function _update(address from, address to, uint256 value)
        internal
        override(ERC20, ERC20Pausable, ERC20Capped)
    {
        super._update(from, to, value);
    }
}
