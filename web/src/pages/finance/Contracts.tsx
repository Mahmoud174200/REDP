import React, { useState, useEffect } from 'react';
import { FileText, CheckCircle, Clock, XCircle, Search, Download, PenTool, Eye, X, AlertTriangle, Plus, Calendar, DollarSign, Wallet, CreditCard, CheckCircle2, ToggleRight, ToggleLeft } from 'lucide-react';
import api from '../../services/api';
import { ToastContainer } from '../../components/Toast';

interface ContractData {
  id: string;
  contract_number: string;
  client_name: string;
  client_email: string;
  unit_number: string;
  project_name: string;
  type: string;
  total_amount: number;
  paid_amount: number;
  status: string;
  signed_at: string | null;
  installments_count: number;
  monthly_amount: number;
  created_at: string;
}

const Contracts: React.FC = () => {
  const [contracts, setContracts] = useState<ContractData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedContract, setSelectedContract] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [toasts, setToasts] = useState<{ id: string; message: string; type: 'success' | 'error' | 'info' }[]>([]);

  // Payment Collection States (for modal)
  const [selectedPaymentForCollection, setSelectedPaymentForCollection] = useState<any | null>(null);
  const [collectAmount, setCollectAmount] = useState('');
  const [collectGateway, setCollectGateway] = useState<'cash' | 'bank_transfer' | 'stripe' | 'fawry'>('cash');
  const [collectRef, setCollectRef] = useState('');
  const [collectNotes, setCollectNotes] = useState('');
  const [isCollecting, setIsCollecting] = useState(false);

  // Late Penalty Configuration States
  const [showPenaltySettingsModal, setShowPenaltySettingsModal] = useState(false);
  const [penaltyEnabled, setPenaltyEnabled] = useState(true);
  const [penaltyRate, setPenaltyRate] = useState('1');
  const [penaltyGraceDays, setPenaltyGraceDays] = useState('0');
  const [isSavingPenalty, setIsSavingPenalty] = useState(false);
  const [isEscalating, setIsEscalating] = useState(false);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const fetchContracts = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/v1/finance/contracts');
      if (response.data && response.data.success) {
        const mapped = response.data.data.map((c: any) => ({
          id: c.id,
          contract_number: c.contract_number,
          client_name: c.client?.name || 'N/A',
          client_email: c.client?.email || 'N/A',
          unit_number: c.unit?.unit_number || 'N/A',
          project_name: c.unit?.project?.name || 'N/A',
          type: c.type,
          total_amount: parseFloat(c.total_amount) || 0,
          paid_amount: parseFloat(c.paid_amount) || 0,
          status: c.status,
          signed_at: c.signed_at ? c.signed_at.substring(0, 10) : null,
          installments_count: c.payment_plan?.total_installments || 0,
          monthly_amount: parseFloat(c.payment_plan?.monthly_amount) || 0,
          created_at: c.created_at ? c.created_at.substring(0, 10) : 'N/A'
        }));
        setContracts(mapped);
      }
    } catch (err) {
      console.error('Failed to fetch contracts:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchContracts();
  }, []);

  const handleSign = async (id: string) => {
    try {
      const res = await api.post(`/v1/finance/contracts/${id}/sign`);
      if (res.data?.success) {
        showToast('Contract signed successfully.', 'success');
        fetchContracts();
      }
    } catch (err) {
      console.error('Failed to sign contract:', err);
      showToast('Error signing contract.', 'error');
    }
  };

  const handleCancel = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this contract?')) return;
    try {
      const res = await api.post(`/v1/finance/contracts/${id}/cancel`);
      if (res.data?.success) {
        showToast('Contract cancelled successfully.', 'success');
        setSelectedContract(null);
        fetchContracts();
      }
    } catch (err) {
      console.error('Failed to cancel contract:', err);
      showToast('Error cancelling contract.', 'error');
    }
  };

  const handleViewContract = async (id: string) => {
    setIsLoadingDetails(true);
    try {
      const response = await api.get(`/v1/finance/contracts/${id}`);
      if (response.data && response.data.success) {
        setSelectedContract(response.data.data);
      } else {
        showToast('Failed to load contract details.', 'error');
      }
    } catch (err) {
      console.error('Failed to fetch contract details:', err);
      showToast('Error loading contract details.', 'error');
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const handlePrintReceipt = (payment: any) => {
    if (!selectedContract) return;

    const receiptWindow = window.open('', '_blank');
    if (!receiptWindow) {
      showToast('Popup blocker prevented opening the receipt. Please allow popups.', 'error');
      return;
    }

    const clientName = selectedContract.client?.name || selectedContract.client_name || 'N/A';
    const unitNumber = selectedContract.unit?.unit_number || selectedContract.unit_number || 'N/A';
    const projectName = selectedContract.unit?.project?.name || selectedContract.project_name || 'N/A';
    const contractNum = selectedContract.contract_number || 'N/A';
    
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

  const handleOpenCollect = (payment: any) => {
    setSelectedPaymentForCollection(payment);
    const remaining = parseFloat(payment.amount) - (parseFloat(payment.paid_amount) || 0);
    setCollectAmount(remaining.toString());
    setCollectGateway('cash');
    setCollectRef('');
    setCollectNotes('');
  };

  const handleCollectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPaymentForCollection || !selectedContract) return;

    const amountNum = parseFloat(collectAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      showToast('Please enter a valid amount.', 'error');
      return;
    }

    const remainingBase = parseFloat(selectedPaymentForCollection.amount) - (parseFloat(selectedPaymentForCollection.paid_amount) || 0);
    if (amountNum > remainingBase) {
      showToast('Collected amount cannot exceed the remaining installment amount due.', 'error');
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
        showToast(res.data.message || 'Payment collected successfully.', 'success');
        
        // Print Receipt Automatically
        const updatedPayment = res.data.data;
        if (updatedPayment) {
          handlePrintReceipt(updatedPayment);
        }

        setSelectedPaymentForCollection(null);
        
        // Refresh contract details modal to reflect paid installment
        await handleViewContract(selectedContract.id);
        
        // Refresh main contracts table in background
        await fetchContracts();
      } else {
        showToast(res.data?.message || 'Error collecting payment.', 'error');
      }
    } catch (err: any) {
      console.error('Failed to collect payment:', err);
      showToast(err.response?.data?.message || 'An error occurred while collecting payment.', 'error');
    } finally {
      setIsCollecting(false);
    }
  };

  const handlePenaltySettingsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedContract) return;

    const rateNum = parseFloat(penaltyRate);
    const graceNum = parseInt(penaltyGraceDays);

    if (isNaN(rateNum) || rateNum < 0) {
      showToast('Please enter a valid penalty rate.', 'error');
      return;
    }

    if (isNaN(graceNum) || graceNum < 0) {
      showToast('Please enter a valid grace period.', 'error');
      return;
    }

    setIsSavingPenalty(true);
    try {
      const res = await api.post(`/v1/finance/contracts/${selectedContract.id}/penalty-settings`, {
        penalty_enabled: penaltyEnabled,
        penalty_rate: rateNum,
        grace_period_days: graceNum
      });

      if (res.data?.success) {
        showToast('Penalty settings updated successfully.', 'success');
        setShowPenaltySettingsModal(false);
        // Refresh contract details modal
        await handleViewContract(selectedContract.id);
      } else {
        showToast(res.data?.message || 'Error updating penalty settings.', 'error');
      }
    } catch (err: any) {
      console.error('Failed to update penalty settings:', err);
      showToast(err.response?.data?.message || 'An error occurred.', 'error');
    } finally {
      setIsSavingPenalty(false);
    }
  };

  const handleEscalateWithdrawal = async () => {
    if (!selectedContract) return;
    
    const currentStage = selectedContract.withdrawal_status || 'none';
    const isNextWithdrawn = currentStage === 'final_notice';

    if (isNextWithdrawn) {
      const confirmWithdraw = confirm(
        "⚠️ WARNING: Are you sure you want to WITHDRAW this unit? This will cancel the contract, release the unit back to inventory (available), and terminate the payment plan. All payment records will be preserved for history. This action CANNOT be undone."
      );
      if (!confirmWithdraw) return;
    } else {
      const confirmEscalate = confirm(
        `Are you sure you want to escalate the delinquency status of contract ${selectedContract.contract_number}?`
      );
      if (!confirmEscalate) return;
    }

    setIsEscalating(true);
    try {
      const res = await api.post(`/v1/finance/contracts/${selectedContract.id}/escalate-withdrawal`);
      if (res.data?.success) {
        showToast(res.data.message || 'Delinquency status escalated.', 'success');
        // Refresh contract details
        await handleViewContract(selectedContract.id);
        // Refresh contracts table
        await fetchContracts();
      } else {
        showToast(res.data?.message || 'Error escalating delinquency status.', 'error');
      }
    } catch (err: any) {
      console.error('Failed to escalate withdrawal:', err);
      showToast(err.response?.data?.message || 'An error occurred.', 'error');
    } finally {
      setIsEscalating(false);
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

  const filtered = contracts.filter(c => {
    const matchSearch = searchTerm === '' ||
      c.contract_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.unit_number.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = filterStatus === 'all' || c.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const summary = {
    total: contracts.length,
    active: contracts.filter(c => c.status === 'active').length,
    totalValue: contracts.reduce((a, c) => a + c.total_amount, 0),
    totalPaid: contracts.reduce((a, c) => a + c.paid_amount, 0),
    collectionRate: Math.round((contracts.reduce((a, c) => a + c.paid_amount, 0) / Math.max(1, contracts.reduce((a, c) => a + c.total_amount, 0))) * 100),
  };

  const getStatusConfig = (status: string) => {
    const map: Record<string, { class: string; label: string; icon: React.ReactNode; color: string }> = {
      draft: { class: 'badge-info', label: 'Draft', icon: <FileText size={12} />, color: 'var(--color-primary)' },
      pending_signature: { class: 'badge-warning', label: 'Pending Signature', icon: <PenTool size={12} />, color: 'var(--color-warning)' },
      active: { class: 'badge-success', label: 'Active', icon: <CheckCircle size={12} />, color: 'var(--color-success)' },
      completed: { class: 'badge-info', label: 'Completed', icon: <CheckCircle size={12} />, color: 'var(--color-primary)' },
      cancelled: { class: 'badge-danger', label: 'Cancelled', icon: <XCircle size={12} />, color: 'var(--color-danger)' },
      withdrawn: { class: 'badge-danger', label: 'Withdrawn', icon: <XCircle size={12} />, color: '#111827' },
    };
    return map[status] || map.draft;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* Header */}
      <div className="glass-panel" style={{ padding: '28px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FileText style={{ color: 'var(--color-primary)' }} />
            Contracts Vault
          </h1>
          <p style={{ fontSize: '0.85rem' }}>Contract lifecycle management — generation, signature tracking, cancellation & PDF rendering</p>
        </div>
        <div style={{ padding: '6px 14px', background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 'var(--radius-sm)' }}>
          <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-primary)', letterSpacing: '0.05em' }}>MODULE: N+O</span>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
        {[
          { label: 'Total Contracts', value: summary.total, color: 'var(--color-primary)', bg: 'rgba(59,130,246,0.08)' },
          { label: 'Active', value: summary.active, color: 'var(--color-success)', bg: 'rgba(16,185,129,0.08)' },
          { label: 'Total Portfolio', value: `${(summary.totalValue / 1000000).toFixed(1)}M`, color: 'var(--color-secondary)', bg: 'rgba(168,85,247,0.08)' },
          { label: 'Collection Rate', value: `${summary.collectionRate}%`, color: 'var(--color-warning)', bg: 'rgba(245,158,11,0.08)' },
        ].map((card, i) => (
          <div key={i} className="glass-panel" style={{ padding: '20px 24px' }}>
            <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{card.label}</span>
            <h3 style={{ fontSize: '1.75rem', fontWeight: 800, color: card.color, marginTop: '8px' }}>{card.value}</h3>
          </div>
        ))}
      </div>

      {/* Search & Filters */}
      <div className="glass-panel" style={{ padding: '16px 24px', display: 'flex', gap: '12px', alignItems: 'center' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <Search style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', width: '16px', height: '16px', color: 'var(--text-muted)' }} />
          <input
            className="form-control"
            placeholder="Search by contract number, client name, or unit..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{ paddingLeft: '40px', fontSize: '0.85rem' }}
          />
        </div>
        <select className="form-control" value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ width: '200px', fontSize: '0.85rem' }}>
          <option value="all">All Status</option>
          <option value="draft">Draft</option>
          <option value="pending_signature">Pending Signature</option>
          <option value="active">Active</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Contracts Table */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <table className="premium-table">
          <thead>
            <tr>
              <th>Contract #</th>
              <th>Client</th>
              <th>Unit</th>
              <th>Total Value</th>
              <th>Paid</th>
              <th>Status</th>
              <th>Signed</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(contract => {
              const cfg = getStatusConfig(contract.status);
              const progress = Math.round((contract.paid_amount / Math.max(1, contract.total_amount)) * 100);
              return (
                <tr key={contract.id}>
                  <td>
                    <strong style={{ fontSize: '0.85rem' }}>{contract.contract_number}</strong>
                    <br />
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>{contract.type}</span>
                  </td>
                  <td>
                    <strong style={{ fontSize: '0.85rem' }}>{contract.client_name}</strong>
                    <br />
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{contract.client_email}</span>
                  </td>
                  <td>
                    <strong>{contract.unit_number}</strong>
                    <br />
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{contract.project_name}</span>
                  </td>
                  <td style={{ fontWeight: 700 }}>{contract.total_amount.toLocaleString()} <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>EGP</span></td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{contract.paid_amount.toLocaleString()}</span>
                      <div style={{ width: '80px', height: '4px', borderRadius: '2px', background: 'rgba(255,255,255,0.05)' }}>
                        <div style={{ width: `${progress}%`, height: '100%', borderRadius: '2px', background: progress === 100 ? 'var(--color-success)' : 'var(--color-primary)', transition: 'width 0.5s ease' }} />
                      </div>
                      <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{progress}% collected</span>
                    </div>
                  </td>
                  <td><span className={`badge ${cfg.class}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>{cfg.icon} {cfg.label}</span></td>
                  <td style={{ fontSize: '0.8rem' }}>{contract.signed_at || '—'}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button className="btn-secondary" style={{ padding: '6px 10px', fontSize: '0.7rem' }} onClick={() => handleViewContract(contract.id)}>
                        <Eye size={12} /> View
                      </button>
                      {(contract.status === 'draft' || contract.status === 'pending_signature') && (
                        <button className="btn-primary" style={{ padding: '6px 10px', fontSize: '0.7rem' }} onClick={() => handleSign(contract.id)}>
                          <PenTool size={12} /> Sign
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Contract Detail Modal */}
      {selectedContract && (
        <div className="modal-backdrop" onClick={() => setSelectedContract(null)}>
          <div className="modal-content" style={{ maxWidth: '850px', width: '100%', padding: '32px', position: 'relative', maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <button onClick={() => setSelectedContract(null)} style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
              <X size={20} />
            </button>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-glass)', paddingBottom: '16px', marginBottom: '20px' }}>
              <div>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>{selectedContract.contract_number}</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', margin: '4px 0 0 0' }}>Contract Details & Payment Timeline</p>
              </div>
              <span className={`badge ${getStatusConfig(selectedContract.status).class}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '6px 12px', fontSize: '0.75rem', fontWeight: 700 }}>
                {getStatusConfig(selectedContract.status).icon} {getStatusConfig(selectedContract.status).label}
              </span>
            </div>

            {/* Contract Info Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px', marginBottom: '24px' }}>
              {/* Client Card */}
              <div style={{ padding: '14px 18px', borderRadius: 'var(--radius-sm)', background: 'rgba(255, 255, 255, 0.55)', border: '1px solid var(--border-glass)' }}>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>Client Profile</span>
                <p style={{ fontWeight: 700, fontSize: '0.9rem', margin: '6px 0 2px 0', color: 'var(--text-main)' }}>{selectedContract.client?.name || selectedContract.client_name || 'N/A'}</p>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{selectedContract.client?.email || selectedContract.client_email || 'N/A'}</span>
              </div>
              
              {/* Unit Card */}
              <div style={{ padding: '14px 18px', borderRadius: 'var(--radius-sm)', background: 'rgba(255, 255, 255, 0.55)', border: '1px solid var(--border-glass)' }}>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>Property Unit</span>
                <p style={{ fontWeight: 700, fontSize: '0.9rem', margin: '6px 0 2px 0', color: 'var(--text-main)' }}>Unit {selectedContract.unit?.unit_number || selectedContract.unit_number || 'N/A'}</p>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{selectedContract.unit?.project?.name || selectedContract.project_name || 'N/A'}</span>
              </div>

              {/* Payment Plan Card */}
              <div style={{ padding: '14px 18px', borderRadius: 'var(--radius-sm)', background: 'rgba(255, 255, 255, 0.55)', border: '1px solid var(--border-glass)' }}>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>Payment Structure</span>
                <p style={{ fontWeight: 700, fontSize: '0.9rem', margin: '6px 0 2px 0', color: 'var(--text-main)' }}>{selectedContract.type === 'cash' ? 'Full Cash' : `Installment Plan`}</p>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                  {selectedContract.payment_plan?.total_installments || selectedContract.installments_count || 0} installments
                </span>
              </div>
            </div>

            {/* Financial Summary */}
            <div style={{ padding: '20px', borderRadius: 'var(--radius-sm)', background: 'rgba(50, 71, 58, 0.04)', border: '1px solid rgba(50, 71, 58, 0.15)', marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Financial Ledger Summary</span>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-primary)' }}>
                  {Math.round(((parseFloat(selectedContract.paid_amount) || 0) / Math.max(1, parseFloat(selectedContract.total_amount) || 1)) * 100)}% Collected
                </span>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Total Amount</span>
                  <h4 style={{ fontSize: '1.2rem', fontWeight: 800, margin: '4px 0 0 0', color: 'var(--text-main)' }}>
                    {(parseFloat(selectedContract.total_amount) || 0).toLocaleString()} <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-muted)' }}>EGP</span>
                  </h4>
                </div>
                <div>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Total Paid to Date</span>
                  <h4 style={{ fontSize: '1.2rem', fontWeight: 800, margin: '4px 0 0 0', color: 'var(--color-success)' }}>
                    {(parseFloat(selectedContract.paid_amount) || 0).toLocaleString()} <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-muted)' }}>EGP</span>
                  </h4>
                </div>
                <div>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Outstanding Balance</span>
                  <h4 style={{ fontSize: '1.2rem', fontWeight: 800, margin: '4px 0 0 0', color: 'var(--color-danger)' }}>
                    {((parseFloat(selectedContract.total_amount) || 0) - (parseFloat(selectedContract.paid_amount) || 0)).toLocaleString()} <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-muted)' }}>EGP</span>
                  </h4>
                </div>
              </div>

              <div style={{ height: '6px', borderRadius: '3px', background: 'rgba(50, 71, 58, 0.1)' }}>
                <div style={{ 
                  width: `${((parseFloat(selectedContract.paid_amount) || 0) / Math.max(1, parseFloat(selectedContract.total_amount) || 1)) * 100}%`, 
                  height: '100%', 
                  borderRadius: '3px', 
                  background: 'linear-gradient(90deg, var(--color-secondary), var(--color-success))',
                  transition: 'width 0.6s ease'
                }} />
              </div>
            </div>

            {/* Late Penalty Settings summary panel card */}
            <div style={{ 
              padding: '20px', 
              borderRadius: 'var(--radius-sm)', 
              background: 'rgba(239, 68, 68, 0.03)', 
              border: '1.5px solid rgba(239, 68, 68, 0.12)', 
              marginBottom: '24px' 
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Late Penalty Settings / إعدادات غرامة التأخير
                </span>
                {selectedContract.status !== 'cancelled' && selectedContract.status !== 'completed' && (
                  <button 
                    type="button" 
                    className="btn-secondary" 
                    style={{ padding: '4px 10px', fontSize: '0.7rem' }}
                    onClick={() => {
                      const plan = selectedContract.payment_plan || selectedContract.paymentPlan;
                      setPenaltyEnabled(plan?.penalty_enabled !== false);
                      setPenaltyRate(plan?.penalty_rate !== null && plan?.penalty_rate !== undefined ? plan.penalty_rate.toString() : '1');
                      setPenaltyGraceDays(plan?.grace_period_days !== null && plan?.grace_period_days !== undefined ? plan.grace_period_days.toString() : '0');
                      setShowPenaltySettingsModal(true);
                    }}
                  >
                    Adjust Settings / تعديل الإعدادات
                  </button>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: '16px' }}>
                <div>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'block' }}>Penalty Status / الحالة</span>
                  <span className={`badge ${(selectedContract.payment_plan?.penalty_enabled !== false && selectedContract.paymentPlan?.penalty_enabled !== false) ? 'badge-danger' : 'badge-info'}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', marginTop: '6px', fontSize: '0.72rem', padding: '4px 8px' }}>
                    {(selectedContract.payment_plan?.penalty_enabled !== false && selectedContract.paymentPlan?.penalty_enabled !== false) ? '⚠️ Enabled / نشط' : '🛡️ Disabled / معطل'}
                  </span>
                </div>
                <div>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'block' }}>Penalty Rate / نسبة الغرامة</span>
                  <strong style={{ fontSize: '0.95rem', color: 'var(--text-main)', display: 'block', marginTop: '6px' }}>
                    {selectedContract.payment_plan?.penalty_rate !== null && selectedContract.payment_plan?.penalty_rate !== undefined 
                      ? `${selectedContract.payment_plan.penalty_rate}%` 
                      : selectedContract.paymentPlan?.penalty_rate !== null && selectedContract.paymentPlan?.penalty_rate !== undefined
                      ? `${selectedContract.paymentPlan.penalty_rate}%`
                      : '1% (System Default)'}
                  </strong>
                </div>
                <div>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'block' }}>Grace Period / فترة السماح</span>
                  <strong style={{ fontSize: '0.95rem', color: 'var(--text-main)', display: 'block', marginTop: '6px' }}>
                    {selectedContract.payment_plan?.grace_period_days !== null && selectedContract.payment_plan?.grace_period_days !== undefined 
                      ? `${selectedContract.payment_plan.grace_period_days} Days` 
                      : selectedContract.paymentPlan?.grace_period_days !== null && selectedContract.paymentPlan?.grace_period_days !== undefined
                      ? `${selectedContract.paymentPlan.grace_period_days} Days`
                      : '0 Days (System Default)'}
                  </strong>
                </div>
              </div>
            </div>

            {/* Unit Withdrawal System Delinquency Escalation Panel */}
            <div style={{ 
              padding: '20px', 
              borderRadius: 'var(--radius-sm)', 
              background: 'rgba(239, 68, 68, 0.05)', 
              border: '1.5px solid rgba(239, 68, 68, 0.2)', 
              marginBottom: '24px' 
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Delinquency & Unit Withdrawal System / نظام المتأخرات وسحب الوحدات
                </span>
                {selectedContract.status !== 'cancelled' && selectedContract.status !== 'completed' && selectedContract.status !== 'withdrawn' && (
                  <button 
                    type="button" 
                    className="btn-primary" 
                    style={{ 
                      padding: '6px 12px', 
                      fontSize: '0.7rem', 
                      background: (selectedContract.withdrawal_status === 'final_notice') ? 'var(--color-danger)' : 'var(--color-warning)',
                      borderColor: (selectedContract.withdrawal_status === 'final_notice') ? 'var(--color-danger)' : 'var(--color-warning)',
                      height: 'auto'
                    }}
                    onClick={handleEscalateWithdrawal}
                    disabled={isEscalating}
                  >
                    {selectedContract.withdrawal_status === 'final_notice' ? 'Withdraw Unit / سحب الوحدة' : 'Escalate Stage / تصعيد المرحلة'}
                  </button>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-main)' }}>Current Escalation Status:</span>
                  {(() => {
                    const stage = selectedContract.withdrawal_status || 'none';
                    const stageConfigs: Record<string, { label: string; class: string; color: string }> = {
                      none: { label: 'Normal / مستقر', class: 'badge-success', color: 'var(--color-success)' },
                      reminder: { label: 'Reminder Sent / تم إرسال تذكير', class: 'badge-warning', color: 'var(--color-warning)' },
                      warning: { label: 'Warning Sent / تم إرسال إنذار', class: 'badge-warning', color: '#f97316' },
                      final_notice: { label: 'Final Notice Sent / إنذار نهائي بسحب الوحدة', class: 'badge-danger', color: 'var(--color-danger)' },
                      withdrawn: { label: 'Unit Withdrawn / تم سحب الوحدة', class: 'badge-danger', color: '#111827' }
                    };
                    const cfg = stageConfigs[stage] || stageConfigs.none;
                    return (
                      <span className={`badge ${cfg.class}`} style={{ padding: '4px 10px', fontSize: '0.72rem', fontWeight: 700 }}>
                        {cfg.label}
                      </span>
                    );
                  })()}
                </div>

                {/* Delinquency progress steps */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '4px', height: '6px', background: 'rgba(0,0,0,0.05)', borderRadius: '3px', marginTop: '6px' }}>
                  {['none', 'reminder', 'warning', 'final_notice', 'withdrawn'].map((stage, idx) => {
                    const stages = ['none', 'reminder', 'warning', 'final_notice', 'withdrawn'];
                    const currentIdx = stages.indexOf(selectedContract.withdrawal_status || 'none');
                    const isActive = idx <= currentIdx;
                    const colors = ['#10b981', '#f59e0b', '#f97316', '#ef4444', '#111827'];
                    return (
                      <div 
                        key={stage} 
                        style={{ 
                          height: '100%', 
                          borderRadius: '3px', 
                          background: isActive ? colors[idx] : 'transparent',
                          transition: 'background 0.3s'
                        }} 
                      />
                    );
                  })}
                </div>
                
                <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  If customer defaults persist, progress the delinquency sequence. Transitioning past Final Notice initiates unit repossession, returns the unit to inventory, terminates the contract, and freezes the payment schedule while maintaining all transaction records.
                </span>
              </div>
            </div>

            {/* Detailed Installments Table */}
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-main)' }}>
                <Calendar size={16} style={{ color: 'var(--color-primary)' }} />
                📅 خطة دفع الأقساط والتحصيل (Installment Plan & Collection Schedule)
              </h3>
              <div style={{ maxHeight: '300px', overflowY: 'auto', overflowX: 'auto', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-sm)', background: 'rgba(255, 255, 255, 0.25)' }}>
                <table style={{ width: '100%', minWidth: '780px', borderCollapse: 'separate', borderSpacing: 0, fontSize: '0.75rem', margin: 0 }}>
                  <thead>
                    <tr>
                      <th style={{ position: 'sticky', top: 0, background: '#e4ede2', zIndex: 10, padding: '12px 14px', borderBottom: '2px solid var(--border-glass)', color: 'var(--text-main)', fontWeight: 700, textAlign: 'left' }}>Month / الدفعة</th>
                      <th style={{ position: 'sticky', top: 0, background: '#e4ede2', zIndex: 10, padding: '12px 14px', borderBottom: '2px solid var(--border-glass)', color: 'var(--text-main)', fontWeight: 700, textAlign: 'left' }}>Type / البيان</th>
                      <th style={{ position: 'sticky', top: 0, background: '#e4ede2', zIndex: 10, padding: '12px 14px', borderBottom: '2px solid var(--border-glass)', color: 'var(--text-main)', fontWeight: 700, textAlign: 'left' }}>Due Date / الاستحقاق</th>
                      <th style={{ position: 'sticky', top: 0, background: '#e4ede2', zIndex: 10, padding: '12px 14px', borderBottom: '2px solid var(--border-glass)', color: 'var(--text-main)', fontWeight: 700, textAlign: 'right' }}>Amount / القيمة</th>
                      <th style={{ position: 'sticky', top: 0, background: '#e4ede2', zIndex: 10, padding: '12px 14px', borderBottom: '2px solid var(--border-glass)', color: 'var(--text-main)', fontWeight: 700, textAlign: 'center' }}>Status / الحالة</th>
                      <th style={{ position: 'sticky', top: 0, background: '#e4ede2', zIndex: 10, padding: '12px 14px', borderBottom: '2px solid var(--border-glass)', color: 'var(--text-main)', fontWeight: 700, textAlign: 'left' }}>Receipt / Reference</th>
                      <th style={{ position: 'sticky', top: 0, background: '#e4ede2', zIndex: 10, padding: '12px 14px', borderBottom: '2px solid var(--border-glass)', color: 'var(--text-main)', fontWeight: 700, textAlign: 'center' }}>Action / الإجراء</th>
                    </tr>
                  </thead>
                  <tbody>
                    {!selectedContract.payments || selectedContract.payments.length === 0 ? (
                      <tr>
                        <td colSpan={7} style={{ textAlign: 'center', padding: '16px', color: 'var(--text-muted)' }}>
                          No payment schedule generated yet.
                        </td>
                      </tr>
                    ) : (
                      selectedContract.payments.map((payment: any) => {
                        const status = payment.status === 'pending'
                          ? (new Date(payment.due_date) < new Date() ? 'overdue' : 'upcoming')
                          : payment.status;
                        return (
                          <tr key={payment.id} style={{ background: status === 'paid' ? 'rgba(46, 125, 50, 0.05)' : status === 'overdue' ? 'rgba(239, 68, 68, 0.02)' : 'transparent', transition: 'background-color 0.2s' }}>
                            <td style={{ padding: '12px 14px', borderBottom: '1px solid var(--border-glass)', fontWeight: 600 }}>
                              {payment.installment_number === 0 ? 'Down Payment / مقدم' : `Month ${payment.installment_number}`}
                            </td>
                            <td style={{ padding: '12px 14px', borderBottom: '1px solid var(--border-glass)', color: 'var(--text-muted)' }}>
                              {payment.transaction_reference || (payment.installment_number === 0 ? 'Down Payment/EOI' : 'Installment')}
                            </td>
                            <td style={{ padding: '12px 14px', borderBottom: '1px solid var(--border-glass)' }}>{payment.due_date}</td>
                            <td style={{ padding: '12px 14px', borderBottom: '1px solid var(--border-glass)', textAlign: 'right', fontWeight: 700, color: 'var(--text-main)' }}>
                              {status === 'partial' ? (
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' }}>
                                  <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>{(parseFloat(payment.paid_amount) || 0).toLocaleString()} / {(parseFloat(payment.amount) || 0).toLocaleString()} EGP</span>
                                  <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>({Math.round(((parseFloat(payment.paid_amount) || 0) / (parseFloat(payment.amount) || 1)) * 100)}% paid)</span>
                                </div>
                              ) : (
                                <span>{(parseFloat(payment.amount) || 0).toLocaleString()} EGP</span>
                              )}
                              {parseFloat(payment.penalty_amount) > 0 && (
                                <div style={{ fontSize: '0.65rem', color: 'var(--color-danger)', fontWeight: 600, marginTop: '2px' }}>
                                  + {(parseFloat(payment.penalty_amount) || 0).toLocaleString()} EGP Late Fee
                                </div>
                              )}
                            </td>
                            <td style={{ padding: '12px 14px', borderBottom: '1px solid var(--border-glass)', textAlign: 'center' }}>
                              {status === 'paid' && (
                                <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '2px', padding: '3px 8px', fontSize: '0.65rem' }}>
                                  <CheckCircle size={10} /> Paid / مدفوع
                                </span>
                              )}
                              {status === 'upcoming' && (
                                <span className="badge badge-info" style={{ display: 'inline-flex', alignItems: 'center', gap: '2px', padding: '3px 8px', fontSize: '0.65rem', background: 'rgba(59,130,246,0.1)', color: 'var(--color-primary)' }}>
                                  <Clock size={10} /> Upcoming / قادم
                                </span>
                              )}
                              {status === 'overdue' && (
                                <span className="badge badge-danger" style={{ display: 'inline-flex', alignItems: 'center', gap: '2px', padding: '3px 8px', fontSize: '0.65rem' }}>
                                  <AlertTriangle size={10} /> Overdue / متأخر
                                </span>
                              )}
                              {status === 'partial' && (
                                <span className="badge badge-warning" style={{ display: 'inline-flex', alignItems: 'center', gap: '2px', padding: '3px 8px', fontSize: '0.65rem' }}>
                                  <Clock size={10} /> Partial / دفع جزئي
                                </span>
                              )}
                            </td>
                            <td style={{ padding: '12px 14px', borderBottom: '1px solid var(--border-glass)' }}>
                              {(status === 'paid' || status === 'partial') ? (
                                <div style={{ fontSize: '0.7rem' }}>
                                  <span style={{ textTransform: 'capitalize', fontWeight: 600, color: 'var(--color-primary)' }}>
                                    {payment.gateway ? payment.gateway.replace('_', ' ') : 'Manual'}
                                  </span>
                                  {payment.transaction_reference && (
                                    <div style={{ fontFamily: 'monospace', color: 'var(--text-muted)', fontSize: '0.65rem', marginTop: '2px' }}>
                                      Ref: {payment.transaction_reference}
                                    </div>
                                  )}
                                  {payment.paid_at && (
                                    <div style={{ color: 'var(--text-muted)', fontSize: '0.65rem' }}>
                                      Date: {payment.paid_at.substring(0, 10)}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <span style={{ color: 'var(--text-muted)' }}>—</span>
                              )}
                            </td>
                            <td style={{ padding: '12px 14px', borderBottom: '1px solid var(--border-glass)', textAlign: 'center' }}>
                              {status !== 'paid' && (
                                <button
                                  type="button"
                                  className="btn-primary"
                                  style={{ padding: '4px 8px', fontSize: '0.68rem', background: 'var(--color-success)', borderColor: 'var(--color-success)', marginBottom: status === 'partial' ? '4px' : '0' }}
                                  onClick={() => handleOpenCollect(payment)}
                                >
                                  <DollarSign size={10} /> {status === 'partial' ? 'Remainder' : 'تحصيل / Collect'}
                                </button>
                              )}
                              {status === 'paid' ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'center' }}>
                                  <span style={{ color: 'var(--color-success)', fontWeight: 600, fontSize: '0.7rem' }}>✓ Done / تم الدفع</span>
                                  <button
                                    type="button"
                                    className="btn-secondary"
                                    style={{ padding: '3px 6px', fontSize: '0.65rem', borderRadius: '4px', background: 'rgba(255, 255, 255, 0.9)' }}
                                    onClick={() => handlePrintReceipt(payment)}
                                  >
                                    🖨️ Receipt / إيصال
                                  </button>
                                </div>
                              ) : (
                                status === 'partial' && (
                                  <button
                                    type="button"
                                    className="btn-secondary"
                                    style={{ padding: '3px 6px', fontSize: '0.65rem', borderRadius: '4px', background: 'rgba(255, 255, 255, 0.9)', display: 'block', margin: '0 auto' }}
                                    onClick={() => handlePrintReceipt(payment)}
                                  >
                                    🖨️ Receipt / إيصال
                                  </button>
                                )
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button className="btn-primary" style={{ flex: 1, justifyContent: 'center', padding: '12px' }}>
                <Download size={14} /> Download PDF
              </button>
              {selectedContract.status !== 'cancelled' && selectedContract.status !== 'completed' && (
                <button className="btn-secondary" style={{ padding: '12px 20px' }} onClick={() => handleCancel(selectedContract.id)}>
                  <AlertTriangle size={14} /> Cancel Contract
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Nested Collect Payment Modal */}
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
                            showToast('Penalty waived successfully.', 'success');
                            setSelectedPaymentForCollection({
                              ...selectedPaymentForCollection,
                              penalty_amount: '0.00',
                              penalty_waived: true
                            });
                            // Refresh contract details modal
                            handleViewContract(selectedContract.id);
                          }
                        } catch (err: any) {
                          showToast(err.response?.data?.message || 'Failed to waive penalty.', 'error');
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
                {parseFloat(collectAmount) < (parseFloat(selectedPaymentForCollection.amount) - (parseFloat(selectedPaymentForCollection.paid_amount) || 0)) && (
                  <span style={{ fontSize: '0.7rem', color: 'var(--color-warning)', marginTop: '4px', display: 'block' }}>
                    ⚠️ Partial Payment: The installment status will update to "Partial Payment / دفع جزئي" without splitting the record. The remainder can be collected subsequently.
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
                  placeholder="Optional collection notes..."
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

      {/* Adjust Penalty Settings Modal */}
      {showPenaltySettingsModal && selectedContract && (
        <div className="modal-backdrop" style={{ zIndex: 1100 }} onClick={() => setShowPenaltySettingsModal(false)}>
          <div className="modal-content" style={{ maxWidth: '480px', width: '100%', padding: '30px', display: 'flex', flexDirection: 'column', gap: '20px' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-glass)', paddingBottom: '12px' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                <AlertTriangle size={18} style={{ color: 'var(--color-danger)' }} />
                Late Penalty Settings (إعدادات غرامة التأخير)
              </h3>
              <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '1.2rem', padding: 0 }} onClick={() => setShowPenaltySettingsModal(false)}>
                ✕
              </button>
            </div>

            <form onSubmit={handlePenaltySettingsSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 700, fontSize: '0.75rem' }}>Penalty Application Status</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '6px' }}>
                  <button
                    type="button"
                    onClick={() => setPenaltyEnabled(!penaltyEnabled)}
                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', padding: 0 }}
                  >
                    {penaltyEnabled ? (
                      <ToggleRight size={38} style={{ color: 'var(--color-success)' }} />
                    ) : (
                      <ToggleLeft size={38} style={{ color: 'var(--text-muted)' }} />
                    )}
                  </button>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {penaltyEnabled ? 'Enabled / نشط: Apply overdue interest.' : 'Disabled / معطل: Waive any dynamic late fee.'}
                  </span>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 700, fontSize: '0.75rem' }}>Late Penalty Rate (%)</label>
                <input
                  type="number"
                  step="0.1"
                  className="form-control"
                  value={penaltyRate}
                  onChange={e => setPenaltyRate(e.target.value)}
                  placeholder="e.g. 1.0"
                  required
                  disabled={!penaltyEnabled}
                  style={{ fontSize: '0.8rem' }}
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 700, fontSize: '0.75rem' }}>Grace Period (Days)</label>
                <input
                  type="number"
                  className="form-control"
                  value={penaltyGraceDays}
                  onChange={e => setPenaltyGraceDays(e.target.value)}
                  placeholder="e.g. 5"
                  required
                  disabled={!penaltyEnabled}
                  style={{ fontSize: '0.8rem' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button type="button" className="btn-secondary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setShowPenaltySettingsModal(false)}>
                  Cancel / إلغاء
                </button>
                <button type="submit" className="btn-primary" style={{ flex: 1, justifyContent: 'center' }} disabled={isSavingPenalty}>
                  {isSavingPenalty ? 'Saving...' : 'Save Settings / حفظ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
};

export default Contracts;
