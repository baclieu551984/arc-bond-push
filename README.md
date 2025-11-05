# 🏦 ArcBond - Fixed-Rate Bond System

> **Decentralized Bond Platform** - Issue fixed-rate bonds với USDC trên Arc Testnet

---

## 📋 TÓM TẮT DỰ ÁN

ArcBond là hệ thống phát hành trái phiếu on-chain cho phép issuer (borrower) vay vốn từ investors thông qua cơ chế:
- **Investors deposit USDC** → nhận BondToken (1 USDC = 10 BondToken)
- **Issuer rút USDC** từ treasury để sử dụng (giữ lại 30% reserve)
- **Trả lãi hàng ngày** theo cơ chế claim-based (1%/ngày)
- **Investors redeem** gốc tại maturity (1 BondToken = 0.1 USDC)

---

## 🎯 PARAMETERS

| Thông số | Giá trị | Ghi chú |
|----------|---------|---------|
| **Network** | Arc Testnet | Chain ID: 5042002 |
| **RPC** | https://rpc.testnet.arc.network | |
| **Explorer** | https://testnet.arcscan.app | |
| **Gas Token** | USDC | Phí gas trả bằng USDC |
| **Mint Ratio** | 1 USDC → 10 BondToken | Fixed |
| **Cap** | 100,000 USDC | = 1,000,000 BondToken |
| **Face Value** | 0.1 USDC/token | Giá trị redeem |
| **Coupon Rate** | 1% / ngày | Trên mệnh giá |
| **Coupon/Token/Day** | 0.001 USDC | = 0.001e18 wei |
| **Maturity** | 14 ngày | Config được |
| **Reserve** | 30% | Locked on-chain |
| **Withdrawable** | 70% | Max owner có thể rút |
| **Mint Phase** | Open suốt | Đến maturity |
| **Fees** | 0% | Testnet |
| **Precision** | 1e18 | Standard DeFi |
| **Default Grace** | 3 ngày | Sau đó emergency redeem |

---

## 🏗️ ARCHITECTURE

### **1. Smart Contracts**

#### **A. MockUSDC.sol** (Testnet Only)
```solidity
// ERC20 token với decimals=6
// Mint free cho test
// Address: [TBD after deployment]
```

#### **B. BondToken.sol**
```solidity
// ERC20 standard
// Name: "ArcBond Token"
// Symbol: "ABOND"
// Decimals: 18
// Mint/Burn: controlled by BondSeries
// Transfer: tự do (OTC market)
// Address: [TBD after deployment]
```

#### **C. BondSeries.sol** (Main Contract)
```solidity
// Core logic của bond system
// Address: [TBD after deployment]

// ==================== ROLES ====================
// - OWNER: deploy, withdraw 70%, pause, distribute coupon
// - KEEPER: recordSnapshot() only (backend automation)

// ==================== STATE ====================
struct Terms {
    uint256 mintRatio;              // 10 (1 USDC → 10 BondToken)
    uint256 faceValuePerToken;      // 0.1e6 USDC
    uint256 couponRatePerDay;       // 100 (1%)
    uint256 couponPerTokenPerDay;   // 0.001e18
    uint256 maturityDate;           // timestamp
    uint256 reserveRatio;           // 30%
    uint256 defaultGracePeriod;     // 3 days
}

mapping(address => uint256) public claimedIndex;      // tracking claimed coupon
uint256 public cumulativeCouponIndex;                 // 1e18 precision
uint256 public lastRecordTime;
uint256 public nextRecordTime;                        // 24h interval
uint256 public recordCount;
mapping(uint256 => Snapshot) public snapshots;

struct Snapshot {
    uint256 recordId;
    uint256 timestamp;
    uint256 totalSupply;
    uint256 treasuryBalance;
}

// ==================== FUNCTIONS ====================

// --- User Functions ---
function deposit(uint256 usdcAmount) external
  // User approve USDC trước
  // Transfer USDC vào treasury
  // Mint usdcAmount * 10 BondToken cho user
  
function claimCoupon() external returns (uint256)
  // Calculate: (cumulativeIndex - claimedIndex[user]) * balance[user] / 1e18
  // Transfer USDC coupon cho user
  // Update claimedIndex[user] = cumulativeIndex
  
function redeem(uint256 bondAmount) external
  // Require: block.timestamp >= maturityDate
  // Burn bondAmount BondToken
  // Transfer bondAmount * 0.1 USDC cho user
  
function emergencyRedeem(uint256 bondAmount) external
  // Require: default state (>3 days after snapshot, chưa distribute)
  // Pro-rata: bondAmount * treasuryBalance / totalSupply
  
// --- Keeper Functions (Backend) ---
function recordSnapshot() external onlyKeeper
  // Require: block.timestamp >= nextRecordTime
  // Record totalSupply, treasury balance, timestamp
  // nextRecordTime += 24 hours
  // Emit SnapshotRecorded event
  
// --- Owner Functions ---
function distributeCoupon(uint256 amount) external onlyOwner
  // Require: có snapshot mới nhất chưa distribute
  // Owner transfer USDC vào contract
  // cumulativeCouponIndex += 0.001e18 (hoặc amount based)
  // Emit CouponDistributed event
  
function ownerWithdraw(uint256 amount) external onlyOwner
  // Require: amount <= 70% of treasury
  // Transfer USDC to owner
  
function pause() / unpause() external onlyOwner
  // Emergency controls

// ==================== EVENTS ====================
event Deposited(address indexed user, uint256 usdc, uint256 bonds, uint256 timestamp)
event SnapshotRecorded(uint256 indexed recordId, uint256 totalSupply, uint256 treasury, uint256 timestamp)
event CouponDistributed(uint256 indexed recordId, uint256 amount, uint256 newIndex, uint256 timestamp)
event CouponClaimed(address indexed user, uint256 amount, uint256 timestamp)
event Redeemed(address indexed user, uint256 bonds, uint256 usdc, uint256 timestamp)
event EmergencyRedeemEnabled(uint256 timestamp)
event OwnerWithdraw(uint256 amount, uint256 timestamp)
```

