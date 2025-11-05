# 🗺️ ROADMAP - SIMPLE P2P MARKETPLACE (3 DAYS)

---

## 📋 OVERVIEW

**Tên:** ABondMarket (Simple P2P)  
**Model:** Giống OpenSea/Blur listing model  
**Complexity:** Low (4/10)  
**Time:** 2-3 days

**Core Features:**
- List ABOND for sale (với giá USDC)
- Cancel listing
- Buy ABOND từ listing
- View active listings

---

## DAY 1: SMART CONTRACT (6-8 hours)

### Morning: Design & Setup (4 hours)

**File structure:**
```
contracts/
├── ABondMarket.sol          # Main marketplace contract
└── test/
    └── ABondMarket.test.ts  # Unit tests
```

### Smart Contract - Full Implementation

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title ABondMarket
 * @notice Simple P2P marketplace for ABOND tokens
 * @dev Similar to NFT marketplace (OpenSea/Blur model)
 */
contract ABondMarket is ReentrancyGuard {
    using SafeERC20 for IERC20;
    
    // ==================== STATE ====================
    
    IERC20 public immutable abondToken;
    IERC20 public immutable usdcToken;
    
    struct Listing {
        uint256 listingId;
        address seller;
        uint256 abondAmount;     // Amount of ABOND for sale
        uint256 pricePerToken;   // USDC price per ABOND (6 decimals)
        uint256 totalPrice;      // Total USDC price
        uint256 createdAt;
        bool active;
    }
    
    uint256 public nextListingId;
    mapping(uint256 => Listing) public listings;
    
    // User's active listing IDs (for easy lookup)
    mapping(address => uint256[]) public userListings;
    
    // Optional: Platform fee (0.5% = 50 basis points)
    uint256 public constant FEE_RATE = 50; // 0.5%
    uint256 public constant FEE_DENOMINATOR = 10000;
    address public feeRecipient;
    
    // ==================== EVENTS ====================
    
    event Listed(
        uint256 indexed listingId,
        address indexed seller,
        uint256 abondAmount,
        uint256 pricePerToken,
        uint256 totalPrice,
        uint256 timestamp
    );
    
    event Bought(
        uint256 indexed listingId,
        address indexed buyer,
        address indexed seller,
        uint256 abondAmount,
        uint256 totalPrice,
        uint256 fee,
        uint256 timestamp
    );
    
    event Cancelled(
        uint256 indexed listingId,
        address indexed seller,
        uint256 timestamp
    );
    
    // ==================== ERRORS ====================
    
    error InvalidAmount();
    error InvalidPrice();
    error NotSeller();
    error ListingNotActive();
    error InsufficientPayment();
    
    // ==================== CONSTRUCTOR ====================
    
    constructor(
        address abondToken_,
        address usdcToken_,
        address feeRecipient_
    ) {
        abondToken = IERC20(abondToken_);
        usdcToken = IERC20(usdcToken_);
        feeRecipient = feeRecipient_;
    }
    
    // ==================== MAIN FUNCTIONS ====================
    
    /**
     * @notice Create a new listing
     * @param abondAmount Amount of ABOND to sell (18 decimals)
     * @param pricePerToken Price in USDC per ABOND (6 decimals)
     */
    function createListing(
        uint256 abondAmount,
        uint256 pricePerToken
    ) external nonReentrant returns (uint256 listingId) {
        if (abondAmount == 0) revert InvalidAmount();
        if (pricePerToken == 0) revert InvalidPrice();
        
        // Calculate total price (convert decimals: 18 -> 6)
        uint256 totalPrice = (abondAmount * pricePerToken) / 1e18;
        
        // Transfer ABOND to escrow
        abondToken.safeTransferFrom(msg.sender, address(this), abondAmount);
        
        // Create listing
        listingId = nextListingId++;
        listings[listingId] = Listing({
            listingId: listingId,
            seller: msg.sender,
            abondAmount: abondAmount,
            pricePerToken: pricePerToken,
            totalPrice: totalPrice,
            createdAt: block.timestamp,
            active: true
        });
        
        // Track user's listings
        userListings[msg.sender].push(listingId);
        
        emit Listed(
            listingId,
            msg.sender,
            abondAmount,
            pricePerToken,
            totalPrice,
            block.timestamp
        );
    }
    
    /**
     * @notice Buy ABOND from a listing
     * @param listingId ID of the listing to buy
     */
    function buyListing(uint256 listingId) external nonReentrant {
        Listing storage listing = listings[listingId];
        
        if (!listing.active) revert ListingNotActive();
        
        // Calculate fee
        uint256 fee = (listing.totalPrice * FEE_RATE) / FEE_DENOMINATOR;
        uint256 sellerAmount = listing.totalPrice - fee;
        
        // Mark as inactive
        listing.active = false;
        
        // Transfer USDC from buyer to seller (and fee)
        usdcToken.safeTransferFrom(msg.sender, listing.seller, sellerAmount);
        if (fee > 0) {
            usdcToken.safeTransferFrom(msg.sender, feeRecipient, fee);
        }
        
        // Transfer ABOND from escrow to buyer
        abondToken.safeTransfer(msg.sender, listing.abondAmount);
        
        emit Bought(
            listingId,
            msg.sender,
            listing.seller,
            listing.abondAmount,
            listing.totalPrice,
            fee,
            block.timestamp
        );
    }
    
    /**
     * @notice Cancel a listing and get ABOND back
     * @param listingId ID of the listing to cancel
     */
    function cancelListing(uint256 listingId) external nonReentrant {
        Listing storage listing = listings[listingId];
        
        if (listing.seller != msg.sender) revert NotSeller();
        if (!listing.active) revert ListingNotActive();
        
        // Mark as inactive
        listing.active = false;
        
        // Return ABOND to seller
        abondToken.safeTransfer(listing.seller, listing.abondAmount);
        
        emit Cancelled(listingId, msg.sender, block.timestamp);
    }
    
    // ==================== VIEW FUNCTIONS ====================
    
    /**
     * @notice Get all active listings
     * @return Array of active listing IDs
     */
    function getActiveListings() external view returns (uint256[] memory) {
        // Count active listings
        uint256 activeCount = 0;
        for (uint256 i = 0; i < nextListingId; i++) {
            if (listings[i].active) {
                activeCount++;
            }
        }
        
        // Build array
        uint256[] memory activeListings = new uint256[](activeCount);
        uint256 index = 0;
        for (uint256 i = 0; i < nextListingId; i++) {
            if (listings[i].active) {
                activeListings[index] = i;
                index++;
            }
        }
        
        return activeListings;
    }
    
    /**
     * @notice Get user's active listings
     */
    function getUserListings(address user) external view returns (uint256[] memory) {
        uint256[] storage allUserListings = userListings[user];
        
        // Count active
        uint256 activeCount = 0;
        for (uint256 i = 0; i < allUserListings.length; i++) {
            if (listings[allUserListings[i]].active) {
                activeCount++;
            }
        }
        
        // Build array
        uint256[] memory activeUserListings = new uint256[](activeCount);
        uint256 index = 0;
        for (uint256 i = 0; i < allUserListings.length; i++) {
            uint256 listingId = allUserListings[i];
            if (listings[listingId].active) {
                activeUserListings[index] = listingId;
                index++;
            }
        }
        
        return activeUserListings;
    }
    
    /**
     * @notice Get listing details
     */
    function getListing(uint256 listingId) external view returns (Listing memory) {
        return listings[listingId];
    }
}
```

---

### Afternoon: Testing (3 hours)

**File:** `test/ABondMarket.test.ts`

```typescript
import { expect } from "chai";
import { ethers } from "hardhat";

