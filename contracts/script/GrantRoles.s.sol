// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.24;

import { Script, console2 } from "forge-std/Script.sol";
import { OpenRWAToken } from "../src/OpenRWAToken.sol";

/// @notice Dev/testnet helper: grant operational roles to operator addresses.
/// @dev On mainnet these grants are executed by the Gnosis Safe multisig
///      (DEFAULT_ADMIN_ROLE) through the Safe UI, not by a raw private key.
contract GrantRoles is Script {
    function run() external {
        address tokenAddr = vm.envAddress("TOKEN_ADDRESS");
        address minter = vm.envAddress("MINTER_ADDRESS");
        address pauser = vm.envAddress("PAUSER_ADDRESS");
        OpenRWAToken token = OpenRWAToken(tokenAddr);

        uint256 pk = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(pk);
        token.grantRole(token.MINTER_ROLE(), minter);
        token.grantRole(token.PAUSER_ROLE(), pauser);
        vm.stopBroadcast();

        console2.log("Granted MINTER_ROLE to", minter);
        console2.log("Granted PAUSER_ROLE to", pauser);
    }
}
