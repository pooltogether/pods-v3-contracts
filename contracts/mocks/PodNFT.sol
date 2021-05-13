// SPDX-License-Identifier: MIT
pragma solidity >=0.7.0 <0.8.0;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";

contract PodNFT is ERC721Upgradeable {
    /***********************************|
    |     		  Constructor           |
    |__________________________________*/
    /**
     * @dev Initialized PodNFT Smart Contract
     */
    constructor(string memory _name, string memory _symbol) {
        __ERC721_init(_name, _symbol);
        _safeMint(msg.sender, 1, "");
    }

    receive() external payable {
        revert("PodNFT: Not Payable");
    }
}
