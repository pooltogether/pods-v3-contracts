// SPDX-License-Identifier: MIT
pragma solidity >=0.7.0 <0.8.0;

// Libraries
import "./external/ProxyFactory.sol";

// Internal Interfaces
import "./TokenDropFactory.sol";

// Clone Contracts
import "./Pod.sol";
import "./TokenDrop.sol";

contract PodFactory is ProxyFactory {
    /**
     * @notice TokenDropFactory reference
     */
    TokenDropFactory public tokenDropFactory;

    /**
     * @notice Contract template for deploying proxied Pods
     */
    Pod public podInstance;

    /**
     * @notice Contract template for deploying proxied TokenDrop
     */
    TokenDrop public tokenDropInstance;

    /***********************************|
    |   Events                          |
    |__________________________________*/
    /**
     * @dev Emitted when use deposits into batch backlog
     */
    event LogCreatedPodAndTokenDrop(address pod, address tokenDrop);

    /***********************************|
    |   Constructor                     |
    |__________________________________*/
    /// @notice Initializes the Factory with an instance of the TokenFaucet
    constructor(TokenDropFactory _tokenDropFactory) {
        // Pod Instance
        podInstance = new Pod();

        // Reference TokenDropFactory
        tokenDropFactory = _tokenDropFactory;
    }

    function create(
        address _prizePoolTarget,
        address _ticket,
        address _pool,
        address _faucet,
        address _manager
    ) external returns (address, address) {
        // SETUP Pod Smart Contract w/ Initial Configuration
        // ---------------------------------------------------
        // Pod Deploy
        Pod pod = Pod(deployMinimal(address(podInstance), ""));

        // Pod Initialize
        pod.initialize(_prizePoolTarget, _ticket, _pool, _faucet, _manager);

        // Update Owner
        pod.transferOwnership(msg.sender);

        // SETUP TokenDrop Smart Contract w/ Pod Configuration
        // ---------------------------------------------------
        TokenDrop tokenDrop = tokenDropFactory.create(address(pod), _pool);

        // TokenDrop Pod Initialize - Add Pod to TokenDrop
        pod.setTokenDrop(address(tokenDrop));

        // Emit LogCreatedPodAndTokenDrop
        emit LogCreatedPodAndTokenDrop(address(pod), address(tokenDrop));

        // Return Pod/TokenDrop addresses
        return (address(pod), address(tokenDrop));
    }
}
