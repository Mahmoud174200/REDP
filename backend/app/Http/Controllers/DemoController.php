<?php

namespace App\Http\Controllers;

use App\Models\Broker;
use App\Models\EoiReservation;
use App\Models\Lead;
use App\Models\Project;
use App\Models\SystemConfig;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * ─────────────────────────────────────────────────────────
 * REDP — Demo Mode
 *
 * A LIVE auto-walkthrough of the whole flow. The step script lives here
 * (data-driven, bilingual EN/AR) and the frontend driver plays it:
 *   - mode:   'scroll' → scroll a landing anchor   'navigate' → open a route
 *   - auth_role: demo role to auto-login as for that step
 *   - actions:   live UI actions (open modal, fill form, select options…)
 *   - email:     render a styled email preview overlay
 * ─────────────────────────────────────────────────────────
 */
class DemoController extends Controller
{
    public function status(): JsonResponse
    {
        return response()->json(['success' => true, 'data' => ['demo_mode' => $this->enabled()]]);
    }

    public function tour(): JsonResponse
    {
        return response()->json(['success' => true, 'enabled' => $this->enabled(), 'data' => ['steps' => $this->steps()]]);
    }

    /**
     * POST /v1/demo/login — issue a token for a demo role so the live
     * walkthrough can switch dashboards automatically. Hard-gated: only
     * while Demo Mode is ON, and only ever touches demo.*@redp.test accounts.
     */
    public function login(Request $request): JsonResponse
    {
        if (!$this->enabled()) {
            return response()->json(['success' => false, 'message' => 'Demo mode is off.'], 403);
        }

        $role = (string) $request->input('role');
        $allowed = ['broker', 'finance_officer', 'admin', 'client'];
        if (!in_array($role, $allowed, true)) {
            return response()->json(['success' => false, 'message' => 'Unsupported demo role.'], 422);
        }

        $email = "demo.{$role}@redp.test";
        $user = User::firstOrNew(['email' => $email]);
        if (!$user->exists) {
            $user->id = (string) Str::uuid();
            $user->name = 'Demo ' . ucwords(str_replace('_', ' ', $role));
            $user->password = Hash::make(Str::random(24));
        }
        $user->role = $role;
        $user->status = 'active';
        $user->save();

        $payload = $user->only(['id', 'name', 'email', 'role', 'status']);

        if ($role === 'broker') {
            $broker = Broker::firstOrCreate(
                ['user_id' => $user->id],
                [
                    'agency_name'   => 'Demo Realty',
                    'agent_name'    => $user->name,
                    'phone'         => '01000000000',
                    'status'        => Broker::STATUS_ACTIVE,
                    'referral_code' => 'DEMO' . strtoupper(Str::random(4)),
                ]
            );
            // ensure a friendly slug for the short link
            if (!$broker->slug) {
                $broker->slug = 'demo-realty';
                $broker->save();
            }
            $payload['broker'] = $broker->only(['id', 'agency_name', 'referral_code', 'slug', 'qr_token', 'promo_code']);
        }

        $user->tokens()->delete();
        $token = $user->createToken('demo-tour')->plainTextToken;

        return response()->json([
            'success' => true,
            'token'   => $token,
            'user'    => $payload,
        ]);
    }

