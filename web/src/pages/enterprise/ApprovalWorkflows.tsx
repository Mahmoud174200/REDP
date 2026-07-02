import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import {
  CheckSquare, Inbox, Sliders, FileText, Play, Plus, Trash2,
  ChevronDown, ChevronUp, Check, X, Search, Info, HelpCircle, ArrowRight
} from 'lucide-react';

interface ApprovalStep {
  id?: string;
  step_order: number;
  name: string;
  type: 'sequential' | 'parallel' | 'conditional';
  approver_type: 'user' | 'role' | 'position' | 'department_head' | 'direct_manager';
  approver_id: string | null;
  required_approvals: number;
  conditions?: { field: string; operator: string; value: string; logic: 'and' | 'or' }[];
}

interface Workflow {
  id: string;
  name: string;
  entity_type: string;
  description: string | null;
  timeout_hours: number | null;
  is_active: boolean;
  steps: ApprovalStep[];
  creator?: any;
}

type Tab = 'inbox' | 'designer' | 'history' | 'sandbox';

const tabs: { key: Tab; label: string; icon: any }[] = [
  { key: 'inbox', label: 'My Inbox', icon: Inbox },
  { key: 'designer', label: 'Workflows Designer', icon: Sliders },
  { key: 'history', label: 'Audit Trail', icon: FileText },
  { key: 'sandbox', label: 'Dry-Run Sandbox', icon: Play },
];

const Modal: React.FC<{ open: boolean; title: string; onClose: () => void; children: React.ReactNode }> = ({ open, title, onClose, children }) => {
  if (!open) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(4px)' }} onClick={onClose}>
      <div className="glass-panel" style={{ width: '95%', maxWidth: 700, maxHeight: '85vh', overflowY: 'auto', padding: 32, borderRadius: 'var(--radius-lg)' }} onClick={e => e.stopPropagation()}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: 20, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <CheckSquare size={18} color="var(--color-primary)" />
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

const ApprovalWorkflows: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('inbox');
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  // Data states
  const [inbox, setInbox] = useState<any[]>([]);
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [entityTypes, setEntityTypes] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [positions, setPositions] = useState<any[]>([]);
  const [usersList, setUsersList] = useState<any[]>([]);

  // Workflow builder state
  const [designerModalOpen, setDesignerModalOpen] = useState(false);
  const [editWorkflow, setEditWorkflow] = useState<Workflow | null>(null);
  const [wfForm, setWfForm] = useState<any>({ steps: [] });

  // Decision state
  const [decisionModalOpen, setDecisionModalOpen] = useState(false);
  const [selectedInstance, setSelectedInstance] = useState<any>(null);
  const [decisionForm, setDecisionForm] = useState({ action: 'approve', comment: '' });

  // Sandbox state
  const [sandboxForm, setSandboxForm] = useState({
    entity_type: 'cancellation',
    entity_id: 'e4b09c8a-4d7a-428a-8c54-b5828cdbc412',
    metadataJson: '{\n  "amount": 250000,\n  "priority": "high",\n  "reason": "Relocation abroad"\n}'
  });

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [inboxRes, wfRes, histRes, typesRes, rolesRes, posRes, usersRes] = await Promise.all([
        api.get('/v1/enterprise/approvals/inbox'),
        api.get('/v1/enterprise/approval-workflows'),
        api.get('/v1/enterprise/approvals/history'),
        api.get('/v1/enterprise/approval-workflows/entity-types'),
        api.get('/v1/enterprise/roles'),
        api.get('/v1/enterprise/positions'),
        api.get('/v1/admin/users'),
      ]);

      setInbox(inboxRes.data?.data || []);
      setWorkflows(wfRes.data?.data || []);
      setHistory(histRes.data?.data || []);
      setEntityTypes(typesRes.data?.data || []);
      setRoles(rolesRes.data?.data || []);
      setPositions(posRes.data?.data || []);
      setUsersList(usersRes.data?.data || []);
    } catch (err) {
      console.error('Error loading approvals data:', err);
    }
    setLoading(false);
  };

  // ── Inbox Actions ──
  const openDecisionModal = (inst: any) => {
    setSelectedInstance(inst);
    setDecisionForm({ action: 'approve', comment: '' });
    setDecisionModalOpen(true);
  };

  const submitDecision = async () => {
    if (!selectedInstance) return;
    try {
      await api.post(`/v1/enterprise/approvals/${selectedInstance.id}/action`, decisionForm);
      setDecisionModalOpen(false);
      loadAll();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Error submitting decision');
    }
  };

  // ── Designer Actions ──
  const openCreateWorkflow = () => {
    setEditWorkflow(null);
    setWfForm({
      name: '',
      entity_type: entityTypes[0]?.key || 'cancellation',
      description: '',
      timeout_hours: 24,
      steps: [
        { step_order: 1, name: 'First Review', type: 'sequential', approver_type: 'role', approver_id: roles[0]?.id || '', required_approvals: 1, conditions: [] }
      ]
    });
    setDesignerModalOpen(true);
  };

  const openEditWorkflow = (wf: Workflow) => {
    setEditWorkflow(wf);
    setWfForm({
      ...wf,
      steps: wf.steps.map(s => ({
        ...s,
        conditions: s.conditions || []
      }))
    });
    setDesignerModalOpen(true);
  };

  const addStep = () => {
    setWfForm((prev: any) => {
      const order = prev.steps.length + 1;
      return {
        ...prev,
        steps: [
          ...prev.steps,
          { step_order: order, name: `Stage ${order} Review`, type: 'sequential', approver_type: 'role', approver_id: roles[0]?.id || '', required_approvals: 1, conditions: [] }
        ]
      };
    });
  };

  const removeStep = (index: number) => {
    setWfForm((prev: any) => {
      const updated = prev.steps.filter((_: any, idx: number) => idx !== index)
        .map((s: any, idx: number) => ({ ...s, step_order: idx + 1 }));
      return { ...prev, steps: updated };
    });
  };

  const moveStep = (index: number, direction: 'up' | 'down') => {
    setWfForm((prev: any) => {
      const steps = [...prev.steps];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= steps.length) return prev;

      // Swap
      const temp = steps[index];
      steps[index] = steps[targetIndex];
      steps[targetIndex] = temp;

      // Re-order index
      const updated = steps.map((s, idx) => ({ ...s, step_order: idx + 1 }));
      return { ...prev, steps: updated };
    });
  };

  const updateStepField = (index: number, key: keyof ApprovalStep, val: any) => {
    setWfForm((prev: any) => {
      const steps = [...prev.steps];
      steps[index] = { ...steps[index], [key]: val };
      return { ...prev, steps };
    });
  };

  const addCondition = (stepIdx: number) => {
    setWfForm((prev: any) => {
      const steps = [...prev.steps];
      const step = { ...steps[stepIdx] };
      const conds = [...(step.conditions || [])];
      conds.push({ field: 'amount', operator: 'gt', value: '100000', logic: 'and' });
      step.conditions = conds;
      steps[stepIdx] = step;
      return { ...prev, steps };
    });
  };

  const removeCondition = (stepIdx: number, condIdx: number) => {
    setWfForm((prev: any) => {
      const steps = [...prev.steps];
      const step = { ...steps[stepIdx] };
      step.conditions = step.conditions?.filter((_, idx) => idx !== condIdx);
      steps[stepIdx] = step;
      return { ...prev, steps };
    });
  };

  const updateConditionField = (stepIdx: number, condIdx: number, key: string, val: any) => {
    setWfForm((prev: any) => {
      const steps = [...prev.steps];
      const step = { ...steps[stepIdx] };
      const conds = [...(step.conditions || [])];
      conds[condIdx] = { ...conds[condIdx], [key]: val };
      step.conditions = conds;
      steps[stepIdx] = step;
      return { ...prev, steps };
    });
  };

  const saveWorkflow = async () => {
    try {
      if (editWorkflow) {
        await api.put(`/v1/enterprise/approval-workflows/${editWorkflow.id}`, wfForm);
      } else {
        await api.post('/v1/enterprise/approval-workflows', wfForm);
      }
      setDesignerModalOpen(false);
      loadAll();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Error saving workflow');
    }
  };

  const deleteWorkflow = async (id: string) => {
    if (!confirm('Are you sure you want to delete this workflow?')) return;
    try {
      await api.delete(`/v1/enterprise/approval-workflows/${id}`);
      loadAll();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Error deleting workflow');
    }
  };

  // ── Sandbox Trigger ──
  const triggerSandboxWorkflow = async () => {
    try {
      let meta = {};
      try {
        meta = JSON.parse(sandboxForm.metadataJson);
      } catch (e) {
        alert('Invalid JSON in metadata payload');
        return;
      }

      const res = await api.post('/v1/enterprise/approvals/test-initiate', {
        entity_type: sandboxForm.entity_type,
        entity_id: sandboxForm.entity_id,
        metadata: meta
      });

      alert(res.data?.message || 'Test workflow initiated successfully!');
      loadAll();
      setActiveTab('inbox');
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Error triggering test workflow');
    }
  };

  // Styling Helpers
  const cellStyle: React.CSSProperties = { padding: '12px 16px', fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-main)', borderBottom: '1px solid var(--border-glass)' };
  const headerStyle: React.CSSProperties = { ...cellStyle, fontWeight: 800, fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.06em', background: 'rgba(255,255,255,0.4)' };
  
  const badge = (text: string, color: string) => (
    <span style={{ padding: '3px 10px', borderRadius: 9999, fontSize: '0.68rem', fontWeight: 700, background: `${color}18`, color, textTransform: 'capitalize' }}>{text}</span>
  );

  const getEntityLabel = (key: string) => {
    return entityTypes.find(t => t.key === key)?.label || key;
  };

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 10 }}>
          <CheckSquare size={24} color="var(--color-primary)" />
          💼 Approval Workflow Engine
        </h1>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>
          Process active business approvals, design multi-step sequential/parallel routing pipelines, and audit system decisions
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
            {t.key === 'inbox' && inbox.length > 0 && (
              <span style={{ background: '#ef4444', color: '#fff', fontSize: '0.62rem', fontWeight: 800, padding: '2px 6px', borderRadius: 9999 }}>{inbox.length}</span>
            )}
          </button>
        ))}
      </div>

      {/* Content Body */}
      <div className="glass-panel" style={{ padding: 24, borderRadius: 'var(--radius-lg)' }}>
        {loading && <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Loading...</div>}

        {!loading && activeTab === 'inbox' && (
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: 16 }}>My Pending Approvals Inbox</h3>
            {inbox.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                <Inbox size={32} style={{ marginBottom: 12, opacity: 0.5 }} />
                <div>Your inbox is empty. No pending action requested.</div>
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={headerStyle}>Entity Type</th>
                    <th style={headerStyle}>Requested By</th>
                    <th style={headerStyle}>Current Step</th>
                    <th style={headerStyle}>Requested On</th>
                    <th style={headerStyle}>Parameters/Metadata</th>
                    <th style={headerStyle}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {inbox.map(item => (
                    <tr key={item.id}>
                      <td style={cellStyle}><strong>{getEntityLabel(item.entity_type)}</strong></td>
                      <td style={cellStyle}>{item.requester?.name || '—'}<div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{item.requester?.email}</div></td>
                      <td style={cellStyle}>{badge(item.current_step?.name || 'Review', '#3b82f6')}</td>
                      <td style={cellStyle}>{new Date(item.created_at).toLocaleString()}</td>
                      <td style={cellStyle}>
                        <pre style={{ fontSize: '0.7rem', margin: 0, padding: 6, background: 'rgba(0,0,0,0.03)', borderRadius: 4, fontFamily: 'monospace' }}>
                          {JSON.stringify(item.metadata, null, 2)}
                        </pre>
                      </td>
                      <td style={cellStyle}>
                        <button className="btn-primary" onClick={() => openDecisionModal(item)} style={{ fontSize: '0.75rem', padding: '6px 12px' }}>
                          Resolve
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {!loading && activeTab === 'designer' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-main)' }}>Approval Routing Workflows</h3>
              <button className="btn-primary" onClick={openCreateWorkflow} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Plus size={16} /> New Workflow
              </button>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={headerStyle}>Workflow Name</th>
                  <th style={headerStyle}>Entity Trigger</th>
                  <th style={headerStyle}>Total Steps</th>
                  <th style={headerStyle}>Timeout</th>
                  <th style={headerStyle}>Status</th>
                  <th style={headerStyle}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {workflows.map(wf => (
                  <tr key={wf.id}>
                    <td style={cellStyle}><strong>{wf.name}</strong><div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{wf.description || 'No description'}</div></td>
                    <td style={cellStyle}>{badge(getEntityLabel(wf.entity_type), '#8b5cf6')}</td>
                    <td style={cellStyle}>{wf.steps?.length || 0} stages</td>
                    <td style={cellStyle}>{wf.timeout_hours ? `${wf.timeout_hours} hours` : 'Unlimited'}</td>
                    <td style={cellStyle}>{badge(wf.is_active ? 'active' : 'inactive', wf.is_active ? '#10b981' : '#6b7280')}</td>
                    <td style={cellStyle}>
                      <button className="btn-ghost" onClick={() => openEditWorkflow(wf)} style={{ marginRight: 6 }}>
                        <Edit3 size={14} />
                      </button>
                      <button className="btn-ghost" onClick={() => deleteWorkflow(wf.id)}>
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && activeTab === 'history' && (
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: 16 }}>Approval Audit Log Trail</h3>
            {history.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>No historical decisions found.</div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={headerStyle}>Workflow Entity</th>
                    <th style={headerStyle}>Requester</th>
                    <th style={headerStyle}>Decided By</th>
                    <th style={headerStyle}>Stage</th>
                    <th style={headerStyle}>Decision</th>
                    <th style={headerStyle}>Comment</th>
                    <th style={headerStyle}>Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map(h => (
                    <tr key={h.id}>
                      <td style={cellStyle}><strong>{getEntityLabel(h.instance?.entity_type)}</strong></td>
                      <td style={cellStyle}>{h.instance?.requester?.name || '—'}</td>
                      <td style={cellStyle}>{h.actor?.name || '—'}</td>
                      <td style={cellStyle}>{h.step?.name || '—'}</td>
                      <td style={cellStyle}>{badge(h.action, h.action === 'approve' ? '#10b981' : h.action === 'reject' ? '#ef4444' : '#f59e0b')}</td>
                      <td style={cellStyle}><span style={{ fontStyle: 'italic', fontSize: '0.75rem' }}>"{h.comment || 'No comment provided'}"</span></td>
                      <td style={cellStyle}>{new Date(h.acted_at).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {!loading && activeTab === 'sandbox' && (
          <div style={{ maxWidth: 600, margin: '0 auto' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Play size={18} color="var(--color-primary)" />
              Approval workflow dry-run validation
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 20 }}>
              Initiate a simulated workflow process using custom mock variables. This allows you to verify that conditional steps, role assignments, and approvals advance correctly without affecting real data.
            </p>

            <Field label="Trigger Entity Type">
              <select style={inputStyle} value={sandboxForm.entity_type} onChange={e => setSandboxForm(p => ({ ...p, entity_type: e.target.value }))}>
                {entityTypes.map(t => <option key={t.key} value={t.key}>{t.label}</option>)}
              </select>
            </Field>

            <Field label="Target Entity ID (Mock UUID)"><input style={inputStyle} value={sandboxForm.entity_id} onChange={e => setSandboxForm(p => ({ ...p, entity_id: e.target.value }))} /></Field>
            
            <Field label="Parameters Payload (JSON format)">
              <textarea 
                style={{ ...inputStyle, fontFamily: 'monospace', minHeight: 120 }} 
                value={sandboxForm.metadataJson} 
                onChange={e => setSandboxForm(p => ({ ...p, metadataJson: e.target.value }))} 
              />
            </Field>

            <button className="btn-primary" onClick={triggerSandboxWorkflow} style={{ width: '100%', marginTop: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <Play size={16} /> Initiate Simulated Approval
            </button>
          </div>
        )}
      </div>

      {/* Decision Modal */}
      <Modal open={decisionModalOpen} title="Resolve Pending Approval Request" onClose={() => setDecisionModalOpen(false)}>
        {selectedInstance && (
          <div style={{ marginBottom: 20, padding: 14, background: 'rgba(0,0,0,0.03)', borderRadius: 'var(--radius-md)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: '0.78rem' }}>
              <div><strong>Entity:</strong> {getEntityLabel(selectedInstance.entity_type)}</div>
              <div><strong>Requested By:</strong> {selectedInstance.requester?.name}</div>
              <div><strong>Stage:</strong> {selectedInstance.current_step?.name}</div>
              <div><strong>Requested On:</strong> {new Date(selectedInstance.created_at).toLocaleDateString()}</div>
            </div>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Field label="Your Decision">
            <select style={inputStyle} value={decisionForm.action} onChange={e => setDecisionForm(p => ({ ...p, action: e.target.value }))}>
              <option value="approve">Approve Request (Advance Stage)</option>
              <option value="reject">Reject Request (Cancel Entirely)</option>
              <option value="escalate">Escalate (Forward to Supervisor)</option>
            </select>
          </Field>
        </div>

        <Field label="Auditor Comment"><textarea style={{ ...inputStyle, minHeight: 80 }} value={decisionForm.comment} onChange={e => setDecisionForm(p => ({ ...p, comment: e.target.value }))} placeholder="Provide audit decision notes..." /></Field>

        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
          <button className="btn-primary" onClick={submitDecision} style={{ flex: 1 }}>Submit Decision</button>
          <button className="btn-secondary" onClick={() => setDecisionModalOpen(false)} style={{ flex: 1 }}>Cancel</button>
        </div>
      </Modal>

      {/* Workflow Builder Modal */}
      <Modal open={designerModalOpen} title={`${editWorkflow ? 'Edit' : 'Create'} Approval Pipeline`} onClose={() => setDesignerModalOpen(false)}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>
          <Field label="Workflow Name"><input style={inputStyle} value={wfForm.name || ''} onChange={e => setWfForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Price Discount Approval" /></Field>
          <Field label="Entity Trigger">
            <select style={inputStyle} value={wfForm.entity_type} onChange={e => setWfForm(p => ({ ...p, entity_type: e.target.value }))}>
              {entityTypes.map(t => <option key={t.key} value={t.key}>{t.label}</option>)}
            </select>
          </Field>
        </div>

        <Field label="Description"><input style={inputStyle} value={wfForm.description || ''} onChange={e => setWfForm(p => ({ ...p, description: e.target.value }))} /></Field>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Field label="Workflow Timeout (Hours)"><input style={inputStyle} type="number" value={wfForm.timeout_hours || ''} onChange={e => setWfForm(p => ({ ...p, timeout_hours: parseInt(e.target.value) || null }))} /></Field>
          <Field label="Target Company (Optional)">
            <select style={inputStyle} value={wfForm.company_id || ''} onChange={e => setWfForm(p => ({ ...p, company_id: e.target.value || null }))}>
              <option value="">-- Global Workflow --</option>
              {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>
        </div>

        <div style={{ marginBottom: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h4 style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-main)' }}>Approval Routing Stages ({wfForm.steps.length})</h4>
          <button className="btn-secondary" onClick={addStep} style={{ fontSize: '0.7rem', padding: '4px 8px' }} type="button">
            Add Stage Step
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxHeight: 300, overflowY: 'auto', border: '1px solid var(--border-glass)', padding: 12, borderRadius: 'var(--radius-md)', background: 'rgba(255,255,255,0.4)', marginBottom: 20 }}>
          {wfForm.steps.map((step: ApprovalStep, stepIdx: number) => (
            <div key={stepIdx} style={{ background: 'rgba(255,255,255,0.6)', padding: 12, borderRadius: 6, border: '1px solid var(--border-glass)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--color-primary)' }}>Stage {step.step_order}</span>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button className="btn-ghost" onClick={() => moveStep(stepIdx, 'up')} disabled={stepIdx === 0} type="button" style={{ padding: 2 }}><ChevronUp size={14} /></button>
                  <button className="btn-ghost" onClick={() => moveStep(stepIdx, 'down')} disabled={stepIdx === wfForm.steps.length - 1} type="button" style={{ padding: 2 }}><ChevronDown size={14} /></button>
                  <button className="btn-ghost" onClick={() => removeStep(stepIdx)} disabled={wfForm.steps.length === 1} type="button" style={{ padding: 2 }}><Trash2 size={14} color="#ef4444" /></button>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                <Field label="Stage Name"><input style={{ ...inputStyle, padding: '6px 10px' }} value={step.name} onChange={e => updateStepField(stepIdx, 'name', e.target.value)} /></Field>
                <Field label="Step Type">
                  <select style={{ ...inputStyle, padding: '6px 10px' }} value={step.type} onChange={e => updateStepField(stepIdx, 'type', e.target.value)}>
                    <option value="sequential">Sequential Review</option>
                    <option value="parallel">Parallel Approvals</option>
                    <option value="conditional">Conditional Filter</option>
                  </select>
                </Field>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <Field label="Approver Category">
                  <select style={{ ...inputStyle, padding: '6px 10px' }} value={step.approver_type} onChange={e => updateStepField(stepIdx, 'approver_type', e.target.value)}>
                    <option value="role">Enterprise Role</option>
                    <option value="user">Specific User</option>
                    <option value="position">Org Position</option>
                    <option value="department_head">Department Head</option>
                    <option value="direct_manager">Direct Manager</option>
                  </select>
                </Field>

                {/* Conditional Approver ID selection */}
                {step.approver_type === 'role' && (
                  <Field label="Select Target Role">
                    <select style={{ ...inputStyle, padding: '6px 10px' }} value={step.approver_id || ''} onChange={e => updateStepField(stepIdx, 'approver_id', e.target.value)}>
                      {roles.map(r => <option key={r.id} value={r.id}>{r.display_name}</option>)}
                    </select>
                  </Field>
                )}
                {step.approver_type === 'user' && (
                  <Field label="Select Target User">
                    <select style={{ ...inputStyle, padding: '6px 10px' }} value={step.approver_id || ''} onChange={e => updateStepField(stepIdx, 'approver_id', e.target.value)}>
                      {usersList.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                    </select>
                  </Field>
                )}
                {step.approver_type === 'position' && (
                  <Field label="Select Target Position">
                    <select style={{ ...inputStyle, padding: '6px 10px' }} value={step.approver_id || ''} onChange={e => updateStepField(stepIdx, 'approver_id', e.target.value)}>
                      {positions.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                    </select>
                  </Field>
                )}
              </div>

              {step.type === 'parallel' && (
                <Field label="Required Approvers count">
                  <input style={inputStyle} type="number" value={step.required_approvals} onChange={e => updateStepField(stepIdx, 'required_approvals', parseInt(e.target.value))} />
                </Field>
              )}

              {/* Conditional parameters rules */}
              {step.type === 'conditional' && (
                <div style={{ marginTop: 10, background: 'rgba(0,0,0,0.02)', padding: 10, borderRadius: 4 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--text-muted)' }}>Rules & Conditions</span>
                    <button className="btn-secondary" onClick={() => addCondition(stepIdx)} style={{ fontSize: '0.62rem', padding: '3px 6px' }} type="button">Add Rule</button>
                  </div>
                  {(step.conditions || []).map((c, cIdx) => (
                    <div key={cIdx} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 2fr 1fr auto', gap: 6, alignItems: 'center', marginBottom: 6 }}>
                      <input style={{ ...inputStyle, padding: '4px 6px', fontSize: '0.75rem' }} value={c.field} onChange={e => updateConditionField(stepIdx, cIdx, 'field', e.target.value)} placeholder="field" />
                      <select style={{ ...inputStyle, padding: '4px 6px', fontSize: '0.75rem' }} value={c.operator} onChange={e => updateConditionField(stepIdx, cIdx, 'operator', e.target.value)}>
                        <option value="eq">==</option>
                        <option value="neq">!=</option>
                        <option value="gt">&gt;</option>
                        <option value="lt">&lt;</option>
                        <option value="gte">&gt;=</option>
                        <option value="lte">&lt;=</option>
                      </select>
                      <input style={{ ...inputStyle, padding: '4px 6px', fontSize: '0.75rem' }} value={c.value} onChange={e => updateConditionField(stepIdx, cIdx, 'value', e.target.value)} placeholder="value" />
                      <select style={{ ...inputStyle, padding: '4px 6px', fontSize: '0.75rem' }} value={c.logic} onChange={e => updateConditionField(stepIdx, cIdx, 'logic', e.target.value)}>
                        <option value="and">AND</option>
                        <option value="or">OR</option>
                      </select>
                      <button className="btn-ghost" onClick={() => removeCondition(stepIdx, cIdx)} style={{ padding: 2 }} type="button"><X size={12} color="#ef4444" /></button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn-primary" onClick={saveWorkflow} style={{ flex: 1 }}>{editWorkflow ? 'Update' : 'Create'}</button>
          <button className="btn-secondary" onClick={() => setDesignerModalOpen(false)} style={{ flex: 1 }}>Cancel</button>
        </div>
      </Modal>
    </div>
  );
};

export default ApprovalWorkflows;
