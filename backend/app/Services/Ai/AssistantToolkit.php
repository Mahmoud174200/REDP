<?php

namespace App\Services\Ai;

use App\Models\User;
use App\Models\Lead;
use App\Models\Unit;
use App\Models\Project;
use App\Models\Contract;
use App\Models\Payment;
use App\Models\Reservation;
use App\Models\Interaction;
use App\Models\MaintenanceTicket;
use App\Models\ProjectAmenity;
use App\Models\EoiReservation;
use App\Models\SystemConfig;
use App\Models\Appointment;
use App\Models\Task;
use App\Models\Document;
use App\Http\Controllers\Acquisition\EoiReservationController;
use App\Http\Controllers\Acquisition\AppointmentController;
use App\Http\Controllers\Enterprise\TaskController;
use App\Http\Controllers\Admin\AdminController;
use App\Services\Ai\KnowledgeBaseService;
use App\Services\NotificationService;
use Illuminate\Http\Request as HttpRequest;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

/**
 * ─────────────────────────────────────────────────────────
 * REDP — AI Assistant Toolkit
 *
 * Declares the "tools" (functions) the Gemini agent is allowed to call,
 * and executes them safely against real REDP data.
 *
 * Every tool is gated by:
 *   - audience : 'public'  → landing-page visitors (no auth)
 *                'internal'→ logged-in staff / clients
 *   - roles    : which internal roles may use it ('*' = any logged-in user)
 *
 * This is what makes the chatbot "able to do things" instead of just talk,
 * while still respecting the same permission boundaries as the rest of the app.
 * ─────────────────────────────────────────────────────────
 */
class AssistantToolkit
{
    /** Roles allowed to operate the EOI reservation workflow. */
    protected const EOI_STAFF = ['admin', 'finance_officer', 'company_sales', 'head_of_sales', 'sales_agent'];

    /** All internal employee roles (everyone except a client customer). */
    protected const STAFF_ROLES = [
        'admin', 'sales_agent', 'tele_sales', 'company_sales', 'head_of_sales', 'executive',
        'finance_officer', 'delivery_engineer', 'maintenance_manager', 'project_manager',
        'handover_officer', 'legal_officer', 'broker',
    ];

    /** Tools always kept available when the toolset is filtered down per turn. */
    protected const CORE_TOOLS = [
        'search_knowledge_base', 'get_lead_details', 'list_projects',
        'search_available_units', 'create_lead', 'get_eoi_reservation',
    ];

    /** Max tools exposed to the model per turn before dynamic filtering kicks in. */
    protected const TOOL_LIMIT = 24;

    protected string $audience;
    protected ?User $user;

    public function __construct(string $audience = 'public', ?User $user = null)
    {
        $this->audience = $audience === 'internal' ? 'internal' : 'public';
        $this->user = $user;
    }

