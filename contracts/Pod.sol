// SPDX-License-Identifier: MIT
pragma solidity >=0.7.0 <0.8.0;

// Debuggin
import "hardhat/console.sol";

// Libraries
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";

// External Interfaces
import "@openzeppelin/contracts-upgradeable/proxy/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
// import "./external/OwnableUpgradeable.sol";

// Ineritance
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

// Internal Interfaces
import "./IPod.sol";
import "./TokenDrop.sol";
import "./IPodManager.sol";

// External Interfaces
import "./interfaces/TokenFaucet.sol";
import "./interfaces/IPrizePool.sol";
// import "./interfaces/IPrizePool.sol";
import "./interfaces/IPrizeStrategyMinimal.sol";

/**
 * @title Pod
 * @author Kames Geraghty
 * @notice Community PoolTogether Pods
 * @dev Pods
 */
contract Pod is Initializable, ERC20Upgradeable, OwnableUpgradeable, IPod {
    /***********************************|
    |   Libraries                       |
    |__________________________________*/
    using SafeMath for uint256;

    /***********************************|
    |   Constants                       |
    |__________________________________*/

    // Public
    IERC20 public token;
    IERC20 public ticket;
    IERC20 public pool;

    // Initialized Contracts
    TokenFaucet public faucet;
    TokenDrop public drop;

    // Private
    IPrizePool private _prizePool;

    // Manager
    IPodManager public manager;

    // Factory
    address public factory;

    /**
     * @notice Match tokens to TokenDrop references
     */
    mapping(address => TokenDrop) public drops;

    /***********************************|
    |   Events                          |
    |__________________________________*/
    /**
     * @dev Emitted when user deposits into batch backlog
     */
    event Deposited(address user, uint256 amount, uint256 shares);

    /**
     * @dev Emitted when user withdraws
     */
    event Withdrawl(address user, uint256 amount, uint256 shares);

    /**
     * @dev Emitted when batch deposit is executed
     */
    event Batch(uint256 amount, uint256 timestamp);

    /**
     * @dev Emitted when account sponsers pod.
     */
    event Sponsored(address sponsor, uint256 amount);

    /**
     * @dev Emitted when POOl is claimed for a user.
     */
    event Claimed(address user, uint256 balance);

    /**
     * @dev Emitted when POOl is claimed for the POD
     */
    event PodClaimed(uint256 amount);

    /**
     * @dev Emitted
     */
    event ERC721Collected(address from, uint256 tokenId);

    /**
     * @dev Emitted when account triggers drop calculation.
     */
    event DripCalculate(address account, uint256 amount);

    /**
     * @dev Emitted when liquidty manager is transfered.
     */
    event ManagementTransferred(
        address indexed previousmanager,
        address indexed newmanager
    );

    /***********************************|
    |   Modifiers                       |
    |__________________________________*/

    /**
     * @dev Throws if called by any account other than the manager.
     */
    modifier onlyManager() {
        require(
            address(manager) == _msgSender(),
            "Manager: caller is not the manager"
        );
        _;
    }

    /**
     * @dev Pause deposits during aware period.
     */
    modifier pauseDepositsDuringAwarding() {
        require(
            !IPrizeStrategyMinimal(_prizePool.prizeStrategy()).isRngRequested(),
            "Cannot deposit while prize is being awarded"
        );
        _;
    }

    /***********************************|
    |   Constructor                     |
    |__________________________________*/

    /**
     * @dev Initialize the Pod Smart Contact
     */
    function initialize(
        address _prizePoolTarget,
        address _ticket,
        address _pool,
        address _faucet,
        address _manager
    ) external initializer {
        // Prize Pool
        _prizePool = IPrizePool(_prizePoolTarget);

        // Owner Token
        __Ownable_init_unchained();

        // Initialize Token
        __ERC20_init_unchained(
            string(abi.encodePacked("pPod ", ERC20(_prizePool.token()).name())),
            string(abi.encodePacked("pp", ERC20(_prizePool.token()).symbol()))
        );

        // Request PrizePool Tickets
        address[] memory tickets = _prizePool.tokens();

        // console.log("TICKETs", _ticket, tickets[1]);
        // Compare initialized ticket to prizePool.tokens[1]
        require(
            address(_ticket) == address(tickets[1]),
            "Pod:initialize-invalid-ticket"
        );

        // Initialize ERC20 Tokens
        token = IERC20(_prizePool.token());
        ticket = IERC20(tickets[1]);
        pool = IERC20(_pool);
        faucet = TokenFaucet(_faucet);

        // Liquidation Manager
        manager = IPodManager(_manager);

        // Factory
        factory = msg.sender;
    }

    /**
     * @dev Initialize the Pod Smart Contact
     */
    function setTokenDrop(address _tokenDrop) external {
        // console.log("ADDRESS", factory, owner());
        require(
            msg.sender == factory || msg.sender == owner(),
            "Pod:unauthorized-set-token-drop"
        );

        // Set TokenDrop
        drop = TokenDrop(_tokenDrop);

        // Map token to TokenDrop
        // TODO: Add support for additional TokenDrops
        drops[address(token)] = drop;
    }

    /***********************************|
    |   External                        |
    |__________________________________*/

    /**
     * @dev Returns the address of the current manager.
     */
    function podManager() external view returns (address) {
        return address(manager);
    }

    /**
     * @dev Transfers ownership of the contract to a new account (`newManager`).
     * Can only be called by the current owner.
     */
    function setManager(IPodManager newManager) public virtual onlyOwner {
        // Require Valid Address
        require(
            address(manager) != address(0),
            "Manager: new owner is the zero address"
        );

        // Emit ManagementTransferred
        emit ManagementTransferred(address(manager), address(newManager));

        // Update Manager
        manager = newManager;
    }

    /***********************************|
    |   Functions                       |
    |__________________________________*/
    /**
     * @notice Returns the address of the prize pool that the pod is bound to
     * @return The address of the prize pool
     */
    function prizePool() external view override returns (address) {
        return address(_prizePool);
    }

    /**
     * @notice Deposit assets into the Pod in exchange for share tokens
     * @param to The address that shall receive the Pod shares
     * @param tokenAmount The amount of tokens to deposit.  These are the same tokens used to deposit into the underlying prize pool.
     * @return The number of Pod shares minted.
     */
    function depositTo(address to, uint256 tokenAmount)
        external
        override
        returns (uint256)
    {
        require(tokenAmount > 0, "Pod:invalid-amount");

        // Allocate Shares from Deposit To Amount
        uint256 shares = _deposit(to, tokenAmount);

        // Transfer Token Transfer Message Sender
        IERC20(token).transferFrom(msg.sender, address(this), tokenAmount);

        // Emit Deposited
        emit Deposited(to, tokenAmount, shares);

        // Return Shares Minted
        return shares;
    }

    /**
     * @notice Withdraws a users share of the prize pool.
     * @dev The function should first withdraw from the 'float'; i.e. the funds that have not yet been deposited.
     * @param shareAmount The number of Pod shares to redeem
     * @return The actual amount of tokens that were transferred to the user.  This is the same as the deposit token.
     */
    function withdraw(uint256 shareAmount) external override returns (uint256) {
        // Check User Balance
        require(
            balanceOf(msg.sender) >= shareAmount,
            "Pod:insufficient-shares"
        );

        // Burn Shares and Return Tokens
        uint256 tokens = _burnShares(shareAmount);

        // Emit Withdrawl
        emit Withdrawl(msg.sender, tokens, shareAmount);

        return tokens;
    }

    /**
     * @notice Deposit float into PrizePool
     * @dev Deposits the current float amount into the PrizePool and claims current POOL rewards
     * @param batchAmount Amount to deposit in PoolTogether PrizePool
     */
    function batch(uint256 batchAmount) external override {
        uint256 tokenBalance = vaultTokenBalance();

        // Pod has a float above 0
        require(tokenBalance > 0, "Pod:zero-float-balance");

        // Batch Amount is EQUAL or LESS than vault token float balance
        // batchAmount can be below tokenBalance to keep float available t withdraw
        require(batchAmount <= tokenBalance, "Pod:insufficient-float-balance");

        // Claim POOL drop backlog.
        uint256 poolAmount = claimPodPool();

        // Emit PodClaimed
        emit PodClaimed(poolAmount);

        // Approve Prize Pool
        token.approve(address(_prizePool), tokenBalance);

        // PrizePool Deposit
        _prizePool.depositTo(
            address(this),
            batchAmount,
            address(ticket),
            address(this)
        );

        // Emit Batch
        emit Batch(tokenBalance, block.timestamp);
    }

    /**
     * @dev Withdraw ERC20 reward tokens exlcuding token and ticket.
     */
    function withdrawERC20(IERC20 _target, uint256 amount)
        external
        override
        onlyManager
    {
        // Lock token/ticket/pool ERC20 transfers
        require(
            address(_target) != address(token) ||
                address(_target) != address(ticket) ||
                address(_target) != address(pool),
            "Pod:invalid-target-token"
        );

        // Transfer Token
        _target.transfer(msg.sender, amount);
    }

    /**
     * @dev Withdraw ER721 reward tokens
     */
    function withdrawERC721(IERC721 _token, uint256 tokenId)
        external
        override
        onlyManager
    {
        // Transfer ERC721
        IERC721(_token).transferFrom(address(this), msg.sender, tokenId);
    }

    /**
     * @notice Allows a user to claim POOL tokens for an address.  The user will be transferred their share of POOL tokens.
     * @dev Allows a user to claim POOL tokens for an address.  The user will be transferred their share of POOL tokens.
     * @param user User account
     * @param _token The target token
     * @return uint256 Amount claimed.
     */
    function claim(address user, address _token)
        external
        override
        returns (uint256)
    {
        // Get token<>tokenDrop mapping
        require(
            drops[_token] != TokenDrop(address(0)),
            "Pod:invalid-token-drop"
        );

        // Claim POOL rewards
        uint256 _balance = drops[_token].claim(user);

        emit Claimed(user, _balance);

        return _balance;
    }

    /**
     * @dev Claim POOL for PrizePool Pod
     * @return uint256 claimed amount
     */
    function claimPodPool() public returns (uint256) {
        uint256 _claimedAmount = faucet.claim(address(this));

        // Approve POOL transfer. @TODO Add infinite approval during initialize?
        pool.approve(address(drop), _claimedAmount);

        // Add POOl to TokenDrop balance
        drop.addAssetToken(_claimedAmount);

        // Claimed Amount
        return _claimedAmount;
    }

    /***********************************|
    |   Internal                        |
    |__________________________________*/

    /**
     * @dev Allocate shares based on deposit percentage.
     */
    function _deposit(address user, uint256 amount) internal returns (uint256) {
        uint256 allocation = 0;

        // Calculate Allocation
        if (totalSupply() == 0) {
            allocation = amount;
        } else {
            allocation = (amount.mul(totalSupply())).div(balance());
        }

        // Mint User Shares
        _mint(user, allocation);

        // Return Allocation Amount
        return allocation;
    }

    /**
     * @dev Burn shares and withdraw token.
     */
    function _burnShares(uint256 shares) internal returns (uint256) {
        // Calculate Percentage Returned from Burned Shares
        uint256 amount = (balance().mul(shares)).div(totalSupply());

        // Burn Shares
        _burn(msg.sender, shares);

        // Check balance
        IERC20 _token = IERC20(token);
        uint256 currentBalance = _token.balanceOf(address(this));

        // Withdrawl Exceeds Current Token Balance
        if (amount > currentBalance) {
            // Calculate Withdrawl Amount
            uint256 _withdraw = amount.sub(currentBalance);

            // Withdraw from Prize Pool
            uint256 exitFee = _withdrawFromPool(_withdraw);

            // Add Exit Fee to Withdrawl Amount
            amount = amount.sub(exitFee);

            // Read Balance After Withdraw Differences
            // uint256 _after = _token.balanceOf(address(this));
            // uint256 _diff = _after.sub(currentBalance);

            // Check Withdrawl Difference
            // if (_diff < _withdraw) {
            //     uint256 preFee = amount;
            //     amount = currentBalance.add(_diff);
            //     console.log("Burn Shares", preFee, amount, exitFee);
            // }
        }

        // Transfer Deposit Token to Message Sender
        _token.transfer(msg.sender, amount);

        // Return Token Withdrawl Amount
        return amount;
    }

    /**
     * @dev Withdraw from PrizePool
     * @param _amount Amount to withdraw
     * @return uint256 pool exact withdraw amount
     */
    function _withdrawFromPool(uint256 _amount) internal returns (uint256) {
        IPrizePool _pool = IPrizePool(_prizePool);

        // Calculate Early Exit Fee
        (uint256 exitFee, ) =
            _pool.calculateEarlyExitFee(
                address(this),
                address(ticket),
                _amount
            );

        // Withdraw from Prize Pool
        uint256 exitFeePaid =
            _pool.withdrawInstantlyFrom(
                address(this),
                _amount,
                address(ticket),
                exitFee
            );

        // Exact Exit Fee
        return exitFeePaid;
    }

    /***********************************|
    |  Views                            |
    |__________________________________*/

    /**
     * @dev Price per share for entire pod balances.
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
     * @dev Price per share for user
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
     * @dev Pod balance of deposit token.
     */
    function vaultTokenBalance() public view returns (uint256) {
        return token.balanceOf(address(this));
    }

    /**
     * @dev Pod balance of ticket token.
     */
    function vaultTicketBalance() public view returns (uint256) {
        return ticket.balanceOf(address(this));
    }

    /**
     * @dev Pod balance of POOL token.
     */
    function vaultPoolBalance() public view returns (uint256) {
        return pool.balanceOf(address(this));
    }

    /**
     * @dev Pod total balance of deposit and ticket tokens.
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
        super._beforeTokenTransfer(from, to, amount);

        // Update Drip
        drop.beforeTokenTransfer(from, to, address(this));

        emit DripCalculate(from, amount);
    }
}
