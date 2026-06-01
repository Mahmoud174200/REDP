import React, { useState } from 'react';
import { Building2, Wallet, FileText, Lock, Unlock, BadgeCheck } from 'lucide-react';

const Inventory: React.FC = () => {
  const [units, setUnits] = useState([
    { id: 'u1', number: 'A-101', type: 'Apartment', floor: 1, price: 3400000.00, status: 'available', lockedBy: null },
    { id: 'u2', number: 'A-102', type: 'Apartment', floor: 1, price: 3550000.00, status: 'available', lockedBy: null },
    { id: 'u3', number: 'V-501', type: 'Villa (Corner)', floor: 0, price: 12400000.00, status: 'reserved', lockedBy: 'User_902' },
    { id: 'u4', number: 'O-204', type: 'Office space', floor: 2, price: 6800000.00, status: 'available', lockedBy: null }
  ]);

  const [lockSimulation, setLockSimulation] = useState<string | null>(null);

  const simulateRowLock = (unitId: string) => {
    setLockSimulation(`ACQUIRING ROW LOCK: SELECT * FROM units WHERE id = '${unitId}' FOR UPDATE...`);
    
    // Transact simulation
    setTimeout(() => {
      setLockSimulation(`[SUCCESS] LOCK HELD! Processing Fawry/Stripe payment token...`);
      
      setTimeout(() => {
        setUnits(prev => prev.map(u => {
          if (u.id === unitId) {
            return { ...u, status: 'reserved', lockedBy: 'Stripe_Gate_Active' };
          }
          return u;
        }));
        setLockSimulation(`[SUCCESS] Unit status updated to 'reserved'. Transaction committed. Row lock released! Decoupled 'ReservationConfirmed' event emitted to event bus.`);
      }, 1000);
      
    }, 800);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      
      {/* Header Panel */}
      <div className="glass-panel" style={{ padding: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '6px' }}>🔵 Real Estate Inventory & Billing Ledger</h1>
          <p>Real-time units catalog, database transactional locking, and payment plans generator.</p>
        </div>
        <div style={{ padding: '6px 12px', background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 'var(--radius-sm)' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-primary)' }}>MODULE: H.3 / H.5 (MELWANY)</span>
        </div>
      </div>

      {/* Row Lock Simulator Panel */}
      {lockSimulation && (
        <div className="glass-panel animate-pulse" style={{ padding: '20px', background: 'rgba(168,85,247,0.08)', borderColor: 'rgba(168,85,247,0.3)', color: 'var(--color-secondary)', fontFamily: 'monospace', fontSize: '0.85rem' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Lock style={{ width: '14px', height: '14px' }} />
            {lockSimulation}
          </span>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '30px', alignItems: 'start' }}>
        
        {/* Units catalog */}
        <div className="glass-panel" style={{ padding: '30px' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Building2 style={{ color: 'var(--color-primary)' }} />
            Compounds Unit Stock
          </h2>

          <table className="premium-table">
            <thead>
              <tr>
                <th>Unit Number</th>
                <th>Type</th>
                <th>Floor</th>
                <th>Price (EGP)</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {units.map((unit) => (
                <tr key={unit.id}>
                  <td><strong>{unit.number}</strong></td>
                  <td>{unit.type}</td>
                  <td>{unit.floor}</td>
                  <td>{unit.price.toLocaleString('en-US')} EGP</td>
                  <td>
                    {unit.status === 'available' && <span className="badge badge-success">Available</span>}
                    {unit.status === 'reserved' && <span className="badge badge-warning">Reserved</span>}
                  </td>
                  <td>
                    {unit.status === 'available' ? (
                      <button 
                        onClick={() => simulateRowLock(unit.id)}
                        className="btn-primary" 
                        style={{ padding: '8px 16px', fontSize: '0.75rem' }}
                      >
                        <Lock style={{ width: '12px', height: '12px' }} />
                        Secure Row Purchase
                      </button>
                    ) : (
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Lock style={{ width: '12px', height: '12px', color: 'var(--color-danger)' }} />
                        Locked (ID: {unit.lockedBy})
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Client Installment ledger */}
        <div className="glass-panel" style={{ padding: '30px' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Wallet style={{ color: 'var(--color-secondary)' }} />
            Installment Ledger
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ padding: '16px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-primary)', border: '1px solid var(--border-glass)' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>REMAINING PRINCIPAL</span>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: '4px', color: 'var(--color-primary)' }}>2,450,000.00 EGP</h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <h4 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>INSTALLMENTS DUE TIMELINE</h4>
              
              <div className="glass-panel" style={{ padding: '12px', fontSize: '0.8rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h4 style={{ fontWeight: 600 }}>Q3 Installment</h4>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Due: 2026-07-01</span>
                </div>
                <div>
                  <span style={{ fontWeight: 700, marginRight: '10px' }}>12,000 EGP</span>
                  <span className="badge badge-danger">Unpaid</span>
                </div>
              </div>

              <div className="glass-panel" style={{ padding: '12px', fontSize: '0.8rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h4 style={{ fontWeight: 600 }}>Q4 Installment</h4>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Due: 2026-10-01</span>
                </div>
                <div>
                  <span style={{ fontWeight: 700, marginRight: '10px' }}>12,000 EGP</span>
                  <span className="badge badge-danger">Unpaid</span>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};

export default Inventory;