    /**
     * Master tool catalogue. Each entry:
     *   description, parameters (Gemini schema or null), audiences[], roles[]
     */
    protected function catalogue(): array
    {
        return [
            'list_projects' => [
                'description' => 'List all real-estate projects/compounds with their location, status, delivery date, number of currently available units, and price range. Use this whenever the user asks what projects/compounds are available or wants an overview.',
                'parameters' => null,
                'audiences' => ['public', 'internal'],
                'roles' => ['*'],
            ],

            'search_available_units' => [
                'description' => 'Search currently AVAILABLE units for sale, with optional filters. Returns unit number, project, type, bedrooms, bathrooms, area (m²), price (EGP), floor, view and finishing. Use when the user asks about apartments/villas within a budget, number of bedrooms, a specific project, or a view.',
                'parameters' => [
                    'type' => 'OBJECT',
                    'properties' => [
                        'project_name' => ['type' => 'STRING', 'description' => 'Optional project/compound name to filter by.'],
                        'min_price' => ['type' => 'NUMBER', 'description' => 'Optional minimum price in EGP.'],
                        'max_price' => ['type' => 'NUMBER', 'description' => 'Optional maximum price / budget in EGP.'],
                        'bedrooms' => ['type' => 'INTEGER', 'description' => 'Optional exact number of bedrooms.'],
                        'unit_type' => ['type' => 'STRING', 'description' => "Optional type: apartment, villa, duplex, penthouse, office, commercial."],
                        'view_type' => ['type' => 'STRING', 'description' => 'Optional view: garden, pool, sea, street, landmark.'],
                    ],
                ],
                'audiences' => ['public', 'internal'],
                'roles' => ['*'],
            ],

            'get_project_details' => [
                'description' => 'Get detailed information about ONE project by name: master-plan info (land area, buildings, delivery), amenities, payment plans, and unit availability breakdown.',
                'parameters' => [
                    'type' => 'OBJECT',
                    'properties' => [
                        'project_name' => ['type' => 'STRING', 'description' => 'The project/compound name.'],
                    ],
                    'required' => ['project_name'],
                ],
                'audiences' => ['public', 'internal'],
                'roles' => ['*'],
            ],

            'create_lead' => [
                'description' => "Register a person as a sales lead / capture their interest so the sales team can follow up. Use this when a prospect gives their name and phone (and optionally email, interested project, budget). Always confirm the phone number with the user before calling.",
                'parameters' => [
                    'type' => 'OBJECT',
                    'properties' => [
                        'first_name' => ['type' => 'STRING'],
                        'last_name' => ['type' => 'STRING'],
                        'phone' => ['type' => 'STRING', 'description' => 'Contact phone number.'],
                        'email' => ['type' => 'STRING', 'description' => 'Optional email address.'],
                        'interested_project' => ['type' => 'STRING', 'description' => 'Optional project name they are interested in.'],
                        'budget' => ['type' => 'NUMBER', 'description' => 'Optional budget in EGP.'],
                        'notes' => ['type' => 'STRING', 'description' => 'Optional notes about what they want.'],
                    ],
                    'required' => ['first_name', 'phone'],
                ],
                'audiences' => ['public', 'internal'],
                'roles' => ['*'],
            ],

            'search_leads' => [
                'description' => 'Search CRM leads by name, phone or email and/or status. Returns matching leads with their status, score and source. Staff use only.',
                'parameters' => [
                    'type' => 'OBJECT',
                    'properties' => [
                        'query' => ['type' => 'STRING', 'description' => 'Name, phone or email fragment to search for.'],
                        'status' => ['type' => 'STRING', 'description' => 'Optional lead status filter (e.g. new, contacted, qualified).'],
                    ],
                ],
                'audiences' => ['internal'],
                'roles' => ['admin', 'sales_agent', 'tele_sales', 'company_sales', 'head_of_sales', 'executive', 'broker'],
            ],

            'get_lead_details' => [
                'description' => 'Get full details for a single lead (by id, name, phone or email) including recent interactions and score. Staff use only.',
                'parameters' => [
                    'type' => 'OBJECT',
                    'properties' => [
                        'lead_query' => ['type' => 'STRING', 'description' => 'Lead id, name, phone or email.'],
                    ],
                    'required' => ['lead_query'],
                ],
                'audiences' => ['internal'],
                'roles' => ['admin', 'sales_agent', 'tele_sales', 'company_sales', 'head_of_sales', 'executive', 'broker'],
            ],

            'get_inventory_summary' => [
                'description' => 'Get a summary of unit inventory: counts of available / reserved / sold units and total portfolio value, optionally for one project. Staff use only.',
                'parameters' => [
                    'type' => 'OBJECT',
                    'properties' => [
                        'project_name' => ['type' => 'STRING', 'description' => 'Optional project name to scope the summary.'],
                    ],
                ],
                'audiences' => ['internal'],
                'roles' => ['admin', 'finance_officer', 'company_sales', 'executive', 'head_of_sales', 'sales_agent'],
            ],

            'get_sales_overview' => [
                'description' => 'Get company-wide KPIs: total leads, reservations, active contracts, total contracted value, amount collected, and outstanding balance. Management/finance use only.',
                'parameters' => null,
                'audiences' => ['internal'],
                'roles' => ['admin', 'executive', 'head_of_sales', 'finance_officer', 'company_sales'],
            ],

            'get_client_financials' => [
                'description' => "Look up a client's financial standing (contracts, total, paid, outstanding balance, next due installment) by their name, email or phone. Finance/admin use only.",
                'parameters' => [
                    'type' => 'OBJECT',
                    'properties' => [
                        'client_query' => ['type' => 'STRING', 'description' => 'Client name, email or phone.'],
                    ],
                    'required' => ['client_query'],
                ],
                'audiences' => ['internal'],
                'roles' => ['admin', 'finance_officer', 'executive'],
            ],

            'get_my_account' => [
                'description' => "Get the currently logged-in client's own account: their unit(s), contract balance, upcoming installments and open maintenance tickets. Use when a client asks about 'my unit', 'my balance', 'my payments' or 'my tickets'.",
                'parameters' => null,
                'audiences' => ['internal'],
                'roles' => ['client'],
            ],

            'create_maintenance_ticket' => [
                'description' => 'Open a maintenance / service ticket. For a client it is filed against their own unit automatically. For staff, provide a unit_number.',
                'parameters' => [
                    'type' => 'OBJECT',
                    'properties' => [
                        'category' => ['type' => 'STRING', 'description' => 'plumbing, electrical, structural, or other.'],
                        'title' => ['type' => 'STRING'],
                        'description' => ['type' => 'STRING'],
                        'priority' => ['type' => 'STRING', 'description' => 'low, medium, high, or critical. Defaults to medium.'],
                        'unit_number' => ['type' => 'STRING', 'description' => 'Required only when staff open a ticket on behalf of a unit.'],
                    ],
                    'required' => ['category', 'title', 'description'],
                ],
                'audiences' => ['internal'],
                'roles' => ['client', 'admin', 'maintenance_manager', 'delivery_engineer'],
            ],

            // ── EOI Reservation workflow (staff) ──
            'get_eoi_stats' => [
                'description' => 'Get Expression-of-Interest (EOI) reservation statistics: how many are pending review, approved, rejected, awaiting invitation, and pending 5% payment, plus approved amounts. Optionally scope to one project.',
                'parameters' => [
                    'type' => 'OBJECT',
                    'properties' => [
                        'project_name' => ['type' => 'STRING', 'description' => 'Optional project to scope the stats to.'],
                    ],
                ],
                'audiences' => ['internal'],
                'roles' => self::EOI_STAFF,
            ],

            'list_eoi_reservations' => [
                'description' => "List EOI reservations with optional filters (status: pending_review/approved/rejected; five_percent_status: pending_review/approved/rejected; project name; free-text search on name/email/phone/order number). Use to find EOIs to review, approve, or invite.",
                'parameters' => [
                    'type' => 'OBJECT',
                    'properties' => [
                        'status' => ['type' => 'STRING', 'description' => 'pending_review, approved, or rejected.'],
                        'five_percent_status' => ['type' => 'STRING', 'description' => 'pending_review, approved, or rejected (for the 5% down payment).'],
                        'project_name' => ['type' => 'STRING'],
                        'search' => ['type' => 'STRING', 'description' => 'Name, email, phone, or order number fragment.'],
                    ],
                ],
                'audiences' => ['internal'],
                'roles' => self::EOI_STAFF,
            ],

            'get_eoi_reservation' => [
                'description' => 'Get full details of one EOI reservation identified by its order number, client name, email, or phone.',
                'parameters' => [
                    'type' => 'OBJECT',
                    'properties' => [
                        'eoi_query' => ['type' => 'STRING', 'description' => 'Order number (e.g. EOI-2026-000001), client name, email, or phone.'],
                    ],
                    'required' => ['eoi_query'],
                ],
                'audiences' => ['internal'],
                'roles' => self::EOI_STAFF,
            ],

            'approve_eoi_reservation' => [
                'description' => "Approve a PENDING EOI reservation (verifies the payment receipt). This generates an order number, assigns a queue position, and emails the client. Confirm which reservation with the user first.",
                'parameters' => [
                    'type' => 'OBJECT',
                    'properties' => [
                        'eoi_query' => ['type' => 'STRING', 'description' => 'Order number, client name, email, or phone identifying the EOI.'],
                        'notes' => ['type' => 'STRING', 'description' => 'Optional review notes.'],
                    ],
                    'required' => ['eoi_query'],
                ],
                'audiences' => ['internal'],
                'roles' => self::EOI_STAFF,
            ],

            'reject_eoi_reservation' => [
                'description' => 'Reject a PENDING EOI reservation. A reason (notes) is REQUIRED and is emailed to the client. Confirm with the user before rejecting.',
                'parameters' => [
                    'type' => 'OBJECT',
                    'properties' => [
                        'eoi_query' => ['type' => 'STRING', 'description' => 'Order number, client name, email, or phone.'],
                        'notes' => ['type' => 'STRING', 'description' => 'The reason for rejection (required).'],
                    ],
                    'required' => ['eoi_query', 'notes'],
                ],
                'audiences' => ['internal'],
                'roles' => self::EOI_STAFF,
            ],

            'invite_eoi_clients' => [
                'description' => "Invite the next N approved-but-not-yet-invited EOI clients (in queue/FIFO order) of a project to select their unit. Creates their login and emails them a temporary password and a contracting deadline.",
                'parameters' => [
                    'type' => 'OBJECT',
                    'properties' => [
                        'project_name' => ['type' => 'STRING'],
                        'count' => ['type' => 'INTEGER', 'description' => 'How many clients to invite (1-500).'],
                        'contracting_deadline_hours' => ['type' => 'INTEGER', 'description' => 'Hours the client has to complete contracting (1-720). Defaults to 48.'],
                    ],
                    'required' => ['project_name', 'count'],
                ],
                'audiences' => ['internal'],
                'roles' => self::EOI_STAFF,
            ],

            'resend_eoi_invitation' => [
                'description' => 'Resend the unit-selection invitation email (with a fresh temporary password) to an already-invited, approved EOI client.',
                'parameters' => [
                    'type' => 'OBJECT',
                    'properties' => [
                        'eoi_query' => ['type' => 'STRING', 'description' => 'Order number, client name, email, or phone.'],
                    ],
                    'required' => ['eoi_query'],
                ],
                'audiences' => ['internal'],
                'roles' => self::EOI_STAFF,
            ],

            'approve_eoi_five_percent' => [
                'description' => "Approve a client's 5% down-payment receipt for their EOI reservation (finance/admin only). Confirms the unit hold and lets them proceed to contract signing.",
                'parameters' => [
                    'type' => 'OBJECT',
                    'properties' => [
                        'eoi_query' => ['type' => 'STRING', 'description' => 'Order number, client name, email, or phone.'],
                    ],
                    'required' => ['eoi_query'],
                ],
                'audiences' => ['internal'],
                'roles' => ['admin', 'finance_officer'],
            ],

            'reject_eoi_five_percent' => [
                'description' => "Reject a client's 5% down-payment receipt (finance/admin only). A reason (notes) is REQUIRED and is sent to the client.",
                'parameters' => [
                    'type' => 'OBJECT',
                    'properties' => [
                        'eoi_query' => ['type' => 'STRING', 'description' => 'Order number, client name, email, or phone.'],
                        'notes' => ['type' => 'STRING', 'description' => 'The reason for rejection (required).'],
                    ],
                    'required' => ['eoi_query', 'notes'],
                ],
                'audiences' => ['internal'],
                'roles' => ['admin', 'finance_officer'],
            ],

            'get_my_eoi_status' => [
                'description' => "Get the logged-in client's own EOI reservation status: whether it's approved, their queue position, whether they've been invited to pick a unit, the contracting deadline, and their 5% payment status.",
                'parameters' => null,
                'audiences' => ['internal'],
                'roles' => ['client'],
            ],

            'batch_approve_eoi_reservations' => [
                'description' => "Approve ALL currently pending-review EOI reservations at once (optionally only those of one project). Use when the user says 'approve all pending EOIs'. This is bulk — confirm the count with the user first.",
                'parameters' => [
                    'type' => 'OBJECT',
                    'properties' => [
                        'project_name' => ['type' => 'STRING', 'description' => 'Optional: only approve pending EOIs of this project.'],
                        'notes' => ['type' => 'STRING', 'description' => 'Optional review notes applied to all.'],
                    ],
                ],
                'audiences' => ['internal'],
                'roles' => self::EOI_STAFF,
            ],

            'create_eoi_reservation' => [
                'description' => "Create/submit a new EOI reservation for a lead (pending review). Resolve the lead by name/email/phone. NOTE: the payment RECEIPT file itself must still be uploaded from the EOI page afterwards — always tell the user this. Payment method must match location: inside_egypt → cash/bank_transfer/cheque/instapay; outside_egypt → international_bank_transfer.",
                'parameters' => [
                    'type' => 'OBJECT',
                    'properties' => [
                        'lead_query' => ['type' => 'STRING', 'description' => 'Existing lead: name, email, or phone.'],
                        'project_name' => ['type' => 'STRING'],
                        'client_location' => ['type' => 'STRING', 'description' => 'inside_egypt or outside_egypt.'],
                        'payment_method' => ['type' => 'STRING', 'description' => 'cash, bank_transfer, cheque, instapay, or international_bank_transfer.'],
                        'payment_amount' => ['type' => 'NUMBER', 'description' => 'EOI payment amount in EGP.'],
                        'client_name' => ['type' => 'STRING', 'description' => 'Optional override; defaults to the lead name.'],
                        'client_email' => ['type' => 'STRING', 'description' => 'Optional override; defaults to the lead email.'],
                        'client_phone' => ['type' => 'STRING', 'description' => 'Optional override; defaults to the lead phone.'],
                    ],
                    'required' => ['lead_query', 'project_name', 'client_location', 'payment_method', 'payment_amount'],
                ],
                'audiences' => ['internal'],
                'roles' => self::EOI_STAFF,
            ],

            'get_eoi_queue_settings' => [
                'description' => 'Read the EOI queue prioritization settings: mode (normal FIFO vs smart weighted), and the smart weights for past clients, cash payers, VIPs, and nationality priority.',
                'parameters' => null,
                'audiences' => ['internal'],
                'roles' => ['admin', 'finance_officer'],
            ],

            'update_eoi_queue_settings' => [
                'description' => "Change the EOI queue prioritization rules, then automatically recalculate every project's queue. Set mode to 'normal' (pure FIFO) or 'smart' (weighted). In smart mode you can set the weights that push clients up the queue.",
                'parameters' => [
                    'type' => 'OBJECT',
                    'properties' => [
                        'mode' => ['type' => 'STRING', 'description' => "'normal' or 'smart'."],
                        'weight_past_client' => ['type' => 'INTEGER', 'description' => 'Priority weight for returning/past clients.'],
                        'weight_cash' => ['type' => 'INTEGER', 'description' => 'Priority weight for cash payers.'],
                        'weight_vip' => ['type' => 'INTEGER', 'description' => 'Priority weight for VIP leads.'],
                        'nationality_priority' => ['type' => 'STRING', 'description' => "'none', 'egyptian', or 'foreigner'."],
                        'weight_nationality' => ['type' => 'INTEGER', 'description' => 'Weight applied when a client matches the nationality priority.'],
                    ],
                ],
                'audiences' => ['internal'],
                'roles' => ['admin', 'finance_officer'],
            ],

            // ── RAG Knowledge Base ──
            'search_knowledge_base' => [
                'description' => "Search the company KNOWLEDGE BASE — internal documents, SOPs, policies, procedures, FAQs and uploaded files. ALWAYS use this for any question about company policy, rules, how a process works, 'what does the company say about…', refunds, cancellations, commissions, handover, KYC, payment rules, etc. Answer ONLY from what this returns and cite the source title(s).",
                'parameters' => [
                    'type' => 'OBJECT',
                    'properties' => [
                        'query' => ['type' => 'STRING', 'description' => 'What to look up, in the user\'s own words.'],
                        'source_type' => ['type' => 'STRING', 'description' => 'Optional filter: policy, sop, faq, document, or manual.'],
                    ],
                    'required' => ['query'],
                ],
                'audiences' => ['internal'],
                'roles' => ['*'],
            ],

            'add_knowledge' => [
                'description' => 'Add a new entry to the company knowledge base (a policy, SOP, FAQ or note) so the assistant can cite it in future answers. Admin only.',
                'parameters' => [
                    'type' => 'OBJECT',
                    'properties' => [
                        'title' => ['type' => 'STRING'],
                        'content' => ['type' => 'STRING', 'description' => 'The full text of the policy/SOP/FAQ.'],
                        'source_type' => ['type' => 'STRING', 'description' => 'policy, sop, faq, or manual. Defaults to policy.'],
                    ],
                    'required' => ['title', 'content'],
                ],
                'audiences' => ['internal'],
                'roles' => ['admin'],
            ],

            // ── Meetings / Appointments ──
            'schedule_appointment' => [
                'description' => 'Schedule a meeting / appointment with a lead or client (e.g. a consultation or site visit). Provide a date, a time (HH:MM 24h), and whether it is online or in the company office.',
                'parameters' => [
                    'type' => 'OBJECT',
                    'properties' => [
                        'person_query' => ['type' => 'STRING', 'description' => 'The lead or client to meet — name, email or phone.'],
                        'booking_date' => ['type' => 'STRING', 'description' => 'Date, YYYY-MM-DD (today or later).'],
                        'booking_time' => ['type' => 'STRING', 'description' => 'Time in 24h HH:MM.'],
                        'booking_type' => ['type' => 'STRING', 'description' => 'online or in_company.'],
                        'type' => ['type' => 'STRING', 'description' => "Optional label, e.g. 'Consultation' or 'Site Visit'."],
                    ],
                    'required' => ['person_query', 'booking_date', 'booking_time', 'booking_type'],
                ],
                'audiences' => ['internal'],
                'roles' => self::STAFF_ROLES,
            ],

            'list_appointments' => [
                'description' => 'List upcoming scheduled appointments/meetings, optionally for a specific lead or client.',
                'parameters' => [
                    'type' => 'OBJECT',
                    'properties' => [
                        'person_query' => ['type' => 'STRING', 'description' => 'Optional lead/client name, email or phone to filter by.'],
                    ],
                ],
                'audiences' => ['internal'],
                'roles' => self::STAFF_ROLES,
            ],

            // ── Task / Work management ──
            'create_task' => [
                'description' => 'Create a work task and optionally assign it to a colleague. Use for "assign a task", "remind the team to…", "create a follow-up".',
                'parameters' => [
                    'type' => 'OBJECT',
                    'properties' => [
                        'title' => ['type' => 'STRING'],
                        'description' => ['type' => 'STRING'],
                        'priority' => ['type' => 'STRING', 'description' => 'low, medium, high, or critical. Defaults to medium.'],
                        'assignee_query' => ['type' => 'STRING', 'description' => 'Optional colleague to assign — name or email.'],
                        'due_date' => ['type' => 'STRING', 'description' => 'Optional due date YYYY-MM-DD.'],
                    ],
                    'required' => ['title'],
                ],
                'audiences' => ['internal'],
                'roles' => self::STAFF_ROLES,
            ],

            'list_tasks' => [
                'description' => 'List work tasks, optionally filtered by status (todo, in_progress, review, done, cancelled) or priority.',
                'parameters' => [
                    'type' => 'OBJECT',
                    'properties' => [
                        'status' => ['type' => 'STRING'],
                        'priority' => ['type' => 'STRING'],
                    ],
                ],
                'audiences' => ['internal'],
                'roles' => self::STAFF_ROLES,
            ],

            // ── Notifications ──
            'send_notification' => [
                'description' => 'Send a direct notification/message to a specific user (staff or client) by name or email. Use for "notify X", "let X know…", "send a reminder to X".',
                'parameters' => [
                    'type' => 'OBJECT',
                    'properties' => [
                        'recipient_query' => ['type' => 'STRING', 'description' => 'The person to notify — name or email.'],
                        'title' => ['type' => 'STRING', 'description' => 'Short notification title.'],
                        'message' => ['type' => 'STRING', 'description' => 'The notification body.'],
                    ],
                    'required' => ['recipient_query', 'title', 'message'],
                ],
                'audiences' => ['internal'],
                'roles' => ['admin', 'head_of_sales', 'executive', 'maintenance_manager', 'project_manager'],
            ],

            // ── Document vault (DMS) ──
            'list_documents' => [
                'description' => 'Search the document vault (DMS) for files by title or content keyword. Returns matching document titles and their status.',
                'parameters' => [
                    'type' => 'OBJECT',
                    'properties' => [
                        'search' => ['type' => 'STRING', 'description' => 'Keyword to search document titles/content.'],
                    ],
                ],
                'audiences' => ['internal'],
                'roles' => ['*'],
            ],
        ];
    }

