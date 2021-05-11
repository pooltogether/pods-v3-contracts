// SPDX-License-Identifier: MIT
pragma solidity >=0.7.0 <0.8.0;

// Libraries
import "./external/ProxyFactory.sol";

// Internal Interfaces
import "./TokenDropFactory.sol";

// Clone Contracts
import "./Pod.sol";
import "./TokenDrop.sol";

/**
 * @title PodFactory (ProxyFactory) - Clones a Pod Instance
 * @notice Reduces gas costs and collectively increases that chances winning for PoolTogether users, while keeping user POOL distributions to users.
 * @dev The PodFactory creates/initializes connected Pod and TokenDrop smart contracts. Pods stores tokens, tickets, prizePool and other essential references.
 * @author Kames Geraghty
 */
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
     * @dev Emitted when a new Pod and TokenDrop pair is created.
     */
    event LogCreatedPodAndTokenDrop(address pod, address drop);

    /***********************************|
    |   Constructor                     |
    |__________________________________*/
    /**
     * @notice Initializes the Pod Factory with an instance of the Pod and TokenDropFactory reference.
     * @dev Initializes the Pod Factory with an instance of the Pod and TokenDropFactory reference.
     * @param _tokenDropFactory Target PrizePool for deposits and withdraws
     */
    constructor(TokenDropFactory _tokenDropFactory) {
        // Pod Instance
        podInstance = new Pod();

        // Reference TokenDropFactory
        tokenDropFactory = _tokenDropFactory;
    }

    /**
     * @notice Create a new Pod Clone using the Pod instance.
     * @dev The Pod Smart Contact is created and initialized using the PodFactory.
     * @param _prizePool Target PrizePool for deposits and withdraws
     * @param _ticket Non-sponsored PrizePool ticket - is verified during initialization.
     * @param _faucet  TokenFaucet address that distributes reward token for PrizePool deposits.
     * @param _decimals Set the Pod decimals to match the underlying asset.
     * @return (address, address) Pod and TokenDrop addresses
     */
    function create(
        address _prizePool,
        address _ticket,
        address _faucet,
        address _manager,
        uint8 _decimals
    ) external returns (address, address) {
        // Pod Deploy
        Pod pod = Pod(deployMinimal(address(podInstance), ""));

        // Pod Initialize
        pod.initialize(_prizePool, _ticket, _decimals);

        // Pod Set Manager
        pod.setManager(_manager);

        // Governance managed PrizePools include TokenFaucets, which "drip" an asset token.
        // Community managed PrizePools might NOT have a TokenFaucet, and thus don't require a TokenDrop.
        address _drop;
        if (address(_faucet) != address(0)) {
            TokenFaucet faucet = TokenFaucet(_faucet);

            // Create TokenDrop instance
            _drop = tokenDropFactory.create(
                address(pod),
                address(faucet.asset())
            );

            // Set Pod TokenFacuet
            pod.setTokenFaucet(_faucet);

            // Set Pod TokenDrop
            pod.setTokenDrop(_drop);
        }

        // Update Pod owner from factory to msg.sender
        pod.transferOwnership(msg.sender);

        // Emit LogCreatedPodAndTokenDrop
        emit LogCreatedPodAndTokenDrop(address(pod), address(_drop));

        // Return Pod/TokenDrop addresses
        return (address(pod), address(_drop));
    }
}
