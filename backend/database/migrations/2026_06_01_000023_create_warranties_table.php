<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('warranties', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('unit_id');
            $table->string('vendor_name');
            $table->string('coverage_details');
            $table->timestamp('expires_at')->nullable();
            $table->timestamps();
            $table->foreign('unit_id')->references('id')->on('units')->onDelete('cascade');
        });
    }
    public function down(): void {
        Schema::dropIfExists('warranties');
    }
};