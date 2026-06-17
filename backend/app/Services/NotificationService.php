<?php

namespace App\Services;

use App\Models\Notification;
use Illuminate\Support\Str;

class NotificationService
{
    /**
     * Dispatch a multi-channel alert.
     */
    public static function send(string $userId, string $channel, string $recipient, string $title, string $content): Notification
    {
        // 1. Record notification log entry
        $notification = Notification::create([
            'id' => (string) Str::uuid(),
            'user_id' => $userId,
            'channel' => $channel, // 'email', 'sms', 'whatsapp', 'push'
            'recipient' => $recipient,
            'title' => $title,
            'content' => $content,
            'status' => 'pending',
        ]);

        // 2. Dispatching placeholder logic
        try {
            switch ($channel) {
                case 'email':
                    \Illuminate\Support\Facades\Mail::html($content, function ($message) use ($recipient, $title) {
                        $message->to($recipient)
                                ->subject($title);
                    });
                    break;
                case 'sms':
                    // e.g., TwilioClient::send($recipient, $content);
                    // Simulate Twilio API dispatch logging
                    \Illuminate\Support\Facades\Log::info("SMS Mock Gateway dispatch to: {$recipient} content: {$content}");
                    break;
                case 'whatsapp':
                    // e.g., WhatsAppCloudAPI::sendMessage($recipient, $content);
                    // Simulate WhatsApp Cloud API dispatch logging
                    \Illuminate\Support\Facades\Log::info("WhatsApp Mock Gateway dispatch to: {$recipient} content: {$content}");
                    break;
                case 'push':
                    // e.g., FirebaseCloudMessaging::sendToDevice($recipient, $title, $content);
                    break;
            }
            
            $notification->update(['status' => 'sent']);
        } catch (\Throwable $e) {
            $notification->update(['status' => 'failed']);
            // Log local error
            \Illuminate\Support\Facades\Log::error("Notification failed: " . $e->getMessage());
        }

        return $notification;
    }

    /**
     * Send structured template-based notification.
     */
    public static function sendTemplate(string $userId, string $channel, string $recipient, string $templateType, array $data): Notification
    {
        $title = '';
        $content = '';

        switch ($templateType) {
            case 'upcoming_installment':
                $title = 'REDP Installment Alert / تنبيه قسط قادم';
                $content = sprintf(
                    "Dear Client, your upcoming installment of %s is due on %s for Unit %s. Kindly process the payment. / عزيزي العميل، قسطك القادم بقيمة %s مستحق بتاريخ %s للوحدة %s. يرجى السداد.",
                    $data['amount'] ?? '—',
                    $data['due_date'] ?? '—',
                    $data['unit_number'] ?? '—',
                    $data['amount'] ?? '—',
                    $data['due_date'] ?? '—',
                    $data['unit_number'] ?? '—'
                );
                break;
            case 'overdue_installment':
                $title = '⚠️ REDP Overdue Warning / إنذار تأخير سداد';
                $content = sprintf(
                    "Warning: Installment of %s is overdue since %s for Unit %s. Late penalty of %s%% applies. / تحذير: القسط بقيمة %s متأخر منذ %s للوحدة %s. تطبق غرامة تأخير بقيمة %s%%.",
                    $data['amount'] ?? '—',
                    $data['due_date'] ?? '—',
                    $data['unit_number'] ?? '—',
                    $data['penalty_rate'] ?? '1',
                    $data['amount'] ?? '—',
                    $data['due_date'] ?? '—',
                    $data['unit_number'] ?? '—',
                    $data['penalty_rate'] ?? '1'
                );
                break;
            case 'workflow_approval':
                $title = '✍️ Approval Request / طلب موافقة';
                $content = sprintf(
                    "Approval requested: Action %s is pending your review. / مطلوب موافقة: الإجراء %s قيد المراجعة.",
                    $data['action'] ?? '—',
                    $data['action'] ?? '—'
                );
                break;
            case 'contracting_signed':
                $title = '🎉 Contract Signed / تم توقيع العقد';
                $content = sprintf(
                    "Congratulations! Contract %s for Unit %s has been signed and is active. / تهانينا! تم توقيع العقد %s للوحدة %s وأصبح سارياً.",
                    $data['contract_number'] ?? '—',
                    $data['unit_number'] ?? '—',
                    $data['contract_number'] ?? '—',
                    $data['unit_number'] ?? '—'
                );
                break;
            case 'handover_completed':
                $title = '🔑 Unit Handover Signed Off / تم تسليم الوحدة';
                $content = sprintf(
                    "Welcome! Unit %s has been successfully handed over and signed off. / مرحباً بك! تم تسليم الوحدة %s وتوقيع محضر الاستلام بنجاح.",
                    $data['unit_number'] ?? '—',
                    $data['unit_number'] ?? '—'
                );
                break;
            case 'project_broadcast':
                $title = sprintf("REDP Project Update: %s / تحديث المشروع", $data['project_name'] ?? 'REDP');
                $content = $data['message'] ?? '—';
                break;
            default:
                $title = $data['title'] ?? 'REDP System Notification';
                $content = $data['content'] ?? '—';
                break;
        }

        return static::send($userId, $channel, $recipient, $title, $content);
    }
}