---

### **2. Backend Automation (Render)**

#### **Cron Job Script**
```javascript
// File: backend/cron-snapshot.js
// Deploy: Render.com
// Schedule: Mỗi ngày 00:00 UTC

import { ethers } from 'ethers';

// Setup
const RPC_URL = 'https://rpc.testnet.arc.network';
const KEEPER_PRIVATE_KEY = process.env.KEEPER_PRIVATE_KEY;
const BOND_SERIES_ADDRESS = process.env.BOND_SERIES_ADDRESS;

const provider = new ethers.JsonRpcProvider(RPC_URL);
const keeper = new ethers.Wallet(KEEPER_PRIVATE_KEY, provider);
const bondSeries = new ethers.Contract(BOND_SERIES_ADDRESS, ABI, keeper);

// Main cron function
async function dailySnapshot() {
  console.log('[CRON] Starting daily snapshot...');
  
  try {
    // Check if it's time to record
    const nextRecordTime = await bondSeries.nextRecordTime();
    const now = Math.floor(Date.now() / 1000);
    
    if (now < nextRecordTime) {
      console.log('[CRON] Not time yet. Next record:', new Date(nextRecordTime * 1000));
      return;
    }
    
    // Record snapshot
    console.log('[CRON] Recording snapshot...');
    const tx = await bondSeries.recordSnapshot();
    const receipt = await tx.wait();
    
    console.log('[CRON] ✅ Snapshot recorded!');
    console.log('[CRON] TX:', receipt.hash);
    console.log('[CRON] Gas used:', receipt.gasUsed.toString());
    
    // Send notification (optional)
    await sendDiscordNotification({
      title: '📸 Daily Snapshot Recorded',
      txHash: receipt.hash,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('[CRON] ❌ Error:', error);
    await sendDiscordAlert({
      title: '🚨 Snapshot Failed',
      error: error.message
    });
  }
}

// Run
dailySnapshot();
```

#### **Owner Manual Distribution**
```javascript
// Owner chạy script này sau khi snapshot
// File: backend/distribute-coupon.js

async function distributeCoupon() {
  const snapshot = await bondSeries.snapshots(await bondSeries.recordCount());
  const couponDue = snapshot.totalSupply * 0.001; // 1% daily
  
  console.log('Total supply:', ethers.formatEther(snapshot.totalSupply));
  console.log('Coupon due:', couponDue, 'USDC');
  
  // Approve USDC
  const usdc = new ethers.Contract(USDC_ADDRESS, USDC_ABI, owner);
  const approveTx = await usdc.approve(BOND_SERIES_ADDRESS, couponDue);
  await approveTx.wait();
  
  // Distribute
  const tx = await bondSeries.distributeCoupon(couponDue);
  const receipt = await tx.wait();
  
  console.log('✅ Coupon distributed!');
  console.log('TX:', receipt.hash);
}
```

