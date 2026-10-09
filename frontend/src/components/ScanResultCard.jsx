import React, { useState } from 'react';
import RiskBadge from './RiskBadge';
import { formatDate } from '../utils/formatters';
import { ShieldAlert, CheckCircle, AlertTriangle, Cpu, ListChecks, ChevronDown, ChevronUp, Code2, Megaphone, Shield } from 'lucide-react';

export default function ScanResultCard({ result }) {
  const [showJson, setShowJson] = useState(false);

  if (!result) return null;

  const {
    risk_level,
    risk_score,
    target_identifier,
    reasons = [],
    recommendations = [],
    details = {},
    created_at,
    scan_type
  } = result;

  const getGaugeColor = (score) => {
    if (score >= 65) return 'from-rose-500 to-red-600';
    if (score >= 35) return 'from-amber-400 to-amber-500';
    return 'from-emerald-400 to-teal-500';
  };

  const getCategoryBadge = (cat) => {
    if (!cat) return null;
    if (cat.includes('Phishing')) {
      return (
        <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-bold flex items-center gap-1">
          <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
          {cat}
        </span>
      );
    } else if (cat.includes('Spam')) {
      return (
        <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold flex items-center gap-1">
          <Megaphone className="w-3.5 h-3.5 text-amber-400" />
          {cat}
        </span>
      );
    } else {
      return (
        <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold flex items-center gap-1">
          <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
          {cat}
        </span>
      );
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in duration-300">
      {/* Card Header Banner */}
      <div className="p-6 border-b border-slate-100 bg-slate-900 text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs text-sky-400 font-mono uppercase tracking-wider mb-1">
            <span className="px-2 py-0.5 rounded bg-sky-500/20 border border-sky-500/30 font-bold">
              {scan_type?.toUpperCase()} ANALYSIS
            </span>
            {details.email_category && getCategoryBadge(details.email_category)}
            {created_at && <span>• {formatDate(created_at)}</span>}
          </div>
          <h3 className="text-lg font-bold text-white tracking-tight break-all">
            {target_identifier}
          </h3>
          <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-indigo-400" />
            {details.assessment_classification || 'Rule Heuristics & Multi-Class ML Model'}
          </p>
        </div>

        <div className="flex items-center space-x-4 bg-slate-800/90 p-3 px-5 rounded-xl border border-slate-700 shrink-0">
          <div className="text-center">
            <p className="text-[10px] text-slate-400 uppercase font-semibold">Risk Level</p>
            <div className="mt-1">
              <RiskBadge level={risk_level} />
            </div>
          </div>
          <div className="h-8 w-px bg-slate-700"></div>
          <div className="text-center">
            <p className="text-[10px] text-slate-400 uppercase font-semibold">Risk Score</p>
            <p className="text-2xl font-black font-mono tracking-tight text-white mt-0.5">
              {risk_score}<span className="text-xs text-slate-500">/100</span>
            </p>
          </div>
        </div>
      </div>

      {/* Score Progress Gauge Bar */}
      <div className="w-full bg-slate-100 h-2">
        <div
          className={`h-full bg-gradient-to-r ${getGaugeColor(risk_score)} transition-all duration-700 ease-out`}
          style={{ width: `${Math.max(5, Math.min(100, risk_score))}%` }}
        ></div>
      </div>

      {/* Phishing vs Spam Metrics Sub-Bar if available */}
      {details.phishing_risk_score !== undefined && details.spam_probability_score !== undefined && (
        <div className="bg-slate-50 px-6 py-3 border-b border-slate-100 flex items-center justify-between text-xs font-semibold">
          <div className="flex items-center space-x-2 text-rose-700">
            <ShieldAlert className="w-4 h-4 text-rose-500" />
            <span>Phishing Risk Index: <strong className="font-mono text-sm">{details.phishing_risk_score}%</strong></span>
          </div>
          <div className="h-4 w-px bg-slate-200"></div>
          <div className="flex items-center space-x-2 text-amber-700">
            <Megaphone className="w-4 h-4 text-amber-500" />
            <span>Spam Probability Index: <strong className="font-mono text-sm">{details.spam_probability_score}%</strong></span>
          </div>
        </div>
      )}

      {/* Main Analysis Content */}
      <div className="p-6 space-y-6">
        {/* Reasons & Findings */}
        <div>
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            Supporting Assessment Findings & Risk Indicators ({reasons.length})
          </h4>
          <ul className="space-y-2">
            {reasons.map((reason, idx) => (
              <li
                key={idx}
                className="flex items-start space-x-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200/70 text-sm text-slate-800"
              >
                <span className="inline-block w-2 h-2 rounded-full bg-slate-400 mt-1.5 shrink-0"></span>
                <span className="leading-snug">{reason}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Recommended Next Steps */}
        {recommendations.length > 0 && (
          <div>
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2 mb-3">
              <ListChecks className="w-4 h-4 text-sky-500" />
              Recommended Actions
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {recommendations.map((rec, idx) => (
                <div
                  key={idx}
                  className="flex items-start space-x-2.5 p-3 rounded-xl bg-sky-50/60 border border-sky-100 text-xs font-medium text-sky-900"
                >
                  <CheckCircle className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
                  <span>{rec}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ML / Technical Metadata Toggle */}
        <div className="pt-2 border-t border-slate-100">
          <button
            onClick={() => setShowJson(!showJson)}
            className="flex items-center space-x-1.5 text-xs text-slate-500 hover:text-slate-800 font-medium transition-colors cursor-pointer"
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>{showJson ? 'Hide Technical Metadata' : 'Inspect Raw Security Payload'}</span>
            {showJson ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>

          {showJson && (
            <pre className="mt-3 p-4 bg-slate-900 text-slate-200 rounded-xl text-xs font-mono overflow-x-auto border border-slate-800">
              {JSON.stringify({ risk_level, risk_score, details, target_identifier }, null, 2)}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
}
