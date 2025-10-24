import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import ProtectedRoute from './routes/ProtectedRoute';
import TopNav from './components/TopNav';
import DashboardPage from './pages/DashboardPage';
import AlertsPage from './pages/AlertsPage';
import ReportsPage from './pages/ReportsPage';
import ReportDetailPage from './pages/ReportDetailPage';
import ConnectivityPage from './pages/ConnectivityPage';
import AdvisoriesPage from './pages/AdvisoriesPage';
import LoginPage from './pages/LoginPage';
import ResidentsApprovalPage from './pages/ResidentsApprovalPage';
import './App.css';

function ProtectedLayout() {
  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #f1f5f9 0%, #f8fafc 100%)' }}>
      <TopNav />
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 16px' }}>
        <Outlet />
      </div>
    </div>
  );
}

function LoginGate() {
  const { user, role, loading } = useAuth();
  if (loading) return <div style={{ padding: 24 }}>Loading...</div>;
  if (user && role === 'official') return <Navigate to="/dashboard" replace />;
  return <LoginPage />;
}

function IndexGate() {
  const { user, role, loading } = useAuth();
  if (loading) return <div style={{ padding: 24 }}>Loading...</div>;
  if (user && role === 'official') return <Navigate to="/dashboard" replace />;
  return <Navigate to="/login" replace />;
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginGate />} />
          <Route element={<ProtectedRoute requireRole="official" />}>
            <Route element={<ProtectedLayout />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/alerts" element={<AlertsPage />} />
              <Route path="/reports" element={<ReportsPage />} />
              <Route path="/reports/:id" element={<ReportDetailPage />} />
              <Route path="/connectivity" element={<ConnectivityPage />} />
              <Route path="/residents" element={<ResidentsApprovalPage />} />
              <Route path="/advisories" element={<AdvisoriesPage />} />
            </Route>
          </Route>
          <Route path="/" element={<IndexGate />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
