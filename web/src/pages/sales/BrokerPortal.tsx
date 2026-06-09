import React, { useState, useEffect } from 'react';
import { Users, Plus, ClipboardList, MapPin, Sparkles, Send, CheckCircle } from 'lucide-react';
import api from '../../services/api';
import { ToastContainer } from '../../components/Toast';

const BrokerPortal: React.FC = () => {
  const [toasts, setToasts] = useState<{ id: string; message: string; type: 'success' | 'error' | 'info' }[]>([]);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const [stats, setStats] = useState<any>({
    total_leads: 0,
    total_presentations: 0,
    pending_presentations: 0,
    escalated_to_sales: 0,
    conversion_rate: 0
  });
  const [leads, setLeads] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [presentations, setPresentations] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal / Form States
  const [showPresModal, setShowPresModal] = useState(false);
  const [showEscalateModal, setShowEscalateModal] = useState(false);
  const [selectedLeadId, setSelectedLeadId] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [selectedUnitIds, setSelectedUnitIds] = useState<string[]>([]);
  const [presNotes, setPresNotes] = useState('');

  const [selectedPres, setSelectedPres] = useState<any | null>(null);
  const [escalateNotes, setEscalateNotes] = useState('');

  const fetchPortalData = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch Stats
      const statsRes = await api.get('/v1/sales/broker/dashboard');
      if (statsRes.data && statsRes.data.success) {
        setStats(statsRes.data.stats);
        setPresentations(statsRes.data.recent_presentations || []);
      }

      // 2. Fetch Leads
      const leadsRes = await api.get('/v1/sales/broker/leads');
      if (leadsRes.data && leadsRes.data.success) {
        setLeads(leadsRes.data.data.data || []);
      }

      // 3. Fetch Projects
      const projectsRes = await api.get('/v1/sales/broker/projects');
      if (projectsRes.data && projectsRes.data.success) {
        setProjects(projectsRes.data.data || []);
      }

      // 4. Fetch Presentations
      const presRes = await api.get('/v1/sales/broker/presentations');
      if (presRes.data && presRes.data.success) {
        setPresentations(presRes.data.data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch Broker portal data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPortalData();
  }, []);

  // Fetch Units when Project is selected in Form
  useEffect(() => {
    if (!selectedProjectId) {
      setUnits([]);
      return;
    }
    const fetchUnits = async () => {
      try {
        const res = await api.get(`/v1/sales/broker/projects/${selectedProjectId}/units`);
        if (res.data && res.data.success) {
          setUnits(res.data.data || []);
        }
      } catch (err) {
        console.error('Failed to fetch units for project:', err);
      }
    };
    fetchUnits();
  }, [selectedProjectId]);

  const handleCreatePresentation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLeadId || !selectedProjectId) return;

    try {
      setIsLoading(true);
      const res = await api.post('/v1/sales/broker/presentations', {
        lead_id: selectedLeadId,
        project_id: selectedProjectId,
        unit_ids: selectedUnitIds,
        presentation_notes: presNotes
      });
      if (res.data && res.data.success) {
        setSelectedLeadId('');
        setSelectedProjectId('');
        setSelectedUnitIds([]);
        setPresNotes('');
        setShowPresModal(false);
        await fetchPortalData();
        showToast('Presentation logged successfully! Client progressed to Tier 2.', 'success');
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to create presentation.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEscalate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPres) return;

    try {
      setIsLoading(true);
      const res = await api.put(`/v1/sales/broker/presentations/${selectedPres.id}/escalate`, {
        notes: escalateNotes
      });
      if (res.data && res.data.success) {
        setEscalateNotes('');
        setShowEscalateModal(false);
        setSelectedPres(null);
        await fetchPortalData();
        showToast('Presentation escalated to Company Sales! Client progressed to Tier 3.', 'success');
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to escalate presentation.', 'error');
    } finally {
      setIsLoading(false);
    }
  };


  const handleUnitToggle = (unitId: string) => {
    if (selectedUnitIds.includes(unitId)) {
      setSelectedUnitIds(selectedUnitIds.filter(id => id !== unitId));
    } else {
      setSelectedUnitIds([...selectedUnitIds, unitId]);
    }
  };

  if (isLoading && leads.length === 0) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', flexDirection: 'column', gap: '20px' }}>
        <div className="animate-spin" style={{ width: '50px', height: '50px', border: '5px solid var(--color-secondary)', borderTopColor: 'var(--color-primary)', borderRadius: '50%' }} />
        <p style={{ color: 'var(--text-muted)', fontWeight: 650, fontFamily: 'var(--font-title)' }}>Loading secure data environment...</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px', position: 'relative' }}>
      
      {/* Header Panel */}
      <div className="glass-panel" style={{ padding: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '6px' }}>🍊 External Broker Portal (Tier 2)</h1>
          <p style={{ color: 'var(--text-muted)' }}>Browse premium unit inventory, log customer presentations, and escalate to company sales for booking.</p>
        </div>
        <div style={{ padding: '6px 12px', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 'var(--radius-sm)' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-warning)' }}>Broker Tier 2 Portal</span>
        </div>
      </div>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '20px' }}>
        <div className="glass-panel" style={{ padding: '20px', textAlign: 'center' }}>
          <h4 style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>My Clients</h4>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 800, margin: '8px 0 0 0' }}>{stats.total_leads}</h2>
        </div>
        <div className="glass-panel" style={{ padding: '20px', textAlign: 'center' }}>
          <h4 style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Total Presentations</h4>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 800, margin: '8px 0 0 0', color: 'var(--color-primary)' }}>{stats.total_presentations}</h2>
        </div>
        <div className="glass-panel" style={{ padding: '20px', textAlign: 'center' }}>
          <h4 style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Pending Outcomes</h4>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 800, margin: '8px 0 0 0', color: 'var(--color-warning)' }}>{stats.pending_presentations}</h2>
        </div>
        <div className="glass-panel" style={{ padding: '20px', textAlign: 'center' }}>
          <h4 style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Escalated to Sales</h4>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 800, margin: '8px 0 0 0', color: '#8b5cf6' }}>{stats.escalated_to_sales}</h2>
        </div>
        <div className="glass-panel" style={{ padding: '20px', textAlign: 'center' }}>
          <h4 style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Conversion Rate</h4>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 800, margin: '8px 0 0 0', color: 'var(--color-success)' }}>{stats.conversion_rate}%</h2>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '30px', alignItems: 'start' }}>
        
        {/* Left Side: Leads list */}
        <div className="glass-panel" style={{ padding: '25px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Users style={{ color: 'var(--color-warning)' }} />
              My Broker Leads
            </h3>
            <button 
              onClick={() => {
                if (leads.length === 0) {
                  showToast('No leads assigned to your Broker profile. Please create leads via tele-sales/admin first.', 'info');
                  return;
                }
                setShowPresModal(true);
              }}
              className="btn-primary" 
              style={{ padding: '6px 12px', fontSize: '0.75rem' }}
            >
              <Sparkles style={{ width: '12px', height: '12px', marginRight: '4px' }} /> Log Presentation
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {leads.length === 0 ? (
              <p style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                No clients are currently registered under your broker agency.
              </p>
            ) : (
              leads.map(lead => (
                <div key={lead.id} className="glass-panel" style={{ padding: '15px', background: 'rgba(255,255,255,0.3)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h4 style={{ fontWeight: 700, fontSize: '0.85rem' }}>{lead.first_name} {lead.last_name}</h4>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>📞 {lead.phone}</div>
                    {(lead.interested_project || lead.interestedProject) && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-primary)', fontWeight: 600, marginTop: '2px' }}>
                        🏢 Project: {(lead.interested_project || lead.interestedProject).name}
                      </div>
                    )}
                    {lead.budget && (
                      <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-success)', marginTop: '2px' }}>
                        💰 Budget: {parseFloat(lead.budget).toLocaleString()} EGP ({lead.payment_method})
                      </div>
                    )}
                  </div>
                  <span className={`badge badge-${lead.current_tier === 'tier_1' ? 'warning' : lead.current_tier === 'tier_2' ? 'primary' : 'success'}`} style={{ fontSize: '0.65rem' }}>
                    {lead.current_tier === 'tier_1' ? 'T1: Tele' : lead.current_tier === 'tier_2' ? 'T2: Broker' : 'T3: Sales'}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Side: Presentations list */}
        <div className="glass-panel" style={{ padding: '25px' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ClipboardList style={{ color: 'var(--color-primary)' }} />
            Presentation Audit Logs & Escalate Pipeline
          </h3>
          <div style={{ overflowX: 'auto' }}>
            <table className="premium-table">
              <thead>
                <tr>
                  <th>Client</th>
                  <th>Presented Property</th>
                  <th>Outcome Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {presentations.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>No presentations logged yet.</td>
                  </tr>
                ) : (
                  presentations.map(pres => (
                    <tr key={pres.id}>
                      <td>
                        <strong>{pres.lead?.first_name} {pres.lead?.last_name}</strong>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{pres.lead?.phone}</div>
                      </td>
                      <td>
                        <strong>🏢 {pres.project?.name}</strong>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          Units: {Array.isArray(pres.unit_ids) ? pres.unit_ids.length : 0} items presented
                        </div>
                      </td>
                      <td>
                        <span className={`badge badge-${
                          pres.outcome === 'pending' ? 'warning' :
                          pres.outcome === 'interested' ? 'primary' :
                          pres.outcome === 'escalated_to_sales' ? 'success' : 'danger'
                        }`}>
                          {pres.outcome.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td>
                        {pres.outcome !== 'escalated_to_sales' ? (
                          <button
                            onClick={() => { setSelectedPres(pres); setShowEscalateModal(true); }}
                            className="btn-primary"
                            style={{ padding: '6px 12px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px', background: '#8b5cf6', borderColor: '#7c3aed' }}
                          >
                            <Send style={{ width: '12px', height: '12px' }} /> Escalate (T3)
                          </button>
                        ) : (
                          <span style={{ color: 'var(--color-success)', fontSize: '0.75rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <CheckCircle style={{ width: '14px', height: '14px' }} /> Escalated
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* CREATE PRESENTATION MODAL */}
      {showPresModal && (
        <div className="modal-backdrop">
          <div className="glass-panel modal-content" style={{ width: '100%', maxWidth: '500px', padding: '30px', display: 'flex', flexDirection: 'column', gap: '20px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ fontWeight: 800 }}>Log Client Presentation</h3>
            <form onSubmit={handleCreatePresentation} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="form-group">
                <label className="form-label">Select Client (Lead)</label>
                <select className="form-control" value={selectedLeadId} onChange={e => setSelectedLeadId(e.target.value)} required>
                  <option value="">-- Choose Lead --</option>
                  {leads.map(l => (
                    <option key={l.id} value={l.id}>{l.first_name} {l.last_name} ({l.phone})</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Select Project</label>
                <select className="form-control" value={selectedProjectId} onChange={e => setSelectedProjectId(e.target.value)} required>
                  <option value="">-- Choose Project --</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.location}) {p.delivery_date ? `[Delivery: ${p.delivery_date.substring(0, 10)}]` : ''}</option>
                  ))}
                </select>
                {selectedProjectId && (() => {
                  const proj = projects.find(p => p.id === selectedProjectId);
                  return proj?.delivery_date ? (
                    <div style={{ padding: '8px 12px', background: 'rgba(59,130,246,0.08)', borderLeft: '4px solid var(--color-primary)', borderRadius: 'var(--radius-xs)', fontSize: '0.78rem', marginTop: '6px' }}>
                      📅 <strong>Project Delivery Date:</strong> {proj.delivery_date.substring(0, 10)}
                    </div>
                  ) : null;
                })()}
              </div>

              {selectedProjectId && units.length > 0 && (
                <div className="form-group">
                  <label className="form-label">Select Units (Choose unit to present)</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', maxHeight: '150px', overflowY: 'auto', padding: '10px', background: 'rgba(255,255,255,0.4)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-glass)' }}>
                    {units.map(unit => (
                      <label key={unit.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', cursor: 'pointer' }}>
                        <input 
                          type="checkbox" 
                          checked={selectedUnitIds.includes(unit.id)} 
                          onChange={() => handleUnitToggle(unit.id)} 
                        />
                        {unit.unit_number} - {unit.price ? `${unit.price.toLocaleString()} EGP` : 'Hidden'} ({unit.type})
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Presentation Discussion Notes</label>
                <textarea className="form-control" value={presNotes} onChange={e => setPresNotes(e.target.value)} placeholder="Client reaction, preferred payment plan options, etc..." style={{ height: '80px' }} />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button type="button" className="btn-secondary" onClick={() => setShowPresModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Log Presentation</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ESCALATE MODAL */}
      {showEscalateModal && selectedPres && (
        <div className="modal-backdrop">
          <div className="glass-panel modal-content" style={{ width: '100%', maxWidth: '450px', padding: '30px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h3 style={{ fontWeight: 800 }}>Escalate to Company Sales</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Send this presentation to Company Sales Representative (Tier 3) to execute final booking & reservation contract.
            </p>
            <form onSubmit={handleEscalate} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="form-group">
                <label className="form-label">Escalation Handover Notes</label>
                <textarea className="form-control" value={escalateNotes} onChange={e => setEscalateNotes(e.target.value)} placeholder="Specify payment timeline details, booking amount ready, etc..." style={{ height: '100px' }} required />
              </div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button type="button" className="btn-secondary" onClick={() => { setShowEscalateModal(false); setSelectedPres(null); }}>Cancel</button>
                <button type="submit" className="btn-primary" style={{ background: '#8b5cf6', borderColor: '#7c3aed' }}>Confirm Escalation</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
};

export default BrokerPortal;

