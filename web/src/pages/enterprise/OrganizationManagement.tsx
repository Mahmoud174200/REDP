import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import {
  Building2, Globe, MapPin, GitBranch, Users, Briefcase,
  Plus, Edit3, Trash2, ChevronDown, ChevronRight, Search,
  ArrowRight, Shield, Network, Percent
} from 'lucide-react';

// ── Types ──
interface Company {
  id: string; name: string; legal_name: string; type: string;
  parent_company_id: string | null; status: string; email: string;
  phone: string; city: string; country?: any; parent_company?: any;
  children?: Company[];
}
interface Country { id: string; name: string; code: string; phone_code: string; currency_code: string; timezone: string; flag_emoji: string; status: string; }
interface Region { id: string; name: string; code: string; company_id: string; description: string; status: string; company?: any; }
interface Branch { id: string; name: string; code: string; company_id: string; country_id: string; region_id: string; address: string; city: string; phone: string; email: string; manager_id: string; status: string; company?: any; country?: any; region?: any; manager?: any; }
interface Dept { id: string; name: string; code: string; company_id: string; branch_id: string; parent_department_id: string | null; head_id: string; status: string; head?: any; branch?: any; }
interface Team { id: string; name: string; department_id: string; company_id: string; leader_id: string; status: string; department?: any; leader?: any; }
interface Position { id: string; title: string; code: string; company_id: string; department_id: string; level: number; min_salary: number; max_salary: number; status: string; }
interface Hierarchy { id: string; user_id: string; company_id: string; branch_id: string; department_id: string; team_id: string; position_id: string; direct_manager_id: string; employee_number: string; status: string; user?: any; position?: any; department?: any; direct_manager?: any; }
interface Delegation { id: string; delegator_id: string; delegate_id: string; type: string; reason: string; start_date: string; end_date: string; status: string; delegator?: any; delegate?: any; }

type Tab = 'companies' | 'countries' | 'regions' | 'branches' | 'departments' | 'teams' | 'positions' | 'hierarchy' | 'delegations' | 'commissions';

const tabs: { key: Tab; label: string; icon: any }[] = [
  { key: 'companies', label: 'Companies', icon: Building2 },
  { key: 'countries', label: 'Countries', icon: Globe },
  { key: 'regions', label: 'Regions', icon: MapPin },
  { key: 'branches', label: 'Branches', icon: GitBranch },
  { key: 'departments', label: 'Departments', icon: Network },
  { key: 'teams', label: 'Teams', icon: Users },
  { key: 'positions', label: 'Positions', icon: Briefcase },
  { key: 'hierarchy', label: 'Hierarchy', icon: ArrowRight },
  { key: 'delegations', label: 'Delegations', icon: Shield },
  { key: 'commissions', label: 'Commissions', icon: Percent },
];

// ── Generic Modal ──
const Modal: React.FC<{ open: boolean; title: string; onClose: () => void; children: React.ReactNode }> = ({ open, title, onClose, children }) => {
  if (!open) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(4px)' }} onClick={onClose}>
      <div className="glass-panel" style={{ width: '95%', maxWidth: 600, maxHeight: '85vh', overflowY: 'auto', padding: 32, borderRadius: 'var(--radius-lg)' }} onClick={e => e.stopPropagation()}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: 20, color: 'var(--text-main)' }}>{title}</h2>
        {children}
      </div>
    </div>
  );
};

// ── Shared Form Field ──
const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div style={{ marginBottom: 14 }}>
    <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</label>
    {children}
  </div>
);

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-md)',
  border: '1px solid var(--border-glass)', background: 'rgba(255,255,255,0.6)',
  fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-main)', outline: 'none',
  boxSizing: 'border-box',
};

const OrganizationManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('companies');
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  // Data states
  const [companies, setCompanies] = useState<Company[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [departments, setDepartments] = useState<Dept[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [hierarchy, setHierarchy] = useState<Hierarchy[]>([]);
  const [delegations, setDelegations] = useState<Delegation[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [commissions, setCommissions] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);

  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [formData, setFormData] = useState<any>({});

  // Stats
  const stats = [
    { label: 'Companies', value: companies.length, icon: Building2, color: '#3b82f6' },
    { label: 'Branches', value: branches.length, icon: GitBranch, color: '#10b981' },
    { label: 'Departments', value: departments.length, icon: Network, color: '#f59e0b' },
    { label: 'Employees', value: hierarchy.length, icon: Users, color: '#8b5cf6' },
    { label: 'Commission Rules', value: commissions.length, icon: Percent, color: '#10b981' },
  ];

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [comp, cntry, reg, br, dept, tm, pos, hier, del, usr, rules, projs] = await Promise.all([
        api.get('/v1/enterprise/companies'),
        api.get('/v1/enterprise/countries'),
        api.get('/v1/enterprise/regions'),
        api.get('/v1/enterprise/branches'),
        api.get('/v1/enterprise/departments'),
        api.get('/v1/enterprise/teams'),
        api.get('/v1/enterprise/positions'),
        api.get('/v1/enterprise/hierarchy'),
        api.get('/v1/enterprise/delegations'),
        api.get('/v1/admin/users'),
        api.get('/v1/enterprise/commissions/rules'),
        api.get('/v1/admin/projects'),
      ]);
      setCompanies(comp.data?.data || []);
      setCountries(cntry.data?.data || []);
      setRegions(reg.data?.data || []);
      setBranches(br.data?.data || []);
      setDepartments(dept.data?.data || []);
      setTeams(tm.data?.data || []);
      setPositions(pos.data?.data || []);
      setHierarchy(hier.data?.data || []);
      setDelegations(del.data?.data || []);
      setUsers(usr.data?.data || []);
      setCommissions(rules.data?.data || []);
      setProjects(projs.data?.data || []);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const openCreate = () => { setEditItem(null); setFormData({}); setModalOpen(true); };
  const openEdit = (item: any) => { setEditItem(item); setFormData({ ...item }); setModalOpen(true); };
  const closeModal = () => { setModalOpen(false); setEditItem(null); setFormData({}); };

  const handleSave = async () => {
    try {
      const endpoints: Record<Tab, string> = {
        companies: '/v1/enterprise/companies',
        countries: '/v1/enterprise/countries',
        regions: '/v1/enterprise/regions',
        branches: '/v1/enterprise/branches',
        departments: '/v1/enterprise/departments',
        teams: '/v1/enterprise/teams',
        positions: '/v1/enterprise/positions',
        hierarchy: '/v1/enterprise/hierarchy/assign',
        delegations: '/v1/enterprise/delegations',
        commissions: '/v1/enterprise/commissions/rules',
      };
      if (editItem?.id && activeTab !== 'hierarchy') {
        await api.put(`${endpoints[activeTab]}/${editItem.id}`, formData);
      } else {
        await api.post(endpoints[activeTab], formData);
      }
      closeModal();
      loadAll();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Error saving.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;
    const endpoints: Record<string, string> = {
      companies: '/v1/enterprise/companies',
      countries: '/v1/enterprise/countries',
      regions: '/v1/enterprise/regions',
      branches: '/v1/enterprise/branches',
      departments: '/v1/enterprise/departments',
      teams: '/v1/enterprise/teams',
      positions: '/v1/enterprise/positions',
      commissions: '/v1/enterprise/commissions/rules',
    };
    if (!endpoints[activeTab]) return;
    try {
      await api.delete(`${endpoints[activeTab]}/${id}`);
      loadAll();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Error deleting.');
    }
  };

  const set = (key: string, val: any) => setFormData((p: any) => ({ ...p, [key]: val }));

  // ── Render table based on active tab ──
  const renderTable = () => {
    const filterFn = (item: any) => {
      if (!search) return true;
      const s = search.toLowerCase();
      return JSON.stringify(item).toLowerCase().includes(s);
    };

    const cellStyle: React.CSSProperties = { padding: '12px 16px', fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-main)', borderBottom: '1px solid var(--border-glass)' };
    const headerStyle: React.CSSProperties = { ...cellStyle, fontWeight: 800, fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.06em', background: 'rgba(255,255,255,0.4)' };
    const badge = (text: string, color: string) => (
      <span style={{ padding: '3px 10px', borderRadius: 9999, fontSize: '0.68rem', fontWeight: 700, background: `${color}18`, color, textTransform: 'capitalize' }}>{text}</span>
    );

    const statusBadge = (s: string) => badge(s, s === 'active' ? '#10b981' : s === 'inactive' ? '#6b7280' : '#ef4444');

    switch (activeTab) {
      case 'companies':
        return (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr>
              <th style={headerStyle}>Name</th><th style={headerStyle}>Type</th><th style={headerStyle}>Country</th><th style={headerStyle}>Parent</th><th style={headerStyle}>Status</th><th style={headerStyle}>Actions</th>
            </tr></thead>
            <tbody>{companies.filter(filterFn).map(c => (
              <tr key={c.id} style={{ transition: 'background 0.2s' }} onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.3)')} onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                <td style={cellStyle}><strong>{c.name}</strong>{c.legal_name && <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{c.legal_name}</div>}</td>
                <td style={cellStyle}>{badge(c.type, c.type === 'holding' ? '#3b82f6' : '#8b5cf6')}</td>
                <td style={cellStyle}>{c.country?.name || '—'}</td>
                <td style={cellStyle}>{c.parent_company?.name || '—'}</td>
                <td style={cellStyle}>{statusBadge(c.status)}</td>
                <td style={cellStyle}>
                  <button className="btn-ghost" onClick={() => openEdit(c)} style={{ marginRight: 6 }}><Edit3 size={14} /></button>
                  <button className="btn-ghost" onClick={() => handleDelete(c.id)}><Trash2 size={14} /></button>
                </td>
              </tr>
            ))}</tbody>
          </table>
        );

      case 'countries':
        return (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr>
              <th style={headerStyle}>Flag</th><th style={headerStyle}>Name</th><th style={headerStyle}>Code</th><th style={headerStyle}>Phone Code</th><th style={headerStyle}>Currency</th><th style={headerStyle}>Timezone</th><th style={headerStyle}>Actions</th>
            </tr></thead>
            <tbody>{countries.filter(filterFn).map(c => (
              <tr key={c.id}>
                <td style={cellStyle}>{c.flag_emoji || '🌍'}</td>
                <td style={cellStyle}><strong>{c.name}</strong></td>
                <td style={cellStyle}>{c.code}</td>
                <td style={cellStyle}>+{c.phone_code}</td>
                <td style={cellStyle}>{c.currency_code}</td>
                <td style={cellStyle}>{c.timezone}</td>
                <td style={cellStyle}><button className="btn-ghost" onClick={() => openEdit(c)}><Edit3 size={14} /></button></td>
              </tr>
            ))}</tbody>
          </table>
        );

      case 'branches':
        return (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr>
              <th style={headerStyle}>Name</th><th style={headerStyle}>Code</th><th style={headerStyle}>Company</th><th style={headerStyle}>Country</th><th style={headerStyle}>City</th><th style={headerStyle}>Manager</th><th style={headerStyle}>Status</th><th style={headerStyle}>Actions</th>
            </tr></thead>
            <tbody>{branches.filter(filterFn).map(b => (
              <tr key={b.id}>
                <td style={cellStyle}><strong>{b.name}</strong></td>
                <td style={cellStyle}><code style={{ fontSize: '0.75rem', background: 'rgba(0,0,0,0.05)', padding: '2px 6px', borderRadius: 4 }}>{b.code}</code></td>
                <td style={cellStyle}>{b.company?.name || '—'}</td>
                <td style={cellStyle}>{b.country?.name || '—'}</td>
                <td style={cellStyle}>{b.city || '—'}</td>
                <td style={cellStyle}>{b.manager?.name || '—'}</td>
                <td style={cellStyle}>{statusBadge(b.status)}</td>
                <td style={cellStyle}>
                  <button className="btn-ghost" onClick={() => openEdit(b)} style={{ marginRight: 6 }}><Edit3 size={14} /></button>
                  <button className="btn-ghost" onClick={() => handleDelete(b.id)}><Trash2 size={14} /></button>
                </td>
              </tr>
            ))}</tbody>
          </table>
        );

      case 'departments':
        return (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr>
              <th style={headerStyle}>Name</th><th style={headerStyle}>Code</th><th style={headerStyle}>Branch</th><th style={headerStyle}>Head</th><th style={headerStyle}>Status</th><th style={headerStyle}>Actions</th>
            </tr></thead>
            <tbody>{departments.filter(filterFn).map(d => (
              <tr key={d.id}>
                <td style={cellStyle}><strong>{d.name}</strong></td>
                <td style={cellStyle}><code style={{ fontSize: '0.75rem', background: 'rgba(0,0,0,0.05)', padding: '2px 6px', borderRadius: 4 }}>{d.code}</code></td>
                <td style={cellStyle}>{d.branch?.name || '—'}</td>
                <td style={cellStyle}>{d.head?.name || '—'}</td>
                <td style={cellStyle}>{statusBadge(d.status)}</td>
                <td style={cellStyle}>
                  <button className="btn-ghost" onClick={() => openEdit(d)} style={{ marginRight: 6 }}><Edit3 size={14} /></button>
                  <button className="btn-ghost" onClick={() => handleDelete(d.id)}><Trash2 size={14} /></button>
                </td>
              </tr>
            ))}</tbody>
          </table>
        );

      case 'teams':
        return (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr>
              <th style={headerStyle}>Name</th><th style={headerStyle}>Department</th><th style={headerStyle}>Leader</th><th style={headerStyle}>Status</th><th style={headerStyle}>Actions</th>
            </tr></thead>
            <tbody>{teams.filter(filterFn).map(t => (
              <tr key={t.id}>
                <td style={cellStyle}><strong>{t.name}</strong></td>
                <td style={cellStyle}>{t.department?.name || '—'}</td>
                <td style={cellStyle}>{t.leader?.name || '—'}</td>
                <td style={cellStyle}>{statusBadge(t.status)}</td>
                <td style={cellStyle}>
                  <button className="btn-ghost" onClick={() => openEdit(t)} style={{ marginRight: 6 }}><Edit3 size={14} /></button>
                  <button className="btn-ghost" onClick={() => handleDelete(t.id)}><Trash2 size={14} /></button>
                </td>
              </tr>
            ))}</tbody>
          </table>
        );

      case 'positions':
        const levels: Record<number, string> = { 1: 'C-Suite', 2: 'VP', 3: 'Director', 4: 'Manager', 5: 'Senior', 6: 'Staff', 7: 'Junior', 8: 'Intern' };
        return (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr>
              <th style={headerStyle}>Title</th><th style={headerStyle}>Code</th><th style={headerStyle}>Level</th><th style={headerStyle}>Salary Range</th><th style={headerStyle}>Status</th><th style={headerStyle}>Actions</th>
            </tr></thead>
            <tbody>{positions.filter(filterFn).map(p => (
              <tr key={p.id}>
                <td style={cellStyle}><strong>{p.title}</strong></td>
                <td style={cellStyle}><code style={{ fontSize: '0.75rem', background: 'rgba(0,0,0,0.05)', padding: '2px 6px', borderRadius: 4 }}>{p.code}</code></td>
                <td style={cellStyle}>{badge(levels[p.level] || `L${p.level}`, '#6366f1')}</td>
                <td style={cellStyle}>{p.min_salary && p.max_salary ? `${Number(p.min_salary).toLocaleString()} - ${Number(p.max_salary).toLocaleString()}` : '—'}</td>
                <td style={cellStyle}>{statusBadge(p.status)}</td>
                <td style={cellStyle}>
                  <button className="btn-ghost" onClick={() => openEdit(p)} style={{ marginRight: 6 }}><Edit3 size={14} /></button>
                  <button className="btn-ghost" onClick={() => handleDelete(p.id)}><Trash2 size={14} /></button>
                </td>
              </tr>
            ))}</tbody>
          </table>
        );

      case 'hierarchy':
        return (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr>
              <th style={headerStyle}>Employee</th><th style={headerStyle}>Number</th><th style={headerStyle}>Position</th><th style={headerStyle}>Department</th><th style={headerStyle}>Direct Manager</th><th style={headerStyle}>Status</th><th style={headerStyle}>Actions</th>
            </tr></thead>
            <tbody>{hierarchy.filter(filterFn).map(h => (
              <tr key={h.id} style={{ transition: 'background 0.2s' }} onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.3)')} onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                <td style={cellStyle}><strong>{h.user?.name || '—'}</strong><div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{h.user?.email}</div></td>
                <td style={cellStyle}>{h.employee_number || '—'}</td>
                <td style={cellStyle}>{h.position?.title || '—'}</td>
                <td style={cellStyle}>{h.department?.name || '—'}</td>
                <td style={cellStyle}>
                  {h.direct_manager ? (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600, background: 'rgba(59, 130, 246, 0.1)', color: '#2563eb' }}>
                      👤 {h.direct_manager.name}
                    </span>
                  ) : (
                    <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>CEO Direct Report</span>
                  )}
                </td>
                <td style={cellStyle}>{statusBadge(h.status)}</td>
                <td style={cellStyle}>
                  <button className="btn-ghost" onClick={() => openEdit(h)} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '6px 10px', fontSize: '0.72rem', background: 'rgba(50, 71, 58, 0.05)', borderRadius: '4px', border: '1px solid var(--border-glass)', cursor: 'pointer', transition: 'all 0.15s' }}>
                    <Edit3 size={12} /> Edit Manager
                  </button>
                </td>
              </tr>
            ))}</tbody>
          </table>
        );

      case 'delegations':
        return (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr>
              <th style={headerStyle}>Delegator</th><th style={headerStyle}>Delegate</th><th style={headerStyle}>Type</th><th style={headerStyle}>Period</th><th style={headerStyle}>Status</th><th style={headerStyle}>Actions</th>
            </tr></thead>
            <tbody>{delegations.filter(filterFn).map(d => (
              <tr key={d.id}>
                <td style={cellStyle}><strong>{d.delegator?.name || '—'}</strong></td>
                <td style={cellStyle}>{d.delegate?.name || '—'}</td>
                <td style={cellStyle}>{badge(d.type, '#6366f1')}</td>
                <td style={cellStyle}><div style={{ fontSize: '0.75rem' }}>{new Date(d.start_date).toLocaleDateString()} → {new Date(d.end_date).toLocaleDateString()}</div></td>
                <td style={cellStyle}>{statusBadge(d.status)}</td>
                <td style={cellStyle}>{d.status === 'active' && <button className="btn-ghost" onClick={async () => { await api.post(`/v1/enterprise/delegations/${d.id}/revoke`); loadAll(); }}>Revoke</button>}</td>
              </tr>
            ))}</tbody>
          </table>
        );
      case 'commissions':
        return (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr>
              <th style={headerStyle}>Rule Title</th>
              <th style={headerStyle}>Percentage</th>
              <th style={headerStyle}>Target Tier/Role</th>
              <th style={headerStyle}>Project Target</th>
              <th style={headerStyle}>Unit Type</th>
              <th style={headerStyle}>Deal Size Range</th>
              <th style={headerStyle}>Status</th>
              <th style={headerStyle}>Actions</th>
            </tr></thead>
            <tbody>{commissions.filter(filterFn).map(c => (
              <tr key={c.id} style={{ transition: 'background 0.2s' }} onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.3)')} onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                <td style={cellStyle}><strong>{c.title}</strong></td>
                <td style={cellStyle}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--color-primary)' }}>
                    {parseFloat(c.commission_percentage).toFixed(2)}%
                  </span>
                </td>
                <td style={cellStyle}>
                  {badge(c.tier_type.replace('_', ' '), c.tier_type.startsWith('tier') ? '#8b5cf6' : '#6366f1')}
                </td>
                <td style={cellStyle}>
                  {c.project ? (
                    <span style={{ fontWeight: 600 }}>🏢 {c.project.name}</span>
                  ) : (
                    <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>🌍 Global (All Projects)</span>
                  )}
                </td>
                <td style={cellStyle}>
                  {c.unit_type ? (
                    badge(c.unit_type, '#06b6d4')
                  ) : (
                    <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Any Type</span>
                  )}
                </td>
                <td style={cellStyle}>
                  {parseFloat(c.min_deal_size) === 0 && parseFloat(c.max_deal_size) >= 999999999 ? (
                    <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Any size</span>
                  ) : (
                    <div style={{ fontSize: '0.75rem' }}>
                      {parseFloat(c.min_deal_size).toLocaleString()} - {parseFloat(c.max_deal_size).toLocaleString()} EGP
                    </div>
                  )}
                </td>
                <td style={cellStyle}>{statusBadge(c.status)}</td>
                <td style={cellStyle}>
                  <button className="btn-ghost" onClick={() => openEdit(c)} style={{ marginRight: 6 }}><Edit3 size={14} /></button>
                  <button className="btn-ghost" onClick={() => handleDelete(c.id)}><Trash2 size={14} /></button>
                </td>
              </tr>
            ))}</tbody>
          </table>
        );

      default: return null;
    }
  };

  // ── Render modal form based on active tab ──
  const renderForm = () => {
    const selectStyle = { ...inputStyle, cursor: 'pointer' as const };

    switch (activeTab) {
      case 'companies':
        return (<>
          <Field label="Company Name"><input style={inputStyle} value={formData.name || ''} onChange={e => set('name', e.target.value)} placeholder="e.g. REDP Holdings" /></Field>
          <Field label="Legal Name"><input style={inputStyle} value={formData.legal_name || ''} onChange={e => set('legal_name', e.target.value)} /></Field>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Type"><select style={selectStyle} value={formData.type || 'subsidiary'} onChange={e => set('type', e.target.value)}><option value="holding">Holding</option><option value="subsidiary">Subsidiary</option><option value="branch_company">Branch Company</option></select></Field>
            <Field label="Status"><select style={selectStyle} value={formData.status || 'active'} onChange={e => set('status', e.target.value)}><option value="active">Active</option><option value="inactive">Inactive</option><option value="suspended">Suspended</option></select></Field>
          </div>
          <Field label="Parent Company"><select style={selectStyle} value={formData.parent_company_id || ''} onChange={e => set('parent_company_id', e.target.value || null)}><option value="">— None (Root) —</option>{companies.filter(c => c.id !== editItem?.id).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field>
          <Field label="Country"><select style={selectStyle} value={formData.country_id || ''} onChange={e => set('country_id', e.target.value || null)}><option value="">— Select —</option>{countries.map(c => <option key={c.id} value={c.id}>{c.flag_emoji} {c.name}</option>)}</select></Field>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Phone"><input style={inputStyle} value={formData.phone || ''} onChange={e => set('phone', e.target.value)} /></Field>
            <Field label="Email"><input style={inputStyle} value={formData.email || ''} onChange={e => set('email', e.target.value)} /></Field>
          </div>
          <Field label="City"><input style={inputStyle} value={formData.city || ''} onChange={e => set('city', e.target.value)} /></Field>
          <Field label="Tax ID"><input style={inputStyle} value={formData.tax_id || ''} onChange={e => set('tax_id', e.target.value)} /></Field>
        </>);

      case 'countries':
        return (<>
          <Field label="Country Name"><input style={inputStyle} value={formData.name || ''} onChange={e => set('name', e.target.value)} placeholder="Egypt" /></Field>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <Field label="Code (ISO)"><input style={inputStyle} value={formData.code || ''} onChange={e => set('code', e.target.value)} placeholder="EG" maxLength={3} /></Field>
            <Field label="Phone Code"><input style={inputStyle} value={formData.phone_code || ''} onChange={e => set('phone_code', e.target.value)} placeholder="20" /></Field>
            <Field label="Currency"><input style={inputStyle} value={formData.currency_code || ''} onChange={e => set('currency_code', e.target.value)} placeholder="EGP" maxLength={3} /></Field>
          </div>
          <Field label="Timezone"><input style={inputStyle} value={formData.timezone || ''} onChange={e => set('timezone', e.target.value)} placeholder="Africa/Cairo" /></Field>
          <Field label="Flag Emoji"><input style={inputStyle} value={formData.flag_emoji || ''} onChange={e => set('flag_emoji', e.target.value)} placeholder="🇪🇬" /></Field>
        </>);

      case 'branches':
        return (<>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>
            <Field label="Branch Name"><input style={inputStyle} value={formData.name || ''} onChange={e => set('name', e.target.value)} placeholder="Cairo HQ" /></Field>
            <Field label="Code"><input style={inputStyle} value={formData.code || ''} onChange={e => set('code', e.target.value)} placeholder="CAI-HQ" /></Field>
          </div>
          <Field label="Company"><select style={selectStyle} value={formData.company_id || ''} onChange={e => set('company_id', e.target.value)}><option value="">— Select —</option>{companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Country"><select style={selectStyle} value={formData.country_id || ''} onChange={e => set('country_id', e.target.value || null)}><option value="">— Select —</option>{countries.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field>
            <Field label="Region"><select style={selectStyle} value={formData.region_id || ''} onChange={e => set('region_id', e.target.value || null)}><option value="">— Select —</option>{regions.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}</select></Field>
          </div>
          <Field label="City"><input style={inputStyle} value={formData.city || ''} onChange={e => set('city', e.target.value)} /></Field>
          <Field label="Manager"><select style={selectStyle} value={formData.manager_id || ''} onChange={e => set('manager_id', e.target.value || null)}><option value="">— Select —</option>{users.map(u => <option key={u.id} value={u.id}>{u.name} ({u.role})</option>)}</select></Field>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Phone"><input style={inputStyle} value={formData.phone || ''} onChange={e => set('phone', e.target.value)} /></Field>
            <Field label="Email"><input style={inputStyle} value={formData.email || ''} onChange={e => set('email', e.target.value)} /></Field>
          </div>
        </>);

      case 'departments':
        return (<>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>
            <Field label="Department Name"><input style={inputStyle} value={formData.name || ''} onChange={e => set('name', e.target.value)} placeholder="Sales Department" /></Field>
            <Field label="Code"><input style={inputStyle} value={formData.code || ''} onChange={e => set('code', e.target.value)} placeholder="SALES" /></Field>
          </div>
          <Field label="Company"><select style={selectStyle} value={formData.company_id || ''} onChange={e => set('company_id', e.target.value)}><option value="">— Select —</option>{companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field>
          <Field label="Branch"><select style={selectStyle} value={formData.branch_id || ''} onChange={e => set('branch_id', e.target.value || null)}><option value="">— Select —</option>{branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}</select></Field>
          <Field label="Parent Department"><select style={selectStyle} value={formData.parent_department_id || ''} onChange={e => set('parent_department_id', e.target.value || null)}><option value="">— None (Root) —</option>{departments.filter(d => d.id !== editItem?.id).map(d => <option key={d.id} value={d.id}>{d.name}</option>)}</select></Field>
          <Field label="Department Head"><select style={selectStyle} value={formData.head_id || ''} onChange={e => set('head_id', e.target.value || null)}><option value="">— Select —</option>{users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}</select></Field>
        </>);

      case 'teams':
        return (<>
          <Field label="Team Name"><input style={inputStyle} value={formData.name || ''} onChange={e => set('name', e.target.value)} placeholder="Sales Team A" /></Field>
          <Field label="Company"><select style={selectStyle} value={formData.company_id || ''} onChange={e => set('company_id', e.target.value)}><option value="">— Select —</option>{companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field>
          <Field label="Department"><select style={selectStyle} value={formData.department_id || ''} onChange={e => set('department_id', e.target.value)}><option value="">— Select —</option>{departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}</select></Field>
          <Field label="Team Leader"><select style={selectStyle} value={formData.leader_id || ''} onChange={e => set('leader_id', e.target.value || null)}><option value="">— Select —</option>{users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}</select></Field>
        </>);

      case 'positions':
        return (<>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>
            <Field label="Title"><input style={inputStyle} value={formData.title || ''} onChange={e => set('title', e.target.value)} placeholder="Sales Manager" /></Field>
            <Field label="Code"><input style={inputStyle} value={formData.code || ''} onChange={e => set('code', e.target.value)} placeholder="SM" /></Field>
          </div>
          <Field label="Company"><select style={selectStyle} value={formData.company_id || ''} onChange={e => set('company_id', e.target.value)}><option value="">— Select —</option>{companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field>
          <Field label="Level"><select style={selectStyle} value={formData.level || 5} onChange={e => set('level', parseInt(e.target.value))}><option value={1}>1 — C-Suite</option><option value={2}>2 — Vice President</option><option value={3}>3 — Director</option><option value={4}>4 — Manager</option><option value={5}>5 — Senior Staff</option><option value={6}>6 — Staff</option><option value={7}>7 — Junior</option><option value={8}>8 — Intern</option></select></Field>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Min Salary"><input style={inputStyle} type="number" value={formData.min_salary || ''} onChange={e => set('min_salary', e.target.value)} /></Field>
            <Field label="Max Salary"><input style={inputStyle} type="number" value={formData.max_salary || ''} onChange={e => set('max_salary', e.target.value)} /></Field>
          </div>
        </>);

      case 'hierarchy':
        const isEditing = !!editItem;
        return (<>
          {isEditing && (
            <div style={{ padding: '10px 14px', background: 'rgba(59, 130, 246, 0.08)', borderRadius: 'var(--radius-md)', marginBottom: '18px', borderLeft: '4px solid #2563eb', fontSize: '0.82rem', color: '#1e3a8a', fontWeight: 600 }}>
              👤 Modifying manager and reporting structure for: {editItem.user?.name}
            </div>
          )}
          
          <Field label="Employee">
            <select style={selectStyle} value={formData.user_id || ''} onChange={e => set('user_id', e.target.value)} disabled={isEditing}>
              <option value="">— Select Employee —</option>
              {users.map(u => <option key={u.id} value={u.id}>{u.name} ({u.email})</option>)}
            </select>
          </Field>

          <Field label="Direct Manager (Reporting Line)">
            <select style={selectStyle} value={formData.direct_manager_id || ''} onChange={e => set('direct_manager_id', e.target.value || null)}>
              <option value="">— No Direct Manager (Direct Report to CEO) —</option>
              {users.filter(u => u.id !== formData.user_id).map(u => <option key={u.id} value={u.id}>{u.name} ({u.role})</option>)}
            </select>
          </Field>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Company">
              <select style={selectStyle} value={formData.company_id || ''} onChange={e => set('company_id', e.target.value)} disabled={isEditing}>
                <option value="">— Select Company —</option>
                {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </Field>

            <Field label="Branch">
              <select style={selectStyle} value={formData.branch_id || ''} onChange={e => set('branch_id', e.target.value || null)}>
                <option value="">— Select Branch —</option>
                {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </Field>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Department">
              <select style={selectStyle} value={formData.department_id || ''} onChange={e => set('department_id', e.target.value || null)}>
                <option value="">— Select Department —</option>
                {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </Field>

            <Field label="Team">
              <select style={selectStyle} value={formData.team_id || ''} onChange={e => set('team_id', e.target.value || null)}>
                <option value="">— Select Team —</option>
                {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </Field>
          </div>

          <Field label="Position">
            <select style={selectStyle} value={formData.position_id || ''} onChange={e => set('position_id', e.target.value || null)}>
              <option value="">— Select Position —</option>
              {positions.map(p => <option key={p.id} value={p.id}>{p.title} (Level {p.level})</option>)}
            </select>
          </Field>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Employee Number">
              <input style={inputStyle} value={formData.employee_number || ''} onChange={e => set('employee_number', e.target.value)} placeholder="EMP-001" />
            </Field>

            <Field label="Hire Date">
              <input style={inputStyle} type="date" value={formData.hire_date || ''} onChange={e => set('hire_date', e.target.value)} />
            </Field>
          </div>
        </>);

      case 'delegations':
        return (<>
          <Field label="Delegator (From)"><select style={selectStyle} value={formData.delegator_id || ''} onChange={e => set('delegator_id', e.target.value)}><option value="">— Select —</option>{users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}</select></Field>
          <Field label="Delegate (To)"><select style={selectStyle} value={formData.delegate_id || ''} onChange={e => set('delegate_id', e.target.value)}><option value="">— Select —</option>{users.filter(u => u.id !== formData.delegator_id).map(u => <option key={u.id} value={u.id}>{u.name}</option>)}</select></Field>
          <Field label="Company"><select style={selectStyle} value={formData.company_id || ''} onChange={e => set('company_id', e.target.value)}><option value="">— Select —</option>{companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field>
          <Field label="Type"><select style={selectStyle} value={formData.type || 'full'} onChange={e => set('type', e.target.value)}><option value="full">Full Delegation</option><option value="approval_only">Approval Only</option><option value="view_only">View Only</option></select></Field>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Start Date"><input style={inputStyle} type="date" value={formData.start_date?.split('T')[0] || ''} onChange={e => set('start_date', e.target.value)} /></Field>
            <Field label="End Date"><input style={inputStyle} type="date" value={formData.end_date?.split('T')[0] || ''} onChange={e => set('end_date', e.target.value)} /></Field>
          </div>
          <Field label="Reason"><textarea style={{ ...inputStyle, minHeight: 60 }} value={formData.reason || ''} onChange={e => set('reason', e.target.value)} placeholder="Annual leave coverage..." /></Field>
        </>);

      case 'commissions':
        return (<>
          <Field label="Rule Title *">
            <input style={inputStyle} value={formData.title || ''} onChange={e => set('title', e.target.value)} placeholder="e.g. TeleSales Standard Rate" required />
          </Field>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Commission Percentage (%) *">
              <input style={inputStyle} type="number" step="0.01" value={formData.commission_percentage !== undefined ? formData.commission_percentage : ''} onChange={e => set('commission_percentage', parseFloat(e.target.value))} placeholder="e.g. 2.50" required />
            </Field>
            <Field label="Target Tier/Role *">
              <select style={selectStyle} value={formData.tier_type || 'sales_agent'} onChange={e => set('tier_type', e.target.value)}>
                <option value="tier_1">Tier 1: Tele-Sales Agent</option>
                <option value="tier_2">Tier 2: External Broker</option>
                <option value="tier_3">Tier 3: Company Sales Agent</option>
                <option value="sales_agent">Sales Agent (Standard)</option>
                <option value="broker">Broker (Standard)</option>
                <option value="manager">Manager</option>
                <option value="director">Director</option>
              </select>
            </Field>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Project Target">
              <select style={selectStyle} value={formData.project_id || ''} onChange={e => set('project_id', e.target.value || null)}>
                <option value="">— Global (All Projects) —</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </Field>
            <Field label="Unit Type Target">
              <select style={selectStyle} value={formData.unit_type || ''} onChange={e => set('unit_type', e.target.value || null)}>
                <option value="">— All Unit Types —</option>
                <option value="Apartment">Apartment</option>
                <option value="Duplex">Duplex</option>
                <option value="Villa">Villa</option>
                <option value="Penthouse">Penthouse</option>
                <option value="Commercial">Commercial</option>
                <option value="Administrative">Administrative</option>
              </select>
            </Field>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Min Deal Size (EGP)">
              <input style={inputStyle} type="number" value={formData.min_deal_size !== undefined ? formData.min_deal_size : ''} onChange={e => set('min_deal_size', e.target.value ? parseFloat(e.target.value) : 0)} placeholder="0" />
            </Field>
            <Field label="Max Deal Size (EGP)">
              <input style={inputStyle} type="number" value={formData.max_deal_size !== undefined ? formData.max_deal_size : ''} onChange={e => set('max_deal_size', e.target.value ? parseFloat(e.target.value) : 999999999)} placeholder="999,999,999" />
            </Field>
          </div>
          {editItem && (
            <Field label="Status *">
              <select style={selectStyle} value={formData.status || 'active'} onChange={e => set('status', e.target.value)}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </Field>
          )}
        </>);

      default: return null;
    }
  };

  const tabObj = tabs.find(t => t.key === activeTab)!;

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: 4 }}>🏢 Enterprise Organization</h1>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>Manage your organizational hierarchy — companies, branches, departments, teams, and employees</p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 24 }}>
        {stats.map(s => (
          <div key={s.label} className="glass-panel" style={{ padding: '16px 20px', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-sm)', background: `${s.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <s.icon size={18} color={s.color} />
            </div>
            <div>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)' }}>{s.value}</div>
              <div style={{ fontSize: '0.68rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 20 }}>
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 16px', borderRadius: 9999, border: 'none',
              background: activeTab === t.key ? 'var(--color-primary)' : 'rgba(255,255,255,0.5)',
              color: activeTab === t.key ? '#fff' : 'var(--text-muted)',
              fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            <t.icon size={14} />
            {t.label}
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div className="glass-panel" style={{ padding: '14px 20px', borderRadius: 'var(--radius-md)', marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Search size={16} color="var(--text-muted)" />
          <input
            style={{ ...inputStyle, width: 280, border: 'none', background: 'transparent' }}
            placeholder={`Search ${tabObj.label.toLowerCase()}...`}
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <button className="btn-primary" onClick={openCreate} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Plus size={16} />
          Add {tabObj.label.slice(0, -1)}
        </button>
      </div>

      {/* Data Table */}
      <div className="glass-panel" style={{ borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Loading...</div>
        ) : (
          renderTable()
        )}
      </div>

      {/* Modal */}
      <Modal open={modalOpen} title={`${editItem ? 'Edit' : 'New'} ${tabObj.label.slice(0, -1)}`} onClose={closeModal}>
        {renderForm()}
        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
          <button className="btn-primary" onClick={handleSave} style={{ flex: 1 }}>
            {editItem ? 'Update' : 'Create'}
          </button>
          <button className="btn-secondary" onClick={closeModal} style={{ flex: 1 }}>
            Cancel
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default OrganizationManagement;
