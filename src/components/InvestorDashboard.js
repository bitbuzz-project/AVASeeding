
import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Wallet, 
  Target, 
  DollarSign, 
  Activity, 
  PieChart, 
  ArrowUpRight, 
  ArrowDownRight, 
  Users, 
  Zap, 
  Shield, 
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Calendar,
  Info,
  AlertCircle,
   Menu,        // ADD THIS
  X           // ADD THIS
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useWallet } from '../context/WalletContext';

const tabs = [
  { id: 'overview', label: 'Portfolio Overview', icon: BarChart3, shortLabel: 'Portfolio' },
  { id: 'analytics', label: 'Investment Analytics', icon: TrendingUp, shortLabel: 'Analytics' },
  { id: 'strategy', label: 'Strategy Details', icon: Target, shortLabel: 'Strategy' },
  { id: 'tokenomics', label: 'Tokenomics', icon: PieChart, shortLabel: 'Tokenomics' }
];

// Dynamically import ethers to avoid SSR issues
let ethers;
if (typeof window !== 'undefined') {
  ethers = require('ethers');
}

// Contract addresses from your deployment
const CONTRACTS = {
  USDC: '0xd6842B6CfF83784aD53ef9a838F041ac2c337659',
  AVA: '0xA25Fd0C9906d124792b6F1909d3F3b52A4fb98aE',
  SEEDING: '0xF9566De2e8697afa09fE2a5a08152561715d217E'
};

// ABIs for the contracts
const SEEDING_ABI = [
  "function totalSold() external view returns (uint256)",
  "function maximumAllocation() external view returns (uint256)",
  "function purchasedAmount(address) external view returns (uint256)",
  "function getSeedingProgress() external view returns (uint256, uint256, uint256)",
  "function getParticipantCount() external view returns (uint256)",
  "function seedingActive() external view returns (bool)",
  "function minimumPurchase() external view returns (uint256)",
  "function seedingPrice() external view returns (uint256)"
];

const AVA_ABI = [
  "function balanceOf(address) external view returns (uint256)",
  "function totalSupply() external view returns (uint256)",
  "function sellTaxRate() external view returns (uint256)",
  "function treasuryWallet() external view returns (address)",
  "function liquidityPool() external view returns (address)"
];

const USDC_ABI = [
  "function balanceOf(address) external view returns (uint256)"
];

