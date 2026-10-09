import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import StatCard from '../components/StatCard';
import RiskBadge from '../components/RiskBadge';
import Modal from '../components/Modal';
import ScanResultCard from '../components/ScanResultCard';
import LoadingSpinner from '../components/LoadingSpinner';
import { formatDate } from '../utils/formatters';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Mail,
  Globe,
  FileCheck,
  Activity,
  ArrowRight,
  Sparkles,
  UserCheck
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid
} from 'recharts';

export default function Overview() {
  const { user, userId, isAuthenticated } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedScan, setSelectedScan] = useState(null);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getDashboardStats(userId);
      setStats(data);
    } catch (err) {
      setError(err.message || 'Failed to load dashboard metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, [userId]);

  if (loading) return <LoadingSpinner text="Fetching security telemetry..." />;

  if (error) {
    return (
      <div className="p-8 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700">
        <h3 className="font-bold text-base flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-rose-600" />
          Backend Connection Error
        </h3>
        <p className="text-xs mt-1">{error}</p>
        <button
          onClick={loadDashboard}
          className="mt-4 px-4 py-2 bg-rose-600 text-white rounded-lg text-xs font-semibold hover:bg-rose-700 transition-colors"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  const {
    total_scans = 0,
    high_risk_count = 0,
    medium_risk_count = 0,
    low_risk_count = 0,
    type_counts = { email: 0, url: 0, invoice: 0 },
    recent_scans = []
  } = stats || {};

  const riskPieData = [
    { name: 'High Risk', value: high_risk_count, color: '#EF4444' },
    { name: 'Medium Risk', value: medium_risk_count, color: '#F59E0B' },
    { name: 'Low Risk', value: low_risk_count, color: '#10B981' }
  ].filter(d => d.value > 0);

  const typeBarData = [
    { name: 'Email Phishing', count: type_counts.email || 0, fill: '#6366F1' },
    { name: 'URL Security', count: type_counts.url || 0, fill: '#0EA5E9' },
    { name: 'Invoice Fraud', count: type_counts.invoice || 0, fill: '#8B5CF6' }
  ];

  return (
    <div className="space-y-8">
      {/* Top Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 rounded-2xl p-6 text-white shadow-xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center space-x-2 mb-2">
            {isAuthenticated ? (
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30 flex items-center gap-1">
                <UserCheck className="w-3 h-3 text-emerald-400" /> Isolated Session Workspace ({user.email})
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full bg-sky-500/20 text-sky-300 text-xs font-bold border border-sky-500/30 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-sky-400" /> Public Telemetry Workspace
              </span>
            )}
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight">TrustGuard Security Telemetry</h2>
          <p className="text-xs text-slate-300 mt-1 max-w-xl leading-relaxed">
            {isAuthenticated
              ? `Isolated transaction verification & threat scans for ${user.full_name}.`
              : 'Real-time heuristic & machine-learning verification for small and medium business transactions.'}
          </p>
        </div>

        {/* Quick Scan Action Buttons */}
        <div className="flex flex-wrap gap-2.5 shrink-0">
          <Link
            to="/email"
            className="flex items-center space-x-2 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-md transition-all"
          >
            <Mail className="w-4 h-4" />
            <span>Email Scan</span>
          </Link>
          <Link
            to="/url"
            className="flex items-center space-x-2 px-3.5 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-semibold shadow-md transition-all"
          >
            <Globe className="w-4 h-4" />
            <span>URL Scan</span>
          </Link>
          <Link
            to="/invoice"
            className="flex items-center space-x-2 px-3.5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold shadow-md transition-all"
          >
            <FileCheck className="w-4 h-4" />
            <span>Verify Invoice</span>
          </Link>
        </div>
      </div>

      {/* Telemetry Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Total Scans Executed"
          value={total_scans}
          subtitle={isAuthenticated ? `User ID #${userId} scans` : "All scan channels combined"}
          icon={Activity}
          color="indigo"
        />
        <StatCard
          title="High Risk Alerts"
          value={high_risk_count}
          subtitle="Immediate threat mitigation"
          icon={ShieldAlert}
          color="rose"
        />
        <StatCard
          title="Medium Risk Warnings"
          value={medium_risk_count}
          subtitle="Caution & verification needed"
          icon={AlertTriangle}
          color="amber"
        />
        <StatCard
          title="Low Risk Verified"
          value={low_risk_count}
          subtitle="Normal business traffic"
          icon={ShieldCheck}
          color="emerald"
        />
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Risk Distribution Chart */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 tracking-tight">Risk Distribution</h3>
            <p className="text-xs text-slate-500 mt-0.5">Threat severity breakdown across user telemetry</p>
          </div>
          <div className="h-64 my-4 flex items-center justify-center">
            {riskPieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={riskPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {riskPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0F172A', borderRadius: '12px', border: 'none', color: '#fff' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-xs text-slate-400">No telemetry scans recorded for this account yet.</p>
            )}
          </div>
          <div className="flex justify-center items-center space-x-6 pt-2 border-t border-slate-100 text-xs font-semibold">
            <span className="flex items-center gap-1.5 text-rose-600">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> High ({high_risk_count})
            </span>
            <span className="flex items-center gap-1.5 text-amber-600">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Medium ({medium_risk_count})
            </span>
            <span className="flex items-center gap-1.5 text-emerald-600">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Low ({low_risk_count})
            </span>
          </div>
        </div>

        {/* Scan Type Breakdown Bar Chart */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 tracking-tight">Scan Vectors Breakdown</h3>
            <p className="text-xs text-slate-500 mt-0.5">Distribution of security checks by module vector</p>
          </div>
          <div className="h-64 my-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={typeBarData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0F172A', borderRadius: '12px', border: 'none', color: '#fff' }}
                />
                <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                  {typeBarData.map((entry, index) => (
                    <Cell key={`bar-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="pt-2 border-t border-slate-100 text-xs text-slate-500 text-center">
            Total Vector Events: {total_scans}
          </div>
        </div>
      </div>

      {/* Recent Scan Activity Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Recent Account Activity</h3>
            <p className="text-xs text-slate-500">Latest threat scans across your security session</p>
          </div>
          <Link
            to="/history"
            className="flex items-center space-x-1 text-xs font-bold text-sky-600 hover:text-sky-700 transition-colors"
          >
            <span>View All History</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recent_scans.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            No scan activity recorded for this account. Run an Email, URL, or Invoice scan to populate your telemetry workspace.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-100 text-slate-400 uppercase font-semibold text-[10px]">
                <tr>
                  <th className="px-6 py-3">Scan Type</th>
                  <th className="px-6 py-3">Target Identifier</th>
                  <th className="px-6 py-3">Risk Level</th>
                  <th className="px-6 py-3">Risk Score</th>
                  <th className="px-6 py-3">Timestamp</th>
                  <th className="px-6 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recent_scans.map((scan) => (
                  <tr key={scan.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-3.5 font-bold uppercase tracking-wider text-[11px] text-slate-700">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                        {scan.scan_type}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 font-medium text-slate-900 max-w-xs truncate">
                      {scan.target_identifier}
                    </td>
                    <td className="px-6 py-3.5">
                      <RiskBadge level={scan.risk_level} />
                    </td>
                    <td className="px-6 py-3.5 font-mono font-bold text-slate-900">
                      {scan.risk_score} / 100
                    </td>
                    <td className="px-6 py-3.5 text-slate-400">
                      {formatDate(scan.created_at)}
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <button
                        onClick={() => setSelectedScan(scan)}
                        className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md font-semibold text-[11px] transition-colors cursor-pointer"
                      >
                        View Findings
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Selected Scan Detail Modal */}
      <Modal
        isOpen={!!selectedScan}
        onClose={() => setSelectedScan(null)}
        title={`Scan Report #${selectedScan?.id || ''}`}
      >
        <ScanResultCard result={selectedScan} />
      </Modal>
    </div>
  );
}
