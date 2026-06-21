import React, { useState, useEffect } from 'react';
import { Wallet, TrendingUp, TrendingDown, CreditCard, Clock, CheckCircle, AlertCircle, ArrowUpRight, ArrowDownRight, DollarSign, Calendar, BarChart3, Users, Building } from 'lucide-react';
import api from '../../services/api';

interface PaymentEntry {
  id: string;
  contract_number: string;
  client_id: string;
  client_name: string;
  unit_number: string;
  project_id: string;
  project_name: string;
  phase: string;
  unit_type: string;
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
  
  // Tab and EOI 5% Verification States
  const [activeMainTab, setActiveMainTab] = useState<'ledger' | 'eoi_verify'>('ledger');
  const [pendingFivePercentReservations, setPendingFivePercentReservations] = useState<any[]>([]);
  const [isEoiLoading, setIsEoiLoading] = useState(false);
  const [showEoiActionModal, setShowEoiActionModal] = useState(false);
  const [selectedEoiRes, setSelectedEoiRes] = useState<any | null>(null);
  const [eoiRejectionNotes, setEoiRejectionNotes] = useState('');
  const [isEoiSubmitting, setIsEoiSubmitting] = useState(false);
  
  // Filter States
  const [filterYear, setFilterYear] = useState('2026');
  const [filterMonth, setFilterMonth] = useState('');
  const [filterProject, setFilterProject] = useState('all');
  const [filterPhase, setFilterPhase] = useState('all');
  const [filterUnitType, setFilterUnitType] = useState('all');
  const [filterCustomer, setFilterCustomer] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  // Filter Dropdown Lists (loaded dynamically from contracts metadata)
  const [projectsList, setProjectsList] = useState<{ id: string; name: string }[]>([]);
  const [clientsList, setClientsList] = useState<{ id: string; name: string }[]>([]);
  const [phasesList, setPhasesList] = useState<string[]>([]);
  const [unitTypesList, setUnitTypesList] = useState<string[]>([]);

