<?php

namespace App\Services;

use App\Models\Appointment;
use App\Models\Contract;
use Carbon\Carbon;
use Illuminate\Support\Facades\Storage;

/**
 * Builds a real, self-contained handover timeline document (styled HTML that
 * opens directly in the browser / can be printed to PDF) and stores it on the
 * public disk so the homeowner can open it from their portal Vault.
 *
 * Returns the web-servable file path (/storage/...) for Document::file_path.
 */
class HandoverTimelineService
{
    /**
     * Write the timeline to the public disk and return its /storage path.
     * Kept for backward compatibility; the live route (buildHtml) is preferred
     * because it always reflects current DB state with no caching.
     */
    public static function generate(Contract $contract): string
    {
        $html = self::buildHtml($contract);
        $path = 'handover_timelines/' . $contract->id . '.html';
        Storage::disk('public')->put($path, $html);

        return '/storage/' . $path;
    }

    /**
     * Build the handover-timeline HTML live from the contract's current state.
     */
    public static function buildHtml(Contract $contract): string
    {
        $contract->loadMissing(['unit.project', 'client', 'payments']);

        $unit     = $contract->unit;
        $project  = $unit?->project;
        $client   = $contract->client;
        $signed   = $contract->signed_at ? Carbon::parse($contract->signed_at) : Carbon::now();

        // ── Real data anchors (no fabricated offsets) ──
        $payments = $contract->payments->sortBy('due_date')->values();
        $isPaid   = fn($p) => $p->paid_at !== null || (float) $p->paid_amount >= (float) $p->amount;
        $paidCount  = $payments->filter($isPaid)->count();
        $totalCount = $payments->count();
        $allPaid    = $totalCount > 0 && $paidCount >= $totalCount;
        $firstPay   = $payments->first();
        $lastPay    = $payments->last();

        // Real QC inspection appointment booked for this owner (if any).
        $qc = $client
            ? Appointment::where('user_id', $client->id)
                ->where('type', 'QC_Inspection')
                ->orderBy('scheduled_at')
                ->first()
            : null;

        // Handover date: unit's own date, else project delivery date (both real).
        $handover = $unit?->handover_date
            ? Carbon::parse($unit->handover_date)
            : ($project?->delivery_date ? Carbon::parse($project->delivery_date) : null);
        $delivery = $handover ?? ($lastPay ? Carbon::parse($lastPay->due_date) : $signed->copy()->addYears(2));

        // Handover completion is tracked by handover_status (set when the officer
        // signs off), NOT unit.status which flips to "sold" at contract signing.
        $unitDelivered = ($unit?->handover_status ?? null) === 'signed_off'
            || in_array($unit?->status, ['delivered', 'handed_over']);

        // Build milestones strictly from records that exist for this owner.
        $milestones = [];

        // 'seq' = logical handover-process order (used for display order so the
        // narrative reads correctly regardless of the raw stored dates).
        $milestones[] = ['seq' => 1, 't' => $signed->copy(), 'title' => 'Contract Signed / توقيع العقد',
            'desc' => 'Sale contract executed and registered in the system.', 'icon' => '📝', 'done' => true];

        if ($firstPay) {
            $milestones[] = ['seq' => 2, 't' => Carbon::parse($firstPay->due_date),
                'title' => 'Payment Plan Active / بدء خطة السداد',
                'desc' => "Installment schedule of {$totalCount} payment(s) activated — {$paidCount} settled so far.",
                'icon' => '💳', 'done' => $isPaid($firstPay)];
        }

        if ($qc) {
            $qcAt = Carbon::parse($qc->scheduled_at);
            // QC is satisfied once the unit is handed over (sign-off implies the
            // quality inspection passed) — or if the appointment is marked complete.
            $qcDone = $unitDelivered || $qc->status === 'completed';
            $milestones[] = ['seq' => 3, 't' => $qcAt,
                'title' => 'QC Inspection / فحص الجودة',
                'desc' => $qcDone
                    ? 'Quality inspection passed and confirmed with the unit handover.'
                    : 'Quality-control snag inspection scheduled for your unit.',
                'icon' => '🔍', 'done' => $qcDone];
        }

        $milestones[] = ['seq' => 4, 't' => $delivery->copy(), 'title' => 'Key Handover / تسليم المفتاح',
            'desc' => 'Keys handed over and unit officially delivered to the owner.',
            'icon' => '🔑', 'done' => $unitDelivered];

        if ($lastPay) {
            $milestones[] = ['seq' => 5, 't' => Carbon::parse($lastPay->due_date),
                'title' => 'Final Installment Due / استحقاق آخر قسط',
                'desc' => 'Last scheduled installment — full settlement of the unit price.',
                'icon' => '🧾', 'done' => $allPaid];
        }

        // Order by the logical handover sequence, not raw dates.
        usort($milestones, fn($a, $b) => $a['seq'] <=> $b['seq']);

        $rows = '';
        foreach ($milestones as $m) {
            $dotColor = $m['done'] ? '#10b981' : '#cbd5e1';
            $textMuted = $m['done'] ? '#0f172a' : '#64748b';
            $badge = $m['done']
                ? '<span style="background:#dcfce7;color:#16a34a;font-size:11px;font-weight:700;padding:2px 10px;border-radius:20px;">DONE / تم</span>'
                : '<span style="background:#f1f5f9;color:#64748b;font-size:11px;font-weight:700;padding:2px 10px;border-radius:20px;">UPCOMING / قادم</span>';
            $rows .= '
            <div style="display:flex;gap:18px;align-items:flex-start;position:relative;padding-bottom:26px;">
                <div style="flex-shrink:0;width:44px;height:44px;border-radius:50%;background:' . ($m['done'] ? '#ecfdf5' : '#f8fafc') . ';border:3px solid ' . $dotColor . ';display:flex;align-items:center;justify-content:center;font-size:20px;z-index:2;">' . $m['icon'] . '</div>
                <div style="flex:1;">
                    <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;">
                        <h3 style="margin:0;font-size:16px;color:' . $textMuted . ';font-weight:800;">' . $m['title'] . '</h3>
                        ' . $badge . '
                    </div>
                    <div style="font-size:13px;color:#2563eb;font-weight:700;margin:4px 0;">' . $m['t']->format('l, j F Y') . '</div>
                    <p style="margin:0;font-size:13px;color:#64748b;line-height:1.5;">' . $m['desc'] . '</p>
                </div>
            </div>';
        }

        $unitNo   = e($unit?->unit_number ?? '—');
        $projName = e($project?->name ?? 'N/A');
        $clientNm = e($client?->name ?? 'Valued Owner');
        $cn       = e($contract->contract_number);
        $total    = number_format((float) $contract->total_amount, 0);

        // When the unit is both handed over AND fully paid, everything is settled.
        $fullyComplete = $unitDelivered && $allPaid;
        $completionBanner = $fullyComplete
            ? '<div style="margin:0 40px 4px;padding:18px 22px;background:linear-gradient(135deg,#ecfdf5,#d1fae5);border:1px solid #6ee7b7;border-radius:14px;display:flex;align-items:center;gap:14px;">
                 <div style="font-size:30px;">✅</div>
                 <div>
                   <div style="font-size:15px;font-weight:800;color:#047857;">Everything Complete / كل شيء مكتمل</div>
                   <div style="font-size:12.5px;color:#059669;margin-top:2px;">Unit handed over and full price settled — your apartment is all set. تم تسليم الوحدة وسداد كامل الثمن — شقتك جاهزة بالكامل.</div>
                 </div>
               </div>'
            : '';

        $html = <<<HTML
<!DOCTYPE html>
<html lang="en" dir="ltr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Handover Timeline — {$cn}</title>
<style>
  @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } .noprint { display:none; } }
  body { font-family: 'Segoe UI', Tahoma, Arial, sans-serif; background:#f1f5f9; margin:0; padding:30px; color:#0f172a; }
  .sheet { max-width:780px; margin:0 auto; background:#fff; border-radius:18px; overflow:hidden; box-shadow:0 12px 40px rgba(0,0,0,0.08); }
  .hd { background:linear-gradient(135deg,#10b981,#059669); color:#fff; padding:34px 40px; }
  .hd h1 { margin:0 0 6px; font-size:26px; font-weight:800; }
  .hd p { margin:0; opacity:.92; font-size:14px; }
  .meta { display:grid; grid-template-columns:repeat(auto-fit,minmax(160px,1fr)); gap:18px; padding:26px 40px; background:#f8fafc; border-bottom:1px solid #e2e8f0; }
  .meta .lbl { font-size:11px; text-transform:uppercase; letter-spacing:.5px; color:#94a3b8; font-weight:700; }
  .meta .val { font-size:15px; font-weight:800; color:#0f172a; margin-top:3px; }
  .tl { padding:34px 40px 14px; position:relative; }
  .tl::before { content:''; position:absolute; left:61px; top:48px; bottom:48px; width:3px; background:#e2e8f0; z-index:1; }
  .ft { padding:20px 40px 30px; text-align:center; color:#94a3b8; font-size:12px; border-top:1px solid #e2e8f0; }
  .print-btn { display:inline-block; margin:0 auto 20px; background:#10b981; color:#fff; border:none; padding:10px 22px; border-radius:10px; font-weight:700; font-size:13px; cursor:pointer; }
</style>
</head>
<body>
  <div style="text-align:center;" class="noprint">
    <button class="print-btn" onclick="window.print()">🖨️ Print / Save as PDF</button>
  </div>
  <div class="sheet">
    <div class="hd">
      <h1>🔑 Handover Timeline</h1>
      <p>خطة تسليم الوحدة — REDP Real Estate Delivery Platform</p>
    </div>
    <div class="meta">
      <div><div class="lbl">Owner / المالك</div><div class="val">{$clientNm}</div></div>
      <div><div class="lbl">Unit / الوحدة</div><div class="val">{$unitNo}</div></div>
      <div><div class="lbl">Project / المشروع</div><div class="val">{$projName}</div></div>
      <div><div class="lbl">Contract / العقد</div><div class="val">{$cn}</div></div>
      <div><div class="lbl">Contract Value / قيمة العقد</div><div class="val">EGP {$total}</div></div>
      <div><div class="lbl">Target Handover / موعد التسليم</div><div class="val">{$delivery->format('j M Y')}</div></div>
    </div>
    {$completionBanner}
    <div class="tl">
      {$rows}
    </div>
    <div class="ft">
      Generated by REDP Platform · This timeline is indicative and milestones may shift with construction progress.<br>
      تم إنشاؤه آلياً بواسطة منصة REDP · المواعيد استرشادية وقد تتغير حسب تقدم الإنشاءات.
    </div>
  </div>
</body>
</html>
HTML;

        return $html;
    }
}
