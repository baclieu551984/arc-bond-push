import { ethers } from "hardhat";
import { getDeployedAddresses } from "./utils/getAddresses";

/**
 * Script: Distribute coupon (Owner function)
 * Usage: npx hardhat run scripts/04-distributeCoupon.ts --network arc
 */

async function main() {
  console.log("💸 Distributing Coupon...\n");

  const [signer] = await ethers.getSigners();
  console.log("📍 Owner address:", signer.address);

  // Get contract addresses from deployment
  const { USDC_ADDRESS, BOND_SERIES_ADDRESS } = await getDeployedAddresses();
  
  // Get contracts
  const usdc = await ethers.getContractAt("contracts/IERC20.sol:IERC20", USDC_ADDRESS);
  const bondSeries = await ethers.getContractAt("BondSeries", BOND_SERIES_ADDRESS);
  
  // Check if there's a snapshot to distribute
  const recordCount = await bondSeries.recordCount();
  const lastDistributed = await bondSeries.lastDistributedRecord();
  
  console.log("📊 Status:");
  console.log("   Record Count:", recordCount.toString());
  console.log("   Last Distributed:", lastDistributed.toString());
  
  if (recordCount <= lastDistributed) {
    console.log("\n⚠️ No new snapshot to distribute!");
    console.log("💡 Run: npx hardhat run scripts/03-recordSnapshot.ts --network arc");
    return;
  }
  
  // Get latest snapshot
  const snapshot = await bondSeries.snapshots(recordCount);
  console.log("\n📸 Latest Snapshot:");
  console.log("   Total Supply:", ethers.formatUnits(snapshot.totalSupply, 6), "ABOND");
  console.log("   Treasury Balance:", ethers.formatUnits(snapshot.treasuryBalance, 6), "USDC");
  
  // Calculate coupon due (0.001 USDC per token)
  // Formula: (totalSupply * 0.001) - both 6 decimals
  const couponDue = (snapshot.totalSupply * BigInt(1000)) / BigInt(1e6);
  
  console.log("\n💰 Coupon to distribute:");
  console.log("   Amount:", ethers.formatUnits(couponDue, 6), "USDC");
  
  // Check owner balance
  const ownerBalance = await usdc.balanceOf(signer.address);
  console.log("\n💵 Owner USDC balance:", ethers.formatUnits(ownerBalance, 6), "USDC");
  
  if (ownerBalance < couponDue) {
    console.log("\n❌ Insufficient USDC balance!");
    console.log("💡 Run: npx hardhat run scripts/01-mintUSDC.ts --network arc");
    return;
  }
  
  // Get index before
  const indexBefore = await bondSeries.cumulativeCouponIndex();
  console.log("\n📊 Before distribution:");
  console.log("   Cumulative Index:", ethers.formatUnits(indexBefore, 6));
  
  // Approve USDC
  console.log("\n⏳ Approving USDC...");
  const approveTx = await usdc.approve(BOND_SERIES_ADDRESS, couponDue);
  await approveTx.wait();
  console.log("✅ Approved");
  
  // Distribute coupon
  console.log("⏳ Distributing coupon...");
  const distributeTx = await bondSeries.distributeCoupon(couponDue);
  await distributeTx.wait();
  console.log("✅ Coupon distributed!");
  
  // Get index after
  const indexAfter = await bondSeries.cumulativeCouponIndex();
  console.log("\n📊 After distribution:");
  console.log("   Cumulative Index:", ethers.formatUnits(indexAfter, 6));
  console.log("   Index Increment:", ethers.formatUnits(indexAfter - indexBefore, 6));
  
  console.log("\n🔗 Transaction:", distributeTx.hash);
  console.log("🔗 Explorer: https://testnet.arcscan.app/tx/" + distributeTx.hash);
  
  console.log("\n📝 Next step:");
  console.log("   Users can now claim coupon!");
  console.log("   Run: npx hardhat run scripts/05-claimCoupon.ts --network arc");
}

main().catch((error) => {
  console.error("❌ Error:", error);
  process.exitCode = 1;
});