describe("ABondMarket", function () {
  let market, abond, usdc;
  let owner, seller, buyer;
  
  beforeEach(async function () {
    [owner, seller, buyer] = await ethers.getSigners();
    
    // Deploy tokens
    const ABOND = await ethers.getContractFactory("BondToken");
    abond = await ABOND.deploy("ABOND", "ABOND", owner.address);
    
    const USDC = await ethers.getContractFactory("contracts/IERC20.sol:IERC20");
    usdc = await USDC.deploy();
    
    // Deploy market
    const Market = await ethers.getContractFactory("ABondMarket");
    market = await Market.deploy(
      await abond.getAddress(),
      await usdc.getAddress(),
      owner.address
    );
    
    // Setup: mint tokens
    await abond.mint(seller.address, ethers.parseEther("100"));
    await usdc.mint(buyer.address, ethers.parseUnits("1000", 6));
  });
  
  describe("Create Listing", function () {
    it("Should create listing successfully", async function () {
      const amount = ethers.parseEther("10"); // 10 ABOND
      const price = ethers.parseUnits("0.1", 6); // 0.1 USDC per ABOND
      
      // Approve
      await abond.connect(seller).approve(await market.getAddress(), amount);
      
      // Create listing
      await expect(market.connect(seller).createListing(amount, price))
        .to.emit(market, "Listed");
      
      // Check listing
      const listing = await market.getListing(0);
      expect(listing.seller).to.equal(seller.address);
      expect(listing.abondAmount).to.equal(amount);
      expect(listing.pricePerToken).to.equal(price);
      expect(listing.active).to.be.true;
    });
    
    it("Should revert with zero amount", async function () {
      const price = ethers.parseUnits("0.1", 6);
      await expect(
        market.connect(seller).createListing(0, price)
      ).to.be.revertedWithCustomError(market, "InvalidAmount");
    });
    
    it("Should revert with zero price", async function () {
      const amount = ethers.parseEther("10");
      await expect(
        market.connect(seller).createListing(amount, 0)
      ).to.be.revertedWithCustomError(market, "InvalidPrice");
    });
  });
  
  describe("Buy Listing", function () {
    beforeEach(async function () {
      // Create a listing
      const amount = ethers.parseEther("10");
      const price = ethers.parseUnits("0.1", 6);
      await abond.connect(seller).approve(await market.getAddress(), amount);
      await market.connect(seller).createListing(amount, price);
    });
    
    it("Should buy listing successfully", async function () {
      const listing = await market.getListing(0);
      const totalPrice = listing.totalPrice;
      
      // Approve USDC
      await usdc.connect(buyer).approve(await market.getAddress(), totalPrice);
      
      // Buy
      await expect(market.connect(buyer).buyListing(0))
        .to.emit(market, "Bought");
      
      // Check balances
      expect(await abond.balanceOf(buyer.address)).to.equal(ethers.parseEther("10"));
      
      // Check listing is inactive
      const updatedListing = await market.getListing(0);
      expect(updatedListing.active).to.be.false;
    });
    
    it("Should transfer correct amounts with fee", async function () {
      const listing = await market.getListing(0);
      const totalPrice = listing.totalPrice;
      const fee = (totalPrice * 50n) / 10000n; // 0.5%
      const sellerAmount = totalPrice - fee;
      
      await usdc.connect(buyer).approve(await market.getAddress(), totalPrice);
      
      const sellerBalanceBefore = await usdc.balanceOf(seller.address);
      const feeRecipientBalanceBefore = await usdc.balanceOf(owner.address);
      
      await market.connect(buyer).buyListing(0);
      
      const sellerBalanceAfter = await usdc.balanceOf(seller.address);
      const feeRecipientBalanceAfter = await usdc.balanceOf(owner.address);
      
      expect(sellerBalanceAfter - sellerBalanceBefore).to.equal(sellerAmount);
      expect(feeRecipientBalanceAfter - feeRecipientBalanceBefore).to.equal(fee);
    });
    
    it("Should revert when buying inactive listing", async function () {
      // Buy once
      const totalPrice = (await market.getListing(0)).totalPrice;
      await usdc.connect(buyer).approve(await market.getAddress(), totalPrice);
      await market.connect(buyer).buyListing(0);
      
      // Try to buy again
      await expect(
        market.connect(buyer).buyListing(0)
      ).to.be.revertedWithCustomError(market, "ListingNotActive");
    });
  });
  
  describe("Cancel Listing", function () {
    beforeEach(async function () {
      const amount = ethers.parseEther("10");
      const price = ethers.parseUnits("0.1", 6);
      await abond.connect(seller).approve(await market.getAddress(), amount);
      await market.connect(seller).createListing(amount, price);
    });
    
    it("Should cancel listing successfully", async function () {
      const sellerBalanceBefore = await abond.balanceOf(seller.address);
      
      await expect(market.connect(seller).cancelListing(0))
        .to.emit(market, "Cancelled");
      
      // Check ABOND returned
      const sellerBalanceAfter = await abond.balanceOf(seller.address);
      expect(sellerBalanceAfter - sellerBalanceBefore).to.equal(ethers.parseEther("10"));
      
      // Check listing is inactive
      const listing = await market.getListing(0);
      expect(listing.active).to.be.false;
    });
    
    it("Should revert when non-seller tries to cancel", async function () {
      await expect(
        market.connect(buyer).cancelListing(0)
      ).to.be.revertedWithCustomError(market, "NotSeller");
    });
    
    it("Should revert when cancelling inactive listing", async function () {
      await market.connect(seller).cancelListing(0);
      
      await expect(
        market.connect(seller).cancelListing(0)
      ).to.be.revertedWithCustomError(market, "ListingNotActive");
    });
  });
  
  describe("View Functions", function () {
    it("Should return active listings", async function () {
      // Create 3 listings
      const amount = ethers.parseEther("10");
      const price = ethers.parseUnits("0.1", 6);
      
      await abond.mint(seller.address, ethers.parseEther("100"));
      await abond.connect(seller).approve(await market.getAddress(), ethers.parseEther("30"));
      
      await market.connect(seller).createListing(amount, price);
      await market.connect(seller).createListing(amount, price);
      await market.connect(seller).createListing(amount, price);
      
      // Check active listings
      const activeListings = await market.getActiveListings();
      expect(activeListings.length).to.equal(3);
      
      // Cancel one
      await market.connect(seller).cancelListing(1);
      
      // Check again
      const updatedListings = await market.getActiveListings();
      expect(updatedListings.length).to.equal(2);
    });
    
    it("Should return user's listings", async function () {
      const amount = ethers.parseEther("10");
      const price = ethers.parseUnits("0.1", 6);
      
      await abond.mint(seller.address, ethers.parseEther("100"));
      await abond.connect(seller).approve(await market.getAddress(), ethers.parseEther("20"));
      
      await market.connect(seller).createListing(amount, price);
      await market.connect(seller).createListing(amount, price);
      
      const userListings = await market.getUserListings(seller.address);
      expect(userListings.length).to.equal(2);
    });
  });
});
```

**Run tests:**
```bash
npx hardhat test
```

---

### Evening: Review & Optimize (1 hour)

**Checklist:**
- ✅ All tests passing
- ✅ Gas optimization checked
- ✅ Security review (reentrancy, overflow, etc.)
- ✅ Events properly emitted
- ✅ Error handling complete

---

## DAY 2: DEPLOYMENT & SCRIPTS (4-6 hours)

### Morning: Deploy Script (3 hours)

**File:** `scripts/deployMarket.ts`

```typescript
import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";
import hre from "hardhat";

