import React, { useState, useEffect } from 'react';
import { Building2, Users, QrCode, ShieldCheck, Car, Key, Sparkles, Plus, Calendar, AlertTriangle, ArrowRight, CheckCircle, UserPlus, Wrench, DollarSign, RefreshCw, X, Home, CreditCard, Phone, Trash2, Clock, Zap, Droplets, Hammer, Paintbrush, Wind, Send, Tag, ChevronRight, CircleDot, Eye, Bell, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../services/api';

// ═══════════════════════════════════════════════════════════════
// TYPE DEFINITIONS
// ═══════════════════════════════════════════════════════════════
interface UnitInfo {
  id: string;
  unit_number: string;
  type: string;
  area: number;
  bedrooms: number;
  bathrooms: number;
  floor: number;
  building: string;
  view_type: string;
  status: string;
  handover_date: string | null;
  project_name: string;
  project_delivery_date: string | null;
}

interface FinancialSummary {
  total_amount: number;
  paid_amount: number;
  outstanding: number;
  total_installments: number;
  paid_installments: number;
  pending_installments: number;
  overdue_installments: number;
  next_due: any;
}

interface PaymentItem {
  id: string;
  amount: number;
  status: string;
  due_date: string;
  paid_at: string | null;
  installment_number: number;
  is_overdue: boolean;
}

interface FamilyMemberType {
  id: string;
  name: string;
  relationship: string;
  national_id: string | null;
  phone: string | null;
  date_of_birth: string | null;
  photo_url?: string | null;
}

interface VehicleType {
  id: string;
  make: string;
  model: string;
  color: string;
  plate_number: string;
  year: number | null;
}

interface ServiceRequestType {
  id: string;
  service_type: string;
  title: string;
  description: string;
  priority: string;
  status: string;
  created_at: string;
}

interface ResaleRequestType {
  id: string;
  unit_id: string;
  asking_price: number | null;
  reason: string | null;
  status: string;
  created_at: string;
}

interface ContractInfo {
  id: string;
  contract_number: string;
  status: string;
  total_amount: number;
  paid_amount: number;
  signed_at: string | null;
  document_path: string | null;
}

interface NotificationItem {
  id: string;
  title: string;
  content: string;
  channel: string;
  status: string;
  created_at: string;
}

interface FileItem {
  id: string;
  title: string;
  file_path: string;
  type: string;
  created_at: string;
}

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════

const Overview: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRole] = useState('client');
  const [activeTab, setActiveTab] = useState('overview');

  // Homeowner data
  const [unitInfo, setUnitInfo] = useState<UnitInfo | null>(null);
  const [financialSummary, setFinancialSummary] = useState<FinancialSummary | null>(null);
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [familyMembers, setFamilyMembers] = useState<FamilyMemberType[]>([]);
  const [vehicles, setVehicles] = useState<VehicleType[]>([]);
  const [serviceRequests, setServiceRequests] = useState<ServiceRequestType[]>([]);
  const [resaleRequests, setResaleRequests] = useState<ResaleRequestType[]>([]);

  // ── 11. Customer Portal ──
  const [contractInfo, setContractInfo] = useState<ContractInfo | null>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [fileSearch, setFileSearch] = useState('');

  // Handover Officer data
  const [scheduledHandovers, setScheduledHandovers] = useState<any[]>([]);
  const [recentSnags, setRecentSnags] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any>({});

  // Forms
  const [showFamilyForm, setShowFamilyForm] = useState(false);
  const [showVehicleForm, setShowVehicleForm] = useState(false);
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [showResaleForm, setShowResaleForm] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  // Guest pass state
  const [visitorName, setVisitorName] = useState('');
  const [visitDate, setVisitDate] = useState('');
  const [carPlate, setCarPlate] = useState('');
  const [generatedPass, setGeneratedPass] = useState<any | null>(null);
  const [passLoading, setPassLoading] = useState(false);
  const [activePasses, setActivePasses] = useState<any[]>([
    { id: 'g1', name: 'Mustafa Kamel', date: '2026-06-02', plate: 'أ ج ب 1234', status: 'valid' },
    { id: 'g2', name: 'Laila Hassan', date: '2026-06-02', plate: 'None', status: 'valid' }
  ]);

  // Family form state
  const [famName, setFamName] = useState('');
  const [famRelation, setFamRelation] = useState('spouse');
  const [famNationalId, setFamNationalId] = useState('');
  const [famPhone, setFamPhone] = useState('');
  const [famDob, setFamDob] = useState('');
  const [famPhoto, setFamPhoto] = useState<File | null>(null);
  const [selectedMemberForId, setSelectedMemberForId] = useState<FamilyMemberType | null>(null);

  const getPhotoUrl = (url: string | null | undefined) => {
    if (!url) return null;
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    let host = '';
    try {
      const parsed = new URL(api.defaults.baseURL || 'http://127.0.0.1:8000');
      host = parsed.origin;
    } catch (e) {
      host = 'http://127.0.0.1:8000';
    }
    if (url.startsWith('/')) {
      return host + url;
    }
    return host + '/' + url;
  };

  // Vehicle form state
  const [vehMake, setVehMake] = useState('');
  const [vehModel, setVehModel] = useState('');
  const [vehColor, setVehColor] = useState('');
  const [vehPlate, setVehPlate] = useState('');
  const [vehYear, setVehYear] = useState('');

  // Service form state
  const [srvType, setSrvType] = useState('electrician');
  const [srvTitle, setSrvTitle] = useState('');
  const [srvDesc, setSrvDesc] = useState('');
  const [srvPriority, setSrvPriority] = useState('medium');

  // Resale form state
  const [resalePrice, setResalePrice] = useState('');
  const [resaleReason, setResaleReason] = useState('');

  // EOI 5% Payment state & submit
  const [eoiReservation, setEoiReservation] = useState<any | null>(null);
  const [fivePercentFile, setFivePercentFile] = useState<File | null>(null);
  const [isFivePercentUploading, setIsFivePercentUploading] = useState(false);

  const handleFivePercentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fivePercentFile || !eoiReservation) return;
    setIsFivePercentUploading(true);
    try {
      const formData = new FormData();
      formData.append('receipt', fivePercentFile);

      const res = await api.post(`/v1/delivery/eoi-reservations/${eoiReservation.id}/pay-five-percent`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      if (res.data?.success) {
        showToast('تم رفع إيصال الدفع بنجاح لتأكيد الـ 5%! / Receipt uploaded successfully!');
        setFivePercentFile(null);
        fetchData(userRole);
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to upload receipt.', 'error');
    } finally {
      setIsFivePercentUploading(false);
    }
  };

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  // ═══════════════════════════════════════════════════════════════
  // DATA FETCHING
  // ═══════════════════════════════════════════════════════════════

  useEffect(() => {
    const userStr = localStorage.getItem('redp_user');
    const user = userStr ? JSON.parse(userStr) : { role: 'client' };
    setUserRole(user.role);
    fetchData(user.role);
  }, []);

  const fetchData = async (role: string) => {
    setIsLoading(true);
    try {
      if (role === 'client') {
        // Fetch homeowner dashboard
        const res = await api.get('/v1/delivery/homeowner/dashboard');
        if (res.data?.success) {
          setUnitInfo(res.data.unit);
          setFinancialSummary(res.data.financial_summary);
          setPayments(res.data.payments || []);
          setFamilyMembers(res.data.family_members || []);
          setVehicles(res.data.vehicles || []);
          setServiceRequests(res.data.service_requests || []);
          setResaleRequests(res.data.resale_requests || []);
          setContractInfo(res.data.contract || null);
          setNotifications(res.data.notifications || []);
          setFiles(res.data.files || []);
          setEoiReservation(res.data.eoi_reservation || null);
        }
      } else {
        // Fetch handover officer dashboard
        const res = await api.get('/v1/delivery/overview');
        if (res.data?.success) {
          setMetrics(res.data.metrics || {});
          setScheduledHandovers(res.data.scheduled_handovers || []);
          setRecentSnags(res.data.recent_snags || []);
        }
      }
    } catch (err) {
      console.warn('API fallback mode.', err);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshDashboard = () => fetchData(userRole);

  // ═══════════════════════════════════════════════════════════════
  // ACTION HANDLERS
  // ═══════════════════════════════════════════════════════════════

  const handleAddFamily = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      const formData = new FormData();
      formData.append('name', famName);
      formData.append('relationship', famRelation);
      if (famNationalId) formData.append('national_id', famNationalId);
      if (famPhone) formData.append('phone', famPhone);
      if (famDob) formData.append('date_of_birth', famDob);
      if (famPhoto) {
        formData.append('photo', famPhoto);
      }

      const res = await api.post('/v1/delivery/homeowner/family', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      if (res.data?.success) {
        setFamilyMembers(prev => [res.data.data, ...prev]);
        showToast('Family member added successfully!');
        setShowFamilyForm(false);
        setFamName('');
        setFamRelation('spouse');
        setFamNationalId('');
        setFamPhone('');
        setFamDob('');
        setFamPhoto(null);
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to add family member.', 'error');
    } finally {
      setFormLoading(false);
    }
  };

  const handleRemoveFamily = async (id: string) => {
    try {
      await api.delete(`/v1/delivery/homeowner/family/${id}`);
      setFamilyMembers(prev => prev.filter(m => m.id !== id));
      showToast('Family member removed.');
    } catch { showToast('Failed to remove.', 'error'); }
  };

  const handleAddVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      const res = await api.post('/v1/delivery/homeowner/vehicles', {
        make: vehMake, model: vehModel, color: vehColor,
        plate_number: vehPlate, year: vehYear ? parseInt(vehYear) : null
      });
      if (res.data?.success) {
        setVehicles(prev => [res.data.data, ...prev]);
        showToast('Vehicle registered successfully!');
        setShowVehicleForm(false);
        setVehMake(''); setVehModel(''); setVehColor(''); setVehPlate(''); setVehYear('');
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to add vehicle.', 'error');
    } finally {
      setFormLoading(false);
    }
  };

  const handleRemoveVehicle = async (id: string) => {
    try {
      await api.delete(`/v1/delivery/homeowner/vehicles/${id}`);
      setVehicles(prev => prev.filter(v => v.id !== id));
      showToast('Vehicle removed.');
    } catch { showToast('Failed to remove.', 'error'); }
  };

  const handleServiceRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!unitInfo) { showToast('No unit found for this account.', 'error'); return; }
    setFormLoading(true);
    try {
      const res = await api.post('/v1/delivery/homeowner/service-requests', {
        unit_id: unitInfo.id, service_type: srvType, title: srvTitle,
        description: srvDesc, priority: srvPriority
      });
      if (res.data?.success) {
        setServiceRequests(prev => [res.data.data, ...prev]);
        showToast('Service request submitted! Our team will contact you soon.');
        setShowServiceForm(false);
        setSrvType('electrician'); setSrvTitle(''); setSrvDesc(''); setSrvPriority('medium');
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to submit service request.', 'error');
    } finally {
      setFormLoading(false);
    }
  };

  const handleResaleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!unitInfo) { showToast('No unit found for this account.', 'error'); return; }
    setFormLoading(true);
    try {
      const res = await api.post('/v1/delivery/homeowner/resale', {
        unit_id: unitInfo.id,
        asking_price: resalePrice ? parseFloat(resalePrice) : null,
        reason: resaleReason || null
      });
      if (res.data?.success) {
        setResaleRequests(prev => [res.data.data, ...prev]);
        showToast('Resale request submitted! Company sales will review your request.');
        setShowResaleForm(false);
        setResalePrice(''); setResaleReason('');
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to submit resale request.', 'error');
    } finally {
      setFormLoading(false);
    }
  };

  const handleCreatePass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!visitorName || !visitDate) return;
    setPassLoading(true);
    try {
      const response = await api.post('/v1/delivery/gate-code', {
        visitor_name: visitorName, visit_date: visitDate, car_plate: carPlate
      });
      if (response.data?.success) {
        const details = response.data.visitor_details;
        const newPass = { id: details.pass_id, name: details.name, date: details.date, plate: details.plate, status: 'valid', qr_code_data: response.data.qr_code_data };
        setGeneratedPass(newPass);
        setActivePasses(prev => [newPass, ...prev]);
        setVisitorName(''); setVisitDate(''); setCarPlate('');
      }
    } catch {
      const mockPass = { id: 'g' + (activePasses.length + 1), name: visitorName, date: visitDate, plate: carPlate || 'None', status: 'valid' };
      setGeneratedPass(mockPass);
      setActivePasses(prev => [mockPass, ...prev]);
      setVisitorName(''); setVisitDate(''); setCarPlate('');
    } finally {
      setPassLoading(false);
    }
  };

  // ═══════════════════════════════════════════════════════════════
  // UTILITY FUNCTIONS
  // ═══════════════════════════════════════════════════════════════

  const fmtCurrency = (val: number) => new Intl.NumberFormat('en-EG', { style: 'currency', currency: 'EGP', maximumFractionDigits: 0 }).format(val);

  const serviceIcons: Record<string, React.ReactNode> = {
    electrician: <Zap size={18} style={{ color: '#f59e0b' }} />,
    plumber: <Droplets size={18} style={{ color: '#3b82f6' }} />,
    carpenter: <Hammer size={18} style={{ color: '#8b5cf6' }} />,
    painter: <Paintbrush size={18} style={{ color: '#ec4899' }} />,
    ac_technician: <Wind size={18} style={{ color: '#06b6d4' }} />,
    general: <Wrench size={18} style={{ color: '#6b7280' }} />,
  };

  const statusColors: Record<string, string> = {
    pending: '#f59e0b', assigned: '#3b82f6', in_progress: '#8b5cf6',
    completed: '#10b981', cancelled: '#6b7280', paid: '#10b981',
    failed: '#ef4444', overdue: '#ef4444', listed: '#3b82f6',
    approved: '#10b981', rejected: '#ef4444',
    upcoming: '#3b82f6', partial: '#f59e0b',
  };

  const relationEmoji: Record<string, string> = {
    spouse: '💑', child: '👶', parent: '👨‍👩‍👦', sibling: '👫', other: '👤'
  };

  // ═══════════════════════════════════════════════════════════════
  // LOADING SCREEN
  // ═══════════════════════════════════════════════════════════════

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', flexDirection: 'column', gap: '16px' }}>
        <div className="animate-spin" style={{ width: '40px', height: '40px', border: '4px solid var(--color-success)', borderTopColor: 'transparent', borderRadius: '50%' }} />
        <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 600 }}>Loading Portal...</span>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // TOAST NOTIFICATION
  // ═══════════════════════════════════════════════════════════════

  const ToastNotification = () => toast ? (
    <div style={{
      position: 'fixed', top: '20px', right: '20px', zIndex: 9999, padding: '14px 24px',
      background: toast.type === 'success' ? 'linear-gradient(135deg, #10b981, #059669)' : 'linear-gradient(135deg, #ef4444, #dc2626)',
      color: '#fff', borderRadius: '12px', fontSize: '0.85rem', fontWeight: 600,
      boxShadow: '0 8px 32px rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', gap: '10px',
      animation: 'slideInRight 0.3s ease'
    }}>
      {toast.type === 'success' ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
      {toast.msg}
    </div>
  ) : null;

  // ═══════════════════════════════════════════════════════════════
  // MODAL WRAPPER
  // ═══════════════════════════════════════════════════════════════

  const Modal: React.FC<{ title: string; onClose: () => void; children: React.ReactNode }> = ({ title, onClose, children }) => (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9000,
      background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
    }} onClick={onClose}>
      <div className="glass-panel" style={{
        width: '100%', maxWidth: '520px', padding: '0', overflow: 'hidden',
        animation: 'slideInRight 0.3s ease'
      }} onClick={e => e.stopPropagation()}>
        <div style={{
          padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          background: 'rgba(255,255,255,0.02)'
        }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>{title}</h3>
          <button onClick={onClose} style={{
            background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '8px',
            width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: 'var(--text-muted)'
          }}><X size={16} /></button>
        </div>
        <div style={{ padding: '24px' }}>{children}</div>
      </div>
    </div>
  );

  // ═══════════════════════════════════════════════════════════════
  // HANDOVER OFFICER DASHBOARD (non-client roles)
  // ═══════════════════════════════════════════════════════════════

  if (userRole !== 'client') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
        <ToastNotification />

        {/* Header Panel */}
        <div className="glass-panel" style={{ padding: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Key style={{ color: 'var(--color-success)', width: '32px', height: '32px' }} />
              🔑 Handover & Inspection Control Hub
            </h1>
            <p>Monitor quality control checklists, inspect units, and manage scheduled handovers.</p>
          </div>
          <div style={{ padding: '6px 12px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 'var(--radius-sm)' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-success)', textTransform: 'uppercase' }}>ROLE: {userRole.replace('_', ' ')}</span>
          </div>
        </div>

        {/* Grid statistics */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
          <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: 'var(--radius-sm)', background: 'rgba(59,130,246,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Building2 style={{ color: 'var(--color-primary)' }} />
            </div>
            <div>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Total Projects</span>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 800, marginTop: '2px' }}>{metrics.total_projects || 0} Projects</h3>
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: 'var(--radius-sm)', background: 'rgba(16,185,129,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle style={{ color: 'var(--color-success)' }} />
            </div>
            <div>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Handed Over Units</span>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 800, marginTop: '2px', color: 'var(--color-success)' }}>{metrics.completed_handovers || 0} Units</h3>
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: 'var(--radius-sm)', background: 'rgba(245,158,11,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Key style={{ color: 'var(--color-warning)' }} />
            </div>
            <div>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Pending Handovers</span>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 800, marginTop: '2px', color: 'var(--color-warning)' }}>{metrics.pending_handovers || 0} Units</h3>
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: 'var(--radius-sm)', background: 'rgba(239,68,68,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <AlertTriangle style={{ color: 'var(--color-danger)' }} />
            </div>
            <div>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Active QC Snags</span>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 800, marginTop: '2px', color: 'var(--color-danger)' }}>{metrics.active_snags || 0} / {metrics.total_snags || 0}</h3>
            </div>
          </div>
        </div>

        {/* Main Columns */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '30px', alignItems: 'start' }}>
          
          {/* Left Panel: Scheduled Handover Dates */}
          <div className="glass-panel" style={{ padding: '25px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Calendar style={{ color: 'var(--color-primary)' }} />
                Scheduled Handovers List (جدول مواعيد تسليم الوحدات)
              </h2>
              <Link to="/delivery/handover" className="btn-primary" style={{ padding: '6px 12px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                Go to Control Desk <ArrowRight size={14} />
              </Link>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table className="premium-table">
                <thead>
                  <tr>
                    <th>Unit Number</th>
                    <th>Project Name</th>
                    <th>Handover Date</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {scheduledHandovers.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>No handovers scheduled yet.</td>
                    </tr>
                  ) : (
                    scheduledHandovers.map((item) => (
                      <tr key={item.id}>
                        <td><strong>{item.unit_number}</strong></td>
                        <td>{item.project_name}</td>
                        <td><strong>{item.handover_date ? item.handover_date.substring(0, 10) : '—'}</strong></td>
                        <td>
                          <span className={`badge badge-${item.status === 'sold' ? 'success' : 'warning'}`}>
                            {item.status === 'sold' ? 'Handed Over' : 'Reserved'}
                          </span>
                        </td>
                        <td>
                          <Link to="/delivery/handover" className="btn-secondary" style={{ padding: '4px 8px', fontSize: '0.7rem' }}>
                            Inspect
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right Panel: Recent Snags */}
          <div className="glass-panel" style={{ padding: '25px' }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertTriangle style={{ color: 'var(--color-danger)' }} />
              Recent Defects & QC Snags (الملاحظات والعيوب المكتشفة مؤخراً)
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {recentSnags.length === 0 ? (
                <p style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>No logged defects found.</p>
              ) : (
                recentSnags.map((snag) => (
                  <div key={snag.id} className="glass-panel" style={{ padding: '14px', background: 'rgba(255,255,255,0.3)', borderLeft: `4px solid ${snag.severity === 'critical' || snag.severity === 'high' ? 'var(--color-danger)' : 'var(--color-warning)'}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '6px' }}>
                      <span style={{ fontWeight: 750, fontSize: '0.85rem' }}>Unit #{snag.unit?.unit_number || 'N/A'}</span>
                      <span className={`badge badge-${snag.severity === 'critical' || snag.severity === 'high' ? 'danger' : 'warning'}`} style={{ fontSize: '0.62rem' }}>
                        {snag.severity.toUpperCase()}
                      </span>
                    </div>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-main)', margin: '0 0 8px 0', lineHeight: 1.4 }}>
                      {snag.description}
                    </p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      <span>Status: <strong style={{ textTransform: 'capitalize' }}>{snag.status}</strong></span>
                      <span>Logged: {new Date(snag.created_at || Date.now()).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // CLIENT HOMEOWNER PORTAL
  // ═══════════════════════════════════════════════════════════════

  const tabs = [
    { id: 'overview', label: 'My Unit', icon: <Home size={16} /> },
    { id: 'contract', label: 'Contract (العقد)', icon: <ShieldCheck size={16} /> },
    { id: 'payments', label: 'Payments (الأقساط)', icon: <CreditCard size={16} /> },
    { id: 'family', label: 'Family', icon: <Users size={16} /> },
    { id: 'vehicles', label: 'Vehicles', icon: <Car size={16} /> },
    { id: 'services', label: 'Services', icon: <Wrench size={16} /> },
    { id: 'notifications', label: 'Notifications (الإشعارات)', icon: <Bell size={16} /> },
    { id: 'files', label: 'Files (الملفات)', icon: <FileText size={16} /> },
    { id: 'guests', label: 'Guest Passes', icon: <QrCode size={16} /> },
    { id: 'resale', label: 'Resale', icon: <RefreshCw size={16} /> },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <ToastNotification />

      {/* ═══ HEADER ═══ */}
      <div className="glass-panel" style={{ padding: '28px 30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.65rem', fontWeight: 800, marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Home style={{ color: 'var(--color-success)', width: '30px', height: '30px' }} />
            🏠 Homeowner Portal
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Manage your unit, family, vehicles, payments, and service requests — all in one place.
          </p>
        </div>
        <button onClick={refreshDashboard} className="btn-secondary" style={{ padding: '8px 16px', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* ═══ UNIT SUMMARY CARD ═══ */}
      {unitInfo && (
        <div className="glass-panel" style={{
          padding: '24px 30px',
          background: 'linear-gradient(135deg, rgba(16,185,129,0.06) 0%, rgba(59,130,246,0.04) 100%)',
          borderLeft: '4px solid var(--color-success)'
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '20px', alignItems: 'center' }}>
            <div>
              <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Unit</span>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 800, marginTop: '2px' }}>{unitInfo.unit_number}</h3>
            </div>
            <div>
              <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Project</span>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, marginTop: '2px' }}>{unitInfo.project_name}</h3>
            </div>
            <div>
              <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Type</span>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, marginTop: '2px', textTransform: 'capitalize' }}>{unitInfo.type} • {unitInfo.bedrooms}BR / {unitInfo.bathrooms}BA</h3>
            </div>
            <div>
              <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Area</span>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, marginTop: '2px' }}>{unitInfo.area} m² • Floor {unitInfo.floor}</h3>
            </div>
            <div>
              <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Delivery Date</span>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, marginTop: '2px', color: 'var(--color-success)' }}>
                {unitInfo.handover_date ? new Date(unitInfo.handover_date).toLocaleDateString('en-GB') : unitInfo.project_delivery_date ? new Date(unitInfo.project_delivery_date).toLocaleDateString('en-GB') : '—'}
              </h3>
            </div>
            <div>
              <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</span>
              <span className={`badge badge-${unitInfo.status === 'sold' ? 'success' : unitInfo.status === 'reserved' ? 'warning' : 'primary'}`} style={{ marginTop: '6px', display: 'inline-block' }}>
                {unitInfo.status.toUpperCase()}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ═══ TAB NAVIGATION ═══ */}
      <div style={{
        display: 'flex', gap: '4px', background: 'rgba(255,255,255,0.03)',
        borderRadius: '14px', padding: '5px', border: '1px solid rgba(255,255,255,0.06)',
        overflowX: 'auto'
      }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '10px 18px', borderRadius: '10px', border: 'none',
              background: activeTab === tab.id ? 'linear-gradient(135deg, rgba(16,185,129,0.2), rgba(59,130,246,0.15))' : 'transparent',
              color: activeTab === tab.id ? 'var(--text-main)' : 'var(--text-muted)',
              fontWeight: activeTab === tab.id ? 700 : 500, fontSize: '0.82rem',
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '7px',
              transition: 'all 0.2s ease', whiteSpace: 'nowrap',
              boxShadow: activeTab === tab.id ? '0 2px 8px rgba(16,185,129,0.15)' : 'none'
            }}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* TAB: MY UNIT OVERVIEW */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {activeTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%' }}>
          {/* EOI 5% Payment Card */}
          {eoiReservation && eoiReservation.invited_at && (
            <div className="glass-panel" style={{
              padding: '24px 30px',
              borderLeft: '4px solid ' + (eoiReservation.five_percent_paid ? 'var(--color-success)' : 'var(--color-warning)'),
              background: eoiReservation.five_percent_paid
                ? 'linear-gradient(135deg, rgba(16,185,129,0.06) 0%, rgba(59,130,246,0.03) 100%)'
                : 'linear-gradient(135deg, rgba(245,158,11,0.06) 0%, rgba(239,68,68,0.03) 100%)',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              width: '100%',
              boxSizing: 'border-box'
            }}>
              {!eoiReservation.five_percent_paid ? (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--color-warning)' }}>
                    <AlertTriangle size={24} />
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0 }}>⚠️ دفعة تأكيد الحجز (5%) مطلوبة / 5% Down Payment Required</h3>
                  </div>
                  <p style={{ fontSize: '0.88rem', color: 'var(--text-main)', margin: 0, lineHeight: '1.6' }}>
                    لتأكيد حجز وحدتك بنجاح، يُرجى دفع مبلغ 5% من إجمالي ثمن الشقة ورفع إيصال الدفع خلال مهلة أقصاها أسبوع من تاريخ استلام الدعوة. بعد الدفع، سيمكنك الذهاب للشركة لتوقيع العقد وتحديد خطة الدفع.
                  </p>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginTop: '10px', padding: '14px', background: 'rgba(255,255,255,0.4)', borderRadius: '10px', border: '1px solid rgba(0,0,0,0.03)' }}>
                    <div>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase' }}>Apartment Price / سعر الشقة</span>
                      <strong style={{ fontSize: '1.05rem', color: 'var(--text-main)' }}>{fmtCurrency(parseFloat(eoiReservation.unit?.price || 0))}</strong>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase' }}>Required 5% Down Payment / المبلغ المطلوب (5%)</span>
                      <strong style={{ fontSize: '1.05rem', color: 'var(--color-primary)' }}>{fmtCurrency(parseFloat(eoiReservation.unit?.price || 0) * 0.05)}</strong>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase' }}>Time Remaining / المهلة المتبقية</span>
                      <strong style={{ fontSize: '1rem', color: 'var(--color-danger)' }}>{(() => {
                        if (!eoiReservation.invited_at) return '';
                        const invitedDate = new Date(eoiReservation.invited_at);
                        const deadlineHours = eoiReservation.contracting_deadline_hours || 168;
                        const deadlineDate = new Date(invitedDate.getTime() + deadlineHours * 60 * 60 * 1000);
                        const diffMs = deadlineDate.getTime() - Date.now();
                        if (diffMs <= 0) return 'Expired / منتهية';
                        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
                        const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                        return diffDays > 0 ? `${diffDays}d ${diffHours}h left` : `${diffHours}h left`;
                      })()}</strong>
                    </div>
                  </div>

                  <form onSubmit={handleFivePercentSubmit} style={{ display: 'flex', gap: '14px', alignItems: 'center', flexWrap: 'wrap', marginTop: '10px' }}>
                    <div style={{ flex: 1, minWidth: '220px' }}>
                      <input 
                        type="file" 
                        accept=".jpg,.jpeg,.png,.pdf" 
                        onChange={e => setFivePercentFile(e.target.files?.[0] || null)} 
                        style={{ display: 'none' }}
                        id="five-percent-receipt-input"
                        required
                      />
                      <label 
                        htmlFor="five-percent-receipt-input"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px',
                          padding: '10px 16px',
                          borderRadius: '10px',
                          border: '1.5px dashed rgba(50, 71, 58, 0.25)',
                          background: 'rgba(255,255,255,0.4)',
                          cursor: 'pointer',
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          color: 'var(--text-main)'
                        }}
                      >
                        <FileText size={16} />
                        {fivePercentFile ? fivePercentFile.name : 'اختر إيصال الدفع (صورة أو PDF) / Select Receipt'}
                      </label>
                    </div>
                    <button 
                      type="submit" 
                      className="btn-primary" 
                      style={{ background: 'var(--color-primary)', borderColor: 'var(--color-primary)', padding: '10px 24px', fontSize: '0.82rem' }}
                      disabled={!fivePercentFile || isFivePercentUploading}
                    >
                      {isFivePercentUploading ? 'جاري الرفع... / Uploading...' : 'رفع إيصال الدفع وتأكيد الحجز / Upload Receipt'}
                    </button>
                  </form>
                </>
              ) : (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--color-success)' }}>
                    <CheckCircle size={24} />
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0 }}>✅ تم سداد دفعة الـ 5% وتأكيد الحجز بنجاح / 5% Paid Successfully</h3>
                  </div>
                  <p style={{ fontSize: '0.88rem', color: 'var(--text-main)', margin: 0, lineHeight: '1.6' }}>
                    لقد تم تسجيل سداد دفعة الـ 5% بنجاح. يرجى التوجه لمقر الشركة لتوقيع العقد النهائي واختيار نظام السداد المناسب لك (كاش أو تقسيط) بالتنسيق مع مسؤول المبيعات.
                  </p>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginTop: '10px', padding: '14px', background: 'rgba(255,255,255,0.4)', borderRadius: '10px', border: '1px solid rgba(0,0,0,0.03)' }}>
                    <div>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase' }}>Amount Paid / المبلغ المدفوع (5%)</span>
                      <strong style={{ fontSize: '1.05rem', color: 'var(--color-success)' }}>{fmtCurrency(parseFloat(eoiReservation.five_percent_amount || 0))}</strong>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase' }}>Payment Date / تاريخ السداد</span>
                      <strong style={{ fontSize: '1.05rem', color: 'var(--text-main)' }}>{eoiReservation.five_percent_paid_at ? new Date(eoiReservation.five_percent_paid_at).toLocaleDateString('en-GB') : '—'}</strong>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase' }}>Status / الحالة</span>
                      <span className="badge badge-success" style={{ display: 'inline-block', marginTop: '4px' }}>PAID / تم الدفع</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', width: '100%' }}>
          {/* Financial Quick View */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <DollarSign size={18} style={{ color: 'var(--color-success)' }} /> Financial Summary
            </h3>
            {financialSummary ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Total Value</span>
                  <strong style={{ fontSize: '1.05rem' }}>{fmtCurrency(financialSummary.total_amount)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Paid</span>
                  <strong style={{ fontSize: '1.05rem', color: 'var(--color-success)' }}>{fmtCurrency(financialSummary.paid_amount)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Outstanding</span>
                  <strong style={{ fontSize: '1.05rem', color: financialSummary.outstanding > 0 ? 'var(--color-warning)' : 'var(--color-success)' }}>
                    {fmtCurrency(financialSummary.outstanding)}
                  </strong>
                </div>
                {/* Progress Bar */}
                <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '8px', height: '10px', overflow: 'hidden' }}>
                  <div style={{
                    width: `${financialSummary.total_amount > 0 ? (financialSummary.paid_amount / financialSummary.total_amount * 100) : 0}%`,
                    height: '100%', background: 'linear-gradient(90deg, #10b981, #059669)',
                    borderRadius: '8px', transition: 'width 0.5s ease'
                  }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                  <span>{financialSummary.paid_installments}/{financialSummary.total_installments} Installments Paid</span>
                  {financialSummary.overdue_installments > 0 && (
                    <span style={{ color: 'var(--color-danger)', fontWeight: 700 }}>{financialSummary.overdue_installments} Overdue!</span>
                  )}
                </div>
              </div>
            ) : (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: '20px 0' }}>No financial data available.</p>
            )}
          </div>

          {/* Quick Stats */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={18} style={{ color: '#f59e0b' }} /> Quick Stats
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              {[
                { label: 'Family Members', value: familyMembers.length, icon: <Users size={20} />, color: '#8b5cf6' },
                { label: 'Vehicles', value: vehicles.length, icon: <Car size={20} />, color: '#3b82f6' },
                { label: 'Service Requests', value: serviceRequests.length, icon: <Wrench size={20} />, color: '#f59e0b' },
                { label: 'Guest Passes', value: activePasses.length, icon: <QrCode size={20} />, color: '#10b981' },
              ].map((stat, i) => (
                <div key={i} style={{
                  padding: '16px', borderRadius: '12px',
                  background: `${stat.color}10`, border: `1px solid ${stat.color}20`,
                  display: 'flex', flexDirection: 'column', gap: '6px'
                }}>
                  <div style={{ color: stat.color }}>{stat.icon}</div>
                  <span style={{ fontSize: '1.3rem', fontWeight: 800 }}>{stat.value}</span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>{stat.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clock size={18} style={{ color: 'var(--color-primary)' }} /> Recent Activity
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {serviceRequests.slice(0, 3).map(sr => (
                <div key={sr.id} style={{
                  padding: '12px', borderRadius: '10px', background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', gap: '12px'
                }}>
                  {serviceIcons[sr.service_type] || <Wrench size={18} />}
                  <div style={{ flex: 1 }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{sr.title}</span>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      {new Date(sr.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <span style={{
                    fontSize: '0.65rem', fontWeight: 700, padding: '3px 8px', borderRadius: '6px',
                    background: `${statusColors[sr.status] || '#6b7280'}20`,
                    color: statusColors[sr.status] || '#6b7280', textTransform: 'uppercase'
                  }}>{sr.status}</span>
                </div>
              ))}
              {serviceRequests.length === 0 && (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', textAlign: 'center', padding: '20px 0' }}>No recent activity.</p>
              )}
            </div>
          </div>
        </div>
      </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* TAB: CONTRACT */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {activeTab === 'contract' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldCheck size={20} style={{ color: 'var(--color-primary)' }} /> Contract Details (تفاصيل العقد)
          </h2>

          {contractInfo ? (
            <div className="glass-panel" style={{ padding: '30px', background: 'linear-gradient(135deg, rgba(59,130,246,0.05) 0%, rgba(16,185,129,0.03) 100%)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '20px', marginBottom: '24px' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 650 }}>Contract Number / رقم العقد</span>
                  <h3 style={{ fontSize: '1.45rem', fontWeight: 800, marginTop: '2px', color: 'var(--text-main)' }}>{contractInfo.contract_number}</h3>
                </div>
                <span className={`badge badge-${contractInfo.status === 'active' ? 'success' : 'warning'}`} style={{ padding: '6px 14px', borderRadius: '10px', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase' }}>
                  {contractInfo.status === 'active' ? '✍️ Signed & Active' : contractInfo.status}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '24px', marginBottom: '30px' }}>
                <div style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.04)' }}>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>Total Contract Value / قيمة العقد الإجمالية</span>
                  <h4 style={{ fontSize: '1.25rem', fontWeight: 800, marginTop: '6px', color: 'var(--text-main)' }}>{fmtCurrency(contractInfo.total_amount)}</h4>
                </div>
                <div style={{ padding: '16px', background: 'rgba(16,185,129,0.03)', borderRadius: '12px', border: '1px solid rgba(16,185,129,0.06)' }}>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>Total Paid / المدفوع</span>
                  <h4 style={{ fontSize: '1.25rem', fontWeight: 800, marginTop: '6px', color: 'var(--color-success)' }}>{fmtCurrency(contractInfo.paid_amount)}</h4>
                </div>
                <div style={{ padding: '16px', background: 'rgba(245,158,11,0.03)', borderRadius: '12px', border: '1px solid rgba(245,158,11,0.06)' }}>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>Outstanding Balance / المتبقي</span>
                  <h4 style={{ fontSize: '1.25rem', fontWeight: 800, marginTop: '6px', color: 'var(--color-warning)' }}>
                    {fmtCurrency(Math.max(0, contractInfo.total_amount - contractInfo.paid_amount))}
                  </h4>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '20px', fontSize: '0.82rem' }}>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Signing Date / تاريخ التوقيع:</span>{' '}
                  <strong>{contractInfo.signed_at ? new Date(contractInfo.signed_at).toLocaleString('en-GB') : 'Not signed yet'}</strong>
                </div>
                {contractInfo.document_path && (
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <a
                      href={`${api.defaults.baseURL || ''}/v1/finance/contracts/${contractInfo.id}/pdf`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-primary"
                      style={{ padding: '8px 16px', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                      <FileText size={15} /> Download Contract PDF / تحميل العقد
                    </a>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="glass-panel" style={{ padding: '40px', textAlign: 'center' }}>
              <ShieldCheck size={48} style={{ color: 'var(--text-muted)', marginBottom: '12px', opacity: 0.3 }} />
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No active contract found for this account.</p>
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* TAB: NOTIFICATIONS */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {activeTab === 'notifications' && (
        <div>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Bell size={20} style={{ color: '#f59e0b' }} /> Inbox Notifications (الإشعارات والرسائل)
          </h2>

          {notifications.length === 0 ? (
            <div className="glass-panel" style={{ padding: '40px', textAlign: 'center' }}>
              <Bell size={48} style={{ color: 'var(--text-muted)', marginBottom: '12px', opacity: 0.3 }} />
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No notifications in your inbox.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {notifications.map(n => (
                <div key={n.id} className="glass-panel" style={{
                  padding: '20px', display: 'flex', gap: '16px', alignItems: 'start',
                  borderLeft: `4px solid ${n.channel === 'email' ? 'var(--color-primary)' : 'var(--color-success)'}`,
                  background: 'rgba(255,255,255,0.02)'
                }}>
                  <div style={{
                    width: '40px', height: '40px', borderRadius: '10px',
                    background: n.channel === 'email' ? 'rgba(59,130,246,0.1)' : 'rgba(16,185,129,0.1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: n.channel === 'email' ? 'var(--color-primary)' : 'var(--color-success)',
                    flexShrink: 0
                  }}>
                    <Bell size={18} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', flexWrap: 'wrap', gap: '8px' }}>
                      <h4 style={{ fontSize: '0.95rem', fontWeight: 750, color: 'var(--text-main)' }}>{n.title}</h4>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        {new Date(n.created_at).toLocaleString('en-GB')}
                      </span>
                    </div>
                    <span style={{
                      display: 'inline-block', fontSize: '0.62rem', fontWeight: 700,
                      padding: '2px 8px', borderRadius: '6px', marginTop: '4px',
                      background: 'rgba(255,255,255,0.06)', color: 'var(--text-muted)',
                      textTransform: 'uppercase'
                    }}>
                      Channel: {n.channel}
                    </span>
                    <p style={{
                      fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '12px',
                      lineHeight: 1.6, whiteSpace: 'pre-line',
                      background: 'rgba(0,0,0,0.15)', padding: '12px 16px', borderRadius: '8px',
                      border: '1px solid rgba(255,255,255,0.02)'
                    }}>
                      {n.content}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* TAB: FILES */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {activeTab === 'files' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
              <FileText size={20} style={{ color: 'var(--color-success)' }} /> My Vault Files (الملفات والمستندات)
            </h2>
            <input
              type="text"
              className="form-control"
              placeholder="Search documents... / بحث المستندات"
              value={fileSearch}
              onChange={e => setFileSearch(e.target.value)}
              style={{ maxWidth: '260px', height: '38px', borderRadius: '10px', fontSize: '0.8rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-main)' }}
            />
          </div>

          {files.filter(f => f.title.toLowerCase().includes(fileSearch.toLowerCase())).length === 0 ? (
            <div className="glass-panel" style={{ padding: '40px', textAlign: 'center' }}>
              <FileText size={48} style={{ color: 'var(--text-muted)', marginBottom: '12px', opacity: 0.3 }} />
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No documents found matching your search.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
              {files.filter(f => f.title.toLowerCase().includes(fileSearch.toLowerCase())).map(file => (
                <div key={file.id} className="glass-panel" style={{
                  padding: '20px', display: 'flex', gap: '16px', alignItems: 'start',
                  borderLeft: '3px solid var(--color-success)', background: 'rgba(255,255,255,0.02)'
                }}>
                  <div style={{
                    width: '44px', height: '44px', borderRadius: '10px',
                    background: 'rgba(16,185,129,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'var(--color-success)', flexShrink: 0
                  }}>
                    <FileText size={20} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h4 style={{ fontSize: '0.88rem', fontWeight: 750, marginBottom: '6px', color: 'var(--text-main)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={file.title}>
                      {file.title.replace(/_/g, ' ')}
                    </h4>
                    <span style={{
                      fontSize: '0.65rem', fontWeight: 700, padding: '2px 8px', borderRadius: '6px',
                      background: 'rgba(16,185,129,0.1)', color: 'var(--color-success)',
                      textTransform: 'uppercase', display: 'inline-block'
                    }}>
                      {file.type.replace(/_/g, ' ')}
                    </span>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                      Date: {new Date(file.created_at).toLocaleDateString('en-GB')}
                    </div>
                    <div style={{ marginTop: '14px' }}>
                      <a
                        href={file.file_path.startsWith('/') ? `${api.defaults.baseURL || ''}${file.file_path}` : file.file_path}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-secondary"
                        style={{ padding: '6px 12px', fontSize: '0.72rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                      >
                        <Eye size={12} /> View Document / عرض
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* TAB: FAMILY MEMBERS */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {activeTab === 'family' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Users size={20} style={{ color: '#8b5cf6' }} /> Family Members (أفراد الأسرة)
            </h2>
            <button onClick={() => setShowFamilyForm(true)} className="btn-primary" style={{ padding: '8px 16px', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <UserPlus size={14} /> Add Member
            </button>
          </div>

          {familyMembers.length === 0 ? (
            <div className="glass-panel" style={{ padding: '40px', textAlign: 'center' }}>
              <Users size={48} style={{ color: 'var(--text-muted)', marginBottom: '12px', opacity: 0.3 }} />
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No family members added yet.</p>
              <button onClick={() => setShowFamilyForm(true)} className="btn-primary" style={{ marginTop: '16px', padding: '10px 20px', fontSize: '0.82rem' }}>
                <UserPlus size={14} /> Add Your First Family Member
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
              {familyMembers.map(member => (
                <div key={member.id} className="glass-panel" style={{
                  padding: '20px', display: 'flex', gap: '16px', alignItems: 'start',
                  borderLeft: '3px solid #8b5cf6'
                }}>
                  <div style={{
                    width: '48px', height: '48px', borderRadius: '12px',
                    background: 'rgba(139,92,246,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '1.4rem', flexShrink: 0, overflow: 'hidden'
                  }}>
                    {member.photo_url ? (
                      <img 
                        src={getPhotoUrl(member.photo_url) || ''} 
                        alt={member.name} 
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                          const parent = (e.target as HTMLElement).parentElement;
                          if (parent) {
                            const span = document.createElement('span');
                            span.innerText = relationEmoji[member.relationship] || '👤';
                            span.style.fontSize = '1.4rem';
                            parent.appendChild(span);
                          }
                        }}
                      />
                    ) : (
                      <span>{relationEmoji[member.relationship] || '👤'}</span>
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '4px' }}>{member.name}</h4>
                    <span style={{
                      fontSize: '0.7rem', fontWeight: 600, padding: '2px 8px', borderRadius: '6px',
                      background: 'rgba(139,92,246,0.1)', color: '#8b5cf6', textTransform: 'capitalize'
                    }}>{member.relationship}</span>
                    {member.phone && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Phone size={12} /> {member.phone}
                      </div>
                    )}
                    {member.national_id && (
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '3px' }}>
                        ID: {member.national_id}
                      </div>
                    )}
                    <button 
                      onClick={() => setSelectedMemberForId(member)}
                      className="btn-secondary" 
                      style={{ 
                        marginTop: '10px', 
                        padding: '4px 10px', 
                        fontSize: '0.72rem', 
                        display: 'inline-flex', 
                        alignItems: 'center', 
                        gap: '6px',
                        border: '1px solid rgba(139,92,246,0.3)',
                        background: 'rgba(139,92,246,0.05)',
                        color: '#a78bfa'
                      }}
                    >
                      <QrCode size={13} /> Generate Smart ID Card
                    </button>
                  </div>
                  <button onClick={() => handleRemoveFamily(member.id)} style={{
                    background: 'rgba(239,68,68,0.1)', border: 'none', borderRadius: '8px',
                    width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', color: '#ef4444', flexShrink: 0
                  }}><Trash2 size={14} /></button>
                </div>
              ))}
            </div>
          )}

          {/* Family Form Modal */}
          {showFamilyForm && (
            <Modal title="✨ Add Family Member" onClose={() => { setShowFamilyForm(false); setFamPhoto(null); }}>
              <form onSubmit={handleAddFamily} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Full Name *</label>
                  <input type="text" className="form-control" value={famName} onChange={e => setFamName(e.target.value)} placeholder="e.g. Ahmed Mohamed" required />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Relationship *</label>
                  <select className="form-control" value={famRelation} onChange={e => setFamRelation(e.target.value)}>
                    <option value="spouse">Spouse (زوج/زوجة)</option>
                    <option value="child">Child (ابن/ابنة)</option>
                    <option value="parent">Parent (أب/أم)</option>
                    <option value="sibling">Sibling (أخ/أخت)</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">National ID</label>
                    <input type="text" className="form-control" value={famNationalId} onChange={e => setFamNationalId(e.target.value)} placeholder="Optional" />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Phone</label>
                    <input type="text" className="form-control" value={famPhone} onChange={e => setFamPhone(e.target.value)} placeholder="Optional" />
                  </div>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Date of Birth</label>
                  <input type="date" className="form-control" value={famDob} onChange={e => setFamDob(e.target.value)} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Profile Photo</label>
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="form-control" 
                    onChange={e => {
                      if (e.target.files && e.target.files[0]) {
                        setFamPhoto(e.target.files[0]);
                      }
                    }} 
                    style={{
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      color: 'var(--text-main)',
                      padding: '8px 12px',
                      borderRadius: '10px',
                      fontSize: '0.82rem'
                    }}
                  />
                </div>
                <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '12px', marginTop: '6px' }} disabled={formLoading}>
                  <UserPlus size={16} /> {formLoading ? 'Adding...' : 'Add Family Member'}
                </button>
              </form>
            </Modal>
          )}

          {/* Smart ID Modal */}
          {selectedMemberForId && (() => {
            const member = selectedMemberForId;
            const userStr = localStorage.getItem('redp_user');
            const loggedInUser = userStr ? JSON.parse(userStr) : { name: 'Owner' };
            const qrData = `REDP-BADGE:${member.id};NAME:${member.name};UNIT:${unitInfo?.unit_number};REL:${member.relationship};OWNER:${loggedInUser.name}`;
            const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(qrData)}`;

            return (
              <Modal title="🪪 Smart ID Card / بطاقة الهوية الذكية" onClose={() => setSelectedMemberForId(null)}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', alignItems: 'center' }}>
                  
                  {/* Cards side by side or stacked */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', justifyContent: 'center', width: '100%' }}>
                    
                    {/* FRONT SIDE */}
                    <div style={{
                      width: '320px',
                      height: '200px',
                      borderRadius: '16px',
                      background: 'linear-gradient(135deg, #003DA6 0%, #001A70 100%)',
                      border: '1.5px solid rgba(197, 168, 128, 0.45)',
                      boxShadow: '0 12px 32px rgba(0, 0, 60, 0.25), inset 0 1px 0 rgba(255,255,255,0.15)',
                      position: 'relative',
                      padding: '16px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      overflow: 'hidden',
                      fontFamily: 'Outfit, Inter, sans-serif'
                    }}>
                      <div style={{
                        position: 'absolute', top: 0, left: 0, right: 0, height: '50%',
                        background: 'linear-gradient(180deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0) 100%)',
                        pointerEvents: 'none'
                      }} />
                      
                      {/* Diagonal Glass Sheen */}
                      <div style={{
                        position: 'absolute', top: '-50%', left: '-50%', width: '200%', height: '200%',
                        background: 'linear-gradient(45deg, rgba(255,255,255,0) 45%, rgba(255,255,255,0.05) 50%, rgba(255,255,255,0) 55%)',
                        pointerEvents: 'none'
                      }} />

                      {/* Header */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255, 255, 255, 0.12)', paddingBottom: '8px', zIndex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <img 
                            src="/mountain_view_logo.png" 
                            alt="Mountain View" 
                            style={{ 
                              height: '18px', 
                              width: 'auto', 
                              objectFit: 'contain',
                              filter: 'brightness(0) invert(1)' 
                            }} 
                          />
                        </div>
                        <span style={{ fontSize: '0.62rem', color: '#C5A880', fontWeight: 800, letterSpacing: '1px' }}>RESIDENT ACCESS / بطاقة مقيم</span>
                      </div>
                      
                      {/* Main */}
                      <div style={{ display: 'flex', gap: '14px', alignItems: 'center', marginTop: '10px', flex: 1, zIndex: 1 }}>
                        <div style={{
                          width: '66px',
                          height: '78px',
                          borderRadius: '8px',
                          border: '2px solid #C5A880',
                          background: 'rgba(255,255,255,0.08)',
                          boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
                          overflow: 'hidden',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          position: 'relative',
                          flexShrink: 0
                        }}>
                          {member.photo_url ? (
                            <img src={getPhotoUrl(member.photo_url) || ''} alt={member.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            <span style={{ fontSize: '2rem' }}>{relationEmoji[member.relationship] || '👤'}</span>
                          )}
                        </div>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1, textAlign: 'left' }}>
                          <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#ffffff', lineHeight: 1.2, textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>{member.name}</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ 
                              fontSize: '0.6rem', 
                              padding: '2px 6px', 
                              borderRadius: '4px', 
                              background: 'rgba(197, 168, 128, 0.2)', 
                              color: '#FFE0B2', 
                              border: '1px solid rgba(197, 168, 128, 0.3)',
                              fontWeight: 700, 
                              textTransform: 'capitalize' 
                            }}>
                              {member.relationship}
                            </span>
                            <span style={{ fontSize: '0.55rem', color: 'rgba(255,255,255,0.5)', fontWeight: 650 }}>MEMBER</span>
                          </div>
                          {member.national_id && (
                            <div style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.5)', marginTop: '2px' }}>
                              ID / الهوية: <span style={{ color: '#FFE0B2', fontFamily: 'monospace', fontWeight: 600 }}>{member.national_id}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Footer */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '8px', zIndex: 1 }}>
                        <div style={{ textAlign: 'left' }}>
                          <div style={{ fontSize: '0.5rem', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Unit / الوحدة</div>
                          <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#ffffff' }}>{unitInfo?.unit_number || 'N/A'}</div>
                        </div>
                        
                        {/* Metallic Gold Chip */}
                        <div style={{
                          width: '32px',
                          height: '24px',
                          borderRadius: '5px',
                          background: 'linear-gradient(135deg, #FFE0B2 0%, #FFA726 50%, #FB8C00 100%)',
                          position: 'relative',
                          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.4), 0 2px 4px rgba(0,0,0,0.3)',
                          border: '1px solid rgba(0,0,0,0.15)',
                          opacity: 0.9
                        }}>
                          <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: '1px', background: 'rgba(0,0,0,0.2)' }} />
                          <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: '1px', background: 'rgba(0,0,0,0.2)' }} />
                          <div style={{ position: 'absolute', left: '30%', top: 0, bottom: 0, width: '1px', background: 'rgba(0,0,0,0.2)' }} />
                          <div style={{ position: 'absolute', left: '70%', top: 0, bottom: 0, width: '1px', background: 'rgba(0,0,0,0.2)' }} />
                          <div style={{ position: 'absolute', top: '30%', left: 0, right: 0, height: '1px', background: 'rgba(0,0,0,0.2)' }} />
                          <div style={{ position: 'absolute', top: '70%', left: 0, right: 0, height: '1px', background: 'rgba(0,0,0,0.2)' }} />
                          <div style={{
                            position: 'absolute',
                            top: '25%', left: '28%', right: '28%', bottom: '25%',
                            borderRadius: '2px',
                            border: '1px solid rgba(0,0,0,0.15)',
                            background: 'transparent'
                          }} />
                        </div>
                      </div>
                    </div>
                    
                    {/* BACK SIDE */}
                    <div style={{
                      width: '320px',
                      height: '200px',
                      borderRadius: '16px',
                      background: 'linear-gradient(135deg, #001A70 0%, #000B21 100%)',
                      border: '1.5px solid rgba(197, 168, 128, 0.45)',
                      boxShadow: '0 12px 32px rgba(0, 0, 60, 0.25), inset 0 1px 0 rgba(255,255,255,0.1)',
                      position: 'relative',
                      padding: '16px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      gap: '12px',
                      overflow: 'hidden',
                      fontFamily: 'Outfit, Inter, sans-serif'
                    }}>
                      <div style={{
                        position: 'absolute', top: 0, left: 0, right: 0, height: '50%',
                        background: 'linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0) 100%)',
                        pointerEvents: 'none'
                      }} />

                      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', flex: 1, zIndex: 1, textAlign: 'left' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                            <img 
                              src="/mountain_view_logo.png" 
                              alt="Mountain View" 
                              style={{ 
                                height: '14px', 
                                width: 'auto', 
                                objectFit: 'contain',
                                filter: 'brightness(0) invert(1)' 
                              }} 
                            />
                            <span style={{ fontSize: '0.55rem', color: '#C5A880', fontWeight: 850, letterSpacing: '1px' }}>REDP RESIDENCE</span>
                          </div>
                          
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                            <span style={{ fontSize: '0.5rem', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.3px' }}>Project / المشروع</span>
                            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#ffffff' }}>{unitInfo?.project_name || 'N/A'}</span>
                            
                            <span style={{ fontSize: '0.5rem', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.3px', marginTop: '4px' }}>Owner / المالك</span>
                            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#ffffff' }}>{loggedInUser.name}</span>
                          </div>
                        </div>
                        
                        <div style={{ fontSize: '0.45rem', color: 'rgba(255,255,255,0.45)', lineHeight: 1.35 }}>
                          This card is non-transferable and remains property of Mountain View Communities. Scan QR for access log validation.
                          <br />
                          هذه البطاقة شخصية ومخصصة لمجتمعات ماونتن فيو. يرجى إبراز الرمز للتحقق الأمني.
                        </div>
                      </div>
                      
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100px', zIndex: 1 }}>
                        <div style={{
                          padding: '6px',
                          background: '#ffffff',
                          borderRadius: '10px',
                          border: '2px solid #C5A880',
                          width: '90px',
                          height: '90px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
                        }}>
                          <img src={qrCodeUrl} alt="Security QR Code" style={{ width: '78px', height: '78px' }} />
                        </div>
                        <span style={{ fontSize: '0.5rem', color: '#C5A880', marginTop: '8px', fontWeight: 700, letterSpacing: '1.2px' }}>
                          SCAN ACCESS
                        </span>
                      </div>
                    </div>
                    
                  </div>
                  
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', maxWidth: '400px', margin: '0', lineHeight: 1.4 }}>
                    💡 This Smart ID is fully scanning-ready. Security guards can scan the QR code to verify family access. You can save or print these badges.
                  </p>
                </div>
              </Modal>
            );
          })()}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* TAB: VEHICLES */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {activeTab === 'vehicles' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Car size={20} style={{ color: '#3b82f6' }} /> Registered Vehicles (السيارات المسجلة)
            </h2>
            <button onClick={() => setShowVehicleForm(true)} className="btn-primary" style={{ padding: '8px 16px', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Plus size={14} /> Add Vehicle
            </button>
          </div>

          {vehicles.length === 0 ? (
            <div className="glass-panel" style={{ padding: '40px', textAlign: 'center' }}>
              <Car size={48} style={{ color: 'var(--text-muted)', marginBottom: '12px', opacity: 0.3 }} />
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No vehicles registered yet.</p>
              <button onClick={() => setShowVehicleForm(true)} className="btn-primary" style={{ marginTop: '16px', padding: '10px 20px', fontSize: '0.82rem' }}>
                <Plus size={14} /> Register Your First Vehicle
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
              {vehicles.map(veh => (
                <div key={veh.id} className="glass-panel" style={{
                  padding: '20px', display: 'flex', gap: '16px', alignItems: 'start',
                  borderLeft: '3px solid #3b82f6'
                }}>
                  <div style={{
                    width: '48px', height: '48px', borderRadius: '12px',
                    background: 'rgba(59,130,246,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <Car size={22} style={{ color: '#3b82f6' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '4px' }}>
                      {veh.make} {veh.model} {veh.year ? `(${veh.year})` : ''}
                    </h4>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '6px' }}>
                      <span style={{
                        fontSize: '0.7rem', fontWeight: 600, padding: '2px 8px', borderRadius: '6px',
                        background: 'rgba(59,130,246,0.1)', color: '#3b82f6'
                      }}>🎨 {veh.color}</span>
                      <span style={{
                        fontSize: '0.7rem', fontWeight: 600, padding: '2px 8px', borderRadius: '6px',
                        background: 'rgba(245,158,11,0.1)', color: '#f59e0b'
                      }}>🔢 {veh.plate_number}</span>
                    </div>
                  </div>
                  <button onClick={() => handleRemoveVehicle(veh.id)} style={{
                    background: 'rgba(239,68,68,0.1)', border: 'none', borderRadius: '8px',
                    width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', color: '#ef4444', flexShrink: 0
                  }}><Trash2 size={14} /></button>
                </div>
              ))}
            </div>
          )}

          {/* Vehicle Form Modal */}
          {showVehicleForm && (
            <Modal title="🚗 Register Vehicle" onClose={() => setShowVehicleForm(false)}>
              <form onSubmit={handleAddVehicle} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Make (الشركة) *</label>
                    <input type="text" className="form-control" value={vehMake} onChange={e => setVehMake(e.target.value)} placeholder="e.g. Toyota" required />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Model (الموديل) *</label>
                    <input type="text" className="form-control" value={vehModel} onChange={e => setVehModel(e.target.value)} placeholder="e.g. Camry" required />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Color (اللون) *</label>
                    <input type="text" className="form-control" value={vehColor} onChange={e => setVehColor(e.target.value)} placeholder="e.g. White" required />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Year (السنة)</label>
                    <input type="number" className="form-control" value={vehYear} onChange={e => setVehYear(e.target.value)} placeholder="e.g. 2024" min="1990" max="2030" />
                  </div>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Plate Number (رقم اللوحة) *</label>
                  <input type="text" className="form-control" value={vehPlate} onChange={e => setVehPlate(e.target.value)} placeholder="e.g. أ ب ج 1234" required />
                </div>
                <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '12px', marginTop: '6px' }} disabled={formLoading}>
                  <Car size={16} /> {formLoading ? 'Registering...' : 'Register Vehicle'}
                </button>
              </form>
            </Modal>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* TAB: PAYMENTS */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {activeTab === 'payments' && (
        <div>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CreditCard size={20} style={{ color: '#10b981' }} /> Payment Schedule & History (جدول الأقساط)
          </h2>

          {/* Payment Summary Cards */}
          {financialSummary && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
              <div className="glass-panel" style={{ padding: '20px', borderLeft: '3px solid #10b981' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Total Contract Value</span>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginTop: '4px' }}>{fmtCurrency(financialSummary.total_amount)}</h3>
              </div>
              <div className="glass-panel" style={{ padding: '20px', borderLeft: '3px solid #3b82f6' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Total Paid</span>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginTop: '4px', color: 'var(--color-success)' }}>{fmtCurrency(financialSummary.paid_amount)}</h3>
              </div>
              <div className="glass-panel" style={{ padding: '20px', borderLeft: '3px solid #f59e0b' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Outstanding Balance</span>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginTop: '4px', color: 'var(--color-warning)' }}>{fmtCurrency(financialSummary.outstanding)}</h3>
              </div>
              <div className="glass-panel" style={{ padding: '20px', borderLeft: `3px solid ${financialSummary.overdue_installments > 0 ? '#ef4444' : '#10b981'}` }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Overdue Installments</span>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginTop: '4px', color: financialSummary.overdue_installments > 0 ? 'var(--color-danger)' : 'var(--color-success)' }}>
                  {financialSummary.overdue_installments}
                </h3>
              </div>
            </div>
          )}

          {/* Installments Table */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            {payments.length === 0 ? (
              <p style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                No installment data available. You may not have a payment plan set up yet.
              </p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="premium-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Amount</th>
                      <th>Due Date</th>
                      <th>Paid Date</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map(p => {
                      const status = p.is_overdue ? 'overdue' : (p.status || 'upcoming');
                      const labelMap: Record<string, string> = {
                        paid: 'Paid / مدفوع',
                        upcoming: 'Upcoming / قادم',
                        overdue: 'Overdue / متأخر',
                        partial: 'Partial / دفع جزئي',
                      };
                      return (
                        <tr key={p.id} style={{ background: status === 'overdue' ? 'rgba(239,68,68,0.05)' : 'transparent' }}>
                          <td><strong>{p.installment_number || '—'}</strong></td>
                          <td>
                            {status === 'partial' ? (
                              <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <strong>{fmtCurrency(p.amount)}</strong>
                                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                                  Paid: {fmtCurrency(p.paid_amount || 0)}
                                </span>
                              </div>
                            ) : (
                              <strong>{fmtCurrency(p.amount)}</strong>
                            )}
                          </td>
                          <td>{p.due_date || '—'}</td>
                          <td>{p.paid_at || '—'}</td>
                          <td>
                            <span style={{
                              fontSize: '0.7rem', fontWeight: 700, padding: '3px 10px', borderRadius: '6px',
                              background: status === 'overdue' ? 'rgba(239,68,68,0.12)' : `${statusColors[status] || '#6b7280'}15`,
                              color: status === 'overdue' ? '#ef4444' : statusColors[status] || '#6b7280',
                            }}>
                              {labelMap[status] || status.toUpperCase()}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* TAB: SERVICE REQUESTS */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {activeTab === 'services' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Wrench size={20} style={{ color: '#f59e0b' }} /> Service Requests (طلبات الخدمة)
            </h2>
            <button onClick={() => setShowServiceForm(true)} className="btn-primary" style={{ padding: '8px 16px', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Plus size={14} /> New Request
            </button>
          </div>

          {/* Service Type Quick Actions */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '12px', marginBottom: '24px' }}>
            {[
              { type: 'electrician', label: 'Electrician (كهربائي)', icon: <Zap size={24} />, color: '#f59e0b' },
              { type: 'plumber', label: 'Plumber (سباك)', icon: <Droplets size={24} />, color: '#3b82f6' },
              { type: 'carpenter', label: 'Carpenter (نجار)', icon: <Hammer size={24} />, color: '#8b5cf6' },
              { type: 'ac_technician', label: 'AC Tech (تكييف)', icon: <Wind size={24} />, color: '#06b6d4' },
              { type: 'painter', label: 'Painter (دهان)', icon: <Paintbrush size={24} />, color: '#ec4899' },
              { type: 'general', label: 'General (عام)', icon: <Wrench size={24} />, color: '#6b7280' },
            ].map(s => (
              <button key={s.type} onClick={() => { setSrvType(s.type); setShowServiceForm(true); }} style={{
                padding: '20px 14px', borderRadius: '14px', border: `1px solid ${s.color}20`,
                background: `${s.color}08`, cursor: 'pointer', display: 'flex', flexDirection: 'column',
                alignItems: 'center', gap: '10px', transition: 'all 0.2s ease', color: 'var(--text-main)'
              }}
                onMouseEnter={e => { (e.target as HTMLElement).style.transform = 'translateY(-2px)'; (e.target as HTMLElement).style.boxShadow = `0 4px 16px ${s.color}20`; }}
                onMouseLeave={e => { (e.target as HTMLElement).style.transform = ''; (e.target as HTMLElement).style.boxShadow = ''; }}
              >
                <div style={{ color: s.color }}>{s.icon}</div>
                <span style={{ fontSize: '0.72rem', fontWeight: 600, textAlign: 'center' }}>{s.label}</span>
              </button>
            ))}
          </div>

          {/* Service Requests List */}
          {serviceRequests.length === 0 ? (
            <div className="glass-panel" style={{ padding: '40px', textAlign: 'center' }}>
              <Wrench size={48} style={{ color: 'var(--text-muted)', marginBottom: '12px', opacity: 0.3 }} />
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No service requests yet. Click any service type above to get started.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {serviceRequests.map(sr => (
                <div key={sr.id} className="glass-panel" style={{
                  padding: '18px 20px', display: 'flex', alignItems: 'center', gap: '16px',
                  borderLeft: `3px solid ${statusColors[sr.status] || '#6b7280'}`
                }}>
                  <div style={{
                    width: '42px', height: '42px', borderRadius: '10px',
                    background: `${statusColors[sr.status] || '#6b7280'}10`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                  }}>
                    {serviceIcons[sr.service_type] || <Wrench size={18} />}
                  </div>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ fontSize: '0.9rem', fontWeight: 700 }}>{sr.title}</h4>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '3px' }}>{sr.description.substring(0, 80)}{sr.description.length > 80 ? '...' : ''}</p>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <span style={{
                      fontSize: '0.65rem', fontWeight: 700, padding: '3px 10px', borderRadius: '6px',
                      background: `${statusColors[sr.status] || '#6b7280'}15`,
                      color: statusColors[sr.status] || '#6b7280', textTransform: 'uppercase'
                    }}>{sr.status.replace('_', ' ')}</span>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '6px' }}>
                      {new Date(sr.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Service Form Modal */}
          {showServiceForm && (
            <Modal title="🔧 New Service Request" onClose={() => setShowServiceForm(false)}>
              <form onSubmit={handleServiceRequest} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Service Type *</label>
                  <select className="form-control" value={srvType} onChange={e => setSrvType(e.target.value)}>
                    <option value="electrician">⚡ Electrician (كهربائي)</option>
                    <option value="plumber">🔧 Plumber (سباك)</option>
                    <option value="carpenter">🔨 Carpenter (نجار)</option>
                    <option value="ac_technician">❄️ AC Technician (تكييف)</option>
                    <option value="painter">🎨 Painter (دهان)</option>
                    <option value="general">🔩 General Maintenance (صيانة عامة)</option>
                  </select>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Title (عنوان المشكلة) *</label>
                  <input type="text" className="form-control" value={srvTitle} onChange={e => setSrvTitle(e.target.value)} placeholder="e.g. Broken outlet in bedroom" required />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Description (وصف تفصيلي) *</label>
                  <textarea className="form-control" value={srvDesc} onChange={e => setSrvDesc(e.target.value)} placeholder="Please describe the issue in detail..." required style={{ minHeight: '100px', resize: 'vertical' }} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Priority</label>
                  <select className="form-control" value={srvPriority} onChange={e => setSrvPriority(e.target.value)}>
                    <option value="low">🟢 Low (عادي)</option>
                    <option value="medium">🟡 Medium (متوسط)</option>
                    <option value="high">🟠 High (عالي)</option>
                    <option value="urgent">🔴 Urgent (عاجل)</option>
                  </select>
                </div>
                <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '12px', marginTop: '6px' }} disabled={formLoading}>
                  <Send size={16} /> {formLoading ? 'Submitting...' : 'Submit Service Request'}
                </button>
              </form>
            </Modal>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* TAB: GUEST PASSES */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {activeTab === 'guests' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '24px', alignItems: 'start' }}>
          {/* Pass Creator */}
          <div className="glass-panel" style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '10px' }}>
              <QrCode style={{ color: 'var(--color-success)' }} /> Request Guest Pass
            </h2>

            <form onSubmit={handleCreatePass} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Visitor's Full Name</label>
                <input type="text" className="form-control" value={visitorName} onChange={e => setVisitorName(e.target.value)} placeholder="e.g. Sherif Omar" required />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Visit Date</label>
                <input type="date" className="form-control" value={visitDate} onChange={e => setVisitDate(e.target.value)} required />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Vehicle Plate (Optional)</label>
                <input type="text" className="form-control" value={carPlate} onChange={e => setCarPlate(e.target.value)} placeholder="e.g. س ص ع 9876" />
              </div>
              <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '12px' }} disabled={passLoading}>
                <QrCode size={16} /> {passLoading ? 'Generating...' : 'Generate Entry QR'}
              </button>
            </form>

            {generatedPass && (
              <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', background: 'rgba(16,185,129,0.05)', borderColor: 'rgba(16,185,129,0.2)' }}>
                <h4 style={{ color: 'var(--color-success)', fontWeight: 700, fontSize: '0.9rem' }}>QR Code Generated!</h4>
                <div style={{ padding: '16px', background: '#ffffff', borderRadius: 'var(--radius-sm)', width: '120px', height: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <QrCode style={{ color: '#0b0f19', width: '80px', height: '80px' }} />
                </div>
                <div style={{ textAlign: 'center', fontSize: '0.75rem' }}>
                  <h4 style={{ fontWeight: 600 }}>{generatedPass.name}</h4>
                  <p style={{ color: 'var(--text-muted)' }}>{generatedPass.date} | Plate: {generatedPass.plate}</p>
                </div>
              </div>
            )}
          </div>

          {/* Visitor Log */}
          <div className="glass-panel" style={{ padding: '28px' }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Key style={{ color: 'var(--color-secondary)' }} /> Active Guest Passes Log
            </h2>
            <table className="premium-table">
              <thead>
                <tr>
                  <th>Visitor</th>
                  <th>Visit Date</th>
                  <th>Plate No</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {activePasses.map(pass => (
                  <tr key={pass.id}>
                    <td><strong>{pass.name}</strong></td>
                    <td>{pass.date}</td>
                    <td>{pass.plate}</td>
                    <td><span className="badge badge-success">Valid Pass</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* TAB: RESALE */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {activeTab === 'resale' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <RefreshCw size={20} style={{ color: '#ec4899' }} /> Resale Requests (طلبات إعادة البيع)
            </h2>
            {unitInfo && (
              <button onClick={() => setShowResaleForm(true)} className="btn-primary" style={{
                padding: '8px 16px', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '6px',
                background: 'linear-gradient(135deg, #ec4899, #be185d)'
              }}>
                <RefreshCw size={14} /> Request Resale
              </button>
            )}
          </div>

          {/* Info Box */}
          <div className="glass-panel" style={{
            padding: '18px 24px', marginBottom: '20px',
            background: 'rgba(236,72,153,0.05)', borderLeft: '3px solid #ec4899'
          }}>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
              <strong style={{ color: '#ec4899' }}>How Resale Works:</strong> When you request a resale, the company sales team will review your request. 
              If approved, your unit will be re-listed on the company's inventory as a <strong>RESALE</strong> unit. 
              The company sales team will handle finding a new buyer. You'll be notified of any updates.
            </p>
          </div>

          {/* Resale Requests List */}
          {resaleRequests.length === 0 ? (
            <div className="glass-panel" style={{ padding: '40px', textAlign: 'center' }}>
              <RefreshCw size={48} style={{ color: 'var(--text-muted)', marginBottom: '12px', opacity: 0.3 }} />
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>You haven't submitted any resale requests yet.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {resaleRequests.map(rr => (
                <div key={rr.id} className="glass-panel" style={{
                  padding: '22px', borderLeft: `3px solid ${statusColors[rr.status] || '#6b7280'}`
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '10px' }}>
                    <div>
                      <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '4px' }}>
                        Resale Request — Unit {unitInfo?.unit_number || 'N/A'}
                      </h4>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        Submitted: {new Date(rr.created_at).toLocaleDateString('en-GB')}
                      </span>
                    </div>
                    <span style={{
                      fontSize: '0.7rem', fontWeight: 700, padding: '4px 12px', borderRadius: '8px',
                      background: `${statusColors[rr.status] || '#6b7280'}15`,
                      color: statusColors[rr.status] || '#6b7280', textTransform: 'uppercase'
                    }}>{rr.status}</span>
                  </div>
                  {rr.asking_price && (
                    <div style={{ fontSize: '0.82rem', marginBottom: '6px' }}>
                      <strong>Asking Price:</strong> {fmtCurrency(rr.asking_price)}
                    </div>
                  )}
                  {rr.reason && (
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                      <strong>Reason:</strong> {rr.reason}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Resale Form Modal */}
          {showResaleForm && (
            <Modal title="🔄 Request Unit Resale" onClose={() => setShowResaleForm(false)}>
              <div style={{
                padding: '14px', borderRadius: '10px', background: 'rgba(245,158,11,0.08)',
                border: '1px solid rgba(245,158,11,0.15)', marginBottom: '18px'
              }}>
                <p style={{ fontSize: '0.78rem', color: '#f59e0b', fontWeight: 600 }}>
                  ⚠️ By submitting this request, you are indicating your intent to sell your unit back through the company. This action will be reviewed by the company sales team.
                </p>
              </div>
              <form onSubmit={handleResaleRequest} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Unit</label>
                  <input type="text" className="form-control" value={`${unitInfo?.unit_number} — ${unitInfo?.project_name}`} disabled />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Asking Price (السعر المطلوب)</label>
                  <input type="number" className="form-control" value={resalePrice} onChange={e => setResalePrice(e.target.value)} placeholder="e.g. 2500000" min="0" />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Reason for Resale (السبب)</label>
                  <textarea className="form-control" value={resaleReason} onChange={e => setResaleReason(e.target.value)} placeholder="Optional: Why do you want to sell?" style={{ minHeight: '80px', resize: 'vertical' }} />
                </div>
                <button type="submit" className="btn-primary" style={{
                  width: '100%', justifyContent: 'center', padding: '12px', marginTop: '6px',
                  background: 'linear-gradient(135deg, #ec4899, #be185d)'
                }} disabled={formLoading}>
                  <Send size={16} /> {formLoading ? 'Submitting...' : 'Submit Resale Request'}
                </button>
              </form>
            </Modal>
          )}
        </div>
      )}

      {/* ═══ CSS ANIMATIONS ═══ */}
      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(20px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>

    </div>
  );
};

export default Overview;