---

## 🔄 USER FLOWS

### **Flow 1: Mint (Investor Deposit)**
```
1. User connect wallet
2. User input amount (ví dụ: 100 USDC)
3. User approve USDC cho BondSeries contract
4. User gọi deposit(100e6)
5. Contract:
   - Transfer 100 USDC từ user → treasury
   - Mint 1000 BondToken cho user
6. User nhận 1000 BondToken
7. Emit: Deposited(user, 100e6, 1000e18, timestamp)
```

### **Flow 2: Daily Coupon**
```
=== 00:00 UTC - Backend Keeper ===
1. Cron job wake up
2. Check nextRecordTime
3. Gọi recordSnapshot()
4. Contract:
   - Record totalSupply_snapshot
   - Record treasury_snapshot
   - recordCount++
   - nextRecordTime += 24 hours
5. Emit: SnapshotRecorded(recordId, totalSupply, treasury, timestamp)

=== Anytime After - Owner Manual ===
1. Owner check latest snapshot
2. Calculate couponDue = totalSupply_snapshot * 0.001
3. Owner approve USDC
4. Owner gọi distributeCoupon(couponDue)
5. Contract:
   - Transfer USDC từ owner → treasury
   - cumulativeCouponIndex += 0.001e18
6. Emit: CouponDistributed(recordId, amount, newIndex, timestamp)

=== Anytime - User Claim ===
1. User gọi claimCoupon()
2. Contract calculate:
   unclaimed = (cumulativeCouponIndex - claimedIndex[user]) * balance[user] / 1e18
3. Transfer unclaimed USDC cho user
4. claimedIndex[user] = cumulativeCouponIndex
5. Emit: CouponClaimed(user, unclaimed, timestamp)
```

### **Flow 3: Redeem Gốc (Maturity)**
```
1. Wait until block.timestamp >= maturityDate
2. User gọi redeem(1000e18) // 1000 BondToken
3. Contract:
   - Burn 1000 BondToken
   - Calculate: 1000 * 0.1 = 100 USDC
   - Transfer 100 USDC cho user
4. Emit: Redeemed(user, 1000e18, 100e6, timestamp)

Note: Lãi chưa claim vẫn claim được riêng bằng claimCoupon()
```

### **Flow 4: Emergency Redeem (Default)**
```
Scenario: Owner không distribute coupon quá 3 ngày sau snapshot

1. block.timestamp > snapshot.timestamp + 3 days
2. Contract tự động enable emergency mode
3. User gọi emergencyRedeem(1000e18)
4. Contract:
   - Pro-rata: amount = 1000 * treasuryBalance / totalSupply
   - Burn 1000 BondToken
   - Transfer amount USDC cho user
5. Emit: Redeemed(user, 1000e18, amount, timestamp)
```

---

## 📊 CALCULATION EXAMPLES

### **Example 1: Single User Full Cycle**
```
DAY 0 (Launch):
- User A deposit 100 USDC
- Receive: 1000 BondToken
- Treasury: 100 USDC
- totalSupply: 1000 BondToken

DAY 1 (00:00 UTC):
- Keeper: recordSnapshot()
  → snapshot: totalSupply=1000, treasury=100
- Owner: distributeCoupon(1 USDC)
  → cumulativeIndex = 0.001e18
- User A: claimCoupon()
  → unclaimed = (0.001e18 - 0) * 1000 / 1e18 = 1 USDC
  → claimedIndex[A] = 0.001e18

DAY 2:
- Keeper: recordSnapshot()
- Owner: distributeCoupon(1 USDC)
  → cumulativeIndex = 0.002e18
- User A: claimCoupon()
  → unclaimed = (0.002e18 - 0.001e18) * 1000 / 1e18 = 1 USDC
  
... repeat 14 days ...

DAY 14 (Maturity):
- User A: claimCoupon() → 1 USDC (day 14)
- User A: redeem(1000) → 100 USDC gốc
- Total received: 100 USDC gốc + 14 USDC lãi = 114 USDC
- ROI: 14% (14 days)
```

