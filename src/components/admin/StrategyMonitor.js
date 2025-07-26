// src/components/admin/StrategyMonitor.js
import React, { useState, useEffect } from 'react';
// import { useStrategyData } from '../../hooks/useStrategyData';
import {
  Activity,
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart,
  Settings,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Zap,
  Target,
  DollarSign,
  Percent,
  Clock,
  Play,
  Pause,
  RotateCcw,
  Eye,
  Download,
  Filter,
  Calendar
} from 'lucide-react';

function StrategyMonitor() {
  // Mock data since the hook is not working yet
  const mockStrategyData = {
    systemMetrics: {
      totalAllocation: 5000000,
      combinedAPY: 24.5,
      systemUptime: 99.8,
      activeBots: 5,
      totalBots: 5
    },
    ethereumStrategy: {
      allocation: 2500000,
      apy: 27.3,
      dailyReturn: 0.08,
      status: 'active',
      currentExposure: 0.65,
      targetExposure: 0.67,
      isRebalanceNeeded: true,
      sharpeRatio: 1.8
    },
    baseEcosystemLP: {
      allocation: 1750000,
      averageAPR: 45.7,
      status: 'active',
      totalTVL: 12500000,
      activePositions: 8,
      topPerformingPair: 'ETH-USDC',
      topPerformingAPR: 78.2
    },
    tokenLiquidity: {
      allocation: 750000,
      status: 'active',
      currentPrice: 1.23,
      ratchetLevel: 6,
      volume24h: 125000,
      liquidityDepth: 450000
    }
  };

  const strategyData = mockStrategyData;
  const isLoading = false;
  const error = null;
  const lastUpdate = new Date();
  
  const refreshData = () => {
    console.log('Refreshing data...');
  };
  
  const getStrategyHistory = async (strategyId, timeframe) => {
    return [];
  };
  
  const triggerRebalance = async (strategyId) => {
    console.log('Triggering rebalance for:', strategyId);
    return { success: true, txHash: '0x123...' };
  };
  
  const exportStrategyData = (format) => {
    console.log('Exporting data in format:', format);
  };

  const [selectedStrategy, setSelectedStrategy] = useState('ethereum');
  const [timeframe, setTimeframe] = useState('24h');
  const [historyData, setHistoryData] = useState([]);
  const [showSettings, setShowSettings] = useState(false);

  // Load strategy history when selection changes
  useEffect(() => {
    const loadHistory = async () => {
      if (selectedStrategy) {
        const history = await getStrategyHistory(selectedStrategy, timeframe);
        setHistoryData(history);
      }
    };
    loadHistory();
  }, [selectedStrategy, timeframe, getStrategyHistory]);

  const formatNumber = (num, decimals = 2) => {
    if (typeof num !== 'number') return '0';
    return new Intl.NumberFormat().format(parseFloat(num.toFixed(decimals)));
  };

  const formatPercent = (num) => {
    if (typeof num !== 'number') return '0%';
    return `${parseFloat(num.toFixed(2))}%`;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'error': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const StrategyCard = ({ strategy, name, isSelected, onClick }) => {
    if (!strategy) return null;

    return (
      <div 
        onClick={onClick}
        className={`p-6 rounded-xl border-2 cursor-pointer transition-all ${
          isSelected 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-slate-200 hover:border-slate-300 bg-white'
        }`}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-slate-900">{name}</h3>
          <div className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(strategy.status)}`}>
            {strategy.status}
          </div>
        </div>
        
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-slate-600">Allocation:</span>
            <span className="font-bold">${formatNumber(strategy.allocation)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600">APY:</span>
            <span className="font-bold text-green-600">
              {formatPercent(strategy.apy || strategy.averageAPR)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600">Daily Return:</span>
            <span className={`font-bold ${
              (strategy.dailyReturn || 0) >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {strategy.dailyReturn >= 0 ? '+' : ''}{formatPercent(strategy.dailyReturn || 0)}
            </span>
          </div>
        </div>
      </div>
    );
  };

  const MetricCard = ({ title, value, change, icon: Icon, color = 'blue' }) => (
    <div className="bg-white rounded-xl p-6 shadow-lg border border-slate-200">
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 bg-${color}-100 rounded-xl flex items-center justify-center`}>
          <Icon className={`w-6 h-6 text-${color}-600`} />
        </div>
        {change !== undefined && (
          <div className={`flex items-center ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {change >= 0 ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
            <span className="text-sm font-medium">{change >= 0 ? '+' : ''}{change}%</span>
          </div>
        )}
      </div>
      <h3 className="text-slate-600 font-medium text-sm mb-1">{title}</h3>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
    </div>
  );

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 mb-2">Error Loading Strategy Data</h3>
          <p className="text-slate-600 mb-4">{error}</p>
          <button
            onClick={refreshData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Strategy Monitor</h1>
          <p className="text-slate-600 mt-1">Real-time monitoring and control of Avalon trading strategies</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Calendar className="w-4 h-4" />
            Last updated: {lastUpdate ? lastUpdate.toLocaleTimeString() : 'Never'}
          </div>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <Settings className="w-4 h-4" />
            Settings
          </button>
          <button
            onClick={refreshData}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* System Overview */}
      {strategyData.systemMetrics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <MetricCard
            title="Total Allocation"
            value={`$${formatNumber(strategyData.systemMetrics.totalAllocation)}`}
            icon={DollarSign}
            color="green"
          />
          <MetricCard
            title="Combined APY"
            value={formatPercent(strategyData.systemMetrics.combinedAPY)}
            change={2.3}
            icon={TrendingUp}
            color="blue"
          />
          <MetricCard
            title="System Uptime"
            value={formatPercent(strategyData.systemMetrics.systemUptime)}
            icon={CheckCircle}
            color="green"
          />
          <MetricCard
            title="Active Bots"
            value={`${strategyData.systemMetrics.activeBots}/${strategyData.systemMetrics.totalBots}`}
            icon={Activity}
            color="purple"
          />
        </div>
      )}

      {/* Strategy Selection */}
      <div className="bg-white rounded-xl p-6 shadow-lg border border-slate-200">
        <h2 className="text-xl font-bold text-slate-900 mb-6">Active Strategies</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StrategyCard
            strategy={strategyData.ethereumStrategy}
            name="Ethereum Strategy"
            isSelected={selectedStrategy === 'ethereum'}
            onClick={() => setSelectedStrategy('ethereum')}
          />
          <StrategyCard
            strategy={strategyData.baseEcosystemLP}
            name="Base Ecosystem LP"
            isSelected={selectedStrategy === 'baseLP'}
            onClick={() => setSelectedStrategy('baseLP')}
          />
          <StrategyCard
            strategy={strategyData.tokenLiquidity}
            name="Token Liquidity"
            isSelected={selectedStrategy === 'tokenLiquidity'}
            onClick={() => setSelectedStrategy('tokenLiquidity')}
          />
        </div>
      </div>

      {/* Selected Strategy Details */}
      {selectedStrategy && strategyData[selectedStrategy + 'Strategy'] || strategyData[selectedStrategy] && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Strategy Performance */}
          <div className="bg-white rounded-xl p-6 shadow-lg border border-slate-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-slate-900">
                {selectedStrategy === 'ethereum' ? 'Ethereum Strategy (E-MERS)' :
                 selectedStrategy === 'baseLP' ? 'Base Ecosystem LP' :
                 'Token Liquidity Management'}
              </h3>
              <div className="flex items-center gap-2">
                <select
                  value={timeframe}
                  onChange={(e) => setTimeframe(e.target.value)}
                  className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
                >
                  <option value="24h">24 Hours</option>
                  <option value="7d">7 Days</option>
                  <option value="30d">30 Days</option>
                </select>
              </div>
            </div>

            {/* Performance Metrics */}
            <div className="space-y-4">
              {selectedStrategy === 'ethereum' && strategyData.ethereumStrategy && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <p className="text-blue-600 text-sm font-medium">Current Exposure</p>
                      <p className="text-2xl font-bold text-blue-700">
                        {formatPercent(strategyData.ethereumStrategy.currentExposure * 100)}
                      </p>
                      <p className="text-blue-600 text-xs">
                        Target: {formatPercent(strategyData.ethereumStrategy.targetExposure * 100)}
                      </p>
                    </div>
                    <div className="p-4 bg-green-50 rounded-lg">
                      <p className="text-green-600 text-sm font-medium">Sharpe Ratio</p>
                      <p className="text-2xl font-bold text-green-700">
                        {strategyData.ethereumStrategy.sharpeRatio?.toFixed(2) || '0.00'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="p-4 border border-slate-200 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-slate-600">Rebalance Needed:</span>
                      <span className={`font-bold ${
                        strategyData.ethereumStrategy.isRebalanceNeeded ? 'text-red-600' : 'text-green-600'
                      }`}>
                        {strategyData.ethereumStrategy.isRebalanceNeeded ? 'Yes' : 'No'}
                      </span>
                    </div>
                    {strategyData.ethereumStrategy.isRebalanceNeeded && (
                      <button
                        onClick={() => triggerRebalance('ethereum')}
                        disabled={isLoading}
                        className="w-full mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                      >
                        <RotateCcw className="w-4 h-4 mr-2 inline" />
                        Trigger Rebalance
                      </button>
                    )}
                  </div>
                </>
              )}

              {selectedStrategy === 'baseLP' && strategyData.baseEcosystemLP && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-green-50 rounded-lg">
                      <p className="text-green-600 text-sm font-medium">Total TVL</p>
                      <p className="text-2xl font-bold text-green-700">
                        ${formatNumber(strategyData.baseEcosystemLP.totalTVL)}
                      </p>
                    </div>
                    <div className="p-4 bg-purple-50 rounded-lg">
                      <p className="text-purple-600 text-sm font-medium">Active Positions</p>
                      <p className="text-2xl font-bold text-purple-700">
                        {strategyData.baseEcosystemLP.activePositions || 0}
                      </p>
                    </div>
                  </div>
                  
                  <div className="p-4 border border-slate-200 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-slate-600">Top Performing Pair:</span>
                      <span className="font-bold text-blue-600">
                        {strategyData.baseEcosystemLP.topPerformingPair}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">APR:</span>
                      <span className="font-bold text-green-600">
                        {formatPercent(strategyData.baseEcosystemLP.topPerformingAPR)}
                      </span>
                    </div>
                  </div>
                </>
              )}

              {selectedStrategy === 'tokenLiquidity' && strategyData.tokenLiquidity && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-cyan-50 rounded-lg">
                      <p className="text-cyan-600 text-sm font-medium">Current Price</p>
                      <p className="text-2xl font-bold text-cyan-700">
                        ${strategyData.tokenLiquidity.currentPrice?.toFixed(3) || '0.000'}
                      </p>
                    </div>
                    <div className="p-4 bg-orange-50 rounded-lg">
                      <p className="text-orange-600 text-sm font-medium">Ratchet Level</p>
                      <p className="text-2xl font-bold text-orange-700">
                        {strategyData.tokenLiquidity.ratchetLevel || 0}
                      </p>
                    </div>
                  </div>
                  
                  <div className="p-4 border border-slate-200 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-slate-600">24h Volume:</span>
                      <span className="font-bold text-slate-900">
                        ${formatNumber(strategyData.tokenLiquidity.volume24h)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">Liquidity Depth:</span>
                      <span className="font-bold text-blue-600">
                        ${formatNumber(strategyData.tokenLiquidity.liquidityDepth)}
                      </span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Strategy Controls */}
          <div className="bg-white rounded-xl p-6 shadow-lg border border-slate-200">
            <h3 className="text-xl font-bold text-slate-900 mb-6">Strategy Controls</h3>
            
            <div className="space-y-4">
              <div className="p-4 border border-slate-200 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-medium text-slate-900">Bot Status</span>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-green-600 font-medium">Running</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="flex-1 px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors">
                    <Pause className="w-4 h-4 mr-2 inline" />
                    Pause
                  </button>
                  <button className="flex-1 px-3 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors">
                    <Play className="w-4 h-4 mr-2 inline" />
                    Start
                  </button>
                </div>
              </div>

              <div className="p-4 border border-slate-200 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-medium text-slate-900">Data Export</span>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => exportStrategyData('csv')}
                    className="flex-1 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                  >
                    <Download className="w-4 h-4 mr-2 inline" />
                    CSV
                  </button>
                  <button 
                    onClick={() => exportStrategyData('json')}
                    className="flex-1 px-3 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors"
                  >
                    <Download className="w-4 h-4 mr-2 inline" />
                    JSON
                  </button>
                </div>
              </div>

              {/* Recent Alerts */}
              <div className="p-4 border border-slate-200 rounded-lg">
                <h4 className="font-medium text-slate-900 mb-3">Recent Alerts</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 p-2 bg-blue-50 rounded">
                    <CheckCircle className="w-4 h-4 text-blue-600" />
                    <span className="text-sm text-blue-800">Strategy rebalanced at 14:30</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-green-50 rounded">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-sm text-green-800">High yield opportunity detected</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-white rounded-xl p-6 shadow-lg border border-slate-200">
        <h3 className="text-xl font-bold text-slate-900 mb-6">System Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="flex items-center justify-center gap-2 p-4 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors">
            <Zap className="w-5 h-5 text-yellow-600" />
            Emergency Stop All
          </button>
          <button className="flex items-center justify-center gap-2 p-4 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors">
            <RotateCcw className="w-5 h-5 text-blue-600" />
            Rebalance All
          </button>
          <button className="flex items-center justify-center gap-2 p-4 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors">
            <Eye className="w-5 h-5 text-purple-600" />
            View Logs
          </button>
        </div>
      </div>
    </div>
  );
}

export default StrategyMonitor;