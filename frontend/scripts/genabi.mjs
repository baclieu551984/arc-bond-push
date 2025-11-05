import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Path: từ frontend/scripts lên arc-00, vào contracts
const contractsDir = path.resolve(__dirname, "../../contracts");
const deploymentsDir = path.join(contractsDir, "deployments");

// Output: frontend/src/abi
const outdir = path.resolve(__dirname, "../src/abi");

if (!fs.existsSync(outdir)) {
  fs.mkdirSync(outdir, { recursive: true });
}

const line = "\n===================================================================\n";

console.log("🔄 Generating ABIs for ArcBond System...");

// ===================== Bond System =====================
const bondSystemFile = path.join(deploymentsDir, "bond-system.json");
if (!fs.existsSync(bondSystemFile)) {
  console.error(`${line}bond-system.json not found at ${bondSystemFile}${line}`);
  process.exit(1);
}

const bondSystemData = JSON.parse(fs.readFileSync(bondSystemFile, "utf-8"));
console.log(`✅ Loaded bond-system.json`);

// ===================== Generate BondSeriesABI =====================
console.log("\n📝 Generating BondSeries...");

const bondSeriesABI = `/*
  This file is auto-generated.
  Command: 'npm run genabi'
*/
export const BondSeriesABI = ${JSON.stringify({ abi: bondSystemData.abis.BondSeries }, null, 2)} as const;
`;

fs.writeFileSync(path.join(outdir, "BondSeriesABI.ts"), bondSeriesABI, "utf-8");
console.log(`✅ Generated BondSeriesABI.ts`);

// Generate BondSeriesAddresses
const bondSeriesAddresses = `/*
  This file is auto-generated.
  Command: 'npm run genabi'
*/
export const BondSeriesAddresses = {
${Object.entries(bondSystemData)
  .filter(([key]) => key !== "abis")
  .map(([chainId, data]) => `  "${chainId}": {
    chainId: ${data.chainId},
    chainName: "${data.chainName}",
    address: "${data.contracts.BondSeries.address}" as const,
    maturityHours: ${data.contracts.BondSeries.maturityHours}
  }`)
  .join(",\n")}
} as const;

export function getBondSeriesAddress(chainId: number): \`0x\${string}\` {
  const chain = BondSeriesAddresses[chainId.toString() as keyof typeof BondSeriesAddresses];
  if (!chain) {
    throw new Error(\`BondSeries not deployed on chain \${chainId}\`);
  }
  return chain.address;
}
`;

fs.writeFileSync(path.join(outdir, "BondSeriesAddresses.ts"), bondSeriesAddresses, "utf-8");
console.log(`✅ Generated BondSeriesAddresses.ts`);

// ===================== Generate BondTokenABI =====================
console.log("\n📝 Generating BondToken...");

const bondTokenABI = `/*
  This file is auto-generated.
  Command: 'npm run genabi'
*/
export const BondTokenABI = ${JSON.stringify({ abi: bondSystemData.abis.BondToken }, null, 2)} as const;
`;

fs.writeFileSync(path.join(outdir, "BondTokenABI.ts"), bondTokenABI, "utf-8");
console.log(`✅ Generated BondTokenABI.ts`);

// Generate BondTokenAddresses
const bondTokenAddresses = `/*
  This file is auto-generated.
  Command: 'npm run genabi'
*/
export const BondTokenAddresses = {
${Object.entries(bondSystemData)
  .filter(([key]) => key !== "abis")
  .map(([chainId, data]) => `  "${chainId}": {
    chainId: ${data.chainId},
    chainName: "${data.chainName}",
    address: "${data.contracts.BondToken.address}" as const,
    decimals: ${data.contracts.BondToken.decimals},
    name: "${data.contracts.BondToken.name}",
    symbol: "${data.contracts.BondToken.symbol}"
  }`)
  .join(",\n")}
} as const;

export function getBondTokenAddress(chainId: number): \`0x\${string}\` {
  const chain = BondTokenAddresses[chainId.toString() as keyof typeof BondTokenAddresses];
  if (!chain) {
    throw new Error(\`BondToken not deployed on chain \${chainId}\`);
  }
  return chain.address;
}
`;

fs.writeFileSync(path.join(outdir, "BondTokenAddresses.ts"), bondTokenAddresses, "utf-8");
console.log(`✅ Generated BondTokenAddresses.ts`);

// ===================== Generate USDCABI =====================
console.log("\n📝 Generating USDC...");

