// src/components/AdminPanel.js - Updated with Strategy Monitor
import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  LogOut, 
  Settings, 
  BarChart3, 
  Users, 
  DollarSign, 
  Activity,
  Eye,
  AlertTriangle,
  Menu,
  X
} from 'lucide-react';
import InvestmentDashboard from './admin/InvestmentDashboard';
import InvestorManagement from './admin/InvestorManagement';
import StrategyMonitor from './admin/StrategyMonitor';
// Admin authentication utility
const AdminAuth = {
  login: (password) => {
    // In production, this should be a proper authentication system
    const correctPassword = 'avalon2025admin'; // Change this to your secure password
    if (password === correctPassword) {
      localStorage.setItem('admin_authenticated', 'true');
      localStorage.setItem('admin_session', Date.now().toString());
      return true;
    }
    return false;
  },
  
  logout: () => {
    localStorage.removeItem('admin_authenticated');
    localStorage.removeItem('admin_session');
  },
  
  isAuthenticated: () => {
    const authenticated = localStorage.getItem('admin_authenticated') === 'true';
    const session = localStorage.getItem('admin_session');
    
    if (!authenticated || !session) return false;
    
    // Check if session is less than 24 hours old
    const sessionTime = parseInt(session);
    const now = Date.now();
    const twentyFourHours = 24 * 60 * 60 * 1000;
    
    if (now - sessionTime > twentyFourHours) {
      AdminAuth.logout();
      return false;
    }
    
    return true;
  }
};

// Admin Login Component
const AdminLogin = ({ onLogin }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Simulate network delay
    setTimeout(() => {
      if (AdminAuth.login(password)) {
        onLogin();
      } else {
        setError('Invalid password. Access denied.');
      }
      setIsLoading(false);
      setPassword('');
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-blue-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-8 shadow-2xl w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
            <Shield className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Avalon Admin Panel</h1>
          <p className="text-slate-600">Enter admin password to continue</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Admin Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="Enter admin password"
              required
              disabled={isLoading}
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <span className="text-red-800 text-sm font-medium">{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || !password}
            className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Authenticating...' : 'Access Admin Panel'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-xs text-slate-500">
            Authorized personnel only. All access is logged and monitored.
          </p>
        </div>
      </div>
    </div>
  );
};

// Main Admin Panel Component
const AdminPanel = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Check authentication on mount
  useEffect(() => {
    setIsAuthenticated(AdminAuth.isAuthenticated());
  }, []);

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    AdminAuth.logout();
    setIsAuthenticated(false);
    setActiveTab('dashboard');
  };

  // Navigation items
  const navItems = [
    { id: 'dashboard', label: 'Investment Dashboard', icon: BarChart3 },
    { id: 'investors', label: 'Investor Management', icon: Users },
    { id: 'strategies', label: 'Strategy Monitor', icon: Activity },
    { id: 'revenue', label: 'Revenue Analytics', icon: DollarSign },
    { id: 'system', label: 'System Health', icon: Eye },
    { id: 'settings', label: 'Admin Settings', icon: Settings }
  ];

  // If not authenticated, show login
  if (!isAuthenticated) {
    return <AdminLogin onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Admin Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo and Title */}
            <div className="flex items-center">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"
              >
                {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
              <div className="flex items-center ml-2 lg:ml-0">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-slate-900">Avalon Admin</h1>
                  <p className="text-xs text-slate-500 hidden sm:block">Investment Management System</p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-green-100 text-green-700 rounded-lg">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium">System Online</span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-3 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="lg:hidden border-t border-slate-200 bg-white">
            <div className="px-4 py-2 space-y-1">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                    activeTab === item.id
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </header>

      <div className="flex">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:block w-64 bg-white border-r border-slate-200 min-h-screen">
          <nav className="p-4 space-y-2">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                  activeTab === item.id
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </button>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          {/* Dashboard Content */}
          {activeTab === 'dashboard' && <InvestmentDashboard />}
          
          {/* Investor Management */}
          {activeTab === 'investors' && <InvestorManagement />}
          
          {/* Strategy Monitor - NEW */}
          {activeTab === 'strategies' && <StrategyMonitor />}
          
          {/* Placeholder for other tabs */}
          {activeTab === 'revenue' && (
            <div className="bg-white rounded-xl p-8 shadow-lg">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">Revenue Analytics</h2>
              <p className="text-slate-600">Advanced revenue analytics interface will be implemented in the next step.</p>
            </div>
          )}
          
          {activeTab === 'system' && (
            <div className="bg-white rounded-xl p-8 shadow-lg">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">System Health</h2>
              <p className="text-slate-600">System health monitoring will be implemented in the next step.</p>
            </div>
          )}
          
          {activeTab === 'settings' && (
            <div className="bg-white rounded-xl p-8 shadow-lg">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">Admin Settings</h2>
              <p className="text-slate-600">Admin settings interface will be implemented in the next step.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default AdminPanel;