import React, { useState, useEffect } from 'react';
import { Building2, Wallet, Lock, Unlock, TrendingUp, Filter, Search, DollarSign, BarChart3, Eye, X } from 'lucide-react';
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
  project?: { name: string; location: string };
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

  useEffect(() => {
    fetchInventory();
  }, []);

  useEffect(() => {
    let result = units;
    if (searchTerm) {
      result = result.filter(u => 
        u.unit_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.project?.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (filterStatus !== 'all') {
      result = result.filter(u => u.status === filterStatus);
    }
    if (filterType !== 'all') {
      result = result.filter(u => u.type === filterType);
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

  const getStatusBadge = (status: string) => {
    const map: Record<string, { class: string; label: string }> = {
      available: { class: 'badge-success', label: 'Available' },
      reserved: { class: 'badge-warning', label: 'Reserved' },
      sold: { class: 'badge-info', label: 'Sold' },
      blocked: { class: 'badge-danger', label: 'Blocked' },
    };
    const cfg = map[status] || { class: 'badge-info', label: status };
    return <span className={`badge ${cfg.class}`}>{cfg.label}</span>;
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
          <p style={{ fontSize: '0.85rem' }}>Unit catalog with transactional row locking, dynamic pricing & real-time availability</p>
        </div>
        <div style={{ padding: '6px 14px', background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 'var(--radius-sm)' }}>
          <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-primary)', letterSpacing: '0.05em' }}>MODULE: H.5</span>
        </div>
      </div>

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
            placeholder="Search units by number or project..."
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
        </select>
      </div>

      {/* Units Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '20px' }}>
        {filteredUnits.map(unit => (
          <div key={unit.id} className="glass-panel" style={{ padding: '0', overflow: 'hidden', cursor: 'pointer', position: 'relative' }} onClick={() => setSelectedUnit(unit)}>
            {/* Color Accent Top Bar */}
            <div style={{
              height: '4px',
              background: unit.status === 'available' ? 'var(--color-success)' : unit.status === 'reserved' ? 'var(--color-warning)' : unit.status === 'sold' ? 'var(--color-primary)' : 'var(--color-danger)',
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
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-glass)', paddingTop: '14px' }}>
                <div>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Price</span>
                  <h4 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--color-primary)' }}>{unit.price.toLocaleString()} EGP</h4>
                </div>
                {unit.status === 'available' && (
                  <button
                    className="btn-primary"
                    style={{ padding: '8px 18px', fontSize: '0.75rem' }}
                    onClick={(e) => { e.stopPropagation(); simulateRowLock(unit.id); }}
                  >
                    <Lock style={{ width: '12px', height: '12px' }} />
                    Reserve
                  </button>
                )}
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
                { label: 'View', value: selectedUnit.view_type },
                { label: 'Project', value: selectedUnit.project?.name || 'N/A' },
              ].map((item, i) => (
                <div key={i} style={{ padding: '12px 16px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-primary)', border: '1px solid var(--border-glass)' }}>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{item.label}</span>
                  <p style={{ fontWeight: 700, marginTop: '4px', color: 'var(--text-main)' }}>{item.value}</p>
                </div>
              ))}
            </div>

            <div style={{ padding: '16px', borderRadius: 'var(--radius-sm)', background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.15)', marginBottom: '20px' }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Unit Price</span>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-primary)', marginTop: '4px' }}>{selectedUnit.price.toLocaleString()} EGP</h3>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>~{(selectedUnit.price / selectedUnit.area).toLocaleString(undefined, { maximumFractionDigits: 0 })} EGP/m²</span>
            </div>

            {selectedUnit.status === 'available' && (
              <button className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '14px' }} onClick={() => { setSelectedUnit(null); simulateRowLock(selectedUnit.id); }}>
                <Lock style={{ width: '14px', height: '14px' }} />
                Secure Row Lock & Reserve Unit
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
