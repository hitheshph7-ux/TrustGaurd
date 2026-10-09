import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import RiskBadge from '../components/RiskBadge';
import Modal from '../components/Modal';
import ScanResultCard from '../components/ScanResultCard';
import LoadingSpinner from '../components/LoadingSpinner';
import { formatDate } from '../utils/formatters';
import { History, Search, Filter, RefreshCw, Eye } from 'lucide-react';

export default function ScanHistory() {
  const { userId } = useAuth();
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [scanType, setScanType] = useState('');
  const [riskLevel, setRiskLevel] = useState('');
  const [search, setSearch] = useState('');
  const [selectedScan, setSelectedScan] = useState(null);

  const loadScans = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getScans({
        user_id: userId || undefined,
        scan_type: scanType || undefined,
        risk_level: riskLevel || undefined,
        limit: 100
      });
      setScans(data);
    } catch (err) {
      setError(err.message || 'Failed to fetch scan history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadScans();
  }, [scanType, riskLevel, userId]);

  const filteredScans = scans.filter((s) =>
    (s.target_identifier || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-sky-600 font-bold text-xs uppercase tracking-wider mb-1">
            <History className="w-4 h-4" />
            <span>Audit Trail & Telemetry Logs</span>
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Security Scan History & Audit Records</h2>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Complete record of all email, URL, and invoice security assessments executed across your organization.
          </p>
        </div>

        <button
          onClick={loadScans}
          className="flex items-center space-x-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh History</span>
        </button>
      </div>

      {/* Filter Controls Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search target identifier..."
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-sky-500 bg-white"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          </div>

          <div className="flex items-center space-x-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={scanType}
              onChange={(e) => setScanType(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium bg-white focus:ring-2 focus:ring-sky-500"
            >
              <option value="">All Scan Types</option>
              <option value="email">Email Phishing</option>
              <option value="url">URL Security</option>
              <option value="invoice">Invoice Fraud</option>
            </select>

            <select
              value={riskLevel}
              onChange={(e) => setRiskLevel(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium bg-white focus:ring-2 focus:ring-sky-500"
            >
              <option value="">All Risk Levels</option>
              <option value="High">High Risk</option>
              <option value="Medium">Medium Risk</option>
              <option value="Low">Low Risk</option>
            </select>
          </div>
        </div>

        <div className="text-xs text-slate-500 font-medium shrink-0">
          Total Found: <span className="font-bold text-slate-900">{filteredScans.length}</span>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <LoadingSpinner text="Fetching security scan history logs..." />
      ) : filteredScans.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-xs text-slate-400">
          No matching security scan records found.
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-100 text-slate-400 uppercase font-semibold text-[10px]">
                <tr>
                  <th className="px-6 py-3">Scan Type</th>
                  <th className="px-6 py-3">Target Identifier</th>
                  <th className="px-6 py-3">Risk Level</th>
                  <th className="px-6 py-3">Risk Score</th>
                  <th className="px-6 py-3">Timestamp</th>
                  <th className="px-6 py-3 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredScans.map((scan) => (
                  <tr key={scan.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4 font-bold uppercase tracking-wider text-[11px] text-slate-700">
                      <span className="px-2.5 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200 font-mono">
                        {scan.scan_type}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-900 max-w-sm truncate">
                      {scan.target_identifier}
                    </td>
                    <td className="px-6 py-4">
                      <RiskBadge level={scan.risk_level} />
                    </td>
                    <td className="px-6 py-4 font-mono font-bold text-slate-900">
                      {scan.risk_score} / 100
                    </td>
                    <td className="px-6 py-4 text-slate-400">
                      {formatDate(scan.created_at)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => setSelectedScan(scan)}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold text-xs transition-colors flex items-center space-x-1.5 ml-auto"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Inspect</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Selected Scan Report Modal */}
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
