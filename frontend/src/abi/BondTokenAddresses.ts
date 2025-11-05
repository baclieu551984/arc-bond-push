/*
  This file is auto-generated.
  Command: 'npm run genabi'
*/
export const BondTokenAddresses = {
  "5042002": {
    chainId: 5042002,
    chainName: "arc",
    address: "0xC7d8a4722b01FDBe8E36D8b0831211Ae9c2D151F" as const,
    decimals: 6,
    name: "ArcBond USDC",
    symbol: "arcUSDC"
  }
} as const;

export function getBondTokenAddress(chainId: number): `0x${string}` {
  const chain = BondTokenAddresses[chainId.toString() as keyof typeof BondTokenAddresses];
  if (!chain) {
    throw new Error(`BondToken not deployed on chain ${chainId}`);
  }
  return chain.address;
}
