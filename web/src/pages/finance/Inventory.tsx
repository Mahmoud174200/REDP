import React, { useState, useEffect } from 'react';
import { Building2, Wallet, Lock, Unlock, TrendingUp, Filter, Search, DollarSign, BarChart3, Eye, X, Edit, Plus, FileText } from 'lucide-react';
import api from '../../services/api';

interface UnitData {
  id: string;
  unit_number: string;
  type: string;
  floor: number;
  area: number;
  bedrooms: number;
  bathrooms: number;
  view_type: string;
  building: string;
  price: number;
  status: string;
  phase?: string;
  handover_date?: string;
  layout_description?: string;
  project?: { id: string; name: string; location: string };
}

const Inventory: React.FC = () => {
  const [units, setUnits] = useState<UnitData[]>([]);
  const [filteredUnits, setFilteredUnits] = useState<UnitData[]>([]);
  const [lockSimulation, setLockSimulation] = useState<string | null>(null);
  const [lockProgress, setLockProgress] = useState(0);
  const [selectedUnit, setSelectedUnit] = useState<UnitData | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [isLoading, setIsLoading] = useState(true);

  // User Management Role State
  const [user, setUser] = useState<any>(null);
  const [canManage, setCanManage] = useState(false);

  // Offer PDF generation state
  const [offerLoading, setOfferLoading] = useState(false);

  // Projects list for Unit creation and Phase management
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [selectedProjectPhases, setSelectedProjectPhases] = useState<string[]>([]);

  // Form Modal States
  const [showFormModal, setShowFormModal] = useState(false);
  const [isCreateMode, setIsCreateMode] = useState(true);
  const [editingUnitId, setEditingUnitId] = useState<string | null>(null);
  const [unitForm, setUnitForm] = useState({
    project_id: '',
    unit_number: '',
    floor: 0,
    type: 'apartment',
    area: 120,
    bedrooms: 2,
    bathrooms: 2,
    view_type: 'garden',
    building: '',
    layout_description: '',
    price: 3000000,
    status: 'available',
    phase: 'Phase 1',
    handover_date: ''
  });

  // Live Stats State
  const [stats, setStats] = useState({
    total: 0,
    available: 0,
    reserved: 0,
    sold: 0,
    totalValue: 0,
    soldValue: 0,
    occupancy: 0
  });

  const fetchInventory = async () => {
    setIsLoading(true);
    try {
      const unitsRes = await api.get('/v1/finance/units');
      const statsRes = await api.get('/v1/finance/stats');
      
      if (unitsRes.data?.success) {
        setUnits(unitsRes.data.data);
      }
      
      if (statsRes.data?.success) {
        const s = statsRes.data.stats;
        setStats({
          total: s.total_units || 0,
          available: s.available || 0,
          reserved: s.reserved || 0,
          sold: s.sold || 0,
          totalValue: s.total_portfolio_value || 0,
          soldValue: s.sold_value || 0,
          occupancy: Math.round(s.occupancy_rate || 0)
        });
      }
    } catch (err) {
      console.error('Failed to fetch inventory:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchProjects = async () => {
    try {
      const res = await api.get('/v1/sales/company/projects');
      if (res.data?.success) {
        setProjects(res.data.data);
        if (res.data.data.length > 0 && !selectedProjectId) {
          setSelectedProjectId(res.data.data[0].id);
          setSelectedProjectPhases(res.data.data[0].released_phases || ['Phase 1']);
        }
      }
    } catch (err) {
      console.error('Failed to fetch projects:', err);
    }
  };

  useEffect(() => {
    const userStr = localStorage.getItem('redp_user');
    if (userStr) {
      try {
        const u = JSON.parse(userStr);
        setUser(u);
        const hasAccess = u.role === 'company_sales' || u.role === 'admin';
        setCanManage(hasAccess);
      } catch (e) {
        console.error(e);
      }
    }
    fetchInventory();
  }, []);

  useEffect(() => {
    if (canManage) {
      fetchProjects();
    }
  }, [canManage]);

  useEffect(() => {
    if (selectedProjectId && projects.length > 0) {
      const proj = projects.find(p => p.id === selectedProjectId);
      if (proj) {
        setSelectedProjectPhases(proj.released_phases || ['Phase 1']);
      }
    }
  }, [selectedProjectId, projects]);

  useEffect(() => {
    let result = units;
    if (searchTerm) {
      result = result.filter(u => 
        u.unit_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.project?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.building?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (filterStatus !== 'all') {
      result = result.filter(u => u.status.toLowerCase() === filterStatus.toLowerCase());
    }
    if (filterType !== 'all') {
      result = result.filter(u => u.type.toLowerCase() === filterType.toLowerCase());
    }
    setFilteredUnits(result);
  }, [searchTerm, filterStatus, filterType, units]);

  const simulateRowLock = async (unitId: string) => {
    setLockProgress(0);
    setLockSimulation(`⏳ ACQUIRING ROW LOCK: SELECT * FROM units WHERE id = '${unitId}' FOR UPDATE...`);

    setTimeout(() => {
      setLockProgress(33);
      setLockSimulation(`🔒 LOCK ACQUIRED! Verifying unit availability within transaction...`);

      setTimeout(() => {
        setLockProgress(66);
        setLockSimulation(`💳 Processing payment gateway token... Initiating Stripe/Fawry charge...`);

        setTimeout(async () => {
          try {
            const res = await api.post(`/v1/finance/units/${unitId}/reserve`);
            if (res.data?.success) {
              setLockProgress(100);
              setLockSimulation(`✅ TRANSACTION COMMITTED! Unit status → 'reserved'. Row lock released. Events emitted: ReservationConfirmed.`);
              await fetchInventory();
            }
          } catch (err: any) {
            setLockSimulation(`❌ TRANSACTION ABORTED: ${err.response?.data?.message || 'Failed to reserve unit'}`);
            setLockProgress(0);
          } finally {
            setTimeout(() => {
              setLockSimulation(null);
              setLockProgress(0);
            }, 5000);
          }
        }, 1200);
      }, 1000);
    }, 800);
  };

  // Generate a bilingual PDF offer brochure for an available unit, then open it.
  const generateOffer = async (unitId: string) => {
    setOfferLoading(true);
    try {
      const res = await api.post(`/v1/finance/units/${unitId}/offer-pdf`);
      const url = res.data?.data?.url;
      if (url) {
        // Always rebuild against the API origin the app talks to, so the link
        // works regardless of the backend's configured APP_URL host.
        const origin = (api.defaults.baseURL || '').replace(/\/api(\/v1)?\/?$/i, '').replace(/\/$/, '');
        let path = url;
        try { if (/^https?:\/\//i.test(url)) path = new URL(url).pathname; } catch { /* keep */ }
        const abs = origin + (path.startsWith('/') ? path : '/' + path);
        window.open(abs, '_blank', 'noopener');
      } else {
        alert('The offer was generated but no link was returned.');
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to generate the offer PDF.');
    } finally {
      setOfferLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, { class: string; label: string; style?: React.CSSProperties }> = {
      available: { class: 'badge-success', label: 'Available' },
      reserved: { class: 'badge-warning', label: 'Reserved' },
      sold: { class: 'badge-info', label: 'Sold' },
      blocked: { class: 'badge-danger', label: 'Blocked' },
      hidden: { class: 'badge-danger', label: 'Hidden', style: { background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' } },
      coming_soon: { class: 'badge-warning', label: 'Coming Soon', style: { background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' } },
      frozen: { class: 'badge-info', label: 'Frozen (مسقعة)', style: { background: 'rgba(100, 116, 139, 0.15)', color: '#64748b' } },
    };
    const cfg = map[status.toLowerCase()] || { class: 'badge-info', label: status };
    return (
      <span 
        className={`badge ${cfg.class}`}
        style={{ ...cfg.style, fontSize: '0.72rem', padding: '4px 8px', borderRadius: '4px', fontWeight: 700 }}
      >
        {cfg.label}
      </span>
    );
  };

  const getTypeIcon = (type: string) => {
    const icons: Record<string, string> = {
      apartment: '🏢', villa: '🏡', office: '🏛️', duplex: '🏘️', penthouse: '✨', commercial: '🏪',
    };
    return icons[type.toLowerCase()] || '🏠';
  };

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

      {/* Header */}
      <div className="glass-panel" style={{ padding: '28px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Building2 style={{ color: 'var(--color-primary)' }} />
            Real Estate Inventory
          </h1>
          <p style={{ fontSize: '0.85rem' }}>Unit catalog with transactional row locking, release states & project selling phases</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {canManage && (
            <button
              className="btn-primary"
              onClick={() => {
                setIsCreateMode(true);
                setUnitForm({
                  project_id: selectedProjectId || (projects[0]?.id || ''),
                  unit_number: '',
                  floor: 0,
                  type: 'apartment',
                  area: 120,
                  bedrooms: 3,
                  bathrooms: 2,
                  view_type: 'garden',
                  building: '',
                  layout_description: '',
                  price: 3500000,
                  status: 'available',
                  phase: 'Phase 1',
                  handover_date: ''
                });
                setShowFormModal(true);
              }}
              style={{ padding: '10px 20px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem' }}
            >
              <Plus size={16} />
              Create Unit
            </button>
          )}
          <div style={{ padding: '6px 14px', background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 'var(--radius-sm)' }}>
            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-primary)', letterSpacing: '0.05em' }}>MODULE: H.5</span>
          </div>
        </div>
      </div>

      {/* Project Selling Phase Release Management */}
      {canManage && projects.length > 0 && (
        <div className="glass-panel" style={{ padding: '24px 32px' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 800, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-primary)' }}>
            ⚙️ Project Release Management (Selling Phases)
          </h3>
          <div style={{ display: 'flex', gap: '24px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ minWidth: '280px' }}>
              <label style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                Select Compound / Project
              </label>
              <select
                className="form-control"
                value={selectedProjectId}
                onChange={e => setSelectedProjectId(e.target.value)}
                style={{ fontSize: '0.85rem' }}
              >
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            
            <div style={{ display: 'flex', gap: '24px', alignItems: 'center', marginTop: '16px' }}>
              {['Phase 1', 'Phase 2', 'Phase 3'].map(phase => {
                const isReleased = selectedProjectPhases.includes(phase);
                return (
                  <label key={phase} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}>
                    <input
                      type="checkbox"
                      checked={isReleased}
                      onChange={async () => {
                        let newPhases = [...selectedProjectPhases];
                        if (isReleased) {
                          newPhases = newPhases.filter(p => p !== phase);
                        } else {
                          newPhases.push(phase);
                        }
                        setSelectedProjectPhases(newPhases);
                        try {
                          await api.put(`/v1/sales/company/projects/${selectedProjectId}/phases`, {
                            released_phases: newPhases
                          });
                          setProjects(prev => prev.map(p => p.id === selectedProjectId ? { ...p, released_phases: newPhases } : p));
                        } catch (err) {
                          console.error('Failed to update project phases:', err);
                        }
                      }}
                      style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                    />
                    {phase}
                  </label>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
        {[
          { label: 'Total Units', value: stats.total, icon: <Building2 size={20} />, color: 'var(--color-primary)', bg: 'rgba(59,130,246,0.08)' },
          { label: 'Available', value: stats.available, icon: <Unlock size={20} />, color: 'var(--color-success)', bg: 'rgba(16,185,129,0.08)' },
          { label: 'Reserved', value: stats.reserved, icon: <Lock size={20} />, color: 'var(--color-warning)', bg: 'rgba(245,158,11,0.08)' },
          { label: 'Portfolio Value', value: `${(stats.totalValue / 1000000).toFixed(1)}M`, icon: <TrendingUp size={20} />, color: 'var(--color-secondary)', bg: 'rgba(168,85,247,0.08)' },
        ].map((card, i) => (
          <div key={i} className="glass-panel" style={{ padding: '20px 24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
              <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{card.label}</span>
              <div style={{ padding: '8px', borderRadius: 'var(--radius-sm)', background: card.bg }}>
                <div style={{ color: card.color }}>{card.icon}</div>
              </div>
            </div>
            <h3 style={{ fontSize: '1.75rem', fontWeight: 800, color: card.color }}>{card.value}</h3>
          </div>
        ))}
      </div>

      {/* Occupancy Bar */}
      <div className="glass-panel" style={{ padding: '16px 24px', display: 'flex', alignItems: 'center', gap: '20px' }}>
        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', minWidth: '120px' }}>Occupancy Rate</span>
        <div style={{ flex: 1, height: '10px', borderRadius: '5px', background: 'rgba(255,255,255,0.05)', overflow: 'hidden' }}>
          <div style={{
            width: `${stats.occupancy}%`,
            height: '100%',
            borderRadius: '5px',
            background: `linear-gradient(90deg, var(--color-primary), var(--color-secondary))`,
            transition: 'width 1s ease',
          }} />
        </div>
        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-primary)', minWidth: '40px' }}>{stats.occupancy}%</span>
      </div>

      {/* Row Lock Simulation */}
      {lockSimulation && (
        <div className="glass-panel" style={{ padding: '20px 24px', background: 'rgba(168,85,247,0.06)', borderColor: 'rgba(168,85,247,0.25)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <Lock style={{ width: '16px', height: '16px', color: 'var(--color-secondary)' }} />
            <span style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--color-secondary)' }}>{lockSimulation}</span>
          </div>
          <div style={{ height: '4px', borderRadius: '2px', background: 'rgba(255,255,255,0.05)', overflow: 'hidden' }}>
            <div style={{
              width: `${lockProgress}%`,
              height: '100%',
              borderRadius: '2px',
              background: 'linear-gradient(90deg, var(--color-secondary), var(--color-primary))',
              transition: 'width 0.6s ease',
            }} />
          </div>
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="glass-panel" style={{ padding: '16px 24px', display: 'flex', gap: '12px', alignItems: 'center' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <Search style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', width: '16px', height: '16px', color: 'var(--text-muted)' }} />
          <input
            className="form-control"
            placeholder="Search units by number, building or project..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{ paddingLeft: '40px', fontSize: '0.85rem' }}
          />
        </div>
        <select
          className="form-control"
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          style={{ width: '160px', fontSize: '0.85rem' }}
        >
          <option value="all">All Status</option>
          <option value="available">Available</option>
          <option value="reserved">Reserved</option>
          <option value="sold">Sold</option>
          <option value="hidden">Hidden</option>
          <option value="coming_soon">Coming Soon</option>
          <option value="frozen">Frozen</option>
        </select>
        <select
          className="form-control"
          value={filterType}
          onChange={e => setFilterType(e.target.value)}
          style={{ width: '160px', fontSize: '0.85rem' }}
        >
          <option value="all">All Types</option>
          <option value="apartment">Apartment</option>
          <option value="villa">Villa</option>
          <option value="duplex">Duplex</option>
          <option value="penthouse">Penthouse</option>
          <option value="office">Office</option>
          <option value="commercial">Commercial</option>
        </select>
      </div>

      {/* Units Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '20px' }}>
        {filteredUnits.map(unit => (
          <div key={unit.id} className="glass-panel" style={{ padding: '0', overflow: 'hidden', cursor: 'pointer', position: 'relative' }} onClick={() => setSelectedUnit(unit)}>
            {/* Color Accent Top Bar */}
            <div style={{
              height: '4px',
              background: 
                unit.status.toLowerCase() === 'available' ? 'var(--color-success)' : 
                unit.status.toLowerCase() === 'reserved' ? 'var(--color-warning)' : 
                unit.status.toLowerCase() === 'sold' ? 'var(--color-primary)' : 
                unit.status.toLowerCase() === 'coming_soon' ? '#3b82f6' : 
                unit.status.toLowerCase() === 'frozen' ? '#64748b' : 'var(--color-danger)',
            }} />
            <div style={{ padding: '20px 24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '1.5rem' }}>{getTypeIcon(unit.type)}</span>
                  <div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>{unit.unit_number}</h3>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>{unit.type} • {unit.building}</span>
                  </div>
                </div>
                {getStatusBadge(unit.status)}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  <span style={{ fontWeight: 600 }}>Area:</span> {unit.area} m²
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  <span style={{ fontWeight: 600 }}>Floor:</span> {unit.floor === 0 ? 'Ground' : unit.floor}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  <span style={{ fontWeight: 600 }}>Beds:</span> {unit.bedrooms} • <span style={{ fontWeight: 600 }}>Baths:</span> {unit.bathrooms}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  <span style={{ fontWeight: 600 }}>View:</span> {unit.view_type}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', gridColumn: 'span 2' }}>
                  <span style={{ fontWeight: 600 }}>Phase:</span> <span style={{ color: 'var(--color-primary)', fontWeight: 700 }}>{unit.phase || 'Phase 1'}</span>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-glass)', paddingTop: '14px' }}>
                <div>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Price</span>
                  <h4 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--color-primary)' }}>{Number(unit.price).toLocaleString()} EGP</h4>
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {unit.status.toLowerCase() === 'available' && (
                    <button
                      className="btn-primary"
                      style={{ padding: '8px 14px', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                      onClick={(e) => { e.stopPropagation(); simulateRowLock(unit.id); }}
                    >
                      <Lock style={{ width: '12px', height: '12px' }} />
                      Reserve
                    </button>
                  )}
                  {canManage && (
                    <button
                      className="btn-secondary"
                      style={{ padding: '8px 12px', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsCreateMode(false);
                        setEditingUnitId(unit.id);
                        setUnitForm({
                          project_id: unit.project?.id || (projects[0]?.id || ''),
                          unit_number: unit.unit_number,
                          floor: unit.floor,
                          type: unit.type,
                          area: unit.area,
                          bedrooms: unit.bedrooms,
                          bathrooms: unit.bathrooms,
                          view_type: unit.view_type || '',
                          building: unit.building || '',
                          layout_description: unit.layout_description || '',
                          price: unit.price,
                          status: unit.status,
                          phase: unit.phase || 'Phase 1',
                          handover_date: unit.handover_date || ''
                        });
                        setShowFormModal(true);
                      }}
                    >
                      <Edit style={{ width: '12px', height: '12px' }} />
                      Edit
                    </button>
                  )}
                </div>
              </div>

              {unit.project && (
                <div style={{ marginTop: '10px', fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  📍 {unit.project.name} — {unit.project.location}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredUnits.length === 0 && (
        <div className="glass-panel" style={{ padding: '60px', textAlign: 'center' }}>
          <Search style={{ width: '48px', height: '48px', color: 'var(--text-muted)', margin: '0 auto 16px' }} />
          <h3 style={{ fontWeight: 600, marginBottom: '8px' }}>No units found</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Try adjusting your search or filter criteria.</p>
        </div>
      )}

      {/* Unit Detail Modal */}
      {selectedUnit && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px',
        }} onClick={() => setSelectedUnit(null)}>
          <div className="glass-panel" style={{ maxWidth: '560px', width: '100%', padding: '32px', position: 'relative' }} onClick={e => e.stopPropagation()}>
            <button onClick={() => setSelectedUnit(null)} style={{
              position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none',
              color: 'var(--text-muted)', cursor: 'pointer', padding: '4px',
            }}>
              <X size={20} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '24px' }}>
              <span style={{ fontSize: '2.5rem' }}>{getTypeIcon(selectedUnit.type)}</span>
              <div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>{selectedUnit.unit_number}</h2>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>{selectedUnit.type} • {selectedUnit.building}</p>
              </div>
              <div style={{ marginLeft: 'auto' }}>{getStatusBadge(selectedUnit.status)}</div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
              {[
                { label: 'Area', value: `${selectedUnit.area} m²` },
                { label: 'Floor', value: selectedUnit.floor === 0 ? 'Ground' : `Floor ${selectedUnit.floor}` },
                { label: 'Bedrooms', value: selectedUnit.bedrooms },
                { label: 'Bathrooms', value: selectedUnit.bathrooms },
                { label: 'View', value: selectedUnit.view_type || 'N/A' },
                { label: 'Project', value: selectedUnit.project?.name || 'N/A' },
                { label: 'Selling Phase', value: selectedUnit.phase || 'Phase 1' },
                { label: 'Handover Date', value: selectedUnit.handover_date || 'N/A' }
              ].map((item, i) => (
                <div key={i} style={{ padding: '12px 16px', borderRadius: 'var(--radius-sm)', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-glass)' }}>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{item.label}</span>
                  <p style={{ fontWeight: 700, marginTop: '4px', color: 'var(--text-main)' }}>{item.value}</p>
                </div>
              ))}
            </div>

            {selectedUnit.layout_description && (
              <div style={{ padding: '12px 16px', borderRadius: 'var(--radius-sm)', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-glass)', marginBottom: '24px' }}>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Layout / Design Description</span>
                <p style={{ fontSize: '0.85rem', marginTop: '6px', color: 'var(--text-main)', lineHeight: '1.4' }}>{selectedUnit.layout_description}</p>
              </div>
            )}

            <div style={{ padding: '16px', borderRadius: 'var(--radius-sm)', background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.15)', marginBottom: '20px' }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Unit Price</span>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-primary)', marginTop: '4px' }}>{Number(selectedUnit.price).toLocaleString()} EGP</h3>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>~{Math.round(selectedUnit.price / selectedUnit.area).toLocaleString()} EGP/m²</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {selectedUnit.status.toLowerCase() === 'available' && (
                <button
                  className="btn-secondary"
                  disabled={offerLoading}
                  style={{ width: '100%', justifyContent: 'center', padding: '12px', display: 'flex', alignItems: 'center', gap: '6px', opacity: offerLoading ? 0.7 : 1 }}
                  onClick={() => generateOffer(selectedUnit.id)}
                  title="Generate a bilingual PDF offer brochure with compound details, layout & all payment plans"
                >
                  <FileText style={{ width: '14px', height: '14px' }} />
                  {offerLoading ? 'Generating offer…' : 'Generate Offer PDF'}
                </button>
              )}
              {selectedUnit.status.toLowerCase() === 'available' && (
                <button className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '14px' }} onClick={() => { setSelectedUnit(null); simulateRowLock(selectedUnit.id); }}>
                  <Lock style={{ width: '14px', height: '14px' }} />
                  Secure Row Lock & Reserve Unit
                </button>
              )}
              {canManage && (
                <button 
                  className="btn-secondary" 
                  style={{ width: '100%', justifyContent: 'center', padding: '12px', display: 'flex', alignItems: 'center', gap: '6px' }} 
                  onClick={() => {
                    setIsCreateMode(false);
                    setEditingUnitId(selectedUnit.id);
                    setUnitForm({
                      project_id: selectedUnit.project?.id || (projects[0]?.id || ''),
                      unit_number: selectedUnit.unit_number,
                      floor: selectedUnit.floor,
                      type: selectedUnit.type,
                      area: selectedUnit.area,
                      bedrooms: selectedUnit.bedrooms,
                      bathrooms: selectedUnit.bathrooms,
                      view_type: selectedUnit.view_type || '',
                      building: selectedUnit.building || '',
                      layout_description: selectedUnit.layout_description || '',
                      price: selectedUnit.price,
                      status: selectedUnit.status,
                      phase: selectedUnit.phase || 'Phase 1',
                      handover_date: selectedUnit.handover_date || ''
                    });
                    setSelectedUnit(null);
                    setShowFormModal(true);
                  }}
                >
                  <Edit style={{ width: '14px', height: '14px' }} />
                  Edit Unit Details
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit Form Modal */}
      {showFormModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px',
        }} onClick={() => setShowFormModal(false)}>
          <div className="glass-panel" style={{ maxWidth: '640px', width: '100%', padding: '32px', position: 'relative', maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <button onClick={() => setShowFormModal(false)} style={{
              position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none',
              color: 'var(--text-muted)', cursor: 'pointer', padding: '4px',
            }}>
              <X size={20} />
            </button>

            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '20px', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              {isCreateMode ? <Plus size={20} /> : <Edit size={20} />}
              {isCreateMode ? 'Create New Unit' : 'Edit Unit Details'}
            </h2>

            <form onSubmit={async (e) => {
              e.preventDefault();
              try {
                if (isCreateMode) {
                  await api.post('/v1/sales/company/units', unitForm);
                } else {
                  await api.put(`/v1/sales/company/units/${editingUnitId}`, unitForm);
                }
                setShowFormModal(false);
                fetchInventory();
              } catch (err: any) {
                alert(err.response?.data?.message || 'Operation failed');
              }
            }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                {isCreateMode && (
                  <div style={{ gridColumn: 'span 2' }}>
                    <label style={{ fontSize: '0.78rem', fontWeight: 600, display: 'block', marginBottom: '6px', color: 'var(--text-main)' }}>Project / Compound</label>
                    <select
                      className="form-control"
                      value={unitForm.project_id}
                      onChange={e => setUnitForm(prev => ({ ...prev, project_id: e.target.value }))}
                      required
                    >
                      <option value="">Select Project</option>
                      {projects.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, display: 'block', marginBottom: '6px', color: 'var(--text-main)' }}>Unit Number</label>
                  <input
                    type="text"
                    className="form-control"
                    value={unitForm.unit_number}
                    onChange={e => setUnitForm(prev => ({ ...prev, unit_number: e.target.value }))}
                    required
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, display: 'block', marginBottom: '6px', color: 'var(--text-main)' }}>Building / Block</label>
                  <input
                    type="text"
                    className="form-control"
                    value={unitForm.building}
                    onChange={e => setUnitForm(prev => ({ ...prev, building: e.target.value }))}
                    placeholder="e.g. Building B"
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, display: 'block', marginBottom: '6px', color: 'var(--text-main)' }}>Floor</label>
                  <input
                    type="number"
                    className="form-control"
                    value={unitForm.floor}
                    onChange={e => setUnitForm(prev => ({ ...prev, floor: parseInt(e.target.value) || 0 }))}
                    required
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, display: 'block', marginBottom: '6px', color: 'var(--text-main)' }}>Unit Type</label>
                  <select
                    className="form-control"
                    value={unitForm.type}
                    onChange={e => setUnitForm(prev => ({ ...prev, type: e.target.value }))}
                    required
                  >
                    <option value="apartment">Apartment</option>
                    <option value="villa">Villa</option>
                    <option value="commercial">Commercial</option>
                    <option value="office">Office</option>
                    <option value="duplex">Duplex</option>
                    <option value="penthouse">Penthouse</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, display: 'block', marginBottom: '6px', color: 'var(--text-main)' }}>Area (m²)</label>
                  <input
                    type="number"
                    className="form-control"
                    value={unitForm.area}
                    onChange={e => setUnitForm(prev => ({ ...prev, area: parseFloat(e.target.value) || 0 }))}
                    required
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, display: 'block', marginBottom: '6px', color: 'var(--text-main)' }}>Price (EGP)</label>
                  <input
                    type="number"
                    className="form-control"
                    value={unitForm.price}
                    onChange={e => setUnitForm(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                    required
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, display: 'block', marginBottom: '6px', color: 'var(--text-main)' }}>Bedrooms</label>
                  <input
                    type="number"
                    className="form-control"
                    value={unitForm.bedrooms}
                    onChange={e => setUnitForm(prev => ({ ...prev, bedrooms: parseInt(e.target.value) || 0 }))}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, display: 'block', marginBottom: '6px', color: 'var(--text-main)' }}>Bathrooms</label>
                  <input
                    type="number"
                    className="form-control"
                    value={unitForm.bathrooms}
                    onChange={e => setUnitForm(prev => ({ ...prev, bathrooms: parseInt(e.target.value) || 0 }))}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, display: 'block', marginBottom: '6px', color: 'var(--text-main)' }}>View Type</label>
                  <input
                    type="text"
                    className="form-control"
                    value={unitForm.view_type}
                    onChange={e => setUnitForm(prev => ({ ...prev, view_type: e.target.value }))}
                    placeholder="e.g. Garden, Pool, Sea"
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, display: 'block', marginBottom: '6px', color: 'var(--text-main)' }}>Handover Date</label>
                  <input
                    type="date"
                    className="form-control"
                    value={unitForm.handover_date}
                    onChange={e => setUnitForm(prev => ({ ...prev, handover_date: e.target.value }))}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, display: 'block', marginBottom: '6px', color: 'var(--text-main)' }}>Status</label>
                  <select
                    className="form-control"
                    value={unitForm.status}
                    onChange={e => setUnitForm(prev => ({ ...prev, status: e.target.value }))}
                    required
                  >
                    <option value="available">Available</option>
                    <option value="reserved">Reserved</option>
                    <option value="sold">Sold</option>
                    <option value="hidden">Hidden</option>
                    <option value="coming_soon">Coming Soon</option>
                    <option value="frozen">Frozen (مسقعة مؤقتاً)</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, display: 'block', marginBottom: '6px', color: 'var(--text-main)' }}>Phase</label>
                  <select
                    className="form-control"
                    value={unitForm.phase}
                    onChange={e => setUnitForm(prev => ({ ...prev, phase: e.target.value }))}
                    required
                  >
                    <option value="Phase 1">Phase 1</option>
                    <option value="Phase 2">Phase 2</option>
                    <option value="Phase 3">Phase 3</option>
                  </select>
                </div>

                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, display: 'block', marginBottom: '6px', color: 'var(--text-main)' }}>Layout Description</label>
                  <textarea
                    className="form-control"
                    value={unitForm.layout_description}
                    onChange={e => setUnitForm(prev => ({ ...prev, layout_description: e.target.value }))}
                    style={{ minHeight: '80px', fontFamily: 'inherit', fontSize: '0.85rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
                <button type="button" className="btn-secondary" onClick={() => setShowFormModal(false)} style={{ padding: '10px 20px', fontSize: '0.85rem' }}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" style={{ padding: '10px 24px', fontSize: '0.85rem' }}>
                  Save Unit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
