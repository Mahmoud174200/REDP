import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import {
  ClipboardCheck, Loader, RefreshCw, CheckCircle, XCircle, User, Building2,
  Calculator, X, Banknote
} from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════
   Accountant — Custom Payment Plan Approvals
   Review custom installment plans submitted by Company Sales,
   then approve (emails the client) or reject (with a reason).
   ═══════════════════════════════════════════════════════════════ */

interface Payment { id: string; amount: number | string; due_date: string; installment_number: number; transaction_reference?: string | null; status: string; }
interface PendingContract {
  id: string; contract_number: string; total_amount: number | string; paid_amount: number | string; notes?: string;
  client?: { id: string; name: string; email: string; phone: string };
  unit?: { unit_number: string; price: number | string; project?: { name: string } };
  payment_plan?: { total_installments: number; monthly_amount: number | string } | null;
  payments?: Payment[];
}

const fmt = (n: number | string | null | undefined) => {
  const v = typeof n === 'string' ? parseFloat(n) : (n ?? 0);
  return new Intl.NumberFormat('en-EG', { style: 'currency', currency: 'EGP', maximumFractionDigits: 0 }).format(v || 0);
};
const fmtDate = (s?: string | null) => s ? new Date(s).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const PlanApprovals: React.FC = () => {
  const [items, setItems] = useState<PendingContract[]>([]);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState<PendingContract | null>(null);
  const [rejecting, setRejecting] = useState<PendingContract | null>(null);
  const [rejectNote, setRejectNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const notify = (msg: string, type: 'success' | 'error' = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3500); };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/finance/contracts/pending-plan-approval');
      if (res.data?.success) setItems(res.data.data || []);
    } catch { notify('Failed to load pending plans', 'error'); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const approve = async (c: PendingContract) => {
    setBusy(true);
    try {
      const res = await api.post(`/finance/contracts/${c.id}/approve-plan`);
      if (res.data?.success) { notify('Approved — client emailed'); setActive(null); load(); }
      else notify(res.data?.message || 'Failed', 'error');
    } catch (e: any) { notify(e.response?.data?.message || 'Failed to approve', 'error'); }
    setBusy(false);
  };

  const reject = async () => {
    if (!rejecting || !rejectNote.trim()) { notify('Rejection reason required', 'error'); return; }
    setBusy(true);
    try {
      const res = await api.post(`/finance/contracts/${rejecting.id}/reject-plan`, { notes: rejectNote });
      if (res.data?.success) { notify('Plan rejected'); setRejecting(null); setRejectNote(''); setActive(null); load(); }
      else notify(res.data?.message || 'Failed', 'error');
    } catch (e: any) { notify(e.response?.data?.message || 'Failed to reject', 'error'); }
    setBusy(false);
  };

  return (
    <div style={{ padding: 24, maxWidth: 1100, margin: '0 auto' }}>
      {toast && (
        <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 5000, background: toast.type === 'success' ? '#16a34a' : '#dc2626', color: '#fff', padding: '12px 20px', borderRadius: 12, fontWeight: 700, fontSize: '0.85rem' }}>{toast.msg}</div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 900, color: '#003DA6', display: 'flex', alignItems: 'center', gap: 10 }}>
            <ClipboardCheck size={26} /> Custom Plan Approvals
          </h1>
          <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '0.88rem' }}>Review custom payment plans submitted by Company Sales.</p>
        </div>
        <button onClick={load} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', fontSize: '0.8rem' }}><RefreshCw size={14} /> Refresh</button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8' }}><Loader size={28} className="spin" /></div>
      ) : items.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8', background: '#fff', borderRadius: 16, border: '1px dashed #e2e8f0' }}>
          <CheckCircle size={40} style={{ opacity: 0.4 }} />
          <p style={{ marginTop: 10, fontWeight: 600 }}>No custom plans awaiting approval.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {items.map(c => (
            <div key={c.id} style={{ background: '#fff', border: '1.5px solid #e8edf3', borderRadius: 16, padding: 18, display: 'grid', gridTemplateColumns: '1.3fr 1fr 1fr auto', gap: 16, alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 6 }}><User size={14} color="#94a3b8" /> {c.client?.name || '—'}</div>
                <div style={{ fontSize: '0.76rem', color: '#94a3b8' }}>{c.client?.email}</div>
                <div style={{ fontSize: '0.74rem', color: '#003DA6', fontWeight: 700, marginTop: 2 }}>{c.contract_number}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>Unit / Project</div>
                <div style={{ fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 5 }}><Building2 size={13} color="#94a3b8" /> {c.unit?.unit_number}</div>
                <div style={{ fontSize: '0.76rem', color: '#64748b' }}>{c.unit?.project?.name}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>Value</div>
                <div style={{ fontWeight: 800, color: '#003DA6' }}>{fmt(c.total_amount)}</div>
                <div style={{ fontSize: '0.74rem', color: '#64748b' }}>{c.payment_plan?.total_installments ?? c.payments?.filter(p => p.installment_number > 0).length ?? 0} installments</div>
              </div>
              <button onClick={() => setActive(c)} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'linear-gradient(135deg,#003DA6,#001A70)', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 18px', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer' }}>
                <Calculator size={15} /> Review
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Review modal */}
      {active && (
        <div onClick={() => setActive(null)} style={{ position: 'fixed', inset: 0, zIndex: 4000, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 20, width: 'min(720px,96vw)', maxHeight: '94vh', overflow: 'auto', boxShadow: '0 30px 80px rgba(0,0,0,0.3)' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #eef2f7', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h3 style={{ margin: 0, fontWeight: 800, color: '#003DA6' }}>{active.contract_number}</h3>
                <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '0.82rem' }}>{active.client?.name} · Unit {active.unit?.unit_number} · {active.unit?.project?.name}</p>
              </div>
              <button onClick={() => setActive(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}><X size={22} /></button>
            </div>
            <div style={{ padding: 24 }}>
              {active.notes && <div style={{ fontSize: '0.82rem', color: '#475569', background: '#f8fafc', borderRadius: 10, padding: '10px 14px', marginBottom: 14 }}>{active.notes}</div>}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 14 }}>
                <div style={{ background: '#f8fafc', borderRadius: 10, padding: '10px 12px' }}><div style={{ fontSize: '0.64rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>Unit price</div><div style={{ fontWeight: 800 }}>{fmt(active.unit?.price)}</div></div>
                <div style={{ background: '#f8fafc', borderRadius: 10, padding: '10px 12px' }}><div style={{ fontSize: '0.64rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>Paid today</div><div style={{ fontWeight: 800 }}>{fmt(active.paid_amount)}</div></div>
                <div style={{ background: '#f8fafc', borderRadius: 10, padding: '10px 12px' }}><div style={{ fontSize: '0.64rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>Installments</div><div style={{ fontWeight: 800 }}>{active.payment_plan?.total_installments ?? 0}</div></div>
              </div>
              <div style={{ maxHeight: 280, overflow: 'auto', border: '1px solid #eef2f7', borderRadius: 12 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                  <thead><tr style={{ background: '#f8fafc', color: '#64748b', textAlign: 'left', position: 'sticky', top: 0 }}><th style={{ padding: '9px 14px' }}>#</th><th>Description</th><th>Due</th><th style={{ textAlign: 'right', paddingRight: 14 }}>Amount</th></tr></thead>
                  <tbody>
                    {(active.payments || []).map((p, i) => (
                      <tr key={p.id} style={{ borderTop: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '8px 14px', color: '#94a3b8' }}>{i + 1}</td>
                        <td style={{ fontWeight: 600 }}>{p.transaction_reference || (p.installment_number === 0 ? 'Down Payment' : `Installment ${p.installment_number}`)}</td>
                        <td style={{ color: '#64748b' }}>{fmtDate(p.due_date)}</td>
                        <td style={{ textAlign: 'right', paddingRight: 14, fontWeight: 700, color: '#003DA6' }}>{fmt(p.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
                <button onClick={() => { setRejecting(active); setRejectNote(''); }} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#fff', border: '1.5px solid rgba(239,68,68,0.3)', color: '#dc2626', borderRadius: 10, padding: '10px 18px', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer' }}><XCircle size={15} /> Reject</button>
                <button onClick={() => approve(active)} disabled={busy} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'linear-gradient(135deg,#16a34a,#15803d)', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 20px', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer' }}>{busy ? <Loader size={15} className="spin" /> : <CheckCircle size={15} />} Approve & Email Client</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject reason modal */}
      {rejecting && (
        <div onClick={() => setRejecting(null)} style={{ position: 'fixed', inset: 0, zIndex: 4100, background: 'rgba(15,23,42,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 16, width: 'min(460px,96vw)', padding: 24 }}>
            <h3 style={{ margin: '0 0 6px', fontWeight: 800, color: '#dc2626' }}>Reject custom plan</h3>
            <p style={{ margin: '0 0 14px', color: '#64748b', fontSize: '0.82rem' }}>Explain why so Sales can revise the plan.</p>
            <textarea value={rejectNote} onChange={e => setRejectNote(e.target.value)} rows={4} placeholder="e.g. Down payment too low for this unit / installment period too long…"
              style={{ width: '100%', border: '1.5px solid #e5e9f0', borderRadius: 10, padding: 12, fontSize: '0.85rem', resize: 'vertical', boxSizing: 'border-box' }} />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
              <button onClick={() => setRejecting(null)} style={{ background: '#fff', border: '1px solid #e5e9f0', borderRadius: 10, padding: '9px 16px', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer', color: '#64748b' }}>Cancel</button>
              <button onClick={reject} disabled={busy} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#dc2626', color: '#fff', border: 'none', borderRadius: 10, padding: '9px 18px', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer' }}>{busy ? <Loader size={15} className="spin" /> : <XCircle size={15} />} Confirm Reject</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlanApprovals;
