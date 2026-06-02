import React, { useState, useEffect } from 'react';
import { AlertTriangle, Clock, Calendar, CheckCircle, XCircle, RefreshCw, ArrowRight, FileWarning, DollarSign, TrendingDown, Shield, Layers } from 'lucide-react';
import api from '../../services/api';

interface CollectionItem {
  id: string;
  contract_id?: string;
  contract_number: string;
  client_name: string;
  unit_number: string;
  aging_bucket: string;
  outstanding_amount: number;
  promise_to_pay_date: string | null;
  status: string;
  days_overdue: number;
  notes: string;
}

interface RescheduleRequest {
  id: string;
  contract_number: string;
  client_name: string;
  reason: string;
  current_installments: number;
  proposed_installments: number;
  proposed_monthly: number;
  status: string;
  created_at: string;
}

const Collections: React.FC = () => {
  const [collections, setCollections] = useState<CollectionItem[]>([]);
  const [reschedules, setReschedules] = useState<RescheduleRequest[]>([]);
  const [selectedBucket, setSelectedBucket] = useState('all');
  const [activeTab, setActiveTab] = useState<'queue' | 'reschedule' | 'cancel'>('queue');
  const [cancelModal, setCancelModal] = useState<CollectionItem | null>(null);
  const [penaltyRate, setPenaltyRate] = useState(10);
  const [cancelReason, setCancelReason] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const fetchCollections = async () => {
    try {
      const response = await api.get('/v1/finance/collections');
      if (response.data && response.data.success) {
        const mapped = response.data.data.map((c: any) => ({
          id: c.id,
          contract_id: c.contract_id,
          contract_number: c.contract?.contract_number || 'N/A',
          client_name: c.contract?.client?.name || 'N/A',
          unit_number: c.contract?.unit?.unit_number || 'N/A',
          aging_bucket: c.aging_bucket,
          outstanding_amount: parseFloat(c.outstanding_amount) || 0,
          promise_to_pay_date: c.promise_to_pay_date,
          status: c.status,
          days_overdue: c.aging_bucket === '30_days' ? 15 : c.aging_bucket === '60_days' ? 45 : 95,
          notes: c.notes || '',
        }));
        setCollections(mapped);
      }
    } catch (err) {
      console.error('Failed to fetch collections:', err);
    }
  };

  const fetchReschedules = async () => {
    try {
      const response = await api.get('/v1/finance/collections/reschedules');
      if (response.data && response.data.success) {
        const mapped = response.data.data.map((r: any) => ({
          id: r.id,
          contract_number: r.contract?.contract_number || 'N/A',
          client_name: r.contract?.client?.name || 'N/A',
          reason: r.reason,
          current_installments: r.current_installments,
          proposed_installments: r.proposed_installments_count,
          proposed_monthly: parseFloat(r.proposed_monthly_amount) || 0,
          status: r.status,
          created_at: r.created_at ? r.created_at.substring(0, 10) : 'N/A',
        }));
        setReschedules(mapped);
      }
    } catch (err) {
      console.error('Failed to fetch reschedules:', err);
    }
  };

  useEffect(() => {
    const initData = async () => {
      setIsLoading(true);
      await Promise.all([fetchCollections(), fetchReschedules()]);
      setIsLoading(false);
    };
    initData();
  }, []);

  const handleSetPromise = async (id: string) => {
    const promiseDate = prompt('Enter promise-to-pay date (YYYY-MM-DD):', new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
    if (!promiseDate) return;
    const notes = prompt('Enter notes (optional):') || '';
    try {
      const response = await api.post(`/v1/finance/collections/${id}/promise`, {
        promise_date: promiseDate,
        notes: notes
      });
      if (response.data && response.data.success) {
        alert('Promise-to-pay date recorded successfully.');
        fetchCollections();
      }
    } catch (err: any) {
      console.error('Failed to record promise-to-pay:', err);
      alert(err.response?.data?.message || 'Error recording promise-to-pay.');
    }
  };

  const handleApproveReschedule = async (id: string) => {
    if (!confirm('Are you sure you want to approve this rescheduling request?')) return;
    try {
      const response = await api.post(`/v1/finance/reschedule/${id}/approve`);
      if (response.data && response.data.success) {
        alert('Rescheduling request approved and new payment plan generated.');
        fetchReschedules();
        fetchCollections();
      }
    } catch (err: any) {
      console.error('Failed to approve reschedule:', err);
      alert(err.response?.data?.message || 'Error approving rescheduling request.');
    }
  };

  const handleCancelContract = async (contractId: string, reason: string, penaltyPercentage: number) => {
    try {
      const response = await api.post(`/v1/finance/cancel/${contractId}`, {
        reason: reason,
        penalty_percentage: penaltyPercentage,
      });
      if (response.data && response.data.success) {
        alert('Contract cancelled successfully.');
        setCancelModal(null);
        setCancelReason('');
        fetchCollections();
      }
    } catch (err: any) {
      console.error('Failed to cancel contract:', err);
      alert(err.response?.data?.message || 'Error cancelling contract.');
    }
  };

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', flexDirection: 'column', gap: '16px' }}>
        <div className="animate-spin" style={{ width: '40px', height: '40px', border: '4px solid var(--color-warning)', borderTopColor: 'transparent', borderRadius: '50%' }} />
        <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 600 }}>Loading...</span>
      </div>
    );
  }

  const filteredCollections = selectedBucket === 'all'
    ? collections
    : collections.filter(c => c.aging_bucket === selectedBucket);

  // Bucket summaries
  const buckets = [
    { key: '30_days', label: '0–30 Days', count: collections.filter(c => c.aging_bucket === '30_days').length, amount: collections.filter(c => c.aging_bucket === '30_days').reduce((a, c) => a + c.outstanding_amount, 0), color: 'var(--color-warning)', bg: 'rgba(245,158,11,0.08)' },
    { key: '60_days', label: '31–60 Days', count: collections.filter(c => c.aging_bucket === '60_days').length, amount: collections.filter(c => c.aging_bucket === '60_days').reduce((a, c) => a + c.outstanding_amount, 0), color: '#f97316', bg: 'rgba(249,115,22,0.08)' },
    { key: '90_days_plus', label: '90+ Days', count: collections.filter(c => c.aging_bucket === '90_days_plus').length, amount: collections.filter(c => c.aging_bucket === '90_days_plus').reduce((a, c) => a + c.outstanding_amount, 0), color: 'var(--color-danger)', bg: 'rgba(239,68,68,0.08)' },
  ];

  const totalOutstanding = collections.reduce((a, c) => a + c.outstanding_amount, 0);

  const getAgingBadge = (bucket: string) => {
    const map: Record<string, { class: string; label: string }> = {
      '30_days': { class: 'badge-warning', label: '0–30 Days' },
      '60_days': { class: 'badge-warning', label: '31–60 Days' },
      '90_days_plus': { class: 'badge-danger', label: '90+ Days' },
    };
    const cfg = map[bucket] || { class: 'badge-info', label: bucket };
    return <span className={`badge ${cfg.class}`}>{cfg.label}</span>;
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, { class: string; label: string; icon: React.ReactNode }> = {
      active: { class: 'badge-warning', label: 'Active', icon: <Clock size={10} /> },
      promised: { class: 'badge-info', label: 'Promised', icon: <Calendar size={10} /> },
      resolved: { class: 'badge-success', label: 'Resolved', icon: <CheckCircle size={10} /> },
      escalated: { class: 'badge-danger', label: 'Escalated', icon: <AlertTriangle size={10} /> },
    };
    const cfg = map[status] || map.active;
    return <span className={`badge ${cfg.class}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>{cfg.icon} {cfg.label}</span>;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* Header */}
      <div className="glass-panel" style={{ padding: '28px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <AlertTriangle style={{ color: 'var(--color-warning)' }} />
            Collections & Debt Management
          </h1>
          <p style={{ fontSize: '0.85rem' }}>Aging debt tracker, promise-to-pay management, rescheduling & cancellation processor</p>
        </div>
        <div style={{ padding: '6px 14px', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 'var(--radius-sm)' }}>
          <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-warning)', letterSpacing: '0.05em' }}>MODULE: H.13/14/15</span>
        </div>
      </div>

      {/* Aging Buckets */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
        {/* Total Card */}
        <div className="glass-panel" style={{ padding: '20px 24px', cursor: 'pointer', borderColor: selectedBucket === 'all' ? 'var(--color-primary)' : undefined }} onClick={() => setSelectedBucket('all')}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Total Outstanding</span>
            <div style={{ padding: '8px', borderRadius: 'var(--radius-sm)', background: 'rgba(59,130,246,0.08)' }}>
              <DollarSign size={20} style={{ color: 'var(--color-primary)' }} />
            </div>
          </div>
          <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-primary)' }}>{(totalOutstanding / 1000000).toFixed(2)}M</h3>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{collections.length} active items</span>
        </div>
        {/* Bucket Cards */}
        {buckets.map((bucket, i) => (
          <div key={i} className="glass-panel" style={{ padding: '20px 24px', cursor: 'pointer', borderColor: selectedBucket === bucket.key ? bucket.color : undefined }} onClick={() => setSelectedBucket(bucket.key)}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
              <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{bucket.label}</span>
              <div style={{ padding: '8px', borderRadius: 'var(--radius-sm)', background: bucket.bg }}>
                <Layers size={20} style={{ color: bucket.color }} />
              </div>
            </div>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: bucket.color }}>{(bucket.amount / 1000000).toFixed(2)}M</h3>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{bucket.count} contracts</span>
          </div>
        ))}
      </div>

      {/* Aging Distribution Bar */}
      <div className="glass-panel" style={{ padding: '16px 24px' }}>
        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '10px', display: 'block' }}>Aging Distribution</span>
        <div style={{ display: 'flex', height: '12px', borderRadius: '6px', overflow: 'hidden', gap: '2px' }}>
          {buckets.map((b, i) => (
            <div key={i} style={{
              flex: totalOutstanding > 0 ? b.amount / totalOutstanding : 1,
              background: b.color,
              transition: 'flex 0.5s ease',
              borderRadius: i === 0 ? '6px 0 0 6px' : i === buckets.length - 1 ? '0 6px 6px 0' : '0',
            }} title={`${b.label}: ${(b.amount / 1000000).toFixed(2)}M EGP`} />
          ))}
        </div>
        <div style={{ display: 'flex', gap: '20px', marginTop: '10px' }}>
          {buckets.map((b, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: b.color }} />
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{b.label}: {totalOutstanding > 0 ? Math.round((b.amount / totalOutstanding) * 100) : 0}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-glass)', paddingBottom: '0' }}>
        {[
          { key: 'queue' as const, label: 'Collections Queue', icon: <Layers size={14} /> },
          { key: 'reschedule' as const, label: 'Rescheduling Requests', icon: <RefreshCw size={14} /> },
          { key: 'cancel' as const, label: 'Cancellations', icon: <XCircle size={14} /> },
        ].map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
            padding: '12px 20px', display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none',
            borderBottom: activeTab === tab.key ? '2px solid var(--color-primary)' : '2px solid transparent',
            color: activeTab === tab.key ? 'var(--color-primary)' : 'var(--text-muted)',
            fontWeight: activeTab === tab.key ? 700 : 500, fontSize: '0.85rem', cursor: 'pointer', transition: 'var(--transition-smooth)',
            fontFamily: 'var(--font-title)',
          }}>
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Collections Queue Tab */}
      {activeTab === 'queue' && (
        <div className="glass-panel" style={{ padding: '24px' }}>
          <table className="premium-table">
            <thead>
              <tr>
                <th>Contract</th>
                <th>Client</th>
                <th>Outstanding</th>
                <th>Aging</th>
                <th>Days Overdue</th>
                <th>Promise Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCollections.map(item => (
                <tr key={item.id}>
                  <td>
                    <strong style={{ fontSize: '0.8rem' }}>{item.contract_number}</strong>
                    <br />
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{item.unit_number}</span>
                  </td>
                  <td style={{ fontSize: '0.85rem' }}>{item.client_name}</td>
                  <td style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--color-danger)' }}>
                    {item.outstanding_amount.toLocaleString()} <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>EGP</span>
                  </td>
                  <td>{getAgingBadge(item.aging_bucket)}</td>
                  <td>
                    <span style={{ fontWeight: 700, color: item.days_overdue > 60 ? 'var(--color-danger)' : item.days_overdue > 30 ? '#f97316' : 'var(--color-warning)', fontSize: '0.85rem' }}>
                      {item.days_overdue} days
                    </span>
                  </td>
                  <td style={{ fontSize: '0.8rem' }}>
                    {item.promise_to_pay_date ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Calendar size={12} style={{ color: 'var(--color-primary)' }} />
                        {item.promise_to_pay_date}
                      </div>
                    ) : (
                      <span style={{ color: 'var(--text-muted)' }}>—</span>
                    )}
                  </td>
                  <td>{getStatusBadge(item.status)}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button className="btn-secondary" style={{ padding: '6px 10px', fontSize: '0.7rem' }} onClick={() => handleSetPromise(item.id)}>
                        <Calendar size={12} /> Set Promise
                      </button>
                      <button className="btn-secondary" style={{ padding: '6px 10px', fontSize: '0.7rem', borderColor: 'rgba(239,68,68,0.3)', color: 'var(--color-danger)' }} onClick={() => setCancelModal(item)}>
                        <XCircle size={12} /> Cancel
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Rescheduling Requests Tab */}
      {activeTab === 'reschedule' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {reschedules.map(req => (
            <div key={req.id} className="glass-panel" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '4px' }}>{req.contract_number}</h3>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{req.client_name} • Submitted {req.created_at}</span>
                </div>
                {req.status === 'pending' && <span className="badge badge-warning" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><Clock size={10} /> Pending Review</span>}
                {req.status === 'approved' && <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><CheckCircle size={10} /> Approved</span>}
                {req.status === 'rejected' && <span className="badge badge-danger" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><XCircle size={10} /> Rejected</span>}
              </div>

              <div style={{ padding: '14px 18px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-primary)', border: '1px solid var(--border-glass)', marginBottom: '16px' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Reason</span>
                <p style={{ fontSize: '0.85rem', marginTop: '6px', color: 'var(--text-main)', lineHeight: '1.6' }}>{req.reason}</p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                <div style={{ padding: '10px 16px', borderRadius: 'var(--radius-sm)', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)' }}>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Current Plan</span>
                  <p style={{ fontWeight: 700, color: 'var(--color-danger)' }}>{req.current_installments} installments</p>
                </div>
                <ArrowRight size={20} style={{ color: 'var(--text-muted)' }} />
                <div style={{ padding: '10px 16px', borderRadius: 'var(--radius-sm)', background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)' }}>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Proposed Plan</span>
                  <p style={{ fontWeight: 700, color: 'var(--color-success)' }}>{req.proposed_installments} installments</p>
                </div>
                <div style={{ padding: '10px 16px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-primary)', border: '1px solid var(--border-glass)' }}>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>New Monthly</span>
                  <p style={{ fontWeight: 700, color: 'var(--color-primary)' }}>{req.proposed_monthly.toLocaleString()} EGP</p>
                </div>

                {req.status === 'pending' && (
                  <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
                    <button className="btn-primary" style={{ padding: '8px 16px', fontSize: '0.75rem' }} onClick={() => handleApproveReschedule(req.id)}>
                      <CheckCircle size={12} /> Approve
                    </button>
                    <button className="btn-secondary" style={{ padding: '8px 16px', fontSize: '0.75rem', borderColor: 'rgba(239,68,68,0.3)', color: 'var(--color-danger)' }} onClick={() => alert('Please ask the client to submit a revised request or handle manually.')}>
                      <XCircle size={12} /> Reject
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Cancellations Tab */}
      {activeTab === 'cancel' && (
        <div className="glass-panel" style={{ padding: '32px', textAlign: 'center' }}>
          <Shield size={48} style={{ color: 'var(--text-muted)', margin: '0 auto 16px' }} />
          <h3 style={{ fontWeight: 700, marginBottom: '8px' }}>Cancellation Processor</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', maxWidth: '500px', margin: '0 auto 20px' }}>
            Select a contract from the Collections Queue and click "Cancel" to process a contract cancellation with automated penalty calculation.
          </p>
          <button className="btn-secondary" onClick={() => setActiveTab('queue')} style={{ padding: '10px 24px' }}>
            <ArrowRight size={14} /> Go to Collections Queue
          </button>
        </div>
      )}

      {/* Cancellation Modal */}
      {cancelModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px',
        }} onClick={() => setCancelModal(null)}>
          <div className="glass-panel" style={{ maxWidth: '500px', width: '100%', padding: '32px', position: 'relative' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
              <div style={{ padding: '10px', borderRadius: 'var(--radius-sm)', background: 'rgba(239,68,68,0.1)' }}>
                <AlertTriangle size={24} style={{ color: 'var(--color-danger)' }} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Process Cancellation</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{cancelModal.contract_number}</p>
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label className="form-label" style={{ fontSize: '0.8rem' }}>Penalty Rate (%)</label>
              <input type="range" min="0" max="30" value={penaltyRate} onChange={e => setPenaltyRate(Number(e.target.value))} style={{ width: '100%', accentColor: 'var(--color-danger)' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>0%</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-danger)' }}>{penaltyRate}%</span>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>30%</span>
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label className="form-label" style={{ fontSize: '0.8rem' }}>Cancellation Reason</label>
              <textarea
                className="form-control"
                placeholder="Enter cancellation reason (min 10 characters)..."
                value={cancelReason}
                onChange={e => setCancelReason(e.target.value)}
                style={{ width: '100%', minHeight: '60px', fontSize: '0.85rem', background: 'rgba(255,255,255,0.05)', color: 'var(--text-main)', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-sm)', padding: '8px' }}
                required
              />
            </div>

            <div style={{ padding: '16px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-primary)', border: '1px solid var(--border-glass)', marginBottom: '20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Outstanding</span>
                  <p style={{ fontWeight: 700, fontSize: '1.1rem' }}>{cancelModal.outstanding_amount.toLocaleString()} EGP</p>
                </div>
                <div>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Penalty</span>
                  <p style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--color-danger)' }}>{Math.round(cancelModal.outstanding_amount * penaltyRate / 100).toLocaleString()} EGP</p>
                </div>
                <div style={{ gridColumn: '1 / -1', borderTop: '1px solid var(--border-glass)', paddingTop: '10px' }}>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Net Refund</span>
                  <p style={{ fontWeight: 800, fontSize: '1.25rem', color: 'var(--color-success)' }}>{Math.round(cancelModal.outstanding_amount * (1 - penaltyRate / 100)).toLocaleString()} EGP</p>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button className="btn-secondary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => { setCancelModal(null); setCancelReason(''); }}>
                Cancel
              </button>
              <button
                className="btn-primary"
                style={{ flex: 1, justifyContent: 'center', background: 'linear-gradient(135deg, var(--color-danger), #dc2626)' }}
                onClick={() => {
                  if (cancelReason.trim().length < 10) {
                    alert('Please enter a cancellation reason (minimum 10 characters).');
                    return;
                  }
                  if (cancelModal.contract_id) {
                    handleCancelContract(cancelModal.contract_id, cancelReason, penaltyRate);
                  } else {
                    alert('Contract reference missing for cancellation.');
                  }
                }}
              >
                <XCircle size={14} /> Confirm Cancellation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Collections;
