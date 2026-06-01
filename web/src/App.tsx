import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/auth/Login';
import DashboardLayout from './components/DashboardLayout';
import Leads from './pages/acquisition/Leads';
import Inventory from './pages/finance/Inventory';
import Overview from './pages/delivery/Overview';

// 🔒 Auth Guard component enforcing active session keys
const AuthGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const token = localStorage.getItem('redp_token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

// 🏛️ Dashboard routes wrapper injecting state properties
const DashboardWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const userStr = localStorage.getItem('redp_user');
  const user = userStr ? JSON.parse(userStr) : { role: 'admin' };
  
  return (
    <AuthGuard>
      <DashboardLayout userRole={user.role}>
        {children}
      </DashboardLayout>
    </AuthGuard>
  );
};

// 🏠 Smart Landing Redirector based on user profile roles
const HomeRedirect: React.FC = () => {
  const token = localStorage.getItem('redp_token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  
  const userStr = localStorage.getItem('redp_user');
  const user = userStr ? JSON.parse(userStr) : { role: 'admin' };
  
  // Route to the appropriate sandbox based on who logged in
  if (user.role === 'sales_agent' || user.role === 'broker') {
    return <Navigate to="/acquisition/leads" replace />;
  }
  if (user.role === 'finance_officer') {
    return <Navigate to="/finance/inventory" replace />;
  }
  if (user.role === 'delivery_engineer' || user.role === 'client') {
    return <Navigate to="/delivery/overview" replace />;
  }
  
  // Admins land on general dashboard overview
  return <Navigate to="/delivery/overview" replace />;
};

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        {/* 🔓 Authentication Portal */}
        <Route path="/login" element={<Login />} />

        {/* 🏠 Root landing routing logic */}
        <Route path="/" element={<HomeRedirect />} />

        {/* 🟠 Acquisition routes (Ragab) */}
        <Route path="/acquisition/leads" element={<DashboardWrapper><Leads /></DashboardWrapper>} />
        <Route path="/acquisition/crm" element={<DashboardWrapper><Leads /></DashboardWrapper>} />
        <Route path="/acquisition/brokers" element={<DashboardWrapper><Leads /></DashboardWrapper>} />

        {/* 🔵 Financial routes (Melwany) */}
        <Route path="/finance/inventory" element={<DashboardWrapper><Inventory /></DashboardWrapper>} />
        <Route path="/finance/payments" element={<DashboardWrapper><Inventory /></DashboardWrapper>} />
        <Route path="/finance/contracts" element={<DashboardWrapper><Inventory /></DashboardWrapper>} />

        {/* 🟢 Delivery routes (Mahmoud) */}
        <Route path="/delivery/overview" element={<DashboardWrapper><Overview /></DashboardWrapper>} />
        <Route path="/delivery/maintenance" element={<DashboardWrapper><Overview /></DashboardWrapper>} />
        <Route path="/delivery/handover" element={<DashboardWrapper><Overview /></DashboardWrapper>} />

        {/* 🔄 Fallback Catch-All */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
};

export default App;
