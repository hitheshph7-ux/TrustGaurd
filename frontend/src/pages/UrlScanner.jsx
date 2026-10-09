import React, { useState } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import ScanResultCard from '../components/ScanResultCard';
import LoadingSpinner from '../components/LoadingSpinner';
import { Globe, Sparkles, Send, AlertTriangle, ShieldCheck, Lock } from 'lucide-react';

const DEMO_TYPOSQUAT = "http://paypa1.com.secure-auth-login.xyz/verify-account";
const DEMO_IP_HOST = "http://192.168.1.100/login/bank-verification.php";
const DEMO_SAFE_URL = "https://github.com/fastapi/fastapi";

export default function UrlScanner() {
  const { userId } = useAuth();
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!url.trim()) {
      setError("Please enter a URL to scan.");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await api.scanUrl(url, userId);
      setResult(res);
    } catch (err) {
      setError(err.message || 'URL scan failed.');
    } finally {
      setLoading(false);
    }
  };

  const loadDemo = (demoUrl) => {
    setUrl(demoUrl);
    setError(null);
    setResult(null);
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-sky-600 font-bold text-xs uppercase tracking-wider mb-1">
            <Globe className="w-4 h-4" />
            <span>URL Security & Typosquatting Scanner</span>
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Suspicious Web Link Inspection</h2>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Evaluate link safety, typosquatting, brand impersonation, IP-address hostnames, and suspicious top-level domains without risking server-side execution.
          </p>
        </div>

        {/* Demo buttons */}
        <div className="flex flex-wrap gap-2 shrink-0">
          <button
            type="button"
            onClick={() => loadDemo(DEMO_TYPOSQUAT)}
            className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-rose-500" />
            <span>Impersonation Link</span>
          </button>
          <button
            type="button"
            onClick={() => loadDemo(DEMO_IP_HOST)}
            className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Bare IP Host</span>
          </button>
          <button
            type="button"
            onClick={() => loadDemo(DEMO_SAFE_URL)}
            className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
            <span>Safe URL</span>
          </button>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-5">
        {error && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Target URL to Analyze *
          </label>
          <div className="relative">
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="e.g. http://paypa1.com.secure-auth-login.xyz/verify"
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-sky-500 text-sm font-medium font-mono"
              required
            />
            <Globe className="w-5 h-5 text-slate-400 absolute left-3 top-3.5" />
          </div>
        </div>

        {/* SSRF Protection Callout */}
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-start space-x-2.5">
          <Lock className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-slate-800">SSRF Protection Safeguard:</span> TrustGuard performs pure offline domain structure & syntax heuristic parsing. User submitted URLs are never automatically visited, fetched, or executed by backend servers.
          </div>
        </div>

        <div className="flex items-center justify-end">
          <button
            type="submit"
            disabled={loading}
            className="flex items-center space-x-2 px-6 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-sm font-bold shadow-md transition-all disabled:opacity-50 cursor-pointer"
          >
            <Send className="w-4 h-4" />
            <span>{loading ? 'Scanning URL...' : 'Scan URL Security'}</span>
          </button>
        </div>
      </form>

      {/* Loading state */}
      {loading && <LoadingSpinner text="Analyzing hostname subdomains & lookalike brand patterns..." />}

      {/* Result Display */}
      {result && !loading && (
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">URL Assessment Findings</h3>
          <ScanResultCard result={result} />
        </div>
      )}
    </div>
  );
}
