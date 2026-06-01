<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('interactions', function (Blueprint ) {
            ->uuid('id')->primary();
            ->uuid('lead_id');
            ->string('type');
            ->text('notes')->nullable();
            ->timestamp('interacted_at')->useCurrent();
            ->timestamps();
            ->foreign('lead_id')->references('id')->on('leads')->onDelete('cascade');
        });
    }
    public function down(): void {
        Schema::dropIfExists('interactions');
    }
};