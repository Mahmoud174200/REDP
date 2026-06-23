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

const getBrokerSubRole = (user: any) => {
  if (!user) return { id: 'agent', label: 'Broker Agent', labelAr: 'وكيل عقاري', level: 1 };
  
  // Freelancer
  if (!user.company_id && !user.company) {
    return { id: 'freelancer', label: 'Freelancer', labelAr: 'بروكر مستقل', level: 0 };
  }
  
  const positionCode = user.employeeHierarchy?.position?.code || user.position?.code;
  const positionTitle = user.employeeHierarchy?.position?.title || user.position?.title || '';
  
  // Broker Owner
  if (positionCode === 'POS-DH' || positionTitle.includes('Owner') || positionTitle.includes('Head') || positionTitle.includes('CEO')) {
    return { id: 'owner', label: 'Broker Owner', labelAr: 'مالك الوكالة', level: 3 };
  }
  
  // Team Leader
  if (positionCode === 'POS-TL' || positionTitle.includes('Leader') || positionTitle.includes('Manager')) {
    return { id: 'team_leader', label: 'Team Leader', labelAr: 'قائد الفريق', level: 2 };
  }
  
  // Broker Agent (default)
  return { id: 'agent', label: 'Broker Agent', labelAr: 'وكيل عقاري', level: 1 };
};

