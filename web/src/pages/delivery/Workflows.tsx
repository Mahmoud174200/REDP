import React, { useState, useEffect } from 'react';
import { Terminal, Play, ArrowRight, Sparkles, Plus, CheckCircle, Save, ToggleLeft, ToggleRight, Trash2 } from 'lucide-react';
import api from '../../services/api';

const Workflows: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [workflows, setWorkflows] = useState([
    { id: 'wf1', trigger: 'PaymentReceived', action: 'SendWhatsAppNotification', payload: 'Thank you! Q3 installment processed.', active: true },
    { id: 'wf2', trigger: 'ReservationConfirmed', action: 'ScheduleQCInspection', payload: 'Handover unit check timeline.', active: true },
    { id: 'wf3', trigger: 'ContractSigned', action: 'GenerateHandoverTimeline', payload: 'Timeline PDF generation.', active: false }
  ]);

  const [selectedTrigger, setSelectedTrigger] = useState('PaymentReceived');
  const [selectedAction, setSelectedAction] = useState('SendWhatsAppNotification');
  const [payloadText, setPayloadText] = useState('');
  const [publishing, setPublishing] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 600);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', flexDirection: 'column', gap: '16px' }}>
        <div className="animate-spin" style={{ width: '40px', height: '40px', border: '4px solid var(--color-primary)', borderTopColor: 'transparent', borderRadius: '50%' }} />
        <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 600 }}>Loading...</span>
      </div>
    );
  }

  const handleCreateRule = async (e: React.FormEvent) => {
    e.preventDefault();
    setPublishing(true);

    try {
      // 🚀 Real HTTP Post to Laravel Backend database
      const response = await api.post('/delivery/workflows', {
        trigger_name: selectedTrigger,
        action_name: selectedAction,
        rules_payload: { message: payloadText || 'Default automated system operation payload.' }
      });

      if (response.data && response.data.success) {
        const w = response.data.data;
        const newRule = {
          id: w.id,
          trigger: w.trigger_name,
          action: w.action_name,
          payload: w.rules_payload.message,
          active: w.active
        };
        setWorkflows([...workflows, newRule]);
        setPayloadText('');
      }
    } catch (err) {
      console.warn("Backend workflow saving failed. Falling back to sandbox simulation.", err);
      // Fallback for sandbox developers previewing the screen
      const newRule = {
        id: 'wf' + (workflows.length + 1),
        trigger: selectedTrigger,
        action: selectedAction,
        payload: payloadText || 'Default automated system operation payload.',
        active: true
      };
      setWorkflows([...workflows, newRule]);
      setPayloadText('');
    } finally {
      setPublishing(false);
    }
  };


  const toggleRule = (id: string) => {
    setWorkflows(prev => prev.map(w => w.id === id ? { ...w, active: !w.active } : w));
  };

  const deleteRule = (id: string) => {
    setWorkflows(prev => prev.filter(w => w.id !== id));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>

      {/* Header Panel */}
      <div className="glass-panel" style={{ padding: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Terminal style={{ color: 'var(--color-primary)', width: '32px', height: '32px' }} />
            Visual No-Code Workflow Rule Builder
          </h1>
          <p>Drag-and-drop automation triggers, active listeners rules, and notifications templates compilation.</p>
        </div>
        <div style={{ padding: '6px 12px', background: 'rgba(50,71,58,0.06)', border: '1px solid rgba(50,71,58,0.15)', borderRadius: 'var(--radius-sm)' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-primary)' }}>MODULE: H.19 (MAHMOUD)</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '30px', alignItems: 'start' }}>

        {/* Visual Builder Workspace */}
        <div className="glass-panel" style={{ padding: '30px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Sparkles style={{ color: 'var(--color-warning)' }} />
            Visual Rule Designer
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Draw a dynamic automation mapping. The platform listens for core events and dispatches actions instantly.</p>

          <form onSubmit={handleCreateRule} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Visual Nodes Chain */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center', background: 'rgba(255,255,255,0.2)', padding: '24px', borderRadius: 'var(--radius-md)', border: '1.5px dashed var(--border-glass)' }}>

              {/* Trigger Node */}
              <div className="glass-panel" style={{ padding: '16px 24px', width: '100%', maxWidth: '340px', textAlign: 'center', background: '#ffffff', boxShadow: 'var(--shadow-premium)' }}>
                <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--color-warning)', fontWeight: 800, letterSpacing: '0.05em' }}>Trigger Event Node</span>
                <select
                  className="form-control"
                  style={{ border: 'none', background: 'transparent', textAlign: 'center', fontSize: '0.9rem', fontWeight: 700, cursor: 'pointer', padding: '6px' }}
                  value={selectedTrigger}
                  onChange={(e) => setSelectedTrigger(e.target.value)}
                >
                  <option value="ReservationConfirmed">Acquisition.ReservationConfirmed</option>
                  <option value="PaymentReceived">Finance.PaymentReceived</option>
                  <option value="ContractSigned">Finance.ContractSigned</option>
                  <option value="LeadCreated">Acquisition.LeadCreated</option>
                </select>
              </div>

              {/* Connecting CSS Flowing Arrow */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                <ArrowRight style={{ transform: 'rotate(90deg)', color: 'var(--color-primary)', width: '20px', height: '20px' }} />
              </div>

              {/* Action Node */}
              <div className="glass-panel" style={{ padding: '16px 24px', width: '100%', maxWidth: '340px', textAlign: 'center', background: '#ffffff', boxShadow: 'var(--shadow-premium)' }}>
                <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--color-primary)', fontWeight: 800, letterSpacing: '0.05em' }}>Action Listener Node</span>
                <select
                  className="form-control"
                  style={{ border: 'none', background: 'transparent', textAlign: 'center', fontSize: '0.9rem', fontWeight: 700, cursor: 'pointer', padding: '6px' }}
                  value={selectedAction}
                  onChange={(e) => setSelectedAction(e.target.value)}
                >
                  <option value="SendWhatsAppNotification">Delivery.SendWhatsAppNotification</option>
                  <option value="SendSMSAlert">Delivery.SendSMSAlert</option>
                  <option value="ScheduleQCInspection">Delivery.ScheduleQCInspection</option>
                  <option value="GenerateHandoverTimeline">Delivery.GenerateHandoverTimeline</option>
                </select>
              </div>

            </div>

            {/* Template payload */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Message Template / Operation Payload</label>
              <textarea
                className="form-control"
                style={{ height: '80px', resize: 'none' }}
                value={payloadText}
                onChange={(e) => setPayloadText(e.target.value)}
                placeholder="e.g. Automated alert: Receipt confirmed! Installation ledger updated. ID: {{payment_id}}"
                required
              />
            </div>

            <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={publishing}>
              <Save style={{ width: '18px', height: '18px' }} />
              {publishing ? 'Compiling Rules...' : 'Publish Automation Rule'}
            </button>
          </form>
        </div>

        {/* Rules Listings */}
        <div className="glass-panel" style={{ padding: '30px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Active Rules Registry</h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {workflows.map((wf) => (
              <div key={wf.id} className="glass-panel" style={{ padding: '20px', borderLeft: wf.active ? '4px solid var(--color-success)' : '4px solid var(--text-muted)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: 700 }}>
                    <span style={{ color: 'var(--color-primary)' }}>{wf.trigger}</span>
                    <ArrowRight style={{ width: '12px', height: '12px', color: 'var(--text-muted)' }} />
                    <span style={{ color: 'var(--color-secondary-hover)' }}>{wf.action}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                      onClick={() => toggleRule(wf.id)}
                      style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex' }}
                    >
                      {wf.active ? (
                        <ToggleRight style={{ width: '28px', height: '28px', color: 'var(--color-success)' }} />
                      ) : (
                        <ToggleLeft style={{ width: '28px', height: '28px', color: 'var(--text-muted)' }} />
                      )}
                    </button>
                    <button
                      onClick={() => deleteRule(wf.id)}
                      style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', color: 'var(--color-danger)' }}
                    >
                      <Trash2 style={{ width: '16px', height: '16px' }} />
                    </button>
                  </div>
                </div>
                <p style={{ fontSize: '0.75rem', fontStyle: 'italic', marginBottom: '8px' }}>" {wf.payload} "</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                  <span>Rule ID: {wf.id}</span>
                  <span style={{ fontWeight: 700, color: wf.active ? 'var(--color-success)' : 'var(--text-muted)' }}>
                    {wf.active ? 'ACTIVE RUNTIME' : 'SUSPENDED'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};

export default Workflows;
