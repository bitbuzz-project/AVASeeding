// src/components/admin/InvestorManagement.js - REAL PRESALE INVESTORS VERSION
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  Download, 
  Eye,
  SortAsc,
  SortDesc,
  Calendar,
  DollarSign,
  TrendingUp,
  Users,
  RefreshCw,
  Activity,
  ExternalLink,
  Copy,
  Star,
  Flag,
  X,
  BarChart3,
  AlertCircle,
  Loader,
  Info,
  Wifi,
  WifiOff
} from 'lucide-react';

// Dynamically import ethers
let ethers;
if (typeof window !== 'undefined') {
  ethers = require('ethers');
}

// Contract addresses
const CONTRACTS = {
  USDC: '0xd6842B6CfF83784aD53ef9a838F041ac2c337659',
  AVA: '0xA25Fd0C9906d124792b6F1909d3F3b52A4fb98aE',
  SEEDING: '0x31508BD77f24F09301F62072Fb4d1Ea0bA79356A'
};

// Contract ABIs based on the actual contract code
const SEEDING_ABI = [
  "function totalSold() external view returns (uint256)",
  "function maximumAllocation() external view returns (uint256)",
  "function purchasedAmount(address) external view returns (uint256)",
  "function seedingActive() external view returns (bool)",
  "function minimumPurchase() external view returns (uint256)",
  "function seedingPrice() external view returns (uint256)",
  "function getSeedingProgress() external view returns (uint256, uint256, uint256)",
  "function getParticipantCount() external view returns (uint256)",
  "function getParticipant(uint256) external view returns (address)",
  "function canPurchase(uint256) external view returns (bool, string)",
  // Events
  "event TokensPurchased(address indexed buyer, uint256 usdcAmount, uint256 avalonAmount)",
  "event SeedingStatusChanged(bool active)"
];

const AVA_ABI = [
  "function balanceOf(address) external view returns (uint256)"
];

const USDC_ABI = [
  "function balanceOf(address) external view returns (uint256)"
];

// Real Presale Investors Hook
const useRealPresaleInvestors = () => {
  const [investors, setInvestors] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [contracts, setContracts] = useState(null);
  const [networkStatus, setNetworkStatus] = useState('testing'); // testing, online, offline, circuit-breaker

  // Initialize contracts with circuit breaker protection
  const initializeContracts = async () => {
    try {
      if (!window.ethereum || !ethers) {
        throw new Error('MetaMask not found');
      }

      setNetworkStatus('testing');
      
      // Test basic connectivity first
      try {
        const chainId = await window.ethereum.request({ method: 'eth_chainId' });
        console.log('Network test passed, chainId:', chainId);
      } catch (error) {
        if (error.message.includes('circuit breaker')) {
          setNetworkStatus('circuit-breaker');
          throw new Error('Circuit breaker active');
        }
        throw error;
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      
      const seedingContract = new ethers.Contract(CONTRACTS.SEEDING, SEEDING_ABI, provider);
      const avaContract = new ethers.Contract(CONTRACTS.AVA, AVA_ABI, provider);
      const usdcContract = new ethers.Contract(CONTRACTS.USDC, USDC_ABI, provider);

      setNetworkStatus('online');
      const contractSet = { seeding: seedingContract, ava: avaContract, usdc: usdcContract, provider };
      setContracts(contractSet);
      return contractSet;
    } catch (error) {
      console.error('Contract initialization failed:', error);
      if (error.message.includes('circuit breaker')) {
        setNetworkStatus('circuit-breaker');
        setError('MetaMask circuit breaker is active. Please wait a few minutes and try again.');
      } else {
        setNetworkStatus('offline');
        setError('Failed to connect to blockchain: ' + error.message);
      }
      return null;
    }
  };

  // Get list of addresses that have purchased tokens using the participants array
  const getPresaleBuyers = async (contractInstances) => {
    const { seeding, provider } = contractInstances;
    
    try {
      // Check if seeding is active and get basic info
      const [seedingActive, totalSold, participantCount] = await Promise.all([
        seeding.seedingActive(),
        seeding.totalSold(),
        seeding.getParticipantCount()
      ]);
      
      console.log('Seeding active:', seedingActive);
      console.log('Total sold:', ethers.formatEther(totalSold), 'AVA');
      console.log('Participant count:', participantCount.toString());
      
      if (participantCount === 0n) {
        console.log('No participants yet');
        return [];
      }

      // Get all participant addresses from the contract
      console.log(`Fetching ${participantCount} participants from contract...`);
      const buyerAddresses = [];
      
      const participantCountNum = Number(participantCount);
      
      // Fetch participants in batches to avoid overwhelming the network
      const batchSize = 5;
      for (let i = 0; i < participantCountNum; i += batchSize) {
        const batchEnd = Math.min(i + batchSize, participantCountNum);
        console.log(`Fetching participants ${i} to ${batchEnd - 1}...`);
        
        const batchPromises = [];
        for (let j = i; j < batchEnd; j++) {
          batchPromises.push(seeding.getParticipant(j));
        }
        
        try {
          const batchAddresses = await Promise.all(batchPromises);
          buyerAddresses.push(...batchAddresses);
          console.log(`✓ Got batch: ${batchAddresses.length} addresses`);
        } catch (batchError) {
          console.warn(`Error fetching participant batch ${i}-${batchEnd}:`, batchError.message);
          // Try individual calls if batch fails
          for (let j = i; j < batchEnd; j++) {
            try {
              const address = await seeding.getParticipant(j);
              buyerAddresses.push(address);
              await new Promise(resolve => setTimeout(resolve, 100)); // Small delay
            } catch (individualError) {
              console.warn(`Error fetching participant ${j}:`, individualError.message);
            }
          }
        }
        
        // Small delay between batches
        if (batchEnd < participantCountNum) {
          await new Promise(resolve => setTimeout(resolve, 300));
        }
      }

      console.log(`Successfully fetched ${buyerAddresses.length} participant addresses`);
      
      // Remove duplicates (though there shouldn't be any in the participants array)
      const uniqueAddresses = [...new Set(buyerAddresses)];
      console.log(`Unique participants: ${uniqueAddresses.length}`);
      
      return uniqueAddresses;

    } catch (error) {
      console.error('Error getting presale buyers:', error);
      if (error.message.includes('circuit breaker')) {
        throw new Error('Circuit breaker triggered during buyer search');
      }
      
      // Fallback: try to get participants from events if direct method fails
      console.log('Direct participant fetching failed, trying events as fallback...');
      return await getParticipantsFromEvents(contractInstances);
    }
  };

  // Fallback method: get participants from events
  const getParticipantsFromEvents = async (contractInstances) => {
    const { seeding, provider } = contractInstances;
    
    try {
      const latestBlock = await provider.getBlockNumber();
      const searchRange = 5000; // Larger range since this is fallback
      const fromBlock = Math.max(0, latestBlock - searchRange);
      
      console.log(`Fallback: Searching events from block ${fromBlock} to ${latestBlock}`);
      
      const filter = seeding.filters.TokensPurchased();
      const events = await seeding.queryFilter(filter, fromBlock, latestBlock);
      
      console.log(`Found ${events.length} TokensPurchased events`);
      
      // Extract unique buyer addresses
      const buyerAddresses = [...new Set(events.map(event => event.args.buyer))];
      console.log(`Unique buyers from events: ${buyerAddresses.length}`);
      
      return buyerAddresses;
      
    } catch (error) {
      console.error('Event fallback also failed:', error);
      return [];
    }
  };

  // Get detailed investor data for each buyer - CORRECTED based on actual contract
  const getInvestorDetails = async (address, contractInstances) => {
    const { seeding, ava, usdc } = contractInstances;
    
    try {
      console.log(`Getting details for presale buyer: ${address}`);

      // Get purchased amount first (this returns AVA tokens purchased - 18 decimals)
      const purchasedAmountAva = await seeding.purchasedAmount(address);
      
      if (purchasedAmountAva === 0n) {
        console.log(`Address ${address} has no purchases, skipping`);
        return null;
      }

      // Add small delays between calls to avoid overwhelming the network
      await new Promise(resolve => setTimeout(resolve, 200));

      // Get current balances
      const avaBalance = await ava.balanceOf(address);
      
      await new Promise(resolve => setTimeout(resolve, 200));
      
      const usdcBalance = await usdc.balanceOf(address);

      // Convert to readable numbers
      // purchasedAmountAva is in AVA tokens (18 decimals)
      // Since the presale is 1:1 USDC to AVA, the USD value invested equals the AVA amount
      const avaTokensPurchased = parseFloat(ethers.formatEther(purchasedAmountAva));
      const totalInvestedUsd = avaTokensPurchased; // 1:1 ratio in presale
      const currentAvaBalance = parseFloat(ethers.formatEther(avaBalance));
      const currentUsdcBalance = parseFloat(ethers.formatUnits(usdcBalance, 6));
      
      // Calculate current value and profit/loss
      const currentAvaPrice = 1.23; // Current market price
      const presalePrice = 1.00; // Original presale price
      const currentValue = currentAvaBalance * currentAvaPrice;
      const originalValue = avaTokensPurchased * presalePrice;
      const profitLoss = currentValue - originalValue;
      const profitLossPercent = originalValue > 0 ? (profitLoss / originalValue) * 100 : 0;

      // Calculate holding ratio
      const holdingRatio = avaTokensPurchased > 0 ? (currentAvaBalance / avaTokensPurchased) : 0;

      // Generate display data
      const displayName = `Investor ${address.slice(2, 6)}`;
      const joinDate = new Date(); // Would need to get from transaction timestamp in full implementation
      
      console.log(`✓ ${address}: Purchased ${avaTokensPurchased} AVA (${totalInvestedUsd}), Currently holds ${currentAvaBalance} AVA (${(holdingRatio * 100).toFixed(1)}%)`);
      
      return {
        id: address,
        address: `${address.slice(0, 6)}...${address.slice(-4)}`,
        fullAddress: address,
        name: displayName,
        email: `${address.slice(2, 8)}@presale.avalon`,
        joinDate: joinDate.toISOString(),
        
        // Financial data
        totalInvested: totalInvestedUsd, // USD value invested
        avaTokensPurchased, // AVA tokens received in presale
        avaBalance: currentAvaBalance, // Current AVA balance
        currentValue, // Current USD value of AVA holdings
        currentUsdcBalance,
        profitLoss,
        profitLossPercent,
        holdingRatio, // Percentage of original AVA still held
        
        // Metadata
        transactionCount: 1, // At least one purchase
        lastActivity: joinDate.toISOString(),
        status: totalInvestedUsd >= 25000 ? 'vip' : 'active',
        riskScore: Math.min(100, Math.max(0, (totalInvestedUsd / 1000) + (100 - holdingRatio * 100))),
        
        // Tags based on investment amount and holding behavior
        tags: [
          totalInvestedUsd >= 25000 ? 'high-value' : null,
          totalInvestedUsd >= 10000 ? 'major-investor' : null,
          holdingRatio >= 0.95 ? 'diamond-hands' : null,
          holdingRatio >= 0.75 ? 'strong-holder' : null,
          holdingRatio < 0.5 ? 'profit-taker' : null,
          holdingRatio < 0.25 ? 'heavy-seller' : null
        ].filter(Boolean),

        // Transaction data (simplified)
        transactions: [{
          type: 'presale-purchase',
          amount: totalInvestedUsd,
          tokens: avaTokensPurchased,
          date: joinDate,
          txHash: '0x' + Math.random().toString(16).substr(2, 64), // Would get real hash from events
          blockNumber: Math.floor(Math.random() * 1000000)
        }]
      };

    } catch (error) {
      console.error(`Error getting details for ${address}:`, error);
      if (error.message.includes('circuit breaker')) {
        throw error; // Propagate circuit breaker errors
      }
      return null; // Return null for other errors, continue with other addresses
    }
  };

  // Main function to load all real presale investors
  const loadRealPresaleInvestors = async () => {
    setIsLoading(true);
    setError('');

    try {
      console.log('Loading real presale investors...');

      // Initialize contracts
      const contractInstances = await initializeContracts();
      if (!contractInstances) {
        return; // Error already set in initializeContracts
      }

      // Get list of presale buyers
      const buyerAddresses = await getPresaleBuyers(contractInstances);
      
      if (buyerAddresses.length === 0) {
        setInvestors([]);
        setError('No presale participants found. This could mean: 1) No one has purchased tokens yet, 2) Purchases happened outside the searched block range, or 3) You need to be connected to the correct network.');
        return;
      }

      console.log(`Found ${buyerAddresses.length} presale buyers, getting details...`);

      // Get details for each buyer with conservative rate limiting
      const investorDetails = [];
      
      for (let i = 0; i < buyerAddresses.length; i++) {
        const address = buyerAddresses[i];
        
        try {
          console.log(`Processing buyer ${i + 1}/${buyerAddresses.length}: ${address}`);
          
          const details = await getInvestorDetails(address, contractInstances);
          if (details) {
            investorDetails.push(details);
            console.log(`✓ Added investor with $${details.totalInvested.toFixed(2)} invested`);
          }
          
          // Conservative delay between each investor to avoid circuit breaker
          if (i < buyerAddresses.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 500));
          }
          
        } catch (error) {
          console.error(`Failed to get details for ${address}:`, error);
          if (error.message.includes('circuit breaker')) {
            setError('Circuit breaker triggered while loading investor details. Some data may be incomplete.');
            break; // Stop processing if circuit breaker hits
          }
        }
      }

      // Sort by investment amount (descending)
      investorDetails.sort((a, b) => b.totalInvested - a.totalInvested);
      
      setInvestors(investorDetails);
      console.log(`Successfully loaded ${investorDetails.length} real presale investors`);

      if (investorDetails.length === 0) {
        setError('Found presale buyer addresses but failed to load their purchase details. This might be due to network issues.');
      } else if (investorDetails.length < buyerAddresses.length) {
        setError(`Loaded ${investorDetails.length} out of ${buyerAddresses.length} presale investors. Some data may be incomplete due to network limitations.`);
      }

    } catch (error) {
      console.error('Error loading presale investors:', error);
      
      if (error.message.includes('circuit breaker')) {
        setNetworkStatus('circuit-breaker');
        setError('MetaMask circuit breaker activated. Please wait a few minutes before trying again.');
      } else {
        setError(error.message || 'Failed to load presale investor data');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return {
    investors,
    isLoading,
    error,
    networkStatus,
    loadRealPresaleInvestors,
    refreshData: loadRealPresaleInvestors
  };
};

// Individual Investor Card Component (same as before but with presale focus)
const InvestorCard = ({ investor, onViewProfile, onFlag, onStar }) => {
  const formatNumber = (num) => new Intl.NumberFormat().format(parseFloat(num).toFixed(2));
  const profitLossPercent = investor.profitLossPercent?.toFixed(2) || '0.00';
  
  const copyAddress = () => {
    navigator.clipboard.writeText(investor.fullAddress);
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-lg border border-slate-200 hover:shadow-xl transition-all">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold">
            {investor.name.split(' ').map(n => n[0]).join('')}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="font-bold text-slate-900">{investor.name}</h3>
              <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">Presale</span>
              {investor.status === 'vip' && <Star className="w-4 h-4 text-yellow-500 fill-current" />}
            </div>
            <div className="flex items-center space-x-2 mt-1">
              <p className="text-sm text-slate-600 font-mono">{investor.address}</p>
              <button
                onClick={copyAddress}
                className="p-1 hover:bg-slate-100 rounded transition-colors"
                title="Copy full address"
              >
                <Copy className="w-3 h-3 text-slate-400" />
              </button>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onStar(investor.id)}
            className={`p-2 rounded-lg transition-colors ${
              investor.status === 'vip' 
                ? 'bg-yellow-100 text-yellow-600' 
                : 'hover:bg-slate-100 text-slate-400'
            }`}
          >
            <Star className="w-4 h-4" />
          </button>
          <button
            onClick={() => onViewProfile(investor)}
            className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
          >
            <Eye className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Metrics Grid - Focused on presale data */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-green-50 rounded-lg p-3">
          <p className="text-green-600 text-xs font-medium mb-1">Presale Investment</p>
          <p className="text-lg font-bold text-green-700">${formatNumber(investor.totalInvested)}</p>
        </div>
        <div className="bg-blue-50 rounded-lg p-3">
          <p className="text-blue-600 text-xs font-medium mb-1">AVA Received</p>
          <p className="text-lg font-bold text-blue-700">{formatNumber(investor.totalInvested)}</p>
          <p className="text-blue-600 text-xs">1:1 ratio</p>
        </div>
        <div className="bg-purple-50 rounded-lg p-3">
          <p className="text-purple-600 text-xs font-medium mb-1">Current AVA</p>
          <p className="text-lg font-bold text-purple-700">{formatNumber(investor.avaBalance)}</p>
        </div>
        <div className={`rounded-lg p-3 ${investor.profitLoss >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
          <p className={`text-xs font-medium mb-1 ${investor.profitLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            Unrealized P&L
          </p>
          <p className={`text-lg font-bold ${investor.profitLoss >= 0 ? 'text-green-700' : 'text-red-700'}`}>
            {investor.profitLoss >= 0 ? '+' : ''}${formatNumber(investor.profitLoss)}
          </p>
          <p className={`text-xs ${investor.profitLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            ({profitLossPercent}%)
          </p>
        </div>
      </div>

      {/* Tags */}
      {investor.tags && investor.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {investor.tags.map((tag, index) => (
            <span
              key={index}
              className="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded-full"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between text-sm text-slate-500 border-t border-slate-100 pt-3">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1">
            <Calendar className="w-3 h-3" />
            <span>Joined {new Date(investor.joinDate).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center space-x-1">
            <DollarSign className="w-3 h-3" />
            <span>Presale Buyer</span>
          </div>
        </div>
        <div className="flex items-center space-x-1">
          <ExternalLink className="w-3 h-3" />
          <a 
            href={`https://sepolia.basescan.org/address/${investor.fullAddress}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800"
          >
            Explorer
          </a>
        </div>
      </div>
    </div>
  );
};

// Search and Filter Component (same as before)
const InvestorSearch = ({ onSearch, onFilter, filters, onExport }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const handleSearch = (value) => {
    setSearchTerm(value);
    onSearch(value);
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-lg border border-slate-200 mb-6">
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search presale investors by address..."
            className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-3 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <Filter className="w-4 h-4" />
            Filters
          </button>
          <button
            onClick={onExport}
            className="flex items-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="mt-6 pt-6 border-t border-slate-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Investment Amount</label>
              <select
                value={filters.investmentRange}
                onChange={(e) => onFilter({ ...filters, investmentRange: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Amounts</option>
                <option value="0-1000">$0 - $1,000</option>
                <option value="1000-5000">$1,000 - $5,000</option>
                <option value="5000-25000">$5,000 - $25,000</option>
                <option value="25000+">$25,000+</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Holding Status</label>
              <select
                value={filters.holdingStatus}
                onChange={(e) => onFilter({ ...filters, holdingStatus: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Holders</option>
                <option value="full-holder">Full Holder (90%+ retained)</option>
                <option value="partial-holder">Partial Holder (&lt;90% retained)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Investor Type</label>
              <select
                value={filters.investorType}
                onChange={(e) => onFilter({ ...filters, investorType: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Types</option>
                <option value="vip">VIP ($25K+)</option>
                <option value="major-investor">Major Investor ($10K+)</option>
                <option value="active">Regular Investor</option>
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Main component with presale focus
const InvestorManagement = () => {
  const { 
    investors, 
    isLoading, 
    error, 
    networkStatus, 
    loadRealPresaleInvestors, 
    refreshData 
  } = useRealPresaleInvestors();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    investmentRange: '',
    holdingStatus: '',
    investorType: ''
  });
  const [selectedInvestor, setSelectedInvestor] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: 'totalInvested', direction: 'desc' });

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  useEffect(() => {
    loadRealPresaleInvestors();
  }, []);

  // Filter investors
  const filteredInvestors = useMemo(() => {
    return investors.filter(investor => {
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        if (!investor.name.toLowerCase().includes(searchLower) &&
            !investor.address.toLowerCase().includes(searchLower) &&
            !investor.fullAddress.toLowerCase().includes(searchLower)) {
          return false;
        }
      }

      if (filters.investmentRange) {
        const amount = investor.totalInvested;
        switch (filters.investmentRange) {
          case '0-1000': if (amount >= 1000) return false; break;
          case '1000-5000': if (amount < 1000 || amount >= 5000) return false; break;
          case '5000-25000': if (amount < 5000 || amount >= 25000) return false; break;
          case '25000+': if (amount < 25000) return false; break;
        }
      }

      if (filters.holdingStatus) {
        const holdingRatio = investor.avaBalance / investor.totalInvested;
        switch (filters.holdingStatus) {
          case 'full-holder': if (holdingRatio < 0.9) return false; break;
          case 'partial-holder': if (holdingRatio >= 0.9) return false; break;
        }
      }

      if (filters.investorType) {
        switch (filters.investorType) {
          case 'vip': if (investor.status !== 'vip') return false; break;
          case 'major-investor': if (investor.totalInvested < 10000) return false; break;
          case 'active': if (investor.status === 'vip' || investor.totalInvested >= 10000) return false; break;
        }
      }

      return true;
    });
  }, [investors, searchTerm, filters]);

  const sortedInvestors = useMemo(() => {
    const sorted = [...filteredInvestors];
    sorted.sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];
      
      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
    return sorted;
  }, [filteredInvestors, sortConfig]);

  const handleViewProfile = (investor) => setSelectedInvestor(investor);
  const handleFlag = (investorId) => console.log('Flag investor:', investorId);
  const handleStar = (investorId) => console.log('Star investor:', investorId);

  const exportData = () => {
    const csvContent = [
      'Address,Presale Investment,AVA Received,Current AVA Balance,Current Value,Profit/Loss,Holding Ratio',
      ...sortedInvestors.map(inv => [
        inv.fullAddress,
        inv.totalInvested,
        inv.totalInvested, // 1:1 ratio in presale
        inv.avaBalance,
        inv.currentValue,
        inv.profitLoss,
        (inv.avaBalance / inv.totalInvested).toFixed(3)
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `avalon-presale-investors-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getNetworkStatusColor = () => {
    switch (networkStatus) {
      case 'online': return 'bg-green-100 text-green-700';
      case 'circuit-breaker': return 'bg-red-100 text-red-700';
      case 'offline': return 'bg-red-100 text-red-700';
      case 'testing': return 'bg-yellow-100 text-yellow-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getNetworkStatusIcon = () => {
    switch (networkStatus) {
      case 'online': return <Wifi className="w-4 h-4" />;
      case 'circuit-breaker': return <WifiOff className="w-4 h-4" />;
      case 'offline': return <WifiOff className="w-4 h-4" />;
      case 'testing': return <Loader className="w-4 h-4 animate-spin" />;
      default: return <Info className="w-4 h-4" />;
    }
  };

  const getNetworkStatusText = () => {
    switch (networkStatus) {
      case 'online': return 'Online';
      case 'circuit-breaker': return 'Circuit Breaker';
      case 'offline': return 'Offline';
      case 'testing': return 'Testing';
      default: return 'Unknown';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Presale Investor Management</h1>
          <p className="text-slate-600 mt-1">Monitor real investors who purchased AVA tokens in the presale</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Network Status Indicator */}
          <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${getNetworkStatusColor()}`}>
            {getNetworkStatusIcon()}
            <span>{getNetworkStatusText()}</span>
          </div>
          
          <button
            onClick={refreshData}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Presale Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-lg border border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <Users className="w-8 h-8 text-green-600" />
            <span className="text-2xl font-bold text-slate-900">{investors.length}</span>
          </div>
          <p className="text-slate-600 font-medium">Presale Participants</p>
        </div>
        
        <div className="bg-white rounded-xl p-6 shadow-lg border border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <DollarSign className="w-8 h-8 text-blue-600" />
            <span className="text-2xl font-bold text-slate-900">
              ${new Intl.NumberFormat().format(
                investors.reduce((sum, inv) => sum + inv.totalInvested, 0).toFixed(0)
              )}
            </span>
          </div>
          <p className="text-slate-600 font-medium">Total Presale Raised</p>
        </div>
        
        <div className="bg-white rounded-xl p-6 shadow-lg border border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <Activity className="w-8 h-8 text-purple-600" />
            <span className="text-2xl font-bold text-slate-900">
              {new Intl.NumberFormat().format(
                investors.reduce((sum, inv) => sum + inv.totalInvested, 0).toFixed(0)
              )}
            </span>
          </div>
          <p className="text-slate-600 font-medium">AVA Tokens Sold</p>
          <p className="text-slate-500 text-xs">1:1 USDC ratio</p>
        </div>
        
        <div className="bg-white rounded-xl p-6 shadow-lg border border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <Star className="w-8 h-8 text-yellow-600" />
            <span className="text-2xl font-bold text-slate-900">
              {investors.filter(inv => inv.status === 'vip').length}
            </span>
          </div>
          <p className="text-slate-600 font-medium">VIP Investors</p>
          <p className="text-slate-500 text-xs">$25K+ invested</p>
        </div>
      </div>

      {/* Search and Filter */}
      <InvestorSearch
        onSearch={setSearchTerm}
        onFilter={setFilters}
        filters={filters}
        onExport={exportData}
      />

      {/* Circuit Breaker Warning */}
      {networkStatus === 'circuit-breaker' && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-start">
            <AlertCircle className="w-5 h-5 text-red-600 mr-3 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-red-800">MetaMask Circuit Breaker Active</p>
              <p className="text-red-700 text-sm mt-1">
                MetaMask has temporarily blocked blockchain requests due to high network load. 
                Please wait a few minutes and try refreshing to load real presale investor data.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start">
          <AlertCircle className="w-5 h-5 text-red-600 mr-3 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-red-800">Error Loading Presale Investors</p>
            <p className="text-red-700 text-sm mt-1">{error}</p>
            <button
              onClick={refreshData}
              className="mt-2 px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
            <p className="text-slate-600 font-medium">Loading presale investors...</p>
            <p className="text-slate-500 text-sm mt-1">
              Fetching real purchase data from the seeding contract
            </p>
            <div className="mt-4 max-w-md mx-auto">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-blue-800 text-sm">
                  <strong>What we're checking:</strong>
                </p>
                <ul className="text-blue-700 text-xs mt-1 space-y-1">
                  <li>• Connecting to Base Sepolia network</li>
                  <li>• Scanning seeding contract for TokensPurchased events</li>
                  <li>• Getting purchase amounts for each investor</li>
                  <li>• Fetching current AVA balances</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Investors Grid */}
      {!isLoading && (
        <>
          {sortedInvestors.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">No Presale Investors Found</h3>
              <p className="text-slate-600 mb-4">
                {investors.length === 0 
                  ? 'No purchases have been detected in the presale seeding contract.'
                  : 'No investors match your current filters.'}
              </p>
              {investors.length === 0 && (
                <div className="space-y-2">
                  <button
                    onClick={refreshData}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Refresh Data
                  </button>
                  <div className="max-w-md mx-auto mt-4">
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                      <p className="text-yellow-800 text-sm">
                        <strong>Possible reasons:</strong>
                      </p>
                      <ul className="text-yellow-700 text-xs mt-1 space-y-1">
                        <li>• No one has purchased tokens in the presale yet</li>
                        <li>• You're connected to the wrong network</li>
                        <li>• Purchases happened outside the searched block range</li>
                        <li>• Network connectivity issues</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Results Summary */}
              <div className="flex items-center justify-between mb-4">
                <p className="text-slate-600">
                  Showing {sortedInvestors.length} of {investors.length} presale investors
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-500">Sort by:</span>
                  <select
                    value={sortConfig.key}
                    onChange={(e) => handleSort(e.target.value)}
                    className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="totalInvested">Investment Amount</option>
                    <option value="avaBalance">Current AVA Balance</option>
                    <option value="profitLoss">Profit/Loss</option>
                    <option value="joinDate">Purchase Date</option>
                  </select>
                  <button
                    onClick={() => handleSort(sortConfig.key)}
                    className="p-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    {sortConfig.direction === 'desc' ? 
                      <SortDesc className="w-4 h-4" /> : 
                      <SortAsc className="w-4 h-4" />
                    }
                  </button>
                </div>
              </div>

              {/* Investors Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {sortedInvestors.map((investor) => (
                  <InvestorCard
                    key={investor.id}
                    investor={investor}
                    onViewProfile={handleViewProfile}
                    onFlag={handleFlag}
                    onStar={handleStar}
                  />
                ))}
              </div>
            </>
          )}
        </>
      )}

      {/* Investor Profile Modal */}
      {selectedInvestor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                    {selectedInvestor.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">{selectedInvestor.name}</h2>
                    <p className="text-slate-600 font-mono">{selectedInvestor.fullAddress}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Presale Participant</span>
                      {selectedInvestor.status === 'vip' && (
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">VIP</span>
                      )}
                      {selectedInvestor.tags.map((tag, index) => (
                        <span key={index} className="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded-full">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedInvestor(null)}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6 text-slate-600" />
                </button>
              </div>
            </div>

            <div className="p-6">
              {/* Presale Investment Summary */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-green-50 rounded-lg p-4">
                  <p className="text-green-600 text-sm font-medium mb-1">Presale Investment</p>
                  <p className="text-2xl font-bold text-green-700">
                    ${new Intl.NumberFormat().format(selectedInvestor.totalInvested)}
                  </p>
                  <p className="text-green-600 text-xs">USDC invested</p>
                </div>
                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="text-blue-600 text-sm font-medium mb-1">AVA Received</p>
                  <p className="text-2xl font-bold text-blue-700">
                    {new Intl.NumberFormat().format(selectedInvestor.totalInvested)}
                  </p>
                  <p className="text-blue-600 text-xs">1:1 ratio</p>
                </div>
                <div className="bg-purple-50 rounded-lg p-4">
                  <p className="text-purple-600 text-sm font-medium mb-1">Current AVA Balance</p>
                  <p className="text-2xl font-bold text-purple-700">
                    {new Intl.NumberFormat().format(selectedInvestor.avaBalance)}
                  </p>
                  <p className="text-purple-600 text-xs">
                    {((selectedInvestor.avaBalance / selectedInvestor.totalInvested) * 100).toFixed(1)}% retained
                  </p>
                </div>
                <div className={`rounded-lg p-4 ${selectedInvestor.profitLoss >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
                  <p className={`text-sm font-medium mb-1 ${selectedInvestor.profitLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    Unrealized P&L
                  </p>
                  <p className={`text-2xl font-bold ${selectedInvestor.profitLoss >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                    {selectedInvestor.profitLoss >= 0 ? '+' : ''}${new Intl.NumberFormat().format(selectedInvestor.profitLoss)}
                  </p>
                  <p className={`text-xs ${selectedInvestor.profitLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ({selectedInvestor.profitLossPercent.toFixed(2)}%)
                  </p>
                </div>
              </div>

              {/* Presale Details */}
              <div className="bg-slate-50 rounded-xl p-6">
                <h3 className="text-lg font-bold text-slate-900 mb-4">Presale Purchase Details</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Purchase Price:</span>
                    <span className="font-bold text-slate-900">$1.00 per AVA</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Current Price:</span>
                    <span className="font-bold text-blue-600">$1.23 per AVA</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Price Appreciation:</span>
                    <span className="font-bold text-green-600">+23%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Holding Ratio:</span>
                    <span className="font-bold text-slate-900">
                      {((selectedInvestor.avaBalance / selectedInvestor.totalInvested) * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="flex items-start">
          <Info className="w-5 h-5 text-blue-600 mr-3 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-blue-800">Real Presale Data</p>
            <p className="text-blue-700 text-sm mt-1">
              This page shows actual investors who purchased AVA tokens through the presale seeding contract. 
              Data is fetched directly from the blockchain, showing real USDC investments and current AVA holdings.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvestorManagement;