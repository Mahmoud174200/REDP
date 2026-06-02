import React, { useState, useCallback, useRef, useEffect } from 'react';
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
  new: { stage: 'new', label: 'New Leads', color: '#3B82F6', count: 0, leads: [] },
  contacted: { stage: 'contacted', label: 'Contacted', color: '#8B5CF6', count: 0, leads: [] },
  interested: { stage: 'interested', label: 'Interested', color: '#F59E0B', count: 0, leads: [] },
  visit_scheduled: { stage: 'visit_scheduled', label: 'Visit Scheduled', color: '#06B6D4', count: 0, leads: [] },
  negotiation: { stage: 'negotiation', label: 'Negotiation', color: '#F97316', count: 0, leads: [] },
  reserved: { stage: 'reserved', label: 'Reserved', color: '#10B981', count: 0, leads: [] },
  contracted: { stage: 'contracted', label: 'Contracted', color: '#6366F1', count: 0, leads: [] },
};

const CrmKanban: React.FC = () => {
  const [pipeline, setPipeline] = useState<Record<string, PipelineStage>>(MOCK_PIPELINE);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSource, setFilterSource] = useState('all');
  const [filterScore, setFilterScore] = useState('all');
  const [draggedLead, setDraggedLead] = useState<{ lead: LeadCard; fromStage: string } | null>(null);
  const [dragOverStage, setDragOverStage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const dragCounter = useRef(0);

  // Unit Reservation States
  const [showUnitModal, setShowUnitModal] = useState(false);
  const [availableUnits, setAvailableUnits] = useState<any[]>([]);
  const [pendingMove, setPendingMove] = useState<{ leadId: string; fromStage: string; toStage: string } | null>(null);
  const [loadingUnits, setLoadingUnits] = useState(false);

  // Loading state for dragging leads
  const [updatingLeadIds, setUpdatingLeadIds] = useState<string[]>([]);

  const stages = Object.keys(pipeline);

  // Fetch Pipeline Data from Database on Load
  useEffect(() => {
    const fetchPipeline = async () => {
      setIsLoading(true);
      try {
        const response = await api.get('/v1/acquisition/crm/pipeline');
        if (response.data && response.data.success) {
          setPipeline(response.data.pipeline);
        }
      } catch (err) {
        console.error('Failed to fetch CRM pipeline:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPipeline();
  }, []);

  const updateLocalPipeline = (leadId: string, fromStage: string, toStage: string) => {
    setPipeline(prev => {
      const updated = { ...prev };
      const targetLead = updated[fromStage].leads.find(l => l.id === leadId);
      if (!targetLead) return prev;
      
      updated[fromStage] = {
        ...updated[fromStage],
        leads: updated[fromStage].leads.filter(l => l.id !== leadId),
        count: updated[fromStage].count - 1,
      };
      
      updated[toStage] = {
        ...updated[toStage],
        leads: [...updated[toStage].leads, { ...targetLead, kyc_status: toStage === 'reserved' ? 'verified' : targetLead.kyc_status }],
        count: updated[toStage].count + 1,
      };
      return updated;
    });
  };

  const moveLeadOnBackend = async (leadId: string, fromStage: string, toStage: string, unitId?: string) => {
    try {
      const response = await api.put('/v1/acquisition/crm/move', {
        lead_id: leadId,
        status: toStage,
        unit_id: unitId || undefined
      });
      if (response.data && response.data.success) {
        const freshPipe = await api.get('/v1/acquisition/crm/pipeline');
        if (freshPipe.data && freshPipe.data.success) {
          setPipeline(freshPipe.data.pipeline);
        }
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to move lead in database.');
      const freshPipe = await api.get('/v1/acquisition/crm/pipeline');
      if (freshPipe.data && freshPipe.data.success) {
        setPipeline(freshPipe.data.pipeline);
      }
    } finally {
      setUpdatingLeadIds(prev => prev.filter(id => id !== leadId));
    }
  };

  const handleStageChange = async (leadId: string, fromStage: string, toStage: string) => {
    if (updatingLeadIds.includes(leadId)) return;

    if (toStage === 'reserved') {
      setPendingMove({ leadId, fromStage, toStage });
      setLoadingUnits(true);
      setShowUnitModal(true);
      try {
        const res = await api.get('/v1/finance/units?status=available');
        if (res.data && res.data.success) {
          setAvailableUnits(res.data.data || []);
        }
      } catch (err) {
        console.error('Error fetching available units:', err);
      } finally {
        setLoadingUnits(false);
      }
    } else {
      setUpdatingLeadIds(prev => [...prev, leadId]);
      updateLocalPipeline(leadId, fromStage, toStage);
      await moveLeadOnBackend(leadId, fromStage, toStage);
    }
  };

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
    handleStageChange(lead.id, fromStage, toStage);
  }, [draggedLead]);

  // ── Move lead forward (arrow button) ──
  const moveLeadForward = (lead: LeadCard, currentStage: string) => {
    const currentIdx = stages.indexOf(currentStage);
    if (currentIdx >= stages.length - 1) return;
    const nextStage = stages[currentIdx + 1];
    handleStageChange(lead.id, currentStage, nextStage);
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

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', flexDirection: 'column', gap: '16px' }}>
        <div className="animate-spin" style={{ width: '40px', height: '40px', border: '4px solid var(--color-primary)', borderTopColor: 'transparent', borderRadius: '50%' }} />
        <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 600 }}>Loading...</span>
      </div>
    );
  }

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

      {/* ── Filters Control Panel ── */}
      <div className="glass-panel" style={{ padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            <i className="fa-solid fa-filter" style={{ marginRight: '6px' }}></i> Filter By:
          </span>
          
          {/* Source Filter Chips */}
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {['all', 'facebook', 'google', 'tiktok', 'broker', 'direct'].map(src => (
              <button
                key={src}
                onClick={() => setFilterSource(src)}
                className={filterSource === src ? 'btn-primary' : 'btn-secondary'}
                style={{ padding: '6px 14px', fontSize: '0.7rem', textTransform: 'uppercase', borderRadius: '9999px' }}
              >
                {src === 'all' ? 'All Sources' : src}
              </button>
            ))}
          </div>
        </div>

        {/* Score Filter Dropdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>Lead Score:</span>
          <select
            value={filterScore}
            onChange={(e) => setFilterScore(e.target.value)}
            className="form-control"
            style={{ width: '150px', padding: '6px 12px', fontSize: '0.75rem', cursor: 'pointer' }}
          >
            <option value="all">🔥 All Scores</option>
            <option value="high">🟢 High (≥ 80)</option>
            <option value="mid">🟡 Medium (50 - 79)</option>
            <option value="low">🔴 Low (&lt; 50)</option>
          </select>
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
          const filteredLeads = stage.leads.filter(l => {
            const matchesSearch = !searchTerm || l.full_name.toLowerCase().includes(searchTerm.toLowerCase()) || l.phone.includes(searchTerm);
            const matchesSource = filterSource === 'all' || l.source === filterSource;
            const matchesScore = filterScore === 'all' || 
              (filterScore === 'high' && l.lead_score >= 80) ||
              (filterScore === 'mid' && l.lead_score >= 50 && l.lead_score < 80) ||
              (filterScore === 'low' && l.lead_score < 50);
            return matchesSearch && matchesSource && matchesScore;
          });

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
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                minHeight: '200px',
                flex: 1,
                maxHeight: 'calc(100vh - 380px)',
                overflowY: 'auto',
                paddingRight: '4px'
              }} className="sidebar-scroll-container">
                {filteredLeads.map(lead => {
                  const isUpdating = updatingLeadIds.includes(lead.id);
                  return (
                    <div
                      key={lead.id}
                      draggable={!isUpdating}
                      onDragStart={(e) => handleDragStart(e, lead, stageKey)}
                      onDragEnd={handleDragEnd}
                      style={{
                        position: 'relative',
                        background: 'var(--bg-secondary)',
                        border: '1px solid var(--border-glass)',
                        borderRadius: 'var(--radius-sm)',
                        padding: '14px',
                        cursor: isUpdating ? 'not-allowed' : 'grab',
                        userSelect: 'none',
                        WebkitUserSelect: 'none',
                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                        borderLeft: `3px solid ${stage.color}`,
                        opacity: isUpdating ? 0.6 : 1,
                        pointerEvents: isUpdating ? 'none' : 'auto'
                      }}
                      onMouseOver={(e) => {
                        if (isUpdating) return;
                        (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
                        (e.currentTarget as HTMLElement).style.boxShadow = `0 4px 12px ${stage.color}22`;
                      }}
                      onMouseOut={(e) => {
                        if (isUpdating) return;
                        (e.currentTarget as HTMLElement).style.transform = 'none';
                        (e.currentTarget as HTMLElement).style.boxShadow = 'none';
                      }}
                    >
                      {isUpdating && (
                        <div style={{
                          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                          background: 'rgba(255, 255, 255, 0.6)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          borderRadius: 'var(--radius-sm)', zIndex: 10
                        }}>
                          <div className="animate-spin" style={{
                            width: '18px', height: '18px',
                            border: '2px solid var(--color-primary)',
                            borderTopColor: 'transparent',
                            borderRadius: '50%'
                          }} />
                        </div>
                      )}
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
                );
              })}

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

      {showUnitModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)',
          zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '20px'
        }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '500px', padding: '30px', display: 'flex', flexDirection: 'column', gap: '20px', border: '1.5px solid var(--border-glass)', borderRadius: 'var(--radius-lg)' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)' }}>Select Unit to Reserve</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>A unit must be selected to lock reservation details for the lead.</p>
            
            {loadingUnits ? (
              <div style={{ textAlign: 'center', padding: '20px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Loading available inventory...</div>
            ) : availableUnits.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px', fontSize: '0.85rem', color: 'var(--color-danger)' }}>No available units in inventory.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '250px', overflowY: 'auto' }} className="sidebar-scroll-container">
                {availableUnits.map(unit => (
                  <button
                    key={unit.id}
                    onClick={async () => {
                      if (pendingMove) {
                        setUpdatingLeadIds(prev => [...prev, pendingMove.leadId]);
                        updateLocalPipeline(pendingMove.leadId, pendingMove.fromStage, pendingMove.toStage);
                        await moveLeadOnBackend(pendingMove.leadId, pendingMove.fromStage, pendingMove.toStage, unit.id);
                      }
                      setShowUnitModal(false);
                      setPendingMove(null);
                    }}
                    className="btn-secondary"
                    style={{
                      display: 'flex', justifyContent: 'space-between', padding: '12px 16px',
                      textAlign: 'left', borderRadius: 'var(--radius-sm)', width: '100%', alignItems: 'center'
                    }}
                  >
                    <div>
                      <strong style={{ color: 'var(--text-main)', fontSize: '0.85rem' }}>Unit {unit.unit_number}</strong>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>{unit.type} | {unit.project?.name || 'Compound'}</span>
                    </div>
                    <strong style={{ color: 'var(--color-primary)', fontSize: '0.85rem' }}>EGP {unit.price.toLocaleString()}</strong>
                  </button>
                ))}
              </div>
            )}
            
            <button 
              onClick={() => { setShowUnitModal(false); setPendingMove(null); }} 
              className="btn-primary" 
              style={{ background: 'var(--color-danger)', border: 'none', color: '#fff', justifyContent: 'center', padding: '12px' }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CrmKanban;
