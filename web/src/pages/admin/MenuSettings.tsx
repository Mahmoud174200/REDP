import React, { useEffect, useMemo, useState } from 'react';
import {
  Eye, EyeOff, Trash2, RotateCcw, Save, Lock, SlidersHorizontal, Loader2, Check,
  Search, AlertTriangle,
} from 'lucide-react';
import api from '../../services/api';
import { menuItems } from '../../config/sidebarMenu';

const C = {
  primary: '#003DA6', primaryDark: '#00205b', bg: '#f8fafc', card: '#fff',
  border: 'rgba(0,61,166,.10)', text: '#0f172a', muted: '#64748b',
  green: '#059669', amber: '#d97706', red: '#dc2626',
};

const parseArr = (v: any): string[] => {
  try { const p = typeof v === 'string' ? JSON.parse(v) : v; return Array.isArray(p) ? p : []; } catch { return []; }
};

const MenuSettings: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [hidden, setHidden] = useState<string[]>([]);
  const [deleted, setDeleted] = useState<string[]>([]);
  const [q, setQ] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get('/v1/admin/configs');
        const cfg = res.data?.data || {};
        setHidden(parseArr(cfg.sidebar_hidden));
        setDeleted(parseArr(cfg.sidebar_deleted));
      } catch (e: any) {
        setError(e.response?.data?.message || 'Failed to load menu settings.');
      } finally { setLoading(false); }
    })();
  }, []);

  const isHidden = (p: string) => hidden.includes(p);
  const isDeleted = (p: string) => deleted.includes(p);

  const setHide = (p: string, on: boolean) => {
    setHidden(h => on ? [...new Set([...h, p])] : h.filter(x => x !== p));
    if (on) setDeleted(d => d.filter(x => x !== p));
  };
  const setDelete = (p: string, on: boolean) => {
    setDeleted(d => on ? [...new Set([...d, p])] : d.filter(x => x !== p));
    if (on) setHidden(h => h.filter(x => x !== p));
  };

  const totals = useMemo(() => {
    let all = 0, hid = 0, del = 0, locked = 0;
    menuItems.forEach(s => s.items.forEach(i => {
      all++;
      if ((i as any).locked) locked++;
      else if (isDeleted(i.path)) del++;
      else if (isHidden(i.path)) hid++;
    }));
    return { all, hid, del, locked, visible: all - hid - del };
  }, [hidden, deleted]);

  const save = async () => {
    setSaving(true); setError(''); setSaved(false);
    try {
      await api.post('/v1/admin/configs', {
        configs: {
          sidebar_hidden: JSON.stringify(hidden),
          sidebar_deleted: JSON.stringify(deleted),
        },
      });
      // Reflect immediately in this admin's own sidebar (it reads from localStorage on mount)
      localStorage.setItem('sidebar_hidden', JSON.stringify(hidden));
      localStorage.setItem('sidebar_deleted', JSON.stringify(deleted));
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e: any) {
      setError(e.response?.data?.message || 'Failed to save.');
    } finally { setSaving(false); }
  };

  const resetAll = () => {
    if (!confirm('Show all pages again? This clears every hidden/deleted setting.')) return;
    setHidden([]); setDeleted([]);
  };

  const ql = q.trim().toLowerCase();

  if (loading) {
    return <div style={{ padding: 40, display: 'flex', gap: 10, alignItems: 'center', color: C.muted }}>
      <Loader2 className="spin" style={{ width: 18, height: 18 }} /> Loading menu settings…
    </div>;
  }

  return (
    <div style={{ padding: '4px 8px 90px', fontFamily: 'var(--font-body)', color: C.text }}>
      <style>{`.spin{animation:spin 1s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}
        .ms-icbtn{border:1px solid ${C.border};background:#fff;border-radius:8px;padding:6px 9px;cursor:pointer;display:inline-flex;align-items:center;gap:5px;font-size:.72rem;font-weight:700;transition:all .15s}
        .ms-icbtn:hover{background:rgba(0,61,166,.04)}
      `}</style>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
        <div style={{ width: 42, height: 42, borderRadius: 12, background: `linear-gradient(135deg,${C.primary},${C.primaryDark})`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <SlidersHorizontal style={{ width: 22, height: 22, color: '#fff' }} />
        </div>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: '1.3rem', fontWeight: 800, margin: 0, fontFamily: 'var(--font-title)' }}>Sidebar Menu Settings</h1>
          <p style={{ margin: 0, fontSize: '.78rem', color: C.muted }}>Show, hide or remove pages from the sidebar for all users</p>
        </div>
      </div>

      {/* Summary chips */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', margin: '14px 0 18px' }}>
        {[
          { l: 'Visible', v: totals.visible, c: C.green },
          { l: 'Hidden', v: totals.hid, c: C.amber },
          { l: 'Deleted', v: totals.del, c: C.red },
          { l: 'Locked', v: totals.locked, c: C.muted },
        ].map(s => (
          <span key={s.l} style={{ fontSize: '.74rem', fontWeight: 700, color: s.c, background: `${s.c}14`, padding: '5px 11px', borderRadius: 20 }}>{s.l}: {s.v}</span>
        ))}
      </div>

      {error && <div style={{ background: 'rgba(220,38,38,.06)', border: '1px solid rgba(220,38,38,.2)', color: C.red, padding: '10px 14px', borderRadius: 10, marginBottom: 14, fontSize: '.82rem', display: 'flex', gap: 8, alignItems: 'center' }}><AlertTriangle style={{ width: 15, height: 15 }} /> {error}</div>}

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: 16, maxWidth: 360 }}>
        <Search style={{ position: 'absolute', left: 12, top: 10, width: 15, height: 15, color: C.muted }} />
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search pages…" style={{ width: '100%', padding: '9px 12px 9px 34px', border: `1px solid ${C.border}`, borderRadius: 10, fontSize: '.83rem', boxSizing: 'border-box' }} />
      </div>

      {/* Sections */}
      {menuItems.map((section, si) => {
        const items = section.items.filter(i => !ql || i.name.toLowerCase().includes(ql) || section.title.toLowerCase().includes(ql));
        if (items.length === 0) return null;
        return (
          <div key={si} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, marginBottom: 14, overflow: 'hidden' }}>
            <div style={{ padding: '11px 16px', background: 'rgba(0,61,166,.03)', borderBottom: `1px solid ${C.border}`, fontSize: '.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.06em', color: C.primary }}>
              {section.title}
            </div>
            <div>
              {items.map((item, ii) => {
                const locked = !!(item as any).locked;
                const del = isDeleted(item.path);
                const hid = isHidden(item.path);
                const state = locked ? 'locked' : del ? 'deleted' : hid ? 'hidden' : 'visible';
                return (
                  <div key={ii} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
                    padding: '11px 16px', borderTop: ii === 0 ? 'none' : `1px solid ${C.border}`,
                    opacity: state === 'deleted' ? 0.55 : state === 'hidden' ? 0.75 : 1,
                    background: state === 'deleted' ? 'rgba(220,38,38,.03)' : 'transparent',
                  }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: '.86rem', fontWeight: 600, textDecoration: state === 'deleted' ? 'line-through' : 'none' }}>{item.name}</div>
                      <div style={{ fontSize: '.7rem', color: C.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.path}</div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                      {/* state badge */}
                      {state === 'hidden' && <span style={{ fontSize: '.66rem', fontWeight: 700, color: C.amber, background: 'rgba(217,119,6,.12)', padding: '3px 8px', borderRadius: 10 }}>Hidden</span>}
                      {state === 'deleted' && <span style={{ fontSize: '.66rem', fontWeight: 700, color: C.red, background: 'rgba(220,38,38,.1)', padding: '3px 8px', borderRadius: 10 }}>Deleted</span>}

                      {locked ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: '.7rem', color: C.muted, fontWeight: 700 }}>
                          <Lock style={{ width: 13, height: 13 }} /> Always on
                        </span>
                      ) : del ? (
                        <button className="ms-icbtn" style={{ color: C.green, borderColor: 'rgba(5,150,105,.3)' }} onClick={() => setDelete(item.path, false)}>
                          <RotateCcw style={{ width: 13, height: 13 }} /> Restore
                        </button>
                      ) : (
                        <>
                          <button className="ms-icbtn" style={{ color: hid ? C.green : C.amber }} onClick={() => setHide(item.path, !hid)} title={hid ? 'Show in sidebar' : 'Hide from sidebar'}>
                            {hid ? <><Eye style={{ width: 13, height: 13 }} /> Show</> : <><EyeOff style={{ width: 13, height: 13 }} /> Hide</>}
                          </button>
                          <button className="ms-icbtn" style={{ color: C.red }} onClick={() => setDelete(item.path, true)} title="Remove from sidebar">
                            <Trash2 style={{ width: 13, height: 13 }} /> Delete
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Sticky action bar */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'rgba(255,255,255,.92)', backdropFilter: 'blur(8px)', borderTop: `1px solid ${C.border}`, padding: '12px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, zIndex: 50 }}>
        <button className="ms-icbtn" style={{ padding: '9px 14px' }} onClick={resetAll}><RotateCcw style={{ width: 14, height: 14 }} /> Reset all</button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {saved && <span style={{ color: C.green, fontSize: '.8rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 5 }}><Check style={{ width: 15, height: 15 }} /> Saved</span>}
          <button onClick={save} disabled={saving} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: `linear-gradient(135deg,${C.primary},${C.primaryDark})`, color: '#fff', border: 'none', borderRadius: 10, padding: '10px 22px', fontWeight: 700, fontSize: '.85rem', cursor: 'pointer', boxShadow: '0 4px 14px rgba(0,61,166,.25)', opacity: saving ? .7 : 1 }}>
            {saving ? <Loader2 className="spin" style={{ width: 15, height: 15 }} /> : <Save style={{ width: 15, height: 15 }} />} Save changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default MenuSettings;
