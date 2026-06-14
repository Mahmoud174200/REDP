import React, { useState, useEffect } from 'react';
import api from '../../../services/api';
import {
  FileText, Plus, Search, Calendar, RefreshCw, Trash2, ArrowUpRight, CheckSquare, X, Play
} from 'lucide-react';

interface PRItem {
  name: string;
  description: string;
  quantity: number;
  estimated_unit_price: number;
}

interface PurchaseRequest {
  id: string;
  title: string;
  description: string;
  estimated_cost: string;
  required_by_date: string;
  status: string;
  items: PRItem[];
  requester?: { name: string };
  department?: { name: string };
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
      <div className="glass-panel" style={{ width: '95%', maxWidth: 650, maxHeight: '85vh', overflowY: 'auto', padding: 32, borderRadius: 'var(--radius-lg)' }} onClick={e => e.stopPropagation()}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: 20, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <FileText size={18} color="var(--color-primary)" />
          {title}
        </h2>
        {children}
      </div>
    </div>
  );
};

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div style={{ marginBottom: 14 }}>
    <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase' }}>{label}</label>
    {children}
  </div>
);

const PurchaseRequests: React.FC = () => {
  const [requests, setRequests] = useState<PurchaseRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  
  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedPR, setSelectedPR] = useState<PurchaseRequest | null>(null);

  // Form State
  const [form, setForm] = useState({
    title: '',
    description: '',
    estimated_cost: '',
    required_by_date: '',
    items: [] as PRItem[]
  });

  const [newItem, setNewItem] = useState({
    name: '',
    description: '',
    quantity: 1,
    estimated_unit_price: 0
  });

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    setLoading(true);
    try {
      const res = await api.get('/v1/enterprise/procurement/requests');
      setRequests(res.data?.data || []);
    } catch (err) {
      console.error('Error loading purchase requests:', err);
    }
    setLoading(false);
  };

  const handleAddItem = () => {
    if (!newItem.name || newItem.quantity <= 0) return;
    const cost = newItem.quantity * newItem.estimated_unit_price;
    setForm(p => ({
      ...p,
      items: [...p.items, { ...newItem }],
      estimated_cost: String((parseFloat(p.estimated_cost || '0') + cost).toFixed(2))
    }));
    setNewItem({ name: '', description: '', quantity: 1, estimated_unit_price: 0 });
  };

  const handleRemoveItem = (index: number) => {
    const item = form.items[index];
    const cost = item.quantity * item.estimated_unit_price;
    setForm(p => ({
      ...p,
      items: p.items.filter((_, i) => i !== index),
      estimated_cost: String((parseFloat(p.estimated_cost || '0') - cost).toFixed(2))
    }));
  };

  const handleSavePR = async () => {
    if (form.items.length === 0) {
      alert('Must add at least one item');
      return;
    }
    try {
      await api.post('/v1/enterprise/procurement/requests', {
        ...form,
        estimated_cost: parseFloat(form.estimated_cost)
      });
      setCreateModalOpen(false);
      setForm({ title: '', description: '', estimated_cost: '', required_by_date: '', items: [] });
      loadRequests();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Error saving purchase request');
    }
  };

  const handleSubmitApproval = async (id: string) => {
    try {
      await api.post(`/v1/enterprise/procurement/requests/${id}/submit-approval`);
      loadRequests();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Error submitting for approval');
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, React.CSSProperties> = {
      draft: { background: 'rgba(107,114,128,0.1)', color: '#6b7280' },
      pending_approval: { background: 'rgba(245,158,11,0.1)', color: '#f59e0b' },
      approved: { background: 'rgba(16,185,129,0.1)', color: '#10b981' },
      rejected: { background: 'rgba(239,68,68,0.1)', color: '#ef4444' },
      rfq_created: { background: 'rgba(59,130,246,0.1)', color: '#3b82f6' },
      ordered: { background: 'rgba(139,92,246,0.1)', color: '#8b5cf6' },
      completed: { background: 'rgba(16,185,129,0.2)', color: '#047857' }
    };
    return (
      <span style={{ fontSize: '0.7rem', fontWeight: 800, padding: '3px 8px', borderRadius: 99, ...styles[status] }}>
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
            <FileText size={24} color="var(--color-primary)" />
            📝 Purchase Requests (PR)
          </h1>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>
            Manage and submit project purchase requests for dynamic organizational multi-step approvals.
          </p>
        </div>
        <button className="btn-primary" onClick={() => setCreateModalOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem' }}>
          <Plus size={14} /> New Request
        </button>
      </div>

      {/* Toolbar */}
      <div className="glass-panel" style={{ padding: 16, borderRadius: 'var(--radius-lg)', marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: '40%' }}>
          <Search size={16} color="var(--text-muted)" />
          <input
            style={{ ...inputStyle, padding: '6px 10px', border: 'none', background: 'transparent' }}
            placeholder="Search requests by title..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <button className="btn-secondary" onClick={loadRequests} style={{ fontSize: '0.75rem', padding: '6px 12px' }}>
          <RefreshCw size={12} style={{ marginRight: 4 }} /> Refresh
        </button>
      </div>

      {/* PR Table List */}
      {loading ? (
        <div className="glass-panel" style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', borderRadius: 'var(--radius-lg)' }}>Loading requests...</div>
      ) : requests.length === 0 ? (
        <div className="glass-panel" style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', borderRadius: 'var(--radius-lg)' }}>No purchase requests found.</div>
      ) : (
        <div className="glass-panel" style={{ borderRadius: 'var(--radius-lg)', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr>
                <th style={headerStyle}>Title</th>
                <th style={headerStyle}>Requester</th>
                <th style={headerStyle}>Cost Estimate</th>
                <th style={headerStyle}>Required By</th>
                <th style={headerStyle}>Status</th>
                <th style={headerStyle}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests.filter(r => !search || r.title.toLowerCase().includes(search.toLowerCase())).map(r => (
                <tr key={r.id}>
                  <td style={cellStyle}>
                    <div style={{ fontWeight: 700 }}>{r.title}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{r.description}</div>
                  </td>
                  <td style={cellStyle}>
                    <div>{r.requester?.name || 'Unknown'}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{r.department?.name || 'N/A'}</div>
                  </td>
                  <td style={cellStyle}>{parseFloat(r.estimated_cost).toLocaleString()} EGP</td>
                  <td style={cellStyle}>{r.required_by_date ? new Date(r.required_by_date).toLocaleDateString() : 'Immediate'}</td>
                  <td style={cellStyle}>{getStatusBadge(r.status)}</td>
                  <td style={cellStyle}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn-secondary" style={{ padding: '4px 8px', fontSize: '0.72rem' }} onClick={() => { setSelectedPR(r); setDetailModalOpen(true); }}>
                        View
                      </button>
                      {r.status === 'draft' && (
                        <button className="btn-primary" style={{ padding: '4px 8px', fontSize: '0.72rem', background: 'var(--color-secondary)' }} onClick={() => handleSubmitApproval(r.id)}>
                          <Play size={10} style={{ marginRight: 2 }} /> Submit Approval
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

      {/* Create Modal */}
      <Modal open={createModalOpen} title="Create New Purchase Request" onClose={() => setCreateModalOpen(false)}>
        <Field label="Request Title">
          <input type="text" style={inputStyle} value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="e.g. Concrete Cement Bags purchase for Block A" />
        </Field>
        
        <Field label="Detailed Description">
          <textarea style={{ ...inputStyle, height: 80, resize: 'none' }} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Provide vendor guidelines or technical specifications..." />
        </Field>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Field label="Required By Date">
            <input type="date" style={inputStyle} value={form.required_by_date} onChange={e => setForm(p => ({ ...p, required_by_date: e.target.value }))} />
          </Field>
          <Field label="Total Estimated Cost (EGP)">
            <input type="text" style={{ ...inputStyle, background: 'rgba(0,0,0,0.05)' }} value={parseFloat(form.estimated_cost || '0').toLocaleString()} readOnly />
          </Field>
        </div>

        {/* Add Items Section */}
        <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: 16, marginTop: 10 }}>
          <h3 style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: 12 }}>Request Items</h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 8, marginBottom: 12 }}>
            <input type="text" style={{ ...inputStyle, padding: '6px 10px' }} value={newItem.name} onChange={e => setNewItem(p => ({ ...p, name: e.target.value }))} placeholder="Item Name" />
            <input type="number" style={{ ...inputStyle, padding: '6px 10px' }} value={newItem.quantity} onChange={e => setNewItem(p => ({ ...p, quantity: parseFloat(e.target.value) || 0 }))} placeholder="Qty" />
            <input type="number" style={{ ...inputStyle, padding: '6px 10px' }} value={newItem.estimated_unit_price} onChange={e => setNewItem(p => ({ ...p, estimated_unit_price: parseFloat(e.target.value) || 0 }))} placeholder="Unit Price" />
          </div>
          <button className="btn-secondary" style={{ width: '100%', fontSize: '0.75rem', padding: '6px 12px', justifyContent: 'center', marginBottom: 12 }} onClick={handleAddItem}>
            Add Item to Request
          </button>

          {/* List of Form Items */}
          {form.items.length > 0 && (
            <div style={{ maxHeight: 150, overflowY: 'auto', background: 'rgba(0,0,0,0.02)', borderRadius: 'var(--radius-sm)', padding: 8 }}>
              {form.items.map((item, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 8px', borderBottom: '1px solid rgba(0,0,0,0.05)', fontSize: '0.75rem' }}>
                  <div>
                    <strong>{item.name}</strong> x {item.quantity} (Unit: {item.estimated_unit_price} EGP)
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span>{(item.quantity * item.estimated_unit_price).toLocaleString()} EGP</span>
                    <button style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#ef4444' }} onClick={() => handleRemoveItem(idx)}>
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
          <button className="btn-primary" disabled={!form.title || form.items.length === 0} onClick={handleSavePR} style={{ flex: 1 }}>Save Request</button>
          <button className="btn-secondary" onClick={() => setCreateModalOpen(false)} style={{ flex: 1 }}>Cancel</button>
        </div>
      </Modal>

      {/* Details Modal */}
      <Modal open={detailModalOpen} title="Purchase Request Details" onClose={() => setDetailModalOpen(false)}>
        {selectedPR && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-main)' }}>{selectedPR.title}</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 4 }}>{selectedPR.description || 'No description provided.'}</p>
              </div>
              <div>{getStatusBadge(selectedPR.status)}</div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20, fontSize: '0.78rem' }}>
              <div>
                <span style={{ display: 'block', color: 'var(--text-muted)', fontWeight: 700 }}>Requested By:</span>
                <span>{selectedPR.requester?.name || 'Unknown'} ({selectedPR.department?.name || 'N/A'})</span>
              </div>
              <div>
                <span style={{ display: 'block', color: 'var(--text-muted)', fontWeight: 700 }}>Estimated Cost:</span>
                <span style={{ fontWeight: 700 }}>{parseFloat(selectedPR.estimated_cost).toLocaleString()} EGP</span>
              </div>
              <div>
                <span style={{ display: 'block', color: 'var(--text-muted)', fontWeight: 700 }}>Required Date:</span>
                <span>{selectedPR.required_by_date ? new Date(selectedPR.required_by_date).toLocaleDateString() : 'Immediate'}</span>
              </div>
              <div>
                <span style={{ display: 'block', color: 'var(--text-muted)', fontWeight: 700 }}>Created At:</span>
                <span>{new Date(selectedPR.created_at).toLocaleString()}</span>
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: 16 }}>
              <h4 style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: 10 }}>Requested Item Details</h4>
              <div style={{ background: 'rgba(0,0,0,0.02)', borderRadius: 'var(--radius-sm)', padding: 8 }}>
                <table style={{ width: '100%', fontSize: '0.75rem', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-glass)', color: 'var(--text-muted)' }}>
                      <th style={{ padding: 6, textAlign: 'left' }}>Item</th>
                      <th style={{ padding: 6, textAlign: 'right' }}>Qty</th>
                      <th style={{ padding: 6, textAlign: 'right' }}>Est. Price</th>
                      <th style={{ padding: 6, textAlign: 'right' }}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedPR.items?.map((item, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid rgba(0,0,0,0.03)' }}>
                        <td style={{ padding: 6 }}>{item.name}</td>
                        <td style={{ padding: 6, textAlign: 'right' }}>{item.quantity}</td>
                        <td style={{ padding: 6, textAlign: 'right' }}>{item.estimated_unit_price.toLocaleString()} EGP</td>
                        <td style={{ padding: 6, textAlign: 'right', fontWeight: 700 }}>{(item.quantity * item.estimated_unit_price).toLocaleString()} EGP</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn-secondary" onClick={() => setDetailModalOpen(false)}>Close</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default PurchaseRequests;
