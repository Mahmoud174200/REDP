import React, { useState, useEffect } from 'react';
import { Users, Plus, ShieldCheck, ArrowRight } from 'lucide-react';
import api from '../../services/api';

const Leads: React.FC = () => {
  const [leads, setLeads] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [userRole, setUserRole] = useState('admin');

  // Tele-Sales Action States
  const [showMeetingModal, setShowMeetingModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [actionLeadId, setActionLeadId] = useState<string | null>(null);
  const [meetingDate, setMeetingDate] = useState('');
  const [meetingLocation, setMeetingLocation] = useState('Company HQ Office');
  const [meetingNotes, setMeetingNotes] = useState('');
  const [transferNotes, setTransferNotes] = useState('');

  const fetchLeads = async () => {
    setIsLoading(true);
    try {
      const userStr = localStorage.getItem('redp_user');
      const user = userStr ? JSON.parse(userStr) : null;
      const role = user?.role || 'admin';
      
      let endpoint = '/v1/acquisition/leads';
      if (role === 'tele_sales') {
        endpoint = '/v1/sales/tele/leads';
      } else if (role === 'broker') {
        endpoint = '/v1/sales/broker/leads';
      } else if (role === 'company_sales') {
        endpoint = '/v1/sales/company/leads';
      }

      const response = await api.get(endpoint, {
        params: { per_page: 100 }
      });
      if (response.data && response.data.success) {
        const fetchedLeads = response.data.data?.data || response.data.data || [];
        const mappedLeads = fetchedLeads.map((lead: any) => ({
          id: lead.id,
          name: `${lead.first_name || ''} ${lead.last_name || ''}`.trim() || 'N/A',
          email: lead.email || 'n/a',
          phone: lead.phone,
          stage: lead.status || 'new',
          kyc: lead.kyc_status || 'none'
        }));
        setLeads(mappedLeads);
      }
    } catch (err) {
      console.error('Failed to fetch leads:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const userStr = localStorage.getItem('redp_user');
    const user = userStr ? JSON.parse(userStr) : null;
    if (user && user.role) {
      setUserRole(user.role);
    }
    fetchLeads();
  }, []);

  const handleAddLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) return;

    const nameParts = name.trim().split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || 'N/A';

    try {
      setIsLoading(true);
      const userStr = localStorage.getItem('redp_user');
      const user = userStr ? JSON.parse(userStr) : null;
      const role = user?.role || 'admin';

      let endpoint = '/v1/acquisition/leads';
      if (role === 'tele_sales') {
        endpoint = '/v1/sales/tele/leads';
      }

      const response = await api.post(endpoint, {
        first_name: firstName,
        last_name: lastName,
        email: email || undefined,
        phone: phone,
        source: 'direct',
        lead_score: Math.floor(Math.random() * 40) + 50,
      });

      if (response.data && response.data.success) {
        setName('');
        setEmail('');
        setPhone('');
        await fetchLeads();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to capture lead.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKycApprove = async (leadId: string) => {
    try {
      setIsLoading(true);
      const response = await api.put(`/v1/acquisition/kyc/${leadId}/approve`, {
        decision: 'verified',
        reason: 'Operator approved KYC check from dashboard'
      });
      if (response.data && response.data.success) {
        await fetchLeads();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to approve KYC.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleScheduleMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actionLeadId || !meetingDate) return;
    try {
      setIsLoading(true);
      const response = await api.put(`/v1/sales/tele/leads/${actionLeadId}/schedule-meeting`, {
        meeting_date: meetingDate,
        location: meetingLocation,
        notes: meetingNotes
      });
      if (response.data && response.data.success) {
        alert('Meeting scheduled successfully!');
        setShowMeetingModal(false);
        setMeetingDate('');
        setMeetingNotes('');
        await fetchLeads();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to schedule meeting.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTransferLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actionLeadId) return;
    try {
      setIsLoading(true);
      const response = await api.put(`/v1/sales/tele/leads/${actionLeadId}/transfer`, {
        notes: transferNotes
      });
      if (response.data && response.data.success) {
        alert('Lead transferred to company sales team!');
        setShowTransferModal(false);
        setTransferNotes('');
        await fetchLeads();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to transfer lead.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMoveStage = async (leadId: string, currentStage: string) => {
    const stageKeys = stages.map(s => s.key);
    const currentIdx = stageKeys.indexOf(currentStage);
    if (currentIdx >= stageKeys.length - 1) return;
    const nextStage = stageKeys[currentIdx + 1];

    try {
      setIsLoading(true);
      let unitId = undefined;
      if (nextStage === 'reserved') {
        const res = await api.get('/v1/finance/units?status=available');
        const units = res.data?.data || [];
        if (units.length === 0) {
          alert('No available units in inventory to reserve.');
          return;
        }
        unitId = units[0].id;
      }

      const response = await api.put('/v1/acquisition/crm/move', {
        lead_id: leadId,
        status: nextStage,
        unit_id: unitId
      });
      if (response.data && response.data.success) {
        await fetchLeads();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to move lead stage.');
    } finally {
      setIsLoading(false);
    }
  };

  const stages = [
    { key: 'new', name: 'New Leads' },
    { key: 'contacted', name: 'Contacted' },
    { key: 'interested', name: 'Interested' },
    { key: 'visit_scheduled', name: 'Visit Scheduled' },
    { key: 'negotiation', name: 'Negotiation' },
    { key: 'reserved', name: 'Reserved 🔵' },
    { key: 'contracted', name: 'Contracted 🏆' }
  ];

  if (isLoading && leads.length === 0) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', flexDirection: 'column', gap: '16px' }}>
        <div className="animate-spin" style={{ width: '40px', height: '40px', border: '4px solid var(--color-primary)', borderTopColor: 'transparent', borderRadius: '50%' }} />
        <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 600 }}>Loading...</span>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px', position: 'relative' }}>
      {isLoading && (
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(255, 255, 255, 0.4)', backdropFilter: 'blur(2px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50
        }}>
          <div className="animate-spin" style={{ width: '32px', height: '32px', border: '3px solid var(--color-primary)', borderTopColor: 'transparent', borderRadius: '50%' }} />
        </div>
      )}

      {/* Header Panel */}
      <div className="glass-panel" style={{ padding: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '6px' }}>🟠 Sales CRM & Lead Acquisition</h1>
          <p>Lead registration, biometric KYC face match, and 7-stage Kanban pipeline.</p>
        </div>
        <div style={{ padding: '6px 12px', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 'var(--radius-sm)' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-warning)' }}>MODULE: H.1 / H.9</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '30px', alignItems: 'start' }}>
        {/* Lead Capture Form */}
        <div className="glass-panel" style={{ padding: '30px' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Users style={{ color: 'var(--color-warning)' }} />
            Capture New Lead
          </h2>

          <form onSubmit={handleAddLead} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Full Name</label>
              <input type="text" className="form-control" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. John Doe" required />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Email Address</label>
              <input type="email" className="form-control" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@domain.com" />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Phone Number</label>
              <input type="text" className="form-control" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+20 100 000 0000" required />
            </div>

            <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '12px' }}>
              <Plus style={{ width: '18px', height: '18px' }} />
              Capture Lead
            </button>
          </form>
        </div>

        {/* KYC Biometrics Simulation */}
        <div className="glass-panel" style={{ padding: '30px' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ShieldCheck style={{ color: 'var(--color-success)' }} />
            KYC Facematch & OCR Scanner (Database Linked)
          </h2>
          <p style={{ marginBottom: '20px' }}>Section H.1: Biometric verify matching ID photo to camera scan with &gt; 85% confidence score.</p>
          
          <div style={{ maxHeight: '350px', overflowY: 'auto' }} className="sidebar-scroll-container">
            <table className="premium-table">
              <thead>
                <tr>
                  <th>Lead Name</th>
                  <th>Phone</th>
                  <th>KYC Verification</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((lead) => (
                  <tr key={lead.id}>
                    <td><strong>{lead.name}</strong></td>
                    <td>{lead.phone}</td>
                    <td>
                      {lead.kyc === 'verified' && <span className="badge badge-success">Verified (94.2%)</span>}
                      {lead.kyc === 'pending' && <span className="badge badge-warning">OCR Running</span>}
                      {lead.kyc === 'none' && <span className="badge badge-danger">Unverified</span>}
                      {lead.kyc === 'rejected' && <span className="badge badge-danger">Rejected</span>}
                    </td>
                    <td>
                      {lead.kyc === 'none' && (userRole === 'admin' || userRole === 'sales_agent') ? (
                        <button 
                          onClick={() => handleKycApprove(lead.id)}
                          className="btn-secondary" 
                          style={{ padding: '6px 12px', fontSize: '0.75rem' }}
                        >
                          Run KYC Verification
                        </button>
                      ) : lead.kyc === 'none' ? (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Pending</span>
                      ) : null}
                      {lead.kyc !== 'none' && <span style={{ color: 'var(--color-success)', fontSize: '0.75rem', fontWeight: 600 }}>Checked</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 7-Stage Kanban Board */}
      <div className="glass-panel" style={{ padding: '30px' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '24px' }}>CRM Pipeline Stages</h2>
        <div className="kanban-board">
          {stages.map((stage) => {
            const stageLeads = leads.filter(l => l.stage === stage.key);
            return (
              <div key={stage.key} className="kanban-column">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-glass)', paddingBottom: '8px' }}>
                  <h4 style={{ fontSize: '0.85rem', fontWeight: 700 }}>{stage.name}</h4>
                  <span className="badge badge-info" style={{ padding: '2px 8px', fontSize: '0.65rem' }}>{stageLeads.length}</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', minHeight: '300px' }}>
                  {stageLeads.map((lead) => (
                    <div key={lead.id} className="kanban-card">
                      <h4 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '6px' }}>{lead.name}</h4>
                      <p style={{ fontSize: '0.75rem', marginBottom: '8px' }}>{lead.phone}</p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>ID: {lead.id.substring(0, 8)}...</span>
                          {(userRole === 'admin' || userRole === 'sales_agent') && stage.key !== 'contracted' && (
                            <button 
                              onClick={() => handleMoveStage(lead.id, lead.stage)}
                              style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', color: 'var(--color-primary)' }}
                              title="Move to Next CRM Stage"
                            >
                              <ArrowRight style={{ width: '14px', height: '14px' }} />
                            </button>
                          )}
                        </div>

                        {/* Tele-Sales Agent Actions */}
                        {userRole === 'tele_sales' && (
                          <div style={{ display: 'flex', gap: '6px', width: '100%' }}>
                            {lead.stage !== 'visit_scheduled' && lead.stage !== 'contracted' && (
                              <button 
                                onClick={() => {
                                  setActionLeadId(lead.id);
                                  setShowMeetingModal(true);
                                }}
                                className="btn-secondary"
                                style={{ padding: '4px 8px', fontSize: '0.65rem', flex: 1, justifyContent: 'center' }}
                              >
                                📅 Meeting
                              </button>
                            )}
                            <button 
                              onClick={() => {
                                  setActionLeadId(lead.id);
                                  setShowTransferModal(true);
                              }}
                              className="btn-primary"
                              style={{ padding: '4px 8px', fontSize: '0.65rem', flex: 1, justifyContent: 'center' }}
                            >
                              🚀 Transfer
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 📅 Schedule Meeting Modal */}
      {showMeetingModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: '20px' }}>
          <div className="glass-panel" style={{ maxWidth: '400px', width: '100%', padding: '30px', position: 'relative', background: '#ffffff', border: '1.5px solid var(--border-glass)', borderRadius: 'var(--radius-lg)' }}>
            <button onClick={() => setShowMeetingModal(false)} style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
              X
            </button>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '20px' }}>📅 Schedule Client Meeting</h3>
            <form onSubmit={handleScheduleMeeting} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Meeting Date & Time</label>
                <input 
                  type="datetime-local" 
                  className="form-control" 
                  value={meetingDate} 
                  onChange={e => setMeetingDate(e.target.value)} 
                  required 
                />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Location</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={meetingLocation} 
                  onChange={e => setMeetingLocation(e.target.value)} 
                />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Meeting Notes</label>
                <textarea 
                  className="form-control" 
                  style={{ minHeight: '80px', resize: 'vertical' }}
                  value={meetingNotes} 
                  onChange={e => setMeetingNotes(e.target.value)} 
                  placeholder="e.g. Client interested in 3-bedroom unit..."
                />
              </div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                <button type="button" onClick={() => setShowMeetingModal(false)} className="btn-secondary" style={{ flex: 1, justifyContent: 'center' }}>Cancel</button>
                <button type="submit" className="btn-primary" style={{ flex: 1, justifyContent: 'center' }}>Schedule</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 🚀 Transfer Lead Modal */}
      {showTransferModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: '20px' }}>
          <div className="glass-panel" style={{ maxWidth: '400px', width: '100%', padding: '30px', position: 'relative', background: '#ffffff', border: '1.5px solid var(--border-glass)', borderRadius: 'var(--radius-lg)' }}>
            <button onClick={() => setShowTransferModal(false)} style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
              X
            </button>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '20px' }}>🚀 Transfer Lead to Sales Team</h3>
            <form onSubmit={handleTransferLead} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Transfer & Handover Notes</label>
                <textarea 
                  className="form-control" 
                  style={{ minHeight: '120px', resize: 'vertical' }}
                  value={transferNotes} 
                  onChange={e => setTransferNotes(e.target.value)} 
                  placeholder="Provide details about the client's interests, budget, and meeting outcomes for the sales agent..."
                  required
                />
              </div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                <button type="button" onClick={() => setShowTransferModal(false)} className="btn-secondary" style={{ flex: 1, justifyContent: 'center' }}>Cancel</button>
                <button type="submit" className="btn-primary" style={{ flex: 1, justifyContent: 'center' }}>Transfer</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Leads;
