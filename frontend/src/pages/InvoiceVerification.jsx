import React, { useState } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import ScanResultCard from '../components/ScanResultCard';
import LoadingSpinner from '../components/LoadingSpinner';
import { FileCheck, Sparkles, Send, AlertTriangle, Building2, ShieldAlert } from 'lucide-react';

const DEMO_MISMATCH = {
  vendor_name: "Acme Industrial Supplies",
  invoice_number: "INV-2024-88",
  vendor_domain: "acme-supplies.com",
  bank_account: "999988887777", // Altered bank account!
  ifsc_code: "SBIN0001234",
  amount: 48500.00,
  due_date: "2026-10-25"
};

const DEMO_UNREGISTERED = {
  vendor_name: "Global Tech Services LLC",
  invoice_number: "GTS-9041",
  vendor_domain: "globaltech-billing.xyz",
  bank_account: "445566778899",
  ifsc_code: "HDFC0001111",
  amount: 15200.00,
  due_date: "2026-10-30"
};

const DEMO_VERIFIED = {
  vendor_name: "Acme Industrial Supplies",
  invoice_number: "INV-2024-89",
  vendor_domain: "acme-supplies.com",
  bank_account: "987654321098", // Verified bank account
  ifsc_code: "SBIN0001234",
  amount: 12500.00,
  due_date: "2026-11-05"
};

export default function InvoiceVerification() {
  const { userId } = useAuth();
  const [vendorName, setVendorName] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [vendorDomain, setVendorDomain] = useState('');
  const [bankAccount, setBankAccount] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!vendorName.trim() || !invoiceNumber.trim() || !bankAccount.trim()) {
      setError("Vendor Name, Invoice Number, and Bank Account are required.");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await api.scanInvoice({
        vendor_name: vendorName,
        invoice_number: invoiceNumber,
        vendor_domain: vendorDomain,
        bank_account: bankAccount,
        ifsc_code: ifscCode,
        amount: parseFloat(amount) || 0,
        due_date: dueDate
      }, userId);
      setResult(res);
    } catch (err) {
      setError(err.message || 'Invoice verification failed.');
    } finally {
      setLoading(false);
    }
  };

  const loadDemo = (demo) => {
    setVendorName(demo.vendor_name);
    setInvoiceNumber(demo.invoice_number);
    setVendorDomain(demo.vendor_domain);
    setBankAccount(demo.bank_account);
    setIfscCode(demo.ifsc_code);
    setAmount(demo.amount.toString());
    setDueDate(demo.due_date);
    setError(null);
    setResult(null);
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-purple-600 font-bold text-xs uppercase tracking-wider mb-1">
            <FileCheck className="w-4 h-4" />
            <span>Invoice Fraud & Payment Audit</span>
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Invoice Verification & Bank Detail Check</h2>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Cross-verify invoice details against trusted vendor directory records to stop invoice redirection fraud, fake banking details, and duplicate billings.
          </p>
        </div>

        {/* Demo buttons */}
        <div className="flex flex-wrap gap-2 shrink-0">
          <button
            type="button"
            onClick={() => loadDemo(DEMO_MISMATCH)}
            className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-rose-500" />
            <span>Bank Mismatch Fraud</span>
          </button>
          <button
            type="button"
            onClick={() => loadDemo(DEMO_UNREGISTERED)}
            className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Unregistered Vendor</span>
          </button>
          <button
            type="button"
            onClick={() => loadDemo(DEMO_VERIFIED)}
            className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
            <span>Verified Invoice</span>
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
              Vendor Business Name *
            </label>
            <input
              type="text"
              value={vendorName}
              onChange={(e) => setVendorName(e.target.value)}
              placeholder="e.g. Acme Industrial Supplies"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-purple-500 text-sm font-medium"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Invoice Reference Number *
            </label>
            <input
              type="text"
              value={invoiceNumber}
              onChange={(e) => setInvoiceNumber(e.target.value)}
              placeholder="e.g. INV-2024-88"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-purple-500 text-sm font-medium"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Vendor Email / Website Domain
            </label>
            <input
              type="text"
              value={vendorDomain}
              onChange={(e) => setVendorDomain(e.target.value)}
              placeholder="e.g. acme-supplies.com"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-purple-500 text-sm font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Bank Account Number (Submitted for Payment) *
            </label>
            <input
              type="text"
              value={bankAccount}
              onChange={(e) => setBankAccount(e.target.value)}
              placeholder="e.g. 987654321098"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-purple-500 text-sm font-medium font-mono"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              IFSC / Routing / SWIFT Code
            </label>
            <input
              type="text"
              value={ifscCode}
              onChange={(e) => setIfscCode(e.target.value)}
              placeholder="e.g. SBIN0001234"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-purple-500 text-sm font-medium font-mono uppercase"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Total Invoice Amount ($) *
            </label>
            <input
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g. 48500.00"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-purple-500 text-sm font-medium font-mono"
              required
            />
          </div>
        </div>

        <div className="flex items-center justify-end">
          <button
            type="submit"
            disabled={loading}
            className="flex items-center space-x-2 px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-bold shadow-md transition-all disabled:opacity-50 cursor-pointer"
          >
            <Send className="w-4 h-4" />
            <span>{loading ? 'Cross-Checking Records...' : 'Verify Invoice & Payment Details'}</span>
          </button>
        </div>
      </form>

      {/* Loading state */}
      {loading && <LoadingSpinner text="Cross-referencing trusted vendor registry & duplicate scan index..." />}

      {/* Result Display */}
      {result && !loading && (
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Verification Analysis Report</h3>
          <ScanResultCard result={result} />
        </div>
      )}
    </div>
  );
}
