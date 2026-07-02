import React, { useState, useEffect, useMemo } from 'react';
import {
  ChevronLeft, Send, Loader, Plus, Trash2, SlidersHorizontal, Percent,
  Calendar, Layers, Home, Wrench, Car, Award, Calculator
} from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════
   Custom Payment Plan Builder (expert sales)
   Every term: discount, down payment, term, interest (flat/reducing),
   per-year distribution, annual payments, and add-ons (club / garage /
   maintenance / custom). Produces a full schedule sent to the accountant.
   ═══════════════════════════════════════════════════════════════ */

interface SchedItem { amount: number; dueDate: string; label: string; type: string; category: string; }
interface AddonState { id: string; name: string; cost: string; method: 'cash' | 'installment'; term: number; startYear: number; }

const fmt = (n: number) => new Intl.NumberFormat('en-EG', { style: 'currency', currency: 'EGP', maximumFractionDigits: 0 }).format(Math.round(n || 0));
const iso = (d: Date) => d.toISOString().slice(0, 10);
const addMonths = (n: number) => { const d = new Date(); d.setMonth(d.getMonth() + n); return d; };
const addDays = (n: number) => { const d = new Date(); d.setDate(d.getDate() + n); return d; };
const fmtDate = (s: string) => new Date(s).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

