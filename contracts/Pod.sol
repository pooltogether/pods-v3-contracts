// SPDX-License-Identifier: MIT
pragma solidity >=0.7.0 <0.8.0;

// Libraries
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/SafeERC20Upgradeable.sol";

// Module Interfaces
import "@openzeppelin/contracts-upgradeable/proxy/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";

// Internal Interfaces
import "./IPod.sol";
import "./TokenDrop.sol";
import "./IPodManager.sol";
import "./TokenDropFactory.sol";

// External Interfaces
import "./interfaces/TokenFaucet.sol";
import "./interfaces/IPrizePool.sol";
import "./interfaces/IPrizeStrategyMinimal.sol";

/**
 * @title Pod (Initialize, ERC20Upgradeable, OwnableUpgradeable, IPod) - Reduce User Gas Costs and Increase Odds of Winning via Collective Deposits.
 * @notice Pods turn PoolTogether deposits into shares and enable batched deposits, reudcing gas costs and collectively increasing odds  winning.
 * @dev Pods is a ERC20 token with additional features: shares (representing deposits), batched deposits into PoolTogether PrizePools and claimable rewards.
 * @author Kames Geraghty
 */
contract Pod is
    Initializable,
    ERC20Upgradeable,
    OwnableUpgradeable,
    IPod,
    ReentrancyGuard
{
    /***********************************|
    |   Libraries                       |
    |__________________________________*/
    using SafeMath for uint256;
    using SafeERC20Upgradeable for IERC20Upgradeable;

    /***********************************|
    |   Constants                       |
    |__________________________________*/
    // Public
    IERC20Upgradeable public token;
    IERC20Upgradeable public ticket;

    TokenFaucet public faucet;
    TokenDrop public tokenDrop;
    address public manager;

    // Private
    IPrizePool private _prizePool;

    /***********************************|
    |   Events                          |
    |__________________________________*/
    /**
     * @dev Emitted when user deposits into Pod float.
     */
    event Deposited(address indexed user, uint256 amount, uint256 shares);

    /**
     * @dev Emitted when user withdraws from the Pod.
     */
    event Withdrawal(address indexed user, uint256 amount, uint256 shares);

    /**
     * @dev Emitted when batch is executed.
     */
    event BatchFloat(uint256 amount);

    /**
     * @dev Emitted when reward asset is claimed by a user.
     */
    event Claimed(address indexed user, uint256 balance);

    /**
     * @dev Emitted when reward asset is claimed by the POD.
     */
    event PodClaimed(uint256 amount);

    /**
     * @dev Emitted when the Pod TokenDrop is set by owner.
     */
    event TokenDropSet(TokenDrop indexed drop);

    /**
     * @dev Emitted when the Pod TokenFaucet is set by owner.
     */
    event TokenFaucetSet(TokenFaucet indexed drop);

    /**
     * @dev Emitted when an ERC20 is withdrawn.
     */
    event ERC20Withdrawn(ERC20Upgradeable indexed target, uint256 amount);

    /**
     * @dev Emitted when an ERC721 is withdrawn.
     */
    event ERC721Withdrawn(IERC721 indexed target, uint256 tokenId);

    /**
     * @dev Emitted when Pod manager is transfered.
     */
    event ManagementTransferred(
        address indexed previousmanager,
        address indexed newmanager
    );

    /***********************************|
    |   Modifiers                       |
    |__________________________________*/

    /**
     * @dev Checks is the caller is an active PodManager
     */
    modifier onlyManager() {
        require(manager == _msgSender(), "Pod:manager-unauthorized");
        _;
    }

    /**
     * @dev Pause deposits during aware period. Prevents "frontrunning" for deposits into a winning Pod.
     */
    modifier pauseDepositsDuringAwarding() {
        require(
            !IPrizeStrategyMinimal(_prizePool.prizeStrategy()).isRngRequested(),
            "Cannot deposit while prize is being awarded"
        );
        _;
    }

    /***********************************|
    |   Initialize                      |
    |__________________________________*/

    /**
     * @notice Initialize the Pod Smart Contact with the target PrizePool configuration.
     * @dev The Pod Smart Contact is created and initialized using the PodFactory.
     * @param _prizePoolTarget Target PrizePool for deposits and withdraws
     * @param _ticket Non-sponsored PrizePool ticket - is verified during initialization.
     * @param _manager Liquidates the Pod's "bonus" tokens for the Pod's token.
     * @param _decimals Set the Pod decimals to match the underlying asset.
     */
    function initialize(
        address _prizePoolTarget,
        address _ticket,
        address _manager,
        uint8 _decimals
    ) external initializer {
        // Prize Pool
        _prizePool = IPrizePool(_prizePoolTarget);

        // Contract/Inheritance Configuration
        // ----------------------------------
        // Initialize ERC20Token
        __ERC20_init_unchained(
            string(
                abi.encodePacked(
                    "Pod ",
                    ERC20Upgradeable(_prizePool.token()).name()
                )
            ),
            string(
                abi.encodePacked(
                    "p",
                    ERC20Upgradeable(_prizePool.token()).symbol()
                )
            )
        );

        // Initialize Owner
        __Ownable_init_unchained();

        // Setup Decimals - Match Underlying Asset
        _setupDecimals(_decimals);

        // Pod Variable/Reference Configuration
        // ------------------------------------

        // PrizePool Tickets
        address[] memory tickets = _prizePool.tokens();

        // Verify ticket matches a PrizePool Ticket
        require(
            address(_ticket) == address(tickets[0]) ||
                address(_ticket) == address(tickets[1]),
            "Pod:initialize-invalid-ticket"
        );

        // Initialize Core ERC20 Tokens
        token = IERC20Upgradeable(_prizePool.token());
        ticket = IERC20Upgradeable(_ticket);

        // Pod Liquidation Manager
        manager = _manager;
    }

    /***********************************|
    |   Public/External                 |
    |__________________________________*/

    /**
     * @notice Deposit assets into the Pod in exchange for share tokens
     * @param to The address that shall receive the Pod shares
     * @param tokenAmount The amount of tokens to deposit.  These are the same tokens used to deposit into the underlying prize pool.
     * @return The number of Pod shares minted.
     */
    function depositTo(address to, uint256 tokenAmount)
        external
        override
        pauseDepositsDuringAwarding
        nonReentrant
        returns (uint256)
    {
        require(tokenAmount > 0, "Pod:invalid-amount");

        // Allocate Shares from Deposit To Amount
        uint256 shares = _calculateAllocation(tokenAmount);

        // Transfer Token tokenAmount to msg.sender
        IERC20Upgradeable(token).safeTransferFrom(
            msg.sender,
            address(this),
            tokenAmount
        );

        // Mint User Shares
        _mint(to, shares);

        // Emit Deposited
        emit Deposited(to, tokenAmount, shares);

        // Return Shares Minted
        return shares;
    }

    /**
     * @notice Withdraws a users share of the prize pool.
     * @dev The function should first withdraw from the 'float'; i.e. the funds that have not yet been deposited.
     * @param shareAmount The number of Pod shares to redeem.
     * @param maxFee Max fee amount for withdrawl if amount isn't available in float.
     * @return The actual amount of tokens that were transferred to the user.  This is the same as the deposit token.
     */
    function withdraw(uint256 shareAmount, uint256 maxFee)
        external
        override
        nonReentrant
        returns (uint256)
    {
        // Check User Balance
        require(
            balanceOf(msg.sender) >= shareAmount,
            "Pod:insufficient-shares"
        );

        // Burn Shares and Return Tokens
        uint256 tokensReturned =
            _burnSharesAndGetTokensReturned(shareAmount, maxFee);

        // Transfer Deposit Token to Message Sender
        token.safeTransfer(msg.sender, tokensReturned);

        // Emit Withdrawal
        emit Withdrawal(msg.sender, tokensReturned, shareAmount);

        return tokensReturned;
    }

    /**
     * @notice Deposit Pod float into PrizePool.
     * @dev Deposits the current float amount into the PrizePool and claims current POOL rewards.
     */
    function batch() public override returns (uint256) {
        // Pod Token Balance
        uint256 float = vaultTokenBalance();

        // Approve Prize Pool
        token.safeApprove(address(_prizePool), float);

        // PrizePool Deposit
        _prizePool.depositTo(
            address(this),
            float,
            address(ticket),
            address(this)
        );

        // Emit Batch
        emit BatchFloat(float);

        return float;
    }

    /**
     * @notice Claims TokenDrop asset for PrizePool Pod deposits
     * @dev Claim TokenDrop asset for PrizePool Pod and transfers token(s) to external Pod TokenDrop.
     * @return uint256 claimed amount
     */
    function drop() public returns (uint256) {
        // Claim asset from TokenFaucet if active
        if (address(faucet) != address(0)) {
            faucet.claim(address(this));
        }

        // Run batch (to eliminate "sandwich" attack) and reduce Pod float to zero.
        batch();

        // TokenDrop Asset
        IERC20Upgradeable _asset = IERC20Upgradeable(tokenDrop.asset());

        // Pod asset balance
        uint256 balance = _asset.balanceOf(address(this));

        // Only Transfer asset to TokenDrop if balance above 0
        if (balance > 0) {
            // Approve TokenDrop to withdraw(transfer) reward balance
            _asset.safeApprove(address(tokenDrop), balance);

            // Add reward token to TokenDrop balance
            tokenDrop.addAssetToken(balance);
        }

        // Emit PodClaimed
        emit PodClaimed(balance);

        return balance;
    }

    /**
     * @notice Update the Pod Mangeer
     * @dev Update the Pod Manger responsible for handling liquidations.
     * @return bool true
     */
    function setPodManager(address newManager)
        public
        virtual
        onlyOwner
        returns (bool)
    {
        // Validate Address
        require(newManager != address(0), "Pod:invalid-manager-address");

        // Update Manager
        manager = newManager;

        // Emit ManagementTransferred
        emit ManagementTransferred(manager, newManager);

        return true;
    }

    /**
     * @notice Set TokenFaucet reference
     * @dev Set TokenFaucet reference (if prizepool faucet is updated)
     * @param _faucet TokenDrop address
     * @return bool true
     */
    function setTokenFaucet(address _faucet) external onlyOwner returns (bool) {
        require(_faucet != address(0), "Pod:invalid-faucet-contract");

        // Set TokenFaucet
        faucet = TokenFaucet(_faucet);

        // Emit TokenFaucetSet
        emit TokenFaucetSet(_faucet);

        return true;
    }

    /**
     * @notice Setup TokenDrop reference
     * @dev Initialize the Pod Smart Contact
     * @param _tokenDrop TokenDrop address
     * @return bool true
     */
    function setTokenDrop(TokenDrop _tokenDrop)
        external
        onlyOwner
        returns (bool)
    {
        // TokenDrop must be a valid smart contract
        require(
            address(_tokenDrop) != address(0),
            "Pod:invalid-token-drop-contract"
        );

        // Set TokenDrop smart contract instance
        tokenDrop = _tokenDrop;

        // Emit TokenDropSet
        emit TokenDropSet(_tokenDrop);

        return true;
    }

    /**
     * @notice Withdraw non-core (token/ticket/pool) ERC20 to Pod manager.
     * @dev Withdraws an ERC20 token amount from the Pod to the PodManager for liquidation to the token and back to the Pod.
     * @param _target ERC20 token to withdraw.
     * @param amount Amount of ERC20 to transfer/withdraw.
     * @return bool true
     */
    function withdrawERC20(IERC20Upgradeable _target, uint256 amount)
        external
        override
        onlyManager
        returns (bool)
    {
        // Lock token/ticket/pool ERC20 transfers
        require(
            address(_target) != address(token) &&
                address(_target) != address(ticket) &&
                address(_target) != address(tokenDrop.asset()),
            "Pod:invalid-target-token"
        );

        // Transfer Token
        _target.safeTransfer(msg.sender, amount);

        emit ERC20Withdrawn(address(_target), amount);

        return true;
    }

    /**
     * @dev Withdraw ER721 reward tokens
     */
    /**
     * @notice Withdraw ER721 token to the Pod owner.
     * @dev Withdraw ER721 token to the Pod owner, which is responsible for deciding what/how to manage the collectible.
     * @param _target ERC721 token to withdraw.
     * @param tokenId The tokenId of the ERC721 collectible.
     * @return bool true
     */
    function withdrawERC721(IERC721 _target, uint256 tokenId)
        external
        override
        onlyManager
        returns (bool)
    {
        // Transfer ERC721
        _target.transferFrom(address(this), msg.sender, tokenId);

        // Emit ERC721Withdrawn
        emit ERC721Withdrawn(address(_target), tokenId);

        return true;
    }

    /***********************************|
    |   Administration                  |
    |__________________________________*/

    /**
     * @notice Zero out the allowance amount of target address to zero.
     * @dev The safeApprove method throws an error if an allowance IS NOT zero. If this unentiionally occurs, this function will reset an allowance.
     * @param _token ERC20 token.
     * @param _target Address with non-zero allowance.
     */
    function emergencyTokenApproveZero(
        IERC20Upgradeable _token,
        address _target
    ) external onlyOwner {
        _token.safeApprove(_target, 0);
    }

    /***********************************|
    |   Internal                        |
    |__________________________________*/

    /**
     * @dev The internal function for the public depositTo function, which calculates a user's allocated shares from deposited amoint.
     * @param amount Amount of "token" deposited into the Pod.
     * @return uint256 The share allocation amount.
     */
    function _calculateAllocation(uint256 amount) internal returns (uint256) {
        uint256 allocation = 0;

        // Calculate Allocation
        if (totalSupply() == 0) {
            allocation = amount;
        } else {
            allocation = (amount.mul(totalSupply())).div(balance());
        }

        // Return Allocation Amount
        return allocation;
    }

    /**
     * @dev The internal function for the public withdraw function, which calculates a user's token allocation from burned shares.
     * @param shares Amount of "token" deposited into the Pod.
     * @param maxFee Max fee amount for withdrawl if amount isn't available in float.
     * @return uint256 The token amount returned for the burned shares.
     */
    function _burnSharesAndGetTokensReturned(uint256 shares, uint256 maxFee)
        internal
        returns (uint256)
    {
        // Calculate Percentage Returned from Burned Shares
        uint256 amount = (balance().mul(shares)).div(totalSupply());

        // Burn Shares
        _burn(msg.sender, shares);

        // Check balance
        uint256 currentBalance = token.balanceOf(address(this));

        // Withdrawal Exceeds Current Token Balance
        if (amount > currentBalance) {
            // Calculate Withdrawal Amount
            uint256 withdraw = amount.sub(currentBalance);

            // Withdraw from Prize Pool
            uint256 exitFee = _withdrawFromPool(withdraw, maxFee);

            // Add Exit Fee to Withdrawal Amount
            amount = amount.sub(exitFee);
        }

        // Return Token Withdrawal Amount
        return amount;
    }

    /**
     * @dev Withdraws from Pod prizePool if the float balance can cover the total withdraw amount.
     * @param amount Amount of tokens to withdraw in exchange for the tickets transfered.
     * @param maxFee Max fee amount for withdrawl if amount isn't available in float.
     * @return uint256 The exit fee paid for withdraw from the prizePool instant withdraw method.
     */
    function _withdrawFromPool(uint256 amount, uint256 maxFee)
        internal
        returns (uint256)
    {
        // Withdraw from Prize Pool
        uint256 exitFeePaid =
            _prizePool.withdrawInstantlyFrom(
                address(this),
                amount,
                address(ticket),
                maxFee
            );

        // Exact Exit Fee
        return exitFeePaid;
    }

    /***********************************|
    |  Views                            |
    |__________________________________*/

    /**
     * @notice The Pod manager address.
     * @dev Returns the address of the current Pod manager.
     * @return address manager
     */
    function podManager() external view returns (address) {
        return manager;
    }

    /**
     * @notice The Pod PrizePool reference
     * @dev Returns the address of the Pod prizepool
     * @return address The Pod prizepool
     */
    function prizePool() external view override returns (address) {
        return address(_prizePool);
    }

    /**
     * @notice Calculate the cost of withdrawing from the Pod if the
     * @param amount Amount of tokens to withdraw when calculating early exit fee.
     * @dev Based of the Pod's total token/ticket balance and totalSupply it calculates the pricePerShare.
     */
    function getEarlyExitFee(uint256 amount) external returns (uint256) {
        uint256 tokenBalance = vaultTokenBalance();
        if (amount <= tokenBalance) {
            return 0;
        } else {
            // Calculate Early Exit Fee
            (uint256 exitFee, ) =
                _prizePool.calculateEarlyExitFee(
                    address(this),
                    address(ticket),
                    amount.sub(tokenBalance)
                );

            // Early Exit Fee
            return exitFee;
        }
    }

    /**
     * @notice Calculate the cost of the Pod's token price per share. Until a Pod has won or been "airdropped" tokens it's 1.
     * @dev Based of the Pod's total token/ticket balance and totalSupply it calculates the pricePerShare.
     */
    function getPricePerShare() external view override returns (uint256) {
        // Check totalSupply to prevent SafeMath: division by zero
        if (totalSupply() > 0) {
            return balance().mul(1e18).div(totalSupply());
        } else {
            return 0;
        }
    }

    /**
     * @notice Calculate the cost of the user's price per share based on a Pod's token/ticket balance.
     * @dev Calculates the cost of the user's price per share based on a Pod's token/ticket balance.
     */
    function getUserPricePerShare(address user)
        external
        view
        returns (uint256)
    {
        // Check totalSupply to prevent SafeMath: division by zero
        if (totalSupply() > 0) {
            return balanceOf(user).mul(1e18).div(balance());
        } else {
            return 0;
        }
    }

    /**
     * @notice Pod current token balance.
     * @dev Request's the Pod's current token balance by calling balanceOf(address(this)).
     * @return uint256 Pod's current token balance.
     */
    function vaultTokenBalance() public view returns (uint256) {
        return token.balanceOf(address(this));
    }

    /**
     * @notice Pod current ticket balance.
     * @dev Request's the Pod's current ticket balance by calling balanceOf(address(this)).
     * @return uint256 Pod's current ticket balance.
     */
    function vaultTicketBalance() public view returns (uint256) {
        return ticket.balanceOf(address(this));
    }

    /**
     * @notice Measure's the Pod's total balance by adding the vaultTokenBalance and vaultTicketBalance
     * @dev The Pod's token and ticket balance are equal in terms of "value" and thus are used to calculate's a Pod's true balance.
     * @return uint256 Pod's token and ticket balance.
     */
    function balance() public view returns (uint256) {
        return vaultTokenBalance().add(vaultTicketBalance());
    }

    /***********************************|
    | ERC20 Overrides                   |
    |__________________________________*/

    /**
     * @notice Add TokenDrop to mint()
     * @dev Moves `amount` tokens from `sender` to `recipient` using the
     * allowance mechanism. `amount` is then deducted from the caller's
     * allowance.
     * @param from Account sending tokens
     * @param to Account recieving tokens
     * @param amount Amount of tokens sent
     */
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal virtual override {
        // Call _beforeTokenTransfer from contract inheritance
        super._beforeTokenTransfer(from, to, amount);

        // If Pod TokenDrop is initalized update calculated balances.
        if (address(tokenDrop) != address(0)) {
            tokenDrop.beforeTokenTransfer(from, to, address(this));
        }
    }
}
