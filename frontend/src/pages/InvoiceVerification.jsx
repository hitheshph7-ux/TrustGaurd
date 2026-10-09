import React, { useState } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import ScanResultCard from '../components/ScanResultCard';
import LoadingSpinner from '../components/LoadingSpinner';
import { FileCheck, Sparkles, Send, AlertTriangle, Upload, Eye, FileText, CheckCircle2 } from 'lucide-react';

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

  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrMessage, setOcrMessage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const maskAccount = (num) => {
    if (!num) return '';
    const clean = num.replace(/\s+/g, '').replace(/-/g, '');
    if (clean.length <= 4) return '•••• ' + clean;
    return '•••• •••• ' + clean.slice(-4);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setOcrLoading(true);
      setError(null);
      setOcrMessage("Reading invoice file & extracting text via OCR...");
      const res = await api.extractInvoiceOcr(file);
      const f = res.extracted_fields;
      if (f) {
        if (f.vendor_name) setVendorName(f.vendor_name);
        if (f.invoice_number) setInvoiceNumber(f.invoice_number);
        if (f.vendor_domain) setVendorDomain(f.vendor_domain);
        if (f.bank_account) setBankAccount(f.bank_account);
        if (f.ifsc_code) setIfscCode(f.ifsc_code);
        if (f.amount) setAmount(f.amount.toString());
        if (f.due_date) setDueDate(f.due_date);
        setOcrMessage(`Successfully extracted fields from ${file.name}!`);
      }
    } catch (err) {
      setError(`OCR Extraction warning: ${err.message}`);
    } finally {
      setOcrLoading(false);
    }
  };

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
    setOcrMessage(null);
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
            Cross-verify invoice details against trusted vendor directory records to stop invoice redirection fraud, fake banking details, exact duplicate billings, and amount anomalies.
          </p>
        </div>

        {/* Demo buttons */}
        <div className="flex flex-wrap gap-2 shrink-0">
          <button
            type="button"
            onClick={() => loadDemo(DEMO_MISMATCH)}
            className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-rose-500" />
            <span>Bank Mismatch Fraud</span>
          </button>
          <button
            type="button"
            onClick={() => loadDemo(DEMO_UNREGISTERED)}
            className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Unregistered Vendor</span>
          </button>
          <button
            type="button"
            onClick={() => loadDemo(DEMO_VERIFIED)}
            className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
            <span>Verified Invoice</span>
          </button>
        </div>
      </div>

      {/* OCR File Upload Dropzone */}
      <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white rounded-2xl p-6 shadow-md border border-purple-800 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-1 text-left">
          <div className="flex items-center gap-2 text-purple-300 font-bold text-xs uppercase tracking-wider">
            <Upload className="w-4 h-4 text-purple-400" />
            <span>Automated OCR Invoice Document Extraction</span>
          </div>
          <h3 className="text-base font-bold text-white">Upload Invoice Document (PDF or Image)</h3>
          <p className="text-xs text-purple-200/80 max-w-xl">
            TrustGuard automatically extracts Vendor Name, Invoice #, Bank Account, IFSC, and Amount using optical character recognition (OCR) and text parsing.
          </p>
        </div>

        <div className="shrink-0 w-full md:w-auto">
          <label className="relative flex items-center justify-center gap-2 px-5 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer transition-all border border-purple-400/30">
            <FileText className="w-4 h-4" />
            <span>{ocrLoading ? 'Extracting Text...' : 'Upload PDF / Image File'}</span>
            <input
              type="file"
              accept=".pdf,.png,.jpg,.jpeg"
              onChange={handleFileUpload}
              disabled={ocrLoading}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
          </label>
        </div>
      </div>

      {ocrMessage && (
        <div className="p-3.5 bg-purple-50 border border-purple-200 rounded-xl text-purple-800 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0" />
          <span>{ocrMessage}</span>
        </div>
      )}

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
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Bank Account Number (Submitted for Payment) *
              </label>
              {bankAccount && (
                <span className="text-[11px] font-mono font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                  Masked: {maskAccount(bankAccount)}
                </span>
              )}
            </div>
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

        <div className="flex items-center justify-between pt-2">
          <p className="text-[11px] text-slate-400 italic">
            * Security Safeguard: A changed bank account triggers out-of-band verification & pending approval workflow rather than an automatic fraud assumption.
          </p>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center space-x-2 px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-bold shadow-md transition-all disabled:opacity-50 cursor-pointer shrink-0"
          >
            <Send className="w-4 h-4" />
            <span>{loading ? 'Cross-Checking Records...' : 'Verify Invoice & Payment Details'}</span>
          </button>
        </div>
      </form>

      {/* Loading state */}
      {loading && <LoadingSpinner text="Cross-referencing trusted vendor registry, duplicate index & amount anomaly baselines..." />}

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
