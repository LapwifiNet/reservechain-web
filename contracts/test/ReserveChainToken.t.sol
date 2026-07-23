// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { Test } from "forge-std/Test.sol";
import { ReserveChainToken } from "../src/ReserveChainToken.sol";

contract ReserveChainTokenTest is Test {
    ReserveChainToken internal token;

    address internal admin;
    address internal treasury;
    address internal minter;
    address internal pauser;
    address internal redeemer;
    address internal alice;
    address internal bob;

    uint256 internal constant CAP = 100_000_000 ether;

    function setUp() public {
        admin = makeAddr("admin");
        treasury = makeAddr("treasury");
        minter = makeAddr("minter");
        pauser = makeAddr("pauser");
        redeemer = makeAddr("redeemer");
        alice = makeAddr("alice");
        bob = makeAddr("bob");

        token = new ReserveChainToken("ReserveChain Metals Token", "RCM", CAP, admin, treasury, 0);

        vm.startPrank(admin);
        token.grantRole(token.MINTER_ROLE(), minter);
        token.grantRole(token.PAUSER_ROLE(), pauser);
        token.grantRole(token.REDEEMER_ROLE(), redeemer);
        vm.stopPrank();
    }

    function test_Metadata() public {
        assertEq(token.name(), "ReserveChain Metals Token");
        assertEq(token.symbol(), "RCM");
        assertEq(token.decimals(), 18);
        assertEq(token.cap(), CAP);
        assertEq(token.treasury(), treasury);
        assertEq(token.totalSupply(), 0);
    }

    function test_AdminRolesGranted() public {
        assertTrue(token.hasRole(token.DEFAULT_ADMIN_ROLE(), admin));
        assertTrue(token.hasRole(token.CONFIG_ROLE(), admin));
    }

    function test_MinterCanMint() public {
        vm.prank(minter);
        token.mint(alice, 1_000 ether);
        assertEq(token.balanceOf(alice), 1_000 ether);
        assertEq(token.totalSupply(), 1_000 ether);
    }

    function test_NonMinterCannotMint() public {
        vm.prank(alice);
        vm.expectRevert();
        token.mint(alice, 1 ether);
    }

    function test_CapIsEnforced() public {
        vm.prank(minter);
        vm.expectRevert();
        token.mint(alice, CAP + 1);
    }

    function test_Burn() public {
        vm.prank(minter);
        token.mint(alice, 500 ether);
        vm.prank(alice);
        token.burn(200 ether);
        assertEq(token.balanceOf(alice), 300 ether);
        assertEq(token.totalSupply(), 300 ether);
    }

    function test_PauseBlocksTransfersThenUnpause() public {
        vm.prank(minter);
        token.mint(alice, 100 ether);

        vm.prank(pauser);
        token.pause();

        vm.prank(alice);
        vm.expectRevert();
        token.transfer(bob, 1 ether);

        vm.prank(pauser);
        token.unpause();

        vm.prank(alice);
        token.transfer(bob, 10 ether);
        assertEq(token.balanceOf(bob), 10 ether);
    }

    function test_NonPauserCannotPause() public {
        vm.prank(alice);
        vm.expectRevert();
        token.pause();
    }

    function test_RedemptionInactiveByDefault() public {
        vm.prank(minter);
        token.mint(alice, 100 ether);
        vm.prank(alice);
        token.approve(redeemer, 100 ether);

        vm.prank(redeemer);
        vm.expectRevert(bytes("ReserveChain: redemption inactive"));
        token.redemptionBurn(alice, 50 ether, keccak256("REF-1"));
    }

    function test_RedemptionAfterActivation() public {
        vm.prank(minter);
        token.mint(alice, 100 ether);

        vm.prank(admin);
        token.setRedemptionActive(true);

        vm.prank(alice);
        token.approve(redeemer, 60 ether);

        vm.prank(redeemer);
        token.redemptionBurn(alice, 60 ether, keccak256("REF-1"));

        assertEq(token.balanceOf(alice), 40 ether);
        assertEq(token.totalSupply(), 40 ether);
    }

    function test_SetTreasury() public {
        address newT = makeAddr("newTreasury");
        vm.prank(admin);
        token.setTreasury(newT);
        assertEq(token.treasury(), newT);
    }

    function test_NonConfigCannotSetTreasury() public {
        vm.prank(alice);
        vm.expectRevert();
        token.setTreasury(alice);
    }

    function testFuzz_MintWithinCap(uint256 amount) public {
        amount = bound(amount, 0, CAP);
        vm.prank(minter);
        token.mint(alice, amount);
        assertEq(token.balanceOf(alice), amount);
    }
}
