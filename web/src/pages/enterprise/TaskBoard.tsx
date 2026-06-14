import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import {
  CheckSquare, Calendar, User, Plus, Search, MessageSquare, Paperclip,
  Check, Play, Eye, X, AlertTriangle, ArrowRight, ArrowLeft, Trash2, Clock
} from 'lucide-react';

interface ChecklistItem {
  id: string; item_text: string; is_completed: boolean; completed_at: string | null;
}
interface Comment {
  id: string; comment: string; user?: any; created_at: string;
}
interface Attachment {
  id: string; name: string; file_url: string; uploader?: any;
}
interface Task {
  id: string; parent_task_id: string | null; title: string; description: string | null;
  status: 'todo' | 'in_progress' | 'review' | 'done' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'critical';
  due_date: string | null; assigned_to: string | null; created_by: string; company_id: string | null;
  assignee?: any; creator?: any; checklists: ChecklistItem[]; comments: Comment[]; attachments: Attachment[];
  dependencies: any[];
}

type Column = 'todo' | 'in_progress' | 'review' | 'done';

const columns: { key: Column; label: string; color: string }[] = [
  { key: 'todo', label: 'To Do', color: '#6b7280' },
  { key: 'in_progress', label: 'In Progress', color: '#3b82f6' },
  { key: 'review', label: 'In Review', color: '#f59e0b' },
  { key: 'done', label: 'Completed', color: '#10b981' },
];

