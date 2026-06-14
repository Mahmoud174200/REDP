import React, { useState, useEffect } from 'react';
// Lucide-react imports removed as icons have been migrated to Font Awesome CDN icons
import api from '../../services/api';
import { ToastContainer } from '../../components/Toast';

/* helpers */
const statusLabel: Record<string, string> = {
  new: 'New', contacted: 'Contacted', interested: 'Interested',
  visit_scheduled: 'Visit Booked', transferred: 'Transferred',
};
const unitStatusBadge: Record<string, string> = {
  available: 'badge-success', reserved: 'badge-warning', sold: 'badge-danger', blocked: 'badge-info',
};
const fmtPrice = (v: number | string | null) => {
  if (!v) return '—';
  return Number(v).toLocaleString('en-EG') + ' EGP';
};

type ViewMode = 'dashboard' | 'project-detail';

const TeleSalesPortal: React.FC = () => {
  const [toasts, setToasts] = useState<{ id: string; message: string; type: 'success' | 'error' | 'info' }[]>([]);
  const showToast = (msg: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, message: msg, type }]);
  };
  const removeToast = (id: string) => setToasts(prev => prev.filter(t => t.id !== id));

  const [view, setView] = useState<ViewMode>('dashboard');
  const [activeTab, setActiveTab] = useState<'projects' | 'leads' | 'team'>('projects');
  const [stats, setStats] = useState<any>({ total_leads: 0, new_leads: 0, contacted: 0, meetings_scheduled: 0, transferred: 0 });
  const [leads, setLeads] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [projectDetail, setProjectDetail] = useState<any>(null);
  const [unitFilter, setUnitFilter] = useState<string>('all');
  const [selectedUnit, setSelectedUnit] = useState<any | null>(null);

  /* commissions & team states */
  const [commissionsHistory, setCommissionsHistory] = useState<any[]>([]);
  const [commissionRules, setCommissionRules] = useState<any[]>([]);
  const [subordinatesPerformance, setSubordinatesPerformance] = useState<any[]>([]);

  /* leads pagination & filtering */
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [totalLeads, setTotalLeads] = useState(0);
  const [perPage] = useState(10);
  const [searchVal, setSearchVal] = useState('');
  const [statusVal, setStatusVal] = useState('all');
  const [isLeadsLoading, setIsLeadsLoading] = useState(false);

  /* units pagination & filtering */
  const [unitSearchQuery, setUnitSearchQuery] = useState('');
  const [unitStatusFilter, setUnitStatusFilter] = useState('all');
  const [unitPage, setUnitPage] = useState(1);
  const unitsPerPage = 10;

  /* form */
  const [showForm, setShowForm] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [source, setSource] = useState('direct');
  const [notes, setNotes] = useState('');
  const [budget, setBudget] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('installment');
  const [interestedProjectId, setInterestedProjectId] = useState('');

  /* modals */
  const [selectedLead, setSelectedLead] = useState<any | null>(null);
  const [modalType, setModalType] = useState<'contact' | 'meeting' | 'transfer' | 'edit' | null>(null);
  const [contactType, setContactType] = useState('call');
  const [contactNotes, setContactNotes] = useState('');
  const [meetingDate, setMeetingDate] = useState('');
  const [meetingLocation, setMeetingLocation] = useState('Company HQ Office');
  const [meetingNotes, setMeetingNotes] = useState('');
  const [transferNotes, setTransferNotes] = useState('');

  /* edit form states */
  const [editFirstName, setEditFirstName] = useState('');
  const [editLastName, setEditLastName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editSource, setEditSource] = useState('direct');
  const [editBudget, setEditBudget] = useState('');
  const [editPaymentMethod, setEditPaymentMethod] = useState('installment');
  const [editInterestedProjectId, setEditInterestedProjectId] = useState('');

  const fetchLeads = async (pageToFetch = 1, search = '', status = 'all') => {
    setIsLeadsLoading(true);
    try {
      const params: any = {
        page: pageToFetch,
        per_page: perPage,
      };
      if (search.trim()) params.search = search.trim();
      if (status !== 'all') params.status = status;

      const res = await api.get('/v1/sales/tele/leads', { params });
      if (res.data?.success) {
        setLeads(res.data.data.data || []);
        setPage(res.data.data.current_page || 1);
        setLastPage(res.data.data.last_page || 1);
        setTotalLeads(res.data.data.total || 0);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLeadsLoading(false);
    }
  };

  const fetchPortalData = async () => {
    setIsLoading(true);
    try {
      const [statsRes, projectsRes] = await Promise.all([
        api.get('/v1/sales/tele/dashboard'),
        api.get('/v1/sales/tele/projects'),
      ]);
      if (statsRes.data?.success) {
        setStats(statsRes.data.stats);
        setCommissionsHistory(statsRes.data.commissions_history || []);
        setCommissionRules(statsRes.data.commission_rules || []);
        setSubordinatesPerformance(statsRes.data.subordinates_performance || []);
      }
      if (projectsRes.data?.success) setProjects(projectsRes.data.data || []);
    } catch (err) { console.error(err); } finally { setIsLoading(false); }
  };

  const fetchProjectDetail = async (projectId: string) => {
    try {
      setIsLoading(true);
      const res = await api.get(`/v1/sales/tele/projects/${projectId}`);
      if (res.data?.success) { setProjectDetail(res.data.data); setView('project-detail'); setUnitFilter('all'); }
    } catch (err) { showToast('Failed to load project.', 'error'); }
    finally { setIsLoading(false); }
  };

  useEffect(() => { fetchPortalData(); }, []);

  // Debounce search input and handle status updates for leads
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchLeads(1, searchVal, statusVal);
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [searchVal]);

  // Refetch when status changes
  useEffect(() => {
    fetchLeads(1, searchVal, statusVal);
  }, [statusVal]);

  // Reset unit pagination when filters change
  useEffect(() => {
    setUnitPage(1);
  }, [unitFilter, unitStatusFilter, unitSearchQuery]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= lastPage) {
      fetchLeads(newPage, searchVal, statusVal);
    }
  };

  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName || !lastName || !phone) return;
    try {
      setIsLoading(true);
      const res = await api.post('/v1/sales/tele/leads', {
        first_name: firstName, last_name: lastName, email: email || undefined,
        phone, source, notes, budget: budget ? parseFloat(budget) : undefined,
        payment_method: paymentMethod, interested_project_id: interestedProjectId || undefined,
      });
      if (res.data?.success) {
        setFirstName(''); setLastName(''); setEmail(''); setPhone(''); setNotes('');
        setBudget(''); setPaymentMethod('installment'); setInterestedProjectId('');
        setShowForm(false);
        await fetchPortalData();
        await fetchLeads(1, searchVal, statusVal);
        showToast('Lead added!', 'success');
      }
    } catch (err: any) { showToast(err.response?.data?.message || 'Failed.', 'error'); }
    finally { setIsLoading(false); }
  };

  const handleLogContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLead || !contactNotes) return;
    try {
      setIsLoading(true);
      await api.put(`/v1/sales/tele/leads/${selectedLead.id}/contact`, { type: contactType, notes: contactNotes });
      setContactNotes('');
      closeModal();
      await fetchPortalData();
      await fetchLeads(page, searchVal, statusVal);
      showToast('Contact logged.', 'success');
    }
    catch (err: any) { showToast(err.response?.data?.message || 'Failed.', 'error'); } finally { setIsLoading(false); }
  };

  const handleScheduleMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLead || !meetingDate) return;
    try {
      setIsLoading(true);
      await api.put(`/v1/sales/tele/leads/${selectedLead.id}/schedule-meeting`, { meeting_date: meetingDate, location: meetingLocation, notes: meetingNotes });
      setMeetingDate('');
      setMeetingNotes('');
      closeModal();
      await fetchPortalData();
      await fetchLeads(page, searchVal, statusVal);
      showToast('Meeting booked!', 'success');
    }
    catch (err: any) { showToast(err.response?.data?.message || 'Failed.', 'error'); } finally { setIsLoading(false); }
  };

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLead) return;
    try {
      setIsLoading(true);
      await api.put(`/v1/sales/tele/leads/${selectedLead.id}/transfer`, { notes: transferNotes });
      setTransferNotes('');
      closeModal();
      await fetchPortalData();
      await fetchLeads(page, searchVal, statusVal);
      showToast('Lead transferred.', 'success');
    }
    catch (err: any) { showToast(err.response?.data?.message || 'Failed.', 'error'); } finally { setIsLoading(false); }
  };

  const handleUpdateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLead || !editFirstName || !editLastName || !editPhone) return;
    try {
      setIsLoading(true);
      const res = await api.put(`/v1/sales/tele/leads/${selectedLead.id}`, {
        first_name: editFirstName,
        last_name: editLastName,
        email: editEmail || undefined,
        phone: editPhone,
        source: editSource,
        budget: editBudget ? parseFloat(editBudget) : undefined,
        payment_method: editPaymentMethod,
        interested_project_id: editInterestedProjectId || undefined,
      });
      if (res.data?.success) {
        closeModal();
        await fetchPortalData();
        await fetchLeads(page, searchVal, statusVal);
        showToast('Lead updated successfully!', 'success');
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to update lead.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const closeModal = () => {
    setModalType(null);
    setSelectedLead(null);
    setEditFirstName('');
    setEditLastName('');
    setEditEmail('');
    setEditPhone('');
    setEditSource('direct');
    setEditBudget('');
    setEditPaymentMethod('installment');
    setEditInterestedProjectId('');
  };

  if (isLoading && leads.length === 0 && projects.length === 0) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', flexDirection: 'column', gap: '16px' }}>
        <div className="animate-spin" style={{ width: '40px', height: '40px', border: '4px solid var(--color-secondary)', borderTopColor: 'var(--color-primary)', borderRadius: '50%' }} />
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontFamily: 'var(--font-title)' }}>Loading dashboard…</p>
      </div>
    );
  }

  /* ═══════════════ PROJECT DETAIL VIEW ═══════════════ */
  if (view === 'project-detail' && projectDetail) {
    const proj = projectDetail.project;
    const units = projectDetail.units || [];
    const unitsSummary = projectDetail.units_summary || [];
    const paymentPlans = projectDetail.payment_plans || [];
    const uniqueTypes = [...new Set(units.map((u: any) => u.type))] as string[];

    // Client-side filtration for units
    const processedUnits = units.filter((u: any) => {
      // 1. Filter by unit type
      if (unitFilter !== 'all' && u.type !== unitFilter) return false;

      // 2. Filter by unit status
      if (unitStatusFilter !== 'all' && u.status !== unitStatusFilter) return false;

      // 3. Filter by search query (unit number, view type, building)
      if (unitSearchQuery.trim()) {
        const query = unitSearchQuery.toLowerCase().trim();
        const numMatch = u.unit_number?.toString().toLowerCase().includes(query);
        const viewMatch = u.view_type?.toLowerCase().includes(query);
        const buildingMatch = u.building?.toLowerCase().includes(query);
        if (!numMatch && !viewMatch && !buildingMatch) return false;
      }

      return true;
    });

    // Client-side pagination for units
    const totalUnitsCount = processedUnits.length;
    const totalUnitsPages = Math.ceil(totalUnitsCount / unitsPerPage) || 1;
    const paginatedUnits = processedUnits.slice(
      (unitPage - 1) * unitsPerPage,
      unitPage * unitsPerPage
    );

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Back */}
        <button onClick={() => { setView('dashboard'); setProjectDetail(null); }}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, fontFamily: 'var(--font-title)', padding: 0 }}>
          <i className="fa-solid fa-arrow-left" style={{ fontSize: '0.9rem' }}></i> Back to Dashboard
        </button>

        {/* Project header */}
        <div className="glass-panel" style={{ padding: '28px 32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: '0 0 8px' }}>{proj.name}</h1>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><i className="fa-solid fa-location-dot" style={{ fontSize: '0.85rem' }}></i> {proj.location}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><i className="fa-regular fa-clock" style={{ fontSize: '0.85rem' }}></i> Delivery: {proj.delivery_date?.substring(0, 10) || 'TBD'}</span>
              </div>
            </div>
            <span className="badge badge-info" style={{ textTransform: 'uppercase' }}>{proj.status}</span>
          </div>
          {/* Quick stats row */}
          <div style={{ display: 'flex', gap: '32px', marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border-glass)' }}>
            {[
              { label: 'Total Units', value: proj.total_units, color: 'var(--color-primary)' },
              { label: 'Available', value: proj.available_units, color: 'var(--color-success)' },
              { label: 'Sold / Reserved', value: proj.total_units - proj.available_units, color: 'var(--color-danger)' },
            ].map(s => (
              <div key={s.label}>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: s.color, fontFamily: 'var(--font-title)' }}>{s.value}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Unit type summary cards */}
        <div>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'var(--font-title)' }}>
            <i className="fa-solid fa-layer-group" style={{ color: 'var(--color-primary)' }}></i> Unit Types
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(unitsSummary.length, 4)}, 1fr)`, gap: '16px' }}>
            {unitsSummary.map((us: any) => (
              <div key={us.type} className="glass-panel"
                onClick={() => setUnitFilter(unitFilter === us.type ? 'all' : us.type)}
                style={{
                  padding: '18px', cursor: 'pointer',
                  borderColor: unitFilter === us.type ? 'var(--color-primary)' : undefined,
                  background: unitFilter === us.type ? 'rgba(50, 71, 58, 0.06)' : undefined,
                }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.95rem', fontFamily: 'var(--font-title)' }}>{us.type}</span>
                  <span className="badge badge-info">{us.count} units</span>
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <i className="fa-solid fa-circle" style={{ color: 'var(--color-success)', fontSize: '0.55rem' }}></i>
                    <span><strong style={{ color: 'var(--color-success)' }}>{us.available}</strong> available</span>
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <i className="fa-solid fa-tags" style={{ fontSize: '0.75rem', width: '12px', display: 'inline-block', textAlign: 'center' }}></i>
                    <span>{fmtPrice(us.price_min)} – {fmtPrice(us.price_max)}</span>
                  </span>
                  {us.area_min && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <i className="fa-solid fa-ruler-combined" style={{ fontSize: '0.75rem', width: '12px', display: 'inline-block', textAlign: 'center' }}></i>
                      <span>{us.area_min}–{us.area_max} m²</span>
                    </span>
                  )}
                  {us.bedrooms_range?.length > 0 && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <i className="fa-solid fa-bed" style={{ fontSize: '0.75rem', width: '12px', display: 'inline-block', textAlign: 'center' }}></i>
                      <span>{us.bedrooms_range.join(', ')} bedrooms</span>
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Payment Plans */}
        <div>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'var(--font-title)' }}>
            <i className="fa-regular fa-credit-card" style={{ color: 'var(--color-success)' }}></i> Payment Plans — أنظمة السداد
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(paymentPlans.length, 4)}, 1fr)`, gap: '16px' }}>
            {paymentPlans.map((pp: any, idx: number) => {
              const accentColors = ['var(--color-primary)', 'var(--color-success)', 'var(--color-warning)', 'var(--color-danger)'];
              const accent = accentColors[idx % accentColors.length];
              return (
                <div key={idx} className="glass-panel" style={{ padding: '20px', borderLeft: `4px solid ${accent}` }}>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem', fontFamily: 'var(--font-title)', marginBottom: '2px' }}>{pp.name}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '14px' }}>{pp.name_ar}</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.82rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Down Payment</span>
                      <strong style={{ color: 'var(--text-main)' }}>{pp.down_payment_pct}%</strong>
                    </div>
                    {pp.installments > 0 && (
                      <>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: 'var(--text-muted)' }}>Installments</span>
                          <strong>{pp.installments} months</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: 'var(--text-muted)' }}>Monthly (avg)</span>
                          <strong style={{ color: 'var(--color-success)' }}>{fmtPrice(pp.monthly_amount)}</strong>
                        </div>
                      </>
                    )}
                    {pp.discount_pct > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Discount</span>
                        <strong style={{ color: 'var(--color-danger)' }}>{pp.discount_pct}% off</strong>
                      </div>
                    )}
                  </div>
                  <div style={{ marginTop: '12px', padding: '8px 12px', borderRadius: 'var(--radius-sm)', background: 'rgba(50, 71, 58, 0.04)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {pp.description}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Units table */}
        <div className="glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '18px 24px', display: 'flex', flexDirection: 'column', gap: '16px', borderBottom: '1px solid var(--border-glass)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'var(--font-title)' }}>
                <i className="fa-solid fa-table-cells" style={{ color: 'var(--color-primary)' }}></i>
                Units Inventory
                {unitFilter !== 'all' && <span className="badge badge-info" style={{ fontSize: '0.65rem' }}>{unitFilter}</span>}
              </h3>
              
              {/* Type Filter Buttons */}
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {['all', ...uniqueTypes].map(t => (
                  <button key={t} onClick={() => setUnitFilter(t)}
                    className={unitFilter === t ? 'btn-primary' : 'btn-secondary'}
                    style={{ padding: '6px 14px', fontSize: '0.72rem', borderRadius: '9999px' }}>
                    {t === 'all' ? 'All Types' : t}
                  </button>
                ))}
              </div>
            </div>

            {/* Sub-filtering bar for Units */}
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
              {/* Search Units */}
              <div style={{ position: 'relative', width: '220px' }}>
                <input
                  type="text"
                  placeholder="Search unit #, view, building..."
                  className="form-control"
                  style={{ padding: '6px 12px 6px 32px', fontSize: '0.78rem', height: '32px', borderRadius: 'var(--radius-sm)' }}
                  value={unitSearchQuery}
                  onChange={e => setUnitSearchQuery(e.target.value)}
                />
                <i className="fa-solid fa-magnifying-glass" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '0.75rem' }}></i>
              </div>

              {/* Status Select for Units */}
              <select
                className="form-control"
                style={{ width: '150px', padding: '6px 12px', fontSize: '0.78rem', height: '32px', borderRadius: 'var(--radius-sm)' }}
                value={unitStatusFilter}
                onChange={e => setUnitStatusFilter(e.target.value)}
              >
                <option value="all">All Statuses</option>
                <option value="available">Available</option>
                <option value="reserved">Reserved</option>
                <option value="sold">Sold</option>
                <option value="blocked">Blocked</option>
              </select>

              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Showing {totalUnitsCount} of {units.length} units
              </span>
            </div>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="premium-table">
              <thead>
                <tr>
                  {['Unit', 'Type', 'Floor', 'Area', 'Beds', 'Baths', 'View', 'Price', 'Status'].map(h => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginatedUnits.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                      No units matching the filters.
                    </td>
                  </tr>
                ) : paginatedUnits.map((u: any) => (
                  <tr key={u.id} onClick={() => setSelectedUnit(u)} style={{ cursor: 'pointer' }}>
                    <td><strong>{u.unit_number}</strong></td>
                    <td>{u.type}</td>
                    <td>{u.floor ?? '—'}</td>
                    <td>{u.area ? `${u.area} m²` : '—'}</td>
                    <td>{u.bedrooms ?? '—'}</td>
                    <td>{u.bathrooms ?? '—'}</td>
                    <td>{u.view_type ?? '—'}</td>
                    <td><strong style={{ color: 'var(--color-success)' }}>{fmtPrice(u.price)}</strong></td>
                    <td><span className={`badge ${unitStatusBadge[u.status] || 'badge-info'}`}>{u.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Local Pagination Controls for Units */}
          {totalUnitsCount > 0 && totalUnitsPages > 1 && (
            <div style={{ padding: '12px 24px', borderTop: '1px solid var(--border-glass)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Page <strong>{unitPage}</strong> of <strong>{totalUnitsPages}</strong>
              </span>
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                <button
                  className="btn-secondary"
                  style={{ padding: '4px 10px', fontSize: '0.72rem', borderRadius: 'var(--radius-sm)', height: '28px' }}
                  onClick={() => setUnitPage(prev => Math.max(prev - 1, 1))}
                  disabled={unitPage === 1}
                >
                  <i className="fa-solid fa-angle-left"></i> Prev
                </button>
                
                {Array.from({ length: totalUnitsPages }, (_, i) => i + 1)
                  .filter(p => p === 1 || p === totalUnitsPages || Math.abs(p - unitPage) <= 1)
                  .map((p, idx, arr) => {
                    const showEllipsis = idx > 0 && p - arr[idx - 1] > 1;
                    return (
                      <React.Fragment key={p}>
                        {showEllipsis && <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>...</span>}
                        <button
                          className={unitPage === p ? 'btn-primary' : 'btn-secondary'}
                          style={{
                            padding: '4px 8px',
                            fontSize: '0.72rem',
                            borderRadius: 'var(--radius-sm)',
                            minWidth: '28px',
                            height: '28px',
                            justifyContent: 'center',
                            boxShadow: 'none',
                            background: unitPage === p ? 'var(--color-primary)' : undefined,
                            color: unitPage === p ? '#ffffff' : undefined,
                          }}
                          onClick={() => setUnitPage(p)}
                        >
                          {p}
                        </button>
                      </React.Fragment>
                    );
                  })}

                <button
                  className="btn-secondary"
                  style={{ padding: '4px 10px', fontSize: '0.72rem', borderRadius: 'var(--radius-sm)', height: '28px' }}
                  onClick={() => setUnitPage(prev => Math.min(prev + 1, totalUnitsPages))}
                  disabled={unitPage === totalUnitsPages}
                >
                  Next <i className="fa-solid fa-angle-right"></i>
                </button>
              </div>
            </div>
          )}
        </div>

        <ToastContainer toasts={toasts} removeToast={removeToast} />
      </div>
    );
  }

  /* ═══════════════ MAIN DASHBOARD ═══════════════ */
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* Header */}
      <div className="glass-panel" style={{ padding: '24px 30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <i className="fa-solid fa-headset" style={{ color: 'var(--color-primary)' }}></i> Tele-Sales Dashboard
          </h1>
          <p style={{ margin: 0 }}>Browse compounds, manage leads & book viewings</p>
        </div>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)} style={{ gap: '8px' }}>
          <i className="fa-solid fa-plus" style={{ fontSize: '0.85rem' }}></i> New Lead
        </button>
      </div>

      {/* Quick stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px' }}>
        {[
          { label: 'My Leads', value: stats.total_leads, icon: <i className="fa-solid fa-users" style={{ color: 'var(--color-primary)', fontSize: '1.2rem' }}></i> },
          { label: 'New', value: stats.new_leads, icon: <i className="fa-solid fa-circle-plus" style={{ color: 'var(--color-warning)', fontSize: '1.2rem' }}></i> },
          { label: 'Contacted', value: stats.contacted, icon: <i className="fa-solid fa-phone" style={{ color: 'var(--color-info)', fontSize: '1.2rem' }}></i> },
          { label: 'Meetings', value: stats.meetings_scheduled, icon: <i className="fa-solid fa-calendar-days" style={{ color: 'var(--color-success)', fontSize: '1.2rem' }}></i> },
          { label: 'Transferred', value: stats.transferred, icon: <i className="fa-solid fa-right-left" style={{ color: 'var(--color-secondary)', fontSize: '1.2rem' }}></i> },
        ].map(s => (
          <div key={s.label} className="glass-panel" style={{ padding: '18px', textAlign: 'center' }}>
            <div style={{ marginBottom: '6px' }}>{s.icon}</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, fontFamily: 'var(--font-title)' }}>{s.value}</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Commissions & Rates Widget */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '16px' }}>
        {/* Left: Commissions Summary and History Ledger */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <i className="fa-solid fa-coins" style={{ color: 'var(--color-primary)' }}></i>
            My Commission Earnings
          </h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '20px' }}>
            <div style={{ background: 'rgba(245, 158, 11, 0.08)', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(245, 158, 11, 0.15)' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Pending</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-warning)', fontFamily: 'var(--font-title)', marginTop: '4px' }}>
                {fmtPrice(stats.pending_commission ?? 0)}
              </div>
            </div>
            <div style={{ background: 'rgba(16, 185, 129, 0.08)', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(16, 185, 129, 0.15)' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Approved</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-success)', fontFamily: 'var(--font-title)', marginTop: '4px' }}>
                {fmtPrice(stats.approved_commission ?? 0)}
              </div>
            </div>
            <div style={{ background: 'rgba(59, 130, 246, 0.08)', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(59, 130, 246, 0.15)' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Paid</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-primary)', fontFamily: 'var(--font-title)', marginTop: '4px' }}>
                {fmtPrice(stats.paid_commission ?? 0)}
              </div>
            </div>
          </div>

          <div>
            <h4 style={{ margin: '0 0 8px', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Recent Commission Calculations
            </h4>
            {commissionsHistory.length === 0 ? (
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0, padding: '12px', background: 'rgba(50, 71, 58, 0.02)', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
                No recent calculations logged.
              </p>
            ) : (
              <div style={{ maxHeight: '180px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {commissionsHistory.map((ch: any) => (
                  <div key={ch.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderRadius: 'var(--radius-sm)', background: 'rgba(50, 71, 58, 0.03)', border: '1px solid var(--border-glass)', fontSize: '0.8rem' }}>
                    <div>
                      <div style={{ fontWeight: 700 }}>Contract #{ch.contract?.contract_number || ch.contract_id?.substring(0, 8)}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                        Unit {ch.contract?.unit?.unit_number} • {ch.contract?.unit?.project?.name}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 800, color: 'var(--color-success)' }}>+{fmtPrice(ch.calculated_amount)}</div>
                      <span className={`badge ${ch.status === 'paid' ? 'badge-success' : ch.status === 'approved' ? 'badge-info' : 'badge-warning'}`} style={{ fontSize: '0.6rem', padding: '2px 6px', marginTop: '2px', display: 'inline-block' }}>
                        {ch.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Rates and Rules */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <i className="fa-solid fa-percent" style={{ color: 'var(--color-success)' }}></i>
            My Commission Rules
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {commissionRules.length === 0 ? (
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0, padding: '12px', background: 'rgba(50, 71, 58, 0.02)', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
                No active commission rules set.
              </p>
            ) : (
              commissionRules.map((cr: any) => (
                <div key={cr.id} style={{ padding: '12px 16px', borderRadius: 'var(--radius-sm)', background: 'rgba(50, 71, 58, 0.03)', border: '1px solid var(--border-glass)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                    <strong style={{ fontSize: '0.85rem' }}>{cr.name}</strong>
                    <span className="badge badge-success" style={{ fontSize: '0.72rem', fontWeight: 800 }}>
                      {parseFloat(cr.commission_rate).toFixed(2)}%
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {cr.description || `Rule applied to tier 1.`}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Add Lead Form (collapsible) */}
      {showForm && (
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <i className="fa-solid fa-plus" style={{ color: 'var(--color-primary)' }}></i> Capture New Lead
            </h3>
            <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
              <i className="fa-solid fa-xmark" style={{ fontSize: '1.1rem' }}></i>
            </button>
          </div>
          <form onSubmit={handleCreateLead} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">First Name *</label>
              <input type="text" className="form-control" value={firstName} onChange={e => setFirstName(e.target.value)} required />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Last Name *</label>
              <input type="text" className="form-control" value={lastName} onChange={e => setLastName(e.target.value)} required />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Phone *</label>
              <input type="text" className="form-control" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+20100..." required />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Email</label>
              <input type="email" className="form-control" value={email} onChange={e => setEmail(e.target.value)} placeholder="optional" />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Source</label>
              <select className="form-control" value={source} onChange={e => setSource(e.target.value)}>
                <option value="direct">Direct Walk-In</option><option value="facebook">Facebook Ads</option>
                <option value="google">Google Search</option><option value="tiktok">TikTok</option>
                <option value="referral">Referral</option>
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Payment Method</label>
              <select className="form-control" value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}>
                <option value="installment">Installment (أقساط)</option><option value="cash">Cash (كاش)</option>
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Budget (EGP)</label>
              <input type="number" className="form-control" value={budget} onChange={e => setBudget(e.target.value)} placeholder="e.g. 5000000" />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Interested Project</label>
              <select className="form-control" value={interestedProjectId} onChange={e => setInterestedProjectId(e.target.value)}>
                <option value="">-- Choose Project --</option>
                {projects.map((p: any) => (
                  <option key={p.id} value={p.id}>{p.name} {p.delivery_date ? `[${p.delivery_date.substring(0, 10)}]` : ''}</option>
                ))}
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 0, gridColumn: '1 / -1' }}>
              <label className="form-label">Initial Notes</label>
              <textarea className="form-control" style={{ height: '65px', resize: 'none' }} value={notes} onChange={e => setNotes(e.target.value)} placeholder="What is the customer looking for?" />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '13px' }}>
                Create Lead Profile
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tab Switcher */}
      <div style={{ display: 'flex', gap: '8px' }}>
        {[
          { key: 'projects' as const, label: 'Compounds & Projects', icon: 'fa-solid fa-building' },
          { key: 'leads' as const, label: 'My Leads', icon: 'fa-solid fa-users' },
          ...(subordinatesPerformance && subordinatesPerformance.length > 0 ? [
            { key: 'team' as const, label: 'Team Performance', icon: 'fa-solid fa-people-group' }
          ] : [])
        ].map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={activeTab === tab.key ? 'btn-primary' : 'btn-secondary'}
            style={{ flex: 1, justifyContent: 'center', padding: '12px', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <i className={tab.icon}></i> {tab.label}
          </button>
        ))}
      </div>

      {/* ── PROJECTS TAB ── */}
      {activeTab === 'projects' && (
        <div className="grid-cards" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(420px, 1fr))' }}>
          {projects.length === 0 ? (
            <div className="glass-panel" style={{ padding: '48px 20px', textAlign: 'center', gridColumn: '1 / -1' }}>
              <i className="fa-solid fa-building" style={{ fontSize: '2.5rem', color: 'var(--text-muted)', opacity: 0.3, display: 'block', margin: '0 auto 12px' }}></i>
              <p style={{ fontWeight: 600, color: 'var(--text-muted)' }}>No projects available</p>
            </div>
          ) : projects.map((proj: any) => (
            <div key={proj.id} className="glass-panel" onClick={() => fetchProjectDetail(proj.id)}
              style={{ padding: '22px', cursor: 'pointer' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <i className="fa-solid fa-building" style={{ color: 'var(--color-primary)', fontSize: '0.95rem' }}></i> {proj.name}
                  </h3>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><i className="fa-solid fa-location-dot" style={{ fontSize: '0.8rem' }}></i>{proj.location}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><i className="fa-regular fa-clock" style={{ fontSize: '0.8rem' }}></i>{proj.delivery_date?.substring(0, 10) || 'TBD'}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><i className="fa-solid fa-house" style={{ fontSize: '0.8rem' }}></i>{proj.total_units} units</span>
                  </div>
                </div>
                <i className="fa-solid fa-chevron-right" style={{ color: 'var(--text-muted)', flexShrink: 0 }}></i>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
                <span className="badge badge-success">{proj.available_units} available</span>
                {proj.unit_types?.map((t: string) => <span key={t} className="badge badge-info">{t}</span>)}
              </div>
              <div style={{ padding: '10px 14px', borderRadius: 'var(--radius-sm)', background: 'rgba(46, 125, 50, 0.05)', border: '1px solid rgba(46, 125, 50, 0.1)' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '2px' }}>Price Range</div>
                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--color-success)', fontFamily: 'var(--font-title)' }}>
                  {fmtPrice(proj.price_min)} — {fmtPrice(proj.price_max)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── LEADS TAB ── */}
      {activeTab === 'leads' && (
        <div className="glass-panel" style={{ padding: 0, overflow: 'hidden', position: 'relative' }}>
          {/* Leads Header & Filtering Bar */}
          <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--border-glass)', display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>📋 Leads Pipeline</h3>
            
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
              {/* Search input */}
              <div style={{ position: 'relative', width: '240px' }}>
                <input
                  type="text"
                  placeholder="Search name, phone, email..."
                  className="form-control"
                  style={{ padding: '8px 14px 8px 36px', fontSize: '0.82rem', height: '36px', borderRadius: 'var(--radius-sm)' }}
                  value={searchVal}
                  onChange={e => setSearchVal(e.target.value)}
                />
                <i className="fa-solid fa-magnifying-glass" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '0.8rem' }}></i>
              </div>

              {/* Status filter dropdown */}
              <select
                className="form-control"
                style={{ width: '160px', padding: '8px 12px', fontSize: '0.82rem', height: '36px', borderRadius: 'var(--radius-sm)' }}
                value={statusVal}
                onChange={e => setStatusVal(e.target.value)}
              >
                <option value="all">All Statuses</option>
                <option value="new">New</option>
                <option value="contacted">Contacted</option>
                <option value="visit_scheduled">Visit Booked</option>
                <option value="transferred">Transferred</option>
              </select>
              
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                {totalLeads} total
              </span>
            </div>
          </div>

          {/* Loading Indicator Overlay */}
          {isLeadsLoading && (
            <div style={{
              position: 'absolute',
              top: '72px',
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(255, 255, 255, 0.4)',
              backdropFilter: 'blur(2px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10
            }}>
              <div className="animate-spin" style={{ width: '30px', height: '30px', border: '3px solid var(--color-secondary)', borderTopColor: 'var(--color-primary)', borderRadius: '50%' }} />
            </div>
          )}

          {leads.length === 0 ? (
            <div style={{ padding: '48px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <i className="fa-solid fa-inbox" style={{ fontSize: '2.5rem', color: 'var(--text-muted)', opacity: 0.3, display: 'block', margin: '0 auto 12px' }}></i>
              <p style={{ fontWeight: 600, marginBottom: '4px' }}>No leads found</p>
              <p style={{ fontSize: '0.8rem' }}>Try clearing filters or search query</p>
            </div>
          ) : (
            <>
              <div style={{ overflowX: 'auto', opacity: isLeadsLoading ? 0.6 : 1, transition: 'opacity 0.2s' }}>
                <table className="premium-table">
                  <thead>
                    <tr>
                      <th>Customer</th>
                      <th>Contact</th>
                      <th>Project</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leads.map(lead => {
                      const st = lead.status || 'new';
                      const projName = (lead.interested_project || lead.interestedProject)?.name;
                      const badge = st === 'new' ? 'badge-warning' : st === 'visit_scheduled' ? 'badge-success' : 'badge-info';
                      return (
                        <tr key={lead.id}>
                          <td>
                            <strong>{lead.first_name} {lead.last_name}</strong>
                            {lead.budget && (
                              <div style={{ fontSize: '0.75rem', color: 'var(--color-success)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                                <i className="fa-solid fa-wallet" style={{ fontSize: '0.7rem' }}></i> {fmtPrice(lead.budget)}
                              </div>
                            )}
                          </td>
                          <td>
                            <div>{lead.phone}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{lead.email || '—'}</div>
                          </td>
                          <td>
                            {projName ? (
                              <span style={{ fontWeight: 600, color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <i className="fa-solid fa-building" style={{ fontSize: '0.75rem' }}></i> {projName}
                              </span>
                            ) : (
                              <span style={{ color: 'var(--text-muted)' }}>—</span>
                            )}
                          </td>
                          <td><span className={`badge ${badge}`}>{statusLabel[st] || st}</span></td>
                          <td>
                            <div style={{ display: 'flex', gap: '6px' }}>
                              <button className="btn-secondary" style={{ padding: '6px 10px', fontSize: '0.72rem' }}
                                title="Edit Lead"
                                onClick={() => {
                                  setSelectedLead(lead);
                                  setEditFirstName(lead.first_name || '');
                                  setEditLastName(lead.last_name || '');
                                  setEditEmail(lead.email || '');
                                  setEditPhone(lead.phone || '');
                                  setEditSource(lead.source || 'direct');
                                  setEditBudget(lead.budget ? lead.budget.toString() : '');
                                  setEditPaymentMethod(lead.payment_method || 'installment');
                                  setEditInterestedProjectId(lead.interested_project_id || lead.interestedProject?.id || '');
                                  setModalType('edit');
                                }}>
                                <i className="fa-solid fa-pen-to-square" style={{ fontSize: '0.75rem' }}></i>
                              </button>
                              <button className="btn-secondary" style={{ padding: '6px 12px', fontSize: '0.72rem' }}
                                onClick={() => { setSelectedLead(lead); setModalType('contact'); }}>
                                <i className="fa-solid fa-phone" style={{ fontSize: '0.75rem' }}></i> Contact
                              </button>
                              <button className="btn-secondary" style={{ padding: '6px 12px', fontSize: '0.72rem' }}
                                onClick={() => { setSelectedLead(lead); setModalType('meeting'); }}
                                disabled={st === 'visit_scheduled'}>
                                <i className="fa-regular fa-calendar" style={{ fontSize: '0.75rem' }}></i> Meet
                              </button>
                              <button className="btn-primary" style={{ padding: '6px 12px', fontSize: '0.72rem' }}
                                onClick={() => { setSelectedLead(lead); setModalType('transfer'); }}>
                                <i className="fa-solid fa-arrow-right" style={{ fontSize: '0.75rem' }}></i> Transfer
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls */}
              {totalLeads > 0 && lastPage > 1 && (
                <div style={{ padding: '14px 24px', borderTop: '1px solid var(--border-glass)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    Showing page <strong>{page}</strong> of <strong>{lastPage}</strong> ({totalLeads} leads total)
                  </span>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <button
                      className="btn-secondary"
                      style={{ padding: '6px 14px', fontSize: '0.75rem', borderRadius: 'var(--radius-sm)', height: '32px' }}
                      onClick={() => handlePageChange(page - 1)}
                      disabled={page === 1}
                    >
                      <i className="fa-solid fa-angle-left"></i> Previous
                    </button>
                    
                    {/* Page numbers */}
                    {Array.from({ length: lastPage }, (_, i) => i + 1)
                      .filter(p => p === 1 || p === lastPage || Math.abs(p - page) <= 1)
                      .map((p, idx, arr) => {
                        const showEllipsis = idx > 0 && p - arr[idx - 1] > 1;
                        return (
                          <React.Fragment key={p}>
                            {showEllipsis && <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>...</span>}
                            <button
                              className={page === p ? 'btn-primary' : 'btn-secondary'}
                              style={{
                                padding: '6px 12px',
                                fontSize: '0.75rem',
                                borderRadius: 'var(--radius-sm)',
                                minWidth: '32px',
                                height: '32px',
                                justifyContent: 'center',
                                boxShadow: 'none',
                                background: page === p ? 'var(--color-primary)' : undefined,
                                color: page === p ? '#ffffff' : undefined,
                              }}
                              onClick={() => handlePageChange(p)}
                            >
                              {p}
                            </button>
                          </React.Fragment>
                        );
                      })}

                    <button
                      className="btn-secondary"
                      style={{ padding: '6px 14px', fontSize: '0.75rem', borderRadius: 'var(--radius-sm)', height: '32px' }}
                      onClick={() => handlePageChange(page + 1)}
                      disabled={page === lastPage}
                    >
                      Next <i className="fa-solid fa-angle-right"></i>
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ── TEAM PERFORMANCE TAB ── */}
      {activeTab === 'team' && subordinatesPerformance && subordinatesPerformance.length > 0 && (
        <div className="glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--border-glass)' }}>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <i className="fa-solid fa-people-group" style={{ color: 'var(--color-primary)' }}></i>
              My Team's Performance & Commissions
            </h3>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="premium-table">
              <thead>
                <tr>
                  <th>Agent Name</th>
                  <th>Position</th>
                  <th>Team</th>
                  <th>Status</th>
                  <th>Total Leads</th>
                  <th>New / Contacted</th>
                  <th>Meetings Booked</th>
                  <th>Transferred</th>
                  <th>Commissions Earned</th>
                </tr>
              </thead>
              <tbody>
                {subordinatesPerformance.map((sub: any) => (
                  <tr key={sub.user_id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          backgroundColor: sub.status === 'active' ? 'var(--color-success)' : '#9ca3af',
                          display: 'inline-block'
                        }}></span>
                        <strong>{sub.name}</strong>
                      </div>
                    </td>
                    <td>{sub.position}</td>
                    <td>{sub.team}</td>
                    <td>
                      <span className={`badge ${sub.status === 'active' ? 'badge-success' : 'badge-secondary'}`}>
                        {sub.status}
                      </span>
                    </td>
                    <td>{sub.stats?.total_leads ?? 0}</td>
                    <td>{sub.stats?.new ?? 0} / {sub.stats?.contacted ?? 0}</td>
                    <td>{sub.stats?.meetings ?? 0}</td>
                    <td>{sub.stats?.transferred ?? 0}</td>
                    <td>
                      <strong style={{ color: 'var(--color-success)' }}>
                        {fmtPrice(sub.stats?.commissions_earned ?? 0)}
                      </strong>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ═══════ MODALS ═══════ */}
      {modalType && selectedLead && (
        <div className="modal-backdrop" onClick={closeModal}>
          <div className="glass-panel modal-content" style={{ width: '100%', maxWidth: modalType === 'edit' ? '540px' : '460px', padding: '28px' }}
            onClick={e => e.stopPropagation()}>

            {modalType === 'contact' && (
              <>
                <h3 style={{ fontWeight: 800, marginBottom: '16px' }}>📞 Log Contact: {selectedLead.first_name}</h3>
                <form onSubmit={handleLogContact} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Channel</label>
                    <select className="form-control" value={contactType} onChange={e => setContactType(e.target.value)}>
                      <option value="call">Phone Call</option><option value="whatsapp">WhatsApp</option><option value="email">Email</option>
                    </select>
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Notes</label>
                    <textarea className="form-control" value={contactNotes} onChange={e => setContactNotes(e.target.value)} placeholder="Conversation summary…" style={{ height: '100px' }} required />
                  </div>
                  <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                    <button type="button" className="btn-secondary" onClick={closeModal}>Cancel</button>
                    <button type="submit" className="btn-primary">Save</button>
                  </div>
                </form>
              </>
            )}

            {modalType === 'meeting' && (
              <>
                <h3 style={{ fontWeight: 800, marginBottom: '16px' }}>📅 Book Viewing Meeting</h3>
                <form onSubmit={handleScheduleMeeting} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Date & Time</label>
                    <input type="datetime-local" className="form-control" value={meetingDate} onChange={e => setMeetingDate(e.target.value)} required />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Location</label>
                    <input type="text" className="form-control" value={meetingLocation} onChange={e => setMeetingLocation(e.target.value)} />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Notes</label>
                    <textarea className="form-control" value={meetingNotes} onChange={e => setMeetingNotes(e.target.value)} placeholder="Arrangements…" style={{ height: '70px' }} />
                  </div>
                  <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                    <button type="button" className="btn-secondary" onClick={closeModal}>Cancel</button>
                    <button type="submit" className="btn-primary">Confirm</button>
                  </div>
                </form>
              </>
            )}

            {modalType === 'transfer' && (
              <>
                <h3 style={{ fontWeight: 800, marginBottom: '8px' }}>🔄 Transfer to Company Sales</h3>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
                  This moves <strong>{selectedLead.first_name}</strong> to Company Sales. You will hand over responsibility.
                </p>
                <form onSubmit={handleTransfer} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Handover Notes</label>
                    <textarea className="form-control" value={transferNotes} onChange={e => setTransferNotes(e.target.value)} placeholder="Client profile summary…" style={{ height: '100px' }} />
                  </div>
                  <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                    <button type="button" className="btn-secondary" onClick={closeModal}>Cancel</button>
                    <button type="submit" className="btn-primary">Confirm Transfer</button>
                  </div>
                </form>
              </>
            )}

            {modalType === 'edit' && (
              <>
                <h3 style={{ fontWeight: 800, marginBottom: '16px' }}>📝 Edit Lead Details</h3>
                <form onSubmit={handleUpdateLead} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">First Name *</label>
                    <input type="text" className="form-control" value={editFirstName} onChange={e => setEditFirstName(e.target.value)} required />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Last Name *</label>
                    <input type="text" className="form-control" value={editLastName} onChange={e => setEditLastName(e.target.value)} required />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Phone *</label>
                    <input type="text" className="form-control" value={editPhone} onChange={e => setEditPhone(e.target.value)} required />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Email</label>
                    <input type="email" className="form-control" value={editEmail} onChange={e => setEditEmail(e.target.value)} placeholder="optional" />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Source</label>
                    <select className="form-control" value={editSource} onChange={e => setEditSource(e.target.value)}>
                      <option value="direct">Direct Walk-In</option>
                      <option value="facebook">Facebook Ads</option>
                      <option value="google">Google Search</option>
                      <option value="tiktok">TikTok</option>
                      <option value="referral">Referral</option>
                    </select>
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Payment Method</label>
                    <select className="form-control" value={editPaymentMethod} onChange={e => setEditPaymentMethod(e.target.value)}>
                      <option value="installment">Installment (أقساط)</option>
                      <option value="cash">Cash (كاش)</option>
                    </select>
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Budget (EGP)</label>
                    <input type="number" className="form-control" value={editBudget} onChange={e => setEditBudget(e.target.value)} placeholder="e.g. 5000000" />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Interested Project</label>
                    <select className="form-control" value={editInterestedProjectId} onChange={e => setEditInterestedProjectId(e.target.value)}>
                      <option value="">-- Choose Project --</option>
                      {projects.map((p: any) => (
                        <option key={p.id} value={p.id}>{p.name} {p.delivery_date ? `[${p.delivery_date.substring(0, 10)}]` : ''}</option>
                      ))}
                    </select>
                  </div>
                  <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
                    <button type="button" className="btn-secondary" onClick={closeModal}>Cancel</button>
                    <button type="submit" className="btn-primary">Save Changes</button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}

      {selectedUnit && (
        <div className="modal-backdrop" onClick={() => setSelectedUnit(null)}>
          <div className="glass-panel modal-content" style={{ width: '100%', maxWidth: '520px', padding: '28px' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid var(--border-glass)', paddingBottom: '12px' }}>
              <h3 style={{ margin: 0, fontWeight: 800, fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <i className="fa-solid fa-house-chimney" style={{ color: 'var(--color-primary)' }}></i>
                Unit #{selectedUnit.unit_number} {selectedUnit.building ? `(${selectedUnit.building})` : ''}
              </h3>
              <button onClick={() => setSelectedUnit(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <i className="fa-solid fa-xmark" style={{ fontSize: '1.2rem' }}></i>
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
              {[
                { label: 'Unit Type', value: selectedUnit.type, icon: 'fa-solid fa-building' },
                { label: 'Floor Level', value: selectedUnit.floor !== null ? `${selectedUnit.floor} Floor` : '—', icon: 'fa-solid fa-stairs' },
                { label: 'Total Area', value: selectedUnit.area ? `${selectedUnit.area} m²` : '—', icon: 'fa-solid fa-ruler-combined' },
                { label: 'View Type', value: selectedUnit.view_type || '—', icon: 'fa-solid fa-eye' },
                { label: 'Bedrooms', value: selectedUnit.bedrooms ?? '—', icon: 'fa-solid fa-bed' },
                { label: 'Bathrooms', value: selectedUnit.bathrooms ?? '—', icon: 'fa-solid fa-bath' },
                { label: 'Price', value: fmtPrice(selectedUnit.price), icon: 'fa-solid fa-tag', highlight: true },
                { label: 'Status', value: selectedUnit.status, icon: 'fa-solid fa-circle-info', badge: true },
              ].map((item, idx) => (
                <div key={idx} style={{ display: 'flex', gap: '10px', alignItems: 'center', background: 'rgba(50, 71, 58, 0.03)', padding: '10px 12px', borderRadius: 'var(--radius-sm)' }}>
                  <i className={item.icon} style={{ color: 'var(--color-primary)', fontSize: '0.9rem', width: '16px', textAlign: 'center' }}></i>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>{item.label}</div>
                    {item.badge ? (
                      <span className={`badge ${unitStatusBadge[item.value] || 'badge-info'}`} style={{ marginTop: '2px', display: 'inline-block' }}>{item.value}</span>
                    ) : (
                      <div style={{ fontSize: '0.85rem', fontWeight: item.highlight ? 800 : 700, color: item.highlight ? 'var(--color-success)' : 'var(--text-main)' }}>{item.value}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="glass-panel" style={{ padding: '16px 20px', background: 'rgba(50, 71, 58, 0.04)', borderColor: 'rgba(50, 71, 58, 0.1)' }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-primary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <i className="fa-solid fa-map-marked-alt" style={{ fontSize: '0.82rem' }}></i>
                Unit Layout & Division — التقسيمة وتوزيع الغرف
              </div>
              <p style={{ margin: 0, fontSize: '0.88rem', lineHeight: '1.6', color: 'var(--text-main)', direction: 'rtl', textAlign: 'right', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                {selectedUnit.layout_description || 'تفاصيل التقسيمة غير متوفرة لهذا النموذج.'}
              </p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px' }}>
              <button className="btn-primary" onClick={() => setSelectedUnit(null)} style={{ padding: '10px 24px' }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
};

export default TeleSalesPortal;
