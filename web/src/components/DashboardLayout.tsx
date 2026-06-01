import React, { useState } from 'react';
import Sidebar from './Sidebar';
import TopBar from './TopBar';

interface DashboardLayoutProps {
  children: React.ReactNode;
  userRole: string;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children, userRole }) => {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="dashboard-container">
      {/* 🧭 Vertically Floating Sidebar Capsule (Stateful mobile drawer) */}
      <Sidebar 
        userRole={userRole} 
        menuOpen={menuOpen} 
        onClose={() => setMenuOpen(false)} 
      />

      {/* 🖤 Backdrop Overlay Mask - Visible on mobile when drawer is active */}
      {menuOpen && (
        <div 
          onClick={() => setMenuOpen(false)} 
          style={{ 
            position: 'fixed', 
            top: 0, 
            left: 0, 
            right: 0, 
            bottom: 0, 
            background: 'rgba(29, 45, 36, 0.25)', /* Soft forest overlay tint */
            backdropFilter: 'blur(4px)', 
            webkitBackdropFilter: 'blur(4px)',
            zIndex: 90 
          }} 
        />
      )}

      {/* 🖥️ Main Content Container Panel */}
      <div 
        style={{ 
          flex: 1, 
          display: 'flex', 
          flexDirection: 'column', 
          height: 'calc(100vh - 32px)', 
          gap: '16px', 
          overflowY: 'auto',
          paddingRight: '4px'
        }}
      >
        {/* 🏷️ Horizontally Floating Header Capsule with Hamburger trigger */}
        <TopBar 
          userRole={userRole} 
          onMenuToggle={() => setMenuOpen(true)} 
        />
        
        {/* 📄 Scrollable Main Content Board */}
        <main className="main-content" style={{ flex: 1, padding: 0 }}>
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
