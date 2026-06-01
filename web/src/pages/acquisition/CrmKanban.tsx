import React, { useState, useCallback, useRef } from 'react';
import api from '../../services/api';

// ─────────────────────────────────────────────────────────
// REDP — Acquisition & Sales Engine (Developer 1: Ragab)
// Component: CRM Kanban Board
// Premium interactive drag-and-drop pipeline with live data.
// ─────────────────────────────────────────────────────────

interface LeadCard {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  lead_score: number;
  source: string;
  kyc_status: string;
  assigned_agent: { id: string; name: string } | null;
  last_interaction: { type: string; notes: string; created_at: string } | null;
  created_at: string;
}

interface PipelineStage {
  stage: string;
  label: string;
  color: string;
  count: number;
  leads: LeadCard[];
}

const STAGE_CONFIG: Record<string, { icon: string; gradient: string }> = {
  new:             { icon: 'fa-solid fa-user-plus', gradient: 'linear-gradient(135deg, #3B82F6, #2563EB)' },
  contacted:       { icon: 'fa-solid fa-phone', gradient: 'linear-gradient(135deg, #8B5CF6, #7C3AED)' },
  interested:      { icon: 'fa-solid fa-star', gradient: 'linear-gradient(135deg, #F59E0B, #D97706)' },
  visit_scheduled: { icon: 'fa-solid fa-calendar-days', gradient: 'linear-gradient(135deg, #06B6D4, #0891B2)' },
  negotiation:     { icon: 'fa-solid fa-handshake', gradient: 'linear-gradient(135deg, #F97316, #EA580C)' },
  reserved:        { icon: 'fa-solid fa-circle-check', gradient: 'linear-gradient(135deg, #10B981, #059669)' },
  contracted:      { icon: 'fa-solid fa-file-contract', gradient: 'linear-gradient(135deg, #6366F1, #4F46E5)' },
};

