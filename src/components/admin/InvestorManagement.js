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
  PieChart
} from 'lucide-react';

// Mock investor data generator
const generateMockInvestors = () => {
  const investors = [];
  const firstNames = ['John', 'Jane', 'Michael', 'Sarah', 'David', 'Emma', 'Robert', 'Lisa', 'James', 'Maria'];
  const lastNames = ['Smith', 'Johnson', 'Brown', 'Davis', 'Wilson', 'Miller', 'Taylor', 'Anderson', 'Thomas', 'Jackson'];
  const countries = ['USA', 'UK', 'Germany', 'France', 'Canada', 'Australia', 'Japan', 'Singapore', 'Switzerland', 'Netherlands'];
  
  for (let i = 0; i < 150; i++) {
    const joinDate = new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28));
    const totalInvested = Math.floor(Math.random() * 50000) + 1000;
    const avaBalance = totalInvested * (0.8 + Math.random() * 0.4);
    
    investors.push({
      id: `inv_${i + 1}`,
      address: `0x${Math.random().toString(16).substr(2, 8)}...${Math.random().toString(16).substr(2, 4)}`,
      fullAddress: `0x${Math.random().toString(16).substr(2, 40)}`,
      name: `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`,
      email: `investor${i + 1}@example.com`,
      country: countries[Math.floor(Math.random() * countries.length)],
      joinDate: joinDate.toISOString(),
      totalInvested,
      avaBalance,
      currentValue: avaBalance * 1.23,
      transactionCount: Math.floor(Math.random() * 10) + 1,
      lastActivity: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      status: Math.random() > 0.95 ? 'flagged' : Math.random() > 0.9 ? 'vip' : 'active',
      riskScore: Math.floor(Math.random() * 100),
      profitLoss: (avaBalance * 1.23) - totalInvested,
      tags: ['early-investor', 'high-value', 'frequent-trader'].filter(() => Math.random() > 0.7)
    });
  }
  
  return investors.sort((a, b) => b.totalInvested - a.totalInvested);
};

