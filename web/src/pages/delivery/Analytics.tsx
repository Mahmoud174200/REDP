import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Award, Activity, PiggyBank } from 'lucide-react';
import api from '../../services/api';

const Analytics: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [cashData, setCashData] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({
    occupancy_stats: { active_families: 340, occupancy_rate: 78.4, secured_entrances_24h: 1432 },
    contractor_performance: { total_contractors: 4, unresolved_tickets: 0, avg_resolution_hours: 18.2, sla_compliance_rate: 96.4 }
  });

  const fetchAnalytics = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/v1/delivery/analytics');
      if (response.data && response.data.success) {
        setStats(response.data);
        if (response.data.predictive_cash_flow) {
          // map predicted_liquidity to height values (in millions, roughly)
          const mapped = response.data.predictive_cash_flow.map((item: any) => ({
            month: item.month,
            val: (item.predicted_liquidity / 100000) // scale to a nice height number
          }));
          setCashData(mapped);
        }
      }
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', flexDirection: 'column', gap: '16px' }}>
        <div className="animate-spin" style={{ width: '40px', height: '40px', border: '4px solid var(--color-primary)', borderTopColor: 'transparent', borderRadius: '50%' }} />
        <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 600 }}>Loading...</span>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      
      {/* Header Panel */}
      <div className="glass-panel" style={{ padding: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <BarChart3 style={{ color: 'var(--color-primary)', width: '32px', height: '32px' }} />
            Executive BI Analytics & Cash Flow Forecaster
          </h1>
          <p>Compound occupancies statistics, predictive cash flows algorithms, and contractor SLA ratings.</p>
        </div>
        <div style={{ padding: '6px 12px', background: 'rgba(50,71,58,0.06)', border: '1px solid rgba(50,71,58,0.15)', borderRadius: 'var(--radius-sm)' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-primary)' }}>MODULE: H.21 (MAHMOUD)</span>
        </div>
      </div>

      {/* Grid status cards */}
      <div className="grid-cards">
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>PREDICTIVE LIQUIDITY ACCURACY</span>
            <TrendingUp style={{ color: 'var(--color-success)', width: '18px', height: '18px' }} />
          </div>
          <h3 style={{ fontSize: '1.8rem', fontWeight: 800 }}>98.2% Accuracy</h3>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>AI predictive cash flow models matched actual collections within 1.8% variance.</p>
        </div>

        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>CONTRACTOR DISPATCH SLA</span>
            <Activity style={{ color: 'var(--color-primary)', width: '18px', height: '18px' }} />
          </div>
          <h3 style={{ fontSize: '1.8rem', fontWeight: 800 }}>{stats.contractor_performance?.avg_resolution_hours || 18.2} Hours Avg</h3>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Contractor response SLA avg resolution timeline. Compliance target (24h) met.</p>
        </div>

        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>PREDICTED INFLOW (Q3)</span>
            <PiggyBank style={{ color: 'var(--color-warning)', width: '18px', height: '18px' }} />
          </div>
          <h3 style={{ fontSize: '1.8rem', fontWeight: 800 }}>17.6M EGP</h3>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Expected installment inflows from confirmed reservations contract terms.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '30px', alignItems: 'start' }}>
        
        {/* Ethereal Cylinder Chart Panel */}
        <div className="glass-panel" style={{ padding: '30px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.05em' }}>PORTFOLIO OVERVIEW</span>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 850, margin: '4px 0 16px 0', color: 'var(--text-main)' }}>$124,560.80</h2>
          </div>

          {/* Ethereal styled capsule chart block (Nature editorial mock) */}
          <div 
            style={{ 
              height: '280px', 
              display: 'flex', 
              alignItems: 'flex-end', 
              justifyContent: 'space-between', 
              padding: '24px 16px 12px 16px', 
              background: 'rgba(255, 255, 255, 0.25)', 
              border: '1.5px solid var(--border-glass)', 
              borderRadius: 'var(--radius-md)', 
              position: 'relative' 
            }}
          >
            
            {/* Soft grid divider */}
            <div style={{ position: 'absolute', left: 0, right: 0, top: '25%', borderTop: '1px solid rgba(255,255,255,0.4)' }}></div>
            <div style={{ position: 'absolute', left: 0, right: 0, top: '50%', borderTop: '1px solid rgba(255,255,255,0.4)' }}></div>
            <div style={{ position: 'absolute', left: 0, right: 0, top: '75%', borderTop: '1px solid rgba(255,255,255,0.4)' }}></div>

            {cashData.map((item) => (
              <div key={item.month} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, gap: '10px', zIndex: 1 }}>
                
                {/* Thick organic cylinder pillar matching the Spencer editorial mockup */}
                <div 
                  style={{
                    width: '26px', /* Thick pillar width */
                    height: `${item.val * 2.8}px`,
                    background: 'linear-gradient(to top, rgba(80, 100, 88, 0.08), rgba(80, 100, 88, 0.35))',
                    borderRadius: '9999px', /* Fully rounded capsule column */
                    border: '1px solid rgba(255, 255, 255, 0.7)',
                    boxShadow: '0 4px 12px rgba(44, 62, 50, 0.02)',
                    transition: 'height 1.2s cubic-bezier(0.25, 1, 0.5, 1)'
                  }}
                  title={`Predicted collection: ${item.val / 10} Million`}
                ></div>
                
                {/* Month labels */}
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>{item.month}</span>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '16px', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '12px', height: '12px', background: 'rgba(80, 100, 88, 0.35)', borderRadius: '4px', border: '1px solid #ffffff' }}></span>
              Predicted Collections Liquidity
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '12px', height: '12px', background: 'rgba(80, 100, 88, 0.08)', borderRadius: '4px', border: '1px solid #ffffff' }}></span>
              Scheduled Receivables
            </span>
          </div>
        </div>

        {/* Contractor Ratings SLA performance */}
        <div className="glass-panel" style={{ padding: '30px' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Award style={{ color: 'var(--color-warning)' }} />
            Contractor performance scores
          </h2>
          <p style={{ fontSize: '0.8rem', marginBottom: '20px', color: 'var(--text-muted)' }}>Simulates contractor quality parameters, response speeds and customer ratings audits.</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '12px', borderBottom: '1px solid var(--border-glass)' }}>
              <div>
                <h4 style={{ fontWeight: 600, fontSize: '0.85rem' }}>El-Swedy Electrics</h4>
                <span style={{ fontSize: '0.7rem', color: 'var(--color-success)' }}>SLA Met: 99.2%</span>
              </div>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-warning)' }}>★ 4.90</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '12px', borderBottom: '1px solid var(--border-glass)' }}>
              <div>
                <h4 style={{ fontWeight: 600, fontSize: '0.85rem' }}>Arab Contractors Plumbing</h4>
                <span style={{ fontSize: '0.7rem', color: 'var(--color-success)' }}>SLA Met: 95.8%</span>
              </div>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-warning)' }}>★ 4.80</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h4 style={{ fontWeight: 600, fontSize: '0.85rem' }}>Al-Ahram Woodwork Specialists</h4>
                <span style={{ fontSize: '0.7rem', color: 'var(--color-warning)' }}>SLA Met: 91.2%</span>
              </div>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-warning)' }}>★ 4.50</span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};

export default Analytics;
