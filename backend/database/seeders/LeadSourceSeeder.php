<?php

namespace Database\Seeders;

use App\Models\LeadSource;
use Illuminate\Database\Seeder;

/**
 * ─────────────────────────────────────────────────────────
 * REDP — Lead Attribution System
 * Seeds the canonical lead-source catalog.
 * ─────────────────────────────────────────────────────────
 */
class LeadSourceSeeder extends Seeder
{
    public function run(): void
    {
        $sources = [
            ['broker_referral',  'Broker Referral Link', 'broker',   true],
            ['broker_qr',        'Broker QR Code',       'broker',   true],
            ['broker_invite',    'Broker Invitation Link','broker',  true],
            ['promo_code',       'Promo Code',           'broker',   true],
            ['facebook_ads',     'Facebook Ads',         'paid_ads', false],
            ['google_ads',       'Google Ads',           'paid_ads', false],
            ['instagram_ads',    'Instagram Ads',        'paid_ads', false],
            ['tiktok_ads',       'TikTok Ads',           'paid_ads', false],
            ['whatsapp_campaign','WhatsApp Campaign',    'paid_ads', false],
            ['organic_search',   'Organic Search',       'organic',  false],
            ['direct',           'Direct Website Visit', 'direct',   false],
            ['manual_entry',     'Manual Lead Entry',    'manual',   false],
            ['api_integration',  'API Integration',      'api',      false],
        ];

        foreach ($sources as [$key, $label, $category, $isBroker]) {
            LeadSource::updateOrCreate(
                ['key' => $key],
                [
                    'label'            => $label,
                    'category'         => $category,
                    'is_broker_source' => $isBroker,
                    'is_active'        => true,
                ]
            );
        }
    }
}
