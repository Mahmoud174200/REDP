import React, { useState, useEffect } from 'react';
import api from '../../../services/api';
import {
  MessageSquare, Plus, Search, Calendar, RefreshCw, Send, CheckCircle2, ChevronRight, Award
} from 'lucide-react';

interface RFQItem {
  name: string;
  description: string;
  quantity: number;
}

interface QuoteItem {
  item_index: number;
  quoted_unit_price: number;
}

interface Vendor {
  id: string;
  name: string;
  service_type: string;
  contact_number: string;
}

interface VendorQuotation {
  id: string;
  vendor_id: string;
  total_quoted_amount: string;
  delivery_timeline_days: number;
  notes: string;
  status: string;
  items: QuoteItem[];
  vendor?: Vendor;
  created_at: string;
}

interface RFQ {
  id: string;
  purchase_request_id: string;
  title: string;
  description: string;
  due_date: string;
  status: string;
  items: RFQItem[];
  purchase_request?: { title: string };
  quotations?: VendorQuotation[];
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
          <MessageSquare size={18} color="var(--color-primary)" />
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

const RFQs: React.FC = () => {
  const [rfqs, setRfqs] = useState<RFQ[]>([]);
  const [approvedPRs, setApprovedPRs] = useState<any[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [submitQuoteOpen, setSubmitQuoteOpen] = useState(false);
  const [selectedRFQ, setSelectedRFQ] = useState<RFQ | null>(null);

  // RFQ Form State
  const [form, setForm] = useState({
    purchase_request_id: '',
    title: '',
    description: '',
    due_date: '',
    items: [] as RFQItem[]
  });

  // Quotation Submission Form State
  const [quoteForm, setQuoteForm] = useState({
    vendor_id: '',
    delivery_timeline_days: '',
    notes: '',
    prices: {} as Record<number, number> // Map item_index -> quoted price
  });

  useEffect(() => {
    loadRFQs();
    loadApprovedPRs();
    loadVendors();
  }, []);

  const loadRFQs = async () => {
    setLoading(true);
    try {
      const res = await api.get('/v1/enterprise/procurement/rfqs');
      setRfqs(res.data?.data || []);
    } catch (err) {
      console.error('Error loading RFQs:', err);
    }
    setLoading(false);
  };

  const loadApprovedPRs = async () => {
    try {
      const res = await api.get('/v1/enterprise/procurement/requests');
      const list = res.data?.data || [];
      // List requests that are approved and don't have RFQs created yet
      setApprovedPRs(list.filter((pr: any) => pr.status === 'approved'));
    } catch (err) {
      console.error('Error loading approved PRs:', err);
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

  const handlePRChange = (prId: string) => {
    const pr = approvedPRs.find(p => p.id === prId);
    if (!pr) return;

    setForm({
      purchase_request_id: pr.id,
      title: `RFQ: ${pr.title}`,
      description: pr.description || '',
      due_date: '',
      items: pr.items.map((i: any) => ({ name: i.name, description: i.description || '', quantity: i.quantity }))
    });
  };

  const handleSaveRFQ = async () => {
    try {
      await api.post('/v1/enterprise/procurement/rfqs', form);
      setCreateModalOpen(false);
      setForm({ purchase_request_id: '', title: '', description: '', due_date: '', items: [] });
      loadRFQs();
      loadApprovedPRs();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Error creating RFQ');
    }
  };

  const handleOpenQuoteSubmit = (rfq: RFQ) => {
    setSelectedRFQ(rfq);
    const initialPrices: Record<number, number> = {};
    rfq.items.forEach((_, idx) => {
      initialPrices[idx] = 0;
    });
    setQuoteForm({
      vendor_id: '',
      delivery_timeline_days: '',
      notes: '',
      prices: initialPrices
    });
    setSubmitQuoteOpen(true);
  };

  const handleSaveQuotation = async () => {
    if (!selectedRFQ) return;
    
    // Map prices dictionary to array of items
    const itemsPayload = Object.entries(quoteForm.prices).map(([idx, price]) => ({
      item_index: parseInt(idx),
      quoted_unit_price: price
    }));

    // Calculate total quoted amount
    const totalAmount = selectedRFQ.items.reduce((sum, item, idx) => {
      const unitPrice = quoteForm.prices[idx] || 0;
      return sum + (item.quantity * unitPrice);
    }, 0);

    try {
      await api.post(`/v1/enterprise/procurement/rfqs/${selectedRFQ.id}/quotations`, {
        vendor_id: quoteForm.vendor_id,
        delivery_timeline_days: quoteForm.delivery_timeline_days ? parseInt(quoteForm.delivery_timeline_days) : null,
        notes: quoteForm.notes,
        total_quoted_amount: totalAmount,
        items: itemsPayload
      });
      setSubmitQuoteOpen(false);
      loadRFQs();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Error submitting vendor quotation');
    }
  };

  const handleAcceptQuotation = async (quoteId: string) => {
    if (!window.confirm('Are you sure you want to accept this quotation? This will reject all other quotations for this RFQ.')) return;
    try {
      await api.put(`/v1/enterprise/procurement/quotations/${quoteId}/status`, { status: 'accepted' });
      setDetailModalOpen(false);
      loadRFQs();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Error accepting quotation');
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, React.CSSProperties> = {
      draft: { background: 'rgba(107,114,128,0.1)', color: '#6b7280' },
      sent: { background: 'rgba(59,130,246,0.1)', color: '#3b82f6' },
      closed: { background: 'rgba(245,158,11,0.1)', color: '#f59e0b' },
      completed: { background: 'rgba(16,185,129,0.1)', color: '#10b981' }
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
            <MessageSquare size={24} color="var(--color-primary)" />
            📡 Requests for Quotation (RFQ)
          </h1>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>
            Invite vendors to bid, record item quotations, and evaluate vendor proposals.
          </p>
        </div>
        <button className="btn-primary" onClick={() => setCreateModalOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem' }}>
          <Plus size={14} /> Create RFQ
        </button>
      </div>

      {/* Toolbar */}
      <div className="glass-panel" style={{ padding: 16, borderRadius: 'var(--radius-lg)', marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: '40%' }}>
          <Search size={16} color="var(--text-muted)" />
          <input
            style={{ ...inputStyle, padding: '6px 10px', border: 'none', background: 'transparent' }}
            placeholder="Search RFQs by title..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <button className="btn-secondary" onClick={loadRFQs} style={{ fontSize: '0.75rem', padding: '6px 12px' }}>
          <RefreshCw size={12} style={{ marginRight: 4 }} /> Refresh
        </button>
      </div>

      {/* RFQ Grid */}
      {loading ? (
        <div className="glass-panel" style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', borderRadius: 'var(--radius-lg)' }}>Loading RFQs...</div>
      ) : rfqs.length === 0 ? (
        <div className="glass-panel" style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', borderRadius: 'var(--radius-lg)' }}>No RFQs found.</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
          {rfqs.filter(r => !search || r.title.toLowerCase().includes(search.toLowerCase())).map(r => (
            <div key={r.id} className="glass-panel" style={{ padding: 20, borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h3 style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--text-main)' }}>{r.title}</h3>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Linked PR: {r.purchase_request?.title || 'None'}</span>
                </div>
                {getStatusBadge(r.status)}
              </div>

              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div>🗓️ Due Date: <strong>{new Date(r.due_date).toLocaleString()}</strong></div>
                <div>🏷️ Bid Items: <strong>{r.items?.length || 0} items</strong></div>
                <div>💼 Quotations: <strong>{r.quotations?.length || 0} received</strong></div>
              </div>

              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <button className="btn-secondary" style={{ flex: 1, padding: 8, fontSize: '0.75rem', justifyContent: 'center' }} onClick={() => { setSelectedRFQ(r); setDetailModalOpen(true); }}>
                  Manage Bids
                </button>
                {r.status !== 'closed' && r.status !== 'completed' && (
                  <button className="btn-primary" style={{ flex: 1, padding: 8, fontSize: '0.75rem', justifyContent: 'center' }} onClick={() => handleOpenQuoteSubmit(r)}>
                    <Send size={12} style={{ marginRight: 4 }} /> Submit Bid
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      <Modal open={createModalOpen} title="Create RFQ from Approved Purchase Request" onClose={() => setCreateModalOpen(false)}>
        <Field label="Choose Approved Purchase Request">
          <select style={inputStyle} value={form.purchase_request_id} onChange={e => handlePRChange(e.target.value)}>
            <option value="">-- Choose PR --</option>
            {approvedPRs.map(pr => <option key={pr.id} value={pr.id}>{pr.title} (Est: {parseFloat(pr.estimated_cost).toLocaleString()} EGP)</option>)}
          </select>
        </Field>

        <Field label="RFQ Title">
          <input type="text" style={inputStyle} value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="e.g. RFQ for Block B Plumbing Materials" />
        </Field>

        <Field label="RFQ Instructions / Description">
          <textarea style={{ ...inputStyle, height: 60, resize: 'none' }} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Describe quotation requirements..." />
        </Field>

        <Field label="Bidding Due Date">
          <input type="datetime-local" style={inputStyle} value={form.due_date} onChange={e => setForm(p => ({ ...p, due_date: e.target.value }))} />
        </Field>

        {form.items.length > 0 && (
          <div style={{ marginTop: 12 }}>
            <h4 style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase' }}>Items Requested</h4>
            <div style={{ background: 'rgba(0,0,0,0.02)', borderRadius: 'var(--radius-sm)', padding: 8, maxHeight: 120, overflowY: 'auto' }}>
              {form.items.map((it, i) => (
                <div key={i} style={{ fontSize: '0.75rem', padding: '4px 0', borderBottom: '1px solid rgba(0,0,0,0.03)' }}>
                  <strong>{it.name}</strong> - Quantity: {it.quantity}
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
          <button className="btn-primary" disabled={!form.title || !form.due_date || form.items.length === 0} onClick={handleSaveRFQ} style={{ flex: 1 }}>Create RFQ</button>
          <button className="btn-secondary" onClick={() => setCreateModalOpen(false)} style={{ flex: 1 }}>Cancel</button>
        </div>
      </Modal>

      {/* Bid Submission Modal */}
      <Modal open={submitQuoteOpen} title="Submit Vendor Quotation Bid" onClose={() => setSubmitQuoteOpen(false)}>
        {selectedRFQ && (
          <div>
            <Field label="Vendor Name">
              <select style={inputStyle} value={quoteForm.vendor_id} onChange={e => setQuoteForm(p => ({ ...p, vendor_id: e.target.value }))}>
                <option value="">-- Choose Vendor --</option>
                {vendors.map(v => <option key={v.id} value={v.id}>{v.name} ({v.service_type})</option>)}
              </select>
            </Field>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12 }}>
              <Field label="Delivery Timeline (Days)">
                <input type="number" style={inputStyle} value={quoteForm.delivery_timeline_days} onChange={e => setQuoteForm(p => ({ ...p, delivery_timeline_days: e.target.value }))} placeholder="e.g. 15" />
              </Field>
            </div>

            <Field label="Quotation Details / Notes">
              <textarea style={{ ...inputStyle, height: 60, resize: 'none' }} value={quoteForm.notes} onChange={e => setQuoteForm(p => ({ ...p, notes: e.target.value }))} placeholder="Warranty notes, deposit schedule..." />
            </Field>

            <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: 16 }}>
              <h4 style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: 10 }}>Quote Unit Prices</h4>
              {selectedRFQ.items?.map((item, idx) => (
                <div key={idx} style={{ display: 'grid', gridTemplateColumns: '3fr 1fr 2fr', gap: 10, alignItems: 'center', marginBottom: 8, fontSize: '0.75rem' }}>
                  <span>{item.name}</span>
                  <span style={{ color: 'var(--text-muted)' }}>Qty: {item.quantity}</span>
                  <input
                    type="number"
                    style={{ ...inputStyle, padding: '6px 10px' }}
                    placeholder="Quoted Unit Price (EGP)"
                    value={quoteForm.prices[idx] || ''}
                    onChange={e => {
                      const val = parseFloat(e.target.value) || 0;
                      setQuoteForm(p => ({
                        ...p,
                        prices: { ...p.prices, [idx]: val }
                      }));
                    }}
                  />
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
              <button className="btn-primary" disabled={!quoteForm.vendor_id} onClick={handleSaveQuotation} style={{ flex: 1 }}>Submit Quotation</button>
              <button className="btn-secondary" onClick={() => setSubmitQuoteOpen(false)} style={{ flex: 1 }}>Cancel</button>
            </div>
          </div>
        )}
      </Modal>

      {/* Details & Evaluation Modal */}
      <Modal open={detailModalOpen} title="Evaluate Vendor Quotations" onClose={() => setDetailModalOpen(false)}>
        {selectedRFQ && (
          <div>
            <div style={{ marginBottom: 20 }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-main)' }}>{selectedRFQ.title}</h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 2 }}>{selectedRFQ.description}</p>
            </div>

            <h4 style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: 10 }}>Bids Received ({selectedRFQ.quotations?.length || 0})</h4>
            
            {(!selectedRFQ.quotations || selectedRFQ.quotations.length === 0) ? (
              <div style={{ padding: 20, textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)', background: 'rgba(0,0,0,0.01)', borderRadius: 'var(--radius-sm)' }}>
                No bids submitted yet for this RFQ.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {selectedRFQ.quotations.map(q => (
                  <div key={q.id} style={{ border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-md)', padding: 12, background: 'rgba(255,255,255,0.4)', position: 'relative' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                      <div>
                        <strong style={{ fontSize: '0.8rem', color: 'var(--text-main)' }}>{q.vendor?.name}</strong>
                        <span style={{ display: 'block', fontSize: '0.68rem', color: 'var(--text-muted)' }}>{q.vendor?.service_type}</span>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--color-primary)' }}>{parseFloat(q.total_quoted_amount).toLocaleString()} EGP</span>
                        <span style={{ display: 'block', fontSize: '0.68rem', color: 'var(--text-muted)' }}>Timeline: {q.delivery_timeline_days || 'N/A'} days</span>
                      </div>
                    </div>
                    
                    {q.notes && (
                      <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', background: 'rgba(0,0,0,0.01)', padding: 6, borderRadius: 4, margin: '6px 0' }}>
                        📝 {q.notes}
                      </p>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
                      <span style={{ fontSize: '0.7rem', fontWeight: 800, color: q.status === 'accepted' ? '#10b981' : q.status === 'rejected' ? '#ef4444' : '#6b7280' }}>
                        Status: {q.status.toUpperCase()}
                      </span>
                      
                      {q.status === 'pending' && selectedRFQ.status === 'sent' && (
                        <button className="btn-primary" style={{ padding: '4px 10px', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: 4 }} onClick={() => handleAcceptQuotation(q.id)}>
                          <CheckCircle2 size={12} /> Accept Bid
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn-secondary" onClick={() => setDetailModalOpen(false)}>Close</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default RFQs;