const MOCK_PIPELINE: Record<string, PipelineStage> = {
  new: {
    stage: 'new', label: 'New Leads', color: '#3B82F6', count: 4,
    leads: [
      { id: 'l1', full_name: 'Ahmed Ali Hassan', email: 'ahmed@gmail.com', phone: '+20100998877', lead_score: 85, source: 'facebook', kyc_status: 'none', assigned_agent: { id: 'a1', name: 'Ragab Mohamed' }, last_interaction: null, created_at: '2026-05-28T10:00:00Z' },
      { id: 'l2', full_name: 'Sara El-Sayed', email: 'sara@company.com', phone: '+20111223344', lead_score: 72, source: 'google', kyc_status: 'none', assigned_agent: { id: 'a2', name: 'Omar Khaled' }, last_interaction: null, created_at: '2026-05-29T14:30:00Z' },
      { id: 'l3', full_name: 'Mahmoud Fawzy', email: 'mfawzy@outlook.com', phone: '+20122345678', lead_score: 60, source: 'direct', kyc_status: 'none', assigned_agent: null, last_interaction: null, created_at: '2026-05-30T09:15:00Z' },
      { id: 'l8', full_name: 'Layla Nour', email: 'layla@hotmail.com', phone: '+20155001122', lead_score: 45, source: 'tiktok', kyc_status: 'none', assigned_agent: null, last_interaction: null, created_at: '2026-05-31T16:00:00Z' },
    ],
  },
  contacted: {
    stage: 'contacted', label: 'Contacted', color: '#8B5CF6', count: 3,
    leads: [
      { id: 'l4', full_name: 'Nour El-Din Ibrahim', email: 'nour@gmail.com', phone: '+20133456789', lead_score: 78, source: 'referral', kyc_status: 'pending', assigned_agent: { id: 'a1', name: 'Ragab Mohamed' }, last_interaction: { type: 'call', notes: 'Discussed villa options in Phase 3', created_at: '2026-05-30T11:00:00Z' }, created_at: '2026-05-27T08:00:00Z' },
      { id: 'l9', full_name: 'Yasmin Adel', email: 'yasmin@mail.com', phone: '+20166778899', lead_score: 65, source: 'facebook', kyc_status: 'none', assigned_agent: { id: 'a2', name: 'Omar Khaled' }, last_interaction: { type: 'whatsapp', notes: 'Sent brochure PDF', created_at: '2026-05-31T09:00:00Z' }, created_at: '2026-05-29T12:00:00Z' },
      { id: 'l10', full_name: 'Tarek Mansour', email: 'tarek@co.eg', phone: '+20177889900', lead_score: 55, source: 'google', kyc_status: 'none', assigned_agent: { id: 'a1', name: 'Ragab Mohamed' }, last_interaction: { type: 'email', notes: 'Follow-up email sent', created_at: '2026-05-31T14:00:00Z' }, created_at: '2026-05-30T10:00:00Z' },
    ],
  },
  interested: {
    stage: 'interested', label: 'Interested', color: '#F59E0B', count: 2,
    leads: [
      { id: 'l5', full_name: 'Mariam Hassan Aly', email: 'mariam@company.com', phone: '+20155667788', lead_score: 91, source: 'broker', kyc_status: 'verified', assigned_agent: { id: 'a1', name: 'Ragab Mohamed' }, last_interaction: { type: 'meeting', notes: 'On-site visit completed, very interested in Unit A-204', created_at: '2026-05-31T15:00:00Z' }, created_at: '2026-05-20T10:00:00Z' },
      { id: 'l11', full_name: 'Khaled Mostafa', email: 'khaled.m@gmail.com', phone: '+20188990011', lead_score: 82, source: 'direct', kyc_status: 'pending', assigned_agent: { id: 'a2', name: 'Omar Khaled' }, last_interaction: { type: 'call', notes: 'Requesting payment plan details', created_at: '2026-05-31T11:30:00Z' }, created_at: '2026-05-25T08:00:00Z' },
    ],
  },
  visit_scheduled: {
    stage: 'visit_scheduled', label: 'Visit Scheduled', color: '#06B6D4', count: 2,
    leads: [
      { id: 'l6', full_name: 'Sherif Omar Said', email: 'sherif@hotmail.com', phone: '+20144556677', lead_score: 88, source: 'facebook', kyc_status: 'verified', assigned_agent: { id: 'a2', name: 'Omar Khaled' }, last_interaction: { type: 'call', notes: 'Visit confirmed for Sunday 2 PM', created_at: '2026-05-31T10:00:00Z' }, created_at: '2026-05-22T12:00:00Z' },
      { id: 'l12', full_name: 'Dina Samir', email: 'dina.s@yahoo.com', phone: '+20199001122', lead_score: 75, source: 'google', kyc_status: 'none', assigned_agent: { id: 'a1', name: 'Ragab Mohamed' }, last_interaction: { type: 'whatsapp', notes: 'Scheduled for Thursday 10 AM', created_at: '2026-05-31T16:00:00Z' }, created_at: '2026-05-28T14:00:00Z' },
    ],
  },
  negotiation: {
    stage: 'negotiation', label: 'Negotiation', color: '#F97316', count: 1,
    leads: [
      { id: 'l7', full_name: 'Hassan El-Maghraby', email: 'hassan@business.com', phone: '+20100112233', lead_score: 95, source: 'direct', kyc_status: 'verified', assigned_agent: { id: 'a1', name: 'Ragab Mohamed' }, last_interaction: { type: 'meeting', notes: 'Negotiating 5% discount on Unit B-301, counter-offer pending', created_at: '2026-05-31T17:00:00Z' }, created_at: '2026-05-15T10:00:00Z' },
    ],
  },
  reserved: {
    stage: 'reserved', label: 'Reserved', color: '#10B981', count: 1,
    leads: [
      { id: 'l13', full_name: 'Amira Gamal', email: 'amira.g@corp.com', phone: '+20100334455', lead_score: 98, source: 'broker', kyc_status: 'verified', assigned_agent: { id: 'a2', name: 'Omar Khaled' }, last_interaction: { type: 'meeting', notes: 'EOI payment completed, unit locked', created_at: '2026-05-30T12:00:00Z' }, created_at: '2026-05-10T10:00:00Z' },
    ],
  },
  contracted: {
    stage: 'contracted', label: 'Contracted', color: '#6366F1', count: 0,
    leads: [],
  },
};

