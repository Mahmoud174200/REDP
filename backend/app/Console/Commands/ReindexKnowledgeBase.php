<?php

namespace App\Console\Commands;

use App\Models\Document;
use App\Models\KnowledgeChunk;
use App\Services\Ai\KnowledgeBaseService;
use Illuminate\Console\Command;

/**
 * Ingest company knowledge into the RAG knowledge base.
 *   php artisan knowledge:reindex          # (re)index the DMS `documents` table
 *   php artisan knowledge:reindex --seed   # + seed starter policies/SOPs/FAQs if missing
 *   php artisan knowledge:reindex --fresh  # wipe the knowledge base first
 */
class ReindexKnowledgeBase extends Command
{
    protected $signature = 'knowledge:reindex {--seed : Seed starter policies/SOPs/FAQs} {--fresh : Wipe existing chunks first}';
    protected $description = 'Index documents (and optional starter knowledge) into the RAG knowledge base';

    public function handle(KnowledgeBaseService $kb): int
    {
        if (!$kb->isConfigured()) {
            $this->error('GEMINI_API_KEY is not set — cannot create embeddings.');
            return self::FAILURE;
        }

        if ($this->option('fresh')) {
            KnowledgeChunk::query()->delete();
            $this->warn('Wiped existing knowledge chunks.');
        }

        if ($this->option('seed')) {
            $this->seedStarterKnowledge($kb);
        }

        $docs = Document::query()->get();
        $this->info("Indexing {$docs->count()} document(s) from the DMS…");
        $total = 0;
        foreach ($docs as $doc) {
            $n = $kb->indexDocument($doc);
            $total += $n;
            if ($n > 0) {
                $this->line("  • {$doc->title}: {$n} chunk(s)");
            }
        }

        $this->newLine();
        $this->info("Done. Knowledge base now holds {$kb->count()} chunk(s).");
        return self::SUCCESS;
    }

    protected function seedStarterKnowledge(KnowledgeBaseService $kb): void
    {
        $this->info('Seeding starter knowledge…');
        foreach ($this->starterKnowledge() as $item) {
            // Skip if a manual/policy entry with this title already exists.
            if (KnowledgeChunk::where('title', $item['title'])->exists()) {
                $this->line("  • {$item['title']}: already present, skipped");
                continue;
            }
            $n = $kb->indexContent($item);
            $this->line("  • {$item['title']}: {$n} chunk(s)");
        }
    }