const BrokerPortal: React.FC = () => {
  const [toasts, setToasts] = useState<{ id: string; message: string; type: 'success' | 'error' | 'info' }[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'inventory' | 'leads' | 'submissions' | 'commissions' | 'marketing' | 'settings'>('overview');
  
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
    available_balance: 0,
    total_calls: 0,
    total_meetings: 0,
    closed_sales: 0
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

  // Lead interactions modals
  const [showContactModal, setShowContactModal] = useState(false);
  const [showMeetingModal, setShowMeetingModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedLeadForAction, setSelectedLeadForAction] = useState<any | null>(null);

  const [contactType, setContactType] = useState('call');
  const [contactNotes, setContactNotes] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');

  const [meetingDate, setMeetingDate] = useState('');
  const [meetingLocation, setMeetingLocation] = useState('Company HQ Office');
  const [meetingNotes, setMeetingNotes] = useState('');

  const [historyLoading, setHistoryLoading] = useState(false);
  const [leadHistory, setLeadHistory] = useState<any[]>([]);

  // Commission settings splits
  const [brokerCompanySettings, setBrokerCompanySettings] = useState<any>(null);
  const [ownerSplitRate, setOwnerSplitRate] = useState('');
  const [leaderSplitRate, setLeaderSplitRate] = useState('');
  const [agentSplitRate, setAgentSplitRate] = useState('');
  const [developerRate, setDeveloperRate] = useState('');
  const [selectedCompanyIdForAdmin, setSelectedCompanyIdForAdmin] = useState('');
  const [allCompaniesList, setAllCompaniesList] = useState<any[]>([]);
  
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

      // 7. Fetch Commission Settings
      const isOwner = userObj && (getBrokerSubRole(userObj).id === 'owner');
      const isAdmin = userObj && (userObj.role === 'admin');
      
      if (isOwner || isAdmin) {
        try {
          const settingsRes = await api.get('/v1/sales/broker/commissions/settings');
          if (settingsRes.data && settingsRes.data.success) {
            const data = settingsRes.data.data;
            setBrokerCompanySettings(data);
            setOwnerSplitRate(data.owner_commission_rate.toString());
            setLeaderSplitRate(data.leader_commission_rate.toString());
            setAgentSplitRate(data.agent_commission_rate.toString());
          }
        } catch (e) {
          console.error('Failed to load company splits settings', e);
        }
      }

      if (isAdmin) {
        try {
          const companiesRes = await api.get('/v1/enterprise/companies');
          if (companiesRes.data && companiesRes.data.success) {
            setAllCompaniesList(companiesRes.data.data || []);
            if (companiesRes.data.data?.length > 0) {
              const firstComp = companiesRes.data.data[0];
              setSelectedCompanyIdForAdmin(firstComp.id);
              setDeveloperRate(firstComp.developer_brokerage_rate.toString());
            }
          }
        } catch (e) {
          console.error('Failed to load companies list for admin', e);
        }
      }

      // 8. Fetch Commissions
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

  // Lead contact logging handler
  const handleLogContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLeadForAction || !contactNotes) return;
    try {
      setIsLoading(true);
      const res = await api.put(`/v1/sales/broker/leads/${selectedLeadForAction.id}/contact`, {
        type: contactType,
        notes: contactNotes,
        follow_up_date: followUpDate || undefined
      });
      if (res.data && res.data.success) {
        showToast('Contact logged successfully!', 'success');
        setContactNotes('');
        setFollowUpDate('');
        setShowContactModal(false);
        setSelectedLeadForAction(null);
        await fetchAllData();
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to log contact.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Lead schedule meeting handler
  const handleScheduleMeetingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLeadForAction || !meetingDate) return;
    try {
      setIsLoading(true);
      const res = await api.put(`/v1/sales/broker/leads/${selectedLeadForAction.id}/schedule-meeting`, {
        meeting_date: meetingDate,
        location: meetingLocation,
        notes: meetingNotes
      });
      if (res.data && res.data.success) {
        showToast('Meeting scheduled successfully!', 'success');
        setMeetingDate('');
        setMeetingNotes('');
        setShowMeetingModal(false);
        setSelectedLeadForAction(null);
        await fetchAllData();
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to schedule meeting.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Commission Owner split update handler
  const handleUpdateSplitsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      const res = await api.put('/v1/sales/broker/commissions/settings', {
        owner_commission_rate: parseFloat(ownerSplitRate),
        leader_commission_rate: parseFloat(leaderSplitRate),
        agent_commission_rate: parseFloat(agentSplitRate)
      });
      if (res.data && res.data.success) {
        showToast('Commission split rates updated successfully!', 'success');
        await fetchAllData();
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to update splits.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenHistory = async (lead: any) => {
    setSelectedLeadForAction(lead);
    setHistoryLoading(true);
    setShowHistoryModal(true);
    try {
      const res = await api.get(`/v1/sales/broker/leads/${lead.id}`);
      if (res.data && res.data.success) {
        setLeadHistory(res.data.data.interactions || []);
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to load lead interaction history', 'error');
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleCompanyChange = (companyId: string) => {
    setSelectedCompanyIdForAdmin(companyId);
    const comp = allCompaniesList.find(c => c.id === companyId);
    if (comp) {
      setDeveloperRate(comp.developer_brokerage_rate.toString());
    }
  };

  // Developer company brokerage rate update handler
  const handleUpdateDeveloperRateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCompanyIdForAdmin) return;
    try {
      setIsLoading(true);
      const res = await api.put(`/v1/admin/companies/${selectedCompanyIdForAdmin}/developer-rate`, {
        developer_brokerage_rate: parseFloat(developerRate)
      });
      if (res.data && res.data.success) {
        showToast('Company brokerage rate updated successfully!', 'success');
        // update local list
        setAllCompaniesList(prev => prev.map(c => c.id === selectedCompanyIdForAdmin ? { ...c, developer_brokerage_rate: parseFloat(developerRate) } : c));
        await fetchAllData();
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to update company rate.', 'error');
    } finally {
      setIsLoading(false);
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

  const subRole = getBrokerSubRole(currentUser);
  const isOwner = subRole.id === 'owner';
  const isAdmin = currentUser?.role === 'admin';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', position: 'relative' }}>
      
      {/* Premium Header Panel */}
      <div className="glass-panel" style={{ padding: '24px 30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <i className="fa-solid fa-handshake" style={{ color: 'var(--color-primary)' }}></i> Broker Mediation Dashboard
            {(() => {
              const subRole = getBrokerSubRole(currentUser);
              if (subRole.id === 'freelancer') {
                return (
                  <span className="badge" style={{ background: 'rgba(234, 88, 12, 0.1)', color: 'var(--color-warning)', border: '1px solid rgba(234, 88, 12, 0.25)', fontSize: '0.72rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px', textTransform: 'none' }}>
                    <i className="fa-solid fa-user-tag"></i> 👤 Freelancer / بروكر مستقل
                  </span>
                );
              }
              const roleColor = subRole.id === 'owner' ? '#ef4444' : subRole.id === 'team_leader' ? '#ea580c' : 'var(--color-primary)';
              const roleBg = subRole.id === 'owner' ? 'rgba(239, 68, 68, 0.1)' : subRole.id === 'team_leader' ? 'rgba(234, 88, 12, 0.1)' : 'rgba(0, 61, 166, 0.1)';
              const roleBorder = subRole.id === 'owner' ? 'rgba(239, 68, 68, 0.2)' : subRole.id === 'team_leader' ? 'rgba(234, 88, 12, 0.2)' : 'rgba(0, 61, 166, 0.2)';
              const icon = subRole.id === 'owner' ? 'fa-crown' : subRole.id === 'team_leader' ? 'fa-people-group' : 'fa-user-tie';
              
              return (
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <span className="badge badge-info" style={{ fontSize: '0.72rem', fontWeight: 700 }}>
                    🏢 {currentUser?.company?.name || 'Agency'} Brokerage
                  </span>
                  <span className="badge" style={{ background: roleBg, color: roleColor, border: `1px solid ${roleBorder}`, fontSize: '0.72rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px', textTransform: 'none' }}>
                    <i className={`fa-solid ${icon}`}></i> {subRole.label} / {subRole.labelAr}
                  </span>
                </div>
              );
            })()}
          </h1>
          <p style={{ margin: 0, color: 'var(--text-muted)' }}>
            {(() => {
              const subRole = getBrokerSubRole(currentUser);
              if (subRole.id === 'owner') return 'Full agency mediation: view agency totals, manage team, track agency commissions ledger';
              if (subRole.id === 'team_leader') return 'Team mediation: manage your team\'s progress, aggregate team performance & commissions';
              return 'Manage client locks, request unit reservation holds, download media assets, and track commission ledger';
            })()}
          </p>
        </div>
        <button onClick={() => setShowLeadModal(true)} className="btn-primary" style={{ gap: '8px' }}>
          <i className="fa-solid fa-plus" style={{ fontSize: '0.85rem' }}></i> Register Lead Lock
        </button>
      </div>

      {/* Tabs Navigation Switcher */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {[
          { key: 'overview' as const, label: 'Overview', icon: 'fa-solid fa-chart-pie' },
          { key: 'inventory' as const, label: 'Project Details', icon: 'fa-solid fa-map-location-dot' },
          { key: 'leads' as const, label: 'Lead Protection Lock', icon: 'fa-solid fa-user-shield' },
          { key: 'submissions' as const, label: 'Interest & Hold Requests', icon: 'fa-solid fa-clipboard-list' },
          { key: 'commissions' as const, label: 'Commissions Ledger', icon: 'fa-solid fa-sack-dollar' },
          { key: 'marketing' as const, label: 'Marketing Hub', icon: 'fa-solid fa-folder-open' },
          ...((isOwner || isAdmin) ? [{ key: 'settings' as const, label: 'Agency Settings', icon: 'fa-solid fa-sliders' }] : [])
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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px' }}>
            {[
              { 
                label: (() => {
                  const r = getBrokerSubRole(currentUser).id;
                  if (r === 'owner') return 'Agency Locked Clients';
                  if (r === 'team_leader') return 'Team Locked Clients';
                  return 'My Locked Clients';
                })(), 
                value: `${stats.total_leads} leads`, 
                icon: <i className="fa-solid fa-users" style={{ color: 'var(--color-primary)', fontSize: '1.2rem' }}></i> 
              },
              { 
                label: (() => {
                  const r = getBrokerSubRole(currentUser).id;
                  if (r === 'owner') return 'Agency Pending Holds';
                  if (r === 'team_leader') return 'Team Pending Holds';
                  return 'My Pending Holds';
                })(), 
                value: `${reservations.filter(r => r.status === 'pending').length} holds`, 
                icon: <i className="fa-solid fa-clock" style={{ color: 'var(--color-warning)', fontSize: '1.2rem' }}></i> 
              },
              { 
                label: (() => {
                  const r = getBrokerSubRole(currentUser).id;
                  if (r === 'owner') return 'Agency Approved Commissions';
                  if (r === 'team_leader') return 'Team Approved Commissions';
                  return 'Approved Commissions';
                })(), 
                value: `${stats.approved_commission.toLocaleString()} EGP`, 
                icon: <i className="fa-solid fa-circle-check" style={{ color: 'var(--color-success)', fontSize: '1.2rem' }}></i> 
              },
              { 
                label: (() => {
                  const r = getBrokerSubRole(currentUser).id;
                  if (r === 'owner') return 'Agency Payout Balance';
                  if (r === 'team_leader') return 'Team Payout Balance';
                  return 'Available Balance';
                })(), 
                value: `${stats.available_balance.toLocaleString()} EGP`, 
                icon: <i className="fa-solid fa-wallet" style={{ color: 'var(--color-info)', fontSize: '1.2rem' }}></i>, 
                action: true 
              },
              { 
                label: (() => {
                  const r = getBrokerSubRole(currentUser).id;
                  if (r === 'owner') return 'Agency Total Calls / المكالمات';
                  if (r === 'team_leader') return 'Team Total Calls / المكالمات';
                  return 'My Logged Calls / مكالماتي';
                })(), 
                value: `${stats.total_calls ?? 0} calls`, 
                icon: <i className="fa-solid fa-phone" style={{ color: '#8b5cf6', fontSize: '1.2rem' }}></i> 
              },
              { 
                label: (() => {
                  const r = getBrokerSubRole(currentUser).id;
                  if (r === 'owner') return 'Agency Scheduled Meetings / المقابلات';
                  if (r === 'team_leader') return 'Team Scheduled Meetings / المقابلات';
                  return 'My Scheduled Meetings / مقابلاتي';
                })(), 
                value: `${stats.total_meetings ?? 0} meetings`, 
                icon: <i className="fa-solid fa-calendar-days" style={{ color: '#3b82f6', fontSize: '1.2rem' }}></i> 
              },
              { 
                label: (() => {
                  const r = getBrokerSubRole(currentUser).id;
                  if (r === 'owner') return 'Agency Closed Sales / صفقات مغلقة';
                  if (r === 'team_leader') return 'Team Closed Sales / صفقات مغلقة';
                  return 'My Closed Sales / مبيعاتي';
                })(), 
                value: `${stats.closed_sales ?? 0} deals`, 
                icon: <i className="fa-solid fa-trophy" style={{ color: '#fbbf24', fontSize: '1.2rem' }}></i> 
              },
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

          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '24px' }}>
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
          </div>

          {/* Team Performance Section */}
          {subordinatesPerformance && subordinatesPerformance.length > 0 && (() => {
            const subRole = getBrokerSubRole(currentUser);
            if (subRole.id !== 'owner' && subRole.id !== 'team_leader') return null;
            return (
              <div className="glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--border-glass)' }}>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'var(--font-title)' }}>
                    <i className="fa-solid fa-people-group" style={{ color: 'var(--color-primary)' }}></i>
                    {subRole.id === 'owner' ? 'Agency Team Performance & Commissions / أداء عملاء ومبيعات الوكالة' : 'My Team Performance & Commissions / أداء عملاء ومبيعات الفريق'}
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
                        <th>Calls Logged</th>
                        <th>Meetings Booked</th>
                        <th>Closed Sales</th>
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
                          <td>{sub.stats?.total_calls ?? 0}</td>
                          <td>{sub.stats?.total_meetings ?? 0}</td>
                          <td>{sub.stats?.closed_sales ?? 0}</td>
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
            );
          })()}
        </div>
      )}

      {/* TAB CONTENT: INVENTORY */}
      {activeTab === 'inventory' && (() => {
        const proj = projects.find(p => p.id === selectedProjectId);
        
        // Calculate price and area ranges from the fetched units
        const prices = units.map(u => parseFloat(u.price)).filter(p => !isNaN(p) && p > 0);
        const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
        const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;

        const areas = units.map(u => parseFloat(u.area || u.area_sqm || u.area_size)).filter(a => !isNaN(a) && a > 0);
        const minArea = areas.length > 0 ? Math.min(...areas) : 0;
        const maxArea = areas.length > 0 ? Math.max(...areas) : 0;

        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* Top Selector Panel */}
            <div className="glass-panel" style={{ padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                <span style={{ fontWeight: 800, color: 'var(--text-muted)', fontSize: '0.9rem' }}>Select Project:</span>
                <select className="form-control" value={selectedProjectId} onChange={e => setSelectedProjectId(e.target.value)} style={{ width: '280px', height: '40px', fontWeight: 600 }}>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              {proj && (
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <span className="badge badge-info" style={{ padding: '6px 12px', fontSize: '0.75rem', fontWeight: 700 }}>
                    <i className="fa-solid fa-location-dot" style={{ marginRight: '6px' }}></i> {proj.location}
                  </span>
                  {proj.delivery_date && (
                    <span className="badge badge-success" style={{ padding: '6px 12px', fontSize: '0.75rem', fontWeight: 700 }}>
                      <i className="fa-solid fa-calendar-day" style={{ marginRight: '6px' }}></i> Delivery: {proj.delivery_date.substring(0, 10)}
                    </span>
                  )}
                  <span className="badge" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-glass)', padding: '6px 12px', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-main)' }}>
                    Type: {proj.project_type || 'Mixed Use'}
                  </span>
                </div>
              )}
            </div>

            {proj ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '24px', alignItems: 'start' }}>
                
                {/* Left Column: Specifications, Price & Area Ranges, Master Plan Details */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  
                  {/* Stats & Ranges Card */}
                  <div className="glass-panel" style={{ padding: '24px' }}>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'var(--font-title)' }}>
                      <i className="fa-solid fa-circle-info" style={{ color: 'var(--color-primary)' }}></i> Project Specifications & Ranges
                    </h3>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                      {/* Price Range */}
                      <div style={{ padding: '16px', background: 'rgba(46, 125, 50, 0.04)', border: '1px solid rgba(46, 125, 50, 0.1)', borderRadius: '8px' }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase', fontWeight: 600 }}>Price Range</div>
                        <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--color-success)', fontFamily: 'var(--font-title)' }}>
                          {minPrice > 0 ? `${fmtPrice(minPrice)} - ${fmtPrice(maxPrice)}` : 'Contact Sales'}
                        </div>
                      </div>

                      {/* Area Range */}
                      <div style={{ padding: '16px', background: 'rgba(0, 61, 166, 0.04)', border: '1px solid rgba(0, 61, 166, 0.1)', borderRadius: '8px' }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase', fontWeight: 600 }}>Area Size Range</div>
                        <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--color-primary)', fontFamily: 'var(--font-title)' }}>
                          {minArea > 0 ? `${minArea} sqm - ${maxArea} sqm` : 'Contact Sales'}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginTop: '20px', paddingTop: '20px', borderTop: '1px solid var(--border-glass)' }}>
                      <div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Land Area</div>
                        <div style={{ fontSize: '0.95rem', fontWeight: 700, marginTop: '4px' }}>
                          {proj.land_area ? `${proj.land_area} ${proj.land_area_unit || 'sqm'}` : '—'}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Building Ratio</div>
                        <div style={{ fontSize: '0.95rem', fontWeight: 700, marginTop: '4px' }}>
                          {proj.building_ratio ? `${proj.building_ratio}%` : '—'}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Total Buildings</div>
                        <div style={{ fontSize: '0.95rem', fontWeight: 700, marginTop: '4px' }}>
                          {proj.total_buildings_count || '—'}
                        </div>
                      </div>
                      <div style={{ marginTop: '10px' }}>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Green Area</div>
                        <div style={{ fontSize: '0.95rem', fontWeight: 700, marginTop: '4px' }}>
                          {proj.total_green_area ? `${proj.total_green_area}%` : '—'}
                        </div>
                      </div>
                      <div style={{ marginTop: '10px' }}>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Roads Area</div>
                        <div style={{ fontSize: '0.95rem', fontWeight: 700, marginTop: '4px' }}>
                          {proj.total_roads_area ? `${proj.total_roads_area}%` : '—'}
                        </div>
                      </div>
                      <div style={{ marginTop: '10px' }}>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Parking Spaces</div>
                        <div style={{ fontSize: '0.95rem', fontWeight: 700, marginTop: '4px' }}>
                          {proj.total_parking_spaces || '—'}
                        </div>
                      </div>
                    </div>

                    {proj.infrastructure_notes && (
                      <div style={{ marginTop: '20px', padding: '12px 16px', background: 'rgba(255,255,255,0.01)', borderRadius: '8px', border: '1px solid var(--border-glass)', fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                        <strong>Infrastructure Notes:</strong> {proj.infrastructure_notes}
                      </div>
                    )}
                  </div>

                  {/* Master Plan Card */}
                  <div className="glass-panel" style={{ padding: '24px' }}>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'var(--font-title)' }}>
                      <i className="fa-solid fa-map-location-dot" style={{ color: 'var(--color-secondary)' }}></i> Project Master Plan Diagram
                    </h3>
                    {proj.master_plan_image_url ? (
                      <div style={{ background: 'rgba(0,0,0,0.1)', padding: '10px', borderRadius: '8px', textAlign: 'center', overflow: 'hidden' }}>
                        <img src={proj.master_plan_image_url} alt="Master Plan" style={{ maxWidth: '100%', maxHeight: '420px', objectFit: 'contain', borderRadius: '6px' }} />
                      </div>
                    ) : (
                      <div style={{ padding: '48px 20px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px dashed var(--border-glass)', textAlign: 'center' }}>
                        <i className="fa-solid fa-map" style={{ fontSize: '2.5rem', color: 'var(--text-muted)', opacity: 0.3, marginBottom: '12px' }}></i>
                        <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.85rem' }}>No master plan image uploaded yet for this project.</p>
                      </div>
                    )}
                  </div>

                </div>

                {/* Right Column: Payment Plans */}
                <div className="glass-panel" style={{ padding: '24px' }}>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'var(--font-title)' }}>
                    <i className="fa-regular fa-credit-card" style={{ color: 'var(--color-success)' }}></i> Payment Plans
                  </h3>

                  {!proj.payment_plans || proj.payment_plans.length === 0 ? (
                    <div style={{ padding: '30px 10px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      No specific payment plans configured for this project.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      {proj.payment_plans.map((pp: any, idx: number) => {
                        const colors = ['var(--color-primary)', 'var(--color-success)', 'var(--color-warning)', 'var(--color-danger)'];
                        const borderAccent = colors[idx % colors.length];
                        return (
                          <div key={pp.id || idx} style={{ padding: '16px', background: 'rgba(255,255,255,0.01)', borderRadius: '8px', border: '1px solid var(--border-glass)', borderLeft: `4px solid ${borderAccent}` }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                              <div>
                                <strong style={{ fontSize: '0.9rem', color: 'var(--text-main)' }}>{pp.name}</strong>
                                {pp.name_ar && <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>{pp.name_ar}</div>}
                              </div>
                              {parseFloat(pp.discount_pct) > 0 && (
                                <span className="badge badge-danger" style={{ fontSize: '0.68rem', fontWeight: 850 }}>
                                  {parseFloat(pp.discount_pct).toFixed(0)}% OFF
                                </span>
                              )}
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.8rem', marginTop: '10px' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: 'var(--text-muted)' }}>Down Payment:</span>
                                <strong style={{ color: 'var(--text-main)' }}>{parseFloat(pp.down_payment_pct).toFixed(0)}%</strong>
                              </div>
                              {pp.installments > 0 && (
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                  <span style={{ color: 'var(--text-muted)' }}>Installments Duration:</span>
                                  <strong style={{ color: 'var(--text-main)' }}>{pp.installments} months</strong>
                                </div>
                              )}
                            </div>

                            {pp.description && (
                              <p style={{ margin: '10px 0 0 0', padding: '8px 10px', background: 'rgba(255,255,255,0.02)', borderRadius: '4px', fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                                {pp.description}
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

              </div>
            ) : (
              <div className="glass-panel" style={{ padding: '50px', textAlign: 'center', color: 'var(--text-muted)' }}>
                Select a project to view specifications, master plan, and payment plans.
              </div>
            )}

          </div>
        );
      })()}

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
                    <th>Actions / الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {leads.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>No leads registered. Use the panel on the left to lock a client.</td>
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
                              {statusLabel[l.status] || l.status}
                            </span>
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                              <button onClick={() => { setSelectedLeadForAction(l); setContactType('call'); setContactNotes(''); setFollowUpDate(''); setShowContactModal(true); }} className="btn-secondary" style={{ padding: '4px 8px', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <i className="fa-solid fa-phone" style={{ color: 'var(--color-primary)' }}></i> الاتصال
                              </button>
                              <button onClick={() => { setSelectedLeadForAction(l); setMeetingDate(''); setMeetingLocation('Company HQ Office'); setMeetingNotes(''); setShowMeetingModal(true); }} className="btn-secondary" style={{ padding: '4px 8px', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <i className="fa-solid fa-calendar-check" style={{ color: 'var(--color-success)' }}></i> مقابلة
                              </button>
                              <button onClick={() => handleOpenHistory(l)} className="btn-secondary" style={{ padding: '4px 8px', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <i className="fa-solid fa-history" style={{ color: 'var(--color-secondary)' }}></i> السجل
                              </button>
                            </div>
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
                    <td colSpan={5} style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>No interest requests submitted yet. Go to the "Project Details" tab to select a unit and submit customer interest.</td>
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

      {/* TAB CONTENT: SETTINGS (OWNER SPLITS & ADMIN DEVELOPER RATES) */}
      {activeTab === 'settings' && (isOwner || isAdmin) && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', alignItems: 'start' }}>
          
          {/* OWNER COMMISSION OVERRIDES SPLITS FORM */}
          {isOwner && (
            <div className="glass-panel" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'var(--font-title)' }}>
                <i className="fa-solid fa-percent" style={{ color: 'var(--color-primary)' }}></i> Company Commission Override Splits
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '20px' }}>
                Set the internal percentage share splits for each role on deals. The total sum cannot exceed the company developer rate of <strong>{(brokerCompanySettings?.developer_brokerage_rate ?? 0).toFixed(2)}%</strong>.
              </p>

              <form onSubmit={handleUpdateSplitsSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Owner Rate / نسبة الأونر (%)</label>
                  <input type="number" step="0.01" min="0" max="100" className="form-control" value={ownerSplitRate} onChange={e => setOwnerSplitRate(e.target.value)} required />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Team Leader Rate / نسبة قائد الفريق (%)</label>
                  <input type="number" step="0.01" min="0" max="100" className="form-control" value={leaderSplitRate} onChange={e => setLeaderSplitRate(e.target.value)} required />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Broker Agent Rate / نسبة الوكيل (%)</label>
                  <input type="number" step="0.01" min="0" max="100" className="form-control" value={agentSplitRate} onChange={e => setAgentSplitRate(e.target.value)} required />
                </div>

                {/* Sum validation warning message */}
                {(() => {
                  const oVal = parseFloat(ownerSplitRate) || 0;
                  const lVal = parseFloat(leaderSplitRate) || 0;
                  const aVal = parseFloat(agentSplitRate) || 0;
                  const sum = oVal + lVal + aVal;
                  const maxRate = brokerCompanySettings?.developer_brokerage_rate ?? 0;
                  const isOver = sum > maxRate;
                  
                  return (
                    <div style={{ 
                      padding: '12px', 
                      borderRadius: '6px', 
                      background: isOver ? 'rgba(239, 68, 68, 0.08)' : 'rgba(16, 185, 129, 0.08)', 
                      border: `1px solid ${isOver ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)'}`,
                      fontSize: '0.78rem',
                      color: isOver ? 'var(--color-danger)' : 'var(--color-success)',
                      fontWeight: 600,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Current Sum of Splits:</span>
                        <span>{sum.toFixed(2)}%</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Developer Brokerage Rate Limit:</span>
                        <span>{maxRate.toFixed(2)}%</span>
                      </div>
                      {isOver && (
                        <div style={{ color: '#ef4444', marginTop: '4px', fontSize: '0.72rem' }}>
                          ⚠️ Error: The splits total exceeds the developer rate limit! Please adjust your rates.
                        </div>
                      )}
                    </div>
                  );
                })()}

                <button type="submit" className="btn-primary" 
                  disabled={(() => {
                    const oVal = parseFloat(ownerSplitRate) || 0;
                    const lVal = parseFloat(leaderSplitRate) || 0;
                    const aVal = parseFloat(agentSplitRate) || 0;
                    const sum = oVal + lVal + aVal;
                    const maxRate = brokerCompanySettings?.developer_brokerage_rate ?? 0;
                    return sum > maxRate;
                  })()}>
                  Update Splitting Structure
                </button>
              </form>
            </div>
          )}

          {/* ADMIN / DEVELOPER COMPANY RATE OVERRIDE */}
          {isAdmin && (
            <div className="glass-panel" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'var(--font-title)' }}>
                <i className="fa-solid fa-crown" style={{ color: '#fbbf24' }}></i> Developer Company Rate Configuration
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '20px' }}>
                As a developer administrator, set the baseline total brokerage rate (%) paid to the broker company.
              </p>

              <form onSubmit={handleUpdateDeveloperRateSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Select Company</label>
                  <select className="form-control" value={selectedCompanyIdForAdmin} 
                    onChange={e => handleCompanyChange(e.target.value)}>
                    {allCompaniesList.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Developer Brokerage Rate (%)</label>
                  <input type="number" step="0.01" min="0" max="100" className="form-control" value={developerRate} onChange={e => setDeveloperRate(e.target.value)} required />
                </div>

                <button type="submit" className="btn-primary">Update Company Rate</button>
              </form>
            </div>
          )}
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

      {/* LOG CONTACT MODAL */}
      {showContactModal && selectedLeadForAction && (
        <div className="modal-backdrop" onClick={() => { setShowContactModal(false); setSelectedLeadForAction(null); }}>
          <div className="glass-panel modal-content" style={{ width: '100%', maxWidth: '480px', padding: '30px', display: 'flex', flexDirection: 'column', gap: '20px' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-glass)', paddingBottom: '12px' }}>
              <h3 style={{ margin: 0, fontWeight: 800, fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <i className="fa-solid fa-phone" style={{ color: 'var(--color-primary)' }}></i> Log Contact / تسجيل اتصال
              </h3>
              <button onClick={() => { setShowContactModal(false); setSelectedLeadForAction(null); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <i className="fa-solid fa-xmark" style={{ fontSize: '1.2rem' }}></i>
              </button>
            </div>

            <div style={{ padding: '10px 14px', background: 'rgba(50, 71, 58, 0.04)', borderRadius: '6px', fontSize: '0.8rem' }}>
              Client: <strong>{selectedLeadForAction.first_name} {selectedLeadForAction.last_name}</strong> ({selectedLeadForAction.phone})
            </div>

            <form onSubmit={handleLogContactSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Interaction Type / نوع التواصل *</label>
                <select className="form-control" value={contactType} onChange={e => setContactType(e.target.value)} required>
                  <option value="call">Call / مكالمة هاتفية</option>
                  <option value="whatsapp">WhatsApp / رسالة واتساب</option>
                  <option value="email">Email / بريد إلكتروني</option>
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Interaction Notes / تفاصيل التواصل *</label>
                <textarea className="form-control" rows={4} value={contactNotes} onChange={e => setContactNotes(e.target.value)} required placeholder="Provide brief summary of client interaction..." />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Follow-up Date / موعد المتابعة القادم (Optional)</label>
                <input type="date" className="form-control" value={followUpDate} onChange={e => setFollowUpDate(e.target.value)} />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button type="button" className="btn-secondary" onClick={() => { setShowContactModal(false); setSelectedLeadForAction(null); }}>Cancel</button>
                <button type="submit" className="btn-primary">Log Contact</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SCHEDULE MEETING MODAL */}
      {showMeetingModal && selectedLeadForAction && (
        <div className="modal-backdrop" onClick={() => { setShowMeetingModal(false); setSelectedLeadForAction(null); }}>
          <div className="glass-panel modal-content" style={{ width: '100%', maxWidth: '480px', padding: '30px', display: 'flex', flexDirection: 'column', gap: '20px' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-glass)', paddingBottom: '12px' }}>
              <h3 style={{ margin: 0, fontWeight: 800, fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <i className="fa-solid fa-calendar-check" style={{ color: 'var(--color-success)' }}></i> Schedule Meeting / حجز مقابلة
              </h3>
              <button onClick={() => { setShowMeetingModal(false); setSelectedLeadForAction(null); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <i className="fa-solid fa-xmark" style={{ fontSize: '1.2rem' }}></i>
              </button>
            </div>

            <div style={{ padding: '10px 14px', background: 'rgba(50, 71, 58, 0.04)', borderRadius: '6px', fontSize: '0.8rem' }}>
              Client: <strong>{selectedLeadForAction.first_name} {selectedLeadForAction.last_name}</strong> ({selectedLeadForAction.phone})
            </div>

            <form onSubmit={handleScheduleMeetingSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Meeting Date & Time / موعد المقابلة *</label>
                <input type="datetime-local" className="form-control" value={meetingDate} onChange={e => setMeetingDate(e.target.value)} required />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Location / الموقع</label>
                <input type="text" className="form-control" value={meetingLocation} onChange={e => setMeetingLocation(e.target.value)} required placeholder="Enter location..." />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Meeting Notes / ملاحظات</label>
                <textarea className="form-control" rows={3} value={meetingNotes} onChange={e => setMeetingNotes(e.target.value)} placeholder="Provide additional meeting guidelines..." />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button type="button" className="btn-secondary" onClick={() => { setShowMeetingModal(false); setSelectedLeadForAction(null); }}>Cancel</button>
                <button type="submit" className="btn-primary">Schedule Meeting</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* LEAD HISTORY MODAL */}
      {showHistoryModal && selectedLeadForAction && (
        <div className="modal-backdrop" onClick={() => { setShowHistoryModal(false); setSelectedLeadForAction(null); setLeadHistory([]); }}>
          <div className="glass-panel modal-content" style={{ width: '100%', maxWidth: '540px', padding: '30px', display: 'flex', flexDirection: 'column', gap: '20px' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-glass)', paddingBottom: '12px' }}>
              <h3 style={{ margin: 0, fontWeight: 800, fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <i className="fa-solid fa-history" style={{ color: 'var(--color-secondary)' }}></i> Interaction History / سجل المعاملات
              </h3>
              <button onClick={() => { setShowHistoryModal(false); setSelectedLeadForAction(null); setLeadHistory([]); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <i className="fa-solid fa-xmark" style={{ fontSize: '1.2rem' }}></i>
              </button>
            </div>

            <div style={{ padding: '10px 14px', background: 'rgba(50, 71, 58, 0.04)', borderRadius: '6px', fontSize: '0.8rem', display: 'flex', justifyContent: 'space-between' }}>
              <span>Client: <strong>{selectedLeadForAction.first_name} {selectedLeadForAction.last_name}</strong></span>
              <span>Phone: {selectedLeadForAction.phone}</span>
            </div>

            {historyLoading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
                <div className="animate-spin" style={{ width: '30px', height: '30px', border: '3px solid var(--color-secondary)', borderTopColor: 'var(--color-primary)', borderRadius: '50%' }} />
              </div>
            ) : leadHistory.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                No past interactions logged for this lead.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '350px', overflowY: 'auto', paddingRight: '8px' }}>
                {leadHistory.map((item: any, idx: number) => {
                  let iconName = 'fa-phone';
                  let iconColor = 'var(--color-primary)';
                  let isBrand = false;
                  
                  if (item.type === 'call') {
                    iconName = 'fa-phone';
                    iconColor = 'var(--color-primary)';
                  } else if (item.type === 'whatsapp') {
                    iconName = 'fa-whatsapp';
                    iconColor = '#10b981';
                    isBrand = true;
                  } else if (item.type === 'meeting') {
                    iconName = 'fa-calendar-days';
                    iconColor = '#3b82f6';
                  } else if (item.type === 'email') {
                    iconName = 'fa-envelope';
                    iconColor = '#ea580c';
                  }
                  
                  return (
                    <div key={item.id || idx} style={{ display: 'flex', gap: '14px', position: 'relative' }}>
                      {idx !== leadHistory.length - 1 && (
                        <div style={{ position: 'absolute', left: '15px', top: '30px', bottom: '-20px', width: '2px', background: 'var(--border-glass)' }} />
                      )}
                      
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid var(--border-glass)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1
                      }}>
                        <i className={`${isBrand ? 'fa-brands' : 'fa-solid'} ${iconName}`} style={{ color: iconColor, fontSize: '0.85rem' }} />
                      </div>

                      <div className="glass-panel" style={{ flexGrow: 1, padding: '12px 16px', background: 'rgba(255, 255, 255, 0.01)', border: '1px solid var(--border-glass)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                          <span style={{ fontWeight: 800, textTransform: 'capitalize', fontSize: '0.78rem' }}>{item.type}</span>
                          <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                            {new Date(item.created_at).toLocaleString()}
                          </span>
                        </div>
                        <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-main)', lineHeight: '1.4' }}>
                          {item.notes}
                        </p>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                          <span>Logged by: {item.logger?.name || 'System'}</span>
                          {item.follow_up_date && (
                            <span style={{ color: 'var(--color-primary)', fontWeight: 600 }}>
                              Follow-up: {new Date(item.follow_up_date).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
              <button className="btn-secondary" onClick={() => { setShowHistoryModal(false); setSelectedLeadForAction(null); setLeadHistory([]); }}>Close</button>
            </div>
          </div>
        </div>
      )}

      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
};

export default BrokerPortal;