    /** Tool names allowed for this audience + the user's role. */
    protected function allowedNames(): array
    {
        $role = $this->user->role ?? null;
        $allowed = [];

        foreach ($this->catalogue() as $name => $def) {
            if (!in_array($this->audience, $def['audiences'], true)) {
                continue;
            }
            if ($this->audience === 'internal') {
                if (!in_array('*', $def['roles'], true) && !in_array($role, $def['roles'], true)) {
                    continue;
                }
            }
            $allowed[] = $name;
        }

        return $allowed;
    }

    /**
     * Gemini `function_declarations` array for the allowed tools.
     */
    public function declarations(): array
    {
        return $this->declarationsForNames($this->allowedNames());
    }

    /** Build Gemini function declarations for a specific list of tool names. */
    protected function declarationsForNames(array $names): array
    {
        $decls = [];
        $catalogue = $this->catalogue();
        foreach ($names as $name) {
            if (!isset($catalogue[$name])) {
                continue;
            }
            $def = $catalogue[$name];
            $decl = ['name' => $name, 'description' => $def['description']];
            if (!empty($def['parameters'])) {
                $decl['parameters'] = $def['parameters'];
            }
            $decls[] = $decl;
        }
        return $decls;
    }

    /**
     * Dynamic tool loading: expose only the tools relevant to THIS turn so the
     * model stays sharp as the catalogue grows (function-calling accuracy
     * degrades past ~30-50 tools). Keeps a core set + the current page's tools,
     * and fills the rest by semantic similarity to the user's message.
     * Falls back to all role-allowed tools when the set is small or embeddings
     * are unavailable.
     */
    public function selectDeclarations(string $message, ?string $page = null, ?int $limit = null): array
    {
        $limit = $limit ?: self::TOOL_LIMIT;
        $allowed = $this->allowedNames();

        if (count($allowed) <= $limit) {
            return $this->declarationsForNames($allowed);
        }

        $ranked = $this->rankToolsByEmbedding($message, $allowed);
        if ($ranked === null) {
            return $this->declarationsForNames($allowed); // graceful fallback
        }

        $core = array_values(array_intersect(self::CORE_TOOLS, $allowed));
        $pageTools = array_values(array_intersect($this->pageTools($page), $allowed));

        $selected = [];
        foreach (array_merge($core, $pageTools, $ranked) as $name) {
            if (!in_array($name, $selected, true)) {
                $selected[] = $name;
            }
            if (count($selected) >= $limit) {
                break;
            }
        }

        return $this->declarationsForNames($selected);
    }

    /** Rank the allowed tools by cosine similarity to the message. */
    protected function rankToolsByEmbedding(string $message, array $allowed): ?array
    {
        $kb = app(KnowledgeBaseService::class);
        if (!$kb->isConfigured()) {
            return null;
        }
        $vectors = $this->toolEmbeddings($kb);
        if (empty($vectors)) {
            return null;
        }
        $qvec = $kb->embed($message, 'RETRIEVAL_QUERY');
        if (!$qvec) {
            return null;
        }

        $scores = [];
        foreach ($allowed as $name) {
            if (isset($vectors[$name])) {
                $scores[$name] = $this->dot($qvec, $vectors[$name]);
            }
        }
        if (empty($scores)) {
            return null;
        }
        arsort($scores);
        return array_keys($scores);
    }

    /** Embed every tool's "name: description" once and cache it. */
    protected function toolEmbeddings(KnowledgeBaseService $kb): array
    {
        $texts = [];
        foreach ($this->catalogue() as $name => $def) {
            $texts[$name] = $name . ': ' . $def['description'];
        }
        $key = 'assistant_tool_embeddings_' . md5(implode('|', array_map(
            fn ($n, $t) => $n . '=' . $t,
            array_keys($texts),
            array_values($texts)
        )));

        $cached = Cache::get($key);
        if (is_array($cached) && !empty($cached)) {
            return $cached;
        }

        $vecs = $kb->embedBatch(array_values($texts), 'RETRIEVAL_DOCUMENT');
        $out = [];
        $i = 0;
        foreach (array_keys($texts) as $name) {
            if (isset($vecs[$i]) && is_array($vecs[$i])) {
                $out[$name] = $vecs[$i];
            }
            $i++;
        }
        if (!empty($out)) {
            Cache::put($key, $out, now()->addDays(30));
        }
        return $out;
    }

    protected function dot(array $a, array $b): float
    {
        $sum = 0.0;
        $n = min(count($a), count($b));
        for ($i = 0; $i < $n; $i++) {
            $sum += $a[$i] * $b[$i];
        }
        return $sum;
    }

    /** Tools most relevant to the page the user is currently on. */
    protected function pageTools(?string $page): array
    {
        if (!$page) {
            return [];
        }
        $map = [
            '/acquisition/eoi-reservations' => [
                'get_eoi_stats', 'list_eoi_reservations', 'get_eoi_reservation',
                'approve_eoi_reservation', 'reject_eoi_reservation', 'batch_approve_eoi_reservations',
                'invite_eoi_clients', 'resend_eoi_invitation', 'create_eoi_reservation',
                'get_eoi_queue_settings', 'update_eoi_queue_settings',
            ],
            '/acquisition/leads' => ['search_leads', 'get_lead_details', 'create_lead'],
            '/acquisition/crm' => ['search_leads', 'get_lead_details', 'create_lead'],
            '/finance/inventory' => ['get_inventory_summary', 'search_available_units', 'list_projects'],
            '/finance/collections' => ['get_client_financials', 'get_sales_overview'],
            '/finance' => ['get_client_financials', 'get_sales_overview', 'get_inventory_summary'],
            '/delivery/maintenance' => ['create_maintenance_ticket', 'list_documents'],
            '/delivery/documents' => ['list_documents', 'search_knowledge_base'],
            '/enterprise/tasks' => ['create_task', 'list_tasks'],
        ];
        foreach ($map as $prefix => $tools) {
            if (str_starts_with($page, $prefix)) {
                return $tools;
            }
        }
        return [];
    }

    // ── EOI helper block continues below ──

    /**
     * Execute a tool call. Always returns a JSON-serialisable array.
     * Errors are returned (not thrown) so the model can explain them to the user.
     */
    public function execute(string $name, array $args): array
    {
        if (!in_array($name, $this->allowedNames(), true)) {
            return ['error' => 'You are not allowed to use this tool.'];
        }

        try {
            return match ($name) {
                'list_projects' => $this->listProjects(),
                'search_available_units' => $this->searchAvailableUnits($args),
                'get_project_details' => $this->getProjectDetails($args),
                'create_lead' => $this->createLead($args),
                'search_leads' => $this->searchLeads($args),
                'get_lead_details' => $this->getLeadDetails($args),
                'get_inventory_summary' => $this->getInventorySummary($args),
                'get_sales_overview' => $this->getSalesOverview(),
                'get_client_financials' => $this->getClientFinancials($args),
                'get_my_account' => $this->getMyAccount(),
                'create_maintenance_ticket' => $this->createMaintenanceTicket($args),
                'get_eoi_stats' => $this->getEoiStats($args),
                'list_eoi_reservations' => $this->listEoiReservations($args),
                'get_eoi_reservation' => $this->getEoiReservation($args),
                'approve_eoi_reservation' => $this->approveEoiReservation($args),
                'reject_eoi_reservation' => $this->rejectEoiReservation($args),
                'invite_eoi_clients' => $this->inviteEoiClients($args),
                'resend_eoi_invitation' => $this->resendEoiInvitation($args),
                'approve_eoi_five_percent' => $this->approveEoiFivePercent($args),
                'reject_eoi_five_percent' => $this->rejectEoiFivePercent($args),
                'get_my_eoi_status' => $this->getMyEoiStatus(),
                'batch_approve_eoi_reservations' => $this->batchApproveEoi($args),
                'create_eoi_reservation' => $this->createEoiReservation($args),
                'get_eoi_queue_settings' => $this->getEoiQueueSettings(),
                'update_eoi_queue_settings' => $this->updateEoiQueueSettings($args),
                'search_knowledge_base' => $this->searchKnowledgeBase($args),
                'add_knowledge' => $this->addKnowledge($args),
                'schedule_appointment' => $this->scheduleAppointment($args),
                'list_appointments' => $this->listAppointments($args),
                'create_task' => $this->createTask($args),
                'list_tasks' => $this->listTasks($args),
                'send_notification' => $this->sendNotification($args),
                'list_documents' => $this->listDocuments($args),
                default => ['error' => 'Unknown tool.'],
            };
        } catch (\Throwable $e) {
            Log::warning("[AssistantToolkit] tool {$name} failed: " . $e->getMessage());
            return ['error' => 'The tool failed to run: ' . $e->getMessage()];
        }
    }

    // ── Tool implementations ───────────────────────────────────────────

    protected function listProjects(): array
    {
        $projects = Project::all();
        $out = [];

        foreach ($projects as $p) {
            $released = $p->released_phases ?: ['Phase 1'];
            $base = Unit::where('project_id', $p->id)
                ->where('status', 'available')
                ->whereIn('phase', $released);

            $available = (clone $base)->count();

            $out[] = [
                'name' => $p->name,
                'location' => $p->location,
                'status' => $p->status,
                'project_type' => $p->project_type,
                'delivery_date' => $p->delivery_date,
                'available_units' => $available,
                'price_from' => $available ? (float) (clone $base)->min('price') : null,
                'price_to' => $available ? (float) (clone $base)->max('price') : null,
            ];
        }

        return ['projects' => $out, 'count' => count($out)];
    }

    protected function searchAvailableUnits(array $args): array
    {
        $q = Unit::query()->with('project')->where('status', 'available');

        if (!empty($args['project_name'])) {
            $project = Project::where('name', 'LIKE', '%' . $args['project_name'] . '%')->first();
            if (!$project) {
                return ['error' => "No project found matching '{$args['project_name']}'.", 'units' => []];
            }
            $released = $project->released_phases ?: ['Phase 1'];
            $q->where('project_id', $project->id)->whereIn('phase', $released);
        }

        if (isset($args['min_price'])) {
            $q->where('price', '>=', (float) $args['min_price']);
        }
        if (isset($args['max_price'])) {
            $q->where('price', '<=', (float) $args['max_price']);
        }
        if (isset($args['bedrooms'])) {
            $q->where('bedrooms', (int) $args['bedrooms']);
        }
        if (!empty($args['unit_type'])) {
            $q->where('type', $args['unit_type']);
        }
        if (!empty($args['view_type'])) {
            $q->where('view_type', $args['view_type']);
        }

        $units = $q->orderBy('price')->limit(15)->get();

        $mapped = $units->map(fn ($u) => [
            'unit_number' => $u->unit_number,
            'project' => $u->project->name ?? null,
            'type' => $u->type,
            'bedrooms' => $u->bedrooms,
            'bathrooms' => $u->bathrooms,
            'area_m2' => $u->area,
            'price_egp' => (float) $u->price,
            'floor' => $u->floor,
            'view' => $u->view_type,
            'finishing' => $u->finishing_type,
            'building' => $u->building,
        ])->all();

        return ['count' => count($mapped), 'units' => $mapped];
    }

    protected function getProjectDetails(array $args): array
    {
        $project = Project::where('name', 'LIKE', '%' . ($args['project_name'] ?? '') . '%')->first();
        if (!$project) {
            return ['error' => "No project found matching '" . ($args['project_name'] ?? '') . "'."];
        }

        $released = $project->released_phases ?: ['Phase 1'];
        $unitsBase = Unit::where('project_id', $project->id);

        $data = [
            'name' => $project->name,
            'location' => $project->location,
            'status' => $project->status,
            'project_type' => $project->project_type,
            'delivery_date' => $project->delivery_date,
            'land_area' => $project->land_area,
            'land_area_unit' => $project->land_area_unit,
            'total_buildings' => $project->total_buildings_count,
            'total_units' => $project->total_units,
            'units_available' => (clone $unitsBase)->where('status', 'available')->whereIn('phase', $released)->count(),
            'units_reserved' => (clone $unitsBase)->where('status', 'reserved')->count(),
            'units_sold' => (clone $unitsBase)->where('status', 'sold')->count(),
        ];

        try {
            $data['amenities'] = ProjectAmenity::where('project_id', $project->id)->pluck('name')->all();
        } catch (\Throwable $e) {
            $data['amenities'] = [];
        }

        try {
            $data['payment_plans'] = $project->paymentPlans()->get()->toArray();
        } catch (\Throwable $e) {
            $data['payment_plans'] = [];
        }

        return $data;
    }

    protected function createLead(array $args): array
    {
        $first = trim($args['first_name'] ?? '');
        $last = trim($args['last_name'] ?? '');
        $phone = trim($args['phone'] ?? '');

        if ($first === '' || $phone === '') {
            return ['error' => 'first_name and phone are required to register a lead.'];
        }

        $email = !empty($args['email']) ? trim($args['email']) : null;

        $projectId = null;
        if (!empty($args['interested_project'])) {
            $project = Project::where('name', 'LIKE', '%' . $args['interested_project'] . '%')->first();
            $projectId = $project->id ?? null;
        }

        $lead = null;
        if ($email) {
            $lead = Lead::where('email', $email)->first();
        }
        if (!$lead && $phone) {
            $lead = Lead::where('phone', $phone)->first();
        }

        if ($lead) {
            $lead->update(array_filter([
                'interested_project_id' => $projectId,
                'budget' => isset($args['budget']) ? (float) $args['budget'] : null,
            ]));
            $created = false;
        } else {
            $lead = Lead::create([
                'id' => (string) Str::uuid(),
                'first_name' => $first,
                'last_name' => $last ?: '-',
                'email' => $email,
                'phone' => $phone,
                'status' => defined(Lead::class . '::STATUS_NEW') ? Lead::STATUS_NEW : 'new',
                'source' => $this->audience === 'public' ? 'ai_assistant' : 'ai_assistant_internal',
                'interested_project_id' => $projectId,
                'budget' => isset($args['budget']) ? (float) $args['budget'] : null,
            ]);
            $created = true;
        }

        // Log an interaction note (best-effort; never break lead capture).
        try {
            Interaction::create([
                'id' => (string) Str::uuid(),
                'lead_id' => $lead->id,
                'type' => 'note',
                'notes' => 'AI Assistant: ' . ($args['notes'] ?? 'Lead captured via AI chatbot.'),
            ]);
        } catch (\Throwable $e) {
            // ignore
        }

        return [
            'success' => true,
            'created' => $created,
            'lead_id' => $lead->id,
            'message' => $created
                ? 'Lead registered successfully. The sales team will follow up.'
                : 'This contact already exists; their record was updated.',
        ];
    }

    protected function searchLeads(array $args): array
    {
        $q = Lead::query();

        if (!empty($args['query'])) {
            $term = '%' . $args['query'] . '%';
            $words = preg_split('/\s+/', trim($args['query'])) ?: [];
            $q->where(function ($sub) use ($term, $words) {
                $sub->where('first_name', 'LIKE', $term)
                    ->orWhere('last_name', 'LIKE', $term)
                    ->orWhere('phone', 'LIKE', $term)
                    ->orWhere('email', 'LIKE', $term);
                // Match a full "First Last" string against the split name columns.
                if (count($words) >= 2) {
                    $sub->orWhere(function ($w) use ($words) {
                        $w->where('first_name', 'LIKE', '%' . $words[0] . '%')
                            ->where('last_name', 'LIKE', '%' . end($words) . '%');
                    });
                }
            });
        }
        if (!empty($args['status'])) {
            $q->where('status', $args['status']);
        }

        $leads = $q->latest()->limit(20)->get();

        $mapped = $leads->map(fn ($l) => [
            'id' => $l->id,
            'name' => trim($l->first_name . ' ' . $l->last_name),
            'phone' => $l->phone,
            'email' => $l->email,
            'status' => $l->status,
            'score' => $l->lead_score,
            'source' => $l->source,
        ])->all();

        return ['count' => count($mapped), 'leads' => $mapped];
    }

    protected function getLeadDetails(array $args): array
    {
        $lead = $this->resolveLead($args['lead_query'] ?? '');
        if (!$lead) {
            return ['error' => 'No matching lead found.'];
        }

        $interactions = [];
        try {
            $interactions = Interaction::where('lead_id', $lead->id)
                ->latest()->limit(5)
                ->get(['type', 'notes', 'created_at'])->toArray();
        } catch (\Throwable $e) {
            // ignore
        }

        $data = [
            'id' => $lead->id,
            'name' => trim($lead->first_name . ' ' . $lead->last_name),
            'phone' => $lead->phone,
            'email' => $lead->email,
            'status' => $lead->status,
            'score' => $lead->lead_score,
            'source' => $lead->source,
            'budget' => $lead->budget,
            'kyc_status' => $lead->kyc_status,
            'interested_project_id' => $lead->interested_project_id,
            'recent_interactions' => $interactions,
        ];

        // Include EOI reservation status — usually what "what's their status" means here.
        try {
            $eois = EoiReservation::where('lead_id', $lead->id)->latest()->get();
            $data['eoi_reservations'] = $eois->map(fn ($e) => [
                'order_number' => $e->order_number,
                'status' => $e->status,
                'queue_number' => $e->queue_number,
                'payment_amount_egp' => (float) $e->payment_amount,
                'invited' => (bool) $e->invited_at,
                'five_percent_status' => $e->five_percent_status,
            ])->all();
        } catch (\Throwable $e) {
            $data['eoi_reservations'] = [];
        }

        return $data;
    }

    protected function getInventorySummary(array $args): array
    {
        $q = Unit::query();

        $projectName = null;
        if (!empty($args['project_name'])) {
            $project = Project::where('name', 'LIKE', '%' . $args['project_name'] . '%')->first();
            if (!$project) {
                return ['error' => "No project found matching '{$args['project_name']}'."];
            }
            $projectName = $project->name;
            $q->where('project_id', $project->id);
        }

        return [
            'scope' => $projectName ?? 'all projects',
            'available' => (clone $q)->where('status', 'available')->count(),
            'reserved' => (clone $q)->where('status', 'reserved')->count(),
            'sold' => (clone $q)->where('status', 'sold')->count(),
            'total_units' => (clone $q)->count(),
            'available_value_egp' => (float) (clone $q)->where('status', 'available')->sum('price'),
            'sold_value_egp' => (float) (clone $q)->where('status', 'sold')->sum('price'),
        ];
    }

    protected function getSalesOverview(): array
    {
        $contractedValue = (float) Contract::sum('total_amount');
        $collected = (float) Payment::where('status', 'paid')->sum('paid_amount');

        return [
            'total_leads' => Lead::count(),
            'reservations' => Reservation::count(),
            'active_contracts' => Contract::where('status', 'active')->count(),
            'total_contracts' => Contract::count(),
            'total_contracted_value_egp' => $contractedValue,
            'collected_egp' => $collected,
            'outstanding_egp' => round(max(0, $contractedValue - $collected), 2),
        ];
    }

    protected function getClientFinancials(array $args): array
    {
        $client = $this->resolveUser($args['client_query'] ?? '');
        if (!$client) {
            return ['error' => 'No matching client found.'];
        }
        return $this->financialsForUser($client);
    }

    protected function getMyAccount(): array
    {
        if (!$this->user) {
            return ['error' => 'Not authenticated.'];
        }

        $data = $this->financialsForUser($this->user);

        try {
            $data['open_tickets'] = MaintenanceTicket::where('client_id', $this->user->id)
                ->whereIn('status', ['open', 'assigned'])
                ->get(['title', 'category', 'status', 'priority'])->toArray();
        } catch (\Throwable $e) {
            $data['open_tickets'] = [];
        }

        return $data;
    }

