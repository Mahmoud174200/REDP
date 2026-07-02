import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/auth/Login';
import ClientLogin from './pages/auth/ClientLogin';
import DashboardLayout from './components/DashboardLayout';
import LandingPage from './pages/public/LandingPage';
import InteractiveUnitSelection from './pages/public/InteractiveUnitSelection';

// 🟠 Acquisition Pages
import Leads from './pages/acquisition/Leads';
import CrmKanban from './pages/acquisition/CrmKanban';
import Brokers from './pages/acquisition/Brokers';
import KycApprovals from './pages/acquisition/KycApprovals';
import Campaigns from './pages/acquisition/Campaigns';
import EoiReservations from './pages/acquisition/EoiReservations';

// 🔶 Tiered Sales Portals
import TeleSalesPortal from './pages/sales/TeleSalesPortal';
import BrokerPortal from './pages/sales/BrokerPortal';
import BookingPriorities from './pages/sales/BookingPriorities';
import CompanySalesPortal from './pages/sales/CompanySalesPortal';
import CompanySalesFlow from './pages/sales/CompanySalesFlow';

// 🔵 Finance Pages
import Inventory from './pages/finance/Inventory';
import Contracts from './pages/finance/Contracts';
import Payments from './pages/finance/Payments';
import Collections from './pages/finance/Collections';
import ReservedUnits from './pages/finance/ReservedUnits';
import PlanApprovals from './pages/finance/PlanApprovals';
import FinanceOverview from './pages/finance/FinanceOverview';

// 🟢 Delivery Pages
import Overview from './pages/delivery/Overview';
import Maintenance from './pages/delivery/Maintenance';
import Handover from './pages/delivery/Handover';
import Documents from './pages/delivery/Documents';
import Analytics from './pages/delivery/Analytics';
import Workflows from './pages/delivery/Workflows';

// 👑 Admin Pages
import AdminPanel from './pages/admin/AdminPanel';
import CampaignsPage from './pages/admin/CampaignsPage';
import MasterPlanPage from './pages/admin/MasterPlanPage';

// 🏢 Enterprise Pages
import OrganizationManagement from './pages/enterprise/OrganizationManagement';
import RbacManagement from './pages/enterprise/RbacManagement';
import ApprovalWorkflows from './pages/enterprise/ApprovalWorkflows';
import LegalManagement from './pages/enterprise/LegalManagement';
import Customer360 from './pages/enterprise/Customer360';
import TaskBoard from './pages/enterprise/TaskBoard';
import MessageHub from './pages/enterprise/MessageHub';
import AuditDashboard from './pages/enterprise/AuditDashboard';
import ChartOfAccounts from './pages/enterprise/accounting/ChartOfAccounts';
import JournalEntries from './pages/enterprise/accounting/JournalEntries';
import FinancialReports from './pages/enterprise/accounting/FinancialReports';
import BudgetManagement from './pages/enterprise/accounting/BudgetManagement';
import PurchaseRequests from './pages/enterprise/procurement/PurchaseRequests';
import RFQs from './pages/enterprise/procurement/RFQs';
import PurchaseOrders from './pages/enterprise/procurement/PurchaseOrders';
import GoodsReceipts from './pages/enterprise/procurement/GoodsReceipts';
import VendorInvoices from './pages/enterprise/procurement/VendorInvoices';
import CommissionRules from './pages/enterprise/commission/CommissionRules';
import CommissionCalculations from './pages/enterprise/commission/CommissionCalculations';
import CommissionPayouts from './pages/enterprise/commission/CommissionPayouts';
import AiDashboard from './pages/enterprise/ai/AiDashboard';
import ExecutiveDashboards from './pages/enterprise/dashboard/ExecutiveDashboards';
import TenantManagement from './pages/enterprise/tenant/TenantManagement';
import GlobalizationSettings from './pages/enterprise/globalization/GlobalizationSettings';
import ConstructionProgress from './pages/enterprise/construction/ConstructionProgress';
import QualityManagement from './pages/enterprise/quality/QualityManagement';



