import React, { useEffect, useRef, useState } from 'react';
import api from '../../services/api';
import { ToastContainer } from '../../components/Toast';
import { Sparkles, RefreshCw, Search, SlidersHorizontal, Crown, Settings2, Plus, Trash2, X } from 'lucide-react';

const WEIGHT_FIELDS: [string, string][] = [
  ['cash', 'Cash buyer'],
  ['past_client', 'Returning client'],
  ['vip', 'VIP lead'],
  ['income_high', 'Income > 100k'],
  ['income_mid', 'Income 50k–100k'],
  ['income_low', 'Income 20k–50k'],
  ['payment_high', 'EOI payment > 100k'],
  ['payment_mid', 'EOI payment > 50k'],
  ['completeness', 'Profile completeness'],
  ['lead_score', 'CRM lead score'],
];

/**
 * Head of Sales — Booking Priority Board.
 * Consumes /v1/acquisition/booking-priorities (AI score + giant filter +
 * manual ranking) so the Head of Sales can decide who books first.
 */

const DECISIONS = ['pending', 'shortlisted', 'approved', 'waitlist', 'rejected'] as const;
const DECISION_COLOR: Record<string, string> = {
  pending: '#64748b', shortlisted: '#0891b2', approved: '#16a34a', waitlist: '#d97706', rejected: '#dc2626',
};

const fmt = (v: any) => (v == null || v === '' ? '—' : Number(v).toLocaleString('en-EG'));

