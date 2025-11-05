# ⚡ Fast Test Guide - 15 Minute Snapshots

Test toàn bộ bond system trong **3 giờ** với snapshot mỗi 15 phút!

---

## 🔧 Configuration

### **Contract Settings:**
- ✅ Snapshot Interval: **15 minutes**
- ✅ Maturity: **3 hours** (180 minutes)
- ✅ Coupon: 1%/day (0.001 USDC per token)
- ✅ Total Snapshots possible: **12** (180 min / 15 min)

### **Auto-load Addresses:**
- ✅ Tất cả scripts đọc addresses từ `deployments/bond-system.json`
- ✅ Không cần sửa code khi deploy mới!

---

## 🚀 Timeline - Full Test trong 3 giờ

### **Minute 0: Deploy & Setup**
```bash
cd arc/arc-00/contracts

# Deploy contract mới
npx hardhat run scripts/deployBondSystem.ts --network arc

# Addresses tự động save vào deployments/bond-system.json
```

### **Minute 1: Investor Deposit**
```bash
# Đổi .env sang investor wallet
npx hardhat run scripts/01-mintUSDC.ts --network arc
npx hardhat run scripts/02-deposit.ts --network arc
# Deposit: 100 USDC → 1000 ABOND
```

### **Minute 2: Owner Withdraw**
```bash
# Đổi .env về owner wallet
npx hardhat run scripts/07-ownerWithdraw.ts --network arc
# Withdraw: 70 USDC (70% of 100)
```

### **Minute 15: Snapshot #1** ⭐
```bash
# Owner hoặc keeper
npx hardhat run scripts/03-recordSnapshot.ts --network arc
# ✅ Record #1 created
```

### **Minute 16: Distribute Coupon #1**
```bash
npx hardhat run scripts/04-distributeCoupon.ts --network arc
# Amount: 1 USDC (1000 * 0.001)
# Index: 0.001
```

### **Minute 17: Investor Claim**
```bash
# Đổi sang investor wallet
npx hardhat run scripts/05-claimCoupon.ts --network arc
# Receive: 1 USDC
```

### **Minute 30: Snapshot #2**
```bash
npx hardhat run scripts/03-recordSnapshot.ts --network arc
```

### **Minute 31: Distribute Coupon #2**
```bash
npx hardhat run scripts/04-distributeCoupon.ts --network arc
# Amount: 1 USDC
# Index: 0.002
```

### **Minute 32: Investor Claim**
```bash
npx hardhat run scripts/05-claimCoupon.ts --network arc
# Receive: 1 USDC (total claimed: 2 USDC)
```

### **...Repeat every 15 minutes...**

### **Hour 3 (180 min): Maturity!** 🎉
```bash
# Investor redeem principal
npx hardhat run scripts/06-redeem.ts --network arc
# Burn: 1000 ABOND
# Receive: 100 USDC principal

# Total P&L:
# - Deposited: 100 USDC
# - Claimed coupons: 12 USDC (12 snapshots * 1 USDC)
# - Redeemed: 100 USDC
# - Total: 112 USDC
# - ROI: 12% trong 3 giờ! 🚀
```

---

## 🎮 Quick Test Commands

### **Check Status Anytime:**
```bash
npx hardhat run scripts/00-viewStatus.ts --network arc
```

### **Full Cycle Test (Owner):**
```bash
# Every 15 minutes:
npx hardhat run scripts/03-recordSnapshot.ts --network arc && \
npx hardhat run scripts/04-distributeCoupon.ts --network arc
```

### **Investor Cycle:**
```bash
# After each distribute:
npx hardhat run scripts/05-claimCoupon.ts --network arc
```

---

## 📊 Expected Results Table

| Time | Action | Total Supply | Index | User Claimable |
|------|--------|--------------|-------|----------------|
| 0:00 | Deploy | 0 | 0 | 0 |
| 0:01 | Deposit 100 USDC | 1000 ABOND | 0 | 0 |
| 0:15 | Snapshot #1 | 1000 | 0 | 0 |
| 0:16 | Distribute 1 USDC | 1000 | 0.001 | 1 USDC |
| 0:17 | Claim | 1000 | 0.001 | 0 |
| 0:30 | Snapshot #2 | 1000 | 0.001 | 0 |
| 0:31 | Distribute 1 USDC | 1000 | 0.002 | 1 USDC |
| 0:32 | Claim | 1000 | 0.002 | 0 |
| ... | ... | ... | ... | ... |
| 3:00 | Maturity | 1000 | 0.012 | 0 |
| 3:01 | Redeem | 0 | 0.012 | 0 |

