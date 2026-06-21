<?php

namespace App\Services;

use App\Models\EoiReservation;

/**
 * ─────────────────────────────────────────────────────────
 * REDP — EOI Email Service
 * Handles email template generation and dispatch for
 * EOI reservation approval and rejection notifications.
 * ─────────────────────────────────────────────────────────
 */
class EoiEmailService
{
    /**
     * Send approval confirmation email to the client.
     */
    public static function sendApprovalEmail(EoiReservation $reservation): void
    {
        $paymentMethodLabels = [
            'cash'                       => 'Cash',
            'bank_transfer'              => 'Local Bank Transfer',
            'cheque'                     => 'Cheque',
            'international_bank_transfer' => 'International Bank Transfer',
            'instapay'                   => 'InstaPay Transfer',
        ];

        $paymentLabel = $paymentMethodLabels[$reservation->payment_method] ?? $reservation->payment_method;

        $content = self::buildApprovalEmailContent(
            $reservation->client_name,
            $reservation->order_number,
            $reservation->queue_number,
            $paymentLabel,
            number_format((float) $reservation->payment_amount, 2),
            $reservation->reviewed_at?->format('F j, Y \a\t g:i A') ?? now()->format('F j, Y \a\t g:i A')
        );

        NotificationService::send(
            $reservation->lead_id,
            'email',
            $reservation->client_email,
            "EOI Reservation Approved — Order #{$reservation->order_number}",
            $content
        );

        $reservation->update(['email_sent_at' => now()]);
    }

    /**
     * Send rejection notification email to the client.
     */
    public static function sendRejectionEmail(EoiReservation $reservation, string $reason): void
    {
        $content = self::buildRejectionEmailContent(
            $reservation->client_name,
            $reason,
            $reservation->reviewed_at?->format('F j, Y \a\t g:i A') ?? now()->format('F j, Y \a\t g:i A')
        );

        NotificationService::send(
            $reservation->lead_id,
            'email',
            $reservation->client_email,
            'EOI Reservation — Payment Review Update',
            $content
        );

        $reservation->update(['email_sent_at' => now()]);
    }

    /**
     * Send project invitation email with login credentials to the client.
     */
    public static function sendInvitationEmail(EoiReservation $reservation, string $password): void
    {
        $content = self::buildInvitationEmailContent(
            $reservation->client_name,
            $reservation->order_number,
            $reservation->queue_number,
            $reservation->client_email,
            $password,
            $reservation->project_id
        );

        NotificationService::send(
            $reservation->lead_id,
            'email',
            $reservation->client_email,
            "Mountain View — You're Invited to Select Your Unit!",
            $content
        );
    }

    /**
     * Send unit reservation confirmation and contract signature deadline (Email 3).
     */
    public static function sendUnitReservedEmail(\App\Models\Reservation $reservation, int $deadlineHours): void
    {
        $unit = $reservation->unit;
        $project = $unit ? $unit->project : null;
        $client = $reservation->client;
        $lead = \App\Models\Lead::where('email', $client?->email)->first();
        $leadId = $lead ? $lead->id : null;

        $content = self::buildUnitReservedEmailContent(
            $client ? $client->name : 'Valued Client',
            $unit ? $unit->unit_number : 'Selected Unit',
            $project ? $project->name : 'Mountain View Project',
            $deadlineHours,
            $reservation->expires_at?->format('F j, Y \a\t g:i A') ?? now()->addHours($deadlineHours)->format('F j, Y \a\t g:i A')
        );

        NotificationService::send(
            $leadId,
            'email',
            $client ? $client->email : $lead?->email,
            "Mountain View — Unit Reserved: {$unit->unit_number}",
            $content
        );
    }

