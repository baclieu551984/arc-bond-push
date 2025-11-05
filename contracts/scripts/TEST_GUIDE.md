# 🧪 ArcBond Testing Guide

Hướng dẫn test manual toàn bộ flow của ArcBond System trên Arc Testnet.

---

## 📋 Deployed Contracts

| Contract | Address |
|----------|---------|
| MockUSDC | `0x362f9a34CA155B6b696e23680f752aBc7BB14dEE` |
| BondToken | `0xa7300Da4f0B04441052eCcc2e0b15D22DD163cF5` |
| BondSeries | `0x1d27EDaFaE4523a97A73952C01a630B83C83F29F` |

**Explorer**: https://testnet.arcscan.app

---

## 🚀 Quick Start - Full Flow Test

### **Step 0: View Current Status**
```bash
npx hardhat run scripts/00-viewStatus.ts --network arc
```
Xem overview toàn bộ hệ thống: balances, snapshots, timing, next steps.

---

### **Step 1: Mint Free USDC**
```bash
npx hardhat run scripts/01-mintUSDC.ts --network arc
```
- Mint 10,000 USDC miễn phí cho testing
- Có thể edit `AMOUNT_USDC` trong script để mint số khác

**Expected output:**
```
💰 Minting USDC...
💵 USDC balance before: 0 USDC
⏳ Minting 10000 USDC...
✅ Minted successfully!
💵 USDC balance after: 10000 USDC
```

---

### **Step 2: Deposit USDC (Investor)**
```bash
npx hardhat run scripts/02-deposit.ts --network arc
```
- Deposit 100 USDC → nhận 1000 BondToken (ratio 1:10)
- Có thể edit `AMOUNT_USDC` trong script

**Expected output:**
```
💼 Depositing USDC to BondSeries...
💵 USDC balance: 10000 USDC
🎫 BondToken balance: 0 ABOND

⏳ Approving 100 USDC...
✅ Approved
⏳ Depositing 100 USDC...
✅ Deposited successfully!

📊 Results:
💵 USDC balance: 9900 USDC
🎫 BondToken balance: 1000 ABOND
📈 BondToken received: 1000 ABOND
```

---

### **Step 3: Record Snapshot (Keeper - Daily)**
```bash
npx hardhat run scripts/03-recordSnapshot.ts --network arc
```
- Keeper gọi mỗi 24h để chốt snapshot
- Script sẽ kiểm tra timing tự động
- Nếu chưa đủ 24h, sẽ báo thời gian còn lại

**Expected output:**
```
📸 Recording Snapshot...
⏰ Current time: 2025-11-03T12:00:00.000Z
⏰ Next record time: 2025-11-03T12:00:00.000Z

⏳ Recording snapshot...
✅ Snapshot recorded!

📊 After snapshot:
   Record count: 1
   Total Supply: 1000 ABOND
   Treasury Balance: 100 USDC

💰 Coupon Due for this snapshot:
   Amount: 1 USDC
   (Owner needs to distribute this amount)
```

**Note:** Nếu gặp "Too soon", có 2 options:
- **Option A**: Đợi 24h
- **Option B**: Deploy contract mới với maturity ngắn hơn để test nhanh

---

### **Step 4: Distribute Coupon (Owner)**
```bash
npx hardhat run scripts/04-distributeCoupon.ts --network arc
```
- Owner nạp USDC vào để trả lãi
- Script tự động calculate amount cần distribute
- Dynamic index sẽ được update

**Expected output:**
```
💸 Distributing Coupon...

📊 Status:
   Record Count: 1
   Last Distributed: 0

📸 Latest Snapshot:
   Total Supply: 1000 ABOND

💰 Coupon to distribute:
   Amount: 1 USDC

💵 Owner USDC balance: 9900 USDC

📊 Before distribution:
   Cumulative Index: 0

⏳ Approving USDC...
✅ Approved
⏳ Distributing coupon...
✅ Coupon distributed!

📊 After distribution:
   Cumulative Index: 0.001
   Index Increment: 0.001
```

---

### **Step 5: Claim Coupon (User)**
```bash
npx hardhat run scripts/05-claimCoupon.ts --network arc
```
- User claim lãi đã tích lũy
- Có thể claim nhiều lần (mỗi khi có distribute mới)