async function main() {
  console.log("🚀 Deploying ABondMarket...\n");
  
  const [deployer] = await ethers.getSigners();
  console.log("📍 Deployer:", deployer.address);
  
  const network = await ethers.provider.getNetwork();
  const chainId = Number(network.chainId);
  console.log("📍 Network:", network.name, `(Chain ID: ${chainId})\n`);
  
  // Get deployed addresses from bond-system
  const bondSystemPath = path.join(__dirname, "../deployments/bond-system.json");
  const bondSystem = JSON.parse(fs.readFileSync(bondSystemPath, "utf-8"));
  
  const ABOND_ADDRESS = bondSystem[chainId].contracts.BondToken.address;
  const USDC_ADDRESS = bondSystem[chainId].contracts.USDC.address;
  const FEE_RECIPIENT = deployer.address; // Can change later
  
  console.log("📋 Using contracts:");
  console.log("   ABOND:", ABOND_ADDRESS);
  console.log("   USDC:", USDC_ADDRESS);
  console.log("   Fee Recipient:", FEE_RECIPIENT);
  console.log("");
  
  // Deploy market
  console.log("⏳ Deploying ABondMarket...");
  const Market = await ethers.getContractFactory("ABondMarket");
  const market = await Market.deploy(
    ABOND_ADDRESS,
    USDC_ADDRESS,
    FEE_RECIPIENT
  );
  await market.waitForDeployment();
  
  const marketAddress = await market.getAddress();
  console.log("✅ ABondMarket deployed:", marketAddress);
  console.log("");
  
  // Save deployment
  const deploymentData: any = {
    [chainId]: {
      chainId,
      chainName: network.name,
      deployedAt: new Date().toISOString(),
      marketAddress,
      abondAddress: ABOND_ADDRESS,
      usdcAddress: USDC_ADDRESS,
      feeRecipient: FEE_RECIPIENT,
      feeRate: "0.5%"
    }
  };
  
  // Save ABI
  deploymentData.abi = (await hre.artifacts.readArtifact("ABondMarket")).abi;
  
  const outDir = path.join(__dirname, "../deployments");
  const deploymentPath = path.join(outDir, "market.json");
  fs.writeFileSync(deploymentPath, JSON.stringify(deploymentData, null, 2));
  
  console.log("✅ Deployment saved to deployments/market.json");
  console.log("");
  
  console.log("=" .repeat(60));
  console.log("🎉 ABondMarket Deployed Successfully!");
  console.log("=" .repeat(60));
  console.log("");
  console.log("📋 Summary:");
  console.log("   Market:      ", marketAddress);
  console.log("   ABOND:       ", ABOND_ADDRESS);
  console.log("   USDC:        ", USDC_ADDRESS);
  console.log("   Fee:         ", "0.5%");
  console.log("");
  console.log("🔗 Explorer:");
  console.log("   https://testnet.arcscan.app/address/" + marketAddress);
  console.log("");
  console.log("📝 Next Steps:");
  console.log("   1. Users can create listings");
  console.log("   2. Test with: npx hardhat run scripts/market/createListing.ts --network arc");
  console.log("");
}

