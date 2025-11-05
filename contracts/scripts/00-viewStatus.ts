import { ethers } from "hardhat";
import { getDeployedAddresses } from "./utils/getAddresses";

/**
 * Script: View current status of BondSeries
 * Usage: npx hardhat run scripts/00-viewStatus.ts --network arc
 */

async function main() {
  console.log("📊 ArcBond System Status\n");
  console.log("=".repeat(60));

  const [signer] = await ethers.getSigners();

  // Get contract addresses from deployment
  const addresses = await getDeployedAddresses();
  const { USDC_ADDRESS, BOND_SERIES_ADDRESS, BOND_TOKEN_ADDRESS } = addresses;
  
  console.log("📍 Network:", addresses.chainName, `(Chain ID: ${addresses.chainId})`);
  console.log("📍 Contracts loaded from deployments/bond-system.json\n");
  
  // Get contracts
  const usdc = await ethers.getContractAt("contracts/IERC20.sol:IERC20", USDC_ADDRESS);
  const bondSeries = await ethers.getContractAt("BondSeries", BOND_SERIES_ADDRESS);
  const bondToken = await ethers.getContractAt("BondToken", BOND_TOKEN_ADDRESS);
  
  // Get series info
  const seriesInfo = await bondSeries.getSeriesInfo();
  const maturityDate = seriesInfo[0];
  const totalDeposited = seriesInfo[1];
  const totalSupply = seriesInfo[2];
  const recordCount = seriesInfo[3];
  const cumulativeIndex = seriesInfo[4];
  const emergencyMode = seriesInfo[5];
  
  // Get treasury status
  const treasuryStatus = await bondSeries.getTreasuryStatus();
  const treasuryBalance = treasuryStatus[0];
  const requiredReserve = treasuryStatus[1];
  const withdrawable = treasuryStatus[2];
  
  // Get timing
  const lastRecordTime = await bondSeries.lastRecordTime();
  const nextRecordTime = await bondSeries.nextRecordTime();
  const lastDistributed = await bondSeries.lastDistributedRecord();
  
  const now = Math.floor(Date.now() / 1000);
  
  console.log("\n🏦 SERIES INFORMATION");
  console.log("-".repeat(60));
  console.log("Maturity Date:", new Date(Number(maturityDate) * 1000).toISOString());
  console.log("Status:", now >= Number(maturityDate) ? "✅ MATURED" : "⏳ ACTIVE");
  console.log("Emergency Mode:", emergencyMode ? "🚨 ENABLED" : "✅ Normal");
  
  console.log("\n💰 FINANCIAL STATUS");
  console.log("-".repeat(60));
  console.log("Total Deposited:", ethers.formatUnits(totalDeposited, 6), "USDC");
  console.log("Total BondToken Supply:", ethers.formatUnits(totalSupply, 6), "ABOND");
  console.log("Treasury Balance:", ethers.formatUnits(treasuryBalance, 6), "USDC");
  console.log("Required Reserve (30%):", ethers.formatUnits(requiredReserve, 6), "USDC");
  console.log("Owner Withdrawable:", ethers.formatUnits(withdrawable, 6), "USDC");
  
  console.log("\n📸 SNAPSHOT STATUS");
  console.log("-".repeat(60));
  console.log("Total Records:", recordCount.toString());
  console.log("Last Distributed Record:", lastDistributed.toString());
  console.log("Pending Distribution:", recordCount > lastDistributed ? "⚠️ YES" : "✅ No");
  console.log("Last Record Time:", new Date(Number(lastRecordTime) * 1000).toISOString());
  console.log("Next Record Time:", new Date(Number(nextRecordTime) * 1000).toISOString());
  console.log("Can Record Now:", now >= Number(nextRecordTime) ? "✅ Yes" : "⏳ Not yet");
  
  console.log("\n📈 COUPON INDEX");
  console.log("-".repeat(60));
  console.log("Cumulative Index:", ethers.formatUnits(cumulativeIndex, 6));
  console.log("Total Days Distributed:", Math.round(Number(ethers.formatUnits(cumulativeIndex, 6)) * 1000));
  
  console.log("\n👤 YOUR ACCOUNT");
  console.log("-".repeat(60));
  console.log("Address:", signer.address);
  
  const yourUSDC = await usdc.balanceOf(signer.address);
  const yourBond = await bondToken.balanceOf(signer.address);
  const yourClaimable = await bondSeries.claimableAmount(signer.address);
  const yourClaimedIndex = await bondSeries.claimedIndex(signer.address);
  
  console.log("USDC Balance:", ethers.formatUnits(yourUSDC, 6), "USDC");
  console.log("BondToken Balance:", ethers.formatUnits(yourBond, 6), "ABOND");
  console.log("Claimable Coupon:", ethers.formatUnits(yourClaimable, 6), "USDC");
  console.log("Your Claimed Index:", ethers.formatUnits(yourClaimedIndex, 6));
  
  if (yourBond > 0n) {
    const yourPrincipal = yourBond / BigInt(10); // 0.1 USDC per ABOND (both 6 decimals)
    console.log("Redeemable Principal:", ethers.formatUnits(yourPrincipal, 6), "USDC");
  }
  
  console.log("\n📝 NEXT STEPS");
  console.log("-".repeat(60));
  
  if (yourBond === 0n) {
    console.log("1. Mint USDC: npx hardhat run scripts/01-mintUSDC.ts --network arc");
    console.log("2. Deposit: npx hardhat run scripts/02-deposit.ts --network arc");
  } else {
    if (now >= Number(nextRecordTime)) {
      console.log("✅ You can record snapshot now!");
      console.log("   npx hardhat run scripts/03-recordSnapshot.ts --network arc");
    }
    
    if (recordCount > lastDistributed) {
      console.log("⚠️ Pending distribution - owner should distribute coupon!");
      console.log("   npx hardhat run scripts/04-distributeCoupon.ts --network arc");
    }
    
    if (yourClaimable > 0n) {
      console.log("💰 You can claim coupon now!");
      console.log("   npx hardhat run scripts/05-claimCoupon.ts --network arc");
    }
    
    if (now >= Number(maturityDate)) {
      console.log("🔄 You can redeem principal now!");
      console.log("   npx hardhat run scripts/06-redeem.ts --network arc");
    }
  }
  
  console.log("\n" + "=".repeat(60));
}

main().catch((error) => {
  console.error("❌ Error:", error);
  process.exitCode = 1;
});

