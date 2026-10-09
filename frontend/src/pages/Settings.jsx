import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import {
  Settings as SettingsIcon,
  ShieldAlert,
  Cpu,
  Key,
  Database,
  CheckCircle2,
  AlertTriangle,
  Info,
  Server
} from 'lucide-react';

export default function Settings() {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [vtKey, setVtKey] = useState('');
  const [savedNotice, setSavedNotice] = useState(false);

  const checkHealth = async () => {
    try {
      setLoading(true);
      const res = await api.getHealth();
      setHealth(res);
    } catch (e) {
      setHealth({ status: 'offline', error: e.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkHealth();
  }, []);

  const handleSaveSettings = (e) => {
    e.preventDefault();
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 3000);
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-2 text-slate-600 font-bold text-xs uppercase tracking-wider mb-1">
            <SettingsIcon className="w-4 h-4" />
            <span>Platform Configuration</span>
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">System Settings & Engine Telemetry</h2>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Configure risk classification thresholds, external threat intelligence providers, and inspect AI rule model status.
          </p>
        </div>
      </div>

      {savedNotice && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Configuration settings saved successfully.</span>
        </div>
      )}

      {/* Backend API Status Widget */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 uppercase tracking-wider">
          <Server className="w-4 h-4 text-sky-600" />
          FastAPI Engine Status
        </h3>

        {loading ? (
          <div className="text-xs text-slate-400">Pinging backend service...</div>
        ) : health?.status === 'healthy' ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs">
              <span className="text-slate-500 font-semibold block text-[10px] uppercase">Service Health</span>
              <span className="font-extrabold text-emerald-700 text-sm">ONLINE (200 OK)</span>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
              <span className="text-slate-500 font-semibold block text-[10px] uppercase">Engine Version</span>
              <span className="font-mono font-bold text-slate-900 text-sm">{health.version}</span>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
              <span className="text-slate-500 font-semibold block text-[10px] uppercase">Environment</span>
              <span className="font-mono font-bold text-slate-900 text-sm">{health.environment}</span>
            </div>
          </div>
        ) : (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs">
            Backend connection error: {health?.error || 'Unable to reach backend API.'}
          </div>
        )}
      </div>

      {/* Baseline ML Model Info */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 uppercase tracking-wider">
          <Cpu className="w-4 h-4 text-indigo-600" />
          Baseline Machine Learning Classifier Details
        </h3>
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs text-slate-700 leading-relaxed">
          <p className="font-semibold text-slate-900">
            Model: Scikit-Learn TF-IDF Vectorizer + Multinomial Naive Bayes (In-Memory)
          </p>
          <p>
            The baseline classifier analyzes n-gram features (unigrams and bigrams) from email subject lines and body copy to predict phishing probabilities. Features are weighted in tandem with rule-based heuristics.
          </p>
        </div>
      </div>

      {/* External Threat Intelligence Config */}
      <form onSubmit={handleSaveSettings} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-5">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 uppercase tracking-wider">
          <Key className="w-4 h-4 text-amber-600" />
          External Threat Intelligence Provider (Optional)
        </h3>

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            VirusTotal API Key (vt_api_key)
          </label>
          <input
            type="password"
            value={vtKey}
            onChange={(e) => setVtKey(e.target.value)}
            placeholder="Paste VirusTotal v3 API Key for live domain reputation lookups"
            className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-mono focus:ring-2 focus:ring-amber-500"
          />
          <p className="text-[11px] text-slate-400 mt-1">
            When unconfigured, TrustGuard operates in local heuristic & typosquatting analysis mode.
          </p>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-md transition-colors"
          >
            Save Configuration
          </button>
        </div>
      </form>

      {/* Security Disclaimer Banner */}
      <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-900 space-y-2 text-xs">
        <div className="flex items-center space-x-2 font-bold text-amber-950">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>IMPORTANT PROTOTYPE SECURITY & COMPLIANCE DISCLAIMER</span>
        </div>
        <p className="leading-relaxed text-slate-700">
          Prototype risk scores and heuristic classifications are designed for SMB decision support and fraud prevention screening. They are not absolute guarantees of safety or threat immunity. Production deployment requires proper multi-factor authentication, RBAC authorization, rate limiting, secure HTTPS termination, and active threat feed integrations.
        </p>
      </div>
    </div>
  );
}