// 📞 Global Components
import VoipDialerWidget from './components/acquisition/VoipDialerWidget';
import DemoTour from './components/DemoTour';
import AiAssistant from './components/AiAssistant';

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
        {/* VoIP Dialer Widget — visible on all dashboard pages except brokers */}
        {user.role !== 'broker' && <VoipDialerWidget />}
        {/* 🤖 Aiva AI Assistant — role-scoped agentic chatbot (bottom-left) */}
        <AiAssistant mode="internal" />
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
  if (user.role === 'tele_sales') {
    return <Navigate to="/sales/tele/dashboard" replace />;
  }
  if (user.role === 'broker') {
    return <Navigate to="/sales/broker/dashboard" replace />;
  }
  if (user.role === 'company_sales') {
    return <Navigate to="/sales/company/dashboard" replace />;
  }
  if (user.role === 'sales_agent') {
    return <Navigate to="/acquisition/leads" replace />;
  }
  if (user.role === 'finance_officer') {
    return <Navigate to="/finance/payments" replace />;
  }
  if (user.role === 'client') {
    return <Navigate to="/delivery/overview" replace />;
  }
  if (user.role === 'delivery_engineer') {
    return <Navigate to="/delivery/handover" replace />;
  }
  if (user.role === 'handover_officer') {
    return <Navigate to="/delivery/overview" replace />;
  }
  if (user.role === 'executive') {
    return <Navigate to="/enterprise/dashboard" replace />;
  }
  if (user.role === 'project_manager') {
    return <Navigate to="/enterprise/construction" replace />;
  }
  if (user.role === 'maintenance_manager') {
    return <Navigate to="/delivery/maintenance" replace />;
  }
  if (user.role === 'legal_officer') {
    return <Navigate to="/enterprise/legal" replace />;
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
        <Route path="/client-login" element={<ClientLogin />} />

        {/* 🏠 Public Landing Page */}
        <Route path="/" element={<><LandingPage /><AiAssistant mode="public" /></>} />

        {/* 🏗️ Interactive 3D Unit Selection */}
        <Route path="/unit-selection" element={<><InteractiveUnitSelection /><AiAssistant mode="public" /></>} />

        {/* 🏠 Root landing routing logic */}
        <Route path="/dashboard" element={<HomeRedirect />} />

        {/* 🟠 Acquisition routes */}
        <Route path="/acquisition/leads" element={<DashboardWrapper><Leads /></DashboardWrapper>} />
        <Route path="/acquisition/crm" element={<DashboardWrapper><CrmKanban /></DashboardWrapper>} />
        <Route path="/acquisition/brokers" element={<DashboardWrapper><Brokers /></DashboardWrapper>} />
        <Route path="/acquisition/kyc" element={<DashboardWrapper><KycApprovals /></DashboardWrapper>} />
        <Route path="/acquisition/campaigns" element={<DashboardWrapper><Campaigns /></DashboardWrapper>} />
        <Route path="/acquisition/eoi-reservations" element={<DashboardWrapper><EoiReservations /></DashboardWrapper>} />

        {/* 🔶 Tiered Sales Portals */}
        <Route path="/sales/tele/dashboard" element={<DashboardWrapper><TeleSalesPortal /></DashboardWrapper>} />
        <Route path="/sales/broker/dashboard" element={<DashboardWrapper><BrokerPortal /></DashboardWrapper>} />
        <Route path="/sales/priorities" element={<DashboardWrapper><BookingPriorities /></DashboardWrapper>} />
        <Route path="/sales/company/dashboard" element={<DashboardWrapper><CompanySalesFlow /></DashboardWrapper>} />
        <Route path="/sales/company/legacy" element={<DashboardWrapper><CompanySalesPortal /></DashboardWrapper>} />

        {/* 🔵 Financial routes */}
        <Route path="/finance/inventory" element={<DashboardWrapper><Inventory /></DashboardWrapper>} />
        <Route path="/finance/payments" element={<DashboardWrapper><FinanceOverview /></DashboardWrapper>} />
        <Route path="/finance/ledger" element={<DashboardWrapper><Payments /></DashboardWrapper>} />
        <Route path="/finance/contracts" element={<DashboardWrapper><Contracts /></DashboardWrapper>} />
        <Route path="/finance/plan-approvals" element={<DashboardWrapper><PlanApprovals /></DashboardWrapper>} />
        <Route path="/finance/collections" element={<DashboardWrapper><Collections /></DashboardWrapper>} />
        <Route path="/finance/reserved" element={<DashboardWrapper><ReservedUnits /></DashboardWrapper>} />

        {/* 🟢 Delivery routes */}
        <Route path="/delivery/overview" element={<DashboardWrapper><Overview /></DashboardWrapper>} />
        <Route path="/delivery/maintenance" element={<DashboardWrapper><Maintenance /></DashboardWrapper>} />
        <Route path="/delivery/handover" element={<DashboardWrapper><Handover /></DashboardWrapper>} />
        <Route path="/delivery/documents" element={<DashboardWrapper><Documents /></DashboardWrapper>} />
        <Route path="/delivery/analytics" element={<DashboardWrapper><Analytics /></DashboardWrapper>} />
        <Route path="/delivery/workflows" element={<DashboardWrapper><Workflows /></DashboardWrapper>} />

        {/* 👑 Admin routes */}
        <Route path="/admin/panel" element={<DashboardWrapper><AdminPanel /></DashboardWrapper>} />
        <Route path="/admin/campaigns" element={<DashboardWrapper><CampaignsPage /></DashboardWrapper>} />
        <Route path="/admin/master-plan/:projectId" element={<DashboardWrapper><MasterPlanPage /></DashboardWrapper>} />

        {/* 🏢 Enterprise routes */}
        <Route path="/enterprise/organization" element={<DashboardWrapper><OrganizationManagement /></DashboardWrapper>} />
        <Route path="/enterprise/rbac" element={<DashboardWrapper><RbacManagement /></DashboardWrapper>} />
        <Route path="/enterprise/workflows" element={<DashboardWrapper><ApprovalWorkflows /></DashboardWrapper>} />
        <Route path="/enterprise/legal" element={<DashboardWrapper><LegalManagement /></DashboardWrapper>} />
        <Route path="/enterprise/customer360" element={<DashboardWrapper><Customer360 /></DashboardWrapper>} />
        <Route path="/enterprise/tasks" element={<DashboardWrapper><TaskBoard /></DashboardWrapper>} />
        <Route path="/enterprise/messages" element={<DashboardWrapper><MessageHub /></DashboardWrapper>} />
        <Route path="/enterprise/audit" element={<DashboardWrapper><AuditDashboard /></DashboardWrapper>} />
        <Route path="/enterprise/accounting/chart" element={<DashboardWrapper><ChartOfAccounts /></DashboardWrapper>} />
        <Route path="/enterprise/accounting/entries" element={<DashboardWrapper><JournalEntries /></DashboardWrapper>} />
        <Route path="/enterprise/accounting/reports" element={<DashboardWrapper><FinancialReports /></DashboardWrapper>} />
        <Route path="/enterprise/accounting/budgets" element={<DashboardWrapper><BudgetManagement /></DashboardWrapper>} />
        <Route path="/enterprise/procurement/requests" element={<DashboardWrapper><PurchaseRequests /></DashboardWrapper>} />
        <Route path="/enterprise/procurement/rfqs" element={<DashboardWrapper><RFQs /></DashboardWrapper>} />
        <Route path="/enterprise/procurement/orders" element={<DashboardWrapper><PurchaseOrders /></DashboardWrapper>} />
        <Route path="/enterprise/procurement/receipts" element={<DashboardWrapper><GoodsReceipts /></DashboardWrapper>} />
        <Route path="/enterprise/procurement/invoices" element={<DashboardWrapper><VendorInvoices /></DashboardWrapper>} />
        <Route path="/enterprise/commission/rules" element={<DashboardWrapper><CommissionRules /></DashboardWrapper>} />
        <Route path="/enterprise/commission/ledger" element={<DashboardWrapper><CommissionCalculations /></DashboardWrapper>} />
        <Route path="/enterprise/commission/payouts" element={<DashboardWrapper><CommissionPayouts /></DashboardWrapper>} />
        <Route path="/enterprise/ai" element={<DashboardWrapper><AiDashboard /></DashboardWrapper>} />
        <Route path="/enterprise/dashboard" element={<DashboardWrapper><ExecutiveDashboards /></DashboardWrapper>} />
        <Route path="/enterprise/tenant" element={<DashboardWrapper><TenantManagement /></DashboardWrapper>} />
        <Route path="/enterprise/globalization" element={<DashboardWrapper><GlobalizationSettings /></DashboardWrapper>} />
        <Route path="/enterprise/construction" element={<DashboardWrapper><ConstructionProgress /></DashboardWrapper>} />
        <Route path="/enterprise/quality" element={<DashboardWrapper><QualityManagement /></DashboardWrapper>} />



        {/* 🔄 Fallback Catch-All */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {/* 🎬 Demo Mode — live auto-walkthrough driver (persists across routes) */}
      <DemoTour />
    </Router>
  );
};

export default App;
