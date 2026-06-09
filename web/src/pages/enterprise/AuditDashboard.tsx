import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import {
  ShieldAlert, Search, Calendar, User, Eye, ArrowRight,
  Smartphone, Monitor, Tablet, Globe, Info, Clock, AlertTriangle, RefreshCw
} from 'lucide-react';

interface AuditLog {
  id: string;
  user_id: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  ip_address: string | null;
  user_agent: string | null;
  device_type: string | null;
  browser: string | null;
  geo_location: {
    lat?: number;
    lng?: number;
    city?: string;
    country?: string;
  } | null;
  session_id: string | null;
  old_values: any | null;
  new_values: any | null;
  details: any | null;
  created_at: string;
  user?: {
    name: string;
    email: string;
  } | null;
}

interface SummaryData {
  total_logs: number;
  by_action: { action: string; total: number }[];
  by_device: { device_type: string; total: number }[];
  by_browser: { browser: string; total: number }[];
  daily_trend: { date: string; total: number }[];
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '8px 12px', borderRadius: 'var(--radius-md)',
  border: '1px solid var(--border-glass)', background: 'rgba(255,255,255,0.6)',
  fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-main)', outline: 'none',
  boxSizing: 'border-box',
};

const Modal: React.FC<{ open: boolean; title: string; onClose: () => void; children: React.ReactNode }> = ({ open, title, onClose, children }) => {
  if (!open) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(4px)' }} onClick={onClose}>
      <div className="glass-panel" style={{ width: '95%', maxWidth: 750, maxHeight: '85vh', overflowY: 'auto', padding: 32, borderRadius: 'var(--radius-lg)' }} onClick={e => e.stopPropagation()}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: 20, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <ShieldAlert size={18} color="var(--color-primary)" />
          {title}
        </h2>
        {children}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 24 }}>
          <button className="btn-secondary" onClick={onClose} style={{ padding: '8px 20px', fontSize: '0.8rem' }}>Close Details</button>
        </div>
      </div>
    </div>
  );
};

