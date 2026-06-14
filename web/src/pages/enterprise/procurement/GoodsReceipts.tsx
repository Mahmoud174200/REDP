import React, { useState, useEffect } from 'react';
import api from '../../../services/api';
import {
  CheckSquare, Plus, Search, Calendar, RefreshCw, ClipboardCheck, ClipboardList
} from 'lucide-react';

interface GRItem {
  item_index: number;
  name: string;
  ordered_quantity: number;
  received_quantity: number;
  status: string; // good, damaged, shortage
}

interface GoodsReceipt {
  id: string;
  purchase_order_id: string;
  received_date: string;
  notes: string;
  status: string;
  items: GRItem[];
  purchase_order?: { po_number: string; title: string; vendor?: { name: string } };
  receiver?: { name: string };
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
          <ClipboardCheck size={18} color="var(--color-primary)" />
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

const GoodsReceipts: React.FC = () => {
  const [receipts, setReceipts] = useState<GoodsReceipt[]>([]);
  const [activePOs, setActivePOs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedGR, setSelectedGR] = useState<GoodsReceipt | null>(null);

  // Form State
  const [form, setForm] = useState({
    purchase_order_id: '',
    received_date: new Date().toISOString().substring(0, 10),
    notes: '',
    items: [] as GRItem[]
  });

  useEffect(() => {
    loadReceipts();
    loadActivePOs();
  }, []);

  const loadReceipts = async () => {
    setLoading(true);
    try {
      const res = await api.get('/v1/enterprise/procurement/receipts');
      setReceipts(res.data?.data || []);
    } catch (err) {
      console.error('Error loading receipts:', err);
    }
    setLoading(false);
  };

  const loadActivePOs = async () => {
    try {
      const res = await api.get('/v1/enterprise/procurement/orders');
      const list = res.data?.data || [];
      // Only POs that are approved, sent to vendor, or partially received can be received
      setActivePOs(list.filter((po: any) => ['approved', 'sent_to_vendor', 'goods_received', 'partially_received'].includes(po.status)));
    } catch (err) {
      console.error('Error loading active POs:', err);
    }
  };

  const handlePOChange = async (poId: string) => {
    if (!poId) return;
    const po = activePOs.find(p => p.id === poId);
    if (!po) return;

    setForm(p => ({
      ...p,
      purchase_order_id: po.id,
      items: po.items.map((it: any, idx: number) => ({
        item_index: idx,
        name: it.name,
        ordered_quantity: parseFloat(it.quantity),
        received_quantity: parseFloat(it.quantity), // Default to fully received
        status: 'good'
      }))
    }));
  };

  const handleSaveReceipt = async () => {
    try {
      await api.post('/v1/enterprise/procurement/receipts', form);
      setCreateModalOpen(false);
      setForm({
        purchase_order_id: '',
        received_date: new Date().toISOString().substring(0, 10),
        notes: '',
        items: []
      });
      loadReceipts();
      loadActivePOs();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Error recording goods receipt');
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, React.CSSProperties> = {
      draft: { background: 'rgba(107,114,128,0.1)', color: '#6b7280' },
      verified: { background: 'rgba(16,185,129,0.1)', color: '#10b981' },
      disputed: { background: 'rgba(239,68,68,0.1)', color: '#ef4444' }
    };
    return (
      <span style={{ fontSize: '0.7rem', fontWeight: 800, padding: '3px 8px', borderRadius: 99, ...styles[status] }}>
        {status.toUpperCase()}
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
            <ClipboardList size={24} color="var(--color-primary)" />
            📦 Goods Receipts (GR)
          </h1>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>
            Log materials delivery, verify quantity balances, and record quality inspection logs.
          </p>
        </div>
        <button className="btn-primary" onClick={() => setCreateModalOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem' }}>
          <Plus size={14} /> Log Delivery
        </button>
      </div>

      {/* Toolbar */}
      <div className="glass-panel" style={{ padding: 16, borderRadius: 'var(--radius-lg)', marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: '40%' }}>
          <Search size={16} color="var(--text-muted)" />
          <input
            style={{ ...inputStyle, padding: '6px 10px', border: 'none', background: 'transparent' }}
            placeholder="Search receipts by PO number..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <button className="btn-secondary" onClick={loadReceipts} style={{ fontSize: '0.75rem', padding: '6px 12px' }}>
          <RefreshCw size={12} style={{ marginRight: 4 }} /> Refresh
        </button>
      </div>

      {/* GR List Table */}
      {loading ? (
        <div className="glass-panel" style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', borderRadius: 'var(--radius-lg)' }}>Loading receipts...</div>
      ) : receipts.length === 0 ? (
        <div className="glass-panel" style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', borderRadius: 'var(--radius-lg)' }}>No Goods Receipts recorded.</div>
      ) : (
        <div className="glass-panel" style={{ borderRadius: 'var(--radius-lg)', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr>
                <th style={headerStyle}>Purchase Order</th>
                <th style={headerStyle}>Vendor Supplier</th>
                <th style={headerStyle}>Received Date</th>
                <th style={headerStyle}>Received By</th>
                <th style={headerStyle}>Status</th>
                <th style={headerStyle}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {receipts.filter(r => !search || r.purchase_order?.po_number.toLowerCase().includes(search.toLowerCase())).map(r => (
                <tr key={r.id}>
                  <td style={cellStyle}>
                    <div style={{ fontFamily: 'monospace', fontWeight: 800 }}>{r.purchase_order?.po_number}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{r.purchase_order?.title}</div>
                  </td>
                  <td style={cellStyle}>{r.purchase_order?.vendor?.name || 'N/A'}</td>
                  <td style={cellStyle}>{new Date(r.received_date).toLocaleDateString()}</td>
                  <td style={cellStyle}>{r.receiver?.name || 'N/A'}</td>
                  <td style={cellStyle}>{getStatusBadge(r.status)}</td>
                  <td style={cellStyle}>
                    <button className="btn-secondary" style={{ padding: '4px 8px', fontSize: '0.72rem' }} onClick={() => { setSelectedGR(r); setDetailModalOpen(true); }}>
                      Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Modal */}
      <Modal open={createModalOpen} title="Log Goods Material Delivery" onClose={() => setCreateModalOpen(false)}>
        <Field label="Choose Approved Purchase Order">
          <select style={inputStyle} value={form.purchase_order_id} onChange={e => handlePOChange(e.target.value)}>
            <option value="">-- Choose PO --</option>
            {activePOs.map(po => (
              <option key={po.id} value={po.id}>{po.po_number} - {po.title} ({po.vendor?.name})</option>
            ))}
          </select>
        </Field>

        <Field label="Received Date">
          <input type="date" style={inputStyle} value={form.received_date} onChange={e => setForm(p => ({ ...p, received_date: e.target.value }))} />
        </Field>

        <Field label="Receipt Notes / Remarks">
          <textarea style={{ ...inputStyle, height: 60, resize: 'none' }} value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} placeholder="Note damaged items or package shortages..." />
        </Field>

        {form.items.length > 0 && (
          <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: 16, marginTop: 10 }}>
            <h4 style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: 12 }}>Items Quantities Delivered</h4>
            <div style={{ maxHeight: 200, overflowY: 'auto', background: 'rgba(0,0,0,0.01)', padding: 8, borderRadius: 4 }}>
              {form.items.map((item, idx) => (
                <div key={idx} style={{ display: 'grid', gridTemplateColumns: '3fr 1.5fr 1.5fr 2fr', gap: 10, alignItems: 'center', marginBottom: 10, fontSize: '0.75rem' }}>
                  <span>{item.name}</span>
                  <span style={{ color: 'var(--text-muted)' }}>Ordered: {item.ordered_quantity}</span>
                  <input
                    type="number"
                    style={{ ...inputStyle, padding: '6px 10px' }}
                    value={item.received_quantity}
                    onChange={e => {
                      const val = parseFloat(e.target.value) || 0;
                      setForm(p => {
                        const newItems = [...p.items];
                        newItems[idx] = { ...newItems[idx], received_quantity: val };
                        return { ...p, items: newItems };
                      });
                    }}
                  />
                  <select
                    style={{ ...inputStyle, padding: '6px 10px' }}
                    value={item.status}
                    onChange={e => {
                      const val = e.target.value;
                      setForm(p => {
                        const newItems = [...p.items];
                        newItems[idx] = { ...newItems[idx], status: val };
                        return { ...p, items: newItems };
                      });
                    }}
                  >
                    <option value="good">Good (QA ok)</option>
                    <option value="damaged">Damaged</option>
                    <option value="shortage">Shortage</option>
                  </select>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
          <button className="btn-primary" disabled={!form.purchase_order_id || form.items.length === 0} onClick={handleSaveReceipt} style={{ flex: 1 }}>Save Goods Receipt</button>
          <button className="btn-secondary" onClick={() => setCreateModalOpen(false)} style={{ flex: 1 }}>Cancel</button>
        </div>
      </Modal>

      {/* Details Modal */}
      <Modal open={detailModalOpen} title="Goods Receipt Details" onClose={() => setDetailModalOpen(false)}>
        {selectedGR && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
              <div>
                <span style={{ fontSize: '0.75rem', fontFamily: 'monospace', fontWeight: 800, color: 'var(--text-muted)' }}>PO Ref: {selectedGR.purchase_order?.po_number}</span>
                <h3 style={{ fontSize: '1.0rem', fontWeight: 800, color: 'var(--text-main)', marginTop: 2 }}>{selectedGR.purchase_order?.title}</h3>
              </div>
              <div>{getStatusBadge(selectedGR.status)}</div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20, fontSize: '0.78rem' }}>
              <div>
                <span style={{ display: 'block', color: 'var(--text-muted)', fontWeight: 700 }}>Vendor Supplier:</span>
                <span>{selectedGR.purchase_order?.vendor?.name || 'N/A'}</span>
              </div>
              <div>
                <span style={{ display: 'block', color: 'var(--text-muted)', fontWeight: 700 }}>Received By:</span>
                <span>{selectedGR.receiver?.name || 'N/A'}</span>
              </div>
              <div>
                <span style={{ display: 'block', color: 'var(--text-muted)', fontWeight: 700 }}>Delivery Date:</span>
                <span>{new Date(selectedGR.received_date).toLocaleDateString()}</span>
              </div>
              <div>
                <span style={{ display: 'block', color: 'var(--text-muted)', fontWeight: 700 }}>Remarks:</span>
                <span>{selectedGR.notes || 'None'}</span>
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: 16 }}>
              <h4 style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: 10 }}>Received Materials Inspection</h4>
              <div style={{ background: 'rgba(0,0,0,0.02)', borderRadius: 'var(--radius-sm)', padding: 8 }}>
                <table style={{ width: '100%', fontSize: '0.75rem', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-glass)', color: 'var(--text-muted)' }}>
                      <th style={{ padding: 6, textAlign: 'left' }}>Item</th>
                      <th style={{ padding: 6, textAlign: 'right' }}>Ordered</th>
                      <th style={{ padding: 6, textAlign: 'right' }}>Received</th>
                      <th style={{ padding: 6, textAlign: 'center' }}>Inspection Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedGR.items?.map((item, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid rgba(0,0,0,0.03)' }}>
                        <td style={{ padding: 6 }}>{item.name}</td>
                        <td style={{ padding: 6, textAlign: 'right' }}>{item.ordered_quantity}</td>
                        <td style={{ padding: 6, textAlign: 'right', fontWeight: 700 }}>{item.received_quantity}</td>
                        <td style={{ padding: 6, textAlign: 'center' }}>
                          <span style={{
                            fontSize: '0.65rem',
                            fontWeight: 800,
                            padding: '2px 6px',
                            borderRadius: 4,
                            background: item.status === 'good' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                            color: item.status === 'good' ? '#10b981' : '#ef4444'
                          }}>
                            {item.status.toUpperCase()}
                          </span>
                        </td>
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

export default GoodsReceipts;
