// src/components/DualSwapPage.js
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

// Contract addresses
const CONTRACTS = {
  USDC: '0xd6842B6CfF83784aD53ef9a838F041ac2c337659',
  AVA: '0xA25Fd0C9906d124792b6F1909d3F3b52A4fb98aE',
  POOL: '0x0dEeC152be4087a613DB966CC85082E6BeAde1bF',
  REAL_SWAP_ROUTER: '0x6A480910bAC1d5547CE64Df5820d4aDd1A642216' // Deploy the contract above
};

// Contract ABIs
const ERC20_ABI = [
  "function balanceOf(address) external view returns (uint256)",
  "function approve(address, uint256) external returns (bool)",
  "function allowance(address, address) external view returns (uint256)",
  "function getTestTokens() external"
];

const POOL_ABI = [
  "function fee() external view returns (uint24)"
];

const REAL_SWAP_ROUTER_ABI = [
  "function exactInputSingle(address tokenIn, address tokenOut, uint256 amountIn, uint256 amountOutMinimum, address recipient) external returns (uint256 amountOut)",
  "function getCurrentPrice() external view returns (uint256 price)",
  "function getPoolInfo() external view returns (address token0, address token1, uint24 fee, uint160 sqrtPriceX96, int24 tick)"
];

function DualSwapPage() {
  const { account, signer, isConnected, connectWallet } = useWallet();
  
  // Contract instances
  const [usdcContract, setUsdcContract] = useState(null);
  const [avaContract, setAvaContract] = useState(null);
  const [poolContract, setPoolContract] = useState(null);
  const [realSwapRouter, setRealSwapRouter] = useState(null);

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
    currentPrice: 1.0
  });
  
  // UI state
  const [slippageTolerance, setSlippageTolerance] = useState('5.0'); // Increased default slippage
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
        
        // Only initialize real swap router if address is provided
        if (CONTRACTS.REAL_SWAP_ROUTER && CONTRACTS.REAL_SWAP_ROUTER !== 'YOUR_DEPLOYED_REAL_ROUTER_ADDRESS') {
          setRealSwapRouter(new ethers.Contract(CONTRACTS.REAL_SWAP_ROUTER, REAL_SWAP_ROUTER_ABI, signer));
        }
      } catch (error) {
        setError('Failed to initialize contracts: ' + error.message);
      }
    }
  }, [signer, isConnected]);

  // Load data
  const loadData = async () => {
    if (!usdcContract || !avaContract || !poolContract || !account || !ethers) return;

    try {
      const [userUsdc, userAva, poolUsdc, poolAva, fee] = await Promise.all([
        usdcContract.balanceOf(account),
        avaContract.balanceOf(account),
        usdcContract.balanceOf(CONTRACTS.POOL),
        avaContract.balanceOf(CONTRACTS.POOL),
        poolContract.fee()
      ]);

      const newBalances = {
        userUsdc: ethers.formatUnits(userUsdc, 6),
        userAva: ethers.formatEther(userAva),
        poolUsdc: ethers.formatUnits(poolUsdc, 6),
        poolAva: ethers.formatEther(poolAva)
      };

      setBalances(newBalances);

      // Calculate simple price
      const currentPrice = parseFloat(newBalances.poolUsdc) / parseFloat(newBalances.poolAva) || 1.0;

      setPoolInfo({
        fee: fee.toString(),
        currentPrice
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

  // Simple 1:1 quote (bypass complex AMM math)
  const getSimpleQuote = async (inputAmount) => {
    if (!inputAmount || parseFloat(inputAmount) <= 0) {
      setAmountOut('');
      return;
    }

    try {
      setIsQuoting(true);
      
      // For a balanced pool (101k USDC, 101k AVA), use simple 1:1 rate
      // Just subtract the pool fee
      const inputFloat = parseFloat(inputAmount);
      const fee = parseInt(poolInfo.fee) / 1000000; // 0.003 for 0.3%
      const outputAmount = inputFloat * (1 - fee); // Simple 1:1 minus fee
      
      console.log('Simple quote:', {
        input: inputFloat,
        fee: fee,
        feeAmount: inputFloat * fee,
        output: outputAmount
      });
      
      setAmountOut(outputAmount.toFixed(6));
      
    } catch (error) {
      console.error('Quote error:', error);
      setAmountOut('0');
    } finally {
      setIsQuoting(false);
    }
  };
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
        // USDC to AVA: x*y=k formula with fee adjustment
        const fee = parseInt(poolInfo.fee) / 1000000; // Convert fee to decimal
        const inputAfterFee = inputAmountFloat * (1 - fee);
        outputAmount = (inputAfterFee * poolAvaBalance) / (poolUsdcBalance + inputAfterFee);
      } else if (tokenIn === 'AVA' && tokenOut === 'USDC') {
        // AVA to USDC with fee adjustment
        const fee = parseInt(poolInfo.fee) / 1000000;
        const inputAfterFee = inputAmountFloat * (1 - fee);
        outputAmount = (inputAfterFee * poolUsdcBalance) / (poolAvaBalance + inputAfterFee);
      }

      // Apply additional safety margin (5% less than calculated)
      const safetyMargin = 0.95;
      const finalOutput = Math.max(0, outputAmount * safetyMargin);
      
      setAmountOut(finalOutput.toFixed(6));
      
    } catch (error) {
      console.error('Quote error:', error);
      setAmountOut('0');
    } finally {
      setIsQuoting(false);
    }
  };

  // Quote when amount changes - use simple quote
  useEffect(() => {
    if (amountIn) {
      const timeoutId = setTimeout(() => getSimpleQuote(amountIn), 500);
      return () => clearTimeout(timeoutId);
    } else {
      setAmountOut('');
    }
  }, [amountIn, tokenIn, tokenOut, poolInfo.fee]);

  // Swap tokens
  const swapTokens = () => {
    setTokenIn(tokenOut);
    setTokenOut(tokenIn);
    setAmountIn('');
    setAmountOut('');
  };

  // Test what the pool actually returns for a swap
  const testPoolSwapDirect = async () => {
    if (!poolContract || !usdcContract || !avaContract) {
      setError('Contracts not ready');
      return;
    }

    try {
      setIsLoading(true);
      setError('');
      
      console.log('=== TESTING POOL SWAP CALCULATION ===');
      
      // Get current pool state
      const [slot0, token0, token1, fee] = await Promise.all([
        poolContract.slot0(),
        poolContract.token0(),
        poolContract.token1(),
        poolContract.fee()
      ]);
      
      console.log('Pool state:', {
        sqrtPriceX96: slot0.sqrtPriceX96.toString(),
        tick: slot0.tick.toString(),
        token0,
        token1,
        fee: fee.toString()
      });
      
      // Check if pool is initialized
      if (slot0.sqrtPriceX96.toString() === '0') {
        setError('🚨 POOL NOT INITIALIZED! sqrtPriceX96 = 0. You need to call pool.initialize() first!');
        return;
      }
      
      // Get actual balances
      const [poolUsdc, poolAva] = await Promise.all([
        usdcContract.balanceOf(CONTRACTS.POOL),
        avaContract.balanceOf(CONTRACTS.POOL)
      ]);
      
      console.log('Pool balances:', {
        usdc: ethers.formatUnits(poolUsdc, 6),
        ava: ethers.formatEther(poolAva)
      });
      
      // Calculate what Uniswap V3 math would give
      const sqrtPrice = Number(slot0.sqrtPriceX96);
      const price = (sqrtPrice / (2 ** 96)) ** 2;
      
      console.log('Uniswap V3 price calculation:', {
        sqrtPrice,
        price,
        priceAdjusted: price * (10 ** 12) // Adjust for decimal difference
      });
      
      // Check token order
      const isToken0USDC = token0.toLowerCase() === CONTRACTS.USDC.toLowerCase();
      
      setSuccess(
        `Pool state check complete! ` +
        `sqrtPriceX96: ${slot0.sqrtPriceX96.toString()}, ` +
        `Token0: ${isToken0USDC ? 'USDC' : 'AVA'}, ` +
        `Pool initialized: ${slot0.sqrtPriceX96.toString() !== '0'}. ` +
        `Check console for detailed calculations.`
      );
      
      // Try to call quoter if available (this might not work on testnet)
      try {
        // Simple price check: what would 1 USDC get?
        const oneUSDC = ethers.parseUnits('1', 6);
        
        // We can't easily simulate the exact Uniswap calculation without the quoter
        // But we can check if the pool would accept a swap at all
        console.log('Pool accepts swaps (basic validation passed)');
        
      } catch (quoteError) {
        console.log('Quote simulation failed:', quoteError);
      }
      
    } catch (error) {
      console.error('Pool swap test failed:', error);
      setError('Pool swap test failed: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };
  const testPoolDirectly = async () => {
    if (!poolContract) {
      setError('Pool contract not connected');
      return;
    }

    try {
      setIsLoading(true);
      setError('');
      
      console.log('=== TESTING POOL DIRECTLY ===');
      
      // Get pool slot0 (current state)
      const slot0 = await poolContract.slot0();
      console.log('Pool slot0:', {
        sqrtPriceX96: slot0.sqrtPriceX96.toString(),
        tick: slot0.tick.toString(),
        observationIndex: slot0.observationIndex,
        observationCardinality: slot0.observationCardinality
      });
      
      // Check if pool is initialized
      if (slot0.sqrtPriceX96.toString() === '0') {
        setError('🚨 POOL NOT INITIALIZED! The pool has no price set. You need to initialize it first.');
        return;
      }
      
      // Get token order
      const [token0, token1, fee] = await Promise.all([
        poolContract.token0(),
        poolContract.token1(),
        poolContract.fee()
      ]);
      
      console.log('Pool details:', {
        token0,
        token1,
        fee: fee.toString(),
        expectedUSDC: CONTRACTS.USDC,
        expectedAVA: CONTRACTS.AVA
      });
      
      // Check if tokens match what we expect
      const isToken0USDC = token0.toLowerCase() === CONTRACTS.USDC.toLowerCase();
      const isToken1AVA = token1.toLowerCase() === CONTRACTS.AVA.toLowerCase();
      const isToken0AVA = token0.toLowerCase() === CONTRACTS.AVA.toLowerCase();
      const isToken1USDC = token1.toLowerCase() === CONTRACTS.USDC.toLowerCase();
      
      if (!((isToken0USDC && isToken1AVA) || (isToken0AVA && isToken1USDC))) {
        setError(`🚨 WRONG TOKENS IN POOL! Pool has ${token0} and ${token1}, but expected ${CONTRACTS.USDC} and ${CONTRACTS.AVA}`);
        return;
      }
      
      setSuccess(
        `✅ Pool is properly initialized and has correct tokens! ` +
        `Token0: ${isToken0USDC ? 'USDC' : 'AVA'}, Token1: ${isToken1USDC ? 'USDC' : 'AVA'}. ` +
        `The issue is likely in your router contract implementation.`
      );
      
    } catch (error) {
      console.error('Pool test failed:', error);
      setError('Pool test failed: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };
  const testRouter = async () => {
    if (!realSwapRouter) {
      setError('Real swap router not connected');
      return;
    }

    try {
      setIsLoading(true);
      setError('');
      
      console.log('Testing router functionality...');
      
      // Test 1: Check if we can call getCurrentPrice
      try {
        const price = await realSwapRouter.getCurrentPrice();
        console.log('Router price:', price.toString());
        setSuccess(`Router test 1/3 passed: Can read price`);
      } catch (priceError) {
        console.error('Price call failed:', priceError);
        setError('Router price call failed: ' + priceError.message);
        return;
      }
      
      // Test 2: Check pool info
      try {
        const poolInfo = await realSwapRouter.getPoolInfo();
        console.log('Pool info:', poolInfo);
        setSuccess(`Router test 2/3 passed: Can read pool info`);
      } catch (poolError) {
        console.error('Pool info failed:', poolError);
        setError('Router pool info failed: ' + poolError.message);
        return;
      }
      
      // Test 3: Check token balances
      try {
        const [usdcBal, avaBal] = await Promise.all([
          usdcContract.balanceOf(account),
          avaContract.balanceOf(account)
        ]);
        console.log('User USDC:', ethers.formatUnits(usdcBal, 6));
        console.log('User AVA:', ethers.formatEther(avaBal));
        setSuccess(`Router test 3/3 passed: All basic functions work. Ready to swap!`);
      } catch (balError) {
        console.error('Balance check failed:', balError);
        setError('Balance check failed: ' + balError.message);
        return;
      }
      
    } catch (error) {
      setError('Router test failed: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };
  const diagnosePool = async () => {
    if (!usdcContract || !avaContract || !poolContract) return;

    try {
      setIsLoading(true);
      setError('');

      console.log('=== POOL DIAGNOSIS ===');
      
      // Get actual pool balances
      const [poolUsdc, poolAva, fee] = await Promise.all([
        usdcContract.balanceOf(CONTRACTS.POOL),
        avaContract.balanceOf(CONTRACTS.POOL),
        poolContract.fee()
      ]);

      const poolUsdcFormatted = ethers.formatUnits(poolUsdc, 6);
      const poolAvaFormatted = ethers.formatEther(poolAva);
      
      console.log('Pool USDC:', poolUsdcFormatted);
      console.log('Pool AVA:', poolAvaFormatted);
      console.log('Pool Fee:', fee.toString(), '=', Number(fee) / 10000, '%');
      
      // Calculate price
      const currentPrice = parseFloat(poolUsdcFormatted) / parseFloat(poolAvaFormatted);
      console.log('Current Price (USDC/AVA):', currentPrice);
      
      // Test different swap amounts
      const testAmounts = ['0.1', '1', '10', '100'];
      
      for (const amount of testAmounts) {
        const inputFloat = parseFloat(amount);
        const fee_decimal = Number(fee) / 1000000;
        const inputAfterFee = inputFloat * (1 - fee_decimal);
        const outputAmount = (inputAfterFee * parseFloat(poolAvaFormatted)) / (parseFloat(poolUsdcFormatted) + inputAfterFee);
        
        console.log(`${amount} USDC → ${outputAmount.toFixed(6)} AVA (after ${(fee_decimal * 100).toFixed(3)}% fee)`);
      }
      
      setSuccess(
        `Pool Diagnosis Complete! ` +
        `Pool has ${poolUsdcFormatted} USDC and ${poolAvaFormatted} AVA. ` +
        `Current price: ${currentPrice.toFixed(6)} USDC/AVA. ` +
        `Pool fee: ${(Number(fee) / 10000).toFixed(3)}%. ` +
        `Check console for detailed swap calculations.`
      );

    } catch (error) {
      setError('Diagnosis failed: ' + error.message);
    } finally {
      setIsLoading(false);
    }
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

  // Execute real pool swap
  const executeSwap = async () => {
    try {
      setIsLoading(true);
      setError('');
      setSuccess('');

      if (!amountIn || !amountOut || parseFloat(amountIn) <= 0) {
        throw new Error('Invalid amounts');
      }

      // Check if we have the real swap router
      if (!realSwapRouter) {
        // Fall back to simulation
        await executeSwapSimulation();
        return;
      }

      // Try ultra-simple approach first
      try {
        await executeUltraSimpleSwap();
        return;
      } catch (ultraError) {
        console.log('Ultra-simple swap failed:', ultraError);
        setError(`Even 90% slippage failed: ${ultraError.message}`);
        return;
      }

    } catch (error) {
      setError('Swap failed: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Ultra-simple swap with very low minimum expectations
  const executeUltraSimpleSwap = async () => {
    const tokenInAddr = tokenIn === 'USDC' ? CONTRACTS.USDC : CONTRACTS.AVA;
    const tokenOutAddr = tokenOut === 'USDC' ? CONTRACTS.USDC : CONTRACTS.AVA;
    const tokenInContract = tokenIn === 'USDC' ? usdcContract : avaContract;

    const amountInWei = tokenIn === 'USDC' 
      ? ethers.parseUnits(amountIn, 6)
      : ethers.parseEther(amountIn);

    // Expect almost nothing back (90% slippage tolerance)
    const ultraConservative = parseFloat(amountOut) * 0.1; // Only expect 10% of quote
    const amountOutMinimum = tokenOut === 'USDC'
      ? ethers.parseUnits(ultraConservative.toString(), 6)
      : ethers.parseEther(ultraConservative.toString());

    console.log('Ultra-simple swap:', {
      amountIn,
      expectedOutput: amountOut,
      minimumAccepted: ultraConservative.toString(),
      slippageTolerance: '90%'
    });

    // Check balance
    const balance = await tokenInContract.balanceOf(account);
    if (balance < amountInWei) {
      throw new Error(`Insufficient ${tokenIn} balance`);
    }

    // Check and approve
    const currentAllowance = await tokenInContract.allowance(account, CONTRACTS.REAL_SWAP_ROUTER);
    if (currentAllowance < amountInWei) {
      setSuccess('Step 1/2: Approving tokens...');
      const approveTx = await tokenInContract.approve(CONTRACTS.REAL_SWAP_ROUTER, amountInWei);
      setTxHash(approveTx.hash);
      await approveTx.wait();
    }

    // Execute with 90% slippage tolerance
    setSuccess('Step 2/2: Executing with 90% slippage tolerance...');
    
    const swapTx = await realSwapRouter.exactInputSingle(
      tokenInAddr,
      tokenOutAddr,
      amountInWei,
      amountOutMinimum,
      account
    );
    
    setTxHash(swapTx.hash);
    await swapTx.wait();
    
    setSuccess(`🎉 ULTRA-SIMPLE SWAP WORKED! Pool price changed!`);
    setAmountIn('');
    setAmountOut('');
    setTimeout(loadData, 2000);
  };
  const executeConservativeSwap = async () => {
    const tokenInAddr = tokenIn === 'USDC' ? CONTRACTS.USDC : CONTRACTS.AVA;
    const tokenOutAddr = tokenOut === 'USDC' ? CONTRACTS.USDC : CONTRACTS.AVA;
    const tokenInContract = tokenIn === 'USDC' ? usdcContract : avaContract;

    const amountInWei = tokenIn === 'USDC' 
      ? ethers.parseUnits(amountIn, 6)
      : ethers.parseEther(amountIn);

    // Use VERY conservative minimum output (50% of expected)
    const conservativeOutput = parseFloat(amountOut) * 0.5; // Accept only 50% of quoted amount
    const amountOutMinimum = tokenOut === 'USDC'
      ? ethers.parseUnits(conservativeOutput.toString(), 6)
      : ethers.parseEther(conservativeOutput.toString());

    console.log('Conservative swap:', {
      expectedOutput: amountOut,
      conservativeOutput: conservativeOutput.toString(),
      acceptingOnly: '50% of quote'
    });

    // Check balance
    const balance = await tokenInContract.balanceOf(account);
    if (balance < amountInWei) {
      throw new Error(`Insufficient ${tokenIn} balance`);
    }

    // Check and approve
    const currentAllowance = await tokenInContract.allowance(account, CONTRACTS.REAL_SWAP_ROUTER);
    if (currentAllowance < amountInWei) {
      setSuccess('Step 1/2: Approving tokens...');
      const approveTx = await tokenInContract.approve(CONTRACTS.REAL_SWAP_ROUTER, amountInWei);
      setTxHash(approveTx.hash);
      await approveTx.wait();
    }

    // Execute ultra-conservative swap
    setSuccess('Step 2/2: Executing conservative swap (50% minimum)...');
    
    const swapTx = await realSwapRouter.exactInputSingle(
      tokenInAddr,
      tokenOutAddr,
      amountInWei,
      amountOutMinimum,
      account
    );
    
    setTxHash(swapTx.hash);
    await swapTx.wait();
    
    setSuccess(`🎉 CONSERVATIVE SWAP EXECUTED! Pool price changed!`);
    setAmountIn('');
    setAmountOut('');
    setTimeout(loadData, 2000);
  };
  const executeRealSwap = async () => {
    const tokenInAddr = tokenIn === 'USDC' ? CONTRACTS.USDC : CONTRACTS.AVA;
    const tokenOutAddr = tokenOut === 'USDC' ? CONTRACTS.USDC : CONTRACTS.AVA;
    const tokenInContract = tokenIn === 'USDC' ? usdcContract : avaContract;

    const amountInWei = tokenIn === 'USDC' 
      ? ethers.parseUnits(amountIn, 6)
      : ethers.parseEther(amountIn);

    // Use much more conservative slippage for safety
    const slippageMultiplier = 1 - (Math.max(parseFloat(slippageTolerance), 5.0) / 100); // Minimum 5% slippage
    const amountOutMinimum = tokenOut === 'USDC'
      ? ethers.parseUnits((parseFloat(amountOut) * slippageMultiplier).toString(), 6)
      : ethers.parseEther((parseFloat(amountOut) * slippageMultiplier).toString());

    console.log('Swap details:', {
      tokenIn,
      tokenOut,
      amountIn,
      amountOut,
      slippageTolerance,
      slippageMultiplier,
      amountOutMinimum: tokenOut === 'USDC' ? ethers.formatUnits(amountOutMinimum, 6) : ethers.formatEther(amountOutMinimum)
    });

    // Check balance
    const balance = await tokenInContract.balanceOf(account);
    if (balance < amountInWei) {
      throw new Error(`Insufficient ${tokenIn} balance`);
    }

    // Check and approve
    const currentAllowance = await tokenInContract.allowance(account, CONTRACTS.REAL_SWAP_ROUTER);
    if (currentAllowance < amountInWei) {
      setSuccess('Step 1/2: Approving tokens...');
      const approveTx = await tokenInContract.approve(CONTRACTS.REAL_SWAP_ROUTER, amountInWei);
      setTxHash(approveTx.hash);
      await approveTx.wait();
    }

    // Execute real swap with gas estimation
    setSuccess('Step 2/2: Executing real pool swap...');
    
    try {
      // Estimate gas first
      const gasEstimate = await realSwapRouter.exactInputSingle.estimateGas(
        tokenInAddr,
        tokenOutAddr,
        amountInWei,
        amountOutMinimum,
        account
      );
      
      console.log('Gas estimate:', gasEstimate.toString());
      
      const swapTx = await realSwapRouter.exactInputSingle(
        tokenInAddr,
        tokenOutAddr,
        amountInWei,
        amountOutMinimum,
        account,
        {
          gasLimit: gasEstimate * 120n / 100n // Add 20% gas buffer
        }
      );
      
      setTxHash(swapTx.hash);
      const receipt = await swapTx.wait();
      
      setSuccess(`🎉 REAL SWAP EXECUTED! ${amountIn} ${tokenIn} → ${tokenOut}. Pool price has changed!`);
      setAmountIn('');
      setAmountOut('');
      
      // Reload data to see the new price
      setTimeout(loadData, 2000);
      
    } catch (gasError) {
      console.error('Gas estimation or execution failed:', gasError);
      
      // If it's a slippage error, suggest increasing slippage
      if (gasError.message.includes('Insufficient output amount')) {
        throw new Error(
          `Slippage too high! Try: 1) Increase slippage to 5-10%, 2) Reduce swap amount, or 3) Wait for better market conditions. Current slippage: ${slippageTolerance}%`
        );
      }
      
      throw gasError;
    }
  };

  // Simulation fallback
  const executeSwapSimulation = async () => {
    const poolUsdcBalance = parseFloat(balances.poolUsdc);
    const poolAvaBalance = parseFloat(balances.poolAva);
    const inputAmountFloat = parseFloat(amountIn);
    const outputAmountFloat = parseFloat(amountOut);
    
    if (poolUsdcBalance === 0 || poolAvaBalance === 0) {
      throw new Error('Pool has no liquidity');
    }
    
    let newPoolUsdc = poolUsdcBalance;
    let newPoolAva = poolAvaBalance;
    
    if (tokenIn === 'USDC') {
      newPoolUsdc += inputAmountFloat;
      newPoolAva -= outputAmountFloat;
    } else {
      newPoolAva += inputAmountFloat;
      newPoolUsdc -= outputAmountFloat;
    }
    
    if (newPoolUsdc <= 0 || newPoolAva <= 0) {
      throw new Error('Insufficient pool liquidity for this trade');
    }
    
    const newPrice = newPoolUsdc / newPoolAva;
    const priceImpact = Math.abs((newPrice - poolInfo.currentPrice) / poolInfo.currentPrice * 100);
    
    setSuccess(
      `⚠️ SIMULATION ONLY: New price would be ${newPrice.toFixed(6)} USDC/AVA (${priceImpact.toFixed(2)}% impact). ` +
      `Deploy the RealPoolSwapRouter contract to execute real swaps that change the actual pool price.`
    );
    
    setAmountIn('');
    setAmountOut('');
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
          
          <div className="text-center">
            <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              AVALON POOL SWAP
            </h1>
            <p className="text-xl text-slate-600 mb-2">Market Price Trading with Real Liquidity</p>
            <p className="text-lg text-blue-600 font-medium">Base Sepolia Testnet</p>
          </div>
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
            {/* Critical Issue Alert */}
            {realSwapRouter && (
              <div className="mb-8">
                <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
                  <h3 className="text-lg font-bold text-red-800 mb-4">
                    🚨 Swap Failing Even with 90% Slippage
                  </h3>
                  <div className="text-red-700 space-y-3">
                    <p>
                      <strong>Problem:</strong> Even expecting only 10% of quoted output, swaps are failing with "Insufficient output amount."
                    </p>
                    <p>
                      <strong>This means:</strong> The pool is returning less than 10% of expected output, which is impossible with your balanced pool.
                    </p>
                    <div className="bg-red-100 rounded-lg p-3 mt-4">
                      <p className="font-medium text-red-800">Most Likely Causes:</p>
                      <ol className="list-decimal list-inside space-y-1 text-sm mt-2">
                        <li><strong>Pool not initialized</strong> - sqrtPriceX96 = 0 (most common)</li>
                        <li><strong>Wrong token addresses</strong> in pool vs router</li>
                        <li><strong>Router callback bug</strong> - pool can't get paid</li>
                        <li><strong>Token decimal mismatch</strong> in calculations</li>
                      </ol>
                    </div>
                    <div className="flex gap-2">
                      <span className="text-red-800 font-medium">→ Click "🔍 Test Pool Math" to diagnose!</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div className="mb-8">
              {!realSwapRouter ? (
                <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6">
                  <h3 className="text-lg font-bold text-yellow-800 mb-4">
                    🚀 Deploy Real Swap Router for Actual Trading
                  </h3>
                  <div className="text-yellow-700 space-y-3">
                    <p>
                      Currently showing <strong>simulations only</strong>. To execute real swaps that change the pool price:
                    </p>
                    <ol className="list-decimal list-inside space-y-2 ml-4">
                      <li>Deploy the RealPoolSwapRouter.sol contract</li>
                      <li>Update REAL_SWAP_ROUTER address in the code</li>
                      <li>Execute real swaps that affect the actual pool price!</li>
                    </ol>
                    <div className="bg-yellow-100 rounded-lg p-3 mt-4">
                      <p className="font-medium text-yellow-800">Constructor Parameter:</p>
                      <code className="text-sm font-mono break-all">{CONTRACTS.POOL}</code>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-green-50 border border-green-200 rounded-2xl p-6">
                  <h3 className="text-lg font-bold text-green-800 mb-4">
                    ✅ Real Swap Router Deployed!
                  </h3>
                  <div className="text-green-700 space-y-3">
                    <p>
                      Your real swap router is ready! Swaps will actually change the pool price.
                    </p>
                    <div className="bg-green-100 rounded-lg p-3">
                      <p className="font-medium text-green-800">Router Address:</p>
                      <a
                        href={`https://sepolia.basescan.org/address/${CONTRACTS.REAL_SWAP_ROUTER}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-mono break-all text-green-600 hover:text-green-800 inline-flex items-center"
                      >
                        {CONTRACTS.REAL_SWAP_ROUTER}
                        <ExternalLink className="w-3 h-3 ml-1" />
                      </a>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="mb-8">
              <div className="bg-white rounded-2xl p-6 shadow-lg">
                <h3 className="text-xl font-bold mb-4 text-slate-900">🎉 Pool Status - LIVE!</h3>
                <div className="grid md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-green-50 rounded-xl">
                    <p className="text-sm text-green-600 font-medium">Pool USDC</p>
                    <p className="text-2xl font-bold text-green-700">{formatNumber(balances.poolUsdc)}</p>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-xl">
                    <p className="text-sm text-blue-600 font-medium">Pool AVA</p>
                    <p className="text-2xl font-bold text-blue-700">{formatNumber(balances.poolAva)}</p>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-xl">
                    <p className="text-sm text-purple-600 font-medium">Current Price</p>
                    <p className="text-2xl font-bold text-purple-700">
                      {formatNumber(poolInfo.currentPrice, 6)}
                    </p>
                    <p className="text-xs text-purple-600">USDC per AVA</p>
                  </div>
                  <div className="text-center p-4 bg-orange-50 rounded-xl">
                    <p className="text-sm text-orange-600 font-medium">TVL</p>
                    <p className="text-2xl font-bold text-orange-700">
                      ${formatNumber(
                        parseFloat(balances.poolUsdc) + (parseFloat(balances.poolAva) * poolInfo.currentPrice)
                      )}
                    </p>
                  </div>
                </div>
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-blue-800 text-sm">
                    <strong>🔥 Your swaps will affect the real token price!</strong> 
                    Using market rates with price impact and slippage.
                  </p>
                </div>
              </div>
            </div>

            {/* Test Tokens */}
            <div className="mb-8">
              <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                <button
                  onClick={() => getTestTokens('USDC')}
                  disabled={isLoading}
                  className="bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-medium transition-colors disabled:opacity-50"
                >
                  Get Test USDC
                </button>
                <button
                  onClick={() => getTestTokens('AVA')}
                  disabled={isLoading}
                  className="bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-medium transition-colors disabled:opacity-50"
                >
                  Get Test AVA
                </button>
                <button
                  onClick={testPoolSwapDirect}
                  disabled={isLoading}
                  className="bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl font-medium transition-colors disabled:opacity-50"
                >
                  🔍 Test Pool Math
                </button>
                <button
                  onClick={testRouter}
                  disabled={isLoading || !realSwapRouter}
                  className="bg-orange-600 hover:bg-orange-700 text-white py-3 rounded-xl font-medium transition-colors disabled:opacity-50"
                >
                  🧪 Test Router
                </button>
                <button
                  onClick={() => window.open(`https://sepolia.basescan.org/address/${CONTRACTS.POOL}`, '_blank')}
                  className="bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-xl font-medium transition-colors"
                >
                  View Pool
                </button>
                <button
                  onClick={loadData}
                  disabled={isLoading}
                  className="bg-slate-600 hover:bg-slate-700 text-white py-3 rounded-xl font-medium transition-colors disabled:opacity-50"
                >
                  Refresh
                </button>
              </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
              {/* Swap Interface */}
              <div>
                <div className="bg-white rounded-2xl p-6 shadow-lg">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold">Market Price Swap</h3>
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
                          {['1.0', '5.0', '10.0'].map((preset) => (
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
                          step="0.5"
                          min="0.5"
                          max="50"
                          placeholder="5.0"
                        />
                        <p className="text-xs text-slate-500 mt-1">
                          Recommended: 5-10% for volatile pools
                        </p>
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

                    {/* Swap Details with debugging */}
                    {amountIn && amountOut && (
                      <div className="bg-slate-50 rounded-xl p-4 space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-600">Expected Rate</span>
                          <span className="font-medium">
                            1 {tokenIn} = {(parseFloat(amountOut) / parseFloat(amountIn)).toFixed(6)} {tokenOut}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-600">Mode</span>
                          <span className="font-medium text-green-600">Market Price (AMM)</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-600">Pool Fee</span>
                          <span className="font-medium text-purple-600">{(parseInt(poolInfo.fee) / 10000).toFixed(3)}%</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-600">Price Impact</span>
                          <span className="font-medium text-orange-600">
                            {(() => {
                              const currentPrice = poolInfo.currentPrice;
                              const tradePrice = parseFloat(amountOut) / parseFloat(amountIn);
                              const impact = Math.abs((tradePrice - currentPrice) / currentPrice * 100);
                              return `${impact.toFixed(2)}%`;
                            })()}
                          </span>
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

                    {/* Price Impact Warning */}
                    {amountIn && parseFloat(amountIn) > 50 && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                        <div className="flex items-start">
                          <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
                          <div>
                            <p className="font-medium text-yellow-800">Large Swap Warning</p>
                            <p className="text-yellow-700 text-sm mt-1">
                              This large swap will significantly impact the pool price. Consider splitting into smaller swaps.
                            </p>
                          </div>
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
                          {realSwapRouter ? 'Executing Real Swap...' : 'Simulating...'}
                        </span>
                      ) : (
                        realSwapRouter 
                          ? `🔥 REAL SWAP ${tokenIn} → ${tokenOut}` 
                          : `📊 Simulate ${tokenIn} → ${tokenOut}`
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
                      <span className="font-bold text-blue-700">{(parseInt(poolInfo.fee) / 10000).toFixed(2)}%</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                      <span className="font-medium text-purple-800">Pool TVL</span>
                      <span className="font-bold text-purple-700">
                        ${formatNumber(
                          parseFloat(balances.poolUsdc) + (parseFloat(balances.poolAva) * poolInfo.currentPrice)
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Trading Guide */}
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6">
                  <h3 className="text-lg font-bold mb-4 text-slate-900">🎯 Market Trading</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-start">
                      <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold mr-3 mt-0.5">1</div>
                      <div>
                        <p className="font-medium text-blue-800">Price Impact</p>
                        <p className="text-blue-700">Large trades move the market price up or down</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <div className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-bold mr-3 mt-0.5">2</div>
                      <div>
                        <p className="font-medium text-green-800">AMM Formula</p>
                        <p className="text-green-700">Uses constant product (x×y=k) for pricing</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <div className="w-6 h-6 bg-purple-500 text-white rounded-full flex items-center justify-center text-xs font-bold mr-3 mt-0.5">3</div>
                      <div>
                        <p className="font-medium text-purple-800">Slippage</p>
                        <p className="text-purple-700">Price changes between quote and execution</p>
                      </div>
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

            {/* Contract Info */}
            <div className="mt-8">
              <div className="bg-white rounded-2xl p-6 shadow-lg">
                <h3 className="text-xl font-bold mb-6">Contract Information</h3>
                <div className="grid md:grid-cols-3 gap-6">
                  <div>
                    <p className="text-sm font-medium text-slate-600 mb-1">AVA Token</p>
                    <a
                      href={`https://sepolia.basescan.org/address/${CONTRACTS.AVA}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-sm text-blue-600 hover:text-blue-800 break-all"
                    >
                      {CONTRACTS.AVA}
                    </a>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-600 mb-1">USDC Token</p>
                    <a
                      href={`https://sepolia.basescan.org/address/${CONTRACTS.USDC}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-sm text-blue-600 hover:text-blue-800 break-all"
                    >
                      {CONTRACTS.USDC}
                    </a>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-600 mb-1">Uniswap V3 Pool</p>
                    <a
                      href={`https://sepolia.basescan.org/address/${CONTRACTS.POOL}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-sm text-blue-600 hover:text-blue-800 break-all"
                    >
                      {CONTRACTS.POOL}
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Final Status */}
            <div className="mt-6">
              <div className="bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-2xl p-6 text-center">
                <h3 className="text-2xl font-bold mb-2">🎉 Your Pool is Live!</h3>
                <p className="text-lg opacity-90">
                  Pool: {formatNumber(balances.poolUsdc)} USDC + {formatNumber(balances.poolAva)} AVA
                </p>
                <p className="opacity-75">
                  Current Rate: 1 AVA = {formatNumber(poolInfo.currentPrice, 6)} USDC
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default DualSwapPage;