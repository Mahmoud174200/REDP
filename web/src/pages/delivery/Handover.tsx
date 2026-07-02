import React, { useState, useEffect } from 'react';
import { ShieldCheck, Lock, AlertTriangle, PenTool, CheckCircle, FileSignature, Calendar } from 'lucide-react';
import api from '../../services/api';

interface UnitData {
  id: string;
  unit_number: string;
  type: string;
  status: string;
}

interface ChecklistItem {
  id: string;
  item: string;
  passed: boolean;
}

interface SnagItem {
  id: string;
  item: string;
  desc: string;
  severity: string;
  date: string;
}

const Handover: React.FC = () => {
  const [units, setUnits] = useState<UnitData[]>([]);
  const [selectedUnitId, setSelectedUnitId] = useState<string>('');
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [snags, setSnags] = useState<SnagItem[]>([]);

  const [newSnagDesc, setNewSnagDesc] = useState('');
  const [newSnagSeverity, setNewSnagSeverity] = useState('medium');
  const [newSnagItem, setNewSnagItem] = useState('walls');

  const [signed, setSigned] = useState(false);
  const [signing, setSigning] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [unitDetails, setUnitDetails] = useState<any | null>(null);
  const [handoverDate, setHandoverDate] = useState<string>('');
  const [projectDeliveryDate, setProjectDeliveryDate] = useState<string>('');

  // Extended Handover States
  const [clientInfo, setClientInfo] = useState<any | null>(null);
  const [contractInfo, setContractInfo] = useState<any | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<any | null>(null);
  const [handoverReport, setHandoverReport] = useState<string>('');
  const [handoverImages, setHandoverImages] = useState<string[]>([]);
  const [handoverStatus, setHandoverStatus] = useState<string>('pending');
  const [isUploading, setIsUploading] = useState(false);
  const [isSavingReport, setIsSavingReport] = useState(false);

  const userStr = localStorage.getItem('redp_user');
  const user = userStr ? JSON.parse(userStr) : { role: 'handover_officer' };
  const canEditDates = user.role === 'admin' || user.role === 'handover_officer' || user.role === 'project_manager';

  const fetchUnits = async () => {
    try {
      const res = await api.get('/v1/finance/units');
      if (res.data && res.data.success) {
        setUnits(res.data.data);
        if (res.data.data.length > 0) {
          // Honor a ?unit=<id> deep-link (e.g. "Inspect" from the handover queue)
          // so the officer lands on the exact unit they intend to hand over —
          // not whichever unit happens to be first in the list.
          const params = new URLSearchParams(window.location.search);
          const requested = params.get('unit');
          const match = requested && res.data.data.find((u: UnitData) => u.id === requested);
          setSelectedUnitId(match ? requested! : res.data.data[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to fetch units:', err);
    }
  };

  const fetchChecklist = async (unitId: string) => {
    try {
      const res = await api.get(`/v1/delivery/units/${unitId}/checklist`);
      if (res.data && res.data.success) {
        const list = res.data.checklist.map((item: any) => ({
          id: item.id.replace('chk_', ''),
          item: item.item,
          passed: item.passed,
        }));
        setChecklist(list);

        const snagList = res.data.logged_snags.map((snag: any) => ({
          id: snag.id,
          item: snag.description.toLowerCase().includes('wall') ? 'Painting' : snag.description.toLowerCase().includes('plumb') ? 'Plumbing' : snag.description.toLowerCase().includes('elect') ? 'Electrical' : 'Doors & Windows',
          desc: snag.description,
          severity: snag.severity,
          date: snag.created_at ? snag.created_at.substring(0, 10) : 'N/A',
        }));
        setSnags(snagList);

        if (res.data.unit) {
          setUnitDetails(res.data.unit);
          setHandoverDate(res.data.unit.handover_date || '');
          setProjectDeliveryDate(res.data.unit.project_delivery_date || '');
          setHandoverReport(res.data.unit.handover_report || '');
          setHandoverImages(res.data.unit.handover_images || []);
          setHandoverStatus(res.data.unit.handover_status || 'pending');
          if (res.data.unit.handover_status === 'signed_off') {
            setSigned(true);
          } else {
            setSigned(false);
          }
        }
        
        setClientInfo(res.data.client || null);
        setContractInfo(res.data.contract || null);
        setPaymentStatus(res.data.payment_status || null);
      }
    } catch (err) {
      console.error('Failed to fetch checklist:', err);
    }
  };

  const handleUpdateHandoverDate = async () => {
    if (!selectedUnitId) return;
    try {
      const res = await api.put(`/v1/delivery/units/${selectedUnitId}/handover-date`, {
        handover_date: handoverDate || null
      });
      if (res.data && res.data.success) {
        alert('Unit handover date updated successfully!');
      }
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || 'Error updating handover date.');
    }
  };

  const handleUpdateProjectDeliveryDate = async () => {
    if (!unitDetails?.project_id) return;
    try {
      const res = await api.put(`/v1/delivery/projects/${unitDetails.project_id}/delivery-date`, {
        delivery_date: projectDeliveryDate || null
      });
      if (res.data && res.data.success) {
        alert('Project delivery date updated successfully!');
      }
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || 'Error updating project delivery date.');
    }
  };

  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      await fetchUnits();
      setIsLoading(false);
    };
    init();
  }, []);

  useEffect(() => {
    if (selectedUnitId) {
      fetchChecklist(selectedUnitId);
    }
  }, [selectedUnitId]);

  const handleAddSnag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSnagDesc || !selectedUnitId) {
      alert('Please select a unit.');
      return;
    }

    let categoryKeyword = '';
    if (newSnagItem === 'walls') categoryKeyword = 'wall/paint';
    else if (newSnagItem === 'plumbing') categoryKeyword = 'plumbing';
    else if (newSnagItem === 'electrical') categoryKeyword = 'electrical';
    else if (newSnagItem === 'locks') categoryKeyword = 'door/lock';

    const fullDescription = `[${categoryKeyword}] ${newSnagDesc}`;

    try {
      const res = await api.post('/v1/delivery/snag', {
        unit_id: selectedUnitId,
        description: fullDescription,
        severity: newSnagSeverity,
      });
      if (res.data && res.data.success) {
        alert(res.data.message);
        setNewSnagDesc('');
        fetchChecklist(selectedUnitId);
      }
    } catch (err: any) {
      console.error('Failed to log snag:', err);
      alert(err.response?.data?.message || 'Error logging snag.');
    }
  };

  const handleSaveReport = async () => {
    if (!selectedUnitId) return;
    setIsSavingReport(true);
    try {
      const res = await api.post(`/v1/delivery/units/${selectedUnitId}/report`, {
        report: handoverReport
      });
      if (res.data && res.data.success) {
        alert('Handover minutes draft saved successfully!');
        if (handoverStatus === 'pending') {
          setHandoverStatus('scheduled');
        }
      }
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || 'Error saving handover report.');
    } finally {
      setIsSavingReport(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0 || !selectedUnitId) return;
    
    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', fileList[0]);

    try {
      const res = await api.post(`/v1/delivery/units/${selectedUnitId}/images`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      if (res.data && res.data.success) {
        setHandoverImages(res.data.images);
        alert('Handover photo uploaded successfully!');
      }
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || 'Error uploading file.');
    } finally {
      setIsUploading(false);
    }
  };

  const simulateSignature = async () => {
    if (!selectedUnitId) {
      alert('Please select a unit.');
      return;
    }
    setSigning(true);
    try {
      const res = await api.post(`/v1/delivery/units/${selectedUnitId}/signoff`, {
        signature_data: 'Base64SignaturePathSampleData==',
      });
      if (res.data && res.data.success) {
        setSigned(true);
        setHandoverStatus('signed_off');
        alert('Handover sign-off certificate verified and sealed successfully!');
      }
    } catch (err: any) {
      console.error('Failed to sign off handover:', err);
      alert(err.response?.data?.message || 'Error processing sign-off.');
    } finally {
      setSigning(false);
    }
  };

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', flexDirection: 'column', gap: '16px' }}>
        <div className="animate-spin" style={{ width: '40px', height: '40px', border: '4px solid var(--color-success)', borderTopColor: 'transparent', borderRadius: '50%' }} />
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
            <ShieldCheck style={{ color: 'var(--color-success)', width: '32px', height: '32px' }} />
            Quality Control Handover Inspector & Snag Logger
          </h1>
          <p>Handover checklists, biometric defect records, and client digital signature confirmations.</p>
        </div>
        <div style={{ padding: '6px 12px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 'var(--radius-sm)' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-success)' }}>MODULE: H.17</span>
        </div>
      </div>

      {/* Unit Selector & Status Badge */}
      <div className="glass-panel" style={{ padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flex: 1 }}>
          <label className="form-label" style={{ marginBottom: 0, whiteSpace: 'nowrap', fontWeight: 700 }}>Select Unit for Handover Verification:</label>
          <select
            className="form-control"
            value={selectedUnitId}
            onChange={(e) => setSelectedUnitId(e.target.value)}
            style={{ maxWidth: '400px', fontSize: '0.85rem' }}
          >
            <option value="">-- Choose a Unit --</option>
            {units.map((unit) => (
              <option key={unit.id} value={unit.id}>
                {unit.unit_number} ({unit.type})
              </option>
            ))}
          </select>
        </div>
        {selectedUnitId && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Handover Status:</span>
            <span className={`badge badge-${handoverStatus === 'signed_off' ? 'success' : handoverStatus === 'scheduled' ? 'warning' : 'primary'}`} style={{ textTransform: 'uppercase', fontSize: '0.75rem', padding: '4px 10px' }}>
              {handoverStatus === 'signed_off' ? 'Signed Off / تم التسليم' : handoverStatus === 'scheduled' ? 'Scheduled / تم التجديد' : 'Pending / قيد المراجعة'}
            </span>
          </div>
        )}
      </div>

      {/* Customer, Property & Financial Verification Hub */}
      {selectedUnitId && clientInfo && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
          {/* Customer Profile */}
          <div className="glass-panel" style={{ padding: '24px', borderLeft: '4px solid var(--color-primary)' }}>
            <h3 style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              👤 Customer Profile (بيانات العميل)
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.8rem' }}>
              <div><span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Name:</span> <strong>{clientInfo.name}</strong></div>
              <div><span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Phone:</span> {clientInfo.phone}</div>
              <div><span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Email:</span> {clientInfo.email}</div>
              <div><span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>National ID:</span> {clientInfo.national_id}</div>
            </div>
          </div>

          {/* Property Details */}
          <div className="glass-panel" style={{ padding: '24px', borderLeft: '4px solid var(--color-secondary)' }}>
            <h3 style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              🏢 Property Specification (بيانات الوحدة)
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.8rem' }}>
              <div><span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Unit:</span> <strong>Unit {unitDetails?.number} ({unitDetails?.type})</strong></div>
              <div><span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Building & Floor:</span> Building {unitDetails?.building}, Floor {unitDetails?.floor}</div>
              <div><span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Area & Specs:</span> {unitDetails?.area} sqm | {unitDetails?.bedrooms} Bed | {unitDetails?.bathrooms} Bath</div>
              <div><span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>View:</span> <span style={{ textTransform: 'capitalize' }}>{unitDetails?.view_type}</span></div>
            </div>
          </div>

          {/* Contract & Financial Verification */}
          <div className="glass-panel" style={{ padding: '24px', borderLeft: `4px solid ${paymentStatus?.status === 'overdue' ? 'var(--color-danger)' : 'var(--color-success)'}` }}>
            <h3 style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              📄 Contract & Ledger (العقد وحالة السداد)
            </h3>
            {contractInfo && paymentStatus ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.8rem' }}>
                <div><span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Contract Number:</span> <strong>{contractInfo.contract_number}</strong></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span><span style={{ color: 'var(--text-muted)' }}>Price:</span> <strong>{paymentStatus.total_amount.toLocaleString()} EGP</strong></span>
                  <span><span style={{ color: 'var(--text-muted)' }}>Paid:</span> <strong style={{ color: 'var(--color-success)' }}>{paymentStatus.paid_amount.toLocaleString()} EGP</strong></span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span><span style={{ color: 'var(--text-muted)' }}>Outstanding:</span> <strong style={{ color: 'var(--color-warning)' }}>{paymentStatus.outstanding.toLocaleString()} EGP</strong></span>
                  <span className={`badge badge-${paymentStatus.status === 'overdue' ? 'danger' : 'success'}`} style={{ fontSize: '0.65rem', padding: '2px 6px' }}>
                    {paymentStatus.status === 'overdue' ? 'Overdue / متأخر' : 'Paid / منتظم'}
                  </span>
                </div>
                {paymentStatus.status === 'overdue' && (
                  <div style={{ fontSize: '0.7rem', color: 'var(--color-danger)', fontWeight: 700, background: 'rgba(239,68,68,0.08)', padding: '4px 8px', borderRadius: '4px', marginTop: '2px' }}>
                    ⚠️ Overdue: {paymentStatus.overdue_amount.toLocaleString()} EGP ({paymentStatus.overdue_count} installments)
                  </div>
                )}
              </div>
            ) : (
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>No contract details registered for this unit.</div>
            )}
          </div>
        </div>
      )}

      {/* Handover & Project Schedule Panel */}
      {unitDetails && (
        <div className="glass-panel" style={{ padding: '20px 24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
          <div>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 800, marginBottom: '12px', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Calendar size={18} color="var(--color-primary)" />
              Project Schedule Details (جدول المشروع)
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Project:</span> <strong>{unitDetails.project_name}</strong>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '4px' }}>Project Delivery Date (تسليم المشروع كامل)</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="date"
                    className="form-control"
                    style={{ fontSize: '0.85rem', padding: '6px 12px' }}
                    value={projectDeliveryDate.substring(0, 10)}
                    onChange={(e) => setProjectDeliveryDate(e.target.value)}
                    disabled={!canEditDates}
                  />
                  {canEditDates && (
                    <button onClick={handleUpdateProjectDeliveryDate} className="btn-primary" style={{ padding: '6px 14px', fontSize: '0.78rem', whiteSpace: 'nowrap' }}>
                      Update
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 800, marginBottom: '12px', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Calendar size={18} color="#10b981" />
              Unit Handover Schedule (جدول استلاف الشقة)
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Unit Number:</span> <strong>{unitDetails.number}</strong>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '4px' }}>Unit Handover Date (تسليم الشقة)</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="date"
                    className="form-control"
                    style={{ fontSize: '0.85rem', padding: '6px 12px' }}
                    value={handoverDate.substring(0, 10)}
                    onChange={(e) => setHandoverDate(e.target.value)}
                    disabled={!canEditDates}
                  />
                  {canEditDates && (
                    <button onClick={handleUpdateHandoverDate} className="btn-primary" style={{ padding: '6px 14px', fontSize: '0.78rem', whiteSpace: 'nowrap' }}>
                      Update
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '30px', alignItems: 'start' }}>
        
        {/* QC Checklist & Uploads */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
          
          {/* Inspection Checksheets */}
          <div className="glass-panel" style={{ padding: '30px' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <CheckCircle style={{ color: 'var(--color-success)' }} />
              Unit Inspection Checksheets (QC-A01)
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {checklist.map((item) => (
                <div 
                  key={item.id} 
                  className="glass-panel" 
                  style={{
                    padding: '18px 24px', 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    borderColor: item.passed ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'
                  }}
                >
                  <div>
                    <h4 style={{ fontWeight: 600, fontSize: '0.95rem', color: item.passed ? 'var(--text-main)' : 'var(--color-danger)' }}>{item.item}</h4>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Class Check ID: qc_{item.id}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button 
                      onClick={() => setChecklist(prev => prev.map(c => c.id === item.id ? { ...c, passed: true } : c))}
                      className="btn-secondary" 
                      style={{ padding: '6px 12px', fontSize: '0.75rem', borderColor: item.passed ? 'var(--color-success)' : 'var(--border-glass)', background: item.passed ? 'rgba(16,185,129,0.1)' : 'transparent' }}
                    >
                      Passed
                    </button>
                    <button 
                      onClick={() => setChecklist(prev => prev.map(c => c.id === item.id ? { ...c, passed: false } : c))}
                      className="btn-secondary" 
                      style={{ padding: '6px 12px', fontSize: '0.75rem', borderColor: !item.passed ? 'var(--color-danger)' : 'var(--border-glass)', background: !item.passed ? 'rgba(239,68,68,0.1)' : 'transparent' }}
                    >
                      Failed
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Upload Handover Pictures */}
          <div className="glass-panel" style={{ padding: '30px' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              📸 Upload Handover Pictures (رفع صور التسليم)
            </h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '16px' }}>Upload and save visual QC snag items or final unit key delivery photos.</p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* File Input */}
              <div style={{ border: '2px dashed var(--border-glass)', borderRadius: 'var(--radius-sm)', padding: '20px', textAlign: 'center', background: 'rgba(255,255,255,0.05)', position: 'relative' }}>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  style={{ opacity: 0, position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', cursor: 'pointer' }}
                  disabled={isUploading || signed}
                />
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-primary)' }}>
                  {isUploading ? 'Uploading Handover photo...' : '＋ Click to Choose or Drag Property Photo'}
                </span>
                <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px' }}>PNG, JPG or JPEG up to 10MB</span>
              </div>

              {/* Handover Image Gallery */}
              {handoverImages.length === 0 ? (
                <div style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)', padding: '10px' }}>No handover/inspection photos uploaded yet.</div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '10px' }}>
                  {handoverImages.map((imgUrl, idx) => (
                    <a key={idx} href={imgUrl} target="_blank" rel="noreferrer" style={{ width: '100%', height: '80px', borderRadius: '6px', border: '1px solid var(--border-glass)', overflow: 'hidden', display: 'block', position: 'relative' }}>
                      <img src={imgUrl} alt={`QC Handover ${idx}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Client Digital Signature */}
          <div className="glass-panel" style={{ padding: '24px', border: '1px dashed var(--border-glass)', background: 'rgba(59,130,246,0.02)' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <FileSignature style={{ color: 'var(--color-primary)' }} />
              Client Handover Sign-off Canvas
            </h3>
            <p style={{ fontSize: '0.8rem', marginBottom: '20px' }}>Digital sign-off locks keys receipt and confirms property acceptance.</p>

            {signed ? (
              <div style={{ padding: '20px', background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
                <span style={{ color: 'var(--color-success)', fontWeight: 700, fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <CheckCircle style={{ width: '18px', height: '18px' }} />
                  HANDOVER COMPLETED & SIGNED OFF
                </span>
                <p style={{ fontSize: '0.75rem', marginTop: '4px' }}>Timeline locked and keys receipt released.</p>
                {unitDetails?.handover_signature && (
                  <div style={{ fontSize: '0.65rem', fontFamily: 'monospace', color: 'var(--text-muted)', marginTop: '8px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    Signature Certificate: Sealed successfully.
                  </div>
                )}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* simulated canvas screen */}
                <div style={{ width: '100%', height: '120px', background: '#0b0f19', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                  {signing ? (
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Writing digital certificate key...</span>
                  ) : (
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontFamily: 'cursive' }}>Sign here / توقيع المستلم...</span>
                  )}
                  {signing && <div style={{ position: 'absolute', bottom: '10px', right: '10px', width: '10px', height: '10px', background: 'var(--color-primary)', borderRadius: '50%' }}></div>}
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button onClick={simulateSignature} className="btn-primary" style={{ flex: 1, justifyContent: 'center' }} disabled={signing}>
                    {signing ? 'Logging Sign-off...' : 'Sign Handover Certificate'}
                  </button>
                  <button onClick={() => setSigned(false)} className="btn-secondary" style={{ padding: '12px 18px' }}>Clear</button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
          
          {/* Handover Report / Minutes */}
          <div className="glass-panel" style={{ padding: '30px' }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              📝 Handover Minutes / Report (محضر الاستلام)
            </h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '16px' }}>Write or edit official inspection handover logs, keys transfer records, and QC resolutions.</p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <textarea
                className="form-control"
                style={{ height: '180px', resize: 'none', fontSize: '0.85rem' }}
                value={handoverReport}
                onChange={(e) => setHandoverReport(e.target.value)}
                placeholder="محضر استلام الوحدة السكنية: تم اليوم فحص الوحدة والتأكد من سلامة التشطيبات والمرافق وتسليم المفاتيح للمالك بدون ملاحظات..."
                disabled={signed}
              />
              {!signed && (
                <button
                  onClick={handleSaveReport}
                  className="btn-primary"
                  style={{ width: '100%', justifyContent: 'center', background: 'var(--color-primary)', borderColor: 'var(--color-primary)' }}
                  disabled={isSavingReport}
                >
                  {isSavingReport ? 'Saving report...' : 'Save Report Draft (حفظ المسودة)'}
                </button>
              )}
            </div>
          </div>

          {/* QC Defect Logger */}
          <div className="glass-panel" style={{ padding: '30px' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <AlertTriangle style={{ color: 'var(--color-danger)' }} />
              Log Quality Snag / Defect
            </h2>

            <form onSubmit={handleAddSnag} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Checksheet Category</label>
                <select className="form-control" value={newSnagItem} onChange={(e) => setNewSnagItem(e.target.value)}>
                  <option value="walls">Painting & Plastering</option>
                  <option value="plumbing">Plumbing Drainage</option>
                  <option value="electrical">Electrical Grid</option>
                  <option value="locks">Doors, Windows & Locks</option>
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Defect Description</label>
                <textarea 
                  className="form-control" 
                  style={{ height: '80px', resize: 'none' }}
                  value={newSnagDesc}
                  onChange={(e) => setNewSnagDesc(e.target.value)}
                  placeholder="e.g. Living room wall plaster has structural cracks near baseboard."
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Severity Level</label>
                <select className="form-control" value={newSnagSeverity} onChange={(e) => setNewSnagSeverity(e.target.value)}>
                  <option value="low">Low (Cosmetic check)</option>
                  <option value="medium">Medium (Standard repair)</option>
                  <option value="high">High (Delay hazard)</option>
                  <option value="critical">Critical (Quality failure)</option>
                </select>
              </div>

              <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={signed}>
                Log Snag Defect
              </button>
            </form>
          </div>

          {/* Active snags log */}
          <div className="glass-panel" style={{ padding: '30px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '16px' }}>Logged Unit Defects ({snags.length})</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {snags.map((snag) => (
                <div key={snag.id} className="glass-panel" style={{ padding: '16px', borderLeft: '4px solid var(--color-danger)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <h4 style={{ fontSize: '0.85rem', fontWeight: 700 }}>{snag.item} Snag</h4>
                    <span className={`badge ${snag.severity === 'high' ? 'badge-danger' : 'badge-warning'}`} style={{ fontSize: '0.6rem' }}>{snag.severity}</span>
                  </div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-main)' }}>{snag.desc}</p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                    <span>ID: {snag.id}</span>
                    <span>Date: {snag.date}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default Handover;
