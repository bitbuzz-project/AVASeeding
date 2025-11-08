// src/hooks/useStrategyData.js - WHITEPAPER ALIGNED
import { useState, useCallback, useEffect } from 'react';

// Contract addresses and strategy configurations - WHITEPAPER ALIGNED
const STRATEGY_CONFIG = {
  bitcoin: {
    allocation: 0.80, // 80% - Bitcoin Adaptive Rebalancing Strategy (BARS)
    targetExposure: 0.40, // Average 40% exposure (range 10%-70%)
    rebalanceThreshold: 0.08, // 8% optimal threshold from whitepaper
    name: 'Bitcoin Adaptive Rebalancing Strategy (BARS)',
    totalAPY: 0.47, // 47% total NAV + profits APY
    extractableAPY: 0.273, // 27.3% extractable profits APY
    backtestPeriod: '2021-2025',
    finalNAV: 12495000, // $12.495M from $2M initial
    initialNAV: 2000000,
    totalGrowth: 5.2475, // 524.75% growth
    exposureRange: [0.10, 0.70], // Adaptive 10%-70% exposure
    monthlyProfitRange: [0.015, 0.025], // 1.5% - 2.5% monthly
    outperformance: 0.90 // 90% outperformance in downturns
  },
  tokenLiquidity: {
    allocation: 0.20, // 20% - Token Liquidity Management
    name: 'AVA Token Liquidity Management',
    sellTax: 0.08, // 8% sell tax
    initialPrice: 1.00,
    ratchetIncrement: 0.05, // $0.05 increments
    ratchetLiquidity: 0.04, // 4% of pool per step
    singleSided: true // Single-sided LP starting at $1.00
  },
  revenue: {
    initialBuybackRate: 0.70, // 70% to buybacks initially
    finalBuybackRate: 0.85, // 85% after 70% token sale
    transitionThreshold: 0.70, // Transition at 70% sold
    operationsInitial: 0.30, // 30% operations initially
    operationsFinal: 0.15 // 15% operations final
  },
  tokenomics: {
    totalSupply: 5000000, // 5M total supply
    seedingAllocation: 0.875, // 87.5% for seeding
    liquidityAllocation: 0.125, // 12.5% for liquidity
    sellTax: 0.08, // 8% sell tax
    volumeBonusMax: 0.08 // Up to 8% volume bonus
  }
};

