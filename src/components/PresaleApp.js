// src/App.js
import React, { useState, useEffect } from 'react';
import { AlertCircle, Wallet, ArrowRight, CheckCircle, Loader, ExternalLink } from 'lucide-react';

// Dynamically import ethers to avoid SSR issues
let ethers;
if (typeof window !== 'undefined') {
  ethers = require('ethers');
}

// Contract addresses from your deployment
const CONTRACTS = {
  USDC: '0xd6842B6CfF83784aD53ef9a838F041ac2c337659',
  AVA: '0xA25Fd0C9906d124792b6F1909d3F3b52A4fb98aE',
  SEEDING: '0x507c0270c251C875CB350E6c1E806cb60a9a9970'
};

// ABIs (simplified for the presale functions we need)
const SEEDING_ABI = [
  "function purchaseTokens(uint256 usdcAmount) external",
  "function getQuote(uint256 usdcAmount) external pure returns (uint256)",
  "function seedingActive() external view returns (bool)",
  "function totalSold() external view returns (uint256)",
  "function maximumAllocation() external view returns (uint256)",
  "function minimumPurchase() external view returns (uint256)",
  "function purchasedAmount(address) external view returns (uint256)",
  "function getSeedingProgress() external view returns (uint256, uint256, uint256)"
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

const BASE_TESTNET = {
  chainId: '0x14A34', // 84532
  chainName: 'Base Testnet',
  rpcUrls: ['https://sepolia.base.org'],
  nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
  blockExplorerUrls: ['https://sepolia.basescan.org/']
};

function App() {
  // Wallet connection state
  const [account, setAccount] = useState('');
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [chainId, setChainId] = useState('');

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

  // Transaction state
  const [isLoading, setIsLoading] = useState(false);
  const [txHash, setTxHash] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Connect wallet with enhanced MetaMask detection
  const connectWallet = async () => {
    try {
      // Check if MetaMask is installed
      if (typeof window.ethereum === 'undefined') {
        setError('MetaMask is not installed! Please install MetaMask browser extension.');
        window.open('https://metamask.io/download/', '_blank');
        return;
      }

      // Check if MetaMask is the active provider
      if (!window.ethereum.isMetaMask) {
        setError('Please use MetaMask as your wallet provider.');
        return;
      }

      setIsLoading(true);
      setError('');

      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      });

      if (accounts.length === 0) {
        throw new Error('No accounts found. Please unlock MetaMask.');
      }

      // Create provider and signer
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const network = await provider.getNetwork();

      setAccount(accounts[0]);
      setProvider(provider);
      setSigner(signer);
      setChainId(network.chainId.toString());
      setIsConnected(true);
      setError('');

      // Check if on Base Testnet (84532)
      if (network.chainId.toString() !== '84532') {
        await switchToBaseTestnet();
      } else {
        setSuccess('Successfully connected to Base Testnet!');
      }

    } catch (error) {
      console.error('Connection error:', error);
      setError('Failed to connect: ' + (error.message || 'Unknown error'));
    } finally {
      setIsLoading(false);
    }
  };

  // Switch to Base Testnet with better error handling
  const switchToBaseTestnet = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: BASE_TESTNET.chainId }]
      });
      
      setSuccess('Switched to Base Testnet successfully!');
      
    } catch (error) {
      if (error.code === 4902) {
        // Chain not added to MetaMask, add it
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [BASE_TESTNET]
          });
          setSuccess('Base Testnet added and switched successfully!');
        } catch (addError) {
          setError('Failed to add Base Testnet: ' + addError.message);
        }
      } else {
        setError('Failed to switch network: ' + error.message);
      }
    } finally {
      setIsLoading(false);
    }
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
        
        setSuccess('Contracts initialized successfully!');
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
          setAvaAmount(ethers.formatEther(avaWei));
        } catch (error) {
          console.error('Error calculating AVA amount:', error);
          setAvaAmount('0');
        }
      };
      calculateAva();
    } else {
      setAvaAmount('0');
    }
  }, [usdcAmount, seedingContract]);

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

  // Purchase tokens
  const purchaseTokens = async () => {
    try {
      setIsLoading(true);
      setError('');
      setSuccess('');

      if (!usdcAmount || parseFloat(usdcAmount) <= 0) {
        throw new Error('Please enter a valid USDC amount');
      }

      const usdcWei = ethers.parseUnits(usdcAmount, 6);
      const avaWei = ethers.parseEther(avaAmount);

      // Check minimum purchase
      if (avaWei < ethers.parseEther(minimumPurchase)) {
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

      // Purchase tokens
      setSuccess('Step 2/2: Purchasing AVA tokens...');
      const purchaseTx = await seedingContract.purchaseTokens(usdcWei);
      setTxHash(purchaseTx.hash);
      await purchaseTx.wait();

      setSuccess(`Successfully purchased ${avaAmount} AVA tokens!`);
      setUsdcAmount('');
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

  // MetaMask event listeners
  useEffect(() => {
    if (window.ethereum) {
      const handleAccountsChanged = (accounts) => {
        if (accounts.length === 0) {
          // User disconnected
          setIsConnected(false);
          setAccount('');
          setSigner(null);
          setProvider(null);
          setUsdcContract(null);
          setAvaContract(null);
          setSeedingContract(null);
        } else if (accounts[0] !== account) {
          // User switched accounts
          connectWallet();
        }
      };

      const handleChainChanged = () => {
        // Reload the page on chain change
        window.location.reload();
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);

      return () => {
        if (window.ethereum.removeListener) {
          window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
          window.ethereum.removeListener('chainChanged', handleChainChanged);
        }
      };
    }
  }, [account]);

  // Auto-connect if already connected
  useEffect(() => {
    const autoConnect = async () => {
      if (window.ethereum && window.ethereum.selectedAddress) {
        try {
          const accounts = await window.ethereum.request({
            method: 'eth_accounts'
          });
          if (accounts.length > 0) {
            connectWallet();
          }
        } catch (error) {
          console.log('Auto-connect failed:', error);
        }
      }
    };

    autoConnect();
  }, []);

  return (
    <div className="coinbase-bg text-slate-900 font-inter min-h-screen">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-6xl font-bold mb-4 coinbase-title">
            AVALON TOKEN
          </h1>
          <p className="text-xl coinbase-subtitle mb-2">Harnessing Volatility for Steady Returns</p>
          <p className="text-lg text-blue-600 font-medium">Presale on Base Testnet</p>
        </div>

        {/* Connection Status */}
        <div className="max-w-4xl mx-auto mb-8">
          {!isConnected ? (
            <div className="coinbase-card rounded-2xl p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-6 bg-blue-100 rounded-full flex items-center justify-center">
                <Wallet className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold mb-3 text-slate-900">Connect Your Wallet</h3>
              <p className="text-slate-600 mb-6 text-lg">Connect MetaMask to Base Testnet to participate in the presale</p>
              <button
                onClick={connectWallet}
                disabled={isLoading}
                className="coinbase-btn text-white px-8 py-4 rounded-xl font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center"
              >
                {isLoading ? (
                  <>
                    <Loader className="w-5 h-5 mr-3 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Wallet className="w-5 h-5 mr-3" />
                    Connect MetaMask
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="coinbase-card border-green-200 bg-green-50 rounded-2xl p-4 text-center">
              <div className="flex items-center justify-center">
                <CheckCircle className="w-6 h-6 mr-3 text-green-600" />
                <span className="text-green-800 font-semibold">
                  Connected: {account.slice(0, 6)}...{account.slice(-4)}
                </span>
              </div>
            </div>
          )}
        </div>

        {isConnected && (
          <>
            {/* Progress Section */}
            <div className="max-w-4xl mx-auto mb-8">
              <div className="coinbase-card rounded-2xl p-8">
                <h3 className="text-2xl font-bold mb-6 text-slate-900">Presale Progress</h3>
                <div className="bg-slate-200 rounded-full h-3 mb-6">
                  <div
                    className="progress-bar h-3 rounded-full transition-all duration-500"
                    style={{ width: `${progressPercent}%` }}
                  ></div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="text-center">
                    <p className="text-slate-500 font-medium mb-1">Sold</p>
                    <p className="text-xl font-bold text-slate-900">{formatNumber(totalSold)}</p>
                    <p className="text-sm text-slate-500">AVA</p>
                  </div>
                  <div className="text-center">
                    <p className="text-slate-500 font-medium mb-1">Total</p>
                    <p className="text-xl font-bold text-slate-900">{formatNumber(maxAllocation)}</p>
                    <p className="text-sm text-slate-500">AVA</p>
                  </div>
                  <div className="text-center">
                    <p className="text-slate-500 font-medium mb-1">Progress</p>
                    <p className="text-xl font-bold text-blue-600">{progressPercent}%</p>
                  </div>
                  <div className="text-center">
                    <p className="text-slate-500 font-medium mb-1">Status</p>
                    <p className={`text-xl font-bold ${seedingActive ? 'text-green-600' : 'text-red-500'}`}>
                      {seedingActive ? 'Active' : 'Inactive'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Balance Cards */}
            <div className="max-w-4xl mx-auto mb-8">
              <div className="grid md:grid-cols-3 gap-6">
                <div className="balance-card rounded-2xl p-6 text-center">
                  <div className="w-12 h-12 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-green-600 font-bold text-lg">$</span>
                  </div>
                  <h3 className="text-lg font-semibold mb-2 text-slate-700">Your USDC</h3>
                  <p className="text-3xl font-bold text-green-600 mb-4">{formatNumber(usdcBalance)}</p>
                  <button
                    onClick={getTestUSDC}
                    disabled={isLoading}
                    className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
                  >
                    Get Test USDC
                  </button>
                </div>
                
                <div className="balance-card rounded-2xl p-6 text-center">
                  <div className="w-12 h-12 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-bold text-lg">A</span>
                  </div>
                  <h3 className="text-lg font-semibold mb-2 text-slate-700">Your AVA</h3>
                  <p className="text-3xl font-bold text-blue-600">{formatNumber(avaBalance)}</p>
                </div>
                
                <div className="balance-card rounded-2xl p-6 text-center">
                  <div className="w-12 h-12 mx-auto mb-4 bg-cyan-100 rounded-full flex items-center justify-center">
                    <span className="text-cyan-600 font-bold text-lg">P</span>
                  </div>
                  <h3 className="text-lg font-semibold mb-2 text-slate-700">You Purchased</h3>
                  <p className="text-3xl font-bold text-cyan-600">{formatNumber(userPurchased)}</p>
                </div>
              </div>
            </div>

            {/* Purchase Interface */}
            <div className="max-w-2xl mx-auto mb-8">
              <div className="coinbase-card rounded-2xl p-8">
                <h3 className="text-2xl font-bold mb-8 text-slate-900">Purchase AVA Tokens</h3>
                
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold mb-3 text-slate-700">USDC Amount</label>
                    <input
                      type="number"
                      value={usdcAmount}
                      onChange={(e) => setUsdcAmount(e.target.value)}
                      placeholder="Enter USDC amount"
                      className="coinbase-input w-full rounded-xl px-4 py-4 text-slate-900 placeholder-slate-400 text-lg"
                      disabled={!seedingActive || isLoading}
                    />
                  </div>

                  <div className="flex items-center justify-center py-4">
                    <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center">
                      <ArrowRight className="w-5 h-5 text-slate-600" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-3 text-slate-700">AVA Tokens You'll Receive</label>
                    <input
                      type="text"
                      value={formatNumber(avaAmount)}
                      readOnly
                      className="coinbase-input w-full rounded-xl px-4 py-4 text-slate-900 text-lg bg-slate-50"
                    />
                  </div>

                  <div className="bg-blue-50 rounded-xl p-4 text-center">
                    <p className="text-blue-800 font-medium">Rate: 1 USDC = 1 AVA</p>
                    <p className="text-blue-600 text-sm mt-1">Minimum: {formatNumber(minimumPurchase)} AVA</p>
                  </div>

                  <button
                    onClick={purchaseTokens}
                    disabled={!seedingActive || isLoading || !usdcAmount || parseFloat(usdcAmount) <= 0}
                    className="coinbase-btn w-full text-white py-5 rounded-xl font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <span className="flex items-center justify-center">
                        <Loader className="w-5 h-5 mr-3 animate-spin" />
                        Processing...
                      </span>
                    ) : (
                      'Purchase AVA Tokens'
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Status Messages */}
            {error && (
              <div className="max-w-2xl mx-auto mb-4">
                <div className="error-msg rounded-xl p-4 flex items-center">
                  <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0" />
                  <span className="font-medium">{error}</span>
                </div>
              </div>
            )}

            {success && (
              <div className="max-w-2xl mx-auto mb-4">
                <div className="success-msg rounded-xl p-4 flex items-center">
                  <CheckCircle className="w-5 h-5 mr-3 flex-shrink-0" />
                  <span className="font-medium">{success}</span>
                </div>
              </div>
            )}

            {txHash && (
              <div className="max-w-2xl mx-auto mb-4">
                <div className="coinbase-card rounded-xl p-4 flex items-center justify-between">
                  <span className="font-medium text-slate-700">Transaction Hash:</span>
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

            {/* Contract Addresses */}
            <div className="max-w-4xl mx-auto">
              <div className="coinbase-card rounded-2xl p-8">
                <h3 className="text-xl font-bold mb-6 text-slate-900">Contract Addresses (Base Testnet)</h3>
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="bg-slate-50 rounded-xl p-4">
                    <p className="text-slate-600 font-medium mb-2">AVA Token:</p>
                    <p className="font-mono text-sm text-slate-900 break-all bg-white p-2 rounded border">{CONTRACTS.AVA}</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-4">
                    <p className="text-slate-600 font-medium mb-2">USDC Token:</p>
                    <p className="font-mono text-sm text-slate-900 break-all bg-white p-2 rounded border">{CONTRACTS.USDC}</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-4">
                    <p className="text-slate-600 font-medium mb-2">Seeding Contract:</p>
                    <p className="font-mono text-sm text-slate-900 break-all bg-white p-2 rounded border">{CONTRACTS.SEEDING}</p>
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

export default App;