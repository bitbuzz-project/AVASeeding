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
  Filter
} from 'lucide-react';

const ReferralAnalytics = ({ data, onRefresh, isLoading }) => {
  const [copiedCode, setCopiedCode] = useState('');
  const [filter, setFilter] = useState('all');

  const formatNumber = (num) => {
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

  const filteredCodes = data.referralCodes.filter(code => {
    if (filter === 'active') return code.usageCount > 0;
    if (filter === 'unused') return code.usageCount === 0;
    return true;
  });

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
            onClick={onRefresh}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
              <Gift className="w-5 h-5 text-purple-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900">{data.referralStats.totalCodes}</p>
          <p className="text-slate-600 font-medium">Total Codes</p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <Activity className="w-5 h-5 text-green-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900">{data.referralStats.activeCodes}</p>
          <p className="text-slate-600 font-medium">Active Codes</p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-blue-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900">${formatNumber(data.referralStats.totalRewards)}</p>
          <p className="text-slate-600 font-medium">Total Rewards</p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-orange-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900">{formatNumber(data.referralStats.conversionRate)}%</p>
          <p className="text-slate-600 font-medium">Conversion Rate</p>
        </div>
      </div>

      {/* Top Referrers & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Referrers */}
        <div className="bg-white rounded-xl p-6 shadow-lg">
          <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center">
            <Award className="w-5 h-5 mr-2 text-yellow-600" />
            Top Referrers
          </h3>
          <div className="space-y-3">
            {data.topReferrers.slice(0, 5).map((referrer, index) => (
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
        </div>

        {/* Recent Referral Activity */}
        <div className="bg-white rounded-xl p-6 shadow-lg">
          <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center">
            <Activity className="w-5 h-5 mr-2 text-blue-600" />
            Recent Referrals
          </h3>
          <div className="space-y-3">
            {data.recentReferrals.slice(0, 5).map((referral, index) => (
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
        </div>
      </div>

      {/* Referral Codes Management */}
      <div className="bg-white rounded-xl p-6 shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-slate-900">Referral Codes Management</h3>
          <div className="flex items-center gap-3">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Codes</option>
              <option value="active">Active Codes</option>
              <option value="unused">Unused Codes</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-3 px-4 font-medium text-slate-700">Code</th>
                <th className="text-left py-3 px-4 font-medium text-slate-700">Owner</th>
                <th className="text-left py-3 px-4 font-medium text-slate-700">Usage Count</th>
                <th className="text-left py-3 px-4 font-medium text-slate-700">Earnings</th>
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
                    <span className="font-mono text-sm text-slate-600">
                      {code.owner.slice(0, 6)}...{code.owner.slice(-4)}
                    </span>
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
                            
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ReferralAnalytics;