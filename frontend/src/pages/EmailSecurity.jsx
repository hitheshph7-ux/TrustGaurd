import React, { useState } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import ScanResultCard from '../components/ScanResultCard';
import LoadingSpinner from '../components/LoadingSpinner';
import { Mail, Sparkles, Send, AlertTriangle, Info, Megaphone } from 'lucide-react';

const DEMO_PHISHING = {
  subject: "URGENT: Payroll account access suspended immediately!",
  sender: "Payroll Security <support@verify-bank-update.xyz>",
  body: "Dear employee,\n\nWe detected unauthorized sign-in attempts on your payroll deposit account. Your account has been locked. You must re-enter your password and confirm your social security number within 24 hours to prevent permanent account suspension.\n\nClick link to verify credentials: http://192.168.1.50/payroll-login"
};

const DEMO_SPAM = {
  subject: "CONGRATULATIONS! You won a $1,000 Amazon Gift Card!!!",
  sender: "Promotional Deals <rewards@unbeatable-discount-offers.xyz>",
  body: "You have been selected as our lucky winner today! Act now to claim your free $1,000 gift card reward. Earn 80% off brand watches and designer electronics with guaranteed free shipping. Click here now to claim your cash reward: http://unbeatable-discount-offers.xyz/claim-giftcard"
};

const DEMO_LEGIT = {
  subject: "Weekly Operations Sync Meeting Notes",
  sender: "Sarah Jenkins <s.jenkins@acme-corp.com>",
  body: "Hi team,\n\nThanks for attending our weekly operations review today. Attached in the shared drive are the updated quarterly planning slides. Please review item #4 before our call on Thursday.\n\nBest regards,\nSarah"
};

export default function EmailSecurity() {
  const { userId } = useAuth();
  const [subject, setSubject] = useState('');
  const [sender, setSender] = useState('');
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!sender.trim() || !body.trim()) {
      setError("Sender email and Email body are required fields.");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await api.scanEmail(subject, sender, body, userId);
      setResult(res);
    } catch (err) {
      setError(err.message || 'Email scan failed.');
    } finally {
      setLoading(false);
    }
  };

  const loadDemo = (sample) => {
    setSubject(sample.subject);
    setSender(sample.sender);
    setBody(sample.body);
    setError(null);
    setResult(null);
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-indigo-600 font-bold text-xs uppercase tracking-wider mb-1">
            <Mail className="w-4 h-4" />
            <span>AI Email Security Scanner</span>
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Phishing & Promotional Spam Inspection</h2>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Detect phishing threats, credential harvest attempts, brand impersonation, AND unsolicited promotional spam using rule-based heuristics & Scikit-Learn multi-class classification.
          </p>
        </div>

        {/* Demo buttons */}
        <div className="flex flex-wrap gap-2 shrink-0">
          <button
            type="button"
            onClick={() => loadDemo(DEMO_PHISHING)}
            className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-rose-500" />
            <span>Phishing Sample</span>
          </button>
          <button
            type="button"
            onClick={() => loadDemo(DEMO_SPAM)}
            className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Megaphone className="w-3.5 h-3.5 text-amber-500" />
            <span>Spam Sample</span>
          </button>
          <button
            type="button"
            onClick={() => loadDemo(DEMO_LEGIT)}
            className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
            <span>Safe Sample</span>
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Sender Address / Header Display Name *
            </label>
            <input
              type="text"
              value={sender}
              onChange={(e) => setSender(e.target.value)}
              placeholder="e.g. PayPal Security <support@paypal-update.xyz>"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-sm font-medium"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Email Subject Line
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. CONGRATULATIONS! You won a prize"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-sm font-medium"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Full Email Body Text *
          </label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={6}
            placeholder="Paste the raw or body text of the suspicious or spam email here..."
            className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-sm font-medium leading-relaxed font-mono"
            required
          />
        </div>

        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center space-x-2 text-xs text-slate-400">
            <Info className="w-3.5 h-3.5 text-slate-400" />
            <span>Scans evaluate both malicious phishing indicators and commercial promotional spam patterns.</span>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex items-center space-x-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-md transition-all disabled:opacity-50 cursor-pointer"
          >
            <Send className="w-4 h-4" />
            <span>{loading ? 'Analyzing Email...' : 'Run Email & Spam Analysis'}</span>
          </button>
        </div>
      </form>

      {/* Loading state */}
      {loading && <LoadingSpinner text="Evaluating phishing heuristics, promotional spam patterns & Scikit-Learn TF-IDF model..." />}

      {/* Result Display */}
      {result && !loading && (
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Analysis Result Report</h3>
          <ScanResultCard result={result} />
        </div>
      )}
    </div>
  );
}
