// src/components/PresaleApp.js - UPDATED WITH NEW CONTRACT AND MULTIPLE-USE REFERRAL CODES
import React, { useState, useEffect } from 'react';
import { AlertCircle, Wallet, ArrowRight, CheckCircle, Loader, ExternalLink, ArrowLeft, Gift, Users, Copy, Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useWallet } from '../context/WalletContext';

// Dynamically import ethers to avoid SSR issues
let ethers;
if (typeof window !== 'undefined') {
  ethers = require('ethers');
}

// UPDATED CONTRACT ADDRESSES
const CONTRACTS = {
  USDC: '0xd6842B6CfF83784aD53ef9a838F041ac2c337659',
  AVA: '0xA25Fd0C9906d124792b6F1909d3F3b52A4fb98aE',
  SEEDING: '0x19CC5bE61a46b66a668fF641FAFa98a5b1805612' // NEW CONTRACT ADDRESS
};

// UPDATED SEEDING ABI with new referral functions
const SEEDING_ABI = [
  "function purchaseTokens(uint256 usdcAmount) external",
  "function purchaseTokensWithReferral(uint256 usdcAmount, string calldata referralCode) external",
  "function getQuote(uint256 usdcAmount) external pure returns (uint256)",
  "function getQuoteWithReferral(uint256 usdcAmount) external pure returns (uint256, uint256, uint256)",
  "function seedingActive() external view returns (bool)",
  "function totalSold() external view returns (uint256)",
  "function maximumAllocation() external view returns (uint256)",
  "function minimumPurchase() external view returns (uint256)",
  "function purchasedAmount(address) external view returns (uint256)",
  "function getSeedingProgress() external view returns (uint256, uint256, uint256)",
  // UPDATED: New referral functions (multiple uses)
  "function isValidReferralCode(string) external view returns (bool)",
  "function getCodeUsageInfo(string) external view returns (address, uint256, uint256, uint256)",
  "function referralCodeToOwner(string) external view returns (address)"
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

  // Presale state
  const [usdcAmount, setUsdcAmount] = useState('');
  const [avaAmount, setAvaAmount] = useState('0');
  const [usdcBalance, setUsdcBalance] = useState('0');
  const [avaBalance, setAvaBalance] = useState('0');
  const [totalSold, setTotalSold] = useState('0');
  const [maxAllocation, setMaxAllocation] = useState('0');
  const [progressPercent, setProgressPercent] = useState(0);
  const [userPurchased, setUserPurchased] = useState('0');
  const [seedingActive, setSeedingActive] = useState(false);
  const [minimumPurchase, setMinimumPurchase] = useState('0');

  // UPDATED: Referral state for multiple uses
  const [referralCode, setReferralCode] = useState('');
  const [isValidCode, setIsValidCode] = useState(false);
  const [referralBonus, setReferralBonus] = useState('0');
  const [codeOwner, setCodeOwner] = useState('');
  const [codeUsageInfo, setCodeUsageInfo] = useState(null);

  // Transaction state
  const [isLoading, setIsLoading] = useState(false);
  const [txHash, setTxHash] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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

  // Load contract data
  const loadData = async () => {
    if (!seedingContract || !usdcContract || !avaContract || !account || !ethers) return;

    try {
      const [
        usdcBal,
        avaBal,
        sold,
        maxAlloc,
        userPurch,
        active,
        minPurch,
        progress
      ] = await Promise.all([
        usdcContract.balanceOf(account),
        avaContract.balanceOf(account),
        seedingContract.totalSold(),
        seedingContract.maximumAllocation(),
        seedingContract.purchasedAmount(account),
        seedingContract.seedingActive(),
        seedingContract.minimumPurchase(),
        seedingContract.getSeedingProgress()
      ]);

      setUsdcBalance(ethers.formatUnits(usdcBal, 6));
      setAvaBalance(ethers.formatEther(avaBal));
      setTotalSold(ethers.formatEther(sold));
      setMaxAllocation(ethers.formatEther(maxAlloc));
      setUserPurchased(ethers.formatEther(userPurch));
      setSeedingActive(active);
      setMinimumPurchase(ethers.formatEther(minPurch));
      setProgressPercent(Number(progress[2]));

    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  useEffect(() => {
    if (isConnected) {
      loadData();
      const interval = setInterval(loadData, 15000); // Update every 15s
      return () => clearInterval(interval);
    }
  }, [isConnected, seedingContract, account]);

  // Calculate AVA amount when USDC input changes
  useEffect(() => {
    if (usdcAmount && seedingContract && parseFloat(usdcAmount) > 0 && ethers) {
      const calculateAva = async () => {
        try {
          const usdcWei = ethers.parseUnits(usdcAmount, 6);
          const avaWei = await seedingContract.getQuote(usdcWei);
          const baseAva = ethers.formatEther(avaWei);
          setAvaAmount(baseAva);
          
          // Calculate referral bonus (3% extra tokens)
          if (isValidCode) {
            const bonus = parseFloat(baseAva) * 0.03;
            setReferralBonus(bonus.toString());
          } else {
            setReferralBonus('0');
          }
        } catch (error) {
          console.error('Error calculating AVA amount:', error);
          setAvaAmount('0');
          setReferralBonus('0');
        }
      };
      calculateAva();
    } else {
      setAvaAmount('0');
      setReferralBonus('0');
    }
  }, [usdcAmount, seedingContract, isValidCode]);

  // UPDATED: Validate referral code for multiple uses
  const validateReferralCode = async (code) => {
    if (!code || !seedingContract) {
      setIsValidCode(false);
      setCodeOwner('');
      setCodeUsageInfo(null);
      return;
    }

    try {
      console.log('🔍 Validating code:', code);
      console.log('🔍 Current account:', account);
      
      // Check if code is valid on-chain
      const isValid = await seedingContract.isValidReferralCode(code);
      console.log('🔍 isValidReferralCode result:', isValid);
      
      if (isValid) {
        // Get code owner
        const owner = await seedingContract.referralCodeToOwner(code);
        console.log('🔍 Code owner:', owner);
        
        // Get detailed usage info: (owner, usageCount, totalVolume, lastUsedTimestamp)
        const [detailOwner, usageCount, totalVolume, lastUsedTimestamp] = 
          await seedingContract.getCodeUsageInfo(code);
        
        const usageInfo = {
          owner: detailOwner,
          usageCount: Number(usageCount),
          totalVolume: ethers.formatUnits(totalVolume, 6),
          lastUsedTimestamp: Number(lastUsedTimestamp),
          lastUsedDate: Number(lastUsedTimestamp) > 0 ? 
            new Date(Number(lastUsedTimestamp) * 1000).toLocaleDateString() : 'Never used'
        };
        
        console.log('🔍 Code usage info:', usageInfo);
        
        // Check if user is trying to use their own code
        if (owner.toLowerCase() === account.toLowerCase()) {
          setError(`❌ You cannot use your own referral code "${code}".`);
          setIsValidCode(false);
          setCodeOwner('');
          setCodeUsageInfo(null);
          return;
        }
        
        // Code is valid and user can use it
        setIsValidCode(true);
        setCodeOwner(owner);
        setCodeUsageInfo(usageInfo);
        setError('');
        setSuccess(`✅ Referral code "${code}" is valid! You'll get 3% extra tokens. This code has been used ${usageInfo.usageCount} times before.`);
        
      } else {
        // Code doesn't exist
        setError(`❌ Code "${code}" does not exist. Make sure it was generated correctly.`);
        setIsValidCode(false);
        setCodeOwner('');
        setCodeUsageInfo(null);
      }
    } catch (error) {
      console.error('❌ Error validating referral code:', error);
      setIsValidCode(false);
      setCodeOwner('');
      setCodeUsageInfo(null);
      setError('Error validating referral code: ' + error.message);
    }
  };

  // Handle referral code input
  const handleReferralCodeChange = (e) => {
    const code = e.target.value;
    setReferralCode(code);
    
    if (code.length >= 3) {
      validateReferralCode(code);
    } else {
      setIsValidCode(false);
      setCodeOwner('');
      setCodeUsageInfo(null);
    }
  };

  // Get test USDC
  const getTestUSDC = async () => {
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

  // UPDATED: Purchase tokens with or without referral (multiple uses allowed)
  const purchaseTokens = async () => {
    try {
      setIsLoading(true);
      setError('');
      setSuccess('');

      if (!usdcAmount || parseFloat(usdcAmount) <= 0) {
        throw new Error('Please enter a valid USDC amount');
      }

      const usdcWei = ethers.parseUnits(usdcAmount, 6);
      const baseAvaWei = ethers.parseEther(avaAmount);

      // Check minimum purchase
      if (baseAvaWei < ethers.parseEther(minimumPurchase)) {
        throw new Error(`Minimum purchase is ${minimumPurchase} AVA tokens`);
      }

      // Check allowance
      const allowance = await usdcContract.allowance(account, CONTRACTS.SEEDING);
      if (allowance < usdcWei) {
        setSuccess('Step 1/2: Approving USDC...');
        const approveTx = await usdcContract.approve(CONTRACTS.SEEDING, usdcWei);
        setTxHash(approveTx.hash);
        await approveTx.wait();
      }

      // Purchase tokens (with or without referral)
      setSuccess('Step 2/2: Purchasing AVA tokens...');
      let purchaseTx;
      
      if (isValidCode && referralCode) {
        // Purchase with referral code (multiple uses allowed)
        purchaseTx = await seedingContract.purchaseTokensWithReferral(usdcWei, referralCode);
        setSuccess(`Purchasing with referral code "${referralCode}"...`);
      } else {
        // Regular purchase
        purchaseTx = await seedingContract.purchaseTokens(usdcWei);
      }
      
      setTxHash(purchaseTx.hash);
      await purchaseTx.wait();

      const totalTokens = parseFloat(avaAmount) + parseFloat(referralBonus);
      let successMessage = `Successfully purchased ${totalTokens.toFixed(6)} AVA tokens!`;
      
      if (isValidCode) {
        successMessage += ` (Including 3% bonus)`;
        if (codeUsageInfo) {
          successMessage += ` 🎉 This code has now been used ${codeUsageInfo.usageCount + 1} times!`;
        }
      }
      
      setSuccess(successMessage);
      setUsdcAmount('');
      setReferralCode('');
      setIsValidCode(false);
      setCodeOwner('');
      setCodeUsageInfo(null);
      loadData();

    } catch (error) {
      setError('Purchase failed: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat().format(parseFloat(num).toFixed(2));
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

  return (
    <div className="coinbase-bg text-slate-900 font-inter min-h-screen">
      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8 max-w-7xl">
        
        {/* Back to Dashboard Link - Mobile Optimized */}
        <div className="mb-4 sm:mb-6">
          <Link
            to="/"
            className="inline-flex items-center text-slate-600 hover:text-slate-900 transition-colors text-sm sm:text-base"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Link>
        </div>

        {/* Header - Mobile Optimized */}
        <div className="text-center mb-8 sm:mb-12 px-2">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold mb-3 sm:mb-4 coinbase-title leading-tight">
            AVALON TOKEN PRESALE
          </h1>
          <p className="text-lg sm:text-xl coinbase-subtitle mb-2">Harnessing Volatility for Steady Returns</p>
          <p className="text-base sm:text-lg text-blue-600 font-medium">Presale on Base Testnet</p>
        </div>

        {/* Connection Status - Mobile Optimized */}
        <div className="max-w-4xl mx-auto mb-6 sm:mb-8">
          {!isConnected ? (
            <div className="coinbase-card rounded-xl sm:rounded-2xl p-6 sm:p-8 text-center">
              <div className="w-12 sm:w-16 h-12 sm:h-16 mx-auto mb-4 sm:mb-6 bg-blue-100 rounded-full flex items-center justify-center">
                <Wallet className="w-6 sm:w-8 h-6 sm:h-8 text-blue-600" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold mb-2 sm:mb-3 text-slate-900">Connect Your Wallet</h3>
              <p className="text-slate-600 mb-4 sm:mb-6 text-base sm:text-lg px-2">Connect MetaMask to Base Testnet to participate in the presale</p>
              <button
                onClick={connectWallet}
                disabled={displayLoading}
                className="coinbase-btn text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-semibold text-base sm:text-lg disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center w-full sm:w-auto justify-center min-h-[3rem] sm:min-h-[3.5rem]"
              >
                {displayLoading ? (
                  <>
                    <Loader className="w-4 sm:w-5 h-4 sm:h-5 mr-3 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Wallet className="w-4 sm:w-5 h-4 sm:h-5 mr-3" />
                    Connect MetaMask
                  </>
                )}
              </button>
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

        {isConnected && (
          <>
            {/* Progress Section - Mobile Optimized */}
            <div className="max-w-4xl mx-auto mb-6 sm:mb-8">
              <div className="coinbase-card rounded-xl sm:rounded-2xl p-4 sm:p-8">
                <h3 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-slate-900">Presale Progress</h3>
                <div className="bg-slate-200 rounded-full h-2 sm:h-3 mb-4 sm:mb-6">
                  <div
                    className="progress-bar h-2 sm:h-3 rounded-full transition-all duration-500"
                    style={{ width: `${progressPercent}%` }}
                  ></div>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                  <div className="text-center">
                    <p className="text-slate-500 font-medium mb-1 text-xs sm:text-sm">Sold</p>
                    <p className="text-lg sm:text-xl font-bold text-slate-900">{formatNumber(totalSold)}</p>
                    <p className="text-xs sm:text-sm text-slate-500">AVA</p>
                  </div>
                  <div className="text-center">
                    <p className="text-slate-500 font-medium mb-1 text-xs sm:text-sm">Total</p>
                    <p className="text-lg sm:text-xl font-bold text-slate-900">{formatNumber(maxAllocation)}</p>
                    <p className="text-xs sm:text-sm text-slate-500">AVA</p>
                  </div>
                  <div className="text-center">
                    <p className="text-slate-500 font-medium mb-1 text-xs sm:text-sm">Progress</p>
                    <p className="text-lg sm:text-xl font-bold text-blue-600">{progressPercent}%</p>
                  </div>
                  <div className="text-center">
                    <p className="text-slate-500 font-medium mb-1 text-xs sm:text-sm">Status</p>
                    <p className={`text-lg sm:text-xl font-bold ${seedingActive ? 'text-green-600' : 'text-red-500'}`}>
                      {seedingActive ? 'Active' : 'Inactive'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Balance Cards - Mobile Optimized */}
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
                  <h3 className="text-base sm:text-lg font-semibold mb-2 text-slate-700">Your AVA</h3>
                  <p className="text-2xl sm:text-3xl font-bold text-blue-600">{formatNumber(avaBalance)}</p>
                </div>
                
                <div className="balance-card rounded-xl sm:rounded-2xl p-4 sm:p-6 text-center">
                  <div className="w-10 sm:w-12 h-10 sm:h-12 mx-auto mb-3 sm:mb-4 bg-cyan-100 rounded-full flex items-center justify-center">
                    <span className="text-cyan-600 font-bold text-base sm:text-lg">P</span>
                  </div>
                  <h3 className="text-base sm:text-lg font-semibold mb-2 text-slate-700">You Purchased</h3>
                  <p className="text-2xl sm:text-3xl font-bold text-cyan-600">{formatNumber(userPurchased)}</p>
                </div>
              </div>
            </div>

            {/* UPDATED: Referral Section - Multiple Uses */}
            <div className="max-w-2xl mx-auto mb-6 sm:mb-8">
              <div className="coinbase-card rounded-xl sm:rounded-2xl p-4 sm:p-6">
                <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-4 flex items-center">
                  <Gift className="w-5 h-5 mr-2 text-purple-600" />
                  Have a Referral Code?
                </h3>

                <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4 mb-4">
                  <div className="flex items-center mb-2">
                    <Users className="w-4 h-4 text-purple-600 mr-2" />
                    <span className="font-medium text-purple-800">Get 3% Extra Tokens! (Unlimited Uses)</span>
                  </div>
                  <p className="text-purple-700 text-sm">
                    If someone shared their referral code with you, enter it below to receive 3% bonus tokens. 
                    <span className="font-medium"> Codes can be used multiple times!</span>
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Referral Code (Optional)
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={referralCode}
                      onChange={handleReferralCodeChange}
                      placeholder="Enter referral code (e.g., AVA1a2b3c1)"
                      className={`coinbase-input w-full rounded-xl px-3 sm:px-4 py-3 text-slate-900 placeholder-slate-400 text-base sm:text-lg min-h-[3rem] ${
                        isValidCode ? 'border-green-500 bg-green-50' :
                        referralCode && !isValidCode ? 'border-red-500 bg-red-50' : ''
                      }`}
                      disabled={displayLoading}
                    />
                    {isValidCode && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      </div>
                    )}
                  </div>
                  
                  {/* UPDATED: Code validation messages for multiple uses */}
                  {isValidCode && codeUsageInfo && (
                    <div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-200">
                      <p className="text-green-600 text-sm flex items-center mb-2">
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Valid code! You'll get 3% extra tokens ({formatNumber(referralBonus)} AVA)
                      </p>
                      <div className="grid grid-cols-2 gap-2 text-xs text-green-700">
                        <div>
                          <span className="font-medium">Times used:</span> {codeUsageInfo.usageCount}
                        </div>
                        <div>
                          <span className="font-medium">Total volume:</span> ${formatNumber(codeUsageInfo.totalVolume)}
                        </div>
                        <div className="col-span-2">
                          <span className="font-medium">Last used:</span> {codeUsageInfo.lastUsedDate}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {referralCode && !isValidCode && (
                    <p className="text-red-600 text-sm mt-2">
                      Invalid referral code or you cannot use your own code
                    </p>
                  )}
                </div>

                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-blue-800 text-sm">
                    💡 <strong>Need a referral code?</strong> Ask someone who already invested in Avalon to generate one for you in their dashboard!
                    <span className="block mt-1 font-medium">✨ Codes can be used multiple times - share freely!</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Purchase Interface - Mobile Optimized */}
            <div className="max-w-2xl mx-auto mb-6 sm:mb-8">
              <div className="coinbase-card rounded-xl sm:rounded-2xl p-4 sm:p-8">
                <h3 className="text-xl sm:text-2xl font-bold mb-6 sm:mb-8 text-slate-900">Purchase AVA Tokens</h3>
                
                <div className="space-y-4 sm:space-y-6">
                  <div>
                    <label className="block text-sm font-semibold mb-2 sm:mb-3 text-slate-700">USDC Amount</label>
                    <input
                      type="number"
                      value={usdcAmount}
                      onChange={(e) => setUsdcAmount(e.target.value)}