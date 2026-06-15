import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import {
  Globe, Building, MapPin, Calendar, Compass, Layers, CheckCircle,
  Phone, Mail, ArrowRight, ArrowLeft, Star, CreditCard, Lock, ChevronDown,
  Info, AlertCircle, Play, Menu, X, Shield, ArrowUpRight
} from 'lucide-react';

const translations = {
  en: {
    navProjects: 'Compounds Portfolio',
    navGallery: 'Media Gallery',
    navFaq: 'FAQ Desk',
    navContact: 'Contact Us',
    navDashboard: 'Dashboard Portal',
    navLogin: 'Operator Login',
    heroTitle: 'Luxury Living Redefined',
    heroSubtitle: 'Explore Mountain View exclusive communities, inspect live available unit configurations, and secure your launch priority through our digital EOI portal.',
    heroCta: 'Book Priority EOI Ticket',
    heroSecondary: 'Discover Compounds',
    projectsTitle: 'Active Compound Portfolio',
    projectsSubtitle: 'Discover our landmarks, current construction phases, and live inventories.',
    projectLocation: 'Location',
    projectDelivery: 'Estimated Handover',
    projectAvailable: 'Available Units',
    projectNoUnits: 'Sold Out / Coming Soon',
    projectPlans: 'Available Payment Plans',
    viewUnits: 'Inspect Available Units',
    unitsTitle: 'Live Units Inventory',
    unitsSubtitle: 'Select a compound to view active listings and secure booking priority.',
    unitNo: 'Unit',
    unitType: 'Type',
    unitArea: 'Area',
    unitBedrooms: 'Beds',
    unitBathrooms: 'Baths',
    unitPrice: 'Price',
    unitAction: 'Book & Pay EOI',
    unitPlaceholder: 'Select a project above to inspect live inventory.',
    unitEmpty: 'No units currently listed as available for this project.',
    galleryTitle: 'Visual Showcase',
    gallerySubtitle: 'Explore virtual walk-throughs of our premier luxury spaces and signature architectures.',
    galleryAll: 'All',
    galleryExterior: 'Exterior Design',
    galleryInterior: 'Interior Design',
    galleryAmenities: 'Amenities & Lounges',
    faqTitle: 'Frequently Asked Questions',
    faqSubtitle: 'Learn more about the reservation priority queue, payment terms, and delivery phases.',
    contactTitle: 'Direct Inquiries',
    contactSubtitle: 'Send a message to our commercial acquisition desk and a specialist will contact you.',
    contactFirstName: 'First Name',
    contactLastName: 'Last Name',
    contactEmail: 'Email Address',
    contactPhone: 'Phone Number',
    contactMessage: 'Message Details',
    contactSubmit: 'Send Inquiry Message',
    contactSuccess: 'Inquiry received. Our sales desk will call you shortly!',
    eoiModalTitle: 'Expression of Interest (EOI) Priority Portal',
    eoiModalSubtitle: 'Mountain View prioritizes unit allocation fairly based on millisecond timestamp booking.',
    eoiFormPersonal: '1. Contact Information',
    eoiFormPayment: '2. Secure Payment Gateway',
    eoiSelectedProject: 'Selected Compound',
    eoiSelectedUnit: 'Selected Unit',
    eoiAmountLabel: 'EOI Registration Token',
    eoiAmountDesc: 'refundable down payment to secure booking priority',
    eoiNationalId: 'National ID / Passport No.',
    eoiCardName: 'Cardholder Name',
    eoiCardNo: 'Credit Card Number',
    eoiCardExp: 'Expiry (MM/YY)',
    eoiCardCvv: 'CVV',
    eoiPaySubmit: 'Secure Payment & Join Queue',
    eoiProcessing: 'Authorizing Merchant Hold...',
    eoiSuccessTitle: 'Reservation Ticket Confirmed!',
    eoiSuccessDesc: 'Your Expression of Interest (EOI) payment has been processed and locked on the ledger.',
    eoiTicketNo: 'Your Priority Queue Number',
    eoiClose: 'Close Portal',
    footerRights: 'All rights reserved. Mountain View Developer Real Estate Holding.',
  },
  ar: {
    navProjects: 'محفظة المشاريع',
    navGallery: 'معرض الصور والفيديو',
    navFaq: 'الأسئلة الشائعة',
    navContact: 'اتصل بنا',
    navDashboard: 'بوابة لوحة التحكم',
    navLogin: 'دخول الموظفين',
    heroTitle: 'العيش الفاخر كما يجب أن يكون',
    heroSubtitle: 'اكتشف مجتمعات ماونتن فيو الحصرية، وتصفح الوحدات المتاحة لحظياً، واحجز مكانك ذو الأولوية في الطرح عبر بوابة جدية الحجز الرقمية.',
    heroCta: 'احجز تذكرة EOI ذات أولوية',
    heroSecondary: 'تصفح المشاريع',
    projectsTitle: 'مشاريعنا النشطة',
    projectsSubtitle: 'اكتشف علاماتنا المعمارية البارزة، ومراحل البناء الحالية، والوحدات المتاحة لحظياً.',
    projectLocation: 'الموقع',
    projectDelivery: 'تاريخ التسليم المتوقع',
    projectAvailable: 'الوحدات المتاحة',
    projectNoUnits: 'بيعت بالكامل / قريباً',
    projectPlans: 'خطط الدفع المتاحة',
    viewUnits: 'استعراض الوحدات المتاحة',
    unitsTitle: 'مخزون الوحدات اللحظي',
    unitsSubtitle: 'اختر كمبوند لتصفح القوائم النشطة وضمان أولوية الحجز.',
    unitNo: 'رقم الوحدة',
    unitType: 'نوع الوحدة',
    unitArea: 'المساحة',
    unitBedrooms: 'الغرف',
    unitBathrooms: 'الحمامات',
    unitPrice: 'السعر',
    unitAction: 'حجز ودفع الـ EOI',
    unitPlaceholder: 'اختر مشروعاً من الأعلى لتصفح الوحدات المتوفرة.',
    unitEmpty: 'لا توجد وحدات متاحة حالياً في هذا المشروع.',
    galleryTitle: 'المعرض المرئي للمشاريع',
    gallerySubtitle: 'قم بجولات افتراضية في مساحاتنا الفاخرة وتصاميمنا المعمارية المميزة.',
    galleryAll: 'الكل',
    galleryExterior: 'التصميم الخارجي',
    galleryInterior: 'التصميم الداخلي',
    galleryAmenities: 'المرافق والخدمات',
    faqTitle: 'الأسئلة الشائعة',
    faqSubtitle: 'تعرف أكثر على كيفية حجز أدوار الطرح، وشروط السداد، ومواعيد التسليم.',
    contactTitle: 'الاستفسارات المباشرة',
    contactSubtitle: 'أرسل رسالة إلى مكتب المبيعات والتسويق لدينا وسيتواصل معك مستشار عقاري.',
    contactFirstName: 'الاسم الأول',
    contactLastName: 'الاسم الأخير',
    contactEmail: 'البريد الإلكتروني',
    contactPhone: 'رقم الهاتف',
    contactMessage: 'تفاصيل رسالتك',
    contactSubmit: 'إرسال طلب الاستفسار',
    contactSuccess: 'تم استلام طلبك بنجاح. سيتصل بك فريق المبيعات قريباً!',
    eoiModalTitle: 'بوابة تسجيل جدية الحجز (EOI)',
    eoiModalSubtitle: 'تمنح ماونتن فيو أولوية تخصيص الوحدات بعدالة مطلقة اعتماداً على زمن الحجز بالجزء من الثانية.',
    eoiFormPersonal: '1. البيانات الشخصية للاتصال',
    eoiFormPayment: '2. بوابة الدفع الآمنة',
    eoiSelectedProject: 'المشروع المحدد',
    eoiSelectedUnit: 'الوحدة المحددة',
    eoiAmountLabel: 'قيمة جدية الحجز (EOI)',
    eoiAmountDesc: 'دفعة مقدمة مستردة لضمان أسبقية حجز الوحدة',
    eoiNationalId: 'الرقم القومي / رقم جواز السفر',
    eoiCardName: 'اسم صاحب البطاقة',
    eoiCardNo: 'رقم بطاقة الائتمان',
    eoiCardExp: 'تاريخ الانتهاء (الشهر/السنة)',
    eoiCardCvv: 'الرمز السري (CVV)',
    eoiPaySubmit: 'دفع آمن والانضمام لصف الأولوية',
    eoiProcessing: 'جاري فحص تفاصيل الدفع والتحقق...',
    eoiSuccessTitle: 'تم تأكيد طلب الحجز بنجاح!',
    eoiSuccessDesc: 'تمت معالجة دفعة جدية الحجز (EOI) الخاصة بك وتأكيدها في سجل المعاملات.',
    eoiTicketNo: 'رقم الأسبقية الخاص بك في صف المشروع',
    eoiClose: 'إغلاق البوابة',
    footerRights: 'جميع الحقوق محفوظة. مجموعة ماونتن فيو للتطوير العقاري.',
  }
};

