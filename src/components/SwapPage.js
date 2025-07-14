// src/components/SwapPage.js
import React, { useState, useEffect } from 'react';
import { ArrowDownUp, ArrowLeft, ExternalLink, AlertCircle, CheckCircle, Loader, Settings, Info } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useWallet } from '../context/WalletContext';

// Dynamically import ethers to avoid SSR issues
let ethers;
let BigInt;
let inputAmount;
if (typeof window !== 'undefined') {
  ethers = require('ethers');
  // Ensure BigInt is available
  BigInt = window.BigInt || global.BigInt;
}

// Contract addresses
const CONTRACTS = {
  USDC: '0xd6842B6CfF83784aD53ef9a838F041ac2c337659',
  AVA: '0xA25Fd0C9906d124792b6F1909d3F3b52A4fb98aE',
  POOL: '0x0dEeC152be4087a613DB966CC85082E6BeAde1bF', // Your Uniswap V3 pool
  SIMPLE_ROUTER: '0xe733Dc37F284ECf646bbc26FFEef5C9297883715', // Your NEW SimpleSwapRouter V3
  // These might not be available on Base Sepolia
  SWAP_ROUTER: '0x94cC0AaC535CCDB3C01d6787D6413C739ae12bc4', 
  QUOTER: '0xC5290058841028F1614F3A6F0F5816cAd0df5E27'
};

// ABIs
const ERC20_ABI = [
  "function balanceOf(address) external view returns (uint256)",
  "function approve(address, uint256) external returns (bool)",
  "function allowance(address, address) external view returns (uint256)",
  "function decimals() external view returns (uint8)",
  "function symbol() external view returns (string)",
  "function getTestTokens() external"
];

// Simple Router ABI for our custom contract
const SIMPLE_ROUTER_ABI = [
  "function exactInputSingle(address tokenIn, address tokenOut, uint256 amountIn, uint256 amountOutMinimum, address recipient) external returns (uint256 amountOut)",
  "function getAmountOut(address tokenIn, address tokenOut, uint256 amountIn) external view returns (uint256 amountOut)"
];

const UNISWAP_SWAP_ROUTER_ABI = [
  "function exactInputSingle((address tokenIn, address tokenOut, uint24 fee, address recipient, uint256 deadline, uint256 amountIn, uint256 amountOutMinimum, uint160 sqrtPriceLimitX96)) external payable returns (uint256 amountOut)",
  "function exactOutputSingle((address tokenIn, address tokenOut, uint24 fee, address recipient, uint256 deadline, uint256 amountOut, uint256 amountInMaximum, uint160 sqrtPriceLimitX96)) external payable returns (uint256 amountIn)"
];

const QUOTER_ABI = [
  "function quoteExactInputSingle(address tokenIn, address tokenOut, uint24 fee, uint256 amountIn, uint160 sqrtPriceLimitX96) external returns (uint256 amountOut)",
  "function quoteExactOutputSingle(address tokenIn, address tokenOut, uint24 fee, uint256 amountOut, uint160 sqrtPriceLimitX96) external returns (uint256 amountIn)"
];

const POOL_ABI = [
  "function fee() external view returns (uint24)",
  "function token0() external view returns (address)",
  "function token1() external view returns (address)",
  "function slot0() external view returns (uint160 sqrtPriceX96, int24 tick, uint16 observationIndex, uint16 observationCardinality, uint16 observationCardinalityNext, uint8 feeProtocol, bool unlocked)",
  "function swap(address recipient, bool zeroForOne, int256 amountSpecified, uint160 sqrtPriceLimitX96, bytes calldata data) external returns (int256 amount0, int256 amount1)"
];

