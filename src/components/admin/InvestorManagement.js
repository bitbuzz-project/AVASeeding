// src/components/admin/InvestorManagement.js - REAL DATA VERSION
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
  Mail,
  MapPin,
  Activity,
  ExternalLink,
  Copy,
  Star,
  Flag,
  X,
  Edit,
  BarChart3,
  PieChart,
  AlertCircle
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
  SEEDING: '0x507c0270c251C875CB350E6c1E806cb60a9a9970'
};

// Extended ABIs for fetching real investor data
const SEEDING_ABI = [
  "function totalSold() external view returns (uint256)",
  "function maximumAllocation() external view returns (uint256)",
  "function getParticipantCount() external view returns (uint256)",
  "function purchasedAmount(address) external view returns (uint256)",
  "function getSeedingProgress() external view returns (uint256, uint256, uint256)",
  // Events
  "event TokensPurchased(address indexed buyer, uint256 usdcAmount, uint256 avaAmount, uint256 timestamp)"
];

const AVA_ABI = [
  "function balanceOf(address) external view returns (uint256)",
  "function totalSupply() external view returns (uint256)",
  // Events
  "event Transfer(address indexed from, address indexed to, uint256 value)"
];

const USDC_ABI = [
  "function balanceOf(address) external view returns (uint256)"
];

