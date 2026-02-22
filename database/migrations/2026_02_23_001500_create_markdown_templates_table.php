<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('markdown_templates', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->foreignId('owner_id')->constrained('users')->cascadeOnDelete();
            $table->string('title');
            $table->text('description')->nullable();
            $table->longText('template_text');
            $table->enum('visibility', ['private', 'public', 'unlisted'])->default('private')->index();
            $table->boolean('is_active')->default(true)->index();
            $table->unsignedInteger('usage_count')->default(0);
            $table->timestamps();

            $table->index(['owner_id', 'updated_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('markdown_templates');
    }
};
