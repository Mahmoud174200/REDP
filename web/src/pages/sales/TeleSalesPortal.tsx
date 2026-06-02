import React, { useState, useEffect } from 'react';
import { Users, Plus, PhoneCall, Calendar, ArrowRight, ClipboardList, MapPin } from 'lucide-react';
import api from '../../services/api';
import { ToastContainer } from '../../components/Toast';

const TeleSalesPortal: React.FC = () => {
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
    new_leads: 0,
    contacted: 0,
    meetings_scheduled: 0,
    transferred: 0
  });
  const [leads, setLeads] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Forms
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [source, setSource] = useState('direct');
  const [notes, setNotes] = useState('');
  const [budget, setBudget] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('installment');
  const [interestedProjectId, setInterestedProjectId] = useState('');

  // Selected Lead Modals
  const [selectedLead, setSelectedLead] = useState<any | null>(null);
  const [modalType, setModalType] = useState<'contact' | 'meeting' | 'transfer' | null>(null);

  // Modal Inputs
  const [contactType, setContactType] = useState('call');
  const [contactNotes, setContactNotes] = useState('');
  const [meetingDate, setMeetingDate] = useState('');
  const [meetingLocation, setMeetingLocation] = useState('Company HQ Office');
  const [meetingNotes, setMeetingNotes] = useState('');
  const [transferNotes, setTransferNotes] = useState('');

  const fetchPortalData = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch Stats
      const statsRes = await api.get('/v1/sales/tele/dashboard');
      if (statsRes.data && statsRes.data.success) {
        setStats(statsRes.data.stats);
      }

      // 2. Fetch Leads
      const leadsRes = await api.get('/v1/sales/tele/leads');
      if (leadsRes.data && leadsRes.data.success) {
        setLeads(leadsRes.data.data.data || []);
      }

      // 3. Fetch Projects (Basic only)
      const projectsRes = await api.get('/v1/sales/tele/projects');
      if (projectsRes.data && projectsRes.data.success) {
        setProjects(projectsRes.data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch Tele-Sales portal data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPortalData();
  }, []);

  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName || !lastName || !phone) return;

    try {
      setIsLoading(true);
      const res = await api.post('/v1/sales/tele/leads', {
        first_name: firstName,
        last_name: lastName,
        email: email || undefined,
        phone,
        source,
        notes,
        budget: budget ? parseFloat(budget) : undefined,
        payment_method: paymentMethod,
        interested_project_id: interestedProjectId || undefined
      });
      if (res.data && res.data.success) {
        setFirstName('');
        setLastName('');
        setEmail('');
        setPhone('');
        setNotes('');
        setBudget('');
        setPaymentMethod('installment');
        setInterestedProjectId('');
        await fetchPortalData();
        showToast('Lead captured successfully!', 'success');
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to capture lead.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLead || !contactNotes) return;

    try {
      setIsLoading(true);
      const res = await api.put(`/v1/sales/tele/leads/${selectedLead.id}/contact`, {
        type: contactType,
        notes: contactNotes
      });
      if (res.data && res.data.success) {
        setContactNotes('');
        setModalType(null);
        setSelectedLead(null);
        await fetchPortalData();
        showToast('Contact logged successfully.', 'success');
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to log contact.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleScheduleMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLead || !meetingDate) return;

    try {
      setIsLoading(true);
      const res = await api.put(`/v1/sales/tele/leads/${selectedLead.id}/schedule-meeting`, {
        meeting_date: meetingDate,
        location: meetingLocation,
        notes: meetingNotes
      });
      if (res.data && res.data.success) {
        setMeetingDate('');
        setMeetingNotes('');
        setModalType(null);
        setSelectedLead(null);
        await fetchPortalData();
        showToast('Viewing meeting scheduled successfully!', 'success');
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to schedule meeting.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLead) return;

    try {
      setIsLoading(true);
      const res = await api.put(`/v1/sales/tele/leads/${selectedLead.id}/transfer`, {
        notes: transferNotes
      });
      if (res.data && res.data.success) {
        setTransferNotes('');
        setModalType(null);
        setSelectedLead(null);
        await fetchPortalData();
        showToast('Lead escalated to Company Sales (Tier 3) successfully.', 'success');
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to transfer lead.', 'error');
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px', position: 'relative' }}>
      
      {/* Header Panel */}
      <div className="glass-panel" style={{ padding: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '6px' }}>📞 Tele-Sales Dashboard (Tier 1)</h1>
          <p style={{ color: 'var(--text-muted)' }}>Create leads, document initial calls, book viewings, and hand over to company sales.</p>
        </div>
        <div style={{ padding: '6px 12px', background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 'var(--radius-sm)' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-primary)' }}>Sales Tier 1 Portal</span>
        </div>
      </div>

      {/* Stats Counter */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '20px' }}>
        <div className="glass-panel" style={{ padding: '20px', textAlign: 'center' }}>
          <h4 style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>My Leads</h4>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 800, margin: '8px 0 0 0' }}>{stats.total_leads}</h2>
        </div>
        <div className="glass-panel" style={{ padding: '20px', textAlign: 'center' }}>
          <h4 style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>New</h4>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 800, margin: '8px 0 0 0', color: 'var(--color-warning)' }}>{stats.new_leads}</h2>
        </div>
        <div className="glass-panel" style={{ padding: '20px', textAlign: 'center' }}>
          <h4 style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Contacted</h4>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 800, margin: '8px 0 0 0', color: 'var(--color-primary)' }}>{stats.contacted}</h2>
        </div>
        <div className="glass-panel" style={{ padding: '20px', textAlign: 'center' }}>
          <h4 style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Meetings Booked</h4>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 800, margin: '8px 0 0 0', color: 'var(--color-success)' }}>{stats.meetings_scheduled}</h2>
        </div>
        <div className="glass-panel" style={{ padding: '20px', textAlign: 'center' }}>
          <h4 style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Transferred (T3)</h4>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 800, margin: '8px 0 0 0', color: '#8b5cf6' }}>{stats.transferred}</h2>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '30px', alignItems: 'start' }}>
        
        {/* Left Hand Capture Form */}
        <div className="glass-panel" style={{ padding: '25px' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Plus style={{ color: 'var(--color-primary)' }} />
            Capture New Lead
          </h3>
          <form onSubmit={handleCreateLead} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">First Name</label>
                <input type="text" className="form-control" value={firstName} onChange={e => setFirstName(e.target.value)} required />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Last Name</label>
                <input type="text" className="form-control" value={lastName} onChange={e => setLastName(e.target.value)} required />
              </div>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Phone Number</label>
              <input type="text" className="form-control" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+20100..." required />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Email Address</label>
              <input type="email" className="form-control" value={email} onChange={e => setEmail(e.target.value)} placeholder="optional" />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Source</label>
              <select className="form-control" value={source} onChange={e => setSource(e.target.value)}>
                <option value="direct">Direct Walk-In</option>
                <option value="facebook">Facebook Ads</option>
                <option value="google">Google Search</option>
                <option value="tiktok">TikTok Video</option>
                <option value="referral">Referral Code</option>
              </select>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Budget (EGP)</label>
                <input type="number" className="form-control" value={budget} onChange={e => setBudget(e.target.value)} placeholder="e.g. 5000000" />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Payment Method</label>
                <select className="form-control" value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}>
                  <option value="installment">Installment (أقساط)</option>
                  <option value="cash">Cash (كاش)</option>
                </select>
              </div>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Interested Project</label>
              <select className="form-control" value={interestedProjectId} onChange={e => setInterestedProjectId(e.target.value)}>
                <option value="">-- Choose Project --</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Initial Notes</label>
              <textarea className="form-control" style={{ height: '70px', resize: 'none' }} value={notes} onChange={e => setNotes(e.target.value)} placeholder="What is the customer looking for?" />
            </div>
            <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '12px' }}>
              Create Lead Profile
            </button>
          </form>
        </div>

        {/* Right Hand Leads List & Operations */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
          
          {/* Active Leads List */}
          <div className="glass-panel" style={{ padding: '25px' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Users style={{ color: 'var(--color-warning)' }} />
              My Assigned Leads Queue
            </h3>
            <div style={{ overflowX: 'auto' }}>
              <table className="premium-table">
                <thead>
                  <tr>
                    <th>Customer Name</th>
                    <th>Phone / Email</th>
                    <th>Pipeline Status</th>
                    <th>Actions & Operations</th>
                  </tr>
                </thead>
                <tbody>
                  {leads.length === 0 ? (
                    <tr>
                      <td colSpan={4} style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>No leads currently assigned to you.</td>
                    </tr>
                  ) : (
                    leads.map(lead => (
                      <tr key={lead.id}>
                        <td>
                          <strong>{lead.first_name} {lead.last_name}</strong>
                          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>ID: {lead.id.substring(0, 8)}...</div>
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
                        </td>
                        <td>
                          <div>{lead.phone}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{lead.email || 'No email'}</div>
                        </td>
                        <td>
                          <span className={`badge badge-${lead.status === 'new' ? 'warning' : lead.status === 'visit_scheduled' ? 'success' : 'info'}`}>
                            {lead.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button
                              onClick={() => { setSelectedLead(lead); setModalType('contact'); }}
                              className="btn-secondary"
                              style={{ padding: '6px 10px', fontSize: '0.7rem' }}
                              title="Log Call/Contact"
                            >
                              <PhoneCall style={{ width: '12px', height: '12px', marginRight: '4px' }} /> Contact
                            </button>
                            <button
                              onClick={() => { setSelectedLead(lead); setModalType('meeting'); }}
                              className="btn-secondary"
                              style={{ padding: '6px 10px', fontSize: '0.7rem' }}
                              title="Book Viewing Meeting"
                              disabled={lead.status === 'visit_scheduled'}
                            >
                              <Calendar style={{ width: '12px', height: '12px', marginRight: '4px' }} /> Meet
                            </button>
                            <button
                              onClick={() => { setSelectedLead(lead); setModalType('transfer'); }}
                              className="btn-primary"
                              style={{ padding: '6px 10px', fontSize: '0.7rem', background: '#8b5cf6', borderColor: '#7c3aed' }}
                              title="Transfer to Company Sales"
                            >
                              <ArrowRight style={{ width: '12px', height: '12px', marginRight: '4px' }} /> Send (T3)
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Project Browsing List (Read-Only) */}
          <div className="glass-panel" style={{ padding: '25px' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <ClipboardList style={{ color: 'var(--color-success)' }} />
              Compound Projects Reference (Tier 1 Read-Only)
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '15px' }}>
              ⚠️ You have read-only access to compound names and locations. Inventory unit pricing is restricted.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              {projects.map(proj => (
                <div key={proj.id} className="glass-panel" style={{ padding: '15px', background: 'rgba(255,255,255,0.3)' }}>
                  <h4 style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '4px' }}>🏢 {proj.name}</h4>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    <MapPin style={{ width: '12px', height: '12px' }} />
                    {proj.location}
                  </div>
                  <span className="badge badge-info" style={{ marginTop: '8px', fontSize: '0.65rem' }}>{proj.status}</span>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

      {/* MODALS */}
      {modalType === 'contact' && selectedLead && (
        <div className="modal-backdrop">
          <div className="glass-panel modal-content" style={{ width: '100%', maxWidth: '450px', padding: '30px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h3 style={{ fontWeight: 800 }}>Log Contact: {selectedLead.first_name}</h3>
            <form onSubmit={handleLogContact} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="form-group">
                <label className="form-label">Contact Channel</label>
                <select className="form-control" value={contactType} onChange={e => setContactType(e.target.value)}>
                  <option value="call">VoIP Phone Call</option>
                  <option value="whatsapp">WhatsApp Text</option>
                  <option value="email">Marketing Email</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Conversation Notes</label>
                <textarea className="form-control" value={contactNotes} onChange={e => setContactNotes(e.target.value)} placeholder="Summary of the call/chat..." style={{ height: '100px' }} required />
              </div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button type="button" className="btn-secondary" onClick={() => { setModalType(null); setSelectedLead(null); }}>Cancel</button>
                <button type="submit" className="btn-primary">Save Interaction</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {modalType === 'meeting' && selectedLead && (
        <div className="modal-backdrop">
          <div className="glass-panel modal-content" style={{ width: '100%', maxWidth: '450px', padding: '30px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h3 style={{ fontWeight: 800 }}>Book Viewing Meeting</h3>
            <form onSubmit={handleScheduleMeeting} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="form-group">
                <label className="form-label">Meeting Date & Time</label>
                <input type="datetime-local" className="form-control" value={meetingDate} onChange={e => setMeetingDate(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Viewing Office Location</label>
                <input type="text" className="form-control" value={meetingLocation} onChange={e => setMeetingLocation(e.target.value)} placeholder="Company Office address" />
              </div>
              <div className="form-group">
                <label className="form-label">Meeting Setup Notes</label>
                <textarea className="form-control" value={meetingNotes} onChange={e => setMeetingNotes(e.target.value)} placeholder="Any special arrangements?" style={{ height: '70px' }} />
              </div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button type="button" className="btn-secondary" onClick={() => { setModalType(null); setSelectedLead(null); }}>Cancel</button>
                <button type="submit" className="btn-primary">Confirm Booking</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {modalType === 'transfer' && selectedLead && (
        <div className="modal-backdrop">
          <div className="glass-panel modal-content" style={{ width: '100%', maxWidth: '450px', padding: '30px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h3 style={{ fontWeight: 800 }}>Escalate Lead to Tier 3</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              This moves the lead to the Company Sales Representative pool. You will hand over responsibility.
            </p>
            <form onSubmit={handleTransfer} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="form-group">
                <label className="form-label">Handover Handshake Notes</label>
                <textarea className="form-control" value={transferNotes} onChange={e => setTransferNotes(e.target.value)} placeholder="Summarize client profile and readiness to finalize booking..." style={{ height: '100px' }} />
              </div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button type="button" className="btn-secondary" onClick={() => { setModalType(null); setSelectedLead(null); }}>Cancel</button>
                <button type="submit" className="btn-primary" style={{ background: '#8b5cf6', borderColor: '#7c3aed' }}>Confirm Transfer</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
};

export default TeleSalesPortal;

