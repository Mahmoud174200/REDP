import React, { useState, useEffect } from 'react';
import { Wallet, TrendingUp, TrendingDown, CreditCard, Clock, CheckCircle, AlertCircle, ArrowUpRight, ArrowDownRight, DollarSign, Calendar, BarChart3 } from 'lucide-react';
import api from '../../services/api';

interface PaymentEntry {
  id: string;
  contract_number: string;
  client_name: string;
  unit_number: string;
  project_name: string;
  installment_number: number;
  amount: number;
  penalty_amount: number;
  penalty_waived: boolean;
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
    bank_balance: 0,
    this_month_expected: 0,
    next_month_expected: 0,
    this_year_expected: 0,
    compound_stats: [] as any[]
  });

  const [expandedCompound, setExpandedCompound] = useState<string | null>(null);

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
          project_name: p.contract?.unit?.project?.name || 'N/A',
          installment_number: p.installment_number,
          amount: parseFloat(p.amount) || 0,
          penalty_amount: parseFloat(p.penalty_amount) || 0,
          penalty_waived: !!p.penalty_waived,
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

  const handlePrintReceipt = (payment: any) => {
    const receiptWindow = window.open('', '_blank');
    if (!receiptWindow) {
      alert('Popup blocker prevented opening the receipt. Please allow popups.');
      return;
    }

    const clientName = payment.client_name || 'N/A';
    const unitNumber = payment.unit_number || 'N/A';
    const projectName = payment.project_name || 'N/A';
    const contractNum = payment.contract_number || 'N/A';
    
    const amountVal = parseFloat(payment.amount) || 0;
    const penaltyVal = parseFloat(payment.penalty_amount) || 0;
    const totalVal = amountVal + penaltyVal;
    
    const dateStr = payment.paid_at ? new Date(payment.paid_at).toLocaleString('ar-EG') : new Date().toLocaleString('ar-EG');
    const paymentMethodMap: Record<string, string> = {
      cash: '💵 Cash / نقدي',
      bank_transfer: '🏛️ Bank Transfer / تحويل بنكي',
      stripe: '💳 Credit Card (Stripe) / فيزا',
      fawry: '⚡ Fawry / فوري'
    };
    const methodText = paymentMethodMap[payment.gateway] || payment.gateway || 'Manual / يدوي';

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="ar" dir="rtl">
      <head>
        <meta charset="UTF-8">
        <title>إيصال استلام نقدية - REDP</title>
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;800&family=Cairo:wght@400;600;700&display=swap" rel="stylesheet">
        <style>
          body {
            font-family: 'Cairo', 'Outfit', sans-serif;
            background: #ffffff;
            color: #1d2d24;
            margin: 0;
            padding: 40px;
            direction: rtl;
            text-align: right;
          }
          .receipt-box {
            border: 2px solid #32473a;
            border-radius: 16px;
            padding: 30px;
            max-width: 750px;
            margin: 0 auto;
            background: #fcfdfc;
            box-shadow: 0 4px 12px rgba(50, 71, 58, 0.05);
            position: relative;
          }
          .receipt-box::after {
            content: '';
            position: absolute;
            top: 0; left: 0; right: 0; bottom: 0;
            border: 1px solid rgba(50, 71, 58, 0.1);
            border-radius: 14px;
            pointer-events: none;
            margin: 4px;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 2px solid #32473a;
            padding-bottom: 20px;
            margin-bottom: 25px;
          }
          .logo-area h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 800;
            color: #32473a;
            letter-spacing: 2px;
          }
          .logo-area p {
            margin: 2px 0 0 0;
            font-size: 11px;
            color: #5c7064;
            letter-spacing: 1px;
          }
          .title-area {
            text-align: left;
          }
          .title-area h2 {
            margin: 0;
            font-size: 20px;
            font-weight: 700;
            color: #32473a;
          }
          .title-area p {
            margin: 4px 0 0 0;
            font-size: 13px;
            color: #5c7064;
          }
          .details-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
          }
          .details-table td {
            padding: 12px 10px;
            border-bottom: 1px dashed rgba(50, 71, 58, 0.15);
            font-size: 14px;
          }
          .details-table td.label {
            font-weight: 700;
            color: #5c7064;
            width: 35%;
          }
          .details-table td.value {
            color: #1d2d24;
          }
          .amount-box {
            background: #e4ede2;
            border: 1.5px solid #32473a;
            border-radius: 8px;
            padding: 15px;
            text-align: center;
            margin-bottom: 30px;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .amount-box span {
            font-size: 16px;
            font-weight: 700;
            color: #32473a;
          }
          .amount-box strong {
            font-size: 22px;
            color: #2e7d32;
          }
          .footer-sigs {
            display: flex;
            justify-content: space-between;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid rgba(50, 71, 58, 0.1);
          }
          .sig-block {
            text-align: center;
            width: 45%;
          }
          .sig-block p {
            font-size: 13px;
            color: #5c7064;
            margin: 0 0 45px 0;
          }
          .sig-line {
            border-top: 1.5px solid #32473a;
            width: 180px;
            margin: 0 auto;
            padding-top: 5px;
            font-size: 12px;
            color: #1d2d24;
            font-weight: 600;
          }
          .watermark {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(-15deg);
            font-size: 90px;
            font-weight: 800;
            color: rgba(46, 125, 50, 0.04);
            z-index: 0;
            pointer-events: none;
            user-select: none;
            letter-spacing: 5px;
          }
          @media print {
            body {
              padding: 0;
              background: #ffffff;
            }
            .receipt-box {
              border: none;
              box-shadow: none;
              padding: 10px;
              max-width: 100%;
            }
            .receipt-box::after {
              display: none;
            }
          }
        </style>
      </head>
      <body>
        <div class="receipt-box">
          <div class="watermark">REDP</div>
          
          <div class="header">
            <div class="logo-area">
              <h1>REDP</h1>
              <p>REAL ESTATE DEVELOPMENT</p>
            </div>
            <div class="title-area">
              <h2>إيصال استلام نقدية</h2>
              <p>OFFICIAL RECEIPT</p>
            </div>
          </div>

          <div class="amount-box">
            <span>المبلغ الإجمالي المستلم / Total Amount Received:</span>
            <strong>${totalVal.toLocaleString('ar-EG')} جنيه مصري / EGP</strong>
          </div>

          <table class="details-table">
            <tr>
              <td class="label">رقم الإيصال / Receipt No:</td>
              <td class="value"><strong>REC-${payment.id}</strong></td>
            </tr>
            <tr>
              <td class="label">تاريخ التحصيل / Date:</td>
              <td class="value">${dateStr}</td>
            </tr>
            <tr>
              <td class="label">استلمنا من السيد/السيدة / Received From:</td>
              <td class="value"><strong>${clientName}</strong></td>
            </tr>
            <tr>
              <td class="label">قيمة القسط الأساسي / Installment Amount:</td>
              <td class="value">${amountVal.toLocaleString('ar-EG')} جنيه مصري / EGP</td>
            </tr>
            ${penaltyVal > 0 ? `
            <tr>
              <td class="label" style="color: #c62828;">غرامة التأخير المحصلة / Late Penalty Paid:</td>
              <td class="value" style="color: #c62828; font-weight: bold;">${penaltyVal.toLocaleString('ar-EG')} جنيه مصري / EGP</td>
            </tr>
            ` : ''}
            <tr>
              <td class="label">وذلك قيمة / For:</td>
              <td class="value">
                ${payment.installment_number === 0 ? 'مقدم التعاقد / Down Payment' : `قسط شهر ${payment.installment_number} / Installment Month ${payment.installment_number}`} 
                - بموجب عقد رقم: (${contractNum})
              </td>
            </tr>
            <tr>
              <td class="label">الوحدة / Unit:</td>
              <td class="value">وحدة رقم (${unitNumber}) - مشروع (${projectName})</td>
            </tr>
            <tr>
              <td class="label">طريقة الدفع / Payment Method:</td>
              <td class="value">${methodText}</td>
            </tr>
            ${payment.transaction_ref || payment.transaction_reference ? `
            <tr>
              <td class="label">رقم المعاملة / Reference No:</td>
              <td class="value"><code style="font-family: monospace; font-weight: 600;">${payment.transaction_ref || payment.transaction_reference}</code></td>
            </tr>
            ` : ''}
            ${payment.notes ? `
            <tr>
              <td class="label">ملاحظات / Notes:</td>
              <td class="value"><em>${payment.notes}</em></td>
            </tr>
            ` : ''}
          </table>

          <div class="footer-sigs">
            <div class="sig-block">
              <p>توقيع المستلم / Receiver Signature</p>
              <div class="sig-line">موظف الحسابات / Accounts Officer</div>
            </div>
            <div class="sig-block">
              <p>خاتم الشركة / Official Seal</p>
              <div class="sig-line">خزينة الشركة / REDP Treasury</div>
            </div>
          </div>
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 300);
          }
        </script>
      </body>
      </html>
    `;

    receiptWindow.document.open();
    receiptWindow.document.write(htmlContent);
    receiptWindow.document.close();
  };

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
        
        // Print Receipt Automatically
        const printedPayment = {
          ...selectedPayment,
          ...res.data.data,
        };
        handlePrintReceipt(printedPayment);
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

      {/* Expected Collections & Forecasts */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <TrendingUp size={18} style={{ color: 'var(--color-success)' }} />
          Expected Collections & Forecasts / تدفقات التحصيل المتوقعة والمستقبلية
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
          {[
            { label: 'Expected This Month / المتوقع تحصيله هذا الشهر', value: dashboardStats.this_month_expected || 0, color: 'var(--color-primary)', bg: 'rgba(50, 71, 58, 0.04)' },
            { label: 'Expected Next Month / المتوقع تحصيله الشهر القادم', value: dashboardStats.next_month_expected || 0, color: 'var(--color-success)', bg: 'rgba(46, 125, 50, 0.04)' },
            { label: 'Remaining Current Year Expected / المستحقات الجارية لهذه السنة', value: dashboardStats.this_year_expected || 0, color: 'var(--color-warning)', bg: 'rgba(208, 148, 30, 0.04)' },
          ].map((card, i) => (
            <div key={i} style={{ padding: '16px 20px', borderRadius: 'var(--radius-sm)', background: card.bg, border: '1px solid var(--border-glass)' }}>
              <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)' }}>{card.label}</span>
              <h4 style={{ fontSize: '1.3rem', fontWeight: 800, color: card.color, marginTop: '8px', marginBottom: '4px' }}>
                {(card.value).toLocaleString()} <span style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-muted)' }}>EGP</span>
              </h4>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Estimated liquidity flow</span>
            </div>
          ))}
        </div>
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

      {/* Compound & Unit Breakdown Accordion */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <BarChart3 size={18} style={{ color: 'var(--color-primary)' }} />
          Portfolio Breakdown by Compound & Unit Receivables / تقسيم مديونيات الكومبوندات والوحدات
        </h3>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
          View total contracts value, collected revenues, and outstanding debts grouped by real estate project/compound. Click on a project to show individual unit ledgers.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {!dashboardStats.compound_stats || dashboardStats.compound_stats.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              No active compounds or contract data found.
            </div>
          ) : (
            dashboardStats.compound_stats.map((compound: any) => {
              const isExpanded = expandedCompound === compound.project_name;
              const percentCollected = Math.round((compound.paid_amount / Math.max(1, compound.total_amount)) * 100);
              
              return (
                <div key={compound.project_name} className="glass-panel" style={{ padding: '16px', background: isExpanded ? 'rgba(255, 255, 255, 0.45)' : 'rgba(255, 255, 255, 0.25)', border: '1px solid var(--border-glass)', transition: 'var(--transition-smooth)' }}>
                  {/* Summary Bar */}
                  <div 
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                    onClick={() => setExpandedCompound(isExpanded ? null : compound.project_name)}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <span style={{ fontSize: '1.3rem' }}>🏢</span>
                      <div>
                        <h4 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>{compound.project_name}</h4>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{compound.total_contracts} active contracts</span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Portfolio Value</span>
                        <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>{compound.total_amount.toLocaleString()} EGP</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Collected</span>
                        <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-success)' }}>{compound.paid_amount.toLocaleString()} EGP</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Outstanding</span>
                        <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-danger)' }}>{compound.outstanding.toLocaleString()} EGP</div>
                      </div>

                      {/* Progress Bar */}
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', width: '90px' }}>
                        <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--color-primary)', marginBottom: '2px' }}>{percentCollected}%</span>
                        <div style={{ width: '100%', height: '4px', background: 'rgba(0,0,0,0.05)', borderRadius: '2px' }}>
                          <div style={{ width: `${percentCollected}%`, height: '100%', background: 'var(--color-success)', borderRadius: '2px' }} />
                        </div>
                      </div>

                      {/* Expand Arrow */}
                      <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s' }}>
                        ▼
                      </span>
                    </div>
                  </div>

                  {/* Expanded Unit List Table */}
                  {isExpanded && (
                    <div style={{ marginTop: '16px', borderTop: '1px solid var(--border-glass)', paddingTop: '16px', overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, fontSize: '0.75rem', margin: 0 }}>
                        <thead>
                          <tr>
                            <th style={{ padding: '8px 12px', background: 'rgba(50, 71, 58, 0.04)', color: 'var(--text-main)', fontWeight: 700, textAlign: 'left', borderBottom: '1px solid var(--border-glass)' }}>Unit # / الوحدة</th>
                            <th style={{ padding: '8px 12px', background: 'rgba(50, 71, 58, 0.04)', color: 'var(--text-main)', fontWeight: 700, textAlign: 'left', borderBottom: '1px solid var(--border-glass)' }}>Contract / العقد</th>
                            <th style={{ padding: '8px 12px', background: 'rgba(50, 71, 58, 0.04)', color: 'var(--text-main)', fontWeight: 700, textAlign: 'left', borderBottom: '1px solid var(--border-glass)' }}>Client / العميل</th>
                            <th style={{ padding: '8px 12px', background: 'rgba(50, 71, 58, 0.04)', color: 'var(--text-main)', fontWeight: 700, textAlign: 'right', borderBottom: '1px solid var(--border-glass)' }}>Total Price / الإجمالي</th>
                            <th style={{ padding: '8px 12px', background: 'rgba(50, 71, 58, 0.04)', color: 'var(--text-main)', fontWeight: 700, textAlign: 'right', borderBottom: '1px solid var(--border-glass)' }}>Paid to Date / المحصل</th>
                            <th style={{ padding: '8px 12px', background: 'rgba(50, 71, 58, 0.04)', color: 'var(--text-main)', fontWeight: 700, textAlign: 'right', borderBottom: '1px solid var(--border-glass)' }}>Outstanding / المتبقي</th>
                            <th style={{ padding: '8px 12px', background: 'rgba(50, 71, 58, 0.04)', color: 'var(--text-main)', fontWeight: 700, textAlign: 'center', borderBottom: '1px solid var(--border-glass)' }}>Status / الحالة</th>
                          </tr>
                        </thead>
                        <tbody>
                          {compound.units.map((unit: any) => {
                            const unitOutstanding = unit.outstanding;
                            return (
                              <tr key={unit.contract_number} style={{ background: 'transparent', transition: 'background 0.2s' }}>
                                <td style={{ padding: '10px 12px', borderBottom: '1px solid rgba(0,0,0,0.03)', fontWeight: 700 }}>Unit {unit.unit_number}</td>
                                <td style={{ padding: '10px 12px', borderBottom: '1px solid rgba(0,0,0,0.03)', color: 'var(--text-muted)' }}>{unit.contract_number}</td>
                                <td style={{ padding: '10px 12px', borderBottom: '1px solid rgba(0,0,0,0.03)' }}>{unit.client_name}</td>
                                <td style={{ padding: '10px 12px', borderBottom: '1px solid rgba(0,0,0,0.03)', textAlign: 'right', fontWeight: 600 }}>{unit.total_amount.toLocaleString()} EGP</td>
                                <td style={{ padding: '10px 12px', borderBottom: '1px solid rgba(0,0,0,0.03)', textAlign: 'right', color: 'var(--color-success)', fontWeight: 600 }}>{unit.paid_amount.toLocaleString()} EGP</td>
                                <td style={{ padding: '10px 12px', borderBottom: '1px solid rgba(0,0,0,0.03)', textAlign: 'right', color: unitOutstanding > 0 ? 'var(--color-danger)' : 'var(--color-success)', fontWeight: 700 }}>
                                  {unitOutstanding.toLocaleString()} EGP
                                </td>
                                <td style={{ padding: '10px 12px', borderBottom: '1px solid rgba(0,0,0,0.03)', textAlign: 'center' }}>
                                  <span className={`badge badge-${unit.status === 'active' ? 'success' : 'info'}`} style={{ fontSize: '0.65rem', padding: '2px 8px' }}>
                                    {unit.status}
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
              );
            })
          )}
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
                    {payment.status === 'pending' ? (
                      <button
                        className="btn-primary"
                        style={{ padding: '6px 12px', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                        onClick={() => handleOpenCollect(payment)}
                      >
                        <DollarSign size={12} /> Collect
                      </button>
                    ) : (
                      <button
                        className="btn-secondary"
                        style={{ padding: '5px 10px', fontSize: '0.7rem', display: 'inline-flex', alignItems: 'center', gap: '4px', borderRadius: '4px' }}
                        onClick={() => handlePrintReceipt(payment)}
                      >
                        🖨️ Receipt
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
        <div className="modal-backdrop" onClick={() => setShowCollectModal(false)}>
          <div className="modal-content" style={{ maxWidth: '500px', width: '100%', padding: '32px', display: 'flex', flexDirection: 'column', gap: '20px', position: 'relative' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-glass)', paddingBottom: '12px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                <Wallet size={20} style={{ color: 'var(--color-primary)' }} />
                Collect Payment
              </h3>
              <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '1.1rem' }} onClick={() => setShowCollectModal(false)}>
                ✕
              </button>
            </div>

            <div style={{ fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '6px', padding: '12px', background: 'rgba(50, 71, 58, 0.05)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-glass)' }}>
              <div>Client: <strong>{selectedPayment.client_name}</strong></div>
              <div>Contract: <strong>{selectedPayment.contract_number}</strong></div>
              <div>Installment: <strong>{selectedPayment.installment_number === 0 ? 'EOI Deposit' : `#${selectedPayment.installment_number}`}</strong></div>
              <div>Scheduled Amount: <strong>{selectedPayment.amount.toLocaleString()} EGP</strong></div>
              <div>Due Date: <strong>{selectedPayment.due_date}</strong></div>
              {selectedPayment.penalty_amount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(239, 68, 68, 0.08)', padding: '6px 10px', borderRadius: '4px', border: '1px solid rgba(239, 68, 68, 0.15)', marginTop: '4px' }}>
                  <span style={{ color: 'var(--color-danger)', fontWeight: 600 }}>
                    ⚠️ Late Penalty (10%): {selectedPayment.penalty_amount.toLocaleString()} EGP
                  </span>
                  <button
                    type="button"
                    className="btn-secondary"
                    style={{ padding: '3px 8px', fontSize: '0.65rem', background: '#ffffff', color: 'var(--color-danger)', border: '1px solid var(--color-danger)' }}
                    onClick={async () => {
                      if (confirm('Are you sure you want to waive this overdue penalty?')) {
                        try {
                          const res = await api.post(`/v1/finance/payments/${selectedPayment.id}/waive-penalty`);
                          if (res.data?.success) {
                            alert('Penalty waived successfully.');
                            setSelectedPayment({
                              ...selectedPayment,
                              penalty_amount: 0,
                              penalty_waived: true
                            });
                            fetchData();
                          }
                        } catch (err: any) {
                          alert(err.response?.data?.message || 'Failed to waive penalty.');
                        }
                      }
                    }}
                  >
                    Waive Penalty
                  </button>
                </div>
              )}
              {selectedPayment.penalty_amount > 0 && (
                <div style={{ fontSize: '0.85rem', fontWeight: 700, borderTop: '1px solid var(--border-glass)', paddingTop: '6px', marginTop: '6px', color: 'var(--color-primary)' }}>
                  Total Due (with penalty): {(selectedPayment.amount + selectedPayment.penalty_amount).toLocaleString()} EGP
                </div>
              )}
            </div>

            <form onSubmit={handleCollectSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 700, fontSize: '0.75rem' }}>Payment Method</label>
                <select className="form-control" value={collectGateway} onChange={e => setCollectGateway(e.target.value as any)} style={{ fontSize: '0.8rem' }}>
                  <option value="cash">💵 Cash</option>
                  <option value="bank_transfer">🏛️ Bank Transfer</option>
                  <option value="stripe">💳 Stripe</option>
                  <option value="fawry">⚡ Fawry</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 700, fontSize: '0.75rem' }}>Amount Collected (EGP)</label>
                <input
                  type="number"
                  className="form-control"
                  value={collectAmount}
                  onChange={e => setCollectAmount(e.target.value)}
                  placeholder="Enter collected amount"
                  required
                  style={{ fontSize: '0.8rem' }}
                />
                {parseFloat(collectAmount) < selectedPayment.amount && (
                  <span style={{ fontSize: '0.7rem', color: 'var(--color-warning)', marginTop: '4px', display: 'block' }}>
                    ⚠️ Warning: This is a partial payment. A new pending installment of {(selectedPayment.amount - parseFloat(collectAmount)).toLocaleString()} EGP will be created for the remainder.
                  </span>
                )}
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 700, fontSize: '0.75rem' }}>Receipt / Transaction Reference</label>
                <input
                  type="text"
                  className="form-control"
                  value={collectRef}
                  onChange={e => setCollectRef(e.target.value)}
                  placeholder="e.g. REC-10294 or bank txn reference"
                  style={{ fontSize: '0.8rem' }}
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 700, fontSize: '0.75rem' }}>Notes</label>
                <textarea
                  className="form-control"
                  value={collectNotes}
                  onChange={e => setCollectNotes(e.target.value)}
                  placeholder="Optional collections notes..."
                  rows={2}
                  style={{ fontSize: '0.8rem' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button type="button" className="btn-secondary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setShowCollectModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" style={{ flex: 1, justifyContent: 'center', background: 'var(--color-success)', borderColor: 'var(--color-success)' }} disabled={isCollecting}>
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
