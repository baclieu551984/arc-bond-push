import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { ABIs, getContractAddresses } from '@/abi/contracts';
import { parseUnits } from 'viem';

const { usdc: USDC_ADDRESS, bondSeries: BOND_SERIES_ADDRESS } = getContractAddresses();

/**
 * Read Hooks for USDC
 */

// Get user USDC balance
export function useUSDCBalance(address?: `0x${string}`) {
  return useReadContract({
    address: USDC_ADDRESS,
    abi: ABIs.USDC,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
  });
}

// Get allowance (how much BondSeries can spend)
export function useUSDCAllowance(ownerAddress?: `0x${string}`) {
  return useReadContract({
    address: USDC_ADDRESS,
    abi: ABIs.USDC,
    functionName: 'allowance',
    args: ownerAddress ? [ownerAddress, BOND_SERIES_ADDRESS] : undefined,
  });
}

// Get USDC decimals
export function useUSDCDecimals() {
  return useReadContract({
    address: USDC_ADDRESS,
    abi: ABIs.USDC,
    functionName: 'decimals',
  });
}

// Get USDC symbol
export function useUSDCSymbol() {
  return useReadContract({
    address: USDC_ADDRESS,
    abi: ABIs.USDC,
    functionName: 'symbol',
  });
}

/**
 * Write Hooks for USDC
 */

// Approve BondSeries to spend USDC
export function useApproveUSDC() {
  const { data: hash, writeContract, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const approve = (amount: string) => {
    writeContract({
      address: USDC_ADDRESS,
      abi: ABIs.USDC,
      functionName: 'approve',
      args: [BOND_SERIES_ADDRESS, parseUnits(amount, 6)],
    });
  };

  return {
    approve,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

// Approve unlimited (max uint256)
export function useApproveUSDCMax() {
  const { data: hash, writeContract, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const approveMax = () => {
    const MAX_UINT256 = BigInt('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff');
    writeContract({
      address: USDC_ADDRESS,
      abi: ABIs.USDC,
      functionName: 'approve',
      args: [BOND_SERIES_ADDRESS, MAX_UINT256],
    });
  };

  return {
    approveMax,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