main().catch((error) => {
  console.error("❌ Deployment failed:", error);
  process.exitCode = 1;
});
```

**Deploy to Arc testnet:**
```bash
npx hardhat run scripts/deployMarket.ts --network arc
```

---

### Afternoon: Interaction Scripts (3 hours)

**File:** `scripts/market/createListing.ts`

```typescript
import { ethers } from "hardhat";
import { getDeployedAddresses } from "../utils/getAddresses";
import * as fs from "fs";
import * as path from "path";

async function main() {
  console.log("📝 Creating Listing...\n");
  
  const [signer] = await ethers.getSigners();
  console.log("📍 Your address:", signer.address);
  
  // Get addresses
  const bondAddresses = await getDeployedAddresses();
  const marketPath = path.join(__dirname, "../../deployments/market.json");
  const marketData = JSON.parse(fs.readFileSync(marketPath, "utf-8"));
  
  const network = await ethers.provider.getNetwork();
  const chainId = Number(network.chainId);
  
  const MARKET_ADDRESS = marketData[chainId].marketAddress;
  const ABOND_ADDRESS = bondAddresses.BOND_TOKEN_ADDRESS;
  
  // Get contracts
  const market = await ethers.getContractAt("ABondMarket", MARKET_ADDRESS);
  const abond = await ethers.getContractAt("BondToken", ABOND_ADDRESS);
  
  // Listing parameters (CHANGE THESE)
  const AMOUNT = "10"; // 10 ABOND
  const PRICE_PER_TOKEN = "0.095"; // 0.095 USDC per ABOND (5% discount from 0.1 face value)
  
  const amount = ethers.parseEther(AMOUNT);
  const pricePerToken = ethers.parseUnits(PRICE_PER_TOKEN, 6);
  const totalPrice = (BigInt(AMOUNT) * BigInt(pricePerToken)) / BigInt(1e12);
  
  console.log("📊 Listing Details:");
  console.log("   Amount:", AMOUNT, "ABOND");
  console.log("   Price per Token:", PRICE_PER_TOKEN, "USDC");
  console.log("   Total Price:", ethers.formatUnits(totalPrice, 6), "USDC");
  console.log("");
  
  // Check balance
  const balance = await abond.balanceOf(signer.address);
  console.log("💼 Your ABOND balance:", ethers.formatEther(balance), "ABOND");
  
  if (balance < amount) {
    console.log("❌ Insufficient ABOND balance!");
    return;
  }
  
  // Approve
  console.log("\n⏳ Approving ABOND...");
  const approveTx = await abond.approve(MARKET_ADDRESS, amount);
  await approveTx.wait();
  console.log("✅ Approved");
  
  // Create listing
  console.log("\n⏳ Creating listing...");
  const tx = await market.createListing(amount, pricePerToken);
  const receipt = await tx.wait();
  console.log("✅ Listing created!");
  
  // Get listing ID from event
  const event = receipt.logs.find((log: any) => {
    try {
      return market.interface.parseLog(log)?.name === 'Listed';
    } catch {
      return false;
    }
  });
  
  if (event) {
    const parsed = market.interface.parseLog(event);
    console.log("\n📋 Listing ID:", parsed?.args.listingId.toString());
  }
  
  console.log("\n🔗 Transaction:", receipt.hash);
  console.log("🔗 Explorer: https://testnet.arcscan.app/tx/" + receipt.hash);
  console.log("");
  console.log("✅ Done! Your ABOND is now listed for sale.");
}

main().catch((error) => {
  console.error("❌ Error:", error);
  process.exitCode = 1;
});
```

---

**File:** `scripts/market/viewListings.ts`

```typescript
import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  console.log("📊 Viewing Active Listings...\n");
  
  const marketPath = path.join(__dirname, "../../deployments/market.json");
  const marketData = JSON.parse(fs.readFileSync(marketPath, "utf-8"));
  
  const network = await ethers.provider.getNetwork();
  const chainId = Number(network.chainId);
  const MARKET_ADDRESS = marketData[chainId].marketAddress;
  
  const market = await ethers.getContractAt("ABondMarket", MARKET_ADDRESS);
  
  // Get active listings
  const activeListingIds = await market.getActiveListings();
  
  if (activeListingIds.length === 0) {
    console.log("No active listings found.");
    return;
  }
  
  console.log(`Found ${activeListingIds.length} active listing(s):\n`);
  console.log("=" .repeat(80));
  
  for (const id of activeListingIds) {
    const listing = await market.getListing(id);
    
    console.log(`\nListing #${id}`);
    console.log("-" .repeat(80));
    console.log("Seller:         ", listing.seller);
    console.log("Amount:         ", ethers.formatEther(listing.abondAmount), "ABOND");
    console.log("Price per Token:", ethers.formatUnits(listing.pricePerToken, 6), "USDC");
    console.log("Total Price:    ", ethers.formatUnits(listing.totalPrice, 6), "USDC");
    console.log("Created:        ", new Date(Number(listing.createdAt) * 1000).toLocaleString());
    console.log("Active:         ", listing.active ? "✅ Yes" : "❌ No");
  }
  
  console.log("\n" + "=" .repeat(80));
}

