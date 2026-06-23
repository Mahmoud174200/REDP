import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Trash2, HelpCircle, Settings, Pencil, MousePointer2, RotateCcw, Check, X } from 'lucide-react';
import api from '../../services/api';

interface Building {
  id: string;
  name: string;
  name_ar: string | null;
  type: string;
  total_floors: number;
  status: string;
  units_count?: number;
}

interface PolygonPoint {
  x: number;
  y: number;
}

interface Hotspot {
  id: string;
  project_id: string;
  building_id: string;
  x_percent: number;
  y_percent: number;
  label: string | null;
  pin_color: string;
  polygon_points: PolygonPoint[] | null;
  building?: Building;
}

interface InteractiveMapEditorProps {
  projectId: string;
  buildings: Building[];
  masterPlanImage: string | null;
  onRefresh?: () => void;
}

const pinColors = [
  { name: 'Sleek Blue', value: '#003DA6' },
  { name: 'Emerald Green', value: '#059669' },
  { name: 'Warm Amber', value: '#d97706' },
  { name: 'Crimson Red', value: '#dc2626' },
  { name: 'Royal Purple', value: '#7c3aed' },
  { name: 'Hot Pink', value: '#db2777' },
];

// Compute centroid of a polygon (average of all points)
function computeCentroid(points: PolygonPoint[]): { x: number; y: number } {
  const n = points.length;
  if (n === 0) return { x: 50, y: 50 };
  const sx = points.reduce((a, p) => a + p.x, 0);
  const sy = points.reduce((a, p) => a + p.y, 0);
  return { x: sx / n, y: sy / n };
}

