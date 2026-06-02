import React, { useState, useEffect } from 'react';
import { FileText, CheckCircle, Clock, XCircle, Search, Download, PenTool, Eye, X, AlertTriangle, Plus } from 'lucide-react';
import api from '../../services/api';

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
  const [selectedContract, setSelectedContract] = useState<ContractData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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
        alert('Contract signed successfully.');
        fetchContracts();
      }
    } catch (err) {
      console.error('Failed to sign contract:', err);
      alert('Error signing contract.');
    }
  };

  const handleCancel = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this contract?')) return;
    try {
      const res = await api.post(`/v1/finance/contracts/${id}/cancel`);
      if (res.data?.success) {
        alert('Contract cancelled successfully.');
        setSelectedContract(null);
        fetchContracts();
      }
    } catch (err) {
      console.error('Failed to cancel contract:', err);
      alert('Error cancelling contract.');
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
                      <button className="btn-secondary" style={{ padding: '6px 10px', fontSize: '0.7rem' }} onClick={() => setSelectedContract(contract)}>
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
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px',
        }} onClick={() => setSelectedContract(null)}>
          <div className="glass-panel" style={{ maxWidth: '640px', width: '100%', padding: '32px', position: 'relative', maxHeight: '85vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <button onClick={() => setSelectedContract(null)} style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
              <X size={20} />
            </button>

            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '4px' }}>{selectedContract.contract_number}</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '24px' }}>Contract Details & Payment Timeline</p>

            {/* Contract Info Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
              {[
                { label: 'Client', value: selectedContract.client_name },
                { label: 'Unit', value: `${selectedContract.unit_number} — ${selectedContract.project_name}` },
                { label: 'Type', value: selectedContract.type },
                { label: 'Status', value: selectedContract.status },
                { label: 'Created', value: selectedContract.created_at },
                { label: 'Signed', value: selectedContract.signed_at || 'Not yet signed' },
              ].map((item, i) => (
                <div key={i} style={{ padding: '12px 16px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-primary)', border: '1px solid var(--border-glass)' }}>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{item.label}</span>
                  <p style={{ fontWeight: 600, marginTop: '4px', textTransform: 'capitalize' }}>{item.value}</p>
                </div>
              ))}
            </div>

            {/* Financial Summary */}
            <div style={{ padding: '20px', borderRadius: 'var(--radius-sm)', background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.15)', marginBottom: '20px' }}>
              <h4 style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: '16px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Financial Summary</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                <div>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Total Amount</span>
                  <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-primary)' }}>{selectedContract.total_amount.toLocaleString()}</h4>
                </div>
                <div>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Paid Amount</span>
                  <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-success)' }}>{selectedContract.paid_amount.toLocaleString()}</h4>
                </div>
                <div>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Outstanding</span>
                  <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-danger)' }}>{(selectedContract.total_amount - selectedContract.paid_amount).toLocaleString()}</h4>
                </div>
              </div>
              <div style={{ marginTop: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Collection Progress</span>
                  <span style={{ fontSize: '0.7rem', fontWeight: 700 }}>{Math.round((selectedContract.paid_amount / selectedContract.total_amount) * 100)}%</span>
                </div>
                <div style={{ height: '6px', borderRadius: '3px', background: 'rgba(255,255,255,0.05)' }}>
                  <div style={{ width: `${(selectedContract.paid_amount / selectedContract.total_amount) * 100}%`, height: '100%', borderRadius: '3px', background: 'linear-gradient(90deg, var(--color-primary), var(--color-success))' }} />
                </div>
              </div>
            </div>

            {/* Payment Plan Info */}
            <div style={{ padding: '16px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-primary)', border: '1px solid var(--border-glass)', marginBottom: '20px' }}>
              <h4 style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: '8px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Payment Plan</h4>
              <div style={{ display: 'flex', gap: '24px' }}>
                <div>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Installments</span>
                  <p style={{ fontWeight: 700 }}>{selectedContract.installments_count}</p>
                </div>
                <div>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Monthly Amount</span>
                  <p style={{ fontWeight: 700 }}>{selectedContract.monthly_amount.toLocaleString()} EGP</p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button className="btn-primary" style={{ flex: 1, justifyContent: 'center', padding: '12px' }}>
                <Download size={14} /> Download PDF
              </button>
              {selectedContract.status !== 'cancelled' && selectedContract.status !== 'completed' && (
                <button className="btn-secondary" style={{ padding: '12px 20px' }} onClick={() => handleCancel(selectedContract.id)}>
                  <AlertTriangle size={14} /> Cancel
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Contracts;