main().catch(console.error);
```

---

**File:** `scripts/market/buyListing.ts`

```typescript
import { ethers } from "hardhat";
import { getDeployedAddresses } from "../utils/getAddresses";
import * as fs from "fs";
import * as path from "path";

async function main() {
  console.log("💰 Buying Listing...\n");
  
  const [signer] = await ethers.getSigners();
  console.log("📍 Your address:", signer.address);
  
  // Get addresses
  const bondAddresses = await getDeployedAddresses();
  const marketPath = path.join(__dirname, "../../deployments/market.json");
  const marketData = JSON.parse(fs.readFileSync(marketPath, "utf-8"));
  
  const network = await ethers.provider.getNetwork();
  const chainId = Number(network.chainId);
  
  const MARKET_ADDRESS = marketData[chainId].marketAddress;
  const USDC_ADDRESS = bondAddresses.USDC_ADDRESS;
  
  // Get contracts
  const market = await ethers.getContractAt("ABondMarket", MARKET_ADDRESS);
  const usdc = await ethers.getContractAt("contracts/IERC20.sol:IERC20", USDC_ADDRESS);
  
  // CHANGE THIS - Listing ID to buy
  const LISTING_ID = 0;
  
  // Get listing details
  const listing = await market.getListing(LISTING_ID);
  
  if (!listing.active) {
    console.log("❌ Listing is not active!");
    return;
  }
  
  console.log("📋 Listing Details:");
  console.log("   Seller:", listing.seller);
  console.log("   Amount:", ethers.formatEther(listing.abondAmount), "ABOND");
  console.log("   Price per Token:", ethers.formatUnits(listing.pricePerToken, 6), "USDC");
  console.log("   Total Price:", ethers.formatUnits(listing.totalPrice, 6), "USDC");
  console.log("");
  
  // Check USDC balance
  const balance = await usdc.balanceOf(signer.address);
  console.log("💼 Your USDC balance:", ethers.formatUnits(balance, 6), "USDC");
  
  if (balance < listing.totalPrice) {
    console.log("❌ Insufficient USDC balance!");
    return;
  }
  
  // Approve USDC
  console.log("\n⏳ Approving USDC...");
  const approveTx = await usdc.approve(MARKET_ADDRESS, listing.totalPrice);
  await approveTx.wait();
  console.log("✅ Approved");
  
  // Buy listing
  console.log("\n⏳ Buying listing...");
  const tx = await market.buyListing(LISTING_ID);
  const receipt = await tx.wait();
  console.log("✅ Purchase successful!");
  
  console.log("\n🔗 Transaction:", receipt.hash);
  console.log("🔗 Explorer: https://testnet.arcscan.app/tx/" + receipt.hash);
  console.log("");
  console.log("✅ Done! You now own the ABOND tokens.");
}

main().catch((error) => {
  console.error("❌ Error:", error);
  process.exitCode = 1;
});
```

---

## DAY 3: FRONTEND (8-10 hours)

### Morning: Setup & Components (4 hours)

**Project Structure:**
```
frontend/src/
├── components/
│   └── market/
│       ├── ListingCard.tsx      # Display một listing
│       ├── ListingForm.tsx      # Form tạo listing
│       ├── ListingList.tsx      # List tất cả listings
│       └── MyListings.tsx       # User's own listings
├── hooks/
│   ├── useMarket.ts             # Market contract interactions
│   └── useListings.ts           # Fetch & manage listings
├── config/
│   └── marketContracts.ts       # Market contract config
└── app/
    ├── market/
    │   └── page.tsx             # Main marketplace page
    └── my-listings/
        └── page.tsx             # User's listings page
```

---

### Config File

**File:** `frontend/src/config/marketContracts.ts`

```typescript
// Load from deployments
import marketDeployment from '../../../contracts/deployments/market.json';

const CHAIN_ID = 5042002; // Arc Testnet

export const MARKET_ADDRESS = marketDeployment[CHAIN_ID].marketAddress as `0x${string}`;
export const MARKET_ABI = marketDeployment.abi;

// Re-export from bond contracts
export { ABOND_ADDRESS, USDC_ADDRESS } from './bondContracts';
```

---

### Hooks

**File:** `frontend/src/hooks/useListings.ts`

```typescript
"use client";

import { useReadContract } from "wagmi";
import { MARKET_ABI, MARKET_ADDRESS } from "@/config/marketContracts";

export function useListings() {
  // Get active listing IDs
  const { data: listingIds, isLoading: idsLoading, refetch } = useReadContract({
    address: MARKET_ADDRESS,
    abi: MARKET_ABI,
    functionName: "getActiveListings",
  });
  
  return {
    listingIds: listingIds as bigint[] | undefined,
    isLoading: idsLoading,
    refetch
  };
}

export function useListing(listingId: bigint | undefined) {
  const { data: listing, isLoading } = useReadContract({
    address: MARKET_ADDRESS,
    abi: MARKET_ABI,
    functionName: "getListing",
    args: listingId !== undefined ? [listingId] : undefined,
  });
  
  return {
    listing: listing as any,
    isLoading
  };
}

