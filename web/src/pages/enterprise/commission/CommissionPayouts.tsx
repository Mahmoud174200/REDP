import React, { useState, useEffect } from 'react';
import api from '../../../services/api';
import {
  Wallet, Search, Calendar, RefreshCw, CheckCircle, Play, Users, Clock
} from 'lucide-react';

interface Calculation {
  id: string;
  deal_amount: string;
  calculated_percentage: string;
  calculated_amount: string;
  contract?: { contract_number: string };
  rule?: { title: string };
}

interface Payout {
  id: string;
  payout_number: string;
  recipient_type: string;
  total_amount: string;
  status: string;
  approved_at: string | null;
  user?: { name: string };
  broker?: { name: string };
  approver?: { name: string };
  calculations?: Calculation[];
  created_at: string;
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-md)',
  border: '1px solid var(--border-glass)', background: 'rgba(255,255,255,0.6)',
  fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-main)', outline: 'none',
  boxSizing: 'border-box',
};

const Modal: React.FC<{ open: boolean; title: string; onClose: () => void; children: React.ReactNode }> = ({ open, title, onClose, children }) => {
  if (!open) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(4px)' }} onClick={onClose}>
      <div className="glass-panel" style={{ width: '95%', maxWidth: 600, maxHeight: '85vh', overflowY: 'auto', padding: 32, borderRadius: 'var(--radius-lg)' }} onClick={e => e.stopPropagation()}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: 20, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Wallet size={18} color="var(--color-primary)" />
          {title}
        </h2>
        {children}
      </div>
    </div>
  );
};

