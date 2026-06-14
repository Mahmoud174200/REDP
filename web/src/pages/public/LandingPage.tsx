import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import {
  Globe, Building, MapPin, Calendar, Compass, Layers, CheckCircle,
  Phone, Mail, ArrowRight, ArrowLeft, Star, CreditCard, Lock, ChevronDown,
  Info, AlertCircle, Play
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
    title: { en: 'Community Workspace Hub Lounge', ar: 'قاعة مركز الأعمال المشرك ومساحات العمل' }
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
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      background: '#f8fafc', fontFamily: 'var(--font-body)', overflowX: 'hidden'
    }}>
      
      {/* ───────────────────────────────────────────────────
         CSS Styles injection matching Login Style and Layout
         ─────────────────────────────────────────────────── */}
      <style dangerouslySetInnerHTML={{__html: `
        .luxury-text-gradient {
          background: linear-gradient(135deg, #003DA6 0%, #00205b 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .landing-hero-video-container {
          position: relative;
          width: 100%;
          min-height: 85vh;
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
          background: linear-gradient(135deg, rgba(0, 15, 61, 0.78) 0%, rgba(0, 15, 61, 0.5) 60%, rgba(0, 15, 61, 0.85) 100%);
          z-index: 2;
        }
        .landing-hero-content {
          position: relative;
          z-index: 3;
          max-width: 900px;
          padding: 40px 24px;
          text-align: center;
          color: #ffffff;
        }
        .btn-luxury-blue {
          background: linear-gradient(135deg, #003DA6 0%, #00205b 100%);
          color: #ffffff !important;
          border: 1px solid rgba(0, 61, 166, 0.15);
          box-shadow: 0 4px 14px rgba(0, 61, 166, 0.25);
          font-family: var(--font-title);
          font-weight: 700;
          padding: 12px 28px;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }
        .btn-luxury-blue:hover {
          transform: translateY(-2px);
          background: linear-gradient(135deg, #004cce 0%, #002d7a 100%);
          box-shadow: 0 6px 20px rgba(0, 61, 166, 0.45);
        }
        .btn-luxury-outline {
          background: rgba(255, 255, 255, 0.1);
          color: #ffffff !important;
          border: 1px solid rgba(255, 255, 255, 0.25);
          backdrop-filter: blur(8px);
          font-family: var(--font-title);
          font-weight: 600;
          padding: 12px 24px;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.3s ease;
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }
        .btn-luxury-outline:hover {
          background: #ffffff;
          color: #00205b !important;
          border-color: #ffffff;
          transform: translateY(-1px);
        }
        .mv-navbar {
          position: sticky; top: 0; z-index: 100;
          background: rgba(255, 255, 255, 0.92);
          backdrop-filter: blur(14px);
          border-bottom: 1px solid rgba(0, 61, 166, 0.08);
          padding: 16px 40px;
          display: flex; justifyContent: space-between; alignItems: center;
          transition: all 0.3s ease;
        }
        .mv-nav-link {
          color: #475569 !important;
          text-decoration: none;
          font-size: 0.82rem;
          font-weight: 700;
          transition: all 0.3s ease;
        }
        .mv-nav-link:hover {
          color: #003DA6 !important;
        }
        .mv-card {
          background: #ffffff;
          border: 1px solid rgba(0, 61, 166, 0.08);
          border-radius: 20px;
          box-shadow: 0 4px 20px rgba(0, 61, 166, 0.02);
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .mv-card:hover {
          transform: translateY(-4px);
          border-color: #003DA6;
          box-shadow: 0 12px 30px rgba(0, 61, 166, 0.07);
        }
        .mv-table th {
          background: rgba(0, 61, 166, 0.02);
          color: #003DA6 !important;
          font-weight: 800;
          font-size: 0.72rem;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          padding: 14px 20px;
          border-bottom: 2px solid rgba(0, 61, 166, 0.08);
        }
        .mv-table td {
          padding: 18px 20px;
          border-bottom: 1px solid rgba(0, 61, 166, 0.04);
          font-size: 0.82rem;
          color: #334155;
        }
        .mv-table tr:hover td {
          background: rgba(0, 61, 166, 0.01);
        }
        .mv-input {
          width: 100%;
          padding: 11px 16px;
          background: #ffffff;
          border: 1px solid rgba(0, 61, 166, 0.15);
          border-radius: 12px;
          color: #0f172a;
          font-size: 0.85rem;
          transition: all 0.3s ease;
        }
        .mv-input:focus {
          outline: none;
          border-color: #003DA6;
          box-shadow: 0 0 12px rgba(0, 61, 166, 0.15);
        }
        .faq-accordion {
          border: 1px solid rgba(0, 61, 166, 0.08);
          border-radius: 14px;
          background: #ffffff;
          transition: all 0.3s ease;
        }
        .faq-accordion:hover {
          border-color: #003DA6;
        }
      `}} />

      {/* ───────────────────────────────────────────────────
         Navbar Section
         ─────────────────────────────────────────────────── */}
      <nav className="mv-navbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <img
            src="/mountain_view_logo.png"
            alt="Mountain View Logo"
            style={{ height: '32px', width: 'auto', objectFit: 'contain' }}
          />
        </div>

        <div className="topbar-links" style={{ display: 'flex', gap: 28 }}>
          <a href="#projects" className="mv-nav-link">{t.navProjects}</a>
          <a href="#gallery" className="mv-nav-link">{t.navGallery}</a>
          <a href="#faq" className="mv-nav-link">{t.navFaq}</a>
          <a href="#contact" className="mv-nav-link">{t.navContact}</a>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <button onClick={toggleLanguage} style={{
            background: '#ffffff', border: '1px solid rgba(0, 61, 166, 0.15)',
            borderRadius: '999px', padding: '6px 14px', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', fontWeight: 750,
            color: '#003DA6', transition: 'all 0.3s ease'
          }}>
            <Globe size={14} />
            {lang === 'en' ? 'العربية' : 'English'}
          </button>

          {isLoggedIn ? (
            <button className="btn-luxury-blue" onClick={() => navigate('/dashboard')} style={{ fontSize: '0.78rem', padding: '8px 20px', borderRadius: 999 }}>
              {t.navDashboard}
              {lang === 'en' ? <ArrowRight size={14} /> : <ArrowLeft size={14} />}
            </button>
          ) : (
            <button onClick={() => navigate('/login')} style={{
              fontSize: '0.78rem', padding: '8px 20px', borderRadius: 999, border: '1px solid #003DA6', color: '#003DA6', background: 'transparent', cursor: 'pointer', fontWeight: 700
            }}>
              {t.navLogin}
            </button>
          )}
        </div>
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
        
        <div className="landing-hero-content animate-fade-in">
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'rgba(255, 255, 255, 0.15)', border: '1px solid rgba(255, 255, 255, 0.25)',
            color: '#ffffff', borderRadius: 999, padding: '6px 18px', fontSize: '0.75rem', fontWeight: 800,
            marginBottom: 24, textTransform: 'uppercase', letterSpacing: '0.05em'
          }}>
            <Star size={12} fill="#ffffff" />
            <span style={{ color: '#ffffff' }}>
              {lang === 'en' ? 'Mountain View Luxury Living' : 'ماونتن فيو للحياة الراقية'}
            </span>
          </div>
          
          {/* Explicit color override to pure white and shadow to avoid dark text inheriting from index.css */}
          <h1 style={{
            fontSize: '3.6rem', lineHeight: 1.1, fontWeight: 800,
            marginBottom: 20, fontFamily: 'Cinzel, var(--font-title)', letterSpacing: '-0.03em',
            color: '#ffffff', textShadow: '0 4px 20px rgba(0, 0, 0, 0.5)'
          }}>
            {t.heroTitle}
          </h1>
          
          <p style={{
            fontSize: '1.05rem', color: '#f8fafc', lineHeight: 1.6,
            marginBottom: 36, maxWidth: 720, margin: '0 auto 36px auto', fontWeight: 400,
            textShadow: '0 2px 10px rgba(0, 0, 0, 0.4)'
          }}>
            {t.heroSubtitle}
          </p>

          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', justifyContent: 'center' }}>
            {projects.length > 0 ? (
              <button className="btn-luxury-blue" onClick={() => openEoiModal(projects[0])} style={{ padding: '14px 34px', fontSize: '0.88rem' }}>
                <CreditCard size={18} />
                {t.heroCta}
              </button>
            ) : (
              <button className="btn-luxury-blue" onClick={() => {
                const el = document.getElementById('contact');
                el?.scrollIntoView({ behavior: 'smooth' });
              }} style={{ padding: '14px 34px', fontSize: '0.88rem' }}>
                {t.navContact}
              </button>
            )}
            <a href="#projects" className="btn-luxury-outline" style={{ padding: '14px 30px', fontSize: '0.88rem', textDecoration: 'none' }}>
              {t.heroSecondary}
            </a>
          </div>
        </div>
      </header>

      {/* ───────────────────────────────────────────────────
         Projects Catalog Section
         ─────────────────────────────────────────────────── */}
      <section id="projects" style={{ padding: '80px 24px 60px 24px', maxWidth: 1200, margin: '0 auto', width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          {/* Explicit color override to deep blue */}
          <h2 style={{ fontSize: '2rem', fontWeight: 800, color: '#00205b', marginBottom: 12, fontFamily: 'Cinzel, var(--font-title)' }}>
            {t.projectsTitle}
          </h2>
          <p style={{ fontSize: '0.85rem', color: '#64748b', maxWidth: 540, margin: '0 auto', fontWeight: 500 }}>
            {t.projectsSubtitle}
          </p>
        </div>

        {loadingProjects ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
            <div className="animate-spin" style={{
              width: 32, height: 32, border: '4px solid rgba(0, 61, 166, 0.15)',
              borderTopColor: '#003DA6', borderRadius: '50%'
            }} />
          </div>
        ) : (
          <div className="grid-cards" style={{ gap: 28, marginBottom: 48 }}>
            {projects.map((project: any) => {
              const hasUnits = project.units_count > 0;
              return (
                <div key={project.id} className="mv-card" style={{
                  padding: 28, display: 'flex', flexDirection: 'column',
                  justifyContent: 'space-between', background: '#ffffff'
                }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                      <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#00205b' }}>{project.name}</h3>
                      <span className="badge" style={{
                        fontSize: '0.65rem', background: 'rgba(0, 61, 166, 0.05)', color: '#003DA6', border: '1px solid rgba(0, 61, 166, 0.1)',
                        padding: '4px 10px', borderRadius: '999px', fontWeight: 700
                      }}>
                        {project.status.toUpperCase()}
                      </span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.82rem', color: '#475569' }}>
                        <MapPin size={15} color="#003DA6" />
                        <span>{t.projectLocation}: <strong style={{ color: '#0f172a' }}>{project.location}</strong></span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.82rem', color: '#475569' }}>
                        <Calendar size={15} color="#003DA6" />
                        <span>{t.projectDelivery}: <strong style={{ color: '#0f172a' }}>{project.delivery_date}</strong></span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.82rem', color: '#475569' }}>
                        <Compass size={15} color="#003DA6" />
                        <span>{t.projectAvailable}: <strong style={{ color: hasUnits ? 'var(--color-success)' : '#ef4444' }}>
                          {hasUnits ? `${project.units_count} ${lang === 'en' ? 'Units' : 'وحدة'}` : t.projectNoUnits}
                        </strong></span>
                      </div>
                    </div>

                    {project.payment_plans && project.payment_plans.length > 0 && (
                      <div style={{ borderTop: '1px solid rgba(0, 61, 166, 0.08)', paddingTop: 16, marginBottom: 24 }}>
                        <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#003DA6', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 8 }}>
                          {t.projectPlans}
                        </span>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          {project.payment_plans.slice(0, 3).map((plan: any) => (
                            <div key={plan.id} style={{ fontSize: '0.78rem', display: 'flex', justifyContent: 'space-between', color: '#334155' }}>
                              <span>• {lang === 'ar' ? (plan.name_ar || plan.name) : plan.name}</span>
                              <strong style={{ color: '#0f172a' }}>{plan.down_payment_pct}% DP / {plan.installments}m</strong>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
                    <button className="btn-luxury-outline" onClick={() => {
                      setSelectedProjectId(project.id);
                      document.getElementById('units-catalog')?.scrollIntoView({ behavior: 'smooth' });
                    }} style={{
                      flex: 1, fontSize: '0.75rem', padding: '10px 14px', justifyContent: 'center', color: '#003DA6 !important', border: '1px solid rgba(0, 61, 166, 0.25)'
                    }}>
                      <Layers size={14} color="#003DA6" />
                      {t.viewUnits}
                    </button>
                    <button className="btn-luxury-blue" onClick={() => openEoiModal(project)} style={{
                      fontSize: '0.75rem', padding: '10px 20px'
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
        <div id="units-catalog" className="mv-card" style={{ padding: 32, background: '#ffffff' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, alignItems: 'flex-start', marginBottom: 24 }}>
            <div>
              <h3 style={{ fontSize: '1.4rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 10, color: '#00205b', fontFamily: 'Cinzel, var(--font-title)' }}>
                <Building size={22} color="#003DA6" />
                {t.unitsTitle} {selectedProjectObj ? ` - ${selectedProjectObj.name}` : ''}
              </h3>
              <p style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 500, marginTop: 2 }}>
                {t.unitsSubtitle}
              </p>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 750, color: '#64748b' }}>
                {lang === 'en' ? 'Select Compound' : 'اختر الكمبوند'}:
              </span>
              <select
                style={{
                  padding: '9px 18px', borderRadius: '12px', border: '1px solid rgba(0, 61, 166, 0.15)',
                  background: '#mv-navbar', fontSize: '0.8rem', fontWeight: 700, color: '#003DA6', outline: 'none'
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
            <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
              <div className="animate-spin" style={{
                width: 24, height: 24, border: '3px solid rgba(0, 61, 166, 0.15)',
                borderTopColor: '#003DA6', borderRadius: '50%'
              }} />
            </div>
          ) : !selectedProjectId ? (
            <div style={{ padding: '30px 0', textAlign: 'center', color: '#64748b', fontSize: '0.82rem' }}>
              <Info size={16} style={{ verticalAlign: 'middle', marginRight: 4 }} />
              {t.unitPlaceholder}
            </div>
          ) : units.length === 0 ? (
            <div style={{ padding: '30px 0', textAlign: 'center', color: '#64748b', fontSize: '0.82rem' }}>
              <AlertCircle size={16} style={{ verticalAlign: 'middle', marginRight: 4 }} />
              {t.unitEmpty}
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'rgba(0, 61, 166, 0.02)' }}>
                    <th style={{ textAlign: 'left', padding: '14px 20px', color: '#003DA6', fontSize: '0.72rem', fontWeight: 800 }}>{t.unitNo}</th>
                    <th style={{ textAlign: 'left', padding: '14px 20px', color: '#003DA6', fontSize: '0.72rem', fontWeight: 800 }}>{t.unitType}</th>
                    <th style={{ textAlign: 'left', padding: '14px 20px', color: '#003DA6', fontSize: '0.72rem', fontWeight: 800 }}>{t.unitArea}</th>
                    <th style={{ textAlign: 'left', padding: '14px 20px', color: '#003DA6', fontSize: '0.72rem', fontWeight: 800 }}>{t.unitBedrooms}/{t.unitBathrooms}</th>
                    <th style={{ textAlign: 'right', padding: '14px 20px', color: '#003DA6', fontSize: '0.72rem', fontWeight: 800 }}>{t.unitPrice}</th>
                    <th style={{ padding: '14px 20px', width: 140 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {units.map((unit: any) => (
                    <tr key={unit.id} style={{ borderBottom: '1px solid rgba(0, 61, 166, 0.06)' }}>
                      <td style={{ padding: '16px 20px', fontWeight: 800, fontSize: '0.82rem', color: '#00205b' }}>
                        {unit.building} - {unit.unit_number}
                      </td>
                      <td style={{ padding: '16px 20px', fontSize: '0.82rem', fontWeight: 600, color: '#334155' }}>{unit.type}</td>
                      <td style={{ padding: '16px 20px', fontSize: '0.82rem', fontWeight: 500, color: '#334155' }}>{parseFloat(unit.area).toFixed(0)} m²</td>
                      <td style={{ padding: '16px 20px', fontSize: '0.82rem', fontWeight: 500, color: '#334155' }}>
                        {unit.bedrooms} <span style={{ opacity: 0.6 }}>Beds</span> / {unit.bathrooms} <span style={{ opacity: 0.6 }}>Baths</span>
                      </td>
                      <td style={{ padding: '16px 20px', fontSize: '0.88rem', fontWeight: 800, textAlign: 'right', color: '#003DA6' }}>
                        EGP {parseFloat(unit.price).toLocaleString(undefined, { minimumFractionDigits: 0 })}
                      </td>
                      <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                        <button className="btn-luxury-blue" onClick={() => openEoiModal(selectedProjectObj, unit)} style={{
                          fontSize: '0.7rem', padding: '8px 14px', borderRadius: '8px'
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
      <section id="gallery" style={{ padding: '80px 24px', background: '#f1f5f9', borderTop: '1px solid rgba(0, 61, 166, 0.06)', borderBottom: '1px solid rgba(0, 61, 166, 0.06)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', width: '100%' }}>
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <h2 style={{ fontSize: '2rem', fontWeight: 800, color: '#00205b', marginBottom: 12, fontFamily: 'Cinzel, var(--font-title)' }}>
              {t.galleryTitle}
            </h2>
            <p style={{ fontSize: '0.85rem', color: '#64748b', maxWidth: 520, margin: '0 auto', fontWeight: 500 }}>
              {t.gallerySubtitle}
            </p>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginBottom: 32, flexWrap: 'wrap' }}>
            {['all', 'exterior', 'interior', 'amenities'].map(cat => (
              <button
                key={cat}
                onClick={() => setGalleryTab(cat)}
                style={{
                  padding: '8px 20px', borderRadius: 999, border: '1px solid rgba(0, 61, 166, 0.15)',
                  background: galleryTab === cat ? 'linear-gradient(135deg, #003DA6 0%, #00205b 100%)' : '#ffffff',
                  color: galleryTab === cat ? '#ffffff' : '#003DA6',
                  fontSize: '0.78rem', fontWeight: 750, cursor: 'pointer', transition: 'all 0.3s ease',
                  boxShadow: galleryTab === cat ? '0 4px 10px rgba(0, 61, 166, 0.15)' : 'none'
                }}
              >
                {cat === 'all' && t.galleryAll}
                {cat === 'exterior' && t.galleryExterior}
                {cat === 'interior' && t.galleryInterior}
                {cat === 'amenities' && t.galleryAmenities}
              </button>
            ))}
          </div>

          <div className="grid-cards" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: 24 }}>
            {filteredGallery.map((img, idx) => (
              <div key={idx} className="mv-card" style={{
                padding: 12, overflow: 'hidden', background: '#ffffff',
                display: 'flex', flexDirection: 'column'
              }}>
                <div style={{ position: 'relative', overflow: 'hidden', borderRadius: '14px', height: 220 }}>
                  <img
                    src={img.url}
                    alt={img.title[lang]}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  {idx % 3 === 1 && (
                    <div style={{
                      position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                      width: 48, height: 48, borderRadius: '50%', background: 'rgba(0, 61, 166, 0.85)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff', cursor: 'pointer',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                    }}>
                      <Play size={18} fill="#ffffff" />
                    </div>
                  )}
                  <div style={{
                    position: 'absolute', bottom: 12, left: 12, background: 'rgba(255,255,255,0.95)',
                    padding: '4px 10px', borderRadius: 999, fontSize: '0.65rem', fontWeight: 800, color: '#003DA6',
                    border: '1px solid rgba(0, 61, 166, 0.1)'
                  }}>
                    {img.category.toUpperCase()}
                  </div>
                </div>
                <div style={{ padding: '12px 6px 4px 6px' }}>
                  <h4 style={{ fontSize: '0.88rem', fontWeight: 800, color: '#00205b' }}>{img.title[lang]}</h4>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────────────────────────────────────────────────
         FAQ Section
         ─────────────────────────────────────────────────── */}
      <section id="faq" style={{ padding: '80px 24px', maxWidth: 850, margin: '0 auto', width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, color: '#00205b', marginBottom: 12, fontFamily: 'Cinzel, var(--font-title)' }}>
            {t.faqTitle}
          </h2>
          <p style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 500 }}>
            {t.faqSubtitle}
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {faqItems.map((item, idx) => {
            const isOpen = activeFaq === idx;
            return (
              <div key={idx} className="faq-accordion" style={{
                padding: 20, cursor: 'pointer', border: isOpen ? '1px solid #003DA6' : '1px solid rgba(0, 61, 166, 0.08)'
              }} onClick={() => setActiveFaq(isOpen ? null : idx)}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: isOpen ? '#003DA6' : '#0f172a' }}>
                    {item.q[lang]}
                  </h4>
                  <ChevronDown
                    size={16}
                    color="#64748b"
                    style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s ease' }}
                  />
                </div>
                {isOpen && (
                  <div style={{ marginTop: 14, borderTop: '1px solid rgba(0, 61, 166, 0.06)', paddingTop: 14 }}>
                    <p style={{ fontSize: '0.82rem', color: '#64748b', lineHeight: 1.6, fontWeight: 500 }}>
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
      <section id="contact" style={{ padding: '40px 24px 80px 24px', maxWidth: 950, margin: '0 auto', width: '100%' }}>
        <div className="mv-card" style={{
          display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 32, padding: 36, background: '#ffffff'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #003DA6 0%, #00205b 100%)', borderRadius: '16px', padding: 36,
            color: '#ffffff', display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
            position: 'relative', overflow: 'hidden'
          }}>
            <div style={{ position: 'absolute', top: -30, right: -30, width: 160, height: 160, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
            <div>
              <h3 style={{ fontSize: '1.5rem', color: '#ffffff', fontWeight: 850, marginBottom: 14, fontFamily: 'Cinzel, var(--font-title)' }}>{t.contactTitle}</h3>
              <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.82rem', lineHeight: 1.5 }}>{t.contactSubtitle}</p>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 40 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: '0.82rem' }}>
                <Phone size={16} />
                <span>+20 2 2345 678</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: '0.82rem' }}>
                <Mail size={16} />
                <span>desk.sales@mv.com</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: '0.82rem' }}>
                <MapPin size={16} />
                <span>Mountain View HQ, New Cairo, Egypt</span>
              </div>
            </div>

            <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 16, marginTop: 40 }}>
              Mountain View Real Estate Development SAE. License No. LIC-333333
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            {contactSuccessMsg ? (
              <div style={{ textAlign: 'center', padding: '40px 10px' }}>
                <CheckCircle size={48} color="var(--color-success)" style={{ marginBottom: 16 }} />
                <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#00205b', marginBottom: 10 }}>{lang === 'en' ? 'Thank You!' : 'شكراً لك!'}</h4>
                <p style={{ fontSize: '0.85rem', color: '#64748b' }}>{contactSuccessMsg}</p>
              </div>
            ) : (
              <form onSubmit={handleContactSubmit}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                  <div>
                    <label style={{ fontSize: '0.72rem', fontWeight: 800, color: '#334155', display: 'block', marginBottom: 6 }}>{t.contactFirstName} *</label>
                    <input
                      className="mv-input"
                      type="text" required value={contactForm.first_name}
                      onChange={e => setContactForm({ ...contactForm, first_name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.72rem', fontWeight: 800, color: '#334155', display: 'block', marginBottom: 6 }}>{t.contactLastName} *</label>
                    <input
                      className="mv-input"
                      type="text" required value={contactForm.last_name}
                      onChange={e => setContactForm({ ...contactForm, last_name: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ marginBottom: 14 }}>
                  <label style={{ fontSize: '0.72rem', fontWeight: 800, color: '#334155', display: 'block', marginBottom: 6 }}>{t.contactEmail} *</label>
                  <input
                    className="mv-input"
                    type="email" required value={contactForm.email}
                    onChange={e => setContactForm({ ...contactForm, email: e.target.value })}
                  />
                </div>

                <div style={{ marginBottom: 14 }}>
                  <label style={{ fontSize: '0.72rem', fontWeight: 800, color: '#334155', display: 'block', marginBottom: 6 }}>{t.contactPhone} *</label>
                  <input
                    className="mv-input"
                    type="text" required placeholder="+201..." value={contactForm.phone}
                    onChange={e => setContactForm({ ...contactForm, phone: e.target.value })}
                  />
                </div>

                <div style={{ marginBottom: 20 }}>
                  <label style={{ fontSize: '0.72rem', fontWeight: 800, color: '#334155', display: 'block', marginBottom: 6 }}>{t.contactMessage} *</label>
                  <textarea
                    rows={4}
                    className="mv-input"
                    style={{ outline: 'none', resize: 'none' }}
                    required value={contactForm.message}
                    onChange={e => setContactForm({ ...contactForm, message: e.target.value })}
                  />
                </div>

                <button type="submit" className="btn-luxury-blue" style={{ width: '100%', justifyContent: 'center' }} disabled={sendingContact}>
                  {sendingContact ? (lang === 'en' ? 'Sending...' : 'جاري الإرسال...') : t.contactSubmit}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ marginTop: 'auto', padding: 28, textAlign: 'center', borderTop: '1px solid rgba(0, 61, 166, 0.08)', background: '#ffffff' }}>
        <p style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>
          © {new Date().getFullYear()} {t.footerRights}
        </p>
      </footer>

      {/* ───────────────────────────────────────────────────
         EOI PAYMENT MODAL PORTAL (Simulated Pay Gate)
         ─────────────────────────────────────────────────── */}
      {showEoiModal && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{
            maxWidth: 550, width: 'calc(100% - 32px)', padding: 32, borderRadius: '20px',
            maxHeight: '92vh', overflowY: 'auto', position: 'relative', border: '1px solid rgba(0, 61, 166, 0.15)'
          }}>
            {/* Positioned absolutely at top right so it stays clean and doesn't overlap titles */}
            <button
              onClick={() => setShowEoiModal(false)}
              style={{
                position: 'absolute', top: 20, right: 20,
                background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.3rem', color: '#64748b',
                fontWeight: 'bold', padding: 4
              }}
            >
              ✕
            </button>

            <div style={{ marginBottom: 20, paddingRight: 24 }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#00205b', marginBottom: 6, fontFamily: 'Cinzel, var(--font-title)' }}>
                {t.eoiModalTitle}
              </h3>
              <p style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 500 }}>
                {t.eoiModalSubtitle}
              </p>
            </div>

            {errorMessage && (
              <div style={{
                background: 'rgba(239, 68, 68, 0.05)', color: '#ef4444', padding: '12px 16px',
                borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600, display: 'flex',
                alignItems: 'center', gap: 8, marginBottom: 16, border: '1px solid rgba(239, 68, 68, 0.12)'
              }}>
                <AlertCircle size={14} />
                <span>{errorMessage}</span>
              </div>
            )}

            {eoiStep < 3 ? (
              <form onSubmit={handleEoiSubmit}>
                <div style={{
                  padding: 16, background: 'rgba(0, 61, 166, 0.02)', marginBottom: 20, borderRadius: '12px',
                  border: '1px solid rgba(0, 61, 166, 0.08)'
                }}>
                  <div style={{ fontSize: '0.78rem', display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ color: '#64748b' }}>{t.eoiSelectedProject}:</span>
                    <strong style={{ color: '#00205b' }}>{eoiProject?.name}</strong>
                  </div>
                  {eoiUnit && (
                    <div style={{ fontSize: '0.78rem', display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ color: '#64748b' }}>{t.eoiSelectedUnit}:</span>
                      <strong style={{ color: '#00205b' }}>{eoiUnit.building} - {eoiUnit.unit_number}</strong>
                    </div>
                  )}
                  <div style={{ fontSize: '0.78rem', display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(0, 61, 166, 0.08)', paddingTop: 8, marginTop: 8 }}>
                    <span style={{ color: '#003DA6', fontWeight: 800 }}>{t.eoiAmountLabel}:</span>
                    <strong style={{ color: '#00205b', fontWeight: 900 }}>EGP 50,000.00</strong>
                  </div>
                  <span style={{ fontSize: '0.62rem', color: '#64748b', display: 'block', textAlign: 'right', marginTop: 4 }}>
                    * {t.eoiAmountDesc}
                  </span>
                </div>

                {/* STEP 1: Personal Info */}
                {eoiStep === 1 && (
                  <div>
                    <h4 style={{ fontSize: '0.82rem', fontWeight: 800, textTransform: 'uppercase', color: '#003DA6', letterSpacing: '0.04em', borderBottom: '1px solid rgba(0, 61, 166, 0.08)', paddingBottom: 8, marginBottom: 16 }}>
                      {t.eoiFormPersonal}
                    </h4>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                      <div>
                        <label style={{ fontSize: '0.72rem', fontWeight: 800, color: '#334155', display: 'block', marginBottom: 6 }}>{t.contactFirstName} *</label>
                        <input
                          className="mv-input"
                          type="text" required value={eoiForm.first_name}
                          onChange={e => setEoiForm({ ...eoiForm, first_name: e.target.value })}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '0.72rem', fontWeight: 800, color: '#334155', display: 'block', marginBottom: 6 }}>{t.contactLastName} *</label>
                        <input
                          className="mv-input"
                          type="text" required value={eoiForm.last_name}
                          onChange={e => setEoiForm({ ...eoiForm, last_name: e.target.value })}
                        />
                      </div>
                    </div>

                    <div style={{ marginBottom: 12 }}>
                      <label style={{ fontSize: '0.72rem', fontWeight: 800, color: '#334155', display: 'block', marginBottom: 6 }}>{t.contactEmail} *</label>
                      <input
                        className="mv-input"
                        type="email" required value={eoiForm.email}
                        onChange={e => setEoiForm({ ...eoiForm, email: e.target.value })}
                      />
                    </div>

                    <div style={{ marginBottom: 12 }}>
                      <label style={{ fontSize: '0.72rem', fontWeight: 800, color: '#334155', display: 'block', marginBottom: 6 }}>{t.contactPhone} *</label>
                      <input
                        className="mv-input"
                        type="text" required placeholder="+201..." value={eoiForm.phone}
                        onChange={e => setEoiForm({ ...eoiForm, phone: e.target.value })}
                      />
                    </div>

                    <div style={{ marginBottom: 20 }}>
                      <label style={{ fontSize: '0.72rem', fontWeight: 800, color: '#334155', display: 'block', marginBottom: 6 }}>{t.eoiNationalId}</label>
                      <input
                        className="mv-input"
                        type="text" placeholder="29001011234567" value={eoiForm.national_id}
                        onChange={e => setEoiForm({ ...eoiForm, national_id: e.target.value })}
                      />
                    </div>

                    <button type="submit" className="btn-luxury-blue" style={{ width: '100%', justifyContent: 'center' }}>
                      {lang === 'en' ? 'Continue to Payment' : 'المتابعة إلى الدفع'}
                      {lang === 'en' ? <ArrowRight size={14} /> : <ArrowLeft size={14} />}
                    </button>
                  </div>
                )}

                {/* STEP 2: Credit Card Simulated Details */}
                {eoiStep === 2 && (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, borderBottom: '1px solid rgba(0, 61, 166, 0.08)', paddingBottom: 8 }}>
                      <h4 style={{ fontSize: '0.82rem', fontWeight: 800, textTransform: 'uppercase', color: '#003DA6', letterSpacing: '0.04em' }}>
                        {t.eoiFormPayment}
                      </h4>
                      <button type="button" onClick={() => setEoiStep(1)} style={{ background: 'none', border: 'none', color: '#003DA6', fontSize: '0.72rem', fontWeight: 800, cursor: 'pointer' }}>
                        {lang === 'en' ? '← Back' : '← رجوع'}
                      </button>
                    </div>

                    <div style={{ background: 'rgba(0, 61, 166, 0.02)', padding: 14, borderRadius: '12px', border: '1px solid rgba(0, 61, 166, 0.08)', display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                      <Lock size={16} color="var(--color-success)" />
                      <span style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 600 }}>
                        {lang === 'en' ? 'SSL Secure checkout. Card values will be authorized on our merchant gateway.' : 'بوابة دفع مشفرة آمنة. سيتم حجز وتأكيد المعاملة مالياً.'}
                      </span>
                    </div>

                    <div style={{ marginBottom: 12 }}>
                      <label style={{ fontSize: '0.72rem', fontWeight: 800, color: '#334155', display: 'block', marginBottom: 6 }}>{t.eoiCardName} *</label>
                      <input
                        className="mv-input"
                        type="text" required placeholder="John Doe" value={eoiForm.card_name}
                        onChange={e => setEoiForm({ ...eoiForm, card_name: e.target.value })}
                      />
                    </div>

                    <div style={{ marginBottom: 12 }}>
                      <label style={{ fontSize: '0.72rem', fontWeight: 800, color: '#334155', display: 'block', marginBottom: 6 }}>{t.eoiCardNo} *</label>
                      <div style={{ position: 'relative' }}>
                        <input
                          className="mv-input"
                          style={{ paddingLeft: '38px' }}
                          type="text" required placeholder="4000 1234 5678 9010" value={eoiForm.card_no}
                          onChange={e => setEoiForm({ ...eoiForm, card_no: e.target.value })}
                        />
                        <CreditCard size={14} style={{ position: 'absolute', left: 14, top: 14 }} color="#64748b" />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
                      <div>
                        <label style={{ fontSize: '0.72rem', fontWeight: 800, color: '#334155', display: 'block', marginBottom: 6 }}>{t.eoiCardExp} *</label>
                        <input
                          className="mv-input"
                          type="text" required placeholder="12/28" value={eoiForm.card_exp}
                          onChange={e => setEoiForm({ ...eoiForm, card_exp: e.target.value })}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '0.72rem', fontWeight: 800, color: '#334155', display: 'block', marginBottom: 6 }}>{t.eoiCardCvv} *</label>
                        <input
                          className="mv-input"
                          type="password" required maxLength={3} placeholder="•••" value={eoiForm.card_cvv}
                          onChange={e => setEoiForm({ ...eoiForm, card_cvv: e.target.value })}
                        />
                      </div>
                    </div>

                    <button type="submit" className="btn-luxury-blue" style={{ width: '100%', justifyContent: 'center' }} disabled={eoiProcessing}>
                      {eoiProcessing ? (
                        <>
                          <div className="animate-spin" style={{ width: 12, height: 12, border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: '50%', marginRight: 6 }} />
                          {t.eoiProcessing}
                        </>
                      ) : t.eoiPaySubmit}
                    </button>
                  </div>
                )}
              </form>
            ) : (
              /* STEP 3: Booking Success Ticket */
              <div style={{ textAlign: 'center', padding: '16px 0 10px 0' }}>
                <CheckCircle size={52} color="var(--color-success)" style={{ marginBottom: 16 }} />
                <h4 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#00205b', marginBottom: 8, fontFamily: 'Cinzel, var(--font-title)' }}>
                  {t.eoiSuccessTitle}
                </h4>
                <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: 24, maxWidth: 420, margin: '0 auto 24px auto' }}>
                  {t.eoiSuccessDesc}
                </p>

                <div style={{
                  background: 'radial-gradient(circle, rgba(0,61,166,0.05) 0%, rgba(255,255,255,0.7) 100%)',
                  border: '2px dashed #003DA6', borderRadius: '16px',
                  padding: '24px 28px', maxWidth: 340, margin: '0 auto 28px auto'
                }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#003DA6', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>
                    {t.eoiTicketNo}
                  </span>
                  <strong style={{ fontSize: '2.8rem', color: '#00205b', fontFamily: 'Cinzel, var(--font-title)', display: 'block', lineHeight: 1 }}>
                    #{eoiResult?.queue_number || '1'}
                  </strong>
                  <span style={{ fontSize: '0.65rem', color: '#64748b', display: 'block', marginTop: 10 }}>
                    Compound: {eoiProject?.name}
                  </span>
                  {eoiUnit && (
                    <span style={{ fontSize: '0.65rem', color: '#64748b', display: 'block' }}>
                      Allocated Unit: {eoiUnit.building} - {eoiUnit.unit_number}
                    </span>
                  )}
                  <span style={{ fontSize: '0.62rem', color: '#64748b', display: 'block', opacity: 0.8, marginTop: 6, fontFamily: 'monospace' }}>
                    Reference: {eoiResult?.data?.id}
                  </span>
                </div>

                <button className="btn-luxury-blue" onClick={() => setShowEoiModal(false)} style={{ padding: '10px 32px', fontSize: '0.82rem' }}>
                  {t.eoiClose}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};

export default LandingPage;