const CrmKanban: React.FC = () => {
  const [pipeline, setPipeline] = useState<Record<string, PipelineStage>>(MOCK_PIPELINE);
  const [searchTerm, setSearchTerm] = useState('');
  const [draggedLead, setDraggedLead] = useState<{ lead: LeadCard; fromStage: string } | null>(null);
  const [dragOverStage, setDragOverStage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const dragCounter = useRef(0);

  const stages = Object.keys(pipeline);

  // ── Drag & Drop Handlers ──
  const handleDragStart = (e: React.DragEvent, lead: LeadCard, fromStage: string) => {
    setDraggedLead({ lead, fromStage });
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', lead.id);
    (e.currentTarget as HTMLElement).style.opacity = '0.4';
  };

  const handleDragEnd = (e: React.DragEvent) => {
    (e.currentTarget as HTMLElement).style.opacity = '1';
    setDraggedLead(null);
    setDragOverStage(null);
    dragCounter.current = 0;
  };

  const handleDragEnter = (e: React.DragEvent, stage: string) => {
    e.preventDefault();
    dragCounter.current++;
    setDragOverStage(stage);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setDragOverStage(null);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = useCallback((e: React.DragEvent, toStage: string) => {
    e.preventDefault();
    dragCounter.current = 0;
    setDragOverStage(null);

    if (!draggedLead || draggedLead.fromStage === toStage) return;

    const { lead, fromStage } = draggedLead;

    setPipeline(prev => {
      const updated = { ...prev };
      // Remove from source
      updated[fromStage] = {
        ...updated[fromStage],
        leads: updated[fromStage].leads.filter(l => l.id !== lead.id),
        count: updated[fromStage].count - 1,
      };
      // Add to destination
      updated[toStage] = {
        ...updated[toStage],
        leads: [...updated[toStage].leads, lead],
        count: updated[toStage].count + 1,
      };
      return updated;
    });

    setDraggedLead(null);
  }, [draggedLead]);

  // ── Move lead forward (arrow button) ──
  const moveLeadForward = (lead: LeadCard, currentStage: string) => {
    const currentIdx = stages.indexOf(currentStage);
    if (currentIdx >= stages.length - 1) return;
    const nextStage = stages[currentIdx + 1];

    setPipeline(prev => {
      const updated = { ...prev };
      updated[currentStage] = {
        ...updated[currentStage],
        leads: updated[currentStage].leads.filter(l => l.id !== lead.id),
        count: updated[currentStage].count - 1,
      };
      updated[nextStage] = {
        ...updated[nextStage],
        leads: [...updated[nextStage].leads, lead],
        count: updated[nextStage].count + 1,
      };
      return updated;
    });
  };

  // ── Score Badge Color ──
  const getScoreColor = (score: number) => {
    if (score >= 90) return '#10B981';
    if (score >= 70) return '#F59E0B';
    if (score >= 50) return '#F97316';
    return '#EF4444';
  };

  const getKycBadge = (status: string) => {
    switch (status) {
      case 'verified': return <span className="badge badge-success" style={{ fontSize: '0.6rem', padding: '2px 6px' }}>KYC ✓</span>;
      case 'pending': return <span className="badge badge-warning" style={{ fontSize: '0.6rem', padding: '2px 6px' }}>KYC ⏳</span>;
      default: return null;
    }
  };

  const totalLeads = Object.values(pipeline).reduce((acc, s) => acc + s.count, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* ── Header Panel ── */}
      <div className="glass-panel" style={{ padding: '28px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <i className="fa-solid fa-chart-simple" style={{ color: 'var(--color-warning)', fontSize: '1.6rem' }}></i>
            CRM Sales Pipeline
          </h1>
          <p style={{ fontSize: '0.85rem' }}>Drag and drop leads between stages • {totalLeads} active leads in pipeline</p>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <i className="fa-solid fa-magnifying-glass" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '0.85rem', color: 'var(--text-muted)' }}></i>
            <input
              type="text"
              className="form-control"
              placeholder="Search leads..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ paddingLeft: '36px', width: '220px', padding: '10px 14px 10px 36px', fontSize: '0.85rem' }}
            />
          </div>
          <div style={{ padding: '6px 14px', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 'var(--radius-sm)', whiteSpace: 'nowrap' }}>
            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-warning)' }}>🟠 RAGAB — H.9 CRM</span>
          </div>
        </div>
      </div>

      {/* ── Stats Row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px' }}>
        {stages.map(stageKey => {
          const stage = pipeline[stageKey];
          const config = STAGE_CONFIG[stageKey];
          return (
            <div
              key={stageKey}
              className="glass-panel"
              style={{ padding: '16px 20px', textAlign: 'center', borderTop: `3px solid ${stage.color}` }}
            >
              <i className={config.icon} style={{ fontSize: '1.4rem', color: stage.color, display: 'block', margin: '4px 0' }}></i>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: stage.color, marginTop: '4px' }}>{stage.count}</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{stage.label}</div>
            </div>
          );
        })}
      </div>

      {/* ── Kanban Board ── */}
      <div style={{ display: 'flex', gap: '16px', overflowX: 'auto', paddingBottom: '16px', minHeight: '60vh' }}>
        {stages.map(stageKey => {
          const stage = pipeline[stageKey];
          const config = STAGE_CONFIG[stageKey];
          const isDragOver = dragOverStage === stageKey;
          const filteredLeads = stage.leads.filter(l =>
            !searchTerm || l.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            l.phone.includes(searchTerm)
          );

          return (
            <div
              key={stageKey}
              onDragEnter={(e) => handleDragEnter(e, stageKey)}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, stageKey)}
              style={{
                flex: '0 0 280px',
                background: isDragOver ? 'rgba(50, 71, 58, 0.08)' : 'rgba(255, 255, 255, 0.25)',
                border: `1px solid ${isDragOver ? stage.color : 'var(--border-glass)'}`,
                borderRadius: 'var(--radius-md)',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                transition: 'all 0.2s ease',
                transform: isDragOver ? 'scale(1.01)' : 'none',
              }}
            >
              {/* Column Header */}
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                paddingBottom: '12px', borderBottom: `2px solid ${stage.color}`,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <i className={config.icon} style={{ fontSize: '1.1rem', color: stage.color }}></i>
                  <h4 style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{stage.label}</h4>
                </div>
                <span style={{
                  background: stage.color + '22',
                  color: stage.color,
                  padding: '2px 10px',
                  borderRadius: '9999px',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                }}>{stage.count}</span>
              </div>

              {/* Cards Container */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', minHeight: '200px', flex: 1 }}>
                {filteredLeads.map(lead => (
                  <div
                    key={lead.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, lead, stageKey)}
                    onDragEnd={handleDragEnd}
                    style={{
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border-glass)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '14px',
                      cursor: 'grab',
                      userSelect: 'none',
                      WebkitUserSelect: 'none',
                      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                      borderLeft: `3px solid ${stage.color}`,
                    }}
                    onMouseOver={(e) => {
                      (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
                      (e.currentTarget as HTMLElement).style.boxShadow = `0 4px 12px ${stage.color}22`;
                    }}
                    onMouseOut={(e) => {
                      (e.currentTarget as HTMLElement).style.transform = 'none';
                      (e.currentTarget as HTMLElement).style.boxShadow = 'none';
                    }}
                  >
                    {/* Card Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{
                          width: '32px', height: '32px', borderRadius: '50%',
                          background: config.gradient,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '0.7rem', fontWeight: 700, color: '#fff', flexShrink: 0,
                        }}>
                          {lead.full_name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                        </div>
                        <div>
                          <h4 style={{ fontSize: '0.82rem', fontWeight: 700, lineHeight: 1.2 }}>{lead.full_name}</h4>
                          <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)', margin: 0 }}>{lead.phone}</p>
                        </div>
                      </div>
                      <i className="fa-solid fa-grip-vertical" style={{ fontSize: '0.8rem', color: 'var(--text-muted)', opacity: 0.4, flexShrink: 0 }}></i>
                    </div>

                    {/* Score & Badges */}
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap' }}>
                      <span style={{
                        fontSize: '0.6rem', fontWeight: 700, padding: '2px 8px',
                        borderRadius: '9999px',
                        background: getScoreColor(lead.lead_score) + '20',
                        color: getScoreColor(lead.lead_score),
                      }}>
                        <i className="fa-solid fa-star" style={{ fontSize: '0.55rem', marginRight: '2px' }}></i>
                        {lead.lead_score}
                      </span>
                      <span style={{
                        fontSize: '0.6rem', fontWeight: 600, padding: '2px 8px',
                        borderRadius: '9999px',
                        background: 'rgba(59,130,246,0.1)', color: 'var(--color-primary)',
                      }}>
                        {lead.source}
                      </span>
                      {getKycBadge(lead.kyc_status)}
                    </div>

                    {/* Last Interaction */}
                    {lead.last_interaction && (
                      <div style={{
                        fontSize: '0.68rem', color: 'var(--text-muted)',
                        background: 'rgba(50, 71, 58, 0.05)', borderRadius: '6px',
                        padding: '8px 10px', marginBottom: '8px',
                      }}>
                        <i className="fa-solid fa-comment-dots" style={{ fontSize: '0.65rem', marginRight: '4px' }}></i>
                        {lead.last_interaction.notes?.substring(0, 60)}{(lead.last_interaction.notes?.length ?? 0) > 60 ? '...' : ''}
                      </div>
                    )}

                    {/* Card Footer */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      {lead.assigned_agent ? (
                        <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>
                          👤 {lead.assigned_agent.name}
                        </span>
                      ) : (
                        <span style={{ fontSize: '0.62rem', color: 'var(--color-danger)' }}>Unassigned</span>
                      )}
                      {stageKey !== 'contracted' && (
                        <button
                          onClick={() => moveLeadForward(lead, stageKey)}
                          style={{
                            background: 'transparent', border: 'none', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', color: stage.color,
                            padding: '4px', borderRadius: '4px', transition: 'all 0.15s',
                          }}
                          title="Move to next stage"
                          onMouseOver={(e) => (e.currentTarget.style.background = stage.color + '22')}
                          onMouseOut={(e) => (e.currentTarget.style.background = 'transparent')}
                        >
                          <i className="fa-solid fa-circle-arrow-right" style={{ fontSize: '0.9rem' }}></i>
                        </button>
                      )}
                    </div>
                  </div>
                ))}

                {/* Empty State */}
                {filteredLeads.length === 0 && (
                  <div style={{
                    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'var(--text-muted)', fontSize: '0.75rem', fontStyle: 'italic',
                    border: `1px dashed ${stage.color}33`, borderRadius: 'var(--radius-sm)',
                    minHeight: '100px',
                  }}>
                    Drop leads here
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CrmKanban;
