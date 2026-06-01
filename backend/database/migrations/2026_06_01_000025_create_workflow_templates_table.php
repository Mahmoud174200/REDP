<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('workflow_templates', function (Blueprint ) {
            ->uuid('id')->primary();
            ->string('trigger_name');
            ->string('action_name');
            ->json('rules_payload')->nullable();
            ->boolean('active')->default(true);
            ->timestamps();
        });
    }
    public function down(): void {
        Schema::dropIfExists('workflow_templates');
    }
};