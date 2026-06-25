import React, { useRef, useState } from 'react';
import api from '../services/api';
import { X, Check, Crosshair, Grid3x3, Trash2, Loader, Square, PenTool, Undo2 } from 'lucide-react';

/* ═══════════════════════════════════════════════════════
   Floor Plan Hotspot Editor
   Place each unit on the floor plan as either a quick
   rectangle or a hand-drawn polygon (matching the real
   apartment outline). Coordinates are percentages of the
   floor plan image, matching the public overlay.
   ═══════════════════════════════════════════════════════ */

interface Point { x: number; y: number; }
interface Hotspot { x: number; y: number; w: number; h: number; points?: Point[]; }

interface EditorUnit {
  id: string;
  unit_number: string;
  status: string;
  floor_plan_hotspot?: Hotspot | null;
}

interface Props {
  floorImageUrl: string;
  buildingName: string;
  floorNumber: number;
  units: EditorUnit[];
  onClose: () => void;
  onSaved: () => void;
}

type HotspotMap = Record<string, Hotspot>;
type DrawMode = 'rect' | 'polygon';

const DEFAULT_W = 14;
const DEFAULT_H = 16;

const statusColor = (status: string): string => {
  switch (status) {
    case 'available': return '#22c55e';
    case 'reserved': return '#f59e0b';
    case 'sold': return '#ef4444';
    case 'frozen': return '#06b6d4';
    default: return '#94a3b8';
  }
};

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));
const round2 = (v: number) => Math.round(v * 100) / 100;

const centroid = (hs: Hotspot): Point =>
  hs.points && hs.points.length >= 3
    ? { x: hs.points.reduce((s, p) => s + p.x, 0) / hs.points.length, y: hs.points.reduce((s, p) => s + p.y, 0) / hs.points.length }
    : { x: hs.x + hs.w / 2, y: hs.y + hs.h / 2 };

const bbox = (pts: Point[]): { x: number; y: number; w: number; h: number } => {
  const xs = pts.map(p => p.x), ys = pts.map(p => p.y);
  const minX = Math.min(...xs), minY = Math.min(...ys);
  return { x: round2(minX), y: round2(minY), w: round2(Math.max(...xs) - minX), h: round2(Math.max(...ys) - minY) };
};

