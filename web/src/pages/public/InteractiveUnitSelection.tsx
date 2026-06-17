import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import {
  Building, Layers, MapPin, ArrowRight, ArrowLeft, ChevronRight,
  ChevronLeft, Home, Eye, Maximize, DollarSign, Compass, CheckCircle,
  Lock, X, Globe, Menu, Shield, Loader, ArrowUpRight, Square,
  ChevronDown, Phone, Mail, User, CreditCard, Hash, Info
} from 'lucide-react';

/* ═══════════════════════════════════════════════════════
   Bilingual Translation Strings
   ═══════════════════════════════════════════════════════ */
const translations = {
  en: {
    pageTitle: 'Interactive Unit Selection',
    pageSubtitle: 'Navigate through the master plan, select your building, floor, and unit',
    selectProject: 'Select a Project',
    selectProjectDesc: 'Choose a compound to explore its buildings and available units',
    masterPlan: 'Master Plan',
    buildings: 'Buildings',
    floors: 'Floors',
    units: 'Units',
    building: 'Building',
    floor: 'Floor',
    unit: 'Unit',
    availableUnits: 'Available Units',
    totalUnits: 'Total Units',
    totalFloors: 'Total Floors',
    selectBuilding: 'Select a Building',
    selectBuildingDesc: 'Click on a building to explore its floors',
    selectFloor: 'Select a Floor',
    selectFloorDesc: 'Click on a floor to see available units',
    selectUnit: 'Select a Unit',
    selectUnitDesc: 'Click on an available unit to view details',
    unitDetails: 'Unit Details',
    area: 'Area',
    price: 'Price',
    direction: 'Direction / View',
    view: 'View Type',
    status: 'Status',
    type: 'Type',
    bedrooms: 'Bedrooms',
    bathrooms: 'Bathrooms',
    unitNumber: 'Unit Number',
    floorNumber: 'Floor',
    reserveUnit: 'Reserve This Unit',
    confirmReservation: 'Confirm Reservation',
    confirmDesc: 'You are about to reserve the following unit. Please fill in your details to proceed.',
    firstName: 'First Name',
    lastName: 'Last Name',
    email: 'Email Address',
    phone: 'Phone Number',
    nationalId: 'National ID / Passport',
    processing: 'Processing Reservation...',
    successTitle: 'Reservation Confirmed!',
    successDesc: 'Your unit has been successfully reserved. Your priority queue number is:',
    close: 'Close',
    backToProjects: 'Back to Projects',
    back: 'Back',
    available: 'Available',
    reserved: 'Reserved',
    sold: 'Sold',
    comingSoon: 'Coming Soon',
    hidden: 'Hidden',
    frozen: 'Frozen',
    noBuildings: 'No buildings found for this project.',
    noUnits: 'No units on this floor.',
    sqm: 'm²',
    egp: 'EGP',
    location: 'Location',
    deliveryDate: 'Delivery Date',
    navHome: 'Home',
    navUnitSelection: 'Unit Selection',
    navLogin: 'Operator Login',
    navDashboard: 'Dashboard',
    exploreBuildings: 'Explore Buildings',
    garden: 'Garden View',
    pool: 'Pool View',
    street: 'Street View',
    sea: 'Sea View',
    landmark: 'Landmark View',
    apartment: 'Apartment',
    villa: 'Villa',
    commercial: 'Commercial',
    office: 'Office',
    duplex: 'Duplex',
    penthouse: 'Penthouse',
    fillRequired: 'Please fill all required fields.',
    errorOccurred: 'An error occurred. Please try again.',
    view3D: 'View 3D',
    viewImage: 'View Image',
    model3DReady: '3D Model Ready',
    model3DProcessing: 'Generating 3D...',
    model3DFailed: '3D Generation Failed',
    interactHint: 'Click & drag to rotate • Scroll to zoom',
    eoiLocationLabel: 'Select Your Location',
    eoiLocationInside: 'Inside Egypt 🇪🇬',
    eoiLocationOutside: 'Outside Egypt 🌍',
    eoiPaymentMethodLabel: 'Select Payment Method',
    eoiPaymentMethodBank: 'Local Bank Transfer',
    eoiPaymentMethodInstapay: 'InstaPay Transfer',
    eoiPaymentMethodIntlBank: 'International Bank Transfer',
    eoiReceiptUpload: 'Upload Payment Receipt (Required) *',
    eoiPassportUpload: 'Upload Passport (Required for Outside Egypt) *',
    eoiBankDetailsTitle: 'Bank Account Transfer Details',
    eoiInstapayDetailsTitle: 'InstaPay Details',
    eoiUploadHint: 'Accepts PDF, JPG, PNG up to 10MB',
  },
  ar: {
    pageTitle: 'اختيار الوحدات التفاعلي',
    pageSubtitle: 'تنقل داخل المخطط الرئيسي، واختر المبنى والدور والوحدة',
    selectProject: 'اختر مشروعاً',
    selectProjectDesc: 'اختر كمبوند لاستكشاف المباني والوحدات المتاحة',
    masterPlan: 'المخطط الرئيسي',
    buildings: 'المباني',
    floors: 'الأدوار',
    units: 'الوحدات',
    building: 'مبنى',
    floor: 'دور',
    unit: 'وحدة',
    availableUnits: 'الوحدات المتاحة',
    totalUnits: 'إجمالي الوحدات',
    totalFloors: 'إجمالي الأدوار',
    selectBuilding: 'اختر مبنى',
    selectBuildingDesc: 'اضغط على مبنى لاستكشاف أدواره',
    selectFloor: 'اختر دوراً',
    selectFloorDesc: 'اضغط على دور لرؤية الوحدات المتاحة',
    selectUnit: 'اختر وحدة',
    selectUnitDesc: 'اضغط على وحدة متاحة لعرض التفاصيل',
    unitDetails: 'تفاصيل الوحدة',
    area: 'المساحة',
    price: 'السعر',
    direction: 'الاتجاه / الإطلالة',
    view: 'نوع الإطلالة',
    status: 'الحالة',
    type: 'النوع',
    bedrooms: 'غرف النوم',
    bathrooms: 'الحمامات',
    unitNumber: 'رقم الوحدة',
    floorNumber: 'الدور',
    reserveUnit: 'حجز هذه الوحدة',
    confirmReservation: 'تأكيد الحجز',
    confirmDesc: 'أنت على وشك حجز الوحدة التالية. يرجى ملء بياناتك للمتابعة.',
    firstName: 'الاسم الأول',
    lastName: 'الاسم الأخير',
    email: 'البريد الإلكتروني',
    phone: 'رقم الهاتف',
    nationalId: 'الرقم القومي / جواز السفر',
    processing: 'جاري معالجة الحجز...',
    successTitle: 'تم تأكيد الحجز!',
    successDesc: 'تم حجز وحدتك بنجاح. رقم أولويتك في الطابور:',
    close: 'إغلاق',
    backToProjects: 'العودة للمشاريع',
    back: 'رجوع',
    available: 'متاحة',
    reserved: 'محجوزة',
    sold: 'مباعة',
    comingSoon: 'قريباً',
    hidden: 'مخفية',
    frozen: 'مجمدة',
    noBuildings: 'لا توجد مباني في هذا المشروع.',
    noUnits: 'لا توجد وحدات في هذا الدور.',
    sqm: 'م²',
    egp: 'ج.م',
    location: 'الموقع',
    deliveryDate: 'تاريخ التسليم',
    navHome: 'الرئيسية',
    navUnitSelection: 'اختيار الوحدات',
    navLogin: 'دخول الموظفين',
    navDashboard: 'لوحة التحكم',
    exploreBuildings: 'استكشف المباني',
    garden: 'إطلالة حديقة',
    pool: 'إطلالة حمام سباحة',
    street: 'إطلالة شارع',
    sea: 'إطلالة بحر',
    landmark: 'إطلالة معلم',
    apartment: 'شقة',
    villa: 'فيلا',
    commercial: 'تجاري',
    office: 'مكتب',
    duplex: 'دوبلكس',
    penthouse: 'بنتهاوس',
    fillRequired: 'يرجى ملء جميع الحقول المطلوبة.',
    errorOccurred: 'حدث خطأ. يرجى المحاولة مرة أخرى.',
    view3D: 'عرض ثلاثي الأبعاد',
    viewImage: 'عرض الصورة',
    model3DReady: 'النموذج ثلاثي الأبعاد جاهز',
    model3DProcessing: 'جارٍ إنشاء النموذج...',
    model3DFailed: 'فشل إنشاء النموذج',
    interactHint: 'اسحب للتدوير • مرر للتكبير',
    eoiLocationLabel: 'تحديد موقعك الحالي',
    eoiLocationInside: 'داخل مصر 🇪🇬',
    eoiLocationOutside: 'خارج مصر 🌍',
    eoiPaymentMethodLabel: 'اختر طريقة الدفع',
    eoiPaymentMethodBank: 'تحويل بنكي محلي',
    eoiPaymentMethodInstapay: 'تحويل عبر InstaPay',
    eoiPaymentMethodIntlBank: 'تحويل بنكي دولي',
    eoiReceiptUpload: 'رفع إيصال الدفع (مطلوب) *',
    eoiPassportUpload: 'رفع صورة جواز السفر (مطلوب لخارج مصر) *',
    eoiBankDetailsTitle: 'بيانات الحساب البنكي للتحويل',
    eoiInstapayDetailsTitle: 'بيانات حساب InstaPay',
    eoiUploadHint: 'الملفات المقبولة: PDF, JPG, PNG حتى 10 ميجابايت',
  }
};

/* ═══════════════════════════════════════════════════════
   Types
   ═══════════════════════════════════════════════════════ */
interface UnitData {
  id: string;
  unit_number: string;
  type: string;
  area: number | null;
  price: number;
  view_type: string | null;
  status: string;
  bedrooms: number | null;
  bathrooms: number | null;
  floor: number;
  building: string | null;
  layout_description: string | null;
  handover_date: string | null;
  layout_image_url?: string | null;
  model_3d_status?: string | null;
  model_3d_url?: string | null;
  tripo_error_msg?: string | null;
}

interface FloorData {
  floor: number;
  units: UnitData[];
  total_units: number;
  available_units: number;
}

interface BuildingData {
  name: string;
  total_floors: number;
  total_units: number;
  available_units: number;
  floors: FloorData[];
}

interface ProjectInfo {
  id: string;
  name: string;
  location: string;
  status: string;
  delivery_date: string | null;
}

interface ProjectListItem {
  id: string;
  name: string;
  location: string;
  status: string;
  delivery_date: string | null;
  units_count: number;
  image_url?: string;
}

type Step = 'projects' | 'buildings' | 'floors' | 'units';

/* ═══════════════════════════════════════════════════════
   Component
   ═══════════════════════════════════════════════════════ */
