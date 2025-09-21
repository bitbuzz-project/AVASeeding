// src/App.js - Updated with RainbowKit
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { WagmiProvider } from 'wagmi';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import { RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { config } from './config/rainbowkit';
import { WalletProvider } from './context/WalletContext';

import HomePage from './components/HomePage';
import InvestorDashboard from './components/InvestorDashboard';
import PresaleApp from './components/PresaleApp';
import SwapPage from './components/SwapPage';
import Navigation from './components/Navigation';
import AdminPanel from './components/AdminPanel';

const queryClient = new QueryClient();

function App() {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          <WalletProvider>
            <Router>
              <div className="App">
                <Navigation />
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/dashboard" element={<InvestorDashboard />} />
                  <Route path="/presale" element={<PresaleApp />} />
                  <Route path="/swap" element={<SwapPage />} />
                  <Route path="/admin" element={<AdminPanel />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </div>
            </Router>
          </WalletProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export default App;