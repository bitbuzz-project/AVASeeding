// src/components/PresaleApp.js - UPDATED TO SHOW CONTENT WITHOUT WALLET CONNECTION
import React, { useState, useEffect } from 'react';
import { 
  AlertCircle, 
  Wallet, 
  ArrowRight, 
  CheckCircle, 
  Loader, 
  ExternalLink, 
  ArrowLeft,
  Info,
  Clock,
  TrendingUp,
  Shield,
  Gift,
  Zap
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useWallet } from '../context/WalletContext';
import { ConnectButton } from '@rainbow-me/rainbowkit';

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

// Extended ABIs with functions
const SEEDING_ABI = [
  "function purchaseTokens(uint256 usdcAmount) external",
  "function getQuote(uint256 usdcAmount) external view returns (uint256, uint256, uint256)",
  "function claimBonusTokens() external",
  "function getBonusTokenInfo(address) external view returns (uint256, uint256, bool)",
  "function getBonusPercentage(uint256) external view returns (uint256)",
  "function seedingActive() external view returns (bool)",
  "function totalSold() external view returns (uint256)",
  "function maximumAllocation() external view returns (uint256)",
  "function minimumPurchase() external view returns (uint256)",
  "function purchasedAmount(address) external view returns (uint256)",
  "function getSeedingProgress() external view returns (uint256, uint256, uint256)",
  "function getParticipantCount() external view returns (uint256)",
  "function getBonusTiers() external view returns (tuple(uint256,uint256)[])",
  "event TokensPurchased(address indexed buyer, uint256 usdcAmount, uint256 avalonAmount)",
  "event BonusTokensGranted(address indexed buyer, uint256 bonusAmount, uint256 vestingTime)",
  "event BonusTokensClaimed(address indexed buyer, uint256 amount)"
];

const USDC_ABI = [
  "function balanceOf(address) external view returns (uint256)",
  "function approve(address, uint256) external returns (bool)",
  "function allowance(address, address) external view returns (uint256)",
  "function getTestTokens() external",
  "function decimals() external view returns (uint8)"
];

const AVA_ABI = [
  "function balanceOf(address) external view returns (uint256)"
];

// Volume Bonus Tiers from Whitepaper
const BONUS_TIERS = [
  { min: 0, max: 2000, bonus: 0, label: "No Bonus" },
  { min: 2000, max: 5000, bonus: 1, label: "1% Bonus" },
  { min: 5000, max: 10000, bonus: 2, label: "2% Bonus" },
  { min: 10000, max: 20000, bonus: 3, label: "3% Bonus" },
  { min: 20000, max: 40000, bonus: 4, label: "4% Bonus" },
  { min: 40000, max: 60000, bonus: 6, label: "6% Bonus" },
  { min: 60000, max: Infinity, bonus: 8, label: "8% Bonus" }
];

