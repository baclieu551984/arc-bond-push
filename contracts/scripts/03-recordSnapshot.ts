import { ethers } from "hardhat";
import { getDeployedAddresses } from "./utils/getAddresses";

/**
 * Script: Record snapshot (Keeper function - every 15 minutes for testing)
 * Usage: npx hardhat run scripts/03-recordSnapshot.ts --network arc
 */

async function main() {
  console.log("📸 Recording Snapshot...\n");

  const [signer] = await ethers.getSigners();
  console.log("📍 Keeper address:", signer.address);

  // Get contract addresses from deployment
  const { BOND_SERIES_ADDRESS } = await getDeployedAddresses();
  
  // Get contract
  const bondSeries = await ethers.getContractAt("BondSeries", BOND_SERIES_ADDRESS);
  
  // Check timing
  const nextRecordTime = await bondSeries.nextRecordTime();
  const now = Math.floor(Date.now() / 1000);
  
  console.log("⏰ Current time:", new Date(now * 1000).toISOString());
  console.log("⏰ Next record time:", new Date(Number(nextRecordTime) * 1000).toISOString());
  
  if (now < Number(nextRecordTime)) {
    const timeLeft = Number(nextRecordTime) - now;
    const hoursLeft = Math.floor(timeLeft / 3600);
    const minutesLeft = Math.floor((timeLeft % 3600) / 60);
    console.log("\n⚠️ Too soon! Need to wait:");
    console.log(`   ${hoursLeft} hours ${minutesLeft} minutes`);
    console.log("\n💡 For testing, you can fast-forward time or wait.");
    return;
  }
  
  // Get info before
  const recordCountBefore = await bondSeries.recordCount();
  console.log("\n📊 Before snapshot:");
  console.log("   Record count:", recordCountBefore.toString());
  
  // Record snapshot
  console.log("\n⏳ Recording snapshot...");
  const tx = await bondSeries.recordSnapshot();
  const receipt = await tx.wait();
  console.log("✅ Snapshot recorded!");
  
  // Get info after
  const recordCountAfter = await bondSeries.recordCount();
  const snapshot = await bondSeries.snapshots(recordCountAfter);
  
  console.log("\n📊 After snapshot:");
  console.log("   Record count:", recordCountAfter.toString());
  console.log("   Total Supply:", ethers.formatUnits(snapshot.totalSupply, 6), "ABOND");
  console.log("   Treasury Balance:", ethers.formatUnits(snapshot.treasuryBalance, 6), "USDC");
  console.log("   Timestamp:", new Date(Number(snapshot.timestamp) * 1000).toISOString());
  
  // Calculate coupon due (0.001 USDC per token)
  const couponDue = (snapshot.totalSupply * BigInt(1000)) / BigInt(1e6); // Both 6 decimals
  console.log("\n💰 Coupon Due for this snapshot:");
  console.log("   Amount:", ethers.formatUnits(couponDue, 6), "USDC");
  console.log("   (Owner needs to distribute this amount)");
  
  console.log("\n🔗 Transaction:", tx.hash);
  console.log("🔗 Explorer: https://testnet.arcscan.app/tx/" + tx.hash);
  
  console.log("\n📝 Next step:");
  console.log("   Run: npx hardhat run scripts/04-distributeCoupon.ts --network arc");
}

main().catch((error) => {
  console.error("❌ Error:", error);
  process.exitCode = 1;
});

