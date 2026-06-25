import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import {
  Wallet, TrendingUp, TrendingDown, RefreshCw, Loader, Search, X, Building2,
  Banknote, Landmark, Users, ChevronRight, ChevronDown, FileText, Scale, Receipt
} from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════
   Accountant Financial Overview
   HAVE (collected) · OWED to us (receivables) · We OWE (payables)
   → per-project breakdown → per-client statement drill-down
   ═══════════════════════════════════════════════════════════════ */

const egp = (n: number | string | null | undefined) => {
  const v = typeof n === 'string' ? parseFloat(n) : (n ?? 0);
  return new Intl.NumberFormat('en-EG', { style: 'currency', currency: 'EGP', maximumFractionDigits: 0 }).format(v || 0);
};
const fmtDate = (s?: string | null) => s ? new Date(s).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const pct = (paid: number, total: number) => total > 0 ? Math.round((paid / total) * 100) : 0;

interface Overview {
  have: { collected: number; cash: number; bank: number };
  receivables: { total: number; overdue: number };
  payables: { broker_commissions: number; refunds: number; total: number };
  summary: { signed_contracts: number; cash_contracts: number; installment_contracts: number; net_position: number };
  projects: { project_id: string; project_name: string; sold_units: number; sold_value: number; contract_value: number; collected: number; outstanding: number; cash_contracts: number; installment_contracts: number }[];
}
interface ClientRow { client_id: string; name: string; email?: string; phone?: string; contracts: number; total: number; paid: number; remaining: number; }

const STATUS_COLOR: Record<string, string> = { paid: '#22c55e', partial: '#f59e0b', overdue: '#ef4444', upcoming: '#94a3b8' };

