// src/hooks/useInvestorData.js - WHITEPAPER ALIGNED
import { useState, useCallback, useEffect } from 'react';

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
  currentAvaPrice: 1.25, // Dynamic - should be fetched from pool
  expectedYearlyReturn: 0.235, // 23.5% extractable (80% × 27.3% + 20% × 8.5%)
  totalAPY: 0.393, // 39.3% total (80% × 47% + 20% × 8.5%)
  strategies: {
    bitcoin: { allocation: 0.80, extractableAPY: 0.273 },
    tokenLiquidity: { allocation: 0.20, apy: 0.085 }
  }
};

// Extended ABIs for investor tracking
const SEEDING_ABI = [
  "function purchasedAmount(address) external view returns (uint256)",
  "function getSeedingProgress() external view returns (uint256, uint256, uint256)",
  "event TokensPurchased(address indexed buyer, uint256 usdcAmount, uint256 avalonAmount)"
];

const AVA_ABI = [
  "function balanceOf(address) external view returns (uint256)",
  "event Transfer(address indexed from, address indexed to, uint256 value)"
];

const USDC_ABI = [
  "function balanceOf(address) external view returns (uint256)"
];

export const useInvestorData = () => {
  const [investors, setInvestors] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [contracts, setContracts] = useState({
    seeding: null,
    ava: null,
    usdc: null,
    provider: null
  });

  // Initialize contracts
  const initializeContracts = useCallback(async () => {
    try {
      if (!window.ethereum || !ethers) return null;

      const provider = new ethers.BrowserProvider(window.ethereum);
      const seeding = new ethers.Contract(CONTRACTS.SEEDING, SEEDING_ABI, provider);
      const ava = new ethers.Contract(CONTRACTS.AVA, AVA_ABI, provider);
      const usdc = new ethers.Contract(CONTRACTS.USDC, USDC_ABI, provider);

      const contractInstances = { seeding, ava, usdc, provider };
      setContracts(contractInstances);
      return contractInstances;
    } catch (error) {
      console.error('Failed to initialize contracts:', error);
      setError('Failed to connect to blockchain');
      return null;
    }
  }, []);

  // Fetch all investor addresses from events
  const fetchInvestorAddresses = useCallback(async (contractInstances) => {
    const { seeding, provider } = contractInstances || contracts;
    if (!seeding || !provider) return [];

    try {
      const filter = seeding.filters.TokensPurchased();
      const events = await seeding.queryFilter(filter, 0, 'latest');

      const addressSet = new Set();
      events.forEach(event => {
        addressSet.add(event.args.buyer);
      });

      return Array.from(addressSet);
    } catch (error) {
      console.error('Error fetching investor addresses:', error);
      return [];
    }
  }, [contracts]);

  // Fetch detailed data for a specific investor - WHITEPAPER ALIGNED
  const fetchInvestorDetails = useCallback(async (address, contractInstances) => {
    const { seeding, ava, usdc, provider } = contractInstances || contracts;
    if (!seeding || !ava || !usdc || !provider || !ethers) return null;

    try {
      // Get basic balances and purchase amount
      const [purchasedAmount, avaBalance, usdcBalance] = await Promise.all([
        seeding.purchasedAmount(address),
        ava.balanceOf(address),
        usdc.balanceOf(address)
      ]);

      // Get transaction history from events
      const purchaseFilter = seeding.filters.TokensPurchased(address);
      const transferFilter = ava.filters.Transfer(null, address);
      const outgoingFilter = ava.filters.Transfer(address, null);

      const [purchaseEvents, incomingTransfers, outgoingTransfers] = await Promise.all([
        seeding.queryFilter(purchaseFilter, 0, 'latest'),
        ava.queryFilter(transferFilter, 0, 'latest'),
        ava.queryFilter(outgoingFilter, 0, 'latest')
      ]);

      // Process transaction history
      const transactions = [];

      // Add purchase events
      for (const event of purchaseEvents) {
        const block = await provider.getBlock(event.blockNumber);
        transactions.push({
          type: 'purchase',
          amount: ethers.formatUnits(event.args.usdcAmount, 6),
          tokens: ethers.formatEther(event.args.avalonAmount),
          date: new Date(block.timestamp * 1000).toISOString(),
          txHash: event.transactionHash,
          blockNumber: event.blockNumber
        });
      }

      // Add incoming transfers (excluding purchases from seeding contract)
      for (const event of incomingTransfers) {
        if (event.args.from.toLowerCase() !== CONTRACTS.SEEDING.toLowerCase()) {
          const block = await provider.getBlock(event.blockNumber);
          transactions.push({
            type: 'transfer_in',
            amount: 0,
            tokens: ethers.formatEther(event.args.value),
            date: new Date(block.timestamp * 1000).toISOString(),
            txHash: event.transactionHash,
            blockNumber: event.blockNumber,
            from: event.args.from
          });
        }
      }

      // Add outgoing transfers
      for (const event of outgoingTransfers) {
        const block = await provider.getBlock(event.blockNumber);
        transactions.push({
          type: 'transfer_out',
          amount: 0,
          tokens: `-${ethers.formatEther(event.args.value)}`,
          date: new Date(block.timestamp * 1000).toISOString(),
          txHash: event.transactionHash,
          blockNumber: event.blockNumber,
          to: event.args.to
        });
      }

      // Sort transactions by date (newest first)
      transactions.sort((a, b) => new Date(b.date) - new Date(a.date));

      // Calculate metrics - WHITEPAPER ALIGNED
      const totalInvested = parseFloat(ethers.formatEther(purchasedAmount));
      const currentAvaBalance = parseFloat(ethers.formatEther(avaBalance));
      
      // Use whitepaper-aligned current price
      const currentValue = currentAvaBalance * WHITEPAPER_CONFIG.currentAvaPrice;
      const profitLoss = currentValue - totalInvested;
      
      // Calculate expected returns based on whitepaper
      const holdingPeriodDays = Math.floor((Date.now() - new Date(transactions[transactions.length - 1]?.date || Date.now())) / (1000 * 60 * 60 * 24));
      const holdingPeriodYears = holdingPeriodDays / 365;
      
      // Expected profit based on whitepaper APY (23.5% extractable)
      const expectedYearlyProfit = totalInvested * WHITEPAPER_CONFIG.expectedYearlyReturn;
      const expectedTotalProfit = expectedYearlyProfit * holdingPeriodYears;
      const performanceVsExpected = expectedTotalProfit > 0 ? (profitLoss / expectedTotalProfit) * 100 : 0;

      const firstTransaction = transactions[transactions.length - 1];
      const joinDate = firstTransaction ? firstTransaction.date : new Date().toISOString();

      return {
        address,
        totalInvested,
        currentAvaBalance,
        currentUsdcBalance: parseFloat(ethers.formatUnits(usdcBalance, 6)),
        currentValue,
        profitLoss,
        profitLossPercent: totalInvested > 0 ? (profitLoss / totalInvested) * 100 : 0,
        transactionCount: transactions.length,
        joinDate,
        lastActivity: transactions[0]?.date || joinDate,
        transactions,
        
        // Whitepaper-aligned metrics
        expectedYearlyProfit,
        expectedTotalProfit,
        performanceVsExpected,
        whitepaperAPY: WHITEPAPER_CONFIG.expectedYearlyReturn * 100,
        totalAPY: WHITEPAPER_CONFIG.totalAPY * 100,
        
        // Additional metrics
        avgTransactionSize: totalInvested / Math.max(1, purchaseEvents.length),
        holdingPeriod: holdingPeriodDays,
        isActive: (Date.now() - new Date(transactions[0]?.date || joinDate)) < (30 * 24 * 60 * 60 * 1000)
      };
    } catch (error) {
      console.error(`Error fetching details for ${address}:`, error);
      return null;
    }
  }, [contracts]);

  // Fetch all investors with their details
  const fetchAllInvestors = useCallback(async () => {
    setIsLoading(true);
    setError('');

    try {
      const contractInstances = contracts.seeding ? contracts : await initializeContracts();
      if (!contractInstances) {
        throw new Error('Failed to initialize contracts');
      }

      const addresses = await fetchInvestorAddresses(contractInstances);
      
      if (addresses.length === 0) {
        setInvestors([]);
        return;
      }

      // Fetch details for each investor (in batches)
      const batchSize = 10;
      const investorDetails = [];
      
      for (let i = 0; i < addresses.length; i += batchSize) {
        const batch = addresses.slice(i, i + batchSize);
        const batchPromises = batch.map(address => 
          fetchInvestorDetails(address, contractInstances)
        );
        
        const batchResults = await Promise.all(batchPromises);
        investorDetails.push(...batchResults.filter(Boolean));
        
        if (i + batchSize < addresses.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      // Sort by total invested (descending)
      investorDetails.sort((a, b) => b.totalInvested - a.totalInvested);
      
      setInvestors(investorDetails);
    } catch (error) {
      console.error('Error fetching all investors:', error);
      setError(error.message || 'Failed to fetch investor data');
    } finally {
      setIsLoading(false);
    }
  }, [contracts, initializeContracts, fetchInvestorAddresses, fetchInvestorDetails]);

  // Get detailed analytics for a specific investor - WHITEPAPER ALIGNED
  const getInvestorAnalytics = useCallback(async (address) => {
    const { seeding, ava, provider } = contracts;
    if (!seeding || !ava || !provider || !ethers) return null;

    try {
      const investorData = await fetchInvestorDetails(address, contracts);
      if (!investorData) return null;

      // Calculate advanced analytics with whitepaper alignment
      const analytics = {
        ...investorData,
        
        // Transaction patterns
        transactionFrequency: investorData.transactionCount / Math.max(1, investorData.holdingPeriod / 30),
        
        // Investment distribution over time
        monthlyInvestments: calculateMonthlyInvestments(investorData.transactions),
        
        // Performance metrics - WHITEPAPER ALIGNED
        roi: investorData.totalInvested > 0 ? (investorData.profitLoss / investorData.totalInvested) * 100 : 0,
        annualizedReturn: calculateAnnualizedReturn(investorData.profitLoss, investorData.totalInvested, investorData.holdingPeriod),
        expectedAnnualizedReturn: WHITEPAPER_CONFIG.expectedYearlyReturn * 100, // 23.5%
        totalExpectedReturn: WHITEPAPER_CONFIG.totalAPY * 100, // 39.3%
        
        // Risk assessment - WHITEPAPER ALIGNED
        riskScore: calculateRiskScore(investorData),
        
        // Behavioral analysis
        tradingPattern: analyzeTradingPattern(investorData.transactions),
        loyaltyScore: calculateLoyaltyScore(investorData),
        
        // Strategy alignment
        alignedWithStrategy: investorData.performanceVsExpected > 80, // Within 20% of expected
        strategyPerformance: {
          bitcoinContribution: investorData.expectedYearlyProfit * WHITEPAPER_CONFIG.strategies.bitcoin.allocation,
          liquidityContribution: investorData.expectedYearlyProfit * WHITEPAPER_CONFIG.strategies.tokenLiquidity.allocation
        }
      };

      return analytics;
    } catch (error) {
      console.error(`Error getting analytics for ${address}:`, error);
      return null;
    }
  }, [contracts, fetchInvestorDetails]);

  // Helper function to calculate monthly investments
  const calculateMonthlyInvestments = (transactions) => {
    const monthlyData = {};
    
    transactions
      .filter(tx => tx.type === 'purchase')
      .forEach(tx => {
        const date = new Date(tx.date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = {
            month: monthKey,
            amount: 0,
            transactions: 0
          };
        }
        
        monthlyData[monthKey].amount += parseFloat(tx.amount);
        monthlyData[monthKey].transactions += 1;
      });
    
    return Object.values(monthlyData).sort((a, b) => a.month.localeCompare(b.month));
  };

  // Helper function to calculate annualized return
  const calculateAnnualizedReturn = (profitLoss, totalInvested, holdingPeriodDays) => {
    if (totalInvested <= 0 || holdingPeriodDays <= 0) return 0;
    
    const years = holdingPeriodDays / 365;
    const totalReturn = profitLoss / totalInvested;
    
    return (Math.pow(1 + totalReturn, 1 / years) - 1) * 100;
  };

  // Helper function to calculate risk score - WHITEPAPER ALIGNED
  const calculateRiskScore = (investorData) => {
    let score = 0;
    
    // Large investment size increases risk score
    if (investorData.totalInvested > 50000) score += 30; // Adjusted threshold
    else if (investorData.totalInvested > 25000) score += 20;
    else if (investorData.totalInvested > 10000) score += 10;
    
    // High transaction frequency increases risk
    if (investorData.transactionFrequency > 2) score += 25;
    else if (investorData.transactionFrequency > 1) score += 15;
    
    // Recent activity decreases risk
    const daysSinceLastActivity = Math.floor((Date.now() - new Date(investorData.lastActivity)) / (1000 * 60 * 60 * 24));
    if (daysSinceLastActivity > 90) score += 20;
    else if (daysSinceLastActivity > 30) score += 10;
    
    // New accounts have higher risk
    if (investorData.holdingPeriod < 30) score += 15;
    
    // Performance vs expected reduces risk
    if (investorData.performanceVsExpected < 50) score += 20; // Underperforming
    else if (investorData.performanceVsExpected > 150) score += 10; // Overperforming (could be unsustainable)
    
    return Math.min(100, score);
  };

  // Helper function to analyze trading pattern
  const analyzeTradingPattern = (transactions) => {
    const purchases = transactions.filter(tx => tx.type === 'purchase');
    
    if (purchases.length === 0) return 'inactive';
    if (purchases.length === 1) return 'single-purchase';
    
    // Calculate time between purchases
    const intervals = [];
    for (let i = 1; i < purchases.length; i++) {
      const diff = new Date(purchases[i-1].date) - new Date(purchases[i].date);
      intervals.push(diff / (1000 * 60 * 60 * 24)); // Days
    }
    
    const avgInterval = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
    
    if (avgInterval < 7) return 'frequent-trader';
    if (avgInterval < 30) return 'regular-buyer';
    if (avgInterval < 90) return 'occasional-buyer';
    return 'rare-buyer';
  };

  // Helper function to calculate loyalty score - WHITEPAPER ALIGNED
  const calculateLoyaltyScore = (investorData) => {
    let score = 50; // Base score
    
    // Holding period bonus (aligned with strategy timeframes)
    if (investorData.holdingPeriod > 365) score += 30;
    else if (investorData.holdingPeriod > 180) score += 20;
    else if (investorData.holdingPeriod > 90) score += 10;
    
    // No outgoing transfers bonus (diamond hands)
    const hasOutgoingTransfers = investorData.transactions.some(tx => tx.type === 'transfer_out');
    if (!hasOutgoingTransfers) score += 20;
    
    // Recent activity bonus
    const daysSinceLastActivity = Math.floor((Date.now() - new Date(investorData.lastActivity)) / (1000 * 60 * 60 * 24));
    if (daysSinceLastActivity < 30) score += 10;
    
    // Performance satisfaction (meeting expectations)
    if (investorData.performanceVsExpected > 80 && investorData.performanceVsExpected < 120) {
      score += 10; // Meeting expectations = satisfied = loyal
    }
    
    return Math.min(100, score);
  };

  // Export investor data
  const exportInvestorData = useCallback((format = 'csv', selectedInvestors = null) => {
    const dataToExport = selectedInvestors || investors;
    
    if (format === 'csv') {
      const csvHeaders = [
        'Address',
        'Total Invested (USDC)',
        'AVA Balance',
        'Current Value (USDC)',
        'Profit/Loss (USDC)',
        'Profit/Loss (%)',
        'Expected Yearly Profit',
        'Performance vs Expected (%)',
        'Whitepaper APY (%)',
        'Transaction Count',
        'Join Date',
        'Last Activity',
        'Holding Period (Days)',
        'Is Active'
      ];
      
      const csvRows = dataToExport.map(investor => [
        investor.address,
        investor.totalInvested,
        investor.currentAvaBalance,
        investor.currentValue,
        investor.profitLoss,
        investor.profitLossPercent.toFixed(2),
        investor.expectedYearlyProfit?.toFixed(2) || '0',
        investor.performanceVsExpected?.toFixed(2) || '0',
        investor.whitepaperAPY || '23.5',
        investor.transactionCount,
        new Date(investor.joinDate).toLocaleDateString(),
        new Date(investor.lastActivity).toLocaleDateString(),
        investor.holdingPeriod,
        investor.isActive ? 'Yes' : 'No'
      ]);
      
      const csvContent = [csvHeaders.join(','), ...csvRows.map(row => row.join(','))].join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `avalon-investors-${Date.now()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      // JSON format with whitepaper alignment
      const jsonData = {
        timestamp: new Date().toISOString(),
        totalInvestors: dataToExport.length,
        totalInvested: dataToExport.reduce((sum, inv) => sum + inv.totalInvested, 0),
        totalCurrentValue: dataToExport.reduce((sum, inv) => sum + inv.currentValue, 0),
        whitepaperAlignment: {
          expectedYearlyAPY: WHITEPAPER_CONFIG.expectedYearlyReturn * 100,
          totalAPY: WHITEPAPER_CONFIG.totalAPY * 100,
          currentAvaPrice: WHITEPAPER_CONFIG.currentAvaPrice,
          strategyAllocation: {
            bitcoin: '80%',
            tokenLiquidity: '20%'
          }
        },
        investors: dataToExport
      };
      
      const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `avalon-investors-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    }
  }, [investors]);

  // Initialize contracts on mount
  useEffect(() => {
    initializeContracts();
  }, [initializeContracts]);

  return {
    investors,
    isLoading,
    error,
    fetchAllInvestors,
    getInvestorAnalytics,
    exportInvestorData,
    contracts,
    whitepaperConfig: WHITEPAPER_CONFIG // Expose for reference
  };
};