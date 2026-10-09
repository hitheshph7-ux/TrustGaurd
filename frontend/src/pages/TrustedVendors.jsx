import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import Modal from '../components/Modal';
import LoadingSpinner from '../components/LoadingSpinner';
import { formatCurrency } from '../utils/formatters';
import {
  Building2,
  Plus,
  Search,
  CheckCircle2,
  AlertTriangle,
  Edit2,
  Trash2,
  ShieldCheck,
  Lock,
  History,
  FileCheck,
  Check
} from 'lucide-react';

export default function TrustedVendors() {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState(null);
  const [deletingVendor, setDeletingVendor] = useState(null);
  
  // Bank Change History Modal
  const [historyVendor, setHistoryVendor] = useState(null);
  const [bankHistory, setBankHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  
  // New Bank Change Request State
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [newAccInput, setNewAccInput] = useState('');
  const [newIfscInput, setNewIfscInput] = useState('');
  const [changeReasonInput, setChangeReasonInput] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    domain: '',
    invoice_ref: '',
    bank_account: '',
    ifsc_code: '',
    approved_by: 'Security Officer',
    verification_status: 'verified',
    max_typical_amount: ''
  });

  const loadVendors = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getVendors();
      setVendors(data);
    } catch (err) {
      setError(err.message || 'Failed to fetch vendor directory');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVendors();
  }, []);

  const handleOpenHistory = async (vendor) => {
    setHistoryVendor(vendor);
    try {
      setHistoryLoading(true);
      const res = await api.getVendorBankHistory(vendor.id);
      setBankHistory(res.history || []);
    } catch (err) {
      alert(`Failed to fetch bank history: ${err.message}`);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleRequestBankChange = async (e) => {
    e.preventDefault();
    if (!historyVendor || !newAccInput.trim()) return;
    try {
      setHistoryLoading(true);
      await api.requestVendorBankChange(historyVendor.id, {
        new_bank_account: newAccInput.trim(),
        new_ifsc_code: newIfscInput.trim(),
        change_reason: changeReasonInput.trim() || "Vendor requested bank account update"
      });
      setIsRequestModalOpen(false);
      setNewAccInput('');
      setNewIfscInput('');
      setChangeReasonInput('');
      // Reload history
      const res = await api.getVendorBankHistory(historyVendor.id);
      setBankHistory(res.history || []);
    } catch (err) {
      alert(`Failed to request bank change: ${err.message}`);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleApproveBankChange = async (historyId) => {
    if (!historyVendor) return;
    try {
      setHistoryLoading(true);
      await api.approveVendorBankChange(historyVendor.id, historyId, {
        approved_by: "Security Lead (Telephone Verified)"
      });
      await loadVendors();
      const res = await api.getVendorBankHistory(historyVendor.id);
      setBankHistory(res.history || []);
    } catch (err) {
      alert(`Failed to approve bank change: ${err.message}`);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setFormData({
      name: '',
      domain: '',
      invoice_ref: '',
      bank_account: '',
      ifsc_code: '',
      approved_by: 'Security Officer',
      verification_status: 'verified',
      max_typical_amount: ''
    });
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (vendor) => {
    setEditingVendor(vendor);
    setFormData({
      name: vendor.name,
      domain: vendor.domain,
      invoice_ref: vendor.invoice_ref || '',
      bank_account: vendor.bank_account,
      ifsc_code: vendor.ifsc_code,
      approved_by: vendor.approved_by || 'Security Officer',
      verification_status: vendor.verification_status || 'verified',
      max_typical_amount: vendor.max_typical_amount ? vendor.max_typical_amount.toString() : ''
    });
  };

  const handleSaveVendor = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const payload = {
        name: formData.name.trim(),
        domain: formData.domain.trim(),
        invoice_ref: formData.invoice_ref ? formData.invoice_ref.trim() : '',
        bank_account: formData.bank_account.trim(),
        ifsc_code: formData.ifsc_code.trim(),
        approved_by: formData.approved_by,
        verification_status: formData.verification_status,
        max_typical_amount: formData.max_typical_amount ? parseFloat(formData.max_typical_amount) : null
      };

      if (editingVendor) {
        await api.updateVendor(editingVendor.id, payload);
      } else {
        await api.createVendor(payload);
      }

      setIsAddModalOpen(false);
      setEditingVendor(null);
      await loadVendors();
    } catch (err) {
      alert(err.message || 'Error saving vendor details');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteVendor = async () => {
    if (!deletingVendor) return;
    try {
      setLoading(true);
      await api.deleteVendor(deletingVendor.id);
      setDeletingVendor(null);
      await loadVendors();
    } catch (err) {
      alert(err.message || 'Error deleting vendor record');
    } finally {
      setLoading(false);
    }
  };

  const filteredVendors = vendors.filter(
    (v) =>
      v.name.toLowerCase().includes(search.toLowerCase()) ||
      v.domain.toLowerCase().includes(search.toLowerCase()) ||
      (v.invoice_ref || '').toLowerCase().includes(search.toLowerCase()) ||
      v.bank_account.includes(search)
  );

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-indigo-600 font-bold text-xs uppercase tracking-wider mb-1">
            <Building2 className="w-4 h-4" />
            <span>Trusted Vendor Directory</span>
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Verified Vendors & Invoice Reference Register</h2>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Maintain verified banking credentials, invoice reference prefixes, and out-of-band telephone approval workflows to stop invoice redirection fraud.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center space-x-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md transition-all shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Register New Vendor</span>
        </button>
      </div>

      {/* Auditable Verification Warning Notice */}
      <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-900 flex items-start space-x-3">
        <Lock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold">Strict Bank Detail Change Approval Workflow:</span> A changed bank account triggers out-of-band telephone verification and pending approval status before payment authorization. Never overwrite bank details automatically from incoming emails.
        </div>
      </div>

      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, domain, invoice ref, or bank account..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-300 text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-white"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Showing <span className="font-bold text-slate-900">{filteredVendors.length}</span> registered vendor(s)
        </div>
      </div>

      {/* Vendors Table */}
      {loading && vendors.length === 0 ? (
        <LoadingSpinner text="Loading trusted vendor directory..." />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-100 text-slate-400 uppercase font-semibold text-[10px]">
                <tr>
                  <th className="px-6 py-3">Vendor Business</th>
                  <th className="px-6 py-3">Official Domain</th>
                  <th className="px-6 py-3">Invoice Ref / Prefix</th>
                  <th className="px-6 py-3">Verified Bank Account</th>
                  <th className="px-6 py-3">IFSC / Routing</th>
                  <th className="px-6 py-3">Max Threshold</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredVendors.map((vendor) => (
                  <tr key={vendor.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-900">
                      {vendor.name}
                    </td>
                    <td className="px-6 py-4 font-mono text-slate-600">
                      {vendor.domain}
                    </td>
                    <td className="px-6 py-4 font-mono text-indigo-700 font-bold">
                      {vendor.invoice_ref ? (
                        <span className="px-2 py-0.5 bg-indigo-50 border border-indigo-100 rounded text-[11px]">
                          {vendor.invoice_ref}
                        </span>
                      ) : (
                        <span className="text-slate-400 font-normal">N/A</span>
                      )}
                    </td>
                    <td className="px-6 py-4 font-mono font-bold text-slate-900">
                      {vendor.bank_account}
                    </td>
                    <td className="px-6 py-4 font-mono uppercase text-slate-700">
                      {vendor.ifsc_code}
                    </td>
                    <td className="px-6 py-4 font-mono text-slate-700">
                      {vendor.max_typical_amount ? formatCurrency(vendor.max_typical_amount) : 'Unlimited'}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-[10px]">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>VERIFIED</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-1">
                      <button
                        onClick={() => handleOpenHistory(vendor)}
                        className="p-1.5 rounded-lg text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                        title="View Bank Change History & Workflow"
                      >
                        <History className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleOpenEdit(vendor)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-slate-100 transition-colors cursor-pointer"
                        title="Edit Vendor"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeletingVendor(vendor)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-slate-100 transition-colors cursor-pointer"
                        title="Delete Vendor"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Vendor Modal */}
      <Modal
        isOpen={isAddModalOpen || !!editingVendor}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingVendor(null);
        }}
        title={editingVendor ? `Edit Vendor: ${editingVendor.name}` : 'Register New Trusted Vendor'}
      >
        <form onSubmit={handleSaveVendor} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Vendor Business Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Acme Industrial Supplies"
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm font-medium focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Official Domain *
              </label>
              <input
                type="text"
                value={formData.domain}
                onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                placeholder="e.g. acme-supplies.com"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm font-medium focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Invoice Reference Number / Prefix
              </label>
              <input
                type="text"
                value={formData.invoice_ref}
                onChange={(e) => setFormData({ ...formData, invoice_ref: e.target.value })}
                placeholder="e.g. INV-2024-ACME"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm font-mono focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Verified Bank Account Number *
              </label>
              <input
                type="text"
                value={formData.bank_account}
                onChange={(e) => setFormData({ ...formData, bank_account: e.target.value })}
                placeholder="e.g. 987654321098"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm font-mono focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                IFSC / Routing Code *
              </label>
              <input
                type="text"
                value={formData.ifsc_code}
                onChange={(e) => setFormData({ ...formData, ifsc_code: e.target.value })}
                placeholder="e.g. SBIN0001234"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm font-mono uppercase focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Maximum Typical Invoice Threshold ($)
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.max_typical_amount}
              onChange={(e) => setFormData({ ...formData, max_typical_amount: e.target.value })}
              placeholder="e.g. 50000.00 (Optional max typical limit)"
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm font-mono focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={() => {
                setIsAddModalOpen(false);
                setEditingVendor(null);
              }}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer"
            >
              Save Vendor Record
            </button>
          </div>
        </form>
      </Modal>

      {/* Bank Change Audit Log & Approval Workflow Modal */}
      <Modal
        isOpen={!!historyVendor}
        onClose={() => setHistoryVendor(null)}
        title={`Bank Detail Change History & Workflow: ${historyVendor?.name}`}
      >
        <div className="space-y-5">
          <div className="flex items-center justify-between bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <div>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Current Verified Account</p>
              <p className="text-sm font-mono font-extrabold text-slate-900">{historyVendor?.bank_account}</p>
            </div>
            <button
              onClick={() => setIsRequestModalOpen(true)}
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              Request Bank Account Update
            </button>
          </div>

          {/* History Records List */}
          {historyLoading ? (
            <LoadingSpinner text="Fetching audit history..." />
          ) : bankHistory.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-4">No bank detail change history recorded yet.</p>
          ) : (
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Audit Log Entries ({bankHistory.length})</h4>
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-white">
                {bankHistory.map((rec) => (
                  <div key={rec.id} className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-slate-500 line-through">{rec.old_bank_account_masked}</span>
                        <span className="text-slate-400">→</span>
                        <span className="font-mono font-bold text-indigo-700">{rec.new_bank_account_masked}</span>
                        {rec.status === 'verified' ? (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[10px]">VERIFIED</span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 font-bold text-[10px]">PENDING APPROVAL</span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Reason: {rec.change_reason || 'N/A'} | Requested by: <span className="font-medium text-slate-700">{rec.requested_by}</span>
                      </p>
                      <p className="text-[10px] text-slate-400">
                        Approved/Verified by: {rec.approved_by}
                      </p>
                    </div>

                    {rec.status === 'pending_approval' && (
                      <button
                        onClick={() => handleApproveBankChange(rec.id)}
                        className="flex items-center space-x-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shrink-0 transition-colors cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Verify & Approve Change</span>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* Request Bank Change Sub-Modal */}
      <Modal
        isOpen={isRequestModalOpen}
        onClose={() => setIsRequestModalOpen(false)}
        title="Submit Bank Account Change Request"
      >
        <form onSubmit={handleRequestBankChange} className="space-y-4">
          <p className="text-xs text-slate-600">
            Submitting a bank change request registers a pending record. A telephone verification step is required before final approval.
          </p>
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">New Bank Account Number *</label>
            <input
              type="text"
              value={newAccInput}
              onChange={(e) => setNewAccInput(e.target.value)}
              placeholder="e.g. 556677889900"
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm font-mono"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">New IFSC / Routing Code</label>
            <input
              type="text"
              value={newIfscInput}
              onChange={(e) => setNewIfscInput(e.target.value)}
              placeholder="e.g. ICIC0009012"
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm font-mono uppercase"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Reason for Bank Change</label>
            <input
              type="text"
              value={changeReasonInput}
              onChange={(e) => setChangeReasonInput(e.target.value)}
              placeholder="e.g. Vendor updated official payment invoice instructions"
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm"
            />
          </div>
          <div className="flex justify-end space-x-3 pt-3">
            <button
              type="button"
              onClick={() => setIsRequestModalOpen(false)}
              className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer"
            >
              Submit Change Request
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deletingVendor}
        onClose={() => setDeletingVendor(null)}
        title="Confirm Vendor Deletion"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600">
            Are you sure you want to remove <span className="font-bold text-slate-900">{deletingVendor?.name}</span> from the trusted vendor directory? Subsequent invoices from this vendor will be flagged as unregistered.
          </p>

          <div className="flex justify-end space-x-3 pt-2">
            <button
              onClick={() => setDeletingVendor(null)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteVendor}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer"
            >
              Delete Vendor
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
