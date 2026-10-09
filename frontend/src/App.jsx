import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import LoginScreen from './components/LoginScreen';
import Overview from './pages/Overview';
import EmailSecurity from './pages/EmailSecurity';
import UrlScanner from './pages/UrlScanner';
import InvoiceVerification from './pages/InvoiceVerification';
import TrustedVendors from './pages/TrustedVendors';
import ScanHistory from './pages/ScanHistory';
import Settings from './pages/Settings';

const pageTitles = {
  '/': 'Security Overview',
  '/email': 'Email Security Scanner',
  '/url': 'URL Security Scanner',
  '/invoice': 'Invoice Fraud Verification',
  '/vendors': 'Trusted Vendors Directory',
  '/history': 'Scan Telemetry History',
  '/settings': 'System Settings',
};

function AuthenticatedApp() {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  const currentTitle = pageTitles[location.pathname] || 'TrustGuard Platform';

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header title={currentTitle} />
        <main className="flex-1 p-8 overflow-y-auto">
          <Routes>
            <Route path="/" element={<Overview />} />
            <Route path="/email" element={<EmailSecurity />} />
            <Route path="/url" element={<UrlScanner />} />
            <Route path="/invoice" element={<InvoiceVerification />} />
            <Route path="/vendors" element={<TrustedVendors />} />
            <Route path="/history" element={<ScanHistory />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <AuthenticatedApp />
      </Router>
    </AuthProvider>
  );
}
