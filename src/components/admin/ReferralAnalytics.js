// src/components/admin/ReferralAnalytics.js - FIXED WITH DEBUG INFO
import React, { useState } from 'react';
import {
  Gift,
  Users,
  DollarSign,
  TrendingUp,
  Copy,
  Check,
  ExternalLink,
  Calendar,
  Activity,
  Award,
  RefreshCw,
  Download,
  Eye,
  Filter,
  AlertCircle,
  Info,
  Search
} from 'lucide-react';

const ReferralAnalytics = ({ data, onRefresh, isLoading }) => {
  const [copiedCode, setCopiedCode] = useState('');
  const [filter, setFilter] = useState('all');
  const [showDebug, setShowDebug] = useState(false);

  const formatNumber = (num) => {
    if (!num) return '0';
    return new Intl.NumberFormat().format(parseFloat(num).toFixed(2));
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedCode(text);
      setTimeout(() => setCopiedCode(''), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  // Safety checks for data
  const safeReferralStats = data?.referralStats || {
    totalCodes: 0,
    activeCodes: 0,
    totalRewards: '0',
    totalBonusTokens: '0',
    conversionRate: 0
  };

  const safeTopReferrers = data?.topReferrers || [];
  const safeRecentReferrals = data?.recentReferrals || [];
  const safeReferralCodes = data?.referralCodes || [];

  const filteredCodes = safeReferralCodes.filter(code => {
    if (filter === 'active') return code.usageCount > 0;
    if (filter === 'unused') return code.usageCount === 0;
    return true;
  });

  // Debug info about the data
  const debugInfo = {
    dataExists: !!data,
    referralStatsExists: !!data?.referralStats,
    topReferrersCount: safeTopReferrers.length,
    recentReferralsCount: safeRecentReferrals.length,
    referralCodesCount: safeReferralCodes.length,
    rawData: data
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Referral Program Analytics</h2>
          <p className="text-slate-600 mt-1">Monitor referral performance and track rewards</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowDebug(!showDebug)}
            className="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
          >
            <Info className="w-4 h-4" />
            Debug
          </button>
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Debug Information */}
      {showDebug && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <h3 className="font-bold text-yellow-800 mb-3 flex items-center">
            <AlertCircle className="w-5 h-5 mr-2" />
            Debug Information
          </h3>
          <div className="space-y-2 text-sm">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p><strong>Data exists:</strong> {debugInfo.dataExists ? '✅ Yes' : '❌ No'}</p>
                <p><strong>Referral stats exists:</strong> {debugInfo.referralStatsExists ? '✅ Yes' : '❌ No'}</p>
                <p><strong>Top referrers count:</strong> {debugInfo.topReferrersCount}</p>
              </div>
              <div>
                <p><strong>Recent referrals count:</strong> {debugInfo.recentReferralsCount}</p>
                <p><strong>Referral codes count:</strong> {debugInfo.referralCodesCount}</p>
                <p><strong>Total codes stat:</strong> {safeReferralStats.totalCodes}</p>
              </div>
            </div>
            <details className="mt-4">
              <summary className="cursor-pointer text-yellow-700 font-medium">Raw Data (Click to expand)</summary>
              <pre className="mt-2 bg-yellow-100 p-3 rounded text-xs overflow-auto max-h-40">
                {JSON.stringify(debugInfo.rawData, null, 2)}
              </pre>
            </details>
          </div>
        </div>
      )}

      {/* Status Banner */}
      {safeReferralStats.totalCodes === 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-start">
            <Info className="w-5 h-5 text-blue-600 mr-3 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-blue-800">No Referral Data Found</p>
              <p className="text-blue-700 text-sm mt-1">
                This could mean:
              </p>
              <ul className="text-blue-700 text-sm mt-1 ml-4 list-disc">
                <li>No referral codes have been generated yet</li>
                <li>Events are outside the searched block range</li>
                <li>Contract connection issues</li>
                <li>You're on the wrong network</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
              <Gift className="w-5 h-5 text-purple-600" />
            </div>
            <TrendingUp className={`w-4 h-4 ${safeReferralStats.totalCodes > 0 ? 'text-green-500' : 'text-gray-400'}`} />
          </div>
          <p className="text-2xl font-bold text-slate-900">{safeReferralStats.totalCodes}</p>
          <p className="text-slate-600 font-medium">Total Codes</p>
          {safeReferralStats.totalCodes === 0 && (
            <p className="text-xs text-red-500 mt-1">No codes found</p>
          )}
        </div>

        <div className="bg-white rounded-xl p-6 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <Activity className="w-5 h-5 text-green-600" />
            </div>
            <TrendingUp className={`w-4 h-4 ${safeReferralStats.activeCodes > 0 ? 'text-green-500' : 'text-gray-400'}`} />
          </div>
          <p className="text-2xl font-bold text-slate-900">{safeReferralStats.activeCodes}</p>
          <p className="text-slate-600 font-medium">Active Codes</p>
          {safeReferralStats.activeCodes === 0 && safeReferralStats.totalCodes > 0 && (
            <p className="text-xs text-yellow-600 mt-1">No codes used yet</p>
          )}
        </div>

        <div className="bg-white rounded-xl p-6 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-blue-600" />
            </div>
            <TrendingUp className={`w-4 h-4 ${parseFloat(safeReferralStats.totalRewards) > 0 ? 'text-green-500' : 'text-gray-400'}`} />
          </div>
          <p className="text-2xl font-bold text-slate-900">${formatNumber(safeReferralStats.totalRewards)}</p>
          <p className="text-slate-600 font-medium">Total Rewards</p>
          {parseFloat(safeReferralStats.totalRewards) === 0 && (
            <p className="text-xs text-gray-500 mt-1">No rewards paid yet</p>
          )}
        </div>

        <div className="bg-white rounded-xl p-6 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-orange-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900">{formatNumber(safeReferralStats.conversionRate)}%</p>
          <p className="text-slate-600 font-medium">Conversion Rate</p>
          <p className="text-xs text-slate-500 mt-1">
            {safeReferralStats.totalCodes > 0 ? 
              `${safeRecentReferrals.length}/${safeReferralStats.totalCodes} codes used` :
              'No data available'
            }
          </p>
        </div>
      </div>

      {/* Top Referrers & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Referrers */}
        <div className="bg-white rounded-xl p-6 shadow-lg">
          <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center">
            <Award className="w-5 h-5 mr-2 text-yellow-600" />
            Top Referrers
            <span className="ml-2 text-sm font-normal text-slate-500">({safeTopReferrers.length})</span>
          </h3>
          
          {safeTopReferrers.length > 0 ? (
            <div className="space-y-3">
              {safeTopReferrers.slice(0, 5).map((referrer, index) => (
                <div key={referrer.address} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                      index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : index === 2 ? 'bg-orange-500' : 'bg-slate-400'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-mono text-sm font-medium text-slate-900">
                        {referrer.address.slice(0, 6)}...{referrer.address.slice(-4)}
                      </p>
                      <p className="text-xs text-slate-500">{referrer.referralCount} referrals</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600">${formatNumber(referrer.totalEarnings)}</p>
                    <p className="text-xs text-slate-500">earned</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Award className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500 font-medium">No Top Referrers Yet</p>
              <p className="text-slate-400 text-sm mt-1">
                Referrers will appear here once codes are used
              </p>
            </div>
          )}
        </div>

        {/* Recent Referral Activity */}
        <div className="bg-white rounded-xl p-6 shadow-lg">
          <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center">
            <Activity className="w-5 h-5 mr-2 text-blue-600" />
            Recent Referrals
            <span className="ml-2 text-sm font-normal text-slate-500">({safeRecentReferrals.length})</span>
          </h3>
          
          {safeRecentReferrals.length > 0 ? (
            <div className="space-y-3">
              {safeRecentReferrals.slice(0, 5).map((referral, index) => (
                <div key={index} className="flex items-center justify-between p-3 border border-slate-200 rounded-lg">
                  <div>
                    <p className="font-medium text-slate-900 font-mono text-sm">
                      {referral.referee.slice(0, 6)}...{referral.referee.slice(-4)}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">
                        {referral.code}
                      </span>
                      <span className="text-xs text-slate-500">
                        {new Date(referral.date).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-slate-900">${formatNumber(referral.amount)}</p>
                    <p className="text-xs text-green-600">+{formatNumber(referral.bonus)} AVA bonus</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Activity className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500 font-medium">No Recent Referrals</p>
              <p className="text-slate-400 text-sm mt-1">
                Referral purchases will appear here
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Referral Codes Management */}
      <div className="bg-white rounded-xl p-6 shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-slate-900">
            Referral Codes Management
            <span className="ml-2 text-sm font-normal text-slate-500">({filteredCodes.length} codes)</span>
          </h3>
          <div className="flex items-center gap-3">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Codes ({safeReferralCodes.length})</option>
              <option value="active">Active Codes ({safeReferralCodes.filter(c => c.usageCount > 0).length})</option>
              <option value="unused">Unused Codes ({safeReferralCodes.filter(c => c.usageCount === 0).length})</option>
            </select>
          </div>
        </div>

        {filteredCodes.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-4 font-medium text-slate-700">Code</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-700">Owner</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-700">Usage Count</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-700">Earnings</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-700">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCodes.map((code, index) => (
                  <tr key={index} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono font-medium text-purple-700 bg-purple-100 px-2 py-1 rounded">
                          {code.code}
                        </span>
                        <button
                          onClick={() => copyToClipboard(code.code)}
                          className="p-1 hover:bg-slate-100 rounded transition-colors"
                          title="Copy code"
                        >
                          {copiedCode === code.code ? (
                            <Check className="w-4 h-4 text-green-500" />
                          ) : (
                            <Copy className="w-4 h-4 text-slate-400" />
                          )}
                        </button>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-sm text-slate-600">
                          {code.owner.slice(0, 6)}...{code.owner.slice(-4)}
                        </span>
                        <a
                          href={`https://sepolia.basescan.org/address/${code.owner}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`font-medium ${code.usageCount > 0 ? 'text-green-600' : 'text-slate-500'}`}>
                        {code.usageCount}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-medium text-slate-900">
                        ${formatNumber(code.earnings)}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                        code.usageCount > 0 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {code.usageCount > 0 ? 'Used' : 'Unused'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => copyToClipboard(`https://yourapp.com/presale?ref=${code.code}`)}
                          className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="Copy referral link"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <Search className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              {filter === 'all' ? 'No Referral Codes Found' : `No ${filter} codes`}
            </h3>
            <p className="text-slate-600 mb-4">
              {safeReferralCodes.length === 0 
                ? 'No referral codes have been generated yet.'
                : `No codes match the "${filter}" filter.`
              }
            </p>
            {safeReferralCodes.length === 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
                <p className="text-blue-800 text-sm">
                  <strong>To generate referral codes:</strong>
                </p>
                <ol className="text-blue-700 text-sm mt-2 list-decimal list-inside">
                  <li>Connect a wallet to the presale</li>
                  <li>Go to the dashboard referral section</li>
                  <li>Click "Generate Referral Code"</li>
                </ol>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Summary Statistics */}
      {safeReferralStats.totalCodes > 0 && (
        <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-6">
          <h3 className="text-lg font-bold text-slate-900 mb-4">Program Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">
                {Math.round((safeReferralStats.activeCodes / safeReferralStats.totalCodes) * 100)}%
              </p>
              <p className="text-slate-700 font-medium">Code Utilization Rate</p>
              <p className="text-slate-500 text-sm">
                {safeReferralStats.activeCodes} of {safeReferralStats.totalCodes} codes used
              </p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">
                ${formatNumber(safeReferralStats.totalRewards)}
              </p>
              <p className="text-slate-700 font-medium">Total Rewards Distributed</p>
              <p className="text-slate-500 text-sm">
                To {safeTopReferrers.length} referrers
              </p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">
                {formatNumber(safeReferralStats.totalBonusTokens)}
              </p>
              <p className="text-slate-700 font-medium">Bonus AVA Tokens</p>
              <p className="text-slate-500 text-sm">
                Given to referees
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReferralAnalytics;