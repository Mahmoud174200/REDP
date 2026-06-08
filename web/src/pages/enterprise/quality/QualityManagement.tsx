import React, { useState, useEffect } from 'react';
import api from '../../../services/api';
import {
  ShieldCheck, AlertOctagon, User, Calendar, Plus, RefreshCw, FileText, CheckCircle2, ChevronRight, Activity, Wrench
} from 'lucide-react';

interface Project {
  id: string;
  name: string;
}

interface Milestone {
  id: string;
  title: string;
}

interface SiteInspection {
  id: string;
  project: { name: string };
  milestone?: { title: string };
  inspector: { name: string };
  inspection_date: string;
  comments: string | null;
  status: string;
  ncr_report?: { id: string; severity: string; status: string };
}

interface NcrReport {
  id: string;
  description: string;
  severity: string;
  status: string;
  resolved_at: string | null;
  inspection: {
    project: { name: string };
    milestone?: { title: string };
  };
  assigned_engineer?: { name: string };
  capa_actions?: { action_plan: string; due_date: string; status: string }[];
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-md)',
  border: '1px solid var(--border-glass)', background: 'rgba(255,255,255,0.6)',
  fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-main)', outline: 'none',
  boxSizing: 'border-box',
};

const QualityManagement: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [inspections, setInspections] = useState<SiteInspection[]>([]);
  const [ncrs, setNcrs] = useState<NcrReport[]>([]);
  const [loading, setLoading] = useState(false);

  // New Inspection Form
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [selectedMilestoneId, setSelectedMilestoneId] = useState('');
  const [inspectionStatus, setInspectionStatus] = useState('passed');
  const [comments, setComments] = useState('');
  const [ncrDesc, setNcrDesc] = useState('');
  const [ncrSeverity, setNcrSeverity] = useState('medium');
  const [showAddForm, setShowAddForm] = useState(false);
  const [submittingInspection, setSubmittingInspection] = useState(false);

  // New CAPA Form
  const [selectedNcrId, setSelectedNcrId] = useState('');
  const [capaPlan, setCapaPlan] = useState('');
  const [capaDueDate, setCapaDueDate] = useState('');
  const [showCapaForm, setShowCapaForm] = useState(false);
  const [submittingCapa, setSubmittingCapa] = useState(false);

  useEffect(() => {
    loadProjects();
    loadInspections();
    loadNcrs();
  }, []);

  useEffect(() => {
    if (selectedProjectId) {
      loadMilestones();
    } else {
      setMilestones([]);
    }
  }, [selectedProjectId]);

  const loadProjects = async () => {
    try {
      const res = await api.get('/v1/admin/projects');
      setProjects(res.data?.data || []);
      if (res.data?.data?.length > 0) {
        setSelectedProjectId(res.data.data[0].id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadMilestones = async () => {
    try {
      const res = await api.get('/v1/enterprise/construction/milestones', {
        params: { project_id: selectedProjectId }
      });
      setMilestones(res.data?.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const loadInspections = async () => {
    setLoading(true);
    try {
      const res = await api.get('/v1/enterprise/quality/inspections');
      setInspections(res.data?.data || []);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const loadNcrs = async () => {
    try {
      const res = await api.get('/v1/enterprise/quality/ncrs');
      setNcrs(res.data?.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateInspection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjectId) return;

    setSubmittingInspection(true);
    try {
      await api.post('/v1/enterprise/quality/inspections', {
        project_id: selectedProjectId,
        milestone_id: selectedMilestoneId || null,
        inspection_date: new Date().toISOString().split('T')[0],
        status: inspectionStatus,
        comments: comments,
        ncr_description: ncrDesc,
        ncr_severity: ncrSeverity
      });

      alert('Quality Site Inspection report recorded.');
      setComments('');
      setNcrDesc('');
      setShowAddForm(false);
      loadInspections();
      loadNcrs();
    } catch (err) {
      console.error(err);
      alert('Error recording inspection.');
    }
    setSubmittingInspection(false);
  };

  const handleResolveNcr = async (ncrId: string) => {
    if (!window.confirm('Mark this engineering defect as resolved?')) return;
    try {
      await api.post(`/v1/enterprise/quality/ncrs/${ncrId}/resolve`);
      alert('NCR defect resolved and milestone marked as passed!');
      loadInspections();
      loadNcrs();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateCapa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedNcrId || !capaPlan || !capaDueDate) return;

    setSubmittingCapa(true);
    try {
      await api.post('/v1/enterprise/quality/capa', {
        ncr_id: selectedNcrId,
        action_plan: capaPlan,
        due_date: capaDueDate
      });
      alert('CAPA Preventive action plan registered.');
      setCapaPlan('');
      setCapaDueDate('');
      setShowCapaForm(false);
      loadNcrs();
    } catch (err) {
      console.error(err);
      alert('Error creating CAPA.');
    }
    setSubmittingCapa(false);
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, React.CSSProperties> = {
      passed: { background: 'rgba(16,185,129,0.1)', color: 'var(--color-success)' },
      failed: { background: 'rgba(239,68,68,0.1)', color: '#ef4444' },
      pending_action: { background: 'rgba(245,158,11,0.1)', color: '#f59e0b' },
      open: { background: 'rgba(239,68,68,0.1)', color: '#ef4444' },
      under_review: { background: 'rgba(245,158,11,0.1)', color: '#f59e0b' },
      resolved: { background: 'rgba(16,185,129,0.1)', color: 'var(--color-success)' }
    };
    return (
      <span style={{ fontSize: '0.68rem', fontWeight: 800, padding: '3px 8px', borderRadius: 99, ...styles[status] }}>
        {status.toUpperCase()}
      </span>
    );
  };

  const getSeverityBadge = (severity: string) => {
    const colors: Record<string, string> = {
      low: '#6b7280',
      medium: '#3b82f6',
      high: '#f59e0b',
      critical: '#ef4444'
    };
    return (
      <span style={{ fontSize: '0.65rem', fontWeight: 800, padding: '2px 6px', borderRadius: 4, background: 'rgba(0,0,0,0.03)', color: colors[severity], border: `1px solid ${colors[severity]}` }}>
        {severity.toUpperCase()}
      </span>
    );
  };

  const cellStyle: React.CSSProperties = { padding: '10px 14px', fontSize: '0.78rem', fontWeight: 500, color: 'var(--text-main)', borderBottom: '1px solid var(--border-glass)' };
  const headerStyle: React.CSSProperties = { ...cellStyle, fontWeight: 800, fontSize: '0.68rem', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.06em', background: 'rgba(255,255,255,0.4)' };

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 10 }}>
            <ShieldCheck size={26} color="var(--color-primary)" />
            🛡 Quality Management & Defect Inspections
          </h1>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>
            Log site quality control inspection results, monitor Non-Conformance Reports (NCR) defect tickets, and plan Corrective actions (CAPA).
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn-secondary" onClick={() => setShowCapaForm(!showCapaForm)} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Wrench size={14} /> CAPA Planner
          </button>
          <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 4 }} onClick={() => setShowAddForm(!showAddForm)}>
            <Plus size={14} /> Log Inspection
          </button>
        </div>
      </div>

      {/* Forms Grid */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginBottom: 20 }}>
        {/* Log Inspection Form */}
        {showAddForm && (
          <div className="glass-panel" style={{ padding: 24, borderRadius: 'var(--radius-lg)' }}>
            <h3 style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: 14 }}>Record Quality Inspection</h3>
            <form onSubmit={handleCreateInspection} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>PROJECT</label>
                  <select style={inputStyle} value={selectedProjectId} onChange={e => setSelectedProjectId(e.target.value)}>
                    {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>MILESTONE (OPTIONAL)</label>
                  <select style={inputStyle} value={selectedMilestoneId} onChange={e => setSelectedMilestoneId(e.target.value)}>
                    <option value="">-- No Milestone --</option>
                    {milestones.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>INSPECTION OUTCOME</label>
                  <select style={inputStyle} value={inspectionStatus} onChange={e => setInspectionStatus(e.target.value)}>
                    <option value="passed">Passed</option>
                    <option value="failed">Failed (Issues NCR)</option>
                    <option value="pending_action">Pending Action</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>INSPECTOR REMARKS / COMMENTS</label>
                <textarea style={inputStyle} rows={2} value={comments} onChange={e => setComments(e.target.value)} />
              </div>

              {/* If inspection failed, show NCR section */}
              {inspectionStatus === 'failed' && (
                <div style={{ border: '1px solid #ef4444', borderRadius: 'var(--radius-md)', padding: 16, background: 'rgba(239,68,68,0.02)', display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#ef4444', display: 'flex', alignItems: 'center', gap: 4 }}><AlertOctagon size={12} /> NON-CONFORMANCE REPORT (NCR) DETAILS</span>
                  <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr', gap: 12 }}>
                    <div>
                      <label style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>DEFECT SPECIFICATIONS / REMEDY REQUIRED</label>
                      <input style={inputStyle} placeholder="e.g. Concrete slab has micro fractures..." value={ncrDesc} onChange={e => setNcrDesc(e.target.value)} />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>SEVERITY</label>
                      <select style={inputStyle} value={ncrSeverity} onChange={e => setNcrSeverity(e.target.value)}>
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="critical">Critical</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button type="button" className="btn-secondary" onClick={() => setShowAddForm(false)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={submittingInspection}>
                  {submittingInspection ? 'Saving...' : 'Record Visit'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* CAPA Action Planner Form */}
        {showCapaForm && (
          <div className="glass-panel" style={{ padding: 24, borderRadius: 'var(--radius-lg)' }}>
            <h3 style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: 14 }}>Record CAPA Corrective Action</h3>
            <form onSubmit={handleCreateCapa} style={{ display: 'grid', gridTemplateColumns: '2.5fr 1fr 1fr auto', gap: 12, alignItems: 'flex-end' }}>
              <div>
                <label style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>LINKED NCR DEFECT TICKET</label>
                <select style={inputStyle} value={selectedNcrId} onChange={e => setSelectedNcrId(e.target.value)}>
                  <option value="">-- Select defect ticket --</option>
                  {ncrs.filter(n => n.status !== 'resolved').map(n => (
                    <option key={n.id} value={n.id}>{n.description.substring(0, 40)}...</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>CORRECTIVE ACTION PLAN</label>
                <input style={inputStyle} placeholder="e.g. Apply epoxy resin seal..." value={capaPlan} onChange={e => setCapaPlan(e.target.value)} />
              </div>
              <div>
                <label style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>TARGET DUE DATE</label>
                <input style={inputStyle} type="date" value={capaDueDate} onChange={e => setCapaDueDate(e.target.value)} />
              </div>
              <button type="submit" className="btn-primary" style={{ height: 38 }} disabled={submittingCapa}>
                {submittingCapa ? 'Saving...' : 'Assign'}
              </button>
            </form>
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 24 }}>
        {/* LEFT COLUMN: site quality visits logs */}
        <div className="glass-panel" style={{ padding: 20, borderRadius: 'var(--radius-lg)' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Activity size={16} color="var(--color-primary)" /> Site Inspections Log
          </h3>

          {loading ? (
            <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)' }}>Loading visits...</div>
          ) : inspections.length === 0 ? (
            <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)' }}>No inspection logs found. Record a visit to seed details.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {inspections.map(i => (
                <div key={i.id} style={{ padding: 14, borderRadius: 'var(--radius-md)', border: '1px solid var(--border-glass)', background: 'rgba(255,255,255,0.4)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <strong style={{ fontSize: '0.85rem' }}>{i.project.name}</strong>
                      {getStatusBadge(i.status)}
                    </div>
                    {i.milestone && (
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginTop: 2 }}>
                        Milestone: {i.milestone.title}
                      </span>
                    )}
                    <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'block', marginTop: 2 }}>
                      Inspector: {i.inspector.name} | Date: {new Date(i.inspection_date).toLocaleDateString()}
                    </span>
                    {i.comments && (
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-main)', marginTop: 8, fontStyle: 'italic' }}>
                        "{i.comments}"
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: NCR Defect tickets */}
        <div className="glass-panel" style={{ padding: 20, borderRadius: 'var(--radius-lg)' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
            <AlertOctagon size={16} color="var(--color-secondary)" /> Non-Conformance Reports (NCR)
          </h3>

          {ncrs.length === 0 ? (
            <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)' }}>No NCR defect tickets issued. Failed visits generate tickets automatically.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {ncrs.map(n => (
                <div key={n.id} style={{ padding: 14, borderRadius: 'var(--radius-md)', border: '1px solid var(--border-glass)', background: 'rgba(255,255,255,0.4)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                    <div>
                      <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>PROJECT: {n.inspection.project.name}</span>
                      <h4 style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-main)', marginTop: 2 }}>{n.description}</h4>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                      {getStatusBadge(n.status)}
                      {getSeverityBadge(n.severity)}
                    </div>
                  </div>

                  {n.capa_actions && n.capa_actions.length > 0 && (
                    <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: 10, marginTop: 10 }}>
                      <span style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>Corrective CAPA action</span>
                      {n.capa_actions.map((act, index) => (
                        <div key={index} style={{ fontSize: '0.75rem', display: 'flex', justifyContent: 'space-between', padding: '3px 0' }}>
                          <span>{act.action_plan}</span>
                          <span style={{ color: 'var(--text-muted)' }}>Due: {new Date(act.due_date).toLocaleDateString()}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-glass)', paddingTop: 10, marginTop: 10 }}>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      Engineer: {n.assigned_engineer?.name || 'Unassigned'}
                    </span>
                    {n.status !== 'resolved' && (
                      <button className="btn-primary" style={{ padding: '3px 10px', fontSize: '0.7rem' }} onClick={() => handleResolveNcr(n.id)}>
                        Mark Resolved
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QualityManagement;