const BookingPriorities: React.FC = () => {
  const [items, setItems] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [recomputing, setRecomputing] = useState(false);
  const [toasts, setToasts] = useState<{ id: string; message: string; type: 'success' | 'error' | 'info' }[]>([]);

  // giant filter (subset surfaced in UI)
  const [search, setSearch] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [minIncome, setMinIncome] = useState('');
  const [sortBy, setSortBy] = useState('priority');
  const autoScoredRef = useRef(false);

  // scoring criteria editor
  const [showCriteria, setShowCriteria] = useState(false);
  const [criteria, setCriteria] = useState<any>(null);
  const [availFields, setAvailFields] = useState<string[]>([]);
  const [operators, setOperators] = useState<string[]>([]);
  const [savingCriteria, setSavingCriteria] = useState(false);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Math.random().toString(36).slice(2);
    setToasts(prev => [...prev, { id, message, type }]);
  };
  const removeToast = (id: string) => setToasts(prev => prev.filter(t => t.id !== id));

  const load = async () => {
    setLoading(true);
    try {
      const params: any = { sort_by: sortBy, per_page: 50 };
      if (search) params.search = search;
      if (paymentMethod) params.payment_method = paymentMethod;
      if (minIncome) params.min_income = minIncome;
      const res = await api.get('/acquisition/booking-priorities', { params });
      const page = res.data?.data;
      const rows = page?.data || [];
      setItems(rows);
      setTotal(page?.total || 0);

      // First load with un-scored bookings → compute AI scores once automatically.
      if (!autoScoredRef.current && rows.length > 0 && rows.every((r: any) => r.ai_score == null)) {
        autoScoredRef.current = true;
        recompute();
      }
    } catch {
      setItems([]); setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [sortBy]);

  // On first mount, adopt the Head-of-Sales saved "rank by" choice.
  useEffect(() => {
    api.get('/acquisition/booking-priorities/criteria')
      .then(res => {
        const rb = res.data?.data?.weights?.rank_by;
        if (rb && rb !== 'priority') setSortBy(rb);
      })
      .catch(() => {});
    // eslint-disable-next-line
  }, []);

  // 🎬 Demo Mode: re-fetch when the live walkthrough performs a backend action.
  useEffect(() => {
    const onRefresh = () => load();
    window.addEventListener('redp-demo-refresh', onRefresh);
    return () => window.removeEventListener('redp-demo-refresh', onRefresh);
    // eslint-disable-next-line
  }, []);

  const recompute = async () => {
    setRecomputing(true);
    try {
      const res = await api.post('/acquisition/booking-priorities/recompute', {});
      showToast(`AI recomputed priority for ${res.data?.data?.count ?? 0} bookings`, 'success');
      await load();
    } catch {
      showToast('Recompute failed', 'error');
    } finally {
      setRecomputing(false);
    }
  };

  const setDecision = async (eoiId: string, decision: string) => {
    setItems(prev => prev.map(it => it.id === eoiId ? { ...it, decision } : it));
    try {
      await api.put(`/acquisition/booking-priorities/${eoiId}`, { decision });
      showToast('Decision saved', 'success');
    } catch {
      showToast('Could not save decision', 'error');
    }
  };

  const openCriteria = async () => {
    setShowCriteria(true);
    try {
      const res = await api.get('/acquisition/booking-priorities/criteria');
      setCriteria(res.data?.data?.weights || {});
      setAvailFields(res.data?.data?.available_fields || []);
      setOperators(res.data?.data?.operators || ['>', '<', '>=', '<=', '=', '!=']);
    } catch {
      showToast('Could not load criteria', 'error');
    }
  };

  const setW = (k: string, v: any) => setCriteria((prev: any) => ({ ...prev, [k]: v }));
  const addRule = () => setCriteria((prev: any) => ({ ...prev, custom_rules: [...(prev.custom_rules || []), { field: availFields[0] || 'monthly_income', operator: '>', value: '', weight: 10, label: '' }] }));
  const updateRule = (i: number, patch: any) => setCriteria((prev: any) => ({ ...prev, custom_rules: prev.custom_rules.map((r: any, k: number) => k === i ? { ...r, ...patch } : r) }));
  const removeRule = (i: number) => setCriteria((prev: any) => ({ ...prev, custom_rules: prev.custom_rules.filter((_: any, k: number) => k !== i) }));

  const saveCriteria = async () => {
    setSavingCriteria(true);
    try {
      await api.put('/acquisition/booking-priorities/criteria', criteria);
      showToast('Criteria saved — recomputing…', 'success');
      setShowCriteria(false);
      autoScoredRef.current = true; // prevent auto-recompute racing
      setSortBy(criteria.rank_by || 'ai_score'); // apply the chosen ranking to the board
      await recompute();
    } catch {
      showToast('Could not save criteria', 'error');
    } finally {
      setSavingCriteria(false);
    }
  };

  const scoreColor = (s: number) => (s >= 70 ? '#16a34a' : s >= 40 ? '#d97706' : '#64748b');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      {/* Header */}
      <div className="glass-panel" style={{ padding: '22px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: 10 }}>
            <Crown size={22} style={{ color: 'var(--color-secondary)' }} /> Booking Priority Board
          </h1>
          <p style={{ margin: '6px 0 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Everyone who paid the EOI, ranked by an AI priority score you can trust or override. / كل اللي دفعوا الحجز، مرتّبين بـ AI score تقدر تعدّله.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button onClick={openCriteria} className="btn-secondary" style={{ gap: 8 }}>
            <Settings2 size={16} /> Scoring Criteria
          </button>
          <button onClick={recompute} disabled={recomputing} className="btn-primary" style={{ gap: 8 }}>
            <RefreshCw size={16} className={recomputing ? 'animate-spin' : ''} /> {recomputing ? 'Recomputing…' : 'Recompute AI Priority'}
          </button>
        </div>
      </div>

      {/* Giant filter */}
      <div className="glass-panel" style={{ padding: '16px 20px', display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
          <Search size={15} style={{ position: 'absolute', left: 12, top: 13, color: 'var(--text-muted)' }} />
          <input className="form-control" placeholder="Search name / phone / order…" value={search}
            onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && load()}
            style={{ paddingLeft: 34 }} />
        </div>
        <div>
          <label className="form-label">Payment</label>
          <select className="form-control" value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}>
            <option value="">All methods</option>
            <option value="cash">Cash</option>
            <option value="bank_transfer">Bank Transfer</option>
            <option value="instapay">InstaPay</option>
            <option value="international_bank_transfer">Intl. Transfer</option>
          </select>
        </div>
        <div>
          <label className="form-label">Min income</label>
          <input className="form-control" type="number" placeholder="0" value={minIncome} onChange={e => setMinIncome(e.target.value)} style={{ width: 130 }} />
        </div>
        <div>
          <label className="form-label">Sort by</label>
          <select className="form-control" value={sortBy} onChange={e => setSortBy(e.target.value)}>
            <option value="priority">Priority (rank → AI)</option>
            <option value="ai_score">AI score</option>
            <option value="payment_amount">Payment amount</option>
            <option value="monthly_income">Monthly income</option>
            <option value="created_at">Earliest paid (FIFO)</option>
          </select>
        </div>
        <button onClick={load} className="btn-secondary" style={{ gap: 6 }}><SlidersHorizontal size={15} /> Apply</button>
      </div>

      {/* List */}
      <div className="glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--border-glass)', fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          {loading ? 'Loading…' : `${total} paid bookings`}
        </div>

        {!loading && items.length === 0 && (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
            No paid bookings yet. Approved/pending EOIs will appear here.
          </div>
        )}

        {items.map((it, i) => {
          const ai = it.ai_score != null ? Number(it.ai_score) : null;
          const reasons: any[] = it.ai_reasons || [];
          return (
            <div key={it.id} style={{ display: 'flex', gap: 16, padding: '16px 20px', borderBottom: '1px solid var(--border-glass)', alignItems: 'center', flexWrap: 'wrap' }}>
              {/* rank */}
              <div style={{ width: 34, textAlign: 'center', fontWeight: 900, fontSize: '1.1rem', color: 'var(--color-primary)' }}>
                {it.manual_rank ?? i + 1}
              </div>

              {/* applicant */}
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ fontWeight: 800, color: 'var(--text-main)' }}>{it.client_name}</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  {it.client_phone} · {it.payment_method} · {fmt(it.payment_amount)} EGP
                </div>
                <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: 2 }}>
                  {it.profile?.job_title || '—'} · income {fmt(it.profile?.monthly_income)} {it.profile?.income_currency || ''}
                  {it.lead?.is_vip && <span className="badge badge-warning" style={{ marginLeft: 8, fontSize: '0.65rem' }}>VIP</span>}
                </div>
              </div>

              {/* AI score */}
              <div style={{ textAlign: 'center', minWidth: 92 }}>
                {ai != null ? (
                  <div title={reasons.map(r => `${r.detail} (+${r.points})`).join('\n')} style={{ cursor: 'help' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontWeight: 900, fontSize: '1.25rem', color: scoreColor(ai) }}>
                      <Sparkles size={15} /> {ai.toFixed(0)}
                    </div>
                    <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.05em' }}>AI SCORE</div>
                  </div>
                ) : (
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Not scored</span>
                )}
              </div>

              {/* decision */}
              <div style={{ minWidth: 150 }}>
                <select
                  value={it.decision || 'pending'}
                  onChange={e => setDecision(it.id, e.target.value)}
                  className="form-control"
                  style={{ borderColor: DECISION_COLOR[it.decision || 'pending'], color: DECISION_COLOR[it.decision || 'pending'], fontWeight: 700 }}
                >
                  {DECISIONS.map(d => <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>)}
                </select>
              </div>
            </div>
          );
        })}
      </div>

      {/* Scoring Criteria modal — the Head of Sales defines the standard */}
      {showCriteria && criteria && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 5000, background: 'rgba(2,6,23,0.5)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '24px 16px', overflowY: 'auto' }}>
          <div style={{ width: 'min(720px, 100%)', background: '#fff', borderRadius: 18, boxShadow: '0 30px 80px -20px rgba(0,0,0,0.5)', padding: '24px 28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Settings2 size={20} /> Scoring Criteria
              </h2>
              <button onClick={() => setShowCriteria(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}><X size={20} /></button>
            </div>
            <p style={{ margin: '0 0 16px', color: 'var(--text-muted)', fontSize: '0.83rem' }}>
              Choose what to rank on, then tune how many points each factor adds to the AI score. / اختار ترتّب على إيه، وبعدين ظبّط كل عامل بيضيف كام نقطة للـ AI score.
            </p>

            {/* RANK BY — the primary ranking factor */}
            <div style={{ padding: '14px 16px', background: 'rgba(0,61,166,0.05)', border: '1.5px solid rgba(0,61,166,0.2)', borderRadius: 12, marginBottom: 18 }}>
              <label className="form-label" style={{ fontWeight: 800, color: 'var(--color-primary)', fontSize: '0.9rem' }}>
                🔝 Rank primarily by / رتّب أساسًا على
              </label>
              <select className="form-control" value={criteria.rank_by || 'ai_score'} onChange={e => setW('rank_by', e.target.value)} style={{ marginTop: 6, fontWeight: 700 }}>
                <option value="ai_score">AI Score — your weighted criteria below / حسب معاييرك بالأوزان</option>
                <option value="monthly_income">Highest monthly income / الأعلى دخلًا</option>
                <option value="payment_amount">Largest EOI payment / الأكبر دفعة</option>
                <option value="created_at">Earliest paid — first come / الأسبق دفعًا</option>
                <option value="priority">Manual rank, then AI / ترتيبك اليدوي ثم الـ AI</option>
              </select>
            </div>

            {/* weights grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: 12 }}>
              {WEIGHT_FIELDS.map(([key, label]) => (
                <div key={key} className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.78rem' }}>{label}</label>
                  <input type="number" min={0} max={100} className="form-control" value={criteria[key] ?? 0}
                    onChange={e => setW(key, Number(e.target.value))} />
                </div>
              ))}
            </div>

            {/* AI blend */}
            <div style={{ marginTop: 18 }}>
              <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 700 }}>
                AI lead-score blend: {Math.round((criteria.ai_blend ?? 0) * 100)}%
              </label>
              <input type="range" min={0} max={1} step={0.05} value={criteria.ai_blend ?? 0}
                onChange={e => setW('ai_blend', Number(e.target.value))} style={{ width: '100%' }} />
              <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>How much the platform's AI lead score influences the final score (0 = pure rules).</span>
            </div>

            {/* custom rules */}
            <div style={{ marginTop: 22 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <strong style={{ fontSize: '0.9rem', color: 'var(--text-main)' }}>Custom rules</strong>
                <button onClick={addRule} className="btn-secondary" style={{ gap: 6, padding: '6px 12px', fontSize: '0.8rem' }}><Plus size={14} /> Add rule</button>
              </div>
              {(criteria.custom_rules || []).length === 0 && (
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>No custom rules. Example: monthly_income &gt; 200000 → +30.</div>
              )}
              {(criteria.custom_rules || []).map((r: any, i: number) => (
                <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8, flexWrap: 'wrap' }}>
                  <select className="form-control" value={r.field} onChange={e => updateRule(i, { field: e.target.value })} style={{ flex: 1, minWidth: 150 }}>
                    {availFields.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                  <select className="form-control" value={r.operator} onChange={e => updateRule(i, { operator: e.target.value })} style={{ width: 70 }}>
                    {operators.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                  <input className="form-control" placeholder="value" value={r.value} onChange={e => updateRule(i, { value: e.target.value })} style={{ width: 120 }} />
                  <input className="form-control" type="number" placeholder="+pts" value={r.weight} onChange={e => updateRule(i, { weight: Number(e.target.value) })} style={{ width: 80 }} />
                  <button onClick={() => removeRule(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626' }}><Trash2 size={16} /></button>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 24 }}>
              <button onClick={() => setShowCriteria(false)} className="btn-secondary">Cancel</button>
              <button onClick={saveCriteria} disabled={savingCriteria} className="btn-primary" style={{ gap: 8 }}>
                <RefreshCw size={15} className={savingCriteria ? 'animate-spin' : ''} /> {savingCriteria ? 'Saving…' : 'Save & Recompute'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingPriorities;
