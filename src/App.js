// src/App.js - Updated with homepage as main route
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { WalletProvider } from './context/WalletContext';
import HomePage from './components/HomePage';
import InvestorDashboard from './components/InvestorDashboard';
import PresaleApp from './components/PresaleApp';
import Navigation from './components/Navigation';

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
            
            {/* Redirect any unknown routes to homepage */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </Router>
    </WalletProvider>
  );
}

export default App;