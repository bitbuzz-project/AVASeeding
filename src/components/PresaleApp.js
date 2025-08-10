// src/components/PresaleApp.js - UPDATED WITH REFERRAL SYSTEM
import React, { useState, useEffect } from 'react';
import { AlertCircle, Wallet, ArrowRight, CheckCircle, Loader, ExternalLink, ArrowLeft, Gift, Users, Copy, Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useWallet } from '../context/WalletContext';

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

// Predefined referral codes (10 codes for big investors)
const REFERRAL_CODES = [
  'AVALON2025',
  'VOLATILITY',
  'BMERS2025',
  'BASECHAIN',
  'STRATEGY1',
  'PRESALE01',
  'INVESTOR',
  'TOPWHALE',
  'AVAX2025',
  'REWARDS3'
];

// Extended ABIs with referral functions
const SEEDING_ABI = [
  "function purchaseTokens(uint256 usdcAmount) external",
  "function purchaseTokensWithReferral(uint256 usdcAmount, string calldata referralCode) external",
  "function getQuote(uint256 usdcAmount) external pure returns (uint256)",
  "function seedingActive() external view returns (bool)",
  "function totalSold() external view returns (uint256)",
  "function maximumAllocation() external view returns (uint256)",
  "function minimumPurchase() external view returns (uint256)",
  "function purchasedAmount(address) external view returns (uint256)",
  "function getSeedingProgress() external view returns (uint256, uint256, uint256)",
  "function getReferralStats(string calldata code) external view returns (uint256, uint256)",
  "function isValidReferralCode(string calldata code) external view returns (bool)"
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

  // Referral state
  const [referralCode, setReferralCode] = useState('');
  const [isValidCode, setIsValidCode] = useState(false);
  const [referralBonus, setReferralBonus] = useState('0');
  const [showReferralSection, setShowReferralSection] = useState(false);
  const [copiedCode, setCopiedCode] = useState('');

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

  // Validate referral code
  const validateReferralCode = async (code) => {
    if (!code || !seedingContract) {
      setIsValidCode(false);
      return;
    }

    try {
      // Check if code exists in our predefined list
      const codeExists = REFERRAL_CODES.includes(code.toUpperCase());
      
      // In a real implementation, you would check on-chain:
      // const isValid = await seedingContract.isValidReferralCode(code);
      
      setIsValidCode(codeExists);
      
      if (codeExists) {
        setSuccess(`Referral code "${code}" applied! You'll get 3% extra tokens.`);
      } else {
        setError(`Invalid referral code: "${code}"`);
      }
    } catch (error) {
      console.error('Error validating referral code:', error);
      setIsValidCode(false);
    }
  };

  // Handle referral code input
  const handleReferralCodeChange = (e) => {
    const code = e.target.value.toUpperCase();
    setReferralCode(code);
    
    if (code.length >= 3) {
      validateReferralCode(code);
    } else {
      setIsValidCode(false);
    }
  };

  // Copy referral code to clipboard
  const copyToClipboard = async (code) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(''), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
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

  // Purchase tokens with or without referral
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
        // Purchase with referral code
        purchaseTx = await seedingContract.purchaseTokensWithReferral(usdcWei, referralCode);
        setSuccess(`Purchasing with referral code "${referralCode}"...`);
      } else {
        // Regular purchase
        purchaseTx = await seedingContract.purchaseTokens(usdcWei);
      }
      
      setTxHash(purchaseTx.hash);
      await purchaseTx.wait();

      const totalTokens = parseFloat(avaAmount) + parseFloat(referralBonus);
      setSuccess(`Successfully purchased ${totalTokens.toFixed(6)} AVA tokens!${isValidCode ? ' (Including 3% bonus)' : ''}`);
      setUsdcAmount('');
      setReferralCode('');
      setIsValidCode(false);
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

            {/* Referral Section - NEW */}
            <div className="max-w-2xl mx-auto mb-6 sm:mb-8">
              <div className="coinbase-card rounded-xl sm:rounded-2xl p-4 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center">
                    <Gift className="w-5 h-5 mr-2 text-purple-600" />
                    Referral Program
                  </h3>
                  <button
                    onClick={() => setShowReferralSection(!showReferralSection)}
                    className="text-purple-600 hover:text-purple-700 font-medium text-sm"
                  >
                    {showReferralSection ? 'Hide' : 'Show'} Codes
                  </button>
                </div>

                <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4 mb-4">
                  <div className="flex items-center mb-2">
                    <Users className="w-4 h-4 text-purple-600 mr-2" />
                    <span className="font-medium text-purple-800">Get 3% Extra Tokens!</span>
                  </div>
                  <p className="text-purple-700 text-sm">
                    Enter a valid referral code to receive 3% bonus AVA tokens on your purchase.
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Referral Code (Optional)
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={referralCode}
                        onChange={handleReferralCodeChange}
                        placeholder="Enter referral code"
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
                    {isValidCode && (
                      <p className="text-green-600 text-sm mt-2 flex items-center">
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Valid code! You'll get 3% extra tokens ({formatNumber(referralBonus)} AVA)
                      </p>
                    )}
                  </div>

                  {/* Available Referral Codes - Show/Hide */}
                  {showReferralSection && (
                    <div className="bg-slate-50 rounded-lg p-4">
                      <h4 className="font-medium text-slate-800 mb-3">Available Referral Codes:</h4>
                      <div className="grid grid-cols-2 gap-2">
                        {REFERRAL_CODES.map((code, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between bg-white rounded-lg p-2 border"
                          >
                            <span className="font-mono text-sm text-slate-700">{code}</span>
                            <button
                              onClick={() => copyToClipboard(code)}
                              className="text-blue-600 hover:text-blue-700 p-1"
                              title="Copy code"
                            >
                              {copiedCode === code ? (
                                <Check className="w-4 h-4 text-green-600" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-slate-500 mt-2">
                        💡 These codes are provided for testing. In production, codes would be given to qualified investors.
                      </p>
                    </div>
                  )}
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
                      placeholder="Enter USDC amount"
                      className="coinbase-input w-full rounded-xl px-3 sm:px-4 py-3 sm:py-4 text-slate-900 placeholder-slate-400 text-base sm:text-lg min-h-[3rem]"
                      disabled={!seedingActive || displayLoading}
                    />
                  </div>

                  <div className="flex items-center justify-center py-2 sm:py-4">
                    <div className="w-8 sm:w-10 h-8 sm:h-10 bg-slate-100 rounded-full flex items-center justify-center">
                      <ArrowRight className="w-4 sm:w-5 h-4 sm:h-5 text-slate-600" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-2 sm:mb-3 text-slate-700">AVA Tokens You'll Receive</label>
                    <input
                      type="text"
                      value={formatNumber(avaAmount)}
                      readOnly
                      className="coinbase-input w-full rounded-xl px-3 sm:px-4 py-3 sm:py-4 text-slate-900 text-base sm:text-lg bg-slate-50 min-h-[3rem]"
                    />
                    {isValidCode && parseFloat(referralBonus) > 0 && (
                      <div className="mt-2 p-3 bg-green-50 rounded-lg border border-green-200">
                        <div className="flex items-center justify-between">
                          <span className="text-green-700 font-medium text-sm">Referral Bonus (3%):</span>
                          <span className="text-green-800 font-bold">{formatNumber(referralBonus)} AVA</span>
                        </div>
                        <div className="flex items-center justify-between mt-1 pt-2 border-t border-green-200">
                          <span className="text-green-800 font-bold">Total Tokens:</span>
                          <span className="text-green-800 font-bold">
                            {formatNumber((parseFloat(avaAmount) + parseFloat(referralBonus)).toString())} AVA
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="bg-blue-50 rounded-xl p-3 sm:p-4 text-center">
                    <p className="text-blue-800 font-medium text-sm sm:text-base">Rate: 1 USDC = 1 AVA</p>
                    <p className="text-blue-600 text-xs sm:text-sm mt-1">Minimum: {formatNumber(minimumPurchase)} AVA</p>
                    {isValidCode && (
                      <p className="text-green-700 text-xs sm:text-sm mt-1 font-medium">
                        + 3% bonus with referral code "{referralCode}"
                      </p>
                    )}
                  </div>

                  <button
                    onClick={purchaseTokens}
                    disabled={!seedingActive || displayLoading || !usdcAmount || parseFloat(usdcAmount) <= 0}
                    className="coinbase-btn w-full text-white py-4 sm:py-5 rounded-xl font-bold text-base sm:text-lg disabled:opacity-50 disabled:cursor-not-allowed min-h-[3rem] sm:min-h-[3.5rem]"
                  >
                    {displayLoading ? (
                      <span className="flex items-center justify-center">
                        <Loader className="w-4 sm:w-5 h-4 sm:h-5 mr-3 animate-spin" />
                        Processing...
                      </span>
                    ) : (
                      `Purchase AVA Tokens${isValidCode ? ' (+ 3% Bonus)' : ''}`
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Status Messages - Mobile Optimized */}
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

            {/* Referral Program Explanation */}
            <div className="max-w-4xl mx-auto mb-6 sm:mb-8">
              <div className="coinbase-card rounded-xl sm:rounded-2xl p-4 sm:p-8">
                <h3 className="text-lg sm:text-xl font-bold mb-4 sm:mb-6 text-slate-900 flex items-center">
                  <Gift className="w-5 h-5 mr-2 text-purple-600" />
                  How the Referral Program Works
                </h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-purple-600 font-bold text-sm">1</span>
                      </div>
                      <div>
                        <h4 className="font-medium text-slate-900">Get a Referral Code</h4>
                        <p className="text-slate-600 text-sm">Qualified investors receive unique referral codes to share with their network.</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-purple-600 font-bold text-sm">2</span>
                      </div>
                      <div>
                        <h4 className="font-medium text-slate-900">Share Your Code</h4>
                        <p className="text-slate-600 text-sm">Share your referral code with friends and colleagues interested in Avalon.</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-green-600 font-bold text-sm">3</span>
                      </div>
                      <div>
                        <h4 className="font-medium text-slate-900">Earn Rewards</h4>
                        <p className="text-slate-600 text-sm">Earn 5% of USDC invested by users with your code.</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-green-600 font-bold text-sm">4</span>
                      </div>
                      <div>
                        <h4 className="font-medium text-slate-900">Bonus Tokens</h4>
                        <p className="text-slate-600 text-sm">Code users get 3% extra AVA tokens instantly.</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-6 p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg">
                  <p className="text-purple-800 font-medium text-center">
                    🎯 Win-Win: Referrers earn USDC rewards, users get bonus tokens!
                  </p>
                </div>
              </div>
            </div>

            {/* Contract Addresses - Mobile Optimized */}
            <div className="max-w-4xl mx-auto">
              <div className="coinbase-card rounded-xl sm:rounded-2xl p-4 sm:p-8">
                <h3 className="text-lg sm:text-xl font-bold mb-4 sm:mb-6 text-slate-900">Contract Addresses (Base Testnet)</h3>
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
        )}
      </div>
    </div>
  );
}

export default PresaleApp;