// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { Script, console2 } from "forge-std/Script.sol";
import { ReserveChainToken } from "../src/ReserveChainToken.sol";

/// @notice Deploy ReserveChainToken. TESTNET ONLY.
/// @dev Hard guard blocks Ethereum mainnet (chainid 1) — mainnet/TGE requires
///      written authorization (Build Plan P20).
contract Deploy is Script {
    function run() external returns (ReserveChainToken token) {
        require(block.chainid != 1, "Mainnet deploy blocked: requires written authorization (P20)");

        string memory name = vm.envOr("TOKEN_NAME", string("ReserveChain Metals Token"));
        string memory symbol = vm.envOr("TOKEN_SYMBOL", string("RCM"));
        uint256 cap = vm.envOr("TOKEN_CAP", uint256(100_000_000 ether));
        uint256 initialMint = vm.envOr("TOKEN_INITIAL_MINT", uint256(0));
        address admin = vm.envAddress("ADMIN_ADDRESS");
        address treasury = vm.envAddress("TREASURY_ADDRESS");

        uint256 pk = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(pk);
        token = new ReserveChainToken(name, symbol, cap, admin, treasury, initialMint);
        vm.stopBroadcast();

        console2.log("ReserveChainToken deployed at:", address(token));
        console2.log("Admin (multisig):", admin);
        console2.log("Treasury:", treasury);
        console2.log("Chain id:", block.chainid);
    }
}