function SwapPage() {
  const { account, signer, isConnected, connectWallet } = useWallet();
  
  // Contract instances
  const [usdcContract, setUsdcContract] = useState(null);
  const [avaContract, setAvaContract] = useState(null);
  const [swapRouterContract, setSwapRouterContract] = useState(null);
  const [simpleRouterContract, setSimpleRouterContract] = useState(null);
  const [quoterContract, setQuoterContract] = useState(null);
  const [poolContract, setPoolContract] = useState(null);

  // Swap state
  const [tokenIn, setTokenIn] = useState('USDC');
  const [tokenOut, setTokenOut] = useState('AVA');
  const [amountIn, setAmountIn] = useState('');
  const [amountOut, setAmountOut] = useState('');
  const [isExactIn, setIsExactIn] = useState(true);
  
  // Pool info
  const [poolFee, setPoolFee] = useState('3000'); // Default 0.3%
  const [poolInfo, setPoolInfo] = useState(null);
  
  // Balances
  const [usdcBalance, setUsdcBalance] = useState('0');
  const [avaBalance, setAvaBalance] = useState('0');
  
  // Settings
  const [slippageTolerance, setSlippageTolerance] = useState('0.5');
  const [deadline, setDeadline] = useState('20'); // minutes
  const [showSettings, setShowSettings] = useState(false);
  
  // Transaction state
  const [isLoading, setIsLoading] = useState(false);
  const [isQuoting, setIsQuoting] = useState(false);
  const [txHash, setTxHash] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Token configuration
  const tokens = {
    USDC: {
      address: CONTRACTS.USDC,
      symbol: 'USDC',
      decimals: 6,
      color: 'bg-green-100 text-green-800'
    },
    AVA: {
      address: CONTRACTS.AVA,
      symbol: 'AVA',
      decimals: 18,
      color: 'bg-blue-100 text-blue-800'
    }
  };

  // Initialize contracts
  useEffect(() => {
    const initializeContracts = async () => {
      if (signer && isConnected && ethers) {
        try {
          const usdc = new ethers.Contract(CONTRACTS.USDC, ERC20_ABI, signer);
          const ava = new ethers.Contract(CONTRACTS.AVA, ERC20_ABI, signer);
          const pool = new ethers.Contract(CONTRACTS.POOL, POOL_ABI, signer);

          setUsdcContract(usdc);
          setAvaContract(ava);
          setPoolContract(pool);

          // Try to initialize routers (they might not exist on testnet)
          try {
            const swapRouter = new ethers.Contract(CONTRACTS.SWAP_ROUTER, UNISWAP_SWAP_ROUTER_ABI, signer);
            setSwapRouterContract(swapRouter);
          } catch (e) {
            console.log('Official SwapRouter not available');
          }

          try {
            const quoter = new ethers.Contract(CONTRACTS.QUOTER, QUOTER_ABI, signer);
            setQuoterContract(quoter);
          } catch (e) {
            console.log('Official Quoter not available');
          }

          // Try simple router if deployed (should always work with your address)
          try {
            const simpleRouter = new ethers.Contract(CONTRACTS.SIMPLE_ROUTER, SIMPLE_ROUTER_ABI, signer);
            setSimpleRouterContract(simpleRouter);
            console.log('SimpleSwapRouter initialized successfully at:', CONTRACTS.SIMPLE_ROUTER);
            
            // Test if the contract is actually deployed by calling a view function
            try {
              await simpleRouter.getAmountOut(
                CONTRACTS.USDC,
                CONTRACTS.AVA,
                ethers.parseUnits('1', 6)
              );
              console.log('SimpleSwapRouter test call successful - contract is working');
            } catch (testError) {
              console.error('SimpleSwapRouter test call failed:', testError);
              setError('SimpleSwapRouter contract not working properly. Please redeploy or check the address.');
            }
            
          } catch (e) {
            console.log('Simple router initialization failed:', e);
            setError('Failed to connect to SimpleSwapRouter. Please check the contract address.');
          }

        } catch (error) {
          setError('Failed to initialize contracts: ' + error.message);
        }
      }
    };

    initializeContracts();
  }, [signer, isConnected]);

  // Load balances and pool info
  const loadData = async () => {
    if (!usdcContract || !avaContract || !poolContract || !account || !ethers) return;

    try {
      const [usdcBal, avaBal, fee, token0, token1, slot0] = await Promise.all([
        usdcContract.balanceOf(account),
        avaContract.balanceOf(account),
        poolContract.fee(),
        poolContract.token0(),
        poolContract.token1(),
        poolContract.slot0()
      ]);

      setUsdcBalance(ethers.formatUnits(usdcBal, 6));
      setAvaBalance(ethers.formatEther(avaBal));
      setPoolFee(fee.toString());
      
      setPoolInfo({
        fee: fee.toString(),
        token0: token0.toLowerCase(),
        token1: token1.toLowerCase(),
        sqrtPriceX96: slot0.sqrtPriceX96.toString(),
        tick: slot0.tick.toString()
      });

    } catch (error) {
      console.error('Error loading data:', error);
      setError('Failed to load pool data: ' + error.message);
    }
  };

  useEffect(() => {
    if (isConnected) {
      loadData();
      const interval = setInterval(loadData, 15000);
      return () => clearInterval(interval);
    }
  }, [isConnected, usdcContract, avaContract, poolContract, account]);

  // Get quote from pool directly (fallback method)
  const getQuoteFromPool = async (inputAmount, exactIn = true) => {
    if (!poolContract || !inputAmount || parseFloat(inputAmount) <= 0 || !ethers || !poolInfo || !BigInt) return;

    try {
      setIsQuoting(true);
      
      // Calculate quote using the current pool price
      const sqrtPriceX96 = BigInt(poolInfo.sqrtPriceX96);
      const price = Number(sqrtPriceX96 * sqrtPriceX96 * BigInt(10 ** 18)) / Math.pow(2, 192);
      
      if (exactIn) {
        let outputAmount;
        if (tokenIn === 'USDC') {
          // USDC to AVA: multiply by price ratio
          outputAmount = parseFloat(inputAmount) * price / Math.pow(10, 12); // Adjust for decimal difference
        } else {
          // AVA to USDC: divide by price ratio
          outputAmount = parseFloat(inputAmount) / price * Math.pow(10, 12); // Adjust for decimal difference
        }
        setAmountOut(outputAmount.toFixed(6));
      } else {
        let inputAmountCalc;
        if (tokenOut === 'USDC') {
          // Want USDC: divide by price ratio
          inputAmountCalc = parseFloat(inputAmount) / price * Math.pow(10, 12);
        } else {
          // Want AVA: multiply by price ratio
          inputAmountCalc = parseFloat(inputAmount) * price / Math.pow(10, 12);
        }
        setAmountIn(inputAmountCalc.toFixed(6));
      }
    } catch (error) {
      console.error('Pool quote error:', error);
      setError('Failed to get quote from pool: ' + error.message);
    } finally {
      setIsQuoting(false);
    }
  };

  // Get quote from Uniswap Quoter or Simple Router (primary method)
  const getQuote = async (inputAmount, exactIn = true) => {
    if (!inputAmount || parseFloat(inputAmount) <= 0 || !ethers) return;

    try {
      setIsQuoting(true);
      
      const tokenInAddr = tokens[tokenIn].address;
      const tokenOutAddr = tokens[tokenOut].address;
      
      console.log('Getting quote for:', {
        tokenIn: tokenIn,
        tokenOut: tokenOut,
        tokenInAddr,
        tokenOutAddr,
        inputAmount
      });
      
      // Try simple router first if available
      if (simpleRouterContract && exactIn) {
        try {
          const amountInWei = tokenIn === 'USDC' 
            ? ethers.parseUnits(inputAmount, 6)
            : ethers.parseEther(inputAmount);
          
          console.log('Calling SimpleSwapRouter.getAmountOut with:', {
            tokenInAddr,
            tokenOutAddr,
            amountInWei: amountInWei.toString()
          });
            
          const quote = await simpleRouterContract.getAmountOut(
            tokenInAddr,
            tokenOutAddr,
            amountInWei
          );
          
          console.log('SimpleSwapRouter quote result:', quote.toString());
          
          const formattedOutput = tokenOut === 'USDC'
            ? ethers.formatUnits(quote, 6)
            : ethers.formatEther(quote);
          
          console.log('Formatted output:', formattedOutput);
          
          // If the quote is 0 or very small, fall back to pool calculation
          if (parseFloat(formattedOutput) > 0.000001) {
            setAmountOut(formattedOutput);
            return;
          } else {
            console.log('SimpleSwapRouter returned 0 or very small amount, trying fallback...');
          }
        } catch (e) {
          console.log('Simple router quote failed:', e);
        }
      }
      
      // Try the official Quoter contract
      if (quoterContract) {
        try {
          const fee = poolFee;
          
          if (exactIn) {
            const amountInWei = tokenIn === 'USDC' 
              ? ethers.parseUnits(inputAmount, 6)
              : ethers.parseEther(inputAmount);
              
            const provider = quoterContract.runner.provider;
            const quoterRead = new ethers.Contract(CONTRACTS.QUOTER, QUOTER_ABI, provider);
            
            const quote = await quoterRead.quoteExactInputSingle.staticCall(
              tokenInAddr,
              tokenOutAddr,
              fee,
              amountInWei,
              0
            );
            
            const formattedOutput = tokenOut === 'USDC'
              ? ethers.formatUnits(quote, 6)
              : ethers.formatEther(quote);
              
            setAmountOut(formattedOutput);
            return;
          } else {
            const amountOutWei = tokenOut === 'USDC'
              ? ethers.parseUnits(inputAmount, 6)
              : ethers.parseEther(inputAmount);
              
            const provider = quoterContract.runner.provider;
            const quoterRead = new ethers.Contract(CONTRACTS.QUOTER, QUOTER_ABI, provider);
            
            const quote = await quoterRead.quoteExactOutputSingle.staticCall(
              tokenInAddr,
              tokenOutAddr,
              fee,
              amountOutWei,
              0
            );
            
            const formattedInput = tokenIn === 'USDC'
              ? ethers.formatUnits(quote, 6)
              : ethers.formatEther(quote);
              
            setAmountIn(formattedInput);
            return;
          }
        } catch (e) {
          console.log('Official quoter failed:', e);
        }
      }
      
      // Fallback to simplified calculation based on current market rates
      console.log('Using fallback calculation...');
      await getQuoteFromPool(inputAmount, exactIn);
      
    } catch (error) {
      console.error('Quote error:', error);
      setError('Failed to get quote. Using fallback calculation.');
      // Use fallback even on error
      await getQuoteFromPool(inputAmount, exactIn);
    } finally {
      setIsQuoting(false);
    }
  };

  // Handle amount input changes
  useEffect(() => {
    if (amountIn && isExactIn) {
      const timeoutId = setTimeout(() => getQuote(amountIn, true), 500);
      return () => clearTimeout(timeoutId);
    }
  }, [amountIn, tokenIn, tokenOut, poolFee, isExactIn]);

  useEffect(() => {
    if (amountOut && !isExactIn) {
      const timeoutId = setTimeout(() => getQuote(amountOut, false), 500);
      return () => clearTimeout(timeoutId);
    }
  }, [amountOut, tokenIn, tokenOut, poolFee, isExactIn]);

  // Swap tokens
  const swapTokens = () => {
    const newTokenIn = tokenOut;
    const newTokenOut = tokenIn;
    setTokenIn(newTokenIn);
    setTokenOut(newTokenOut);
    setAmountIn('');
    setAmountOut('');
  };

  // Fund router function
  const fundRouter = async (tokenSymbol) => {
    if (!simpleRouterContract || !account || !ethers) {
      setError('Router not ready');
      return;
    }

    try {
      setIsLoading(true);
      setError('');
      setSuccess(`Funding router with ${tokenSymbol}...`);

      const contract = tokenSymbol === 'USDC' ? usdcContract : avaContract;
      const amount = tokenSymbol === 'USDC' 
        ? ethers.parseUnits('1000', 6) // 1000 USDC
        : ethers.parseEther('1000000'); // 1M AVA
      
      console.log(`Funding router with ${tokenSymbol}:`, amount.toString());
      
      // Check if we have enough tokens
      const balance = await contract.balanceOf(account);
      if (balance < amount) {
        setError(`You need more ${tokenSymbol} tokens. Click "Get Test ${tokenSymbol}" first.`);
        return;
      }
      
      // Approve router to take tokens
      setSuccess(`Step 1/2: Approving ${tokenSymbol} for transfer...`);
      const approveTx = await contract.approve(CONTRACTS.SIMPLE_ROUTER, amount);
      await approveTx.wait();
      
      // Transfer tokens to router
      setSuccess(`Step 2/2: Transferring ${tokenSymbol} to router...`);
      const transferTx = await contract.transfer(CONTRACTS.SIMPLE_ROUTER, amount);
      setTxHash(transferTx.hash);
      await transferTx.wait();
      
      setSuccess(`Successfully funded router with ${ethers.formatUnits(amount, tokenSymbol === 'USDC' ? 6 : 18)} ${tokenSymbol}!`);
      
    } catch (error) {
      console.error('Fund router failed:', error);
      setError('Fund router failed: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };
  const testApproval = async () => {
    if (!simpleRouterContract || !usdcContract || !account || !ethers) {
      setError('Contracts not ready for approval test');
      return;
    }

    try {
      setIsLoading(true);
      setError('');
      setSuccess('Testing USDC approval...');

      const testAmount = ethers.parseUnits('1', 6); // 1 USDC
      
      console.log('=== TESTING APPROVAL ===');
      console.log('Test amount:', testAmount.toString());
      console.log('Router address:', CONTRACTS.SIMPLE_ROUTER);
      console.log('Account:', account);
      
      // Check current allowance
      const currentAllowance = await usdcContract.allowance(account, CONTRACTS.SIMPLE_ROUTER);
      console.log('Current allowance:', currentAllowance.toString());
      
      // Check USDC balance
      const balance = await usdcContract.balanceOf(account);
      console.log('USDC balance:', balance.toString());
      
      if (balance < testAmount) {
        setError('Need test USDC first - click "Get Test USDC"');
        return;
      }
      
      // Try approval
      setSuccess('Sending approval transaction...');
      const approveTx = await usdcContract.approve(CONTRACTS.SIMPLE_ROUTER, testAmount);
      console.log('Approval tx sent:', approveTx.hash);
      setTxHash(approveTx.hash);
      
      const receipt = await approveTx.wait();
      console.log('Approval confirmed:', receipt);
      
      // Check new allowance
      const newAllowance = await usdcContract.allowance(account, CONTRACTS.SIMPLE_ROUTER);
      console.log('New allowance:', newAllowance.toString());
      
      if (newAllowance >= testAmount) {
        setSuccess(`Approval successful! Allowance: ${ethers.formatUnits(newAllowance, 6)} USDC`);
      } else {
        setError('Approval failed - allowance not updated');
      }
      
    } catch (error) {
      console.error('Approval test failed:', error);
      setError('Approval test failed: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };
  const testRouter = async () => {
    if (!simpleRouterContract || !ethers) {
      setError('SimpleSwapRouter not connected');
      return;
    }

    try {
      setIsLoading(true);
      setError('');
      setSuccess('Testing SimpleSwapRouter...');

      // Test 1: Try to get a quote
      console.log('=== TESTING ROUTER ===');
      const testAmount = ethers.parseUnits('1', 6); // 1 USDC
      
      console.log('Testing USDC -> AVA quote for 1 USDC...');
      const quote = await simpleRouterContract.getAmountOut(
        CONTRACTS.USDC,
        CONTRACTS.AVA,
        testAmount
      );
      
      console.log('Raw quote result:', quote.toString());
      const formattedQuote = ethers.formatEther(quote);
      console.log('Formatted quote:', formattedQuote);
      
      setSuccess(`Router test successful! 1 USDC = ${formattedQuote} AVA`);
      
    } catch (error) {
      console.error('Router test failed:', error);
      setError('Router test failed: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };
  const getTestTokens = async (tokenSymbol) => {
    try {
      setIsLoading(true);
      setError('');
      
      const contract = tokenSymbol === 'USDC' ? usdcContract : avaContract;
      const tx = await contract.getTestTokens();
      setTxHash(tx.hash);
      await tx.wait();
      
      setSuccess(`Successfully received test ${tokenSymbol}!`);
      loadData();
    } catch (error) {
      setError(`Failed to get test ${tokenSymbol}: ` + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Execute swap with multiple router options
  const executeSwap = async () => {
    try {
      setIsLoading(true);
      setError('');
      setSuccess('');

      if (!amountIn || !amountOut || parseFloat(amountIn) <= 0) {
        throw new Error('Please enter valid amounts');
      }

      const tokenInAddr = tokens[tokenIn].address;
      const tokenOutAddr = tokens[tokenOut].address;

      // Calculate amounts with slippage
      const slippageMultiplier = 1 - (parseFloat(slippageTolerance) / 100);

      if (isExactIn) {
        const amountInWei = tokenIn === 'USDC' 
          ? ethers.parseUnits(amountIn, 6)
          : ethers.parseEther(amountIn);
          
        const amountOutMinimum = tokenOut === 'USDC'
          ? ethers.parseUnits((parseFloat(amountOut) * slippageMultiplier).toString(), 6)
          : ethers.parseEther((parseFloat(amountOut) * slippageMultiplier).toString());

        // Check and approve tokens
        const tokenInContract = tokenIn === 'USDC' ? usdcContract : avaContract;
        
        // Try Simple Router first if available
        if (simpleRouterContract) {
          try {
            console.log('=== STARTING SWAP WITH SIMPLE ROUTER ===');
            console.log('Token in:', tokenIn, 'Token out:', tokenOut);
            console.log('Amount in:', amountIn, 'Amount in wei:', amountInWei.toString());
            console.log('Amount out minimum:', amountOutMinimum.toString());
            
            // Check current allowance
            const currentAllowance = await tokenInContract.allowance(account, CONTRACTS.SIMPLE_ROUTER);
            console.log('Current allowance:', ethers.formatUnits(currentAllowance, tokenIn === 'USDC' ? 6 : 18));
            console.log('Required amount:', ethers.formatUnits(amountInWei, tokenIn === 'USDC' ? 6 : 18));
            console.log('Allowance sufficient?', currentAllowance >= amountInWei);
            
            if (currentAllowance < amountInWei) {
              setSuccess('Step 1/2: Approving token for Simple Router...');
              console.log('Approving tokens...');
              
              try {
                const approveTx = await tokenInContract.approve(CONTRACTS.SIMPLE_ROUTER, amountInWei);
                console.log('Approval transaction sent:', approveTx.hash);
                setTxHash(approveTx.hash);
                
                const approvalReceipt = await approveTx.wait();
                console.log('Approval confirmed:', approvalReceipt);
                
                // Verify the approval worked
                const newAllowance = await tokenInContract.allowance(account, CONTRACTS.SIMPLE_ROUTER);
                console.log('New allowance after approval:', ethers.formatUnits(newAllowance, tokenIn === 'USDC' ? 6 : 18));
                
                if (newAllowance < amountInWei) {
                  throw new Error('Approval failed - allowance still insufficient');
                }
                
              } catch (approvalError) {
                console.error('Approval failed:', approvalError);
                throw new Error('Token approval failed: ' + approvalError.message);
              }
            } else {
              console.log('Sufficient allowance already exists');
            }

            setSuccess('Step 2/2: Executing swap via Simple Router...');
            console.log('Starting swap transaction...');
            
            // Check token balances before swap
            const balanceBefore = await tokenInContract.balanceOf(account);
            console.log('Token balance before swap:', ethers.formatUnits(balanceBefore, tokenIn === 'USDC' ? 6 : 18));
            
            if (balanceBefore < amountInWei) {
              throw new Error(`Insufficient ${tokenIn} balance. You have ${ethers.formatUnits(balanceBefore, tokenIn === 'USDC' ? 6 : 18)} but need ${ethers.formatUnits(amountInWei, tokenIn === 'USDC' ? 6 : 18)}`);
            }
            
            const swapTx = await simpleRouterContract.exactInputSingle(
              tokenInAddr,
              tokenOutAddr,
              amountInWei,
              amountOutMinimum,
              account
            );
            
            setTxHash(swapTx.hash);
            console.log('Swap transaction sent:', swapTx.hash);
            
            const swapReceipt = await swapTx.wait();
            console.log('Swap confirmed:', swapReceipt);
            
            setSuccess(`Successfully swapped ${amountIn} ${tokenIn} for ${tokenOut}!`);
            setAmountIn('');
            setAmountOut('');
            loadData();
            return;
            
          } catch (simpleRouterError) {
            console.error('Simple router failed:', simpleRouterError);
            
            // Parse specific error messages
            let errorMessage = simpleRouterError.message;
            if (errorMessage.includes('SPL')) {
              errorMessage = 'Sqrt Price Limit error - this suggests a pool pricing issue. Using fallback calculation.';
            } else if (errorMessage.includes('transfer amount exceeds balance')) {
              errorMessage = 'Router doesn\'t have enough tokens. Please fund the router first or use a different approach.';
            }
            
            setError('Simple router failed: ' + errorMessage);
            
            // For testing purposes, let's try the fallback calculation anyway
            console.log('Attempting fallback calculation due to router error...');
            try {
              await getQuoteFromPool(inputAmount, true);
              setSuccess('Using fallback calculation - quotes may not be exact but swaps should work differently.');
            } catch (fallbackError) {
              console.error('Fallback also failed:', fallbackError);
            }
            
            return;
          }
        } else {
          console.log('SimpleSwapRouter not available');
          setError('SimpleSwapRouter not connected');
          return;
        }

        // Try official SwapRouter if available
        if (swapRouterContract) {
          try {
            const allowance = await tokenInContract.allowance(account, CONTRACTS.SWAP_ROUTER);
            
            if (allowance < amountInWei) {
              setSuccess('Step 1/2: Approving token for Uniswap Router...');
              const approveTx = await tokenInContract.approve(CONTRACTS.SWAP_ROUTER, amountInWei);
              await approveTx.wait();
            }

            setSuccess('Step 2/2: Executing swap via Uniswap Router...');
            
            const deadlineTimestamp = Math.floor(Date.now() / 1000) + (parseInt(deadline) * 60);
            
            const swapParams = {
              tokenIn: tokenInAddr,
              tokenOut: tokenOutAddr,
              fee: poolFee,
              recipient: account,
              deadline: deadlineTimestamp,
              amountIn: amountInWei,
              amountOutMinimum: amountOutMinimum,
              sqrtPriceLimitX96: 0
            };

            const swapTx = await swapRouterContract.exactInputSingle(swapParams);
            setTxHash(swapTx.hash);
            await swapTx.wait();
            
            setSuccess(`Successfully swapped ${amountIn} ${tokenIn} for ${tokenOut}!`);
            setAmountIn('');
            setAmountOut('');
            loadData();
            return;
            
          } catch (swapRouterError) {
            console.log('Official SwapRouter failed:', swapRouterError);
            setError('Official Uniswap router failed: ' + swapRouterError.message);
          }
        }

        // If we get here, no routers worked
        if (!simpleRouterContract && !swapRouterContract) {
          setError('No swap routers available. SimpleSwapRouter contract not found at: ' + CONTRACTS.SIMPLE_ROUTER);
        } else {
          setError('All available routers failed. Please check contract addresses and try again.');
        }
      }

    } catch (error) {
      setError('Swap failed: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper functions
  const formatNumber = (num, decimals = 6) => {
    return new Intl.NumberFormat().format(parseFloat(num).toFixed(decimals));
  };

  const getBalance = (symbol) => {
    return symbol === 'USDC' ? usdcBalance : avaBalance;
  };

  const setMaxAmount = () => {
    const balance = getBalance(tokenIn);
    setAmountIn(balance);
    setIsExactIn(true);
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
    <div className="coinbase-bg text-slate-900 font-inter min-h-screen">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-6">
          <Link
            to="/"
            className="inline-flex items-center text-slate-600 hover:text-slate-900 transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
          
          <div className="text-center">
            <h1 className="text-5xl font-bold mb-4 coinbase-title">
              AVALON SWAP
            </h1>
            <p className="text-xl coinbase-subtitle mb-2">Uniswap V3 on Base Sepolia</p>
            <p className="text-lg text-blue-600 font-medium">Trade AVA/USDC</p>
          </div>
        </div>

        {/* Connection Status */}
        {!isConnected ? (
          <div className="max-w-2xl mx-auto mb-8">
            <div className="coinbase-card rounded-2xl p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-6 bg-blue-100 rounded-full flex items-center justify-center">
                <ArrowDownUp className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold mb-3 text-slate-900">Connect Your Wallet</h3>
              <p className="text-slate-600 mb-6 text-lg">Connect to Base Sepolia to start swapping</p>
              <button
                onClick={connectWallet}
                className="coinbase-btn text-white px-8 py-4 rounded-xl font-semibold text-lg"
              >
                Connect MetaMask
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* SimpleSwapRouter Status */}
            {CONTRACTS.SIMPLE_ROUTER === '0x0000000000000000000000000000000000000000' ? (
              <div className="max-w-4xl mx-auto mb-8">
                <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6">
                  <h3 className="text-lg font-bold text-yellow-800 mb-4">
                    🚀 Deploy SimpleSwapRouter to Enable Swapping
                  </h3>
                  <div className="text-yellow-700 space-y-3">
                    <p>
                      Uniswap V3 official contracts might not be available on Base Sepolia. 
                      To enable swapping, you can deploy our custom SimpleSwapRouter contract:
                    </p>
                    <ol className="list-decimal list-inside space-y-2 ml-4">
                      <li>Copy the SimpleSwapRouter.sol contract code</li>
                      <li>Deploy it using Remix IDE with your pool address: <code className="bg-yellow-100 px-2 py-1 rounded">{CONTRACTS.POOL}</code></li>
                      <li>Update the SIMPLE_ROUTER address in the swap page code</li>
                      <li>Restart the application to use the new router</li>
                    </ol>
                    <div className="bg-yellow-100 rounded-lg p-3 mt-4">
                      <p className="font-medium text-yellow-800">Constructor Parameter:</p>
                      <code className="text-sm font-mono break-all">{CONTRACTS.POOL}</code>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="max-w-4xl mx-auto mb-8">
                <div className="bg-green-50 border border-green-200 rounded-2xl p-6">
                  <h3 className="text-lg font-bold text-green-800 mb-4">
                    ✅ SimpleSwapRouter Deployed Successfully!
                  </h3>
                  <div className="text-green-700 space-y-3">
                    <p>
                      Your custom SimpleSwapRouter is deployed and ready for swapping:
                    </p>
                    <div className="bg-green-100 rounded-lg p-3">
                      <p className="font-medium text-green-800">SimpleSwapRouter Address:</p>
                      <a
                        href={`https://sepolia.basescan.org/address/${CONTRACTS.SIMPLE_ROUTER}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-mono break-all text-green-600 hover:text-green-800 inline-flex items-center"
                      >
                        {CONTRACTS.SIMPLE_ROUTER}
                        <ExternalLink className="w-3 h-3 ml-1" />
                      </a>
                    </div>
                    <div className="flex items-center space-x-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span>Connected to your pool: {CONTRACTS.POOL.slice(0, 6)}...{CONTRACTS.POOL.slice(-4)}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Debug Section - Shows what's happening with your router */}
            <div className="max-w-4xl mx-auto mb-8">
              <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4">
                  🔍 Router Debug Information
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="font-medium text-gray-700">SimpleSwapRouter Status:</p>
                      <p className={`${simpleRouterContract ? 'text-green-600' : 'text-red-600'}`}>
                        {simpleRouterContract ? '✅ Connected' : '❌ Not Connected'}
                      </p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-700">Router Address:</p>
                      <a 
                        href={`https://sepolia.basescan.org/address/${CONTRACTS.SIMPLE_ROUTER}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 font-mono text-xs"
                      >
                        {CONTRACTS.SIMPLE_ROUTER}
                      </a>
                    </div>
                  </div>
                  
                  {simpleRouterContract && (
                    <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                      <p className="text-blue-800 text-xs">
                        <strong>Good news:</strong> Your router is connected! If swaps are failing, 
                        it might be a token approval issue or the contract needs more debugging.
                      </p>
                    </div>
                  )}
                  
                  {!simpleRouterContract && (
                    <div className="mt-4 p-3 bg-red-50 rounded-lg">
                      <p className="text-red-800 text-xs">
                        <strong>Issue:</strong> Can't connect to your SimpleSwapRouter. 
                        Please verify the contract is deployed correctly at the address above.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Pool Info */}
            <div className="max-w-4xl mx-auto mb-8">
              <div className="coinbase-card rounded-2xl p-6">
                <h3 className="text-lg font-bold mb-4 text-slate-900">Pool Information</h3>
                <div className="grid md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <p className="text-slate-500 font-medium mb-1">Pool Address</p>
                    <a
                      href={`https://sepolia.basescan.org/address/${CONTRACTS.POOL}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 flex items-center justify-center"
                    >
                      {CONTRACTS.POOL.slice(0, 6)}...{CONTRACTS.POOL.slice(-4)}
                      <ExternalLink className="w-4 h-4 ml-1" />
                    </a>
                  </div>
                  <div className="text-center">
                    <p className="text-slate-500 font-medium mb-1">Fee Tier</p>
                    <p className="font-bold text-slate-900">{parseFloat(poolFee) / 10000}%</p>
                  </div>
                  <div className="text-center">
                    <p className="text-slate-500 font-medium mb-1">Your USDC</p>
                    <p className="font-bold text-green-600">{formatNumber(usdcBalance)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-slate-500 font-medium mb-1">Your AVA</p>
                    <p className="font-bold text-blue-600">{formatNumber(avaBalance)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Test Token Buttons and Router Tests */}
            <div className="max-w-4xl mx-auto mb-8">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
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
                  onClick={() => fundRouter('USDC')}
                  disabled={isLoading || !simpleRouterContract}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-medium transition-colors disabled:opacity-50"
                >
                  Fund Router USDC
                </button>
                <button
                  onClick={() => fundRouter('AVA')}
                  disabled={isLoading || !simpleRouterContract}
                  className="bg-sky-600 hover:bg-sky-700 text-white py-3 rounded-xl font-medium transition-colors disabled:opacity-50"
                >
                  Fund Router AVA
                </button>
                <button
                  onClick={testApproval}
                  disabled={isLoading || !simpleRouterContract}
                  className="bg-orange-600 hover:bg-orange-700 text-white py-3 rounded-xl font-medium transition-colors disabled:opacity-50"
                >
                  Test Approval
                </button>
                <button
                  onClick={testRouter}
                  disabled={isLoading || !simpleRouterContract}
                  className="bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-xl font-medium transition-colors disabled:opacity-50"
                >
                  Test Router
                </button>
              </div>
            </div>

            {/* Swap Interface */}
            <div className="max-w-lg mx-auto mb-8">
              <div className="coinbase-card rounded-2xl p-6">
                {/* Header with settings */}
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-slate-900">Swap</h3>
                  <button
                    onClick={() => setShowSettings(!showSettings)}
                    className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    <Settings className="w-5 h-5 text-slate-600" />
                  </button>
                </div>

                {/* Settings Panel */}
                {showSettings && (
                  <div className="mb-6 p-4 bg-slate-50 rounded-xl">
                    <h4 className="font-bold text-slate-900 mb-3">Swap Settings</h4>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Slippage Tolerance (%)
                        </label>
                        <input
                          type="number"
                          value={slippageTolerance}
                          onChange={(e) => setSlippageTolerance(e.target.value)}
                          className="coinbase-input w-full px-3 py-2 rounded-lg text-sm"
                          step="0.1"
                          min="0.1"
                          max="50"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Transaction Deadline (minutes)
                        </label>
                        <input
                          type="number"
                          value={deadline}
                          onChange={(e) => setDeadline(e.target.value)}
                          className="coinbase-input w-full px-3 py-2 rounded-lg text-sm"
                          min="1"
                          max="60"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Token Input */}
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-sm font-medium text-slate-700">From</label>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-slate-500">
                          Balance: {formatNumber(getBalance(tokenIn))}
                        </span>
                        <button
                          onClick={setMaxAmount}
                          className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded font-medium hover:bg-blue-200 transition-colors"
                        >
                          MAX
                        </button>
                      </div>
                    </div>
                    <div className="relative">
                      <input
                        type="number"
                        value={amountIn}
                        onChange={(e) => {
                          setAmountIn(e.target.value);
                          setIsExactIn(true);
                        }}
                        placeholder="0.0"
                        className="coinbase-input w-full pl-4 pr-20 py-4 rounded-xl text-lg font-medium"
                        disabled={isLoading}
                      />
                      <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                        <select
                          value={tokenIn}
                          onChange={(e) => setTokenIn(e.target.value)}
                          className="bg-slate-100 px-3 py-2 rounded-lg font-bold text-slate-900 border-none outline-none"
                          disabled={isLoading}
                        >
                          <option value="USDC">USDC</option>
                          <option value="AVA">AVA</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Swap Arrow */}
                  <div className="flex justify-center">
                    <button
                      onClick={swapTokens}
                      className="p-3 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors"
                      disabled={isLoading}
                    >
                      <ArrowDownUp className="w-5 h-5 text-slate-600" />
                    </button>
                  </div>

                  {/* Token Output */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-sm font-medium text-slate-700">To</label>
                      <span className="text-sm text-slate-500">
                        Balance: {formatNumber(getBalance(tokenOut))}
                      </span>
                    </div>
                    <div className="relative">
                      <input
                        type="number"
                        value={amountOut}
                        onChange={(e) => {
                          setAmountOut(e.target.value);
                          setIsExactIn(false);
                        }}
                        placeholder="0.0"
                        className="coinbase-input w-full pl-4 pr-20 py-4 rounded-xl text-lg font-medium"
                        disabled={isLoading}
                      />
                      <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                        <select
                          value={tokenOut}
                          onChange={(e) => setTokenOut(e.target.value)}
                          className="bg-slate-100 px-3 py-2 rounded-lg font-bold text-slate-900 border-none outline-none"
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
                        <span className="font-medium text-slate-900">
                          1 {tokenIn} = {(parseFloat(amountOut) / parseFloat(amountIn)).toFixed(6)} {tokenOut}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600">Fee</span>
                        <span className="font-medium text-slate-900">{parseFloat(poolFee) / 10000}%</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600">Slippage</span>
                        <span className="font-medium text-slate-900">{slippageTolerance}%</span>
                      </div>
                    </div>
                  )}

                  {/* Swap Button */}
                  <button
                    onClick={executeSwap}
                    disabled={isLoading || !amountIn || !amountOut || parseFloat(amountIn) <= 0}
                    className="coinbase-btn w-full text-white py-4 rounded-xl font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <span className="flex items-center justify-center">
                        <Loader className="w-5 h-5 mr-3 animate-spin" />
                        {success.includes('Step') ? success : 'Processing...'}
                      </span>
                    ) : (
                      `Swap ${tokenIn} for ${tokenOut}`
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Status Messages */}
            {error && (
              <div className="max-w-lg mx-auto mb-4">
                <div className="error-msg rounded-xl p-4 flex items-center">
                  <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0" />
                  <span className="font-medium">{error}</span>
                </div>
              </div>
            )}

            {success && (
              <div className="max-w-lg mx-auto mb-4">
                <div className="success-msg rounded-xl p-4 flex items-center">
                  <CheckCircle className="w-5 h-5 mr-3 flex-shrink-0" />
                  <span className="font-medium">{success}</span>
                </div>
              </div>
            )}

            {txHash && (
              <div className="max-w-lg mx-auto mb-4">
                <div className="coinbase-card rounded-xl p-4 flex items-center justify-between">
                  <span className="font-medium text-slate-700">Transaction:</span>
                  <a
                    href={`https://sepolia.basescan.org/tx/${txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 flex items-center font-medium"
                  >
                    {txHash.slice(0, 6)}...{txHash.slice(-4)}
                    <ExternalLink className="w-4 h-4 ml-2" />
                  </a>
                </div>
              </div>
            )}

            {/* Warning */}
            <div className="max-w-lg mx-auto">
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                <div className="flex items-start">
                  <Info className="w-5 h-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-yellow-800">Testnet Only</p>
                    <p className="text-yellow-700 text-sm mt-1">
                      This is a testnet environment. All transactions are for testing purposes only.
                      Always verify contract addresses before mainnet deployment.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Contract Information */}
            <div className="max-w-4xl mx-auto mt-8">
              <div className="coinbase-card rounded-2xl p-8">
                <h3 className="text-xl font-bold mb-6 text-slate-900">Contract Addresses (Base Sepolia)</h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="bg-slate-50 rounded-xl p-4">
                      <p className="text-slate-600 font-medium mb-2">AVA Token:</p>
                      <p className="font-mono text-sm text-slate-900 break-all bg-white p-2 rounded border">
                        {CONTRACTS.AVA}
                      </p>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-4">
                      <p className="text-slate-600 font-medium mb-2">USDC Token:</p>
                      <p className="font-mono text-sm text-slate-900 break-all bg-white p-2 rounded border">
                        {CONTRACTS.USDC}
                      </p>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-4">
                      <p className="text-slate-600 font-medium mb-2">Uniswap V3 Pool:</p>
                      <p className="font-mono text-sm text-slate-900 break-all bg-white p-2 rounded border">
                        {CONTRACTS.POOL}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="bg-slate-50 rounded-xl p-4">
                      <p className="text-slate-600 font-medium mb-2">SimpleSwapRouter:</p>
                      <a
                        href={`https://sepolia.basescan.org/address/${CONTRACTS.SIMPLE_ROUTER}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono text-sm text-slate-900 break-all bg-white p-2 rounded border hover:text-blue-600 inline-flex items-center"
                      >
                        {CONTRACTS.SIMPLE_ROUTER}
                        <ExternalLink className="w-3 h-3 ml-1 flex-shrink-0" />
                      </a>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-4">
                      <p className="text-slate-600 font-medium mb-2">Swap Router:</p>
                      <p className="font-mono text-sm text-slate-900 break-all bg-white p-2 rounded border">
                        {CONTRACTS.SWAP_ROUTER}
                      </p>
                    </div>
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4">
                      <h4 className="font-bold text-blue-900 mb-2">Need Help?</h4>
                      <p className="text-blue-800 text-sm mb-3">
                        Make sure you have Base Sepolia ETH for gas fees and test tokens to swap.
                      </p>
                      <a
                        href="https://docs.uniswap.org/contracts/v3/reference/deployments"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium inline-flex items-center"
                      >
                        View Uniswap Docs <ExternalLink className="w-3 h-3 ml-1" />
                      </a>
                    </div>
                  </div>
                </div>
              </div>
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

        .coinbase-input {
          background: #ffffff;
          border: 2px solid #e5e7eb;
          transition: all 0.2s ease;
          font-weight: 500;
        }

        .coinbase-input:focus {
          border-color: #3b82f6;
          outline: none;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
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

        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
      `}</style>
    </div>
  );
}

export default SwapPage;