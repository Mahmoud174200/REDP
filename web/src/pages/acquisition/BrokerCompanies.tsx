import React, { useEffect, useState } from 'react';
import {
  Building2, CheckCircle2, XCircle, Clock, Ban, ShieldCheck, Eye, FileText,
  Users, Loader2, Check, X, Plus, Trash2, Send, RefreshCw,
} from 'lucide-react';
import api from '../../services/api';

const C = { primary: '#003DA6', primaryDark: '#00205b', bg: '#f8fafc', card: '#fff', border: 'rgba(0,61,166,.10)', text: '#0f172a', muted: '#64748b', green: '#059669', amber: '#d97706', red: '#dc2626', purple: '#7c3aed' };

const STATUS_META: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: 'Pending', color: C.amber, icon: Clock },
  active: { label: 'Active', color: C.green, icon: CheckCircle2 },
  rejected: { label: 'Rejected', color: C.red, icon: XCircle },
  suspended: { label: 'Suspended', color: C.muted, icon: Ban },
};

const fmtMoney = (n: number) => new Intl.NumberFormat('en-EG', { maximumFractionDigits: 0 }).format(n || 0) + ' EGP';

const BrokerCompanies: React.FC = () => {
  const [filter, setFilter] = useState<'pending' | 'active' | 'rejected' | 'suspended' | ''>('pending');
  const [companies, setCompanies] = useState<any[]>([]);
  const [counts, setCounts] = useState<any>({});
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<any>(null);
  const [allProjects, setAllProjects] = useState<any[]>([]);

  const load = async () => {
    setLoading(true);
    try {
      const [list, reqs] = await Promise.all([
        api.get(`/v1/acquisition/broker-companies${filter ? `?status=${filter}` : ''}`),
        api.get('/v1/acquisition/broker-companies/project-requests'),
      ]);
      setCompanies(list.data.data || []);
      setCounts(list.data.counts || {});
      setRequests(reqs.data.data || []);
    } catch { /* handled by interceptor */ } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [filter]);
  useEffect(() => {
    api.get('/v1/public/projects').then(r => setAllProjects(r.data?.data || r.data?.projects || r.data || [])).catch(() => {});
  }, []);

  const act = async (id: string, action: string, body: any = {}) => {
    try {
      await api.post(`/v1/acquisition/broker-companies/${id}/${action}`, body);
      await load();
      if (detail?.data?.id === id) openDetail(id);
    } catch (e: any) { alert(e.response?.data?.message || 'Action failed.'); }
  };

  const approve = (id: string) => act(id, 'approve');
  const reject = (id: string) => { const reason = prompt('Rejection reason (optional):') ?? ''; act(id, 'reject', { reason }); };
  const suspend = (id: string, suspended: boolean) => act(id, 'suspend', { suspended });

  const openDetail = async (id: string) => {
    try { const res = await api.get(`/v1/acquisition/broker-companies/${id}`); setDetail(res.data); } catch { /* */ }
  };

  const respondRequest = async (companyId: string, projectId: string, decision: 'approve' | 'reject') => {
    try { await api.post(`/v1/acquisition/broker-companies/${companyId}/projects/${projectId}/respond`, { decision }); load(); }
    catch (e: any) { alert(e.response?.data?.message || 'Failed.'); }
  };

  const filterTabs: { key: typeof filter; label: string }[] = [
    { key: 'pending', label: `Pending (${counts.pending ?? 0})` },
    { key: 'active', label: `Active (${counts.active ?? 0})` },
    { key: 'suspended', label: `Suspended (${counts.suspended ?? 0})` },
    { key: 'rejected', label: `Rejected (${counts.rejected ?? 0})` },
    { key: '', label: 'All' },
  ];

  return (
    <div style={{ padding: '4px 8px 40px', fontFamily: 'var(--font-body)', color: C.text }}>
      <style>{`.spin{animation:spin 1s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}
        .bc-btn{display:inline-flex;align-items:center;gap:6px;border:none;border-radius:9px;padding:7px 13px;font-weight:700;font-size:.76rem;cursor:pointer;transition:all .15s}
        .bc-approve{background:rgba(5,150,105,.1);color:${C.green}} .bc-approve:hover{background:${C.green};color:#fff}
        .bc-reject{background:rgba(220,38,38,.08);color:${C.red}} .bc-reject:hover{background:${C.red};color:#fff}
        .bc-ghost{background:#fff;border:1px solid ${C.border};color:${C.primary}} .bc-ghost:hover{background:rgba(0,61,166,.04)}
        .bc-card{background:${C.card};border:1px solid ${C.border};border-radius:16px}
        .bc-th{text-align:left;font-size:.62rem;text-transform:uppercase;letter-spacing:.06em;color:${C.muted};font-weight:800;padding:11px 14px}
        .bc-td{padding:14px;font-size:.83rem;border-top:1px solid ${C.border};vertical-align:middle}
      `}</style>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
        <div style={{ width: 42, height: 42, borderRadius: 12, background: `linear-gradient(135deg,${C.primary},${C.primaryDark})`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Building2 style={{ width: 22, height: 22, color: '#fff' }} />
        </div>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: '1.3rem', fontWeight: 800, margin: 0, fontFamily: 'var(--font-title)' }}>Broker Agencies</h1>
          <p style={{ margin: 0, fontSize: '.78rem', color: C.muted }}>Vet applications, manage partner agencies & assign projects</p>
        </div>
        <button className="bc-btn bc-ghost" onClick={load}><RefreshCw style={{ width: 14, height: 14 }} /> Refresh</button>
      </div>

      {/* Pending project requests */}
      {requests.length > 0 && (
        <div className="bc-card" style={{ padding: 16, marginBottom: 18, borderLeft: `4px solid ${C.amber}` }}>
          <h3 style={{ margin: '0 0 12px', fontSize: '.9rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 7 }}>
            <Clock style={{ width: 16, height: 16, color: C.amber }} /> Project Access Requests ({requests.length})
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {requests.map(r => (
              <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, padding: '10px 12px', background: C.bg, borderRadius: 10 }}>
                <div style={{ fontSize: '.82rem' }}>
                  <b>{r.company?.name}</b> requests <b>{r.project?.name}</b> <span style={{ color: C.muted }}>· {r.project?.location}</span>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="bc-btn bc-approve" onClick={() => respondRequest(r.company_id, r.project_id, 'approve')}><Check style={{ width: 13, height: 13 }} /> Approve</button>
                  <button className="bc-btn bc-reject" onClick={() => respondRequest(r.company_id, r.project_id, 'reject')}><X style={{ width: 13, height: 13 }} /> Reject</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
        {filterTabs.map(t => (
          <button key={t.key} onClick={() => setFilter(t.key)} style={{
            padding: '8px 14px', border: `1px solid ${filter === t.key ? C.primary : C.border}`, borderRadius: 20, cursor: 'pointer',
            background: filter === t.key ? C.primary : '#fff', color: filter === t.key ? '#fff' : C.muted, fontWeight: 700, fontSize: '.78rem',
          }}>{t.label}</button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div style={{ padding: 40, display: 'flex', gap: 10, alignItems: 'center', color: C.muted }}><Loader2 className="spin" style={{ width: 18, height: 18 }} /> Loading…</div>
      ) : (
        <div className="bc-card" style={{ overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr>
                <th className="bc-th">Agency</th><th className="bc-th">Owner</th><th className="bc-th">Team</th>
                <th className="bc-th">Projects</th><th className="bc-th">Status</th><th className="bc-th" style={{ textAlign: 'right' }}>Actions</th>
              </tr></thead>
              <tbody>
                {companies.map(c => {
                  const sm = STATUS_META[c.approval_status] || STATUS_META.pending;
                  return (
                    <tr key={c.id}>
                      <td className="bc-td">
                        <div style={{ fontWeight: 700 }}>{c.name}</div>
                        <div style={{ fontSize: '.72rem', color: C.muted }}>{c.license_no || c.phone}</div>
                      </td>
                      <td className="bc-td">
                        {c.owner ? (<><div>{c.owner.name}</div><div style={{ fontSize: '.72rem', color: C.muted }}>{c.owner.email}</div></>) : '—'}
                      </td>
                      <td className="bc-td">{c.employee_count} </td>
                      <td className="bc-td">
                        {c.assigned_project_count}
                        {c.pending_request_count > 0 && <span style={{ color: C.amber, fontWeight: 700 }}> (+{c.pending_request_count} req)</span>}
                      </td>
                      <td className="bc-td">
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: '.7rem', fontWeight: 700, color: sm.color, background: `${sm.color}18`, padding: '4px 9px', borderRadius: 12 }}>
                          <sm.icon style={{ width: 12, height: 12 }} /> {sm.label}
                        </span>
                      </td>
                      <td className="bc-td" style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'inline-flex', gap: 6, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                          <button className="bc-btn bc-ghost" onClick={() => openDetail(c.id)}><Eye style={{ width: 13, height: 13 }} /> View</button>
                          {c.approval_status === 'pending' && <>
                            <button className="bc-btn bc-approve" onClick={() => approve(c.id)}><Check style={{ width: 13, height: 13 }} /> Approve</button>
                            <button className="bc-btn bc-reject" onClick={() => reject(c.id)}><X style={{ width: 13, height: 13 }} /> Reject</button>
                          </>}
                          {c.approval_status === 'active' && <button className="bc-btn bc-reject" onClick={() => suspend(c.id, true)}><Ban style={{ width: 13, height: 13 }} /> Suspend</button>}
                          {c.approval_status === 'suspended' && <button className="bc-btn bc-approve" onClick={() => suspend(c.id, false)}><ShieldCheck style={{ width: 13, height: 13 }} /> Reactivate</button>}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {companies.length === 0 && <tr><td className="bc-td" colSpan={6} style={{ textAlign: 'center', color: C.muted }}>No agencies found.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {detail && (
        <DetailModal
          detail={detail}
          allProjects={allProjects}
          onClose={() => setDetail(null)}
          onApprove={() => approve(detail.data.id)}
          onReject={() => reject(detail.data.id)}
          onSuspend={(s) => suspend(detail.data.id, s)}
          onAssign={async (ids) => { await act(detail.data.id, 'projects', { project_ids: ids }); }}
          onRemoveProject={async (pid) => { try { await api.delete(`/v1/acquisition/broker-companies/${detail.data.id}/projects/${pid}`); openDetail(detail.data.id); load(); } catch { /* */ } }}
        />
      )}
    </div>
  );
};

const DetailModal: React.FC<{ detail: any; allProjects: any[]; onClose: () => void; onApprove: () => void; onReject: () => void; onSuspend: (s: boolean) => void; onAssign: (ids: string[]) => void; onRemoveProject: (pid: string) => void }> = ({ detail, allProjects, onClose, onApprove, onReject, onSuspend, onAssign, onRemoveProject }) => {
  const d = detail.data;
  const sm = STATUS_META[d.approval_status] || STATUS_META.pending;
  const [selected, setSelected] = useState<string[]>([]);
  const linkedIds = new Set((d.projects || []).map((p: any) => p.project_id));
  const assignable = allProjects.filter((p: any) => !linkedIds.has(p.id));
  const toggle = (id: string) => setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);

  const docLink = (label: string, url?: string) => url ? (
    <a href={url.startsWith('http') ? url : `${url}`} target="_blank" rel="noreferrer" className="bc-btn bc-ghost" style={{ textDecoration: 'none' }}>
      <FileText style={{ width: 13, height: 13 }} /> {label}
    </a>
  ) : <span style={{ fontSize: '.76rem', color: C.muted }}>{label}: not uploaded</span>;

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,.45)', backdropFilter: 'blur(3px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 18, width: '100%', maxWidth: 720, maxHeight: '92vh', overflow: 'auto', boxShadow: '0 20px 60px rgba(0,15,61,.25)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 22px', borderBottom: `1px solid ${C.border}`, position: 'sticky', top: 0, background: '#fff', zIndex: 2 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>{d.name}</h3>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: '.7rem', fontWeight: 700, color: sm.color, marginTop: 4 }}><sm.icon style={{ width: 12, height: 12 }} /> {sm.label}</span>
          </div>
          <button onClick={onClose} className="bc-btn bc-ghost" style={{ padding: 7 }}><X style={{ width: 15, height: 15 }} /></button>
        </div>

        <div style={{ padding: 22 }}>
          {/* Info grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 12, marginBottom: 18, fontSize: '.82rem' }}>
            {[['Legal name', d.legal_name], ['Commercial reg.', d.registration_number], ['Tax ID', d.tax_id], ['License', d.license_no], ['Phone', d.phone], ['Email', d.email], ['City', d.city], ['Bank', d.bank_name], ['IBAN', d.bank_iban]].filter(([, v]) => v).map(([l, v]) => (
              <div key={l as string}><div style={{ fontSize: '.64rem', textTransform: 'uppercase', color: C.muted, fontWeight: 800 }}>{l}</div><div>{v as string}</div></div>
            ))}
          </div>
          {d.rejection_reason && <div style={{ background: 'rgba(220,38,38,.06)', color: C.red, padding: '8px 12px', borderRadius: 8, fontSize: '.78rem', marginBottom: 16 }}>Rejection reason: {d.rejection_reason}</div>}

          {/* Documents */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
            {docLink('Tax Card', d.tax_card_path)}
            {docLink('Commercial Registry', d.commercial_registry_path)}
          </div>

          {/* Commission rates */}
          {d.commission_rates && (
            <div style={{ background: C.bg, borderRadius: 12, padding: 14, marginBottom: 20, display: 'flex', gap: 18, flexWrap: 'wrap', fontSize: '.8rem' }}>
              <span><b>Developer:</b> {d.commission_rates.developer_brokerage_rate}%</span>
              <span><b>Owner:</b> {d.commission_rates.owner_commission_rate}%</span>
              <span><b>Leader:</b> {d.commission_rates.leader_commission_rate}%</span>
              <span><b>Agent:</b> {d.commission_rates.agent_commission_rate}%</span>
            </div>
          )}

          {/* Employees */}
          <h4 style={{ fontSize: '.78rem', textTransform: 'uppercase', color: C.muted, letterSpacing: '.05em', display: 'flex', alignItems: 'center', gap: 6 }}><Users style={{ width: 14, height: 14 }} /> Employees ({(d.employees || []).length})</h4>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 20 }}>
            {(d.employees || []).map((e: any) => (
              <span key={e.id} style={{ fontSize: '.74rem', background: 'rgba(0,61,166,.06)', color: C.primary, padding: '4px 10px', borderRadius: 12, fontWeight: 600 }}>
                {e.name} <span style={{ color: C.muted }}>· {e.employeeHierarchy?.position?.title || 'Broker'}</span>
              </span>
            ))}
            {(!d.employees || d.employees.length === 0) && <span style={{ fontSize: '.78rem', color: C.muted }}>None yet.</span>}
          </div>

          {/* Assigned projects */}
          <h4 style={{ fontSize: '.78rem', textTransform: 'uppercase', color: C.muted, letterSpacing: '.05em', display: 'flex', alignItems: 'center', gap: 6 }}><Building2 style={{ width: 14, height: 14 }} /> Projects</h4>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
            {(d.projects || []).map((p: any) => (
              <span key={p.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '.74rem', background: p.status === 'approved' ? 'rgba(5,150,105,.1)' : p.status === 'requested' ? 'rgba(217,119,6,.1)' : 'rgba(220,38,38,.08)', color: p.status === 'approved' ? C.green : p.status === 'requested' ? C.amber : C.red, padding: '4px 10px', borderRadius: 12, fontWeight: 600 }}>
                {p.project?.name} · {p.status}
                <button onClick={() => onRemoveProject(p.project_id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', display: 'inline-flex', padding: 0 }}><Trash2 style={{ width: 12, height: 12 }} /></button>
              </span>
            ))}
            {(!d.projects || d.projects.length === 0) && <span style={{ fontSize: '.78rem', color: C.muted }}>No projects assigned.</span>}
          </div>

          {/* Assign new */}
          {assignable.length > 0 && (
            <div style={{ background: C.bg, borderRadius: 12, padding: 14, marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <span style={{ fontSize: '.8rem', fontWeight: 700 }}>Assign projects to this agency</span>
                <button className="bc-btn bc-approve" disabled={!selected.length} style={{ opacity: selected.length ? 1 : .5 }} onClick={() => { onAssign(selected); setSelected([]); }}><Plus style={{ width: 13, height: 13 }} /> Assign {selected.length || ''}</button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(190px,1fr))', gap: 8, maxHeight: 200, overflow: 'auto' }}>
                {assignable.map((p: any) => (
                  <label key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', border: `1px solid ${selected.includes(p.id) ? C.primary : C.border}`, borderRadius: 9, cursor: 'pointer', background: '#fff', fontSize: '.78rem' }}>
                    <input type="checkbox" checked={selected.includes(p.id)} onChange={() => toggle(p.id)} />
                    {p.name}
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', borderTop: `1px solid ${C.border}`, paddingTop: 16 }}>
            {d.approval_status === 'pending' && <>
              <button className="bc-btn bc-reject" onClick={onReject}><X style={{ width: 14, height: 14 }} /> Reject</button>
              <button className="bc-btn bc-approve" onClick={onApprove}><Check style={{ width: 14, height: 14 }} /> Approve Agency</button>
            </>}
            {d.approval_status === 'active' && <button className="bc-btn bc-reject" onClick={() => onSuspend(true)}><Ban style={{ width: 14, height: 14 }} /> Suspend</button>}
            {d.approval_status === 'suspended' && <button className="bc-btn bc-approve" onClick={() => onSuspend(false)}><ShieldCheck style={{ width: 14, height: 14 }} /> Reactivate</button>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BrokerCompanies;
