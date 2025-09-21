// src/components/SwapPage.js - Updated with Official Uniswap V3 Router
import React, { useState, useEffect } from 'react';
import { 
  ArrowDownUp, 
  ArrowLeft, 
  ExternalLink, 
  AlertCircle, 
  CheckCircle, 
  Loader, 
  Settings, 
  Info 
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useWallet } from '../context/WalletContext';

// Dynamically import ethers
let ethers;
if (typeof window !== 'undefined') {
  ethers = require('ethers');
}

// Contract addresses - UPDATED WITH OFFICIAL ROUTER
const CONTRACTS = {
  USDC: '0xd6842B6CfF83784aD53ef9a838F041ac2c337659',
  AVA: '0xA25Fd0C9906d124792b6F1909d3F3b52A4fb98aE',
  POOL: '0x0dEeC152be4087a613DB966CC85082E6BeAde1bF',
  // 🎯 OFFICIAL UNISWAP V3 SWAPROUTER ON BASE SEPOLIA
  SWAP_ROUTER: '0x94cC0AaC535CCDB3C01d6787D6413C739ae12bc4'
};

// Contract ABIs
const ERC20_ABI = [
  "function balanceOf(address) external view returns (uint256)",
  "function approve(address, uint256) external returns (bool)",
  "function allowance(address, address) external view returns (uint256)",
  "function getTestTokens() external"
];

const POOL_ABI = [
  "function fee() external view returns (uint24)",
  "function slot0() external view returns (uint160, int24, uint16, uint16, uint16, uint8, bool)",
  "function liquidity() external view returns (uint128)",
  "function token0() external view returns (address)",
  "function token1() external view returns (address)"
];

// Official Uniswap V3 SwapRouter ABI
const SWAP_ROUTER_ABI = [
  {
    "inputs": [
      {
        "components": [
          {"name": "tokenIn", "type": "address"},
          {"name": "tokenOut", "type": "address"},
          {"name": "fee", "type": "uint24"},
          {"name": "recipient", "type": "address"},
          {"name": "deadline", "type": "uint256"},
          {"name": "amountIn", "type": "uint256"},
          {"name": "amountOutMinimum", "type": "uint256"},
          {"name": "sqrtPriceLimitX96", "type": "uint160"}
        ],
        "name": "params",
        "type": "tuple"
      }
    ],
    "name": "exactInputSingle",
    "outputs": [{"name": "amountOut", "type": "uint256"}],
    "stateMutability": "payable",
    "type": "function"
  }
];