  const [dashboardStats, setDashboardStats] = useState<any>({
    total_revenue: 0,
    total_collected: 0,
    total_outstanding: 0,
    cash_balance: 0,
    bank_balance: 0,
    this_month_revenue: 0,
    monthly_revenue_data: Array(12).fill(0),
    yearly_revenue_data: {} as Record<number, number>,
    
    // Customer statistics
    regular_customers: 0,
    overdue_customers: 0,
    average_overdue_days: 0,
    total_penalties: 0,
    pending_penalties: 0,

    // Unit statistics
    available_units: 0,
    reserved_units: 0,
    sold_units: 0,
    withdrawn_units: 0,

    // Forecasting / expected outlays
    expected_cash_flows: {} as Record<string, number>,
    upcoming_installments_sum: 0,
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

  // Load contracts metadata to populate filter options on mount
  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const contractsRes = await api.get('/v1/finance/contracts');
        if (contractsRes.data?.success && contractsRes.data.data) {
          const contracts = contractsRes.data.data;
          const projectsMap = new Map<string, string>();
          const clientsMap = new Map<string, string>();
          const phasesSet = new Set<string>();
          const unitTypesSet = new Set<string>();
          
          contracts.forEach((c: any) => {
            if (c.unit?.project) {
              projectsMap.set(c.unit.project.id, c.unit.project.name);
            }
            if (c.client) {
              clientsMap.set(c.client.id, c.client.name);
            }
            if (c.unit?.phase) {
              phasesSet.add(c.unit.phase);
            }
            if (c.unit?.type) {
              unitTypesSet.add(c.unit.type);
            }
          });
          
          setProjectsList(Array.from(projectsMap.entries()).map(([id, name]) => ({ id, name })));
          setClientsList(Array.from(clientsMap.entries()).map(([id, name]) => ({ id, name })));
          setPhasesList(Array.from(phasesSet));
          setUnitTypesList(Array.from(unitTypesSet));
        }
      } catch (err) {
        console.error('Failed to fetch contracts metadata for filters:', err);
      }
    };
    fetchMetadata();
  }, []);

  const fetchData = async (filters: any) => {
    setIsLoading(true);
    try {
      // Build query string for dashboard stats
      const params = new URLSearchParams();
      params.append('year', filters.year);
      if (filters.month) params.append('month', filters.month);
      if (filters.project_id && filters.project_id !== 'all') params.append('project_id', filters.project_id);
      if (filters.phase && filters.phase !== 'all') params.append('phase', filters.phase);
      if (filters.unit_type && filters.unit_type !== 'all') params.append('unit_type', filters.unit_type);
      if (filters.client_id && filters.client_id !== 'all') params.append('client_id', filters.client_id);
      if (filters.status && filters.status !== 'all') params.append('status', filters.status);

      // Fetch payment ledger records & dashboard stats
      const payRes = await api.get('/v1/finance/payments');
      const dashRes = await api.get(`/v1/finance/dashboard?${params.toString()}`);

      if (payRes.data?.success) {
        const mapped = payRes.data.data.map((p: any) => ({
          id: p.id,
          contract_number: p.contract?.contract_number || 'N/A',
          client_id: p.contract?.client?.id || '',
          client_name: p.contract?.client?.name || 'N/A',
          unit_number: p.contract?.unit?.unit_number || 'N/A',
          project_id: p.contract?.unit?.project?.id || '',
          project_name: p.contract?.unit?.project?.name || 'N/A',
          phase: p.contract?.unit?.phase || '',
          unit_type: p.contract?.unit?.type || '',
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

  // Trigger fetch when any filter state changes
  useEffect(() => {
    fetchData({
      year: filterYear,
      month: filterMonth,
      project_id: filterProject,
      phase: filterPhase,
      unit_type: filterUnitType,
      client_id: filterCustomer,
      status: filterStatus
    });
  }, [filterYear, filterMonth, filterProject, filterPhase, filterUnitType, filterCustomer, filterStatus]);

  const fetchPendingFivePercent = async () => {
    setIsEoiLoading(true);
    try {
      const res = await api.get('/v1/acquisition/eoi-reservations/pending-five-percent');
      if (res.data?.success && res.data.data) {
        setPendingFivePercentReservations(res.data.data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch pending 5% reservations:', err);
    } finally {
      setIsEoiLoading(false);
    }
  };

  useEffect(() => {
    if (activeMainTab === 'eoi_verify') {
      fetchPendingFivePercent();
    }
  }, [activeMainTab]);

  const handleApproveFivePercent = async (resId: string) => {
    if (!confirm('Are you sure you want to approve this 5% downpayment receipt? This will confirm the unit reservation hold. / هل أنت متأكد من قبول إيصال الـ 5%؟')) return;
    setIsEoiSubmitting(true);
    try {
      const res = await api.post(`/v1/acquisition/eoi-reservations/${resId}/approve-five-percent`);
      if (res.data?.success) {
        alert('5% payment approved successfully and client notified. / تم قبول الدفعة بنجاح وإشعار العميل.');
        setShowEoiActionModal(false);
        fetchPendingFivePercent();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to approve 5% payment.');
    } finally {
      setIsEoiSubmitting(false);
    }
  };

  const handleRejectFivePercent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEoiRes || !eoiRejectionNotes.trim()) {
      alert('Please specify a rejection reason. / يرجى كتابة سبب الرفض.');
      return;
    }
    setIsEoiSubmitting(true);
    try {
      const res = await api.post(`/v1/acquisition/eoi-reservations/${selectedEoiRes.id}/reject-five-percent`, {
        notes: eoiRejectionNotes
      });
      if (res.data?.success) {
        alert('5% payment receipt rejected and client notified. / تم رفض الإيصال وإرسال السبب للعميل.');
        setShowEoiActionModal(false);
        setEoiRejectionNotes('');
        fetchPendingFivePercent();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to reject receipt.');
    } finally {
      setIsEoiSubmitting(false);
    }
  };

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
        fetchData({
          year: filterYear,
          month: filterMonth,
          project_id: filterProject,
          phase: filterPhase,
          unit_type: filterUnitType,
          client_id: filterCustomer,
          status: filterStatus
        }); // Refresh list & KPIs
        
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

  // Client-side filtering for ledger table based on unified filter states
  const filtered = payments.filter(p => {
    const matchGateway = selectedGateway === 'all' || p.gateway === selectedGateway;
    
    // Status filter
    let matchStatus = true;
    if (filterStatus !== 'all') {
      if (filterStatus === 'overdue') {
        matchStatus = p.status === 'pending' && new Date(p.due_date) < new Date();
      } else {
        matchStatus = p.status === filterStatus;
      }
    }
    
    // Year filter
    let matchYear = true;
    if (filterYear) {
      const dateToCheck = p.paid_at ? new Date(p.paid_at) : new Date(p.due_date);
      matchYear = dateToCheck.getFullYear().toString() === filterYear;
    }
    
    // Month filter
    let matchMonth = true;
    if (filterMonth) {
      const dateToCheck = p.paid_at ? new Date(p.paid_at) : new Date(p.due_date);
      matchMonth = (dateToCheck.getMonth() + 1).toString() === filterMonth;
    }
    
    // Project filter
    const matchProject = filterProject === 'all' || p.project_id === filterProject;
    
    // Phase filter
    const matchPhase = filterPhase === 'all' || p.phase === filterPhase;
    
    // Unit Type filter
    const matchUnitType = filterUnitType === 'all' || p.unit_type === filterUnitType;
    
    // Customer filter
    const matchCustomer = filterCustomer === 'all' || p.client_id === filterCustomer;

    return matchGateway && matchStatus && matchYear && matchMonth && matchProject && matchPhase && matchUnitType && matchCustomer;
  });

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', flexDirection: 'column', gap: '16px' }}>
        <div className="animate-spin" style={{ width: '40px', height: '40px', border: '4px solid var(--color-primary)', borderTopColor: 'transparent', borderRadius: '50%' }} />
        <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 600 }}>Loading...</span>
      </div>
    );
  }

  // Display aggregates from backend dashboard response
  const totalCollected = dashboardStats.total_collected || 0;
  const totalOutstanding = dashboardStats.total_outstanding || 0;
  const totalRevenue = dashboardStats.total_revenue || 0;
  const cashBalance = dashboardStats.cash_balance || 0;
  const bankBalance = dashboardStats.bank_balance || 0;
  
  const regularCustomers = dashboardStats.regular_customers || 0;
  const overdueCustomers = dashboardStats.overdue_customers || 0;
  const averageOverdueDays = dashboardStats.average_overdue_days || 0;
  const totalPenalties = dashboardStats.total_penalties || 0;
  const pendingPenalties = dashboardStats.pending_penalties || 0;
  
  const availableUnits = dashboardStats.available_units || 0;
  const reservedUnits = dashboardStats.reserved_units || 0;
  const soldUnits = dashboardStats.sold_units || 0;
  const withdrawnUnits = dashboardStats.withdrawn_units || 0;
  
  const thisMonthExpected = dashboardStats.this_month_expected || 0;
  const nextMonthExpected = dashboardStats.next_month_expected || 0;
  const thisYearExpected = dashboardStats.this_year_expected || 0;
  const upcomingInstallmentsSum = dashboardStats.upcoming_installments_sum || 0;

  const paidCount = filtered.filter(p => p.status === 'paid').length;
  const overdueCount = filtered.filter(p => p.status === 'pending' && new Date(p.due_date) < new Date()).length;

  // Monthly revenue chart setup
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthlyData = dashboardStats.monthly_revenue_data || Array(12).fill(0);
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

      {/* Main Tab Navigation */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-glass)', paddingBottom: '4px' }}>
        <button
          className={activeMainTab === 'ledger' ? 'btn-primary' : 'btn-secondary'}
          onClick={() => setActiveMainTab('ledger')}
          style={{ padding: '8px 16px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px', borderRadius: '8px', border: 'none', cursor: 'pointer' }}
        >
          <CreditCard size={16} /> Treasury Ledger & Stats
        </button>
        <button
          className={activeMainTab === 'eoi_verify' ? 'btn-primary' : 'btn-secondary'}
          onClick={() => setActiveMainTab('eoi_verify')}
          style={{ padding: '8px 16px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px', borderRadius: '8px', border: 'none', cursor: 'pointer' }}
        >
          <Building size={16} /> EOI 5% Verification
        </button>
      </div>

      {activeMainTab === 'ledger' ? (
        <>
          {/* Dynamic Multi-Criteria Filters Panel */}
          <div className="glass-panel" style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border-glass)', paddingBottom: '8px' }}>
          <TrendingUp size={16} style={{ color: 'var(--color-primary)' }} />
          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)' }}>Multi-Criteria Financial Filters</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px' }}>
          {/* Year */}
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Fiscal Year</label>
            <select className="form-control" value={filterYear} onChange={e => setFilterYear(e.target.value)} style={{ fontSize: '0.8rem', height: '38px', padding: '6px 12px' }}>
              <option value="2024">2024</option>
              <option value="2025">2025</option>
              <option value="2026">2026</option>
              <option value="2027">2027</option>
            </select>
          </div>

          {/* Month */}
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Month</label>
            <select className="form-control" value={filterMonth} onChange={e => setFilterMonth(e.target.value)} style={{ fontSize: '0.8rem', height: '38px', padding: '6px 12px' }}>
              <option value="">All Months</option>
              <option value="1">January</option>
              <option value="2">February</option>
              <option value="3">March</option>
              <option value="4">April</option>
              <option value="5">May</option>
              <option value="6">June</option>
              <option value="7">July</option>
              <option value="8">August</option>
              <option value="9">September</option>
              <option value="10">October</option>
              <option value="11">November</option>
              <option value="12">December</option>
            </select>
          </div>

          {/* Project */}
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Project</label>
            <select className="form-control" value={filterProject} onChange={e => setFilterProject(e.target.value)} style={{ fontSize: '0.8rem', height: '38px', padding: '6px 12px' }}>
              <option value="all">All Projects</option>
              {projectsList.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          {/* Phase */}
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Phase</label>
            <select className="form-control" value={filterPhase} onChange={e => setFilterPhase(e.target.value)} style={{ fontSize: '0.8rem', height: '38px', padding: '6px 12px' }}>
              <option value="all">All Phases</option>
              {phasesList.map(ph => (
                <option key={ph} value={ph}>{ph}</option>
              ))}
            </select>
          </div>

          {/* Unit Type */}
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Unit Type</label>
            <select className="form-control" value={filterUnitType} onChange={e => setFilterUnitType(e.target.value)} style={{ fontSize: '0.8rem', height: '38px', padding: '6px 12px' }}>
              <option value="all">All Types</option>
              {unitTypesList.map(ut => (
                <option key={ut} value={ut} style={{ textTransform: 'capitalize' }}>{ut}</option>
              ))}
            </select>
          </div>

          {/* Customer */}
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Customer</label>
            <select className="form-control" value={filterCustomer} onChange={e => setFilterCustomer(e.target.value)} style={{ fontSize: '0.8rem', height: '38px', padding: '6px 12px' }}>
              <option value="all">All Customers</option>
              {clientsList.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Payment Status */}
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Payment Status</label>
            <select className="form-control" value={filterStatus} onChange={e => {
              setFilterStatus(e.target.value);
              setSelectedStatus(e.target.value);
            }} style={{ fontSize: '0.8rem', height: '38px', padding: '6px 12px' }}>
              <option value="all">All Statuses</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="overdue">Overdue</option>
              <option value="partial">Partial Payment</option>
            </select>
          </div>

          {/* Clear Filters Button */}
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button 
              type="button" 
              className="btn-secondary" 
              onClick={() => {
                setFilterYear('2026');
                setFilterMonth('');
                setFilterProject('all');
                setFilterPhase('all');
                setFilterUnitType('all');
                setFilterCustomer('all');
                setFilterStatus('all');
                setSelectedStatus('all');
                setSelectedGateway('all');
              }} 
              style={{ fontSize: '0.75rem', height: '38px', width: '100%', justifyContent: 'center' }}
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* Section 1: Revenue & Treasury KPIs */}
      <div>
        <h4 style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>
          Revenue & Treasury Metrics
        </h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px' }}>
          {[
            { label: 'Portfolio Value', value: `${((totalCollected + totalOutstanding) / 1000000).toFixed(2)}M`, sub: `Collected + Outstanding`, icon: <DollarSign size={20} />, color: 'var(--color-primary)', bg: 'rgba(50, 71, 58, 0.08)' },
            { label: 'Total Collected', value: `${(totalCollected / 1000000).toFixed(2)}M`, sub: `${paidCount} payments paid`, icon: <CheckCircle size={20} />, color: 'var(--color-success)', bg: 'rgba(16,185,129,0.08)' },
            { label: 'Total Outstanding', value: `${(totalOutstanding / 1000000).toFixed(2)}M`, sub: `Active contracts backlog`, icon: <Clock size={20} />, color: 'var(--color-warning)', bg: 'rgba(245,158,11,0.08)' },
            { label: 'Treasury Cash Desk', value: `${(cashBalance / 1000000).toFixed(2)}M`, sub: `💵 Physical desk cash`, icon: <Wallet size={20} />, color: '#10b981', bg: 'rgba(16,185,129,0.08)' },
            { label: 'Bank & Gateways', value: `${(bankBalance / 1000000).toFixed(2)}M`, sub: `🏛️ Stripe, Fawry & Transfers`, icon: <CreditCard size={20} />, color: '#3b82f6', bg: 'rgba(59,130,246,0.08)' },
          ].map((card, i) => (
            <div key={i} className="glass-panel" style={{ padding: '20px 16px', borderLeft: `4px solid ${card.color}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <span style={{ fontSize: '0.65rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{card.label}</span>
                <div style={{ padding: '6px', borderRadius: 'var(--radius-sm)', background: card.bg }}>
                  <div style={{ color: card.color }}>{card.icon}</div>
                </div>
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: card.color }}>{card.value} EGP</h3>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{card.sub}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Section 2: Customer Delinquency & Inventory Status */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '20px' }}>
        {/* Customer Stats Card */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Users size={18} style={{ color: 'var(--color-primary)' }} />
            Customer Delinquency & Delay Penalty Analytics
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '20px' }}>
            <div style={{ padding: '12px 16px', background: 'rgba(16, 185, 129, 0.04)', border: '1px solid rgba(16, 185, 129, 0.1)', borderRadius: 'var(--radius-sm)' }}>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Regular Customers</span>
              <h4 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-success)', margin: '4px 0' }}>{regularCustomers}</h4>
              <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>0 overdue payments</span>
            </div>
            <div style={{ padding: '12px 16px', background: 'rgba(239, 68, 68, 0.04)', border: '1px solid rgba(239, 68, 68, 0.1)', borderRadius: 'var(--radius-sm)' }}>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Late Customers</span>
              <h4 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-danger)', margin: '4px 0' }}>{overdueCustomers}</h4>
              <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>1+ overdue payments</span>
            </div>
            <div style={{ padding: '12px 16px', background: 'rgba(245, 158, 11, 0.04)', border: '1px solid rgba(245, 158, 11, 0.1)', borderRadius: 'var(--radius-sm)' }}>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Average Overdue Days</span>
              <h4 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-warning)', margin: '4px 0' }}>{averageOverdueDays} <span style={{ fontSize: '0.8rem', fontWeight: 500 }}>Days</span></h4>
              <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>Avg delay index</span>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'rgba(255, 255, 255, 0.35)', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-sm)' }}>
              <div>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Late Penalties Collected</span>
                <h5 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-success)', margin: '2px 0' }}>{totalPenalties.toLocaleString()} EGP</h5>
              </div>
              <span style={{ fontSize: '1.2rem' }}>💰</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'rgba(255, 255, 255, 0.35)', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-sm)' }}>
              <div>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Pending Penalty Receivables</span>
                <h5 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-danger)', margin: '2px 0' }}>{pendingPenalties.toLocaleString()} EGP</h5>
              </div>
              <span style={{ fontSize: '1.2rem' }}>⚠️</span>
            </div>
          </div>
        </div>

        {/* Inventory Unit Stats Card */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Building size={18} style={{ color: 'var(--color-secondary)' }} />
            Unit Inventory & Withdrawal Ledger
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', height: 'calc(100% - 36px)' }}>
            {[
              { label: 'Available', value: availableUnits, color: 'var(--color-primary)', bg: 'rgba(50, 71, 58, 0.04)', sub: 'Ready for resale' },
              { label: 'Reserved', value: reservedUnits, color: 'var(--color-warning)', bg: 'rgba(245, 158, 11, 0.04)', sub: 'Hold deposit active' },
              { label: 'Sold', value: soldUnits, color: 'var(--color-success)', bg: 'rgba(16, 185, 129, 0.04)', sub: 'Contract signed' },
              { label: 'Withdrawn', value: withdrawnUnits, color: 'var(--color-danger)', bg: 'rgba(239, 68, 68, 0.04)', sub: 'Repossessed contracts' },
            ].map((st, i) => (
              <div key={i} style={{ padding: '10px 14px', background: st.bg, border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-sm)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 600 }}>{st.label} Units</span>
                <h4 style={{ fontSize: '1.4rem', fontWeight: 900, color: st.color, margin: '2px 0' }}>{st.value}</h4>
                <span style={{ fontSize: '0.55rem', color: 'var(--text-muted)' }}>{st.sub}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Section 3: Cash Flow Forecasting timeline */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <TrendingUp size={18} style={{ color: 'var(--color-success)' }} />
          Expected Liquidity Flow & Cash Forecasting (Next 12 Months)
        </h3>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
          Aggregated future receivables from active payment schedules. Hover to inspect monthly forecast metrics.
        </p>
        
        {/* Forecast Timeline */}
        <div style={{ 
          display: 'flex', 
          gap: '12px', 
          overflowX: 'auto', 
          padding: '8px 4px 16px 4px',
          scrollbarWidth: 'thin',
          msOverflowStyle: 'none'
        }}>
          {(() => {
            const expectedCashFlows = dashboardStats.expected_cash_flows || {};
            const forecastMonths = Object.keys(expectedCashFlows).sort();
            const maxForecastVal = Math.max(...Object.values(expectedCashFlows) as number[], 1);
            
            if (forecastMonths.length === 0) {
              return (
                <div style={{ width: '100%', padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  No pending future installments found for forecasting.
                </div>
              );
            }
            
            return forecastMonths.map(monthStr => {
              const val = expectedCashFlows[monthStr] || 0;
              const percent = Math.max(8, (val / maxForecastVal) * 100);
              
              // Format month string e.g. "2026-06" -> "Jun 2026"
              const parts = monthStr.split('-');
              let formattedMonth = monthStr;
              if (parts.length === 2) {
                const date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, 1);
                formattedMonth = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
              }
              
              return (
                <div 
                  key={monthStr} 
                  style={{ 
                    flex: '0 0 110px', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center', 
                    gap: '8px',
                    background: 'rgba(255,255,255,0.25)', 
                    border: '1px solid var(--border-glass)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '12px 8px',
                    transition: 'transform 0.2s ease, background-color 0.2s ease',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.background = 'rgba(255,255,255,0.45)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.background = 'rgba(255,255,255,0.25)';
                  }}
                >
                  <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-main)' }}>{formattedMonth}</span>
                  
                  {/* Visual Bar Indicator */}
                  <div style={{ width: '12px', height: '60px', background: 'rgba(0,0,0,0.04)', borderRadius: '6px', position: 'relative', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
                    <div style={{ 
                      width: '100%', 
                      height: `${percent}%`, 
                      background: val > 0 ? 'linear-gradient(180deg, var(--color-success), rgba(16,185,129,0.3))' : 'transparent', 
                      borderRadius: '6px' 
                    }} />
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--color-success)' }}>
                      {val >= 1000000 ? `${(val / 1000000).toFixed(1)}M` : val >= 1000 ? `${Math.round(val / 1000)}k` : val}
                    </span>
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>EGP</span>
                  </div>
                </div>
              );
            });
          })()}
        </div>

        {/* Forecast KPI summaries */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginTop: '16px', borderTop: '1px solid var(--border-glass)', paddingTop: '16px' }}>
          {[
            { label: 'Expected This Month', value: thisMonthExpected, color: 'var(--color-primary)', bg: 'rgba(50, 71, 58, 0.04)' },
            { label: 'Expected Next Month', value: nextMonthExpected, color: 'var(--color-success)', bg: 'rgba(16, 185, 129, 0.04)' },
            { label: 'Fiscal Year Target', value: thisYearExpected, color: 'var(--color-warning)', bg: 'rgba(245, 158, 11, 0.04)' },
            { label: 'Total Future Backlog', value: upcomingInstallmentsSum, color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.04)' },
          ].map((card, i) => (
            <div key={i} style={{ padding: '12px 16px', borderRadius: 'var(--radius-sm)', background: card.bg, border: '1px solid var(--border-glass)' }}>
              <span style={{ fontSize: '0.65rem', fontWeight: 600, color: 'var(--text-muted)' }}>{card.label}</span>
              <h4 style={{ fontSize: '1.15rem', fontWeight: 800, color: card.color, marginTop: '4px', marginBottom: '2px' }}>
                {card.value.toLocaleString()} <span style={{ fontSize: '0.7rem', fontWeight: 500, color: 'var(--text-muted)' }}>EGP</span>
              </h4>
              <span style={{ fontSize: '0.55rem', color: 'var(--text-muted)' }}>Scheduled liquidity</span>
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
            Monthly Revenue ({filterYear})
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
              { name: 'Cash', count: filtered.filter(p => p.gateway === 'cash').length, color: '#10b981', amount: filtered.filter(p => p.gateway === 'cash' && p.status === 'paid').reduce((a, p) => a + p.amount, 0) },
              { name: 'Stripe', count: filtered.filter(p => p.gateway === 'stripe').length, color: '#635BFF', amount: filtered.filter(p => p.gateway === 'stripe' && p.status === 'paid').reduce((a, p) => a + p.amount, 0) },
              { name: 'Fawry', count: filtered.filter(p => p.gateway === 'fawry').length, color: '#FF6B35', amount: filtered.filter(p => p.gateway === 'fawry' && p.status === 'paid').reduce((a, p) => a + p.amount, 0) },
              { name: 'Bank Transfer', count: filtered.filter(p => p.gateway === 'bank_transfer').length, color: '#3b82f6', amount: filtered.filter(p => p.gateway === 'bank_transfer' && p.status === 'paid').reduce((a, p) => a + p.amount, 0) },
              { name: 'EOI Deposit', count: filtered.filter(p => p.gateway === 'eoi_deposit').length, color: '#f59e0b', amount: filtered.filter(p => p.gateway === 'eoi_deposit' && p.status === 'paid').reduce((a, p) => a + p.amount, 0) },
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

      {/* Payments Ledger Local Filter */}
      <div className="glass-panel" style={{ padding: '16px 24px', display: 'flex', gap: '12px', alignItems: 'center' }}>
        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', minWidth: '150px' }}>Local Ledger Gateway:</span>
        <select className="form-control" value={selectedGateway} onChange={e => setSelectedGateway(e.target.value)} style={{ width: '180px', fontSize: '0.85rem' }}>
          <option value="all">All Gateways</option>
          <option value="cash">Cash</option>
          <option value="stripe">Stripe</option>
          <option value="fawry">Fawry</option>
          <option value="bank_transfer">Bank Transfer</option>
          <option value="eoi_deposit">EOI Deposit</option>
        </select>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>
          Showing {filtered.length} of {payments.length} transactions
        </span>
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
                    ⚠️ Late Penalty: {selectedPayment.penalty_amount.toLocaleString()} EGP
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
                            fetchData({
                              year: filterYear,
                              month: filterMonth,
                              project_id: filterProject,
                              phase: filterPhase,
                              unit_type: filterUnitType,
                              client_id: filterCustomer,
                              status: filterStatus
                            });
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
      </>
      ) : (
        /* ═══════════════════════════════════════════════════════════════ */
        /* EOI 5% DOWN PAYMENT VERIFICATION TAB                          */
        /* ═══════════════════════════════════════════════════════════════ */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Header */}
          <div className="glass-panel" style={{ padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Building size={18} style={{ color: 'var(--color-primary)' }} />
                EOI 5% Down Payment Verification
              </h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                Review and approve/reject 5% booking deposit receipts uploaded by clients.
              </p>
            </div>
            <button
              className="btn-primary"
              style={{ padding: '8px 16px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}
              onClick={fetchPendingFivePercent}
              disabled={isEoiLoading}
            >
              {isEoiLoading ? '⏳ Loading...' : '🔄 Refresh'}
            </button>
          </div>

          {/* Pending Reservations Table */}
          {isEoiLoading ? (
            <div className="glass-panel" style={{ padding: '60px', textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', marginBottom: '12px' }}>⏳</div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Loading pending 5% payment receipts...</p>
            </div>
          ) : pendingFivePercentReservations.length === 0 ? (
            <div className="glass-panel" style={{ padding: '60px', textAlign: 'center' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>✅</div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: '0 0 6px 0' }}>All Clear!</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>
                No pending 5% payment receipts to review at this time.
              </p>
            </div>
          ) : (
            <div className="glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                  <thead>
                    <tr style={{ background: 'rgba(50, 71, 58, 0.04)', borderBottom: '2px solid var(--border-glass)' }}>
                      <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: 800, fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Client</th>
                      <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: 800, fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Unit</th>
                      <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: 800, fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Project</th>
                      <th style={{ padding: '14px 16px', textAlign: 'right', fontWeight: 800, fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>5% Amount</th>
                      <th style={{ padding: '14px 16px', textAlign: 'center', fontWeight: 800, fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Uploaded</th>
                      <th style={{ padding: '14px 16px', textAlign: 'center', fontWeight: 800, fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingFivePercentReservations.map((res: any) => (
                      <tr key={res.id} style={{ borderBottom: '1px solid var(--border-glass)', transition: 'background 0.2s' }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(59, 130, 246, 0.03)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                      >
                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ fontWeight: 700, fontSize: '0.82rem' }}>{res.client_name}</div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{res.client_email}</div>
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <span style={{ fontWeight: 600 }}>{res.unit?.unit_number || '—'}</span>
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <span style={{ fontSize: '0.78rem' }}>{res.unit?.project?.name || '—'}</span>
                        </td>
                        <td style={{ padding: '14px 16px', textAlign: 'right', fontWeight: 700, color: 'var(--color-primary)' }}>
                          {parseFloat(res.five_percent_amount || 0).toLocaleString()} EGP
                        </td>
                        <td style={{ padding: '14px 16px', textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {res.updated_at ? new Date(res.updated_at).toLocaleDateString('en-GB') : '—'}
                        </td>
                        <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                          <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                            {res.five_percent_receipt_path && (
                              <a
                                href={(() => {
                                  let host = '';
                                  try { const u = new URL(api.defaults.baseURL || 'http://127.0.0.1:8000'); host = u.origin; } catch { host = 'http://127.0.0.1:8000'; }
                                  return `${host}/storage/${res.five_percent_receipt_path}`;
                                })()}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn-secondary"
                                style={{ padding: '5px 10px', fontSize: '0.7rem', display: 'inline-flex', alignItems: 'center', gap: '4px', borderRadius: '4px', textDecoration: 'none' }}
                              >
                                📄 View Receipt
                              </a>
                            )}
                            <button
                              className="btn-primary"
                              style={{ padding: '5px 10px', fontSize: '0.7rem', display: 'inline-flex', alignItems: 'center', gap: '4px', borderRadius: '4px' }}
                              onClick={() => { setSelectedEoiRes(res); setShowEoiActionModal(true); setEoiRejectionNotes(''); }}
                            >
                              ⚡ Action
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* EOI Action Modal */}
          {showEoiActionModal && selectedEoiRes && (
            <div className="modal-backdrop" onClick={() => setShowEoiActionModal(false)}>
              <div className="modal-content" style={{ maxWidth: '560px', width: '100%', padding: '32px', display: 'flex', flexDirection: 'column', gap: '20px', position: 'relative' }} onClick={e => e.stopPropagation()}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-glass)', paddingBottom: '12px' }}>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                    <DollarSign size={20} style={{ color: 'var(--color-primary)' }} />
                    Review 5% Payment Receipt
                  </h3>
                  <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '1.1rem' }} onClick={() => setShowEoiActionModal(false)}>
                    ✕
                  </button>
                </div>

                {/* Reservation Details */}
                <div style={{ fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '8px', padding: '14px', background: 'rgba(50, 71, 58, 0.05)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-glass)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Client Name</span>
                    <strong>{selectedEoiRes.client_name}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed var(--border-glass)', paddingTop: '6px' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Email</span>
                    <strong>{selectedEoiRes.client_email}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed var(--border-glass)', paddingTop: '6px' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Unit</span>
                    <strong>{selectedEoiRes.unit?.unit_number || '—'}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed var(--border-glass)', paddingTop: '6px' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Project</span>
                    <strong>{selectedEoiRes.unit?.project?.name || '—'}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed var(--border-glass)', paddingTop: '6px' }}>
                    <span style={{ color: 'var(--text-muted)' }}>5% Amount</span>
                    <strong style={{ color: 'var(--color-primary)' }}>{parseFloat(selectedEoiRes.five_percent_amount || 0).toLocaleString()} EGP</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed var(--border-glass)', paddingTop: '6px' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Order Number</span>
                    <strong style={{ fontFamily: 'monospace' }}>{selectedEoiRes.order_number || '—'}</strong>
                  </div>
                </div>

                {/* Receipt Preview Link */}
                {selectedEoiRes.five_percent_receipt_path && (
                  <a
                    href={(() => {
                      let host = '';
                      try { const u = new URL(api.defaults.baseURL || 'http://127.0.0.1:8000'); host = u.origin; } catch { host = 'http://127.0.0.1:8000'; }
                      return `${host}/storage/${selectedEoiRes.five_percent_receipt_path}`;
                    })()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-secondary"
                    style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px', textDecoration: 'none', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 700 }}
                  >
                    📄 Open Receipt in New Tab
                  </a>
                )}

                {/* Action Buttons */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <button
                    className="btn-primary"
                    style={{ width: '100%', padding: '12px', fontSize: '0.85rem', fontWeight: 700, background: 'var(--color-success)', borderColor: 'var(--color-success)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', borderRadius: '8px' }}
                    onClick={() => handleApproveFivePercent(selectedEoiRes.id)}
                    disabled={isEoiSubmitting}
                  >
                    <CheckCircle size={16} />
                    {isEoiSubmitting ? 'Processing...' : '✅ Approve Payment & Confirm Reservation'}
                  </button>

                  <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: '12px' }}>
                    <form onSubmit={handleRejectFivePercent} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                        Rejection Reason (required to reject)
                      </label>
                      <textarea
                        className="form-control"
                        value={eoiRejectionNotes}
                        onChange={e => setEoiRejectionNotes(e.target.value)}
                        placeholder="Specify reason for rejection, e.g. 'Receipt is blurry', 'Amount doesn't match'..."
                        rows={3}
                        style={{ fontSize: '0.8rem' }}
                      />
                      <button
                        type="submit"
                        className="btn-secondary"
                        style={{ width: '100%', padding: '10px', fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-danger)', border: '1.5px solid var(--color-danger)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', borderRadius: '8px' }}
                        disabled={isEoiSubmitting || !eoiRejectionNotes.trim()}
                      >
                        <AlertCircle size={16} />
                        {isEoiSubmitting ? 'Processing...' : '❌ Reject Receipt & Notify Client'}
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Payments;
