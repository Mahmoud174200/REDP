<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('vendors', function (Blueprint ) {
            ->uuid('id')->primary();
            ->string('name');
            ->string('service_type');
            ->decimal('rating', 3, 2)->default(5.00);
            ->string('contact_number');
            ->timestamps();
        });
    }
    public function down(): void {
        Schema::dropIfExists('vendors');
    }
};