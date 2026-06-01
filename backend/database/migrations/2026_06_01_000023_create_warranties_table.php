<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('warranties', function (Blueprint ) {
            ->uuid('id')->primary();
            ->uuid('unit_id');
            ->string('vendor_name');
            ->string('coverage_details');
            ->timestamp('expires_at')->nullable();
            ->timestamps();
            ->foreign('unit_id')->references('id')->on('units')->onDelete('cascade');
        });
    }
    public function down(): void {
        Schema::dropIfExists('warranties');
    }
};