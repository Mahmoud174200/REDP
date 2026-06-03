import React, { useState, useEffect } from 'react';
import { Wallet, TrendingUp, TrendingDown, CreditCard, Clock, CheckCircle, AlertCircle, ArrowUpRight, ArrowDownRight, DollarSign, Calendar, BarChart3 } from 'lucide-react';
import api from '../../services/api';

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

const Payments: React.FC = () => {
  const [payments, setPayments] = useState<PaymentEntry[]>([]);
  const [selectedGateway, setSelectedGateway] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [dashboardStats, setDashboardStats] = useState({
    total_revenue: 0,
    pending_amount: 0,
    overdue_amount: 0,
    overdue_count: 0,
    cash_balance: 0,
    bank_balance: 0
  });

  // Collection Modal States
  const [showCollectModal, setShowCollectModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<PaymentEntry | null>(null);
  const [collectAmount, setCollectAmount] = useState('');
  const [collectGateway, setCollectGateway] = useState<'cash' | 'bank_transfer' | 'stripe' | 'fawry'>('cash');
  const [collectRef, setCollectRef] = useState('');
  const [collectNotes, setCollectNotes] = useState('');
  const [isCollecting, setIsCollecting] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const payRes = await api.get('/v1/finance/payments');
      const dashRes = await api.get('/v1/finance/dashboard');

      if (payRes.data?.success) {
        const mapped = payRes.data.data.map((p: any) => ({
          id: p.id,
          contract_number: p.contract?.contract_number || 'N/A',
          client_name: p.contract?.client?.name || 'N/A',
          unit_number: p.contract?.unit?.unit_number || 'N/A',
          installment_number: p.installment_number,
          amount: parseFloat(p.amount) || 0,
          due_date: p.due_date,
          paid_at: p.paid_at,
          status: p.status,
          gateway: p.gateway,
          transaction_ref: p.transaction_reference
        }));
        setPayments(mapped);
      }

      if (dashRes.data?.success) {
        setDashboardStats(dashRes.data.dashboard);
      }
    } catch (err) {
      console.error('Failed to fetch payments data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenCollect = (payment: PaymentEntry) => {
    setSelectedPayment(payment);
    setCollectAmount(payment.amount.toString());
    setCollectGateway('cash');
    setCollectRef('');
    setCollectNotes('');
    setShowCollectModal(true);
  };

  const handleCollectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPayment) return;

    const amountNum = parseFloat(collectAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      alert('Please enter a valid amount.');
      return;
    }

    if (amountNum > selectedPayment.amount) {
      alert('Collected amount cannot exceed the scheduled installment amount.');
      return;
    }

    setIsCollecting(true);
    try {
      const res = await api.post(`/v1/finance/payments/${selectedPayment.id}/collect`, {
        amount: amountNum,
        gateway: collectGateway,
        transaction_reference: collectRef,
        notes: collectNotes
      });

      if (res.data?.success) {
        alert(res.data.message || 'Payment collected successfully.');
        setShowCollectModal(false);
        fetchData(); // Refresh list & KPIs
      } else {
        alert(res.data?.message || 'Error collecting payment.');
      }
    } catch (err: any) {
      console.error('Failed to collect payment:', err);
      alert(err.response?.data?.message || 'An error occurred while collecting payment.');
    } finally {
      setIsCollecting(false);
    }
  };

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
  const totalRevenue = dashboardStats.total_revenue;
  const cashBalance = dashboardStats.cash_balance || 0;
  const bankBalance = dashboardStats.bank_balance || 0;
  const pendingAmount = dashboardStats.pending_amount;
  const overdueAmount = dashboardStats.overdue_amount;
  const paidCount = payments.filter(p => p.status === 'paid').length;
  const overdueCount = payments.filter(p => p.status === 'pending' && new Date(p.due_date) < new Date()).length;

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
            Payment & Treasury Dashboard
          </h1>
          <p style={{ fontSize: '0.85rem' }}>Financial KPIs, manual collection ledger, cash desk & bank transfers</p>
        </div>
        <div style={{ padding: '6px 14px', background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 'var(--radius-sm)' }}>
          <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-primary)', letterSpacing: '0.05em' }}>MODULE: H.3 / ACCOUNTING</span>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px' }}>
        {[
          { label: 'Total Outlays', value: `${(totalRevenue / 1000000).toFixed(2)}M`, sub: `${paidCount} payments`, icon: <DollarSign size={20} />, color: 'var(--color-success)', bg: 'rgba(16,185,129,0.08)' },
          { label: 'Cash in Treasury', value: `${(cashBalance / 1000000).toFixed(2)}M`, sub: '💵 Physical Cash Desk', icon: <Wallet size={20} />, color: '#10b981', bg: 'rgba(16,185,129,0.08)' },
          { label: 'Bank Balance', value: `${(bankBalance / 1000000).toFixed(2)}M`, sub: '🏛️ Bank/Gateways', icon: <CreditCard size={20} />, color: '#3b82f6', bg: 'rgba(59,130,246,0.08)' },
          { label: 'Pending Amount', value: `${(pendingAmount / 1000000).toFixed(2)}M`, sub: `${payments.filter(p => p.status === 'pending').length} remaining`, icon: <Clock size={20} />, color: 'var(--color-warning)', bg: 'rgba(245,158,11,0.08)' },
          { label: 'Overdue Amount', value: `${(overdueAmount / 1000000).toFixed(2)}M`, sub: `${overdueCount} delayed`, icon: <AlertCircle size={20} />, color: 'var(--color-danger)', bg: 'rgba(239,68,68,0.08)' },
        ].map((card, i) => (
          <div key={i} className="glass-panel" style={{ padding: '20px 16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
              <span style={{ fontSize: '0.65rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{card.label}</span>
              <div style={{ padding: '6px', borderRadius: 'var(--radius-sm)', background: card.bg }}>
                <div style={{ color: card.color }}>{card.icon}</div>
              </div>
            </div>
            <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: card.color }}>{card.value} EGP</h3>
            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{card.sub}</span>
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
              { name: 'Cash', count: payments.filter(p => p.gateway === 'cash').length, color: '#10b981', amount: payments.filter(p => p.gateway === 'cash' && p.status === 'paid').reduce((a, p) => a + p.amount, 0) },
              { name: 'Stripe', count: payments.filter(p => p.gateway === 'stripe').length, color: '#635BFF', amount: payments.filter(p => p.gateway === 'stripe' && p.status === 'paid').reduce((a, p) => a + p.amount, 0) },
              { name: 'Fawry', count: payments.filter(p => p.gateway === 'fawry').length, color: '#FF6B35', amount: payments.filter(p => p.gateway === 'fawry' && p.status === 'paid').reduce((a, p) => a + p.amount, 0) },
              { name: 'Bank Transfer', count: payments.filter(p => p.gateway === 'bank_transfer').length, color: '#3b82f6', amount: payments.filter(p => p.gateway === 'bank_transfer' && p.status === 'paid').reduce((a, p) => a + p.amount, 0) },
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
          <option value="cash">Cash</option>
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
              <th>Actions</th>
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
                  <td>
                    {payment.status === 'pending' && (
                      <button
                        className="btn-primary"
                        style={{ padding: '6px 12px', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                        onClick={() => handleOpenCollect(payment)}
                      >
                        <DollarSign size={12} /> Collect
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Collect Modal */}
      {showCollectModal && selectedPayment && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px',
        }}>
          <div className="glass-panel" style={{ maxWidth: '500px', width: '100%', padding: '32px', display: 'flex', flexDirection: 'column', gap: '20px' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-glass)', paddingBottom: '12px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Wallet size={20} style={{ color: 'var(--color-primary)' }} />
                Collect Payment / تسجيل تحصيل دفعة
              </h3>
              <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '1.1rem' }} onClick={() => setShowCollectModal(false)}>
                ✕
              </button>
            </div>

            <div style={{ fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '8px', padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-sm)' }}>
              <div>Client: <strong>{selectedPayment.client_name}</strong></div>
              <div>Contract: <strong>{selectedPayment.contract_number}</strong></div>
              <div>Installment: <strong>{selectedPayment.installment_number === 0 ? 'EOI Deposit' : `#${selectedPayment.installment_number}`}</strong></div>
              <div>Scheduled Amount: <strong style={{ color: 'var(--color-primary)' }}>{selectedPayment.amount.toLocaleString()} EGP</strong></div>
              <div>Due Date: <strong>{selectedPayment.due_date}</strong></div>
            </div>

            <form onSubmit={handleCollectSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">Payment Method / طريقة الدفع</label>
                <select className="form-control" value={collectGateway} onChange={e => setCollectGateway(e.target.value as any)}>
                  <option value="cash">💵 Cash (نقدي)</option>
                  <option value="bank_transfer">🏛️ Bank Transfer (تحويل بنكي)</option>
                  <option value="stripe">💳 Stripe (بوابة إلكترونية)</option>
                  <option value="fawry">⚡ Fawry (فوري)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Amount Collected / القيمة المحصلة (EGP)</label>
                <input
                  type="number"
                  className="form-control"
                  value={collectAmount}
                  onChange={e => setCollectAmount(e.target.value)}
                  placeholder="Enter collected amount"
                  required
                />
                {parseFloat(collectAmount) < selectedPayment.amount && (
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-warning)', marginTop: '4px', display: 'block' }}>
                    ⚠️ Warning: This is a partial payment. A new pending installment of {(selectedPayment.amount - parseFloat(collectAmount)).toLocaleString()} EGP will be created for the remainder.
                  </span>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Receipt / Transaction Reference (رقم الإيصال / المعاملة)</label>
                <input
                  type="text"
                  className="form-control"
                  value={collectRef}
                  onChange={e => setCollectRef(e.target.value)}
                  placeholder="e.g. REC-10294 or bank txn reference"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Notes / ملاحظات</label>
                <textarea
                  className="form-control"
                  value={collectNotes}
                  onChange={e => setCollectNotes(e.target.value)}
                  placeholder="Optional collections notes..."
                  rows={3}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button type="button" className="btn-secondary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setShowCollectModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" style={{ flex: 1, justifyContent: 'center' }} disabled={isCollecting}>
                  {isCollecting ? 'Recording...' : 'Confirm Receipt'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Payments;
