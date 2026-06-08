import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import {
  Search, User, Mail, Phone, ShieldCheck, TrendingUp, AlertTriangle, FileText,
  Calendar, CreditCard, Wrench, Shield, Download, MessageSquare, PhoneCall
} from 'lucide-react';

interface SearchResult {
  id: string; name: string; email: string; phone: string; type: 'lead' | 'client'; description: string;
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-md)',
  border: '1px solid var(--border-glass)', background: 'rgba(255,255,255,0.6)',
  fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-main)', outline: 'none',
  boxSizing: 'border-box',
};

const Customer360: React.FC = () => {
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<SearchResult | null>(null);
  const [profileData, setProfileData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  // Search autocomplete
  useEffect(() => {
    if (query.length < 2) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    const delayDebounce = setTimeout(async () => {
      try {
        const res = await api.get(`/v1/enterprise/customer360/search?query=${query}`);
        setSearchResults(res.data?.data || []);
        setShowDropdown(true);
      } catch (err) {
        console.error('Error searching directory:', err);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [query]);

  const selectCustomer = async (item: SearchResult) => {
    setSelectedCustomer(item);
    setQuery('');
    setSearchResults([]);
    setShowDropdown(false);
    
    setLoading(true);
    try {
      const res = await api.get(`/v1/enterprise/customer360/${item.id}?type=${item.type}`);
      setProfileData(res.data?.data || null);
    } catch (err) {
      console.error('Error fetching Customer 360 profile:', err);
    }
    setLoading(false);
  };

  // Compile timeline events from different models
  const getTimelineEvents = () => {
    if (!profileData) return [];

    const events: any[] = [];

    // 1. Interactions
    if (profileData.interactions) {
      profileData.interactions.forEach((item: any) => {
        events.push({
          type: 'interaction',
          title: `CRM Log: ${item.type.toUpperCase()}`,
          description: item.notes,
          date: new Date(item.created_at),
          icon: MessageSquare,
          color: '#3b82f6',
          meta: `Logged by: ${item.logger?.name || 'System'}`
        });
      });
    }

    // 2. VoIP Calls
    if (profileData.calls) {
      profileData.calls.forEach((item: any) => {
        events.push({
          type: 'call',
          title: `VoIP Call: ${item.direction.toUpperCase()}`,
          description: `Duration: ${Math.floor(item.duration_seconds / 60)}m ${item.duration_seconds % 60}s | Status: ${item.status}`,
          date: new Date(item.created_at),
          icon: PhoneCall,
          color: '#06b6d4',
          meta: item.recording_url ? `Recording available` : null
        });
      });
    }

    // 3. Reservations
    if (profileData.reservations) {
      profileData.reservations.forEach((item: any) => {
        events.push({
          type: 'reservation',
          title: 'Unit Reservation Recorded',
          description: `Unit ${item.unit?.unit_number} reserved in project ${item.unit?.project?.name}`,
          date: new Date(item.created_at),
          icon: Calendar,
          color: '#f59e0b',
          meta: `Status: ${item.status}`
        });
      });
    }

    // 4. Contracts & Payments
    if (profileData.contracts) {
      profileData.contracts.forEach((item: any) => {
        events.push({
          type: 'contract',
          title: `Contract Signed: ${item.contract_number}`,
          description: `Unit: ${item.unit?.unit_number} | Project: ${item.unit?.project?.name} | Value: ${Number(item.total_amount).toLocaleString()} EGP`,
          date: new Date(item.signed_at || item.created_at),
          icon: FileText,
          color: '#8b5cf6',
          meta: `Notes: ${item.notes || '—'}`
        });

        if (item.payments) {
          item.payments.forEach((pay: any) => {
            if (pay.status === 'paid') {
              events.push({
                type: 'payment',
                title: `Installment Paid: #${pay.installment_number}`,
                description: `Amount: ${Number(pay.amount).toLocaleString()} EGP paid via ${pay.gateway || 'Bank'} (Ref: ${pay.transaction_reference || '—'})`,
                date: new Date(pay.paid_at || pay.updated_at),
                icon: CreditCard,
                color: '#10b981',
                meta: `Due date was: ${new Date(pay.due_date).toLocaleDateString()}`
              });
            } else if (new Date(pay.due_date) < new Date() && pay.status === 'pending') {
              events.push({
                type: 'overdue',
                title: `Installment Overdue: #${pay.installment_number}`,
                description: `Overdue amount: ${Number(pay.amount).toLocaleString()} EGP`,
                date: new Date(pay.due_date),
                icon: AlertTriangle,
                color: '#ef4444',
                meta: 'Collections follow-up required'
              });
            }
          });
        }
      });
    }

    // 5. Maintenance Tickets
    if (profileData.maintenance) {
      profileData.maintenance.forEach((item: any) => {
        events.push({
          type: 'maintenance',
          title: `Maintenance Ticket: ${item.category}`,
          description: `Subject: ${item.title} | Details: ${item.description}`,
          date: new Date(item.created_at),
          icon: Wrench,
          color: '#f59e0b',
          meta: `Priority: ${item.priority} | Status: ${item.status}`
        });
      });
    }

    // 6. Documents Vault
    if (profileData.documents) {
      profileData.documents.forEach((item: any) => {
        events.push({
          type: 'document',
          title: `Document Uploaded: ${item.name}`,
          description: `Type: ${item.document_type || 'Exhibits'}`,
          date: new Date(item.created_at),
          icon: Download,
          color: '#6b7280',
          meta: 'Available in file vault'
        });
      });
    }

    // 7. Collections Queue
    if (profileData.collections) {
      profileData.collections.forEach((item: any) => {
        events.push({
          type: 'collections',
          title: `Collections Alert: ${item.status.toUpperCase()}`,
          description: `Outstanding amount: ${Number(item.outstanding_amount).toLocaleString()} EGP (Bucket: ${item.aging_bucket})`,
          date: new Date(item.created_at),
          icon: AlertTriangle,
          color: '#ef4444',
          meta: item.promise_to_pay_date ? `Promise to pay: ${new Date(item.promise_to_pay_date).toLocaleDateString()}` : null
        });
      });
    }

    // 8. Legal Cases
    if (profileData.legal_cases) {
      profileData.legal_cases.forEach((item: any) => {
        events.push({
          type: 'legal',
          title: `Legal Dispute: ${item.case_number}`,
          description: `Subject: ${item.title} | Court: ${item.court_name || '—'}`,
          date: new Date(item.opened_at || item.created_at),
          icon: Shield,
          color: '#e11d48',
          meta: `Case Status: ${item.status.toUpperCase()} | Priority: ${item.priority.toUpperCase()}`
        });
      });
    }

    // Sort by date descending
    return events.sort((a, b) => b.date.getTime() - a.date.getTime());
  };

  const timelineEvents = getTimelineEvents();

  const getKYCBadgeColor = (status: string) => {
    return status === 'verified' ? '#10b981' : status === 'pending' ? '#f59e0b' : '#ef4444';
  };

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 10 }}>
          <User size={24} color="var(--color-primary)" />
          📊 Customer 360 view
        </h1>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>
          Cross-reference leads, VoIP communications, contracts vault, collections history, and legal status in a single interface
        </p>
      </div>

      {/* Directory Search toolbar */}
      <div className="glass-panel" style={{ padding: '16px 20px', borderRadius: 'var(--radius-lg)', marginBottom: 20, position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Search size={18} color="var(--text-muted)" />
          <input
            style={{ ...inputStyle, border: 'none', background: 'transparent' }}
            placeholder="Search customer directory by name, email, or phone number..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            onFocus={() => query.length >= 2 && setShowDropdown(true)}
          />
        </div>

        {/* Autocomplete Dropdown */}
        {showDropdown && searchResults.length > 0 && (
          <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-md)', zIndex: 1000, boxShadow: '0 4px 20px rgba(0,0,0,0.15)', maxHeight: 280, overflowY: 'auto', marginTop: 6 }}>
            {searchResults.map(item => (
              <div 
                key={item.id} 
                onClick={() => selectCustomer(item)}
                style={{ padding: '12px 16px', borderBottom: '1px solid #f0f0f0', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'background 0.2s' }}
                onMouseEnter={e => (e.currentTarget.style.background = '#f9fafb')}
                onMouseLeave={e => (e.currentTarget.style.background = '#fff')}
              >
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 850, color: 'var(--text-main)' }}>{item.name}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{item.email} | {item.phone}</div>
                </div>
                <span style={{ fontSize: '0.65rem', fontWeight: 700, padding: '3px 8px', borderRadius: 999, background: item.type === 'client' ? 'rgba(59,130,246,0.1)' : 'rgba(16,185,129,0.1)', color: item.type === 'client' ? '#3b82f6' : '#10b981', textTransform: 'uppercase' }}>
                  {item.description}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {loading && <div className="glass-panel" style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', borderRadius: 'var(--radius-lg)' }}>Compiling Customer 360 profile...</div>}

      {!loading && !profileData && selectedCustomer && (
        <div className="glass-panel" style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', borderRadius: 'var(--radius-lg)' }}>Failed to load profile. Please try again.</div>
      )}

      {!loading && !selectedCustomer && (
        <div className="glass-panel" style={{ padding: 45, textAlign: 'center', color: 'var(--text-muted)', borderRadius: 'var(--radius-lg)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
          <User size={40} style={{ opacity: 0.4 }} />
          <div>Please search and select a lead or registered customer to resolve their 360 lifecycle profile.</div>
        </div>
      )}

      {!loading && profileData && selectedCustomer && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2.5fr', gap: 20 }}>
          
          {/* Left panel: Profile Info Card */}
          <div>
            <div className="glass-panel" style={{ padding: 20, borderRadius: 'var(--radius-lg)', position: 'sticky', top: '16px' }}>
              <div style={{ textAlign: 'center', marginBottom: 20, borderBottom: '1px solid var(--border-glass)', paddingBottom: 16 }}>
                <div style={{ width: 64, height: 64, borderRadius: 999, background: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', color: '#fff', fontSize: '1.5rem', fontWeight: 800 }}>
                  {selectedCustomer.name.charAt(0)}
                </div>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: 4 }}>{selectedCustomer.name}</h2>
                <span style={{ fontSize: '0.68rem', fontWeight: 700, padding: '3px 10px', borderRadius: 999, background: selectedCustomer.type === 'client' ? 'rgba(59,130,246,0.1)' : 'rgba(16,185,129,0.1)', color: selectedCustomer.type === 'client' ? '#3b82f6' : '#10b981', textTransform: 'uppercase' }}>
                  {selectedCustomer.type === 'client' ? 'Registered Customer' : 'Sales Pipeline Lead'}
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14, fontSize: '0.8rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Mail size={16} color="var(--text-muted)" />
                  <span style={{ color: 'var(--text-main)', wordBreak: 'break-all' }}>{selectedCustomer.email}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Phone size={16} color="var(--text-muted)" />
                  <span style={{ color: 'var(--text-main)' }}>{selectedCustomer.phone}</span>
                </div>

                {profileData.lead && (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-glass)', paddingTop: 12 }}>
                      <span style={{ color: 'var(--text-muted)' }}>Lead Score:</span>
                      <strong>{profileData.lead.lead_score} / 100</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)' }}>KYC Status:</span>
                      <span style={{ color: getKYCBadgeColor(profileData.lead.kyc_status), fontWeight: 700, textTransform: 'uppercase' }}>
                        {profileData.lead.kyc_status}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Marketing Source:</span>
                      <strong>{profileData.lead.source || 'Direct'}</strong>
                    </div>
                    {profileData.lead.campaign && (
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Campaign:</span>
                        <strong>{profileData.lead.campaign.name}</strong>
                      </div>
                    )}
                  </>
                )}

                {/* Warning flags */}
                {profileData.collections?.length > 0 && (
                  <div style={{ marginTop: 14, padding: 12, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <AlertTriangle size={18} color="#ef4444" />
                    <div>
                      <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#ef4444', textTransform: 'uppercase' }}>Warning: Debt Collections</div>
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-main)' }}>Pending payments in collections queue</div>
                    </div>
                  </div>
                )}
                {profileData.legal_cases?.length > 0 && (
                  <div style={{ padding: 12, background: 'rgba(225,29,72,0.08)', border: '1px solid rgba(225,29,72,0.3)', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Shield size={18} color="#e11d48" />
                    <div>
                      <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#e11d48', textTransform: 'uppercase' }}>Active Legal Dispute</div>
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-main)' }}>Lawsuit or active court session logged</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right panel: Timeline of Activities */}
          <div className="glass-panel" style={{ padding: 24, borderRadius: 'var(--radius-lg)' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: 20 }}>Chronological Activity Feed ({timelineEvents.length})</h3>

            {timelineEvents.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>No activities logged for this customer.</div>
            ) : (
              <div style={{ position: 'relative', paddingLeft: 24, borderLeft: '2px solid var(--border-glass)' }}>
                {timelineEvents.map((event, idx) => (
                  <div key={idx} style={{ position: 'relative', marginBottom: 24 }}>
                    {/* Timeline Node Point Icon */}
                    <div 
                      style={{ 
                        position: 'absolute', left: -36, top: 2, 
                        width: 24, height: 24, borderRadius: 9999, 
                        background: event.color, display: 'flex', 
                        alignItems: 'center', justifyContent: 'center',
                        color: '#fff', boxShadow: '0 0 10px rgba(0,0,0,0.1)'
                      }}
                    >
                      <event.icon size={12} />
                    </div>

                    {/* Timeline Card Content */}
                    <div className="glass-panel" style={{ padding: 14, borderRadius: 'var(--radius-md)', background: 'rgba(255,255,255,0.4)', border: '1px solid var(--border-glass)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 6, marginBottom: 4 }}>
                        <h4 style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-main)' }}>{event.title}</h4>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                          {event.date.toLocaleString()}
                        </span>
                      </div>
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-main)', margin: 0 }}>
                        {event.description}
                      </p>
                      {event.meta && (
                        <div style={{ marginTop: 6, fontSize: '0.68rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Info size={12} />
                          {event.meta}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
};

export default Customer360;
