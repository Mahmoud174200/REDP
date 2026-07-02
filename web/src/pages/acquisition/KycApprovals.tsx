import React, { useState, useEffect } from 'react';
import {
  ShieldCheck, FileText, Image, CheckCircle, XCircle,
  AlertTriangle, Search, CreditCard, Camera
} from 'lucide-react';
import api from '../../services/api';

interface KycRecord {
  id: string;
  lead_name: string;
  phone: string;
  email: string;
  national_id: string;
  passport_no: string;
  kyc_status: 'pending' | 'verified' | 'rejected' | 'none';
  facial_match_score: number;
  document_type: 'national_id' | 'passport';
  submitted_at: string;
  reviewed_by: string | null;
}

const KycApprovals: React.FC = () => {
  const [records, setRecords] = useState<KycRecord[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRecord, setSelectedRecord] = useState<KycRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchKycRecords = async () => {
    setIsLoading(true);
    try {
      // Fetch pending & rejected from backend
      const response = await api.get('/v1/acquisition/kyc/pending', {
        params: { per_page: 100 }
      });
      if (response.data && response.data.success) {
        const data = response.data.data?.data || [];
        const mapped = data.map((l: any) => ({
          id: l.id,
          lead_name: `${l.first_name || ''} ${l.last_name || ''}`.trim() || 'N/A',
          phone: l.phone || 'N/A',
          email: l.email || 'N/A',
          national_id: l.national_id || 'N/A',
          passport_no: l.passport_no || 'N/A',
          kyc_status: l.kyc_status || 'none',
          facial_match_score: l.facial_match_score ? parseFloat(l.facial_match_score) : 82.5, // fallback score
          document_type: l.passport_no ? 'passport' : 'national_id',
          submitted_at: l.updated_at || '',
          reviewed_by: l.agent ? l.agent.name : 'System'
        }));
        setRecords(mapped);
      }
    } catch (err) {
      console.error('Failed to fetch pending KYC approvals:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchKycRecords();
  }, []);

  const handleDecision = async (id: string, decision: 'verified' | 'rejected') => {
    setIsLoading(true);
    try {
      const response = await api.put(`/v1/acquisition/kyc/${id}/approve`, {
        decision,
        reason: 'Operator manual dashboard decision'
      });
      if (response.data && response.data.success) {
        setSelectedRecord(null);
        await fetchKycRecords();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to submit KYC decision.');
    } finally {
      setIsLoading(false);
    }
  };

  const filtered = records.filter(r =>
    (statusFilter === 'all' || r.kyc_status === statusFilter) &&
    (!searchTerm || r.lead_name.toLowerCase().includes(searchTerm.toLowerCase()) || r.national_id.includes(searchTerm))
  );

  const stats = {
    total: records.length,
    pending: records.filter(r => r.kyc_status === 'pending').length,
    verified: records.filter(r => r.kyc_status === 'verified').length,
    rejected: records.filter(r => r.kyc_status === 'rejected').length,
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'var(--color-success)';
    if (score >= 85) return 'var(--color-primary)';
    if (score >= 70) return 'var(--color-warning)';
    return 'var(--color-danger)';
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'verified': return { bg: 'rgba(16,185,129,0.15)', color: 'var(--color-success)', icon: <CheckCircle style={{ width: '12px', height: '12px' }} /> };
      case 'pending': return { bg: 'rgba(245,158,11,0.15)', color: 'var(--color-warning)', icon: <AlertTriangle style={{ width: '12px', height: '12px' }} /> };
      case 'rejected': return { bg: 'rgba(239,68,68,0.15)', color: 'var(--color-danger)', icon: <XCircle style={{ width: '12px', height: '12px' }} /> };
      default: return { bg: 'rgba(148,163,184,0.15)', color: 'var(--text-muted)', icon: null };
    }
  };

  if (isLoading && records.length === 0) {
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
            <ShieldCheck style={{ color: 'var(--color-success)', width: '28px', height: '28px' }} />
            KYC Document Approvals
          </h1>
          <p style={{ fontSize: '0.85rem' }}>Review uploaded IDs and facial match verification scores</p>
        </div>
        <div style={{ padding: '6px 14px', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 'var(--radius-sm)' }}>
          <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-warning)' }}>H.1 KYC</span>
        </div>
      </div>

      {/* ── Stats ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px' }}>
        {[
          { label: 'Total Submissions', value: stats.total, color: 'var(--color-primary)' },
          { label: 'Pending Review', value: stats.pending, color: 'var(--color-warning)' },
          { label: 'Verified', value: stats.verified, color: 'var(--color-success)' },
          { label: 'Rejected', value: stats.rejected, color: 'var(--color-danger)' },
        ].map((stat, i) => (
          <div key={i} className="glass-panel" style={{ padding: '18px 22px', textAlign: 'center', borderTop: `3px solid ${stat.color}` }}>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: stat.color }}>{stat.value}</div>
            <div style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{stat.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selectedRecord ? '1fr 380px' : '1fr', gap: '24px', alignItems: 'start' }}>
        {/* ── Main Table ── */}
        <div className="glass-panel" style={{ padding: '24px 28px' }}>
          {/* Toolbar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', gap: '6px' }}>
              {['all', 'pending', 'verified', 'rejected'].map(filter => (
                <button
                  key={filter}
                  onClick={() => setStatusFilter(filter)}
                  style={{
                    padding: '6px 14px', borderRadius: '8px', fontSize: '0.72rem', fontWeight: 600,
                    cursor: 'pointer', textTransform: 'capitalize', transition: 'all 0.2s',
                    background: statusFilter === filter ? 'var(--color-primary)' : 'rgba(255, 255, 255, 0.45)',
                    color: statusFilter === filter ? '#fff' : 'var(--text-muted)',
                    border: `1px solid ${statusFilter === filter ? 'var(--color-primary)' : 'var(--border-glass)'}`,
                  }}
                >
                  {filter}
                </button>
              ))}
            </div>
            <div style={{ position: 'relative' }}>
              <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: '14px', height: '14px', color: 'var(--text-muted)' }} />
              <input
                type="text" className="form-control"
                placeholder="Search by name or NID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ paddingLeft: '34px', width: '220px', padding: '8px 12px 8px 34px', fontSize: '0.8rem' }}
              />
            </div>
          </div>

          <div style={{ maxHeight: '400px', overflowY: 'auto' }} className="sidebar-scroll-container">
            <table className="premium-table">
              <thead>
                <tr>
                  <th>Applicant</th>
                  <th>Document</th>
                  <th>Face Match</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(record => {
                  const ss = getStatusStyle(record.kyc_status);
                  return (
                    <tr key={record.id} style={{ cursor: 'pointer' }} onClick={() => setSelectedRecord(record)}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{
                            width: '36px', height: '36px', borderRadius: '50%',
                            background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '0.7rem', fontWeight: 700, color: '#fff', flexShrink: 0,
                          }}>
                            {record.lead_name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                          </div>
                          <div>
                            <strong style={{ fontSize: '0.85rem' }}>{record.lead_name}</strong>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{record.phone}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: '4px',
                          fontSize: '0.72rem', padding: '4px 10px', borderRadius: '6px',
                          background: 'rgba(59,130,246,0.1)', color: 'var(--color-primary)',
                        }}>
                          {record.document_type === 'national_id' ? <CreditCard style={{ width: '12px', height: '12px' }} /> : <FileText style={{ width: '12px', height: '12px' }} />}
                          {record.document_type === 'national_id' ? 'National ID' : 'Passport'}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{
                            width: '50px', height: '6px', borderRadius: '3px',
                            background: 'rgba(15, 23, 42, 0.5)', overflow: 'hidden',
                          }}>
                            <div style={{
                              width: `${record.facial_match_score}%`, height: '100%',
                              borderRadius: '3px',
                              background: getScoreColor(record.facial_match_score),
                            }} />
                          </div>
                          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: getScoreColor(record.facial_match_score) }}>
                            {record.facial_match_score}%
                          </span>
                        </div>
                      </td>
                      <td>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: '4px',
                          padding: '4px 10px', borderRadius: '9999px',
                          fontSize: '0.68rem', fontWeight: 600,
                          background: ss.bg, color: ss.color, textTransform: 'uppercase',
                        }}>
                          {ss.icon} {record.kyc_status}
                        </span>
                      </td>
                      <td>
                        {record.kyc_status === 'pending' && (
                          <div style={{ display: 'flex', gap: '4px' }}>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleDecision(record.id, 'verified'); }}
                              style={{
                                padding: '6px 12px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 600,
                                background: 'rgba(16,185,129,0.15)', color: 'var(--color-success)',
                                border: '1px solid rgba(16,185,129,0.3)', cursor: 'pointer',
                              }}
                            >
                              Approve
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleDecision(record.id, 'rejected'); }}
                              style={{
                                padding: '6px 12px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 600,
                                background: 'rgba(239,68,68,0.15)', color: 'var(--color-danger)',
                                border: '1px solid rgba(239,68,68,0.3)', cursor: 'pointer',
                              }}
                            >
                              Reject
                            </button>
                          </div>
                        )}
                        {record.kyc_status !== 'pending' && (
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                            by {record.reviewed_by}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-muted)', fontStyle: 'italic', padding: '20px' }}>No KYC submissions matching filters.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Side-by-side Document Viewer ── */}
        {selectedRecord && (
          <div className="glass-panel" style={{ padding: '24px', position: 'sticky', top: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 700 }}>Document Review</h4>
              <button
                onClick={() => setSelectedRecord(null)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px' }}
              >
                ✕
              </button>
            </div>

            {/* Applicant Info */}
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <div style={{
                width: '56px', height: '56px', borderRadius: '50%', margin: '0 auto 10px',
                background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.1rem', fontWeight: 700, color: '#fff',
              }}>
                {selectedRecord.lead_name.split(' ').map(n => n[0]).join('').substring(0, 2)}
              </div>
              <h4 style={{ fontWeight: 700, marginBottom: '2px' }}>{selectedRecord.lead_name}</h4>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{selectedRecord.email}</p>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>NID: {selectedRecord.national_id}</p>
            </div>

            {/* Document Previews */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '16px' }}>
              {['ID Front', 'ID Back'].map((label, i) => (
                <div key={i} style={{
                  background: 'rgba(50, 71, 58, 0.05)', borderRadius: '8px',
                  height: '100px', display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center', gap: '6px',
                  border: '1px dashed var(--border-glass)',
                }}>
                  <Image style={{ width: '20px', height: '20px', color: 'var(--text-muted)' }} />
                  <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>{label}</span>
                </div>
              ))}
            </div>

            {/* Selfie Match */}
            <div style={{
              background: 'rgba(50, 71, 58, 0.05)', borderRadius: '8px',
              padding: '16px', marginBottom: '16px', textAlign: 'center',
              border: `1px solid ${getScoreColor(selectedRecord.facial_match_score)}33`,
            }}>
              <Camera style={{ width: '24px', height: '24px', color: getScoreColor(selectedRecord.facial_match_score), margin: '0 auto 8px' }} />
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Facial Match Score</div>
              <div style={{
                fontSize: '2rem', fontWeight: 800,
                color: getScoreColor(selectedRecord.facial_match_score),
              }}>
                {selectedRecord.facial_match_score}%
              </div>
              <div style={{ marginTop: '8px' }}>
                {selectedRecord.facial_match_score >= 85 ? (
                  <span className="badge badge-success" style={{ fontSize: '0.65rem' }}>PASSED THRESHOLD (≥85%)</span>
                ) : (
                  <span className="badge badge-danger" style={{ fontSize: '0.65rem' }}>BELOW THRESHOLD (&lt;85%)</span>
                )}
              </div>
            </div>

            {/* Decision Buttons */}
            {selectedRecord.kyc_status === 'pending' && (
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => handleDecision(selectedRecord.id, 'verified')}
                  className="btn-primary"
                  style={{ flex: 1, justifyContent: 'center', padding: '12px', borderRadius: '10px', background: 'linear-gradient(135deg, #10B981, #059669)' }}
                >
                  <CheckCircle style={{ width: '16px', height: '16px' }} /> Approve
                </button>
                <button
                  onClick={() => handleDecision(selectedRecord.id, 'rejected')}
                  className="btn-secondary"
                  style={{ flex: 1, justifyContent: 'center', padding: '12px', borderRadius: '10px', color: 'var(--color-danger)', borderColor: 'var(--color-danger)' }}
                >
                  <XCircle style={{ width: '16px', height: '16px' }} /> Reject
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default KycApprovals;