function SwapPage() {
  const { account, signer, isConnected, connectWallet } = useWallet();
  
  // Contract instances
  const [usdcContract, setUsdcContract] = useState(null);
  const [avaContract, setAvaContract] = useState(null);
  const [poolContract, setPoolContract] = useState(null);
  const [swapRouter, setSwapRouter] = useState(null);

  // Swap state
  const [tokenIn, setTokenIn] = useState('USDC');
  const [tokenOut, setTokenOut] = useState('AVA');
  const [amountIn, setAmountIn] = useState('');
  const [amountOut, setAmountOut] = useState('');
  
  // Data state
  const [balances, setBalances] = useState({
    userUsdc: '0',
    userAva: '0',
    poolUsdc: '0',
    poolAva: '0'
  });

  const [poolInfo, setPoolInfo] = useState({
    fee: '3000',
    currentPrice: 1.0,
    liquidity: '0'
  });
  
  // UI state
  const [slippageTolerance, setSlippageTolerance] = useState('2.0');
  const [showSettings, setShowSettings] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isQuoting, setIsQuoting] = useState(false);
  const [txHash, setTxHash] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Initialize contracts
  useEffect(() => {
    if (signer && isConnected && ethers) {
      try {
        setUsdcContract(new ethers.Contract(CONTRACTS.USDC, ERC20_ABI, signer));
        setAvaContract(new ethers.Contract(CONTRACTS.AVA, ERC20_ABI, signer));
        setPoolContract(new ethers.Contract(CONTRACTS.POOL, POOL_ABI, signer));
        setSwapRouter(new ethers.Contract(CONTRACTS.SWAP_ROUTER, SWAP_ROUTER_ABI, signer));
      } catch (error) {
        setError('Failed to initialize contracts: ' + error.message);
      }
    }
  }, [signer, isConnected]);

  // Load data
  const loadData = async () => {
    if (!usdcContract || !avaContract || !poolContract || !account || !ethers) return;

    try {
      const [userUsdc, userAva, poolUsdc, poolAva, fee, slot0, liquidity] = await Promise.all([
        usdcContract.balanceOf(account),
        avaContract.balanceOf(account),
        usdcContract.balanceOf(CONTRACTS.POOL),
        avaContract.balanceOf(CONTRACTS.POOL),
        poolContract.fee(),
        poolContract.slot0(),
        poolContract.liquidity()
      ]);

      const newBalances = {
        userUsdc: ethers.formatUnits(userUsdc, 6),
        userAva: ethers.formatEther(userAva),
        poolUsdc: ethers.formatUnits(poolUsdc, 6),
        poolAva: ethers.formatEther(poolAva)
      };

      setBalances(newBalances);

      // Calculate price from pool balances (simplified for 1:1 pools)
      const currentPrice = parseFloat(newBalances.poolUsdc) / parseFloat(newBalances.poolAva) || 1.0;

      setPoolInfo({
        fee: fee.toString(),
        currentPrice,
        liquidity: liquidity.toString()
      });

    } catch (error) {
      console.error('Error loading data:', error);
      setError('Failed to load data');
    }
  };

  // Load data on mount and interval
  useEffect(() => {
    if (isConnected && usdcContract) {
      loadData();
      const interval = setInterval(loadData, 10000);
      return () => clearInterval(interval);
    }
  }, [isConnected, usdcContract, account]);

  // Simple quote calculation
  const getQuote = async (inputAmount) => {
    if (!inputAmount || parseFloat(inputAmount) <= 0) {
      setAmountOut('');
      return;
    }

    try {
      setIsQuoting(true);
      
      const poolUsdcBalance = parseFloat(balances.poolUsdc);
      const poolAvaBalance = parseFloat(balances.poolAva);
      
      if (poolUsdcBalance === 0 || poolAvaBalance === 0) {
        setAmountOut('0');
        return;
      }

      const inputAmountFloat = parseFloat(inputAmount);
      let outputAmount = 0;
      
      if (tokenIn === 'USDC' && tokenOut === 'AVA') {
        // USDC to AVA: Apply constant product formula
        const fee = parseInt(poolInfo.fee) / 1000000; // Convert to decimal
        const inputAfterFee = inputAmountFloat * (1 - fee);
        outputAmount = (inputAfterFee * poolAvaBalance) / (poolUsdcBalance + inputAfterFee);
      } else if (tokenIn === 'AVA' && tokenOut === 'USDC') {
        // AVA to USDC
        const fee = parseInt(poolInfo.fee) / 1000000;
        const inputAfterFee = inputAmountFloat * (1 - fee);
        outputAmount = (inputAfterFee * poolUsdcBalance) / (poolAvaBalance + inputAfterFee);
      }

      setAmountOut(outputAmount.toFixed(6));
      
    } catch (error) {
      console.error('Quote error:', error);
      setAmountOut('0');
    } finally {
      setIsQuoting(false);
    }
  };

  // Quote when amount changes
  useEffect(() => {
    if (amountIn) {
      const timeoutId = setTimeout(() => getQuote(amountIn), 500);
      return () => clearTimeout(timeoutId);
    } else {
      setAmountOut('');
    }
  }, [amountIn, tokenIn, tokenOut, poolInfo.fee, balances]);

  // Swap tokens
  const swapTokens = () => {
    setTokenIn(tokenOut);
    setTokenOut(tokenIn);
    setAmountIn('');
    setAmountOut('');
  };

  const getTestTokens = async (symbol) => {
    if (!usdcContract || !avaContract) return;
    
    try {
      setIsLoading(true);
      setError('');
      
      const contract = symbol === 'USDC' ? usdcContract : avaContract;
      const tx = await contract.getTestTokens();
      setTxHash(tx.hash);
      await tx.wait();
      
      setSuccess(`Got test ${symbol}!`);
      loadData();
    } catch (error) {
      setError(`Failed to get ${symbol}: ` + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Execute swap with Official Uniswap V3 Router
  const executeSwap = async () => {
    try {
      setIsLoading(true);
      setError('');
      setSuccess('');

      if (!amountIn || !amountOut || parseFloat(amountIn) <= 0) {
        throw new Error('Invalid amounts');
      }

      if (!swapRouter) {
        throw new Error('Swap router not initialized');
      }

      const tokenInAddr = tokenIn === 'USDC' ? CONTRACTS.USDC : CONTRACTS.AVA;
      const tokenOutAddr = tokenOut === 'USDC' ? CONTRACTS.USDC : CONTRACTS.AVA;
      const tokenInContract = tokenIn === 'USDC' ? usdcContract : avaContract;

      const amountInWei = tokenIn === 'USDC' 
        ? ethers.parseUnits(amountIn, 6)
        : ethers.parseEther(amountIn);

      // Conservative slippage calculation
      const slippageMultiplier = 1 - (parseFloat(slippageTolerance) / 100);
      const amountOutMinimum = tokenOut === 'USDC'
        ? ethers.parseUnits((parseFloat(amountOut) * slippageMultiplier).toString(), 6)
        : ethers.parseEther((parseFloat(amountOut) * slippageMultiplier).toString());

      console.log('Official Uniswap V3 Swap:', {
        tokenIn,
        tokenOut,
        amountIn,
        amountOut,
        slippageTolerance,
        amountOutMinimum: tokenOut === 'USDC' ? ethers.formatUnits(amountOutMinimum, 6) : ethers.formatEther(amountOutMinimum)
      });

      // Check balance
      const balance = await tokenInContract.balanceOf(account);
      if (balance < amountInWei) {
        throw new Error(`Insufficient ${tokenIn} balance`);
      }

      // Check and approve
      const currentAllowance = await tokenInContract.allowance(account, CONTRACTS.SWAP_ROUTER);
      if (currentAllowance < amountInWei) {
        setSuccess('Step 1/2: Approving tokens...');
        const approveTx = await tokenInContract.approve(CONTRACTS.SWAP_ROUTER, amountInWei);
        setTxHash(approveTx.hash);
        await approveTx.wait();
      }

      // Execute swap with official Uniswap V3 router
      setSuccess('Step 2/2: Executing swap with official Uniswap V3 router...');
      
      const swapParams = {
        tokenIn: tokenInAddr,
        tokenOut: tokenOutAddr,
        fee: 3000, // 0.3%
        recipient: account,
        deadline: Math.floor(Date.now() / 1000) + 1800, // 30 minutes
        amountIn: amountInWei,
        amountOutMinimum: amountOutMinimum,
        sqrtPriceLimitX96: 0 // No price limit
      };

      const swapTx = await swapRouter.exactInputSingle(swapParams);
      
      setTxHash(swapTx.hash);
      await swapTx.wait();
      
      setSuccess(`🎉 OFFICIAL UNISWAP SWAP EXECUTED! ${amountIn} ${tokenIn} → ${tokenOut}`);
      setAmountIn('');
      setAmountOut('');
      
      // Reload data to see the new price
      setTimeout(loadData, 2000);

    } catch (error) {
      setError('Swap failed: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper functions
  const formatNumber = (num, decimals = 4) => {
    const number = parseFloat(num);
    if (number === 0) return '0';
    if (number < 0.0001) return '< 0.0001';
    return number.toLocaleString(undefined, { 
      minimumFractionDigits: 0, 
      maximumFractionDigits: decimals 
    });
  };

  const getUserBalance = (symbol) => {
    return symbol === 'USDC' ? balances.userUsdc : balances.userAva;
  };

  const setMaxAmount = () => {
    const balance = getUserBalance(tokenIn);
    setAmountIn(balance);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <Link
            to="/"
            className="inline-flex items-center text-slate-600 hover:text-slate-900 transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
  
        </div>

        {!isConnected ? (
          /* Connection Panel */
          <div className="max-w-md mx-auto">
            <div className="bg-white rounded-2xl p-8 shadow-lg text-center">
              <div className="w-16 h-16 mx-auto mb-6 bg-blue-100 rounded-full flex items-center justify-center">
                <ArrowDownUp className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold mb-3">Connect Wallet</h3>
              <p className="text-slate-600 mb-6">Connect to Base Sepolia to start trading</p>
              <button
                onClick={connectWallet}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition-all"
              >
                Connect MetaMask
              </button>
            </div>
          </div>
        ) : (
          <>
        

       

  
            <div className="grid lg:grid-cols-2 gap-8">
              {/* Swap Interface */}
              <div>
                <div className="bg-white rounded-2xl p-6 shadow-lg">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold">Official Uniswap V3 Swap</h3>
                    <button
                      onClick={() => setShowSettings(!showSettings)}
                      className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                      <Settings className="w-5 h-5 text-slate-600" />
                    </button>
                  </div>

                  {/* Settings */}
                  {showSettings && (
                    <div className="mb-6 p-4 bg-slate-50 rounded-xl">
                      <h4 className="font-medium mb-3">Settings</h4>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Slippage Tolerance (%)
                        </label>
                        <div className="flex gap-2 mb-2">
                          {['0.5', '1.0', '2.0'].map((preset) => (
                            <button
                              key={preset}
                              onClick={() => setSlippageTolerance(preset)}
                              className={`px-3 py-1 text-xs rounded ${
                                slippageTolerance === preset
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                              }`}
                            >
                              {preset}%
                            </button>
                          ))}
                        </div>
                        <input
                          type="number"
                          value={slippageTolerance}
                          onChange={(e) => setSlippageTolerance(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          step="0.1"
                          min="0.1"
                          max="50"
                          placeholder="2.0"
                        />
                      </div>
                    </div>
                  )}

                  {/* From Token */}
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="text-sm font-medium text-slate-700">From</label>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-slate-500">
                            Balance: {formatNumber(getUserBalance(tokenIn))}
                          </span>
                          <button
                            onClick={setMaxAmount}
                            className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200 transition-colors"
                          >
                            MAX
                          </button>
                        </div>
                      </div>
                      <div className="relative">
                        <input
                          type="number"
                          value={amountIn}
                          onChange={(e) => setAmountIn(e.target.value)}
                          placeholder="0.0"
                          className="w-full pl-4 pr-20 py-4 border border-slate-300 rounded-xl text-lg font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          disabled={isLoading}
                        />
                        <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                          <select
                            value={tokenIn}
                            onChange={(e) => setTokenIn(e.target.value)}
                            className="bg-slate-100 px-3 py-2 rounded-lg font-medium border-none outline-none"
                            disabled={isLoading}
                          >
                            <option value="USDC">USDC</option>
                            <option value="AVA">AVA</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Swap Button */}
                    <div className="flex justify-center">
                      <button
                        onClick={swapTokens}
                        className="p-3 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors"
                        disabled={isLoading}
                      >
                        <ArrowDownUp className="w-5 h-5 text-slate-600" />
                      </button>
                    </div>

                    {/* To Token */}
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="text-sm font-medium text-slate-700">To</label>
                        <span className="text-sm text-slate-500">
                          Balance: {formatNumber(getUserBalance(tokenOut))}
                        </span>
                      </div>
                      <div className="relative">
                        <input
                          type="text"
                          value={amountOut}
                          placeholder="0.0"
                          className="w-full pl-4 pr-20 py-4 border border-slate-300 rounded-xl text-lg font-medium bg-slate-50"
                          readOnly
                        />
                        <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                          <select
                            value={tokenOut}
                            onChange={(e) => setTokenOut(e.target.value)}
                            className="bg-slate-100 px-3 py-2 rounded-lg font-medium border-none outline-none"
                            disabled={isLoading}
                          >
                            <option value="USDC">USDC</option>
                            <option value="AVA">AVA</option>
                          </select>
                        </div>
                        {isQuoting && (
                          <div className="absolute right-24 top-1/2 transform -translate-y-1/2">
                            <Loader className="w-4 h-4 animate-spin text-blue-600" />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Swap Details */}
                    {amountIn && amountOut && (
                      <div className="bg-slate-50 rounded-xl p-4 space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-600">Rate</span>
                          <span className="font-medium">
                            1 {tokenIn} = {(parseFloat(amountOut) / parseFloat(amountIn)).toFixed(6)} {tokenOut}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-600">Router</span>
                          <span className="font-medium text-green-600">Official Uniswap V3</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-600">Pool Fee</span>
                          <span className="font-medium text-purple-600">0.01%</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-600">Slippage Tolerance</span>
                          <span className="font-medium">{slippageTolerance}%</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-600">Minimum Received</span>
                          <span className="font-medium text-red-600">
                            {(parseFloat(amountOut) * (1 - parseFloat(slippageTolerance) / 100)).toFixed(6)} {tokenOut}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Execute Button */}
                    <button
                      onClick={executeSwap}
                      disabled={
                        isLoading || 
                        !amountIn || 
                        !amountOut || 
                        parseFloat(amountIn) <= 0
                      }
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 rounded-xl font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transition-all"
                    >
                      {isLoading ? (
                        <span className="flex items-center justify-center">
                          <Loader className="w-5 h-5 mr-3 animate-spin" />
                          Executing Official Swap...
                        </span>
                      ) : (
                        `🔥 SWAP ${tokenIn} → ${tokenOut}`
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Info Panel */}
              <div className="space-y-6">
                {/* Your Balances */}
                <div className="bg-white rounded-2xl p-6 shadow-lg">
                  <h3 className="text-lg font-bold mb-4">Your Balances</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-green-50 rounded-xl">
                      <p className="text-sm text-green-600 font-medium">USDC</p>
                      <p className="text-xl font-bold text-green-700">{formatNumber(balances.userUsdc)}</p>
                    </div>
                    <div className="text-center p-4 bg-blue-50 rounded-xl">
                      <p className="text-sm text-blue-600 font-medium">AVA</p>
                      <p className="text-xl font-bold text-blue-700">{formatNumber(balances.userAva)}</p>
                    </div>
                  </div>
                </div>

                {/* Pool Stats */}
                <div className="bg-white rounded-2xl p-6 shadow-lg">
                  <h3 className="text-lg font-bold mb-4">Pool Statistics</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                      <span className="font-medium text-green-800">Current Pool Price</span>
                      <span className="font-bold text-green-700">
                        {formatNumber(poolInfo.currentPrice, 6)} USDC/AVA
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                      <span className="font-medium text-blue-800">Pool Fee</span>
                      <span className="font-bold text-blue-700">0.01%</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                      <span className="font-medium text-purple-800">Total Liquidity</span>
                      <span className="font-bold text-purple-700">
                        {poolInfo.liquidity !== '0' ? '✅ Active' : '❌ None'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                      <span className="font-medium text-orange-800">Pool TVL</span>
                      <span className="font-bold text-orange-700">
                        ${formatNumber(
                          parseFloat(balances.poolUsdc) + (parseFloat(balances.poolAva) * poolInfo.currentPrice)
                        )}
                      </span>
                    </div>
                  </div>
                </div>

       

         
              </div>
            </div>

            {/* Status Messages */}
            {error && (
              <div className="mt-6">
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center">
                  <AlertCircle className="w-5 h-5 text-red-600 mr-3 flex-shrink-0" />
                  <span className="font-medium text-red-800">{error}</span>
                </div>
              </div>
            )}

            {success && (
              <div className="mt-6">
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-600 mr-3 flex-shrink-0" />
                  <span className="font-medium text-green-800">{success}</span>
                </div>
              </div>
            )}

            {txHash && (
              <div className="mt-6">
                <div className="bg-white rounded-xl p-4 shadow-lg flex items-center justify-between">
                  <span className="font-medium text-slate-700">Transaction Hash:</span>
                  <a
                    href={`https://sepolia.basescan.org/tx/${txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 flex items-center font-medium"
                  >
                    {txHash.slice(0, 8)}...{txHash.slice(-6)}
                    <ExternalLink className="w-4 h-4 ml-2" />
                  </a>
                </div>
              </div>
            )}


    
          </>
        )}
      </div>
    </div>
  );
}

export default SwapPage;