export function useMyListings(address: `0x${string}` | undefined) {
  const { data: listingIds, isLoading, refetch } = useReadContract({
    address: MARKET_ADDRESS,
    abi: MARKET_ABI,
    functionName: "getUserListings",
    args: address ? [address] : undefined,
  });
  
  return {
    listingIds: listingIds as bigint[] | undefined,
    isLoading,
    refetch
  };
}
```

---

### Components

**File:** `frontend/src/components/market/ListingCard.tsx`

```typescript
"use client";

import { useState } from "react";
import { formatUnits } from "viem";
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { MARKET_ABI, MARKET_ADDRESS, USDC_ADDRESS } from "@/config/marketContracts";
import toast from "react-hot-toast";

interface Listing {
  listingId: bigint;
  seller: string;
  abondAmount: bigint;
  pricePerToken: bigint;
  totalPrice: bigint;
  createdAt: bigint;
  active: boolean;
}

export function ListingCard({ listing, onUpdate }: { 
  listing: Listing;
  onUpdate?: () => void;
}) {
  const { address } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>();
  const [isApproving, setIsApproving] = useState(false);
  const [isBuying, setIsBuying] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  
  const { isLoading: isConfirming } = useWaitForTransactionReceipt({
    hash: txHash,
  });
  
  const isOwner = address?.toLowerCase() === listing.seller.toLowerCase();
  
  const handleBuy = async () => {
    if (!address) return;
    
    try {
      setIsApproving(true);
      
      // 1. Approve USDC
      const approveHash = await writeContractAsync({
        address: USDC_ADDRESS,
        abi: [
          {
            name: "approve",
            type: "function",
            stateMutability: "nonpayable",
            inputs: [
              { name: "spender", type: "address" },
              { name: "amount", type: "uint256" }
            ],
            outputs: [{ type: "bool" }]
          }
        ],
        functionName: "approve",
        args: [MARKET_ADDRESS, listing.totalPrice]
      });
      
      setTxHash(approveHash);
      toast.success("USDC approved!");
      
      setIsApproving(false);
      setIsBuying(true);
      
      // 2. Buy listing
      const buyHash = await writeContractAsync({
        address: MARKET_ADDRESS,
        abi: MARKET_ABI,
        functionName: "buyListing",
        args: [listing.listingId]
      });
      
      setTxHash(buyHash);
      toast.success("Purchase successful!");
      
      if (onUpdate) onUpdate();
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Transaction failed");
    } finally {
      setIsApproving(false);
      setIsBuying(false);
    }
  };
  
  const handleCancel = async () => {
    try {
      setIsCancelling(true);
      
      const hash = await writeContractAsync({
        address: MARKET_ADDRESS,
        abi: MARKET_ABI,
        functionName: "cancelListing",
        args: [listing.listingId]
      });
      
      setTxHash(hash);
      toast.success("Listing cancelled!");
      
      if (onUpdate) onUpdate();
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Transaction failed");
    } finally {
      setIsCancelling(false);
    }
  };
  
  const pricePerToken = formatUnits(listing.pricePerToken, 6);
  const amount = formatUnits(listing.abondAmount, 18);
  const total = formatUnits(listing.totalPrice, 6);
  const createdDate = new Date(Number(listing.createdAt) * 1000);
  
  return (
    <div className="p-6 border border-gray-700 rounded-lg bg-gray-800 hover:border-gray-600 transition-colors">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-2xl font-bold text-white">{amount} ABOND</h3>
          <p className="text-gray-400 text-sm mt-1">
            {pricePerToken} USDC per token
          </p>
        </div>
        <div className="text-right">
          <p className="text-xl font-bold text-green-400">{total} USDC</p>
          <p className="text-xs text-gray-500 mt-1">Total Price</p>
        </div>
      </div>
      
      <div className="text-sm text-gray-500 mb-4 space-y-1">
        <p>Seller: {listing.seller.slice(0, 6)}...{listing.seller.slice(-4)}</p>
        <p>Listed: {createdDate.toLocaleString()}</p>
      </div>
      
      {isOwner ? (
        <button
          onClick={handleCancel}
          disabled={isCancelling || isConfirming}
          className="w-full py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed rounded font-semibold transition-colors"
        >
          {isCancelling || isConfirming ? "Cancelling..." : "Cancel Listing"}
        </button>
      ) : (
        <button
          onClick={handleBuy}
          disabled={isApproving || isBuying || isConfirming}
          className="w-full py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded font-semibold transition-colors"
        >
          {isApproving ? "Approving..." : isBuying || isConfirming ? "Buying..." : "Buy Now"}
        </button>
      )}
      
      {txHash && (
        <a
          href={`https://testnet.arcscan.app/tx/${txHash}`}
          target="_blank"
          rel="noopener noreferrer"
          className="block text-center text-sm text-blue-400 hover:text-blue-300 mt-2"
        >
          View Transaction →
        </a>
      )}
    </div>
  );
}
```

---

**File:** `frontend/src/components/market/ListingForm.tsx`

```typescript
"use client";

import { useState } from "react";
import { parseEther, parseUnits } from "viem";
import { useAccount, useWriteContract, useReadContract, useWaitForTransactionReceipt } from "wagmi";
import { MARKET_ABI, MARKET_ADDRESS, ABOND_ADDRESS } from "@/config/marketContracts";
import toast from "react-hot-toast";

