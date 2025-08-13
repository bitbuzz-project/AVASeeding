// src/hooks/useAdminData.js - CORRECTED FOR ACTUAL CONTRACT STRUCTURE
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
  SEEDING: '0x19CC5bE61a46b66a668fF641FAFa98a5b1805612'
};

// CORRECTED ABI based on your actual contract
const SEEDING_ABI = [
  // Basic functions
  "function totalSold() external view returns (uint256)",
  "function maximumAllocation() external view returns (uint256)",
  "function getParticipantCount() external view returns (uint256)",
  "function getParticipant(uint256) external view returns (address)",
  "function seedingActive() external view returns (bool)",
  "function minimumPurchase() external view returns (uint256)",
  "function seedingPrice() external view returns (uint256)",
  "function getSeedingProgress() external view returns (uint256, uint256, uint256)",
  "function purchasedAmount(address) external view returns (uint256)",
  
  // Referral system - CORRECTED based on your actual contract
  "function validReferralCodes(string) external view returns (bool)",
  "function referralCodeToOwner(string) external view returns (address)",
  "function referralEarnings(address) external view returns (uint256)",
  "function referralCount(address) external view returns (uint256)",
  
  // Functions to add codes (admin only)
  "function addReferralCode(string, address) external",
  "function isValidReferralCode(string) external view returns (bool)",
  
  // Events from your contract
  "event TokensPurchased(address indexed buyer, uint256 usdcAmount, uint256 avalonAmount)",
  "event ReferralCodeAdded(string code, address owner)",
  "event ReferralPurchase(address referee, address referrer, string code, uint256 amount, uint256 bonus)",
  "event ReferralRewardPaid(address referrer, uint256 amount)"
];

