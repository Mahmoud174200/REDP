import React, { useState, useEffect } from 'react';
import { Wallet, TrendingUp, TrendingDown, CreditCard, Clock, CheckCircle, AlertCircle, ArrowUpRight, ArrowDownRight, DollarSign, Calendar, BarChart3 } from 'lucide-react';

interface PaymentEntry {
  id: string;
  contract_number: string;
  client_name: string;
  unit_number: string;
  installment_number: number;
  amount: number;
  due_date: string;
  paid_at: string | null;
  status: string;
  gateway: string | null;
  transaction_ref: string | null;
}

const mockPayments: PaymentEntry[] = [
  { id: 'p1', contract_number: 'REDP-CTR-2026-0001', client_name: 'Ahmed Hassan', unit_number: 'A-101', installment_number: 0, amount: 50000, due_date: '2026-03-15', paid_at: '2026-03-15', status: 'paid', gateway: 'eoi_deposit', transaction_ref: 'EOI-RES001' },
  { id: 'p2', contract_number: 'REDP-CTR-2026-0001', client_name: 'Ahmed Hassan', unit_number: 'A-101', installment_number: 1, amount: 212500, due_date: '2026-06-15', paid_at: '2026-06-10', status: 'paid', gateway: 'stripe', transaction_ref: 'STR-8F2A3C' },
  { id: 'p3', contract_number: 'REDP-CTR-2026-0001', client_name: 'Ahmed Hassan', unit_number: 'A-101', installment_number: 2, amount: 212500, due_date: '2026-09-15', paid_at: null, status: 'pending', gateway: null, transaction_ref: null },
  { id: 'p4', contract_number: 'REDP-CTR-2026-0002', client_name: 'Sara Mohamed', unit_number: 'V-501', installment_number: 1, amount: 387500, due_date: '2026-04-01', paid_at: '2026-04-01', status: 'paid', gateway: 'fawry', transaction_ref: 'FWR-93D1E8' },
  { id: 'p5', contract_number: 'REDP-CTR-2026-0002', client_name: 'Sara Mohamed', unit_number: 'V-501', installment_number: 2, amount: 387500, due_date: '2026-07-01', paid_at: null, status: 'pending', gateway: null, transaction_ref: null },
  { id: 'p6', contract_number: 'REDP-CTR-2026-0005', client_name: 'Omar Youssef', unit_number: 'A-205', installment_number: 1, amount: 279375, due_date: '2026-04-20', paid_at: null, status: 'pending', gateway: null, transaction_ref: null },
  { id: 'p7', contract_number: 'REDP-CTR-2026-0003', client_name: 'Karim Ali', unit_number: 'O-204', installment_number: 0, amount: 6800000, due_date: '2026-02-20', paid_at: '2026-02-20', status: 'paid', gateway: 'bank_transfer', transaction_ref: 'BNK-A91C2F' },
  { id: 'p8', contract_number: 'REDP-CTR-2026-0004', client_name: 'Fatma Ibrahim', unit_number: 'D-301', installment_number: 1, amount: 553125, due_date: '2026-05-01', paid_at: null, status: 'pending', gateway: null, transaction_ref: null },
];

