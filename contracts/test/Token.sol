// SPDX-License-Identifier: MIT
pragma solidity >=0.7.0 <0.8.0;

// External Libraries
import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title TokenDrop - Calculates Asset Distribution using Measure Token
 * @notice Calculates distribution of POOL rewards for users deposting into PoolTogether PrizePools using the Pod smart contract.
 * @dev A simplified version of the PoolTogether TokenFaucet that simplifies an asset token distribution using totalSupply calculations.
 * @author Kames Cox-Geraghty
 */
contract TokenDropTest is ERC20 {
    /***********************************|
    |   Libraries                       |
    |__________________________________*/
    using SafeMath for uint256;

    /***********************************|
    |   Initialize                      |
    |__________________________________*/
    /**
     * @notice Initialize TokenDrop Smart Contract
     */
    constructor(address _measure, address _asset) ERC20("Test Token", "TEST") {}
}
