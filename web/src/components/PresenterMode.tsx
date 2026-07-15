import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import {
  X, ChevronLeft, ChevronRight, Eye, EyeOff, AlertTriangle, Quote, Sparkles, Copy, Check,
  Zap, Play, Send, Mail, KeyRound,
} from 'lucide-react';

/**
 * Presenter Mode — the 30-minute pitch, driven by the person in the room.
 *
 * Distinct from <DemoTour />, which auto-plays a narrated walkthrough *for a
 * visitor*. This one is for the *presenter*: it opens on a full-screen slide of
 * the problems the client already has, then walks act by act through the real
 * product — signing into the right role and landing on the right page for each —
 * while a side panel holds the lines to say. Nothing auto-advances; the room
 * sets the pace.
 *
 * Trigger:  window.dispatchEvent(new CustomEvent('redp-presenter-start'))
 * Keys:     Space / PageDown → next   ·   PageUp → back
 *           H → hide the script panel ·   Esc → end
 * (PageUp/PageDown means a presentation clicker drives it.)
 */

const BACKUP_KEY = 'redp_presenter_backup';

/**
 * Demo roles the backend will mint a session for.
 *   visitor → sign out.
 *   invited → sign in as the client who was actually invited a moment ago, so the
 *             room watches the real buyer walk back in, not a stand-in.
 */
type Role = 'visitor' | 'admin' | 'broker' | 'client' | 'invited';

/**
 * A button that makes the app do the thing — the page listening on
 * `redp-demo-action` fills the form, picks the unit, posts the EOI. The presenter
 * talks; nobody types a national ID in front of a client.
 */
interface Stage {
  label: string;
  action: string;
  value?: string;
  /** The one that commits something real. Rendered loud. */
  primary?: boolean;
}

/** What the client receives. Shown as an overlay — this is a preview, not a mailbox. */
interface EmailPreview {
  subject: string;
  to: string;
  lines: string[];
  rows?: [string, string][];
  credentials?: { email: string; password: string };
  cta: string;
}

interface Act {
  numeral: string;
  title: string;
  /** Minute the act should start / end, for the pacing clock. */
  from: number;
  to: number;
  role: Role;
  /** Landed on when the act opens. */
  route: string;
  /** Other pages worth opening mid-act; the presenter clicks to jump. */
  alsoVisit?: { label: string; route: string }[];
  /** The lines to actually say, in order. */
  say: string[];
  /** What to click, in order. */
  scene: string[];
  /** One click = the app does it, with the data already filled in. */
  stages?: Stage[];
  /** Questions for the AI. Click to ask — it opens the assistant and sends. */
  aiPrompts?: string[];
  /** The email this act causes to be sent. */
  email?: EmailPreview;
  caution?: string;
}

/**
 * The opening slide is a title card, not a pitch: the presenter says the problems
 * out loud. All the slide does is name the product and show the running order.
 */
const COVER = {
  eyebrow: 'REAL ESTATE DEVELOPMENT PLATFORM',
  title: 'REDP',
  tagline: 'من أول زائر على الموقع الساعة ٢ بالليل — لحد القيد المحاسبي في الدفاتر. سيستم واحد.',
};

