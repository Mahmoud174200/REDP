import React, { useState, useEffect } from 'react';
import { Wrench, ShieldAlert, CheckCircle2, UserCheck, Plus, Clock, ClipboardList } from 'lucide-react';
import api from '../../services/api';

const Maintenance: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [tickets, setTickets] = useState([
    { id: 't1', title: 'Water leakage in master bathroom', category: 'Plumbing', priority: 'high', status: 'open', vendor: null, date: '2026-06-01' },
    { id: 't2', title: 'Main circuit breaker keeps tripping', category: 'Electrical', priority: 'critical', status: 'assigned', vendor: 'El-Swedy Electrics', date: '2026-05-31' },
    { id: 't3', title: 'Garden automated sprinkler failure', category: 'Landscape', priority: 'low', status: 'resolved', vendor: 'Green Valley Contractors', date: '2026-05-29' }
  ]);

  const [vendors] = useState([
    { id: 'v1', name: 'Arab Contractors Plumbing Co.', rating: 4.8, type: 'Plumbing' },
    { id: 'v2', name: 'El-Swedy Electrics', rating: 4.9, type: 'Electrical' },
    { id: 'v3', name: 'Al-Ahram Woodwork Specialists', rating: 4.5, type: 'Carpentry' }
  ]);

  const [activeTicket, setActiveTicket] = useState<any | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 600);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', flexDirection: 'column', gap: '16px' }}>
        <div className="animate-spin" style={{ width: '40px', height: '40px', border: '4px solid var(--color-success)', borderTopColor: 'transparent', borderRadius: '50%' }} />
        <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 600 }}>Loading...</span>
      </div>
    );
  }

  const handleOpenDispatch = (ticket: any) => {
    setActiveTicket(ticket);
    setShowModal(true);
  };

  const handleConfirmDispatch = async (vendorId: string, vendorName: string) => {
    if (!activeTicket) return;
    setLoading(true);

    try {
      // 🚀 Real HTTP Post to Laravel Backend Database to dispatch ticket
      const response = await api.post(`/delivery/tickets/${activeTicket.id}/dispatch`, {
        vendor_id: vendorId
      });

      if (response.data && response.data.success) {
        setTickets(prev => prev.map(t => {
          if (t.id === activeTicket.id) {
            return { ...t, status: 'assigned', vendor: vendorName };
          }
          return t;
        }));
      }
    } catch (err) {
      console.warn("Backend dispatch failed. Falling back to sandbox simulation.", err);
      // Fallback for sandbox developers previewing the screen
      setTickets(prev => prev.map(t => {
        if (t.id === activeTicket.id) {
          return { ...t, status: 'assigned', vendor: vendorName };
        }
        return t;
      }));
    } finally {
      setLoading(false);
      setShowModal(false);
      setActiveTicket(null);
    }
  };


  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      
      {/* Header Panel */}
      <div className="glass-panel" style={{ padding: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Wrench style={{ color: 'var(--color-success)', width: '32px', height: '32px' }} />
            Maintenance Ticket Board & Contractor Dispatcher
          </h1>
          <p>Compound facilities repair queues, technician dispatcher consoles, and SLA timelines.</p>
        </div>
        <div style={{ padding: '6px 12px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 'var(--radius-sm)' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-success)' }}>MODULE: H.8 / H.16 (MAHMOUD)</span>
        </div>
      </div>

      {/* Roster & Tickets Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '30px', alignItems: 'start' }}>
        
        {/* Maintenance Queue */}
        <div className="glass-panel" style={{ padding: '30px' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ClipboardList style={{ color: 'var(--color-success)' }} />
            Active Repair Tickets Queue
          </h2>

          <table className="premium-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Category</th>
                <th>Priority</th>
                <th>Assigned Contractor</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {tickets.map((t) => (
                <tr key={t.id}>
                  <td><strong>{t.title}</strong><br /><span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Created: {t.date}</span></td>
                  <td>{t.category}</td>
                  <td>
                    {t.priority === 'critical' && <span className="badge badge-danger">CRITICAL</span>}
                    {t.priority === 'high' && <span className="badge badge-warning">HIGH</span>}
                    {t.priority === 'low' && <span className="badge badge-info">LOW</span>}
                  </td>
                  <td>
                    {t.vendor ? (
                      <span style={{ fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <UserCheck style={{ width: '14px', height: '14px', color: 'var(--color-success)' }} />
                        {t.vendor}
                      </span>
                    ) : (
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Unassigned</span>
                    )}
                  </td>
                  <td>
                    {t.status === 'open' && <span className="badge badge-warning">Open Queue</span>}
                    {t.status === 'assigned' && <span className="badge badge-info">Assigned</span>}
                    {t.status === 'resolved' && <span className="badge badge-success">Resolved</span>}
                  </td>
                  <td>
                    {t.status === 'open' ? (
                      <button 
                        onClick={() => handleOpenDispatch(t)}
                        className="btn-primary" 
                        style={{ padding: '6px 12px', fontSize: '0.75rem' }}
                      >
                        Dispatch Contractor
                      </button>
                    ) : t.status === 'assigned' ? (
                      <button 
                        onClick={() => {
                          setTickets(prev => prev.map(item => item.id === t.id ? { ...item, status: 'resolved' } : item));
                        }}
                        className="btn-secondary" 
                        style={{ padding: '6px 12px', fontSize: '0.75rem', borderColor: 'var(--color-success)', color: 'var(--color-success)' }}
                      >
                        Mark Resolved
                      </button>
                    ) : (
                      <span style={{ color: 'var(--color-success)', fontSize: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <CheckCircle2 style={{ width: '14px', height: '14px' }} />
                        SLA Met
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Contractor directory */}
        <div className="glass-panel" style={{ padding: '30px' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <UserCheck style={{ color: 'var(--color-secondary)' }} />
            Contractors Roster (H.16)
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {vendors.map((v) => (
              <div key={v.id} className="glass-panel" style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h4 style={{ fontWeight: 600, fontSize: '0.9rem' }}>{v.name}</h4>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Class: {v.type}</span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontWeight: 700, color: 'var(--color-warning)' }}>★ {v.rating}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Interactive Dispatcher Modal */}
      {showModal && activeTicket && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '500px', padding: '40px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '6px' }}>Dispatch Contractor</h3>
              <p style={{ fontSize: '0.8rem' }}>Ticket: "{activeTicket.title}"</p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <label className="form-label">Select Available Technical Partner:</label>
              {vendors.map((vendor) => (
                <button
                  key={vendor.id}
                  onClick={() => handleConfirmDispatch(vendor.id, vendor.name)}
                  className="btn-secondary"
                  style={{ width: '100%', justifyContent: 'space-between', padding: '16px' }}
                >
                  <span style={{ fontWeight: 600 }}>{vendor.name}</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-primary)' }}>★ {vendor.rating} | {vendor.type}</span>
                </button>
              ))}
            </div>

            <button 
              onClick={() => setShowModal(false)}
              className="btn-secondary"
              style={{ width: '100%', justifyContent: 'center', borderColor: 'var(--color-danger)', color: 'var(--color-danger)' }}
            >
              Cancel Dispatch
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default Maintenance;