**Expected output:**
```
💰 Claiming Coupon...
🎫 Your BondToken balance: 1000 ABOND
💵 Claimable coupon: 1 USDC

📊 Before claim:
   USDC balance: 9900 USDC
   Cumulative Index: 0.001
   Your Claimed Index: 0

⏳ Claiming coupon...
✅ Coupon claimed!

📊 After claim:
   USDC balance: 9901 USDC
   USDC received: 1 USDC
   Your Claimed Index: 0.001
```

---

### **Step 6: Redeem Principal (After Maturity)**
```bash
npx hardhat run scripts/06-redeem.ts --network arc
```
- Redeem BondToken → lấy lại USDC gốc
- Chỉ sau maturity date (14 ngày)
- Auto-claim lãi chưa nhận trước khi redeem

**Expected output:**
```
🔄 Redeeming BondTokens...
⏰ Current time: 2025-11-17T12:00:00.000Z
⏰ Maturity date: 2025-11-17T12:00:00.000Z

🎫 Your BondToken balance: 1000 ABOND

📊 Redemption preview:
   BondTokens to burn: 1000 ABOND
   USDC to receive: 100 USDC

⏳ Redeeming...
✅ Redeemed successfully!

📊 After redeem:
   USDC balance: 10001 USDC
   BondToken balance: 0 ABOND

📈 Changes:
   USDC gained: 100 USDC
   BondToken burned: 1000 ABOND
```

**Total P&L:** 
- Deposited: 100 USDC
- Claimed coupon (14 days × 1%): 14 USDC
- Redeemed principal: 100 USDC
- **Total received: 114 USDC** (14% ROI)

---

## 🔁 Multi-Day Testing Scenario

### **Day 0:**
```bash
npx hardhat run scripts/01-mintUSDC.ts --network arc
npx hardhat run scripts/02-deposit.ts --network arc
# Edit amount to 1000 USDC → receive 10,000 ABOND
```

### **Day 1:**
```bash
npx hardhat run scripts/00-viewStatus.ts --network arc  # Check status
npx hardhat run scripts/03-recordSnapshot.ts --network arc
npx hardhat run scripts/04-distributeCoupon.ts --network arc
# Coupon due: 10 USDC (10,000 * 0.001)
```

### **Day 2:**
```bash
npx hardhat run scripts/05-claimCoupon.ts --network arc
# Claim 10 USDC from day 1
npx hardhat run scripts/03-recordSnapshot.ts --network arc
npx hardhat run scripts/04-distributeCoupon.ts --network arc
```

### **Day 3:**
```bash
npx hardhat run scripts/05-claimCoupon.ts --network arc
# Claim 10 USDC from day 2
# Repeat...
```

### **Day 14 (Maturity):**
```bash
npx hardhat run scripts/05-claimCoupon.ts --network arc
# Claim day 14 coupon
npx hardhat run scripts/06-redeem.ts --network arc
# Redeem 10,000 ABOND → 1000 USDC principal
# Total received: 1000 USDC + 140 USDC coupon = 1140 USDC
```

---

## 👥 Multi-User Testing

### **User A (Investor 1):**
```bash
# Day 0
npx hardhat run scripts/02-deposit.ts --network arc  # 100 USDC

# Day 1+
npx hardhat run scripts/05-claimCoupon.ts --network arc
```

### **User B (Investor 2) - joins Day 5:**
```bash
# Day 5
npx hardhat run scripts/02-deposit.ts --network arc  # 200 USDC

# Day 6+
npx hardhat run scripts/05-claimCoupon.ts --network arc
# User B gets pro-rata coupon from day 6 onwards
```

### **Owner (Issuer):**
```bash
# Every day after snapshot
npx hardhat run scripts/04-distributeCoupon.ts --network arc
```

---

## 🛠️ Troubleshooting

### **"Insufficient USDC balance"**
```bash
npx hardhat run scripts/01-mintUSDC.ts --network arc
```

### **"Too soon to record snapshot"**
- Đợi 24h từ lần snapshot trước
- Hoặc view status để check exact time:
```bash
npx hardhat run scripts/00-viewStatus.ts --network arc
```

### **"No new snapshot to distribute"**
```bash
npx hardhat run scripts/03-recordSnapshot.ts --network arc
```

### **"No coupon to claim"**
- Chưa có snapshot: run script 03
- Chưa distribute: run script 04
- Đã claim hết: chờ distribute mới

### **"Not matured yet"**
- Chờ đến maturity date (14 days)
- View maturity time:
```bash
npx hardhat run scripts/00-viewStatus.ts --network arc
```

---

## 📊 View All Info Anytime

