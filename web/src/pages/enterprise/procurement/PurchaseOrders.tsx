import React, { useState, useEffect } from 'react';
import api from '../../../services/api';
import {
  FileText, Plus, Search, Calendar, RefreshCw, CheckSquare, Play, Users, Clock, ShoppingCart
} from 'lucide-react';

interface POItem {
  name: string;
  quantity: number;
  unit_price: number;
}

interface PurchaseOrder {
  id: string;
  po_number: string;
  title: string;
  total_amount: string;
  status: string;
  approved_at: string | null;
  items: POItem[];
  vendor?: { name: string };
  purchase_request?: { title: string };
  vendor_quotation?: { total_quoted_amount: string };
  approver?: { name: string };
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
          <ShoppingCart size={18} color="var(--color-primary)" />
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

const PurchaseOrders: React.FC = () => {
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [rfqs, setRfqs] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);

  // Form State
  const [form, setForm] = useState({
    title: '',
    purchase_request_id: '',
    rfq_id: '',
    vendor_quotation_id: '',
    vendor_id: '',
    total_amount: '',
    items: [] as POItem[]
  });

  useEffect(() => {
    loadOrders();
    loadRFQs();
    loadVendors();
  }, []);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const res = await api.get('/v1/enterprise/procurement/orders');
      setOrders(res.data?.data || []);
    } catch (err) {
      console.error('Error loading POs:', err);
    }
    setLoading(false);
  };

  const loadRFQs = async () => {
    try {
      const res = await api.get('/v1/enterprise/procurement/rfqs');
      // Fetch only closed RFQs that have accepted quotations
      setRfqs(res.data?.data || []);
    } catch (err) {
      console.error('Error loading RFQs:', err);
    }
  };

  const loadVendors = async () => {
    try {
      const res = await api.get('/v1/delivery/vendors');
      setVendors(res.data?.data || []);
    } catch (err) {
      console.error('Error loading vendors:', err);
    }
  };

  const handleRFQChange = async (rfqId: string) => {
    if (!rfqId) return;
    try {
      const res = await api.get(`/v1/enterprise/procurement/rfqs/${rfqId}`);
      const rfq = res.data?.data;
      if (!rfq) return;

      // Find accepted quotation
      const acceptedQuote = rfq.quotations?.find((q: any) => q.status === 'accepted');
      if (!acceptedQuote) {
        alert('This RFQ has no accepted quotation yet. Please select vendor manually.');
        setForm(p => ({
          ...p,
          rfq_id: rfq.id,
          purchase_request_id: rfq.purchase_request_id || '',
          title: `Order: ${rfq.title}`,
          items: rfq.items.map((i: any) => ({ name: i.name, quantity: i.quantity, unit_price: 0 }))
        }));
        return;
      }

      // Map items with pricing from accepted quotation
      const itemsMapped = rfq.items.map((item: any, idx: number) => {
        const quoteItem = acceptedQuote.items?.find((qi: any) => qi.item_index === idx);
        const unitPrice = quoteItem ? parseFloat(quoteItem.quoted_unit_price) : 0;
        return {
          name: item.name,
          quantity: parseFloat(item.quantity),
          unit_price: unitPrice
        };
      });

      setForm({
        title: `Order: ${rfq.title}`,
        purchase_request_id: rfq.purchase_request_id || '',
        rfq_id: rfq.id,
        vendor_quotation_id: acceptedQuote.id,
        vendor_id: acceptedQuote.vendor_id,
        total_amount: acceptedQuote.total_quoted_amount,
        items: itemsMapped
      });
    } catch (err) {
      console.error('Error fetching RFQ details:', err);
    }
  };

  const handleSavePO = async () => {
    try {
      await api.post('/v1/enterprise/procurement/orders', {
        ...form,
        total_amount: parseFloat(form.total_amount)
      });
      setCreateModalOpen(false);
      setForm({ title: '', purchase_request_id: '', rfq_id: '', vendor_quotation_id: '', vendor_id: '', total_amount: '', items: [] });
      loadOrders();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Error creating Purchase Order');
    }
  };

  const handleSubmitApproval = async (id: string) => {
    try {
      await api.post(`/v1/enterprise/procurement/orders/${id}/submit-approval`);
      loadOrders();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Error submitting PO for approval');
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, React.CSSProperties> = {
      draft: { background: 'rgba(107,114,128,0.1)', color: '#6b7280' },
      pending_approval: { background: 'rgba(245,158,11,0.1)', color: '#f59e0b' },
      approved: { background: 'rgba(16,185,129,0.1)', color: '#10b981' },
      rejected: { background: 'rgba(239,68,68,0.1)', color: '#ef4444' },
      sent_to_vendor: { background: 'rgba(59,130,246,0.1)', color: '#3b82f6' },
      goods_received: { background: 'rgba(139,92,246,0.1)', color: '#8b5cf6' },
      partially_received: { background: 'rgba(139,92,246,0.2)', color: '#6d28d9' },
      invoiced: { background: 'rgba(236,72,153,0.1)', color: '#ec4899' },
      completed: { background: 'rgba(16,185,129,0.2)', color: '#047857' },
      cancelled: { background: 'rgba(0,0,0,0.1)', color: '#000000' }
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
            <ShoppingCart size={24} color="var(--color-primary)" />
            🛍️ Purchase Orders (PO)
          </h1>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>
            Manage Purchase Orders, track budget approvals, and release orders to vendors.
          </p>
        </div>
        <button className="btn-primary" onClick={() => setCreateModalOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem' }}>
          <Plus size={14} /> Create PO
        </button>
      </div>

      {/* Toolbar */}
      <div className="glass-panel" style={{ padding: 16, borderRadius: 'var(--radius-lg)', marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: '40%' }}>
          <Search size={16} color="var(--text-muted)" />
          <input
            style={{ ...inputStyle, padding: '6px 10px', border: 'none', background: 'transparent' }}
            placeholder="Search orders by number or title..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <button className="btn-secondary" onClick={loadOrders} style={{ fontSize: '0.75rem', padding: '6px 12px' }}>
          <RefreshCw size={12} style={{ marginRight: 4 }} /> Refresh
        </button>
      </div>

      {/* PO List Table */}
      {loading ? (
        <div className="glass-panel" style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', borderRadius: 'var(--radius-lg)' }}>Loading POs...</div>
      ) : orders.length === 0 ? (
        <div className="glass-panel" style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', borderRadius: 'var(--radius-lg)' }}>No Purchase Orders found.</div>
      ) : (
        <div className="glass-panel" style={{ borderRadius: 'var(--radius-lg)', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr>
                <th style={headerStyle}>PO Number / Title</th>
                <th style={headerStyle}>Vendor</th>
                <th style={headerStyle}>Total Amount</th>
                <th style={headerStyle}>Status</th>
                <th style={headerStyle}>Approver</th>
                <th style={headerStyle}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.filter(o => !search || o.po_number.toLowerCase().includes(search.toLowerCase()) || o.title.toLowerCase().includes(search.toLowerCase())).map(o => (
                <tr key={o.id}>
                  <td style={cellStyle}>
                    <div style={{ fontFamily: 'monospace', fontWeight: 800 }}>{o.po_number}</div>
                    <div style={{ fontWeight: 700 }}>{o.title}</div>
                  </td>
                  <td style={cellStyle}>{o.vendor?.name}</td>
                  <td style={cellStyle}>{parseFloat(o.total_amount).toLocaleString()} EGP</td>
                  <td style={cellStyle}>{getStatusBadge(o.status)}</td>
                  <td style={cellStyle}>
                    {o.approver ? (
                      <div>
                        <div>{o.approver.name}</div>
                        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{o.approved_at ? new Date(o.approved_at).toLocaleDateString() : ''}</div>
                      </div>
                    ) : (
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Not Approved</span>
                    )}
                  </td>
                  <td style={cellStyle}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn-secondary" style={{ padding: '4px 8px', fontSize: '0.72rem' }} onClick={() => { setSelectedPO(o); setDetailModalOpen(true); }}>
                        View
                      </button>
                      {o.status === 'draft' && (
                        <button className="btn-primary" style={{ padding: '4px 8px', fontSize: '0.72rem', background: 'var(--color-secondary)' }} onClick={() => handleSubmitApproval(o.id)}>
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
      <Modal open={createModalOpen} title="Create PO from Vendor Quotation" onClose={() => setCreateModalOpen(false)}>
        <Field label="Link Closed RFQ & Accepted Quote">
          <select style={inputStyle} value={form.rfq_id} onChange={e => handleRFQChange(e.target.value)}>
            <option value="">-- Choose RFQ --</option>
            {rfqs.filter(r => r.status === 'closed' || r.status === 'completed').map(r => (
              <option key={r.id} value={r.id}>
                {r.title} ({r.quotations?.find((q: any) => q.status === 'accepted')?.vendor?.name || 'No Accepted Quote'})
              </option>
            ))}
          </select>
        </Field>

        <Field label="Order Title">
          <input type="text" style={inputStyle} value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="e.g. Purchase Order for Brick Materials Block A" />
        </Field>

        <Field label="Select Vendor (Override)">
          <select style={inputStyle} value={form.vendor_id} onChange={e => setForm(p => ({ ...p, vendor_id: e.target.value }))}>
            <option value="">-- Select Vendor --</option>
            {vendors.map(v => <option key={v.id} value={v.id}>{v.name} ({v.service_type})</option>)}
          </select>
        </Field>

        <Field label="Total Amount (EGP)">
          <input type="text" style={inputStyle} value={form.total_amount} onChange={e => setForm(p => ({ ...p, total_amount: e.target.value }))} placeholder="e.g. 150000" />
        </Field>

        {form.items.length > 0 && (
          <div style={{ marginTop: 12 }}>
            <h4 style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase' }}>PO Items mapped</h4>
            <div style={{ background: 'rgba(0,0,0,0.02)', borderRadius: 'var(--radius-sm)', padding: 8, maxHeight: 120, overflowY: 'auto' }}>
              {form.items.map((it, i) => (
                <div key={i} style={{ fontSize: '0.75rem', padding: '4px 0', borderBottom: '1px solid rgba(0,0,0,0.03)', display: 'flex', justifyContent: 'space-between' }}>
                  <span>{it.name} (x{it.quantity})</span>
                  <span>Unit: {it.unit_price} EGP</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
          <button className="btn-primary" disabled={!form.title || !form.vendor_id || !form.total_amount} onClick={handleSavePO} style={{ flex: 1 }}>Save Purchase Order</button>
          <button className="btn-secondary" onClick={() => setCreateModalOpen(false)} style={{ flex: 1 }}>Cancel</button>
        </div>
      </Modal>

      {/* Details Modal */}
      <Modal open={detailModalOpen} title="Purchase Order Details" onClose={() => setDetailModalOpen(false)}>
        {selectedPO && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
              <div>
                <span style={{ fontSize: '0.75rem', fontFamily: 'monospace', fontWeight: 800, color: 'var(--text-muted)' }}>{selectedPO.po_number}</span>
                <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-main)', marginTop: 2 }}>{selectedPO.title}</h3>
              </div>
              <div>{getStatusBadge(selectedPO.status)}</div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20, fontSize: '0.78rem' }}>
              <div>
                <span style={{ display: 'block', color: 'var(--text-muted)', fontWeight: 700 }}>Vendor Supplier:</span>
                <span>{selectedPO.vendor?.name || 'N/A'}</span>
              </div>
              <div>
                <span style={{ display: 'block', color: 'var(--text-muted)', fontWeight: 700 }}>Total Order Amount:</span>
                <span style={{ fontWeight: 700 }}>{parseFloat(selectedPO.total_amount).toLocaleString()} EGP</span>
              </div>
              <div>
                <span style={{ display: 'block', color: 'var(--text-muted)', fontWeight: 700 }}>Budget Approver:</span>
                <span>{selectedPO.approver?.name || 'Not Approved yet'}</span>
              </div>
              <div>
                <span style={{ display: 'block', color: 'var(--text-muted)', fontWeight: 700 }}>Order Date:</span>
                <span>{new Date(selectedPO.created_at).toLocaleDateString()}</span>
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: 16 }}>
              <h4 style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: 10 }}>Order Item Specifications</h4>
              <div style={{ background: 'rgba(0,0,0,0.02)', borderRadius: 'var(--radius-sm)', padding: 8 }}>
                <table style={{ width: '100%', fontSize: '0.75rem', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-glass)', color: 'var(--text-muted)' }}>
                      <th style={{ padding: 6, textAlign: 'left' }}>Item</th>
                      <th style={{ padding: 6, textAlign: 'right' }}>Qty</th>
                      <th style={{ padding: 6, textAlign: 'right' }}>Unit Price</th>
                      <th style={{ padding: 6, textAlign: 'right' }}>Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedPO.items?.map((item, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid rgba(0,0,0,0.03)' }}>
                        <td style={{ padding: 6 }}>{item.name}</td>
                        <td style={{ padding: 6, textAlign: 'right' }}>{item.quantity}</td>
                        <td style={{ padding: 6, textAlign: 'right' }}>{item.unit_price.toLocaleString()} EGP</td>
                        <td style={{ padding: 6, textAlign: 'right', fontWeight: 700 }}>{(item.quantity * item.unit_price).toLocaleString()} EGP</td>
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

export default PurchaseOrders;