const faqItems = [
  {
    q: {
      en: 'What is the EOI priority queue system?',
      ar: 'ما هو نظام طابور أولوية جدية الحجز (EOI)؟'
    },
    a: {
      en: 'Expression of Interest (EOI) is a refundable payment that places you on our launch list. The exact millisecond your payment lands determines your position to pick and finalize units during launch days.',
      ar: 'مبلغ جدية الحجز (EOI) هو دفعة مالية مستردة تضعك في قائمة الطرح. يحدد وقت وصول معاملتك بالملي ثانية ترتيبك لاختيار وتأكيد الوحدات أثناء أيام الإطلاق.'
    }
  },
  {
    q: {
      en: 'Is the EOI payment fully refundable?',
      ar: 'هل مبلغ جدية الحجز (EOI) مسترد بالكامل؟'
    },
    a: {
      en: 'Yes, if you choose not to proceed with a purchase during the selection event, your EOI payment is 100% refundable without any administrative deductions within 14 days.',
      ar: 'نعم، في حال قررت عدم المضي قدماً في الشراء أثناء حدث التخصيص، فإن قيمة جدية الحجز مستردة بنسبة 100% دون أي خصومات إدارية خلال 14 يوماً.'
    }
  },
  {
    q: {
      en: 'What payment options do you support for contract structures?',
      ar: 'ما هي خيارات السداد المتاحة عند كتابة العقود؟'
    },
    a: {
      en: 'We offer plans spanning from full cash payments (with 10% cash discount) up to structured 5, 7, and 10-year installment plans with zero interest options.',
      ar: 'نوفر خطط سداد تبدأ من الدفع النقدي الفوري كاش (مع خصم 10% من قيمة العقار) وتصل إلى خطط تقسيط ميسرة على 5 و7 و10 سنوات بدون فوائد.'
    }
  },
  {
    q: {
      en: 'Can I change my unit selection after paying the EOI?',
      ar: 'هل يمكنني تغيير الوحدة التي اخترتها بعد دفع الـ EOI؟'
    },
    a: {
      en: 'Yes, your EOI gives you priority access. You will sit with an acquisition manager during launch to confirm your final unit or swap it for any other available option in the inventory.',
      ar: 'نعم، يمنحك دفع الـ EOI أسبقية الدخول والتخصيص. ستجتمع مع مدير الاستحواذ المباشر لتأكيد وحدتك أو استبدالها بأي وحدة أخرى شاغرة في المخزون.'
    }
  }
];