```bash
npx hardhat run scripts/00-viewStatus.ts --network arc
```

Hiển thị:
- ✅ Series info (maturity, status)
- 💰 Financial status (deposits, treasury, reserve)
- 📸 Snapshot status (records, timing)
- 📈 Coupon index
- 👤 Your account (balances, claimable)
- 📝 Next steps recommendations

---

## 🎯 Testing Checklist

- [ ] Mint USDC (script 01)
- [ ] Deposit USDC (script 02)
- [ ] View status (script 00)
- [ ] Wait 24h or fast-forward
- [ ] Record snapshot (script 03)
- [ ] Distribute coupon (script 04)
- [ ] Claim coupon (script 05)
- [ ] Repeat snapshot → distribute → claim (multiple days)
- [ ] Wait until maturity (14 days)
- [ ] Redeem principal (script 06)
- [ ] Verify total P&L

---

## 🔗 Useful Links

- **BondSeries Contract**: https://testnet.arcscan.app/address/0x1d27EDaFaE4523a97A73952C01a630B83C83F29F
- **BondToken Contract**: https://testnet.arcscan.app/address/0xa7300Da4f0B04441052eCcc2e0b15D22DD163cF5
- **MockUSDC Contract**: https://testnet.arcscan.app/address/0x362f9a34CA155B6b696e23680f752aBc7BB14dEE
- **Arc Testnet Docs**: https://docs.arc.network

---

## 🔔 MONITORING & ALERTS (TODO - Implement Later)

### **Frontend Health Indicator** (Priority 1 - 1 hour)

**Component:** `BondHealthStatus.tsx`

**Features:**
- ✅ Real-time status indicator
- ✅ Color-coded warnings (green/yellow/orange/red)
- ✅ Days since last distribution
- ✅ Emergency mode detection

**Status levels:**
```
✅ Healthy:   All distributions up to date
⚠️  Warning:  1 snapshot pending distribution
⚠️  Critical: 2-3 snapshots pending
🚨 Emergency: >3 snapshots, emergency mode enabled
```

**UI Display:**
```typescript
// Simple banner
if (pending >= 3) {
  return <div className="bg-red-900">
    🚨 CRITICAL: Owner defaulted! Emergency redeem available.
  </div>
}

if (pending >= 1) {
  return <div className="bg-yellow-900">
    ⚠️ {pending} snapshot(s) awaiting distribution
  </div>
}
```

---

### **Backend Monitoring** (Priority 2 - 1 day)

**Service:** `backend/src/monitoring.js`

**Features:**
- ✅ Hourly health checks
- ✅ Discord webhook alerts
- ✅ Email notifications
- ✅ Telegram alerts (optional)

**Alert triggers:**
```javascript
// Check every hour
setInterval(checkBondHealth, 60 * 60 * 1000);

// Alert levels:
- INFO:     1 snapshot pending (remind owner)
- WARNING:  2 snapshots pending (contact owner)
- CRITICAL: 3+ snapshots (emergency imminent)
- EMERGENCY: Emergency mode activated (notify all users)
```

---

### **Event Listening** (Priority 3 - 1 day)

**Service:** `backend/src/eventListener.js`

**Events to monitor:**
```javascript
// Listen to critical events
bondSeries.on('SnapshotRecorded', handleSnapshot);
bondSeries.on('CouponDistributed', handleDistribution);
bondSeries.on('EmergencyRedeemEnabled', handleEmergency);

// Actions:
- Log to database
- Send real-time alerts
- Update frontend via WebSocket
- Notify affected users
```

---

### **Implementation Plan**

**Phase 1 (MVP):**
- [ ] Frontend health indicator (1h)
- [ ] Manual dashboard monitoring

**Phase 2 (Production):**
- [ ] Backend monitoring service (1 day)
- [ ] Discord/Email alerts (1 day)
- [ ] Event listener (1 day)

**Phase 3 (Advanced):**
- [ ] Chainlink Automation (2 days)
- [ ] User push notifications (2 days)
- [ ] SMS alerts (1 day)

**Reference code:** See conversation history for full implementation examples

---

## 💡 Tips

1. **Always run `00-viewStatus.ts` first** để check current state
2. **Edit amounts** trong scripts nếu muốn test với số khác
3. **Check explorer** để verify transactions
4. **Test với nhiều wallets** để verify multi-user scenarios
5. **Monitor events** trên explorer để track activity

---

**Happy Testing! 🚀**