// Individual Investor Card Component
const InvestorCard = ({ investor, onViewProfile, onFlag, onStar }) => {
  const formatNumber = (num) => new Intl.NumberFormat().format(parseFloat(num).toFixed(2));
  const profitLossPercent = ((investor.profitLoss / investor.totalInvested) * 100).toFixed(2);
  
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
      {investor.tags.length > 0 && (
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
          <MapPin className="w-3 h-3" />
          <span>{investor.country}</span>
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
            placeholder="Search by name, address, email..."
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
              <label className="block text-sm font-medium text-slate-700 mb-2">Country</label>
              <select
                value={filters.country}
                onChange={(e) => onFilter({ ...filters, country: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Countries</option>
                <option value="USA">USA</option>
                <option value="UK">UK</option>
                <option value="Germany">Germany</option>
                <option value="France">France</option>
                <option value="Canada">Canada</option>
                <option value="Australia">Australia</option>
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Investor Profile Modal Component
const InvestorProfileModal = ({ investor, onClose }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const formatNumber = (num) => new Intl.NumberFormat().format(parseFloat(num).toFixed(2));
  
  // Generate mock transaction history
  const generateTransactionHistory = () => {
    const transactions = [];
    const types = ['purchase', 'sale', 'transfer'];
    
    for (let i = 0; i < 10; i++) {
      const type = types[Math.floor(Math.random() * types.length)];
      const amount = Math.floor(Math.random() * 5000) + 100;
      const date = new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000);
      
      transactions.push({
        id: `tx_${i + 1}`,
        type,
        amount,
        tokens: type === 'sale' ? -amount : amount,
        date: date.toISOString(),
        txHash: `0x${Math.random().toString(16).substr(2, 64)}`,
        status: 'completed'
      });
    }
    
    return transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
  };

  const transactions = generateTransactionHistory();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
              {investor.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900">{investor.name}</h2>
              <p className="text-slate-600 font-mono">{investor.address}</p>
              <div className="flex items-center space-x-2 mt-1">
                {investor.status === 'vip' && (
                  <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-full">VIP</span>
                )}
                {investor.status === 'flagged' && (
                  <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full">Flagged</span>
                )}
                <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">{investor.country}</span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'transactions', label: 'Transactions', icon: Activity },
            { id: 'analytics', label: 'Analytics', icon: PieChart },
            { id: 'settings', label: 'Settings', icon: Edit }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors ${
                activeTab === tab.id
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-green-50 rounded-lg p-4">
                  <h3 className="text-green-600 text-sm font-medium mb-1">Total Invested</h3>
                  <p className="text-2xl font-bold text-green-700">${formatNumber(investor.totalInvested)}</p>
                </div>
                <div className="bg-blue-50 rounded-lg p-4">
                  <h3 className="text-blue-600 text-sm font-medium mb-1">AVA Balance</h3>
                  <p className="text-2xl font-bold text-blue-700">{formatNumber(investor.avaBalance)}</p>
                </div>
                <div className="bg-purple-50 rounded-lg p-4">
                  <h3 className="text-purple-600 text-sm font-medium mb-1">Current Value</h3>
                  <p className="text-2xl font-bold text-purple-700">${formatNumber(investor.currentValue)}</p>
                </div>
                <div className={`rounded-lg p-4 ${investor.profitLoss >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
                  <h3 className={`text-sm font-medium mb-1 ${investor.profitLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    Profit/Loss
                  </h3>
                  <p className={`text-2xl font-bold ${investor.profitLoss >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                    {investor.profitLoss >= 0 ? '+' : ''}${formatNumber(investor.profitLoss)}
                  </p>
                </div>
              </div>

              {/* Contact Information */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-slate-50 rounded-lg p-6">
                  <h3 className="text-lg font-bold text-slate-900 mb-4">Contact Information</h3>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <Mail className="w-5 h-5 text-slate-600" />
                      <span className="text-slate-900">{investor.email}</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <MapPin className="w-5 h-5 text-slate-600" />
                      <span className="text-slate-900">{investor.country}</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <ExternalLink className="w-5 h-5 text-slate-600" />
                      <a 
                        href={`https://sepolia.basescan.org/address/${investor.fullAddress}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800"
                      >
                        View on Explorer
                      </a>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 rounded-lg p-6">
                  <h3 className="text-lg font-bold text-slate-900 mb-4">Risk Assessment</h3>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-slate-700">Risk Score</span>
                        <span className="text-sm font-bold text-slate-900">{investor.riskScore}/100</span>
                      </div>
                      <div className="bg-slate-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            investor.riskScore < 30 ? 'bg-green-500' :
                            investor.riskScore < 70 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${investor.riskScore}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Transactions Tab */}
          {activeTab === 'transactions' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-900">Transaction History</h3>
                <span className="text-sm text-slate-600">{transactions.length} transactions</span>
              </div>
              
              <div className="space-y-3">
                {transactions.map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${
                        tx.type === 'purchase' ? 'bg-green-500' :
                        tx.type === 'sale' ? 'bg-red-500' : 'bg-blue-500'
                      }`}></div>
                      <div>
                        <p className="font-medium text-slate-900 capitalize">{tx.type}</p>
                        <p className="text-sm text-slate-600">{new Date(tx.date).toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-slate-900">${formatNumber(tx.amount)}</p>
                      <p className={`text-sm ${tx.tokens >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {tx.tokens >= 0 ? '+' : ''}{formatNumber(Math.abs(tx.tokens))} AVA
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Analytics Tab */}
          {activeTab === 'analytics' && (
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-slate-900">Investment Analytics</h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-slate-50 rounded-lg p-6">
                  <h4 className="font-bold text-slate-900 mb-4">Performance Metrics</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-slate-600">ROI</span>
                      <span className="font-bold text-green-600">
                        +{((investor.profitLoss / investor.totalInvested) * 100).toFixed(2)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Holding Period</span>
                      <span className="font-bold text-slate-900">
                        {Math.floor((Date.now() - new Date(investor.joinDate)) / (1000 * 60 * 60 * 24))} days
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-slate-900">Investor Settings</h3>
              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200">
                <button
                  onClick={onClose}
                  className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  Save Changes
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Main Investor Management Component
function InvestorManagement() {
  const [investors, setInvestors] = useState([]);
  const [filteredInvestors, setFilteredInvestors] = useState([]);
  const [selectedInvestor, setSelectedInvestor] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState('totalInvested');
  const [sortOrder, setSortOrder] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(12);
  const [filters, setFilters] = useState({
    status: '',
    investmentRange: '',
    joinDate: '',
    country: ''
  });

  // Initialize data
  useEffect(() => {
    const loadInvestors = async () => {
      setIsLoading(true);
      setTimeout(() => {
        const mockData = generateMockInvestors();
        setInvestors(mockData);
        setFilteredInvestors(mockData);
        setIsLoading(false);
      }, 1000);
    };

    loadInvestors();
  }, []);

  // Search functionality
  const handleSearch = (searchTerm) => {
    if (!searchTerm) {
      setFilteredInvestors(investors);
      return;
    }

    const filtered = investors.filter(investor =>
      investor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      investor.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      investor.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    // Sorting
  const sortedInvestors = useMemo(() => {
    const sorted = [...filteredInvestors].sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];

      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return sorted;
  }, [filteredInvestors, sortBy, sortOrder]);

  // Pagination
  const paginatedInvestors = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedInvestors.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedInvestors, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(sortedInvestors.length / itemsPerPage);

  // Export functionality
  const handleExport = () => {
    const csvContent = [
      'Name,Address,Email,Country,Total Invested,AVA Balance,Current Value,P&L,Join Date,Status',
      ...filteredInvestors.map(inv => 
        `${inv.name},${inv.fullAddress},${inv.email},${inv.country},${inv.totalInvested},${inv.avaBalance},${inv.currentValue},${inv.profitLoss},${inv.joinDate},${inv.status}`
      )
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `avalon-investors-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Actions
  const handleViewProfile = (investor) => {
    setSelectedInvestor(investor);
  };

  const handleFlag = (investorId) => {
    setInvestors(prev => prev.map(inv => 
      inv.id === investorId 
        ? { ...inv, status: inv.status === 'flagged' ? 'active' : 'flagged' }
        : inv
    ));
    setFilteredInvestors(prev => prev.map(inv => 
      inv.id === investorId 
        ? { ...inv, status: inv.status === 'flagged' ? 'active' : 'flagged' }
        : inv
    ));
  };

  const handleStar = (investorId) => {
    setInvestors(prev => prev.map(inv => 
      inv.id === investorId 
        ? { ...inv, status: inv.status === 'vip' ? 'active' : 'vip' }
        : inv
    ));
    setFilteredInvestors(prev => prev.map(inv => 
      inv.id === investorId 
        ? { ...inv, status: inv.status === 'vip' ? 'active' : 'vip' }
        : inv
    ));
  };

  const formatNumber = (num) => new Intl.NumberFormat().format(parseFloat(num).toFixed(2));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 text-blue-500 mx-auto mb-4 animate-spin" />
          <p className="text-slate-600">Loading investor data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Investor Management</h1>
          <p className="text-slate-600 mt-1">
            Manage and analyze {investors.length} registered investors
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-slate-600">Active: {investors.filter(i => i.status === 'active').length}</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <span className="text-slate-600">VIP: {investors.filter(i => i.status === 'vip').length}</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <span className="text-slate-600">Flagged: {investors.filter(i => i.status === 'flagged').length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-lg border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <h3 className="text-slate-600 font-medium text-sm mb-1">Total Invested</h3>
          <p className="text-2xl font-bold text-slate-900">
            ${formatNumber(investors.reduce((sum, inv) => sum + inv.totalInvested, 0))}
          </p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-lg border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <h3 className="text-slate-600 font-medium text-sm mb-1">Active Investors</h3>
          <p className="text-2xl font-bold text-slate-900">{investors.length}</p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-lg border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <h3 className="text-slate-600 font-medium text-sm mb-1">Avg. Investment</h3>
          <p className="text-2xl font-bold text-slate-900">
            ${formatNumber(investors.reduce((sum, inv) => sum + inv.totalInvested, 0) / investors.length)}
          </p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-lg border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-cyan-100 rounded-xl flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-cyan-600" />
            </div>
          </div>
          <h3 className="text-slate-600 font-medium text-sm mb-1">Total P&L</h3>
          <p className="text-2xl font-bold text-green-600">
            +${formatNumber(investors.reduce((sum, inv) => sum + inv.profitLoss, 0))}
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <InvestorSearch
        onSearch={handleSearch}
        onFilter={handleFilter}
        filters={filters}
        onExport={handleExport}
      />

      {/* Sort Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="text-sm text-slate-600">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
          >
            <option value="totalInvested">Total Invested</option>
            <option value="name">Name</option>
            <option value="joinDate">Join Date</option>
            <option value="profitLoss">P&L</option>
            <option value="lastActivity">Last Activity</option>
          </select>
          <button
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="flex items-center gap-1 px-3 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
          >
            {sortOrder === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />}
            {sortOrder === 'asc' ? 'Ascending' : 'Descending'}
          </button>
        </div>

        <div className="text-sm text-slate-600">
          Showing {filteredInvestors.length} of {investors.length} investors
        </div>
      </div>

      {/* Investors Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {paginatedInvestors.map((investor) => (
          <InvestorCard
            key={investor.id}
            investor={investor}
            onViewProfile={handleViewProfile}
            onFlag={handleFlag}
            onStar={handleStar}
          />
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="px-3 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          
          <div className="flex gap-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pageNum = currentPage <= 3 ? i + 1 : currentPage - 2 + i;
              if (pageNum > totalPages) return null;
              
              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`px-3 py-2 rounded-lg ${
                    currentPage === pageNum
                      ? 'bg-blue-600 text-white'
                      : 'border border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>
          
          <button
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            className="px-3 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}

      {/* Investor Profile Modal */}
      {selectedInvestor && (
        <InvestorProfileModal
          investor={selectedInvestor}
          onClose={() => setSelectedInvestor(null)}
        />
      )}
    </div>
  );
}

export default InvestorManagement;

  // Filter functionality
  const handleFilter = (newFilters) => {
    setFilters(newFilters);
    
    let filtered = investors;

    if (newFilters.status) {
      filtered = filtered.filter(inv => inv.status === newFilters.status);
    }

    if (newFilters.investmentRange) {
      const [min, max] = newFilters.investmentRange.includes('+') 
        ? [25000, Infinity]
        : newFilters.investmentRange.split('-').map(Number);
      
      filtered = filtered.filter(inv => 
        inv.totalInvested >= min && (max === Infinity || inv.totalInvested <= max)
      );
    }

      setFilteredInvestors(filtered);
    setCurrentPage(1);
  };