// Real Investor Data Hook
const useRealInvestorData = () => {
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
  const initializeContracts = async () => {
    try {
      if (!window.ethereum || !ethers) {
        throw new Error('MetaMask not found');
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const seeding = new ethers.Contract(CONTRACTS.SEEDING, SEEDING_ABI, provider);
      const ava = new ethers.Contract(CONTRACTS.AVA, AVA_ABI, provider);
      const usdc = new ethers.Contract(CONTRACTS.USDC, USDC_ABI, provider);

      setContracts({ seeding, ava, usdc, provider });
      return { seeding, ava, usdc, provider };
    } catch (error) {
      setError('Failed to connect to blockchain: ' + error.message);
      return null;
    }
  };

  // Fetch all investor addresses from TokensPurchased events
  const fetchInvestorAddresses = async (contractInstances) => {
    const { seeding, provider } = contractInstances;
    if (!seeding || !provider) return [];

    try {
      console.log('Fetching investor addresses...');
      
      // Get TokensPurchased events from contract deployment
      const filter = seeding.filters.TokensPurchased();
      const events = await seeding.queryFilter(filter, 0, 'latest');
      
      console.log('Found events:', events.length);

      // Extract unique investor addresses
      const addressSet = new Set();
      const addressDetails = new Map();

      events.forEach(event => {
        const address = event.args.buyer;
        addressSet.add(address);
        
        // Store first purchase info
        if (!addressDetails.has(address)) {
          addressDetails.set(address, {
            firstPurchase: {
              usdcAmount: event.args.usdcAmount,
              avaAmount: event.args.avaAmount,
              blockNumber: event.blockNumber,
              txHash: event.transactionHash
            }
          });
        }
      });

      return { addresses: Array.from(addressSet), details: addressDetails };
    } catch (error) {
      console.error('Error fetching investor addresses:', error);
      return { addresses: [], details: new Map() };
    }
  };

  // Fetch detailed data for each investor
  const fetchInvestorDetails = async (address, contractInstances, addressDetails) => {
    const { seeding, ava, usdc, provider } = contractInstances;
    if (!seeding || !ava || !usdc || !provider || !ethers) return null;

    try {
      console.log('Fetching details for:', address);

      // Get current balances and purchase amount
      const [purchasedAmount, avaBalance, usdcBalance] = await Promise.all([
        seeding.purchasedAmount(address),
        ava.balanceOf(address),
        usdc.balanceOf(address)
      ]);

      // Get transaction history
      const [purchaseEvents, transferEvents] = await Promise.all([
        seeding.queryFilter(seeding.filters.TokensPurchased(address), 0, 'latest'),
        ava.queryFilter(ava.filters.Transfer(null, address), 0, 'latest')
      ]);

      // Process transactions with timestamps
      const transactions = [];
      
      for (const event of purchaseEvents) {
        const block = await provider.getBlock(event.blockNumber);
        transactions.push({
          type: 'purchase',
          amount: parseFloat(ethers.formatUnits(event.args.usdcAmount, 6)),
          tokens: parseFloat(ethers.formatEther(event.args.avaAmount)),
          date: new Date(block.timestamp * 1000),
          txHash: event.transactionHash,
          blockNumber: event.blockNumber
        });
      }

      // Sort transactions by date
      transactions.sort((a, b) => b.date - a.date);

      // Calculate metrics
      const totalInvested = parseFloat(ethers.formatUnits(purchasedAmount, 6)); // USDC has 6 decimals
      const currentAvaBalance = parseFloat(ethers.formatEther(avaBalance));
      const currentUsdcBalance = parseFloat(ethers.formatUnits(usdcBalance, 6));
      const currentValue = currentAvaBalance * 1.23; // Assuming 1 AVA = $1.23
      const profitLoss = currentValue - totalInvested;
      const joinDate = transactions.length > 0 ? transactions[transactions.length - 1].date : new Date();
      const lastActivity = transactions.length > 0 ? transactions[0].date : joinDate;

      // Generate display name from address
      const displayName = `Investor ${address.slice(2, 6)}`;

      return {
        id: address,
        address: `${address.slice(0, 6)}...${address.slice(-4)}`,
        fullAddress: address,
        name: displayName,
        email: `${address.slice(2, 8)}@investor.avalon`,
        country: 'Unknown', // Can't determine from blockchain
        joinDate: joinDate.toISOString(),
        totalInvested,
        avaBalance: currentAvaBalance,
        currentValue,
        currentUsdcBalance,
        transactionCount: transactions.length,
        lastActivity: lastActivity.toISOString(),
        status: totalInvested > 25000 ? 'vip' : 'active',
        riskScore: Math.min(100, Math.max(0, (totalInvested / 1000) + Math.random() * 20)),
        profitLoss,
        profitLossPercent: totalInvested > 0 ? (profitLoss / totalInvested) * 100 : 0,
        transactions,
        tags: [
          totalInvested > 25000 ? 'high-value' : null,
          transactions.length > 5 ? 'frequent-trader' : null,
          joinDate < new Date('2024-06-01') ? 'early-investor' : null
        ].filter(Boolean)
      };
    } catch (error) {
      console.error(`Error fetching details for ${address}:`, error);
      return null;
    }
  };

  // Main function to load all investors
  const loadAllInvestors = async () => {
    setIsLoading(true);
    setError('');

    try {
      // Initialize contracts
      const contractInstances = await initializeContracts();
      if (!contractInstances) {
        throw new Error('Failed to initialize contracts');
      }

      // Get all investor addresses
      const { addresses, details } = await fetchInvestorAddresses(contractInstances);
      
      if (addresses.length === 0) {
        setInvestors([]);
        setError('No investors found. Make sure the contracts are deployed and have transactions.');
        return;
      }

      console.log(`Found ${addresses.length} unique investors`);

      // Fetch details for each investor (process in batches to avoid rate limiting)
      const batchSize = 5;
      const investorDetails = [];
      
      for (let i = 0; i < addresses.length; i += batchSize) {
        const batch = addresses.slice(i, i + batchSize);
        console.log(`Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(addresses.length/batchSize)}`);
        
        const batchPromises = batch.map(address => 
          fetchInvestorDetails(address, contractInstances, details.get(address))
        );
        
        const batchResults = await Promise.all(batchPromises);
        investorDetails.push(...batchResults.filter(Boolean));
        
        // Small delay between batches
        if (i + batchSize < addresses.length) {
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      }

      // Sort by total invested (descending)
      investorDetails.sort((a, b) => b.totalInvested - a.totalInvested);
      
      setInvestors(investorDetails);
      console.log(`Loaded ${investorDetails.length} investors successfully`);

    } catch (error) {
      console.error('Error loading investors:', error);
      setError(error.message || 'Failed to load investor data');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    investors,
    isLoading,
    error,
    loadAllInvestors,
    refreshData: loadAllInvestors
  };
};

// Individual Investor Card Component (same as before)
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
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
            {investor.name.split(' ').map(n => n[0]).join('')}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="font-bold text-slate-900">{investor.name}</h3>
              {investor.status === 'vip' && <Star className="w-4 h-4 text-yellow-500 fill-current" />}
              {investor.status === 'flagged' && <Flag className="w-4 h-4 text-red-500 fill-current" />}
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
            onClick={() => onFlag(investor.id)}
            className={`p-2 rounded-lg transition-colors ${
              investor.status === 'flagged' 
                ? 'bg-red-100 text-red-600' 
                : 'hover:bg-slate-100 text-slate-400'
            }`}
          >
            <Flag className="w-4 h-4" />
          </button>
          <button
            onClick={() => onViewProfile(investor)}
            className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
          >
            <Eye className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-green-50 rounded-lg p-3">
          <p className="text-green-600 text-xs font-medium mb-1">Total Invested</p>
          <p className="text-lg font-bold text-green-700">${formatNumber(investor.totalInvested)}</p>
        </div>
        <div className="bg-blue-50 rounded-lg p-3">
          <p className="text-blue-600 text-xs font-medium mb-1">AVA Balance</p>
          <p className="text-lg font-bold text-blue-700">{formatNumber(investor.avaBalance)}</p>
        </div>
        <div className="bg-purple-50 rounded-lg p-3">
          <p className="text-purple-600 text-xs font-medium mb-1">Current Value</p>
          <p className="text-lg font-bold text-purple-700">${formatNumber(investor.currentValue)}</p>
        </div>
        <div className={`rounded-lg p-3 ${investor.profitLoss >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
          <p className={`text-xs font-medium mb-1 ${investor.profitLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            P&L
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
            <Activity className="w-3 h-3" />
            <span>{investor.transactionCount} txs</span>
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
        {/* Search Bar */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search by name, address..."
            className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Action Buttons */}
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

      {/* Expandable Filters */}
      {showFilters && (
        <div className="mt-6 pt-6 border-t border-slate-200">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Status</label>
              <select
                value={filters.status}
                onChange={(e) => onFilter({ ...filters, status: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="vip">VIP</option>
                <option value="flagged">Flagged</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Investment Range</label>
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
              <label className="block text-sm font-medium text-slate-700 mb-2">Join Date</label>
              <select
                value={filters.joinDate}
                onChange={(e) => onFilter({ ...filters, joinDate: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Time</option>
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
                <option value="1y">Last year</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Transaction Count</label>
              <select
                value={filters.transactionCount}
                onChange={(e) => onFilter({ ...filters, transactionCount: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Any Count</option>
                <option value="1">Single Purchase</option>
                <option value="2-5">2-5 Transactions</option>
                <option value="5+">5+ Transactions</option>
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};