const Modal: React.FC<{ open: boolean; title: string; onClose: () => void; children: React.ReactNode }> = ({ open, title, onClose, children }) => {
  if (!open) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(4px)' }} onClick={onClose}>
      <div className="glass-panel" style={{ width: '95%', maxWidth: 650, maxHeight: '85vh', overflowY: 'auto', padding: 32, borderRadius: 'var(--radius-lg)' }} onClick={e => e.stopPropagation()}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: 20, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <CheckSquare size={18} color="var(--color-primary)" />
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

const TaskBoard: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [assigneeFilter, setAssigneeFilter] = useState('');

  // Selected task detail
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [taskDetail, setTaskDetail] = useState<Task | null>(null);

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [taskForm, setTaskForm] = useState<any>({
    title: '', description: '', status: 'todo', priority: 'medium', due_date: '', assigned_to: '', checklists: []
  });

  const [commentText, setCommentText] = useState('');
  const [checklistItemText, setChecklistItemText] = useState('');
  const [attachmentForm, setAttachmentForm] = useState<any>({ name: '', file_url: '' });

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [tasksRes, usersRes, compRes] = await Promise.all([
        api.get('/v1/enterprise/tasks'),
        api.get('/v1/admin/users'),
        api.get('/v1/enterprise/companies'),
      ]);
      setTasks(tasksRes.data?.data || []);
      setUsers(usersRes.data?.data || []);
      setCompanies(compRes.data?.data || []);
    } catch (err) {
      console.error('Error loading tasks:', err);
    }
    setLoading(false);
  };

  const loadTaskDetail = async (id: string) => {
    try {
      const res = await api.get(`/v1/enterprise/tasks/${id}`);
      setTaskDetail(res.data?.data || null);
      setSelectedTaskId(id);
    } catch (err) {
      console.error('Error loading task detail:', err);
    }
  };

  const handleStatusChange = async (taskId: string, newStatus: Column) => {
    try {
      await api.put(`/v1/enterprise/tasks/${taskId}`, { status: newStatus });
      loadAll();
      if (selectedTaskId === taskId) {
        loadTaskDetail(taskId);
      }
    } catch (err: any) {
      alert('Error updating status');
    }
  };

  const handleSaveTask = async () => {
    try {
      await api.post('/v1/enterprise/tasks', taskForm);
      setCreateModalOpen(false);
      setTaskForm({
        title: '', description: '', status: 'todo', priority: 'medium', due_date: '', assigned_to: '', checklists: []
      });
      loadAll();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Error creating task');
    }
  };

  const handleAddComment = async () => {
    if (!selectedTaskId || !commentText.trim()) return;
    try {
      await api.post(`/v1/enterprise/tasks/${selectedTaskId}/comments`, { comment: commentText });
      setCommentText('');
      loadTaskDetail(selectedTaskId);
    } catch (err) {
      alert('Error adding comment');
    }
  };

  const handleAddChecklistItem = async () => {
    if (!selectedTaskId || !checklistItemText.trim()) return;
    try {
      await api.post(`/v1/enterprise/tasks/${selectedTaskId}/checklists`, { item_text: checklistItemText });
      setChecklistItemText('');
      loadTaskDetail(selectedTaskId);
      loadAll();
    } catch (err) {
      alert('Error adding item');
    }
  };

  const handleToggleChecklist = async (itemId: string) => {
    if (!selectedTaskId) return;
    try {
      await api.put(`/v1/enterprise/tasks/${selectedTaskId}/checklists/${itemId}`);
      loadTaskDetail(selectedTaskId);
      loadAll();
    } catch (err) {
      alert('Error toggling item');
    }
  };

  const handleAddAttachment = async () => {
    if (!selectedTaskId || !attachmentForm.name.trim() || !attachmentForm.file_url.trim()) return;
    try {
      await api.post(`/v1/enterprise/tasks/${selectedTaskId}/attachments`, attachmentForm);
      setAttachmentForm({ name: '', file_url: '' });
      loadTaskDetail(selectedTaskId);
    } catch (err) {
      alert('Error adding attachment');
    }
  };

  const handleDeleteTask = async (id: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;
    try {
      await api.delete(`/v1/enterprise/tasks/${id}`);
      setSelectedTaskId(null);
      setTaskDetail(null);
      loadAll();
    } catch (err) {
      alert('Error deleting task');
    }
  };

  const addFormChecklistItem = () => {
    setTaskForm((p: any) => ({
      ...p,
      checklists: [...p.checklists, { item_text: '' }]
    }));
  };

  const removeFormChecklistItem = (idx: number) => {
    setTaskForm((p: any) => ({
      ...p,
      checklists: p.checklists.filter((_: any, i: number) => i !== idx)
    }));
  };

  const updateFormChecklistField = (idx: number, val: string) => {
    setTaskForm((prev: any) => {
      const checklists = [...prev.checklists];
      checklists[idx] = { item_text: val };
      return { ...prev, checklists };
    });
  };

  // Filters
  const filteredTasks = tasks.filter(t => {
    const matchesSearch = !search || t.title.toLowerCase().includes(search.toLowerCase());
    const matchesAssignee = !assigneeFilter || t.assigned_to === assigneeFilter;
    return matchesSearch && matchesAssignee;
  });

  const getPriorityBadgeColor = (p: string) => {
    return p === 'critical' ? '#ef4444' : p === 'high' ? '#f59e0b' : p === 'medium' ? '#3b82f6' : '#6b7280';
  };

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 10 }}>
          <CheckSquare size={24} color="var(--color-primary)" />
          📋 Enterprise Kanban Board
        </h1>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>
          Manage project task lists, track progress columns, assign workflow items, and collaborate with teams
        </p>
      </div>

      {/* Filter toolbar */}
      <div className="glass-panel" style={{ padding: '14px 20px', borderRadius: 'var(--radius-md)', marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Search size={16} color="var(--text-muted)" />
            <input
              style={{ ...inputStyle, width: 220, border: 'none', background: 'transparent' }}
              placeholder="Search tasks..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>ASSIGNEE:</span>
            <select style={{ ...inputStyle, width: 180, padding: '6px 10px' }} value={assigneeFilter} onChange={e => setAssigneeFilter(e.target.value)}>
              <option value="">-- All Users --</option>
              {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </div>
        </div>
        <button className="btn-primary" onClick={() => setCreateModalOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Plus size={16} /> New Task
        </button>
      </div>

      {loading ? (
        <div className="glass-panel" style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Loading board...</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: selectedTaskId ? '1.5fr 2fr' : '1fr', gap: 20 }}>
          {/* Kanban Columns Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(200px, 1fr))', gap: 12, overflowX: 'auto', alignItems: 'flex-start' }}>
            {columns.map(col => {
              const colTasks = filteredTasks.filter(t => t.status === col.key);
              return (
                <div key={col.key} className="glass-panel" style={{ padding: 14, borderRadius: 'var(--radius-lg)', minHeight: '65vh', background: 'rgba(255,255,255,0.2)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, borderBottom: `2px solid ${col.color}`, paddingBottom: 6 }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-main)' }}>{col.label}</span>
                    <span style={{ background: 'rgba(0,0,0,0.05)', fontSize: '0.7rem', fontWeight: 700, padding: '2px 6px', borderRadius: 999 }}>{colTasks.length}</span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {colTasks.map(t => {
                      const completedCount = t.checklists?.filter(c => c.is_completed).length || 0;
                      const totalChecklist = t.checklists?.length || 0;
                      
                      return (
                        <div 
                          key={t.id} 
                          onClick={() => loadTaskDetail(t.id)}
                          className="glass-panel" 
                          style={{ 
                            padding: 12, borderRadius: 'var(--radius-md)', cursor: 'pointer',
                            border: selectedTaskId === t.id ? '1px solid var(--color-primary)' : '1px solid var(--border-glass)',
                            background: selectedTaskId === t.id ? 'rgba(59,130,246,0.06)' : 'rgba(255,255,255,0.45)',
                            boxShadow: '0 2px 5px rgba(0,0,0,0.02)', transition: 'all 0.15s ease'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                            <span style={{ padding: '2px 6px', borderRadius: 999, fontSize: '0.62rem', fontWeight: 800, background: `${getPriorityBadgeColor(t.priority)}15`, color: getPriorityBadgeColor(t.priority) }}>
                              {t.priority}
                            </span>
                            {t.due_date && (
                              <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Clock size={10} /> {new Date(t.due_date).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                          <h4 style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: 8, lineHeight: 1.3 }}>{t.title}</h4>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                              <User size={10} /> {t.assignee?.name ? t.assignee.name.split(' ')[0] : 'Unassigned'}
                            </span>
                            {totalChecklist > 0 && (
                              <span>{completedCount}/{totalChecklist} checklist</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Task Detailed Side Panel */}
          {selectedTaskId && taskDetail && (
            <div className="glass-panel" style={{ padding: 22, borderRadius: 'var(--radius-lg)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border-glass)', paddingBottom: 12, marginBottom: 16 }}>
                <div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-main)' }}>{taskDetail.title}</h3>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', gap: 10, marginTop: 4 }}>
                    <span>Created by: {taskDetail.creator?.name}</span>
                    {taskDetail.due_date && <span>Due: {new Date(taskDetail.due_date).toLocaleDateString()}</span>}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button className="btn-ghost" onClick={() => handleDeleteTask(taskDetail.id)} title="Delete Task"><Trash2 size={16} color="#ef4444" /></button>
                  <button className="btn-ghost" onClick={() => { setSelectedTaskId(null); setTaskDetail(null); }}><X size={16} /></button>
                </div>
              </div>

              {/* Status & Priority select */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                <Field label="Task Status">
                  <select style={{ ...inputStyle, padding: '8px 12px' }} value={taskDetail.status} onChange={e => handleStatusChange(taskDetail.id, e.target.value as Column)}>
                    {columns.map(col => <option key={col.key} value={col.key}>{col.label}</option>)}
                  </select>
                </Field>
                <Field label="Task Assignee">
                  <select 
                    style={{ ...inputStyle, padding: '8px 12px' }} 
                    value={taskDetail.assigned_to || ''} 
                    onChange={async e => {
                      await api.put(`/v1/enterprise/tasks/${taskDetail.id}`, { assigned_to: e.target.value || null });
                      loadTaskDetail(taskDetail.id);
                      loadAll();
                    }}
                  >
                    <option value="">-- Unassigned --</option>
                    {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </select>
                </Field>
              </div>

              {/* Description */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 4 }}>Description</label>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-main)', margin: 0, padding: 10, background: 'rgba(0,0,0,0.02)', borderRadius: 6 }}>
                  {taskDetail.description || 'No description provided.'}
                </p>
              </div>

              {/* Checklist items */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 6 }}>Sub-Tasks Checklist</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 10 }}>
                  {taskDetail.checklists?.map(item => (
                    <label key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8rem', cursor: 'pointer' }}>
                      <input type="checkbox" checked={item.is_completed} onChange={() => handleToggleChecklist(item.id)} />
                      <span style={{ textDecoration: item.is_completed ? 'line-through' : 'none', color: item.is_completed ? 'var(--text-muted)' : 'var(--text-main)' }}>
                        {item.item_text}
                      </span>
                    </label>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input style={{ ...inputStyle, padding: '6px 10px', fontSize: '0.8rem' }} placeholder="Add checklist item..." value={checklistItemText} onChange={e => setChecklistItemText(e.target.value)} />
                  <button className="btn-secondary" onClick={handleAddChecklistItem} style={{ fontSize: '0.78rem', padding: '6px 12px' }}>Add</button>
                </div>
              </div>

              {/* Attachments vault */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 6 }}>Task Attachments</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 10 }}>
                  {taskDetail.attachments?.map(att => (
                    <div key={att.id} style={{ padding: '6px 10px', background: 'rgba(255,255,255,0.4)', borderRadius: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Paperclip size={12} /> {att.name}</span>
                      <a href={att.file_url} target="_blank" rel="noreferrer" style={{ color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 700 }}>Get</a>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 6 }}>
                  <input style={{ ...inputStyle, padding: '5px 8px', fontSize: '0.75rem' }} placeholder="File Name" value={attachmentForm.name} onChange={e => setAttachmentForm(p => ({ ...p, name: e.target.value }))} />
                  <input style={{ ...inputStyle, padding: '5px 8px', fontSize: '0.75rem' }} placeholder="File URL Mock" value={attachmentForm.file_url} onChange={e => setAttachmentForm(p => ({ ...p, file_url: e.target.value }))} />
                  <button className="btn-secondary" onClick={handleAddAttachment} style={{ fontSize: '0.75rem', padding: '5px 12px' }}>Attach</button>
                </div>
              </div>

              {/* Comments block */}
              <div>
                <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 6 }}>Discussions & Comments</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 180, overflowY: 'auto', marginBottom: 12, border: '1px solid var(--border-glass)', padding: 10, borderRadius: 6, background: 'rgba(255,255,255,0.3)' }}>
                  {taskDetail.comments?.length === 0 ? (
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center' }}>No discussion yet.</div>
                  ) : (
                    taskDetail.comments.map(c => (
                      <div key={c.id} style={{ fontSize: '0.78rem' }}>
                        <strong>{c.user?.name || 'User'}</strong>
                        <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginLeft: 8 }}>{new Date(c.created_at).toLocaleString()}</span>
                        <p style={{ margin: '2px 0 0', color: 'var(--text-main)' }}>{c.comment}</p>
                      </div>
                    ))
                  )}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input style={{ ...inputStyle, padding: '6px 10px', fontSize: '0.8rem' }} placeholder="Type comment..." value={commentText} onChange={e => setCommentText(e.target.value)} />
                  <button className="btn-secondary" onClick={handleAddComment} style={{ fontSize: '0.78rem', padding: '6px 12px' }}>Send</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Create Task Modal */}
      <Modal open={createModalOpen} title="Create Project Task" onClose={() => setCreateModalOpen(false)}>
        <Field label="Task Title"><input style={inputStyle} value={taskForm.title} onChange={e => setTaskForm(p => ({ ...p, title: e.target.value }))} placeholder="e.g. Perform KYC audit validation" /></Field>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Field label="Task Priority">
            <select style={inputStyle} value={taskForm.priority} onChange={e => setTaskForm(p => ({ ...p, priority: e.target.value }))}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </Field>
          <Field label="Due Date"><input style={inputStyle} type="date" value={taskForm.due_date} onChange={e => setTaskForm(p => ({ ...p, due_date: e.target.value }))} /></Field>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Field label="Assign To User">
            <select style={inputStyle} value={taskForm.assigned_to} onChange={e => setTaskForm(p => ({ ...p, assigned_to: e.target.value }))}>
              <option value="">-- Unassigned --</option>
              {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </Field>
          <Field label="Company Specific (Optional)">
            <select style={inputStyle} value={taskForm.company_id || ''} onChange={e => setTaskForm(p => ({ ...p, company_id: e.target.value || null }))}>
              <option value="">-- Global --</option>
              {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>
        </div>

        <Field label="Task Description"><textarea style={{ ...inputStyle, minHeight: 60 }} value={taskForm.description || ''} onChange={e => setTaskForm(p => ({ ...p, description: e.target.value }))} /></Field>

        {/* Form Checklist */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Subtasks Checklist</span>
            <button className="btn-secondary" onClick={addFormChecklistItem} style={{ fontSize: '0.65rem', padding: '4px 8px' }} type="button">
              Add Item
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {taskForm.checklists.map((c: any, idx: number) => (
              <div key={idx} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input style={{ ...inputStyle, padding: '6px 10px', fontSize: '0.78rem' }} value={c.item_text} onChange={e => updateFormChecklistField(idx, e.target.value)} placeholder={`Sub-task #${idx+1}`} />
                <button className="btn-ghost" onClick={() => removeFormChecklistItem(idx)} type="button"><X size={14} /></button>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
          <button className="btn-primary" onClick={handleSaveTask} style={{ flex: 1 }}>Create Task</button>
          <button className="btn-secondary" onClick={() => setCreateModalOpen(false)} style={{ flex: 1 }}>Cancel</button>
        </div>
      </Modal>
    </div>
  );
};

export default TaskBoard;
