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
                    // e.g., Mail::to($recipient)->send(new REDPNotification($title, $content));
                    break;
                case 'sms':
                    // e.g., TwilioClient::send($recipient, $content);
                    break;
                case 'whatsapp':
                    // e.g., WhatsAppCloudAPI::sendMessage($recipient, $content);
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
}
