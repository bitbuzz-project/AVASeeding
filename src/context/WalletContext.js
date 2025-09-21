// src/context/WalletContext.js - Updated for RainbowKit
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAccount, useWalletClient, usePublicClient } from 'wagmi';
import { BrowserProvider } from 'ethers';

const WalletContext = createContext();

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};

export const WalletProvider = ({ children }) => {
  const { address, isConnected, chain } = useAccount();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Convert walletClient to ethers provider and signer
  useEffect(() => {
    const setupEthers = async () => {
      if (walletClient && window.ethereum) {
        try {
          const ethersProvider = new BrowserProvider(window.ethereum);
          const ethersSigner = await ethersProvider.getSigner();
          
          setProvider(ethersProvider);
          setSigner(ethersSigner);
        } catch (error) {
          console.error('Error setting up ethers:', error);
          setError('Failed to setup provider');
        }
      } else {
        setProvider(null);
        setSigner(null);
      }
    };

    setupEthers();
  }, [walletClient]);

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
    account: address || '',
    provider,
    signer,
    isConnected,
    chainId: chain?.id?.toString() || '',
    isLoading: false, // RainbowKit handles loading states
    error,
    success,
    
    // Functions (kept for backward compatibility)
    connectWallet: () => {
      // RainbowKit handles this with their modal
      console.log('Use RainbowKit ConnectButton instead');
    },
    disconnectWallet: () => {
      // RainbowKit handles this with their modal
      console.log('Use RainbowKit ConnectButton instead');
    },
    switchToBaseTestnet: () => {
      // RainbowKit handles network switching
      console.log('RainbowKit handles network switching');
    },
    setError,
    setSuccess
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
};