function InvestorDashboard() {
  // Get wallet state from context
  const { 
    account, 
    provider, 
    signer, 
    isConnected, 
    connectWallet, 
    isLoading, 
    error, 
    success 
  } = useWallet();
  
  // Contract instances
  const [avaContract, setAvaContract] = useState(null);
  const [seedingContract, setSeedingContract] = useState(null);
  const [usdcContract, setUsdcContract] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
// 3. ADD MOBILE MENU FUNCTIONS (add these new functions)
const toggleMobileMenu = () => {
  setIsMobileMenuOpen(!isMobileMenuOpen);
};

const closeMobileMenu = () => {
  setIsMobileMenuOpen(false);
};

const handleTabChange = (tabId) => {
  setActiveTab(tabId);
  closeMobileMenu();
};
  // Project data
  const [projectData, setProjectData] = useState({
    totalSupply: '0',
    totalSold: '0',
    maxAllocation: '0',
    progressPercent: 0,
    participantCount: 0,
    sellTaxRate: 0,
    seedingActive: false,
    minimumPurchase: '0'
  });

  // User data
  const [userData, setUserData] = useState({
    avaBalance: '0',
    usdcBalance: '0',
    purchasedAmount: '0',
    investmentValue: '0',
    portfolioPercent: 0
  });

  // UI state
  const [activeTab, setActiveTab] = useState('overview');
  const [expandedSections, setExpandedSections] = useState({
    tokenomics: false,
    strategy: false,
    base: false
  });

  // Initialize contracts
  useEffect(() => {
    if (signer && isConnected && ethers) {
      try {
        const ava = new ethers.Contract(CONTRACTS.AVA, AVA_ABI, signer);
        const seeding = new ethers.Contract(CONTRACTS.SEEDING, SEEDING_ABI, signer);
        const usdc = new ethers.Contract(CONTRACTS.USDC, USDC_ABI, signer);

        setAvaContract(ava);
        setSeedingContract(seeding);
        setUsdcContract(usdc);
      } catch (error) {
        console.error('Failed to initialize contracts:', error);
      }
    }
  }, [signer, isConnected]);

  // Load project data
  const loadProjectData = async () => {
    if (!seedingContract || !avaContract || !ethers) return;

    try {
      const [
        totalSupply,
        totalSold,
        maxAllocation,
        progress,
        participantCount,
        sellTaxRate,
        seedingActive,
        minimumPurchase
      ] = await Promise.all([
        avaContract.totalSupply(),
        seedingContract.totalSold(),
        seedingContract.maximumAllocation(),
        seedingContract.getSeedingProgress(),
        seedingContract.getParticipantCount(),
        avaContract.sellTaxRate(),
        seedingContract.seedingActive(),
        seedingContract.minimumPurchase()
      ]);

      setProjectData({
        totalSupply: ethers.formatEther(totalSupply),
        totalSold: ethers.formatEther(totalSold),
        maxAllocation: ethers.formatEther(maxAllocation),
        progressPercent: Number(progress[2]),
        participantCount: Number(participantCount),
        sellTaxRate: Number(sellTaxRate) / 100, // Convert from basis points
        seedingActive,
        minimumPurchase: ethers.formatEther(minimumPurchase)
      });

    } catch (error) {
      console.error('Error loading project data:', error);
    }
  };

  // Load user data
  const loadUserData = async () => {
    if (!seedingContract || !avaContract || !usdcContract || !account || !ethers) return;

    try {
      const [
        avaBalance,
        usdcBalance,
        purchasedAmount
      ] = await Promise.all([
        avaContract.balanceOf(account),
        usdcContract.balanceOf(account),
        seedingContract.purchasedAmount(account)
      ]);

      const avaBalanceFormatted = ethers.formatEther(avaBalance);
      const purchasedAmountFormatted = ethers.formatEther(purchasedAmount);
      const investmentValue = purchasedAmountFormatted; // 1:1 ratio with USDC
      
      // Calculate portfolio percentage
      const totalSoldFormatted = parseFloat(projectData.totalSold);
      const portfolioPercent = totalSoldFormatted > 0 ? 
        (parseFloat(purchasedAmountFormatted) / totalSoldFormatted) * 100 : 0;

      setUserData({
        avaBalance: avaBalanceFormatted,
        usdcBalance: ethers.formatUnits(usdcBalance, 6),
        purchasedAmount: purchasedAmountFormatted,
        investmentValue,
        portfolioPercent
      });

    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  // Load data on connection and intervals
  useEffect(() => {
    if (isConnected) {
      loadProjectData();
      const interval = setInterval(loadProjectData, 30000);
      return () => clearInterval(interval);
    }
  }, [isConnected, seedingContract, avaContract]);

  useEffect(() => {
    if (isConnected && account) {
      loadUserData();
      const interval = setInterval(loadUserData, 30000);
      return () => clearInterval(interval);
    }
  }, [isConnected, account, projectData.totalSold]);

  // Toggle expandable sections
  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Format numbers
  const formatNumber = (num, decimals = 2) => {
    return new Intl.NumberFormat().format(parseFloat(num).toFixed(decimals));
  };

  const formatPercent = (num) => {
    return `${parseFloat(num).toFixed(2)}%`;
  };

  return (
    <div className="coinbase-bg text-slate-900 font-inter min-h-screen">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4 coinbase-title">
            AVALON INVESTOR DASHBOARD
          </h1>
          <p className="text-xl coinbase-subtitle">Track Your Investment Performance</p>
        </div>

        {/* Connection Status */}
        {!isConnected ? (
          <div className="max-w-2xl mx-auto mb-8">
            <div className="coinbase-card rounded-2xl p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-6 bg-blue-100 rounded-full flex items-center justify-center">
                <Wallet className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold mb-3 text-slate-900">Connect Your Wallet</h3>
              <p className="text-slate-600 mb-6 text-lg">Connect to view your Avalon investment portfolio</p>
              <button
                onClick={connectWallet}
                disabled={isLoading}
                className="coinbase-btn text-white px-8 py-4 rounded-xl font-semibold text-lg disabled:opacity-50"
              >
                <Wallet className="w-5 h-5 mr-3 inline" />
                Connect MetaMask
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Navigation Tabs */}
            <div className="max-w-6xl mx-auto mb-6 sm:mb-8">
  <div className="coinbase-card rounded-xl sm:rounded-2xl">
    {/* Desktop Navigation - Hidden on mobile */}
    <div className="hidden lg:block p-2">
      <div className="flex space-x-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center py-3 px-4 rounded-xl font-semibold transition-all ${
              activeTab === tab.id
                ? 'bg-blue-600 text-white shadow-lg'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <tab.icon className="w-5 h-5 mr-2" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>
    </div>

    {/* Mobile Navigation Header */}
    <div className="lg:hidden flex items-center justify-between p-4">
      <div className="flex items-center">
        {tabs.find(tab => tab.id === activeTab)?.icon && (
          React.createElement(tabs.find(tab => tab.id === activeTab).icon, {
            className: "w-5 h-5 mr-2 text-blue-600"
          })
        )}
        <h2 className="text-lg font-bold text-slate-900">
          {tabs.find(tab => tab.id === activeTab)?.shortLabel || 'Dashboard'}
        </h2>
      </div>
      <button
        onClick={toggleMobileMenu}
        className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
      >
        {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>
    </div>

    {/* Mobile Navigation Menu */}
    {isMobileMenuOpen && (
      <div className="lg:hidden border-t border-slate-200 bg-white rounded-b-xl sm:rounded-b-2xl">
        <div className="p-3 space-y-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`w-full flex items-center px-4 py-3 rounded-lg text-left transition-colors ${
                activeTab === tab.id
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <tab.icon className="w-5 h-5 mr-3" />
              <span className="font-medium">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>
    )}
  </div>
</div>
            {/* Portfolio Overview Tab */}
            {activeTab === 'overview' && (
              <div className="max-w-6xl mx-auto space-y-8">
                {/* Quick Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="coinbase-card rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <Wallet className="w-5 h-5 text-blue-600" />
                      </div>
                      <ArrowUpRight className="w-4 h-4 text-green-500" />
                    </div>
                    <p className="text-2xl font-bold text-slate-900">{formatNumber(userData.avaBalance)}</p>
                    <p className="text-slate-600 font-medium">AVA Balance</p>
                  </div>

                  <div className="coinbase-card rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <DollarSign className="w-5 h-5 text-green-600" />
                      </div>
                      <ArrowUpRight className="w-4 h-4 text-green-500" />
                    </div>
                    <p className="text-2xl font-bold text-slate-900">${formatNumber(userData.investmentValue)}</p>
                    <p className="text-slate-600 font-medium">Investment Value</p>
                  </div>

                  <div className="coinbase-card rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                        <PieChart className="w-5 h-5 text-purple-600" />
                      </div>
                    </div>
                    <p className="text-2xl font-bold text-slate-900">{formatPercent(userData.portfolioPercent)}</p>
                    <p className="text-slate-600 font-medium">Portfolio Share</p>
                  </div>

                  <div className="coinbase-card rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-10 h-10 bg-cyan-100 rounded-full flex items-center justify-center">
                        <Users className="w-5 h-5 text-cyan-600" />
                      </div>
                    </div>
                    <p className="text-2xl font-bold text-slate-900">{projectData.participantCount}</p>
                    <p className="text-slate-600 font-medium">Total Investors</p>
                  </div>
                </div>

                {/* Project Progress */}
                <div className="coinbase-card rounded-2xl p-8">
                  <h3 className="text-2xl font-bold mb-6 text-slate-900">Project Progress</h3>
                  <div className="bg-slate-200 rounded-full h-4 mb-6">
                    <div
                      className="progress-bar h-4 rounded-full transition-all duration-500"
                      style={{ width: `${projectData.progressPercent}%` }}
                    ></div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div className="text-center">
                      <p className="text-slate-500 font-medium mb-1">Tokens Sold</p>
                      <p className="text-xl font-bold text-slate-900">{formatNumber(projectData.totalSold)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-slate-500 font-medium mb-1">Total Allocation</p>
                      <p className="text-xl font-bold text-slate-900">{formatNumber(projectData.maxAllocation)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-slate-500 font-medium mb-1">Progress</p>
                      <p className="text-xl font-bold text-blue-600">{formatPercent(projectData.progressPercent)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-slate-500 font-medium mb-1">Status</p>
                      <p className={`text-xl font-bold ${projectData.seedingActive ? 'text-green-600' : 'text-red-500'}`}>
                        {projectData.seedingActive ? 'Active' : 'Inactive'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Your Investment Summary */}
                <div className="coinbase-card rounded-2xl p-8">
                  <h3 className="text-2xl font-bold mb-6 text-slate-900">Your Investment Summary</h3>
                  <div className="grid md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <div className="flex justify-between items-center py-3 border-b border-slate-200">
                        <span className="text-slate-600 font-medium">AVA Tokens Purchased</span>
                        <span className="text-slate-900 font-bold">{formatNumber(userData.purchasedAmount)}</span>
                      </div>
                      <div className="flex justify-between items-center py-3 border-b border-slate-200">
                        <span className="text-slate-600 font-medium">Current AVA Balance</span>
                        <span className="text-slate-900 font-bold">{formatNumber(userData.avaBalance)}</span>
                      </div>
                      <div className="flex justify-between items-center py-3 border-b border-slate-200">
                        <span className="text-slate-600 font-medium">USDC Balance</span>
                        <span className="text-slate-900 font-bold">{formatNumber(userData.usdcBalance)}</span>
                      </div>
                      <div className="flex justify-between items-center py-3">
                        <span className="text-slate-600 font-medium">Portfolio Ownership</span>
                        <span className="text-blue-600 font-bold">{formatPercent(userData.portfolioPercent)}</span>
                      </div>
                    </div>
                    <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-6">
                      <h4 className="text-lg font-bold text-slate-900 mb-4">Investment Highlights</h4>
                      <div className="space-y-3">
                        <div className="flex items-center">
                          <Shield className="w-5 h-5 text-green-600 mr-3" />
                          <span className="text-slate-700">No staking required</span>
                        </div>
                        <div className="flex items-center">
                          <Zap className="w-5 h-5 text-yellow-600 mr-3" />
                          <span className="text-slate-700">Automated profit distribution</span>
                        </div>
                        <div className="flex items-center">
                          <Activity className="w-5 h-5 text-blue-600 mr-3" />
                          <span className="text-slate-700">Volatility harvesting strategy</span>
                        </div>
                        <div className="flex items-center">
                          <Target className="w-5 h-5 text-purple-600 mr-3" />
                          <span className="text-slate-700">20-40% APY target</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Investment Analytics Tab */}
            {activeTab === 'analytics' && (
              <div className="max-w-6xl mx-auto space-y-8">
                {/* Strategy Performance Metrics */}
                <div className="coinbase-card rounded-2xl p-8">
                  <h3 className="text-2xl font-bold mb-6 text-slate-900">Strategy Performance Metrics</h3>
                  <div className="grid md:grid-cols-3 gap-6">
                    <div className="bg-green-50 rounded-xl p-6 text-center">
                      <div className="w-12 h-12 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
                        <TrendingUp className="w-6 h-6 text-green-600" />
                      </div>
                      <p className="text-3xl font-bold text-green-600 mb-2">21.1%</p>
                      <p className="text-slate-700 font-medium">Bitcoin Strategy APY</p>
                      <p className="text-sm text-slate-500 mt-2">Based on backtested data</p>
                    </div>
                    <div className="bg-blue-50 rounded-xl p-6 text-center">
                      <div className="w-12 h-12 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
                        <Activity className="w-6 h-6 text-blue-600" />
                      </div>
                      <p className="text-3xl font-bold text-blue-600 mb-2">25-75%</p>
                      <p className="text-slate-700 font-medium">Base LP APY Range</p>
                      <p className="text-sm text-slate-500 mt-2">Target performance</p>
                    </div>
                    <div className="bg-purple-50 rounded-xl p-6 text-center">
                      <div className="w-12 h-12 mx-auto mb-4 bg-purple-100 rounded-full flex items-center justify-center">
                        <PieChart className="w-6 h-6 text-purple-600" />
                      </div>
                      <p className="text-3xl font-bold text-purple-600 mb-2">8%</p>
                      <p className="text-slate-700 font-medium">Sell Tax Rate</p>
                      <p className="text-sm text-slate-500 mt-2">Supports buyback program</p>
                    </div>
                  </div>
                </div>

                {/* Asset Allocation Strategy */}
                <div className="coinbase-card rounded-2xl p-8">
                  <h3 className="text-2xl font-bold mb-6 text-slate-900">Asset Allocation Strategy</h3>
                  <div className="grid md:grid-cols-3 gap-6">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6">
                      <h4 className="text-lg font-bold text-blue-900 mb-3">Bitcoin Strategy</h4>
                      <p className="text-4xl font-bold text-blue-600 mb-2">35%</p>
                      <p className="text-blue-800 font-medium mb-3">Bitcoin Maximum Exposure Rebalancing System (B-MERS)</p>
                      <ul className="text-sm text-blue-700 space-y-1">
                        <li>• Systematic buying and selling</li>
                        <li>• 9% rebalancing threshold</li>
                        <li>• Fixed exposure target</li>
                      </ul>
                    </div>
                    <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6">
                      <h4 className="text-lg font-bold text-green-900 mb-3">Base Ecosystem LP</h4>
                      <p className="text-4xl font-bold text-green-600 mb-2">45%</p>
                      <p className="text-green-800 font-medium mb-3">Liquidity Provisioning</p>
                      <ul className="text-sm text-green-700 space-y-1">
                        <li>• Active yield generation</li>
                        <li>• 25-75% APY target</li>
                        <li>• Beta exposure to Base ecosystem</li>
                      </ul>
                    </div>
                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6">
                      <h4 className="text-lg font-bold text-purple-900 mb-3">Token Liquidity</h4>
                      <p className="text-4xl font-bold text-purple-600 mb-2">20%</p>
                      <p className="text-purple-800 font-medium mb-3">Market Support</p>
                      <ul className="text-sm text-purple-700 space-y-1">
                        <li>• Single-sided LP at $1.00</li>
                        <li>• Ratcheting liquidity system</li>
                        <li>• Price stability mechanism</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Revenue Distribution */}
                <div className="coinbase-card rounded-2xl p-8">
                  <h3 className="text-2xl font-bold mb-6 text-slate-900">Revenue Distribution Model</h3>
                  <div className="grid md:grid-cols-2 gap-8">
                    <div>
                      <h4 className="text-lg font-bold text-slate-900 mb-4">Revenue Allocation</h4>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                          <span className="font-medium text-green-800">Buybacks & Token Burns</span>
                          <span className="text-2xl font-bold text-green-600">90%</span>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                          <span className="font-medium text-blue-800">Operational Costs</span>
                          <span className="text-2xl font-bold text-blue-600">10%</span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-slate-900 mb-4">Value Creation Mechanisms</h4>
                      <div className="space-y-3">
                        <div className="flex items-center p-3 bg-slate-50 rounded-lg">
                          <ArrowUpRight className="w-5 h-5 text-green-500 mr-3" />
                          <span className="text-slate-700">Continuous buyback pressure</span>
                        </div>
                        <div className="flex items-center p-3 bg-slate-50 rounded-lg">
                          <Shield className="w-5 h-5 text-blue-500 mr-3" />
                          <span className="text-slate-700">Deflationary tokenomics</span>
                        </div>
                        <div className="flex items-center p-3 bg-slate-50 rounded-lg">
                          <Activity className="w-5 h-5 text-purple-500 mr-3" />
                          <span className="text-slate-700">Yield from volatility</span>
                        </div>
                        <div className="flex items-center p-3 bg-slate-50 rounded-lg">
                          <Target className="w-5 h-5 text-orange-500 mr-3" />
                          <span className="text-slate-700">Systematic profit taking</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Strategy Details Tab */}
            {activeTab === 'strategy' && (
              <div className="max-w-6xl mx-auto space-y-8">
                {/* Core Strategy Overview */}
                <div className="coinbase-card rounded-2xl p-8">
                  <h3 className="text-2xl font-bold mb-6 text-slate-900">The AVALON Approach</h3>
                  <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-6 mb-6">
                    <p className="text-lg text-slate-700 leading-relaxed">
                      "Avalon generates profits and revenue with the one and only variable that never changes: 
                      <span className="font-bold text-blue-600"> market motion with prices going up and down!</span> 
                      There will always be volatility and price moving in both directions."
                    </p>
                  </div>

                  {/* Expandable Strategy Sections */}
                  <div className="space-y-4">
                    {/* Bitcoin Maximum Exposure Rebalancing System */}
                    <div className="border border-slate-200 rounded-xl">
                      <button
                        onClick={() => toggleSection('strategy')}
                        className="w-full flex items-center justify-between p-6 text-left hover:bg-slate-50 rounded-xl transition-colors"
                      >
                        <div>
                          <h4 className="text-xl font-bold text-slate-900">Bitcoin Maximum Exposure Rebalancing System (B-MERS)</h4>
                          <p className="text-slate-600 mt-1">Core systematic trading strategy for Bitcoin</p>
                        </div>
                        {expandedSections.strategy ? 
                          <ChevronUp className="w-6 h-6 text-slate-400" /> : 
                          <ChevronDown className="w-6 h-6 text-slate-400" />
                        }
                      </button>
                      {expandedSections.strategy && (
                        <div className="px-6 pb-6">
                          <div className="grid md:grid-cols-2 gap-6">
                            <div>
                              <h5 className="font-bold text-slate-900 mb-3">Strategy Rules</h5>
                              <ul className="space-y-2 text-slate-700">
                                <li className="flex items-start">
                                  <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                                  <span>Buy low, sell high - systematically</span>
                                </li>
                                <li className="flex items-start">
                                  <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                                  <span>Maintain 70% Bitcoin exposure, 30% USDC reserves</span>
                                </li>
                                <li className="flex items-start">
                                  <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                                  <span>Rebalance at 9% price movements</span>
                                </li>
                                <li className="flex items-start">
                                  <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                                  <span>Take profits on pumps, buy more on dips</span>
                                </li>
                              </ul>
                            </div>
                            <div>
                              <h5 className="font-bold text-slate-900 mb-3">Expected Performance</h5>
                              <div className="space-y-3">
                                <div className="bg-green-50 rounded-lg p-4">
                                  <p className="font-bold text-green-600 text-lg">Bitcoin: 21.1% APY</p>
                                  <p className="text-green-700 text-sm">Based on 2021-2025 backtesting</p>
                                </div>
                                <div className="bg-blue-50 rounded-lg p-4">
                                  <p className="font-bold text-blue-600 text-lg">Strategy: B-MERS</p>
                                  <p className="text-blue-700 text-sm">Proven systematic approach</p>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                            <div className="flex items-start">
                              <Info className="w-5 h-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
                              <div>
                                <p className="font-medium text-yellow-800">Technical Explanation</p>
                                <p className="text-yellow-700 text-sm mt-1">
                                  The net profit comes from the mathematical difference between upward and downward price movements. 
                                  A 25% price increase followed by a 20% decrease results in a 5% net profit that can be captured systematically.
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Base Ecosystem Strategy */}
                    <div className="border border-slate-200 rounded-xl">
                      <button
                        onClick={() => toggleSection('base')}
                        className="w-full flex items-center justify-between p-6 text-left hover:bg-slate-50 rounded-xl transition-colors"
                      >
                        <div>
                          <h4 className="text-xl font-bold text-slate-900">Base Ecosystem Liquidity Providing</h4>
                          <p className="text-slate-600 mt-1">Active daily revenue generation through LP positions</p>
                        </div>
                        {expandedSections.base ? 
                          <ChevronUp className="w-6 h-6 text-slate-400" /> : 
                          <ChevronDown className="w-6 h-6 text-slate-400" />
                        }
                      </button>
                      {expandedSections.base && (
                        <div className="px-6 pb-6">
                          <div className="grid md:grid-cols-2 gap-6">
                            <div>
                              <h5 className="font-bold text-slate-900 mb-3">Strategy Overview</h5>
                              <ul className="space-y-2 text-slate-700">
                                <li className="flex items-start">
                                  <span className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                                  <span>Medium/wide range liquidity provision</span>
                                </li>
                                <li className="flex items-start">
                                  <span className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                                  <span>Focus on strong Base ecosystem tokens</span>
                                </li>
                                <li className="flex items-start">
                                  <span className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                                  <span>Daily revenue for buyback program</span>
                                </li>
                                <li className="flex items-start">
                                  <span className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                                  <span>Beta exposure to Base growth</span>
                                </li>
                              </ul>
                            </div>
                            <div>
                              <h5 className="font-bold text-slate-900 mb-3">Real-Life examples</h5>
                              <div className="space-y-2">
                                <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                                  <span className="font-medium">REI/USDC</span>
                                  <span className="text-green-600 font-bold">70% APR</span>
                                </div>
                                <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                                  <span className="font-medium">ZORA/USDC</span>
                                  <span className="text-green-600 font-bold">200% APR</span>
                                </div>
                                <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                                  <span className="font-medium">CLANKER</span>
                                  <span className="text-green-600 font-bold">100% APR</span>
                                </div>
                                <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                                  <span className="font-medium">BNKR</span>
                                  <span className="text-green-600 font-bold">45% APR</span>
                                </div>
                                  <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                                  <span className="font-medium">MAMO/USDC</span>
                                  <span className="text-green-600 font-bold">140% APR</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tokenomics Tab */}
            {activeTab === 'tokenomics' && (
              <div className="max-w-6xl mx-auto space-y-8">
                {/* Token Distribution */}
                <div className="coinbase-card rounded-2xl p-8">
                  <h3 className="text-2xl font-bold mb-6 text-slate-900">Token Distribution</h3>
                  
                  <div className="grid md:grid-cols-2 gap-8 mb-8">
                    <div>
                      <h4 className="text-lg font-bold text-slate-900 mb-4">Total Supply Breakdown</h4>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                          <div>
                            <p className="font-bold text-blue-900">Seeding Allocation</p>
                            <p className="text-blue-700 text-sm">4,375,000 AVA (87.5%)</p>
                          </div>
                          <p className="text-2xl font-bold text-blue-600">87.5%</p>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border-l-4 border-green-500">
                          <div>
                            <p className="font-bold text-green-900">Liquidity Pool</p>
                            <p className="text-green-700 text-sm">625,000 AVA (12.5%)</p>
                          </div>
                          <p className="text-2xl font-bold text-green-600">12.5%</p>
                        </div>
                      </div>
                      <div className="mt-6 p-4 bg-slate-50 rounded-lg">
                        <p className="font-bold text-slate-900">Maximum Supply</p>
                        <p className="text-3xl font-bold text-slate-900">5,000,000</p>
                        <p className="text-slate-600 text-sm">Fixed supply - no inflation</p>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-lg font-bold text-slate-900 mb-4">Key Token Features</h4>
                      <div className="space-y-3">
                        <div className="flex items-start p-3 bg-green-50 rounded-lg">
                          <Shield className="w-5 h-5 text-green-600 mt-0.5 mr-3 flex-shrink-0" />
                          <div>
                            <p className="font-medium text-green-800">No Staking Required</p>
                            <p className="text-green-700 text-sm">Simply hold AVA tokens to benefit</p>
                          </div>
                        </div>
                        <div className="flex items-start p-3 bg-blue-50 rounded-lg">
                          <ArrowUpRight className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                          <div>
                            <p className="font-medium text-blue-800">Deflationary Mechanism</p>
                            <p className="text-blue-700 text-sm">90% of profits go to buybacks</p>
                          </div>
                        </div>
                        <div className="flex items-start p-3 bg-purple-50 rounded-lg">
                          <Activity className="w-5 h-5 text-purple-600 mt-0.5 mr-3 flex-shrink-0" />
                          <div>
                            <p className="font-medium text-purple-800">Sell Tax</p>
                            <p className="text-purple-700 text-sm">8% to discourage speculation</p>
                          </div>
                        </div>
                        <div className="flex items-start p-3 bg-yellow-50 rounded-lg">
                          <Zap className="w-5 h-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
                          <div>
                            <p className="font-medium text-yellow-800">Automated Revenue</p>
                            <p className="text-yellow-700 text-sm">No manual claiming required</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Expandable Tokenomics Details */}
                  <div className="border border-slate-200 rounded-xl">
                    <button
                      onClick={() => toggleSection('tokenomics')}
                      className="w-full flex items-center justify-between p-6 text-left hover:bg-slate-50 rounded-xl transition-colors"
                    >
                      <div>
                        <h4 className="text-xl font-bold text-slate-900">Detailed Tokenomics Model</h4>
                        <p className="text-slate-600 mt-1">Game mechanics and flywheel effects</p>
                      </div>
                      {expandedSections.tokenomics ? 
                        <ChevronUp className="w-6 h-6 text-slate-400" /> : 
                        <ChevronDown className="w-6 h-6 text-slate-400" />
                      }
                    </button>
                    {expandedSections.tokenomics && (
                      <div className="px-6 pb-6">
                        <div className="grid md:grid-cols-2 gap-8">
                          <div>
                            <h5 className="font-bold text-slate-900 mb-4">Game Mechanics Favoring Long-term Holders</h5>
                            <ul className="space-y-3">
                              <li className="flex items-start">
                                <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                                <div>
                                  <p className="font-medium text-slate-900">Minimum Seeding Amount</p>
                                  <p className="text-slate-600 text-sm">Prevents small arbitrage plays</p>
                                </div>
                              </li>
                              <li className="flex items-start">
                                <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                                <div>
                                  <p className="font-medium text-slate-900">Sell Tax Mechanism</p>
                                  <p className="text-slate-600 text-sm">8% tax discourages frequent trading</p>
                                </div>
                              </li>
                              <li className="flex items-start">
                                <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                                <div>
                                  <p className="font-medium text-slate-900">Progressive Buybacks</p>
                                  <p className="text-slate-600 text-sm">Continuous price support</p>
                                </div>
                              </li>
                              <li className="flex items-start">
                                <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                                <div>
                                  <p className="font-medium text-slate-900">Ratcheting Liquidity</p>
                                  <p className="text-slate-600 text-sm">Creates price floors at each level</p>
                                </div>
                              </li>
                            </ul>
                          </div>
                          <div>
                            <h5 className="font-bold text-slate-900 mb-4">Flywheel Effect</h5>
                            <div className="space-y-4">
                              <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg">
                                <div className="flex items-center mb-2">
                                  <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">1</div>
                                  <p className="font-medium text-slate-900">Strategy Generates Revenue</p>
                                </div>
                                <p className="text-slate-600 text-sm ml-9">Systematic trading and LP fees</p>
                              </div>
                              <div className="bg-gradient-to-r from-purple-50 to-green-50 p-4 rounded-lg">
                                <div className="flex items-center mb-2">
                                  <div className="w-6 h-6 bg-purple-500 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">2</div>
                                  <p className="font-medium text-slate-900">Revenue Funds Buybacks</p>
                                </div>
                                <p className="text-slate-600 text-sm ml-9">90% of profits purchase AVA tokens</p>
                              </div>
                              <div className="bg-gradient-to-r from-green-50 to-yellow-50 p-4 rounded-lg">
                                <div className="flex items-center mb-2">
                                  <div className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">3</div>
                                  <p className="font-medium text-slate-900">Price Appreciation</p>
                                </div>
                                <p className="text-slate-600 text-sm ml-9">Reduced supply + demand pressure</p>
                              </div>
                              <div className="bg-gradient-to-r from-yellow-50 to-blue-50 p-4 rounded-lg">
                                <div className="flex items-center mb-2">
                                  <div className="w-6 h-6 bg-yellow-500 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">4</div>
                                  <p className="font-medium text-slate-900">Attracts More Capital</p>
                                </div>
                                <p className="text-slate-600 text-sm ml-9">Larger strategy allocation = more revenue</p>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="mt-8 p-6 bg-gradient-to-r from-green-50 to-blue-50 rounded-xl">
                          <h6 className="font-bold text-slate-900 mb-3">Long-term Value Proposition</h6>
                          <p className="text-slate-700 leading-relaxed">
                            The longer you hold AVA tokens, the more you benefit from the cumulative effects of:
                            <span className="font-medium"> systematic profit generation, continuous buyback pressure, 
                            weak hands being filtered out, and scaling revenue as the strategy manages larger amounts.</span>
                            All without any taxable events or need for active management on your part.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Operations Model */}
                <div className="coinbase-card rounded-2xl p-8">
                  <h3 className="text-2xl font-bold mb-6 text-slate-900">Operations & Team</h3>
                  <div className="grid md:grid-cols-2 gap-8">
                    <div>
                      <h4 className="text-lg font-bold text-slate-900 mb-4">Operational Philosophy</h4>
                      <div className="bg-blue-50 rounded-xl p-6">
                        <p className="text-blue-800 font-medium mb-3">"Minimum Viable Product Work Ethic"</p>
                        <ul className="text-blue-700 space-y-2 text-sm">
                          <li>• Cover operational costs with idle asset yield</li>
                          <li>• Maximum 10% of revenue for operations</li>
                          <li>• 90% of profits dedicated to buybacks</li>
                          <li>• No unnecessary smart contract risks</li>
                          <li>• Focus on proven, battle-tested strategies</li>
                        </ul>
                      </div>
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-slate-900 mb-4">Team Background</h4>
                      <div className="space-y-4">
                        <div className="p-4 bg-slate-50 rounded-lg">
                          <p className="font-bold text-slate-900">CC - Strategy Lead</p>
                          <p className="text-slate-600 text-sm mt-1">
                            Engineering background, Forex systematic trading experience, 
                            active in crypto since 2017 through all market cycles
                          </p>
                        </div>
                        <div className="p-4 bg-slate-50 rounded-lg">
                          <p className="font-bold text-slate-900">Harris - Technical Lead</p>
                          <p className="text-slate-600 text-sm mt-1">
                            Full-stack developer responsible for smart contracts, 
                            web applications, and trading bot development
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Error Display */}
            {error && (
              <div className="max-w-4xl mx-auto mt-6">
                <div className="error-msg rounded-xl p-4 flex items-center">
                  <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0" />
                  <span className="font-medium">{error}</span>
                </div>
              </div>
            )}

            {/* Contract Information Footer */}
            <div className="max-w-6xl mx-auto mt-12">
              <div className="coinbase-card rounded-2xl p-8">
                <h3 className="text-xl font-bold mb-6 text-slate-900">Contract Information</h3>
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="bg-slate-50 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-slate-600 font-medium">AVA Token</p>
                      <a
                        href={`https://sepolia.basescan.org/address/${CONTRACTS.AVA}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                    <p className="font-mono text-sm text-slate-900 break-all bg-white p-3 rounded border">
                      {CONTRACTS.AVA}
                    </p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-slate-600 font-medium">USDC Token</p>
                      <a
                        href={`https://sepolia.basescan.org/address/${CONTRACTS.USDC}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                    <p className="font-mono text-sm text-slate-900 break-all bg-white p-3 rounded border">
                      {CONTRACTS.USDC}
                    </p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-slate-600 font-medium">Seeding Contract</p>
                      <a
                        href={`https://sepolia.basescan.org/address/${CONTRACTS.SEEDING}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                    <p className="font-mono text-sm text-slate-900 break-all bg-white p-3 rounded border">
                      {CONTRACTS.SEEDING}
                    </p>
                  </div>
                </div>
                
                {/* Additional Resources */}
                <div className="mt-8 grid md:grid-cols-2 gap-6">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6">
                    <h4 className="font-bold text-blue-900 mb-3">Participate in Presale</h4>
                    <p className="text-blue-800 mb-4">Join the Avalon presale to start your investment journey</p>
                    <Link
                      to="/presale"
                      className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                    >
                      Go to Presale <ArrowUpRight className="w-4 h-4 ml-2" />
                    </Link>
                  </div>
                  <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6">
                    <h4 className="font-bold text-green-900 mb-3">Read Full Whitepaper</h4>
                    <p className="text-green-800 mb-4">Comprehensive details about our strategy and approach</p>
                    <button className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors">
                      Download PDF <ExternalLink className="w-4 h-4 ml-2" />
                    </button>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <div className="flex items-start">
                    <Info className="w-5 h-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-yellow-800">Important Notice</p>
                      <p className="text-yellow-700 text-sm mt-1">
                        This dashboard is currently connected to Base Testnet. All data shown is for testing purposes only. 
                        The mainnet deployment will be announced separately.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="max-w-6xl mx-auto mt-8 text-center">
              <p className="text-slate-500">
                Avalon Token - Harnessing Volatility for Steady Returns
              </p>
              <p className="text-slate-400 text-sm mt-2">
                Built on Base • Deployed on Testnet • 
                <span className="mx-2">•</span>
                Connected to: {account.slice(0, 6)}...{account.slice(-4)}
              </p>
            </div>
          </>
        )}
      </div>

      {/* Custom Styles */}
      <style jsx>{`
        .coinbase-card {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(59, 130, 246, 0.1);
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        }

        .coinbase-bg {
          background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 50%, #cbd5e1 100%);
          min-height: 100vh;
        }

        .coinbase-btn {
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
          transition: all 0.2s ease;
          font-weight: 600;
          letter-spacing: 0.025em;
        }

        .coinbase-btn:hover {
          background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
          transform: translateY(-1px);
          box-shadow: 0 10px 25px -5px rgba(59, 130, 246, 0.4);
        }

        .progress-bar {
          background: linear-gradient(90deg, #3b82f6 0%, #06b6d4 100%);
          transition: width 0.5s ease;
        }

        .success-msg {
          background: rgba(16, 185, 129, 0.1);
          border: 1px solid rgba(16, 185, 129, 0.2);
          color: #047857;
        }

        .error-msg {
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.2);
          color: #dc2626;
        }

        .coinbase-title {
          font-weight: 800;
          letter-spacing: -0.025em;
          background: linear-gradient(135deg, #1e293b 0%, #475569 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .coinbase-subtitle {
          font-weight: 500;
          color: #64748b;
          letter-spacing: 0.025em;
        }

        .font-inter {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
        }

        @import url('[https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap](https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap)');
      `}</style>
    </div>
  );
}

export default InvestorDashboard;