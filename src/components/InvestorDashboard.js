// src/components/InvestorDashboard.js - FULLY UPDATED WITH RISK MANAGEMENT
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
  Users, 
  Zap, 
  Shield, 
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Info,
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

  const [activeTab, setActiveTab] = useState('overview');
  const [expandedSections, setExpandedSections] = useState({
    tokenomics: true,
    strategy: false,
    riskManagement: false,
    protocolSafety: false,
    marketIndicators: false,
    reserveManagement: false,
    defiRisks: false,
    volatilityMgmt: false,
    emergencyProtocols: false
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
    return new Intl.NumberFormat().format(parseFloat(num).toFixed(decimals));
  };

  const formatPercent = (num) => {
    return `${parseFloat(num).toFixed(2)}%`;
  };

  // Risk status helper
  const getRiskStatus = (level) => {
    const statuses = {
      low: { color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200', icon: CheckCircle },
      medium: { color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-200', icon: AlertTriangle },
      high: { color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', icon: AlertCircle }
    };
    return statuses[level] || statuses.low;
  };

  return (
    <div className="coinbase-bg text-slate-900 font-inter min-h-screen">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4 coinbase-title">
            AVALON INVESTOR DASHBOARD
          </h1>
          <p className="text-xl coinbase-subtitle">Track Your Investment Performance</p>
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
                        <span className="text-slate-700">47% APY total returns</span>
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
                    <p className="text-slate-700 font-medium">Total NAV + Profits APY</p>
                    <p className="text-sm text-slate-500 mt-2">2021-2025 backtested compounded growth</p>
                  </div>
                  <div className="bg-blue-50 rounded-xl p-6 text-center">
                    <div className="w-12 h-12 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
                      <Activity className="w-6 h-6 text-blue-600" />
                    </div>
                    <p className="text-3xl font-bold text-blue-600 mb-2">27.3%</p>
                    <p className="text-slate-700 font-medium">Extractable Profits APY</p>
                    <p className="text-sm text-slate-500 mt-2">Yearly average on initial allocation</p>
                  </div>
                  <div className="bg-purple-50 rounded-xl p-6 text-center">
                    <div className="w-12 h-12 mx-auto mb-4 bg-purple-100 rounded-full flex items-center justify-center">
                      <Shield className="w-6 h-6 text-purple-600" />
                    </div>
                    <p className="text-3xl font-bold text-purple-600 mb-2">8%</p>
                    <p className="text-slate-700 font-medium">Sell Tax Rate</p>
                    <p className="text-sm text-slate-500 mt-2">Supports buyback program</p>
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
                      <li>• 27.3% extractable profits APY</li>
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
                      <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                        <span className="font-medium text-green-800">Initial Phase: Buybacks & Liquidity</span>
                        <span className="text-2xl font-bold text-green-600">70%</span>
                      </div>
                      <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                        <span className="font-medium text-blue-800">Operations & Treasury</span>
                        <span className="text-2xl font-bold text-blue-600">30%</span>
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
                    "Avalon delivers consistent growth by capitalizing on Bitcoin's inherent price volatility. 
                    <span className="font-bold text-blue-600"> Our proprietary BARS (Bitcoin Adaptive Rebalancing Strategy) </span> 
                    employs a systematic approach, buying Bitcoin below target exposure and selling above it."
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
                                <span>8% optimal rebalancing threshold</span>
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
                                <p className="font-bold text-blue-600 text-lg">27.3% APY</p>
                                <p className="text-blue-700 text-sm">Extractable profits yearly</p>
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
                        <p className="text-slate-600 mt-1">Capital preservation and market signal monitoring</p>
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
                                <span>Dynamic reserves increase near cycle tops</span>
                              </li>
                            </ul>
                          </div>
                          <div>
                            <h5 className="font-bold text-slate-900 mb-3">Market Signal Tracking</h5>
                            <div className="space-y-3">
                              <div className="bg-blue-50 rounded-lg p-4">
                                <p className="font-bold text-blue-600 text-sm">Bitcoin Quantile Model</p>
                                <p className="text-blue-700 text-xs mt-1">Price percentile tracking for timing</p>
                              </div>
                              <div className="bg-purple-50 rounded-lg p-4">
                                <p className="font-bold text-purple-600 text-sm">Funding Rates</p>
                                <p className="text-purple-700 text-xs mt-1">Leverage and sentiment monitoring</p>
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
                    <h3 className="text-2xl font-bold text-slate-900">Comprehensive Risk Management</h3>
                    <p className="text-slate-600">Multi-layered protection for your investment</p>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-6 mb-8">
                  <div className="flex items-start">
                    <Info className="w-6 h-6 text-blue-600 mr-3 mt-1 flex-shrink-0" />
                    <div>
                      <p className="text-lg font-bold text-blue-900 mb-2">Core Risk Principle</p>
                      <p className="text-slate-700 italic">"Return OF capital is more important than return ON capital"</p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
                        <div className="flex items-center text-sm text-blue-700">
                          <CheckCircle className="w-4 h-4 mr-2 flex-shrink-0" />
                          <span>USDC reserves</span>
                        </div>
                        <div className="flex items-center text-sm text-blue-700">
                          <CheckCircle className="w-4 h-4 mr-2 flex-shrink-0" />
                          <span>No leverage</span>
                        </div>
                        <div className="flex items-center text-sm text-blue-700">
                          <CheckCircle className="w-4 h-4 mr-2 flex-shrink-0" />
                          <span>Systematic rules</span>
                        </div>
                        <div className="flex items-center text-sm text-blue-700">
                          <CheckCircle className="w-4 h-4 mr-2 flex-shrink-0" />
                          <span>Diversification</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Protocol Safety */}
                  <div className="border border-slate-200 rounded-xl">
                    <button
                      onClick={() => toggleSection('protocolSafety')}
                      className="w-full flex items-center justify-between p-6 text-left hover:bg-slate-50 rounded-xl transition-colors"
                    >
                      <div className="flex items-center">
                        <Globe className="w-6 h-6 text-green-600 mr-3" />
                        <div>
                          <h4 className="text-xl font-bold text-slate-900">Protocol Safety Framework</h4>
                          <p className="text-slate-600 mt-1">Audited protocols and multi-sig security</p>
                        </div>
                      </div>
                      {expandedSections.protocolSafety ? 
                        <ChevronUp className="w-6 h-6 text-slate-400" /> : 
                        <ChevronDown className="w-6 h-6 text-slate-400" />
                      }
                    </button>
                    {expandedSections.protocolSafety && (
                      <div className="px-6 pb-6">
                        <div className="grid md:grid-cols-2 gap-6">
                          <div>
                            <h5 className="font-bold text-slate-900 mb-4">Approved Protocols</h5>
                            <div className="space-y-3">
                              <div className="flex items-start p-3 bg-green-50 rounded-lg">
                                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 mr-3 flex-shrink-0" />
                                <div>
                                  <p className="font-medium text-green-900">Uniswap V3</p>
                                  <p className="text-sm text-green-700">Audited, $50B+ TVL</p>
                                </div>
                              </div>
                              <div className="flex items-start p-3 bg-green-50 rounded-lg">
                                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 mr-3 flex-shrink-0" />
                                <div>
                                  <p className="font-medium text-green-900">Base Chain</p>
                                  <p className="text-sm text-green-700">Coinbase backed L2</p>
                                </div>
                              </div>
                              <div className="flex items-start p-3 bg-green-50 rounded-lg">
                                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 mr-3 flex-shrink-0" />
                                <div>
                                  <p className="font-medium text-green-900">Circle USDC</p>
                                  <p className="text-sm text-green-700">Regulated, fully audited</p>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div>
                            <h5 className="font-bold text-slate-900 mb-4">What We Avoid</h5>
                            <div className="space-y-2">
                              <div className="flex items-center p-3 bg-red-50 rounded-lg">
                                <X className="w-5 h-5 text-red-600 mr-3" />
                                <span className="text-red-700">New/unaudited protocols</span>
                              </div>
                              <div className="flex items-center p-3 bg-red-50 rounded-lg">
                                <X className="w-5 h-5 text-red-600 mr-3" />
                                <span className="text-red-700">Complex protocol interactions</span>
                              </div>
                              <div className="flex items-center p-3 bg-red-50 rounded-lg">
                                <X className="w-5 h-5 text-red-600 mr-3" />
                                <span className="text-red-700">Lending/borrowing (no leverage)</span>
                              </div>
                              <div className="flex items-center p-3 bg-red-50 rounded-lg">
                                <X className="w-5 h-5 text-red-600 mr-3" />
                                <span className="text-red-700">Unvetted yield farms</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                          <div className="flex items-start">
                            <Lock className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                            <div>
                              <p className="font-bold text-blue-900 mb-2">Multi-Sig Treasury Security</p>
                              <p className="text-sm text-blue-700">3-of-5 multi-signature wallet with geographically distributed key holders including Chief Strategist, Lead Developer, Security Advisor, and future Community Representatives.</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Market Indicators */}
                  <div className="border border-slate-200 rounded-xl">
                    <button
                      onClick={() => toggleSection('marketIndicators')}
                      className="w-full flex items-center justify-between p-6 text-left hover:bg-slate-50 rounded-xl transition-colors"
                    >
                      <div className="flex items-center">
                        <Activity className="w-6 h-6 text-blue-600 mr-3" />
                        <div>
                          <h4 className="text-xl font-bold text-slate-900">Market Signal Monitoring</h4>
                          <p className="text-slate-600 mt-1">Real-time indicators for risk management</p>
                        </div>
                      </div>
                      {expandedSections.marketIndicators ? 
                        <ChevronUp className="w-6 h-6 text-slate-400" /> : 
                        <ChevronDown className="w-6 h-6 text-slate-400" />
                      }
                    </button>
                    {expandedSections.marketIndicators && (
                      <div className="px-6 pb-6">
                        <div className="space-y-6">
                          {/* Funding Rates */}
                          <div>
                            <h5 className="font-bold text-slate-900 mb-3">1. Funding Rates (Trader Sentiment)</h5>
                            <div className="overflow-x-auto">
                              <table className="w-full text-sm">
                                <thead className="bg-slate-100">
                                  <tr>
                                    <th className="px-4 py-3 text-left font-semibold">Rate (8hr)</th>
                                    <th className="px-4 py-3 text-left font-semibold">Interpretation</th>
                                    <th className="px-4 py-3 text-left font-semibold">Action</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200">
                                  <tr className="bg-red-50">
                                    <td className="px-4 py-3 font-medium">&gt; +0.05%</td>
                                    <td className="px-4 py-3">Extreme greed</td>
                                    <td className="px-4 py-3 text-red-700 font-medium">Reduce exposure</td>
                                  </tr>
                                  <tr className="bg-yellow-50">
                                    <td className="px-4 py-3 font-medium">+0.01% to +0.05%</td>
                                    <td className="px-4 py-3">Bullish</td>
                                    <td className="px-4 py-3 text-yellow-700 font-medium">Monitor closely</td>
                                  </tr>
                                  <tr className="bg-green-50">
                                    <td className="px-4 py-3 font-medium">-0.01% to +0.01%</td>
                                    <td className="px-4 py-3">Neutral</td>
                                    <td className="px-4 py-3 text-green-700 font-medium">Normal operations</td>
                                  </tr>
                                  <tr className="bg-blue-50">
                                    <td className="px-4 py-3 font-medium">&lt; -0.01%</td>
                                    <td className="px-4 py-3">Fear</td>
                                    <td className="px-4 py-3 text-blue-700 font-medium">Consider increasing</td>
                                  </tr>
                                  <tr className="bg-cyan-50">
                                    <td className="px-4 py-3 font-medium">&lt; -0.05%</td>
                                    <td className="px-4 py-3">Extreme fear</td>
                                    <td className="px-4 py-3 text-cyan-700 font-medium">Deploy reserves</td>
                                  </tr>
                                </tbody>
                              </table>
                            </div>
                          </div>

                          {/* MVRV Z-Score */}
                          <div>
                            <h5 className="font-bold text-slate-900 mb-3">2. MVRV Z-Score (Market Valuation)</h5>
                            <div className="overflow-x-auto">
                              <table className="w-full text-sm">
                                <thead className="bg-slate-100">
                                  <tr>
                                    <th className="px-4 py-3 text-left font-semibold">Z-Score</th>
                                    <th className="px-4 py-3 text-left font-semibold">Market State</th>
                                    <th className="px-4 py-3 text-left font-semibold">BTC Exposure Target</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200">
                                  <tr className="bg-red-50">
                                    <td className="px-4 py-3 font-medium">&gt; 7</td>
                                    <td className="px-4 py-3">Extremely overheated</td>
                                    <td className="px-4 py-3 text-red-700 font-medium">40-50% BTC</td>
                                  </tr>
                                  <tr className="bg-orange-50">
                                    <td className="px-4 py-3 font-medium">5-7</td>
                                    <td className="px-4 py-3">Overheated</td>
                                    <td className="px-4 py-3 text-orange-700 font-medium">50-60% BTC</td>
                                  </tr>
                                  <tr className="bg-green-50">
                                    <td className="px-4 py-3 font-medium">2-5</td>
                                    <td className="px-4 py-3">Normal range</td>
                                    <td className="px-4 py-3 text-green-700 font-medium">70% BTC (baseline)</td>
                                  </tr>
                                  <tr className="bg-blue-50">
                                    <td className="px-4 py-3 font-medium">0-2</td>
                                    <td className="px-4 py-3">Undervalued</td>
                                    <td className="px-4 py-3 text-blue-700 font-medium">Consider increasing</td>
                                  </tr>
                                  <tr className="bg-cyan-50">
                                    <td className="px-4 py-3 font-medium">&lt; 0</td>
                                    <td className="px-4 py-3">Extremely undervalued</td>
                                    <td className="px-4 py-3 text-cyan-700 font-medium">Up to 80% BTC</td>
                                  </tr>
                                </tbody>
                              </table>
                            </div>
                          </div>

                          {/* Other Indicators */}
                          <div className="grid md:grid-cols-2 gap-4">
                            <div className="p-4 bg-purple-50 rounded-lg">
                              <h6 className="font-bold text-purple-900 mb-2">3. Liquidation Heatmaps</h6>
                              <p className="text-sm text-purple-700 mb-2">Track leveraged position concentrations</p>
                              <ul className="text-xs text-purple-600 space-y-1">
                                <li>• Deploy near major liquidation clusters</li>
                                <li>• Avoid buying into cascades</li>
                                <li>• Wait for stabilization signals</li>
                              </ul>
                            </div>
                            <div className="p-4 bg-indigo-50 rounded-lg">
                              <h6 className="font-bold text-indigo-900 mb-2">4. Bitcoin Dominance</h6>
                              <p className="text-sm text-indigo-700 mb-2">Capital rotation patterns</p>
                              <ul className="text-xs text-indigo-600 space-y-1">
                                <li>• &gt;65%: BTC season (focus BARS)</li>
                                <li>• 50-65%: Mixed market (balanced)</li>
                                <li>• &lt;50%: Alt season (more DeFi)</li>
                              </ul>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Reserve Adequacy */}
                  <div className="border border-slate-200 rounded-xl">
                    <button
                      onClick={() => toggleSection('reserveManagement')}
                      className="w-full flex items-center justify-between p-6 text-left hover:bg-slate-50 rounded-xl transition-colors"
                    >
                      <div className="flex items-center">
                        <Database className="w-6 h-6 text-green-600 mr-3" />
                        <div>
                          <h4 className="text-xl font-bold text-slate-900">Reserve Adequacy Analysis</h4>
                          <p className="text-slate-600 mt-1">Capital buffers for market corrections</p>
                        </div>
                      </div>
                      {expandedSections.reserveManagement ? 
                        <ChevronUp className="w-6 h-6 text-slate-400" /> : 
                        <ChevronDown className="w-6 h-6 text-slate-400" />
                      }
                    </button>
                    {expandedSections.reserveManagement && (
                      <div className="px-6 pb-6">
                        <div className="mb-6">
                          <h5 className="font-bold text-slate-900 mb-3">USDC Reserve Allocation</h5>
                          <div className="grid md:grid-cols-2 gap-4">
                            <div className="p-4 bg-blue-50 rounded-lg">
                              <p className="text-3xl font-bold text-blue-600 mb-1">30%</p>
                              <p className="text-blue-800 font-medium">BARS Strategy Reserves</p>
                              <p className="text-sm text-blue-600 mt-2">For buying crashes and black swan events</p>
                            </div>
                            <div className="p-4 bg-purple-50 rounded-lg">
                              <p className="text-3xl font-bold text-purple-600 mb-1">20%</p>
                              <p className="text-purple-800 font-medium">Liquidity Pool Reserves</p>
                              <p className="text-sm text-purple-600 mt-2">For LP rebalancing and opportunities</p>
                            </div>
                          </div>
                        </div>

                        <div>
                          <h5 className="font-bold text-slate-900 mb-3">Scenario Analysis</h5>
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead className="bg-slate-100">
                                <tr>
                                  <th className="px-4 py-3 text-left font-semibold">Scenario</th>
                                  <th className="px-4 py-3 text-left font-semibold">Reserve Need</th>
                                  <th className="px-4 py-3 text-left font-semibold">Our Reserves</th>
                                  <th className="px-4 py-3 text-left font-semibold">Status</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-200">
                                <tr className="bg-green-50">
                                  <td className="px-4 py-3 font-medium">30% BTC correction</td>
                                  <td className="px-4 py-3">$420K</td>
                                  <td className="px-4 py-3">$600K+</td>
                                  <td className="px-4 py-3">
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                      <CheckCircle className="w-3 h-3 mr-1" />
                                      Covered
                                    </span>
                                  </td>
                                </tr>
                                <tr className="bg-yellow-50">
                                  <td className="px-4 py-3 font-medium">50% BTC crash</td>
                                  <td className="px-4 py-3">$700K</td>
                                  <td className="px-4 py-3">$600K+</td>
                                  <td className="px-4 py-3">
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                      <AlertTriangle className="w-3 h-3 mr-1" />
                                      Partial
                                    </span>
                                  </td>
                                </tr>
                                <tr className="bg-red-50">
                                  <td className="px-4 py-3 font-medium">70% bear market</td>
                                  <td className="px-4 py-3">$980K</td>
                                  <td className="px-4 py-3">$600K+</td>
                                  <td className="px-4 py-3">
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                      <AlertCircle className="w-3 h-3 mr-1" />
                                      Adjust needed
                                    </span>
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        </div>

                        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                          <p className="font-bold text-blue-900 mb-2">Dynamic Reserve Strategy</p>
                          <ul className="text-sm text-blue-700 space-y-1">
                            <li>• Increase reserves to 40-60% near cycle tops</li>
                            <li>• Deploy reserves gradually during crashes</li>
                            <li>• Reduce exposure in overheated markets proactively</li>
                          </ul>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* DeFi Risks */}
                  <div className="border border-slate-200 rounded-xl">
                    <button
                      onClick={() => toggleSection('defiRisks')}
                      className="w-full flex items-center justify-between p-6 text-left hover:bg-slate-50 rounded-xl transition-colors"
                    >
                      <div className="flex items-center">
                        <AlertTriangle className="w-6 h-6 text-orange-600 mr-3" />
                        <div>
                          <h4 className="text-xl font-bold text-slate-900">DeFi-Specific Risk Mitigation</h4>
                          <p className="text-slate-600 mt-1">Smart contract and liquidity protection</p>
                        </div>
                      </div>
                      {expandedSections.defiRisks ? 
                        <ChevronUp className="w-6 h-6 text-slate-400" /> : 
                        <ChevronDown className="w-6 h-6 text-slate-400" />
                      }
                    </button>
                    {expandedSections.defiRisks && (
                      <div className="px-6 pb-6">
                        <div className="grid md:grid-cols-2 gap-6">
                          <div>
                            <h5 className="font-bold text-slate-900 mb-3">Impermanent Loss Protection</h5>
                            <div className="space-y-3">
                              <div className="p-3 bg-slate-50 rounded-lg">
                                <p className="font-medium text-slate-900 text-sm mb-1">Wide Ranges</p>
                                <p className="text-xs text-slate-600">Minimize IL exposure in Uniswap V3</p>
                              </div>
                              <div className="p-3 bg-slate-50 rounded-lg">
                                <p className="font-medium text-slate-900 text-sm mb-1">Fee Compensation</p>
                                <p className="text-xs text-slate-600">Target IL &lt; 5% offset by trading fees</p>
                              </div>
                              <div className="p-3 bg-slate-50 rounded-lg">
                                <p className="font-medium text-slate-900 text-sm mb-1">Regular Rebalancing</p>
                                <p className="text-xs text-slate-600">Adjust positions as market moves</p>
                              </div>
                            </div>
                          </div>
                          <div>
                            <h5 className="font-bold text-slate-900 mb-3">Smart Contract Safety</h5>
                            <div className="space-y-3">
                              <div className="p-3 bg-slate-50 rounded-lg">
                                <p className="font-medium text-slate-900 text-sm mb-1">Protocol Diversification</p>
                                <p className="text-xs text-slate-600">Keep &lt;20% in any single protocol</p>
                              </div>
                              <div className="p-3 bg-slate-50 rounded-lg">
                                <p className="font-medium text-slate-900 text-sm mb-1">Audited Code Only</p>
                                <p className="text-xs text-slate-600">Use battle-tested contracts</p>
                              </div>
                              <div className="p-3 bg-slate-50 rounded-lg">
                                <p className="font-medium text-slate-900 text-sm mb-1">Anomaly Detection</p>
                                <p className="text-xs text-slate-600">24/7 monitoring systems</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Volatility Management */}
                  <div className="border border-slate-200 rounded-xl">
                    <button
                      onClick={() => toggleSection('volatilityMgmt')}
                      className="w-full flex items-center justify-between p-6 text-left hover:bg-slate-50 rounded-xl transition-colors"
                    >
                      <div className="flex items-center">
                        <TrendingDown className="w-6 h-6 text-purple-600 mr-3" />
                        <div>
                          <h4 className="text-xl font-bold text-slate-900">Volatility Management</h4>
                          <p className="text-slate-600 mt-1">Adaptive exposure based on market conditions</p>
                        </div>
                      </div>
                      {expandedSections.volatilityMgmt ? 
                        <ChevronUp className="w-6 h-6 text-slate-400" /> : 
                        <ChevronDown className="w-6 h-6 text-slate-400" />
                      }
                    </button>
                    {expandedSections.volatilityMgmt && (
                      <div className="px-6 pb-6">
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead className="bg-slate-100">
                              <tr>
                                <th className="px-4 py-3 text-left font-semibold">Indicator</th>
                                <th className="px-4 py-3 text-left font-semibold">Low</th>
                                <th className="px-4 py-3 text-left font-semibold">Medium</th>
                                <th className="px-4 py-3 text-left font-semibold">High</th>
                                <th className="px-4 py-3 text-left font-semibold">Extreme</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                              <tr>
                                <td className="px-4 py-3 font-medium">BTC 30-Day Vol</td>
                                <td className="px-4 py-3 bg-green-50">&lt;30%</td>
                                <td className="px-4 py-3 bg-yellow-50">30-50%</td>
                                <td className="px-4 py-3 bg-orange-50">50-80%</td>
                                <td className="px-4 py-3 bg-red-50">&gt;80%</td>
                              </tr>
                              <tr>
                                <td className="px-4 py-3 font-medium">Daily Moves</td>
                                <td className="px-4 py-3 bg-green-50">&lt;3%</td>
                                <td className="px-4 py-3 bg-yellow-50">3-5%</td>
                                <td className="px-4 py-3 bg-orange-50">5-8%</td>
                                <td className="px-4 py-3 bg-red-50">&gt;8%</td>
                              </tr>
                              <tr>
                                <td className="px-4 py-3 font-medium">BTC Exposure</td>
                                <td className="px-4 py-3 bg-green-50">70%</td>
                                <td className="px-4 py-3 bg-yellow-50">60-70%</td>
                                <td className="px-4 py-3 bg-orange-50">50-60%</td>
                                <td className="px-4 py-3 bg-red-50">40-50%</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                        <div className="mt-6 p-4 bg-purple-50 rounded-lg">
                          <p className="font-bold text-purple-900 mb-2">Adaptive Response System</p>
                          <p className="text-sm text-purple-700">Exposure automatically adjusts based on volatility levels to protect capital during extreme market conditions while maintaining optimal positioning during normal markets.</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Emergency Protocols */}
                  <div className="border border-slate-200 rounded-xl">
                    <button
                      onClick={() => toggleSection('emergencyProtocols')}
                      className="w-full flex items-center justify-between p-6 text-left hover:bg-slate-50 rounded-xl transition-colors"
                    >
                      <div className="flex items-center">
                        <AlertCircle className="w-6 h-6 text-red-600 mr-3" />
                        <div>
                          <h4 className="text-xl font-bold text-slate-900">Emergency Protocols</h4>
                          <p className="text-slate-600 mt-1">Crisis management and liquidity safeguards</p>
                        </div>
                      </div>
                      {expandedSections.emergencyProtocols ? 
                        <ChevronUp className="w-6 h-6 text-slate-400" /> : 
                        <ChevronDown className="w-6 h-6 text-slate-400" />
                      }
                    </button>
                    {expandedSections.emergencyProtocols && (
                      <div className="px-6 pb-6">
                        <div className="space-y-6">
                          <div>
                            <h5 className="font-bold text-slate-900 mb-3">Liquidity Crisis Protocol</h5>
                            <div className="p-4 bg-orange-50 rounded-lg">
                              <p className="text-sm text-orange-800 mb-3">
                                In case of severe liquidity crisis where AVA price drops significantly:
                              </p>
                              <ul className="text-sm text-orange-700 space-y-2">
                                <li className="flex items-start">
                                  <span className="font-bold mr-2">1.</span>
                                  <span>Add 5% of total supply as liquidity at 50% price discount</span>
                                </li>
                                <li className="flex items-start">
                                  <span className="font-bold mr-2">2.</span>
                                  <span>Incremental additions every step down</span>
                                </li>
                                <li className="flex items-start">
                                  <span className="font-bold mr-2">3.</span>
                                  <span>Creates strong support levels and buying opportunities</span>
                                </li>
                                <li className="flex items-start">
                                  <span className="font-bold mr-2">4.</span>
                                  <span>Protects long-term holders while maintaining market stability</span>
                                </li>
                              </ul>
                            </div>
                          </div>

                          <div className="grid md:grid-cols-2 gap-4">
                            <div className="p-4 bg-red-50 rounded-lg">
                              <h6 className="font-bold text-red-900 mb-2">Circuit Breakers</h6>
                              <ul className="text-sm text-red-700 space-y-1">
                                <li>• Automatic trading pauses during extreme volatility</li>
                                <li>• Multi-sig approval for large transactions</li>
                                <li>• Time-delayed withdrawals from treasury</li>
                              </ul>
                            </div>
                            <div className="p-4 bg-blue-50 rounded-lg">
                              <h6 className="font-bold text-blue-900 mb-2">Operational Security</h6>
                              <ul className="text-sm text-blue-700 space-y-1">
                                <li>• Hot wallet limits enforced</li>
                                <li>• Cold storage for majority of funds</li>
                                <li>• Regular security audits and penetration testing</li>
                              </ul>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Risk Summary Dashboard */}
              <div className="coinbase-card rounded-2xl p-8">
                <h3 className="text-2xl font-bold mb-6 text-slate-900">Current Risk Status</h3>
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="p-6 bg-green-50 rounded-xl border-2 border-green-200">
                    <div className="flex items-center mb-3">
                      <CheckCircle className="w-6 h-6 text-green-600 mr-2" />
                      <span className="font-bold text-green-900">Low Risk</span>
                    </div>
                    <p className="text-sm text-green-700 mb-2">Protocol Safety</p>
                    <p className="text-xs text-green-600">Audited protocols, multi-sig security</p>
                  </div>
                  <div className="p-6 bg-green-50 rounded-xl border-2 border-green-200">
                    <div className="flex items-center mb-3">
                      <CheckCircle className="w-6 h-6 text-green-600 mr-2" />
                      <span className="font-bold text-green-900">Low Risk</span>
                    </div>
                    <p className="text-sm text-green-700 mb-2">Reserve Coverage</p>
                    <p className="text-xs text-green-600">Adequate for 30% BTC corrections</p>
                  </div>
                  <div className="p-6 bg-yellow-50 rounded-xl border-2 border-yellow-200">
                    <div className="flex items-center mb-3">
                      <AlertTriangle className="w-6 h-6 text-yellow-600 mr-2" />
                      <span className="font-bold text-yellow-900">Monitor</span>
                    </div>
                    <p className="text-sm text-yellow-700 mb-2">Market Volatility</p>
                    <p className="text-xs text-yellow-600">Active monitoring of market indicators</p>
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
                          <p className="text-blue-700 text-sm">70-85% to buybacks</p>
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