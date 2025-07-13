// src/App.js - Main application with routing and wallet context
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { WalletProvider } from './context/WalletContext';
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
            {/* Main page - Investor Dashboard */}
            <Route path="/" element={<InvestorDashboard />} />
            
            {/* Presale route */}
            <Route path="/presale" element={<PresaleApp />} />
            
            {/* Redirect any unknown routes to main page */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </Router>
    </WalletProvider>
  );
}

export default App;