const usdcABI = `/*
  This file is auto-generated.
  Command: 'npm run genabi'
*/
export const USDCABI = ${JSON.stringify({ abi: bondSystemData.abis.USDC }, null, 2)} as const;
`;

fs.writeFileSync(path.join(outdir, "USDCABI.ts"), usdcABI, "utf-8");
console.log(`✅ Generated USDCABI.ts`);

// Generate USDCAddresses
const usdcAddresses = `/*
  This file is auto-generated.
  Command: 'npm run genabi'
*/
export const USDCAddresses = {
${Object.entries(bondSystemData)
  .filter(([key]) => key !== "abis")
  .map(([chainId, data]) => `  "${chainId}": {
    chainId: ${data.chainId},
    chainName: "${data.chainName}",
    address: "${data.contracts.USDC.address}" as const,
    decimals: ${data.contracts.USDC.decimals},
    name: "${data.contracts.USDC.name}",
    symbol: "${data.contracts.USDC.symbol}"
  }`)
  .join(",\n")}
} as const;

export function getUSDCAddress(chainId: number): \`0x\${string}\` {
  const chain = USDCAddresses[chainId.toString() as keyof typeof USDCAddresses];
  if (!chain) {
    throw new Error(\`USDC not deployed on chain \${chainId}\`);
  }
  return chain.address;
}
`;

fs.writeFileSync(path.join(outdir, "USDCAddresses.ts"), usdcAddresses, "utf-8");
console.log(`✅ Generated USDCAddresses.ts`);

// ===================== Generate contracts.ts (tổng hợp) =====================
const contractsTs = `/*
  This file is auto-generated.
  Command: 'npm run genabi'
*/
import { BondSeriesABI } from './BondSeriesABI';
import { BondSeriesAddresses, getBondSeriesAddress } from './BondSeriesAddresses';
import { BondTokenABI } from './BondTokenABI';
import { BondTokenAddresses, getBondTokenAddress } from './BondTokenAddresses';
import { USDCABI } from './USDCABI';
import { USDCAddresses, getUSDCAddress } from './USDCAddresses';

// Export tất cả ABIs
export const ABIs = {
  BondSeries: BondSeriesABI.abi,
  BondToken: BondTokenABI.abi,
  USDC: USDCABI.abi,
};

// Export tất cả Addresses
export const Addresses = {
  BondSeries: BondSeriesAddresses,
  BondToken: BondTokenAddresses,
  USDC: USDCAddresses,
};

// Export individual contracts
export { BondSeriesABI, BondSeriesAddresses, getBondSeriesAddress };
export { BondTokenABI, BondTokenAddresses, getBondTokenAddress };
export { USDCABI, USDCAddresses, getUSDCAddress };

// Arc Testnet chain ID
export const ARC_TESTNET_CHAIN_ID = 5042002;

// Helper to get all addresses for current chain
export function getContractAddresses(chainId: number = ARC_TESTNET_CHAIN_ID) {
  return {
    bondSeries: getBondSeriesAddress(chainId),
    bondToken: getBondTokenAddress(chainId),
    usdc: getUSDCAddress(chainId),
  };
}
`;

fs.writeFileSync(path.join(outdir, "contracts.ts"), contractsTs, "utf-8");
console.log(`✅ Generated contracts.ts (tổng hợp)`);

// ===================== Summary =====================
console.log(`\n${line}🎉 All done! Generated files:${line}`);
console.log(`   ✅ BondSeriesABI.ts`);
console.log(`   ✅ BondSeriesAddresses.ts`);
console.log(`   ✅ BondTokenABI.ts`);
console.log(`   ✅ BondTokenAddresses.ts`);
console.log(`   ✅ USDCABI.ts`);
console.log(`   ✅ USDCAddresses.ts`);
console.log(`   ✅ contracts.ts (tổng hợp)`);

console.log(`\n📝 Usage example:`);
console.log(`   import { ABIs, getContractAddresses } from '@/abi/contracts';`);
console.log(`   `);
console.log(`   const bondSeriesABI = ABIs.BondSeries;`);
console.log(`   const { bondSeries, bondToken, usdc } = getContractAddresses(5042002);`);
console.log(`   `);
console.log(`   // Use with wagmi:`);
console.log(`   const { data } = useReadContract({`);
console.log(`     address: bondSeries,`);
console.log(`     abi: ABIs.BondSeries,`);
console.log(`     functionName: 'getSeriesInfo'`);
console.log(`   });`);
console.log(`${line}`);
