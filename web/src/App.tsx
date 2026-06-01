import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/auth/Login';
import DashboardLayout from './components/DashboardLayout';

// 🟠 Acquisition Pages (Ragab)
import Leads from './pages/acquisition/Leads';
import CrmKanban from './pages/acquisition/CrmKanban';
import Brokers from './pages/acquisition/Brokers';
import KycApprovals from './pages/acquisition/KycApprovals';
import Campaigns from './pages/acquisition/Campaigns';

// 🔵 Finance Pages (Melwany)
import Inventory from './pages/finance/Inventory';

// 🟢 Delivery Pages (Mahmoud)
import Overview from './pages/delivery/Overview';

// 📞 Global Components
import VoipDialerWidget from './components/acquisition/VoipDialerWidget';

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
        {/* VoIP Dialer Widget — visible on all dashboard pages */}
        <VoipDialerWidget />
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
    return <Navigate to="/acquisition/crm" replace />;
  }
  if (user.role === 'finance_officer') {
    return <Navigate to="/finance/inventory" replace />;
  }
  if (user.role === 'delivery_engineer' || user.role === 'client') {
    return <Navigate to="/delivery/overview" replace />;
  }
  
  // Admins land on CRM overview
  return <Navigate to="/acquisition/crm" replace />;
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
        <Route path="/acquisition/crm" element={<DashboardWrapper><CrmKanban /></DashboardWrapper>} />
        <Route path="/acquisition/brokers" element={<DashboardWrapper><Brokers /></DashboardWrapper>} />
        <Route path="/acquisition/kyc" element={<DashboardWrapper><KycApprovals /></DashboardWrapper>} />
        <Route path="/acquisition/campaigns" element={<DashboardWrapper><Campaigns /></DashboardWrapper>} />

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
