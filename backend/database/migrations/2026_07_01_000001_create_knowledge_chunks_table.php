<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * REDP — RAG Knowledge Base
 * Stores embedded chunks of company knowledge (documents, SOPs, policies,
 * FAQs, uploaded files) for retrieval-augmented, grounded, cited answers.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('knowledge_chunks', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('source_type')->index();      // document|policy|sop|faq|manual|upload
            $table->string('source_id')->nullable();      // id of the origin row (e.g. documents.id)
            $table->string('source_ref')->nullable();     // display name / title / url for citation
            $table->string('title');
            $table->longText('content');
            $table->longText('embedding');                // JSON array of floats (L2-normalized)
            $table->unsignedInteger('chunk_index')->default(0);
            $table->uuid('tenant_id')->nullable()->index();
            $table->json('metadata')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('knowledge_chunks');
    }
};