const ACTS: Act[] = [
  {
    numeral: 'I',
    title: 'نور — مندوبة المبيعات اللي بتشتغل ٢٤ ساعة',
    from: 3,
    to: 6,
    role: 'visitor',
    route: '/',
    say: [
      'الزائر ده دخل الموقع الساعة ٢ بالليل ومحدش من مبيعاتك صاحي. بصّوا — المكالمة بترنّ لوحدها.',
      'دي نور. مندوبة مبيعات بالذكاء الاصطناعي، بصورة وصوت، بتردّ على أي سؤال — عن المشروع، عن التقسيط، عن التسليم.',
      'اسألوها انتم. أي حاجة. ومتقلقوش من السؤال الصعب — ده بالظبط اللي عايزكم تجربوه.',
      'العميل اللي بيتردّ عليه في ثانيتين مش بيروح للمطوّر اللي جنبك.',
      'واللي جاي أهم: الزائر ده دلوقتي هيختار وحدته ويدفع — من غير ما يكلّم بني آدم واحد من عندك.',
    ],
    scene: [
      'استنى المكالمة ترنّ (تحت على اليمين) → رد بالزرار الأخضر.',
      'اسألها بصوتك: «عندكم إيه وبكام؟» — وسيبها ترد قدامهم.',
      'اضرب بسؤال الإقناع: «ليه أشتري منكم مش من مطوّر تاني؟»',
      'اداري السؤال للعميل نفسه — سيبه هو يسألها. ده أقوى بكتير من إنك تسأل.',
      'اقفل المكالمة واتحرك — الوقت هنا بيجري.',
    ],
    caution:
      'نور بتحتاج نت كويس وميكروفون شغّال — جرّبها في القاعة قبل ما تبدأ. لو مردتش، اقفز للفصل اللي بعده على طول وقول إن المساعد بيتبعت لينك للعميل.',
  },
  {
    numeral: 'II',
    title: 'بيختار مشروعه ويدفع الـ EOI — يحجز مكانه في الطابور',
    from: 6,
    to: 11,
    role: 'visitor',
    route: '/',
    // Golden Gates by name, so the buyer lands in the same queue the admin ranks
    // and invites from two acts later. Falls back to the first project with units.
    stages: [
      { label: '١ · افتح تذكرة الـ EOI على Golden Gates', action: 'open-eoi', value: 'Golden Gates' },
      { label: '٢ · بياناته (اسم، تليفون، رقم قومي)', action: 'fill-contact' },
      { label: '٣ · مستوى معيشته (دخل، تعليم، عربيات)', action: 'fill-profile' },
      { label: '٤ · الدفع + إيصال إنستاباي', action: 'fill-payment' },
      { label: '٥ · ابعت الـ EOI فعلياً ←', action: 'submit-eoi', primary: true },
      { label: '⚡ لو الوقت ضاق: الخطوات كلها أوتوماتيك', action: 'eoi-autopilot', value: 'Golden Gates' },
    ],
    say: [
      'ركّزوا معايا هنا، دي أهم نقطة في السيستم كله: هو لسه ما اختارش شقة. هو بيدفع علشان يحجز *مكانه في الطابور* على المشروع.',
      'خمسين ألف جنيه جدية حجز، بإنستاباي، وبيرفع الإيصال بنفسه. لسه محدش من عندك اتكلّم معاه.',
      'ولاحظوا الاستمارة بتسأله عن إيه: دخله، تعليمه، عياله في مدارس إيه، عنده كام عربية. مش فضول — دي بالظبط اللي هترتّب بيها الطابور بعد شوية.',
      'ولو جه من لينك بروكر، الاستمارة بتقوله «الحجز هيتسجّل باسم أحمد» قبل ما يبعت. خناقة العمولة اتقفلت هنا، قبل ما تحصل.',
      'دوست ابعت — دلوقتي ده EOI حقيقي في الداتابيز، حالته «قيد المراجعة»، ومستني محاسبك. والشقة؟ لسه بدري عليها — ما يختارهاش غير لما ييجي دوره.',
    ],
    scene: [
      'دوس الزراير بالترتيب — كل زرار بيملى خطوة قدامهم وانت بتتكلم.',
      'قف عند خطوة مستوى المعيشة واتكلم — دي اللي بتغذّي ترتيب الطابور بعدين.',
      'ورّيهم الإيصال وهو بيترفع.',
      'زرار «ابعت» بيعمل EOI حقيقي — مش تمثيل. قول الجملة دي بصوت عالي.',
      'اقفل بالسؤال: «طيب دفع… هو دلوقتي رقم كام في الطابور؟»',
    ],
    caution:
      'متقولش «بيحجز شقة» — بيحجز مكان في المشروع. اختيار الشقة فصل VI، بعد الدعوة. لو ضغطت «ابعت» مرتين في نفس العرض، السيستم بيرفض التاني (نفس العميل، نفس المشروع) وده صح مش عطل.',
  },
  {
    numeral: 'III',
    title: 'المحاسب بيقبل الدفعة — والإيميل بيروح للعميل',
    from: 11,
    to: 14,
    role: 'admin',
    route: '/acquisition/eoi-reservations',
    email: {
      subject: 'EOI Reservation Approved — Order #EOI-2026-000142',
      to: 'Ahmed Mostafa',
      lines: [
        'أهلاً أحمد،',
        'تم مراجعة إيصال الدفع الخاص بك وقبول جدية الحجز.',
        'تم تسجيل مكانك في طابور الأولوية بناءً على توقيت الدفع.',
        'هتستلم دعوة لاختيار وحدتك بمجرد ما يجي دورك.',
      ],
      rows: [
        ['رقم الأوردر', 'EOI-2026-000142'],
        ['رقم الطابور', '#25'],
        ['طريقة الدفع', 'InstaPay Transfer'],
        ['المبلغ', 'EGP 50,000.00'],
      ],
      cta: 'تابع حالة طلبك',
    },
    say: [
      'محاسبك بيفتح الإيصال ويشوفه بعينه، ويوافق. مفيش حد بيدخّل أرقام من ورق.',
      'ثانية الموافقة دي بيحصل فيها تلات حاجات لوحدهم: رقم أوردر رسمي، رقم دور في الطابور، وإيميل بيروح للعميل.',
      'ده الإيميل اللي أحمد استلمه دلوقتي. رقم الأوردر ورقم الطابور جواه — بقى ليه رقم يسأل بيه.',
      'ومن هنا العميل في الطابور رسمياً. تعالوا نبص على الطابور كله.',
    ],
    scene: [
      'Pending Review → افتح إيصال أحمد قدامهم واتفرّج عليه.',
      'Approve → رقم الأوردر ورقم الطابور بيتولّدوا في نفس اللحظة.',
      'دوس «ورّي الإيميل اللي وصله» تحت — وسيبه على الشاشة وانت بتتكلم.',
      'روح All Reservations → ورّيهم الطابور: عملاء دافعين ومستنيين.',
      'اقفل بالسؤال: «دلوقتي السؤال الصعب — مين فيهم يختار الأول؟»',
    ],
  },
  {
    numeral: 'IV',
    title: '★ الأدمن بيرتّب الطابور بالكلام — مش بالكود',
    from: 14,
    to: 19,
    role: 'admin',
    route: '/acquisition/eoi-reservations',
    aiPrompts: [
      'كام EOI متوافق عليه في مشروع Golden Gates؟',
      'خلي ترتيب الطابور smart، وادي ١٠٠ نقطة للعملاء السابقين و٥٠ للي بيدفع كاش و١٥٠ للـ VIP',
      'ضيف قاعدة: أي حد دخله الشهري فوق ١٥٠ ألف ياخد ٣٠ نقطة',
      'وريني أول ١٠ في طابور Golden Gates',
    ],
    say: [
      'الطابور دلوقتي مرتّب بالأسبقية — اللي دفع الأول واقف الأول. دي القاعدة الافتراضية، وصفر اجتهاد فيها.',
      'بس افرض قررت إن العميل اللي اشترى منك قبل كده يستاهل أولوية. مش هفتح إعدادات، ومش هكلّم مبرمج — هقوله بالعربي.',
      'شوف اللي حصل: الطابور اتعاد حسابه للكل مرة واحدة. أنا ما رفعتش حد بعينه — أنا غيّرت القاعدة على الكل.',
      'وفاكرين دخل أحمد اللي الاستمارة سألت عنه؟ القاعدة الأخيرة دي بالظبط اللي بتحرّكه. البيانات اللي جمعناها في الأول بقى ليها معنى دلوقتي.',
      'ولو اتساوى اتنين في كل حاجة؟ اللي دفع الأول بياخد الأول. الوقت هو الحكم الأخير دايماً.',
      'وكل كلمة قلتها للمساعد اتسجّلت في سجل التدقيق باسمي وساعتها. الواسطة مش مستحيلة — بس بقت مرئية.',
    ],
    scene: [
      'قبل ما تغيّر أي حاجة — خلّي عينهم على أول ٥ في الطابور.',
      'دوس على الجُمل اللي تحت واحدة واحدة — بتتبعت للمساعد لوحدها.',
      'استنى الرد كامل قبل ما تبعت اللي بعدها.',
      'ارجع للطابور بعد كل أمر — سيبهم يشوفوه بيتقلب.',
    ],
    caution:
      'ده أقوى ٥ دقايق عندك. لو الوقت ضاق في أي فصل تاني — ضحّي بيه مش بده. ومتقولش إن لوحة الأولويات بتغيّر رقم الدور؛ دي نظام تاني منفصل.',
  },
  {
    numeral: 'V',
    title: 'الدعوات — حسابات وباسوردات وإيميلات، بجملة واحدة',
    from: 19,
    to: 22,
    role: 'admin',
    route: '/acquisition/eoi-reservations',
    aiPrompts: [
      'ابعت دعوة لأول ٢٠ عميل في طابور Golden Gates ومهلة ٤٨ ساعة',
    ],
    email: {
      subject: "Mountain View — You're Invited to Select Your Unit!",
      to: 'Ahmed Mostafa',
      lines: [
        'أهلاً أحمد،',
        'جه دورك. تقدر تدخل دلوقتي وتختار وحدتك في المشروع.',
        'استخدم البيانات دي للدخول — وعندك ٤٨ ساعة قبل ما دورك يروح للي بعدك.',
      ],
      rows: [
        ['رقم الأوردر', 'EOI-2026-000142'],
        ['رقم الطابور', '#25'],
        ['المهلة', '٤٨ ساعة'],
      ],
      credentials: { email: 'ahmed.mostafa@example.com', password: 'Kp7ax2Qm9v' },
      cta: 'اختار وحدتك دلوقتي',
    },
    say: [
      'الطابور اتظبط. دلوقتي عايز أدعو أول عشرين يختاروا وحداتهم — بجملة واحدة.',
      'اللي حصل في الثانية دي: السيستم عمل لكل واحد فيهم حساب دخول، ولّد له باسورد مؤقت، وبعتله إيميل فيه بياناته والمهلة.',
      'ده الإيميل اللي أحمد استلمه — جواه اسم المستخدم والباسورد ولينك يدخل بيه يختار.',
      'والمهلة دي بتتنفّذ لوحدها. لو ما اختارش في ٤٨ ساعة، دوره بيروح للي بعده من غير ما حد يفتكر ومن غير ما حد يزعل.',
    ],
    scene: [
      'دوس على جملة الدعوة تحت — بتتبعت للمساعد.',
      'ورّيهم الرد: مين اتدعى وكام واحد.',
      'دوس «ورّي الإيميل اللي وصله» — وقف على بيانات الدخول.',
      'قول: «دلوقتي نبص بعين أحمد نفسه — هو فتح الإيميل ودخل.»',
    ],
  },
  {
    numeral: 'VI',
    title: 'دلوقتي بس — أحمد بيدخل ويختار وحدته',
    from: 22,
    to: 25,
    role: 'invited',
    route: '/unit-selection',
    stages: [
      { label: '١ · ادخل بحسابه وافتح الخريطة على وحدة متاحة', action: 'pick-unit', value: 'Golden Gates' },
      { label: '٢ · افتح تأكيد الحجز — وريهم رقم دوره في الطابور', action: 'open-claim', value: 'Golden Gates' },
      { label: '٣ · أكّد الحجز — الوحدة تتقفل باسمه ←', action: 'confirm-claim', value: 'Golden Gates', primary: true },
      { label: '⚡ لو الوقت ضاق: الكل مرة واحدة', action: 'claim-unit', value: 'Golden Gates' },
    ],
    say: [
      'دلوقتي بس بقى له حق يختار شقة. دفع، اتراجع، اترتّب في الطابور، واتدعى — الأربع خطوات دول لازم يعدّوا الأول.',
      'وإحنا داخلين بحساب أحمد نفسه — العميل اللي لسه واصله الإيميل من دقيقتين. مش حساب تجريبي.',
      'دي أول مرة يشوف فيها خريطة الوحدات وهو معاه حق يحجز: ماستر بلان → مبنى → دور → شقة.',
      'ضغطة واحدة وخلاص. من غير استمارة تانية، ومن غير ما يدفع تاني — هو دافع من البداية.',
      'الوحدة اتقفلت باسمه في الداتابيز. اللي بعده في الطابور بيفتح نفس الخريطة يلاقيها مقفولة.',
      'العملية اللي كانت بتتاخد في قاعة وطوابير وورق — خلصت من موبايله وهو في البيت.',
    ],
    scene: [
      'دوس الزراير بالترتيب — كل زرار خطوة، متستعجلش عليهم.',
      'خطوة ١: ورّيهم الاسم فوق (أحمد داخل بحسابه)، والخريطة بتمشي لحد شقة متاحة.',
      'خطوة ٢: تأكيد الحجز بيفتح — وقف على السطر اللي بيقول «مرحباً أحمد، دورك رقم ٦».',
      'خطوة ٣: أكّد — الوحدة بتتحوّل لـ محجوزة قدامهم فوراً، من غير استمارة ولا دفع تاني.',
      'قول: «الطابور اشتغل من غير موظف واحد يمسكه.»',
    ],
    caution: 'امشي بالزراير واحد واحد عشان تشرح كل خطوة. لو ما ظهرش «مرحباً أحمد» — يبقى الدعوات في الفصل اللي فات ما اتبعتتش؛ ارجع لفصل V وابعتها الأول.',
  },
  {
    numeral: 'VII',
    title: 'البروكر — قفل العميل والعمولة',
    from: 25,
    to: 27,
    role: 'broker',
    route: '/sales/broker/dashboard',
    alsoVisit: [{ label: 'مراجعة شركات التسويق (أدمن)', route: '/acquisition/broker-companies' }],
    say: [
      'أول بروكر بيسجّل العميل بياخد قفل ٩٠ يوم — بس مش بكلامه هو. العميل نفسه بيأكّد بكود بيوصله.',
      'علشان كده القفل ده بيصمد قدام أي خناقة. وشركة التسويق بتسجّل نفسها وترفع ورقها، وحسابها مش بيفتح قبل موافقتك.',
    ],
    scene: [
      'Overview → لينك الإحالة والـ QR.',
      'Lead Protection Lock → سجّل عميل → الكود بيروح للعميل → قفل ٩٠ يوم.',
      'جرّب نفس الرقم من بروكر تاني → بيترفض فوراً.',
      'اذكر تقسيم العمولة: المندوب + قائد الفريق + صاحب الشركة.',
    ],
  },
  {
    numeral: 'VIII',
    title: 'الفلوس — لحظة المدير المالي',
    from: 27,
    to: 30,
    role: 'admin',
    route: '/finance/inventory',
    alsoVisit: [
      { label: 'موافقات خطط السداد', route: '/finance/plan-approvals' },
      { label: 'قيود اليومية', route: '/enterprise/accounting/entries' },
      { label: 'دفتر العمولات', route: '/enterprise/commission/ledger' },
      { label: 'سجل التدقيق', route: '/enterprise/audit' },
    ],
    say: [
      'الوحدة بتتقفل في الداتابيز نفسها. لو مندوب تاني ضغط حجز في نفس الجزء من الثانية — بيترفض. ده مش سياسة، ده منع فيزيائي.',
      'الخطة فيها خصم؟ العقد ما ينفعش يتوقّع قبل ما المالية توافق. مش إشعار — الزرار نفسه مقفول.',
      'والقيد ده — محدش كتبه. اتقيّد لوحده لحظة التوقيع. محاسبك بيراجع مش بيدخّل.',
      'والعمولة اتحسبت لما القسط دخل خزنتك، مش لما العقد اتوقّع. انت بتدفع من فلوس قبضتها.',
    ],
    scene: [
      'Inventory → احجز وحدة، وقول جملة القفل.',
      'خطة سداد فيها خصم → Plan Approvals → وافق كمالية.',
      'وقّع العقد → الوحدة مباعة + العميل اتبعتله بيانات بورتاله أوتوماتيك.',
      'Journal Entries → القيد اللي اتقيّد لوحده. ده المشهد اللي بيقفل المدير المالي.',
      'Commission Ledger → العمولة عند التحصيل.',
    ],
    caution: 'الفصل ده مضغوط. لو الوقت ضاق، اكتفي بقفل الوحدة + بوابة الخصم + القيد التلقائي.',
  },
];