const InteractiveUnitSelection: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Language
  const [lang, setLang] = useState<'en' | 'ar'>('en');
  const dir = lang === 'ar' ? 'rtl' : 'ltr';
  const t = translations[lang];
  const Arrow = lang === 'ar' ? ArrowLeft : ArrowRight;
  const Chevron = lang === 'ar' ? ChevronLeft : ChevronRight;

  // Navigation state
  const [currentStep, setCurrentStep] = useState<Step>('projects');
  const [projects, setProjects] = useState<ProjectListItem[]>([]);
  const [selectedProject, setSelectedProject] = useState<ProjectInfo | null>(null);
  const [buildings, setBuildings] = useState<BuildingData[]>([]);
  const [selectedBuilding, setSelectedBuilding] = useState<BuildingData | null>(null);
  const [selectedFloor, setSelectedFloor] = useState<FloorData | null>(null);
  const [selectedUnit, setSelectedUnit] = useState<UnitData | null>(null);
  const [projectMedia, setProjectMedia] = useState<{
    project_image: string | null;
    building_images: Record<string, { image_url: string }>;
    floor_plan_images: Record<string, { image_url: string }>;
  } | null>(null);
  const [hoveredFloor, setHoveredFloor] = useState<FloorData | null>(null);

  // 3D Model state
  const [building3DModels, setBuilding3DModels] = useState<Record<string, { status: string; model_url: string | null }>>({});
  const [active3DBuilding, setActive3DBuilding] = useState<string | null>(null);

  // Fullscreen 3D Viewer Modal State
  const [fullscreenModelUrl, setFullscreenModelUrl] = useState<string | null>(null);
  const [fullscreenModelTitle, setFullscreenModelTitle] = useState<string>('');

  // UI state
  const [loading, setLoading] = useState(false);
  const [animating, setAnimating] = useState(false);
  const [showUnitPanel, setShowUnitPanel] = useState(false);
  const [showReserveModal, setShowReserveModal] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [unitView3D, setUnitView3D] = useState(false);

  useEffect(() => {
    if (selectedUnit) {
      setUnitView3D(!selectedUnit.layout_image_url && selectedUnit.model_3d_status === 'completed');
    } else {
      setUnitView3D(false);
    }
  }, [selectedUnit]);

  // Reservation form
  const [reserveForm, setReserveForm] = useState({
    first_name: '', last_name: '', email: '', phone: '', national_id: ''
  });
  const [clientLocation, setClientLocation] = useState<'inside_egypt' | 'outside_egypt' | ''>('');
  const [paymentMethod, setPaymentMethod] = useState<'bank_transfer' | 'instapay' | 'international_bank_transfer' | ''>('');
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [passportFile, setPassportFile] = useState<File | null>(null);
  const [reserveStep, setReserveStep] = useState<1 | 2>(1);
  const [reserveProcessing, setReserveProcessing] = useState(false);
  const [reserveResult, setReserveResult] = useState<any>(null);
  const [reserveError, setReserveError] = useState('');

  // Init
  useEffect(() => {
    setIsLoggedIn(!!localStorage.getItem('redp_token'));
    loadProjects();

    // Load Google Model Viewer script
    if (!document.querySelector('script[src*="model-viewer"]')) {
      const script = document.createElement('script');
      script.type = 'module';
      script.src = 'https://ajax.googleapis.com/ajax/libs/model-viewer/3.5.0/model-viewer.min.js';
      document.head.appendChild(script);
    }
  }, []);

  // Auto-select project from URL param
  useEffect(() => {
    const projectId = searchParams.get('project');
    if (projectId && projects.length > 0) {
      const found = projects.find(p => p.id === projectId);
      if (found) {
        handleSelectProject(projectId);
      }
    }
  }, [projects, searchParams]);

  /* ─── API Calls ─── */
  const loadProjects = async () => {
    setLoading(true);
    try {
      const res = await api.get('/v1/public/projects');
      if (res.data?.success) {
        setProjects(res.data.data || []);
      }
    } catch (err) {
      console.error('Error fetching projects:', err);
    }
    setLoading(false);
  };

  const handleSelectProject = async (projectId: string) => {
    setLoading(true);
    setAnimating(true);
    try {
      const res = await api.get(`/v1/public/projects/${projectId}/units-by-building`);
      let mediaData = { project_image: null, building_images: {}, floor_plan_images: {} };
      try {
        const mediaRes = await api.get(`/v1/public/projects/${projectId}/media`);
        if (mediaRes.data?.success) {
          mediaData = mediaRes.data.data;
        }
      } catch (mediaErr) {
        console.error('Error fetching project media:', mediaErr);
      }

      // Fetch 3D model data
      let models3D: Record<string, { status: string; model_url: string | null }> = {};
      try {
        const models3DRes = await api.get(`/v1/public/projects/${projectId}/3d-models`);
        if (models3DRes.data?.success && Array.isArray(models3DRes.data.data)) {
          models3DRes.data.data.forEach((m: any) => {
            models3D[m.building_name] = { status: m.status, model_url: m.model_url };
          });
        }
      } catch (err3D) {
        console.error('Error fetching 3D models:', err3D);
      }

      if (res.data?.success) {
        setSelectedProject(res.data.data.project);
        setBuildings(res.data.data.buildings || []);
        setProjectMedia(mediaData);
        setBuilding3DModels(models3D);
        setActive3DBuilding(null);
        setTimeout(() => {
          setCurrentStep('buildings');
          setAnimating(false);
        }, 300);
      }
    } catch (err) {
      console.error('Error fetching project buildings:', err);
      setAnimating(false);
    }
    setLoading(false);
  };

  const handleSelectBuilding = useCallback((building: BuildingData) => {
    setAnimating(true);
    setSelectedBuilding(building);
    setTimeout(() => {
      setCurrentStep('floors');
      setAnimating(false);
    }, 300);
  }, []);

  const handleSelectFloor = useCallback((floor: FloorData) => {
    setAnimating(true);
    setSelectedFloor(floor);
    setTimeout(() => {
      setCurrentStep('units');
      setAnimating(false);
    }, 300);
  }, []);

  const handleSelectUnit = useCallback((unit: UnitData) => {
    if (unit.status !== 'available') return;
    setSelectedUnit(unit);
    setShowUnitPanel(true);
  }, []);

  const handleBack = useCallback(() => {
    setAnimating(true);
    if (currentStep === 'units') {
      setTimeout(() => { setCurrentStep('floors'); setSelectedFloor(null); setAnimating(false); setShowUnitPanel(false); setSelectedUnit(null); }, 300);
    } else if (currentStep === 'floors') {
      setTimeout(() => { setCurrentStep('buildings'); setSelectedBuilding(null); setAnimating(false); }, 300);
    } else if (currentStep === 'buildings') {
      setTimeout(() => { setCurrentStep('projects'); setSelectedProject(null); setBuildings([]); setProjectMedia(null); setHoveredFloor(null); setAnimating(false); }, 300);
    }
  }, [currentStep]);

  const openReserveModal = () => {
    setShowReserveModal(true);
    setReserveForm({ first_name: '', last_name: '', email: '', phone: '', national_id: '' });
    setClientLocation('');
    setPaymentMethod('');
    setReceiptFile(null);
    setPassportFile(null);
    setReserveStep(1);
    setReserveError('');
    setReserveResult(null);
  };

  const handleReserveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (reserveStep === 1) {
      if (!reserveForm.first_name || !reserveForm.last_name || !reserveForm.email || !reserveForm.phone) {
        setReserveError(t.fillRequired);
        return;
      }
      setReserveError('');
      setReserveStep(2);
      return;
    }

    if (!clientLocation) {
      setReserveError(lang === 'en' ? 'Please select your location.' : 'يرجى تحديد موقعك.');
      return;
    }
    if (!paymentMethod) {
      setReserveError(lang === 'en' ? 'Please select a payment method.' : 'يرجى تحديد طريقة الدفع.');
      return;
    }
    if (!receiptFile) {
      setReserveError(lang === 'en' ? 'Please upload the payment receipt.' : 'يرجى رفع إيصال الدفع.');
      return;
    }
    if (clientLocation === 'outside_egypt' && !passportFile) {
      setReserveError(lang === 'en' ? 'Please upload your passport.' : 'يرجى رفع صورة جواز السفر.');
      return;
    }

    setReserveProcessing(true);
    setReserveError('');
    try {
      const formData = new FormData();
      formData.append('first_name', reserveForm.first_name);
      formData.append('last_name', reserveForm.last_name);
      formData.append('email', reserveForm.email);
      formData.append('phone', reserveForm.phone);
      if (reserveForm.national_id) {
        formData.append('national_id', reserveForm.national_id);
      }
      formData.append('project_id', selectedProject?.id || '');
      formData.append('unit_id', selectedUnit?.id || '');
      formData.append('eoi_amount', '50000.00');
      formData.append('client_location', clientLocation);
      formData.append('payment_method', paymentMethod);
      formData.append('receipt', receiptFile);
      if (passportFile) {
        formData.append('passport', passportFile);
      }

      const res = await api.post('/v1/public/eoi/submit', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (res.data?.success) {
        setReserveResult(res.data);
        // Update unit status locally
        if (selectedFloor && selectedUnit) {
          const updatedUnits = selectedFloor.units.map(u =>
            u.id === selectedUnit.id ? { ...u, status: 'reserved' } : u
          );
          setSelectedFloor({ ...selectedFloor, units: updatedUnits, available_units: selectedFloor.available_units - 1 });
          setSelectedUnit({ ...selectedUnit, status: 'reserved' });
        }
      }
    } catch (err: any) {
      console.error(err);
      setReserveError(err.response?.data?.message || t.errorOccurred);
    }
    setReserveProcessing(false);
  };

  /* ─── Helpers ─── */
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return '#22c55e';
      case 'reserved': return '#f59e0b';
      case 'sold': return '#ef4444';
      case 'coming_soon': return '#94a3b8';
      case 'hidden': return '#64748b';
      case 'frozen': return '#06b6d4';
      default: return '#94a3b8';
    }
  };

  const getStatusLabel = (status: string) => {
    const map: Record<string, string> = {
      available: t.available, reserved: t.reserved, sold: t.sold,
      coming_soon: t.comingSoon, hidden: t.hidden, frozen: t.frozen
    };
    return map[status] || status;
  };

  const getViewLabel = (view: string | null) => {
    if (!view) return '—';
    const map: Record<string, string> = {
      garden: t.garden, pool: t.pool, street: t.street, sea: t.sea, landmark: t.landmark
    };
    return map[view] || view;
  };

  const getTypeLabel = (type: string) => {
    const map: Record<string, string> = {
      apartment: t.apartment, villa: t.villa, commercial: t.commercial,
      office: t.office, duplex: t.duplex, penthouse: t.penthouse
    };
    return map[type] || type;
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat(lang === 'ar' ? 'ar-EG' : 'en-EG').format(price);
  };

  const getFloorAvailabilityColor = (floor: FloorData) => {
    if (floor.available_units === 0) return 'rgba(239, 68, 68, 0.15)';
    if (floor.available_units === floor.total_units) return 'rgba(34, 197, 94, 0.15)';
    return 'rgba(245, 158, 11, 0.15)';
  };

  const getFloorBorderColor = (floor: FloorData) => {
    if (floor.available_units === 0) return 'rgba(239, 68, 68, 0.4)';
    if (floor.available_units === floor.total_units) return 'rgba(34, 197, 94, 0.4)';
    return 'rgba(245, 158, 11, 0.4)';
  };

  /* ─── Breadcrumbs ─── */
  const renderBreadcrumbs = () => {
    const crumbs: { label: string; onClick: () => void; active: boolean }[] = [];
    crumbs.push({ label: t.masterPlan, onClick: () => { if (currentStep !== 'projects') { setAnimating(true); setTimeout(() => { setCurrentStep('projects'); setSelectedProject(null); setBuildings([]); setSelectedBuilding(null); setSelectedFloor(null); setShowUnitPanel(false); setSelectedUnit(null); setAnimating(false); }, 300); }}, active: currentStep === 'projects' });
    if (selectedProject) {
      crumbs.push({ label: selectedProject.name, onClick: () => { if (currentStep !== 'buildings') { setAnimating(true); setTimeout(() => { setCurrentStep('buildings'); setSelectedBuilding(null); setSelectedFloor(null); setShowUnitPanel(false); setSelectedUnit(null); setAnimating(false); }, 300); }}, active: currentStep === 'buildings' });
    }
    if (selectedBuilding) {
      crumbs.push({ label: selectedBuilding.name, onClick: () => { if (currentStep !== 'floors') { setAnimating(true); setTimeout(() => { setCurrentStep('floors'); setSelectedFloor(null); setShowUnitPanel(false); setSelectedUnit(null); setAnimating(false); }, 300); }}, active: currentStep === 'floors' });
    }
    if (selectedFloor) {
      crumbs.push({ label: `${t.floor} ${selectedFloor.floor}`, onClick: () => {}, active: currentStep === 'units' });
    }

    return (
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap',
        padding: '16px 24px',
        background: 'rgba(255,255,255,0.7)',
        backdropFilter: 'blur(20px)',
        borderRadius: 16,
        border: '1.5px solid rgba(0,61,166,0.08)',
        marginBottom: 24,
      }}>
        <Home size={16} style={{ color: '#003DA6', flexShrink: 0 }} />
        {crumbs.map((crumb, i) => (
          <React.Fragment key={i}>
            {i > 0 && <Chevron size={14} style={{ color: '#94a3b8', flexShrink: 0 }} />}
            <span
              onClick={crumb.onClick}
              style={{
                fontSize: '0.85rem',
                fontWeight: crumb.active ? 700 : 500,
                color: crumb.active ? '#003DA6' : '#64748b',
                cursor: crumb.active ? 'default' : 'pointer',
                fontFamily: 'var(--font-title)',
                transition: 'color 0.3s ease',
              }}
            >
              {crumb.label}
            </span>
          </React.Fragment>
        ))}
      </div>
    );
  };

  /* ═══════════════════════════════════════════════════════
     STEP RENDERERS
     ═══════════════════════════════════════════════════════ */

  /* ─── STEP 1: Project Selector ─── */
  const renderProjectSelector = () => (
    <div style={{ animation: 'us3d-fadeSlideUp 0.6s cubic-bezier(0.16,1,0.3,1) forwards' }}>
      <div style={{ textAlign: 'center', marginBottom: 48 }}>
        <h2 style={{
          fontFamily: 'var(--font-title)', fontSize: '2.2rem', fontWeight: 800,
          background: 'linear-gradient(135deg, #003DA6 0%, #001A70 100%)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          marginBottom: 12
        }}>
          {t.selectProject}
        </h2>
        <p style={{ color: '#64748b', fontSize: '1rem', maxWidth: 500, margin: '0 auto' }}>
          {t.selectProjectDesc}
        </p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
        gap: 24,
        perspective: '1200px',
      }}>
        {projects.map((project, idx) => (
          <div
            key={project.id}
            onClick={() => handleSelectProject(project.id)}
            style={{
              background: 'rgba(255,255,255,0.85)',
              backdropFilter: 'blur(28px)',
              border: '1.5px solid rgba(0,61,166,0.08)',
              borderRadius: 24,
              padding: 0,
              cursor: 'pointer',
              transition: 'all 0.5s cubic-bezier(0.25,1,0.5,1)',
              transformStyle: 'preserve-3d',
              animation: `us3d-cardAppear 0.6s cubic-bezier(0.16,1,0.3,1) ${idx * 0.1}s both`,
              overflow: 'hidden',
              position: 'relative',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-8px) rotateX(2deg)';
              (e.currentTarget as HTMLDivElement).style.boxShadow = '0 25px 50px -15px rgba(0,61,166,0.15), 0 0 30px rgba(0,61,166,0.08)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0) rotateX(0)';
              (e.currentTarget as HTMLDivElement).style.boxShadow = '0 15px 35px -10px rgba(0,15,61,0.05)';
            }}
          >
            {/* Gradient top bar */}
            <div style={{
              height: 5,
              background: 'linear-gradient(90deg, #003DA6 0%, #C5A880 100%)',
            }} />

            {/* Card visual header */}
            <div style={{
              height: 160,
              background: `linear-gradient(135deg, rgba(0,61,166,0.08) 0%, rgba(197,168,128,0.08) 100%)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              overflow: 'hidden',
            }}>
              <div style={{
                position: 'absolute',
                width: '100%', height: '100%',
                background: 'radial-gradient(circle at 30% 50%, rgba(0,61,166,0.06) 0%, transparent 70%)',
              }} />
              {project.image_url ? (
                <img
                  src={project.image_url.startsWith('http') ? project.image_url : `http://127.0.0.1:8000/storage/${project.image_url}`}
                  alt={project.name}
                  style={{ width: '100%', height: '100%', objectFit: 'contain', backgroundColor: '#f8fafc' }}
                />
              ) : (
                <Building size={64} style={{ color: '#003DA6', opacity: 0.2 }} />
              )}
              <div style={{
                position: 'absolute',
                bottom: 16, left: lang === 'ar' ? 'auto' : 24, right: lang === 'ar' ? 24 : 'auto',
                display: 'flex', alignItems: 'center', gap: 8,
                background: 'rgba(255,255,255,0.9)',
                backdropFilter: 'blur(10px)',
                padding: '6px 14px',
                borderRadius: 999,
                boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
              }}>
                <div style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: project.status === 'active' ? '#22c55e' : '#f59e0b',
                }} />
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#1e293b', textTransform: 'uppercase' }}>
                  {project.status}
                </span>
              </div>
            </div>

            <div style={{ padding: '24px 28px 28px' }}>
              <h3 style={{
                fontFamily: 'var(--font-title)', fontSize: '1.3rem', fontWeight: 700,
                color: '#0f172a', marginBottom: 12,
              }}>
                {project.name}
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
                {project.location && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <MapPin size={14} style={{ color: '#C5A880' }} />
                    <span style={{ fontSize: '0.85rem', color: '#64748b' }}>{project.location}</span>
                  </div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Layers size={14} style={{ color: '#003DA6' }} />
                  <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
                    {project.units_count} {t.availableUnits}
                  </span>
                </div>
              </div>

              <button style={{
                width: '100%',
                background: 'linear-gradient(135deg, #003DA6 0%, #001A70 100%)',
                color: '#fff',
                border: 'none',
                padding: '12px 24px',
                borderRadius: 999,
                fontFamily: 'var(--font-title)',
                fontWeight: 700,
                fontSize: '0.88rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 15px rgba(0,61,166,0.2)',
              }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 6px 20px rgba(0,61,166,0.3)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 15px rgba(0,61,166,0.2)'; }}
              >
                {t.exploreBuildings}
                <Arrow size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  /* ─── STEP 2: Building Selector (3D Tower Cards) ─── */
  const renderBuildingSelector = () => (
    <div style={{ animation: 'us3d-fadeSlideUp 0.6s cubic-bezier(0.16,1,0.3,1) forwards' }}>
      <div style={{ textAlign: 'center', marginBottom: 48 }}>
        <h2 style={{
          fontFamily: 'var(--font-title)', fontSize: '2rem', fontWeight: 800,
          color: '#0f172a', marginBottom: 8,
        }}>
          {t.selectBuilding}
        </h2>
        <p style={{ color: '#64748b', fontSize: '0.95rem' }}>{t.selectBuildingDesc}</p>
      </div>

      {/* 🗺️ Compound Master Plan Section */}
      {projectMedia?.project_image && (
        <div style={{
          background: 'rgba(255,255,255,0.85)',
          backdropFilter: 'blur(28px)',
          border: '1.5px solid rgba(0,61,166,0.08)',
          borderRadius: 24,
          padding: 24,
          marginBottom: 40,
          boxShadow: '0 20px 50px -15px rgba(0,15,61,0.05)',
          position: 'relative',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h3 style={{ fontFamily: 'var(--font-title)', fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                🗺️ {lang === 'ar' ? 'المخطط العام للكمبوند' : 'Compound Master Plan'}
              </h3>
              <p style={{ color: '#64748b', fontSize: '0.82rem', margin: '4px 0 0 0' }}>
                {lang === 'ar' ? 'تصفح المخطط العام للكمبوند بالكامل وتوزيع المباني' : 'Explore the overall compound layout and building distribution'}
              </p>
            </div>

          </div>

          {/* Master Plan Image */}
          <div style={{
            height: 320, width: '100%', borderRadius: 16, overflow: 'hidden',
            background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '1px solid rgba(0,61,166,0.05)',
          }}>
            <img
              src={projectMedia.project_image}
              alt="Master Plan"
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            />
          </div>
        </div>
      )}

      {buildings.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8' }}>
          <Building size={48} style={{ opacity: 0.3, marginBottom: 16 }} />
          <p>{t.noBuildings}</p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: `repeat(auto-fill, minmax(280px, 1fr))`,
          gap: 32,
          perspective: '1500px',
        }}>
          {buildings.map((building, idx) => {
            const availPct = building.total_units > 0 ? (building.available_units / building.total_units * 100) : 0;
            const model3D = building3DModels[building.name];
            const has3DModel = model3D?.status === 'completed' && model3D?.model_url;
            const is3DActive = active3DBuilding === building.name;
            return (
              <div
                key={building.name}
                onClick={() => handleSelectBuilding(building)}
                style={{
                  cursor: 'pointer',
                  animation: `us3d-towerRise 0.8s cubic-bezier(0.16,1,0.3,1) ${idx * 0.15}s both`,
                  transformStyle: 'preserve-3d',
                }}
                onMouseEnter={e => {
                  if (!is3DActive) {
                    (e.currentTarget as HTMLDivElement).style.transform = 'rotateY(-5deg) rotateX(3deg) translateY(-10px)';
                  }
                }}
                onMouseLeave={e => {
                  if (!is3DActive) {
                    (e.currentTarget as HTMLDivElement).style.transform = 'rotateY(0) rotateX(0) translateY(0)';
                  }
                }}
              >
                {/* 3D Tower Visualization */}
                <div style={{
                  background: 'rgba(255,255,255,0.85)',
                  backdropFilter: 'blur(28px)',
                  border: `1.5px solid ${is3DActive ? 'rgba(197,168,128,0.4)' : 'rgba(0,61,166,0.1)'}`,
                  borderRadius: 24,
                  overflow: 'hidden',
                  transition: 'all 0.5s cubic-bezier(0.25,1,0.5,1)',
                  boxShadow: is3DActive ? '0 20px 50px -15px rgba(197,168,128,0.2), 0 0 20px rgba(197,168,128,0.08)' : '0 20px 50px -15px rgba(0,15,61,0.08)',
                  position: 'relative',
                }}>

                  {/* 3D Model Badge */}
                  {model3D && (
                    <div style={{
                      position: 'absolute', top: 12, [lang === 'ar' ? 'left' : 'right']: 12, zIndex: 10,
                      display: 'flex', gap: 6, alignItems: 'center',
                    }}>
                      {model3D.status === 'completed' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActive3DBuilding(is3DActive ? null : building.name);
                          }}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 6,
                            padding: '6px 14px', borderRadius: 999,
                            background: is3DActive
                              ? 'linear-gradient(135deg, #C5A880, #a08960)'
                              : 'linear-gradient(135deg, rgba(0,61,166,0.9), rgba(0,26,112,0.9))',
                            color: '#fff', border: 'none', cursor: 'pointer',
                            fontSize: '0.72rem', fontWeight: 700,
                            fontFamily: 'var(--font-title)',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                            transition: 'all 0.3s ease',
                            backdropFilter: 'blur(10px)',
                          }}
                        >
                          <span style={{ fontSize: '0.85rem' }}>{is3DActive ? '🖼️' : '🧊'}</span>
                          {is3DActive ? t.viewImage : t.view3D}
                        </button>
                      )}
                      {model3D.status === 'processing' && (
                        <span style={{
                          display: 'flex', alignItems: 'center', gap: 6,
                          padding: '5px 12px', borderRadius: 999,
                          background: 'rgba(245,158,11,0.9)', color: '#fff',
                          fontSize: '0.68rem', fontWeight: 700,
                          animation: 'us3d-pulse 2s ease-in-out infinite',
                        }}>
                          <Loader size={12} style={{ animation: 'spin 1s linear infinite' }} />
                          {t.model3DProcessing}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Building Image Header OR 3D Model Viewer */}
                  {is3DActive && has3DModel ? (
                    <div
                      style={{
                        height: 340, width: '100%', position: 'relative',
                        borderBottom: '1px solid rgba(197,168,128,0.2)',
                        background: 'linear-gradient(135deg, #f0f4f8 0%, #e8ecf0 100%)',
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {/* @ts-ignore — model-viewer is a web component */}
                      <model-viewer
                        src={model3D.model_url}
                        camera-controls
                        auto-rotate
                        shadow-intensity="1"
                        exposure="1.2"
                        environment-image="neutral"
                        style={{
                          width: '100%', height: '100%',
                          borderRadius: '24px 24px 0 0',
                          '--poster-color': 'transparent',
                        } as any}
                      />
                      {/* Maximize button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setFullscreenModelUrl(model3D.model_url);
                          setFullscreenModelTitle(building.name);
                        }}
                        style={{
                          position: 'absolute', top: 12, left: lang === 'ar' ? 12 : 'auto', right: lang === 'ar' ? 'auto' : 12,
                          background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(10px)',
                          border: '1px solid rgba(0,61,166,0.1)', cursor: 'pointer',
                          width: '32px', height: '32px', borderRadius: '50%',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: '#003DA6', zIndex: 10,
                          boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
                          transition: 'all 0.3s ease'
                        }}
                        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
                        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                      >
                        <Maximize size={14} />
                      </button>
                      {/* Interaction hint */}
                      <div style={{
                        position: 'absolute', bottom: 8, left: '50%', transform: 'translateX(-50%)',
                        padding: '4px 14px', borderRadius: 999,
                        background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)',
                        color: '#fff', fontSize: '0.65rem', fontWeight: 600,
                        whiteSpace: 'nowrap', pointerEvents: 'none',
                        opacity: 0.8,
                      }}>
                        {t.interactHint}
                      </div>
                    </div>
                  ) : projectMedia?.building_images?.[building.name]?.image_url ? (
                    <div style={{ height: 160, width: '100%', overflow: 'hidden', position: 'relative', borderBottom: '1px solid rgba(0,61,166,0.08)', backgroundColor: '#f8fafc' }}>
                      <img
                        src={projectMedia.building_images[building.name].image_url}
                        alt={building.name}
                        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                      />
                      <div style={{
                        position: 'absolute', bottom: 0, left: 0, right: 0,
                        height: '40px', background: 'linear-gradient(to top, rgba(255,255,255,0.85), transparent)'
                      }} />
                    </div>
                  ) : (
                    /* Top accent */
                    <div style={{
                      height: 5,
                      background: `linear-gradient(90deg, #003DA6, #C5A880)`,
                    }} />
                  )}

                  {/* Tower floors visualization */}
                  <div style={{
                    padding: '24px 20px 16px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 3,
                    perspective: '800px',
                  }}>
                    {/* Tower top / roof */}
                    <div style={{
                      width: '70%',
                      height: 12,
                      background: 'linear-gradient(135deg, #003DA6, #001A70)',
                      borderRadius: '8px 8px 0 0',
                      transform: 'rotateX(15deg)',
                      boxShadow: '0 -4px 8px rgba(0,61,166,0.15)',
                    }} />

                    {/* Floor layers */}
                    {building.floors.slice().reverse().slice(0, 8).map((floor, fi) => {
                      const pct = floor.total_units > 0 ? floor.available_units / floor.total_units : 0;
                      return (
                        <div key={floor.floor} style={{
                          width: '70%',
                          height: 16,
                          background: pct === 0
                            ? 'linear-gradient(135deg, rgba(239,68,68,0.12), rgba(239,68,68,0.2))'
                            : pct === 1
                              ? 'linear-gradient(135deg, rgba(34,197,94,0.12), rgba(34,197,94,0.2))'
                              : 'linear-gradient(135deg, rgba(245,158,11,0.12), rgba(245,158,11,0.2))',
                          border: `1px solid ${pct === 0 ? 'rgba(239,68,68,0.25)' : pct === 1 ? 'rgba(34,197,94,0.25)' : 'rgba(245,158,11,0.25)'}`,
                          transform: `rotateX(8deg) translateZ(${fi * 2}px)`,
                          transition: 'all 0.4s ease',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.6rem',
                          fontWeight: 700,
                          color: '#64748b',
                          position: 'relative',
                        }}>
                          {/* Windows */}
                          <div style={{ display: 'flex', gap: 4 }}>
                            {Array.from({ length: Math.min(floor.total_units, 5) }).map((_, wi) => (
                              <div key={wi} style={{
                                width: 8, height: 8,
                                borderRadius: 2,
                                background: wi < floor.available_units
                                  ? 'rgba(34,197,94,0.5)'
                                  : 'rgba(148,163,184,0.3)',
                                border: '0.5px solid rgba(0,0,0,0.06)',
                              }} />
                            ))}
                          </div>
                        </div>
                      );
                    })}
                    {building.total_floors > 8 && (
                      <div style={{
                        fontSize: '0.7rem', color: '#94a3b8', fontWeight: 600, padding: '4px 0',
                      }}>
                        +{building.total_floors - 8} {t.floors}
                      </div>
                    )}

                    {/* Base / ground */}
                    <div style={{
                      width: '80%',
                      height: 8,
                      background: 'linear-gradient(to bottom, #e2e8f0, #cbd5e1)',
                      borderRadius: '0 0 4px 4px',
                      transform: 'rotateX(8deg)',
                    }} />
                  </div>

                  {/* Info section */}
                  <div style={{ padding: '0 24px 24px' }}>
                    <h3 style={{
                      fontFamily: 'var(--font-title)',
                      fontSize: '1.2rem', fontWeight: 700,
                      color: '#0f172a',
                      textAlign: 'center',
                      marginBottom: 16,
                    }}>
                      {building.name}
                    </h3>

                    <div style={{
                      display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8,
                      marginBottom: 16,
                    }}>
                      {[
                        { label: t.totalFloors, value: building.total_floors, icon: <Layers size={14} /> },
                        { label: t.totalUnits, value: building.total_units, icon: <Square size={14} /> },
                        { label: t.availableUnits, value: building.available_units, icon: <CheckCircle size={14} /> },
                      ].map((stat, si) => (
                        <div key={si} style={{
                          background: 'rgba(0,61,166,0.04)',
                          borderRadius: 12,
                          padding: '10px 8px',
                          textAlign: 'center',
                        }}>
                          <div style={{ color: '#003DA6', marginBottom: 4, display: 'flex', justifyContent: 'center' }}>{stat.icon}</div>
                          <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>{stat.value}</div>
                          <div style={{ fontSize: '0.65rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase' }}>{stat.label}</div>
                        </div>
                      ))}
                    </div>

                    {/* Availability bar */}
                    <div style={{
                      width: '100%', height: 6, background: 'rgba(0,0,0,0.06)', borderRadius: 999,
                      overflow: 'hidden', marginBottom: 4,
                    }}>
                      <div style={{
                        width: `${availPct}%`, height: '100%',
                        background: availPct > 50 ? 'linear-gradient(90deg, #22c55e, #16a34a)' : availPct > 20 ? 'linear-gradient(90deg, #f59e0b, #d97706)' : 'linear-gradient(90deg, #ef4444, #dc2626)',
                        borderRadius: 999,
                        transition: 'width 1s cubic-bezier(0.16,1,0.3,1)',
                      }} />
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#94a3b8', textAlign: 'center', fontWeight: 600 }}>
                      {Math.round(availPct)}% {t.available}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  /* ─── STEP 3: Floor Selector (Stacked Layers) ─── */
  const renderFloorSelector = () => {
    if (!selectedBuilding) return null;
    const reversedFloors = [...selectedBuilding.floors].reverse();

    return (
      <div style={{ animation: 'us3d-fadeSlideUp 0.6s cubic-bezier(0.16,1,0.3,1) forwards' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <h2 style={{
            fontFamily: 'var(--font-title)', fontSize: '2rem', fontWeight: 800,
            color: '#0f172a', marginBottom: 8,
          }}>
            {selectedBuilding.name} — {t.selectFloor}
          </h2>
          <p style={{ color: '#64748b', fontSize: '0.95rem' }}>{t.selectFloorDesc}</p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: '1.2fr 1fr',
          gap: 40,
          maxWidth: 1150,
          margin: '0 auto',
          alignItems: 'start',
        }}>
          {/* Left Column: Stacked Floors */}
          <div style={{
            perspective: '1200px',
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
            alignItems: 'center',
            width: '100%',
          }}>
            {/* Roof */}
            <div style={{
              width: '85%', height: 20,
              background: 'linear-gradient(135deg, #003DA6, #001A70)',
              borderRadius: '12px 12px 0 0',
              transform: 'rotateX(12deg)',
              boxShadow: '0 -6px 12px rgba(0,61,166,0.15)',
              position: 'relative',
              zIndex: reversedFloors.length + 2,
            }} />

            {reversedFloors.map((floor, idx) => (
              <div
                key={floor.floor}
                onClick={() => floor.available_units > 0 ? handleSelectFloor(floor) : null}
                style={{
                  width: '85%',
                  padding: '16px 24px',
                  background: getFloorAvailabilityColor(floor),
                  border: `1.5px solid ${getFloorBorderColor(floor)}`,
                  borderRadius: 4,
                  cursor: floor.available_units > 0 ? 'pointer' : 'default',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  transition: 'all 0.4s cubic-bezier(0.25,1,0.5,1)',
                  transform: `rotateX(6deg) translateZ(${idx}px)`,
                  transformStyle: 'preserve-3d',
                  position: 'relative',
                  zIndex: reversedFloors.length - idx,
                  opacity: floor.available_units > 0 ? 1 : 0.6,
                  animation: `us3d-floorSlide 0.5s cubic-bezier(0.16,1,0.3,1) ${idx * 0.06}s both`,
                }}
                onMouseEnter={e => {
                  setHoveredFloor(floor);
                  if (floor.available_units > 0) {
                    (e.currentTarget as HTMLDivElement).style.transform = 'rotateX(0deg) translateY(-4px) scale(1.02)';
                    (e.currentTarget as HTMLDivElement).style.boxShadow = '0 8px 25px -5px rgba(0,61,166,0.12)';
                    (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.85)';
                    (e.currentTarget as HTMLDivElement).style.borderColor = '#003DA6';
                  }
                }}
                onMouseLeave={e => {
                  setHoveredFloor(null);
                  (e.currentTarget as HTMLDivElement).style.transform = `rotateX(6deg) translateZ(${idx}px)`;
                  (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
                  (e.currentTarget as HTMLDivElement).style.background = getFloorAvailabilityColor(floor);
                  (e.currentTarget as HTMLDivElement).style.borderColor = getFloorBorderColor(floor);
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 36, height: 36,
                    borderRadius: 10,
                    background: floor.available_units > 0 ? 'rgba(0,61,166,0.1)' : 'rgba(148,163,184,0.15)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 800, fontSize: '0.85rem',
                    color: floor.available_units > 0 ? '#003DA6' : '#94a3b8',
                    fontFamily: 'var(--font-title)',
                  }}>
                    {floor.floor}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#0f172a', fontFamily: 'var(--font-title)' }}>
                      {t.floor} {floor.floor}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                      {floor.available_units}/{floor.total_units} {t.availableUnits}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ display: 'flex', gap: 3 }}>
                    {floor.units.slice(0, 6).map((u, ui) => (
                      <div key={ui} style={{
                        width: 10, height: 10, borderRadius: 3,
                        background: getStatusColor(u.status),
                        opacity: 0.7,
                        border: '0.5px solid rgba(0,0,0,0.1)',
                      }} />
                    ))}
                    {floor.total_units > 6 && (
                      <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 600 }}>+{floor.total_units - 6}</span>
                    )}
                  </div>
                  {floor.available_units > 0 && <Chevron size={16} style={{ color: '#003DA6' }} />}
                </div>
              </div>
            ))}

            {/* Ground / Base */}
            <div style={{
              width: '92%', height: 12,
              background: 'linear-gradient(to bottom, #cbd5e1, #94a3b8)',
              borderRadius: '0 0 8px 8px',
              transform: 'rotateX(6deg)',
            }} />
          </div>

          {/* Right Column: Interactive Floor Map View */}
          <div style={{
            background: 'rgba(255,255,255,0.85)',
            backdropFilter: 'blur(28px)',
            border: '1.5px solid rgba(0,61,166,0.1)',
            borderRadius: 24,
            padding: '28px 24px',
            boxShadow: '0 20px 50px -15px rgba(0,15,61,0.08)',
            position: 'sticky',
            top: '100px',
            minHeight: '400px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            width: '100%',
            boxSizing: 'border-box',
          }}>
            {(() => {
              const targetFloor = hoveredFloor || (reversedFloors.length > 0 ? reversedFloors[0] : null);
              if (!targetFloor) return null;
              const refKey = `${selectedBuilding.name}|${targetFloor.floor}`;
              const fImage = projectMedia?.floor_plan_images?.[refKey]?.image_url;

              return (
                <div style={{ width: '100%' }}>
                  <div style={{ marginBottom: '16px', textAlign: 'center' }}>
                    <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#003DA6', margin: 0, fontFamily: 'var(--font-title)' }}>
                      {lang === 'ar' ? 'مخطط الدور' : 'Floor Layout Map'} — {t.floor} {targetFloor.floor}
                    </h4>
                    <p style={{ fontSize: '0.78rem', color: '#64748b', margin: '4px 0 0 0' }}>
                      {targetFloor.available_units} {t.availableUnits} / {targetFloor.total_units} {lang === 'ar' ? 'وحدة إجمالية' : 'total units'}
                    </p>
                  </div>

                  {fImage ? (
                    <div style={{
                      background: '#fff', borderRadius: '16px', padding: '16px',
                      border: '1.5px solid rgba(0,61,166,0.08)', display: 'flex', justifyContent: 'center', alignItems: 'center',
                      overflow: 'hidden', minHeight: '260px'
                    }}>
                      <img
                        src={fImage}
                        alt={`Floor ${targetFloor.floor} Layout`}
                        style={{ width: '100%', maxHeight: '280px', objectFit: 'contain', transition: 'transform 0.3s ease' }}
                      />
                    </div>
                  ) : (
                    <div style={{
                      minHeight: '260px', background: 'rgba(0,0,0,0.02)', borderRadius: '16px',
                      border: '1.5px dashed rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column',
                      justifyContent: 'center', alignItems: 'center', padding: '24px', color: '#94a3b8'
                    }}>
                      <Layers size={48} style={{ opacity: 0.3, marginBottom: '12px' }} />
                      <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                        {lang === 'ar' ? 'لم يتم رفع صورة كروكي لهذا الدور بعد' : 'No floor plan layout uploaded yet'}
                      </span>
                      <span style={{ fontSize: '0.72rem', color: '#cbd5e1', marginTop: '4px', textAlign: 'center' }}>
                        {lang === 'ar' ? 'مرر الماوس فوق الأدوار الأخرى للاستكشاف' : 'Hover over other floors to explore'}
                      </span>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        </div>

        {/* Legend */}
        <div style={{
          display: 'flex', justifyContent: 'center', gap: 24, marginTop: 32,
          flexWrap: 'wrap',
        }}>
          {[
            { color: 'rgba(34,197,94,0.5)', label: t.available },
            { color: 'rgba(245,158,11,0.5)', label: `${t.reserved} / Partial` },
            { color: 'rgba(239,68,68,0.5)', label: t.sold },
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 12, height: 12, borderRadius: 3, background: item.color }} />
              <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  /* ─── STEP 4: Unit Grid ─── */
  const renderUnitGrid = () => {
    if (!selectedFloor) return null;
    return (
      <div style={{ animation: 'us3d-fadeSlideUp 0.6s cubic-bezier(0.16,1,0.3,1) forwards' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <h2 style={{
            fontFamily: 'var(--font-title)', fontSize: '2rem', fontWeight: 800,
            color: '#0f172a', marginBottom: 8,
          }}>
            {selectedBuilding?.name} — {t.floor} {selectedFloor.floor}
          </h2>
          <p style={{ color: '#64748b', fontSize: '0.95rem' }}>{t.selectUnitDesc}</p>
        </div>

        {selectedFloor.units.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8' }}>
            <Square size={48} style={{ opacity: 0.3, marginBottom: 16 }} />
            <p>{t.noUnits}</p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: 16,
            perspective: '1000px',
          }}>
            {selectedFloor.units.map((unit, idx) => {
              const isAvailable = unit.status === 'available';
              const statusColor = getStatusColor(unit.status);
              return (
                <div
                  key={unit.id}
                  onClick={() => handleSelectUnit(unit)}
                  style={{
                    background: isAvailable
                      ? 'rgba(255,255,255,0.9)'
                      : 'rgba(255,255,255,0.5)',
                    backdropFilter: 'blur(20px)',
                    border: `2px solid ${isAvailable ? 'rgba(34,197,94,0.3)' : `${statusColor}33`}`,
                    borderRadius: 18,
                    padding: '20px 18px',
                    cursor: isAvailable ? 'pointer' : 'default',
                    transition: 'all 0.4s cubic-bezier(0.25,1,0.5,1)',
                    animation: `us3d-cardAppear 0.5s cubic-bezier(0.16,1,0.3,1) ${idx * 0.05}s both`,
                    position: 'relative',
                    overflow: 'hidden',
                    opacity: isAvailable ? 1 : 0.65,
                  }}
                  onMouseEnter={e => {
                    if (isAvailable) {
                      (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-6px) scale(1.03)';
                      (e.currentTarget as HTMLDivElement).style.borderColor = '#22c55e';
                      (e.currentTarget as HTMLDivElement).style.boxShadow = '0 15px 35px -10px rgba(34,197,94,0.2), 0 0 20px rgba(34,197,94,0.08)';
                    }
                  }}
                  onMouseLeave={e => {
                    if (isAvailable) {
                      (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0) scale(1)';
                      (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(34,197,94,0.3)';
                      (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
                    }
                  }}
                >
                  {/* Status dot */}
                  <div style={{
                    position: 'absolute', top: 14, right: lang === 'ar' ? 'auto' : 14, left: lang === 'ar' ? 14 : 'auto',
                    display: 'flex', alignItems: 'center', gap: 6,
                  }}>
                    <div style={{
                      width: 10, height: 10, borderRadius: '50%',
                      background: statusColor,
                      boxShadow: isAvailable ? `0 0 8px ${statusColor}80` : 'none',
                      animation: isAvailable ? 'us3d-pulse 2s infinite' : 'none',
                    }} />
                  </div>

                  {/* Unit number */}
                  <div style={{
                    fontSize: '1.5rem', fontWeight: 800,
                    color: isAvailable ? '#003DA6' : '#94a3b8',
                    fontFamily: 'var(--font-title)',
                    marginBottom: 8,
                  }}>
                    {unit.unit_number}
                  </div>

                  {/* Type badge */}
                  <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                    padding: '3px 10px', borderRadius: 999,
                    background: 'rgba(0,61,166,0.06)',
                    fontSize: '0.7rem', fontWeight: 700,
                    color: '#003DA6',
                    marginBottom: 12,
                    textTransform: 'uppercase',
                  }}>
                    {getTypeLabel(unit.type)}
                  </div>

                  {/* Quick stats */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {unit.area && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', color: '#475569' }}>
                        <Maximize size={12} style={{ color: '#C5A880' }} />
                        <span>{unit.area} {t.sqm}</span>
                      </div>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', color: '#475569' }}>
                      <DollarSign size={12} style={{ color: '#C5A880' }} />
                      <span style={{ fontWeight: 700 }}>{formatPrice(unit.price)} {t.egp}</span>
                    </div>
                    {unit.bedrooms !== null && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', color: '#475569' }}>
                        <Home size={12} style={{ color: '#C5A880' }} />
                        <span>{unit.bedrooms} {t.bedrooms}</span>
                      </div>
                    )}
                  </div>

                  {/* Status label */}
                  <div style={{
                    marginTop: 14,
                    padding: '6px 14px',
                    borderRadius: 999,
                    background: `${statusColor}15`,
                    color: statusColor,
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    textAlign: 'center',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}>
                    {isAvailable ? (
                      <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                        <CheckCircle size={12} /> {getStatusLabel(unit.status)}
                      </span>
                    ) : (
                      <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                        <Lock size={12} /> {getStatusLabel(unit.status)}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Legend */}
        <div style={{
          display: 'flex', justifyContent: 'center', gap: 20, marginTop: 32, flexWrap: 'wrap',
        }}>
          {[
            { color: '#22c55e', label: t.available },
            { color: '#f59e0b', label: t.reserved },
            { color: '#ef4444', label: t.sold },
            { color: '#94a3b8', label: t.comingSoon },
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: item.color }} />
              <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  /* ─── Unit Detail Side Panel ─── */
  const renderUnitPanel = () => {
    if (!selectedUnit || !showUnitPanel) return null;
    return (
      <div style={{
        position: 'fixed',
        top: 0, right: lang === 'ar' ? 'auto' : 0, left: lang === 'ar' ? 0 : 'auto',
        width: '100%', maxWidth: 440, height: '100vh',
        background: 'rgba(255,255,255,0.92)',
        backdropFilter: 'blur(30px)',
        borderLeft: lang === 'ar' ? 'none' : '1.5px solid rgba(0,61,166,0.1)',
        borderRight: lang === 'ar' ? '1.5px solid rgba(0,61,166,0.1)' : 'none',
        boxShadow: '-20px 0 60px rgba(0,15,61,0.08)',
        zIndex: 1000,
        overflowY: 'auto',
        animation: lang === 'ar' ? 'us3d-slidePanelRTL 0.5s cubic-bezier(0.16,1,0.3,1) forwards' : 'us3d-slidePanelLTR 0.5s cubic-bezier(0.16,1,0.3,1) forwards',
        padding: '32px 28px',
      }}>
        {/* Close button */}
        <button onClick={() => { setShowUnitPanel(false); setSelectedUnit(null); }} style={{
          position: 'absolute', top: 20, right: lang === 'ar' ? 'auto' : 20, left: lang === 'ar' ? 20 : 'auto',
          background: 'rgba(0,0,0,0.04)',
          border: 'none', borderRadius: '50%', width: 36, height: 36,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', color: '#64748b',
          transition: 'all 0.3s ease',
        }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(239,68,68,0.1)'; (e.currentTarget as HTMLButtonElement).style.color = '#ef4444'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(0,0,0,0.04)'; (e.currentTarget as HTMLButtonElement).style.color = '#64748b'; }}
        >
          <X size={18} />
        </button>

        {/* Unit number hero */}
        <div style={{ marginBottom: 28, paddingTop: 8 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '4px 12px', borderRadius: 999,
            background: `${getStatusColor(selectedUnit.status)}15`,
            marginBottom: 12,
          }}>
            <div style={{
              width: 8, height: 8, borderRadius: '50%',
              background: getStatusColor(selectedUnit.status),
            }} />
            <span style={{
              fontSize: '0.72rem', fontWeight: 800,
              color: getStatusColor(selectedUnit.status),
              textTransform: 'uppercase',
            }}>
              {getStatusLabel(selectedUnit.status)}
            </span>
          </div>

          <h2 style={{
            fontFamily: 'var(--font-title)',
            fontSize: '2rem', fontWeight: 800,
            color: '#0f172a', marginBottom: 4,
          }}>
            {t.unit} {selectedUnit.unit_number}
          </h2>
          <p style={{ fontSize: '0.9rem', color: '#64748b' }}>
            {selectedBuilding?.name} — {t.floor} {selectedUnit.floor}
          </p>
        </div>

        {/* Price card */}
        <div style={{
          background: 'linear-gradient(135deg, #003DA6, #001A70)',
          borderRadius: 18,
          padding: '24px 22px',
          marginBottom: 24,
          color: '#fff',
        }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, opacity: 0.7, marginBottom: 4, textTransform: 'uppercase' }}>
            {t.price}
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, fontFamily: 'var(--font-title)' }}>
            {formatPrice(selectedUnit.price)} <span style={{ fontSize: '0.9rem', opacity: 0.8 }}>{t.egp}</span>
          </div>
        </div>

        {/* Unit Layout Image or 3D Model */}
        {(selectedUnit.layout_image_url || selectedUnit.model_3d_status === 'completed') && (
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
                {lang === 'ar' ? 'تصميم الوحدة' : 'Apartment Plan'}
              </span>
              
              {/* 3D Model Toggle for Unit */}
              {selectedUnit.model_3d_status === 'completed' && selectedUnit.layout_image_url && (
                <button
                  type="button"
                  onClick={() => setUnitView3D(!unitView3D)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 4,
                    padding: '4px 10px', borderRadius: 999,
                    background: unitView3D
                      ? 'linear-gradient(135deg, #C5A880, #a08960)'
                      : 'linear-gradient(135deg, rgba(0,61,166,0.9), rgba(0,26,112,0.9))',
                    color: '#fff', border: 'none', cursor: 'pointer',
                    fontSize: '0.68rem', fontWeight: 700,
                    boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
                  }}
                >
                  <span>{unitView3D ? '🖼️' : '🧊'}</span>
                  {unitView3D ? t.viewImage : t.view3D}
                </button>
              )}
            </div>

            {unitView3D && selectedUnit.model_3d_status === 'completed' ? (
              <div style={{
                height: 280, width: '100%', position: 'relative',
                borderRadius: 14, overflow: 'hidden',
                background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                border: '1px solid rgba(197,168,128,0.35)',
              }}>
                {/* @ts-ignore */}
                <model-viewer
                  src={`${(import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api').endsWith('/v1') ? (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api').substring(0, (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api').length - 7) : ((import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api').endsWith('/api') ? (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api').substring(0, (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api').length - 4) : (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'))}/api/v1/public/units/${selectedUnit.id}/3d-model/file`}
                  camera-controls
                  auto-rotate
                  shadow-intensity="2.0"
                  exposure="1.2"
                  environment-image="neutral"
                  style={{ width: '100%', height: '100%', '--poster-color': 'transparent' } as any}
                />
                {/* Maximize button */}
                <button
                  type="button"
                  onClick={() => {
                    const baseUrl = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api');
                    const normalizedBase = baseUrl.endsWith('/v1') 
                      ? baseUrl.substring(0, baseUrl.length - 7) 
                      : (baseUrl.endsWith('/api') ? baseUrl.substring(0, baseUrl.length - 4) : baseUrl);
                    setFullscreenModelUrl(`${normalizedBase}/api/v1/public/units/${selectedUnit.id}/3d-model/file`);
                    setFullscreenModelTitle(`${lang === 'ar' ? 'الوحدة' : 'Unit'} ${selectedUnit.unit_number}`);
                  }}
                  style={{
                    position: 'absolute', top: 12, left: lang === 'ar' ? 12 : 'auto', right: lang === 'ar' ? 'auto' : 12,
                    background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(0,61,166,0.1)', cursor: 'pointer',
                    width: '32px', height: '32px', borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#003DA6', zIndex: 10,
                    boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                >
                  <Maximize size={14} />
                </button>
                <div style={{
                  position: 'absolute', bottom: 8, left: '50%', transform: 'translateX(-50%)',
                  padding: '2px 10px', borderRadius: 999,
                  background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)',
                  color: '#fff', fontSize: '0.65rem', fontWeight: 600,
                  whiteSpace: 'nowrap', pointerEvents: 'none',
                  opacity: 0.8,
                }}>
                  {t.interactHint}
                </div>
              </div>
            ) : selectedUnit.layout_image_url ? (() => {
              const imgUrl = selectedUnit.layout_image_url;
              return (
                <div style={{
                  background: '#fff', borderRadius: 14, padding: 8,
                  border: '1px solid rgba(0,61,166,0.08)', overflow: 'hidden',
                  cursor: 'zoom-in'
                }}
                  onClick={() => window.open(imgUrl.startsWith('http') ? imgUrl : `http://127.0.0.1:8000/storage/${imgUrl}`, '_blank')}
                >
                  <img
                    src={imgUrl.startsWith('http') ? imgUrl : `http://127.0.0.1:8000/storage/${imgUrl}`}
                    alt={`Unit ${selectedUnit.unit_number} Layout`}
                    style={{ width: '100%', maxHeight: '180px', objectFit: 'contain' }}
                  />
                </div>
              );
            })() : null}
          </div>
        )}

        {/* Detail grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
          {[
            { icon: <Maximize size={18} />, label: t.area, value: selectedUnit.area ? `${selectedUnit.area} ${t.sqm}` : '—' },
            { icon: <Home size={18} />, label: t.type, value: getTypeLabel(selectedUnit.type) },
            { icon: <Eye size={18} />, label: t.view, value: getViewLabel(selectedUnit.view_type) },
            { icon: <Compass size={18} />, label: t.direction, value: getViewLabel(selectedUnit.view_type) },
            { icon: <Layers size={18} />, label: t.floorNumber, value: `${selectedUnit.floor}` },
            { icon: <Hash size={18} />, label: t.unitNumber, value: selectedUnit.unit_number },
          ].map((item, i) => (
            <div key={i} style={{
              background: 'rgba(0,61,166,0.03)',
              borderRadius: 14,
              padding: '14px 16px',
              border: '1px solid rgba(0,61,166,0.06)',
            }}>
              <div style={{ color: '#C5A880', marginBottom: 6 }}>{item.icon}</div>
              <div style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', marginBottom: 2 }}>
                {item.label}
              </div>
              <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a' }}>
                {item.value}
              </div>
            </div>
          ))}
        </div>

        {/* Bedrooms / Bathrooms */}
        <div style={{
          display: 'flex', gap: 12, marginBottom: 28,
        }}>
          {selectedUnit.bedrooms !== null && (
            <div style={{
              flex: 1,
              background: 'rgba(0,61,166,0.03)',
              borderRadius: 14,
              padding: '14px 16px',
              textAlign: 'center',
              border: '1px solid rgba(0,61,166,0.06)',
            }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#003DA6' }}>{selectedUnit.bedrooms}</div>
              <div style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>{t.bedrooms}</div>
            </div>
          )}
          {selectedUnit.bathrooms !== null && (
            <div style={{
              flex: 1,
              background: 'rgba(0,61,166,0.03)',
              borderRadius: 14,
              padding: '14px 16px',
              textAlign: 'center',
              border: '1px solid rgba(0,61,166,0.06)',
            }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#003DA6' }}>{selectedUnit.bathrooms}</div>
              <div style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>{t.bathrooms}</div>
            </div>
          )}
        </div>

        {/* Reserve button */}
        {selectedUnit.status === 'available' && (
          <button onClick={openReserveModal} style={{
            width: '100%',
            background: 'linear-gradient(135deg, #22c55e, #16a34a)',
            color: '#fff',
            border: 'none',
            padding: '16px 24px',
            borderRadius: 999,
            fontFamily: 'var(--font-title)',
            fontWeight: 700,
            fontSize: '1rem',
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            boxShadow: '0 6px 20px rgba(34,197,94,0.3)',
            transition: 'all 0.3s ease',
          }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)';
              (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 8px 25px rgba(34,197,94,0.4)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
              (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 6px 20px rgba(34,197,94,0.3)';
            }}
          >
            <Shield size={18} />
            {t.reserveUnit}
          </button>
        )}
      </div>
    );
  };

  /* ─── Reservation Modal ─── */
  const renderReserveModal = () => {
    if (!showReserveModal || !selectedUnit) return null;

    const inputStyle = {
      width: '100%',
      padding: '12px 16px',
      borderRadius: '12px',
      border: '1.5px solid rgba(0, 61, 166, 0.12)',
      fontSize: '0.9rem',
      color: '#0f172a',
      background: '#fff',
      outline: 'none',
      transition: 'all 0.3s ease',
      boxSizing: 'border-box' as const,
    };

    const labelStyle = {
      display: 'block',
      fontSize: '0.78rem',
      fontWeight: 800,
      color: '#1e293b',
      marginBottom: 8,
    };

    return (
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(0,15,61,0.4)',
        backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 2000,
        animation: 'us3d-modalFade 0.3s ease forwards',
        padding: 16,
      }}
        onClick={e => { if (e.target === e.currentTarget && !reserveProcessing) { setShowReserveModal(false); } }}
      >
        <div style={{
          background: 'rgba(255,255,255,0.95)',
          backdropFilter: 'blur(30px)',
          borderRadius: 28,
          padding: '36px 32px',
          maxWidth: 480, width: '100%',
          boxShadow: '0 30px 70px rgba(0,15,61,0.15), 0 0 0 1px rgba(255,255,255,0.4) inset',
          animation: 'us3d-modalSlideUp 0.45s cubic-bezier(0.34,1.56,0.64,1) forwards',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}>
          {/* Success State */}
          {reserveResult ? (
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: 80, height: 80, borderRadius: '50%',
                background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 24px',
                animation: 'us3d-successPop 0.6s cubic-bezier(0.34,1.56,0.64,1) forwards',
              }}>
                <CheckCircle size={40} style={{ color: '#fff' }} />
              </div>
              <h3 style={{
                fontFamily: 'var(--font-title)', fontSize: '1.5rem', fontWeight: 800,
                color: '#0f172a', marginBottom: 12,
              }}>
                {t.successTitle}
              </h3>
              <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: 24, lineHeight: 1.6 }}>
                {lang === 'en'
                  ? 'Your reservation request and receipt have been submitted successfully. An accountant will review your payment shortly to approve your queue number.'
                  : 'تم إرسال طلب الحجز وإيصال التحويل بنجاح. سيقوم المحاسب بمراجعة عملية الدفع قريباً لتأكيد رقم الأسبقية الخاص بك.'}
              </p>
              <div style={{
                fontSize: '1.15rem', fontWeight: 800, color: '#003DA6',
                fontFamily: 'var(--font-title)',
                padding: '12px 24px',
                background: 'rgba(0,61,166,0.05)',
                borderRadius: 16,
                display: 'inline-block',
                marginBottom: 28,
              }}>
                {lang === 'en' ? 'PENDING REVIEW' : 'قيد المراجعة'}
              </div>
              <button onClick={() => { setShowReserveModal(false); setShowUnitPanel(false); }} style={{
                width: '100%',
                background: 'linear-gradient(135deg, #003DA6, #001A70)',
                color: '#fff', border: 'none',
                padding: '14px 24px', borderRadius: 999,
                fontFamily: 'var(--font-title)', fontWeight: 700,
                fontSize: '0.95rem', cursor: 'pointer',
                boxShadow: '0 4px 15px rgba(0,61,166,0.2)',
              }}>
                {t.close}
              </button>
            </div>
          ) : (
            /* Form State */
            <form onSubmit={handleReserveSubmit}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 style={{
                  fontFamily: 'var(--font-title)', fontSize: '1.3rem', fontWeight: 800,
                  color: '#0f172a', margin: 0,
                }}>
                  {t.confirmReservation}
                </h3>
                {reserveStep === 2 && (
                  <button type="button" onClick={() => setReserveStep(1)} style={{ background: 'none', border: 'none', color: '#003DA6', fontSize: '0.8rem', fontWeight: 800, cursor: 'pointer' }}>
                    {lang === 'en' ? '← Back' : '← رجوع'}
                  </button>
                )}
              </div>

              {/* Unit summary */}
              <div style={{
                background: 'rgba(0,61,166,0.04)',
                borderRadius: 16, padding: '14px 18px',
                marginBottom: 20,
                border: '1px solid rgba(0,61,166,0.08)',
                display: 'flex', alignItems: 'center', gap: 16,
              }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 12,
                  background: 'linear-gradient(135deg, #003DA6, #001A70)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', fontWeight: 800, fontFamily: 'var(--font-title)',
                  flexShrink: 0
                }}>
                  {selectedUnit.unit_number}
                </div>
                <div>
                  <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.88rem' }}>
                    {selectedBuilding?.name} — {t.floor} {selectedUnit.floor}
                  </div>
                  <div style={{ color: '#64748b', fontSize: '0.78rem' }}>
                    {selectedUnit.area && `${selectedUnit.area} ${t.sqm} · `}{formatPrice(selectedUnit.price)} {t.egp}
                  </div>
                </div>
              </div>

              {/* STEP 1: Personal Info */}
              {reserveStep === 1 && (
                <div>
                  <h4 style={{ fontSize: '0.88rem', fontWeight: 800, textTransform: 'uppercase', color: '#003DA6', letterSpacing: '0.06em', borderBottom: '1px solid rgba(0, 61, 166, 0.08)', paddingBottom: 10, marginBottom: 20, fontFamily: 'var(--font-title)' }}>
                    {lang === 'en' ? '1. Personal Contact Info' : '1. البيانات الشخصية للاتصال'}
                  </h4>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                    <div>
                      <label style={labelStyle}>{t.firstName} *</label>
                      <input
                        style={inputStyle}
                        type="text"
                        required
                        value={reserveForm.first_name}
                        onChange={e => setReserveForm({ ...reserveForm, first_name: e.target.value })}
                        onFocus={e => { e.currentTarget.style.borderColor = '#003DA6'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(0,61,166,0.1)'; }}
                        onBlur={e => { e.currentTarget.style.borderColor = 'rgba(0,61,166,0.12)'; e.currentTarget.style.boxShadow = 'none'; }}
                      />
                    </div>
                    <div>
                      <label style={labelStyle}>{t.lastName} *</label>
                      <input
                        style={inputStyle}
                        type="text"
                        required
                        value={reserveForm.last_name}
                        onChange={e => setReserveForm({ ...reserveForm, last_name: e.target.value })}
                        onFocus={e => { e.currentTarget.style.borderColor = '#003DA6'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(0,61,166,0.1)'; }}
                        onBlur={e => { e.currentTarget.style.borderColor = 'rgba(0,61,166,0.12)'; e.currentTarget.style.boxShadow = 'none'; }}
                      />
                    </div>
                  </div>

                  <div style={{ marginBottom: 14 }}>
                    <label style={labelStyle}>{t.email} *</label>
                    <input
                      style={inputStyle}
                      type="email"
                      required
                      value={reserveForm.email}
                      onChange={e => setReserveForm({ ...reserveForm, email: e.target.value })}
                      onFocus={e => { e.currentTarget.style.borderColor = '#003DA6'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(0,61,166,0.1)'; }}
                      onBlur={e => { e.currentTarget.style.borderColor = 'rgba(0,61,166,0.12)'; e.currentTarget.style.boxShadow = 'none'; }}
                    />
                  </div>

                  <div style={{ marginBottom: 14 }}>
                    <label style={labelStyle}>{t.phone} *</label>
                    <input
                      style={inputStyle}
                      type="text"
                      required
                      placeholder="+201..."
                      value={reserveForm.phone}
                      onChange={e => setReserveForm({ ...reserveForm, phone: e.target.value })}
                      onFocus={e => { e.currentTarget.style.borderColor = '#003DA6'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(0,61,166,0.1)'; }}
                      onBlur={e => { e.currentTarget.style.borderColor = 'rgba(0,61,166,0.12)'; e.currentTarget.style.boxShadow = 'none'; }}
                    />
                  </div>

                  <div style={{ marginBottom: 24 }}>
                    <label style={labelStyle}>{t.nationalId}</label>
                    <input
                      style={inputStyle}
                      type="text"
                      placeholder="29001011234567"
                      value={reserveForm.national_id}
                      onChange={e => setReserveForm({ ...reserveForm, national_id: e.target.value })}
                      onFocus={e => { e.currentTarget.style.borderColor = '#003DA6'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(0,61,166,0.1)'; }}
                      onBlur={e => { e.currentTarget.style.borderColor = 'rgba(0,61,166,0.12)'; e.currentTarget.style.boxShadow = 'none'; }}
                    />
                  </div>

                  <button
                    type="submit"
                    style={{
                      width: '100%',
                      background: 'linear-gradient(135deg, #003DA6 0%, #001A70 100%)',
                      color: '#fff',
                      border: 'none',
                      padding: '14px 24px',
                      borderRadius: 999,
                      fontFamily: 'var(--font-title)',
                      fontWeight: 700,
                      fontSize: '0.95rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      transition: 'all 0.3s ease',
                      boxShadow: '0 4px 15px rgba(0,61,166,0.2)',
                    }}
                  >
                    {lang === 'en' ? 'Continue to Payment' : 'المتابعة إلى الدفع'}
                    <Arrow size={16} />
                  </button>
                </div>
              )}

              {/* STEP 2: Location, Method, and File Uploads */}
              {reserveStep === 2 && (
                <div>
                  <h4 style={{ fontSize: '0.88rem', fontWeight: 800, textTransform: 'uppercase', color: '#003DA6', letterSpacing: '0.06em', borderBottom: '1px solid rgba(0, 61, 166, 0.08)', paddingBottom: 10, marginBottom: 20, fontFamily: 'var(--font-title)' }}>
                    {lang === 'en' ? '2. Confirm Payment & Upload Documents' : '2. تأكيد الدفع ورفع الملفات'}
                  </h4>

                  {/* Location Selection */}
                  <div style={{ marginBottom: 16 }}>
                    <label style={labelStyle}>{t.eoiLocationLabel} *</label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      <button
                        type="button"
                        onClick={() => {
                          setClientLocation('inside_egypt');
                          setPaymentMethod('bank_transfer');
                        }}
                        style={{
                          padding: '12px',
                          borderRadius: '10px',
                          border: `2px solid ${clientLocation === 'inside_egypt' ? '#003DA6' : 'rgba(0,61,166,0.1)'}`,
                          background: clientLocation === 'inside_egypt' ? 'rgba(0,61,166,0.03)' : '#fff',
                          color: '#1e293b',
                          fontSize: '0.8rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                        }}
                      >
                        {t.eoiLocationInside}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setClientLocation('outside_egypt');
                          setPaymentMethod('international_bank_transfer');
                        }}
                        style={{
                          padding: '12px',
                          borderRadius: '10px',
                          border: `2px solid ${clientLocation === 'outside_egypt' ? '#003DA6' : 'rgba(0,61,166,0.1)'}`,
                          background: clientLocation === 'outside_egypt' ? 'rgba(0,61,166,0.03)' : '#fff',
                          color: '#1e293b',
                          fontSize: '0.8rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                        }}
                      >
                        {t.eoiLocationOutside}
                      </button>
                    </div>
                  </div>

                  {/* Payment Method Selection */}
                  {clientLocation === 'inside_egypt' && (
                    <div style={{ marginBottom: 16 }}>
                      <label style={labelStyle}>{t.eoiPaymentMethodLabel} *</label>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <button
                          type="button"
                          onClick={() => setPaymentMethod('bank_transfer')}
                          style={{
                            padding: '10px',
                            borderRadius: '8px',
                            border: `2px solid ${paymentMethod === 'bank_transfer' ? '#003DA6' : 'rgba(0,61,166,0.08)'}`,
                            background: paymentMethod === 'bank_transfer' ? 'rgba(0,61,166,0.02)' : '#fff',
                            color: '#1e293b',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                          }}
                        >
                          {t.eoiPaymentMethodBank}
                        </button>
                        <button
                          type="button"
                          onClick={() => setPaymentMethod('instapay')}
                          style={{
                            padding: '10px',
                            borderRadius: '8px',
                            border: `2px solid ${paymentMethod === 'instapay' ? '#003DA6' : 'rgba(0,61,166,0.08)'}`,
                            background: paymentMethod === 'instapay' ? 'rgba(0,61,166,0.02)' : '#fff',
                            color: '#1e293b',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                          }}
                        >
                          {t.eoiPaymentMethodInstapay}
                        </button>
                      </div>
                    </div>
                  )}

                  {clientLocation === 'outside_egypt' && (
                    <div style={{ marginBottom: 16 }}>
                      <label style={labelStyle}>{t.eoiPaymentMethodLabel}</label>
                      <div
                        style={{
                          padding: '10px 14px',
                          borderRadius: '8px',
                          border: '2px solid #003DA6',
                          background: 'rgba(0,61,166,0.02)',
                          color: '#1e293b',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                        }}
                      >
                        <Globe size={14} color="#003DA6" />
                        {t.eoiPaymentMethodIntlBank}
                      </div>
                    </div>
                  )}

                  {/* Transfer Details Card */}
                  {clientLocation && (
                    <div>
                      {paymentMethod === 'bank_transfer' && (
                        <div style={{ background: 'rgba(0, 61, 166, 0.03)', padding: 14, borderRadius: 10, border: '1px solid rgba(0, 61, 166, 0.08)', marginBottom: 14 }}>
                          <h5 style={{ fontSize: '0.8rem', fontWeight: 800, color: '#003DA6', margin: '0 0 8px 0', fontFamily: 'var(--font-title)' }}>{t.eoiBankDetailsTitle}</h5>
                          <div style={{ fontSize: '0.72rem', color: '#334155', lineHeight: 1.6 }}>
                            <strong>Bank Name:</strong> Commercial International Bank (CIB)<br/>
                            <strong>Account Name:</strong> Mountain View Real Estate Dev<br/>
                            <strong>Account No:</strong> 100045678912<br/>
                            <strong>IBAN:</strong> EG12000300000000100045678912<br/>
                            <strong>SWIFT Code:</strong> COIBEGCX
                          </div>
                        </div>
                      )}
                      {paymentMethod === 'international_bank_transfer' && (
                        <div style={{ background: 'rgba(0, 61, 166, 0.03)', padding: 14, borderRadius: 10, border: '1px solid rgba(0, 61, 166, 0.08)', marginBottom: 14 }}>
                          <h5 style={{ fontSize: '0.8rem', fontWeight: 800, color: '#003DA6', margin: '0 0 8px 0', fontFamily: 'var(--font-title)' }}>{t.eoiBankDetailsTitle} (USD / EUR)</h5>
                          <div style={{ fontSize: '0.72rem', color: '#334155', lineHeight: 1.6 }}>
                            <strong>Bank Name:</strong> Commercial International Bank (CIB) Egypt<br/>
                            <strong>Account Name:</strong> Mountain View Real Estate Dev Intl<br/>
                            <strong>Account No (USD):</strong> 100099887766<br/>
                            <strong>IBAN:</strong> EG89000300000000100099887766<br/>
                            <strong>SWIFT Code:</strong> COIBEGCX
                          </div>
                        </div>
                      )}
                      {paymentMethod === 'instapay' && (
                        <div style={{ background: 'rgba(0, 61, 166, 0.03)', padding: 14, borderRadius: 10, border: '1px solid rgba(0, 61, 166, 0.08)', marginBottom: 14 }}>
                          <h5 style={{ fontSize: '0.8rem', fontWeight: 800, color: '#003DA6', margin: '0 0 8px 0', fontFamily: 'var(--font-title)' }}>{t.eoiInstapayDetailsTitle}</h5>
                          <div style={{ fontSize: '0.72rem', color: '#334155', lineHeight: 1.6 }}>
                            <strong>InstaPay Address:</strong> <span style={{ fontFamily: 'monospace', fontWeight: 700, background: 'rgba(0,61,166,0.08)', padding: '2px 6px', borderRadius: 4 }}>mountainview@instapay</span>
                          </div>
                        </div>
                      )}

                      {/* File Upload fields */}
                      <div style={{ marginBottom: 14 }}>
                        <label style={labelStyle}>{t.eoiReceiptUpload}</label>
                        <div style={{ position: 'relative' }}>
                          <input
                            type="file"
                            accept=".jpg,.jpeg,.png,.pdf"
                            required
                            onChange={e => {
                              if (e.target.files && e.target.files.length > 0) {
                                setReceiptFile(e.target.files[0]);
                              }
                            }}
                            style={{ display: 'none' }}
                            id="reserve-receipt-file-input"
                          />
                          <label
                            htmlFor="reserve-receipt-file-input"
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 10,
                              padding: '12px 16px',
                              border: '2px dashed rgba(0,61,166,0.15)',
                              borderRadius: '10px',
                              cursor: 'pointer',
                              background: '#fff',
                              transition: 'all 0.2s',
                            }}
                            onMouseOver={e => e.currentTarget.style.borderColor = '#003DA6'}
                            onMouseOut={e => e.currentTarget.style.borderColor = 'rgba(0,61,166,0.15)'}
                          >
                            <Info size={18} color="#003DA6" />
                            <span style={{ fontSize: '0.78rem', color: '#5c6c7f', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '80%' }}>
                              {receiptFile ? receiptFile.name : t.eoiUploadHint}
                            </span>
                          </label>
                        </div>
                      </div>

                      {clientLocation === 'outside_egypt' && (
                        <div style={{ marginBottom: 20 }}>
                          <label style={labelStyle}>{t.eoiPassportUpload}</label>
                          <div style={{ position: 'relative' }}>
                            <input
                              type="file"
                              accept=".jpg,.jpeg,.png,.pdf"
                              required={clientLocation === 'outside_egypt'}
                              onChange={e => {
                                if (e.target.files && e.target.files.length > 0) {
                                  setPassportFile(e.target.files[0]);
                                }
                              }}
                              style={{ display: 'none' }}
                              id="reserve-passport-file-input"
                            />
                            <label
                              htmlFor="reserve-passport-file-input"
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 10,
                                padding: '12px 16px',
                                border: '2px dashed rgba(0,61,166,0.15)',
                                borderRadius: '10px',
                                cursor: 'pointer',
                                background: '#fff',
                                transition: 'all 0.2s',
                              }}
                              onMouseOver={e => e.currentTarget.style.borderColor = '#003DA6'}
                              onMouseOut={e => e.currentTarget.style.borderColor = 'rgba(0,61,166,0.15)'}
                            >
                              <Info size={18} color="#003DA6" />
                              <span style={{ fontSize: '0.78rem', color: '#5c6c7f', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '80%' }}>
                                {passportFile ? passportFile.name : t.eoiUploadHint}
                              </span>
                            </label>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {reserveError && (
                    <div style={{
                      background: 'rgba(239,68,68,0.08)',
                      color: '#dc2626',
                      padding: '12px 16px',
                      borderRadius: 12,
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      marginBottom: 16,
                      border: '1px solid rgba(239,68,68,0.15)',
                    }}>
                      {reserveError}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={reserveProcessing}
                    style={{
                      width: '100%',
                      background: reserveProcessing ? '#94a3b8' : 'linear-gradient(135deg, #22c55e, #16a34a)',
                      color: '#fff',
                      border: 'none',
                      padding: '15px 24px',
                      borderRadius: 999,
                      fontFamily: 'var(--font-title)',
                      fontWeight: 700,
                      fontSize: '0.95rem',
                      cursor: reserveProcessing ? 'wait' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 10,
                      boxShadow: reserveProcessing ? 'none' : '0 6px 20px rgba(34,197,94,0.3)',
                      transition: 'all 0.3s ease',
                    }}
                  >
                    {reserveProcessing ? (
                      <>
                        <Loader size={18} className="animate-spin" />
                        {lang === 'en' ? 'Processing Reservation...' : 'جاري معالجة الحجز...'}
                      </>
                    ) : (
                      <>
                        <Shield size={18} />
                        {t.confirmReservation}
                      </>
                    )}
                  </button>
                </div>
              )}
            </form>
          )}
        </div>
      </div>
    );
  };

  /* ═══════════════════════════════════════════════════════
     MAIN RENDER
     ═══════════════════════════════════════════════════════ */
  return (
    <div dir={dir} style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      background: 'radial-gradient(circle at 10% 20%, rgba(0,61,166,0.04) 0%, rgba(248,250,252,0.96) 60%, rgba(197,168,128,0.06) 100%), #f8fafc',
      fontFamily: 'var(--font-body)',
    }}>
      {/* CSS Animations */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes us3d-fadeSlideUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes us3d-cardAppear {
          from { opacity: 0; transform: translateY(20px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes us3d-towerRise {
          from { opacity: 0; transform: translateY(60px) rotateX(15deg); }
          to { opacity: 1; transform: translateY(0) rotateX(0); }
        }
        @keyframes us3d-floorSlide {
          from { opacity: 0; transform: translateX(-30px) rotateX(6deg); }
          to { opacity: 1; transform: rotateX(6deg) translateZ(0); }
        }
        @keyframes us3d-slidePanelLTR {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        @keyframes us3d-slidePanelRTL {
          from { transform: translateX(-100%); }
          to { transform: translateX(0); }
        }
        @keyframes us3d-modalFade {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes us3d-modalSlideUp {
          from { transform: translateY(30px) scale(0.96); opacity: 0; }
          to { transform: translateY(0) scale(1); opacity: 1; }
        }
        @keyframes us3d-successPop {
          0% { transform: scale(0); }
          60% { transform: scale(1.15); }
          100% { transform: scale(1); }
        }
        @keyframes us3d-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @keyframes us3d-stepTransition {
          from { opacity: 0; transform: scale(0.98); }
          to { opacity: 1; transform: scale(1); }
        }
        .us3d-back-btn:hover {
          background: rgba(0,61,166,0.1) !important;
          transform: translateX(-2px) !important;
        }
        @media (max-width: 768px) {
          .us3d-mobile-hide { display: none !important; }
          .us3d-panel-mobile {
            max-width: 100% !important;
            width: 100% !important;
          }
        }
      `}} />

      {/* ─── Navbar ─── */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(255,255,255,0.82)',
        backdropFilter: 'blur(28px)',
        borderBottom: '1.5px solid rgba(0,61,166,0.08)',
        padding: '16px 40px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        boxShadow: '0 10px 30px rgba(0,0,0,0.015)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}
          onClick={() => navigate('/')}>
          <img
            src="/mountain_view_logo.png"
            alt="Mountain View Logo"
            style={{
              height: 36, width: 'auto', objectFit: 'contain',
              filter: 'brightness(0) saturate(100%) invert(16%) sepia(61%) saturate(5185%) hue-rotate(217deg) brightness(92%) contrast(109%)'
            }}
          />
        </div>

        <div className="us3d-mobile-hide" style={{ display: 'flex', gap: 32, alignItems: 'center' }}>
          <a href="/" style={{ color: '#5c6c7f', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 700, transition: 'color 0.3s' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#003DA6')}
            onMouseLeave={e => (e.currentTarget.style.color = '#5c6c7f')}>
            {t.navHome}
          </a>
          <span style={{ color: '#003DA6', fontSize: '0.85rem', fontWeight: 700, borderBottom: '2.5px solid #003DA6', paddingBottom: 4 }}>
            {t.navUnitSelection}
          </span>
        </div>

        <div className="us3d-mobile-hide" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button onClick={() => setLang(prev => prev === 'en' ? 'ar' : 'en')} style={{
            background: 'rgba(255,255,255,0.8)',
            border: '1.5px solid rgba(0,61,166,0.15)',
            borderRadius: 999, padding: '8px 18px',
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
            fontSize: '0.82rem', fontWeight: 700, color: '#003DA6',
            transition: 'all 0.3s ease',
          }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#003DA6'; (e.currentTarget as HTMLButtonElement).style.color = '#fff'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.8)'; (e.currentTarget as HTMLButtonElement).style.color = '#003DA6'; }}
          >
            <Globe size={15} />
            {lang === 'en' ? 'العربية' : 'English'}
          </button>

          {isLoggedIn ? (
            <button onClick={() => navigate('/dashboard')} style={{
              background: 'linear-gradient(135deg, #003DA6, #001f5c)',
              color: '#fff', border: 'none', borderRadius: 999,
              padding: '10px 24px', fontSize: '0.82rem', fontWeight: 700,
              cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,61,166,0.15)',
              transition: 'all 0.3s ease',
            }}>
              {t.navDashboard}
            </button>
          ) : (
            <button onClick={() => navigate('/login')} style={{
              background: 'linear-gradient(135deg, #003DA6, #001f5c)',
              color: '#fff', border: 'none', borderRadius: 999,
              padding: '10px 24px', fontSize: '0.82rem', fontWeight: 700,
              cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,61,166,0.15)',
              transition: 'all 0.3s ease',
            }}>
              {t.navLogin}
            </button>
          )}
        </div>

        {/* Mobile menu toggle */}
        <button className="us3d-mobile-show" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} style={{
          display: 'none', background: 'none', border: 'none',
          cursor: 'pointer', color: '#003DA6', padding: 6,
        }}>
          <Menu size={24} />
        </button>
      </nav>

      {/* ─── Hero Header ─── */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(0,15,61,0.92) 0%, rgba(0,45,140,0.85) 60%, rgba(0,15,61,0.95) 100%)',
        padding: '60px 40px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Animated background particles */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          background: 'radial-gradient(circle at 70% 30%, rgba(197,168,128,0.15) 0%, transparent 50%), radial-gradient(circle at 20% 80%, rgba(0,61,166,0.2) 0%, transparent 50%)',
        }} />
        <div style={{ position: 'relative', zIndex: 2, maxWidth: 1200, margin: '0 auto', textAlign: 'center' }}>
          <h1 style={{
            fontFamily: 'var(--font-title)',
            fontSize: 'clamp(1.8rem, 4vw, 3rem)',
            fontWeight: 800,
            color: '#fff',
            marginBottom: 12,
            letterSpacing: '-0.02em',
          }}>
            {t.pageTitle}
          </h1>
          <p style={{
            color: 'rgba(255,255,255,0.7)',
            fontSize: '1.05rem',
            maxWidth: 600,
            margin: '0 auto',
          }}>
            {t.pageSubtitle}
          </p>

          {/* Step indicators */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: 0, marginTop: 36,
          }}>
            {(['projects', 'buildings', 'floors', 'units'] as Step[]).map((step, i) => {
              const labels = [t.masterPlan, t.buildings, t.floors, t.units];
              const stepOrder = ['projects', 'buildings', 'floors', 'units'];
              const currentIdx = stepOrder.indexOf(currentStep);
              const isActive = i <= currentIdx;
              const isCurrent = step === currentStep;

              return (
                <React.Fragment key={step}>
                  {i > 0 && (
                    <div style={{
                      width: 40, height: 2,
                      background: isActive ? 'rgba(197,168,128,0.8)' : 'rgba(255,255,255,0.15)',
                      transition: 'background 0.5s ease',
                    }} />
                  )}
                  <div style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                  }}>
                    <div style={{
                      width: isCurrent ? 40 : 32,
                      height: isCurrent ? 40 : 32,
                      borderRadius: '50%',
                      background: isCurrent ? 'linear-gradient(135deg, #C5A880, #A08B68)' : isActive ? 'rgba(197,168,128,0.3)' : 'rgba(255,255,255,0.08)',
                      border: `2px solid ${isCurrent ? '#C5A880' : isActive ? 'rgba(197,168,128,0.5)' : 'rgba(255,255,255,0.15)'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '0.8rem', fontWeight: 800, color: isCurrent ? '#fff' : isActive ? '#C5A880' : 'rgba(255,255,255,0.3)',
                      transition: 'all 0.5s cubic-bezier(0.25,1,0.5,1)',
                      boxShadow: isCurrent ? '0 0 20px rgba(197,168,128,0.4)' : 'none',
                    }}>
                      {i + 1}
                    </div>
                    <span style={{
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      color: isCurrent ? '#C5A880' : isActive ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.25)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      transition: 'color 0.5s ease',
                    }}>
                      {labels[i]}
                    </span>
                  </div>
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </div>

      {/* ─── Main Content ─── */}
      <main style={{
        flex: 1,
        padding: '40px 40px 80px',
        maxWidth: 1200,
        margin: '0 auto',
        width: '100%',
      }}>
        {/* Breadcrumbs */}
        {currentStep !== 'projects' && renderBreadcrumbs()}

        {/* Back button */}
        {currentStep !== 'projects' && (
          <button
            onClick={handleBack}
            className="us3d-back-btn"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: 'rgba(0,61,166,0.06)',
              border: '1.5px solid rgba(0,61,166,0.1)',
              borderRadius: 999, padding: '10px 20px',
              cursor: 'pointer', color: '#003DA6',
              fontWeight: 700, fontSize: '0.85rem',
              fontFamily: 'var(--font-title)',
              marginBottom: 32,
              transition: 'all 0.3s ease',
            }}
          >
            {lang === 'ar' ? <ArrowRight size={16} /> : <ArrowLeft size={16} />}
            {t.back}
          </button>
        )}

        {/* Loading state */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: 80 }}>
            <Loader size={40} className="animate-spin" style={{ color: '#003DA6', marginBottom: 16 }} />
            <p style={{ color: '#64748b' }}>Loading...</p>
          </div>
        ) : (
          /* Step content with transition */
          <div style={{
            opacity: animating ? 0 : 1,
            transform: animating ? 'scale(0.98)' : 'scale(1)',
            transition: 'all 0.3s ease',
          }}>
            {currentStep === 'projects' && renderProjectSelector()}
            {currentStep === 'buildings' && renderBuildingSelector()}
            {currentStep === 'floors' && renderFloorSelector()}
            {currentStep === 'units' && renderUnitGrid()}
          </div>
        )}
      </main>

      {/* ─── Unit Detail Side Panel ─── */}
      {renderUnitPanel()}

      {/* ─── Overlay when panel is open ─── */}
      {showUnitPanel && (
        <div
          onClick={() => { setShowUnitPanel(false); setSelectedUnit(null); }}
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,15,61,0.2)',
            zIndex: 999,
            animation: 'us3d-modalFade 0.3s ease forwards',
          }}
        />
      )}

      {/* ─── Reservation Modal ─── */}
      {renderReserveModal()}

      {/* ─── Fullscreen 3D Model Modal ─── */}
      {fullscreenModelUrl && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.85)',
          backdropFilter: 'blur(16px)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          zIndex: 3000,
          animation: 'us3d-modalFade 0.3s ease forwards',
          padding: '24px',
        }}
          onClick={() => { setFullscreenModelUrl(null); setFullscreenModelTitle(''); }}
        >
          <div 
            style={{
              background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
              border: '1.5px solid rgba(197, 168, 128, 0.35)',
              borderRadius: 28,
              padding: '24px',
              maxWidth: '90vw', width: '100%',
              height: '85vh',
              boxShadow: '0 30px 70px rgba(0,0,0,0.5)',
              display: 'flex', flexDirection: 'column',
              animation: 'us3d-modalSlideUp 0.45s cubic-bezier(0.34,1.56,0.64,1) forwards',
              position: 'relative',
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid rgba(197, 168, 128, 0.15)', paddingBottom: '12px' }}>
              <h3 style={{ fontFamily: 'var(--font-title)', fontSize: '1.25rem', fontWeight: 800, color: '#C5A880', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                🧊 {lang === 'ar' ? 'معاينة ثلاثية الأبعاد تفاعلية' : 'Interactive 3D Preview'} — {fullscreenModelTitle}
              </h3>
              <button 
                onClick={() => { setFullscreenModelUrl(null); setFullscreenModelTitle(''); }}
                style={{ 
                  background: 'rgba(255, 255, 255, 0.08)', border: 'none', cursor: 'pointer', 
                  width: '36px', height: '36px', borderRadius: '50%', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#94a3b8', transition: 'all 0.3s ease' 
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'; e.currentTarget.style.color = '#f87171'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'; e.currentTarget.style.color = '#94a3b8'; }}
              >
                <X size={18} />
              </button>
            </div>

            {/* 3D Model Viewer container */}
            <div style={{ flex: 1, position: 'relative', background: 'linear-gradient(135deg, #090d16 0%, #111827 100%)', borderRadius: 16, overflow: 'hidden', border: '1px solid rgba(197, 168, 128, 0.25)' }}>
              {/* @ts-ignore */}
              <model-viewer
                src={fullscreenModelUrl}
                camera-controls
                auto-rotate
                shadow-intensity="2.0"
                exposure="1.2"
                environment-image="neutral"
                style={{
                  width: '100%', height: '100%',
                  '--poster-color': 'transparent',
                } as any}
              />
              
              {/* Controls guide */}
              <div style={{
                position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)',
                padding: '8px 20px', borderRadius: 999,
                background: 'rgba(0,15,61,0.65)', backdropFilter: 'blur(8px)',
                color: '#fff', fontSize: '0.75rem', fontWeight: 600,
                whiteSpace: 'nowrap', pointerEvents: 'none',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                display: 'flex', alignItems: 'center', gap: '8px'
              }}>
                <span>🖱️ {lang === 'ar' ? 'اسحب للتدوير' : 'Drag to rotate'}</span>
                <span style={{ opacity: 0.5 }}>|</span>
                <span>🔍 {lang === 'ar' ? 'استخدم البكرة للتكبير' : 'Scroll to zoom'}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Footer ─── */}
      <footer style={{
        background: 'linear-gradient(135deg, #0a0f1e, #0d1b3e)',
        padding: '32px 40px',
        textAlign: 'center',
        borderTop: '1px solid rgba(197,168,128,0.15)',
      }}>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem' }}>
          © 2026 REDP — Real Estate Digital Platform. All rights reserved.
        </p>
      </footer>
    </div>
  );
};

export default InteractiveUnitSelection;