const Payments: React.FC = () => {
  const [payments] = useState<PaymentEntry[]>(mockPayments);
  const [selectedGateway, setSelectedGateway] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 600);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', flexDirection: 'column', gap: '16px' }}>
        <div className="animate-spin" style={{ width: '40px', height: '40px', border: '4px solid var(--color-primary)', borderTopColor: 'transparent', borderRadius: '50%' }} />
        <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 600 }}>Loading...</span>
      </div>
    );
  }

  const filtered = payments.filter(p => {
    const matchGateway = selectedGateway === 'all' || p.gateway === selectedGateway;
    const matchStatus = selectedStatus === 'all' || p.status === selectedStatus;
    return matchGateway && matchStatus;
  });

  // KPI calculations
  const totalRevenue = payments.filter(p => p.status === 'paid').reduce((a, p) => a + p.amount, 0);
  const pendingAmount = payments.filter(p => p.status === 'pending').reduce((a, p) => a + p.amount, 0);
  const overduePayments = payments.filter(p => p.status === 'pending' && new Date(p.due_date) < new Date());
  const overdueAmount = overduePayments.reduce((a, p) => a + p.amount, 0);
  const paidCount = payments.filter(p => p.status === 'paid').length;

  // Monthly revenue data for chart
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
  const monthlyData = [0, 6800000, 437500, 387500, 0, 212500];
  const maxMonthly = Math.max(...monthlyData, 1);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* Header */}
      <div className="glass-panel" style={{ padding: '28px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Wallet style={{ color: 'var(--color-primary)' }} />
            Payment Dashboard
          </h1>
          <p style={{ fontSize: '0.85rem' }}>Financial KPIs, installment tracking, gateway management & billing reports</p>
        </div>
        <div style={{ padding: '6px 14px', background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 'var(--radius-sm)' }}>
          <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-primary)', letterSpacing: '0.05em' }}>MODULE: H.3 — MELWANY</span>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
        {[
          { label: 'Total Revenue', value: `${(totalRevenue / 1000000).toFixed(1)}M`, sub: `${paidCount} payments processed`, icon: <DollarSign size={20} />, color: 'var(--color-success)', bg: 'rgba(16,185,129,0.08)', trend: '+12.5%', trendUp: true },
          { label: 'Pending Amount', value: `${(pendingAmount / 1000000).toFixed(1)}M`, sub: `${payments.filter(p => p.status === 'pending').length} installments due`, icon: <Clock size={20} />, color: 'var(--color-warning)', bg: 'rgba(245,158,11,0.08)', trend: '', trendUp: false },
          { label: 'Overdue Amount', value: `${(overdueAmount / 1000000).toFixed(1)}M`, sub: `${overduePayments.length} overdue payments`, icon: <AlertCircle size={20} />, color: 'var(--color-danger)', bg: 'rgba(239,68,68,0.08)', trend: '', trendUp: false },
          { label: 'Collection Rate', value: `${totalRevenue > 0 ? Math.round((totalRevenue / (totalRevenue + pendingAmount)) * 100) : 0}%`, sub: 'of total billed amount', icon: <TrendingUp size={20} />, color: 'var(--color-primary)', bg: 'rgba(59,130,246,0.08)', trend: '+3.2%', trendUp: true },
        ].map((card, i) => (
          <div key={i} className="glass-panel" style={{ padding: '20px 24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
              <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{card.label}</span>
              <div style={{ padding: '8px', borderRadius: 'var(--radius-sm)', background: card.bg }}>
                <div style={{ color: card.color }}>{card.icon}</div>
              </div>
            </div>
            <h3 style={{ fontSize: '1.75rem', fontWeight: 800, color: card.color }}>{card.value}</h3>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{card.sub}</span>
              {card.trend && (
                <span style={{ fontSize: '0.7rem', fontWeight: 600, color: card.trendUp ? 'var(--color-success)' : 'var(--color-danger)', display: 'flex', alignItems: 'center', gap: '2px' }}>
                  {card.trendUp ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                  {card.trend}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Revenue Chart + Gateway Distribution */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
        {/* Revenue Chart */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BarChart3 size={18} style={{ color: 'var(--color-primary)' }} />
            Monthly Revenue (2026)
          </h3>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '12px', height: '200px', paddingBottom: '30px', position: 'relative' }}>
            {monthlyData.map((val, i) => (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', height: '100%', justifyContent: 'flex-end' }}>
                <span style={{ fontSize: '0.65rem', fontWeight: 600, color: val > 0 ? 'var(--color-primary)' : 'var(--text-muted)' }}>
                  {val > 0 ? `${(val / 1000000).toFixed(1)}M` : '—'}
                </span>
                <div style={{
                  width: '100%',
                  maxWidth: '60px',
                  height: `${Math.max(4, (val / maxMonthly) * 150)}px`,
                  borderRadius: '6px 6px 0 0',
                  background: val > 0 ? `linear-gradient(180deg, var(--color-primary), rgba(59,130,246,0.3))` : 'rgba(255,255,255,0.03)',
                  transition: 'height 0.8s ease',
                }} />
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 500 }}>{months[i]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Gateway Distribution */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CreditCard size={18} style={{ color: 'var(--color-secondary)' }} />
            Payment Gateways
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {[
              { name: 'Stripe', count: payments.filter(p => p.gateway === 'stripe').length, color: '#635BFF', amount: payments.filter(p => p.gateway === 'stripe' && p.status === 'paid').reduce((a, p) => a + p.amount, 0) },
              { name: 'Fawry', count: payments.filter(p => p.gateway === 'fawry').length, color: '#FF6B35', amount: payments.filter(p => p.gateway === 'fawry' && p.status === 'paid').reduce((a, p) => a + p.amount, 0) },
              { name: 'Bank Transfer', count: payments.filter(p => p.gateway === 'bank_transfer').length, color: '#10b981', amount: payments.filter(p => p.gateway === 'bank_transfer' && p.status === 'paid').reduce((a, p) => a + p.amount, 0) },
              { name: 'EOI Deposit', count: payments.filter(p => p.gateway === 'eoi_deposit').length, color: '#f59e0b', amount: payments.filter(p => p.gateway === 'eoi_deposit' && p.status === 'paid').reduce((a, p) => a + p.amount, 0) },
            ].map((gw, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: gw.color, flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{gw.name}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{gw.count} txns</span>
                  </div>
                  <div style={{ height: '4px', borderRadius: '2px', background: 'rgba(255,255,255,0.05)' }}>
                    <div style={{ width: `${totalRevenue > 0 ? (gw.amount / totalRevenue) * 100 : 0}%`, height: '100%', borderRadius: '2px', background: gw.color, transition: 'width 0.5s ease' }} />
                  </div>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{gw.amount.toLocaleString()} EGP</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="glass-panel" style={{ padding: '16px 24px', display: 'flex', gap: '12px', alignItems: 'center' }}>
        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', minWidth: '80px' }}>Filter by:</span>
        <select className="form-control" value={selectedStatus} onChange={e => setSelectedStatus(e.target.value)} style={{ width: '160px', fontSize: '0.85rem' }}>
          <option value="all">All Status</option>
          <option value="paid">Paid</option>
          <option value="pending">Pending</option>
          <option value="failed">Failed</option>
        </select>
        <select className="form-control" value={selectedGateway} onChange={e => setSelectedGateway(e.target.value)} style={{ width: '180px', fontSize: '0.85rem' }}>
          <option value="all">All Gateways</option>
          <option value="stripe">Stripe</option>
          <option value="fawry">Fawry</option>
          <option value="bank_transfer">Bank Transfer</option>
          <option value="eoi_deposit">EOI Deposit</option>
        </select>
      </div>

      {/* Payments Table */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '16px' }}>Payment Transactions</h3>
        <table className="premium-table">
          <thead>
            <tr>
              <th>Contract</th>
              <th>Client</th>
              <th>Installment</th>
              <th>Amount</th>
              <th>Due Date</th>
              <th>Status</th>
              <th>Gateway</th>
              <th>Reference</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(payment => {
              const isOverdue = payment.status === 'pending' && new Date(payment.due_date) < new Date();
              return (
                <tr key={payment.id}>
                  <td>
                    <strong style={{ fontSize: '0.8rem' }}>{payment.contract_number}</strong>
                    <br />
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{payment.unit_number}</span>
                  </td>
                  <td style={{ fontSize: '0.85rem' }}>{payment.client_name}</td>
                  <td>
                    <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                      {payment.installment_number === 0 ? 'EOI Deposit' : `#${payment.installment_number}`}
                    </span>
                  </td>
                  <td style={{ fontWeight: 700, fontSize: '0.85rem' }}>{payment.amount.toLocaleString()} <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>EGP</span></td>
                  <td style={{ fontSize: '0.8rem', color: isOverdue ? 'var(--color-danger)' : 'var(--text-main)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Calendar size={12} style={{ color: 'var(--text-muted)' }} />
                      {payment.due_date}
                    </div>
                  </td>
                  <td>
                    {payment.status === 'paid' && <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><CheckCircle size={10} /> Paid</span>}
                    {payment.status === 'pending' && !isOverdue && <span className="badge badge-warning" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><Clock size={10} /> Pending</span>}
                    {payment.status === 'pending' && isOverdue && <span className="badge badge-danger" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><AlertCircle size={10} /> Overdue</span>}
                  </td>
                  <td>
                    <span style={{ fontSize: '0.75rem', textTransform: 'capitalize', color: 'var(--text-muted)' }}>
                      {payment.gateway ? payment.gateway.replace('_', ' ') : '—'}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontSize: '0.7rem', fontFamily: 'monospace', color: 'var(--text-muted)' }}>
                      {payment.transaction_ref || '—'}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Payments;
