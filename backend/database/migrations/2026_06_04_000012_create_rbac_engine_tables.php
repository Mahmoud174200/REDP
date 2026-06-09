<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // ── Roles ──
        Schema::create('enterprise_roles', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name')->unique();
            $table->string('display_name');
            $table->text('description')->nullable();
            $table->uuid('parent_role_id')->nullable();
            $table->uuid('company_id')->nullable();
            $table->boolean('is_system')->default(false);
            $table->integer('level')->default(0);
            $table->enum('status', ['active', 'inactive'])->default('active');
            $table->timestamps();

            $table->foreign('parent_role_id')->references('id')->on('enterprise_roles')->nullOnDelete();
            $table->foreign('company_id')->references('id')->on('companies')->nullOnDelete();
            $table->index(['status', 'company_id']);
        });

        // ── Permissions ──
        Schema::create('permissions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name')->unique();       // e.g. 'lead.view'
            $table->string('display_name');
            $table->text('description')->nullable();
            $table->string('module', 50);            // e.g. 'leads'
            $table->string('group_name', 100)->nullable();
            $table->timestamps();

            $table->index(['module']);
        });

        // ── Role ↔ Permission Pivot ──
        Schema::create('role_permissions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('role_id');
            $table->uuid('permission_id');
            $table->timestamp('created_at')->useCurrent();

            $table->foreign('role_id')->references('id')->on('enterprise_roles')->cascadeOnDelete();
            $table->foreign('permission_id')->references('id')->on('permissions')->cascadeOnDelete();
            $table->unique(['role_id', 'permission_id']);
        });

        // ── User ↔ Role Assignment ──
        Schema::create('user_roles', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('user_id');
            $table->uuid('role_id');
            $table->uuid('company_id')->nullable();
            $table->uuid('branch_id')->nullable();
            $table->uuid('granted_by')->nullable();
            $table->dateTime('expires_at')->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
            $table->foreign('role_id')->references('id')->on('enterprise_roles')->cascadeOnDelete();
            $table->foreign('company_id')->references('id')->on('companies')->nullOnDelete();
            $table->foreign('branch_id')->references('id')->on('branches')->nullOnDelete();
            $table->foreign('granted_by')->references('id')->on('users')->nullOnDelete();
            $table->index(['user_id', 'role_id']);
        });

        // ── Direct User Permission Overrides ──
        Schema::create('user_permissions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('user_id');
            $table->uuid('permission_id');
            $table->enum('type', ['grant', 'deny'])->default('grant');
            $table->uuid('granted_by')->nullable();
            $table->dateTime('expires_at')->nullable();
            $table->text('reason')->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
            $table->foreign('permission_id')->references('id')->on('permissions')->cascadeOnDelete();
            $table->foreign('granted_by')->references('id')->on('users')->nullOnDelete();
            $table->index(['user_id', 'permission_id']);
        });

        // ── Permission Templates ──
        Schema::create('permission_templates', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->text('description')->nullable();
            $table->json('permissions');  // array of permission names
            $table->uuid('created_by')->nullable();
            $table->timestamps();

            $table->foreign('created_by')->references('id')->on('users')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('permission_templates');
        Schema::dropIfExists('user_permissions');
        Schema::dropIfExists('user_roles');
        Schema::dropIfExists('role_permissions');
        Schema::dropIfExists('permissions');
        Schema::dropIfExists('enterprise_roles');
    }
};