/** Step 0 = the problems slide, 1..N = acts, N+1 = the close. */
const LAST = ACTS.length + 1;

const PresenterMode: React.FC = () => {
  const navigate = useNavigate();

  const [active, setActive] = useState(false);
  const [step, setStep] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [panelHidden, setPanelHidden] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  /** Ticked off as you go, so a glance tells you where you are mid-sentence. */
  const [ran, setRan] = useState<string[]>([]);
  const [asked, setAsked] = useState<string[]>([]);
  const [showEmail, setShowEmail] = useState(false);

  const roleRef = useRef<Role | null>(null);

  const act = step >= 1 && step <= ACTS.length ? ACTS[step - 1] : null;

  /** Typing an Arabic prompt by hand in front of a client is how typos happen. */
  const copy = useCallback((text: string) => {
    navigator.clipboard?.writeText(text).then(
      () => {
        setCopied(text);
        setTimeout(() => setCopied(c => (c === text ? null : c)), 1600);
      },
      () => {
        /* clipboard blocked — the presenter can still read it off the panel */
      }
    );
  }, []);

  // ── session handling: presenter mode borrows demo logins, then gives the seat back ──
  const backupSession = () => {
    if (sessionStorage.getItem(BACKUP_KEY)) return;
    sessionStorage.setItem(
      BACKUP_KEY,
      JSON.stringify({
        token: localStorage.getItem('redp_token'),
        user: localStorage.getItem('redp_user'),
      })
    );
  };

  const restoreSession = () => {
    const raw = sessionStorage.getItem(BACKUP_KEY);
    if (raw) {
      try {
        const { token, user } = JSON.parse(raw);
        if (token) localStorage.setItem('redp_token', token);
        else localStorage.removeItem('redp_token');
        if (user) localStorage.setItem('redp_user', user);
        else localStorage.removeItem('redp_user');
      } catch {
        /* ignore */
      }
      sessionStorage.removeItem(BACKUP_KEY);
    }
    roleRef.current = null;
  };

  /** Public pages don't remount on a token swap — they listen for this instead. */
  const announceSession = () =>
    window.dispatchEvent(new CustomEvent('redp-session-changed'));

  const ensureRole = useCallback(async (role: Role) => {
    if (roleRef.current === role) return;

    if (role === 'visitor') {
      localStorage.removeItem('redp_token');
      localStorage.removeItem('redp_user');
      roleRef.current = 'visitor';
      announceSession();
      return;
    }

    try {
      // 'invited' signs in as the client the last act actually invited — the same
      // person whose EOI the room watched get approved. Anything else would be a
      // stand-in, and the story would quietly stop being true.
      const res =
        role === 'invited'
          ? await api.post('/demo/login-invited')
          : await api.post('/demo/login', { role });

      if (res.data?.token) {
        localStorage.setItem('redp_token', res.data.token);
        localStorage.setItem('redp_user', JSON.stringify(res.data.user));
        roleRef.current = role;
        announceSession();
      }
    } catch {
      // Demo Mode off, or nobody has been invited yet — the presenter stays signed
      // in as whoever they were. Better a wrong-role page than a dead overlay.
    }
  }, []);

  /** Ask the AI assistant, from here. No typing Arabic in front of a room. */
  const ask = useCallback((text: string) => {
    window.dispatchEvent(
      new CustomEvent('redp-ai-ask', { detail: { text, lang: 'ar' } })
    );
    setAsked(a => (a.includes(text) ? a : [...a, text]));
  }, []);

  /** Make the app do the step — the page under us fills the data and commits it. */
  const run = useCallback((stage: Stage) => {
    window.dispatchEvent(
      new CustomEvent('redp-demo-action', {
        detail: { action: stage.action, value: stage.value },
      })
    );
    setRan(r => (r.includes(stage.action) ? r : [...r, stage.action]));
  }, []);

  // ── the pacing clock ──
  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => setSeconds(s => s + 1), 1000);
    return () => clearInterval(id);
  }, [active]);

  const start = useCallback(() => {
    backupSession();
    setStep(0);
    setSeconds(0);
    setPanelHidden(false);
    setRan([]);
    setAsked([]);
    setShowEmail(false);
    setActive(true);
  }, []);

  const end = useCallback(() => {
    setActive(false);
    restoreSession();
    navigate('/');
  }, [navigate]);

  const goTo = useCallback(
    async (next: number) => {
      const clamped = Math.max(0, Math.min(LAST, next));
      setStep(clamped);
      setShowEmail(false);

      const target = clamped >= 1 && clamped <= ACTS.length ? ACTS[clamped - 1] : null;
      if (!target) return;

      await ensureRole(target.role);
      navigate(target.route);
    },
    [ensureRole, navigate]
  );

  // ── triggers + keyboard ──
  useEffect(() => {
    const onStart = () => start();
    window.addEventListener('redp-presenter-start', onStart as EventListener);
    return () => window.removeEventListener('redp-presenter-start', onStart as EventListener);
  }, [start]);

  useEffect(() => {
    if (!active) return;

    const onKey = (e: KeyboardEvent) => {
      const el = document.activeElement;
      const typing =
        el instanceof HTMLInputElement ||
        el instanceof HTMLTextAreaElement ||
        (el as HTMLElement)?.isContentEditable;
      if (typing) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        end();
      } else if (e.key === 'PageDown' || e.key === ' ') {
        e.preventDefault();
        goTo(step + 1);
      } else if (e.key === 'PageUp') {
        e.preventDefault();
        goTo(step - 1);
      } else if (e.key === 'h' || e.key === 'H') {
        e.preventDefault();
        setPanelHidden(v => !v);
      }
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [active, step, goTo, end]);

  if (!active) return null;

  const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
  const ss = String(seconds % 60).padStart(2, '0');

  const onSchedule = act ? seconds / 60 <= act.to : true;

  /**
   * The panel parks on whichever corner the act isn't using.
   * Customer pages: Nour rings bottom-RIGHT → panel goes left.
   * Dashboard pages: the internal assistant sits bottom-LEFT → panel goes right.
   * Either way the presenter can reach the thing the act is about.
   */
  const dashboardAct = act?.role === 'admin' || act?.role === 'broker';
  const dock: React.CSSProperties = dashboardAct ? { right: 20 } : { left: 20 };

  // ═══════════════ full-screen slides ═══════════════
  if (step === 0 || step === LAST) {
    const closing = step === LAST;

    return (
      <div
        dir="rtl"
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 100000,
          background: 'radial-gradient(1200px 600px at 70% -10%, #17335E 0%, #0B1524 60%)',
          color: '#E7EDF4',
          overflowY: 'auto',
          fontFamily: '"Segoe UI", Tahoma, sans-serif',
        }}
      >
        <div style={{ maxWidth: 1080, margin: '0 auto', padding: '64px 40px 96px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              marginBottom: 40,
              flexWrap: 'wrap',
            }}
          >
            <span
              style={{
                fontSize: '0.72rem',
                letterSpacing: '0.18em',
                color: '#D9A855',
                fontWeight: 800,
              }}
            >
              REDP
            </span>
            <span style={{ flex: 1 }} />
            <span
              style={{
                fontFamily: 'Consolas, monospace',
                fontSize: '1.05rem',
                fontWeight: 700,
                color: '#8497AC',
              }}
            >
              {mm}:{ss}
            </span>
            <button onClick={end} style={ghostBtn}>
              <X size={16} /> إنهاء
            </button>
          </div>

          {closing ? (
            <>
              <h1 style={{ fontSize: 'clamp(2rem,5vw,3.2rem)', fontWeight: 800, lineHeight: 1.25 }}>
                السيستم بيمنع الغلط، مش بيبلّغ عنه بعد ما يحصل.
              </h1>
              <p
                style={{
                  fontSize: '1.15rem',
                  color: '#BCCBDB',
                  marginTop: 24,
                  maxWidth: '62ch',
                  lineHeight: 1.9,
                }}
              >
                من أول ما الزائر سأل المساعد الساعة ٢ بالليل، لحد ما القيد اتكتب لوحده في الدفاتر —
                محدش دخّل رقم بإيده، ومحدش رفع حد في الطابور بواسطة.
              </p>
              <div
                style={{
                  marginTop: 48,
                  padding: '28px 32px',
                  borderRadius: 16,
                  background: 'rgba(217,168,85,0.1)',
                  border: '1px solid rgba(217,168,85,0.35)',
                }}
              >
                <p style={{ fontSize: '0.78rem', color: '#D9A855', fontWeight: 800, marginBottom: 10 }}>
                  اقفل بالسؤال ده — مش بـ «إيه رأيك؟»
                </p>
                <p style={{ fontSize: '1.35rem', fontWeight: 700, lineHeight: 1.7 }}>
                  «لو الطرح الجاي بتاعك بعد شهرين — تحب نبدأ بأنهي مشروع؟»
                </p>
              </div>
            </>
          ) : (
            <>
              <p
                style={{
                  fontSize: '0.72rem',
                  letterSpacing: '0.22em',
                  fontWeight: 800,
                  color: '#7BA1E0',
                  marginBottom: 14,
                  direction: 'ltr',
                  textAlign: 'right',
                }}
              >
                {COVER.eyebrow}
              </p>
              <h1
                style={{
                  fontSize: 'clamp(3rem,9vw,6rem)',
                  fontWeight: 800,
                  lineHeight: 1.05,
                  letterSpacing: '0.04em',
                  marginBottom: 20,
                  color: '#D9A855',
                  direction: 'ltr',
                  textAlign: 'right',
                }}
              >
                {COVER.title}
              </h1>
              <p
                style={{
                  fontSize: '1.2rem',
                  color: '#BCCBDB',
                  maxWidth: '58ch',
                  lineHeight: 1.9,
                  marginBottom: 52,
                }}
              >
                {COVER.tagline}
              </p>

              <h4 style={{ ...sectionLabel, marginBottom: 16 }}>عرض الجلسة · ٣٠ دقيقة</h4>
              <div
                style={{
                  display: 'grid',
                  gap: 12,
                  gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                }}
              >
                {ACTS.map((a, i) => (
                  <button
                    key={a.numeral}
                    onClick={() => goTo(i + 1)}
                    title="ابدأ من الفصل ده"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 14,
                      textAlign: 'right',
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.09)',
                      borderRadius: 12,
                      padding: '16px 18px',
                      color: 'inherit',
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                    }}
                  >
                    <span
                      style={{
                        flex: 'none',
                        width: 34,
                        fontFamily: 'Georgia, serif',
                        fontStyle: 'italic',
                        fontWeight: 700,
                        fontSize: '1.25rem',
                        color: '#D9A855',
                      }}
                    >
                      {a.numeral}
                    </span>
                    <span style={{ flex: 1, fontSize: '0.95rem', fontWeight: 700, lineHeight: 1.6 }}>
                      {a.title}
                    </span>
                    <span
                      style={{
                        flex: 'none',
                        fontFamily: 'Consolas, monospace',
                        fontSize: '0.74rem',
                        color: '#5C6E85',
                      }}
                    >
                      {a.from}–{a.to}′
                    </span>
                  </button>
                ))}
              </div>
            </>
          )}

          <div style={{ display: 'flex', gap: 12, marginTop: 48, flexWrap: 'wrap' }}>
            {step > 0 && (
              <button onClick={() => goTo(step - 1)} style={ghostBtn}>
                <ChevronRight size={16} /> رجوع
              </button>
            )}
            {!closing && (
              <button onClick={() => goTo(step + 1)} style={primaryBtn}>
                يلا نبدأ <ChevronLeft size={16} />
              </button>
            )}
          </div>

          <p style={{ marginTop: 28, fontSize: '0.76rem', color: '#5C6E85' }}>
            مسافة أو PageDown = التالي · PageUp = رجوع · H = إخفاء لوحة الكلام · Esc = إنهاء
          </p>
        </div>
      </div>
    );
  }

  // ═══════════════ the email the client actually receives ═══════════════
  // A preview, not a mailbox — the real one is sent by the backend the moment the
  // act happens. Shown so the room sees what lands, without leaving the app.
  const mail = act?.email;
  const emailOverlay =
    showEmail && mail ? (
      <div
        dir="rtl"
        onClick={() => setShowEmail(false)}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 100001,
          background: 'rgba(6,12,20,0.72)',
          backdropFilter: 'blur(3px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
          fontFamily: '"Segoe UI", Tahoma, sans-serif',
        }}
      >
        <div
          onClick={e => e.stopPropagation()}
          style={{
            width: 'min(620px, 100%)',
            maxHeight: '86vh',
            overflowY: 'auto',
            background: '#FFFFFF',
            color: '#0F172A',
            borderRadius: 18,
            boxShadow: '0 40px 90px -30px rgba(0,0,0,0.8)',
            overflowX: 'hidden',
          }}
        >
          <div style={{ background: '#003DA6', padding: '20px 26px', color: '#fff' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Mail size={17} />
              <span style={{ fontSize: '0.72rem', letterSpacing: '0.14em', fontWeight: 800, opacity: 0.85 }}>
                معاينة الإيميل المُرسَل
              </span>
              <span style={{ flex: 1 }} />
              <button onClick={() => setShowEmail(false)} style={{ ...iconBtn, color: '#fff', borderColor: 'rgba(255,255,255,0.35)' }}>
                <X size={15} />
              </button>
            </div>
            <p style={{ marginTop: 14, fontSize: '1.05rem', fontWeight: 800, lineHeight: 1.5, direction: 'ltr', textAlign: 'left' }}>
              {mail.subject}
            </p>
            <p style={{ marginTop: 6, fontSize: '0.82rem', opacity: 0.85 }}>إلى: {mail.to}</p>
          </div>

          <div style={{ padding: '26px 28px 30px' }}>
            {mail.lines.map(line => (
              <p key={line} style={{ fontSize: '0.98rem', lineHeight: 1.95, color: '#334155', marginBottom: 10 }}>
                {line}
              </p>
            ))}

            {mail.rows && (
              <div
                style={{
                  marginTop: 18,
                  border: '1px solid #E2E8F0',
                  borderRadius: 12,
                  overflow: 'hidden',
                }}
              >
                {mail.rows.map(([label, value], i) => (
                  <div
                    key={label}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      gap: 12,
                      padding: '11px 16px',
                      background: i % 2 ? '#F8FAFC' : '#fff',
                      fontSize: '0.88rem',
                    }}
                  >
                    <span style={{ color: '#64748B', fontWeight: 600 }}>{label}</span>
                    <span style={{ color: '#0F172A', fontWeight: 800, direction: 'ltr' }}>{value}</span>
                  </div>
                ))}
              </div>
            )}

            {mail.credentials && (
              <div
                style={{
                  marginTop: 18,
                  padding: '16px 18px',
                  borderRadius: 12,
                  background: '#FEF6E7',
                  border: '1px solid #F0D9A8',
                }}
              >
                <p
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 7,
                    fontSize: '0.74rem',
                    fontWeight: 800,
                    color: '#9A6B12',
                    letterSpacing: '0.06em',
                    marginBottom: 12,
                  }}
                >
                  <KeyRound size={13} /> بيانات الدخول المؤقتة
                </p>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: 7 }}>
                  <span style={{ color: '#64748B' }}>اسم المستخدم</span>
                  <span style={{ fontFamily: 'Consolas, monospace', fontWeight: 700 }}>{mail.credentials.email}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                  <span style={{ color: '#64748B' }}>الباسورد</span>
                  <span style={{ fontFamily: 'Consolas, monospace', fontWeight: 700 }}>{mail.credentials.password}</span>
                </div>
              </div>
            )}

            <div
              style={{
                marginTop: 24,
                display: 'inline-block',
                padding: '13px 30px',
                borderRadius: 999,
                background: '#003DA6',
                color: '#fff',
                fontWeight: 800,
                fontSize: '0.92rem',
              }}
            >
              {mail.cta}
            </div>
          </div>
        </div>
      </div>
    ) : null;

  // ═══════════════ collapsed pill ═══════════════
  if (panelHidden) {
    return (
      <>
        {emailOverlay}
        <button
          onClick={() => setPanelHidden(false)}
          dir="rtl"
          style={{
            position: 'fixed',
            bottom: 96,
            ...dock,
            zIndex: 100000,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '10px 16px',
            borderRadius: 999,
            border: '1px solid rgba(217,168,85,0.4)',
            background: '#0B1524',
            color: '#D9A855',
            fontWeight: 800,
            fontSize: '0.82rem',
            cursor: 'pointer',
            fontFamily: '"Segoe UI", Tahoma, sans-serif',
            boxShadow: '0 12px 30px -10px rgba(0,0,0,0.6)',
          }}
        >
          <Eye size={15} />
          {act?.numeral} · {mm}:{ss}
        </button>
      </>
    );
  }

  // ═══════════════ the script panel ═══════════════
  return (
    <>
    {emailOverlay}
    <aside
      dir="rtl"
      style={{
        // Docks to the corner this act isn't using, and stops short of the bottom —
        // several acts need the presenter to actually reach an assistant down there.
        position: 'fixed',
        bottom: 96,
        ...dock,
        zIndex: 100000,
        width: 'min(420px, calc(100vw - 40px))',
        maxHeight: 'calc(100vh - 116px)',
        display: 'flex',
        flexDirection: 'column',
        background: '#0B1524',
        color: '#E7EDF4',
        border: '1px solid #26374C',
        borderRadius: 16,
        boxShadow: '0 24px 60px -20px rgba(0,0,0,0.75)',
        fontFamily: '"Segoe UI", Tahoma, sans-serif',
        overflow: 'hidden',
      }}
    >
      {/* header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '14px 16px',
          background: '#111C2A',
          borderBottom: '1px solid #26374C',
        }}
      >
        <span
          style={{
            fontFamily: 'Georgia, serif',
            fontStyle: 'italic',
            fontWeight: 700,
            fontSize: '1.3rem',
            color: '#D9A855',
          }}
        >
          {act!.numeral}
        </span>
        <span style={{ fontWeight: 800, fontSize: '0.95rem', flex: 1 }}>{act!.title}</span>
        <span
          style={{
            fontFamily: 'Consolas, monospace',
            fontSize: '0.82rem',
            fontWeight: 700,
            padding: '3px 9px',
            borderRadius: 999,
            background: onSchedule ? 'rgba(82,188,144,0.15)' : 'rgba(226,112,122,0.18)',
            color: onSchedule ? '#52BC90' : '#E2707A',
          }}
          title={`المفروض تخلص عند الدقيقة ${act!.to}`}
        >
          {mm}:{ss}
        </span>
        <button onClick={() => setPanelHidden(true)} style={iconBtn} title="إخفاء (H)">
          <EyeOff size={15} />
        </button>
        <button onClick={end} style={iconBtn} title="إنهاء (Esc)">
          <X size={15} />
        </button>
      </div>

      {/* body */}
      <div style={{ overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* the lines */}
        <div>
          <h4 style={sectionLabel}>
            <Quote size={11} /> قول كده
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {act!.say.map(line => (
              <p
                key={line}
                style={{
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  lineHeight: 1.85,
                  padding: '12px 14px',
                  borderRight: '3px solid #D9A855',
                  borderRadius: '0 10px 10px 0',
                  background: 'rgba(217,168,85,0.09)',
                }}
              >
                {line}
              </p>
            ))}
          </div>
        </div>

        {/* one-click stages — the app fills its own data */}
        {act!.stages && act!.stages.length > 0 && (
          <div>
            <h4 style={sectionLabel}>
              <Zap size={11} /> اضغط — والبيانات بتتملي لوحدها
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {act!.stages.map(stage => {
                const done = ran.includes(stage.action);
                return (
                  <button
                    key={stage.action + stage.label}
                    onClick={() => run(stage)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      textAlign: 'right',
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      lineHeight: 1.7,
                      padding: '10px 12px',
                      borderRadius: 10,
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      border: stage.primary ? '1px solid #D9A855' : '1px solid #2E4055',
                      background: stage.primary ? 'rgba(217,168,85,0.14)' : '#172435',
                      color: stage.primary ? '#D9A855' : '#BCCBDB',
                      opacity: done ? 0.55 : 1,
                    }}
                  >
                    {done ? (
                      <Check size={13} style={{ flex: 'none', color: '#52BC90' }} />
                    ) : (
                      <Play size={13} style={{ flex: 'none', opacity: 0.7 }} />
                    )}
                    {stage.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* questions for the AI — click and it asks, out loud, for real */}
        {act!.aiPrompts && act!.aiPrompts.length > 0 && (
          <div>
            <h4 style={sectionLabel}>
              <Sparkles size={11} /> اضغط — بيتبعت للمساعد لوحده
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {act!.aiPrompts.map(prompt => {
                const done = asked.includes(prompt);
                return (
                  <div key={prompt} style={{ display: 'flex', gap: 5 }}>
                    <button
                      onClick={() => ask(prompt)}
                      style={{
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        textAlign: 'right',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        lineHeight: 1.7,
                        padding: '10px 12px',
                        borderRadius: 10,
                        cursor: 'pointer',
                        border: '1px solid rgba(123,161,224,0.3)',
                        background: 'rgba(123,161,224,0.08)',
                        color: '#BCCBDB',
                        fontFamily: 'inherit',
                        opacity: done ? 0.55 : 1,
                      }}
                    >
                      {done ? (
                        <Check size={13} style={{ flex: 'none', color: '#52BC90' }} />
                      ) : (
                        <Send size={13} style={{ flex: 'none', opacity: 0.65 }} />
                      )}
                      {prompt}
                    </button>
                    {/* fallback: if the assistant is being stubborn, paste it by hand */}
                    <button
                      onClick={() => copy(prompt)}
                      title="نسخ"
                      style={{ ...iconBtn, flex: 'none', alignSelf: 'stretch', height: 'auto' }}
                    >
                      {copied === prompt ? (
                        <Check size={13} style={{ color: '#52BC90' }} />
                      ) : (
                        <Copy size={13} />
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* the email this act causes */}
        {act!.email && (
          <button
            onClick={() => setShowEmail(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              justifyContent: 'center',
              fontSize: '0.85rem',
              fontWeight: 800,
              padding: '11px 12px',
              borderRadius: 10,
              cursor: 'pointer',
              border: '1px solid #2E4055',
              background: '#172435',
              color: '#7BA1E0',
              fontFamily: 'inherit',
            }}
          >
            <Mail size={14} /> ورّي الإيميل اللي وصله
          </button>
        )}

        {/* what to click */}
        <div>
          <h4 style={sectionLabel}>المشهد</h4>
          <ol style={{ display: 'flex', flexDirection: 'column', gap: 7, listStyle: 'none' }}>
            {act!.scene.map((s, i) => (
              <li
                key={s}
                style={{
                  display: 'flex',
                  gap: 9,
                  fontSize: '0.86rem',
                  color: '#BCCBDB',
                  lineHeight: 1.7,
                }}
              >
                <span
                  style={{
                    flex: 'none',
                    fontFamily: 'Consolas, monospace',
                    fontSize: '0.72rem',
                    color: '#5C6E85',
                    marginTop: 3,
                  }}
                >
                  {i + 1}.
                </span>
                {s}
              </li>
            ))}
          </ol>
        </div>

        {/* jump links */}
        {act!.alsoVisit && act!.alsoVisit.length > 0 && (
          <div>
            <h4 style={sectionLabel}>صفحات الفصل</h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {act!.alsoVisit.map(v => (
                <button
                  key={v.route}
                  onClick={() => navigate(v.route)}
                  style={{
                    fontSize: '0.76rem',
                    fontWeight: 700,
                    padding: '5px 11px',
                    borderRadius: 8,
                    border: '1px solid #26374C',
                    background: '#172435',
                    color: '#7BA1E0',
                    cursor: 'pointer',
                  }}
                >
                  {v.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {act!.caution && (
          <p
            style={{
              display: 'flex',
              gap: 9,
              fontSize: '0.82rem',
              fontWeight: 600,
              color: '#D4A63C',
              background: 'rgba(212,166,60,0.1)',
              border: '1px solid rgba(212,166,60,0.25)',
              borderRadius: 10,
              padding: '11px 13px',
              lineHeight: 1.7,
            }}
          >
            <AlertTriangle size={14} style={{ flex: 'none', marginTop: 3 }} />
            {act!.caution}
          </p>
        )}
      </div>

      {/* footer */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '12px 16px',
          borderTop: '1px solid #26374C',
          background: '#111C2A',
        }}
      >
        <button onClick={() => goTo(step - 1)} style={ghostBtn}>
          <ChevronRight size={15} /> رجوع
        </button>
        <span
          style={{
            flex: 1,
            textAlign: 'center',
            fontSize: '0.74rem',
            color: '#5C6E85',
            fontFamily: 'Consolas, monospace',
          }}
        >
          {step} / {ACTS.length}
        </span>
        <button onClick={() => goTo(step + 1)} style={primaryBtn}>
          {step === ACTS.length ? 'الإقفال' : 'التالي'} <ChevronLeft size={15} />
        </button>
      </div>
    </aside>
    </>
  );
};

const sectionLabel: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 5,
  fontSize: '0.68rem',
  fontWeight: 800,
  letterSpacing: '0.1em',
  color: '#5C6E85',
  marginBottom: 9,
};

const iconBtn: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 28,
  height: 28,
  borderRadius: 8,
  border: '1px solid #26374C',
  background: 'transparent',
  color: '#8497AC',
  cursor: 'pointer',
};

const ghostBtn: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  padding: '8px 14px',
  borderRadius: 999,
  border: '1px solid #26374C',
  background: 'transparent',
  color: '#BCCBDB',
  fontWeight: 700,
  fontSize: '0.82rem',
  cursor: 'pointer',
  fontFamily: 'inherit',
};

const primaryBtn: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  padding: '8px 16px',
  borderRadius: 999,
  border: '1px solid #D9A855',
  background: '#D9A855',
  color: '#1A1508',
  fontWeight: 800,
  fontSize: '0.82rem',
  cursor: 'pointer',
  fontFamily: 'inherit',
};

export default PresenterMode;
