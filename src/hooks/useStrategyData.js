// src/hooks/useStrategyData.js - UPDATED WITH NEW ALLOCATIONS
import { useState, useCallback, useEffect } from 'react';

// Contract addresses and strategy configurations - UPDATED
const STRATEGY_CONFIG = {
  bitcoin: {
    allocation: 0.35, // 35% of total funds (was ethereum 50%)
    targetExposure: 0.70, // 70% BTC, 30% USDC
    rebalanceThreshold: 0.09, // 9% deviation triggers rebalance (was 10%)
    name: 'Bitcoin Maximum Exposure Rebalancing System'
  },
  baseLP: {
    allocation: 0.45, // 45% of total funds (was 35%)
    name: 'Base Ecosystem Liquidity Provisioning'
  },
  tokenLiquidity: {
    allocation: 0.20, // 20% of total funds (was 15%)
    name: 'AVA Token Liquidity Management'
  }
};

export const useStrategyData = () => {
  const [strategyData, setStrategyData] = useState({
    bitcoin: null,
    baseLP: null,
    tokenLiquidity: null,
    systemMetrics: null
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [lastUpdate, setLastUpdate] = useState(null);

  // Contract instances for on-chain data
  const [contracts, setContracts] = useState({
    ava: null,
    usdc: null,
    provider: null
  });

  // Initialize contracts
  const initializeContracts = useCallback(async () => {
    try {
      if (!window.ethereum || !window.ethers) return null;

      const ethers = window.ethers;
      const provider = new ethers.BrowserProvider(window.ethereum);
      
      const avaContract = new ethers.Contract(
        '0xA25Fd0C9906d124792b6F1909d3F3b52A4fb98aE',
        ['function balanceOf(address) external view returns (uint256)'],
        provider
      );

      const usdcContract = new ethers.Contract(
        '0xd6842B6CfF83784aD53ef9a838F041ac2c337659',
        ['function balanceOf(address) external view returns (uint256)'],
        provider
      );

      const contractInstances = { ava: avaContract, usdc: usdcContract, provider };
      setContracts(contractInstances);
      return contractInstances;
    } catch (error) {
      console.error('Failed to initialize contracts:', error);
      return null;
    }
  }, []);

  // Fetch Bitcoin price and market data
  const fetchBitcoinData = useCallback(async () => {
    try {
      // Mock Bitcoin data - in production, fetch from CoinGecko or other APIs
      const mockData = {
        currentPrice: 95000 + (Math.random() - 0.5) * 5000, // Simulate price movement around $95k
        volume24h: 18000000000 + Math.random() * 3000000000,
        volatility: 0.18 + Math.random() * 0.08, // Bitcoin typically 15-25% volatility
        marketCap: 1900000000000 // ~$1.9T market cap
      };

      return mockData;
    } catch (error) {
      console.error('Error fetching Bitcoin data:', error);
      return null;
    }
  }, []);

  // Fetch Base ecosystem LP data
  const fetchBaseLPData = useCallback(async () => {
    try {
      // Mock Base ecosystem data - updated pairs and performance
      const mockPairs = [
        { name: 'WETH-USDC', apr: 78.2, tvl: 850000, fees24h: 2200 },
        { name: 'WETH/REI', apr: 124.5, tvl: 420000, fees24h: 1850 },
        { name: 'CLANKER/WETH', apr: 67.8, tvl: 380000, fees24h: 950 },
        { name: 'USDC/MOCHI', apr: 134.7, tvl: 295000, fees24h: 1200 },
        { name: 'ZORA/USDC', apr: 214.2, tvl: 180000, fees24h: 980 },
        { name: 'MAMO/USDC', apr: 147.9, tvl: 220000, fees24h: 890 },
        { name: 'BANKR/USDC', apr: 77.4, tvl: 315000, fees24h: 760 },
        { name: 'USDC/CBBTC', apr: 5.7, tvl: 1200000, fees24h: 450 }
      ];

      const totalTVL = mockPairs.reduce((sum, pair) => sum + pair.tvl, 0);
      const totalFees24h = mockPairs.reduce((sum, pair) => sum + pair.fees24h, 0);
      const weightedAPR = mockPairs.reduce((sum, pair) => sum + (pair.apr * pair.tvl), 0) / totalTVL;

      return {
        pairs: mockPairs,
        totalTVL,
        totalFees24h,
        averageAPR: weightedAPR,
        topPerforming: mockPairs.reduce((top, current) => current.apr > top.apr ? current : top)
      };
    } catch (error) {
      console.error('Error fetching Base LP data:', error);
      return null;
    }
  }, []);

  // Calculate strategy performance metrics
  const calculateStrategyMetrics = useCallback((strategyType, rawData, allocation) => {
    if (!rawData) return null;

    const baseMetrics = {
      allocation,
      status: 'active',
      health: 'excellent',
      botStatus: 'running'
    };

    switch (strategyType) {
      case 'bitcoin': {
        // Calculate B-MERS specific metrics
        const currentExposure = 0.70 + (Math.random() - 0.5) * 0.08; // Simulate exposure drift
        const isRebalanceNeeded = Math.abs(currentExposure - STRATEGY_CONFIG.bitcoin.targetExposure) > STRATEGY_CONFIG.bitcoin.rebalanceThreshold;
        
        // Updated performance simulation based on whitepaper
        const dailyReturn = (Math.random() - 0.47) * 0.018; // Slightly positive bias
        const weeklyReturn = dailyReturn * 7 + (Math.random() - 0.5) * 0.008;
        const monthlyReturn = weeklyReturn * 4.33 + (Math.random() - 0.45) * 0.015;
        const ytdReturn = monthlyReturn * 12 + (Math.random() - 0.38) * 0.04;
        const apy = 0.211 + (Math.random() - 0.5) * 0.02; // 21.1% base APY from whitepaper

        return {
          ...baseMetrics,
          name: STRATEGY_CONFIG.bitcoin.name,
          shortName: 'B-MERS',
          targetExposure: STRATEGY_CONFIG.bitcoin.targetExposure,
          currentExposure,
          rebalanceThreshold: STRATEGY_CONFIG.bitcoin.rebalanceThreshold,
          isRebalanceNeeded,
          nextRebalanceEstimate: isRebalanceNeeded ? 
            new Date(Date.now() + 30 * 60 * 1000) : // 30 minutes if needed
            new Date(Date.now() + 4 * 60 * 60 * 1000), // 4 hours if not needed
          apy: apy * 100,
          ytdReturn: ytdReturn * 100,
          monthlyReturn: monthlyReturn * 100,
          weeklyReturn: weeklyReturn * 100,
          dailyReturn: dailyReturn * 100,
          volatility: rawData.volatility,
          sharpeRatio: (apy * 100) / (rawData.volatility * 100),
          maxDrawdown: 0.06 + Math.random() * 0.04, // Lower drawdown for Bitcoin
          totalTrades: 1247 + Math.floor(Math.random() * 15), // More trades for Bitcoin
          successRate: 94 + Math.random() * 4, // Higher success rate
          totalProfit: allocation * apy,
          unrealizedPnL: allocation * dailyReturn,
          realizedPnL: allocation * (apy - dailyReturn),
          lastRebalance: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
          alerts: []
        };
      }

      case 'baseLP': {
        const totalFees7d = rawData.totalFees24h * 7 * (0.85 + Math.random() * 0.3);
        const totalFeesMonth = totalFees7d * 4.33 * (0.9 + Math.random() * 0.2);
        const impermanentLoss = allocation * -0.003 * (Math.random() + 0.3); // Reduced IL
        const netProfit = totalFeesMonth - Math.abs(impermanentLoss);

        // Updated APR range from whitepaper (25-75%)
        const currentAPR = 35 + Math.random() * 40; // 35-75% range

        return {
          ...baseMetrics,
          name: STRATEGY_CONFIG.baseLP.name,
          shortName: 'BE-LP',
          totalTVL: rawData.totalTVL,
          averageAPR: currentAPR,
          targetAPRRange: '25-75%',
          topPerformingPair: rawData.topPerforming.name,
          topPerformingAPR: rawData.topPerforming.apr,
          totalFees24h: rawData.totalFees24h,
          totalFeesWeek: totalFees7d,
          totalFeesMonth: totalFeesMonth,
          impermanentLoss,
          netProfit,
          activePositions: rawData.pairs.length,
          activeStrategies: Math.floor(rawData.pairs.length * 0.8), // More active strategies
          alerts: currentAPR > 60 ? [
            { type: 'info', message: 'High APR detected - excellent performance', timestamp: new Date() }
          ] : []
        };
      }

      case 'tokenLiquidity': {
        const currentPrice = 1.25 + (Math.random() - 0.5) * 0.08; // Slightly higher base price
        const volume24h = 165000 + Math.random() * 80000; // Higher volume
        const liquidityDepth = allocation * 0.7; // 70% of allocation in liquidity
        
        return {
          ...baseMetrics,
          name: STRATEGY_CONFIG.tokenLiquidity.name,
          shortName: 'TL-MGMT',
          currentPrice,
          liquidityDepth,
          buySupport: allocation * 0.7,
          sellPressure: (allocation * 0.3) / currentPrice,
          volume24h,
          volume7d: volume24h * 7 * (0.85 + Math.random() * 0.3),
          slippage1k: 0.08 + Math.random() * 0.07, // Better slippage with more liquidity
          slippage10k: 0.95 + Math.random() * 0.4,
          ratchetLevel: 7, // Higher ratchet level
          nextRatchetTarget: 1.35,
          sellTaxRate: 5, // Updated 5% sell tax from whitepaper
          totalSupply: 8888888, // Updated total supply from whitepaper
          alerts: []
        };
      }

      default:
        return baseMetrics;
    }
  }, []);

  // Calculate system-wide metrics
  const calculateSystemMetrics = useCallback((strategies) => {
    const totalAllocation = Object.values(strategies).reduce((sum, strategy) => 
      sum + (strategy?.allocation || 0), 0
    );

    const totalProfit = Object.values(strategies).reduce((sum, strategy) => 
      sum + (strategy?.totalProfit || strategy?.netProfit || 0), 0
    );

    // Weighted APY calculation based on new allocations
    const weightedAPY = Object.values(strategies).reduce((sum, strategy) => {
      const apy = strategy?.apy || strategy?.averageAPR || 0;
      const weight = (strategy?.allocation || 0) / totalAllocation;
      return sum + (apy * weight);
    }, 0);

    return {
      totalAllocation,
      totalProfit,
      combinedAPY: weightedAPY,
      targetAPYRange: '18-27%', // From whitepaper
      systemUptime: 99.96 + Math.random() * 0.04,
      lastSystemUpdate: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
      activeBots: 5,
      totalBots: 5,
      dataFreshness: new Date().toISOString(),
      errorRate: 0.0008 + Math.random() * 0.004,
      avgResponseTime: 98 + Math.random() * 35
    };
  }, []);

  // Main data fetching function
  const fetchAllStrategyData = useCallback(async () => {
    setIsLoading(true);
    setError('');

    try {
      // Initialize contracts if needed
      await initializeContracts();

      // Fetch external market data
      const [bitcoinData, baseLPData] = await Promise.all([
        fetchBitcoinData(),
        fetchBaseLPData()
      ]);

      // Assume total fund size for calculations
      const totalFunds = 5000000; // $5M total

      // Calculate individual strategy allocations (UPDATED)
      const bitcoinAllocation = totalFunds * STRATEGY_CONFIG.bitcoin.allocation; // 35%
      const baseLPAllocation = totalFunds * STRATEGY_CONFIG.baseLP.allocation;   // 45%
      const tokenLiquidityAllocation = totalFunds * STRATEGY_CONFIG.tokenLiquidity.allocation; // 20%

      // Calculate strategy metrics
      const bitcoinStrategy = calculateStrategyMetrics('bitcoin', bitcoinData, bitcoinAllocation);
      const baseEcosystemLP = calculateStrategyMetrics('baseLP', baseLPData, baseLPAllocation);
      const tokenLiquidity = calculateStrategyMetrics('tokenLiquidity', null, tokenLiquidityAllocation);

      // Calculate system metrics
      const systemMetrics = calculateSystemMetrics({
        bitcoin: bitcoinStrategy,
        baseLP: baseEcosystemLP,
        tokenLiquidity
      });

      setStrategyData({
        bitcoinStrategy,
        baseEcosystemLP,
        tokenLiquidity,
        systemMetrics
      });

      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error fetching strategy data:', error);
      setError(error.message || 'Failed to fetch strategy data');
    } finally {
      setIsLoading(false);
    }
  }, [initializeContracts, fetchBitcoinData, fetchBaseLPData, calculateStrategyMetrics, calculateSystemMetrics]);

  // Get specific strategy performance history
  const getStrategyHistory = useCallback(async (strategyId, timeframe = '7d') => {
    try {
      const dataPoints = timeframe === '24h' ? 24 : timeframe === '7d' ? 7 : 30;
      const history = [];

      for (let i = dataPoints; i >= 0; i--) {
        const date = new Date();
        if (timeframe === '24h') {
          date.setHours(date.getHours() - i);
        } else if (timeframe === '7d') {
          date.setDate(date.getDate() - i);
        } else {
          date.setDate(date.getDate() - i);
        }

        // Generate realistic performance data based on strategy type
        let baseReturn, volatility;
        
        if (strategyId === 'bitcoin') {
          baseReturn = 0.211 / 365; // 21.1% APY daily
          volatility = 0.18;
        } else if (strategyId === 'baseLP') {
          baseReturn = 0.42 / 365; // 42% APY daily average
          volatility = 0.12;
        } else {
          baseReturn = 0.08 / 365; // 8% APY for token liquidity
          volatility = 0.05;
        }
        
        const randomReturn = (Math.random() - 0.5) * volatility;
        const cumulativeReturn = baseReturn + randomReturn;

        history.push({
          timestamp: date.toISOString(),
          value: 1000000 * (1 + cumulativeReturn * (i / dataPoints)),
          return: cumulativeReturn * 100,
          volume: Math.random() * 150000 + 75000
        });
      }

      return history;
    } catch (error) {
      console.error('Error fetching strategy history:', error);
      return [];
    }
  }, []);

  // Trigger manual rebalance
  const triggerRebalance = useCallback(async (strategyId) => {
    try {
      setIsLoading(true);
      
      // Simulate rebalance transaction
      await new Promise(resolve => setTimeout(resolve, 2500));
      
      // Update strategy status
      setStrategyData(prev => ({
        ...prev,
        [strategyId]: {
          ...prev[strategyId],
          lastRebalance: new Date().toISOString(),
          currentExposure: STRATEGY_CONFIG.bitcoin.targetExposure,
          isRebalanceNeeded: false
        }
      }));

      return { success: true, txHash: '0x' + Math.random().toString(16).substr(2, 64) };
    } catch (error) {
      console.error('Error triggering rebalance:', error);
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Export strategy data
  const exportStrategyData = useCallback((format = 'csv') => {
    const exportData = {
      timestamp: new Date().toISOString(),
      systemMetrics: strategyData.systemMetrics,
      strategies: {
        bitcoin: strategyData.bitcoinStrategy,
        baseLP: strategyData.baseEcosystemLP,
        tokenLiquidity: strategyData.tokenLiquidity
      },
      allocations: STRATEGY_CONFIG
    };

    if (format === 'csv') {
      const csvContent = [
        'Strategy,Allocation,APY,Total Profit,Status,Health',
        `Bitcoin,${strategyData.bitcoinStrategy?.allocation || 0},${strategyData.bitcoinStrategy?.apy || 0},${strategyData.bitcoinStrategy?.totalProfit || 0},${strategyData.bitcoinStrategy?.status || 'unknown'},${strategyData.bitcoinStrategy?.health || 'unknown'}`,
        `Base LP,${strategyData.baseEcosystemLP?.allocation || 0},${strategyData.baseEcosystemLP?.averageAPR || 0},${strategyData.baseEcosystemLP?.netProfit || 0},${strategyData.baseEcosystemLP?.status || 'unknown'},${strategyData.baseEcosystemLP?.health || 'unknown'}`,
        `Token Liquidity,${strategyData.tokenLiquidity?.allocation || 0},8.5,${strategyData.tokenLiquidity?.allocation * 0.085 || 0},${strategyData.tokenLiquidity?.status || 'unknown'},${strategyData.tokenLiquidity?.health || 'unknown'}`
      ].join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `avalon-strategy-data-${Date.now()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `avalon-strategy-data-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    }
  }, [strategyData]);

  // Initialize on mount
  useEffect(() => {
    fetchAllStrategyData();
  }, [fetchAllStrategyData]);

  return {
    strategyData,
    isLoading,
    error,
    lastUpdate,
    refreshData: fetchAllStrategyData,
    getStrategyHistory,
    triggerRebalance,
    exportStrategyData,
    contracts
  };
};