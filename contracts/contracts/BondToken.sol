// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title BondToken
 * @notice ERC20 token representing bond ownership (collateral for USDC deposits)
 * @dev Only BondSeries contract can mint/burn
 */
contract BondToken is ERC20, Ownable {
    /**
     * @notice Constructor
     * @param name_ Token name (e.g., "ArcBond Token")
     * @param symbol_ Token symbol (e.g., "ABOND")
     * @param bondSeries_ Address of BondSeries contract (owner)
     */
    constructor(
        string memory name_,
        string memory symbol_,
        address bondSeries_
    ) ERC20(name_, symbol_) Ownable(bondSeries_) {}

    /**
     * @notice Override decimals to match USDC (6 decimals)
     */
    function decimals() public pure override returns (uint8) {
        return 6;
    }

    /**
     * @notice Mint new bond tokens
     * @param to Address to mint tokens to
     * @param amount Amount to mint
     * @dev Only callable by owner (BondSeries contract)
     */
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }

    /**
     * @notice Burn bond tokens
     * @param from Address to burn tokens from
     * @param amount Amount to burn
     * @dev Only callable by owner (BondSeries contract)
     */
    function burn(address from, uint256 amount) external onlyOwner {
        _burn(from, amount);
    }
}