const CommissionPayouts: React.FC = () => {
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  
  // Modals
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedPayout, setSelectedPayout] = useState<Payout | null>(null);

  useEffect(() => {
    loadPayouts();
  }, []);

  const loadPayouts = async () => {
    setLoading(true);
    try {
      const res = await api.get('/v1/enterprise/commissions/payouts');
      setPayouts(res.data?.data || []);
    } catch (err) {
      console.error('Error loading payouts:', err);
    }
    setLoading(false);
  };

  const handleDisburse = async (id: string) => {
    if (!window.confirm('Are you sure you want to disburse this payment?')) return;
    try {
      await api.post(`/v1/enterprise/commissions/payouts/${id}/pay`);
      alert('Payment disbursed successfully!');
      loadPayouts();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Error disbursing payout');
    }
  };

  const getRecipientName = (p: Payout) => {
    if (p.user) return `${p.user.name} (Internal)`;
    if (p.broker) return `${p.broker.name} (External)`;
    return 'N/A';
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, React.CSSProperties> = {
      pending_approval: { background: 'rgba(245,158,11,0.1)', color: '#f59e0b' },
      approved: { background: 'rgba(59,130,246,0.1)', color: '#3b82f6' },
      rejected: { background: 'rgba(239,68,68,0.1)', color: '#ef4444' },
      paid: { background: 'rgba(16,185,129,0.1)', color: '#10b981' }
    };
    return (
      <span style={{ fontSize: '0.68rem', fontWeight: 800, padding: '3px 8px', borderRadius: 99, ...styles[status] }}>
        {status.replace('_', ' ').toUpperCase()}
      </span>
    );
  };

  const cellStyle: React.CSSProperties = { padding: '12px 16px', fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-main)', borderBottom: '1px solid var(--border-glass)' };
  const headerStyle: React.CSSProperties = { ...cellStyle, fontWeight: 800, fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.06em', background: 'rgba(255,255,255,0.4)' };

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 10 }}>
            <Wallet size={24} color="var(--color-primary)" />
            💸 Commission Payout Batches
          </h1>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>
            Track payout batches, monitor workflow approval status, and disburse bank release entries.
          </p>
        </div>
      </div>

      {/* Commission Process Guide Banner */}
      <div className="glass-panel" style={{ padding: '20px 24px', borderRadius: 'var(--radius-lg)', marginBottom: 24, background: 'rgba(139, 92, 246, 0.04)', border: '1px solid rgba(139, 92, 246, 0.15)' }}>
        <h3 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#8b5cf6', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
          💡 Payout Batches Life Cycle & Status Guide
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
          {[
            { step: 'A', title: 'Batch Created', desc: 'Calculations are bundled from ledger with status "Pending Approval".' },
            { step: 'B', title: 'Route Workflows', desc: 'Sent dynamically through configured enterprise approval workflow stages.' },
            { step: 'C', title: 'Approved', desc: 'Once approved by all validators, status advances to "Approved".' },
            { step: 'D', title: 'Disburse', desc: 'Finance officer triggers "Disburse" to release funds via Bank/Stripe.' }
          ].map((s, idx) => (
            <div key={idx} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <span style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: 22, height: 22, borderRadius: '50%',
                background: '#8b5cf6', color: '#fff',
                fontSize: '0.72rem', fontWeight: 800, flexShrink: 0
              }}>
                {s.step}
              </span>
              <div>
                <h4 style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: 2 }}>{s.title}</h4>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', lineHeight: '1.3' }}>{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Toolbar */}
      <div className="glass-panel" style={{ padding: 16, borderRadius: 'var(--radius-lg)', marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: '40%' }}>
          <Search size={16} color="var(--text-muted)" />
          <input
            style={{ ...inputStyle, padding: '6px 10px', border: 'none', background: 'transparent' }}
            placeholder="Search payouts by number..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <button className="btn-secondary" onClick={loadPayouts} style={{ fontSize: '0.75rem', padding: '6px 12px' }}>
          <RefreshCw size={12} style={{ marginRight: 4 }} /> Refresh
        </button>
      </div>

      {/* List Table */}
      {loading ? (
        <div className="glass-panel" style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', borderRadius: 'var(--radius-lg)' }}>Loading payouts...</div>
      ) : payouts.length === 0 ? (
        <div className="glass-panel" style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', borderRadius: 'var(--radius-lg)' }}>No payout batches found.</div>
      ) : (
        <div className="glass-panel" style={{ borderRadius: 'var(--radius-lg)', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr>
                <th style={headerStyle}>Payout Number</th>
                <th style={headerStyle}>Recipient</th>
                <th style={headerStyle}>Batch Amount</th>
                <th style={headerStyle}>Status</th>
                <th style={headerStyle}>Approver</th>
                <th style={headerStyle}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {payouts.filter(p => !search || p.payout_number.toLowerCase().includes(search.toLowerCase())).map(p => (
                <tr key={p.id}>
                  <td style={cellStyle}>
                    <div style={{ fontFamily: 'monospace', fontWeight: 800 }}>{p.payout_number}</div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Created: {new Date(p.created_at).toLocaleDateString()}</div>
                  </td>
                  <td style={cellStyle}>{getRecipientName(p)}</td>
                  <td style={cellStyle}>{parseFloat(p.total_amount).toLocaleString()} EGP</td>
                  <td style={cellStyle}>{getStatusBadge(p.status)}</td>
                  <td style={cellStyle}>
                    {p.approver ? (
                      <div>
                        <div>{p.approver.name}</div>
                        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{p.approved_at ? new Date(p.approved_at).toLocaleDateString() : ''}</div>
                      </div>
                    ) : (
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Not Approved</span>
                    )}
                  </td>
                  <td style={cellStyle}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn-secondary" style={{ padding: '4px 8px', fontSize: '0.72rem' }} onClick={() => { setSelectedPayout(p); setDetailModalOpen(true); }}>
                        View
                      </button>
                      {p.status === 'approved' && (
                        <button className="btn-primary" style={{ padding: '4px 8px', fontSize: '0.72rem' }} onClick={() => handleDisburse(p.id)}>
                          Disburse
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Details Modal */}
      <Modal open={detailModalOpen} title="Payout Batch Specifications" onClose={() => setDetailModalOpen(false)}>
        {selectedPayout && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
              <div>
                <span style={{ fontSize: '0.75rem', fontFamily: 'monospace', fontWeight: 800, color: 'var(--text-muted)' }}>{selectedPayout.payout_number}</span>
                <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-main)', marginTop: 2 }}>{getRecipientName(selectedPayout)}</h3>
              </div>
              <div>{getStatusBadge(selectedPayout.status)}</div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20, fontSize: '0.78rem' }}>
              <div>
                <span style={{ display: 'block', color: 'var(--text-muted)', fontWeight: 700 }}>Total Payout Amount:</span>
                <span style={{ fontWeight: 700, color: 'var(--color-primary)' }}>{parseFloat(selectedPayout.total_amount).toLocaleString()} EGP</span>
              </div>
              <div>
                <span style={{ display: 'block', color: 'var(--text-muted)', fontWeight: 700 }}>Creation Date:</span>
                <span>{new Date(selectedPayout.created_at).toLocaleString()}</span>
              </div>
              <div>
                <span style={{ display: 'block', color: 'var(--text-muted)', fontWeight: 700 }}>Approver signature:</span>
                <span>{selectedPayout.approver?.name || 'Waiting for Approval'}</span>
              </div>
              <div>
                <span style={{ display: 'block', color: 'var(--text-muted)', fontWeight: 700 }}>Recipient Type:</span>
                <span style={{ textTransform: 'capitalize' }}>{selectedPayout.recipient_type}</span>
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: 16 }}>
              <h4 style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: 10 }}>Calculations Batched</h4>
              <div style={{ background: 'rgba(0,0,0,0.02)', borderRadius: 'var(--radius-sm)', padding: 8, maxHeight: 180, overflowY: 'auto' }}>
                <table style={{ width: '100%', fontSize: '0.75rem', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-glass)', color: 'var(--text-muted)' }}>
                      <th style={{ padding: 6, textAlign: 'left' }}>Contract</th>
                      <th style={{ padding: 6, textAlign: 'left' }}>Rule Formula</th>
                      <th style={{ padding: 6, textAlign: 'right' }}>deal amount</th>
                      <th style={{ padding: 6, textAlign: 'right' }}>Commission</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedPayout.calculations?.map((item, idx) => (
                      <tr key={item.id || idx} style={{ borderBottom: '1px solid rgba(0,0,0,0.03)' }}>
                        <td style={{ padding: 6 }}>CTR: {item.contract?.contract_number}</td>
                        <td style={{ padding: 6 }}>{item.rule?.title} ({parseFloat(item.calculated_percentage)}%)</td>
                        <td style={{ padding: 6, textAlign: 'right' }}>{parseFloat(item.deal_amount).toLocaleString()} EGP</td>
                        <td style={{ padding: 6, textAlign: 'right', fontWeight: 700 }}>{parseFloat(item.calculated_amount).toLocaleString()} EGP</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              {selectedPayout.status === 'approved' && (
                <button className="btn-primary" onClick={() => handleDisburse(selectedPayout.id)}>
                  Disburse Payment
                </button>
              )}
              <button className="btn-secondary" onClick={() => setDetailModalOpen(false)}>Close</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default CommissionPayouts;
