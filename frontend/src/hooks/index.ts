/**
 * ArcBond Wagmi Hooks
 * 
 * Usage:
 * import { useBondSeriesInfo, useDeposit, useDashboardData } from '@/hooks';
 */

// BondSeries hooks
export {
  // Read
  useBondSeriesInfo,
  useNextRecordTime,
  useRecordCount,
  useLastDistributedRecord,
  useClaimableAmount,
  useTreasuryStatus,
  useIsPaused,
  useEmergencyRedeemEnabled,
  useIsAdmin,
  
  // Write (User)
  useDeposit,
  useClaimCoupon,
  useRedeem,
  
  // Write (Admin)
  useRecordSnapshot,
  useDistributeCoupon,
  useOwnerWithdraw,
  usePause,
  useUnpause,
} from './useBondSeries';

// BondToken hooks
export {
  useBondTokenBalance,
  useBondTokenTotalSupply,
  useBondTokenDecimals,
  useBondTokenSymbol,
  useBondTokenName,
} from './useBondToken';

// USDC hooks
export {
  useUSDCBalance,
  useUSDCAllowance,
  useUSDCDecimals,
  useUSDCSymbol,
  useApproveUSDC,
  useApproveUSDCMax,
} from './useUSDC';

// Combined helper hooks
export {
  useDashboardData,
  usePortfolioData,
  useAdminData,
} from './useArcBond';

