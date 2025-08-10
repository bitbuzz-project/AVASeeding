// src/components/admin/InvestmentDashboard.js
import React from 'react';
import { useAdminData } from '../../hooks/useAdminData';
import {
  DollarSign,
  Users,
  TrendingUp,
  Activity,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  PieChart,
  BarChart3,
  Eye,
  Download,
  Calendar,
  Filter
} from 'lucide-react';

function AdminInvestmentDashboard() {
  const {
    data,
    isLoading,
    error,
    lastUpdate,
    refreshData,
    exportData
  } = useAdminData();

  const formatNumber = (num) => {
    return new Intl.NumberFormat().format(parseFloat(num).toFixed(2));
  };

  const formatPercent = (num) => {
    return `${parseFloat(num).toFixed(2)}%`;
  };

  const MetricCard = ({ title, value, change, icon: Icon, color = 'blue', subtitle = '' }) => (
    <div className="bg-white rounded-xl p-6 shadow-lg border border-slate-200">
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 bg-${color}-100 rounded-xl flex items-center justify-center`}>
          <Icon className={`w-6 h-6 text-${color}-600`} />
        </div>
        {change && (
          <div className={`flex items-center ${change > 0 ? 'text-green-600' : 'text-red-600'}`}>
            <TrendingUp className="w-4 h-4 mr-1" />
            <span className="text-sm font-medium">{change > 0 ? '+' : ''}{change}%</span>
          </div>
        )}
      </div>
      <h3 className="text-slate-600 font-medium text-sm mb-1">{title}</h3>
      <p className="text-2xl font-bold text-slate-900 mb-1">{value}</p>
      {subtitle && <p className="text-slate-500 text-xs">{subtitle}</p>}
    </div>
  );

  const StrategyCard = ({ name, data, color }) => (
    <div className="bg-white rounded-xl p-6 shadow-lg border border-slate-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-slate-900">{name}</h3>
        <div className={`w-3 h-3 bg-${color}-500 rounded-full`}></div>
      </div>
      <div className="space-y-3">
        <div className="flex justify-between">
          <span className="text-slate-600">Allocated:</span>
          <span className="font-bold">${formatNumber(data.allocated)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-600">APY:</span>
          <span className="font-bold text-green-600">{formatPercent(data.apy)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-600">Status:</span>
          <div className="flex items-center">
            <CheckCircle className="w-4 h-4 text-green-500 mr-1" />
            <span className="text-green-600 font-medium capitalize">{data.status}</span>
          </div>
        </div>
      </div>
    </div>
  );

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 mb-2">Error Loading Data</h3>
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
          <h1 className="text-3xl font-bold text-slate-900">Investment Dashboard</h1>
          <p className="text-slate-600 mt-1">Real-time monitoring of Avalon investments and performance</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Calendar className="w-4 h-4" />
            Last updated: {lastUpdate ? lastUpdate.toLocaleTimeString() : 'Never'}
          </div>
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

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Investments"
          value={`$${formatNumber(data.totalInvestments)}`}
          change={12.5}
          icon={DollarSign}
          color="green"
          subtitle="USDC invested"
        />
        <MetricCard
          title="Total Investors"
          value={formatNumber(data.totalInvestors)}
          change={8.3}
          icon={Users}
          color="blue"
          subtitle="Unique addresses"
        />
        <MetricCard
          title="AVA Tokens Issued"
          value={formatNumber(data.totalAvaIssued)}
          change={15.2}
          icon={Activity}
          color="purple"
          subtitle="Total supply: 5M"
        />
        <MetricCard
          title="Current AVA Price"
          value={`$${data.currentAvaPrice}`}
          change={3.7}
          icon={TrendingUp}
          color="cyan"
          subtitle="Market price"
        />
      </div>

      {/* Strategy Performance */}
      <div className="bg-white rounded-xl p-6 shadow-lg border border-slate-200">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-slate-900">Strategy Performance</h2>
          <div className="flex items-center gap-2">
            <PieChart className="w-5 h-5 text-slate-600" />
            <span className="text-sm text-slate-600">Asset Allocation</span>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StrategyCard
            name="Bitcoin Strategy (B-MERS)"
            data={data.strategiesPerformance.bitcoin}
            color="blue"
          />
          <StrategyCard
            name="Base Ecosystem LP"
            data={data.strategiesPerformance.baseEcosystem}
            color="green"
          />
          <StrategyCard
            name="Token Liquidity"
            data={data.strategiesPerformance.tokenLiquidity}
            color="purple"
          />
        </div>
      </div>

      {/* Recent Investors & Revenue */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Analytics */}
        <div className="bg-white rounded-xl p-6 shadow-lg border border-slate-200">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-slate-900">Revenue Analytics</h2>
            <button
              onClick={() => exportData('json')}
              className="flex items-center gap-2 px-3 py-2 text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg">
              <div>
                <p className="text-green-800 font-medium">Total Revenue</p>
                <p className="text-2xl font-bold text-green-600">${formatNumber(data.totalRevenue)}</p>
              </div>
              <div className="text-right">
                <p className="text-green-600 text-sm">Monthly Est.</p>
                <p className="text-lg font-bold text-green-700">${formatNumber(parseFloat(data.totalRevenue) * 0.15)}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-blue-800 text-sm">Buybacks</p>
                <p className="text-lg font-bold text-blue-600">${formatNumber(parseFloat(data.totalRevenue) * 0.9)}</p>
                <p className="text-blue-600 text-xs">90% of revenue</p>
              </div>
              <div className="p-3 bg-orange-50 rounded-lg">
                <p className="text-orange-800 text-sm">Operations</p>
                <p className="text-lg font-bold text-orange-600">${formatNumber(parseFloat(data.totalRevenue) * 0.1)}</p>
                <p className="text-orange-600 text-xs">10% of revenue</p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Investors */}
        <div className="bg-white rounded-xl p-6 shadow-lg border border-slate-200">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-slate-900">Recent Investors</h2>
            <button className="flex items-center gap-2 px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
              <Eye className="w-4 h-4" />
              View All
            </button>
          </div>
          <div className="space-y-3">
            {data.recentInvestors.length > 0 ? (
              data.recentInvestors.slice(0, 5).map((investor, index) => (
                <div key={index} className="flex items-center justify-between p-3 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                  <div>
                    <p className="font-mono text-sm font-medium text-slate-900">{investor.address}</p>
                    <p className="text-xs text-slate-500">{new Date(investor.date).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-slate-900">${formatNumber(investor.amount)}</p>
                    <p className="text-xs text-slate-500">{formatNumber(investor.tokens)} AVA</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500">No recent investors data available</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* System Status */}
      <div className="bg-white rounded-xl p-6 shadow-lg border border-slate-200">
        <h2 className="text-xl font-bold text-slate-900 mb-6">System Health</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className={`flex items-center justify-between p-4 rounded-lg ${
            data.systemHealth.seedingContract === 'healthy' ? 'bg-green-50' : 'bg-red-50'
          }`}>
            <div>
              <p className={`font-medium ${
                data.systemHealth.seedingContract === 'healthy' ? 'text-green-800' : 'text-red-800'
              }`}>Seeding Contract</p>
              <p className={`text-sm ${
                data.systemHealth.seedingContract === 'healthy' ? 'text-green-600' : 'text-red-600'
              }`}>
                {data.systemHealth.seedingContract === 'healthy' ? 'Active & Operational' : 'Error Detected'}
              </p>
            </div>
            {data.systemHealth.seedingContract === 'healthy' ? (
              <CheckCircle className="w-8 h-8 text-green-500" />
            ) : (
              <AlertCircle className="w-8 h-8 text-red-500" />
            )}
          </div>
          
          <div className={`flex items-center justify-between p-4 rounded-lg ${
            data.systemHealth.avaToken === 'healthy' ? 'bg-green-50' : 'bg-red-50'
          }`}>
            <div>
              <p className={`font-medium ${
                data.systemHealth.avaToken === 'healthy' ? 'text-green-800' : 'text-red-800'
              }`}>AVA Token</p>
              <p className={`text-sm ${
                data.systemHealth.avaToken === 'healthy' ? 'text-green-600' : 'text-red-600'
              }`}>
                {data.systemHealth.avaToken === 'healthy' ? 'No Issues Detected' : 'Error Detected'}
              </p>
            </div>
            {data.systemHealth.avaToken === 'healthy' ? (
              <CheckCircle className="w-8 h-8 text-green-500" />
            ) : (
              <AlertCircle className="w-8 h-8 text-red-500" />
            )}
          </div>
          
          <div className={`flex items-center justify-between p-4 rounded-lg ${
            data.systemHealth.tradingBots === 'healthy' ? 'bg-green-50' :
            data.systemHealth.tradingBots === 'warning' ? 'bg-yellow-50' : 'bg-red-50'
          }`}>
            <div>
              <p className={`font-medium ${
                data.systemHealth.tradingBots === 'healthy' ? 'text-green-800' :
                data.systemHealth.tradingBots === 'warning' ? 'text-yellow-800' : 'text-red-800'
              }`}>Trading Bots</p>
              <p className={`text-sm ${
                data.systemHealth.tradingBots === 'healthy' ? 'text-green-600' :
                data.systemHealth.tradingBots === 'warning' ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {data.systemHealth.tradingBots === 'healthy' ? 'All Strategies Running' :
                 data.systemHealth.tradingBots === 'warning' ? 'Some Issues Detected' : 'Error Detected'}
              </p>
            </div>
            {data.systemHealth.tradingBots === 'healthy' ? (
              <CheckCircle className="w-8 h-8 text-green-500" />
            ) : data.systemHealth.tradingBots === 'warning' ? (
              <AlertCircle className="w-8 h-8 text-yellow-500" />
            ) : (
              <AlertCircle className="w-8 h-8 text-red-500" />
            )}
          </div>
        </div>
      </div>

      {/* Progress Indicator */}
      <div className="bg-white rounded-xl p-6 shadow-lg border border-slate-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-slate-900">Presale Progress</h2>
          <span className="text-2xl font-bold text-blue-600">{data.progressPercent}%</span>
        </div>
        <div className="bg-slate-200 rounded-full h-4 mb-4">
          <div
            className="bg-gradient-to-r from-blue-500 to-cyan-500 h-4 rounded-full transition-all duration-500"
            style={{ width: `${data.progressPercent}%` }}
          ></div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <p className="text-slate-500 font-medium mb-1 text-sm">Tokens Sold</p>
            <p className="text-lg font-bold text-slate-900">{formatNumber(data.totalAvaIssued)}</p>
          </div>
          <div>
            <p className="text-slate-500 font-medium mb-1 text-sm">Target</p>
            <p className="text-lg font-bold text-slate-900">5,000,000</p>
          </div>
          <div>
            <p className="text-slate-500 font-medium mb-1 text-sm">Remaining</p>
            <p className="text-lg font-bold text-slate-900">
              {formatNumber(5000000 - parseFloat(data.totalAvaIssued))}
            </p>
          </div>
          <div>
            <p className="text-slate-500 font-medium mb-1 text-sm">Status</p>
            <p className={`text-lg font-bold ${data.seedingActive ? 'text-green-600' : 'text-red-500'}`}>
              {data.seedingActive ? 'Active' : 'Inactive'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminInvestmentDashboard;