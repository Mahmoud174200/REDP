import React, { useState, useEffect } from 'react';
import api from '../../../services/api';
import {
  Wallet, Plus, Search, Calendar, RefreshCw, CheckCircle, AlertOctagon, HelpCircle, FileText
} from 'lucide-react';

interface InvoiceItem {
  name: string;
  quantity: number;
  unit_price: number;
}

interface VendorInvoice {
  id: string;
  invoice_number: string;
  issue_date: string;
  due_date: string;
  subtotal: string;
  tax_amount: string;
  total_amount: string;
  status: string;
  matching_notes: string | null;
  items: InvoiceItem[];
  vendor?: { name: string };
  purchase_order?: { po_number: string; title: string; total_amount: string; items: any[]; goods_receipts: any[] };
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
      <div className="glass-panel" style={{ width: '95%', maxWidth: 700, maxHeight: '85vh', overflowY: 'auto', padding: 32, borderRadius: 'var(--radius-lg)' }} onClick={e => e.stopPropagation()}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: 20, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Wallet size={18} color="var(--color-primary)" />
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

const VendorInvoices: React.FC = () => {
  const [invoices, setInvoices] = useState<VendorInvoice[]>([]);
  const [approvedPOs, setApprovedPOs] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<VendorInvoice | null>(null);

  // Form State
  const [form, setForm] = useState({
    vendor_id: '',
    purchase_order_id: '',
    invoice_number: '',
    issue_date: new Date().toISOString().substring(0, 10),
    due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().substring(0, 10),
    subtotal: '',
    tax_amount: '0.00',
    total_amount: '',
    items: [] as InvoiceItem[]
  });

  useEffect(() => {
    loadInvoices();
    loadApprovedPOs();
    loadVendors();
  }, []);

  const loadInvoices = async () => {
    setLoading(true);
    try {
      const res = await api.get('/v1/enterprise/procurement/invoices');
      setInvoices(res.data?.data || []);
    } catch (err) {
      console.error('Error loading invoices:', err);
    }
    setLoading(false);
  };

  const loadApprovedPOs = async () => {
    try {
      const res = await api.get('/v1/enterprise/procurement/orders');
      const list = res.data?.data || [];
      // Only POs that are approved, sent to vendor, or goods received
      setApprovedPOs(list.filter((po: any) => ['approved', 'sent_to_vendor', 'goods_received', 'partially_received'].includes(po.status)));
    } catch (err) {
      console.error('Error loading POs:', err);
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

  const handlePOChange = (poId: string) => {
    if (!poId) return;
    const po = approvedPOs.find(p => p.id === poId);
    if (!po) return;

    // Prefill form from PO details
    setForm(p => ({
      ...p,
      purchase_order_id: po.id,
      vendor_id: po.vendor_id,
      subtotal: po.total_amount,
      total_amount: po.total_amount,
      items: po.items.map((i: any) => ({
        name: i.name,
        quantity: parseFloat(i.quantity),
        unit_price: parseFloat(i.unit_price)
      }))
    }));
  };

  const handleTaxChange = (taxVal: string) => {
    const tax = parseFloat(taxVal) || 0;
    const sub = parseFloat(form.subtotal) || 0;
    setForm(p => ({
      ...p,
      tax_amount: taxVal,
      total_amount: String((sub + tax).toFixed(2))
    }));
  };

  const handleSaveInvoice = async () => {
    try {
      await api.post('/v1/enterprise/procurement/invoices', {
        ...form,
        subtotal: parseFloat(form.subtotal),
        tax_amount: parseFloat(form.tax_amount),
        total_amount: parseFloat(form.total_amount)
      });
      setCreateModalOpen(false);
      setForm({
        vendor_id: '',
        purchase_order_id: '',
        invoice_number: '',
        issue_date: new Date().toISOString().substring(0, 10),
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().substring(0, 10),
        subtotal: '',
        tax_amount: '0.00',
        total_amount: '',
        items: []
      });
      loadInvoices();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Error recording vendor invoice');
    }
  };

  const handleTriggerMatch = async (id: string) => {
    try {
      const res = await api.post(`/v1/enterprise/procurement/invoices/${id}/match`);
      alert(res.data?.message || '3-way match verified successfully!');
      loadInvoices();
    } catch (err: any) {
      alert(err?.response?.data?.message || '3-way match failed or returned mismatch details.');
      loadInvoices();
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, React.CSSProperties> = {
      pending_matching: { background: 'rgba(107,114,128,0.1)', color: '#6b7280' },
      matched: { background: 'rgba(16,185,129,0.1)', color: '#10b981' },
      mismatch_disputed: { background: 'rgba(239,68,68,0.1)', color: '#ef4444' },
      approved: { background: 'rgba(59,130,246,0.1)', color: '#3b82f6' },
      paid: { background: 'rgba(16,185,129,0.2)', color: '#047857' },
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
            <Wallet size={24} color="var(--color-primary)" />
            🧾 Vendor Invoices & 3-Way Matching
          </h1>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>
            Record invoices and run automated 3-way reconciliation (Invoice vs PO vs Receipts) before general ledger entries are posted.
          </p>
        </div>
        <button className="btn-primary" onClick={() => setCreateModalOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem' }}>
          <Plus size={14} /> Log Invoice
        </button>
      </div>

      {/* Toolbar */}
      <div className="glass-panel" style={{ padding: 16, borderRadius: 'var(--radius-lg)', marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: '40%' }}>
          <Search size={16} color="var(--text-muted)" />
          <input
            style={{ ...inputStyle, padding: '6px 10px', border: 'none', background: 'transparent' }}
            placeholder="Search invoices by number..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <button className="btn-secondary" onClick={loadInvoices} style={{ fontSize: '0.75rem', padding: '6px 12px' }}>
          <RefreshCw size={12} style={{ marginRight: 4 }} /> Refresh
        </button>
      </div>

      {/* Invoices List Table */}
      {loading ? (
        <div className="glass-panel" style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', borderRadius: 'var(--radius-lg)' }}>Loading invoices...</div>
      ) : invoices.length === 0 ? (
        <div className="glass-panel" style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', borderRadius: 'var(--radius-lg)' }}>No vendor invoices recorded.</div>
      ) : (
        <div className="glass-panel" style={{ borderRadius: 'var(--radius-lg)', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr>
                <th style={headerStyle}>Invoice Number</th>
                <th style={headerStyle}>Vendor</th>
                <th style={headerStyle}>PO Reference</th>
                <th style={headerStyle}>Total Due</th>
                <th style={headerStyle}>Status</th>
                <th style={headerStyle}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {invoices.filter(i => !search || i.invoice_number.toLowerCase().includes(search.toLowerCase())).map(i => (
                <tr key={i.id}>
                  <td style={cellStyle}>
                    <div style={{ fontWeight: 700 }}>{i.invoice_number}</div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Due: {new Date(i.due_date).toLocaleDateString()}</div>
                  </td>
                  <td style={cellStyle}>{i.vendor?.name}</td>
                  <td style={cellStyle}>
                    <span style={{ fontFamily: 'monospace', fontWeight: 800 }}>{i.purchase_order?.po_number || 'N/A'}</span>
                  </td>
                  <td style={cellStyle}>{parseFloat(i.total_amount).toLocaleString()} EGP</td>
                  <td style={cellStyle}>{getStatusBadge(i.status)}</td>
                  <td style={cellStyle}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn-secondary" style={{ padding: '4px 8px', fontSize: '0.72rem' }} onClick={() => { setSelectedInvoice(i); setDetailModalOpen(true); }}>
                        View details
                      </button>
                      {(i.status === 'pending_matching' || i.status === 'mismatch_disputed') && (
                        <button className="btn-primary" style={{ padding: '4px 8px', fontSize: '0.72rem', background: 'var(--color-primary)' }} onClick={() => handleTriggerMatch(i.id)}>
                          Verify 3-Way Match
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
      <Modal open={createModalOpen} title="Log Vendor Bill Invoice" onClose={() => setCreateModalOpen(false)}>
        <Field label="Link Purchase Order Reference">
          <select style={inputStyle} value={form.purchase_order_id} onChange={e => handlePOChange(e.target.value)}>
            <option value="">-- Select PO --</option>
            {approvedPOs.map(po => (
              <option key={po.id} value={po.id}>{po.po_number} - {po.title} ({po.vendor?.name})</option>
            ))}
          </select>
        </Field>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Field label="Select Vendor (Supplier)">
            <select style={inputStyle} value={form.vendor_id} onChange={e => setForm(p => ({ ...p, vendor_id: e.target.value }))}>
              <option value="">-- Choose Vendor --</option>
              {vendors.map(v => <option key={v.id} value={v.id}>{v.name} ({v.service_type})</option>)}
            </select>
          </Field>
          <Field label="Invoice Number">
            <input type="text" style={inputStyle} value={form.invoice_number} onChange={e => setForm(p => ({ ...p, invoice_number: e.target.value }))} placeholder="e.g. INV-10029" />
          </Field>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Field label="Issue Date">
            <input type="date" style={inputStyle} value={form.issue_date} onChange={e => setForm(p => ({ ...p, issue_date: e.target.value }))} />
          </Field>
          <Field label="Payment Due Date">
            <input type="date" style={inputStyle} value={form.due_date} onChange={e => setForm(p => ({ ...p, due_date: e.target.value }))} />
          </Field>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
          <Field label="Subtotal (EGP)">
            <input type="number" style={inputStyle} value={form.subtotal} onChange={e => setForm(p => ({ ...p, subtotal: e.target.value, total_amount: String((parseFloat(e.target.value || '0') + parseFloat(p.tax_amount || '0')).toFixed(2)) }))} placeholder="e.g. 100000" />
          </Field>
          <Field label="Tax Amount (EGP)">
            <input type="number" style={inputStyle} value={form.tax_amount} onChange={e => handleTaxChange(e.target.value)} placeholder="e.g. 14000" />
          </Field>
          <Field label="Total Amount (EGP)">
            <input type="text" style={{ ...inputStyle, background: 'rgba(0,0,0,0.05)' }} value={form.total_amount} readOnly />
          </Field>
        </div>

        {form.items.length > 0 && (
          <div style={{ marginTop: 12 }}>
            <h4 style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase' }}>Invoice Items Mapped</h4>
            <div style={{ background: 'rgba(0,0,0,0.02)', borderRadius: 'var(--radius-sm)', padding: 8, maxHeight: 120, overflowY: 'auto' }}>
              {form.items.map((it, i) => (
                <div key={i} style={{ fontSize: '0.75rem', padding: '4px 0', borderBottom: '1px solid rgba(0,0,0,0.03)', display: 'flex', justifyContent: 'space-between' }}>
                  <span>{it.name} (x{it.quantity})</span>
                  <span>Unit Price: {it.unit_price} EGP</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
          <button className="btn-primary" disabled={!form.invoice_number || !form.vendor_id || !form.total_amount} onClick={handleSaveInvoice} style={{ flex: 1 }}>Save Invoice Bill</button>
          <button className="btn-secondary" onClick={() => setCreateModalOpen(false)} style={{ flex: 1 }}>Cancel</button>
        </div>
      </Modal>

      {/* Details & Match Logs Modal */}
      <Modal open={detailModalOpen} title="Vendor Invoice & 3-Way Match Verification" onClose={() => setDetailModalOpen(false)}>
        {selectedInvoice && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Bill Vendor Ref: {selectedInvoice.invoice_number}</span>
                <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-main)', marginTop: 2 }}>Invoice Bill: {selectedInvoice.vendor?.name}</h3>
              </div>
              <div>{getStatusBadge(selectedInvoice.status)}</div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20, fontSize: '0.78rem' }}>
              <div>
                <span style={{ display: 'block', color: 'var(--text-muted)', fontWeight: 700 }}>PO Link:</span>
                <span style={{ fontFamily: 'monospace', fontWeight: 800 }}>{selectedInvoice.purchase_order?.po_number || 'None'}</span>
              </div>
              <div>
                <span style={{ display: 'block', color: 'var(--text-muted)', fontWeight: 700 }}>Total Invoice Cost:</span>
                <span style={{ fontWeight: 700 }}>{parseFloat(selectedInvoice.total_amount).toLocaleString()} EGP</span>
              </div>
              <div>
                <span style={{ display: 'block', color: 'var(--text-muted)', fontWeight: 700 }}>Invoice Issue Date:</span>
                <span>{new Date(selectedInvoice.issue_date).toLocaleDateString()}</span>
              </div>
              <div>
                <span style={{ display: 'block', color: 'var(--text-muted)', fontWeight: 700 }}>Due Payment Date:</span>
                <span>{new Date(selectedInvoice.due_date).toLocaleDateString()}</span>
              </div>
            </div>

            {/* 3-Way Match status card banner */}
            <div style={{
              background: selectedInvoice.status === 'matched' ? 'rgba(16,185,129,0.06)' : selectedInvoice.status === 'mismatch_disputed' ? 'rgba(239,68,68,0.06)' : 'rgba(107,114,128,0.06)',
              border: `1px solid ${selectedInvoice.status === 'matched' ? '#10b981' : selectedInvoice.status === 'mismatch_disputed' ? '#ef4444' : '#6b7280'}`,
              borderRadius: 'var(--radius-md)',
              padding: 16,
              marginBottom: 20
            }}>
              <h4 style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                {selectedInvoice.status === 'matched' ? (
                  <CheckCircle size={16} color="#10b981" />
                ) : selectedInvoice.status === 'mismatch_disputed' ? (
                  <AlertOctagon size={16} color="#ef4444" />
                ) : (
                  <HelpCircle size={16} color="#6b7280" />
                )}
                3-Way Match Audit Report Results
              </h4>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-main)', whiteSpace: 'pre-wrap', lineHeight: 1.4 }}>
                {selectedInvoice.matching_notes || 'Automated match audit has not been run yet. Click "Verify 3-Way Match" to compare details.'}
              </p>
            </div>

            <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: 16 }}>
              <h4 style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: 10 }}>Invoiced Item Specifications</h4>
              <div style={{ background: 'rgba(0,0,0,0.02)', borderRadius: 'var(--radius-sm)', padding: 8 }}>
                <table style={{ width: '100%', fontSize: '0.75rem', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-glass)', color: 'var(--text-muted)' }}>
                      <th style={{ padding: 6, textAlign: 'left' }}>Item</th>
                      <th style={{ padding: 6, textAlign: 'right' }}>Qty</th>
                      <th style={{ padding: 6, textAlign: 'right' }}>Unit Price</th>
                      <th style={{ padding: 6, textAlign: 'right' }}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedInvoice.items?.map((item, idx) => (
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

            <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              {(selectedInvoice.status === 'pending_matching' || selectedInvoice.status === 'mismatch_disputed') && (
                <button className="btn-primary" style={{ padding: '6px 12px', fontSize: '0.75rem' }} onClick={() => handleTriggerMatch(selectedInvoice.id)}>
                  Run Match Engine
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

export default VendorInvoices;
