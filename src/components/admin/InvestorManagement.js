// src/components/admin/InvestorManagement.js - COMPLETE FIXED VERSION with batched event fetching
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

  // Helper function to fetch events in batches
  const fetchEventsInBatches = async (contract, filter, fromBlock, toBlock, batchSize = 2000) => {
    let allEvents = [];
    let currentBlock = fromBlock;
    const latestBlock = await contract.runner.getBlockNumber(); // Use runner for provider methods

    while (currentBlock <= toBlock) {
      const endBlock = Math.min(currentBlock + batchSize - 1, toBlock, latestBlock);
      console.log(`Fetching events from block ${currentBlock} to ${endBlock}`);
      
      try {
        const events = await contract.queryFilter(filter, currentBlock, endBlock);
        allEvents = allEvents.concat(events);
      } catch (e) {
        console.warn(`Error fetching events in block range ${currentBlock}-${endBlock}:`, e);
        // Implement exponential backoff or retry logic here if needed
        // For now, we'll just skip this batch or re-throw if it's a critical error
        throw e; // Re-throw to propagate the error
      }
      currentBlock = endBlock + 1;
      await new Promise(resolve => setTimeout(resolve, 50)); // Small delay between batches
    }
    return allEvents;
  };

  // Fetch all investor addresses from TokensPurchased events
  const fetchInvestorAddresses = async (contractInstances) => {
    const { seeding, provider } = contractInstances;
    if (!seeding || !provider) return [];

    try {
      console.log('Fetching investor addresses...');
      
      const filter = seeding.filters.TokensPurchased();
      const latestBlock = await provider.getBlockNumber();
      const deploymentBlock = 0; // Assuming contract deployed at block 0, adjust if known
      
      const events = await fetchEventsInBatches(seeding, filter, deploymentBlock, latestBlock, 50000); // Increased batch size for initial attempt, can be adjusted

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
      // More specific error handling for circuit breaker
      if (error.code === -32603 && error.data && error.data.cause && error.data.cause.isBrokenCircuitError) {
        setError('Blockchain service is currently overloaded. Please try again in a moment or reduce the block range batch size.');
      } else {
        setError('Failed to fetch investor addresses from blockchain: ' + error.message);
      }
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
      const [purchaseEvents, transferEvents] = await Promise(resolve => setTimeout(resolve, 100)).then(async () => {
         const latestBlock = await provider.getBlockNumber();
         return await Promise.all([
             fetchEventsInBatches(seeding, seeding.filters.TokensPurchased(address), 0, latestBlock, 10000), // Smaller batch for specific address
             fetchEventsInBatches(ava, ava.filters.Transfer(null, address), 0, latestBlock, 10000)
         ]);
      });

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

// Individual Investor Card Component
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

// Search and Filter Component
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

// Main InvestorManagement Component
const InvestorManagement = () => {
  const { investors, isLoading, error, loadAllInvestors, refreshData } = useRealInvestorData();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    status: '',
    investmentRange: '',
    joinDate: '',
    transactionCount: ''
  });
  const [selectedInvestor, setSelectedInvestor] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: 'totalInvested', direction: 'desc' });

  // Handle sorting logic
  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Load investors on mount
  useEffect(() => {
    loadAllInvestors();
  }, [loadAllInvestors]);

  // Filter and search investors
  const filteredInvestors = useMemo(() => {
    return investors.filter(investor => {
      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        if (!investor.name.toLowerCase().includes(searchLower) &&
            !investor.address.toLowerCase().includes(searchLower) &&
            !investor.fullAddress.toLowerCase().includes(searchLower)) {
          return false;
        }
      }

      // Status filter
      if (filters.status && investor.status !== filters.status) {
        return false;
      }

      // Investment range filter
      if (filters.investmentRange) {
        const amount = investor.totalInvested;
        switch (filters.investmentRange) {
          case '0-1000':
            if (amount >= 1000) return false;
            break;
          case '1000-5000':
            if (amount < 1000 || amount >= 5000) return false;
            break;
          case '5000-25000':
            if (amount < 5000 || amount >= 25000) return false;
            break;
          case '25000+':
            if (amount < 25000) return false;
            break;
        }
      }

      // Join date filter
      if (filters.joinDate) {
        const joinDate = new Date(investor.joinDate);
        const now = new Date();
        const diffDays = (now - joinDate) / (1000 * 60 * 60 * 24);
        
        switch (filters.joinDate) {
          case '7d':
            if (diffDays > 7) return false;
            break;
          case '30d':
            if (diffDays > 30) return false;
            break;
          case '90d':
            if (diffDays > 90) return false;
            break;
          case '1y':
            if (diffDays > 365) return false;
            break;
        }
      }

      // Transaction count filter
      if (filters.transactionCount) {
        const count = investor.transactionCount;
        switch (filters.transactionCount) {
          case '1':
            if (count !== 1) return false;
            break;
          case '2-5':
            if (count < 2 || count > 5) return false;
            break;
          case '5+':
            if (count <= 5) return false;
            break;
        }
      }

      return true;
    });
  }, [investors, searchTerm, filters]);

  // Sort investors
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

  // Handle investor actions
  const handleViewProfile = (investor) => {
    setSelectedInvestor(investor);
  };

  const handleFlag = (investorId) => {
    // Implement flagging logic
    console.log('Flag investor:', investorId);
  };

  const handleStar = (investorId) => {
    // Implement starring logic  
    console.log('Star investor:', investorId);
  };

  const exportData = () => {
    // Export filtered investors to CSV
    const csvContent = [
      'Address,Total Invested,AVA Balance,Current Value,Profit/Loss,Status,Join Date',
      ...sortedInvestors.map(inv => [
        inv.fullAddress,
        inv.totalInvested,
        inv.avaBalance,
        inv.currentValue,
        inv.profitLoss,
        inv.status,
        new Date(inv.joinDate).toLocaleDateString()
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `avalon-investors-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Investor Management</h1>
          <p className="text-slate-600 mt-1">Monitor and manage Avalon token investors</p>
        </div>
        <div className="flex items-center gap-3">
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

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-lg border border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <Users className="w-8 h-8 text-blue-600" />
            <span className="text-2xl font-bold text-slate-900">{investors.length}</span>
          </div>
          <p className="text-slate-600 font-medium">Total Investors</p>
        </div>
        
        <div className="bg-white rounded-xl p-6 shadow-lg border border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <DollarSign className="w-8 h-8 text-green-600" />
            <span className="text-2xl font-bold text-slate-900">
              ${new Intl.NumberFormat().format(
                investors.reduce((sum, inv) => sum + inv.totalInvested, 0).toFixed(0)
              )}
            </span>
          </div>
          <p className="text-slate-600 font-medium">Total Invested</p>
        </div>
        
        <div className="bg-white rounded-xl p-6 shadow-lg border border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="w-8 h-8 text-purple-600" />
            <span className="text-2xl font-bold text-slate-900">
              ${new Intl.NumberFormat().format(
                investors.reduce((sum, inv) => sum + inv.currentValue, 0).toFixed(0)
              )}
            </span>
          </div>
          <p className="text-slate-600 font-medium">Current Value</p>
        </div>
        
        <div className="bg-white rounded-xl p-6 shadow-lg border border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <BarChart3 className="w-8 h-8 text-cyan-600" />
            <span className="text-2xl font-bold text-slate-900">
              {investors.filter(inv => inv.status === 'vip').length}
            </span>
          </div>
          <p className="text-slate-600 font-medium">VIP Investors</p>
        </div>
      </div>

      {/* Search and Filter */}
      <InvestorSearch
        onSearch={setSearchTerm}
        onFilter={setFilters}
        filters={filters}
        onExport={exportData}
      />

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center">
          <AlertCircle className="w-5 h-5 text-red-600 mr-3 flex-shrink-0" />
          <div>
            <p className="font-medium text-red-800">Error Loading Investors</p>
            <p className="text-red-700 text-sm mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
            <p className="text-slate-600">Loading investor data from blockchain...</p>
            <p className="text-slate-500 text-sm mt-1">This may take a few moments</p>
          </div>
        </div>
      )}

      {/* Investors Grid */}
      {!isLoading && !error && (
        <>
          {sortedInvestors.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">No Investors Found</h3>
              <p className="text-slate-600 mb-4">
                {investors.length === 0 
                  ? 'No investors have participated in the presale yet.' 
                  : 'No investors match your current filters.'}
              </p>
              {investors.length === 0 && (
                <button
                  onClick={refreshData}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Refresh Data
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Results Summary */}
              <div className="flex items-center justify-between mb-4">
                <p className="text-slate-600">
                  Showing {sortedInvestors.length} of {investors.length} investors
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-500">Sort by:</span>
                  <select
                    value={sortConfig.key}
                    onChange={(e) => handleSort(e.target.value)}
                    className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="totalInvested">Total Invested</option>
                    <option value="currentValue">Current Value</option>
                    <option value="profitLoss">Profit/Loss</option>
                    <option value="joinDate">Join Date</option>
                    <option value="transactionCount">Transaction Count</option>
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
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                    {selectedInvestor.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">{selectedInvestor.name}</h2>
                    <p className="text-slate-600 font-mono">{selectedInvestor.fullAddress}</p>
                    <div className="flex items-center gap-2 mt-2">
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
              {/* Investment Summary */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-green-50 rounded-lg p-4">
                  <p className="text-green-600 text-sm font-medium mb-1">Total Invested</p>
                  <p className="text-2xl font-bold text-green-700">
                    ${new Intl.NumberFormat().format(selectedInvestor.totalInvested)}
                  </p>
                </div>
                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="text-blue-600 text-sm font-medium mb-1">AVA Balance</p>
                  <p className="text-2xl font-bold text-blue-700">
                    {new Intl.NumberFormat().format(selectedInvestor.avaBalance)}
                  </p>
                </div>
                <div className="bg-purple-50 rounded-lg p-4">
                  <p className="text-purple-600 text-sm font-medium mb-1">Current Value</p>
                  <p className="text-2xl font-bold text-purple-700">
                    ${new Intl.NumberFormat().format(selectedInvestor.currentValue)}
                  </p>
                </div>
                <div className={`rounded-lg p-4 ${selectedInvestor.profitLoss >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
                  <p className={`text-sm font-medium mb-1 ${selectedInvestor.profitLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    Profit/Loss
                  </p>
                  <p className={`text-2xl font-bold ${selectedInvestor.profitLoss >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                    {selectedInvestor.profitLoss >= 0 ? '+' : ''}${new Intl.NumberFormat().format(selectedInvestor.profitLoss)}
                  </p>
                  <p className={`text-xs ${selectedInvestor.profitLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ({selectedInvestor.profitLossPercent.toFixed(2)}%)
                  </p>
                </div>
              </div>

              {/* Transaction History */}
              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-4">Transaction History</h3>
                {selectedInvestor.transactions.length === 0 ? (
                  <p className="text-slate-500 text-center py-8">No transactions found</p>
                ) : (
                  <div className="space-y-3">
                    {selectedInvestor.transactions.slice(0, 10).map((tx, index) => (
                      <div key={index} className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            tx.type === 'purchase' ? 'bg-green-100' : 'bg-blue-100'
                          }`}>
                            {tx.type === 'purchase' ? (
                              <DollarSign className="w-4 h-4 text-green-600" />
                            ) : (
                              <Activity className="w-4 h-4 text-blue-600" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-slate-900 capitalize">{tx.type}</p>
                            <p className="text-sm text-slate-500">
                              {new Date(tx.date).toLocaleDateString()} {new Date(tx.date).toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          {tx.type === 'purchase' && (
                            <p className="font-bold text-slate-900">${new Intl.NumberFormat().format(tx.amount)}</p>
                          )}
                          <p className="text-sm text-slate-600">
                            {new Intl.NumberFormat().format(Math.abs(tx.tokens))} AVA
                          </p>
                          <a
                            href={`https://sepolia.basescan.org/tx/${tx.txHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 text-xs flex items-center mt-1"
                          >
                            View TX <ExternalLink className="w-3 h-3 ml-1" />
                          </a>
                        </div>
                      </div>
                    ))}
                    {selectedInvestor.transactions.length > 10 && (
                      <p className="text-center text-slate-500 text-sm">
                        Showing 10 of {selectedInvestor.transactions.length} transactions
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvestorManagement;