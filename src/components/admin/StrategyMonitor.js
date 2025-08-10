// src/components/admin/StrategyMonitor.js - UPDATED VERSION
import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  TrendingUp, 
  TrendingDown,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  BarChart3,
  DollarSign,
  Target,
  Zap,
  Timer,
  Settings
} from 'lucide-react';

const StrategyMonitor = () => {
  const [strategies, setStrategies] = useState({
    bitcoin: {
      name: 'Bitcoin Strategy (B-MERS)',
      allocation: 35,
      currentExposure: 68.5,
      targetExposure: 70,
      rebalanceThreshold: 9,
      apy: 21.1,
      status: 'active',
      health: 'excellent',
      lastRebalance: '2 hours ago',
      totalTrades: 847,
      successRate: 92.3,
      isRebalanceNeeded: false
    },
    baseLP: {
      name: 'Base Ecosystem LP',
      allocation: 45,
      activePairs: 8,
      averageAPR: 42.7,
      topPair: 'WETH/REI - 78.2%',
      totalTVL: 1250000,
      fees24h: 3850,
      status: 'active',
      health: 'excellent'
    },
    tokenLiquidity: {
      name: 'Token Liquidity Management',
      allocation: 20,
      currentPrice: 1.23,
      liquidityDepth: 125000,
      ratchetLevel: 6,
      nextTarget: 1.30,
      volume24h: 89000,
      status: 'active',
      health: 'good'
    }
  });

  const [systemMetrics, setSystemMetrics] = useState({
    totalAllocation: 5000000,
    combinedAPY: 31.4,
    totalProfit: 156780,
    activeBots: 5,
    systemUptime: 99.97,
    lastUpdate: new Date()
  });

  const [refreshing, setRefreshing] = useState(false);

  // Simulate data refresh
  const refreshData = async () => {
    setRefreshing(true);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Update with slight variations to simulate real data
    setStrategies(prev => ({
      ...prev,
      bitcoin: {
        ...prev.bitcoin,
        currentExposure: 70 + (Math.random() - 0.5) * 4,
        apy: 21.1 + (Math.random() - 0.5) * 2,
        totalTrades: prev.bitcoin.totalTrades + Math.floor(Math.random() * 3),
        isRebalanceNeeded: Math.random() > 0.8
      },
      baseLP: {
        ...prev.baseLP,
        averageAPR: 42.7 + (Math.random() - 0.5) * 10,
        fees24h: 3850 + Math.floor((Math.random() - 0.5) * 1000)
      },
      tokenLiquidity: {
        ...prev.tokenLiquidity,
        currentPrice: 1.23 + (Math.random() - 0.5) * 0.1,
        volume24h: 89000 + Math.floor((Math.random() - 0.5) * 20000)
      }
    }));

    setSystemMetrics(prev => ({
      ...prev,
      combinedAPY: 31.4 + (Math.random() - 0.5) * 3,
      totalProfit: prev.totalProfit + Math.floor(Math.random() * 1000),
      lastUpdate: new Date()
    }));

    setRefreshing(false);
  };

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(refreshData, 30000);
    return () => clearInterval(interval);
  }, []);

  const formatNumber = (num, decimals = 2) => {
    return new Intl.NumberFormat().format(parseFloat(num).toFixed(decimals));
  };

  const formatCurrency = (num) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(num);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Strategy Monitor</h2>
          <p className="text-slate-600 mt-1">Real-time performance tracking and system health</p>
        </div>
        <button
          onClick={refreshData}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* System Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-green-600" />
            </div>
            <TrendingUp className="w-4 h-4 text-green-500" />
          </div>
          <p className="text-2xl font-bold text-slate-900">{formatCurrency(systemMetrics.totalAllocation)}</p>
          <p className="text-slate-600 font-medium">Total AUM</p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-blue-600" />
            </div>
            <TrendingUp className="w-4 h-4 text-green-500" />
          </div>
          <p className="text-2xl font-bold text-slate-900">{formatNumber(systemMetrics.combinedAPY)}%</p>
          <p className="text-slate-600 font-medium">Combined APY</p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
              <Target className="w-5 h-5 text-purple-600" />
            </div>
            <TrendingUp className="w-4 h-4 text-green-500" />
          </div>
          <p className="text-2xl font-bold text-slate-900">{formatCurrency(systemMetrics.totalProfit)}</p>
          <p className="text-slate-600 font-medium">Total Profit</p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-cyan-100 rounded-full flex items-center justify-center">
              <Activity className="w-5 h-5 text-cyan-600" />
            </div>
            <CheckCircle className="w-4 h-4 text-green-500" />
          </div>
          <p className="text-2xl font-bold text-slate-900">{systemMetrics.activeBots}/5</p>
          <p className="text-slate-600 font-medium">Active Bots</p>
        </div>
      </div>

      {/* Strategy Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Bitcoin Strategy (B-MERS) */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">Bitcoin Strategy</h3>
              <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                strategies.bitcoin.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {strategies.bitcoin.status.toUpperCase()}
              </div>
            </div>
            <p className="text-blue-100 text-sm">B-MERS • {strategies.bitcoin.allocation}% Allocation</p>
          </div>

          <div className="p-6 space-y-4">
            {/* Performance Metrics */}
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">{formatNumber(strategies.bitcoin.apy)}%</p>
                <p className="text-green-800 text-sm font-medium">Current APY</p>
              </div>
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">{formatNumber(strategies.bitcoin.successRate)}%</p>
                <p className="text-blue-800 text-sm font-medium">Success Rate</p>
              </div>
            </div>

            {/* Exposure Tracking */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-slate-700">Current Exposure</span>
                <span className="text-sm font-bold text-slate-900">
                  {formatNumber(strategies.bitcoin.currentExposure)}% / {strategies.bitcoin.targetExposure}%
                </span>
              </div>
              <div className="bg-slate-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${(strategies.bitcoin.currentExposure / strategies.bitcoin.targetExposure) * 100}%` }}
                ></div>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Rebalance threshold: ±{strategies.bitcoin.rebalanceThreshold}%
              </p>
            </div>

            {/* Status Indicators */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Total Trades</span>
                <span className="font-medium">{formatNumber(strategies.bitcoin.totalTrades, 0)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Last Rebalance</span>
                <span className="font-medium">{strategies.bitcoin.lastRebalance}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Rebalance Needed</span>
                <div className="flex items-center">
                  {strategies.bitcoin.isRebalanceNeeded ? (
                    <>
                      <AlertCircle className="w-4 h-4 text-yellow-500 mr-1" />
                      <span className="text-yellow-600 font-medium">Yes</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 text-green-500 mr-1" />
                      <span className="text-green-600 font-medium">No</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {strategies.bitcoin.isRebalanceNeeded && (
              <button className="w-full bg-yellow-100 text-yellow-800 py-2 px-4 rounded-lg font-medium hover:bg-yellow-200 transition-colors">
                Trigger Manual Rebalance
              </button>
            )}
          </div>
        </div>

        {/* Base Ecosystem LP */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-green-500 to-green-600 p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">Base Ecosystem LP</h3>
              <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                strategies.baseLP.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {strategies.baseLP.status.toUpperCase()}
              </div>
            </div>
            <p className="text-green-100 text-sm">Liquidity Provision • {strategies.baseLP.allocation}% Allocation</p>
          </div>

          <div className="p-6 space-y-4">
            {/* Performance Metrics */}
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">{formatNumber(strategies.baseLP.averageAPR)}%</p>
                <p className="text-green-800 text-sm font-medium">Average APR</p>
              </div>
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">{strategies.baseLP.activePairs}</p>
                <p className="text-blue-800 text-sm font-medium">Active Pairs</p>
              </div>
            </div>

            {/* Top Performing Pair */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4">
              <h4 className="font-medium text-green-800 mb-2">🏆 Top Performing Pair</h4>
              <p className="text-green-900 font-bold">{strategies.baseLP.topPair}</p>
            </div>

            {/* Status Indicators */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Total TVL</span>
                <span className="font-medium">{formatCurrency(strategies.baseLP.totalTVL)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Fees (24h)</span>
                <span className="font-medium text-green-600">{formatCurrency(strategies.baseLP.fees24h)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Health Status</span>
                <div className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-1" />
                  <span className="text-green-600 font-medium capitalize">{strategies.baseLP.health}</span>
                </div>
              </div>
            </div>

            <button className="w-full bg-green-100 text-green-800 py-2 px-4 rounded-lg font-medium hover:bg-green-200 transition-colors">
              View Detailed Positions
            </button>
          </div>
        </div>

        {/* Token Liquidity Management */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">Token Liquidity</h3>
              <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                strategies.tokenLiquidity.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {strategies.tokenLiquidity.status.toUpperCase()}
              </div>
            </div>
            <p className="text-purple-100 text-sm">AVA Market Support • {strategies.tokenLiquidity.allocation}% Allocation</p>
          </div>

          <div className="p-6 space-y-4">
            {/* Current Metrics */}
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <p className="text-2xl font-bold text-purple-600">${formatNumber(strategies.tokenLiquidity.currentPrice)}</p>
                <p className="text-purple-800 text-sm font-medium">Current Price</p>
              </div>
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">{strategies.tokenLiquidity.ratchetLevel}</p>
                <p className="text-blue-800 text-sm font-medium">Ratchet Level</p>
              </div>
            </div>

            {/* Progress to Next Ratchet */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-slate-700">Next Ratchet Target</span>
                <span className="text-sm font-bold text-slate-900">${strategies.tokenLiquidity.nextTarget}</span>
              </div>
              <div className="bg-slate-200 rounded-full h-2">
                <div
                  className="bg-purple-600 h-2 rounded-full transition-all duration-500"
                  style={{ 
                    width: `${(strategies.tokenLiquidity.currentPrice / strategies.tokenLiquidity.nextTarget) * 100}%` 
                  }}
                ></div>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Progress: {formatNumber((strategies.tokenLiquidity.currentPrice / strategies.tokenLiquidity.nextTarget) * 100)}%
              </p>
            </div>

            {/* Status Indicators */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Liquidity Depth</span>
                <span className="font-medium">{formatCurrency(strategies.tokenLiquidity.liquidityDepth)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Volume (24h)</span>
                <span className="font-medium">{formatCurrency(strategies.tokenLiquidity.volume24h)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Health Status</span>
                <div className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-1" />
                  <span className="text-green-600 font-medium capitalize">{strategies.tokenLiquidity.health}</span>
                </div>
              </div>
            </div>

            <button className="w-full bg-purple-100 text-purple-800 py-2 px-4 rounded-lg font-medium hover:bg-purple-200 transition-colors">
              Manage Liquidity Levels
            </button>
          </div>
        </div>
      </div>

      {/* System Health Status */}
      <div className="bg-white rounded-xl p-6 shadow-lg">
        <h3 className="text-xl font-bold text-slate-900 mb-6">System Health & Performance</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-4">
            <h4 className="font-medium text-slate-700">Bot Status</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <span className="text-sm font-medium">B-MERS Trading Bot</span>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  <span className="text-green-700 text-xs font-medium">ACTIVE</span>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <span className="text-sm font-medium">LP Management Bot</span>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  <span className="text-green-700 text-xs font-medium">ACTIVE</span>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <span className="text-sm font-medium">Buyback Bot</span>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  <span className="text-green-700 text-xs font-medium">ACTIVE</span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-medium text-slate-700">Performance Metrics</h4>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">System Uptime</span>
                <span className="font-bold text-green-600">{formatNumber(systemMetrics.systemUptime)}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">Combined APY</span>
                <span className="font-bold text-blue-600">{formatNumber(systemMetrics.combinedAPY)}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">Error Rate</span>
                <span className="font-bold text-green-600">0.03%</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-medium text-slate-700">Last Update</h4>
            <div className="bg-slate-50 rounded-lg p-4">
              <div className="flex items-center mb-2">
                <Timer className="w-4 h-4 text-slate-500 mr-2" />
                <span className="text-sm font-medium text-slate-700">
                  {systemMetrics.lastUpdate.toLocaleTimeString()}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Next auto-refresh in {30 - new Date().getSeconds() % 30} seconds
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StrategyMonitor;