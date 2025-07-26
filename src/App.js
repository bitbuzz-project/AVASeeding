// src/App.js - Updated with swap route
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { WalletProvider } from './context/WalletContext';
import HomePage from './components/HomePage';
import InvestorDashboard from './components/InvestorDashboard';
import PresaleApp from './components/PresaleApp';
import SwapPage from './components/SwapPage';
import Navigation from './components/Navigation';
import AdminPanel from './components/AdminPanel';

function App() {
  return (
    <WalletProvider>
      <Router>
        <div className="App">
          <Navigation />
          <Routes>
            {/* Homepage as main route */}
            <Route path="/" element={<HomePage />} />
            
            {/* Dashboard route */}
            <Route path="/dashboard" element={<InvestorDashboard />} />
            
            {/* Presale route */}
            <Route path="/presale" element={<PresaleApp />} />
            
            {/* Swap route */}
            <Route path="/swap" element={<SwapPage />} />
            
            {/* Swap route */}
            <Route path="/admin" element={<AdminPanel />} />

            {/* Redirect any unknown routes to homepage */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </Router>
    </WalletProvider>
  );
}

export default App;