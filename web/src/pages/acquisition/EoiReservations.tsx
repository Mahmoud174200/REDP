import React, { useState, useEffect, useCallback, useRef } from 'react';
import api from '../../services/api';
import {
  FileText, Upload, CheckCircle, XCircle, Clock, Search,
  ChevronRight, ChevronLeft, Eye, X, AlertTriangle,
  DollarSign, Hash, Users, TrendingUp, Filter, RefreshCw,
  Building2, Globe, CreditCard, Banknote, Landmark
} from 'lucide-react';

/* ─────────────────────────────────────────────────────────
   REDP — EOI Reservation System
   Full-featured glassmorphism UI with 4 tabs:
   1. Dashboard Overview
   2. Submit New EOI
   3. Pending Review (Accountant)
   4. All Reservations
   ───────────────────────────────────────────────────────── */

interface EoiReservation {
  id: string;
  lead_id: string;
  project_id: string;
  unit_id: string | null;
  client_name: string;
  client_email: string;
  client_phone: string;
  client_location: 'inside_egypt' | 'outside_egypt';
  payment_method: string;
  payment_amount: string;
  receipt_path: string;
  status: 'pending_review' | 'approved' | 'rejected';
  order_number: string | null;
  queue_number: number | null;
  reviewer_id: string | null;
  review_notes: string | null;
  reviewed_at: string | null;
  email_sent_at: string | null;
  created_at: string;
  updated_at: string;
  lead?: { id: string; first_name: string; last_name: string; email: string; phone: string };
  reviewer?: { id: string; name: string; email: string };
}

interface Stats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  total_amount: number;
  pending_amount: number;
  recent_activity: EoiReservation[];
}

type TabId = 'dashboard' | 'submit' | 'pending' | 'all' | 'queue' | 'rules';

const TABS: { id: TabId; label: string; icon: React.FC<any> }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: TrendingUp },
  { id: 'submit', label: 'Submit EOI', icon: Upload },
  { id: 'pending', label: 'Pending Review', icon: Clock },
  { id: 'all', label: 'All Reservations', icon: FileText },
];

const PAYMENT_METHODS: Record<string, { label: string; icon: React.FC<any> }> = {
  cash: { label: 'Cash', icon: Banknote },
  bank_transfer: { label: 'Bank Transfer', icon: Landmark },
  cheque: { label: 'Cheque', icon: CreditCard },
  international_bank_transfer: { label: 'International Bank Transfer', icon: Globe },
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  pending_review: { label: 'Pending Review', color: '#d0941e', bg: 'rgba(208, 148, 30, 0.1)' },
  approved: { label: 'Approved', color: '#2e7d32', bg: 'rgba(46, 125, 50, 0.1)' },
  rejected: { label: 'Rejected', color: '#d32f2f', bg: 'rgba(211, 47, 47, 0.1)' },
};

const formatCurrency = (amount: number | string) => {
  const n = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('en-EG', { style: 'currency', currency: 'EGP', minimumFractionDigits: 0 }).format(n);
};

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

// ── Animated Counter ──
const AnimatedCounter: React.FC<{ value: number; duration?: number }> = ({ value, duration = 800 }) => {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    const start = 0;
    const end = value;
    const startTime = Date.now();
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(start + (end - start) * eased));
      if (progress < 1) requestAnimationFrame(animate);
    };
    animate();
  }, [value, duration]);
  return <>{display}</>;
};

// ── Toast Component ──
const Toast: React.FC<{ message: string; type: 'success' | 'error' | 'info'; onClose: () => void }> = ({ message, type, onClose }) => {
  useEffect(() => { const t = setTimeout(onClose, 4000); return () => clearTimeout(t); }, [onClose]);
  const icon = type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ';
  return (
    <div className={`toast-item toast-${type}`}>
      <div className="toast-icon">{icon}</div>
      <span className="toast-message">{message}</span>
    </div>
  );
};

