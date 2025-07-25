// src/hooks/useAdminData.js
import { useState, useEffect, useCallback } from 'react';

// Dynamically import ethers
let ethers;
if (typeof window !== 'undefined') {
  ethers = require('ethers');
}

// Contract addresses
const CONTRACTS = {
  USDC: '0xd6842B6CfF83784aD53ef9a838F041ac2c337659',
  AVA: '0xA25Fd0C9906d124792b6F1909d3F3b52A4fb98aE',
  SEEDING: '0x507c0270c251C875CB350E6c1E806cb60a9a9970'
};

// Extended ABIs for admin monitoring
const SEEDING_ABI = [
  "function totalSold() external view returns (uint256)",
  "function maximumAllocation() external view returns (uint256)",
  "function getParticipantCount() external view returns (uint256)",
  "function seedingActive() external view returns (bool)",
  "function minimumPurchase() external view returns (uint256)",
  "function seedingPrice() external view returns (uint256)",
  "function getSeedingProgress() external view returns (uint256, uint256, uint256)",
  "function purchasedAmount(address) external view returns (uint256)",
  // Events for tracking
  "event TokensPurchased(address indexed buyer, uint256 usdcAmount, uint256 avaAmount)",
  "event SeedingStatusChanged(bool active)"
];

const AVA_ABI = [
  "function balanceOf(address) external view returns (uint256)",
  "function totalSupply() external view returns (uint256)",
  "function sellTaxRate() external view returns (uint256)",
  "function treasuryWallet() external view returns (address)",
  "function liquidityPool() external view returns (address)",
  // Events
  "event Transfer(address indexed from, address indexed to, uint256 value)"
];

const USDC_ABI = [
  "function balanceOf(address) external view returns (uint256)",
  "function totalSupply() external view returns (uint256)"
];