    /**
     * POST /v1/demo/seed-eoi — create a REAL pending EOI for the demo customer
     * so the Finance review step actually has something to approve. The receipt
     * can't be uploaded programmatically, so we seed it with a placeholder.
     * Gated by Demo Mode; idempotent per (demo lead, project).
     */
    public function seedEoi(): JsonResponse
    {
        if (!$this->enabled()) {
            return response()->json(['success' => false, 'message' => 'Demo mode is off.'], 403);
        }

        // Prefer a real project; otherwise fall back to a STABLE demo id so the
        // seed stays idempotent even on environments with no projects.
        $project = Project::query()->first();
        $projectId = $project?->id ?? '00000000-0000-4000-8000-00000000de01';

        $lead = Lead::firstOrCreate(
            ['phone' => '01001234567'],
            [
                'id' => (string) Str::uuid(),
                'first_name' => 'Ahmed', 'last_name' => 'Mostafa',
                'email' => 'ahmed.demo@example.com', 'national_id' => '29008011234567',
                'status' => Lead::STATUS_NEW, 'source' => 'direct',
            ]
        );

        $existing = EoiReservation::where('lead_id', $lead->id)
            ->where('project_id', $projectId)
            ->whereIn('status', [EoiReservation::STATUS_PENDING_REVIEW, EoiReservation::STATUS_APPROVED])
            ->first();
        if ($existing) {
            return response()->json(['success' => true, 'reused' => true, 'queue_number' => $existing->queue_number, 'data' => $existing]);
        }

        $eoi = EoiReservation::create([
            'id' => (string) Str::uuid(),
            'lead_id' => $lead->id,
            'project_id' => $projectId,
            'client_name' => 'Ahmed Mostafa',
            'client_email' => 'ahmed.demo@example.com',
            'client_phone' => '01001234567',
            'client_location' => EoiReservation::LOCATION_INSIDE_EGYPT,
            'payment_method' => EoiReservation::PAYMENT_INSTAPAY,
            'payment_amount' => 50000,
            'receipt_path' => 'eoi-receipts/demo-receipt.png',
            'status' => EoiReservation::STATUS_PENDING_REVIEW,
            'education' => "Bachelor's Degree",
            'job_title' => 'Marketing Manager',
            'monthly_income' => 85000,
            'income_currency' => 'EGP',
            'marital_status' => 'married',
            'number_of_children' => 2,
            'current_residence' => 'New Cairo',
            'residence_type' => 'owned',
            'cars_owned' => 2,
        ]);

        return response()->json(['success' => true, 'queue_number' => $eoi->queue_number, 'data' => $eoi]);
    }

    private function enabled(): bool
    {
        $v = SystemConfig::where('key', 'demo_mode')->value('value');
        return $v === 'true' || $v === '1';
    }

