import React, { useState, useEffect } from 'react';
import api from '../../../services/api';
import {
  TrendingUp, Calendar, FileText, Plus, RefreshCw, Layers, CheckSquare, Hammer, ShieldAlert
} from 'lucide-react';

interface Project {
  id: string;
  name: string;
}

interface Milestone {
  id: string;
  title: string;
  weight: string;
  progress_percentage: string;
  status: string;
  due_date: string;
}

interface BoqItem {
  id: string;
  item_code: string;
  description: string;
  unit: string;
  planned_quantity: string;
  actual_quantity: string;
  unit_price: string;
  total_price: string;
}

interface Phase {
  id: string;
  name: string;
  status: string;
  start_date: string;
  end_date: string;
  progress_percentage: number;
  milestones: Milestone[];
  boq_items: BoqItem[];
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-md)',
  border: '1px solid var(--border-glass)', background: 'rgba(255,255,255,0.6)',
  fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-main)', outline: 'none',
  boxSizing: 'border-box',
};

const ConstructionProgress: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [phases, setPhases] = useState<Phase[]>([]);
  const [loading, setLoading] = useState(false);
  const [updatingMilestoneId, setUpdatingMilestoneId] = useState<string | null>(null);

  // New Phase Form State
  const [newPhaseName, setNewPhaseName] = useState('');
  const [newPhaseStart, setNewPhaseStart] = useState('');
  const [newPhaseEnd, setNewPhaseEnd] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [submittingPhase, setSubmittingPhase] = useState(false);

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    if (selectedProjectId) {
      loadPhases();
    } else {
      setPhases([]);
    }
  }, [selectedProjectId]);

  const loadProjects = async () => {
    try {
      const res = await api.get('/v1/admin/projects');
      const list = res.data?.data || [];
      setProjects(list);
      if (list.length > 0) {
        setSelectedProjectId(list[0].id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadPhases = async () => {
    setLoading(true);
    try {
      const res = await api.get('/v1/enterprise/construction/phases', {
        params: { project_id: selectedProjectId }
      });
      setPhases(res.data?.data || []);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handleUpdateProgress = async (milestoneId: string, value: number) => {
    setUpdatingMilestoneId(milestoneId);
    try {
      await api.put(`/v1/enterprise/construction/milestones/${milestoneId}/progress`, {
        progress_percentage: value
      });
      // reload phases
      loadPhases();
    } catch (err) {
      console.error(err);
    }
    setUpdatingMilestoneId(null);
  };

  const handleCreatePhase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPhaseName || !newPhaseStart || !newPhaseEnd) return;

    setSubmittingPhase(true);
    try {
      await api.post('/v1/enterprise/construction/phases', {
        project_id: selectedProjectId,
        name: newPhaseName,
        start_date: newPhaseStart,
        end_date: newPhaseEnd
      });
      alert('Project Phase and default milestones registered successfully!');
      setNewPhaseName('');
      setNewPhaseStart('');
      setNewPhaseEnd('');
      setShowAddForm(false);
      loadPhases();
    } catch (err) {
      console.error(err);
      alert('Error creating project phase.');
    }
    setSubmittingPhase(false);
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, React.CSSProperties> = {
      planned: { background: 'rgba(107,114,128,0.1)', color: '#6b7280' },
      active: { background: 'rgba(59,130,246,0.1)', color: '#3b82f6' },
      pending: { background: 'rgba(245,158,11,0.1)', color: '#f59e0b' },
      delayed: { background: 'rgba(239,68,68,0.1)', color: '#ef4444' },
      completed: { background: 'rgba(16,185,129,0.1)', color: 'var(--color-success)' }
    };
    return (
      <span style={{ fontSize: '0.68rem', fontWeight: 800, padding: '3px 8px', borderRadius: 99, ...styles[status] }}>
        {status.toUpperCase()}
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
            <Hammer size={26} color="var(--color-primary)" />
            🏗 Project Construction Progress
          </h1>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>
            Track physical milestones completion, inspect Bill of Quantities (BOQ) metrics, and configure structural project phases.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <select style={{ ...inputStyle, width: 'auto' }} value={selectedProjectId} onChange={e => setSelectedProjectId(e.target.value)}>
            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 4 }} onClick={() => setShowAddForm(!showAddForm)}>
            <Plus size={14} /> Add Phase
          </button>
        </div>
      </div>

      {/* Add Phase Form */}
      {showAddForm && (
        <div className="glass-panel" style={{ padding: 20, borderRadius: 'var(--radius-lg)', marginBottom: 20 }}>
          <h3 style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: 14 }}>Register New Phase</h3>
          <form onSubmit={handleCreatePhase} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: 12, alignItems: 'flex-end' }}>
            <div>
              <label style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>PHASE NAME</label>
              <input style={inputStyle} placeholder="e.g. Phase 2 - Structural Framing" value={newPhaseName} onChange={e => setNewPhaseName(e.target.value)} />
            </div>
            <div>
              <label style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>START DATE</label>
              <input style={inputStyle} type="date" value={newPhaseStart} onChange={e => setNewPhaseStart(e.target.value)} />
            </div>
            <div>
              <label style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>END DATE</label>
              <input style={inputStyle} type="date" value={newPhaseEnd} onChange={e => setNewPhaseEnd(e.target.value)} />
            </div>
            <button type="submit" className="btn-primary" style={{ height: 38 }} disabled={submittingPhase}>
              {submittingPhase ? 'Saving...' : 'Register'}
            </button>
          </form>
        </div>
      )}

      {loading ? (
        <div className="glass-panel" style={{ padding: 60, textAlign: 'center', color: 'var(--text-muted)', borderRadius: 'var(--radius-lg)' }}>Loading project phases...</div>
      ) : phases.length === 0 ? (
        <div className="glass-panel" style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', borderRadius: 'var(--radius-lg)' }}>No phases registered for this project. Click Add Phase to seed structural timelines.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {phases.map(phase => (
            <div className="glass-panel" key={phase.id} style={{ padding: 24, borderRadius: 'var(--radius-lg)' }}>
              {/* Phase Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-glass)', paddingBottom: 14, marginBottom: 16 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-main)' }}>{phase.name}</h3>
                    {getStatusBadge(phase.status)}
                  </div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    Schedule: {new Date(phase.start_date).toLocaleDateString()} - {new Date(phase.end_date).toLocaleDateString()}
                  </span>
                </div>
                {/* Overall phase progress */}
                <div style={{ width: 140, textAlign: 'right' }}>
                  <div style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--color-primary)' }}>{phase.progress_percentage.toFixed(1)}%</div>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 700 }}>OVERALL PROGRESS</span>
                </div>
              </div>

              {/* Grid content */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 20 }}>
                {/* Milestones list */}
                <div>
                  <h4 style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <CheckSquare size={14} color="var(--color-primary)" /> Milestones completion progress
                  </h4>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                      <tr>
                        <th style={headerStyle}>Milestone Title</th>
                        <th style={{ width: 140, ...headerStyle }}>Progress slider</th>
                        <th style={headerStyle}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {phase.milestones?.map(m => (
                        <tr key={m.id}>
                          <td style={cellStyle}>
                            <div style={{ fontWeight: 700 }}>{m.title}</div>
                            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Due: {new Date(m.due_date).toLocaleDateString()} (Weight: {parseFloat(m.weight)}%)</div>
                          </td>
                          <td style={cellStyle}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <input
                                type="range"
                                min="0"
                                max="100"
                                style={{ width: 80, cursor: 'pointer' }}
                                value={parseFloat(m.progress_percentage)}
                                onChange={e => handleUpdateProgress(m.id, parseFloat(e.target.value))}
                                disabled={updatingMilestoneId === m.id}
                              />
                              <span style={{ fontWeight: 700, width: 34, textAlign: 'right' }}>{parseFloat(m.progress_percentage).toFixed(0)}%</span>
                            </div>
                          </td>
                          <td style={cellStyle}>{getStatusBadge(m.status)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* BOQ ledger list */}
                <div>
                  <h4 style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <FileText size={14} color="var(--color-primary)" /> Bill of Quantities (BOQ) Items
                  </h4>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.75rem' }}>
                      <thead>
                        <tr>
                          <th style={headerStyle}>Item</th>
                          <th style={{ textAlign: 'right', ...headerStyle }}>Planned Qty</th>
                          <th style={{ textAlign: 'right', ...headerStyle }}>Actual Qty</th>
                          <th style={{ textAlign: 'right', ...headerStyle }}>Total Price</th>
                        </tr>
                      </thead>
                      <tbody>
                        {phase.boq_items?.map(item => (
                          <tr key={item.id} style={{ borderBottom: '1px solid rgba(0,0,0,0.03)' }}>
                            <td style={{ padding: 8 }}>
                              <div style={{ fontWeight: 700 }}>{item.item_code}</div>
                              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{item.description}</div>
                            </td>
                            <td style={{ padding: 8, textAlign: 'right' }}>{parseFloat(item.planned_quantity)} {item.unit}</td>
                            <td style={{ padding: 8, textAlign: 'right', color: parseFloat(item.actual_quantity) > parseFloat(item.planned_quantity) ? '#ef4444' : 'var(--text-main)', fontWeight: 700 }}>
                              {parseFloat(item.actual_quantity)} {item.unit}
                            </td>
                            <td style={{ padding: 8, textAlign: 'right', fontWeight: 700 }}>{parseFloat(item.total_price).toLocaleString()} EGP</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ConstructionProgress;
