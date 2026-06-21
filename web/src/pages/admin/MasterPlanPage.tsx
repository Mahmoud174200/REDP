import React, { useState, useEffect, useCallback } from 'react';
import {
  ArrowLeft, Building2, Layers, Plus, Edit2, Trash2, ChevronDown, ChevronRight,
  MapPin, Ruler, Home, Car, Trees, Droplets, Zap, Shield, Dumbbell,
  Save, X, Copy, LayoutGrid, RefreshCw, TrendingUp, Users as UsersIcon
} from 'lucide-react';
import api from '../../services/api';
import { InteractiveMapEditor } from '../../components/admin/InteractiveMapEditor';

// ── Type Definitions ──
interface BuildingFloor {
  id: string;
  building_id: string;
  floor_number: number;
  floor_label: string;
  floor_type: string;
  gross_area: number | null;
  common_area: number | null;
  net_usable_area: number | null;
  units_count: number;
  ceiling_height: number;
  notes: string | null;
  units?: UnitItem[];
}

interface Building {
  id: string;
  project_id: string;
  name: string;
  name_ar: string | null;
  type: string;
  total_floors: number;
  has_basement: boolean;
  basement_floors: number;
  has_roof_floor: boolean;
  has_elevator: boolean;
  elevator_count: number;
  staircase_count: number;
  building_footprint_area: number | null;
  total_built_area: number | null;
  lobby_area: number | null;
  common_area_per_floor: number | null;
  parking_type: string;
  parking_capacity: number;
  status: string;
  sort_order: number;
  notes: string | null;
  floors?: BuildingFloor[];
  units?: UnitItem[];
}

interface Amenity {
  id: string;
  project_id: string;
  name: string;
  name_ar: string | null;
  type: string;
  area: number | null;
  quantity: number;
  description: string | null;
}

interface UnitItem {
  id: string;
  unit_number: string;
  floor: number;
  type: string;
  area: number;
  net_area?: number | null;
  finishing_type?: string | null;
  bedrooms: number;
  bathrooms: number;
  living_rooms?: number | null;
  kitchen_count?: number | null;
  balcony_count?: number | null;
  balcony_area?: number | null;
  has_maid_room?: boolean;
  has_storage?: boolean;
  has_private_garden?: boolean;
  has_private_parking?: boolean;
  view_type?: string | null;
  min_down_payment?: number | null;
  orientation?: string | null;
  price: number;
  status: string;
  building_id?: string;
  floor_id?: string;
  layout_description?: string | null;
  phase?: string | null;
}

interface ProjectData {
  id: string;
  name: string;
  location: string;
  total_units: number;
  status: string;
  land_area: number | null;
  land_area_unit: string;
  building_ratio: number | null;
  max_height_allowed: number | null;
  max_floors_allowed: number | null;
  total_buildings_count: number;
  total_built_area: number | null;
  total_green_area: number | null;
  total_roads_area: number | null;
  total_parking_spaces: number | null;
  infrastructure_notes: string | null;
  density_per_feddan: number | null;
  master_plan_status: string;
  project_type: string;
  buildings?: Building[];
  amenities?: Amenity[];
}

interface MasterPlanSummary {
  total_buildings: number;
  total_units: number;
  available_units: number;
  sold_units: number;
  reserved_units: number;
  total_built_area: number;
  land_area_sqm: number | null;
  density: number | null;
  total_parking: number;
  amenities_count: number;
}

// ── Type labels ──
const buildingTypeLabels: Record<string, string> = {
  apartment_building: '🏢 Apartment Building',
  villa: '🏡 Villa',
  duplex_building: '🏘️ Duplex Building',
  townhouse: '🏠 Townhouse',
  commercial: '🏪 Commercial',
  mixed_use: '🔀 Mixed Use',
};

const floorTypeLabels: Record<string, string> = {
  basement: '🅿️ Basement',
  ground: '🏠 Ground',
  mezzanine: '📐 Mezzanine',
  typical: '🏢 Typical',
  roof: '☀️ Roof',
  penthouse: '✨ Penthouse',
};

const amenityTypeLabels: Record<string, string> = {
  swimming_pool: '🏊 Swimming Pool',
  gym: '🏋️ Gym',
  garden: '🌳 Garden',
  playground: '🎪 Playground',
  mosque: '🕌 Mosque',
  commercial_area: '🏪 Commercial Area',
  security_room: '🛡️ Security Room',
  clubhouse: '🏠 Clubhouse',
  walking_track: '🚶 Walking Track',
  parking_lot: '🅿️ Parking Lot',
  water_feature: '⛲ Water Feature',
  sports_court: '⚽ Sports Court',
  barbecue_area: '🍖 BBQ Area',
  kids_area: '🧒 Kids Area',
  generator_room: '⚡ Generator Room',
  water_tanks: '💧 Water Tanks',
  electrical_room: '🔌 Electrical Room',
  guard_house: '🏛️ Guard House',
  other: '📦 Other',
};

const unitTypeLabels: Record<string, string> = {
  apartment: 'Apartment',
  villa: 'Villa',
  commercial: 'Commercial',
  office: 'Office',
  duplex: 'Duplex',
  penthouse: 'Penthouse',
};

const finishingLabels: Record<string, string> = {
  core_shell: 'Core & Shell',
  semi_finished: 'Semi-Finished',
  fully_finished: 'Fully Finished',
  super_lux: 'Super Lux',
  ultra_super_lux: 'Ultra Super Lux',
};

// ── CSS-in-JS Styles ──
const styles = {
  page: {
    minHeight: '100vh',
    padding: '24px',
    fontFamily: "'Inter', 'Segoe UI', sans-serif",
    color: 'var(--text-main, #1a1a2e)',
  } as React.CSSProperties,
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    marginBottom: '24px',
    flexWrap: 'wrap' as const,
  } as React.CSSProperties,
  backBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 16px',
    border: '1px solid rgba(0,0,0,0.12)',
    borderRadius: '10px',
    background: 'rgba(255,255,255,0.7)',
    backdropFilter: 'blur(12px)',
    cursor: 'pointer',
    fontSize: '0.85rem',
    fontWeight: 500,
    color: 'var(--text-main, #333)',
    transition: 'all 0.2s',
  } as React.CSSProperties,
  title: {
    fontSize: '1.5rem',
    fontWeight: 700,
    background: 'linear-gradient(135deg, #059669, #10b981)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  } as React.CSSProperties,
  statusBadge: (status: string) => ({
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '4px 12px',
    borderRadius: '20px',
    fontSize: '0.7rem',
    fontWeight: 600,
    textTransform: 'uppercase' as const,
    ...(status === 'approved' ? { background: 'rgba(5,150,105,0.1)', color: '#059669' } :
      status === 'review' ? { background: 'rgba(245,158,11,0.1)', color: '#d97706' } :
        { background: 'rgba(107,114,128,0.1)', color: '#6b7280' }),
  }),
  grid3: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '20px',
    marginBottom: '24px',
  } as React.CSSProperties,
  glassCard: {
    background: 'rgba(255,255,255,0.75)',
    backdropFilter: 'blur(16px)',
    borderRadius: '16px',
    border: '1px solid rgba(255,255,255,0.3)',
    boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
    padding: '20px',
    transition: 'transform 0.2s, box-shadow 0.2s',
  } as React.CSSProperties,
  cardTitle: {
    fontSize: '0.85rem',
    fontWeight: 600,
    color: 'var(--text-muted, #666)',
    marginBottom: '8px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  } as React.CSSProperties,
  cardValue: {
    fontSize: '1.8rem',
    fontWeight: 700,
    color: 'var(--text-main, #1a1a2e)',
  } as React.CSSProperties,
  section: {
    background: 'rgba(255,255,255,0.75)',
    backdropFilter: 'blur(16px)',
    borderRadius: '16px',
    border: '1px solid rgba(255,255,255,0.3)',
    boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
    padding: '24px',
    marginBottom: '24px',
  } as React.CSSProperties,
  sectionTitle: {
    fontSize: '1.1rem',
    fontWeight: 700,
    marginBottom: '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '12px',
  } as React.CSSProperties,
  formGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '14px',
    marginBottom: '16px',
  } as React.CSSProperties,
  formGroup: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '4px',
  } as React.CSSProperties,
  label: {
    fontSize: '0.75rem',
    fontWeight: 600,
    color: 'var(--text-muted, #666)',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
  } as React.CSSProperties,
  input: {
    padding: '10px 14px',
    borderRadius: '10px',
    border: '1px solid rgba(0,0,0,0.1)',
    fontSize: '0.85rem',
    background: 'rgba(255,255,255,0.8)',
    outline: 'none',
    transition: 'border-color 0.2s',
  } as React.CSSProperties,
  select: {
    padding: '10px 14px',
    borderRadius: '10px',
    border: '1px solid rgba(0,0,0,0.1)',
    fontSize: '0.85rem',
    background: 'rgba(255,255,255,0.8)',
    outline: 'none',
    cursor: 'pointer',
  } as React.CSSProperties,
  btnPrimary: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '10px 18px',
    borderRadius: '10px',
    border: 'none',
    background: 'linear-gradient(135deg, #059669, #10b981)',
    color: '#fff',
    fontWeight: 600,
    fontSize: '0.85rem',
    cursor: 'pointer',
    transition: 'all 0.2s',
  } as React.CSSProperties,
  btnSecondary: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 14px',
    borderRadius: '10px',
    border: '1px solid rgba(0,0,0,0.12)',
    background: 'rgba(255,255,255,0.7)',
    color: 'var(--text-main, #333)',
    fontWeight: 500,
    fontSize: '0.8rem',
    cursor: 'pointer',
    transition: 'all 0.2s',
  } as React.CSSProperties,
  btnDanger: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 12px',
    borderRadius: '8px',
    border: '1px solid rgba(239,68,68,0.2)',
    background: 'rgba(239,68,68,0.05)',
    color: '#ef4444',
    fontWeight: 500,
    fontSize: '0.75rem',
    cursor: 'pointer',
  } as React.CSSProperties,
  buildingCard: {
    background: 'rgba(255,255,255,0.85)',
    borderRadius: '14px',
    border: '1px solid rgba(0,0,0,0.06)',
    marginBottom: '16px',
    overflow: 'hidden',
    transition: 'box-shadow 0.2s',
    boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
  } as React.CSSProperties,
  buildingHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 20px',
    cursor: 'pointer',
    transition: 'background 0.2s',
  } as React.CSSProperties,
  floorRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '10px 20px 10px 40px',
    borderTop: '1px solid rgba(0,0,0,0.04)',
    fontSize: '0.85rem',
    transition: 'background 0.15s',
  } as React.CSSProperties,
  amenityTag: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 14px',
    borderRadius: '10px',
    border: '1px solid rgba(0,0,0,0.06)',
    background: 'rgba(255,255,255,0.9)',
    fontSize: '0.82rem',
    fontWeight: 500,
  } as React.CSSProperties,
  modal: {
    position: 'fixed' as const,
    inset: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(0,0,0,0.4)',
    backdropFilter: 'blur(6px)',
    zIndex: 1000,
  } as React.CSSProperties,
  modalContent: {
    background: '#fff',
    borderRadius: '18px',
    padding: '28px',
    width: '90%',
    maxWidth: '600px',
    maxHeight: '85vh',
    overflowY: 'auto' as const,
    boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
  } as React.CSSProperties,
  statRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '8px 0',
    borderBottom: '1px solid rgba(0,0,0,0.04)',
    fontSize: '0.85rem',
  } as React.CSSProperties,
};


const MasterPlanPage: React.FC = () => {
  // Extract project ID from URL
  const pathParts = window.location.pathname.split('/');
  const projectId = pathParts[pathParts.length - 1];

  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState<ProjectData | null>(null);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [amenities, setAmenities] = useState<Amenity[]>([]);
  const [summary, setSummary] = useState<MasterPlanSummary | null>(null);
  const [expandedBuildings, setExpandedBuildings] = useState<Set<string>>(new Set());
  const [expandedFloors, setExpandedFloors] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<'data' | 'map'>('data');
  const [masterPlanImage, setMasterPlanImage] = useState<string | null>(null);

  // Modal states
  const [showLandModal, setShowLandModal] = useState(false);
  const [showBuildingModal, setShowBuildingModal] = useState(false);
  const [showAmenityModal, setShowAmenityModal] = useState(false);
  const [showGenUnitsModal, setShowGenUnitsModal] = useState(false);
  const [showFloorModal, setShowFloorModal] = useState(false);
  const [showUnitModal, setShowUnitModal] = useState(false);
  const [buildingModalMode, setBuildingModalMode] = useState<'add' | 'edit'>('add');
  const [floorModalMode, setFloorModalMode] = useState<'add' | 'edit'>('add');
  const [unitModalMode, setUnitModalMode] = useState<'add' | 'edit'>('add');
  const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null);
  const [selectedFloor, setSelectedFloor] = useState<BuildingFloor | null>(null);
  const [selectedUnit, setSelectedUnit] = useState<UnitItem | null>(null);

  // Detailed Unit Form states
  const [fUnitNumber, setFUnitNumber] = useState('');
  const [fUnitType, setFUnitType] = useState('apartment');
  const [fUnitPrice, setFUnitPrice] = useState('0');
  const [fUnitStatus, setFUnitStatus] = useState('available');
  const [fUnitArea, setFUnitArea] = useState('0');
  const [fUnitNetArea, setFUnitNetArea] = useState('');
  const [fUnitFinishing, setFUnitFinishing] = useState('fully_finished');
  const [fUnitBedrooms, setFUnitBedrooms] = useState('0');
  const [fUnitBathrooms, setFUnitBathrooms] = useState('0');
  const [fUnitLivingRooms, setFUnitLivingRooms] = useState('0');
  const [fUnitKitchens, setFUnitKitchens] = useState('1');
  const [fUnitBalconies, setFUnitBalconies] = useState('0');
  const [fUnitBalconyArea, setFUnitBalconyArea] = useState('');
  const [fUnitMaidRoom, setFUnitMaidRoom] = useState(false);
  const [fUnitStorage, setFUnitStorage] = useState(false);
  const [fUnitGarden, setFUnitGarden] = useState(false);
  const [fUnitParking, setFUnitParking] = useState(false);
  const [fUnitView, setFUnitView] = useState('garden');
  const [fUnitOrientation, setFUnitOrientation] = useState('');
  const [fUnitLayoutDesc, setFUnitLayoutDesc] = useState('');
  const [fUnitPhase, setFUnitPhase] = useState('Phase 1');
  const [fUnitMinDownPayment, setFUnitMinDownPayment] = useState('0');

  // Detailed Floor Form states
  const [fFloorNumber, setFFloorNumber] = useState('0');
  const [fFloorLabel, setFFloorLabel] = useState('');
  const [fFloorType, setFFloorType] = useState('typical');
  const [fFloorGrossArea, setFFloorGrossArea] = useState('');
  const [fFloorCommonArea, setFFloorCommonArea] = useState('');
  const [fFloorNetArea, setFFloorNetArea] = useState('');
  const [fFloorCeilingHeight, setFFloorCeilingHeight] = useState('2.8');
  const [fFloorNotes, setFFloorNotes] = useState('');

  // Form states — Land
  const [fLandArea, setFLandArea] = useState('');
  const [fLandUnit, setFLandUnit] = useState('sqm');
  const [fBuildingRatio, setFBuildingRatio] = useState('');
  const [fMaxHeight, setFMaxHeight] = useState('');
  const [fMaxFloors, setFMaxFloors] = useState('');
  const [fGreenArea, setFGreenArea] = useState('');
  const [fRoadsArea, setFRoadsArea] = useState('');
  const [fParkingSpaces, setFParkingSpaces] = useState('');
  const [fInfrastructureNotes, setFInfrastructureNotes] = useState('');
  const [fPlanStatus, setFPlanStatus] = useState('draft');
  const [fProjectType, setFProjectType] = useState('residential');

  // Form states — Building
  const [fBName, setFBName] = useState('');
  const [fBNameAr, setFBNameAr] = useState('');
  const [fBType, setFBType] = useState('apartment_building');
  const [fBFloors, setFBFloors] = useState('5');
  const [fBBasement, setFBBasement] = useState(false);
  const [fBBasementFloors, setFBBasementFloors] = useState('1');
  const [fBRoof, setFBRoof] = useState(false);
  const [fBElevator, setFBElevator] = useState(false);
  const [fBElevatorCount, setFBElevatorCount] = useState('1');
  const [fBStaircase, setFBStaircase] = useState('1');
  const [fBFootprint, setFBFootprint] = useState('');
  const [fBBuiltArea, setFBBuiltArea] = useState('');
  const [fBLobby, setFBLobby] = useState('');
  const [fBCommonArea, setFBCommonArea] = useState('');
  const [fBParkingType, setFBParkingType] = useState('none');
  const [fBParkingCap, setFBParkingCap] = useState('0');
  const [fBStatus, setFBStatus] = useState('planned');
  const [fBNotes, setFBNotes] = useState('');

  // Form states — Amenity
  const [fAName, setFAName] = useState('');
  const [fAType, setFAType] = useState('garden');
  const [fAArea, setFAArea] = useState('');
  const [fAQuantity, setFAQuantity] = useState('1');
  const [fADesc, setFADesc] = useState('');

  // Form states — Generate Units
  const [fGUCount, setFGUCount] = useState('4');
  const [fGUType, setFGUType] = useState('apartment');
  const [fGUArea, setFGUArea] = useState('120');
  const [fGUBedrooms, setFGUBedrooms] = useState('3');
  const [fGUBathrooms, setFGUBathrooms] = useState('2');
  const [fGULivingRooms, setFGULivingRooms] = useState('1');
  const [fGUPrice, setFGUPrice] = useState('2500000');
  const [fGUFinishing, setFGUFinishing] = useState('fully_finished');
  const [fGUPrefix, setFGUPrefix] = useState('');
  const [fGUMinDownPayment, setFGUMinDownPayment] = useState('0');

  // ── Data Fetching ──
  const fetchMasterPlan = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/admin/projects/${projectId}/master-plan`);
      if (res.data?.success) {
        setProject(res.data.data.project);
        setBuildings(res.data.data.project.buildings || []);
        setAmenities(res.data.data.project.amenities || []);
        setSummary(res.data.data.summary);
      }
      // Fetch media assets to get the master plan image
      const mediaRes = await api.get(`/public/projects/${projectId}/media`);
      if (mediaRes.data?.success) {
        setMasterPlanImage(mediaRes.data.data.project_image || null);
      }
    } catch (err) {
      console.error('Failed to load master plan', err);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => { fetchMasterPlan(); }, [fetchMasterPlan]);

  // ── Toggle Building Expansion ──
  const toggleBuilding = (id: string) => {
    setExpandedBuildings(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  // ── LAND INFO HANDLERS ──
  const openLandModal = () => {
    if (project) {
      setFLandArea(project.land_area?.toString() || '');
      setFLandUnit(project.land_area_unit || 'sqm');
      setFBuildingRatio(project.building_ratio?.toString() || '');
      setFMaxHeight(project.max_height_allowed?.toString() || '');
      setFMaxFloors(project.max_floors_allowed?.toString() || '');
      setFGreenArea(project.total_green_area?.toString() || '');
      setFRoadsArea(project.total_roads_area?.toString() || '');
      setFParkingSpaces(project.total_parking_spaces?.toString() || '');
      setFInfrastructureNotes(project.infrastructure_notes || '');
      setFPlanStatus(project.master_plan_status || 'draft');
      setFProjectType(project.project_type || 'residential');
    }
    setShowLandModal(true);
  };

  const handleLandSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.put(`/admin/projects/${projectId}/master-plan/land`, {
        land_area: fLandArea ? parseFloat(fLandArea) : null,
        land_area_unit: fLandUnit,
        building_ratio: fBuildingRatio ? parseFloat(fBuildingRatio) : null,
        max_height_allowed: fMaxHeight ? parseFloat(fMaxHeight) : null,
        max_floors_allowed: fMaxFloors ? parseInt(fMaxFloors) : null,
        total_green_area: fGreenArea ? parseFloat(fGreenArea) : null,
        total_roads_area: fRoadsArea ? parseFloat(fRoadsArea) : null,
        total_parking_spaces: fParkingSpaces ? parseInt(fParkingSpaces) : null,
        infrastructure_notes: fInfrastructureNotes || null,
        master_plan_status: fPlanStatus,
        project_type: fProjectType,
      });
      setShowLandModal(false);
      fetchMasterPlan();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update land info');
    }
  };

  // ── BUILDING HANDLERS ──
  const openAddBuildingModal = () => {
    setFBName('');
    setFBNameAr('');
    setFBType('apartment_building');
    setFBFloors('5');
    setFBBasement(false);
    setFBBasementFloors('1');
    setFBRoof(false);
    setFBElevator(false);
    setFBElevatorCount('1');
    setFBStaircase('1');
    setFBFootprint('');
    setFBBuiltArea('');
    setFBLobby('');
    setFBCommonArea('');
    setFBParkingType('none');
    setFBParkingCap('0');
    setFBStatus('planned');
    setFBNotes('');
    setBuildingModalMode('add');
    setShowBuildingModal(true);
  };

  const openEditBuildingModal = (b: Building) => {
    setSelectedBuilding(b);
    setFBName(b.name);
    setFBNameAr(b.name_ar || '');
    setFBType(b.type);
    setFBFloors(b.total_floors.toString());
    setFBBasement(b.has_basement);
    setFBBasementFloors(b.basement_floors.toString());
    setFBRoof(b.has_roof_floor);
    setFBElevator(b.has_elevator);
    setFBElevatorCount(b.elevator_count.toString());
    setFBStaircase(b.staircase_count.toString());
    setFBFootprint(b.building_footprint_area?.toString() || '');
    setFBBuiltArea(b.total_built_area?.toString() || '');
    setFBLobby(b.lobby_area?.toString() || '');
    setFBCommonArea(b.common_area_per_floor?.toString() || '');
    setFBParkingType(b.parking_type);
    setFBParkingCap(b.parking_capacity.toString());
    setFBStatus(b.status);
    setFBNotes(b.notes || '');
    setBuildingModalMode('edit');
    setShowBuildingModal(true);
  };

  const handleBuildingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: fBName,
      name_ar: fBNameAr || null,
      type: fBType,
      total_floors: parseInt(fBFloors),
      has_basement: fBBasement,
      basement_floors: parseInt(fBBasementFloors),
      has_roof_floor: fBRoof,
      has_elevator: fBElevator,
      elevator_count: parseInt(fBElevatorCount),
      staircase_count: parseInt(fBStaircase),
      building_footprint_area: fBFootprint ? parseFloat(fBFootprint) : null,
      total_built_area: fBBuiltArea ? parseFloat(fBBuiltArea) : null,
      lobby_area: fBLobby ? parseFloat(fBLobby) : null,
      common_area_per_floor: fBCommonArea ? parseFloat(fBCommonArea) : null,
      parking_type: fBParkingType,
      parking_capacity: parseInt(fBParkingCap),
      status: fBStatus,
      notes: fBNotes || null,
      auto_generate_floors: buildingModalMode === 'add',
    };
    try {
      if (buildingModalMode === 'add') {
        await api.post(`/admin/projects/${projectId}/buildings`, payload);
      } else if (selectedBuilding) {
        await api.put(`/admin/projects/${projectId}/buildings/${selectedBuilding.id}`, payload);
      }
      setShowBuildingModal(false);
      fetchMasterPlan();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to save building');
    }
  };

  const handleDeleteBuilding = async (buildingId: string) => {
    if (!confirm('Delete this building? Units inside will be detached, not deleted.')) return;
    try {
      await api.delete(`/admin/projects/${projectId}/buildings/${buildingId}`);
      fetchMasterPlan();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete building');
    }
  };

  const openGenUnitsModal = (building: Building, floor: BuildingFloor) => {
    setSelectedBuilding(building);
    setSelectedFloor(floor);
    setFGUPrefix(building.name.charAt(0).toUpperCase());
    setFGUMinDownPayment('0');
    setShowGenUnitsModal(true);
  };

  const handleGenUnitsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBuilding || !selectedFloor) return;
    try {
      await api.post(`/admin/buildings/${selectedBuilding.id}/floors/${selectedFloor.id}/generate-units`, {
        units_count: parseInt(fGUCount),
        unit_type: fGUType,
        area: parseFloat(fGUArea),
        bedrooms: parseInt(fGUBedrooms),
        bathrooms: parseInt(fGUBathrooms),
        living_rooms: parseInt(fGULivingRooms),
        price: parseFloat(fGUPrice),
        min_down_payment: fGUMinDownPayment ? parseFloat(fGUMinDownPayment) : 0,
        finishing_type: fGUFinishing,
        unit_number_prefix: fGUPrefix,
      });
      setShowGenUnitsModal(false);
      fetchMasterPlan();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to generate units');
    }
  };

  // ── FLOOR HANDLERS ──
  const toggleFloor = (id: string) => {
    setExpandedFloors(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const openAddFloorModal = (b: Building) => {
    setSelectedBuilding(b);
    setFFloorNumber('1');
    setFFloorLabel('');
    setFFloorType('typical');
    setFFloorGrossArea(b.building_footprint_area?.toString() || '');
    setFFloorCommonArea(b.common_area_per_floor?.toString() || '');
    setFFloorNetArea('');
    setFFloorCeilingHeight('2.8');
    setFFloorNotes('');
    setFloorModalMode('add');
    setShowFloorModal(true);
  };

  const openEditFloorModal = (b: Building, f: BuildingFloor) => {
    setSelectedBuilding(b);
    setSelectedFloor(f);
    setFFloorNumber(f.floor_number.toString());
    setFFloorLabel(f.floor_label || '');
    setFFloorType(f.floor_type);
    setFFloorGrossArea(f.gross_area?.toString() || '');
    setFFloorCommonArea(f.common_area?.toString() || '');
    setFFloorNetArea(f.net_usable_area?.toString() || '');
    setFFloorCeilingHeight(f.ceiling_height.toString());
    setFFloorNotes(f.notes || '');
    setFloorModalMode('edit');
    setShowFloorModal(true);
  };

  const handleFloorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBuilding) return;
    const payload = {
      floor_number: parseInt(fFloorNumber),
      floor_label: fFloorLabel,
      floor_type: fFloorType,
      gross_area: fFloorGrossArea ? parseFloat(fFloorGrossArea) : null,
      common_area: fFloorCommonArea ? parseFloat(fFloorCommonArea) : null,
      net_usable_area: fFloorNetArea ? parseFloat(fFloorNetArea) : null,
      ceiling_height: parseFloat(fFloorCeilingHeight),
      notes: fFloorNotes || null,
    };
    try {
      if (floorModalMode === 'add') {
        await api.post(`/admin/buildings/${selectedBuilding.id}/floors`, payload);
      } else if (selectedFloor) {
        await api.put(`/admin/buildings/${selectedBuilding.id}/floors/${selectedFloor.id}`, payload);
      }
      setShowFloorModal(false);
      fetchMasterPlan();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to save floor');
    }
  };

  const handleDeleteFloor = async (buildingId: string, floorId: string) => {
    if (!confirm('Are you sure you want to delete this floor? Units on this floor will be detached.')) return;
    try {
      await api.delete(`/admin/buildings/${buildingId}/floors/${floorId}`);
      fetchMasterPlan();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete floor');
    }
  };

  // ── UNIT HANDLERS ──
  const openAddUnitModal = (b: Building, f: BuildingFloor) => {
    setSelectedBuilding(b);
    setSelectedFloor(f);
    setFUnitNumber('');
    setFUnitType('apartment');
    setFUnitPrice('1000000');
    setFUnitStatus('available');
    setFUnitArea('100');
    setFUnitNetArea('');
    setFUnitFinishing('fully_finished');
    setFUnitBedrooms('2');
    setFUnitBathrooms('1');
    setFUnitLivingRooms('1');
    setFUnitKitchens('1');
    setFUnitBalconies('1');
    setFUnitBalconyArea('');
    setFUnitMaidRoom(false);
    setFUnitStorage(false);
    setFUnitGarden(false);
    setFUnitParking(false);
    setFUnitView('garden');
    setFUnitOrientation('');
    setFUnitLayoutDesc('');
    setFUnitPhase('Phase 1');
    setFUnitMinDownPayment('0');
    setUnitModalMode('add');
    setShowUnitModal(true);
  };

  const openEditUnitModal = (b: Building, f: BuildingFloor, u: UnitItem) => {
    setSelectedBuilding(b);
    setSelectedFloor(f);
    setSelectedUnit(u);
    setFUnitNumber(u.unit_number);
    setFUnitType(u.type);
    setFUnitPrice(u.price.toString());
    setFUnitStatus(u.status);
    setFUnitArea(u.area.toString());
    setFUnitNetArea(u.net_area?.toString() || '');
    setFUnitFinishing(u.finishing_type || 'fully_finished');
    setFUnitBedrooms(u.bedrooms.toString());
    setFUnitBathrooms(u.bathrooms.toString());
    setFUnitLivingRooms(u.living_rooms?.toString() || '0');
    setFUnitKitchens(u.kitchen_count?.toString() || '1');
    setFUnitBalconies(u.balcony_count?.toString() || '0');
    setFUnitBalconyArea(u.balcony_area?.toString() || '');
    setFUnitMaidRoom(u.has_maid_room || false);
    setFUnitStorage(u.has_storage || false);
    setFUnitGarden(u.has_private_garden || false);
    setFUnitParking(u.has_private_parking || false);
    setFUnitView(u.view_type || 'garden');
    setFUnitOrientation(u.orientation || '');
    setFUnitLayoutDesc(u.layout_description || '');
    setFUnitPhase(u.phase || 'Phase 1');
    setFUnitMinDownPayment(u.min_down_payment ? u.min_down_payment.toString() : '0');
    setUnitModalMode('edit');
    setShowUnitModal(true);
  };

  const handleUnitSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBuilding || !selectedFloor) return;
    const payload = {
      unit_number: fUnitNumber,
      type: fUnitType,
      price: parseFloat(fUnitPrice),
      min_down_payment: fUnitMinDownPayment ? parseFloat(fUnitMinDownPayment) : 0,
      status: fUnitStatus,
      area: parseFloat(fUnitArea),
      net_area: fUnitNetArea ? parseFloat(fUnitNetArea) : null,
      finishing_type: fUnitFinishing,
      bedrooms: parseInt(fUnitBedrooms),
      bathrooms: parseInt(fUnitBathrooms),
      living_rooms: parseInt(fUnitLivingRooms),
      kitchen_count: parseInt(fUnitKitchens),
      balcony_count: parseInt(fUnitBalconies),
      balcony_area: fUnitBalconyArea ? parseFloat(fUnitBalconyArea) : null,
      has_maid_room: fUnitMaidRoom,
      has_storage: fUnitStorage,
      has_private_garden: fUnitGarden,
      has_private_parking: fUnitParking,
      view_type: fUnitView,
      orientation: fUnitOrientation || null,
      layout_description: fUnitLayoutDesc || null,
      phase: fUnitPhase || 'Phase 1',
    };
    try {
      if (unitModalMode === 'add') {
        await api.post(`/admin/master-plan/buildings/${selectedBuilding.id}/floors/${selectedFloor.id}/units`, payload);
      } else if (selectedUnit) {
        await api.put(`/admin/master-plan/units/${selectedUnit.id}`, payload);
      }
      setShowUnitModal(false);
      fetchMasterPlan();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to save unit');
    }
  };

  const handleDeleteUnit = async (unitId: string) => {
    if (!confirm('Are you sure you want to delete this unit?')) return;
    try {
      await api.delete(`/admin/master-plan/units/${unitId}`);
      fetchMasterPlan();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete unit');
    }
  };

  // ── AMENITY HANDLERS ──
  const openAddAmenityModal = () => {
    setFAName('');
    setFAType('garden');
    setFAArea('');
    setFAQuantity('1');
    setFADesc('');
    setShowAmenityModal(true);
  };

  const handleAmenitySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post(`/admin/projects/${projectId}/amenities`, {
        name: fAName,
        type: fAType,
        area: fAArea ? parseFloat(fAArea) : null,
        quantity: parseInt(fAQuantity),
        description: fADesc || null,
      });
      setShowAmenityModal(false);
      fetchMasterPlan();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to add amenity');
    }
  };

  const handleDeleteAmenity = async (amenityId: string) => {
    if (!confirm('Delete this amenity?')) return;
    try {
      await api.delete(`/admin/projects/${projectId}/amenities/${amenityId}`);
      fetchMasterPlan();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete amenity');
    }
  };

  // ── RENDER ──
  if (loading) {
    return (
      <div style={{ ...styles.page, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div style={{ textAlign: 'center' }}>
          <RefreshCw size={36} style={{ animation: 'spin 1s linear infinite', color: '#059669' }} />
          <p style={{ marginTop: '12px', color: 'var(--text-muted)' }}>Loading Master Plan...</p>
          <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div style={styles.page}>
        <p>Project not found.</p>
        <button style={styles.backBtn} onClick={() => window.location.href = '/admin/panel'}>
          <ArrowLeft size={16} /> Back to Admin
        </button>
      </div>
    );
  }

  const formatNum = (n: number | null | undefined) => n != null ? n.toLocaleString() : '—';

  return (
    <div style={styles.page}>
      {/* ── HEADER ── */}
      <div style={styles.header}>
        <button style={styles.backBtn} onClick={() => window.location.href = '/admin/panel'}>
          <ArrowLeft size={16} /> Back
        </button>
        <div>
          <h1 style={styles.title}>📐 Master Plan: {project.name}</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            <MapPin size={14} /> {project.location}
            <span style={styles.statusBadge(project.master_plan_status)}>
              {project.master_plan_status}
            </span>
          </div>
        </div>
      </div>

      {/* ── TAB SELECTOR ── */}
      <div style={{ display: 'flex', borderBottom: '1px solid rgba(0,0,0,0.08)', marginBottom: '24px', gap: '16px' }}>
        <button
          style={{
            padding: '10px 16px',
            fontSize: '0.9rem',
            fontWeight: 600,
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'data' ? '2px solid #059669' : '2px solid transparent',
            color: activeTab === 'data' ? '#059669' : '#6b7280',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
          onClick={() => setActiveTab('data')}
        >
          📋 Overview & Checklist (البيانات والوحدات)
        </button>
        <button
          style={{
            padding: '10px 16px',
            fontSize: '0.9rem',
            fontWeight: 600,
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'map' ? '2px solid #059669' : '2px solid transparent',
            color: activeTab === 'map' ? '#059669' : '#6b7280',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
          onClick={() => setActiveTab('map')}
        >
          📍 Interactive Hotspot Map (الخريطة التفاعلية)
        </button>
      </div>

      {activeTab === 'map' ? (
        <InteractiveMapEditor
          projectId={projectId}
          buildings={buildings}
          masterPlanImage={masterPlanImage}
          onRefresh={fetchMasterPlan}
        />
      ) : (
        <>
          {/* ── SUMMARY CARDS ── */}
          <div style={styles.grid3}>
            <div style={styles.glassCard}>
              <div style={styles.cardTitle}><Building2 size={16} color="#059669" /> Total Buildings</div>
              <div style={styles.cardValue}>{summary?.total_buildings ?? buildings.length}</div>
            </div>
            <div style={styles.glassCard}>
              <div style={styles.cardTitle}><Home size={16} color="#3b82f6" /> Total Units</div>
              <div style={styles.cardValue}>{summary?.total_units ?? project.total_units}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                ✅ {summary?.available_units ?? 0} Available &nbsp;|&nbsp; 🔒 {summary?.reserved_units ?? 0} Reserved &nbsp;|&nbsp; ✔️ {summary?.sold_units ?? 0} Sold
              </div>
            </div>
            <div style={styles.glassCard}>
              <div style={styles.cardTitle}><Ruler size={16} color="#8b5cf6" /> Land Area</div>
              <div style={styles.cardValue}>
                {project.land_area ? `${formatNum(project.land_area)} ${project.land_area_unit === 'feddan' ? 'فدان' : project.land_area_unit}` : '—'}
              </div>
              {project.building_ratio && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>Building Ratio: {project.building_ratio}%</div>}
            </div>
            <div style={styles.glassCard}>
              <div style={styles.cardTitle}><UsersIcon size={16} color="#f59e0b" /> Density</div>
              <div style={styles.cardValue}>{summary?.density ? `${summary.density}` : '—'}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>units/feddan</div>
            </div>
            <div style={styles.glassCard}>
              <div style={styles.cardTitle}><Car size={16} color="#6366f1" /> Parking</div>
              <div style={styles.cardValue}>{formatNum(summary?.total_parking ?? project.total_parking_spaces)}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>spaces</div>
            </div>
            <div style={styles.glassCard}>
              <div style={styles.cardTitle}><Trees size={16} color="#22c55e" /> Green Area</div>
              <div style={styles.cardValue}>{project.total_green_area ? `${formatNum(project.total_green_area)} m²` : '—'}</div>
            </div>
          </div>

          {/* ── LAND INFO SECTION ── */}
          <div style={styles.section}>
            <div style={styles.sectionTitle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <MapPin size={18} color="#059669" /> Land & Site Information
              </div>
              <button style={styles.btnPrimary} onClick={openLandModal}>
                <Edit2 size={14} /> Edit Land Info
              </button>
            </div>
            <div style={styles.formGrid}>
              <div style={styles.statRow}>
                <span style={{ color: 'var(--text-muted)' }}>Project Type</span>
                <strong>{project.project_type || '—'}</strong>
              </div>
              <div style={styles.statRow}>
                <span style={{ color: 'var(--text-muted)' }}>Max Height</span>
                <strong>{project.max_height_allowed ? `${project.max_height_allowed}m` : '—'}</strong>
              </div>
              <div style={styles.statRow}>
                <span style={{ color: 'var(--text-muted)' }}>Max Floors</span>
                <strong>{project.max_floors_allowed ?? '—'}</strong>
              </div>
              <div style={styles.statRow}>
                <span style={{ color: 'var(--text-muted)' }}>Roads Area</span>
                <strong>{project.total_roads_area ? `${formatNum(project.total_roads_area)} m²` : '—'}</strong>
              </div>
            </div>
            {project.infrastructure_notes && (
              <div style={{ padding: '12px 16px', background: 'rgba(5,150,105,0.05)', borderRadius: '10px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                <strong>📝 Infrastructure Notes:</strong> {project.infrastructure_notes}
              </div>
            )}
          </div>

          {/* ── BUILDINGS SECTION ── */}
          <div style={styles.section}>
            <div style={styles.sectionTitle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Building2 size={18} color="#3b82f6" /> Buildings ({buildings.length})
              </div>
              <button style={styles.btnPrimary} onClick={openAddBuildingModal}>
                <Plus size={14} /> Add Building
              </button>
            </div>

            {buildings.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
                <Building2 size={48} style={{ opacity: 0.3 }} />
                <p style={{ marginTop: '12px' }}>No buildings defined yet. Click "Add Building" to start.</p>
              </div>
            ) : (
              buildings.map((b) => (
                <div key={b.id} style={styles.buildingCard}>
                  {/* Building Header */}
                  <div style={styles.buildingHeader} onClick={() => toggleBuilding(b.id)}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      {expandedBuildings.has(b.id) ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                      <div>
                        <strong style={{ fontSize: '1rem' }}>{b.name}</strong>
                        {b.name_ar && <span style={{ marginLeft: '8px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>({b.name_ar})</span>}
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                          {buildingTypeLabels[b.type] || b.type} &nbsp;|&nbsp; {b.total_floors} floors
                          {b.has_basement && ` + ${b.basement_floors} basement`}
                          {b.has_roof_floor && ' + roof'}
                          {b.has_elevator && ` | ${b.elevator_count} elevator(s)`}
                          &nbsp;|&nbsp; {b.units?.length ?? 0} units
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{
                        padding: '4px 10px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 600,
                        background: b.status === 'completed' ? 'rgba(5,150,105,0.1)' : b.status === 'under_construction' ? 'rgba(245,158,11,0.1)' : 'rgba(107,114,128,0.1)',
                        color: b.status === 'completed' ? '#059669' : b.status === 'under_construction' ? '#d97706' : '#6b7280',
                      }}>{b.status.replace('_', ' ')}</span>
                      <button style={styles.btnSecondary} onClick={(e) => { e.stopPropagation(); openEditBuildingModal(b); }}>
                        <Edit2 size={12} />
                      </button>
                      <button style={styles.btnDanger} onClick={(e) => { e.stopPropagation(); handleDeleteBuilding(b.id); }}>
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>

                  {/* Building Expanded Content — Floors */}
                  {expandedBuildings.has(b.id) && (
                    <div style={{ borderTop: '1px solid rgba(0,0,0,0.06)' }}>
                      {/* Building stats */}
                      <div style={{ padding: '12px 20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '8px', background: 'rgba(0,0,0,0.01)' }}>
                        <div style={{ fontSize: '0.75rem' }}><strong>Footprint:</strong> {b.building_footprint_area ? `${formatNum(b.building_footprint_area)} m²` : '—'}</div>
                        <div style={{ fontSize: '0.75rem' }}><strong>Built Area:</strong> {b.total_built_area ? `${formatNum(b.total_built_area)} m²` : '—'}</div>
                        <div style={{ fontSize: '0.75rem' }}><strong>Lobby:</strong> {b.lobby_area ? `${b.lobby_area} m²` : '—'}</div>
                        <div style={{ fontSize: '0.75rem' }}><strong>Common/Floor:</strong> {b.common_area_per_floor ? `${b.common_area_per_floor} m²` : '—'}</div>
                        <div style={{ fontSize: '0.75rem' }}><strong>Parking:</strong> {b.parking_type !== 'none' ? `${b.parking_type} (${b.parking_capacity})` : 'None'}</div>
                        <div style={{ fontSize: '0.75rem' }}><strong>Stairs:</strong> {b.staircase_count}</div>
                      </div>

                      {/* Floors list */}
                      <div style={{ padding: '8px 20px', display: 'flex', justifycontent: 'space-between', alignItems: 'center', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', borderTop: '1px solid rgba(0,0,0,0.04)' }}>
                        <span>Floors</span>
                        <button style={{ ...styles.btnSecondary, padding: '3px 8px', fontSize: '0.65rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }} onClick={() => openAddFloorModal(b)}>
                          <Plus size={10} /> Add Floor
                        </button>
                      </div>
                      {(b.floors || []).map((f) => (
                        <div key={f.id} style={{ borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                          <div style={{ ...styles.floorRow, cursor: 'pointer' }} onClick={() => toggleFloor(f.id)}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              {expandedFloors.has(f.id) ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                              <span style={{ fontWeight: 600, minWidth: '100px' }}>{f.floor_label || `Floor ${f.floor_number}`}</span>
                              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', padding: '2px 8px', background: 'rgba(0,0,0,0.04)', borderRadius: '4px' }}>
                                {floorTypeLabels[f.floor_type] || f.floor_type}
                              </span>
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                {f.gross_area ? `${f.gross_area} m²` : ''}
                                {f.common_area ? ` (common: ${f.common_area} m²)` : ''}
                              </span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }} onClick={e => e.stopPropagation()}>
                              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#3b82f6', marginRight: '6px' }}>
                                {f.units?.length ?? f.units_count} unit(s)
                              </span>
                              <button style={{ ...styles.btnSecondary, padding: '4px 8px', fontSize: '0.68rem', color: '#059669', borderColor: 'rgba(5, 150, 105, 0.2)' }} onClick={() => openAddUnitModal(b, f)}>
                                <Plus size={10} /> Add Unit
                              </button>
                              {f.floor_type !== 'basement' && f.floor_type !== 'roof' && (
                                <button style={{ ...styles.btnSecondary, padding: '4px 8px', fontSize: '0.68rem' }} onClick={() => openGenUnitsModal(b, f)}>
                                  <LayoutGrid size={10} /> Gen Units
                                </button>
                              )}
                              <button style={{ ...styles.btnSecondary, padding: '4px 6px' }} onClick={() => openEditFloorModal(b, f)}>
                                <Edit2 size={10} />
                              </button>
                              <button style={{ ...styles.btnDanger, padding: '4px 6px' }} onClick={() => handleDeleteFloor(b.id, f.id)}>
                                <Trash2 size={10} />
                              </button>
                            </div>
                          </div>

                          {/* Floor Units List (Expanded) */}
                          {expandedFloors.has(f.id) && (
                            <div style={{ padding: '8px 20px 16px 50px', background: 'rgba(0,0,0,0.005)' }}>
                              {(!f.units || f.units.length === 0) ? (
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic', padding: '8px 0' }}>
                                  No units on this floor. Click "Add Unit" or "Gen Units" to create.
                                </div>
                              ) : (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
                                  {f.units.map(u => (
                                    <div key={u.id} style={{
                                      background: 'rgba(255, 255, 255, 0.9)',
                                      border: '1px solid rgba(0, 0, 0, 0.05)',
                                      borderRadius: '10px',
                                      padding: '12px',
                                      boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
                                      display: 'flex',
                                      flexDirection: 'column',
                                      justifyContent: 'space-between',
                                      gap: '8px'
                                    }}>
                                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <div>
                                          <strong style={{ fontSize: '0.9rem', color: '#111' }}>{u.unit_number}</strong>
                                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>
                                            {unitTypeLabels[u.type] || u.type} • {u.area}m² {u.net_area ? `(Net: ${u.net_area}m²)` : ''}
                                          </span>
                                        </div>
                                        <span style={{
                                          padding: '3px 8px', borderRadius: '4px', fontSize: '0.62rem', fontWeight: 600,
                                          background: u.status === 'available' ? 'rgba(34, 197, 94, 0.1)' : u.status === 'reserved' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                          color: u.status === 'available' ? '#22c55e' : u.status === 'reserved' ? '#f59e0b' : '#ef4444'
                                        }}>{u.status}</span>
                                      </div>

                                      <div style={{ fontSize: '0.8rem', color: '#444' }}>
                                        {u.bedrooms != null && `${u.bedrooms} Bed`} {u.bathrooms != null && `• ${u.bathrooms} Bath`} {u.living_rooms ? `• ${u.living_rooms} Living` : ''}
                                        {u.finishing_type && <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>Finishing: {finishingLabels[u.finishing_type] || u.finishing_type}</div>}
                                        {u.view_type && <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>View: 🌅 {u.view_type}</div>}
                                      </div>

                                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(0,0,0,0.03)', paddingTop: '8px', marginTop: '4px' }}>
                                        <span style={{ fontWeight: 700, fontSize: '0.85rem', color: '#10b981' }}>{u.price ? u.price.toLocaleString() : 0} EGP</span>
                                        <div style={{ display: 'flex', gap: '4px' }}>
                                          <button style={{ ...styles.btnSecondary, padding: '3px 6px', fontSize: '0.65rem' }} onClick={() => openEditUnitModal(b, f, u)}>
                                            <Edit2 size={10} />
                                          </button>
                                          <button style={{ ...styles.btnDanger, padding: '3px 6px', fontSize: '0.65rem' }} onClick={() => handleDeleteUnit(u.id)}>
                                            <Trash2 size={10} />
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                      {b.notes && (
                        <div style={{ padding: '10px 20px', fontSize: '0.8rem', color: 'var(--text-muted)', borderTop: '1px solid rgba(0,0,0,0.04)' }}>
                          📝 {b.notes}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* ── AMENITIES SECTION ── */}
          <div style={styles.section}>
            <div style={styles.sectionTitle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Trees size={18} color="#22c55e" /> Shared Amenities & Infrastructure ({amenities.length})
              </div>
              <button style={styles.btnPrimary} onClick={openAddAmenityModal}>
                <Plus size={14} /> Add Amenity
              </button>
            </div>

            {amenities.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                No amenities added yet.
              </div>
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                {amenities.map((a) => (
                  <div key={a.id} style={styles.amenityTag}>
                    <span>{amenityTypeLabels[a.type] || a.type}</span>
                    <strong>{a.name}</strong>
                    {a.area && <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>({a.area} m²)</span>}
                    {a.quantity > 1 && <span style={{ color: '#3b82f6', fontSize: '0.75rem' }}>×{a.quantity}</span>}
                    <button
                      onClick={() => handleDeleteAmenity(a.id)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', color: '#ef4444', opacity: 0.5 }}
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* ══════════ MODALS ══════════ */}

      {/* ── Land Info Modal ── */}
      {showLandModal && (
        <div style={styles.modal} onClick={() => setShowLandModal(false)}>
          <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MapPin size={18} color="#059669" /> Edit Land & Site Info
            </h3>
            <form onSubmit={handleLandSubmit}>
              <div style={styles.formGrid}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Land Area</label>
                  <input style={styles.input} type="number" step="0.01" value={fLandArea} onChange={e => setFLandArea(e.target.value)} placeholder="e.g. 50" />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Unit</label>
                  <select style={styles.select} value={fLandUnit} onChange={e => setFLandUnit(e.target.value)}>
                    <option value="sqm">Square Meters</option>
                    <option value="feddan">Feddan (فدان)</option>
                    <option value="acre">Acre</option>
                  </select>
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Building Ratio (%)</label>
                  <input style={styles.input} type="number" step="0.1" value={fBuildingRatio} onChange={e => setFBuildingRatio(e.target.value)} placeholder="e.g. 40" />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Max Height (m)</label>
                  <input style={styles.input} type="number" step="0.1" value={fMaxHeight} onChange={e => setFMaxHeight(e.target.value)} placeholder="e.g. 36" />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Max Floors</label>
                  <input style={styles.input} type="number" value={fMaxFloors} onChange={e => setFMaxFloors(e.target.value)} placeholder="e.g. 10" />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Green Area (m²)</label>
                  <input style={styles.input} type="number" step="0.01" value={fGreenArea} onChange={e => setFGreenArea(e.target.value)} />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Roads Area (m²)</label>
                  <input style={styles.input} type="number" step="0.01" value={fRoadsArea} onChange={e => setFRoadsArea(e.target.value)} />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Parking Spaces</label>
                  <input style={styles.input} type="number" value={fParkingSpaces} onChange={e => setFParkingSpaces(e.target.value)} />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Project Type</label>
                  <select style={styles.select} value={fProjectType} onChange={e => setFProjectType(e.target.value)}>
                    <option value="residential">Residential</option>
                    <option value="commercial">Commercial</option>
                    <option value="mixed_use">Mixed Use</option>
                    <option value="resort">Resort</option>
                  </select>
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Plan Status</label>
                  <select style={styles.select} value={fPlanStatus} onChange={e => setFPlanStatus(e.target.value)}>
                    <option value="draft">Draft</option>
                    <option value="review">Review</option>
                    <option value="approved">Approved</option>
                  </select>
                </div>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Infrastructure Notes</label>
                <textarea style={{ ...styles.input, minHeight: '80px', resize: 'vertical' as const }} value={fInfrastructureNotes} onChange={e => setFInfrastructureNotes(e.target.value)} placeholder="Water tanks, generators, electrical rooms..." />
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '16px' }}>
                <button type="button" style={styles.btnSecondary} onClick={() => setShowLandModal(false)}><X size={14} /> Cancel</button>
                <button type="submit" style={styles.btnPrimary}><Save size={14} /> Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Building Modal ── */}
      {showBuildingModal && (
        <div style={styles.modal} onClick={() => setShowBuildingModal(false)}>
          <div style={{ ...styles.modalContent, maxWidth: '700px' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Building2 size={18} color="#3b82f6" /> {buildingModalMode === 'add' ? 'Add Building' : 'Edit Building'}
            </h3>
            <form onSubmit={handleBuildingSubmit}>
              <div style={styles.formGrid}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Name *</label>
                  <input style={styles.input} value={fBName} onChange={e => setFBName(e.target.value)} required placeholder="e.g. Building A" />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Arabic Name</label>
                  <input style={styles.input} value={fBNameAr} onChange={e => setFBNameAr(e.target.value)} placeholder="e.g. عمارة أ" dir="rtl" />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Type *</label>
                  <select style={styles.select} value={fBType} onChange={e => setFBType(e.target.value)}>
                    {Object.entries(buildingTypeLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Total Floors *</label>
                  <input style={styles.input} type="number" min="1" value={fBFloors} onChange={e => setFBFloors(e.target.value)} required />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Status</label>
                  <select style={styles.select} value={fBStatus} onChange={e => setFBStatus(e.target.value)}>
                    <option value="planned">Planned</option>
                    <option value="under_construction">Under Construction</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>

              {/* Structural features */}
              <div style={{ padding: '14px', background: 'rgba(59,130,246,0.03)', borderRadius: '10px', marginBottom: '14px' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: '10px', color: '#3b82f6' }}>Structural Features</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', cursor: 'pointer' }}>
                    <input type="checkbox" checked={fBBasement} onChange={e => setFBBasement(e.target.checked)} /> Has Basement
                  </label>
                  {fBBasement && (
                    <div style={styles.formGroup}>
                      <label style={styles.label}>Basement Floors</label>
                      <input style={styles.input} type="number" min="1" value={fBBasementFloors} onChange={e => setFBBasementFloors(e.target.value)} />
                    </div>
                  )}
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', cursor: 'pointer' }}>
                    <input type="checkbox" checked={fBRoof} onChange={e => setFBRoof(e.target.checked)} /> Has Roof Floor
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', cursor: 'pointer' }}>
                    <input type="checkbox" checked={fBElevator} onChange={e => setFBElevator(e.target.checked)} /> Has Elevator
                  </label>
                  {fBElevator && (
                    <div style={styles.formGroup}>
                      <label style={styles.label}>Elevator Count</label>
                      <input style={styles.input} type="number" min="1" value={fBElevatorCount} onChange={e => setFBElevatorCount(e.target.value)} />
                    </div>
                  )}
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Staircases</label>
                    <input style={styles.input} type="number" min="1" value={fBStaircase} onChange={e => setFBStaircase(e.target.value)} />
                  </div>
                </div>
              </div>

              {/* Area metrics */}
              <div style={{ padding: '14px', background: 'rgba(139,92,246,0.03)', borderRadius: '10px', marginBottom: '14px' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: '10px', color: '#8b5cf6' }}>Area Metrics (m²)</div>
                <div style={styles.formGrid}>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Footprint Area</label>
                    <input style={styles.input} type="number" step="0.01" value={fBFootprint} onChange={e => setFBFootprint(e.target.value)} placeholder="Building footprint" />
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Total Built Area</label>
                    <input style={styles.input} type="number" step="0.01" value={fBBuiltArea} onChange={e => setFBBuiltArea(e.target.value)} placeholder="All floors total" />
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Lobby Area</label>
                    <input style={styles.input} type="number" step="0.01" value={fBLobby} onChange={e => setFBLobby(e.target.value)} />
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Common Area/Floor</label>
                    <input style={styles.input} type="number" step="0.01" value={fBCommonArea} onChange={e => setFBCommonArea(e.target.value)} placeholder="Corridors + stairs" />
                  </div>
                </div>
              </div>

              {/* Parking */}
              <div style={styles.formGrid}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Parking Type</label>
                  <select style={styles.select} value={fBParkingType} onChange={e => setFBParkingType(e.target.value)}>
                    <option value="none">None</option>
                    <option value="basement">Basement</option>
                    <option value="ground">Ground Level</option>
                    <option value="multi_level">Multi-Level</option>
                    <option value="outdoor">Outdoor</option>
                  </select>
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Parking Capacity</label>
                  <input style={styles.input} type="number" min="0" value={fBParkingCap} onChange={e => setFBParkingCap(e.target.value)} />
                </div>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Notes</label>
                <textarea style={{ ...styles.input, minHeight: '60px', resize: 'vertical' as const }} value={fBNotes} onChange={e => setFBNotes(e.target.value)} />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '16px' }}>
                <button type="button" style={styles.btnSecondary} onClick={() => setShowBuildingModal(false)}><X size={14} /> Cancel</button>
                <button type="submit" style={styles.btnPrimary}><Save size={14} /> {buildingModalMode === 'add' ? 'Create Building' : 'Update Building'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Generate Units Modal ── */}
      {showGenUnitsModal && selectedBuilding && selectedFloor && (
        <div style={styles.modal} onClick={() => setShowGenUnitsModal(false)}>
          <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <LayoutGrid size={18} color="#059669" /> Generate Units
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
              {selectedBuilding.name} — {selectedFloor.floor_label}
            </p>
            <form onSubmit={handleGenUnitsSubmit}>
              <div style={styles.formGrid}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Number of Units *</label>
                  <input style={styles.input} type="number" min="1" max="50" value={fGUCount} onChange={e => setFGUCount(e.target.value)} required />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Unit Type *</label>
                  <select style={styles.select} value={fGUType} onChange={e => setFGUType(e.target.value)}>
                    {Object.entries(unitTypeLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Area (m²) *</label>
                  <input style={styles.input} type="number" step="0.01" value={fGUArea} onChange={e => setFGUArea(e.target.value)} required />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Bedrooms</label>
                  <input style={styles.input} type="number" min="0" value={fGUBedrooms} onChange={e => setFGUBedrooms(e.target.value)} />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Bathrooms</label>
                  <input style={styles.input} type="number" min="0" value={fGUBathrooms} onChange={e => setFGUBathrooms(e.target.value)} />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Living Rooms</label>
                  <input style={styles.input} type="number" min="0" value={fGULivingRooms} onChange={e => setFGULivingRooms(e.target.value)} />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Price (EGP) *</label>
                  <input style={styles.input} type="number" step="0.01" value={fGUPrice} onChange={e => setFGUPrice(e.target.value)} required />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Min Down Payment (EGP) *</label>
                  <input style={styles.input} type="number" step="0.01" value={fGUMinDownPayment} onChange={e => setFGUMinDownPayment(e.target.value)} required />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Finishing</label>
                  <select style={styles.select} value={fGUFinishing} onChange={e => setFGUFinishing(e.target.value)}>
                    {Object.entries(finishingLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Unit # Prefix</label>
                  <input style={styles.input} value={fGUPrefix} onChange={e => setFGUPrefix(e.target.value)} placeholder="e.g. A" />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '16px' }}>
                <button type="button" style={styles.btnSecondary} onClick={() => setShowGenUnitsModal(false)}><X size={14} /> Cancel</button>
                <button type="submit" style={styles.btnPrimary}><LayoutGrid size={14} /> Generate {fGUCount} Units</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Amenity Modal ── */}
      {showAmenityModal && (
        <div style={styles.modal} onClick={() => setShowAmenityModal(false)}>
          <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Trees size={18} color="#22c55e" /> Add Amenity
            </h3>
            <form onSubmit={handleAmenitySubmit}>
              <div style={styles.formGrid}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Name *</label>
                  <input style={styles.input} value={fAName} onChange={e => setFAName(e.target.value)} required placeholder="e.g. Main Pool" />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Type *</label>
                  <select style={styles.select} value={fAType} onChange={e => setFAType(e.target.value)}>
                    {Object.entries(amenityTypeLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Area (m²)</label>
                  <input style={styles.input} type="number" step="0.01" value={fAArea} onChange={e => setFAArea(e.target.value)} />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Quantity</label>
                  <input style={styles.input} type="number" min="1" value={fAQuantity} onChange={e => setFAQuantity(e.target.value)} />
                </div>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Description</label>
                <textarea style={{ ...styles.input, minHeight: '60px', resize: 'vertical' as const }} value={fADesc} onChange={e => setFADesc(e.target.value)} />
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '16px' }}>
                <button type="button" style={styles.btnSecondary} onClick={() => setShowAmenityModal(false)}><X size={14} /> Cancel</button>
                <button type="submit" style={styles.btnPrimary}><Plus size={14} /> Add Amenity</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Floor Modal ── */}
      {showFloorModal && selectedBuilding && (
        <div style={styles.modal} onClick={() => setShowFloorModal(false)}>
          <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Layers size={18} color="#3b82f6" /> {floorModalMode === 'add' ? 'Add Floor' : 'Edit Floor'}
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
              {selectedBuilding.name}
            </p>
            <form onSubmit={handleFloorSubmit}>
              <div style={styles.formGrid}>
                {floorModalMode === 'add' && (
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Floor Number *</label>
                    <input style={styles.input} type="number" value={fFloorNumber} onChange={e => setFFloorNumber(e.target.value)} required placeholder="e.g. 1" />
                  </div>
                )}
                <div style={styles.formGroup}>
                  <label style={styles.label}>Floor Label *</label>
                  <input style={styles.input} value={fFloorLabel} onChange={e => setFFloorLabel(e.target.value)} required placeholder="e.g. الدور الأول" />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Floor Type *</label>
                  <select style={styles.select} value={fFloorType} onChange={e => setFFloorType(e.target.value)}>
                    {Object.entries(floorTypeLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Gross Area (m²)</label>
                  <input style={styles.input} type="number" step="0.01" value={fFloorGrossArea} onChange={e => setFFloorGrossArea(e.target.value)} />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Common Area (m²)</label>
                  <input style={styles.input} type="number" step="0.01" value={fFloorCommonArea} onChange={e => setFFloorCommonArea(e.target.value)} />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Net Usable Area (m²)</label>
                  <input style={styles.input} type="number" step="0.01" value={fFloorNetArea} onChange={e => setFFloorNetArea(e.target.value)} />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Ceiling Height (m)</label>
                  <input style={styles.input} type="number" step="0.01" value={fFloorCeilingHeight} onChange={e => setFFloorCeilingHeight(e.target.value)} />
                </div>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Notes</label>
                <textarea style={{ ...styles.input, minHeight: '60px', resize: 'vertical' as const }} value={fFloorNotes} onChange={e => setFFloorNotes(e.target.value)} />
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '16px' }}>
                <button type="button" style={styles.btnSecondary} onClick={() => setShowFloorModal(false)}><X size={14} /> Cancel</button>
                <button type="submit" style={styles.btnPrimary}><Save size={14} /> {floorModalMode === 'add' ? 'Create Floor' : 'Save Changes'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Unit Modal ── */}
      {showUnitModal && selectedBuilding && selectedFloor && (
        <div style={styles.modal} onClick={() => setShowUnitModal(false)}>
          <div style={{ ...styles.modalContent, maxWidth: '750px' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Home size={18} color="#10b981" /> {unitModalMode === 'add' ? 'Add Single Unit' : 'Edit Unit'}
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
              {selectedBuilding.name} — {selectedFloor.floor_label}
            </p>
            <form onSubmit={handleUnitSubmit}>
              <div style={styles.formGrid}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Unit Number *</label>
                  <input style={styles.input} value={fUnitNumber} onChange={e => setFUnitNumber(e.target.value)} required placeholder="e.g. A-101" />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Unit Type *</label>
                  <select style={styles.select} value={fUnitType} onChange={e => setFUnitType(e.target.value)}>
                    {Object.entries(unitTypeLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Price (EGP) *</label>
                  <input style={styles.input} type="number" step="0.01" value={fUnitPrice} onChange={e => setFUnitPrice(e.target.value)} required />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Min Down Payment (EGP) *</label>
                  <input style={styles.input} type="number" step="0.01" value={fUnitMinDownPayment} onChange={e => setFUnitMinDownPayment(e.target.value)} required />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Status *</label>
                  <select style={styles.select} value={fUnitStatus} onChange={e => setFUnitStatus(e.target.value)}>
                    <option value="available">Available</option>
                    <option value="reserved">Reserved</option>
                    <option value="sold">Sold</option>
                    <option value="blocked">Blocked</option>
                    <option value="coming_soon">Coming Soon</option>
                    <option value="frozen">Frozen</option>
                    <option value="hidden">Hidden</option>
                  </select>
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Gross Area (m²) *</label>
                  <input style={styles.input} type="number" step="0.01" value={fUnitArea} onChange={e => setFUnitArea(e.target.value)} required />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Net Area (m²)</label>
                  <input style={styles.input} type="number" step="0.01" value={fUnitNetArea} onChange={e => setFUnitNetArea(e.target.value)} placeholder="Net usable area" />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Finishing</label>
                  <select style={styles.select} value={fUnitFinishing} onChange={e => setFUnitFinishing(e.target.value)}>
                    {Object.entries(finishingLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>View Type</label>
                  <select style={styles.select} value={fUnitView || ''} onChange={e => setFUnitView(e.target.value)}>
                    <option value="garden">🌳 Garden View</option>
                    <option value="pool">🏊 Pool View</option>
                    <option value="street">🛣️ Street View</option>
                    <option value="sea">🌊 Sea View</option>
                    <option value="landmark">🗼 Landmark View</option>
                  </select>
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Orientation</label>
                  <input style={styles.input} value={fUnitOrientation} onChange={e => setFUnitOrientation(e.target.value)} placeholder="e.g. North, East, البحري" />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Phase</label>
                  <input style={styles.input} value={fUnitPhase} onChange={e => setFUnitPhase(e.target.value)} placeholder="e.g. Phase 1" />
                </div>
              </div>

              {/* Layout Details */}
              <div style={{ padding: '14px', background: 'rgba(59,130,246,0.03)', borderRadius: '10px', marginBottom: '14px', marginTop: '14px' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: '10px', color: '#3b82f6' }}>Interior Layout</div>
                <div style={styles.formGrid}>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Bedrooms</label>
                    <input style={styles.input} type="number" min="0" value={fUnitBedrooms} onChange={e => setFUnitBedrooms(e.target.value)} />
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Bathrooms</label>
                    <input style={styles.input} type="number" min="0" value={fUnitBathrooms} onChange={e => setFUnitBathrooms(e.target.value)} />
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Living Rooms</label>
                    <input style={styles.input} type="number" min="0" value={fUnitLivingRooms} onChange={e => setFUnitLivingRooms(e.target.value)} />
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Kitchens</label>
                    <input style={styles.input} type="number" min="0" value={fUnitKitchens} onChange={e => setFUnitKitchens(e.target.value)} />
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Balcony Count</label>
                    <input style={styles.input} type="number" min="0" value={fUnitBalconies} onChange={e => setFUnitBalconies(e.target.value)} />
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Balcony Area (m²)</label>
                    <input style={styles.input} type="number" step="0.01" value={fUnitBalconyArea} onChange={e => setFUnitBalconyArea(e.target.value)} />
                  </div>
                </div>
              </div>

              {/* Checkbox amenities */}
              <div style={{ padding: '14px', background: 'rgba(16,185,129,0.03)', borderRadius: '10px', marginBottom: '14px' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: '10px', color: '#10b981' }}>Private Amenities & Features</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', cursor: 'pointer' }}>
                    <input type="checkbox" checked={fUnitMaidRoom} onChange={e => setFUnitMaidRoom(e.target.checked)} /> Maid's Room
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', cursor: 'pointer' }}>
                    <input type="checkbox" checked={fUnitStorage} onChange={e => setFUnitStorage(e.target.checked)} /> Storage Room
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', cursor: 'pointer' }}>
                    <input type="checkbox" checked={fUnitGarden} onChange={e => setFUnitGarden(e.target.checked)} /> Private Garden
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', cursor: 'pointer' }}>
                    <input type="checkbox" checked={fUnitParking} onChange={e => setFUnitParking(e.target.checked)} /> Private Parking Space
                  </label>
                </div>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Layout Description</label>
                <textarea style={{ ...styles.input, minHeight: '60px', resize: 'vertical' as const }} value={fUnitLayoutDesc} onChange={e => setFUnitLayoutDesc(e.target.value)} placeholder="Description of layout, view, or architectural style..." />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '16px' }}>
                <button type="button" style={styles.btnSecondary} onClick={() => setShowUnitModal(false)}><X size={14} /> Cancel</button>
                <button type="submit" style={styles.btnPrimary}><Save size={14} /> {unitModalMode === 'add' ? 'Create Unit' : 'Save Changes'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MasterPlanPage;