### **Example 2: Multiple Users + Transfer**
```
DAY 0:
- User A deposit 100 USDC → 1000 BondToken
- User B deposit 50 USDC → 500 BondToken
- totalSupply: 1500 BondToken
- Treasury: 150 USDC

DAY 1:
- Snapshot: totalSupply=1500
- Distribute: 1.5 USDC (1500 * 0.001)
- cumulativeIndex = 0.001e18

DAY 2:
- User A transfer 500 BondToken → User C (OTC market)
- User A balance: 500
- User C balance: 500
- User B balance: 500 (unchanged)

DAY 3:
- Snapshot: totalSupply=1500 (unchanged)
- Distribute: 1.5 USDC
- cumulativeIndex = 0.002e18

- User A claim:
  unclaimed = (0.002e18 - 0) * 500 / 1e18 = 1 USDC
  (Note: A đã claim lãi cho 500 token từ day 0-3)
  
- User B claim:
  unclaimed = (0.002e18 - 0) * 500 / 1e18 = 1 USDC
  
- User C claim:
  unclaimed = (0.002e18 - 0) * 500 / 1e18 = 1 USDC
  (Note: C nhận full lãi từ day 0 vì token được transfer cùng quyền lãi)
  
→ Tổng claimed: 3 USDC ✅ Match với 1.5 + 1.5 distributed
```

### **Example 3: Owner Withdrawal**
```
DAY 0:
- Total raised: 100,000 USDC
- Treasury: 100,000 USDC
- Reserve (30%): 30,000 USDC
- Withdrawable (70%): 70,000 USDC

Owner actions:
- ownerWithdraw(50,000) ✅ OK
- Treasury now: 50,000 USDC
- Still > 30% reserve

- ownerWithdraw(30,000) ❌ FAIL
- Would leave only 20,000 < 30,000 required reserve
```

---

## 🔐 SECURITY & RISK MANAGEMENT

### **1. Role Separation**
| Role | Wallet | Permissions | Keys Held By |
|------|--------|-------------|--------------|
| **Owner** | Hot wallet | Withdraw 70%, distribute coupon, pause | Issuer |
| **Keeper** | Backend wallet | recordSnapshot() only | Render.com |
| **User** | Any wallet | Deposit, claim, redeem | Public |

✅ **Keeper không thể rút tiền** - chỉ trigger snapshot
✅ **Owner không tự động distribute** - phải manual approve USDC

### **2. Circuit Breakers**
```solidity
// Auto-pause conditions:
1. Treasury < required reserve
2. Default state (>3 days no distribution)
3. Owner manual pause

// Effects when paused:
- deposit() disabled
- ownerWithdraw() disabled
- claimCoupon() still enabled ✅
- redeem() still enabled ✅
```

### **3. Time Locks**
```solidity
// recordSnapshot(): min 24h interval
require(block.timestamp >= nextRecordTime, "Too soon");

// distributeCoupon(): must be after snapshot
require(recordCount > lastDistributedRecord, "No new snapshot");

// redeem(): must be after maturity
require(block.timestamp >= maturityDate, "Not matured");
```

### **4. Tracking & Monitoring**
```javascript
// Events to monitor (via Envio / The Graph):
- Deposited → track total raised
- SnapshotRecorded → ensure daily automation works
- CouponDistributed → track payment history
- CouponClaimed → track user claims
- OwnerWithdraw → track fund usage
- EmergencyRedeemEnabled → ALERT 🚨

// Dashboard metrics:
✅ Total deposits
✅ Treasury balance
✅ Reserve ratio (current vs required)
✅ Cumulative coupon distributed
✅ Cumulative coupon claimed
✅ Days until maturity
✅ Default status
```

---

## 🧪 TESTING PLAN

### **Phase 1: Unit Tests (Hardhat)**
```bash
npx hardhat test

Tests:
✅ MockUSDC: mint, transfer
✅ BondToken: mint, burn, transfer
✅ BondSeries - Deposit:
   - Deposit USDC, receive BondToken
   - Mint ratio correct (1→10)
   - Treasury balance updated
   - Cap enforced
✅ BondSeries - Snapshot:
   - Only keeper can call
   - 24h interval enforced
   - Snapshot data recorded
✅ BondSeries - Distribute:
   - Only owner can call
   - Index increments correct
   - USDC transferred from owner
✅ BondSeries - Claim:
   - Calculate unclaimed correct
   - Multi-claim works
   - After transfer works
✅ BondSeries - Redeem:
   - Before maturity fails
   - After maturity works
   - Correct USDC returned
✅ BondSeries - Withdraw:
   - 70% cap enforced
   - Reserve protected
✅ BondSeries - Emergency:
   - Enabled after 3 days
   - Pro-rata calculation
✅ Edge cases:
   - Zero amounts
   - Insufficient balance
   - Reentrancy protection
```