    /**
     * Build HTML content for invitation email.
     */
    private static function buildInvitationEmailContent(
        string $clientName,
        string $orderNumber,
        int $queueNumber,
        string $email,
        string $password,
        string $projectId
    ): string {
        $loginUrl = "http://localhost:5173/client-login?project=" . $projectId;
        return <<<HTML
        <div style="font-family: 'Inter', Arial, sans-serif; background-color: #f4f6fc; padding: 40px 20px; text-align: center;">
            <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 30px rgba(0, 61, 166, 0.05); border: 1px solid rgba(0, 61, 166, 0.05); text-align: left;">
                
                <!-- Header / Logo Area -->
                <div style="background: linear-gradient(135deg, #001A70 0%, #003DA6 100%); padding: 40px; text-align: center; position: relative;">
                    <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: radial-gradient(circle at 30% 20%, rgba(197, 168, 128, 0.15) 0%, transparent 60%);"></div>
                    <h1 style="color: #ffffff; font-family: 'Outfit', Arial, sans-serif; font-size: 26px; font-weight: 800; margin: 0; letter-spacing: -0.02em; position: relative; z-index: 2;">
                        MOUNTAIN VIEW
                    </h1>
                    <p style="color: #C5A880; font-family: 'Outfit', Arial, sans-serif; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.2em; margin: 6px 0 0 0; position: relative; z-index: 2;">
                        Luxury Living Redefined
                    </p>
                </div>

                <!-- Body Content -->
                <div style="padding: 40px 35px; background: #ffffff;">
                    
                    <!-- Confirmation Title -->
                    <div style="text-align: center; margin-bottom: 30px;">
                        <h2 style="font-family: 'Outfit', Arial, sans-serif; font-size: 20px; font-weight: 800; color: #001A70; margin: 0;">
                            It's Your Turn to Reserve!
                        </h2>
                        <p style="color: #64748B; font-size: 13px; margin: 6px 0 0 0;">
                            Based on your EOI priority position, you are now invited to select your unit.
                        </p>
                    </div>

                    <!-- Greeting -->
                    <p style="color: #0F172A; font-size: 15px; line-height: 1.6; margin-bottom: 20px;">
                        Dear <strong>{$clientName}</strong>,
                    </p>
                    <p style="color: #475569; font-size: 14px; line-height: 1.6; margin-bottom: 24px;">
                        We are thrilled to invite you to select and reserve your unit. Based on your EOI queue priority order (Queue Number: <strong>#{$queueNumber}</strong>), your turn is now active.
                    </p>

                    <!-- Credentials Card -->
                    <div style="background: #F8FAFC; border-radius: 16px; border: 1.5px solid rgba(0, 61, 166, 0.06); padding: 24px; margin-bottom: 30px;">
                        <h3 style="font-family: 'Outfit', Arial, sans-serif; font-size: 12px; font-weight: 800; color: #003DA6; text-transform: uppercase; letter-spacing: 0.1em; margin: 0 0 16px 0;">
                            Portal Access Credentials
                        </h3>
                        <table style="width: 100%; border-collapse: collapse;">
                            <tr>
                                <td style="padding: 10px 0; color: #64748B; font-size: 13px; font-weight: 500;">Login Email</td>
                                <td style="padding: 10px 0; color: #0F172A; font-weight: 600; font-size: 14px; text-align: right;">{$email}</td>
                            </tr>
                            <tr>
                                <td style="padding: 10px 0; color: #64748B; font-size: 13px; font-weight: 500; border-top: 1px dashed rgba(0, 61, 166, 0.1);">Temporary Password</td>
                                <td style="padding: 10px 0; color: #003DA6; font-weight: 800; font-size: 14px; text-align: right; border-top: 1px dashed rgba(0, 61, 166, 0.1); font-family: monospace;">{$password}</td>
                            </tr>
                        </table>
                    </div>

                    <!-- Action Button -->
                    <div style="text-align: center; margin-bottom: 30px;">
                        <a href="{$loginUrl}" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #003DA6 0%, #001A70 100%); color: #ffffff; font-family: 'Outfit', Arial, sans-serif; font-size: 14px; font-weight: 700; text-decoration: none; padding: 14px 30px; border-radius: 30px; box-shadow: 0 4px 15px rgba(0, 61, 166, 0.25);">
                            Log In & Select Your Unit Now
                        </a>
                    </div>

                    <p style="color: #64748B; font-size: 12.5px; line-height: 1.6; margin: 0; text-align: center;">
                        Please log in to pick your building, floor, and unit. Once you select a unit, it will be blocked for you temporarily.
                    </p>

                </div>

                <!-- Footer -->
                <div style="background: #F8FAFC; border-top: 1px solid rgba(0, 61, 166, 0.05); padding: 30px 40px; text-align: center;">
                    <p style="color: #001A70; font-family: 'Outfit', Arial, sans-serif; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; margin: 0 0 8px 0;">
                        Mountain View Developments
                    </p>
                    <p style="color: #94A3B8; font-size: 11px; line-height: 1.5; margin: 0;">
                        © 2026 Mountain View Developments. All rights reserved.
                    </p>
                </div>

            </div>
        </div>
        HTML;
    }

    /**
     * Build HTML content for unit reserved email.
     */
    private static function buildUnitReservedEmailContent(
        string $clientName,
        string $unitNumber,
        string $projectName,
        int $deadlineHours,
        string $expiryDate
    ): string {
        return <<<HTML
        <div style="font-family: 'Inter', Arial, sans-serif; background-color: #f4f6fc; padding: 40px 20px; text-align: center;">
            <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 30px rgba(0, 61, 166, 0.05); border: 1px solid rgba(0, 61, 166, 0.05); text-align: left;">
                
                <!-- Header / Logo Area -->
                <div style="background: linear-gradient(135deg, #001A70 0%, #003DA6 100%); padding: 40px; text-align: center; position: relative;">
                    <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: radial-gradient(circle at 30% 20%, rgba(197, 168, 128, 0.15) 0%, transparent 60%);"></div>
                    <h1 style="color: #ffffff; font-family: 'Outfit', Arial, sans-serif; font-size: 26px; font-weight: 800; margin: 0; letter-spacing: -0.02em; position: relative; z-index: 2;">
                        MOUNTAIN VIEW
                    </h1>
                    <p style="color: #C5A880; font-family: 'Outfit', Arial, sans-serif; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.2em; margin: 6px 0 0 0; position: relative; z-index: 2;">
                        Luxury Living Redefined
                    </p>
                </div>

                <!-- Body Content -->
                <div style="padding: 40px 35px; background: #ffffff;">
                    
                    <!-- Confirmation Icon and Title -->
                    <div style="text-align: center; margin-bottom: 30px;">
                        <div style="width: 56px; height: 56px; border-radius: 50%; background: rgba(34, 197, 94, 0.1); display: inline-flex; align-items: center; justify-content: center; margin-bottom: 16px;">
                            <span style="color: #22c55e; font-size: 24px; font-weight: bold; line-height: 1;">✓</span>
                        </div>
                        <h2 style="font-family: 'Outfit', Arial, sans-serif; font-size: 20px; font-weight: 800; color: #001A70; margin: 0;">
                            Unit Reserved Successfully
                        </h2>
                        <p style="color: #64748B; font-size: 13px; margin: 6px 0 0 0;">
                            Your unit hold is active. Please complete contract signing before the deadline.
                        </p>
                    </div>

                    <!-- Greeting -->
                    <p style="color: #0F172A; font-size: 15px; line-height: 1.6; margin-bottom: 20px;">
                        Dear <strong>{$clientName}</strong>,
                    </p>
                    <p style="color: #475569; font-size: 14px; line-height: 1.6; margin-bottom: 24px;">
                        You have successfully selected and reserved **Unit {$unitNumber}** in **{$projectName}**. 
                    </p>

                    <!-- Expiry Alert Card -->
                    <div style="background: rgba(239, 68, 68, 0.03); border: 1.5px solid rgba(239, 68, 68, 0.15); border-radius: 16px; padding: 24px; margin-bottom: 30px;">
                        <h3 style="font-family: 'Outfit', Arial, sans-serif; font-size: 12px; font-weight: 800; color: #ef4444; text-transform: uppercase; letter-spacing: 0.1em; margin: 0 0 12px 0; display: flex; align-items: center; gap: 6px;">
                            ⚠️ Contracting Signature Deadline
                        </h3>
                        <p style="color: #475569; font-size: 13.5px; line-height: 1.6; margin: 0 0 16px 0;">
                            Please note that this unit hold is temporary. You are required to sign the official contract and complete the reservation protocol at our offices within the allocated window of **{$deadlineHours} hours**.
                        </p>
                        <table style="width: 100%; border-collapse: collapse; background: #ffffff; border-radius: 8px; padding: 12px; border: 1px solid rgba(239, 68, 68, 0.08);">
                            <tr>
                                <td style="padding: 10px 12px; color: #64748B; font-size: 13px; font-weight: 500;">Reserved Unit</td>
                                <td style="padding: 10px 12px; color: #0F172A; font-weight: 700; font-size: 13.5px; text-align: right;">Unit {$unitNumber}</td>
                            </tr>
                            <tr>
                                <td style="padding: 10px 12px; color: #64748B; font-size: 13px; font-weight: 500; border-top: 1px solid rgba(0, 0, 0, 0.05);">Expires On</td>
                                <td style="padding: 10px 12px; color: #ef4444; font-weight: 800; font-size: 13.5px; text-align: right; border-top: 1px solid rgba(0, 0, 0, 0.05);">{$expiryDate}</td>
                            </tr>
                        </table>
                    </div>

                    <p style="color: #64748B; font-size: 13px; line-height: 1.6; margin: 0 0 30px 0; text-align: center;">
                        <strong>Important Note:</strong> If the contract is not signed and the initial down payment finalized by the expiration date above, **your unit hold will be cancelled automatically**, and the unit will be released back to the public market.
                    </p>

                </div>

                <!-- Footer -->
                <div style="background: #F8FAFC; border-top: 1px solid rgba(0, 61, 166, 0.05); padding: 30px 40px; text-align: center;">
                    <p style="color: #001A70; font-family: 'Outfit', Arial, sans-serif; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; margin: 0 0 8px 0;">
                        Mountain View Developments
                    </p>
                    <p style="color: #94A3B8; font-size: 11px; line-height: 1.5; margin: 0;">
                        © 2026 Mountain View Developments. All rights reserved.
                    </p>
                </div>

            </div>
        </div>
        HTML;
    }

    /**
     * Build HTML content for approval email.
     */
    private static function buildApprovalEmailContent(
        string $clientName,
        string $orderNumber,
        int $queueNumber,
        string $paymentMethod,
        string $amount,
        string $reviewDate
    ): string {
        return <<<HTML
        <div style="font-family: 'Inter', Arial, sans-serif; background-color: #f4f6fc; padding: 40px 20px; text-align: center;">
            <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 30px rgba(0, 61, 166, 0.05); border: 1px solid rgba(0, 61, 166, 0.05); text-align: left;">
                
                <!-- Header / Logo Area -->
                <div style="background: linear-gradient(135deg, #001A70 0%, #003DA6 100%); padding: 40px; text-align: center; position: relative;">
                    <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: radial-gradient(circle at 30% 20%, rgba(197, 168, 128, 0.15) 0%, transparent 60%);"></div>
                    <h1 style="color: #ffffff; font-family: 'Outfit', Arial, sans-serif; font-size: 26px; font-weight: 800; margin: 0; letter-spacing: -0.02em; position: relative; z-index: 2;">
                        MOUNTAIN VIEW
                    </h1>
                    <p style="color: #C5A880; font-family: 'Outfit', Arial, sans-serif; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.2em; margin: 6px 0 0 0; position: relative; z-index: 2;">
                        Luxury Living Redefined
                    </p>
                </div>

                <!-- Body Content -->
                <div style="padding: 40px 35px; background: #ffffff;">
                    
                    <!-- Icon and Confirmation Title -->
                    <div style="text-align: center; margin-bottom: 30px;">
                        <div style="width: 56px; height: 56px; border-radius: 50%; background: rgba(34, 197, 94, 0.1); display: inline-flex; align-items: center; justify-content: center; margin-bottom: 16px;">
                            <span style="color: #22c55e; font-size: 24px; font-weight: bold; line-height: 1;">✓</span>
                        </div>
                        <h2 style="font-family: 'Outfit', Arial, sans-serif; font-size: 20px; font-weight: 800; color: #001A70; margin: 0;">
                            Payment Verified & Approved
                        </h2>
                        <p style="color: #64748B; font-size: 13px; margin: 6px 0 0 0;">
                            Your priority reservation number has been successfully assigned.
                        </p>
                    </div>

                    <!-- Greeting -->
                    <p style="color: #0F172A; font-size: 15px; line-height: 1.6; margin-bottom: 20px;">
                        Dear <strong>{$clientName}</strong>,
                    </p>
                    <p style="color: #475569; font-size: 14px; line-height: 1.6; margin-bottom: 24px;">
                        We are pleased to inform you that your Expression of Interest (EOI) payment has been reviewed and verified by our finance department. Your reservation request has been officially approved.
                    </p>

                    <!-- Details Card -->
                    <div style="background: #F8FAFC; border-radius: 16px; border: 1.5px solid rgba(0, 61, 166, 0.06); padding: 24px; margin-bottom: 30px;">
                        <h3 style="font-family: 'Outfit', Arial, sans-serif; font-size: 12px; font-weight: 800; color: #003DA6; text-transform: uppercase; letter-spacing: 0.1em; margin: 0 0 16px 0;">
                            Reservation Record
                        </h3>
                        <table style="width: 100%; border-collapse: collapse;">
                            <tr>
                                <td style="padding: 10px 0; color: #64748B; font-size: 13px; font-weight: 500;">Order ID</td>
                                <td style="padding: 10px 0; color: #0F172A; font-weight: 800; font-size: 14px; text-align: right; font-family: monospace;">{$orderNumber}</td>
                            </tr>
                            <tr>
                                <td style="padding: 10px 0; color: #64748B; font-size: 13px; font-weight: 500; border-top: 1px dashed rgba(0, 61, 166, 0.1);">Priority Queue Number</td>
                                <td style="padding: 10px 0; color: #003DA6; font-weight: 900; font-size: 18px; text-align: right; border-top: 1px dashed rgba(0, 61, 166, 0.1); font-family: 'Outfit', Arial, sans-serif;">
                                    #{$queueNumber}
                                </td>
                            </tr>
                            <tr>
                                <td style="padding: 10px 0; color: #64748B; font-size: 13px; font-weight: 500; border-top: 1px dashed rgba(0, 61, 166, 0.1);">Payment Method</td>
                                <td style="padding: 10px 0; color: #0F172A; font-weight: 600; font-size: 13px; text-align: right; border-top: 1px dashed rgba(0, 61, 166, 0.1);">{$paymentMethod}</td>
                            </tr>
                            <tr>
                                <td style="padding: 10px 0; color: #64748B; font-size: 13px; font-weight: 500; border-top: 1px dashed rgba(0, 61, 166, 0.1);">Amount Received</td>
                                <td style="padding: 10px 0; color: #0F172A; font-weight: 800; font-size: 14px; text-align: right; border-top: 1px dashed rgba(0, 61, 166, 0.1);">EGP {$amount}</td>
                            </tr>
                            <tr>
                                <td style="padding: 10px 0; color: #64748B; font-size: 13px; font-weight: 500; border-top: 1px dashed rgba(0, 61, 166, 0.1);">Approval Timestamp</td>
                                <td style="padding: 10px 0; color: #0F172A; font-weight: 600; font-size: 13px; text-align: right; border-top: 1px dashed rgba(0, 61, 166, 0.1);">{$reviewDate}</td>
                            </tr>
                        </table>
                    </div>

                    <!-- Priority Notice -->
                    <div style="background: rgba(197, 168, 128, 0.05); border-left: 4px solid #C5A880; border-radius: 8px; padding: 16px; margin-bottom: 30px;">
                        <p style="color: #0F172A; font-size: 13px; font-weight: 700; margin: 0 0 6px 0;">What happens next?</p>
                        <p style="color: #475569; font-size: 12.5px; line-height: 1.5; margin: 0;">
                            Your queue position (#{$queueNumber}) secures your priority during the upcoming phase launch. A dedicated property consultant will contact you shortly to guide you through the unit selection and contract signature process.
                        </p>
                    </div>

                    <!-- Call to Action button -->
                    <div style="text-align: center; margin-bottom: 30px;">
                        <a href="http://localhost:5173/unit-selection" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #003DA6 0%, #001A70 100%); color: #ffffff; font-family: 'Outfit', Arial, sans-serif; font-size: 14px; font-weight: 700; text-decoration: none; padding: 14px 30px; border-radius: 30px; box-shadow: 0 4px 15px rgba(0, 61, 166, 0.25);">
                            Explore Projects & Master Plan
                        </a>
                    </div>

                    <p style="color: #64748B; font-size: 12.5px; line-height: 1.6; margin: 0; text-align: center;">
                        If you have any questions, please contact our support team at <a href="mailto:support@mountainview.com" style="color: #003DA6; text-decoration: none; font-weight: 600;">support@mountainview.com</a> or call our hotline.
                    </p>

                </div>

                <!-- Footer -->
                <div style="background: #F8FAFC; border-top: 1px solid rgba(0, 61, 166, 0.05); padding: 30px 40px; text-align: center;">
                    <p style="color: #001A70; font-family: 'Outfit', Arial, sans-serif; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; margin: 0 0 8px 0;">
                        Mountain View Developments
                    </p>
                    <p style="color: #94A3B8; font-size: 11px; line-height: 1.5; margin: 0;">
                        This is an automated priority confirmation ticket. Please keep this email for your records.<br/>
                        © 2026 Mountain View Developments. All rights reserved.
                    </p>
                </div>

            </div>
        </div>
        HTML;
    }

    /**
     * Build HTML content for rejection email.
     */
    private static function buildRejectionEmailContent(
        string $clientName,
        string $reason,
        string $reviewDate
    ): string {
        return <<<HTML
        <div style="font-family: 'Inter', Arial, sans-serif; background-color: #f4f6fc; padding: 40px 20px; text-align: center;">
            <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 30px rgba(0, 61, 166, 0.05); border: 1px solid rgba(0, 61, 166, 0.05); text-align: left;">
                
                <!-- Header / Logo Area -->
                <div style="background: linear-gradient(135deg, #001A70 0%, #003DA6 100%); padding: 40px; text-align: center; position: relative;">
                    <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: radial-gradient(circle at 30% 20%, rgba(197, 168, 128, 0.15) 0%, transparent 60%);"></div>
                    <h1 style="color: #ffffff; font-family: 'Outfit', Arial, sans-serif; font-size: 26px; font-weight: 800; margin: 0; letter-spacing: -0.02em; position: relative; z-index: 2;">
                        MOUNTAIN VIEW
                    </h1>
                    <p style="color: #C5A880; font-family: 'Outfit', Arial, sans-serif; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.2em; margin: 6px 0 0 0; position: relative; z-index: 2;">
                        Luxury Living Redefined
                    </p>
                </div>

                <!-- Body Content -->
                <div style="padding: 40px 35px; background: #ffffff;">
                    
                    <!-- Icon and Confirmation Title -->
                    <div style="text-align: center; margin-bottom: 30px;">
                        <div style="width: 56px; height: 56px; border-radius: 50%; background: rgba(239, 68, 68, 0.1); display: inline-flex; align-items: center; justify-content: center; margin-bottom: 16px;">
                            <span style="color: #ef4444; font-size: 24px; font-weight: bold; line-height: 1;">✕</span>
                        </div>
                        <h2 style="font-family: 'Outfit', Arial, sans-serif; font-size: 20px; font-weight: 800; color: #001A70; margin: 0;">
                            EOI Payment Update Required
                        </h2>
                        <p style="color: #64748B; font-size: 13px; margin: 6px 0 0 0;">
                            Your submitted payment receipt requires attention.
                        </p>
                    </div>

                    <!-- Greeting -->
                    <p style="color: #0F172A; font-size: 15px; line-height: 1.6; margin-bottom: 20px;">
                        Dear <strong>{$clientName}</strong>,
                    </p>
                    <p style="color: #475569; font-size: 14px; line-height: 1.6; margin-bottom: 24px;">
                        We have reviewed your submitted payment receipt for the Expression of Interest (EOI). Unfortunately, our finance department could not verify the transaction at this time due to the following reason:
                    </p>

                    <!-- Reason Card -->
                    <div style="background: rgba(239, 68, 68, 0.03); border-left: 4px solid #ef4444; border-radius: 8px; padding: 20px; margin-bottom: 30px;">
                        <p style="color: #ef4444; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; margin: 0 0 8px 0;">Reason for rejection</p>
                        <p style="color: #0F172A; font-size: 14px; line-height: 1.6; margin: 0; font-weight: 500;">
                            {$reason}
                        </p>
                    </div>

                    <p style="color: #475569; font-size: 13.5px; line-height: 1.6; margin-bottom: 24px;">
                        <strong>Reviewed on:</strong> {$reviewDate}
                    </p>

                    <p style="color: #475569; font-size: 13.5px; line-height: 1.6; margin-bottom: 30px;">
                        Please re-submit your reservation request with the correct bank transfer receipt or payment confirmation. Your priority spot will be processed immediately upon receipt of valid details.
                    </p>

                    <!-- Action Button -->
                    <div style="text-align: center; margin-bottom: 30px;">
                        <a href="http://localhost:5173/unit-selection" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #003DA6 0%, #001A70 100%); color: #ffffff; font-family: 'Outfit', Arial, sans-serif; font-size: 14px; font-weight: 700; text-decoration: none; padding: 14px 30px; border-radius: 30px; box-shadow: 0 4px 15px rgba(0, 61, 166, 0.25);">
                            Re-submit EOI Reservation
                        </a>
                    </div>

                    <p style="color: #64748B; font-size: 12.5px; line-height: 1.6; margin: 0; text-align: center;">
                        If you have any questions or require support, please reach out to us at <a href="mailto:support@mountainview.com" style="color: #003DA6; text-decoration: none; font-weight: 600;">support@mountainview.com</a>.
                    </p>

                </div>

                <!-- Footer -->
                <div style="background: #F8FAFC; border-top: 1px solid rgba(0, 61, 166, 0.05); padding: 30px 40px; text-align: center;">
                    <p style="color: #001A70; font-family: 'Outfit', Arial, sans-serif; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; margin: 0 0 8px 0;">
                        Mountain View Developments
                    </p>
                    <p style="color: #94A3B8; font-size: 11px; line-height: 1.5; margin: 0;">
                        This is an automated priority confirmation ticket. Please keep this email for your records.<br/>
                        © 2026 Mountain View Developments. All rights reserved.
                    </p>
                </div>

            </div>
        </div>
        HTML;
    }
}