    protected function createMaintenanceTicket(array $args): array
    {
        $unitId = null;

        if (($this->user->role ?? null) === 'client') {
            // File against the client's own unit.
            $contract = Contract::where('client_id', $this->user->id)->latest()->first();
            if ($contract) {
                $unitId = $contract->unit_id;
            } else {
                $res = Reservation::where('client_id', $this->user->id)->latest()->first();
                $unitId = $res->unit_id ?? null;
            }
            if (!$unitId) {
                return ['error' => 'No unit is linked to your account yet, so a ticket cannot be opened.'];
            }
        } else {
            if (empty($args['unit_number'])) {
                return ['error' => 'unit_number is required when staff open a ticket.'];
            }
            $unit = Unit::where('unit_number', $args['unit_number'])->first();
            if (!$unit) {
                return ['error' => "No unit found with number '{$args['unit_number']}'."];
            }
            $unitId = $unit->id;
        }

        $ticket = MaintenanceTicket::create([
            'id' => (string) Str::uuid(),
            'client_id' => $this->user->id,
            'unit_id' => $unitId,
            'category' => $args['category'] ?? 'other',
            'title' => $args['title'] ?? 'Maintenance request',
            'description' => $args['description'] ?? '',
            'status' => 'open',
            'priority' => $args['priority'] ?? 'medium',
        ]);

        return [
            'success' => true,
            'ticket_id' => $ticket->id,
            'message' => 'Maintenance ticket opened successfully.',
        ];
    }

    // ── RAG Knowledge Base ─────────────────────────────────────────────

    protected function searchKnowledgeBase(array $args): array
    {
        $kb = app(KnowledgeBaseService::class);
        if (!$kb->isConfigured()) {
            return ['error' => 'Knowledge base is not configured (missing embedding key).'];
        }
        if ($kb->count() === 0) {
            return ['error' => 'The knowledge base is empty. Nothing has been indexed yet.'];
        }

        $tenantId = $this->user->tenant_id ?? null;
        $results = $kb->search(
            (string) ($args['query'] ?? ''),
            5,
            $args['source_type'] ?? null,
            $tenantId
        );

        if (empty($results)) {
            return ['found' => false, 'message' => 'No relevant company knowledge was found for that query.'];
        }

        // Trim each chunk so the model gets the substance without huge payloads.
        $sources = array_map(fn ($r) => [
            'source' => $r['source_ref'] ?: $r['title'],
            'type' => $r['source_type'],
            'relevance' => $r['score'],
            'excerpt' => mb_substr($r['content'], 0, 900),
        ], $results);

        return [
            'found' => true,
            'instructions' => 'Answer ONLY from these excerpts and cite the source title(s). If they do not contain the answer, say so.',
            'sources' => $sources,
        ];
    }

    protected function addKnowledge(array $args): array
    {
        $title = trim($args['title'] ?? '');
        $content = trim($args['content'] ?? '');
        if ($title === '' || $content === '') {
            return ['error' => 'Both title and content are required.'];
        }

        $kb = app(KnowledgeBaseService::class);
        if (!$kb->isConfigured()) {
            return ['error' => 'Knowledge base is not configured (missing embedding key).'];
        }

        $type = in_array($args['source_type'] ?? '', ['policy', 'sop', 'faq', 'manual'], true)
            ? $args['source_type'] : 'policy';

        $chunks = $kb->indexContent([
            'source_type' => $type,
            'title' => $title,
            'source_ref' => $title,
            'content' => $content,
            'tenant_id' => $this->user->tenant_id ?? null,
        ]);

        return $chunks > 0
            ? ['success' => true, 'message' => "Added '{$title}' to the knowledge base ({$chunks} chunk(s)).", 'chunks' => $chunks]
            : ['error' => 'Failed to index the content.'];
    }

    // ── Meetings / Tasks / Notifications / Documents ───────────────────

    protected function scheduleAppointment(array $args): array
    {
        $query = trim($args['person_query'] ?? '');
        $params = [
            'booking_date' => $args['booking_date'] ?? null,
            'booking_time' => $args['booking_time'] ?? null,
            'booking_type' => $args['booking_type'] ?? null,
            'type' => $args['type'] ?? null,
        ];

        $lead = $this->resolveLead($query);
        if ($lead) {
            $params['lead_id'] = $lead->id;
        } else {
            $user = $this->resolveUser($query);
            if (!$user) {
                return ['error' => "No lead or client found matching '{$query}'."];
            }
            $params['user_id'] = $user->id;
        }

        return $this->invokeController(AppointmentController::class, 'store', null, $params);
    }

    protected function listAppointments(array $args): array
    {
        $q = Appointment::query()->with(['lead', 'user'])
            ->whereDate('booking_date', '>=', now()->toDateString());

        if (!empty($args['person_query'])) {
            $lead = $this->resolveLead($args['person_query']);
            $user = $this->resolveUser($args['person_query']);
            $q->where(function ($w) use ($lead, $user) {
                if ($lead) {
                    $w->orWhere('lead_id', $lead->id);
                }
                if ($user) {
                    $w->orWhere('user_id', $user->id);
                }
                if (!$lead && !$user) {
                    $w->whereRaw('1=0');
                }
            });
        }

        $rows = $q->orderBy('booking_date')->limit(15)->get();

        return [
            'count' => $rows->count(),
            'appointments' => $rows->map(fn ($a) => [
                'with' => $a->lead ? trim(($a->lead->first_name ?? '') . ' ' . ($a->lead->last_name ?? '')) : ($a->user->name ?? null),
                'date' => $a->booking_date,
                'time' => $a->booking_time,
                'type' => $a->type,
                'mode' => $a->booking_type,
                'status' => $a->status,
            ])->all(),
        ];
    }

    protected function createTask(array $args): array
    {
        $params = [
            'title' => $args['title'] ?? null,
            'description' => $args['description'] ?? null,
            'status' => 'todo',
            'priority' => in_array($args['priority'] ?? '', ['low', 'medium', 'high', 'critical'], true) ? $args['priority'] : 'medium',
            'due_date' => $args['due_date'] ?? null,
        ];

        if (!empty($args['assignee_query'])) {
            $assignee = $this->resolveUser($args['assignee_query']);
            if ($assignee) {
                $params['assigned_to'] = $assignee->id;
            }
        }

        return $this->invokeController(TaskController::class, 'store', null, $params);
    }

    protected function listTasks(array $args): array
    {
        $q = Task::query();
        if (!empty($args['status'])) {
            $q->where('status', $args['status']);
        }
        if (!empty($args['priority'])) {
            $q->where('priority', $args['priority']);
        }
        $rows = $q->latest()->limit(15)->get();

        return [
            'count' => $rows->count(),
            'tasks' => $rows->map(fn ($t) => [
                'title' => $t->title,
                'status' => $t->status,
                'priority' => $t->priority,
                'due_date' => $t->due_date,
            ])->all(),
        ];
    }

    protected function sendNotification(array $args): array
    {
        $user = $this->resolveUser($args['recipient_query'] ?? '');
        if (!$user) {
            return ['error' => "No user found matching '" . ($args['recipient_query'] ?? '') . "'."];
        }

        try {
            NotificationService::send(
                $user->id,
                'push',
                (string) ($user->email ?? ''),
                $args['title'] ?? 'Notification',
                $args['message'] ?? ''
            );
            return ['success' => true, 'message' => "Notification sent to {$user->name}."];
        } catch (\Throwable $e) {
            return ['error' => 'Failed to send notification: ' . $e->getMessage()];
        }
    }

    protected function listDocuments(array $args): array
    {
        $q = Document::query();
        if (!empty($args['search'])) {
            $term = '%' . $args['search'] . '%';
            $q->where(fn ($w) => $w->where('title', 'like', $term)->orWhere('ocr_content', 'like', $term));
        }
        $rows = $q->latest()->limit(15)->get();

        if ($rows->isEmpty()) {
            return ['count' => 0, 'documents' => [], 'note' => 'No documents found. For policy/procedure questions use search_knowledge_base instead.'];
        }

        return [
            'count' => $rows->count(),
            'documents' => $rows->map(fn ($d) => ['title' => $d->title, 'status' => $d->status])->all(),
        ];
    }

    /** Invoke any controller action with a synthesized authenticated request. */
    protected function invokeController(string $class, string $method, ?string $id, array $params): array
    {
        $clean = array_filter($params, fn ($v) => $v !== null && $v !== '');
        $sub = HttpRequest::create('/', 'POST', $clean);
        $sub->setUserResolver(fn () => $this->user);

        try {
            $controller = app($class);
            $response = $id !== null ? $controller->{$method}($sub, $id) : $controller->{$method}($sub);
            $data = $response->getData(true);

            $out = [
                'success' => $data['success'] ?? ($response->getStatusCode() < 400),
                'message' => $data['message'] ?? null,
            ];
            if (isset($data['data']) && is_array($data['data'])) {
                foreach (['id', 'order_number', 'queue_number', 'contract_number'] as $k) {
                    if (isset($data['data'][$k])) {
                        $out[$k] = $data['data'][$k];
                    }
                }
            }
            return $out;
        } catch (\Illuminate\Validation\ValidationException $e) {
            return ['success' => false, 'error' => 'Validation failed', 'details' => $e->errors()];
        }
    }

    // ── EOI reservation workflow ───────────────────────────────────────

