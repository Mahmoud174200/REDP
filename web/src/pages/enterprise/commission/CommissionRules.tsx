import React, { useState, useEffect } from 'react';
import api from '../../../services/api';
import {
  Award, Plus, Search, Calendar, RefreshCw, Layers
} from 'lucide-react';

interface Project {
  id: string;
  name: string;
}

interface Rule {
  id: string;
  title: string;
  project_id: string | null;
  unit_type: string | null;
  tier_type: string;
  min_deal_size: string;
  max_deal_size: string;
  commission_percentage: string;
  status: string;
  project?: Project;
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
          <Layers size={18} color="var(--color-primary)" />
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

const CommissionRules: React.FC = () => {
  const [rules, setRules] = useState<Rule[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  // Modals
  const [modalOpen, setModalOpen] = useState(false);

  // Form State
  const [form, setForm] = useState({
    title: '',
    project_id: '',
    unit_type: '',
    tier_type: 'sales_agent',
    min_deal_size: '',
    max_deal_size: '',
    commission_percentage: ''
  });

  useEffect(() => {
    loadRules();
    loadProjects();
  }, []);

  const loadRules = async () => {
    setLoading(true);
    try {
      const res = await api.get('/v1/enterprise/commissions/rules');
      setRules(res.data?.data || []);
    } catch (err) {
      console.error('Error loading rules:', err);
    }
    setLoading(false);
  };

  const loadProjects = async () => {
    try {
      const res = await api.get('/v1/sales/company/projects');
      setProjects(res.data?.data || []);
    } catch (err) {
      console.error('Error loading projects:', err);
    }
  };

  const handleSaveRule = async () => {
    try {
      await api.post('/v1/enterprise/commissions/rules', {
        ...form,
        min_deal_size: form.min_deal_size ? parseFloat(form.min_deal_size) : null,
        max_deal_size: form.max_deal_size ? parseFloat(form.max_deal_size) : null,
        commission_percentage: parseFloat(form.commission_percentage)
      });
      setModalOpen(false);
      setForm({
        title: '',
        project_id: '',
        unit_type: '',
        tier_type: 'sales_agent',
        min_deal_size: '',
        max_deal_size: '',
        commission_percentage: ''
      });
      loadRules();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Error saving rule');
    }
  };

  const getTierBadge = (tier: string) => {
    const styles: Record<string, React.CSSProperties> = {
      broker: { background: 'rgba(59,130,246,0.1)', color: '#3b82f6' },
      sales_agent: { background: 'rgba(16,185,129,0.1)', color: '#10b981' },
      manager: { background: 'rgba(139,92,246,0.1)', color: '#8b5cf6' },
      director: { background: 'rgba(236,72,153,0.1)', color: '#ec4899' }
    };
    return (
      <span style={{ fontSize: '0.68rem', fontWeight: 800, padding: '3px 8px', borderRadius: 6, ...styles[tier] }}>
        {tier.replace('_', ' ').toUpperCase()}
      </span>
    );
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
            ⚙️ Commission Rules Configurator
          </h1>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>
            Configure dynamic multi-tier commission percentages, limits, and team overrides.
          </p>
        </div>
        <button className="btn-primary" onClick={() => setModalOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem' }}>
          <Plus size={14} /> New Commission Rule
        </button>
      </div>

      {/* Toolbar */}
      <div className="glass-panel" style={{ padding: 16, borderRadius: 'var(--radius-lg)', marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: '40%' }}>
          <Search size={16} color="var(--text-muted)" />
          <input
            style={{ ...inputStyle, padding: '6px 10px', border: 'none', background: 'transparent' }}
            placeholder="Search rules by title..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <button className="btn-secondary" onClick={loadRules} style={{ fontSize: '0.75rem', padding: '6px 12px' }}>
          <RefreshCw size={12} style={{ marginRight: 4 }} /> Refresh
        </button>
      </div>

      {/* Rules Grid */}
      {loading ? (
        <div className="glass-panel" style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', borderRadius: 'var(--radius-lg)' }}>Loading rules...</div>
      ) : rules.length === 0 ? (
        <div className="glass-panel" style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', borderRadius: 'var(--radius-lg)' }}>No commission rules configured.</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
          {rules.filter(r => !search || r.title.toLowerCase().includes(search.toLowerCase())).map(r => (
            <div key={r.id} className="glass-panel" style={{ padding: 20, borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h3 style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--text-main)' }}>{r.title}</h3>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Project: {r.project?.name || 'All Projects'}</span>
                </div>
                {getTierBadge(r.tier_type)}
              </div>

              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: 4, borderTop: '1px solid rgba(0,0,0,0.05)', paddingTop: 10 }}>
                <div>🏢 Unit Type Scope: <strong>{r.unit_type || 'All types'}</strong></div>
                <div>💰 Deal Limits: <strong>{parseFloat(r.min_deal_size).toLocaleString()} - {parseFloat(r.max_deal_size).toLocaleString()} EGP</strong></div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, background: 'rgba(44, 62, 50, 0.04)', padding: '8px 12px', borderRadius: 'var(--radius-sm)' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)' }}>Commission Payout:</span>
                <span style={{ fontSize: '1rem', fontWeight: 900, color: 'var(--color-primary)' }}>{parseFloat(r.commission_percentage)}%</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      <Modal open={modalOpen} title="Define New Commission Formula Rule" onClose={() => setModalOpen(false)}>
        <Field label="Rule Name / Title">
          <input type="text" style={inputStyle} value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="e.g. Q2 Broker Promo 2.5%" />
        </Field>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Field label="Project Scope">
            <select style={inputStyle} value={form.project_id} onChange={e => setForm(p => ({ ...p, project_id: e.target.value }))}>
              <option value="">-- All Projects --</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </Field>
          <Field label="Unit Type Scope">
            <select style={inputStyle} value={form.unit_type} onChange={e => setForm(p => ({ ...p, unit_type: e.target.value }))}>
              <option value="">-- All Types --</option>
              <option value="apartment">Apartment</option>
              <option value="villa">Villa</option>
              <option value="commercial">Commercial</option>
            </select>
          </Field>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Field label="Recipient Level Tier">
            <select style={inputStyle} value={form.tier_type} onChange={e => setForm(p => ({ ...p, tier_type: e.target.value }))}>
              <option value="broker">External Broker</option>
              <option value="sales_agent">Sales Rep Agent</option>
              <option value="manager">Manager Override</option>
              <option value="director">Director Override</option>
            </select>
          </Field>
          <Field label="Commission Percentage (%)">
            <input type="number" style={inputStyle} value={form.commission_percentage} onChange={e => setForm(p => ({ ...p, commission_percentage: e.target.value }))} placeholder="e.g. 2.5" />
          </Field>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Field label="Min Deal Size (EGP)">
            <input type="number" style={inputStyle} value={form.min_deal_size} onChange={e => setForm(p => ({ ...p, min_deal_size: e.target.value }))} placeholder="e.g. 1000000" />
          </Field>
          <Field label="Max Deal Size (EGP)">
            <input type="number" style={inputStyle} value={form.max_deal_size} onChange={e => setForm(p => ({ ...p, max_deal_size: e.target.value }))} placeholder="e.g. 50000000" />
          </Field>
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
          <button className="btn-primary" disabled={!form.title || !form.commission_percentage} onClick={handleSaveRule} style={{ flex: 1 }}>Save Commission Rule</button>
          <button className="btn-secondary" onClick={() => setModalOpen(false)} style={{ flex: 1 }}>Cancel</button>
        </div>
      </Modal>
    </div>
  );
};

export default CommissionRules;
