import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import CustomPlanBuilder from './CustomPlanBuilder';
import InteractiveUnitSelection from '../public/InteractiveUnitSelection';
import {
  Building2, Users, ChevronRight, ChevronLeft, MapPin, Layers, CheckCircle,
  Clock, Lock, DollarSign, FileText, ArrowRight, X, CreditCard, Banknote,
  Loader, ShieldCheck, RefreshCw, Calculator, SlidersHorizontal, Send, AlertTriangle,
  Store, Search, UserCheck
} from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════
   Company Sales — Guided Flow
   Projects → (Inventory + Reserved Clients) → Contracting → Accounting
   ═══════════════════════════════════════════════════════════════ */

interface ProjectItem {
  id: string; name: string; location?: string; status?: string;
  units_count?: number; available_units_count?: number;
  reserved_units_count?: number; sold_units_count?: number;
  reserved_clients_count?: number;
}
interface UnitItem {
  id: string; unit_number: string; status: string; price: number;
  area?: number | null; bedrooms?: number | null; type?: string; building?: string | null; floor?: number | null;
  min_down_payment?: number | null;
}
interface ContractLite {
  id: string; contract_number: string; status: string;
  accounting_handover_at?: string | null; type?: string; notes?: string | null;
  is_custom_plan?: boolean;
  plan_approval_status?: 'not_required' | 'pending' | 'approved' | 'rejected';
  plan_approval_notes?: string | null;
}

// A draft contract auto-created on reservation (default placeholder plan) —
// the rep should still build the real payment plan before signing.
const isAutoDraft = (c?: ContractLite | null): boolean =>
  !!c && c.status === 'draft' && (c.plan_approval_status ?? 'not_required') === 'not_required' &&
  (c.notes || '').toLowerCase().startsWith('auto-generated');
interface Reservation {
  id: string; status: string; expires_at?: string | null; eoi_amount?: number | string | null;
  unit?: UnitItem & { project?: { id: string; name: string } };
  client?: { id: string; name: string; email: string; phone: string };
  contract?: ContractLite | null;
}
interface PaymentPlan {
  id: string; name: string; name_ar?: string; down_payment_pct: number | string;
  installments: number; discount_pct: number | string; description?: string;
}

const fmt = (n: number | string | null | undefined) => {
  const v = typeof n === 'string' ? parseFloat(n) : (n ?? 0);
  return new Intl.NumberFormat('en-EG', { style: 'currency', currency: 'EGP', maximumFractionDigits: 0 }).format(v || 0);
};
const fmtDate = (s?: string | null) => s ? new Date(s).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

// A contract that still counts (ignore cancelled/withdrawn so the client can be re-contracted)
const liveContract = (r: { contract?: ContractLite | null }): ContractLite | null => {
  const c = r.contract;
  return c && !['cancelled', 'withdrawn'].includes(c.status) ? c : null;
};

const STATUS_COLORS: Record<string, string> = {
  available: '#22c55e', reserved: '#f59e0b', sold: '#ef4444', frozen: '#06b6d4', hidden: '#64748b', coming_soon: '#94a3b8',
};

