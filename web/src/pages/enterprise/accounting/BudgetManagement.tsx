import React, { useState, useEffect } from 'react';
import api from '../../../services/api';
import {
  Award, Plus, Search, Calendar, RefreshCw, AlertTriangle
} from 'lucide-react';

interface Account {
  id: string; code: string; name: string; type: string;
}

interface Budget {
  id: string; company_id: string; account_id: string; fiscal_year: number; period: number;
  amount: string; spent_amount: string; status: string;
  account?: Account;
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
      <div className="glass-panel" style={{ width: '95%', maxWidth: 500, maxHeight: '85vh', overflowY: 'auto', padding: 32, borderRadius: 'var(--radius-lg)' }} onClick={e => e.stopPropagation()}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: 20, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Award size={18} color="var(--color-primary)" />
          {title}
        </h2>
        {children}
      </div>
    </div>
  );
};

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div style={{ marginBottom: 14 }}>
    <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase' }}>{label}</label>
    {children}
  </div>
);

const BudgetManagement: React.FC = () => {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  // Modal forms
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({
    account_id: '',
    fiscal_year: new Date().getFullYear(),
    period: new Date().getMonth() + 1,
    amount: ''
  });

  useEffect(() => {
    loadAccounts();
    loadBudgets();
  }, []);

  const loadAccounts = async () => {
    try {
      const res = await api.get('/v1/enterprise/accounting/accounts');
      // Filter only expense accounts for budget allocation
      const list = res.data?.data || [];
      setAccounts(list.filter((a: any) => a.type === 'expense'));
    } catch (err) {
      console.error('Error loading accounts:', err);
    }
  };

  const loadBudgets = async () => {
    setLoading(true);
    try {
      const res = await api.get('/v1/enterprise/accounting/budgets');
      setBudgets(res.data?.data || []);
    } catch (err) {
      console.error('Error loading budgets:', err);
    }
    setLoading(false);
  };

  const handleSaveBudget = async () => {
    try {
      await api.post('/v1/enterprise/accounting/budgets', form);
      setModalOpen(false);
      setForm({
        account_id: '',
        fiscal_year: new Date().getFullYear(),
        period: new Date().getMonth() + 1,
        amount: ''
      });
      loadBudgets();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Error allocating budget code');
    }
  };

  const getMonthName = (periodNum: number) => {
    const date = new Date(2000, periodNum - 1, 1);
    return date.toLocaleString('default', { month: 'long' });
  };

  const getProgressBarColor = (percentage: number) => {
    if (percentage > 100) return '#ef4444'; // Overdraft
    if (percentage > 80) return '#f59e0b'; // Approaching limit
    return '#10b981'; // Healthy
  };

  const cellStyle: React.CSSProperties = { padding: '12px 16px', fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-main)', borderBottom: '1px solid var(--border-glass)' };
  const headerStyle: React.CSSProperties = { ...cellStyle, fontWeight: 800, fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.06em', background: 'rgba(255,255,255,0.4)' };

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 10 }}>
            <Award size={24} color="var(--color-primary)" />
            🛡️ Expense Budget Allocations
          </h1>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>
            Set monthly department spending limits and track real-time ledger variance overruns
          </p>
        </div>
        <button className="btn-primary" onClick={() => setModalOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem' }}>
          <Plus size={14} /> Allocate Budget
        </button>
      </div>

      {/* Toolbar */}
      <div className="glass-panel" style={{ padding: 16, borderRadius: 'var(--radius-lg)', marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: '40%' }}>
          <Search size={16} color="var(--text-muted)" />
          <input
            style={{ ...inputStyle, padding: '6px 10px', border: 'none', background: 'transparent' }}
            placeholder="Search budgets by account name or code..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <button className="btn-secondary" onClick={loadBudgets} style={{ fontSize: '0.75rem', padding: '6px 12px' }}>
          <RefreshCw size={12} style={{ marginRight: 4 }} /> Refresh
        </button>
      </div>

      {/* Budget Grid Cards */}
      {loading ? (
        <div className="glass-panel" style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', borderRadius: 'var(--radius-lg)' }}>Loading corporate budgets...</div>
      ) : budgets.length === 0 ? (
        <div className="glass-panel" style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', borderRadius: 'var(--radius-lg)' }}>No budgets allocated. Click "Allocate Budget" to configure expense ceilings.</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(330px, 1fr))', gap: 16 }}>
          {budgets.filter(b => !search || b.account?.name.toLowerCase().includes(search.toLowerCase()) || b.account?.code.includes(search)).map(b => {
            const limit = parseFloat(b.amount);
            const spent = parseFloat(b.spent_amount);
            const percentage = limit > 0 ? (spent / limit) * 100 : 0;
            const progressColor = getProgressBarColor(percentage);

            return (
              <div key={b.id} className="glass-panel" style={{ padding: 18, borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'monospace', fontWeight: 800 }}>GL {b.account?.code}</span>
                    <h3 style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-main)', margin: '2px 0 0 0' }}>{b.account?.name}</h3>
                  </div>
                  <span style={{ fontSize: '0.65rem', fontWeight: 850, padding: '3px 8px', borderRadius: 4, background: 'rgba(0,0,0,0.05)', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    {getMonthName(b.period)} '{String(b.fiscal_year).substring(2)}
                  </span>
                </div>

                {/* Progress bar */}
                <div style={{ marginTop: 6 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 4 }}>
                    <span>Spent: <strong>{spent.toLocaleString()} EGP</strong></span>
                    <span>Limit: <strong>{limit.toLocaleString()} EGP</strong></span>
                  </div>
                  
                  {/* Outer track */}
                  <div style={{ width: '100%', height: 8, background: 'rgba(0,0,0,0.06)', borderRadius: 99, overflow: 'hidden' }}>
                    {/* Inner fill */}
                    <div style={{ width: `${Math.min(100, percentage)}%`, height: '100%', background: progressColor, borderRadius: 99, transition: 'width 0.3s ease' }} />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4, fontSize: '0.68rem', fontWeight: 700 }}>
                  <span style={{ color: progressColor }}>
                    {percentage.toFixed(0)}% Utilized
                  </span>
                  
                  {percentage > 100 && (
                    <span style={{ color: '#ef4444', display: 'flex', alignItems: 'center', gap: 2 }}>
                      <AlertTriangle size={12} /> Budget Overrun
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      <Modal open={modalOpen} title="Allocate Account Period Budget Limit" onClose={() => setModalOpen(false)}>
        <Field label="GL Expense Account">
          <select style={inputStyle} value={form.account_id} onChange={e => setForm(p => ({ ...p, account_id: e.target.value }))}>
            <option value="">-- Select Expense Code --</option>
            {accounts.map(a => <option key={a.id} value={a.id}>{a.code} - {a.name}</option>)}
          </select>
        </Field>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Field label="Fiscal Year">
            <select style={inputStyle} value={form.fiscal_year} onChange={e => setForm(p => ({ ...p, fiscal_year: parseInt(e.target.value) }))}>
              <option value={new Date().getFullYear()}>{new Date().getFullYear()}</option>
              <option value={new Date().getFullYear() + 1}>{new Date().getFullYear() + 1}</option>
            </select>
          </Field>

          <Field label="Fiscal Period (Month)">
            <select style={inputStyle} value={form.period} onChange={e => setForm(p => ({ ...p, period: parseInt(e.target.value) }))}>
              {Array.from({ length: 12 }).map((_, i) => (
                <option key={i + 1} value={i + 1}>{getMonthName(i + 1)} ({i + 1})</option>
              ))}
            </select>
          </Field>
        </div>

        <Field label="Allocated Limit Amount (EGP)">
          <input type="number" style={inputStyle} value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} placeholder="e.g. 50000" />
        </Field>

        <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
          <button className="btn-primary" disabled={!form.account_id || !form.amount} onClick={handleSaveBudget} style={{ flex: 1 }}>Allocate Budget</button>
          <button className="btn-secondary" onClick={() => setModalOpen(false)} style={{ flex: 1 }}>Cancel</button>
        </div>
      </Modal>
    </div>
  );
};

export default BudgetManagement;
