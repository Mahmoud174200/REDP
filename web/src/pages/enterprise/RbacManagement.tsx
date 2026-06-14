import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import {
  Shield, Users, Key, FileText, Plus, Edit3, Trash2,
  Search, Check, X, Info, Sliders, Calendar, ShieldAlert, Copy
} from 'lucide-react';

interface Role {
  id: string; name: string; display_name: string; description: string | null;
  parent_role_id: string | null; company_id: string | null; is_system: boolean;
  level: number; status: string; parent_role?: Role | null; company?: any;
}

interface Permission {
  id: string; name: string; display_name: string; description: string | null;
  module: string; group_name: string | null;
}

interface PermissionTemplate {
  id: string; name: string; description: string | null; permissions: string[];
}

type Tab = 'roles' | 'matrix' | 'users' | 'templates';

const tabs: { key: Tab; label: string; icon: any }[] = [
  { key: 'roles', label: 'Roles CRUD', icon: Shield },
  { key: 'matrix', label: 'Permissions Matrix', icon: Sliders },
  { key: 'users', label: 'User Overrides', icon: Users },
  { key: 'templates', label: 'Permission Templates', icon: FileText },
];

const Modal: React.FC<{ open: boolean; title: string; onClose: () => void; children: React.ReactNode }> = ({ open, title, onClose, children }) => {
  if (!open) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(4px)' }} onClick={onClose}>
      <div className="glass-panel" style={{ width: '95%', maxWidth: 650, maxHeight: '85vh', overflowY: 'auto', padding: 32, borderRadius: 'var(--radius-lg)' }} onClick={e => e.stopPropagation()}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: 20, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Shield size={18} color="var(--color-primary)" />
          {title}
        </h2>
        {children}
      </div>
    </div>
  );
};

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div style={{ marginBottom: 14 }}>
    <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</label>
    {children}
  </div>
);

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-md)',
  border: '1px solid var(--border-glass)', background: 'rgba(255,255,255,0.6)',
  fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-main)', outline: 'none',
  boxSizing: 'border-box',
};

const RbacManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('roles');
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  // Data states
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissionsByModule, setPermissionsByModule] = useState<Record<string, Permission[]>>({});
  const [flatPermissions, setFlatPermissions] = useState<Permission[]>([]);
  const [templates, setTemplates] = useState<PermissionTemplate[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [usersList, setUsersList] = useState<any[]>([]);

  // Selection states
  const [selectedRoleId, setSelectedRoleId] = useState<string>('');
  const [selectedRolePermissions, setSelectedRolePermissions] = useState<string[]>([]); // Array of permission IDs
  const [selectedRoleEffective, setSelectedRoleEffective] = useState<string[]>([]); // Array of permission names (inherited)
  
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [userDetail, setUserDetail] = useState<any>(null);
  
  // Modals
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [editRole, setEditRole] = useState<Role | null>(null);
  const [roleForm, setRoleForm] = useState<any>({});

  const [templateModalOpen, setTemplateModalOpen] = useState(false);
  const [templateForm, setTemplateForm] = useState<any>({ permissions: [] });

  const [overrideModalOpen, setOverrideModalOpen] = useState(false);
  const [overrideForm, setOverrideForm] = useState<any>({ type: 'grant' });

  const [assignRoleModalOpen, setAssignRoleModalOpen] = useState(false);
  const [assignRoleForm, setAssignRoleForm] = useState<any>({});

  useEffect(() => {
    loadBaseData();
  }, []);

  const loadBaseData = async () => {
    setLoading(true);
    try {
      const [rRes, pRes, tRes, cRes, uRes] = await Promise.all([
        api.get('/v1/enterprise/roles'),
        api.get('/v1/enterprise/permissions'),
        api.get('/v1/enterprise/permission-templates'),
        api.get('/v1/enterprise/companies'),
        api.get('/v1/admin/users'),
      ]);

      const fetchedRoles = rRes.data?.data || [];
      setRoles(fetchedRoles);
      setPermissionsByModule(pRes.data?.data || {});
      setTemplates(tRes.data?.data || []);
      setCompanies(cRes.data?.data || []);
      setUsersList(uRes.data?.data || []);

      // Flatten permissions for easy lookup
      const flat: Permission[] = [];
      Object.values(pRes.data?.data || {}).forEach((list: any) => {
        flat.push(...list);
      });
      setFlatPermissions(flat);

      if (fetchedRoles.length > 0 && !selectedRoleId) {
        setSelectedRoleId(fetchedRoles[0].id);
      }
    } catch (err) {
      console.error('Error loading RBAC base data:', err);
    }
    setLoading(false);
  };

  // Load permissions for selected role
  useEffect(() => {
    if (selectedRoleId && activeTab === 'matrix') {
      loadRolePermissions(selectedRoleId);
    }
  }, [selectedRoleId, activeTab]);

  const loadRolePermissions = async (roleId: string) => {
    try {
      const res = await api.get(`/v1/enterprise/roles/${roleId}/permissions`);
      setSelectedRolePermissions(res.data?.permissions || []);
      setSelectedRoleEffective(res.data?.effective_permissions || []);
    } catch (err) {
      console.error('Error loading role permissions:', err);
    }
  };

  // Load details for selected user
  useEffect(() => {
    if (selectedUserId && activeTab === 'users') {
      loadUserDetails(selectedUserId);
    }
  }, [selectedUserId, activeTab]);

  const loadUserDetails = async (userId: string) => {
    try {
      const res = await api.get(`/v1/enterprise/users/${userId}/permissions`);
      setUserDetail(res.data || null);
    } catch (err) {
      console.error('Error loading user details:', err);
    }
  };

  // ── Role actions ──
  const openCreateRole = () => {
    setEditRole(null);
    setRoleForm({ name: '', display_name: '', description: '', level: 0, status: 'active' });
    setRoleModalOpen(true);
  };

  const openEditRole = (role: Role) => {
    setEditRole(role);
    setRoleForm({ ...role });
    setRoleModalOpen(true);
  };

  const saveRole = async () => {
    try {
      if (editRole) {
        await api.put(`/v1/enterprise/roles/${editRole.id}`, roleForm);
      } else {
        await api.post('/v1/enterprise/roles', roleForm);
      }
      setRoleModalOpen(false);
      loadBaseData();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Error saving role');
    }
  };

  const deleteRole = async (id: string) => {
    if (!confirm('Are you sure you want to delete this role? This cannot be undone.')) return;
    try {
      await api.delete(`/v1/enterprise/roles/${id}`);
      loadBaseData();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Error deleting role');
    }
  };

  // ── Matrix actions ──
  const togglePermission = (permId: string) => {
    setSelectedRolePermissions(prev =>
      prev.includes(permId) ? prev.filter(id => id !== permId) : [...prev, permId]
    );
  };

  const saveRolePermissions = async () => {
    if (!selectedRoleId) return;
    try {
      await api.post(`/v1/enterprise/roles/${selectedRoleId}/permissions`, {
        permission_ids: selectedRolePermissions,
      });
      alert('Permissions saved successfully!');
      loadRolePermissions(selectedRoleId);
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Error saving permissions');
    }
  };

  const applyTemplateToSelectedRole = async (templateId: string) => {
    if (!selectedRoleId) return;
    if (!confirm('Apply this template? It will merge template permissions into the role.')) return;
    try {
      const res = await api.post(`/v1/enterprise/roles/${selectedRoleId}/apply-template`, {
        template_id: templateId,
      });
      alert(res.data?.message || 'Template applied successfully!');
      loadRolePermissions(selectedRoleId);
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Error applying template');
    }
  };

  // ── User Override actions ──
  const openOverrideModal = () => {
    setOverrideForm({ type: 'grant', permission_id: flatPermissions[0]?.id || '', reason: '', expires_at: '' });
    setOverrideModalOpen(true);
  };

  const saveOverride = async () => {
    try {
      await api.post(`/v1/enterprise/users/${selectedUserId}/permissions/override`, overrideForm);
      setOverrideModalOpen(false);
      loadUserDetails(selectedUserId);
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Error applying override');
    }
  };

  const revokeOverride = async (permissionId: string) => {
    if (!confirm('Are you sure you want to revoke this override?')) return;
    try {
      await api.delete(`/v1/enterprise/users/${selectedUserId}/permissions/${permissionId}/override`);
      loadUserDetails(selectedUserId);
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Error revoking override');
    }
  };

  const openAssignRoleModal = () => {
    setAssignRoleForm({ role_id: roles[0]?.id || '', expires_at: '' });
    setAssignRoleModalOpen(true);
  };

  const saveUserRole = async () => {
    try {
      await api.post(`/v1/enterprise/users/${selectedUserId}/roles`, assignRoleForm);
      setAssignRoleModalOpen(false);
      loadUserDetails(selectedUserId);
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Error assigning role');
    }
  };

  const removeUserRole = async (roleId: string) => {
    if (!confirm('Remove this role from user?')) return;
    try {
      await api.delete(`/v1/enterprise/users/${selectedUserId}/roles`, { data: { role_id: roleId } });
      loadUserDetails(selectedUserId);
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Error removing role');
    }
  };

  // ── Template actions ──
  const openCreateTemplate = () => {
    setTemplateForm({ name: '', description: '', permissions: [] });
    setTemplateModalOpen(true);
  };

  const toggleTemplatePermission = (permName: string) => {
    setTemplateForm((prev: any) => {
      const perms = prev.permissions.includes(permName)
        ? prev.permissions.filter((p: string) => p !== permName)
        : [...prev.permissions, permName];
      return { ...prev, permissions: perms };
    });
  };

  const saveTemplate = async () => {
    try {
      await api.post('/v1/enterprise/permission-templates', templateForm);
      setTemplateModalOpen(false);
      loadBaseData();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Error creating template');
    }
  };

  // UI Helpers
  const cellStyle: React.CSSProperties = { padding: '12px 16px', fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-main)', borderBottom: '1px solid var(--border-glass)' };
  const headerStyle: React.CSSProperties = { ...cellStyle, fontWeight: 800, fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.06em', background: 'rgba(255,255,255,0.4)' };
  
  const badge = (text: string, color: string) => (
    <span style={{ padding: '3px 10px', borderRadius: 9999, fontSize: '0.68rem', fontWeight: 700, background: `${color}18`, color, textTransform: 'capitalize' }}>{text}</span>
  );

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 10 }}>
          <Shield size={24} color="var(--color-primary)" />
          🛡️ Enterprise RBAC Engine
        </h1>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>
          Configure dynamic role inheritance, map system permissions, enforce temporal grants, and audit active overrides
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 20 }}>
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 16px', borderRadius: 9999, border: 'none',
              background: activeTab === t.key ? 'var(--color-primary)' : 'rgba(255,255,255,0.5)',
              color: activeTab === t.key ? '#fff' : 'var(--text-muted)',
              fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            <t.icon size={14} />
            {t.label}
          </button>
        ))}
      </div>

      {/* Content body */}
      <div className="glass-panel" style={{ padding: 24, borderRadius: 'var(--radius-lg)' }}>
        {loading && <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Loading...</div>}

        {!loading && activeTab === 'roles' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-main)' }}>System Roles Catalog</h3>
              <button className="btn-primary" onClick={openCreateRole} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Plus size={16} /> Add Role
              </button>
            </div>
            
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={headerStyle}>Role Name</th>
                  <th style={headerStyle}>Display Name</th>
                  <th style={headerStyle}>Parent Inheritance</th>
                  <th style={headerStyle}>Hierarchy Level</th>
                  <th style={headerStyle}>Type</th>
                  <th style={headerStyle}>Status</th>
                  <th style={headerStyle}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {roles.map(r => (
                  <tr key={r.id}>
                    <td style={cellStyle}><code>{r.name}</code></td>
                    <td style={cellStyle}><strong>{r.display_name}</strong><div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{r.description || 'No description'}</div></td>
                    <td style={cellStyle}>{r.parent_role ? <code>{r.parent_role.name}</code> : '—'}</td>
                    <td style={cellStyle}>{badge(`Level ${r.level}`, '#6366f1')}</td>
                    <td style={cellStyle}>{r.is_system ? badge('System Protected', '#ef4444') : badge('Custom', '#10b981')}</td>
                    <td style={cellStyle}>{badge(r.status, r.status === 'active' ? '#10b981' : '#6b7280')}</td>
                    <td style={cellStyle}>
                      <button className="btn-ghost" onClick={() => openEditRole(r)} style={{ marginRight: 6 }} disabled={r.is_system} title={r.is_system ? "System roles cannot be edited" : ""}>
                        <Edit3 size={14} />
                      </button>
                      <button className="btn-ghost" onClick={() => deleteRole(r.id)} disabled={r.is_system}>
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && activeTab === 'matrix' && (
          <div>
            <div style={{ display: 'flex', gap: 16, alignItems: 'flex-end', marginBottom: 20, flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 250 }}>
                <Field label="Select Role to Configure">
                  <select style={inputStyle} value={selectedRoleId} onChange={e => setSelectedRoleId(e.target.value)}>
                    {roles.map(r => <option key={r.id} value={r.id}>{r.display_name} ({r.name})</option>)}
                  </select>
                </Field>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="btn-primary" onClick={saveRolePermissions}>Save Permissions</button>
                <select 
                  style={{ ...inputStyle, width: 220 }} 
                  onChange={e => e.target.value && applyTemplateToSelectedRole(e.target.value)}
                  defaultValue=""
                >
                  <option value="" disabled>Apply Permission Template...</option>
                  {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
            </div>

            <div style={{ border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-md)', padding: 16, background: 'rgba(255,255,255,0.2)' }}>
              <h4 style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: 12 }}>
                Permissions Matrix for: <span style={{ color: 'var(--color-primary)' }}>{roles.find(r => r.id === selectedRoleId)?.display_name}</span>
              </h4>

              {Object.entries(permissionsByModule).map(([module, list]) => (
                <div key={module} style={{ marginBottom: 20, borderBottom: '1px dashed var(--border-glass)', paddingBottom: 16 }}>
                  <h5 style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 10 }}>
                    Module: {module}
                  </h5>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 10 }}>
                    {list.map(p => {
                      const isAssigned = selectedRolePermissions.includes(p.id);
                      const isInherited = selectedRoleEffective.includes(p.name) && !isAssigned;

                      return (
                        <label 
                          key={p.id} 
                          style={{ 
                            display: 'flex', alignItems: 'center', gap: 8, padding: 10, borderRadius: 'var(--radius-sm)', 
                            background: isAssigned ? 'rgba(59,130,246,0.08)' : isInherited ? 'rgba(16,185,129,0.06)' : 'transparent',
                            border: '1px solid', borderColor: isAssigned ? 'rgba(59,130,246,0.3)' : isInherited ? 'rgba(16,185,129,0.2)' : 'transparent',
                            cursor: 'pointer', transition: 'all 0.15s ease' 
                          }}
                        >
                          <input 
                            type="checkbox" 
                            checked={isAssigned || isInherited} 
                            disabled={isInherited}
                            onChange={() => togglePermission(p.id)}
                            style={{ width: 16, height: 16, cursor: 'pointer' }}
                          />
                          <div>
                            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: isAssigned ? 'var(--color-primary)' : isInherited ? '#10b981' : 'var(--text-main)' }}>
                              {p.display_name}
                              {isInherited && <span style={{ fontSize: '0.65rem', marginLeft: 6, fontStyle: 'italic', color: '#10b981' }}>(Inherited)</span>}
                            </div>
                            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{p.name}</div>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {!loading && activeTab === 'users' && (
          <div>
            <div style={{ display: 'flex', gap: 16, alignItems: 'flex-end', marginBottom: 20 }}>
              <div style={{ flex: 1 }}>
                <Field label="Select Employee to Audit & Override">
                  <select style={inputStyle} value={selectedUserId} onChange={e => setSelectedUserId(e.target.value)}>
                    <option value="" disabled>-- Select a User --</option>
                    {usersList.map(u => <option key={u.id} value={u.id}>{u.name} ({u.email} - {u.role})</option>)}
                  </select>
                </Field>
              </div>
            </div>

            {userDetail ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 20 }}>
                {/* User Info & Roles */}
                <div>
                  <div className="glass-panel" style={{ padding: 16, borderRadius: 'var(--radius-md)', marginBottom: 16 }}>
                    <h4 style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: 10 }}>Roles Enforced</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {userDetail.roles.length === 0 ? (
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>No explicit enterprise roles assigned.</div>
                      ) : (
                        userDetail.roles.map((r: any) => (
                          <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 8, background: 'rgba(255,255,255,0.4)', borderRadius: 6 }}>
                            <div>
                              <div style={{ fontSize: '0.78rem', fontWeight: 700 }}>{r.display_name}</div>
                              {r.expires_at && (
                                <div style={{ fontSize: '0.65rem', color: '#ef4444', display: 'flex', alignItems: 'center', gap: 4 }}>
                                  <Calendar size={10} /> Expires: {new Date(r.expires_at).toLocaleDateString()}
                                </div>
                              )}
                            </div>
                            <button className="btn-ghost" onClick={() => removeUserRole(r.id)} style={{ padding: 4 }}>
                              <X size={12} color="#ef4444" />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                    <button className="btn-primary" onClick={openAssignRoleModal} style={{ width: '100%', marginTop: 14, fontSize: '0.75rem', padding: '6px 12px' }}>
                      Assign Enterprise Role
                    </button>
                  </div>

                  <div className="glass-panel" style={{ padding: 16, borderRadius: 'var(--radius-md)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                      <h4 style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-main)' }}>Direct Overrides</h4>
                      <button className="btn-secondary" onClick={openOverrideModal} style={{ fontSize: '0.7rem', padding: '4px 8px' }}>
                        Add Override
                      </button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {userDetail.direct_overrides.length === 0 ? (
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>No direct overrides active.</div>
                      ) : (
                        userDetail.direct_overrides.map((o: any) => (
                          <div 
                            key={o.id} 
                            style={{ 
                              padding: 8, background: 'rgba(255,255,255,0.4)', borderRadius: 6, 
                              borderLeft: '4px solid', borderColor: o.type === 'grant' ? '#10b981' : '#ef4444' 
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>
                                {o.display_name}
                              </span>
                              <button className="btn-ghost" onClick={() => revokeOverride(o.permission_id)} style={{ padding: 2 }}>
                                <X size={12} />
                              </button>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: 4 }}>
                              <span>{o.type === 'grant' ? 'Explicitly Granted' : 'Explicitly Denied'}</span>
                              {o.expires_at && <span>Expires: {new Date(o.expires_at).toLocaleDateString()}</span>}
                            </div>
                            {o.reason && (
                              <div style={{ fontSize: '0.65rem', fontStyle: 'italic', background: 'rgba(0,0,0,0.03)', padding: '2px 4px', marginTop: 4 }}>
                                Reason: {o.reason}
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {/* Effective Permissions Resolved */}
                <div className="glass-panel" style={{ padding: 20, borderRadius: 'var(--radius-md)' }}>
                  <h4 style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: 12 }}>
                    Resolved Effective Permissions (Total: {userDetail.effective_permissions.length})
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, maxHeight: 380, overflowY: 'auto' }}>
                    {userDetail.effective_permissions.map((name: string) => {
                      const detail = flatPermissions.find(p => p.name === name);
                      return (
                        <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px', background: 'rgba(255,255,255,0.3)', borderRadius: 4 }}>
                          <Check size={14} color="#10b981" />
                          <div>
                            <div style={{ fontSize: '0.75rem', fontWeight: 700 }}>{detail?.display_name || name}</div>
                            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{name}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                Select an employee from the dropdown above to view their active roles, overrides, and resolve their final permissions hierarchy.
              </div>
            )}
          </div>
        )}

        {!loading && activeTab === 'templates' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-main)' }}>Reusable Permission Templates</h3>
              <button className="btn-primary" onClick={openCreateTemplate} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Plus size={16} /> Create Template
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
              {templates.map(t => (
                <div key={t.id} className="glass-panel" style={{ padding: 20, borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: 6 }}>{t.name}</h4>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 14 }}>{t.description || 'No description provided.'}</p>
                    
                    <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)', marginBottom: 6 }}>
                      Permissions Bundle ({t.permissions.length})
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, maxHeight: 120, overflowY: 'auto', marginBottom: 16 }}>
                      {t.permissions.map(p => (
                        <code key={p} style={{ fontSize: '0.65rem', background: 'rgba(0,0,0,0.04)', padding: '2px 5px', borderRadius: 4 }}>{p}</code>
                      ))}
                    </div>
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    ID: <code>{t.id}</code>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Role CRUD Modal */}
      <Modal open={roleModalOpen} title={`${editRole ? 'Edit' : 'Create'} Enterprise Role`} onClose={() => setRoleModalOpen(false)}>
        <Field label="System Key (Unique String)"><input style={inputStyle} value={roleForm.name || ''} onChange={e => setRoleForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. sales_officer" disabled={!!editRole} /></Field>
        <Field label="Display Name"><input style={inputStyle} value={roleForm.display_name || ''} onChange={e => setRoleForm(p => ({ ...p, display_name: e.target.value }))} placeholder="e.g. Sales Officer" /></Field>
        <Field label="Description"><textarea style={{ ...inputStyle, minHeight: 60 }} value={roleForm.description || ''} onChange={e => setRoleForm(p => ({ ...p, description: e.target.value }))} /></Field>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Field label="Hierarchy Level (Lower is weaker)"><input style={inputStyle} type="number" value={roleForm.level || 0} onChange={e => setRoleForm(p => ({ ...p, level: parseInt(e.target.value) }))} /></Field>
          <Field label="Inherits From (Parent)"><select style={inputStyle} value={roleForm.parent_role_id || ''} onChange={e => setRoleForm(p => ({ ...p, parent_role_id: e.target.value || null }))}><option value="">-- None --</option>{roles.filter(r => r.id !== editRole?.id).map(r => <option key={r.id} value={r.id}>{r.display_name}</option>)}</select></Field>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Field label="Company Specific (Optional)"><select style={inputStyle} value={roleForm.company_id || ''} onChange={e => setRoleForm(p => ({ ...p, company_id: e.target.value || null }))}><option value="">-- Global Role --</option>{companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field>
          <Field label="Status"><select style={inputStyle} value={roleForm.status || 'active'} onChange={e => setRoleForm(p => ({ ...p, status: e.target.value }))}><option value="active">Active</option><option value="inactive">Inactive</option></select></Field>
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
          <button className="btn-primary" onClick={saveRole} style={{ flex: 1 }}>{editRole ? 'Update' : 'Create'}</button>
          <button className="btn-secondary" onClick={() => setRoleModalOpen(false)} style={{ flex: 1 }}>Cancel</button>
        </div>
      </Modal>

      {/* Template Modal */}
      <Modal open={templateModalOpen} title="Create Reusable Permission Template" onClose={() => setTemplateModalOpen(false)}>
        <Field label="Template Name"><input style={inputStyle} value={templateForm.name || ''} onChange={e => setTemplateForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Sales Executive Bundle" /></Field>
        <Field label="Description"><input style={inputStyle} value={templateForm.description || ''} onChange={e => setTemplateForm(p => ({ ...p, description: e.target.value }))} /></Field>

        <Field label="Select Permissions to Include">
          <div style={{ border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-md)', padding: 12, maxHeight: 220, overflowY: 'auto', background: 'rgba(255,255,255,0.4)' }}>
            {flatPermissions.map(p => {
              const checked = templateForm.permissions.includes(p.name);
              return (
                <label key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, cursor: 'pointer' }}>
                  <input type="checkbox" checked={checked} onChange={() => toggleTemplatePermission(p.name)} />
                  <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>{p.display_name} (<code>{p.name}</code>)</span>
                </label>
              );
            })}
          </div>
        </Field>

        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
          <button className="btn-primary" onClick={saveTemplate} style={{ flex: 1 }}>Create Template</button>
          <button className="btn-secondary" onClick={() => setTemplateModalOpen(false)} style={{ flex: 1 }}>Cancel</button>
        </div>
      </Modal>

      {/* Override Modal */}
      <Modal open={overrideModalOpen} title="Create Direct Permission Override" onClose={() => setOverrideModalOpen(false)}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Field label="Override Type">
            <select style={inputStyle} value={overrideForm.type} onChange={e => setOverrideForm(p => ({ ...p, type: e.target.value }))}>
              <option value="grant">Explicit Grant (FORCE ALLOW)</option>
              <option value="deny">Explicit Deny (FORCE BLOCK)</option>
            </select>
          </Field>
          <Field label="Target Permission">
            <select style={inputStyle} value={overrideForm.permission_id} onChange={e => setOverrideForm(p => ({ ...p, permission_id: e.target.value }))}>
              {flatPermissions.map(p => <option key={p.id} value={p.id}>{p.display_name} ({p.name})</option>)}
            </select>
          </Field>
        </div>

        <Field label="Expiration Date (Optional)"><input style={inputStyle} type="date" value={overrideForm.expires_at || ''} onChange={e => setOverrideForm(p => ({ ...p, expires_at: e.target.value }))} /></Field>
        <Field label="Reason / Authorization Comment"><textarea style={{ ...inputStyle, minHeight: 60 }} value={overrideForm.reason || ''} onChange={e => setOverrideForm(p => ({ ...p, reason: e.target.value }))} placeholder="Explain why this override is necessary..." /></Field>

        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
          <button className="btn-primary" onClick={saveOverride} style={{ flex: 1 }}>Apply Override</button>
          <button className="btn-secondary" onClick={() => setOverrideModalOpen(false)} style={{ flex: 1 }}>Cancel</button>
        </div>
      </Modal>

      {/* Assign Role Modal */}
      <Modal open={assignRoleModalOpen} title="Assign Enterprise Role to User" onClose={() => setAssignRoleModalOpen(false)}>
        <Field label="Select Enterprise Role">
          <select style={inputStyle} value={assignRoleForm.role_id} onChange={e => setAssignRoleForm(p => ({ ...p, role_id: e.target.value }))}>
            {roles.map(r => <option key={r.id} value={r.id}>{r.display_name} ({r.name})</option>)}
          </select>
        </Field>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Field label="Company Specific (Optional)">
            <select style={inputStyle} value={assignRoleForm.company_id || ''} onChange={e => setAssignRoleForm(p => ({ ...p, company_id: e.target.value || null }))}>
              <option value="">-- Global Enforced --</option>
              {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>
          <Field label="Branch Scope (Optional)">
            <select style={inputStyle} value={assignRoleForm.branch_id || ''} onChange={e => setAssignRoleForm(p => ({ ...p, branch_id: e.target.value || null }))}>
              <option value="">-- All Branches --</option>
              {/* Note: branch listing comes from organization state or load organisation branches */}
            </select>
          </Field>
        </div>

        <Field label="Expiration Date (Temporary Role Assignment)"><input style={inputStyle} type="date" value={assignRoleForm.expires_at || ''} onChange={e => setAssignRoleForm(p => ({ ...p, expires_at: e.target.value }))} /></Field>

        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
          <button className="btn-primary" onClick={saveUserRole} style={{ flex: 1 }}>Assign Role</button>
          <button className="btn-secondary" onClick={() => setAssignRoleModalOpen(false)} style={{ flex: 1 }}>Cancel</button>
        </div>
      </Modal>
    </div>
  );
};

export default RbacManagement;
