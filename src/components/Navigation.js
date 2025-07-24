// src/components/Navigation.js - Mobile Responsive Version
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  BarChart3, 
  ShoppingCart, 
  ExternalLink, 
  Wallet, 
  LogOut, 
  Home, 
  ArrowLeftRight,
  Menu,
  X
} from 'lucide-react';
import { useWallet } from '../context/WalletContext';

function Navigation() {
  const location = useLocation();
  const { isConnected, account, connectWallet, disconnectWallet, isLoading } = useWallet();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <nav className="bg-white/95 backdrop-blur-lg border-b border-slate-200 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 sm:space-x-3" onClick={closeMobileMenu}>
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm sm:text-lg">A</span>
            </div>
            <div className="hidden sm:block">
              <h1 className="text-lg sm:text-xl font-bold text-slate-900">AVALON</h1>
              <p className="text-xs text-slate-500 leading-none">Harnessing Volatility</p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-4">
            <Link
              to="/"
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                location.pathname === '/'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Home className="w-4 h-4" />
              <span className="font-medium">Home</span>
            </Link>

            <Link
              to="/dashboard"
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                location.pathname === '/dashboard'
                  ? 'bg-green-100 text-green-700'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span className="font-medium">Dashboard</span>
            </Link>

            <Link
              to="/presale"
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                location.pathname === '/presale'
                  ? 'bg-purple-100 text-purple-700'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <ShoppingCart className="w-4 h-4" />
              <span className="font-medium">Presale</span>
            </Link>

            <Link
              to="/swap"
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                location.pathname === '/swap'
                  ? 'bg-cyan-100 text-cyan-700'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <ArrowLeftRight className="w-4 h-4" />
              <span className="font-medium">Swap</span>
            </Link>

            <a
              href="https://sepolia.basescan.org"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-2 px-3 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              <span className="font-medium">Explorer</span>
            </a>
          </div>

          {/* Mobile & Tablet Menu Button + Wallet */}
          <div className="flex items-center space-x-2">
            {/* Wallet Connection - Always Visible */}
            {isConnected ? (
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-2 bg-green-100 text-green-700 rounded-lg">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-xs sm:text-sm font-medium">
                    {account.slice(0, 4)}...{account.slice(-3)}
                  </span>
                </div>
                <button
                  onClick={disconnectWallet}
                  className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                  title="Disconnect Wallet"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={connectWallet}
                disabled={isLoading}
                className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 text-xs sm:text-sm"
              >
                <Wallet className="w-4 h-4" />
                <span className="font-medium">
                  {isLoading ? 'Connecting...' : 'Connect'}
                </span>
              </button>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={toggleMobileMenu}
              className="lg:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden border-t border-slate-200">
            <div className="py-4 space-y-2">
              <Link
                to="/"
                onClick={closeMobileMenu}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                  location.pathname === '/'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Home className="w-5 h-5" />
                <span className="font-medium">Home</span>
              </Link>

              <Link
                to="/dashboard"
                onClick={closeMobileMenu}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                  location.pathname === '/dashboard'
                    ? 'bg-green-100 text-green-700'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <BarChart3 className="w-5 h-5" />
                <span className="font-medium">Dashboard</span>
              </Link>

              <Link
                to="/presale"
                onClick={closeMobileMenu}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                  location.pathname === '/presale'
                    ? 'bg-purple-100 text-purple-700'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <ShoppingCart className="w-5 h-5" />
                <span className="font-medium">Presale</span>
              </Link>

              <Link
                to="/swap"
                onClick={closeMobileMenu}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                  location.pathname === '/swap'
                    ? 'bg-cyan-100 text-cyan-700'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <ArrowLeftRight className="w-5 h-5" />
                <span className="font-medium">Swap</span>
              </Link>

              <a
                href="https://sepolia.basescan.org"
                target="_blank"
                rel="noopener noreferrer"
                onClick={closeMobileMenu}
                className="flex items-center space-x-3 px-4 py-3 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <ExternalLink className="w-5 h-5" />
                <span className="font-medium">Block Explorer</span>
              </a>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

export default Navigation;