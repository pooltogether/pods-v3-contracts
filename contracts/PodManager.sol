// SPDX-License-Identifier: MIT
pragma solidity >=0.7.0 <0.8.0;

import "hardhat/console.sol";

// Libraries
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";

import "./IPod.sol";
import "./IPodManager.sol";

import "./interfaces/uniswap/IUniswapV2Router02.sol";

contract PodManager is IPodManager, Ownable {
    /***********************************|
    |   Libraries                       |
    |__________________________________*/
    using SafeMath for uint256;

    /***********************************|
    |   Constants                       |
    |__________________________________*/
    // Uniswap Router
    IUniswapV2Router02 public UniswapRouter =
        IUniswapV2Router02(0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D);

    /***********************************|
    |   Events                          |
    |__________________________________*/
    /**
     * @dev Log Emitted when PodManager liquidates LootBox ERC20
     */
    event LogLiquidatedERC20(
        address token,
        uint256 amountIn,
        uint256 amountOut
    );

    /**
     * @dev Log Emitted when PodManager withdraws LootBox ERC721
     */
    event LogLiquidatedERC721(address token, uint256 tokenId);

    /***********************************|
    |   Constructor                     |
    |__________________________________*/

    /**
     * @dev Initialize the PodManager Smart Contact
     */
    constructor() {}

    /***********************************|
    |   Functions                       |
    |__________________________________*/
    /**
     * @notice liquidate
     * @return uint256 Amount liquidated
     */
    function liquidate(
        address _pod,
        IERC20 target,
        uint256 amountIn,
        uint256 amountOutMin,
        address[] calldata path
    ) external override returns (bool) {
        IPod pod = IPod(_pod);

        // Withdraw target token from Pod
        pod.withdrawERC20(target, amountIn);

        // Approve Uniswap Router Swap
        target.approve(address(UniswapRouter), amountIn);

        // Swap Tokens and Send Winnings to PrizePool Pod
        UniswapRouter.swapExactTokensForTokens(
            amountIn,
            amountOutMin,
            path,
            address(pod),
            block.timestamp
        );

        // Emit LogLiquidatedERC20
        emit LogLiquidatedERC20(address(target), amountIn, amountOutMin);

        return true;
    }

    /**
     * @notice liquidate
     * @return uint256 Amount liquidated
     */
    function withdrawCollectible(
        address _pod,
        IERC721 target,
        uint256 tokenId
    ) external override returns (bool) {
        IPod pod = IPod(_pod);

        // Withdraw target ERC721 from Pod
        pod.withdrawERC721(target, tokenId);

        // Transfer Collectible to Owner
        target.transferFrom(address(this), owner(), tokenId);

        // Emit LogLiquidatedERC721
        emit LogLiquidatedERC721(address(target), tokenId);

        return true;
    }
}
