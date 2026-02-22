<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('notepads', function (Blueprint $table) {
            $table->longText('ai_source_text')->nullable()->after('content');
            $table->longText('ai_summary')->nullable()->after('ai_source_text');
        });
    }

    public function down(): void
    {
        Schema::table('notepads', function (Blueprint $table) {
            $table->dropColumn(['ai_source_text', 'ai_summary']);
        });
    }
};

