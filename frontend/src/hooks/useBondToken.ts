import { useReadContract } from 'wagmi';
import { ABIs, getContractAddresses } from '@/abi/contracts';

const { bondToken: BOND_TOKEN_ADDRESS } = getContractAddresses();

/**
 * Read Hooks for BondToken (arcUSDC)
 */

// Get user arcUSDC balance
export function useBondTokenBalance(address?: `0x${string}`) {
  return useReadContract({
    address: BOND_TOKEN_ADDRESS,
    abi: ABIs.BondToken,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
  });
}

// Get total supply
export function useBondTokenTotalSupply() {
  return useReadContract({
    address: BOND_TOKEN_ADDRESS,
    abi: ABIs.BondToken,
    functionName: 'totalSupply',
  });
}

// Get decimals
export function useBondTokenDecimals() {
  return useReadContract({
    address: BOND_TOKEN_ADDRESS,
    abi: ABIs.BondToken,
    functionName: 'decimals',
  });
}

// Get symbol
export function useBondTokenSymbol() {
  return useReadContract({
    address: BOND_TOKEN_ADDRESS,
    abi: ABIs.BondToken,
    functionName: 'symbol',
  });
}

// Get name
export function useBondTokenName() {
  return useReadContract({
    address: BOND_TOKEN_ADDRESS,
    abi: ABIs.BondToken,
    functionName: 'name',
  });
}

