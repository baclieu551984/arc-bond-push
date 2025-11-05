import { createConfig, http } from 'wagmi';
import { sepolia } from 'wagmi/chains';
import { defineChain } from 'viem';
import { injected } from 'wagmi/connectors';

// Define Arc Testnet (Main network)
export const arcTestnet = defineChain({
  id: 5042002,
  name: 'Arc Testnet',
  nativeCurrency: {
    name: 'USDC',
    symbol: 'USDC',
    decimals: 18,
  },
  rpcUrls: {
    default: { http: [process.env.NEXT_PUBLIC_ARC_RPC_URL || 'https://rpc.testnet.arc.network'] },
  },
  blockExplorers: {
    default: { name: 'ArcScan', url: 'https://testnet.arcscan.app' },
  },
  testnet: true,
});

// Supported chains (Arc is primary, Sepolia is secondary)
export const chains = [arcTestnet, sepolia] as const;

// Network configs for UI (centralized)
export const networksConfig = [
  {
    id: arcTestnet.id,
    name: arcTestnet.name,
    icon: '/arc.svg',
  },
  {
    id: sepolia.id,
    name: sepolia.name,
    icon: '/eth.svg',
  },
] as const;

// Wagmi configuration
export const wagmiConfig = createConfig({
  chains,
  connectors: [
    // injected() tự động detect: MetaMask, OKX, Coinbase, Trust, etc.
    injected(),
  ],
  transports: {
    [arcTestnet.id]: http(process.env.NEXT_PUBLIC_ARC_RPC_URL || 'https://rpc.testnet.arc.network'),
    [sepolia.id]: http(process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL || 'https://ethereum-sepolia.publicnode.com'),
  },
  ssr: false,
});
