<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('markdown_template_likes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('template_id')->constrained('markdown_templates')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['template_id', 'user_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('markdown_template_likes');
    }
};
