import React, { useState, useEffect } from 'react';
import { 
  Users, Plus, ClipboardList, MapPin, Sparkles, Send, CheckCircle, 
  Download, DollarSign, AlertCircle, Calendar, ChevronRight, Search, 
  Filter, Home, BookOpen, ShieldAlert, Award, Grid, List, AlertTriangle
} from 'lucide-react';
import api from '../../services/api';
import { ToastContainer } from '../../components/Toast';

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

  const fetchAllData = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch Stats
      const statsRes = await api.get('/v1/sales/broker/dashboard');
      let brokerId = '';
      if (statsRes.data && statsRes.data.success) {
        setStats((prev: any) => ({ ...prev, ...statsRes.data.stats }));
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
        const leadList = leadsRes.data.data.data || [];
        setLeads(leadList);
        if (leadList.length > 0) {
          // Retrieve broker ID from lead object
          brokerId = leadList[0].broker_id;
        }
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px', position: 'relative' }}>
      
      {/* Premium Header Panel */}
      <div className="glass-panel" style={{ 
        padding: '30px', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        background: 'linear-gradient(135deg, rgba(50, 71, 58, 0.08) 0%, rgba(161, 183, 167, 0.18) 100%)', 
        border: '1px solid var(--border-glass)' 
      }}>
        <div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '2rem' }}>🍊</span> REDP Broker Mediation Dashboard
          </h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '6px' }}>Manage client locks, request unit reservation holds, download media assets, and track commission ledger.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={() => setShowLeadModal(true)} className="btn-primary" style={{ padding: '10px 18px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 750, cursor: 'pointer' }}>
            <Plus style={{ width: '18px', height: '18px' }} /> Register Lead Lock
          </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div style={{ display: 'flex', gap: '10px', borderBottom: '1px solid var(--border-glass)', paddingBottom: '10px' }}>
        <button onClick={() => setActiveTab('overview')} className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`} style={tabStyle(activeTab === 'overview')}>
          <Home style={{ width: '16px', height: '16px' }} /> Overview
        </button>
        <button onClick={() => setActiveTab('inventory')} className={`tab-btn ${activeTab === 'inventory' ? 'active' : ''}`} style={tabStyle(activeTab === 'inventory')}>
          <Grid style={{ width: '16px', height: '16px' }} /> Visual Inventory
        </button>
        <button onClick={() => setActiveTab('leads')} className={`tab-btn ${activeTab === 'leads' ? 'active' : ''}`} style={tabStyle(activeTab === 'leads')}>
          <Users style={{ width: '16px', height: '16px' }} /> Lead Protection Lock
        </button>
        <button onClick={() => setActiveTab('submissions')} className={`tab-btn ${activeTab === 'submissions' ? 'active' : ''}`} style={tabStyle(activeTab === 'submissions')}>
          <ClipboardList style={{ width: '16px', height: '16px' }} /> Interest & Hold Requests
        </button>
        <button onClick={() => setActiveTab('commissions')} className={`tab-btn ${activeTab === 'commissions' ? 'active' : ''}`} style={tabStyle(activeTab === 'commissions')}>
          <DollarSign style={{ width: '16px', height: '16px' }} /> Commissions Ledger
        </button>
        <button onClick={() => setActiveTab('marketing')} className={`tab-btn ${activeTab === 'marketing' ? 'active' : ''}`} style={tabStyle(activeTab === 'marketing')}>
          <BookOpen style={{ width: '16px', height: '16px' }} /> Marketing Hub
        </button>
      </div>

      {/* TAB CONTENT: OVERVIEW */}
      {activeTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
          {/* Stats Cards Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
            <div className="glass-panel" style={{ padding: '20px', background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.16) 0%, rgba(59, 130, 246, 0.04) 100%)', border: '1px solid rgba(59, 130, 246, 0.25)', borderLeft: '6px solid #2563eb', display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: '110px' }}>
              <h4 style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: '#1e3a8a', fontWeight: 800, letterSpacing: '0.05em' }}>My Locked Clients</h4>
              <h2 style={{ fontSize: '1.7rem', fontWeight: 800, marginTop: '6px', color: '#1d4ed8' }}>
                {stats.total_leads} <span style={{ fontSize: '0.85rem', color: '#334155', fontWeight: 550 }}>leads locked</span>
              </h2>
            </div>
            
            <div className="glass-panel" style={{ padding: '20px', background: 'linear-gradient(135deg, rgba(217, 119, 6, 0.16) 0%, rgba(217, 119, 6, 0.04) 100%)', border: '1px solid rgba(217, 119, 6, 0.25)', borderLeft: '6px solid #d97706', display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: '110px' }}>
              <h4 style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: '#78350f', fontWeight: 800, letterSpacing: '0.05em' }}>Pending Interest / Holds</h4>
              <h2 style={{ fontSize: '1.7rem', fontWeight: 800, marginTop: '6px', color: '#b45309' }}>
                {reservations.filter(r => r.status === 'pending').length} <span style={{ fontSize: '0.85rem', color: '#334155', fontWeight: 550 }}>holds</span>
              </h2>
            </div>

            <div className="glass-panel" style={{ padding: '20px', background: 'linear-gradient(135deg, rgba(22, 163, 74, 0.16) 0%, rgba(22, 163, 74, 0.04) 100%)', border: '1px solid rgba(22, 163, 74, 0.25)', borderLeft: '6px solid #16a34a', display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: '110px' }}>
              <h4 style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: '#14532d', fontWeight: 800, letterSpacing: '0.05em' }}>Approved Commissions</h4>
              <h2 style={{ fontSize: '1.7rem', fontWeight: 800, marginTop: '6px', color: '#15803d' }}>
                {(stats.approved_commission).toLocaleString()} <span style={{ fontSize: '0.85rem', color: '#334155', fontWeight: 550 }}>EGP</span>
              </h2>
            </div>

            <div className="glass-panel" style={{ padding: '20px', background: 'linear-gradient(135deg, rgba(147, 51, 234, 0.16) 0%, rgba(147, 51, 234, 0.04) 100%)', border: '1px solid rgba(147, 51, 234, 0.25)', borderLeft: '6px solid #9333ea', display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: '110px' }}>
              <h4 style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: '#581c87', fontWeight: 800, letterSpacing: '0.05em' }}>Available Balance</h4>
              <h2 style={{ fontSize: '1.7rem', fontWeight: 800, marginTop: '6px', color: '#7e22ce' }}>
                {(stats.available_balance).toLocaleString()} <span style={{ fontSize: '0.85rem', color: '#334155', fontWeight: 550 }}>EGP</span>
              </h2>
              <button onClick={() => setShowPayoutModal(true)} className="btn-secondary" style={{ marginTop: '10px', fontSize: '0.75rem', width: '100%', padding: '6px', background: '#ffffff', color: '#7e22ce', border: '1px solid rgba(147, 51, 234, 0.2)', fontWeight: 700 }}>Request Payout</button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '30px' }}>
            {/* Recent Holds & Activity */}
            <div className="glass-panel" style={{ padding: '25px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ClipboardList style={{ color: 'var(--color-primary)' }} /> Recent Client Interest Submissions
              </h3>
              {reservations.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No interest or hold requests logged yet.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
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

            {/* Leaderboard standings */}
            <div className="glass-panel" style={{ padding: '25px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Award style={{ color: '#f59e0b' }} /> Broker Leaderboard (Monthly)
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
        </div>
      )}

      {/* TAB CONTENT: INVENTORY */}
      {activeTab === 'inventory' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Project Selector & Advanced Filters */}
          <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <span style={{ fontWeight: 700, color: 'var(--text-muted)' }}>Project:</span>
                <select className="form-control" value={selectedProjectId} onChange={e => setSelectedProjectId(e.target.value)} style={{ width: '250px' }}>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.location})</option>
                  ))}
                </select>
              </div>

              {/* Status Legend indicators */}
              <div style={{ display: 'flex', gap: '15px', fontSize: '0.8rem' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#10b981' }} /> Available</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#f59e0b' }} /> My Interest Requests (Pending/Conf)</span>
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
                  <Search style={{ position: 'absolute', left: '12px', top: '10px', width: '16px', height: '16px', color: '#64748b' }} />
                </div>
              </div>
            </div>
          </div>

          {/* Unit Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '20px' }}>
            {filteredUnits.length === 0 ? (
              <div className="glass-panel" style={{ gridColumn: '1/-1', textAlign: 'center', padding: '50px', color: 'var(--text-muted)' }}>
                <AlertTriangle style={{ width: '40px', height: '40px', color: 'var(--color-warning)', marginBottom: '15px' }} />
                <h4>No units match the filter criteria.</h4>
              </div>
            ) : (
              filteredUnits.map(unit => {
                // Determine color coding state
                // Green: available
                // Yellow: holds by this broker
                // Red: holds by other brokers or sold
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
                  <div key={unit.id} className="glass-panel" style={{ padding: '20px', borderLeft: `5px solid ${statusColor}`, display: 'flex', flexDirection: 'column', gap: '12px', transition: 'all 0.2s', transform: 'translateY(0)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '1.1rem', fontWeight: 800 }}>{unit.unit_number}</span>
                      <span style={{ fontSize: '0.7rem', fontWeight: 700, color: statusColor, textTransform: 'uppercase' }}>{statusText}</span>
                    </div>

                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <div>🏠 Type: {unit.type}</div>
                      <div>📐 Area: {unit.area_sqm} sqm</div>
                      {statusColor !== '#ef4444' ? (
                        <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--color-success)', marginTop: '4px' }}>
                          💰 Price: {parseFloat(unit.price).toLocaleString()} EGP
                        </div>
                      ) : (
                        <div style={{ fontSize: '0.8rem', color: '#ef4444', fontStyle: 'italic', marginTop: '4px' }}>
                          Price Hidden (Locked)
                        </div>
                      )}
                    </div>

                    {statusColor === '#10b981' && (
                      <button 
                        onClick={() => {
                          if (leads.length === 0) {
                            showToast('You must register at least one client lead lock first.', 'info');
                            return;
                          }
                          setSelectedUnitObj(unit);
                          setReserveForm(prev => ({ ...prev, unit_id: unit.id }));
                          setShowReserveModal(true);
                        }}
                        className="btn-primary" 
                        style={{ marginTop: 'auto', padding: '6px', fontSize: '0.75rem' }}
                      >
                        Submit Client Interest
                      </button>
                    )}

                    {statusColor === '#f59e0b' && (
                      <div style={{ marginTop: 'auto', padding: '6px', fontSize: '0.7rem', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: '4px', textAlign: 'center', fontWeight: 700, color: '#f59e0b' }}>
                        Locked under your account
                      </div>
                    )}

                    {statusColor === '#ef4444' && (
                      <div style={{ marginTop: 'auto', padding: '6px', fontSize: '0.7rem', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '4px', textAlign: 'center', color: '#ef4444', fontWeight: 700 }}>
                        Blocked
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* TAB CONTENT: LEADS & ANTI-POACHING */}
      {activeTab === 'leads' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '30px', alignItems: 'start' }}>
          {/* Register Lead Panel */}
          <div className="glass-panel" style={{ padding: '25px' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Plus style={{ color: 'var(--color-primary)' }} /> Register Protected Client
            </h3>
            
            <form onSubmit={handleRegisterLead} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">First Name</label>
                  <input type="text" className="form-control" value={leadForm.first_name} onChange={e => setLeadForm({...leadForm, first_name: e.target.value})} required />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Last Name</label>
                  <input type="text" className="form-control" value={leadForm.last_name} onChange={e => setLeadForm({...leadForm, last_name: e.target.value})} required />
                </div>
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Phone Code</label>
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
          <div className="glass-panel" style={{ padding: '25px' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Users style={{ color: 'var(--color-primary)' }} /> My Locked Leads (Anti-Poaching Lock List)
            </h3>
            
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
                      <td colSpan={4} style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>No leads registered. Use the panel on the left to lock a client.</td>
                    </tr>
                  ) : (
                    leads.map(l => {
                      return (
                        <tr key={l.id}>
                          <td>
                            <strong>{l.first_name} {l.last_name}</strong>
                            {l.national_id && <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>NID: {l.national_id}</div>}
                          </td>
                          <td>
                            <div>📞 {l.phone}</div>
                            {l.email && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>✉️ {l.email}</div>}
                          </td>
                          <td>
                            <div style={{ color: 'var(--color-success)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem' }}>
                              <ShieldAlert style={{ width: '14px', height: '14px', color: '#10b981' }} /> Active Lock
                            </div>
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Expires in 90 days from registry</span>
                          </td>
                          <td>
                            <span className={`badge badge-${
                              l.status === 'new' ? 'primary' :
                              l.status === 'reserved' ? 'warning' :
                              l.status === 'contracted' ? 'success' : 'info'
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
        <div className="glass-panel" style={{ padding: '25px' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ClipboardList style={{ color: 'var(--color-primary)' }} /> My Client Interest & Hold Submissions
          </h3>
          
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
                    <td colSpan={5} style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>No interest requests submitted yet. Go to the "Visual Inventory" tab to select a unit and submit customer interest.</td>
                  </tr>
                ) : (
                  reservations.map(res => {
                    return (
                      <tr key={res.id}>
                        <td>
                          <strong>{res.unit?.unit_number}</strong>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Project: {res.unit?.project?.name}</div>
                        </td>
                        <td>
                          <strong>{res.client?.name}</strong>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Phone: {res.client?.phone}</div>
                        </td>
                        <td>
                          {parseFloat(res.eoi_amount) > 0 ? (
                            <>
                              <strong>{parseFloat(res.eoi_amount).toLocaleString()} EGP</strong>
                              {res.payment_receipt_path && (
                                <div style={{ fontSize: '0.7rem', color: 'var(--color-primary)', textDecoration: 'underline', cursor: 'pointer' }}>View Receipt Slip</div>
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
                            <span style={{ color: '#ef4444' }}>
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
          
          {/* Commissions Summary Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '20px' }}>
            <div className="glass-panel" style={{ padding: '20px', textAlign: 'center' }}>
              <h4 style={statLabelStyle}>Gross Commission Value</h4>
              <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--color-primary)', marginTop: '8px' }}>{(stats.total_commissioned).toLocaleString()} EGP</h2>
            </div>
            <div className="glass-panel" style={{ padding: '20px', textAlign: 'center' }}>
              <h4 style={statLabelStyle}>Pending Payment (Draft)</h4>
              <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--color-warning)', marginTop: '8px' }}>{(stats.pending_commission).toLocaleString()} EGP</h2>
            </div>
            <div className="glass-panel" style={{ padding: '20px', textAlign: 'center' }}>
              <h4 style={statLabelStyle}>Approved Balance</h4>
              <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#10b981', marginTop: '8px' }}>{(stats.approved_commission).toLocaleString()} EGP</h2>
            </div>
            <div className="glass-panel" style={{ padding: '20px', textAlign: 'center' }}>
              <h4 style={statLabelStyle}>Accrued / Disbursed Payouts</h4>
              <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#8b5cf6', marginTop: '8px' }}>{(stats.paid_commission).toLocaleString()} EGP</h2>
            </div>
            <div className="glass-panel" style={{ padding: '20px', textAlign: 'center', background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
              <h4 style={statLabelStyle}>Available to Withdraw</h4>
              <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#10b981', marginTop: '8px' }}>{(stats.available_balance).toLocaleString()} EGP</h2>
              {stats.available_balance > 0 && (
                <button onClick={() => setShowPayoutModal(true)} className="btn-primary" style={{ width: '100%', padding: '6px', fontSize: '0.7rem', marginTop: '8px' }}>Submit Invoice</button>
              )}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '30px', alignItems: 'start' }}>
            {/* Deals Ledger */}
            <div className="glass-panel" style={{ padding: '25px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <DollarSign style={{ color: 'var(--color-primary)' }} /> Deals Ledger & Commission Calculations
              </h3>
              
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
                        <td colSpan={5} style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>No commissions registered. Commissions are automatically calculated upon final client booking approval.</td>
                      </tr>
                    ) : (
                      commissions.map(comm => {
                        return (
                          <tr key={comm.id}>
                            <td>
                              <strong>{comm.lead?.first_name} {comm.lead?.last_name}</strong>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Phone: {comm.lead?.phone}</div>
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
                              }`}>
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
            <div className="glass-panel" style={{ padding: '25px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ClipboardList style={{ color: '#8b5cf6' }} /> Payout Invoices History
              </h3>
              
              {payouts.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No payout invoices uploaded.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {payouts.map(p => (
                    <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--border-glass)' }}>
                      <div>
                        <span style={{ fontWeight: 800, color: '#f8fafc' }}>{parseFloat(p.amount).toLocaleString()} EGP</span>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Uploaded: {new Date(p.created_at).toLocaleDateString()}</div>
                        {p.rejection_reason && <div style={{ fontSize: '0.7rem', color: '#ef4444', marginTop: '4px' }}>Feedback: {p.rejection_reason}</div>}
                      </div>
                      <span className={`badge badge-${
                        p.status === 'pending_review' ? 'warning' :
                        p.status === 'approved' ? 'primary' :
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
        <div className="glass-panel" style={{ padding: '25px' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BookOpen style={{ color: 'var(--color-primary)' }} /> Marketing Assets & Digital Center
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '25px' }}>Download high-resolution project layouts, official price sheets, logos, and promotional brochures to present to clients.</p>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
            <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <h4 style={{ fontWeight: 800 }}>Nile Towers Layout Package</h4>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Includes master plan drawings, duplex configurations, and specifications sheets.</p>
              <button onClick={() => showToast('Brochure download triggered', 'success')} className="btn-secondary" style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
                <Download style={{ width: '14px', height: '14px' }} /> Download PDF (24MB)
              </button>
            </div>

            <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <h4 style={{ fontWeight: 800 }}>Dynamic Pricing Sheet</h4>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Updated real-time EGP matrices including downpayment options and payment duration multipliers.</p>
              <button onClick={() => showToast('Price list download triggered', 'success')} className="btn-secondary" style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
                <Download style={{ width: '14px', height: '14px' }} /> Download Excel (1.2MB)
              </button>
            </div>

            <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <h4 style={{ fontWeight: 800 }}>Developer Branding Logo kit</h4>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Branded vector logotypes, icons, and colors to stamp your mediation agency banners.</p>
              <button onClick={() => showToast('Branding kit download triggered', 'success')} className="btn-secondary" style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
                <Download style={{ width: '14px', height: '14px' }} /> Download ZIP (8.5MB)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REGISTER LEAD LOCK MODAL */}
      {showLeadModal && (
        <div className="modal-backdrop">
          <div className="glass-panel modal-content" style={{ width: '100%', maxWidth: '500px', padding: '30px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h3 style={{ fontWeight: 800 }}>Register Lead Lock (Anti-Poaching Protection)</h3>
            <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Submit the customer contact details. If no active lock exists, the lead is exclusively locked to your brokerage profile for 90 days.</p>
            
            <form onSubmit={handleRegisterLead} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div className="form-group">
                  <label className="form-label">First Name</label>
                  <input type="text" className="form-control" value={leadForm.first_name} onChange={e => setLeadForm({...leadForm, first_name: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Last Name</label>
                  <input type="text" className="form-control" value={leadForm.last_name} onChange={e => setLeadForm({...leadForm, last_name: e.target.value})} required />
                </div>
              </div>
              
              <div className="form-group">
                <label className="form-label">Phone</label>
                <input type="tel" className="form-control" placeholder="+20..." value={leadForm.phone} onChange={e => setLeadForm({...leadForm, phone: e.target.value})} required />
              </div>

              <div className="form-group">
                <label className="form-label">Email</label>
                <input type="email" className="form-control" value={leadForm.email} onChange={e => setLeadForm({...leadForm, email: e.target.value})} />
              </div>

              <div className="form-group">
                <label className="form-label">Egyptian National ID</label>
                <input type="text" className="form-control" value={leadForm.national_id} onChange={e => setLeadForm({...leadForm, national_id: e.target.value})} />
              </div>

              <div className="form-group">
                <label className="form-label">Budget (EGP)</label>
                <input type="number" className="form-control" value={leadForm.budget} onChange={e => setLeadForm({...leadForm, budget: e.target.value})} />
              </div>

              <div className="form-group">
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
        <div className="modal-backdrop">
          <div className="glass-panel modal-content" style={{ width: '100%', maxWidth: '480px', padding: '30px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h3 style={{ fontWeight: 800 }}>Submit Client Interest / تسجيل اهتمام عميل</h3>
            <p style={{ fontSize: '0.8rem', color: '#475569', marginTop: '-10px', marginBottom: '5px', lineHeight: '1.4' }}>
              Select a client to indicate their interest in this unit. Submitting this request notifies the Company Sales Representative to follow up and coordinate booking procedures.
            </p>
            <div style={{ padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '6px', fontSize: '0.8rem', border: '1px solid var(--border-glass)' }}>
              <div>🏢 Unit Code: <strong>{selectedUnitObj.unit_number}</strong></div>
              <div>📐 Area: {selectedUnitObj.area_sqm} sqm</div>
              <div>💰 Price: {parseFloat(selectedUnitObj.price).toLocaleString()} EGP</div>
            </div>

            <form onSubmit={handleReserveSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="form-group" style={{ marginBottom: '5px' }}>
                <label className="form-label">Select Client (Must be locked under your profile)</label>
                <select className="form-control" value={reserveForm.client_id} onChange={e => setReserveForm({...reserveForm, client_id: e.target.value})} required>
                  <option value="">-- Select Client --</option>
                  {leads.map(l => (
                    <option key={l.id} value={l.id}>{l.first_name} {l.last_name} ({l.phone})</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button type="button" className="btn-secondary" onClick={() => { setShowReserveModal(false); setSelectedUnitObj(null); }}>Cancel</button>
                <button type="submit" className="btn-primary">Submit Interest Request</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REQUEST COMMISSION PAYOUT MODAL */}
      {showPayoutModal && (
        <div className="modal-backdrop">
          <div className="glass-panel modal-content" style={{ width: '100%', maxWidth: '450px', padding: '30px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h3 style={{ fontWeight: 800 }}>Submit Commission Invoice Payout</h3>
            <div style={{ padding: '12px', background: 'rgba(16,185,129,0.05)', borderRadius: '6px', fontSize: '0.8rem', border: '1px solid rgba(16,185,129,0.2)', color: '#10b981', fontWeight: 700 }}>
              Available to request: {stats.available_balance.toLocaleString()} EGP
            </div>

            <form onSubmit={handlePayoutSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="form-group">
                <label className="form-label">Request Amount (EGP)</label>
                <input type="number" className="form-control" max={stats.available_balance} value={payoutForm.amount} onChange={e => setPayoutForm({...payoutForm, amount: e.target.value})} required placeholder="Enter payout amount..." />
              </div>

              <div className="form-group">
                <label className="form-label">Upload Commercial Tax Invoice (PDF/Image)</label>
                <div style={{ border: '2px dashed var(--border-glass)', padding: '15px', borderRadius: '6px', textAlign: 'center', cursor: 'pointer', fontSize: '0.75rem', color: '#94a3b8' }} onClick={() => showToast('Invoice PDF uploaded!', 'info')}>
                  📄 Upload invoice document (Mock)
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button type="button" className="btn-secondary" onClick={() => setShowPayoutModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary" style={{ background: '#10b981', border: 'none' }}>Submit Payout Request</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
};

// Inline Layout Helper Styles
const tabStyle = (isActive: boolean) => ({
  padding: '10px 18px',
  background: isActive ? 'rgba(92, 112, 100, 0.08)' : 'transparent', // Light primary green background tint for active
  border: 'none',
  borderBottom: isActive ? '3px solid var(--color-primary)' : '3px solid transparent',
  color: isActive ? 'var(--color-primary)' : '#334155', // High-contrast text colors: primary for active, dark slate for inactive
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  fontSize: '0.85rem',
  fontWeight: isActive ? 750 : 550,
  transition: 'all 0.15s',
  borderRadius: '6px 6px 0 0',
});

const statCardStyle = (bgColor: string, accentColor: string): React.CSSProperties => ({
  padding: '20px',
  background: bgColor,
  borderLeft: `5px solid ${accentColor}`,
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  minHeight: '110px'
});

const statLabelStyle = {
  fontSize: '0.75rem',
  textTransform: 'uppercase' as const,
  color: '#64748b',
  fontWeight: 700,
  letterSpacing: '0.05em'
};

const statValStyle = {
  fontSize: '1.7rem',
  fontWeight: 800,
  marginTop: '6px'
};

export default BrokerPortal;