### **Phase 2: Testnet Deployment**
```bash
# Deploy to Arc Testnet
cd contracts
npx hardhat run scripts/deploy.ts --network arc

# Verify contracts
npx hardhat verify --network arc [CONTRACT_ADDRESS] [ARGS]

# Manual testing:
1. Mint free USDC from mock contract
2. Deposit USDC → receive BondToken
3. Wait 24h → trigger snapshot
4. Owner distribute coupon
5. Claim coupon
6. Transfer BondToken to another wallet
7. Wait maturity → redeem
```

### **Phase 3: Automation Testing**
```bash
# Test keeper automation
node backend/cron-snapshot.js

# Test owner distribution
node backend/distribute-coupon.js

# Monitor events
node backend/event-listener.js
```

---

## 🚀 DEPLOYMENT CHECKLIST

### **Pre-Deploy**
- [ ] Audit contracts (internal review)
- [ ] Unit tests 100% pass
- [ ] Testnet USDC faucet ready
- [ ] Owner wallet có USDC cho coupon
- [ ] Keeper wallet có USDC cho gas
- [ ] Render.com account setup
- [ ] Environment variables prepared

### **Deploy Sequence**
```bash
# 1. Deploy MockUSDC
npx hardhat run scripts/01-deploy-usdc.ts --network arc

# 2. Deploy BondToken
npx hardhat run scripts/02-deploy-bond-token.ts --network arc

# 3. Deploy BondSeries
npx hardhat run scripts/03-deploy-bond-series.ts --network arc
# Args: bondTokenAddress, usdcAddress, keeper, maturityDays

# 4. Grant roles
npx hardhat run scripts/04-setup-roles.ts --network arc

# 5. Verify all contracts
npx hardhat verify --network arc [addresses...]

# 6. Update frontend config
# Update src/config/contracts.ts with deployed addresses

# 7. Deploy backend
git push render main

# 8. Test end-to-end
```

### **Post-Deploy**
- [ ] Verify on explorer
- [ ] Test deposit small amount
- [ ] Test snapshot (wait 24h or fast-forward)
- [ ] Test distribute + claim
- [ ] Monitor first 3 days closely
- [ ] Document addresses in README
- [ ] Share frontend URL

---

## 📁 PROJECT STRUCTURE

```
arc-bond/
├── contracts/
│   ├── contracts/
│   │   ├── MockUSDC.sol
│   │   ├── BondToken.sol
│   │   └── BondSeries.sol
│   ├── scripts/
│   │   ├── 01-deploy-usdc.ts
│   │   ├── 02-deploy-bond-token.ts
│   │   ├── 03-deploy-bond-series.ts
│   │   └── 04-setup-roles.ts
│   ├── test/
│   │   ├── MockUSDC.test.ts
│   │   ├── BondToken.test.ts
│   │   └── BondSeries.test.ts
│   ├── deployments/
│   │   └── arc.json
│   ├── hardhat.config.ts
│   └── package.json
│
├── backend/
│   ├── cron-snapshot.js
│   ├── distribute-coupon.js
│   ├── event-listener.js
│   ├── render.yaml
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx          # Dashboard
│   │   │   └── layout.tsx
│   │   ├── components/
│   │   │   ├── DepositForm.tsx   # User deposit USDC
│   │   │   ├── ClaimButton.tsx   # Claim coupon
│   │   │   ├── RedeemForm.tsx    # Redeem principal
│   │   │   ├── BondInfo.tsx      # Display terms
│   │   │   └── UserStats.tsx     # Holdings, claimable
│   │   ├── config/
│   │   │   ├── wagmi.ts          # Wagmi + Arc network
│   │   │   └── contracts.ts      # ABIs + addresses
│   │   ├── hooks/
│   │   │   ├── useBondSeries.ts
│   │   │   ├── useClaimable.ts
│   │   │   └── useMaturity.ts
│   │   └── lib/
│   │       └── utils.ts
│   ├── public/
│   ├── package.json
│   └── next.config.ts
│
├── README.md          # This file
└── .env.example
```

---

## 🔧 DEVELOPMENT

### **Environment Variables**
```bash
# .env.example

# Network
ARC_RPC_URL=https://rpc.testnet.arc.network
ARC_CHAIN_ID=5042002

# Contracts
USDC_ADDRESS=
BOND_TOKEN_ADDRESS=
BOND_SERIES_ADDRESS=

# Wallets
OWNER_PRIVATE_KEY=
KEEPER_PRIVATE_KEY=

# Automation
CRON_SCHEDULE="0 0 * * *"  # Daily at 00:00 UTC

# Monitoring
DISCORD_WEBHOOK_URL=
```

