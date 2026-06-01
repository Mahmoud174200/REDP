<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('campaigns', function (Blueprint ) {
            ->uuid('id')->primary();
            ->string('name');
            ->string('utm_source');
            ->string('utm_medium');
            ->decimal('budget', 15, 2)->default(0.00);
            ->boolean('active')->default(true);
            ->timestamps();
        });
    }
    public function down(): void {
        Schema::dropIfExists('campaigns');
    }
};