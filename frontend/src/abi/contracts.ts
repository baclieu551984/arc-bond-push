/*
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