const FinanceOverview: React.FC = () => {
  const navigate = useNavigate();
  const [ov, setOv] = useState<Overview | null>(null);
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [expandedProject, setExpandedProject] = useState<string | null>(null);
  const [statementOf, setStatementOf] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [o, c] = await Promise.all([
        api.get('/finance/overview'),
        api.get('/finance/clients-ledger'),
      ]);
      if (o.data?.success) setOv(o.data.data);
      if (c.data?.success) setClients(c.data.data || []);
    } catch { /* ignore */ }
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  const searchClients = async () => {
    try {
      const c = await api.get('/finance/clients-ledger', { params: { search } });
      if (c.data?.success) setClients(c.data.data || []);
    } catch { /* ignore */ }
  };

  return (
    <div style={{ padding: 24, maxWidth: 1240, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.7rem', fontWeight: 900, color: '#003DA6', display: 'flex', alignItems: 'center', gap: 10 }}>
            <Scale size={26} /> Financial Overview
          </h1>
          <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '0.88rem' }}>What we have, what we’re owed, and what we owe — by project and by client.</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => navigate('/finance/ledger')} style={{ background: '#fff', border: '1px solid #e5e9f0', borderRadius: 10, padding: '8px 14px', fontSize: '0.78rem', color: '#64748b', cursor: 'pointer', fontWeight: 700 }}>
            Ledger & tools
          </button>
          <button onClick={load} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', fontSize: '0.8rem' }}>
            <RefreshCw size={14} /> Refresh
          </button>
        </div>
      </div>

      {loading || !ov ? (
        <div style={{ textAlign: 'center', padding: 80, color: '#94a3b8' }}><Loader size={30} className="spin" /></div>
      ) : (
        <>
          {/* ── 3 money pillars ── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 16, marginBottom: 14 }}>
            <Pillar title="What we HAVE" subtitle="Cash collected" value={ov.have.collected} color="#16a34a" icon={<Wallet size={22} />}
              rows={[['Cash desk', ov.have.cash, Banknote], ['Bank & gateways', ov.have.bank, Landmark]]} />
            <Pillar title="What we’re OWED" subtitle="Receivables on signed contracts" value={ov.receivables.total} color="#003DA6" icon={<TrendingUp size={22} />}
              rows={[['Overdue', ov.receivables.overdue, TrendingDown]]} rowColor={['#ef4444']} />
            <Pillar title="What we OWE" subtitle="Payables" value={ov.payables.total} color="#b45309" icon={<TrendingDown size={22} />}
              rows={[['Broker commissions', ov.payables.broker_commissions, Users], ['Client refunds', ov.payables.refunds, Receipt]]} />
          </div>

          {/* net position strip */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 26 }}>
            <Chip label="Signed contracts" value={String(ov.summary.signed_contracts)} />
            <Chip label="Cash deals" value={String(ov.summary.cash_contracts)} color="#16a34a" />
            <Chip label="Installment deals" value={String(ov.summary.installment_contracts)} color="#003DA6" />
            <Chip label="Net position (have + owed − owe)" value={egp(ov.summary.net_position)} color="#0f172a" wide />
          </div>

          {/* ── per-project ── */}
          <Section title="By Project" icon={<Building2 size={18} />}>
            <div style={{ background: '#fff', border: '1px solid #e8edf3', borderRadius: 14, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', color: '#64748b', textAlign: 'left' }}>
                    <th style={{ padding: '11px 16px' }}>Project</th><th>Sold units</th><th>Sold value</th>
                    <th>Collected</th><th>Outstanding</th><th>Cash / Installment</th>
                  </tr>
                </thead>
                <tbody>
                  {ov.projects.length === 0 ? (
                    <tr><td colSpan={6} style={{ padding: 24, textAlign: 'center', color: '#94a3b8' }}>No sales yet.</td></tr>
                  ) : ov.projects.map(p => (
                    <tr key={p.project_id} style={{ borderTop: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '12px 16px', fontWeight: 800, color: '#0f172a' }}>{p.project_name}</td>
                      <td style={{ fontWeight: 700 }}>{p.sold_units}</td>
                      <td style={{ fontWeight: 700, color: '#0f172a' }}>{egp(p.sold_value)}</td>
                      <td style={{ fontWeight: 700, color: '#16a34a' }}>{egp(p.collected)}</td>
                      <td style={{ fontWeight: 700, color: '#b45309' }}>{egp(p.outstanding)}</td>
                      <td>
                        <span style={{ display: 'inline-flex', gap: 6 }}>
                          <span style={{ background: 'rgba(34,197,94,0.1)', color: '#16a34a', fontWeight: 800, fontSize: '0.72rem', padding: '3px 9px', borderRadius: 999 }}>{p.cash_contracts} cash</span>
                          <span style={{ background: 'rgba(0,61,166,0.08)', color: '#003DA6', fontWeight: 800, fontSize: '0.72rem', padding: '3px 9px', borderRadius: 999 }}>{p.installment_contracts} inst.</span>
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>

          {/* ── per-client ── */}
          <Section title="By Client" icon={<Users size={18} />}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, border: '1.5px solid #e5e9f0', borderRadius: 10, padding: '0 12px', marginBottom: 12, maxWidth: 380, background: '#fff' }}>
              <Search size={15} color="#94a3b8" />
              <input value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && searchClients()}
                placeholder="Search client…" style={{ border: 'none', outline: 'none', padding: '10px 0', flex: 1, fontSize: '0.85rem' }} />
              <button onClick={searchClients} style={{ background: 'none', border: 'none', color: '#003DA6', fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer' }}>Search</button>
            </div>
            <div style={{ background: '#fff', border: '1px solid #e8edf3', borderRadius: 14, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', color: '#64748b', textAlign: 'left' }}>
                    <th style={{ padding: '11px 16px' }}>Client</th><th>Contracts</th><th>Total</th><th>Paid</th><th>Remaining</th><th>Progress</th><th></th>
                  </tr>
                </thead>
                <tbody>
                  {clients.length === 0 ? (
                    <tr><td colSpan={7} style={{ padding: 24, textAlign: 'center', color: '#94a3b8' }}>No clients with signed contracts.</td></tr>
                  ) : clients.map(c => {
                    const p = pct(c.paid, c.total);
                    return (
                      <tr key={c.client_id} style={{ borderTop: '1px solid #f1f5f9', cursor: 'pointer' }} onClick={() => setStatementOf(c.client_id)}>
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ fontWeight: 800, color: '#0f172a' }}>{c.name}</div>
                          <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{c.phone || c.email}</div>
                        </td>
                        <td style={{ fontWeight: 700 }}>{c.contracts}</td>
                        <td style={{ fontWeight: 700, color: '#0f172a' }}>{egp(c.total)}</td>
                        <td style={{ fontWeight: 700, color: '#16a34a' }}>{egp(c.paid)}</td>
                        <td style={{ fontWeight: 700, color: c.remaining > 0 ? '#b45309' : '#16a34a' }}>{egp(c.remaining)}</td>
                        <td style={{ width: 140 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ flex: 1, height: 7, background: '#eef2f7', borderRadius: 99, overflow: 'hidden' }}>
                              <div style={{ width: `${p}%`, height: '100%', background: p >= 100 ? '#22c55e' : '#003DA6' }} />
                            </div>
                            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b' }}>{p}%</span>
                          </div>
                        </td>
                        <td><ChevronRight size={16} color="#94a3b8" /></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Section>
        </>
      )}

      {statementOf && <StatementModal clientId={statementOf} onClose={() => setStatementOf(null)} />}
    </div>
  );
};

/* ── Statement drill-down ── */
const StatementModal: React.FC<{ clientId: string; onClose: () => void }> = ({ clientId, onClose }) => {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try { const r = await api.get(`/finance/clients/${clientId}/statement`); if (r.data?.success) { setData(r.data.data); setOpen(r.data.data.contracts?.[0]?.id ?? null); } }
      catch { /* ignore */ }
      setLoading(false);
    })();
  }, [clientId]);

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 4000, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 18, width: 'min(820px,97vw)', maxHeight: '92vh', overflow: 'auto', boxShadow: '0 30px 80px rgba(0,0,0,0.3)' }}>
        {loading || !data ? (
          <div style={{ padding: 60, textAlign: 'center', color: '#94a3b8' }}><Loader size={26} className="spin" /></div>
        ) : (
          <>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #eef2f7', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h3 style={{ margin: 0, fontWeight: 800, color: '#003DA6' }}>{data.client.name}</h3>
                <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '0.8rem' }}>{data.client.phone} · {data.client.email}</p>
              </div>
              <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}><X size={22} /></button>
            </div>
            <div style={{ padding: 24 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 16 }}>
                <Mini label="Contracts" value={String(data.totals.contracts)} />
                <Mini label="Paid" value={egp(data.totals.paid)} color="#16a34a" />
                <Mini label="Remaining" value={egp(data.totals.remaining)} color="#b45309" />
              </div>

              {data.contracts.map((c: any) => (
                <div key={c.id} style={{ border: '1px solid #e8edf3', borderRadius: 12, marginBottom: 10, overflow: 'hidden' }}>
                  <div onClick={() => setOpen(open === c.id ? null : c.id)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', cursor: 'pointer', background: '#f8fafc' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      {open === c.id ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                      <div>
                        <div style={{ fontWeight: 800, color: '#0f172a' }}>{c.contract_number} <span style={{ fontSize: '0.7rem', fontWeight: 700, color: c.type === 'cash' ? '#16a34a' : '#003DA6', background: c.type === 'cash' ? 'rgba(34,197,94,0.1)' : 'rgba(0,61,166,0.08)', padding: '2px 8px', borderRadius: 999, marginLeft: 6 }}>{c.type}{c.is_custom_plan ? ' · custom' : ''}</span></div>
                        <div style={{ fontSize: '0.74rem', color: '#94a3b8' }}>Unit {c.unit_number} · {c.project}</div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.85rem' }}>{egp(c.paid)} <span style={{ color: '#94a3b8', fontWeight: 600 }}>/ {egp(c.total)}</span></div>
                      <div style={{ fontSize: '0.72rem', color: c.remaining > 0 ? '#b45309' : '#16a34a', fontWeight: 700 }}>{c.remaining > 0 ? `${egp(c.remaining)} remaining` : 'Fully paid'}</div>
                    </div>
                  </div>
                  {open === c.id && (
                    <div style={{ maxHeight: 280, overflowY: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
                        <thead><tr style={{ background: '#fff', color: '#94a3b8', textAlign: 'left', position: 'sticky', top: 0 }}><th style={{ padding: '8px 16px' }}>#</th><th>Description</th><th>Due</th><th>Status</th><th style={{ textAlign: 'right', paddingRight: 16 }}>Amount</th></tr></thead>
                        <tbody>
                          {c.payments.map((p: any, i: number) => (
                            <tr key={i} style={{ borderTop: '1px solid #f3f6f9' }}>
                              <td style={{ padding: '7px 16px', color: '#94a3b8' }}>{p.installment_number === 0 ? '—' : p.installment_number}</td>
                              <td style={{ fontWeight: 600 }}>{p.label || (p.installment_number === 0 ? 'Down / EOI' : `Installment ${p.installment_number}`)}</td>
                              <td style={{ color: '#64748b' }}>{fmtDate(p.due_date)}</td>
                              <td><span style={{ color: STATUS_COLOR[p.status] || '#64748b', fontWeight: 700, textTransform: 'capitalize' }}>{p.status}</span></td>
                              <td style={{ textAlign: 'right', paddingRight: 16, fontWeight: 700, color: p.status === 'paid' ? '#16a34a' : '#0f172a' }}>{egp(p.amount)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

/* ── small components ── */
const Pillar: React.FC<{ title: string; subtitle: string; value: number; color: string; icon: React.ReactNode; rows: [string, number, React.FC<any>][]; rowColor?: string[] }> = ({ title, subtitle, value, color, icon, rows, rowColor }) => (
  <div style={{ background: '#fff', border: '1px solid #e8edf3', borderRadius: 18, padding: 22, boxShadow: '0 6px 20px rgba(15,23,42,0.04)' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
      <div style={{ width: 42, height: 42, borderRadius: 12, background: `${color}15`, color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{icon}</div>
      <div>
        <div style={{ fontSize: '0.74rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.03em' }}>{title}</div>
        <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{subtitle}</div>
      </div>
    </div>
    <div style={{ fontSize: '1.7rem', fontWeight: 900, color, marginBottom: 12 }}>{egp(value)}</div>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {rows.map(([label, val, Icon], i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.78rem' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#64748b' }}><Icon size={13} /> {label}</span>
          <span style={{ fontWeight: 800, color: rowColor?.[i] || '#0f172a' }}>{egp(val)}</span>
        </div>
      ))}
    </div>
  </div>
);
const Chip: React.FC<{ label: string; value: string; color?: string; wide?: boolean }> = ({ label, value, color = '#003DA6', wide }) => (
  <div style={{ background: '#fff', border: '1px solid #e8edf3', borderRadius: 12, padding: '10px 16px', flex: wide ? '1 1 280px' : '0 0 auto' }}>
    <div style={{ fontSize: '0.66rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>{label}</div>
    <div style={{ fontWeight: 900, color, fontSize: '1rem' }}>{value}</div>
  </div>
);
const Section: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode }> = ({ title, icon, children }) => (
  <div style={{ marginBottom: 28 }}>
    <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', margin: '0 0 12px' }}>{icon} {title}</h3>
    {children}
  </div>
);
const Mini: React.FC<{ label: string; value: string; color?: string }> = ({ label, value, color = '#0f172a' }) => (
  <div style={{ background: '#f8fafc', borderRadius: 10, padding: '10px 12px' }}>
    <div style={{ fontSize: '0.64rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>{label}</div>
    <div style={{ fontWeight: 800, color, fontSize: '0.95rem' }}>{value}</div>
  </div>
);

export default FinanceOverview;