### **Local Development**
```bash
# Install dependencies
cd contracts && npm install
cd ../frontend && npm install
cd ../backend && npm install

# Run local node (fork Arc testnet)
npx hardhat node --fork https://rpc.testnet.arc.network

# Deploy locally
npx hardhat run scripts/deploy.ts --network localhost

# Run frontend
cd frontend && npm run dev

# Test backend
cd backend && node cron-snapshot.js
```

---

## 📈 ROADMAP

### **Phase 1: MVP (Current)** ✅
- [x] Spec finalized
- [x] Smart contracts implementation (BondSeries, BondToken, USDC)
- [x] Contract decimal fixes (ABOND: 18→6, precision: 1e18→1e6)
- [x] Security fixes (ownerWithdraw whenNotPaused, snapshot/distribution timing)
- [x] Unit testing via deployment scripts (00-08)
- [x] Testnet deployment on Arc (5042002)
- [x] Backend automation (Render cron: snapshot + monitor)
- [x] Basic frontend UI (4 tabs: Dashboard/Deposit/Portfolio/Admin)
- [x] Wallet integration (MetaMask/OKX via wagmi)
- [x] Network detection & switch (Arc Testnet)

### **Phase 1.5: UI/UX Polish** 🎨 (In Progress)
- [x] Unified typography system (text-sm: 14px, text-lg: 18px)
- [x] Consistent color scheme (border-custom: #D1D5DB, btn-primary: green-500)
- [x] Input styling (font-bold, border focus without ring)
- [x] Button states (MAX, inactive, disabled)
- [x] Network indicator (Arc Testnet badge, Wrong Network warning)
- [x] 60% width layout for all content cards
- [x] Icon integration (arc.svg, usdc.svg)
- [ ] Network auto-detection fix (MetaMask chain change listener)
- [ ] Real-time data updates (polling/refresh)
- [ ] Transaction feedback (loading states, success/error toasts)
- [ ] Responsive design (mobile/tablet)

### **Phase 2: Enhanced Features**
- [ ] Multiple series support (BondFactory)
- [ ] Secondary market (Simple P2P marketplace for ABOND/USDC)
- [ ] Whitelist/KYC integration
- [ ] Advanced analytics dashboard
- [ ] Mobile responsive UI
- [ ] Multi-language support

### **Phase 3: Mainnet & Scale**
- [ ] Professional audit (Certik / OpenZeppelin)
- [ ] Mainnet deployment on Arc
- [ ] Real USDC integration
- [ ] Institutional-grade compliance
- [ ] API for integrations
- [ ] Governance token

---

## 🐛 KNOWN LIMITATIONS (Testnet)

1. **1% Daily Rate**: Rất cao (365% APY), chỉ để test. Production nên dùng realistic rate.
2. **Manual Distribution**: Owner phải manual distribute mỗi ngày. Phase 2 có thể automate bằng Chainlink Functions.
3. **No Secondary Market**: BondToken transfer được nhưng chưa có DEX/AMM built-in.
4. **No Credit Scoring**: Chấp nhận uncollateralized bond dựa trên trust.
5. **Gas Costs**: Mỗi snapshot + distribution tốn gas (USDC). Phase 2 optimize batch operations.

---

## 📚 REFERENCES

- **Arc Network Docs**: https://docs.arc.network
- **ERC-20 Standard**: https://eips.ethereum.org/EIPS/eip-20
- **Compound cToken**: https://docs.compound.finance/v2/ctokens/
- **Aave aToken**: https://docs.aave.com/developers/tokens/atoken
- **Bond Math**: https://www.investopedia.com/terms/b/bond.asp

---

## 📞 CONTACT & SUPPORT

- **GitHub**: [Repository URL]
- **Discord**: [Community Link]
- **Docs**: [GitBook / Notion]
- **Email**: support@arcbond.xyz

---

## 📝 LICENSE

MIT License - See LICENSE file for details

---

## ⚠️ DISCLAIMER

**TESTNET ONLY - NOT FOR PRODUCTION**

This is experimental software deployed on Arc Testnet for educational and testing purposes only. 
- No real value
- No guarantees
- Use at your own risk
- Not audited
- Not financial advice

---

**Built with ❤️ on Arc Network**

*Last Updated: 2025-11-04*

