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
import Contracts from './pages/finance/Contracts';
import Payments from './pages/finance/Payments';
import Collections from './pages/finance/Collections';

// 🟢 Delivery Pages (Mahmoud)
import Overview from './pages/delivery/Overview';
import Maintenance from './pages/delivery/Maintenance';
import Handover from './pages/delivery/Handover';
import Documents from './pages/delivery/Documents';
import Analytics from './pages/delivery/Analytics';
import Workflows from './pages/delivery/Workflows';

// 👑 Admin Pages
import AdminPanel from './pages/admin/AdminPanel';


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
    return <Navigate to="/acquisition/leads" replace />;
  }
  if (user.role === 'finance_officer') {
    return <Navigate to="/finance/inventory" replace />;
  }
  if (user.role === 'delivery_engineer' || user.role === 'client') {
    return <Navigate to="/delivery/overview" replace />;
  }

  // Admins land on Leads & KYC first
  return <Navigate to="/acquisition/leads" replace />;
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

        {/* 🔵 Financial routes (Melwany) — Each route has its own dedicated component */}
        <Route path="/finance/inventory" element={<DashboardWrapper><Inventory /></DashboardWrapper>} />
        <Route path="/finance/payments" element={<DashboardWrapper><Payments /></DashboardWrapper>} />
        <Route path="/finance/contracts" element={<DashboardWrapper><Contracts /></DashboardWrapper>} />
        <Route path="/finance/collections" element={<DashboardWrapper><Collections /></DashboardWrapper>} />

        {/* 🟢 Delivery routes (Mahmoud) */}
        <Route path="/delivery/overview" element={<DashboardWrapper><Overview /></DashboardWrapper>} />
        <Route path="/delivery/maintenance" element={<DashboardWrapper><Maintenance /></DashboardWrapper>} />
        <Route path="/delivery/handover" element={<DashboardWrapper><Handover /></DashboardWrapper>} />
        <Route path="/delivery/documents" element={<DashboardWrapper><Documents /></DashboardWrapper>} />
        <Route path="/delivery/analytics" element={<DashboardWrapper><Analytics /></DashboardWrapper>} />
        <Route path="/delivery/workflows" element={<DashboardWrapper><Workflows /></DashboardWrapper>} />

        {/* 👑 Admin routes */}
        <Route path="/admin/panel" element={<DashboardWrapper><AdminPanel /></DashboardWrapper>} />


        {/* 🔄 Fallback Catch-All */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
};

export default App;
