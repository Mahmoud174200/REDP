import React, { useState, useEffect } from 'react';
import api from '../../../services/api';
import {
  FolderTree, Plus, Search, ShieldAlert, Award, Grid, List, Check, X, Building
} from 'lucide-react';

interface Account {
  id: string; company_id: string | null; code: string; name: string;
  type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
  parent_id: string | null; is_reconciled: boolean; status: string;
}

interface Center {
  id: string; company_id: string; code: string; name: string; parent_id: string | null; status: string;
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-md)',
  border: '1px solid var(--border-glass)', background: 'rgba(255,255,255,0.6)',
  fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-main)', outline: 'none',
  boxSizing: 'border-box',
};

const Modal: React.FC<{ open: boolean; title: string; onClose: () => void; children: React.ReactNode }> = ({ open, title, onClose, children }) => {
  if (!open) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(4px)' }} onClick={onClose}>
      <div className="glass-panel" style={{ width: '95%', maxWidth: 550, maxHeight: '85vh', overflowY: 'auto', padding: 32, borderRadius: 'var(--radius-lg)' }} onClick={e => e.stopPropagation()}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: 20, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <FolderTree size={18} color="var(--color-primary)" />
          {title}
        </h2>
        {children}
      </div>
    </div>
  );
};

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div style={{ marginBottom: 14 }}>
    <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</label>
    {children}
  </div>
);

