import React from 'react';
import Sidebar from './Sidebar';
import TopBar from './TopBar';

interface DashboardLayoutProps {
  children: React.ReactNode;
  userRole: string;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children, userRole }) => {
  return (
    <div className="dashboard-container">
      {/* 🧭 Modular Sidebar */}
      <Sidebar userRole={userRole} />

      {/* 🖥️ Main Dashboard Content Console */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
        <TopBar userRole={userRole} />
        <main className="main-content">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
