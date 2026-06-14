import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { ToastContainer } from '../../components/Toast';

/* Helpers */
const statusLabel: Record<string, string> = {
  new: 'New',
  contacted: 'Contacted',
  interested: 'Interested',
  visit_scheduled: 'Visit Booked',
  transferred: 'Transferred',
  reserved: 'Reserved',
  contracted: 'Contracted'
};

const unitStatusBadge: Record<string, string> = {
  available: 'badge-success',
  reserved: 'badge-warning',
  sold: 'badge-danger',
  blocked: 'badge-info',
  pending_reservation: 'badge-warning'
};

const fmtPrice = (v: number | string | null) => {
  if (!v) return '—';
  return Number(v).toLocaleString('en-EG') + ' EGP';
};

const BrokerPortal: React.FC = () => {
  const [toasts, setToasts] = useState<{ id: string; message: string; type: 'success' | 'error' | 'info' }[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'inventory' | 'leads' | 'submissions' | 'commissions' | 'marketing'>('overview');
  
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Data States
  const [stats, setStats] = useState<any>({
    total_leads: 0,
    total_presentations: 0,
    pending_presentations: 0,
    escalated_to_sales: 0,
    conversion_rate: 0,
    total_commissioned: 0,
    approved_commission: 0,
    paid_commission: 0,
    pending_commission: 0,
    available_balance: 0
  });

  const [leads, setLeads] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [reservations, setReservations] = useState<any[]>([]);
  const [payouts, setPayouts] = useState<any[]>([]);
  const [commissions, setCommissions] = useState<any[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');

  /* new broker states */
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [commissionRules, setCommissionRules] = useState<any[]>([]);
  const [subordinatesPerformance, setSubordinatesPerformance] = useState<any[]>([]);
  const [commissionsHistory, setCommissionsHistory] = useState<any[]>([]);
  
  // Filter States
  const [unitFilterStatus, setUnitFilterStatus] = useState<string>('all');
  const [unitFilterType, setUnitFilterType] = useState<string>('all');
  const [unitSearchQuery, setUnitSearchQuery] = useState<string>('');

  // Modal / Form States
  const [showLeadModal, setShowLeadModal] = useState(false);
  const [showReserveModal, setShowReserveModal] = useState(false);
  const [showPayoutModal, setShowPayoutModal] = useState(false);

  // Form Field States
  const [leadForm, setLeadForm] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    email: '',
    national_id: '',
    budget: '',
    payment_method: 'installments',
    interested_project_id: ''
  });

  const [reserveForm, setReserveForm] = useState({
    unit_id: '',
    client_id: '', // lead_id
    eoi_amount: '50000',
    receipt: null as File | null
  });

  const [payoutForm, setPayoutForm] = useState({
    amount: '',
    invoice: null as File | null
  });

  const [selectedUnitObj, setSelectedUnitObj] = useState<any | null>(null);
  const [selectedUnit, setSelectedUnit] = useState<any | null>(null); // Premium specifications modal

  const fetchAllData = async () => {
    setIsLoading(true);
    try {
      const storedUser = localStorage.getItem('redp_user');
      let userObj: any = null;
      if (storedUser) {
        try {
          userObj = JSON.parse(storedUser);
          setCurrentUser(userObj);
        } catch (e) {
          console.error(e);
        }
      }

      // 1. Fetch Stats
      const statsRes = await api.get('/v1/sales/broker/dashboard');
      if (statsRes.data && statsRes.data.success) {
        setStats((prev: any) => ({ ...prev, ...statsRes.data.stats }));
        setCommissionRules(statsRes.data.commission_rules || []);
        setSubordinatesPerformance(statsRes.data.subordinates_performance || []);
        setCommissionsHistory(statsRes.data.commissions_history || []);
      }

      // 2. Fetch Projects
      const projectsRes = await api.get('/v1/sales/broker/projects');
      if (projectsRes.data && projectsRes.data.success) {
        setProjects(projectsRes.data.data || []);
        if (projectsRes.data.data?.length > 0 && !selectedProjectId) {
          setSelectedProjectId(projectsRes.data.data[0].id);
        }
      }

      // 3. Fetch Leads
      const leadsRes = await api.get('/v1/sales/broker/leads');
      if (leadsRes.data && leadsRes.data.success) {
        setLeads(leadsRes.data.data.data || []);
      }

      // 4. Fetch Reservations
      const resRes = await api.get('/v1/sales/broker/reservations');
      if (resRes.data && resRes.data.success) {
        setReservations(resRes.data.data || []);
      }

      // 5. Fetch Payouts
      const payoutsRes = await api.get('/v1/sales/broker/payout-requests');
      if (payoutsRes.data && payoutsRes.data.success) {
        setPayouts(payoutsRes.data.data || []);
      }

      // 6. Fetch Leaderboard
      const leaderboardRes = await api.get('/v1/sales/broker/leaderboard');
      if (leaderboardRes.data && leaderboardRes.data.success) {
        setLeaderboard(leaderboardRes.data.data || []);
      }

      // 7. Fetch Commissions
      const brokerId = userObj?.broker?.id || (leadsRes.data?.data?.data?.length > 0 ? leadsRes.data.data.data[0].broker_id : '');
      if (brokerId) {
        const commsRes = await api.get(`/v1/acquisition/brokers/${brokerId}/commissions`);
        if (commsRes.data && commsRes.data.success) {
          setCommissions(commsRes.data.commissions.data || []);
          const metrics = commsRes.data.metrics || {};
          
          // Calculate requested payout sum
          const requestedPayoutSum = payoutsRes.data.data
            ?.filter((p: any) => p.status !== 'rejected')
            ?.reduce((acc: number, p: any) => acc + parseFloat(p.amount), 0) || 0;

          const approvedComm = parseFloat(metrics.approved_amount) || 0;
          setStats((prev: any) => ({
            ...prev,
            total_commissioned: parseFloat(metrics.total_commissioned) || 0,
            pending_commission: parseFloat(metrics.pending_amount) || 0,
            approved_commission: approvedComm,
            paid_commission: parseFloat(metrics.paid_amount) || 0,
            available_balance: Math.max(0, approvedComm - requestedPayoutSum)
          }));
        }
      }

    } catch (err) {
      console.error('Failed to fetch Broker portal data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // Fetch Units when Project is selected in Form/Tab
  useEffect(() => {
    if (!selectedProjectId) {
      setUnits([]);
      return;
    }
    const fetchUnits = async () => {
      try {
        const res = await api.get(`/v1/sales/broker/projects/${selectedProjectId}/units`, {
          params: {
            status: unitFilterStatus,
            type: unitFilterType
          }
        });
        if (res.data && res.data.success) {
          setUnits(res.data.data || []);
        }
      } catch (err) {
        console.error('Failed to fetch units for project:', err);
      }
    };
    fetchUnits();
  }, [selectedProjectId, unitFilterStatus, unitFilterType]);

  // Lead registration handler
  const handleRegisterLead = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post('/v1/sales/broker/leads', leadForm);
      if (res.data && res.data.success) {
        showToast(res.data.message || 'Client registered successfully under lock.', 'success');
        setLeadForm({
          first_name: '',
          last_name: '',
          phone: '',
          email: '',
          national_id: '',
          budget: '',
          payment_method: 'installments',
          interested_project_id: ''
        });
        setShowLeadModal(false);
        await fetchAllData();
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to register client lock.', 'error');
    }
  };

  // Reservation hold submission handler
  const handleReserveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reserveForm.unit_id || !reserveForm.client_id) return;
    try {
      const res = await api.post('/v1/sales/broker/reservations', {
        unit_id: reserveForm.unit_id,
        client_id: reserveForm.client_id,
        eoi_amount: 0.00
      });
      if (res.data && res.data.success) {
        showToast('Interest request submitted successfully!', 'success');
        setShowReserveModal(false);
        setReserveForm(prev => ({ ...prev, unit_id: '', client_id: '' }));
        setSelectedUnitObj(null);
        setSelectedUnit(null); // Close details modal if open
        await fetchAllData();
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to submit client interest request.', 'error');
    }
  };

  // Commission payout request submission handler
  const handlePayoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payoutForm.amount) return;
    try {
      const res = await api.post('/v1/sales/broker/payout-requests', {
        amount: parseFloat(payoutForm.amount)
      });
      if (res.data && res.data.success) {
        showToast('Invoice payout request submitted successfully!', 'success');
        setShowPayoutModal(false);
        setPayoutForm({ amount: '', invoice: null });
        await fetchAllData();
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to submit payout request.', 'error');
    }
  };

  // Unit filter search logic
  const filteredUnits = units.filter(unit => {
    if (!unitSearchQuery) return true;
    return unit.unit_number.toLowerCase().includes(unitSearchQuery.toLowerCase());
  });

  if (isLoading && leads.length === 0 && projects.length === 0) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', flexDirection: 'column', gap: '16px' }}>
        <div className="animate-spin" style={{ width: '40px', height: '40px', border: '4px solid var(--color-secondary)', borderTopColor: 'var(--color-primary)', borderRadius: '50%' }} />
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontFamily: 'var(--font-title)' }}>Loading dashboard…</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', position: 'relative' }}>
      
      {/* Premium Header Panel */}
      <div className="glass-panel" style={{ padding: '24px 30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <i className="fa-solid fa-handshake" style={{ color: 'var(--color-primary)' }}></i> Broker Mediation Dashboard
            {currentUser?.company ? (
              <span className="badge badge-info" style={{ fontSize: '0.72rem', fontWeight: 700 }}>
                🏢 {currentUser.company.name} Brokerage
              </span>
            ) : (
              <span className="badge badge-secondary" style={{ fontSize: '0.72rem', fontWeight: 700 }}>
                👤 Freelance Broker
              </span>
            )}
          </h1>
          <p style={{ margin: 0, color: 'var(--text-muted)' }}>Manage client locks, request unit reservation holds, download media assets, and track commission ledger</p>
        </div>
        <button onClick={() => setShowLeadModal(true)} className="btn-primary" style={{ gap: '8px' }}>
          <i className="fa-solid fa-plus" style={{ fontSize: '0.85rem' }}></i> Register Lead Lock
        </button>
      </div>

      {/* Tabs Navigation Switcher */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {[
          { key: 'overview' as const, label: 'Overview', icon: 'fa-solid fa-chart-pie' },
          { key: 'inventory' as const, label: 'Visual Inventory', icon: 'fa-solid fa-grip' },
          { key: 'leads' as const, label: 'Lead Protection Lock', icon: 'fa-solid fa-user-shield' },
          { key: 'submissions' as const, label: 'Interest & Hold Requests', icon: 'fa-solid fa-clipboard-list' },
          { key: 'commissions' as const, label: 'Commissions Ledger', icon: 'fa-solid fa-sack-dollar' },
          { key: 'marketing' as const, label: 'Marketing Hub', icon: 'fa-solid fa-folder-open' },
        ].map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={activeTab === tab.key ? 'btn-primary' : 'btn-secondary'}
            style={{ flex: 1, minWidth: '155px', justifyContent: 'center', padding: '10px 14px', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <i className={tab.icon}></i> {tab.label}
          </button>
        ))}
      </div>

      {/* TAB CONTENT: OVERVIEW */}
      {activeTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Stats Cards Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
            {[
              { label: 'My Locked Clients', value: `${stats.total_leads} leads`, icon: <i className="fa-solid fa-users" style={{ color: 'var(--color-primary)', fontSize: '1.2rem' }}></i> },
              { label: 'Pending Holds', value: `${reservations.filter(r => r.status === 'pending').length} holds`, icon: <i className="fa-solid fa-clock" style={{ color: 'var(--color-warning)', fontSize: '1.2rem' }}></i> },
              { label: 'Approved Commissions', value: `${stats.approved_commission.toLocaleString()} EGP`, icon: <i className="fa-solid fa-circle-check" style={{ color: 'var(--color-success)', fontSize: '1.2rem' }}></i> },
              { label: 'Available Balance', value: `${stats.available_balance.toLocaleString()} EGP`, icon: <i className="fa-solid fa-wallet" style={{ color: 'var(--color-info)', fontSize: '1.2rem' }}></i>, action: true },
            ].map(s => (
              <div key={s.label} className="glass-panel" style={{ padding: '18px', textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', alignItems: 'center', minHeight: '130px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                  <div style={{ marginBottom: '6px' }}>{s.icon}</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, fontFamily: 'var(--font-title)' }}>{s.value}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{s.label}</div>
                </div>
                {s.action && (
                  <button onClick={() => setShowPayoutModal(true)} className="btn-secondary" style={{ width: '100%', padding: '6px', fontSize: '0.72rem', marginTop: '10px', fontWeight: 700 }}>
                    <i className="fa-solid fa-file-invoice-dollar" style={{ marginRight: '4px' }}></i> Request Payout
                  </button>
                )}
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr 1fr', gap: '24px' }}>
            {/* Recent Holds & Activity */}
            <div className="glass-panel" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'var(--font-title)' }}>
                <i className="fa-solid fa-clipboard-list" style={{ color: 'var(--color-primary)' }}></i> Recent Client Interest Submissions
              </h3>
              {reservations.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No interest or hold requests logged yet.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {reservations.slice(0, 4).map(res => (
                    <div key={res.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--border-glass)' }}>
                      <div>
                        <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>{res.unit?.unit_number} - {res.unit?.project?.name}</span>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Customer: {res.client?.name}</div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                        <span className={`badge badge-${res.status === 'pending' ? 'warning' : res.status === 'confirmed' ? 'success' : 'danger'}`} style={{ fontSize: '0.65rem' }}>
                          {res.status}
                        </span>
                        {res.status === 'pending' && <span style={{ fontSize: '0.65rem', color: 'var(--color-warning)' }}>Awaiting review</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* My Rates Card */}
            <div className="glass-panel" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'var(--font-title)' }}>
                <i className="fa-solid fa-percent" style={{ color: 'var(--color-success)' }}></i> My Commission Rates
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {commissionRules.length === 0 ? (
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0, padding: '12px', background: 'rgba(50, 71, 58, 0.02)', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
                    No active commission rules set.
                  </p>
                ) : (
                  commissionRules.map((cr: any) => (
                    <div key={cr.id} style={{ padding: '12px 16px', borderRadius: 'var(--radius-sm)', background: 'rgba(50, 71, 58, 0.03)', border: '1px solid var(--border-glass)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px', width: '100%' }}>
                        <strong style={{ fontSize: '0.82rem' }}>{cr.name}</strong>
                        <span className="badge badge-success" style={{ fontSize: '0.7rem', fontWeight: 800 }}>
                          {parseFloat(cr.commission_rate).toFixed(2)}%
                        </span>
                      </div>
                      <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        {cr.description || `Rule applied to tier 2.`}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Leaderboard standings */}
            <div className="glass-panel" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'var(--font-title)' }}>
                <i className="fa-solid fa-trophy" style={{ color: '#f59e0b' }}></i> Broker Leaderboard (Monthly)
              </h3>
              {leaderboard.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Loading standings...</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {leaderboard.map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: idx === 0 ? 'rgba(245,158,11,0.08)' : idx === 1 ? 'rgba(226,232,240,0.08)' : 'transparent', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.03)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontWeight: 800, color: idx === 0 ? '#fbbf24' : idx === 1 ? '#cbd5e1' : '#94a3b8', width: '20px' }}>#{item.rank}</span>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '0.8rem' }}>{item.agency_name}</div>
                          <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{item.agent_name}</div>
                        </div>
                      </div>
                      <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-success)' }}>{item.total_volume.toLocaleString()} EGP</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Team Performance Section */}
          {subordinatesPerformance && subordinatesPerformance.length > 0 && (
            <div className="glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--border-glass)' }}>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'var(--font-title)' }}>
                  <i className="fa-solid fa-people-group" style={{ color: 'var(--color-primary)' }}></i>
                  Agency Team Performance & Commissions
                </h3>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table className="premium-table">
                  <thead>
                    <tr>
                      <th>Agent Name</th>
                      <th>Role</th>
                      <th>Status</th>
                      <th>Total Leads</th>
                      <th>New / Contacted</th>
                      <th>Hold Requests</th>
                      <th>Earned Commissions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subordinatesPerformance.map((sub: any) => (
                      <tr key={sub.user_id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{
                              width: '8px',
                              height: '8px',
                              borderRadius: '50%',
                              backgroundColor: sub.status === 'active' ? 'var(--color-success)' : '#9ca3af',
                              display: 'inline-block'
                            }}></span>
                            <strong>{sub.name}</strong>
                          </div>
                        </td>
                        <td>{sub.position}</td>
                        <td>
                          <span className={`badge ${sub.status === 'active' ? 'badge-success' : 'badge-secondary'}`}>
                            {sub.status}
                          </span>
                        </td>
                        <td>{sub.stats?.total_leads ?? 0}</td>
                        <td>{sub.stats?.new ?? 0} / {sub.stats?.contacted ?? 0}</td>
                        <td>{sub.stats?.reservations ?? 0} holds</td>
                        <td>
                          <strong style={{ color: 'var(--color-success)' }}>
                            {fmtPrice(sub.stats?.commissions_earned ?? 0)}
                          </strong>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: INVENTORY */}
      {activeTab === 'inventory' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Project Selector & Advanced Filters */}
          <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                <span style={{ fontWeight: 700, color: 'var(--text-muted)' }}>Project:</span>
                <select className="form-control" value={selectedProjectId} onChange={e => setSelectedProjectId(e.target.value)} style={{ width: '250px' }}>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.location})</option>
                  ))}
                </select>
                {selectedProjectId && (() => {
                  const proj = projects.find(p => p.id === selectedProjectId);
                  return proj?.delivery_date ? (
                    <div style={{ padding: '8px 12px', background: 'rgba(50, 71, 58, 0.04)', borderLeft: '4px solid var(--color-primary)', borderRadius: 'var(--radius-sm)', fontSize: '0.78rem' }}>
                      <i className="fa-solid fa-calendar-day" style={{ color: 'var(--color-primary)', marginRight: '6px' }}></i>
                      <strong>Project Delivery Date:</strong> {proj.delivery_date.substring(0, 10)}
                    </div>
                  ) : null;
                })()}
              </div>

              {/* Status Legend indicators */}
              <div style={{ display: 'flex', gap: '15px', fontSize: '0.8rem', flexWrap: 'wrap' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#10b981' }} /> Available</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#f59e0b' }} /> My Holds (Pending/Conf)</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ef4444' }} /> Booked / Reserved by Others</span>
              </div>
            </div>

            {/* Sub Filters grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Availability Status</label>
                <select className="form-control" value={unitFilterStatus} onChange={e => setUnitFilterStatus(e.target.value)}>
                  <option value="all">All States</option>
                  <option value="available">Available (Green)</option>
                  <option value="reserved">Reserved (Approved)</option>
                  <option value="pending_reservation">Pending Holds</option>
                </select>
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Unit Type</label>
                <select className="form-control" value={unitFilterType} onChange={e => setUnitFilterType(e.target.value)}>
                  <option value="all">All Types</option>
                  <option value="Apartment">Apartment</option>
                  <option value="Duplex">Duplex</option>
                  <option value="Villa">Villa</option>
                  <option value="Penthouse">Penthouse</option>
                </select>
              </div>

              <div className="form-group" style={{ margin: 0, gridColumn: 'span 2' }}>
                <label className="form-label">Search Unit Code</label>
                <div style={{ position: 'relative' }}>
                  <input type="text" className="form-control" placeholder="Search by unit number..." value={unitSearchQuery} onChange={e => setUnitSearchQuery(e.target.value)} style={{ paddingLeft: '35px' }} />
                  <i className="fa-solid fa-magnifying-glass" style={{ position: 'absolute', left: '12px', top: '12px', fontSize: '0.85rem', color: '#64748b' }}></i>
                </div>
              </div>
            </div>
          </div>

          {/* Unit Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '20px' }}>
            {filteredUnits.length === 0 ? (
              <div className="glass-panel" style={{ gridColumn: '1/-1', textAlign: 'center', padding: '50px', color: 'var(--text-muted)' }}>
                <i className="fa-solid fa-triangle-exclamation" style={{ fontSize: '2rem', color: 'var(--color-warning)', marginBottom: '15px' }}></i>
                <h4>No units match the filter criteria.</h4>
              </div>
            ) : (
              filteredUnits.map(unit => {
                const brokerHold = reservations.find(r => r.unit_id === unit.id && (r.status === 'pending' || r.status === 'confirmed'));
                let statusColor = '#10b981'; // Green
                let statusText = 'Available';
                
                if (brokerHold) {
                  statusColor = '#f59e0b'; // Yellow
                  statusText = brokerHold.status === 'pending' ? 'My Hold (Pending)' : 'My Hold (Confirmed)';
                } else if (unit.status !== 'available') {
                  statusColor = '#ef4444'; // Red
                  statusText = unit.status === 'pending_reservation' ? 'Hold Pending (Other)' : 'Reserved by Other';
                }

                return (
                  <div key={unit.id} className="glass-panel" onClick={() => setSelectedUnit(unit)}
                    style={{ padding: '20px', borderLeft: `5px solid ${statusColor}`, display: 'flex', flexDirection: 'column', gap: '10px', cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '1.05rem', fontWeight: 800 }}>{unit.unit_number}</span>
                      <span style={{ fontSize: '0.68rem', fontWeight: 700, color: statusColor, textTransform: 'uppercase' }}>{statusText}</span>
                    </div>

                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '6px', flexGrow: 1 }}>
                      <div><i className="fa-solid fa-house" style={{ marginRight: '6px', color: 'var(--color-primary)', fontSize: '0.75rem' }}></i>Type: {unit.type}</div>
                      <div><i className="fa-solid fa-ruler-combined" style={{ marginRight: '6px', color: 'var(--color-primary)', fontSize: '0.75rem' }}></i>Area: {unit.area || unit.area_sqm || '—'} sqm</div>
                      {statusColor !== '#ef4444' ? (
                        <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-success)', marginTop: '4px' }}>
                          <i className="fa-solid fa-tag" style={{ marginRight: '6px', color: 'var(--color-success)', fontSize: '0.75rem' }}></i>Price: {fmtPrice(unit.price)}
                        </div>
                      ) : (
                        <div style={{ fontSize: '0.8rem', color: '#ef4444', fontStyle: 'italic', marginTop: '4px' }}>
                          Price Hidden (Locked)
                        </div>
                      )}
                    </div>

                    <div style={{ marginTop: '10px', fontSize: '0.7rem', color: 'var(--color-primary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span>View Specifications</span> <i className="fa-solid fa-chevron-right" style={{ fontSize: '0.6rem' }}></i>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* TAB CONTENT: LEADS & ANTI-POACHING */}
      {activeTab === 'leads' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px', alignItems: 'start' }}>
          {/* Register Lead Panel */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'var(--font-title)' }}>
              <i className="fa-solid fa-user-lock" style={{ color: 'var(--color-primary)' }}></i> Register Protected Client
            </h3>
            
            <form onSubmit={handleRegisterLead} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">First Name *</label>
                  <input type="text" className="form-control" value={leadForm.first_name} onChange={e => setLeadForm({...leadForm, first_name: e.target.value})} required />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Last Name *</label>
                  <input type="text" className="form-control" value={leadForm.last_name} onChange={e => setLeadForm({...leadForm, last_name: e.target.value})} required />
                </div>
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Phone Code *</label>
                <input type="tel" className="form-control" placeholder="+201..." value={leadForm.phone} onChange={e => setLeadForm({...leadForm, phone: e.target.value})} required />
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Email Address</label>
                <input type="email" className="form-control" value={leadForm.email} onChange={e => setLeadForm({...leadForm, email: e.target.value})} />
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">National ID (KYC verification)</label>
                <input type="text" className="form-control" placeholder="14-digit Egyptian National ID" value={leadForm.national_id} onChange={e => setLeadForm({...leadForm, national_id: e.target.value})} />
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Budget (EGP)</label>
                <input type="number" className="form-control" value={leadForm.budget} onChange={e => setLeadForm({...leadForm, budget: e.target.value})} />
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Interested Project</label>
                <select className="form-control" value={leadForm.interested_project_id} onChange={e => setLeadForm({...leadForm, interested_project_id: e.target.value})}>
                  <option value="">-- Choose project --</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <button type="submit" className="btn-primary" style={{ marginTop: '10px' }}>Register Locked Client</button>
            </form>
          </div>

          {/* Locked Leads List */}
          <div className="glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--border-glass)' }}>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'var(--font-title)' }}>
                <i className="fa-solid fa-users-viewfinder" style={{ color: 'var(--color-primary)' }}></i> My Locked Leads (Anti-Poaching Lock List)
              </h3>
            </div>
            
            <div style={{ overflowX: 'auto' }}>
              <table className="premium-table">
                <thead>
                  <tr>
                    <th>Customer Name</th>
                    <th>Contact Info</th>
                    <th>Lock Protection Details</th>
                    <th>CRM Pipeline Status</th>
                  </tr>
                </thead>
                <tbody>
                  {leads.length === 0 ? (
                    <tr>
                      <td colSpan={4} style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>No leads registered. Use the panel on the left to lock a client.</td>
                    </tr>
                  ) : (
                    leads.map(l => {
                      return (
                        <tr key={l.id}>
                          <td>
                            <strong>{l.first_name} {l.last_name}</strong>
                            {l.national_id && <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>NID: {l.national_id}</div>}
                          </td>
                          <td>
                            <div>📞 {l.phone}</div>
                            {l.email && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>✉️ {l.email}</div>}
                          </td>
                          <td>
                            <div style={{ color: 'var(--color-success)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem' }}>
                              <i className="fa-solid fa-shield-halved" style={{ color: '#10b981' }}></i> Active Lock
                            </div>
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Expires in 90 days from registry</span>
                          </td>
                          <td>
                            <span className={`badge badge-${
                              l.status === 'new' ? 'warning' :
                              l.status === 'reserved' ? 'info' :
                              l.status === 'contracted' ? 'success' : 'secondary'
                            }`} style={{ textTransform: 'capitalize' }}>
                              {l.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: SUBMISSIONS & RESERVATION HOLDS */}
      {activeTab === 'submissions' && (
        <div className="glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--border-glass)' }}>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'var(--font-title)' }}>
              <i className="fa-solid fa-clipboard-list" style={{ color: 'var(--color-primary)' }}></i> My Client Interest & Hold Submissions
            </h3>
          </div>
          
          <div style={{ overflowX: 'auto' }}>
            <table className="premium-table">
              <thead>
                <tr>
                  <th>Unit Details</th>
                  <th>Client</th>
                  <th>EOI Amount</th>
                  <th>Status Hold</th>
                  <th>Audit logs</th>
                </tr>
              </thead>
              <tbody>
                {reservations.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>No interest requests submitted yet. Go to the "Visual Inventory" tab to select a unit and submit customer interest.</td>
                  </tr>
                ) : (
                  reservations.map(res => {
                    return (
                      <tr key={res.id}>
                        <td>
                          <strong>{res.unit?.unit_number}</strong>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>Project: {res.unit?.project?.name}</div>
                        </td>
                        <td>
                          <strong>{res.client?.name}</strong>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>Phone: {res.client?.phone}</div>
                        </td>
                        <td>
                          {parseFloat(res.eoi_amount) > 0 ? (
                            <>
                              <strong>{parseFloat(res.eoi_amount).toLocaleString()} EGP</strong>
                              {res.payment_receipt_path && (
                                <div style={{ fontSize: '0.7rem', color: 'var(--color-primary)', textDecoration: 'underline', cursor: 'pointer', marginTop: '2px' }}>View Receipt Slip</div>
                              )}
                            </>
                          ) : (
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600 }}>Client Interest (No Deposit)</span>
                          )}
                        </td>
                        <td>
                          <span className={`badge badge-${
                            res.status === 'pending' ? 'warning' :
                            res.status === 'confirmed' ? 'success' : 'danger'
                          }`} style={{ textTransform: 'uppercase', fontSize: '0.7rem' }}>
                            {res.status}
                          </span>
                        </td>
                        <td style={{ fontSize: '0.8rem', maxWidth: '250px' }}>
                          {res.status === 'pending' && <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Awaiting Finance receipt clearance check</span>}
                          {res.status === 'confirmed' && <span style={{ color: 'var(--color-success)', fontWeight: 700 }}>Approved hold! Expires {res.expires_at ? new Date(res.expires_at).toLocaleDateString() : 'N/A'}</span>}
                          {res.status === 'cancelled' && (
                            <span style={{ color: 'var(--color-danger)' }}>
                              ❌ Rejection comment: {res.cancellation_reason || 'Unspecified'}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB CONTENT: COMMISSIONS & PAYOUTS */}
      {activeTab === 'commissions' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Commissions Summary Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px' }}>
            {[
              { label: 'Gross Commission', value: stats.total_commissioned, color: 'var(--color-primary)' },
              { label: 'Pending Payment', value: stats.pending_commission, color: 'var(--color-warning)' },
              { label: 'Approved Balance', value: stats.approved_commission, color: 'var(--color-success)' },
              { label: 'Accrued Payouts', value: stats.paid_commission, color: 'var(--color-secondary)' },
              { label: 'Available to Withdraw', value: stats.available_balance, color: '#10b981', withdraw: true },
            ].map(s => (
              <div key={s.label} className="glass-panel" style={{ padding: '16px', textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '120px' }}>
                <div>
                  <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.04em', marginBottom: '8px' }}>{s.label}</div>
                  <div style={{ fontSize: '1.3rem', fontWeight: 800, color: s.color, fontFamily: 'var(--font-title)' }}>{s.value.toLocaleString()} EGP</div>
                </div>
                {s.withdraw && stats.available_balance > 0 && (
                  <button onClick={() => setShowPayoutModal(true)} className="btn-primary" style={{ width: '100%', padding: '6px', fontSize: '0.72rem', marginTop: '8px', fontWeight: 700 }}>
                    <i className="fa-solid fa-file-invoice-dollar" style={{ marginRight: '4px' }}></i> Submit Invoice
                  </button>
                )}
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', alignItems: 'start' }}>
            {/* Deals Ledger */}
            <div className="glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--border-glass)' }}>
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'var(--font-title)' }}>
                  <i className="fa-solid fa-sack-dollar" style={{ color: 'var(--color-primary)' }}></i> Deals Ledger & Commission Calculations
                </h3>
              </div>
              
              <div style={{ overflowX: 'auto' }}>
                <table className="premium-table">
                  <thead>
                    <tr>
                      <th>Deal Client</th>
                      <th>Contract Unit</th>
                      <th>Rate (%)</th>
                      <th>Commission amount</th>
                      <th>Fulfillment status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {commissions.length === 0 ? (
                      <tr>
                        <td colSpan={5} style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>No commissions registered. Commissions are automatically calculated upon final client booking approval.</td>
                      </tr>
                    ) : (
                      commissions.map(comm => {
                        return (
                          <tr key={comm.id}>
                            <td>
                              <strong>{comm.lead?.first_name} {comm.lead?.last_name}</strong>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>Phone: {comm.lead?.phone}</div>
                            </td>
                            <td>
                              <strong>Unit PK-{comm.unit_id.substring(0, 4).toUpperCase()}</strong>
                            </td>
                            <td>
                              <span style={{ fontWeight: 700 }}>{parseFloat(comm.rate_percent)}%</span>
                            </td>
                            <td>
                              <span style={{ color: 'var(--color-success)', fontWeight: 700 }}>{parseFloat(comm.gross_amount).toLocaleString()} EGP</span>
                            </td>
                            <td>
                              <span className={`badge badge-${
                                comm.status === 'pending' ? 'warning' :
                                comm.status === 'approved' ? 'primary' : 'success'
                              }`} style={{ textTransform: 'capitalize' }}>
                                {comm.status}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Payout requests log */}
            <div className="glass-panel" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'var(--font-title)' }}>
                <i className="fa-solid fa-receipt" style={{ color: 'var(--color-secondary)' }}></i> Payout Invoices History
              </h3>
              
              {payouts.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No payout invoices uploaded.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {payouts.map(p => (
                    <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--border-glass)' }}>
                      <div>
                        <span style={{ fontWeight: 800 }}>{parseFloat(p.amount).toLocaleString()} EGP</span>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>Uploaded: {new Date(p.created_at).toLocaleDateString()}</div>
                        {p.rejection_reason && <div style={{ fontSize: '0.7rem', color: 'var(--color-danger)', marginTop: '4px' }}>Feedback: {p.rejection_reason}</div>}
                      </div>
                      <span className={`badge badge-${
                        p.status === 'pending_review' ? 'warning' :
                        p.status === 'approved' ? 'info' :
                        p.status === 'paid' ? 'success' : 'danger'
                      }`} style={{ alignSelf: 'center', fontSize: '0.65rem' }}>
                        {p.status.replace(/_/g, ' ')}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: MARKETING CENTER */}
      {activeTab === 'marketing' && (
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'var(--font-title)' }}>
            <i className="fa-solid fa-folder-open" style={{ color: 'var(--color-primary)' }}></i> Marketing Assets & Digital Center
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '20px' }}>Download high-resolution project layouts, official price sheets, logos, and promotional brochures to present to clients.</p>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
            {[
              { title: 'Nile Towers Layout Package', desc: 'Includes master plan drawings, duplex configurations, and specifications sheets.', size: '24MB' },
              { title: 'Dynamic Pricing Sheet', desc: 'Updated real-time EGP matrices including downpayment options and payment duration multipliers.', size: '1.2MB' },
              { title: 'Developer Branding Logo kit', desc: 'Branded vector logotypes, icons, and colors to stamp your mediation agency banners.', size: '8.5MB' },
            ].map(asset => (
              <div key={asset.title} className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <h4 style={{ fontWeight: 800, margin: 0, fontSize: '0.92rem' }}>{asset.title}</h4>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0, flexGrow: 1 }}>{asset.desc}</p>
                <button onClick={() => showToast('Brochure download triggered', 'success')} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center', width: '100%', padding: '8px' }}>
                  <i className="fa-solid fa-download"></i> Download PDF ({asset.size})
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* ======================= MODALS ========================= */}
      {/* ======================================================== */}

      {/* UNIT DETAILED SPECIFICATIONS MODAL */}
      {selectedUnit && (
        <div className="modal-backdrop" onClick={() => setSelectedUnit(null)}>
          <div className="glass-panel modal-content" style={{ width: '100%', maxWidth: '520px', padding: '28px' }} onClick={e => e.stopPropagation()}>
            
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid var(--border-glass)', paddingBottom: '12px' }}>
              <h3 style={{ margin: 0, fontWeight: 800, fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <i className="fa-solid fa-house-chimney" style={{ color: 'var(--color-primary)' }}></i>
                Unit #{selectedUnit.unit_number} {selectedUnit.building ? `(${selectedUnit.building})` : ''}
              </h3>
              <button onClick={() => setSelectedUnit(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <i className="fa-solid fa-xmark" style={{ fontSize: '1.2rem' }}></i>
              </button>
            </div>

            {/* Specifications Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
              {[
                { label: 'Unit Type', value: selectedUnit.type, icon: 'fa-solid fa-building' },
                { label: 'Floor Level', value: selectedUnit.floor !== null ? `${selectedUnit.floor} Floor` : '—', icon: 'fa-solid fa-stairs' },
                { label: 'Total Area', value: selectedUnit.area ? `${selectedUnit.area} m²` : selectedUnit.area_sqm ? `${selectedUnit.area_sqm} m²` : '—', icon: 'fa-solid fa-ruler-combined' },
                { label: 'View Type', value: selectedUnit.view_type || '—', icon: 'fa-solid fa-eye' },
                { label: 'Bedrooms', value: selectedUnit.bedrooms ?? '—', icon: 'fa-solid fa-bed' },
                { label: 'Bathrooms', value: selectedUnit.bathrooms ?? '—', icon: 'fa-solid fa-bath' },
                { label: 'Price', value: fmtPrice(selectedUnit.price), icon: 'fa-solid fa-tag', highlight: true },
                { label: 'Status', value: selectedUnit.status, icon: 'fa-solid fa-circle-info', badge: true },
              ].map((item, idx) => (
                <div key={idx} style={{ display: 'flex', gap: '10px', alignItems: 'center', background: 'rgba(50, 71, 58, 0.03)', padding: '10px 12px', borderRadius: 'var(--radius-sm)' }}>
                  <i className={item.icon} style={{ color: 'var(--color-primary)', fontSize: '0.9rem', width: '16px', textAlign: 'center' }}></i>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>{item.label}</div>
                    {item.badge ? (
                      <span className={`badge ${unitStatusBadge[item.value] || 'badge-info'}`} style={{ marginTop: '2px', display: 'inline-block' }}>{item.value}</span>
                    ) : (
                      <div style={{ fontSize: '0.85rem', fontWeight: item.highlight ? 800 : 700, color: item.highlight ? 'var(--color-success)' : 'var(--text-main)' }}>{item.value}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Layout Arabic Description */}
            <div className="glass-panel" style={{ padding: '16px 20px', background: 'rgba(50, 71, 58, 0.04)', borderColor: 'rgba(50, 71, 58, 0.1)', marginBottom: '24px' }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-primary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <i className="fa-solid fa-map-marked-alt" style={{ fontSize: '0.82rem' }}></i>
                Unit Layout & Division — التقسيمة وتوزيع الغرف
              </div>
              <p style={{ margin: 0, fontSize: '0.88rem', lineHeight: '1.6', color: 'var(--text-main)', direction: 'rtl', textAlign: 'right', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                {selectedUnit.layout_description || 'تفاصيل التقسيمة غير متوفرة لهذا النموذج.'}
              </p>
            </div>

            {/* Modal Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button className="btn-secondary" onClick={() => setSelectedUnit(null)} style={{ padding: '10px 20px' }}>
                Close
              </button>
              {selectedUnit.status === 'available' && (
                <button className="btn-primary" style={{ padding: '10px 20px' }}
                  onClick={() => {
                    if (leads.length === 0) {
                      showToast('You must register at least one client lead lock first.', 'info');
                      return;
                    }
                    setSelectedUnitObj(selectedUnit);
                    setReserveForm(prev => ({ ...prev, unit_id: selectedUnit.id }));
                    setShowReserveModal(true);
                  }}>
                  Submit Interest Request
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* REGISTER LEAD LOCK MODAL */}
      {showLeadModal && (
        <div className="modal-backdrop" onClick={() => setShowLeadModal(false)}>
          <div className="glass-panel modal-content" style={{ width: '100%', maxWidth: '500px', padding: '30px', display: 'flex', flexDirection: 'column', gap: '20px' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-glass)', paddingBottom: '12px' }}>
              <h3 style={{ margin: 0, fontWeight: 800, fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <i className="fa-solid fa-user-lock" style={{ color: 'var(--color-primary)' }}></i> Register Lead Lock
              </h3>
              <button onClick={() => setShowLeadModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <i className="fa-solid fa-xmark" style={{ fontSize: '1.2rem' }}></i>
              </button>
            </div>
            
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0, lineHeight: '1.4' }}>
              Submit the customer contact details. If no active lock exists, the lead is exclusively locked to your brokerage profile for 90 days (Anti-Poaching Protection).
            </p>
            
            <form onSubmit={handleRegisterLead} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">First Name *</label>
                  <input type="text" className="form-control" value={leadForm.first_name} onChange={e => setLeadForm({...leadForm, first_name: e.target.value})} required />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Last Name *</label>
                  <input type="text" className="form-control" value={leadForm.last_name} onChange={e => setLeadForm({...leadForm, last_name: e.target.value})} required />
                </div>
              </div>
              
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Phone *</label>
                <input type="tel" className="form-control" placeholder="+20..." value={leadForm.phone} onChange={e => setLeadForm({...leadForm, phone: e.target.value})} required />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Email</label>
                <input type="email" className="form-control" value={leadForm.email} onChange={e => setLeadForm({...leadForm, email: e.target.value})} />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Egyptian National ID</label>
                <input type="text" className="form-control" placeholder="14-digit Egyptian National ID" value={leadForm.national_id} onChange={e => setLeadForm({...leadForm, national_id: e.target.value})} />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Budget (EGP)</label>
                <input type="number" className="form-control" value={leadForm.budget} onChange={e => setLeadForm({...leadForm, budget: e.target.value})} />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Interested Project</label>
                <select className="form-control" value={leadForm.interested_project_id} onChange={e => setLeadForm({...leadForm, interested_project_id: e.target.value})}>
                  <option value="">-- Choose Project --</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button type="button" className="btn-secondary" onClick={() => setShowLeadModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Lock Client</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REQUEST RESERVATION HOLD MODAL */}
      {showReserveModal && selectedUnitObj && (
        <div className="modal-backdrop" onClick={() => { setShowReserveModal(false); setSelectedUnitObj(null); }}>
          <div className="glass-panel modal-content" style={{ width: '100%', maxWidth: '480px', padding: '30px', display: 'flex', flexDirection: 'column', gap: '20px' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-glass)', paddingBottom: '12px' }}>
              <h3 style={{ margin: 0, fontWeight: 800, fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <i className="fa-solid fa-clipboard-list" style={{ color: 'var(--color-primary)' }}></i> Client Interest Request
              </h3>
              <button onClick={() => { setShowReserveModal(false); setSelectedUnitObj(null); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <i className="fa-solid fa-xmark" style={{ fontSize: '1.2rem' }}></i>
              </button>
            </div>
            
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0, lineHeight: '1.4' }}>
              Select a client to indicate their interest in this unit. Submitting this request notifies the Company Sales Representative to coordinate booking procedures.
            </p>

            <div style={{ padding: '12px', background: 'rgba(50, 71, 58, 0.04)', borderRadius: '6px', fontSize: '0.8rem', border: '1px solid var(--border-glass)' }}>
              <div>🏢 Unit Code: <strong>{selectedUnitObj.unit_number}</strong></div>
              <div>📐 Area: {selectedUnitObj.area || selectedUnitObj.area_sqm || '—'} sqm</div>
              <div>💰 Price: {fmtPrice(selectedUnitObj.price)}</div>
            </div>

            <form onSubmit={handleReserveSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Select Client * (Locked under your profile)</label>
                <select className="form-control" value={reserveForm.client_id} onChange={e => setReserveForm({...reserveForm, client_id: e.target.value})} required>
                  <option value="">-- Select Client --</option>
                  {leads.map(l => (
                    <option key={l.id} value={l.id}>{l.first_name} {l.last_name} ({l.phone})</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button type="button" className="btn-secondary" onClick={() => { setShowReserveModal(false); setSelectedUnitObj(null); }}>Cancel</button>
                <button type="submit" className="btn-primary">Submit Interest</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REQUEST COMMISSION PAYOUT MODAL */}
      {showPayoutModal && (
        <div className="modal-backdrop" onClick={() => setShowPayoutModal(false)}>
          <div className="glass-panel modal-content" style={{ width: '100%', maxWidth: '450px', padding: '30px', display: 'flex', flexDirection: 'column', gap: '20px' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-glass)', paddingBottom: '12px' }}>
              <h3 style={{ margin: 0, fontWeight: 800, fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <i className="fa-solid fa-file-invoice-dollar" style={{ color: 'var(--color-success)' }}></i> Commission Invoice Payout
              </h3>
              <button onClick={() => setShowPayoutModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <i className="fa-solid fa-xmark" style={{ fontSize: '1.2rem' }}></i>
              </button>
            </div>

            <div style={{ padding: '12px', background: 'rgba(16, 185, 129, 0.05)', borderRadius: '6px', fontSize: '0.8rem', border: '1px solid rgba(16, 185, 129, 0.2)', color: '#10b981', fontWeight: 700 }}>
              Available to request: {stats.available_balance.toLocaleString()} EGP
            </div>

            <form onSubmit={handlePayoutSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Request Amount (EGP) *</label>
                <input type="number" className="form-control" max={stats.available_balance} value={payoutForm.amount} onChange={e => setPayoutForm({...payoutForm, amount: e.target.value})} required placeholder="Enter payout amount..." />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Upload Commercial Tax Invoice (PDF/Image)</label>
                <div style={{ border: '2px dashed var(--border-glass)', padding: '20px', borderRadius: '6px', textAlign: 'center', cursor: 'pointer', fontSize: '0.75rem', color: 'var(--text-muted)' }} onClick={() => showToast('Invoice PDF uploaded!', 'info')}>
                  <i className="fa-solid fa-file-pdf" style={{ fontSize: '1.5rem', marginBottom: '8px', display: 'block', color: 'var(--color-primary)' }}></i>
                  📄 Upload invoice document (Mock)
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button type="button" className="btn-secondary" onClick={() => setShowPayoutModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary" style={{ background: '#10b981', borderColor: '#10b981' }}>Submit Payout Request</button>
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
