import React, { useState } from 'react';
import {
  TrendingUp, Users, DollarSign, Percent, BarChart3, Filter,
  Share2, Award, Calendar, ChevronDown, RefreshCw, Sparkles,
  ArrowUpRight, ArrowDownRight, Compass
} from 'lucide-react';

// ─────────────────────────────────────────────────────────
// REDP — Acquisition & Sales Engine (Developer 1: Ragab)
// Page: Campaigns & Marketing Analytics
// High-fidelity UTM tracking, dynamic CAC, and ROI visualizer.
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
  cac: number; // Cost per acquisition
  roi: number; // Return on Investment %
  status: 'active' | 'paused' | 'completed';
}

const MOCK_CAMPAIGNS: Campaign[] = [
  {
    id: 'c1',
    name: 'Q2 Luxury Penthouses FB Ads',
    source: 'facebook',
    utm_source: 'facebook_ads',
    utm_medium: 'cpc',
    utm_campaign: 'luxury_penthouses_2026',
    budget: 45000,
    leads_count: 320,
    conversion_rate: 4.8,
    cac: 140,
    roi: 320,
    status: 'active'
  },
  {
    id: 'c2',
    name: 'New Administrative Capital Search',
    source: 'google',
    utm_source: 'google_search',
    utm_medium: 'cpc',
    utm_campaign: 'admin_capital_commercial',
    budget: 75000,
    leads_count: 540,
    conversion_rate: 6.2,
    cac: 138,
    roi: 480,
    status: 'active'
  },
  {
    id: 'c3',
    name: 'TikTok Video Property Walkthroughs',
    source: 'tiktok',
    utm_source: 'tiktok_influencer',
    utm_medium: 'social_video',
    utm_campaign: 'video_walkthrough_october',
    budget: 30000,
    leads_count: 180,
    conversion_rate: 3.1,
    cac: 166,
    roi: 180,
    status: 'active'
  },
  {
    id: 'c4',
    name: 'B2B Commercial Units Campaign',
    source: 'linkedin',
    utm_source: 'linkedin_sponsored',
    utm_medium: 'sponsored_content',
    utm_campaign: 'b2b_office_spaces',
    budget: 60000,
    leads_count: 140,
    conversion_rate: 8.5,
    cac: 428,
    roi: 650,
    status: 'paused'
  },
  {
    id: 'c5',
    name: 'Direct Organic Referrals',
    source: 'direct',
    utm_source: 'organic',
    utm_medium: 'referral',
    utm_campaign: 'organic_direct',
    budget: 0,
    leads_count: 210,
    conversion_rate: 12.4,
    cac: 0,
    roi: 1250,
    status: 'active'
  }
];