    protected function getEoiStats(array $args): array
    {
        $q = EoiReservation::query();
        $scope = 'all projects';

        if (!empty($args['project_name'])) {
            $project = Project::where('name', 'LIKE', '%' . $args['project_name'] . '%')->first();
            if (!$project) {
                return ['error' => "No project found matching '{$args['project_name']}'."];
            }
            $scope = $project->name;
            $q->where('project_id', $project->id);
        }

        return [
            'scope' => $scope,
            'total' => (clone $q)->count(),
            'pending_review' => (clone $q)->where('status', EoiReservation::STATUS_PENDING_REVIEW)->count(),
            'approved' => (clone $q)->where('status', EoiReservation::STATUS_APPROVED)->count(),
            'rejected' => (clone $q)->where('status', EoiReservation::STATUS_REJECTED)->count(),
            'awaiting_invitation' => (clone $q)->where('status', EoiReservation::STATUS_APPROVED)->whereNull('invited_at')->count(),
            'invited' => (clone $q)->where('status', EoiReservation::STATUS_APPROVED)->whereNotNull('invited_at')->count(),
            'pending_five_percent' => (clone $q)->where('five_percent_status', 'pending_review')->count(),
            'approved_amount_egp' => (float) (clone $q)->where('status', EoiReservation::STATUS_APPROVED)->sum('payment_amount'),
        ];
    }

    protected function listEoiReservations(array $args): array
    {
        $q = EoiReservation::query();

        if (!empty($args['status'])) {
            $q->where('status', $args['status']);
        }
        if (!empty($args['five_percent_status'])) {
            $q->where('five_percent_status', $args['five_percent_status']);
        }
        if (!empty($args['project_name'])) {
            $project = Project::where('name', 'LIKE', '%' . $args['project_name'] . '%')->first();
            if ($project) {
                $q->where('project_id', $project->id);
            }
        }
        if (!empty($args['search'])) {
            $term = '%' . $args['search'] . '%';
            $q->where(function ($sub) use ($term) {
                $sub->where('client_name', 'LIKE', $term)
                    ->orWhere('client_email', 'LIKE', $term)
                    ->orWhere('client_phone', 'LIKE', $term)
                    ->orWhere('order_number', 'LIKE', $term);
            });
        }

        $rows = $q->orderByRaw('queue_number IS NULL, queue_number ASC')
            ->latest()
            ->limit(15)
            ->get();

        $mapped = $rows->map(fn ($r) => [
            'order_number' => $r->order_number,
            'client_name' => $r->client_name,
            'client_phone' => $r->client_phone,
            'status' => $r->status,
            'queue_number' => $r->queue_number,
            'payment_method' => $r->payment_method,
            'payment_amount_egp' => (float) $r->payment_amount,
            'invited' => (bool) $r->invited_at,
            'five_percent_status' => $r->five_percent_status,
        ])->all();

        return ['count' => count($mapped), 'reservations' => $mapped];
    }

    protected function getEoiReservation(array $args): array
    {
        $res = $this->resolveEoi($args['eoi_query'] ?? '');
        if (!($res instanceof EoiReservation)) {
            return $res; // error / ambiguity array
        }

        return [
            'order_number' => $res->order_number,
            'client_name' => $res->client_name,
            'client_email' => $res->client_email,
            'client_phone' => $res->client_phone,
            'client_location' => $res->client_location,
            'status' => $res->status,
            'queue_number' => $res->queue_number,
            'payment_method' => $res->payment_method,
            'payment_amount_egp' => (float) $res->payment_amount,
            'invited_at' => $res->invited_at,
            'contracting_deadline_hours' => $res->contracting_deadline_hours,
            'five_percent_status' => $res->five_percent_status,
            'five_percent_paid' => (bool) $res->five_percent_paid,
            'review_notes' => $res->review_notes,
            'unit_id' => $res->unit_id,
            'submitted_at' => $res->created_at,
        ];
    }

    protected function approveEoiReservation(array $args): array
    {
        $res = $this->resolveEoi($args['eoi_query'] ?? '');
        if (!($res instanceof EoiReservation)) {
            return $res;
        }
        return $this->callEoiController('approve', $res->id, ['notes' => $args['notes'] ?? null]);
    }

    protected function rejectEoiReservation(array $args): array
    {
        if (empty(trim($args['notes'] ?? ''))) {
            return ['error' => 'A rejection reason (notes) is required. Please ask the user for the reason.'];
        }
        $res = $this->resolveEoi($args['eoi_query'] ?? '');
        if (!($res instanceof EoiReservation)) {
            return $res;
        }
        return $this->callEoiController('reject', $res->id, ['notes' => $args['notes']]);
    }

    protected function inviteEoiClients(array $args): array
    {
        $project = Project::where('name', 'LIKE', '%' . ($args['project_name'] ?? '') . '%')->first();
        if (!$project) {
            return ['error' => "No project found matching '" . ($args['project_name'] ?? '') . "'."];
        }

        return $this->callEoiController('inviteBatch', null, [
            'project_id' => $project->id,
            'count' => (int) ($args['count'] ?? 1),
            'contracting_deadline_hours' => (int) ($args['contracting_deadline_hours'] ?? 48),
        ]);
    }

    protected function resendEoiInvitation(array $args): array
    {
        $res = $this->resolveEoi($args['eoi_query'] ?? '');
        if (!($res instanceof EoiReservation)) {
            return $res;
        }
        return $this->callEoiController('resendInvitation', $res->id, []);
    }

    protected function approveEoiFivePercent(array $args): array
    {
        $res = $this->resolveEoi($args['eoi_query'] ?? '');
        if (!($res instanceof EoiReservation)) {
            return $res;
        }
        return $this->callEoiController('approveFivePercent', $res->id, []);
    }

    protected function rejectEoiFivePercent(array $args): array
    {
        if (empty(trim($args['notes'] ?? ''))) {
            return ['error' => 'A rejection reason (notes) is required.'];
        }
        $res = $this->resolveEoi($args['eoi_query'] ?? '');
        if (!($res instanceof EoiReservation)) {
            return $res;
        }
        return $this->callEoiController('rejectFivePercent', $res->id, ['notes' => $args['notes']]);
    }

    protected function getMyEoiStatus(): array
    {
        if (!$this->user) {
            return ['error' => 'Not authenticated.'];
        }

        $res = EoiReservation::where('client_email', $this->user->email)
            ->orWhere('client_phone', $this->user->phone)
            ->latest()
            ->first();

        if (!$res) {
            return ['found' => false, 'message' => 'No EOI reservation is linked to your account.'];
        }

        return [
            'found' => true,
            'order_number' => $res->order_number,
            'status' => $res->status,
            'queue_number' => $res->queue_number,
            'invited' => (bool) $res->invited_at,
            'contracting_deadline_hours' => $res->contracting_deadline_hours,
            'payment_amount_egp' => (float) $res->payment_amount,
            'five_percent_status' => $res->five_percent_status,
        ];
    }

    protected function batchApproveEoi(array $args): array
    {
        $q = EoiReservation::where('status', EoiReservation::STATUS_PENDING_REVIEW);

        $scope = 'all projects';
        if (!empty($args['project_name'])) {
            $project = Project::where('name', 'LIKE', '%' . $args['project_name'] . '%')->first();
            if (!$project) {
                return ['error' => "No project found matching '{$args['project_name']}'."];
            }
            $scope = $project->name;
            $q->where('project_id', $project->id);
        }

        $ids = $q->pluck('id')->all();
        if (empty($ids)) {
            return ['success' => false, 'message' => "There are no pending-review EOI reservations to approve ({$scope})."];
        }

        $result = $this->callEoiController('batchApprove', null, ['ids' => $ids, 'notes' => $args['notes'] ?? null]);
        $result['approved_count'] = count($ids);
        $result['scope'] = $scope;
        return $result;
    }

    protected function createEoiReservation(array $args): array
    {
        $lead = $this->resolveLead($args['lead_query'] ?? '');
        if (!$lead) {
            return ['error' => "No lead found matching '" . ($args['lead_query'] ?? '') . "'. Create the lead first with create_lead."];
        }

        $project = Project::where('name', 'LIKE', '%' . ($args['project_name'] ?? '') . '%')->first();
        if (!$project) {
            return ['error' => "No project found matching '" . ($args['project_name'] ?? '') . "'."];
        }

        $location = $args['client_location'] ?? '';
        $method = $args['payment_method'] ?? '';
        if (!EoiReservation::isValidPaymentMethod($location, $method)) {
            return ['error' => "Payment method '{$method}' is not valid for location '{$location}'. Inside Egypt: cash, bank_transfer, cheque, instapay. Outside Egypt: international_bank_transfer."];
        }

        // One EOI per lead per project (enforced by a DB unique constraint on
        // lead_id + project_id), regardless of status.
        $existing = EoiReservation::where('lead_id', $lead->id)
            ->where('project_id', $project->id)
            ->first();
        if ($existing) {
            return ['error' => "This lead already has an EOI reservation for {$project->name} (status: {$existing->status}). Only one EOI per lead per project is allowed."];
        }

        // client_email is NOT NULL; synthesise one from the phone if absent
        // (mirrors how the app handles receipt-less/email-less clients).
        $phone = $args['client_phone'] ?? $lead->phone;
        $email = $args['client_email'] ?? $lead->email;
        if (empty($email)) {
            $digits = preg_replace('/[^0-9]/', '', (string) $phone);
            $email = ($digits ?: (string) Str::random(10)) . '@redp-client.com';
        }

        $eoi = EoiReservation::create([
            'id' => (string) Str::uuid(),
            'lead_id' => $lead->id,
            'project_id' => $project->id,
            'client_name' => $args['client_name'] ?? trim($lead->first_name . ' ' . $lead->last_name),
            'client_email' => $email,
            'client_phone' => $phone,
            'client_location' => $location,
            'payment_method' => $method,
            'payment_amount' => (float) ($args['payment_amount'] ?? 0),
            // A text assistant cannot upload the receipt file; store a placeholder
            // so the draft is created, and flag that the real receipt is required.
            'receipt_path' => 'pending_upload',
            'status' => EoiReservation::STATUS_PENDING_REVIEW,
        ]);

        return [
            'success' => true,
            'eoi_id' => $eoi->id,
            'client_name' => $eoi->client_name,
            'receipt' => 'MISSING — placeholder only',
            'message' => 'EOI reservation draft created for ' . $eoi->client_name . ' and is pending review. IMPORTANT: no payment receipt is attached yet — the actual receipt file must be uploaded from the EOI Reservations page before this EOI should be approved. Tell the user this clearly.',
        ];
    }

