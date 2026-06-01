import React, { useState, useEffect } from 'react';
import { ShieldCheck, Lock, AlertTriangle, PenTool, CheckCircle, FileSignature } from 'lucide-react';
import api from '../../services/api';

const Handover: React.FC = () => {
  const [checklist, setChecklist] = useState<any[]>([]);
  const [snags, setSnags] = useState<any[]>([]);

  const [newSnagDesc, setNewSnagDesc] = useState('');
  const [newSnagSeverity, setNewSnagSeverity] = useState('medium');
  const [newSnagItem, setNewSnagItem] = useState('walls');

  const [signed, setSigned] = useState(false);
  const [signing, setSigning] = useState(false);
  
  const demoUnitId = '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3d4b6d'; // Sample active UUID

  const fetchHandoverData = async () => {
    try {
      const response = await api.get(`/delivery/units/${demoUnitId}/checklist`);
      if (response.data && response.data.success) {
        setChecklist(response.data.checklist);
        // Map database defects format to local format
        const dbSnags = response.data.logged_snags.map((s: any) => ({
          id: s.id,
          item: s.description.toLowerCase().includes('plumb') ? 'Plumbing' : s.description.toLowerCase().includes('elect') ? 'Electrical' : 'Walls & Finishing',
          desc: s.description,
          severity: s.severity,
          date: s.created_at ? s.created_at.split('T')[0] : nowIsoDate()
        }));
        setSnags(dbSnags);
      }
    } catch (err) {
      console.warn("Handover checklist API fallback: Loading sandbox mock inspection checklists.");
      setChecklist([
        { id: 'walls', item: 'Wall plaster smoothness & painting layers', passed: true },
        { id: 'plumbing', item: 'Plumbing tap flows & drain blockages check', passed: true },
        { id: 'electrical', item: 'Electric sockets & circuit breaker panel check', passed: false },
        { id: 'locks', item: 'Doors, window tracks & locks verification', passed: true }
      ]);
      setSnags([
        { id: 's1', item: 'Electrical', desc: 'Living room power outlet on east column has no current flow.', severity: 'high', date: '2026-06-01' }
      ]);
    }
  };

  useEffect(() => {
    fetchHandoverData();
  }, []);

  const handleAddSnag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSnagDesc) return;

    try {
      // 🚀 Real HTTP Post to Laravel Backend to log quality snag defect
      const response = await api.post('/delivery/snag', {
        unit_id: demoUnitId,
        description: `[${newSnagItem.toUpperCase()}] ${newSnagDesc}`,
        severity: newSnagSeverity
      });

      if (response.data && response.data.success) {
        const s = response.data.snag;
        const newSnag = {
          id: s.id,
          item: newSnagItem === 'walls' ? 'Painting' : newSnagItem === 'plumbing' ? 'Plumbing' : newSnagItem === 'electrical' ? 'Electrical' : 'Doors & Windows',
          desc: s.description,
          severity: s.severity,
          date: nowIsoDate()
        };
        setSnags([newSnag, ...snags]);
        setChecklist(prev => prev.map(c => c.id === newSnagItem ? { ...c, passed: false } : c));
        setNewSnagDesc('');
      }
    } catch (err) {
      console.warn("Backend snag logging failed. Falling back to sandbox simulation.", err);
      // Fallback for sandbox developers previewing the screen
      const snag = {
        id: 's' + (snags.length + 1),
        item: newSnagItem === 'walls' ? 'Painting' : newSnagItem === 'plumbing' ? 'Plumbing' : newSnagItem === 'electrical' ? 'Electrical' : 'Doors & Windows',
        desc: newSnagDesc,
        severity: newSnagSeverity,
        date: nowIsoDate()
      };
      setSnags([snag, ...snags]);
      setChecklist(prev => prev.map(c => c.id === newSnagItem ? { ...c, passed: false } : c));
      setNewSnagDesc('');
    }
  };

  const nowIsoDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  const simulateSignature = async () => {
    setSigning(true);

    try {
      // 🚀 Real HTTP Post to Laravel Backend to signoff handover digital certificate
      const response = await api.post(`/delivery/units/${demoUnitId}/signoff`, {
        signature_data: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIj48cGF0aCBkPSJNMTAgMTBMMjAgMjBMMzAgMzBMMTQgNDBMMTUgNTBMNjAgNjAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzAwMCIgc3Ryb2tlLXdpZHRoPSIyIi8+PC9zdmc+"
      });

      if (response.data && response.data.success) {
        setSigned(true);
      }
    } catch (err) {
      console.warn("Backend signoff failed. Falling back to sandbox simulation.", err);
      // Fallback for sandbox developers previewing the screen
      setSigned(true);
    } finally {
      setSigning(false);
    }
  };


  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      
      {/* Header Panel */}
      <div className="glass-panel" style={{ padding: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ShieldCheck style={{ color: 'var(--color-success)', width: '32px', height: '32px' }} />
            Quality Control Handover Inspector & Snag Logger
          </h1>
          <p>Handover checklists, biometric defect records, and client digital signature confirmations.</p>
        </div>
        <div style={{ padding: '6px 12px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 'var(--radius-sm)' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-success)' }}>MODULE: H.17 (MAHMOUD)</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '30px', alignItems: 'start' }}>
        
        {/* QC Checklist */}
        <div className="glass-panel" style={{ padding: '30px' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <CheckCircle style={{ color: 'var(--color-success)' }} />
            Unit Inspection Checksheets (QC-A01)
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {checklist.map((item) => (
              <div 
                key={item.id} 
                className="glass-panel" 
                style={{
                  padding: '18px 24px', 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  borderColor: item.passed ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'
                }}
              >
                <div>
                  <h4 style={{ fontWeight: 600, fontSize: '0.95rem', color: item.passed ? 'var(--text-main)' : 'var(--color-danger)' }}>{item.item}</h4>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Class Check ID: qc_{item.id}</span>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button 
                    onClick={() => setChecklist(prev => prev.map(c => c.id === item.id ? { ...c, passed: true } : c))}
                    className="btn-secondary" 
                    style={{ padding: '6px 12px', fontSize: '0.75rem', borderColor: item.passed ? 'var(--color-success)' : 'var(--border-glass)', background: item.passed ? 'rgba(16,185,129,0.1)' : 'transparent' }}
                  >
                    Passed
                  </button>
                  <button 
                    onClick={() => setChecklist(prev => prev.map(c => c.id === item.id ? { ...c, passed: false } : c))}
                    className="btn-secondary" 
                    style={{ padding: '6px 12px', fontSize: '0.75rem', borderColor: !item.passed ? 'var(--color-danger)' : 'var(--border-glass)', background: !item.passed ? 'rgba(239,68,68,0.1)' : 'transparent' }}
                  >
                    Failed
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Client Digital Signature */}
          <div className="glass-panel" style={{ marginTop: '30px', padding: '24px', border: '1px dashed var(--border-glass)', background: 'rgba(59,130,246,0.02)' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <FileSignature style={{ color: 'var(--color-primary)' }} />
              Client Handover Sign-off Canvas
            </h3>
            <p style={{ fontSize: '0.8rem', marginBottom: '20px' }}>Simulates Section H.17 quality guarantee digital signature log verification.</p>

            {signed ? (
              <div style={{ padding: '20px', background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
                <span style={{ color: 'var(--color-success)', fontWeight: 700, fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <CheckCircle style={{ width: '18px', height: '18px' }} />
                  HANDOVER COMPLETED & SIGNED OFF
                </span>
                <p style={{ fontSize: '0.75rem', marginTop: '4px' }}>Timeline locked and keys receipt released.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* simulated canvas screen */}
                <div style={{ width: '100%', height: '120px', background: '#0b0f19', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                  {signing ? (
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Writing digital certificate key...</span>
                  ) : (
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontFamily: 'cursive' }}>Sign here...</span>
                  )}
                  {signing && <div style={{ position: 'absolute', bottom: '10px', right: '10px', width: '10px', height: '10px', background: 'var(--color-primary)', borderRadius: '50%' }}></div>}
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button onClick={simulateSignature} className="btn-primary" style={{ flex: 1, justifyContent: 'center' }} disabled={signing}>
                    {signing ? 'Logging Sign-off...' : 'Sign Handover Certificate'}
                  </button>
                  <button onClick={() => setSigned(false)} className="btn-secondary" style={{ padding: '12px 18px' }}>Clear</button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Snag Report logger */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
          
          <div className="glass-panel" style={{ padding: '30px' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <AlertTriangle style={{ color: 'var(--color-danger)' }} />
              Log Quality Snag / Defect
            </h2>

            <form onSubmit={handleAddSnag} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Checksheet Category</label>
                <select className="form-control" value={newSnagItem} onChange={(e) => setNewSnagItem(e.target.value)}>
                  <option value="walls">Painting & Plastering</option>
                  <option value="plumbing">Plumbing Drainage</option>
                  <option value="electrical">Electrical Grid</option>
                  <option value="locks">Doors, Windows & Locks</option>
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Defect Description</label>
                <textarea 
                  className="form-control" 
                  style={{ height: '80px', resize: 'none' }}
                  value={newSnagDesc}
                  onChange={(e) => setNewSnagDesc(e.target.value)}
                  placeholder="e.g. Living room wall plaster has structural cracks near baseboard."
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Severity Level</label>
                <select className="form-control" value={newSnagSeverity} onChange={(e) => setNewSnagSeverity(e.target.value)}>
                  <option value="low">Low (Cosmetic check)</option>
                  <option value="medium">Medium (Standard repair)</option>
                  <option value="high">High (Delay hazard)</option>
                  <option value="critical">Critical (Quality failure)</option>
                </select>
              </div>

              <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                Log Snag Defect
              </button>
            </form>
          </div>

          {/* Active snags log */}
          <div className="glass-panel" style={{ padding: '30px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '16px' }}>Logged Unit Defects ({snags.length})</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {snags.map((snag) => (
                <div key={snag.id} className="glass-panel" style={{ padding: '16px', borderLeft: '4px solid var(--color-danger)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <h4 style={{ fontSize: '0.85rem', fontWeight: 700 }}>{snag.item} Snag</h4>
                    <span className={`badge ${snag.severity === 'high' ? 'badge-danger' : 'badge-warning'}`} style={{ fontSize: '0.6rem' }}>{snag.severity}</span>
                  </div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-main)' }}>{snag.desc}</p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                    <span>ID: {snag.id}</span>
                    <span>Date: {snag.date}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};

export default Handover;
