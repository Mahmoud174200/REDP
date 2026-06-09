import React, { useState, useEffect } from 'react';
import api from '../../../services/api';
import {
  TrendingUp, Layers, Users, DollarSign, Calendar, FileText, Download, RefreshCw, BarChart2, Briefcase, Award, ShieldAlert
} from 'lucide-react';

interface KPIMetric {
  name: string;
  display_name: string;
  category: string;
  value: number;
  target_value: number;
  calculated_at: string;
}

interface DashboardPayload {
  role_type: string;
  kpis: Record<string, KPIMetric>;
  widgets: any[];
  context_data: any;
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-md)',
  border: '1px solid var(--border-glass)', background: 'rgba(255,255,255,0.6)',
  fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-main)', outline: 'none',
  boxSizing: 'border-box',
};

const ExecutiveDashboards: React.FC = () => {
  const [role, setRole] = useState<'ceo' | 'director' | 'regional_manager'>('ceo');
  const [dashboardData, setDashboardData] = useState<DashboardPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [recalculating, setRecalculating] = useState(false);

  useEffect(() => {
    loadDashboard();
  }, [role]);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/v1/enterprise/dashboards/${role}`);
      if (res.data?.success) {
        setDashboardData(res.data.data);
      }
    } catch (err) {
      console.error('Error loading dashboard:', err);
    }
    setLoading(false);
  };

  const handleRecalculate = async () => {
    setRecalculating(true);
    try {
      await api.post('/v1/enterprise/kpis/recalculate');
      loadDashboard();
    } catch (err) {
      console.error('Error recalculating KPIs:', err);
    }
    setRecalculating(false);
  };

  const handleExport = () => {
    // Open CSV download in a new tab
    const token = localStorage.getItem('token') || '';
    window.open(`${api.defaults.baseURL}/v1/enterprise/dashboards/export?token=${token}`, '_blank');
  };

  const renderKPIValue = (name: string, value: number) => {
    if (name === 'revenue_ytd' || name === 'commission_payouts_total') {
      return `${value.toLocaleString()} EGP`;
    }
    if (name === 'lead_conversion_rate' || name === 'budget_burn_rate') {
      return `${value.toFixed(1)}%`;
    }
    if (name === 'po_turnaround_time') {
      return `${value.toFixed(1)} Hours`;
    }
    return value.toLocaleString();
  };

  const renderWidgetCard = (widget: any) => {
    const kpi = dashboardData?.kpis[widget.metric];
    if (!kpi) return null;

    const variance = kpi.target_value > 0 ? ((kpi.value - kpi.target_value) / kpi.target_value) * 100 : 0;
    const progress = kpi.target_value > 0 ? (kpi.value / kpi.target_value) * 100 : 0;

    return (
      <div className="glass-panel" key={widget.id} style={{ padding: 20, borderRadius: 'var(--radius-lg)', minHeight: 120 }}>
        <span style={{ fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block', letterSpacing: '0.06em' }}>
          {kpi.category.toUpperCase()}
        </span>
        <h3 style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-main)', marginTop: 4, marginBottom: 12 }}>
          {kpi.display_name}
        </h3>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <strong style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--text-main)' }}>
            {renderKPIValue(kpi.name, kpi.value)}
          </strong>
          <span style={{ fontSize: '0.72rem', fontWeight: 800, color: variance >= 0 ? 'var(--color-success)' : '#ef4444' }}>
            {variance >= 0 ? '+' : ''}{variance.toFixed(1)}% vs target
          </span>
        </div>
        {kpi.target_value > 0 && (
          <div style={{ marginTop: 12 }}>
            <div style={{ height: 5, width: '100%', background: 'rgba(0,0,0,0.03)', borderRadius: 99, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${Math.min(100, progress)}%`, background: progress >= 100 ? 'var(--color-success)' : 'var(--color-primary)', borderRadius: 99 }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 4, fontWeight: 500 }}>
              <span>0</span>
              <span>Target: {renderKPIValue(kpi.name, kpi.target_value)}</span>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderContextChart = () => {
    const context = dashboardData?.context_data;
    if (!context) return null;

    if (role === 'ceo' && context.cashflow_trend) {
      const data: any[] = context.cashflow_trend;
      return (
        <div className="glass-panel" style={{ padding: 24, borderRadius: 'var(--radius-lg)', marginTop: 20 }}>
          <h3 style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: 20 }}>Monthly Inflow vs Outflow cash trend</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {data.map((item, idx) => {
              const maxVal = 30000000;
              const inflowPercent = (item.inflow / maxVal) * 100;
              const outflowPercent = (item.outflow / maxVal) * 100;
              return (
                <div key={idx}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: 4 }}>{item.month}</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: '0.65rem', width: 45, color: 'var(--text-muted)', fontWeight: 500 }}>Inflow:</span>
                      <div style={{ flex: 1, height: 8, background: 'rgba(0,0,0,0.02)', borderRadius: 99, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${inflowPercent}%`, background: 'var(--color-primary)', borderRadius: 99 }} />
                      </div>
                      <span style={{ fontSize: '0.7rem', fontWeight: 700 }}>{(item.inflow / 1000000).toFixed(1)}M</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: '0.65rem', width: 45, color: 'var(--text-muted)', fontWeight: 500 }}>Outflow:</span>
                      <div style={{ flex: 1, height: 8, background: 'rgba(0,0,0,0.02)', borderRadius: 99, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${outflowPercent}%`, background: 'var(--color-secondary)', borderRadius: 99 }} />
                      </div>
                      <span style={{ fontSize: '0.7rem', fontWeight: 700 }}>{(item.outflow / 1000000).toFixed(1)}M</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    if (role === 'director' && context.sales_pipeline) {
      const data: any[] = context.sales_pipeline;
      return (
        <div className="glass-panel" style={{ padding: 24, borderRadius: 'var(--radius-lg)', marginTop: 20 }}>
          <h3 style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: 20 }}>Sales Pipeline Stage Analysis</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {data.map((item, idx) => {
              const maxVal = 50000000;
              const barPercent = (item.value / maxVal) * 100;
              return (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 100, fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-main)' }}>{item.stage}</div>
                  <div style={{ flex: 1, height: 16, background: 'rgba(0,0,0,0.02)', borderRadius: 4, overflow: 'hidden', position: 'relative' }}>
                    <div style={{ height: '100%', width: `${barPercent}%`, background: 'rgba(99,102,241,0.15)', borderLeft: '3px solid var(--color-primary)' }} />
                    <span style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-main)' }}>
                      {item.count} Leads
                    </span>
                  </div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, width: 80, textAlign: 'right' }}>{(item.value / 1000000).toFixed(1)}M EGP</span>
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    if (role === 'regional_manager' && context.branch_collections) {
      const data: any[] = context.branch_collections;
      return (
        <div className="glass-panel" style={{ padding: 24, borderRadius: 'var(--radius-lg)', marginTop: 20 }}>
          <h3 style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: 20 }}>Branch Collections Target vs Actual</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {data.map((item, idx) => {
              const maxVal = 22000000;
              const targetPercent = (item.target / maxVal) * 100;
              const actualPercent = (item.actual / maxVal) * 100;
              return (
                <div key={idx}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: 6 }}>
                    <span>{item.branch} Branch</span>
                    <span>{((item.actual / item.target) * 100).toFixed(0)}% Achieved</span>
                  </div>
                  <div style={{ height: 20, width: '100%', background: 'rgba(0,0,0,0.02)', borderRadius: 4, position: 'relative', overflow: 'hidden' }}>
                    {/* Target marker or background bar */}
                    <div style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: `${targetPercent}%`, background: 'rgba(0,0,0,0.03)', borderRight: '2px dashed var(--text-muted)' }} />
                    {/* Actual fill */}
                    <div style={{ height: '100%', width: `${actualPercent}%`, background: 'linear-gradient(90deg, rgba(16,185,129,0.2) 0%, rgba(16,185,129,0.4) 100%)', borderLeft: '3px solid var(--color-success)' }} />
                    <span style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-main)' }}>
                      {(item.actual / 1000000).toFixed(1)}M / {(item.target / 1000000).toFixed(1)}M EGP
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 10 }}>
            <TrendingUp size={26} color="var(--color-primary)" />
            🏢 Executive BI Dashboard
          </h1>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>
            Inspect decoupled and cached key performance metrics, filter layouts by role, and download compliance reports.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn-secondary" onClick={handleRecalculate} style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: 6 }} disabled={recalculating}>
            <RefreshCw size={12} className={recalculating ? 'animate-spin' : ''} /> {recalculating ? 'Refreshing...' : 'Force Refresh'}
          </button>
          <button className="btn-primary" onClick={handleExport} style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Download size={14} /> Export CSV
          </button>
        </div>
      </div>

      {/* Role selector tabs */}
      <div className="glass-panel" style={{ display: 'flex', gap: 8, padding: 8, borderRadius: 'var(--radius-lg)', marginBottom: 20 }}>
        <button
          className={`tab-btn ${role === 'ceo' ? 'active' : ''}`}
          onClick={() => setRole('ceo')}
          style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, justifyContent: 'center', padding: '10px 14px', borderRadius: 'var(--radius-md)', background: role === 'ceo' ? 'var(--color-primary)' : 'transparent', color: role === 'ceo' ? '#fff' : 'var(--text-main)', border: 'none', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer' }}
        >
          <Award size={16} /> Chief Executive Officer (CEO)
        </button>
        <button
          className={`tab-btn ${role === 'director' ? 'active' : ''}`}
          onClick={() => setRole('director')}
          style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, justifyContent: 'center', padding: '10px 14px', borderRadius: 'var(--radius-md)', background: role === 'director' ? 'var(--color-primary)' : 'transparent', color: role === 'director' ? '#fff' : 'var(--text-main)', border: 'none', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer' }}
        >
          <Briefcase size={16} /> Operations Director
        </button>
        <button
          className={`tab-btn ${role === 'regional_manager' ? 'active' : ''}`}
          onClick={() => setRole('regional_manager')}
          style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, justifyContent: 'center', padding: '10px 14px', borderRadius: 'var(--radius-md)', background: role === 'regional_manager' ? 'var(--color-primary)' : 'transparent', color: role === 'regional_manager' ? '#fff' : 'var(--text-main)', border: 'none', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer' }}
        >
          <Layers size={16} /> Regional Manager
        </button>
      </div>

      {loading ? (
        <div className="glass-panel" style={{ padding: 60, textAlign: 'center', color: 'var(--text-muted)', borderRadius: 'var(--radius-lg)' }}>Assembling BI widget indicators...</div>
      ) : (
        <div>
          {/* KPI Widget Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20 }}>
            {dashboardData?.widgets.filter(w => w.type === 'card').map(widget => renderWidgetCard(widget))}
          </div>

          {/* Context Graphic Analytics */}
          {renderContextChart()}

          {/* CEO context alerts */}
          {role === 'ceo' && dashboardData?.context_data?.pending_approvals_count > 0 && (
            <div className="glass-panel" style={{ marginTop: 20, padding: 18, borderLeft: '4px solid var(--color-secondary)', display: 'flex', alignItems: 'center', gap: 12, borderRadius: 'var(--radius-lg)' }}>
              <ShieldAlert size={20} color="var(--color-secondary)" />
              <div style={{ flex: 1 }}>
                <h4 style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-main)' }}>Pending Approvals Notice</h4>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 2 }}>
                  There are currently <strong>{dashboardData.context_data.pending_approvals_count}</strong> business transaction instances stuck in the dynamic approval queue awaiting your validation.
                </p>
              </div>
              <button className="btn-secondary" style={{ fontSize: '0.72rem', padding: '6px 12px' }} onClick={() => window.location.hash = '/enterprise/approvals'}>
                View Approvals
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ExecutiveDashboards;
