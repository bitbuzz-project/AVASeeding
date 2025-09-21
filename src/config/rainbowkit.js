// src/config/rainbowkit.js - MINIMAL CONFIG WITHOUT METAMASK SDK
import '@rainbow-me/rainbowkit/styles.css';
import { connectorsForWallets } from '@rainbow-me/rainbowkit';
import { 
  coinbaseWallet, 
  walletConnectWallet,
  trustWallet,
  rainbowWallet,
} from '@rainbow-me/rainbowkit/wallets';
import { createConfig, http } from 'wagmi';
import { baseSepolia } from 'wagmi/chains';

// Replace with your actual WalletConnect Project ID
const WALLETCONNECT_PROJECT_ID = '21587c287e2cb3c78ed0490d75c0cd1e';

// Only use wallets that don't require MetaMask SDK
const connectors = connectorsForWallets(
  [
    {
      groupName: 'Recommended',
      wallets: [
        coinbaseWallet,
        walletConnectWallet,
        trustWallet,
        rainbowWallet,
      ],
    },
  ],
  {
    appName: 'Avalon Token',
    projectId: WALLETCONNECT_PROJECT_ID,
  }
);

export const config = createConfig({
  connectors,
  chains: [baseSepolia],
  transports: {
    [baseSepolia.id]: http(),
  },
});

// Contract addresses for easy access
export const CONTRACTS = {
  USDC: '0xd6842B6CfF83784aD53ef9a838F041ac2c337659',
  AVA: '0xA25Fd0C9906d124792b6F1909d3F3b52A4fb98aE',
  SEEDING: '0x6DfD909Be557Ed5a6ec4C5c4375a3b9F3f40D33d'
};

// ABIs
export const SEEDING_ABI = [
  "function purchaseTokens(uint256 usdcAmount) external",
  "function getQuote(uint256 usdcAmount) external view returns (uint256, uint256, uint256)",
  "function claimBonusTokens() external",
  "function getBonusTokenInfo(address) external view returns (uint256, uint256, bool)",
  "function seedingActive() external view returns (bool)",
  "function totalSold() external view returns (uint256)",
  "function maximumAllocation() external view returns (uint256)",
  "function minimumPurchase() external view returns (uint256)",
  "function purchasedAmount(address) external view returns (uint256)",
  "function getSeedingProgress() external view returns (uint256, uint256, uint256)",
  "function getParticipantCount() external view returns (uint256)"
];

export const AVA_ABI = [
  "function balanceOf(address) external view returns (uint256)",
  "function totalSupply() external view returns (uint256)",
  "function sellTaxRate() external view returns (uint256)"
];

export const USDC_ABI = [
  "function balanceOf(address) external view returns (uint256)",
  "function approve(address, uint256) external returns (bool)",
  "function allowance(address, address) external view returns (uint256)",
  "function getTestTokens() external"
];