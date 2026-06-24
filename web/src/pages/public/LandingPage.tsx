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
    navUnitSelection: 'Unit Selection',
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
    unitActionComingSoon: 'Coming Soon',
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
    eoiFormPayment: '2. Secure Payment & Files Upload',
    eoiSelectedProject: 'Selected Compound',
    eoiSelectedUnit: 'Selected Unit',
    eoiAmountLabel: 'EOI Registration Token',
    eoiAmountDesc: 'refundable down payment to secure booking priority',
    eoiNationalId: 'National ID / Passport No.',
    eoiCardName: 'Cardholder Name',
    eoiCardNo: 'Credit Card Number',
    eoiCardExp: 'Expiry (MM/YY)',
    eoiCardCvv: 'CVV',
    eoiPaySubmit: 'Submit EOI & Join Queue',
    eoiProcessing: 'Uploading files and submitting reservation...',
    eoiSuccessTitle: 'Reservation Request Submitted!',
    eoiSuccessDesc: 'Your Expression of Interest (EOI) request and receipt have been submitted successfully. An accountant will review your payment shortly to approve your queue number.',
    eoiTicketNo: 'Status',
    eoiClose: 'Close Portal',
    footerRights: 'All rights reserved. Mountain View Developer Real Estate Holding.',
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
    projectDetailsBtn: 'Show Project Details',
    modalTitleDetails: 'Project Details Profile',
    tabPaymentPlans: 'Payment plans',
    tabPriceArea: 'Prices & Space Ranges',
    tabMasterPlan: 'Master Plan & Stats',
    areaRange: 'Space Range',
    priceRange: 'Price Range',
    totalUnits: 'Available Inventory',
    landArea: 'Land Area',
    buildingRatio: 'Building Ratio',
    greenArea: 'Parks & Green Area',
    parkingSpaces: 'Total Parking Spaces',
    maxFloors: 'Max Allowed Floors',
    infraNotes: 'Infrastructure Notes',
    },
    ar: {
    navProjects: 'محفظة المشاريع',
    navGallery: 'معرض الصور والفيديو',
    navFaq: 'الأسئلة الشائعة',
    navContact: 'اتصل بنا',
    navDashboard: 'بوابة لوحة التحكم',
    navLogin: 'دخول الموظفين',
    navUnitSelection: 'اختيار الوحدات',
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
    unitActionComingSoon: 'قريباً',
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
    eoiFormPayment: '2. تأكيد الدفع ورفع الملفات',
    eoiSelectedProject: 'المشروع المحدد',
    eoiSelectedUnit: 'الوحدة المحددة',
    eoiAmountLabel: 'قيمة جدية الحجز (EOI)',
    eoiAmountDesc: 'دفعة مقدمة مستردة لضمان أسبقية حجز الوحدة',
    eoiNationalId: 'الرقم القومي / رقم جواز السفر',
    eoiCardName: 'اسم صاحب البطاقة',
    eoiCardNo: 'رقم بطاقة الائتمان',
    eoiCardExp: 'تاريخ الانتهاء (الشهر/السنة)',
    eoiCardCvv: 'الرمز السري (CVV)',
    eoiPaySubmit: 'تقديم طلب الحجز والانضمام للصف',
    eoiProcessing: 'جاري رفع الملفات وإرسال طلب الحجز...',
    eoiSuccessTitle: 'تم إرسال طلب الحجز بنجاح!',
    eoiSuccessDesc: 'تم إرسال طلب جدية الحجز (EOI) وإيصال التحويل بنجاح. سيقوم المحاسب بمراجعة عملية الدفع قريباً لتأكيد رقم الأسبقية الخاص بك.',
    eoiTicketNo: 'الحالة',
    eoiClose: 'إغلاق البوابة',
    footerRights: 'جميع الحقوق محفوظة. مجموعة ماونتن فيو للتطوير العقاري.',
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
    projectDetailsBtn: 'عرض تفاصيل المشروع',
    modalTitleDetails: 'الملف التفصيلي للمشروع',
    tabPaymentPlans: 'أنظمة السداد',
    tabPriceArea: 'الأسعار والمساحات',
    tabMasterPlan: 'المخطط العام والماستر بلان',
    areaRange: 'مساحة الوحدات',
    priceRange: 'نطاق الأسعار',
    totalUnits: 'المخزون المتاح',
    landArea: 'مساحة الأرض',
    buildingRatio: 'نسبة المباني',
    greenArea: 'المساحات الخضراء',
    parkingSpaces: 'أماكن انتظار السيارات',
    maxFloors: 'أقصى عدد أدوار',
    infraNotes: 'ملاحظات البنية التحتية',
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

const getProjectCoverImage = (project: any) => {
  if (project.image_url) {
    if (project.image_url.startsWith('http')) {
      if (!project.image_url.includes('placeholder')) {
        return project.image_url;
      }
    } else if (!project.image_url.includes('placeholder')) {
      // It's a local storage relative path
      return `http://127.0.0.1:8000/storage/${project.image_url}`;
    }
  }
  
  // Fallback mapping based on project name (case-insensitive)
  const name = (project.name || '').toLowerCase();
  if (name.includes('creek')) {
    return 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80'; // Creek/Lagoon curves
  }
  if (name.includes('lagoon') || name.includes('water')) {
    return 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80'; // Beachfront villa
  }
  if (name.includes('park') || name.includes('green') || name.includes('club')) {
    return 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80'; // Parkside apartments
  }
  if (name.includes('mansion') || name.includes('villa')) {
    return 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80'; // Villa at sunset
  }
  // Default high-end luxury real estate photo
  return 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80';
};

const getProjectMarketingDescription = (project: any, lang: 'en' | 'ar') => {
  const name = (project.name || '').toLowerCase();
  
  if (name.includes('creek')) {
    return lang === 'en' 
      ? 'An elite botanical resort nestled around breathtaking crystal lagoons and curated garden structures. Offering unrivaled privacy, private beaches, bespoke boutique clubs, and modern automation, Creekview is the pinnacle of exclusive luxury in New Cairo.'
      : 'منتجع بيئي فاخر يمتد حول بحيرات كريستالية ساحرة ومناظر طبيعية منسقة بعناية. يقدم مشروع "كريك فيو" خصوصية لا تضاهى، وشواطئ خاصة، ونوادي حصرية، ونظم تشغيل ذكية، ليمثل قمة العيش الفاخر في القاهرة الجديدة.';
  }
  
  // Default fallback marketing text
  return lang === 'en'
    ? 'Discover a prestigious sanctuary where luxury architectural planning meets sprawling natural reserves. Crafted for those who demand ultimate luxury, privacy, custom payment plans, and superior investment security.'
    : 'اكتشف ملاذاً عقارياً استثنائياً يجمع بين التصميم المعماري الفاخر والطبيعة الخلابة. صُمم خصيصاً لأصحاب الذوق الرفيع الراغبين في الخصوصية التامة، وخطط السداد المرنة، وأمان الاستثمار طويل الأجل.';
};

const getProjectAmenities = (project: any, lang: 'en' | 'ar') => {
  const name = (project.name || '').toLowerCase();
  
  if (name.includes('creek')) {
    return lang === 'en'
      ? [
          'Lush Botanical Gardens & Landscapes',
          'Crystal Lagoons & Sandy Beaches',
          'Bespoke Premium Boutique Clubhouse',
          'Advanced Smart Home Automation'
        ]
      : [
          'حدائق نباتية ومساحات خضراء خلابة',
          'بحيرات كريستالية وشواطئ رملية خاصة',
          'كلوب هاوس ونادي صحي حركي حصري',
          'أنظمة تحكم منزلي ذكية ومتطورة'
        ];
  }
  
  return lang === 'en'
    ? [
        'Expansive Natural Parks & Trails',
        'Premium Infinity Swimming Pools',
        'Multi-purpose Sports & Fitness Hub',
        '24/7 Signature Security & Guarding'
      ]
    : [
        'متنزهات طبيعية ومسارات مشي واسعة',
        'حمامات سباحة غير متناهية فاخرة',
        'مجمع رياضي وصحي متكامل الخدمات',
        'أنظمة أمن وحراسة ذكية على مدار الساعة'
      ];
};

const ProjectImageSlider: React.FC<{ project: any; coverImg: string }> = ({ project, coverImg }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  
  // Collect images
  const images = React.useMemo(() => {
    const list: string[] = [];

    if (coverImg) {
      list.push(coverImg);
    }

    // Add cover gallery images dynamically if present
    if (project.media && Array.isArray(project.media)) {
      const gallery = project.media
        .filter((m: any) => m.media_type === 'cover_gallery')
        .map((m: any) => {
          if (m.image_url) return m.image_url;
          return m.image_path.startsWith('http')
            ? m.image_path
            : `http://127.0.0.1:8000/storage/${m.image_path}`;
        });
      list.push(...gallery);
    }

    // Fallback: If no gallery uploaded, use the previous logic with fallback images
    if (list.length <= 1) {
      const mpUrlRaw = project.master_plan_svg_url || project.master_plan_image_url;
      if (mpUrlRaw) {
        const mpUrl = mpUrlRaw.startsWith('http')
          ? mpUrlRaw
          : `http://127.0.0.1:8000/storage/${mpUrlRaw}`;
        list.push(mpUrl);
      }

      list.push('https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80');
      list.push('https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?auto=format&fit=crop&w=1200&q=80');
      list.push('https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1200&q=80');
    }

    return list;
  }, [coverImg, project.media, project.master_plan_svg_url, project.master_plan_image_url]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [images.length]);

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const handleDotClick = (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    setCurrentIndex(index);
  };

  return (
    <div 
      className="luxury-project-slider-wrapper"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        position: 'relative',
        height: '380px',
        width: '100%',
        overflow: 'hidden',
        background: '#000c24',
      }}
    >
      {/* Slides */}
      {images.map((imgUrl, idx) => (
        <div
          key={idx}
          style={{
            position: 'absolute',
            inset: 0,
            opacity: idx === currentIndex ? 1 : 0,
            transition: 'opacity 1s ease-in-out',
            zIndex: idx === currentIndex ? 1 : 0,
            pointerEvents: idx === currentIndex ? 'auto' : 'none'
          }}
        >
          <img
            src={imgUrl}
            alt={`Slide ${idx + 1}`}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transform: idx === currentIndex ? 'scale(1.06)' : 'scale(1.0)',
              transition: idx === currentIndex ? 'transform 10s ease-out' : 'none'
            }}
          />
        </div>
      ))}

      {/* Dark overlay for text contrast and premium feel */}
      <div 
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(to top, rgba(0,10,40,0.85) 0%, rgba(0,10,40,0.2) 50%, rgba(0,10,40,0.4) 100%)',
          zIndex: 2,
          pointerEvents: 'none'
        }}
      />

      {/* Left/Right Arrows */}
      <button
        type="button"
        onClick={handlePrev}
        style={{
          position: 'absolute',
          left: '16px',
          top: '50%',
          transform: 'translateY(-50%)',
          background: 'rgba(0,15,61,0.75)',
          border: '1px solid rgba(197,168,128,0.3)',
          borderRadius: '50%',
          width: '40px',
          height: '40px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#C5A880',
          cursor: 'pointer',
          zIndex: 3,
          opacity: isHovered ? 1 : 0,
          transition: 'opacity 0.3s ease, background 0.2s ease',
          boxShadow: '0 4px 10px rgba(0,0,0,0.3)'
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = '#003DA6'; e.currentTarget.style.color = '#ffffff'; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(0,15,61,0.75)'; e.currentTarget.style.color = '#C5A880'; }}
      >
        <ArrowLeft size={16} />
      </button>

      <button
        type="button"
        onClick={handleNext}
        style={{
          position: 'absolute',
          right: '16px',
          top: '50%',
          transform: 'translateY(-50%)',
          background: 'rgba(0,15,61,0.75)',
          border: '1px solid rgba(197,168,128,0.3)',
          borderRadius: '50%',
          width: '40px',
          height: '40px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#C5A880',
          cursor: 'pointer',
          zIndex: 3,
          opacity: isHovered ? 1 : 0,
          transition: 'opacity 0.3s ease, background 0.2s ease',
          boxShadow: '0 4px 10px rgba(0,0,0,0.3)'
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = '#003DA6'; e.currentTarget.style.color = '#ffffff'; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(0,15,61,0.75)'; e.currentTarget.style.color = '#C5A880'; }}
      >
        <ArrowRight size={16} />
      </button>

      {/* Dots Indicator */}
      <div
        style={{
          position: 'absolute',
          bottom: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          gap: '8px',
          zIndex: 3
        }}
      >
        {images.map((_, idx) => (
          <button
            key={idx}
            type="button"
            onClick={(e) => handleDotClick(e, idx)}
            style={{
              width: idx === currentIndex ? '24px' : '8px',
              height: '8px',
              borderRadius: '999px',
              border: 'none',
              background: idx === currentIndex ? '#C5A880' : 'rgba(255,255,255,0.4)',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
          />
        ))}
      </div>
    </div>
  );
};

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  
  // Basic states
  const [lang, setLang] = useState<'en' | 'ar'>('en');
  const [projects, setProjects] = useState<any[]>([]);
  const [activeProjectIndex, setActiveProjectIndex] = useState(0);
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
  });
  const [clientLocation, setClientLocation] = useState<'inside_egypt' | 'outside_egypt' | ''>('');
  const [paymentMethod, setPaymentMethod] = useState<'bank_transfer' | 'instapay' | 'international_bank_transfer' | ''>('');
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [passportFile, setPassportFile] = useState<File | null>(null);
  const [eoiStep, setEoiStep] = useState<1 | 2 | 3>(1);
  const [eoiProcessing, setEoiProcessing] = useState(false);
  const [eoiResult, setEoiResult] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState('');

  // Is logged in checked
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Project Details Modal states
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [detailsProject, setDetailsProject] = useState<any>(null);
  const [detailsUnits, setDetailsUnits] = useState<any[]>([]);
  const [loadingDetailsUnits, setLoadingDetailsUnits] = useState(false);
  const [detailsTab, setDetailsTab] = useState<'prices' | 'payments' | 'master_plan'>('prices');

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
        setActiveProjectIndex(0);
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

  const handleShowProjectDetails = async (project: any) => {
    setDetailsProject(project);
    setDetailsTab('prices');
    setShowDetailsModal(true);
    setLoadingDetailsUnits(true);
    setDetailsUnits([]);
    try {
      const res = await api.get(`/v1/public/projects/${project.id}/units`);
      if (res.data?.success) {
        setDetailsUnits(res.data.data || []);
      }
    } catch (err) {
      console.error('Error fetching units for details:', err);
    }
    setLoadingDetailsUnits(false);
  };

  const getUnitTypeTranslation = (type: string, currentLang: 'en' | 'ar') => {
    const mapping: Record<string, { en: string; ar: string }> = {
      apartment: { en: 'Apartment', ar: 'شقة سكنية' },
      villa: { en: 'Villa', ar: 'فيلا مستقلة' },
      duplex: { en: 'Duplex', ar: 'دوبلكس' },
      townhouse: { en: 'Townhouse', ar: 'تاون هاوس' },
      penthouse: { en: 'Penthouse', ar: 'بنتهاوس' },
      commercial: { en: 'Commercial Space', ar: 'محل تجاري / مكتب' },
    };
    return mapping[type.toLowerCase()]?.[currentLang] || type;
  };

  const formatCurrency = (amount: number, currentLang: 'en' | 'ar') => {
    if (currentLang === 'ar') {
      return `${amount.toLocaleString('ar-EG')} ج.م`;
    }
    return `${amount.toLocaleString('en-US')} EGP`;
  };

  const groupedRanges = React.useMemo(() => {
    if (!detailsUnits || detailsUnits.length === 0) return {};
    const groups: Record<string, { minArea: number; maxArea: number; minPrice: number; maxPrice: number; count: number }> = {};
    
    detailsUnits.forEach(u => {
      if (!u.type) return;
      const type = u.type.toLowerCase();
      const price = parseFloat(u.price);
      const area = parseFloat(u.area);
      
      if (!groups[type]) {
        groups[type] = {
          minArea: area,
          maxArea: area,
          minPrice: price,
          maxPrice: price,
          count: 1
        };
      } else {
        const g = groups[type];
        g.count += 1;
        if (area < g.minArea) g.minArea = area;
        if (area > g.maxArea) g.maxArea = area;
        if (price < g.minPrice) g.minPrice = price;
        if (price > g.maxPrice) g.maxPrice = price;
      }
    });
    return groups;
  }, [detailsUnits]);

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
    });
    setClientLocation('');
    setPaymentMethod('');
    setReceiptFile(null);
    setPassportFile(null);
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

    if (!clientLocation) {
      setErrorMessage(lang === 'en' ? 'Please select your location.' : 'يرجى تحديد موقعك.');
      return;
    }
    if (!paymentMethod) {
      setErrorMessage(lang === 'en' ? 'Please select a payment method.' : 'يرجى تحديد طريقة الدفع.');
      return;
    }
    if (!receiptFile) {
      setErrorMessage(lang === 'en' ? 'Please upload the payment receipt.' : 'يرجى رفع إيصال الدفع.');
      return;
    }
    if (clientLocation === 'outside_egypt' && !passportFile) {
      setErrorMessage(lang === 'en' ? 'Please upload your passport.' : 'يرجى رفع صورة جواز السفر.');
      return;
    }

    setEoiProcessing(true);
    setErrorMessage('');
    try {
      const formData = new FormData();
      formData.append('first_name', eoiForm.first_name);
      formData.append('last_name', eoiForm.last_name);
      formData.append('email', eoiForm.email);
      formData.append('phone', eoiForm.phone);
      if (eoiForm.national_id) {
        formData.append('national_id', eoiForm.national_id);
      }
      formData.append('project_id', eoiProject.id);
      if (eoiUnit?.id) {
        formData.append('unit_id', eoiUnit.id);
      }
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
        setEoiResult(res.data);
        setEoiStep(3);
        loadProjects();
        if (selectedProjectId) {
          loadProjectUnits(selectedProjectId);
        }
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.response?.data?.message || (lang === 'en' ? 'Submission failed. Please try again.' : 'فشل تقديم الطلب. يرجى المحاولة مرة أخرى.'));
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
        .nav-lang-btn {
          background: rgba(255, 255, 255, 0.8) !important;
          border: 1.5px solid rgba(0, 61, 166, 0.15) !important;
          border-radius: 999px !important;
          padding: 8px 18px !important;
          cursor: pointer !important;
          display: flex !important;
          align-items: center !important;
          gap: 6px !important;
          font-size: 0.82rem !important;
          font-weight: 700 !important;
          color: #003DA6 !important;
          box-shadow: 0 2px 6px rgba(0, 61, 166, 0.02) !important;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1) !important;
        }
        .nav-lang-btn:hover {
          background: #003DA6 !important;
          color: #ffffff !important;
          border-color: #003DA6 !important;
          transform: translateY(-1.5px) !important;
          box-shadow: 0 6px 15px rgba(0, 61, 166, 0.2) !important;
        }
        .nav-login-btn {
          font-size: 0.82rem !important;
          padding: 10px 24px !important;
          border-radius: 999px !important;
          border: none !important;
          color: #ffffff !important;
          background: linear-gradient(135deg, #003DA6 0%, #001f5c 100%) !important;
          cursor: pointer !important;
          font-weight: 700 !important;
          box-shadow: 0 4px 12px rgba(0, 61, 166, 0.15) !important;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1) !important;
        }
        .nav-login-btn:hover {
          transform: translateY(-1.5px) !important;
          box-shadow: 0 6px 18px rgba(0, 61, 166, 0.3) !important;
          filter: brightness(1.1) !important;
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

        /* Luxury Projects Section Design Styles */
        .luxury-projects-grid {
          display: flex;
          flex-direction: column;
          gap: 48px;
          margin-bottom: 54px;
        }
        
        @keyframes projectCardFadeIn {
          from {
            opacity: 0;
            transform: translateY(15px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .luxury-project-card {
          position: relative;
          display: flex;
          flex-direction: row;
          height: auto;
          border-radius: 32px;
          overflow: hidden;
          box-shadow: 0 16px 40px rgba(0, 0, 0, 0.18);
          border: 1px solid rgba(197, 168, 128, 0.25);
          background: linear-gradient(135deg, #001233 0%, #00071c 100%);
          transition: transform 0.5s cubic-bezier(0.25, 1, 0.3, 1), box-shadow 0.5s cubic-bezier(0.25, 1, 0.3, 1), border-color 0.5s ease;
          animation: projectCardFadeIn 0.5s cubic-bezier(0.25, 1, 0.3, 1) forwards;
        }
        
        .luxury-project-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 24px 60px rgba(0, 61, 166, 0.3);
          border-color: rgba(197, 168, 128, 0.6);
        }
        
        .luxury-project-image-side {
          width: 52%;
          display: flex;
          flex-direction: column;
          align-self: stretch;
          border-inline-end: 1px solid rgba(197, 168, 128, 0.15);
          background: rgba(0, 10, 40, 0.2);
        }
        
        .luxury-project-left-details {
          padding: 30px 40px;
          display: flex;
          flex-direction: column;
          gap: 20px;
          background: rgba(0, 10, 40, 0.3);
          flex-grow: 1;
        }
        
        .luxury-project-info-side {
          width: 48%;
          padding: 40px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          align-self: stretch;
        }
        
        .luxury-project-status-badge {
          display: inline-block;
          font-size: 0.68rem;
          font-weight: 800;
          letter-spacing: 0.08em;
          padding: 6px 14px;
          border-radius: 999px;
          background: rgba(197, 168, 128, 0.95);
          color: #00153D;
          text-transform: uppercase;
          border: 1px solid rgba(255, 255, 255, 0.25);
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.15);
        }
        
        /* Project Switching Navigation Controls */
        .luxury-control-arrow {
          background: none;
          border: 1.5px solid #C5A880;
          border-radius: 50%;
          width: 46px;
          height: 46px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #C5A880;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .luxury-control-arrow:hover {
          background: #C5A880;
          color: #001233;
          box-shadow: 0 6px 15px rgba(197, 168, 128, 0.3);
          transform: scale(1.05);
        }
        
        @media (max-width: 992px) {
          .luxury-project-card {
            flex-direction: column !important;
            height: auto !important;
          }
          .luxury-project-image-side {
            width: 100% !important;
            height: auto !important;
            border-inline-end: none !important;
          }
          .luxury-project-slider-wrapper {
            height: 300px !important;
          }
          .luxury-project-left-details {
            padding: 24px 20px !important;
          }
          .luxury-project-info-side {
            width: 100% !important;
            padding: 32px 20px !important;
          }
        }
        .project-cta-container {
          display: flex;
          gap: 16px;
          margin-top: 24px;
        }
        @media (max-width: 576px) {
          .project-cta-container {
            flex-direction: column;
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
          <button onClick={toggleLanguage} className="nav-lang-btn">
            <Globe size={15} />
            {lang === 'en' ? 'العربية' : 'English'}
          </button>

          {isLoggedIn ? (
            <button className="btn-luxury-primary" onClick={() => navigate('/dashboard')} style={{ fontSize: '0.8rem', padding: '10px 24px' }}>
              {t.navDashboard}
              {lang === 'en' ? <ArrowRight size={15} /> : <ArrowLeft size={15} />}
            </button>
          ) : (
            <button onClick={() => navigate('/login')} className="nav-login-btn">
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
          <div>
            {/* Elegant tabs switcher if there are multiple projects */}
            {projects.length > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', marginBottom: '32px', flexWrap: 'wrap' }}>
                {projects.map((proj: any, idx: number) => (
                  <button
                    key={proj.id}
                    type="button"
                    onClick={() => setActiveProjectIndex(idx)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: idx === activeProjectIndex ? '#003DA6' : '#8a9ab0',
                      fontSize: '1.05rem',
                      fontWeight: 800,
                      padding: '10px 20px',
                      cursor: 'pointer',
                      position: 'relative',
                      transition: 'all 0.3s ease',
                      fontFamily: 'var(--font-title)',
                      letterSpacing: '0.02em'
                    }}
                  >
                    {proj.name}
                    {idx === activeProjectIndex && (
                      <span style={{
                        position: 'absolute',
                        bottom: 0,
                        left: '20%',
                        width: '60%',
                        height: '3px',
                        background: 'linear-gradient(90deg, #003DA6 0%, #C5A880 100%)',
                        borderRadius: '99px'
                      }} />
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* Premium centered visual track switcher with previous/next buttons */}
            {projects.length > 1 && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '24px', marginBottom: '36px' }}>
                {/* Prev Project Button */}
                <button
                  type="button"
                  onClick={() => setActiveProjectIndex((prev) => (prev - 1 + projects.length) % projects.length)}
                  className="luxury-control-arrow"
                  aria-label="Previous Project"
                >
                  <ArrowLeft size={18} />
                </button>

                {/* Progress Track Indicator */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '0.8rem', color: '#C5A880', fontWeight: 800, fontFamily: 'var(--font-title)', letterSpacing: '0.1em' }}>
                    {String(activeProjectIndex + 1).padStart(2, '0')} / {String(projects.length).padStart(2, '0')}
                  </span>
                  <div style={{ width: '120px', height: '2px', background: 'rgba(197, 168, 128, 0.2)', position: 'relative', borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{
                      position: 'absolute',
                      left: 0,
                      top: 0,
                      height: '100%',
                      width: `${100 / projects.length}%`,
                      background: 'linear-gradient(90deg, #003DA6, #C5A880)',
                      transform: `translateX(${activeProjectIndex * 100}%)`,
                      transition: 'transform 0.4s cubic-bezier(0.25, 1, 0.3, 1)',
                      borderRadius: '2px'
                    }} />
                  </div>
                </div>

                {/* Next Project Button */}
                <button
                  type="button"
                  onClick={() => setActiveProjectIndex((prev) => (prev + 1) % projects.length)}
                  className="luxury-control-arrow"
                  aria-label="Next Project"
                >
                  <ArrowRight size={18} />
                </button>
              </div>
            )}

            {/* Slider container wrapping the active card */}
            <div style={{ position: 'relative', width: '100%', maxWidth: '1250px', margin: '0 auto' }}>
              {/* Active Project Card */}
              {projects[activeProjectIndex] && (
                <div key={projects[activeProjectIndex].id} className="luxury-project-card">
                  {/* Left Side: Images Gallery / Slideshow & Technical Specs */}
                  <div className="luxury-project-image-side">
                    <ProjectImageSlider 
                      project={projects[activeProjectIndex]} 
                      coverImg={getProjectCoverImage(projects[activeProjectIndex])} 
                    />
                    
                    {/* Left Details Container: Specs & Plans */}
                    <div className="luxury-project-left-details">
                      {/* Specs Details Grid */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', borderBottom: '1.5px solid rgba(255,255,255,0.08)', paddingBottom: '20px', marginBottom: '20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(197, 168, 128, 0.1)', border: '1px solid rgba(197, 168, 128, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#C5A880', flexShrink: 0 }}>
                            <Calendar size={18} />
                          </div>
                          <div>
                            <span style={{ display: 'block', fontSize: '0.68rem', color: 'rgba(255, 255, 255, 0.5)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t.projectDelivery}</span>
                            <span style={{ display: 'block', fontSize: '0.88rem', fontWeight: 700, color: '#ffffff' }}>{projects[activeProjectIndex].delivery_date}</span>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: projects[activeProjectIndex].units_count > 0 ? 'rgba(34, 197, 94, 0.12)' : 'rgba(239, 68, 68, 0.12)', border: projects[activeProjectIndex].units_count > 0 ? '1px solid rgba(34, 197, 94, 0.2)' : '1px solid rgba(239, 68, 68, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: projects[activeProjectIndex].units_count > 0 ? '#22c55e' : '#ef4444', flexShrink: 0 }}>
                            <Compass size={18} />
                          </div>
                          <div>
                            <span style={{ display: 'block', fontSize: '0.68rem', color: 'rgba(255, 255, 255, 0.5)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t.projectAvailable}</span>
                            <span style={{ display: 'block', fontSize: '0.88rem', fontWeight: 700, color: projects[activeProjectIndex].units_count > 0 ? '#22c55e' : '#ef4444' }}>
                              {projects[activeProjectIndex].units_count > 0 ? `${projects[activeProjectIndex].units_count} ${lang === 'en' ? 'Units' : 'وحدة'}` : t.projectNoUnits}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Payment Plans Showcase */}
                      {projects[activeProjectIndex].payment_plans && projects[activeProjectIndex].payment_plans.length > 0 && (
                        <div>
                          <span style={{ display: 'block', fontSize: '0.72rem', color: '#C5A880', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 800, marginBottom: '12px' }}>
                            {t.projectPlans}
                          </span>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {projects[activeProjectIndex].payment_plans.slice(0, 2).map((plan: any) => (
                              <div key={plan.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'linear-gradient(135deg, rgba(197, 168, 128, 0.04) 0%, rgba(255, 255, 255, 0.01) 100%)', padding: '12px 18px', borderRadius: '14px', border: '1px solid rgba(197, 168, 128, 0.15)' }}>
                                <span style={{ fontSize: '0.82rem', color: 'rgba(255, 255, 255, 0.95)', fontWeight: 600 }}>
                                  {lang === 'ar' ? (plan.name_ar || plan.name) : plan.name}
                                </span>
                                <strong style={{ fontSize: '0.82rem', color: '#C5A880', fontWeight: 700 }}>
                                  {plan.down_payment_pct}% DP / {plan.installments}m
                                </strong>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Side: Marketing Info, Amenities Showcase, EOI Button */}
                  <div className="luxury-project-info-side">
                    <div>
                      {/* Top Row: Status Badge & Project Type */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <span className="luxury-project-status-badge">
                          {projects[activeProjectIndex].status === 'active' 
                            ? (lang === 'en' ? 'Active Phase' : 'مرحلة نشطة')
                            : (lang === 'en' ? projects[activeProjectIndex].status.toUpperCase() : 'قريباً')
                          }
                        </span>
                        <span style={{ fontSize: '0.75rem', color: '#C5A880', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em' }}>
                          {projects[activeProjectIndex].project_type || (lang === 'en' ? 'Luxury Compound' : 'كمبوند فاخر')}
                        </span>
                      </div>

                      {/* Project Title & Location */}
                      <h3 style={{ fontSize: '2.2rem', fontFamily: 'var(--font-title)', fontWeight: 800, color: '#ffffff', margin: '0 0 10px 0', letterSpacing: '-0.02em' }}>
                        {projects[activeProjectIndex].name}
                      </h3>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem', color: '#C5A880', fontWeight: 700, marginBottom: '20px' }}>
                        <MapPin size={15} />
                        <span>{projects[activeProjectIndex].location}</span>
                      </div>

                      {/* Persuasive marketing copy */}
                      <p style={{ fontSize: '0.92rem', lineHeight: '1.8', color: 'rgba(255, 255, 255, 0.78)', margin: '0 0 24px 0', fontWeight: 500 }}>
                        {getProjectMarketingDescription(projects[activeProjectIndex], lang)}
                      </p>

                      {/* Premium Amenities list */}
                      <div style={{ margin: '24px 0' }}>
                        <span style={{ display: 'block', fontSize: '0.72rem', color: '#C5A880', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 800, marginBottom: '12px' }}>
                          {lang === 'en' ? 'Signature Premium Amenities' : 'المرافق والخدمات الفاخرة'}
                        </span>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 20px' }}>
                          {getProjectAmenities(projects[activeProjectIndex], lang).map((amenity: string, idx: number) => (
                            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: 'rgba(255, 255, 255, 0.9)', fontWeight: 550 }}>
                              <CheckCircle size={14} color="#C5A880" style={{ flexShrink: 0 }} />
                              <span>{amenity}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Booking EOI CTA & Details buttons */}
                    <div className="project-cta-container">
                      <button
                        type="button"
                        onClick={() => handleShowProjectDetails(projects[activeProjectIndex])}
                        style={{
                          flex: 1,
                          padding: '16px 20px',
                          fontSize: '0.88rem',
                          borderRadius: '16px',
                          background: 'rgba(255, 255, 255, 0.08)',
                          border: '1.5px solid rgba(197, 168, 128, 0.4)',
                          color: '#C5A880',
                          fontWeight: 800,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px',
                          transition: 'all 0.3s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'rgba(197, 168, 128, 0.15)';
                          e.currentTarget.style.transform = 'translateY(-2px)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                          e.currentTarget.style.transform = 'none';
                        }}
                      >
                        <Info size={16} />
                        <span>{t.projectDetailsBtn}</span>
                      </button>

                      <button
                        type="button"
                        className="btn-luxury-drawer-primary"
                        onClick={() => openEoiModal(projects[activeProjectIndex])}
                        style={{
                          flex: 1.2,
                          padding: '16px 20px',
                          fontSize: '0.88rem',
                          borderRadius: '16px',
                          background: 'linear-gradient(135deg, #d4af37 0%, #C5A880 50%, #aa7c11 100%)',
                          boxShadow: '0 8px 24px rgba(197, 168, 128, 0.25)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '10px',
                          border: 'none',
                          color: '#000c24',
                          fontWeight: 800,
                          cursor: 'pointer',
                          transition: 'all 0.3s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateY(-2px)';
                          e.currentTarget.style.boxShadow = '0 12px 30px rgba(197, 168, 128, 0.45)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'none';
                          e.currentTarget.style.boxShadow = '0 8px 24px rgba(197, 168, 128, 0.25)';
                        }}
                      >
                        <CreditCard size={16} />
                        <span>{t.heroCta}</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
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

                {/* STEP 2: Location, Method, and File Uploads */}
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

                    {/* Location Selection */}
                    <div style={{ marginBottom: 16 }}>
                      <label style={{ fontSize: '0.78rem', fontWeight: 800, color: '#1e293b', display: 'block', marginBottom: 8 }}>{t.eoiLocationLabel} *</label>
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
                        <label style={{ fontSize: '0.78rem', fontWeight: 800, color: '#1e293b', display: 'block', marginBottom: 8 }}>{t.eoiPaymentMethodLabel} *</label>
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
                        <label style={{ fontSize: '0.78rem', fontWeight: 800, color: '#1e293b', display: 'block', marginBottom: 8 }}>{t.eoiPaymentMethodLabel}</label>
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
                          <label style={{ fontSize: '0.78rem', fontWeight: 800, color: '#1e293b', display: 'block', marginBottom: 8 }}>{t.eoiReceiptUpload}</label>
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
                              id="eoi-receipt-file-input"
                            />
                            <label
                              htmlFor="eoi-receipt-file-input"
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
                            <label style={{ fontSize: '0.78rem', fontWeight: 800, color: '#1e293b', display: 'block', marginBottom: 8 }}>{t.eoiPassportUpload}</label>
                            <div style={{ position: 'relative' }}>
                              <input
                                type="file"
                                accept=".jpg,.jpeg,.png,.pdf"
                                required
                                onChange={e => {
                                  if (e.target.files && e.target.files.length > 0) {
                                    setPassportFile(e.target.files[0]);
                                  }
                                }}
                                style={{ display: 'none' }}
                                id="eoi-passport-file-input"
                              />
                              <label
                                htmlFor="eoi-passport-file-input"
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
                                <Globe size={18} color="#003DA6" />
                                <span style={{ fontSize: '0.78rem', color: '#5c6c7f', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '80%' }}>
                                  {passportFile ? passportFile.name : t.eoiUploadHint}
                                </span>
                              </label>
                            </div>
                          </div>
                        )}

                        <button type="submit" className="btn-luxury-primary" style={{ width: '100%', justifyContent: 'center', padding: '14px', marginTop: 10 }} disabled={eoiProcessing}>
                          {eoiProcessing ? (
                            <>
                              <div className="animate-spin" style={{ width: 14, height: 14, border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: '50%', marginRight: 8 }} />
                              {t.eoiProcessing}
                            </>
                          ) : t.eoiPaySubmit}
                        </button>
                      </div>
                    )}
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
                  <strong style={{ 
                    fontSize: eoiResult?.queue_number ? '3rem' : '1.8rem', 
                    color: '#001A70', 
                    fontFamily: 'var(--font-title)', 
                    display: 'block', 
                    lineHeight: 1.2, 
                    fontWeight: 900,
                    margin: '8px 0'
                  }}>
                    {eoiResult?.queue_number 
                      ? `#${eoiResult.queue_number}` 
                      : (lang === 'en' ? 'PENDING REVIEW' : 'قيد المراجعة')}
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
         PROJECT DETAILS MODAL
         ─────────────────────────────────────────────────── */}
      {showDetailsModal && detailsProject && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{
            maxWidth: 700, width: 'calc(100% - 32px)', padding: 36, borderRadius: '24px',
            maxHeight: '92vh', overflowY: 'auto', position: 'relative', border: '1.5px solid rgba(0, 61, 166, 0.15)',
            background: 'linear-gradient(135deg, #001233 0%, #00071c 100%)',
            color: '#ffffff'
          }}>
            <button
              onClick={() => setShowDetailsModal(false)}
              style={{
                position: 'absolute', top: 24, [lang === 'ar' ? 'left' : 'right']: 24,
                background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.5rem', color: '#C5A880',
                fontWeight: 'bold', padding: 4, zIndex: 10
              }}
            >
              ✕
            </button>

            <div style={{ marginBottom: 24, [lang === 'ar' ? 'paddingLeft' : 'paddingRight']: 32 }}>
              <span style={{ fontSize: '0.75rem', color: '#C5A880', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', display: 'block', marginBottom: 6 }}>
                {detailsProject.project_type || (lang === 'en' ? 'Luxury Compound' : 'كمبوند فاخر')}
              </span>
              <h3 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#ffffff', marginBottom: 8, fontFamily: 'var(--font-title)' }}>
                {detailsProject.name}
              </h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem', color: '#C5A880', fontWeight: 700 }}>
                <MapPin size={15} />
                <span>{detailsProject.location}</span>
              </div>
            </div>

            {/* Tabs Headers */}
            <div style={{ display: 'flex', borderBottom: '1px solid rgba(197, 168, 128, 0.25)', gap: '24px', marginBottom: '24px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => setDetailsTab('prices')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: detailsTab === 'prices' ? '#C5A880' : '#8a9ab0',
                  fontSize: '0.95rem',
                  fontWeight: 800,
                  padding: '10px 0',
                  cursor: 'pointer',
                  position: 'relative',
                  transition: 'all 0.3s ease',
                  fontFamily: 'var(--font-title)',
                }}
              >
                {t.tabPriceArea}
                {detailsTab === 'prices' && (
                  <span style={{ position: 'absolute', bottom: -1, left: 0, width: '100%', height: '2.5px', background: '#C5A880' }} />
                )}
              </button>
              <button
                type="button"
                onClick={() => setDetailsTab('payments')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: detailsTab === 'payments' ? '#C5A880' : '#8a9ab0',
                  fontSize: '0.95rem',
                  fontWeight: 800,
                  padding: '10px 0',
                  cursor: 'pointer',
                  position: 'relative',
                  transition: 'all 0.3s ease',
                  fontFamily: 'var(--font-title)',
                }}
              >
                {t.tabPaymentPlans}
                {detailsTab === 'payments' && (
                  <span style={{ position: 'absolute', bottom: -1, left: 0, width: '100%', height: '2.5px', background: '#C5A880' }} />
                )}
              </button>
              <button
                type="button"
                onClick={() => setDetailsTab('master_plan')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: detailsTab === 'master_plan' ? '#C5A880' : '#8a9ab0',
                  fontSize: '0.95rem',
                  fontWeight: 800,
                  padding: '10px 0',
                  cursor: 'pointer',
                  position: 'relative',
                  transition: 'all 0.3s ease',
                  fontFamily: 'var(--font-title)',
                }}
              >
                {t.tabMasterPlan}
                {detailsTab === 'master_plan' && (
                  <span style={{ position: 'absolute', bottom: -1, left: 0, width: '100%', height: '2.5px', background: '#C5A880' }} />
                )}
              </button>
            </div>

            {/* TAB CONTENT: PRICES & SPACES */}
            {detailsTab === 'prices' && (
              <div>
                {loadingDetailsUnits ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 0' }}>
                    <div style={{
                      width: 32, height: 32, border: '3px solid rgba(197, 168, 128, 0.15)',
                      borderTopColor: '#C5A880', borderRadius: '50%', animation: 'spin 1.2s linear infinite'
                    }} />
                    <span style={{ fontSize: '0.85rem', color: '#8a9ab0', marginTop: 12 }}>
                      {lang === 'en' ? 'Calculating pricing inventory...' : 'جاري تحليل مخزون الأسعار...'}
                    </span>
                  </div>
                ) : (
                  <div>
                    {Object.keys(groupedRanges).length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {Object.entries(groupedRanges).map(([type, stats]: any) => (
                          <div key={type} style={{
                            background: 'rgba(255, 255, 255, 0.03)',
                            border: '1px solid rgba(197, 168, 128, 0.15)',
                            borderRadius: '16px',
                            padding: '18px 24px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            flexWrap: 'wrap',
                            gap: '12px'
                          }}>
                            <div>
                              <span style={{ display: 'block', fontSize: '1.05rem', fontWeight: 800, color: '#ffffff', textTransform: 'capitalize', fontFamily: 'var(--font-title)' }}>
                                {getUnitTypeTranslation(type, lang)}
                              </span>
                              <span style={{ display: 'block', fontSize: '0.78rem', color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>
                                {stats.count} {lang === 'en' ? 'Available Units' : 'وحدة متاحة'}
                              </span>
                            </div>
                            <div style={{ display: 'flex', gap: '32px', flexWrap: 'wrap' }}>
                              <div>
                                <span style={{ display: 'block', fontSize: '0.7rem', color: '#C5A880', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.04em' }}>
                                  {t.areaRange}
                                </span>
                                <strong style={{ fontSize: '1rem', color: '#ffffff' }}>
                                  {stats.minArea === stats.maxArea ? `${stats.minArea} م²` : `${stats.minArea} - ${stats.maxArea} م²`}
                                </strong>
                              </div>
                              <div>
                                <span style={{ display: 'block', fontSize: '0.7rem', color: '#C5A880', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.04em' }}>
                                  {t.priceRange}
                                </span>
                                <strong style={{ fontSize: '1rem', color: '#C5A880' }}>
                                  {stats.minPrice === stats.maxPrice 
                                    ? `${formatCurrency(stats.minPrice, lang)}` 
                                    : `${formatCurrency(stats.minPrice, lang)} - ${formatCurrency(stats.maxPrice, lang)}`}
                                </strong>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ textAlign: 'center', padding: '30px 10px', color: '#8a9ab0' }}>
                        {lang === 'en' ? 'No detailed inventory pricing available at this stage.' : 'لا توجد تفاصيل أسعار متاحة لهذه المرحلة حالياً.'}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* TAB CONTENT: PAYMENT PLANS */}
            {detailsTab === 'payments' && (
              <div>
                {detailsProject.payment_plans && detailsProject.payment_plans.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {detailsProject.payment_plans.map((plan: any) => (
                      <div key={plan.id} style={{
                        background: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid rgba(197, 168, 128, 0.15)',
                        borderRadius: '16px',
                        padding: '20px 24px',
                        position: 'relative'
                      }}>
                        {plan.discount_pct > 0 && (
                          <span style={{
                            position: 'absolute',
                            top: 16,
                            right: lang === 'en' ? 24 : 'auto',
                            left: lang === 'ar' ? 24 : 'auto',
                            background: '#16a34a',
                            color: '#ffffff',
                            fontSize: '0.7rem',
                            fontWeight: 800,
                            padding: '4px 10px',
                            borderRadius: '6px'
                          }}>
                            {plan.discount_pct}% {lang === 'en' ? 'Cash Discount' : 'خصم كاش'}
                          </span>
                        )}
                        <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#C5A880', marginBottom: 8, fontFamily: 'var(--font-title)' }}>
                          {lang === 'ar' ? (plan.name_ar || plan.name) : plan.name}
                        </h4>
                        <p style={{ fontSize: '0.82rem', color: 'rgba(255, 255, 255, 0.7)', lineHeight: 1.5, margin: '0 0 16px 0' }}>
                          {plan.description || (lang === 'en' ? 'Flexible payment structures configured for signature client requirements.' : 'خطط سداد مرنة مهيأة لتناسب متطلبات العملاء الحصرية.')}
                        </p>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: 14 }}>
                          <div>
                            <span style={{ display: 'block', fontSize: '0.68rem', color: '#8a9ab0', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                              {lang === 'en' ? 'Down Payment' : 'المقدم'}
                            </span>
                            <strong style={{ fontSize: '1.05rem', color: '#ffffff' }}>
                              {plan.down_payment_pct}%
                            </strong>
                          </div>
                          <div>
                            <span style={{ display: 'block', fontSize: '0.68rem', color: '#8a9ab0', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                              {lang === 'en' ? 'Installment Period' : 'فترة التقسيط'}
                            </span>
                            <strong style={{ fontSize: '1.05rem', color: '#ffffff' }}>
                              {plan.installments === 0 
                                ? (lang === 'en' ? 'Cash' : 'فوري (كاش)') 
                                : (plan.installments % 12 === 0 
                                    ? `${plan.installments / 12} ${lang === 'en' ? 'Years' : 'سنوات'}`
                                    : `${plan.installments} ${lang === 'en' ? 'Months' : 'شهراً'}`)}
                            </strong>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '30px 10px', color: '#8a9ab0' }}>
                    {lang === 'en' ? 'Standard payment plans are currently under review.' : 'خطط السداد قيد المراجعة والاعتماد حالياً.'}
                  </div>
                )}
              </div>
            )}

            {/* TAB CONTENT: MASTER PLAN */}
            {detailsTab === 'master_plan' && (
              <div>
                {/* Master Plan Status & Stats Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                  {detailsProject.land_area && (
                    <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '14px' }}>
                      <span style={{ display: 'block', fontSize: '0.65rem', color: '#8a9ab0', textTransform: 'uppercase' }}>{t.landArea}</span>
                      <strong style={{ fontSize: '1rem', color: '#ffffff', display: 'block', marginTop: 4 }}>
                        {Number(detailsProject.land_area).toLocaleString()} {detailsProject.land_area_unit || 'sqm'}
                      </strong>
                    </div>
                  )}
                  {detailsProject.building_ratio && (
                    <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '14px' }}>
                      <span style={{ display: 'block', fontSize: '0.65rem', color: '#8a9ab0', textTransform: 'uppercase' }}>{t.buildingRatio}</span>
                      <strong style={{ fontSize: '1rem', color: '#ffffff', display: 'block', marginTop: 4 }}>
                        {detailsProject.building_ratio}%
                      </strong>
                    </div>
                  )}
                  {detailsProject.total_buildings_count && (
                    <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '14px' }}>
                      <span style={{ display: 'block', fontSize: '0.65rem', color: '#8a9ab0', textTransform: 'uppercase' }}>{lang === 'en' ? 'Buildings' : 'عدد المباني'}</span>
                      <strong style={{ fontSize: '1rem', color: '#ffffff', display: 'block', marginTop: 4 }}>
                        {detailsProject.total_buildings_count}
                      </strong>
                    </div>
                  )}
                  {detailsProject.total_green_area && (
                    <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '14px' }}>
                      <span style={{ display: 'block', fontSize: '0.65rem', color: '#8a9ab0', textTransform: 'uppercase' }}>{t.greenArea}</span>
                      <strong style={{ fontSize: '1rem', color: '#ffffff', display: 'block', marginTop: 4 }}>
                        {Number(detailsProject.total_green_area).toLocaleString()} م²
                      </strong>
                    </div>
                  )}
                </div>

                {/* Master Plan Image Showcase */}
                {detailsProject.master_plan_svg_url || detailsProject.master_plan_image_url ? (
                  <div style={{
                    border: '1.5px solid rgba(197, 168, 128, 0.25)',
                    borderRadius: '20px',
                    overflow: 'hidden',
                    background: '#000c24',
                    position: 'relative',
                    marginBottom: '20px'
                  }}>
                    <img
                      src={(() => {
                        const mp = detailsProject.master_plan_svg_url || detailsProject.master_plan_image_url;
                        if (!mp) return '';
                        return mp.startsWith('http') ? mp : `http://127.0.0.1:8000/storage/${mp}`;
                      })()}
                      alt="Project Master Plan"
                      style={{
                        width: '100%',
                        height: 'auto',
                        maxHeight: '400px',
                        objectFit: 'contain',
                        display: 'block',
                        margin: '0 auto'
                      }}
                    />
                    <div style={{
                      position: 'absolute',
                      bottom: '12px',
                      [lang === 'ar' ? 'left' : 'right']: '12px',
                      background: 'rgba(0, 15, 61, 0.85)',
                      border: '1px solid rgba(197, 168, 128, 0.3)',
                      borderRadius: '8px',
                      padding: '6px 12px',
                      fontSize: '0.65rem',
                      color: '#C5A880',
                      fontWeight: 800
                    }}>
                      {lang === 'en' ? 'APPROVED MASTER PLAN' : 'مخطط معتمد'}
                    </div>
                  </div>
                ) : (
                  <div style={{
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1.5px dashed rgba(197, 168, 128, 0.2)',
                    borderRadius: '20px',
                    padding: '40px',
                    textAlign: 'center',
                    color: '#8a9ab0',
                    marginBottom: '20px'
                  }}>
                    <Layers size={36} color="#C5A880" style={{ marginBottom: 12, opacity: 0.6 }} />
                    <p style={{ margin: 0, fontSize: '0.85rem' }}>
                      {lang === 'en' ? 'Master Plan visualization is undergoing administrative approval.' : 'المخطط التفصيلي للمشروع قيد الاعتماد والمراجعة الإدارية.'}
                    </p>
                  </div>
                )}

                {/* Infrastructure/Notes block */}
                {detailsProject.infrastructure_notes && (
                  <div style={{
                    background: 'rgba(197, 168, 128, 0.05)',
                    border: '1px solid rgba(197, 168, 128, 0.15)',
                    borderRadius: '16px',
                    padding: '16px 20px'
                  }}>
                    <span style={{ display: 'block', fontSize: '0.72rem', color: '#C5A880', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 800, marginBottom: 8 }}>
                      {t.infraNotes}
                    </span>
                    <p style={{ margin: 0, fontSize: '0.82rem', color: 'rgba(255, 255, 255, 0.85)', lineHeight: 1.6 }}>
                      {detailsProject.infrastructure_notes}
                    </p>
                  </div>
                )}
              </div>
            )}
            
            {/* Modal Footer Actions */}
            <div style={{ marginTop: '32px', display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '20px' }}>
              <button
                type="button"
                className="btn-luxury-primary"
                onClick={() => {
                  setShowDetailsModal(false);
                  openEoiModal(detailsProject);
                }}
                style={{
                  background: 'linear-gradient(135deg, #d4af37 0%, #C5A880 50%, #aa7c11 100%)',
                  color: '#000c24',
                  border: 'none',
                  padding: '12px 30px',
                  borderRadius: '12px',
                  fontWeight: 800,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <CreditCard size={15} />
                <span>{t.heroCta}</span>
              </button>
            </div>

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
                background: 'rgba(0, 61, 166, 0.05)',
                border: '1px solid rgba(0, 61, 166, 0.12)',
                borderRadius: '12px',
                padding: '12px 16px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
                fontSize: '0.92rem',
                fontWeight: 700,
                color: '#003DA6',
                width: '100%',
                transition: 'all 0.25s ease'
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
                  width: '100%',
                  padding: '12px',
                  borderRadius: '12px',
                  border: 'none',
                  color: '#ffffff',
                  background: 'linear-gradient(135deg, #003DA6 0%, #001f5c 100%)',
                  cursor: 'pointer',
                  fontWeight: 700,
                  fontSize: '0.92rem',
                  textAlign: 'center',
                  boxShadow: '0 4px 12px rgba(0, 61, 166, 0.15)',
                  transition: 'all 0.25s ease'
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
