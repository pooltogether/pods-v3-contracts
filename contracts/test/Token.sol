import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";

contract Token is ERC20Upgradeable {
    constructor() {
        // Initialize ERC20Token
        __ERC20_init_unchained("TestToken", "TEST");

        _mint(msg.sender, 1000000 * 1e18);
    }
}
