<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Project;
use App\Models\Unit;
use App\Models\Campaign;
use App\Models\Broker;
use App\Models\Lead;
use App\Models\Interaction;
use App\Models\CallLog;
use App\Models\Commission;
use Illuminate\Support\Str;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database with high-fidelity realistic data.
     */
    public function run(): void
    {
        // ── 1. Create Core Users ──
        $admin = User::create([
            'id' => (string) Str::uuid(),
            'name' => 'Platform Administrator',
            'email' => 'admin@redp.com',
            'password' => bcrypt('password'),
            'phone' => '+201009999999',
            'role' => 'admin',
            'status' => 'active',
        ]);

        $ragab = User::create([
            'id' => (string) Str::uuid(),
            'name' => 'Ragab Sales',
            'email' => 'sales_agent@redp.com',
            'password' => bcrypt('password'),
            'phone' => '+201001111111',
            'role' => 'sales_agent',
            'status' => 'active',
        ]);

        $melwany = User::create([
            'id' => (string) Str::uuid(),
            'name' => 'Melwany Finance',
            'email' => 'finance_officer@redp.com',
            'password' => bcrypt('password'),
            'phone' => '+201002222222',
            'role' => 'finance_officer',
            'status' => 'active',
        ]);

        $mahmoud = User::create([
            'id' => (string) Str::uuid(),
            'name' => 'Mahmoud Delivery',
            'email' => 'delivery_engineer@redp.com',
            'password' => bcrypt('password'),
            'phone' => '+201003333333',
            'role' => 'delivery_engineer',
            'status' => 'active',
        ]);

        // ── 2. Create Real Estate Projects ──
        $patio = Project::create([
            'id' => (string) Str::uuid(),
            'name' => 'Patio Luxury Compound',
            'location' => 'New Cairo, Egypt',
            'total_units' => 45,
            'status' => 'construction',
        ]);

        $uptown = Project::create([
            'id' => (string) Str::uuid(),
            'name' => 'Uptown Residence',
            'location' => '6th of October City, Egypt',
            'total_units' => 80,
            'status' => 'planning',
        ]);

        // ── 3. Create Units for Projects ──
        $unitA = Unit::create([
            'id' => (string) Str::uuid(),
            'project_id' => $patio->id,
            'unit_number' => '101-A',
            'floor' => 1,
            'type' => 'Apartment',
            'price' => 4500000.00,
            'status' => 'available',
        ]);

        $unitB = Unit::create([
            'id' => (string) Str::uuid(),
            'project_id' => $patio->id,
            'unit_number' => '201-B',
            'floor' => 2,
            'type' => 'Penthouse',
            'price' => 8900000.00,
            'status' => 'reserved',
        ]);

        $unitC = Unit::create([
            'id' => (string) Str::uuid(),
            'project_id' => $uptown->id,
            'unit_number' => '12-C',
            'floor' => 3,
            'type' => 'Duplex',
            'price' => 6200000.00,
            'status' => 'available',
        ]);

        // ── 4. Create Campaigns ──
        $campFB = Campaign::create([
            'name' => 'Q2 Luxury Penthouses FB Ads',
            'source' => 'facebook',
            'utm_source' => 'facebook_ads',
            'utm_medium' => 'cpc',
            'utm_campaign' => 'luxury_penthouses_2026',
            'budget' => 45000.00,
            'leads_count' => 320,
            'roi_percentage' => 320.00,
        ]);

        $campGG = Campaign::create([
            'name' => 'New Administrative Capital Search',
            'source' => 'google',
            'utm_source' => 'google_search',
            'utm_medium' => 'cpc',
            'utm_campaign' => 'admin_capital_commercial',
            'budget' => 75000.00,
            'leads_count' => 540,
            'roi_percentage' => 480.00,
        ]);

        // ── 5. Create Brokers ──
        $brokerRemax = Broker::create([
            'agency_name' => 'RE/MAX Egypt',
            'agent_name' => 'Ahmed Ali',
            'email' => 'remax@redp.com',
            'phone' => '+201001234567',
            'license_no' => 'LIC-88291',
            'status' => 'active',
            'referral_code' => 'REMAX2026',
        ]);

        $brokerColdwell = Broker::create([
            'agency_name' => 'Coldwell Banker',
            'agent_name' => 'Omar Hassan',
            'email' => 'coldwell@redp.com',
            'phone' => '+201101234567',
            'license_no' => 'LIC-99381',
            'status' => 'active',
            'referral_code' => 'COLD2026',
        ]);

        // ── 6. Create Leads (Sales Pipeline) ──
        $lead1 = Lead::create([
            'first_name' => 'Mohamed',
            'last_name' => 'Nabil',
            'email' => 'mohamed.nabil@gmail.com',
            'phone' => '+201201112223',
            'national_id' => '29501011234567',
            'status' => 'new',
            'lead_score' => 85,
            'assigned_sales_agent_id' => $ragab->id,
            'kyc_status' => 'verified',
            'facial_match_score' => 96.50,
            'source' => 'facebook',
            'campaign_id' => $campFB->id,
        ]);

        $lead2 = Lead::create([
            'first_name' => 'Sherif',
            'last_name' => 'Kamal',
            'email' => 'sherif.kamal@yahoo.com',
            'phone' => '+201509998887',
            'national_id' => '29202021234567',
            'status' => 'interested',
            'lead_score' => 92,
            'assigned_sales_agent_id' => $ragab->id,
            'kyc_status' => 'pending',
            'facial_match_score' => 84.20,
            'source' => 'google',
            'campaign_id' => $campGG->id,
        ]);

        $lead3 = Lead::create([
            'first_name' => 'Yasmine',
            'last_name' => 'Fouad',
            'email' => 'yasmine.f@outlook.com',
            'phone' => '+201007776665',
            'national_id' => '29803031234567',
            'status' => 'negotiation',
            'lead_score' => 78,
            'assigned_sales_agent_id' => $ragab->id,
            'kyc_status' => 'none',
            'source' => 'broker',
            'broker_id' => $brokerRemax->id,
        ]);

        $lead4 = Lead::create([
            'first_name' => 'Karim',
            'last_name' => 'Saeed',
            'email' => 'karim.saeed@gmail.com',
            'phone' => '+201103332221',
            'national_id' => '29004041234567',
            'status' => 'reserved',
            'lead_score' => 98,
            'assigned_sales_agent_id' => $ragab->id,
            'kyc_status' => 'verified',
            'facial_match_score' => 98.90,
            'source' => 'facebook',
            'campaign_id' => $campFB->id,
        ]);

        // ── 7. Create Interactions ──
        Interaction::create([
            'id' => (string) Str::uuid(),
            'lead_id' => $lead2->id,
            'type' => 'call',
            'notes' => 'Customer inquired about commercial pricing structure in the Administrative Capital. Warm lead.',
            'follow_up_date' => now()->addDays(2),
            'logged_by' => $ragab->id,
        ]);

        Interaction::create([
            'id' => (string) Str::uuid(),
            'lead_id' => $lead3->id,
            'type' => 'meeting',
            'notes' => 'Face-to-face walkthrough. Client expressed strong interest in Patio Luxury Compound.',
            'follow_up_date' => now()->addDays(5),
            'logged_by' => $ragab->id,
        ]);

        // ── 8. Create VoIP Call Logs ──
        CallLog::create([
            'id' => (string) Str::uuid(),
            'lead_id' => $lead1->id,
            'call_sid' => 'CA' . Str::random(32),
            'direction' => 'outbound',
            'duration_seconds' => 184,
            'recording_url' => 'https://s3.amazonaws.com/redp-voip/recordings/call_184s.mp3',
            'status' => 'completed',
        ]);

        // ── 9. Create Commissions ──
        Commission::create([
            'broker_id' => $brokerRemax->id,
            'lead_id' => $lead3->id,
            'unit_id' => $unitB->id,
            'rate_percent' => 2.50,
            'gross_amount' => 222500.00,
            'status' => 'pending',
        ]);

        Commission::create([
            'broker_id' => $brokerColdwell->id,
            'lead_id' => $lead4->id,
            'unit_id' => $unitA->id,
            'rate_percent' => 3.00,
            'gross_amount' => 135000.00,
            'status' => 'approved',
        ]);
    }
}