const FloorHotspotEditor: React.FC<Props> = ({ floorImageUrl, buildingName, floorNumber, units, onClose, onSaved }) => {
  const [hotspots, setHotspots] = useState<HotspotMap>(() => {
    const init: HotspotMap = {};
    units.forEach(u => { if (u.floor_plan_hotspot) init[u.id] = u.floor_plan_hotspot; });
    return init;
  });
  const [activeId, setActiveId] = useState<string | null>(units[0]?.id ?? null);
  const [drawMode, setDrawMode] = useState<DrawMode>('rect');
  const [draftPoints, setDraftPoints] = useState<Point[]>([]);
  const [saving, setSaving] = useState(false);
  const imgWrapRef = useRef<HTMLDivElement>(null);

  const placedCount = Object.keys(hotspots).length;

  const selectUnit = (id: string) => { setActiveId(id); setDraftPoints([]); };

  const pctFromEvent = (e: React.MouseEvent): Point | null => {
    if (!imgWrapRef.current) return null;
    const rect = imgWrapRef.current.getBoundingClientRect();
    return {
      x: round2(clamp(((e.clientX - rect.left) / rect.width) * 100, 0, 100)),
      y: round2(clamp(((e.clientY - rect.top) / rect.height) * 100, 0, 100)),
    };
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!activeId) return;
    const p = pctFromEvent(e);
    if (!p) return;

    if (drawMode === 'polygon') {
      setDraftPoints(prev => [...prev, p]);
      return;
    }

    // rect mode — place a default box centered on the click
    const w = hotspots[activeId]?.w ?? DEFAULT_W;
    const h = hotspots[activeId]?.h ?? DEFAULT_H;
    setHotspots(prev => ({
      ...prev,
      [activeId]: { x: round2(clamp(p.x - w / 2, 0, 100 - w)), y: round2(clamp(p.y - h / 2, 0, 100 - h)), w, h },
    }));
    advance(activeId);
  };

  const advance = (fromId: string) => {
    const idx = units.findIndex(u => u.id === fromId);
    const next = units.slice(idx + 1).find(u => !hotspots[u.id]);
    if (next) setActiveId(next.id);
  };

  const finishPolygon = () => {
    if (!activeId || draftPoints.length < 3) return;
    const bb = bbox(draftPoints);
    setHotspots(prev => ({ ...prev, [activeId]: { ...bb, points: draftPoints } }));
    setDraftPoints([]);
    advance(activeId);
  };

  const undoPoint = () => setDraftPoints(prev => prev.slice(0, -1));

  const autoArrange = () => {
    const n = units.length;
    const cols = n <= 2 ? n : (n <= 6 ? 2 : 4);
    const rows = Math.ceil(n / cols);
    const padX = 6, padY = 8, gap = 3;
    const cellW = (100 - 2 * padX - (cols - 1) * gap) / cols;
    const cellH = (100 - 2 * padY - (rows - 1) * gap) / rows;
    const next: HotspotMap = {};
    units.forEach((u, i) => {
      const c = i % cols, r = Math.floor(i / cols);
      next[u.id] = { x: round2(padX + c * (cellW + gap)), y: round2(padY + r * (cellH + gap)), w: round2(cellW), h: round2(cellH) };
    });
    setHotspots(next);
    setDraftPoints([]);
  };

  const clearOne = (unitId: string) => {
    setHotspots(prev => { const c = { ...prev }; delete c[unitId]; return c; });
    if (activeId === unitId) setDraftPoints([]);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      for (const u of units) {
        const hs = hotspots[u.id];
        if (hs) {
          await api.post(`/admin/units/${u.id}/floor-hotspot`, hs.points ? { points: hs.points } : { x: hs.x, y: hs.y, w: hs.w, h: hs.h });
        } else if (u.floor_plan_hotspot) {
          await api.delete(`/admin/units/${u.id}/floor-hotspot`);
        }
      }
      onSaved();
      onClose();
    } catch (err) {
      console.error('Failed to save hotspots', err);
      alert('Failed to save hotspots. Please try again.');
    }
    setSaving(false);
  };

  const activeColor = activeId ? statusColor(units.find(u => u.id === activeId)?.status || '') : '#003DA6';

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 4000, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ background: '#fff', borderRadius: 20, width: 'min(1100px, 96vw)', maxHeight: '94vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 30px 80px rgba(0,0,0,0.3)' }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 24px', borderBottom: '1px solid #eef2f7' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#003DA6', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Crosshair size={18} /> Place Units on Floor Plan
            </h3>
            <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: '#64748b' }}>
              {buildingName} — Floor {floorNumber} · {placedCount}/{units.length} placed
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}><X size={22} /></button>
        </div>

        {/* Mode toolbar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 24px', borderBottom: '1px solid #f1f5f9', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: 10, padding: 3 }}>
            {([['rect', 'Rectangle', Square], ['polygon', 'Polygon', PenTool]] as const).map(([m, label, Icon]) => (
              <button
                key={m}
                onClick={() => { setDrawMode(m); setDraftPoints([]); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, border: 'none',
                  background: drawMode === m ? '#fff' : 'transparent', color: drawMode === m ? '#003DA6' : '#64748b',
                  fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer', boxShadow: drawMode === m ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
                }}
              >
                <Icon size={14} /> {label}
              </button>
            ))}
          </div>

          {drawMode === 'rect' ? (
            <button onClick={autoArrange} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(0,61,166,0.06)', border: '1px solid rgba(0,61,166,0.12)', color: '#003DA6', borderRadius: 10, padding: '7px 12px', fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer' }}>
              <Grid3x3 size={14} /> Auto-arrange grid
            </button>
          ) : (
            <>
              <button onClick={finishPolygon} disabled={draftPoints.length < 3} style={{ display: 'flex', alignItems: 'center', gap: 6, background: draftPoints.length >= 3 ? '#003DA6' : '#e5e9f0', border: 'none', color: draftPoints.length >= 3 ? '#fff' : '#94a3b8', borderRadius: 10, padding: '7px 14px', fontWeight: 700, fontSize: '0.78rem', cursor: draftPoints.length >= 3 ? 'pointer' : 'not-allowed' }}>
                <Check size={14} /> Finish shape ({draftPoints.length})
              </button>
              <button onClick={undoPoint} disabled={!draftPoints.length} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#fff', border: '1px solid #e5e9f0', color: '#64748b', borderRadius: 10, padding: '7px 12px', fontWeight: 700, fontSize: '0.78rem', cursor: draftPoints.length ? 'pointer' : 'not-allowed' }}>
                <Undo2 size={14} /> Undo point
              </button>
              <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Click around the apartment outline, then “Finish shape”.</span>
            </>
          )}
        </div>

        {/* Body */}
        <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: 0, flex: 1, minHeight: 0 }}>
          {/* Unit list */}
          <div style={{ borderRight: '1px solid #eef2f7', padding: 14, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <p style={{ fontSize: '0.7rem', color: '#94a3b8', margin: '0 0 4px' }}>Select a unit, then mark its position on the plan.</p>
            {units.map(u => {
              const placed = hotspots[u.id];
              const isActive = activeId === u.id;
              const color = statusColor(u.status);
              return (
                <div
                  key={u.id}
                  onClick={() => selectUnit(u.id)}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, padding: '8px 10px', borderRadius: 10, cursor: 'pointer', border: isActive ? '2px solid #003DA6' : '1px solid #e5e9f0', background: isActive ? 'rgba(0,61,166,0.05)' : '#fff' }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 10, height: 10, borderRadius: '50%', background: color }} />
                    <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0f172a' }}>{u.unit_number}</span>
                    {placed?.points && <span style={{ fontSize: '0.6rem', fontWeight: 700, color: '#003DA6', background: 'rgba(0,61,166,0.08)', padding: '1px 5px', borderRadius: 5 }}>poly</span>}
                  </span>
                  {placed ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Check size={14} style={{ color: '#22c55e' }} />
                      <Trash2 size={13} style={{ color: '#cbd5e1', cursor: 'pointer' }} onClick={(e) => { e.stopPropagation(); clearOne(u.id); }} />
                    </span>
                  ) : (
                    <span style={{ fontSize: '0.65rem', color: '#cbd5e1', fontWeight: 700 }}>—</span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Plan canvas */}
          <div style={{ padding: 18, overflow: 'auto', background: '#f8fafc' }}>
            <div
              ref={imgWrapRef}
              onClick={handleCanvasClick}
              style={{ position: 'relative', width: '100%', cursor: activeId ? 'crosshair' : 'default', borderRadius: 12, overflow: 'hidden', border: '1px solid #e5e9f0' }}
            >
              <img src={floorImageUrl} alt="Floor plan" style={{ width: '100%', height: 'auto', display: 'block', userSelect: 'none' }} draggable={false} />

              {/* Shapes (display only; clicks go to the canvas) */}
              <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
                {units.map(u => {
                  const hs = hotspots[u.id];
                  if (!hs) return null;
                  const color = statusColor(u.status);
                  const isActive = activeId === u.id;
                  const stroke = isActive ? '#003DA6' : color;
                  const sw = isActive ? 0.7 : 0.4;
                  return hs.points && hs.points.length >= 3
                    ? <polygon key={u.id} points={hs.points.map(p => `${p.x},${p.y}`).join(' ')} fill={`${color}33`} stroke={stroke} strokeWidth={sw} />
                    : <rect key={u.id} x={hs.x} y={hs.y} width={hs.w} height={hs.h} rx={1} fill={`${color}33`} stroke={stroke} strokeWidth={sw} />;
                })}

                {/* In-progress polygon draft */}
                {draftPoints.length > 0 && (
                  <polyline points={draftPoints.map(p => `${p.x},${p.y}`).join(' ')} fill={`${activeColor}22`} stroke={activeColor} strokeWidth={0.6} strokeDasharray="1.4 1" />
                )}
                {draftPoints.map((p, i) => (
                  <circle key={i} cx={p.x} cy={p.y} r={0.8} fill="#fff" stroke={activeColor} strokeWidth={0.5} />
                ))}
              </svg>

              {/* Centroid badges */}
              {units.map(u => {
                const hs = hotspots[u.id];
                if (!hs) return null;
                const c = centroid(hs);
                const color = statusColor(u.status);
                return (
                  <span key={u.id} style={{ position: 'absolute', left: `${c.x}%`, top: `${c.y}%`, transform: 'translate(-50%, -50%)', background: color, color: '#fff', fontSize: '0.6rem', fontWeight: 800, padding: '1px 6px', borderRadius: 999, pointerEvents: 'none', whiteSpace: 'nowrap' }}>
                    {u.unit_number}
                  </span>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10, padding: '14px 24px', borderTop: '1px solid #eef2f7' }}>
          <button onClick={onClose} style={{ background: '#fff', border: '1px solid #e5e9f0', borderRadius: 10, padding: '9px 18px', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer', color: '#64748b' }}>Cancel</button>
          <button onClick={handleSave} disabled={saving} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'linear-gradient(135deg, #003DA6, #001A70)', color: '#fff', border: 'none', borderRadius: 10, padding: '9px 22px', fontWeight: 700, fontSize: '0.82rem', cursor: saving ? 'wait' : 'pointer' }}>
            {saving ? <Loader size={15} className="spin" /> : <Check size={15} />}
            {saving ? 'Saving...' : 'Save Hotspots'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FloorHotspotEditor;