export function ListingForm({ onSuccess }: { onSuccess?: () => void }) {
  const { address } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const [amount, setAmount] = useState("");
  const [price, setPrice] = useState("");
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>();
  const [isApproving, setIsApproving] = useState(false);
  const [isListing, setIsListing] = useState(false);
  
  const { isLoading: isConfirming } = useWaitForTransactionReceipt({
    hash: txHash,
  });
  
  // Get ABOND balance
  const { data: balance } = useReadContract({
    address: ABOND_ADDRESS,
    abi: [
      {
        name: "balanceOf",
        type: "function",
        stateMutability: "view",
        inputs: [{ name: "account", type: "address" }],
        outputs: [{ type: "uint256" }]
      }
    ],
    functionName: "balanceOf",
    args: address ? [address] : undefined,
  });
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!amount || !price || !address) {
      toast.error("Please fill all fields");
      return;
    }
    
    try {
      const abondAmount = parseEther(amount);
      const pricePerToken = parseUnits(price, 6);
      
      setIsApproving(true);
      
      // 1. Approve ABOND
      const approveHash = await writeContractAsync({
        address: ABOND_ADDRESS,
        abi: [
          {
            name: "approve",
            type: "function",
            stateMutability: "nonpayable",
            inputs: [
              { name: "spender", type: "address" },
              { name: "amount", type: "uint256" }
            ],
            outputs: [{ type: "bool" }]
          }
        ],
        functionName: "approve",
        args: [MARKET_ADDRESS, abondAmount]
      });
      
      setTxHash(approveHash);
      toast.success("ABOND approved!");
      
      setIsApproving(false);
      setIsListing(true);
      
      // 2. Create listing
      const listingHash = await writeContractAsync({
        address: MARKET_ADDRESS,
        abi: MARKET_ABI,
        functionName: "createListing",
        args: [abondAmount, pricePerToken]
      });
      
      setTxHash(listingHash);
      toast.success("Listing created!");
      
      // Reset form
      setAmount("");
      setPrice("");
      
      if (onSuccess) onSuccess();
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Transaction failed");
    } finally {
      setIsApproving(false);
      setIsListing(false);
    }
  };
  
  const totalPrice = amount && price ? 
    (parseFloat(amount) * parseFloat(price)).toFixed(6) : "0";
  
  const balanceFormatted = balance ? 
    (Number(balance) / 1e18).toFixed(2) : "0";
  
  return (
    <form onSubmit={handleSubmit} className="p-6 bg-gray-800 rounded-lg border border-gray-700">
      <h3 className="text-xl font-bold mb-4 text-white">Sell ABOND</h3>
      
      <div className="mb-4">
        <label className="block text-sm mb-2 text-gray-300">
          Amount (ABOND)
        </label>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500"
          placeholder="10"
          step="0.01"
          min="0"
        />
        <p className="text-xs text-gray-500 mt-1">
          Balance: {balanceFormatted} ABOND
        </p>
      </div>
      
      <div className="mb-4">
        <label className="block text-sm mb-2 text-gray-300">
          Price per Token (USDC)
        </label>
        <input
          type="number"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500"
          placeholder="0.095"
          step="0.001"
          min="0"
        />
        <p className="text-xs text-gray-500 mt-1">
          Face value: 0.1 USDC (suggest 5-10% discount)
        </p>
      </div>
      
      <div className="mb-4 p-3 bg-gray-700 rounded">
        <p className="text-sm text-gray-400">Total you'll receive (minus 0.5% fee):</p>
        <p className="text-2xl font-bold text-green-400">{totalPrice} USDC</p>
      </div>
      
      <button
        type="submit"
        disabled={!amount || !price || isApproving || isListing || isConfirming}
        className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded font-semibold transition-colors"
      >
        {isApproving ? "Approving..." : isListing || isConfirming ? "Creating..." : "Create Listing"}
      </button>
      
      {txHash && (
        <a
          href={`https://testnet.arcscan.app/tx/${txHash}`}
          target="_blank"
          rel="noopener noreferrer"
          className="block text-center text-sm text-blue-400 hover:text-blue-300 mt-2"
        >
          View Transaction →
        </a>
      )}
    </form>
  );
}
```

---

**File:** `frontend/src/components/market/ListingList.tsx`

```typescript
"use client";

import { useListings, useListing } from "@/hooks/useListings";
import { ListingCard } from "./ListingCard";

export function ListingList() {
  const { listingIds, isLoading, refetch } = useListings();
  
  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
        <p className="text-gray-400 mt-4">Loading listings...</p>
      </div>
    );
  }
  
  if (!listingIds || listingIds.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-800 rounded-lg border border-gray-700">
        <p className="text-gray-400 text-lg">No active listings</p>
        <p className="text-gray-500 text-sm mt-2">Be the first to list ABOND for sale!</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      {listingIds.map((id) => (
        <ListingItem key={id.toString()} listingId={id} onUpdate={refetch} />
      ))}
    </div>
  );
}

function ListingItem({ listingId, onUpdate }: { 
  listingId: bigint;
  onUpdate: () => void;
}) {
  const { listing, isLoading } = useListing(listingId);
  
  if (isLoading || !listing) {
    return (
      <div className="p-6 bg-gray-800 rounded-lg border border-gray-700 animate-pulse">
        <div className="h-20 bg-gray-700 rounded"></div>
      </div>
    );
  }
  
  return <ListingCard listing={listing} onUpdate={onUpdate} />;
}
```

---

### Afternoon: Main Pages (4 hours)

**File:** `frontend/src/app/market/page.tsx`

```typescript
"use client";

import { ListingList } from "@/components/market/ListingList";
import { ListingForm } from "@/components/market/ListingForm";
import { useAccount } from "wagmi";
import Link from "next/link";

