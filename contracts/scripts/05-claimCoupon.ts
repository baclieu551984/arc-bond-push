import { ethers } from "hardhat";
import { getDeployedAddresses } from "./utils/getAddresses";

/**
 * Script: Claim accumulated coupon (User function)
 * Usage: npx hardhat run scripts/05-claimCoupon.ts --network arc
 */

async function main() {
  console.log("💰 Claiming Coupon...\n");

  const [signer] = await ethers.getSigners();
  console.log("📍 Your address:", signer.address);

  // Get contract addresses from deployment
  const { USDC_ADDRESS, BOND_SERIES_ADDRESS, BOND_TOKEN_ADDRESS } = await getDeployedAddresses();
  
  // Get contracts
  const usdc = await ethers.getContractAt("contracts/IERC20.sol:IERC20", USDC_ADDRESS);
  const bondSeries = await ethers.getContractAt("BondSeries", BOND_SERIES_ADDRESS);
  const bondToken = await ethers.getContractAt("BondToken", BOND_TOKEN_ADDRESS);
  
  // Check user holdings
  const bondBalance = await bondToken.balanceOf(signer.address);
  console.log("🎫 Your BondToken balance:", ethers.formatUnits(bondBalance, 6), "ABOND");
  
  if (bondBalance === 0n) {
    console.log("\n⚠️ You don't have any BondTokens!");
    console.log("💡 Run: npx hardhat run scripts/02-deposit.ts --network arc");
    return;
  }
  
  // Check claimable amount
  const claimable = await bondSeries.claimableAmount(signer.address);
  console.log("💵 Claimable coupon:", ethers.formatUnits(claimable, 6), "USDC");
  
  if (claimable === 0n) {
    console.log("\n⚠️ No coupon to claim yet!");
    console.log("💡 Either:");
    console.log("   1. No snapshot recorded yet (run script 03)");
    console.log("   2. No coupon distributed yet (run script 04)");
    console.log("   3. You already claimed all available coupon");
    return;
  }
  
  // Get balances before
  const usdcBefore = await usdc.balanceOf(signer.address);
  const cumulativeIndex = await bondSeries.cumulativeCouponIndex();
  const claimedIndex = await bondSeries.claimedIndex(signer.address);
  
  console.log("\n📊 Before claim:");
  console.log("   USDC balance:", ethers.formatUnits(usdcBefore, 6), "USDC");
  console.log("   Cumulative Index:", ethers.formatUnits(cumulativeIndex, 6));
  console.log("   Your Claimed Index:", ethers.formatUnits(claimedIndex, 6));
  
  // Claim coupon
  console.log("\n⏳ Claiming coupon...");
  const claimTx = await bondSeries.claimCoupon();
  await claimTx.wait();
  console.log("✅ Coupon claimed!");
  
  // Get balances after
  const usdcAfter = await usdc.balanceOf(signer.address);
  const claimedIndexAfter = await bondSeries.claimedIndex(signer.address);
  
  console.log("\n📊 After claim:");
  console.log("   USDC balance:", ethers.formatUnits(usdcAfter, 6), "USDC");
  console.log("   USDC received:", ethers.formatUnits(usdcAfter - usdcBefore, 6), "USDC");
  console.log("   Your Claimed Index:", ethers.formatUnits(claimedIndexAfter, 6));
  
  console.log("\n🔗 Transaction:", claimTx.hash);
  console.log("🔗 Explorer: https://testnet.arcscan.app/tx/" + claimTx.hash);
}

main().catch((error) => {
  console.error("❌ Error:", error);
  process.exitCode = 1;
});

