<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('documents', function (Blueprint ) {
            ->uuid('id')->primary();
            ->string('title');
            ->string('file_path');
            ->longText('ocr_content')->nullable();
            ->string('status')->default('indexed');
            ->timestamps();
        });
    }
    public function down(): void {
        Schema::dropIfExists('documents');
    }
};