const CompanySalesFlow: React.FC = () => {
  const navigate = useNavigate();
  const [level, setLevel] = useState<'projects' | 'project'>('projects');
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);

  const [selectedProject, setSelectedProject] = useState<ProjectItem | null>(null);
  const [units, setUnits] = useState<UnitItem[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [plans, setPlans] = useState<PaymentPlan[]>([]);
  const [loadingProject, setLoadingProject] = useState(false);
  const [tab, setTab] = useState<'clients' | 'inventory'>('clients');

  // Contracting modal
  const [contracting, setContracting] = useState<Reservation | null>(null);

  // Showroom (browse projects as the client sees them) + reserve-for-client
  const [showroom, setShowroom] = useState(false);
  const [agentReserve, setAgentReserve] = useState<{ unitId: string; unitNumber: string; projectName?: string; price?: number } | null>(null);

  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const notify = (msg: string, type: 'success' | 'error' = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3500); };

  const loadProjects = useCallback(async () => {
    setLoadingProjects(true);
    try {
      const res = await api.get('/sales/company/projects');
      if (res.data?.success) setProjects(res.data.data || []);
    } catch { notify('Failed to load projects', 'error'); }
    setLoadingProjects(false);
  }, []);

  useEffect(() => { loadProjects(); }, [loadProjects]);

  const openProject = async (p: ProjectItem) => {
    setSelectedProject(p);
    setLevel('project');
    setTab('clients');
    setLoadingProject(true);
    try {
      const [unitsRes, txnRes, plansRes] = await Promise.all([
        api.get('/sales/company/units', { params: { project_id: p.id, per_page: 500 } }),
        api.get('/sales/company/transactions', { params: { project_id: p.id, per_page: 200 } }),
        api.get(`/sales/company/projects/${p.id}/payment-plans`).catch(() => ({ data: { data: [] } })),
      ]);
      setUnits(unitsRes.data?.data?.data || unitsRes.data?.data || []);
      setReservations(txnRes.data?.data?.data || txnRes.data?.data || []);
      setPlans(plansRes.data?.data || []);
    } catch { notify('Failed to load project data', 'error'); }
    setLoadingProject(false);
  };

  const refreshProject = () => { if (selectedProject) openProject(selectedProject); };

  const inventoryByStatus = units.reduce((acc, u) => { acc[u.status] = (acc[u.status] || 0) + 1; return acc; }, {} as Record<string, number>);

  /* ─────────── Render: Projects ─────────── */
  const renderProjects = () => (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, color: '#0f172a' }}>My Projects</h2>
          <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '0.88rem' }}>Pick a project to manage its inventory, reserved clients and contracts.</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => setShowroom(true)} style={{ display: 'flex', alignItems: 'center', gap: 7, background: 'linear-gradient(135deg,#003DA6,#001A70)', color: '#fff', border: 'none', borderRadius: 10, padding: '9px 18px', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,61,166,0.2)' }}>
            <Store size={15} /> Showroom — Browse & Reserve
          </button>
          <button onClick={loadProjects} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', fontSize: '0.8rem' }}>
            <RefreshCw size={14} /> Refresh
          </button>
        </div>
      </div>

      {loadingProjects ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8' }}><Loader size={28} className="spin" /></div>
      ) : projects.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8' }}><Building2 size={40} /><p>No projects available.</p></div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 18 }}>
          {projects.map(p => (
            <div key={p.id} onClick={() => openProject(p)}
              style={{ background: '#fff', border: '1.5px solid #e8edf3', borderRadius: 18, padding: 22, cursor: 'pointer', transition: 'all 0.25s', boxShadow: '0 6px 20px rgba(15,23,42,0.04)' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 16px 36px rgba(0,61,166,0.1)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(15,23,42,0.04)'; }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                <div style={{ width: 46, height: 46, borderRadius: 12, background: 'linear-gradient(135deg,#003DA6,#001A70)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Building2 size={22} color="#fff" />
                </div>
                {(p.reserved_clients_count ?? 0) > 0 && (
                  <span style={{ background: 'rgba(245,158,11,0.12)', color: '#b45309', fontWeight: 800, fontSize: '0.72rem', padding: '5px 11px', borderRadius: 999, display: 'flex', alignItems: 'center', gap: 5 }}>
                    <Users size={12} /> {p.reserved_clients_count} reserved
                  </span>
                )}
              </div>
              <h3 style={{ margin: '0 0 4px', fontSize: '1.12rem', fontWeight: 800, color: '#0f172a' }}>{p.name}</h3>
              <p style={{ margin: '0 0 16px', color: '#94a3b8', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 5 }}>
                <MapPin size={13} /> {p.location || '—'}
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }}>
                {[
                  { label: 'Total', value: p.units_count ?? 0, color: '#0f172a' },
                  { label: 'Available', value: p.available_units_count ?? 0, color: '#22c55e' },
                  { label: 'Reserved', value: p.reserved_units_count ?? 0, color: '#f59e0b' },
                  { label: 'Sold', value: p.sold_units_count ?? 0, color: '#ef4444' },
                ].map(s => (
                  <div key={s.label} style={{ textAlign: 'center', background: '#f8fafc', borderRadius: 10, padding: '10px 4px' }}>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: s.color }}>{s.value}</div>
                    <div style={{ fontSize: '0.62rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>{s.label}</div>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 14 }}>
                <span style={{ color: '#003DA6', fontWeight: 700, fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: 4 }}>
                  Manage <ArrowRight size={15} />
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  /* ─────────── Render: Project detail ─────────── */
  const reservedClients = reservations.filter(r => ['confirmed', 'pending'].includes(r.status) || r.contract);

  const contractState = (r: Reservation): { label: string; color: string; cta: string } => {
    const c = liveContract(r);
    if (!c) return { label: 'Ready to contract', color: '#f59e0b', cta: 'Start Contract' };
    if (isAutoDraft(c)) return { label: 'Reserved — set payment plan', color: '#f59e0b', cta: 'Set Payment Plan' };
    if (c.plan_approval_status === 'pending') return { label: 'Custom plan — pending accountant', color: '#a855f7', cta: 'View' };
    if (c.plan_approval_status === 'rejected') return { label: 'Plan rejected — revise', color: '#ef4444', cta: 'Revise Plan' };
    if (c.status === 'draft' && c.plan_approval_status === 'approved') return { label: 'Plan approved — ready to sign', color: '#16a34a', cta: 'Sign Contract' };
    if (c.status === 'draft' || c.status === 'pending_signature') return { label: 'Draft contract', color: '#3b82f6', cta: 'Continue' };
    if (c.status === 'active' && !c.accounting_handover_at) return { label: 'Signed — pending accounting', color: '#8b5cf6', cta: 'Hand to Accounting' };
    if (c.status === 'active' && c.accounting_handover_at) return { label: 'With Accounting ✓', color: '#22c55e', cta: 'View' };
    return { label: c.status, color: '#64748b', cta: 'Open' };
  };

  const renderProjectDetail = () => (
    <div>
      <button onClick={() => { setLevel('projects'); setSelectedProject(null); }} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontWeight: 700, fontSize: '0.82rem', marginBottom: 14, padding: 0 }}>
        <ChevronLeft size={16} /> All Projects
      </button>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 18 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, color: '#0f172a' }}>{selectedProject?.name}</h2>
          <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: 5 }}>
            <MapPin size={13} /> {selectedProject?.location || '—'}
          </p>
        </div>
        <button onClick={refreshProject} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', fontSize: '0.8rem' }}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
        {([['clients', `Reserved Clients (${reservedClients.length})`, Users], ['inventory', `Inventory (${units.length})`, Layers]] as const).map(([id, label, Icon]) => (
          <button key={id} onClick={() => setTab(id)}
            style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 18px', borderRadius: 999, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '0.82rem',
              background: tab === id ? '#003DA6' : '#fff', color: tab === id ? '#fff' : '#64748b', boxShadow: tab === id ? '0 4px 12px rgba(0,61,166,0.2)' : '0 1px 4px rgba(0,0,0,0.04)' }}>
            <Icon size={15} /> {label}
          </button>
        ))}
      </div>

      {loadingProject ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8' }}><Loader size={28} className="spin" /></div>
      ) : tab === 'clients' ? renderClients() : renderInventory()}
    </div>
  );

  const renderClients = () => (
    reservedClients.length === 0 ? (
      <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8', background: '#fff', borderRadius: 16, border: '1px dashed #e2e8f0' }}>
        <Users size={40} style={{ opacity: 0.4 }} />
        <p style={{ marginTop: 10, fontWeight: 600 }}>No reserved clients in this project yet.</p>
        <p style={{ fontSize: '0.8rem' }}>Clients appear here after they reserve a unit.</p>
      </div>
    ) : (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {reservedClients.map(r => {
          const cs = contractState(r);
          const lc = liveContract(r);
          const expired = r.expires_at && new Date(r.expires_at) < new Date() && !lc;
          return (
            <div key={r.id} style={{ background: '#fff', border: '1.5px solid #e8edf3', borderRadius: 16, padding: 18, display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr auto', gap: 16, alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.95rem' }}>{r.client?.name || '—'}</div>
                <div style={{ fontSize: '0.76rem', color: '#94a3b8' }}>{r.client?.email}</div>
                <div style={{ fontSize: '0.76rem', color: '#94a3b8' }}>{r.client?.phone}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>Unit</div>
                <div style={{ fontWeight: 700, color: '#0f172a' }}>{r.unit?.unit_number || '—'}</div>
                <div style={{ fontSize: '0.78rem', color: '#003DA6', fontWeight: 700 }}>{fmt(r.unit?.price)}</div>
              </div>
              <div>
                <span style={{ display: 'inline-block', background: `${cs.color}1a`, color: cs.color, fontWeight: 800, fontSize: '0.72rem', padding: '5px 11px', borderRadius: 999 }}>{cs.label}</span>
                <div style={{ fontSize: '0.72rem', color: expired ? '#ef4444' : '#94a3b8', marginTop: 6 }}>
                  {lc ? `Contract: ${lc.contract_number}` : (expired ? 'Hold expired' : `Hold until ${fmtDate(r.expires_at)}`)}
                </div>
              </div>
              <button onClick={() => setContracting(r)} disabled={!!expired}
                style={{ display: 'flex', alignItems: 'center', gap: 6, background: expired ? '#e5e9f0' : 'linear-gradient(135deg,#003DA6,#001A70)', color: expired ? '#94a3b8' : '#fff', border: 'none', borderRadius: 10, padding: '10px 18px', fontWeight: 700, fontSize: '0.8rem', cursor: expired ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap' }}>
                <FileText size={15} /> {cs.cta}
              </button>
            </div>
          );
        })}
      </div>
    )
  );

  const renderInventory = () => (
    <div>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
        {Object.entries(inventoryByStatus).map(([st, n]) => (
          <div key={st} style={{ background: '#fff', border: '1px solid #e8edf3', borderRadius: 12, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: STATUS_COLORS[st] || '#94a3b8' }} />
            <span style={{ fontWeight: 800, color: '#0f172a' }}>{n}</span>
            <span style={{ fontSize: '0.76rem', color: '#64748b', textTransform: 'capitalize' }}>{st}</span>
          </div>
        ))}
      </div>
      <div style={{ background: '#fff', border: '1px solid #e8edf3', borderRadius: 14, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
          <thead>
            <tr style={{ background: '#f8fafc', textAlign: 'left', color: '#64748b' }}>
              <th style={{ padding: '11px 16px' }}>Unit</th><th>Building</th><th>Floor</th><th>Type</th><th>Area</th><th>Price</th><th>Status</th>
            </tr>
          </thead>
          <tbody>
            {units.map(u => (
              <tr key={u.id} style={{ borderTop: '1px solid #f1f5f9' }}>
                <td style={{ padding: '10px 16px', fontWeight: 700, color: '#0f172a' }}>{u.unit_number}</td>
                <td>{u.building || '—'}</td><td>{u.floor ?? '—'}</td><td style={{ textTransform: 'capitalize' }}>{u.type || '—'}</td>
                <td>{u.area ? `${u.area} m²` : '—'}</td><td style={{ fontWeight: 700, color: '#003DA6' }}>{fmt(u.price)}</td>
                <td><span style={{ color: STATUS_COLORS[u.status] || '#64748b', fontWeight: 700, textTransform: 'capitalize' }}>{u.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
      {toast && (
        <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 5000, background: toast.type === 'success' ? '#16a34a' : '#dc2626', color: '#fff', padding: '12px 20px', borderRadius: 12, fontWeight: 700, fontSize: '0.85rem', boxShadow: '0 10px 30px rgba(0,0,0,0.2)' }}>
          {toast.msg}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
        <h1 style={{ margin: 0, fontSize: '1.7rem', fontWeight: 900, color: '#003DA6' }}>Company Sales</h1>
        <button onClick={() => navigate('/sales/company/legacy')} style={{ background: 'none', border: '1px solid #e5e9f0', borderRadius: 10, padding: '7px 14px', fontSize: '0.76rem', color: '#64748b', cursor: 'pointer', fontWeight: 700 }}>
          Advanced view
        </button>
      </div>

      {level === 'projects' ? renderProjects() : renderProjectDetail()}

      {contracting && (
        <ContractingModal
          reservation={contracting}
          plans={plans}
          onClose={() => setContracting(null)}
          onDone={() => { setContracting(null); refreshProject(); }}
          notify={notify}
        />
      )}

      {/* Showroom — same view the client sees, with reserve-for-client */}
      {showroom && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 3500, background: '#f8fafc', overflow: 'auto' }}>
          <div style={{ position: 'sticky', top: 0, zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 22px', background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(10px)', borderBottom: '1px solid #e8edf3' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 800, color: '#003DA6' }}>
              <Store size={18} /> Showroom — pick a unit to reserve for a client
            </div>
            <button onClick={() => setShowroom(false)} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#fff', border: '1px solid #e5e9f0', borderRadius: 10, padding: '8px 16px', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer', color: '#64748b' }}>
              <X size={16} /> Close
            </button>
          </div>
          <InteractiveUnitSelection
            embedded
            agentMode
            onAgentReserve={(unit, project) => setAgentReserve({ unitId: unit.id, unitNumber: unit.unit_number, projectName: project?.name, price: unit.price })}
          />
        </div>
      )}

      {agentReserve && (
        <ReserveForClientModal
          unitId={agentReserve.unitId}
          unitNumber={agentReserve.unitNumber}
          projectName={agentReserve.projectName}
          price={agentReserve.price}
          notify={notify}
          onClose={() => setAgentReserve(null)}
          onReserved={() => { setAgentReserve(null); setShowroom(false); loadProjects(); if (selectedProject) refreshProject(); notify('Unit reserved for the client'); }}
        />
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════
   Contracting Modal — payment method → plan → generate → sign → accounting
   ═══════════════════════════════════════════════════════════════ */
interface SchedItem { amount: number; dueDate: string; label: string; type: string; }

const ContractingModal: React.FC<{
  reservation: Reservation; plans: PaymentPlan[];
  onClose: () => void; onDone: () => void; notify: (m: string, t?: 'success' | 'error') => void;
}> = ({ reservation, plans, onClose, onDone, notify }) => {
  const unit = reservation.unit;
  const price = Number(unit?.price || 0);
  const eoiPaid = Number(reservation.eoi_amount || 0);

  const existing = liveContract(reservation);
  let initStep = 0;
  if (existing) {
    if (existing.plan_approval_status === 'rejected') initStep = 0;       // rebuild
    else if (isAutoDraft(existing)) initStep = 0;                         // placeholder → build the real plan
    else if (existing.status === 'active') initStep = 4;                  // signed → handover
    else initStep = 3;                                                    // rep-built draft → ready to sign
  }

  const [step, setStep] = useState<number>(initStep);
  const [method, setMethod] = useState<'cash' | 'installment' | 'custom'>('installment');
  const [planId, setPlanId] = useState<string>(plans[0]?.id || '');
  const [busy, setBusy] = useState(false);
  const [contract, setContract] = useState<ContractLite | null>(existing || null);
  const [submittedPending, setSubmittedPending] = useState(false);

  const plan = plans.find(p => p.id === planId);
  const showPending = submittedPending || existing?.plan_approval_status === 'pending';

  const buildSchedule = (): { schedule: SchedItem[]; monthly: number; netPrice: number; dp: number } => {
    const today = new Date();
    const iso = (d: Date) => d.toISOString().slice(0, 10);
    const addM = (m: number) => { const d = new Date(today); d.setMonth(d.getMonth() + m); return iso(d); };

    if (method === 'cash') {
      const netPrice = price;
      const dp = Math.max(0, netPrice - eoiPaid);
      return { schedule: [{ type: 'down_payment', label: 'Full Payment (Cash)', amount: dp, dueDate: iso(today) }], monthly: 0, netPrice, dp };
    }

    const discount = Number(plan?.discount_pct || 0);
    const dpPct = Number(plan?.down_payment_pct || 10);
    const n = Math.max(1, Number(plan?.installments || 12));
    const netPrice = price * (1 - discount / 100);
    const dp = netPrice * (dpPct / 100);
    const remaining = Math.max(0, netPrice - dp);
    const monthly = remaining / n;
    const schedule: SchedItem[] = [{ type: 'down_payment', label: 'Down Payment', amount: Math.round(Math.max(0, dp - eoiPaid)), dueDate: iso(today) }];
    for (let i = 1; i <= n; i++) schedule.push({ type: 'installment', label: `Installment ${i}/${n}`, amount: Math.round(monthly), dueDate: addM(i) });
    return { schedule, monthly: Math.round(monthly), netPrice, dp };
  };

  const built = buildSchedule();
  const scheduleTotal = built.schedule.reduce((s, i) => s + i.amount, 0);

  const generate = async () => {
    setBusy(true);
    try {
      const res = await api.post(`/finance/contracts/generate/${reservation.id}`, {
        type: method, schedule: built.schedule, monthly_amount: built.monthly,
        notes: method === 'installment' ? `Plan: ${plan?.name}` : 'Cash purchase',
      });
      if (res.data?.success) { setContract(res.data.contract); setStep(3); notify('Contract generated'); }
      else notify(res.data?.message || 'Failed', 'error');
    } catch (e: any) { notify(e.response?.data?.message || 'Failed to generate contract', 'error'); }
    setBusy(false);
  };

  const submitCustom = async (schedule: SchedItem[], monthly: number, note: string) => {
    setBusy(true);
    try {
      const res = await api.post(`/finance/contracts/generate/${reservation.id}`, {
        type: 'installment', is_custom: true, requires_approval: true,
        schedule, monthly_amount: monthly, notes: note,
      });
      if (res.data?.success) { setContract(res.data.contract); setSubmittedPending(true); notify('Sent to accountant for approval'); }
      else notify(res.data?.message || 'Failed', 'error');
    } catch (e: any) { notify(e.response?.data?.message || 'Failed to submit plan', 'error'); }
    setBusy(false);
  };

  const sign = async () => {
    if (!contract) return;
    setBusy(true);
    try {
      const res = await api.post(`/finance/contracts/${contract.id}/sign`);
      if (res.data?.success) { setContract(res.data.contract); setStep(4); notify('Contract signed — unit sold'); }
      else notify(res.data?.message || 'Failed to sign', 'error');
    } catch (e: any) { notify(e.response?.data?.message || 'Failed to sign contract', 'error'); }
    setBusy(false);
  };

  const handover = async () => {
    if (!contract) return;
    setBusy(true);
    try {
      const res = await api.post(`/sales/company/contracts/${contract.id}/handover-accounting`);
      if (res.data?.success) { notify('Handed over to Accounting'); onDone(); }
      else notify(res.data?.message || 'Failed', 'error');
    } catch (e: any) { notify(e.response?.data?.message || 'Failed to hand over', 'error'); }
    setBusy(false);
  };

  const STEPS = ['Payment', 'Plan', 'Review', 'Sign', 'Accounting'];
  const wide = method === 'custom' && !showPending && step >= 1;

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 4000, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 20, width: wide ? 'min(1000px,97vw)' : 'min(760px,96vw)', maxHeight: '94vh', overflow: 'auto', boxShadow: '0 30px 80px rgba(0,0,0,0.3)' }}>
        {/* header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #eef2f7', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h3 style={{ margin: 0, fontWeight: 800, color: '#003DA6', fontSize: '1.1rem' }}>Contract — {reservation.client?.name}</h3>
            <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '0.82rem' }}>Unit {unit?.unit_number} · {fmt(price)}</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}><X size={22} /></button>
        </div>

        {/* Pending approval view */}
        {showPending ? (
          <div style={{ padding: 36, textAlign: 'center' }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(168,85,247,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
              <Clock size={30} color="#a855f7" />
            </div>
            <h4 style={{ margin: '0 0 6px', fontSize: '1.05rem' }}>Custom plan sent to Accounting</h4>
            <p style={{ color: '#64748b', fontSize: '0.85rem', maxWidth: 420, margin: '0 auto 8px' }}>
              The accountant will review this custom payment plan. Once approved, the client is emailed automatically and you can sign the contract.
            </p>
            {contract && <p style={{ color: '#94a3b8', fontSize: '0.78rem' }}>Contract {contract.contract_number}</p>}
            <button onClick={onDone} style={{ ...primaryBtn, margin: '18px auto 0' }}><CheckCircle size={16} /> Done</button>
          </div>
        ) : (
        <>
        {/* stepper */}
        <div style={{ display: 'flex', gap: 6, padding: '14px 24px', borderBottom: '1px solid #f1f5f9' }}>
          {STEPS.map((s, i) => (
            <div key={s} style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ height: 4, borderRadius: 4, background: i <= step ? '#003DA6' : '#e5e9f0', marginBottom: 6 }} />
              <span style={{ fontSize: '0.68rem', fontWeight: 700, color: i <= step ? '#003DA6' : '#94a3b8' }}>{s}</span>
            </div>
          ))}
        </div>

        <div style={{ padding: 24 }}>
          {/* Rejected banner */}
          {existing?.plan_approval_status === 'rejected' && step < 3 && (
            <div style={{ display: 'flex', gap: 10, background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 12, padding: '12px 14px', marginBottom: 16 }}>
              <AlertTriangle size={18} color="#ef4444" style={{ flexShrink: 0, marginTop: 2 }} />
              <div>
                <div style={{ fontWeight: 800, color: '#b91c1c', fontSize: '0.82rem' }}>Previous custom plan was rejected by Accounting</div>
                {existing.plan_approval_notes && <div style={{ color: '#7f1d1d', fontSize: '0.78rem', marginTop: 2 }}>Reason: {existing.plan_approval_notes}</div>}
                <div style={{ color: '#94a3b8', fontSize: '0.74rem', marginTop: 2 }}>Build a revised plan below and resubmit.</div>
              </div>
            </div>
          )}

          {/* Step 0: method */}
          {step === 0 && (
            <div>
              <h4 style={{ margin: '0 0 12px', fontSize: '0.95rem' }}>How will the client pay?</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
                {([['cash', 'Cash', Banknote, 'Full payment now'], ['installment', 'Standard Plan', CreditCard, 'Pre-set plan'], ['custom', 'Custom Plan', SlidersHorizontal, 'Tailored — needs approval']] as const).map(([m, label, Icon, desc]) => (
                  <button key={m} onClick={() => setMethod(m)} style={{ textAlign: 'left', padding: 16, borderRadius: 14, cursor: 'pointer',
                    border: method === m ? '2px solid #003DA6' : '1.5px solid #e5e9f0', background: method === m ? 'rgba(0,61,166,0.04)' : '#fff' }}>
                    <Icon size={20} color={method === m ? '#003DA6' : '#64748b'} />
                    <div style={{ fontWeight: 800, marginTop: 8, color: '#0f172a', fontSize: '0.88rem' }}>{label}</div>
                    <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{desc}</div>
                  </button>
                ))}
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
                <button onClick={() => setStep(method === 'cash' ? 2 : 1)} style={primaryBtn}>Next <ChevronRight size={15} /></button>
              </div>
            </div>
          )}

          {/* Step 1: plan (standard) OR custom builder */}
          {step === 1 && method === 'installment' && (
            <div>
              <h4 style={{ margin: '0 0 12px', fontSize: '0.95rem' }}>Choose an installment plan</h4>
              {plans.length === 0 ? (
                <p style={{ color: '#ef4444', fontSize: '0.85rem' }}>No payment plans configured for this project.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {plans.map(p => (
                    <button key={p.id} onClick={() => setPlanId(p.id)} style={{ textAlign: 'left', padding: 16, borderRadius: 12, cursor: 'pointer',
                      border: planId === p.id ? '2px solid #003DA6' : '1.5px solid #e5e9f0', background: planId === p.id ? 'rgba(0,61,166,0.04)' : '#fff' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontWeight: 800, color: '#0f172a' }}>{p.name}</span>
                        {planId === p.id && <CheckCircle size={18} color="#003DA6" />}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: 4 }}>
                        {Number(p.down_payment_pct)}% down · {p.installments} installments{Number(p.discount_pct) > 0 ? ` · ${Number(p.discount_pct)}% discount` : ''}
                      </div>
                    </button>
                  ))}
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 20 }}>
                <button onClick={() => setStep(0)} style={secondaryBtn}><ChevronLeft size={15} /> Back</button>
                <button onClick={() => setStep(2)} disabled={!planId} style={primaryBtn}>Next <ChevronRight size={15} /></button>
              </div>
            </div>
          )}

          {step >= 1 && method === 'custom' && (
            <CustomPlanBuilder price={price} eoiPaid={eoiPaid} busy={busy} onBack={() => setStep(0)} onSubmit={submitCustom} />
          )}

          {/* Step 2: review (cash / standard only) */}
          {step === 2 && method !== 'custom' && (
            <div>
              <h4 style={{ margin: '0 0 12px', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: 6 }}><Calculator size={16} /> Review schedule</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 14 }}>
                <Stat label="Unit price" value={fmt(price)} />
                <Stat label={method === 'cash' ? 'Payable now' : 'Down payment'} value={fmt(built.dp)} />
                <Stat label="EOI paid" value={fmt(eoiPaid)} />
                <Stat label="Plan total" value={fmt(scheduleTotal)} />
              </div>
              <div style={{ maxHeight: 230, overflow: 'auto', border: '1px solid #eef2f7', borderRadius: 12 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                  <thead><tr style={{ background: '#f8fafc', color: '#64748b', textAlign: 'left', position: 'sticky', top: 0 }}><th style={{ padding: '9px 14px' }}>#</th><th>Description</th><th>Due</th><th style={{ textAlign: 'right', paddingRight: 14 }}>Amount</th></tr></thead>
                  <tbody>
                    {built.schedule.map((s, i) => (
                      <tr key={i} style={{ borderTop: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '8px 14px', color: '#94a3b8' }}>{i + 1}</td>
                        <td style={{ fontWeight: 600 }}>{s.label}</td>
                        <td style={{ color: '#64748b' }}>{fmtDate(s.dueDate)}</td>
                        <td style={{ textAlign: 'right', paddingRight: 14, fontWeight: 700, color: '#003DA6' }}>{fmt(s.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 20 }}>
                <button onClick={() => setStep(method === 'cash' ? 0 : 1)} style={secondaryBtn}><ChevronLeft size={15} /> Back</button>
                <button onClick={generate} disabled={busy} style={primaryBtn}>{busy ? <Loader size={15} className="spin" /> : <FileText size={15} />} Generate Contract</button>
              </div>
            </div>
          )}

          {/* Step 3: sign */}
          {step === 3 && contract && (
            <div style={{ textAlign: 'center', padding: '10px 0' }}>
              {contract.plan_approval_status === 'approved' && (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(22,163,74,0.1)', color: '#16a34a', fontWeight: 800, fontSize: '0.74rem', padding: '5px 12px', borderRadius: 999, marginBottom: 10 }}>
                  <CheckCircle size={13} /> Custom plan approved by Accounting
                </div>
              )}
              <FileText size={42} color="#003DA6" />
              <h4 style={{ margin: '12px 0 4px' }}>Contract {contract.contract_number} ready</h4>
              <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: 22 }}>Confirm the client signed the contract to mark the unit as sold.</p>
              <button onClick={sign} disabled={busy} style={{ ...primaryBtn, margin: '0 auto' }}>{busy ? <Loader size={15} className="spin" /> : <ShieldCheck size={16} />} Sign Contract</button>
            </div>
          )}

          {/* Step 4: handover */}
          {step === 4 && contract && (
            <div style={{ textAlign: 'center', padding: '10px 0' }}>
              <CheckCircle size={42} color="#22c55e" />
              <h4 style={{ margin: '12px 0 4px' }}>Contract signed</h4>
              <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: 22 }}>
                {contract.accounting_handover_at ? 'This contract is already with Accounting.' : 'Hand the file over to Accounting to manage the payment schedule.'}
              </p>
              {contract.accounting_handover_at ? (
                <button onClick={onDone} style={{ ...primaryBtn, margin: '0 auto', background: '#16a34a' }}><CheckCircle size={16} /> Done</button>
              ) : (
                <button onClick={handover} disabled={busy} style={{ ...primaryBtn, margin: '0 auto' }}>{busy ? <Loader size={15} className="spin" /> : <ArrowRight size={16} />} Hand over to Accounting</button>
              )}
            </div>
          )}
        </div>
        </>
        )}
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════
   Reserve a unit for a client (from tele-sales OR broker)
   ═══════════════════════════════════════════════════════════════ */
interface LeadLite {
  id: string; first_name: string; last_name: string; email?: string; phone?: string;
  source?: string; broker_id?: string | null; current_tier?: string;
  broker?: { agency_name?: string; agent_name?: string } | null;
}

const ReserveForClientModal: React.FC<{
  unitId: string; unitNumber: string; projectName?: string; price?: number;
  notify: (m: string, t?: 'success' | 'error') => void;
  onClose: () => void; onReserved: () => void;
}> = ({ unitId, unitNumber, projectName, price, notify, onClose, onReserved }) => {
  const [search, setSearch] = useState('');
  const [leads, setLeads] = useState<LeadLite[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<LeadLite | null>(null);
  const [eoi, setEoi] = useState(50000);
  const [holding, setHolding] = useState(7);
  const [busy, setBusy] = useState(false);

  const load = async (q: string) => {
    setLoading(true);
    try {
      const res = await api.get('/sales/company/leads', { params: { bookable: 1, search: q, per_page: 15 } });
      setLeads(res.data?.data?.data || res.data?.data || []);
    } catch { /* ignore */ }
    setLoading(false);
  };
  useEffect(() => { load(''); }, []);

  const isBroker = (l: LeadLite) => !!l.broker_id || l.source === 'broker';

  const reserve = async () => {
    if (!selected) { notify('Select a client first', 'error'); return; }
    setBusy(true);
    try {
      const res = await api.post('/sales/company/bookings', { lead_id: selected.id, unit_id: unitId, eoi_amount: eoi, holding_days: holding });
      if (res.data?.success) onReserved();
      else notify(res.data?.message || 'Failed to reserve', 'error');
    } catch (e: any) { notify(e.response?.data?.message || 'Failed to reserve', 'error'); }
    setBusy(false);
  };

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 4200, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 18, width: 'min(560px,96vw)', maxHeight: '92vh', overflow: 'auto', boxShadow: '0 30px 80px rgba(0,0,0,0.3)' }}>
        <div style={{ padding: '18px 22px', borderBottom: '1px solid #eef2f7', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h3 style={{ margin: 0, fontWeight: 800, color: '#003DA6', fontSize: '1.05rem' }}>Reserve Unit {unitNumber}</h3>
            <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '0.8rem' }}>{projectName} {price ? `· ${fmt(price)}` : ''}</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}><X size={20} /></button>
        </div>
        <div style={{ padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, border: '1.5px solid #e5e9f0', borderRadius: 10, padding: '0 12px', marginBottom: 12 }}>
            <Search size={15} color="#94a3b8" />
            <input value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && load(search)}
              placeholder="Search client by name, phone, email…" style={{ border: 'none', outline: 'none', padding: '10px 0', flex: 1, fontSize: '0.85rem' }} />
            <button onClick={() => load(search)} style={{ background: 'none', border: 'none', color: '#003DA6', fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer' }}>Search</button>
          </div>

          <div style={{ maxHeight: 230, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
            {loading ? <div style={{ textAlign: 'center', padding: 20, color: '#94a3b8' }}><Loader size={20} className="spin" /></div>
              : leads.length === 0 ? <p style={{ color: '#94a3b8', fontSize: '0.82rem', textAlign: 'center', padding: 14 }}>No bookable clients found.</p>
              : leads.map(l => {
                const broker = isBroker(l);
                const active = selected?.id === l.id;
                return (
                  <div key={l.id} onClick={() => setSelected(l)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, padding: '10px 12px', borderRadius: 10, cursor: 'pointer', border: active ? '2px solid #003DA6' : '1px solid #e5e9f0', background: active ? 'rgba(0,61,166,0.04)' : '#fff' }}>
                    <div>
                      <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.86rem' }}>{l.first_name} {l.last_name}</div>
                      <div style={{ fontSize: '0.74rem', color: '#94a3b8' }}>{l.phone || l.email}</div>
                    </div>
                    <span style={{ fontSize: '0.66rem', fontWeight: 800, padding: '3px 9px', borderRadius: 999, display: 'flex', alignItems: 'center', gap: 4,
                      background: broker ? 'rgba(124,58,237,0.1)' : 'rgba(0,61,166,0.08)', color: broker ? '#7c3aed' : '#003DA6' }}>
                      {broker ? <><Users size={10} /> Broker{l.broker?.agency_name ? `: ${l.broker.agency_name}` : ''}</> : <><UserCheck size={10} /> Tele-sales</>}
                    </span>
                  </div>
                );
              })}
          </div>

          {selected && isBroker(selected) && (
            <div style={{ display: 'flex', gap: 8, background: 'rgba(124,58,237,0.06)', border: '1px solid rgba(124,58,237,0.2)', borderRadius: 10, padding: '10px 12px', marginBottom: 12, fontSize: '0.76rem', color: '#6d28d9' }}>
              <Users size={15} style={{ flexShrink: 0 }} /> Broker-sourced client — the broker’s commission will be registered automatically on reservation.
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
            <div>
              <label style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b', display: 'block', marginBottom: 4 }}>EOI / hold amount (EGP)</label>
              <input type="number" value={eoi} onChange={e => setEoi(parseFloat(e.target.value) || 0)} style={{ border: '1.5px solid #e5e9f0', borderRadius: 9, padding: '9px 11px', width: '100%', fontWeight: 700, boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b', display: 'block', marginBottom: 4 }}>Holding days</label>
              <input type="number" value={holding} onChange={e => setHolding(parseInt(e.target.value) || 1)} style={{ border: '1.5px solid #e5e9f0', borderRadius: 9, padding: '9px 11px', width: '100%', fontWeight: 700, boxSizing: 'border-box' }} />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <button onClick={onClose} style={{ background: '#fff', border: '1px solid #e5e9f0', borderRadius: 10, padding: '10px 18px', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer', color: '#64748b' }}>Cancel</button>
            <button onClick={reserve} disabled={busy || !selected} style={{ display: 'flex', alignItems: 'center', gap: 6, background: !selected ? '#e5e9f0' : 'linear-gradient(135deg,#22c55e,#16a34a)', color: !selected ? '#94a3b8' : '#fff', border: 'none', borderRadius: 10, padding: '10px 20px', fontWeight: 700, fontSize: '0.82rem', cursor: busy || !selected ? 'not-allowed' : 'pointer' }}>
              {busy ? <Loader size={15} className="spin" /> : <ShieldCheck size={15} />} Reserve for Client
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const Stat: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div style={{ background: '#f8fafc', borderRadius: 10, padding: '10px 12px' }}>
    <div style={{ fontSize: '0.64rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>{label}</div>
    <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.92rem' }}>{value}</div>
  </div>
);

const primaryBtn: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 6, background: 'linear-gradient(135deg,#003DA6,#001A70)', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 20px', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer' };
const secondaryBtn: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 6, background: '#fff', color: '#64748b', border: '1px solid #e5e9f0', borderRadius: 10, padding: '10px 18px', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer' };

export default CompanySalesFlow;
