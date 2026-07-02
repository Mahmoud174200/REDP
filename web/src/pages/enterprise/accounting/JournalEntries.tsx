import React, { useState, useEffect } from 'react';
import api from '../../../services/api';
import {
  FileText, Plus, Search, Calendar, User, Eye, Check, RefreshCw, AlertTriangle
} from 'lucide-react';

interface Account {
  id: string; code: string; name: string; type: string;
}

interface Center {
  id: string; code: string; name: string;
}

interface JournalLine {
  id: string; account_id: string; debit: string; credit: string; description: string | null;
  cost_center_id: string | null; profit_center_id: string | null;
  account?: Account;
}

interface JournalEntry {
  id: string; entry_number: string; reference: string | null; description: string;
  entry_date: string; status: 'draft' | 'posted' | 'cancelled';
  creator?: { name: string; email: string };
  approver?: { name: string; email: string } | null;
  posted_at: string | null;
  lines: JournalLine[];
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '8px 10px', borderRadius: 'var(--radius-md)',
  border: '1px solid var(--border-glass)', background: 'rgba(255,255,255,0.6)',
  fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-main)', outline: 'none',
  boxSizing: 'border-box',
};

const Modal: React.FC<{ open: boolean; title: string; onClose: () => void; children: React.ReactNode }> = ({ open, title, onClose, children }) => {
  if (!open) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(4px)' }} onClick={onClose}>
      <div className="glass-panel" style={{ width: '95%', maxWidth: 850, maxHeight: '90vh', overflowY: 'auto', padding: 24, borderRadius: 'var(--radius-lg)' }} onClick={e => e.stopPropagation()}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: 16, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <FileText size={18} color="var(--color-primary)" />
          {title}
        </h2>
        {children}
      </div>
    </div>
  );
};

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div style={{ marginBottom: 10 }}>
    <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 2, textTransform: 'uppercase' }}>{label}</label>
    {children}
  </div>
);