function PresaleApp() {
  // Get wallet state from context
  const {
    account,
    provider,
    signer,
    isConnected,
    connectWallet,
    isLoading: walletLoading,
    error: walletError,
    success: walletSuccess,
    setError: setWalletError,
    setSuccess: setWalletSuccess
  } = useWallet();

  // Contract instances
  const [usdcContract, setUsdcContract] = useState(null);
  const [avaContract, setAvaContract] = useState(null);
  const [seedingContract, setSeedingContract] = useState(null);
  
  // Amounts
  const [baseAmount, setBaseAmount] = useState('0');
  const [bonusAmount, setBonusAmount] = useState('0');
  const [usdcAmount, setUsdcAmount] = useState('');
  const [avaAmount, setAvaAmount] = useState('0');
  
  // Balances
  const [usdcBalance, setUsdcBalance] = useState('0');
  const [avaBalance, setAvaBalance] = useState('0');
  
  // Project stats
  const [totalSold, setTotalSold] = useState('0');
  const [maxAllocation, setMaxAllocation] = useState('0');
  const [progressPercent, setProgressPercent] = useState(0);
  const [userPurchased, setUserPurchased] = useState('0');
  const [seedingActive, setSeedingActive] = useState(false);
  const [minimumPurchase, setMinimumPurchase] = useState('0');
  const [participantCount, setParticipantCount] = useState(0);

  // Transaction state
  const [isLoading, setIsLoading] = useState(false);
  const [txHash, setTxHash] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Bonus tokens state
  const [bonusTokenInfo, setBonusTokenInfo] = useState({
    vestingAmount: '0',
    releaseTime: 0,
    canClaim: false
  });

  // Helper function to calculate bonus rate from amount
  const getBonusRate = (amount) => {
    const amountNum = parseFloat(amount) || 0;
    const tier = BONUS_TIERS.find(t => amountNum >= t.min && amountNum < t.max);
    return tier ? tier.bonus / 100 : 0;
  };

  // Helper function to get current tier info
  const getCurrentTier = (amount) => {
    const amountNum = parseFloat(amount) || 0;
    return BONUS_TIERS.find(t => amountNum >= t.min && amountNum < t.max) || BONUS_TIERS[0];
  };

  // Helper function to get next tier info
  const getNextTier = (amount) => {
    const amountNum = parseFloat(amount) || 0;
    const currentTierIndex = BONUS_TIERS.findIndex(t => amountNum >= t.min && amountNum < t.max);
    return currentTierIndex < BONUS_TIERS.length - 1 ? BONUS_TIERS[currentTierIndex + 1] : null;
  };

  // Initialize contracts with error handling
  useEffect(() => {
    if (signer && isConnected && ethers) {
      try {
        const usdc = new ethers.Contract(CONTRACTS.USDC, USDC_ABI, signer);
        const ava = new ethers.Contract(CONTRACTS.AVA, AVA_ABI, signer);
        const seeding = new ethers.Contract(CONTRACTS.SEEDING, SEEDING_ABI, signer);

        setUsdcContract(usdc);
        setAvaContract(ava);
        setSeedingContract(seeding);
      } catch (error) {
        setError('Failed to initialize contracts: ' + error.message);
      }
    }
  }, [signer, isConnected]);

  // Load contract data (works without wallet for public info)
  const loadData = async () => {
    // Always load public contract data using a public provider
    try {
      if (!ethers || !window.ethereum) return;
      
      const publicProvider = new ethers.BrowserProvider(window.ethereum);
      const seedingPublic = new ethers.Contract(CONTRACTS.SEEDING, SEEDING_ABI, publicProvider);
      
      const [
        sold,
        maxAlloc,
        active,
        minPurch,
        progress,
        participants
      ] = await Promise.all([
        seedingPublic.totalSold(),
        seedingPublic.maximumAllocation(),
        seedingPublic.seedingActive(),
        seedingPublic.minimumPurchase(),
        seedingPublic.getSeedingProgress(),
        seedingPublic.getParticipantCount()
      ]);

      setTotalSold(ethers.formatEther(sold));
      setMaxAllocation(ethers.formatEther(maxAlloc));
      setSeedingActive(active);
      setMinimumPurchase(ethers.formatEther(minPurch));
      setProgressPercent(Number(progress[2]));
      setParticipantCount(Number(participants));

      // If connected, also load user-specific data
      if (isConnected && account && usdcContract && avaContract && seedingContract) {
        const [
          usdcBal,
          avaBal,
          userPurch
        ] = await Promise.all([
          usdcContract.balanceOf(account),
          avaContract.balanceOf(account),
          seedingContract.purchasedAmount(account)
        ]);

        setUsdcBalance(ethers.formatUnits(usdcBal, 6));
        setAvaBalance(ethers.formatEther(avaBal));
        setUserPurchased(ethers.formatEther(userPurch));
      }

    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  // Load bonus token info (only when connected)
  const loadBonusTokenInfo = async () => {
    if (!seedingContract || !account || !ethers || !isConnected) return;
    
    try {
      const [vestingAmount, releaseTime, canClaim] = await seedingContract.getBonusTokenInfo(account);
      setBonusTokenInfo({
        vestingAmount: ethers.formatEther(vestingAmount),
        releaseTime: Number(releaseTime),
        canClaim
      });
    } catch (error) {
      console.error('Error loading bonus token info:', error);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 15000);
    return () => clearInterval(interval);
  }, [isConnected, usdcContract, account]);

  useEffect(() => {
    if (isConnected) {
      loadBonusTokenInfo();
      const interval = setInterval(loadBonusTokenInfo, 15000);
      return () => clearInterval(interval);
    }
  }, [isConnected, seedingContract, account]);

  // Calculate AVA amount with bonus
  useEffect(() => {
    if (usdcAmount && seedingContract && parseFloat(usdcAmount) > 0 && ethers) {
      const calculateAva = async () => {
        try {
          const usdcWei = ethers.parseUnits(usdcAmount, 6);
          const [baseTokens, bonusTokens, totalTokens] = await seedingContract.getQuote(usdcWei);
          
          setAvaAmount(ethers.formatEther(totalTokens));
          setBaseAmount(ethers.formatEther(baseTokens));
          setBonusAmount(ethers.formatEther(bonusTokens));
          
        } catch (error) {
          console.error('Error calculating AVA amount:', error);
          setAvaAmount('0');
          setBaseAmount('0');
          setBonusAmount('0');
        }
      };
      calculateAva();
    } else {
      setAvaAmount('0');
      setBaseAmount('0');
      setBonusAmount('0');
    }
  }, [usdcAmount, seedingContract]);

  // Get test USDC
  const getTestUSDC = async () => {
    if (!isConnected) {
      setError('Please connect your wallet first');
      return;
    }

    try {
      setIsLoading(true);
      setError('');
      
      const tx = await usdcContract.getTestTokens();
      setTxHash(tx.hash);
      await tx.wait();
      
      setSuccess('Successfully received 1,000 test USDC!');
      loadData();
    } catch (error) {
      setError('Failed to get test USDC: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Purchase tokens
  const purchaseTokens = async () => {
    if (!isConnected) {
      setError('Please connect your wallet first');
      return;
    }

    try {
      setIsLoading(true);
      setError('');
      setSuccess('');

      if (!usdcAmount || parseFloat(usdcAmount) <= 0) {
        throw new Error('Please enter a valid USDC amount');
      }

      const usdcWei = ethers.parseUnits(usdcAmount, 6);

      // Check allowance
      const allowance = await usdcContract.allowance(account, CONTRACTS.SEEDING);
      if (allowance < usdcWei) {
        setSuccess('Step 1/2: Approving USDC...');
        const approveTx = await usdcContract.approve(CONTRACTS.SEEDING, usdcWei);
        setTxHash(approveTx.hash);
        await approveTx.wait();
      }

      // Purchase tokens
      setSuccess('Step 2/2: Purchasing AVA tokens...');
      const purchaseTx = await seedingContract.purchaseTokens(usdcWei);
      
      setTxHash(purchaseTx.hash);
      await purchaseTx.wait();

      const bonusRate = getBonusRate(usdcAmount);
      const hasBonusText = bonusRate > 0 ? ` (including ${(bonusRate * 100).toFixed(1)}% bonus)` : '';
      
      setSuccess(`Successfully purchased ${parseFloat(avaAmount).toFixed(2)} AVA tokens${hasBonusText}!`);
      setUsdcAmount('');
      loadData();
      loadBonusTokenInfo();

    } catch (error) {
      setError('Purchase failed: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Claim bonus tokens
  const claimBonusTokens = async () => {
    if (!isConnected) {
      setError('Please connect your wallet first');
      return;
    }

    try {
      setIsLoading(true);
      setError('');
      
      const tx = await seedingContract.claimBonusTokens();
      setTxHash(tx.hash);
      await tx.wait();
      
      setSuccess(`Successfully claimed ${parseFloat(bonusTokenInfo.vestingAmount).toFixed(2)} bonus AVA tokens!`);
      loadData();
      loadBonusTokenInfo();
    } catch (error) {
      setError('Failed to claim bonus tokens: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const formatNumber = (num, decimals = 2) => {
    return new Intl.NumberFormat().format(parseFloat(num).toFixed(decimals));
  };

  const formatDate = (timestamp) => {
    if (!timestamp || timestamp === 0) return 'No vesting tokens';
    return new Date(timestamp * 1000).toLocaleString();
  };

  const getDaysUntilClaim = (timestamp) => {
    if (!timestamp || timestamp === 0) return null;
    const now = Date.now();
    const releaseDate = timestamp * 1000;
    const daysLeft = Math.ceil((releaseDate - now) / (1000 * 60 * 60 * 24));
    return daysLeft > 0 ? daysLeft : 0;
  };

  // Auto-clear messages
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  useEffect(() => {
    if (txHash) {
      const timer = setTimeout(() => setTxHash(''), 10000);
      return () => clearTimeout(timer);
    }
  }, [txHash]);

  const displayError = error || walletError;
  const displaySuccess = success || walletSuccess;
  const displayLoading = isLoading || walletLoading;

  const currentTier = getCurrentTier(usdcAmount);
  const nextTier = getNextTier(usdcAmount);
  const daysUntilClaim = getDaysUntilClaim(bonusTokenInfo.releaseTime);

  return (
    <div className="coinbase-bg text-slate-900 font-inter min-h-screen">
      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8 max-w-7xl">
        
        {/* Back to Dashboard Link */}
        <div className="mb-4 sm:mb-6">
          <Link
            to="/"
            className="inline-flex items-center text-slate-600 hover:text-slate-900 transition-colors text-sm sm:text-base"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
        </div>

        {/* Header */}
        <div className="text-center mb-8 sm:mb-12 px-2">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold mb-3 sm:mb-4 coinbase-title leading-tight">
            AVALON TOKEN SALE
          </h1>
          <p className="text-lg sm:text-xl coinbase-subtitle mb-2">Harnessing Volatility for Steady Returns</p>
          <div className="flex items-center justify-center gap-2 text-base sm:text-lg">
            <span className="text-blue-600 font-medium">87.5% Allocation</span>
            <span className="text-slate-400">•</span>
            <span className="text-green-600 font-medium">Up to 8% Volume Bonus</span>
            <span className="text-slate-400">•</span>
            <span className="text-purple-600 font-medium">60-Day Vesting</span>
          </div>
        </div>

        {/* Connection Status - Show different message based on connection */}
        <div className="max-w-4xl mx-auto mb-6 sm:mb-8">
          {!isConnected ? (
            <div className="coinbase-card rounded-xl sm:rounded-2xl p-6 sm:p-8 border-2 border-blue-200 bg-blue-50">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Wallet className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="text-center sm:text-left">
                    <h3 className="text-lg font-bold text-slate-900">Connect to Purchase Tokens</h3>
                    <p className="text-sm text-slate-600">Connect your wallet to participate in the token sale</p>
                  </div>
                </div>
                <div className="rainbow-connect-wrapper">
                  <ConnectButton />
                </div>
              </div>
            </div>
          ) : (
            <div className="coinbase-card border-green-200 bg-green-50 rounded-xl sm:rounded-2xl p-3 sm:p-4 text-center">
              <div className="flex items-center justify-center">
                <CheckCircle className="w-5 sm:w-6 h-5 sm:h-6 mr-3 text-green-600" />
                <span className="text-green-800 font-semibold text-sm sm:text-base">
                  Connected: {account.slice(0, 6)}...{account.slice(-4)}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* ALWAYS SHOW CONTENT - No conditional rendering based on connection */}
        <>
          {/* Progress Section */}
          <div className="max-w-4xl mx-auto mb-6 sm:mb-8">
            <div className="coinbase-card rounded-xl sm:rounded-2xl p-4 sm:p-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl sm:text-2xl font-bold text-slate-900">Token Sale Progress</h3>
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${
                  seedingActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  <div className={`w-2 h-2 rounded-full ${seedingActive ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <span className="text-sm font-semibold">{seedingActive ? 'Active' : 'Inactive'}</span>
                </div>
              </div>
              
              <div className="bg-slate-200 rounded-full h-2 sm:h-3 mb-4 sm:mb-6">
                <div
                  className="progress-bar h-2 sm:h-3 rounded-full transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                ></div>
              </div>
              
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                <div className="text-center">
                  <p className="text-slate-500 font-medium mb-1 text-xs sm:text-sm">Tokens Sold</p>
                  <p className="text-lg sm:text-xl font-bold text-slate-900">{formatNumber(totalSold)}</p>
                  <p className="text-xs sm:text-sm text-slate-500">AVA</p>
                </div>
                <div className="text-center">
                  <p className="text-slate-500 font-medium mb-1 text-xs sm:text-sm">Total Allocation</p>
                  <p className="text-lg sm:text-xl font-bold text-slate-900">{formatNumber(maxAllocation)}</p>
                  <p className="text-xs sm:text-sm text-slate-500">AVA (87.5%)</p>
                </div>
                <div className="text-center">
                  <p className="text-slate-500 font-medium mb-1 text-xs sm:text-sm">Progress</p>
                  <p className="text-lg sm:text-xl font-bold text-blue-600">{progressPercent}%</p>
                </div>
                <div className="text-center">
                  <p className="text-slate-500 font-medium mb-1 text-xs sm:text-sm">Participants</p>
                  <p className="text-lg sm:text-xl font-bold text-purple-600">{participantCount}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Balance Cards - Only show if connected */}
          {isConnected && (
            <div className="max-w-4xl mx-auto mb-6 sm:mb-8">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                <div className="balance-card rounded-xl sm:rounded-2xl p-4 sm:p-6 text-center">
                  <div className="w-10 sm:w-12 h-10 sm:h-12 mx-auto mb-3 sm:mb-4 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-green-600 font-bold text-base sm:text-lg">$</span>
                  </div>
                  <h3 className="text-base sm:text-lg font-semibold mb-2 text-slate-700">Your USDC</h3>
                  <p className="text-2xl sm:text-3xl font-bold text-green-600 mb-3 sm:mb-4">{formatNumber(usdcBalance)}</p>
                  <button
                    onClick={getTestUSDC}
                    disabled={displayLoading}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 sm:px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 text-sm sm:text-base w-full sm:w-auto min-h-[2.5rem]"
                  >
                    Get Test USDC
                  </button>
                </div>
                
                <div className="balance-card rounded-xl sm:rounded-2xl p-4 sm:p-6 text-center">
                  <div className="w-10 sm:w-12 h-10 sm:h-12 mx-auto mb-3 sm:mb-4 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-bold text-base sm:text-lg">A</span>
                  </div>
                  <h3 className="text-base sm:text-lg font-semibold mb-2 text-slate-700">Your AVA Balance</h3>
                  <p className="text-2xl sm:text-3xl font-bold text-blue-600">{formatNumber(avaBalance)}</p>
                </div>
                
                <div className="balance-card rounded-xl sm:rounded-2xl p-4 sm:p-6 text-center">
                  <div className="w-10 sm:w-12 h-10 sm:h-12 mx-auto mb-3 sm:mb-4 bg-cyan-100 rounded-full flex items-center justify-center">
                    <span className="text-cyan-600 font-bold text-base sm:text-lg">P</span>
                  </div>
                  <h3 className="text-base sm:text-lg font-semibold mb-2 text-slate-700">Total Purchased</h3>
                  <p className="text-2xl sm:text-3xl font-bold text-cyan-600">{formatNumber(userPurchased)}</p>
                </div>
              </div>
            </div>
          )}

          {/* Bonus Token Vesting Section - Only show if connected and has bonus */}
          {isConnected && parseFloat(bonusTokenInfo.vestingAmount) > 0 && (
            <div className="max-w-4xl mx-auto mb-6 sm:mb-8">
              <div className="coinbase-card rounded-xl sm:rounded-2xl p-4 sm:p-6 border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-blue-50">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                    <Gift className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-xl font-bold text-slate-900">Bonus Token Vesting</h3>
                    <p className="text-sm text-slate-600">60-day vesting period for volume bonuses</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-white/80 rounded-xl">
                    <p className="text-sm text-purple-600 font-medium mb-1">Vesting Amount</p>
                    <p className="text-2xl font-bold text-purple-700">{formatNumber(bonusTokenInfo.vestingAmount)} AVA</p>
                  </div>
                  
                  <div className="text-center p-4 bg-white/80 rounded-xl">
                    <p className="text-sm text-blue-600 font-medium mb-1">
                      {bonusTokenInfo.canClaim ? 'Ready to Claim!' : 'Release Date'}
                    </p>
                    <p className="text-sm font-medium text-blue-700">
                      {formatDate(bonusTokenInfo.releaseTime)}
                    </p>
                    {daysUntilClaim !== null && daysUntilClaim > 0 && (
                      <div className="flex items-center justify-center gap-1 mt-2 text-blue-600">
                        <Clock className="w-4 h-4" />
                        <span className="text-xs font-semibold">{daysUntilClaim} days left</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="text-center p-4 bg-white/80 rounded-xl">
                    <button
                      onClick={claimBonusTokens}
                      disabled={!bonusTokenInfo.canClaim || displayLoading}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:bg-slate-300 text-sm w-full flex items-center justify-center gap-2"
                    >
                      {bonusTokenInfo.canClaim ? (
                        <>
                          <CheckCircle className="w-4 h-4" />
                          Claim Bonus
                        </>
                      ) : (
                        <>
                          <Clock className="w-4 h-4" />
                          Still Vesting
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Purchase Interface */}
          <div className="max-w-2xl mx-auto mb-6 sm:mb-8">
            <div className="coinbase-card rounded-xl sm:rounded-2xl p-4 sm:p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-xl sm:text-2xl font-bold text-slate-900">Purchase AVA Tokens</h3>
                  <p className="text-sm text-slate-600">1 USDC = 1 AVA + Volume Bonus</p>
                </div>
              </div>
              
              <div className="space-y-4 sm:space-y-6">
                <div>
                  <label className="block text-sm font-semibold mb-2 sm:mb-3 text-slate-700">USDC Amount</label>
                  <input
                    type="number"
                    value={usdcAmount}
                    onChange={(e) => setUsdcAmount(e.target.value)}
                    placeholder="Enter USDC amount"
                    className="coinbase-input w-full rounded-xl px-3 sm:px-4 py-3 sm:py-4 text-slate-900 placeholder-slate-400 text-base sm:text-lg min-h-[3rem]"
                    disabled={!seedingActive || displayLoading || !isConnected}
                  />
                  <div className="flex justify-between items-center mt-2 text-xs text-slate-500">
                    <span>Minimum: {formatNumber(minimumPurchase)} USDC</span>
                    {isConnected && (
                      <button
                        onClick={() => setUsdcAmount(usdcBalance)}
                        className="text-blue-600 hover:text-blue-800 font-medium"
                      >
                        Max: {formatNumber(usdcBalance)}
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-center py-2 sm:py-4">
                  <div className="w-8 sm:w-10 h-8 sm:h-10 bg-slate-100 rounded-full flex items-center justify-center">
                    <ArrowRight className="w-4 sm:w-5 h-4 sm:h-5 text-slate-600" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2 sm:mb-3 text-slate-700">
                    AVA Tokens You'll Receive
                  </label>
                  <input
                    type="text"
                    value={formatNumber(avaAmount)}
                    readOnly
                    className="coinbase-input w-full rounded-xl px-3 sm:px-4 py-3 sm:py-4 text-slate-900 text-base sm:text-lg bg-slate-50 min-h-[3rem]"
                  />
                </div>

                {/* Volume Bonus Tier Display */}
                {parseFloat(usdcAmount) > 0 && (
                  <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-4 border-2 border-purple-200">
                    <div className="flex items-center gap-2 mb-3">
                      <TrendingUp className="w-5 h-5 text-purple-600" />
                      <h4 className="font-bold text-purple-900 text-sm sm:text-base">Volume Bonus Tier</h4>
                    </div>
                    
                    {/* Current Tier Highlight */}
                    <div className="bg-white rounded-lg p-3 mb-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-slate-600">Current Tier</p>
                          <p className="text-lg font-bold text-purple-700">{currentTier.label}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-slate-600">You Get</p>
                          <p className="text-lg font-bold text-green-600">
                            {formatNumber(avaAmount)} AVA
                          </p>
                        </div>
                      </div>
                      
                      {parseFloat(bonusAmount) > 0 && (
                        <div className="mt-2 pt-2 border-t border-slate-200 grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <p className="text-slate-600">Base:</p>
                            <p className="font-semibold text-slate-800">{formatNumber(baseAmount)} AVA</p>
                          </div>
                          <div>
                            <p className="text-slate-600">Bonus ({currentTier.bonus}%):</p>
                            <p className="font-semibold text-purple-700">{formatNumber(bonusAmount)} AVA</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Next Tier Info */}
                    {nextTier && (
                      <div className="bg-blue-100 rounded-lg p-2 text-xs">
                        <p className="text-blue-800">
                          <span className="font-semibold">Next Tier:</span> Invest ${formatNumber(nextTier.min)} for {nextTier.bonus}% bonus
                          (${formatNumber(nextTier.min - parseFloat(usdcAmount))} more needed)
                        </p>
                      </div>
                    )}

                    {/* All Tiers Reference */}
                    <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {BONUS_TIERS.filter(t => t.bonus > 0).map((tier, idx) => (
                        <div
                          key={idx}
                          className={`p-2 rounded text-xs text-center ${
                            parseFloat(usdcAmount) >= tier.min && parseFloat(usdcAmount) < tier.max
                              ? 'bg-green-600 text-white'
                              : 'bg-white text-slate-600'
                          }`}
                        >
                          <p className="font-semibold">${formatNumber(tier.min, 0)}+</p>
                          <p>{tier.bonus}%</p>
                        </div>
                      ))}
                    </div>

                    {/* Vesting Notice */}
                    {parseFloat(bonusAmount) > 0 && (
                      <div className="mt-3 p-2 bg-amber-50 rounded-lg border border-amber-200">
                        <div className="flex items-start gap-2">
                          <Info className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                          <p className="text-xs text-amber-800">
                            <span className="font-semibold">Bonus Vesting:</span> {formatNumber(bonusAmount)} AVA will vest over 60 days to support buyback liquidity
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Rate Display */}
                <div className="bg-blue-50 rounded-xl p-3 sm:p-4 text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Shield className="w-5 h-5 text-blue-600" />
                    <p className="text-blue-800 font-semibold text-sm sm:text-base">Base Rate: 1 USDC = 1 AVA</p>
                  </div>
                  {parseFloat(usdcAmount) >= parseFloat(minimumPurchase) && (
                    <p className="text-blue-600 text-xs">
                      Minimum purchase met ✓
                    </p>
                  )}
                </div>

                {/* Purchase Button */}
                <button
                  onClick={purchaseTokens}
                  disabled={!seedingActive || displayLoading || !usdcAmount || parseFloat(usdcAmount) <= 0 || !isConnected}
                  className="coinbase-btn w-full text-white py-4 sm:py-5 rounded-xl font-bold text-base sm:text-lg disabled:opacity-50 disabled:cursor-not-allowed min-h-[3rem] sm:min-h-[3.5rem]"
                >
                  {!isConnected ? (
                    'Connect Wallet to Purchase'
                  ) : displayLoading ? (
                    <span className="flex items-center justify-center">
                      <Loader className="w-4 sm:w-5 h-4 sm:h-5 mr-3 animate-spin" />
                      Processing...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      Purchase AVA Tokens
                      {parseFloat(bonusAmount) > 0 && (
                        <span className="text-xs bg-white/20 px-2 py-1 rounded">
                          +{currentTier.bonus}% Bonus
                        </span>
                      )}
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Status Messages */}
          {displayError && (
            <div className="max-w-2xl mx-auto mb-4">
              <div className="error-msg rounded-xl p-3 sm:p-4 flex items-start">
                <AlertCircle className="w-4 sm:w-5 h-4 sm:h-5 mr-3 flex-shrink-0 mt-0.5" />
                <span className="font-medium text-sm sm:text-base">{displayError}</span>
              </div>
            </div>
          )}

          {displaySuccess && (
            <div className="max-w-2xl mx-auto mb-4">
              <div className="success-msg rounded-xl p-3 sm:p-4 flex items-start">
                <CheckCircle className="w-4 sm:w-5 h-4 sm:h-5 mr-3 flex-shrink-0 mt-0.5" />
                <span className="font-medium text-sm sm:text-base">{displaySuccess}</span>
              </div>
            </div>
          )}

          {txHash && (
            <div className="max-w-2xl mx-auto mb-4">
              <div className="coinbase-card rounded-xl p-3 sm:p-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <span className="font-medium text-slate-700 text-sm sm:text-base">Transaction Hash:</span>
                  <a
                    href={`https://sepolia.basescan.org/tx/${txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 flex items-center font-medium font-mono text-xs sm:text-sm break-all"
                  >
                    {txHash.slice(0, 8)}...{txHash.slice(-6)}
                    <ExternalLink className="w-3 sm:w-4 h-3 sm:h-4 ml-2 flex-shrink-0" />
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* Key Features Section */}
          <div className="max-w-4xl mx-auto mb-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-4 border border-blue-200">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-blue-600" />
                  </div>
                  <h4 className="font-bold text-blue-900">Volume Bonuses</h4>
                </div>
                <p className="text-sm text-blue-800">Up to 8% bonus on purchases over $60K</p>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-200">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <Clock className="w-4 h-4 text-purple-600" />
                  </div>
                  <h4 className="font-bold text-purple-900">60-Day Vesting</h4>
                </div>
                <p className="text-sm text-purple-800">Bonus tokens vest to support buyback program</p>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <Shield className="w-4 h-4 text-green-600" />
                  </div>
                  <h4 className="font-bold text-green-900">No Inflation</h4>
                </div>
                <p className="text-sm text-green-800">Fixed 5M supply, 8% sell tax mechanism</p>
              </div>
            </div>
          </div>

          {/* Contract Addresses */}
          <div className="max-w-4xl mx-auto">
            <div className="coinbase-card rounded-xl sm:rounded-2xl p-4 sm:p-8">
              <h3 className="text-lg sm:text-xl font-bold mb-4 sm:mb-6 text-slate-900">Contract Addresses (Base Sepolia)</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
                <div className="bg-slate-50 rounded-xl p-3 sm:p-4">
                  <p className="text-slate-600 font-medium mb-2 text-sm sm:text-base">AVA Token:</p>
                  <p className="font-mono text-xs sm:text-sm text-slate-900 break-all bg-white p-2 rounded border">{CONTRACTS.AVA}</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-3 sm:p-4">
                  <p className="text-slate-600 font-medium mb-2 text-sm sm:text-base">USDC Token:</p>
                  <p className="font-mono text-xs sm:text-sm text-slate-900 break-all bg-white p-2 rounded border">{CONTRACTS.USDC}</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-3 sm:p-4">
                  <p className="text-slate-600 font-medium mb-2 text-sm sm:text-base">Seeding Contract:</p>
                  <p className="font-mono text-xs sm:text-sm text-slate-900 break-all bg-white p-2 rounded border">{CONTRACTS.SEEDING}</p>
                </div>
              </div>
            </div>
          </div>
        </>
      </div>
    </div>
  );
}

export default PresaleApp;