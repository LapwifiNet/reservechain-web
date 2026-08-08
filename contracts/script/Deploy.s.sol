// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.24;

import { Script, console2 } from "forge-std/Script.sol";
import { OpenRWAToken } from "../src/OpenRWAToken.sol";

/// @notice Deploy OpenRWAToken. TESTNET ONLY.
/// @dev Hard guard blocks Ethereum mainnet (chainid 1) — mainnet/TGE requires
///      written authorization (Build Plan P20).
contract Deploy is Script {
    function run() external returns (OpenRWAToken token) {
        require(block.chainid != 1, "Mainnet deploy blocked: requires written authorization (P20)");

        string memory name = vm.envOr("TOKEN_NAME", string("OpenRWA Tokens Token"));
        string memory symbol = vm.envOr("TOKEN_SYMBOL", string("ORWA"));
        uint256 cap = vm.envOr("TOKEN_CAP", uint256(100_000_000 ether));
        uint256 initialMint = vm.envOr("TOKEN_INITIAL_MINT", uint256(0));
        address admin = vm.envAddress("ADMIN_ADDRESS");
        address treasury = vm.envAddress("TREASURY_ADDRESS");

        uint256 pk = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(pk);
        token = new OpenRWAToken(name, symbol, cap, admin, treasury, initialMint);
        vm.stopBroadcast();

        console2.log("OpenRWAToken deployed at:", address(token));
        console2.log("Admin (multisig):", admin);
        console2.log("Treasury:", treasury);
        console2.log("Chain id:", block.chainid);
    }
}