const ChartOfAccounts: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'coa' | 'cost' | 'profit'>('coa');
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [costCenters, setCostCenters] = useState<Center[]>([]);
  const [profitCenters, setProfitCenters] = useState<Center[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  // Modals
  const [accModalOpen, setAccModalOpen] = useState(false);
  const [accForm, setAccForm] = useState<any>({ code: '', name: '', type: 'asset', parent_id: '' });

  const [centerModalOpen, setCenterModalOpen] = useState(false);
  const [centerForm, setCenterForm] = useState<any>({ code: '', name: '', parent_id: '' });

  useEffect(() => {
    loadAll();
  }, [activeTab]);

  const loadAll = async () => {
    setLoading(true);
    try {
      if (activeTab === 'coa') {
        const res = await api.get('/v1/enterprise/accounting/accounts');
        setAccounts(res.data?.data || []);
      } else if (activeTab === 'cost') {
        const res = await api.get('/v1/enterprise/accounting/cost-centers');
        setCostCenters(res.data?.data || []);
      } else if (activeTab === 'profit') {
        const res = await api.get('/v1/enterprise/accounting/profit-centers');
        setProfitCenters(res.data?.data || []);
      }
    } catch (err) {
      console.error('Error loading account codes:', err);
    }
    setLoading(false);
  };

  const handleSaveAccount = async () => {
    try {
      await api.post('/v1/enterprise/accounting/accounts', accForm);
      setAccModalOpen(false);
      setAccForm({ code: '', name: '', type: 'asset', parent_id: '' });
      loadAll();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Error creating account');
    }
  };

  const handleSaveCenter = async () => {
    try {
      const endpoint = activeTab === 'cost' 
        ? '/v1/enterprise/accounting/cost-centers' 
        : '/v1/enterprise/accounting/profit-centers';
      
      await api.post(endpoint, centerForm);
      setCenterModalOpen(false);
      setCenterForm({ code: '', name: '', parent_id: '' });
      loadAll();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Error creating allocation center');
    }
  };

  const getAccountTypeBadge = (type: string) => {
    switch (type) {
      case 'asset': return { bg: 'rgba(59,130,246,0.1)', color: '#3b82f6' };
      case 'liability': return { bg: 'rgba(139,92,246,0.1)', color: '#8b5cf6' };
      case 'equity': return { bg: 'rgba(245,158,11,0.1)', color: '#f59e0b' };
      case 'revenue': return { bg: 'rgba(16,185,129,0.1)', color: '#10b981' };
      default: return { bg: 'rgba(239,68,68,0.1)', color: '#ef4444' }; // expense
    }
  };

  const cellStyle: React.CSSProperties = { padding: '12px 16px', fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-main)', borderBottom: '1px solid var(--border-glass)' };
  const headerStyle: React.CSSProperties = { ...cellStyle, fontWeight: 800, fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.06em', background: 'rgba(255,255,255,0.4)' };

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 10 }}>
          <FolderTree size={24} color="var(--color-primary)" />
          📖 Corporate Chart of Accounts (COA)
        </h1>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>
          Configure GL account structures, cost allocations, and profit centers mapping double-entry ledgers
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        <button
          onClick={() => setActiveTab('coa')}
          className={activeTab === 'coa' ? 'btn-primary' : 'btn-secondary'}
          style={{ fontSize: '0.75rem', padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <List size={14} /> General Ledger Codes
        </button>
        <button
          onClick={() => setActiveTab('cost')}
          className={activeTab === 'cost' ? 'btn-primary' : 'btn-secondary'}
          style={{ fontSize: '0.75rem', padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <Grid size={14} /> Cost Centers
        </button>
        <button
          onClick={() => setActiveTab('profit')}
          className={activeTab === 'profit' ? 'btn-primary' : 'btn-secondary'}
          style={{ fontSize: '0.75rem', padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <Building size={14} /> Profit Centers
        </button>
      </div>

      {/* Toolbar */}
      <div className="glass-panel" style={{ padding: 16, borderRadius: 'var(--radius-lg)', marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: '40%' }}>
          <Search size={16} color="var(--text-muted)" />
          <input
            style={{ ...inputStyle, padding: '6px 10px', border: 'none', background: 'transparent' }}
            placeholder={`Search ${activeTab === 'coa' ? 'accounts' : 'centers'} by name or code...`}
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {activeTab === 'coa' ? (
          <button className="btn-primary" onClick={() => { setAccForm({ code: '', name: '', type: 'asset', parent_id: '' }); setAccModalOpen(true); }} style={{ fontSize: '0.75rem', padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Plus size={14} /> Create Account
          </button>
        ) : (
          <button className="btn-primary" onClick={() => { setCenterForm({ code: '', name: '', parent_id: '' }); setCenterModalOpen(true); }} style={{ fontSize: '0.75rem', padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Plus size={14} /> Create {activeTab === 'cost' ? 'Cost' : 'Profit'} Center
          </button>
        )}
      </div>

      {/* Grid Content */}
      <div className="glass-panel" style={{ padding: 0, borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Loading records...</div>
        ) : activeTab === 'coa' ? (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr>
                <th style={headerStyle}>Account Code</th>
                <th style={headerStyle}>Account Name</th>
                <th style={headerStyle}>Type Class</th>
                <th style={headerStyle}>Parent Code</th>
                <th style={headerStyle}>Reconciled</th>
                <th style={headerStyle}>Status</th>
              </tr>
            </thead>
            <tbody>
              {accounts.filter(a => !search || a.name.toLowerCase().includes(search.toLowerCase()) || a.code.includes(search)).map(acc => {
                const badge = getAccountTypeBadge(acc.type);
                const parentAcc = accounts.find(p => p.id === acc.parent_id);
                return (
                  <tr key={acc.id}>
                    <td style={{ ...cellStyle, fontFamily: 'monospace', fontWeight: 800 }}>{acc.code}</td>
                    <td style={cellStyle}><strong>{acc.name}</strong></td>
                    <td style={cellStyle}>
                      <span style={{ padding: '3px 10px', borderRadius: 999, fontSize: '0.65rem', fontWeight: 800, background: badge.bg, color: badge.color, textTransform: 'uppercase' }}>
                        {acc.type}
                      </span>
                    </td>
                    <td style={cellStyle}>{parentAcc ? <code>{parentAcc.code} - {parentAcc.name}</code> : <span style={{ color: 'var(--text-muted)' }}>Root</span>}</td>
                    <td style={cellStyle}>
                      {acc.is_reconciled ? <Check size={16} color="#10b981" /> : <X size={16} color="var(--text-muted)" />}
                    </td>
                    <td style={cellStyle}>
                      <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '2px 8px', borderRadius: 4, background: acc.status === 'active' ? 'rgba(16,185,129,0.08)' : 'rgba(0,0,0,0.05)', color: acc.status === 'active' ? '#10b981' : 'var(--text-muted)' }}>
                        {acc.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr>
                <th style={headerStyle}>Center Code</th>
                <th style={headerStyle}>Center Name</th>
                <th style={headerStyle}>Parent Center</th>
                <th style={headerStyle}>Status</th>
              </tr>
            </thead>
            <tbody>
              {(activeTab === 'cost' ? costCenters : profitCenters)
                .filter(c => !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.code.toLowerCase().includes(search.toLowerCase()))
                .map(center => {
                  const parentCenter = (activeTab === 'cost' ? costCenters : profitCenters).find(p => p.id === center.parent_id);
                  return (
                    <tr key={center.id}>
                      <td style={{ ...cellStyle, fontFamily: 'monospace', fontWeight: 800 }}>{center.code}</td>
                      <td style={cellStyle}><strong>{center.name}</strong></td>
                      <td style={cellStyle}>{parentCenter ? <code>{parentCenter.code} - {parentCenter.name}</code> : <span style={{ color: 'var(--text-muted)' }}>Root</span>}</td>
                      <td style={cellStyle}>
                        <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '2px 8px', borderRadius: 4, background: center.status === 'active' ? 'rgba(16,185,129,0.08)' : 'rgba(0,0,0,0.05)', color: center.status === 'active' ? '#10b981' : 'var(--text-muted)' }}>
                          {center.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        )}
      </div>

      {/* Account Modal */}
      <Modal open={accModalOpen} title="Create General Ledger Account" onClose={() => setAccModalOpen(false)}>
        <Field label="Account Type / Class">
          <select style={inputStyle} value={accForm.type} onChange={e => setAccForm(p => ({ ...p, type: e.target.value }))}>
            <option value="asset">Asset (1xxxxx)</option>
            <option value="liability">Liability (2xxxxx)</option>
            <option value="equity">Equity (3xxxxx)</option>
            <option value="revenue">Revenue (4xxxxx)</option>
            <option value="expense">Expense (5xxxxx)</option>
          </select>
        </Field>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 12 }}>
          <Field label="Account Code (Numerical)"><input style={inputStyle} value={accForm.code} onChange={e => setAccForm(p => ({ ...p, code: e.target.value }))} placeholder="e.g. 11100" /></Field>
          <Field label="Account Name"><input style={inputStyle} value={accForm.name} onChange={e => setAccForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. CIB Bank Account" /></Field>
        </div>

        <Field label="Parent Account Code (Optional)">
          <select style={inputStyle} value={accForm.parent_id} onChange={e => setAccForm(p => ({ ...p, parent_id: e.target.value || null }))}>
            <option value="">-- No Parent (Root Account) --</option>
            {accounts.filter(a => a.type === accForm.type).map(a => <option key={a.id} value={a.id}>{a.code} - {a.name}</option>)}
          </select>
        </Field>

        <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
          <button className="btn-primary" onClick={handleSaveAccount} style={{ flex: 1 }}>Save Account</button>
          <button className="btn-secondary" onClick={() => setAccModalOpen(false)} style={{ flex: 1 }}>Cancel</button>
        </div>
      </Modal>

      {/* Center Modal */}
      <Modal open={centerModalOpen} title={`Create New ${activeTab === 'cost' ? 'Cost' : 'Profit'} Center`} onClose={() => setCenterModalOpen(false)}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 12 }}>
          <Field label="Center Code"><input style={inputStyle} value={centerForm.code} onChange={e => setCenterForm(p => ({ ...p, code: e.target.value }))} placeholder="e.g. CC-MARKETING" /></Field>
          <Field label="Center Name"><input style={inputStyle} value={centerForm.name} onChange={e => setCenterForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Marketing Division" /></Field>
        </div>

        <Field label="Parent Center (Optional)">
          <select style={inputStyle} value={centerForm.parent_id} onChange={e => setCenterForm(p => ({ ...p, parent_id: e.target.value || null }))}>
            <option value="">-- No Parent (Root Center) --</option>
            {(activeTab === 'cost' ? costCenters : profitCenters).map(c => <option key={c.id} value={c.id}>{c.code} - {c.name}</option>)}
          </select>
        </Field>

        <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
          <button className="btn-primary" onClick={handleSaveCenter} style={{ flex: 1 }}>Save Center</button>
          <button className="btn-secondary" onClick={() => setCenterModalOpen(false)} style={{ flex: 1 }}>Cancel</button>
        </div>
      </Modal>
    </div>
  );
};

export default ChartOfAccounts;
