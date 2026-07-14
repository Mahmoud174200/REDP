import React, { useEffect, useState } from 'react';
import {
  Users, UsersRound, Building2, Wallet, TrendingUp, Plus, Trash2, Pencil,
  KeyRound, X, Copy, Check, ShieldCheck, Briefcase, Crown, UserCog, Send, Loader2,
} from 'lucide-react';
import api from '../../services/api';

// ── Palette (Mountain View royal blue) ──
const C = {
  primary: '#003DA6',
  primaryDark: '#00205b',
  bg: '#f8fafc',
  card: '#ffffff',
  border: 'rgba(0, 61, 166, 0.10)',
  text: '#0f172a',
  muted: '#64748b',
  green: '#059669',
  amber: '#d97706',
  red: '#dc2626',
};

type Tab = 'overview' | 'employees' | 'teams' | 'projects';

interface EmployeeStats {
  total_leads: number; reservations: number; closed_sales: number;
  presentations: number; calls: number; meetings: number; commission_earned: number;
}
interface Employee {
  id: string; name: string; email: string; phone: string | null; status: string;
  employee_number: string; is_owner: boolean; role_type: string; position: string;
  team: { id: string; name: string } | null;
  manager: { id: string; name: string } | null;
  referral_code: string | null; stats: EmployeeStats;
}
interface Team {
  id: string; name: string; description: string | null; status: string;
  leader: { id: string; name: string } | null; member_count: number;
  members: { id: string; name: string; status: string }[];
  stats: { total_leads: number; closed_sales: number; commission: number };
}
interface ProjectLink {
  id: string; project_id: string; status: string;
  project: { id: string; name: string; location: string; status: string };
}
interface ProjectLite { id: string; name: string; location: string; status: string }

const fmtMoney = (n: number) =>
  new Intl.NumberFormat('en-EG', { maximumFractionDigits: 0 }).format(n || 0) + ' EGP';

