<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('users', function (Blueprint ) {
            ->uuid('id')->primary();
            ->string('name');
            ->string('email')->unique();
            ->string('password');
            ->string('phone')->nullable();
            ->string('role')->default('client');
            ->string('status')->default('active');
            ->rememberToken();
            ->timestamps();
        });
    }
    public function down(): void {
        Schema::dropIfExists('users');
    }
};