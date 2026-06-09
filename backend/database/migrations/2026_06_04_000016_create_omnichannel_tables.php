<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // ── Communication Channels ──
        Schema::create('communication_channels', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->enum('type', ['whatsapp', 'sms', 'email', 'facebook', 'telegram'])->default('sms');
            $table->string('provider', 50); // e.g. 'twilio', 'meta', 'smtp'
            $table->json('config')->nullable(); // api keys, credentials, routing details
            $table->enum('status', ['active', 'inactive', 'error'])->default('active');
            $table->uuid('company_id')->nullable();
            $table->timestamps();

            $table->foreign('company_id')->references('id')->on('companies')->nullOnDelete();
        });

        // ── Conversations ──
        Schema::create('conversations', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('channel_id');
            $table->uuid('lead_id')->nullable();
            $table->string('customer_phone', 50);
            $table->string('customer_email')->nullable();
            $table->string('customer_name')->nullable();
            $table->uuid('assigned_agent_id')->nullable();
            $table->enum('status', ['open', 'pending', 'closed'])->default('open');
            $table->dateTime('last_message_at');
            $table->timestamps();

            $table->foreign('channel_id')->references('id')->on('communication_channels')->cascadeOnDelete();
            $table->foreign('lead_id')->references('id')->on('leads')->nullOnDelete();
            $table->foreign('assigned_agent_id')->references('id')->on('users')->nullOnDelete();
            $table->index(['customer_phone', 'customer_email']);
            $table->index(['status', 'assigned_agent_id']);
        });

        // ── Messages ──
        Schema::create('messages', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('conversation_id');
            $table->enum('direction', ['inbound', 'outbound'])->default('inbound');
            $table->enum('sender_type', ['customer', 'agent', 'system'])->default('customer');
            $table->uuid('sender_id')->nullable(); // user_id of agent
            $table->enum('message_type', ['text', 'image', 'document', 'location', 'audio'])->default('text');
            $table->text('content');
            $table->string('file_url')->nullable();
            $table->enum('status', ['sending', 'sent', 'delivered', 'read', 'failed'])->default('sent');
            $table->timestamps();

            $table->foreign('conversation_id')->references('id')->on('conversations')->cascadeOnDelete();
            $table->foreign('sender_id')->references('id')->on('users')->nullOnDelete();
            $table->index(['conversation_id', 'created_at']);
        });

        // ── Message Templates (approved template messages) ──
        Schema::create('message_templates', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->enum('channel_type', ['whatsapp', 'sms', 'email'])->default('sms');
            $table->string('language', 10)->default('en');
            $table->text('content');
            $table->json('variables')->nullable(); // list of parameters: name, amount
            $table->enum('status', ['pending', 'approved', 'rejected'])->default('approved');
            $table->uuid('company_id')->nullable();
            $table->timestamps();

            $table->foreign('company_id')->references('id')->on('companies')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('message_templates');
        Schema::dropIfExists('messages');
        Schema::dropIfExists('conversations');
        Schema::dropIfExists('communication_channels');
    }
};