const BrokerCompanyManagement: React.FC = () => {
  const [tab, setTab] = useState<Tab>('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [dashboard, setDashboard] = useState<any>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [projects, setProjects] = useState<{ assigned: ProjectLink[]; requested: ProjectLink[]; rejected: ProjectLink[]; available: ProjectLite[] }>({ assigned: [], requested: [], rejected: [], available: [] });

  // Modals
  const [empModal, setEmpModal] = useState<{ open: boolean; edit?: Employee }>({ open: false });
  const [teamModal, setTeamModal] = useState<{ open: boolean; edit?: Team }>({ open: false });
  const [credentials, setCredentials] = useState<{ email: string; password: string } | null>(null);
  const [detail, setDetail] = useState<any>(null);

  const user = (() => { try { return JSON.parse(localStorage.getItem('redp_user') || '{}'); } catch { return {}; } })();
  const isOwner = /POS-DH/.test(user?.employeeHierarchy?.position?.code || user?.position?.code || '')
    || /Owner|Head|CEO/i.test(user?.employeeHierarchy?.position?.title || user?.position?.title || '');

  const loadAll = async () => {
    setLoading(true); setError('');
    try {
      const [d, e, t, p] = await Promise.all([
        api.get('/v1/sales/broker/company/dashboard'),
        api.get('/v1/sales/broker/company/employees'),
        api.get('/v1/sales/broker/company/teams'),
        api.get('/v1/sales/broker/company/projects'),
      ]);
      setDashboard(d.data);
      setEmployees(e.data.data || []);
      setTeams(t.data.data || []);
      setProjects({ assigned: p.data.assigned || [], requested: p.data.requested || [], rejected: p.data.rejected || [], available: p.data.available || [] });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load your agency workspace.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAll(); }, []);

  const openDetail = async (id: string) => {
    try {
      const res = await api.get(`/v1/sales/broker/company/employees/${id}`);
      setDetail(res.data);
    } catch (err: any) { alert(err.response?.data?.message || 'Failed to load employee.'); }
  };

  const resetPassword = async (id: string) => {
    if (!confirm('Generate a new password for this employee?')) return;
    try {
      const res = await api.post(`/v1/sales/broker/company/employees/${id}/reset-password`, {});
      setCredentials(res.data.credentials);
    } catch (err: any) { alert(err.response?.data?.message || 'Failed.'); }
  };

  const deactivate = async (id: string) => {
    if (!confirm('Deactivate this employee? They will no longer be able to sign in.')) return;
    try {
      await api.delete(`/v1/sales/broker/company/employees/${id}`);
      loadAll();
    } catch (err: any) { alert(err.response?.data?.message || 'Failed.'); }
  };

  const removeTeam = async (id: string) => {
    if (!confirm('Delete this team? Members will be unassigned.')) return;
    try {
      await api.delete(`/v1/sales/broker/company/teams/${id}`);
      loadAll();
    } catch (err: any) { alert(err.response?.data?.message || 'Failed.'); }
  };

  const requestProjects = async (ids: string[]) => {
    try {
      await api.post('/v1/sales/broker/company/projects/request', { project_ids: ids });
      loadAll();
    } catch (err: any) { alert(err.response?.data?.message || 'Failed.'); }
  };

  const tabs: { key: Tab; label: string; icon: any }[] = [
    { key: 'overview', label: 'Overview', icon: TrendingUp },
    { key: 'employees', label: 'Employees', icon: Users },
    { key: 'teams', label: 'Teams', icon: UsersRound },
    { key: 'projects', label: 'Projects', icon: Building2 },
  ];

  if (loading) {
    return <div style={{ padding: 40, display: 'flex', alignItems: 'center', gap: 10, color: C.muted }}>
      <Loader2 className="spin" style={{ width: 18, height: 18 }} /> Loading your agency workspace…
    </div>;
  }

  return (
    <div style={{ padding: '4px 8px 40px', fontFamily: 'var(--font-body)', color: C.text }}>
      <style>{`.spin{animation:spin 1s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}
        .bcm-btn{display:inline-flex;align-items:center;gap:7px;border:none;border-radius:10px;padding:9px 16px;font-weight:700;font-size:.82rem;cursor:pointer;transition:all .2s}
        .bcm-btn-primary{background:linear-gradient(135deg,${C.primary},${C.primaryDark});color:#fff;box-shadow:0 4px 14px rgba(0,61,166,.2)}
        .bcm-btn-primary:hover{transform:translateY(-1px)}
        .bcm-btn-ghost{background:#fff;border:1px solid ${C.border};color:${C.primary}}
        .bcm-btn-ghost:hover{background:rgba(0,61,166,.04)}
        .bcm-icon-btn{border:1px solid ${C.border};background:#fff;border-radius:8px;padding:6px;cursor:pointer;display:inline-flex;color:${C.muted}}
        .bcm-icon-btn:hover{color:${C.primary};border-color:${C.primary}}
        .bcm-card{background:${C.card};border:1px solid ${C.border};border-radius:16px}
        .bcm-input{width:100%;padding:10px 12px;border:1px solid ${C.border};border-radius:10px;font-size:.85rem;color:${C.text};background:#fff}
        .bcm-input:focus{outline:none;border-color:${C.primary};box-shadow:0 0 0 3px rgba(0,61,166,.08)}
        .bcm-th{text-align:left;font-size:.62rem;text-transform:uppercase;letter-spacing:.06em;color:${C.muted};font-weight:800;padding:10px 12px}
        .bcm-td{padding:12px;font-size:.82rem;border-top:1px solid ${C.border}}
      `}</style>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 18 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 42, height: 42, borderRadius: 12, background: `linear-gradient(135deg,${C.primary},${C.primaryDark})`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Briefcase style={{ width: 22, height: 22, color: '#fff' }} />
            </div>
            <div>
              <h1 style={{ fontSize: '1.3rem', fontWeight: 800, margin: 0, fontFamily: 'var(--font-title)' }}>
                {dashboard?.company?.name || 'Agency Management'}
              </h1>
              <p style={{ margin: 0, fontSize: '.78rem', color: C.muted }}>
                Manage your brokerage team, structure & assigned projects
              </p>
            </div>
          </div>
        </div>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(5,150,105,.1)', color: C.green, padding: '6px 12px', borderRadius: 20, fontSize: '.72rem', fontWeight: 700 }}>
          <ShieldCheck style={{ width: 13, height: 13 }} /> Active Agency
        </span>
      </div>

      {error && <div style={{ background: 'rgba(220,38,38,.06)', border: '1px solid rgba(220,38,38,.2)', color: C.red, padding: '10px 14px', borderRadius: 10, marginBottom: 14, fontSize: '.82rem' }}>{error}</div>}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 20, borderBottom: `1px solid ${C.border}`, flexWrap: 'wrap' }}>
        {tabs.map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setTab(key)} style={{
            display: 'inline-flex', alignItems: 'center', gap: 7, padding: '10px 16px', border: 'none', background: 'none', cursor: 'pointer',
            fontWeight: 700, fontSize: '.84rem', color: tab === key ? C.primary : C.muted,
            borderBottom: tab === key ? `2px solid ${C.primary}` : '2px solid transparent', marginBottom: -1,
          }}>
            <Icon style={{ width: 15, height: 15 }} /> {label}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW ── */}
      {tab === 'overview' && dashboard && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 14, marginBottom: 22 }}>
            {[
              { label: 'Employees', value: dashboard.stats.employees, icon: Users, color: C.primary },
              { label: 'Teams', value: dashboard.stats.teams, icon: UsersRound, color: '#7c3aed' },
              { label: 'Total Leads', value: dashboard.stats.total_leads, icon: TrendingUp, color: C.amber },
              { label: 'Closed Sales', value: dashboard.stats.closed_sales, icon: Check, color: C.green },
              { label: 'Assigned Projects', value: dashboard.stats.assigned_projects, icon: Building2, color: '#0891b2' },
              { label: 'Total Commission', value: fmtMoney(dashboard.stats.total_commission), icon: Wallet, color: C.green, small: true },
            ].map((s, i) => (
              <div key={i} className="bcm-card" style={{ padding: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '.68rem', textTransform: 'uppercase', letterSpacing: '.06em', color: C.muted, fontWeight: 800 }}>{s.label}</span>
                  <s.icon style={{ width: 16, height: 16, color: s.color }} />
                </div>
                <div style={{ fontSize: s.small ? '1.05rem' : '1.7rem', fontWeight: 800, marginTop: 8, color: C.text }}>{s.value}</div>
              </div>
            ))}
          </div>

          <div className="bcm-card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '14px 18px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Crown style={{ width: 16, height: 16, color: C.amber }} />
              <h3 style={{ margin: 0, fontSize: '.95rem', fontWeight: 800 }}>Top Performers</h3>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr>
                  <th className="bcm-th">#</th><th className="bcm-th">Name</th><th className="bcm-th">Leads</th>
                  <th className="bcm-th">Closed Sales</th><th className="bcm-th">Commission</th>
                </tr></thead>
                <tbody>
                  {(dashboard.top_performers || []).map((p: any, i: number) => (
                    <tr key={p.user_id}>
                      <td className="bcm-td" style={{ fontWeight: 700, color: C.muted }}>{i + 1}</td>
                      <td className="bcm-td" style={{ fontWeight: 700 }}>{p.name}</td>
                      <td className="bcm-td">{p.leads}</td>
                      <td className="bcm-td">{p.closed_sales}</td>
                      <td className="bcm-td" style={{ fontWeight: 700, color: C.green }}>{fmtMoney(p.commission)}</td>
                    </tr>
                  ))}
                  {(!dashboard.top_performers || dashboard.top_performers.length === 0) && (
                    <tr><td className="bcm-td" colSpan={5} style={{ color: C.muted, textAlign: 'center' }}>No performance data yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── EMPLOYEES ── */}
      {tab === 'employees' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <span style={{ fontSize: '.85rem', color: C.muted, fontWeight: 600 }}>{employees.length} employee(s)</span>
            {isOwner && <button className="bcm-btn bcm-btn-primary" onClick={() => setEmpModal({ open: true })}><Plus style={{ width: 15, height: 15 }} /> Add Employee</button>}
          </div>
          <div className="bcm-card" style={{ overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr>
                  <th className="bcm-th">Name</th><th className="bcm-th">Role</th><th className="bcm-th">Team</th>
                  <th className="bcm-th">Leads</th><th className="bcm-th">Sales</th><th className="bcm-th">Commission</th>
                  <th className="bcm-th">Status</th><th className="bcm-th" style={{ textAlign: 'right' }}>Actions</th>
                </tr></thead>
                <tbody>
                  {employees.map(e => (
                    <tr key={e.id}>
                      <td className="bcm-td">
                        <button onClick={() => openDetail(e.id)} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left' }}>
                          <div style={{ fontWeight: 700, color: C.primary }}>{e.name}</div>
                          <div style={{ fontSize: '.72rem', color: C.muted }}>{e.email}</div>
                        </button>
                      </td>
                      <td className="bcm-td">
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: '.72rem', fontWeight: 700, color: e.is_owner ? C.amber : e.role_type === 'team_leader' ? '#7c3aed' : C.muted }}>
                          {e.is_owner ? <Crown style={{ width: 12, height: 12 }} /> : e.role_type === 'team_leader' ? <UserCog style={{ width: 12, height: 12 }} /> : <Users style={{ width: 12, height: 12 }} />}
                          {e.is_owner ? 'Owner' : e.role_type === 'team_leader' ? 'Team Leader' : 'Agent'}
                        </span>
                      </td>
                      <td className="bcm-td" style={{ color: C.muted }}>{e.team?.name || '—'}</td>
                      <td className="bcm-td">{e.stats.total_leads}</td>
                      <td className="bcm-td">{e.stats.closed_sales}</td>
                      <td className="bcm-td" style={{ fontWeight: 700, color: C.green }}>{fmtMoney(e.stats.commission_earned)}</td>
                      <td className="bcm-td">
                        <span style={{ fontSize: '.68rem', fontWeight: 700, padding: '3px 8px', borderRadius: 12, background: e.status === 'active' ? 'rgba(5,150,105,.1)' : 'rgba(100,116,139,.12)', color: e.status === 'active' ? C.green : C.muted }}>{e.status}</span>
                      </td>
                      <td className="bcm-td" style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                        {isOwner && !e.is_owner && (
                          <span style={{ display: 'inline-flex', gap: 6, justifyContent: 'flex-end' }}>
                            <button className="bcm-icon-btn" title="Edit" onClick={() => setEmpModal({ open: true, edit: e })}><Pencil style={{ width: 14, height: 14 }} /></button>
                            <button className="bcm-icon-btn" title="Reset password" onClick={() => resetPassword(e.id)}><KeyRound style={{ width: 14, height: 14 }} /></button>
                            <button className="bcm-icon-btn" title="Deactivate" onClick={() => deactivate(e.id)}><Trash2 style={{ width: 14, height: 14 }} /></button>
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {employees.length === 0 && <tr><td className="bcm-td" colSpan={8} style={{ textAlign: 'center', color: C.muted }}>No employees yet.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── TEAMS ── */}
      {tab === 'teams' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <span style={{ fontSize: '.85rem', color: C.muted, fontWeight: 600 }}>{teams.length} team(s)</span>
            {isOwner && <button className="bcm-btn bcm-btn-primary" onClick={() => setTeamModal({ open: true })}><Plus style={{ width: 15, height: 15 }} /> Create Team</button>}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 14 }}>
            {teams.map(t => (
              <div key={t.id} className="bcm-card" style={{ padding: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '.98rem', fontWeight: 800 }}>{t.name}</h3>
                    <p style={{ margin: '3px 0 0', fontSize: '.75rem', color: C.muted }}>
                      Leader: {t.leader?.name || 'Unassigned'} · {t.member_count} member(s)
                    </p>
                  </div>
                  {isOwner && (
                    <span style={{ display: 'inline-flex', gap: 6 }}>
                      <button className="bcm-icon-btn" title="Edit" onClick={() => setTeamModal({ open: true, edit: t })}><Pencil style={{ width: 13, height: 13 }} /></button>
                      <button className="bcm-icon-btn" title="Delete" onClick={() => removeTeam(t.id)}><Trash2 style={{ width: 13, height: 13 }} /></button>
                    </span>
                  )}
                </div>
                {t.description && <p style={{ fontSize: '.78rem', color: C.muted, marginTop: 8 }}>{t.description}</p>}
                <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                  {[['Leads', t.stats.total_leads], ['Sales', t.stats.closed_sales]].map(([l, v]) => (
                    <div key={l} style={{ flex: 1, background: C.bg, borderRadius: 10, padding: '8px 10px', textAlign: 'center' }}>
                      <div style={{ fontSize: '1.1rem', fontWeight: 800 }}>{v as number}</div>
                      <div style={{ fontSize: '.62rem', color: C.muted, textTransform: 'uppercase', fontWeight: 700 }}>{l}</div>
                    </div>
                  ))}
                  <div style={{ flex: 1.4, background: C.bg, borderRadius: 10, padding: '8px 10px', textAlign: 'center' }}>
                    <div style={{ fontSize: '.9rem', fontWeight: 800, color: C.green }}>{fmtMoney(t.stats.commission)}</div>
                    <div style={{ fontSize: '.62rem', color: C.muted, textTransform: 'uppercase', fontWeight: 700 }}>Commission</div>
                  </div>
                </div>
                {t.members.length > 0 && (
                  <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                    {t.members.map(m => (
                      <span key={m.id} style={{ fontSize: '.7rem', background: 'rgba(0,61,166,.06)', color: C.primary, padding: '3px 8px', borderRadius: 10, fontWeight: 600 }}>{m.name}</span>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {teams.length === 0 && <div className="bcm-card" style={{ padding: 30, textAlign: 'center', color: C.muted, gridColumn: '1/-1' }}>No teams yet. Create your first team to organize agents.</div>}
          </div>
        </div>
      )}

      {/* ── PROJECTS ── */}
      {tab === 'projects' && (
        <ProjectsPanel projects={projects} isOwner={isOwner} onRequest={requestProjects} />
      )}

      {/* Modals */}
      {empModal.open && (
        <EmployeeModal
          edit={empModal.edit}
          teams={teams}
          managers={employees.filter(e => e.is_owner || e.role_type === 'team_leader')}
          onClose={() => setEmpModal({ open: false })}
          onSaved={(creds) => { setEmpModal({ open: false }); if (creds) setCredentials(creds); loadAll(); }}
        />
      )}
      {teamModal.open && (
        <TeamModal
          edit={teamModal.edit}
          leaders={employees.filter(e => e.is_owner || e.role_type === 'team_leader')}
          onClose={() => setTeamModal({ open: false })}
          onSaved={() => { setTeamModal({ open: false }); loadAll(); }}
        />
      )}
      {credentials && <CredentialsModal creds={credentials} onClose={() => setCredentials(null)} />}
      {detail && <EmployeeDetailModal detail={detail} onClose={() => setDetail(null)} />}
    </div>
  );
};

// ── Sub-components ──

const Modal: React.FC<{ title: string; onClose: () => void; children: React.ReactNode; wide?: boolean }> = ({ title, onClose, children, wide }) => (
  <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,.45)', backdropFilter: 'blur(3px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
    <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 18, width: '100%', maxWidth: wide ? 640 : 460, maxHeight: '90vh', overflow: 'auto', boxShadow: '0 20px 60px rgba(0,15,61,.25)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: `1px solid ${C.border}`, position: 'sticky', top: 0, background: '#fff' }}>
        <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800 }}>{title}</h3>
        <button onClick={onClose} className="bcm-icon-btn"><X style={{ width: 15, height: 15 }} /></button>
      </div>
      <div style={{ padding: 20 }}>{children}</div>
    </div>
  </div>
);

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div style={{ marginBottom: 14 }}>
    <label style={{ display: 'block', fontSize: '.74rem', fontWeight: 700, color: '#334155', marginBottom: 6 }}>{label}</label>
    {children}
  </div>
);

const EmployeeModal: React.FC<{ edit?: Employee; teams: Team[]; managers: Employee[]; onClose: () => void; onSaved: (creds?: { email: string; password: string }) => void }> = ({ edit, teams, managers, onClose, onSaved }) => {
  const [form, setForm] = useState({
    name: edit?.name || '', email: edit?.email || '', phone: edit?.phone || '',
    password: '', role_type: edit?.role_type === 'team_leader' ? 'team_leader' : 'agent',
    team_id: edit?.team?.id || '', manager_user_id: edit?.manager?.id || '',
    status: edit?.status || 'active',
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  const save = async () => {
    setSaving(true); setErr('');
    try {
      if (edit) {
        await api.put(`/v1/sales/broker/company/employees/${edit.id}`, {
          name: form.name, phone: form.phone, role_type: form.role_type,
          team_id: form.team_id || null, manager_user_id: form.manager_user_id || null, status: form.status,
        });
        onSaved();
      } else {
        const res = await api.post('/v1/sales/broker/company/employees', {
          name: form.name, email: form.email, phone: form.phone, password: form.password || undefined,
          role_type: form.role_type, team_id: form.team_id || null, manager_user_id: form.manager_user_id || null,
        });
        onSaved(res.data.credentials);
      }
    } catch (e: any) {
      setErr(e.response?.data?.message || (Object.values(e.response?.data?.errors || {})[0] as any)?.[0] || 'Failed to save.');
    } finally { setSaving(false); }
  };

  return (
    <Modal title={edit ? 'Edit Employee' : 'Add Employee'} onClose={onClose}>
      {err && <div style={{ background: 'rgba(220,38,38,.06)', color: C.red, padding: '8px 12px', borderRadius: 8, fontSize: '.78rem', marginBottom: 12 }}>{err}</div>}
      <Field label="Full Name"><input className="bcm-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></Field>
      {!edit && <Field label="Email (login)"><input className="bcm-input" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></Field>}
      <Field label="Phone"><input className="bcm-input" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></Field>
      {!edit && <Field label="Password (leave blank to auto-generate)"><input className="bcm-input" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="Auto-generated if empty" /></Field>}
      <Field label="Role">
        <select className="bcm-input" value={form.role_type} onChange={e => setForm({ ...form, role_type: e.target.value })}>
          <option value="agent">Agent</option>
          <option value="team_leader">Team Leader</option>
        </select>
      </Field>
      <Field label="Team">
        <select className="bcm-input" value={form.team_id} onChange={e => setForm({ ...form, team_id: e.target.value })}>
          <option value="">No team</option>
          {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
      </Field>
      <Field label="Reports to">
        <select className="bcm-input" value={form.manager_user_id} onChange={e => setForm({ ...form, manager_user_id: e.target.value })}>
          <option value="">Owner (default)</option>
          {managers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
      </Field>
      {edit && (
        <Field label="Status">
          <select className="bcm-input" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </Field>
      )}
      <button className="bcm-btn bcm-btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 6 }} onClick={save} disabled={saving}>
        {saving ? <Loader2 className="spin" style={{ width: 15, height: 15 }} /> : <Check style={{ width: 15, height: 15 }} />} {edit ? 'Save Changes' : 'Create Account'}
      </button>
    </Modal>
  );
};

const TeamModal: React.FC<{ edit?: Team; leaders: Employee[]; onClose: () => void; onSaved: () => void }> = ({ edit, leaders, onClose, onSaved }) => {
  const [form, setForm] = useState({ name: edit?.name || '', description: edit?.description || '', leader_id: edit?.leader?.id || '' });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const save = async () => {
    setSaving(true); setErr('');
    try {
      if (edit) await api.put(`/v1/sales/broker/company/teams/${edit.id}`, { name: form.name, description: form.description, leader_id: form.leader_id || null });
      else await api.post('/v1/sales/broker/company/teams', { name: form.name, description: form.description, leader_id: form.leader_id || null });
      onSaved();
    } catch (e: any) { setErr(e.response?.data?.message || 'Failed to save.'); } finally { setSaving(false); }
  };
  return (
    <Modal title={edit ? 'Edit Team' : 'Create Team'} onClose={onClose}>
      {err && <div style={{ background: 'rgba(220,38,38,.06)', color: C.red, padding: '8px 12px', borderRadius: 8, fontSize: '.78rem', marginBottom: 12 }}>{err}</div>}
      <Field label="Team Name"><input className="bcm-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></Field>
      <Field label="Description"><textarea className="bcm-input" rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></Field>
      <Field label="Team Leader">
        <select className="bcm-input" value={form.leader_id} onChange={e => setForm({ ...form, leader_id: e.target.value })}>
          <option value="">Unassigned</option>
          {leaders.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
        </select>
      </Field>
      <button className="bcm-btn bcm-btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 6 }} onClick={save} disabled={saving}>
        {saving ? <Loader2 className="spin" style={{ width: 15, height: 15 }} /> : <Check style={{ width: 15, height: 15 }} />} {edit ? 'Save Changes' : 'Create Team'}
      </button>
    </Modal>
  );
};

const CredentialsModal: React.FC<{ creds: { email: string; password: string }; onClose: () => void }> = ({ creds, onClose }) => {
  const [copied, setCopied] = useState(false);
  const copy = () => { navigator.clipboard.writeText(`Email: ${creds.email}\nPassword: ${creds.password}`); setCopied(true); setTimeout(() => setCopied(false), 1500); };
  return (
    <Modal title="Login Credentials" onClose={onClose}>
      <p style={{ fontSize: '.82rem', color: C.muted, marginTop: 0 }}>Share these credentials with the employee. The password won't be shown again.</p>
      <div style={{ background: C.bg, borderRadius: 12, padding: 16, fontSize: '.85rem' }}>
        <div style={{ marginBottom: 8 }}><b>Email:</b> {creds.email}</div>
        <div><b>Password:</b> <code style={{ background: '#fff', padding: '2px 8px', borderRadius: 6, border: `1px solid ${C.border}` }}>{creds.password}</code></div>
      </div>
      <button className="bcm-btn bcm-btn-ghost" style={{ width: '100%', justifyContent: 'center', marginTop: 14 }} onClick={copy}>
        {copied ? <Check style={{ width: 15, height: 15 }} /> : <Copy style={{ width: 15, height: 15 }} />} {copied ? 'Copied!' : 'Copy credentials'}
      </button>
    </Modal>
  );
};

const EmployeeDetailModal: React.FC<{ detail: any; onClose: () => void }> = ({ detail, onClose }) => {
  const e = detail.employee;
  return (
    <Modal title={e.name} onClose={onClose} wide>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(120px,1fr))', gap: 10, marginBottom: 18 }}>
        {[['Leads', e.stats.total_leads], ['Reservations', e.stats.reservations], ['Closed', e.stats.closed_sales], ['Calls', e.stats.calls], ['Meetings', e.stats.meetings], ['Presentations', e.stats.presentations]].map(([l, v]) => (
          <div key={l} style={{ background: C.bg, borderRadius: 10, padding: '10px', textAlign: 'center' }}>
            <div style={{ fontSize: '1.3rem', fontWeight: 800 }}>{v as number}</div>
            <div style={{ fontSize: '.62rem', color: C.muted, textTransform: 'uppercase', fontWeight: 700 }}>{l}</div>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: '.8rem', color: C.muted, marginBottom: 18 }}>
        <span>📧 {e.email}</span><span>📱 {e.phone || '—'}</span><span>👥 {e.team?.name || 'No team'}</span>
        <span>💰 {fmtMoney(e.stats.commission_earned)}</span>{e.referral_code && <span>🔗 {e.referral_code}</span>}
      </div>
      <h4 style={{ fontSize: '.8rem', textTransform: 'uppercase', color: C.muted, letterSpacing: '.05em' }}>Recent Leads</h4>
      <div style={{ maxHeight: 200, overflow: 'auto' }}>
        {(detail.recent_leads || []).map((l: any) => (
          <div key={l.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: `1px solid ${C.border}`, fontSize: '.82rem' }}>
            <span>{l.first_name} {l.last_name} · {l.phone}</span>
            <span style={{ color: C.muted }}>{l.status}</span>
          </div>
        ))}
        {(!detail.recent_leads || detail.recent_leads.length === 0) && <p style={{ color: C.muted, fontSize: '.8rem' }}>No leads yet.</p>}
      </div>
    </Modal>
  );
};

const ProjectsPanel: React.FC<{ projects: any; isOwner: boolean; onRequest: (ids: string[]) => void }> = ({ projects, isOwner, onRequest }) => {
  const [selected, setSelected] = useState<string[]>([]);
  const toggle = (id: string) => setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
  const Section: React.FC<{ title: string; items: ProjectLink[]; color: string }> = ({ title, items, color }) => (
    <div style={{ marginBottom: 20 }}>
      <h3 style={{ fontSize: '.85rem', fontWeight: 800, marginBottom: 10 }}>{title} <span style={{ color: C.muted, fontWeight: 600 }}>({items.length})</span></h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: 10 }}>
        {items.map(l => (
          <div key={l.id} className="bcm-card" style={{ padding: 14, borderLeft: `4px solid ${color}` }}>
            <div style={{ fontWeight: 700 }}>{l.project?.name}</div>
            <div style={{ fontSize: '.74rem', color: C.muted }}>{l.project?.location}</div>
          </div>
        ))}
        {items.length === 0 && <div style={{ color: C.muted, fontSize: '.8rem' }}>None.</div>}
      </div>
    </div>
  );
  return (
    <div>
      <Section title="✅ Assigned (Responsible)" items={projects.assigned} color={C.green} />
      <Section title="⏳ Pending Requests" items={projects.requested} color={C.amber} />
      {projects.rejected.length > 0 && <Section title="❌ Rejected" items={projects.rejected} color={C.red} />}

      {isOwner && projects.available.length > 0 && (
        <div className="bcm-card" style={{ padding: 18, marginTop: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3 style={{ margin: 0, fontSize: '.9rem', fontWeight: 800 }}>Request access to projects</h3>
            <button className="bcm-btn bcm-btn-primary" disabled={selected.length === 0} style={{ opacity: selected.length ? 1 : .5 }} onClick={() => { onRequest(selected); setSelected([]); }}>
              <Send style={{ width: 14, height: 14 }} /> Request {selected.length || ''}
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 8 }}>
            {projects.available.map((p: ProjectLite) => (
              <label key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', border: `1px solid ${selected.includes(p.id) ? C.primary : C.border}`, borderRadius: 10, cursor: 'pointer', background: selected.includes(p.id) ? 'rgba(0,61,166,.04)' : '#fff' }}>
                <input type="checkbox" checked={selected.includes(p.id)} onChange={() => toggle(p.id)} />
                <div><div style={{ fontSize: '.82rem', fontWeight: 600 }}>{p.name}</div><div style={{ fontSize: '.7rem', color: C.muted }}>{p.location}</div></div>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default BrokerCompanyManagement;
