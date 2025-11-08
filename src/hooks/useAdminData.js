// src/hooks/useAdminData.js - WHITEPAPER ALIGNED
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
  SEEDING: '0x6DfD909Be557Ed5a6ec4C5c4375a3b9F3f40D33d'
};

// Whitepaper-aligned configuration
const WHITEPAPER_CONFIG = {
  strategies: {
    bitcoin: {
      allocation: 0.80,
      totalAPY: 0.47, // 47% total NAV + profits
      extractableAPY: 0.273, // 27.3% extractable yearly
      name: 'Bitcoin Adaptive Rebalancing (BARS)'
    },
    tokenLiquidity: {
      allocation: 0.20,
      estimatedAPY: 0.085, // 8.5% from fees
      name: 'Token Liquidity Management'
    }
  },
  revenue: {
    initialBuybackRate: 0.70,
    finalBuybackRate: 0.85,
    transitionAt: 0.70 // 70% token sale
  }
};

// Contract ABIs
const SEEDING_ABI = [
  "function totalSold() external view returns (uint256)",
  "function maximumAllocation() external view returns (uint256)",
  "function getParticipantCount() external view returns (uint256)",
  "function getParticipant(uint256) external view returns (address)",
  "function seedingActive() external view returns (bool)",
  "function minimumPurchase() external view returns (uint256)",
  "function getSeedingProgress() external view returns (uint256, uint256, uint256)",
  "function purchasedAmount(address) external view returns (uint256)",
  "event TokensPurchased(address indexed buyer, uint256 usdcAmount, uint256 avalonAmount)"
];

const AVA_ABI = [
  "function balanceOf(address) external view returns (uint256)",
  "function totalSupply() external view returns (uint256)",
  "function sellTaxRate() external view returns (uint256)",
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
      bitcoin: { allocated: '0', totalAPY: 47, extractableAPY: 27.3, status: 'inactive' },
      tokenLiquidity: { allocated: '0', apy: 8.5, status: 'inactive' }
    },
    recentInvestors: [],
    systemHealth: {
      seedingContract: 'unknown',
      avaToken: 'unknown',
      tradingBots: 'unknown'
    },
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
    const { seeding, ava } = contractInstances || contracts;
    if (!seeding || !ava || !ethers) return null;

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

  // Fetch recent investors
  const fetchRecentInvestors = useCallback(async (contractInstances) => {
    const { seeding, provider } = contractInstances || contracts;
    if (!seeding || !provider) return [];

    try {
      const currentBlock = await provider.getBlockNumber();
      const fromBlock = Math.max(0, currentBlock - 1000);

      const filter = seeding.filters.TokensPurchased();
      const events = await seeding.queryFilter(filter, fromBlock, currentBlock);

      const recentInvestors = await Promise.all(
        events.slice(-10).reverse().map(async (event) => {
          const block = await provider.getBlock(event.blockNumber);
          return {
            address: event.args.buyer,
            amount: ethers.formatUnits(event.args.usdcAmount, 6),
            tokens: ethers.formatEther(event.args.avalonAmount),
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

  // Calculate strategy performance - WHITEPAPER ALIGNED
  const calculateStrategyPerformance = useCallback((totalInvestments, progressPercent) => {
    const total = parseFloat(totalInvestments);
    
    // Calculate current revenue distribution based on sale progress
    const saleProgress = progressPercent / 100;
    const buybackRate = saleProgress >= WHITEPAPER_CONFIG.revenue.transitionAt ?
      WHITEPAPER_CONFIG.revenue.finalBuybackRate :
      WHITEPAPER_CONFIG.revenue.initialBuybackRate;

    // Bitcoin BARS Strategy (80% allocation)
    const bitcoinAllocated = total * WHITEPAPER_CONFIG.strategies.bitcoin.allocation;
    const bitcoinExtractableYearly = bitcoinAllocated * WHITEPAPER_CONFIG.strategies.bitcoin.extractableAPY;
    
    // Token Liquidity (20% allocation)
    const liquidityAllocated = total * WHITEPAPER_CONFIG.strategies.tokenLiquidity.allocation;
    const liquidityYearly = liquidityAllocated * WHITEPAPER_CONFIG.strategies.tokenLiquidity.estimatedAPY;

    // Combined revenue
    const totalYearlyRevenue = bitcoinExtractableYearly + liquidityYearly;
    const toBuybacks = totalYearlyRevenue * buybackRate;
    const toOperations = totalYearlyRevenue * (1 - buybackRate);

    return {
      bitcoin: {
        allocated: bitcoinAllocated.toFixed(2),
        totalAPY: WHITEPAPER_CONFIG.strategies.bitcoin.totalAPY * 100, // 47%
        extractableAPY: WHITEPAPER_CONFIG.strategies.bitcoin.extractableAPY * 100, // 27.3%
        yearlyExtractable: bitcoinExtractableYearly.toFixed(2),
        monthlyAvg: (bitcoinExtractableYearly / 12).toFixed(2),
        status: 'active',
        name: WHITEPAPER_CONFIG.strategies.bitcoin.name
      },
      tokenLiquidity: {
        allocated: liquidityAllocated.toFixed(2),
        apy: WHITEPAPER_CONFIG.strategies.tokenLiquidity.estimatedAPY * 100, // 8.5%
        yearlyRevenue: liquidityYearly.toFixed(2),
        monthlyAvg: (liquidityYearly / 12).toFixed(2),
        status: 'active',
        name: WHITEPAPER_CONFIG.strategies.tokenLiquidity.name
      },
      combined: {
        totalYearlyRevenue: totalYearlyRevenue.toFixed(2),
        toBuybacks: toBuybacks.toFixed(2),
        toOperations: toOperations.toFixed(2),
        buybackRate: (buybackRate * 100).toFixed(0),
        operationsRate: ((1 - buybackRate) * 100).toFixed(0),
        effectiveAPY: ((totalYearlyRevenue / total) * 100).toFixed(2)
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

      // Calculate derived metrics with whitepaper alignment
      const totalInvestments = parseFloat(basicData.totalSold);
      const strategiesPerformance = calculateStrategyPerformance(totalInvestments, basicData.progressPercent);

      // Update state with whitepaper-aligned data
      const newData = {
        totalInvestments: totalInvestments.toString(),
        totalInvestors: basicData.participantCount,
        totalAvaIssued: basicData.totalSold,
        currentAvaPrice: '1.00',
        totalRevenue: strategiesPerformance.combined.totalYearlyRevenue,
        progressPercent: basicData.progressPercent,
        seedingActive: basicData.seedingActive,
        strategiesPerformance,
        recentInvestors,
        systemHealth,
        whitepaperMetrics: {
          bitcoinTotalAPY: '47%',
          bitcoinExtractableAPY: '27.3%',
          backtestPeriod: '2021-2025',
          finalNAV: '$12.495M',
          initialNAV: '$2M',
          sellTax: '8%',
          maxVolumeBonus: '8%'
        }
      };

      setData(newData);
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
        investmentDate: null
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
      systemHealth: data.systemHealth,
      whitepaperAlignment: {
        bitcoinAllocation: '80%',
        liquidityAllocation: '20%',
        totalAPY: '47%',
        extractableAPY: '27.3%',
        buybacksInitial: '70%',
        buybacksFinal: '85%'
      }
    };

    if (format === 'csv') {
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
    contracts,
    whitepaperConfig: WHITEPAPER_CONFIG // Expose config for reference
  };
};