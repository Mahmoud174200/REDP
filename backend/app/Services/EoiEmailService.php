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
            'bank_transfer'              => 'Bank Transfer',
            'cheque'                     => 'Cheque',
            'international_bank_transfer' => 'International Bank Transfer',
        ];

        $paymentLabel = $paymentMethodLabels[$reservation->payment_method] ?? $reservation->payment_method;

        $content = self::buildApprovalEmailContent(
            $reservation->client_name,
            $reservation->order_number,
            $reservation->queue_number,
            $paymentLabel,
            number_format((float) $reservation->payment_amount, 2),
            $reservation->reviewed_at?->format('F j, Y \\a\\t g:i A') ?? now()->format('F j, Y \\a\\t g:i A')
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
            $reservation->reviewed_at?->format('F j, Y \\a\\t g:i A') ?? now()->format('F j, Y \\a\\t g:i A')
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
        <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f2f6f1; padding: 40px 20px;">
            <div style="background: #ffffff; border-radius: 24px; padding: 40px; box-shadow: 0 15px 35px rgba(44, 62, 50, 0.06);">
                <!-- Header -->
                <div style="text-align: center; margin-bottom: 32px;">
                    <div style="width: 64px; height: 64px; border-radius: 50%; background: linear-gradient(135deg, #2e7d32, #4caf50); display: inline-flex; align-items: center; justify-content: center; margin-bottom: 16px;">
                        <span style="color: #fff; font-size: 28px;">✓</span>
                    </div>
                    <h1 style="font-family: 'Outfit', Arial, sans-serif; color: #1d2d24; font-size: 24px; margin: 0;">Payment Approved</h1>
                    <p style="color: #5c7064; font-size: 14px; margin-top: 8px;">Your EOI reservation has been confirmed</p>
                </div>

                <!-- Greeting -->
                <p style="color: #1d2d24; font-size: 16px; margin-bottom: 24px;">Dear <strong>{$clientName}</strong>,</p>
                <p style="color: #5c7064; font-size: 14px; line-height: 1.6; margin-bottom: 24px;">
                    We are pleased to confirm that your Expression of Interest (EOI) payment has been reviewed and approved. Below are your reservation details:
                </p>

                <!-- Details Card -->
                <div style="background: #f2f6f1; border-radius: 16px; padding: 24px; margin-bottom: 24px;">
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr>
                            <td style="padding: 8px 0; color: #5c7064; font-size: 13px;">Order Number</td>
                            <td style="padding: 8px 0; color: #1d2d24; font-weight: 700; font-size: 15px; text-align: right;">{$orderNumber}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; color: #5c7064; font-size: 13px; border-top: 1px solid rgba(161, 183, 167, 0.3);">Queue Position</td>
                            <td style="padding: 8px 0; color: #1d2d24; font-weight: 700; font-size: 15px; text-align: right; border-top: 1px solid rgba(161, 183, 167, 0.3);">#{$queueNumber}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; color: #5c7064; font-size: 13px; border-top: 1px solid rgba(161, 183, 167, 0.3);">Payment Method</td>
                            <td style="padding: 8px 0; color: #1d2d24; font-weight: 600; font-size: 14px; text-align: right; border-top: 1px solid rgba(161, 183, 167, 0.3);">{$paymentMethod}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; color: #5c7064; font-size: 13px; border-top: 1px solid rgba(161, 183, 167, 0.3);">Amount Paid</td>
                            <td style="padding: 8px 0; color: #2e7d32; font-weight: 700; font-size: 15px; text-align: right; border-top: 1px solid rgba(161, 183, 167, 0.3);">EGP {$amount}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; color: #5c7064; font-size: 13px; border-top: 1px solid rgba(161, 183, 167, 0.3);">Approved On</td>
                            <td style="padding: 8px 0; color: #1d2d24; font-weight: 600; font-size: 14px; text-align: right; border-top: 1px solid rgba(161, 183, 167, 0.3);">{$reviewDate}</td>
                        </tr>
                    </table>
                </div>

                <p style="color: #5c7064; font-size: 13px; line-height: 1.6;">
                    Our team will contact you soon with next steps. If you have any questions, please don't hesitate to reach out.
                </p>

                <!-- Footer -->
                <div style="text-align: center; margin-top: 32px; padding-top: 24px; border-top: 1px solid rgba(161, 183, 167, 0.3);">
                    <p style="color: #a1b7a7; font-size: 11px;">This is an automated message from the REDP Platform. Please do not reply to this email.</p>
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
        <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f2f6f1; padding: 40px 20px;">
            <div style="background: #ffffff; border-radius: 24px; padding: 40px; box-shadow: 0 15px 35px rgba(44, 62, 50, 0.06);">
                <!-- Header -->
                <div style="text-align: center; margin-bottom: 32px;">
                    <div style="width: 64px; height: 64px; border-radius: 50%; background: linear-gradient(135deg, #d32f2f, #ef5350); display: inline-flex; align-items: center; justify-content: center; margin-bottom: 16px;">
                        <span style="color: #fff; font-size: 28px;">✕</span>
                    </div>
                    <h1 style="font-family: 'Outfit', Arial, sans-serif; color: #1d2d24; font-size: 24px; margin: 0;">Payment Review Update</h1>
                    <p style="color: #5c7064; font-size: 14px; margin-top: 8px;">Your EOI reservation requires attention</p>
                </div>

                <!-- Greeting -->
                <p style="color: #1d2d24; font-size: 16px; margin-bottom: 24px;">Dear <strong>{$clientName}</strong>,</p>
                <p style="color: #5c7064; font-size: 14px; line-height: 1.6; margin-bottom: 24px;">
                    We have reviewed your submitted payment receipt for your Expression of Interest (EOI). Unfortunately, we are unable to approve it at this time.
                </p>

                <!-- Reason Card -->
                <div style="background: rgba(211, 47, 47, 0.05); border-left: 4px solid #d32f2f; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
                    <p style="color: #5c7064; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px;">Reason</p>
                    <p style="color: #1d2d24; font-size: 14px; line-height: 1.6; margin: 0;">{$reason}</p>
                </div>

                <p style="color: #5c7064; font-size: 13px; line-height: 1.6; margin-bottom: 8px;">
                    <strong>Reviewed on:</strong> {$reviewDate}
                </p>

                <p style="color: #5c7064; font-size: 13px; line-height: 1.6;">
                    You may re-submit a new EOI with corrected payment details. If you believe this was an error, please contact our support team for assistance.
                </p>

                <!-- Footer -->
                <div style="text-align: center; margin-top: 32px; padding-top: 24px; border-top: 1px solid rgba(161, 183, 167, 0.3);">
                    <p style="color: #a1b7a7; font-size: 11px;">This is an automated message from the REDP Platform. Please do not reply to this email.</p>
                </div>
            </div>
        </div>
        HTML;
    }
}