const EoiReservations: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>('dashboard');
  const [stats, setStats] = useState<Stats | null>(null);
  const [reservations, setReservations] = useState<EoiReservation[]>([]);
  const [pendingList, setPendingList] = useState<EoiReservation[]>([]);
  const [loading, setLoading] = useState(false);
  const [toasts, setToasts] = useState<{ id: number; message: string; type: 'success' | 'error' | 'info' }[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // User details
  const [userRole, setUserRole] = useState<string>('agent');

  // Queue Board states
  const [selectedQueueProject, setSelectedQueueProject] = useState<string>('');
  const [queueList, setQueueList] = useState<EoiReservation[]>([]);
  const [loadingQueue, setLoadingQueue] = useState<boolean>(false);

  // Queue Rules states
  const [queueConfigs, setQueueConfigs] = useState({
    eoi_queue_mode: 'normal',
    eoi_queue_weight_past_client: '100',
    eoi_queue_weight_cash: '50',
    eoi_queue_weight_vip: '150',
    eoi_queue_nationality_priority: 'none',
    eoi_queue_weight_nationality: '40',
  });
  const [customRules, setCustomRules] = useState<any[]>([]);
  const [loadingConfigs, setLoadingConfigs] = useState<boolean>(false);

  // Modal states
  const [receiptModal, setReceiptModal] = useState<string | null>(null);
  const [approveModal, setApproveModal] = useState<EoiReservation | null>(null);
  const [rejectModal, setRejectModal] = useState<EoiReservation | null>(null);
  const [detailModal, setDetailModal] = useState<EoiReservation | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');

  // Submit form state
  const [formStep, setFormStep] = useState(1);
  const [formData, setFormData] = useState({
    lead_id: '',
    project_id: '',
    unit_id: '',
    client_name: '',
    client_email: '',
    client_phone: '',
    client_location: '' as '' | 'inside_egypt' | 'outside_egypt',
    payment_method: '',
    payment_amount: '',
  });
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [leads, setLeads] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);

  const addToast = useCallback((message: string, type: 'success' | 'error' | 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // ── Data Fetching ──
  const fetchStats = useCallback(async () => {
    try {
      const res = await api.get('/acquisition/eoi-reservations/stats');
      if (res.data.success) setStats(res.data.data);
    } catch (err) { console.error('Failed to fetch stats:', err); }
  }, []);

  const fetchReservations = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params: any = { page, per_page: 15 };
      if (searchQuery) params.search = searchQuery;
      if (statusFilter) params.status = statusFilter;
      const res = await api.get('/acquisition/eoi-reservations', { params });
      if (res.data.success) {
        setReservations(res.data.data.data || []);
        setCurrentPage(res.data.data.current_page || 1);
        setTotalPages(res.data.data.last_page || 1);
      }
    } catch (err) { console.error('Failed to fetch reservations:', err); }
    setLoading(false);
  }, [searchQuery, statusFilter]);

  const fetchPending = useCallback(async () => {
    try {
      const res = await api.get('/acquisition/eoi-reservations', { params: { status: 'pending_review', per_page: 50 } });
      if (res.data.success) setPendingList(res.data.data.data || []);
    } catch (err) { console.error('Failed to fetch pending:', err); }
  }, []);

  const fetchLeadsAndProjects = useCallback(async () => {
    try {
      const [leadsRes, projectsRes] = await Promise.all([
        api.get('/acquisition/leads', { params: { per_page: 100 } }),
        api.get('/admin/projects', { params: { per_page: 100 } }).catch(() => ({ data: { data: [] } })),
      ]);
      setLeads(leadsRes.data.data?.data || leadsRes.data.data || []);
      setProjects(projectsRes.data.data?.data || projectsRes.data.data || []);
    } catch (err) { console.error('Failed to fetch leads/projects:', err); }
  }, []);

  const fetchConfigs = async () => {
    setLoadingConfigs(true);
    try {
      const res = await api.get('/admin/configs');
      if (res.data && res.data.success) {
        const data = res.data.data;
        setQueueConfigs({
          eoi_queue_mode: data.eoi_queue_mode || 'normal',
          eoi_queue_weight_past_client: data.eoi_queue_weight_past_client || '100',
          eoi_queue_weight_cash: data.eoi_queue_weight_cash || '50',
          eoi_queue_weight_vip: data.eoi_queue_weight_vip || '150',
          eoi_queue_nationality_priority: data.eoi_queue_nationality_priority || 'none',
          eoi_queue_weight_nationality: data.eoi_queue_weight_nationality || '40',
        });
        try {
          setCustomRules(JSON.parse(data.eoi_queue_custom_rules || '[]'));
        } catch (e) {
          setCustomRules([]);
        }
      }
    } catch (err) {
      console.error('Failed to fetch configs:', err);
    }
    setLoadingConfigs(false);
  };

  const saveConfigs = async () => {
    try {
      const payload = {
        configs: {
          ...queueConfigs,
          eoi_queue_custom_rules: JSON.stringify(customRules)
        }
      };
      const res = await api.post('/admin/configs', payload);
      if (res.data && res.data.success) {
        addToast('Queue configurations updated & queue recalculated!', 'success');
        fetchConfigs();
      }
    } catch (err: any) {
      addToast(err.response?.data?.message || 'Failed to update configurations.', 'error');
    }
  };

  const fetchQueue = async (projectId: string) => {
    if (!projectId) {
      setQueueList([]);
      return;
    }
    setLoadingQueue(true);
    try {
      const res = await api.get('/acquisition/eoi-reservations', {
        params: {
          project_id: projectId,
          status: 'approved',
          sort_by: 'queue_number',
          sort_dir: 'asc',
          per_page: 100
        }
      });
      if (res.data.success) {
        setQueueList(res.data.data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch queue:', err);
    }
    setLoadingQueue(false);
  };

  useEffect(() => {
    const userStr = localStorage.getItem('redp_user');
    if (userStr) {
      try {
        const u = JSON.parse(userStr);
        setUserRole(u.role || 'agent');
      } catch (e) { console.error(e); }
    }
  }, []);

  const isAdminOrFinance = userRole === 'admin' || userRole === 'finance_officer';

  const visibleTabs = [
    { id: 'dashboard' as const, label: 'Dashboard', icon: TrendingUp },
    { id: 'submit' as const, label: 'Submit EOI', icon: Upload },
    { id: 'pending' as const, label: 'Pending Review', icon: Clock },
    { id: 'all' as const, label: 'All Reservations', icon: FileText },
    ...(isAdminOrFinance ? [
      { id: 'queue' as const, label: 'Queue Board', icon: Users },
      { id: 'rules' as const, label: 'Queue Rules', icon: Filter }
    ] : [])
  ];

  useEffect(() => {
    fetchStats();
    if (activeTab === 'submit') fetchLeadsAndProjects();
    if (activeTab === 'pending') fetchPending();
    if (activeTab === 'all') fetchReservations();
    if (activeTab === 'queue') {
      fetchLeadsAndProjects();
      if (selectedQueueProject) {
        fetchQueue(selectedQueueProject);
      }
    }
    if (activeTab === 'rules') fetchConfigs();
  }, [activeTab, fetchStats, fetchLeadsAndProjects, fetchPending, fetchReservations, selectedQueueProject]);

  // ── Submit EOI ──
  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('lead_id', formData.lead_id);
      fd.append('project_id', formData.project_id);
      if (formData.unit_id) fd.append('unit_id', formData.unit_id);
      fd.append('client_name', formData.client_name);
      fd.append('client_email', formData.client_email);
      fd.append('client_phone', formData.client_phone);
      fd.append('client_location', formData.client_location);
      fd.append('payment_method', formData.payment_method);
      fd.append('payment_amount', formData.payment_amount);
      if (receiptFile) fd.append('receipt', receiptFile);

      const res = await api.post('/acquisition/eoi-reservations', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (res.data.success) {
        addToast('EOI reservation submitted successfully!', 'success');
        setFormStep(1);
        setFormData({ lead_id: '', project_id: '', unit_id: '', client_name: '', client_email: '', client_phone: '', client_location: '', payment_method: '', payment_amount: '' });
        setReceiptFile(null);
        setReceiptPreview(null);
        fetchStats();
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to submit EOI reservation.';
      addToast(msg, 'error');
    }
    setSubmitting(false);
  };

  // ── Approve / Reject ──
  const handleApprove = async () => {
    if (!approveModal) return;
    try {
      const res = await api.post(`/acquisition/eoi-reservations/${approveModal.id}/approve`, { notes: reviewNotes || null });
      if (res.data.success) {
        addToast(`Approved! Order #${res.data.order_number}, Queue #${res.data.queue_number}`, 'success');
        setApproveModal(null);
        setReviewNotes('');
        fetchPending();
        fetchStats();
      }
    } catch (err: any) {
      addToast(err.response?.data?.message || 'Failed to approve.', 'error');
    }
  };

  const handleReject = async () => {
    if (!rejectModal || !reviewNotes.trim()) {
      addToast('Rejection reason is required.', 'error');
      return;
    }
    try {
      const res = await api.post(`/acquisition/eoi-reservations/${rejectModal.id}/reject`, { notes: reviewNotes });
      if (res.data.success) {
        addToast('EOI reservation rejected.', 'info');
        setRejectModal(null);
        setReviewNotes('');
        fetchPending();
        fetchStats();
      }
    } catch (err: any) {
      addToast(err.response?.data?.message || 'Failed to reject.', 'error');
    }
  };

  // ── File upload handler ──
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      addToast('File size must be less than 10MB.', 'error');
      return;
    }
    setReceiptFile(file);
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (ev) => setReceiptPreview(ev.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      setReceiptPreview(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) { addToast('File size must be less than 10MB.', 'error'); return; }
      setReceiptFile(file);
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (ev) => setReceiptPreview(ev.target?.result as string);
        reader.readAsDataURL(file);
      } else { setReceiptPreview(null); }
    }
  };

  const getReceiptUrl = (path: string) => {
    const base = (import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000').replace('/api/v1', '');
    return `${base}/storage/${path}`;
  };

  // ── Available payment methods based on location ──
  const availablePaymentMethods = formData.client_location === 'inside_egypt'
    ? ['cash', 'bank_transfer', 'cheque']
    : formData.client_location === 'outside_egypt'
    ? ['international_bank_transfer']
    : [];

  // ── Can proceed to next step ──
  const canProceedStep = (step: number) => {
    switch (step) {
      case 1: return formData.client_name && formData.client_email && formData.client_phone;
      case 2: return formData.client_location && formData.payment_method;
      case 3: return formData.payment_amount && receiptFile && formData.lead_id && formData.project_id;
      default: return true;
    }
  };

  // ─────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────
  return (
    <div style={{ padding: '0' }}>
      {/* Toast Container */}
      <div className="toast-container">
        {toasts.map(t => <Toast key={t.id} message={t.message} type={t.type} onClose={() => removeToast(t.id)} />)}
      </div>

      {/* Page Header */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontFamily: 'var(--font-title)', fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '6px', letterSpacing: '-0.03em' }}>
          EOI Reservation System
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Manage Expression of Interest payments, receipts, and approvals</p>
      </div>

      {/* Tab Navigation */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
        {visibleTabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          const pendingCount = tab.id === 'pending' && stats?.pending ? stats.pending : 0;
          return (
            <button
              key={tab.id}
              id={`eoi-tab-${tab.id}`}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '10px 22px',
                borderRadius: '9999px',
                border: isActive ? '1.5px solid var(--color-primary)' : '1.5px solid var(--border-glass)',
                background: isActive ? 'var(--color-primary)' : 'rgba(255, 255, 255, 0.6)',
                color: isActive ? '#ffffff' : 'var(--text-muted)',
                fontFamily: 'var(--font-title)',
                fontWeight: 600,
                fontSize: '0.82rem',
                cursor: 'pointer',
                transition: 'var(--transition-smooth)',
                boxShadow: isActive ? '0 4px 15px rgba(50, 71, 58, 0.2)' : '0 2px 6px rgba(44, 62, 50, 0.02)',
                position: 'relative',
              }}
            >
              <Icon style={{ width: '15px', height: '15px' }} />
              {tab.label}
              {pendingCount > 0 && (
                <span style={{
                  position: 'absolute', top: '-4px', right: '-4px',
                  width: '20px', height: '20px', borderRadius: '50%',
                  background: '#d32f2f', color: '#fff', fontSize: '0.65rem',
                  fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 2px 6px rgba(211, 47, 47, 0.4)',
                }}>
                  {pendingCount}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ═══════════════════════════════════════════════ */}
      {/* TAB 1: Dashboard */}
      {/* ═══════════════════════════════════════════════ */}
      {activeTab === 'dashboard' && (
        <div style={{ animation: 'modal-fade-in 0.3s ease-out' }}>
          {/* KPI Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px', marginBottom: '28px' }}>
            {[
              { label: 'Total EOIs', value: stats?.total || 0, icon: FileText, color: '#32473a', gradient: 'linear-gradient(135deg, #32473a, #4a6b55)' },
              { label: 'Pending Review', value: stats?.pending || 0, icon: Clock, color: '#d0941e', gradient: 'linear-gradient(135deg, #d0941e, #e6b855)' },
              { label: 'Approved', value: stats?.approved || 0, icon: CheckCircle, color: '#2e7d32', gradient: 'linear-gradient(135deg, #2e7d32, #4caf50)' },
              { label: 'Rejected', value: stats?.rejected || 0, icon: XCircle, color: '#d32f2f', gradient: 'linear-gradient(135deg, #d32f2f, #ef5350)' },
            ].map((card, i) => {
              const Icon = card.icon;
              return (
                <div key={i} className="glass-panel" style={{ padding: '22px', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', top: '-10px', right: '-10px', width: '80px', height: '80px', borderRadius: '50%', background: card.gradient, opacity: 0.08 }} />
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{ width: '44px', height: '44px', borderRadius: '14px', background: card.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 4px 12px ${card.color}30` }}>
                      <Icon style={{ width: '20px', height: '20px', color: '#fff' }} />
                    </div>
                    <div>
                      <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '2px' }}>{card.label}</p>
                      <h3 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-main)', lineHeight: 1 }}><AnimatedCounter value={card.value} /></h3>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Amount Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px', marginBottom: '28px' }}>
            <div className="glass-panel" style={{ padding: '22px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                <DollarSign style={{ width: '18px', height: '18px', color: 'var(--color-success)' }} />
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>Total Approved Amount</span>
              </div>
              <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-success)' }}>{formatCurrency(stats?.total_amount || 0)}</h3>
            </div>
            <div className="glass-panel" style={{ padding: '22px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                <Clock style={{ width: '18px', height: '18px', color: 'var(--color-warning)' }} />
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>Pending Review Amount</span>
              </div>
              <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-warning)' }}>{formatCurrency(stats?.pending_amount || 0)}</h3>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <h3 style={{ fontFamily: 'var(--font-title)', fontSize: '1rem', fontWeight: 700, marginBottom: '16px', color: 'var(--text-main)' }}>Recent Activity</h3>
            {stats?.recent_activity && stats.recent_activity.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {stats.recent_activity.map((item, i) => {
                  const cfg = STATUS_CONFIG[item.status] || STATUS_CONFIG.pending_review;
                  return (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderRadius: 'var(--radius-sm)', background: 'rgba(255,255,255,0.3)', border: '1px solid var(--border-glass)', transition: 'var(--transition-smooth)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: cfg.color }} />
                        <div>
                          <span style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-main)' }}>{item.client_name}</span>
                          <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                            {PAYMENT_METHODS[item.payment_method]?.label || item.payment_method} • {formatCurrency(item.payment_amount)}
                          </p>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span className="badge" style={{ background: cfg.bg, color: cfg.color }}>{cfg.label}</span>
                        {item.order_number && <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '4px' }}>#{item.order_number}</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: '24px 0' }}>No recent activity yet</p>
            )}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════ */}
      {/* TAB 2: Submit New EOI */}
      {/* ═══════════════════════════════════════════════ */}
      {activeTab === 'submit' && (
        <div style={{ animation: 'modal-fade-in 0.3s ease-out', maxWidth: '780px' }}>
          {/* Progress Indicator */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '32px' }}>
            {[1, 2, 3, 4].map(step => (
              <React.Fragment key={step}>
                <div style={{
                  width: '36px', height: '36px', borderRadius: '50%',
                  background: formStep >= step ? 'var(--color-primary)' : 'rgba(255,255,255,0.5)',
                  color: formStep >= step ? '#fff' : 'var(--text-muted)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'var(--font-title)', fontWeight: 700, fontSize: '0.85rem',
                  border: formStep >= step ? 'none' : '1.5px solid var(--border-glass)',
                  transition: 'var(--transition-smooth)',
                  boxShadow: formStep >= step ? '0 4px 12px rgba(50, 71, 58, 0.2)' : 'none',
                }}>
                  {formStep > step ? '✓' : step}
                </div>
                {step < 4 && <div style={{ width: '40px', height: '2px', background: formStep > step ? 'var(--color-primary)' : 'var(--border-glass)', borderRadius: '2px', transition: 'var(--transition-smooth)' }} />}
              </React.Fragment>
            ))}
          </div>

          <div className="glass-panel" style={{ padding: '32px' }}>
            {/* Step 1: Client Information */}
            {formStep === 1 && (
              <div style={{ animation: 'modal-fade-in 0.25s ease-out' }}>
                <h3 style={{ fontFamily: 'var(--font-title)', fontSize: '1.1rem', fontWeight: 700, marginBottom: '6px' }}>Client Information</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: '24px' }}>Enter the client's personal details</p>

                <div className="form-group">
                  <label className="form-label">Full Name *</label>
                  <input className="form-control" placeholder="e.g. Ahmed Mohamed" value={formData.client_name} onChange={e => setFormData(prev => ({ ...prev, client_name: e.target.value }))} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="form-group">
                    <label className="form-label">Email Address *</label>
                    <input className="form-control" type="email" placeholder="client@example.com" value={formData.client_email} onChange={e => setFormData(prev => ({ ...prev, client_email: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Phone Number *</label>
                    <input className="form-control" type="tel" placeholder="+20 1XX XXXX XXX" value={formData.client_phone} onChange={e => setFormData(prev => ({ ...prev, client_phone: e.target.value }))} />
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Location & Payment Method */}
            {formStep === 2 && (
              <div style={{ animation: 'modal-fade-in 0.25s ease-out' }}>
                <h3 style={{ fontFamily: 'var(--font-title)', fontSize: '1.1rem', fontWeight: 700, marginBottom: '6px' }}>Payment Method</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: '24px' }}>Select your location and preferred payment method</p>

                {/* Location Toggle */}
                <div className="form-group">
                  <label className="form-label">Client Location *</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    {[
                      { value: 'inside_egypt', label: 'Inside Egypt', icon: Building2, desc: 'Cash, Bank Transfer, Cheque' },
                      { value: 'outside_egypt', label: 'Outside Egypt', icon: Globe, desc: 'International Bank Transfer' },
                    ].map(loc => {
                      const Icon = loc.icon;
                      const isSelected = formData.client_location === loc.value;
                      return (
                        <button
                          key={loc.value}
                          id={`eoi-location-${loc.value}`}
                          onClick={() => setFormData(prev => ({ ...prev, client_location: loc.value as any, payment_method: '' }))}
                          style={{
                            padding: '20px', borderRadius: 'var(--radius-sm)',
                            border: isSelected ? '2px solid var(--color-primary)' : '1.5px solid var(--border-glass)',
                            background: isSelected ? 'rgba(50, 71, 58, 0.05)' : 'rgba(255,255,255,0.4)',
                            cursor: 'pointer', textAlign: 'left',
                            transition: 'var(--transition-smooth)',
                          }}
                        >
                          <Icon style={{ width: '24px', height: '24px', color: isSelected ? 'var(--color-primary)' : 'var(--text-muted)', marginBottom: '10px' }} />
                          <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-main)', marginBottom: '4px' }}>{loc.label}</div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{loc.desc}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Payment Methods */}
                {formData.client_location && (
                  <div className="form-group" style={{ marginTop: '8px' }}>
                    <label className="form-label">Payment Method *</label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '10px' }}>
                      {availablePaymentMethods.map(method => {
                        const cfg = PAYMENT_METHODS[method];
                        const Icon = cfg.icon;
                        const isSelected = formData.payment_method === method;
                        return (
                          <button
                            key={method}
                            id={`eoi-payment-${method}`}
                            onClick={() => setFormData(prev => ({ ...prev, payment_method: method }))}
                            style={{
                              display: 'flex', alignItems: 'center', gap: '10px',
                              padding: '14px 16px', borderRadius: 'var(--radius-sm)',
                              border: isSelected ? '2px solid var(--color-primary)' : '1.5px solid var(--border-glass)',
                              background: isSelected ? 'rgba(50, 71, 58, 0.05)' : 'rgba(255,255,255,0.4)',
                              cursor: 'pointer', textAlign: 'left',
                              transition: 'var(--transition-smooth)',
                            }}
                          >
                            <Icon style={{ width: '18px', height: '18px', color: isSelected ? 'var(--color-primary)' : 'var(--text-muted)' }} />
                            <span style={{ fontWeight: 600, fontSize: '0.82rem', color: isSelected ? 'var(--color-primary)' : 'var(--text-main)' }}>{cfg.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Payment & Receipt Upload */}
            {formStep === 3 && (
              <div style={{ animation: 'modal-fade-in 0.25s ease-out' }}>
                <h3 style={{ fontFamily: 'var(--font-title)', fontSize: '1.1rem', fontWeight: 700, marginBottom: '6px' }}>Payment Details & Receipt</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: '24px' }}>Enter the payment amount and upload the receipt</p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="form-group">
                    <label className="form-label">Lead *</label>
                    <select className="form-control" value={formData.lead_id} onChange={e => setFormData(prev => ({ ...prev, lead_id: e.target.value }))}>
                      <option value="">Select a lead...</option>
                      {leads.map((lead: any) => (
                        <option key={lead.id} value={lead.id}>{lead.first_name} {lead.last_name} — {lead.email}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Project *</label>
                    <select className="form-control" value={formData.project_id} onChange={e => setFormData(prev => ({ ...prev, project_id: e.target.value }))}>
                      <option value="">Select a project...</option>
                      {projects.map((proj: any) => (
                        <option key={proj.id} value={proj.id}>{proj.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Payment Amount (EGP) *</label>
                  <input className="form-control" type="number" placeholder="0.00" min="0.01" step="0.01" value={formData.payment_amount} onChange={e => setFormData(prev => ({ ...prev, payment_amount: e.target.value }))} />
                </div>

                {/* Drag & Drop Upload Zone */}
                <div className="form-group">
                  <label className="form-label">Payment Receipt *</label>
                  <div
                    id="eoi-receipt-dropzone"
                    onDragOver={e => e.preventDefault()}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      border: `2px dashed ${receiptFile ? 'var(--color-success)' : 'var(--color-secondary)'}`,
                      borderRadius: 'var(--radius-sm)',
                      padding: '32px',
                      textAlign: 'center',
                      cursor: 'pointer',
                      background: receiptFile ? 'rgba(46, 125, 50, 0.03)' : 'rgba(255,255,255,0.3)',
                      transition: 'var(--transition-smooth)',
                    }}
                  >
                    <input ref={fileInputRef} type="file" accept="image/*,.pdf" onChange={handleFileChange} style={{ display: 'none' }} />
                    {receiptFile ? (
                      <div>
                        {receiptPreview ? (
                          <img src={receiptPreview} alt="Receipt preview" style={{ maxWidth: '200px', maxHeight: '160px', borderRadius: '12px', marginBottom: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                        ) : (
                          <FileText style={{ width: '48px', height: '48px', color: 'var(--color-success)', marginBottom: '12px' }} />
                        )}
                        <p style={{ fontWeight: 600, color: 'var(--color-success)', fontSize: '0.85rem' }}>{receiptFile.name}</p>
                        <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>{(receiptFile.size / 1024 / 1024).toFixed(2)} MB • Click or drag to replace</p>
                      </div>
                    ) : (
                      <div>
                        <Upload style={{ width: '48px', height: '48px', color: 'var(--color-secondary)', marginBottom: '12px' }} />
                        <p style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.9rem' }}>Drop your receipt here</p>
                        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '6px' }}>or click to browse • JPG, PNG, PDF up to 10MB</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Review & Confirm */}
            {formStep === 4 && (
              <div style={{ animation: 'modal-fade-in 0.25s ease-out' }}>
                <h3 style={{ fontFamily: 'var(--font-title)', fontSize: '1.1rem', fontWeight: 700, marginBottom: '6px' }}>Review & Confirm</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: '24px' }}>Verify all details before submitting</p>

                <div style={{ background: 'rgba(255,255,255,0.4)', borderRadius: 'var(--radius-sm)', padding: '20px', border: '1px solid var(--border-glass)' }}>
                  {[
                    { label: 'Client Name', value: formData.client_name },
                    { label: 'Email', value: formData.client_email },
                    { label: 'Phone', value: formData.client_phone },
                    { label: 'Location', value: formData.client_location === 'inside_egypt' ? '🇪🇬 Inside Egypt' : '🌍 Outside Egypt' },
                    { label: 'Payment Method', value: PAYMENT_METHODS[formData.payment_method]?.label || formData.payment_method },
                    { label: 'Amount', value: formData.payment_amount ? formatCurrency(parseFloat(formData.payment_amount)) : '—' },
                    { label: 'Receipt', value: receiptFile?.name || '—' },
                  ].map((item, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: i < 6 ? '1px solid var(--border-glass)' : 'none' }}>
                      <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 500 }}>{item.label}</span>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-main)', fontWeight: 600 }}>{item.value}</span>
                    </div>
                  ))}
                </div>

                <div style={{ marginTop: '20px', padding: '14px 18px', borderRadius: 'var(--radius-sm)', background: 'rgba(208, 148, 30, 0.06)', border: '1px solid rgba(208, 148, 30, 0.2)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <AlertTriangle style={{ width: '16px', height: '16px', color: 'var(--color-warning)' }} />
                    <span style={{ fontSize: '0.78rem', color: 'var(--color-warning)', fontWeight: 600 }}>After submission, your payment receipt will be reviewed by our accounting team.</span>
                  </div>
                </div>
              </div>
            )}

            {/* Step Navigation Buttons */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '28px' }}>
              <button
                className="btn-secondary"
                onClick={() => setFormStep(s => Math.max(1, s - 1))}
                style={{ visibility: formStep === 1 ? 'hidden' : 'visible' }}
              >
                <ChevronLeft style={{ width: '14px', height: '14px' }} /> Back
              </button>
              {formStep < 4 ? (
                <button
                  className="btn-primary"
                  onClick={() => setFormStep(s => Math.min(4, s + 1))}
                  disabled={!canProceedStep(formStep)}
                  style={{ opacity: canProceedStep(formStep) ? 1 : 0.5, cursor: canProceedStep(formStep) ? 'pointer' : 'not-allowed' }}
                >
                  Next <ChevronRight style={{ width: '14px', height: '14px' }} />
                </button>
              ) : (
                <button className="btn-primary" onClick={handleSubmit} disabled={submitting} style={{ minWidth: '160px' }}>
                  {submitting ? (
                    <><RefreshCw style={{ width: '14px', height: '14px', animation: 'spin 1s linear infinite' }} /> Submitting...</>
                  ) : (
                    <><Upload style={{ width: '14px', height: '14px' }} /> Submit EOI</>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════ */}
      {/* TAB 3: Pending Review */}
      {/* ═══════════════════════════════════════════════ */}
      {activeTab === 'pending' && (
        <div style={{ animation: 'modal-fade-in 0.3s ease-out' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <h3 style={{ fontFamily: 'var(--font-title)', fontSize: '1.05rem', fontWeight: 700 }}>Pending Payment Reviews</h3>
            <button className="btn-secondary" onClick={fetchPending} style={{ padding: '8px 16px', fontSize: '0.78rem' }}>
              <RefreshCw style={{ width: '13px', height: '13px' }} /> Refresh
            </button>
          </div>

          {pendingList.length === 0 ? (
            <div className="glass-panel" style={{ padding: '48px', textAlign: 'center' }}>
              <CheckCircle style={{ width: '48px', height: '48px', color: 'var(--color-success)', marginBottom: '16px' }} />
              <h3 style={{ fontFamily: 'var(--font-title)', fontSize: '1.1rem', fontWeight: 700, marginBottom: '8px' }}>All Clear!</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No pending EOI reservations to review</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {pendingList.map(item => (
                <div key={item.id} className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
                  {/* Left: Client Info */}
                  <div style={{ flex: '1 1 200px', minWidth: '200px' }}>
                    <h4 style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-main)', marginBottom: '4px' }}>{item.client_name}</h4>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.client_email} • {item.client_phone}</p>
                    <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                      Submitted {formatDate(item.created_at)}
                    </p>
                  </div>

                  {/* Center: Payment Info */}
                  <div style={{ flex: '0 0 auto', textAlign: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                      {React.createElement(PAYMENT_METHODS[item.payment_method]?.icon || CreditCard, { style: { width: '14px', height: '14px', color: 'var(--text-muted)' } })}
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 500 }}>{PAYMENT_METHODS[item.payment_method]?.label || item.payment_method}</span>
                    </div>
                    <h4 style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--color-primary)' }}>{formatCurrency(item.payment_amount)}</h4>
                    <span className="badge" style={{ background: 'rgba(208, 148, 30, 0.1)', color: '#d0941e', marginTop: '4px' }}>
                      {item.client_location === 'inside_egypt' ? '🇪🇬 Egypt' : '🌍 International'}
                    </span>
                  </div>

                  {/* Right: Actions */}
                  <div style={{ flex: '0 0 auto', display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <button
                      className="btn-secondary"
                      onClick={() => setReceiptModal(getReceiptUrl(item.receipt_path))}
                      style={{ padding: '8px 14px', fontSize: '0.75rem' }}
                    >
                      <Eye style={{ width: '13px', height: '13px' }} /> Receipt
                    </button>
                    <button
                      className="btn-primary"
                      onClick={() => { setApproveModal(item); setReviewNotes(''); }}
                      style={{ padding: '8px 18px', fontSize: '0.75rem', background: 'var(--color-success)', boxShadow: '0 4px 12px rgba(46, 125, 50, 0.2)' }}
                    >
                      <CheckCircle style={{ width: '13px', height: '13px' }} /> Approve
                    </button>
                    <button
                      className="btn-primary"
                      onClick={() => { setRejectModal(item); setReviewNotes(''); }}
                      style={{ padding: '8px 18px', fontSize: '0.75rem', background: 'var(--color-danger)', boxShadow: '0 4px 12px rgba(211, 47, 47, 0.2)' }}
                    >
                      <XCircle style={{ width: '13px', height: '13px' }} /> Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════ */}
      {/* TAB 4: All Reservations */}
      {/* ═══════════════════════════════════════════════ */}
      {activeTab === 'all' && (
        <div style={{ animation: 'modal-fade-in 0.3s ease-out' }}>
          {/* Filters */}
          <div className="glass-panel" style={{ padding: '16px 20px', marginBottom: '20px', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: '1 1 250px', background: 'rgba(255,255,255,0.5)', borderRadius: 'var(--radius-sm)', padding: '0 14px', border: '1px solid var(--border-glass)' }}>
              <Search style={{ width: '15px', height: '15px', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Search by name, email, phone, order..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && fetchReservations(1)}
                style={{ border: 'none', background: 'transparent', padding: '10px 0', flex: 1, outline: 'none', fontFamily: 'var(--font-body)', fontSize: '0.82rem', color: 'var(--text-main)' }}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Filter style={{ width: '14px', height: '14px', color: 'var(--text-muted)' }} />
              <select
                className="form-control"
                value={statusFilter}
                onChange={e => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                style={{ width: 'auto', padding: '8px 14px', fontSize: '0.8rem' }}
              >
                <option value="">All Statuses</option>
                <option value="pending_review">Pending Review</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
            <button className="btn-secondary" onClick={() => fetchReservations(1)} style={{ padding: '8px 16px', fontSize: '0.78rem' }}>
              <Search style={{ width: '13px', height: '13px' }} /> Search
            </button>
          </div>

          {/* Table */}
          {loading ? (
            <div className="glass-panel" style={{ padding: '48px', textAlign: 'center' }}>
              <RefreshCw style={{ width: '32px', height: '32px', color: 'var(--color-primary)', animation: 'spin 1s linear infinite' }} />
              <p style={{ color: 'var(--text-muted)', marginTop: '12px', fontSize: '0.85rem' }}>Loading reservations...</p>
            </div>
          ) : reservations.length === 0 ? (
            <div className="glass-panel" style={{ padding: '48px', textAlign: 'center' }}>
              <FileText style={{ width: '48px', height: '48px', color: 'var(--color-secondary)', marginBottom: '16px' }} />
              <h3 style={{ fontFamily: 'var(--font-title)', fontSize: '1.1rem', fontWeight: 700, marginBottom: '8px' }}>No Reservations Found</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Try adjusting your search or filters</p>
            </div>
          ) : (
            <>
              <div style={{ overflowX: 'auto' }}>
                <table className="premium-table">
                  <thead>
                    <tr>
                      <th>Client</th>
                      <th>Payment</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>Order / Queue</th>
                      <th>Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reservations.map(item => {
                      const cfg = STATUS_CONFIG[item.status] || STATUS_CONFIG.pending_review;
                      return (
                        <tr key={item.id}>
                          <td>
                            <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-main)' }}>{item.client_name}</div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>{item.client_email}</div>
                          </td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              {React.createElement(PAYMENT_METHODS[item.payment_method]?.icon || CreditCard, { style: { width: '14px', height: '14px', color: 'var(--text-muted)' } })}
                              <span style={{ fontSize: '0.8rem' }}>{PAYMENT_METHODS[item.payment_method]?.label || item.payment_method}</span>
                            </div>
                          </td>
                          <td style={{ fontWeight: 700, color: 'var(--color-primary)', fontSize: '0.9rem' }}>{formatCurrency(item.payment_amount)}</td>
                          <td><span className="badge" style={{ background: cfg.bg, color: cfg.color }}>{cfg.label}</span></td>
                          <td>
                            {item.order_number ? (
                              <div>
                                <div style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--color-primary)' }}>{item.order_number}</div>
                                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Queue #{item.queue_number}</div>
                              </div>
                            ) : (
                              <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>—</span>
                            )}
                          </td>
                          <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{formatDate(item.created_at)}</td>
                          <td>
                            <div style={{ display: 'flex', gap: '6px' }}>
                              <button
                                onClick={() => setDetailModal(item)}
                                style={{ padding: '6px 10px', borderRadius: '8px', border: '1px solid var(--border-glass)', background: 'rgba(255,255,255,0.5)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-main)', transition: 'var(--transition-smooth)' }}
                              >
                                <Eye style={{ width: '12px', height: '12px' }} /> View
                              </button>
                              <button
                                onClick={() => setReceiptModal(getReceiptUrl(item.receipt_path))}
                                style={{ padding: '6px 10px', borderRadius: '8px', border: '1px solid var(--border-glass)', background: 'rgba(255,255,255,0.5)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', transition: 'var(--transition-smooth)' }}
                              >
                                <FileText style={{ width: '12px', height: '12px' }} /> Receipt
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '20px' }}>
                  <button className="btn-secondary" disabled={currentPage <= 1} onClick={() => fetchReservations(currentPage - 1)} style={{ padding: '8px 14px', fontSize: '0.78rem', opacity: currentPage <= 1 ? 0.4 : 1 }}>
                    <ChevronLeft style={{ width: '14px', height: '14px' }} /> Prev
                  </button>
                  <span style={{ display: 'flex', alignItems: 'center', padding: '0 16px', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main)' }}>
                    Page {currentPage} of {totalPages}
                  </span>
                  <button className="btn-secondary" disabled={currentPage >= totalPages} onClick={() => fetchReservations(currentPage + 1)} style={{ padding: '8px 14px', fontSize: '0.78rem', opacity: currentPage >= totalPages ? 0.4 : 1 }}>
                    Next <ChevronRight style={{ width: '14px', height: '14px' }} />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════ */}
      {/* TAB 5: Queue Board */}
      {/* ═══════════════════════════════════════════════ */}
      {activeTab === 'queue' && (
        <div style={{ animation: 'modal-fade-in 0.3s ease-out' }}>
          <div className="glass-panel" style={{ padding: '24px', marginBottom: '24px' }}>
            <h3 style={{ fontFamily: 'var(--font-title)', fontSize: '1.05rem', fontWeight: 700, marginBottom: '16px' }}>Project Queue Position Board</h3>
            <div className="form-group" style={{ marginBottom: 0, maxWidth: '400px' }}>
              <label className="form-label">Select Project *</label>
              <select
                className="form-control"
                value={selectedQueueProject}
                onChange={e => {
                  setSelectedQueueProject(e.target.value);
                  fetchQueue(e.target.value);
                }}
              >
                <option value="">Select a project...</option>
                {projects.map((p: any) => (
                  <option key={p.id} value={p.id}>{p.name} ({p.location})</option>
                ))}
              </select>
            </div>
          </div>

          {!selectedQueueProject ? (
            <div className="glass-panel" style={{ padding: '48px', textAlign: 'center' }}>
              <Users style={{ width: '48px', height: '48px', color: 'var(--color-secondary)', marginBottom: '16px' }} />
              <h3 style={{ fontFamily: 'var(--font-title)', fontSize: '1.1rem', fontWeight: 700, marginBottom: '8px' }}>Select a Project</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Select a project from the dropdown above to view its live queue.</p>
            </div>
          ) : loadingQueue ? (
            <div className="glass-panel" style={{ padding: '48px', textAlign: 'center' }}>
              <RefreshCw style={{ width: '32px', height: '32px', color: 'var(--color-primary)', animation: 'spin 1s linear infinite' }} />
              <p style={{ color: 'var(--text-muted)', marginTop: '12px', fontSize: '0.85rem' }}>Loading project queue...</p>
            </div>
          ) : queueList.length === 0 ? (
            <div className="glass-panel" style={{ padding: '48px', textAlign: 'center' }}>
              <FileText style={{ width: '48px', height: '48px', color: 'var(--color-secondary)', marginBottom: '16px' }} />
              <h3 style={{ fontFamily: 'var(--font-title)', fontSize: '1.1rem', fontWeight: 700, marginBottom: '8px' }}>No Approved EOI Reservations</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>There are currently no approved EOI reservations in the queue for this project.</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="premium-table">
                <thead>
                  <tr>
                    <th style={{ width: '80px' }}>Position</th>
                    <th>Client</th>
                    <th>Payment</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Location</th>
                    <th>Approved Date</th>
                  </tr>
                </thead>
                <tbody>
                  {queueList.map((item, index) => {
                    const cfg = STATUS_CONFIG[item.status] || STATUS_CONFIG.pending_review;
                    const isVip = item.lead && (item.lead as any).is_vip;
                    return (
                      <tr key={item.id} style={{ background: isVip ? 'rgba(245, 158, 11, 0.03)' : undefined }}>
                        <td>
                          <span style={{
                            display: 'inline-flex',
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            background: index === 0 ? 'linear-gradient(135deg, #f59e0b, #d97706)' : index === 1 ? 'linear-gradient(135deg, #9ca3af, #4b5563)' : index === 2 ? 'linear-gradient(135deg, #b45309, #78350f)' : 'rgba(255,255,255,0.6)',
                            color: index < 3 ? '#fff' : 'var(--text-main)',
                            fontWeight: 700,
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.85rem',
                            border: '1.5px solid var(--border-glass)',
                            boxShadow: index < 3 ? '0 4px 10px rgba(0,0,0,0.1)' : 'none'
                          }}>
                            {index + 1}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-main)' }}>{item.client_name}</span>
                            {isVip && <span title="VIP" style={{ color: '#f59e0b', fontSize: '0.9rem' }}>★</span>}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>{item.client_email}</div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {React.createElement(PAYMENT_METHODS[item.payment_method]?.icon || CreditCard, { style: { width: '14px', height: '14px', color: 'var(--text-muted)' } })}
                            <span style={{ fontSize: '0.8rem' }}>{PAYMENT_METHODS[item.payment_method]?.label || item.payment_method}</span>
                          </div>
                        </td>
                        <td style={{ fontWeight: 700, color: 'var(--color-primary)', fontSize: '0.9rem' }}>{formatCurrency(item.payment_amount)}</td>
                        <td><span className="badge" style={{ background: cfg.bg, color: cfg.color }}>{cfg.label}</span></td>
                        <td>
                          <span className="badge" style={{ background: 'rgba(255, 255, 255, 0.4)', color: 'var(--text-muted)' }}>
                            {item.client_location === 'inside_egypt' ? '🇪🇬 Egypt' : '🌍 International'}
                          </span>
                        </td>
                        <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                          {item.reviewed_at ? formatDate(item.reviewed_at) : formatDate(item.created_at)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════ */}
      {/* TAB 6: Queue Rules */}
      {/* ═══════════════════════════════════════════════ */}
      {activeTab === 'rules' && (
        <div style={{ animation: 'modal-fade-in 0.3s ease-out', maxWidth: '850px' }}>
          {userRole !== 'admin' && (
            <div style={{ padding: '12px 18px', borderRadius: 'var(--radius-sm)', background: 'rgba(208, 148, 30, 0.08)', border: '1px solid rgba(208, 148, 30, 0.2)', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertTriangle style={{ width: '16px', height: '16px', color: 'var(--color-warning)' }} />
                <span style={{ fontSize: '0.78rem', color: 'var(--color-warning)', fontWeight: 600 }}>Read-only: Only administrators are authorized to modify smart queue configurations.</span>
              </div>
            </div>
          )}

          <div className="glass-panel" style={{ padding: '30px', marginBottom: '24px' }}>
            <h3 style={{ fontFamily: 'var(--font-title)', fontSize: '1.1rem', fontWeight: 700, marginBottom: '6px' }}>Queue Prioritization Engine</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: '24px' }}>Configure how EOI priority is computed for new launches.</p>

            {/* Queue Mode selection */}
            <div className="form-group">
              <label className="form-label">Active Queue Mode</label>
              <div style={{ display: 'flex', gap: '12px' }}>
                {[
                  { value: 'normal', label: 'Normal Queue', desc: 'Strict FIFO by payment clearance timestamp.' },
                  { value: 'smart', label: 'Smart Queue', desc: 'Prioritized queue sorted by customizable rule scores.' }
                ].map(mode => {
                  const isSelected = queueConfigs.eoi_queue_mode === mode.value;
                  return (
                    <button
                      key={mode.value}
                      disabled={userRole !== 'admin'}
                      onClick={() => setQueueConfigs(prev => ({ ...prev, eoi_queue_mode: mode.value }))}
                      style={{
                        flex: 1, padding: '18px', borderRadius: 'var(--radius-sm)',
                        border: isSelected ? '2px solid var(--color-primary)' : '1.5px solid var(--border-glass)',
                        background: isSelected ? 'rgba(50, 71, 58, 0.05)' : 'rgba(255,255,255,0.4)',
                        cursor: userRole === 'admin' ? 'pointer' : 'not-allowed', textAlign: 'left',
                        transition: 'var(--transition-smooth)',
                        opacity: userRole !== 'admin' && !isSelected ? 0.5 : 1
                      }}
                    >
                      <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-main)', marginBottom: '4px' }}>{mode.label}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{mode.desc}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Smart configs weights */}
            {queueConfigs.eoi_queue_mode === 'smart' && (
              <div style={{ animation: 'modal-fade-in 0.25s ease-out', marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid var(--border-glass)', paddingBottom: '8px' }}>Standard Rule Weights</h4>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Past Client Priority Points</label>
                    <input
                      type="number"
                      className="form-control"
                      disabled={userRole !== 'admin'}
                      value={queueConfigs.eoi_queue_weight_past_client}
                      onChange={e => setQueueConfigs(prev => ({ ...prev, eoi_queue_weight_past_client: e.target.value }))}
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Cash Method Priority Points</label>
                    <input
                      type="number"
                      className="form-control"
                      disabled={userRole !== 'admin'}
                      value={queueConfigs.eoi_queue_weight_cash}
                      onChange={e => setQueueConfigs(prev => ({ ...prev, eoi_queue_weight_cash: e.target.value }))}
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">VIP Client Priority Points</label>
                    <input
                      type="number"
                      className="form-control"
                      disabled={userRole !== 'admin'}
                      value={queueConfigs.eoi_queue_weight_vip}
                      onChange={e => setQueueConfigs(prev => ({ ...prev, eoi_queue_weight_vip: e.target.value }))}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px', alignItems: 'end' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Nationality Priority Target</label>
                    <select
                      className="form-control"
                      disabled={userRole !== 'admin'}
                      value={queueConfigs.eoi_queue_nationality_priority}
                      onChange={e => setQueueConfigs(prev => ({ ...prev, eoi_queue_nationality_priority: e.target.value }))}
                    >
                      <option value="none">No nationality priority (Equal)</option>
                      <option value="egyptian">🇪🇬 Egyptians (Inside Egypt or National ID)</option>
                      <option value="foreigner">🌍 Foreigners (Outside Egypt or Passport Holder)</option>
                    </select>
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Nationality Points</label>
                    <input
                      type="number"
                      className="form-control"
                      disabled={userRole !== 'admin' || queueConfigs.eoi_queue_nationality_priority === 'none'}
                      value={queueConfigs.eoi_queue_weight_nationality}
                      onChange={e => setQueueConfigs(prev => ({ ...prev, eoi_queue_weight_nationality: e.target.value }))}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Custom Rules Editor */}
          {queueConfigs.eoi_queue_mode === 'smart' && (
            <div className="glass-panel" style={{ padding: '30px', marginBottom: '24px', animation: 'modal-fade-in 0.25s ease-out' }}>
              <h3 style={{ fontFamily: 'var(--font-title)', fontSize: '1.1rem', fontWeight: 700, marginBottom: '6px' }}>Custom Administrative Rules</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: '20px' }}>Add administrative filters and conditions to fine-tune booking priority.</p>

              {customRules.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
                  {customRules.map((rule, index) => (
                    <div key={index} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 18px', borderRadius: 'var(--radius-sm)', background: 'rgba(255,255,255,0.4)', border: '1px solid var(--border-glass)' }}>
                      <div>
                        <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-main)' }}>{rule.label}</span>
                        <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                          If <code>{rule.field}</code> {rule.operator} <code>{rule.value}</code> → Add <strong>+{rule.weight} points</strong>
                        </p>
                      </div>
                      {userRole === 'admin' && (
                        <button
                          onClick={() => setCustomRules(prev => prev.filter((_, idx) => idx !== index))}
                          style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--color-danger)', fontSize: '0.75rem', fontWeight: 600 }}
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', textAlign: 'center', padding: '20px 0', border: '1px dashed var(--border-glass)', borderRadius: 'var(--radius-sm)', marginBottom: '24px' }}>No custom rules defined yet.</p>
              )}

              {userRole === 'admin' && (
                <div style={{ background: 'rgba(255,255,255,0.2)', padding: '20px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-glass)' }}>
                  <h4 style={{ fontSize: '0.82rem', fontWeight: 700, marginBottom: '14px' }}>Add Custom Prioritization Rule</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px', alignItems: 'end' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Rule Title / Label</label>
                      <input type="text" id="custom-rule-label" placeholder="e.g. Premium Payment" className="form-control" style={{ fontSize: '0.8rem' }} />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Evaluate Field</label>
                      <select id="custom-rule-field" className="form-control" style={{ fontSize: '0.8rem' }}>
                        <option value="payment_amount">payment_amount</option>
                        <option value="lead_score">lead_score</option>
                        <option value="source">lead_source</option>
                        <option value="payment_method">payment_method</option>
                      </select>
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Operator</label>
                      <select id="custom-rule-operator" className="form-control" style={{ fontSize: '0.8rem' }}>
                        <option value=">">&gt;</option>
                        <option value="<">&lt;</option>
                        <option value="=">=</option>
                        <option value="!=">!=</option>
                        <option value=">=">&gt;=</option>
                        <option value="<=">&lt;=</option>
                      </select>
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Compare Value</label>
                      <input type="text" id="custom-rule-value" placeholder="e.g. 1000000" className="form-control" style={{ fontSize: '0.8rem' }} />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Priority Points</label>
                      <input type="number" id="custom-rule-weight" placeholder="e.g. 50" className="form-control" style={{ fontSize: '0.8rem' }} />
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn-secondary"
                    style={{ marginTop: '16px', width: '100%', justifyContent: 'center' }}
                    onClick={() => {
                      const lbl = (document.getElementById('custom-rule-label') as HTMLInputElement)?.value;
                      const fld = (document.getElementById('custom-rule-field') as HTMLSelectElement)?.value;
                      const opr = (document.getElementById('custom-rule-operator') as HTMLSelectElement)?.value;
                      const val = (document.getElementById('custom-rule-value') as HTMLInputElement)?.value;
                      const wgt = (document.getElementById('custom-rule-weight') as HTMLInputElement)?.value;

                      if (!lbl || !val || !wgt) {
                        addToast('Please fill all fields to add a custom rule.', 'error');
                        return;
                      }

                      const newRule = {
                        label: lbl,
                        field: fld,
                        operator: opr,
                        value: val,
                        weight: parseInt(wgt)
                      };

                      setCustomRules(prev => [...prev, newRule]);

                      // Clear form inputs
                      (document.getElementById('custom-rule-label') as HTMLInputElement).value = '';
                      (document.getElementById('custom-rule-value') as HTMLInputElement).value = '';
                      (document.getElementById('custom-rule-weight') as HTMLInputElement).value = '';
                    }}
                  >
                    Add Prioritization Rule
                  </button>
                </div>
              )}
            </div>
          )}

          {userRole === 'admin' && (
            <button
              className="btn-primary"
              onClick={saveConfigs}
              style={{ width: '100%', justifyContent: 'center', padding: '14px', fontSize: '0.9rem', fontWeight: 700 }}
            >
              Save Configurations & Recalculate Project Queues
            </button>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════ */}
      {/* MODALS */}
      {/* ═══════════════════════════════════════════════ */}

      {/* Receipt Lightbox Modal */}
      {receiptModal && (
        <div className="modal-backdrop" onClick={() => setReceiptModal(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '700px', width: '90%', padding: '24px', position: 'relative' }}>
            <button onClick={() => setReceiptModal(null)} style={{ position: 'absolute', top: '12px', right: '12px', background: 'rgba(255,255,255,0.6)', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <X style={{ width: '16px', height: '16px' }} />
            </button>
            <h3 style={{ fontFamily: 'var(--font-title)', fontWeight: 700, fontSize: '1rem', marginBottom: '16px' }}>Payment Receipt</h3>
            <div style={{ textAlign: 'center', maxHeight: '70vh', overflow: 'auto' }}>
              {receiptModal.endsWith('.pdf') ? (
                <iframe src={receiptModal} style={{ width: '100%', height: '60vh', border: 'none', borderRadius: '12px' }} />
              ) : (
                <img src={receiptModal} alt="Payment receipt" style={{ maxWidth: '100%', borderRadius: '12px', boxShadow: '0 8px 24px rgba(0,0,0,0.1)' }} />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Approve Modal */}
      {approveModal && (
        <div className="modal-backdrop" onClick={() => setApproveModal(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '480px', width: '90%', padding: '32px' }}>
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'linear-gradient(135deg, #2e7d32, #4caf50)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px', boxShadow: '0 8px 20px rgba(46, 125, 50, 0.25)' }}>
                <CheckCircle style={{ width: '28px', height: '28px', color: '#fff' }} />
              </div>
              <h3 style={{ fontFamily: 'var(--font-title)', fontSize: '1.15rem', fontWeight: 700 }}>Approve EOI Reservation</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginTop: '6px' }}>
                <strong>{approveModal.client_name}</strong> — {formatCurrency(approveModal.payment_amount)}
              </p>
            </div>
            <div className="form-group">
              <label className="form-label">Notes (Optional)</label>
              <textarea className="form-control" rows={3} placeholder="Add approval notes..." value={reviewNotes} onChange={e => setReviewNotes(e.target.value)} style={{ resize: 'vertical' }} />
            </div>
            <div style={{ padding: '12px 16px', borderRadius: 'var(--radius-sm)', background: 'rgba(46, 125, 50, 0.05)', border: '1px solid rgba(46, 125, 50, 0.15)', marginBottom: '20px' }}>
              <p style={{ fontSize: '0.78rem', color: 'var(--color-success)', fontWeight: 500 }}>
                ✓ An order number and queue number will be generated automatically<br />
                ✓ A confirmation email will be sent to {approveModal.client_email}
              </p>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button className="btn-secondary" onClick={() => setApproveModal(null)} style={{ flex: 1 }}>Cancel</button>
              <button className="btn-primary" onClick={handleApprove} style={{ flex: 1, background: 'var(--color-success)' }}>
                <CheckCircle style={{ width: '14px', height: '14px' }} /> Confirm Approval
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectModal && (
        <div className="modal-backdrop" onClick={() => setRejectModal(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '480px', width: '90%', padding: '32px' }}>
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'linear-gradient(135deg, #d32f2f, #ef5350)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px', boxShadow: '0 8px 20px rgba(211, 47, 47, 0.25)' }}>
                <XCircle style={{ width: '28px', height: '28px', color: '#fff' }} />
              </div>
              <h3 style={{ fontFamily: 'var(--font-title)', fontSize: '1.15rem', fontWeight: 700 }}>Reject EOI Reservation</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginTop: '6px' }}>
                <strong>{rejectModal.client_name}</strong> — {formatCurrency(rejectModal.payment_amount)}
              </p>
            </div>
            <div className="form-group">
              <label className="form-label">Rejection Reason *</label>
              <textarea className="form-control" rows={3} placeholder="Please provide a reason for rejection..." value={reviewNotes} onChange={e => setReviewNotes(e.target.value)} style={{ resize: 'vertical', borderColor: !reviewNotes.trim() ? 'var(--color-danger)' : undefined }} />
              {!reviewNotes.trim() && <p style={{ color: 'var(--color-danger)', fontSize: '0.72rem', marginTop: '4px', paddingLeft: '6px' }}>Rejection reason is required</p>}
            </div>
            <div style={{ padding: '12px 16px', borderRadius: 'var(--radius-sm)', background: 'rgba(211, 47, 47, 0.05)', border: '1px solid rgba(211, 47, 47, 0.15)', marginBottom: '20px' }}>
              <p style={{ fontSize: '0.78rem', color: 'var(--color-danger)', fontWeight: 500 }}>
                ⚠ A rejection notification email will be sent to {rejectModal.client_email}
              </p>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button className="btn-secondary" onClick={() => setRejectModal(null)} style={{ flex: 1 }}>Cancel</button>
              <button className="btn-primary" onClick={handleReject} disabled={!reviewNotes.trim()} style={{ flex: 1, background: 'var(--color-danger)', opacity: reviewNotes.trim() ? 1 : 0.5 }}>
                <XCircle style={{ width: '14px', height: '14px' }} /> Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {detailModal && (
        <div className="modal-backdrop" onClick={() => setDetailModal(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '560px', width: '90%', padding: '32px', maxHeight: '85vh', overflowY: 'auto' }}>
            <button onClick={() => setDetailModal(null)} style={{ position: 'absolute', top: '12px', right: '12px', background: 'rgba(255,255,255,0.6)', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <X style={{ width: '16px', height: '16px' }} />
            </button>

            <h3 style={{ fontFamily: 'var(--font-title)', fontSize: '1.15rem', fontWeight: 700, marginBottom: '20px' }}>EOI Reservation Details</h3>

            {(() => {
              const cfg = STATUS_CONFIG[detailModal.status] || STATUS_CONFIG.pending_review;
              return (
                <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                  <span className="badge" style={{ background: cfg.bg, color: cfg.color, fontSize: '0.8rem', padding: '6px 18px' }}>{cfg.label}</span>
                  {detailModal.order_number && (
                    <div style={{ marginTop: '12px' }}>
                      <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>Order Number</p>
                      <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--color-primary)', marginTop: '4px' }}>{detailModal.order_number}</h2>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Queue Position: <strong>#{detailModal.queue_number}</strong></p>
                    </div>
                  )}
                </div>
              );
            })()}

            <div style={{ background: 'rgba(255,255,255,0.4)', borderRadius: 'var(--radius-sm)', padding: '18px', border: '1px solid var(--border-glass)', marginBottom: '16px' }}>
              <h4 style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>Client Information</h4>
              {[
                { label: 'Name', value: detailModal.client_name },
                { label: 'Email', value: detailModal.client_email },
                { label: 'Phone', value: detailModal.client_phone },
                { label: 'Location', value: detailModal.client_location === 'inside_egypt' ? '🇪🇬 Inside Egypt' : '🌍 Outside Egypt' },
              ].map((r, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: i < 3 ? '1px solid var(--border-glass)' : 'none' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{r.label}</span>
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-main)', fontWeight: 600 }}>{r.value}</span>
                </div>
              ))}
            </div>

            <div style={{ background: 'rgba(255,255,255,0.4)', borderRadius: 'var(--radius-sm)', padding: '18px', border: '1px solid var(--border-glass)', marginBottom: '16px' }}>
              <h4 style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>Payment Details</h4>
              {[
                { label: 'Method', value: PAYMENT_METHODS[detailModal.payment_method]?.label || detailModal.payment_method },
                { label: 'Amount', value: formatCurrency(detailModal.payment_amount) },
                { label: 'Submitted', value: formatDate(detailModal.created_at) },
                ...(detailModal.reviewed_at ? [{ label: 'Reviewed', value: formatDate(detailModal.reviewed_at) }] : []),
                ...(detailModal.review_notes ? [{ label: 'Notes', value: detailModal.review_notes }] : []),
              ].map((r, i, arr) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: i < arr.length - 1 ? '1px solid var(--border-glass)' : 'none', gap: '16px' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', flexShrink: 0 }}>{r.label}</span>
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-main)', fontWeight: 600, textAlign: 'right' }}>{r.value}</span>
                </div>
              ))}
            </div>

            <button
              className="btn-secondary"
              onClick={() => setReceiptModal(getReceiptUrl(detailModal.receipt_path))}
              style={{ width: '100%', justifyContent: 'center' }}
            >
              <Eye style={{ width: '14px', height: '14px' }} /> View Payment Receipt
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default EoiReservations;
