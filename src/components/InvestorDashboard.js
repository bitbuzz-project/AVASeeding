// src/components/InvestorDashboard.js - IMPROVED VERSION
import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Wallet, 
  Target, 
  Info,
  DollarSign, 
  Activity, 
  PieChart, 
  ArrowUpRight,  
  Users, 
  Zap, 
  Shield, 
  ExternalLink,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Menu,
  X,
  AlertTriangle,
  CheckCircle,
  TrendingDown,
  Lock,
  Database,
  Globe
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useWallet } from '../context/WalletContext';

const tabs = [
  { id: 'overview', label: 'Portfolio Overview', icon: BarChart3, shortLabel: 'Portfolio' },
  { id: 'analytics', label: 'Investment Analytics', icon: TrendingUp, shortLabel: 'Analytics' },
  { id: 'strategy', label: 'Strategy Details', icon: Target, shortLabel: 'Strategy' },
  { id: 'risk', label: 'Risk Management', icon: Shield, shortLabel: 'Risk' },
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
  SEEDING: '0x6DfD909Be557Ed5a6ec4C5c4375a3b9F3f40D33d'
};

// ABIs for the contracts
const SEEDING_ABI = [
  "function purchaseTokens(uint256 usdcAmount) external",
  "function getQuote(uint256 usdcAmount) external view returns (uint256, uint256, uint256)",
  "function claimBonusTokens() external",
  "function getBonusTokenInfo(address) external view returns (uint256, uint256, bool)",
  "function seedingActive() external view returns (bool)",
  "function totalSold() external view returns (uint256)",
  "function maximumAllocation() external view returns (uint256)",
  "function minimumPurchase() external view returns (uint256)",
  "function purchasedAmount(address) external view returns (uint256)",
  "function getSeedingProgress() external view returns (uint256, uint256, uint256)",
  "function getParticipantCount() external view returns (uint256)"
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
  const { 
    account, 
    provider, 
    signer, 
    isConnected, 
    connectWallet, 
    isLoading, 
    error, 
    success,
    setError,
    setSuccess
  } = useWallet();
  
  const [avaContract, setAvaContract] = useState(null);
  const [seedingContract, setSeedingContract] = useState(null);
  const [usdcContract, setUsdcContract] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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

  const [userData, setUserData] = useState({
    avaBalance: '0',
    usdcBalance: '0',
    purchasedAmount: '0',
    investmentValue: '0',
    portfolioPercent: 0
  });

  const [prices, setPrices] = useState({
    bitcoin: 0,
    ava: 0,
    loading: true
  });

  const [activeTab, setActiveTab] = useState('overview');
  const [expandedSections, setExpandedSections] = useState({
    strategy: false,
    riskManagement: false
  });

  useEffect(() => {
    const initContracts = async () => {
      if (!ethers || !window.ethereum) return;
      const provider = new ethers.BrowserProvider(window.ethereum);
      const ava = new ethers.Contract(CONTRACTS.AVA, AVA_ABI, provider);
      const seeding = new ethers.Contract(CONTRACTS.SEEDING, SEEDING_ABI, provider);
      const usdc = new ethers.Contract(CONTRACTS.USDC, USDC_ABI, provider);
      setAvaContract(ava);
      setSeedingContract(seeding);
      setUsdcContract(usdc);
      
      if (signer && isConnected) {
        setAvaContract(ava.connect(signer));
        setSeedingContract(seeding.connect(signer));
        setUsdcContract(usdc.connect(signer));
      }
    };
    initContracts();
  }, [signer, isConnected]);

  // Fetch crypto prices from CoinGecko
// Updated fetchPrices function using Mantle (MNT) token instead of USDT

const fetchPrices = async () => {
  try {
    // Fetch Bitcoin and Mantle prices from CoinGecko
    // CoinGecko ID for Mantle is "mantle"
    const response = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,mantle&vs_currencies=usd'
    );
    const data = await response.json();
    
    // Get actual Mantle (MNT) price
    const mantlePrice = data.mantle?.usd || 1.00;
    
    setPrices({
      bitcoin: data.bitcoin?.usd || 0,
      usdt: mantlePrice,  // Using Mantle price in place of USDT
      ava: mantlePrice,   // AVA is pegged to Mantle, so use actual Mantle price
      loading: false,
      lastUpdate: new Date().toISOString()
    });
    
    console.log('Updated prices:', {
      bitcoin: data.bitcoin?.usd || 0,
      mantle: mantlePrice,
      timestamp: new Date().toLocaleString()
    });
  } catch (error) {
    console.error('Error fetching prices:', error);
    // Fallback to $1.00 if fetch fails
    setPrices(prev => ({ 
      ...prev, 
      bitcoin: prev.bitcoin || 0, 
      usdt: 1.00,
      ava: 1.00, 
      loading: false 
    }));
  }
};
  useEffect(() => {
    fetchPrices();
    const interval = setInterval(fetchPrices, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

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
        sellTaxRate: Number(sellTaxRate) / 100,
        seedingActive,
        minimumPurchase: ethers.formatEther(minimumPurchase)
      });

    } catch (error) {
      console.error('Error loading project data:', error);
    }
  };
  
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
      const investmentValue = purchasedAmountFormatted;
      
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

  useEffect(() => {
    loadProjectData();
    const interval = setInterval(loadProjectData, 30000);
    return () => clearInterval(interval);
  }, [seedingContract, avaContract]);

  useEffect(() => {
    if (isConnected && account) {
      loadUserData();
      const interval = setInterval(() => {
        loadUserData();
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [isConnected, account, projectData.totalSold]);

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const formatNumber = (num, decimals = 2) => {
    const number = parseFloat(num);
    if (isNaN(number)) return '0.00';
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(number);
  };

  const formatCurrency = (num) => {
    const number = parseFloat(num);
    if (isNaN(number)) return '$0.00';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(number);
  };

  const formatPercent = (num) => {
    return `${parseFloat(num).toFixed(2)}%`;
  };

  // Calculate projected values based on 47% APY


  const userInvestment = parseFloat(userData.investmentValue);


  // Calculate portfolio values using live prices
  const avaBalanceNum = parseFloat(userData.avaBalance);
  const avaBalanceUSD = avaBalanceNum * prices.ava;
  const totalPortfolioValue = avaBalanceUSD + parseFloat(userData.usdcBalance);

  return (
    <div className="coinbase-bg text-slate-900 font-inter min-h-screen">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4 coinbase-title">
            AVALON INVESTOR DASHBOARD
          </h1>
          <p className="text-xl coinbase-subtitle">Track Your Investment Performance</p>
        </div>

        {/* Live Market Prices */}
        <div className="max-w-6xl mx-auto mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="coinbase-card rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center mr-3">
                    <span className="font-bold text-orange-600">₿</span>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600 font-medium">Bitcoin Price</p>
                    <p className="text-2xl font-bold text-slate-900">
                      {prices.loading ? 'Loading...' : formatCurrency(prices.bitcoin)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center text-green-500">
                  <TrendingUp className="w-5 h-5" />
                </div>
              </div>
            </div>

            <div className="coinbase-card rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                    <span className="font-bold text-blue-600">AVA</span>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600 font-medium">AVA Token Price</p>
                    <p className="text-2xl font-bold text-slate-900">
                      {prices.loading ? 'Loading...' : formatCurrency(prices.ava)}
                    </p>
                  </div>
                </div>
                <div className="text-xs text-slate-500 text-right">
                  <p>Using MNT</p>
                  <p>as proxy</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {!isConnected && (
          <div className="max-w-4xl mx-auto mb-8">
            <div className="coinbase-card rounded-2xl p-6 border-2 border-blue-200 bg-blue-50">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Wallet className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="text-center sm:text-left">
                    <h3 className="text-lg font-bold text-slate-900">Connect to View Your Portfolio</h3>
                    <p className="text-sm text-slate-600">Connect your wallet to see your personal investment data</p>
                  </div>
                </div>
                <button
                  onClick={connectWallet}
                  disabled={isLoading}
                  className="coinbase-btn text-white px-6 py-3 rounded-xl font-semibold disabled:opacity-50 whitespace-nowrap"
                >
                  <Wallet className="w-4 h-4 mr-2 inline" />
                  {isLoading ? 'Connecting...' : 'Connect Wallet'}
                </button>
              </div>
            </div>
          </div>
        )}

        <>
          <div className="max-w-6xl mx-auto mb-6 sm:mb-8">
            <div className="coinbase-card rounded-xl sm:rounded-2xl">
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

          {activeTab === 'overview' && (
            <div className="max-w-6xl mx-auto space-y-8">
              {/* Enhanced Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="coinbase-card rounded-2xl p-6 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-100 rounded-full -mr-16 -mt-16 opacity-50"></div>
                  <div className="relative">
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <Wallet className="w-5 h-5 text-blue-600" />
                      </div>
                      <ArrowUpRight className="w-4 h-4 text-green-500" />
                    </div>
                    <p className="text-2xl font-bold text-slate-900 mb-1">{formatNumber(userData.avaBalance)}</p>
                    <p className="text-slate-600 font-medium mb-2">AVA Balance</p>
                    <p className="text-sm text-slate-500">≈ {formatCurrency(avaBalanceUSD)}</p>
                  </div>
                </div>

                <div className="coinbase-card rounded-2xl p-6 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-green-100 rounded-full -mr-16 -mt-16 opacity-50"></div>
                  <div className="relative">
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <DollarSign className="w-5 h-5 text-green-600" />
                      </div>
                      <ArrowUpRight className="w-4 h-4 text-green-500" />
                    </div>
                    <p className="text-2xl font-bold text-slate-900 mb-1">${formatNumber(userData.investmentValue)}</p>
                    <p className="text-slate-600 font-medium mb-2">Investment Value</p>
                    <p className="text-sm text-green-600">Total purchased amount</p>
                  </div>
                </div>

                <div className="coinbase-card rounded-2xl p-6 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-purple-100 rounded-full -mr-16 -mt-16 opacity-50"></div>
                  <div className="relative">
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                        <PieChart className="w-5 h-5 text-purple-600" />
                      </div>
                    </div>
                    <p className="text-2xl font-bold text-slate-900 mb-1">{formatPercent(userData.portfolioPercent)}</p>
                    <p className="text-slate-600 font-medium mb-2">Portfolio Share</p>
                    <p className="text-sm text-slate-500">Of total tokens sold</p>
                  </div>
                </div>

                <div className="coinbase-card rounded-2xl p-6 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-100 rounded-full -mr-16 -mt-16 opacity-50"></div>
                  <div className="relative">
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-10 h-10 bg-cyan-100 rounded-full flex items-center justify-center">
                        <Users className="w-5 h-5 text-cyan-600" />
                      </div>
                    </div>
                    <p className="text-2xl font-bold text-slate-900 mb-1">{projectData.participantCount}</p>
                    <p className="text-slate-600 font-medium mb-2">Total Investors</p>
                    <p className="text-sm text-slate-500">Active participants</p>
                  </div>
                </div>
              </div>

    

              {/* Investment Projections */}
             {isConnected && parseFloat(userData.investmentValue) > 0 && (
                <div className="coinbase-card rounded-2xl p-8">
                  <h3 className="text-2xl font-bold mb-6 text-slate-900">Your Investment Journey</h3>
                  
                  {/* Investment Overview */}
                  <div className="bg-gradient-to-br from-blue-50 via-purple-50 to-cyan-50 rounded-xl p-6 mb-6">
                    <div className="grid md:grid-cols-3 gap-6">
                      <div className="text-center">
                        <div className="w-12 h-12 mx-auto mb-3 bg-blue-100 rounded-full flex items-center justify-center">
                          <DollarSign className="w-6 h-6 text-blue-600" />
                        </div>
                        <p className="text-sm text-slate-600 mb-1">Your Investment</p>
                        <p className="text-2xl font-bold text-blue-600">${formatNumber(userData.investmentValue)}</p>
                        <p className="text-xs text-slate-500 mt-1">Initial USDC invested</p>
                      </div>
                      
                      <div className="text-center">
                        <div className="w-12 h-12 mx-auto mb-3 bg-purple-100 rounded-full flex items-center justify-center">
                          <PieChart className="w-6 h-6 text-purple-600" />
                        </div>
                        <p className="text-sm text-slate-600 mb-1">Portfolio Share</p>
                        <p className="text-2xl font-bold text-purple-600">{formatPercent(userData.portfolioPercent)}</p>
                        <p className="text-xs text-slate-500 mt-1">Of total supply</p>
                      </div>
                      
                      <div className="text-center">
                        <div className="w-12 h-12 mx-auto mb-3 bg-green-100 rounded-full flex items-center justify-center">
                          <TrendingUp className="w-6 h-6 text-green-600" />
                        </div>
                        <p className="text-sm text-slate-600 mb-1">AVA Tokens</p>
                        <p className="text-2xl font-bold text-green-600">{formatNumber(userData.avaBalance)}</p>
                        <p className="text-xs text-slate-500 mt-1">Current holdings</p>
                      </div>
                    </div>
                  </div>

                  {/* Strategy Allocation Behind Your Investment */}
                  <div className="grid md:grid-cols-2 gap-6 mb-6">
                    <div className="bg-white rounded-xl p-6 border-2 border-blue-100">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Activity className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900">Bitcoin Strategy (BARS)</h4>
                          <p className="text-sm text-slate-600">80% allocation</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-600">Your allocation:</span>
                          <span className="font-bold text-blue-600">${formatNumber(parseFloat(userData.investmentValue) * 0.80)}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-600">Strategy:</span>
                          <span className="font-medium text-slate-700">Volatility Harvesting</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-600">Rebalancing:</span>
                          <span className="font-medium text-slate-700">Automated 8% threshold</span>
                        </div>
                        <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                          <p className="text-xs text-blue-800">
                            <span className="font-semibold">How it works:</span> Your funds systematically buy Bitcoin dips and sell peaks, capturing profits from market volatility without timing requirements.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-xl p-6 border-2 border-purple-100">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                          <Shield className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900">Token Liquidity</h4>
                          <p className="text-sm text-slate-600">20% allocation</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-600">Your allocation:</span>
                          <span className="font-bold text-purple-600">${formatNumber(parseFloat(userData.investmentValue) * 0.20)}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-600">Purpose:</span>
                          <span className="font-medium text-slate-700">Price Support</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-600">Mechanism:</span>
                          <span className="font-medium text-slate-700">Ratcheting liquidity</span>
                        </div>
                        <div className="mt-3 p-3 bg-purple-50 rounded-lg">
                          <p className="text-xs text-purple-800">
                            <span className="font-semibold">How it works:</span> Provides buy-side liquidity for AVA token, ensuring stable price action and reducing slippage for all token holders.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Value Creation Mechanisms */}
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6">
                    <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                      <Zap className="w-5 h-5 text-green-600" />
                      How Your Investment Creates Value
                    </h4>
                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="bg-white rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                            <span className="text-green-600 font-bold text-sm">1</span>
                          </div>
                          <h5 className="font-bold text-slate-900 text-sm">Profit Generation</h5>
                        </div>
                        <p className="text-xs text-slate-600">
                          BARS strategy captures volatility profits from Bitcoin's natural price movements through systematic rebalancing.
                        </p>
                      </div>
                      
                      <div className="bg-white rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-blue-600 font-bold text-sm">2</span>
                          </div>
                          <h5 className="font-bold text-slate-900 text-sm">Buyback Pressure</h5>
                        </div>
                        <p className="text-xs text-slate-600">
                          70-85% of profits used for AVA token buybacks, creating constant demand and deflationary pressure on supply.
                        </p>
                      </div>
                      
                      <div className="bg-white rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                            <span className="text-purple-600 font-bold text-sm">3</span>
                          </div>
                          <h5 className="font-bold text-slate-900 text-sm">Token Appreciation</h5>
                        </div>
                        <p className="text-xs text-slate-600">
                          Continuous buybacks reduce circulating supply while your holdings remain constant, increasing your proportional value.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Key Investment Insights */}
                  <div className="mt-6 grid md:grid-cols-2 gap-4">
                    <div className="bg-cyan-50 rounded-lg p-4 border border-cyan-200">
                      <div className="flex items-center gap-2 mb-2">
                        <Info className="w-5 h-5 text-cyan-600" />
                        <h5 className="font-bold text-cyan-900">No Action Required</h5>
                      </div>
                      <p className="text-sm text-cyan-800">
                        Simply hold your AVA tokens. All trading, rebalancing, and profit generation happens automatically behind the scenes.
                      </p>
                    </div>
                    
                    <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
                      <div className="flex items-center gap-2 mb-2">
                        <Target className="w-5 h-5 text-amber-600" />
                        <h5 className="font-bold text-amber-900">Performance Tracking</h5>
                      </div>
                      <p className="text-sm text-amber-800">
                        Watch your AVA token value grow as buybacks reduce supply and strategy profits accumulate over time. Check back regularly!
                      </p>
                    </div>
                  </div>
                </div>
              )}
              {/* Project Progress */}
              <div className="coinbase-card rounded-2xl p-8">
                <h3 className="text-2xl font-bold mb-6 text-slate-900">Seeding Progress</h3>
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

              {/* Investment Summary */}
              <div className="coinbase-card rounded-2xl p-8">
                <h3 className="text-2xl font-bold mb-6 text-slate-900">Your Investment Summary</h3>
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center py-3 border-b border-slate-200">
                      <span className="text-slate-600 font-medium">AVA Tokens Purchased</span>
                      <div className="text-right">
                        <span className="text-slate-900 font-bold block">{formatNumber(userData.purchasedAmount)}</span>
                        <span className="text-slate-500 text-sm">{formatCurrency(parseFloat(userData.purchasedAmount) * prices.ava)}</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b border-slate-200">
                      <span className="text-slate-600 font-medium">Current AVA Balance</span>
                      <div className="text-right">
                        <span className="text-slate-900 font-bold block">{formatNumber(userData.avaBalance)}</span>
                        <span className="text-slate-500 text-sm">{formatCurrency(avaBalanceUSD)}</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b border-slate-200">
                      <span className="text-slate-600 font-medium">USDC Balance</span>
                      <span className="text-slate-900 font-bold">${formatNumber(userData.usdcBalance)}</span>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b border-slate-200">
                      <span className="text-slate-600 font-medium">Total Portfolio Value</span>
                      <span className="text-blue-600 font-bold text-lg">{formatCurrency(totalPortfolioValue)}</span>
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
                        <span className="text-slate-700">Automated buybacks</span>
                      </div>
                      <div className="flex items-center">
                        <Activity className="w-5 h-5 text-blue-600 mr-3" />
                        <span className="text-slate-700">Volatility harvesting strategy</span>
                      </div>
                      <div className="flex items-center">
                        <Target className="w-5 h-5 text-purple-600 mr-3" />
                        <span className="text-slate-700">47% APY total returns</span>
                      </div>
                    </div>
                    
                    <div className="mt-6 pt-6 border-t border-slate-200">
                      <p className="text-sm font-medium text-slate-700 mb-2">Current Market Prices</p>
                      <div className="space-y-1 text-sm text-slate-600">
                        <div className="flex justify-between">
                          <span>Bitcoin:</span>
                          <span className="font-bold">{formatCurrency(prices.bitcoin)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>AVA Token:</span>
                          <span className="font-bold">{formatCurrency(prices.ava)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="max-w-6xl mx-auto space-y-8">
              <div className="coinbase-card rounded-2xl p-8">
                <h3 className="text-2xl font-bold mb-6 text-slate-900">Strategy Performance Metrics</h3>
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="bg-green-50 rounded-xl p-6 text-center">
                    <div className="w-12 h-12 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
                      <TrendingUp className="w-6 h-6 text-green-600" />
                    </div>
                    <p className="text-3xl font-bold text-green-600 mb-2">47%</p>
                    <p className="text-slate-700 font-medium">APY from Total NAV + Total accumulated Profits </p>
                    <p className="text-sm text-slate-500 mt-2">2021-2025 backtested compounded growth</p>
                  </div>
                  <div className="bg-blue-50 rounded-xl p-6 text-center">
                    <div className="w-12 h-12 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
                      <Activity className="w-6 h-6 text-blue-600" />
                    </div>
                    <p className="text-3xl font-bold text-blue-600 mb-2">27%</p>
                    <p className="text-slate-700 font-medium">Average Yearly Extractable Profits</p>
                    <p className="text-sm text-slate-500 mt-2">Yearly average on initial allocation</p>
                  </div>
                  <div className="bg-purple-50 rounded-xl p-6 text-center">
                    <div className="w-12 h-12 mx-auto mb-4 bg-purple-100 rounded-full flex items-center justify-center">
                      <Shield className="w-6 h-6 text-purple-600" />
                    </div>
                    <p className="text-3xl font-bold text-purple-600 mb-2">{projectData.sellTaxRate}%</p>
                    <p className="text-slate-700 font-medium">Sell Tax Rate</p>
                    <p className="text-sm text-slate-500 mt-2">discourages Arbitrage</p>
                  </div>
                </div>
              </div>

              <div className="coinbase-card rounded-2xl p-8">
                <h3 className="text-2xl font-bold mb-6 text-slate-900">Asset Allocation Strategy</h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6">
                    <h4 className="text-lg font-bold text-blue-900 mb-3">Bitcoin Adaptive Rebalancing</h4>
                    <p className="text-4xl font-bold text-blue-600 mb-2">80%</p>
                    <p className="text-blue-800 font-medium mb-3">BARS Strategy</p>
                    <ul className="text-sm text-blue-700 space-y-1">
                      <li>• 8% rebalancing threshold optimized</li>
                      <li>• 47% APY total NAV growth</li>
                      <li>• 27% Yearly extractable profits</li>
                      <li>• Adaptive 10%-70% exposure</li>
                      <li>• Monthly scaling to new NAV</li>
                      <li>• Final NAV: $12.495M from $2M</li>
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
                      <li>• $0.05 price increments</li>
                      <li>• 4% liquidity per step</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="coinbase-card rounded-2xl p-8">
                <h3 className="text-2xl font-bold mb-6 text-slate-900">Revenue Distribution Model</h3>
                <div className="grid md:grid-cols-2 gap-8">
                  <div>
                    <h4 className="text-lg font-bold text-slate-900 mb-4">Revenue Allocation</h4>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border-l-4 border-green-500">
                        <div>
                          <p className="font-bold text-green-900">Buybacks & Liquidity</p>
                          <p className="text-green-700 text-sm">Until 70% sold</p>
                        </div>
                        <p className="text-2xl font-bold text-green-600">70%-85%</p>
                      </div>
                      <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                        <div>
                          <p className="font-bold text-blue-900">Operations & Treasury</p>
                          <p className="text-blue-700 text-sm">Ongoing operations</p>
                        </div>
                        <p className="text-2xl font-bold text-blue-600">30%-15</p>
                      </div>
                      <div className="mt-4 p-3 bg-purple-50 rounded-lg">
                        <p className="text-purple-800 text-sm">After 70% token sale: 85% to buybacks, 15% operations</p>
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

              <div className="coinbase-card rounded-2xl p-8">
                <h3 className="text-2xl font-bold mb-6 text-slate-900">Expected Monthly Performance</h3>
                <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-6">
                  <div className="grid md:grid-cols-3 gap-6 text-center">
                    <div>
                      <p className="text-slate-600 font-medium mb-2">Monthly Profit Range</p>
                      <p className="text-3xl font-bold text-green-600">1.5% - 2.5%</p>
                      <p className="text-sm text-slate-500 mt-1">From BARS strategy</p>
                    </div>
                    <div>
                      <p className="text-slate-600 font-medium mb-2">Compounding Effect</p>
                      <p className="text-3xl font-bold text-blue-600">Monthly</p>
                      <p className="text-sm text-slate-500 mt-1">NAV rescaling</p>
                    </div>
                    <div>
                      <p className="text-slate-600 font-medium mb-2">Annual Target</p>
                      <p className="text-3xl font-bold text-purple-600">47%</p>
                      <p className="text-sm text-slate-500 mt-1">Total returns</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'strategy' && (
            <div className="max-w-6xl mx-auto space-y-8">
              <div className="coinbase-card rounded-2xl p-8">
                <h3 className="text-2xl font-bold mb-6 text-slate-900">The AVALON Approach</h3>
                <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-6 mb-6">
                  <p className="text-lg text-slate-700 leading-relaxed">
                    AVALON introduces a disciplined, data-driven approach to Bitcoin exposure through its proprietary 
                    <span className="font-bold text-blue-600"> Bitcoin Adaptive Rebalancing Strategy (BARS) </span> 
                    a systematic mechanism designed to convert Bitcoin’s inherent price swings into steady, compounding growth.
BARS continuously rebalances exposure with each market movement — buying Bitcoin when exposure falls below target and selling when it exceeds the target. This reactive process captures volatility-driven gains without requiring market timing.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="border border-slate-200 rounded-xl">
                    <button
                      onClick={() => toggleSection('strategy')}
                      className="w-full flex items-center justify-between p-6 text-left hover:bg-slate-50 rounded-xl transition-colors"
                    >
                      <div>
                        <h4 className="text-xl font-bold text-slate-900">Bitcoin Adaptive Rebalancing Strategy (BARS)</h4>
                        <p className="text-slate-600 mt-1">Core systematic trading strategy with adaptive exposure</p>
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
                                <span>Adaptive exposure: 10%-70% based on market conditions</span>
                              </li>
                              <li className="flex items-start">
                                <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                                <span>8% optimal rebalancing threshold on sell events</span>
                              </li>
                              <li className="flex items-start">
                                <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                                <span>Monthly scaling to new NAV for compounding</span>
                              </li>
                              <li className="flex items-start">
                                <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                                <span>70% Bitcoin / 30% USDC reserves baseline</span>
                              </li>
                            </ul>
                          </div>
                          <div>
                            <h5 className="font-bold text-slate-900 mb-3">Performance Results</h5>
                            <div className="space-y-3">
                              <div className="bg-green-50 rounded-lg p-4">
                                <p className="font-bold text-green-600 text-lg">47% APY</p>
                                <p className="text-green-700 text-sm">Total NAV + accumulated profits</p>
                              </div>
                              <div className="bg-blue-50 rounded-lg p-4">
                                <p className="font-bold text-blue-600 text-lg">27% APY</p>
                                <p className="text-blue-700 text-sm">Average yearly extractable profits</p>
                              </div>
                              <div className="bg-purple-50 rounded-lg p-4">
                                <p className="font-bold text-purple-600 text-lg">$12.495M</p>
                                <p className="text-purple-700 text-sm">Final NAV from $2M initial</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="border border-slate-200 rounded-xl">
                    <button
                      onClick={() => toggleSection('riskManagement')}
                      className="w-full flex items-center justify-between p-6 text-left hover:bg-slate-50 rounded-xl transition-colors"
                    >
                      <div>
                        <h4 className="text-xl font-bold text-slate-900">Risk Management Framework</h4>
                        <p className="text-slate-600 mt-1">Capital preservation and reserve management</p>
                      </div>
                      {expandedSections.riskManagement ? 
                        <ChevronUp className="w-6 h-6 text-slate-400" /> : 
                        <ChevronDown className="w-6 h-6 text-slate-400" />
                      }
                    </button>
                    {expandedSections.riskManagement && (
                      <div className="px-6 pb-6">
                        <div className="grid md:grid-cols-2 gap-6">
                          <div>
                            <h5 className="font-bold text-slate-900 mb-3">USDC Reserve Management</h5>
                            <ul className="space-y-2 text-slate-700">
                              <li className="flex items-start">
                                <span className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                                <span>30% USDC in BARS for buying crashes</span>
                              </li>
                              <li className="flex items-start">
                                <span className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                                <span>20% USDC in liquidity pool</span>
                              </li>
                              <li className="flex items-start">
                                <span className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                                <span>Adaptive exposure optimize reserves</span>
                              </li>
                            </ul>
                          </div>
                          <div>
                            <h5 className="font-bold text-slate-900 mb-3">Protection Mechanisms</h5>
                            <div className="space-y-3">
                              <div className="bg-blue-50 rounded-lg p-4">
                                <p className="font-bold text-blue-600 text-sm">No Leverage</p>
                                <p className="text-blue-700 text-xs mt-1">Zero liquidation risk</p>
                              </div>
                              <div className="bg-purple-50 rounded-lg p-4">
                                <p className="font-bold text-purple-600 text-sm">Systematic Rules</p>
                                <p className="text-purple-700 text-xs mt-1">Removes emotional trading</p>
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

          {activeTab === 'risk' && (
            <div className="max-w-6xl mx-auto space-y-8">
              <div className="coinbase-card rounded-2xl p-8">
                <div className="flex items-center mb-6">
                  <Shield className="w-8 h-8 text-blue-600 mr-3" />
                  <div>
                    <h3 className="text-2xl font-bold text-slate-900">Risk Management</h3>
                    <p className="text-slate-600">Multi-layered protection for your investment</p>
                  </div>
                </div>

                <div className="space-y-6">
                  {/* Core Protection */}
                  <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-6">
                    <h4 className="text-lg font-bold text-slate-900 mb-4">Core Protection Mechanisms</h4>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="flex items-start p-4 bg-white rounded-lg">
                        <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 mr-3 flex-shrink-0" />
                        <div>
                          <p className="font-bold text-slate-900 mb-1">No Leverage</p>
                          <p className="text-sm text-slate-600">Zero liquidation risk - only spot holdings</p>
                        </div>
                      </div>
                      <div className="flex items-start p-4 bg-white rounded-lg">
                        <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 mr-3 flex-shrink-0" />
                        <div>
                          <p className="font-bold text-slate-900 mb-1">USDC Reserves</p>
                          <p className="text-sm text-slate-600">50% total in stablecoins for downside protection</p>
                        </div>
                      </div>
                      <div className="flex items-start p-4 bg-white rounded-lg">
                        <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 mr-3 flex-shrink-0" />
                        <div>
                          <p className="font-bold text-slate-900 mb-1">Systematic Rules</p>
                          <p className="text-sm text-slate-600">Removes emotional decision making</p>
                        </div>
                      </div>
                      <div className="flex items-start p-4 bg-white rounded-lg">
                        <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 mr-3 flex-shrink-0" />
                        <div>
                          <p className="font-bold text-slate-900 mb-1">Adaptive Exposure</p>
                          <p className="text-sm text-slate-600">10%-70% BTC range based on conditions</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Reserve Breakdown */}
                  <div className="coinbase-card rounded-xl p-6">
                    <h4 className="text-lg font-bold text-slate-900 mb-4">Reserve Allocation</h4>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="p-4 bg-blue-50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <p className="font-bold text-blue-900">BARS Strategy Reserves</p>
                          <p className="text-2xl font-bold text-blue-600">30%</p>
                        </div>
                        <p className="text-sm text-blue-700">Available for buying market dips and crashes</p>
                      </div>
                      <div className="p-4 bg-purple-50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <p className="font-bold text-purple-900">Liquidity Pool Reserves</p>
                          <p className="text-2xl font-bold text-purple-600">20%</p>
                        </div>
                        <p className="text-sm text-purple-700">Supporting token liquidity and stability</p>
                      </div>
                    </div>
                  </div>

                  {/* Protocol Safety */}
                  <div className="coinbase-card rounded-xl p-6">
                    <h4 className="text-lg font-bold text-slate-900 mb-4">Protocol Safety</h4>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <h5 className="font-medium text-slate-900 mb-3">Approved Protocols</h5>
                        <div className="space-y-2">
                          <div className="flex items-center p-3 bg-green-50 rounded-lg">
                            <CheckCircle className="w-5 h-5 text-green-600 mr-3" />
                            <div>
                              <p className="font-medium text-green-900 text-sm">Uniswap V3</p>
                              <p className="text-xs text-green-700">Battle-tested DEX</p>
                            </div>
                          </div>
                          <div className="flex items-center p-3 bg-green-50 rounded-lg">
                            <CheckCircle className="w-5 h-5 text-green-600 mr-3" />
                            <div>
                              <p className="font-medium text-green-900 text-sm">Base Chain</p>
                              <p className="text-xs text-green-700">Coinbase L2</p>
                            </div>
                          </div>
                          <div className="flex items-center p-3 bg-green-50 rounded-lg">
                            <CheckCircle className="w-5 h-5 text-green-600 mr-3" />
                            <div>
                              <p className="font-medium text-green-900 text-sm">Circle USDC</p>
                              <p className="text-xs text-green-700">Regulated stablecoin</p>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div>
                        <h5 className="font-medium text-slate-900 mb-3">What We Avoid</h5>
                        <div className="space-y-2">
                          <div className="flex items-center p-3 bg-red-50 rounded-lg">
                            <X className="w-5 h-5 text-red-600 mr-3" />
                            <span className="text-red-700 text-sm">Unaudited protocols</span>
                          </div>
                          <div className="flex items-center p-3 bg-red-50 rounded-lg">
                            <X className="w-5 h-5 text-red-600 mr-3" />
                            <span className="text-red-700 text-sm">Leverage/borrowing</span>
                          </div>
                          <div className="flex items-center p-3 bg-red-50 rounded-lg">
                            <X className="w-5 h-5 text-red-600 mr-3" />
                            <span className="text-red-700 text-sm">Complex interactions</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Emergency Protocols */}
                  <div className="bg-orange-50 rounded-xl p-6 border border-orange-200">
                    <div className="flex items-start">
                      <AlertTriangle className="w-6 h-6 text-orange-600 mt-1 mr-3 flex-shrink-0" />
                      <div>
                        <h4 className="text-lg font-bold text-orange-900 mb-2">Emergency Liquidity Protocol</h4>
                        <p className="text-sm text-orange-800 mb-3">
                          In case of severe liquidity crisis, the protocol can add incremental liquidity at discounted price levels:
                        </p>
                        <ul className="text-sm text-orange-700 space-y-2">
                          <li className="flex items-start">
                            <span className="font-bold mr-2">•</span>
                            <span>5% of total supply added at 50% price discount per level</span>
                          </li>
                          <li className="flex items-start">
                            <span className="font-bold mr-2">•</span>
                            <span>Creates strong support levels during market stress</span>
                          </li>
                          <li className="flex items-start">
                            <span className="font-bold mr-2">•</span>
                            <span>Protects long-term holders and maintains stability</span>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

           
            </div>
          )}

          {activeTab === 'tokenomics' && (
            <div className="max-w-6xl mx-auto space-y-8">
              <div className="coinbase-card rounded-2xl p-8">
                <h3 className="text-2xl font-bold mb-6 text-slate-900">Token Distribution</h3>
                
                <div className="grid md:grid-cols-2 gap-8 mb-8">
                  <div>
                    <h4 className="text-lg font-bold text-slate-900 mb-4">Total Supply Breakdown</h4>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                        <div>
                          <p className="font-bold text-blue-900">Seeding Allocation</p>
                          <p className="text-blue-700 text-sm">4,375,000 AVA</p>
                        </div>
                        <p className="text-2xl font-bold text-blue-600">87.5%</p>
                      </div>
                      <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border-l-4 border-green-500">
                        <div>
                          <p className="font-bold text-green-900">Liquidity Pool</p>
                          <p className="text-green-700 text-sm">625,000 AVA</p>
                        </div>
                        <p className="text-2xl font-bold text-green-600">12.5%</p>
                      </div>
                      <div className="p-4 bg-slate-50 rounded-lg">
                        <div className="flex justify-between items-center">
                          <p className="font-bold text-slate-900">Total Supply</p>
                          <p className="text-xl font-bold text-slate-900">{formatNumber(projectData.totalSupply)} AVA</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-lg font-bold text-slate-900 mb-4">Key Token Features</h4>
                    <div className="space-y-3">
                      <div className="flex items-start p-3 bg-green-50 rounded-lg">
                        <Shield className="w-5 h-5 text-green-600 mt-0.5 mr-3 flex-shrink-0" />
                        <div>
                          <p className="font-medium text-green-800">No Staking Required</p>
                          <p className="text-green-700 text-sm">Simply hold AVA tokens</p>
                        </div>
                      </div>
                      <div className="flex items-start p-3 bg-blue-50 rounded-lg">
                        <ArrowUpRight className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                        <div>
                          <p className="font-medium text-blue-800">Deflationary Mechanism</p>
                          <p className="text-blue-700 text-sm">70-85% revenue to buybacks</p>
                        </div>
                      </div>
                      <div className="flex items-start p-3 bg-purple-50 rounded-lg">
                        <Activity className="w-5 h-5 text-purple-600 mt-0.5 mr-3 flex-shrink-0" />
                        <div>
                          <p className="font-medium text-purple-800">{projectData.sellTaxRate}% Sell Tax</p>
                          <p className="text-purple-700 text-sm">Funds buyback program</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="max-w-4xl mx-auto mt-6">
              <div className="error-msg rounded-xl p-4 flex items-center">
                <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0" />
                <span className="font-medium">{error}</span>
              </div>
            </div>
          )}

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
            </div>
          </div>

          <div className="max-w-6xl mx-auto mt-8 text-center">
            <p className="text-slate-500">
              Avalon Token - Harnessing Volatility for Steady Returns
            </p>
            <p className="text-slate-400 text-sm mt-2">
              Built on Base • BARS Strategy: 47% APY Total Returns
              {isConnected && (
                <>
                  <span className="mx-2">•</span>
                  Connected: {account.slice(0, 6)}...{account.slice(-4)}
                </>
              )}
            </p>
          </div>
        </>
      </div>
    </div>
  );
}

export default InvestorDashboard;