export const useStrategyData = () => {
  const [strategyData, setStrategyData] = useState({
    bitcoinStrategy: null,
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
        currentPrice: 95000 + (Math.random() - 0.5) * 5000,
        volume24h: 18000000000 + Math.random() * 3000000000,
        volatility: 0.18 + Math.random() * 0.08,
        marketCap: 1900000000000
      };

      return mockData;
    } catch (error) {
      console.error('Error fetching Bitcoin data:', error);
      return null;
    }
  }, []);

  // Calculate strategy performance metrics - WHITEPAPER ALIGNED
  const calculateStrategyMetrics = useCallback((strategyType, rawData, allocation) => {
    if (!rawData && strategyType !== 'tokenLiquidity') return null;

    const baseMetrics = {
      allocation,
      status: 'active',
      health: 'excellent',
      botStatus: 'running'
    };

    switch (strategyType) {
      case 'bitcoin': {
        // BARS Strategy Metrics from Whitepaper
        const currentExposure = 0.40 + (Math.random() - 0.5) * 0.15; // Drift around 40%
        const isRebalanceNeeded = Math.abs(currentExposure - STRATEGY_CONFIG.bitcoin.targetExposure) > STRATEGY_CONFIG.bitcoin.rebalanceThreshold;
        
        // Performance simulation based on whitepaper (47% total APY, 27.3% extractable)
        const monthlyReturn = (STRATEGY_CONFIG.bitcoin.monthlyProfitRange[0] + 
          Math.random() * (STRATEGY_CONFIG.bitcoin.monthlyProfitRange[1] - STRATEGY_CONFIG.bitcoin.monthlyProfitRange[0]));
        const weeklyReturn = monthlyReturn / 4.33;
        const dailyReturn = weeklyReturn / 7;
        const ytdReturn = monthlyReturn * 12;

        return {
          ...baseMetrics,
          name: STRATEGY_CONFIG.bitcoin.name,
          shortName: 'BARS',
          
          // Core whitepaper metrics
          totalAPY: STRATEGY_CONFIG.bitcoin.totalAPY * 100, // 47%
          extractableAPY: STRATEGY_CONFIG.bitcoin.extractableAPY * 100, // 27.3%
          backtestPeriod: STRATEGY_CONFIG.bitcoin.backtestPeriod,
          initialNAV: STRATEGY_CONFIG.bitcoin.initialNAV,
          finalNAV: STRATEGY_CONFIG.bitcoin.finalNAV,
          totalGrowth: STRATEGY_CONFIG.bitcoin.totalGrowth,
          
          // Exposure and rebalancing
          targetExposure: STRATEGY_CONFIG.bitcoin.targetExposure,
          currentExposure,
          rebalanceThreshold: STRATEGY_CONFIG.bitcoin.rebalanceThreshold,
          exposureRange: STRATEGY_CONFIG.bitcoin.exposureRange,
          isRebalanceNeeded,
          nextRebalanceEstimate: isRebalanceNeeded ?
            new Date(Date.now() + 30 * 60 * 1000) :
            new Date(Date.now() + 4 * 60 * 60 * 1000),
          
          // Performance metrics
          monthlyReturn: monthlyReturn * 100,
          weeklyReturn: weeklyReturn * 100,
          dailyReturn: dailyReturn * 100,
          ytdReturn: ytdReturn * 100,
          outperformance: STRATEGY_CONFIG.bitcoin.outperformance * 100,
          
          // Risk metrics
          volatility: rawData.volatility,
          sharpeRatio: (STRATEGY_CONFIG.bitcoin.totalAPY * 100) / (rawData.volatility * 100),
          maxDrawdown: 0.08 + Math.random() * 0.04,
          
          // Trading stats
          totalTrades: 1247 + Math.floor(Math.random() * 50),
          successRate: 92 + Math.random() * 6,
          avgTradeSize: allocation * 0.15,
          
          // P&L
          totalProfit: allocation * STRATEGY_CONFIG.bitcoin.extractableAPY,
          unrealizedPnL: allocation * dailyReturn,
          realizedPnL: allocation * (STRATEGY_CONFIG.bitcoin.extractableAPY - dailyReturn),
          
          lastRebalance: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
          alerts: []
        };
      }

      case 'tokenLiquidity': {
        // Token Liquidity Management from Whitepaper
        const currentPrice = 1.25 + (Math.random() - 0.5) * 0.08;
        const volume24h = 165000 + Math.random() * 80000;
        const liquidityDepth = allocation * 0.9; // 90% in liquidity
        
        return {
          ...baseMetrics,
          name: STRATEGY_CONFIG.tokenLiquidity.name,
          shortName: 'TL-MGMT',
          
          // Liquidity metrics
          currentPrice,
          liquidityDepth,
          buySupport: allocation * 0.9,
          sellPressure: (allocation * 0.1) / currentPrice,
          
          // Volume metrics
          volume24h,
          volume7d: volume24h * 7 * (0.85 + Math.random() * 0.3),
          volume30d: volume24h * 30 * (0.80 + Math.random() * 0.4),
          
          // Slippage (improved with 20% allocation)
          slippage1k: 0.06 + Math.random() * 0.04,
          slippage10k: 0.75 + Math.random() * 0.35,
          slippage50k: 4.2 + Math.random() * 1.8,
          
          // Ratcheting system
          ratchetLevel: 8,
          nextRatchetTarget: 1.40,
          ratchetIncrement: STRATEGY_CONFIG.tokenLiquidity.ratchetIncrement,
          ratchetLiquidity: STRATEGY_CONFIG.tokenLiquidity.ratchetLiquidity,
          
          // Tokenomics
          sellTaxRate: STRATEGY_CONFIG.tokenLiquidity.sellTax * 100,
          totalSupply: STRATEGY_CONFIG.tokenomics.totalSupply,
          circulatingSupply: STRATEGY_CONFIG.tokenomics.totalSupply * 0.875,
          
          // Revenue contribution
          dailyFees: volume24h * STRATEGY_CONFIG.tokenLiquidity.sellTax * 0.15,
          monthlyFees: volume24h * 30 * STRATEGY_CONFIG.tokenLiquidity.sellTax * 0.15,
          
          alerts: []
        };
      }

      default:
        return baseMetrics;
    }
  }, []);

  // Calculate system-wide metrics - WHITEPAPER ALIGNED
  const calculateSystemMetrics = useCallback((strategies, tokensSoldPercent = 0.5) => {
    const totalAllocation = Object.values(strategies).reduce((sum, strategy) =>
      sum + (strategy?.allocation || 0), 0
    );

    const totalProfit = Object.values(strategies).reduce((sum, strategy) =>
      sum + (strategy?.totalProfit || strategy?.monthlyFees || 0), 0
    );

    // Weighted APY calculation (BARS dominates with 80%)
    const weightedAPY = 
      (strategies.bitcoinStrategy?.extractableAPY || 0) * STRATEGY_CONFIG.bitcoin.allocation +
      8.5 * STRATEGY_CONFIG.tokenLiquidity.allocation; // Estimated 8.5% from liquidity fees

    // Revenue distribution based on token sale progress
    const buybackRate = tokensSoldPercent >= STRATEGY_CONFIG.revenue.transitionThreshold ?
      STRATEGY_CONFIG.revenue.finalBuybackRate :
      STRATEGY_CONFIG.revenue.initialBuybackRate;

    const operationsRate = tokensSoldPercent >= STRATEGY_CONFIG.revenue.transitionThreshold ?
      STRATEGY_CONFIG.revenue.operationsFinal :
      STRATEGY_CONFIG.revenue.operationsInitial;

    return {
      totalAllocation,
      totalProfit,
      combinedAPY: weightedAPY,
      extractableAPY: STRATEGY_CONFIG.bitcoin.extractableAPY * 100,
      totalAPY: STRATEGY_CONFIG.bitcoin.totalAPY * 100,
      
      // Revenue distribution
      buybackRate: buybackRate * 100,
      operationsRate: operationsRate * 100,
      revenueToTokenHolders: totalProfit * buybackRate,
      revenueToOperations: totalProfit * operationsRate,
      
      // System health
      systemUptime: 99.96 + Math.random() * 0.04,
      lastSystemUpdate: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
      activeBots: 3, // Bitcoin bot + 2 liquidity bots
      totalBots: 3,
      dataFreshness: new Date().toISOString(),
      errorRate: 0.0005 + Math.random() * 0.002,
      avgResponseTime: 85 + Math.random() * 30,
      
      // Tokenomics
      totalSupply: STRATEGY_CONFIG.tokenomics.totalSupply,
      seedingAllocation: STRATEGY_CONFIG.tokenomics.seedingAllocation,
      liquidityAllocation: STRATEGY_CONFIG.tokenomics.liquidityAllocation,
      sellTax: STRATEGY_CONFIG.tokenomics.sellTax * 100,
      volumeBonusMax: STRATEGY_CONFIG.tokenomics.volumeBonusMax * 100
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
      const bitcoinData = await fetchBitcoinData();

      // Assume total fund size for calculations
      const totalFunds = 5000000; // $5M total

      // Calculate individual strategy allocations (WHITEPAPER ALIGNED)
      const bitcoinAllocation = totalFunds * STRATEGY_CONFIG.bitcoin.allocation; // 80%
      const tokenLiquidityAllocation = totalFunds * STRATEGY_CONFIG.tokenLiquidity.allocation; // 20%

      // Calculate strategy metrics
      const bitcoinStrategy = calculateStrategyMetrics('bitcoin', bitcoinData, bitcoinAllocation);
      const tokenLiquidity = calculateStrategyMetrics('tokenLiquidity', null, tokenLiquidityAllocation);

      // Calculate system metrics (assume 50% sold for demo)
      const systemMetrics = calculateSystemMetrics({
        bitcoinStrategy,
        tokenLiquidity
      }, 0.50);

      setStrategyData({
        bitcoinStrategy,
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
  }, [initializeContracts, fetchBitcoinData, calculateStrategyMetrics, calculateSystemMetrics]);

  // Get specific strategy performance history
  const getStrategyHistory = useCallback(async (strategyId, timeframe = '7d') => {
    try {
      const dataPoints = timeframe === '24h' ? 24 : timeframe === '7d' ? 7 : 30;
      const history = [];

      for (let i = dataPoints; i >= 0; i--) {
        const date = new Date();
        if (timeframe === '24h') {
          date.setHours(date.getHours() - i);
        } else {
          date.setDate(date.getDate() - i);
        }

        // Generate realistic performance data based on strategy type
        let baseReturn, volatility;
        
        if (strategyId === 'bitcoin') {
          baseReturn = STRATEGY_CONFIG.bitcoin.totalAPY / 365; // Daily from 47% APY
          volatility = 0.18;
        } else {
          baseReturn = 0.085 / 365; // 8.5% APY for token liquidity
          volatility = 0.05;
        }
        
        const randomReturn = (Math.random() - 0.5) * volatility;
        const cumulativeReturn = baseReturn + randomReturn;

        history.push({
          timestamp: date.toISOString(),
          value: 1000000 * (1 + cumulativeReturn * (dataPoints - i)),
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
        bitcoinStrategy: {
          ...prev.bitcoinStrategy,
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
        tokenLiquidity: strategyData.tokenLiquidity
      },
      allocations: STRATEGY_CONFIG,
      whitepaperMetrics: {
        totalAPY: '47%',
        extractableAPY: '27.3%',
        backtestPeriod: '2021-2025',
        finalNAV: '$12.495M',
        initialNAV: '$2M',
        outperformance: '90% in downturns'
      }
    };

    if (format === 'csv') {
      const csvContent = [
        'Strategy,Allocation,Total APY,Extractable APY,Status,Health',
        `Bitcoin BARS,${strategyData.bitcoinStrategy?.allocation || 0},${strategyData.bitcoinStrategy?.totalAPY || 0},${strategyData.bitcoinStrategy?.extractableAPY || 0},${strategyData.bitcoinStrategy?.status || 'unknown'},${strategyData.bitcoinStrategy?.health || 'unknown'}`,
        `Token Liquidity,${strategyData.tokenLiquidity?.allocation || 0},8.5,N/A,${strategyData.tokenLiquidity?.status || 'unknown'},${strategyData.tokenLiquidity?.health || 'unknown'}`
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
    contracts,
    config: STRATEGY_CONFIG // Expose config for reference
  };
};