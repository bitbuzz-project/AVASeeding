// src/context/WalletContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';

// Dynamically import ethers to avoid SSR issues
let ethers;
if (typeof window !== 'undefined') {
  ethers = require('ethers');
}

const BASE_TESTNET = {
  chainId: '0x14A34', // 84532
  chainName: 'Base Testnet',
  rpcUrls: ['https://sepolia.base.org'],
  nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
  blockExplorerUrls: ['https://sepolia.basescan.org/']
};

// Create the context
const WalletContext = createContext();

// Custom hook to use the wallet context
export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};

// WalletProvider component
export const WalletProvider = ({ children }) => {
  // Wallet connection state
  const [account, setAccount] = useState('');
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [chainId, setChainId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Connect wallet function
  const connectWallet = async () => {
    try {
      if (typeof window.ethereum === 'undefined') {
        setError('MetaMask is not installed! Please install MetaMask browser extension.');
        window.open('https://metamask.io/download/', '_blank');
        return;
      }

      if (!window.ethereum.isMetaMask) {
        setError('Please use MetaMask as your wallet provider.');
        return;
      }

      setIsLoading(true);
      setError('');

      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      });

      if (accounts.length === 0) {
        throw new Error('No accounts found. Please unlock MetaMask.');
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const network = await provider.getNetwork();

      setAccount(accounts[0]);
      setProvider(provider);
      setSigner(signer);
      setChainId(network.chainId.toString());
      setIsConnected(true);
      setError('');

      // Store connection status in localStorage
      localStorage.setItem('wallet_connected', 'true');
      localStorage.setItem('wallet_account', accounts[0]);

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

  // Disconnect wallet function
  const disconnectWallet = () => {
    setAccount('');
    setProvider(null);
    setSigner(null);
    setIsConnected(false);
    setChainId('');
    setError('');
    setSuccess('');
    
    // Clear localStorage
    localStorage.removeItem('wallet_connected');
    localStorage.removeItem('wallet_account');
  };

  // Switch to Base Testnet
  const switchToBaseTestnet = async () => {
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: BASE_TESTNET.chainId }]
      });
      setSuccess('Switched to Base Testnet successfully!');
    } catch (error) {
      if (error.code === 4902) {
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
    }
  };

  // Auto-connect on page load if previously connected
  useEffect(() => {
    const autoConnect = async () => {
      const wasConnected = localStorage.getItem('wallet_connected');
      const lastAccount = localStorage.getItem('wallet_account');
      
      if (wasConnected === 'true' && window.ethereum && window.ethereum.selectedAddress) {
        try {
          const accounts = await window.ethereum.request({
            method: 'eth_accounts'
          });
          
          if (accounts.length > 0 && accounts[0] === lastAccount) {
            await connectWallet();
          } else {
            // Clear localStorage if accounts don't match
            localStorage.removeItem('wallet_connected');
            localStorage.removeItem('wallet_account');
          }
        } catch (error) {
          console.log('Auto-connect failed:', error);
          localStorage.removeItem('wallet_connected');
          localStorage.removeItem('wallet_account');
        }
      }
    };

    if (window.ethereum) {
      autoConnect();
    }
  }, []);

  // MetaMask event listeners
  useEffect(() => {
    if (window.ethereum) {
      const handleAccountsChanged = (accounts) => {
        if (accounts.length === 0) {
          // User disconnected
          disconnectWallet();
        } else if (accounts[0] !== account && account !== '') {
          // User switched accounts
          connectWallet();
        }
      };

      const handleChainChanged = () => {
        // Reload the page on chain change for simplicity
        window.location.reload();
      };

      const handleDisconnect = () => {
        disconnectWallet();
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);
      window.ethereum.on('disconnect', handleDisconnect);

      return () => {
        if (window.ethereum.removeListener) {
          window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
          window.ethereum.removeListener('chainChanged', handleChainChanged);
          window.ethereum.removeListener('disconnect', handleDisconnect);
        }
      };
    }
  }, [account]);

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

  const value = {
    // State
    account,
    provider,
    signer,
    isConnected,
    chainId,
    isLoading,
    error,
    success,
    
    // Functions
    connectWallet,
    disconnectWallet,
    switchToBaseTestnet,
    setError,
    setSuccess
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
};