const JournalEntries: React.FC = () => {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [costCenters, setCostCenters] = useState<Center[]>([]);
  const [profitCenters, setProfitCenters] = useState<Center[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Filtering & Pagination
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Detail Modal
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  // Create Form Modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createForm, setCreateForm] = useState<any>({
    entry_date: new Date().toISOString().split('T')[0],
    description: '',
    lines: [
      { account_id: '', debit: '0', credit: '0', description: '', cost_center_id: '', profit_center_id: '' },
      { account_id: '', debit: '0', credit: '0', description: '', cost_center_id: '', profit_center_id: '' }
    ]
  });

  useEffect(() => {
    loadAccountsAndCenters();
  }, []);

  useEffect(() => {
    loadEntries();
  }, [currentPage, dateStart, dateEnd, statusFilter]);

  const loadAccountsAndCenters = async () => {
    try {
      const [accRes, ccRes, pcRes] = await Promise.all([
        api.get('/v1/enterprise/accounting/accounts'),
        api.get('/v1/enterprise/accounting/cost-centers'),
        api.get('/v1/enterprise/accounting/profit-centers'),
      ]);
      setAccounts(accRes.data?.data || []);
      setCostCenters(ccRes.data?.data || []);
      setProfitCenters(pcRes.data?.data || []);
    } catch (err) {
      console.error('Error loading dimensions:', err);
    }
  };

  const loadEntries = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page', currentPage.toString());
      if (dateStart) params.append('date_start', dateStart);
      if (dateEnd) params.append('date_end', dateEnd);
      if (statusFilter) params.append('status', statusFilter);

      const res = await api.get(`/v1/enterprise/accounting/entries?${params.toString()}`);
      const payload = res.data?.data || {};
      setEntries(payload.data || []);
      setLastPage(payload.last_page || 1);
      setTotalItems(payload.total || 0);
    } catch (err) {
      console.error('Error loading entries:', err);
    }
    setLoading(false);
  };

  // Live totals calculation for double entry balancing
  const getFormTotals = () => {
    let debits = 0;
    let credits = 0;
    createForm.lines.forEach((l: any) => {
      debits += parseFloat(l.debit || '0');
      credits += parseFloat(l.credit || '0');
    });
    return { debits, credits, balanced: Math.abs(debits - credits) < 0.01 && debits > 0 };
  };

  const formTotals = getFormTotals();

  const handleAddFormLine = () => {
    setCreateForm((p: any) => ({
      ...p,
      lines: [...p.lines, { account_id: '', debit: '0', credit: '0', description: '', cost_center_id: '', profit_center_id: '' }]
    }));
  };

  const handleRemoveFormLine = (idx: number) => {
    if (createForm.lines.length <= 2) return;
    setCreateForm((p: any) => ({
      ...p,
      lines: p.lines.filter((_: any, i: number) => i !== idx)
    }));
  };

  const handleLineChange = (idx: number, key: string, value: any) => {
    setCreateForm((prev: any) => {
      const lines = [...prev.lines];
      lines[idx] = { ...lines[idx], [key]: value };
      return { ...prev, lines };
    });
  };

  const handleSaveEntry = async () => {
    if (!formTotals.balanced) {
      alert('Debit and Credit lines must be balanced before saving.');
      return;
    }
    try {
      await api.post('/v1/enterprise/accounting/entries', createForm);
      setCreateModalOpen(false);
      setCreateForm({
        entry_date: new Date().toISOString().split('T')[0],
        description: '',
        lines: [
          { account_id: '', debit: '0', credit: '0', description: '', cost_center_id: '', profit_center_id: '' },
          { account_id: '', debit: '0', credit: '0', description: '', cost_center_id: '', profit_center_id: '' }
        ]
      });
      loadEntries();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Error saving entry draft');
    }
  };

  const handlePostEntry = async (id: string) => {
    try {
      await api.post(`/v1/enterprise/accounting/entries/${id}/post`);
      setDetailModalOpen(false);
      loadEntries();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Error posting journal entry');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'posted': return { bg: 'rgba(16,185,129,0.1)', color: '#10b981' };
      case 'cancelled': return { bg: 'rgba(239,68,68,0.1)', color: '#ef4444' };
      default: return { bg: 'rgba(0,0,0,0.05)', color: 'var(--text-muted)' }; // draft
    }
  };

  const headerStyle: React.CSSProperties = { padding: '10px 14px', fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid var(--border-glass)', background: 'rgba(255,255,255,0.4)' };
  const cellStyle: React.CSSProperties = { padding: '10px 14px', fontSize: '0.78rem', fontWeight: 500, color: 'var(--text-main)', borderBottom: '1px solid var(--border-glass)' };

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 10 }}>
            <FileText size={24} color="var(--color-primary)" />
            📝 Journal Entries & Ledger Vouchers
          </h1>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>
            Review, verify, post, and draft double-entry manual and automatic transaction records
          </p>
        </div>
        <button className="btn-primary" onClick={() => setCreateModalOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem' }}>
          <Plus size={14} /> New Journal Entry
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="glass-panel" style={{ padding: 14, borderRadius: 'var(--radius-lg)', marginBottom: 20, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 10, alignItems: 'end' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 4 }}>Status</label>
          <select style={inputStyle} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="">-- All --</option>
            <option value="draft">Draft</option>
            <option value="posted">Posted</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 4 }}>Start Date</label>
          <input type="date" style={inputStyle} value={dateStart} onChange={e => setDateStart(e.target.value)} />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 4 }}>End Date</label>
          <input type="date" style={inputStyle} value={dateEnd} onChange={e => setDateEnd(e.target.value)} />
        </div>
        <button className="btn-secondary" onClick={() => { setDateStart(''); setDateEnd(''); setStatusFilter(''); setCurrentPage(1); }} style={{ fontSize: '0.75rem', height: 35 }}>
          <RefreshCw size={12} style={{ marginRight: 4 }} /> Reset Filters
        </button>
      </div>

      {/* Data Table */}
      <div className="glass-panel" style={{ padding: 0, borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Loading journal transactions...</div>
        ) : entries.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>No journal entry logs found.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr>
                  <th style={headerStyle}>Entry Number</th>
                  <th style={headerStyle}>Entry Date</th>
                  <th style={headerStyle}>Description</th>
                  <th style={headerStyle}>Reference</th>
                  <th style={headerStyle}>Status</th>
                  <th style={headerStyle}>Created By</th>
                  <th style={headerStyle}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {entries.map(ent => {
                  const badge = getStatusBadge(ent.status);
                  return (
                    <tr key={ent.id}>
                      <td style={{ ...cellStyle, fontFamily: 'monospace', fontWeight: 800 }}>{ent.entry_number}</td>
                      <td style={cellStyle}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Calendar size={12} color="var(--text-muted)" />
                          {new Date(ent.entry_date).toLocaleDateString()}
                        </div>
                      </td>
                      <td style={{ ...cellStyle, maxWidth: 220, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                        {ent.description}
                      </td>
                      <td style={cellStyle}>{ent.reference ? <code>{ent.reference.substring(0, 8)}...</code> : '—'}</td>
                      <td style={cellStyle}>
                        <span style={{ padding: '3px 8px', borderRadius: 999, fontSize: '0.65rem', fontWeight: 800, background: badge.bg, color: badge.color, textTransform: 'uppercase' }}>
                          {ent.status}
                        </span>
                      </td>
                      <td style={cellStyle}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <User size={12} color="var(--text-muted)" />
                          {ent.creator?.name || 'Auto Engine'}
                        </div>
                      </td>
                      <td style={cellStyle}>
                        <button className="btn-secondary" onClick={() => { setSelectedEntry(ent); setDetailModalOpen(true); }} style={{ padding: '5px 10px', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Eye size={12} /> View Details
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {entries.length > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px', borderTop: '1px solid var(--border-glass)' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              Showing Page {currentPage} of {lastPage} ({totalItems} total vouchers)
            </span>
            <div style={{ display: 'flex', gap: 6 }}>
              <button className="btn-secondary" disabled={currentPage === 1} onClick={() => setCurrentPage(p => Math.max(1, p - 1))} style={{ padding: '6px 12px', fontSize: '0.72rem' }}>Previous</button>
              <button className="btn-secondary" disabled={currentPage === lastPage} onClick={() => setCurrentPage(p => Math.min(lastPage, p + 1))} style={{ padding: '6px 12px', fontSize: '0.72rem' }}>Next</button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedEntry && (
        <Modal open={detailModalOpen} title={`Journal Entry: ${selectedEntry.entry_number}`} onClose={() => setDetailModalOpen(false)}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 20, marginBottom: 20 }}>
            <div>
              <Field label="Status">
                <span style={{ padding: '4px 10px', borderRadius: 999, fontSize: '0.7rem', fontWeight: 800, ...getStatusBadge(selectedEntry.status) }}>
                  {selectedEntry.status.toUpperCase()}
                </span>
              </Field>
              <Field label="Entry Date"><strong>{new Date(selectedEntry.entry_date).toLocaleDateString()}</strong></Field>
              {selectedEntry.reference && <Field label="Reference ID"><code>{selectedEntry.reference}</code></Field>}
              <Field label="Created By"><strong>{selectedEntry.creator?.name || 'System Auto Posting'}</strong></Field>
              {selectedEntry.approver && <Field label="Approved/Posted By"><strong>{selectedEntry.approver.name}</strong></Field>}
              {selectedEntry.posted_at && <Field label="Posted Timestamp"><strong>{new Date(selectedEntry.posted_at).toLocaleString()}</strong></Field>}
            </div>

            <div>
              <Field label="Entry Description / Memo">
                <p style={{ margin: 0, padding: 12, background: 'rgba(0,0,0,0.02)', borderRadius: 6, fontSize: '0.8rem', color: 'var(--text-main)' }}>
                  {selectedEntry.description}
                </p>
              </Field>
            </div>
          </div>

          <h4 style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: 10 }}>Double-Entry Transactions Lines</h4>
          <div style={{ border: '1px solid var(--border-glass)', borderRadius: 6, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.78rem' }}>
              <thead>
                <tr style={{ background: 'rgba(0,0,0,0.02)' }}>
                  <th style={{ padding: 8, fontWeight: 800, color: 'var(--text-muted)' }}>Account</th>
                  <th style={{ padding: 8, fontWeight: 800, color: 'var(--text-muted)' }}>Cost Center</th>
                  <th style={{ padding: 8, fontWeight: 800, color: 'var(--text-muted)' }}>Profit Center</th>
                  <th style={{ padding: 8, fontWeight: 800, color: 'var(--text-muted)', textAlign: 'right' }}>Debit (EGP)</th>
                  <th style={{ padding: 8, fontWeight: 800, color: 'var(--text-muted)', textAlign: 'right' }}>Credit (EGP)</th>
                </tr>
              </thead>
              <tbody>
                {selectedEntry.lines.map(line => (
                  <tr key={line.id} style={{ borderBottom: '1px solid var(--border-glass)' }}>
                    <td style={{ padding: 8 }}><strong>{line.account?.code}</strong> - {line.account?.name}</td>
                    <td style={{ padding: 8 }}>{line.cost_center_id ? costCenters.find(c => c.id === line.cost_center_id)?.code || 'CC' : '—'}</td>
                    <td style={{ padding: 8 }}>{line.profit_center_id ? profitCenters.find(p => p.id === line.profit_center_id)?.code || 'PC' : '—'}</td>
                    <td style={{ padding: 8, textAlign: 'right', fontWeight: 600 }}>{parseFloat(line.debit) > 0 ? Number(line.debit).toLocaleString() : '—'}</td>
                    <td style={{ padding: 8, textAlign: 'right', fontWeight: 600 }}>{parseFloat(line.credit) > 0 ? Number(line.credit).toLocaleString() : '—'}</td>
                  </tr>
                ))}
                <tr style={{ background: 'rgba(0,0,0,0.01)', fontWeight: 800 }}>
                  <td colSpan={3} style={{ padding: 8, textAlign: 'right' }}>Totals:</td>
                  <td style={{ padding: 8, textAlign: 'right', color: 'var(--color-primary)' }}>
                    {selectedEntry.lines.reduce((a, b) => a + parseFloat(b.debit), 0).toLocaleString()} EGP
                  </td>
                  <td style={{ padding: 8, textAlign: 'right', color: 'var(--color-primary)' }}>
                    {selectedEntry.lines.reduce((a, b) => a + parseFloat(b.credit), 0).toLocaleString()} EGP
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 24, justifyContent: 'flex-end' }}>
            {selectedEntry.status === 'draft' && (
              <button className="btn-primary" onClick={() => handlePostEntry(selectedEntry.id)} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem' }}>
                <Check size={14} /> Approve & Post Voucher
              </button>
            )}
            <button className="btn-secondary" onClick={() => setDetailModalOpen(false)} style={{ fontSize: '0.78rem' }}>Close Details</button>
          </div>
        </Modal>
      )}

      {/* Create Modal */}
      <Modal open={createModalOpen} title="New Double-Entry Journal Entry" onClose={() => setCreateModalOpen(false)}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 12, marginBottom: 12 }}>
          <Field label="Entry Date">
            <input type="date" style={inputStyle} value={createForm.entry_date} onChange={e => setCreateForm(p => ({ ...p, entry_date: e.target.value }))} />
          </Field>
          <Field label="Journal Description / Memo">
            <input style={inputStyle} value={createForm.description} onChange={e => setCreateForm(p => ({ ...p, description: e.target.value }))} placeholder="Provide explanation for this ledger posting..." />
          </Field>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-main)' }}>Transaction Lines</span>
          <button className="btn-secondary" onClick={handleAddFormLine} style={{ padding: '4px 8px', fontSize: '0.68rem' }}>Add Line</button>
        </div>

        {/* Dynamic Entry Rows */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 220, overflowY: 'auto', marginBottom: 16, paddingRight: 4 }}>
          {createForm.lines.map((line: any, idx: number) => (
            <div key={idx} style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr 1.2fr 1fr 1fr 0.3fr', gap: 6, background: 'rgba(0,0,0,0.01)', padding: 8, borderRadius: 6, border: '1px solid var(--border-glass)', alignItems: 'center' }}>
              <select style={{ ...inputStyle, padding: 5 }} value={line.account_id} onChange={e => handleLineChange(idx, 'account_id', e.target.value)}>
                <option value="">-- Account --</option>
                {accounts.map(a => <option key={a.id} value={a.id}>{a.code} - {a.name} ({a.type})</option>)}
              </select>
              
              <input type="number" style={{ ...inputStyle, padding: 5 }} value={line.debit} onChange={e => handleLineChange(idx, 'debit', e.target.value)} placeholder="Debit" />
              <input type="number" style={{ ...inputStyle, padding: 5 }} value={line.credit} onChange={e => handleLineChange(idx, 'credit', e.target.value)} placeholder="Credit" />
              
              <select style={{ ...inputStyle, padding: 5 }} value={line.cost_center_id} onChange={e => handleLineChange(idx, 'cost_center_id', e.target.value || null)}>
                <option value="">-- Cost --</option>
                {costCenters.map(c => <option key={c.id} value={c.id}>{c.code}</option>)}
              </select>

              <select style={{ ...inputStyle, padding: 5 }} value={line.profit_center_id} onChange={e => handleLineChange(idx, 'profit_center_id', e.target.value || null)}>
                <option value="">-- Profit --</option>
                {profitCenters.map(p => <option key={p.id} value={p.id}>{p.code}</option>)}
              </select>

              <button className="btn-ghost" disabled={createForm.lines.length <= 2} onClick={() => handleRemoveFormLine(idx)} style={{ color: '#ef4444', padding: 4 }}>×</button>
            </div>
          ))}
        </div>

        {/* Balancing Calculator */}
        <div style={{ background: formTotals.balanced ? 'rgba(16,185,129,0.05)' : 'rgba(239,68,68,0.05)', border: formTotals.balanced ? '1px solid rgba(16,185,129,0.2)' : '1px solid rgba(239,68,68,0.2)', padding: 12, borderRadius: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', fontWeight: 700, marginBottom: 20 }}>
          <div style={{ display: 'flex', gap: 15 }}>
            <span style={{ color: 'var(--text-main)' }}>Total Debit: <strong style={{ color: 'var(--color-primary)' }}>{formTotals.debits.toLocaleString()} EGP</strong></span>
            <span style={{ color: 'var(--text-main)' }}>Total Credit: <strong style={{ color: 'var(--color-primary)' }}>{formTotals.credits.toLocaleString()} EGP</strong></span>
          </div>
          {formTotals.balanced ? (
            <span style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: 4 }}><Check size={14} /> Entries Balanced</span>
          ) : (
            <span style={{ color: '#ef4444', display: 'flex', alignItems: 'center', gap: 4 }}><AlertTriangle size={14} /> Debits must equal Credits</span>
          )}
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn-primary" disabled={!formTotals.balanced} onClick={handleSaveEntry} style={{ flex: 1 }}>Save Draft Voucher</button>
          <button className="btn-secondary" onClick={() => setCreateModalOpen(false)} style={{ flex: 1 }}>Cancel</button>
        </div>
      </Modal>
    </div>
  );
};

export default JournalEntries;
