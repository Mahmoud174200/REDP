import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import {
  FileText, Briefcase, Calendar, CheckSquare, Plus, Edit3, Search,
  Check, X, Info, Download, Trash2, ArrowRight, User, ShieldAlert
} from 'lucide-react';

interface Party {
  id?: string; name: string; type: string; role: string; phone?: string; email?: string; address?: string;
}
interface CourtSession {
  id: string; session_date: string; hall_number: string | null; judge_name: string | null; notes: string | null; status: string; postponed_to?: string | null; creator?: any;
}
interface LegalDoc {
  id: string; name: string; document_type: string; file_url: string; uploader?: any; created_at: string;
}
interface LegalAct {
  id: string; action_type: string; due_date: string | null; completed_at: string | null; notes: string | null; assignee?: any;
}
interface LegalCase {
  id: string; case_number: string; title: string; type: string; status: string; priority: string;
  jurisdiction: string | null; court_name: string | null; description: string | null;
  claim_amount: number | null; legal_fees: number | null; opened_at: string; closed_at: string | null;
  lawyer?: any; company?: any; parties: Party[]; court_sessions: CourtSession[]; documents: LegalDoc[]; actions: LegalAct[];
}

type Tab = 'dashboard' | 'catalog' | 'register';

const tabs: { key: Tab; label: string; icon: any }[] = [
  { key: 'dashboard', label: 'Overview Dashboard', icon: Briefcase },
  { key: 'catalog', label: 'Cases Archive', icon: FileText },
  { key: 'register', label: 'Register New Case', icon: Plus },
];

const Modal: React.FC<{ open: boolean; title: string; onClose: () => void; children: React.ReactNode }> = ({ open, title, onClose, children }) => {
  if (!open) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(4px)' }} onClick={onClose}>
      <div className="glass-panel" style={{ width: '95%', maxWidth: 650, maxHeight: '85vh', overflowY: 'auto', padding: 32, borderRadius: 'var(--radius-lg)' }} onClick={e => e.stopPropagation()}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: 20, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <ShieldAlert size={18} color="var(--color-primary)" />
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

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-md)',
  border: '1px solid var(--border-glass)', background: 'rgba(255,255,255,0.6)',
  fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-main)', outline: 'none',
  boxSizing: 'border-box',
};

const LegalManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  // Data states
  const [cases, setCases] = useState<LegalCase[]>([]);
  const [dashboardData, setDashboardData] = useState<any>({ stats: {}, upcoming_sessions: [] });
  const [lawyersList, setLawyersList] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);

  // Selection states
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [caseDetail, setCaseDetail] = useState<LegalCase | null>(null);

  // Modals
  const [sessionModalOpen, setSessionModalOpen] = useState(false);
  const [sessionForm, setSessionForm] = useState<any>({});

  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [actionForm, setActionForm] = useState<any>({});

  const [documentModalOpen, setDocumentModalOpen] = useState(false);
  const [documentForm, setDocumentForm] = useState<any>({});

  // Register Form State
  const [registerForm, setRegisterForm] = useState<any>({
    title: '', type: 'litigation', status: 'open', priority: 'medium',
    claim_amount: '', legal_fees: '', court_name: '', opened_at: new Date().toISOString().split('T')[0],
    parties: []
  });

  useEffect(() => {
    loadBaseData();
  }, []);

  const loadBaseData = async () => {
    setLoading(true);
    try {
      const [dashRes, casesRes, usersRes, compRes] = await Promise.all([
        api.get('/v1/enterprise/legal/dashboard'),
        api.get('/v1/enterprise/legal/cases'),
        api.get('/v1/admin/users'),
        api.get('/v1/enterprise/companies'),
      ]);

      setDashboardData(dashRes.data || { stats: {}, upcoming_sessions: [] });
      setCases(casesRes.data?.data || []);
      setCompanies(compRes.data?.data || []);
      
      // Filter lawyers/legal advisors
      const users = usersRes.data?.data || [];
      const lawyers = users.filter((u: any) => u.role === 'admin' || u.role === 'legal_officer' || u.role === 'company_sales');
      setLawyersList(lawyers);
    } catch (err) {
      console.error('Error loading legal base data:', err);
    }
    setLoading(false);
  };

  const loadCaseDetail = async (id: string) => {
    try {
      const res = await api.get(`/v1/enterprise/legal/cases/${id}`);
      setCaseDetail(res.data?.data || null);
      setSelectedCaseId(id);
    } catch (err) {
      console.error('Error loading case detail:', err);
    }
  };

  const handleRegisterSave = async () => {
    try {
      await api.post('/v1/enterprise/legal/cases', registerForm);
      alert('Legal case registered successfully!');
      setRegisterForm({
        title: '', type: 'litigation', status: 'open', priority: 'medium',
        claim_amount: '', legal_fees: '', court_name: '', opened_at: new Date().toISOString().split('T')[0],
        parties: []
      });
      loadBaseData();
      setActiveTab('catalog');
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Error registering case');
    }
  };

  const addPartyToRegisterForm = () => {
    setRegisterForm((p: any) => ({
      ...p,
      parties: [...p.parties, { name: '', type: 'plaintiff', role: 'external', phone: '', email: '', address: '' }]
    }));
  };

  const removePartyFromRegisterForm = (idx: number) => {
    setRegisterForm((p: any) => ({
      ...p,
      parties: p.parties.filter((_: any, i: number) => i !== idx)
    }));
  };

  const updatePartyField = (idx: number, key: string, val: any) => {
    setRegisterForm((prev: any) => {
      const parties = [...prev.parties];
      parties[idx] = { ...parties[idx], [key]: val };
      return { ...prev, parties };
    });
  };

  // Add Court Session
  const saveSession = async () => {
    if (!selectedCaseId) return;
    try {
      await api.post(`/v1/enterprise/legal/cases/${selectedCaseId}/sessions`, sessionForm);
      setSessionModalOpen(false);
      loadCaseDetail(selectedCaseId);
      loadBaseData();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Error scheduling session');
    }
  };

  // Add Action/Deadline
  const saveAction = async () => {
    if (!selectedCaseId) return;
    try {
      await api.post(`/v1/enterprise/legal/cases/${selectedCaseId}/actions`, actionForm);
      setActionModalOpen(false);
      loadCaseDetail(selectedCaseId);
      loadBaseData();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Error creating action');
    }
  };

  // Complete Action
  const completeAction = async (actionId: string) => {
    if (!selectedCaseId) return;
    try {
      await api.put(`/v1/enterprise/legal/cases/${selectedCaseId}/actions/${actionId}/complete`);
      loadCaseDetail(selectedCaseId);
      loadBaseData();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Error completing action');
    }
  };

  // Add Document
  const saveDocument = async () => {
    if (!selectedCaseId) return;
    try {
      await api.post(`/v1/enterprise/legal/cases/${selectedCaseId}/documents`, documentForm);
      setDocumentModalOpen(false);
      loadCaseDetail(selectedCaseId);
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Error uploading document');
    }
  };

  // Styling helpers
  const cellStyle: React.CSSProperties = { padding: '12px 16px', fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-main)', borderBottom: '1px solid var(--border-glass)' };
  const headerStyle: React.CSSProperties = { ...cellStyle, fontWeight: 800, fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.06em', background: 'rgba(255,255,255,0.4)' };
  const badge = (text: string, color: string) => (
    <span style={{ padding: '3px 10px', borderRadius: 9999, fontSize: '0.68rem', fontWeight: 700, background: `${color}18`, color, textTransform: 'capitalize' }}>{text}</span>
  );

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 10 }}>
          <FileText size={24} color="var(--color-primary)" />
          ⚖️ Legal Disputes & Litigation
        </h1>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>
          Manage compound lawsuits, customer disputes, scheduled court sessions, legal documents, and lawyer assignments
        </p>
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

      {/* Content Body */}
      <div className="glass-panel" style={{ padding: 24, borderRadius: 'var(--radius-lg)' }}>
        {loading && <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Loading...</div>}

        {!loading && activeTab === 'dashboard' && (
          <div>
            {/* Stats Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 24 }}>
              <div className="glass-panel" style={{ padding: '16px 20px', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: '1.4rem', fontWeight: 800 }}>{dashboardData.stats?.active_cases || 0}</div>
                <div style={{ fontSize: '0.68rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Active Cases</div>
              </div>
              <div className="glass-panel" style={{ padding: '16px 20px', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: '1.4rem', fontWeight: 800 }}>{Number(dashboardData.stats?.total_claim_amount || 0).toLocaleString()} EGP</div>
                <div style={{ fontSize: '0.68rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Dispute Claims</div>
              </div>
              <div className="glass-panel" style={{ padding: '16px 20px', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: '1.4rem', fontWeight: 800 }}>{dashboardData.stats?.upcoming_hearings || 0}</div>
                <div style={{ fontSize: '0.68rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Upcoming Hearings (30d)</div>
              </div>
              <div className="glass-panel" style={{ padding: '16px 20px', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: '1.4rem', fontWeight: 800 }}>{dashboardData.stats?.pending_deadlines || 0}</div>
                <div style={{ fontSize: '0.68rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Pending Tasks & Deadlines</div>
              </div>
            </div>

            {/* Upcoming Hearings */}
            <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: 14 }}>Upcoming Court Hearings Schedule</h3>
            {dashboardData.upcoming_sessions?.length === 0 ? (
              <div style={{ padding: 30, textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>No hearings scheduled in the next 30 days.</div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={headerStyle}>Session Date</th>
                    <th style={headerStyle}>Case Title</th>
                    <th style={headerStyle}>Court / Hall</th>
                    <th style={headerStyle}>Judge</th>
                    <th style={headerStyle}>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboardData.upcoming_sessions?.map((s: any) => (
                    <tr key={s.id}>
                      <td style={cellStyle}><strong>{new Date(s.session_date).toLocaleString()}</strong></td>
                      <td style={cellStyle}><strong>{s.case?.title}</strong><div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{s.case?.case_number}</div></td>
                      <td style={cellStyle}>{s.case?.court_name || '—'} {s.hall_number && `(Hall ${s.hall_number})`}</td>
                      <td style={cellStyle}>{s.judge_name || '—'}</td>
                      <td style={cellStyle}><span style={{ fontStyle: 'italic', fontSize: '0.75rem' }}>{s.notes || '—'}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {!loading && activeTab === 'catalog' && (
          <div style={{ display: 'grid', gridTemplateColumns: selectedCaseId ? '1.2fr 2fr' : '1fr', gap: 20 }}>
            {/* Cases list */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <Search size={16} color="var(--text-muted)" />
                <input
                  style={{ ...inputStyle, border: 'none', background: 'transparent' }}
                  placeholder="Search case title or number..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {cases.filter(c => !search || c.title.toLowerCase().includes(search.toLowerCase()) || c.case_number.toLowerCase().includes(search.toLowerCase())).map(c => {
                  const isActive = selectedCaseId === c.id;
                  return (
                    <div 
                      key={c.id} 
                      onClick={() => loadCaseDetail(c.id)}
                      className="glass-panel" 
                      style={{ 
                        padding: 16, borderRadius: 'var(--radius-md)', cursor: 'pointer',
                        border: isActive ? '1px solid var(--color-primary)' : '1px solid var(--border-glass)',
                        background: isActive ? 'rgba(59,130,246,0.06)' : 'rgba(255,255,255,0.4)',
                        transition: 'all 0.2s'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{c.case_number}</span>
                        {badge(c.status, c.status === 'open' ? '#3b82f6' : c.status === 'resolved' ? '#10b981' : '#6b7280')}
                      </div>
                      <h4 style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: 6 }}>{c.title}</h4>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        <span>Type: {c.type}</span>
                        <span>Opened: {new Date(c.opened_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Case Details View */}
            {selectedCaseId && caseDetail && (
              <div className="glass-panel" style={{ padding: 20, borderRadius: 'var(--radius-md)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border-glass)', paddingBottom: 12, marginBottom: 16 }}>
                  <div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{caseDetail.case_number}</span>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)' }}>{caseDetail.title}</h3>
                  </div>
                  <button className="btn-ghost" onClick={() => setSelectedCaseId(null)}><X size={16} /></button>
                </div>

                {/* Case Info Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, fontSize: '0.78rem', marginBottom: 20 }}>
                  <div><strong>Court:</strong> {caseDetail.court_name || '—'}</div>
                  <div><strong>Jurisdiction:</strong> {caseDetail.jurisdiction || '—'}</div>
                  <div><strong>Dispute Amount:</strong> {caseDetail.claim_amount ? `${Number(caseDetail.claim_amount).toLocaleString()} EGP` : '—'}</div>
                  <div><strong>Legal Fees:</strong> {caseDetail.legal_fees ? `${Number(caseDetail.legal_fees).toLocaleString()} EGP` : '—'}</div>
                  <div><strong>Assigned Advisor:</strong> {caseDetail.lawyer?.name || '—'}</div>
                  <div><strong>Opened On:</strong> {new Date(caseDetail.opened_at).toLocaleDateString()}</div>
                </div>

                {/* Case Description */}
                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 4 }}>Case Summary</label>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-main)', margin: 0, padding: 10, background: 'rgba(0,0,0,0.02)', borderRadius: 6 }}>
                    {caseDetail.description || 'No summary details added yet.'}
                  </p>
                </div>

                {/* Parties list */}
                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 6 }}>Parties Involved</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {caseDetail.parties?.map((p, idx) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 10px', background: 'rgba(255,255,255,0.4)', borderRadius: 6, fontSize: '0.78rem' }}>
                        <div>
                          <strong>{p.name}</strong> 
                          <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginLeft: 6 }}>({p.type} - {p.role})</span>
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{p.phone || p.email}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Tabs for Sub-elements: hearings, actions, documents */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, borderBottom: '1px solid var(--border-glass)', pb: 10, mb: 14 }}>
                  <div style={{ padding: 8, textAlign: 'center', fontSize: '0.8rem', fontWeight: 800, borderBottom: '2px solid var(--color-primary)' }}>Hearings & Sessions</div>
                </div>

                {/* hearings */}
                <div style={{ marginBottom: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 10 }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 800 }}>Court Sessions History</span>
                    <button className="btn-secondary" onClick={() => { setSessionForm({ session_date: '' }); setSessionModalOpen(true); }} style={{ fontSize: '0.65rem', padding: '4px 8px' }}>
                      Schedule Hearing
                    </button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {caseDetail.court_sessions?.length === 0 ? (
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', padding: 10 }}>No hearing sessions scheduled.</div>
                    ) : (
                      caseDetail.court_sessions.map(s => (
                        <div key={s.id} style={{ padding: 10, background: 'rgba(255,255,255,0.4)', borderRadius: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <div style={{ fontSize: '0.78rem', fontWeight: 700 }}>{new Date(s.session_date).toLocaleString()}</div>
                            {s.notes && <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Notes: {s.notes}</div>}
                          </div>
                          {badge(s.status, s.status === 'scheduled' ? '#3b82f6' : '#10b981')}
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* legal actions/deadlines */}
                <div style={{ marginBottom: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 10 }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 800 }}>Assigned Deadlines & Actions</span>
                    <button className="btn-secondary" onClick={() => { setActionForm({ action_type: '', due_date: '', notes: '', assigned_to: lawyersList[0]?.id }); setActionModalOpen(true); }} style={{ fontSize: '0.65rem', padding: '4px 8px' }}>
                      Assign Task
                    </button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {caseDetail.actions?.length === 0 ? (
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', padding: 10 }}>No actions assigned yet.</div>
                    ) : (
                      caseDetail.actions.map(act => (
                        <div key={act.id} style={{ padding: 10, background: 'rgba(255,255,255,0.4)', borderRadius: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <div style={{ fontSize: '0.78rem', fontWeight: 700 }}>{act.action_type}</div>
                            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Due: {act.due_date ? new Date(act.due_date).toLocaleDateString() : 'No limit'}</div>
                          </div>
                          {act.completed_at ? (
                            badge('completed', '#10b981')
                          ) : (
                            <button className="btn-ghost" onClick={() => completeAction(act.id)} style={{ fontSize: '0.68rem', padding: '3px 6px', background: 'rgba(0,0,0,0.03)' }}>
                              Complete
                            </button>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* documents vault */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 10 }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 800 }}>Documents Vault</span>
                    <button className="btn-secondary" onClick={() => { setDocumentForm({ name: '', document_type: 'judgment', file_url: 'https://redp-legal.s3.amazonaws.com/files/judgment_brief.pdf' }); setDocumentModalOpen(true); }} style={{ fontSize: '0.65rem', padding: '4px 8px' }}>
                      Add Document
                    </button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {caseDetail.documents?.length === 0 ? (
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', padding: 10 }}>No files uploaded yet.</div>
                    ) : (
                      caseDetail.documents.map(d => (
                        <div key={d.id} style={{ padding: 8, background: 'rgba(255,255,255,0.4)', borderRadius: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem' }}>
                          <div>
                            <strong>{d.name}</strong> 
                            <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginLeft: 6 }}>({d.document_type})</span>
                          </div>
                          <a href={d.file_url} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 700 }}>
                            <Download size={12} /> Get
                          </a>
                        </div>
                      ))
                    )}
                  </div>
                </div>

              </div>
            )}
          </div>
        )}

        {!loading && activeTab === 'register' && (
          <div style={{ maxWidth: 650, margin: '0 auto' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: 16 }}>Register New Dispute / Lawsuit Entry</h3>
            
            <Field label="Case Title / Subject"><input style={inputStyle} value={registerForm.title} onChange={e => setRegisterForm((p: any) => ({ ...p, title: e.target.value }))} placeholder="e.g. Failure to comply with construction specs - Unit 102" /></Field>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Field label="Case Type">
                <select style={inputStyle} value={registerForm.type} onChange={e => setRegisterForm((p: any) => ({ ...p, type: e.target.value }))}>
                  <option value="litigation">Litigation (Court Lawsuit)</option>
                  <option value="arbitration">Arbitration</option>
                  <option value="dispute">Informal Dispute</option>
                  <option value="consultation">Legal Consultation</option>
                </select>
              </Field>
              <Field label="Priority">
                <select style={inputStyle} value={registerForm.priority} onChange={e => setRegisterForm((p: any) => ({ ...p, priority: e.target.value }))}>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical / Emergency</option>
                </select>
              </Field>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Field label="Disputed Claim Amount (EGP)"><input style={inputStyle} type="number" value={registerForm.claim_amount} onChange={e => setRegisterForm((p: any) => ({ ...p, claim_amount: e.target.value }))} /></Field>
              <Field label="Reserved Legal Fees (EGP)"><input style={inputStyle} type="number" value={registerForm.legal_fees} onChange={e => setRegisterForm((p: any) => ({ ...p, legal_fees: e.target.value }))} /></Field>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>
              <Field label="Court Name / Location"><input style={inputStyle} value={registerForm.court_name || ''} onChange={e => setRegisterForm((p: any) => ({ ...p, court_name: e.target.value }))} placeholder="New Cairo Civil Court" /></Field>
              <Field label="Opened Date"><input style={inputStyle} type="date" value={registerForm.opened_at} onChange={e => setRegisterForm((p: any) => ({ ...p, opened_at: e.target.value }))} /></Field>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Field label="Assigned Legal Officer / Lawyer">
                <select style={inputStyle} value={registerForm.assigned_lawyer_id || ''} onChange={e => setRegisterForm((p: any) => ({ ...p, assigned_lawyer_id: e.target.value || null }))}>
                  <option value="">-- Unassigned --</option>
                  {lawyersList.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </Field>
              <Field label="Tenant Company Specific">
                <select style={inputStyle} value={registerForm.company_id || ''} onChange={e => setRegisterForm((p: any) => ({ ...p, company_id: e.target.value || null }))}>
                  <option value="">-- Global --</option>
                  {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </Field>
            </div>

            <Field label="Detailed Description / Legal Merits"><textarea style={{ ...inputStyle, minHeight: 80 }} value={registerForm.description || ''} onChange={e => setRegisterForm((p: any) => ({ ...p, description: e.target.value }))} placeholder="Provide lawsuit merits, claim details, contract number reference, etc..." /></Field>

            {/* Dynamic Parties */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Parties & Witnesses</span>
                <button className="btn-secondary" onClick={addPartyToRegisterForm} style={{ fontSize: '0.65rem', padding: '4px 8px' }} type="button">
                  Add Party
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {registerForm.parties.map((party: Party, pIdx: number) => (
                  <div key={pIdx} style={{ background: 'rgba(0,0,0,0.02)', padding: 12, borderRadius: 6, border: '1px solid var(--border-glass)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 8 }}>
                      <span style={{ fontSize: '0.7rem', fontWeight: 800 }}>Party #{pIdx + 1}</span>
                      <button className="btn-ghost" onClick={() => removePartyFromRegisterForm(pIdx)} type="button"><X size={12} /></button>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr 1fr', gap: 8, mb: 8 }}>
                      <input style={{ ...inputStyle, padding: '6px 10px', fontSize: '0.75rem' }} value={party.name} onChange={e => updatePartyField(pIdx, 'name', e.target.value)} placeholder="Full Name" />
                      <select style={{ ...inputStyle, padding: '6px 10px', fontSize: '0.75rem' }} value={party.type} onChange={e => updatePartyField(pIdx, 'type', e.target.value)}>
                        <option value="plaintiff">Plaintiff (حرك الدعوى)</option>
                        <option value="defendant">Defendant (المدعى عليه)</option>
                        <option value="witness">Witness (شاهد)</option>
                        <option value="expert">Expert Consultant</option>
                      </select>
                      <select style={{ ...inputStyle, padding: '6px 10px', fontSize: '0.75rem' }} value={party.role} onChange={e => updatePartyField(pIdx, 'role', e.target.value)}>
                        <option value="external">External</option>
                        <option value="internal">Internal Team</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button className="btn-primary" onClick={handleRegisterSave} style={{ width: '100%', marginTop: 10 }}>
              Register Lawsuit Case
            </button>
          </div>
        )}
      </div>

      {/* Hearing Session Modal */}
      <Modal open={sessionModalOpen} title="Schedule Court Session / Hearing" onClose={() => setSessionModalOpen(false)}>
        <Field label="Session Date & Time"><input style={inputStyle} type="datetime-local" value={sessionForm.session_date} onChange={e => setSessionForm(p => ({ ...p, session_date: e.target.value }))} /></Field>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Field label="Hall Number"><input style={inputStyle} value={sessionForm.hall_number || ''} onChange={e => setSessionForm(p => ({ ...p, hall_number: e.target.value }))} placeholder="e.g. Hall 4" /></Field>
          <Field label="Judge Name"><input style={inputStyle} value={sessionForm.judge_name || ''} onChange={e => setSessionForm(p => ({ ...p, judge_name: e.target.value }))} /></Field>
        </div>
        <Field label="Hearing Notes / Requests"><textarea style={{ ...inputStyle, minHeight: 60 }} value={sessionForm.notes || ''} onChange={e => setSessionForm(p => ({ ...p, notes: e.target.value }))} /></Field>

        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
          <button className="btn-primary" onClick={saveSession} style={{ flex: 1 }}>Schedule Session</button>
          <button className="btn-secondary" onClick={() => setSessionModalOpen(false)} style={{ flex: 1 }}>Cancel</button>
        </div>
      </Modal>

      {/* Legal Action Modal */}
      <Modal open={actionModalOpen} title="Assign Legal Action / Task Deadline" onClose={() => setActionModalOpen(false)}>
        <Field label="Action Type / Requirement"><input style={inputStyle} value={actionForm.action_type || ''} onChange={e => setActionForm(p => ({ ...p, action_type: e.target.value }))} placeholder="e.g. Submit statement of defense" /></Field>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Field label="Due Date"><input style={inputStyle} type="date" value={actionForm.due_date || ''} onChange={e => setActionForm(p => ({ ...p, due_date: e.target.value }))} /></Field>
          <Field label="Assign To Lawyer">
            <select style={inputStyle} value={actionForm.assigned_to || ''} onChange={e => setActionForm(p => ({ ...p, assigned_to: e.target.value || null }))}>
              {lawyersList.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </Field>
        </div>
        <Field label="Task Notes"><textarea style={{ ...inputStyle, minHeight: 60 }} value={actionForm.notes || ''} onChange={e => setActionForm(p => ({ ...p, notes: e.target.value }))} /></Field>

        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
          <button className="btn-primary" onClick={saveAction} style={{ flex: 1 }}>Assign Action</button>
          <button className="btn-secondary" onClick={() => setActionModalOpen(false)} style={{ flex: 1 }}>Cancel</button>
        </div>
      </Modal>

      {/* Document Modal */}
      <Modal open={documentModalOpen} title="Upload Legal Document / Exhibit Brief" onClose={() => setDocumentModalOpen(false)}>
        <Field label="Document Name"><input style={inputStyle} value={documentForm.name || ''} onChange={e => setDocumentForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Initial Power of Attorney" /></Field>
        <Field label="Document Type"><select style={inputStyle} value={documentForm.document_type || 'judgment'} onChange={e => setDocumentForm(p => ({ ...p, document_type: e.target.value }))}><option value="notice">Official Notice</option><option value="brief">Defense Brief</option><option value="exhibit">Evidence Exhibit</option><option value="judgment">Court Judgment</option></select></Field>
        <Field label="File Attachment Mockup URL"><input style={inputStyle} value={documentForm.file_url || ''} onChange={e => setDocumentForm(p => ({ ...p, file_url: e.target.value }))} /></Field>

        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
          <button className="btn-primary" onClick={saveDocument} style={{ flex: 1 }}>Upload Document</button>
          <button className="btn-secondary" onClick={() => setDocumentModalOpen(false)} style={{ flex: 1 }}>Cancel</button>
        </div>
      </Modal>
    </div>
  );
};

export default LegalManagement;
