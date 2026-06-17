import React, { useState, useEffect } from 'react';
import {
  Users, Settings, Plus, Edit2, Trash2, Key, ToggleLeft, ToggleRight,
  Save, X, Search, Building2, ClipboardList, AlertCircle, FileText,
  Trash, RefreshCw, Layers, UserCheck, ShieldAlert, Activity, Monitor,
  UploadCloud
} from 'lucide-react';
import api from '../../services/api';
import FloorPlanEditor from '../../components/admin/FloorPlanEditor';

// ── Interfaces ──
interface UserItem {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  status: string;
  created_at: string;
}

interface ProjectItem {
  id: string;
  name: string;
  location: string;
  total_units: number;
  status: string; // 'planning', 'active', 'completed'
  created_at: string;
}

interface UnitItem {
  id: string;
  project_id: string;
  unit_number: string;
  floor: number;
  type: string;
  price: number;
  status: string;
  project?: ProjectItem;
  created_at: string;
  area?: number;
  bedrooms?: number;
  bathrooms?: number;
  view_type?: string;
  building?: string;
  layout_description?: string;
}

interface LeadItem {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string;
  status: string;
  lead_score: number;
  assigned_sales_agent_id: string | null;
  agent?: UserItem;
  source?: string | null;
  created_at: string;
}

interface TicketItem {
  id: string;
  client_id: string;
  unit_id: string;
  category: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  client?: UserItem;
  unit?: UnitItem;
  created_at: string;
}

interface AuditLogItem {
  id: string;
  user_id: string | null;
  action: string;
  ip_address: string | null;
  details: any;
  created_at: string;
  user?: UserItem;
}

interface SystemHealth {
  db_connected: boolean;
  disk_free_gb: number;
  disk_total_gb: number;
  disk_usage_percent: number;
  memory_usage_mb: number;
  memory_limit: string;
  api_error_count: number;
  cache_status: string;
  response_time_ms: number;
}

interface SessionItem {
  id: string | number;
  user_agent: string;
  last_used_at: string | null;
  created_at: string;
  user_name: string;
  user_email: string;
  user_role: string;
}

const AdminPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'users' | 'projects' | 'units' | 'leads' | 'tickets' | 'sessions' | 'health' | 'audit_logs' | 'configs'>('users');
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Floor Plan Editor Modal States
  const [showFloorPlanEditor, setShowFloorPlanEditor] = useState(false);
  const [editorUnitId, setEditorUnitId] = useState('');
  const [editorUnitNumber, setEditorUnitNumber] = useState('');

  // ── Database Lists States ──
  const [users, setUsers] = useState<UserItem[]>([]);
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [units, setUnits] = useState<UnitItem[]>([]);
  const [leads, setLeads] = useState<LeadItem[]>([]);
  const [tickets, setTickets] = useState<TicketItem[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [activeSessions, setActiveSessions] = useState<SessionItem[]>([]);

  // ── Project Payment Plan States ──
  const [projectPlans, setProjectPlans] = useState<any[]>([]);
  const [showPlansModal, setShowPlansModal] = useState(false);
  const [selectedProjectForPlans, setSelectedProjectForPlans] = useState<any | null>(null);
  
  // Plans Form/Edit States
  const [showPlanFormModal, setShowPlanFormModal] = useState(false);
  const [planFormMode, setPlanFormMode] = useState<'add' | 'edit'>('add');
  const [selectedPlan, setSelectedPlan] = useState<any | null>(null);
  
  const [formPlanName, setFormPlanName] = useState('');
  const [formPlanNameAr, setFormPlanNameAr] = useState('');
  const [formPlanDownPaymentPct, setFormPlanDownPaymentPct] = useState('0');
  const [formPlanInstallments, setFormPlanInstallments] = useState('0');
  const [formPlanDiscountPct, setFormPlanDiscountPct] = useState('0');
  const [formPlanDescription, setFormPlanDescription] = useState('');

  // Rich payment plan settings
  const [formPlanFinalPaymentMethod, setFormPlanFinalPaymentMethod] = useState<'cash' | 'installment'>('installment');
  const [formPlanInstallmentType, setFormPlanInstallmentType] = useState<'direct' | 'bank'>('direct');
  const [formPlanInterestType, setFormPlanInterestType] = useState<'flat' | 'reducing'>('reducing');
  const [formPlanInstallmentInterest, setFormPlanInstallmentInterest] = useState('0');
  const [formPlanInstallmentStartMonth, setFormPlanInstallmentStartMonth] = useState('1');
  const [formPlanCashGracePeriod, setFormPlanCashGracePeriod] = useState('14');
  const [formPlanEnableAnnual, setFormPlanEnableAnnual] = useState(false);
  const [formPlanAnnualInstallmentAmount, setFormPlanAnnualInstallmentAmount] = useState('50000');
  const [formPlanIncludeClub, setFormPlanIncludeClub] = useState(false);
  const [formPlanClubCost, setFormPlanClubCost] = useState('150000');
  const [formPlanClubPaymentMethod, setFormPlanClubPaymentMethod] = useState<'cash' | 'installment'>('cash');
  const [formPlanClubTerm, setFormPlanClubTerm] = useState('5');
  const [formPlanClubInstallmentStartYear, setFormPlanClubInstallmentStartYear] = useState('1');
  const [formPlanIncludeGarage, setFormPlanIncludeGarage] = useState(false);
  const [formPlanGarageCost, setFormPlanGarageCost] = useState('100000');
  const [formPlanGaragePaymentMethod, setFormPlanGaragePaymentMethod] = useState<'cash' | 'installment'>('cash');
  const [formPlanGarageTerm, setFormPlanGarageTerm] = useState('5');
  const [formPlanGarageInstallmentStartYear, setFormPlanGarageInstallmentStartYear] = useState('1');
  const [formPlanIncludeMaintenance, setFormPlanIncludeMaintenance] = useState(false);
  const [formPlanMaintenanceCost, setFormPlanMaintenanceCost] = useState('');
  const [formPlanMaintenancePaymentMethod, setFormPlanMaintenancePaymentMethod] = useState<'cash' | 'installment'>('cash');
  const [formPlanMaintenanceTerm, setFormPlanMaintenanceTerm] = useState('5');
  const [formPlanMaintenanceDueMonth, setFormPlanMaintenanceDueMonth] = useState('36');
  const [formPlanMaintenanceInstallmentStartYear, setFormPlanMaintenanceInstallmentStartYear] = useState('1');

  const [configs, setConfigs] = useState({
    kyc_auto_approve: 'false',
    lead_assignment_mode: 'manual',
    default_broker_commission_rate: '2.5',
    maintenance_sla_hours: '24',
    vat_rate: '14',
    sandbox_mode: 'true',
    maintenance_mode: 'false',
    system_name: 'Ether REDP',
    system_logo_url: '',
    system_icon_url: '',
    system_icon_name: 'Building2',
    mail_host: 'smtp.mailtrap.io',
    mail_port: '2525',
    mail_username: '',
    mail_password: '',
    mail_encryption: 'tls',
    mail_from_address: 'noreply@redp.com',
    mail_from_name: 'Ether REDP',
    notify_lead_creation_recipient: 'sales_agent',
    notify_ticket_creation_recipient: 'delivery_engineer',
    notify_payment_collection_recipient: 'finance_officer',
    enable_email_notifications: 'true',
    enable_app_notifications: 'true'
  });

  // ── Modal Toggle States ──
  const [showUserModal, setShowUserModal] = useState(false);
  const [userModalMode, setUserModalMode] = useState<'add' | 'edit'>('add');
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);

  const [showMediaModal, setShowMediaModal] = useState(false);
  const [selectedProjectForMedia, setSelectedProjectForMedia] = useState<ProjectItem | null>(null);
  const [projectMedia, setProjectMedia] = useState<{ project_image: string | null; building_images: any; floor_plan_images: any } | null>(null);
  const [mediaLoading, setMediaLoading] = useState(false);
  const [uploadingMediaKey, setUploadingMediaKey] = useState<string | null>(null);
  const [uploadingUnitLayout, setUploadingUnitLayout] = useState(false);
  const [building3DStatuses, setBuilding3DStatuses] = useState<any[]>([]);
  const [is3DGenerating, setIs3DGenerating] = useState<string | null>(null);
  const [buildingPreprocess, setBuildingPreprocess] = useState<Record<string, boolean>>({});
  const [unitPreprocess, setUnitPreprocess] = useState<Record<string, boolean>>({});
  const [newBName, setNewBName] = useState('');
  const [newBFloors, setNewBFloors] = useState('3');
  const [newBUnits, setNewBUnits] = useState('4');
  const [isConfiguringB, setIsConfiguringB] = useState(false);

  const [showProjectModal, setShowProjectModal] = useState(false);
  const [projectModalMode, setProjectModalMode] = useState<'add' | 'edit'>('add');
  const [selectedProject, setSelectedProject] = useState<ProjectItem | null>(null);

  const [showUnitModal, setShowUnitModal] = useState(false);
  const [unitModalMode, setUnitModalMode] = useState<'add' | 'edit'>('add');
  const [selectedUnit, setSelectedUnit] = useState<UnitItem | null>(null);

  const [showLeadModal, setShowLeadModal] = useState(false);
  const [leadModalMode, setLeadModalMode] = useState<'add' | 'edit'>('add');
  const [selectedLead, setSelectedLead] = useState<LeadItem | null>(null);

  const [showTicketModal, setShowTicketModal] = useState(false);
  const [ticketModalMode, setTicketModalMode] = useState<'add' | 'edit'>('add');
  const [selectedTicket, setSelectedTicket] = useState<TicketItem | null>(null);

  // ── Form Input States ──
  // User Form
  const [formUserName, setFormUserName] = useState('');
  const [formUserEmail, setFormUserEmail] = useState('');
  const [formUserPhone, setFormUserPhone] = useState('');
  const [formUserPassword, setFormUserPassword] = useState('');
  const [formUserRole, setFormUserRole] = useState('client');
  const [formUserStatus, setFormUserStatus] = useState('active');

  // Project Form
  const [formProjName, setFormProjName] = useState('');
  const [formProjLocation, setFormProjLocation] = useState('');
  const [formProjStatus, setFormProjStatus] = useState('planning');

  // Unit Form
  const [formUnitProjId, setFormUnitProjId] = useState('');
  const [formUnitNumber, setFormUnitNumber] = useState('');
  const [formUnitFloor, setFormUnitFloor] = useState('0');
  const [formUnitType, setFormUnitType] = useState('apartment');
  const [formUnitPrice, setFormUnitPrice] = useState('0');
  const [formUnitStatus, setFormUnitStatus] = useState('available');
  const [formUnitArea, setFormUnitArea] = useState('100');
  const [formUnitBedrooms, setFormUnitBedrooms] = useState('3');
  const [formUnitBathrooms, setFormUnitBathrooms] = useState('2');
  const [formUnitViewType, setFormUnitViewType] = useState('garden');
  const [formUnitBuilding, setFormUnitBuilding] = useState('');
  const [formUnitLayoutDescription, setFormUnitLayoutDescription] = useState('');

  // Lead Form
  const [formLeadFirstName, setFormLeadFirstName] = useState('');
  const [formLeadLastName, setFormLeadLastName] = useState('');
  const [formLeadEmail, setFormLeadEmail] = useState('');
  const [formLeadPhone, setFormLeadPhone] = useState('');
  const [formLeadStatus, setFormLeadStatus] = useState('new');
  const [formLeadScore, setFormLeadScore] = useState('0');
  const [formLeadAgentId, setFormLeadAgentId] = useState('');
  const [formLeadSource, setFormLeadSource] = useState('direct');

  // Ticket Form
  const [formTicketClientId, setFormTicketClientId] = useState('');
  const [formTicketUnitId, setFormTicketUnitId] = useState('');
  const [formTicketCategory, setFormTicketCategory] = useState('other');
  const [formTicketTitle, setFormTicketTitle] = useState('');
  const [formTicketDesc, setFormTicketDesc] = useState('');
  const [formTicketStatus, setFormTicketStatus] = useState('open');
  const [formTicketPriority, setFormTicketPriority] = useState('medium');

  const [savingConfigs, setSavingConfigs] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingIcon, setUploadingIcon] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'icon') => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];

    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);

    if (type === 'logo') setUploadingLogo(true);
    else setUploadingIcon(true);

    try {
      const res = await api.post('/admin/upload-branding', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      if (res.data && res.data.success) {
        const url = res.data.url;
        if (type === 'logo') {
          updateConfigKey('system_logo_url', url);
          localStorage.setItem('system_logo_url', url);
        } else {
          updateConfigKey('system_icon_url', url);
          localStorage.setItem('system_icon_url', url);
        }
        alert(`${type} uploaded successfully and preview updated!`);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'File upload failed');
    } finally {
      if (type === 'logo') setUploadingLogo(false);
      else setUploadingIcon(false);
    }
  };

  // ── Fetch Function ──
  const fetchData = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch Users
      const usersRes = await api.get('/admin/users');
      if (usersRes.data?.success) setUsers(usersRes.data.data);

      // 2. Fetch Configs
      const configsRes = await api.get('/admin/configs');
      if (configsRes.data?.success) setConfigs(configsRes.data.data);

      // 3. Fetch Projects
      const projectsRes = await api.get('/admin/projects');
      if (projectsRes.data?.success) setProjects(projectsRes.data.data);

      // 4. Fetch Units
      const unitsRes = await api.get('/admin/units');
      if (unitsRes.data?.success) setUnits(unitsRes.data.data);

      // 5. Fetch Leads
      const leadsRes = await api.get('/admin/leads');
      if (leadsRes.data?.success) setLeads(leadsRes.data.data);

      // 6. Fetch Tickets
      const ticketsRes = await api.get('/admin/tickets');
      if (ticketsRes.data?.success) setTickets(ticketsRes.data.data);

      // 7. Fetch Audit Logs
      const logsRes = await api.get('/admin/audit-logs');
      if (logsRes.data?.success) setAuditLogs(logsRes.data.data);

      // 8. Fetch System Health
      const healthRes = await api.get('/admin/system-health');
      if (healthRes.data?.success) setSystemHealth(healthRes.data.data);

      // 9. Fetch Active Sessions
      const sessionsRes = await api.get('/admin/active-sessions');
      if (sessionsRes.data?.success) setActiveSessions(sessionsRes.data.data);

      // 10. Fetch Project Payment Plans
      try {
        const plansRes = await api.get('/admin/project-payment-plans');
        if (plansRes.data?.success) setProjectPlans(plansRes.data.data);
      } catch (errPlans) {
        console.error('Failed to load project plans', errPlans);
        setProjectPlans([]);
      }

    } catch (err: any) {
      console.error('Failed to load admin panel data from API, using mock fallbacks:', err);
      // Fail-safes
      setProjectPlans([]);
      setUsers([
        { id: 'u1', name: 'Platform Administrator', email: 'admin@redp.com', phone: '+201009999999', role: 'admin', status: 'active', created_at: '2026-06-01' },
        { id: 'u2', name: 'Ragab Sales', email: 'sales_agent@redp.com', phone: '+201001111111', role: 'sales_agent', status: 'active', created_at: '2026-06-01' },
        { id: 'u3', name: 'Melwany Finance', email: 'finance_officer@redp.com', phone: '+201002222222', role: 'finance_officer', status: 'active', created_at: '2026-06-01' },
        { id: 'u4', name: 'Mahmoud Delivery', email: 'delivery_engineer@redp.com', phone: '+201003333333', role: 'delivery_engineer', status: 'active', created_at: '2026-06-01' }
      ]);
      setProjects([
        { id: 'p1', name: 'Ether Heights', location: 'New Cairo, Sector 1', total_units: 3, status: 'active', created_at: '2026-06-01' },
        { id: 'p2', name: 'Westfield Gate', location: '6th of October', total_units: 1, status: 'planning', created_at: '2026-06-01' }
      ]);
      setUnits([
        { id: 'un1', project_id: 'p1', unit_number: '101', floor: 1, type: 'apartment', price: 3400000, status: 'available', created_at: '2026-06-01' },
        { id: 'un2', project_id: 'p1', unit_number: '102', floor: 1, type: 'penthouse', price: 6200000, status: 'reserved', created_at: '2026-06-01' }
      ]);
      setLeads([
        { id: 'l1', first_name: 'Farid', last_name: 'Al-Atrash', email: 'farid@mail.com', phone: '+20111222333', status: 'new', lead_score: 85, assigned_sales_agent_id: 'u2', created_at: '2026-06-01' }
      ]);
      setTickets([
        { id: 't1', client_id: 'u4', unit_id: 'un1', category: 'plumbing', title: 'Leak in Master Bathroom', description: 'Water is dripping from the false ceiling.', status: 'open', priority: 'high', created_at: '2026-06-01' }
      ]);
      setAuditLogs([
        { id: 'log1', user_id: 'u1', action: 'SYSTEM_SETTINGS_UPDATE', ip_address: '127.0.0.1', details: { kyc_auto_approve: 'true' }, created_at: '2026-06-02 08:30:11' }
      ]);
      setSystemHealth({
        db_connected: true,
        disk_free_gb: 120.4,
        disk_total_gb: 256.0,
        disk_usage_percent: 52.9,
        memory_usage_mb: 48.2,
        memory_limit: '128M',
        api_error_count: 0,
        cache_status: 'Active (Redis)',
        response_time_ms: 22
      });
      setActiveSessions([
        { id: '1', user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', last_used_at: '2026-06-02 08:45:00', created_at: '2026-06-02 08:00:00', user_name: 'Platform Administrator', user_email: 'admin@redp.com', user_role: 'admin' }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // ── User Handlers ──
  const openAddUserModal = () => {
    setFormUserName('');
    setFormUserEmail('');
    setFormUserPhone('');
    setFormUserPassword('');
    setFormUserRole('client');
    setFormUserStatus('active');
    setUserModalMode('add');
    setShowUserModal(true);
  };

  const openEditUserModal = (user: UserItem) => {
    setSelectedUser(user);
    setFormUserName(user.name);
    setFormUserEmail(user.email);
    setFormUserPhone(user.phone || '');
    setFormUserPassword('');
    setFormUserRole(user.role);
    setFormUserStatus(user.status);
    setUserModalMode('edit');
    setShowUserModal(true);
  };

  const handleUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (userModalMode === 'add') {
        await api.post('/admin/users', {
          name: formUserName,
          email: formUserEmail,
          password: formUserPassword,
          phone: formUserPhone || null,
          role: formUserRole,
          status: formUserStatus
        });
        alert('User created successfully!');
      } else if (selectedUser) {
        await api.put(`/admin/users/${selectedUser.id}`, {
          name: formUserName,
          email: formUserEmail,
          password: formUserPassword || undefined,
          phone: formUserPhone || null,
          role: formUserRole,
          status: formUserStatus
        });
        alert('User updated successfully!');
      }
      setShowUserModal(false);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to submit user');
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    try {
      const res = await api.delete(`/admin/users/${id}`);
      if (res.data.success) {
        alert('User deleted successfully!');
        fetchData();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete user');
    }
  };

  // ── Project Handlers ──
  const openAddProjectModal = () => {
    setFormProjName('');
    setFormProjLocation('');
    setFormProjStatus('planning');
    setProjectModalMode('add');
    setShowProjectModal(true);
  };

  const openEditProjectModal = (proj: ProjectItem) => {
    setSelectedProject(proj);
    setFormProjName(proj.name);
    setFormProjLocation(proj.location);
    setFormProjStatus(proj.status);
    setProjectModalMode('edit');
    setShowProjectModal(true);
  };

  const handleProjectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (projectModalMode === 'add') {
        await api.post('/admin/projects', {
          name: formProjName,
          location: formProjLocation,
          status: formProjStatus
        });
        alert('Project created successfully!');
      } else if (selectedProject) {
        await api.put(`/admin/projects/${selectedProject.id}`, {
          name: formProjName,
          location: formProjLocation,
          status: formProjStatus
        });
        alert('Project updated successfully!');
      }
      setShowProjectModal(false);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to submit project');
    }
  };

  const handleDeleteProject = async (id: string) => {
    if (!confirm('Warning: Deleting a project will delete all units inside it. Continue?')) return;
    try {
      await api.delete(`/admin/projects/${id}`);
      alert('Project deleted successfully!');
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete project');
    }
  };

  // ── Project Payment Plans CRUD Handlers ──
  const openProjectPlansModal = (proj: ProjectItem) => {
    setSelectedProjectForPlans(proj);
    setShowPlansModal(true);
  };

  // ── Project Media Handlers ──
  const fetch3DStatuses = async (projectId: string) => {
    try {
      const res = await api.get(`/admin/projects/${projectId}/3d-status`);
      if (res.data?.success) {
        setBuilding3DStatuses(res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch 3D model statuses', err);
    }
  };

  const openProjectMediaModal = async (project: ProjectItem) => {
    setSelectedProjectForMedia(project);
    setShowMediaModal(true);
    setMediaLoading(true);
    try {
      const res = await api.get(`/public/projects/${project.id}/media`);
      if (res.data?.success) {
        setProjectMedia(res.data.data);
      }
      await fetch3DStatuses(project.id);
    } catch (err) {
      console.error('Failed to load project media', err);
      setProjectMedia({ project_image: null, building_images: {}, floor_plan_images: {} });
    } finally {
      setMediaLoading(false);
    }
  };

  const handleGenerate3D = async (buildingName: string, preprocess = false) => {
    if (!selectedProjectForMedia) return;
    setIs3DGenerating(buildingName);
    try {
      const res = await api.post(`/admin/projects/${selectedProjectForMedia.id}/generate-3d`, {
        building_name: buildingName,
        preprocess_with_chatgpt: preprocess
      });
      if (res.data?.success) {
        alert(res.data.message);
        await fetch3DStatuses(selectedProjectForMedia.id);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to start 3D model generation');
    } finally {
      setIs3DGenerating(null);
    }
  };

  const handleRegenerate3D = async (mediaId: string, buildingName: string, preprocess = false) => {
    if (!selectedProjectForMedia) return;
    setIs3DGenerating(buildingName);
    try {
      const res = await api.post(`/admin/3d-models/${mediaId}/regenerate`, {
        preprocess_with_chatgpt: preprocess
      });
      if (res.data?.success) {
        alert(res.data.message);
        await fetch3DStatuses(selectedProjectForMedia.id);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to regenerate 3D model');
    } finally {
      setIs3DGenerating(null);
    }
  };

  const handleDelete3D = async (mediaId: string, buildingName: string) => {
    if (!selectedProjectForMedia) return;
    if (!confirm(`Are you sure you want to delete the 3D model for ${buildingName}?`)) return;
    setIs3DGenerating(buildingName);
    try {
      const res = await api.delete(`/admin/3d-models/${mediaId}`);
      if (res.data?.success) {
        alert(res.data.message);
        await fetch3DStatuses(selectedProjectForMedia.id);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete 3D model');
    } finally {
      setIs3DGenerating(null);
    }
  };

  const handleGenerateUnit3D = async (unitId: string, preprocess = false) => {
    try {
      const res = await api.post(`/admin/units/${unitId}/generate-3d`, {
        preprocess_with_chatgpt: preprocess
      });
      if (res.data?.success) {
        alert(res.data.message);
        await fetchData();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to start unit 3D model generation');
    }
  };

  const handleRegenerateUnit3D = async (unitId: string, preprocess = false) => {
    try {
      const res = await api.post(`/admin/units/${unitId}/regenerate-3d`, {
        preprocess_with_chatgpt: preprocess
      });
      if (res.data?.success) {
        alert(res.data.message);
        await fetchData();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to regenerate unit 3D model');
    }
  };

  const handleDeleteUnit3D = async (unitId: string) => {
    if (!confirm('Are you sure you want to delete this unit 3D model?')) return;
    try {
      const res = await api.delete(`/admin/units/${unitId}/3d-model`);
      if (res.data?.success) {
        alert(res.data.message);
        await fetchData();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete unit 3D model');
    }
  };

  const handleSetupBuilding = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjectForMedia || !newBName) return;
    setIsConfiguringB(true);
    try {
      const res = await api.post(`/admin/projects/${selectedProjectForMedia.id}/setup-building`, {
        building_name: newBName,
        floors_count: parseInt(newBFloors, 10),
        units_per_floor: parseInt(newBUnits, 10),
      });
      alert(res.data.message);
      setNewBName('');
      await fetchData();
      const mediaRes = await api.get(`/public/projects/${selectedProjectForMedia.id}/media`);
      if (mediaRes.data?.success) {
        setProjectMedia(mediaRes.data.data);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to setup building structure');
    } finally {
      setIsConfiguringB(false);
    }
  };

  const handleUploadProjectImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedProjectForMedia || !e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append('image', file);

    setUploadingMediaKey('project');
    try {
      const res = await api.post(`/admin/projects/${selectedProjectForMedia.id}/image`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data?.success) {
        alert('Project image uploaded successfully!');
        setProjectMedia(prev => prev ? { ...prev, project_image: res.data.data.image_url } : null);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploadingMediaKey(null);
    }
  };

  const handleUploadBuildingImage = async (buildingName: string, e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedProjectForMedia || !e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append('image', file);
    formData.append('building_name', buildingName);

    setUploadingMediaKey(`building-${buildingName}`);
    try {
      const res = await api.post(`/admin/projects/${selectedProjectForMedia.id}/building-image`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data?.success) {
        alert(`${buildingName} image uploaded successfully!`);
        setProjectMedia(prev => {
          if (!prev) return null;
          const updatedBuildingImages = { ...prev.building_images };
          updatedBuildingImages[buildingName] = { image_url: res.data.data.image_url };
          return { ...prev, building_images: updatedBuildingImages };
        });
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploadingMediaKey(null);
    }
  };

  const handleUploadFloorPlanImage = async (buildingName: string, floorNumber: number, e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedProjectForMedia || !e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append('image', file);
    formData.append('building_name', buildingName);
    formData.append('floor_number', floorNumber.toString());

    const refKey = `${buildingName}|${floorNumber}`;
    setUploadingMediaKey(`floor-${refKey}`);
    try {
      const res = await api.post(`/admin/projects/${selectedProjectForMedia.id}/floor-plan-image`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data?.success) {
        alert(`${buildingName} Floor ${floorNumber} plan uploaded successfully!`);
        setProjectMedia(prev => {
          if (!prev) return null;
          const updatedFloorPlanImages = { ...prev.floor_plan_images };
          updatedFloorPlanImages[refKey] = { image_url: res.data.data.image_url };
          return { ...prev, floor_plan_images: updatedFloorPlanImages };
        });
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploadingMediaKey(null);
    }
  };

  const handleUploadUnitLayoutImage = async (unitId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append('image', file);

    setUploadingUnitLayout(true);
    try {
      const res = await api.post(`/admin/units/${unitId}/image`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data?.success) {
        alert('Unit layout image uploaded successfully!');
        setSelectedUnit(prev => prev ? { ...prev, layout_image_url: res.data.data.image_url } : null);
        setUnits(prevUnits => prevUnits.map(u => u.id === unitId ? { ...u, layout_image_url: res.data.data.image_url } : u));
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploadingUnitLayout(false);
    }
  };

  const openAddPlanModal = () => {
    setFormPlanName('');
    setFormPlanNameAr('');
    setFormPlanDownPaymentPct('20');
    setFormPlanInstallments('60');
    setFormPlanDiscountPct('0');
    setFormPlanDescription('');

    // Reset advanced settings
    setFormPlanFinalPaymentMethod('installment');
    setFormPlanInstallmentType('direct');
    setFormPlanInterestType('reducing');
    setFormPlanInstallmentInterest('0');
    setFormPlanInstallmentStartMonth('1');
    setFormPlanCashGracePeriod('14');
    setFormPlanEnableAnnual(false);
    setFormPlanAnnualInstallmentAmount('50000');
    setFormPlanIncludeClub(false);
    setFormPlanClubCost('150000');
    setFormPlanClubPaymentMethod('cash');
    setFormPlanClubTerm('5');
    setFormPlanClubInstallmentStartYear('1');
    setFormPlanIncludeGarage(false);
    setFormPlanGarageCost('100000');
    setFormPlanGaragePaymentMethod('cash');
    setFormPlanGarageTerm('5');
    setFormPlanGarageInstallmentStartYear('1');
    setFormPlanIncludeMaintenance(false);
    setFormPlanMaintenanceCost('');
    setFormPlanMaintenancePaymentMethod('cash');
    setFormPlanMaintenanceTerm('5');
    setFormPlanMaintenanceDueMonth('36');
    setFormPlanMaintenanceInstallmentStartYear('1');

    setPlanFormMode('add');
    setShowPlanFormModal(true);
  };

  const openEditPlanModal = (plan: any) => {
    setSelectedPlan(plan);
    setFormPlanName(plan.name);
    setFormPlanNameAr(plan.name_ar);
    setFormPlanDownPaymentPct(plan.down_payment_pct.toString());
    setFormPlanInstallments(plan.installments.toString());
    setFormPlanDiscountPct(plan.discount_pct.toString());
    setFormPlanDescription(plan.description || '');

    // Load advanced settings
    const settings = plan.settings || {};
    setFormPlanFinalPaymentMethod(settings.finalPaymentMethod || 'installment');
    setFormPlanInstallmentType(settings.installmentType || 'direct');
    setFormPlanInterestType(settings.interestType || 'reducing');
    setFormPlanInstallmentInterest((settings.installmentInterest ?? 0).toString());
    setFormPlanInstallmentStartMonth((settings.installmentStartMonth ?? 1).toString());
    setFormPlanCashGracePeriod((settings.cashGracePeriod ?? 14).toString());
    setFormPlanEnableAnnual(settings.enableAnnual || false);
    setFormPlanAnnualInstallmentAmount((settings.annualInstallmentAmount ?? '50000').toString());
    
    setFormPlanIncludeClub(settings.includeClub || false);
    setFormPlanClubCost((settings.clubCost ?? '150000').toString());
    setFormPlanClubPaymentMethod(settings.clubPaymentMethod || 'cash');
    setFormPlanClubTerm((settings.clubTerm ?? 5).toString());
    setFormPlanClubInstallmentStartYear((settings.clubInstallmentStartYear ?? 1).toString());
    
    setFormPlanIncludeGarage(settings.includeGarage || false);
    setFormPlanGarageCost((settings.garageCost ?? '100000').toString());
    setFormPlanGaragePaymentMethod(settings.garagePaymentMethod || 'cash');
    setFormPlanGarageTerm((settings.garageTerm ?? 5).toString());
    setFormPlanGarageInstallmentStartYear((settings.garageInstallmentStartYear ?? 1).toString());
    
    setFormPlanIncludeMaintenance(settings.includeMaintenance || false);
    setFormPlanMaintenanceCost((settings.maintenanceCost ?? '').toString());
    setFormPlanMaintenancePaymentMethod(settings.maintenancePaymentMethod || 'cash');
    setFormPlanMaintenanceTerm((settings.maintenanceTerm ?? 5).toString());
    setFormPlanMaintenanceDueMonth((settings.maintenanceDueMonth ?? 36).toString());
    setFormPlanMaintenanceInstallmentStartYear((settings.maintenanceInstallmentStartYear ?? 1).toString());

    setPlanFormMode('edit');
    setShowPlanFormModal(true);
  };

  const handlePlanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjectForPlans) return;
    try {
      const settings = {
        finalPaymentMethod: formPlanFinalPaymentMethod,
        installmentType: formPlanInstallmentType,
        interestType: formPlanInterestType,
        installmentInterest: parseFloat(formPlanInstallmentInterest) || 0,
        installmentStartMonth: parseInt(formPlanInstallmentStartMonth) || 1,
        cashGracePeriod: parseInt(formPlanCashGracePeriod) || 14,
        enableAnnual: formPlanEnableAnnual,
        annualInstallmentAmount: formPlanAnnualInstallmentAmount,
        includeClub: formPlanIncludeClub,
        clubCost: formPlanIncludeClub ? formPlanClubCost : '0',
        clubPaymentMethod: formPlanClubPaymentMethod,
        clubTerm: parseInt(formPlanClubTerm) || 5,
        clubInstallmentStartYear: parseInt(formPlanClubInstallmentStartYear) || 1,
        includeGarage: formPlanIncludeGarage,
        garageCost: formPlanIncludeGarage ? formPlanGarageCost : '0',
        garagePaymentMethod: formPlanGaragePaymentMethod,
        garageTerm: parseInt(formPlanGarageTerm) || 5,
        garageInstallmentStartYear: parseInt(formPlanGarageInstallmentStartYear) || 1,
        includeMaintenance: formPlanIncludeMaintenance,
        maintenanceCost: formPlanIncludeMaintenance ? formPlanMaintenanceCost : '0',
        maintenancePaymentMethod: formPlanMaintenancePaymentMethod,
        maintenanceTerm: parseInt(formPlanMaintenanceTerm) || 5,
        maintenanceDueMonth: parseInt(formPlanMaintenanceDueMonth) || 36,
        maintenanceInstallmentStartYear: parseInt(formPlanMaintenanceInstallmentStartYear) || 1
      };

      const payload = {
        project_id: selectedProjectForPlans.id,
        name: formPlanName,
        name_ar: formPlanNameAr,
        down_payment_pct: parseFloat(formPlanDownPaymentPct) || 0,
        installments: parseInt(formPlanInstallments) || 0,
        discount_pct: parseFloat(formPlanDiscountPct) || 0,
        description: formPlanDescription,
        settings: settings
      };

      if (planFormMode === 'add') {
        await api.post('/admin/project-payment-plans', payload);
        alert('Payment plan template created successfully!');
      } else if (selectedPlan) {
        await api.put(`/admin/project-payment-plans/${selectedPlan.id}`, payload);
        alert('Payment plan template updated successfully!');
      }
      setShowPlanFormModal(false);
      
      // Refresh
      const plansRes = await api.get('/admin/project-payment-plans');
      if (plansRes.data?.success) setProjectPlans(plansRes.data.data);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to submit payment plan');
    }
  };

  const handleDeletePlan = async (id: string) => {
    if (!confirm('Are you sure you want to delete this payment plan template?')) return;
    try {
      await api.delete(`/admin/project-payment-plans/${id}`);
      alert('Payment plan template deleted successfully!');
      
      // Refresh
      const plansRes = await api.get('/admin/project-payment-plans');
      if (plansRes.data?.success) setProjectPlans(plansRes.data.data);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete payment plan');
    }
  };

  // ── Unit Handlers ──
  const openAddUnitModal = () => {
    setFormUnitProjId(projects[0]?.id || '');
    setFormUnitNumber('');
    setFormUnitFloor('0');
    setFormUnitType('apartment');
    setFormUnitPrice('1000000');
    setFormUnitStatus('available');
    setFormUnitArea('100');
    setFormUnitBedrooms('3');
    setFormUnitBathrooms('2');
    setFormUnitViewType('garden');
    setFormUnitBuilding('');
    setFormUnitLayoutDescription('');
    setUnitModalMode('add');
    setShowUnitModal(true);
  };

  const openEditUnitModal = (unit: UnitItem) => {
    setSelectedUnit(unit);
    setFormUnitProjId(unit.project_id);
    setFormUnitNumber(unit.unit_number);
    setFormUnitFloor(unit.floor.toString());
    setFormUnitType(unit.type);
    setFormUnitPrice(unit.price.toString());
    setFormUnitStatus(unit.status);
    setFormUnitArea(unit.area ? unit.area.toString() : '0');
    setFormUnitBedrooms(unit.bedrooms ? unit.bedrooms.toString() : '0');
    setFormUnitBathrooms(unit.bathrooms ? unit.bathrooms.toString() : '0');
    setFormUnitViewType(unit.view_type || 'garden');
    setFormUnitBuilding(unit.building || '');
    setFormUnitLayoutDescription(unit.layout_description || '');
    setUnitModalMode('edit');
    setShowUnitModal(true);
  };

  const handleUnitSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        project_id: formUnitProjId,
        unit_number: formUnitNumber,
        floor: parseInt(formUnitFloor),
        type: formUnitType,
        price: parseFloat(formUnitPrice),
        status: formUnitStatus,
        area: parseFloat(formUnitArea),
        bedrooms: parseInt(formUnitBedrooms),
        bathrooms: parseInt(formUnitBathrooms),
        view_type: formUnitViewType,
        building: formUnitBuilding,
        layout_description: formUnitLayoutDescription
      };

      if (unitModalMode === 'add') {
        await api.post('/admin/units', payload);
        alert('Unit created successfully!');
      } else if (selectedUnit) {
        await api.put(`/admin/units/${selectedUnit.id}`, payload);
        alert('Unit updated successfully!');
      }
      setShowUnitModal(false);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to submit unit');
    }
  };

  const handleDeleteUnit = async (id: string) => {
    if (!confirm('Are you sure you want to delete this unit?')) return;
    try {
      await api.delete(`/admin/units/${id}`);
      alert('Unit deleted successfully!');
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete unit');
    }
  };

  // ── Lead Handlers ──
  const openAddLeadModal = () => {
    setFormLeadFirstName('');
    setFormLeadLastName('');
    setFormLeadEmail('');
    setFormLeadPhone('');
    setFormLeadStatus('new');
    setFormLeadScore('10');
    setFormLeadAgentId('');
    setFormLeadSource('direct');
    setLeadModalMode('add');
    setShowLeadModal(true);
  };

  const openEditLeadModal = (lead: LeadItem) => {
    setSelectedLead(lead);
    setFormLeadFirstName(lead.first_name);
    setFormLeadLastName(lead.last_name);
    setFormLeadEmail(lead.email || '');
    setFormLeadPhone(lead.phone);
    setFormLeadStatus(lead.status);
    setFormLeadScore(lead.lead_score.toString());
    setFormLeadAgentId(lead.assigned_sales_agent_id || '');
    setFormLeadSource(lead.source || 'direct');
    setLeadModalMode('edit');
    setShowLeadModal(true);
  };

  const handleLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        first_name: formLeadFirstName,
        last_name: formLeadLastName,
        email: formLeadEmail || null,
        phone: formLeadPhone,
        status: formLeadStatus,
        lead_score: parseInt(formLeadScore),
        assigned_sales_agent_id: formLeadAgentId || null,
        source: formLeadSource
      };

      if (leadModalMode === 'add') {
        await api.post('/admin/leads', payload);
        alert('Lead created successfully!');
      } else if (selectedLead) {
        await api.put(`/admin/leads/${selectedLead.id}`, payload);
        alert('Lead updated successfully!');
      }
      setShowLeadModal(false);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to submit lead');
    }
  };

  const handleDeleteLead = async (id: string) => {
    if (!confirm('Are you sure you want to delete this lead?')) return;
    try {
      await api.delete(`/admin/leads/${id}`);
      alert('Lead deleted successfully!');
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete lead');
    }
  };

  // ── Maintenance Ticket Handlers ──
  const openAddTicketModal = () => {
    setFormTicketClientId(users.find(u => u.role === 'client')?.id || '');
    setFormTicketUnitId(units[0]?.id || '');
    setFormTicketCategory('other');
    setFormTicketTitle('');
    setFormTicketDesc('');
    setFormTicketStatus('open');
    setFormTicketPriority('medium');
    setTicketModalMode('add');
    setShowTicketModal(true);
  };

  const openEditTicketModal = (t: TicketItem) => {
    setSelectedTicket(t);
    setFormTicketClientId(t.client_id);
    setFormTicketUnitId(t.unit_id);
    setFormTicketCategory(t.category);
    setFormTicketTitle(t.title);
    setFormTicketDesc(t.description);
    setFormTicketStatus(t.status);
    setFormTicketPriority(t.priority);
    setTicketModalMode('edit');
    setShowTicketModal(true);
  };

  const handleTicketSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        client_id: formTicketClientId,
        unit_id: formTicketUnitId,
        category: formTicketCategory,
        title: formTicketTitle,
        description: formTicketDesc,
        status: formTicketStatus,
        priority: formTicketPriority
      };

      if (ticketModalMode === 'add') {
        await api.post('/admin/tickets', payload);
        alert('Ticket created successfully!');
      } else if (selectedTicket) {
        await api.put(`/admin/tickets/${selectedTicket.id}`, payload);
        alert('Ticket updated successfully!');
      }
      setShowTicketModal(false);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to submit ticket');
    }
  };

  const handleDeleteTicket = async (id: string) => {
    if (!confirm('Are you sure you want to delete this ticket?')) return;
    try {
      await api.delete(`/admin/tickets/${id}`);
      alert('Ticket deleted successfully!');
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete ticket');
    }
  };

  // ── Configs Handlers ──
  const handleSaveConfigs = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingConfigs(true);
    try {
      const response = await api.post('/admin/configs', { configs });
      if (response.data?.success) {
        alert('Configurations saved successfully!');
        setConfigs(response.data.data);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to save configurations');
    } finally {
      setSavingConfigs(false);
    }
  };

  const updateConfigKey = (key: string, value: string) => {
    setConfigs(prev => ({ ...prev, [key]: value }));
  };

  // ── Session Handlers ──
  const handleRevokeSession = async (id: string | number) => {
    if (!confirm('Are you sure you want to force logout / terminate this active user session?')) return;
    try {
      const res = await api.delete(`/admin/active-sessions/${id}`);
      if (res.data?.success) {
        alert('Session terminated successfully.');
        fetchData();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to terminate session');
    }
  };

  // ── Audit Logs Handlers ──
  const handleClearAuditLogs = async () => {
    if (!confirm('Warning: This will permanently delete all audit logs. Continue?')) return;
    try {
      await api.delete('/admin/audit-logs');
      alert('Audit logs cleared!');
      fetchData();
    } catch (err: any) {
      alert('Failed to clear logs.');
    }
  };

  // ── Filters & Search ──
  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredProjects = projects.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredUnits = units.filter(un =>
    un.unit_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
    un.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (un.project?.name || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredLeads = leads.filter(l =>
    `${l.first_name} ${l.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (l.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.phone.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredTickets = tickets.filter(t =>
    t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (t.client?.name || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredLogs = auditLogs.filter(log =>
    log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (log.user?.name || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredSessions = activeSessions.filter(s =>
    (s.user_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.user_email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.user_role || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.user_agent || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', flexDirection: 'column', gap: '16px' }}>
        <div className="animate-spin" style={{ width: '40px', height: '40px', border: '4px solid var(--color-primary)', borderTopColor: 'transparent', borderRadius: '50%' }} />
        <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 600 }}>Loading Admin Control Center...</span>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>

      {/* Header Panel */}
      <div className="glass-panel" style={{ padding: '24px 30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.65rem', fontWeight: 800, marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Key style={{ color: 'var(--color-primary)', width: '28px', height: '28px' }} />
            👑 System Administration Control Center
          </h1>
          <p>Full database CRUD workspace. View, update, or remove any core records and system configuration rules.</p>
        </div>
        <div style={{ padding: '6px 14px', background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 'var(--radius-sm)' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-primary)' }}>ROLE: SYSTEM ADMIN</span>
        </div>
      </div>

      {/* Tabs Menu */}
      <div style={{ display: 'flex', gap: '4px', borderBottom: '1px solid var(--border-glass)', overflowX: 'auto', paddingBottom: '2px' }}>
        {[
          { id: 'users', label: 'Users', icon: Users },
          { id: 'projects', label: 'Projects', icon: Building2 },
          { id: 'units', label: 'Units', icon: Layers },
          { id: 'leads', label: 'CRM Leads', icon: UserCheck },
          { id: 'tickets', label: 'Tickets', icon: AlertCircle },
          { id: 'sessions', label: 'Active Sessions', icon: Monitor },
          { id: 'health', label: 'System Health', icon: Activity },
          { id: 'audit_logs', label: 'Audit Logs', icon: FileText },
          { id: 'configs', label: 'Configurations', icon: Settings },
        ].map(tab => {
          const Icon = tab.icon;
          const isSelected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id as any); setSearchQuery(''); }}
              className="btn-secondary"
              style={{
                padding: '10px 18px',
                background: isSelected ? '#ffffff' : 'transparent',
                border: 'none',
                borderBottom: isSelected ? '2.5px solid var(--color-primary)' : '2.5px solid transparent',
                color: isSelected ? 'var(--text-main)' : 'var(--text-muted)',
                fontWeight: isSelected ? 700 : 500,
                borderRadius: 'var(--radius-md) var(--radius-md) 0 0',
                cursor: 'pointer',
                fontSize: '0.8rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                whiteSpace: 'nowrap'
              }}
            >
              <Icon size={14} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Sub-view search & action header */}
      {activeTab !== 'configs' && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
          {activeTab !== 'health' ? (
            <div style={{ position: 'relative', width: '320px' }}>
              <Search style={{ position: 'absolute', left: '16px', top: '13px', width: '16px', height: '16px', color: 'var(--text-muted)' }} />
              <input
                type="text"
                className="form-control"
                style={{ paddingLeft: '44px', height: '42px' }}
                placeholder={`Search ${activeTab.replace('_', ' ')}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          ) : <div />}

          <div style={{ display: 'flex', gap: '8px' }}>
            {activeTab === 'users' && (
              <button onClick={openAddUserModal} className="btn-primary" style={{ padding: '8px 16px', fontSize: '0.8rem' }}>
                <Plus size={14} style={{ marginRight: '6px' }} /> Add User
              </button>
            )}
            {activeTab === 'projects' && (
              <button onClick={openAddProjectModal} className="btn-primary" style={{ padding: '8px 16px', fontSize: '0.8rem' }}>
                <Plus size={14} style={{ marginRight: '6px' }} /> Add Project
              </button>
            )}
            {activeTab === 'units' && (
              <button onClick={openAddUnitModal} className="btn-primary" style={{ padding: '8px 16px', fontSize: '0.8rem' }}>
                <Plus size={14} style={{ marginRight: '6px' }} /> Add Unit
              </button>
            )}
            {activeTab === 'leads' && (
              <button onClick={openAddLeadModal} className="btn-primary" style={{ padding: '8px 16px', fontSize: '0.8rem' }}>
                <Plus size={14} style={{ marginRight: '6px' }} /> Add Lead
              </button>
            )}
            {activeTab === 'tickets' && (
              <button onClick={openAddTicketModal} className="btn-primary" style={{ padding: '8px 16px', fontSize: '0.8rem' }}>
                <Plus size={14} style={{ marginRight: '6px' }} /> Add Ticket
              </button>
            )}
            {activeTab === 'sessions' && (
              <button onClick={fetchData} className="btn-secondary" style={{ padding: '8px 16px', fontSize: '0.8rem' }}>
                <RefreshCw size={14} style={{ marginRight: '6px' }} /> Refresh Sessions
              </button>
            )}
            {activeTab === 'health' && (
              <button onClick={fetchData} className="btn-secondary" style={{ padding: '8px 16px', fontSize: '0.8rem' }}>
                <RefreshCw size={14} style={{ marginRight: '6px' }} /> Refresh Health Metrics
              </button>
            )}
            {activeTab === 'audit_logs' && (
              <>
                <button onClick={fetchData} className="btn-secondary" style={{ padding: '8px 16px', fontSize: '0.8rem' }}>
                  <RefreshCw size={14} style={{ marginRight: '6px' }} /> Refresh
                </button>
                <button onClick={handleClearAuditLogs} className="btn-secondary" style={{ padding: '8px 16px', fontSize: '0.8rem', color: 'var(--color-danger)', borderColor: 'rgba(239,68,68,0.2)' }}>
                  <Trash size={14} style={{ marginRight: '6px' }} /> Clear Logs
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Tab Content: USERS ── */}
      {activeTab === 'users' && (
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
          <table className="premium-table">
            <thead>
              <tr>
                <th>User Details</th>
                <th>Phone Number</th>
                <th>Security Role</th>
                <th>Status</th>
                <th>Created At</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>No system users found.</td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <div>
                        <strong style={{ fontSize: '0.9rem', color: 'var(--text-main)' }}>{user.name}</strong>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{user.email}</div>
                      </div>
                    </td>
                    <td>{user.phone || <span style={{ color: 'var(--text-muted)' }}>—</span>}</td>
                    <td>
                      <span className="badge badge-info" style={{ textTransform: 'capitalize', fontWeight: 700 }}>
                        {user.role.replace('_', ' ')}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${user.status === 'active' ? 'badge-success' : 'badge-danger'}`} style={{ textTransform: 'uppercase' }}>
                        {user.status}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{user.created_at.substring(0, 10)}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={() => openEditUserModal(user)} className="btn-secondary" style={{ padding: '6px 10px', fontSize: '0.7rem' }}>
                          <Edit2 size={12} /> Edit
                        </button>
                        <button onClick={() => handleDeleteUser(user.id)} className="btn-secondary" style={{ padding: '6px 10px', fontSize: '0.7rem', color: 'var(--color-danger)', borderColor: 'rgba(239, 68, 68, 0.2)' }}>
                          <Trash2 size={12} /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Tab Content: PROJECTS ── */}
      {activeTab === 'projects' && (
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
          <table className="premium-table">
            <thead>
              <tr>
                <th>Project Name</th>
                <th>Location</th>
                <th>Total Units Inventory</th>
                <th>Status</th>
                <th>Created At</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProjects.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>No projects found.</td>
                </tr>
              ) : (
                filteredProjects.map((p) => (
                  <tr key={p.id}>
                    <td><strong style={{ fontSize: '0.9rem', color: 'var(--text-main)' }}>{p.name}</strong></td>
                    <td>{p.location}</td>
                    <td><span style={{ fontWeight: 700 }}>{p.total_units} units</span></td>
                    <td>
                      <span className={`badge ${p.status === 'active' ? 'badge-success' : p.status === 'planning' ? 'badge-info' : 'badge-danger'}`} style={{ textTransform: 'uppercase' }}>
                        {p.status}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{p.created_at.substring(0, 10)}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={() => openEditProjectModal(p)} className="btn-secondary" style={{ padding: '6px 10px', fontSize: '0.7rem' }}>
                          <Edit2 size={12} /> Edit
                        </button>
                        <button onClick={() => openProjectPlansModal(p)} className="btn-secondary" style={{ padding: '6px 10px', fontSize: '0.7rem', color: 'var(--color-primary)', borderColor: 'rgba(50, 71, 58, 0.2)' }}>
                          <ClipboardList size={12} /> Plans
                        </button>
                        <button onClick={() => openProjectMediaModal(p)} className="btn-secondary" style={{ padding: '6px 10px', fontSize: '0.7rem', color: '#8b5cf6', borderColor: 'rgba(139, 92, 246, 0.2)' }}>
                          <Monitor size={12} /> Media
                        </button>
                        <button onClick={() => handleDeleteProject(p.id)} className="btn-secondary" style={{ padding: '6px 10px', fontSize: '0.7rem', color: 'var(--color-danger)', borderColor: 'rgba(239, 68, 68, 0.2)' }}>
                          <Trash2 size={12} /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Tab Content: UNITS ── */}
      {activeTab === 'units' && (
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
          <table className="premium-table">
            <thead>
              <tr>
                <th>Unit Number</th>
                <th>Project</th>
                <th>Floor</th>
                <th>Type</th>
                <th>Price</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUnits.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>No units found.</td>
                </tr>
              ) : (
                filteredUnits.map((un) => (
                  <tr key={un.id}>
                    <td><strong style={{ fontSize: '0.9rem', color: 'var(--text-main)' }}>Unit {un.unit_number}</strong></td>
                    <td>{un.project?.name || <span style={{ color: 'var(--text-muted)' }}>No Project</span>}</td>
                    <td>Floor {un.floor}</td>
                    <td style={{ textTransform: 'capitalize' }}>{un.type}</td>
                    <td style={{ fontWeight: 700 }}>EGP {Number(un.price).toLocaleString()}</td>
                    <td>
                      <span className={`badge ${un.status === 'available' ? 'badge-success' :
                          un.status === 'reserved' ? 'badge-info' :
                            un.status === 'sold' ? 'badge-danger' : 'badge-danger'
                        }`} style={{ textTransform: 'uppercase' }}>
                        {un.status}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={() => openEditUnitModal(un)} className="btn-secondary" style={{ padding: '6px 10px', fontSize: '0.7rem' }}>
                          <Edit2 size={12} /> Edit
                        </button>
                        <button onClick={() => handleDeleteUnit(un.id)} className="btn-secondary" style={{ padding: '6px 10px', fontSize: '0.7rem', color: 'var(--color-danger)', borderColor: 'rgba(239, 68, 68, 0.2)' }}>
                          <Trash2 size={12} /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Tab Content: CRM LEADS ── */}
      {activeTab === 'leads' && (
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
          <table className="premium-table">
            <thead>
              <tr>
                <th>Lead Identity</th>
                <th>Phone Number</th>
                <th>Assigned Agent</th>
                <th>Pipeline Status</th>
                <th>Lead Score</th>
                <th>Source</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>No leads found.</td>
                </tr>
              ) : (
                filteredLeads.map((l) => (
                  <tr key={l.id}>
                    <td>
                      <div>
                        <strong style={{ fontSize: '0.9rem', color: 'var(--text-main)' }}>{l.first_name} {l.last_name}</strong>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{l.email || 'No email'}</div>
                      </div>
                    </td>
                    <td>{l.phone}</td>
                    <td>{l.agent?.name || <span style={{ color: 'var(--text-muted)' }}>Unassigned</span>}</td>
                    <td>
                      <span className="badge badge-info" style={{ textTransform: 'uppercase' }}>
                        {l.status}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontWeight: 800, color: l.lead_score >= 70 ? 'var(--color-success)' : 'var(--text-main)' }}>
                        {l.lead_score} pts
                      </span>
                    </td>
                    <td style={{ textTransform: 'capitalize' }}>{l.source}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={() => openEditLeadModal(l)} className="btn-secondary" style={{ padding: '6px 10px', fontSize: '0.7rem' }}>
                          <Edit2 size={12} /> Edit
                        </button>
                        <button onClick={() => handleDeleteLead(l.id)} className="btn-secondary" style={{ padding: '6px 10px', fontSize: '0.7rem', color: 'var(--color-danger)', borderColor: 'rgba(239, 68, 68, 0.2)' }}>
                          <Trash2 size={12} /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Tab Content: MAINTENANCE TICKETS ── */}
      {activeTab === 'tickets' && (
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
          <table className="premium-table">
            <thead>
              <tr>
                <th>Ticket Info</th>
                <th>Client Name</th>
                <th>Unit Number</th>
                <th>Category</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTickets.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>No maintenance tickets found.</td>
                </tr>
              ) : (
                filteredTickets.map((t) => (
                  <tr key={t.id}>
                    <td>
                      <div>
                        <strong style={{ fontSize: '0.9rem', color: 'var(--text-main)' }}>{t.title}</strong>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.description}</div>
                      </div>
                    </td>
                    <td>{t.client?.name || <span style={{ color: 'var(--text-muted)' }}>Unknown</span>}</td>
                    <td>{t.unit ? `Unit ${t.unit.unit_number}` : <span style={{ color: 'var(--text-muted)' }}>—</span>}</td>
                    <td style={{ textTransform: 'capitalize' }}>{t.category}</td>
                    <td>
                      <span className={`badge ${t.priority === 'critical' || t.priority === 'high' ? 'badge-danger' :
                          t.priority === 'medium' ? 'badge-info' : 'badge-success'
                        }`} style={{ textTransform: 'uppercase' }}>
                        {t.priority}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${t.status === 'open' ? 'badge-danger' : t.status === 'resolved' || t.status === 'closed' ? 'badge-success' : 'badge-info'}`} style={{ textTransform: 'uppercase' }}>
                        {t.status}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={() => openEditTicketModal(t)} className="btn-secondary" style={{ padding: '6px 10px', fontSize: '0.7rem' }}>
                          <Edit2 size={12} /> Edit
                        </button>
                        <button onClick={() => handleDeleteTicket(t.id)} className="btn-secondary" style={{ padding: '6px 10px', fontSize: '0.7rem', color: 'var(--color-danger)', borderColor: 'rgba(239, 68, 68, 0.2)' }}>
                          <Trash2 size={12} /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Tab Content: AUDIT LOGS ── */}
      {activeTab === 'audit_logs' && (
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
          <table className="premium-table">
            <thead>
              <tr>
                <th>Log Timestamp</th>
                <th>Operator User</th>
                <th>Event Action</th>
                <th>IP Address</th>
                <th>Event Payload Details</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>No audit logs recorded in system.</td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id}>
                    <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{log.created_at}</td>
                    <td>{log.user?.name || <span style={{ color: 'var(--text-muted)' }}>System / Guest</span>}</td>
                    <td><span className="badge badge-info" style={{ fontWeight: 800 }}>{log.action}</span></td>
                    <td style={{ fontSize: '0.75rem' }}>{log.ip_address || '—'}</td>
                    <td>
                      <code style={{ fontSize: '0.7rem', background: 'rgba(0,0,0,0.05)', padding: '2px 6px', borderRadius: '4px', display: 'block', maxWidth: '350px', overflowX: 'auto', whiteSpace: 'nowrap' }}>
                        {JSON.stringify(log.details)}
                      </code>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Tab Content: ACTIVE SESSIONS ── */}
      {activeTab === 'sessions' && (
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
          <table className="premium-table">
            <thead>
              <tr>
                <th>Logged-In User</th>
                <th>Security Role</th>
                <th>Device / Browser (User Agent)</th>
                <th>Created At</th>
                <th>Last Active Time</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSessions.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>No active user sessions found.</td>
                </tr>
              ) : (
                filteredSessions.map((session) => (
                  <tr key={session.id}>
                    <td>
                      <div>
                        <strong style={{ fontSize: '0.9rem', color: 'var(--text-main)' }}>{session.user_name}</strong>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{session.user_email}</div>
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-info" style={{ textTransform: 'capitalize', fontWeight: 700 }}>
                        {(session.user_role || '').replace('_', ' ')}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={session.user_agent}>
                        {session.user_agent || 'Unknown Client'}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {session.created_at ? session.created_at.substring(0, 19).replace('T', ' ') : '—'}
                    </td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {session.last_used_at ? session.last_used_at.substring(0, 19).replace('T', ' ') : 'Active Now'}
                    </td>
                    <td>
                      <button
                        onClick={() => handleRevokeSession(session.id)}
                        className="btn-secondary"
                        style={{ padding: '6px 10px', fontSize: '0.7rem', color: 'var(--color-danger)', borderColor: 'rgba(239, 68, 68, 0.2)' }}
                      >
                        <ShieldAlert size={12} style={{ marginRight: '4px' }} /> Force Logout
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Tab Content: SYSTEM HEALTH ── */}
      {activeTab === 'health' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* Main indicators grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>

            {/* Database Connection */}
            <div className="glass-panel" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{
                width: '48px', height: '48px', borderRadius: '50%',
                background: systemHealth?.db_connected ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <Building2 style={{
                  color: systemHealth?.db_connected ? 'var(--color-success)' : 'var(--color-danger)',
                  width: '24px', height: '24px'
                }} />
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 }}>Database Status</h4>
                <span style={{ fontSize: '1.15rem', fontWeight: 800, color: systemHealth?.db_connected ? 'var(--color-success)' : 'var(--color-danger)', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: systemHealth?.db_connected ? 'var(--color-success)' : 'var(--color-danger)', display: 'inline-block' }} />
                  {systemHealth?.db_connected ? 'Connected' : 'Offline / Failed'}
                </span>
              </div>
            </div>

            {/* Cache Status */}
            <div className="glass-panel" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{
                width: '48px', height: '48px', borderRadius: '50%',
                background: 'rgba(59,130,246,0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <Settings style={{ color: 'var(--color-primary)', width: '24px', height: '24px' }} />
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 }}>Cache Engine</h4>
                <span style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)', display: 'block', marginTop: '4px' }}>
                  {systemHealth?.cache_status || 'File Driver'}
                </span>
              </div>
            </div>

            {/* API Average Response Time */}
            <div className="glass-panel" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{
                width: '48px', height: '48px', borderRadius: '50%',
                background: 'rgba(99,102,241,0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <Activity style={{ color: 'var(--color-secondary)', width: '24px', height: '24px' }} />
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 }}>Avg Response</h4>
                <span style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)', display: 'block', marginTop: '4px' }}>
                  {systemHealth?.response_time_ms || 0} ms
                </span>
              </div>
            </div>

            {/* API Error Counts */}
            <div className="glass-panel" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{
                width: '48px', height: '48px', borderRadius: '50%',
                background: systemHealth?.api_error_count && systemHealth.api_error_count > 0 ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <ShieldAlert style={{
                  color: systemHealth?.api_error_count && systemHealth.api_error_count > 0 ? 'var(--color-danger)' : 'var(--color-success)',
                  width: '24px', height: '24px'
                }} />
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 }}>DB Log Failures</h4>
                <span style={{ fontSize: '1.15rem', fontWeight: 800, color: systemHealth?.api_error_count && systemHealth.api_error_count > 0 ? 'var(--color-danger)' : 'var(--color-success)', display: 'block', marginTop: '4px' }}>
                  {systemHealth?.api_error_count || 0} Failures
                </span>
              </div>
            </div>

          </div>

          {/* Disk & Memory resource usage */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>

            {/* Disk space card */}
            <div className="glass-panel" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '16px', color: 'var(--text-main)' }}>💿 Hard Disk Storage Space</h3>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '8px', color: 'var(--text-muted)' }}>
                <span>Free Space: {systemHealth?.disk_free_gb || 0} GB</span>
                <span>Total: {systemHealth?.disk_total_gb || 0} GB</span>
              </div>
              <div style={{ width: '100%', height: '14px', background: 'rgba(0,0,0,0.06)', borderRadius: '10px', overflow: 'hidden', position: 'relative' }}>
                <div style={{
                  width: `${systemHealth?.disk_usage_percent || 0}%`,
                  height: '100%',
                  background: (systemHealth?.disk_usage_percent || 0) > 85 ? 'var(--color-danger)' : (systemHealth?.disk_usage_percent || 0) > 65 ? '#f59e0b' : 'var(--color-success)',
                  borderRadius: '10px',
                  transition: 'width 0.4s ease'
                }} />
              </div>
              <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Dynamic server partition calculation</span>
                <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-main)' }}>{systemHealth?.disk_usage_percent || 0}% Used</span>
              </div>
            </div>

            {/* Memory Usage card */}
            <div className="glass-panel" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '16px', color: 'var(--text-main)' }}>🧠 PHP Server Memory Footprint</h3>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '8px', color: 'var(--text-muted)' }}>
                <span>Allocated Memory: {systemHealth?.memory_usage_mb || 0} MB</span>
                <span>Max Limit: {systemHealth?.memory_limit || '128M'}</span>
              </div>
              <div style={{ width: '100%', height: '14px', background: 'rgba(0,0,0,0.06)', borderRadius: '10px', overflow: 'hidden', position: 'relative' }}>
                <div style={{
                  width: `${Math.min(((systemHealth?.memory_usage_mb || 0) / 128) * 100, 100)}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, var(--color-primary), var(--color-secondary))',
                  borderRadius: '10px',
                  transition: 'width 0.4s ease'
                }} />
              </div>
              <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Garbage collection active</span>
                <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-main)' }}>
                  {(() => {
                    if (!systemHealth) return '0%';
                    const limitStr = systemHealth.memory_limit;
                    if (!limitStr || limitStr === '-1') return 'Unlimited';
                    const match = limitStr.match(/^(\d+)([MGT]?)$/i);
                    if (!match) return '—';
                    let limitNum = parseInt(match[1]);
                    const unit = match[2].toUpperCase();
                    if (unit === 'G') limitNum *= 1024;
                    if (unit === 'T') limitNum *= 1024 * 1024;
                    if (limitNum <= 0) return 'Unlimited';
                    return `${Math.round(((systemHealth.memory_usage_mb || 0) / limitNum) * 100)}%`;
                  })()} Used
                </span>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* ── Tab Content: CONFIGURATIONS ── */}
      {activeTab === 'configs' && (
        <form onSubmit={handleSaveConfigs} className="glass-panel" style={{ padding: '35px', display: 'flex', flexDirection: 'column', gap: '35px' }}>

          {/* Section 1: Branding & Identity */}
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, borderBottom: '1.5px solid var(--border-glass)', paddingBottom: '10px', marginBottom: '20px', color: 'var(--color-primary)' }}>
              🖼️ System Branding & Identity
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '30px' }}>

              {/* Form inputs */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 700 }}>System Platform Name</label>
                  <input
                    type="text"
                    className="form-control"
                    value={configs.system_name || ''}
                    onChange={(e) => updateConfigKey('system_name', e.target.value)}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <div className="form-group">
                    <label className="form-label" style={{ fontWeight: 700 }}>Fallback Lucide Icon</label>
                    <select
                      className="form-control"
                      value={configs.system_icon_name || 'Building2'}
                      onChange={(e) => updateConfigKey('system_icon_name', e.target.value)}
                    >
                      <option value="Building2">Building2 (Default)</option>
                      <option value="Users">Users</option>
                      <option value="Wallet">Wallet</option>
                      <option value="Settings">Settings</option>
                      <option value="ShieldCheck">ShieldCheck</option>
                      <option value="Wrench">Wrench</option>
                      <option value="ShieldAlert">ShieldAlert</option>
                      <option value="Terminal">Terminal</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label" style={{ fontWeight: 700 }}>Upload Custom Icon File</label>
                    <div style={{ marginTop: '4px' }}>
                      <label className="custom-file-upload full-width">
                        <UploadCloud size={16} />
                        <span>Choose Icon Image</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleFileUpload(e, 'icon')}
                        />
                      </label>
                    </div>
                    {uploadingIcon && <span style={{ fontSize: '0.75rem', color: 'var(--color-primary)' }}>Uploading...</span>}
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 700 }}>Upload Custom Logo File</label>
                  <div style={{ marginTop: '4px' }}>
                    <label className="custom-file-upload full-width">
                      <UploadCloud size={16} />
                      <span>Choose Logo Image</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileUpload(e, 'logo')}
                      />
                    </label>
                  </div>
                  {uploadingLogo && <span style={{ fontSize: '0.75rem', color: 'var(--color-primary)' }}>Uploading...</span>}
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 700 }}>System Logo Image URL</label>
                  <input
                    type="text"
                    className="form-control"
                    value={configs.system_logo_url || ''}
                    onChange={(e) => updateConfigKey('system_logo_url', e.target.value)}
                    placeholder="https://example.com/logo.png"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 700 }}>System Custom Icon URL</label>
                  <input
                    type="text"
                    className="form-control"
                    value={configs.system_icon_url || ''}
                    onChange={(e) => updateConfigKey('system_icon_url', e.target.value)}
                    placeholder="https://example.com/icon.png"
                  />
                </div>
              </div>

              {/* Branding Live Preview */}
              <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px', background: 'rgba(255,255,255,0.4)', alignSelf: 'start' }}>
                <h4 style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                  👀 Sidebar Branding Preview
                </h4>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-md)', background: '#ffffff' }}>

                  {/* Icon/Logo render preview */}
                  {configs.system_logo_url ? (
                    <img
                      src={configs.system_logo_url}
                      alt="Logo Preview"
                      style={{ width: '38px', height: '38px', objectFit: 'contain', borderRadius: 'var(--radius-sm)' }}
                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    />
                  ) : configs.system_icon_url ? (
                    <img
                      src={configs.system_icon_url}
                      alt="Icon Preview"
                      style={{ width: '38px', height: '38px', objectFit: 'contain', borderRadius: 'var(--radius-sm)' }}
                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    />
                  ) : (
                    <div style={{ width: '38px', height: '38px', borderRadius: 'var(--radius-sm)', background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Building2 style={{ color: '#ffffff', width: '20px', height: '20px' }} />
                    </div>
                  )}

                  <div>
                    <h2 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-main)', lineHeight: '1.2', margin: 0 }}>
                      {configs.system_name || 'Ether REDP'}
                    </h2>
                    <span style={{ fontSize: '0.55rem', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.1em' }}>
                      PORTAL INTERFACE
                    </span>
                  </div>
                </div>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                  This preview renders the live system name, logo upload, or default icon as seen in the sidebar.
                </span>
              </div>

            </div>
          </div>

          {/* Section 2: SMTP Email Connection Gateway */}
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, borderBottom: '1.5px solid var(--border-glass)', paddingBottom: '10px', marginBottom: '20px', color: 'var(--color-primary)' }}>
              ✉️ SMTP Email Connection Gateway
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 700 }}>SMTP Mail Host</label>
                <input
                  type="text"
                  className="form-control"
                  value={configs.mail_host || ''}
                  onChange={(e) => updateConfigKey('mail_host', e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 700 }}>SMTP Mail Port</label>
                <input
                  type="text"
                  className="form-control"
                  value={configs.mail_port || ''}
                  onChange={(e) => updateConfigKey('mail_port', e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 700 }}>Encryption Protocol</label>
                <select
                  className="form-control"
                  value={configs.mail_encryption || 'tls'}
                  onChange={(e) => updateConfigKey('mail_encryption', e.target.value)}
                >
                  <option value="tls">TLS</option>
                  <option value="ssl">SSL</option>
                  <option value="none">None</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 700 }}>SMTP Username</label>
                <input
                  type="text"
                  className="form-control"
                  value={configs.mail_username || ''}
                  onChange={(e) => updateConfigKey('mail_username', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 700 }}>SMTP Password</label>
                <input
                  type="password"
                  className="form-control"
                  value={configs.mail_password || ''}
                  onChange={(e) => updateConfigKey('mail_password', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 700 }}>Sender From Name</label>
                <input
                  type="text"
                  className="form-control"
                  value={configs.mail_from_name || ''}
                  onChange={(e) => updateConfigKey('mail_from_name', e.target.value)}
                  required
                />
              </div>
              <div className="form-group" style={{ gridColumn: 'span 3' }}>
                <label className="form-label" style={{ fontWeight: 700 }}>Sender From Email Address</label>
                <input
                  type="email"
                  className="form-control"
                  value={configs.mail_from_address || ''}
                  onChange={(e) => updateConfigKey('mail_from_address', e.target.value)}
                  required
                />
              </div>
            </div>
          </div>

          {/* Section 3: Notification Rules & Routing */}
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, borderBottom: '1.5px solid var(--border-glass)', paddingBottom: '10px', marginBottom: '20px', color: 'var(--color-primary)' }}>
              🔔 System Event Notification Rules
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>

              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 700 }}>Enable Email Notifications</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '6px' }}>
                  <button
                    type="button"
                    onClick={() => updateConfigKey('enable_email_notifications', configs.enable_email_notifications === 'true' ? 'false' : 'true')}
                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', padding: 0 }}
                  >
                    {configs.enable_email_notifications === 'true' ? (
                      <ToggleRight size={38} style={{ color: 'var(--color-success)' }} />
                    ) : (
                      <ToggleLeft size={38} style={{ color: 'var(--text-muted)' }} />
                    )}
                  </button>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Send automated emails on transaction / system events.</span>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 700 }}>Enable In-App Notifications</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '6px' }}>
                  <button
                    type="button"
                    onClick={() => updateConfigKey('enable_app_notifications', configs.enable_app_notifications === 'true' ? 'false' : 'true')}
                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', padding: 0 }}
                  >
                    {configs.enable_app_notifications === 'true' ? (
                      <ToggleRight size={38} style={{ color: 'var(--color-success)' }} />
                    ) : (
                      <ToggleLeft size={38} style={{ color: 'var(--text-muted)' }} />
                    )}
                  </button>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Send instant alert boxes within the platform shell.</span>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 700 }}>CRM Lead Ingestion Notification Recipient</label>
                <select
                  className="form-control"
                  value={configs.notify_lead_creation_recipient || 'sales_agent'}
                  onChange={(e) => updateConfigKey('notify_lead_creation_recipient', e.target.value)}
                >
                  <option value="sales_agent">Assigned Sales Agent (Default)</option>
                  <option value="admin">System Admin Only</option>
                  <option value="all_sales">All Sales Representatives</option>
                </select>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Determines who receives notifications when a new lead registers or matches OCR KYC.</span>
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 700 }}>Maintenance Ticket Creation Notification Recipient</label>
                <select
                  className="form-control"
                  value={configs.notify_ticket_creation_recipient || 'delivery_engineer'}
                  onChange={(e) => updateConfigKey('notify_ticket_creation_recipient', e.target.value)}
                >
                  <option value="delivery_engineer">Delivery / Operations Engineer (Default)</option>
                  <option value="admin">System Admin Only</option>
                  <option value="vendor">Dispatch Direct to Vendor</option>
                </select>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Who is notified immediately when a homeowner submits a structural or utility maintenance snag.</span>
              </div>

              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label className="form-label" style={{ fontWeight: 700 }}>Payment Overdue & Collections Notification Recipient</label>
                <select
                  className="form-control"
                  value={configs.notify_payment_collection_recipient || 'finance_officer'}
                  onChange={(e) => updateConfigKey('notify_payment_collection_recipient', e.target.value)}
                >
                  <option value="finance_officer">Finance / Collections Officer (Default)</option>
                  <option value="admin">System Admin Only</option>
                  <option value="sales_agent">Sales Agent (for follow-up relationship)</option>
                </select>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Triggered when installment dates lapse past grace target windows.</span>
              </div>

            </div>
          </div>

          {/* Section 4: Platform Operations & Compliance */}
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, borderBottom: '1.5px solid var(--border-glass)', paddingBottom: '10px', marginBottom: '20px', color: 'var(--color-primary)' }}>
              ⚙️ Platform Operations & Compliance
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>

              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 700 }}>KYC Automatic Approval Scan</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '6px' }}>
                  <button
                    type="button"
                    onClick={() => updateConfigKey('kyc_auto_approve', configs.kyc_auto_approve === 'true' ? 'false' : 'true')}
                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', padding: 0 }}
                  >
                    {configs.kyc_auto_approve === 'true' ? (
                      <ToggleRight size={38} style={{ color: 'var(--color-success)' }} />
                    ) : (
                      <ToggleLeft size={38} style={{ color: 'var(--text-muted)' }} />
                    )}
                  </button>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {configs.kyc_auto_approve === 'true' ? 'Enabled: Auto-approve lead KYC scans if OCR similarity matches.' : 'Disabled: Manual review required for all lead KYC uploads.'}
                  </span>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 700 }}>Sandbox Developer Flag</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '6px' }}>
                  <button
                    type="button"
                    onClick={() => updateConfigKey('sandbox_mode', configs.sandbox_mode === 'true' ? 'false' : 'true')}
                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', padding: 0 }}
                  >
                    {configs.sandbox_mode === 'true' ? (
                      <ToggleRight size={38} style={{ color: 'var(--color-success)' }} />
                    ) : (
                      <ToggleLeft size={38} style={{ color: 'var(--text-muted)' }} />
                    )}
                  </button>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {configs.sandbox_mode === 'true' ? 'Active: Web fallbacks and mock logs allowed on DB error.' : 'Inactive: Production strict DB validation (no fallback logs).'}
                  </span>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 700 }}>Lead Assignment Routing Mode</label>
                <select
                  className="form-control"
                  value={configs.lead_assignment_mode}
                  onChange={(e) => updateConfigKey('lead_assignment_mode', e.target.value)}
                >
                  <option value="manual">Manual Agent Allocation (Default)</option>
                  <option value="round_robin">Automatic Round-Robin Routing</option>
                  <option value="score_based">Score-Based Matching Algorithms</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 700 }}>Default Broker Commission Rate (%)</label>
                <input
                  type="number"
                  step="0.05"
                  className="form-control"
                  value={configs.default_broker_commission_rate}
                  onChange={(e) => updateConfigKey('default_broker_commission_rate', e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 700 }}>Contractor SLA Dispatch Target (Hours)</label>
                <input
                  type="number"
                  className="form-control"
                  value={configs.maintenance_sla_hours}
                  onChange={(e) => updateConfigKey('maintenance_sla_hours', e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 700 }}>Value Added Tax (VAT) Rate (%)</label>
                <input
                  type="number"
                  step="0.1"
                  className="form-control"
                  value={configs.vat_rate}
                  onChange={(e) => updateConfigKey('vat_rate', e.target.value)}
                  required
                />
              </div>
              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label className="form-label" style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  ⚠️ System Maintenance Mode
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '6px', padding: '14px', background: 'rgba(239, 68, 68, 0.05)', border: '1px dashed rgba(239, 68, 68, 0.2)', borderRadius: 'var(--radius-md)' }}>
                  <button
                    type="button"
                    onClick={() => updateConfigKey('maintenance_mode', configs.maintenance_mode === 'true' ? 'false' : 'true')}
                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', padding: 0 }}
                  >
                    {configs.maintenance_mode === 'true' ? (
                      <ToggleRight size={38} style={{ color: 'var(--color-danger)' }} />
                    ) : (
                      <ToggleLeft size={38} style={{ color: 'var(--text-muted)' }} />
                    )}
                  </button>
                  <div>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: configs.maintenance_mode === 'true' ? 'var(--color-danger)' : 'var(--text-main)' }}>
                      {configs.maintenance_mode === 'true' ? 'Platform UNDER Maintenance' : 'Platform ONLINE'}
                    </span>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                      When enabled, all non-admin sessions will be blocked with a "503 Service Unavailable" error. Admins will retain access.
                    </p>
                  </div>
                </div>
              </div>

            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: '20px', display: 'flex', gap: '12px' }}>
            <button
              type="submit"
              className="btn-primary"
              style={{ width: '220px', justifyContent: 'center' }}
              disabled={savingConfigs}
            >
              <Save size={16} style={{ marginRight: '8px' }} />
              {savingConfigs ? 'Saving configs...' : 'Save Configurations'}
            </button>
          </div>
        </form>
      )}

      {/* ── MODALS CONTAINER ── */}

      {/* 👤 User CRUD Modal */}
      {showUserModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: '20px' }}>
          <div className="glass-panel" style={{ maxWidth: '480px', width: '100%', padding: '30px', position: 'relative', background: '#ffffff' }}>
            <button onClick={() => setShowUserModal(false)} style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
              <X size={18} />
            </button>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Users size={20} style={{ color: 'var(--color-primary)' }} />
              {userModalMode === 'add' ? 'Create System User Account' : 'Edit User Account'}
            </h3>

            <form onSubmit={handleUserSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Full Name</label>
                <input type="text" className="form-control" value={formUserName} onChange={e => setFormUserName(e.target.value)} required />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Email Address</label>
                <input type="email" className="form-control" value={formUserEmail} onChange={e => setFormUserEmail(e.target.value)} required />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Password {userModalMode === 'edit' && '(Leave blank to keep current)'}</label>
                <input type="password" className="form-control" value={formUserPassword} onChange={e => setFormUserPassword(e.target.value)} required={userModalMode === 'add'} />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Phone Number</label>
                <input type="text" className="form-control" value={formUserPhone} onChange={e => setFormUserPhone(e.target.value)} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Security Role</label>
                  <select className="form-control" value={formUserRole} onChange={e => setFormUserRole(e.target.value)}>
                    <option value="admin">System Admin</option>
                    <option value="tele_sales">Tier 1: Tele-Sales Agent</option>
                    <option value="broker">Tier 2: External Broker</option>
                    <option value="company_sales">Tier 3: Company Sales Representative</option>
                    <option value="sales_agent">Legacy Sales Agent</option>
                    <option value="finance_officer">Finance Officer</option>
                    <option value="delivery_engineer">Delivery Engineer</option>
                    <option value="client">Client (Homeowner)</option>
                  </select>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Status</label>
                  <select className="form-control" value={formUserStatus} onChange={e => setFormUserStatus(e.target.value)}>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '10px' }}>
                {userModalMode === 'add' ? 'Create Account' : 'Save Changes'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 🏗️ Project CRUD Modal */}
      {showProjectModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: '20px' }}>
          <div className="glass-panel" style={{ maxWidth: '480px', width: '100%', padding: '30px', position: 'relative', background: '#ffffff' }}>
            <button onClick={() => setShowProjectModal(false)} style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
              <X size={18} />
            </button>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Building2 size={20} style={{ color: 'var(--color-primary)' }} />
              {projectModalMode === 'add' ? 'Add New Project' : 'Edit Project Details'}
            </h3>

            <form onSubmit={handleProjectSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Project Name</label>
                <input type="text" className="form-control" value={formProjName} onChange={e => setFormProjName(e.target.value)} placeholder="e.g. Ether Heights" required />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Location Address</label>
                <input type="text" className="form-control" value={formProjLocation} onChange={e => setFormProjLocation(e.target.value)} placeholder="e.g. New Cairo" required />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Project Status</label>
                <select className="form-control" value={formProjStatus} onChange={e => setFormProjStatus(e.target.value)}>
                  <option value="planning">Planning & Development</option>
                  <option value="active">Active Sales / Construction</option>
                  <option value="completed">Completed & Handed Over</option>
                </select>
              </div>

              <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '10px' }}>
                {projectModalMode === 'add' ? 'Create Project' : 'Save Changes'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 🔑 Unit CRUD Modal */}
      {showUnitModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: '20px' }}>
          <div className="glass-panel" style={{ maxWidth: '600px', width: '100%', padding: '30px', position: 'relative', background: '#ffffff' }}>
            <button onClick={() => setShowUnitModal(false)} style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
              <X size={18} />
            </button>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Layers size={20} style={{ color: 'var(--color-primary)' }} />
              {unitModalMode === 'add' ? 'Create Inventory Unit' : 'Edit Unit Details'}
            </h3>

            <form onSubmit={handleUnitSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Associated Project</label>
                <select className="form-control" value={formUnitProjId} onChange={e => setFormUnitProjId(e.target.value)} required>
                  <option value="">Select Project...</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Building / Block</label>
                  <input type="text" className="form-control" value={formUnitBuilding} onChange={e => setFormUnitBuilding(e.target.value)} placeholder="e.g. Block A1" />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Unit Number</label>
                  <input type="text" className="form-control" value={formUnitNumber} onChange={e => setFormUnitNumber(e.target.value)} placeholder="e.g. 101" required />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Floor</label>
                  <input type="number" className="form-control" value={formUnitFloor} onChange={e => setFormUnitFloor(e.target.value)} required />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Total Area (m²)</label>
                  <input type="number" className="form-control" value={formUnitArea} onChange={e => setFormUnitArea(e.target.value)} placeholder="e.g. 150" required />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Bedrooms</label>
                  <input type="number" className="form-control" value={formUnitBedrooms} onChange={e => setFormUnitBedrooms(e.target.value)} min={0} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Bathrooms</label>
                  <input type="number" className="form-control" value={formUnitBathrooms} onChange={e => setFormUnitBathrooms(e.target.value)} min={0} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Unit Type</label>
                  <select className="form-control" value={formUnitType} onChange={e => setFormUnitType(e.target.value)}>
                    <option value="apartment">Apartment</option>
                    <option value="villa">Villa</option>
                    <option value="commercial">Commercial Space</option>
                    <option value="office">Office Room</option>
                    <option value="duplex">Duplex</option>
                    <option value="penthouse">Penthouse</option>
                  </select>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Unit Status</label>
                  <select className="form-control" value={formUnitStatus} onChange={e => setFormUnitStatus(e.target.value)}>
                    <option value="available">Available</option>
                    <option value="reserved">Reserved</option>
                    <option value="sold">Sold</option>
                    <option value="blocked">Blocked</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">View Type</label>
                  <select className="form-control" value={formUnitViewType} onChange={e => setFormUnitViewType(e.target.value)}>
                    <option value="garden">Garden View</option>
                    <option value="pool">Pool View</option>
                    <option value="street">Street View</option>
                    <option value="sea">Sea View</option>
                    <option value="landmark">Landmark View</option>
                  </select>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Selling Price (EGP)</label>
                  <input type="number" className="form-control" value={formUnitPrice} onChange={e => setFormUnitPrice(e.target.value)} required />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Unit Layout & Division (تقسيمة الشقة وتوزيع الغرف)</label>
                <textarea className="form-control" style={{ height: '70px', resize: 'none' }} value={formUnitLayoutDescription} onChange={e => setFormUnitLayoutDescription(e.target.value)} placeholder="e.g. 3 غرف، 2 حمام، ريسبشن قطعتين، مطبخ، تراس" />
              </div>

              {unitModalMode === 'edit' && selectedUnit && (
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontWeight: 700 }}>Unit Floor Plan Layout Image (صورة تقسيمة الشقة)</label>
                  <div style={{ marginTop: '4px' }}>
                    <label className="custom-file-upload full-width">
                      <UploadCloud size={16} />
                      <span>Choose Layout Image / اختر صورة التقسيمة</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleUploadUnitLayoutImage(selectedUnit.id, e)}
                      />
                    </label>
                  </div>
                  {uploadingUnitLayout && <span style={{ fontSize: '0.75rem', color: 'var(--color-primary)' }}>Uploading image...</span>}
                  {selectedUnit.layout_image_url && (
                    <div style={{ marginTop: '10px' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Current Layout Image:</span>
                      <img
                        src={selectedUnit.layout_image_url.startsWith('http') ? selectedUnit.layout_image_url : `http://127.0.0.1:8000/storage/${selectedUnit.layout_image_url}`}
                        alt="Unit Layout"
                        style={{ width: '100%', maxHeight: '150px', objectFit: 'contain', marginTop: '5px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-glass)' }}
                      />
                    </div>
                  )}
                </div>
              )}

              <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '10px' }}>
                {unitModalMode === 'add' ? 'Create Unit' : 'Save Changes'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 🟠 CRM Lead CRUD Modal */}
      {showLeadModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: '20px' }}>
          <div className="glass-panel" style={{ maxWidth: '480px', width: '100%', padding: '30px', position: 'relative', background: '#ffffff' }}>
            <button onClick={() => setShowLeadModal(false)} style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
              <X size={18} />
            </button>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <UserCheck size={20} style={{ color: 'var(--color-primary)' }} />
              {leadModalMode === 'add' ? 'Create Lead Profile' : 'Edit Lead Details'}
            </h3>

            <form onSubmit={handleLeadSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">First Name</label>
                  <input type="text" className="form-control" value={formLeadFirstName} onChange={e => setFormLeadFirstName(e.target.value)} required />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Last Name</label>
                  <input type="text" className="form-control" value={formLeadLastName} onChange={e => setFormLeadLastName(e.target.value)} required />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Email Address</label>
                <input type="email" className="form-control" value={formLeadEmail} onChange={e => setFormLeadEmail(e.target.value)} />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Phone Number</label>
                <input type="text" className="form-control" value={formLeadPhone} onChange={e => setFormLeadPhone(e.target.value)} required />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Assigned Sales Agent</label>
                  <select className="form-control" value={formLeadAgentId} onChange={e => setFormLeadAgentId(e.target.value)}>
                    <option value="">Unassigned...</option>
                    {users.filter(u => u.role === 'sales_agent' || u.role === 'admin').map(u => (
                      <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Lead Score</label>
                  <input type="number" className="form-control" value={formLeadScore} onChange={e => setFormLeadScore(e.target.value)} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Lead Pipeline Status</label>
                  <select className="form-control" value={formLeadStatus} onChange={e => setFormLeadStatus(e.target.value)}>
                    <option value="new">New Lead</option>
                    <option value="contacted">Contacted</option>
                    <option value="interested">Interested</option>
                    <option value="visit_scheduled">Visit Scheduled</option>
                    <option value="negotiation">Negotiation</option>
                    <option value="reserved">Reserved Unit</option>
                    <option value="contracted">Contract Signed</option>
                  </select>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Source Ingestion</label>
                  <select className="form-control" value={formLeadSource} onChange={e => setFormLeadSource(e.target.value)}>
                    <option value="direct">Direct Traffic</option>
                    <option value="facebook">Facebook Ads</option>
                    <option value="google">Google Campaign</option>
                    <option value="tiktok">TikTok Campaign</option>
                    <option value="referral">Broker Referral</option>
                  </select>
                </div>
              </div>

              <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '10px' }}>
                {leadModalMode === 'add' ? 'Create Lead' : 'Save Changes'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 🟢 Maintenance Ticket CRUD Modal */}
      {showTicketModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: '20px' }}>
          <div className="glass-panel" style={{ maxWidth: '480px', width: '100%', padding: '30px', position: 'relative', background: '#ffffff' }}>
            <button onClick={() => setShowTicketModal(false)} style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
              <X size={18} />
            </button>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertCircle size={20} style={{ color: 'var(--color-primary)' }} />
              {ticketModalMode === 'add' ? 'Log Maintenance Ticket' : 'Edit Ticket Details'}
            </h3>

            <form onSubmit={handleTicketSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Client (Homeowner)</label>
                  <select className="form-control" value={formTicketClientId} onChange={e => setFormTicketClientId(e.target.value)} required>
                    <option value="">Select Client...</option>
                    {users.map(u => (
                      <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                    ))}
                  </select>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Assigned Unit</label>
                  <select className="form-control" value={formTicketUnitId} onChange={e => setFormTicketUnitId(e.target.value)} required>
                    <option value="">Select Unit...</option>
                    {units.map(un => (
                      <option key={un.id} value={un.id}>Unit {un.unit_number} ({un.project?.name || 'No Project'})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Category</label>
                  <select className="form-control" value={formTicketCategory} onChange={e => setFormTicketCategory(e.target.value)}>
                    <option value="plumbing">Plumbing Works</option>
                    <option value="electrical">Electrical Repair</option>
                    <option value="structural">Structural / Civil</option>
                    <option value="other">Other Repairs</option>
                  </select>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Priority</label>
                  <select className="form-control" value={formTicketPriority} onChange={e => setFormTicketPriority(e.target.value)}>
                    <option value="low">Low Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="high">High Priority</option>
                    <option value="critical">Critical (Immediate Dispatch)</option>
                  </select>
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Ticket Headline Title</label>
                <input type="text" className="form-control" value={formTicketTitle} onChange={e => setFormTicketTitle(e.target.value)} placeholder="e.g. Master Bedroom Ceiling Leak" required />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Detailed Fault Description</label>
                <textarea className="form-control" style={{ minHeight: '80px', padding: '10px' }} value={formTicketDesc} onChange={e => setFormTicketDesc(e.target.value)} required />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Ticket Status</label>
                <select className="form-control" value={formTicketStatus} onChange={e => setFormTicketStatus(e.target.value)}>
                  <option value="open">Open (New Log)</option>
                  <option value="assigned">Assigned / Dispatching</option>
                  <option value="resolved">Resolved / Fixed</option>
                  <option value="closed">Closed / Confirmed</option>
                </select>
              </div>

              <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '10px' }}>
                {ticketModalMode === 'add' ? 'Log Ticket' : 'Save Changes'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 💳 Project Standard Payment Plans Modal */}
      {showPlansModal && selectedProjectForPlans && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: '20px' }}>
          <div className="glass-panel" style={{ maxWidth: '750px', width: '100%', padding: '30px', position: 'relative', background: '#ffffff', maxHeight: '85vh', overflowY: 'auto' }}>
            <button onClick={() => { setShowPlansModal(false); setSelectedProjectForPlans(null); }} style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
              <X size={18} />
            </button>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ClipboardList size={20} style={{ color: 'var(--color-primary)' }} />
                Standard Payment Plans: {selectedProjectForPlans.name}
              </h3>
              <button onClick={openAddPlanModal} className="btn-primary" style={{ padding: '6px 12px', fontSize: '0.75rem' }}>
                <Plus size={12} style={{ marginRight: '4px' }} /> Add Template
              </button>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table className="premium-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Name (AR)</th>
                    <th>Down Payment</th>
                    <th>Term (Months)</th>
                    <th>Discount</th>
                    <th>Description</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {projectPlans.filter(p => p.project_id === selectedProjectForPlans.id).length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>No standard payment plan templates configured.</td>
                    </tr>
                  ) : (
                    projectPlans.filter(p => p.project_id === selectedProjectForPlans.id).map((plan) => (
                      <tr key={plan.id}>
                        <td><strong>{plan.name}</strong></td>
                        <td>{plan.name_ar}</td>
                        <td>{plan.down_payment_pct}%</td>
                        <td>{plan.installments} months</td>
                        <td>{plan.discount_pct}%</td>
                        <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{plan.description || '—'}</td>
                        <td>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button onClick={() => openEditPlanModal(plan)} className="btn-secondary" style={{ padding: '4px 8px', fontSize: '0.65rem' }}>
                              <Edit2 size={10} /> Edit
                            </button>
                            <button onClick={() => handleDeletePlan(plan.id)} className="btn-secondary" style={{ padding: '4px 8px', fontSize: '0.65rem', color: 'var(--color-danger)', borderColor: 'rgba(239, 68, 68, 0.2)' }}>
                              <Trash2 size={10} /> Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button onClick={() => { setShowPlansModal(false); setSelectedProjectForPlans(null); }} className="btn-secondary" style={{ padding: '8px 16px', fontSize: '0.8rem' }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 💳 Payment Plan Form Modal */}
      {showPlanFormModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 210, padding: '20px' }}>
          <div className="glass-panel sidebar-scroll-container" style={{ maxWidth: '850px', width: '100%', padding: '30px', position: 'relative', background: '#ffffff', maxHeight: '90vh', overflowY: 'auto' }}>
            <button onClick={() => setShowPlanFormModal(false)} style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
              <X size={18} />
            </button>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ClipboardList size={18} style={{ color: 'var(--color-primary)' }} />
              {planFormMode === 'add' ? 'Add Payment Plan Template' : 'Edit Payment Plan Template'}
            </h3>

            <form onSubmit={handlePlanSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                {/* Column 1: Basic Details */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--color-primary)', borderBottom: '1px solid rgba(0,0,0,0.06)', paddingBottom: '6px', margin: 0 }}>
                    Basic Details / البيانات الأساسية
                  </h4>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Plan Name (English)</label>
                    <input type="text" className="form-control" value={formPlanName} onChange={e => setFormPlanName(e.target.value)} placeholder="e.g. 5-Year Plan" required />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Plan Name (Arabic)</label>
                    <input type="text" className="form-control" value={formPlanNameAr} onChange={e => setFormPlanNameAr(e.target.value)} placeholder="e.g. خطة 5 سنوات" required />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Down Payment (%)</label>
                      <input type="number" className="form-control" value={formPlanDownPaymentPct} onChange={e => setFormPlanDownPaymentPct(e.target.value)} min="0" max="100" required />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Discount (%)</label>
                      <input type="number" className="form-control" value={formPlanDiscountPct} onChange={e => setFormPlanDiscountPct(e.target.value)} min="0" max="100" required />
                    </div>
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Installments count (Months)</label>
                    <input type="number" className="form-control" value={formPlanInstallments} onChange={e => setFormPlanInstallments(e.target.value)} min="0" placeholder="e.g. 60 for 5 years" required />
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Description</label>
                    <textarea className="form-control" style={{ minHeight: '80px', padding: '8px' }} value={formPlanDescription} onChange={e => setFormPlanDescription(e.target.value)} placeholder="Brief terms explanation..." />
                  </div>
                </div>

                {/* Column 2: Advanced Settings */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--color-primary)', borderBottom: '1px solid rgba(0,0,0,0.06)', paddingBottom: '6px', margin: 0 }}>
                    Advanced Settings / التفاصيل المتقدمة
                  </h4>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Payment Method</label>
                      <select className="form-control" value={formPlanFinalPaymentMethod} onChange={e => setFormPlanFinalPaymentMethod(e.target.value as 'cash' | 'installment')}>
                        <option value="installment">Installment / تقسيط</option>
                        <option value="cash">Cash / كاش</option>
                      </select>
                    </div>
                    {formPlanFinalPaymentMethod === 'cash' ? (
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Cash Grace Period (Days)</label>
                        <input type="number" className="form-control" value={formPlanCashGracePeriod} onChange={e => setFormPlanCashGracePeriod(e.target.value)} min="0" />
                      </div>
                    ) : (
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Installment Type</label>
                        <select className="form-control" value={formPlanInstallmentType} onChange={e => setFormPlanInstallmentType(e.target.value as 'direct' | 'bank')}>
                          <option value="direct">Direct / مباشر</option>
                          <option value="bank">Bank Finance / تمويل عقاري</option>
                        </select>
                      </div>
                    )}
                  </div>

                  {formPlanFinalPaymentMethod === 'installment' && (
                    <>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label className="form-label">Interest Type</label>
                          <select className="form-control" value={formPlanInterestType} onChange={e => setFormPlanInterestType(e.target.value as 'flat' | 'reducing')}>
                            <option value="reducing">Reducing / متناقصة</option>
                            <option value="flat">Flat / ثابته</option>
                          </select>
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label className="form-label">Interest Rate (%) p.a.</label>
                          <input type="number" step="0.1" className="form-control" value={formPlanInstallmentInterest} onChange={e => setFormPlanInstallmentInterest(e.target.value)} min="0" />
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label className="form-label">Start Month</label>
                          <input type="number" className="form-control" value={formPlanInstallmentStartMonth} onChange={e => setFormPlanInstallmentStartMonth(e.target.value)} min="1" />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', marginTop: '15px' }}>
                            <input type="checkbox" checked={formPlanEnableAnnual} onChange={e => setFormPlanEnableAnnual(e.target.checked)} />
                            <span>Annual Payments / دفعات سنوية</span>
                          </label>
                        </div>
                      </div>

                      {formPlanEnableAnnual && (
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label className="form-label">Annual Installment Amount (EGP)</label>
                          <input type="number" className="form-control" value={formPlanAnnualInstallmentAmount} onChange={e => setFormPlanAnnualInstallmentAmount(e.target.value)} />
                        </div>
                      )}
                    </>
                  )}

                  {/* Add-ons default config */}
                  <div style={{ padding: '10px 14px', background: 'rgba(50, 71, 58, 0.03)', border: '1px solid rgba(50, 71, 58, 0.08)', borderRadius: 'var(--radius-sm)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Default Included Add-ons</div>
                    
                    {/* Club Toggle */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' }}>
                        <input type="checkbox" checked={formPlanIncludeClub} onChange={e => setFormPlanIncludeClub(e.target.checked)} />
                        <span>Club Membership / اشتراك نادي</span>
                      </label>
                      {formPlanIncludeClub && (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '4px' }}>
                          <input type="number" className="form-control" style={{ fontSize: '0.72rem', padding: '4px 6px', height: '26px' }} placeholder="Cost" value={formPlanClubCost} onChange={e => setFormPlanClubCost(e.target.value)} />
                          <select className="form-control" style={{ fontSize: '0.72rem', padding: '4px 6px', height: '26px' }} value={formPlanClubPaymentMethod} onChange={e => setFormPlanClubPaymentMethod(e.target.value as 'cash' | 'installment')}>
                            <option value="cash">Cash / كاش</option>
                            <option value="installment">Installment / تقسيط</option>
                          </select>
                        </div>
                      )}
                    </div>

                    {/* Garage Toggle */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' }}>
                        <input type="checkbox" checked={formPlanIncludeGarage} onChange={e => setFormPlanIncludeGarage(e.target.checked)} />
                        <span>Garage Access / جراج</span>
                      </label>
                      {formPlanIncludeGarage && (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '4px' }}>
                          <input type="number" className="form-control" style={{ fontSize: '0.72rem', padding: '4px 6px', height: '26px' }} placeholder="Cost" value={formPlanGarageCost} onChange={e => setFormPlanGarageCost(e.target.value)} />
                          <select className="form-control" style={{ fontSize: '0.72rem', padding: '4px 6px', height: '26px' }} value={formPlanGaragePaymentMethod} onChange={e => setFormPlanGaragePaymentMethod(e.target.value as 'cash' | 'installment')}>
                            <option value="cash">Cash / كاش</option>
                            <option value="installment">Installment / تقسيط</option>
                          </select>
                        </div>
                      )}
                    </div>

                    {/* Maintenance Toggle */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' }}>
                        <input type="checkbox" checked={formPlanIncludeMaintenance} onChange={e => setFormPlanIncludeMaintenance(e.target.checked)} />
                        <span>Maintenance Deposit / وديعة صيانة</span>
                      </label>
                      {formPlanIncludeMaintenance && (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '4px' }}>
                          <input type="number" className="form-control" style={{ fontSize: '0.72rem', padding: '4px 6px', height: '26px' }} placeholder="Cost" value={formPlanMaintenanceCost} onChange={e => setFormPlanMaintenanceCost(e.target.value)} />
                          <select className="form-control" style={{ fontSize: '0.72rem', padding: '4px 6px', height: '26px' }} value={formPlanMaintenancePaymentMethod} onChange={e => setFormPlanMaintenancePaymentMethod(e.target.value as 'cash' | 'installment')}>
                            <option value="cash">Cash / كاش</option>
                            <option value="installment">Installment / تقسيط</option>
                          </select>
                        </div>
                      )}
                    </div>

                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px', borderTop: '1px solid rgba(0,0,0,0.06)', paddingTop: '15px' }}>
                <button type="button" className="btn-secondary" onClick={() => setShowPlanFormModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary">
                  {planFormMode === 'add' ? 'Create Template' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 🖼️ Project Media CRUD Modal */}
      {showMediaModal && selectedProjectForMedia && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: '20px' }}>
          <div className="glass-panel" style={{ maxWidth: '800px', width: '100%', padding: '30px', position: 'relative', background: '#ffffff', maxHeight: '90vh', overflowY: 'auto' }}>
            <button onClick={() => { setShowMediaModal(false); setSelectedProjectForMedia(null); setProjectMedia(null); }} style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
              <X size={18} />
            </button>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid rgba(0,0,0,0.06)', paddingBottom: '12px' }}>
              <Building2 size={20} style={{ color: 'var(--color-primary)' }} />
              Project Media Gallery Manager: {selectedProjectForMedia.name}
            </h3>

            {mediaLoading ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px', flexDirection: 'column', gap: '12px' }}>
                <div className="animate-spin" style={{ width: '30px', height: '30px', border: '3px solid var(--color-primary)', borderTopColor: 'transparent', borderRadius: '50%' }} />
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Loading media assets...</span>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                
                {/* 1. Project Master Plan Image */}
                <div style={{ padding: '20px', background: 'rgba(0,61,166,0.03)', border: '1.5px solid rgba(0,61,166,0.08)', borderRadius: 'var(--radius-md)' }}>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--color-primary)', margin: '0 0 12px 0' }}>
                    1. Compound Master Plan Image (المخطط العام للكمبوند)
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '20px', alignItems: 'center' }}>
                    <div>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
                        This image represents the overall layout of the project compound and is displayed to the user in the first stage of the interactive 3D Unit Selector.
                      </p>
                      <div style={{ marginTop: '4px' }}>
                        <label className="custom-file-upload full-width">
                          <UploadCloud size={16} />
                          <span>Choose Master Plan / اختر المخطط العام</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleUploadProjectImage}
                          />
                        </label>
                      </div>
                      {uploadingMediaKey === 'project' && <span style={{ fontSize: '0.75rem', color: 'var(--color-primary)' }}>Uploading master plan...</span>}
                    </div>
                    <div>
                      {projectMedia?.project_image ? (
                        <div style={{ position: 'relative', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-glass)', overflow: 'hidden' }}>
                          <img
                            src={projectMedia.project_image}
                            alt="Master Plan"
                            style={{ width: '100%', maxHeight: '120px', objectFit: 'contain' }}
                          />
                        </div>
                      ) : (
                        <div style={{ height: '100px', background: 'rgba(0,0,0,0.05)', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px dashed var(--text-muted)' }}>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>No Master Plan Image</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* 2. Building & Floor Plan Images */}
                <div>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--color-primary)', margin: '0 0 6px 0' }}>
                    2. Buildings & Floor Layout Plans (المباني وتقسيم الأدوار)
                  </h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
                    Select a building to upload its rendering image and floor layouts. These floor plans should display the configuration of all apartments on that specific floor.
                  </p>

                  {/* Building setup form */}
                  <form onSubmit={handleSetupBuilding} style={{
                    marginBottom: '24px',
                    padding: '20px',
                    background: 'rgba(59,130,246,0.03)',
                    border: '1.5px solid rgba(59,130,246,0.1)',
                    borderRadius: 'var(--radius-md)',
                  }}>
                    <strong style={{ fontSize: '0.85rem', color: 'var(--color-primary)', display: 'block', marginBottom: '12px' }}>
                      🏗️ Setup Building/Block Structure (هيكلة وإضافة مبنى جديد)
                    </strong>
                    <div style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '15px',
                      alignItems: 'flex-end'
                    }}>
                      <div style={{ flex: '2 1 200px' }}>
                        <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Building / Block Name (اسم البلوك/العمارة):</label>
                        <input
                          type="text"
                          placeholder="e.g. Block A1, Block B"
                          className="form-control"
                          style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                          value={newBName}
                          onChange={(e) => setNewBName(e.target.value)}
                          required
                        />
                      </div>
                      <div style={{ flex: '1 1 100px' }}>
                        <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Total Floors (الأدوار):</label>
                        <input
                          type="number"
                          min="1"
                          max="50"
                          className="form-control"
                          style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                          value={newBFloors}
                          onChange={(e) => setNewBFloors(e.target.value)}
                          required
                        />
                      </div>
                      <div style={{ flex: '1.2 1 120px' }}>
                        <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Apartments / Floor:</label>
                        <input
                          type="number"
                          min="1"
                          max="20"
                          className="form-control"
                          style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                          value={newBUnits}
                          onChange={(e) => setNewBUnits(e.target.value)}
                          required
                        />
                      </div>
                      <button
                        type="submit"
                        className="btn-primary"
                        style={{ padding: '8px 16px', fontSize: '0.8rem', height: 'auto', background: 'var(--color-primary)' }}
                        disabled={isConfiguringB}
                      >
                        {isConfiguringB ? 'Configuring...' : 'Configure (هيكلة)'}
                      </button>
                    </div>
                  </form>

                  {(() => {
                    const uniqueBuildings = Array.from(new Set(units.filter(u => u.project_id === selectedProjectForMedia.id).map(u => u.building || 'Main Building')));

                    if (uniqueBuildings.length === 0) {
                      return (
                        <div style={{ textAlign: 'center', padding: '30px', background: 'rgba(0,0,0,0.02)', borderRadius: 'var(--radius-sm)', border: '1.5px dashed rgba(0,0,0,0.08)' }}>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            No buildings configured yet. Use the form above to add a building and structure its floors/apartments.
                          </span>
                        </div>
                      );
                    }

                    return (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        {uniqueBuildings.map((buildingName) => {
                          const floors = Array.from(new Set(units.filter(u => u.project_id === selectedProjectForMedia.id && (u.building === buildingName || (!u.building && buildingName === 'Main Building'))).map(u => u.floor))).sort((a, b) => a - b);
                          const bImage = projectMedia?.building_images?.[buildingName]?.image_url;

                          return (
                            <div key={buildingName} style={{ border: '1px solid rgba(0,0,0,0.08)', borderRadius: 'var(--radius-md)', padding: '18px', background: '#fbfbfb' }}>
                              
                              <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '20px', alignItems: 'center', borderBottom: '1px solid rgba(0,0,0,0.05)', paddingBottom: '12px', marginBottom: '12px' }}>
                                <div>
                                  <strong style={{ fontSize: '0.95rem', color: 'var(--text-main)' }}>🏢 {buildingName}</strong>
                                  <div style={{ marginTop: '8px' }}>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Upload Building Exterior Image:</label>
                                    <div style={{ marginTop: '4px' }}>
                                      <label className="custom-file-upload small full-width">
                                        <UploadCloud size={14} />
                                        <span>Choose Exterior Image</span>
                                        <input
                                          type="file"
                                          accept="image/*"
                                          onChange={(e) => handleUploadBuildingImage(buildingName, e)}
                                        />
                                      </label>
                                    </div>
                                    {uploadingMediaKey === `building-${buildingName}` && <span style={{ fontSize: '0.72rem', color: 'var(--color-primary)' }}>Uploading building photo...</span>}
                                  </div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                  {bImage ? (
                                    <img
                                      src={bImage}
                                      alt={buildingName}
                                      style={{ maxHeight: '70px', maxWidth: '100px', objectFit: 'contain', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border-glass)' }}
                                    />
                                  ) : (
                                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', background: 'rgba(0,0,0,0.05)', padding: '4px 8px', borderRadius: '4px' }}>No Building Image</span>
                                  )}
                                </div>
                              </div>

                              {/* 3D Model Generation Section */}
                              <div style={{
                                marginTop: '12px',
                                marginBottom: '20px',
                                padding: '14px 18px',
                                background: 'rgba(59,130,246,0.04)',
                                border: '1px solid rgba(59,130,246,0.12)',
                                borderRadius: 'var(--radius-md)',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                flexWrap: 'wrap',
                                gap: '12px'
                              }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Tripo AI 3D Model</span>
                                  {(() => {
                                    const building3D = building3DStatuses.find(b => b.building_name === buildingName);
                                    if (!bImage) {
                                      return <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Upload an image first to generate 3D model.</span>;
                                    }
                                    if (!building3D || !building3D.model_3d_status) {
                                      return <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>No 3D model generated yet.</span>;
                                    }

                                    const statusColors: Record<string, string> = {
                                      pending: '#f59e0b',
                                      processing: '#3b82f6',
                                      completed: '#10b981',
                                      failed: '#ef4444'
                                    };

                                    return (
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span style={{
                                          fontSize: '0.7rem',
                                          fontWeight: 700,
                                          textTransform: 'uppercase',
                                          color: statusColors[building3D.model_3d_status] || '#64748b',
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          gap: '4px'
                                        }}>
                                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: statusColors[building3D.model_3d_status] || '#64748b' }} />
                                          {building3D.model_3d_status}
                                        </span>
                                        {building3D.tripo_error_msg && (
                                          <span style={{ fontSize: '0.7rem', color: 'var(--color-danger)' }}>({building3D.tripo_error_msg})</span>
                                        )}
                                      </div>
                                    );
                                  })()}
                                  {(() => {
                                    const building3D = building3DStatuses.find(b => b.building_name === buildingName);
                                    const otherBuildingsWith3D = building3DStatuses.filter(b =>
                                      b.building_name !== buildingName &&
                                      b.model_3d_status === 'completed' &&
                                      b.media_id
                                    );

                                    if (!building3D || otherBuildingsWith3D.length === 0) return null;

                                    return (
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Or copy 3D model from:</span>
                                        <select
                                          className="form-control"
                                          style={{ padding: '2px 6px', fontSize: '0.72rem', width: 'auto', height: 'auto' }}
                                          onChange={async (e) => {
                                            const sourceMediaId = e.target.value;
                                            if (!sourceMediaId) return;
                                            try {
                                              const res = await api.post(`/admin/3d-models/${building3D.media_id}/copy-from`, {
                                                copy_from_media_id: sourceMediaId
                                              });
                                              alert(res.data.message);
                                              await fetch3DStatuses(selectedProjectForMedia.id);
                                            } catch (err: any) {
                                              alert(err.response?.data?.message || 'Failed to copy model');
                                            }
                                          }}
                                          defaultValue=""
                                        >
                                          <option value="">-- Select --</option>
                                          {otherBuildingsWith3D.map(b => (
                                            <option key={b.media_id} value={b.media_id}>{b.building_name}</option>
                                          ))}
                                        </select>
                                      </div>
                                    );
                                  })()}
                                </div>

                                <div>
                                  {(() => {
                                    const building3D = building3DStatuses.find(b => b.building_name === buildingName);
                                    const isGeneratingThis = is3DGenerating === buildingName;

                                    if (!bImage) return null;

                                    const isPreprocess = !!buildingPreprocess[buildingName];

                                    if (!building3D || !building3D.model_3d_status) {
                                      return (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-start' }}>
                                          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '0.75rem' }}>
                                            <input
                                              type="checkbox"
                                              checked={isPreprocess}
                                              onChange={(e) => setBuildingPreprocess(prev => ({ ...prev, [buildingName]: e.target.checked }))}
                                            />
                                            <span>Optimize 2D Plan with Gemini (تحسين المخطط بـ Gemini)</span>
                                          </label>
                                          <button
                                            type="button"
                                            className="btn-primary"
                                            style={{ padding: '6px 12px', fontSize: '0.75rem', background: 'var(--color-primary)' }}
                                            disabled={isGeneratingThis}
                                            onClick={() => handleGenerate3D(buildingName, isPreprocess)}
                                          >
                                            {isGeneratingThis ? 'Generating...' : 'Generate 3D'}
                                          </button>
                                        </div>
                                      );
                                    }

                                    if (building3D.model_3d_status === 'pending' || building3D.model_3d_status === 'processing') {
                                      return (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                          <div className="animate-spin" style={{ width: '14px', height: '14px', border: '2px solid var(--color-primary)', borderTopColor: 'transparent', borderRadius: '50%' }} />
                                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Generating 3D model...</span>
                                        </div>
                                      );
                                    }

                                    return (
                                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-start' }}>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '0.75rem' }}>
                                          <input
                                            type="checkbox"
                                            checked={isPreprocess}
                                            onChange={(e) => setBuildingPreprocess(prev => ({ ...prev, [buildingName]: e.target.checked }))}
                                          />
                                          <span>Optimize 2D Plan with Gemini (تحسين المخطط بـ Gemini)</span>
                                        </label>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                          <button
                                            type="button"
                                            className="btn-secondary"
                                            style={{ padding: '6px 12px', fontSize: '0.75rem' }}
                                            disabled={isGeneratingThis}
                                            onClick={() => handleRegenerate3D(building3D.media_id, buildingName, isPreprocess)}
                                          >
                                            {isGeneratingThis ? 'Regenerating...' : 'Regenerate'}
                                          </button>
                                          <button
                                            type="button"
                                            className="btn-secondary"
                                            style={{ padding: '6px 12px', fontSize: '0.75rem', color: 'var(--color-danger)', borderColor: 'rgba(239,68,68,0.2)' }}
                                            disabled={isGeneratingThis}
                                            onClick={() => handleDelete3D(building3D.media_id, buildingName)}
                                          >
                                            Delete
                                          </button>
                                        </div>
                                      </div>
                                    );
                                  })()}
                                </div>
                              </div>

                              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Floor & Apartment Layout Maps (مخططات الأدوار والشقق):</span>
                                {floors.map((floorNum) => {
                                  const refKey = `${buildingName}|${floorNum}`;
                                  const fImage = projectMedia?.floor_plan_images?.[refKey]?.image_url;
                                  const floorUnits = units.filter(u => u.project_id === selectedProjectForMedia.id && (u.building === buildingName || (!u.building && buildingName === 'Main Building')) && u.floor === floorNum);

                                  return (
                                    <div key={floorNum} style={{ display: 'flex', flexDirection: 'column', gap: '10px', background: '#ffffff', border: '1px solid rgba(0,0,0,0.06)', borderRadius: 'var(--radius-sm)', padding: '12px' }}>
                                      {/* Floor plan row */}
                                      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.2fr 2fr 1fr', gap: '15px', alignItems: 'center' }}>
                                        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)' }}>Floor {floorNum} layout map</span>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                          <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)' }}>Apartments:</span>
                                          <input
                                            type="number"
                                            min="0"
                                            max="100"
                                            defaultValue={floorUnits.length}
                                            id={`units-count-${buildingName}-${floorNum}`}
                                            style={{ width: '45px', padding: '2px 4px', fontSize: '0.72rem', borderRadius: '4px', border: '1px solid rgba(0,0,0,0.15)' }}
                                          />
                                          <button
                                            type="button"
                                            className="btn-primary"
                                            style={{ padding: '2px 6px', fontSize: '0.68rem', height: 'auto', background: 'var(--color-primary)' }}
                                            onClick={async () => {
                                              const inputVal = (document.getElementById(`units-count-${buildingName}-${floorNum}`) as HTMLInputElement)?.value;
                                              const newCount = parseInt(inputVal || '0', 10);
                                              try {
                                                const res = await api.post(`/admin/projects/${selectedProjectForMedia.id}/buildings/${buildingName}/floors/${floorNum}/setup-units`, {
                                                  count: newCount
                                                });
                                                alert(res.data.message);
                                                await fetchData();
                                                const mediaRes = await api.get(`/public/projects/${selectedProjectForMedia.id}/media`);
                                                if (mediaRes.data?.success) {
                                                  setProjectMedia(mediaRes.data.data);
                                                }
                                              } catch (err: any) {
                                                alert(err.response?.data?.message || 'Failed to setup units count.');
                                              }
                                            }}
                                          >
                                            Set
                                          </button>
                                        </div>
                                        <div>
                                          <label className="custom-file-upload small">
                                            <UploadCloud size={12} />
                                            <span>Choose Plan</span>
                                            <input
                                              type="file"
                                              accept="image/*"
                                              onChange={(e) => handleUploadFloorPlanImage(buildingName, floorNum, e)}
                                            />
                                          </label>
                                          {uploadingMediaKey === `floor-${refKey}` && <div style={{ fontSize: '0.7rem', color: 'var(--color-primary)', marginTop: '2px' }}>Uploading plan...</div>}
                                        </div>

                                        <div style={{ textAlign: 'right' }}>
                                          {fImage ? (
                                            <img
                                              src={fImage}
                                              alt={`Floor ${floorNum}`}
                                              style={{ maxHeight: '35px', maxWidth: '80px', objectFit: 'contain', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border-glass)' }}
                                            />
                                          ) : (
                                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>No floor plan</span>
                                          )}
                                        </div>
                                      </div>

                                      {/* Units layouts list */}
                                      {floorUnits.length > 0 && (
                                        <div style={{ paddingLeft: '15px', borderLeft: '2.5px solid rgba(0,61,166,0.1)', display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '4px' }}>
                                          <span style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                                            Apartments Layout Plans (مخططات الشقق):
                                          </span>
                                          {floorUnits.map((unit) => {
                                            const uImage = unit.layout_image_url;
                                            return (
                                              <div key={unit.id} style={{ background: '#fcfcfc', border: '1px dashed rgba(0,0,0,0.04)', borderRadius: '4px', padding: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 2fr 1fr', gap: '15px', alignItems: 'center' }}>
                                                  <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#4b5563' }}>
                                                    Unit {unit.unit_number} ({unit.type}) - <strong style={{ color: unit.status === 'available' ? 'var(--color-success)' : 'var(--color-danger)' }}>{unit.status.toUpperCase()}</strong>
                                                  </span>
                                                  <div>
                                                    <label className="custom-file-upload small">
                                                      <UploadCloud size={12} />
                                                      <span>Choose Layout</span>
                                                      <input
                                                        type="file"
                                                        accept="image/*"
                                                        onChange={(e) => handleUploadUnitLayoutImage(unit.id, e)}
                                                      />
                                                    </label>
                                                    {uploadingUnitLayout && <div style={{ fontSize: '0.65rem', color: 'var(--color-primary)', marginTop: '2px' }}>Uploading...</div>}
                                                  </div>
                                                  <div style={{ textAlign: 'right' }}>
                                                    {uImage ? (
                                                      <img
                                                        src={uImage.startsWith('http') ? uImage : `http://127.0.0.1:8000/storage/${uImage}`}
                                                        alt={`Unit ${unit.unit_number}`}
                                                        style={{ maxHeight: '25px', maxWidth: '60px', objectFit: 'contain', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border-glass)' }}
                                                      />
                                                    ) : (
                                                      <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>No layout plan</span>
                                                    )}
                                                  </div>
                                                </div>

                                                {/* Unit 3D Controls */}
                                                <div style={{
                                                  display: 'flex',
                                                  alignItems: 'center',
                                                  justifyContent: 'space-between',
                                                  background: 'rgba(59,130,246,0.02)',
                                                  border: '1px solid rgba(59,130,246,0.06)',
                                                  padding: '6px 10px',
                                                  borderRadius: '4px',
                                                  flexWrap: 'wrap',
                                                  gap: '8px'
                                                }}>
                                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                    <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 600 }}>3D Model:</span>
                                                    {uImage ? (
                                                      <>
                                                        {unit.model_3d_status ? (
                                                          <span style={{
                                                            fontSize: '0.65rem',
                                                            fontWeight: 700,
                                                            color: unit.model_3d_status === 'completed' ? '#10b981' : unit.model_3d_status === 'failed' ? '#ef4444' : '#f59e0b'
                                                          }}>
                                                            {unit.model_3d_status.toUpperCase()}
                                                          </span>
                                                        ) : (
                                                          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>NOT GENERATED</span>
                                                        )}
                                                        {unit.tripo_error_msg && (
                                                          <span style={{ fontSize: '0.65rem', color: '#ef4444' }} title={unit.tripo_error_msg}>({unit.tripo_error_msg.substring(0, 25)}...)</span>
                                                        )}
                                                      </>
                                                    ) : (
                                                      <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>NO IMAGE</span>
                                                    )}
                                                  </div>

                                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                    {uImage && (
                                                      <>
                                                        <button
                                                          type="button"
                                                          className="btn-primary"
                                                          style={{ padding: '2px 8px', fontSize: '0.68rem', height: 'auto', background: 'var(--color-primary)' }}
                                                          onClick={() => {
                                                            setEditorUnitId(unit.id);
                                                            setEditorUnitNumber(unit.unit_number);
                                                            setShowFloorPlanEditor(true);
                                                          }}
                                                        >
                                                          ✍️ {unit.model_3d_status === 'completed' ? 'Edit 3D Plan' : 'Build 3D Plan'}
                                                        </button>

                                                        {unit.model_3d_status === 'completed' && (
                                                          <>
                                                            {unit.model_3d_url && (
                                                              <a
                                                                href={unit.model_3d_url.startsWith('http') ? unit.model_3d_url : `http://127.0.0.1:8000/api/v1/public/units/${unit.id}/3d-model/file`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="btn-secondary"
                                                                style={{ padding: '2px 8px', fontSize: '0.68rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', height: 'auto' }}
                                                              >
                                                                View 3D
                                                              </a>
                                                            )}
                                                            <button
                                                              type="button"
                                                              className="btn-secondary"
                                                              style={{ padding: '2px 8px', fontSize: '0.68rem', color: 'var(--color-danger)', borderColor: 'rgba(239,68,68,0.2)', height: 'auto' }}
                                                              onClick={() => handleDeleteUnit3D(unit.id)}
                                                            >
                                                              Delete
                                                            </button>
                                                          </>
                                                        )}
                                                      </>
                                                    )}

                                                    {/* Copy unit layout dropdown */}
                                                    {(() => {
                                                      const otherUnitsWithLayout = units.filter(u =>
                                                        u.project_id === selectedProjectForMedia.id &&
                                                        u.id !== unit.id &&
                                                        u.layout_image_url
                                                      );

                                                      if (otherUnitsWithLayout.length === 0) return null;

                                                      return (
                                                        <select
                                                          className="form-control"
                                                          style={{ padding: '2px 4px', fontSize: '0.65rem', width: 'auto', height: 'auto', display: 'inline-block' }}
                                                          defaultValue=""
                                                          onChange={async (e) => {
                                                            const srcId = e.target.value;
                                                            if (!srcId) return;
                                                            try {
                                                              const res = await api.post(`/admin/units/${unit.id}/copy-3d-from`, {
                                                                copy_from_unit_id: srcId
                                                              });
                                                              alert(res.data.message);
                                                              await fetchData();
                                                            } catch (err: any) {
                                                              alert(err.response?.data?.message || 'Failed to copy layout');
                                                            }
                                                          }}
                                                        >
                                                          <option value="">Copy Layout From...</option>
                                                          {otherUnitsWithLayout.map(ou => (
                                                            <option key={ou.id} value={ou.id}>Unit {ou.unit_number} ({ou.building || 'Main'})</option>
                                                          ))}
                                                        </select>
                                                      );
                                                    })()}
                                                  </div>
                                                </div>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>

                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>

              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '25px', borderTop: '1px solid rgba(0,0,0,0.06)', paddingTop: '15px' }}>
              <button onClick={() => { setShowMediaModal(false); setSelectedProjectForMedia(null); setProjectMedia(null); }} className="btn-secondary" style={{ padding: '8px 20px', fontSize: '0.8rem' }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {showFloorPlanEditor && (
        <FloorPlanEditor
          unitId={editorUnitId}
          unitNumber={editorUnitNumber}
          onClose={() => setShowFloorPlanEditor(false)}
          onSuccess={fetchData}
        />
      )}
    </div>
  );
};

export default AdminPanel;