export const useAdminData = () => {
  // State
  const [data, setData] = useState({
    totalInvestments: '0',
    totalInvestors: 0,
    totalAvaIssued: '0',
    currentAvaPrice: '1.00',
    totalRevenue: '0',
    progressPercent: 0,
    seedingActive: false,
    strategiesPerformance: {
      ethereum: { allocated: '0', apy: 0, status: 'inactive' },
      baseEcosystem: { allocated: '0', apy: 0, status: 'inactive' },
      tokenLiquidity: { allocated: '0', apy: 0, status: 'inactive' }
    },
    recentInvestors: [],
    monthlyData: [],
    systemHealth: {
      seedingContract: 'unknown',
      avaToken: 'unknown',
      tradingBots: 'unknown'
    }
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [lastUpdate, setLastUpdate] = useState(null);

  // Contract instances
  const [contracts, setContracts] = useState({
    seeding: null,
    ava: null,
    usdc: null,
    provider: null
  });

  // Initialize provider and contracts
  const initializeContracts = useCallback(async () => {
    try {
      if (!window.ethereum || !ethers) return;

      const provider = new ethers.BrowserProvider(window.ethereum);
      const seeding = new ethers.Contract(CONTRACTS.SEEDING, SEEDING_ABI, provider);
      const ava = new ethers.Contract(CONTRACTS.AVA, AVA_ABI, provider);
      const usdc = new ethers.Contract(CONTRACTS.USDC, USDC_ABI, provider);

      setContracts({ seeding, ava, usdc, provider });
      return { seeding, ava, usdc, provider };
    } catch (error) {
      console.error('Failed to initialize contracts:', error);
      setError('Failed to connect to blockchain');
      return null;
    }
  }, []);

  // Fetch basic contract data
  const fetchBasicData = useCallback(async (contractInstances) => {
    const { seeding, ava, usdc } = contractInstances || contracts;
    if (!seeding || !ava || !usdc || !ethers) return null;

    try {
      const [
        totalSold,
        maxAllocation,
        participantCount,
        seedingActive,
        minimumPurchase,
        progress,
        avaSupply,
        sellTaxRate
      ] = await Promise.all([
        seeding.totalSold(),
        seeding.maximumAllocation(),
        seeding.getParticipantCount(),
        seeding.seedingActive(),
        seeding.minimumPurchase(),
        seeding.getSeedingProgress(),
        ava.totalSupply(),
        ava.sellTaxRate()
      ]);

      return {
        totalSold: ethers.formatEther(totalSold),
        maxAllocation: ethers.formatEther(maxAllocation),
        participantCount: Number(participantCount),
        seedingActive,
        minimumPurchase: ethers.formatEther(minimumPurchase),
        progressPercent: Number(progress[2]),
        avaSupply: ethers.formatEther(avaSupply),
        sellTaxRate: Number(sellTaxRate) / 100
      };
    } catch (error) {
      console.error('Error fetching basic data:', error);
      throw error;
    }
  }, [contracts]);

  // Fetch recent transactions/investors
  const fetchRecentInvestors = useCallback(async (contractInstances) => {
    const { seeding, provider } = contractInstances || contracts;
    if (!seeding || !provider) return [];

    try {
      // Get recent TokensPurchased events (last 1000 blocks)
      const currentBlock = await provider.getBlockNumber();
      const fromBlock = Math.max(0, currentBlock - 1000);

      const filter = seeding.filters.TokensPurchased();
      const events = await seeding.queryFilter(filter, fromBlock, currentBlock);

      // Process events to get recent investors
      const recentInvestors = await Promise.all(
        events.slice(-10).reverse().map(async (event) => {
          const block = await provider.getBlock(event.blockNumber);
          return {
            address: event.args.buyer,
            amount: ethers.formatUnits(event.args.usdcAmount, 6),
            tokens: ethers.formatEther(event.args.avaAmount),
            date: new Date(block.timestamp * 1000).toISOString(),
            txHash: event.transactionHash
          };
        })
      );

      return recentInvestors;
    } catch (error) {
      console.error('Error fetching recent investors:', error);
      return [];
    }
  }, [contracts]);

  // Calculate strategy performance (mock for now - you'll implement real calculation)
  const calculateStrategyPerformance = useCallback((totalInvestments) => {
    const total = parseFloat(totalInvestments);
    return {
      ethereum: {
        allocated: (total * 0.5).toString(),
        apy: 27.3,
        status: 'active'
      },
      baseEcosystem: {
        allocated: (total * 0.35).toString(),
        apy: 45.7,
        status: 'active'
      },
      tokenLiquidity: {
        allocated: (total * 0.15).toString(),
        apy: 12.1,
        status: 'active'
      }
    };
  }, []);

  // Check system health
  const checkSystemHealth = useCallback(async (contractInstances) => {
    const { seeding, ava } = contractInstances || contracts;
    
    try {
      const health = {
        seedingContract: 'healthy',
        avaToken: 'healthy',
        tradingBots: 'healthy'
      };

      // Test contract calls
      if (seeding) {
        await seeding.seedingActive();
      } else {
        health.seedingContract = 'error';
      }

      if (ava) {
        await ava.totalSupply();
      } else {
        health.avaToken = 'error';
      }

      return health;
    } catch (error) {
      console.error('System health check failed:', error);
      return {
        seedingContract: 'error',
        avaToken: 'error',
        tradingBots: 'warning'
      };
    }
  }, [contracts]);

  // Main data fetching function
  const fetchAllData = useCallback(async () => {
    setIsLoading(true);
    setError('');

    try {
      // Initialize contracts if not already done
      const contractInstances = contracts.seeding ? contracts : await initializeContracts();
      if (!contractInstances) {
        throw new Error('Failed to initialize contracts');
      }

      // Fetch all data in parallel
      const [basicData, recentInvestors, systemHealth] = await Promise.all([
        fetchBasicData(contractInstances),
        fetchRecentInvestors(contractInstances),
        checkSystemHealth(contractInstances)
      ]);

      if (!basicData) {
        throw new Error('Failed to fetch basic contract data');
      }

      // Calculate derived metrics
      const totalInvestments = parseFloat(basicData.totalSold); // 1:1 ratio USDC:AVA
      const estimatedRevenue = totalInvestments * 0.25; // Estimated 25% APY
      const strategiesPerformance = calculateStrategyPerformance(totalInvestments);

      // Update state
      setData({
        totalInvestments: totalInvestments.toString(),
        totalInvestors: basicData.participantCount,
        totalAvaIssued: basicData.totalSold,
        currentAvaPrice: '1.00', // Initial price, will be dynamic later
        totalRevenue: estimatedRevenue.toString(),
        progressPercent: basicData.progressPercent,
        seedingActive: basicData.seedingActive,
        strategiesPerformance,
        recentInvestors,
        monthlyData: [], // Will implement historical data tracking
        systemHealth
      });

      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error fetching admin data:', error);
      setError(error.message || 'Failed to fetch data');
    } finally {
      setIsLoading(false);
    }
  }, [contracts, initializeContracts, fetchBasicData, fetchRecentInvestors, checkSystemHealth, calculateStrategyPerformance]);

  // Get specific investor data
  const getInvestorData = useCallback(async (address) => {
    const { seeding, ava } = contracts;
    if (!seeding || !ava || !ethers) return null;

    try {
      const [purchasedAmount, avaBalance] = await Promise.all([
        seeding.purchasedAmount(address),
        ava.balanceOf(address)
      ]);

      return {
        address,
        purchasedAmount: ethers.formatEther(purchasedAmount),
        currentBalance: ethers.formatEther(avaBalance),
        investmentDate: null // Would need to track this separately
      };
    } catch (error) {
      console.error('Error fetching investor data:', error);
      return null;
    }
  }, [contracts]);

  // Export data function
  const exportData = useCallback((format = 'json') => {
    const exportData = {
      timestamp: new Date().toISOString(),
      summary: {
        totalInvestments: data.totalInvestments,
        totalInvestors: data.totalInvestors,
        totalAvaIssued: data.totalAvaIssued,
        progressPercent: data.progressPercent,
        seedingActive: data.seedingActive
      },
      strategies: data.strategiesPerformance,
      recentInvestors: data.recentInvestors,
      systemHealth: data.systemHealth
    };

    if (format === 'csv') {
      // Convert to CSV format
      const csvContent = [
        'Address,Investment Amount,AVA Tokens,Date',
        ...data.recentInvestors.map(inv => 
          `${inv.address},${inv.amount},${inv.tokens},${inv.date}`
        )
      ].join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `avalon-admin-export-${Date.now()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      // JSON format
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `avalon-admin-export-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    }
  }, [data]);

  // Initialize on mount
  useEffect(() => {
    initializeContracts();
  }, [initializeContracts]);

  // Fetch data when contracts are ready
  useEffect(() => {
    if (contracts.seeding) {
      fetchAllData();
    }
  }, [contracts.seeding, fetchAllData]);

  return {
    data,
    isLoading,
    error,
    lastUpdate,
    refreshData: fetchAllData,
    getInvestorData,
    exportData,
    contracts
  };
};