const Campaigns: React.FC = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>(MOCK_CAMPAIGNS);
  const [filterSource, setFilterSource] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 800);
  };

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

  const getSourceIconColor = (source: string) => {
    switch (source) {
      case 'facebook': return { bg: 'bg-[#1877F2]/10', text: 'text-[#1877F2]' };
      case 'google': return { bg: 'bg-[#EA4335]/10', text: 'text-[#EA4335]' };
      case 'tiktok': return { bg: 'bg-[#00F2FE]/10', text: 'text-[#00F2FE]' };
      case 'linkedin': return { bg: 'bg-[#0A66C2]/10', text: 'text-[#0A66C2]' };
      default: return { bg: 'bg-emerald-500/10', text: 'text-emerald-400' };
    }
  };

  return (
    <div className="flex flex-col gap-6 p-1 text-white">
      {/* ── Header ── */}
      <div className="glass-panel p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4 border border-white/5 rounded-2xl bg-[#131A2E]/40 backdrop-blur-md">
        <div>
          <h1 className="text-2xl font-black flex items-center gap-3">
            <Compass className="text-[#3B82F6] w-7 h-7 animate-pulse" />
            <span>Campaigns & Marketing Intelligence</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Dynamic customer acquisition cost (CAC), real-time ROI tracking, and UTM source metrics.
          </p>
        </div>
        
        <div className="flex items-center gap-3 self-start md:self-center">
          <button 
            onClick={handleRefresh}
            className={`btn-secondary flex items-center gap-2 p-2 px-4 rounded-xl border border-white/10 bg-slate-800/40 hover:bg-slate-700/50 transition-all ${isRefreshing ? 'opacity-70' : ''}`}
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Sync Live Ads</span>
          </button>
          
          <div className="bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold py-2 px-3 rounded-lg">
            MODULE: H.11 (RAGAB)
          </div>
        </div>
      </div>

      {/* ── Key Performance Metrics ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="glass-panel p-6 border border-white/5 bg-[#131A2E]/50 rounded-2xl flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Ad Spend</span>
            <span className="text-2xl font-bold text-white">EGP {totalBudget.toLocaleString()}</span>
            <span className="text-[11px] text-emerald-400 flex items-center gap-1 font-semibold mt-1">
              <ArrowUpRight className="w-3 h-3" />
              <span>+12.4% vs last month</span>
            </span>
          </div>
          <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        {/* Metric 2 */}
        <div className="glass-panel p-6 border border-white/5 bg-[#131A2E]/50 rounded-2xl flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Acquired Leads</span>
            <span className="text-2xl font-bold text-white">{totalLeads}</span>
            <span className="text-[11px] text-emerald-400 flex items-center gap-1 font-semibold mt-1">
              <ArrowUpRight className="w-3 h-3" />
              <span>+8.2% conversion spike</span>
            </span>
          </div>
          <div className="p-3 bg-purple-500/10 text-purple-400 rounded-xl">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* Metric 3 */}
        <div className="glass-panel p-6 border border-white/5 bg-[#131A2E]/50 rounded-2xl flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Average CAC</span>
            <span className="text-2xl font-bold text-amber-400">EGP {averageCac}</span>
            <span className="text-[11px] text-emerald-400 flex items-center gap-1 font-semibold mt-1">
              <ArrowDownRight className="w-3 h-3" />
              <span>-4.6% optimized bid</span>
            </span>
          </div>
          <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        {/* Metric 4 */}
        <div className="glass-panel p-6 border border-white/5 bg-[#131A2E]/50 rounded-2xl flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Average ROI</span>
            <span className="text-2xl font-bold text-emerald-400">{averageRoi}%</span>
            <span className="text-[11px] text-emerald-400 flex items-center gap-1 font-semibold mt-1">
              <Sparkles className="w-3 h-3 text-emerald-400" />
              <span>Top performing module</span>
            </span>
          </div>
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl">
            <Percent className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* ── Search and Filter Bar ── */}
      <div className="glass-panel p-4 flex flex-col md:flex-row gap-3 border border-white/5 bg-[#131A2E]/30 rounded-xl">
        <div className="flex-1 relative">
          <input
            type="text"
            className="w-full pl-10 pr-4 py-2 bg-slate-950/40 border border-white/10 rounded-xl text-sm focus:border-[#3B82F6] focus:outline-none placeholder-slate-500"
            placeholder="Search campaigns by name or UTM campaign code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Filter className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
        </div>

        <div className="flex gap-2">
          {['all', 'facebook', 'google', 'tiktok', 'linkedin', 'direct'].map(source => (
            <button
              key={source}
              onClick={() => setFilterSource(source)}
              className={`py-1.5 px-3 rounded-lg text-xs font-bold transition-all uppercase tracking-wide border ${
                filterSource === source 
                  ? 'bg-[#3B82F6] text-white border-[#3B82F6]' 
                  : 'bg-slate-900/40 text-slate-400 border-white/5 hover:bg-slate-800/40'
              }`}
            >
              {source}
            </button>
          ))}
        </div>
      </div>

      {/* ── Campaigns Table Grid ── */}
      <div className="glass-panel overflow-hidden border border-white/5 bg-[#131A2E]/25 rounded-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-slate-950/20 text-slate-400 text-xs font-bold uppercase tracking-wider">
                <th className="p-4 px-6">Campaign Info</th>
                <th className="p-4">UTM Parameters</th>
                <th className="p-4">Budget</th>
                <th className="p-4">Leads</th>
                <th className="p-4">Conv. %</th>
                <th className="p-4">CAC</th>
                <th className="p-4">Est. ROI</th>
                <th className="p-4 px-6 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredCampaigns.map(c => {
                const styles = getSourceIconColor(c.source);
                return (
                  <tr key={c.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="p-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className={`p-2.5 rounded-lg font-bold text-xs uppercase ${styles.bg} ${styles.text}`}>
                          {c.source.substring(0, 2)}
                        </div>
                        <div>
                          <div className="font-bold text-sm text-white group-hover:text-[#3B82F6] transition-colors">
                            {c.name}
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5">ID: {c.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col gap-1 text-[11px] font-mono">
                        <div><span className="text-slate-500 font-sans">src:</span> <span className="text-blue-300">{c.utm_source}</span></div>
                        <div><span className="text-slate-500 font-sans">med:</span> <span className="text-purple-300">{c.utm_medium}</span></div>
                        <div><span className="text-slate-500 font-sans">cam:</span> <span className="text-amber-300">{c.utm_campaign}</span></div>
                      </div>
                    </td>
                    <td className="p-4 text-sm font-semibold text-slate-200">
                      {c.budget > 0 ? `EGP ${c.budget.toLocaleString()}` : <span className="text-emerald-400">ORGANIC</span>}
                    </td>
                    <td className="p-4 text-sm font-bold text-white">{c.leads_count}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold">{c.conversion_rate}%</span>
                        <div className="w-12 bg-slate-900 rounded-full h-1.5 overflow-hidden">
                          <div 
                            className="bg-[#3B82F6] h-full" 
                            style={{ width: `${Math.min(c.conversion_rate * 8, 100)}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-sm font-bold text-amber-400">
                      {c.cac > 0 ? `EGP ${c.cac}` : 'EGP 0'}
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-emerald-400">{c.roi}%</span>
                        <span className="text-[10px] text-slate-500">Multiple: {(c.roi / 100).toFixed(1)}x</span>
                      </div>
                    </td>
                    <td className="p-4 px-6 text-right">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        c.status === 'active' 
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                          : c.status === 'paused'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            : 'bg-slate-700/20 text-slate-400 border border-slate-700/30'
                      }`}>
                        {c.status.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Campaigns;
