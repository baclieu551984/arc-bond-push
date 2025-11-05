import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { ABIs, getContractAddresses } from '@/abi/contracts';
import { parseUnits } from 'viem';

const { bondSeries: BOND_SERIES_ADDRESS } = getContractAddresses();

/**
 * Read Hooks
 */

// Get all series info (maturityDate, totalDeposited, totalSupply, recordCount, cumulativeIndex, emergencyMode)
export function useBondSeriesInfo() {
  return useReadContract({
    address: BOND_SERIES_ADDRESS,
    abi: ABIs.BondSeries,
    functionName: 'getSeriesInfo',
  });
}

// Get next record time
export function useNextRecordTime() {
  return useReadContract({
    address: BOND_SERIES_ADDRESS,
    abi: ABIs.BondSeries,
    functionName: 'nextRecordTime',
  });
}

// Get record count
export function useRecordCount() {
  return useReadContract({
    address: BOND_SERIES_ADDRESS,
    abi: ABIs.BondSeries,
    functionName: 'recordCount',
  });
}

// Get last distributed record
export function useLastDistributedRecord() {
  return useReadContract({
    address: BOND_SERIES_ADDRESS,
    abi: ABIs.BondSeries,
    functionName: 'lastDistributedRecord',
  });
}

// Get claimable amount for user
export function useClaimableAmount(address?: `0x${string}`) {
  return useReadContract({
    address: BOND_SERIES_ADDRESS,
    abi: ABIs.BondSeries,
    functionName: 'claimableAmount',
    args: address ? [address] : undefined,
  });
}

// Get treasury status [balance, reserved, withdrawable]
export function useTreasuryStatus() {
  return useReadContract({
    address: BOND_SERIES_ADDRESS,
    abi: ABIs.BondSeries,
    functionName: 'getTreasuryStatus',
  });
}

// Get paused status
export function useIsPaused() {
  return useReadContract({
    address: BOND_SERIES_ADDRESS,
    abi: ABIs.BondSeries,
    functionName: 'paused',
  });
}

// Get emergency redeem enabled status
export function useEmergencyRedeemEnabled() {
  return useReadContract({
    address: BOND_SERIES_ADDRESS,
    abi: ABIs.BondSeries,
    functionName: 'emergencyRedeemEnabled',
  });
}

// Check if address has DEFAULT_ADMIN_ROLE
export function useIsAdmin(address?: `0x${string}`) {
  const DEFAULT_ADMIN_ROLE = '0x0000000000000000000000000000000000000000000000000000000000000000' as const;
  
  return useReadContract({
    address: BOND_SERIES_ADDRESS,
    abi: ABIs.BondSeries,
    functionName: 'hasRole',
    args: address ? [DEFAULT_ADMIN_ROLE, address] : undefined,
  });
}

/**
 * Write Hooks
 */

// Deposit USDC to receive arcUSDC
export function useDeposit() {
  const { data: hash, writeContract, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const deposit = (usdcAmount: string) => {
    writeContract({
      address: BOND_SERIES_ADDRESS,
      abi: ABIs.BondSeries,
      functionName: 'deposit',
      args: [parseUnits(usdcAmount, 6)], // USDC 6 decimals
    });
  };

  return {
    deposit,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

// Claim coupon
export function useClaimCoupon() {
  const { data: hash, writeContract, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const claimCoupon = () => {
    writeContract({
      address: BOND_SERIES_ADDRESS,
      abi: ABIs.BondSeries,
      functionName: 'claimCoupon',
    });
  };

  return {
    claimCoupon,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

// Redeem arcUSDC for USDC at maturity
export function useRedeem() {
  const { data: hash, writeContract, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const redeem = (bondAmount: string) => {
    writeContract({
      address: BOND_SERIES_ADDRESS,
      abi: ABIs.BondSeries,
      functionName: 'redeem',
      args: [parseUnits(bondAmount, 6)], // arcUSDC 6 decimals
    });
  };

  return {
    redeem,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

/**
 * Admin Write Hooks
 */

// Record snapshot (Keeper only)
export function useRecordSnapshot() {
  const { data: hash, writeContract, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const recordSnapshot = () => {
    writeContract({
      address: BOND_SERIES_ADDRESS,
      abi: ABIs.BondSeries,
      functionName: 'recordSnapshot',
    });
  };

  return {
    recordSnapshot,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

// Distribute coupon (Owner only)
export function useDistributeCoupon() {
  const { data: hash, writeContract, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const distributeCoupon = (amount: string) => {
    writeContract({
      address: BOND_SERIES_ADDRESS,
      abi: ABIs.BondSeries,
      functionName: 'distributeCoupon',
      args: [parseUnits(amount, 6)],
    });
  };

  return {
    distributeCoupon,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

// Owner withdraw
export function useOwnerWithdraw() {
  const { data: hash, writeContract, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const ownerWithdraw = (amount: string) => {
    writeContract({
      address: BOND_SERIES_ADDRESS,
      abi: ABIs.BondSeries,
      functionName: 'ownerWithdraw',
      args: [parseUnits(amount, 6)],
    });
  };

  return {
    ownerWithdraw,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

// Pause contract
export function usePause() {
  const { data: hash, writeContract, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const pause = () => {
    writeContract({
      address: BOND_SERIES_ADDRESS,
      abi: ABIs.BondSeries,
      functionName: 'pause',
    });
  };

  return {
    pause,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

// Unpause contract
export function useUnpause() {
  const { data: hash, writeContract, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const unpause = () => {
    writeContract({
      address: BOND_SERIES_ADDRESS,
      abi: ABIs.BondSeries,
      functionName: 'unpause',
    });
  };

  return {
    unpause,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

