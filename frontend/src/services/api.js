const API_BASE = '/api';

async function handleResponse(res) {
  if (!res.ok) {
    let errorDetail = 'An unexpected error occurred';
    try {
      const text = await res.text();
      if (text) {
        try {
          const errorJson = JSON.parse(text);
          if (errorJson.detail) {
            if (typeof errorJson.detail === 'string') {
              errorDetail = errorJson.detail;
            } else if (Array.isArray(errorJson.detail)) {
              errorDetail = errorJson.detail.map((err) => `${err.loc ? err.loc.join('.') + ': ' : ''}${err.msg}`).join(', ');
            } else {
              errorDetail = JSON.stringify(errorJson.detail);
            }
          } else if (errorJson.message) {
            errorDetail = typeof errorJson.message === 'string' ? errorJson.message : JSON.stringify(errorJson.message);
          } else {
            errorDetail = text;
          }
        } catch (e) {
          errorDetail = text;
        }
      }
    } catch (e) {
      errorDetail = res.statusText || errorDetail;
    }
    throw new Error(errorDetail);
  }
  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  // Health
  getHealth: () => fetch(`${API_BASE}/health`).then(handleResponse),

  // Auth
  registerAdmin: (data) =>
    fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(handleResponse),

  loginAdmin: (data) =>
    fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(handleResponse),

  getMe: (token) =>
    fetch(`${API_BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then(handleResponse),

  // Dashboard Stats (User Isolated)
  getDashboardStats: (userId = null) => {
    const query = userId ? `?user_id=${userId}` : '';
    return fetch(`${API_BASE}/dashboard/stats${query}`).then(handleResponse);
  },

  // Scanners (User Isolated)
  scanEmail: (subject, sender, body, userId = null) =>
    fetch(`${API_BASE}/scans/email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subject, sender, body, user_id: userId }),
    }).then(handleResponse),

  scanUrl: (url, userId = null) =>
    fetch(`${API_BASE}/scans/url`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, user_id: userId }),
    }).then(handleResponse),

  scanInvoice: (data, userId = null) =>
    fetch(`${API_BASE}/scans/invoice`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, user_id: userId }),
    }).then(handleResponse),

  // Scan History (User Isolated)
  getScans: (params = {}) => {
    const query = new URLSearchParams();
    if (params.user_id) query.append('user_id', params.user_id);
    if (params.scan_type) query.append('scan_type', params.scan_type);
    if (params.risk_level) query.append('risk_level', params.risk_level);
    if (params.limit) query.append('limit', params.limit);
    if (params.offset) query.append('offset', params.offset);
    return fetch(`${API_BASE}/scans?${query.toString()}`).then(handleResponse);
  },

  getScanById: (id) => fetch(`${API_BASE}/scans/${id}`).then(handleResponse),

  // Vendor Management
  getVendors: () => fetch(`${API_BASE}/vendors`).then(handleResponse),

  createVendor: (vendorData) =>
    fetch(`${API_BASE}/vendors`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(vendorData),
    }).then(handleResponse),

  updateVendor: (id, vendorData) =>
    fetch(`${API_BASE}/vendors/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(vendorData),
    }).then(handleResponse),

  deleteVendor: (id) =>
    fetch(`${API_BASE}/vendors/${id}`, {
      method: 'DELETE',
    }).then(handleResponse),
};