const galleryImages = [
  {
    url: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=600&q=80',
    category: 'exterior',
    title: { en: 'Mountain View Club Facade', ar: 'ماونتن فيو - الواجهة الخارجية للنادي' }
  },
  {
    url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=80',
    category: 'exterior',
    title: { en: 'Lush Lagoons & Walkways', ar: 'الممرات المائية والمساحات الخضراء' }
  },
  {
    url: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=600&q=80',
    category: 'interior',
    title: { en: 'Modern Duplex Living Salon', ar: 'صالون داخلي فاخر لوحدات الدوبلكس' }
  },
  {
    url: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=600&q=80',
    category: 'interior',
    title: { en: 'Executive Penthouse Master Suite', ar: 'غرفة النوم الرئيسية للبنتهاوس التنفيذي' }
  },
  {
    url: 'https://images.unsplash.com/photo-1579725900907-f40a60cfb776?auto=format&fit=crop&w=600&q=80',
    category: 'amenities',
    title: { en: 'Signature Wellness Spa', ar: 'منتجع الجيم والسبا الصحي المتكامل' }
  },
  {
    url: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=600&q=80',
    category: 'amenities',
    title: { en: 'Community Workspace Hub Lounge', ar: 'قاعة مركز الأعمال المشترك ومساحات العمل' }
  }
];

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  
  // Basic states
  const [lang, setLang] = useState<'en' | 'ar'>('en');
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [units, setUnits] = useState<any[]>([]);
  const [loadingProjects, setLoadingProjects] = useState<boolean>(true);
  const [loadingUnits, setLoadingUnits] = useState<boolean>(false);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [galleryTab, setGalleryTab] = useState<string>('all');
  
  // Contact State
  const [contactForm, setContactForm] = useState({ first_name: '', last_name: '', email: '', phone: '', message: '' });
  const [sendingContact, setSendingContact] = useState(false);
  const [contactSuccessMsg, setContactSuccessMsg] = useState('');

  // EOI Modal States
  const [showEoiModal, setShowEoiModal] = useState(false);
  const [eoiProject, setEoiProject] = useState<any>(null);
  const [eoiUnit, setEoiUnit] = useState<any>(null);
  const [eoiForm, setEoiForm] = useState({
    first_name: '', last_name: '', email: '', phone: '', national_id: '',
    card_name: '', card_no: '', card_exp: '', card_cvv: ''
  });
  const [eoiStep, setEoiStep] = useState<1 | 2 | 3>(1);
  const [eoiProcessing, setEoiProcessing] = useState(false);
  const [eoiResult, setEoiResult] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState('');

  // Is logged in checked
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Set direction based on language
  const dir = lang === 'ar' ? 'rtl' : 'ltr';
  const t = translations[lang];

  useEffect(() => {
    const token = localStorage.getItem('redp_token');
    setIsLoggedIn(!!token);
    loadProjects();
  }, []);

  useEffect(() => {
    if (selectedProjectId) {
      loadProjectUnits(selectedProjectId);
    } else {
      setUnits([]);
    }
  }, [selectedProjectId]);

  const loadProjects = async () => {
    setLoadingProjects(true);
    try {
      const res = await api.get('/v1/public/projects');
      if (res.data?.success) {
        setProjects(res.data.data || []);
        if (res.data.data?.length > 0) {
          setSelectedProjectId(res.data.data[0].id);
        }
      }
    } catch (err) {
      console.error('Error fetching projects:', err);
    }
    setLoadingProjects(false);
  };

  const loadProjectUnits = async (projectId: string) => {
    setLoadingUnits(true);
    try {
      const res = await api.get(`/v1/public/projects/${projectId}/units`);
      if (res.data?.success) {
        setUnits(res.data.data || []);
      }
    } catch (err) {
      console.error('Error fetching units:', err);
    }
    setLoadingUnits(false);
  };

  const toggleLanguage = () => {
    setLang(prev => (prev === 'en' ? 'ar' : 'en'));
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSendingContact(true);
    setContactSuccessMsg('');
    try {
      const res = await api.post('/v1/public/contact', contactForm);
      if (res.data?.success) {
        setContactSuccessMsg(t.contactSuccess);
        setContactForm({ first_name: '', last_name: '', email: '', phone: '', message: '' });
      }
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || 'Error sending message.');
    }
    setSendingContact(false);
  };

  const openEoiModal = (project: any, unit: any = null) => {
    setEoiProject(project);
    setEoiUnit(unit);
    setEoiForm({
      first_name: '', last_name: '', email: '', phone: '', national_id: '',
      card_name: '', card_no: '', card_exp: '', card_cvv: ''
    });
    setEoiStep(1);
    setErrorMessage('');
    setEoiResult(null);
    setShowEoiModal(true);
  };

  const handleEoiSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (eoiStep === 1) {
      if (!eoiForm.first_name || !eoiForm.last_name || !eoiForm.email || !eoiForm.phone) {
        setErrorMessage(lang === 'en' ? 'Please fill all required fields.' : 'يرجى ملء جميع الحقول المطلوبة.');
        return;
      }
      setErrorMessage('');
      setEoiStep(2);
      return;
    }

    setEoiProcessing(true);
    setErrorMessage('');
    try {
      const payload = {
        first_name: eoiForm.first_name,
        last_name: eoiForm.last_name,
        email: eoiForm.email,
        phone: eoiForm.phone,
        national_id: eoiForm.national_id || undefined,
        project_id: eoiProject.id,
        unit_id: eoiUnit?.id || undefined,
        eoi_amount: 50000.00,
        notes: eoiUnit ? `Website EOI payment for unit number ${eoiUnit.unit_number}` : 'General Compound EOI reservation via Public Landing'
      };

      await new Promise(resolve => setTimeout(resolve, 1500));

      const res = await api.post('/v1/public/eoi/submit', payload);
      if (res.data?.success) {
        setEoiResult(res.data);
        setEoiStep(3);
        loadProjects();
        if (selectedProjectId) {
          loadProjectUnits(selectedProjectId);
        }
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.response?.data?.message || 'Payment processing failed. Please verify card details.');
    }
    setEoiProcessing(false);
  };

  const selectedProjectObj = projects.find(p => p.id === selectedProjectId);
  const filteredGallery = galleryTab === 'all' ? galleryImages : galleryImages.filter(img => img.category === galleryTab);

  return (
    <div dir={dir} style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      background: 'radial-gradient(circle at 10% 20%, rgba(0, 61, 166, 0.04) 0%, rgba(248, 250, 252, 0.96) 60%, rgba(197, 168, 128, 0.06) 100%), #f8fafc',
      fontFamily: 'var(--font-body)',
      overflowX: 'hidden'
    }}>
      
      {/* ───────────────────────────────────────────────────
         CSS Styles injection matching Mountain View Egypt Branding
         ─────────────────────────────────────────────────── */}
      <style dangerouslySetInnerHTML={{__html: `
        .luxury-text-gradient {
          background: linear-gradient(135deg, #003DA6 0%, #001A70 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .landing-hero-video-container {
          position: relative;
          width: 100%;
          min-height: 90vh;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }
        .landing-hero-video {
          position: absolute;
          top: 0; left: 0; width: 100%; height: 100%;
          object-fit: cover;
          z-index: 1;
        }
        .landing-hero-overlay {
          position: absolute;
          top: 0; left: 0; width: 100%; height: 100%;
          background: linear-gradient(135deg, rgba(0, 15, 61, 0.85) 0%, rgba(0, 45, 140, 0.55) 60%, rgba(0, 15, 61, 0.92) 100%);
          z-index: 2;
        }
        .landing-hero-content {
          position: relative;
          z-index: 3;
          max-width: 1250px;
          margin: 0 auto;
          padding: 60px 24px;
          width: 100%;
        }
        .hero-booking-card {
          background: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(28px);
          -webkit-backdrop-filter: blur(28px);
          border: 1.5px solid rgba(255, 255, 255, 0.8);
          border-radius: 24px;
          box-shadow: 0 15px 35px -10px rgba(0, 15, 61, 0.08), inset 0 1px 2px rgba(255, 255, 255, 0.5);
          transition: all 0.4s cubic-bezier(0.25, 1, 0.5, 1);
        }
        .hero-booking-card:hover {
          background: rgba(255, 255, 255, 0.92);
          box-shadow: 0 0 25px rgba(0, 61, 166, 0.15), 0 15px 35px -10px rgba(0, 15, 61, 0.08);
          transform: translateY(-2px);
        }
        .mv-navbar {
          position: sticky; 
          top: 0; 
          z-index: 100;
          background: rgba(255, 255, 255, 0.82);
          backdrop-filter: blur(28px);
          -webkit-backdrop-filter: blur(28px);
          border-bottom: 1.5px solid rgba(0, 61, 166, 0.08);
          padding: 16px 40px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          transition: all 0.4s cubic-bezier(0.25, 1, 0.5, 1);
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.015);
        }
        .mv-nav-link {
          color: #5c6c7f !important;
          text-decoration: none;
          font-size: 0.85rem;
          font-weight: 700;
          transition: all 0.4s cubic-bezier(0.25, 1, 0.5, 1);
          position: relative;
          padding: 4px 0;
        }
        .mv-nav-link::after {
          content: '';
          position: absolute;
          width: 0; height: 2.5px;
          bottom: -4px; 
          left: 0;
          background-color: #003DA6;
          transition: width 0.3s cubic-bezier(0.25, 1, 0.5, 1);
        }
        .mv-nav-link:hover {
          color: #003DA6 !important;
        }
        .mv-nav-link:hover::after {
          width: 100%;
        }
        .btn-luxury-primary {
          background: linear-gradient(135deg, #003DA6 0%, #001A70 100%);
          color: #ffffff !important;
          border: none;
          font-family: var(--font-title);
          font-weight: 700;
          padding: 12px 28px;
          border-radius: 9999px;
          cursor: pointer;
          box-shadow: 0 4px 15px rgba(0, 61, 166, 0.2);
          transition: all 0.4s cubic-bezier(0.25, 1, 0.5, 1);
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }
        .btn-luxury-primary:hover {
          background: linear-gradient(135deg, #004ce6 0%, #002699 100%);
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(0, 61, 166, 0.3);
        }
        .btn-luxury-secondary {
          background: rgba(255, 255, 255, 0.7);
          color: #003DA6 !important;
          border: 1.5px solid rgba(0, 61, 166, 0.25);
          font-family: var(--font-title);
          font-weight: 700;
          padding: 11px 24px;
          border-radius: 9999px;
          cursor: pointer;
          transition: all 0.4s cubic-bezier(0.25, 1, 0.5, 1);
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }
        .btn-luxury-secondary:hover {
          background: #ffffff;
          border-color: #003DA6;
          transform: translateY(-1px);
        }
        .mv-card {
          background: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(28px);
          -webkit-backdrop-filter: blur(28px);
          border: 1.5px solid rgba(0, 61, 166, 0.08);
          border-radius: 24px;
          box-shadow: 0 15px 35px -10px rgba(0, 15, 61, 0.05), inset 0 1px 2px rgba(255, 255, 255, 0.5);
          transition: all 0.4s cubic-bezier(0.25, 1, 0.5, 1);
          position: relative;
          overflow: hidden;
        }
        .mv-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; width: 100%; height: 4.5px;
          background: linear-gradient(90deg, #003DA6 0%, #C5A880 100%);
          opacity: 0;
          transition: opacity 0.4s ease;
        }
        .mv-card:hover {
          transform: translateY(-6px);
          border-color: rgba(197, 168, 128, 0.4);
          box-shadow: 0 0 25px rgba(0, 61, 166, 0.08), 0 20px 40px -20px rgba(0, 15, 61, 0.12);
        }
        .mv-card:hover::before {
          opacity: 1;
        }
        .gallery-image-container {
          position: relative;
          overflow: hidden;
          border-radius: 14px;
          height: 240px;
          border: 1px solid rgba(255, 255, 255, 0.8);
        }
        .gallery-image-container img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.8s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .mv-card:hover .gallery-image-container img {
          transform: scale(1.08);
        }
        .mv-table-container {
          background: rgba(255, 255, 255, 0.55);
          border: 1.5px solid rgba(0, 61, 166, 0.08);
          border-radius: 14px;
          overflow: hidden;
          box-shadow: 0 10px 30px -10px rgba(0, 15, 61, 0.02);
        }
        .mv-table {
          width: 100%;
          border-collapse: separate;
          border-spacing: 0;
        }
        .mv-table th {
          background: rgba(0, 61, 166, 0.04);
          color: #003DA6 !important;
          font-weight: 800;
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          padding: 16px 20px;
          border-bottom: 2px solid rgba(0, 61, 166, 0.08);
          font-family: var(--font-title);
        }
        .mv-table td {
          padding: 18px 20px;
          border-bottom: 1px solid rgba(0, 61, 166, 0.05);
          font-size: 0.85rem;
          color: #1e293b;
          font-weight: 500;
          transition: all 0.3s ease;
        }
        .mv-table tr:hover td {
          background: rgba(255, 255, 255, 0.7);
        }
        .mv-table tr:last-child td {
          border-bottom: none;
        }
        .mv-input {
          width: 100%;
          padding: 12px 18px;
          background: rgba(255, 255, 255, 0.75);
          border: 1.5px solid rgba(0, 61, 166, 0.12);
          border-radius: 12px;
          color: #0f172a;
          font-size: 0.88rem;
          transition: all 0.3s ease;
          box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.01);
        }
        .mv-input:focus {
          outline: none;
          background: #ffffff;
          border-color: #003DA6;
          box-shadow: 0 0 0 3px rgba(0, 61, 166, 0.1);
        }
        .faq-accordion {
          border: 1.5px solid rgba(0, 61, 166, 0.08);
          border-radius: 16px;
          background: rgba(255, 255, 255, 0.7);
          backdrop-filter: blur(20px);
          transition: all 0.4s cubic-bezier(0.25, 1, 0.5, 1);
          overflow: hidden;
        }
        .faq-accordion:hover {
          border-color: #003DA6;
          transform: translateY(-1px);
          box-shadow: 0 8px 20px -8px rgba(0, 61, 166, 0.08);
        }
        .contact-grid {
          display: grid;
          grid-template-columns: 1fr 1.3fr;
          gap: 40px;
        }
        .spinning-logo {
          transition: transform 0.8s cubic-bezier(0.16, 1, 0.3, 1);
        }
        div:hover > .spinning-logo,
        .spinning-logo:hover {
          transform: rotate(180deg);
        }
        @keyframes drawer-fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes drawer-slide-in-ltr {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        @keyframes drawer-slide-in-rtl {
          from { transform: translateX(-100%); }
          to { transform: translateX(0); }
        }
        @media (max-width: 991px) {
          .mv-navbar {
            padding: 16px 24px;
          }
          .contact-grid {
            grid-template-columns: 1fr;
            gap: 32px;
          }
        }
        @media (max-width: 768px) {
          .topbar-links {
            display: none !important;
          }
          .desktop-actions {
            display: none !important;
          }
          .mobile-menu-toggle {
            display: flex !important;
            align-items: center;
            justify-content: center;
          }
          .hero-grid-container {
            grid-template-columns: 1fr !important;
            gap: 40px !important;
            text-align: center;
          }
          .hero-stats-row {
            justify-content: center !important;
          }
          .hero-title-header {
            font-size: 2.6rem !important;
          }
        }
      `}} />

      {/* ───────────────────────────────────────────────────
         Navbar Section
         ─────────────────────────────────────────────────── */}
      <nav className="mv-navbar">
        <div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <img
            src="/mountain_view_logo.png"
            alt="Mountain View Logo"
            style={{ 
              height: '36px', 
              width: 'auto', 
              objectFit: 'contain',
              filter: 'brightness(0) saturate(100%) invert(16%) sepia(61%) saturate(5185%) hue-rotate(217deg) brightness(92%) contrast(109%)'
            }}
          />
        </div>

        <div className="topbar-links" style={{ display: 'flex', gap: 32 }}>
          <a href="#projects" className="mv-nav-link">{t.navProjects}</a>
          <a href="#gallery" className="mv-nav-link">{t.navGallery}</a>
          <a href="#faq" className="mv-nav-link">{t.navFaq}</a>
          <a href="#contact" className="mv-nav-link">{t.navContact}</a>
        </div>

        <div className="desktop-actions" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button onClick={toggleLanguage} style={{
            background: 'rgba(255, 255, 255, 0.75)',
            border: '1.5px solid rgba(0, 61, 166, 0.15)',
            borderRadius: '999px',
            padding: '8px 16px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontSize: '0.8rem',
            fontWeight: 700,
            color: '#003DA6',
            transition: 'all 0.3s ease'
          }}>
            <Globe size={15} />
            {lang === 'en' ? 'العربية' : 'English'}
          </button>

          {isLoggedIn ? (
            <button className="btn-luxury-primary" onClick={() => navigate('/dashboard')} style={{ fontSize: '0.8rem', padding: '10px 24px' }}>
              {t.navDashboard}
              {lang === 'en' ? <ArrowRight size={15} /> : <ArrowLeft size={15} />}
            </button>
          ) : (
            <button onClick={() => navigate('/login')} style={{
              fontSize: '0.8rem',
              padding: '10px 24px',
              borderRadius: '999px',
              border: '1.5px solid #003DA6',
              color: '#003DA6',
              background: 'transparent',
              cursor: 'pointer',
              fontWeight: 700,
              transition: 'all 0.3s ease'
            }}>
              {t.navLogin}
            </button>
          )}
        </div>

        <button
          className="mobile-menu-toggle"
          onClick={() => setMobileMenuOpen(true)}
          style={{
            display: 'none',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: '#003DA6',
            padding: 6
          }}
        >
          <Menu size={24} />
        </button>
      </nav>

      {/* ───────────────────────────────────────────────────
         Hero Section with full background video and dark overlay
         ─────────────────────────────────────────────────── */}
      <header className="landing-hero-video-container">
        <video
          className="landing-hero-video"
          src="/mountain_view_video.mp4"
          autoPlay
          loop
          muted
          playsInline
        />
        <div className="landing-hero-overlay" />
        
        {/* Glow Bubbles */}
        <div style={{ top: '15%', left: '8%', width: '350px', height: '350px', background: 'rgba(0, 61, 166, 0.12)', filter: 'blur(120px)', position: 'absolute', borderRadius: '50%', zIndex: 2 }} />
        <div style={{ bottom: '10%', right: '10%', width: '300px', height: '300px', background: 'rgba(197, 168, 128, 0.08)', filter: 'blur(100px)', position: 'absolute', borderRadius: '50%', zIndex: 2 }} />
        
        <div className="landing-hero-content">
          <div className="hero-grid-container" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 48, alignItems: 'center' }}>
            
            <div style={{ textAlign: dir === 'ltr' ? 'left' : 'right', color: '#ffffff' }}>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                background: 'rgba(255, 255, 255, 0.12)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                color: '#ffffff',
                borderRadius: '999px',
                padding: '8px 18px',
                fontSize: '0.78rem',
                fontWeight: 700,
                marginBottom: 24,
                textTransform: 'uppercase',
                letterSpacing: '0.06em'
              }}>
                <Star size={13} fill="#ffffff" />
                <span>
                  {lang === 'en' ? 'Mountain View Luxury Living' : 'ماونتن فيو للحياة الراقية'}
                </span>
              </div>
              
              <h1 className="hero-title-header" style={{
                fontSize: '3.6rem',
                lineHeight: 1.15,
                fontWeight: 800,
                marginBottom: 24,
                fontFamily: 'var(--font-title)',
                color: '#ffffff',
                textShadow: '0 4px 24px rgba(0, 0, 0, 0.4)'
              }}>
                {t.heroTitle}
              </h1>
              
              <p style={{
                fontSize: '1.1rem',
                color: 'rgba(255, 255, 255, 0.85)',
                lineHeight: 1.65,
                marginBottom: 40,
                maxWidth: 620,
                fontWeight: 400,
                textShadow: '0 2px 10px rgba(0, 0, 0, 0.3)'
              }}>
                {t.heroSubtitle}
              </p>

              <div className="hero-stats-row" style={{ display: 'flex', gap: 36, marginTop: 40, borderTop: '1px solid rgba(255, 255, 255, 0.15)', paddingTop: 30, flexWrap: 'wrap' }}>
                <div>
                  <strong style={{ fontSize: '2rem', color: '#C5A880', fontFamily: 'var(--font-title)', display: 'block', fontWeight: 800 }}>14+</strong>
                  <span style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.7)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>
                    {lang === 'en' ? 'Active Phases' : 'مرحلة نشطة'}
                  </span>
                </div>
                <div>
                  <strong style={{ fontSize: '2rem', color: '#C5A880', fontFamily: 'var(--font-title)', display: 'block', fontWeight: 800 }}>0.01s</strong>
                  <span style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.7)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>
                    {lang === 'en' ? 'Precision Queue' : 'دقة حجز لحظية'}
                  </span>
                </div>
                <div>
                  <strong style={{ fontSize: '2rem', color: '#C5A880', fontFamily: 'var(--font-title)', display: 'block', fontWeight: 800 }}>100%</strong>
                  <span style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.7)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>
                    {lang === 'en' ? 'Refundable EOI' : 'مسترد بالكامل'}
                  </span>
                </div>
              </div>
            </div>

            <div className="hero-booking-card" style={{
              padding: 36,
              textAlign: dir === 'ltr' ? 'left' : 'right'
            }}>
              <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#001A70', marginBottom: 8, fontFamily: 'var(--font-title)' }}>
                {lang === 'en' ? 'FAST-TRACK RESERVATION' : 'حجز الأولوية السريع'}
              </h3>
              <p style={{ fontSize: '0.82rem', color: '#475569', marginBottom: 24, lineHeight: 1.5 }}>
                {lang === 'en' ? 'Skip long searches. Secure a general queue reservation for premium launch priorities instantly.' : 'تخط خطوات البحث الطويلة، وسجل دفعة جدية حجز عامة لضمان أسبقيتك في الطرح.'}
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#003DA6', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 8 }}>
                    {lang === 'en' ? 'Choose Target Compound' : 'اختر الكمبوند المستهدف'}
                  </label>
                  <select
                    style={{
                      width: '100%',
                      padding: '14px 18px',
                      borderRadius: '14px',
                      border: '1.5px solid rgba(0, 61, 166, 0.15)',
                      background: '#ffffff',
                      color: '#003DA6',
                      fontSize: '0.9rem',
                      fontWeight: 700,
                      outline: 'none',
                      boxShadow: '0 4px 10px rgba(0, 61, 166, 0.02)'
                    }}
                    value={selectedProjectId}
                    onChange={e => setSelectedProjectId(e.target.value)}
                  >
                    {projects.map((p: any) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                <div style={{
                  background: 'rgba(0, 61, 166, 0.03)',
                  border: '1px solid rgba(0, 61, 166, 0.08)',
                  borderRadius: '14px',
                  padding: '16px 20px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <span style={{ fontSize: '0.7rem', color: '#5c6c7f', display: 'block', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>
                      {lang === 'en' ? 'REFUNDABLE DEPOSIT' : 'جدية حجز مستردة'}
                    </span>
                    <strong style={{ fontSize: '1.3rem', color: '#001A70', fontFamily: 'var(--font-title)', fontWeight: 800 }}>EGP 50,000.00</strong>
                  </div>
                  <span style={{
                    fontSize: '0.65rem',
                    background: '#16a34a',
                    color: '#ffffff',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    fontWeight: 700,
                    letterSpacing: '0.05em'
                  }}>
                    {lang === 'en' ? 'SECURE LEDGER' : 'سجل آمن'}
                  </span>
                </div>

                {projects.length > 0 ? (
                  <button className="btn-luxury-primary" onClick={() => openEoiModal(projects.find(p => p.id === selectedProjectId) || projects[0])} style={{ padding: '16px', justifyContent: 'center', width: '100%', fontSize: '0.92rem' }}>
                    <CreditCard size={18} />
                    {t.heroCta}
                  </button>
                ) : (
                  <a href="#contact" className="btn-luxury-secondary" style={{ padding: '16px', justifyContent: 'center', width: '100%', fontSize: '0.92rem', textDecoration: 'none', textAlign: 'center' }}>
                    {t.navContact}
                  </a>
                )}
              </div>
            </div>

          </div>
        </div>
      </header>

      {/* ───────────────────────────────────────────────────
         Projects Catalog Section
         ─────────────────────────────────────────────────── */}
      <section id="projects" style={{ padding: '100px 24px 80px 24px', maxWidth: 1250, margin: '0 auto', width: '100%' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: 54 }}>
          <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#C5A880', letterSpacing: '0.25em', textTransform: 'uppercase', marginBottom: 12 }}>
            {lang === 'en' ? 'EXCLUSIVE CATALOG' : 'كتالوج حصري'}
          </span>
          <h2 style={{ fontSize: '2.6rem', fontWeight: 800, color: '#001A70', marginBottom: 18, fontFamily: 'var(--font-title)', letterSpacing: '-0.02em' }}>
            {t.projectsTitle}
          </h2>
          <div style={{ width: 50, height: 4, background: 'linear-gradient(90deg, #003DA6, #C5A880)', borderRadius: 99, marginBottom: 18 }} />
          <p style={{ fontSize: '0.95rem', color: '#5c6c7f', maxWidth: 580, margin: '0 auto', fontWeight: 500, lineHeight: 1.65 }}>
            {t.projectsSubtitle}
          </p>
        </div>

        {loadingProjects ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
            <div className="animate-spin" style={{
              width: 38, height: 38, border: '4px solid rgba(0, 61, 166, 0.15)',
              borderTopColor: '#003DA6', borderRadius: '50%'
            }} />
          </div>
        ) : (
          <div className="grid-cards" style={{ gap: 32, marginBottom: 54 }}>
            {projects.map((project: any) => {
              const hasUnits = project.units_count > 0;
              return (
                <div key={project.id} className="mv-card" style={{
                  padding: 32, display: 'flex', flexDirection: 'column',
                  justifyContent: 'space-between'
                }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                      <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#001A70', fontFamily: 'var(--font-title)' }}>{project.name}</h3>
                      <span className="badge" style={{
                        fontSize: '0.68rem',
                        background: project.status === 'active' ? 'rgba(22, 163, 74, 0.08)' : 'rgba(0, 61, 166, 0.05)',
                        color: project.status === 'active' ? '#16a34a' : '#003DA6',
                        border: project.status === 'active' ? '1px solid rgba(22, 163, 74, 0.2)' : '1px solid rgba(0, 61, 166, 0.2)',
                        padding: '6px 12px', borderRadius: '999px', fontWeight: 700
                      }}>
                        {project.status.toUpperCase()}
                      </span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 28 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: '0.88rem', color: '#5c6c7f' }}>
                        <MapPin size={16} color="#003DA6" />
                        <span>{t.projectLocation}: <strong style={{ color: '#0f172a' }}>{project.location}</strong></span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: '0.88rem', color: '#5c6c7f' }}>
                        <Calendar size={16} color="#003DA6" />
                        <span>{t.projectDelivery}: <strong style={{ color: '#0f172a' }}>{project.delivery_date}</strong></span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: '0.88rem', color: '#5c6c7f' }}>
                        <Compass size={16} color="#003DA6" />
                        <span>{t.projectAvailable}: <strong style={{ color: hasUnits ? '#16a34a' : '#ef4444' }}>
                          {hasUnits ? `${project.units_count} ${lang === 'en' ? 'Units' : 'وحدة'}` : t.projectNoUnits}
                        </strong></span>
                      </div>
                    </div>

                    {project.payment_plans && project.payment_plans.length > 0 && (
                      <div style={{ borderTop: '1px solid rgba(0, 61, 166, 0.08)', paddingTop: 20, marginBottom: 28 }}>
                        <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#C5A880', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 12 }}>
                          {t.projectPlans}
                        </span>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                          {project.payment_plans.slice(0, 3).map((plan: any) => (
                            <div key={plan.id} style={{ fontSize: '0.82rem', display: 'flex', justifyContent: 'space-between', color: '#5c6c7f' }}>
                              <span>• {lang === 'ar' ? (plan.name_ar || plan.name) : plan.name}</span>
                              <strong style={{ color: '#0f172a' }}>{plan.down_payment_pct}% DP / {plan.installments}m</strong>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
                    <button className="btn-luxury-secondary" onClick={() => {
                      setSelectedProjectId(project.id);
                      document.getElementById('units-catalog')?.scrollIntoView({ behavior: 'smooth' });
                    }} style={{
                      flex: 1, fontSize: '0.8rem', padding: '12px 14px', justifyContent: 'center'
                    }}>
                      <Layers size={15} color="#003DA6" />
                      {t.viewUnits}
                    </button>
                    <button className="btn-luxury-primary" onClick={() => openEoiModal(project)} style={{
                      fontSize: '0.8rem', padding: '12px 24px'
                    }}>
                      {t.heroCta}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ───────────────────────────────────────────────────
           Units Catalog Detail Browser
           ─────────────────────────────────────────────────── */}
        <div id="units-catalog" className="mv-card" style={{ padding: 40, background: 'rgba(255, 255, 255, 0.82)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 24, alignItems: 'center', marginBottom: 32, borderBottom: '1px solid rgba(0, 61, 166, 0.08)', paddingBottom: 24 }}>
            <div>
              <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#C5A880', letterSpacing: '0.18em', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>
                {lang === 'en' ? 'LIVE AVAILABILITY' : 'متاح حالياً'}
              </span>
              <h3 style={{ fontSize: '1.65rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 12, color: '#001A70', fontFamily: 'var(--font-title)', margin: 0 }}>
                <Building size={24} color="#003DA6" />
                {t.unitsTitle} {selectedProjectObj ? ` - ${selectedProjectObj.name}` : ''}
              </h3>
              <p style={{ fontSize: '0.85rem', color: '#5c6c7f', fontWeight: 500, marginTop: 6, marginBottom: 0 }}>
                {t.unitsSubtitle}
              </p>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#5c6c7f' }}>
                {lang === 'en' ? 'Select Compound' : 'اختر الكمبوند'}:
              </span>
              <select
                style={{
                  padding: '10px 20px', borderRadius: '12px', border: '1.5px solid rgba(0, 61, 166, 0.15)',
                  background: '#ffffff', fontSize: '0.85rem', fontWeight: 700, color: '#003DA6', outline: 'none',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.01)', transition: 'all 0.3s ease'
                }}
                value={selectedProjectId}
                onChange={e => setSelectedProjectId(e.target.value)}
              >
                {projects.map((p: any) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          </div>

          {loadingUnits ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
              <div className="animate-spin" style={{
                width: 32, height: 32, border: '3.5px solid rgba(0, 61, 166, 0.15)',
                borderTopColor: '#003DA6', borderRadius: '50%'
              }} />
            </div>
          ) : !selectedProjectId ? (
            <div style={{ padding: '40px 0', textAlign: 'center', color: '#5c6c7f', fontSize: '0.88rem' }}>
              <Info size={18} style={{ verticalAlign: 'middle', marginRight: 6 }} />
              {t.unitPlaceholder}
            </div>
          ) : units.length === 0 ? (
            <div style={{ padding: '40px 0', textAlign: 'center', color: '#5c6c7f', fontSize: '0.88rem' }}>
              <AlertCircle size={18} style={{ verticalAlign: 'middle', marginRight: 6 }} />
              {t.unitEmpty}
            </div>
          ) : (
            <div className="mv-table-container" style={{ overflowX: 'auto' }}>
              <table className="mv-table">
                <thead>
                  <tr>
                    <th style={{ textAlign: 'start' }}>{t.unitNo}</th>
                    <th style={{ textAlign: 'start' }}>{t.unitType}</th>
                    <th style={{ textAlign: 'start' }}>{t.unitArea}</th>
                    <th style={{ textAlign: 'start' }}>{t.unitBedrooms}/{t.unitBathrooms}</th>
                    <th style={{ textAlign: 'end' }}>{t.unitPrice}</th>
                    <th style={{ width: 150 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {units.map((unit: any) => (
                    <tr key={unit.id}>
                      <td style={{ fontWeight: 800, fontSize: '0.88rem', color: '#003DA6' }}>
                        {unit.building} - {unit.unit_number}
                      </td>
                      <td style={{ fontWeight: 600, color: '#0f172a' }}>{unit.type}</td>
                      <td style={{ color: '#5c6c7f' }}>{parseFloat(unit.area).toFixed(0)} m²</td>
                      <td style={{ color: '#5c6c7f' }}>
                        {unit.bedrooms} <span style={{ opacity: 0.65 }}>Beds</span> / {unit.bathrooms} <span style={{ opacity: 0.65 }}>Baths</span>
                      </td>
                      <td style={{ fontSize: '0.92rem', fontWeight: 800, textAlign: 'end', color: '#003DA6' }}>
                        EGP {parseFloat(unit.price).toLocaleString(undefined, { minimumFractionDigits: 0 })}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <button className="btn-luxury-primary" onClick={() => openEoiModal(selectedProjectObj, unit)} style={{
                          fontSize: '0.75rem', padding: '8px 16px', borderRadius: '8px'
                        }}>
                          {t.unitAction}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {/* ───────────────────────────────────────────────────
         Media Showcase Gallery
         ─────────────────────────────────────────────────── */}
      <section id="gallery" style={{ padding: '100px 24px', background: 'rgba(0, 61, 166, 0.02)', borderTop: '1px solid rgba(0, 61, 166, 0.06)', borderBottom: '1px solid rgba(0, 61, 166, 0.06)' }}>
        <div style={{ maxWidth: 1250, margin: '0 auto', width: '100%' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: 48 }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#C5A880', letterSpacing: '0.25em', textTransform: 'uppercase', marginBottom: 12 }}>
              {lang === 'en' ? 'VIRTUAL SHOWCASE' : 'عرض مرئي'}
            </span>
            <h2 style={{ fontSize: '2.6rem', fontWeight: 800, color: '#001A70', marginBottom: 18, fontFamily: 'var(--font-title)', letterSpacing: '-0.02em' }}>
              {t.galleryTitle}
            </h2>
            <div style={{ width: 50, height: 4, background: 'linear-gradient(90deg, #003DA6, #C5A880)', borderRadius: 99, marginBottom: 18 }} />
            <p style={{ fontSize: '0.95rem', color: '#5c6c7f', maxWidth: 560, margin: '0 auto', fontWeight: 500, lineHeight: 1.65 }}>
              {t.gallerySubtitle}
            </p>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginBottom: 40, flexWrap: 'wrap' }}>
            {['all', 'exterior', 'interior', 'amenities'].map(cat => (
              <button
                key={cat}
                onClick={() => setGalleryTab(cat)}
                style={{
                  padding: '10px 24px',
                  borderRadius: '999px',
                  border: '1.5px solid rgba(0, 61, 166, 0.15)',
                  background: galleryTab === cat ? 'linear-gradient(135deg, #003DA6 0%, #001A70 100%)' : '#ffffff',
                  color: galleryTab === cat ? '#ffffff' : '#003DA6',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  boxShadow: galleryTab === cat ? '0 4px 12px rgba(0, 61, 166, 0.15)' : '0 4px 10px rgba(0, 0, 0, 0.01)'
                }}
              >
                {cat === 'all' && t.galleryAll}
                {cat === 'exterior' && t.galleryExterior}
                {cat === 'interior' && t.galleryInterior}
                {cat === 'amenities' && t.galleryAmenities}
              </button>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 32 }}>
            {filteredGallery.map((img, idx) => (
              <div key={idx} className="mv-card" style={{
                padding: 14,
                display: 'flex',
                flexDirection: 'column'
              }}>
                <div className="gallery-image-container">
                  <img
                    src={img.url}
                    alt={img.title[lang]}
                  />
                  {idx % 3 === 1 && (
                    <div style={{
                      position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                      width: 52, height: 52, borderRadius: '50%', background: 'rgba(0, 61, 166, 0.9)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff', cursor: 'pointer',
                      boxShadow: '0 6px 16px rgba(0,0,0,0.2)', zIndex: 3
                    }}>
                      <Play size={20} fill="#ffffff" style={{ marginLeft: lang === 'en' ? 3 : 0 }} />
                    </div>
                  )}
                  <div style={{
                    position: 'absolute', bottom: 14, left: 14, background: 'rgba(255,255,255,0.92)',
                    padding: '6px 14px', borderRadius: '999px', fontSize: '0.68rem', fontWeight: 800, color: '#003DA6',
                    border: '1px solid rgba(0, 61, 166, 0.15)', zIndex: 3
                  }}>
                    {img.category.toUpperCase()}
                  </div>
                </div>
                <div style={{ padding: '16px 8px 4px 8px' }}>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#001A70', fontFamily: 'var(--font-title)' }}>{img.title[lang]}</h4>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────────────────────────────────────────────────
         FAQ Section
         ─────────────────────────────────────────────────── */}
      <section id="faq" style={{ padding: '100px 24px', maxWidth: 900, margin: '0 auto', width: '100%' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: 48 }}>
          <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#C5A880', letterSpacing: '0.25em', textTransform: 'uppercase', marginBottom: 12 }}>
            {lang === 'en' ? 'COMMON QUESTIONS' : 'الأسئلة الشائعة'}
          </span>
          <h2 style={{ fontSize: '2.6rem', fontWeight: 800, color: '#001A70', marginBottom: 18, fontFamily: 'var(--font-title)', letterSpacing: '-0.02em' }}>
            {t.faqTitle}
          </h2>
          <div style={{ width: 50, height: 4, background: 'linear-gradient(90deg, #003DA6, #C5A880)', borderRadius: 99, marginBottom: 18 }} />
          <p style={{ fontSize: '0.95rem', color: '#5c6c7f', fontWeight: 500, lineHeight: 1.65 }}>
            {t.faqSubtitle}
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {faqItems.map((item, idx) => {
            const isOpen = activeFaq === idx;
            return (
              <div key={idx} className="faq-accordion" style={{
                padding: 24, cursor: 'pointer',
                borderColor: isOpen ? '#003DA6' : 'rgba(0, 61, 166, 0.08)',
                background: isOpen ? '#ffffff' : 'rgba(255, 255, 255, 0.7)',
                boxShadow: isOpen ? '0 10px 30px rgba(0, 61, 166, 0.04)' : 'none'
              }} onClick={() => setActiveFaq(isOpen ? null : idx)}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h4 style={{ fontSize: '1rem', fontWeight: 800, color: isOpen ? '#003DA6' : '#1e293b', fontFamily: 'var(--font-title)' }}>
                    {item.q[lang]}
                  </h4>
                  <ChevronDown
                    size={18}
                    color="#5c6c7f"
                    style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s ease' }}
                  />
                </div>
                {isOpen && (
                  <div style={{ marginTop: 18, borderTop: '1px solid rgba(0, 61, 166, 0.08)', paddingTop: 18 }}>
                    <p style={{ fontSize: '0.88rem', color: '#5c6c7f', lineHeight: 1.65, fontWeight: 500 }}>
                      {item.a[lang]}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ───────────────────────────────────────────────────
         Contact Us Section
         ─────────────────────────────────────────────────── */}
      <section id="contact" style={{ padding: '40px 24px 100px 24px', maxWidth: 1050, margin: '0 auto', width: '100%' }}>
        <div className="mv-card" style={{ padding: 48, background: '#ffffff' }}>
          <div className="contact-grid">
            <div style={{
              background: 'linear-gradient(135deg, #003DA6 0%, #001A70 100%)',
              borderRadius: '20px',
              padding: 40,
              color: '#ffffff',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: '0 10px 30px rgba(0, 61, 166, 0.15)'
            }}>
              <div style={{ position: 'absolute', top: -30, right: -30, width: 180, height: 180, borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
              <div>
                <h3 style={{ fontSize: '1.65rem', color: '#ffffff', fontWeight: 800, marginBottom: 14, fontFamily: 'var(--font-title)' }}>{t.contactTitle}</h3>
                <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.88rem', lineHeight: 1.6 }}>{t.contactSubtitle}</p>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginTop: 40 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: '0.88rem' }}>
                  <Phone size={18} />
                  <span>+20 2 2345 678</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: '0.88rem' }}>
                  <Mail size={18} />
                  <span>desk.sales@mv.com</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: '0.88rem' }}>
                  <MapPin size={18} />
                  <span>Mountain View HQ, New Cairo, Egypt</span>
                </div>
              </div>

              <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', borderTop: '1px solid rgba(255,255,255,0.15)', paddingTop: 20, marginTop: 40 }}>
                Mountain View Real Estate Development SAE. License No. LIC-333333
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              {contactSuccessMsg ? (
                <div style={{ textAlign: 'center', padding: '40px 10px' }}>
                  <CheckCircle size={52} color="#16a34a" style={{ marginBottom: 20 }} />
                  <h4 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#001A70', marginBottom: 12, fontFamily: 'var(--font-title)' }}>{lang === 'en' ? 'Thank You!' : 'شكراً لك!'}</h4>
                  <p style={{ fontSize: '0.9rem', color: '#5c6c7f' }}>{contactSuccessMsg}</p>
                </div>
              ) : (
                <form onSubmit={handleContactSubmit}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 18 }}>
                    <div>
                      <label style={{ fontSize: '0.78rem', fontWeight: 800, color: '#1e293b', display: 'block', marginBottom: 8 }}>{t.contactFirstName} *</label>
                      <input
                        className="mv-input"
                        type="text" required value={contactForm.first_name}
                        onChange={e => setContactForm({ ...contactForm, first_name: e.target.value })}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.78rem', fontWeight: 800, color: '#1e293b', display: 'block', marginBottom: 8 }}>{t.contactLastName} *</label>
                      <input
                        className="mv-input"
                        type="text" required value={contactForm.last_name}
                        onChange={e => setContactForm({ ...contactForm, last_name: e.target.value })}
                      />
                    </div>
                  </div>

                  <div style={{ marginBottom: 18 }}>
                    <label style={{ fontSize: '0.78rem', fontWeight: 800, color: '#1e293b', display: 'block', marginBottom: 8 }}>{t.contactEmail} *</label>
                    <input
                      className="mv-input"
                      type="email" required value={contactForm.email}
                      onChange={e => setContactForm({ ...contactForm, email: e.target.value })}
                    />
                  </div>

                  <div style={{ marginBottom: 18 }}>
                    <label style={{ fontSize: '0.78rem', fontWeight: 800, color: '#1e293b', display: 'block', marginBottom: 8 }}>{t.contactPhone} *</label>
                    <input
                      className="mv-input"
                      type="text" required placeholder="+201..." value={contactForm.phone}
                      onChange={e => setContactForm({ ...contactForm, phone: e.target.value })}
                    />
                  </div>

                  <div style={{ marginBottom: 24 }}>
                    <label style={{ fontSize: '0.78rem', fontWeight: 800, color: '#1e293b', display: 'block', marginBottom: 8 }}>{t.contactMessage} *</label>
                    <textarea
                      rows={4}
                      className="mv-input"
                      style={{ outline: 'none', resize: 'none' }}
                      required value={contactForm.message}
                      onChange={e => setContactForm({ ...contactForm, message: e.target.value })}
                    />
                  </div>

                  <button type="submit" className="btn-luxury-primary" style={{ width: '100%', justifyContent: 'center', padding: '14px' }} disabled={sendingContact}>
                    {sendingContact ? (lang === 'en' ? 'Sending...' : 'جاري الإرسال...') : t.contactSubmit}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ marginTop: 'auto', padding: 40, textAlign: 'center', borderTop: '1px solid rgba(0, 61, 166, 0.08)', background: 'rgba(255, 255, 255, 0.65)' }}>
        <p style={{ fontSize: '0.82rem', color: '#5c6c7f', fontWeight: 600 }}>
          © {new Date().getFullYear()} {t.footerRights}
        </p>
      </footer>

      {/* ───────────────────────────────────────────────────
         EOI PAYMENT MODAL PORTAL (Simulated Pay Gate)
         ─────────────────────────────────────────────────── */}
      {showEoiModal && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{
            maxWidth: 580, width: 'calc(100% - 32px)', padding: 36, borderRadius: '24px',
            maxHeight: '92vh', overflowY: 'auto', position: 'relative', border: '1.5px solid rgba(0, 61, 166, 0.15)'
          }}>
            <button
              onClick={() => setShowEoiModal(false)}
              style={{
                position: 'absolute', top: 24, right: 24,
                background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.5rem', color: '#5c6c7f',
                fontWeight: 'bold', padding: 4
              }}
            >
              ✕
            </button>

            <div style={{ marginBottom: 24, paddingRight: 24 }}>
              <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#001A70', marginBottom: 8, fontFamily: 'var(--font-title)' }}>
                {t.eoiModalTitle}
              </h3>
              <p style={{ fontSize: '0.78rem', color: '#5c6c7f', fontWeight: 500 }}>
                {t.eoiModalSubtitle}
              </p>
            </div>

            {errorMessage && (
              <div style={{
                background: 'rgba(239, 68, 68, 0.05)', color: '#ef4444', padding: '14px 18px',
                borderRadius: '12px', fontSize: '0.8rem', fontWeight: 600, display: 'flex',
                alignItems: 'center', gap: 10, marginBottom: 20, border: '1px solid rgba(239, 68, 68, 0.15)'
              }}>
                <AlertCircle size={16} />
                <span>{errorMessage}</span>
              </div>
            )}

            {eoiStep < 3 ? (
              <form onSubmit={handleEoiSubmit}>
                <div style={{
                  padding: 20, background: 'rgba(0, 61, 166, 0.02)', marginBottom: 24, borderRadius: '16px',
                  border: '1px solid rgba(0, 61, 166, 0.08)'
                }}>
                  <div style={{ fontSize: '0.85rem', display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ color: '#5c6c7f' }}>{t.eoiSelectedProject}:</span>
                    <strong style={{ color: '#001A70' }}>{eoiProject?.name}</strong>
                  </div>
                  {eoiUnit && (
                    <div style={{ fontSize: '0.85rem', display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span style={{ color: '#5c6c7f' }}>{t.eoiSelectedUnit}:</span>
                      <strong style={{ color: '#001A70' }}>{eoiUnit.building} - {eoiUnit.unit_number}</strong>
                    </div>
                  )}
                  <div style={{ fontSize: '0.85rem', display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(0, 61, 166, 0.08)', paddingTop: 10, marginTop: 10 }}>
                    <span style={{ color: '#003DA6', fontWeight: 800 }}>{t.eoiAmountLabel}:</span>
                    <strong style={{ color: '#001A70', fontWeight: 900 }}>EGP 50,000.00</strong>
                  </div>
                  <span style={{ fontSize: '0.68rem', color: '#5c6c7f', display: 'block', textAlign: 'right', marginTop: 6 }}>
                    * {t.eoiAmountDesc}
                  </span>
                </div>

                {/* STEP 1: Personal Info */}
                {eoiStep === 1 && (
                  <div>
                    <h4 style={{ fontSize: '0.88rem', fontWeight: 800, textTransform: 'uppercase', color: '#003DA6', letterSpacing: '0.06em', borderBottom: '1px solid rgba(0, 61, 166, 0.08)', paddingBottom: 10, marginBottom: 20, fontFamily: 'var(--font-title)' }}>
                      {t.eoiFormPersonal}
                    </h4>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                      <div>
                        <label style={{ fontSize: '0.78rem', fontWeight: 800, color: '#1e293b', display: 'block', marginBottom: 8 }}>{t.contactFirstName} *</label>
                        <input
                          className="mv-input"
                          type="text" required value={eoiForm.first_name}
                          onChange={e => setEoiForm({ ...eoiForm, first_name: e.target.value })}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '0.78rem', fontWeight: 800, color: '#1e293b', display: 'block', marginBottom: 8 }}>{t.contactLastName} *</label>
                        <input
                          className="mv-input"
                          type="text" required value={eoiForm.last_name}
                          onChange={e => setEoiForm({ ...eoiForm, last_name: e.target.value })}
                        />
                      </div>
                    </div>

                    <div style={{ marginBottom: 14 }}>
                      <label style={{ fontSize: '0.78rem', fontWeight: 800, color: '#1e293b', display: 'block', marginBottom: 8 }}>{t.contactEmail} *</label>
                      <input
                        className="mv-input"
                        type="email" required value={eoiForm.email}
                        onChange={e => setEoiForm({ ...eoiForm, email: e.target.value })}
                      />
                    </div>

                    <div style={{ marginBottom: 14 }}>
                      <label style={{ fontSize: '0.78rem', fontWeight: 800, color: '#1e293b', display: 'block', marginBottom: 8 }}>{t.contactPhone} *</label>
                      <input
                        className="mv-input"
                        type="text" required placeholder="+201..." value={eoiForm.phone}
                        onChange={e => setEoiForm({ ...eoiForm, phone: e.target.value })}
                      />
                    </div>

                    <div style={{ marginBottom: 24 }}>
                      <label style={{ fontSize: '0.78rem', fontWeight: 800, color: '#1e293b', display: 'block', marginBottom: 8 }}>{t.eoiNationalId}</label>
                      <input
                        className="mv-input"
                        type="text" placeholder="29001011234567" value={eoiForm.national_id}
                        onChange={e => setEoiForm({ ...eoiForm, national_id: e.target.value })}
                      />
                    </div>

                    <button type="submit" className="btn-luxury-primary" style={{ width: '100%', justifyContent: 'center', padding: '14px' }}>
                      {lang === 'en' ? 'Continue to Payment' : 'المتابعة إلى الدفع'}
                      {lang === 'en' ? <ArrowRight size={15} /> : <ArrowLeft size={15} />}
                    </button>
                  </div>
                )}

                {/* STEP 2: Credit Card Simulated Details */}
                {eoiStep === 2 && (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, borderBottom: '1px solid rgba(0, 61, 166, 0.08)', paddingBottom: 10 }}>
                      <h4 style={{ fontSize: '0.88rem', fontWeight: 800, textTransform: 'uppercase', color: '#003DA6', letterSpacing: '0.06em', fontFamily: 'var(--font-title)' }}>
                        {t.eoiFormPayment}
                      </h4>
                      <button type="button" onClick={() => setEoiStep(1)} style={{ background: 'none', border: 'none', color: '#003DA6', fontSize: '0.8rem', fontWeight: 800, cursor: 'pointer' }}>
                        {lang === 'en' ? '← Back' : '← رجوع'}
                      </button>
                    </div>

                    <div style={{ background: 'rgba(22, 163, 74, 0.06)', padding: 16, borderRadius: '12px', border: '1px solid rgba(22, 163, 74, 0.15)', display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                      <Lock size={18} color="#16a34a" />
                      <span style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: 600 }}>
                        {lang === 'en' ? 'SSL Secure checkout. Card values will be authorized on our merchant gateway.' : 'بوابة دفع مشفرة آمنة. سيتم حجز وتأكيد المعاملة مالياً.'}
                      </span>
                    </div>

                    <div style={{ marginBottom: 14 }}>
                      <label style={{ fontSize: '0.78rem', fontWeight: 800, color: '#1e293b', display: 'block', marginBottom: 8 }}>{t.eoiCardName} *</label>
                      <input
                        className="mv-input"
                        type="text" required placeholder="John Doe" value={eoiForm.card_name}
                        onChange={e => setEoiForm({ ...eoiForm, card_name: e.target.value })}
                      />
                    </div>

                    <div style={{ marginBottom: 14 }}>
                      <label style={{ fontSize: '0.78rem', fontWeight: 800, color: '#1e293b', display: 'block', marginBottom: 8 }}>{t.eoiCardNo} *</label>
                      <div style={{ position: 'relative' }}>
                        <input
                          className="mv-input"
                          style={{ paddingLeft: '44px', paddingRight: '44px' }}
                          type="text" required placeholder="4000 1234 5678 9010" value={eoiForm.card_no}
                          onChange={e => setEoiForm({ ...eoiForm, card_no: e.target.value })}
                        />
                        <CreditCard size={16} style={{ position: 'absolute', left: 16, top: 15 }} color="#5c6c7f" />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 24 }}>
                      <div>
                        <label style={{ fontSize: '0.78rem', fontWeight: 800, color: '#1e293b', display: 'block', marginBottom: 8 }}>{t.eoiCardExp} *</label>
                        <input
                          className="mv-input"
                          type="text" required placeholder="12/28" value={eoiForm.card_exp}
                          onChange={e => setEoiForm({ ...eoiForm, card_exp: e.target.value })}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '0.78rem', fontWeight: 800, color: '#1e293b', display: 'block', marginBottom: 8 }}>{t.eoiCardCvv} *</label>
                        <input
                          className="mv-input"
                          type="password" required maxLength={3} placeholder="•••" value={eoiForm.card_cvv}
                          onChange={e => setEoiForm({ ...eoiForm, card_cvv: e.target.value })}
                        />
                      </div>
                    </div>

                    <button type="submit" className="btn-luxury-primary" style={{ width: '100%', justifyContent: 'center', padding: '14px' }} disabled={eoiProcessing}>
                      {eoiProcessing ? (
                        <>
                          <div className="animate-spin" style={{ width: 14, height: 14, border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: '50%', marginRight: 8 }} />
                          {t.eoiProcessing}
                        </>
                      ) : t.eoiPaySubmit}
                    </button>
                  </div>
                )}
              </form>
            ) : (
              /* STEP 3: Booking Success Ticket */
              <div style={{ textAlign: 'center', padding: '20px 0 10px 0' }}>
                <CheckCircle size={56} color="#16a34a" style={{ marginBottom: 20 }} />
                <h4 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#001A70', marginBottom: 10, fontFamily: 'var(--font-title)' }}>
                  {t.eoiSuccessTitle}
                </h4>
                <p style={{ fontSize: '0.85rem', color: '#5c6c7f', marginBottom: 28, maxWidth: 440, margin: '0 auto 28px auto', lineHeight: 1.6 }}>
                  {t.eoiSuccessDesc}
                </p>

                <div style={{
                  background: 'radial-gradient(circle, rgba(0, 61, 166, 0.05) 0%, rgba(255,255,255,0.8) 100%)',
                  border: '2px dashed #003DA6',
                  borderRadius: '20px',
                  padding: '28px 32px',
                  maxWidth: 380,
                  margin: '0 auto 32px auto',
                  boxShadow: '0 8px 30px rgba(0, 61, 166, 0.04)'
                }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#003DA6', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 8 }}>
                    {t.eoiTicketNo}
                  </span>
                  <strong style={{ fontSize: '3rem', color: '#001A70', fontFamily: 'var(--font-title)', display: 'block', lineHeight: 1, fontWeight: 900 }}>
                    #{eoiResult?.queue_number || '1'}
                  </strong>
                  <span style={{ fontSize: '0.72rem', color: '#5c6c7f', display: 'block', marginTop: 12, fontWeight: 700 }}>
                    Compound: {eoiProject?.name}
                  </span>
                  {eoiUnit && (
                    <span style={{ fontSize: '0.72rem', color: '#5c6c7f', display: 'block', fontWeight: 700 }}>
                      Allocated Unit: {eoiUnit.building} - {eoiUnit.unit_number}
                    </span>
                  )}
                  <span style={{ fontSize: '0.68rem', color: '#5c6c7f', display: 'block', opacity: 0.8, marginTop: 8, fontFamily: 'monospace' }}>
                    Reference: {eoiResult?.data?.id}
                  </span>
                </div>

                <button className="btn-luxury-primary" onClick={() => setShowEoiModal(false)} style={{ padding: '12px 36px', fontSize: '0.85rem' }}>
                  {t.eoiClose}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────
         Mobile Drawer Navigation Overlay
         ─────────────────────────────────────────────────── */}
      {mobileMenuOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0, 15, 61, 0.35)',
          backdropFilter: 'blur(8px)',
          zIndex: 1000,
          display: 'flex',
          justifyContent: dir === 'ltr' ? 'flex-end' : 'flex-start',
          animation: 'drawer-fade-in 0.3s ease-out'
        }} onClick={() => setMobileMenuOpen(false)}>
          <div style={{
            width: '300px',
            height: '100%',
            background: 'rgba(255, 255, 255, 0.92)',
            backdropFilter: 'blur(28px)',
            borderLeft: dir === 'ltr' ? '1.5px solid rgba(0, 61, 166, 0.1)' : 'none',
            borderRight: dir === 'rtl' ? '1.5px solid rgba(0, 61, 166, 0.1)' : 'none',
            boxShadow: '-10px 0 30px rgba(0, 15, 61, 0.1)',
            padding: '32px 24px',
            display: 'flex',
            flexDirection: 'column',
            gap: 28,
            animation: dir === 'ltr' ? 'drawer-slide-in-ltr 0.3s cubic-bezier(0.16, 1, 0.3, 1)' : 'drawer-slide-in-rtl 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
          }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <img
                src="/mountain_view_logo.png"
                alt="Mountain View Logo"
                style={{ 
                  height: '32px', 
                  width: 'auto', 
                  objectFit: 'contain',
                  filter: 'brightness(0) saturate(100%) invert(16%) sepia(61%) saturate(5185%) hue-rotate(217deg) brightness(92%) contrast(109%)'
                }}
              />
              <button onClick={() => setMobileMenuOpen(false)} style={{
                background: 'none', border: 'none', cursor: 'pointer', color: '#5c6c7f'
              }}>
                <X size={24} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <a href="#projects" className="mv-nav-link" style={{ fontSize: '1.05rem', paddingBottom: '10px', borderBottom: '1px solid rgba(0, 61, 166, 0.08)' }} onClick={() => setMobileMenuOpen(false)}>{t.navProjects}</a>
              <a href="#gallery" className="mv-nav-link" style={{ fontSize: '1.05rem', paddingBottom: '10px', borderBottom: '1px solid rgba(0, 61, 166, 0.08)' }} onClick={() => setMobileMenuOpen(false)}>{t.navGallery}</a>
              <a href="#faq" className="mv-nav-link" style={{ fontSize: '1.05rem', paddingBottom: '10px', borderBottom: '1px solid rgba(0, 61, 166, 0.08)' }} onClick={() => setMobileMenuOpen(false)}>{t.navFaq}</a>
              <a href="#contact" className="mv-nav-link" style={{ fontSize: '1.05rem', paddingBottom: '10px', borderBottom: '1px solid rgba(0, 61, 166, 0.08)' }} onClick={() => setMobileMenuOpen(false)}>{t.navContact}</a>
            </div>

            <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
              <button onClick={() => { toggleLanguage(); setMobileMenuOpen(false); }} style={{
                background: '#ffffff', border: '1.5px solid rgba(0, 61, 166, 0.15)',
                borderRadius: '12px', padding: '12px 16px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, fontSize: '0.92rem', fontWeight: 700,
                color: '#003DA6', width: '100%', transition: 'all 0.3s ease'
              }}>
                <Globe size={18} />
                {lang === 'en' ? 'العربية' : 'English'}
              </button>

              {isLoggedIn ? (
                <button className="btn-luxury-primary" onClick={() => { navigate('/dashboard'); setMobileMenuOpen(false); }} style={{ width: '100%', justifyContent: 'center', borderRadius: '12px', padding: '12px' }}>
                  {t.navDashboard}
                  {lang === 'en' ? <ArrowRight size={18} /> : <ArrowLeft size={18} />}
                </button>
              ) : (
                <button onClick={() => { navigate('/login'); setMobileMenuOpen(false); }} style={{
                  width: '100%', padding: '12px', borderRadius: '12px', border: '1.5px solid #003DA6', color: '#003DA6', background: 'transparent', cursor: 'pointer', fontWeight: 700, fontSize: '0.92rem', textAlign: 'center', transition: 'all 0.3s ease'
                }}>
                  {t.navLogin}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default LandingPage;