    /** REDP-specific starter policies, SOPs and FAQs (consistent with the app). */
    protected function starterKnowledge(): array
    {
        return [
            [
                'source_type' => 'policy',
                'title' => 'EOI Reservation Policy',
                'source_ref' => 'EOI Reservation Policy',
                'content' => <<<TXT
Expression of Interest (EOI) Reservation Policy.

An EOI is how a client formally registers interest in a unit before contracting. The lifecycle is:
1. Submission: the client (or a sales agent on their behalf) submits an EOI with their details and a payment receipt for the EOI amount. The reservation starts in "pending review".
2. Accountant review: an accountant or admin verifies the payment receipt and either approves or rejects the EOI. Approval generates a unique order number (format EOI-YYYY-NNNNNN) and assigns the client a position in the project's booking queue.
3. Invitation: approved clients are invited in queue order to choose their unit. Each invitation includes a temporary login and a contracting deadline (in hours), which defaults to 48 hours.
4. Five percent down payment: after selecting a unit, the client uploads a receipt for the 5% down payment. An accountant or finance officer approves or rejects it. Approval confirms the unit hold and extends it so the client can sign the final contract.

Only one EOI is allowed per client per project. A rejected EOI still blocks a new submission for the same project. Rejections always include a written reason that is emailed to the client.
TXT,
            ],
            [
                'source_type' => 'policy',
                'title' => 'Payment Methods Policy',
                'source_ref' => 'Payment Methods Policy',
                'content' => <<<TXT
Accepted Payment Methods Policy.

Accepted payment methods depend on the client's location:
- Clients inside Egypt may pay by Cash, Bank Transfer, Cheque, or InstaPay.
- Clients outside Egypt may pay only by International Bank Transfer.

A payment method that does not match the client's declared location will be rejected by the system. All EOI and down-payment receipts must be uploaded as an image or PDF (maximum 10 MB) and are manually verified by the accounting team before approval.
TXT,
            ],
            [
                'source_type' => 'policy',
                'title' => 'Cancellation and Refund Policy',
                'source_ref' => 'Cancellation and Refund Policy',
                'content' => <<<TXT
Cancellation and Refund Policy.

A client may request cancellation of a reservation or contract before final handover. Cancellations are processed by the finance team and pass through a settlement audit.

Refund guidelines:
- If cancellation occurs before contract signing, the EOI amount is refundable minus an administrative fee.
- After contract signing, refunds are subject to the penalty schedule in the signed contract; the 5% down payment is generally non-refundable once the contract is active.
- Refunds are paid to the original payer using the original payment method and may take up to 30 business days.

Unit holds are automatically released back to available inventory when a reservation expires or a cancellation is settled.
TXT,
            ],
            [
                'source_type' => 'policy',
                'title' => 'Broker Commission Policy',
                'source_ref' => 'Broker Commission Policy',
                'content' => <<<TXT
Broker Commission Policy.

Registered brokers earn commission on units sold to leads they introduced and that remain attributed to them (anti-poaching lock). Commission becomes payable only after the client's payment milestones are met and the contract is active.

Brokers submit payout requests from the broker portal. A company sales representative reviews and approves or rejects each payout request. Commission status advances automatically as the client's installments are received. Brokers may not see other brokers' leads, presentations, or payout data.
TXT,
            ],
            [
                'source_type' => 'sop',
                'title' => 'Unit Handover SOP',
                'source_ref' => 'Unit Handover SOP',
                'content' => <<<TXT
Standard Operating Procedure: Unit Handover.

1. Eligibility: handover is scheduled after the contract is active and construction milestones for the unit are complete.
2. Inspection (snagging): a delivery engineer or handover officer inspects the unit against the handover checklist, photographs any defects (snags), pins them to the unit blueprint, and logs severity.
3. Resolution: snags are dispatched to vendors/contractors and tracked to closure with SLA timers.
4. Sign-off: once snags are resolved and the checklist passes, the client and officer sign off. A handover report PDF is generated and stored in the document vault.
5. Post-handover: the unit moves to the homeowner portal, where the owner can file maintenance requests, add family members and vehicles, and request compound gate codes.
TXT,
            ],
            [
                'source_type' => 'policy',
                'title' => 'KYC and Identity Verification Policy',
                'source_ref' => 'KYC and Identity Verification Policy',
                'content' => <<<TXT
KYC and Identity Verification Policy.

Every lead must complete Know-Your-Customer (KYC) verification before contracting. Required documents are a national ID (front and back) for Egyptian clients, or a passport for foreign clients, plus a selfie for facial-liveness matching.

Verification produces a facial match confidence score. A score at or above the minimum threshold (85%) is auto-approved; anything below is queued for manual review by an agent. KYC documents are stored securely and are only accessible to authorized staff.
TXT,
            ],
            [
                'source_type' => 'faq',
                'title' => 'FAQ: EOI and Contracting Timeline',
                'source_ref' => 'FAQ: EOI and Contracting Timeline',
                'content' => <<<TXT
Frequently Asked Questions — EOI and Contracting.

Q: How long do I have to sign my contract after I'm invited to choose a unit?
A: You have the contracting deadline stated in your invitation, which defaults to 48 hours. Your unit hold may be released if you miss it.

Q: What is the 5% down payment?
A: After you choose your unit, you pay 5% of the unit price as a down payment and upload the receipt. Once finance approves it, your reservation is confirmed and you can proceed to sign the final contract.

Q: How is my place in the queue decided?
A: In normal mode the queue is first-in first-out by approval time. In smart mode, priority weights can move past clients, cash payers, VIPs, or a chosen nationality higher in the queue.

Q: Can I have two EOIs for the same project?
A: No. Only one EOI per client per project is allowed.
TXT,
            ],
        ];
    }
}