---

## 🧪 Advanced Test Scenarios

### **Multi-Investor Test:**
```bash
# Minute 15: Investor 2 joins
# Đổi wallet
npx hardhat run scripts/02-deposit.ts --network arc
# Deposit: 200 USDC → 2000 ABOND
# Total supply: 3000 ABOND

# Minute 20: Snapshot #4
npx hardhat run scripts/03-recordSnapshot.ts --network arc

# Minute 21: Distribute
npx hardhat run scripts/04-distributeCoupon.ts --network arc
# Amount: 3 USDC (3000 * 0.001)

# Both claim:
# Investor 1: (0.004 - 0.003) * 1000 = 1 USDC
# Investor 2: (0.004 - 0) * 2000 = 8 USDC (joined at index 0)
# Total: 9 USDC ✅
```

### **Test Distribute 2x Amount:**
```bash
# Skip 1 distribution, then bù 2 ngày
# Minute 25: Snapshot #5
# Minute 30: Snapshot #6 (no distribute yet)
# Minute 35: Distribute 2 USDC (bù 2 snapshots)

# Index should jump: +0.002 instead of +0.001
```

### **Test Default Scenario:**
```bash
# Do 3 snapshots without distributing
# Emergency mode should activate
# Users can emergency redeem pro-rata
```

---

## 🔄 Automated Test Script

Tạo `scripts/autotest.sh`:
```bash
#!/bin/bash

echo "🚀 Starting automated test..."

# Deploy
npx hardhat run scripts/deployBondSystem.ts --network arc

# Investor deposit
npx hardhat run scripts/02-deposit.ts --network arc

# Loop 12 times (every 15 minutes for 3 hours)
for i in {1..12}
do
  echo "⏰ Cycle $i/12"
  
  # Wait 15 minutes
  echo "⏳ Waiting 15 minutes..."
  sleep 900
  
  # Snapshot
  npx hardhat run scripts/03-recordSnapshot.ts --network arc
  
  # Distribute
  npx hardhat run scripts/04-distributeCoupon.ts --network arc
  
  # Claim
  npx hardhat run scripts/05-claimCoupon.ts --network arc
  
  # Status
  npx hardhat run scripts/00-viewStatus.ts --network arc
done

# Final redeem
echo "🎉 Testing complete! Redeeming..."
npx hardhat run scripts/06-redeem.ts --network arc

echo "✅ All done!"
```

---

## 💡 Tips

### **1. Monitor Next Snapshot Time:**
```bash
npx hardhat run scripts/00-viewStatus.ts --network arc | grep "Next Record"
```

### **2. Set Reminders:**
Every 15 minutes, chạy:
```bash
# Snapshot → Distribute → Claim
```

### **3. Use Watch Command (Linux/Mac):**
```bash
watch -n 900 "npx hardhat run scripts/03-recordSnapshot.ts --network arc"
```

### **4. Discord Bot:**
Setup webhook để nhận notification mỗi 15 phút

---

## 🎯 Testing Checklist

**Basic Flow:**
- [ ] Deploy contract với 15-min interval
- [ ] Investor deposit
- [ ] Owner withdraw 70%
- [ ] Wait 15 min, snapshot
- [ ] Distribute coupon
- [ ] Investor claim
- [ ] Repeat 12 times
- [ ] Redeem at maturity
- [ ] Verify total P&L

**Advanced:**
- [ ] Multi-investor deposits
- [ ] Transfer BondToken between users
- [ ] Skip distribution (test late payment)
- [ ] Emergency redeem (default scenario)
- [ ] Partial redeem
- [ ] Owner pause/unpause

---

## 📚 Compare: 15 Min vs 24 Hour

| Feature | 15 Minutes | 24 Hours |
|---------|-----------|----------|
| Full test cycle | **3 hours** | **14 days** |
| Snapshots | 12 in 3 hours | 14 in 14 days |
| Use case | **Testing** | **Production** |
| Maturity | 3 hours | 14 days |
| ROI | 12% in 3 hours | 14% in 14 days |

---

## 🚀 Ready to Deploy!

```bash
cd arc/arc-00/contracts
npx hardhat run scripts/deployBondSystem.ts --network arc
```

**Contract mới sẽ có:**
- ✅ 15-minute snapshot interval
- ✅ 3-hour maturity
- ✅ Auto-load addresses
- ✅ Sẵn sàng test thoải mái!

---

**Good luck! Test thôi!** 🎉

