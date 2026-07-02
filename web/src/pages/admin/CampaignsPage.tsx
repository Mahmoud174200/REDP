import React, { useState, useEffect } from 'react';
import { Bell, Mail, MessageCircle, Phone, Users, Filter, Send, Eye, CheckCircle, AlertTriangle } from 'lucide-react';
import api from '../../services/api';

interface ProjectOpt { id: string; name: string; status: string; }

const CHANNEL_META: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  email:    { label: 'Email',    icon: <Mail size={16} />,          color: '#3b82f6' },
  sms:      { label: 'SMS',      icon: <Phone size={16} />,         color: '#f59e0b' },
  whatsapp: { label: 'WhatsApp', icon: <MessageCircle size={16} />, color: '#10b981' },
};

const CampaignsPage: React.FC = () => {
  const [projects, setProjects] = useState<ProjectOpt[]>([]);
  const [statuses, setStatuses] = useState<string[]>([]);
  const [sources, setSources] = useState<string[]>([]);

  // filters
  const [audience, setAudience] = useState<'both' | 'leads' | 'clients'>('both');
  const [selStatuses, setSelStatuses] = useState<string[]>([]);
  const [selSources, setSelSources] = useState<string[]>([]);
  const [interestedProject, setInterestedProject] = useState('');
  const [ownsProject, setOwnsProject] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [budgetMin, setBudgetMin] = useState('');
  const [budgetMax, setBudgetMax] = useState('');

  // message
  const [channels, setChannels] = useState<string[]>(['email', 'whatsapp']);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');

  // preview / result
  const [preview, setPreview] = useState<any>(null);
  const [previewing, setPreviewing] = useState(false);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    api.get('/admin/campaigns/filter-options').then(r => {
      if (r.data?.success) {
        setProjects(r.data.projects || []);
        setStatuses(r.data.statuses || []);
        setSources(r.data.sources || []);
      }
    }).catch(() => {});
  }, []);

  const buildFilters = () => {
    const f: any = { audience };
    if (selStatuses.length) f.status = selStatuses;
    if (selSources.length) f.source = selSources;
    if (interestedProject) f.interested_project_id = interestedProject;
    if (ownsProject) f.owns_project_id = ownsProject;
    if (paymentMethod) f.payment_method = paymentMethod;
    if (budgetMin) f.budget_min = parseFloat(budgetMin);
    if (budgetMax) f.budget_max = parseFloat(budgetMax);
    return f;
  };

  const toggle = (arr: string[], v: string, setter: (x: string[]) => void) =>
    setter(arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v]);

  const runPreview = async () => {
    setPreviewing(true); setError(''); setResult(null);
    try {
      const r = await api.post('/admin/campaigns/preview', buildFilters());
      if (r.data?.success) setPreview(r.data);
    } catch (e: any) {
      setError(e.response?.data?.message || 'Preview failed.');
    } finally { setPreviewing(false); }
  };

  // auto-preview whenever filters change
  useEffect(() => { runPreview(); /* eslint-disable-next-line */ }, [audience, selStatuses, selSources, interestedProject, ownsProject, paymentMethod, budgetMin, budgetMax]);

  const fillTemplate = (projId: string) => {
    const p = projects.find(x => x.id === projId);
    if (!p) return;
    setTitle(`🎉 New Launch at ${p.name}`);
    setMessage(`Great news! New units have just been released at ${p.name}. Prime locations are limited and selling fast — hurry and reserve yours today before they're gone!\n\nأخبار رائعة! تم طرح وحدات جديدة في ${p.name}. الوحدات المميزة محدودة وتنفد بسرعة — سارع بالحجز الآن قبل نفادها!\n\nCall us now to reserve. / اتصل بنا الآن للحجز.`);
  };

  const doSend = async () => {
    setSending(true); setError(''); setConfirmOpen(false);
    try {
      const r = await api.post('/admin/campaigns/send', { ...buildFilters(), channels, title, message });
      if (r.data?.success) setResult(r.data);
      else setError(r.data?.message || 'Send failed.');
    } catch (e: any) {
      setError(e.response?.data?.message || 'Send failed.');
    } finally { setSending(false); }
  };

  const canSend = title.trim() && message.trim() && channels.length > 0 && (preview?.total ?? 0) > 0;

  const chip = (active: boolean, color = '#3b82f6') => ({
    padding: '6px 12px', borderRadius: '20px', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer',
    border: `1px solid ${active ? color : 'rgba(255,255,255,0.12)'}`,
    background: active ? `${color}1f` : 'transparent',
    color: active ? color : 'var(--text-muted)', textTransform: 'capitalize' as const,
    transition: 'all 0.2s ease',
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div className="glass-panel" style={{ padding: '26px 30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Bell size={26} style={{ color: 'var(--color-primary)' }} /> Marketing Campaigns
          </h1>
          <p style={{ margin: '6px 0 0', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
            Filter your customer base and broadcast an announcement across Email, SMS &amp; WhatsApp — الحملات التسويقية
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: '20px', alignItems: 'start' }}>
        {/* ── LEFT: Filters ── */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: '0 0 18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Filter size={18} style={{ color: 'var(--color-primary)' }} /> Audience Filters (فلترة العملاء)
          </h3>

          {/* Audience */}
          <div style={{ marginBottom: '18px' }}>
            <label style={labelStyle}>Audience</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              {(['both', 'leads', 'clients'] as const).map(a => (
                <button key={a} onClick={() => setAudience(a)} style={chip(audience === a)}>
                  {a === 'both' ? 'Leads + Clients' : a}
                </button>
              ))}
            </div>
          </div>

          {/* Lead status */}
          {audience !== 'clients' && (
            <div style={{ marginBottom: '18px' }}>
              <label style={labelStyle}>Lead Status (حالة العميل المحتمل)</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {statuses.map(s => (
                  <button key={s} onClick={() => toggle(selStatuses, s, setSelStatuses)} style={chip(selStatuses.includes(s), '#8b5cf6')}>
                    {s.replace(/_/g, ' ')}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Lead source */}
          {audience !== 'clients' && (
            <div style={{ marginBottom: '18px' }}>
              <label style={labelStyle}>Lead Source (مصدر العميل)</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {sources.map(s => (
                  <button key={s} onClick={() => toggle(selSources, s, setSelSources)} style={chip(selSources.includes(s), '#f59e0b')}>
                    {s.replace(/_/g, ' ')}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Interested project (leads) */}
          {audience !== 'clients' && (
            <div style={{ marginBottom: '18px' }}>
              <label style={labelStyle}>Interested in Project (مهتم بمشروع)</label>
              <select className="form-control" value={interestedProject} onChange={e => setInterestedProject(e.target.value)}>
                <option value="">— Any —</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          )}

          {/* Owns project (clients) */}
          {audience !== 'leads' && (
            <div style={{ marginBottom: '18px' }}>
              <label style={labelStyle}>Client Owns Unit In (عميل يملك بمشروع)</label>
              <select className="form-control" value={ownsProject} onChange={e => setOwnsProject(e.target.value)}>
                <option value="">— Any —</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          )}

          {/* Payment method + budget (leads) */}
          {audience !== 'clients' && (
            <div style={{ display: 'flex', gap: '12px', marginBottom: '4px' }}>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Payment Pref.</label>
                <select className="form-control" value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}>
                  <option value="">Any</option>
                  <option value="cash">Cash</option>
                  <option value="installment">Installment</option>
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Budget min</label>
                <input className="form-control" type="number" value={budgetMin} onChange={e => setBudgetMin(e.target.value)} placeholder="0" />
              </div>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Budget max</label>
                <input className="form-control" type="number" value={budgetMax} onChange={e => setBudgetMax(e.target.value)} placeholder="∞" />
              </div>
            </div>
          )}

          {/* Preview result */}
          <div style={{ marginTop: '20px', padding: '16px', borderRadius: '12px', background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.15)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Users size={20} style={{ color: 'var(--color-primary)' }} />
              <div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, lineHeight: 1 }}>
                  {previewing ? '…' : (preview?.total ?? 0)}
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginLeft: '8px' }}>recipients match</span>
                </div>
                {preview && (
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    📧 {preview.reachable_email} reachable by email · 📱 {preview.reachable_phone} by phone
                  </div>
                )}
              </div>
            </div>
            {preview?.sample?.length > 0 && (
              <div style={{ marginTop: '12px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {preview.sample.map((s: any, i: number) => (
                  <span key={i} style={{ fontSize: '0.68rem', padding: '3px 8px', borderRadius: '6px', background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)' }}>
                    {s.name || 'Unnamed'} · {s.type}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT: Message + Send ── */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: '0 0 18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Send size={18} style={{ color: 'var(--color-success)' }} /> Compose Broadcast (نص الرسالة)
          </h3>

          {/* Channels */}
          <label style={labelStyle}>Send Via (طرق الإرسال)</label>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '18px' }}>
            {Object.entries(CHANNEL_META).map(([key, m]) => {
              const active = channels.includes(key);
              return (
                <button key={key} onClick={() => toggle(channels, key, setChannels)} style={{
                  flex: 1, padding: '12px', borderRadius: '12px', cursor: 'pointer',
                  border: `1.5px solid ${active ? m.color : 'rgba(255,255,255,0.12)'}`,
                  background: active ? `${m.color}1a` : 'transparent',
                  color: active ? m.color : 'var(--text-muted)', fontWeight: 700, fontSize: '0.82rem',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', transition: 'all 0.2s ease',
                }}>
                  {m.icon}{m.label}
                  {active && <CheckCircle size={12} />}
                </button>
              );
            })}
          </div>

          {/* Quick template from project */}
          <label style={labelStyle}>Quick Template — announce a project (قالب سريع لمشروع)</label>
          <select className="form-control" style={{ marginBottom: '16px' }} defaultValue="" onChange={e => { fillTemplate(e.target.value); e.target.value = ''; }}>
            <option value="">— Insert "hurry & reserve" message for… —</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>

          <label style={labelStyle}>Title / Subject (العنوان)</label>
          <input className="form-control" style={{ marginBottom: '14px' }} value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. New Launch at Patio" />

          <label style={labelStyle}>Message (نص الرسالة)</label>
          <textarea className="form-control" style={{ height: '160px', resize: 'vertical', marginBottom: '16px' }} value={message} onChange={e => setMessage(e.target.value)} placeholder="Write your announcement… اكتب رسالتك هنا" />

          {error && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ef4444', fontSize: '0.82rem', fontWeight: 600, marginBottom: '12px' }}>
              <AlertTriangle size={15} /> {error}
            </div>
          )}

          {result ? (
            <div style={{ padding: '16px', borderRadius: '12px', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10b981', fontWeight: 800, marginBottom: '8px' }}>
                <CheckCircle size={18} /> Campaign sent!
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-main)' }}>
                Reached <strong>{result.recipients}</strong> recipient(s) · <strong>{result.total_sent}</strong> message(s) dispatched
                {result.failed > 0 && <span style={{ color: '#ef4444' }}> · {result.failed} failed</span>}
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                {Object.entries(result.sent || {}).map(([ch, n]: any) => n > 0 && (
                  <span key={ch} style={{ fontSize: '0.72rem', fontWeight: 700, color: CHANNEL_META[ch]?.color }}>
                    {CHANNEL_META[ch]?.label}: {n}
                  </span>
                ))}
              </div>
              <button className="btn-secondary" style={{ marginTop: '12px', padding: '8px 16px', fontSize: '0.8rem' }} onClick={() => { setResult(null); setTitle(''); setMessage(''); }}>
                New Campaign
              </button>
            </div>
          ) : (
            <button className="btn-primary" disabled={!canSend || sending} onClick={() => setConfirmOpen(true)}
              style={{ width: '100%', justifyContent: 'center', padding: '14px', opacity: canSend && !sending ? 1 : 0.5 }}>
              <Send size={16} style={{ marginRight: '8px' }} />
              {sending ? 'Sending…' : `Send to ${preview?.total ?? 0} recipient(s)`}
            </button>
          )}
        </div>
      </div>

      {/* Confirm modal */}
      {confirmOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)', zIndex: 9000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setConfirmOpen(false)}>
          <div className="glass-panel" style={{ maxWidth: 440, width: '100%', padding: 28 }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontWeight: 800, fontSize: '1.15rem', margin: '0 0 10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertTriangle size={20} style={{ color: 'var(--color-warning)' }} /> Confirm Broadcast
            </h3>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.6, margin: '0 0 18px' }}>
              You are about to send this message to <strong style={{ color: 'var(--text-main)' }}>{preview?.total ?? 0}</strong> recipient(s)
              via <strong style={{ color: 'var(--text-main)' }}>{channels.map(c => CHANNEL_META[c]?.label).join(', ')}</strong>. This cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button className="btn-secondary" onClick={() => setConfirmOpen(false)}>Cancel</button>
              <button className="btn-primary" onClick={doSend}>Yes, Send Now</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)',
  textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '6px',
};

export default CampaignsPage;
