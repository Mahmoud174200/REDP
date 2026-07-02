<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('project_media', function (Blueprint $table) {
            $table->string('model_3d_status')->nullable()->after('caption');
            $table->text('model_3d_url')->nullable()->after('model_3d_status');
            $table->string('tripo_task_id')->nullable()->after('model_3d_url');
            $table->text('tripo_error_msg')->nullable()->after('tripo_task_id');
            $table->timestamp('model_generated_at')->nullable()->after('tripo_error_msg');
        });
    }

    public function down(): void
    {
        Schema::table('project_media', function (Blueprint $table) {
            $table->dropColumn([
                'model_3d_status',
                'model_3d_url',
                'tripo_task_id',
                'tripo_error_msg',
                'model_generated_at',
            ]);
        });
    }
};