    protected function getEoiQueueSettings(): array
    {
        $keys = [
            'eoi_queue_mode' => 'normal',
            'eoi_queue_weight_past_client' => '100',
            'eoi_queue_weight_cash' => '50',
            'eoi_queue_weight_vip' => '150',
            'eoi_queue_nationality_priority' => 'none',
            'eoi_queue_weight_nationality' => '40',
        ];

        $values = SystemConfig::whereIn('key', array_keys($keys))->pluck('value', 'key');

        return [
            'mode' => $values['eoi_queue_mode'] ?? $keys['eoi_queue_mode'],
            'weight_past_client' => (int) ($values['eoi_queue_weight_past_client'] ?? $keys['eoi_queue_weight_past_client']),
            'weight_cash' => (int) ($values['eoi_queue_weight_cash'] ?? $keys['eoi_queue_weight_cash']),
            'weight_vip' => (int) ($values['eoi_queue_weight_vip'] ?? $keys['eoi_queue_weight_vip']),
            'nationality_priority' => $values['eoi_queue_nationality_priority'] ?? $keys['eoi_queue_nationality_priority'],
            'weight_nationality' => (int) ($values['eoi_queue_weight_nationality'] ?? $keys['eoi_queue_weight_nationality']),
        ];
    }

    protected function updateEoiQueueSettings(array $args): array
    {
        $map = [
            'mode' => 'eoi_queue_mode',
            'weight_past_client' => 'eoi_queue_weight_past_client',
            'weight_cash' => 'eoi_queue_weight_cash',
            'weight_vip' => 'eoi_queue_weight_vip',
            'nationality_priority' => 'eoi_queue_nationality_priority',
            'weight_nationality' => 'eoi_queue_weight_nationality',
        ];

        $configs = [];
        foreach ($map as $arg => $key) {
            if (array_key_exists($arg, $args) && $args[$arg] !== null && $args[$arg] !== '') {
                $configs[$key] = (string) $args[$arg];
            }
        }

        if (empty($configs)) {
            return ['error' => 'No settings provided to update.'];
        }

        // Reuse AdminController::updateConfigs so queues are recalculated for all projects.
        $sub = HttpRequest::create('/', 'POST', ['configs' => $configs]);
        $sub->setUserResolver(fn () => $this->user);
        try {
            $response = app(AdminController::class)->updateConfigs($sub);
            $data = $response->getData(true);
            return [
                'success' => $data['success'] ?? true,
                'message' => 'Queue settings updated and all project queues recalculated.',
                'updated' => array_keys($configs),
            ];
        } catch (\Throwable $e) {
            return ['error' => 'Failed to update queue settings: ' . $e->getMessage()];
        }
    }

    /**
     * Resolve an EOI reservation from a natural reference (order number, name,
     * email, phone or id). Returns the model, or an error/ambiguity array the
     * caller passes straight back to the model.
     */
    protected function resolveEoi(string $query): EoiReservation|array
    {
        $query = trim($query);
        if ($query === '') {
            return ['error' => 'Please specify which EOI reservation (order number, client name, email or phone).'];
        }

        $exact = EoiReservation::where('order_number', $query)->orWhere('id', $query)->first();
        if ($exact) {
            return $exact;
        }

        $term = '%' . $query . '%';
        $matches = EoiReservation::where('order_number', 'LIKE', $term)
            ->orWhere('client_name', 'LIKE', $term)
            ->orWhere('client_email', 'LIKE', $term)
            ->orWhere('client_phone', 'LIKE', $term)
            ->limit(6)
            ->get();

        if ($matches->isEmpty()) {
            return ['error' => "No EOI reservation found matching '{$query}'."];
        }
        if ($matches->count() > 1) {
            return [
                'error' => 'Multiple EOI reservations match; ask the user which one (by order number).',
                'matches' => $matches->map(fn ($m) => [
                    'order_number' => $m->order_number,
                    'client_name' => $m->client_name,
                    'status' => $m->status,
                ])->all(),
            ];
        }

        return $matches->first();
    }

    /**
     * Invoke a real EoiReservationController action so all side effects
     * (order numbers, queue recalculation, emails, notifications, audit logs)
     * fire exactly as they do from the dashboard. Returns a compact result.
     */
    protected function callEoiController(string $method, ?string $id, array $params): array
    {
        $clean = array_filter($params, fn ($v) => $v !== null && $v !== '');
        $sub = HttpRequest::create('/', 'POST', $clean);
        $sub->setUserResolver(fn () => $this->user);

        try {
            $controller = app(EoiReservationController::class);
            $response = $id !== null
                ? $controller->{$method}($sub, $id)
                : $controller->{$method}($sub);

            $data = $response->getData(true);
            $out = [
                'success' => $data['success'] ?? ($response->getStatusCode() < 400),
                'message' => $data['message'] ?? null,
            ];
            foreach (['order_number', 'queue_number', 'data'] as $k) {
                if (isset($data[$k]) && !is_array($data[$k])) {
                    $out[$k] = $data[$k];
                }
            }
            return $out;
        } catch (\Illuminate\Validation\ValidationException $e) {
            return ['success' => false, 'error' => 'Validation failed', 'details' => $e->errors()];
        }
    }

    // ── Helpers ────────────────────────────────────────────────────────

    protected function financialsForUser(User $user): array
    {
        $contracts = Contract::where('client_id', $user->id)->with('unit')->get();

        $total = (float) $contracts->sum('total_amount');
        $paid = (float) $contracts->sum('paid_amount');

        $contractIds = $contracts->pluck('id')->all();
        $nextDue = null;
        if (!empty($contractIds)) {
            $due = Payment::whereIn('contract_id', $contractIds)
                ->whereIn('status', ['upcoming', 'overdue', 'partial'])
                ->orderBy('due_date')
                ->first(['amount', 'due_date', 'status', 'installment_number']);
            if ($due) {
                $nextDue = [
                    'amount_egp' => (float) $due->amount,
                    'due_date' => $due->due_date,
                    'status' => $due->status,
                    'installment_number' => $due->installment_number,
                ];
            }
        }

        return [
            'client' => $user->name,
            'contracts' => $contracts->map(fn ($c) => [
                'contract_number' => $c->contract_number,
                'unit' => $c->unit->unit_number ?? null,
                'total_egp' => (float) $c->total_amount,
                'paid_egp' => (float) $c->paid_amount,
                'status' => $c->status,
            ])->all(),
            'total_egp' => $total,
            'paid_egp' => $paid,
            'outstanding_egp' => round(max(0, $total - $paid), 2),
            'next_due' => $nextDue,
        ];
    }

    protected function resolveLead(string $query): ?Lead
    {
        $query = trim($query);
        if ($query === '') {
            return null;
        }

        $lead = Lead::where('id', $query)->first();
        if ($lead) {
            return $lead;
        }

        $term = '%' . $query . '%';
        $words = preg_split('/\s+/', trim($query)) ?: [];

        return Lead::where('phone', 'LIKE', $term)
            ->orWhere('email', 'LIKE', $term)
            ->orWhere('first_name', 'LIKE', $term)
            ->orWhere('last_name', 'LIKE', $term)
            // Handle a full "First Last" string matching the split name columns.
            ->when(count($words) >= 2, function ($q) use ($words) {
                $q->orWhere(function ($sub) use ($words) {
                    $sub->where('first_name', 'LIKE', '%' . $words[0] . '%')
                        ->where('last_name', 'LIKE', '%' . end($words) . '%');
                });
            })
            ->first();
    }

    protected function resolveUser(string $query): ?User
    {
        $query = trim($query);
        if ($query === '') {
            return null;
        }

        $term = '%' . $query . '%';
        return User::where('email', 'LIKE', $term)
            ->orWhere('phone', 'LIKE', $term)
            ->orWhere('name', 'LIKE', $term)
            ->first();
    }
}
