import React, { useState, useEffect } from 'react';
import {
  Link2, Copy, Check, Users, DollarSign, Clock,
  Shield, Search, Award, Wallet
} from 'lucide-react';
import api from '../../services/api';

interface Broker {
  id: string;
  agency_name: string;
  agent_name: string;
  email: string;
  phone: string;
  referral_code: string;
  status: string;
}

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

const Brokers: React.FC = () => {
  const [brokers, setBrokers] = useState<Broker[]>([]);
  const [selectedBrokerId, setSelectedBrokerId] = useState<string>('');
  const [referralUrl, setReferralUrl] = useState<string>('');
  const [referralCode, setReferralCode] = useState<string>('');
  const [leads, setLeads] = useState<BrokerLead[]>([]);
  const [commissions, setCommissions] = useState<CommissionRecord[]>([]);
  
  // Metrics
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [pendingAmount, setPendingAmount] = useState(0);
  const [approvedAmount, setApprovedAmount] = useState(0);
  const [paidAmount, setPaidAmount] = useState(0);

  const [copiedLink, setCopiedLink] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [commissionFilter, setCommissionFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);

  // New Broker Form
  const [agencyName, setAgencyName] = useState('');
  const [agentName, setAgentName] = useState('');
  const [brokerEmail, setBrokerEmail] = useState('');
  const [brokerPhone, setBrokerPhone] = useState('');
  const [brokerLicense, setBrokerLicense] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  const fetchBrokers = async () => {
    try {
      const res = await api.get('/v1/acquisition/brokers');
      if (res.data && res.data.success) {
        const list = res.data.data || [];
        setBrokers(list);
        if (list.length > 0 && !selectedBrokerId) {
          setSelectedBrokerId(list[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to fetch brokers list:', err);
    }
  };

  const fetchBrokerDetails = async (brokerId: string) => {
    setIsLoading(true);
    try {
      // 1. Referral Link & code
      const refRes = await api.get(`/v1/acquisition/brokers/${brokerId}/referral-links`);
      if (refRes.data && refRes.data.success) {
        setReferralUrl(refRes.data.referral_url || '');
        setReferralCode(refRes.data.referral_code || '');
      }

      // 2. Leads registered under broker
      const leadsRes = await api.get(`/v1/acquisition/brokers/${brokerId}/leads`);
      if (leadsRes.data && leadsRes.data.success) {
        const fetchedLeads = leadsRes.data.leads?.data || [];
        const mappedLeads = fetchedLeads.map((l: any) => {
          // calculate lock days remaining (90 days total lock)
          let remainingDays = 90;
          if (l.lead_locks && l.lead_locks.length > 0) {
            const until = new Date(l.lead_locks[0].locked_until);
            const diffTime = until.getTime() - new Date().getTime();
            remainingDays = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
          }
          return {
            id: l.id,
            name: `${l.first_name || ''} ${l.last_name || ''}`.trim() || 'N/A',
            phone: l.phone,
            status: l.status,
            lock_remaining_days: remainingDays,
            registered_at: l.created_at ? l.created_at.substring(0, 10) : 'N/A'
          };
        });
        setLeads(mappedLeads);
      }

      // 3. Commissions
      const commsRes = await api.get(`/v1/acquisition/brokers/${brokerId}/commissions`);
      if (commsRes.data && commsRes.data.success) {
        const fetchedComms = commsRes.data.commissions?.data || [];
        const mappedComms = fetchedComms.map((c: any) => ({
          id: c.id,
          lead_name: c.lead ? `${c.lead.first_name || ''} ${c.lead.last_name || ''}`.trim() : 'N/A',
          unit_id: c.unit_id ? 'Reserved Unit' : 'N/A',
          rate_percent: parseFloat(c.rate_percent) || 0,
          gross_amount: parseFloat(c.gross_amount) || 0,
          status: c.status,
          created_at: c.created_at ? c.created_at.substring(0, 10) : 'N/A'
        }));
        setCommissions(mappedComms);

        // Update metrics
        const metrics = commsRes.data.metrics || {};
        setTotalEarnings(parseFloat(metrics.total_commissioned) || 0);
        setPendingAmount(parseFloat(metrics.pending_amount) || 0);
        setApprovedAmount(parseFloat(metrics.approved_amount) || 0);
        setPaidAmount(parseFloat(metrics.paid_amount) || 0);
      }
    } catch (err) {
      console.error('Failed to fetch broker details:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBrokers();
  }, []);

  useEffect(() => {
    if (selectedBrokerId) {
      fetchBrokerDetails(selectedBrokerId);
    } else {
      setIsLoading(false);
    }
  }, [selectedBrokerId]);

  const handleCopyLink = () => {
    if (!referralUrl) return;
    navigator.clipboard.writeText(referralUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleRegisterBroker = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agencyName || !agentName || !brokerPhone) return;

    try {
      setIsLoading(true);
      const res = await api.post('/v1/acquisition/brokers/register', {
        agency_name: agencyName,
        agent_name: agentName,
        email: brokerEmail || undefined,
        phone: brokerPhone,
        license_no: brokerLicense || undefined
      });
      if (res.data && res.data.success) {
        alert('Broker agency registered successfully! Note: Seeded/Admin must approve status to activate.');
        setAgencyName('');
        setAgentName('');
        setBrokerEmail('');
        setBrokerPhone('');
        setBrokerLicense('');
        setShowAddForm(false);
        await fetchBrokers();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to register broker.');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredCommissions = commissions.filter(c =>
    commissionFilter === 'all' || c.status === commissionFilter
  );

  const filteredLeads = leads.filter(l =>
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
      case 'contracted': return '#6366F1';
      default: return '#64748B';
    }
  };

  if (isLoading && brokers.length === 0) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', flexDirection: 'column', gap: '16px' }}>
        <div className="animate-spin" style={{ width: '40px', height: '40px', border: '4px solid var(--color-primary)', borderTopColor: 'transparent', borderRadius: '50%' }} />
        <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 600 }}>Loading...</span>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', position: 'relative' }}>
      {isLoading && (
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(255, 255, 255, 0.4)', backdropFilter: 'blur(2px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50
        }}>
          <div className="animate-spin" style={{ width: '32px', height: '32px', border: '3px solid var(--color-primary)', borderTopColor: 'transparent', borderRadius: '50%' }} />
        </div>
      )}

      {/* ── Header ── */}
      <div className="glass-panel" style={{ padding: '28px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Award style={{ color: 'var(--color-warning)', width: '28px', height: '28px' }} />
            Broker Referral Dashboard
          </h1>
          <p style={{ fontSize: '0.85rem' }}>Manage referral links, track clients, and monitor commissions</p>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {brokers.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>Agency:</span>
              <select
                value={selectedBrokerId}
                onChange={(e) => setSelectedBrokerId(e.target.value)}
                className="form-control"
                style={{ padding: '8px 16px', fontSize: '0.85rem', width: '200px', cursor: 'pointer' }}
              >
                {brokers.map(b => (
                  <option key={b.id} value={b.id}>{b.agency_name} ({b.agent_name})</option>
                ))}
              </select>
            </div>
          )}
          <button 
            onClick={() => setShowAddForm(!showAddForm)}
            className="btn-secondary"
            style={{ padding: '8px 16px', fontSize: '0.85rem' }}
          >
            {showAddForm ? 'Cancel' : 'Register Broker'}
          </button>
          <div style={{ padding: '6px 14px', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 'var(--radius-sm)' }}>
            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-warning)' }}>H.6 BROKER</span>
          </div>
        </div>
      </div>

      {/* ── Add Broker Form ── */}
      {showAddForm && (
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '16px' }}>Register New Broker Agency</h3>
          <form onSubmit={handleRegisterBroker} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Agency Name</label>
              <input type="text" className="form-control" value={agencyName} onChange={e => setAgencyName(e.target.value)} required placeholder="e.g. RE/MAX" />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Agent Name</label>
              <input type="text" className="form-control" value={agentName} onChange={e => setAgentName(e.target.value)} required placeholder="e.g. Ahmed Ali" />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Phone Number</label>
              <input type="text" className="form-control" value={brokerPhone} onChange={e => setBrokerPhone(e.target.value)} required placeholder="+20 10..." />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Email</label>
              <input type="email" className="form-control" value={brokerEmail} onChange={e => setBrokerEmail(e.target.value)} placeholder="agency@domain.com" />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">License Number</label>
              <input type="text" className="form-control" value={brokerLicense} onChange={e => setBrokerLicense(e.target.value)} placeholder="LIC-XXXXX" />
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <button type="submit" className="btn-primary" style={{ width: '100%', padding: '12px', justifyContent: 'center' }}>
                Submit Broker Agency
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── Referral Link Generator ── */}
      {selectedBrokerId && (
        <div className="glass-panel" style={{ padding: '24px 28px', borderLeft: '4px solid var(--color-primary)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <Link2 style={{ color: 'var(--color-primary)', width: '20px', height: '20px' }} />
            <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Active Referral Link</h3>
            <span className="badge badge-success" style={{ fontSize: '0.6rem' }}>ACTIVE</span>
          </div>

          <div style={{
            display: 'flex', gap: '8px', alignItems: 'center',
            background: 'rgba(255, 255, 255, 0.45)', borderRadius: 'var(--radius-sm)',
            padding: '4px 4px 4px 16px', border: '1px solid var(--border-glass)',
          }}>
            <code style={{ flex: 1, fontSize: '0.82rem', color: 'var(--color-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {referralUrl || 'Generating referral link...'}
            </code>
            <button
              onClick={handleCopyLink}
              className="btn-primary"
              style={{ padding: '10px 20px', fontSize: '0.8rem', whiteSpace: 'nowrap', borderRadius: '6px' }}
              disabled={!referralUrl}
            >
              {copiedLink ? <><Check style={{ width: '14px', height: '14px' }} /> Copied!</> : <><Copy style={{ width: '14px', height: '14px' }} /> Copy Link</>}
            </button>
          </div>

          <div style={{ marginTop: '12px', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              <Shield style={{ width: '12px', height: '12px', display: 'inline', marginRight: '4px' }} />
              Code: <strong style={{ color: 'var(--text-main)' }}>{referralCode || 'N/A'}</strong>
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              <Users style={{ width: '12px', height: '12px', display: 'inline', marginRight: '4px' }} />
              Leads registered: <strong style={{ color: 'var(--text-main)' }}>{leads.length}</strong>
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              <Clock style={{ width: '12px', height: '12px', display: 'inline', marginRight: '4px' }} />
              Lock period: <strong style={{ color: 'var(--text-main)' }}>90 days</strong>
            </span>
          </div>
        </div>
      )}

      {/* ── Metrics Cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        {[
          { label: 'Total Earnings', value: `${totalEarnings.toLocaleString()} EGP`, icon: <Wallet />, color: 'var(--color-primary)', gradient: 'linear-gradient(135deg, rgba(59,130,246,0.15), rgba(59,130,246,0.05))' },
          { label: 'Pending', value: `${pendingAmount.toLocaleString()} EGP`, icon: <Clock />, color: 'var(--color-warning)', gradient: 'linear-gradient(135deg, rgba(245,158,11,0.15), rgba(245,158,11,0.05))' },
          { label: 'Approved', value: `${approvedAmount.toLocaleString()} EGP`, icon: <Check />, color: 'var(--color-primary)', gradient: 'linear-gradient(135deg, rgba(59,130,246,0.15), rgba(59,130,246,0.05))' },
          { label: 'Paid Out', value: `${paidAmount.toLocaleString()} EGP`, icon: <DollarSign />, color: 'var(--color-success)', gradient: 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(16,185,129,0.05))' },
        ].map((metric, i) => (
          <div key={i} className="glass-panel" style={{
            padding: '22px 24px', background: metric.gradient,
            borderTop: `3px solid ${metric.color}`,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <p style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>{metric.label}</p>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: metric.color }}>{metric.value}</div>
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

        <div style={{ maxHeight: '350px', overflowY: 'auto' }} className="sidebar-scroll-container">
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
              {filteredLeads.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-muted)', fontStyle: 'italic', padding: '20px' }}>No active leads found for this broker agency.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
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

        <div style={{ maxHeight: '350px', overflowY: 'auto' }} className="sidebar-scroll-container">
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
              {filteredCommissions.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)', fontStyle: 'italic', padding: '20px' }}>No commissions matching the criteria.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Brokers;