    private function steps(): array
    {
        return [
            // 1 — Broker referral link / QR
            [
                'id' => 1, 'actor' => 'broker', 'icon' => 'UserCheck',
                'title' => 'Broker gets their referral link & QR',
                'title_ar' => 'البروكر يجيب لينك الإحالة والـ QR',
                'narration' => 'The broker logs into their dashboard and copies their unique referral link or QR code to share with clients.',
                'narration_ar' => 'البروكر بيدخل على الداشبورد بتاعته وبياخد لينك الإحالة أو الـ QR code الخاص بيه عشان يبعته للعملاء.',
                'mode' => 'navigate', 'route' => '/sales/broker/dashboard', 'auth_role' => 'broker',
                'duration_ms' => 9000,
            ],

            // 2 — Customer browses projects (public landing)
            [
                'id' => 2, 'actor' => 'customer', 'icon' => 'Globe',
                'title' => 'Customer opens the link & browses projects',
                'title_ar' => 'العميل يفتح اللينك ويتصفح المشاريع',
                'narration' => 'The customer opens the broker link (or QR) and lands here. Attribution is captured automatically — if they came via a broker link/QR, that broker is credited silently.',
                'narration_ar' => 'العميل بيفتح لينك البروكر (أو الـ QR) ويوصل هنا. النظام بيسجّل مصدر العميل تلقائيًا — لو جه من لينك/كود بروكر، البروكر بيتكتب لوحده من غير أي خطوة.',
                'mode' => 'scroll', 'anchor' => 'projects',
                'duration_ms' => 8000,
            ],

            // 3 — Open the booking modal (LIVE)
            [
                'id' => 3, 'actor' => 'customer', 'icon' => 'Ticket',
                'title' => 'Customer opens the EOI booking modal',
                'title_ar' => 'العميل يفتح مودل حجز الـ EOI',
                'narration' => 'The customer clicks "Book & Pay EOI" and the priority booking portal opens.',
                'narration_ar' => 'العميل بيضغط "احجز وادفع الـ EOI" فيفتح بوابة الحجز ذات الأولوية.',
                'mode' => 'scroll', 'anchor' => 'projects',
                'actions' => [['type' => 'emit', 'event' => 'open-eoi', 'delay' => 800]],
                'duration_ms' => 5500,
            ],

            // 4 — Fill contact info (LIVE)
            [
                'id' => 4, 'actor' => 'customer', 'icon' => 'FileText',
                'title' => 'Fill contact information',
                'title_ar' => 'إدخال بيانات التواصل',
                'narration' => 'The customer enters their basic contact details — name, email, phone and national ID.',
                'narration_ar' => 'العميل بيدخل بياناته الأساسية — الاسم، الإيميل، التليفون والرقم القومي.',
                'mode' => 'scroll', 'anchor' => 'projects',
                'actions' => [['type' => 'emit', 'event' => 'fill-contact', 'delay' => 800]],
                'duration_ms' => 5500,
            ],

            // 5 — Move to the standard-of-living step
            [
                'id' => 5, 'actor' => 'customer', 'icon' => 'FileText',
                'title' => 'Next: standard-of-living profile',
                'title_ar' => 'التالي: بيانات المستوى المعيشي',
                'narration' => 'They move to the next section to complete their standard-of-living profile.',
                'narration_ar' => 'بينتقل للقسم اللي بعده عشان يكمّل بيانات المستوى المعيشي.',
                'mode' => 'scroll', 'anchor' => 'projects',
                'actions' => [['type' => 'emit', 'event' => 'eoi-step', 'value' => 2, 'delay' => 800]],
                'duration_ms' => 5000,
            ],

            // 6 — Fill the profile data (LIVE)
            [
                'id' => 6, 'actor' => 'customer', 'icon' => 'FileText',
                'title' => 'Fill standard-of-living data',
                'title_ar' => 'تعبئة بيانات المستوى المعيشي',
                'narration' => 'Education, job, income, marital status, residence and more — this data later feeds the AI priority score.',
                'narration_ar' => 'التعليم، الوظيفة، الدخل، الحالة الاجتماعية، السكن وغيرها — البيانات دي بتغذّي الـ AI priority score بعد كده.',
                'mode' => 'scroll', 'anchor' => 'projects',
                'actions' => [['type' => 'emit', 'event' => 'fill-profile', 'delay' => 800]],
                'duration_ms' => 6000,
            ],

            // 7 — Move to payment step
            [
                'id' => 7, 'actor' => 'customer', 'icon' => 'Ticket',
                'title' => 'Next: payment & receipt',
                'title_ar' => 'التالي: الدفع والإيصال',
                'narration' => 'They continue to the payment section to choose location and payment method.',
                'narration_ar' => 'بيكمّل لقسم الدفع عشان يختار البلد وطريقة الدفع.',
                'mode' => 'scroll', 'anchor' => 'projects',
                'actions' => [['type' => 'emit', 'event' => 'eoi-step', 'value' => 3, 'delay' => 800]],
                'duration_ms' => 5000,
            ],

            // 8 — Select location
            [
                'id' => 8, 'actor' => 'customer', 'icon' => 'Globe',
                'title' => 'Select client location',
                'title_ar' => 'اختيار موقع العميل',
                'narration' => 'The customer selects whether they are inside or outside Egypt — this controls the allowed payment methods.',
                'narration_ar' => 'العميل بيحدد إذا كان داخل مصر أو خارجها — وده بيتحكم في طرق الدفع المتاحة.',
                'mode' => 'scroll', 'anchor' => 'projects',
                'actions' => [['type' => 'emit', 'event' => 'set-location', 'value' => 'inside_egypt', 'delay' => 800]],
                'duration_ms' => 5500,
            ],

            // 9 — Select payment method (broker auto-filled, or pick source)
            [
                'id' => 9, 'actor' => 'customer', 'icon' => 'Ticket',
                'title' => 'Pick payment — broker auto-filled, or pick source',
                'title_ar' => 'اختيار الدفع — البروكر بيتكتب لوحده أو يحدد المصدر',
                'narration' => 'They pick a payment method and upload the receipt. If they came via a broker link/QR the broker is already attached; otherwise they enter a sales/promo code or pick the ad platform (Facebook, Google, Instagram, TikTok…). Then they submit — the EOI goes to Finance.',
                'narration_ar' => 'بيختار طريقة الدفع ويرفع الإيصال. لو جه من لينك/كود بروكر يبقى البروكر متسجّل تلقائيًا، وإلا بيكتب كود سيلز/برومو أو يحدد إعلان أنهي منصّة جابه (فيسبوك، جوجل، انستجرام، تيك توك…). وبعدها بيبعت — والـ EOI بيروح للفايننس.',
                'mode' => 'scroll', 'anchor' => 'projects',
                'actions' => [['type' => 'emit', 'event' => 'set-payment', 'value' => 'instapay', 'delay' => 800]],
                'duration_ms' => 7000,
            ],

            // 10 — Submit the EOI (creates a REAL pending record)
            [
                'id' => 10, 'actor' => 'customer', 'icon' => 'CheckCircle',
                'title' => 'Customer submits the EOI',
                'title_ar' => 'العميل يبعت الـ EOI',
                'narration' => 'The customer uploads the receipt and submits — a real pending EOI is created and joins the review queue, ready for Finance.',
                'narration_ar' => 'العميل بيرفع الإيصال ويبعت — وبيتعمل EOI فعلي بحالة "قيد المراجعة" ويدخل طابور المراجعة جاهز للفايننس.',
                'mode' => 'scroll', 'anchor' => 'projects',
                'actions' => [['type' => 'emit', 'event' => 'submit-eoi', 'delay' => 1600]],
                'duration_ms' => 8000,
            ],

            // 11 — Finance reviews & approves (opens the REAL EOI review page)
            [
                'id' => 11, 'actor' => 'finance', 'icon' => 'CheckCircle',
                'title' => 'Finance reviews & approves the EOI',
                'title_ar' => 'الفايننس يراجع ويقبل الـ EOI',
                'narration' => 'Finance opens the EOI review queue from their dashboard, verifies the payment receipt and approves it — an order number and queue position are issued.',
                'narration_ar' => 'الفايننس بيفتح طابور مراجعة الـ EOI من الداشبورد بتاعته، يتأكد من إيصال الدفع ويقبله — وبيتولّد رقم أوردر ومكان في الطابور.',
                'mode' => 'navigate', 'route' => '/acquisition/eoi-reservations', 'auth_role' => 'finance_officer',
                'duration_ms' => 11000,
            ],

            // 6 — Approval email (styled email preview)
            [
                'id' => 12, 'actor' => 'system', 'icon' => 'Mail',
                'title' => 'Approval email sent to the customer',
                'title_ar' => 'إيميل القبول بيوصل للعميل',
                'narration' => 'The system automatically emails the customer confirming their EOI was accepted — here is exactly what they receive.',
                'narration_ar' => 'النظام بيبعت إيميل تلقائي للعميل بيأكّد قبول الـ EOI — وده شكل الإيميل اللي بيوصله بالظبط.',
                'mode' => 'navigate',
                'email' => [
                    'brand' => 'Mountain View',
                    'to' => 'Ahmed Mostafa <ahmed.demo@example.com>',
                    'subject' => '🎉 Your EOI is approved — Order #EOI-2026-000142',
                    'subject_ar' => '🎉 تم قبول جدية حجزك — أوردر رقم EOI-2026-000142',
                    'lines' => [
                        'Dear Ahmed,',
                        'Great news — your Expression of Interest for Creekview has been approved.',
                        'Your priority queue position has been secured based on your payment timestamp.',
                        'You will receive a unit-selection invitation once allocation opens for your tier.',
                    ],
                    'lines_ar' => [
                        'عزيزي أحمد،',
                        'خبر سعيد — تم قبول جدية الحجز (EOI) الخاصة بك في كريك فيو.',
                        'تم تأمين ترتيبك في طابور الأولوية بناءً على توقيت الدفع.',
                        'هتستلم دعوة لاختيار وحدتك بمجرد فتح التخصيص لفئتك.',
                    ],
                    'button' => 'View my EOI status',
                    'button_ar' => 'تابع حالة طلبي',
                ],
                'duration_ms' => 11000,
            ],

            // 7 — Head of Sales ranks priorities (opens the queue/priority page)
            [
                'id' => 13, 'actor' => 'admin', 'icon' => 'ListOrdered',
                'title' => 'Head of Sales ranks customers by priority',
                'title_ar' => 'مدير المبيعات يرتّب العملاء بالأولوية',
                'narration' => 'The Head of Sales opens the Booking Priority board: full applicant data, a giant filter, and an AI priority score they can trust or override — deciding who books first by their own standards.',
                'narration_ar' => 'مدير المبيعات بيفتح لوحة أولويات الحجز: بيانات كل عميل كاملة، فلترة عملاقة، و score أولوية بالـ AI يقدر يثق فيه أو يعدّله — ويقرر مين يحجز الأول حسب معاييره.',
                'mode' => 'navigate', 'route' => '/sales/priorities', 'auth_role' => 'admin',
                'duration_ms' => 11000,
            ],

            // 8 — Selection invite email (styled email preview w/ credentials)
            [
                'id' => 14, 'actor' => 'system', 'icon' => 'KeyRound',
                'title' => 'Prioritized customer gets a unit-selection invite',
                'title_ar' => 'العميل صاحب الأولوية بيوصله دعوة لاختيار الوحدة',
                'narration' => 'After ranking, the chosen customer receives an email with login credentials and a link to pick their unit — here is the invite.',
                'narration_ar' => 'بعد الترتيب، العميل المختار بيوصله إيميل فيه بيانات الدخول ولينك لاختيار الوحدة — وده شكل الدعوة.',
                'mode' => 'navigate',
                'email' => [
                    'brand' => 'Mountain View',
                    'to' => 'Ahmed Mostafa <ahmed.demo@example.com>',
                    'subject' => "It's your turn — choose your unit now",
                    'subject_ar' => 'جه دورك — اختار وحدتك دلوقتي',
                    'lines' => [
                        'Dear Ahmed,',
                        'You have been prioritized for unit selection at Creekview.',
                        'Use the credentials below to log in and pick your unit before your window closes.',
                    ],
                    'lines_ar' => [
                        'عزيزي أحمد،',
                        'تم ترشيحك بالأولوية لاختيار وحدتك في كريك فيو.',
                        'استخدم بيانات الدخول التالية لتسجيل الدخول واختيار وحدتك قبل انتهاء مدتك.',
                    ],
                    'credentials' => ['username' => 'ahmed.demo@example.com', 'password' => 'Mv@2026xy'],
                    'button' => 'Choose my unit',
                    'button_ar' => 'اختر وحدتي',
                ],
                'duration_ms' => 11000,
            ],

            // 9 — Customer logs in, selects unit, books contracting meeting
            [
                'id' => 15, 'actor' => 'customer', 'icon' => 'CalendarCheck',
                'title' => 'Customer picks a unit & books a contracting meeting',
                'title_ar' => 'العميل يختار وحدته ويتحدّد معاده للتعاقد',
                'narration' => 'The customer logs in, selects their unit, and a meeting is scheduled with the developer to complete contracting — they are shown WHO they will meet (name, phone, title) and the appointment time.',
                'narration_ar' => 'العميل بيدخل، يختار وحدته، ويتحدّد معاد مع الشركة لإتمام التعاقد — وبيظهرله هو هيقابل مين (الاسم، التليفون، المسمّى الوظيفي) ومعاد المقابلة.',
                'mode' => 'navigate', 'route' => '/unit-selection', 'auth_role' => 'client',
                'duration_ms' => 11000,
            ],
        ];
    }
}
