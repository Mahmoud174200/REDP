<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // ── AI Predictions ──
        Schema::create('ai_predictions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('company_id')->nullable();
            $table->string('model_name'); // e.g. 'lead_scoring', 'sales_forecast', 'collection_risk'
            $table->string('entity_type')->nullable(); // Polymorphic type
            $table->uuid('entity_id')->nullable();   // Polymorphic ID
            $table->decimal('prediction_score', 5, 2); // 0.00 to 100.00
            $table->json('prediction_output')->nullable(); // Reasons, LLM output, variables
            $table->enum('status', ['pending', 'completed', 'failed'])->default('completed');
            $table->timestamps();

            $table->foreign('company_id')->references('id')->on('companies')->nullOnDelete();
            $table->index(['model_name', 'status']);
            $table->index(['entity_type', 'entity_id']);
        });

        // ── AI Conversations (context/sessions for chatbot) ──
        Schema::create('ai_conversations', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('company_id')->nullable();
            $table->uuid('conversation_id')->nullable(); // Links to an omnichannel conversation if applicable
            $table->string('session_id')->index(); // web / sandbox session
            $table->text('context_summary')->nullable(); // Running summary of what has been discussed
            $table->integer('tokens_used')->default(0);
            $table->json('metadata')->nullable(); // Additional params
            $table->timestamps();

            $table->foreign('company_id')->references('id')->on('companies')->nullOnDelete();
            $table->foreign('conversation_id')->references('id')->on('conversations')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ai_conversations');
        Schema::dropIfExists('ai_predictions');
    }
};
