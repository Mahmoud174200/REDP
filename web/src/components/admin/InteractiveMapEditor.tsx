import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Plus, Minus, RotateCcw, Trash2, Check, X, HelpCircle, Eye, Settings } from 'lucide-react';
import api from '../../services/api';

interface Building {
  id: string;
  name: string;
  name_ar: string | null;
  type: string;
  total_floors: number;
  status: string;
  units_count?: number;
  units?: any[];
}

interface Hotspot {
  id: string;
  project_id: string;
  building_id: string;
  x_percent: number;
  y_percent: number;
  label: string | null;
  pin_color: string;
  building?: Building;
  availability_status?: string;
  units_summary?: {
    total: number;
    available: number;
    sold: number;
    reserved: number;
    occupancy_percent: number;
  };
}

interface InteractiveMapEditorProps {
  projectId: string;
  buildings: Building[];
  masterPlanImage: string | null;
  onRefresh?: () => void;
}

export const InteractiveMapEditor: React.FC<InteractiveMapEditorProps> = ({
  projectId,
  buildings,
  masterPlanImage,
  onRefresh
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const [hotspots, setHotspots] = useState<Hotspot[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Placement/Editing state
  const [tempClickPos, setTempClickPos] = useState<{ x: number; y: number } | null>(null);
  const [selectedBuildingId, setSelectedBuildingId] = useState<string>('');
  const [pinLabel, setPinLabel] = useState<string>('');
  
  // Active editing hotspot details
  const [editingHotspot, setEditingHotspot] = useState<Hotspot | null>(null);
  
  // Dragging states
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragStartPos, setDragStartPos] = useState<{ x: number; y: number } | null>(null);
  const isDraggingRef = useRef(false);

  // Zoom & Pan States
  const [zoomScale, setZoomScale] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const panStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const didPanRef = useRef<boolean>(false);

  // Image Dimensions
  const [imgSize, setImgSize] = useState<{ width: number; height: number } | null>(null);
  const [viewportSize, setViewportSize] = useState<{ width: number; height: number }>({ width: 800, height: 500 });

  // Load hotspots
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

  // Update viewport size
  useEffect(() => {
    if (viewportRef.current) {
      const rect = viewportRef.current.getBoundingClientRect();
      setViewportSize({ width: rect.width, height: rect.height });
    }
  }, [masterPlanImage]);

  // Prevent default scroll on mouse wheel and zoom instead
  useEffect(() => {
    const container = viewportRef.current;
    if (!container) return;

    const handleWheelEvent = (e: WheelEvent) => {
      e.preventDefault();
      const zoomFactor = 0.12;
      setZoomScale(prev => {
        let newScale = prev + (e.deltaY < 0 ? zoomFactor : -zoomFactor);
        return Math.max(0.5, Math.min(4, newScale));
      });
    };

    container.addEventListener('wheel', handleWheelEvent, { passive: false });
    return () => {
      container.removeEventListener('wheel', handleWheelEvent);
    };
  }, []);

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    setImgSize({ width: img.naturalWidth, height: img.naturalHeight });
  };

  // Base Scale Calculation to fit the natural size in the viewport
  const getBaseScale = () => {
    if (!imgSize) return 1;
    const scaleX = viewportSize.width / imgSize.width;
    const scaleY = viewportSize.height / imgSize.height;
    return Math.min(scaleX, scaleY) * 0.95; // Fit with 5% margins
  };

  const baseScale = getBaseScale();
  const currentScale = baseScale * zoomScale;

  // Handle clicking on the master plan image to spawn a pin
  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isDraggingRef.current) {
      isDraggingRef.current = false;
      return;
    }
    if (didPanRef.current) {
      didPanRef.current = false;
      return;
    }
    
    if ((e.target as HTMLElement).closest('.pin-marker') || (e.target as HTMLElement).closest('.editor-popover')) {
      return;
    }

    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    // Reset create fields
    setTempClickPos({ x, y });
    const remaining = unpinnedBuildings();
    if (remaining.length > 0) {
      setSelectedBuildingId(remaining[0].id);
      setPinLabel(remaining[0].name);
    } else {
      setSelectedBuildingId('');
      setPinLabel('');
    }
    setEditingHotspot(null);
  };

  // Drag Handlers for moving hotspots
  const handleDragStart = (e: React.MouseEvent, hotspot: Hotspot) => {
    e.stopPropagation();
    e.preventDefault();
    setDraggingId(hotspot.id);
    setDragStartPos({ x: e.clientX, y: e.clientY });
    isDraggingRef.current = false;
  };

  const handleContainerMouseMove = (e: React.MouseEvent) => {
    if (!draggingId || !containerRef.current) return;
    
    if (dragStartPos && (Math.abs(e.clientX - dragStartPos.x) > 3 || Math.abs(e.clientY - dragStartPos.y) > 3)) {
      isDraggingRef.current = true;
    }

    if (!isDraggingRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));

    setHotspots(prev => prev.map(h => h.id === draggingId ? { ...h, x_percent: x, y_percent: y } : h));
  };

  const handleDragEnd = async () => {
    if (!draggingId) return;
    
    const h = hotspots.find(item => item.id === draggingId);
    setDraggingId(null);
    setDragStartPos(null);

    if (h && isDraggingRef.current) {
      try {
        await api.put(`/admin/projects/${projectId}/hotspots/${h.id}`, {
          x_percent: h.x_percent,
          y_percent: h.y_percent
        });
      } catch (err) {
        console.error('Failed to update hotspot position', err);
        alert('Failed to save updated pin location.');
        fetchHotspots();
      }
    }
  };

  // Map panning handlers
  const handleMapMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('.pin-marker') || (e.target as HTMLElement).closest('.editor-popover') || (e.target as HTMLElement).closest('.editor-toolbar')) {
      return;
    }
    
    setIsPanning(true);
    didPanRef.current = false;
    panStartRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
  };

  const handleMapMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (draggingId) {
      handleContainerMouseMove(e);
      return;
    }

    if (!isPanning) return;
    
    const dx = e.clientX - panStartRef.current.x;
    const dy = e.clientY - panStartRef.current.y;
    
    if (Math.abs(dx - pan.x) > 3 || Math.abs(dy - pan.y) > 3) {
      didPanRef.current = true;
    }
    
    setPan({ x: dx, y: dy });
  };

  const handleMapMouseUp = (e: React.MouseEvent<HTMLDivElement>) => {
    if (draggingId) {
      handleDragEnd();
      return;
    }
    setIsPanning(false);
  };

  // Helper to determine building status details dynamically
  const getBuildingStatusDetails = (buildingId: string) => {
    const b = buildings.find(item => item.id === buildingId);
    if (!b) return { label: 'Unknown', color: '#94a3b8' };
    
    const units = b.units || [];
    const total = units.length;
    if (total === 0) return { label: 'Empty (No Units Defined) / مبنى فارغ بدون وحدات', color: '#94a3b8' };
    
    const available = units.filter((u: any) => u.status === 'available').length;
    
    if (available === 0) {
      return { label: 'Sold Out / مباع بالكامل', color: '#ef4444' };
    } else if (available < total * 0.3) {
      return { label: 'Reserved / Limited Availability / محجوز ومحدود', color: '#f59e0b' };
    } else {
      return { label: 'Available / متاح للبيع', color: '#22c55e' };
    }
  };

  // Submit new hotspot mapping to database
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tempClickPos || !selectedBuildingId) return;

    try {
      const res = await api.post(`/admin/projects/${projectId}/hotspots`, {
        building_id: selectedBuildingId,
        x_percent: tempClickPos.x,
        y_percent: tempClickPos.y,
        label: pinLabel || null,
      });

      if (res.data?.success) {
        setHotspots(prev => [...prev, res.data.data]);
        setTempClickPos(null);
        if (onRefresh) onRefresh();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to place building marker.');
    }
  };

  // Submit hotspot edits
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingHotspot) return;

    try {
      const res = await api.put(`/admin/projects/${projectId}/hotspots/${editingHotspot.id}`, {
        label: pinLabel || null,
      });

      if (res.data?.success) {
        setHotspots(prev => prev.map(h => h.id === editingHotspot.id ? res.data.data : h));
        setEditingHotspot(null);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update building marker details.');
    }
  };

  // Delete hotspot
  const handleDelete = async (hotspotId: string) => {
    if (!confirm('Are you sure you want to remove this building pin from the map?')) return;

    try {
      const res = await api.delete(`/admin/projects/${projectId}/hotspots/${hotspotId}`);
      if (res.data?.success) {
        setHotspots(prev => prev.filter(h => h.id !== hotspotId));
        setEditingHotspot(null);
        if (onRefresh) onRefresh();
      }
    } catch (err) {
      console.error('Failed to delete hotspot', err);
      alert('Failed to delete pin.');
    }
  };

  const unpinnedBuildings = () => {
    return buildings.filter(b => !hotspots.some(h => h.building_id === b.id));
  };

  const getBuildingName = (id: string) => {
    const b = buildings.find(item => item.id === id);
    return b ? b.name : 'Unknown Building';
  };

  return (
    <div style={styles.container}>
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes us3d-pulse-glow {
          0% { transform: translate(-50%, -50%) scale(0.85); opacity: 0.9; }
          100% { transform: translate(-50%, -50%) scale(2.2); opacity: 0; }
        }
        .crisp-master-plan {
          image-rendering: -webkit-optimize-contrast !important;
          image-rendering: crisp-edges !important;
          image-rendering: optimizeQuality !important;
          -ms-interpolation-mode: nearest-neighbor !important;
        }
      `}} />

      {/* Sidebar - Hotspot List and controls */}
      <div style={styles.sidebar}>
        <h3 style={styles.sidebarTitle}>
          <MapPin size={18} style={{ color: '#003DA6' }} /> Hotspots Manager ({hotspots.length})
        </h3>
        
        <p style={styles.sidebarInstructions}>
          📍 <strong>Interaction:</strong> Click on the map to pin a building. Hold and drag to pan, scroll mouse wheel or use controls below to zoom.
        </p>

        {hotspots.length === 0 ? (
          <div style={styles.emptyState}>
            <MapPin size={32} style={{ opacity: 0.3, marginBottom: '8px' }} />
            <span>No hotspots configured. Pinned buildings will appear here.</span>
          </div>
        ) : (
          <div style={styles.hotspotsList}>
            {hotspots.map(h => (
              <div
                key={h.id}
                style={{
                  ...styles.hotspotCard,
                  borderLeftColor: h.pin_color,
                  ...(editingHotspot?.id === h.id ? styles.hotspotCardActive : {})
                }}
                onClick={() => {
                  setEditingHotspot(h);
                  setPinLabel(h.label || '');
                  setTempClickPos(null);
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <strong style={styles.hotspotCardName}>{h.building?.name || getBuildingName(h.building_id)}</strong>
                    <div style={styles.hotspotCardLabel}>
                      {h.label ? `Tag: ${h.label}` : 'No label'} • ({Math.round(h.x_percent)}%, {Math.round(h.y_percent)}%)
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button
                      style={styles.actionBtn}
                      title="Edit settings"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingHotspot(h);
                        setPinLabel(h.label || '');
                        setTempClickPos(null);
                      }}
                    >
                      <Settings size={12} />
                    </button>
                    <button
                      style={{ ...styles.actionBtn, color: '#ef4444' }}
                      title="Remove Pin"
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

        <div style={styles.legendBox}>
          <h4 style={styles.legendTitle}>Map Legend / حالة المباني</h4>
          <div style={styles.legendGrid}>
            <div style={styles.legendItem}><span style={{ ...styles.dot, backgroundColor: '#22c55e' }}></span> Available (متاح)</div>
            <div style={styles.legendItem}><span style={{ ...styles.dot, backgroundColor: '#f59e0b' }}></span> Reserved (محجوز)</div>
            <div style={styles.legendItem}><span style={{ ...styles.dot, backgroundColor: '#ef4444' }}></span> Sold Out (مباع بالكامل)</div>
            <div style={styles.legendItem}><span style={{ ...styles.dot, backgroundColor: '#94a3b8' }}></span> Empty (بدون وحدات)</div>
          </div>
        </div>
      </div>

      {/* Main Interactive Map Viewport */}
      <div 
        ref={viewportRef}
        style={styles.mapViewport}
        onMouseDown={handleMapMouseDown}
        onMouseMove={handleMapMouseMove}
        onMouseUp={handleMapMouseUp}
        onMouseLeave={handleMapMouseUp}
      >
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
              width: imgSize ? `${imgSize.width}px` : '100%',
              height: imgSize ? `${imgSize.height}px` : '100%',
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${currentScale})`,
              transition: isPanning ? 'none' : 'transform 0.15s ease-out',
              cursor: isPanning ? 'grabbing' : 'grab',
            }}
            onClick={handleImageClick}
          >
            <img
              src={masterPlanImage}
              alt="Compound Master Plan"
              className="crisp-master-plan"
              style={styles.masterPlanImg}
              onLoad={handleImageLoad}
              draggable={false}
            />

            {/* Render existing pins as glowing vector circles */}
            {imgSize && hotspots.map(h => {
              const isHovered = editingHotspot?.id === h.id;
              return (
                <div
                  key={h.id}
                  className="pin-marker"
                  style={{
                    position: 'absolute',
                    left: `${h.x_percent}%`,
                    top: `${h.y_percent}%`,
                    transform: `translate(-50%, -50%) scale(${(draggingId === h.id ? 1.3 : isHovered ? 1.2 : 1) / currentScale})`,
                    transition: 'transform 0.15s ease',
                    zIndex: draggingId === h.id ? 100 : 10,
                    cursor: 'grab',
                  }}
                  onMouseDown={(e) => handleDragStart(e, h)}
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingHotspot(h);
                    setPinLabel(h.label || '');
                    setTempClickPos(null);
                  }}
                >
                  {/* Outer pulse animation ring */}
                  <div style={{
                    position: 'absolute',
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    border: `2px solid ${h.pin_color}`,
                    transform: 'translate(-50%, -50%)',
                    boxShadow: `0 0 12px ${h.pin_color}`,
                    animation: 'us3d-pulse-glow 2s infinite',
                    pointerEvents: 'none',
                    zIndex: 1,
                  }} />

                  {/* Sleek vector target circle */}
                  <div style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    backgroundColor: isHovered ? h.pin_color : 'rgba(255, 255, 255, 0.95)',
                    border: `3px solid ${h.pin_color}`,
                    boxShadow: `0 0 15px ${h.pin_color}, inset 0 0 4px rgba(0,0,0,0.15)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transform: 'translate(-50%, -50%)',
                    position: 'relative',
                    zIndex: 2,
                  }}>
                    <div style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: isHovered ? '#fff' : h.pin_color,
                    }} />
                  </div>

                  {/* Floating tooltip */}
                  <div style={{
                    ...styles.pinLabel,
                    transform: `translateX(-50%) scale(${1})`,
                    top: '18px',
                  }}>
                    {h.label || h.building?.name || 'Building'}
                  </div>
                </div>
              );
            })}

            {/* Clicked temporary placement form popover */}
            {tempClickPos && (
              <div
                className="editor-popover"
                style={{
                  ...styles.popover,
                  left: `${tempClickPos.x}%`,
                  top: `${tempClickPos.y}%`,
                  transform: `translate(${tempClickPos.x > 75 ? '-100%' : '0'}, ${tempClickPos.y > 75 ? '-100%' : '0'}) scale(${1 / currentScale})`,
                  transformOrigin: 'top left',
                }}
                onClick={e => e.stopPropagation()}
              >
                <h4 style={styles.popoverTitle}>📍 Pin New Building</h4>
                {unpinnedBuildings().length === 0 ? (
                  <p style={{ fontSize: '0.8rem', color: '#ef4444', margin: '8px 0' }}>
                    All buildings are already pinned on the map! Create new buildings in the checklist first.
                  </p>
                ) : (
                  <form onSubmit={handleCreateSubmit} style={styles.popoverForm}>
                    <div style={styles.formGroup}>
                      <label style={styles.label}>Select Building</label>
                      <select
                        style={styles.select}
                        value={selectedBuildingId}
                        onChange={(e) => {
                          setSelectedBuildingId(e.target.value);
                          const b = buildings.find(x => x.id === e.target.value);
                          if (b) setPinLabel(b.name);
                        }}
                        required
                      >
                        {unpinnedBuildings().map(b => (
                          <option key={b.id} value={b.id}>{b.name}</option>
                        ))}
                      </select>
                    </div>

                    <div style={styles.formGroup}>
                      <label style={styles.label}>Pin Custom Label</label>
                      <input
                        style={styles.input}
                        type="text"
                        value={pinLabel}
                        onChange={e => setPinLabel(e.target.value)}
                        placeholder="e.g. Block C"
                      />
                    </div>

                    {selectedBuildingId && (
                      <div style={styles.formGroup}>
                        <label style={styles.label}>Building Status (Auto-resolved)</label>
                        <div style={styles.statusDisplay}>
                          <span style={{
                            ...styles.dot,
                            backgroundColor: getBuildingStatusDetails(selectedBuildingId).color,
                            width: '10px', height: '10px'
                          }}></span>
                          <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>
                            {getBuildingStatusDetails(selectedBuildingId).label}
                          </span>
                        </div>
                      </div>
                    )}

                    <div style={styles.popoverActions}>
                      <button
                        type="button"
                        style={styles.popoverCancelBtn}
                        onClick={() => setTempClickPos(null)}
                      >
                        Cancel
                      </button>
                      <button type="submit" style={styles.popoverSaveBtn}>
                        Place Pin
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {/* Editing state popover */}
            {editingHotspot && (
              <div
                className="editor-popover"
                style={{
                  ...styles.popover,
                  left: `${editingHotspot.x_percent}%`,
                  top: `${editingHotspot.y_percent}%`,
                  transform: `translate(${editingHotspot.x_percent > 75 ? '-100%' : '0'}, ${editingHotspot.y_percent > 75 ? '-100%' : '0'}) scale(${1 / currentScale})`,
                  transformOrigin: 'top left',
                }}
                onClick={e => e.stopPropagation()}
              >
                <h4 style={styles.popoverTitle}>⚙️ Edit Pin Settings</h4>
                <div style={{ fontSize: '0.8rem', color: '#6b7280', marginBottom: '8px' }}>
                  Building: <strong>{editingHotspot.building?.name || getBuildingName(editingHotspot.building_id)}</strong>
                </div>

                <form onSubmit={handleEditSubmit} style={styles.popoverForm}>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Pin Label</label>
                    <input
                      style={styles.input}
                      type="text"
                      value={pinLabel}
                      onChange={e => setPinLabel(e.target.value)}
                      placeholder="e.g. Block C"
                    />
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.label}>Building Status (Auto-resolved)</label>
                    <div style={styles.statusDisplay}>
                      <span style={{
                        ...styles.dot,
                        backgroundColor: getBuildingStatusDetails(editingHotspot.building_id).color,
                        width: '10px', height: '10px'
                      }}></span>
                      <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>
                        {getBuildingStatusDetails(editingHotspot.building_id).label}
                      </span>
                    </div>
                  </div>

                  <div style={styles.popoverActions}>
                    <button
                      type="button"
                      style={styles.popoverDangerBtn}
                      onClick={() => handleDelete(editingHotspot.id)}
                    >
                      Delete Marker
                    </button>
                    <div style={{ display: 'flex', gap: '8px' }}>
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

        {/* Floating Viewport Toolbar */}
        {masterPlanImage && (
          <div className="editor-toolbar" style={styles.toolbar}>
            <button style={styles.toolbarBtn} onClick={() => setZoomScale(prev => Math.min(4, prev + 0.25))} title="Zoom In">
              <Plus size={16} />
            </button>
            <div style={styles.toolbarDivider}></div>
            <span style={styles.zoomLabel}>{Math.round(zoomScale * 100)}%</span>
            <div style={styles.toolbarDivider}></div>
            <button style={styles.toolbarBtn} onClick={() => setZoomScale(prev => Math.max(0.5, prev - 0.25))} title="Zoom Out">
              <Minus size={16} />
            </button>
            <div style={styles.toolbarDivider}></div>
            <button style={styles.toolbarBtn} onClick={() => { setZoomScale(1); setPan({ x: 0, y: 0 }); }} title="Reset View">
              <RotateCcw size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    gap: '24px',
    background: 'rgba(255, 255, 255, 0.4)',
    backdropFilter: 'blur(12px)',
    border: '1px solid rgba(255, 255, 255, 0.3)',
    borderRadius: '16px',
    padding: '20px',
    minHeight: '550px',
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
  } as React.CSSProperties,
  sidebar: {
    flex: '1 1 300px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '16px',
    borderRight: '1px solid rgba(0,0,0,0.06)',
    paddingRight: '20px',
    minWidth: '280px',
  } as React.CSSProperties,
  sidebarTitle: {
    fontSize: '1.1rem',
    fontWeight: 700,
    margin: 0,
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  } as React.CSSProperties,
  sidebarInstructions: {
    fontSize: '0.8rem',
    color: '#4b5563',
    lineHeight: '1.4',
    margin: 0,
    background: 'rgba(59, 130, 246, 0.05)',
    padding: '12px',
    borderRadius: '10px',
    border: '1px solid rgba(59, 130, 246, 0.1)',
  } as React.CSSProperties,
  emptyState: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px 20px',
    textAlign: 'center' as const,
    fontSize: '0.8rem',
    color: '#9ca3af',
    border: '1px dashed rgba(0,0,0,0.1)',
    borderRadius: '12px',
    flexGrow: 1,
  } as React.CSSProperties,
  hotspotsList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px',
    overflowY: 'auto' as const,
    maxHeight: '360px',
    flexGrow: 1,
  } as React.CSSProperties,
  hotspotCard: {
    background: '#fff',
    border: '1px solid rgba(0,0,0,0.06)',
    borderLeftWidth: '5px',
    borderRadius: '10px',
    padding: '12px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
  } as React.CSSProperties,
  hotspotCardActive: {
    boxShadow: '0 4px 12px rgba(0,3d,a6,0.1)',
    borderColor: '#003DA6',
    background: 'rgba(0,61,166,0.01)',
  } as React.CSSProperties,
  hotspotCardName: {
    fontSize: '0.88rem',
    color: '#111827',
  } as React.CSSProperties,
  hotspotCardLabel: {
    fontSize: '0.72rem',
    color: '#6b7280',
    marginTop: '2px',
  } as React.CSSProperties,
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
    ':hover': { background: '#f3f4f6' }
  } as React.CSSProperties,
  legendBox: {
    marginTop: 'auto',
    background: '#f9fafb',
    border: '1px solid rgba(0,0,0,0.05)',
    borderRadius: '12px',
    padding: '12px',
  } as React.CSSProperties,
  legendTitle: {
    fontSize: '0.78rem',
    fontWeight: 700,
    textTransform: 'uppercase' as const,
    color: '#4b5563',
    margin: '0 0 8px 0',
  } as React.CSSProperties,
  legendGrid: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '6px',
  } as React.CSSProperties,
  legendItem: {
    fontSize: '0.75rem',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    color: '#374151',
  } as React.CSSProperties,
  dot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    display: 'inline-block',
  } as React.CSSProperties,
  mapViewport: {
    flex: '2 1 450px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#f3f4f6',
    border: '1px solid rgba(0,0,0,0.08)',
    borderRadius: '16px',
    overflow: 'hidden',
    position: 'relative' as const,
    minHeight: '500px',
    userSelect: 'none' as const,
  } as React.CSSProperties,
  noImagePlaceholder: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    textAlign: 'center' as const,
    padding: '40px',
  } as React.CSSProperties,
  mapContainer: {
    position: 'relative' as const,
    userSelect: 'none' as const,
  } as React.CSSProperties,
  masterPlanImg: {
    width: '100%',
    height: '100%',
    display: 'block',
    pointerEvents: 'none' as const,
  } as React.CSSProperties,
  pinLabel: {
    position: 'absolute' as const,
    left: '50%',
    background: '#1f2937',
    color: '#fff',
    fontSize: '0.68rem',
    fontWeight: 600,
    padding: '2px 8px',
    borderRadius: '4px',
    whiteSpace: 'nowrap' as const,
    boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
    pointerEvents: 'none' as const,
    zIndex: 10,
  } as React.CSSProperties,
  popover: {
    position: 'absolute' as const,
    background: '#ffffff',
    border: '1px solid rgba(0,0,0,0.12)',
    boxShadow: '0 10px 25px -5px rgba(0,0,0,0.15)',
    borderRadius: '12px',
    padding: '16px',
    width: '240px',
    zIndex: 200,
    cursor: 'default',
  } as React.CSSProperties,
  popoverTitle: {
    fontSize: '0.85rem',
    fontWeight: 700,
    color: '#1f2937',
    margin: '0 0 10px 0',
  } as React.CSSProperties,
  popoverForm: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '10px',
  } as React.CSSProperties,
  formGroup: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '4px',
  } as React.CSSProperties,
  label: {
    fontSize: '0.68rem',
    fontWeight: 700,
    textTransform: 'uppercase' as const,
    color: '#6b7280',
  } as React.CSSProperties,
  select: {
    padding: '8px 10px',
    borderRadius: '8px',
    border: '1px solid rgba(0,0,0,0.1)',
    fontSize: '0.8rem',
    outline: 'none',
    cursor: 'pointer',
    background: '#fff',
  } as React.CSSProperties,
  input: {
    padding: '8px 10px',
    borderRadius: '8px',
    border: '1px solid rgba(0,0,0,0.1)',
    fontSize: '0.8rem',
    outline: 'none',
    background: '#fff',
  } as React.CSSProperties,
  statusDisplay: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 12px',
    background: '#f9fafb',
    borderRadius: '8px',
    border: '1px solid rgba(0,0,0,0.05)',
  } as React.CSSProperties,
  popoverActions: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '6px',
    gap: '6px',
  } as React.CSSProperties,
  popoverCancelBtn: {
    background: 'rgba(0,0,0,0.05)',
    color: '#374151',
    border: 'none',
    padding: '6px 12px',
    borderRadius: '8px',
    fontSize: '0.75rem',
    fontWeight: 600,
    cursor: 'pointer',
  } as React.CSSProperties,
  popoverSaveBtn: {
    background: 'linear-gradient(135deg, #003DA6, #0284c7)',
    color: '#fff',
    border: 'none',
    padding: '6px 12px',
    borderRadius: '8px',
    fontSize: '0.75rem',
    fontWeight: 600,
    cursor: 'pointer',
  } as React.CSSProperties,
  popoverDangerBtn: {
    background: 'none',
    border: 'none',
    color: '#ef4444',
    fontSize: '0.72rem',
    fontWeight: 600,
    cursor: 'pointer',
    padding: 0,
  } as React.CSSProperties,

  // Toolbar styles
  toolbar: {
    position: 'absolute' as const,
    bottom: '20px',
    right: '20px',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    background: 'rgba(255, 255, 255, 0.85)',
    backdropFilter: 'blur(12px)',
    border: '1px solid rgba(0, 0, 0, 0.08)',
    borderRadius: '12px',
    padding: '4px 8px',
    boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)',
    zIndex: 100,
  } as React.CSSProperties,
  toolbarBtn: {
    border: 'none',
    background: 'none',
    cursor: 'pointer',
    padding: '6px',
    borderRadius: '8px',
    color: '#003DA6',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background-color 0.15s, transform 0.1s',
  } as React.CSSProperties,
  toolbarDivider: {
    width: '1px',
    height: '16px',
    background: 'rgba(0,0,0,0.08)',
  } as React.CSSProperties,
  zoomLabel: {
    fontSize: '0.75rem',
    fontWeight: 700,
    color: '#374151',
    minWidth: '38px',
    textAlign: 'center' as const,
    fontFamily: 'monospace',
  } as React.CSSProperties,
};