// Predefined referral codes from your contract constructor
const PREDEFINED_CODES = [
  "AVALON2025",
  "VOLATILITY", 
  "BMERS2025",
  "BASECHAIN",
  "STRATEGY1",
  "PRESALE01",
  "INVESTOR",
  "TOPWHALE",
  "AVAX2025",
  "REWARDS3"
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
      bitcoin: { allocated: '0', apy: 0, status: 'inactive' },
      baseEcosystem: { allocated: '0', apy: 0, status: 'inactive' },
      tokenLiquidity: { allocated: '0', apy: 0, status: 'inactive' }
    },
    recentInvestors: [],
    monthlyData: [],
    systemHealth: {
      seedingContract: 'unknown',
      avaToken: 'unknown',
      tradingBots: 'unknown'
    },
    referralStats: {
      totalCodes: 0,
      activeCodes: 0,
      totalRewards: '0',
      totalBonusTokens: '0',
      conversionRate: 0
    },
    topReferrers: [],
    recentReferrals: [],
    referralCodes: []
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

      console.log('📊 Basic contract data:', {
        totalSold: ethers.formatEther(totalSold),
        participantCount: Number(participantCount),
        seedingActive
      });

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
      // Get recent TokensPurchased events
      const currentBlock = await provider.getBlockNumber();
      const fromBlock = Math.max(0, currentBlock - 1000);

      const filter = seeding.filters.TokensPurchased();
      const events = await seeding.queryFilter(filter, fromBlock, currentBlock);

      console.log(`📊 Found ${events.length} purchase events`);

      // Process events to get recent investors
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

  // CORRECTED: Fetch referral data based on actual contract structure
  const fetchReferralData = useCallback(async (contractInstances) => {
    const { seeding, provider } = contractInstances || contracts;
    if (!seeding || !provider) {
      console.log('🔴 No seeding contract or provider for referral data');
      return null;
    }

    try {
      console.log('🔍 Starting CORRECTED referral data fetch...');
      
      // Get events for better block range
      const currentBlock = await provider.getBlockNumber();
      const fromBlock = Math.max(0, currentBlock - 10000); // Increased range
      
      console.log(`🔍 Searching blocks ${fromBlock} to ${currentBlock}...`);

      // 1. First, check predefined codes that were set in constructor
      console.log('🔍 Checking predefined referral codes...');
      const referralCodes = [];
      const referrerStatsMap = new Map();

      // Check all predefined codes + any additional codes added via events
      const [codeAddedEvents, referralPurchaseEvents, rewardPaidEvents] = await Promise.all([
        seeding.queryFilter(seeding.filters.ReferralCodeAdded(), fromBlock, currentBlock),
        seeding.queryFilter(seeding.filters.ReferralPurchase(), fromBlock, currentBlock),
        seeding.queryFilter(seeding.filters.ReferralRewardPaid(), fromBlock, currentBlock)
      ]);

      console.log(`🔍 Found ${codeAddedEvents.length} code added events`);
      console.log(`🔍 Found ${referralPurchaseEvents.length} referral purchase events`);
      console.log(`🔍 Found ${rewardPaidEvents.length} reward paid events`);

      // Check predefined codes from constructor
      for (const code of PREDEFINED_CODES) {
        try {
          console.log(`🔍 Checking predefined code: ${code}`);
          
          // Check if code is valid (should be true for predefined codes)
          const isValid = await seeding.validReferralCodes(code);
          console.log(`  - Code ${code} valid: ${isValid}`);
          
          if (isValid) {
            // Get owner of this code
            const owner = await seeding.referralCodeToOwner(code);
            console.log(`  - Code ${code} owner: ${owner}`);
            
            if (owner && owner !== '0x0000000000000000000000000000000000000000') {
              // Get earnings and count for this owner
              const [earnings, count] = await Promise.all([
                seeding.referralEarnings(owner).catch(() => 0n),
                seeding.referralCount(owner).catch(() => 0n)
              ]);

              const earningsFormatted = ethers.formatUnits(earnings, 6);
              const usageCount = Number(count);

              referralCodes.push({
                code,
                owner,
                earnings: earningsFormatted,
                usageCount,
                isActive: usageCount > 0,
                isPredefined: true
              });

              // Update referrer stats
              if (!referrerStatsMap.has(owner)) {
                referrerStatsMap.set(owner, {
                  address: owner,
                  totalEarnings: '0',
                  referralCount: 0,
                  codes: []
                });
              }
              
              const existing = referrerStatsMap.get(owner);
              existing.totalEarnings = (parseFloat(existing.totalEarnings) + parseFloat(earningsFormatted)).toString();
              existing.referralCount = Math.max(existing.referralCount, usageCount);
              existing.codes.push(code);

              console.log(`✅ Predefined code ${code}: ${earningsFormatted} USDC, ${usageCount} uses`);
            }
          }
        } catch (error) {
          console.warn(`❌ Error checking predefined code ${code}:`, error.message);
        }
      }

      // Process additional codes added via events
      for (const event of codeAddedEvents) {
        try {
          const code = event.args.code;
          const owner = event.args.owner;
          
          console.log(`🔍 Processing event-added code: ${code} for owner: ${owner}`);
          
          // Skip if already processed in predefined codes
          if (PREDEFINED_CODES.includes(code)) {
            console.log(`  - Skipping ${code} (already processed as predefined)`);
            continue;
          }
          
          const [earnings, count] = await Promise.all([
            seeding.referralEarnings(owner).catch(() => 0n),
            seeding.referralCount(owner).catch(() => 0n)
          ]);

          const earningsFormatted = ethers.formatUnits(earnings, 6);
          const usageCount = Number(count);

          referralCodes.push({
            code,
            owner,
            earnings: earningsFormatted,
            usageCount,
            isActive: usageCount > 0,
            isPredefined: false
          });

          // Update referrer stats
          if (!referrerStatsMap.has(owner)) {
            referrerStatsMap.set(owner, {
              address: owner,
              totalEarnings: '0',
              referralCount: 0,
              codes: []
            });
          }
          
          const existing = referrerStatsMap.get(owner);
          existing.totalEarnings = (parseFloat(existing.totalEarnings) + parseFloat(earningsFormatted)).toString();
          existing.referralCount = Math.max(existing.referralCount, usageCount);
          existing.codes.push(code);
          
          console.log(`✅ Event code ${code}: ${earningsFormatted} USDC, ${usageCount} uses`);
          
        } catch (error) {
          console.warn(`❌ Error processing code event:`, error.message);
        }
      }

      // Process recent referral purchases
      const recentReferrals = [];
      for (const event of referralPurchaseEvents.slice(-10).reverse()) {
        try {
          const block = await provider.getBlock(event.blockNumber);
          recentReferrals.push({
            referee: event.args.referee,
            referrer: event.args.referrer,
            code: event.args.code,
            amount: ethers.formatUnits(event.args.amount, 6),
            bonus: ethers.formatEther(event.args.bonus),
            date: new Date(block.timestamp * 1000).toISOString(),
            txHash: event.transactionHash
          });
        } catch (error) {
          console.warn(`❌ Error processing referral purchase event:`, error.message);
        }
      }

      // Calculate totals
      const totalRewards = Array.from(referrerStatsMap.values())
        .reduce((sum, referrer) => sum + parseFloat(referrer.totalEarnings), 0);
      
      const totalBonusTokens = recentReferrals
        .reduce((sum, ref) => sum + parseFloat(ref.bonus), 0);

      const activeCodes = referralCodes.filter(code => code.usageCount > 0).length;
      const conversionRate = referralCodes.length > 0 ? 
        (referralPurchaseEvents.length / referralCodes.length) * 100 : 0;

      const topReferrers = Array.from(referrerStatsMap.values())
        .filter(referrer => parseFloat(referrer.totalEarnings) > 0)
        .sort((a, b) => parseFloat(b.totalEarnings) - parseFloat(a.totalEarnings))
        .slice(0, 10);

      const result = {
        totalCodes: referralCodes.length,
        activeCodes,
        totalRewards: totalRewards.toString(),
        totalBonusTokens: totalBonusTokens.toString(),
        conversionRate: Math.round(conversionRate * 100) / 100,
        topReferrers,
        recentReferrals,
        referralCodes: referralCodes.sort((a, b) => b.usageCount - a.usageCount)
      };

      console.log('✅ CORRECTED Referral data summary:', {
        totalCodes: result.totalCodes,
        activeCodes: result.activeCodes,
        totalRewards: result.totalRewards,
        topReferrersCount: result.topReferrers.length,
        recentReferralsCount: result.recentReferrals.length,
        predefinedCodesFound: referralCodes.filter(c => c.isPredefined).length,
        eventCodesFound: referralCodes.filter(c => !c.isPredefined).length
      });

      return result;
      
    } catch (error) {
      console.error('❌ Error fetching CORRECTED referral data:', error);
      
      // Return default data instead of null
      return {
        totalCodes: 0,
        activeCodes: 0,
        totalRewards: '0',
        totalBonusTokens: '0',
        conversionRate: 0,
        topReferrers: [],
        recentReferrals: [],
        referralCodes: []
      };
    }
  }, [contracts]);

  // Calculate strategy performance
  const calculateStrategyPerformance = useCallback((totalInvestments) => {
    const total = parseFloat(totalInvestments);
    return {
      bitcoin: {
        allocated: (total * 0.35).toString(),
        apy: 21.1,
        status: 'active'
      },
      baseEcosystem: {
        allocated: (total * 0.45).toString(),
        apy: 45.7,
        status: 'active'
      },
      tokenLiquidity: {
        allocated: (total * 0.20).toString(),
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
      console.log('🚀 Starting CORRECTED admin data fetch...');
      
      // Initialize contracts if not already done
      const contractInstances = contracts.seeding ? contracts : await initializeContracts();
      if (!contractInstances) {
        throw new Error('Failed to initialize contracts');
      }

      console.log('📊 Fetching all admin data with CORRECTED referral logic...');

      // Fetch all data in parallel
      const [basicData, recentInvestors, systemHealth, referralData] = await Promise.all([
        fetchBasicData(contractInstances),
        fetchRecentInvestors(contractInstances),
        checkSystemHealth(contractInstances),
        fetchReferralData(contractInstances) // Now using corrected logic
      ]);

      if (!basicData) {
        throw new Error('Failed to fetch basic contract data');
      }

      console.log('📊 Basic data fetched:', basicData);
      console.log('📊 CORRECTED Referral data fetched:', referralData);

      // Calculate derived metrics
      const totalInvestments = parseFloat(basicData.totalSold);
      const estimatedRevenue = totalInvestments * 0.25;
      const strategiesPerformance = calculateStrategyPerformance(totalInvestments);

      // Update state with corrected referral data
      const newData = {
        totalInvestments: totalInvestments.toString(),
        totalInvestors: basicData.participantCount,
        totalAvaIssued: basicData.totalSold,
        currentAvaPrice: '1.00',
        totalRevenue: estimatedRevenue.toString(),
        progressPercent: basicData.progressPercent,
        seedingActive: basicData.seedingActive,
        strategiesPerformance,
        recentInvestors,
        monthlyData: [],
        systemHealth,
        referralStats: referralData || {
          totalCodes: 0,
          activeCodes: 0,
          totalRewards: '0',
          totalBonusTokens: '0',
          conversionRate: 0
        },
        topReferrers: referralData?.topReferrers || [],
        recentReferrals: referralData?.recentReferrals || [],
        referralCodes: referralData?.referralCodes || []
      };

      console.log('✅ Final CORRECTED admin data:', {
        totalInvestments: newData.totalInvestments,
        totalInvestors: newData.totalInvestors,
        referralStats: newData.referralStats,
        topReferrersCount: newData.topReferrers.length,
        referralCodesCount: newData.referralCodes.length
      });

      setData(newData);
      setLastUpdate(new Date());
      
    } catch (error) {
      console.error('❌ Error fetching CORRECTED admin data:', error);
      setError(error.message || 'Failed to fetch data');
    } finally {
      setIsLoading(false);
    }
  }, [contracts, initializeContracts, fetchBasicData, fetchRecentInvestors, checkSystemHealth, fetchReferralData, calculateStrategyPerformance]);

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
      referralData: {
        stats: data.referralStats,
        topReferrers: data.topReferrers,
        recentReferrals: data.recentReferrals,
        codes: data.referralCodes
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
    contracts
  };
};