<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('challenge_template_likes', function (Blueprint $table) {
            $table->id();

            $table->foreignId('template_id')
                ->constrained('challenge_templates')
                ->cascadeOnDelete();

            $table->foreignId('user_id')
                ->constrained('users')
                ->cascadeOnDelete();

            $table->timestamps();

            // 유저는 같은 템플릿에 1번만 좋아요 가능
            $table->unique(['template_id', 'user_id']);

            $table->index(['template_id']);
            $table->index(['user_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('challenge_template_likes');
    }
};
