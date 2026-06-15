<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Appointment;
use App\Models\User;
use App\Services\NotificationService;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class SendAppointmentReminders extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'appointments:send-reminders';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Scan upcoming appointments and send Email, SMS, or WhatsApp reminders 48 hours before the schedule.';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info("Scanning appointments for 48-hour reminders...");

        // Fetch appointments that are pending/confirmed, scheduled in the next 48 hours, and have unsent reminders
        $upcomingAppointments = Appointment::whereIn('status', ['pending', 'confirmed'])
            ->where('scheduled_at', '<=', now()->addHours(48))
            ->where('scheduled_at', '>', now())
            ->where(function ($query) {
                $query->where(function ($q) {
                    $q->where('remind_email', true)->where('email_sent', false);
                })->orWhere(function ($q) {
                    $q->where('remind_sms', true)->where('sms_sent', false);
                })->orWhere(function ($q) {
                    $q->where('remind_whatsapp', true)->where('whatsapp_sent', false);
                });
            })
            ->get();

        $this->info("Found " . $upcomingAppointments->count() . " upcoming appointments requiring reminders.");

        foreach ($upcomingAppointments as $appointment) {
            // Resolve recipient info
            $name = '';
            $email = '';
            $phone = '';
            $recipientUser = null;

            if ($appointment->user_id) {
                $recipientUser = User::find($appointment->user_id);
                if ($recipientUser) {
                    $name = $recipientUser->name;
                    $email = $recipientUser->email;
                    $phone = $recipientUser->phone;
                }
            } else if ($appointment->lead_id) {
                $lead = $appointment->lead;
                if ($lead) {
                    $name = $lead->full_name;
                    $email = $lead->email;
                    $phone = $lead->phone;

                    // Check if lead already has a corresponding User account
                    if ($email) {
                        $recipientUser = User::where('email', $email)->first();
                    }
                    if (!$recipientUser && $phone) {
                        $recipientUser = User::where('phone', $phone)->first();
                    }
                }
            }

            // Fallback user ID to satisfy notifications table foreign key constraint
            $logUserId = $recipientUser ? $recipientUser->id : (User::where('role', 'admin')->first()?->id ?? User::first()?->id);

            if (!$logUserId) {
                $this->error("No valid user found to associate with the notification log. Skipping appointment ID: {$appointment->id}");
                continue;
            }

            $bookingTypeStr = $appointment->booking_type === 'in_company' ? 'In Company (HQ Office)' : 'Online';
            $appointmentType = $appointment->type ?: 'Consultation';
            $dateFormatted = Carbon::parse($appointment->booking_date)->format('Y-m-d');
            $timeFormatted = $appointment->booking_time;

            // 1. Email Reminder (Required if set)
            if ($appointment->remind_email && !$appointment->email_sent && $email) {
                $title = "📅 REDP Appointment Reminder: {$appointmentType}";
                $content = "Dear {$name},\n\nThis is a reminder that your scheduled {$appointmentType} appointment is in 48 hours on {$dateFormatted} at {$timeFormatted}.\n\nBooking Mode: {$bookingTypeStr}\n\nWe look forward to meeting with you!\n\nBest regards,\nREDP Real Estate Team";

                $this->info("Sending Email Reminder to {$email}");
                NotificationService::send($logUserId, 'email', $email, $title, $content);
                $appointment->email_sent = true;
            }

            // 2. SMS Notification (Optional)
            if ($appointment->remind_sms && !$appointment->sms_sent && $phone) {
                $title = "REDP Booking Alert";
                $content = "Reminder: Your REDP {$appointmentType} appointment is on {$dateFormatted} at {$timeFormatted} ({$bookingTypeStr}).";

                $this->info("Sending SMS Notification to {$phone}");
                NotificationService::send($logUserId, 'sms', $phone, $title, $content);
                $appointment->sms_sent = true;
            }

            // 3. WhatsApp Notification (Optional)
            if ($appointment->remind_whatsapp && !$appointment->whatsapp_sent && $phone) {
                $title = "WhatsApp Booking Alert";
                $content = "WhatsApp Reminder: Dear {$name}, your {$appointmentType} meeting is scheduled for {$dateFormatted} at {$timeFormatted} via {$bookingTypeStr}. Please reply to confirm.";

                $this->info("Sending WhatsApp Notification to {$phone}");
                NotificationService::send($logUserId, 'whatsapp', $phone, $title, $content);
                $appointment->whatsapp_sent = true;
            }

            // Save the updated flags
            $appointment->save();
        }

        $this->info("Scanning and sending finished.");
    }
}
