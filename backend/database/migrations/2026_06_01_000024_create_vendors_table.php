<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('vendors', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->string('service_type');
            $table->decimal('rating', 3, 2)->default(5.00);
            $table->string('contact_number');
            $table->timestamps();
        });
    }
    public function down(): void {
        Schema::dropIfExists('vendors');
    }
};