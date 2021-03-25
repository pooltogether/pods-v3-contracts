// SPDX-License-Identifier: MIT
pragma solidity >=0.7.0 <0.8.0;

import "hardhat/console.sol";

// External Interfaces

// Libraries
import "./external/ProxyFactory.sol";

// Clone Contracts
import "./Pod.sol";
import "./TokenDrop.sol";

contract TokenDropFactory is ProxyFactory {
    /**
     * @notice Contract template for deploying proxied Comptrollers
     */
    TokenDrop public tokenDropInstance;

    /***********************************|
    |   Events                          |
    |__________________________________*/
    /**
     * @dev Emitted when use deposits into batch backlog
     */
    event LogCreateTokenDrop(address tokenDrop);

    /***********************************|
    |   Constructor                     |
    |__________________________________*/
    /**
     * @notice Initializes the Factory with an instance of the TokenFaucet
     */
    constructor() {
        // TokenDrpp Instance
        tokenDropInstance = new TokenDrop();
    }

    /**
     * @notice Create a TokenDrop smart contract
     */
    function create(address _measure, address _asset)
        external
        returns (TokenDrop)
    {
        // TokenDrop Deployed
        TokenDrop tokenDrop =
            TokenDrop(deployMinimal(address(tokenDropInstance), ""));

        // TokenDrop Initialize
        tokenDrop.initialize(_measure, _asset);

        // Emit LogCreate
        emit LogCreateTokenDrop(address(tokenDrop));

        // Return TokenDrop addresses
        return tokenDrop;
    }
}
