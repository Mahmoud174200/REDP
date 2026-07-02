<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * ─────────────────────────────────────────────────────────
     * REDP — Payment-Plan Appointment
     *
     * After a customer selects a unit, a meeting is booked at the
     * developer's office to set up the payment plan. The appointment
     * is linked to the selected unit and to a developer rep, whose
     * name / phone / title are snapshotted for stable display.
     * ─────────────────────────────────────────────────────────
     */
    public function up(): void
    {
        Schema::table('appointments', function (Blueprint $table) {
            // ── Selected unit context ──
            $table->uuid('project_id')->nullable()->after('lead_id');
            $table->uuid('unit_id')->nullable()->after('project_id');
            $table->uuid('reservation_id')->nullable()->after('unit_id');
            $table->uuid('eoi_reservation_id')->nullable()->after('reservation_id');

            // ── Assigned developer representative (the person the client will meet) ──
            $table->uuid('assigned_rep_id')->nullable()->after('eoi_reservation_id');
            $table->string('rep_name')->nullable()->after('assigned_rep_id');
            $table->string('rep_phone', 40)->nullable()->after('rep_name');
            $table->string('rep_title')->nullable()->after('rep_phone');

            // ── Meeting details ──
            $table->string('location')->nullable()->after('rep_title');
            $table->text('notes')->nullable()->after('location');

            $table->index('unit_id', 'idx_appt_unit');
            $table->index('reservation_id', 'idx_appt_reservation');
            $table->index('assigned_rep_id', 'idx_appt_rep');
            $table->index(['type', 'status'], 'idx_appt_type_status');

            $table->foreign('assigned_rep_id')->references('id')->on('users')->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::table('appointments', function (Blueprint $table) {
            $table->dropForeign(['assigned_rep_id']);
            $table->dropIndex('idx_appt_unit');
            $table->dropIndex('idx_appt_reservation');
            $table->dropIndex('idx_appt_rep');
            $table->dropIndex('idx_appt_type_status');
            $table->dropColumn([
                'project_id', 'unit_id', 'reservation_id', 'eoi_reservation_id',
                'assigned_rep_id', 'rep_name', 'rep_phone', 'rep_title',
                'location', 'notes',
            ]);
        });
    }
};
