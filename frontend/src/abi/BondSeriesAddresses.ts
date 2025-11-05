/*
  This file is auto-generated.
  Command: 'npm run genabi'
*/
export const BondSeriesAddresses = {
  "5042002": {
    chainId: 5042002,
    chainName: "arc",
    address: "0xF501820e6C95c84b7607AEE41b422FEc497AC7FE" as const,
    maturityHours: 336
  }
} as const;

export function getBondSeriesAddress(chainId: number): `0x${string}` {
  const chain = BondSeriesAddresses[chainId.toString() as keyof typeof BondSeriesAddresses];
  if (!chain) {
    throw new Error(`BondSeries not deployed on chain ${chainId}`);
  }
  return chain.address;
}