const CustomPlanBuilder: React.FC<{
  price: number; eoiPaid: number; busy: boolean;
  onBack: () => void;
  onSubmit: (schedule: { amount: number; dueDate: string; label: string; type: string }[], monthly: number, note: string) => void;
}> = ({ price, eoiPaid, busy, onBack, onSubmit }) => {
  // Pricing
  const [discountPct, setDiscountPct] = useState(0);
  const [downPct, setDownPct] = useState(10);
  // Installments
  const [term, setTerm] = useState(5);
  const [interest, setInterest] = useState(0);
  const [interestType, setInterestType] = useState<'flat' | 'reducing'>('reducing');
  const [startMonth, setStartMonth] = useState(1);
  const [cashGrace] = useState(14);
  const [yearPct, setYearPct] = useState<number[]>([]);
  // Annual
  const [enableAnnual, setEnableAnnual] = useState(false);
  const [annualAmount, setAnnualAmount] = useState(50000);
  // Add-ons
  const [club, setClub] = useState<AddonState | null>(null);
  const [garage, setGarage] = useState<AddonState | null>(null);
  const [maint, setMaint] = useState<(AddonState & { dueMonth: number }) | null>(null);
  const [customAddons, setCustomAddons] = useState<AddonState[]>([]);

  const netPrice = price * (1 - discountPct / 100);
  const downPayment = netPrice * (downPct / 100);

  // Re-distribute year percentages evenly when term changes
  useEffect(() => {
    const base = Math.floor(100 / Math.max(1, term));
    const rem = 100 - base * term;
    setYearPct(Array.from({ length: Math.max(1, term) }, (_, i) => base + (i === term - 1 ? rem : 0)));
  }, [term]);

  const setYp = (i: number, v: number) => setYearPct(prev => { const n = [...prev]; n[i] = isNaN(v) ? 0 : v; return n; });

  const { schedule, totals } = useMemo(() => {
    const rows: SchedItem[] = [];
    if (price <= 0) return { schedule: rows, totals: { unit: 0, addons: 0, grand: 0, interest: 0, monthlyAvg: 0 } };

    const dp = downPayment;
    const eoi = eoiPaid;
    const n = Math.max(1, term) * 12;
    const totalAnnual = enableAnnual ? annualAmount * term : 0;
    const principal = Math.max(0, netPrice - dp - eoi - totalAnnual);

    // amount to amortize (incl interest)
    let remaining = principal; let totalInterest = 0;
    if (interest > 0) {
      if (interestType === 'reducing') {
        const mr = interest / 100 / 12;
        const monthly = principal * (mr * Math.pow(1 + mr, n)) / (Math.pow(1 + mr, n) - 1);
        remaining = monthly * n;
      } else {
        totalInterest = principal * (interest / 100) * term;
        remaining = principal + totalInterest;
      }
      totalInterest = remaining - principal;
    }

    // paid today
    rows.push({ amount: eoi, dueDate: iso(new Date()), label: 'EOI Deposit / جدية الحجز', type: 'eoi', category: 'Unit' });
    if (dp > 0) rows.push({ amount: dp, dueDate: iso(new Date()), label: 'Down Payment / مقدم', type: 'down_payment', category: 'Unit' });

    // monthly installments distributed by year %
    for (let m = 1; m <= n; m++) {
      const actual = (startMonth - 1) + m;
      const yi = Math.ceil(m / 12) - 1;
      const yp = yearPct[yi] || 0;
      const monthly = (remaining * (yp / 100)) / 12;
      if (monthly > 0) rows.push({ amount: monthly, dueDate: iso(addMonths(actual)), label: `Unit Installment #${m} (Y${yi + 1})`, type: 'monthly', category: 'Unit' });
      if (enableAnnual && annualAmount > 0 && m % 12 === 0) rows.push({ amount: annualAmount, dueDate: iso(addMonths(actual)), label: `Annual Payment #${m / 12}`, type: 'annual', category: 'Unit' });
    }

    const addonRows = (a: AddonState | null, label: string, cat: string, cashType: string, instType: string, cashMonthAt = 1) => {
      if (!a) return;
      const val = parseFloat(a.cost) || 0;
      if (val <= 0) return;
      if (a.method === 'cash') {
        rows.push({ amount: val, dueDate: iso(addMonths(cashMonthAt)), label: `${label} (Cash)`, type: cashType, category: cat });
      } else {
        const tm = a.term * 12; const per = val / tm; const start = (a.startYear - 1) * 12 + 1;
        for (let m = 1; m <= tm; m++) rows.push({ amount: per, dueDate: iso(addMonths(start + m - 1)), label: `${label} Installment #${m}`, type: instType, category: cat });
      }
    };
    addonRows(club, 'Club Membership', 'Club', 'club_cash', 'club_installment');
    addonRows(garage, 'Garage', 'Garage', 'garage_cash', 'garage_installment');
    addonRows(maint, 'Maintenance Deposit', 'Maintenance', 'maintenance_cash', 'maintenance_installment', maint?.dueMonth ?? 36);
    customAddons.forEach(a => addonRows(a, a.name || 'Add-on', a.name || 'Add-on', 'custom_cash', 'custom_installment'));

    rows.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

    const unit = rows.filter(r => r.category === 'Unit').reduce((s, r) => s + r.amount, 0);
    const addons = rows.filter(r => r.category !== 'Unit').reduce((s, r) => s + r.amount, 0);
    const monthlyAvg = remaining / n;
    return { schedule: rows, totals: { unit, addons, grand: unit + addons, interest: totalInterest, monthlyAvg } };
  }, [price, netPrice, downPayment, eoiPaid, term, interest, interestType, startMonth, yearPct, enableAnnual, annualAmount, club, garage, maint, customAddons]);

  const submit = () => {
    const note = `Custom: ${discountPct}% disc · ${downPct}% down · ${term}y · ${interest}% ${interestType}` +
      (enableAnnual ? ` · annual ${fmt(annualAmount)}` : '') +
      [club && 'Club', garage && 'Garage', maint && 'Maintenance', ...customAddons.map(a => a.name)].filter(Boolean).join(', ').replace(/^/, m => m ? ' · +' + m : '');
    onSubmit(schedule.map(({ amount, dueDate, label, type }) => ({ amount: Math.round(amount), dueDate, label, type })), Math.round(totals.monthlyAvg), note);
  };

  const newAddon = (name: string): AddonState => ({ id: Math.random().toString(36).slice(2), name, cost: '100000', method: 'cash', term: 3, startYear: 1 });

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <SlidersHorizontal size={17} color="#003DA6" />
        <h4 style={{ margin: 0, fontSize: '0.98rem' }}>Build a custom plan</h4>
      </div>
      <p style={{ margin: '0 0 14px', color: '#94a3b8', fontSize: '0.78rem' }}>Set every term. It will be sent to the accountant for approval.</p>

      <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: 18 }}>
        {/* ── Left: inputs ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxHeight: 430, overflowY: 'auto', paddingRight: 6 }}>
          {/* Pricing */}
          <Section icon={<Percent size={13} />} title="Pricing">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <Num label="Discount %" value={discountPct} onChange={setDiscountPct} />
              <Num label="Down payment %" value={downPct} onChange={setDownPct} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem', color: '#64748b', marginTop: 8 }}>
              <span>Net price: <b style={{ color: '#0f172a' }}>{fmt(netPrice)}</b></span>
              <span>Down: <b style={{ color: '#0f172a' }}>{fmt(downPayment)}</b></span>
            </div>
          </Section>

          {/* Installments */}
          <Section icon={<Layers size={13} />} title="Installments">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
              <Num label="Years" value={term} onChange={v => setTerm(Math.max(1, Math.min(15, Math.round(v))))} />
              <Num label="Interest %/yr" value={interest} onChange={setInterest} />
              <Num label="Start month" value={startMonth} onChange={v => setStartMonth(Math.max(1, Math.round(v)))} />
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              {(['reducing', 'flat'] as const).map(t => (
                <button key={t} onClick={() => setInterestType(t)} style={pill(interestType === t)}>{t === 'reducing' ? 'Reducing' : 'Flat'}</button>
              ))}
            </div>
            {/* per-year % */}
            <div style={{ marginTop: 12 }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', marginBottom: 6 }}>Yearly distribution (% of financed amount)</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(72px,1fr))', gap: 8 }}>
                {yearPct.map((p, i) => (
                  <div key={i}>
                    <label style={{ fontSize: '0.62rem', color: '#94a3b8', fontWeight: 700 }}>Year {i + 1}</label>
                    <input type="number" value={p} onChange={e => setYp(i, parseFloat(e.target.value))} style={inp} />
                  </div>
                ))}
              </div>
              <div style={{ fontSize: '0.7rem', marginTop: 4, color: yearPct.reduce((s, v) => s + v, 0) === 100 ? '#16a34a' : '#ef4444', fontWeight: 700 }}>
                Total: {yearPct.reduce((s, v) => s + v, 0)}% {yearPct.reduce((s, v) => s + v, 0) !== 100 && '(should be 100%)'}
              </div>
            </div>
            {/* annual */}
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, fontSize: '0.8rem', fontWeight: 700, color: '#0f172a', cursor: 'pointer' }}>
              <input type="checkbox" checked={enableAnnual} onChange={e => setEnableAnnual(e.target.checked)} /> Annual lump payment (each year)
            </label>
            {enableAnnual && <div style={{ marginTop: 8 }}><Num label="Annual amount (EGP)" value={annualAmount} onChange={setAnnualAmount} /></div>}
          </Section>

          {/* Add-ons */}
          <Section icon={<Plus size={13} />} title="Add-ons">
            <AddonRow icon={<Award size={13} />} label="Club" state={club} onToggle={() => setClub(club ? null : newAddon('Club'))} onChange={setClub} />
            <AddonRow icon={<Car size={13} />} label="Garage" state={garage} onToggle={() => setGarage(garage ? null : newAddon('Garage'))} onChange={setGarage} />
            <AddonRow icon={<Wrench size={13} />} label="Maintenance" state={maint} isMaint
              onToggle={() => setMaint(maint ? null : { ...newAddon('Maintenance'), dueMonth: 36 })} onChange={(v) => setMaint(v as any)} />
            {customAddons.map((a, idx) => (
              <AddonRow key={a.id} icon={<Home size={13} />} label={a.name} state={a} editableName custom
                onToggle={() => setCustomAddons(prev => prev.filter(x => x.id !== a.id))}
                onChange={(v) => setCustomAddons(prev => prev.map((x, i) => i === idx ? (v as AddonState) : x))} />
            ))}
            <button onClick={() => setCustomAddons(prev => [...prev, newAddon('Custom add-on')])} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(0,61,166,0.05)', border: '1px dashed rgba(0,61,166,0.25)', color: '#003DA6', borderRadius: 9, padding: '8px 12px', fontSize: '0.76rem', fontWeight: 700, cursor: 'pointer', marginTop: 4 }}>
              <Plus size={13} /> Add custom item
            </button>
          </Section>
        </div>

        {/* ── Right: live preview ── */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
            <Mini label="Unit total" value={fmt(totals.unit)} />
            <Mini label="Add-ons" value={fmt(totals.addons)} />
            <Mini label="Interest" value={fmt(totals.interest)} />
            <Mini label="Grand total" value={fmt(totals.grand)} accent />
          </div>
          <div style={{ flex: 1, maxHeight: 330, overflowY: 'auto', border: '1px solid #eef2f7', borderRadius: 12 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.74rem' }}>
              <thead><tr style={{ background: '#f8fafc', color: '#64748b', textAlign: 'left', position: 'sticky', top: 0 }}><th style={{ padding: '7px 10px' }}>Description</th><th>Due</th><th style={{ textAlign: 'right', paddingRight: 10 }}>Amount</th></tr></thead>
              <tbody>
                {schedule.map((s, i) => (
                  <tr key={i} style={{ borderTop: '1px solid #f3f6f9' }}>
                    <td style={{ padding: '6px 10px', fontWeight: 600, color: s.category !== 'Unit' ? '#7c3aed' : '#0f172a' }}>{s.label}</td>
                    <td style={{ color: '#94a3b8' }}>{fmtDate(s.dueDate)}</td>
                    <td style={{ textAlign: 'right', paddingRight: 10, fontWeight: 700, color: '#003DA6' }}>{fmt(s.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: 6, display: 'flex', alignItems: 'center', gap: 5 }}>
            <Calculator size={12} /> {schedule.length} payments · avg monthly {fmt(totals.monthlyAvg)}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 18, borderTop: '1px solid #f1f5f9', paddingTop: 16 }}>
        <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#fff', color: '#64748b', border: '1px solid #e5e9f0', borderRadius: 10, padding: '10px 18px', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer' }}><ChevronLeft size={15} /> Back</button>
        <button onClick={submit} disabled={busy} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'linear-gradient(135deg,#003DA6,#001A70)', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 22px', fontWeight: 700, fontSize: '0.82rem', cursor: busy ? 'wait' : 'pointer' }}>
          {busy ? <Loader size={15} className="spin" /> : <Send size={15} />} Submit for Accountant Approval
        </button>
      </div>
    </div>
  );
};

/* ── small UI helpers ── */
const inp: React.CSSProperties = { border: '1.5px solid #e5e9f0', borderRadius: 8, padding: '7px 9px', width: '100%', fontSize: '0.82rem', fontWeight: 700, color: '#0f172a', outline: 'none', boxSizing: 'border-box' };
const pill = (active: boolean): React.CSSProperties => ({ flex: 1, padding: '7px 6px', borderRadius: 8, fontSize: '0.76rem', fontWeight: 700, cursor: 'pointer', border: active ? '2px solid #003DA6' : '1.5px solid #e5e9f0', background: active ? 'rgba(0,61,166,0.05)' : '#fff', color: active ? '#003DA6' : '#64748b' });

const Section: React.FC<{ icon: React.ReactNode; title: string; children: React.ReactNode }> = ({ icon, title, children }) => (
  <div style={{ border: '1px solid #eef2f7', borderRadius: 12, padding: 14 }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', fontWeight: 800, color: '#003DA6', marginBottom: 10 }}>{icon} {title}</div>
    {children}
  </div>
);
const Num: React.FC<{ label: string; value: number; onChange: (v: number) => void }> = ({ label, value, onChange }) => (
  <div>
    <label style={{ fontSize: '0.68rem', fontWeight: 700, color: '#64748b', display: 'block', marginBottom: 3 }}>{label}</label>
    <input type="number" value={value} onChange={e => onChange(parseFloat(e.target.value) || 0)} style={inp} />
  </div>
);
const Mini: React.FC<{ label: string; value: string; accent?: boolean }> = ({ label, value, accent }) => (
  <div style={{ background: accent ? 'rgba(0,61,166,0.06)' : '#f8fafc', borderRadius: 10, padding: '9px 11px' }}>
    <div style={{ fontSize: '0.6rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>{label}</div>
    <div style={{ fontWeight: 800, color: accent ? '#003DA6' : '#0f172a', fontSize: '0.86rem' }}>{value}</div>
  </div>
);

const AddonRow: React.FC<{
  icon: React.ReactNode; label: string; state: any; isMaint?: boolean; editableName?: boolean; custom?: boolean;
  onToggle: () => void; onChange: (v: any) => void;
}> = ({ icon, label, state, isMaint, editableName, onToggle, onChange }) => (
  <div style={{ border: '1px solid #eef2f7', borderRadius: 10, padding: 10, marginBottom: 8 }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <label style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: '0.8rem', fontWeight: 700, color: '#0f172a', cursor: 'pointer' }}>
        <input type="checkbox" checked={!!state} onChange={onToggle} />
        <span style={{ color: '#7c3aed' }}>{icon}</span>
        {editableName && state ? (
          <input value={state.name} onChange={e => onChange({ ...state, name: e.target.value })} style={{ ...inp, padding: '4px 7px', width: 120 }} />
        ) : label}
      </label>
      {editableName && <Trash2 size={13} color="#cbd5e1" style={{ cursor: 'pointer' }} onClick={onToggle} />}
    </div>
    {state && (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 8, marginTop: 8 }}>
        <Num label="Cost (EGP)" value={parseFloat(state.cost) || 0} onChange={v => onChange({ ...state, cost: String(v) })} />
        <div>
          <label style={{ fontSize: '0.68rem', fontWeight: 700, color: '#64748b', display: 'block', marginBottom: 3 }}>Method</label>
          <div style={{ display: 'flex', gap: 6 }}>
            {(['cash', 'installment'] as const).map(m => (
              <button key={m} onClick={() => onChange({ ...state, method: m })} style={pill(state.method === m)}>{m === 'cash' ? 'Cash' : 'Inst.'}</button>
            ))}
          </div>
        </div>
        {state.method === 'installment' && <Num label="Term (yrs)" value={state.term} onChange={v => onChange({ ...state, term: Math.max(1, Math.round(v)) })} />}
        {state.method === 'installment' && <Num label="Start year" value={state.startYear} onChange={v => onChange({ ...state, startYear: Math.max(1, Math.round(v)) })} />}
        {isMaint && state.method === 'cash' && <Num label="Due month" value={state.dueMonth} onChange={v => onChange({ ...state, dueMonth: Math.max(1, Math.round(v)) })} />}
      </div>
    )}
  </div>
);

export default CustomPlanBuilder;
