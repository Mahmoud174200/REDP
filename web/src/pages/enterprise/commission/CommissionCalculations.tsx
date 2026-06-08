import React, { useState, useEffect } from 'react';
import api from '../../../services/api';
import {
  FileText, Search, Calendar, RefreshCw, FolderPlus, HelpCircle
} from 'lucide-react';

interface Calculation {
  id: string;
  payment_id: string;
  contract_id: string;
  rule_id: string;
  payout_id: string | null;
  user_id: string | null;
  broker_id: string | null;
  deal_amount: string;
  calculated_percentage: string;
  calculated_amount: string;
  status: string;
  payment?: { transaction_ref: string };
  contract?: { contract_number: string; unit?: { code: string } };
  rule?: { title: string; tier_type: string };
  user?: { name: string };
  broker?: { name: string };
  created_at: string;
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-md)',
  border: '1px solid var(--border-glass)', background: 'rgba(255,255,255,0.6)',
  fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-main)', outline: 'none',
  boxSizing: 'border-box',
};

const CommissionCalculations: React.FC = () => {
  const [calcs, setCalcs] = useState<Calculation[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    loadCalculations();
  }, [statusFilter]);

  const loadCalculations = async () => {
    setLoading(true);
    try {
      const res = await api.get('/v1/enterprise/commissions/calculations', {
        params: { status: statusFilter }
      });
      setCalcs(res.data?.data || []);
      setSelectedIds([]);
    } catch (err) {
      console.error('Error loading calculations:', err);
    }
    setLoading(false);
  };

  const handleSelectToggle = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = (filteredCalcs: Calculation[]) => {
    const pendingFiltered = filteredCalcs.filter(c => c.status === 'pending' && !c.payout_id);
    if (selectedIds.length === pendingFiltered.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(pendingFiltered.map(c => c.id));
    }
  };

  const handleBatchPayout = async () => {
    if (selectedIds.length === 0) return;
    
    // Find the recipient details of the first selected item to verify they all belong to same recipient
    const firstCalc = calcs.find(c => c.id === selectedIds[0]);
    if (!firstCalc) return;

    const recipientType = firstCalc.user_id ? 'user' : 'broker';
    const recipientId = firstCalc.user_id || firstCalc.broker_id;

    // Verify all selected calculations belong to this same recipient
    const mismatch = selectedIds.some(id => {
      const c = calcs.find(item => item.id === id);
      if (!c) return true;
      const cType = c.user_id ? 'user' : 'broker';
      const cId = c.user_id || c.broker_id;
      return cType !== recipientType || cId !== recipientId;
    });

    if (mismatch) {
      alert('Selected calculations belong to different recipients. Please select calculations for a single user/broker to batch them.');
      return;
    }

    try {
      await api.post('/v1/enterprise/commissions/payouts', {
        calculation_ids: selectedIds,
        recipient_type: recipientType,
        recipient_id: recipientId
      });
      alert('Batch payout generated and submitted for workflow approval.');
      loadCalculations();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Error batching payout');
    }
  };

  const getRecipientName = (c: Calculation) => {
    if (c.user) return `${c.user.name} (Internal)`;
    if (c.broker) return `${c.broker.name} (External)`;
    return 'N/A';
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, React.CSSProperties> = {
      pending: { background: 'rgba(107,114,128,0.1)', color: '#6b7280' },
      approved: { background: 'rgba(59,130,246,0.1)', color: '#3b82f6' },
      rejected: { background: 'rgba(239,68,68,0.1)', color: '#ef4444' },
      paid: { background: 'rgba(16,185,129,0.1)', color: '#10b981' }
    };
    return (
      <span style={{ fontSize: '0.68rem', fontWeight: 800, padding: '3px 8px', borderRadius: 99, ...styles[status] }}>
        {status.toUpperCase()}
      </span>
    );
  };

  const cellStyle: React.CSSProperties = { padding: '12px 16px', fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-main)', borderBottom: '1px solid var(--border-glass)' };
  const headerStyle: React.CSSProperties = { ...cellStyle, fontWeight: 800, fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.06em', background: 'rgba(255,255,255,0.4)' };

  const filtered = calcs.filter(c => {
    const nameMatch = c.user?.name.toLowerCase().includes(search.toLowerCase()) || 
                      c.broker?.name.toLowerCase().includes(search.toLowerCase()) ||
                      c.contract?.contract_number.toLowerCase().includes(search.toLowerCase());
    return !search || nameMatch;
  });

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 10 }}>
            <FileText size={24} color="var(--color-primary)" />
            📊 Commission Calculations Ledger
          </h1>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>
            Inspect automated override calculations, select lines, and batch payments for approval.
          </p>
        </div>
        {selectedIds.length > 0 && (
          <button className="btn-primary" onClick={handleBatchPayout} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', background: 'var(--color-secondary)' }}>
            <FolderPlus size={14} /> Batch Payout ({selectedIds.length})
          </button>
        )}
      </div>

      {/* Toolbar */}
      <div className="glass-panel" style={{ padding: 16, borderRadius: 'var(--radius-lg)', marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: '40%' }}>
          <Search size={16} color="var(--text-muted)" />
          <input
            style={{ ...inputStyle, padding: '6px 10px', border: 'none', background: 'transparent' }}
            placeholder="Search by recipient or contract..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <select style={{ ...inputStyle, padding: '6px 10px', width: 'auto' }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="">-- All Statuses --</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="paid">Paid</option>
          </select>
          <button className="btn-secondary" onClick={loadCalculations} style={{ fontSize: '0.75rem', padding: '6px 12px' }}>
            <RefreshCw size={12} style={{ marginRight: 4 }} /> Refresh
          </button>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="glass-panel" style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', borderRadius: 'var(--radius-lg)' }}>Loading ledger...</div>
      ) : filtered.length === 0 ? (
        <div className="glass-panel" style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', borderRadius: 'var(--radius-lg)' }}>No calculations found.</div>
      ) : (
        <div className="glass-panel" style={{ borderRadius: 'var(--radius-lg)', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr>
                <th style={{ ...headerStyle, width: 40, textAlign: 'center' }}>
                  <input
                    type="checkbox"
                    checked={selectedIds.length === filtered.filter(c => c.status === 'pending' && !c.payout_id).length && selectedIds.length > 0}
                    onChange={() => handleSelectAll(filtered)}
                  />
                </th>
                <th style={headerStyle}>Recipient</th>
                <th style={headerStyle}>Contract / Unit</th>
                <th style={headerStyle}>Formula / Rule</th>
                <th style={headerStyle}>deal amount</th>
                <th style={headerStyle}>Calculated Payout</th>
                <th style={headerStyle}>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.id}>
                  <td style={{ ...cellStyle, textAlign: 'center' }}>
                    <input
                      type="checkbox"
                      disabled={c.status !== 'pending' || !!c.payout_id}
                      checked={selectedIds.includes(c.id)}
                      onChange={() => handleSelectToggle(c.id)}
                    />
                  </td>
                  <td style={cellStyle}>
                    <div style={{ fontWeight: 700 }}>{getRecipientName(c)}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Level: {c.rule?.tier_type.toUpperCase()}</div>
                  </td>
                  <td style={cellStyle}>
                    <div style={{ fontWeight: 700 }}>CTR: {c.contract?.contract_number}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Unit: {c.contract?.unit?.code}</div>
                  </td>
                  <td style={cellStyle}>
                    <div>{c.rule?.title}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Rate: {parseFloat(c.calculated_percentage)}%</div>
                  </td>
                  <td style={cellStyle}>{parseFloat(c.deal_amount).toLocaleString()} EGP</td>
                  <td style={cellStyle}><strong style={{ color: 'var(--color-primary)' }}>{parseFloat(c.calculated_amount).toLocaleString()} EGP</strong></td>
                  <td style={cellStyle}>
                    {getStatusBadge(c.status)}
                    {c.payout_id && (
                      <span style={{ display: 'block', fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: 2 }}>Batched in Payout</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default CommissionCalculations;
