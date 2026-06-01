import React, { useState } from 'react';
import { Users, Plus, UserCheck, Search, ArrowRight, ShieldCheck } from 'lucide-react';

const Leads: React.FC = () => {
  const [leads, setLeads] = useState([
    { id: '1', name: 'Ahmed Ali', email: 'ahmed@gmail.com', phone: '+20100998877', stage: 'new', kyc: 'verified' },
    { id: '2', name: 'Sherif Omar', email: 'sherif@hotmail.com', phone: '+20111223344', stage: 'contacted', kyc: 'pending' },
    { id: '3', name: 'Nour El-Din', email: 'nour@outlook.com', phone: '+20122334455', stage: 'qualified', kyc: 'none' },
    { id: '4', name: 'Mariam Hassan', email: 'mariam@company.com', phone: '+20155667788', stage: 'reserved', kyc: 'verified' }
  ]);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  const handleAddLead = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) return;

    const newLead = {
      id: String(leads.length + 1),
      name,
      email: email || 'n/a',
      phone,
      stage: 'new',
      kyc: 'none'
    };

    setLeads([newLead, ...leads]);
    setName('');
    setEmail('');
    setPhone('');
  };

  const stages = [
    { key: 'new', name: 'New Leads' },
    { key: 'contacted', name: 'Contacted' },
    { key: 'qualified', name: 'Qualified' },
    { key: 'meeting_scheduled', name: 'Meetings' },
    { key: 'negotiation', name: 'Negotiation' },
    { key: 'reserved', name: 'Reserved 🔵' },
    { key: 'closed_won', name: 'Closed Won 🏆' }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      
      {/* Header Panel */}
      <div className="glass-panel" style={{ padding: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '6px' }}>🟠 Sales CRM & Lead Acquisition</h1>
          <p>Lead registration, biometric KYC face match, and 7-stage Kanban pipeline.</p>
        </div>
        <div style={{ padding: '6px 12px', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 'var(--radius-sm)' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-warning)' }}>MODULE: H.1 / H.9 (RAGAB)</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '30px', alignItems: 'start' }}>
        {/* Lead Capture Form */}
        <div className="glass-panel" style={{ padding: '30px' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Users style={{ color: 'var(--color-warning)' }} />
            Capture New Lead
          </h2>

          <form onSubmit={handleAddLead} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Full Name</label>
              <input type="text" className="form-control" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Mahmoud Ahmed" required />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Email Address</label>
              <input type="email" className="form-control" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@domain.com" />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Phone Number</label>
              <input type="text" className="form-control" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+20 100 000 0000" required />
            </div>

            <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '12px' }}>
              <Plus style={{ width: '18px', height: '18px' }} />
              Capture Lead
            </button>
          </form>
        </div>

        {/* KYC Biometrics Simulation */}
        <div className="glass-panel" style={{ padding: '30px' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ShieldCheck style={{ color: 'var(--color-success)' }} />
            KYC Facematch & OCR Scanner (Simulated)
          </h2>
          <p style={{ marginBottom: '20px' }}>Simulates Section H.1: Biometric verify matching ID photo to camera scan with &gt; 85% confidence score.</p>
          
          <table className="premium-table">
            <thead>
              <tr>
                <th>Lead Name</th>
                <th>Phone</th>
                <th>KYC Verification</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <tr key={lead.id}>
                  <td><strong>{lead.name}</strong></td>
                  <td>{lead.phone}</td>
                  <td>
                    {lead.kyc === 'verified' && <span className="badge badge-success">Verified (94.2%)</span>}
                    {lead.kyc === 'pending' && <span className="badge badge-warning">OCR Running</span>}
                    {lead.kyc === 'none' && <span className="badge badge-danger">Unverified</span>}
                  </td>
                  <td>
                    {lead.kyc === 'none' && (
                      <button 
                        onClick={() => {
                          const updated = leads.map(l => l.id === lead.id ? { ...l, kyc: 'verified' } : l);
                          setLeads(updated);
                        }}
                        className="btn-secondary" 
                        style={{ padding: '6px 12px', fontSize: '0.75rem' }}
                      >
                        Run KYC Verification
                      </button>
                    )}
                    {lead.kyc !== 'none' && <span style={{ color: 'var(--color-success)', fontSize: '0.75rem', fontWeight: 600 }}>Checked</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 7-Stage Kanban Board */}
      <div className="glass-panel" style={{ padding: '30px' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '24px' }}>CRM Pipeline Stages</h2>
        <div className="kanban-board">
          {stages.map((stage) => {
            const stageLeads = leads.filter(l => l.stage === stage.key);
            return (
              <div key={stage.key} className="kanban-column">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-glass)', paddingBottom: '8px' }}>
                  <h4 style={{ fontSize: '0.85rem', fontWeight: 700 }}>{stage.name}</h4>
                  <span className="badge badge-info" style={{ padding: '2px 8px', fontSize: '0.65rem' }}>{stageLeads.length}</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', minHeight: '300px' }}>
                  {stageLeads.map((lead) => (
                    <div key={lead.id} className="kanban-card">
                      <h4 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '6px' }}>{lead.name}</h4>
                      <p style={{ fontSize: '0.75rem', marginBottom: '8px' }}>{lead.phone}</p>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>ID: {lead.id}</span>
                        {stage.key !== 'closed_won' && (
                          <button 
                            onClick={() => {
                              const nextStages = stages.map(s => s.key);
                              const currentIdx = nextStages.indexOf(lead.stage);
                              const nextStage = nextStages[currentIdx + 1];
                              const updated = leads.map(l => l.id === lead.id ? { ...l, stage: nextStage } : l);
                              setLeads(updated);
                            }}
                            style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', color: 'var(--color-primary)' }}
                          >
                            <ArrowRight style={{ width: '14px', height: '14px' }} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};

export default Leads;
