// src/components/Navigation.js - MOBILE-OPTIMIZED VERSION
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
        <div className="flex items-center justify-between h-14 sm:h-16">
          {/* Logo - MOBILE OPTIMIZED */}
          <Link to="/" className="flex items-center space-x-2" onClick={closeMobileMenu}>
            <div className="w-7 h-7 sm:w-8 sm:h-8 lg:w-10 lg:h-10 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xs sm:text-sm lg:text-lg">A</span>
            </div>
            <div className="hidden sm:block">
              <h1 className="text-base sm:text-lg lg:text-xl font-bold text-slate-900">AVALON</h1>
              <p className="text-xs text-slate-500 leading-none">Harnessing Volatility</p>
            </div>
          </Link>

          {/* Desktop Navigation - Hidden on mobile/tablet */}
          <div className="hidden xl:flex items-center space-x-3">
            <Link
              to="/"
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors text-sm font-medium ${
                location.pathname === '/'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Home className="w-4 h-4" />
              <span>Home</span>
            </Link>

            <Link
              to="/dashboard"
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors text-sm font-medium ${
                location.pathname === '/dashboard'
                  ? 'bg-green-100 text-green-700'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Dashboard</span>
            </Link>

            <Link
              to="/presale"
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors text-sm font-medium ${
                location.pathname === '/presale'
                  ? 'bg-purple-100 text-purple-700'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <ShoppingCart className="w-4 h-4" />
              <span>Presale</span>
            </Link>

            <Link
              to="/swap"
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors text-sm font-medium ${
                location.pathname === '/swap'
                  ? 'bg-cyan-100 text-cyan-700'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <ArrowLeftRight className="w-4 h-4" />
              <span>Swap</span>
            </Link>

            <a
              href="https://sepolia.basescan.org"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-2 px-3 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors text-sm font-medium"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Explorer</span>
            </a>
          </div>

          {/* Mobile & Tablet Menu Button + Wallet */}
          <div className="flex items-center space-x-2">
            {/* Wallet Connection - MOBILE OPTIMIZED */}
            {isConnected ? (
              <div className="flex items-center space-x-1 sm:space-x-2">
                <div className="flex items-center space-x-1 px-2 py-1.5 sm:px-3 sm:py-2 bg-green-100 text-green-700 rounded-lg">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-xs sm:text-sm font-medium">
                    {account.slice(0, 4)}...{account.slice(-3)}
                  </span>
                </div>
                <button
                  onClick={disconnectWallet}
                  className="p-1.5 sm:p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                  title="Disconnect Wallet"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={connectWallet}
                disabled={isLoading}
                className="flex items-center space-x-1 px-2 sm:px-3 py-1.5 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 text-xs sm:text-sm font-medium min-h-[36px] sm:min-h-[40px]"
              >
                <Wallet className="w-3 h-3 sm:w-4 sm:h-4" />
                <span>
                  {isLoading ? 'Connecting...' : 'Connect'}
                </span>
              </button>
            )}

            {/* Mobile Menu Button - Show on mobile and tablet */}
            <button
              onClick={toggleMobileMenu}
              className="xl:hidden p-1.5 sm:p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors min-h-[36px] min-w-[36px] sm:min-h-[40px] sm:min-w-[40px] flex items-center justify-center"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu - MOBILE OPTIMIZED */}
        {isMobileMenuOpen && (
          <div className="xl:hidden border-t border-slate-200 bg-white/95 backdrop-blur-lg">
            <div className="py-3 space-y-1">
              <Link
                to="/"
                onClick={closeMobileMenu}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors mx-2 ${
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
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors mx-2 ${
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
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors mx-2 ${
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
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors mx-2 ${
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
                className="flex items-center space-x-3 px-4 py-3 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors mx-2"
              >
                <ExternalLink className="w-5 h-5" />
                <span className="font-medium">Block Explorer</span>
              </a>

              {/* Mobile-only wallet section */}
              {!isConnected && (
                <div className="px-2 pt-2 border-t border-slate-200 mt-3">
                  <button
                    onClick={() => {
                      connectWallet();
                      closeMobileMenu();
                    }}
                    disabled={isLoading}
                    className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 font-medium"
                  >
                    <Wallet className="w-5 h-5" />
                    <span>{isLoading ? 'Connecting...' : 'Connect Wallet'}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

export default Navigation;