// Convert hex color to rgba
function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export const InteractiveMapEditor: React.FC<InteractiveMapEditorProps> = ({
  projectId,
  buildings,
  masterPlanImage,
  onRefresh
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hotspots, setHotspots] = useState<Hotspot[]>([]);
  const [loading, setLoading] = useState(true);

  // Drawing mode state
  const [drawingMode, setDrawingMode] = useState(false);
  const [drawingBuildingId, setDrawingBuildingId] = useState<string>('');
  const [drawingLabel, setDrawingLabel] = useState<string>('');
  const [drawingColor, setDrawingColor] = useState<string>('#003DA6');
  const [drawingPoints, setDrawingPoints] = useState<PolygonPoint[]>([]);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);

  // Editing mode
  const [editingHotspot, setEditingHotspot] = useState<Hotspot | null>(null);
  const [editLabel, setEditLabel] = useState('');
  const [editColor, setEditColor] = useState('#003DA6');

  // Vertex dragging
  const [draggingVertex, setDraggingVertex] = useState<{ hotspotId: string; vertexIndex: number } | null>(null);

  // Entire polygon dragging
  const [draggingPolygon, setDraggingPolygon] = useState<{ hotspotId: string; lastX: number; lastY: number } | null>(null);

  // Hovered polygon
  const [hoveredPolygonId, setHoveredPolygonId] = useState<string | null>(null);

  // ── Data Fetching ──

  const fetchHotspots = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/admin/projects/${projectId}/hotspots`);
      if (res.data?.success) {
        setHotspots(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load hotspots', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHotspots();
  }, [projectId]);

  // ── Drawing Mode Handlers ──

  const startDrawing = (buildingId: string) => {
    const building = buildings.find(b => b.id === buildingId);
    setDrawingMode(true);
    setDrawingBuildingId(buildingId);
    setDrawingLabel(building?.name || '');
    setDrawingColor('#003DA6');
    setDrawingPoints([]);
    setEditingHotspot(null);
  };

  const cancelDrawing = () => {
    setDrawingMode(false);
    setDrawingBuildingId('');
    setDrawingPoints([]);
    setMousePos(null);
  };

  const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Don't handle if clicking on UI elements
    if ((e.target as HTMLElement).closest('.editor-sidebar') || (e.target as HTMLElement).closest('.editor-popover')) {
      return;
    }

    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 10000) / 100;
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 10000) / 100;

    if (drawingMode) {
      // Check if clicking near first point to close polygon
      if (drawingPoints.length >= 3) {
        const first = drawingPoints[0];
        const dx = Math.abs(x - first.x);
        const dy = Math.abs(y - first.y);
        if (dx < 2 && dy < 2) {
          // Close and save
          handleSavePolygon();
          return;
        }
      }

      setDrawingPoints(prev => [...prev, { x, y }]);
    }
  };

  const handleMapMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 10000) / 100;
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 10000) / 100;

    if (drawingMode) {
      setMousePos({ x, y });
    }

    // Vertex dragging
    if (draggingVertex) {
      setHotspots(prev => prev.map(h => {
        if (h.id === draggingVertex.hotspotId && h.polygon_points) {
          const newPoints = [...h.polygon_points];
          newPoints[draggingVertex.vertexIndex] = { x, y };
          const centroid = computeCentroid(newPoints);
          const updated = { ...h, polygon_points: newPoints, x_percent: centroid.x, y_percent: centroid.y };
          if (editingHotspot?.id === h.id) {
            setEditingHotspot(updated);
          }
          return updated;
        }
        return h;
      }));
    }

    // Polygon dragging
    if (draggingPolygon) {
      const dx = x - draggingPolygon.lastX;
      const dy = y - draggingPolygon.lastY;

      if (dx !== 0 || dy !== 0) {
        setHotspots(prev => prev.map(h => {
          if (h.id === draggingPolygon.hotspotId && h.polygon_points) {
            const newPoints = h.polygon_points.map(p => ({
              x: Math.round((p.x + dx) * 100) / 100,
              y: Math.round((p.y + dy) * 100) / 100
            }));
            const centroid = computeCentroid(newPoints);
            const updated = { ...h, polygon_points: newPoints, x_percent: centroid.x, y_percent: centroid.y };
            if (editingHotspot?.id === h.id) {
              setEditingHotspot(updated);
            }
            return updated;
          }
          return h;
        }));
        setDraggingPolygon({ hotspotId: draggingPolygon.hotspotId, lastX: x, lastY: y });
      }
    }
  };

  const handleMapMouseUp = async () => {
    if (draggingVertex) {
      const h = hotspots.find(item => item.id === draggingVertex.hotspotId);
      setDraggingVertex(null);

      if (h) {
        try {
          await api.put(`/admin/projects/${projectId}/hotspots/${h.id}`, {
            polygon_points: h.polygon_points,
            x_percent: h.x_percent,
            y_percent: h.y_percent,
          });
        } catch (err) {
          console.error('Failed to update vertex position', err);
          fetchHotspots();
        }
      }
    }

    if (draggingPolygon) {
      const h = hotspots.find(item => item.id === draggingPolygon.hotspotId);
      setDraggingPolygon(null);

      if (h) {
        try {
          await api.put(`/admin/projects/${projectId}/hotspots/${h.id}`, {
            polygon_points: h.polygon_points,
            x_percent: h.x_percent,
            y_percent: h.y_percent,
          });
        } catch (err) {
          console.error('Failed to update polygon position', err);
          fetchHotspots();
        }
      }
    }
  };

  // ── Save New Polygon ──

  const handleSavePolygon = async () => {
    if (drawingPoints.length < 3 || !drawingBuildingId) return;

    const centroid = computeCentroid(drawingPoints);

    try {
      const res = await api.post(`/admin/projects/${projectId}/hotspots`, {
        building_id: drawingBuildingId,
        x_percent: centroid.x,
        y_percent: centroid.y,
        label: drawingLabel || null,
        pin_color: drawingColor,
        polygon_points: drawingPoints,
      });

      if (res.data?.success) {
        setHotspots(prev => [...prev, res.data.data]);
        cancelDrawing();
        if (onRefresh) onRefresh();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to save building area.');
    }
  };

  // ── Edit Hotspot ──

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingHotspot) return;

    try {
      const res = await api.put(`/admin/projects/${projectId}/hotspots/${editingHotspot.id}`, {
        label: editLabel || null,
        pin_color: editColor,
      });

      if (res.data?.success) {
        setHotspots(prev => prev.map(h => h.id === editingHotspot.id ? res.data.data : h));
        setEditingHotspot(null);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update.');
    }
  };

  // ── Delete Hotspot ──

  const handleDelete = async (hotspotId: string) => {
    if (!confirm('Remove this building area from the map?')) return;

    try {
      const res = await api.delete(`/admin/projects/${projectId}/hotspots/${hotspotId}`);
      if (res.data?.success) {
        setHotspots(prev => prev.filter(h => h.id !== hotspotId));
        setEditingHotspot(null);
        if (onRefresh) onRefresh();
      }
    } catch (err) {
      console.error('Failed to delete hotspot', err);
      alert('Failed to delete.');
    }
  };

  // ── Undo last point while drawing ──

  const undoLastPoint = () => {
    setDrawingPoints(prev => prev.slice(0, -1));
  };

  // Buildings not yet mapped
  const unmappedBuildings = buildings.filter(b => !hotspots.some(h => h.building_id === b.id));

  const getBuildingName = (id: string) => {
    const b = buildings.find(item => item.id === id);
    return b ? b.name : 'Unknown';
  };

  // ── Render ──

  return (
    <div style={styles.container}>
      {/* ─── Sidebar ─── */}
      <div className="editor-sidebar" style={styles.sidebar}>
        <h3 style={styles.sidebarTitle}>
          <MapPin size={18} style={{ color: '#003DA6' }} /> Area Manager ({hotspots.length})
        </h3>

        <p style={styles.sidebarInstructions}>
          ✏️ <strong>How to map:</strong> Click "Draw Area" on any building below, then click points on the map to draw a polygon around it. Click the first point again or press "Complete" to finish.
        </p>

        {/* Drawing Mode Banner */}
        {drawingMode && (
          <div style={styles.drawingBanner}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <Pencil size={14} />
              <strong style={{ fontSize: '0.82rem' }}>Drawing: {getBuildingName(drawingBuildingId)}</strong>
            </div>
            <div style={{ fontSize: '0.72rem', color: '#fff', opacity: 0.9, marginBottom: 8 }}>
              {drawingPoints.length} points placed • {drawingPoints.length < 3 ? `Need ${3 - drawingPoints.length} more` : 'Ready to complete!'}
            </div>

            {/* Label & Color for drawing */}
            <div style={{ marginBottom: 6 }}>
              <label style={{ fontSize: '0.62rem', fontWeight: 700, textTransform: 'uppercase' as const, opacity: 0.8 }}>Label</label>
              <input
                style={styles.drawingInput}
                value={drawingLabel}
                onChange={e => setDrawingLabel(e.target.value)}
                placeholder="e.g. Block C"
              />
            </div>
            <div style={{ marginBottom: 10 }}>
              <label style={{ fontSize: '0.62rem', fontWeight: 700, textTransform: 'uppercase' as const, opacity: 0.8 }}>Color</label>
              <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
                {pinColors.map(c => (
                  <button
                    key={c.value}
                    type="button"
                    style={{
                      ...styles.colorCircle,
                      backgroundColor: c.value,
                      borderColor: drawingColor === c.value ? '#fff' : 'transparent',
                    }}
                    onClick={() => setDrawingColor(c.value)}
                  />
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 6 }}>
              {drawingPoints.length > 0 && (
                <button style={styles.undoBtn} onClick={undoLastPoint}>
                  <RotateCcw size={12} /> Undo
                </button>
              )}
              <button style={styles.cancelDrawBtn} onClick={cancelDrawing}>
                <X size={12} /> Cancel
              </button>
              {drawingPoints.length >= 3 && (
                <button style={styles.completeBtn} onClick={handleSavePolygon}>
                  <Check size={12} /> Complete
                </button>
              )}
            </div>
          </div>
        )}

        {/* Mapped Buildings List */}
        {hotspots.length > 0 && (
          <div style={styles.hotspotsList}>
            {hotspots.map(h => (
              <div
                key={h.id}
                style={{
                  ...styles.hotspotCard,
                  borderLeftColor: h.pin_color,
                  ...(editingHotspot?.id === h.id ? styles.hotspotCardActive : {}),
                  ...(hoveredPolygonId === h.id ? { background: 'rgba(0,61,166,0.04)' } : {}),
                }}
                onMouseEnter={() => setHoveredPolygonId(h.id)}
                onMouseLeave={() => setHoveredPolygonId(null)}
                onClick={() => {
                  setEditingHotspot(h);
                  setEditLabel(h.label || '');
                  setEditColor(h.pin_color);
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <strong style={styles.hotspotCardName}>{h.building?.name || getBuildingName(h.building_id)}</strong>
                    <div style={styles.hotspotCardLabel}>
                      {h.polygon_points
                        ? `${h.polygon_points.length} vertices`
                        : `Pin (${Math.round(h.x_percent)}%, ${Math.round(h.y_percent)}%)`
                      }
                      {h.label ? ` • ${h.label}` : ''}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button
                      style={styles.actionBtn}
                      title="Edit settings"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingHotspot(h);
                        setEditLabel(h.label || '');
                        setEditColor(h.pin_color);
                      }}
                    >
                      <Settings size={12} />
                    </button>
                    <button
                      style={{ ...styles.actionBtn, color: '#ef4444' }}
                      title="Remove"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(h.id);
                      }}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Unmapped Buildings — Draw Area buttons */}
        {unmappedBuildings.length > 0 && !drawingMode && (
          <div style={styles.unmappedSection}>
            <h4 style={styles.unmappedTitle}>📍 Unmapped Buildings ({unmappedBuildings.length})</h4>
            {unmappedBuildings.map(b => (
              <button
                key={b.id}
                style={styles.drawAreaBtn}
                onClick={() => startDrawing(b.id)}
              >
                <Pencil size={13} />
                <div style={{ flex: 1, textAlign: 'left' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.82rem' }}>{b.name}</div>
                  <div style={{ fontSize: '0.68rem', color: '#94a3b8', fontWeight: 500 }}>Click to draw area</div>
                </div>
                <MousePointer2 size={14} style={{ color: '#94a3b8' }} />
              </button>
            ))}
          </div>
        )}

        {unmappedBuildings.length === 0 && hotspots.length > 0 && !drawingMode && (
          <div style={{ ...styles.emptyState, padding: '16px', flexGrow: 0 }}>
            <span style={{ fontSize: '0.78rem', color: '#22c55e', fontWeight: 600 }}>
              ✅ All buildings mapped!
            </span>
          </div>
        )}

        {/* Legend */}
        <div style={styles.legendBox}>
          <h4 style={styles.legendTitle}>Map Legend / حالة المباني</h4>
          <div style={styles.legendGrid}>
            <div style={styles.legendItem}><span style={{ ...styles.dot, backgroundColor: '#22c55e' }}></span> Available (متاح)</div>
            <div style={styles.legendItem}><span style={{ ...styles.dot, backgroundColor: '#f59e0b' }}></span> Reserved (محجوز)</div>
            <div style={styles.legendItem}><span style={{ ...styles.dot, backgroundColor: '#ef4444' }}></span> Sold Out (مباع بالكامل)</div>
          </div>
        </div>
      </div>

      {/* ─── Map Viewport ─── */}
      <div style={styles.mapViewport}>
        {!masterPlanImage ? (
          <div style={styles.noImagePlaceholder}>
            <HelpCircle size={48} style={{ color: '#9ca3af', marginBottom: '12px' }} />
            <h4>No Compound Master Plan Image Uploaded</h4>
            <p style={{ maxWidth: '400px', fontSize: '0.85rem', color: '#6b7280', margin: '8px 0 16px 0' }}>
              Please go to the <strong>Media Gallery Manager</strong> in the admin panel to upload a high-quality Compound Master Plan layout first.
            </p>
          </div>
        ) : (
          <div
            ref={containerRef}
            style={{
              ...styles.mapContainer,
              cursor: drawingMode ? 'crosshair' : 'default',
            }}
            onClick={handleMapClick}
            onMouseMove={handleMapMouseMove}
            onMouseUp={handleMapMouseUp}
            onMouseLeave={() => {
              handleMapMouseUp();
              setMousePos(null);
            }}
          >
            <img
              src={masterPlanImage}
              alt="Compound Master Plan"
              style={styles.masterPlanImg}
              draggable={false}
            />

            {/* SVG Overlay for polygons */}
            <svg
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'none',
              }}
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
            >
              {/* Existing hotspot polygons */}
              {hotspots.map(h => {
                if (!h.polygon_points || h.polygon_points.length < 3) return null;
                const points = h.polygon_points.map(p => `${p.x},${p.y}`).join(' ');
                const isEditing = editingHotspot?.id === h.id;
                const isHovered = hoveredPolygonId === h.id;

                return (
                  <g key={h.id}>
                    {/* Polygon fill */}
                    <polygon
                      points={points}
                      fill={hexToRgba(h.pin_color, isEditing ? 0.35 : isHovered ? 0.28 : 0.18)}
                      stroke={h.pin_color}
                      strokeWidth={isEditing ? 0.6 : isHovered ? 0.5 : 0.35}
                      strokeLinejoin="round"
                      style={{
                        pointerEvents: 'all',
                        cursor: drawingMode ? 'crosshair' : isEditing ? 'move' : 'pointer',
                        transition: 'fill 0.2s, stroke-width 0.2s',
                      }}
                      onMouseEnter={() => setHoveredPolygonId(h.id)}
                      onMouseLeave={() => setHoveredPolygonId(null)}
                      onMouseDown={(e) => {
                        if (drawingMode) return;
                        if (isEditing) {
                          e.stopPropagation();
                          e.preventDefault();
                          if (containerRef.current) {
                            const rect = containerRef.current.getBoundingClientRect();
                            const clickX = Math.round(((e.clientX - rect.left) / rect.width) * 10000) / 100;
                            const clickY = Math.round(((e.clientY - rect.top) / rect.height) * 10000) / 100;
                            setDraggingPolygon({ hotspotId: h.id, lastX: clickX, lastY: clickY });
                          }
                        }
                      }}
                      onClick={(e) => {
                        if (drawingMode) return;
                        e.stopPropagation();
                        setEditingHotspot(h);
                        setEditLabel(h.label || '');
                        setEditColor(h.pin_color);
                      }}
                    />

                    {/* Vertex handles when editing */}
                    {isEditing && h.polygon_points.map((p, vi) => (
                      <circle
                        key={vi}
                        cx={p.x}
                        cy={p.y}
                        r={0.7}
                        fill="#fff"
                        stroke={h.pin_color}
                        strokeWidth={0.25}
                        style={{ pointerEvents: 'all', cursor: 'grab' }}
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          setDraggingVertex({ hotspotId: h.id, vertexIndex: vi });
                        }}
                      />
                    ))}

                    {/* Label at centroid */}
                    <text
                      x={h.x_percent}
                      y={h.y_percent}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill={isHovered || isEditing ? '#fff' : h.pin_color}
                      fontSize={isHovered || isEditing ? 2.2 : 1.8}
                      fontWeight="800"
                      fontFamily="var(--font-title), system-ui, sans-serif"
                      style={{
                        pointerEvents: 'none',
                        paintOrder: 'stroke',
                        stroke: isHovered || isEditing ? h.pin_color : 'rgba(255,255,255,0.85)',
                        strokeWidth: isHovered || isEditing ? 0.4 : 0.5,
                        strokeLinejoin: 'round',
                        transition: 'font-size 0.2s',
                      } as any}
                    >
                      {h.label || h.building?.name || 'Building'}
                    </text>
                  </g>
                );
              })}

              {/* Drawing in-progress polygon */}
              {drawingMode && drawingPoints.length > 0 && (
                <g>
                  {/* Filled polygon preview */}
                  {drawingPoints.length >= 3 && (
                    <polygon
                      points={drawingPoints.map(p => `${p.x},${p.y}`).join(' ')}
                      fill={hexToRgba(drawingColor, 0.2)}
                      stroke={drawingColor}
                      strokeWidth={0.4}
                      strokeDasharray="1,0.5"
                      strokeLinejoin="round"
                      style={{ pointerEvents: 'none' }}
                    />
                  )}

                  {/* Lines between points */}
                  {drawingPoints.map((p, i) => {
                    const next = drawingPoints[i + 1];
                    if (!next) return null;
                    return (
                      <line
                        key={i}
                        x1={p.x} y1={p.y}
                        x2={next.x} y2={next.y}
                        stroke={drawingColor}
                        strokeWidth={0.4}
                        strokeDasharray="1,0.5"
                        style={{ pointerEvents: 'none' }}
                      />
                    );
                  })}

                  {/* Rubber band line from last point to cursor */}
                  {mousePos && drawingPoints.length > 0 && (
                    <line
                      x1={drawingPoints[drawingPoints.length - 1].x}
                      y1={drawingPoints[drawingPoints.length - 1].y}
                      x2={mousePos.x}
                      y2={mousePos.y}
                      stroke={drawingColor}
                      strokeWidth={0.3}
                      strokeDasharray="0.8,0.4"
                      opacity={0.7}
                      style={{ pointerEvents: 'none' }}
                    />
                  )}

                  {/* Vertex dots */}
                  {drawingPoints.map((p, i) => (
                    <circle
                      key={i}
                      cx={p.x}
                      cy={p.y}
                      r={i === 0 && drawingPoints.length >= 3 ? 1.0 : 0.6}
                      fill={i === 0 && drawingPoints.length >= 3 ? '#fff' : drawingColor}
                      stroke={drawingColor}
                      strokeWidth={0.25}
                      style={{ pointerEvents: i === 0 && drawingPoints.length >= 3 ? 'all' : 'none', cursor: i === 0 ? 'pointer' : 'default' }}
                      onClick={(e) => {
                        if (i === 0 && drawingPoints.length >= 3) {
                          e.stopPropagation();
                          handleSavePolygon();
                        }
                      }}
                    />
                  ))}
                </g>
              )}
            </svg>

            {/* Fallback: Render pin markers for hotspots WITHOUT polygons */}
            {hotspots.filter(h => !h.polygon_points || h.polygon_points.length < 3).map(h => (
              <div
                key={`pin-${h.id}`}
                className="pin-marker"
                style={{
                  position: 'absolute',
                  left: `${h.x_percent}%`,
                  top: `${h.y_percent}%`,
                  transform: 'translate(-50%, -50%)',
                  width: 16,
                  height: 16,
                  borderRadius: '50%',
                  background: h.pin_color,
                  border: '2.5px solid rgba(255,255,255,0.9)',
                  boxShadow: `0 2px 8px ${h.pin_color}66`,
                  cursor: 'pointer',
                  zIndex: 10,
                  transition: 'transform 0.2s, box-shadow 0.2s',
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  setEditingHotspot(h);
                  setEditLabel(h.label || '');
                  setEditColor(h.pin_color);
                }}
              />
            ))}

            {/* Editing Popover */}
            {editingHotspot && (
              <div
                className="editor-popover"
                style={{
                  ...styles.popover,
                  left: `${editingHotspot.x_percent}%`,
                  top: `${editingHotspot.y_percent}%`,
                  transform: `translate(${editingHotspot.x_percent > 65 ? '-100%' : '10px'}, ${editingHotspot.y_percent > 65 ? '-100%' : '10px'})`,
                }}
                onClick={e => e.stopPropagation()}
              >
                <h4 style={styles.popoverTitle}>⚙️ Edit Area Settings</h4>
                <div style={{ fontSize: '0.8rem', color: '#6b7280', marginBottom: '8px' }}>
                  Building: <strong>{editingHotspot.building?.name || getBuildingName(editingHotspot.building_id)}</strong>
                  {editingHotspot.polygon_points && (
                    <span style={{ marginLeft: 8, fontSize: '0.7rem', color: '#94a3b8' }}>
                      ({editingHotspot.polygon_points.length} vertices)
                    </span>
                  )}
                </div>

                <form onSubmit={handleEditSubmit} style={styles.popoverForm}>
                  <div style={styles.formGroup}>
                    <label style={styles.formLabel}>Pin Label</label>
                    <input
                      style={styles.formInput}
                      type="text"
                      value={editLabel}
                      onChange={e => setEditLabel(e.target.value)}
                      placeholder="e.g. Block C"
                    />
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.formLabel}>Area Color</label>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {pinColors.map(c => (
                        <button
                          key={c.value}
                          type="button"
                          style={{
                            ...styles.colorCircle,
                            backgroundColor: c.value,
                            borderColor: editColor === c.value ? '#111827' : 'transparent',
                          }}
                          onClick={() => setEditColor(c.value)}
                        />
                      ))}
                    </div>
                  </div>

                  <div style={styles.popoverActions}>
                    <button
                      type="button"
                      style={styles.popoverDangerBtn}
                      onClick={() => handleDelete(editingHotspot.id)}
                    >
                      Delete Area
                    </button>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        type="button"
                        style={styles.popoverCancelBtn}
                        onClick={() => setEditingHotspot(null)}
                      >
                        Close
                      </button>
                      <button type="submit" style={styles.popoverSaveBtn}>
                        Save
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// ── Styles ──

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    gap: '24px',
    background: 'rgba(255, 255, 255, 0.4)',
    backdropFilter: 'blur(12px)',
    border: '1px solid rgba(255, 255, 255, 0.3)',
    borderRadius: '16px',
    padding: '20px',
    minHeight: '500px',
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  sidebar: {
    flex: '1 1 300px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    borderRight: '1px solid rgba(0,0,0,0.06)',
    paddingRight: '20px',
    minWidth: '280px',
    maxHeight: '700px',
    overflowY: 'auto',
  },
  sidebarTitle: {
    fontSize: '1.1rem',
    fontWeight: 700,
    margin: 0,
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  sidebarInstructions: {
    fontSize: '0.78rem',
    color: '#4b5563',
    lineHeight: '1.4',
    margin: 0,
    background: 'rgba(59, 130, 246, 0.05)',
    padding: '12px',
    borderRadius: '10px',
    border: '1px solid rgba(59, 130, 246, 0.1)',
  },
  drawingBanner: {
    background: 'linear-gradient(135deg, #003DA6, #0369a1)',
    color: '#fff',
    borderRadius: 14,
    padding: '14px 16px',
    boxShadow: '0 8px 20px rgba(0,61,166,0.2)',
  },
  drawingInput: {
    width: '100%',
    padding: '6px 10px',
    borderRadius: 8,
    border: '1px solid rgba(255,255,255,0.2)',
    background: 'rgba(255,255,255,0.15)',
    color: '#fff',
    fontSize: '0.78rem',
    outline: 'none',
    marginTop: 4,
    boxSizing: 'border-box' as const,
  },
  undoBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    padding: '5px 10px',
    borderRadius: 8,
    border: '1px solid rgba(255,255,255,0.2)',
    background: 'rgba(255,255,255,0.1)',
    color: '#fff',
    fontSize: '0.72rem',
    fontWeight: 600,
    cursor: 'pointer',
  },
  cancelDrawBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    padding: '5px 10px',
    borderRadius: 8,
    border: '1px solid rgba(255,255,255,0.2)',
    background: 'rgba(239,68,68,0.3)',
    color: '#fff',
    fontSize: '0.72rem',
    fontWeight: 600,
    cursor: 'pointer',
  },
  completeBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    padding: '5px 12px',
    borderRadius: 8,
    border: 'none',
    background: '#22c55e',
    color: '#fff',
    fontSize: '0.72rem',
    fontWeight: 700,
    cursor: 'pointer',
    boxShadow: '0 2px 8px rgba(34,197,94,0.3)',
  },
  hotspotsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    overflowY: 'auto',
    maxHeight: '280px',
  },
  hotspotCard: {
    background: '#fff',
    border: '1px solid rgba(0,0,0,0.06)',
    borderLeftWidth: '5px',
    borderRadius: '10px',
    padding: '12px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
  },
  hotspotCardActive: {
    boxShadow: '0 4px 12px rgba(0,61,166,0.1)',
    borderColor: '#003DA6',
    background: 'rgba(0,61,166,0.02)',
  },
  hotspotCardName: {
    fontSize: '0.85rem',
    color: '#111827',
  },
  hotspotCardLabel: {
    fontSize: '0.7rem',
    color: '#6b7280',
    marginTop: '2px',
  },
  actionBtn: {
    border: 'none',
    background: 'none',
    cursor: 'pointer',
    padding: '6px',
    borderRadius: '6px',
    color: '#4b5563',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background-color 0.15s',
  },
  unmappedSection: {
    marginTop: 4,
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  unmappedTitle: {
    fontSize: '0.78rem',
    fontWeight: 700,
    color: '#4b5563',
    margin: '0 0 4px 0',
  },
  drawAreaBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '10px 14px',
    border: '1.5px dashed rgba(0,61,166,0.2)',
    borderRadius: 12,
    background: 'rgba(0,61,166,0.02)',
    cursor: 'pointer',
    transition: 'all 0.2s',
    color: '#003DA6',
    textAlign: 'left' as const,
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px 20px',
    textAlign: 'center',
    fontSize: '0.8rem',
    color: '#9ca3af',
    border: '1px dashed rgba(0,0,0,0.1)',
    borderRadius: '12px',
    flexGrow: 1,
  },
  legendBox: {
    marginTop: 'auto',
    background: '#f9fafb',
    border: '1px solid rgba(0,0,0,0.05)',
    borderRadius: '12px',
    padding: '12px',
  },
  legendTitle: {
    fontSize: '0.74rem',
    fontWeight: 700,
    textTransform: 'uppercase',
    color: '#4b5563',
    margin: '0 0 8px 0',
  },
  legendGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  legendItem: {
    fontSize: '0.72rem',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    color: '#374151',
  },
  dot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    display: 'inline-block',
  },
  mapViewport: {
    flex: '2 1 450px',
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'center',
    background: '#f3f4f6',
    border: '1px solid rgba(0,0,0,0.08)',
    borderRadius: '16px',
    overflow: 'auto',
    position: 'relative',
    minHeight: '400px',
    maxHeight: '650px',
  },
  noImagePlaceholder: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    padding: '40px',
  },
  mapContainer: {
    position: 'relative',
    display: 'inline-block',
    width: '100%',
    maxWidth: '100%',
    userSelect: 'none',
  },
  masterPlanImg: {
    width: '100%',
    height: 'auto',
    display: 'block',
  },
  colorCircle: {
    width: '20px',
    height: '20px',
    borderRadius: '50%',
    border: '2.5px solid transparent',
    cursor: 'pointer',
    padding: 0,
    transition: 'all 0.15s',
  },
  popover: {
    position: 'absolute',
    background: '#ffffff',
    border: '1px solid rgba(0,0,0,0.12)',
    boxShadow: '0 10px 25px -5px rgba(0,0,0,0.15)',
    borderRadius: '12px',
    padding: '16px',
    width: '240px',
    zIndex: 200,
    cursor: 'default',
  },
  popoverTitle: {
    fontSize: '0.85rem',
    fontWeight: 700,
    color: '#1f2937',
    margin: '0 0 10px 0',
  },
  popoverForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  formLabel: {
    fontSize: '0.68rem',
    fontWeight: 700,
    textTransform: 'uppercase',
    color: '#6b7280',
  },
  formInput: {
    padding: '8px 10px',
    borderRadius: '8px',
    border: '1px solid rgba(0,0,0,0.1)',
    fontSize: '0.8rem',
    outline: 'none',
    background: '#fff',
  },
  popoverActions: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '6px',
    gap: '6px',
  },
  popoverCancelBtn: {
    background: 'rgba(0,0,0,0.05)',
    color: '#374151',
    border: 'none',
    padding: '6px 12px',
    borderRadius: '8px',
    fontSize: '0.75rem',
    fontWeight: 600,
    cursor: 'pointer',
  },
  popoverSaveBtn: {
    background: 'linear-gradient(135deg, #003DA6, #0284c7)',
    color: '#fff',
    border: 'none',
    padding: '6px 12px',
    borderRadius: '8px',
    fontSize: '0.75rem',
    fontWeight: 600,
    cursor: 'pointer',
  },
  popoverDangerBtn: {
    background: 'none',
    border: 'none',
    color: '#ef4444',
    fontSize: '0.72rem',
    fontWeight: 600,
    cursor: 'pointer',
    padding: 0,
  },
};
