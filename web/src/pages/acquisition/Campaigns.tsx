import React, { useState, useEffect } from 'react';
import {
  TrendingUp, Users, DollarSign, Percent, BarChart3, Filter,
  Share2, Award, Calendar, ChevronDown, RefreshCw, Sparkles,
  ArrowUpRight, ArrowDownRight, Compass
} from 'lucide-react';
import api from '../../services/api';

// ─────────────────────────────────────────────────────────
// REDP — Acquisition & Sales Engine (Developer 1: Ragab)
// Page: Campaigns & Marketing Analytics (Unified Glassmorphism UI)
// ─────────────────────────────────────────────────────────

interface Campaign {
  id: string;
  name: string;
  source: 'facebook' | 'google' | 'tiktok' | 'linkedin' | 'direct';
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
  budget: number;
  leads_count: number;
  conversion_rate: number;
  cac: number;
  roi: number;
  status: 'active' | 'paused' | 'completed';
}

const Campaigns: React.FC = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [filterSource, setFilterSource] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCampaigns = async () => {
    setIsRefreshing(true);
    if (campaigns.length === 0) {
      setIsLoading(true);
    }
    try {
      const response = await api.get('/v1/acquisition/campaigns');
      if (response.data && response.data.success) {
        const mapped = (response.data.data.data || []).map((c: any) => ({
          id: c.id,
          name: c.name,
          source: c.source || 'direct',
          utm_source: c.utm_source || '',
          utm_medium: c.utm_medium || '',
          utm_campaign: c.utm_campaign || '',
          budget: Number(c.budget || 0),
          leads_count: Number(c.leads_count ?? 0),
          conversion_rate: 4.8, // static calculation placeholder
          cac: Number(c.cac || 0),
          roi: Number(c.roi_percentage || 0),
          status: c.status || 'active'
        }));
        setCampaigns(mapped);
      }
    } catch (err) {
      console.error('Error fetching campaigns from DB:', err);
    } finally {
      setIsRefreshing(false);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const handleRefresh = () => {
    fetchCampaigns();
  };

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', flexDirection: 'column', gap: '16px' }}>
        <div className="animate-spin" style={{ width: '40px', height: '40px', border: '4px solid var(--color-primary)', borderTopColor: 'transparent', borderRadius: '50%' }} />
        <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 600 }}>Loading...</span>
      </div>
    );
  }

  const filteredCampaigns = campaigns.filter(c => {
    const matchesSource = filterSource === 'all' || c.source === filterSource;
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.utm_campaign.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSource && matchesSearch;
  });

  // Calculate Aggregates
  const totalBudget = filteredCampaigns.reduce((acc, c) => acc + c.budget, 0);
  const totalLeads = filteredCampaigns.reduce((acc, c) => acc + c.leads_count, 0);
  const averageCac = totalLeads > 0 
    ? Math.round(filteredCampaigns.reduce((acc, c) => acc + (c.cac * c.leads_count), 0) / totalLeads) 
    : 0;
  const averageRoi = Math.round(filteredCampaigns.reduce((acc, c) => acc + c.roi, 0) / (filteredCampaigns.length || 1));

  const getSourceLabel = (source: string) => {
    switch (source) {
      case 'facebook': return 'FB Ads';
      case 'google': return 'Google';
      case 'tiktok': return 'TikTok';
      case 'linkedin': return 'LinkedIn';
      default: return 'Organic';
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      
      {/* Header Panel */}
      <div className="glass-panel" style={{ padding: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Compass style={{ color: 'var(--color-warning)', width: '32px', height: '32px' }} />
            🟠 Campaigns & Marketing Intelligence
          </h1>
          <p>Dynamic customer acquisition cost (CAC), real-time ROI tracking, and UTM source metrics.</p>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button 
            onClick={handleRefresh}
            className="btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px' }}
          >
            <RefreshCw className={isRefreshing ? 'animate-spin' : ''} style={{ width: '16px', height: '16px' }} />
            Sync Live Ads
          </button>
          
          <div style={{ padding: '6px 12px', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-warning)' }}>MODULE: H.11 (RAGAB)</span>
          </div>
        </div>
      </div>

      {/* Grid statistics */}
      <div className="grid-cards">
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-sm)', background: 'rgba(59,130,246,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <DollarSign style={{ color: 'var(--color-primary)' }} />
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>TOTAL AD SPEND</span>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: '2px' }}>EGP {totalBudget.toLocaleString()}</h3>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-sm)', background: 'rgba(168,85,247,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Users style={{ color: 'var(--color-secondary)' }} />
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ACQUIRED LEADS</span>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: '2px' }}>{totalLeads} Leads</h3>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-sm)', background: 'rgba(245,158,11,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <TrendingUp style={{ color: 'var(--color-warning)' }} />
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>AVERAGE CAC</span>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: '2px' }}>EGP {averageCac}</h3>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-sm)', background: 'rgba(16,185,129,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Percent style={{ color: 'var(--color-success)' }} />
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>AVERAGE ROI</span>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: '2px' }}>{averageRoi}%</h3>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar Panel */}
      <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Search Control */}
          <div style={{ flex: 1, minWidth: '280px', position: 'relative' }}>
            <input
              type="text"
              className="form-control"
              placeholder="Search campaigns by name or UTM campaign code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: '100%' }}
            />
          </div>

          {/* Filter Chips */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {['all', 'facebook', 'google', 'tiktok', 'linkedin', 'direct'].map(source => (
              <button
                key={source}
                onClick={() => setFilterSource(source)}
                className={filterSource === source ? 'btn-primary' : 'btn-secondary'}
                style={{ padding: '8px 14px', fontSize: '0.75rem', textTransform: 'uppercase', borderRadius: '9999px' }}
              >
                {source}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table Log */}
      <div className="glass-panel" style={{ padding: '30px' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <BarChart3 style={{ color: 'var(--color-warning)' }} />
          Active Campaigns & Traffic Ledger
        </h2>

        <table className="premium-table">
          <thead>
            <tr>
              <th>Campaign Info</th>
              <th>UTM Parameters</th>
              <th>Budget</th>
              <th>Leads</th>
              <th>Conversion Rate</th>
              <th>CAC</th>
              <th>Est. ROI</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredCampaigns.map(c => (
              <tr key={c.id}>
                <td>
                  <strong>{c.name}</strong>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Channel: {getSourceLabel(c.source)} | ID: {c.id}
                  </div>
                </td>
                <td>
                  <div style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                    <div><span style={{ color: 'var(--color-primary)' }}>src:</span> {c.utm_source}</div>
                    <div><span style={{ color: 'var(--color-secondary)' }}>med:</span> {c.utm_medium}</div>
                    <div><span style={{ color: 'var(--color-warning)' }}>cam:</span> {c.utm_campaign}</div>
                  </div>
                </td>
                <td>
                  {c.budget > 0 ? (
                    <strong>EGP {c.budget.toLocaleString()}</strong>
                  ) : (
                    <span className="badge badge-success">Organic</span>
                  )}
                </td>
                <td>
                  <strong>{c.leads_count}</strong>
                </td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>{c.conversion_rate}%</span>
                    <div style={{ width: '50px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', height: '6px', overflow: 'hidden' }}>
                      <div 
                        style={{ width: `${c.conversion_rate * 8}%`, height: '100%', background: 'var(--color-primary)' }}
                      />
                    </div>
                  </div>
                </td>
                <td>
                  <span style={{ color: 'var(--color-warning)', fontWeight: 700 }}>
                    {c.cac > 0 ? `EGP ${c.cac}` : 'EGP 0'}
                  </span>
                </td>
                <td>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ color: 'var(--color-success)', fontWeight: 700 }}>{c.roi}%</span>
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{(c.roi / 100).toFixed(1)}x return</span>
                  </div>
                </td>
                <td>
                  {c.status === 'active' && <span className="badge badge-success">Active</span>}
                  {c.status === 'paused' && <span className="badge badge-warning">Paused</span>}
                  {c.status === 'completed' && <span className="badge badge-info">Closed</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
};

export default Campaigns;