export default function MarketplacePage() {
  const { isConnected } = useAccount();
  
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold text-white">ABOND Marketplace</h1>
          <p className="text-gray-400 mt-2">Buy and sell ABOND tokens before maturity</p>
        </div>
        <Link
          href="/my-listings"
          className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
        >
          My Listings
        </Link>
      </div>
      
      {!isConnected ? (
        <div className="text-center py-12 bg-gray-800 rounded-lg border border-gray-700">
          <p className="text-gray-400 text-lg mb-4">Connect your wallet to access the marketplace</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Listings */}
          <div className="lg:col-span-2">
            <h2 className="text-2xl font-bold mb-4 text-white">Active Listings</h2>
            <ListingList />
          </div>
          
          {/* Sell Form */}
          <div className="lg:col-span-1">
            <div className="sticky top-4">
              <ListingForm />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
```

---

**File:** `frontend/src/app/my-listings/page.tsx`

```typescript
"use client";

import { useAccount } from "wagmi";
import { useMyListings, useListing } from "@/hooks/useListings";
import { ListingCard } from "@/components/market/ListingCard";
import Link from "next/link";

export default function MyListingsPage() {
  const { address, isConnected } = useAccount();
  const { listingIds, isLoading, refetch } = useMyListings(address);
  
  if (!isConnected) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center py-12 bg-gray-800 rounded-lg border border-gray-700">
          <p className="text-gray-400 text-lg">Connect your wallet to view your listings</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold text-white">My Listings</h1>
        <Link
          href="/market"
          className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
        >
          ← Back to Market
        </Link>
      </div>
      
      {isLoading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="text-gray-400 mt-4">Loading your listings...</p>
        </div>
      ) : !listingIds || listingIds.length === 0 ? (
        <div className="text-center py-12 bg-gray-800 rounded-lg border border-gray-700">
          <p className="text-gray-400 text-lg">You don't have any listings yet</p>
          <Link
            href="/market"
            className="inline-block mt-4 px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            Create Your First Listing
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {listingIds.map((id) => (
            <ListingItem key={id.toString()} listingId={id} onUpdate={refetch} />
          ))}
        </div>
      )}
    </div>
  );
}

function ListingItem({ listingId, onUpdate }: { 
  listingId: bigint;
  onUpdate: () => void;
}) {
  const { listing, isLoading } = useListing(listingId);
  
  if (isLoading || !listing) {
    return (
      <div className="p-6 bg-gray-800 rounded-lg border border-gray-700 animate-pulse">
        <div className="h-20 bg-gray-700 rounded"></div>
      </div>
    );
  }
  
  return <ListingCard listing={listing} onUpdate={onUpdate} />;
}
```

---

## 📊 TIMELINE SUMMARY

### **Day 1: Smart Contract (6-8 hours)**
- ✅ Morning (4h): Write ABondMarket.sol
- ✅ Afternoon (3h): Unit tests
- ✅ Evening (1h): Review & optimize

### **Day 2: Deploy & Scripts (4-6 hours)**
- ✅ Morning (3h): Deploy script + deploy to testnet
- ✅ Afternoon (3h): Interaction scripts

### **Day 3: Frontend (8-10 hours)**
- ✅ Morning (4h): Components structure
- ✅ Afternoon (4h): Pages & integration
- ✅ Evening (2h): Testing & polish

---

## 🎯 DELIVERABLES

### **Smart Contract:**
- ✅ ABondMarket.sol (~250 lines)
- ✅ Unit tests (>90% coverage)
- ✅ Deployed on Arc testnet
- ✅ Gas optimized

### **Scripts:**
- ✅ Deploy script
- ✅ Create listing script
- ✅ View listings script
- ✅ Buy listing script

### **Frontend:**
- ✅ Marketplace page (`/market`)
- ✅ My listings page (`/my-listings`)
- ✅ Create listing form
- ✅ Listing cards (buy/cancel)
- ✅ Real-time updates
- ✅ Transaction tracking

---

## 🚀 TESTING CHECKLIST

### **Smart Contract Tests:**
- [ ] Create listing works
- [ ] Buy listing works
- [ ] Cancel listing works
- [ ] Fee calculation correct
- [ ] View functions work
- [ ] Revert cases handled
- [ ] Events emitted correctly

### **Frontend Tests:**
- [ ] Connect wallet
- [ ] View all listings
- [ ] Create new listing
- [ ] Buy listing
- [ ] Cancel own listing
- [ ] View my listings
- [ ] Transaction confirmations

---

## 💡 NEXT STEPS (Optional Enhancements)

### **Week 2 (Additional Features):**
- Add filters (price range, amount)
- Add sorting (price, newest, oldest)
- Add search by seller address
- Add listing history
- Add price chart
- Add notifications (email/webhook)

### **Week 3 (Advanced Features):**
- Partial fills (buy partial amount)
- Offer system (buyers make counter-offers)
- Auction style listings
- Batch operations
- Analytics dashboard
- Trading volume stats

---

## 📝 NOTES

**Security Considerations:**
- ✅ ReentrancyGuard used
- ✅ SafeERC20 for transfers
- ✅ Input validation
- ✅ Access control (seller only cancel)
- ✅ Active status checks

**Gas Optimization:**
- ✅ Immutable variables for tokens
- ✅ Efficient array iteration
- ✅ Minimal storage writes
- ✅ Events for off-chain indexing

**UX Improvements:**
- ✅ Loading states
- ✅ Transaction tracking
- ✅ Error handling
- ✅ Success notifications
- ✅ Explorer links

---

## 🔗 RESOURCES

**Documentation:**
- OpenZeppelin SafeERC20: https://docs.openzeppelin.com/contracts/4.x/api/token/erc20#SafeERC20
- Wagmi hooks: https://wagmi.sh/react/hooks
- Viem utilities: https://viem.sh/docs/utilities

**Similar Projects:**
- OpenSea (NFT marketplace)
- Blur (NFT marketplace)
- LooksRare (NFT marketplace)

---

**Last Updated:** 2025-11-03
**Status:** Ready for implementation
**Estimated Total Time:** 18-24 hours

