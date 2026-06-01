import React, { useState } from 'react';
import {
  Link2, Copy, Check, Users, DollarSign, Clock, TrendingUp,
  ExternalLink, Shield, ChevronDown, ChevronUp, Search,
  Award, ArrowUpRight, Wallet
} from 'lucide-react';

// ─────────────────────────────────────────────────────────
// REDP — Acquisition & Sales Engine (Developer 1: Ragab)
// Component: Broker Referral Links Generator Dashboard
// Shows referral links, active leads tracking, commissions.
// ─────────────────────────────────────────────────────────

interface BrokerLead {
  id: string;
  name: string;
  phone: string;
  status: string;
  lock_remaining_days: number;
  registered_at: string;
}

interface CommissionRecord {
  id: string;
  lead_name: string;
  unit_id: string;
  rate_percent: number;
  gross_amount: number;
  status: 'pending' | 'approved' | 'paid';
  created_at: string;
}

const MOCK_LEADS: BrokerLead[] = [
  { id: 'bl1', name: 'Mohamed El-Sayed', phone: '+20100112233', status: 'interested', lock_remaining_days: 67, registered_at: '2026-04-15' },
  { id: 'bl2', name: 'Fatima Abdallah', phone: '+20111223344', status: 'visit_scheduled', lock_remaining_days: 45, registered_at: '2026-04-28' },
  { id: 'bl3', name: 'Karim Nasser', phone: '+20122334455', status: 'negotiation', lock_remaining_days: 32, registered_at: '2026-05-10' },
  { id: 'bl4', name: 'Hoda Mostafa', phone: '+20133445566', status: 'reserved', lock_remaining_days: 78, registered_at: '2026-04-05' },
  { id: 'bl5', name: 'Ibrahim Saad', phone: '+20144556677', status: 'new', lock_remaining_days: 88, registered_at: '2026-05-25' },
];

const MOCK_COMMISSIONS: CommissionRecord[] = [
  { id: 'c1', lead_name: 'Hoda Mostafa', unit_id: 'A-204', rate_percent: 3.50, gross_amount: 175000, status: 'approved', created_at: '2026-05-20' },
  { id: 'c2', lead_name: 'Karim Nasser', unit_id: 'B-301', rate_percent: 3.00, gross_amount: 210000, status: 'pending', created_at: '2026-05-28' },
  { id: 'c3', lead_name: 'Old Client Alpha', unit_id: 'C-102', rate_percent: 2.50, gross_amount: 125000, status: 'paid', created_at: '2026-03-15' },
  { id: 'c4', lead_name: 'Old Client Beta', unit_id: 'D-405', rate_percent: 3.00, gross_amount: 150000, status: 'paid', created_at: '2026-02-20' },
];

