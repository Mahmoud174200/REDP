<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // ── Tenants Table ──
        Schema::create('tenants', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->string('subdomain')->unique();
            $table->string('domain')->unique()->nullable();
            $table->enum('status', ['trial', 'active', 'suspended'])->default('trial');
            $table->json('branding')->nullable(); // hex colors, logo_url
            $table->json('settings')->nullable(); // custom overrides
            $table->softDeletes();
            $table->timestamps();
        });

        // ── Tenant Subscriptions Table ──
        Schema::create('tenant_subscriptions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('tenant_id');
            $table->enum('plan', ['basic', 'standard', 'enterprise'])->default('basic');
            $table->dateTime('starts_at');
            $table->dateTime('ends_at')->nullable();
            $table->enum('status', ['active', 'cancelled', 'expired'])->default('active');
            $table->integer('max_users')->default(10);
            $table->integer('max_leads')->default(1000);
            $table->json('features')->nullable(); // e.g. ['accounting', 'procurement', 'ai']
            $table->timestamps();

            $table->foreign('tenant_id')->references('id')->on('tenants')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tenant_subscriptions');
        Schema::dropIfExists('tenants');
    }
};
