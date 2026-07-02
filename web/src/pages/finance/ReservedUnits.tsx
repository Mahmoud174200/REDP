import React, { useState, useEffect } from 'react';
import { Building2, Search, Filter, ArrowUpRight, ArrowDownRight, Wallet, Percent, DollarSign, Clock, CheckCircle, AlertTriangle, X, Calendar } from 'lucide-react';
import api from '../../services/api';

interface ReservedUnit {
  id: string;
  contract_number: string;
  status: string;
  type: string;
  unit_id: string | null;
  unit_number: string;
  floor: string | number;
  area: number;
  unit_type: string;
  project_name: string;
  client_name: string;
  client_email: string;
  client_phone: string;
  original_price: number;
  contract_price: number;
  price_difference: number;
  price_status: 'exact' | 'discounted' | 'interest_markup';
  paid_amount: number;
  remaining_amount: number;
  payment_progress: number;
  total_installments: number;
  unpaid_installments: number;
}

const ReservedUnits: React.FC = () => {
  const [reservedUnits, setReservedUnits] = useState<ReservedUnit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterProject, setFilterProject] = useState('all');
  const [filterPriceStatus, setFilterPriceStatus] = useState('all');

  // Schedule View States
  const [selectedContract, setSelectedContract] = useState<any | null>(null);
  const [isLoadingSchedule, setIsLoadingSchedule] = useState(false);

  // Collection Modal States (nested)
  const [selectedPaymentForCollection, setSelectedPaymentForCollection] = useState<any | null>(null);
  const [collectAmount, setCollectAmount] = useState('');
  const [collectGateway, setCollectGateway] = useState<'cash' | 'bank_transfer' | 'stripe' | 'fawry'>('cash');
  const [collectRef, setCollectRef] = useState('');
  const [collectNotes, setCollectNotes] = useState('');
  const [isCollecting, setIsCollecting] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/v1/finance/reserved-units');
      if (res.data?.success) {
        setReservedUnits(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch reserved units:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filtered = reservedUnits.filter(u => {
    const matchSearch = searchTerm === '' ||
      u.unit_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.project_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.contract_number.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchProject = filterProject === 'all' || u.project_name === filterProject;
    const matchPriceStatus = filterPriceStatus === 'all' || u.price_status === filterPriceStatus;

    return matchSearch && matchProject && matchPriceStatus;
  });

  // Extract unique projects for filter
  const uniqueProjects = Array.from(new Set(reservedUnits.map(u => u.project_name)));

  // Global KPIs calculation
  const totalUnits = filtered.length;
  const originalBookValue = filtered.reduce((sum, u) => sum + u.original_price, 0);
  const contractedValue = filtered.reduce((sum, u) => sum + u.contract_price, 0);
  const netDelta = contractedValue - originalBookValue;
  const totalCollected = filtered.reduce((sum, u) => sum + u.paid_amount, 0);
  const totalRemaining = filtered.reduce((sum, u) => sum + u.remaining_amount, 0);

  const handleOpenSchedule = async (unit: ReservedUnit) => {
    setIsLoadingSchedule(true);
    // Initialize temporary skeleton with loaded data from the main list row
    setSelectedContract({
      id: unit.id,
      contract_number: unit.contract_number,
      client_name: unit.client_name,
      unit_number: unit.unit_number,
      project_name: unit.project_name,
      status: unit.status,
      total_amount: unit.contract_price,
      paid_amount: unit.paid_amount,
      type: unit.type,
      client: { name: unit.client_name, email: unit.client_email, phone: unit.client_phone },
      payments: []
    });
    
    try {
      const res = await api.get(`/v1/finance/payments/${unit.id}`);
      if (res.data?.success) {
        setSelectedContract(res.data.contract);
      }
    } catch (err) {
      console.error('Failed to load contract schedule:', err);
    } finally {
      setIsLoadingSchedule(false);
    }
  };

  const handleOpenCollect = (payment: any) => {
    setSelectedPaymentForCollection(payment);
    setCollectAmount(payment.amount.toString());
    setCollectGateway('cash');
    setCollectRef('');
    setCollectNotes('');
  };

  const handlePrintReceipt = (payment: any) => {
    const receiptWindow = window.open('', '_blank');
    if (!receiptWindow) {
      alert('Popup blocker prevented opening the receipt. Please allow popups.');
      return;
    }

    const clientName = selectedContract?.client?.name || selectedContract?.client_name || payment.client_name || 'N/A';
    const unitNumber = selectedContract?.unit?.unit_number || selectedContract?.unit_number || payment.unit_number || 'N/A';
    const projectName = selectedContract?.unit?.project?.name || selectedContract?.project_name || payment.project_name || 'N/A';
    const contractNum = selectedContract?.contract_number || payment.contract_number || 'N/A';
    
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

  const handleCollectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPaymentForCollection || !selectedContract) return;

    const amountNum = parseFloat(collectAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      alert('Please enter a valid amount.');
      return;
    }

    if (amountNum > parseFloat(selectedPaymentForCollection.amount)) {
      alert('Collected amount cannot exceed the scheduled installment amount.');
      return;
    }

    setIsCollecting(true);
    try {
      const res = await api.post(`/v1/finance/payments/${selectedPaymentForCollection.id}/collect`, {
        amount: amountNum,
        gateway: collectGateway,
        transaction_reference: collectRef,
        notes: collectNotes
      });

      if (res.data?.success) {
        alert(res.data.message || 'Payment collected successfully.');
        
        // Print Receipt Automatically
        const printedPayment = {
          ...selectedPaymentForCollection,
          ...res.data.data,
        };
        handlePrintReceipt(printedPayment);

        setSelectedPaymentForCollection(null);
        
        // Refresh schedule modal details
        if (selectedContract.id) {
          const scheduleRes = await api.get(`/v1/finance/payments/${selectedContract.id}`);
          if (scheduleRes.data?.success) {
            setSelectedContract(scheduleRes.data.contract);
          }
        }
        
        // Refresh main reserved units list in background
        fetchData();
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
        <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 600 }}>Loading reserved units portfolio...</span>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Header */}
      <div className="glass-panel" style={{ padding: '28px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Building2 style={{ color: 'var(--color-primary)' }} />
            Reserved & Sold Units Portfolio / محفظة الوحدات المحجوزة والمباعة
          </h1>
          <p style={{ fontSize: '0.85rem' }}>Financial analysis of contract pricing, book value deviations, and payment collections progress</p>
        </div>
        <div style={{ padding: '6px 14px', background: 'rgba(50, 71, 58, 0.08)', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-sm)' }}>
          <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-primary)', letterSpacing: '0.05em' }}>OFFICIAL LEDGER AUDIT</span>
        </div>
      </div>

      {/* KPI Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px' }}>
        {[
          { label: 'Active Reservations', value: totalUnits, icon: <Building2 size={18} />, color: 'var(--color-primary)', bg: 'rgba(50,71,58,0.06)' },
          { label: 'Original Value', value: `${(originalBookValue / 1000000).toFixed(2)}M EGP`, icon: <Percent size={18} />, color: 'var(--text-main)', bg: 'rgba(0,0,0,0.03)' },
          { label: 'Contract Value', value: `${(contractedValue / 1000000).toFixed(2)}M EGP`, icon: <DollarSign size={18} />, color: 'var(--color-success)', bg: 'rgba(46,125,50,0.06)' },
          { 
            label: 'Net Price Delta', 
            value: `${Math.abs(netDelta / 1000000).toFixed(2)}M EGP`, 
            icon: netDelta >= 0 ? <ArrowUpRight size={18} /> : <ArrowDownRight size={18} />, 
            color: netDelta >= 0 ? 'var(--color-success)' : 'var(--color-danger)', 
            bg: netDelta >= 0 ? 'rgba(46,125,50,0.06)' : 'rgba(239,68,68,0.06)',
            sub: netDelta >= 0 ? '📈 Interest Surplus' : '📉 Discount Deficit'
          },
          { label: 'Total Outstanding', value: `${(totalRemaining / 1000000).toFixed(2)}M EGP`, icon: <Clock size={18} />, color: 'var(--color-warning)', bg: 'rgba(208,148,30,0.06)' },
        ].map((card, i) => (
          <div key={i} className="glass-panel" style={{ padding: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.65rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{card.label}</span>
              <div style={{ padding: '6px', borderRadius: '4px', background: card.bg }}>
                <div style={{ color: card.color }}>{card.icon}</div>
              </div>
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: card.color }}>{card.value}</h3>
            {card.sub ? (
              <span style={{ fontSize: '0.65rem', fontWeight: 600, color: card.color, marginTop: '2px', display: 'block' }}>{card.sub}</span>
            ) : (
              <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Treasury Portfolio</span>
            )}
          </div>
        ))}
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-panel" style={{ padding: '16px 24px', display: 'flex', gap: '12px', alignItems: 'center' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <Search style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', width: '16px', height: '16px', color: 'var(--text-muted)' }} />
          <input
            className="form-control"
            placeholder="Search by client, unit number, project, or contract number..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{ paddingLeft: '40px', fontSize: '0.85rem' }}
          />
        </div>
        <select
          className="form-control"
          value={filterProject}
          onChange={e => setFilterProject(e.target.value)}
          style={{ width: '180px', fontSize: '0.85rem' }}
        >
          <option value="all">All Compounds</option>
          {uniqueProjects.map((p, idx) => (
            <option key={idx} value={p}>{p}</option>
          ))}
        </select>
        <select
          className="form-control"
          value={filterPriceStatus}
          onChange={e => setFilterPriceStatus(e.target.value)}
          style={{ width: '180px', fontSize: '0.85rem' }}
        >
          <option value="all">All Price Deviations</option>
          <option value="exact">Exact Book Price</option>
          <option value="discounted">Discounted (Cash Plan)</option>
          <option value="interest_markup">Markup (Installment Interests)</option>
        </select>
      </div>

      {/* Units Table */}
      <div className="glass-panel" style={{ padding: '24px', overflowX: 'auto' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '16px' }}>Reserved Units Ledger</h3>
        <table className="premium-table">
          <thead>
            <tr>
              <th>Unit / Project</th>
              <th>Client Profile</th>
              <th>Contract Plan</th>
              <th>Book Price (EGP)</th>
              <th>Contract Price (EGP)</th>
              <th>Treasury Delta</th>
              <th>Collection Progress</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                  No reserved units found matching the selected filters.
                </td>
              </tr>
            ) : (
              filtered.map(unit => {
                let deltaColor = 'var(--text-main)';
                let deltaText = 'Exact';
                let deltaIcon = null;

                if (unit.price_status === 'discounted') {
                  deltaColor = 'var(--color-danger)';
                  deltaText = `-${Math.abs(unit.price_difference).toLocaleString()} EGP (Discount)`;
                  deltaIcon = <ArrowDownRight size={12} style={{ color: 'var(--color-danger)', display: 'inline' }} />;
                } else if (unit.price_status === 'interest_markup') {
                  deltaColor = 'var(--color-success)';
                  deltaText = `+${unit.price_difference.toLocaleString()} EGP (Interest)`;
                  deltaIcon = <ArrowUpRight size={12} style={{ color: 'var(--color-success)', display: 'inline' }} />;
                }

                return (
                  <tr key={unit.id}>
                    <td>
                      <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>{unit.unit_number}</div>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        {unit.project_name} • {unit.unit_type} • Floor {unit.floor}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: '0.82rem' }}>{unit.client_name}</div>
                      <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                        {unit.client_phone}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${unit.type === 'installment' ? 'badge-warning' : 'badge-success'}`} style={{ textTransform: 'capitalize', fontSize: '0.68rem' }}>
                        {unit.type}
                      </span>
                      {unit.type === 'installment' && (
                        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                          Installments: {unit.total_installments - unit.unpaid_installments} / {unit.total_installments} Paid
                        </div>
                      )}
                    </td>
                    <td style={{ fontSize: '0.82rem', fontWeight: 600 }}>
                      {unit.original_price.toLocaleString()}
                    </td>
                    <td style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-primary)' }}>
                      {unit.contract_price.toLocaleString()}
                    </td>
                    <td style={{ fontSize: '0.78rem', fontWeight: 600, color: deltaColor }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                        {deltaIcon}
                        {deltaText}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: '150px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem' }}>
                          <span style={{ color: 'var(--color-success)', fontWeight: 600 }}>{unit.paid_amount.toLocaleString()} EGP Paid</span>
                          <span style={{ color: 'var(--text-muted)' }}>{unit.remaining_amount.toLocaleString()} EGP Left</span>
                        </div>
                        <div style={{ height: '6px', borderRadius: '3px', background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                          <div style={{
                            width: `${unit.payment_progress}%`,
                            height: '100%',
                            borderRadius: '3px',
                            background: unit.payment_progress === 100 
                              ? 'var(--color-success)' 
                              : 'linear-gradient(90deg, var(--color-primary), var(--color-success))'
                          }} />
                        </div>
                        <div style={{ fontSize: '0.65rem', textAlign: 'right', fontWeight: 700, color: 'var(--color-primary)' }}>
                          {unit.payment_progress}% Complete
                        </div>
                      </div>
                    </td>
                    <td>
                      <button
                        className="btn-secondary"
                        onClick={() => handleOpenSchedule(unit)}
                        style={{ padding: '6px 12px', fontSize: '0.72rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                      >
                        <Wallet size={12} /> View Schedule
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* 📅 Installments Schedule Modal */}
      {selectedContract && (
        <div className="modal-backdrop" onClick={() => setSelectedContract(null)}>
          <div className="modal-content" style={{ maxWidth: '900px', width: '100%', padding: '32px', display: 'flex', flexDirection: 'column', gap: '20px', position: 'relative' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-glass)', paddingBottom: '12px' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                <Wallet size={22} style={{ color: 'var(--color-primary)' }} />
                Installments Schedule & Collections / جدول سداد الأقساط
              </h3>
              <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '1.2rem', padding: 0 }} onClick={() => setSelectedContract(null)}>
                ✕
              </button>
            </div>

            {/* Profile Brief header card */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1.5fr', gap: '16px', padding: '16px', background: 'rgba(50, 71, 58, 0.05)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-glass)', fontSize: '0.8rem' }}>
              <div>
                <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>Client Profile</span>
                <div style={{ fontWeight: 700, fontSize: '0.9rem', marginTop: '2px' }}>{selectedContract.client?.name || selectedContract.client_name}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem', marginTop: '2px' }}>✉️ {selectedContract.client?.email || 'N/A'} • 📞 {selectedContract.client?.phone || 'N/A'}</div>
              </div>
              <div>
                <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>Unit & Project</span>
                <div style={{ fontWeight: 700, fontSize: '0.9rem', marginTop: '2px' }}>{selectedContract.unit?.unit_number || selectedContract.unit_number}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem', marginTop: '2px' }}>📍 {selectedContract.unit?.project?.name || selectedContract.project_name}</div>
              </div>
              <div>
                <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>Financial Position</span>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2px', fontWeight: 600 }}>
                  <span>Paid:</span> <span style={{ color: 'var(--color-success)' }}>{(parseFloat(selectedContract.paid_amount) || 0).toLocaleString()} EGP</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  <span>Contract total:</span> <span>{(parseFloat(selectedContract.total_amount) || 0).toLocaleString()} EGP</span>
                </div>
              </div>
            </div>

            {/* Schedule Timeline Table */}
            <div>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '10px' }}>Schedule Ledger / جدول السداد</h4>
              {isLoadingSchedule ? (
                <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                  <div className="animate-spin" style={{ width: '24px', height: '24px', border: '3px solid var(--color-primary)', borderTopColor: 'transparent', borderRadius: '50%' }} />
                  <span>Loading schedule details...</span>
                </div>
              ) : (
                <div style={{ maxHeight: '320px', overflowY: 'auto', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-sm)' }}>
                  <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, fontSize: '0.75rem' }}>
                    <thead>
                      <tr>
                        <th style={{ position: 'sticky', top: 0, background: '#e4ede2', zIndex: 10, padding: '10px 12px', borderBottom: '2px solid var(--border-glass)', color: 'var(--text-main)', fontWeight: 700, textAlign: 'left' }}>Installment</th>
                        <th style={{ position: 'sticky', top: 0, background: '#e4ede2', zIndex: 10, padding: '10px 12px', borderBottom: '2px solid var(--border-glass)', color: 'var(--text-main)', fontWeight: 700, textAlign: 'left' }}>Description</th>
                        <th style={{ position: 'sticky', top: 0, background: '#e4ede2', zIndex: 10, padding: '10px 12px', borderBottom: '2px solid var(--border-glass)', color: 'var(--text-main)', fontWeight: 700, textAlign: 'left' }}>Due Date</th>
                        <th style={{ position: 'sticky', top: 0, background: '#e4ede2', zIndex: 10, padding: '10px 12px', borderBottom: '2px solid var(--border-glass)', color: 'var(--text-main)', fontWeight: 700, textAlign: 'right' }}>Amount</th>
                        <th style={{ position: 'sticky', top: 0, background: '#e4ede2', zIndex: 10, padding: '10px 12px', borderBottom: '2px solid var(--border-glass)', color: 'var(--text-main)', fontWeight: 700, textAlign: 'center' }}>Status</th>
                        <th style={{ position: 'sticky', top: 0, background: '#e4ede2', zIndex: 10, padding: '10px 12px', borderBottom: '2px solid var(--border-glass)', color: 'var(--text-main)', fontWeight: 700, textAlign: 'left' }}>Receipt / Ref</th>
                        <th style={{ position: 'sticky', top: 0, background: '#e4ede2', zIndex: 10, padding: '10px 12px', borderBottom: '2px solid var(--border-glass)', color: 'var(--text-main)', fontWeight: 700, textAlign: 'center' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {!selectedContract.payments || selectedContract.payments.length === 0 ? (
                        <tr>
                          <td colSpan={7} style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                            No installments generated.
                          </td>
                        </tr>
                      ) : (
                        selectedContract.payments.map((payment: any) => {
                          const isOverdue = payment.status === 'pending' && new Date(payment.due_date) < new Date();
                          return (
                            <tr key={payment.id} style={{ background: payment.status === 'paid' ? 'rgba(46, 125, 50, 0.04)' : 'transparent' }}>
                              <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--border-glass)', fontWeight: 600 }}>
                                {payment.installment_number === 0 ? 'Down Payment' : `Month ${payment.installment_number}`}
                              </td>
                              <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--border-glass)', color: 'var(--text-muted)' }}>
                                {payment.transaction_reference || 'Installment payment'}
                              </td>
                              <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--border-glass)' }}>
                                {payment.due_date}
                              </td>
                              <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--border-glass)', textAlign: 'right', fontWeight: 700 }}>
                                {(parseFloat(payment.amount) || 0).toLocaleString()} EGP
                                {parseFloat(payment.penalty_amount) > 0 && (
                                  <div style={{ fontSize: '0.65rem', color: 'var(--color-danger)', fontWeight: 600, marginTop: '2px' }}>
                                    + {(parseFloat(payment.penalty_amount) || 0).toLocaleString()} EGP Late Fee
                                  </div>
                                )}
                              </td>
                              <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--border-glass)', textAlign: 'center' }}>
                                {payment.status === 'paid' && <span className="badge badge-success" style={{ padding: '2px 6px', fontSize: '0.62rem' }}><CheckCircle size={10} style={{ display: 'inline', marginRight: '2px' }} /> Paid</span>}
                                {payment.status === 'pending' && !isOverdue && <span className="badge badge-warning" style={{ padding: '2px 6px', fontSize: '0.62rem' }}><Clock size={10} style={{ display: 'inline', marginRight: '2px' }} /> Pending</span>}
                                {payment.status === 'pending' && isOverdue && <span className="badge badge-danger" style={{ padding: '2px 6px', fontSize: '0.62rem' }}><AlertTriangle size={10} style={{ display: 'inline', marginRight: '2px' }} /> Overdue</span>}
                              </td>
                              <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--border-glass)' }}>
                                {payment.status === 'paid' ? (
                                  <div style={{ fontSize: '0.68rem' }}>
                                    <span style={{ textTransform: 'capitalize', fontWeight: 600 }}>{payment.gateway || 'Manual'}</span>
                                    {payment.transaction_reference && (
                                      <div style={{ fontFamily: 'monospace', color: 'var(--text-muted)', fontSize: '0.6rem' }}>Ref: {payment.transaction_reference}</div>
                                    )}
                                  </div>
                                ) : '—'}
                              </td>
                              <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--border-glass)', textAlign: 'center' }}>
                                {payment.status === 'pending' ? (
                                  <button
                                    className="btn-primary"
                                    onClick={() => handleOpenCollect(payment)}
                                    style={{ padding: '4px 8px', fontSize: '0.65rem', background: 'var(--color-success)', borderColor: 'var(--color-success)' }}
                                  >
                                    Collect
                                  </button>
                                ) : (
                                  <button
                                    className="btn-secondary"
                                    onClick={() => handlePrintReceipt(payment)}
                                    style={{ padding: '3px 6px', fontSize: '0.65rem' }}
                                  >
                                    🖨️ Print
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
              <button className="btn-secondary" onClick={() => setSelectedContract(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* 💳 Nested Collect Payment Modal */}
      {selectedPaymentForCollection && selectedContract && (
        <div className="modal-backdrop" style={{ zIndex: 1100 }} onClick={() => setSelectedPaymentForCollection(null)}>
          <div className="modal-content" style={{ maxWidth: '480px', width: '100%', padding: '30px', display: 'flex', flexDirection: 'column', gap: '20px' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-glass)', paddingBottom: '12px' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                <Wallet size={18} style={{ color: 'var(--color-success)' }} />
                Collect Payment
              </h3>
              <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '1.2rem', padding: 0 }} onClick={() => setSelectedPaymentForCollection(null)}>
                ✕
              </button>
            </div>

            <div style={{ fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '6px', padding: '12px', background: 'rgba(50, 71, 58, 0.05)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-glass)' }}>
              <div>Client: <strong>{selectedContract.client?.name || selectedContract.client_name}</strong></div>
              <div>Contract: <strong>{selectedContract.contract_number}</strong></div>
              <div>Installment: <strong>{selectedPaymentForCollection.installment_number === 0 ? 'Down Payment' : `Month ${selectedPaymentForCollection.installment_number}`}</strong></div>
              <div>Scheduled Amount: <strong>{(parseFloat(selectedPaymentForCollection.amount) || 0).toLocaleString()} EGP</strong></div>
              <div>Due Date: <strong>{selectedPaymentForCollection.due_date}</strong></div>
              {parseFloat(selectedPaymentForCollection.penalty_amount) > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(239, 68, 68, 0.08)', padding: '6px 10px', borderRadius: '4px', border: '1px solid rgba(239, 68, 68, 0.15)', marginTop: '4px' }}>
                  <span style={{ color: 'var(--color-danger)', fontWeight: 600 }}>
                    ⚠️ Late Penalty (10%): {(parseFloat(selectedPaymentForCollection.penalty_amount) || 0).toLocaleString()} EGP
                  </span>
                  <button
                    type="button"
                    className="btn-secondary"
                    style={{ padding: '3px 8px', fontSize: '0.65rem', background: '#ffffff', color: 'var(--color-danger)', border: '1px solid var(--color-danger)' }}
                    onClick={async () => {
                      if (confirm('Are you sure you want to waive this overdue penalty?')) {
                        try {
                          const res = await api.post(`/v1/finance/payments/${selectedPaymentForCollection.id}/waive-penalty`);
                          if (res.data?.success) {
                            alert('Penalty waived successfully.');
                            setSelectedPaymentForCollection({
                              ...selectedPaymentForCollection,
                              penalty_amount: '0.00',
                              penalty_waived: true
                            });
                            // Refresh schedule modal
                            const scheduleRes = await api.get(`/v1/finance/payments/${selectedContract.id}`);
                            if (scheduleRes.data?.success) {
                              setSelectedContract(scheduleRes.data.contract);
                            }
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
              {parseFloat(selectedPaymentForCollection.penalty_amount) > 0 && (
                <div style={{ fontSize: '0.85rem', fontWeight: 700, borderTop: '1px solid var(--border-glass)', paddingTop: '6px', marginTop: '6px', color: 'var(--color-primary)' }}>
                  Total Due (with penalty): {((parseFloat(selectedPaymentForCollection.amount) || 0) + (parseFloat(selectedPaymentForCollection.penalty_amount) || 0)).toLocaleString()} EGP
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
                {parseFloat(collectAmount) < parseFloat(selectedPaymentForCollection.amount) && (
                  <span style={{ fontSize: '0.7rem', color: 'var(--color-warning)', marginTop: '4px', display: 'block' }}>
                    ⚠️ Warning: This is a partial payment. A new pending installment of {(parseFloat(selectedPaymentForCollection.amount) - parseFloat(collectAmount)).toLocaleString()} EGP will be created for the remainder.
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
                <button type="button" className="btn-secondary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setSelectedPaymentForCollection(null)}>
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

export default ReservedUnits;