const Brokers: React.FC = () => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [commissionFilter, setCommissionFilter] = useState<string>('all');

  const referralCode = 'BRK-X4F9M2KL';
  const referralUrl = `https://redp.com/register?ref=${referralCode}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const totalEarnings = MOCK_COMMISSIONS.reduce((acc, c) => acc + c.gross_amount, 0);
  const pendingAmount = MOCK_COMMISSIONS.filter(c => c.status === 'pending').reduce((acc, c) => acc + c.gross_amount, 0);
  const paidAmount = MOCK_COMMISSIONS.filter(c => c.status === 'paid').reduce((acc, c) => acc + c.gross_amount, 0);
  const approvedAmount = MOCK_COMMISSIONS.filter(c => c.status === 'approved').reduce((acc, c) => acc + c.gross_amount, 0);

  const filteredCommissions = MOCK_COMMISSIONS.filter(c =>
    commissionFilter === 'all' || c.status === commissionFilter
  );

  const filteredLeads = MOCK_LEADS.filter(l =>
    !searchTerm || l.name.toLowerCase().includes(searchTerm.toLowerCase()) || l.phone.includes(searchTerm)
  );

  const statusColor = (status: string) => {
    switch (status) {
      case 'pending': return { bg: 'rgba(245,158,11,0.15)', color: 'var(--color-warning)' };
      case 'approved': return { bg: 'rgba(59,130,246,0.15)', color: 'var(--color-primary)' };
      case 'paid': return { bg: 'rgba(16,185,129,0.15)', color: 'var(--color-success)' };
      default: return { bg: 'rgba(148,163,184,0.15)', color: 'var(--text-muted)' };
    }
  };

  const leadStatusColor = (status: string) => {
    switch (status) {
      case 'new': return '#3B82F6';
      case 'interested': return '#F59E0B';
      case 'visit_scheduled': return '#06B6D4';
      case 'negotiation': return '#F97316';
      case 'reserved': return '#10B981';
      default: return '#64748B';
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* ── Header ── */}
      <div className="glass-panel" style={{ padding: '28px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Award style={{ color: 'var(--color-warning)', width: '28px', height: '28px' }} />
            Broker Referral Dashboard
          </h1>
          <p style={{ fontSize: '0.85rem' }}>Manage referral links, track clients, and monitor commissions</p>
        </div>
        <div style={{ padding: '6px 14px', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 'var(--radius-sm)' }}>
          <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-warning)' }}>🟠 RAGAB — H.6 BROKER</span>
        </div>
      </div>

      {/* ── Referral Link Generator ── */}
      <div className="glass-panel" style={{ padding: '24px 28px', borderLeft: '4px solid var(--color-primary)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <Link2 style={{ color: 'var(--color-primary)', width: '20px', height: '20px' }} />
          <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Your Referral Link</h3>
          <span className="badge badge-success" style={{ fontSize: '0.6rem' }}>ACTIVE</span>
        </div>

        <div style={{
          display: 'flex', gap: '8px', alignItems: 'center',
          background: 'rgba(255, 255, 255, 0.45)', borderRadius: 'var(--radius-sm)',
          padding: '4px 4px 4px 16px', border: '1px solid var(--border-glass)',
        }}>
          <code style={{ flex: 1, fontSize: '0.82rem', color: 'var(--color-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {referralUrl}
          </code>
          <button
            onClick={handleCopyLink}
            className="btn-primary"
            style={{ padding: '10px 20px', fontSize: '0.8rem', whiteSpace: 'nowrap', borderRadius: '6px' }}
          >
            {copiedLink ? <><Check style={{ width: '14px', height: '14px' }} /> Copied!</> : <><Copy style={{ width: '14px', height: '14px' }} /> Copy Link</>}
          </button>
        </div>

        <div style={{ marginTop: '12px', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            <Shield style={{ width: '12px', height: '12px', display: 'inline', marginRight: '4px' }} />
            Code: <strong style={{ color: 'var(--text-main)' }}>{referralCode}</strong>
          </span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            <Users style={{ width: '12px', height: '12px', display: 'inline', marginRight: '4px' }} />
            Leads registered: <strong style={{ color: 'var(--text-main)' }}>{MOCK_LEADS.length}</strong>
          </span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            <Clock style={{ width: '12px', height: '12px', display: 'inline', marginRight: '4px' }} />
            Lock period: <strong style={{ color: 'var(--text-main)' }}>90 days</strong>
          </span>
        </div>
      </div>

      {/* ── Metrics Cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        {[
          { label: 'Total Earnings', value: `${(totalEarnings / 1000).toFixed(0)}K EGP`, icon: <Wallet />, color: 'var(--color-primary)', gradient: 'linear-gradient(135deg, rgba(59,130,246,0.15), rgba(59,130,246,0.05))' },
          { label: 'Pending', value: `${(pendingAmount / 1000).toFixed(0)}K EGP`, icon: <Clock />, color: 'var(--color-warning)', gradient: 'linear-gradient(135deg, rgba(245,158,11,0.15), rgba(245,158,11,0.05))' },
          { label: 'Approved', value: `${(approvedAmount / 1000).toFixed(0)}K EGP`, icon: <Check />, color: 'var(--color-primary)', gradient: 'linear-gradient(135deg, rgba(59,130,246,0.15), rgba(59,130,246,0.05))' },
          { label: 'Paid Out', value: `${(paidAmount / 1000).toFixed(0)}K EGP`, icon: <DollarSign />, color: 'var(--color-success)', gradient: 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(16,185,129,0.05))' },
        ].map((metric, i) => (
          <div key={i} className="glass-panel" style={{
            padding: '22px 24px', background: metric.gradient,
            borderTop: `3px solid ${metric.color}`,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <p style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>{metric.label}</p>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: metric.color }}>{metric.value}</div>
              </div>
              <div style={{ color: metric.color, opacity: 0.6 }}>{React.cloneElement(metric.icon, { style: { width: '24px', height: '24px' } })}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Active Leads Tracking ── */}
      <div className="glass-panel" style={{ padding: '24px 28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Users style={{ color: 'var(--color-primary)', width: '20px', height: '20px' }} />
            Active Leads ({filteredLeads.length})
          </h3>
          <div style={{ position: 'relative' }}>
            <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: '14px', height: '14px', color: 'var(--text-muted)' }} />
            <input
              type="text" className="form-control"
              placeholder="Search leads..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ paddingLeft: '34px', width: '200px', padding: '8px 12px 8px 34px', fontSize: '0.8rem' }}
            />
          </div>
        </div>

        <table className="premium-table">
          <thead>
            <tr>
              <th>Lead Name</th>
              <th>Phone</th>
              <th>Pipeline Status</th>
              <th>Lock Remaining</th>
              <th>Registered</th>
            </tr>
          </thead>
          <tbody>
            {filteredLeads.map(lead => (
              <tr key={lead.id}>
                <td><strong>{lead.name}</strong></td>
                <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{lead.phone}</td>
                <td>
                  <span style={{
                    display: 'inline-flex', padding: '4px 12px', borderRadius: '9999px',
                    fontSize: '0.7rem', fontWeight: 600,
                    background: leadStatusColor(lead.status) + '20',
                    color: leadStatusColor(lead.status),
                    textTransform: 'capitalize',
                  }}>
                    {lead.status.replace('_', ' ')}
                  </span>
                </td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                      width: '60px', height: '6px', borderRadius: '3px',
                      background: 'rgba(15, 23, 42, 0.5)', overflow: 'hidden',
                    }}>
                      <div style={{
                        width: `${(lead.lock_remaining_days / 90) * 100}%`,
                        height: '100%', borderRadius: '3px',
                        background: lead.lock_remaining_days > 30
                          ? 'var(--color-success)' : lead.lock_remaining_days > 14
                          ? 'var(--color-warning)' : 'var(--color-danger)',
                      }} />
                    </div>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>{lead.lock_remaining_days}d</span>
                  </div>
                </td>
                <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{lead.registered_at}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Commissions Table ── */}
      <div className="glass-panel" style={{ padding: '24px 28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <DollarSign style={{ color: 'var(--color-success)', width: '20px', height: '20px' }} />
            Commission History
          </h3>
          <div style={{ display: 'flex', gap: '6px' }}>
            {['all', 'pending', 'approved', 'paid'].map(filter => (
              <button
                key={filter}
                onClick={() => setCommissionFilter(filter)}
                style={{
                  padding: '6px 14px', borderRadius: '8px', fontSize: '0.72rem', fontWeight: 600,
                  cursor: 'pointer', textTransform: 'capitalize', transition: 'all 0.2s',
                  background: commissionFilter === filter ? 'var(--color-primary)' : 'rgba(255, 255, 255, 0.45)',
                  color: commissionFilter === filter ? '#fff' : 'var(--text-muted)',
                  border: `1px solid ${commissionFilter === filter ? 'var(--color-primary)' : 'var(--border-glass)'}`,
                }}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        <table className="premium-table">
          <thead>
            <tr>
              <th>Client</th>
              <th>Unit</th>
              <th>Rate</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {filteredCommissions.map(comm => {
              const sc = statusColor(comm.status);
              return (
                <tr key={comm.id}>
                  <td><strong>{comm.lead_name}</strong></td>
                  <td style={{ fontFamily: 'monospace', color: 'var(--color-primary)' }}>{comm.unit_id}</td>
                  <td>{comm.rate_percent}%</td>
                  <td style={{ fontWeight: 700 }}>{comm.gross_amount.toLocaleString()} EGP</td>
                  <td>
                    <span style={{
                      display: 'inline-flex', padding: '4px 12px', borderRadius: '9999px',
                      fontSize: '0.7rem', fontWeight: 600,
                      background: sc.bg, color: sc.color, textTransform: 'uppercase',
                    }}>
                      {comm.status}
                    </span>
                  </td>
                  <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{comm.created_at}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Brokers;