const AuditDashboard: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Filters & Pagination
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [deviceFilter, setDeviceFilter] = useState('');
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Selected Log detail
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  useEffect(() => {
    loadSummary();
    loadLogs();
  }, [currentPage]);

  const loadSummary = async () => {
    try {
      const res = await api.get('/v1/enterprise/audit/logs/summary');
      setSummary(res.data?.data || null);
    } catch (err) {
      console.error('Error loading audit summary:', err);
    }
  };

  const loadLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page', currentPage.toString());
      if (search) params.append('search', search);
      if (actionFilter) params.append('action', actionFilter);
      if (deviceFilter) params.append('device_type', deviceFilter);
      if (dateStart) params.append('date_start', dateStart);
      if (dateEnd) params.append('date_end', dateEnd);

      const res = await api.get(`/v1/enterprise/audit/logs?${params.toString()}`);
      const payload = res.data?.data || {};
      setLogs(payload.data || []);
      setLastPage(payload.last_page || 1);
      setTotalItems(payload.total || 0);
    } catch (err) {
      console.error('Error loading audit logs:', err);
    }
    setLoading(false);
  };

  const handleSearchTrigger = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    loadLogs();
  };

  const handleResetFilters = () => {
    setSearch('');
    setActionFilter('');
    setDeviceFilter('');
    setDateStart('');
    setDateEnd('');
    setCurrentPage(1);
    // Timeout to let state update
    setTimeout(() => {
      loadLogs();
    }, 50);
  };

  const handleViewDetails = (log: AuditLog) => {
    setSelectedLog(log);
    setDetailModalOpen(true);
  };

  const getActionBadgeColor = (action: string) => {
    if (action.endsWith('_CREATE')) return { bg: 'rgba(16,185,129,0.1)', color: '#10b981' };
    if (action.endsWith('_DELETE')) return { bg: 'rgba(239,68,68,0.1)', color: '#ef4444' };
    return { bg: 'rgba(59,130,246,0.1)', color: '#3b82f6' }; // UPDATE
  };

  const getDeviceIcon = (device: string | null) => {
    switch (device?.toLowerCase()) {
      case 'mobile': return <Smartphone size={14} color="var(--text-muted)" />;
      case 'tablet': return <Tablet size={14} color="var(--text-muted)" />;
      default: return <Monitor size={14} color="var(--text-muted)" />;
    }
  };

  const renderDiffContent = (log: AuditLog) => {
    const oldVal = log.old_values;
    const newVal = log.new_values;
    const action = log.action;

    if (action.endsWith('_CREATE')) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <h4 style={{ fontSize: '0.8rem', fontWeight: 800, color: '#10b981', marginBottom: 4 }}>Created Record Attributes</h4>
          <div style={{ maxHeight: 250, overflowY: 'auto', background: 'rgba(16,185,129,0.04)', padding: 12, borderRadius: 6, border: '1px solid rgba(16,185,129,0.1)' }}>
            {newVal ? Object.entries(newVal).map(([k, v]) => (
              <div key={k} style={{ display: 'flex', fontSize: '0.78rem', marginBottom: 4 }}>
                <span style={{ fontWeight: 700, minWidth: 180, color: 'var(--text-muted)' }}>{k}:</span>
                <span style={{ color: '#10b981', fontFamily: 'monospace', wordBreak: 'break-all' }}>
                  {typeof v === 'object' ? JSON.stringify(v) : String(v)}
                </span>
              </div>
            )) : 'No attributes recorded.'}
          </div>
        </div>
      );
    }

    if (action.endsWith('_DELETE')) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <h4 style={{ fontSize: '0.8rem', fontWeight: 800, color: '#ef4444', marginBottom: 4 }}>Deleted Record Attributes</h4>
          <div style={{ maxHeight: 250, overflowY: 'auto', background: 'rgba(239,68,68,0.04)', padding: 12, borderRadius: 6, border: '1px solid rgba(239,68,68,0.1)' }}>
            {oldVal ? Object.entries(oldVal).map(([k, v]) => (
              <div key={k} style={{ display: 'flex', fontSize: '0.78rem', marginBottom: 4 }}>
                <span style={{ fontWeight: 700, minWidth: 180, color: 'var(--text-muted)' }}>{k}:</span>
                <span style={{ color: '#ef4444', fontFamily: 'monospace', textDecoration: 'line-through', wordBreak: 'break-all' }}>
                  {typeof v === 'object' ? JSON.stringify(v) : String(v)}
                </span>
              </div>
            )) : 'No attributes recorded.'}
          </div>
        </div>
      );
    }

    // UPDATE: Compare modifications
    const keys = Array.from(new Set([...Object.keys(oldVal || {}), ...Object.keys(newVal || {})]));
    const cellStyle: React.CSSProperties = { padding: '8px 12px', fontSize: '0.76rem', borderBottom: '1px solid var(--border-glass)', verticalAlign: 'top' };

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <h4 style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--color-primary)', marginBottom: 4 }}>Field Modifications Audit</h4>
        <div style={{ maxHeight: 250, overflowY: 'auto', border: '1px solid var(--border-glass)', borderRadius: 6 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'rgba(0,0,0,0.02)' }}>
                <th style={{ ...cellStyle, fontWeight: 800, color: 'var(--text-muted)' }}>Attribute</th>
                <th style={{ ...cellStyle, fontWeight: 800, color: '#ef4444' }}>Before (Old Value)</th>
                <th style={{ ...cellStyle, fontWeight: 800, color: '#10b981' }}>After (New Value)</th>
              </tr>
            </thead>
            <tbody>
              {keys.length === 0 ? (
                <tr>
                  <td colSpan={3} style={{ ...cellStyle, textAlign: 'center', color: 'var(--text-muted)' }}>No modifications detected.</td>
                </tr>
              ) : keys.map(k => {
                const oVal = oldVal ? oldVal[k] : undefined;
                const nVal = newVal ? newVal[k] : undefined;
                return (
                  <tr key={k}>
                    <td style={{ ...cellStyle, fontWeight: 700, color: 'var(--text-main)', width: '25%' }}>{k}</td>
                    <td style={{ ...cellStyle, color: '#ef4444', background: 'rgba(239,68,68,0.02)', fontFamily: 'monospace', wordBreak: 'break-all', width: '37.5%' }}>
                      {oVal !== undefined ? (typeof oVal === 'object' ? JSON.stringify(oVal) : String(oVal)) : '—'}
                    </td>
                    <td style={{ ...cellStyle, color: '#10b981', background: 'rgba(16,185,129,0.02)', fontFamily: 'monospace', wordBreak: 'break-all', width: '37.5%' }}>
                      {nVal !== undefined ? (typeof nVal === 'object' ? JSON.stringify(nVal) : String(nVal)) : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const headerStyle: React.CSSProperties = { padding: '10px 14px', fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid var(--border-glass)', background: 'rgba(255,255,255,0.4)' };
  const cellStyle: React.CSSProperties = { padding: '10px 14px', fontSize: '0.78rem', fontWeight: 500, color: 'var(--text-main)', borderBottom: '1px solid var(--border-glass)' };

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 10 }}>
            <ShieldAlert size={24} color="var(--color-primary)" />
            ⚖️ Enterprise Compliance Audit Trails
          </h1>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>
            Centralized security event logs mapping data modifications, IP references, user agents, and geolocation details
          </p>
        </div>
        <button className="btn-secondary" onClick={() => { loadSummary(); loadLogs(); }} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem' }}>
          <RefreshCw size={14} /> Refresh Logs
        </button>
      </div>

      {/* Stats Summary Grid */}
      {summary && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 20 }}>
          <div className="glass-panel" style={{ padding: '16px 20px', borderRadius: 'var(--radius-md)' }}>
            <div style={{ fontSize: '1.3rem', fontWeight: 800 }}>{summary.total_logs}</div>
            <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginTop: 2 }}>Total Audited Changes</div>
          </div>
          
          {summary.by_action?.[0] && (
            <div className="glass-panel" style={{ padding: '16px 20px', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontSize: '1.05rem', fontWeight: 800, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                {summary.by_action[0].action}
              </div>
              <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginTop: 2 }}>
                Top Audit Action ({summary.by_action[0].total} events)
              </div>
            </div>
          )}

          {summary.by_device && (
            <div className="glass-panel" style={{ padding: '16px 20px', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontSize: '1.3rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Monitor size={18} color="var(--color-primary)" />
                {summary.by_device.find(d => d.device_type?.toLowerCase() === 'desktop')?.total || 0}
              </div>
              <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginTop: 2 }}>Desktop Dispatches</div>
            </div>
          )}

          {summary.by_device && (
            <div className="glass-panel" style={{ padding: '16px 20px', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontSize: '1.3rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Smartphone size={18} color="#25D366" />
                {summary.by_device.find(d => d.device_type?.toLowerCase() === 'mobile')?.total || 0}
              </div>
              <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginTop: 2 }}>Mobile Gateway Events</div>
            </div>
          )}
        </div>
      )}

      {/* Filter and Search Panel */}
      <form onSubmit={handleSearchTrigger} className="glass-panel" style={{ padding: 16, borderRadius: 'var(--radius-lg)', marginBottom: 20 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr', gap: 10, alignItems: 'end' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 750, color: 'var(--text-muted)', marginBottom: 4 }}>Keyword Search</label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Search size={14} color="var(--text-muted)" style={{ position: 'absolute', left: 10 }} />
              <input
                style={{ ...inputStyle, paddingLeft: 30 }}
                placeholder="User name, IP, Action type..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 750, color: 'var(--text-muted)', marginBottom: 4 }}>Filter Action</label>
            <select style={inputStyle} value={actionFilter} onChange={e => setActionFilter(e.target.value)}>
              <option value="">-- All Actions --</option>
              <option value="CREATE">CREATE</option>
              <option value="UPDATE">UPDATE</option>
              <option value="DELETE">DELETE</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 750, color: 'var(--text-muted)', marginBottom: 4 }}>Device Type</label>
            <select style={inputStyle} value={deviceFilter} onChange={e => setDeviceFilter(e.target.value)}>
              <option value="">-- All Devices --</option>
              <option value="Desktop">Desktop</option>
              <option value="Mobile">Mobile</option>
              <option value="Tablet">Tablet</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 750, color: 'var(--text-muted)', marginBottom: 4 }}>Start Date</label>
            <input type="date" style={inputStyle} value={dateStart} onChange={e => setDateStart(e.target.value)} />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 750, color: 'var(--text-muted)', marginBottom: 4 }}>End Date</label>
            <input type="date" style={inputStyle} value={dateEnd} onChange={e => setDateEnd(e.target.value)} />
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 12 }}>
          <button type="button" className="btn-secondary" onClick={handleResetFilters} style={{ fontSize: '0.75rem', padding: '6px 14px' }}>Reset</button>
          <button type="submit" className="btn-primary" style={{ fontSize: '0.75rem', padding: '6px 14px' }}>Apply Filters</button>
        </div>
      </form>

      {/* Audit Logs Table */}
      <div className="glass-panel" style={{ padding: 0, borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Loading audit log trails...</div>
        ) : logs.length === 0 ? (
          <div style={{ padding: 45, textAlign: 'center', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
            <ShieldAlert size={32} style={{ opacity: 0.3 }} />
            <div>No matching security audit logs found in compliance store.</div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr>
                  <th style={headerStyle}>Timestamp</th>
                  <th style={headerStyle}>User Actor</th>
                  <th style={headerStyle}>Audit Action</th>
                  <th style={headerStyle}>Entity Type</th>
                  <th style={headerStyle}>IP Address</th>
                  <th style={headerStyle}>System Info</th>
                  <th style={headerStyle}>Geolocation</th>
                  <th style={headerStyle}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {logs.map(log => {
                  const badge = getActionBadgeColor(log.action);
                  return (
                    <tr key={log.id} style={{ transition: 'background 0.2s' }}>
                      <td style={cellStyle}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Clock size={12} color="var(--text-muted)" />
                          <strong>{new Date(log.created_at).toLocaleString()}</strong>
                        </div>
                      </td>
                      <td style={cellStyle}>
                        {log.user ? (
                          <div>
                            <strong>{log.user.name}</strong>
                            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{log.user.email}</div>
                          </div>
                        ) : (
                          <span style={{ fontStyle: 'italic', color: 'var(--text-muted)' }}>System Process</span>
                        )}
                      </td>
                      <td style={cellStyle}>
                        <span style={{ padding: '3px 8px', borderRadius: 999, fontSize: '0.68rem', fontWeight: 800, background: badge.bg, color: badge.color }}>
                          {log.action}
                        </span>
                      </td>
                      <td style={cellStyle}>
                        {log.entity_type ? (
                          <div>
                            <strong style={{ fontSize: '0.75rem' }}>{log.entity_type.split('\\').pop()}</strong>
                            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                              ID: {log.entity_id?.substring(0, 8)}...
                            </div>
                          </div>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td style={cellStyle}>
                        <code style={{ fontSize: '0.72rem', background: 'rgba(0,0,0,0.03)', padding: '2px 4px', borderRadius: 4 }}>
                          {log.ip_address || '127.0.0.1'}
                        </code>
                      </td>
                      <td style={cellStyle}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          {getDeviceIcon(log.device_type)}
                          <span style={{ fontSize: '0.72rem' }}>{log.browser || 'Browser'}</span>
                        </div>
                      </td>
                      <td style={cellStyle}>
                        {log.geo_location ? (
                          <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                            🌍 {log.geo_location.city}, {log.geo_location.country}
                          </span>
                        ) : (
                          'Local'
                        )}
                      </td>
                      <td style={cellStyle}>
                        <button className="btn-secondary" onClick={() => handleViewDetails(log)} style={{ padding: '5px 10px', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Eye size={12} /> View Diff
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Toolbar */}
        {logs.length > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px', borderTop: '1px solid var(--border-glass)', background: 'rgba(255,255,255,0.2)' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              Showing Page {currentPage} of {lastPage} ({totalItems} total logs)
            </span>
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                className="btn-secondary"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                style={{ padding: '6px 12px', fontSize: '0.72rem' }}
              >
                Previous
              </button>
              <button
                className="btn-secondary"
                disabled={currentPage === lastPage}
                onClick={() => setCurrentPage(p => Math.min(lastPage, p + 1))}
                style={{ padding: '6px 12px', fontSize: '0.72rem' }}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* JSON Diff & Detailed Log Modal */}
      {selectedLog && (
        <Modal open={detailModalOpen} title="Audit Trail & Modification Details" onClose={() => setDetailModalOpen(false)}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 2fr', gap: 20 }}>
            {/* Left Column: Metadata */}
            <div style={{ borderRight: '1px solid var(--border-glass)', paddingRight: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 800 }}>Audit ID</span>
                <div style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: 'var(--text-main)' }}>{selectedLog.id}</div>
              </div>

              <div>
                <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 800 }}>Event Action</span>
                <div style={{ marginTop: 2 }}>
                  <span style={{ padding: '3px 8px', borderRadius: 999, fontSize: '0.65rem', fontWeight: 800, ...getActionBadgeColor(selectedLog.action) }}>
                    {selectedLog.action}
                  </span>
                </div>
              </div>

              <div>
                <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 800 }}>Timestamp</span>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-main)', fontWeight: 600 }}>
                  {new Date(selectedLog.created_at).toLocaleString()}
                </div>
              </div>

              <div>
                <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 800 }}>User Actor</span>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-main)', fontWeight: 700 }}>
                  {selectedLog.user?.name || 'System / Auto Process'}
                </div>
                {selectedLog.user && (
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{selectedLog.user.email}</div>
                )}
              </div>

              <div>
                <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 800 }}>Client Context</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2, fontSize: '0.75rem', color: 'var(--text-main)', marginTop: 2 }}>
                  <span>IP: <code>{selectedLog.ip_address || '127.0.0.1'}</code></span>
                  <span>Device: <strong>{selectedLog.device_type || 'Desktop'}</strong></span>
                  <span>Browser: <strong>{selectedLog.browser || 'Unknown'}</strong></span>
                  {selectedLog.session_id && (
                    <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', wordBreak: 'break-all' }}>
                      Session: {selectedLog.session_id}
                    </span>
                  )}
                </div>
              </div>

              {selectedLog.geo_location && (
                <div>
                  <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 800 }}>Geo Tracking</span>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-main)', marginTop: 2 }}>
                    🌍 {selectedLog.geo_location.city}, {selectedLog.geo_location.country}
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                      Lat: {selectedLog.geo_location.lat}, Lng: {selectedLog.geo_location.lng}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: Visual Differences */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {selectedLog.details?.message && (
                <div style={{ background: 'rgba(59,130,246,0.05)', border: '1px solid rgba(59,130,246,0.15)', padding: 10, borderRadius: 6, display: 'flex', gap: 8, alignItems: 'center' }}>
                  <Info size={14} color="var(--color-primary)" />
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-main)' }}>
                    {selectedLog.details.message}
                  </span>
                </div>
              )}

              {/* Render visual diff */}
              {renderDiffContent(selectedLog)}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default AuditDashboard;
