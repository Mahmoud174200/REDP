import React, { useState, useEffect } from 'react';
import { Users, ClipboardList, Send, ShieldCheck, CheckCircle2, Milestone, DollarSign, ListFilter, AlertCircle, ShoppingCart } from 'lucide-react';
import api from '../../services/api';
import { ToastContainer } from '../../components/Toast';

const CompanySalesPortal: React.FC = () => {
  const [toasts, setToasts] = useState<{ id: string; message: string; type: 'success' | 'error' | 'info' }[]>([]);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const renderMetadata = (metadata: any) => {
    if (!metadata || typeof metadata !== 'object') return null;

    const items: { label: string; value: string; icon: string }[] = [];

    if (metadata.source) {
      items.push({ label: 'Source', value: metadata.source, icon: '📍' });
    }
    if (metadata.interaction_type) {
      items.push({ label: 'Interaction Channel', value: metadata.interaction_type, icon: '💬' });
    }
    if (metadata.meeting_date) {
      const formattedDate = new Date(metadata.meeting_date).toLocaleString(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short'
      });
      items.push({ label: 'Meeting Date', value: formattedDate, icon: '📅' });
    }
    if (metadata.location) {
      items.push({ label: 'Location', value: metadata.location, icon: '🏢' });
    }
    if (metadata.from_tier || metadata.to_tier) {
      const from = (metadata.from_tier || '').replace('tier_', 'Tier ');
      const to = (metadata.to_tier || '').replace('tier_', 'Tier ');
      items.push({ label: 'Tier Escalation', value: `${from} ➔ ${to}`, icon: '⚡' });
    }
    if (metadata.notes) {
      items.push({ label: 'Notes', value: metadata.notes, icon: '📝' });
    }
    if (metadata.unit_number) {
      items.push({ label: 'Unit Number', value: `#${metadata.unit_number}`, icon: '🔑' });
    }
    if (metadata.price) {
      items.push({ label: 'Unit Price', value: `${parseFloat(metadata.price).toLocaleString()} EGP`, icon: '💰' });
    }
    if (metadata.eoi_amount) {
      items.push({ label: 'EOI Amount', value: `${parseFloat(metadata.eoi_amount).toLocaleString()} EGP`, icon: '💵' });
    }

    if (items.length > 0) {
      return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px', marginTop: '8px', padding: '10px 14px', background: 'rgba(255,255,255,0.4)', border: '1px solid rgba(50, 71, 58, 0.08)', borderLeft: '4px solid var(--color-primary)', borderRadius: 'var(--radius-sm)' }}>
          {items.map((item, idx) => (
            <div key={idx} style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '0.9rem' }}>{item.icon}</span>
              <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>{item.label}:</span>
              <strong style={{ color: 'var(--text-main)' }}>{item.value}</strong>
            </div>
          ))}
        </div>
      );
    }

    return (
      <pre style={{ margin: '4px 0 0 0', padding: '6px', background: 'rgba(0,0,0,0.03)', borderRadius: 'var(--radius-xs)', fontSize: '0.7rem', overflowX: 'auto', fontFamily: 'monospace' }}>
        {JSON.stringify(metadata, null, 2)}
      </pre>
    );
  };

  const [stats, setStats] = useState<any>({
    pipeline: { total_leads: 0, tier_1: 0, tier_2: 0, tier_3: 0, my_leads: 0 },
    bookings: { total_confirmed: 0 },
    revenue: { sold_value: 0, reserved_value: 0 }
  });
  const [leads, setLeads] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Journey Log States
  const [journeyLead, setJourneyLead] = useState<any | null>(null);
  const [journeyLogs, setJourneyLogs] = useState<any[]>([]);
  const [journeyPresentations, setJourneyPresentations] = useState<any[]>([]);
  const [showJourneyModal, setShowJourneyModal] = useState(false);

  // Booking Modal States
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedLeadForBooking, setSelectedLeadForBooking] = useState<any | null>(null);
  const [bookingUnitId, setBookingUnitId] = useState('');
  const [bookingEoi, setBookingEoi] = useState('50000');
  const [bookingNotes, setBookingNotes] = useState('');

  // Unit Status Modal
  const [selectedUnit, setSelectedUnit] = useState<any | null>(null);
  const [unitStatusInput, setUnitStatusInput] = useState('available');
  const [unitStatusReason, setUnitStatusReason] = useState('');
  const [showUnitModal, setShowUnitModal] = useState(false);

  const fetchPortalData = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch Dashboard Stats
      const statsRes = await api.get('/v1/sales/company/dashboard');
      if (statsRes.data && statsRes.data.success) {
        setStats(statsRes.data.stats);
      }

      // 2. Fetch Leads
      const leadsRes = await api.get('/v1/sales/company/leads');
      if (leadsRes.data && leadsRes.data.success) {
        setLeads(leadsRes.data.data.data || []);
      }

      // 3. Fetch Units
      const unitsRes = await api.get('/v1/sales/company/units');
      if (unitsRes.data && unitsRes.data.success) {
        setUnits(unitsRes.data.data || []);
      }

      // 4. Fetch Transactions
      const transRes = await api.get('/v1/sales/company/transactions');
      if (transRes.data && transRes.data.success) {
        setTransactions(transRes.data.data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch Company Sales portal data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPortalData();
  }, []);

  const handleAssignToSelf = async (leadId: string) => {
    try {
      setIsLoading(true);
      const res = await api.put(`/v1/sales/company/leads/${leadId}/assign`);
      if (res.data && res.data.success) {
        await fetchPortalData();
        showToast('Lead successfully assigned to you.', 'success');
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to assign lead.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewJourney = async (lead: any) => {
    try {
      setIsLoading(true);
      const res = await api.get(`/v1/sales/company/leads/${lead.id}/journey`);
      if (res.data && res.data.success) {
        setJourneyLead(res.data.lead);
        setJourneyLogs(res.data.journey || []);
        setJourneyPresentations(res.data.presentations || []);
        setShowJourneyModal(true);
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to fetch journey details.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLeadForBooking || !bookingUnitId) return;

    try {
      setIsLoading(true);
      const res = await api.post('/v1/sales/company/bookings', {
        lead_id: selectedLeadForBooking.id,
        unit_id: bookingUnitId,
        eoi_amount: parseFloat(bookingEoi),
        notes: bookingNotes
      });
      if (res.data && res.data.success) {
        setBookingUnitId('');
        setBookingNotes('');
        setShowBookingModal(false);
        setSelectedLeadForBooking(null);
        await fetchPortalData();
        showToast('Booking executed successfully! Unit reserved, and client credentials created.', 'success');
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to execute booking.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateUnitStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUnit) return;

    try {
      setIsLoading(true);
      const res = await api.put(`/v1/sales/company/units/${selectedUnit.id}/status`, {
        status: unitStatusInput,
        reason: unitStatusReason
      });
      if (res.data && res.data.success) {
        setUnitStatusReason('');
        setShowUnitModal(false);
        setSelectedUnit(null);
        await fetchPortalData();
        showToast('Unit status updated successfully.', 'success');
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to update unit status.', 'error');
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px', position: 'relative' }}>
      
      {/* Header Panel */}
      <div className="glass-panel" style={{ padding: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '6px' }}>🏢 Company Sales Portal (Tier 3)</h1>
          <p style={{ color: 'var(--text-muted)' }}>Oversee the complete lead lifecycle journey, execute reservations, and configure inventory status.</p>
        </div>
        <div style={{ padding: '6px 12px', background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: 'var(--radius-sm)' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#8b5cf6' }}>Sales Tier 3 Portal</span>
        </div>
      </div>

      {/* Stats Board */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div style={{ padding: '12px', background: 'rgba(59,130,246,0.1)', color: 'var(--color-primary)', borderRadius: 'var(--radius-sm)' }}>
            <Users style={{ width: '24px', height: '24px' }} />
          </div>
          <div>
            <h4 style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-muted)', margin: 0 }}>Lead Pipeline</h4>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: '4px 0 0 0' }}>
              {stats.pipeline.total_leads} <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-muted)' }}>(My: {stats.pipeline.my_leads})</span>
            </h2>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div style={{ padding: '12px', background: 'rgba(245,158,11,0.1)', color: 'var(--color-warning)', borderRadius: 'var(--radius-sm)' }}>
            <Milestone style={{ width: '24px', height: '24px' }} />
          </div>
          <div>
            <h4 style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-muted)', margin: 0 }}>Tiers Distribution</h4>
            <h5 style={{ fontSize: '0.75rem', fontWeight: 700, margin: '4px 0 0 0' }}>
              T1: {stats.pipeline.tier_1} | T2: {stats.pipeline.tier_2} | T3: {stats.pipeline.tier_3}
            </h5>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div style={{ padding: '12px', background: 'rgba(16,185,129,0.1)', color: 'var(--color-success)', borderRadius: 'var(--radius-sm)' }}>
            <ShoppingCart style={{ width: '24px', height: '24px' }} />
          </div>
          <div>
            <h4 style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-muted)', margin: 0 }}>Bookings Done</h4>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: '4px 0 0 0', color: 'var(--color-success)' }}>
              {stats.bookings.total_confirmed}
            </h2>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div style={{ padding: '12px', background: 'rgba(139,92,246,0.1)', color: '#8b5cf6', borderRadius: 'var(--radius-sm)' }}>
            <DollarSign style={{ width: '24px', height: '24px' }} />
          </div>
          <div>
            <h4 style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-muted)', margin: 0 }}>Inventory Sold</h4>
            <h5 style={{ fontSize: '0.72rem', fontWeight: 700, margin: '4px 0 0 0' }}>
              Sold: {stats.revenue.sold_value.toLocaleString()} EGP
            </h5>
          </div>
        </div>
      </div>

      {/* Main Grid Panels */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '30px' }}>
        
        {/* Leads and Journeys */}
        <div className="glass-panel" style={{ padding: '25px' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Users style={{ color: 'var(--color-primary)' }} />
            Leads Pipeline Operations
          </h3>
          <div style={{ overflowX: 'auto' }}>
            <table className="premium-table">
              <thead>
                <tr>
                  <th>Client Profile</th>
                  <th>Tier & Owner</th>
                  <th>Lifecycle Status</th>
                  <th>Operations</th>
                </tr>
              </thead>
              <tbody>
                {leads.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>No leads in system.</td>
                  </tr>
                ) : (
                  leads.map(lead => (
                    <tr key={lead.id}>
                      <td>
                        <strong>{lead.first_name} {lead.last_name}</strong>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>📞 {lead.phone} | {lead.email}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Nat. ID: {lead.national_id || 'N/A'}</div>
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
                        <span className={`badge badge-${lead.current_tier === 'tier_3' ? 'success' : lead.current_tier === 'tier_2' ? 'primary' : 'warning'}`} style={{ marginRight: '6px' }}>
                          {lead.current_tier.toUpperCase()}
                        </span>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                          Agent: {lead.company_sales_agent?.name || 'Unassigned'}
                        </div>
                      </td>
                      <td>
                        <span className={`badge badge-${lead.status === 'reserved' ? 'success' : lead.status === 'contracted' ? 'info' : 'warning'}`}>
                          {lead.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            onClick={() => handleViewJourney(lead)}
                            className="btn-secondary"
                            style={{ padding: '6px 12px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                          >
                            <Milestone style={{ width: '12px', height: '12px' }} /> View Journey
                          </button>
                          
                          {!lead.company_sales_agent_id ? (
                            <button
                              onClick={() => handleAssignToSelf(lead.id)}
                              className="btn-secondary"
                              style={{ padding: '6px 12px', fontSize: '0.75rem' }}
                            >
                              Assign to Me
                            </button>
                          ) : lead.status !== 'reserved' && lead.status !== 'contracted' ? (
                            <button
                              onClick={() => { setSelectedLeadForBooking(lead); setShowBookingModal(true); }}
                              className="btn-primary"
                              style={{ padding: '6px 12px', fontSize: '0.75rem', background: 'var(--color-success)', borderColor: 'var(--color-success)' }}
                            >
                              Execute Booking
                            </button>
                          ) : (
                            <span style={{ color: 'var(--color-success)', fontSize: '0.75rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                              Booking Done
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Units and Status Panel */}
        <div className="glass-panel" style={{ padding: '25px' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ShoppingCart style={{ color: 'var(--color-warning)' }} />
            Inventory Status Configuration
          </h3>
          <div style={{ overflowX: 'auto', maxHeight: '400px', overflowY: 'auto' }} className="sidebar-scroll-container">
            <table className="premium-table">
              <thead>
                <tr>
                  <th>Unit ID</th>
                  <th>Compound Project</th>
                  <th>Floor & Type</th>
                  <th>Price</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {units.map(unit => (
                  <tr key={unit.id}>
                    <td><strong>{unit.unit_number}</strong></td>
                    <td>{unit.project?.name}</td>
                    <td>Floor {unit.floor} ({unit.type})</td>
                    <td><strong>{unit.price?.toLocaleString()} EGP</strong></td>
                    <td>
                      <span className={`badge badge-${
                        unit.status === 'available' ? 'success' :
                        unit.status === 'reserved' ? 'warning' :
                        unit.status === 'sold' ? 'info' : 'danger'
                      }`}>
                        {unit.status}
                      </span>
                    </td>
                    <td>
                      <button
                        onClick={() => { setSelectedUnit(unit); setUnitStatusInput(unit.status); setShowUnitModal(true); }}
                        className="btn-secondary"
                        style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                      >
                        Change Status
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Transactions & Audit Logs Panel */}
        <div className="glass-panel" style={{ padding: '25px' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ClipboardList style={{ color: 'var(--color-success)' }} />
            Reservations and Contracts Transactions Log
          </h3>
          <div style={{ overflowX: 'auto' }}>
            <table className="premium-table">
              <thead>
                <tr>
                  <th>Reservation ID</th>
                  <th>Client</th>
                  <th>Unit Number</th>
                  <th>EOI Amount</th>
                  <th>Contract Generated</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>No bookings executed yet.</td>
                  </tr>
                ) : (
                  transactions.map(txn => (
                    <tr key={txn.id}>
                      <td><span style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>{txn.id.substring(0, 18)}...</span></td>
                      <td><strong>{txn.client?.name}</strong></td>
                      <td><strong>{txn.unit?.unit_number}</strong> ({txn.unit?.project?.name})</td>
                      <td><strong>{txn.eoi_amount?.toLocaleString()} EGP</strong></td>
                      <td>
                        {txn.contract ? (
                          <span className="badge badge-success">Signed: {txn.contract.contract_number}</span>
                        ) : (
                          <span className="badge badge-warning">Awaiting Signature</span>
                        )}
                      </td>
                      <td>{new Date(txn.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* 🧭 TIMELINE CLIENT JOURNEY MODAL */}
      {showJourneyModal && journeyLead && (
        <div className="modal-backdrop">
          <div className="glass-panel modal-content" style={{ width: '100%', maxWidth: '600px', padding: '30px', display: 'flex', flexDirection: 'column', gap: '20px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-glass)', paddingBottom: '10px' }}>
              <h3 style={{ fontWeight: 800 }}>Journey Timeline: {journeyLead.first_name} {journeyLead.last_name}</h3>
              <span className="badge badge-info">{journeyLead.source} source</span>
            </div>

            {/* Broker presentations */}
            {journeyPresentations.length > 0 && (
              <div>
                <h4 style={{ fontSize: '0.85rem', fontWeight: 850, color: 'var(--color-primary)', marginBottom: '8px' }}>Broker Presentations Shown:</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '15px' }}>
                  {journeyPresentations.map(p => (
                    <div key={p.id} style={{ padding: '12px', background: 'rgba(255,255,255,0.4)', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.5)' }}>
                      <strong>Agency:</strong> {p.broker?.name || 'External'} | <strong>Project:</strong> {p.project?.name}
                      {p.presentation_notes && <p style={{ margin: '4px 0 0 0', fontStyle: 'italic', color: 'var(--text-muted)' }}>Notes: "{p.presentation_notes}"</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Journey Logs */}
            <h4 style={{ fontSize: '0.85rem', fontWeight: 850, color: 'var(--color-primary)', marginBottom: '8px' }}>Audited Transitions Timeline:</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', position: 'relative', paddingLeft: '20px', borderLeft: '2px solid rgba(44,62,50,0.1)' }}>
              {journeyLogs.map((log, idx) => (
                <div key={log.id} style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', left: '-27px', top: '2px', width: '12px', height: '12px', borderRadius: '50%', background: 'var(--color-primary)', border: '2px solid #ffffff' }} />
                  <div style={{ fontSize: '0.8rem' }}>
                    <strong style={{ textTransform: 'capitalize', color: 'var(--text-main)' }}>{log.stage.replace(/_/g, ' ')}</strong>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Done by: {log.actor?.name || 'System'} ({log.actor_role}) on {new Date(log.created_at).toLocaleString()}
                    </div>
                    {log.metadata && renderMetadata(log.metadata)}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
              <button className="btn-secondary" onClick={() => { setShowJourneyModal(false); setJourneyLead(null); }}>Close Journey</button>
            </div>
          </div>
        </div>
      )}

      {/* EXECUTE BOOKING MODAL */}
      {showBookingModal && selectedLeadForBooking && (
        <div className="modal-backdrop">
          <div className="glass-panel modal-content" style={{ width: '100%', maxWidth: '480px', padding: '30px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h3 style={{ fontWeight: 800 }}>Execute Booking & Reservation</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Reserve an inventory unit for <strong>{selectedLeadForBooking.first_name} {selectedLeadForBooking.last_name}</strong>.
            </p>
            <form onSubmit={handleCreateBooking} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="form-group">
                <label className="form-label">Select Available Unit</label>
                <select className="form-control" value={bookingUnitId} onChange={e => setBookingUnitId(e.target.value)} required>
                  <option value="">-- Choose Unit --</option>
                  {units.filter(u => u.status === 'available').map(unit => (
                    <option key={unit.id} value={unit.id}>
                      {unit.unit_number} - {unit.price?.toLocaleString()} EGP ({unit.project?.name} / {unit.type})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">EOI Booking Payment (EGP)</label>
                <input type="number" className="form-control" value={bookingEoi} onChange={e => setBookingEoi(e.target.value)} required />
              </div>

              <div className="form-group">
                <label className="form-label">Booking Transaction Notes</label>
                <textarea className="form-control" value={bookingNotes} onChange={e => setBookingNotes(e.target.value)} placeholder="Installment payment timeline agreed details..." style={{ height: '70px' }} />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button type="button" className="btn-secondary" onClick={() => { setShowBookingModal(false); setSelectedLeadForBooking(null); }}>Cancel</button>
                <button type="submit" className="btn-primary" style={{ background: 'var(--color-success)', borderColor: 'var(--color-success)' }}>Confirm & Lock Booking</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* UPDATE UNIT STATUS MODAL */}
      {showUnitModal && selectedUnit && (
        <div className="modal-backdrop">
          <div className="glass-panel modal-content" style={{ width: '100%', maxWidth: '400px', padding: '30px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h3 style={{ fontWeight: 800 }}>Configure Unit Status: {selectedUnit.unit_number}</h3>
            <form onSubmit={handleUpdateUnitStatus} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="form-group">
                <label className="form-label">Unit Status</label>
                <select className="form-control" value={unitStatusInput} onChange={e => setUnitStatusInput(e.target.value)}>
                  <option value="available">Available (Open for sale)</option>
                  <option value="reserved">Reserved (Locked for client)</option>
                  <option value="sold">Sold (Ownership transferred)</option>
                  <option value="blocked">Blocked (Under maintenance/hold)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Status Change Reason</label>
                <input type="text" className="form-control" value={unitStatusReason} onChange={e => setUnitStatusReason(e.target.value)} placeholder="e.g. CEO manual hold" />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button type="button" className="btn-secondary" onClick={() => { setShowUnitModal(false); setSelectedUnit(null); }}>Cancel</button>
                <button type="submit" className="btn-primary">Update Status</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
};


export default CompanySalesPortal;
